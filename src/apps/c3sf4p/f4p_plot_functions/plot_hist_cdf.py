import matplotlib.pyplot as plt
from inspect import currentframe, getframeinfo
import numpy as np
from apps.c3sf4p.f4p_utilities.stats_funcions import log_report
import apps.c3sf4p.f4p_utilities.stats_funcions as sf


def graphical_render(data_set, n_bin=101, x_label=None, y_label=None, sensor_name=None, prod_name=None, date_time=None,
                     zone_name=None, ks_value=None, i_ref=None, zone_coord=None, is_spc=False, x_lim=None,
                     fig_title=None, str_output_fname=None, dbg=True, logfile=None):
    """
    @param data_set:            List of nunpy arrays representing the different dataset to histogram
    @param n_bin:               Number of bin of the hist, default=101
    @param x_label:             label to display along x-axis
    @param y_label:             label to display along y-axis
    @param sensor_name:         labels of different dataset
    @param prod_name:           band name
    @param date_time:           date (common date?)
    @param zone_name:           region name
    @param ks_value:            Kolmogorov-Smirnov parameters (kv and pvalue) if reference is provided
    @param i_ref:               index of reference dataset
    @param zone_coord:          coordinate boundaries of the region
    @param is_spc:              indicates (T/F) if spatial consistence is applied
    @param x_lim:               if specified impose the limit value along x-axis
    @param fig_title:           title of the figure
    @param str_output_fname:    save name of the png image
    @param dbg:                 BOOL enables debug mode
    @param logfile:             STRING; file for write the debug results
    @return:
    """
    if logfile is None:
        dbg = False

    n_dataset = np.shape(data_set)[0]
    if dbg:
        info = (str(getframeinfo(currentframe()).filename) + ' --line: ' + str(
            getframeinfo(currentframe()).lineno))
        tag = 'Graphical render function'
        log_report(info, tag, logfile)

    if n_dataset <= 10:
        cmap = 'tab10'
    elif 10 < n_dataset <= 20:
        cmap = 'tab20'
    else:
        cmap = 'rainbow'

    kolors = plt.cm.get_cmap(cmap, n_dataset)

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
            pn = str(prod_name[0])
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

    base_str = 'Histograms and CDFs'
    if is_spc:
        base_str += ' over same cells'

    if fig_title is None:
        fig_title = base_str + '\n' + dt + '; ' + pn + '; ' + zn + ' ' + zc

    plt.figure(figsize=(7, 8), facecolor='w', edgecolor='k')
    p1 = plt.subplot(211)
    p2 = plt.subplot(212)

    for i in range(np.array(y).shape[0]):
        try:
            sn = str(sensor_name[i])
        except TypeError:
            sn = 'Dataset-' + str(i+1)

        if i_ref is not None:
            lb1 = sn
            if i == i_ref:
                lb2 = sn
            else:
                lb2 = sn + ' ks=' + str("{:3.2f}".format(ks_value[i, 0])) \
                      + '; pv=' + str("{:3.2f}".format(ks_value[i, 1]))
        else:
            lb1 = lb2 = sn + ' ' + prod_name[i]

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

    plt.show()
    # plt.savefig(str_output_fname)
