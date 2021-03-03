from osgeo import gdal, osr
import numpy as np
# import sys
from src.lib.python.metadata import SdsMetadata


class ReadGeoTiff:
    def __init__(self, filename, mask_name=None, threshold=None, is_data=True):

        self.filename = filename
        self.gobj = gdal.Open(filename)
        self.is_data = is_data
        self.mask_name = mask_name
        self.threshold = threshold

    def get_data(self):
        data_out = self._get_geotiff()
        if self.mask_name is not None:
            data_out = self.apply_mask(data_out)
        return data_out

    def _get_geotiff_attr(self):
        data_type = 'float'
        scale_factor = None
        fill_value = None
        add_offset = None
        v_min = None
        v_max = None

        if self.is_data:
            data_type = 'uint16'
            scale_factor = 1. / 10000.

        return data_type, fill_value, scale_factor, add_offset, v_min, v_max

    def _get_geotiff(self):

        self.meta = self.gobj.GetMetadata()

        data_type, fv, sf, add_of, vmin, vmax = self._get_geotiff_attr()
        _data = np.array(self.gobj.GetRasterBand(1).ReadAsArray(), dtype=data_type)
        if data_type is not 'float':
            _data = np.array(_data, dtype='float')

        if fv is not None:
            _data[_data == fv] = np.nan
        if sf is not None:
            _data *= sf
        if add_of is not None:
            _data += add_of
        if vmin is not None:
            _data[_data < vmin] = np.nan
        if vmax is not None:
            _data[_data > vmax] = np.nan

        return _data

    def apply_mask(self, d):
        thr = self.threshold
        if thr is None:
            thr = 5
        gobj = gdal.Open(self.mask_name)
        mask = gobj.GetRasterBand(1).ReadAsArray()

        d[mask != thr] = np.nan
        return d

    def get_coordinates(self):
        old_cs = osr.SpatialReference()
        old_cs.ImportFromWkt(self.gobj.GetProjectionRef())
        # create the new coordinate system
        wgs84_wkt = """
            GEOGCS["WGS 84",
            DATUM["WGS_1984",
            SPHEROID["WGS 84",6378137,298.257223563,
            AUTHORITY["EPSG","7030"]],
            AUTHORITY["EPSG","6326"]],
            PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
            UNIT["degree",0.01745329251994328,
            AUTHORITY["EPSG","9122"]],
            AUTHORITY["EPSG","4326"]]"""
        new_cs = osr.SpatialReference()
        new_cs.ImportFromWkt(wgs84_wkt)
        # create a transform object to convert between coordinate systems
        transform = osr.CoordinateTransformation(old_cs, new_cs)

        # get the point to transform, pixel (0,0) in this case
        width = self.gobj.RasterXSize
        height = self.gobj.RasterYSize
        gt = self.gobj.GetGeoTransform()
        x = gt[0] + gt[1] * width
        y = gt[3] + gt[5] * height

        center_x = (gt[0] + x) / 2
        center_y = (gt[3] + y) / 2

        lon_0, lat_0, _ = transform.TransformPoint(center_x, center_y)

        w, n, _ = transform.TransformPoint(gt[0], gt[3])
        e, s, _ = transform.TransformPoint(x, y)

        return [s, n, w, e], [lat_0, lon_0]
