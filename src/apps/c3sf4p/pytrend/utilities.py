"""
# ###############################################################################
# version:          R1.0.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    08 Mar 2021                                                 #
# property of:      JRC                                                         #
# purpose:          library containing f4p_utilities for trend handler          #
#             --------------------------------------------------                #
# last edit:        under development                                           #
#  *************************************************************************    #
# ###############################################################################
"""
import os
import numpy as np
from src.apps.c3sf4p.pytrend.MK_trend import TrendAnalyser


def par_trend(n, input_param):
    """
    :param n:        parallel index
    :param input_param: = {'p': self.p,                 # partitions
                     'size': self.size,                 # size
                     'wm': self.wm,                     # water mask
                     'dt': self.dt,                     # date array
                     'mk': self.is_mk                   # allows to trigger mann kendal calculation
                     'path2data': self.path_data,       # path to saved data 2 handle
                     'path2slopes': self.path_slopes,   # path where to save tmp slopes
                     'head': self.head}                 # header of save_name
    :return:
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

    sl_name = s_path + head + '-' + str(n).zfill(2) + '.npy'
    if not os.path.exists(sl_name):
        data = np.load(d_path + head + '-' + str(n).zfill(2) + '.npy')

        i0 = step * n
        i1 = (n + 1) * step
        if n + 1 == nloops:
            i1 = None
        wm = wm[i0:i1]
        ind_good = np.where(wm != 0)

        slopes = np.full_like(wm, fill_value=np.nan)
        interc = np.full_like(wm, fill_value=np.nan)
        pvalue = np.full_like(wm, fill_value=np.nan)

        for k in ind_good[0]:

            d = data[k, :]
            slope, intercept, pval, _, _ = TrendAnalyser(d, dt, frequency=frequency, dbg=dbg).test_trend()
            slopes[k] = slope
            interc[k] = intercept
            pvalue[k] = pval
        np.save(sl_name, [slopes, interc, pvalue])
