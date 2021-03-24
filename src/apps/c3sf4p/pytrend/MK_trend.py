"""
# ###############################################################################
# version:          R1.0.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    08 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          main library containing the functions for trend handler     #
#             --------------------------------------------------                #
# last edit:        Under development                                           #
#  *************************************************************************    #
# ###############################################################################
"""
from statsmodels.tsa.seasonal import seasonal_decompose
import numpy as np
from scipy.stats import norm, stats
import pandas as pd
from datetime import datetime


class TrendAnalyser(object):
    def __init__(self, data_series, time_series, frequency=12, alpha=0.05, dbg=False):
        """
        :param data_series: 1D np.array data series
        :param time_series: 1D np.array temporal coordinates
        :param frequency:   frequency of the series, Must be used if x is not a pandas object.
                            Overrides default periodicity of x if x is a pandas object with a timeseries index.
        :param alpha:       scalar, float, greater than zero significance level of the statistical test (Type I error)
        """

        self.clima_dict = {}
        self.d = data_series
        self.t = time_series
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
        self.dbg = dbg

    def test_trend(self):
        # fill potential gaps in the timeseries (nan values)
        self._gap_filler()
        if np.count_nonzero(np.isnan(self.d)) == 0:
            self.ts = pd.Series(self.d, index=pd.to_datetime(self.t))
            self._deseasonalize()
            self._mk_test()
            out = [self.slope, self.intercept, self.p, self.trend_type, self.h]
        else:
            '''
            in the cas that the _gap_filler didn't succeed in filling all the gaps, some nan are still present in the 
            timeseries, in this case the trend cannot be calculated and the function return an "undefined" situation
            '''
            out = [np.nan, np.nan, np.nan, 'undefined', 'False']

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

        # calculate S
        trend_component = np.array(self.trend)
        test_trend = trend_component[~np.isnan(trend_component)]
        test_trend *= 100

        test_trend = test_trend.astype('int')

        test_trend = test_trend.astype('float') / 100.

        s = 0
        nobs = len(test_trend)
        for k in range(nobs - 1):
            for j in range(k + 1, nobs):
                s += np.sign(test_trend[j] - test_trend[k])

        unique_x = np.unique(test_trend)
        g = len(unique_x)
        # calculate the var(s)

        if nobs == g:  # there is no tie
            var_s = (nobs * (nobs - 1.) * (2. * nobs + 5.)) / 18.
        else:  # there are some ties in data
            tp = np.zeros(unique_x.shape)
            for i in range(len(unique_x)):
                tp[i] = sum(unique_x[i] == test_trend)

            var_s = (nobs * (nobs - 1.) * (2. * nobs + 5.) + np.sum(tp * (tp - 1.) * (2. * tp + 5.))) / 18.

        if s > 0:
            self.z = (s - 1) / np.sqrt(var_s)
        elif s < 0:
            self.z = (s + 1) / np.sqrt(var_s)
        else:
            self.z = 0

        # calculate the p_value
        self.h = abs(self.z) > norm.ppf(1 - self.alpha / 2)
        if self.h:
            if self.z < 0:
                self.trend_type = 'decreasing'
            elif self.z > 0:
                self.trend_type = 'increasing'

            if self.trend_type != 'no trend':
                xx = np.arange(0., len(trend_component), 1.)
                xx = xx[~np.isnan(trend_component)]
                self.slope, self.intercept, r_value, self.p, std_err = stats.linregress(xx, test_trend)

    def _deseasonalize(self):
        try:
            result = seasonal_decompose(self.ts, model='addictive')
        except ValueError:
            result = seasonal_decompose(self.ts, model='addictive', freq=self.freq)

        self.trend = result.trend

    def _gap_filler(self):
        """
        fills potential gaps (namely nan values) in the timeseries with climatological value.
        The main limitation of this approach is that if given a determined month, all the values are nan also the
        associated climatology is nan, and the method fails.

        Possible solution:
        in such case of failure a reasonable workaround could be to interpolate surrounding values with a linear
        function. This approach works well in all the cases when the vacancy is located in a monotonic increasing or
        decreasing part of the seasonality, whereas it will dramatically fail in all the cases when the vacancy is
        located in a local maximum (minimum), in this case the interpolated value is more than questionable.

        Another possible solution is to apply the Ibanez Conversi (IBANEZ and CONVERSI, 2002) methodology, which is
        working pretty well in all scenarios. Here the main disadvantage is the complexity of the method
        (and of the associated code) and the computational time which increases using this method.



        :return:
        """
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

    def _linear_regression(self):
        """
        Final trend is expressed as a linear interpolation of the trend-signal obtained after the deseasonal processor
        of the input signal.
        :return:
        """
        line = np.asarray(self.d).copy()
        # line = filter_outlier(np.asarray(temporal_series).copy(), nsigma=1)
        xx = np.arange(0, len(line), 1)
        slope, intercept, r_value, p_value, std_err = stats.linregress(xx[~np.isnan(line)], line[~np.isnan(line)])
        return slope, intercept, p_value, np.square(r_value), std_err

