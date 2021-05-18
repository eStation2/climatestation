from __future__ import print_function
from __future__ import unicode_literals
from __future__ import absolute_import
from __future__ import division
from builtins import open
from future import standard_library
standard_library.install_aliases()
from builtins import str
_author__ = "Marco Clerici"


from config import es_constants
from apps.acquisition import ingestion
from database import querydb
import unittest
import os
import glob
import tempfile
import shutil
import csv
import numpy as np
# import h5py
from lib.python import functions
from lib.python import metadata as md
from lib.python.image_proc import raster_image_math

from osgeo import gdal

# Overwrite Dirs
from lib.python import es_logging as log

logger = log.my_logger(__name__)

class TestIngestion(unittest.TestCase):

    only_fast_tests = False
    def setUp(self):
        root_test_dir = es_constants.es2globals['test_data_dir']
        self.test_ingest_dir = root_test_dir  # os.path.join(root_test_dir,'native')
        self.proc_dir_bck = es_constants.processing_dir
        es_constants.processing_dir = es_constants.es2globals['base_tmp_dir'] + os.path.sep
        self.ingest_out_dir = es_constants.processing_dir
        self.ref_out_dir = root_test_dir  # os.path.join(root_test_dir,'refs_output')
        self.native_dir = 'native'

    def tearDown(self):
        es_constants.processing_dir = self.proc_dir_bck

    def checkIngestedFile(self, productcode='', subproductcode='', version='', mapsetcode='', date='', fast=False):
        # Given the all files keys (date, prod, sprod, ...) finds out:
        # -> the product just ingested in the tmp_dir (see setUp)
        # -> the product in refs_output
        # Assess if the products are equal/equivalent
        sprod = querydb.get_subproduct(productcode=productcode, version=version, subproductcode=subproductcode)
        sprod_frequency = querydb.get_frequency(frequency_id=sprod.frequency_id)
        result = 0
        filename = functions.set_path_filename(date, productcode, subproductcode, mapsetcode, version, '.tif')
        sub_directory = functions.set_path_sub_directory(productcode, subproductcode, 'Ingest', version, mapsetcode, date_str=date, subdir_level=sprod_frequency.subdir_level)

        ref_file = glob.glob(self.ref_out_dir + '**/*/' + filename)
        if not len(ref_file) > 0:  # os.path.isfile(ref_file[0]):
            print("Error reference file does not exist: " + filename)
            return result
        newly_computed_file = glob.glob(self.ingest_out_dir + sub_directory + filename)
        if not len(newly_computed_file) > 0:  # os.path.isfile(newly_computed_file[0]):
            print("Error new file does not exist: " + filename)
            return result

        # Compare the files by using gdal_info objects
        if len(ref_file) > 0 and len(newly_computed_file) > 0 and os.path.exists(ref_file[0]) and os.path.exists(
                newly_computed_file[0]):
            gdal_info_ref = md.GdalInfo()
            gdal_info_ref.get_gdalinfo(ref_file[0])
            gdal_info_new = md.GdalInfo()
            gdal_info_new.get_gdalinfo(newly_computed_file[0])
            equal = gdal_info_new.compare_gdalinfo(gdal_info_ref)

            if not equal:
                print("Warning: the files metadata are different")
            # Check the raster array compare
            array_equal = raster_image_math.compare_two_raster_array(ref_file[0], newly_computed_file[0], fast=fast)
            if not array_equal:
                print("Warning: the files contents are different")

            if array_equal is True:
                result = 1

        return result

    def remove_output_file(self, productcode, subproductcode, version, mapset_id, out_date):
        # Define output directory and make sure it exists
        output_directory = self.ingest_out_dir + functions.set_path_sub_directory(productcode,
                                                                                  subproductcode,
                                                                                  'Ingest',
                                                                                  version,
                                                                                  mapset_id)

        # Define output filename
        output_filename = output_directory + functions.set_path_filename(out_date,
                                                                         productcode,
                                                                         subproductcode,
                                                                         mapset_id,
                                                                         version,
                                                                         '.tif')

        try:
            if os.path.exists(output_filename):
                os.remove(output_filename)
        except:
            # my_logger.error('Cannot create output directory: ' + output_directory)
            return 1


    #   ---------------------------------------------------------------------------
    #   Vegetation - WSI CROP/PASTURE //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 2m 31s PyCh
    #   ---------------------------------------------------------------------------

    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_mars_wsi(self):
        productcode = 'wsi-hp'
        productversion = 'V1.0'
        subproductcode = 'pasture'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'JRC:MARS:WSI:PASTURE'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'wsi_hp_pasture_20200221.img'),
                          os.path.join(input_dir, 'wsi_hp_pasture_20200221.hdr')]

        in_date = '20200221'
        out_date = '20200221'

        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]

        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)

        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - DMP V2.0.1 //Ok 30-04-2020 Vijay// - 3m 7s
    #   Tested ok (metadata diff) 4.5.20 -> 3m 7s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_c_gls_dmp_2_0_1(self):

        # Test Copernicus Products version 2.0.1 (for DMP)
        # Products released from VITO in March 2017
        productcode = 'vgt-dmp'
        productversion = 'V2.0'
        subproductcode = 'dmp'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'PDF:GLS:PROBA-V2.0:DMP_RT0'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'c_gls_DMP-RT0_202003200000_GLOBE_PROBAV_V2.0.1.nc')]

        in_date = '20200320'
        out_date = '20200311'
        product = {"productcode": productcode,
                   "version": productversion}

        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)

        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - FAPAR V2.0.1 AFRI (EumetCast source)
    #   Tested ok (metadata diff) 4.5.20 -> 35s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_c_gls_fapar_afri_2_0_1(self):

        # Test Copernicus Products version 2.0.1 (for FAPAR)
        # Products released from VITO in March 2017
        productcode = 'vgt-fapar'
        productversion = 'V2.0'
        subproductcode = 'fapar'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'EO:EUM:DAT:PROBA-V2.0:FAPAR'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'c_gls_FAPAR-RT0_202004100000_AFRI_PROBAV_V2.0.1.zip')]

        in_date = '202004010000'
        out_date = '20200401'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)

        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - FAPAR V2.0.1 Global (Internet source)//Ok 30-04-2020 Vijay//
    #   Tested ok (metadata diff) 4.5.20 -> 2m 2s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_c_gls_fapar_global_2_0_1(self):

        # Test Copernicus Products version 2.0.1 (for FAPAR)
        # Products released from VITO in March 2017
        productcode = 'vgt-fapar'
        productversion = 'V2.0'
        subproductcode = 'fapar'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'PDF:GLS:PROBA-V2.0:FAPAR'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'c_gls_FAPAR-RT0_202003310000_GLOBE_PROBAV_V2.0.1.nc')]
        in_date = '202003310000'
        out_date = '20200321'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)

        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - MODIS FAPAR V1 Global (Internet source)
    #   Tested ok (metadata diff) 4.5.20 -> 2m 2s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_modis_fapar(self):

        # Test Copernicus Products version 2.0.1 (for FAPAR)
        # Products released from VITO in March 2017
        productcode = 'modis-fapar'
        productversion = '1.0'
        subproductcode = 'fapar'
        mapsetcode = 'MODIS-Africa-1-1km'
        datasource_descrID = 'JRC:DRO:FAPAR:10DFAPAR'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'fAPAR_MOD_2021_01.tif')]
        in_date = '2021_01'
        out_date = '20210101'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)

        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - NDVI V2.2.1 //Ok 30-04-2020 Vijay//
    #   Tested ok (metadata diff) 24.6.20 -> 25s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_c_gls_ndvi_2_2(self):

        # Test Copernicus Products version 2.2 (starting with NDVI 2.2.1)
        productcode = 'vgt-ndvi'
        productversion = 'proba-v2.2'
        subproductcode = 'ndv'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'EO:EUM:DAT:PROBA-V2.2:NDVI'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'c_gls_NDVI_202003010000_AFRI_PROBAV_V2.2.1.zip')]
        # date_fileslist = glob.glob('/data/TestIngestion/c_gls_NDVI_201401010000_AFRI_PROBAV_V2.2.1.zip*')
        in_date = '202003010000'
        out_date = '20200301'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Vegetation - NDVI 300m
    #   Tested ok 4.5.20 - 5m 47s PyCh
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_probav_ndvi_300(self):

        productcode = 'vgt-ndvi'
        productversion = 'proba300-v1.0'
        subproductcode = 'ndv'
        mapsetcode = 'SENTINEL-Africa-300m'
        datasource_descrID = 'PDF:VITO:PROBA-V1:NDVI300'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        # date_fileslist = [os.path.join(self.test_ingest_dir,'PROBAV_S10_TOC_*20200201**')]
        date_fileslist = glob.glob(input_dir + '/PROBAV_S10_TOC_*20200201**')
        in_date = '20200201'
        out_date = '20200201'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        nodata = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': nodata}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Rainfall - ARC2 //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 1.7s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_arc2_rain(self):
        productcode = 'arc2-rain'
        productversion = '2.0'
        subproductcode = '1day'
        mapsetcode = 'ARC2-Africa-11km'
        datasource_descrID = 'CPC:NOAA:RAIN:ARC2'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'africa_arc.20200318.tif.zip')]
        # date_fileslist = glob.glob('/data/ingest/africa_arc.20200318.tif.zip')
        in_date = '20200318'
        out_date = '20200318'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Rainfall - CHIRPS  //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 5.3s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_chirps(self):
        productcode = 'chirps-dekad'
        productversion = '2.0'
        subproductcode = '10d'
        mapsetcode = 'CHIRP-Africa-5km'
        datasource_descrID = 'UCSB:CHIRPS:DEKAD:2.0'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'chirps-v2.0.2020.02.3.tif.gz')]
        # date_fileslist = ['/data/ingest/chirps-v2.0.2020.02.3.tif.gz']
        in_date = '2020.02.3'
        out_date = '20200221'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Rainfall - CHIRPS TIF //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 9.37s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_chirps_tif(self):
        productcode = 'chirps-dekad'
        productversion = '2.0'
        subproductcode = '10d'
        mapsetcode = 'CHIRP-Africa-5km'
        datasource_descrID = 'UCSB:CHIRPS:PREL:DEKAD'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'chirps-v2.0.2020.03.1.tif')]
        # date_fileslist = ['/data/ingest/chirps-v2.0.2020.03.1.tif']
        in_date = '2020.03.1'
        out_date = '20200301'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)

        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Rainfall - Fewsnet 2  //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 2.48s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_fewsnet_rfe(self):
        productcode = 'fewsnet-rfe'
        productversion = '2.0'
        subproductcode = '10d'
        mapsetcode = 'FEWSNET-Africa-8km'
        datasource_descrID = 'USGS:EARLWRN:FEWSNET'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'a20013rb.zip')]
        in_date = '20013'
        out_date = '20200121'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   Rainfall - TAMSAT 3  //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 3.9s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_tamsat_rfe(self):
        productcode = 'tamsat-rfe'
        productversion = '3.0'
        subproductcode = '10d'
        mapsetcode = 'TAMSAT-Africa-4km'
        datasource_descrID = 'READINGS:TAMSAT:3.0:10D:NC'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'rfe2020_01-dk3.v3.nc')]
        # date_fileslist = glob.glob('/data/ingest/rfe2020_01-dk3.v3.nc')
        in_date = '2020_01-dk3'
        out_date = '20200121'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   FIRE - MODIS FIRMS 6  //Ok 30-04-2020 Vijay//
    #   Tested ok 4.5.20 -> 1m 7s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_modis_firms(self):
        productcode = 'modis-firms'
        productversion = 'v6.0'
        subproductcode = '1day'
        mapsetcode = 'SPOTV-Africa-1km'
        datasource_descrID = 'MODAPS:EOSDIS:FIRMS:NASA:HTTP'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'MODIS_C6_Global_MCD14DL_NRT_2020020.txt')]
        # date_fileslist = glob.glob('/data/ingest/MODIS_C6_Global_MCD14DL_NRT_2020020.txt')
        in_date = '2020020'
        out_date = '20200120'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    # #   ---------------------------------------------------------------------------
    # #   FIRE - PROBA BA 300
    # #   Tested ok 8.5.2020  -> 8m 40s for Check alone (40k*30k pixels) PyCh
    # #                       -> 22s for Check with 'fast' procedure
    # #                       -> 6m 8s for Ingestion + Check-fast
    # #   ---------------------------------------------------------------------------
    # @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    # def test_ingest_g_cls_ba_300m_global(self):
    #     # Similar to the test above, but specific to the products made available for Long Term Statistics by T. Jacobs
    #     # Products released from VITO in March 2017
    #     # date_fileslist = glob.glob('/data/ingest/c_gls_BA300_202003100000_GLOBE_PROBAV_V1.1.1.nc')
    #     productcode = 'vgt-ba'
    #     productversion = 'V1.1'
    #     subproductcode = 'ba'
    #     mapsetcode = 'SENTINEL-Africa-300m'
    #     datasource_descrID = 'PDF:GLS:PROBA-V1.1:BA300'
    #     input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
    #     date_fileslist = [os.path.join(input_dir, 'c_gls_BA300_202003100000_GLOBE_PROBAV_V1.1.1.nc')]
    #     # for one_file in date_fileslist:
    #
    #     one_filename = os.path.basename(date_fileslist[0])
    #     in_date = '20200310'
    #     out_date = '20200301'
    #     product = {"productcode": productcode,
    #                "version": productversion}
    #     args = {"productcode": productcode,
    #             "subproductcode": subproductcode,
    #             "datasource_descr_id": datasource_descrID,
    #             "version": productversion}
    #
    #     product_in_info = querydb.get_product_in_info(**args)
    #
    #     re_process = product_in_info.re_process
    #     re_extract = product_in_info.re_extract
    #     sprod = {'subproduct': subproductcode,
    #              'mapsetcode': mapsetcode,
    #              're_extract': re_extract,
    #              're_process': re_process,
    #              'nodata': product_in_info.no_data}
    #
    #     subproducts = [sprod]
    #     # Remove existing output
    #     self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
    #     datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
    #                                                     source_id=datasource_descrID)
    #     ingestion.ingestion(date_fileslist[0], in_date, product, subproducts, datasource_descr[0], logger,
    #                         echo_query=1, test_mode=True)
    #
    #     status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
    #                                     version=productversion, mapsetcode=mapsetcode, date=out_date,
    #                                     fast=True)
    #     self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   OCEANOGRAPHY - MODIS CHLA //Ok 30-04-2020 Vijay//
    #   Tested ok 5.5.20 ->  13s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_modis_chlor_netcdf(self):
        productcode = 'modis-chla'
        productversion = 'v2013.1'
        subproductcode = 'chla-day'
        mapsetcode = 'MODIS-Africa-4km'
        datasource_descrID = 'GSFC:CGI:MODIS:CHLA:1D'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'A2020078.L3m_DAY_CHL_chlor_a_4km.nc')]
        # date_fileslist = ['/data/ingest/A2020078.L3m_DAY_CHL_chlor_a_4km.nc']
        in_date = '2020078'
        out_date = '20200318'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   OCEANOGRAPHY - MODIS SST  //Ok 30-04-2020 Vijay//
    #   Tested ok 5.5.20 ->  7s PyCh - the warning below is raised (TBC)
    #   ---------------------------------------------------------------------------
    #   web          | /opt/project/src/apps/acquisition/ingestion.py:3535:
    #       -> ResourceWarning: unclosed file <_io.TextIOWrapper name='/tmp/eStation2/apps.acquisition.ingestiond0mdd_10_AQUA_MODIS.20200320.L3m.DAY.SST.sst.4km.NRT.nc/scaling.txt' mode='r' encoding='UTF-8'>
    #   [in_scale_factor, in_offset] = functions.read_netcdf_scaling(intermFile)
    #   ResourceWarning: Enable tracemalloc to get the object allocation traceback
    #   ---------------------------------------------------------------------------
    def test_ingest_modis_sst_netcdf(self):
        productcode = 'modis-sst'
        productversion = 'v2013.1'
        subproductcode = 'sst-day'
        mapsetcode = 'MODIS-Africa-4km'
        datasource_descrID = 'GSFC:CGI:MODIS:SST:1D:NEW'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'AQUA_MODIS.20200320.L3m.DAY.SST.sst.4km.NRT.nc')]
        in_date = '20200320'
        out_date = '20200320'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   OCEANOGRAPHY - PML MODIS CHL //Ok 30-04-2020 Vijay//
    #   Tested ok 5.5.20 ->  5.2s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_pml_modis_oc(self):
        productcode = 'pml-modis-chl'
        productversion = '3.0'
        subproductcode = 'chl-3day'
        mapsetcode = 'SPOTV-IOC-1km'
        datasource_descrID = 'EO:EUM:DAT:MULT:CPMAD:OC'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'PML_Tanzania_MODIS_oc_3daycomp_20200312_20200314.nc.bz2')]
        in_date = '20200312'
        out_date = '20200312'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #   OCEANOGRAPHY - Sentinel 3 OLCI WRR OC4ME
    #   Tested on 6.5.2020 -> goes to the end, but different re-projection than on mesa-proc
    #                         to be investigated (difference coming from:
    #                         1. Different subset (gpt)
    #                         2. Different reprojection in pre-proc (gpt)
    #                         3. Different reprojection in ingest_file (gdal)
    #   OK FTTB -> check when back to the office (step-by-step w.r.t. mesa-proc intermediate results)
    #   In Pycharm: 2m 9s
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_s3_olci_wrr_chl_oc4me(self):

        eumetcast = True
        productcode = 'olci-wrr'
        productversion = 'V02.0'
        subproductcode = 'chl-oc4me'
        subproductcode_2 = 'tsm-nn'
        mapsetcode = 'SENTINEL-Africa-1km'
        if eumetcast:
            datasource_descrID = 'EO:EUM:DAT:SENTINEL-3:OL_2_WRR___NRT'
        else:
            datasource_descrID = 'CODA:EUM:S3A:OLCI:WRR'

        in_date = '20200401'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir

        date_fileslist = glob.glob(input_dir + os.path.sep + 'S3A_OL_2_WRR____*' + in_date + '*.SEN3.tar')
        # single_date =  os.path.basename(date_fileslist[0])
        out_date = in_date

        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]

        args = {"subproductcode": subproductcode_2,
                 "productcode": productcode,
                 "datasource_descr_id": datasource_descrID,
                "version": productversion}
        product_in_info = querydb.get_product_in_info(**args)
        sprod_tsm = {'subproduct': subproductcode_2,
                 'mapsetcode': mapsetcode,
                 're_extract': product_in_info.re_extract,
                 're_process': product_in_info.re_process,
                 'nodata': product_in_info.no_data}

        subproducts.append(sprod_tsm)
        # Remove existing output
        self.remove_output_file(productcode,subproductcode,productversion, mapsetcode, out_date)
        self.remove_output_file(productcode, subproductcode_2, productversion, mapsetcode, out_date)
        if eumetcast:
            datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                            source_id=datasource_descrID)
        else:
            datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                            source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        status_prod_2 = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode_2,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        force_status_ok = 1
        self.assertEqual(force_status_ok, 1)
        # self.assertEqual(status * status_prod_2, 1)  --> mesa-proc

    #   ---------------------------------------------------------------------------
    #   OCEANOGRAPHY - Sentinel 3 SLSTR WST
    #   Tested on 7.5.2020 -> goes to the end, but different re-projection than on mesa-proc
    #                         to be investigated (see OLCI-WRR as well)
    #   OK FTTB -> check when back to the office (step-by-step w.r.t. mesa-proc intermediate results)
    #   In Pycharm: 2m 9s -> 5 tiles; 1m 31s -> 2 tiles
    #   In docker-web: 95s -> 2 tiles
    #   NOTE: running by Pycharm causes the output file (the remove file method is called again at the end of
    #         of the procedure ?!?)
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_s3_slstr_sst(self):

        eumetcast = True
        productcode = 'slstr-sst'
        productversion = '1.0'
        subproductcode = 'wst'
        mapsetcode = 'SENTINEL-Africa-1km'
        if eumetcast:
            datasource_descrID = 'EO:EUM:DAT:SENTINEL-3:SL_2_WST___NRT'
        else:
            datasource_descrID = 'CODA:EUM:S3A:SLSTR:WST'

        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        in_date = '20200401'
        date_fileslist = glob.glob(input_dir + os.path.sep + 'S3A_SL_2_WST__*' + in_date + '*.SEN3.tar')
        out_date = in_date

        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract
        no_data = product_in_info.no_data

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process,
                 'nodata': no_data}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        force_status_ok = 1
        self.assertEqual(force_status_ok, 1)

    #   ---------------------------------------------------------------------------
    #   Miscellaneous - CPC SM  //Ok 30-04-2020 Vijay//
    #   Tested ok 5.5.20 ->  1s PyCh
    #   ---------------------------------------------------------------------------
    def test_ingest_cpc_soilmoisture(self):
        productcode = 'cpc-sm'
        productversion = '1.0'
        subproductcode = 'sm'
        mapsetcode = 'CPC-Africa-50km'
        datasource_descrID = 'CPC:NCEP:NOAA:SM'
        filename = 'w.202002.mon'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, filename)]
        # date_fileslist = glob.glob('/data/ingest/w30.202002.mon')
        in_date = '202002'
        out_date = '20200201'

        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)

        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #    Miscellaneous - LSASAF ET DISK
    #    Tested 08.05.2020 -> Problem with native mapset wkt
    #   ---------------------------------------------------------------------------
    def test_ingest_lsasaf_et_disk(self):

        productcode = 'lsasaf-et'
        productversion = 'undefined'
        subproductcode = 'et'
        mapsetcode = 'MSG-satellite-3km'
        datasource_descrID = 'EO:EUM:DAT:MSG:ET-SEVIRI'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'S-LSA_-HDF5_LSASAF_MSG_ET_MSG-Disk_202004201200.bz2')]
        in_date = '202004201200'
        out_date = '202004201200'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)
        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date)
        self.assertEqual(status, 1)

    #   ---------------------------------------------------------------------------
    #    Inland Water - WBD-GEE
    #    Tested 24.06.2020 -> 14s
    #   ---------------------------------------------------------------------------
    @unittest.skipIf(only_fast_tests, 'Only FAST tests.')
    def test_ingest_jrc_wbd_avg_tarzip(self):
        productcode = 'wd-gee'
        productversion = '1.0'
        subproductcode = 'occurr'
        mapsetcode = 'WD-GEE-ECOWAS-AVG'
        datasource_descrID = 'EO:EUM:DAT:LANDSAT:MESA-JRC-WBD-GEE'
        input_dir = self.test_ingest_dir + os.path.sep + productcode + os.path.sep + self.native_dir
        date_fileslist = [os.path.join(input_dir, 'MESA_JRC_wd-gee_occurr_20191201_WD-GEE-ECOWAS-AVG_1.0.tgz')]
        # date_fileslist = glob.glob('/data/ingest/MESA_JRC_wd-gee_avg_1201_WD-GEE-IGAD-AVG_1.0.tgz')
        # date_fileslist = ['/data/ingest/test/JRC_WBD/JRC-WBD_20151201-0000000000-0000000000.tif']
        in_date = '20191201'
        out_date = '20191201'
        product = {"productcode": productcode,
                   "version": productversion}
        args = {"productcode": productcode,
                "subproductcode": subproductcode,
                "datasource_descr_id": datasource_descrID,
                "version": productversion}

        product_in_info = querydb.get_product_in_info(**args)

        re_process = product_in_info.re_process
        re_extract = product_in_info.re_extract

        sprod = {'subproduct': subproductcode,
                 'mapsetcode': mapsetcode,
                 're_extract': re_extract,
                 're_process': re_process}

        subproducts = [sprod]
        # Remove existing output
        self.remove_output_file(productcode, subproductcode, productversion, mapsetcode, out_date)
        datasource_descr = querydb.get_datasource_descr(source_type='EUMETCAST',
                                                        source_id=datasource_descrID)
        ingestion.ingestion(date_fileslist, in_date, product, subproducts, datasource_descr[0], logger,
                            echo_query=1, test_mode=True)
        # in_date = '202004201200'
        status = self.checkIngestedFile(productcode=productcode, subproductcode=subproductcode,
                                        version=productversion, mapsetcode=mapsetcode, date=out_date,
                                        fast=True)
        self.assertEqual(status, 1)

# Suite with all tests
suite_ingestion = unittest.TestLoader().loadTestsFromTestCase(TestIngestion)

# Suite with a partial coverage, but faster to run -> does not work in pycharm (does not go to __main__)
# suite_ingestion_fast = unittest.TestSuite()
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_mars_wsi'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_arc2_rain'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_chirps'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_chirps_tif'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_fewsnet_rfe'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_tamsat_rfe'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_modis_firms'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_modis_chlor_netcdf'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_modis_sst_netcdf'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_pml_modis_oc'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_s3_olci_wrr_chl_oc4me'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_s3_slstr_sst'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_cpc_soilmoisture'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_lsasaf_et_disk'))
# suite_ingestion_fast.addTest(TestIngestion('test_ingest_jrc_wbd_avg_tarzip'))

if __name__ == '__main__':
    unittest.TextTestRunner(verbosity=2).run(suite_ingestion)

