# ###############################################################################
# version:          R1.3.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    09 Nov 2015                                                 #
# property of:      JRC                                                         #
# purpose:          Main class that links web interface and function libraries  #
#             --------------------------------------------------                #
# last edit:        17 Apr 2020                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################
import numpy as np
import plot_functions as pf
import stat_functions as sf
from LoadRasterDataset import RasterDataset
import psutil
from joblib import Parallel, delayed
from TripleCollocationErrorModel import TCEM
from scipy.ndimage import zoom
import ECV_dictionary
from pytrend import TrendStarter as Ts
import os


class EcvDisplay(object):
    """
    Main class for display GUI functions
    """

    def __init__(self, list_of_files, ecv, product, zone_name='', zone_coord=None, total_file_list=None,
                 do_extraction=False, extraction_lat=None, extraction_lon=None, neighbors=None, lc_val=None,
                 lc_label=None, lc_type=None, spatial_consistency=True, str_output_fname=None):

        """
        :param list_of_files:   STRING or ARRAY of Strings (python list):
                                file or list of files to display,  len(list_of_files) = number of dataset
        :param ecv:             STRING: Essential Climate Variable name (generic) to be translate with ECV_dictionary
        :param product:         STRING: product name (generic) to be translate with ECV_dictionary
        :param zone_name:       STRING: name of specific zone, default = None --> Global
        :param zone_coord:      LIST of float: coordinates of specific zone [S, N, W, E]
                                default = None --> [-90, 90, -180, 180]
        :param do_extraction:   enable point/neighbor extraction
        :param extraction_lat:  latitude to extract
        :param extraction_lon:  longitude to extract
        :param neighbors:       number of px around point that defines the neighbor
        :param spatial_consistency enable or disable spatial consistency procedure
        :param lc_val           if not None indicates the pixels to take into account for the benchmarking method
                                the selection is based on IPCC or LCCS land cover CCI maps rescaled at the same
                                resolution of the product under examination
        :param lc_label         name of the LandCover class codified on the basis of the IPCC or LCCS conventions
        :param lc_type          0=IPCC covention; 1=LCCS convention

        """
        self.dic = ECV_dictionary
        self.mask = None
        self.oc_mask_name = './f4p_utilities/MPR_30000800_001M_900S900N1800W1800E_009KM_CHL_PROVINCES.HDF'
        self.lc_file_name = None
        if lc_label is None:
            lc_label = 'All Classes'

        self.lc_label = lc_label

        if lc_label != 'All Classes':
            self.lc_label = lc_label + ' (' + ['IPCC', 'LCCS'][lc_type] + ')'

        self.lc_type = lc_type
        if lc_val is not None:
            res = []
            for nd in range(len(list_of_files)):
                for f in list_of_files[nd]:
                    res.append(RasterDataset(f).spatial_resolution)

            if len(np.unique(res)) == 1:
                try:
                    self.lc_file_name = self.dic.LC_file_names[lc_type][self.dic.LC_res2Idx.index(res[0])]
                except ValueError:
                    lc_val = None

        self.lc_val = lc_val
        self.extract = do_extraction
        self.lat2ext = extraction_lat
        self.lon2ext = extraction_lon
        self.neigh = neighbors
        self.is_spc = spatial_consistency

        ncoord = 4
        if self.extract:
            ncoord = 2

        if zone_coord is None:
            zc_list = []
            for nd in range(len(list_of_files)):
                for f in list_of_files[nd]:
                    zc_list.append(RasterDataset(f).default_zc)
            unk_zc = np.unique(zc_list)
            if len(unk_zc) == ncoord:
                zone_coord = RasterDataset(list_of_files[0][0]).default_zc
                # print zone_coord
            else:
                raise Exception('datasets does not share the same geographical extension, '
                                'multiple coordinates found ' + str(unk_zc))

        self.lof = list_of_files
        self.tfl = total_file_list
        self.ecv = ecv
        self.product = product
        self.zn = zone_name
        self.zc = zone_coord

        if do_extraction:
            self.snew = 'lat:' + str(zone_coord[0]) + ' lon:' + str(zone_coord[1])
            if self.neigh > 0:
                nn = int(2 * self.neigh + 1)
                self.snew += ' neigh=' + str(nn) + '$\\times$' + str(nn)

        else:
            sns = 'S'
            snn = 'N'
            wew = 'W'
            wee = 'E'
            if zone_coord[0] > 0:
                sns = 'N'
            if zone_coord[1] < 0:
                snn = 'S'
            if zone_coord[2] > 0:
                wew = 'E'
            if zone_coord[3] < 0:
                wee = 'W'

            self.snew = str(abs(zone_coord[0])) + sns + ';' + str(abs(zone_coord[1])) + snn + ';' + \
                str(abs(zone_coord[2])) + wew + ';' + str(abs(zone_coord[3])) + wee

        self.zone_string = self.zn
        if self.zn == 'Custom':
            self.zone_string = self.snew

        self.str_output_fname = str_output_fname
        self.n_dataset = len(list_of_files)
        self.is_anomaly = False
        self.month_list = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

        self.n_cores = 12
        if psutil.cpu_count() < 6:
            self.n_cores = int(psutil.cpu_count() / 2)  # notice: logical=True gives the n. of threads!
        if self.n_cores == 0:
            self.n_cores = 1

        # set bins fo hovmoller
        if self.zc is None:
            self.bin_lat = 180.
            self.bin_lon = 360.
        else:
            if self.extract:
                self.bin_lat = self.bin_lon = None
            else:
                self.bin_lat = int(self.zc[1] - self.zc[0])
                self.bin_lon = int(self.zc[3] - self.zc[2])

        self._get_data_mask()
        self.water_mask = self.mask[-1]

    def statistics(self, stat_index=2, show_std=False, is_anomaly=False, total_file_list=None, do_return=False,
                   is_save=0, is_show=2):
        """
        :param stat_index:      statistical voice to plot
                                    index == 0 --> max.
                                    index == 1 --> min
                                    index == 2 --> mean (default)
                                    index == 3 --> std-dev of the mean
                                    index == 4 --> variance of the mean
                                    index == 5 --> [%] number of nan
        :param show_std:        True or False trigger the std shadows
        :param is_anomaly:      True or False Set the plot parameters (title etc) accordingly
        :param total_file_list: File list corresponding to the time series on which the climatology is calculated
        :param do_return:       if True activate return of stat quantities, instead of plotting results
        :param is_save:         can be 0 or 2 if 2 -> save the figure
        :param is_show:         can be 0 or 2 if 2 -> show the figure
        :return:
        """
        tf = True
        stat_dict = ['Maximum', 'Minimum', 'Average Value', 'StDev ', 'Variance', '[%] Missing Values']

        x_ax_lab = 'Time'
        if stat_index != 5:
            if is_anomaly:
                if tf:
                    y_ax_lab = stat_dict[stat_index]
                else:
                    y_ax_lab = stat_dict[stat_index] + ' [%]'
            else:
                y_ax_lab = stat_dict[stat_index]
        else:
            y_ax_lab = stat_dict[stat_index]

        data_lab = []  # data labels
        x_tick_lab = []
        sdom = None
        xx = np.zeros([len(self.lof[0])])
        yy = np.zeros([len(self.lof[0]), self.n_dataset])
        months = []
        years = []
        date_num = []
        temporal_scale = []

        if stat_index == 2:
            if show_std:
                sdom = np.zeros([len(self.lof[0]), self.n_dataset])

        for nf in range(len(self.lof[0])):
            data = []  # initialize main data matrix
            for nd in range(self.n_dataset):
                data.append([])
                if nf == 0:
                    # build dataset_labels for plot
                    sn0 = RasterDataset(self.lof[nd][0]).sensor_name
                    try:
                        trans_sn = self.dic.sens_dic[sn0]
                    except KeyError:
                        trans_sn = sn0

                    data_lab.append(trans_sn + '-' + self.product[nd])
                    temporal_scale.append(RasterDataset(self.lof[nd][0]).temporal_resolution)
                fname = self.lof[nd][nf]
                rd = RasterDataset(fname)
                prod_name = self.product[nd]
                if is_anomaly:
                    anomaly_data = rd.get_anomaly(prod_name, total_file_list[nd], mask_param=self.mask,
                                                  zone_coord=self.zc, extract=self.extract, neigh=self.neigh,
                                                  is_absolute=tf)

                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        anomaly_data[lc_data != self.lc_val] = np.nan

                    data[nd].append(anomaly_data)
                    if nd == 0:
                        months.append(int(rd.month_num))
                        years.append(int(rd.year))
                else:
                    prod_data = rd.get_data(prod_name, zone_coord=self.zc, mask_param=self.mask,
                                            extract=self.extract, neigh=self.neigh)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        prod_data[lc_data != self.lc_val] = np.nan

                    data[nd].append(prod_data)
                # *****************************************************************************************************
                # build x_tick_labels for plot since dataset are supposed coherent in time, do this just the 1st time
                # *****************************************************************************************************
                if nd == 0:
                    date_num.append(rd.date_num)
                    x_tick_lab.append(rd.date)

            data_cons = sf.get_spatial_consistency(data)  # spatial consistency
            if stat_index == 5:
                x, y = sf.get_statistics(data, stat_index=stat_index, mask_array=self.water_mask)
            elif stat_index == 2:
                x, y = sf.get_statistics(data_cons, stat_index=stat_index, mask_array=self.water_mask)
                if show_std:
                    _, var_y = sf.get_statistics(data, stat_index=6, mask_array=self.water_mask)
                    sdom[nf, :] = var_y
            else:
                x, y = sf.get_statistics(data_cons, stat_index=stat_index, mask_array=self.water_mask)

            xx[nf] = nf + 1
            yy[nf, :] = y

        # if is_anomaly:
        #     yy[yy > 50] = np.nan

        zone4title = ' Region: '
        if self.extract:
            zone4title = ' Site: '

        zc4title = '\n'
        if self.zn == 'Custom':
            zc4title = ': ' + self.snew + '\n'

        if self.n_dataset > 1:
            if is_anomaly:
                if tf:
                    fig_title = 'Time Series Statistics Comparison; Absolute Anomalies;' + \
                                zone4title + self.zn.replace('_', ' ') + zc4title
                else:
                    fig_title = 'Time Series Statistics Comparison; Relative Anomalies;' + \
                                zone4title + self.zn.replace('_', ' ') + zc4title
            else:
                fig_title = 'Time Series Statistics Comparison; ' + zone4title + self.zn + zc4title
        else:
            if is_anomaly:
                if tf:
                    fig_title = 'Time Series Statistics; Absolute Anomalies;' + \
                                zone4title + self.zn.replace('_', ' ') + zc4title
                else:
                    fig_title = 'Time Series Statistics; Relative Anomalies;' + \
                                zone4title + self.zn.replace('_', ' ') + zc4title
            else:
                fig_title = 'Time Series Statistics; ' + zone4title + self.zn + zc4title

        if self.lc_label not in [None, 'All Classes']:
            fig_title += '\n Over ' + self.lc_label.replace('_', ' ') + ' Land Class'

        pf.plot_comparison_stat(xx, yy, err_y=sdom, is_anomaly=is_anomaly, x_axis_label=x_ax_lab,
                                y_axis_label=y_ax_lab, dataset_label=data_lab, figure_title=fig_title,
                                x_tick_labels=x_tick_lab, is_local=self.extract, is_save=is_save, is_show=is_show,
                                ecv_name=self.ecv, t_res=temporal_scale, str_output_fname=self.str_output_fname)
        # do_return = True
        if do_return:
            print('saving statistics!')
            nn = 2
            if show_std:
                nn = 3

            out2return = np.zeros([np.size(date_num), nn * self.n_dataset])
            for j in range(self.n_dataset):
                for i in range(np.size(date_num)):
                    k = nn * j
                    out2return[i, k] = date_num[i]
                    out2return[i, k + 1] = yy[i, j]
                    if show_std:
                        out2return[i, k + 2] = sdom[i, j]
            # --------------------------------
            # sname = fig_title.replace(' ', '_').replace('\n', '').replace(';', '').replace(':', '') + '.csv'
            tipo = './f4p_utilities/Plots/TSS_'
            if is_anomaly:
                tipo = './f4p_utilities/Plots/TSSA_'
            sname = tipo + self.snew.replace(';', '_').replace('-', '') + '_' + self.lc_label
            for ds in data_lab:
                sname += '_' + ds + '_'
            sname += x_tick_lab[0] + '-' + x_tick_lab[-1] + '.csv'
            sname = str(sname)
            # print sname
            # exit()
            np.savetxt(sname, out2return, delimiter=',')
            print('save done')
            # return out2return

    def statistics2(self, stat_index=2, show_std=False, is_anomaly=False, total_file_list=None,
                    is_save=0, is_show=2):
        """
        :param stat_index:      statistical voice to plot
                                    index == 0 --> max.
                                    index == 1 --> min
                                    index == 2 --> mean (default)
                                    index == 3 --> std-dev of the mean
                                    index == 4 --> variance of the mean
                                    index == 5 --> [%] number of nan
        :param show_std:        True or False trigger the std shadows
        :param is_anomaly:      True or False Set the plot parameters (title etc) accordingly
        :param total_file_list: File list corresponding to the time series on which the climatology is calculated
        :param is_save:         can be 0 or 2 if 2 -> save the figure
        :param is_show:         can be 0 or 2 if 2 -> show the figure
        :return:
        """
        stat_dict = ['Maximum Records', 'Minimum Records', 'Average Records', 'StDev Records',
                     'Variance Records', '[%] Missing Values']

        x_ax_lab = 'Time'
        data_lab = []
        if stat_index != 5:
            if is_anomaly:
                y_ax_lab = stat_dict[stat_index] + ' [%]'
            else:
                y_ax_lab = stat_dict[stat_index]
        else:
            y_ax_lab = stat_dict[stat_index]

        time_index = []
        x_tick_lab = []
        yy = []
        xx = []
        var = None
        temporal_scale = []

        if stat_index == 2:
            if show_std:
                var = []

        self.water_mask = zoom(self.water_mask, 1/6., order=0)

        for nd in range(self.n_dataset):
            xx.append([])
            yy.append([])
            if show_std:
                var.append([])
            for ifn, fn in enumerate(self.lof[nd]):
                rd = RasterDataset(fn)
                if ifn == 0:
                    temporal_scale.append(rd.temporal_resolution)
                    try:
                        sname = self.dic.sens_dic[rd.sensor_name]
                    except KeyError:
                        sname = rd.sensor_name

                    data_lab.append(sname + '-' + self.product[nd])
                time_index.append(rd.date_num)
                x_tick_lab.append(rd.date)
                if is_anomaly:
                    data_matrix = rd.get_anomaly(self.product[nd], total_file_list[nd], mask_param=self.mask,
                                                 zone_coord=self.zc, extract=self.extract, neigh=self.neigh)
                else:
                    data_matrix = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask,
                                                extract=self.extract, neigh=self.neigh)

                data_matrix = zoom(data_matrix, 1/6., order=0)

                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    data_matrix[lc_data != self.lc_val] = np.nan

                y = sf.image_statistics(data_matrix, stat_index, self.water_mask)

                yy[nd].append(y)
                if stat_index == 2:
                    if show_std:
                        variance = sf.image_statistics(data_matrix, 4, self.water_mask)
                        var[nd].append(variance)

        unik_time, unik_idx = np.unique(time_index, return_index=True)
        x_tick_lab = np.array(x_tick_lab)[unik_idx]

        for nd in range(self.n_dataset):
            for fn in self.lof[nd]:
                date_num = RasterDataset(fn).date_num
                xx[nd].append(np.where(unik_time == date_num)[0][0])

        zone4title = ' Region: '
        if self.extract:
            zone4title = ' Site: '

        zc4title = '\n'
        if self.zn == 'Custom':
            zc4title = ': ' + self.snew + '\n'

        if self.n_dataset > 1:
            if is_anomaly:
                fig_title = 'Time Series Statistics Comparison; Relative Anomalies;' + \
                            zone4title + self.zn + zc4title
            else:
                fig_title = 'Time Series Statistics Comparison; ' + zone4title + self.zn + zc4title
        else:
            if is_anomaly:
                fig_title = 'Time Series Statistics; Relative Anomalies;' + zone4title + self.zn + zc4title
            else:
                fig_title = 'Time Series Statistics; ' + zone4title + self.zn + zc4title

        if self.lc_label not in [None, 'All Classes']:
            fig_title += '\n Over ' + self.lc_label + ' Land Class'

        np.save('4faparXX_TS.npy', np.array(xx))
        np.save('4faparYY_TS.npy', np.array(yy))
        np.save('4faparSTDV_TS.npy', var)
        np.save('4faparXTICK_TS.npy', x_tick_lab)

        pf.plot_comparison_stat2(xx, yy, err_y=var, is_anomaly=is_anomaly, x_axis_label=x_ax_lab,
                                 y_axis_label=y_ax_lab, dataset_label=data_lab, figure_title=fig_title,
                                 x_tick_labels=x_tick_lab, is_local=self.extract, is_save=is_save, is_show=is_show,
                                 ecv_name=self.ecv, t_res=temporal_scale, str_output_fname=self.str_output_fname)

    def anomaly_stat(self, total_file_list, stat_index=2, is_consistent=True, is_save=0, is_show=2):
        """
        :param total_file_list: File list corresponding to the time series on which the climatology is calculated
        :param stat_index:      statistical voice to plot
                                    index == 0 --> max.
                                    index == 1 --> min
                                    index == 2 --> mean (default)
                                    index == 3 --> std-dev of the mean
                                    index == 4 --> variance of the mean
                                    index == 5 --> [%] number of nan
        :param is_consistent    determines whether or not the spatial consistency step is enabled
        :param is_save:         can be 0 or 2 if 2 -> save the figure
        :param is_show:         can be 0 or 2 if 2 -> show the figure
        :return:
        """
        if is_consistent:
            self.statistics(stat_index=stat_index, is_anomaly=True, total_file_list=total_file_list,
                            is_save=is_save, is_show=is_show)
        else:
            self.statistics2(stat_index=stat_index, is_anomaly=True, total_file_list=total_file_list,
                             is_save=is_save, is_show=is_show)
        self.dic.climatology_store = {}

    def one_to_one(self, is_save=0, is_show=2):
        fig_title = []
        data_lab = []  # data labels
        data = []  # initialize main data matrix

        if self.n_dataset != 2:
            raise Exception('TEMP-MESSAGE: scatter plot is meaningful only for 2 dataset not more nor less!!!!')
        else:
            dates = []
            for nd in range(self.n_dataset):
                try:
                    sname = self.dic.sens_dic[RasterDataset(self.lof[nd][0]).sensor_name]
                except KeyError:
                    sname = RasterDataset(self.lof[nd][0]).sensor_name
                dlab = sname + '  ' + self.product[nd]
                data_lab.append(dlab)  # build dataset_labels for plot

                data.append([])
                for fname in self.lof[nd]:
                    print(fname)
                    rd = RasterDataset(fname)
                    if nd == 0:
                        add_lc = ''
                        if self.lc_label not in [None, 'All Classes']:
                            add_lc = '\n Over ' + self.lc_label + ' Land Class'
                        tick_l = rd.date
                        dates.append(tick_l)
                        if self.zn == 'Custom':
                            fig_title.append('Region Coordinates: ' + self.snew + '; Date: ' + tick_l + add_lc)
                        else:
                            fig_title.append('Region: ' + self.zn + '; Date: ' + tick_l + add_lc)

                    prod_name = self.product[nd]
                    _d = rd.get_data(prod_name, zone_coord=self.zc, mask_param=self.mask)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        _d[lc_data != self.lc_val] = np.nan
                    data[nd].append(_d)
            data = sf.get_spatial_consistency(data)

            if is_show + is_save:
                print(data_lab)
                pf.plot_1o1(data[0], data[1], date=dates, x_label=data_lab[0], y_label=data_lab[1],
                            figure_title=fig_title, ecv_type=self.ecv, str_output_fname=self.str_output_fname,
                            is_save=is_save, is_show=is_show)

    def kolmogorov(self, is_save=0, is_show=2):
        """
        Compute Kolmogorov-Smirnov statistics of the two sample. For each pair of datasets the output will be the
        kolmogorov statistics coefficient (KS) and the p-value. If the KS statistic is small or the p-value is high,
        then we cannot reject the hypothesis that the distributions of the two samples are the same.
        :return: produce plot for ks and p-value
        """
        ks = []
        pv = []
        x_tick_lab = []

        for i in range(len(self.lof[0])):
            rd1 = RasterDataset(self.lof[0][i])
            rd2 = RasterDataset(self.lof[1][i])
            meta1 = rd1.get_metadata()  # get metadata from filename

            year = meta1[1]
            month = meta1[6]  # month name short (3 char)
            day = meta1[3]
            if day == '00':
                tick_l = str(month) + '-' + str(year)
            else:
                tick_l = str(day) + '-' + str(month) + '-' + str(year)

            x_tick_lab.append(tick_l)
            data1 = rd1.get_data(self.product[0], zone_coord=self.zc)  # get data matrix
            data2 = rd2.get_data(self.product[1], zone_coord=self.zc)  # get data matrix

            d = [data1, data2]
            out = sf.get_ks(d[0], d[1])
            ks.append(out[0])
            pv.append(out[1])
        pf.plot_ks(ks, pv, x_tick_labels=x_tick_lab, is_save=is_save, is_show=is_show)

    def map(self, is_save=0, is_show=2):

        for nd in range(self.n_dataset):
            for fname in self.lof[nd]:
                rd = RasterDataset(fname)

                if rd.day != '00':
                    date = rd.day + '-' + rd.month_name_long + '-' + rd.year
                else:
                    date = rd.month_name_long + '-' + rd.year

                data = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask)  # get data matrix
                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    data[lc_data != self.lc_val] = np.nan

                try:
                    prod = self.dic.prod_general_name[self.product[nd]]
                except KeyError:
                    prod = self.product[nd]
                # print self.ecv
                pf.plot_map(data, date=date, sensor_name=rd.sensor_name, product=prod, plot_type='Map',
                            ecv_type=self.ecv, zone_name=self.zn, zone_coord=self.zc, is_save=is_save,
                            is_show=is_show, water_mask=self.water_mask, lc_label=self.lc_label,
                            str_output_fname=self.str_output_fname)

    def anomaly_map(self, total_file_list, is_save=0, is_show=2):
        """
        :param total_file_list: ARRAY of Strings (python list):
                                extra input parameter needed in order to calculate the climatology.
                                List of all the available filename
        :param is_save:         can be 0 or 2 if 2 -> save the figure
        :param is_show:         can be 0 or 2 if 2 -> show the figure
                NOTE:
                if anomaly (or climatology) display is required list_of_files and total_file_list are
                combined together in such a way that for each sensor and for each filename in the sensor
                the climatology is calculated using total_file_list:
        :return:
        """

        # tf_abs = True
        tf_abs = False

        self.tfl = total_file_list
        for nd in range(self.n_dataset):
            p_n = self.product[nd]
            for fname in self.lof[nd]:
                rd = RasterDataset(fname)
                anomaly = rd.get_anomaly(p_n, total_file_list[nd], zone_coord=self.zc, mask_param=self.mask,
                                         is_absolute=tf_abs)

                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    anomaly[lc_data != self.lc_val] = np.nan
                if rd.day != '00':
                    date = rd.day + '-' + rd.month_name_long + '-' + rd.year
                else:
                    date = rd.month_name_long + '-' + rd.year

                pf.plot_map(anomaly, date=date, sensor_name=rd.sensor_name, product=self.product[nd],
                            plot_type='Anomaly', zone_name=self.zn, zone_coord=rd.true_zc, water_mask=self.water_mask,
                            lc_label=self.lc_label, str_output_fname=self.str_output_fname, ecv_type=self.ecv,
                            is_save=is_save, is_show=is_show, is_absolute=tf_abs)
        self.dic.climatology_store = {}

    def climatology_map(self, total_file_list, is_save=0, is_show=2):
        """
        :param total_file_list: ARRAY of Strings (python list):
                                extra input parameter needed in order to calculate the climatology.
                                List of all the available filename
        :param is_save:         can be 0 or 2 if 2 -> save the figure
        :param is_show:         can be 0 or 2 if 2 -> show the figure
                NOTE:
                if climatology (or anomaly) display is required list_of_files and total_file_list are
                combined together in such a way that for each sensor and for each filename in the sensor
                the climatology is calculated using total_file_list:
        :return:
        """
        self.tfl = total_file_list
        for nd in range(self.n_dataset):
            for fname in self.lof[nd]:
                rd = RasterDataset(fname)
                climatology = rd.get_climatology(self.product[nd], total_file_list[nd], zone_coord=self.zc,
                                                 mask_param=self.mask)
                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    climatology[lc_data != self.lc_val] = np.nan

                if is_save + is_show > 0:
                    pf.plot_map(climatology, date=rd.month_name_long, sensor_name=rd.sensor_name,
                                product=self.product[nd], plot_type='Clima', ecv_type=self.ecv, zone_name=self.zn,
                                zone_coord=rd.true_zc, str_output_fname=self.str_output_fname,
                                water_mask=self.water_mask, lc_label=self.lc_label, is_save=is_save, is_show=is_show)

        self.dic.climatology_store = {}

    def hovmoller(self, progress_bar=None, is_anomaly=False, is_abs=False, is_save=0, is_show=2):
        """
        :param progress_bar:    progress bar object
        :param is_anomaly:      can be True or False default = False
        :param is_abs:          meaningful for anomaly, if True, expresses them as absolute value
        :param is_save:         0 or 2 if 2 save canvas to local drive
        :param is_show:         0 or 2 if 2 show canvas
        :return:
         plot for every dataset hovmoller for both latitude and longitude in sequence
        """
        pb = progress_bar

        n_ax = {'Latitude': 1, 'Longitude': 0}
        n_dim = {'Latitude': 0, 'Longitude': 1}
        # n_bin = {'Latitude': self.bin_lat, 'Longitude': self.bin_lon}
        tf = {'Latitude': True, 'Longitude': False}
        # fig_title = []
        add_lc = ''
        if self.lc_label not in [None, 'All Classes']:
            add_lc = '\n Over ' + self.lc_label + ' Land Class'

        for i, kind in enumerate(['Latitude']):  # , 'Longitude']):
            n_land = np.flipud(np.nansum(self.water_mask, axis=n_ax[kind]))
            if pb is not None:
                pb.setValue(0)
            for nd in range(self.n_dataset):
                if pb is not None:
                    pb.setValue(0)
                x_tick_labels = []

                _ffirst = next(item for item in self.lof[nd] if item)
                rd0 = RasterDataset(_ffirst)
                sn_0 = rd0.sensor_name

                shape = rd0.get_data(self.product[nd], zone_coord=self.zc).shape
                sz = shape[n_dim[kind]]

                file_list = list(self.lof[nd])
                x_set = range(len(file_list))

                tfl = None
                if is_anomaly:
                    tfl = self.tfl[nd]
                #
                # data = np.zeros([len(self.lof[nd]), size])
                data = np.zeros([sz, len(self.lof[nd])])
                proc = self.n_cores
                # proc=1
                out = Parallel(n_jobs=proc)(delayed(sf.par_hov)(self.lof[nd], self.product[nd], k, n_ax[kind],
                                                                n_land, is_anomaly, is_abs, self.zc, self.mask,
                                                                self.lc_val, self.lc_type, tfl=tfl) for k in x_set)
                for j in x_set:
                    if pb is not None:
                        perc = np.round(100. * (j + 1) / len(self.lof[nd]))
                        pb.setValue(perc)
                    ii = int(out[j][0][1])
                    d = out[j][0][0]
                    data[:, ii] = d
                    rd = RasterDataset(self.lof[nd][j])
                    x_tick_labels.append(rd.date)

                hov_matrix = np.array(data)

                y_tick_spaces = [np.linspace(self.zc[0], self.zc[1], 10),
                                 np.linspace(self.zc[2], self.zc[3], 10)]

                y_tick_labels = []
                for tick in y_tick_spaces[i]:
                    if i == 0:
                        if tick < 0:
                            card = 'S'
                        else:
                            card = 'N'
                    else:
                        if tick < 0:
                            card = 'W'
                        else:
                            card = 'E'
                    y_tick_labels.append(str("{:.1f}".format(tick)) + '$^\circ$' + card)

                #
                # y_tick_labels = [np.arange(self.zc[0], self.zc[1], 10),
                #                  np.arange(self.zc[2], self.zc[3], 10)]

                try:
                    sens_name = self.dic.sens_dic[sn_0]
                except KeyError:
                    sens_name = sn_0

                if is_anomaly:
                    fig_title = 'Hovmoller Anomalies \n ' + sens_name + ' ' + self.product[nd] + ' ' + self.zn
                else:
                    fig_title = 'Hovmoller ' + sens_name + ' ' + self.product[nd] + ' ' + self.zn

                if self.zn == 'Custom':
                    fig_title += ' Region: ' + self.snew

                fig_title += add_lc

                pf.plot_hovmoller(hov_matrix, self.product[nd], sensor_name=sn_0, zone_name=self.zn, latitude=tf[kind],
                                  is_anomaly=is_anomaly, x_tick_labels=x_tick_labels, y_tick_labels=y_tick_labels,
                                  ecv_type=self.ecv, is_save=is_save, is_show=is_show, zone_coord=self.zone_string,
                                  figure_title=fig_title, is_absolute=is_abs, str_output_fname=self.str_output_fname)

    def hovmoller_anomaly(self, total_file_list, progress_bar=None, is_save=0, is_show=2):

        # tf = True
        tf = False
        self.tfl = total_file_list
        self.hovmoller(is_anomaly=True, progress_bar=progress_bar, is_abs=tf, is_save=is_save, is_show=is_show)
        self.dic.climatology_store = {}

    def taylor_diagram(self, index_ref=None, is_time_series=False, is_save=0, is_show=2):

        if index_ref is None:
            index_ref = 0

        sensors = []
        sens_ref = ''
        temporal_label = []
        x_set = [item for item in range(self.n_dataset) if item not in [index_ref]]

        if is_time_series:
            correlation = np.zeros([1, len(x_set)])
            stdev = np.zeros([1, len(x_set)])
        else:
            correlation = np.zeros([len(self.lof[0]), len(x_set)])
            stdev = np.zeros([len(self.lof[0]), len(x_set)])

        if not is_time_series:
            time_labels = None
            for k in range(len(self.lof[index_ref])):
                rd = RasterDataset(self.lof[index_ref][k])
                d_ref = rd.get_data(self.product[index_ref], zone_coord=self.zc)

                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    d_ref[lc_data != self.lc_val] = np.nan

                if k == 0:
                    sens_ref = self.dic.sens_dic[rd.sensor_name]
                if rd.day == '00':
                    day1 = '*'
                else:
                    day1 = rd.day
                l1 = str(day1 + '-' + rd.month_num + '-' + rd.year).replace('*-', '')
                temporal_label.append(l1)
                for jj, nd in enumerate(x_set):
                    rd_t = RasterDataset(self.lof[nd][k])
                    if k == 0:
                        try:
                            sname = self.dic.sens_dic[rd_t.get_metadata()[0]]
                        except KeyError:
                            sname = rd_t.sensor_name

                        sensors.append(sname)

                    d_test = rd_t.get_data(self.product[nd], zone_coord=self.zc)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd_t.year, rd_t.spatial_resolution)
                        d_test[lc_data != self.lc_val] = np.nan

                    if not is_time_series:
                        std, corr = sf.get_correlation_test(d_test, d_ref)
                        correlation[k, jj] = corr
                        stdev[k, jj] = std
        else:
            temporal_label = None
            big_d_ref = []
            big_d_test = []
            for k in range(len(self.lof[index_ref])):
                rd = RasterDataset(self.lof[index_ref][k])
                d_ref = rd.get_data(self.product[index_ref], zone_coord=self.zc)
                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    d_ref[lc_data != self.lc_val] = np.nan
                big_d_ref.append(d_ref)
                if k == 0:
                    sens_ref = self.dic.sens_dic[rd.sensor_name]

            for jj, nd in enumerate(x_set):
                big_d_test.append([])
                for k in range(len(self.lof[jj])):
                    rd_t = RasterDataset(self.lof[nd][k])
                    if k == 0:
                        sensors.append(self.dic.sens_dic[rd_t.get_metadata()[0]])
                    d_test = rd_t.get_data(self.product[nd], zone_coord=self.zc)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd_t.year, rd_t.spatial_resolution)
                        d_test[lc_data != self.lc_val] = np.nan

                    big_d_test[jj].append(d_test)

            rd0 = RasterDataset(self.lof[0][0])
            rd1 = RasterDataset(self.lof[0][-1])

            time_labels = rd0.year + '-' + rd1.year

            stdev, correlation = sf.get_correlation_ts(big_d_test, big_d_ref)
            correlation = np.array(correlation)
            stdev = np.array(stdev)

        pf.plot_taylor_diagram(correlation, stdev, sensor_name=sensors, sensor_ref=sens_ref,
                               prod_name=self.product[index_ref], zone_name=self.zn, date_time=time_labels,
                               temporal_labels=temporal_label, is_save=is_save, is_show=is_show,
                               lc_label=self.lc_label, str_output_fname=self.str_output_fname)

    def tcem(self, is_fast=True, progress_bar=None, is_save=0, is_show=2):
        common_months = []
        for fname in self.lof[0]:
            common_months.append([RasterDataset(fname).month_num])
        for m in self.month_list:
            lf1 = []
            lf2 = []
            lf3 = []
            l_index = np.where(np.array(common_months) == m)[0]
            if any(l_index):
                for k, _ in enumerate(l_index):
                    lf1.append(self.lof[0][l_index[k]])
                    lf2.append(self.lof[1][l_index[k]])
                    lf3.append(self.lof[2][l_index[k]])

                tcem = TCEM(lf1, lf2, lf3, self.product, self.zc, progress_bar=progress_bar, is_fast=is_fast)

                err_x, err_y, err_z, n_of_valid_coll, conv_matrix = tcem.start_engine()
                #
                # np.save('err_x.npy', err_x)
                # np.save('err_y.npy', err_y)
                # np.save('err_z.npy', err_z)
                # np.save('nval.npy', n_of_valid_coll)
                # np.save('conv.npy', conv_matrix)
                # exit()

                err_x[conv_matrix == 3] = np.nan
                err_y[conv_matrix == 3] = np.nan
                err_z[conv_matrix == 3] = np.nan

                err_x[err_x < 0] = np.nan
                err_y[err_y < 0] = np.nan
                err_z[err_z < 0] = np.nan

                # v_max = 3 * (np.min([np.nanmean(err_x), np.nanmean(err_y), np.nanmean(err_z)]))
                v_max = np.min([np.nanmean(err_x), np.nanmean(err_y), np.nanmean(err_z)])

                if is_fast is False:
                    ambiguous_variable = ''  # Accurate Implementation'
                else:
                    ambiguous_variable = ''  # 'Fast Implementation'

                sn1 = RasterDataset(self.lof[0][0]).sensor_name
                sn2 = RasterDataset(self.lof[1][0]).sensor_name
                sn3 = RasterDataset(self.lof[2][0]).sensor_name

                try:
                    sensor_name1 = self.dic.sens_dic[sn1]
                except KeyError:
                    sensor_name1 = sn1
                try:
                    sensor_name2 = self.dic.sens_dic[sn2]
                except KeyError:
                    sensor_name2 = sn2
                try:
                    sensor_name3 = self.dic.sens_dic[sn3]
                except KeyError:
                    sensor_name3 = sn3

                month_name_long1 = RasterDataset(self.lof[0][0]).month_name_long
                month_name_long2 = RasterDataset(self.lof[1][0]).month_name_long
                month_name_long3 = RasterDataset(self.lof[2][0]).month_name_long

                if is_show or is_save != 0:
                    fig_title1 = 'TCEM ' + sensor_name1 + ' ' + self.product[0] \
                                 + ' -' + month_name_long1 + '- ' + ambiguous_variable
                    fig_title2 = 'TCEM ' + sensor_name2 + ' ' + self.product[1] \
                                 + ' -' + month_name_long2 + '- ' + ambiguous_variable
                    fig_title3 = 'TCEM ' + sensor_name3 + ' ' + self.product[2] \
                                 + ' -' + month_name_long3 + '- ' + ambiguous_variable
                    fig_title4 = 'TCEM Number of Valid collocated points' + ' -' + month_name_long1 + '- '
                    fig_title5 = ' Convergence of calculation' + ' -' + month_name_long1 + '- ' + ambiguous_variable

                    err_x = sf.reshape_data(err_x, self.zc, [-90, 90, -180, 180])
                    err_y = sf.reshape_data(err_y, self.zc, [-90, 90, -180, 180])
                    err_z = sf.reshape_data(err_z, self.zc, [-90, 90, -180, 180])
                    n_of_valid_coll = sf.reshape_data(n_of_valid_coll, self.zc, [-90, 90, -180, 180])
                    conv_matrix = sf.reshape_data(conv_matrix, self.zc, [-90, 90, -180, 180])

                    true_zc = sf.reshape_data(err_x, self.zc, [-90, 90, -180, 180], flag='get true zc')

                    save_name1 = save_name2 = save_name3 = save_name4 = save_name5 = None

                    if self.str_output_fname is not None:
                        path = os.path.dirname(self.str_output_fname)
                        save_name1 = path + os.sep + 'Err1_' + os.path.basename(self.str_output_fname)
                        save_name2 = path + os.sep + 'Err2_' + os.path.basename(self.str_output_fname)
                        save_name3 = path + os.sep + 'Err3_' + os.path.basename(self.str_output_fname)
                        save_name4 = path + os.sep + 'NCOL_' + os.path.basename(self.str_output_fname)
                        save_name5 = path + os.sep + 'CONV_' + os.path.basename(self.str_output_fname)

                    pf.plot_tcol(err_x, val_max=v_max, fig_title=fig_title1, zone_name=self.zn,
                                 zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                 str_output_fname=save_name1, water_mask=self.water_mask)
                    pf.plot_tcol(err_y, val_max=v_max, fig_title=fig_title2, zone_name=self.zn,
                                 zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                 str_output_fname=save_name2, water_mask=self.water_mask)
                    pf.plot_tcol(err_z, val_max=v_max, fig_title=fig_title3, zone_name=self.zn,
                                 zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                 str_output_fname=save_name3, water_mask=self.water_mask)
                    pf.plot_tcol(n_of_valid_coll, plot_type=1, fig_title=fig_title4, zone_name=self.zn,
                                 zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                 str_output_fname=save_name4, water_mask=self.water_mask)
                    pf.plot_tcol(conv_matrix, plot_type=2, fig_title=fig_title5, zone_name=self.zn,
                                 zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                 str_output_fname=save_name5, water_mask=self.water_mask)

    def gamma_index(self, dta=None, pid=0.05, is_mask_gt1=False, index_ref=None, sp_cons=False, is_save=0, is_show=2,
                    data_mask=None, gi_txt_name=None, relative_pid=True):
        """
        :param dta:             distance to agreement tolerance term in km
        :param pid:             pixel intensity difference in %
        :param relative_pid     specifies if pid is actually given as % or is an absolute quantity
        :param is_mask_gt1:     mask gi results > 1
        :param index_ref:       index of the reference dataset
        :param sp_cons:         assumes spatial consistency (take into account common pixels only)
        :param is_save:
        :param is_show:
        :param data_mask:
        :param gi_txt_name:
        :return:
        """
        true_zc = None

        if dta is None:
            # set dta as the pixel size at the equator
            dta = 6378.135 * np.deg2rad(180. / float(RasterDataset(self.lof[0][0]).native_dim[0]))

        x_set = [item for item in range(self.n_dataset) if item not in [index_ref]]
        gi_dataset = []
        gi_product = []
        gi_reference = ''
        gi_ref_prod = ''
        gi_data = np.zeros([len(self.lof[0]), 3 * len(x_set) + 1])
        iteration = 0
        header = []
        # print '********************************************************************************'
        for nf in range(len(self.lof[0])):
            iteration += 1
            rd0 = RasterDataset(self.lof[0][nf])
            resolution = rd0.spatial_resolution
            datum = rd0.date_long
            gi_data[nf, 0] = rd0.date_num
            _data = []
            sensor_name = []

            for nd in range(self.n_dataset):
                sensor_name.append([])
                fname = self.lof[nd][nf]
                rd = RasterDataset(fname)
                sensor_name[nd].append(rd.sensor_name)  # get sensor name
                prod_name = self.product[nd]
                d_tmp = rd.get_data(prod_name, zone_coord=self.zc, mask_param=self.mask)  # load data matrix
                _data.append(d_tmp)
                if nd == 0:
                    true_zc = rd.true_zc

            # Spatial consistency, take into account only the common valid cells
            if sp_cons:
                mask_sc = np.sum(_data, axis=0)
                mask_sc[~np.isnan(mask_sc)] = 0.
                data = []
                for nd in range(self.n_dataset):
                    data.append(_data[nd] + mask_sc)
            else:
                data = _data
            # get reference distribution
            ref, w_mask = sf.get_reference(data, index_ref, resolution, ecv=self.ecv, mask=data_mask, zc=self.zc)

            if index_ref is not None:
                try:
                    ref_name = self.dic.sens_dic[sensor_name[index_ref][0]]
                except KeyError:
                    ref_name = sensor_name[index_ref][0]
                if iteration == 1:
                    try:
                        gi_reference = self.dic.sens_dic[ref_name]
                    except KeyError:
                        gi_reference = str(ref_name)
                    gi_ref_prod = self.product[index_ref]
            else:
                ref_name = None
                if iteration == 1:
                    gi_reference = 'Average'
                    gi_ref_prod = 'Average'
            out = Parallel(n_jobs=self.n_cores)(delayed(sf.gamma2d)
                                                (ref, data[i], self.zc, dta, pid, is_fast=is_mask_gt1,
                                                 is_relative=relative_pid) for i in x_set)
            g_index = []
            delta = []
            for i, _ in enumerate(x_set):
                g_index.append(out[i][0])
                delta.append(out[i][1])

            if iteration == 1:
                header.append('date')
                for hh in range(len(x_set)):
                    try:
                        lbl = self.dic.sens_dic[sensor_name[hh][0]]
                    except KeyError:
                        lbl = str(sensor_name[hh][0])
                    header.append(lbl + ' [%] GI $\leq$ 1')
                for hh in range(len(x_set)):
                    try:
                        lbl = self.dic.sens_dic[sensor_name[hh][0]]
                    except KeyError:
                        lbl = str(sensor_name[hh][0])
                    header.append(lbl + ' [%] GI > 1')
                for hh in range(len(x_set)):
                    try:
                        lbl = self.dic.sens_dic[sensor_name[hh][0]]
                    except KeyError:
                        lbl = str(sensor_name[hh][0])
                    header.append(lbl + ' [%] Missing Values')

            for i, k in enumerate(x_set):
                try:
                    test_name = self.dic.sens_dic[sensor_name[k][0]]
                except KeyError:
                    test_name = sensor_name[k][0]

                g_matrix = np.array(g_index[i])
                # delta4plot = np.array(delta[i])
                delta4plot = np.array(delta[i])
                if iteration == 1:
                    try:
                        lbl = self.dic.sens_dic[sensor_name[k][0]]
                    except KeyError:
                        lbl = str(sensor_name[k][0])
                    gi_dataset.append(lbl)
                    gi_product.append(self.product[k])

                dim_tot = np.count_nonzero(~np.isnan(w_mask))  # number of valid px on land
                n_tot = np.count_nonzero(~np.isnan(g_index[i]))  # number of valid px on gi (eq on ref)
                n_gi = np.count_nonzero(g_matrix <= 1)  # number of px for which gi <= 1
                n_bad_gi = np.count_nonzero(g_matrix > 1)
                n_nan = dim_tot - n_gi - n_bad_gi
                prod_name = self.product[k]
                try:
                    perc = np.round(100. * n_gi / dim_tot)
                    norm_gi = np.round(100. * n_gi / n_tot)  # normalized gi: % of VALID px with gi<=1
                except ZeroDivisionError:
                    perc = np.nan
                    norm_gi = np.nan
                gi_data[nf, i + 1] = 100. * n_gi / dim_tot
                gi_data[nf, i + len(x_set) + 1] = 100. * n_bad_gi / dim_tot
                gi_data[nf, i + 2 * len(x_set) + 1] = 100. * n_nan / dim_tot

                if dta >= 0:
                    if is_mask_gt1:
                        bool_mask = True
                        gamma4plot = g_matrix * w_mask
                        gamma4plot[gamma4plot > 1] = 2.
                    else:
                        bool_mask = False
                        gamma4plot = g_matrix * w_mask
                else:
                    gamma4plot = g_matrix * w_mask
                    bool_mask = False
                try:
                    less_dta = 100 * np.count_nonzero(delta4plot == 0) / np.count_nonzero(~np.isnan(delta4plot))
                except ZeroDivisionError:
                    less_dta = np.nan
                if dta >= 0:
                    if is_save + is_show > 0:
                        pf.plot_gi(gamma4plot, date=datum, sensor_name=test_name, ref_name=ref_name,
                                   product=prod_name, is_mask=bool_mask, gi=perc, ngi=norm_gi, dta=dta, pid=pid,
                                   zone_name=self.zn, zone_coord=true_zc, is_save=is_save, is_show=is_show,
                                   water_mask=self.water_mask, str_output_fname=self.str_output_fname)
                        delta4plot[gamma4plot > 1] = 2 * float(dta)
                        if dta == 0:
                            delta4plot[np.isnan(gamma4plot)] = 2 * float(dta)
                    else:
                        import os
                        matrix_save_name = self.dic.path_to_save + os.sep + 'GI_' + sensor_name[k][0] + \
                            '_ref=' + gi_reference + '_' + prod_name + '_' + self.zn + datum + \
                            '_Itol=' + str(pid) + '_Dtol=' + str(dta) + '.npy'
                        matrix_metadata = {'Dataset': self.dic.sens_dic[sensor_name[k][0]],
                                           'Reference': ref_name,
                                           'Product': prod_name,
                                           'Ref_Product': gi_ref_prod,
                                           'Region': self.zn,
                                           'Coordinates': self.zc,
                                           'Masked': is_mask_gt1,
                                           'gi': perc,
                                           'ngi': norm_gi,
                                           'mrp': less_dta,
                                           'date': datum,
                                           'DTA': dta,
                                           'PID': pid}
                        matrix_info = {'info': self.dic.matrix_description}
                        np.save(matrix_save_name, [matrix_info, matrix_metadata, gamma4plot, delta4plot])
                # else:
                #     if ref_name is None:
                #         sn = sensor_name[0][0] + ' .vs. ' + sensor_name[k][0]
                #     else:
                #         sn = ref_name + ' .vs. ' + sensor_name[k][0]
                #     gamma4plot[gamma4plot > 100] = 100
                #     pf.plot_map(gamma4plot, sensor_name=sn, product=prod_name, zone_name=self.zn,
                #                 zone_coord=true_zc, is_save=is_save, is_show=is_show, plot_type=' Diff. %',
                #                 water_mask=self.water_mask, str_output_fname=self.str_output_fname)

        if gi_txt_name is not None:
            gi_metadata = {'Number of Dataset': len(x_set),
                           'Dataset List': gi_dataset,
                           'Reference': gi_reference,
                           'Product List': gi_product,
                           'Reference Product': gi_ref_prod,
                           'Region': self.zn,
                           'Coordinates': self.zc,
                           'Data Header': header,
                           'DTA': dta,
                           'PID': pid}
            gi_info = {'info': self.dic.gi_description}
            np.save(gi_txt_name, [gi_info, gi_metadata, gi_data])

    def apu(self, v_min=0, v_max=1, index_ref=None, bins=20, specs_params=None, is_save=0, is_show=2):
        """
        :param v_min:       minimum value (x-axis limit)
        :param v_max:       minimum value (x-axis limit)
        :param index_ref:   specify which dataset is the reference
        :param bins:        number of bins
        :param specs_params:GCOS requirements for accuracy
        :param is_save:
        :param is_show:
        :return:
        """
        if index_ref is None:
            raise Exception('TEMP-MESSAGE: APU need a reference!! and is meaningful for 2 dataset!!')
        x_set = [item for item in range(self.n_dataset) if item not in [index_ref]]
        for nf in range(len(self.lof[0])):
            rd = RasterDataset(self.lof[index_ref][nf])
            data_ref = rd.get_data(self.product[index_ref], zone_coord=self.zc)
            if self.lc_val is not None:
                lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                data_ref[lc_data != self.lc_val] = np.nan

            try:
                lbl = self.dic.sens_dic[rd.sensor_name]
            except KeyError:
                lbl = str([rd.sensor_name])
            ref_lab = lbl + ' ' + self.product[index_ref]
            if rd.day == '00':
                datum = rd.month_name_long + '-' + rd.year
            else:
                datum = rd.day + '-' + rd.month_name_long + '-' + rd.year

            for nd in x_set:
                sn = RasterDataset(self.lof[nd][nf]).get_metadata()[0]

                try:
                    lbl_ttl = self.dic.sens_dic[sn]
                except KeyError:
                    lbl_ttl = str(sn)

                reg = self.zn
                if self.zn == 'Custom':
                    reg = self.snew

                fig_title = 'APU ' + lbl_ttl + ' ' + self.product[nd] + '\n ' + reg + ' ' + datum
                if self.lc_label not in [None, 'All Classes']:
                    fig_title += '\n Over ' + self.lc_label + ' Land Class'

                rd_t = RasterDataset(self.lof[nd][nf])
                data_test = rd_t.get_data(self.product[nd], zone_coord=self.zc)
                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd_t.year, rd_t.spatial_resolution)
                    data_test[lc_data != self.lc_val] = np.nan

                data = [data_ref, data_test]
                # if self.is_spc:
                #     data = sf.get_spatial_consistency(data)

                apus = sf.get_apu(data[0], data[1], v_min, v_max, bins, specs_params)

                pf.plot_apu(data[index_ref], apus, ref_label=ref_lab, bins=bins, figure_title=fig_title,
                            v_min=v_min, v_max=v_max, is_save=is_save, is_show=is_show,
                            str_output_fname=self.str_output_fname)

    # def trend_analysis_old(self, progress_bar=None, is_save=0, is_show=2):
    #     """
    #     :param progress_bar:
    #     :param is_save:
    #     :param is_show:
    #     :return:
    #     """
    #     hbad = -9999.
    #     sn = ''
    #     pb = progress_bar
    #     self.tfl = self.lof
    #     tf = None
    #     nyear = []
    #     for nd in range(self.n_dataset):
    #         yl = []
    #         for f in self.tfl[nd]:
    #             yl.append(RasterDataset(f).year)
    #         nyear.append(len(np.unique(yl)))
    #
    #     for nd in range(self.n_dataset):
    #         hcf_test = []
    #         temporal = []
    #         res = []
    #         # ********************
    #         # get spatial_resolution, temporal information and initialize main output!
    #         for f in self.tfl[nd]:
    #             rd = RasterDataset(f)
    #             temporal.append([int(rd.year), int(rd.month_num)])
    #             res.append(rd.native_dim)
    #         unique_res = np.unique(res)
    #         if unique_res.size > 2:
    #             print('dimensions mismatch! exit!!!')
    #             exit()
    #         # get temporal infos
    #         temporal = np.array(temporal)
    #         unique_years = np.unique(temporal[:, 0])
    #         tot_n_file = int(12 * len(unique_years))  # ideally, for each year 12 file should be present
    #
    #         if tot_n_file < len(self.tfl[nd]):
    #             print('temporal scale not understood! must be monthly! exit!!!')
    #             exit()
    #         elif tot_n_file == len(self.tfl[nd]):
    #             # print 'ideal case'
    #             tf = np.ones(tot_n_file)
    #         else:
    #             nlag = 0
    #             # print 'fill the lags'
    #             tf = np.zeros(tot_n_file)
    #             for y in list(unique_years):
    #                 my = np.where(temporal[:, 0] == y)[0]
    #                 iy0 = my[0]
    #                 for im in list(temporal[my, 1]):
    #                     tf[iy0 + nlag + im - 1] = 1
    #                 nlag += 12 - len(my)
    #
    #         dim_zc = sf.reshape_data(np.zeros(unique_res), self.zc, [-90, 90, -180, 180]).shape
    #
    #         main_data = np.zeros([dim_zc[0], dim_zc[1], tot_n_file])
    #         # ********************
    #         months = np.full(tot_n_file, fill_value=np.nan)
    #         nn = 0
    #         for _ in enumerate(unique_years):
    #             for im in range(12):
    #                 months[nn] = im + 1
    #                 nn += 1
    #
    #         # print 'filling main data input!'
    #         i_f = 0
    #         # loop over the ideal temporal distribution if lags are present these will be filled by nan
    #         for element in range(tot_n_file):
    #             if tf[element]:
    #                 pct = int(100. * float(element) / tot_n_file)
    #                 if pb is not None:
    #                     pb.setValue(pct)
    #                 rd = RasterDataset(self.tfl[nd][i_f])
    #                 if i_f == 0:
    #                     sn = rd.sensor_name
    #
    #                 d_tmp = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask)
    #                 if self.lc_val is not None:
    #                     lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
    #                     d_tmp[lc_data != self.lc_val] = np.nan
    #                 main_data[:, :, element] = d_tmp
    #                 i_f += 1
    #         # find highest common factor (hcf) for latitude and longitude:
    #         for l in [0, 1]:
    #             hcf_test.append(sf.get_hcf(main_data.shape[l], self.n_cores))
    #         hcf = np.max(hcf_test)
    #
    #         slope_trend = np.full(dim_zc, fill_value=np.nan)
    #         prob_trend = np.full(dim_zc, fill_value=np.nan)
    #         #
    #         # series = main_data[144, 343, :]
    #         # np.save('series.npy', series)
    #         # exit()
    #         # print months
    #         # print type(months)
    #         # print type(months[0])
    #         # exit()
    #         main_data[np.isnan(main_data)] = hbad
    #         # print 'start par calc'
    #         if pb is not None:
    #             pb.setValue(0)
    #
    #         if hcf == 1:
    #             for ii in range(main_data.shape[0]):
    #                 pct = int(100. * float(ii) / main_data.shape[0])
    #                 if pb is not None:
    #                     pb.setValue(pct)
    #                 for jj in range(main_data.shape[1]):
    #                     if ~np.isnan(self.water_mask[ii, jj]):
    #                         if ~np.isnan(np.nanmean(main_data[ii, jj, :])):
    #                             out = sf.get_trend(main_data[ii, jj, :], months)
    #                             slope_trend[ii, jj] = out[0]
    #                             prob_trend[ii, jj] = out[1]
    #         else:
    #             x_set = range(main_data.shape[1])
    #             for ii in range(main_data.shape[0]):
    #                 pct = np.round(100. * float(ii) / main_data.shape[0])
    #                 if pb is not None:
    #                     pb.setValue(pct)
    #                 if ~np.isnan(np.nanmean(self.water_mask[ii, :])):
    #                     # if ~np.isnan(np.nanmean(main_data[ii, :, :])):
    #
    #                     out = Parallel(n_jobs=self.n_cores)(delayed(sf.get_trend)(main_data[ii, kk, :], months)
    #                                                         for kk in x_set)
    #                     # print np.shape(out)
    #                     # exit()
    #                     out = np.array(out)
    #                     slope_trend[ii, :] = out[:, 0].transpose()
    #                     prob_trend[ii, :] = out[:, 1].transpose()
    #
    #         # express slopes as %/yr
    #         slope_trend = 100. * slope_trend * 12
    #         if pb is not None:
    #             pb.setValue(0)
    #
    #         save_name = 'KendalTrend_' + self.snew.replace(';', '_') + sn + '_' + \
    #                     self.product[nd]
    #
    #         if self.lc_label not in [None, 'All Classes']:
    #             save_name += '_Over_' + self.lc_label
    #
    #         save_name += self.dic.fig_ext
    #
    #         npyname = './f4p_utilities/Plots/' + os.path.basename(str(save_name)).replace(self.dic.fig_ext, '.npy')
    #         np.save(npyname, slope_trend)
    #
    #         pf.plot_map(slope_trend, sensor_name=sn, product=self.product[nd], ecv_type=self.ecv, plot_type='Trend',
    #                     zone_name=self.zn, zone_coord=self.zc, is_save=is_save, is_show=is_show,
    #                     water_mask=self.water_mask, str_output_fname=save_name)
    #
    #         # display only statistically significant trends
    #         slope_trend[prob_trend < 0.05] = np.nan
    #
    #         save_name = 'SignificantKendalTrend_' + self.zone_string + '_' + sn + '_' + self.product[nd] + \
    #                     self.dic.fig_ext
    #
    #         pf.plot_map(slope_trend, sensor_name=sn, product=self.product[nd], ecv_type=self.ecv, plot_type='Trend',
    #                     zone_name=self.zn, zone_coord=self.zc, is_save=is_save, is_show=is_show,
    #                     water_mask=self.water_mask, str_output_fname=save_name)

    def trend_analysis(self, do_mk=True, num_jobs=10, num_partitions=10, is_save=0, is_show=2):
        """
        :param do_mk:           True --> Mann Kendall analysis, False ---> RLM
        :param num_jobs:        number of jobs for the parallel computation
        :param num_partitions:  the time series will be decomposed into (num_partitions)^2 sub arrays which will be
                                handled num_jobs at a time by the parallel processor
        :param is_save:
        :param is_show:
        :return:
        """

        if not os.path.exists(ECV_dictionary.path_trend):
            os.makedirs(ECV_dictionary.path_trend)
        for nd in range(self.n_dataset):
            rd0 = RasterDataset(self.lof[nd][0])
            try:
                sn = ECV_dictionary.sens_dic[rd0.sensor_name]
            except KeyError:
                sn = rd0.sensor_name

            if do_mk:
                mk_tag = 'MK'
                trend_flag = 'Mann-Kendall-Trend'
                date = rd0.year + RasterDataset(self.lof[nd][-1]).year
            else:
                mk_tag = rd0.month_num
                trend_flag = 'Monthly-Trend-' + rd0.month_name_long
                date = rd0.year + RasterDataset(self.lof[nd][-1]).year

            trend_name = self.dic.path_trend + rd0.sensor_tag + '_' + date + '_' + rd0.temporal_resolution + '_' + \
                self.snew.replace(';', '') + '_' + rd0.spatial_resolution + '_' + \
                self.product[nd] + '_' + trend_flag + '.nc'

            trend_name_global = self.dic.path_trend + rd0.sensor_tag + '_' + date + '_' + rd0.temporal_resolution + \
                '_' + '90.0S90.0N180.0W180.0E' + '_' + rd0.spatial_resolution + '_' + \
                self.product[nd] + '_' + trend_flag + '.nc'

            try_reshape = False
            do_calc = True

            if self.snew.replace(';', '') != '90.0S90.0N180.0W180.0E':
                try_reshape = True

            if try_reshape:
                if os.path.exists(trend_name_global):
                    do_calc = False
            if os.path.exists(trend_name):
                do_calc = False

            # print(try_reshape, do_calc, os.path.exists(trend_name), os.path.exists(trend_name_global))

            if do_calc:
                try:
                    sname = self.dic.sens_dic[rd0.sensor_name]
                except KeyError:
                    sname = rd0.sensor_name

                tmp_path = str(self.dic.path_tmp_trend + sname + '-' + self.product[nd] + '-' +
                               rd0.spatial_resolution + '-' + self.zone_string + '-' + mk_tag + os.sep)

                if not os.path.exists(tmp_path):
                    try:
                        os.makedirs(tmp_path)
                    except IOError:
                        msg = 'Cannot write on ' + tmp_path + 'please check. programm exit!'
                        raise Exception(msg)

                tc = Ts.TrendClass(self.lof[nd], self.product[nd], tmp_path, self.water_mask,
                                   coordinates=self.zc, mann_kendal=do_mk, njobs=num_jobs, partitions=num_partitions)
                slopes, intercepts, pvalues = tc.start_loop()

                # clean temporal folder
                if os.path.exists(tmp_path):
                    rm_dir = 'rm -r ' + tmp_path
                    os.system(rm_dir)

                sf.write_nc(trend_name, [slopes, intercepts, pvalues],
                            ['slopes', 'intercepts', 'pvalues'], fill_value=np.nan, scale_factor=1, offset=0,
                            dtype='float', zc=self.zc, mode='w')

            else:
                if try_reshape:
                    rd = RasterDataset(trend_name_global)
                else:
                    rd = RasterDataset(trend_name)

                slopes = rd.get_data('slopes', zone_coord=self.zc)
                pvalues = rd.get_data('pvalues', zone_coord=self.zc)

            slopes[pvalues > 0.05] = np.nan

            save_name = ECV_dictionary.path_to_save + os.path.basename(trend_name).split('.nc')[0]

            if self.lc_label not in [None, 'All Classes']:
                save_name += '_Over_' + self.lc_label

            save_name += self.dic.fig_ext

            pf.plot_map(slopes, sensor_name=sn, product=self.product[nd], ecv_type=self.ecv, plot_type='Trend',
                        zone_name=self.zn, zone_coord=self.zc, is_save=is_save, is_show=is_show,
                        is_mk=do_mk, water_mask=self.water_mask, str_output_fname=save_name)

    def temporal_lambda_analysis(self, progress_bar=None, is_save=0, is_show=2):
        """
        :param progress_bar:
        :param is_save:
        :param is_show:
        :return
        """
        # from time import time
        # t0 = time()

        pb = progress_bar
        data_shape = RasterDataset(self.lof[0][0]).get_data(self.product[0], zone_coord=self.zc).shape

        sz = data_shape[0] * data_shape[1]
        nf = len(self.lof[0])  # number of files in the series

        try:
            np.zeros([sz, nf, self.n_dataset * 3], dtype='float')
            # mat_approach = True
            mat_approach = False
        except MemoryError:
            mat_approach = False

        sn1 = self.dic.sens_dic[RasterDataset(self.lof[0][0]).sensor_name]
        sn2 = self.dic.sens_dic[RasterDataset(self.lof[1][0]).sensor_name]

        sn = sn1 + '-' + sn2
        temp_ext = RasterDataset(self.lof[0][0]).date_num + '-' + RasterDataset(self.lof[0][-1]).date_num

        # print 'mat_approach', mat_approach

        if mat_approach:
            main_data = np.zeros([sz, nf, self.n_dataset], dtype='float')
            for ind in range(nf):
                pct = int(100. * (ind + 2) / nf)
                if pb is not None:
                    pb.setValue(pct)
                for nd in range(self.n_dataset):
                    rd = RasterDataset(self.lof[nd][ind])
                    _d = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        _d[lc_data != self.lc_val] = np.nan
                    main_data[:, ind, nd] = _d.flatten()
            out = sf.get_lambda_matrix(main_data[:, :, 0], main_data[:, :, 1])
            symdex = np.reshape(out, data_shape)
        else:

            sums = [0, 0]
            dens = [0, 0]
            stds = [0, 0]
            cov_deltas = [0, 0]
            delta_data = [0, 0]
            delta_den = np.zeros(1)
            delta_num = 0
            cov_sum = 0
            k = np.zeros(1)
            # print '# calculate the average value'
            for ind in range(nf):
                pct = int(100. * (ind + 2) / nf)
                # print pct
                if pb is not None:
                    pb.setValue(pct)
                for nd in range(self.n_dataset):
                    rd = RasterDataset(self.lof[nd][ind])
                    _d = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask)
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        _d[lc_data != self.lc_val] = np.nan
                    delta_data[nd] = _d.copy()
                    mk = _d.copy()
                    _d[np.isnan(_d)] = 0
                    sums[nd] += _d  # nansum
                    mk[~np.isnan(mk)] = 1
                    mk[np.isnan(mk)] = 0
                    dens[nd] += mk
                num_tmp = np.square(delta_data[0] - delta_data[1])
                den_tmp = num_tmp.copy()
                num_tmp[np.isnan(num_tmp)] = 0

                den_tmp[~np.isnan(den_tmp)] = 1
                den_tmp[np.isnan(den_tmp)] = 0

                delta_den += den_tmp
                delta_num += num_tmp

            delta_den[delta_den == 0] = np.nan
            delta = delta_num / delta_den
            avg1 = sums[0] / dens[0]
            avg2 = sums[1] / dens[1]

            avgs = [avg1, avg2]
            # print '# calculate variances and covariances'
            den_cov = 0
            for ind in range(nf):
                tmp_den = np.zeros(1)
                pct = int(100. * (ind + 2) / nf)
                # print pct
                if pb is not None:
                    pb.setValue(pct)
                for nd in range(self.n_dataset):
                    rd = RasterDataset(self.lof[nd][ind])
                    _d = rd.get_data(self.product[nd], zone_coord=self.zc, mask_param=self.mask)
                    tmp_den += _d
                    if self.lc_val is not None:
                        lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                        _d[lc_data != self.lc_val] = np.nan
                    avg_diff = (_d - avgs[nd])
                    std_tmp = np.square(avg_diff)
                    std_tmp[np.isnan(std_tmp)] = 0
                    stds[nd] += std_tmp
                    cov_deltas[nd] = avg_diff

                tmp_den[~np.isnan(tmp_den)] = 1
                tmp_den[np.isnan(tmp_den)] = 0
                den_cov += tmp_den
                delta_prod = cov_deltas[0] * cov_deltas[1]
                k_tmp = cov_deltas[0] * cov_deltas[1]
                delta_prod[np.isnan(delta_prod)] = 0
                k_tmp[np.isnan(k_tmp)] = 0
                cov_sum += delta_prod
                k += k_tmp

            std1 = np.sqrt(stds[0] / (dens[0]))
            std2 = np.sqrt(stds[1] / (dens[1]))
            covr = cov_sum / den_cov

            r = covr / (std1 * std2)
            k = 2 * abs(k)
            k[r >= 0] = 0

            symdex = sf.get_lambda_matrix(0, 0, var1=np.square(std1), var2=np.square(std2), avgd1=avg1, avgd2=avg2,
                                          k=k, delta=delta, is_data=False)

        save_name = self.dic.path_to_save + 'SymIndexAgreement_' + self.zone_string + '_' + sn + '_' + \
            self.product[0] + '_' + temp_ext + self.dic.fig_ext

        # print 'done in', time() - t0
        title = sn + ' ' + self.product[0] + ' ' + self.zone_string + '\n' + "$\lambda$-Index " + \
            RasterDataset(self.lof[0][0]).date + '-' + RasterDataset(self.lof[0][-1]).date

        pf.plot_map(symdex, sensor_name=sn, product=self.product[0], ecv_type=self.ecv, plot_type='SymIndex',
                    zone_name=self.zn, zone_coord=self.zc, is_save=is_save, is_show=is_show, figure_title=title,
                    lc_label=self.lc_label, water_mask=self.water_mask, str_output_fname=save_name)

    def hist_cdf(self, index_ref=None, is_save=0, is_show=2):
        """
        :param index_ref:       index of the reference dataset
        :param is_save:
        :param is_show:
        :return:
        """
        if self.zn == 'Custom':
            zn = None
        else:
            zn = self.zn

        ks = None

        for i in range(len(self.lof[0])):
            rd00 = RasterDataset(self.lof[0][i])
            date_time = rd00.month_name_short + '-' + rd00.year
            sens_names = []

            _data = []
            for nd in range(self.n_dataset):
                rd = RasterDataset(self.lof[nd][i])
                sens_names.append(rd.sensor_name)
                _d = rd.get_data(self.product[nd], zone_coord=self.zc)
                if self.lc_val is not None:
                    lc_data = self._get_lc_data(rd.year, rd.spatial_resolution)
                    _d[lc_data != self.lc_val] = np.nan
                _data.append(_d)

            if self.is_spc:
                _data = sf.get_spatial_consistency(_data)

            if index_ref is not None:
                ks = np.zeros([self.n_dataset, 2])
                x_set = [item for item in range(self.n_dataset) if item not in [index_ref]]
                for ids in x_set:
                    out_ks = sf.get_ks(_data[index_ref].copy(), _data[ids].copy())
                    ks[ids, 0] = out_ks[0]
                    ks[ids, 1] = out_ks[1]

            pf.plot_hist(_data, sensor_name=sens_names, prod_name=self.product, date_time=date_time,
                         zone_name=zn, zone_coord=self.zc, is_save=is_save, is_show=is_show, ks_value=ks,
                         i_ref=index_ref, is_spc=self.is_spc, lc_label=self.lc_label,
                         str_output_fname=self.str_output_fname)

    def _get_data_mask(self):
        resolution = RasterDataset(next(item for item in self.lof if item)[0], product=self.product[0]).native_dim
        native_coord = RasterDataset(next(item for item in self.lof if item)[0]).zone_coord
        oc_m_name = None
        mask_key_val = None
        layer = None
        wat_mask = np.load('./f4p_utilities/Water_Mask_005.npy')
        # in the case where geo extension is not global, resolution must be RESCALED to global prior to get wmask!!!
        if native_coord not in [None, [-90, 90, -180, 180]]:
            step = (self.zc[1] - self.zc[0]) / float(resolution[0])
            resolution = [int(np.ceil(180 / step)), int(np.ceil(360 / step))]

        if wat_mask.shape != resolution:
            zoom_factor = [float(resolution[0]) / float(wat_mask.shape[0]),
                           float(resolution[1]) / float(wat_mask.shape[1])]
            wat_mask = zoom(wat_mask, zoom_factor, mode='nearest', order=0, cval=np.nan)

        if self.zc not in [None, [-90, 90, -180, 180]]:
            if not self.extract:
                wat_mask = sf.reshape_data(wat_mask, self.zc, [-90, 90, -180, 180])

            else:
                wat_mask = None

        if self.ecv == 'chl-a':
            wat_mask[np.isnan(wat_mask)] = -1.
            wat_mask[wat_mask > 0] = np.nan
            wat_mask *= -1.
            oc_m_name = self.oc_mask_name
            layer = 'prov_num'
            if self.zn not in [None, 'Global']:
                code = self.dic.prov_name2code[self.zn]
                mask_key_val = self.dic.province_values[code]

        self.mask = [oc_m_name, layer, mask_key_val, wat_mask]

    def _get_lc_data(self, year, res):
        if int(year) < 1992:
            year = '1992'
        if int(year) > 2015:
            year = '2015'

        if self.lc_file_name is not None:
            rd_lc = RasterDataset(self.lc_file_name)
            lc_data = rd_lc.get_data(year, zone_coord=self.zc, mask_param=self.mask, extract=self.extract,
                                     neigh=self.neigh)
        else:
            rd_lc = RasterDataset(self.dic.LC_file_names[self.lc_type][self.dic.LC_res2Idx[res]])
            lc_data = rd_lc.get_data(year, zone_coord=self.zc, mask_param=self.mask,
                                     extract=self.extract, neigh=self.neigh)
        return lc_data
