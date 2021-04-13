import numpy as np

# Check if longitude is 0 to 360 convention or -180 to 180
def check_longitude_0_360(input_lons):
    long_0_360 = False
    if np.max(input_lons) > 180:
        long_0_360 = True
    return long_0_360

# Align the target bbox to fit in the native location without changing the pixels
def align2_native_geotransform(geotransform):
    aligned_geotransform = geotransform
    aligned_geotransform[0] = aligned_geotransform[0] - (aligned_geotransform[1] / 2)
    aligned_geotransform[3] = aligned_geotransform[3] - (aligned_geotransform[5] / 2)
    return aligned_geotransform

