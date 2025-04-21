import xarray as xr
import matplotlib.pyplot as plt

# Read the netCDF file
ds = xr.open_dataset('e9abcdf35d292792804450be5e25658b/u_component_of_wind_0_daily-mean.nc')

# Get first timestep of data
u_wind = ds.u.isel(valid_time=0)

# Create plot
fig, ax = plt.subplots(figsize=(12,8))
u_wind.plot.contourf(cmap='RdBu_r')
plt.title('U Wind Component - First Day')
plt.xlabel('Longitude')
plt.ylabel('Latitude') 

# Save plot
plt.savefig('u_wind_day1.png')
plt.close()