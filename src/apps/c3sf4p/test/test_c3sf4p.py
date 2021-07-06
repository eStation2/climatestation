import unittest
from apps.c3sf4p.c3s_f4p import Fitness4Purpose
# from apps.productmanagement.datasets import Dataset
from apps.productmanagement.products import Product
import datetime


class TestC3S(unittest.TestCase):
    productcode = 'chirps-dekad'
    version = '2.0'
    subproductcode = '10d'
    mapsetcode = 'CHIRP-Africa-5km'

    # productcode = 'vgt-dmp'
    # version = 'V2.0'
    # subproductcode = 'dmp'
    # mapsetcode = 'SPOTV-Africa-1km'

    from_date = datetime.date(2017, 1, 1)
    to_date = datetime.date(2017, 3, 1)

    p = Product(product_code=productcode, version=version)
    dataset = p.get_dataset(mapset=mapsetcode, sub_product_code=subproductcode,
                            from_date=from_date, to_date=to_date)
    dataset_filenames = dataset.get_filenames_range()

    def run_test(self, filelist, band_name):
        self.lof = filelist
        self.band = band_name
        self.f4p = Fitness4Purpose(self.lof, self.band)

    def test_hovmuller(self):
        self.lof = [self.dataset_filenames]
        self.bands = [None]     # * len(self.lof)
        self.f4p = Fitness4Purpose(self.lof, self.bands, ecv=None, region_name=None, region_coordinates=None, dbg=True)
        ts, x_tick_labels, y_tick_labels = self.f4p.latitudinal_average_plot(plotimage=False, timeseries=True)
        self.f4p = Fitness4Purpose(self.lof, self.bands, ecv=None, region_name=None, region_coordinates=None, njobs=1,
                                   dbg=True)
        self.f4p.latitudinal_average_plot()
        self.assertEqual(1, 1)

    def test_scatter(self):
        self.lof = [[self.dataset_filenames[0]], [self.dataset_filenames[1]]]
        self.bands = [None, None]  # * len(self.lof)
        self.f4p = Fitness4Purpose(self.lof, self.bands, ecv=None, region_name=None, region_coordinates=None, dbg=True)
        self.f4p.scatter_plot()
        self.assertEqual(1, 1)

    def test_trend(self):
        self.lof = [self.dataset_filenames]
        self.bands = [None]  # * len(self.lof)
        self.f4p = Fitness4Purpose(self.lof, self.bands, ecv=None, region_name=None, region_coordinates=None, dbg=True)
        self.f4p.trend_analysis(fast=True, num_jobs=1)
        self.assertEqual(1, 1)

    def test_hist_cdf(self):
        self.lof = [[self.dataset_filenames[0]], [self.dataset_filenames[1]]]
        self.bands = [None, None]  # * len(self.lof)
        self.f4p = Fitness4Purpose(self.lof, self.bands, ecv=None, region_name=None, region_coordinates=None, dbg=True)
        self.f4p.histogram_and_cdf(reference=0)
        self.assertEqual(1, 1)
