# ###############################################################################
# version:          R1.3.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.jrc.ec.europa.eu      #
# creation date:    21 Oct 2015                                                 #
# property of:      JRC                                                         #
# purpose:          main library containing statistical functions               #
#                   for data analysis.                                          #
#             --------------------------------------------------                #
# last edit:        17 Apr 2020                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################
import numpy as np
import copy
import geopy.distance
from scipy.stats import ks_2samp
from scipy.ndimage import zoom
# from temporal_decomposition import TemporalDecomposition
from LoadRasterDataset import RasterDataset
import warnings
import ECV_dictionary
import datetime
from netCDF4 import Dataset
warnings.filterwarnings("ignore")


def get_statistics(data, stat_index=None, mask_array=None):
    """
    :param data:        N-D data matrix for N-data-sets
    :param stat_index:  statistical voice to plot
                        index == 0 --> max.
                        index == 1 --> min
                        index == 2 --> mean (default)
                        index == 3 --> std-dev (width of the distribution)
                        index == 4 --> variance of the mean
                        index == 5 --> [%] number of nan
                        index == 6 --> standard ERROR of the mean
    :param mask_array:  Water body mask
    :return:            x vector position from 1 to max-number-of-points in step of 1
                        yy N-D array relative to stat_index, each column is relative to data-set i; i =1,2,3,4,...
                        max and min value of yy-1, yy-2, yy-3, yy-i (useful for plotting purposes)
    ---------------
    Description:
    """

    water_mask = mask_array
    if stat_index is None:
        stat_index = 2

    yy = []
    n_series = []
    sz = np.array(data).shape

    for item in range(sz[0]):
        stat = []
        n_series.append(np.array(data[item]).shape[0])
        # n_series.append(np.shape(data[item])[0])
        for i in range(np.array(data[item]).shape[0]):
            stat.append(image_statistics(data[item][i], stat_index, water_mask))
        yy.append(np.array(stat))

    xx = np.linspace(1, max(n_series), max(n_series))

    return xx, yy


def image_statistics(data, stat_index, water_mask):
    """
    Internal function
    -----------------
    :param: data_set:    2d matrix input data-set
    :return:            max, min, mean, std, var, number[%] of missing value (nans)

    ---------------
    Description:
    calculate statistics!
    """
    data_statistics = data

    if stat_index == 0:
        value = np.nanmax(data_statistics)
    elif stat_index == 1:
        value = np.nanmin(data_statistics)
    elif stat_index == 2:
        value = np.nanmean(data_statistics)
    elif stat_index == 3:
        value = np.nanstd(data_statistics)
    elif stat_index == 4:
        value = np.nanvar(data_statistics)
    elif stat_index == 6:
        value = np.nanstd(data_statistics) / np.sqrt(float(np.count_nonzero(~np.isnan(data_statistics))))

    elif stat_index == 5:
        num_nan = np.count_nonzero(np.isnan(data_statistics[~np.isnan(water_mask)]))
        value = np.round(100. * num_nan / float(np.count_nonzero(~np.isnan(water_mask))))
    else:
        ds = data_statistics
        value = [np.nanmax(ds), np.nanmin(ds), np.nanmean(ds), np.nanstd(ds)]

    return value


def get_correlation_test(data_test, data_ref):

    d1 = np.array(data_test)
    d2 = np.array(data_ref)

    mask = d1 + d2
    d1[np.isnan(mask)] = np.nan
    d2[np.isnan(mask)] = np.nan

    if d1.shape != d2.shape:
        raise Exception("Arrays must have the same dimension!")
    else:
        delta1 = d1 - np.nanmean(d1)
        delta2 = d2 - np.nanmean(d2)
        sigma1 = np.nanstd(d1)
        sigma2 = np.nanstd(d2)
        n = np.size(mask) - np.count_nonzero(np.isnan(mask))
        d_sigma = sigma1 / sigma2
        corr_coef = (np.nansum(delta1 * delta2) / n) / (sigma1 * sigma2)
        if corr_coef < 0:
            corr_coef = 0

    return d_sigma, corr_coef


def get_correlation_ts(data_test, data_ref):
    corr_coef = []
    d_sigma = []
    d2 = np.array(data_ref)

    for k in range(np.array(data_test).shape[0]):
        d1 = np.array(np.squeeze(np.array(data_test[k])))
        mask = d1 + d2
        d1[np.isnan(mask)] = np.nan
        d2[np.isnan(mask)] = np.nan

        if d1.shape != d2.shape:
            raise Exception("Arrays must have the same dimension!")
        else:

            delta1 = d1 - np.nanmean(d1)
            delta2 = d2 - np.nanmean(d2)
            sigma1 = np.nanstd(d1)
            sigma2 = np.nanstd(d2)

            n = np.size(mask) - np.count_nonzero(np.isnan(mask))
            d_sigma.append(sigma1 / sigma2)
            cc = (np.nansum(delta1 * delta2) / n) / (sigma1 * sigma2)
            if cc < 0:
                cc = 0
            corr_coef.append(cc)

    return [d_sigma], [corr_coef]


def get_spatial_consistency(data_in):
    """
    :param data_in:     multidimensional np.array: if size = np.shape(data_in) then:
                            size[0] = n. of different dataset for which space consistency is required
                            size[1] = n. of time intervals for each dataset
                            size[2], size[3] = dimension of each 2D data matrix
    :return: data_out:  with the same shape of dat_in; but! each pixel of each matrix will have a value different
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


def _get_apu(d_ref, d_test, v_min, v_max, bins):
    """
    :param d_ref:       reference data
    :param d_test:      test data
    :param v_min:       lower limit of accepted values
    :param v_max:       upper limit of accepted values
    :param bins:        number of bin intervals in which calculate apu
    :return:            Accuracy Precision Uncertainty relativeUncertainty quantities calculated for each interval
    """

    if v_min is None:
        v_min = max(np.nanmin(d_ref), np.nanmin(d_test))
    if v_max is None:
        v_max = min(np.nanmax(d_ref), np.nanmax(d_test))

    bin_size = (float(v_max) - float(v_min)) / float(bins)
    apu = []
    for i in range(bins):

        a = p = u = ru = np.nan

        i0 = i * bin_size
        i1 = (i + 1) * bin_size
        specs = i0 * 0.05 + 0.0025

        ref = copy.copy(d_ref)
        ref[d_ref < i0] = np.nan
        ref[d_ref > i1] = np.nan

        test = copy.copy(d_test)
        test[d_test < i0] = np.nan
        test[d_test > i1] = np.nan

        e = ref - test
        epsilon = e[~np.isnan(e)]

        n = len(epsilon)
        if n > 1:
            a = abs(np.mean(epsilon))
            p = np.sqrt(1. / (n - 1.) * np.sum(np.square(epsilon - a)))
            u = np.sqrt(np.nanmean(np.square(epsilon)))
            # u = np.sqrt((n - 1) / n * np.square(p) + np.square(a))
            ru = u / np.nanmean(ref[~np.isnan(ref)])

        apu.append([a, p, u, ru, specs])
    return np.array(apu)


def get_apu(d_ref, d_test, v_min, v_max, bins, specs_params):
    """
    :param d_ref:       reference data
    :param d_test:      test data
    :param v_min:       lower limit of accepted values
    :param v_max:       upper limit of accepted values
    :param bins:        number of bin intervals in which calculate apu
    :param specs_params:GCOS requirements for accuracy
    :return:            Accuracy Precision Uncertainty relativeUncertainty quantities calculated for each interval
    """

    if v_min is None:
        v_min = max(np.nanmin(d_ref), np.nanmin(d_test))
    if v_max is None:
        v_max = min(np.nanmax(d_ref), np.nanmax(d_test))

    bin_size = (float(v_max) - float(v_min)) / float(bins)
    apu = []
    for i in range(bins):

        a = p = u = ru = specs = np.nan

        i0 = i * bin_size
        i1 = (i + 1) * bin_size
        if specs_params is not None:
            if specs_params == -9999:
                specs = i0 + specs_params[0]
            else:
                specs = max(i0 * specs_params[0], specs_params[1])
        ref = copy.copy(d_ref)
        ref[d_ref < i0] = np.nan
        ref[d_ref >= i1] = np.nan
        e = ref - d_test
        epsilon = e[~np.isnan(e)]
        n = len(epsilon)
        if n > 1:
            a = np.sqrt(np.square(np.nanmean(epsilon)))
            p = np.sqrt(1. / (n - 1.) * np.sum(np.square(epsilon - a)))
            u = np.sqrt((n/(n-1)) * (np.square(p) + np.square(a)))
            ru = u / np.nanmean(ref[~np.isnan(ref)])

        apu.append([a, p, u, ru, specs])
    return np.array(apu)


def get_reference(data, index_ref, resolution, ecv=None, mask=None, zc=None):
    do_zoom = False
    if mask is None:
        if resolution == '0050D':
            mask = np.load('./f4p_utilities/Water_Mask_05.npy')
        elif resolution == '0005D':
            mask = np.load('./f4p_utilities/Water_Mask_005.npy')
        else:
            do_zoom = True
            mask = np.load('./f4p_utilities/Water_Mask_005.npy')

        if ecv == 'chl-a':
            mask[np.isnan(mask)] = 2.
            mask[mask == 1] = np.nan
            mask /= 2.
    if zc not in [None, [-90., 90., -180., 180.]]:
        mask = _reshape_data(mask, zc, [-90., 90., -180., 180.])

    if do_zoom:
        sz = data[0].shape
        mask = zoom(mask, [float(sz[0]) / mask.shape[0], float(sz[1]) / mask.shape[1]], order=0,
                    mode='nearest', cval=np.nan)

    if index_ref is not None:
        ref = np.squeeze(data[index_ref])
    else:
        ref = np.squeeze(np.nanmean(data, axis=0)) * mask

    return ref, mask


def _reshape_data(data, zone, native_zc, flag=None):
    """
    :param data:      np.ndarray data matrix
    :param zone:      LIST of float zone coordinates [south, north, west, east]
    :param native_zc: LIST of float native zone coordinates [south, north, west, east]
    :param flag:      drives the output
    :return:          reshaped data matrix --> data[zone]
    """

    true_zc = None
    lat_lon_index = None
    if zone != native_zc:
        sz = np.array(data).shape

        n_south = native_zc[0]
        n_north = native_zc[1]
        n_west = native_zc[2]
        n_east = native_zc[3]

        step_lat = float(n_north - n_south) / sz[0]
        step_lon = float(n_east - n_west) / sz[1]

        # latitude = np.arange(n_south + step / 2, self.default_zc[1] + step / 2, step)
        # longitude = np.arange(self.default_zc[2] + step / 2, self.default_zc[3] + step / 2, step)

        latitude = np.flipud(np.arange(n_south + step_lat / 2., n_north + step_lat / 2., step_lat))
        longitude = np.arange(n_west + step_lon / 2., n_east + step_lon / 2., step_lon)

        ind_lat_min = np.argmin(abs(np.array(latitude) - zone[1]))       # north
        ind_lat_max = np.argmin(abs(np.array(latitude) - zone[0])) + 1  # 2   # south
        ind_lon_min = np.argmin(abs(np.array(longitude) - zone[2]))      # west
        ind_lon_max = np.argmin(abs(np.array(longitude) - zone[3])) + 1  # east

        if ind_lat_min != 0:
            ind_lat_min += 1

        data = data[ind_lat_min:ind_lat_max, ind_lon_min:ind_lon_max]
        lat_lon_index = [ind_lat_min, ind_lat_max, ind_lon_min, ind_lon_max]

        if ind_lat_max == len(latitude):
            ind_lat_max = -1

        if ind_lon_max == len(longitude):
            ind_lon_max = -1

        # correct order is south north west east
        true_zc = [latitude[ind_lat_max], latitude[ind_lat_min], longitude[ind_lon_min], longitude[ind_lon_max]]

    if flag is None:
        return data
    elif flag == 'index':
        return lat_lon_index
    else:
        return true_zc


def reshape_data(data, zone, native_zc, flag=None):
    return _reshape_data(data, zone, native_zc, flag=flag)


def gamma2d(d_ref, d_test, zone_coord, dta=56, pid=5, is_fast=True, is_relative=False):
    """
    :param d_ref:       reference data
    :param d_test:      data to be compared with ref
    :param zone_coord:  geo-locates the matrix lat lon limits, essential to compute distances!!!!
    :param dta:         distance to agreement in km default = pixel size for spatial_resolution
                        (56 for 0.5, 5.6 for 0.05)
    :param pid:         pixel intensity difference (%) default = 5%
    :param is_fast:     This parameter can be True or False, if True, implements the fast calculation.
                        In this case the routine approximates the calculation of GI in the regions where the dta
                        constraint is not satisfied i.e. for all the position which distance from the test-point is
                        greater than dta. The GI is therefore accurately evaluated only in a neighbor of radius dta
                        around the point of interest. On the contrary, if the flag is set to False,
                        the GI is accurately evaluated everywhere.
    :param is_relative  specifies if pid is given in % or has to be intended as absolute value

    :return:            gamma index matrix, gamma test is passed if gamma <=1

    ============
    Description:
    ============
    The gamma-index concept was introduced by Low in 1998 [1]. The test is routinely used in medical physics in order to
    compare two distributions. The gamma-index can however extended to different physical concepts.
    The index takes into account the relative shift both in terms of intensity and in terms of position, combining
    together the pixel intensity difference (PID) and the distance to agreement (DTA) methods.
    The PID is the difference between the physical value in a "reference" data point and the physical value in a point
    of the distribution to test which has the same coordinates. The DTA is the distance between a reference data point
    and the nearest point in the distribution to test that has the same value. By definition, when the gamma index
    results >1, the two distributions are considered to be NOT in good agreement. GI test is instead considered passed
    if the calculated value results <=1.

        [1] Low D A, Harms W B, Mutic S and Purdy J A 1998 A technique for the quantitative evaluation of dose
            distributions. Medical Physics 25 656-61
    -------------------------------------------------
    """
    output = []
    import warnings
    warnings.filterwarnings("ignore")

    lat1 = zone_coord[0]
    lat2 = zone_coord[1]
    lon1 = zone_coord[2]
    lon2 = zone_coord[3]

    if is_relative:
        pid /= 100.

    sq = np.square
    sz1 = d_ref.shape
    sz2 = d_test.shape
    step = (lat2 - lat1) / sz1[0]

    lat_m = np.linspace(lat2, lat1, sz1[0])
    lon_m = np.linspace(lon1, lon2, sz1[1])

    if sz1 != sz2:
        raise Exception("Gamma Index can not be computed for matrices of different sizes.")
    else:
        mask = d_test + d_ref
        gamma = np.full(sz1, fill_value=np.nan)
        delta = np.full(sz1, fill_value=np.nan)
        # dp = np.full(sz1, fill_value=np.nan)
        if dta > 0:
            if is_fast:
                for i in range(sz1[0]):
                    for j in range(sz1[1]):
                        if ~np.isnan(mask[i, j]):
                            # Define starting point.
                            # start = geopy.Point(lat_m[i, j], lon_m[i, j])
                            start = geopy.Point(lat_m[i], lon_m[j])
                            dist = geopy.distance.geodesic(kilometers=dta)
                            # compute lat-lon limits (N-S-W-E) that enclose dta
                            # bearing =   0 --> North
                            # bearing =  90 --> East
                            # bearing = 180 --> South
                            # bearing = 270 --> West
                            north = dist.destination(point=start, bearing=0)
                            east = dist.destination(point=start, bearing=90)
                            south = dist.destination(point=start, bearing=180)
                            west = dist.destination(point=start, bearing=270)
                            # number of pixels enclosed in previous limits
                            bn = abs(int((north.latitude - start.latitude) / step))
                            be = abs(int((east.longitude - start.longitude) / step))
                            bs = abs(int((start.latitude - south.latitude) / step))
                            bw = abs(int((start.longitude - west.longitude) / step))

                            if bn == 0:
                                bn = 1
                            if bs == 0:
                                bs = 1
                            if bw == 0:
                                bw = 1
                            if be == 0:
                                be = 1

                            # index of the matrix!

                            i_n = i - bn
                            i_s = i + bs + 1
                            j_w = j - bw
                            j_e = j + be + 1

                            if i_n < 0:
                                i_n = 0
                            if i_s > sz1[0]:
                                i_s = sz1[0]
                            if j_w < 0:
                                j_w = 0
                            if j_e > sz1[1]:
                                j_e = sz1[1]

                            # initialize r2 array
                            r2 = np.full(np.shape(d_ref[i_n:i_s, j_w:j_e]), fill_value=np.nan)

                            # initial point coordinates (test point)
                            pi = (start.latitude, start.longitude)
                            # squared position difference
                            for ki, i2 in enumerate(range(i_n, i_s)):
                                for kj, j2 in enumerate(range(j_w, j_e)):
                                    if ~np.isnan(mask[i, j]):
                                        # final point coordinates for each pixel enclosed within dta
                                        pf = (lat_m[i2], lon_m[j2])
                                        # exit()
                                        r2[ki, kj] = sq(geopy.distance.geodesic(pi, pf).kilometers)
                            d2 = sq((d_ref[i, j] - d_test[i_n:i_s, j_w:j_e]))
                            if pid == 0.05:  # GCOS
                                i_tol = max(pid * d_ref[i, j], 0.0025)
                            elif pid == 0.2:  # ATBD
                                if d_ref[i, j] > 0.15:
                                    i_tol = 0.2 * d_ref[i, j]
                                else:
                                    i_tol = max(0.1 * d_ref[i, j], 0.015)
                            else:  # ELSE...
                                i_tol = pid * d_ref[i, j]
                            if dta == 0:
                                big_gamma = np.sqrt((d2 / sq(i_tol)))
                            else:
                                big_gamma = np.sqrt(r2 / sq(dta) + (d2 / sq(i_tol)))

                            gamma[i, j] = np.nanmin(big_gamma)

                            if np.nanmin(big_gamma) <= 1.:
                                min_pos = np.where(big_gamma == np.nanmin(big_gamma))
                                delta[i, j] = np.sqrt(r2[min_pos][0])
        else:
            gamma = np.sqrt((sq((d_ref - d_test)) / sq(pid * d_ref)))

    output.append(gamma)
    output.append(delta)
    return output


def get_ks(data1, data2, n_bin=200):
    """
    :param data1:   first distribution
    :param data2:   second distribution
    :param n_bin:   number of bins to calculate cdf for ks
    :return:        Kolmogorov-Smirnov statistics of the two sample. For each pair of datasets the output will be the
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


# def get_trend_full(sub_data, months):
#     out = TemporalDecomposition(sub_data, months, hbad=-9999., filter_outlier=True).decompose()
#     return out
#
#
# def get_trend_line(sub_data, months):
#     sub_data2 = copy.copy(sub_data)
#     sub_data2[np.isnan(sub_data2)] = -9999.
#     out = TemporalDecomposition(sub_data2, months, hbad=-9999., filter_outlier=True).decompose()
#     return out.slope_trend, out.intercept_trend


def get_ivh(data):
    i_max = float(np.nanmax(data))
    i_min = float(np.nanmin(data))
    ptot = np.count_nonzero(~np.isnan(data))
    d = data[~np.isnan(data)]
    i_range = np.linspace(i_min, i_max, 100)
    i_vh = []
    for i in i_range:
        i_vh.append(100 * np.count_nonzero(d > i) / ptot)

    return i_vh, list(i_range)


def moving_average(x, period):
    x2 = np.insert(x, 0, np.array(0))

    # handle the nan!
    if np.count_nonzero(np.isnan(x2)):
        x3 = copy.copy(x2)
        x3[np.isnan(x3)] = 0.
        cum_sum = np.cumsum(x3)
        central_mean = (cum_sum[period:] - cum_sum[:-period]) / period
    else:
        cum_sum = np.cumsum(x2)
        central_mean = (cum_sum[period:] - cum_sum[:-period]) / period

    return central_mean


def _moving_average(x, period):
    x2 = np.insert(x, 0, np.array(0))
    cum_sum = np.cumsum(x2)
    central_mean = (cum_sum[period:] - cum_sum[:-period]) / period

    return central_mean


def _moving_average2(x, period):
    x2 = np.insert(x, 0, np.array(0))
    cum_sum = np.cumsum(x2)
    running_mean = np.zeros(x.shape)
    central_mean = (cum_sum[period:] - cum_sum[:-period]) / period
    running_mean[int(period / 2):int(-period / 2) + 1] = central_mean
    # fill the borders!
    running_mean[:int(period / 2)] = np.nan  # np.nanmean(x[:int(period / 2)])
    running_mean[int(-period / 2) + 1:] = np.nan  # np.nanmean(x[int(-period / 2):])

    return running_mean


def nan_moving_average(x, period):
    sz = len(x)
    mav = []
    j = 0
    while j + period/2 < sz - period/4:
        i_i = max(0, j-period/2)
        i_f = min(sz, j+period/2)
        window = x[i_i:i_f]
        mav.append(np.nanmean(window))
        j += 1
    return np.array(mav)


def nan_filtered_moving_average(x, period, flag='avg'):
    """
    :param x:           np.array like
    :param period:      width of the window
    :param flag:       flag used to specify which filter to apply
    :return:
    """
    sz = len(x)
    mav = []
    j = 0
    while j + period/2 < sz - period/4:
        i_i = max(0, j-period/2)
        i_f = min(sz, j+period/2)
        window = x[i_i:i_f]
        if flag == 'avg':
            filtered = np.nanmean(window)
        elif flag == 'exp':
            # convoluzione il cazzo che vuoi tu
            filtered = 0
        elif flag == 'inv_exp':
            # convoluzione il cazzo che vuoi tu
            filtered = 0
        else:
            # convoluzione il cazzo che vuoi tu
            filtered = 0

        mav.append(filtered)
        j += 1
    return np.array(mav)


def __nan_moving_average(x, period):
    ind_nan = np.where(np.isnan(x))[0]
    sz = ind_nan.size
    x2 = copy.copy(x)
    if sz:
        x2[ind_nan] = np.nanmean(x2)
        rm = _moving_average2(x2, period)
        rm[ind_nan] = np.nan
    else:
        rm = _moving_average(x2, period)
    return rm


def moving_average_idl(x, m, p, period):
    """
    :param x:       Input vector without gaps
    :param m:       coefficient
    :param p:       order of the moving average
    :param period:  periodicity of the input time series
    :return:
    """
    period_calc = period
    p_calc = p
    if not p_calc % 2:  # if is even
        p_calc += 1

    x = np.squeeze(x)

    if period_calc == 1:
        if p == 2:
            period_calc = 1
        elif p == 3:
            period_calc = 2
        elif p == 5:
            period_calc = 3

    n = x.size

    # Compute the centered Mobile Average : M m*p
    # Extend the initial vector for the inclusion of the extremes values (circular method)
    xi = x[(period_calc - 1) - (p_calc - 1) / 2 + 1:period_calc]
    xf = x[(n - 1 - period_calc + 1):(n - 1 - period_calc + 1) + (p_calc - 1) / 2]

    x_calc = np.hstack([xi, x, xf])

    n_calc = len(x_calc)
    ma_x = np.arange(float(n_calc))

    if not m % 2:  # if even!
        for i in range((p_calc - 1) / 2, n_calc - ((p_calc - 1) / 2)):
            a = i - (p_calc - 1) / 2 + 1
            b = i + (p_calc - 1) / 2
            c = i + (p_calc - 1) / 2

            ma_x[i] = (m / 2. * x_calc[a - 1] + np.sum(m * x_calc[a:b]) + m / 2 * x_calc[c]) / (m * (p_calc - 1))
        ma_x = ma_x[((p_calc - 1) / 2):(n + (p_calc - 1) / 2)]

    else:
        ma_x = _moving_average2(x, period)

    return ma_x


def get_hcf(x, y):
    """
    :param x: float
    :param y: float
    :return:  return highest common divisor factor between x and y
    """
    if (x % y) == 0:
        hcf = y
    else:
        n_test = int(y)
        while (x % n_test) != 0:
            n_test -= 1
        hcf = n_test
    # hcf = x /10
    return hcf


def get_gcd(x, y):
    gcd = 1
    if x > y:
        small = y
    else:
        small = x
    for i in range(1, small+1):
        if (x % i == 0) and (y % i == 0):
            gcd = i

    return gcd


def par_hov(lof, product, k, nax, n_land, is_anomaly, is_abs, zc, mask, lc_val, lc_type, tfl=None):
    """
    :param lof:
    :param product:
    :param k:
    :param nax:
    :param n_land:
    :param is_anomaly:
    :param is_abs:
    :param zc:
    :param mask:
    :param lc_val:
    :param lc_type:
    :param tfl:
    :return:
    """
    out = list()
    if is_anomaly and tfl is None:
        raise Exception('ERROR!!!!! no tfl!')
    rd = RasterDataset(lof[k])
    # print lof[k]
    # exit()
    if is_anomaly:
        # data_tmp = np.flipud(rd.get_anomaly(product, tfl, zone_coord=zc, is_absolute=is_abs))
        data_tmp = rd.get_anomaly(product, tfl, zone_coord=zc, is_absolute=is_abs)
    else:
        # data_tmp = np.flipud(rd.get_data(product, zone_coord=zc, mask_param=mask))
        data_tmp = rd.get_data(product, zone_coord=zc, mask_param=mask)

    if lc_val is not None:
        lc_data = _get_lc_data(rd.year, rd.spatial_resolution, lc_type, zc, mask)
        if lc_data is not None:
            data_tmp[lc_data != lc_val] = np.nan

    d = np.squeeze(np.nanmean(data_tmp, axis=nax))
    data_tmp[~np.isnan(data_tmp)] = 1.  # flag with 1 all the non-nans
    data_tmp[np.isnan(data_tmp)] = 0.  # flag with 0 all the nans
    d3 = np.sum(data_tmp, axis=nax)  # den the number of valid land px along 'kind' axis
    d[d3 <= 0.2 * n_land] = np.nan  # at least 20% of valid data!

    out.append([d, k])
    return out


# def par_trend_old(data, months, kk):
#     """
#     :param data:
#     :param months:
#     :param kk:
#     :return:
#     """
#
#     data = data[kk[0]:kk[1], :, :]
#     sz = data.shape
#
#     data_out = np.full([2, data.shape[0], data.shape[1]], fill_value=np.nan)
#     # data_out = np.full([data.shape[0], data.shape[1]], fill_value=np.nan)
#     # slope_out = np.full([data.shape[0], data.shape[1]], fill_value=np.nan)
#     # test_slope = np.full([data.shape[0], data.shape[1]], fill_value=np.nan)
#
#     for ii in range(sz[0]):
#         for jj in range(sz[1]):
#             out = TemporalDecomposition(data[ii, jj, :], months, hbad=-9999., filter_outlier=True).decompose()
#
#             # slope = np.nan
#             # prob = out.prob_test_trend
#             # if prob < 0.05:
#             #     slope = out.slope_trend
#             # data_out[ii, jj] = slope
#
#             data_out[0, ii, jj] = out.slope_trend
#             data_out[1, ii, jj] = out.prob_test_trend
#             # slope_out[ii, jj] = out.slope_trend
#             # test_slope[ii, jj] = out.prob_test_trend
#
#     # return slope_out, test_slope
#
#     return data_out
#
#
# def get_trend(sub_data, months):
#     # ret = np.nan
#     # if np.count_nonzero(np.isnan(sub_data)) < sub_data.size:
#     hb = -9999.
#     # sub_data[np.isnan(sub_data)] = hb
#     out = TemporalDecomposition(sub_data, months, hbad=hb, filter_outlier=True, overall_cutoff=70).decompose()
#     ret = out.seasonal_kendall_sen
#     # return now: [sen_slope, prob_sen_slope, prob_chi_trend, prob_chi_homog, RC (rate of change slope/intercept)]
#     return ret


def get_lambda(data1, data2):
    """
    :param data1:  dataset 1
    :param data2:  dataset 2
    :return:    calculates the lambda symmetric coefficient as introduced in Duvellier et al.
                www.nature/scientificreports, DOI:10.1038/srep19401
    """
    mk = data1 + data2
    d1 = data1[~np.isnan(mk)]
    lambda_coeff = np.nan

    if d1.size > 0:
        #
        avgd1 = np.nanmean(data1)
        avgd2 = np.nanmean(data2)
        std1 = np.nanstd(data1)
        std2 = np.nanstd(data2)
        var1 = np.nanvar(data1)
        var2 = np.nanvar(data2)

        r = np.nanmean((data1 - avgd1) * (data2 - avgd2)) / (std1 * std2)
        r = max(min(r, 1.0), -1.0)

        delta = np.nanmean(np.square(data1 - data2))
        if r >= 0:
            k = 0
        else:
            k = 2. * abs(np.nansum((data1 - avgd1) * (data2 - avgd2)))

        lambda_coeff = 1. - delta / (var1 + var2 + np.square(avgd1 - avgd2) + k)

    return lambda_coeff


def get_lambda_matrix(data1, data2, delta=None, avgd1=None, avgd2=None, var1=None, var2=None, k=None, is_data=True):
    """
    :param data1:       dataset 1
    :param data2:       dataset 2
    :param var1:        std value of dataset2
    :param var2:        std value of dataset2
    :param avgd1:       avg value of dataset1
    :param avgd2:       avg value of dataset2
    :param delta:       np.nanmean(np.square(data1 - data2))
    :param k:           parameter that account for bias
    :param is_data:     for very large time series parameters are calculated iteratively
    :return:

    :return:    calculates the lambda symmetric coefficient as introduced in Duvellier et al.
                www.nature/scientificreports, DOI:10.1038/srep19401
    """
    if is_data:
        avgd1 = np.nanmean(data1, axis=1)
        avgd2 = np.nanmean(data2, axis=1)

        stdev1 = np.nanstd(data1, axis=1)
        stdev2 = np.nanstd(data2, axis=1)

        var1 = np.nanvar(data1, axis=1)
        var2 = np.nanvar(data2, axis=1)

        # pearson product moment correlation coefficient analogue to scipy.stats.pearsonr(d1, d2)[0]
        avgm1 = np.tile(avgd1, (data1.shape[1], 1)).T
        avgm2 = np.tile(avgd2, (data2.shape[1], 1)).T

        delta1 = data1 - avgm1
        delta2 = data2 - avgm2
        delta_prod = delta1 * delta2

        r = np.nanmean(delta_prod, axis=1) / (stdev1 * stdev2)

        r[r < -1] = -1
        r[r > 1] = 1

        delta = np.nanmean(np.square(data1 - data2), axis=1)
        k = 2. * abs(np.nansum((data1 - avgm1) * (data2 - avgm2), axis=1))
        k[r >= 0] = 0

        lambda_array = np.ones_like(r) - delta / (var1 + var2 + np.square(avgd1 - avgd2) + k)

    else:
        if None not in [delta, avgd1, avgd2]:
            lambda_array = np.ones_like(k) - delta / (var1 + var2 + np.square(avgd1 - avgd2) + k)
        else:
            lambda_array = np.nan

    return lambda_array


def _get_lc_data(year, res, lc_type, zc, mask, extract=False, neigh=0):

    lc_data = None
    try:
        lc_file_name = ECV_dictionary.LC_file_names[lc_type][ECV_dictionary.LC_res2Idx.index(res)]
    except ValueError:
        lc_file_name = None

    if int(year) < 1992:
        year = '1992'
    if int(year) > 2015:
        year = '2015'

    if lc_file_name is not None:
        rd_lc = RasterDataset(lc_file_name)
        lc_data = rd_lc.get_data(year, zone_coord=zc, mask_param=mask, extract=extract, neigh=neigh)

    return lc_data


def write_nc(file_name, data, dataset_tag, dataset_long_name=None, fill_value=None, scale_factor=None, offset=None,
             valid_range=None, dtype=None, zc=None, mode=None, history=None, lats=None, lons=None, global_attrs=None,
             compression=9):
    """
    :param file_name:           output full name
    :param data:                datasets to be write to, list
    :param dataset_tag:         tag name associated to each dataset in the dataset list
    :param dataset_long_name:   long name associated to each dataset in the dataset list
    :param fill_value:          fill_value, default = np.nan
    :param scale_factor:        scale_factor, default = 1.
    :param offset:              offset, default = 0
    :param valid_range:         valid_range, default [data_min, data_max]
    :param dtype:               data type, default = float
    :param zc:                  geographic extensions, default = [-90S, 90N, -180W, 180E]
    :param mode:                netCDF4 open mode, default = w (write), can be either:
                                    w (write mode) to create a new file, over-write existing one
                                    r (read mode) to open an existing file read-only
                                    r+ (append mode) to open an existing file and change its contents

    :param history:             resumes the principal characteristics of the netCDF dataset, these will be
                                written on the global attributes only if the 'w' mode is selected

    :param lats:
    :param lons:
    :param global_attrs:
    :param compression:
    :return:
    """
    # convert python data-type into NetCDF formalism
    datatype_dict = {'int8': 'NC_BYTE',
                     'uint8': 'NC_UBYTE',
                     'char': 'NC_CHAR',
                     'int16': 'NC_SHORT',
                     'uint16': 'NC_USHORT',
                     'int32': 'NC_INT',
                     'uint32': 'NC_UINT',
                     'int64': 'NC_INT64',
                     'uint64': 'NC_UINT64',
                     'float32': 'NC_FLOAT',
                     'float': 'NC_FLOAT',
                     'str': 'NC_STRING'}
    if dataset_long_name is None:
        dataset_long_name = dataset_tag
    if fill_value is None:
        fill_value = np.nan
    if scale_factor is None:
        scale_factor = 1.
    if offset is None:
        offset = 0.
    # if valid_range is None:
    #     valid_range = [np.nanmin(np.asarray(data)), np.nanmax(np.asarray(data))]
    if dtype is None:
        data_type = 'float'
    else:
        data_type = dtype
    try:
        str_type = datatype_dict[data_type]
    except KeyError:
        print("data-type " + "'" + str(dtype) + "'" + " not understood! Please check! EXIT!")
        str_type = None
        exit()

    if zc is None:
        zc = [-90, 90, -180, 180]
    if mode is None or mode not in ['w', 'a', 'r+']:
        if mode == 'r':
            print("mode cannot be 'r', this is dedicated to read only procedure. mode 'r+' is then assumed.")
            mode = 'r+'
        else:
            # print "mode should be one of the following: 'w', 'r', 'a', 'r+', got " + "'" + str(mode) + "'" + \
            #       " instead, default 'w' assumed."
            mode = 'w'

    # print mode

    if history is None:
        history = ' Created at JRC on ' + datetime.datetime.now().strftime("%d, %b %Y %H:%M")

    dataset = Dataset(file_name, mode, format='NETCDF4')

    if mode == 'w':
        size = data[0].shape

        dataset.Conventions = 'CF-1.6'
        dataset.institution = 'Joint Research Centre'
        if global_attrs is not None:
            for a in global_attrs:
                dataset.setncattr(a, global_attrs[a])

        dataset.createDimension('latitude', data[0].shape[0])
        dataset.createDimension('longitude', data[0].shape[1])
        dataset.createDimension('time', None)

        dataset.history = history

        # Variables
        latitudes = dataset.createVariable('latitude', np.float32, ('latitude',))
        longitudes = dataset.createVariable('longitude', np.float32, ('longitude',))
        latitudes.units = 'degree_north'
        longitudes.units = 'degree_east'
        if lats is None:
            step_lat = abs(float(zc[0] - zc[1]) / (size[0]))
            hb_lat = step_lat / 2
            lats = np.linspace(zc[1] - hb_lat, zc[0] + hb_lat, size[0])
        if lons is None:
            step_lon = abs(float(zc[3] - zc[2]) / (size[1]))
            hb_lon = step_lon / 2
            lons = np.linspace(zc[2] + hb_lon, zc[3] - hb_lon, size[1])

        latitudes[:] = lats
        longitudes[:] = lons

    for i, var_name in enumerate(dataset_tag):
        # data_type = 'float'
        var = dataset.createVariable(var_name, data_type, ('latitude', 'longitude'),
                                     zlib=True, complevel=compression, fill_value=fill_value)
        var[:] = data[i]
        var.setncattr('long_name', dataset_long_name[i])
        var.setncattr('scale_factor', scale_factor)
        var.setncattr('add_offset', offset)
        if valid_range is not None:
            var.setncattr('valid_range', valid_range)
        var.setncattr('data_type', str_type)

    dataset.close()
