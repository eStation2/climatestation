# ###############################################################################
# version:          R1.3.0                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    13 Mar 2017                                                 #
# property of:      JRC                                                         #
# purpose:          main Classes containing the functions for read and import   #
#                   raster dataset in NetCDF or HDF4 format                     #
#             --------------------------------------------------                #
# last edit:        17 Apr 2020                                                 #
#  *************************************************************************    #
#      UPDATED CLEAN VERSION                                                    #
#                                                                               #
# ###############################################################################

# from my_pyhdf import SD, HDF4Error
# from pyhdf.SD import SD, HDF4Error
import os
import datetime
import copy
import ECV_dictionary
from netCDF4 import Dataset
import re
import numpy as np
import gdal
import cftime
# gdal=None


class CustomError(Exception):
    def __init__(self, arg):
        self.msg = arg


class _ImportData:
    """
    import raster dataset from netCDF and HDF4 file type. Input parameters are filename (full path) and product
    string name.
    """
    def __init__(self, filename, product=None):
        """
        :param filename:    STRING: full filename including the path
        :param product:     STRING: optional product name
        """

        # read_metadata = True
        # if read_metadata:
        #     try:
        #         str_test = os.path.basename(filename).split('_')
        #         year = str_test[1][:4]
        #         month_num = str_test[1][4:6]
        #         try:
        #             datetime.date(int(year), int(month_num), 1).strftime('%B')
        #         except ValueError:
        #             read_metadata = False
        #     except IndexError:
        #         read_metadata = False

        # self.read_metadata = read_metadata

        self.min_float = 1.e-10  # minimum available value
        self.zone_coord = None
        self.true_zc = None
        self.points = None
        self.data_extr = None
        self.filename = filename
        self.product = product
        self._hdf_file = None
        self._data = np.ndarray
        self.flag = None
        self.extract = False
        self.lat_offset = 0.  # used in _haversine formulae to get rid of undetermined situations
        self.lon_offset = 0.
        self.neigh = None
        _, ext = os.path.splitext(self.filename)
        if ext in ['.nc', '.NC']:
            self.flag = 0
        elif ext in ['.hdf', '.HDF']:
            self.flag = 1
        elif ext in ['.tif', '.tiff', '.TIF', 'TIFF']:
            self.flag = 2
        else:
            str_exc = 'Unknown File Type: Files with extension .' + ext + ' cannot be handled.'
            raise CustomError(str_exc)

        p0 = './utilities/Climatology/'
        # p0 = '/cleo02/projects/CLEO/Coherence_Analysis/Climatology_GlobAlbedo/'
        if not os.path.exists(p0):
            os.makedirs(p0)
        self.path_to_clima = p0

        self.sens_dic = ECV_dictionary.sens_dic
        self.prod_type = None

        meta = self._get_metadata()
        # if self.read_metadata:
        #     meta = self._get_metadata()
        # else:
        #     meta = [None, None, None, None, None, None, None, None, None, None, None]

        self.sensor_name = meta[0]
        self.year = meta[1]
        self.month_num = meta[2]
        self.day = meta[3]
        self.default_zc = meta[4]
        self.month_name_long = meta[5]
        self.month_name_short = meta[6]
        self.native_dim = meta[7]
        self.spatial_resolution = meta[8]
        self.temporal_resolution = meta[9]
        self.sensor_tag = meta[11]
        try:
            self.prod_code = ECV_dictionary.prod_dic[meta[10]]
        except KeyError:
            self.prod_code = meta[10]

        if None not in [self.day, self.month_name_short, self.year, self.month_name_long, self.month_num]:
            if self.day != '00':
                self.date = self.day + '-' + self.month_name_short + '-' + self.year
                self.date_long = self.day + '-' + self.month_name_long + '-' + self.year
                self.date_num = self.year + self.month_num + self.day
            else:
                self.date = self.month_name_short + '-' + self.year
                self.date_long = self.month_name_long + '-' + self.year
                self.date_num = self.year + self.month_num

    def _get_metadata(self, filename=None):
        """
        :return:  list of metadata:
                    metadata[0]:  STRING: sensor name
                    metadata[1]:  STRING: year
                    metadata[2]:  STRING: month
                    metadata[3]:  STRING: day
                    metadata[4]:  LIST of float: default zone coordinates [north, south, west, east]
                    metadata[5]   STRING: month name long format ex: November
                    metadata[6]   STRING: month name short format ex: Nov
                    metadata[7]   STRING: dataset dimension [pixels_lat x pixels_lon]
                    metadata[8]   STRING: spatial_resolution: 0005 // 0050 etc...
                    metadata[9]   STRING: temporal spatial_resolution: 001M, 010D etc...
                    metadata[10]  STRING: ECV type
        """
        if filename is None:
            filename = self.filename

        str_test = os.path.basename(filename).split('_')

        sensor_tag = str_test[0]

        try:
            temp_res = str_test[2]
        except IndexError:
            temp_res = None
        try:
            res = str_test[4]
        except IndexError:
            res = None

        try:
            prod_code = str_test[5]
        except IndexError:
            prod_code = None

        try:
            year = str_test[1][:4]
            month_num = str_test[1][4:6]
            day = str_test[1][6:8]
        except IndexError:
            year = month_num = day = None
        try:
            month_name_long = datetime.date(int(year), int(month_num), 1).strftime('%B')
            month_name_short = datetime.date(int(year), int(month_num), 1).strftime('%b')
        except ValueError:
            month_name_long = month_name_short = None

        try:
            sensor_name = str_test[0] + '-' + str_test[-1].split('.')[0]
        except IndexError:
            sensor_name = None

        coord = str_test[3]

        n = ''
        s = ''
        w = ''
        e = ''

        card = [s, n, w, e]
        sign = [-1, 1, -1, 1]
        card_name = ['S', 'N', 'W', 'E']
        icard = 0
        default_zc = []

        for element in coord:
            if element.isdigit() or element == '.':
                card[icard] += element
            else:
                if element != card_name[icard]:
                    card_name[icard] = element
                    sign[icard] *= -1
                icard += 1
        for i in range(4):
            cf = float(card[i])
            if card_name[i] in ['S', 'N']:
                if abs(cf) > 90:
                    cf /= 10
            else:
                if abs(cf) > 180:
                    cf /= 10
            default_zc.append(sign[i] * cf)

        try:
            # native_dim = ECV_dictionary.nominal_size[res]
            native_dim = ECV_dictionary.nominal_size[10]
        except KeyError:
            prods = self._get_dataset_list()
            native_dim = self._get_dimension(prods[0])
        # print default_zc
        # exit()
        #
        # i_n = -1.
        # i_s = 1.
        # i_w = 1.
        # i_e = -1.
        # if str_test[3][7] == 'N':
        #     i_n = 1.
        # if str_test[3][3] == 'S':
        #     i_s = -1.
        #
        # if str_test[3][12] == 'W':
        #     i_w = -1.
        # if str_test[3][17] == 'E':
        #     i_e = 1.
        #
        # default_zc = [i_s * float(str_test[3][:3]) / 10., i_n * float(str_test[3][4:7]) / 10.,
        #               i_w * float(str_test[3][8:12]) / 10., i_e * float(str_test[3][13:17]) / 10.]

        out = [sensor_name, year, month_num, day, default_zc, month_name_long, month_name_short, native_dim, res,
               temp_res, prod_code, sensor_tag]

        return out

    def _get_data(self, product, zone_coord, hdf_flag, q_matrix, threshold, ij_points=None,
                  do_extract=False, neighbors=None):
        self.zone_coord = zone_coord
        self.do_extract = do_extract
        self.product = product
        if ij_points is not None:
            if len(ij_points) == 4:
                self.points = ij_points
        if neighbors not in [None, 0]:
            self.neigh = neighbors
        try:
            self.prod_type = ECV_dictionary.prod_type[product]
        except KeyError:
            self.prod_type = None
        if self.flag == 0:
            self._data = self._get_netcdf()
        elif self.flag == 1:
            self._data = self._get_netcdf()
            # self._data = self._get_hdf(hdf_flag, q_matrix, threshold)
        else:
            self._data = self._get_geotif()

        return self._data

    def _get_dimension(self, product=None):
        # if product is None:
        #     product = self.product
        if self.flag == 0:
            dimension = self._get_netcdf_dim()
        elif self.flag == 1:
            dimension = self._get_netcdf_dim()
            # try:
            #     dimension = self._get_hdf_dim(product)
            # except IndexError:
            #     dimension = None
            #     print(self.filename)
            #     exit()
        else:
            dimension = self._get_geotif_dim()

        return dimension

    def _get_dataset_list(self):
        if self.flag == 0:
            ds = Dataset(self.filename)
            dataset = [str(var) for var in ds.variables if var not in ds.dimensions]
        elif self.flag == 1:
            ds = Dataset(self.filename)
            dataset = [str(var) for var in ds.variables if var not in ds.dimensions]
            # try:
            #     hdf_file = SD(self.filename)
            #     d_sets = hdf_file.datasets()
            #     dataset = d_sets.keys()
            #     dataset.sort()
            # except HDF4Error:
            #     print('cannot find ', self.filename)
            #     dataset = []
        else:
            ds = gdal.Open(self.filename)
            if ds.GetSubDatasets():
                dataset = []
                for fname, _ in ds.GetSubDatasets():
                    dataset.append(fname.split(":")[-1])
            else:
                try:
                    dataset = ds.GetMetadata()['Band_1']
                except KeyError:
                    try:
                        dataset = ds.GetMetadata()['band_1']
                    except KeyError:
                        try:
                            dataset = ds.GetMetadata()['dataset']
                        except KeyError:
                            try:
                                dataset = ds.GetMetadata()['Dataset']
                            except KeyError:
                                dataset = '1'

        return dataset

    def _check_distance(self, i, j, lat, lon):
        """
        :param i:   nominal lat site index (calculated minimizing the lat difference)
        :param j:   nominal lon site index (calculated minimizing the lon difference)
        :param lat: latitude array
        :param lon: longitude array
        :return:  return the true index of the extraction considering real distance between site position and
            coordinates taken as the center of the pixel. if the self.neigh parameter is set, 4 parameters are
            returned, representing the limit of the neighbour (as index of the matrix) around site location
            as ex, if self.neigh = 1 a 3x3 matrix is selected.
        """

        lat_size = len(lat)
        lon_size = len(lon)

        bounds_extension = 15  # number of pixels to test around the nominal i, j

        i_i = i - bounds_extension
        i_f = i + bounds_extension + 1
        j_i = j - bounds_extension
        j_f = j + bounds_extension + 1
        while i_i < 0:
            i_i += 1
        while i_f > (lat_size - 1):
            i_f -= 1
        while j_i < 0:
            j_i += 1
        while j_f > (lon_size - 1):
            j_f -= 1

        i_idx = np.arange(i_i, i_f)
        j_idx = np.arange(j_i, j_f)

        lat_bounds = lat[i_i:i_f]
        lon_bounds = lon[j_i:j_f]
        dist = np.zeros([len(lat_bounds), len(lon_bounds)])

        # calculate the distance between the site coord and the coord in the bounds, _haversine formulae
        for ii, _lat in enumerate(lat_bounds):
            for jj, _lon in enumerate(lon_bounds):
                dist[ii, jj] = self._haversine(_lat, _lon)

        ij = np.where(dist == np.min(dist))

        i_true = int(i_idx[ij[0][0]])
        j_true = int(j_idx[ij[1][0]])
        if self.neigh not in [None, 0]:
            i_i_true = int(i_true - self.neigh)
            j_i_true = int(j_true - self.neigh)
            i_f_true = int(i_true + self.neigh + 1)
            j_f_true = int(j_true + self.neigh + 1)
            if i_i_true < 0:
                i_i_true = 0
            if j_i_true < 0:
                j_i_true = 0
            if i_f_true > lat_size:
                i_f_true = lat_size
            if j_f_true > lon_size:
                j_f_true = lon_size
        else:
            i_i_true = i_true
            j_i_true = j_true
            i_f_true = j_f_true = None
        return i_i_true, i_f_true, j_i_true, j_f_true

    def _do_extraction(self, size, invert_lat=False, lats=None, lons=None):

        step_lat = abs(float(self.default_zc[0] - self.default_zc[1]) / (size[0]))
        step_lon = abs(float(self.default_zc[3] - self.default_zc[2]) / (size[1]))
        hb_lat = step_lat / 2
        hb_lon = step_lon / 2

        if lats is None:
            lats = np.linspace(self.default_zc[1] - hb_lat, self.default_zc[0] + hb_lat, size[0])
            if invert_lat:
                lats *= -1.
        if lons is None:
            lons = np.linspace(self.default_zc[2] + hb_lon, self.default_zc[3] - hb_lon, size[1])

        lats_boundaries = np.arange(self.default_zc[0], self.default_zc[1], step_lat)

        """
        if lat to extract coincides with a boundary then the situation is undetermined. 
        Example: 
        one would like to extract the point of the lat, lon coordinates = (0., 0.) in a global raster 
        (-180W, 180E,-90S, 90N) at 0.5 deg spatial_resolution. The point 0., 0. is clearly lying on the border 
        between the four points (lat, lon)**: 
        
                (0.25, -0.25) | (0.25, 0.25)
                --------------+--------------   the + sign correspond to the point (0., 0.)
                (-0.25, -0.25)| (-0.25, 0.25)
        
        Notice that the distance fom these points to (0, 0) is the same!
        Different codes give different results! for instance python would extract the point (0.25, -0.25)
        IDL the point (-0.25, -0.25) etc...
        Since this is an undetermined situation, in order to be consistent with IDL, a small offset is subtracted to the 
        extraction latitude forcing the code to extract (-0.25, -0.25).     
                -------
                ** python is top-bottom oriented
        """
        if self.zone_coord[0] in lats_boundaries:
            self.lat_offset -= hb_lat / size[0]
        i = np.argmin(abs(lats - np.array(self.zone_coord[0] + self.lat_offset)))
        j = np.argmin(abs(lons - np.array(self.zone_coord[1])))

        # print i, j, lats[i], self.zone_coord[0], lons[j], self.zone_coord[1]
        # print lats[i], lons[j]
        # print i, j

        return self._check_distance(i, j, lats, lons)

    def _get_netcdf(self):
        """
        :return:            2D array data
        _______
        Description:
        Main function used to import NetCDF data into workspace
        """
        data = self._get_netcdf_data(self.product)
        if data is not None:
            if not self.do_extract:
                if 'Data_Mask' in self._get_dataset_list():
                    mask = self._get_netcdf_data('Data_Mask')
                    data[mask == 0] = np.nan
                    data[np.isnan(mask)] = np.nan

                if 'lsm' in self._get_dataset_list():
                    mask = self._get_netcdf_data('lsm')
                    if data.shape == mask.shape:
                        data[mask == 0] = np.nan
                        data[np.isnan(mask)] = np.nan
                if 'surface_type_number_mean' in self._get_dataset_list():
                    mask = self._get_netcdf_data('surface_type_number_mean')
                    data[mask == 0] = np.nan

        return data

    def _get_netcdf_data(self, product=None):
        if product is None:
            product = self.product
        invert_lat = False
        ds_lats = None
        ds_lons = None

        ds = Dataset(self.filename)
        for dim in ds.dimensions.keys():
            if 'lat' in dim.lower():
                if len(ds.variables[dim][:]) == ds.variables[product].shape[0]:
                    ds_lats = ds.variables[dim][:]
                if ds[dim][0] < 0:
                    invert_lat = True
            elif 'lon' in dim.lower():
                ds_lons = ds.variables[dim][:]
        try:
            v = ds.variables[product]
            data_type = 'float'
            for key in v.ncattrs():
                if 'data_type' == key.lower():
                    if v.getncattr(key.lower()) not in [data_type, 'uint8', 'int8', 'uint16', 'int16',
                                                        'uint32', 'int32']:
                        try:
                            data_type = ECV_dictionary.data_type[v.getncattr(key.lower())]
                        except KeyError:
                            err_str = 'data type ' + v.getncattr(key.lower()) + ' cannot be converted into ' \
                                                                    'python formalism, check!!!'
                            raise Exception(err_str)

            v.set_auto_maskandscale(False)
            fv, vr, sf, add_of = _get_netcdf_attrs(v)

            if self.zone_coord not in [None, self.default_zc]:
                if len(v.shape) > 2:
                    size = [v.shape[1], v.shape[2]]
                else:
                    size = v.shape
                if self.do_extract:
                    i_i, i_f, j_i, j_f = self._do_extraction(size, invert_lat=invert_lat, lats=ds_lats, lons=ds_lons)
                    # print i_i, i_f, j_i, j_f
                    if self.neigh not in [None, 0]:
                        if len(v.shape) > 2:
                            data = np.squeeze(v[:, i_i:i_f, j_i:j_f].astype(data_type))
                        else:
                            data = v[i_i:i_f, j_i:j_f].astype(data_type)
                            data = np.squeeze(data)
                    else:
                        if len(v.shape) > 2:
                            data = np.squeeze(v[:, i_i, j_i].astype(data_type))
                        else:
                            data = np.squeeze(v[i_i, j_i].astype(data_type))
                else:
                    lat_lon = self._reshape_data(invert_lat=invert_lat)
                    i = [lat_lon[0], lat_lon[1]]
                    j = [lat_lon[2], lat_lon[3]]
                    if len(v.shape) > 2:
                        data = np.squeeze(v[:, np.min(i):np.max(i), np.min(j):np.max(j)].astype(data_type))
                    else:
                        data = v[np.min(i):np.max(i), np.min(j):np.max(j)].astype(data_type)

            elif self.points is not None:
                if len(v.shape) > 2:
                    data = np.squeeze(v[:, self.points[0]:self.points[1], self.points[2]:self.points[3]]
                                      .astype(data_type))
                else:
                    data = np.squeeze(v[self.points[0]:self.points[1], self.points[2]:self.points[3]]
                                      .astype(data_type))
            else:
                data = np.squeeze(v[:].astype(data_type))
            data = np.array(data, dtype='float')
            if fv is not None:
                if self.do_extract:
                    if self.neigh in [0, None]:
                        if data == fv or np.isnan(data):
                            data = np.nan
                    else:
                        data[data == fv] = np.nan
                else:
                    data[data == fv] = np.nan
            if sf is not None:
                data *= sf
            if add_of is not None:
                data += add_of
            if vr is not None:
                if self.do_extract:
                    if self.neigh in [0, None]:
                        if data < np.min(vr) or data > np.max(vr):
                            data = np.nan
                    else:
                        data[data < np.min(vr)] = np.nan
                        data[data > np.max(vr)] = np.nan
                else:
                    data[data < np.min(vr)] = np.nan
                    data[data > np.max(vr)] = np.nan
            else:
                if self.prod_code == 'ABD':
                    data[data > 1] = np.nan
                    data[data < 0] = np.nan

            if invert_lat:
                if not self.do_extract:
                    data = np.flipud(data)
                else:
                    if self.neigh not in [0, None]:
                        data = np.flipud(data)
        except KeyError:
            print('attribute ', product, ' not found! in ', self.filename)
            raise

        return data

    def _get_netcdf_dim(self):
        ds = Dataset(self.filename)
        d1 = d2 = 0
        for dim in ds.dimensions.keys():
            if 'lat' in dim.lower():
                d1 = ds[dim].shape[0]
            elif 'lon' in dim.lower():
                d2 = ds[dim].shape[0]
        return [d1, d2]

    # def _get_hdf(self, hdf_flag, q_matrix, threshold):  # handle hdf files
    #     """
    #     :return:            data and metadata list
    #     ________
    #     Description:
    #     The function reads HDF4 data-set, extract data and metadata (fill value, scale factor, valid range, offset)
    #     via the get_hdf_attr function.
    #     """
    #     product = self.product
    #     self._hdf_file = SD(self.filename)
    #     data = self.__get_hdf_attr(product, hdf_flag, q_matrix, threshold)
    #     self._hdf_file.end()
    #     return data
    #
    # def __get_hdf_attr(self, product, hdf_flag, q_matrix, thresh):
    #     """
    #     ---------------
    #     Description:
    #     read product data matrix as float numbers, and get metadata parameters,
    #     convert fill_value into nan to a better
    #     handle of statistics and data analysis implementation.
    #     """
    #     # print self._hdf_file
    #     sds = self._hdf_file.select(product)
    #     invert_vr = False
    #     try:  # search for fill value (if any)
    #         f_v = float(sds.getfillvalue())
    #     except HDF4Error:
    #         f_v = None
    #     try:  # search for offset (if any)
    #         offset = float(sds.__getattr__("add_offset"))  # get offset
    #     except AttributeError:
    #         offset = 0.
    #     try:  # search for scale factor (if any)
    #         sf = float(sds.__getattr__("scale_factor"))  # get scale factor
    #     except AttributeError:
    #         try:
    #             sf = float(sds.__getattr__("slope"))  # get scale factor
    #             # print 'scale factor not found! --> sf == 1'
    #         except AttributeError:
    #             sf = 1.
    #     try:  # search for valid range (if any)
    #         vr = sds.__getattr__("valid_range")   # get valid range
    #     except AttributeError:
    #         vr = None
    #     try:  # search for datatype
    #         data_type = sds.__getattr__("Number Type")
    #         invert_vr = True
    #     except AttributeError:
    #         data_type = 'float'
    #
    #     if self.zone_coord not in [None, self.default_zc]:
    #         if self.do_extract:
    #             i_i, i_f, j_i, j_f = self._do_extraction(sds.get().shape)
    #             # print i_i, i_f, j_i, j_f
    #             exit()
    #             if self.neigh not in [0, None]:
    #                 data_tmp = np.array(sds.get()[i_i:i_f, j_i:j_f].astype(data_type))
    #             else:
    #                 data_tmp = np.array(sds.get()[i_i, j_i].astype(data_type))
    #         else:
    #             lat_lon = self._reshape_data()
    #             i = [lat_lon[0], lat_lon[1]]
    #             j = [lat_lon[2], lat_lon[3]]
    #             data_tmp = sds.get()[np.min(i):np.max(i), np.min(j):np.max(j)].astype(data_type)
    #     elif self.points is not None:
    #         data_tmp = sds.get()[self.points[0]:self.points[1], self.points[2]:self.points[3]].astype(data_type)
    #     else:
    #         data_tmp = sds.get().astype(data_type)
    #
    #     if data_type != 'float':
    #         data_tmp = np.array(data_tmp, dtype='float')
    #     if hdf_flag is None:
    #         if invert_vr:
    #             if vr:
    #                 data_tmp[data_tmp < float(vr[0])] = np.nan
    #                 data_tmp[data_tmp > float(vr[1])] = np.nan
    #         if f_v:
    #             data_tmp[data_tmp == f_v] = np.nan
    #         if sf:
    #             data_tmp *= sf
    #         if offset:
    #             data_tmp += offset
    #         if not invert_vr:
    #             if vr:
    #                 data_tmp[data_tmp < float(vr[0])] = np.nan
    #                 data_tmp[data_tmp > float(vr[1])] = np.nan
    #     if q_matrix is not None:
    #         q_sds = self._hdf_file.select(q_matrix)
    #         if hdf_flag is None:
    #             q = q_sds.get().astype('float')
    #             data_tmp[q > thresh] = np.nan
    #         else:
    #             q = q_sds.get()
    #             data_tmp[q > thresh] = f_v
    #
    #     return data_tmp
    #
    # def _get_hdf_dim(self, product):
    #     h = SD(self.filename)
    #     # d1 = h.select(product).dimensions().items()[0][1]
    #     # d2 = h.select(product).dimensions().items()[1][1]
    #     dims = [0, 0]
    #     keys_name = h.select(product).dimensions().keys()
    #     for k in keys_name:
    #         if any(re.findall(r'YDim|lat|Dim0|Lat', k, re.IGNORECASE)):
    #             dims[0] = h.select(product).dimensions()[k]
    #         elif any(re.findall(r'XDim|lon|Dim1|Lon', k, re.IGNORECASE)):
    #             dims[1] = h.select(product).dimensions()[k]
    #     if 0 in dims:
    #         dims = h.select(product).info()[2]
    #         if len(dims) != 2:
    #             dims = h.select(product).get().shape
    #     return dims

    def _get_geotif(self):
        gobj = gdal.Open(self.filename)
        self.geo_metadata = gobj.GetMetadata()
        data_type, fv, sf, add_of = self._get_geotiff_attr()

        if self.zone_coord not in [None, self.default_zc]:
            if self.do_extract:
                i_i, i_f, j_i, j_f = self._do_extraction([gobj.RasterYSize, gobj.RasterXSize])
                if self.neigh not in [0, None]:
                    data_tmp = np.array(gobj.GetRasterBand(1).ReadAsArray()[i_i:i_f, j_i:j_f].astype(data_type),
                                        dtype='float')
                else:
                    data_tmp = np.array(gobj.GetRasterBand(1).ReadAsArray()[i_i, j_i].astype(data_type), dtype='float')
            else:
                lat_lon = self._reshape_data()
                i = [lat_lon[0], lat_lon[1]]
                j = [lat_lon[2], lat_lon[3]]
                data_tmp = np.array(gobj.GetRasterBand(1).ReadAsArray()[np.min(i):np.max(i), np.min(j):np.max(j)].
                                    astype(data_type), dtype='float')
        elif self.points is not None:
            data_tmp = np.array(gobj.GetRasterBand(1).ReadAsArray()[:, self.points[0]:self.points[1],
                                self.points[2]:self.points[3]].astype(data_type), dtype='float')
        else:
            data_tmp = np.array(gobj.GetRasterBand(1).ReadAsArray().astype(data_type), dtype='float')

        if fv is not None:
            if not np.isnan(fv):
                data_tmp[data_tmp == fv] = np.nan
        if sf is not None:
            data_tmp *= sf
        if add_of is not None:
            data_tmp += add_of
        return data_tmp

    def _get_geotiff_attr(self):
        data_type = 'uint8'
        scale_factor = 0.01
        fill_value = 250
        add_offset = None
        for el in self.geo_metadata:
            if re.match('scal', str(el).lower()):
                try:
                    scale_factor = float(self.geo_metadata[el])
                except ValueError:
                    scale_factor = None
            if re.match('fill', str(el).lower()):
                try:
                    fill_value = float(self.geo_metadata[el])
                except ValueError:
                    fill_value = None
            if re.match('offset', str(el).lower()):
                try:
                    add_offset = float(self.geo_metadata[el])
                except ValueError:
                    add_offset = None
            if re.match('data_type', str(el).lower()):
                try:
                    data_type = str(self.geo_metadata[el])
                except ValueError:
                    data_type = 'float'

        return data_type, fill_value, scale_factor, add_offset

    def _get_geotif_dim(self):
        gobj = gdal.Open(self.filename)
        return [gobj.RasterXSize, gobj.RasterYSize]

    def _reshape_data(self, invert_lat=False, data=None):
        """
        :return i, j index of region
        """
        zone = self.zone_coord
        sz = self.native_dim
        data_cut = None

        step = (self.default_zc[1] - self.default_zc[0]) / sz[0]

        latitude = np.arange(self.default_zc[0] + step/2, self.default_zc[1] + step/2, step)
        longitude = np.arange(self.default_zc[2] + step/2, self.default_zc[3] + step/2, step)
        add_lat = 1
        # print 'invert lat', invert_lat
        if not invert_lat:
            latitude = np.flipud(latitude)
            # add_lat = 2
            add_lat = 1

        ind_lat_min = np.argmin(abs(np.array(latitude) - zone[1]))
        ind_lat_max = np.argmin(abs(np.array(latitude) - zone[0])) + add_lat
        ind_lon_min = np.argmin(abs(np.array(longitude) - zone[2]))
        ind_lon_max = np.argmin(abs(np.array(longitude) - zone[3])) + 1

        if ind_lat_min != 0:
            ind_lat_min += 1

        lat_lon_index = [ind_lat_min, ind_lat_max, ind_lon_min, ind_lon_max]

        if data is not None:
            data_cut = data[ind_lat_min:ind_lat_max, ind_lon_min:ind_lon_max]

        if ind_lat_max == len(latitude):
            ind_lat_max = -1

        if ind_lon_max == len(longitude):
            ind_lon_max = -1
        self.true_zc = [latitude[ind_lat_max], latitude[ind_lat_min], longitude[ind_lon_min], longitude[ind_lon_max]]

        if data is None:
            return lat_lon_index
        else:
            return data_cut

    def _get_climatology_sublist(self, total_file_list):
        _sublist = []
        target_month = self._get_metadata()[2]
        for f_name in total_file_list:
            month_test = self._get_metadata(filename=f_name)[2]
            if month_test == target_month:
                _sublist.append(f_name)
        return _sublist

    def _haversine(self, lat_end, lon_end):

        lat_start = self.zone_coord[0] + self.lat_offset
        lon_start = self.zone_coord[1] + self.lon_offset

        ae_km = 6378.135  # Equatorial radius.
        be_km = 6356.752  # Polar radius.

        ae2 = ae_km * ae_km
        be2 = be_km * be_km

        rad_lat = np.deg2rad(lat_start)
        sin_lat = np.sin(rad_lat)
        cos_lat = np.cos(rad_lat)
        sin_lat *= sin_lat
        cos_lat *= cos_lat

        r2 = ae2 * be2 / (ae2 * sin_lat + be2 * cos_lat)
        e_radius = np.sqrt(r2)
        # print eRadius

        d_lon = np.deg2rad(lon_end - lon_start)
        d_lat = np.deg2rad(lat_end - lat_start)
        a = (np.sin(d_lat / 2)) ** 2 + np.cos(np.deg2rad(lat_start)) * \
            np.cos(np.deg2rad(lat_end)) * (np.sin(d_lon / 2)) ** 2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        distance = e_radius * c
        return distance


class RasterDataset(_ImportData):
    """
    class RasterData, object of type ImportData from which inherits the methods.
    """

    def get_data(self, product, zone_coord=None, mask_param=None, flag=None, quality_matrix=None, threshold=None,
                 ij_points=None, extract=False, neigh=None):
        """
        :param product:         product name to import
        :param zone_coord:      zone to import
        :param flag:            for hdf files deactivate (IF NOT None) the rescaling factors (fv/scale_factor/offset...)
        :param mask_param:      mask parameters:
                                    mask_param[0] = mask filename
                                    mask_param[1] = mask product
                                    mask_param[2] = mask key value
        :param quality_matrix:  Name of the quality matrix mask_param
        :param threshold:       if quality_matrix != None, every points whose quality_flag > threshold goes to nan!
        :param ij_points:       specifies a sub-region as i-j index limits instead coordinates (used in tcem)
        :param extract:         enable point/neighbor extraction
        :param neigh:           number of px around point that defines the neighbor
        :return:                data matrix relative to product and zone
        """

        data = self._get_data(product, zone_coord, flag, quality_matrix, threshold, ij_points=ij_points,
                              do_extract=extract, neighbors=neigh)

        if self.sensor_name == 'ECM-ERAInterim01':
            if mask_param is not None:
                wm = mask_param[3]
                if wm is not None:
                    if mask_param[3].shape != data.shape:
                        from scipy.ndimage import zoom
                        wm = zoom(wm, [data.shape[0]/float(wm.shape[0]), data.shape[1]/float(wm.shape[1])],
                                  order=0, mode='nearest')
                    data[np.isnan(wm)] = np.nan
                    data[wm == 0] = np.nan

        if mask_param is not None:
            if mask_param[0] is not None:
                if mask_param[1] is not None:

                    d_mask = _ImportData(mask_param[0])._get_data(mask_param[1], zone_coord, flag,
                                                                  quality_matrix, threshold, do_extract=extract)
                    if mask_param[2] is not None:
                        data[d_mask != mask_param[2]] = np.nan
            if mask_param[3] is not None:
                wm = mask_param[3]
                if wm is not None:
                    if mask_param[3].shape != data.shape:
                        from scipy.ndimage import zoom
                        wm = zoom(wm, [data.shape[0] / float(wm.shape[0]), data.shape[1] / float(wm.shape[1])],
                                  order=0, mode='nearest')
                data[np.isnan(wm)] = np.nan
                data[wm == 0] = np.nan

        return data

    def get_raster_dimension(self, product):
        """
        :param product:     product name for which dimensions are required
        :return:            dim_x dim_y
        """
        out = self._get_dimension(product)
        return out

    def get_metadata(self):
        """
        :return:  list of metadata:
        """

        return self._get_metadata()

    def get_dataset_list(self):
        """
        :return:  list of raster layers:
        """
        return self._get_dataset_list()

    def get_climatology(self, product, total_file_list, zone_coord=None, mask_param=None, extract=False, neigh=None,
                        calculate_stdev=False):
        """
        :param product:             product name
        :param total_file_list:     list of file which will contribute to the climatology
        :param zone_coord:          geographical coordinates
        :param mask_param
        :param extract:             enable point/neighbor extraction
        :param neigh:               number of px around point that defines the neighbor
        :param calculate_stdev      True False, return also the std of the climatology
        :return:                    climatology matrix within the time period defined by total_file_list
        """
        self.zone_coord = zone_coord
        if zone_coord is None:
            zc = str(os.path.basename(self.filename)).split('_')[3]
        else:
            if self.default_zc[0] < 0:
                zc_s = str(str(self.default_zc[0]).replace('-', '')).replace('.', '') + 'S'
            else:
                zc_s = str(self.default_zc[0]).replace('.', '') + 'N'
            if self.default_zc[1] < 0:
                zc_n = str(str(self.default_zc[1]).replace('-', '')).replace('.', '') + 'S'
            else:
                zc_n = str(self.default_zc[1]).replace('.', '') + 'N'
            if self.default_zc[2] < 0:
                zc_e = str(str(self.default_zc[2]).replace('-', '')).replace('.', '') + 'W'
            else:
                zc_e = str(self.default_zc[2]).replace('.', '') + 'E'
            if self.default_zc[3] < 0:
                zc_w = str(str(self.default_zc[3]).replace('-', '')).replace('.', '') + 'W'
            else:
                zc_w = str(self.default_zc[3]).replace('.', '') + 'E'

            zc = zc_s + zc_n + zc_e + zc_w

        try:
            sn = ECV_dictionary.sens_dic[self.sensor_name]
        except KeyError:
            sn = self.sensor_name

        c_name = self.path_to_clima + 'Climatology_' + sn + '_' + self.spatial_resolution + '_' + str(
            product).replace(' ', '-') + '_' + self.month_num + '_' + zc + '.npy'
        s_name = self.path_to_clima + 'Stdv-Climatology_' + sn + '_' + self.spatial_resolution + '_' +\
            str(product).replace(' ', '-') + '_' + self.month_num + '_' + zc + '.npy'

        if not extract:  # if not exist calculate and save at GLOBAL SCALE!!!!!!
            if os.path.exists(c_name):
                c = np.load(c_name)  # ['climatology']
            else:  # if not exist calculate and save at GLOBAL SCALE!!!!!!
                clima_list = self._get_climatology_sublist(total_file_list)
                c, s = _calculate_climatology(clima_list, product, do_extract=extract, neigh=neigh,
                                              get_stdev=calculate_stdev)
                if os.path.exists(self.path_to_clima):
                    _save_clima(c_name, c)
                    if calculate_stdev:
                        _save_clima(s_name, s)
        else:
            clima_list = self._get_climatology_sublist(total_file_list)
            c, s = _calculate_climatology(clima_list, product, zone_coord=zone_coord, do_extract=extract, neigh=neigh,
                                          get_stdev=calculate_stdev)
        if not extract:
            if zone_coord is not None:
                if self.default_zc != zone_coord:
                    c = self._reshape_data(data=c)

        if mask_param is not None:
            if mask_param[0] is not None:
                if mask_param[1] is not None:
                    d_mask = _ImportData(mask_param[0])._get_data(mask_param[1], zone_coord, None, None, None)
                    c[d_mask != mask_param[2]] = np.nan
        # print 'return num'

        ECV_dictionary.climatology_store[c_name] = c
        return c

    def get_anomaly(self, product, total_file_list, mask_param=None, zone_coord=None, extract=False, neigh=None,
                    is_absolute=False):
        """
        :param product:             product name
        :param total_file_list:     list of file which will contribute to the climatology
        :param zone_coord:          geographical coordinates
        :param mask_param:          mask parameters:
                                        mask_param[0] = mask filename
                                        mask_param[1] = mask product
                                        mask_param[2] = mask key value
        :param extract:             enable point/neighbor extraction
        :param neigh:               number of px around point that defines the neighbor
        :param is_absolute:         True or false express anomaly as absolute values (True) or as relative (% False)
        :return:                    anomaly matrix for filename = self.filename relative to the time period defined
                                    by total_file_list
        """
        self.zone_coord = zone_coord
        if zone_coord is None:
            zc = str(os.path.basename(self.filename)).split('_')[3]
        else:
            if self.default_zc[0] < 0:
                zc_s = str(str(self.default_zc[0]).replace('-', '')).replace('.', '') + 'S'
            else:
                zc_s = str(self.default_zc[0]).replace('.', '') + 'N'
            if self.default_zc[1] < 0:
                zc_n = str(str(self.default_zc[1]).replace('-', '')).replace('.', '') + 'S'
            else:
                zc_n = str(self.default_zc[1]).replace('.', '') + 'N'
            if self.default_zc[2] < 0:
                zc_e = str(str(self.default_zc[2]).replace('-', '')).replace('.', '') + 'W'
            else:
                zc_e = str(self.default_zc[2]).replace('.', '') + 'E'
            if self.default_zc[3] < 0:
                zc_w = str(str(self.default_zc[3]).replace('-', '')).replace('.', '') + 'W'
            else:
                zc_w = str(self.default_zc[3]).replace('.', '') + 'E'

            zc = zc_s + zc_n + zc_e + zc_w

        c_name = self.path_to_clima + 'Climatology_' + self.sensor_name + '_' + self.spatial_resolution + '_' + \
            str(product).replace(' ', '-') + '_' + self.month_num + '_' + zc + '.npy'

        if c_name in ECV_dictionary.climatology_store.keys():
            climatology = ECV_dictionary.climatology_store[c_name]
        else:
            climatology = self.get_climatology(product, total_file_list, zone_coord=zone_coord, mask_param=mask_param,
                                               extract=extract, neigh=neigh)

        data = self.get_data(product, zone_coord=zone_coord, mask_param=mask_param, extract=extract, neigh=neigh)

        if is_absolute:
            anomaly = data - climatology
        else:
            anomaly = 100. * (data - climatology) / climatology
            anomaly[anomaly > 100] = 100
            anomaly[anomaly < -100] = -100

        if extract:
            if neigh not in [None, 0]:
                anomaly[np.isinf(anomaly)] = np.nan  # remove inf!
            else:
                if np.isinf(anomaly):
                    anomaly = np.nan
                if -self.min_float < anomaly < self.min_float:
                    anomaly = 0.
        else:
            anomaly[np.isinf(anomaly)] = np.nan  # remove inf!
            anomaly[np.where(np.logical_and(-self.min_float < anomaly, anomaly < self.min_float))] = 0.

        return anomaly


'''
############################
##### static methods: ######
############################
'''


def _calculate_climatology(f_name_list, product, zone_coord=None, do_extract=False, neigh=None, get_stdev=False):
    """
    :param f_name_list:     list of file which will contribute to the climatology
    :param product:         product name as stored in the original dataset! (original name!)
    :return:                climatology matrix
                            for each position (pixel) sets nan if and only if more than 20% of the matrix records
                            nan. else, nanmean.
    """
    counter = 0
    n = len(f_name_list)  # number of matrix used to build climatology
    if do_extract:
        sz = RasterDataset(f_name_list[0]).get_data(product, zone_coord=zone_coord,
                                                    extract=do_extract, neigh=neigh).shape
    else:
        da_shape = []
        for f in f_name_list:
            _d = RasterDataset(f).get_data(product, zone_coord=zone_coord, extract=bool(do_extract), neigh=neigh)
            da_shape.append([_d.shape])
        sz = np.unique(da_shape)

    if len(sz) > 2:
        print("dimensions mismatch!!!")

    else:
        # clima = np.full(size, fill_value=np.nan)
        clima = np.zeros(sz, dtype='float')
        _stdv = []
        # print num.shape

        for name in f_name_list:  # list of file which will contribute to climatology
            rd = RasterDataset(name)
            tmp = rd.get_data(product, zone_coord=zone_coord, extract=do_extract, neigh=neigh)
            mask = copy.copy(tmp)
            if get_stdev:
                _stdv.append(tmp)
            mask[~np.isnan(mask)] = 1
            mask[np.isnan(mask)] = 0
            counter += mask
            tmp[np.isnan(tmp)] = 0
            clima = np.sum([clima, tmp], axis=0)

        thr = np.round(n * 0.3)  # 30%
        if thr < 1.:
            thr = 1.

        climatology = np.array(clima) / counter
        # exit()
        if do_extract:
            if neigh in [None, 0]:
                if counter < thr:
                    climatology = np.nan
            else:
                climatology[counter < thr] = np.nan
        else:
            climatology[counter < thr] = np.nan
        # print 'return'
        stdv = std_sum = 0.

        if get_stdev:
            for i in range(len(_stdv)):
                delta = np.square(_stdv[i] - climatology)
                std_sum += delta
            stdv = std_sum / (len(_stdv) - 1)

        return climatology, stdv


def _get_netcdf_attrs(netcdf_var):
    """
    :param netcdf_var:  netCDF4 Dataset.variables instance
    :return:  try to get fill_value and valid_range offset, scale_factor, (etc...) values...
    """
    v = netcdf_var
    try:
        dt = ECV_dictionary.data_type[v.getncattr('data_type')]
    except KeyError:
        dt = 'float'
    except AttributeError:
        dt = 'float'
    fv = _get_fillvalue(v, dt)

    vr = _get_valid_range(v, dt)

    try:
        vmin = float(np.array(v.getncattr('valid_min'), dtype=dt))
    except AttributeError:
        vmin = None
    try:
        vmax = float(np.array(v.getncattr('valid_max'), dtype=dt))
    except AttributeError:
        vmax = None

    if vr is None:
        if None not in [vmin, vmax]:
            vr = [vmin, vmax]
    try:
        sf = float(v.getncattr('scale_factor'))
    except AttributeError:
        try:
            sf = float(v.getncattr('slope'))
        except AttributeError:
            sf = None

    try:
        offset = float(np.array(v.getncattr('add_offset'), dtype=dt))
    except AttributeError:
        try:
            offset = float(np.array(v.getncattr('intercept'), dtype=dt))
        except AttributeError:
            offset = None

    if type(fv) in [str]:
        try:
            fv = float(fv)
        except ValueError:
            fv = None

    if vr is None:
        if vmin and vmax is not None:
            if dt != 'float':
                if sf is not None:
                    vmin = np.round(vmin * sf)
                    vmax = np.round(vmax * sf)
            vr = [vmin, vmax]
    try:
        if not vr:
            vr = None
    except ValueError:
        if not vr.any():
            vr = None

    return fv, vr, sf, offset


def _get_fillvalue(v, dt):
    try:
        fv = float(np.array(v.getncattr('_Fill_Value'), dtype=dt))
    except AttributeError:
        try:
            fv = float(np.array(v.getncattr('_FillValue'), dtype=dt))
        except AttributeError:
            try:
                fv = float(np.array(v.getncattr('_fillValue'), dtype=dt))
            except AttributeError:
                try:
                    fv = float(np.array(v.getncattr('_fill_value'), dtype=dt))
                except AttributeError:
                    fv = None
    return fv


def _get_valid_range(v, dt):
    try:
        vr = np.array(v.getncattr('_Valid_Range'), dtype=dt)
    except AttributeError:
        try:
            vr = np.array(v.getncattr('_ValidRange'), dtype=dt)
        except AttributeError:
            try:
                vr = np.array(v.getncattr('Valid_Range'), dtype=dt)
            except AttributeError:
                try:
                    vr = np.array(v.getncattr('ValidRange'), dtype=dt)
                except AttributeError:
                    try:
                        vr = np.array(v.getncattr('valid_range'), dtype=dt)
                    except AttributeError:
                        try:
                            vr = np.array(v.getncattr('validrange'), dtype=dt)

                        except AttributeError:
                            vr = None
                        except ValueError:
                            vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('validrange')))]
                    except ValueError:
                        vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('valid_range')))]
                except ValueError:
                    vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('ValidRange')))]
            except ValueError:
                vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('Valid_Range')))]
        except ValueError:
            vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('_ValidRange')))]
    except ValueError:
        vr = [int(s) for s in re.findall(r'\b\d+\b', str(v.getncattr('_Valid_Range')))]
    return vr


def _save_clima(name, clima):
    c = np.ma.array(clima).filled(fill_value=np.nan)
    try:
        np.save(name, c)
    except IOError:
        print('cannot write here! Permission denied ' + name)
    except NotImplementedError:
        print('not implemented error')
        raise
