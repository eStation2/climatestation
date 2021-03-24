from __future__ import print_function
from __future__ import division
from __future__ import unicode_literals
from __future__ import absolute_import
#
#        purpose: Define the get_internet service
#        author:  VIJAY CHARAN
#        date:    19.02.2021
#        descr    Reads the definition from eStation DB and execute the copy to local disk
#        history: 1.0

# Import standard modules
from builtins import open
from builtins import int
from future import standard_library

standard_library.install_aliases()
from builtins import str
from past.utils import old_div
import pycurl
import certifi  # Pierluigi
import signal
import io
import json
import tempfile
import sys
import os
import re
import datetime
import shutil
import time

from time import sleep

# Import eStation2 modules
from lib.python import es_logging as log
from config import es_constants
from database import querydb
from apps.productmanagement import datasets
from lib.python.api import cds_api, iri_api
from lib.python import functions
from apps.acquisition import ingestion

logger = log.my_logger(__name__)

#   General definitions
c = pycurl.Curl()
buffer = io.StringIO()
if not os.path.isdir(es_constants.base_tmp_dir):
    os.makedirs(es_constants.base_tmp_dir)

if not os.path.isdir(es_constants.ingest_dir):
    os.makedirs(es_constants.ingest_dir)

if not os.path.isdir(es_constants.ingest_error_dir):
    os.makedirs(es_constants.ingest_error_dir)

# tmpdir = tempfile.mkdtemp(prefix=__name__, dir=es_constants.base_tmp_dir)
echo_query = False
user_def_sleep = es_constants.es2globals['poll_frequency']


#   ---------------------------------------------------------------------------
#   Functions
#   ---------------------------------------------------------------------------

######################################################################################
#   signal_handler
#   Purpose: properly terminate the service, in case of interruption
#   Author: Marco Clerici, JRC, European Commission
#   Date: 2014/09/01
#   Inputs: defaults for signal_handler

def signal_handler(signal, frame):
    global processed_list_filename, processed_list
    global processed_info_filename, processed_info

    logger.info("Length of processed list is %i" % len(processed_list))

    # functions.dump_obj_to_pickle(processed_list, processed_list_filename)
    functions.dump_obj_to_pickle(processed_info, processed_info_filename)

    print('Exit ' + sys.argv[0])
    logger.warning("Get Internet service is stopped.")
    sys.exit(0)



#####################################################################################
#   build_list_matching_files_cds
#   Purpose: return the list of file names matching a 'template' with 'date' placeholders
#            It is the entry point for the 'http_cds' source type
#   Author: VIJAY CHARAN VENKATACHALAM, JRC, European Commission
#   Date: 2020/06
#   Inputs: template: object with the needed parameters to fill the template get
#           from_date: start date for the dataset (datetime.datetime object)
#           to_date: end date for the dataset (datetime.datetime object)
#           frequency: dataset 'frequency' (see DB 'frequency' table)
#
def build_list_matching_files_cds(base_url, template, from_date, to_date, frequency_id,
                                  resourcename_uuid):
    # Add a check on frequency
    try:
        frequency = datasets.Dataset.get_frequency(frequency_id, datasets.Frequency.DATEFORMAT.DATETIME)
    except Exception as inst:
        logger.debug("Error in datasets.Dataset.get_frequency: %s" % inst.args[0])
        raise

    # Manage the start_date (mandatory).
    try:
        # If it is a date, convert to datetime
        if functions.is_date_yyyymmdd(str(from_date), silent=True):
            datetime_start = datetime.datetime.strptime(str(from_date), '%Y%m%d')
        else:
            # If it is a negative number, subtract from current date
            if isinstance(from_date, int) or isinstance(from_date, int):
                if from_date < 0:
                    datetime_start = datetime.datetime.today() - datetime.timedelta(days=-from_date)
            else:
                logger.debug("Error in Start Date: must be YYYYMMDD or -Ndays")
                raise Exception("Start Date not valid")
    except:
        raise Exception("Start Date not valid")

    # Manage the end_date (mandatory).
    try:
        if functions.is_date_yyyymmdd(str(to_date), silent=True):
            datetime_end = datetime.datetime.strptime(str(to_date), '%Y%m%d')
        # If it is a negative number, subtract from current date
        elif isinstance(to_date, int) or isinstance(to_date, int):
            if to_date < 0:
                datetime_end = datetime.datetime.today() - datetime.timedelta(days=-to_date)
        else:
            datetime_end = datetime.datetime.today()
    except:
        pass

    try:
        dates = frequency.get_dates(datetime_start, datetime_end)
    except Exception as inst:
        logger.debug("Error in frequency.get_dates: %s" % inst.args[0])
        raise

    try:
        if sys.platform == 'win32':
            template.replace("-", "#")

        # return lst
        list_input_files =  cds_api.create_list_cds(dates, template, base_url, resourcename_uuid)

    except Exception as inst:
        logger.debug("Error in frequency.get_internet_dates: %s" % inst.args[0])
        raise

    return list_input_files

######################################################################################
#   get_file_from_url
#   Purpose: download and save locally a file
#   Author: Marco Clerici, JRC, European Commission
#   Date: 2014/09/01
#   Inputs: remote_url_file: full file path
#           target_file: target file name (by default 'test_output_file')
#           target_dir: target directory (by default a tmp dir is created)
#   Output: full pathname is returned (or positive number for error)
#
def get_file_from_url(remote_url_file, target_dir, target_file=None, userpwd='', https_params=''):
    # Create a tmp directory for download
    tmpdir = tempfile.mkdtemp(prefix=__name__, dir=es_constants.es2globals['base_tmp_dir'])

    if target_file is None:
        target_file = 'test_output_file'

    target_fullpath = tmpdir + os.sep + target_file
    target_final = target_dir + os.sep + target_file

    c = pycurl.Curl()

    try:
        outputfile = open(target_fullpath, 'wb')
        logger.debug('Output File: ' + target_fullpath)
        remote_url_file = remote_url_file.replace('\\', '')  # Pierluigi
        c.setopt(c.URL, remote_url_file)
        c.setopt(c.WRITEFUNCTION, outputfile.write)
        if remote_url_file.startswith('https'):
            c.setopt(c.CAINFO, certifi.where())  # Pierluigi
            if https_params is not '':
                # headers = 'Authorization: Bearer ACB5F378-5483-11E9-849E-54E83FFDBADB'
                c.setopt(pycurl.HTTPHEADER, [https_params])
        if userpwd is not ':':
            c.setopt(c.USERPWD, userpwd)
        c.perform()
        # Check the result (filter server/client errors http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
        if c.getinfo(pycurl.HTTP_CODE) >= 400:
            outputfile.close()
            os.remove(target_fullpath)
            raise Exception('HTTP Error in downloading the file: %i' % c.getinfo(pycurl.HTTP_CODE))
        # See ES2-67
        elif c.getinfo(pycurl.HTTP_CODE) == 301:
            outputfile.close()
            os.remove(target_fullpath)
            raise Exception('File moved permanently: %i' % c.getinfo(pycurl.HTTP_CODE))
        else:
            outputfile.close()
            shutil.move(target_fullpath, target_final)
            return 0
    except:
        logger.warning('Output NOT downloaded: %s - error : %i' % (remote_url_file, c.getinfo(pycurl.HTTP_CODE)))
        return 1
    finally:
        c = None
        shutil.rmtree(tmpdir)


######################################################################################
#   loop_get_cds_iri
#   Purpose: drive the get_cds as a service
#   Author: VIJAY CHARAN, JRC, European Commission
#   Date: 2021/03/24
#   Inputs: none
#   Arguments: dry_run -> if set, read tables and report activity ONLY
def loop_get_cds_iri(dry_run=False, test_one_source=False, my_source=None):
    global processed_list_filename, processed_list
    global processed_info_filename, processed_info

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGILL, signal_handler)

    logger.info("Starting retrieving data from INTERNET.")

    b_loop = True  # to exit loops in testing mode
    b_error = False  # checking files download - for testing mode

    while b_loop:
        output_dir = es_constants.get_internet_output_dir
        logger.debug("Check if the Ingest Server input directory : %s exists.", output_dir)
        if not os.path.exists(output_dir):
            # ToDo: create output_dir - ingest directory
            logger.fatal("The Ingest Server input directory : %s doesn't exists.", output_dir)
            if test_one_source:
                return 1
            else:
                exit(1)

        if not os.path.exists(es_constants.processed_list_int_dir):
            os.mkdir(es_constants.processed_list_int_dir)

        while b_loop:

            # # Check internet connection (or continue)
            # if not functions.internet_on():  #False: JEodesk- doesnt detect internet connection properly so provide False#
            #     logger.error("The computer is not currently connected to the internet. Wait 1 minute.")
            #     b_error = True
            #     time.sleep(60)
            #
            # else:

            logger.info("Reading active INTERNET data sources from database")
            internet_sources_list = querydb.get_active_internet_sources()

            # Loop over active triggers
            for internet_source in internet_sources_list:
                try:
                    # In case of test_one_source, skip all other sources
                    if test_one_source:
                        if (internet_source.internet_id != test_one_source):
                            logger.debug("Running in test mode, and source is not %s. Continue.", test_one_source)
                            continue
                        else:
                            # Overwrite DB definitions with the passed object (if defined - for testing purposes)
                            if my_source:
                                internet_source = my_source

                    execute_trigger = True
                    # Get this from the pads database table (move from internet_source 'pull_frequency' to the pads table,
                    # so that it can be exploited by eumetcast triggers as well). It is in minute
                    pull_frequency = internet_source.pull_frequency

                    # Manage the case of files to be continuously downloaded (delay < 0)
                    if pull_frequency < 0:
                        do_not_consider_processed_list = True
                        delay_time_source_minutes = -pull_frequency
                    else:
                        do_not_consider_processed_list = False
                        delay_time_source_minutes = pull_frequency

                    if sys.platform == 'win32':
                        internet_id = str(internet_source.internet_id).replace(':', '_')
                    else:
                        internet_id = str(internet_source.internet_id)

                    logger_spec = log.my_logger('apps.get_internet.' + internet_id)
                    logger.info("Processing internet source  %s.", internet_source.descriptive_name)

                    # Create objects for list and info
                    processed_info_filename = es_constants.get_internet_processed_list_prefix + str(
                        internet_id) + '.info'

                    # Restore/Create Info
                    processed_info = None
                    processed_info = functions.restore_obj_from_pickle(processed_info, processed_info_filename)
                    if processed_info is not None:
                        # Check the delay
                        current_delta = datetime.datetime.now() - processed_info['time_latest_exec']
                        current_delta_minutes = int(old_div(current_delta.seconds, 60))
                        if current_delta_minutes < delay_time_source_minutes:
                            logger.debug("Still waiting up to %i minute - since latest execution.",
                                         delay_time_source_minutes)
                            execute_trigger = False
                    else:
                        # Create processed_info object
                        processed_info = {'lenght_proc_list': 0,
                                          'time_latest_exec': datetime.datetime.now(),
                                          'time_latest_copy': datetime.datetime.now()}
                        execute_trigger = True

                    if execute_trigger:
                        # Restore/Create List
                        processed_list = []
                        if not do_not_consider_processed_list:
                            processed_list_filename = es_constants.get_internet_processed_list_prefix + internet_id + '.list'
                            # processed_list = functions.restore_obj_from_pickle(processed_list,
                            #                                                    processed_list_filename)

                        processed_info['time_latest_exec'] = datetime.datetime.now()

                        logger.debug("Create current list of file to process for source %s.",
                                     internet_source.internet_id)
                        if internet_source.user_name is None:
                            user_name = "anonymous"
                        else:
                            user_name = internet_source.user_name

                        if internet_source.password is None:
                            password = "anonymous"
                        else:
                            password = internet_source.password

                        usr_pwd = str(user_name) + ':' + str(password)

                        logger_spec.debug("              Url is %s.", internet_source.url)
                        logger_spec.debug("              usr/pwd is %s.", usr_pwd)
                        logger_spec.debug("              regex   is %s.", internet_source.include_files_expression)

                        internet_type = internet_source.type

                        if internet_type == 'cds_api':
                            current_list = cds_api_loop_internet(internet_source)
                        elif internet_type == 'iri_api':
                            current_list = iri_api_loop_internet(internet_source)

                        else:
                            logger.debug("No correct type for this internet source type: %s" % internet_type)
                            current_list = []

                        logger_spec.debug("Number of files currently available for source %s is %i", internet_id,
                                          len(current_list))


                        if not dry_run:
                            # functions.dump_obj_to_pickle(processed_list, processed_list_filename)
                            functions.dump_obj_to_pickle(processed_info, processed_info_filename)

                    # if test_one_source:
                    #     b_loop = False
                    # else:
                    #     sleep(float(user_def_sleep))
                # # Loop over sources
                except Exception as inst:
                    logger.error("Error while processing source %s. Continue" % internet_source.descriptive_name)
                    b_error = True
            sleep(float(user_def_sleep))
    if not test_one_source:
        exit(0)
    else:
        return b_error

def cds_api_loop_internet(internet_source):
    logger_spec = log.my_logger('apps.get_internet.' + internet_source.internet_id)

    if internet_source.user_name is None:
        user_name = "anonymous"
    else:
        user_name = internet_source.user_name

    if internet_source.password is None:
        password = "anonymous"
    else:
        password = internet_source.password

    usr_pwd = str(user_name) + ':' + str(password)

    # Create the full filename from a 'template' which contains
    cds_internet_url = str(internet_source.url)

    #Read the CDS parameters from the file.
    parameter = cds_api.read_cds_parameter_file(internet_source.internet_id)

    if internet_source.productcode is None or internet_source.version is None:
        logger.error("Product is not passed")
        return

    if parameter is not None:
        resourcename_uuid = parameter.get('resourcename_uuid')
        template_paramater = parameter.get('template')
    else:
        resourcename_uuid = internet_source.files_filter_expression
        template_paramater = internet_source.include_files_expression

    ongoing_list = []
    ongoing_list_filename = es_constants.get_internet_processed_list_prefix + str(
        internet_source.internet_id) + '_Ongoing' + '.list'
    ongoing_list = functions.restore_obj_from_pickle(ongoing_list, ongoing_list_filename)

    processed_list = []
    processed_list_filename = es_constants.get_internet_processed_list_prefix + internet_source.internet_id + '.list'
    processed_list = functions.restore_obj_from_pickle(processed_list,
                                                       processed_list_filename)

    try:
        current_list = []
        # Check if template is dict or string them create resources_parameters
        if type(template_paramater) is dict:
            resources_parameters = template_paramater
        else:
            resources_parameters = json.loads(template_paramater)

        if 'period' in resources_parameters:
            current_list = cds_api.build_list_matching_files_cds_period(cds_internet_url, template=template_paramater, resourcename_uuid=resourcename_uuid)
        else:
            # Dates defined are dynamic not based on the configuration file
            current_list = build_list_matching_files_cds(cds_internet_url, template=template_paramater,
                                                         from_date=internet_source.start_date, to_date=internet_source.end_date,
                                                         frequency_id=str(internet_source.frequency_id), resourcename_uuid=resourcename_uuid)

        # Current list and ongoing list in format (Datetime:ResourceID:variable)
        ongoing_list_reduced = cds_api.get_cds_current_list_pattern(ongoing_list)

        # Loop over current list to check if the file is already processed and exist in filesystem
        if len(current_list) > 0:
            listtoprocessrequest = []
            listtoprocessrequest = cds_api.check_processed_list(current_list, processed_list, ongoing_list_reduced, template_paramater)
            # ongoing_list= listtoprocessrequest   #line for test vto be commented
            if listtoprocessrequest != set([]):  # What if error occurs in this loop
                # logger_spec.info("Loop on the List to Process Request files.")
                for filename in list(listtoprocessrequest):  # What if error occurs in this loop
                    logger_spec.info("Creating Job request for Product ID: " + filename)
                    try:
                        # Give request to CDS to process
                        # HTTP request to CDS follow here once the request is success add the request ID to ongoing list
                        current_datetime_str = filename.split(':')[0]
                        current_resource_id = filename.split(':')[1]
                        template_without_date=template_paramater
                        template = cds_api.build_cds_date_template(current_datetime_str, template_without_date)
                        created_ongoing_request_id = cds_api.create_cds_job(internet_source, usr_pwd, template, resourcename_uuid)

                        if created_ongoing_request_id is not None:
                            ongoing_list.append(filename+":"+created_ongoing_request_id)
                            functions.dump_obj_to_pickle(ongoing_list, ongoing_list_filename)
                    except:
                        logger_spec.warning(
                            "Problem while creating Job request to JEODPP: %s.", filename)
                        b_error = True
        # functions.dump_obj_to_pickle(ongoing_list, ongoing_list_filename)
        if len(ongoing_list) > 0:
            logger_spec.info("Loop over the downloadable list files.")
            # Current list and ongoing list in format (Datetime:ResourceID:variable)
            # ongoing_list_reduced = cds_api.get_cds_current_list_pattern(ongoing_list)
            # Make the ongoing_product_list unique to loop over
            #ongoing_list_reduced = functions.conv_list_2_unique_value(ongoing_list_reduced)
            # ongoing_job_list = jeodpp_api.get_job_id_from_list(ongoing_list)
            listtodownload = []
            for ongoing in ongoing_list:
                ongoing_request_id = ongoing.split(':')[-1]
                job_status = cds_api.get_task_status(internet_source.url, ongoing_request_id, usr_pwd)
                if job_status == 'completed':
                    logger_spec.info("Downloading Product: " + str(ongoing))
                    try:
                        download_url = cds_api.get_job_download_url(internet_source.url, ongoing_request_id, usr_pwd)
                        if download_url is False:
                            logger_spec.warning("Problem in getting download Url : %s.", str(ongoing))
                            continue
                        target_path = cds_api.get_cds_target_path(es_constants.ingest_dir, ongoing,
                                                                  template_paramater)
                        download_result = cds_api.get_file(download_url, usr_pwd, None, target_path)
                        if download_result:
                            logger_spec.info("Download Success for : " + str(ongoing))

                            processed_item = cds_api.get_cds_current_Item_pattern(ongoing)
                            logger_spec.info("Ingesting : " + str(ongoing))
                            status = cds_api.ingest_netcdf_cds(internet_source, target_path, processed_item)
                            processed_list.append(processed_item)  # Add the processed list only with datetime, resourceid_product_type and variable
                            functions.dump_obj_to_pickle(processed_list, processed_list_filename)
                            ongoing_list.remove(ongoing)
                            functions.dump_obj_to_pickle(ongoing_list, ongoing_list_filename)
                            deleted = cds_api.delete_cds_task(internet_source.url, ongoing_request_id, usr_pwd, internet_source.https_params)
                            if not deleted:  # To manage the delete store the job id in the  delete list and remove the job
                                logger_spec.warning("Problem while deleting Product job id: %s.", str(ongoing))
                        else:
                            #Check why download link is not available eventhough the job is completed
                            logger_spec.warning("Download link is not available: %s.", str(ongoing))
                    except:
                        logger_spec.warning("Problem while Downloading Product: %s.", str(ongoing))
                        b_error = True
                elif job_status == 'failed':
                    # Check if the request failed and remove the job
                    # Check if the created request is failed then remove the job(task)
                    logger_spec.warning("Problem with created job so deleteing it: %s.", str(ongoing))
                    deleted = cds_api.delete_cds_task(internet_source.url, ongoing_request_id, usr_pwd, internet_source.https_params)
                    if not deleted:  # To manage the delete store the job id in the  delete list and remove the job
                        logger_spec.warning("Problem while deleting Product job id: %s.", str(ongoing))
                    else:
                        ongoing_list.remove(ongoing)
                        functions.dump_obj_to_pickle(ongoing_list, ongoing_list_filename)
        functions.dump_obj_to_pickle(ongoing_list, ongoing_list_filename)
        functions.dump_obj_to_pickle(processed_list, processed_list_filename)

    except:
        logger.error("Error in CDS service. Continue")
        b_error = True

    finally:
        logger.info("CDS service completed")
        current_list = []
        return current_list

def iri_api_loop_internet(internet_source):

    logger_spec = log.my_logger('apps.get_internet.' + internet_source.internet_id)

    if internet_source.user_name is None:
        user_name = "anonymous"
    else:
        user_name = internet_source.user_name

    if internet_source.password is None:
        password = "anonymous"
    else:
        password = internet_source.password

    usr_pwd = str(user_name) + ':' + str(password)

    # Create the full filename from a 'template' which contains
    internet_url = str(internet_source.url)

    # processed_list = []
    # processed_list_filename = es_constants.get_internet_processed_list_prefix + internet_source.internet_id + '.list'
    # processed_list = functions.restore_obj_from_pickle(processed_list,
    # processed_list_filename)
    try:
        # Check if template is dict or string them create resources_parameters
        # if type(template_paramater) is dict:
        # resources_parameters = template_paramater
        # else:
        # resources_parameters = json.loads(template_paramater)
        if internet_source.productcode is None or internet_source.version is None:
            logger.error("Product is not passed")
            return

        product = {"productcode": internet_source.productcode,
        "version": internet_source.version}

        # Datasource description
        datasource_descr = querydb.get_datasource_descr(source_type='INTERNET', source_id=internet_source.internet_id)
        datasource_descr = datasource_descr[0]
        # Get list of subproducts

        subproducts = ingestion.get_subrproducts_from_ingestion(product, datasource_descr.datasource_descr_id)
        dates = build_list_dates_generic(from_date=internet_source.start_date, to_date=internet_source.end_date, frequency_id=str(internet_source.frequency_id))
        # Dates defined are dynamic not based on the configuration file
        iri_api.process_list_matching_url(datasource_descr, product, subproducts, dates)

        # functions.dump_obj_to_pickle(processed_list, processed_list_filename)

    except:
        logger.error("Error in IRI service. Continue")
        b_error = True

    finally:
        logger.info("IRI service Ending")
        current_list = []
        return current_list



def build_list_dates_generic(from_date, to_date, frequency_id):
    # Add a check on frequency
    try:
        frequency = datasets.Dataset.get_frequency(frequency_id, datasets.Frequency.DATEFORMAT.DATETIME)
    except Exception as inst:
        logger.debug("Error in datasets.Dataset.get_frequency: %s" % inst.args[0])
        raise

    # Manage the start_date (mandatory).
    try:
        # If it is a date, convert to datetime
        if functions.is_date_yyyymmdd(str(from_date), silent=True):
            datetime_start = datetime.datetime.strptime(str(from_date), '%Y%m%d')
        else:
            # If it is a negative number, subtract from current date
            if isinstance(from_date, int) or isinstance(from_date, int):
                if from_date < 0:
                    datetime_start = datetime.datetime.today() - datetime.timedelta(days=-from_date)
            else:
                logger.debug("Error in Start Date: must be YYYYMMDD or -Ndays")
                raise Exception("Start Date not valid")
    except:
        raise Exception("Start Date not valid")

    # Manage the end_date (mandatory).
    try:
        if functions.is_date_yyyymmdd(str(to_date), silent=True):
            datetime_end = datetime.datetime.strptime(str(to_date), '%Y%m%d')
        # If it is a negative number, subtract from current date
        elif isinstance(to_date, int) or isinstance(to_date, int):
            if to_date < 0:
                datetime_end = datetime.datetime.today() - datetime.timedelta(days=-to_date)
            elif to_date > 0:
                datetime_end = datetime.datetime.today() + datetime.timedelta(days=to_date)
        else:
            datetime_end = datetime.datetime.today()
    except:
        pass

    try:
        dates = frequency.get_dates(datetime_start, datetime_end)
    except Exception as inst:
        logger.debug("Error in frequency.get_dates: %s" % inst.args[0])
        raise

    return dates