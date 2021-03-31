import numpy as np

#   Goal: process the lat/lon (non-equally-spaced) arrays from native file to clip to the target mapset
#
#   Inputs: input_lats -> array of (non-equally-spaced) latitudes   -> expected decreasing (North to South)
#           input_lons -> array of (non-equally-spaced) longitudes  -> expected increasing (West to East)

#           min_lat: target BBox minimum latitude
#           min_lon: target BBox minimum longitude
#           max_lat: target BBox maximum latitude
#           max_lon: target BBox maximum longitude

#   Output: output_lats: array of lats for the 'clipped' zone -> min/max_lat replaces the original vals
#           output_lons: array of lats for the 'clipped' zone -> min/max_lo replaces the original vals
#

def get_indices_lats_lons(input_lats, input_lons, min_lat, min_lon, max_lat, max_lon):

    # Checks on BBox within lat/lon arrays
    if min_lat < np.min(input_lats):
        print('Error')
        return -1
    if max_lat > np.max(input_lats):
        print('Error')
        return -1
    if min_lon < np.min(input_lons):
        print('Error')
        return -1
    if max_lon > np.max(input_lons):
        print('Error')
        return -1

    # Checks on passed values (min<max)

    # Checks on lats/lons arrays direction (and invert if needed)
    b_lat_flip = False
    if input_lats[0] > input_lats[-1]:
        input_lats=np.flip(input_lats)
        b_lat_flip = True

    # Get i_min_lat
    i_min_lat = np.argmin(abs(input_lats-min_lat))
    if input_lats[i_min_lat] > min_lat:
        i_min_lat = i_min_lat-1

    # Get i_max_lat
    i_max_lat = np.argmin(abs(input_lats-max_lat))
    if input_lats[i_max_lat] < max_lat:
        i_max_lat = i_max_lat+1

    # Get i_min_lon
    i_min_lon = np.argmin(abs(input_lons-min_lon))
    if input_lons[i_min_lon] > min_lon:
        i_min_lon = i_min_lon-1

    # Get i_max_lon
    i_max_lon = np.argmin(abs(input_lons-max_lon))
    if input_lons[i_max_lon] < max_lon:
        i_max_lon = i_max_lon+1

    # Subset arrays [+1 to be added for numpy convention of indexing]
    output_lats = input_lats[i_min_lat:i_max_lat+1]
    output_lons = input_lons[i_min_lon:i_max_lon+1]

    print('i_min_lat= ',i_min_lat)
    print('i_max_lat=',i_max_lat)
    print('i_min_lon',i_min_lon)
    print('i_max_lon',i_max_lon)

    # Replace the extreme values
    output_lats[0]=min_lat
    output_lats[-1]=max_lat
    output_lons[0]=min_lon
    output_lons[-1]=max_lon

    if b_lat_flip:
        output_lats=np.flip(output_lats)

    return output_lats, output_lons


input_lons = np.linspace(-180.0,180.0,361)
input_lats = np.linspace(90.0,-90.0,181)

print('input_lons:')
print(input_lons)

min_lat = -87.1
max_lat =  86.5
min_lon = -178.3
max_lon =  178.5

[output_lats, output_lons] = get_indices_lats_lons(input_lats, input_lons, min_lat, min_lon, max_lat, max_lon)

print('input_lats:')
print(input_lats)
print('Latitude range : ',min_lat,max_lat)
print('output_lats:')
print(output_lats)

print('input_lons:')
print(input_lons)
print('Longitude range: ',min_lon,max_lon)
print('output_lons:')
print(output_lons)