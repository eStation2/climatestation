import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np
from inspect import currentframe, getframeinfo
from apps.c3sf4p.f4p_utilities.stats_funcions import log_report


def graphical_render(data, product='', sensor_name='', zone_name='', x_tick_labels=None, y_tick_labels=None,
                     figure_title='', min_v=None, max_v=None, dbg=True, logfile=None):
    """
    @param data:            ->  np.array;   data
    @param product:         ->  STRING;     product name
    @param sensor_name:     ->  STRING;     Sensor Name
    @param zone_name:       ->  STRING;     Region name
    @param x_tick_labels:   ->  [STRINGS];  fill ticks in x-axis typically each label is a date for the time series
    @param y_tick_labels:   ->  [STRINGS];  fill ticks in x-axis typically each label is a coordinate
    @param figure_title:    ->  STRING;     figure title
    @param min_v:           ->  FLOAT;      upper limit
    @param max_v:           ->  FLOAT;      lower limit
    @param dbg              ->  BOOL; enables debug mode
    @param logfile          ->  STRING; file for write the debug results
    :return:
    """
    if logfile is None:
        dbg = False
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'Start graphical render for Longitudinal average Plot TEST'
        log_report(info, tag, logfile)

    sz = data.shape
    y_ax_lab = 'Latitude'

    if zone_name is None:
        zn = ''
    else:
        zn = str(zone_name)
    if sensor_name is None:
        sn = ''
    else:
        sn = str(sensor_name)

    step = int(np.round(sz[1] / 40.))

    if step == 0:
        step = 1
    x_ax_lab = 'Time'
    x_tick = np.linspace(0, sz[1] - 1, sz[1])

    if figure_title is None:
        figure_title = 'Latitudinal Average Diagram ' + sn + '\n ' + product + ' ' + zn
    if x_tick_labels is None:
        x_tick_labels = x_tick

    if y_tick_labels is None:
        y_tick_labels = range(0, sz[0], 10)

    c_map = cm.get_cmap('viridis')
    if max_v is None:
        max_v = np.nanmax(data)
    if min_v is None:
        min_v = np.nanmin(data)

    if min_v == max_v:
        min_v = 0
        max_v = 2 * max_v

    nc = 21  # number of different colors to display

    cb_labels = np.linspace(min_v, max_v, nc, endpoint=True)
    bounds = list(cb_labels)
    step = int(bounds[-1] - bounds[-2])

    cb_tick_labels = []
    for i in cb_labels[::2]:
        cb_tick_labels.append(str("{:3.2f}".format(i)))

    y_tick = np.linspace(0, sz[0], len(y_tick_labels))

    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(getframeinfo(currentframe()).lineno))
        tag = 'render the figure'
        log_report(info, tag, logfile)

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

    plt.imshow(data, cmap=c_map, vmin=min_v, vmax=max_v, interpolation='none', aspect='auto')

    if cb_labels is not None:
        cb = plt.colorbar(ticks=cb_labels[::2])
        cb.ax.set_yticklabels(cb_tick_labels)
    else:
        cb = plt.colorbar()
    # cb.set_label(unit, fontsize=16)
    cb.ax.tick_params(labelsize=16)
    plt.title(figure_title + '\n', fontsize=16)
    plt.tight_layout()
