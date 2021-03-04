# ###############################################################################
# version:          R1.3.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    11 Dec 2019                                                 #
# property of:      JRC                                                         #
# purpose:          main library containing the functions for trend handler     #
#             --------------------------------------------------                #
# last edit:        18 Mar 2020                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################
from statsmodels.tsa.seasonal import seasonal_decompose
import numpy as np
from scipy.stats import norm, stats
import pandas as pd
import statsmodels.api as sm


class TrendAnalyser(object):
    def __init__(self, data_series, time_series, frequency=12, alpha=0.05, deseasonal=True, rlm=True):
        """
        :param data_series: 1D np.array data series
        :param time_series: 1D np.array temporal coordinates
        :param frequency:   frequency of the series, Must be used if x is not a pandas object.
                            Overrides default periodicity of x if x is a pandas object with a timeseries index.
        :param alpha:       scalar, float, greater than zero significance level of the statistical test (Type I error)
        :param deseasonal:  whether or not to apply mann kendal analysis
        """
        self.isRLM = rlm
        self.clima_dict = {}
        self.d = data_series
        self.t = time_series
        self.deseasonal = deseasonal
        self.months = []
        self.years = []
        for t in self.t:
            tsplit = t.split('-')
            self.months.append(tsplit[0])
            self.years.append(tsplit[1])

        self.ts = None

        self.freq = frequency
        self.alpha = alpha
        self.slope = self.intercept = 0
        self.p = self.z = np.nan
        self.h = False
        self.trend_type = 'no trend'
        self.trend = None

    def test_trend(self):
        if self.deseasonal:
            self._gap_filler()
            if np.count_nonzero(np.isnan(self.d)) == 0:
                self.ts = pd.Series(self.d, index=pd.to_datetime(self.t))
                self._deseasonalize()
                self._mk_test()
                out = [self.slope, self.intercept, self.p, self.trend_type, self.h]
            else:
                out = [np.nan, np.nan, np.nan, 'undefined', 'False']
        else:
            if self.isRLM:
                out = self._robust_linear_model()
            else:
                out = self._linear_regression()
        return out

    def _mk_test(self):
        """
        :return:
        trend_type: tells the trend_type (increasing, decreasing or no trend_type)
        slope:  slope of linear model y = ax + b
        intercept:  intecept of linear model y = ax + b
        h: True (if a trend is detected) or False (otherwise)
        p: p value of the significance test
        z: normalized test statistics

        """
        # nobs = len(self.trend)

        # calculate S

        trend_component = np.array(self.trend)

        test_trend = trend_component[~np.isnan(trend_component)]

        test_trend *= 100
        # print(test_trend)
        test_trend = test_trend.astype('int')
        # print(test_trend)
        test_trend = test_trend.astype('float') / 100.
        # print(test_trend)
        # exit()

        s = 0
        nobs = len(test_trend)
        for k in range(nobs - 1):
            for j in range(k + 1, nobs):
                s += np.sign(test_trend[j] - test_trend[k])

        # print(s)
        # exit()
        # calculate the unique data
        unique_x = np.unique(test_trend)
        g = len(unique_x)
        # calculate the var(s)

        if nobs == g:  # there is no tie
            var_s = (nobs * (nobs - 1.) * (2. * nobs + 5.)) / 18.
        else:  # there are some ties in data
            tp = np.zeros(unique_x.shape)
            for i in range(len(unique_x)):
                tp[i] = sum(unique_x[i] == test_trend)
                # print(unique_x[i], tp[i])
            var_s = (nobs * (nobs - 1.) * (2. * nobs + 5.) + np.sum(tp * (tp - 1.) * (2. * tp + 5.))) / 18.

        if s > 0:
            self.z = (s - 1) / np.sqrt(var_s)
        elif s < 0:
            self.z = (s + 1) / np.sqrt(var_s)
        else:
            self.z = 0

        # calculate the p_value
        # print(abs(self.z), norm.ppf(1 - self.alpha / 2))
        # exit()
        self.h = abs(self.z) > norm.ppf(1 - self.alpha / 2)

        # if (self.z < 0) and self.h:
        #     self.trend_type = 'decreasing'
        # elif (self.z > 0) and self.h:
        #     self.trend_type = 'increasing'

        if self.h:
            if self.z < 0:
                self.trend_type = 'decreasing'
            elif self.z > 0:
                self.trend_type = 'increasing'

            # self.p = 2 * (1 - norm.cdf(abs(self.z)))  # two tail test
            if self.trend_type != 'no trend':
                xx = np.arange(0., len(trend_component), 1.)
                xx = xx[~np.isnan(trend_component)]
                self.slope, self.intercept, r_value, self.p, std_err = stats.linregress(xx, test_trend)

            # self.slope = slope
            # self.intercept = intercept
        # print()
        # print(self.trend_type)
        #
        # xx = np.arange(len(self.trend))
        # yy = self.intercept + self.slope * xx
        # import matplotlib.pyplot as plt
        # plt.plot(xx, yy, ls='-', color='k', lw=2, label='trend line')
        # plt.legend()
        # plt.show()

        # exit()

    def _deseasonalize(self):

        # self.trend = seasonal_decompose(self.ts, model='addictive', filt=[0, 0, 0]).trend

        try:
            result = seasonal_decompose(self.ts, model='addictive')
        except ValueError:
            result = seasonal_decompose(self.ts, model='addictive', freq=self.freq)

        self.trend = result.trend

        # T = result.observed - result.seasonal
        # result.plot()
        # plt.show()
        # x = result.trend
        # plt.figure()
        # plt.plot(x)
        # plt.plot(T, ls='--', color='r', lw=3)

    def _gap_filler(self):
        ind_nan = np.where(np.isnan(self.d))[0]
        if any(ind_nan):
            to_fill = self.d.copy()
            for i in ind_nan:
                try:
                    _fill = self.clima_dict[self.months[i]]
                except KeyError:
                    ind_clima = [j for j, m in enumerate(self.months) if m == self.months[i]]
                    _fill = np.nanmean(self.d[ind_clima])
                    self.clima_dict[self.months[i]] = _fill
                to_fill[i] = _fill
            self.d = to_fill

    def _robust_linear_model(self):
        """
        :return: trend_type parameters, errors and p-value

        NOTICE: Null hypothesis is that the slope is zero.
        p-value here is relative to t-value:
        The larger the absolute value of the t-value, the smaller the p-value,
        and the greater the evidence AGAINST the null hypothesis.
        The lower is the the absolute value of t-value, the larger is the p-value,
        and the greater the evidence IN SUPPORT to the null hypothesis.

        """
        sm_slope = sm_int = r2 = pv = slope_error = np.nan
        try:
            line = np.asarray(self.d).copy()

            if line[~np.isnan(line)].size > 0:
                xx = np.arange(0, len(line), 1)
                big_x = sm.add_constant(xx[~np.isnan(line)])
                rlm = sm.RLM(line[~np.isnan(line)], big_x, M=sm.robust.norms.HuberT())
                res = rlm.fit()
                sm_int, sm_slope = res.params
                pv = res.pvalues[1]  # res.pvalues = [pv_intercept, pv_slope] so take [1] for slope!

                slope_error = res.bse[1]

                model = sm_int + xx * sm_slope
                r2 = np.square(1. / len(line) * np.nansum((line - np.nanmean(line)) * (model - np.nanmean(model))) /
                               (np.nanstd(line) * np.nanstd(model)))
            else:
                pass
                # print('lamierd!')
        except ZeroDivisionError:
            pass
            # sm_slope = sm_int = r2 = pv = slope_error = np.nan
        return sm_slope, sm_int, pv, r2, slope_error

    def _linear_regression(self):
        line = np.asarray(self.d).copy()
        # line = filter_outlier(np.asarray(temporal_series).copy(), nsigma=1)
        xx = np.arange(0, len(line), 1)
        slope, intercept, r_value, p_value, std_err = stats.linregress(xx[~np.isnan(line)], line[~np.isnan(line)])
        return slope, intercept, p_value, np.square(r_value), std_err
