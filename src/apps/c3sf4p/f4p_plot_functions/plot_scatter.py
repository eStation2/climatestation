import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np
from scipy.stats import stats
from inspect import currentframe, getframeinfo
from src.apps.c3sf4p.f4p_utilities.stats_funcions import log_report


def graphical_render(data_1, data_2, x_label=None, y_label=None, figure_title=None, dbg=True, logfile=None):
    """
    @param data_1:              -> np.array dataset 1
    @param data_2:              -> np.array dataset 2
    @param x_label:             -> STRING; label for x-axis (typically: Name of dataset-1)
    @param y_label:             -> STRING; label for y-axis (typically: Name of dataset-2)
    @param figure_title:        -> STRING; title to be printed on the canvas
    @param dbg:                 -> BOOL; enables debug mode
    @param logfile:             -> STRING; file for write the debug results
    :return:
    """
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'Start graphical render for Scatter Plot TEST'
        log_report(info, tag, logfile)

    if x_label is None:
        x_label = 'dataset(1)'
    else:
        x_label = str(x_label)
    if y_label is None:
        y_label = 'dataset(2)'
    else:
        y_label = str(y_label)
    if figure_title is None:
        figure_title = 'Scatter Plot'

    # remove nan values from the two data series
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'remove nan values from the two data series'
        log_report(info, tag, logfile)

    mask = data_1 + data_2
    d1 = data_1[~np.isnan(mask)]
    d2 = data_2[~np.isnan(mask)]

    min_v = min(np.nanmin(d1), np.nanmin(d2))
    max_v = max(np.nanmax(d1), np.nanmax(d2))

    slope, intercept, r_value, p_value, std_err = stats.linregress(d1, d2)

    # build trend line:
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'build trend line'
        log_report(info, tag, logfile)

    xx = np.linspace(min_v, max_v, 10)
    slp = np.full_like(xx, fill_value=slope)
    itc = np.full_like(xx, fill_value=intercept)
    trend_line = slp * xx + itc

    rmsd = np.sqrt(np.nansum(np.square(np.array(data_1).flatten() - np.array(data_2).flatten())) /
                   np.count_nonzero(~np.isnan((np.array(data_1) - np.array(data_2)))))

    nbins = 101
    thr = 1
    h, x_edges, y_edges = np.histogram2d(data_1, data_2, bins=nbins)
    h = np.rot90(h)
    h = np.flipud(h)
    h_mask = np.ma.masked_where(h <= 0, h)  # Mask pixels with a value <= zero

    # Log transformation
    h_mask = np.log10(h_mask)
    h_mask = np.ma.masked_where(h_mask <= thr, h_mask)  # Mask pixels with a density value <= 10^thr

    bias = np.nanmean(d1) - np.nanmean(d2)

    # building plot legend
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'building plot legend'
        log_report(info, tag, logfile)

    txt_1 = 'Slope=' + str("{:.3f}".format(slope)) + '\n'
    txt_2 = 'Intercept=' + str("{:.3f}".format(intercept)) + '\n'
    txt_3 = 'R$^{2 }$=' + str("{:.3f}".format(r_value ** 2)) + '\n'
    txt_4 = 'RMSD=' + str("{:.3f}".format(rmsd)) + '\n'
    txt_5 = 'BIAS=' + str("{:.3f}".format(bias))
    # txt_5 = '${\lambda}$=' + str("{:.3f}".format(lambda_c))
    lbl = txt_1 + txt_2 + txt_3 + txt_4 + txt_5

    vmax = np.percentile(h_mask, 99)
    cb_ticks = np.linspace(np.nanmin(h_mask), vmax + 1, 10)

    cb_tick_labels = []
    # transfrom colorbar labels in linear density number from log
    for tk in cb_ticks:
        cb_tick_labels.append(str(round(10. ** tk, -3)))

    # render the figure
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'render the figure'
        log_report(info, tag, logfile)

    plt.figure(figsize=(7, 6), facecolor='w', edgecolor='k')
    plt.grid()

    color_map = cm.get_cmap('viridis')

    plt.pcolormesh(x_edges, y_edges, h_mask, cmap=color_map, vmax=vmax)

    cb = plt.colorbar(aspect=30, ticks=cb_ticks)
    cb.ax.set_yticklabels(cb_tick_labels)
    cb.ax.set_ylabel('N', fontsize=12, rotation='horizontal')
    plt.plot(xx, xx, color=[0, 0, 0], ls='-', lw=2, label=None)
    plt.plot(xx, trend_line, color=[1, 0, 1], ls='-', lw=3, label=lbl)
    plt.xlim([min_v, max_v])
    plt.ylim([min_v, max_v])
    cb.ax.tick_params(labelsize=10)
    plt.xticks(fontsize=12)
    plt.yticks(fontsize=12)
    plt.minorticks_on()
    plt.xlabel(x_label, fontsize=12)
    plt.ylabel(y_label, fontsize=12)
    plt.title(figure_title + '\n', fontsize=14, fontweight='bold')
    plt.legend(loc=2, fontsize=10, numpoints=1, shadow=True)
    plt.grid()
    plt.tight_layout()

    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'show the figure'
        log_report(info, tag, logfile)

    plt.show()
