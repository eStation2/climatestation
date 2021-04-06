import matplotlib.pyplot as plt
from matplotlib import colors
from inspect import currentframe, getframeinfo
import numpy as np


def graphical_render(data, title=None, thr=1.5, fmt="{:3.2f}", dbg=True):
    c_map = get_cmap(11)
    min_v = -thr
    max_v = thr
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
    cb = plt.colorbar(size=0.25, ticks=cb_labels + off)
    cb.ax.set_yticklabels(cb_tick_labels)
    if title is not None:
        plt.title(title + '\n', fontsize=14)
    plt.show()


def get_cmap(ncolors, ctype=1):
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

    data = np.flipud(rain) / 254.
    return colors.ListedColormap(data)