import matplotlib.pyplot as plt
from matplotlib import colors
from inspect import currentframe, getframeinfo
import numpy as np
from apps.c3sf4p.f4p_utilities.stats_funcions import log_report

# It is highly recommended to set the MPLCONFIGDIR environment variable to a writable directory,
# in particular to speed up the import of Matplotlib and to better support multiprocessing.
import os
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib/'


def graphical_render(data, title=None, threshold=1.5, fmt="{:3.2f}", dbg=True, logfile=None):
    """
    @param data:        np.array: slope-matrix to plot
    @param title:       STRING: title of the figure
    @param threshold:   FLOAT: threshold for val_max/val_min of the colorbar
    @param fmt:         STRING: valid format string for color-bar ticks
    @param dbg:         BOOL enables debug mode
    @param logfile:     STRING; file for write the debug results
    @return:
    """
    rain = np.array([[84, 48, 5],
                     [140, 81, 10],
                     [191, 129, 45],
                     [223, 194, 125],
                     [246, 232, 195],
                     [245, 245, 245],
                     [199, 234, 229],
                     [128, 205, 193],
                     [53, 151, 143],
                     [1, 102, 94],
                     [0, 60, 48]], dtype='float')

    c_map = colors.ListedColormap(np.flipud(rain) / 254.)

    if logfile is None:
        dbg = False

    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
            getframeinfo(currentframe()).lineno))
        tag = 'Graphical render function'
        log_report(info, tag, logfile)

    min_v = -threshold
    max_v = threshold
    cb_labels = np.linspace(float(min_v), float(max_v), 11)
    bounds = list(cb_labels)

    step = bounds[-1] - bounds[-2]
    bounds.append(np.max(cb_labels) + step)
    norm = colors.BoundaryNorm(bounds, c_map.N)
    cb_tick_labels = []
    for i in cb_labels:
        cb_tick_labels.append(str(fmt.format(i)))

    off = (cb_labels[1] - cb_labels[0]) / 2.

    plt.figure()
    plt.imshow(data, interpolation='none', vmin=min_v, vmax=max_v, cmap=c_map)
    cb = plt.colorbar(ticks=cb_labels + off)
    cb.ax.set_yticklabels(cb_tick_labels)
    if title is not None:
        plt.title(title + '\n', fontsize=14)
    plt.show()
