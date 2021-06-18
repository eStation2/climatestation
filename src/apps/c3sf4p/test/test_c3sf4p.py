import unittest
from src.apps.c3sf4p.c3s_f4p import Fitness4Purpose
# from apps.productmanagement.datasets import Dataset
from apps.productmanagement.products import Product
import datetime


class TestC3S(unittest.TestCase):

    def run_test(self, filelist, band_name):
        self.lof = filelist
        self.band = band_name
        self.f4p = Fitness4Purpose(self.lof, self.band)

    def test_hovmuller(self):
        productcode = 'chirps-dekad'
        version = '2.0'
        subproductcode = '10d'
        mapsetcode = 'CHIRP-Africa-5km'
        from_date = '20000101'
        to_date = '20210101'
        from_date = datetime.date(2000, 1, 1)
        to_date = datetime.date(2021, 1, 1)

        p = Product(product_code=productcode, version=version)
        dataset = p.get_dataset(mapset=mapsetcode, sub_product_code=subproductcode, from_date=from_date, to_date=to_date)
        dataset_filenames = dataset.get_filenames_range()

        self.lof = [dataset_filenames]
        self.bands = [None] * len(self.lof)
        self.f4p = Fitness4Purpose(self.lof, self.bands)
        howmuller = self.f4p.latitudinal_average_plot()
        self.assertEqual(1, 1)

