import xarray as xr
import glob
import os
import json
import numpy as np

def downsample_grid(data, lat, lon, factor):
    """Downsample the grid by taking means of factor x factor cells"""
    return data[::factor, ::factor], lat[::factor], lon[::factor]

def create_geojson(data, lats, lons, date_str):
    features = []
    for i in range(len(lats)):
        for j in range(len(lons)):
            if not np.isnan(data[i,j]):
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(lons[j]), float(lats[i])]
                    },
                    "properties": {
                        "concentration": float(data[i,j])
                    }
                })
    
    return {
        "type": "FeatureCollection",
        "date": date_str,
        "features": features
    }

# Set resolution factor (e.g., 4 means take every 4th point)
resolution_factor = 4

for file in sorted(glob.glob("_python/_data/seaice_monthly/*200*.grib")):
    ds = xr.open_dataset(file, engine='cfgrib')
    
    # Get date info from filename
    filename = os.path.basename(file)
    year_month = filename.split('_')[5]
    date_str = f"{year_month[:4]}-{year_month[4:6]}"
    
    # Downsample the grid
    ice_data, lats, lons = downsample_grid(
        ds['siconc'].values,
        ds.latitude.values,
        ds.longitude.values,
        resolution_factor
    )
    
    # Create GeoJSON
    geojson = create_geojson(ice_data, lats, lons, date_str)
    
    # Save to file
    output_file = f"data/seaice_geojson/{date_str}.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(geojson, f)