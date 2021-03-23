from netCDF4 import Dataset
import numpy as np
import datetime


def write_nc(file_name, data, dataset_tag, dataset_long_name=None, fill_value=None, scale_factor=None, offset=None,
             valid_range=None, dtype=None, zc=None, mode=None, history=None, lats=None, lons=None, global_attrs=None,
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

# Set METADATA for netcdf attribute
def set_CS_ncattr(CS_metadata,var):
    try:
        CS_metadata.write_to_nc_var(nc_variable=var)
    except:
        print('Error in assigning metadata .. Continue')

