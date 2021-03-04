from src.apps.productmanagement.products import Product
from src.lib.python import functions
import datetime
import os


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
    dataset.get_filenames()

    if date_format == 'YYYYMMDD':
        # Loop over dates
        for date in dataset._frequency.get_dates(start_date, end_date):
            if (date >= start_date) and (date <= end_date):
                filedate = date.strftime("%Y%m%d")
                productfilename = functions.set_path_filename(filedate, productcode, subproductcode, mapsetcode, version, '.tif')
                productfilepath = dataset.fullpath + productfilename
                dates_list.append(date)
                if os.path.isfile(productfilepath):
                    list_files.append(productfilepath)
                    # dates_list.append(date)
                else:
                    list_files.append('')

    if date_format == 'MMDD':
        # Extract MMDD
        mmdd_start = start_date.month*100+start_date.day
        mmdd_end = end_date.month*100+end_date.day

        # Case 1: same year
        if start_date.year == end_date.year:
            for mmdd in dataset.get_mmdd():
                if mmdd_start <= int(mmdd) <= mmdd_end:
                    # mmdd contains the list of existing 'mmdd' - sorted
                    productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, '.tif')
                    productfilepath = dataset.fullpath + productfilename
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
                    productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, '.tif')
                    productfilepath = dataset.fullpath + productfilename
                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(start_date.year, int(mmdd[:2]), int(mmdd[2:4])))

            # Fill the list with 'full' years
            for n_years in range(end_date.year-start_date.year-1):
                for mmdd in list_mmdd:
                    productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, '.tif')
                    productfilepath = dataset.fullpath + productfilename
                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(start_date.year+1+n_years, int(mmdd[:2]), int(mmdd[2:4])))

            # Put all dates from begin of the year to end_mmdd
            for mmdd in list_mmdd:
                if int(mmdd) <= mmdd_end:
                    # mmdd contains the list of existing 'mmdd' - sorted
                    productfilename = functions.set_path_filename(mmdd, productcode, subproductcode, mapsetcode, version, '.tif')
                    productfilepath = dataset.fullpath + productfilename
                    list_files.append(productfilepath)
                    dates_list.append(datetime.date(end_date.year, int(mmdd[:2]), int(mmdd[2:4])))

            # logger.info(list_files)

    return [list_files, dates_list]
