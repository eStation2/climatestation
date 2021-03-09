"""
# ###############################################################################
# version:          R1.0                                                        #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    23 Feb 2021                                                 #
# property of:      JRC                                                         #
# purpose:          Main class that links web interface and function libraries  #
#             --------------------------------------------------                #
# last edit:        in development                                              #
#  --------------------------------------------------------------------------   #
#  --------------------------------------------------------------------------   #
#                                                                               #
#  This class represents the entry point to all the F4P functionalities         #
#                                                                               #
#  --------------------------------------------------------------------------   #
#  --------------------------------------------------------------------------   #
# ###############################################################################
"""

from src.apps.c3sf4p.read_raster import RasterDataset
import numpy as np
from src.apps.c3sf4p.pytrend.TrendStarter import TrendClass
from inspect import currentframe, getframeinfo
import src.apps.c3sf4p.f4p_utilities.stats_funcions as sf
import psutil
from joblib import Parallel, delayed


class Fitness4Purpose(object):
    """
    Entry point to trigger the c3sf4p capabilities
    """
    def __init__(self, file_list, ecv, band_names, region_name='', region_coordinates=None):
        """
        :param file_list:           LIST of Strings: file or list of files to analyse,
                                    this parameter should be specified as a list-of-lists, where len(file_list)
                                    represents the number of different datasets (i.e. different product providers) to be
                                    considered in the analysis.

                                    example: 3 different datasets each one with n elements

                                    file_list = [[full_name-1.1, full_name-1.2, ..., fill-name-1.n],
                                                [full_name-2.1, full_name-2.2, ..., fill-name-2.n],
                                                [full_name-3.1, full_name-3.2, ..., fill-name-3.n]]

        :param ecv:                 STRING: ecv type as defined in GCOS it is assumed that every element of the
                                            file_list parameter are all of the same ecv-kind

        :param band_names:          LIST of STRING: band name for each dataset in file_list,
                                    where len(band_names) equals the number of different datasets
                                    (i.e. different product providers)

                                    example: 3 different datasets (same example as for file_list)

                                    band_names = [band_name-1, band_name-2, band_name-3]


        :param region_name:         STRING: Ancillary parameter name of the region to which the raster input corresponds
                                    This parameter is the name associated to region_coordinates parameter

        :param region_coordinates:  LIST: Ancillary parameter, represents the boundary coordinates in case the analysis
                                    is foreseen in a sub-region of the original extension. This parameter should be
                                    specified as a list of 4 cardinal points (floating numbers) in the folloing order:
                                    [S, N, W, E] where:

                                    S = Southern coordinate in decimal degree with sign [-90.0,..., 90.0]
                                    N = Northern coordinate in decimal degree with sign [-90.0,..., 90.0]
                                    W = Western coordinate in decimal degree with sign  [-180.0,..., 180.0]
                                    E = Eastern coordinate in decimal degree with sign  [-180.0,..., 180.0]

                                    In this convention the following condition should always be verified: S<N and W<E
                                    the tools also implements this test, and if wrong it throws an exception

        """
        self.lof = file_list
        self.ecv = ecv
        self.bands = band_names
        self.zn = region_name
        self.zc = region_coordinates
        self.dbg = True
        self.n_cores = psutil.cpu_count(logical=False)
        self._check_input()

    def _check_input(self):
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('start check input function')
        try:
            assert len(self.lof) == len(self.bands)
        except AssertionError:
            print('len(file_list) != len(band_names) Please check the class initialization! EXIT')
            exit()

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Numbero of datasets=', len(self.lof))

        if self.zn is None:
            # set default value
            self.zn = 'Africa'
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Region name=', self.zn)

        if self.zc is not None:
            try:
                assert self.zc[0] < self.zc[1]
            except AssertionError:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                print(info)
                print('region_coordinate parameter error! South coordinate '
                      '(region_coordinate[0]) cannot be greater than North coordinate (region_coordinate[1]): EXIT')
                exit()
            try:
                assert self.zc[2] < self.zc[3]
            except AssertionError:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                print(info)
                print('region_coordinate parameter error! West coordinate '
                      '(region_coordinate[2]) cannot be greater than East coordinate (region_coordinate[3]): EXIT!')
                exit()

    def scatter_plot(self):
        """
        This function is the entry point for generating the scatter plot diagram.
        In general this function expects two and only two datasets, each dataset (i.e. len(file_list)=2)
        each file_list[n] with n=0,1 must contains the same number of elements
        :return:
        """
        fig_title = None
        data_labels = []  # data labels
        data = []  # initialize main data matrix

        n_dataset = len(self.lof)

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Starting Scatter Plot function', len(self.lof))

        # checking parameters:
        try:
            assert n_dataset == 2
        except AssertionError:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Two datasets are foreseen by the scatter plot function, got ', len(self.lof), 'EXIT!')
            exit()
        try:
            assert len(self.lof[0]) == len(self.lof[1])
        except AssertionError:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('The same number of files is expected for each dataset, got instead', len(self.lof[0]),
                  'files for dataset-0 and ', len(self.lof[1]), 'files for dataset-1, please check. EXIT!')
            exit()
        dates = []
        for nd in range(n_dataset):
            data.append([])
            for fname in self.lof[nd]:
                rd = RasterDataset(fname)
                sensor_name = rd.sensor_code
                data_labels.append(sensor_name + '  ' + self.bands[nd])
                dates.append(rd.date)
                fig_title = 'Region: ' + self.zn + '; Date: ' + rd.date
                _d = rd.get_data(self.bands[nd])
                data[nd].append(_d)

        """spatial consistency: i.e. consider only the cells which have a valid retrieval (not nan) for both datasets"""
        data = sf.get_spatial_consistency(data)

        """from here one must call a routine to render the plot, to be seen with Jurriaan"""

        # for testing the function call a matplotlib function to plot data
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Generating the plot for testing purposes')
            from src.apps.c3sf4p.f4p_plot_functions.plot_scatter import graphical_render

            graphical_render(data[0], data[1], x_label=data_labels[0], y_label=data_labels[1], figure_title=fig_title)

    def latitudinal_average_plot(self):
        """
        This function is the entry point for generating the latitudinal average diagram (also known as howmoller plot).
        In general this function expects a full timeseries for a single dataset, however the function can also be
        extended to multiple dataset.
        :return:
        """

        filelist = list(self.lof[0])
        band_name = self.bands[0]

        x_tick_labels = []
        rd0 = RasterDataset(filelist[0])
        sn_0 = rd0.sensor_code
        # shape = rd0.get_data(self.bands[0], subsample_coordinates=self.zc).shape
        sz = rd0.get_data(self.bands[0]).shape[1]
        x_set = range(len(filelist))

        # initialise data matrix to host hovmoller calculation
        data = np.zeros([sz, len(filelist)])
        #stop
        # out = Parallel(n_jobs=self.n_cores)(delayed(sf.par_hov)(filelist, band_name, k, 0,
        #                                                 n_land, is_anomaly, is_absolute, self.zc, self.mask,
        #                                                 self.lc_val, self.lc_type, tfl=tfl) for k in x_set)


