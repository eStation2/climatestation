"""
# ###############################################################################
# version:          R1.0.1                                                      #
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
Log v-1.0.1:
    - June 2021 added _check_data to ensure that all the data within a timeseries have the same dimension
    - June 2021 added hist-cdf method to display histograms of data
    - June 2021 completely re-written version of Trend analysis, hopefully should be faster
    - June 2021 added some feature to get initial optional parameters (from __init__) in the case that
                those are not provided
    - June 2021 implemented a fix for joblib under docker (to be tested)

"""
import os
from lib.python.image_proc.read_write_raster import RasterDatasetCS, write_nc
import numpy as np
from apps.c3sf4p.f4p_utilities.pytrend import TrendStarter as Ts
from inspect import currentframe, getframeinfo
import apps.c3sf4p.f4p_utilities.stats_funcions as sf
import psutil
from joblib import Parallel, delayed
from datetime import datetime
from config import es_constants
from lib.python import functions


class Fitness4Purpose(object):
    """
    Entry point to trigger the c3sf4p capabilities
    """
    def __init__(self, file_list, band_names, ecv=None, region_name='', region_coordinates=None, njobs=None, dbg=False):
        """
        @param file_list:           LIST of Strings: file or list of files to analyse,
                                    this parameter should be specified as a list-of-lists, where len(file_list)
                                    represents the number of different datasets (i.e. different product providers) to be
                                    considered in the analysis.

                                    example: 3 different datasets each one with n elements

                                    file_list = [[full_name-1.1, full_name-1.2, ..., fill-name-1.n],
                                                [full_name-2.1, full_name-2.2, ..., fill-name-2.n],
                                                [full_name-3.1, full_name-3.2, ..., fill-name-3.n]]

        @param ecv:                 STRING: ecv type as defined in GCOS it is assumed that every element of the
                                            file_list parameter are all of the same ecv-kind

        @param band_names:          LIST of STRING: band name for each sub-list relative to a dataset timeseries in
                                    file_list, where len(band_names) equals the number of different datasets
                                    (i.e. different product providers a.k.a. the number of sublist of file_list)

                                    example: 3 different datasets, i.e. 3 sub-lists (same example as for file_list)

                                    band_names = [band_name-1, band_name-2, band_name-3]

                                    where band-name-ith olds for all the elements of the sub-list ith


        @param region_name:         STRING: Ancillary parameter name of the region to which the raster input corresponds
                                    This parameter is the name associated to region_coordinates parameter. Although this
                                    parameter is not mandatory, it is anyhow advisable to provide always this
                                    information especially when the f4p_c3s.py will be put on the operative mode
                                    in the web-interface, so that if a user require a particular subregion, the
                                    graphical render of the result always displays the right indicators.

        @param region_coordinates:  LIST: Ancillary parameter, represents the boundary coordinates in case the analysis
                                    is foreseen in a sub-region of the original extension. This parameter should be
                                    specified as a list of 4 cardinal points (floating numbers) in the folloing order:
                                    [S, N, W, E] where:

                                    S = Southern coordinate in decimal degree with sign [-90.0,..., 90.0]
                                    N = Northern coordinate in decimal degree with sign [-90.0,..., 90.0]
                                    W = Western coordinate in decimal degree with sign  [-180.0,..., 180.0]
                                    E = Eastern coordinate in decimal degree with sign  [-180.0,..., 180.0]

                                    In this convention the following condition should always be verified: S<N and W<E
                                    the tools also implements this test, and if wrong it throws an exception.

                                    Like in the case of region name, although this parameter is not mandatory, it is
                                    anyhow advisable to provide always this information explicitly.
                                    In this way all the calculation will be less prone to raise an exception, especially
                                    in the cases where a subregion is required

        @param njobs:               INT: allows to force the number of jobs for the parallel computation, if the default
                                    (None) holds, this number is decided dynamically by the program. For debugging
                                    purposes it is strongly suggested to set this parameter as 1

        @param dbg:                 enables debug mode

        """
        self.lof = file_list
        self.ecv = ecv
        self.bands = band_names
        self.zn = region_name
        self.zc = region_coordinates
        self.dbg = dbg
        if self.dbg:
            njobs = 1

        if njobs is None:
            self.n_cores = psutil.cpu_count(logical=False)
            if self.n_cores <= 2:
                self.n_cores = 1
        else:
            try:
                self.n_cores = int(njobs)
            except ValueError:
                self.n_cores = 1

        self.logfile = None
        self.tmp_joblib = es_constants.es2globals['base_tmp_dir'] + '/tmp_joblib/'
        self.save_path = es_constants.es2globals['base_tmp_dir']
        functions.check_output_dir(self.tmp_joblib)
        self._check_input()

    def _check_input(self):

        rd0 = RasterDatasetCS(self.lof[0][0])

        if self.dbg:
            self.logfile = es_constants.es2globals['log_dir'] + '/check_input_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'start check-input function'
            self._log_report(info, tag)
        try:
            assert len(self.lof) == len(self.bands)
        except AssertionError:
            print('len(file_list) != len(band_names) Please check the class initialization! EXIT')
            exit()

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Number of datasets=' + str(len(self.lof))
            self._log_report(info, tag)

        if self.zn is None:
            # set default value
            self.zn = rd0.nominal_region
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Region name=' + self.zn
            self._log_report(info, tag)

        if self.zc is not None:
            try:
                assert self.zc[0] < self.zc[1]
            except AssertionError:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'ERROR: region_coordinate parameter error! South coordinate (region_coordinate[0]) cannot be ' \
                      'greater than North coordinate (region_coordinate[1]): EXIT'
                self._log_report(info, tag)
                exit()
            try:
                assert self.zc[2] < self.zc[3]
            except AssertionError:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'region_coordinate parameter error! West coordinate (region_coordinate[2]) cannot be greater ' \
                      'than East coordinate (region_coordinate[3]): EXIT!'
                self._log_report(info, tag)
                exit()
        else:
            self.zc = rd0.native_zc

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = 'end of the method. No problem found'
            self._log_report(info, tag)

    def _optimise_trend_parameters(self, chunks, jobs, index):
        """
        @param chunks   type(int) number of chunks in which the timeseries will be divided for optimising
                        parallel computation
        @param jobs     type(int) number of jobs parameter to pass to the parallel processor i.e. number of
                        simultaneous jobs (a.k.a. number of CPU)
        @param index    type(int) number of index in the general type(list) timeseries formalism

        ***************************************************************************************************************
        This check optimises the wo parameters: 'chunks' and 'jobs' accordingly to the local machine architecture.
        In particular the number of jobs is optimised in a way it never exceed the available CPU number (not logical)
        and the chunk number is optimised in a way to grantee that for each parallel cycle not more than the 70% of the
        available RAM is occupied by the trend processor.

        """

        start_chunks = chunks

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Trend Optimiser start'
            self._log_report(info, tag)

        size = RasterDatasetCS(self.lof[index][0]).get_data(self.bands[0], subsample_coordinates=self.zc).size
        ncpus = psutil.cpu_count(logical=False)
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Available number of CPU (not logical) is = ' + str(ncpus)
            self._log_report(info, tag)
        if ncpus < jobs:
            jobs = ncpus
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Rescaling number of jobs to = ' + str(jobs)
                self._log_report(info, tag)
        else:
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Number of jobs is already optimised. Setting njobs = ' + str(jobs)
                self._log_report(info, tag)

        timeseries_length = len(self.lof[index])
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                    str(getframeinfo(currentframe()).lineno))
            tag = 'total lenght of the timeseries is = ' + str(size)
            self._log_report(info, tag)

        chunk_length = size // chunks ** 2
        chunk_size = chunk_length * 8 * timeseries_length  # weight in bytes for any chunk casted as float
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                    str(getframeinfo(currentframe()).lineno))
            tag = 'Every chunks is weighting = ' + str(chunk_size/1024**3) + 'GB'
            self._log_report(info, tag)

        memory_allocated_per_loop = chunk_size * jobs
        available_memory = psutil.virtual_memory().available
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Available memory is = ' + str(available_memory/1024**3) + 'GB'
            self._log_report(info, tag)

        pct_needed_memory = np.ceil(100 * memory_allocated_per_loop / available_memory)
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Every parallel cycle is composed by ' + str(jobs) + ' number of jobs and is requiring ' + \
                  str(pct_needed_memory/1024**3) + 'GB of memory'
            self._log_report(info, tag)

        if pct_needed_memory > 70:  # 70% of available RAM can be used at most
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = "Memory for loop is too high (it's over 70% of available RAM), need to optimise the number of " \
                      "chunks in order to decrease the amount of RAM required for each parallel cycle"
                self._log_report(info, tag)

            while pct_needed_memory <= 70:
                chunks += 1
                pct_needed_memory = np.ceil(100 * size // np.square(chunks) * 8 * timeseries_length * jobs /
                                            available_memory)

            if start_chunks != chunks:
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = "Optimised number of chunks = " + str(chunks)
                    self._log_report(info, tag)

        return chunks, jobs

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
            self.logfile = es_constants.es2globals['log_dir'] + '/scatter-plot_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Starting Scatter Plot function' + str(len(self.lof)) + '==2'
            self._log_report(info, tag)

        # checking parameters:
        try:
            assert n_dataset == 2
        except AssertionError:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Two datasets are foreseen by the scatter plot function, got ' + str(len(self.lof)) + ' EXIT!'
            self._log_report(info, tag)
            exit()
        try:
            assert len(self.lof[0]) == len(self.lof[1])
        except AssertionError:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'The same number of files is expected for each dataset, got instead' + str(len(self.lof[0])) + \
                  'files for dataset-0 and ' + str(len(self.lof[1])), 'files for dataset-1, please check. EXIT!'
            self._log_report(info, tag)
            exit()
        dates = []
        for nd in range(n_dataset):
            data.append([])
            for fname in self.lof[nd]:
                rd = RasterDatasetCS(fname)
                sensor_name = rd.sensor_code
                if self.bands[nd] is None:
                    data_labels.append(sensor_name)
                else:
                    data_labels.append(sensor_name + '  ' + self.bands[nd])
                dates.append(rd.date)
                fig_title = 'Region: ' + self.zn + '; Date: ' + rd.date
                _d = rd.get_data(self.bands[nd])
                data[nd].append(_d)

        """spatial consistency: i.e. consider only the cells which have a valid retrieval (not nan) for both datasets"""
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Applying spatial consistency methodology'
            self._log_report(info, tag)
        data = sf.get_spatial_consistency(data)

        """from here one must call a routine to render the plot, to be seen with Jurriaan"""

        # for testing the function call a matplotlib function to plot data
        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Generating the scatter graphic (using matplotlib.show) for testing purposes'
            self._log_report(info, tag)
            from apps.c3sf4p.f4p_plot_functions.plot_scatter import graphical_render

            sname = self.save_path + os.sep + 'test_scatter.png'
            graphical_render(data[0], data[1], x_label=data_labels[0], y_label=data_labels[1], figure_title=fig_title,
                             logfile=self.logfile, sname=sname)

            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'End of scatter plot function, no problem found'
            self._log_report(info, tag)

    def latitudinal_average_plot(self, plotimage=False, timeseries=True):
        """
        This function is the entry point for generating the latitudinal average diagram (also known as howmoller plot).
        In general this function expects a full timeseries for a single dataset, however the function can also be
        extended to multiple dataset.
        @param plotimage
        @param timeseries
        :return:
        """

        if self.dbg:
            self.logfile = es_constants.es2globals['log_dir'] + '/latitudinal-average-plot_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Check that all files share the same pixel dimension'
            self._log_report(info, tag)

        for i, filelist in enumerate(self.lof):
            band_name = self.bands[i]
            # filelist = _check_data(filelist, band_name)
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Latitudinal average plot for ' + str(band_name) + ' start function'
                self._log_report(info, tag)

            x_tick_labels = []
            rd0 = RasterDatasetCS(filelist[0])

            # shape = rd0.get_data(self.bands[0], subsample_coordinates=self.zc).shape
            sz = rd0.get_data(self.bands[0]).shape[0]
            x_set = range(len(filelist))

            # initialise data matrix to host hovmoller calculation
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Initialise data matrix to host hovmoller calculation'
                self._log_report(info, tag)
            data = np.zeros([sz, len(filelist)])

            # notice that if self.n_cores = 1 the parallel statement behave like a normal for loop
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'fill data matrix using parallel calculation, number of jobs=' + str(self.n_cores)
                self._log_report(info, tag)
            # out = Parallel(n_jobs=self.n_cores)(delayed(sf.par_hov)(filelist, band_name, k) for k in x_set)
            out = Parallel(n_jobs=self.n_cores, temp_folder=self.tmp_joblib)(
                delayed(sf.par_hov)(filelist, band_name, k) for k in x_set)

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Parallel calculation ends. Now display the result'
                self._log_report(info, tag)

            # unrol the output of parallel computation
            for j in x_set:
                ii = int(out[j][0][1])
                d = out[j][0][0]
                data[:, ii] = d
                rd = RasterDatasetCS(filelist[j])
                x_tick_labels.append(rd.date)

            hov_matrix = np.array(data)

            # For matplotlib.pyplot plotting
            y_tick_spaces = np.linspace(self.zc[0], self.zc[1], 10)
            # For GUI plotting (Highcharts or D3)
            y_tick_spaces_all = np.linspace(self.zc[0], self.zc[1], data.shape[0])

            y_tick_labels = []
            for tick in y_tick_spaces:
                if tick < 0:
                    card = 'S'
                else:
                    card = 'N'
                y_tick_labels.append(str("{:.1f}".format(tick)) + '$^\circ$' + card)

            sens_name = RasterDatasetCS(filelist[0]).sensor_code

            """from here one must call a routine to render the plot, to be seen with Jurriaan"""

            # for testing the function call a matplotlib function to plot data
            if plotimage:
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                            str(getframeinfo(currentframe()).lineno))
                    tag = 'Generating latitudinal average plot using matplotlib.show() for testing purposes'
                    self._log_report(info, tag)
                from apps.c3sf4p.f4p_plot_functions.plot_hovmoller import graphical_render

                graphical_render(hov_matrix, band_name, sensor_name=sens_name, x_tick_labels=np.array(x_tick_labels),
                                 y_tick_labels=np.array(y_tick_labels), dbg=False)
                # TODO: Get the image and convert to Base10 to attach in return json

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' +
                        str(getframeinfo(currentframe()).lineno))
                tag = 'Latitudinal average methods ended without errors.'
                self._log_report(info, tag)

            if timeseries:
                # column x_tick_labels[n] + y_tick_spaces_all + column hov_matrix[n][m]
                row = 0
                col = 0
                ts = []
                for x_tick in x_tick_labels:
                    for y_tick in y_tick_spaces_all:
                        value = hov_matrix[row][col]
                        if np.isnan(value):
                            value = None
                        ts.append([x_tick, y_tick, value])
                        row += 1
                    col += 1
                    row = 0

                return ts, x_tick_labels, y_tick_labels

    def trend_analysis(self, num_jobs=10, num_partitions=10, only_significant=True, threshold=0.05, fast=False):
        """
                this function implements the analysis of trend given a timeseries of data. The Analysis is performed in
                compliance with the Seasonal MK Test (seasonal_test): For seasonal time series data
                [Hirsch, R.M., Slack, J.R. and Smith, R.A. (1982)]
                This method belongs to the pymankendall library.
                The null hypothesis H0 is that there is NO-trend in the data.

                @param num_jobs:        Int: represents the number of jobs for the parallel computation. Usually this
                                        number equals the number of cpu threads available on machine architecture.

                @param num_partitions:  Int: Together with num_jobs parameter determine the number of chunks in which
                                        the input timeseries will be splitted. As an example if the default values
                                        holds, the total number of chunks will be 100, i.e. in general holds the rule:
                                                number-of-chunks = num_jobs * num_partitions

                @param only_significant:Bool: if true, only the significant (statistically speaking) trend will be
                                        filtered, i.e. all the p-values below a certain threshold (0.05 is used here)

                @param threshold:       float: threshold for defining when the p-value determines a value which is
                                        statistically significant.
                                        Default value = 0.05
                                        The p-value indicates the evidence against the null hypothesis, for instance for
                                        a p-value of 0.05 (i.e. 5%) there is a 5% of probability to commit a mistake in
                                        rejecting the null hypothesis, or in other words, there is a 95% of probability
                                        that the null hypothesis is False (i.e. the data have a trend)
                                        Any p-value > threshold (common factor is 0.05) is considered NOT statistically
                                        significant, i.e. the evidence against the null hypothesis is weak.

                @param fast:            Bool: if true enables the FAST calculation. In some cases the time series for
                                        calculation the trend can consists in several years of data and at the same
                                        time the spatial resolution of the product can be very large. The result is a
                                        heavy computational task that can take several hours (or even days depending
                                        on the  machine architecture) to be completed.
                                        Enabling the fast calculation means then resampling on the fly the spatial
                                        resolution using a NOT accurate but very fast method (scipy.ndimage.zoom)
                                        In this way the calculation can be enormously reduced (and as well the
                                        computational time) at the cost, however, of its accuracy. This method can be
                                        used only for having a first overview of what can be the overall trend of the
                                        series, it is always advisable to use the more rigorous (and slow) method in
                                        order to have trustworthy output.


                ********************************************************************************************************

                :Description:           The chunk-subdivision allows to reduce the amount of RAM required by the trend
                                        analysis, the back side is that more computational time is need to complete the
                                        process, as some time is also need to load the timeseries, split them in chunks
                                        and write them on a temporary folder of local disk to be accessible in I/O
                                        during the full process.

                                        The entry point is represented by the TrendClass, member of
                                        apps.c3sf4p.f4p_utilities.pytrend.TrendStarter.py.
                                        The method that trigger the beginning of the calculation is 'start_loop'
                                        which is in charge of performing data acquisition, subdivision in chunks and
                                        start the parallel computation.
                                        This latter rely on the joblib python library.
                                        The parallel computation will run the function
                                        'par_trend' (parallel-trend) located in

                                        apps.c3sf4p.f4p_utilities.pytrend.utilities

                                        num-jobs times, assigning a different chunk to any job.
                                        This process is repeated until the total chunks are processed.

                                        The par_trend function is ultimately also the entry point of the real core of
                                        the processor, represented by the TrendAnalyser class belonging to
                                        apps.c3sf4p.f4p_utilities.pytrend.MK_trend.py

                                        This last piece of code is responsible to the the signal de-seasonal and
                                        the implementation of the Mann-Kendall method for trend calculation.

                                        ## more information can be found on the description of each specific method

                """
        if self.dbg:
            self.logfile = es_constants.es2globals['log_dir'] + '/trend_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'

            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Checking if the system is able to handle default chunks and size '
            self._log_report(info, tag)

        '''
        freq2number correlates the frequency string with a integer number which express the number of 
        observation in one year. The numbers answer the question: How many files in one year?  
        '''

        # TODO decide which frequency is meaningful for trend calc. my suggestion: > 8days
        freq2number = {'2pday': 730,
                       'e15minute': 4 * 24 * 365,
                       'e1cgldekad': 3 * 12,
                       'e1day': 365,
                       'e1dekad': 3 * 12,
                       'e1modis16day': 23,  # TODO double-check with Marco
                       'e1modis8day': 46,  # TODO double-check with Marco
                       'e1month': 12,
                       'e1motu7day': 4 * 12,
                       'e1pentad': 6 * 12,
                       'e1year': 1,
                       'e30minute': 24 * 2 * 365,
                       'e3hour': 24 / 3 * 365,
                       'e3month': 4,
                       'e6month': 2}

        for nd in range(len(self.lof)):
            band_str = ''
            if self.bands[nd] is not None:
                band_str = str(self.bands[nd])
            num_partitions, num_jobs = self._optimise_trend_parameters(chunks=num_partitions, jobs=num_jobs, index=nd)
            rd0 = RasterDatasetCS(self.lof[nd][0])
            sn = rd0.sensor_code
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Trend analysis starts for ' + sn + ' ' + band_str
                self._log_report(info, tag)
            try:
                frequency = freq2number[rd0.frequency]
            except KeyError:
                frequency = None
                msg = 'frequency not allowed'
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = msg + ': ' + str(frequency) + ' function forced to exit'
                    self._log_report(info, tag)
                    exit()

            trend_flag = 'Mann-Kendall-Trend'
            dates = rd0.year + '-' + RasterDatasetCS(self.lof[nd][-1]).year

            # **********************************************************************************************************
            # TODO: define a trend name to be saved in a predefined folder-structure to not repeat the full calculation
            #       when it is already done once
            #
            save_path = es_constants.es2globals['base_tmp_dir'] + os.sep
            trend_name = save_path + sn + '_' + band_str + '_' + trend_flag + '_' + dates + '.nc'
            #
            # **********************************************************************************************************

            tmp_path = save_path + 'TMP-TREND' + os.sep

            #  this parameter triggers the actual calculation, if it is already run once i.e. trend_name exists, then
            #  the "do_calc" parameter is set to False
            do_calc = True

            if os.path.exists(trend_name):
                do_calc = False

            if do_calc:
                if not os.path.exists(tmp_path):
                    try:
                        os.makedirs(tmp_path)
                        if self.dbg:
                            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                                getframeinfo(currentframe()).lineno))
                            tag = 'Creating tmp folder for housing parallel output in ' + str(tmp_path)
                            self._log_report(info, tag)
                    except IOError:
                        msg = 'Cannot have permission to write in ' + str(save_path)
                        if self.dbg:
                            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                                getframeinfo(currentframe()).lineno))
                            tag = msg + ' function forced to exit'
                            self._log_report(info, tag)
                        print(msg)
                        exit()

                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = 'Starting the parallel calculation'
                    self._log_report(info, tag)

                tc = Ts.TrendClass(self.lof[nd], self.bands[nd], tmp_path, self.tmp_joblib, coordinates=self.zc,
                                   njobs=num_jobs, partitions=num_partitions, freq=frequency, dbg=self.dbg,
                                   logfile=self.logfile, threshold=threshold, is_fast=fast)

                slopes, intercepts, pvalues = tc.start_loop()

                if os.path.exists(tmp_path):
                    #  clean the temporal folder
                    rm_cmd = 'rm -rf ' + tmp_path
                    os.system(rm_cmd)
                    # os.removedirs(tmp_path)

                write_nc(trend_name, [slopes, intercepts, pvalues], ['slopes', 'intercepts', 'pvalues'],
                         fill_value=np.nan, scale_factor=1, offset=0, dtype='float', zc=self.zc, mode='w')

            else:
                # calculaion already performed once. Trend file already exists.
                rd = RasterDatasetCS(trend_name)
                slopes = rd.get_data('slopes', subsample_coordinates=self.zc)
                pvalues = rd.get_data('pvalues', subsample_coordinates=self.zc)

            if only_significant:
                # remove all the statistical slopes with pval > threshold (0.05)
                slopes[pvalues > threshold] = np.nan

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Generating trend plot using matplotlib.show() for testing purposes'
                self._log_report(info, tag)
                from apps.c3sf4p.f4p_plot_functions.plot_trend import graphical_render

                graphical_render(slopes, title='Significant Slopes ', threshold=np.percentile(slopes, 90), dbg=True,
                                 logfile=self.logfile)

                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'End of Trend function, no problem found'
                self._log_report(info, tag)

    def histogram_and_cdf(self, reference=None):
        """
        This function is the entry point for generating the histogram and Cumulative Distribution Function (CDF) of
        one or more distribution.
        @param reference:   dtype=int: in the case of two or more distribution are involved, the user can decide a
                                       particular
                            distribution to be the "REFERENCE", automatically the other will be assumed as distributions
                            to be tested against the reference one in terms of Kolmogorov-Smirnov (KS) statistics of the
                            two sample. For each pair of datasets, the output of the test will be the kolmogorov
                            statistics coefficient (ks) and the p-value. If the ks coefficient is small (close to 0) or
                            the p-value is high (close to 1), then the hypothesis that the distributions of the two
                            samples are the same cannot be rejected.

            ref: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html
        @return:
        """

        if self.dbg:
            self.logfile = es_constants.es2globals['log_dir'] + '/histCdf_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Starting Hist and CDF function. Each hist will have ' + str(len(self.lof)) + ' distributions'
            self._log_report(info, tag)

        n_dataset = len(self.lof)
        shapes = []

        for i in range(len(self.lof[0])):
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = '' + str(len(self.lof))
                self._log_report(info, tag)
            rd00 = RasterDatasetCS(self.lof[0][i])
            date_time = rd00.date
            sens_names = []

            _data = []
            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Getting data for graph n. ' + str(i)
                self._log_report(info, tag)
            for nd in range(n_dataset):
                rd = RasterDatasetCS(self.lof[nd][i])
                sens_names.append(rd.sensor_code)
                _d = rd.get_data(self.bands[nd], subsample_coordinates=self.zc)
                shapes.append(str(_d.shape[0]) + str(_d.shape[1]))
                _data.append(_d)

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Checking spatial cosistency:'
                self._log_report(info, tag)
            # check if all the datasets have the same dimension then apply spatial consistency
            # (i.e. consider only common px)

            if len(set(shapes)) == 1:  # i.e. all the datasets have the same dimension
                _data = sf.get_spatial_consistency(_data)
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = 'Data are consistent, spatial consistency applied'
                    self._log_report(info, tag)
            else:
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = 'Data are not consistent, spatial consistency not applied'
                    self._log_report(info, tag)

            if reference is not None:
                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = 'Reference dataset provided as ' + sens_names[reference] + \
                          ' calculating Kolmogorov-Smirnov statistics'
                    self._log_report(info, tag)
                ks = np.zeros([n_dataset, 2])
                x_set = [item for item in range(n_dataset) if item not in [reference]]
                for ids in x_set:
                    out_ks = sf.get_ks(_data[reference].copy(), _data[ids].copy())
                    ks[ids, 0] = out_ks[0]
                    ks[ids, 1] = out_ks[1]
            else:
                ks = None

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Generating the histogram graphic (using matplotlib.show) for testing purposes'
                self._log_report(info, tag)
                from apps.c3sf4p.f4p_plot_functions.plot_hist_cdf import graphical_render

                graphical_render(_data, sensor_name=sens_names, prod_name=self.bands, date_time=date_time,
                                 zone_name=self.zn, zone_coord=self.zc, ks_value=ks, i_ref=reference)

                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'End of hist-CDF function, no problem found'
                self._log_report(info, tag)

    def gamma_index(self, itol=5, reference=None):
        """
        This function implements a light version of the gamma index metrics.
        In particular in this version all the part regarding the Distance To Agreement (dta) which require a heavy
        computation of the geodetic distances between pixels has been drop, in favour of the solely Intensity Tolerance.
        Hereafter the dta term is always set to 0 and thus the gamma index map represents just the punctual (same pixel)
        agreement between the reference distribution and the one to test against.

        @param reference:   dtype=int: is the index of the distribution designated as the "REFERENCE".
                                       all the others will be tested against this.
                                       If no index is provided, i.e. reference=None, the reference item will be
                                       then calculated as the simple average among all the provided distributions

        @param itol:       dtype=int:  intensity tolerance term given in %

        @return:
        """
        if self.dbg:
            self.logfile = es_constants.es2globals['log_dir'] + '/GammaIndex_test_' + \
                           str(datetime.today()).replace(' ', '') + '.log'
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Starting GammaIndex function. reference distribution = ' + str(reference)
            self._log_report(info, tag)

        n_dataset = len(self.lof)

        if reference is not None:
            x_set = [item for item in range(n_dataset) if item not in [reference]]
        else:
            x_set = [item for item in range(n_dataset)]

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
            tag = 'Calculating GammaIndex for ' + str(len(x_set)) + ' distributions'
            self._log_report(info, tag)

        # build sensor names
        sensor_name = []
        for nd in range(n_dataset):
            fname = self.lof[nd][0]
            rd = RasterDatasetCS(fname)
            sensor_name.append(rd.sensor_code)

        for nf in range(len(self.lof[0])):
            data = []
            date = RasterDatasetCS(self.lof[0][nf]).date_long
            for nd in range(n_dataset):
                fname = self.lof[nd][nf]
                rd = RasterDatasetCS(fname)
                prod_name = self.bands[nd]
                d_tmp = rd.get_data(prod_name, subsample_coordinates=self.zc)  # load data matrix
                data.append(d_tmp)

            if reference is not None:
                data_ref = data[reference]
                sens_ref = sensor_name[reference]
            else:
                data_ref = np.nanmean(data, axis=0)
                sens_ref = 'Average Distribution'

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Reference distribution is ' + sens_ref
                self._log_report(info, tag)

            # compute the gamma index in parallel

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'Starting Parallel computation'
                self._log_report(info, tag)
            out = Parallel(n_jobs=self.n_cores,
                           temp_folder=self.tmp_joblib)(delayed(sf.gamma2d)(data_ref, data[i], itol)
                                                        for i in x_set)

            if self.dbg:
                info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                    getframeinfo(currentframe()).lineno))
                tag = 'End of Parallel computation'
                self._log_report(info, tag)

            for i, k in enumerate(x_set):
                g_matrix = np.array(out[i][0])
                n_tot = np.count_nonzero(~np.isnan(g_matrix))  # number of valid px on gi (eq on ref)
                n_gi = np.count_nonzero(g_matrix <= 1)  # number of px for which gi <= 1
                try:
                    norm_gi = np.round(100. * n_gi / n_tot)  # normalized gi: % of VALID px with gi<=1
                except ZeroDivisionError:
                    norm_gi = np.nan

                g_matrix[g_matrix > 1.] = 2.

                from apps.c3sf4p.f4p_plot_functions.plot_gamma_index import graphical_render

                sname = self.save_path + os.sep + 'test_gammaindex.png'

                band_name = self.bands[i]
                if band_name is None:
                    band_name = ''

                title = sensor_name[i] + ': ' + band_name + ' ' + self.zn + ' ' + date + \
                    '\n $I_{tol}$=' + str(itol) + '%; Reference: ' + sens_ref

                if self.dbg:
                    info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                        getframeinfo(currentframe()).lineno))
                    tag = 'Render plot title: ' + title.replace('\n', ' ')
                    self._log_report(info, tag)

                graphical_render(g_matrix, self.zc, norm_gi, sname, title=title)

        if self.dbg:
            info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
                getframeinfo(currentframe()).lineno))
            tag = 'End of GammaIndex function, no problem found'
            self._log_report(info, tag)

    def _log_report(self, info, tag):
        if not os.path.exists(self.logfile):
            fid = open(self.logfile, 'w')
        else:
            fid = open(self.logfile, 'a')

        msg = info + ': ' + tag + '\n'
        fid.writelines(msg)
        fid.close()


def _check_data(fl, band):
    """
    chech that the true dimension of each element of fl (filelist) w.r.t. the band under axamination, match the
    expected dimension as stored in the database. If not, remove the file from the list
    """
    fl = list(fl)
    default_dimension = RasterDatasetCS(fl[0]).pixel_dimension
    for f in fl:
        if default_dimension != list(RasterDatasetCS(f).get_data(band).shape):
            fl.remove(f)
    return fl


