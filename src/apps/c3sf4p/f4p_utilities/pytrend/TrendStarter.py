"""
# ###############################################################################
# version:          R1.0.1                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    08 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          library containing the functions for trend handler          #
#             --------------------------------------------------                #
# last edit:        under development                                           #
#  *************************************************************************    #
# ###############################################################################
Log v-1.0.1:
    - June 2021 implemented a fix for joblib under docker (to be tested)
    - June 2021 rewritten self._get_data method (should be faster now)
"""
from lib.python.image_proc.read_write_raster import RasterDatasetCS
import os
import numpy as np
from joblib import Parallel, delayed
from apps.c3sf4p.f4p_utilities.pytrend.MK_trend import par_trend
from inspect import currentframe, getframeinfo
import psutil
from scipy.ndimage import zoom


class TrendClass(object):
    def __init__(self, file_list, product, save_path, tmp_folder, coordinates=None, njobs=10, partitions=10, freq=12,
                 dbg=False, logfile=None, threshold=0.05, is_fast=False):
        """
        @param file_list:   type=list: list of files (full path) representing a timeseries of data (seasonal data) for
                            which calculating the Mann-Kendall trend

        @param product:     type=string: Required band (notice in case of tiff file, this parameter will be used only
                            as label in the plot display)

        @param save_path:   type=string: Points to the temporary directory dedicated to data splitting, to perform
                            parallel calculation (joblib) and lower the amount of occupied RAM.

        @param tmp_folder:  type=str: path to temporary folder to be used by the joblib library instead of its default
                            because of docker

        @param coordinates: type=list: Optional Subregion bounding box. the list has to be provided as [S, N, W, E],
                            each element of the list represent a cardinal point of the bounding box, expressed in deg

        @param njobs:       type=int number of independent jobs for parallel computation

        @param partitions:  type=int Together with njobs parameter determine the number of chunks in which the input
                            timeseries will be splitted. As an example if the default values holds, the total number
                            of chunks will be 100, i.e. holds the rule: number-of-chunks = num_jobs * num_partitions

        @param freq:        type=int frequency of the timeseries i.e. how many observation are available per year,
                            the default value of 12 refers to data-series with 12 observations per year, i.e. monthly
                            data

        @param dbg:         type=bool, True or False, enables debug mode

        @param logfile:     type=string full path to logfile where to report the status of debug analysis

        @param threshold    type=float: threshold for defining when the p-value determines a value which is
                                        statistically significant.
                                        Default value = 0.05
                                        The p-value indicates the evidence against the null hypothesis, for instance for
                                        a p-value of 0.05 (i.e. 5%) there is a 5% of probability to commit a mistake in
                                        rejectiong the null hypothesis, or in other words, there is a 95% of probability
                                        that the null hypothesis is False (i.e. the data have a trend)
                                        Any p-value > threshold (common factor is 0.05) is considered NOT statistically
                                        significant, i.e. the evidence against the null hypothesis is weak.

        @param is_fast      type=bool: enables fast calculation, downsample the spatial resolution to 1/20
        """

        self.dbg = dbg
        self.tmp_joblib = tmp_folder
        if self.dbg:
            self.logfile = logfile
            if self.logfile is None:
                from datetime import datetime
                self.logfile = './test/trend_test_' + str(datetime.today()) + '.log'
        self.frequency = freq
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = ' __init__ of the class'
            self._log_report(info, tag)

        if coordinates is None:
            self.zc = RasterDatasetCS(self.fl[0]).native_zc
        else:
            self.zc = coordinates

        self.n_jobs = njobs
        self.p = partitions
        self.fl = file_list
        self.prod = product
        self.mask = None
        self.is_fast = is_fast
        self.zf = 1./20   # zoom factor

        # Add a line to get the size of the matrix
        rd = RasterDatasetCS(file_list[0])
        _d = rd.get_data(product, subsample_coordinates=self.zc)
        if self.is_fast:
            _d = zoom(_d, self.zf, order=0)

        self.size = _d.size
        self.shape = _d.shape
        self.step = self.size // np.square(self.p)

        if self.size % float(np.square(self.p)) == 0:
            self.num_loops = int(self.size / self.step)
        else:
            self.num_loops = int((self.size // self.step) + 1)

        if self.prod is not None:
            self.head = rd.sensor_code + '-' + self.prod
        else:
            self.head = rd.sensor_code
        # self.slopes = None
        self.count = len(self.fl)
        self.dt = []
        self.path_data = save_path + 'DATA/'
        self.path_slopes = save_path + 'TMP_Slopes/'

        if not os.path.exists(self.path_slopes):
            os.makedirs(self.path_slopes)
        if not os.path.exists(self.path_data):
            os.makedirs(self.path_data)

        self.path2save = save_path
        self.threshold = threshold

    def start_loop(self):
        """
        main entry point of trend calculation
        :return:
        """
        fid = None
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = ' trend loop start!'
            self._log_report(info, tag)

        # self.slopes = np.full(self.size, fill_value=np.nan)

        """"""
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' getting data, unpack them and save on local disk'
            self._log_report(info, tag)
        """"""
        self._get_data()
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' done getting data'
            self._log_report(info, tag)

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' Starting parallel loop for trend calculation'
            self._log_report(info, tag)
            if not os.path.exists(self.logfile):
                fid = open(self.logfile, 'w')
            else:
                fid = open(self.logfile, 'r+')

        foo = {'p': self.p,
               'size': self.size,
               'dt': self.dt,
               'data_mask': self.mask,
               'path2data': self.path_data,
               'path2slopes': self.path_slopes,
               'head': self.head,
               'step': self.step,
               'nloops': self.num_loops,
               'frequency': self.frequency,
               'fid': fid,
               'dbg': self.dbg,
               'threshold': self.threshold}

        Parallel(n_jobs=self.n_jobs, temp_folder=self.tmp_joblib)(delayed(par_trend)(i, foo)
                                                                  for i in range(self.num_loops))

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' End parallel loop'
            self._log_report(info, tag)

        whole_slopes = 0
        whole_interc = 0
        whole_pvalue = 0

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' Unfolding parallel output'
            self._log_report(info, tag)

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
        sqmask = np.reshape(self.mask, self.shape)

        slopes[sqmask == 0] = np.nan
        interc[sqmask == 0] = np.nan
        pvalue[sqmask == 0] = np.nan

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

        self.mask = np.zeros(self.size, dtype='uint8')

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = ' Building Temporal index array'
            self._log_report(info, tag)

        for f in self.fl:
            self.dt.append(os.path.basename(f).split('_')[0])

        max_available_ram = psutil.virtual_memory().available
        byte_matrix = self.size * self.count * 8  # 8 bytes per float

        if byte_matrix < max_available_ram / 2:  # keep enough room for other applications ==> do not freeze the pc...
            '''
            In this case the full dta array can be safely loaded into RAM before split it into chunks
            '''
            main_data = np.zeros([self.size, self.count], dtype='float')
            for ind_f, f in enumerate(self.fl):
                rd = RasterDatasetCS(f)
                # self.dt.append(rd.date)
                _d = rd.get_data(self.prod, subsample_coordinates=self.zc)

                if self.is_fast:
                    _d = zoom(_d, self.zf, order=0)

                main_data[:, ind_f] = _d.flatten()
                mask_element = _d
                mask_element[~np.isnan(mask_element)] = 1
                mask_element[np.isnan(mask_element)] = 0
                mask_element = mask_element.astype('uint8')
                # print(mask_element.shape)
                self.mask += mask_element.flatten()

            # split whole data array in chunks and save them

            for n in range(self.num_loops):
                dec_name = self.path_data + self.head + '-' + str(n).zfill(2) + '.npy'
                if not os.path.exists(dec_name):
                    i0 = self.step * n
                    i1 = (n + 1) * self.step
                    if n + 1 == self.num_loops:
                        i1 = None
                    d = main_data[i0:i1, :]
                    np.save(dec_name, d)
        else:
            '''
            else the RAM is not enough to allow to load the full array into memory before chunk it
            this method is way too slow.
            '''
            # TODO: check if it is still meaningful to have the trend feature also with a (very) poor pc architecture.
            for f in self.fl:
                rd = RasterDatasetCS(f)
                _d = rd.get_data(self.prod, subsample_coordinates=self.zc)
                if self.is_fast:
                    _d = zoom(_d, self.zf, order=0)

                mask_element = _d
                mask_element[~np.isnan(mask_element)] = 1
                mask_element[np.isnan(mask_element)] = 0
                mask_element = mask_element.astype('uint8')
                self.mask += mask_element.flatten()
            for n in range(self.num_loops):
                dec_name = self.path_data + self.head + '-' + str(n).zfill(2) + '.npy'
                if not os.path.exists(dec_name):
                    dchunk = 0
                    d = np.array(0)
                    i0 = self.step * n
                    i1 = (n + 1) * self.step
                    if n + 1 == self.num_loops:
                        i1 = None
                    for f in self.fl:
                        rd = RasterDatasetCS(f)
                        _d = rd.get_data(self.prod, subsample_coordinates=self.zc)
                        if self.is_fast:
                            _d = zoom(_d, self.zf, order=0)

                        dtmp = _d.flatten()[i0:i1]
                        d = np.hstack([dchunk, dtmp])
                    np.save(dec_name, d)

    def _log_report(self, info, tag):
        if not os.path.exists(self.logfile):
            fid = open(self.logfile, 'w')
        else:
            fid = open(self.logfile, 'r+')

        msg = info + ': ' + tag + '\n'
        fid.writelines(msg)
        fid.close()
