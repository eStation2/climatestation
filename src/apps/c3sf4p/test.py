from src.lib.python.image_proc.read_write_raster import RasterDataset


f = '/net/ies-mpd02/cleo05/storage/data/CGLS/L3/PLC/2020/01/GLS_20200100_001M_900S900N1800W1800E_0005D_ALB_PBV-JRC04.nc'

rd = RasterDataset(f)

freq = 'e1dekad'

