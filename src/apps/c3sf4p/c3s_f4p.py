"""
# ###############################################################################
# version:          R1.0.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    23 Feb 2021                                                 #
# property of:      JRC                                                         #
# purpose:          Main class that links web interface and function libraries  #
# last edit:        today => under development                                  #
#  --------------------------------------------------------------------------   #
#  --------------------------------------------------------------------------   #
#                                                                               #
#  This class represents the entry point to all the F4P functionalities         #
#                                                                               #
#  --------------------------------------------------------------------------   #
#  --------------------------------------------------------------------------   #
# ###############################################################################
"""
import os
from src.lib.python.image_proc.read_write_raster import RasterDataset
import numpy as np
from src.apps.c3sf4p.pytrend import TrendStarter as Ts
from inspect import currentframe, getframeinfo
import src.apps.c3sf4p.f4p_utilities.stats_funcions as sf
import psutil
from joblib import Parallel, delayed


class Fitness4Purpose(object):
    """
    Entry point to trigger the c3sf4p capabilities
    """
    def __init__(self, file_list, ecv, band_names, region_name='', region_coordinates=None, dbg=False):
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

        :param dbg:                 enables debug mode

        """
        self.lof = file_list
        self.ecv = ecv
        self.bands = band_names
        self.zn = region_name
        self.zc = region_coordinates
        self.dbg = dbg
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
            print('Generating the scatter plot for testing purposes')
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

        # notice that if self.n_cores = 1 the parallel statement behave like a normal for loop
        out = Parallel(n_jobs=self.n_cores)(delayed(sf.par_hov)(filelist, band_name, k) for k in x_set)

        # unrol the output of parallel computation
        for j in x_set:

            ii = int(out[j][0][1])
            d = out[j][0][0]
            data[:, ii] = d
            rd = RasterDataset(filelist[j])
            x_tick_labels.append(rd.date)

        hov_matrix = np.array(data)

        y_tick_spaces = [np.linspace(self.zc[0], self.zc[1], 10)]

        y_tick_labels = []
        for tick in y_tick_spaces:
            if tick < 0:
                card = 'S'
            else:
                card = 'N'

            y_tick_labels.append(str("{:.1f}".format(tick)) + '$^\circ$' + card)

        sens_name = RasterDataset(filelist[0]).sensor_code

        """from here one must call a routine to render the plot, to be seen with Jurriaan"""

        # for testing the function call a matplotlib function to plot data
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            print(info)
            print('Generating latitudinal average plot for testing purposes')
            from src.apps.c3sf4p.f4p_plot_functions.plot_hovmoller import graphical_render

            graphical_render(hov_matrix, band_name, sensor_name=sens_name, x_tick_labels=x_tick_labels,
                             y_tick_labels=y_tick_labels)

    def trend_analysis(self, num_jobs=10, num_partitions=10):
        """
        this function implements the analysis of trend given a timeseries of data. The Analysis is performed in
        compliance with the Mann Kendall method [TODO...to be completed...]
        :param num_jobs:
        :param num_partitions:
        :return:
        """
        '''
        freq2number correlates the frequency string with a integer number which express the number of 
        observation in one year. The numbers answer the question: How many files in one year?  
        '''
        freq2number = {'2pday': 730,
                       'e15minute': 4*24*365,
                       'e1cgldekad': 3*12,
                       'e1day': 365,
                       'e1decad': 3*12,
                       'e1modis16day': 23,
                       'e1modis8day': 46,
                       'e1month': 12,
                       'e1motu7day': 4*12,
                       'e1pentad': 6*12,
                       'e1year': 1,
                       'e30minute': 24*2*365,
                       'e3hour': 24/3 * 365,
                       'e3month': 4,
                       'e6month': 2}

        for nd in range(len(self.lof)):
            rd0 = RasterDataset(self.lof[nd][0])
            sn = rd0.sensor_code
            try:
                frequency = freq2number[rd0.frequency]
            except KeyError:
                frequency = None
                msg = 'frequency not allowed'
                print(msg)
                exit()

            mk_tag = 'MK'
            trend_flag = 'Mann-Kendall-Trend'
            date = rd0.year + '-' + RasterDataset(self.lof[nd][-1]).year

            # TODO define a trend name to be saved in a predefined folder-structure to not repeat the calc
            #  when done once

            trend_path = './'
            tmp_path = trend_path + 'TMP' + os.sep
            trend_name = trend_path + ''

            # todo this parameter triggers the calc of trend in a sub-region of the nominal geographical coverage of
            #  the product
            try_reshape = False

            #  this parameter triggers the actual calculation, if it is already run once i.e. trend_name exists, then
            #  do cal is set to False
            do_calc = True

            if try_reshape:
                if os.path.exists(trend_name):
                    do_calc = False
            if os.path.exists(trend_name):
                do_calc = False

            if do_calc:
                if not os.path.exists(tmp_path):
                    try:
                        os.makedirs(tmp_path)
                    except IOError:
                        msg = 'Cannot write on ' + tmp_path + 'please check. programm exit!'
                        raise Exception(msg)

                tc = Ts.TrendClass(self.lof[nd], self.bands[nd], tmp_path, coordinates=self.zc, njobs=num_jobs,
                                   partitions=num_partitions, freq=frequency)
                slopes, intercepts, pvalues = tc.start_loop()

                if os.path.exists(tmp_path):
                    rm_dir = os.removedirs(tmp_path)

                rdw = RasterDataset(trend_name)

                rdw.write_nc([slopes, intercepts, pvalues], ['slopes', 'intercepts', 'pvalues'],
                             fill_value=np.nan, scale_factor=1, offset=0, dtype='float', zc=self.zc, mode='w')

            else:
                rd = RasterDataset(trend_name)

                slopes = rd.get_data('slopes', subsample_coordinates=self.zc)
                pvalues = rd.get_data('pvalues', subsample_coordinates=self.zc)

            slopes[pvalues > 0.05] = np.nan

            pf.plot_map(slopes, sensor_name=sn, product=self.product[nd], ecv_type=self.ecv, plot_type='Trend',
                        zone_name=self.zn, zone_coord=self.zc, is_save=is_save, is_show=is_show,
                        is_mk=do_mk, water_mask=self.water_mask, str_output_fname=save_name)