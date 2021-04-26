import unittest
from src.apps.c3sf4p.c3s_f4p import Fitness4Purpose


class TestC3S(unittest.TestCase):

    def run_test(self, filelist, band_name):
        self.lof = filelist
        self.band = band_name
        self.f4p = Fitness4Purpose(self.lof, self.band)
