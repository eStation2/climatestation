from __future__ import print_function
from __future__ import unicode_literals
from __future__ import absolute_import
from __future__ import division

from future import standard_library
from pywt.tests import test_modes

standard_library.install_aliases()
from builtins import str
import unittest
import re
import os
from database import querydb
from apps.acquisition import get_datastore, ingestion_netcdf, ingestion
from lib.python import es_logging as log
logger = log.my_logger(__name__)
class SourceEOS:
    def __init__(self,
                 url=None,
                 internet_id=None,
                 defined_by=None,
                 descriptive_name=None,
                 description=None,
                 modified_by=None,
                 update_datetime=None,
                 user_name=None,
                 password=None,
                 type=None,
                 include_files_expression=None,
                 files_filter_expression=None,
                 status=None,
                 pull_frequency=None,
                 datasource_descr_id=None,
                 frequency_id=None,
                 start_date=None,
                 end_date=None,
                 https_params=None,
                 productcode=None,
                 version=None ):
        self.url = url
        self.internet_id = internet_id
        self.defined_by = defined_by
        self.descriptive_name = descriptive_name
        self.description = description
        self.modified_by = modified_by
        self.update_datetime = update_datetime
        self.user_name = user_name
        self.password = password
        self.type = type
        self.include_files_expression = include_files_expression
        self.files_filter_expression = files_filter_expression
        self.status = status
        self.pull_frequency = pull_frequency
        self.datasource_descr_id = datasource_descr_id
        self.frequency_id = frequency_id
        self.start_date = start_date
        self.end_date = end_date
        self.https_params = https_params
        self.productcode = productcode
        self.version = version
#
class TestGetEOS(unittest.TestCase):

    # def test_GetEOS_PC2_homedir(self):
    #     base_folder='/eos/jeodpp/data/SRS/Copernicus/S3/scenes/source/'
    #     filter_filter_expression = 'S3A_OL_2_WRR____*'
    #     sensor_id='OL2WRR'
    #     year='2020'
    #     month='05'
    #     day='01'
    #     ftp_eumetcast_userpwd='root:rootroot'
    #     current_list = self.get_list_matching_files_dir(base_folder+year+'/'+month+'/'+day, filter_filter_expression)
    #
    #
    # def get_list_matching_files_dir(self, directory, pattern):
    #     lst = []
    #     for root, dirs, files in os.walk(directory):
    #         for basename in files:
    #             if re.search(pattern, basename):
    #                 fn = os.path.join(root, basename)
    #                 lst.append(fn)
    #     return lst



    def testRemote_CDS_SST_1DAY(self):
        internet_id = 'CDS:ERA5:REANALYSIS:RFE:DAY'
        template= {"resourcename_uuid":"reanalysis-era5-single-levels", "format": "netcdf", "product_type": "reanalysis",
        "variable": "sea_surface_temperature", "year": None,"month": None, "day":None }
        remote_url='https://cds.climate.copernicus.eu/api/v2'
        from_date = '20200619'
        to_date = '20200621'
        frequency = 'e1day'
        my_source = SourceEOS(internet_id=internet_id,
                              url=remote_url,
                              descriptive_name='CDS',
                              include_files_expression=template,
                              pull_frequency=3,
                              user_name='32952',
                              password='f0154805-2620-4288-a412-18bc89b98c7d',
                              start_date=from_date,
                              end_date=to_date,
                              frequency_id=frequency,
                              type='cds_api',
                              files_filter_expression='cds-total-precip',
                              https_params='',
                              productcode='cds-total-precip',
                              version='1.0')

        #files_list = get_internet.build_list_matching_files_tmpl(remote_url, template, from_date, to_date, frequency)
        result = get_datastore.loop_get_datastore(test_one_source=internet_id, my_source=my_source)

    def testRemote_CDS_SST_1Month(self):
        internet_id = "CDS:ERA5:REANALYSIS:SST:MONTH"#'CDS:ERA5:REANALYSIS:SST:MONTH'

        template_month = {"resourcename_uuid":"reanalysis-era5-single-levels-monthly-means", "format": "netcdf", "product_type": "monthly_averaged_reanalysis",
        "variable": "sea_surface_temperature", "year": None,"month": None, "time":None }
        template_hour = {"resourcename_uuid":"reanalysis-era5-single-levels", "format": "netcdf", "product_type": "reanalysis",
            "variable": "sea_surface_temperature", "year": None,"month": None, "day":None, "time":None}
        template_day = {"resourcename_uuid":"reanalysis-era5-single-levels", "format": "netcdf", "product_type": "reanalysis",
            "variable": "sea_surface_temperature", "year": None,"month": None, "day":None}
        template_hour_pressure = {"resourcename_uuid":"reanalysis-era5-pressure-levels", "format": "netcdf", "product_type": "reanalysis",
            "variable": "temperature","pressure_level": "925", "year": None,"month": None, "day":None,"time":None}
        template = template_hour_pressure
        remote_url = 'https://cds.climate.copernicus.eu/api/v2'
        from_date = '20200701'
        to_date = '20201002'
        frequency = 'e1month'
        # frequency = 'e1hour'
        files_filter_expression='reanalysis-era5-single-levels-monthly-means'
        files_filter_expression = 'reanalysis-era5-single-levels'
        files_filter_expression = 'reanalysis-era5-pressure-levels'
        my_source = SourceEOS(internet_id=internet_id,
                              url=remote_url,
                              descriptive_name='CDS',
                              include_files_expression=template,
                              pull_frequency=3,
                              user_name='32952',
                              password='f0154805-2620-4288-a412-18bc89b98c7d',
                              start_date=from_date,
                              end_date=to_date,
                              frequency_id=frequency,
                              type='cds_api',
                              files_filter_expression=files_filter_expression,
                              https_params='',
                              productcode='era5-monthly-sst',
                              version='1.0'
                              )

        # files_list = get_internet.build_list_matching_files_tmpl(remote_url, template, from_date, to_date, frequency)
        result = get_datastore.loop_get_datastore(test_one_source=internet_id, my_source=my_source)



    def testRemote_IRI_surfacetemp_1Month(self):
        internet_id = "IRI:NOAA:SURFACETEMP:MONTH"#'CDS:ERA5:REANALYSIS:SST:MONTH'

        template_hour_pressure = {"resourcename_uuid":"reanalysis-era5-pressure-levels", "format": "netcdf", "product_type": "reanalysis",
            "variable": "temperature","pressure_level": "925", "year": None,"month": None, "day":None,"time":None}
        template = None
        remote_url = 'http://iridl.ldeo.columbia.edu/'
        from_date = '20200101'
        to_date = '20201201'
        frequency = 'e1month'
        files_filter_expression=None
        my_source = SourceEOS(internet_id=internet_id,
                              url=remote_url,
                              descriptive_name='IRI',
                              include_files_expression=template,
                              pull_frequency=3,
                              user_name='anonymous',
                              password='anonymous',
                              start_date=from_date,
                              end_date=to_date,
                              frequency_id=frequency,
                              type='iri_api',
                              files_filter_expression=files_filter_expression,
                              https_params='',
                              productcode= 'iri-surface-temp',
                              version='1.0')

        # files_list = get_internet.build_list_matching_files_tmpl(remote_url, template, from_date, to_date, frequency)
        result = get_datastore.loop_get_datastore(test_one_source=internet_id, my_source=my_source)


    def debug_IRI_surfacetemp_1Month_ingest_netcdf(self):
        internet_id = "IRI:NOAA:SURFACETEMP:MONTH"#'CDS:ERA5:REANALYSIS:SST:MONTH'
        product = {"productcode": "iri-surface-temp", "version": "1.0"}
        downloaded_file = '/tmp/climatestation/surface_temp_Jan_2020.nc'
        in_date = '20200101'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)


    def debug_CDS_RFE_DAY_netcdf(self):
        internet_id = "CDS:ERA5:REANALYSIS:RFE:DAY"
        product = {"productcode": "era5-rfe", "version": "1.0"}
        downloaded_file = '/data/ingest/202103200000_reanalysis-era5-single-levels_reanalysis_total_precipitation.nc'
        in_date = '202103200000'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)

    def debug_IRI_PRCP_1Month_ingest_netcdf(self):
        internet_id = "IRI:NOAA:PRCP:MONTH"#'CDS:ERA5:REANALYSIS:SST:MONTH'
        product = {"productcode": "iri_prcp", "version": "1.0"}
        downloaded_file = '/data/processing/iri_prcp/1.0/archive/20210101-iri_prcp.nc'
        in_date = '20210101'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)

    def debug_CDS_SST_MONTH_netcdf(self):
        internet_id = "CDS:ERA5:REANALYSIS:SST:MONTH"
        product = {"productcode": "era5-monthly-sst", "version": "1.0"}
        downloaded_file = '/data/ingest/20210101_sst_monthly_average.nc'
        in_date = '202101010000'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)

    def debug_CDS_2MDW_hour_netcdf(self):
        internet_id = "CDS:ERA5:REANALYSIS:2MDW:HOUR"
        product = {"productcode": "era5-hourly-2mdw", "version": "1.0"}
        downloaded_file = '/data/processing/era5-hourly-2mdw/1.0/archive/202101010000_reanalysis-era5-single-levels_reanalysis_2m_dewpoint_temperature.nc'
        in_date = '202101010000'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)


    def debug_CDS_MSLP_hour_netcdf(self):
        internet_id = "CDS:ERA5:REANALYSIS:MSLP:HOUR"
        product = {"productcode": "era5-hourly-mslp", "version": "1.0"}
        downloaded_file = '/data/processing/era5-hourly-mslp/1.0/archive/202101010100_reanalysis-era5-single-levels_reanalysis_mean_sea_level_pressure.nc'
        in_date = '202101010000'
        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        sub_datasource = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, sub_datasource,
                                                             datasource_descr, logger, test_mode=True)