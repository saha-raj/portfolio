import xarray as xr
import glob
import os
import pandas as pd
import numpy as np

# Get list of all grib files in directory
data_dir = "_python/_data/seaice_monthly"
grib_files = glob.glob(os.path.join(data_dir, "*.grib"))

results = []
for file in sorted(grib_files):
    # Read grib file
    ds = xr.open_dataset(file, engine='cfgrib')
    
    # Get the sea ice variable (it's actually named 'siconc' in the loaded dataset)
    ice_var = ds['siconc']
    
    # Calculate grid cell areas (in m²)
    lat = ds.latitude.values    # Note: it's 'latitude' not 'lat'
    lon = ds.longitude.values   # Note: it's 'longitude' not 'lon'
    R = 6367470.0  # Earth radius in meters (from file metadata)
    
    # Create meshgrid of lats and lons
    lon_grid, lat_grid = np.meshgrid(lon, lat)
    
    # Calculate cell areas
    dlat = np.abs(lat[1] - lat[0]) * np.pi/180
    dlon = np.abs(lon[1] - lon[0]) * np.pi/180
    cell_areas = R**2 * np.cos(lat_grid * np.pi/180) * dlat * dlon
    
    # Calculate total sea ice area (multiply concentration by cell area and sum)
    ice_area = (ice_var * cell_areas).sum().values / 1e6  # Convert to km²
    
    # Extract date from filename
    filename = os.path.basename(file)
    print(f"Processing file: {filename}")
    
    # For filename "1month_mean_Global_ea_ci_200001_v02.grib"
    year_month = filename.split('_')[5]   # Gets '200001'
    year = int(year_month[:4])            # Gets '2000'
    month = int(year_month[4:6])          # Gets '01'
    
    results.append({
        'date': pd.to_datetime(f"{year}-{month:02d}-01"),
        'ice_area_km2': float(ice_area)
    })

# Create dataframe and sort by date
df = pd.DataFrame(results)
df = df.sort_values('date')

# Save to CSV
output_file = "_python/_output/analysis_seaice_cover.csv"
df.to_csv(output_file, index=False)
print(f"Saved sea ice areas to: {output_file}")