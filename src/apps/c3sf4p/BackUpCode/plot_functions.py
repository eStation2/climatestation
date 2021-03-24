# ###############################################################################
# version:          R1.3.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    21 Oct 2015                                                 #
# property of:      JRC                                                         #
# purpose:          main library containing the functions for generating        #
#                   Plots for global variables.                                 #
#             --------------------------------------------------                #
# last edit:        17 Apr 2020                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################
import stat_functions as sf
import matplotlib.pyplot as plt
import colormaps as my_cmaps
import matplotlib.cm as cm
from mpl_toolkits.basemap import Basemap, shiftgrid
import numpy as np
from scipy import stats  # , interpolate
from matplotlib import colors
import copy
import os
from matplotlib.colors import ListedColormap
import ECV_dictionary
from datetime import datetime
from TaylorDiagram import TaylorDiagram


def plot_comparison_stat(xx, yy, err_y=None, is_anomaly=False, x_axis_label=None, y_axis_label=None, dataset_label=None,
                         ecv_name=None, figure_title=None, x_tick_labels=None, period=None, is_local=False, t_res=None,
                         is_save=0, is_show=2, str_output_fname=None):
    """
    :param xx:              ->  x-array 1-D for x axis (output of stat_function.get_statistics)
    :param yy:              ->  y-array N-D where N = number of different dataset to plot; each column represents
                                the time series statistics for a dataset(output of stat_function.get_statistics)
    :param err_y            ->  if y variable == mean -> err_y = stddev(y) else err_y = None
    :param is_anomaly:      ->  True/False if True calculate the moving_average_index!
    :param x_axis_label:    ->  STRING; label for x-axis (typically: Time, Month-name, year, etc...)
    :param y_axis_label:    ->  STRING; is the required statistical quantity key-word (ex: Average, Max, Min ...)
    :param dataset_label:   ->  STRING; foreach dataset is the "name of the dataset" to plot in legend
    :param ecv_name         ->  STRING; identifies the ECV
    :param figure_title:    ->  STRING; title to be printed on the canvas
    :param x_tick_labels:   ->  LIST OF STRINGS; fill ticks in x-axis typically each label is a date for the time series
    :param period           ->  INT; specify the period of the moving average, default=6
    :param is_local         ->  BOOL; flags if the plot is relative to a local site
    :param t_res:            ->  STRING; temporal resolution, this is used to parametrize the running mean
    :param is_save:         ->  INT; 0: don't save the figure, 2: save figure
    :param is_show:         ->  INT; 0: don't show the figure, 2: show figure
    :param str_output_fname:->  figure save name
    :return:
    """
    sz = yy.shape[1]

    '''
    ************************************************************
    # set the markers and the colors wrt data number
    ************************************************************
    '''
    mrkr = ['s', 'o', 'd', '^', '>', '<', "$" + '\clubsuit' + "$", 'v', '*', 'p', '^', 'D', 'H',
            "$" + '\spadesuit' + "$",
            "$" + '\heartsuit' + "$", 'h', "$" + '\circ' + "$", "$" + '\Theta' + "$", "$" + '\Phi' + "$",
            "$" + '\\bigodot' + "$",
            "$" + '\\bigotimes' + "$", "$" + '\\bigoplus' + "$", "$" + '\\bowtie' + "$"]

    # mrkr = ['o', 'd', '^', '>', '<', "$" + '\clubsuit' + "$", 'v', '*', 'p', '^', 'D', 'H',
    #         "$" + '\spadesuit' + "$",
    #         "$" + '\heartsuit' + "$", 'h', "$" + '\circ' + "$", "$" + '\Theta' + "$", "$" + '\Phi' + "$",
    #         "$" + '\\bigodot' + "$",
    #         "$" + '\\bigotimes' + "$", "$" + '\\bigoplus' + "$", "$" + '\\bowtie' + "$"]

    cmap = cm.get_cmap('Set1')
    if sz < len(mrkr):
        flag_mrk = True
        if sz == 1:
            kolors = ['b']
        elif sz <= 5:
            kolors = ['k', 'r', 'b', 'g', 'm']
            # kolors = ['r', 'b', 'g', 'm']
        else:
            kolors = cmap(np.linspace(0, 1, sz))
    else:
        flag_mrk = False
        mrkr = None
        kolors = cmap(np.linspace(0, 1, sz))

    linw = 1
    if is_local:
        flag_mrk = False
        mrkr = None
        linw = 2

    step = int(np.round(yy.shape[0] / 40.)) + 1

    '''
    ************************************************************
    # Check the labels (if exist)
    ************************************************************
    '''
    if x_axis_label is None:
        x_label = 'Time'
    else:
        x_label = str(x_axis_label)
    if y_axis_label is None:
        if sz > 1:
            y_label = 'Value Over The Same Cells'
        else:
            y_label = 'Value'
    else:
        if sz > 1:
            y_label = str(y_axis_label) + ' Over The Same Cells'
        else:
            y_label = str(y_axis_label)

    if dataset_label is None:
        plot_label = []
        for item in range(sz):
            plot_label.append('data-' + str(item + 1))
    else:
        plot_label = dataset_label

    if figure_title is None:
        title = 'Statistical Comparison\n'
    else:
        title = str(figure_title) + '\n'
    if x_tick_labels is None:
        time_labels = xx
    else:
        time_labels = x_tick_labels

    if period is None:
        period = 6
    '''
    *****************  PLOT  *********************************
    '''
    plt.figure(figsize=(12, 6), facecolor='w', edgecolor='k')
    plt.xlabel(x_label)  # , fontsize=12)
    plt.ylabel(y_label)  # , fontsize=12)
    plt.grid()
    plt.minorticks_on()
    if ecv_name is 'Chl-a':
        plt.yscale('log')
        plt.grid(True, which="both", axis="y")
    plt.xticks(xx[::step], time_labels[::step], rotation='80')  # , fontsize=12)
    plt.yticks()  # fontsize=12)
    lb2save = ''
    for item in range(sz):
        temporal_step = ' steps'
        if t_res[item] is not None:
            if t_res[item] == '001M':
                temporal_step = str(period) + ' months'
            elif t_res[item] == '010D':
                if period % 3 == 0:
                    temporal_step = str(int(period / 3)) + ' months'
                else:
                    temporal_step = str(int(period * 10)) + ' days'
            elif t_res[item] == '001D':
                temporal_step = str(period) + ' days'
            elif t_res[item] == '008D':
                temporal_step = str(period) + ' weeks'
            elif t_res[item] == '015D':
                temporal_step = str(period / 2) + ' months'

        try:
            lb = ECV_dictionary.sens_dic[plot_label[item]]
        except KeyError:
            lb = plot_label[item]
        lb2save += lb + '_'

        if is_anomaly:
            y_rm = sf.nan_moving_average(yy[:, item], period)
            x_rm = np.linspace(period / 2, len(yy) - period / 2, len(y_rm))
            if np.size(yy[:, item]) > 1:
                plt.plot(xx, yy[:, item], ls='-', lw=3, alpha=0.2, color=kolors[item], label=lb)

                y_to_fit = copy.copy(yy[:, item])
                y_to_fit[np.isnan(y_to_fit)] = np.nanmean(y_to_fit)
                slope, intercept, r_value, p_value, std_err = stats.linregress(xx, y_to_fit)
                line = slope * xx + intercept
                if intercept > 0:
                    signum = '+'
                else:
                    signum = ''

                ma_label = 'Moving Average: ' + temporal_step
                tr_label = 'Trend: ' + str("{:.2e}".format(slope)) + 'x ' + signum + \
                           str("{:.2e}".format(intercept))

                # plt.plot(x_rm, y_rm, color=kolors[item], ls='--', lw=3, label=ma_label)
                # plt.plot(xx, line, color=kolors[item], ls='-', alpha=0.8, lw=2, label=tr_label)
                plt.plot(x_rm, y_rm, color=kolors[item], ls='--', lw=3, label=ma_label)
                plt.plot(xx, line, color=kolors[item], ls='-', alpha=0.8, lw=2, label=tr_label)
            else:
                plt.plot(xx, yy[:, item], marker=mrkr[item], ms=7, color=kolors[item], label=lb)

        else:
            if flag_mrk:
                plt.plot(xx, yy[:, item], marker=mrkr[item], ms=4, color=kolors[item], mec=kolors[item], label=lb)
                # plt.plot(xx, yy[:, item], marker=mrkr[item], ms=4, label=lb)
            else:
                plt.plot(xx, yy[:, item], color=kolors[item], lw=linw, label=lb)
    nc = sz

    if err_y is not None:
        nc += 1
        std = np.sqrt(np.nansum(err_y, axis=1)) / sz
        avg = np.nanmean(yy, axis=1)
        plt.fill_between(xx, avg + std, avg - std, color=[0.78, 0.87, 1], alpha=0.5, label='StDev')
    #
    # leg = plt.legend(bbox_to_anchor=(0.5, 1.1), loc='center', fontsize=10, numpoints=1, ncol=nc)
    leg = plt.legend(bbox_to_anchor=(0.5, 1.1), loc='center', numpoints=1, ncol=nc)
    leg.get_frame().set_linewidth(0.0)

    title += '\n \n'
    if is_anomaly:
        title += '\n \n'

    plt.title(title, fontsize=12, fontweight='bold')
    plt.tight_layout()

    if str_output_fname is None:
        dsl = ''
        for lab in dataset_label:
            dsl += lab + '_'
        save_name = figure_title.replace('\n', '-') + '_' + dsl
        str_output_fname = ECV_dictionary.path_to_save + os.sep + str(save_name + '_' + y_label).replace(' ', '_') \
            .replace(';', '').replace(':', '') + '_' + time_labels[0] + '_' + time_labels[-1] \
            + '_' + lb2save[:-1] + ECV_dictionary.fig_ext

    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        if is_save == 2:
            plt.savefig(str(str_output_fname))
        plt.show()
    else:
        plt.close()


def plot_comparison_stat2(xx, yy, err_y=None, is_anomaly=False, x_axis_label=None, y_axis_label=None,
                          dataset_label=None, figure_title=None, x_tick_labels=None, is_local=False, ecv_name=None,
                          t_res=None, is_save=0, is_show=2, str_output_fname=None):
    """
    :param xx:              ->  x-array 1-D for x axis (output of stat_function.get_statistics)
    :param yy:              ->  y-array N-D where N = number of different dataset to plot; each column represents
                                the time series statistics for a dataset(output of stat_function.get_statistics)
    :param err_y            ->  if y variable == mean -> err_y = stddev(y) else err_y = None
    :param is_anomaly:      ->  True/False if True calculate the moving_average_index!
    :param x_axis_label:    ->  STRING; label for x-axis (typically: Time, Month-name, year, etc...)
    :param y_axis_label:    ->  STRING; is the required statistical quantity key-word (ex: Average, Max, Min ...)
    :param dataset_label:   ->  STRING; foreach dataset is the "name of the dataset" to plot in legend
    :param figure_title:    ->  STRING; title to be printed on the canvas
    :param x_tick_labels:   ->  LIST OF STRINGS; fill ticks in x-axis typically each label is a date for the time series
    :param is_local         ->  BOOL; flags if the plot is relative to a local site
    :param t_res:           ->  STRING; temporal resolution, this is used to parametrize the running mean
    :param is_save:         ->  INT; 0: don't save the figure, 2: save figure
    :param is_show:         ->  INT; 0: don't show the figure, 2: show figure
    :param ecv_name:
    :param str_output_fname:  ->  figure save name
    :return:
    """
    sz = len(yy)
    '''
    ************************************************************
    # Check the labels (if exist)
    ************************************************************
    '''
    if x_axis_label is None:
        x_label = 'Time'
    else:
        x_label = str(x_axis_label)
    if y_axis_label is None:
        y_label = 'Value'
    else:
        y_label = str(y_axis_label)

    if dataset_label is None:
        plot_label = []
        for item in range(sz):
            plot_label.append('data-' + str(item + 1))
    else:
        plot_label = dataset_label

    if figure_title is None:
        title = 'Statistical Comparison\n'
    else:
        title = str(figure_title) + '\n'
    if x_tick_labels is None:
        time_labels = None
    else:
        time_labels = x_tick_labels

    xtot = []
    for item in range(sz):
        for k in xx[item]:
            xtot.append(k)
    xu = np.unique(xtot)
    y2 = np.full([len(xu), sz], fill_value=np.nan)

    for item in range(sz):
        y2[xx[item], item] = yy[item]

    ''' 
    ************************************************************
    # set the markers and the colors wrt data number
    ************************************************************
    '''
    mrkr = ['s', 'o', 'd', '^', '>', '<', "$" + '\clubsuit' + "$", 'v', '*', 'p', '^', 'D', 'H',
            "$" + '\spadesuit' + "$",
            "$" + '\heartsuit' + "$", 'h', "$" + '\circ' + "$", "$" + '\Theta' + "$", "$" + '\Phi' + "$",
            "$" + '\\bigodot' + "$",
            "$" + '\\bigotimes' + "$", "$" + '\\bigoplus' + "$", "$" + '\\bowtie' + "$"]
    # mrkr = ['o', 'd', '^', '>', '<', "$" + '\clubsuit' + "$", 'v', '*', 'p', '^', 'D', 'H',
    #         "$" + '\spadesuit' + "$",
    #         "$" + '\heartsuit' + "$", 'h', "$" + '\circ' + "$", "$" + '\Theta' + "$", "$" + '\Phi' + "$",
    #         "$" + '\\bigodot' + "$",
    #         "$" + '\\bigotimes' + "$", "$" + '\\bigoplus' + "$", "$" + '\\bowtie' + "$"]
    cmap = cm.get_cmap('Set1')
    if sz < len(mrkr):
        flag_mrk = True
        if sz <= 5:
            kolors = ['k', 'r', 'b', 'g', 'm']
            # kolors = ['r', 'b', 'g', 'm']
        else:
            kolors = cmap(np.linspace(0, 1, sz))
    else:
        flag_mrk = False
        mrkr = None
        kolors = cmap(np.linspace(0, 1, sz))

    linw = 1
    if is_local:
        flag_mrk = False
        mrkr = None
        linw = 2

    step = int(np.round(len(time_labels) / 40.)) + 1
    period = 6

    '''
    *****************  PLOT  *********************************
    '''

    plt.figure(figsize=(12, 6), facecolor='w', edgecolor='k')
    plt.xlabel(x_label, fontsize=12)
    plt.ylabel(y_label, fontsize=12)
    plt.minorticks_on()
    plt.grid()
    xt = np.arange(len(time_labels))

    aa = []
    for item in range(sz):
        aa.append(np.nanmin(xx[item]))
    a = min(aa)
    if a < 0:
        a = 0
    plt.xlim([a, 1 + max(xt)])

    plt.xticks(xt[a::step], time_labels[a::step], rotation='80', fontsize=12)
    plt.yticks(fontsize=12)

    for item in range(sz):
        temporal_step = ' steps'
        if t_res[item] is not None:
            if t_res[item] == '001M':
                temporal_step = str(period) + ' months'
            elif t_res[item] == '010D':
                if period % 3 == 0:
                    temporal_step = str(int(period / 3)) + ' months'
                else:
                    temporal_step = str(int(period * 10)) + ' days'
            elif t_res[item] == '001D':
                temporal_step = str(period) + ' days'
            elif t_res[item] == '008D':
                temporal_step = str(period) + ' weeks'
        try:
            lb = ECV_dictionary.sens_dic[plot_label[item]]
        except KeyError:
            lb = plot_label[item]  # + '-' + str(item)
        if is_anomaly:
            y_rm = sf.nan_moving_average(yy[item], period)
            x_rm = np.linspace(period / 2, len(yy[item]) - period / 2, len(y_rm))
            if y2[:, item].shape[0] > 1:
                plt.plot(xu, y2[:, item], ls='-', lw=2, alpha=0.2, color=kolors[item], label=lb)
                # slope, intercept, r_value, p_value, std_err = stats.linregress(xu, y2[:, item])
                # line = slope * xu + intercept

                xline = np.arange(len(yy[item]))
                slope, intercept, r_value, p_value, std_err = stats.linregress(xline, yy[item])

                line = slope * xline + intercept
                if intercept > 0:
                    signum = '+'
                else:
                    signum = ''

                ma_label = 'Moving Average: ' + temporal_step
                tr_label = 'Trend: ' + str("{:.2e}".format(slope)) + 'x ' + signum + \
                           str("{:.2e}".format(intercept))

                diff = int(abs(len(x_rm) - len(xx[item])) / 2.)
                xrm = np.array(xx[item])[diff:-diff]
                # print len(xx[item][diff:-diff]), len(x_rm)
                # exit()
                plt.plot(xrm, y_rm, color=kolors[item], ls='--', lw=3, label=ma_label)
                # plt.plot(xu, line, color=kolors[item], ls='-', alpha=0.8, lw=2, label=tr_label)
                plt.plot(xx[item], line, color=kolors[item], ls='-', alpha=0.8, lw=2, label=tr_label)

            else:
                plt.plot(xu, y2[:, item], marker=mrkr[item], ms=7, color=kolors[item], label=lb)
        else:
            if flag_mrk:
                # print('here!')
                # plt.plot(xu, y2[:, item], marker=mrkr[item], ms=4, label=lb)
                plt.plot(xu, y2[:, item], marker=mrkr[item], ms=4, ls='-', lw=2,
                         color=kolors[item], mec=kolors[item], label=lb)
            else:
                plt.plot(xu, y2[:, item], color=kolors[item], lw=linw, label=lb)
    if ecv_name == 'Chl-a':
        plt.yscale('log')
        plt.grid(True, which="both", axis="y")
    nc = sz

    if ecv_name != 'Chl-a':
        if err_y is not None:
            nc += 1
            m = []
            for i in range(sz):
                m.append(max(xx[i]))
            std_m = np.full([max(m) + 1, sz], fill_value=np.nan)
            yy_m = np.full([max(m) + 1, sz], fill_value=np.nan)

            for i in range(sz):
                std_m[xx[i], i] = np.array(err_y[i])
                yy_m[xx[i], i] = np.array(np.squeeze(yy[i]))

            std = np.sqrt(np.nanmean(std_m, axis=1))
            avg = np.nanmean(yy_m, axis=1)
            x_plot = np.arange(np.max(m) + 1)
            plt.fill_between(x_plot, avg + std, avg - std, color=[0.78, 0.87, 1], alpha=0.5,
                             label='StDev')

    leg = plt.legend(bbox_to_anchor=(0.5, 1.1), loc='center', fontsize=10, numpoints=1, ncol=nc)
    leg.get_frame().set_linewidth(0.0)
    title += '\n\n'
    if is_anomaly:
        title += '\n \n'

    plt.title(title, fontsize=12, fontweight='bold')
    plt.tight_layout()

    if str_output_fname is None:
        save_name = figure_title.replace('\n', '-')
        str_output_fname = ECV_dictionary.path_to_save + os.sep + \
            str(save_name + '_' + y_label).replace(' ', '_').replace(';', '').replace(':', '') + '_' + \
            time_labels[0] + '_' + time_labels[-1] + ECV_dictionary.fig_ext

    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        if is_save == 2:
            plt.savefig(str(str_output_fname))
        plt.show()
    else:
        plt.close()


def plot_1o1(data_1, data_2, date=None, ecv_type=None, x_label=None, y_label=None, figure_title=None, is_save=0,
             is_show=2, str_output_fname=None):
    """
    :param data_1:              -> np.array dataset 1
    :param data_2:              -> np.array dataset 2
    :param date:                -> date str
    :param ecv_type:            -> type of ECVs
    :param x_label:             -> STRING; label for x-axis (typically: Name of dataset-1)
    :param y_label:             -> STRING; label for y-axis (typically: Name of dataset-2)
    :param figure_title:        -> STRING; title to be printed on the canvas
    :param is_save:             -> INT; 0: don't save the figure, 2: save figure
    :param is_show:             -> INT; 0: don't show the figure, 2: show figure
    :param str_output_fname:    ->  figure save name
    """
    if np.shape(data_1) != np.shape(data_2):
        raise Exception('Dataset must have te same dimensions')

    '''
    ************************************************************
    # Check the labels (if assigned)
    ************************************************************
    '''
    if x_label is None:
        x_label = 'dataset(1)'
    else:
        try:
            x_label = ECV_dictionary.sens_dic[str(x_label)]
        except KeyError:
            x_label = str(x_label)
    if y_label is None:
        y_label = 'dataset(2)'
    else:
        try:
            y_label = ECV_dictionary.sens_dic[str(y_label)]
        except KeyError:
            y_label = str(y_label)
    if figure_title is None:
        figure_title = 'Density Scatter Plot'

    sz = data_1.shape
    if len(sz) == 2:
        n_plots = 1
        data_1 = [data_1]
        data_2 = [data_2]
        figure_title = [figure_title]
    else:
        n_plots = sz[0]

    if date is None:
        date = []
        for i in range(n_plots):
            date.append('')
    '''
    ***************  SPATIAL CONSISTENCY! **********************
    '''
    for sp in range(n_plots):
        # print(figure_title[sp])
        _d1 = data_1[sp]
        _d2 = data_2[sp]
        mask = _d1 + _d2

        d1 = _d1[~np.isnan(mask)]
        d2 = _d2[~np.isnan(mask)]

        # lambda_c = sf.get_lambda(d1, d2)

        # if ecv_type == 'LST':
        #     min_v = 200
        #     max_v = 330
        if ecv_type in ['Chl-a', 'AOD']:
            # print '*************************'
            max_v = np.ceil(min(np.nanmax(d1), np.nanmax(d2)) / 2)
            min_v = np.round(min(np.nanmin(d1), np.nanmin(d2)))
            if max_v < min_v:
                max_v *= 2
                if max_v < min_v:
                    max_v += min_v
        else:
            min_v = min(np.nanmin(d1), np.nanmin(d2))
            max_v = max(np.nanmax(d1), np.nanmax(d2))
            if np.logical_and(max_v < 1, max_v > 0):
                max_v = 1
                min_v = 0

            # x_lim = [xmin, xmax]
            # max_v = 1.
            # min_v = 0.

        if str_output_fname is not None:
            save_name = str_output_fname
        else:
            save_name = ECV_dictionary.path_to_save + 'ScatterDensity_' + \
                        x_label.replace(' ', '-').replace('$', '').replace('\\', '') + '_' + \
                        y_label.replace(' ', '-').replace('$', '').replace('\\', '') + '_' + \
                        date[sp] + ECV_dictionary.fig_ext

        mask = d1 + d2
        x_line = d1[~np.isnan(mask)]
        y_line = d2[~np.isnan(mask)]
        xx = np.linspace(min_v, max_v, 10)
        slope, intercept, r_value, p_value, std_err = stats.linregress(x_line, y_line)

        slp = np.full_like(xx, fill_value=slope)
        itc = np.full_like(xx, fill_value=intercept)

        line = slp * xx + itc

        rmsd = np.sqrt(np.nansum(np.square(np.array(data_1).flatten() - np.array(data_2).flatten())) /
                       np.count_nonzero(~np.isnan((np.array(data_1) - np.array(data_2)))))

        if data_1[sp].size > 360 * 720:
            nbins = 101
            thr = 2.1
        else:
            nbins = 101
            thr = 0.5

        # print(thr)
        # exit()

        h, x_edges, y_edges = np.histogram2d(x_line, y_line, bins=nbins)
        h = np.rot90(h)
        h = np.flipud(h)

        # h_mask = np.ma.masked_where(h <= 2, h)  # Mask pixels with a value of zero
        h_mask = np.ma.masked_where(h <= 0, h)  # Mask pixels with a value of zero

        # Log
        h_mask = np.log10(h_mask)
        h_mask = np.ma.masked_where(h_mask <= thr, h_mask)  # Mask pixels with a value of 10^thr

        bias = np.nanmean(d1) - np.nanmean(d2)

        txt_1 = 'Slope=' + str("{:.3f}".format(slope)) + '\n'
        txt_2 = 'Intercept=' + str("{:.3f}".format(intercept)) + '\n'
        txt_3 = 'R$^{2 }$=' + str("{:.3f}".format(r_value ** 2)) + '\n'
        txt_4 = 'RMSD=' + str("{:.3f}".format(rmsd)) + '\n'
        txt_5 = 'BIAS=' + str("{:.3f}".format(bias))
        # txt_5 = '${\lambda}$=' + str("{:.3f}".format(lambda_c))
        lbl = txt_1 + txt_2 + txt_3 + txt_4 + txt_5

        txtname = save_name.replace('.png', '_PARAMS.csv')

        if os.path.exists(txtname):
            fid = open(txtname, 'r+')
        else:
            fid = open(txtname, 'w')

        wline = str("{:.3f}".format(slope)) + ',' + str("{:.3f}".format(intercept)) + ',' + \
                str("{:.3f}".format(r_value ** 2)) + ',' + str("{:.3f}".format(rmsd)) + ',' + \
                str("{:.3f}".format(bias)) + '\n'

        fid.writelines(wline)
        fid.close()
        vmax = np.percentile(h_mask, 99)
        cb_ticks = np.linspace(np.nanmin(h_mask), vmax+1, 10)

        cb_tick_labels = []
        for tk in cb_ticks:
            cb_tick_labels.append(str(round(10. ** tk, -3)))

        # for tt in cb_tick_labels:
        #     print(round(float(tt), -3))
        # exit()

        # color_map = cm.get_cmap('jet')
        plt.figure(figsize=(7, 6), facecolor='w', edgecolor='k')
        plt.grid()
        # color_map = my_cmaps.parula()
        color_map = my_cmaps.viridis()
        # color_map = my_cmaps.inferno()
        # color_map = cm.get_cmap('hot_r')

        plt.pcolormesh(x_edges, y_edges, h_mask, cmap=color_map, vmax=vmax)

        cb = plt.colorbar(aspect=30, ticks=cb_ticks)
        cb.ax.set_yticklabels(cb_tick_labels)
        cb.ax.set_ylabel('N', fontsize=12, rotation='horizontal')
        plt.plot(xx, xx, color=[0, 0, 0], ls='-', lw=2, label=None)
        plt.plot(xx, line, color=[1, 0, 1], ls='-', lw=3, label=lbl)
        plt.xlim([min_v, max_v])
        plt.ylim([min_v, max_v])
        cb.ax.tick_params(labelsize=10)
        plt.xticks(fontsize=12)
        plt.yticks(fontsize=12)
        plt.minorticks_on()
        plt.xlabel(x_label, fontsize=12)
        plt.ylabel(y_label, fontsize=12)
        plt.title(figure_title[sp] + '\n', fontsize=14, fontweight='bold')
        plt.legend(loc=2, fontsize=10, numpoints=1, shadow=True)
        plt.grid()
        plt.tight_layout()

        # plt.show()
        # exit()

        fig = plt.gcf()
        if is_show == 2 and is_save == 0:
            fig.canvas.manager.show()
        elif is_show == 0 and is_save == 2:
            plt.savefig(save_name)
            plt.close()
        elif is_show == 2 and is_save == 2:
            fig.canvas.manager.show()
            plt.savefig(save_name)
        elif is_show == 1:
            if is_save == 2:
                plt.savefig(save_name)
            plt.show()
        else:
            plt.close()


def plot_map(data_set, date=None, sensor_name=None, product=None, ecv_type=None, plot_type=None, figure_title=None,
             zone_name=None, zone_coord=None, is_save=0, is_show=2, water_mask=None, lc_label=None, is_absolute=False,
             is_mk=True, str_output_fname=None):
    """
    :param  data_set:       -> NP-ARRAY; 2D data matrix to plot
    :param  date:           -> STRING; date to which the dataset refers: generic format: month-yyyy ex: jan-2001
    :param  sensor_name:    -> STRING; name of the sensor
    :param  product:        -> STRING; name of the attribute object of the figure
    :param  ecv_type        -> STRING; type of ECVs which product refers
    :param  plot_type:      -> STRING; user flag: Map(default) to plot map,
                                                  Clima to plot climatology,
                                                  Anomaly to plot anomalies
                                                  Slopes to plot map of slopes
    :param  figure_title    -> custom title of the figure
    :param  zone_name:      -> STRING; name of the zone, if None, zone_name = ''
    :param  zone_coord:     -> LIST; coordinates of the zone: [south_lat, north_lat, west_long, east_long]
    :param is_save:         -> INT; 0: don't save the figure, 2: save figure
    :param is_show:         -> INT; 0: don't show the figure, 2: show figure
    :param water_mask:      -> np.array; Water body
    :param lc_label         -> name of the LandCover class codified on the basis of the IPCC or LCCS conventions
    :param is_absolute      -> specifies if anomaly are absolute or relative
    :param is_mk            -> specifies if the trend to plot is relative to a Mann Kendall calculation
    :param str_output_fname:-> STRING; figure save name
    :return:  Produce the plot object
    """
    if date is None:
        date = ''
    else:
        date = str(date)
    if sensor_name is None:
        sensor = ''
    else:
        try:
            sensor = ECV_dictionary.sens_dic[str(sensor_name)]
        except KeyError:
            sensor = str(sensor_name)
    if product is None:
        prod = ''
    else:
        prod = str(product)
    if plot_type is None:
        plot_type = 'Map'
    else:
        plot_type = str(plot_type)
    if zone_name is None:
        zone_name = ''
    else:
        zone_name = str(zone_name)
    if zone_coord is not None:
        lat1 = zone_coord[0]  # south
        lat2 = zone_coord[1]  # north
        lon1 = zone_coord[2]  # west
        lon2 = zone_coord[3]  # east
    else:
        lat1 = -90.
        lat2 = 90.
        lon1 = -180.
        lon2 = 180.
    data_4_hist = 0
    if plot_type == 'Anomaly':
        data_4_hist = copy.copy(data_set)

    step_lat = float(lat2 - lat1) / data_set.shape[0]
    step_lon = float(lon2 - lon1) / data_set.shape[1]

    # ---------------------------------------------------------------------------------------------- #
    out_pkg = _get_map_params(ecv_type, product, lat1, lat2, lon1, lon2, plot_type, data_set, is_abs=is_absolute)

    data = out_pkg[0]
    c_map = out_pkg[1]
    max_v = out_pkg[2]
    min_v = out_pkg[3]
    unit = out_pkg[4]
    norm = out_pkg[5]
    cb_labels = out_pkg[6]
    cb_tick_labels = out_pkg[7]
    m = out_pkg[8]
    color_background = out_pkg[9]

    w = 9 * data.shape[1] / data.shape[0]
    h = 7.5

    if w > 15:
        w = 15
    plt.figure(figsize=(w, h), facecolor='w', edgecolor='k')
    m.drawcoastlines()
    m.drawcountries()

    par = mer = None
    try:
        par = np.array(np.arange(lat1, lat2, (lat2 - lat1) / 9), dtype='int')
        par_tf = True
    except ZeroDivisionError:
        par_tf = False

    try:
        mer = np.array(np.arange(lon1, lon2, (lon2 - lon1) / 9), dtype='int')
        mer_tf = True
    except ZeroDivisionError:
        mer_tf = False

    if par_tf:
        m.drawparallels(par, labels=[1, 0, 0, 0], fontsize=10)
    if ecv_type != 'AOD':
        if mer_tf:
            m.drawmeridians(mer, labels=[0, 0, 0, 1], fontsize=10)
    if color_background:
        w_map = colors.ListedColormap([[75 / 255., 102 / 255., 153 / 255.], [0.2, 0.2, 0.2]])
    else:
        w_map = colors.ListedColormap([[0.2, 0.2, 0.2], [0.4, 0.4, 0.4]])
    # if plot_type not in ['Anomaly', 'Trend', 'SymIndex']:
    #     w_map = colors.ListedColormap([[0.2, 0.2, 0.2], [0.4, 0.4, 0.4]])
    # else:
    #     w_map = colors.ListedColormap([[0.4, 0.4, 0.4], [0.2, 0.2, 0.2]])
    # w_map = colors.ListedColormap([[0.2, 0.2, 0.2], [0.4, 0.4, 0.4]])
    w_bounds = [0, 0.5, 1]
    w_norm = colors.BoundaryNorm(w_bounds, w_map.N)

    if water_mask is not None:
        water_mask[np.isnan(water_mask)] = 0

    if ecv_type == 'Chl-a':
        m.fillcontinents([0.2, 0.2, 0.2])
        longitude = np.linspace(lon1, lon2, data.shape[1])  # , endpoint=False)
        data0, lon0 = shiftgrid(lon2 + lon1, data, longitude, start=True)
        m.imshow(data0, cmap=c_map, norm=norm, vmin=min_v, vmax=max_v, interpolation='none')

    elif ecv_type == 'AOD':
        latitude = np.arange(lat1 + step_lat / 2, lat2 + step_lat / 2, step_lat)
        longitude = np.arange(lon1 + step_lon / 2, lon2 + step_lon / 2, step_lon)
        lat, lon = np.meshgrid(latitude, longitude)
        x, y = m(lon, lat)
        levels = np.linspace(min_v, max_v, 21)

        if water_mask is not None:
            m.contourf(x, y, np.flipud(water_mask).transpose(), cmap=w_map)
        m.contourf(x, y, data.transpose(), levels, cmap=c_map)
        # m.imshow(data, cmap=c_map) #, norm=norm, vmin=min_v, vmax=max_v, interpolation='none')
    else:
        if water_mask is not None:
            m.imshow(np.flipud(water_mask), cmap=w_map, norm=w_norm, vmin=0, vmax=1, interpolation='none')
        m.imshow(data, cmap=c_map, norm=norm, vmin=min_v, vmax=max_v, interpolation='none')

    if cb_labels is None:
        if plot_type == 'Trend':
            cb = m.colorbar(size=0.25, extend='both')
        else:
            cb = m.colorbar(size=0.25)
    else:
        if plot_type == 'Trend':
            off = (cb_labels[1] - cb_labels[0]) / 2.
            cb = m.colorbar(size=0.2, ticks=cb_labels + off, extend='both')
        else:
            cb = m.colorbar(size=0.25, ticks=cb_labels[::2])

    cb.ax.set_yticklabels(cb_tick_labels)

    add_lc = ''
    if lc_label not in [None, 'All Classes']:
        add_lc = ' Over ' + lc_label + ' Class'

    if figure_title is None:
        if plot_type == 'Map':
            txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + ' ' + date + add_lc
        elif plot_type == 'Clima':
            txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + ' Climatology ' + date + add_lc
        elif plot_type == 'Anomaly':
            if is_absolute:
                txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + ' Absolute Anomalies ' + date + add_lc
            else:
                txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + ' Relative Anomalies [%] ' + date + add_lc
        elif plot_type == 'Trend':
            if is_mk:
                txt = '\n' + sensor + ' ' + prod + ' ' + zone_name + '\n' + \
                      ' Significant Slopes of Mann Kendall Trend (' + unit + ') ' + date + add_lc
            else:
                txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + \
                      ' Significant Slopes of Robust Linear Model (' + unit + ') ' + date + add_lc
        elif plot_type == 'SymIndex':
            txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + ' Sym. Ind. of Agreement ' + \
                  date + add_lc
        else:
            txt = '\n' + sensor + ' ' + prod + ' \n' + zone_name + str(plot_type) + date + add_lc
    else:
        txt = figure_title + add_lc

    plt.title(str(txt) + '\n', fontsize=14)

    cb.ax.tick_params(labelsize=12)
    cb.set_label(unit, fontsize=12)

    cr_txt = u'\N{COPYRIGHT SIGN} JRC -' + str(datetime.now().year)
    ix, iy = m(lon1 + (lon2 - lon1) / 120, lat1 + (lat2 - lat1) / 9)
    plt.text(ix, iy, cr_txt, fontsize=16, verticalalignment='top', color='w')

    if str_output_fname is None:
        sname = txt.replace('\n', '').replace(' ', '_').replace('(in % year$^{-1}$)', '')
        str_output_fname = ECV_dictionary.path_to_save + os.sep + sname + ECV_dictionary.fig_ext
    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        plt.show()
    else:
        plt.close()

    if plot_type == 'Anomaly':
        if str_output_fname is not None:
            str_output_fname = ECV_dictionary.path_to_save + os.sep + 'hist_' + \
                               txt.replace('\n', '') + ECV_dictionary.fig_ext
        # txt = sensor + ' ' + prod + ' ' + zone_name + '\nRelative Anomalies [%] ' + date
        _plot_hist_anomaly(data_4_hist, max_v, min_v, fig_title=txt, is_save=is_save, is_show=is_show,
                           str_output_fname=str_output_fname)


def _plot_hist_anomaly(data_set, val_max, val_min, n_bin=51, fig_title=None, is_save=0, is_show=2,
                       str_output_fname=None):
    """
    :param data_set:        ->  np.array to histograms
    :param n_bin:           ->  set bin number, default = 51
    :param fig_title:       ->  Figure title
    :param is_save:         -> INT; 0: don't save the figure, 2: save figure
    :param is_show:         -> INT; 0: don't show the figure, 2: show figure
    :param str_output_fname:->  figure save name

    :return:
    """
    if fig_title is None:
        fig_title = 'Anomaly Histogram'

    data = np.flipud(data_set)
    tot_v = np.count_nonzero(~np.isnan(data))  # number of valid points
    tot_n = np.count_nonzero(np.isnan(data))  # number of non valid points
    avg = np.nanmean(data_set)
    std = np.nanstd(data)

    data_tmp = copy.copy(data)  # create a copy for further calculations
    data_tmp[data_tmp > (avg + 2 * std)] = np.nan  # set values above threshold  w.r.t. the mean to nan
    data_tmp[data_tmp < (avg - 2 * std)] = np.nan  # set values below threshold  w.r.t. the mean to nan
    n2 = tot_v - np.count_nonzero(~np.isnan(data_tmp))  # number of points out 2-sigmas
    data_tmp[data_tmp > (avg + std)] = np.nan  # set values above threshold  w.r.t. the mean to nan
    data_tmp[data_tmp < (avg - std)] = np.nan  # set values above threshold  w.r.t. the mean to nan
    n1 = tot_v - np.count_nonzero(~np.isnan(data_tmp))  # number of points out 1-sigmas

    p1 = 100 * n1 / tot_v  # % of points above n_sig sigmas
    p2 = 100 * n2 / tot_v  # % of points above n_sig sigmas

    data[data > val_max] = np.nan
    data[data < val_min] = np.nan
    data = data[~np.isnan(data)]  # remove nan from data

    # up to 2 sigmas
    x_min = val_min
    x_max = val_max

    ambiguous_variable_name_l = np.linspace(x_min, x_max, 11, dtype='int')
    x_string = 'Anomalies'  # within ' + str(n_sig) + '$\sigma$ [%]'
    text4 = 'Points Out 1$\sigma$: ' + str(p1) + '%\n'
    text5 = 'Points Out 2$\sigma$: ' + str(p2) + '%'
    text1 = 'Entries:      ' + str(tot_n) + '\n'
    text2 = 'Mean value:   ' + str(np.round(avg)) + '%\n'
    text3 = 'St.Dev:       ' + str(np.round(std)) + '%\n'

    text = text1 + text2 + text3 + text4 + text5

    y, x, patches = plt.hist(data, n_bin, histtype='step', normed=1, cumulative=True)
    s_title = fig_title

    plt.figure(figsize=(9, 10), facecolor='w', edgecolor='k')
    plt.clf()

    plt.subplot(211)
    h = plt.hist(data, n_bin, color='b')

    plt.grid()
    plt.minorticks_on()
    plt.xlim(x_min, x_max)
    plt.xticks(ambiguous_variable_name_l, ambiguous_variable_name_l, fontsize=0)
    plt.yticks(fontsize=12)

    plt.title(s_title + '\n', fontsize=16, fontweight='bold')

    props = dict(boxstyle='square', facecolor='w', alpha=0.8)
    # place a text box in upper left in axes coords
    plt.text(ambiguous_variable_name_l[0] + 3, np.max(h[0]) * 0.9, text, fontsize=12, verticalalignment='top',
             bbox=props)

    plt.subplot(212)
    plt.grid()
    plt.minorticks_on()
    plt.xlabel(x_string, fontweight='bold', fontsize=12)
    plt.ylabel('Frequency', fontweight='bold', fontsize=12)
    plt.xlim(x_min, x_max)
    plt.xticks(ambiguous_variable_name_l, ambiguous_variable_name_l, fontsize=16)
    plt.yticks(fontsize=12)
    plt.ylim(-0, 1.1)
    plt.plot(x[1:], y, linewidth=2, color='r', label='Cumulative Distribution Function')
    plt.legend(loc=2, fontsize=10)
    plt.subplots_adjust(wspace=0, hspace=0)

    if str_output_fname is None:
        str_output_fname = ECV_dictionary.path_to_save + os.sep + str(fig_title).replace(' ',
                                                                                         '_') + ECV_dictionary.fig_ext
        str_output_fname = str_output_fname.replace(' ', '_')
    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        if is_save == 2:
            plt.savefig(str(str_output_fname))
        plt.show()
    else:
        plt.close()


def plot_hovmoller(data, product, sensor_name=None, zone_name=None, zone_coord=None, latitude=True, x_tick_labels=None,
                   y_tick_labels=None, ecv_type=None, is_anomaly=False, is_save=0, is_show=2, is_absolute=False,
                   figure_title=None, min_v=None, max_v=None, str_output_fname=None):
    """
    :param data:            ->  np.array;   data
    :param product:         ->  STRING;     product name
    :param sensor_name:     ->  STRING;     Sensor Name
    :param zone_name:       ->  STRING;     Region name
    :param zone_coord:      ->  list;       Region coordinates
    :param latitude:        ->  BOOL;       True: hovmoller for latitude, False: hovmoller for longitude
    :param x_tick_labels:   ->  [STRINGS];  fill ticks in x-axis typically each label is a date for the time series
    :param y_tick_labels:   ->  [STRINGS];  fill ticks in x-axis typically each label is a coordinate
    :param ecv_type         ->  STRING;     type of ECVs which product refers
    :param is_anomaly:      ->  BOOL;       True/False: acts on color scale, colors and figure title
    :param is_save:         ->  INT;        0: don't save the figure, 2: save figure
    :param is_show:         ->  INT;        0: don't show the figure, 2: show figure
    :param str_output_fname:->  STRING;     figure save name
    :param figure_title:    ->  STRING;     figure title
    :param is_absolute:     ->  BOOL;       True => Anomaly in absolute scale; False => anomaly in relative [%] scale
    :param min_v:
    :param max_v:
    :return:
    """
    sz = data.shape
    if latitude:
        y_ax_lab = 'Latitude'
    else:
        y_ax_lab = 'Longitude'
    if zone_name is None:
        zn = ''
    else:
        zn = str(zone_name)
    if sensor_name is None:
        sn = ''
    else:
        try:
            sn = ECV_dictionary.sens_dic[sensor_name]
        except KeyError:
            sn = str(sensor_name)

    step = int(np.round(sz[1] / 40.))

    if step == 0:
        step = 1
    x_ax_lab = 'Time'
    x_tick = np.linspace(0, sz[1] - 1, sz[1])

    if figure_title is None:
        if is_anomaly:
            fig_title = 'Hovmoller Anomalies \n ' + sn + ' ' + product + ' ' + zn + ' '
        else:
            fig_title = 'Hovmoller ' + sn + '\n ' + product + ' ' + zn + ' '

        if zn == 'Custom':
            fig_title += 'Region: ' + zone_coord
    else:
        fig_title = figure_title

    if x_tick_labels is None:
        x_tick_labels = x_tick

    if y_tick_labels is None:
        y_tick_labels = range(0, sz[0], 10)

    if is_anomaly:
        plot_type = 'Anomaly'
    else:
        plot_type = 'Map'

    y_tick = np.linspace(0, sz[0], len(y_tick_labels))

    out_pkg = _get_map_params(ecv_type, product, None, 0, None, 0, plot_type, data.copy(), is_abs=is_absolute,
                              max_v=max_v, min_v=min_v)

    c_map = out_pkg[1]
    if max_v is None:
        max_v = out_pkg[2]
    if min_v is None:
        min_v = out_pkg[3]
    unit = out_pkg[4]
    cb_labels = out_pkg[6]
    cb_tick_labels = out_pkg[7]

    plt.figure(figsize=(15, 8), facecolor='w', edgecolor='k')
    plt.rcParams['axes.facecolor'] = [0.7, 0.7, 0.7]
    plt.axis()
    plt.ylim([0, sz[0]])

    plt.xticks(x_tick[::step], x_tick_labels[::step], rotation='80', fontsize=14)

    # plt.yticks(y_tick[::stepy], y_tick_labels[::2], fontsize=14)
    plt.yticks(y_tick, y_tick_labels, fontsize=14)

    plt.grid()
    plt.minorticks_on()
    plt.xlabel(x_ax_lab, fontsize=14)
    plt.ylabel(y_ax_lab, fontsize=14)

    # lv = np.linspace(min_v, max_v, 51, endpoint=True)

    data = np.flipud(data)

    if plot_type == 'Map':
        if ecv_type != 'Chl-a':
            plt.imshow(data, cmap=c_map, vmin=min_v, vmax=max_v, interpolation='none', aspect='auto')
        else:
            plt.imshow(data, cmap=c_map, vmin=min_v, vmax=max_v, interpolation='none', aspect='auto')
    else:
        plt.imshow(data, cmap=c_map, vmin=min_v, vmax=max_v, interpolation='none', aspect='auto')

    if cb_labels is not None:
        cb = plt.colorbar(ticks=cb_labels[::2])
        cb.ax.set_yticklabels(cb_tick_labels)
    else:
        cb = plt.colorbar()
    cb.set_label(unit, fontsize=16)
    cb.ax.tick_params(labelsize=16)
    plt.title(fig_title + '\n', fontsize=16)
    plt.tight_layout()

    if str_output_fname is None:
        str_output_fname = ECV_dictionary.path_to_save + os.sep + str(fig_title).replace(' ', '_').replace('\n', '') + \
                           '_' + y_ax_lab + '_' + x_tick_labels[0] + '_' + x_tick_labels[-1] + ECV_dictionary.fig_ext
        str_output_fname.replace(' ', '')
    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        plt.show()
    else:
        plt.close()
    plt.rcParams['axes.facecolor'] = [1, 1, 1]


def plot_gi(data_set, date=None, sensor_name=None, ref_name=None, product=None, is_mask=False, gi=None, ngi=None,
            dta=None, pid=None, zone_name=None, zone_coord=None, is_save=0, is_show=2, is_gamma=True, water_mask=None,
            str_output_fname=None):
    """
    :param data_set:        -> NP-ARRAY;  2D data matrix to plot
    :param date:            -> STRING;    date to which the dataset refers, generic format month-yyyy ex jan-2001
    :param sensor_name:     -> STRING;    name of the sensor
    :param ref_name:        -> STRING;    name of the reference sensor
    :param product:         -> STRING;    product name
    :param is_mask:         -> BOOLEAN;   hide (True) or show (False) gi>1
    :param gi:              -> STRING;    % of pixels with GI<1 considering the missing values
    :param ngi:             -> STRING;    % of pixels with GI<1 NOT considering the missing values
    :param dta:             -> STRING;    dta used for the calculation
    :param pid:             -> STRING;    pid used for the calculation
    :param  zone_name:      -> STRING;    name of the zone, if None, zone_name = ''
    :param  zone_coord:     -> LIST;      coordinates of the zone [south_lat, north_lat, west_long, east_long]
    :param is_save:         -> INT; 0:    don't save the figure, 2: save figure
    :param is_show:         -> INT; 0:    don't show the figure, 2: show figure
    :param is_gamma         -> BOOLEAN    True= plot gi distribution, FALSE= plot minimum distance of gamma
    :param water_mask       -> NP-ARRAY   water matrix  
    :param str_output_fname:  -> STRING;    figure save name
    :return:
    """

    if date is None:
        date = ''
    else:
        date = str(date)
    if sensor_name is None:
        sensor_name = ''
    else:
        try:
            sensor_name = ECV_dictionary.sens_dic[str(sensor_name)]
        except KeyError:
            sensor_name = str(sensor_name)
    if ref_name is not None:
        try:
            ref_name = ECV_dictionary.sens_dic[str(ref_name)]
        except KeyError:
            ref_name = str(ref_name)

    if product is None:
        product = ''
    else:
        product = str(product)
    if zone_name is None:
        zone_name = ''
    elif zone_name == 'Custom':
        zone_name = 'Region=' + str(zone_coord[0]) + 'S' + str(zone_coord[1]) + 'N' + str(zone_coord[2]) + 'W' + str(
            zone_coord[3]) + 'E'
    else:
        zone_name = str(zone_name)
    if zone_coord is not None:
        step = (zone_coord[1] - zone_coord[0]) / data_set.shape[0]
        # print step
        lat1 = zone_coord[0] + step / 2.  # south
        lat2 = zone_coord[1] + step / 2.  # north
        lon1 = zone_coord[2] + step / 2.  # west
        lon2 = zone_coord[3] + step / 2.  # east
    else:
        lat1 = -90.
        lat2 = 90.
        lon1 = -180.
        lon2 = 180.
    if gi is None:
        gi = ''
    else:
        gi = str(gi)
    if ngi is None:
        ngi = ''
    else:
        ngi = str(ngi)
    if pid is None:
        pid = ''
    else:
        pid = str(pid)
    if dta is None:
        dta = ''
    else:
        dta = str(dta)
    if is_mask:
        n_color = 11.
        shift = 1
    else:
        n_color = None
        shift = 0

    data = np.flipud(data_set)
    max_v = np.nanmax(data)
    if np.isnan(max_v):
        if is_gamma:
            max_v = 2.
        else:
            max_v = float(dta)

    cb_ticks = np.linspace(0, max_v, 11)
    cb_tick_labels = ''

    m = Basemap(projection='cyl', llcrnrlat=lat1, urcrnrlat=lat2, llcrnrlon=lon1, urcrnrlon=lon2, resolution='l')
    cost = 8
    w = cost * data.shape[1] / data.shape[0]
    h = cost
    if w > 15:
        w = 15
    plt.figure(figsize=(w, h), facecolor='w', edgecolor='k')
    m.drawcoastlines()

    par = np.array(np.arange(lat1, lat2, (lat2 - lat1) / 9), dtype='int')
    mer = np.array(np.arange(lon1, lon2, (lon2 - lon1) / 9), dtype='int')

    m.drawparallels(par, labels=[1, 0, 0, 0], fontsize=10)
    m.drawmeridians(mer, labels=[0, 0, 0, 1], fontsize=10)

    if is_gamma:
        cb_label = 'Gamma Index'
    else:
        cb_label = 'Distance [km]'
    val_max = None
    val_min = None
    txt = sensor_name + ': ' + product + ' \n' + zone_name + ' ' + date + '\n$D_{tol}$=' + str(dta) + 'km,' \
        + ' $\\varepsilon$=' + str(pid) + '%'
    if ref_name is not None:
        txt += '; Reference: ' + ref_name + '\n'
    else:
        txt += '\n'

    if is_gamma:
        c_map = my_cmaps.parula()
        if is_mask:
            c_map = my_cmaps.hide_gi(n_color, shift)
            cb_ticks = np.linspace(0., 1.1, 13)
            cb_tick_labels = ['0.', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.', '$\gamma$ > 1']
            val_max = 1.1
            val_min = 0.

        if water_mask is not None:
            w_map = colors.ListedColormap([[0.4, 0.4, 0.4], [0.2, 0.2, 0.2]])
            w_bounds = [0, 0.5, 1]
            w_norm = colors.BoundaryNorm(w_bounds, w_map.N)
            water_mask[np.isnan(water_mask)] = 0
            m.imshow(np.flipud(water_mask), cmap=w_map, norm=w_norm, vmin=0, vmax=1, interpolation='none')

        m.imshow(data, cmap=c_map, vmin=val_min, vmax=val_max, interpolation='none')
        if is_mask:
            cb = m.colorbar(size="3%", ticks=cb_ticks)
            cb.ax.set_yticklabels(cb_tick_labels)
        else:
            cb = m.colorbar(size='3%')
    else:
        c_map = my_cmaps.green_red()
        cb_ticks = list(np.linspace(0, float(dta), 8, endpoint=True))
        step = cb_ticks[-1] - cb_ticks[-2]

        val_min = 0
        val_max = float(dta) + step

        cb_ticks.append(val_max)
        cb_ticks.append(val_max + step)

        bounds = cb_ticks
        norm = colors.BoundaryNorm(bounds, c_map.N)

        cb_tick_labels = []
        for i in bounds[:-2]:
            cb_tick_labels.append(str("{:3.2f}".format(i)))
        cb_tick_labels.append('>' + str(dta))

        m.imshow(data, cmap=c_map, norm=norm, vmin=val_min, vmax=val_max, interpolation='none')
        cb = m.colorbar(size='2%', ticks=cb_ticks[:-1])
        cb.ax.set_yticklabels(cb_tick_labels)

    cb.set_label(cb_label, fontsize=12)
    cb.ax.tick_params(labelsize=12)
    plt.title(str(txt), fontsize=12)

    props = dict(boxstyle='square', facecolor=[1, 0.96, 0.89], alpha=0.8)

    if is_gamma:
        gi_txt = 'GIP = ' + str(gi) + '%' + '\nNGI = ' + str(ngi) + '%'
    else:
        gi_txt = 'GIP = ' + str(gi) + '%' + '\nMin. in reference position = ' + str(ngi) + '%'
    ix = lon1 + (lon2 - lon1) / 72
    iy = lat1 + (lat2 - lat1) / 7.2
    plt.text(ix, iy, gi_txt, fontsize=12, verticalalignment='top', bbox=props)

    if str_output_fname is None:
        if is_gamma:
            str_output_fname = ECV_dictionary.path_to_save + os.sep + 'GammaIndex_' + sensor_name + '_' + product + \
                               '_' + zone_name + '_' + date + '_' + str(pid) + '_' + str(dta) + ECV_dictionary.fig_ext
        else:
            str_output_fname = ECV_dictionary.path_to_save + os.sep + 'GI_Distance_' + sensor_name + '_' + product + \
                               '_' + zone_name + '_' + date + '_' + str(pid) + ECV_dictionary.fig_ext

    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        if is_save == 2:
            plt.savefig(str_output_fname)
        plt.show()
    else:
        plt.close()


def plot_apu(data_ref, apu, v_min=0, v_max=1, bins=20, figure_title=None, ref_label=None, is_save=0, is_show=2,
             str_output_fname=None):
    """
    :param data_ref:
    :param apu:
    :param v_min:
    :param v_max:
    :param bins:
    :param figure_title:
    :param ref_label:
    :param is_save:
    :param is_show:
    :param str_output_fname:
    :return:
    """

    if ref_label is None:
        x_ax_lab = 'X'
    else:
        x_ax_lab = 'Reference Value: ' + ref_label

    if figure_title is None:
        figure_title = 'APU comparison'
    x_max = v_max
    x_min = v_min
    if v_min is None:
        v_min = np.nanmin(data_ref)
        x_min = np.nanmin(data_ref)
    if v_max is None:
        v_max = np.nanmax(data_ref)
        x_max = np.nanmax(data_ref)

    if np.nanmax(data_ref) < 0.6 * v_max:
        x_max = np.nanmax(data_ref)

    _x = np.linspace(v_min, v_max, bins, endpoint=False)
    x = np.array(_x) + (float(v_max) - float(v_min)) / (2 * bins)

    a = apu[:, 0]
    p = apu[:, 1]
    u = apu[:, 2]
    # ru = apu[:, 3]
    s = apu[:, 4]

    data = data_ref[~np.isnan(data_ref)]

    fig, ax1 = plt.subplots(figsize=(8, 6), facecolor='w', edgecolor='k')  #
    ax2 = ax1.twinx()
    ax1.grid()
    ax1.minorticks_on()
    ax2.minorticks_on()
    lb1 = 'Accuracy; mean = ' + "{:1.3f}".format(np.nanmean(a))
    lb2 = 'Precision; mean = ' + "{:1.3f}".format(np.nanmean(p))
    lb3 = 'Uncertainty; mean = ' + "{:1.3f}".format(np.nanmean(u))
    lb4 = 'GCOS Requirements'

    ax2.hist(data, bins=bins, color='w', fc=[0.7, 0.7, 0.7, .4], ec=[0, 0, 0, 0.6], lw=1, label='Number of points')

    ax1.plot(x, a, 'k-', lw=2, ms=4, marker=None, mec='r', label=lb1)
    ax1.plot(x, p, 'r-', lw=2, ms=4, marker=None, mec='b', label=lb2)
    ax1.plot(x, u, 'g-', lw=2, ms=4, marker=None, mec='g', label=lb3)
    ax1.plot(x, s, 'm-', lw=2, label=lb4)

    ax1.set_xlabel(x_ax_lab, fontsize=12)
    ax1.set_ylabel('APU values', fontsize=12)
    ax2.set_ylabel('Frequency', fontsize=12)
    plt.xlim(x_min, x_max)
    # ax1.legend(bbox_to_anchor=(0., 1.02, 1., .102), loc=3, ncol=2, mode="expand", borderaxespad=0.)
    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    plt.legend(h1 + h2, l1 + l2, loc=0, fontsize=10, numpoints=1, framealpha=0.5)

    plt.title(figure_title + '\n', fontsize=14)
    plt.tight_layout()
    if str_output_fname is None:
        str_output_fname = ECV_dictionary.path_to_save + os.sep + str(figure_title) \
            .replace(' ', '_') + '_' + str(x_ax_lab).replace(':', '').replace(' ', '_') + ECV_dictionary.fig_ext
    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 1 and is_save == 0:
        plt.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    else:
        plt.close()


def plot_tcol(data_set, val_max=None, plot_type=0, fig_title='', zone_name='', zone_coord=None,
              is_save=0, is_show=2, water_mask=None, str_output_fname=None):
    """
    :param data_set:        ->  np.array;   data matrix to plot
    :param val_max:         -> float;       set color-scale max value
    :param plot_type:       -> INT;         select plot to produce in terms of physical meaning
                                             0 - plot triple collocation
                                             1 - plot collocated points
                                             2 - plot convergence map
    :param fig_title:       -> STRING;      title of the figure
    :param zone_name:       -> STRING;      Region name
    :param zone_coord:      -> LIST;        coordinates of the zone [south_lat, north_lat, west_long, east_long]
    :param water_mask:      -> np.array; Water body
    :param is_save:         -> INT; 0:    don't save the figure, 2: save figure
    :param is_show:         -> INT; 0:    don't show the figure, 2: show figure
    :param str_output_fname:  -> STRING;    figure save name
    :return:
    """
    # print val_max
    if zone_name is None:
        zone_name = ''
    else:
        zone_name = str(zone_name)
    if zone_coord is not None:
        lat1 = zone_coord[0]  # south
        lat2 = zone_coord[1]  # north
        lon1 = zone_coord[2]  # west
        lon2 = zone_coord[3]  # east
    else:
        lat1 = -90.
        lat2 = 90.
        lon1 = -180.
        lon2 = 180.

    data = np.flipud(data_set)
    # data = data_set

    fig_title = fig_title + '\n Zone = ' + zone_name
    m = Basemap(projection='cyl', llcrnrlat=lat1, urcrnrlat=lat2, llcrnrlon=lon1, urcrnrlon=lon2, resolution='l')

    w = 7.5 * data.shape[1] / data.shape[0]
    h = 7.5

    if w > 15:
        w = 15
    plt.figure(figsize=(w, h), facecolor='w', edgecolor='k')
    m.drawcoastlines()

    par = np.array(np.arange(lat1, lat2, (lat2 - lat1) / 9), dtype='int')
    mer = np.array(np.arange(lon1, lon2, (lon2 - lon1) / 9), dtype='int')

    m.drawparallels(par, labels=[1, 0, 0, 0], fontsize=10)
    m.drawmeridians(mer, labels=[0, 0, 0, 1], fontsize=10)

    w_map = colors.ListedColormap([[0.2, 0.2, 0.2], [0.4, 0.4, 0.4]])
    w_bounds = [0, 0.5, 1]
    w_norm = colors.BoundaryNorm(w_bounds, w_map.N)

    if water_mask is not None:
        water_mask[np.isnan(water_mask)] = 0

    if plot_type == 0:  # plot triple collocation
        c_map = my_cmaps.parula()
        if water_mask is not None:
            m.imshow(np.flipud(water_mask), cmap=w_map, norm=w_norm, vmin=0, vmax=1, interpolation='none')
        m.imshow(data, cmap=c_map, vmax=val_max, interpolation='none')
        c_bar = m.colorbar(size="2%")
        c_bar.set_label('Standard Deviation [%]', fontsize=10)
    elif plot_type == 1:  # plot collocated points
        c_map = ListedColormap([[1., 1., 1.], [1., 0.8627451, 0.85882353], [1., 0.7254902, 0.71764706],
                                [1., 0.45882353, 0.45490196], [0.9, 0.15294118, 0.15294118], [1., 0.16470588, 0.],
                                [1., 0.49411765, 0.], [1., 0.76862745, 0.], [1., 0.88627451, 0.], [1., 1., 0.],
                                [0, 0.8, 0]])
        cb_labels = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '$\geq$ 100']
        max_v = np.nanmax(data)
        if max_v > 100:
            max_v = 100
        cb_ticks = np.linspace(0., max_v, 12)
        # data[data == 0] = np.nan
        # if water_mask is not None:
        #     m.imshow(np.flipud(water_mask), cmap=w_map, norm=w_norm, vmin=0, vmax=1, interpolation='none')
        m.imshow(data, cmap=c_map, vmax=max_v, interpolation='none')
        c_bar = m.colorbar(size="2%", ticks=cb_ticks)
        c_bar.ax.set_yticklabels(cb_labels)
    else:  # elif plot_type == 2:  # plot convergence map
        c_map = ListedColormap([[0, 0.8, 0], [0.9, 0.9, 0], [0, 0.3, 1], [1, 0, 0]])
        cb_ticks = np.linspace(0, 3, 5)
        cb_labels = ['Full \nConvergent', 'Beta_y \nConvergent', 'Beta_z \nConvergent', 'Non \nConvergent']
        if water_mask is not None:
            m.imshow(np.flipud(water_mask), cmap=w_map, norm=w_norm, vmin=0, vmax=1, interpolation='none')
        m.imshow(data, cmap=c_map, vmin=0., vmax=3, interpolation='none')
        c_bar = m.colorbar(size="2%", ticks=cb_ticks)
        c_bar.ax.set_yticklabels(cb_labels)

    plt.title(str(fig_title) + '\n', fontsize=12)
    c_bar.ax.tick_params(labelsize=10)
    s_name = fig_title.replace('\n', '')
    if str_output_fname is None:
        str_output_fname = str(ECV_dictionary.path_to_save + s_name + ECV_dictionary.fig_ext).replace(' ', '_')

    cr_txt = u'\N{COPYRIGHT SIGN} JRC -' + str(datetime.now().year)
    ix, iy = m(lon1 + (lon2 - lon1) / 120, lat1 + (lat2 - lat1) / 9)
    plt.text(ix, iy, cr_txt, fontsize=16, verticalalignment='top', color='w')

    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))

        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        plt.show()
    else:
        plt.close()


def plot_ks(ks, pv, x_tick_labels=None, is_save=0, is_show=2):
    """
    :param ks:
    :param pv:
    :param x_tick_labels:
    :param is_save:
    :param is_show:
    :return:
    """

    x = np.linspace(1, len(ks) + 1, len(ks))

    plt.figure()
    plt.plot(x, ks, marker='s', ms=7, color='b', label='K-Stat')
    plt.minorticks_on()
    plt.xticks(x[::2], x_tick_labels[::2], rotation='80', fontsize=10)
    plt.grid()
    plt.legend()
    fig1 = plt.gcf()

    plt.figure()
    plt.plot(x, pv, marker='s', ms=7, color='r', label='P-Val')
    plt.minorticks_on()
    plt.xticks(x[::2], x_tick_labels[::2], rotation='80', fontsize=10)
    plt.grid()
    plt.legend()

    fig2 = plt.gcf()

    if is_show == 2 and is_save == 0:
        fig2.canvas.manager.show()
        fig1.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig2.canvas.manager.show()
        fig1.canvas.manager.show()
    else:
        plt.close()


def plot_taylor_diagram(correlation, stdev, sensor_name=None, sensor_ref=None, prod_name=None,
                        zone_name=None, date_time=None, temporal_labels=None, is_save=0, is_show=2,
                        lc_label=None, str_output_fname=None):
    """
    :param correlation:     -> ND-array: correlation coefficients
    :param stdev:           -> ND-array: stdev coefficients
    :param sensor_name:     -> LIST:     name of projects relative to correlation and stdev columns
    :param sensor_ref:      -> STRING:   name of chosen reference project
    :param prod_name:       -> STRING:   product name
    :param zone_name:       -> STRING:   Name of the region (Global, Europe, Africa, Custom, etc...)
    :param date_time:       -> STRING:   temporal information
    :param temporal_labels  -> LIST      temporal information for each point (is None fpr time series!)
    :param is_save:         -> INT; 0:   don't save the figure, 2: save figure
    :param is_show:         -> INT; 0:   don't show the figure, 2: show figure
    :param lc_label         -> name of the LandCover class codified on the basis of the IPCC or LCCS conventions
    :param str_output_fname:  -> STRING:   figure save name
    :return:
    """

    if zone_name is None:
        zone_name = ''

    np.seterr(all='ignore')  # ignore numpy warnings

    ax_lab = 'Standard Deviation (Normalized)'
    prod_label = prod_name  # + '/' + prod2_name

    max_std = np.round(np.nanmax(stdev) + 0.5)

    std_ref = 1.

    if ~np.isnan(max_std):
        threshold = max(max_std, 1.5)
    else:
        threshold = 1.5

    color = cm.get_cmap('jet')(np.linspace(0, 1, correlation.shape[0]))
    marks = ['o', 'd', 's', '>', '<', "$" + '\clubsuit' + "$", 'v', 'p', '^', 'D', 'H',
             "$" + '\spadesuit' + "$", 'h']

    j = 0
    marks_size = 9
    figure = plt.figure(figsize=(13, 10), facecolor='w', edgecolor='k')
    dia = TaylorDiagram(std_ref, fig=figure, thr=threshold, label=' ', flag_axis=ax_lab, set_grid=True)
    dia.add_sample(1, 1, marker='*', ms=15, ls='', mfc='r', mec='k', label='Reference')
    # for i, (stddev, corr_c, name) in enumerate(array):
    for i in range(stdev.shape[0]):
        if j + 1 > len(marks):
            j = 0
            marks_size += 1
        for nd in range(stdev.shape[1]):
            m = marks[nd]
            name = sensor_name[nd]  # + '-' + data_labels[i]
            if temporal_labels is not None:
                name += temporal_labels[i]
            if ~np.isnan(stdev[i, nd]):
                dia.add_sample(stdev[i, nd], correlation[i, nd], marker=m, ms=marks_size, ls='', mfc=color[i], mec='k',
                               label=name)
            j += 1

    figure.legend(dia.samplePoints[1:], [p.get_label() for p in dia.samplePoints[1:]],
                  numpoints=1, loc=0, fontsize=12, framealpha=0.5)

    contours = dia.add_contours(levels=5, colors='0.5')  # 5 levels
    dia.ax.clabel(contours, inline=1, fontsize=12, fmt='%.2f')
    t1 = "$\mathrm{Time-Series-Period:}$"  # r'\textbf{}'
    z1 = "$\mathrm{Region:}$"
    p1 = "$\mathrm{Products:}$"
    r1 = "$\mathrm{Reference:}$"
    lc = ''
    if lc_label is not None:
        lc = "$\mathrm{Land Class:}$" + ' ' + lc_label
    if date_time is not None:
        figure.suptitle(t1 + ' ' + date_time + "\n" +
                        z1 + ' ' + zone_name + "\n" +
                        p1 + ' ' + prod_label + "\n" +
                        r1 + ' ' + sensor_ref + "\n" +
                        lc, fontsize=16)
    else:
        figure.suptitle(z1 + ' ' + zone_name + "\n" +
                        p1 + ' ' + prod_label + "\n" +
                        r1 + ' ' + sensor_ref + "\n" +
                        lc, fontsize=16)

    if str_output_fname is None:
        str_output_fname = ECV_dictionary.path_to_save + os.sep + 'Taylor_' + ECV_dictionary.fig_ext
    if is_show == 2 and is_save == 0:
        fig = plt.gcf()
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))

        plt.close()
    elif is_show == 2 and is_save == 2:
        fig = plt.gcf()
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1:
        if is_save == 2:
            plt.savefig(str_output_fname)
        plt.show()
    else:
        plt.close()


def plot_hist(data_set, n_bin=101, x_label=None, y_label=None, sensor_name=None, prod_name=None, date_time=None,
              zone_name=None, ks_value=None, i_ref=None, zone_coord=None, is_spc=False, is_save=0, is_show=2,
              x_lim=None, fig_title=None, lc_label=None, str_output_fname=None):
    """
    :param data_set:
    :param n_bin:
    :param x_label:
    :param y_label:
    :param sensor_name:
    :param prod_name:
    :param date_time:
    :param zone_name:
    :param ks_value:
    :param i_ref:
    :param zone_coord:
    :param is_spc:
    :param is_save:
    :param is_show:
    :param x_lim:
    :param fig_title:
    :param lc_label:
    :param str_output_fname:
    :return:
    """
    n_dataset = np.shape(data_set)[0]
    y = []
    x = []
    for nd in range(n_dataset):
        _y, _x = sf.get_ivh(data_set[nd])
        y.append(_y)
        x.append(_x)

    if x_label is None:
        xl = 'Intensity Value'
    else:
        xl = str(x_label)
    if y_label is None:
        yl = 'Surface [%]'
    else:
        yl = str(y_label)
    if prod_name is not None:
        if prod_name[0] is None:
            pn = ''
        else:
            try:
                pn = ECV_dictionary.prod_general_name[str(prod_name[0])]
            except KeyError:
                pn = str(prod_name[0])
            except TypeError:
                pn = ''
    else:
        pn = ''
        prod_name = ['', '']
    if date_time is None:
        dt = ''
    else:
        dt = str(date_time)
    if zone_name is None:
        zn = ''
        if zone_coord is not None:
            zc = str(zone_coord[0]) + 'S' + str(zone_coord[1]) + 'N' + str(zone_coord[2]) \
                 + 'W' + str(zone_coord[3]) + 'E'
        else:
            zc = ''
    else:
        zn = str(zone_name)
        zc = ''

    if x_lim is None:

        xmin = np.nanmin(np.array(data_set).flatten())
        xmax = np.nanmax(np.array(data_set).flatten())
        if np.logical_and(xmax < 1, xmax > 0):
            xmax = 1
            xmin = 0

        x_lim = [xmin, xmax]

    kolors = ['k', 'r', 'b', 'g', 'm']

    base_str = 'Histograms and CDFs'
    if is_spc:
        base_str += ' over same cells'

    add_lc = '\n'
    if lc_label is not None:
        add_lc = '\n Over ' + lc_label + ' Land Class'

    if fig_title is None:
        fig_title = base_str + '\n' + dt + '; ' + pn + '; ' + zn + ' ' + zc + add_lc

    plt.figure(figsize=(7, 8), facecolor='w', edgecolor='k')
    p1 = plt.subplot(211)
    p2 = plt.subplot(212)

    for i in range(np.array(y).shape[0]):
        try:
            sn = ECV_dictionary.sens_dic[sensor_name[i]]
        except KeyError:
            sn = str(sensor_name[i])
        except TypeError:
            sn = ''
        if i_ref is not None:
            lb1 = sn
            if i == i_ref:
                lb2 = sn
            else:
                lb2 = sn + ' ks=' + str("{:3.2f}".format(ks_value[i, 0])) \
                      + '; pv=' + str("{:3.2f}".format(ks_value[i, 1]))
        else:
            lb1 = lb2 = sn + ' ' + prod_name[i]
        # lls = ['-', '--']
        d = data_set[i]
        d = d[~np.isnan(d)]

        p1.hist(d, n_bin, color=kolors[i], histtype='stepfilled', alpha=0.5, label=lb1)
        p2.plot(x[i], y[i], lw=2, color=kolors[i], label=lb2)

    p1.grid()
    p2.grid()
    p1.set_xticks([])
    p2.set_yticks([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
                  ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'])
    p2.set_ylim([0, 110])
    plt.minorticks_on()
    p2.set_xlabel(xl, fontsize=12)
    p2.set_ylabel(yl, fontsize=12)
    p1.set_ylabel('Entries', fontsize=12)
    p1.set_title(fig_title, fontsize=14, fontweight='bold')
    # plt.legend(loc=2, fontsize=9)
    p1.legend(loc=0, fontsize=10, numpoints=1, shadow=True)
    p2.legend(loc=0, fontsize=10, numpoints=1, shadow=True)

    p1.set_xlim(x_lim)
    p2.set_xlim(x_lim)
    #
    plt.tight_layout()
    plt.subplots_adjust(wspace=0, hspace=0)
    save_name = fig_title.replace('\n', '-')
    if str_output_fname is None:
        str_output_fname = ECV_dictionary.path_to_save + os.sep + str(save_name).replace(' ', '_').replace(';', '') + \
                           ECV_dictionary.fig_ext

    fig = plt.gcf()

    if is_show == 2 and is_save == 0:
        fig.canvas.manager.show()
    elif is_show == 0 and is_save == 2:
        plt.savefig(str(str_output_fname))
        plt.close()
    elif is_show == 2 and is_save == 2:
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
    elif is_show == 1 and is_save == 2:
        fig.canvas.manager.show()
        plt.savefig(str(str_output_fname))
        plt.show()
    elif is_show == 1:
        plt.show()
    else:
        plt.close()


def _get_map_params(ecv_type, product, lat1, lat2, lon1, lon2, plot_type, data_set, is_abs=False,
                    max_v=None, min_v=None):

    if ecv_type is None:
        ecv_type = ''

    zc = [lat1, lat2, lon1, lon2]
    global_zc = ECV_dictionary.zone_dict['Global']
    if None in zc:
        ind = [i for i, j in enumerate(zc) if j is None]
        for ii in ind:
            zc[ii] = global_zc[ii]

        lat1 = zc[0]
        lat2 = zc[1]
        lon1 = zc[2]
        lon2 = zc[3]

    data = np.flipud(data_set)
    unit = ''
    n_colors = 10
    nc = 2 * n_colors + 1
    back = False

    if ecv_type in ['Chl-a', 'ocean', 'ocean-color', 'ocean color']:
        m = Basemap(projection='cyl', llcrnrlat=lat1, urcrnrlat=lat2, llcrnrlon=lon1 + 180,
                    urcrnrlon=lon2 + 180, resolution='l')
    elif ecv_type == 'AOD':
        m = Basemap(projection='moll', lon_0=0, resolution='c')
    else:
        m = Basemap(projection='cyl', llcrnrlat=lat1, urcrnrlat=lat2, llcrnrlon=lon1,
                    urcrnrlon=lon2, resolution='l')

    if plot_type in ['Map', 'Clima']:
        if max_v is None:
            max_v = np.nanmax(data)
        if min_v is None:
            min_v = np.nanmin(data)

        if max_v == min_v:
            min_v = min_v - max_v
            max_v = min_v + max_v

        if product is not None:
            if 'sigma' in product:
                max_v = np.nanmean(data)
        if ecv_type.lower() == 'albedo':
            unit = product
            c_map = my_cmaps.albedo()
            if max_v < 1:
                max_v = 1.
            min_v = 0.
        elif ecv_type.lower() == 'aod':
            unit = product
            c_map = plt.cm.get_cmap('YlOrRd_r')
            max_v = np.nanmean(data) + 3 * np.nanstd(data)

        elif ecv_type.lower() in ['fapar', 'fpar']:
            unit = 'FAPAR'
            c_map = my_cmaps.fapar()
            max_v = 1.
            min_v = 0.

        elif ecv_type.lower() == 'lai':
            unit = 'LAI [m$^2$/m$^2$]'
            c_map = my_cmaps.fapar()

        elif ecv_type.lower() == 'chl-a':
            c_map = my_cmaps.bgry()
            unit = 'chl-a [mg/m$^3$]'

        elif ecv_type.lower() == 'lst':
            # c_map = my_cmaps.thermal()
            # c_map = plt.cm.get_cmap('coolwarm')
            c_map = plt.cm.get_cmap('RdYlBu_r')
            unit = product
            if 'LST' in product:
                unit += ' [K]'

            max_v = 330  # +57 C
            min_v = 200  # -73 C

        elif ecv_type.lower() == 'snowcover':
            # c_map = my_cmaps.viridis()
            # c_map = plt.cm.get_cmap('cool')
            c_map = plt.cm.get_cmap('bone')
            unit = 'Snow Cover [%]'
            back = True
            # max_v = 100
            # min_v = 0
            data[data < 10] = np.nan

        else:
            c_map = my_cmaps.parula()
            # c_map = cm.get_cmap('bwr_r')
            if min_v == max_v:
                max_v = 1.
                min_v = 0.

        if ~np.isnan(max_v + min_v):
            cb_labels = np.linspace(min_v, max_v, nc, endpoint=True)
            bounds = list(cb_labels)
            step = bounds[-1] - bounds[-2]
            bounds.append(np.max(cb_labels) + step)
            norm = colors.BoundaryNorm(bounds, c_map.N)
            cb_tick_labels = []
            for i in cb_labels[::2]:
                cb_tick_labels.append(str("{:3.2f}".format(i)))
        else:
            cb_labels = None
            cb_tick_labels = None
            norm = None

        if ecv_type in ['AOD', 'LST']:
            norm = None
            cb_tick_labels = []
            for i in cb_labels[::2]:
                cb_tick_labels.append(str("{:3.1f}".format(i)))
        if ecv_type == 'Chl-a':
            norm = colors.LogNorm()
            cb_labels = None

    elif plot_type == 'Anomaly':
        n_sig = 3.
        std = np.nanstd(data)
        avg = np.nanmean(data)
        while n_sig * std > 100.:
            n_sig -= 1.
        if n_sig == 0:
            n_sig = 1.
        # print n_sig
        if not is_abs:
            thr1 = avg + n_sig * std
            thr2 = avg - n_sig * std
            data[data > thr1] = np.nan
            data[data < thr2] = np.nan
        std = np.nanstd(data)
        avg = np.nanmean(data)

        mv = np.round(abs(avg) + n_sig * std)  # max(abs(_max_v), abs(_min_v))

        if is_abs:
            max_v = np.nanmax(data)
            min_v = np.nanmin(data)

            max_val = 0.12 # max(abs(max_v), abs(min_v))

            max_v = max_val
            min_v = -1 * max_val

            # max_v = abs(avg) + n_sig * abs(std)
            # min_v = -abs(avg) - n_sig * abs(std)

            if ecv_type == 'Albedo':
                unit = 'Anomaly ' + product
                if max_v < 1:
                    max_v = 1.
                min_v = 0.
            elif ecv_type == 'AOD':
                unit = 'Anomaly ' + product

            elif ecv_type in ['FaPAR', 'FAPar', 'FAPAR', 'fapar']:
                unit = 'Anomaly ' + product

            elif ecv_type == 'LAI':
                unit = 'Anomaly ' + product + ' [m$^2$/m$^2$]'

            elif ecv_type == 'Chl-a':
                unit = 'Anomaly ' + product + ' [mg/m$^3$]'

            elif ecv_type == 'LST':
                unit = 'Anomaly ' + product
                if 'LST' in product:
                    unit += ' [K]'
            else:
                unit = 'Anomaly '

        else:
            unit = ' Relative Anomalies [%] '
            print(unit)
            print(mv)
            if mv < 10.:
                max_v = 0.1  # abs(mv)
                min_v = -0.1  # abs(mv)
            elif 10. <= mv < 20.:
                max_v = 15.
                min_v = -15.
            elif 20. <= mv < 40.:
                max_v = 35.
                min_v = -35.
            elif 40. <= mv < 60.:
                max_v = 55.
                min_v = -55.
            elif 60. <= mv < 80.:
                max_v = 75.
                min_v = -75.
            else:
                max_v = 100.
                min_v = -100.

        if max_v == min_v:
            min_v = min_v - max_v
            max_v = min_v + max_v

        if max_v == min_v == 0:
            min_v = -10
            max_v = 10

        c_map = my_cmaps.anomaly()
        # c_map = cm.get_cmap('bwr_r')
        cb_labels = np.linspace(min_v, max_v, nc)
        bounds = list(cb_labels)
        step = bounds[-1] - bounds[-2]
        bounds.append(np.max(cb_labels) + step)
        norm = colors.BoundaryNorm(bounds, c_map.N)
        cb_tick_labels = []
        for i in cb_labels[::2]:
            cb_tick_labels.append(str("{:3.2f}".format(i)))

    elif plot_type == 'Trend':
        nc = 11
        if ecv_type.lower() in ['albedo', 'fapar', 'aod', 'chl-a']:
            unit = '% year$^{-1}$'
            data *= 100 * 12
        elif ecv_type.lower() == 'lai':
            unit = 'm$^2$ m$^{-2}$ decade$^{-1}$'
            data *= 12 * 10
        elif ecv_type.lower() == 'lst':
            unit = '% per decade'
            data *= 12 * 10
        else:
            unit = '% year$^{-1}$'
            data *= 100 * 12

        t = data[~np.isnan(data)]
        max_v = np.percentile(t, 99)
        if max_v > 1:
            max_v = np.round(np.percentile(t, 99))
            fmt = str("{:3.1f}")
        elif max_v < 0.1:
            max_v = np.round(100 * np.percentile(t, 99)) / 100.
            fmt = str("{:3.2f}")
        else:
            max_v = np.round(10 * np.percentile(t, 99)) / 10.
            fmt = str("{:3.1f}")
        # max_v = np.percentile(t, 99)
        min_v = -max_v
        if max_v < 0:
            min_v = 2 * max_v
        if ecv_type.lower() not in ['albedo', 'fapar', 'aod', 'chl-a', 'lai', 'lst']:
            max_v = np.nanmax(data)
            min_v = np.nanmin(data)
            if max_v * min_v < 0:
                max_v = min(max_v, abs(min_v))
                min_v = -1. * max_v
            if max_v == min_v:
                min_v = min_v - max_v
                max_v = min_v + max_v

        # c_map = cm.get_cmap('seismic')
        c_map = my_cmaps.tred()
        cb_labels = np.linspace(float(min_v), float(max_v), nc)

        bounds = list(cb_labels)
        step = bounds[-1] - bounds[-2]
        bounds.append(np.max(cb_labels) + step)
        if ecv_type == 'AOD':
            norm = None
        else:
            norm = colors.BoundaryNorm(bounds, c_map.N)
        cb_tick_labels = []
        for i in cb_labels:
            cb_tick_labels.append(fmt.format(i))

    elif plot_type == 'SymIndex':
        unit = 'Symmetric Index of Agreement'
        max_v = 1
        min_v = 0

        c_map = my_cmaps.cmap_shift(10, 1, 'viridis', [0.8, 0, 0], shift_pos=0, reverse=True, alpha=1)
        # c_map = my_cmaps.green_red_r(11)

        cb_labels = np.linspace(float(min_v), float(max_v), nc)
        bounds = list(cb_labels)
        step = bounds[-1] - bounds[-2]
        bounds.append(np.max(cb_labels) + step)
        norm = colors.BoundaryNorm(bounds, c_map.N)
        cb_tick_labels = []
        for i in cb_labels[::2]:
            cb_tick_labels.append(str("{:3.2f}".format(i)))

    else:
        max_v = np.nanmax(data)
        if np.isnan(max_v):
            max_v = 1

        min_v = np.nanmin(data)
        if np.isnan(min_v):
            min_v = 0
        unit = str(plot_type)

        if ecv_type.lower() == 'albedo':
            c_map = my_cmaps.albedo()
        elif ecv_type.lower() == 'aod':
            c_map = plt.cm.get_cmap('YlOrRd_r')
        elif ecv_type.lower() in ['fapar', 'fpar']:
            c_map = my_cmaps.fapar()
        elif ecv_type == 'lai':
            c_map = my_cmaps.fapar()

        elif ecv_type == 'chl-a':
            c_map = my_cmaps.bgry()
        else:
            c_map = my_cmaps.parula()

        cb_labels = None
        norm = None
        cb_tick_labels = None

    return data, c_map, max_v, min_v, unit, norm, cb_labels, cb_tick_labels, m, back
