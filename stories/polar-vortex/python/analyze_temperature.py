import xarray as xr
import glob
import os
import pandas as pd
import numpy as np

# Define the region of interest (example: Arctic Circle)
lat_min = 66.5  # Arctic Circle
lat_max = 90.0
lon_min = -180.0
lon_max = 180.0

# Get list of all grib files in directory
data_dir = "_python/_data/temp_monthly_anom"
grib_files = glob.glob(os.path.join(data_dir, "*.grib"))

results = []
for file in sorted(grib_files):
    # Read grib file
    ds = xr.open_dataset(file, engine='cfgrib')
    # print("Dataset structure:")
    # print(ds)
    
    # Get the temperature variable (it's 't2m' for 2m temperature)
    temp_var = ds['t2m']
    
    # Select the region of interest
    mask = (ds.latitude >= lat_min) & (ds.latitude <= lat_max) & \
           (ds.longitude >= lon_min) & (ds.longitude <= lon_max)
    
    # Calculate grid cell areas (in m²) for weighted average
    lat = ds.latitude.values
    lon = ds.longitude.values
    R = 6367470.0  # Earth radius in meters
    
    # Create meshgrid of lats and lons
    lon_grid, lat_grid = np.meshgrid(lon, lat)
    
    # Calculate cell areas
    dlat = np.abs(lat[1] - lat[0]) * np.pi/180
    dlon = np.abs(lon[1] - lon[0]) * np.pi/180
    cell_areas = R**2 * np.cos(lat_grid * np.pi/180) * dlat * dlon
    
    # Create DataArray with proper dimensions
    cell_areas = xr.DataArray(cell_areas, dims=['latitude', 'longitude'], 
                            coords={'latitude': lat, 'longitude': lon})
    
    # Calculate weighted average temperature for the region
    masked_temp = temp_var.where(mask, drop=True)
    masked_areas = cell_areas.where(mask, drop=True)
    avg_temp = (masked_temp * masked_areas).sum() / masked_areas.sum()
    
    # Extract date from filename
    filename = os.path.basename(file)
    year_month = filename.split('_')[5]
    year = int(year_month[:4])
    month = int(year_month[4:6])
    
    results.append({
        'date': pd.to_datetime(f"{year}-{month:02d}-01"),
        'avg_temp_k': float(avg_temp),
        'avg_temp_c': float(avg_temp) - 273.15  # Convert Kelvin to Celsius
    })

# Create dataframe and sort by date
df = pd.DataFrame(results)
df = df.sort_values('date')

# Save to CSV
output_file = f"_python/_output/analysis_temperature_{lat_min}N-{lat_max}N.csv"
df.to_csv(output_file, index=False)
print(f"Saved regional temperature averages to: {output_file}")
