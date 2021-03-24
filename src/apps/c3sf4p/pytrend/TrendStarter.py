"""
# ###############################################################################
# version:          R1.0.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    08 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          library containing the functions for trend handler          #
#             --------------------------------------------------                #
# last edit:        under development                                           #
#  *************************************************************************    #
# ###############################################################################
"""
from src.apps.c3sf4p.read_raster import RasterDataset
import os
import numpy as np
from joblib import Parallel, delayed
from src.apps.c3sf4p.pytrend.utilities import par_trend
from inspect import currentframe, getframeinfo


class TrendClass(object):
    def __init__(self, file_list, product, save_path, coordinates=None, njobs=10, partitions=10, freq=12, dbg=False):

        self.dbg = dbg
        self.logfile = None
        self.frequency = freq
        if self.dbg:
            from datetime import datetime
            self.logfile = './test/trend_test' + str(datetime.today()) + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = ' __init__ class'
            self._report(info, tag)

        if coordinates is None:
            self.zc = [-90., 90., -180., 180.]
        else:
            self.zc = coordinates

        self.n_jobs = njobs
        self.p = partitions
        self.fl = file_list
        self.prod = product
        self.mask = None

        # Add a line to get the size of the matrix
        rd = RasterDataset(file_list[0])
        self.size = rd.get_data(product, subsample_coordinates=self.zc).size
        self.shape = rd.get_data(product, subsample_coordinates=self.zc).shape
        self.step = self.size // np.square(self.p)

        if self.size % float(np.square(self.p)) == 0:
            self.num_loops = self.size / self.step
        else:
            self.num_loops = (self.size // self.step) + 1

        self.head = rd.sensor_code + '-' + self.prod
        # self.slopes = None
        self.count = len(self.fl)
        self.dt = []
        self.path_data = save_path + 'DATA/'
        self.path_slopes = save_path + 'TMP_Slopes/'

        if not os.path.exists(self.path_slopes):
            os.makedirs(self.path_slopes)

        self.path2save = save_path

    def start_loop(self):
        """
        main entry point of trend calculation
        :return:
        """
        fid = None
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = ' trend loop start!'
            self._report(info, tag)

        # self.slopes = np.full(self.size, fill_value=np.nan)


        """"""
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' getting data, unpack them and save on local disk'
            self._report(info, tag)
        """"""
        self._get_data()
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' done getting data'
            self._report(info, tag)

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' Starting parallel loop for trend calculation'
            self._report(info, tag)
            if not os.path.exists(self.logfile):
                fid = open(self.logfile, 'w')
            else:
                fid = open(self.logfile, 'r+')

        foo = {'p': self.p,
               'size': self.size,
               'dt': self.dt,
               'data_ mask': self.mask,
               'path2data': self.path_data,
               'path2slopes': self.path_slopes,
               'head': self.head,
               'step': self.step,
               'nloops': self.num_loops,
               'frequency': self.frequency,
               'fid': fid,
               'dbg': self.dbg}

        Parallel(n_jobs=self.n_jobs)(delayed(par_trend)(i, foo) for i in range(self.num_loops))

        if self.dbg:
            fid.close()
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' End parallel loop'
            self._report(info, tag)

        whole_slopes = 0
        whole_interc = 0
        whole_pvalue = 0

        if self.dbg:
            fid.close()
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' Unfolding parallel output'
            self._report(info, tag)

        for n in range(self.num_loops):
            sl_name = self.path_slopes + self.head + '-' + str(n).zfill(2) + '.npy'
            # print sl_name, os.path.exists(sl_name)
            if n == 0:
                whole_slopes = np.load(sl_name)[0]
                whole_interc = np.load(sl_name)[1]
                whole_pvalue = np.load(sl_name)[2]

            else:
                whole_slopes = np.hstack([whole_slopes, np.load(sl_name)[0]])
                whole_interc = np.hstack([whole_interc, np.load(sl_name)[1]])
                whole_pvalue = np.hstack([whole_pvalue, np.load(sl_name)[2]])

        slopes = np.reshape(whole_slopes, self.shape)
        interc = np.reshape(whole_interc, self.shape)
        pvalue = np.reshape(whole_pvalue, self.shape)

        return slopes, interc, pvalue

    def _get_data(self):
        """
        Load all the element of the time series flatten them, pile them in time and save them in chunks.
        the main_data matrix will contains the entire timeseries, the first dimension of the matrix represent the size
        of each element of the series (i.e. the TOTAL number of pixels: lat x lon) while the second represents the
        time (i.e. the number of element of the series).
        In order to allow the trend calculation to be be performed in parallel, the main_data matrix will be divided
        into sub-samples, accordingly to the njobs and partitions parameter, the default amount of chunks is 100
        and in general this number depends on the two previous parameters as following: nchunks = njobs x partitions

        self.mask is used to identify possible zone to be excluded by trend calculation (and thus speed up the process)
        in particular, those pixels with a zero value are relative to no-retrieval for the entire series.
        (like water body in case of vegetation index)
        :return:
        """

        self.mask = np.zeros_like(self.shape, dtype='uint8')
        main_data = np.zeros([self.size, self.count], dtype='float')
        for ind_f, f in enumerate(self.fl):
            rd = RasterDataset(f)
            self.dt.append(rd.date)

            main_data[:, ind_f] = rd.get_data(self.prod, subsample_coordinates=self.zc).flatten()
            mask_element = rd.get_data(self.prod, subsample_coordinates=self.zc)
            mask_element[~np.isnan(mask_element)] = 1
            mask_element[np.isnan(mask_element)] = 0
            self.mask += mask_element

        self.mask[self.mask > 1] = 1

        for n in range(self.num_loops):
            dec_name = self.path_data + self.head + '-' + str(n).zfill(2) + '.npy'
            if not os.path.exists(dec_name):
                i0 = self.step * n
                i1 = (n + 1) * self.step
                if n + 1 == self.num_loops:
                    i1 = None
                d = main_data[i0:i1, :]
                np.save(dec_name, d)

    def _report(self, info, tag):
        if not os.path.exists(self.logfile):
            fid = open(self.logfile, 'w')
        else:
            fid = open(self.logfile, 'r+')

        msg = info + ': ' + tag + '\n'
        fid.writelines(msg)
        fid.close()
