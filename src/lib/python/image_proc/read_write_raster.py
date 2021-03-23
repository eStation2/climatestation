"""
# ###############################################################################
# version:          R1.0.1                                                      #
# created by:       F.Cappucci  --- fabrizio.cappucci@ext.ec.europa.eu          #
# creation date:    25 Oct 2020                                                 #
# property of:      JRC                                                         #
# purpose:          main Class containing the functions for read and import     #
#                   raster dataset in geotif format                             #
#             --------------------------------------------------                #
# last edit:        in development                                              #
#  *************************************************************************    #
# If the tif file contains a data_mask along with physical data, the user can   #
# decide to apply such mask on the fly, specifying just the mask name and the   #
# filter value, the threshold parameter                                         #
# moreover, the class also can return the boundary coordinates of the product   #
# if needed                                                                     #
#                                                                               #
# ###############################################################################
"""

from osgeo import gdal, osr
import numpy as np
import os
import re
from datetime import date
try:
    from src.lib.python.metadata import SdsMetadata
except ModuleNotFoundError:
    SdsMetadata = None
from netCDF4 import Dataset


class RasterDataset(object):
    def __init__(self, filename, product=None, data_provider=None):
        """
        :param filename: filename of the raster file to read (can be either a geotif or a netCDF file)
                        The routine uses the right method to read the file in relation to its file extension


        To initialize the read_raster class only the filename is needed.

        Some public methods are available through the class, the main one (.get_data) allows to retrieve the
        numpy array of the data layer of interest

        """
        self.filename = filename

        # got filename extension
        _, ext = os.path.splitext(self.filename)

        if str(ext).lower() in ['.tif', '.tiff']:
            self.raster_type = 'geofit'
        elif str(ext).lower() == '.nc':
            self.raster_type = 'netcdf'
        else:
            # implement a control step here: il file extension cannot be associated to a netCDF file or a geotif
            # it is assumed as unknown file format and an exception can be raised.
            msg = 'Unknown file extension, expected geotif or netCDF file, got %s instead. Exit ' % (str(ext))
            raise Exception(msg)
            # or pass if no exception are needed here

        # initialise parameters
        self.mask_name = None
        self.threshold = None
        self.zc = None
        self.do_extract = None
        self.neigh = None
        self.local_zc = None
        self.date = None
        self.year = None
        self.month = None
        self.day = None
        self.prod_code = None
        self.sensor_code = None
        self.date_long = None
        self.native_zc = None
        self.scale_factor = None
        self.fill_value = None
        self.add_offset = None
        self.band = None
        # Initialize the parameters for local site (punctual) extraction
        self.neigh = 0
        self.lat_offset = 0.  # used in _haversine formulae
        self.lon_offset = 0.
        self.filename = filename
        self.product = product
        # Read relevant metadata fields
        # TODO: be sure that this works also with netcdf!!!!
        # self.get_sds_metadata()  # This work only with Climatestation where metadata is already written

    def get_data(self, band=None, subsample_coordinates=None, make_extraction=False, local_site_lat=None,
                 local_site_lon=None, neighbors=0, mask_name=None, threshold=None):
        """
        :param band:                    TYPE: string, this parameter is meaningful (i.e. should be specified) in case
                                        of net-CDF multiband rester file.
        :param subsample_coordinates:   TYPE:list, to be provided as [S, N, W, E] floating numbers. Defines a subsample
                                        of the product in case a particular sub-region is required instead of the
                                        full-extension product
                                        Example: subsample_coordinates=[-30, -20, 15, 25]

        :param make_extraction:         TYPE: Bool, True or False, enables local site extraction

        :param local_site_lat:          TYPE: float, Latitude of the local site to extract

        :param local_site_lon:          TYPE: float, Longitude of the local site to extract

        :param neighbors:               TYPE: int, integer number: number of neighbor around local site position.
                                        EXAMPLE: if neighbors=1 ==> a matrix of 3x3 will be returned
                                                 if neighbors=2 ==> a matrix of 5x5 will be returned
                                                 in general: neighbors=n ==> a matrix of (2n+1)x(2n+1) will be returned

        :param mask_name:               TYPE: str, Name of the layer containing the filter mask (if any)

        :param threshold:               TYPE: int/float [...TBD], Threshold to be applied to the product

        TODO: verify that the mask parameter is actually needed in ClimateStation, otherwise get rid of it!

        :return: Data array of the kind numpy.array which shape is defined by subsample coordinates and/or
        local site coordinates
        ***********************************************************************************************************
        ***********************************************************************************************************

        !!!!!!!!!!! PLEASE NOTICE THAT !!!!!!!!!!!!!!!!

        if both subsample coordinates and local site coordinates are both given, the priority
        is given to the local site ones, as long as the "make_extraction" parameter is set to True, otherwise subsample
        coordinates takes the priority.

        ***********************************************************************************************************
        ***********************************************************************************************************

        """
        self.band = band
        self.mask_name = mask_name
        self.threshold = threshold
        self.zc = subsample_coordinates
        self.do_extract = make_extraction
        self.neigh = neighbors
        self.local_zc = [local_site_lat, local_site_lon]
        if self.raster_type == 'geotif':
            return self._get_geotiff()
        else:
            # return self._get_netcdf_data() #specific to FAb?
            return self._get_netcdf()

    def _get_netcdf(self):
        """
        read the band layer and return it as numpy array
        the function is based on gdal
        :return:
        """
        if self.band is None:
            fid = self.filename
        else:
            fid = 'NETCDF:' + '"' + self.filename + '":' + self.band
        gobj = gdal.Open(fid)
        self.meta = gobj.GetMetadata()
        # data_type, fv, sf, add_of, vmin, vmax = self._get_netcdf_attr()
        _data = np.array(gobj.ReadAsArray())

        return self._process_data(_data, gobj)

    def _process_data(self, data, gobj):
        """
        :param data: numpy array of "raw" data
        :param gobj: gdal_object of type gdal.Open()
        :return: scientific dataset (i.e. data having physical meanings)
        """
        i_i = 0
        i_f = None
        j_i = 0
        j_f = None
        data_type = gobj.ReadAsArray().dtype
        if self.do_extract:  # if true, extract a point (or a neighbor of points)
            i_i, i_f, j_i, j_f = self._local_extraction([gobj.RasterYSize, gobj.RasterXSize])
        else:
            if self.zc not in [None, self.native_zc]:  # if verified, extract a sub-region of data
                i_i, i_f, j_i, j_f = self._subregion_extraction([gobj.RasterYSize, gobj.RasterXSize])

        data = data[i_i:i_f, j_i:j_f]
        if data_type != 'float':
            data = np.array(data, dtype='float')

        # physical conversion
        if self.fill_value is not None:
            data[data == self.fill_value] = np.nan
        if self.scale_factor is not None:
            data *= self.scale_factor
        if self.add_offset is not None:
            data += self.add_offset

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
                            data_type = None #ECV_dictionary.data_type[v.getncattr(key.lower())]
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

    def _haversine(self, lat_end, lon_end):

        lat_start = self.local_zc[0] + self.lat_offset
        lon_start = self.local_zc[1] + self.lon_offset

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

        i_i_true = int(i_true - self.neigh)
        j_i_true = int(j_true - self.neigh)
        i_f_true = int(i_true + self.neigh + 1)
        j_f_true = int(j_true + self.neigh + 1)
        if i_i_true < 0:
            i_i_true = 0
        if j_i_true < 0:
            j_i_true = 0
        if i_f_true > lat_size:
            i_f_true = 0
        if j_f_true > lon_size:
            j_f_true = 0
        # else:
        #     i_i_true = i_true
        #     j_i_true = j_true
        #     i_f_true = j_f_true = None
        return i_i_true, i_f_true, j_i_true, j_f_true

    def _local_extraction(self, size, invert_lat=False, lats=None, lons=None):

        step_lat = abs(float(self.native_zc[0] - self.native_zc[1]) / (size[0]))
        step_lon = abs(float(self.native_zc[3] - self.native_zc[2]) / (size[1]))
        hb_lat = step_lat / 2
        hb_lon = step_lon / 2

        if lats is None:
            lats = np.linspace(self.native_zc[1] - hb_lat, self.native_zc[0] + hb_lat, size[0])
            if invert_lat:
                lats *= -1.
        if lons is None:
            lons = np.linspace(self.native_zc[2] + hb_lon, self.native_zc[3] - hb_lon, size[1])

        lats_boundaries = np.arange(self.native_zc[0], self.native_zc[1], step_lat)

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
        if self.local_zc[0] in lats_boundaries:
            self.lat_offset -= hb_lat / size[0]
        i = np.argmin(abs(lats - np.array(self.local_zc[0] + self.lat_offset)))
        j = np.argmin(abs(lons - np.array(self.local_zc[1])))

        return self._check_distance(i, j, lats, lons)

    def _subregion_extraction(self, size):
        """
        :return i, j index of region
        """
        zone = self.zc
        data_cut = None

        step = (self.native_zc[1] - self.native_zc[0]) / size[0]

        latitude = np.arange(self.native_zc[0] + step/2, self.native_zc[1] + step/2, step)
        longitude = np.arange(self.native_zc[2] + step/2, self.native_zc[3] + step/2, step)
        add_lat = 1
        # print 'invert lat', invert_lat

        ind_lat_min = np.argmin(abs(np.array(latitude) - zone[0]))
        ind_lat_max = np.argmin(abs(np.array(latitude) - zone[1])) + add_lat
        ind_lon_min = np.argmin(abs(np.array(longitude) - zone[2]))
        ind_lon_max = np.argmin(abs(np.array(longitude) - zone[3])) + 1

        if ind_lat_min != 0:
            ind_lat_min += 1

        if ind_lat_max == len(latitude):
            ind_lat_max = None

        if ind_lon_max == len(longitude):
            ind_lon_max = None

        return ind_lat_min, ind_lat_max, ind_lon_min, ind_lon_max

    def _get_geotiff(self):

        gobj = gdal.Open(self.filename)
        _data = np.array(gobj.GetRasterBand(1).ReadAsArray())
        return self._process_data(_data, gobj)

    def apply_mask(self, d):
        thr = self.threshold
        if thr is None:
            thr = 5
        gobj = gdal.Open(self.mask_name)
        mask = gobj.GetRasterBand(1).ReadAsArray()

        d[mask != thr] = np.nan
        return d

    def get_coordinates(self):
        gobj = gdal.Open(self.filename)
        old_cs = osr.SpatialReference()
        old_cs.ImportFromWkt(gobj.GetProjectionRef())
        # create the new coordinate system
        wgs84_wkt = """
            GEOGCS["WGS 84",
            DATUM["WGS_1984",
            SPHEROID["WGS 84",6378137,298.257223563,
            AUTHORITY["EPSG","7030"]],
            AUTHORITY["EPSG","6326"]],
            PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
            UNIT["degree",0.01745329251994328,
            AUTHORITY["EPSG","9122"]],
            AUTHORITY["EPSG","4326"]]"""
        new_cs = osr.SpatialReference()
        new_cs.ImportFromWkt(wgs84_wkt)
        # create a transform object to convert between coordinate systems
        transform = osr.CoordinateTransformation(old_cs, new_cs)

        # get the point to transform, pixel (0,0) in this case
        width = gobj.RasterXSize
        height = gobj.RasterYSize
        gt = gobj.GetGeoTransform()
        x = gt[0] + gt[1] * width
        y = gt[3] + gt[5] * height

        center_x = (gt[0] + x) / 2
        center_y = (gt[3] + y) / 2

        lon_0, lat_0, _ = transform.TransformPoint(center_x, center_y)

        w, n, _ = transform.TransformPoint(gt[0], gt[3])
        e, s, _ = transform.TransformPoint(x, y)

        self.native_zc = [s, n, w, e]

        return [s, n, w, e], [lat_0, lon_0]

    def set_CS_subproduct_parameter(self, subproduct):
        if subproduct is not None:
            # self.native_zc = subproduct[]
            self.scale_factor = subproduct['in_scale_factor']
            self.fill_value = subproduct['nodata']
            self.add_offset = subproduct['in_offset']
            self.band = subproduct['re_extract']


def _get_netcdf_attrs(netcdf_var):
    """
    :param netcdf_var:  netCDF4 Dataset.variables instance
    :return:  try to get fill_value and valid_range offset, scale_factor, (etc...) values...
    """
    v = netcdf_var
    try:
        dt = v.getncattr('data_type')
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