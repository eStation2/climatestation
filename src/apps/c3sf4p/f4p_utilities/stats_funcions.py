"""
Statistical tools in support for C3S-F4P class
"""
import numpy as np


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
