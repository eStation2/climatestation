#
#	purpose: Define the ingest service for netcdf from IRI and CDS
#	author:  Vijay Charan & M.Clerici & Jurriaan van't Klooster
#	date:	 Feb 2021
#   descr:
#	history: 1.0
#
#   TODO-LinkIT: for MCD45monthly aborts for out-of-memory in re-scaling data ! FTTB ingest only 2 windows

# source eStation2 base definitions
# from config import es_constants

# import standard modules
import re
import tempfile
import glob
import os
import time, datetime
import time
import shutil
import sys
# import eStation2 modules
from database import querydb
from lib.python import functions
from lib.python import es_logging as log

from config import es_constants
from apps.processing import proc_functions
from apps.productmanagement import products
from apps.acquisition import ingestion_ingest_file
from lib.python.image_proc.read_write_raster import RasterDataset
from lib.python.image_proc import NetCDF_Writer
from lib.python import metadata, mapset
logger = log.my_logger(__name__)

ingest_dir_in = es_constants.ingest_dir
ingest_error_dir = es_constants.ingest_error_dir
data_dir_out = es_constants.processing_dir

python_version = sys.version_info[0]

def ingestion_netcdf(input_file, in_date, product, subproducts, datasource_descr, my_logger, echo_query=False, test_mode=False):
#   Manages ingestion of 1 file for a given date
#   Arguments:
#       input_file: only one input file with full names
#       product: product description name (for DB insertions)
#       subproducts: list of subproducts to be ingested. Contains dictionaries such as:
#
#                sprod = {'subproduct': subproductcode,
#                         'mapsetcode': mapsetcode,
#                         're_extract': regexp to identify files to extract from .zip (only for zip archives)
#                         're_process': regexp to identify files to be processed (there might be ancillary files)}
#                         'in_scale_factor' : in_scale_factor
#                         'in_offset' : in_offset
#                         'nodata' : nodata}
#       datasource_descr: datasource description object (incl. native_mapset, compose_area_method, ..)
#       my_logger: trigger-specific logger
#
#   Returns:
#       0 -> ingestion OK; files to be removed/stored
#       1 -> ingestion wrong; files to be copied to /data/ingest.wrong
#       None -> some mandatory files are missing: wait and do not touch files
    data_dir_out = es_constants.processing_dir
    my_logger.info("Entering routine %s for prod: %s and date: %s" % ('ingestion', product['productcode'], in_date))

    preproc_type = datasource_descr.preproc_type
    native_mapset_code = datasource_descr.native_mapset

    do_preprocess = False
    composed_file_list = None
    # -------------------------------------------------------------------------
    # # Create temp output dir
    # -------------------------------------------------------------------------
    try:
        # Reduce the length of the tmp_dir: the resulting path was too long for operating in the docker container (see ES2-544)
        tmpdir = tempfile.mkdtemp(prefix=__name__, suffix='_' + os.path.basename(input_file)[0:6],
                                  dir=es_constants.base_tmp_dir)
    except:
        my_logger.error('Cannot create temporary dir ' + es_constants.base_tmp_dir + '. Exit')
        raise NameError('Error in creating tmpdir')

    # Get the new subproduct tables for post processing:
    # subproduct_new = querydb.get_subproduct(productcode='', version='undefined', subproductcode='', masked=False)
    # -------------------------------------------------------------------------
    # 1&2. Read the netcdf file and check if its type
    # -------------------------------------------------------------------------
    # netcdf_type = read_netcdf_file(input_file)

    # ----------------------------------------------------------------------------------
    # 4. Get the physical value data by converting native file--> along with subproduct assigned
    # ----------------------------------------------------------------------------------
    if preproc_type != None and preproc_type != 'None' and preproc_type != '""' and preproc_type != "''" and preproc_type != '':
        do_preprocess = True

    # 4. Pre-process (get the physical value data by converting native file--> along with subproduct assigned)
    if do_preprocess:
        composed_file_list = ingestion_pre_process(preproc_type, native_mapset_code, subproducts, input_file, tmpdir, my_logger, in_date, product,
                                                   test_mode)
        # TODO alter this area
        # Error occurred and was detected in pre_process routine
        if str(composed_file_list) == '1':
            my_logger.warning("Error in ingestion for prod: %s and date: %s" % (product['productcode'], in_date))
            # Move files to 'error/storage' directory
            if not test_mode:
                error_file = input_file
                if os.path.isfile(ingest_error_dir + os.path.basename(error_file)):
                    shutil.os.remove(ingest_error_dir + os.path.basename(error_file))
                try:
                    shutil.move(error_file, ingest_error_dir)
                except:
                    my_logger.warning("Error in moving file: %s " % error_file)

            shutil.rmtree(tmpdir)
            raise NameError('Detected Error in preprocessing routine')
    else:
        composed_file_list = [input_file]

    # -------------------------------------------------------------------------
    #  5 & 6 Post processing - Output Rescale, create output, Metadata
    # -------------------------------------------------------------------------
    ingestion_status = ingestion_post_processing(composed_file_list, in_date, product, subproducts, datasource_descr, my_logger, input_file,
                              echo_query, test_mode, tmpdir)
    # -------------------------------------------------------------------------
    # Remove the Temp working directory
    # -------------------------------------------------------------------------
    try:
        shutil.rmtree(tmpdir)
    except:
        logger.error('Error in removing temporary directory. Continue')
        raise NameError('Error in removing tmpdir')

    return ingestion_status

def read_netcdf_file(input_file):
    # Check if the file has many variables
    multi_var_netcdf = False

    # Check if the file has many bands
    multi_band_netcdf = False

    # Check if the file has many variables and bands
    multi_var_band_netcdf = False

def ingestion_post_processing(composed_file_list, in_date, product, subproducts, datasource_descr, my_logger, input_files,
                              echo_query, test_mode, tmpdir):
    ingestion_status = False
    try:
        for pre_processed_input in composed_file_list:
            subproduct =pre_processed_input['subproduct']
            data_numpy_array = pre_processed_input['data_array']
            file_extension = subproduct['re_extract']

            # Target mapset Initialization
            trg_mapset = mapset.MapSet()
            trg_mapset.assigndb(subproduct['mapsetcode'])

            # #Rescaling
            # if False:
            #     # Do physical rescaling
            #     # Apply rescale to data
            #     # scaled_data = ingestion_ingest_file.rescale_data(out_data, in_scale_factor, in_offset, product_in_info, product_out_info, out_data_type_numpy, my_logger)
            #     logger.info('Doing physical rescaling for netcdf')

            # Get output product full filename with product
            output_path_filename = get_output_path_filename(datasource_descr, product, subproduct, in_date)

            #5. Create the output based on the file extension format
            # tmp_file = composed_file_list[0] #create_output_file(output_path_filename, tmpdir, file_extension)

            # 6. Metadata registration -- here just metadata class is initialized
            metadata = assign_metadata_generic(product, subproduct['subproduct'], subproduct['mapsetcode'], in_date,
                                    os.path.dirname(output_path_filename), [input_files], my_logger)

            # Get the output product info (scaling, ofset, nodata, datatype etc) Cu
            # New approach is to get these info from subproduct table
            product_out_info = querydb.get_subproduct(productcode=product['productcode'],version=product['version'],subproductcode=subproduct['subproduct'])

            tmp_file = tmpdir+'tmp_file.nc'
            write_status = NetCDF_Writer.write_nc(file_name=tmp_file, data=[data_numpy_array], dataset_tag=[product_out_info.subproductcode],
                                                  zc=trg_mapset.bbox, fill_value=product_out_info.nodata, scale_factor=product_out_info.scale_factor, offset=product_out_info.scale_offset, dtype=product_out_info.data_type_id,
                                                  write_CS_metadata=metadata)
            # write_status = NetCDF_Writer.write_nc(file_name=tmp_file, data=[data_numpy_array], dataset_tag=[product_out_info.subproductcode],
            #                                       fill_value=product_out_info.nodata, scale_factor=product_out_info.scale_factor, offset=product_out_info.scale_offset, dtype=product_out_info.data_type_id,
            #                                       write_CS_metadata=metadata)

            if os.path.isfile(tmp_file):
                shutil.move(tmp_file, output_path_filename)
                ingestion_status = True
    except:
        my_logger.warning("Error in ingestion for prod: %s and date: %s" % (product['productcode'], in_date))
        shutil.rmtree(tmpdir)
        raise NameError('Error in ingestion routine')

    return ingestion_status

#5. Create the output based on the file extension format
def create_output_file(output_path_filename, tmpdir, file_format):
    # This method should call CS raster read write class to create the ouput
    output_success = True
    return output_success

# Get output product full filename with product
def get_output_path_filename(datasource_descr, product, subproduct, in_date, file_extension='.nc'):
    try:
        # target mapset
        mapset_id = subproduct['mapsetcode']
        subproductcode = subproduct['subproduct']
        # Get information from 'product' table
        product_out_info = ingestion_ingest_file.get_product_out_info(product, subproductcode, logger)

        out_date_str_final = ingestion_ingest_file.define_output_data_format(datasource_descr, in_date, product_out_info.date_format)

        # Define outputfilename, output directory and make sure it exists
        output_directory, output_path_filename= ingestion_ingest_file.define_output_dir_filename(product,
                                                                                                     subproductcode,
                                                                                                     mapset_id,
                                                                                                     out_date_str_final,
                                                                                                     logger, file_extension)

    except:
        logger.error('Error in retriving file name')

    return output_path_filename


def ingestion_pre_process(preproc_type, native_mapset_code, subproducts, input_file, tmpdir, my_logger, in_date, product, test_mode):
    my_logger.debug("Calling routine %s" % 'preprocess_files')
    try:

        composed_file_list = pre_process_inputs(preproc_type, native_mapset_code, subproducts,
                                                                      input_file, tmpdir,
                                                                      my_logger, in_date=in_date)

        # Pre-process returns None if there are not enough files for continuing
        if composed_file_list is None:
            logger.debug('Waiting for additional files to be received. Return')
            shutil.rmtree(tmpdir)
            return None

        # Check if -1 is returned, i.e. nothing to do on the passed files (e.g. S3A night-files)
        elif composed_file_list is -1:
            logger.debug('Nothing to do on the passed files. Return')
            shutil.rmtree(tmpdir)
            return -1
        # TODO check if this place is fine
        else:
            return composed_file_list
    except:
        # Error occurred and was NOT detected in pre_process routine
        my_logger.warning("Error in ingestion for prod: %s and date: %s" % (product['productcode'], in_date))
        # Move files to 'error/storage' directory (ingest.wrong)
        if not test_mode:
            # for error_file in input_files:
            if os.path.isfile(ingest_error_dir + os.path.basename(input_file)):
                shutil.os.remove(ingest_error_dir + os.path.basename(input_file))
            try:
                shutil.move(input_file, ingest_error_dir)
            except:
                my_logger.warning("Error in moving file: %s " % input_file)

        shutil.rmtree(tmpdir)
        raise NameError('Caught Error in preprocessing routine')


def is_test_one_product(test_one_product=None, productcode=None):

    # Verify the test-one-product case
    do_ingest_source = True
    if test_one_product:
        if productcode != test_one_product:
            do_ingest_source = False

    return do_ingest_source


#########################################################################################################
###################### Get Subproducts associated with ingestion and datasource #########################
## Goes in error if specific datasource is not associated with subproducts eg. WSI crop & Pasture #######
#########################################################################################################
def get_subproduct(ingest, product_in_info, datasource_descr_id):
    sprod=None
    try:
        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        nodata_value = product_in_info.no_data
        sprod = {'subproduct': ingest.subproductcode,
                 'mapsetcode': ingest.mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': nodata_value}
        # subproducts.append(sprod)
        return sprod
    except:
        # What to return here?
        logger.warning("Subproduct %s not defined for source %s" % (
            ingest.subproductcode, datasource_descr_id))
    finally:
        return sprod

#################################################
#######   Get list unique dates   ###############
#################################################
def get_list_unique_dates(datasource_descr, files, dates_not_in_filename, product_in_info, ingest_mapsetcode ):
    #   Check the case 'dates_not_in_filename' (e.g. GSOD -> yearly files continuously updated)
    dates_list = []
    if dates_not_in_filename:
        # Build the list of dates from datasource description
        dates_list = build_date_list_from_datasource(datasource_descr, product_in_info, ingest_mapsetcode)

    return dates_list

#########################################################################################
#######Build the list of dates from datasource description & Product info ###############
#########################################################################################
def build_date_list_from_datasource(datasource_descr, product_in_info, ingest_mapset):
    dates_list = []

    start_datetime = datetime.datetime.strptime(str(datasource_descr.start_date), "%Y%m%d")
    if datasource_descr.end_date is None:
        end_datetime = datetime.date.today()
    else:
        end_datetime = datetime.datetime.strptime(str(datasource_descr.end_date), "%Y%m%d")

    all_starting_dates = proc_functions.get_list_dates_for_dataset(product_in_info.productcode, \
                                                                   product_in_info.subproductcode, \
                                                                   product_in_info.version, \
                                                                   start_date=datasource_descr.start_date,
                                                                   end_date=datasource_descr.end_date)

    my_dataset = products.Dataset(product_in_info.productcode,
                                  product_in_info.subproductcode,
                                  ingest_mapset,
                                  version=product_in_info.version,
                                  from_date=start_datetime,
                                  to_date=end_datetime)
    my_dates = my_dataset.get_dates()

    my_formatted_dates = []
    for my_date in my_dates:
        my_formatted_dates.append(my_dataset._frequency.format_date(my_date))

    my_missing_dates = []
    for curr_date in all_starting_dates:
        if curr_date not in my_formatted_dates:
            my_missing_dates.append(curr_date)

    dates_list = sorted(my_missing_dates, reverse=False)

    return dates_list

# Store native files
def store_native_files(product, date_fileslist, logger_spec):
    # Special case for mesa-proc @ JRC
    # Copy to 'Archive' directory
    output_directory = data_dir_out + functions.set_path_sub_directory(
        product['productcode'], None, 'Native', product['version'], 'dummy_mapset_arg')
    functions.check_output_dir(output_directory)
    # Archive the files
    for file_to_move in date_fileslist:
        logger_spec.debug("     --> now archiving input files: %s" % file_to_move)
        new_location = output_directory + os.path.basename(file_to_move)
        try:
            if os.path.isfile(file_to_move):
                shutil.move(file_to_move, new_location)
            else:
                logger_spec.debug("     --> file to be archived cannot be found: %s" % file_to_move)
        except:
            logger_spec.debug("     --> error in archiving file: %s" % file_to_move)

# Delete native files after ingestion
def delete_files(date_fileslist, logger_spec):
    # Delete the files
    for file_to_remove in date_fileslist:
        logger_spec.debug("     --> now deleting input files: %s" % file_to_remove)
        try:
            if os.path.isfile(file_to_remove):
                os.remove(file_to_remove)
            else:
                logger_spec.debug("     --> file to be deleted cannot be found: %s" % file_to_remove)
        except:
            logger_spec.debug("     --> error in deleting file: %s" % file_to_remove)


def pre_process_inputs(preproc_type, native_mapset_code, subproducts, input_file, tmpdir, my_logger, in_date=None):
# -------------------------------------------------------------------------------------------------------
#   Pre-process one or more input files by:
#   2. Extract one or more datasets from a netcdf file, or a multi-layer netcdf file (e.g. HDF)
#   5. Apply geo-reference (native_mapset)
#
#   Input: one or more input files in the 'native' format, for a single data and a single mapset
#   Output: one or more files (1 foreach subproduct), geo-referenced in GTIFF
#
#   Arguments:
#       preproc_type:    type of preprocessing
#       IRI : IRI data
#       CDS : CDS data
#       input_files: list of input files
#   Returned:
#       output_file: temporary created output file[s]
#       None: wait for additional files (e.g. MSG_MPE - in 4 segments)
#       -1: nothing to do on the passed files (e.g. for S3A night-files or out-of-ROI).
#

    my_logger.info("Input files pre-processing by using method: %s" % preproc_type)

    georef_already_done = False

    try:
        if preproc_type == 'IRI':
            sprod_data_list = pre_process_iri(subproducts, input_file, native_mapset_code, tmpdir, my_logger)

        else:
            my_logger.error('Preproc_type not recognized:[%s] Check in DB table. Exit' % preproc_type)
    except:
        my_logger.error('Error in pre-processing routine. Exit')
        raise NameError('Error in pre-processing routine')

    # Check if None is returned (i.e. waiting for remaining files)
    if sprod_data_list is None:
        my_logger.info('Waiting for additional files to be received. Exit')
        return None

    # Check if -1 is returned (i.e. nothing to do on the passed files)
    if sprod_data_list is -1:
        my_logger.info('Nothing to do on the passed files. Exit')
        return -1

    # # Make sure it is a list (if only a string is returned, it loops over chars)
    # if isinstance(interm_files, list):
    #     list_interm_files = interm_files
    # else:
    #     list_interm_files = []
    #     list_interm_files.append(interm_files)

    # set_geoTransform_projection(native_mapset_code, georef_already_done, list_interm_files, my_logger)
    return sprod_data_list

def pre_process_iri(subproducts, input_file, native_mapset_code, my_logger, in_date=None):
    try:
        # This pre processed list contains list of object(subproduct,data(numpy array))key value pair
        pre_processed_list = []
        #Read the file looping over the subproducts?
        for subproduct in subproducts:
            # bandname = subproduct['re_extract']
            # re_process = subproduct['re_process']
            # no_data = subproduct['nodata']
            subproductcode = subproduct['subproduct']
            mapsetcode = subproduct['mapsetcode']
            raster = RasterDataset(filename=input_file)
            # SET CS subproduct parameters into the Raster class
            raster.set_CS_subproduct_parameter(subproduct)
            # NATIVE bbox [s, n, w, e], [lat_0, lon_0]
            # native_bbox, nativelat0long0 = raster.get_coordinates()
            # data_numpy_array = raster.get_data() # conversion to physical value by applying nodatavalue
            data_numpy_array = raster.get_data_CS_netcdf(target_mapset_name=mapsetcode, native_mapset_name=native_mapset_code) # conversion to physical value by applying nodatavalue
            pre_processed_data = {'subproduct': subproduct,  'data_array': data_numpy_array}
            pre_processed_list.append(pre_processed_data)
    except:
        my_logger.error("Error in pre process IRI for date %s"% in_date)

    return pre_processed_list

# ----------------------------------------------
# Assign metadata parameters to metadata class.
# ----------------------------------------------
def assign_metadata_generic(product, subproduct, mapset_id, out_date_str_final, output_directory, final_list_files, my_logger):
    try:
        sds_meta = metadata.SdsMetadata()
        sds_meta.assign_es2_version()
        sds_meta.assign_mapset(mapset_id)
        sds_meta.assign_from_product(product['productcode'], subproduct, product['version'])
        sds_meta.assign_date(out_date_str_final)
        sds_meta.assign_subdir_from_fullpath(output_directory)
        sds_meta.assign_compute_time_now()

        sds_meta.assign_input_files(final_list_files)
        # sds_meta.write_to_file(file_write_metadata)
    except:
        my_logger.warning('Error in assigning metadata class .. Continue')

    return sds_meta