# ###############################################################################
# version:          R1.3.1                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    11 Dec 2019                                                 #
# property of:      JRC                                                         #
# purpose:          library containing the functions for trend handler          #
#             --------------------------------------------------                #
# last edit:        23 Feb 2021                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################
from src.apps.c3sf4p.read_raster import RasterDataset
import os
import numpy as np
from joblib import Parallel, delayed
from src.apps.c3sf4p.pytrend.utilities import par_trend


class TrendClass(object):
    def __init__(self, file_list, product, save_path, water_mask, coordinates=None,
                 njobs=10, partitions=10, mann_kendal=True):

        if coordinates is None:
            self.zc = [-90., 90., -180., 180.]
        else:
            self.zc = coordinates

        self.is_mk = mann_kendal
        self.n_jobs = njobs
        self.p = partitions
        self.fl = file_list
        self.prod = product
        # TODO
        # Add a line to get the size of the matrix
        rd = RasterDataset(file_list[0])
        self.size = rd.get_data(product, zone_coord=self.zc).size
        self.shape = rd.get_data(product, zone_coord=self.zc).shape
        self.step = self.size // np.square(self.p)

        if self.size % float(np.square(self.p)) == 0:
            self.num_loops = self.size / self.step
        else:
            self.num_loops = (self.size // self.step) + 1

        self.head = rd.sensor_name + '-' + self.prod
        self.slopes = self.wm = None
        self.count = len(self.fl)
        self.dt = []
        self.path_data = save_path + 'DATA/'
        self.path_slopes = save_path + 'TMP_Slopes/'
        self.wm = water_mask

        self.calc_data = False
        if os.path.exists(self.path_data):
            for n in range(np.square(self.p)):
                if not os.path.exists(self.path_data + str(n).zfill(2) + '.npy'):
                    self.calc_data = True
                    break
        else:
            os.makedirs(self.path_data)
            self.calc_data = True

        if not os.path.exists(self.path_slopes):
            os.makedirs(self.path_slopes)

        self.path2save = save_path

    def start_loop(self):
        self.slopes = np.full(self.size, fill_value=np.nan)
        # xset = range(np.square(self.p))

        if self.calc_data:
            print('getting data')
            self._get_data()
            print('done')
        else:
            for ind_f, f in enumerate(self.fl):
                rd = RasterDataset(f)
                self.dt.append(rd.date)

        foo = {'p': self.p,
               'size': self.size,
               'wm': self.wm.flatten(),
               'dt': self.dt,
               'path2data': self.path_data,
               'path2slopes': self.path_slopes,
               'head': self.head,
               'is_mk': self.is_mk,
               'step': self.step,
               'nloops': self.num_loops}

        # self.n_jobs = 1
        print('start par')
        Parallel(n_jobs=self.n_jobs)(delayed(par_trend)(i, foo) for i in range(self.num_loops))
        # Parallel(n_jobs=1)(delayed(par_trend)(i, foo) for i in range(self.num_loops))
        print('done par')

        whole_slopes = np.zeros
        whole_interc = np.zeros
        whole_pvalue = np.zeros

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
        get_data = False
        for n in range(self.num_loops):
            dec_name = self.path_data + self.head + '-' + str(n).zfill(2) + '.npy'
            if not os.path.exists(dec_name):
                get_data = True
                break
            # else:
            #     print(os.path.basename(dec_name), 'EXISTS!')
        for ind_f, f in enumerate(self.fl):
            rd = RasterDataset(f)
            self.dt.append(rd.date)
        if get_data:
            # main_data = np.zeros([self.count, self.size[0], self.size[1]])
            main_data = np.zeros([self.size, self.count], dtype='float')
            for ind_f, f in enumerate(self.fl):
                rd = RasterDataset(f)
                # main_data[ind_f, :, :] = rd.get_data(self.prod, zone_coord=self.zc)
                main_data[:, ind_f] = rd.get_data(self.prod, zone_coord=self.zc).flatten()

            for n in range(self.num_loops):
                dec_name = self.path_data + self.head + '-' + str(n).zfill(2) + '.npy'
                if not os.path.exists(dec_name):
                    i0 = self.step * n
                    i1 = (n + 1) * self.step
                    if n + 1 == self.num_loops:
                        i1 = None
                    d = main_data[i0:i1, :]
                    np.save(dec_name, d)
