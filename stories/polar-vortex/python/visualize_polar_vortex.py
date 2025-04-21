import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import numpy as np
import argparse
from datetime import datetime
import pandas as pd

# Set up argument parser
parser = argparse.ArgumentParser(
    description="Visualize polar vortex for a specific date"
)
parser.add_argument("date", type=str, help="Date in YYYY-MM-DD format")
args = parser.parse_args()

# Convert input date to datetime
target_date = datetime.strptime(args.date, '%Y-%m-%d')
year = target_date.year

# Read the correct NetCDF file based on year
print(f"Reading NetCDF file for {year}...")
ds = xr.open_dataset(f"_python/temp_downloads/geop_500mb/data_{year}.nc")

# Find the nearest time step to requested date
time_index = abs(ds.valid_time - np.datetime64(args.date)).argmin()
selected_time = ds.valid_time[time_index]

print(f"\nVisualizing data for: {selected_time.values}")

# Select data for the specified date and remove size-1 dimensions
data = ds["z"].sel(valid_time=selected_time, method="nearest").squeeze()

# Print data range
print(f"\nData range: {data.min().values:.0f} to {data.max().values:.0f}")

# Create figure with polar stereographic projection
fig = plt.figure(figsize=(10, 10))
ax = plt.axes(projection=ccrs.Orthographic(0, 90))

# Create contour levels based on actual data range
vmin = float(data.min())
vmax = float(data.max())
levels = np.linspace(vmin, vmax, 10)  # 20 evenly spaced contours

# Add contours
cf = plt.contourf(
    data.longitude,
    data.latitude,
    data,
    transform=ccrs.PlateCarree(),
    levels=levels,
    cmap="rainbow",
)
cs = plt.contour(
    data.longitude,
    data.latitude,
    data,
    transform=ccrs.PlateCarree(),
    levels=levels,
    colors="black",
    linewidths=0.2,
)
plt.clabel(cs, inline=True, fontsize=8, fmt="%.0f")

# Add jet stream overlay
jet_date = selected_time.values.astype('datetime64[ns]').astype(str)
try:
    jet_file = f"_python/_output/jetstream_traj_{jet_date}.csv"
    print(jet_file)
    jet_data = pd.read_csv(jet_file)
    plt.plot(jet_data['longitude'], jet_data['latitude'], 
             transform=ccrs.PlateCarree(),
             color='white', linewidth=5, 
             label='Polar Jet Stream')
    plt.legend(loc='lower right')
except FileNotFoundError:
    print(f"\nWarning: Jet stream data not found for {jet_date}")

# Add coastlines
ax.coastlines()

# Add colorbar
plt.colorbar(cf, orientation='horizontal', label='Geopotential Height (m²/s²)', pad=0.05)

# Add title with date
plt.title(f"Polar Vortex Structure\n{selected_time.values}")

# Save figure
# output_file = f"_python/_output/polar_vortex_{args.date}.png"
output_file = f"_python/_output/polar_vortex.png"
plt.savefig(output_file)
print(f"\nPlot saved as {output_file}")
