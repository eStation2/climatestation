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

from osgeo import gdal, osr, gdalconst
import datetime
import numpy as np
import os
import re
from datetime import date
# try:
#     from lib.python.metadata import SdsMetadata
# except ModuleNotFoundError:
#     SdsMetadata = None
from lib.python.metadata import SdsMetadata
from netCDF4 import Dataset
from lib.python import mapset, functions
from lib.python.image_proc import helpers_read_write_raster

class RasterDataset(object):
    def __init__(self, filename, product=None):
        """
        :param filename: filename of the raster file to read (can be either a geotif or a netCDF file)
                        The routine uses the right method to read the file in relation to its file extension


        To initialize the read_raster class only the filename is needed.

        Some public methods are available through the class, the main one (.get_data) allows to retrieve the
        numpy array of the data layer of interest

        """
        self.filename = filename

        if self.filename is not None:
            # got filename extension
            _, ext = os.path.splitext(self.filename)

            if str(ext).lower() in ['.tif', '.tiff']:
                # M.C.: Corrected from 'geofit'
                self.raster_type = 'geotif'
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
        # self.date = None
        # self.year = None
        # self.month = None
        # self.day = None
        # self.prod_code = None
        # self.sensor_code = None
        # self.date_long = None
        self.native_zc = None
        self.scale_factor = None
        self.fill_value = None
        self.add_offset = None
        self.band = None
        # self.frequency = None
        # Initialize the parameters for local site (punctual) extraction
        self.neigh = 0
        self.lat_offset = 0.  # used in _haversine formulae
        self.lon_offset = 0.
        self.filename = filename
        self.product = product

        # # Added by Vijay for Irregular grid
        # self.ds_lons_out = None
        # self.ds_lats_out = None
        # self.data = None
        # Read relevant metadata fields only if file exists
        try:
            if self.filename is not None:
                self.get_metadata_basic()
        except Exception:  # general error handling, to be better refined in future (TODO!)
            pass

    # Extract Data from a [C-Station] geotif [or netcdf] file for the usage in C3SF4P
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
        if self.zc is None:  #TODO check with fabrizio if he with this case
            self.zc = subsample_coordinates
        self.do_extract = make_extraction
        self.neigh = neighbors
        self.local_zc = [local_site_lat, local_site_lon]
        if self.raster_type == 'geotif':
            return self._get_geotiff()
        else:
            return self._get_netcdf()



    # Used by get_data to read values
    def _get_netcdf(self):
        """
        read the band layer and return it as numpy array
        the function is based on gdal
        :return:
        """
        # if self.band is None:
        #     fid = self.filename
        # else:
        #     fid = 'NETCDF:' + '"' + self.filename + '":' + self.band
        gobj = self._get_GDAL_dataset()
        self.meta = gobj.GetMetadata()
        # data_type, fv, sf, add_of, vmin, vmax = self._get_netcdf_attr()
        _data = np.array(gobj.ReadAsArray())

        return self._process_data(_data, gobj)

    # Open GDAL ds
    def _get_GDAL_dataset(self):
        # if self.band is not None:
        #     fid = 'NETCDF:' + '"' + self.filename + '":' + self.band
        if self.product is not None:
            fid = 'NETCDF:' + '"' + self.filename + '":' + self.product
        else:
            fid = self.filename
        gobj = gdal.Open(fid)
        return gobj

    # Rescale data using factor/offset [clip if needed]
    def _process_data(self, data, gobj, already_extracted=False):
        """
        :param data: numpy array of "raw" data
        :param gobj: gdal_object of type gdal.Open()
        :return: scientific dataset (i.e. data having physical meanings)
                    """
        self.data_type = gobj.ReadAsArray().dtype
        # if self.raster_type == 'geotif':

        i_i = 0
        i_f = None
        j_i = 0
        j_f = None
        data_type = gobj.ReadAsArray().dtype

        if not already_extracted:
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
        self.data = data
        # else:
        #     if self.ds_lats is None and self.ds_lats is None:
        #         self._get_netcdf_dim()
        #     i_i = 0
        #     i_f = None
        #     j_i = 0
        #     j_f = None
        #     # self.data_type = gobj.ReadAsArray().dtype
        #     # Get target_bbox indices and assign output lat and long array
        #     if self.do_extract:  # if true, extract a point (or a neighbor of points)
        #         i_i, i_f, j_i, j_f = self._local_extraction([gobj.RasterYSize, gobj.RasterXSize])
        #         # data = data[i_i:i_f, j_i:j_f]
        #     else:
        #         if self.zc not in [None, self.native_zc]:  # if verified, extract a sub-region of data
        #             i_i, i_f, j_i, j_f = self.get_indices_lats_lons()
        #             # Do the extraction
        #             # data = self.netcdf_var_extraction(data, i_i, i_f, j_i, j_f)
        #     data = data[i_i:i_f, j_i:j_f]
        #     if self.data_type != 'float':
        #         data = np.array(data, dtype='float')
        #     # physical conversion
        #     if self.fill_value is not None:
        #         data[data == self.fill_value] = np.nan
        #     if self.scale_factor is not None:
        #         data *= self.scale_factor
        #     if self.add_offset is not None:
        #         data += self.add_offset
        #
        #     self.data = data

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

    # TODO: Check if it is used
    def apply_mask(self, d):
        thr = self.threshold
        if thr is None:
            thr = 5
        gobj = gdal.Open(self.mask_name)
        mask = gobj.GetRasterBand(1).ReadAsArray()

        d[mask != thr] = np.nan
        return d

    def get_coordinates(self):
        if self.raster_type == 'geotif':
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

        else:
            # else is a netcdf data, so we expect lat and lon array inside
            self.ds_lats = None
            self.ds_lons = None
            s = n = e = w = lat_0 = lon_0 = None

            self._create_netcdf_dim()

            if self.ds_lats is not None and self.ds_lons is not None:
                s_try = self.ds_lats[0]
                n_try = self.ds_lats[-1]
                if n_try < s_try:
                    n = s_try
                    s = n_try
                else:
                    n = n_try
                    s = s_try
                w_try = self.ds_lons[0]
                e_try = self.ds_lons[-1]

                if e_try < w_try:
                    e = w_try
                    w = e_try
                else:
                    e = e_try
                    w = w_try

        self.native_zc = [s, n, w, e]
        return [s, n, w, e], [lat_0, lon_0]

    # Create netcdf dimension dataset from the file
    def _create_netcdf_dim(self):
        ds = Dataset(self.filename)
        for dim in ds.dimensions.keys():
            if 'lat' in dim.lower() or 'y' in dim.lower():
                self.ds_lats = ds.variables[dim][:]
            elif 'lon' in dim.lower() or 'x' in dim.lower():
                self.ds_lons = ds.variables[dim][:]
        # d1 = d2 = 0
        # for dim in ds.dimensions.keys():
        #     if 'lat' in dim.lower():
        #         d1 = ds[dim].shape[0]
        #     elif 'lon' in dim.lower():
        #         d2 = ds[dim].shape[0]
        # return [d1, d2]


    # Get the Basic metadata information( nodata, scaling_factor, offset) from the file using GDAL
    def get_metadata_basic(self):
        dataset = self._get_GDAL_dataset()
        metadata = dataset.GetMetadata()

        for el in metadata.keys():
            if 'scaling_factor' in str(el).lower() or 'scale_factor' in str(el).lower():
                try:
                    self.scale_factor = float(metadata[el])
                except ValueError:
                    self.scale_factor = None
            if 'nodata' in str(el).lower() or 'missing_value' in str(el).lower() or 'FillValue' in str(el).lower():
                try:
                    self.fill_value = float(metadata[el])
                except ValueError:
                    self.fill_value = None
            if 'offset' in str(el).lower():
                try:
                    self.add_offset = float(metadata[el])
                except ValueError:
                    self.add_offset = None


# Write netcdf outside the class
def write_nc(file_name, data, dataset_tag, dataset_long_name=None, fill_value=None, scale_factor=None, offset=None,
             valid_range=None, dtype=None, zc=None, mode=None, history=None, lats=None, lons=None,
             global_attrs=None,
             compression=9, write_CS_metadata=None):
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
                     'Float32': 'NC_FLOAT',
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
        data_type = dtype.lower()
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
        if write_CS_metadata is not None:
            set_CS_ncattr(write_CS_metadata, var)
    dataset.close()


class RasterDatasetCS(RasterDataset):
    def __init__(self, filename=None, product=None):
        """
        :param filename: filename of the raster file to read (can be either a geotif or a netCDF file)
                        The routine uses the right method to read the file in relation to its file extension


        To initialize the read_raster class only the filename is needed.

        Some public methods are available through the class, the main one (.get_data) allows to retrieve the
        numpy array of the data layer of interest

        """
        # if filename is not None:
        super(RasterDatasetCS, self).__init__(filename=filename, product=product)
        # self.filename = filename

        self.date = None
        self.year = None
        self.month = None
        self.day = None
        self.prod_code = None
        self.sensor_code = None
        self.date_long = None
        self.frequency = None
        # Initialize the parameters for local site (punctual) extraction
        # self.neigh = 0
        # self.lat_offset = 0.  # used in _haversine formulae
        # self.lon_offset = 0.
        # self.filename = filename
        # self.product = product

        # Added by Vijay for Irregular grid
        # self.ds_lons_out = None
        # self.ds_lats_out = None
        # self.data = None
        # Read relevant metadata fields
        try:
            if self.filename is not None:
                self.get_cs_metadata()  # This work only with Climatestation where metadata is already written
        except Exception:  # general error handling, to be better refined in future (TODO!)
            pass

    # Get the climatestation metadata information from the file using cs metadata
    def get_cs_metadata(self):
        # get the boundary coordinates
        self.get_coordinates()

        # TODO when required, modify eStation_* with ClimateStation_*
        metadata_climatstation = SdsMetadata()
        metadata_climatstation.read_from_file(self.filename)

        self.sensor_code = metadata_climatstation.get_item('eStation2_product')
        self.prod_code = metadata_climatstation.get_item('eStation2_subProduct')
        self.version = metadata_climatstation.get_item('eStation2_product_version')
        self.description = metadata_climatstation.get_item('eStation2_description')
        self.scale_factor = metadata_climatstation.get_item('eStation2_scaling_factor')
        self.fill_value = metadata_climatstation.get_item('eStation2_nodata')
        self.add_offset = metadata_climatstation.get_item('eStation2_scaling_offset')
        self.frequency = metadata_climatstation.get_item('eStation2_frequency')
        self.date = metadata_climatstation.get_item('eStation2_date')
        if self.date is None:
            seed = os.path.basename(self.filename).split('_')
            self.date = seed[0]
            self.year = seed[0][:4]
            self.month = seed[0][4:6]
            self.day = seed[0][6:]
            self.prod_code = seed[1]
        else:
            date_item = functions.extract_from_date(str(self.date))
            self.year = date_item[0]
            self.month = date_item[1]
            self.day = date_item[2]
            self.hour = date_item[3]

        self.date_long = date(int(self.year), int(self.month), int(self.day)).strftime('%Y-%b-%d')


class RasterDatasetIngest(RasterDataset):
    def __init__(self, filename, subproduct, datasource):
        """
        :param filename: filename of the raster file to read (can be either a geotif or a netCDF file)
                        The routine uses the right method to read the file in relation to its file extension
        :param subproduct: CS subproduct (subproduct+ingestion+subdatasource)
        :param datasource: CS datasource (contains native_mapset, preproc_type)
        """
        self.subproduct = subproduct
        self.preproc_type = datasource.preproc_type
        native_mapset_code = datasource.native_mapset
        self.native_mapset = _create_mapset(native_mapset_code)

        product = subproduct['re_extract']
        super(RasterDatasetIngest, self).__init__(filename=filename, product=product)

        self.assign_product_in_info()

        # Added by Vijay for Irregular grid
        self.ds_lons_out = None
        self.ds_lats_out = None
        self.data = None
        # Read relevant metadata fields
    def assign_product_in_info(self):
        if self.subproduct is not None:
            if self.scale_factor is None:
                self.scale_factor = self.subproduct['in_scale_factor']
            if self.fill_value is None:
                self.fill_value = self.subproduct['nodata']
            if self.add_offset is None:
                self.add_offset = self.subproduct['in_offset']
            # self.in_var = self.product_in_info_ingestion['re_extract']
            target_mapset_code = self.subproduct['mapsetcode']
            self.target_mapset = _create_mapset(target_mapset_code)
            self.zc = self.target_mapset.bbox

    def preprocess(self):
        # if self.rasterDataset is None:
        #     self.read_Rasterdata_from_file(self.in_filename, variable=self.in_var)

        # rasterDataset = self.rasterDataset
        preprocess_status = False
        preproc_type = self.preproc_type
        if preproc_type is None and preproc_type == 'None' and preproc_type == '""' and preproc_type == "''" and preproc_type == '':
            self.get_data(band=self.product)

        elif preproc_type == 'NETCDF_IRI_CDS':
            # raster = RasterDataset(filename=input_file)
            # SET CS subproduct parameters into the Raster class
            # raster.set_CS_subproduct_parameter(subproduct, target_mapset_code=mapsetcode)
            # data_numpy_array = raster.get_data() # conversion to physical value by applying nodatavalue
             # conversion to physical value by applying nodatavalue
            native_dataset =  self._get_GDAL_dataset()
            # Clip the native dataset to target bbox ? or change resolution
            pre_processed_dataset = do_clip_resample_reproject(native_dataset, target_mapset=self.target_mapset,
                                                               native_mapset=self.native_mapset)
            # pre_proccessed_dataset = self.raster_clip_bbox(self.zc, setSpatialRef=True)
            # Apply input scaling factor offset nodata and get physical value data
            pre_processed_data_array = np.array(pre_processed_dataset.ReadAsArray())

            # rescale and assign processed array to rasterDataset object
            self._process_data(pre_processed_data_array, pre_processed_dataset, already_extracted=True)
            pre_processed_dataset = None
            native_dataset = None
            pre_processed_data_array= None
            preprocess_status = True
        elif preproc_type == 'NETCDF_IRREGULAR_GRID':
            # self.set_CS_subproduct_parameter(subproduct, mapsetcode)
            self._get_netcdf()
            preprocess_status = True

        else:
            print('Preproc_type not recognized:[%s] Check in DB table. Exit' % preproc_type)
            preprocess_status = False

        if self.data is None:
            preprocess_status = False

        return preprocess_status

    # It is a wrapper for write netcdf to manage ingestion of netcdf. Here we should add some checks and return boolean value
    def write_nc_ingest(self, output_file, product_out_info, metadata):

        write_status = write_nc(file_name=output_file, data=[self.data],
                                                          dataset_tag=[product_out_info.subproductcode],
                                                          zc=self.zc, fill_value=product_out_info.nodata,
                                                          scale_factor=product_out_info.scale_factor,
                                                          offset=product_out_info.scale_offset, dtype=product_out_info.data_type_id,
                                                          write_CS_metadata=metadata, lats=self.ds_lats_out,
                                                          lons=self.ds_lons_out)

    # # Extract Data from a generic netcdf file [CDS/IRI] with regular grid
    # # TODO: data are now returned as numpy.array: should be better stored in the object itself
    # def get_data_regular_grid(self, target_mapset_name, native_mapset_name):
    #     """
    #     :param target mapset code  -    eStation variable to get bbox etc of target data
    #     :param native mapset code  -    eStation variable to get bbox etc of native file
    #     :return: Data array of the kind numpy.array which shape is defined by subsample coordinates and/or
    #     local site coordinates
    #     ***********************************************************************************************************
    #     ***********************************************************************************************************
    #     """
    #     # Read original dataset
    #     native_dataset = self._get_GDAL_dataset()
    #     # Clip the native dataset to target bbox ? or change resolution
    #     pre_processed_dataset = do_clip_resample_reproject(native_dataset, target_mapset=target_mapset_name,
    #                                                        native_mapset=native_mapset_name)
    #     # pre_proccessed_dataset = self.raster_clip_bbox(self.zc, setSpatialRef=True)
    #     # Apply input scaling factor offset nodata and get physical value data
    #     pre_processed_data_array = np.array(pre_processed_dataset.ReadAsArray())
    #
    #     # TODO: replace this part with assigning to self.data
    #     physicalvalue_data_array = self._process_data(pre_processed_data_array, pre_processed_dataset, already_extracted=True)
    #
    #     return physicalvalue_data_array
    #
    # # Extract Data from a generic netcdf file [CDS/IRI] with irregular grid
    # # TODO: data are now returned as numpy.array: should be better stored in the object itself
    # def get_data_irregular_grid(self, subproduct, mapsetcode):
    #     """
    #     :param mapset code  -    eStation variable to get bbox etc of target data
    #     :param subproduct  -    eStation variable to get subproduct properties to generate the ingested file
    #     :return: Data array of the kind numpy.array which shape is defined by subsample coordinates and/or
    #     local site coordinates
    #     ***********************************************************************************************************
    #     ***********************************************************************************************************
    #     """
    #     # This method should return(or generate) target_bbox specific lat, lon and variable array
    #     # By now native lat, lon are initialized. (get_coordinates in the init does this already)
    #     self.set_CS_subproduct_parameter(subproduct, mapsetcode)
    #     return self._get_netcdf()

    # # Copy from subproduct object to self [and from target mapset as well]
    # def set_CS_subproduct_parameter(self, subproduct, target_mapset_code=None):
    #     """
    #     :param target mapset code  -    eStation variable to get bbox etc of target data
    #     :param subproduct  -    eStation variable to get subproduct properties to generate the ingested file
    #     :return: None. Doesn't return anything but assign the properties of the dataset to ingest it
    #     ***********************************************************************************************************
    #     ***********************************************************************************************************
    #     """
    #     if subproduct is not None:
    #         # self.native_zc = subproduct[]
    #         if self.scale_factor is None:
    #             self.scale_factor = subproduct['in_scale_factor']
    #         if self.fill_value is None:
    #             self.fill_value = subproduct['nodata']
    #         if self.add_offset is None:
    #             self.add_offset = subproduct['in_offset']
    #         self.band = subproduct['re_extract']
    #     if target_mapset_code is not None:
    #         # Get the Target mapset
    #         trg_mapset = mapset.MapSet()
    #         trg_mapset.assigndb(target_mapset_code)
    #         self.zc = trg_mapset.bbox

     # Clip to the target bounding box (target bbox is taken from target mapset)
    # def raster_clip_bbox(self, bbox, orig_ds=None, setSpatialRef=False):
    #     """
    #     :param bbox  -    eStation variable to get bbox of target data to be clipped
    #     :param orig_ds  -    native file which is read as GDAL dataset
    #     :return: Memory dataset with target projection, bbox, resolution information
    #     ***********************************************************************************************************
    #     ***********************************************************************************************************
    #     """
    #     if orig_ds is None:
    #         orig_ds = self._get_GDAL_dataset()
    #
    #     if setSpatialRef:
    #         set_coordinate_system(orig_ds)
    #         # orig_ds.SetSpatialRef()
    #
    #     # orig_band = orig_ds.GetRasterBand(1)
    #     # # orig_ds.SetProjection(orig_cs.ExportToWkt())
    #     # in_data_type = orig_band.DataType
    #     # Assign mapset to dataset in memory
    #     # out_data_type_gdal = in_data_type
    #
    #
    #     #  Translate(destName, srcDS, **kwargs)
    #     # projWin --- subwindow in projected coordinates to extract: [ulx, uly, lrx, lry]
    #     mem_ds = gdal.Translate('', orig_ds, format = 'MEM', projWin = bbox)
    #
    #     return mem_ds


    #   Goal: process the lat/lon (non-equally-spaced) arrays from native file to clip to the target mapset
    #
    #   Inputs: input_lats -> array of (non-equally-spaced) latitudes   -> expected decreasing (North to South)
    #           input_lons -> array of (non-equally-spaced) longitudes  -> expected increasing (West to East)

    #           min_lat: target BBox minimum latitude
    #           min_lon: target BBox minimum longitude
    #           max_lat: target BBox maximum latitude
    #           max_lon: target BBox maximum longitude

    #   Output: output_lats: array of lats for the 'clipped' zone -> min/max_lat replaces the original vals
    #           output_lons: array of lats for the 'clipped' zone -> min/max_lo replaces the original vals
    #

    # Play with lats/lons grids (arrays) for clipping
    # def get_indices_lats_lons(self, input_lats=None, input_lons=None, min_lat=None, min_lon=None, max_lat=None, max_lon=None):
    #     if input_lats is None:
    #         input_lats = self.ds_lats
    #     if input_lons is None:
    #         input_lons = self.ds_lons
    #     if min_lat is None or min_lon is None or max_lat is None or max_lon is None:
    #         min_lat = self.zc[0]
    #         max_lat = self.zc[1]
    #         min_lon = self.zc[2]
    #         max_lon = self.zc[3]
    #
    #     if helpers_read_write_raster.check_longitude_0_360(input_lons):
    #         min_lon = 180 + min_lon
    #         max_lon = 180 + max_lon
    #     # Checks on BBox within lat/lon arrays
    #     if min_lat < np.min(input_lats):
    #         print('Error')
    #         return -1
    #     if max_lat > np.max(input_lats):
    #         print('Error')
    #         return -1
    #     if min_lon < np.min(input_lons):
    #         # check if the lon is 0 to 360
    #         print('Error')
    #         return -1
    #     if max_lon > np.max(input_lons):
    #         print('Error')
    #         return -1
    #
    #     # Checks on passed values (min<max)
    #
    #     # Checks on lats/lons arrays direction (and invert if needed)
    #     b_lat_flip = False
    #     if input_lats[0] > input_lats[-1]:
    #         input_lats=np.flip(input_lats)
    #         b_lat_flip = True
    #
    #     # Get i_min_lat
    #     i_min_lat = np.argmin(abs(input_lats-min_lat))
    #     if input_lats[i_min_lat] > min_lat:
    #         i_min_lat = i_min_lat-1
    #
    #     # Get i_max_lat
    #     i_max_lat = np.argmin(abs(input_lats-max_lat))
    #     if input_lats[i_max_lat] < max_lat:
    #         i_max_lat = i_max_lat+1
    #
    #     # Get i_min_lon
    #     i_min_lon = np.argmin(abs(input_lons-min_lon))
    #     if input_lons[i_min_lon] > min_lon:
    #         i_min_lon = i_min_lon-1
    #
    #     # Get i_max_lon
    #     i_max_lon = np.argmin(abs(input_lons-max_lon))
    #     if input_lons[i_max_lon] < max_lon:
    #         i_max_lon = i_max_lon+1
    #
    #     # Subset arrays [+1 to be added for numpy convention of indexing]
    #     # output_lats = input_lats[i_min_lat:i_max_lat+1]
    #     # output_lons = input_lons[i_min_lon:i_max_lon+1]
    #     i_max_lat = i_max_lat + 1
    #     i_max_lon = i_max_lon + 1
    #     output_lats = input_lats[i_min_lat:i_max_lat]
    #     output_lons = input_lons[i_min_lon:i_max_lon]
    #
    #     print('i_min_lat= ',i_min_lat)
    #     print('i_max_lat=',i_max_lat)
    #     print('i_min_lon',i_min_lon)
    #     print('i_max_lon',i_max_lon)
    #
    #     # Replace the extreme values
    #     output_lats[0]=min_lat
    #     output_lats[-1]=max_lat
    #     output_lons[0]=min_lon
    #     output_lons[-1]=max_lon
    #
    #     if b_lat_flip:
    #         output_lats=np.flip(output_lats)
    #
    #     self.ds_lons_out = output_lons
    #     self.ds_lats_out = output_lats
    #
    #     # return output_lats, output_lons
    #     return i_min_lat, i_max_lat, i_min_lon, i_max_lon

    # Clip an numpy array according to passed indices
    # def netcdf_var_extraction(self, v, i_i, i_f, j_i, j_f):
    #     if self.neigh not in [None, 0]:
    #         if len(v.shape) > 2:
    #             data = np.squeeze(v[:, i_i:i_f, j_i:j_f].astype(self.data_type))
    #         else:
    #             data = v[i_i:i_f, j_i:j_f].astype(self.data_type)
    #             data = np.squeeze(data)
    #     else:
    #         if len(v.shape) > 2:
    #             data = np.squeeze(v[:, i_i, j_i].astype(self.data_type))
    #         else:
    #             data = np.squeeze(v[i_i, j_i].astype(self.data_type))
    #
    #     return data


def _create_mapset(mapsetcode):
    # Get the Target mapset
    mapsetObj = mapset.MapSet()
    mapsetObj.assigndb(mapsetcode)
    return mapsetObj

# This do_clip_resample_reproject is basically used for 3 purpose
# 1. Assign Projection information to the netcdf dataset since this information is available as lat lon
# 2. Clip the target bounding box (target bbox is taken from target mapset)
# 3. Resampling or resolution change (conversion of resolution eg.10km to 1km)
def do_clip_resample_reproject(orig_ds, target_mapset, native_mapset=None):
    """
    :param target mapset code  -    eStation variable to get bbox etc of target data
    :param native mapset code  -    eStation variable to get bbox etc of native data
    :param orig_ds  -    native file which is read as dataset
    :return: Memory dataset with target projection, bbox, resolution information
    ***********************************************************************************************************
    ***********************************************************************************************************
    """

    if native_mapset is not None:
        # native_mapset = mapset.MapSet()
        # native_mapset.assigndb(native_mapset)
        orig_cs = osr.SpatialReference(wkt=native_mapset.spatial_ref.ExportToWkt())
        # orig_size_x = native_mapset.size_x
        # orig_size_y = native_mapset.size_y
        orig_band = orig_ds.GetRasterBand(1)
        # orig_ds.SetGeoTransform(native_mapset.geo_transform)
        orig_ds.SetProjection(orig_cs.ExportToWkt())
    else:
        orig_cs = osr.SpatialReference()
        orig_cs.ImportFromWkt(orig_ds.GetProjectionRef())
        orig_band = orig_ds.GetRasterBand(1)
        # orig_ds.SetGeoTransform(native_mapset.geo_transform)
        # orig_ds.SetProjection(native_mapset.spatial_ref.ExportToWkt())

    in_data_type = orig_band.DataType

    # Get the Target mapset
    # trg_mapset = mapset.MapSet()
    # trg_mapset.assigndb(target_mapset)
    out_cs = target_mapset.spatial_ref
    out_size_x = target_mapset.size_x
    out_size_y = target_mapset.size_y

    # Create target in memory
    mem_driver = gdal.GetDriverByName('MEM')

    # Assign mapset to dataset in memory
    out_data_type_gdal = in_data_type
    mem_ds = mem_driver.Create('', out_size_x, out_size_y, 1, out_data_type_gdal)
    # aligned_geotransform = helpers_read_write_raster.align2_native_geotransform(trg_mapset.geo_transform)
    mem_ds.SetGeoTransform(target_mapset.geo_transform)
    mem_ds.SetProjection(out_cs.ExportToWkt())

    # Do the Re-projection
    orig_wkt = orig_cs.ExportToWkt()
    res = gdal.ReprojectImage(orig_ds, mem_ds, orig_wkt, out_cs.ExportToWkt(),
                              gdalconst.GRA_NearestNeighbour)

    return mem_ds

# Set Climate station defined METADATA for netcdf attribute
def set_CS_ncattr(CS_metadata, var):
    try:
        CS_metadata.write_to_nc_var(nc_variable=var)
    except:
        print('Error in assigning metadata .. Continue')

# Set the coordinate system for NETCDF (also for GTIFF if needed)
def _set_coordinate_system(ds):
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
    ds.SetProjection(new_cs.ExportToWkt())
    # ds.SetSpatialRef(new_cs)