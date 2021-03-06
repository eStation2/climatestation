from __future__ import division
from __future__ import unicode_literals
from __future__ import absolute_import
from __future__ import print_function
# import sys
from builtins import dict
from builtins import round
from builtins import int
from future import standard_library
standard_library.install_aliases()
from builtins import str
from builtins import zip
from builtins import range
from past.utils import old_div
import os, shutil
# from os import sys, path

import datetime
import tempfile
from config import es_constants

# import json

# from config import es_constants
from database import querydb

# from apps.productmanagement.datasets import Dataset
from apps.productmanagement.products import Product
from apps.acquisition.ingestion_ingest_file import conv_data_type_to_gdal
from lib.python import functions
from lib.python import es_logging as log

logger = log.my_logger(__name__)

# import numpy as np
import numpy.ma as ma
import math
# from greenwich import Raster, Geometry

try:
    from osgeo import gdal
    from osgeo import gdal_array
    from osgeo import ogr, osr
    from osgeo import gdalconst
except ImportError:
    import gdal
    import gdal_array
    import ogr
    import osr
    import gdalconst


def getFilesList(productcode, subproductcode, version, mapsetcode, date_format, start_date, end_date):
    #    Generate a list of files (possibly with repetitions) for extracting timeseries
    #    It applies to a single dataset (prod/sprod/version/mapset) and between 2 dates
    #

    # Prepare for results
    list_files = []
    dates_list = []

    # print productcode
    # print subproductcode
    # print version
    # print mapsetcode
    # print date_format
    # print start_date
    # print end_date

    p = Product(product_code=productcode, version=version)
    dataset = p.get_dataset(mapset=mapsetcode, sub_product_code=subproductcode)
    dataset_filenames = dataset.get_filenames()
    file_extension = ''
    if len(dataset_filenames) > 0:
        file_extension = '.' + dataset_filenames[0][-4:].split('.')[1]
    product_type = dataset._db_product.product_type
    subdir_level = dataset._frequency.subdir_level

    dateformat_str = "%Y%m%d"
    if date_format == 'YYYYMMDDHHMM':
        dateformat_str = "%Y%m%d%H%M"
        start_date = dataset._frequency.cast_to_frequency(start_date)
        end_date = dataset._frequency.cast_to_frequency(end_date) + datetime.timedelta(hours=23)

    if date_format == 'YYYYMMDD':
        dateformat_str = "%Y%m%d"

    if date_format == 'YYYY':
        dateformat_str = "%Y"

    if date_format != 'MMDD':
        # Loop over dates
        for date in dataset._frequency.get_dates(start_date, end_date):
            if (date >= start_date) and (date <= end_date):
                filedate = date.strftime(dateformat_str)

                # productfilename = functions.set_path_filename(filedate, productcode, subproductcode, mapsetcode, version, file_extension)
                # productfilepath = dataset.fullpath + productfilename
                productfilepath = functions.get_fullpath_filename(filedate,
                                                                  subdir_level,
                                                                  product_type,
                                                                  productcode,
                                                                  subproductcode,
                                                                  mapsetcode,
                                                                  version,
                                                                  file_extension)
                dates_list.append(date)
                if os.path.isfile(productfilepath):
                    list_files.append(productfilepath)
                    # dates_list.append(date)
                else:
                    list_files.append('')

    else:
        # Extract MMDD
        mmdd_start = start_date.month*100+start_date.day
        mmdd_end = end_date.month*100+end_date.day

        # Case 1: same year
        if start_date.year == end_date.year:
            for mmdd in dataset.get_mmdd():
                if mmdd_start <= int(mmdd) <= mmdd_end:
                    # mmdd contains the list of existing 'mmdd' - sorted

                    # productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, file_extension)
                    # productfilepath = dataset.fullpath + productfilename
                    productfilepath = functions.get_fullpath_filename(mmdd,
                                                                      subdir_level,
                                                                      product_type,
                                                                      productcode,
                                                                      subproductcode,
                                                                      mapsetcode,
                                                                      version,
                                                                      file_extension)

                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(start_date.year, int(mmdd[:2]), int(mmdd[2:4])))
            # Debug only
            # logger.info(list_files)

        # Case 2: end_year > start_year
        if start_date.year < end_date.year:
            # list_mmdd contains the list of existing 'mmdd' - sorted
            list_mmdd = dataset.get_mmdd()
            # Put all dates from start_mmdd to end of the year
            for mmdd in list_mmdd:
                if int(mmdd) >= mmdd_start:
                    # productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, file_extension)
                    # productfilepath = dataset.fullpath + productfilename
                    productfilepath = functions.get_fullpath_filename(mmdd,
                                                                      subdir_level,
                                                                      product_type,
                                                                      productcode,
                                                                      subproductcode,
                                                                      mapsetcode,
                                                                      version,
                                                                      file_extension)
                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(start_date.year, int(mmdd[:2]), int(mmdd[2:4])))

            # Fill the list with 'full' years
            for n_years in range(end_date.year-start_date.year-1):
                for mmdd in list_mmdd:
                    # productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, file_extension)
                    # productfilepath = dataset.fullpath + productfilename
                    productfilepath = functions.get_fullpath_filename(mmdd,
                                                                      subdir_level,
                                                                      product_type,
                                                                      productcode,
                                                                      subproductcode,
                                                                      mapsetcode,
                                                                      version,
                                                                      file_extension)

                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(start_date.year+1+n_years, int(mmdd[:2]), int(mmdd[2:4])))

            # Put all dates from begin of the year to end_mmdd
            for mmdd in list_mmdd:
                if int(mmdd) <= mmdd_end:
                    # mmdd contains the list of existing 'mmdd' - sorted

                    # productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, file_extension)
                    # productfilepath = dataset.fullpath + productfilename
                    productfilepath = functions.get_fullpath_filename(mmdd,
                                                                      subdir_level,
                                                                      product_type,
                                                                      productcode,
                                                                      subproductcode,
                                                                      mapsetcode,
                                                                      version,
                                                                      file_extension)

                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(end_date.year, int(mmdd[:2]), int(mmdd[2:4])))

            # logger.info(list_files)

    return [list_files, dates_list]


def getTimeseries(productcode, subproductcode, version, mapsetcode, wkt, start_date, end_date, aggregate):

    #    Extract timeseries from a list of files and return as JSON object
    #    It applies to a single dataset (prod/sprod/version/mapset) and between 2 dates
    #    Several types of aggregation foreseen:
    #
    #       mean :      Sum(Xi)/N(Xi)        -> min/max not considered          e.g. Rain/Vegetation
    #       cumulate:   Sum(Xi)              -> min/max not considered          e.g. Active Fires
    #
    #       count:      N(Xi where min < Xi < max)                              e.g. Active Fires (not used so far)
    #       surface:    count * PixelArea                                       e.g. Water Bodies
    #       percent:    count/Ntot                                              e.g. Vegetation anomalies (not used so far)
    #
    #   History: 1.0 :  Initial release - since 2.0.1 -> now renamed '_green' from greenwich package
    #            1.1 :  Since Feb. 2017, it is based on a different approach (gdal.RasterizeLayer instead of greenwich)
    #                   in order to solve the issue with MULTIPOLYGON
    #

    # Convert the wkt into a geometry
    ogr.UseExceptions()
    theGeomWkt = ' '.join(wkt.strip().split())
    # geom = Geometry(wkt=str(theGeomWkt), srs=4326)
    geom = ogr.CreateGeometryFromWkt(str(theGeomWkt))

    # Get Mapset Info
    mapset_info = querydb.get_mapset(mapsetcode=mapsetcode)

    # Prepare for computing conversion to area: the pixel size at Lat=0 is computed
    # The correction to the actual latitude (on AVERAGE value - will be computed below)
    const_d2km = 12364.35
    area_km_equator = abs(float(mapset_info.pixel_shift_lat)) * abs(float(mapset_info.pixel_shift_long)) *const_d2km

    # Get Product Info
    product_info = querydb.get_product_out_info(productcode=productcode,
                                                subproductcode=subproductcode,
                                                version=version)
    if product_info.__len__() > 0:
        # Get info from product_info
        scale_factor = 0
        scale_offset = 0
        nodata = 0
        date_format = ''
        for row in product_info:
            scale_factor = row.scale_factor
            scale_offset = row.scale_offset
            nodata = row.nodata
            date_format = row.date_format
            date_type = row.data_type_id

        # Create an output/temp shapefile, for managing the output layer (really mandatory ?? Can be simplified ???)
        try:
            tmpdir = tempfile.mkdtemp(prefix=__name__, suffix='_getTimeseries',
                                      dir=es_constants.base_tmp_dir)
        except:
            logger.error('Cannot create temporary dir ' + es_constants.base_tmp_dir + '. Exit')
            raise NameError('Error in creating tmpdir')

        out_shape = tmpdir+os.path.sep+"output_shape.shp"
        outDriver = ogr.GetDriverByName('ESRI Shapefile')

        # Create the output shapefile
        outDataSource = outDriver.CreateDataSource(out_shape)
        dest_srs = ogr.osr.SpatialReference()
        dest_srs.ImportFromEPSG(4326)

        outLayer = outDataSource.CreateLayer("Layer", dest_srs)
        # outLayer = outDataSource.CreateLayer("Layer")
        idField = ogr.FieldDefn("id", ogr.OFTInteger)
        outLayer.CreateField(idField)

        featureDefn = outLayer.GetLayerDefn()
        feature = ogr.Feature(featureDefn)
        feature.SetGeometry(geom)
        feature.SetField("id", 1)
        outLayer.CreateFeature(feature)
        feature = None

        [list_files, dates_list] = getFilesList(productcode, subproductcode, version, mapsetcode, date_format, start_date, end_date)

        # Built a dictionary with filenames/dates
        dates_to_files_dict = dict(list(zip(dates_list, list_files)))

        # Generate unique list of files
        unique_list = set(list_files)
        uniqueFilesValues = []

        geo_mask_created = False
        for infile in unique_list:
            single_result = {'filename': '', 'meanvalue_noscaling': nodata, 'meanvalue': None}

            if infile.strip() != '' and os.path.isfile(infile):
                # try:

                    # Open input file
                    orig_ds = gdal.Open(infile, gdal.GA_ReadOnly)
                    orig_cs = osr.SpatialReference()
                    orig_cs.ImportFromWkt(orig_ds.GetProjectionRef())
                    orig_geoT = orig_ds.GetGeoTransform()
                    x_origin = orig_geoT[0]
                    y_origin = orig_geoT[3]
                    pixel_size_x = orig_geoT[1]
                    pixel_size_y = -orig_geoT[5]

                    in_data_type_gdal = conv_data_type_to_gdal(date_type)

                    # Create a mask from the geometry, with the same georef as the input file[s]
                    if not geo_mask_created:

                        # Read polygon extent and round to raster resolution
                        x_min, x_max, y_min, y_max = outLayer.GetExtent()
                        x_min_round = int(old_div((x_min-x_origin),pixel_size_x))*pixel_size_x+x_origin
                        x_max_round = (int(old_div((x_max-x_origin),(pixel_size_x)))+1)*pixel_size_x+x_origin
                        y_min_round = (int(old_div((y_min-y_origin),(pixel_size_y)))-1)*pixel_size_y+y_origin
                        y_max_round = int(old_div((y_max-y_origin),(pixel_size_y)))*pixel_size_y+y_origin
                    #
                    #     # Create the destination data source
                        x_res = int(round(old_div((x_max_round - x_min_round), pixel_size_x)))
                        y_res = int(round(old_div((y_max_round - y_min_round), pixel_size_y)))
                    #
                    #     # Create mask in memory
                        mem_driver = gdal.GetDriverByName('MEM')
                        mem_ds = mem_driver.Create('', x_res, y_res, 1, in_data_type_gdal)
                        mask_geoT = [x_min_round, pixel_size_x, 0, y_max_round, 0, -pixel_size_y]
                        mem_ds.SetGeoTransform(mask_geoT)
                        mem_ds.SetProjection(orig_cs.ExportToWkt())
                    #
                    #     # Create a Layer with '1' for the pixels to be selected
                        gdal.RasterizeLayer(mem_ds, [1], outLayer, burn_values=[1])
                        # gdal.RasterizeLayer(mem_ds, [1], outLayer, None, None, [1])

                        # Read the polygon-mask
                        band = mem_ds.GetRasterBand(1)
                        geo_values = mem_ds.ReadAsArray()

                        # Create a mask from geo_values (mask-out the '0's)
                        geo_mask = ma.make_mask(geo_values == 0)
                        geo_mask_created = True
                    #
                    #     # Clean/Close objects
                        mem_ds = None
                        mem_driver = None
                        outDriver = None
                        outLayer = None

                    # Read data from input file
                    x_offset = int(old_div((x_min-x_origin),pixel_size_x))
                    y_offset = int(old_div((y_origin-y_max),pixel_size_y))

                    band_in = orig_ds.GetRasterBand(1)
                    data = band_in.ReadAsArray(x_offset, y_offset, x_res, y_res)
                    #   Catch the Error ES2-105 (polygon not included in Mapset)
                    if data is None:
                        logger.error('ERROR: polygon extends out of file mapset for file: %s' % infile)
                        return []

                    # Create a masked array from the data (considering Nodata)
                    masked_data = ma.masked_equal(data, nodata)

                    # Apply on top of it the geo mask
                    mxnodata = ma.masked_where(geo_mask, masked_data)

                    # Test ONLY
                    # write_ds_to_geotiff(mem_ds, '/data/processing/exchange/Tests/mem_ds.tif')

                    if aggregate['aggregation_type'] == 'count' or aggregate['aggregation_type'] == 'percent' or aggregate['aggregation_type'] == 'surface' or aggregate['aggregation_type'] == 'precip':

                        if mxnodata.count() == 0:
                            meanResult = None
                        else:
                            mxrange = mxnodata
                            min_val = aggregate['aggregation_min']
                            max_val = aggregate['aggregation_max']

                            if min_val is not None:
                                min_val_scaled = old_div((min_val - scale_offset), scale_factor)
                                mxrange = ma.masked_less(mxnodata, min_val_scaled)

                                # See ES2-271
                                if max_val is not None:
                                    # Scale threshold from physical to digital value
                                    max_val_scaled = old_div((max_val - scale_offset), scale_factor)
                                    mxrange = ma.masked_greater(mxrange, max_val_scaled)

                            elif max_val is not None:
                                # Scale threshold from physical to digital value
                                max_val_scaled = old_div((max_val - scale_offset), scale_factor)
                                mxrange = ma.masked_greater(mxnodata, max_val_scaled)

                            if aggregate['aggregation_type'] == 'percent':
                                # 'percent'
                                meanResult = float(mxrange.count())/float(mxnodata.count()) * 100

                            elif aggregate['aggregation_type'] == 'surface':
                                # 'surface'
                                # Estimate 'average' Latitude
                                y_avg = (y_min + y_max)/2.0
                                pixelAvgArea = area_km_equator * math.cos(old_div(y_avg, 180) * math.pi)
                                # This is applicable/important for the WD_GEE (between 0 to 100% -> both avg/occur)
                                # Consider the percent (%) as a weight - see ES2-271
                                # The sum() has to be used - rather than the count() - not to overestimate the avg
                                # (for occur the aline below was also ok).
                                # meanResult = float(mxrange.count()) * pixelAvgArea

                                if productcode=='wd-gee':
                                    meanResult = float(mxrange.sum()/100.0) * pixelAvgArea
                                else:
                                    meanResult = float(mxrange.count()) * pixelAvgArea

                            elif aggregate['aggregation_type'] == 'precip':
                                # 'precip'
                                # Estimate 'average' Latitude
                                y_avg = (y_min + y_max)/2.0
                                pixelAvgArea = area_km_equator * math.cos(old_div(y_avg, 180) * math.pi)
                                # This is applicable/important for the WD_GEE (between 0 to 100% -> both avg/occur)
                                # The correction factor 1E-3 is applied to have the final result in millions m3
                                # Units are: surface: km2 (1E6 m2) - precip: mm (1E-3 m) -> 1E3 m3
                                meanResult = float(mxrange.sum()) * pixelAvgArea * 1e-3

                            else:
                                # 'count'
                                meanResult = float(mxrange.count())

                        # Both results are equal
                        finalvalue = meanResult

                    else:   # if aggregate['type'] == 'mean' or if aggregate['type'] == 'cumulate':
                        if mxnodata.count() == 0:
                            finalvalue = None
                            meanResult = None
                        else:
                            if aggregate['aggregation_type'] == 'mean':
                                # 'mean'
                                meanResult = mxnodata.mean()
                            else:
                                # 'cumulate'
                                meanResult = mxnodata.sum()

                            finalvalue = (meanResult*scale_factor+scale_offset)

                    # Assign results
                    single_result['filename'] = infile
                    single_result['meanvalue_noscaling'] = meanResult
                    single_result['meanvalue'] = finalvalue

            else:
                logger.debug('ERROR: raster file does not exist - %s' % infile)

            uniqueFilesValues.append(single_result)

        # Define a dictionary to associate filenames/values
        files_to_values_dict = dict((x['filename'], x['meanvalue']) for x in uniqueFilesValues)

        # Prepare array for result
        resultDatesValues = []

        # Returns a list of 'filenames', 'dates', 'values'
        for mydate in dates_list:

            my_result = {'date': datetime.date.today(), 'meanvalue':nodata}

            # Assign the date
            my_result['date'] = mydate
            # Assign the filename
            my_filename = dates_to_files_dict[mydate]

            # Map from array of Values
            my_result['meanvalue'] = files_to_values_dict[my_filename]

            # Map from array of dates
            resultDatesValues.append(my_result)

        try:
            shutil.rmtree(tmpdir)
        except:
            logger.debug('ERROR: Error in deleting tmpdir. Exit')

        # Return result
        return resultDatesValues
    else:
        logger.debug('ERROR: product not registered in the products table! - %s %s %s' % (productcode, subproductcode, version))
        return []


