#
#	purpose: To implement IRI API in climate station
#	author:  Vijay Charan
#	date:	 02.2021
#   descr:


import requests
import json
import os
import pycurl
import certifi
import base64
import tempfile
import shutil
import urllib
from lib.python import es_logging as log
from lib.python import functions
from apps.acquisition import ingestion_netcdf
from io import BytesIO
logger = log.my_logger(__name__)
from datetime import datetime
from config import es_constants

iri_config_dir = '/data/static_data/config_iri/'

######################################################################################
#   Purpose: Download file and send the response
#   Author: Vijay Charan, JRC, European Commission
#   Date: 2020/03/04
#   Inputs: download_url: download url
#           usr_pwd: User and password separated by ":" (eg user:password)
#           https_params: Additional Http parameters
#           target_path: Target path to download
#   Output: Success result
#   Output type: Boolean
def get_file(download_url, target_path, usr_pwd=':', https_params=''):

    response = get_cds_file_from_url(download_url, target_fullpath=target_path, userpwd=usr_pwd, https_params=https_params)
    return response

######################################################################################
#   Purpose: http post request specific to CDS
#   Author: Vijay Charan, JRC, European Commission
#   Date: 2020/03/04
#   Inputs: remote_url_file: remote url
#           usr_pwd: User and password separated by ":" (eg user:password)
#           https_params: Additional Http parameters
#           data: Data to pass
#   Output: Success if http code is 202
#   Output type: dict or boolean
def http_post_request_cds(remote_url_file, userpwd='', https_params='', data=None):
    try:

        remote_url_file = remote_url_file.replace('\\','') #Pierluigi

        if userpwd is not None:
            https_params = "Basic "+base64.b64encode(userpwd)

        # Adding empty header as parameters are being sent in payload
        headers = {
            "Content-Type": "application/json",
            "Authorization": str(https_params) #"Basic dmVua2F2aTpORVZaOW4zWERIU1hrRHpv"
        }
        # data={'format': 'netcdf', 'variable': ['lake_mix_layer_temperature', 'skin_temperature',  ], 'year': [ '2018', '2019',],  'day': '01', 'time': '00:00'}
        r = requests.post(url=remote_url_file, headers=headers, data=json.dumps(data) )
        # print(r.content)

        # Check the result (filter server/client errors http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
        if r.status_code >= 400:
            raise Exception('HTTP Error in downloading the file: %i' %r.status_code)
        # See ES2-67
        elif r.status_code == 301:
            raise Exception('File moved permanently: %i' % r.status_code)
        # elif r.status_code == 202:
        #     return True
        else:
            list_dict = json.loads(r.content)
            return list_dict
    except:
        logger.error('Error in HTTP POST Request of CDS: %s - error : %i' %(remote_url_file,r.status_code))
        return 1
    finally:
        r = None

######################################################################################
#   Purpose: http request specific to CDS Pycurl
#   Author: Vijay Charan, JRC, European Commission
#   Date: 2020/03/04
#   Inputs: remote_url_file: remote url
#           usr_pwd: User and password separated by ":" (eg user:password)
#           https_params: Additional Http parameters
#   Output: depending on the request
#   Output type: dict
def http_request_cds(remote_url_file, userpwd='', https_params='', post=False, delete=False, put=False):
    c = pycurl.Curl()

    try:
        data = BytesIO()
        remote_url_file = remote_url_file.replace('\\','') #Pierluigi

        c.setopt(c.URL,str(remote_url_file))
        c.setopt(c.WRITEFUNCTION,data.write)

        if post:
            c.setopt(pycurl.POST, 1)
        if delete:
            c.setopt(pycurl.CUSTOMREQUEST, "DELETE")
        if put:
            c.setopt(pycurl.CUSTOMREQUEST, "PUT")

        if userpwd is not None:
            c.setopt(c.USERPWD,userpwd)
            https_params = "Authorization: Basic "+base64.b64encode(userpwd)
        if remote_url_file.startswith('https'):
            c.setopt(c.CAINFO, certifi.where()) #Pierluigi
            if https_params is not None:
            #headers = 'Authorization: Bearer ACB5F378-5483-11E9-849E-54E83FFDBADB'
                c.setopt(pycurl.HTTPHEADER, [https_params])
        c.perform()

        # Check the result (filter server/client errors http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
        if c.getinfo(pycurl.HTTP_CODE) >= 400:

            raise Exception('HTTP Error in downloading the file: %i' % c.getinfo(pycurl.HTTP_CODE))
        # See ES2-67
        elif c.getinfo(pycurl.HTTP_CODE) == 301:

            raise Exception('File moved permanently: %i' % c.getinfo(pycurl.HTTP_CODE))
        else:
            list_dict = json.loads(data.getvalue())
            return list_dict
    except:
        logger.error('Error in HTTP Request of CDS API: %s - error : %i' %(remote_url_file,c.getinfo(pycurl.HTTP_CODE)))
        return 1
    finally:
        c = None

######################################################################################
#   Purpose: Get cds file from the url passed
#   Author: Vijay Charan, JRC, European Commission
#   Date: 2020/03/04
#   Inputs: remote_url_file: remote url
#           usr_pwd: User and password separated by ":" (eg user:password)
#           https_params: Additional Http parameters
#           target_fullpath: Target full path
#   Output:
#   Output type: Boolean
def get_cds_file_from_url(remote_url_file, target_fullpath, userpwd='', https_params=''):
    c = pycurl.Curl()
    try:
        outputfile = open(target_fullpath, 'wb')
        logger.debug('Output File: ' + target_fullpath)
        remote_url_file = remote_url_file.replace('\\', '')  # Pierluigi
        c.setopt(c.URL, str(remote_url_file))
        c.setopt(c.WRITEFUNCTION, outputfile.write)
        if userpwd is not ':':
            c.setopt(c.USERPWD,userpwd)
            https_params = "Authorization: Basic "+base64.b64encode(userpwd)
        if remote_url_file.startswith('https'):
            c.setopt(c.CAINFO, certifi.where())  # Pierluigi
            if https_params is not '':
                # headers = 'Authorization: Bearer ACB5F378-5483-11E9-849E-54E83FFDBADB'
                c.setopt(pycurl.HTTPHEADER, [https_params])
        # if userpwd is not ':':
        #     c.setopt(c.USERPWD, userpwd)
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
            # listtozip.append(target_fullpath)
            # shutil.move(target_fullpath, target_final)
            return True
    except:
        logger.error('Output NOT downloaded: %s - error : %i' % (remote_url_file, c.getinfo(pycurl.HTTP_CODE)))
        return False
    finally:
        c = None

######################################################################################
#   Purpose: http Delete request specific to CDS
#   Author: Vijay Charan, JRC, European Commission
#   Date: 2020/03/04
#   Inputs: remote_url_file: remote url
#           usr_pwd: User and password separated by ":" (eg user:password)
#           https_params: Additional Http parameters
#           data: Data to pass
#   Output: Success if http code is 204
#   Output type:  boolean
def http_delete_request_cds(remote_url_file, userpwd='', https_params=''):

    try:

        remote_url_file = remote_url_file.replace('\\','') #Pierluigi

        if userpwd is not ':':
            https_params = "Basic "+base64.b64encode(userpwd)

        # Adding empty header as parameters are being sent in payload
        headers = {
            "Content-Type": "application/json",
            "Authorization": str(https_params) #"Basic dmVua2F2aTpORVZaOW4zWERIU1hrRHpv"
        }

        r = requests.delete(url=remote_url_file, headers=headers )
        # Check the result (filter server/client errors http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
        if r.status_code >= 400:
            raise Exception('HTTP Error in downloading the file: %i' %r.status_code)
        # See ES2-67
        elif r.status_code == 301:
            raise Exception('File moved permanently: %i' % r.status_code)
        elif r.status_code == 204:
            return True
        else:
            # list_dict = json.loads(r.content)
            logger.error('Task deletion : %s - error : %i' % (remote_url_file, r.status_code))
    except:
        logger.error('Error in HTTP DELETE Request of CDS: %s - error : %i' %(remote_url_file,r.status_code))
        return 1
    finally:
        r = None

##############################
####### IRI WRAPPER ##########
##############################

#Currently current list is checked with ongoing and processed list
# TODO Check the list also in the file system
def check_processed_list(current_file, processed_list):
    process_file = False
    if len(processed_list) == 0:
        process_file = True
    else:
        if current_file not in processed_list:
            process_file = True

    return process_file

#####################################################################################
#   read the config file extract the parameters
#   Purpose: return the list of lines of the parameter from IRIDL
#   Author: VIJAY CHARAN VENKATACHALAM, JRC, European Commission
#   Date: 2021/02
def read_parameter_file(internet_id):
    #Read the CDS parameters from the file.
    try:
        parameter_file = iri_config_dir +internet_id.replace(":", "_")+'.txt'
        with open(parameter_file) as txt_file:
            lines = txt_file.readlines()
    except:
        logger.error('Error in loading the IRI parameters from the file: %s ' %(parameter_file))
    return lines

#####################################################################################
#   Read the IRI parameters from the file and build http url
#   Purpose: return the list of lines of the parameter from IRIDL
#   Author: VIJAY CHARAN VENKATACHALAM, JRC, European Commission
#   Date: 2021/02
def build_parameter_http(parameters_file):
    #Read the IRI parameters from the file and build http url
    url = ''
    try:
        for line in parameters_file:
            if line.startswith('T') or line.startswith(' T') or line.startswith('  T') or line.startswith('   T'):
                print(str(line))
                # url += manage_IRI_time(line)+'/'
                continue
            listofwords = line.split()
            for word in listofwords:
                url += word+'/'
    except:
        logger.error('Error in building IRIDL parameters http url')
        return None
    return url

def process_list_matching_url(datasource_descr, product, subproducts, dates):
    #Read the IRI parameters from the file and build http url
    # Read the CDS parameters from the file.
    tmpdir = tempfile.mkdtemp(prefix=__name__, suffix='_' + datasource_descr.datasource_descr_id,
                              dir=es_constants.base_tmp_dir)
    parameter = read_parameter_file(datasource_descr.datasource_descr_id)
    internet_url = datasource_descr.url
    # try:
    parameter_url = build_parameter_http(parameter)
    processed_list = []
    processed_list_filename = es_constants.get_datastore_processed_list_prefix + datasource_descr.datasource_descr_id.replace(":", "_") + '.list'
    processed_list = functions.restore_obj_from_json(processed_list,
                                                       processed_list_filename)
    for date in dates:
        # iri_month = date.strftime("%b")
        # iri_year = date.strftime("%Y")
        time_url = manage_IRI_time(date, datasource_descr.frequency_id)
        #Check if the file is already processed
        if not check_processed_list(parameter_url+time_url, processed_list):
            continue
        # import urllib   #python 3 urllib.parse.quote(query)
        # Manage dates depending on the datasource type TODO
        in_date = date.strftime("%Y%m%d")
        downloaded_file =tmpdir+'/'+in_date+'_'+product['productcode']+'.nc'
        # downloaded_file =
        file_downloaded = get_file(download_url=internet_url+parameter_url+urllib.parse.quote(time_url)+'/data.nc', target_path=downloaded_file)
        if not file_downloaded:
            logger.error('Error in downloading the file')
            continue
        # Move the file to cs folder
        # ingestion_status = ingestion_iri(datasource_descr, product, subproducts[0], in_date, downloaded_file, logger)

        ingestion_status = ingestion_netcdf.ingestion_netcdf(downloaded_file, in_date, product, subproducts, datasource_descr, logger)
        processed_list.append(parameter_url+time_url)
        functions.dump_obj_to_json(processed_list, processed_list_filename)
    shutil.rmtree(tmpdir)
    # except:
    #     logger.error('Error in processing IRIDL URL')
    #     # os.removedirs(tmpdir)
    #     # return processed_list
    # finally:
    #     os.removedirs(tmpdir)
    # return processed_list

# def manage_IRI_time(time_line):
#     listofwords = time_line.split()
#     string_T = listofwords[0]
#     string_Range = listofwords[-1]
#     string_middle_date= listofwords[1:-1]
#     url = string_T + '/' + str(listofwords[1]) + ' ' + str(listofwords[2]) + '/' + str(listofwords[3]) + ' ' + str(listofwords[4]) + '/' + string_Range
#     # url = string_T+'/'+str(listofwords[1])+' '+str(listofwords[2]) +' '+str(listofwords[3])+' '+str(listofwords[4])+ string_Range
#     return url

def manage_IRI_time(date, frequency_id):
    iri_month = date.strftime("%b")
    iri_year = date.strftime("%Y")
    iri_day = date.strftime("%d")
    if frequency_id == 'e1month':
        iri_month_1 = iri_month
        iri_month_2 = iri_month
        url = 'T/(' + str(iri_month_1) + ' ' + str(iri_year) + ')/(' + str(iri_month_2) + ' ' + str(
            iri_year) + ')/RANGE'
    elif frequency_id == 'e1year':
        next_date = date.date().replace(month=12, day=31)
        iri_month_1 = iri_month
        iri_month_2 = next_date.strftime("%b")
        url = 'T/(' + str(iri_month_1) + ' ' + str(iri_year) + ')/(' + str(iri_month_2) + ' ' + str(
            iri_year) + ')/RANGE'
    elif frequency_id == 'e1day':
        # date += datetime.timedelta(days=1)
        iri_month_1 = iri_month
        iri_month_2 = iri_month
        url = 'T/(' + str(iri_day) + ' '+ str(iri_month_1) + ' ' + str(iri_year) + ')/(' + str(iri_day) + ' '+ str(iri_month_2) + ' ' + str(
            iri_year) + ')/RANGE'
    # url = 'T/(' + str(iri_month_1) + ' ' + str(iri_year) + ')/(' + str(iri_month_2) + ' ' + str(iri_year) + ')/RANGE'
    # url = string_T+'/'+str(listofwords[1])+' '+str(listofwords[2]) +' '+str(listofwords[3])+' '+str(listofwords[4])+ string_Range
    return url
#
# def get_output_path_filename(datasource_descr, product, subproduct, in_date):
#     try:
#         from apps.acquisition import ingestion_ingest_file
#         # target mapset
#         mapset_id = subproduct['mapsetcode']
#         subproductcode = subproduct['subproduct']
#         # Get information from 'product' table
#         product_out_info = ingestion_ingest_file.get_product_out_info(product, subproductcode, logger)
#
#         out_date_str_final = ingestion_ingest_file.define_output_data_format(datasource_descr, in_date, product_out_info.date_format)
#
#         # Define outputfilename, output directory and make sure it exists
#         output_directory, output_path_filename= ingestion_ingest_file.define_output_dir_filename(product,
#                                                                                                  subproductcode,
#                                                                                                  mapset_id,
#                                                                                                  out_date_str_final,
#                                                                                                  logger, '.nc')
#
#         # Define output filename
#         # output_path_filename = output_directory + functions.set_path_filename(out_date_str_final,
#         #                                                                  product['productcode'],
#         #                                                                  subproductcode,
#         #                                                                  mapset_id,
#         #                                                                  product['version'],
#         #                                                                  '.nc')
#     except:
#         logger.error('Error in processing IRIDL URL')
#
#     return output_path_filename
#
# def ingestion_iri(datasource_descr, product, subproduct, in_date, downloaded_file, logger):
#     ingestion_status = False
#     try:
#         file_extension = '.nc'
#         # Format conversion
#         if False:
#             #Do format conversion
#             logger.info('Doing format conversion for IRIDL')
#             file_extension = '.tif'
#
#         # Georeferencing
#         if False:
#             # Do format conversion
#             logger.info('Doing georeferencing for IRIDL')
#
#         #Rescaling
#         if False:
#             # Do physical rescaling
#             # Apply rescale to data
#             scaled_data = rescale_data(out_data, in_scale_factor, in_offset, product_in_info, product_out_info, out_data_type_numpy, my_logger)
#             logger.info('Doing physical rescaling for IRIDL')
#
#         #Metadata regisration
#         if file_extension == '.nc':
#             #Metadata registration for netcdf
#             logger.info('Doing IRIDL Metadata regisration for netcdf ')
#         elif file_extension == '.tif':
#             #Metadata registration for netcdf
#             logger.info('Doing IRIDL Metadata regisration for netcdf ')
#
#         # Move the file to cs folder
#         output_path_filename = get_output_path_filename(datasource_descr, product, subproduct, in_date)
#         shutil.move(downloaded_file, output_path_filename)
#         if os.path.isfile(output_path_filename):
#             ingestion_status = True
#
#     except:
#         logger.error('Error in ingestion IRIDL')
#
#     return ingestion_status

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
# def build_list_matching_files_cds_period(base_url, template, resourcename_uuid):
#     list_input_files = []
#     try:
#         # if sys.platform == 'win32':
#         #     template.replace("-", "#")
#
#         # return lst
#         # list_input_files = create_list_cds_with_period(template, base_url, resourcename_uuid)
#
#     except Exception as inst:
#         logger.debug("Error in frequency.get_internet_dates: %s" % inst.args[0])
#         raise
#
#     return list_input_files

# parameters_file = read_parameter_file('IRI:NOAA:RFE:MONTH')
# build_parameter_http(parameters_file)