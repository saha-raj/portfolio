import xarray as xr
import argparse

# Set up argument parser
parser = argparse.ArgumentParser(description='Check NetCDF file structure')
parser.add_argument('filename', type=str, help='Path to NetCDF file')
args = parser.parse_args()

# Read the file
print(f"\nReading file: {args.filename}")
ds = xr.open_dataset(args.filename)

# Print basic dataset info
print("\nDataset Overview:")
print(ds.info())

# Select first timestep and pressure level for detailed inspection
data = ds['z'].isel(valid_time=0, pressure_level=0)

print("\nDetailed Data Structure:")
print("Data shape:", data.shape)
print("Longitude shape:", data.longitude.shape)
print("Latitude shape:", data.latitude.shape)

print("\nCoordinate Ranges:")
print("Longitude range:", data.longitude.min().values, "to", data.longitude.max().values)
print("Latitude range:", data.latitude.min().values, "to", data.latitude.max().values)

print("\nDimension Names:")
print(data.dims)

print("\nCoordinate Values:")
print("First few longitude values:", data.longitude.values[:5], "...")
print("First few latitude values:", data.latitude.values[:5], "...")

print("\nData Sample:")
print("Corner value:", data.values[0,0]) 