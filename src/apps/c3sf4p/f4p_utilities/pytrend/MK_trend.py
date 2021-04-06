"""
# ###############################################################################
# version:          R1.1.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    31 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          main library containing the functions for trend handler     #
#             --------------------------------------------------                #
# last edit:        Under development                                           #
#  *************************************************************************    #
# ###############################################################################
**********************
                        **********************

This Version of Mann-Kendall trend is based on pymannkendall library

REF:                pip install pymannkendall
                    https://github.com/mmhs013/pyMannKendall

CIT:                Hussain et al., (2019). pyMannKendall: a python package for non parametric Mann
                    Kendall family of trend tests. Journal of Open Source Software, 4(39), 1556,
                    https://doi.org/10.21105/joss.01556

The Mann-Kendall Trend Test (sometimes called the MK test) is used to analyze time series data for consistently
increasing or decreasing trends (monotonic trends). It is a non-parametric test, which means it works for all
distributions (i.e. data doesn't have to meet the assumption of normality), but data should have no serial
correlation. If the data has a serial correlation, it could affect in significant level (p-value). It could lead
to misinterpretation. To overcome this problem, researchers proposed several modified Mann-Kendall tests
(Hamed and Rao Modified MK Test, Yue and Wang Modified MK Test, Modified MK test using Pre-Whitening method, etc.).
Seasonal Mann-Kendall test also developed to remove the effect of seasonality.

Mann-Kendall Test is a powerful trend test, so several others modified Mann-Kendall tests like Multivariate MK Test,
Regional MK Test, Correlated MK test, Partial MK Test, etc. were developed for the spacial condition. pyMannkendal
is a pure Python implementation of non-parametric Mann-Kendall trend analysis, which bring together almost all types
of Mann-Kendall Test. Currently, this package has 11 Mann-Kendall Tests and 2 sen's slope estimator function.
Brief description of functions are below:

    - Original Mann-Kendall test (original_test): Original Mann-Kendall test is a nonparametric test,
      which does not consider serial correlation or seasonal effects.

    - Hamed and Rao Modified MK Test (hamed_rao_modification_test): This modified MK test proposed by Hamed and Rao
      (1998) to address serial autocorrelation issues. They suggested a variance correction approach to improve trend
      analysis. User can consider first n significant lag by insert lag number in this function. By default,
      it considered all significant lags.

    - Yue and Wang Modified MK Test (yue_wang_modification_test): This is also a variance correction method for
      considered serial autocorrelation proposed by Yue, S., & Wang, C. Y. (2004). User can also set their desired
      significant n lags for the calculation.

    - Modified MK test using Pre-Whitening method (pre_whitening_modification_test): This test suggested by
      Yue and Wang (2002) to using Pre-Whitening the time series before the application of trend test.

    - Modified MK test using Trend free Pre-Whitening method (trend_free_pre_whitening_modification_test):
      This test also proposed by Yue and Wang (2002) to remove trend component and then Pre-Whitening the time
      series before application of trend test.

    - Multivariate MK Test (multivariate_test): This is an MK test for multiple parameters proposed by
      Hirsch (1982). He used this method for seasonal mk test, where he considered every month as a parameter.

    - Seasonal MK Test (seasonal_test): For seasonal time series data, Hirsch, R.M., Slack, J.R. and Smith,
      R.A. (1982) proposed this test to calculate the seasonal trend.

    - Regional MK Test (regional_test): Based on Hirsch (1982) proposed seasonal mk test, Helsel, D.R. and Frans,
      L.M., (2006) suggest regional mk test to calculate the overall trend in a regional scale.

    - Correlated Multivariate MK Test (correlated_multivariate_test): This multivariate mk test proposed by
      Hipel (1994) where the parameters are correlated.

    - Correlated Seasonal MK Test (correlated_seasonal_test): This method proposed by Hipel (1994) used,
      when time series significantly correlated with the preceding one or more months/seasons.

    - Partial MK Test (partial_test): In a real event, many factors are affecting the main studied response
      parameter, which can bias the trend results. To overcome this problem, Libiseller (2002) proposed this
      partial mk test. It required two parameters as input, where, one is response parameter and other is an
      independent parameter.

    - Theil-Sen's Slope Estimator (sens_slope): This method proposed by Theil (1950) and Sen (1968)
      to estimate the magnitude of the monotonic trend. Intercept is calculate using Conover, W.J. (1980) method.

    - Seasonal Theil-Sen's Slope Estimator (seasonal_sens_slope): This method proposed by Hipel (1994) to estimate
     the magnitude of the monotonic trend, when data has seasonal effects. Intercept is calculate using Conover,
     W.J. (1980) method.

Function details:
All Mann-Kendall test functions have almost similar input parameters. Those are:

    x:          a vector (list, numpy array or pandas series) data
    alpha:      significance level (0.05 is the default)
    lag:        No. of First Significant Lags (Only available in hamed_rao_modification_test and
                yue_wang_modification_test)
    period:     seasonal cycle. For monthly data it is 12, weekly data it is 52 (Only available in seasonal tests)

And all Mann-Kendall tests return a named tuple which contained:

    trend:      tells the trend (increasing, decreasing or no trend)
    h:          True (if trend is present) or False (if the trend is absence)
    p:          p-value of the significance test
    z:          normalized test statistics
    Tau:        Kendall Tau
    s:          Mann-Kendal's score
    var_s:      Variance S
    slope:      Theil-Sen estimator/slope
    intercept:  intercept of Kendall-Theil Robust Line, for seasonal test, full period cycle consider as unit time step

Sen's slope function required data vector. seasonal sen's slope also has optional input period, which by the
default value is 12. Both sen's slope function return only slope value.
********************************************************************************************************************
********************************************************************************************************************
"""
import os
import numpy as np
import pandas as pd
import pymannkendall as mk


def par_trend(n, input_param):
    """
    :param n:               int: parallel index
    :param input_param:     type(dict):
                            {'dt':          time-date array
                             'path2data':   path where to read data series for which calculating the trend
                             'path2slopes': path where to save the calculated trend infos
                             'data_mask':   mask array, set the index of valid pixels (not-nan)
                             'head':        head defining the name of temporary data to read
                             'step':        used to define the index of the matrix-chunk relative to the current loop
                             'nloops':      parallel loop index number
                             'dbg':         enables debug mode
                             'fid':         object of kind open(filename) points to the log_file where to write
                                            debug output
                             'frequency'    frequency of the timeseries, i.e. how many observations per year
    :return:

        Save a npy temporary file into the save_path directory for each loop of parallel cycle


    """
    dt = input_param['dt']
    d_path = input_param['path2data']
    s_path = input_param['path2slopes']
    head = input_param['head']
    wm = input_param['data_mask']
    step = input_param['step']
    nloops = input_param['nloops']
    dbg = input_param['dbg']
    fid = input_param['fid']
    frequency = input_param['frequency']
    threshold = input_param['threshold']

    if dbg:
        fid.writelines('start parallel loop index ' + str(n) + '\n')

    sl_name = s_path + head + '-' + str(n).zfill(2) + '.npy'
    if not os.path.exists(sl_name):
        i0 = step * n
        i1 = (n + 1) * step
        if n + 1 == nloops:
            i1 = None
        # reading temporary data chunk as saved in previous step
        if dbg:
            fid.writelines('reading chunk ' + str(n) + '\n')
        data = np.load(d_path + head + '-' + str(n).zfill(2) + '.npy')
        wm = wm[i0:i1]
        ind_good = np.where(wm != 0)

        slopes = np.full_like(wm, fill_value=np.nan)
        interc = np.full_like(wm, fill_value=np.nan)
        pvalue = np.full_like(wm, fill_value=np.nan)

        for k in ind_good[0]:
            d = data[k, :]
            ts = pd.Series(d, index=pd.to_datetime(dt))

            trend_out = mk.seasonal_test(ts, period=frequency, alpha=threshold)

            slopes[k] = trend_out.slope / frequency
            interc[k] = trend_out.intercept
            pvalue[k] = trend_out.p

        np.save(sl_name, [slopes, interc, pvalue])

        if dbg:
            fid.writelines('end parallel loop index ' + str(n) + '\n')
