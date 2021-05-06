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
from lib.python.image_proc.read_write_raster import RasterDatasetIngest
from lib.python.image_proc import helpers_read_write_raster
from lib.python import metadata, mapset
logger = log.my_logger(__name__)

ingest_dir_in = es_constants.ingest_dir
ingest_error_dir = es_constants.ingest_error_dir
data_dir_out = es_constants.processing_dir
systemsettings = functions.getSystemSettings()
python_version = sys.version_info[0]

def ingestion_netcdf(input_file, in_date, product, subproducts, datasource_descr, my_logger, echo_query=False, test_mode=False):
#   Manages ingestion of 1 file for a given date
#   Arguments:
#       in_date : single date depending on the frequency
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
#     data_dir_out = es_constants.processing_dir
    my_logger.info("Entering routine %s for prod: %s and date: %s" % ('ingestion', product['productcode'], in_date))

    # preproc_type = datasource_descr.preproc_type
    # native_mapset_code = datasource_descr.native_mapset
    #
    # do_preprocess = False
    # composed_file_list = None
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

    # ----------------------------------------------------------------------------------
    # 4. Get the physical value data by converting native file--> along with subproduct assigned
    # ----------------------------------------------------------------------------------
    # if do_preprocess:
    composed_file_list = ingestion_pre_process(datasource_descr, subproducts, input_file, tmpdir,
                                               my_logger, product, test_mode)
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
    # -------------------------------------------------------------------------
    #  5 & 6 Post processing - Output Rescale, create output, Metadata
    # -------------------------------------------------------------------------
    ingestion_status = ingestion_post_processing(composed_file_list, in_date, product, datasource_descr, my_logger, input_file, tmpdir)
    # -------------------------------------------------------------------------
    # Remove the Temp working directory
    # -------------------------------------------------------------------------
    try:
        shutil.rmtree(tmpdir)
    except:
        logger.error('Error in removing temporary directory. Continue')
        raise NameError('Error in removing tmpdir')

    # Result is None means we are still waiting for some files to be received. Keep files in /data/ingest
    # dates_not_in_filename means the input files contains many dates (e.g. GSOD precip)
    if ingestion_status:
        if systemsettings['type_installation'] == 'Server':
            store_native_files(product, [input_file], my_logger)
        else:
            delete_files(input_file, my_logger)

    return ingestion_status


def ingestion_post_processing(composed_file_list, in_date, product, datasource_descr, my_logger, input_file, tmpdir):
    ingestion_status = False
    try:
        for ingest_dataset in composed_file_list:
            # raster_dataset = ingest_dataset.rasterDataset
            subproduct = ingest_dataset.subproduct

            # Get output product full filename with product
            output_path_filename = get_output_path_filename(datasource_descr, product, subproduct, in_date)

            #5. Create the output based on the file extension format
            tmp_output_file = tmpdir+'/tmp_file.nc' # tmp_file = composed_file_list[0] #create_output_file(output_path_filename, tmpdir, file_extension)

            # 6. Metadata registration -- here just metadata class is initialized
            metadata = assign_metadata_generic(product, subproduct['subproduct'], subproduct['mapsetcode'], in_date,
                                               os.path.dirname(output_path_filename), [input_file], my_logger)

            # Get the output product info (scaling, ofset, nodata, datatype etc) Cu
            product_out_info = querydb.get_subproduct(productcode=product['productcode'],version=product['version'],subproductcode=subproduct['subproduct'])

            write_status = ingest_dataset.write_nc_ingest(tmp_output_file, product_out_info, metadata)
            if os.path.isfile(tmp_output_file):
                shutil.move(tmp_output_file, output_path_filename)
                ingestion_status = True
    except:
        my_logger.warning("Error in ingestion for prod: %s and date: %s" % (product['productcode'], in_date))
        shutil.rmtree(tmpdir)
        raise NameError('Error in ingestion routine')

    return ingestion_status

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


def ingestion_pre_process(datasource_descr, subproducts, input_file, tmpdir, my_logger, product,
                          test_mode):
    my_logger.debug("Calling routine %s" % 'preprocess_files')
    try:
        composed_file_list = []
        # composed_file_list = pre_process_inputs(preproc_type, native_mapset_code, subproducts,
        #                                                               input_file, tmpdir,
        #                                                               my_logger)
        preproc_type = datasource_descr.preproc_type
        # georef_already_done = False
        my_logger.info("Input files pre-processing by using method: %s" % preproc_type)
        for subproduct in subproducts:
            ingest_subproduct = None
            try:
                # ingest_subproduct = IngestionCS(product=product,subproduct=subproduct,datasource=datasource_descr,input_file=input_file)
                ingest_subproduct = RasterDatasetIngest(subproduct=subproduct, datasource=datasource_descr,filename=input_file)
                # extract raster data with different option based on preprocess type
                preprocess_status = ingest_subproduct.preprocess()
            except:
                # Error occurred and was NOT detected in pre_process routine
                my_logger.error('Error in pre-processing routine for particular subproduct. Exit')
                preprocess_status = False

        # except:
        #     my_logger.error('Error in pre-processing routine. Exit')
        #     raise NameError('Error in pre-processing routine')

            # Check if None is returned (i.e. waiting for remaining files)
            if ingest_subproduct is None:
                my_logger.info('Ingestion preprocess returned with empty object.. something went wrong')
                continue
            if preprocess_status is False:
                my_logger.info('something went wrong in preprocess .. ')
                continue
    
            composed_file_list.append(ingest_subproduct)

        return composed_file_list
    except:
        # Error occurred and was NOT detected in pre_process routine
        my_logger.error('Error in pre-processing routine. Exit')
        # raise NameError('Error in pre-processing routine')
        
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


# def is_test_one_product(test_one_product=None, productcode=None):
#
#     # Verify the test-one-product case
#     do_ingest_source = True
#     if test_one_product:
#         if productcode != test_one_product:
#             do_ingest_source = False
#
#     return do_ingest_source

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

# Not used currently
class Ingestion():
    def __init__(self, product, subproduct, datasource, input_file, in_date=None):
        """
        :param product: CS product with code and version as object
        :param subproduct: CS subproduct (subproduct+ingestion+subdatasource)
        :param filename: filename of the raster file to read (can be either a geotif or a netCDF file)
                        The routine uses the right method to read the file in relation to its file extension
        To initialize the read_raster class only the filename is needed.

        Some public methods are available through the class, the main one (.get_data) allows to retrieve the
        numpy array of the data layer of interest

        """
        self.in_filename = input_file
        self.product = product
        self.datasource= datasource
        # self.ingestion = None
        # self.subdatasource = None
        self.product_in_info_ingestion= subproduct
        self.in_date= in_date
        self.rasterDataset = None

        # self.productcode=None
        # self.version=None

    #     Initialize the needed variable to read raster dataset
    #     self._init_variables()
    #
    #     if self.in_filename is not None:
    #         self.read_Rasterdata_from_file(self.in_filename,variable=self.in_var)


    # Read the raster dataset of the native input file
    def read_Rasterdata_from_file(self, filename, variable=None):
        rasterDataset = RasterDatasetIngest(filename=filename, product=variable)
        if rasterDataset is not None:
            # rasterDataset.ds_lons_out = None
            # rasterDataset.ds_lats_out = None
            # rasterDataset.data = None
            self.rasterDataset = rasterDataset
            self.assign_rasterDataset_parameters(self.rasterDataset)

    # Read raster dataset missing parameters from the file
    def assign_rasterDataset_parameters(self, rasterDataset):
        if self.target_mapset is not None:
            rasterDataset.zc = self.target_mapset.bbox
        # self.native_zc = subproduct[]
        if rasterDataset.scale_factor is None:
            rasterDataset.scale_factor = self.in_scale_factor
        if rasterDataset.fill_value is None:
            rasterDataset.fill_value = self.in_fill_value
        if rasterDataset.add_offset is None:
            rasterDataset.add_offset = self.in_add_offset
        # rasterDataset.band = self.in_var

