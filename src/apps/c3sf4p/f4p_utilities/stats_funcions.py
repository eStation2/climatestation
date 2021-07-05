"""
# ###############################################################################
# version:          R1.0.1                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    08 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          Statistical tools in support for C3S-F4P class              #
#             --------------------------------------------------                #
# last edit:        Under development                                           #
#  *************************************************************************    #
Log v-1.0.1
    June-2021 - Add get_ks and get_ivh for handling hist and cdf calculation

# ###############################################################################
"""
import numpy as np
from lib.python.image_proc.read_write_raster import RasterDatasetCS
import os
from scipy.stats import ks_2samp


def get_spatial_consistency(data_in):
    """
    @param data_in:     multidimensional np.array: if size = np.shape(data_in) then:
                            size[0] = n. of different dataset for which space consistency is required
                            size[1] = n. of time intervals for each dataset
                            size[2], size[3] = dimension of each 2D data matrix
    @return: data_out:  with the same shape of dat_in; but! each pixel of each matrix will have a value different
                        from nan if and only if the value of the same pixel in each of the original matrices used for
                        the calculation is different from nan.
    """
    mask = []
    data_in = np.array(data_in)
    sz = data_in.shape[0]
    mk = np.sum(data_in, axis=0)
    mk[~np.isnan(mk)] = 1.

    for i in range(sz):
        mask.append(mk)

    data_out = data_in * np.array(mask)
    return data_out


def par_hov(lof, product, k):
    """
    single element of parallel calculation of hovmoller matrix with index k
    @param lof:         list of files
    @param product:     band name
    @param k:           index representing the element of filelist (lof) to handle within the parallel loop
    """
    nax = 1  # latitude!
    out = list()

    rd = RasterDatasetCS(lof[k])
    data_tmp = rd.get_data(product)
    # average value along longitude, d is an array with lengh==n.pixels along latitude
    d = np.squeeze(np.nanmean(data_tmp, axis=nax))
    out.append([d, k])
    return out


def get_ks(data1, data2, n_bin=200):
    """
    @param data1:   first distribution
    @param data2:   second distribution
    @param n_bin:   number of bins to calculate cdf for ks
    @return:        Kolmogorov-Smirnov statistics of the two sample. For each pair of datasets the output will be the
        kolmogorov statistics coefficient (KS) and the p-value. If the KS statistic is small or the p-value is high,
        then we cannot reject the hypothesis that the distributions of the two samples are the same.

    """
    # exclude nan from dataset
    max1 = np.nanmax(data1)
    min1 = np.nanmin(data1)
    max2 = np.nanmax(data2)
    min2 = np.nanmin(data2)

    max_v = np.nanmin([max1, max2])
    min_v = np.nanmax([min1, min2])

    data1[data1 > max_v] = np.nan
    data2[data2 > max_v] = np.nan
    data1[data1 < min_v] = np.nan
    data2[data2 < min_v] = np.nan

    d1 = data1[~np.isnan(data1)]
    d2 = data2[~np.isnan(data2)]

    # calculate normed histogram
    y1, _ = np.histogram(d2, n_bin, normed=True)
    y2, _ = np.histogram(d1, n_bin, normed=True)

    # calculate cdf
    cdf1 = np.cumsum(y1) / np.max(np.cumsum(y1))
    cdf2 = np.cumsum(y2) / np.max(np.cumsum(y2))
    # ks
    ks = ks_2samp(cdf1, cdf2)

    return ks


def get_ivh(data):
    """
    @param data: numpy matrix array
    @return: cdf of data
    """
    i_max = float(np.nanmax(data))
    i_min = float(np.nanmin(data))
    ptot = np.count_nonzero(~np.isnan(data))
    d = data[~np.isnan(data)]
    i_range = np.linspace(i_min, i_max, 100)
    i_vh = []
    for i in i_range:
        i_vh.append(100 * np.count_nonzero(d > i) / ptot)

    return i_vh, list(i_range)


def log_report(info, tag, logfile):
    """
    @param info:    STRING: carrying on the information about name of .py file and relative line of debug
    @param tag:     STRING: describes what is happening at the level of "info"
    @param logfile: STRING: full path of log file
    @return:
    """
    if not os.path.exists(logfile):
        fid = open(logfile, 'w')
    else:
        fid = open(logfile, 'a')

    msg = info + ': ' + tag + '\n'
    fid.writelines(msg)
    fid.close()
