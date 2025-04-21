import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import numpy as np
from scipy.interpolate import RegularGridInterpolator

def create_interpolators(u, v):
    """Create fast interpolation functions for u and v wind fields"""
    lats = u.latitude.values
    lons = u.longitude.values

    # Create interpolation functions
    u_interp = RegularGridInterpolator((lats, lons), u.values,
                                      bounds_error=False, fill_value=None)
    v_interp = RegularGridInterpolator((lats, lons), v.values,
                                      bounds_error=False, fill_value=None)
    return u_interp, v_interp


def integrate_streamline(u_interp, v_interp, start_point, dt=360, max_steps=8640):
    """
    Integrate a single streamline through the vector field
    Returns array of points along trajectory
    """
    trajectory = [start_point]
    point = start_point.copy()
    
    for step in range(max_steps):
        try:
            # Get interpolated u,v values at current point
            u_val = float(u_interp([point[1], point[0]]))
            v_val = float(v_interp([point[1], point[0]]))
            
            if np.isnan(u_val) or np.isnan(v_val):
                break
                
            # Check if reached equator, 90N, or 180 longitude
            if point[1] <= 0 or point[1] >= 90 or abs(point[0]) >= 180:
                break
                
            # Rest of integration code
            lat_rad = np.radians(point[1])
            meters_per_deg_lon = 111000 * np.cos(lat_rad)
            meters_per_deg_lat = 111000
            
            u_meters = u_val * dt
            v_meters = v_val * dt
            
            u_deg = u_meters / meters_per_deg_lon
            v_deg = v_meters / meters_per_deg_lat
            
            new_point = point + np.array([u_deg, v_deg])
            
            # If the next point would cross 180°, stop here
            if abs(new_point[0]) > 180:
                break
                
            point = new_point
            point[1] = np.clip(point[1], -90, 90)
            
            trajectory.append(point.copy())
            
        except (ValueError, RuntimeError) as e:
            break
            
    return np.array(trajectory)


# Read wind data for Jan 1, 2001
year = 2018
date = f"{year}-01-08"  # Define date before using it

# Open datasets
ds_u = xr.open_dataset(f"_data/u_wind_{year}.nc")
ds_v = xr.open_dataset(f"_data/v_wind_{year}.nc")
ds_t = xr.open_dataset(f"_data/temperature_{year}.nc")

# Extract data for specific date and pressure levels
u = ds_u.u.sel(valid_time=date, pressure_level=250)
v = ds_v.v.sel(valid_time=date, pressure_level=250)
temp = ds_t.t.sel(valid_time=date, pressure_level=600)  # Temperature at 600 hPa

print("Data shapes:")
print("U shape:", u.shape)
print("V shape:", v.shape)
print("Temperature shape:", temp.shape)
print("\nWind ranges:")
print("U wind range:", u.min().values, "to", u.max().values)
print("V wind range:", v.min().values, "to", v.max().values)

# Create fast interpolators
print("Creating interpolators...")
u_interp, v_interp = create_interpolators(u, v)

# Generate N evenly spaced starting points
N = 90  # Number of trajectories
start_lats = np.linspace(0, 90, N)
trajectories = []

for lat in start_lats:
    start_point = np.array([-179.9, lat])  # Starting slightly west of 180°
    traj = integrate_streamline(u_interp, v_interp, start_point)
    trajectories.append(traj)

def compute_endpoint_deviation(trajectory, initial_lat):
    """Compute how close the trajectory comes to its initial latitude at 180°"""
    if len(trajectory) < 2:
        return float('inf')
    
    # Check if trajectory reaches close to 180° longitude
    east_points = trajectory[trajectory[:, 0] >= 179]
    if len(east_points) == 0:
        return float('inf')
    
    # Check if trajectory spans at least 300 degrees longitude
    lon_span = np.max(trajectory[:, 0]) - np.min(trajectory[:, 0])
    if lon_span < 300:
        return float('inf')
    
    # Calculate minimum latitude deviation
    lat_deviations = abs(east_points[:, 1] - initial_lat)
    return np.min(lat_deviations)

# Compute deviations and create sorted indices
deviations = []
for i, traj in enumerate(trajectories):
    initial_lat = start_lats[i]
    deviation = compute_endpoint_deviation(traj, initial_lat)
    deviations.append((i, deviation))

# Sort by deviation (second element of tuple)
sorted_indices = [i for i, _ in sorted(deviations, key=lambda x: x[1])]

# Plot all trajectories first in gray
plt.figure(figsize=(15, 10))
ax = plt.axes(projection=ccrs.PlateCarree())

# Add temperature contours with modified settings
n_levels = 10  # Number of contour levels desired
temp = ds_t.t.sel(valid_time=date, pressure_level=600)
# Convert from Kelvin to Celsius
temp_celsius = temp - 273.15
# Calculate levels based on data range
temp_min, temp_max = temp_celsius.min(), temp_celsius.max()
levels = np.linspace(temp_min, temp_max, n_levels)
temp_contours = ax.contourf(temp.longitude, temp.latitude, temp_celsius,
                          levels=levels,
                          cmap='coolwarm',
                          linewidths=1.0,  # Thicker lines
                          transform=ccrs.PlateCarree())

# Add contour labels
temp_lines = ax.contour(temp.longitude, temp.latitude, temp_celsius,
                       levels=levels,
                       colors='k',
                       linewidths=0.5,
                       transform=ccrs.PlateCarree())
plt.clabel(temp_lines, inline=True, fontsize=8, fmt='%1.0f°C')

ax.add_feature(cfeature.COASTLINE)
ax.set_global()

# Plot all trajectories in gray first
for traj in trajectories:
    if len(traj) > 1:
        ax.plot(
            traj[:, 0],
            traj[:, 1],
            "-",
            color="#06d6a0",
            linewidth=0.5,
            transform=ccrs.PlateCarree(),
        )
        ax.plot(traj[0, 0], traj[0, 1], 'go', markersize=5, 
                transform=ccrs.PlateCarree())

# Then overlay top 5 qualifying trajectories
colors = ['black', 'red', 'blue', 'green', 'orange']
linewidth = 2

for rank, idx in enumerate(sorted_indices[:5]):  # Only plot top 5
    traj = trajectories[idx]
    if len(traj) > 1:
        ax.plot(traj[:, 0], traj[:, 1], '-', 
                color=colors[rank], 
                linewidth=linewidth, 
                transform=ccrs.PlateCarree())
        ax.plot(traj[0, 0], traj[0, 1], 'ko', markersize=5, 
                transform=ccrs.PlateCarree())

def compute_temp_deviation(trajectory, temp_field, target_temp=-16):
    """Compute average deviation from target temperature along trajectory"""
    if len(trajectory) < 2:
        return float('inf')
    
    # Create temperature interpolator
    lats = temp_field.latitude.values
    lons = temp_field.longitude.values
    temp_interp = RegularGridInterpolator((lats, lons), temp_field.values,
                                         bounds_error=False, fill_value=None)
    
    # Compute temperature deviation along trajectory
    deviations = []
    for point in trajectory:
        try:
            temp = float(temp_interp([point[1], point[0]]))
            if not np.isnan(temp):
                deviations.append(abs(temp - target_temp))
        except ValueError:
            continue
    
    return np.mean(deviations) if deviations else float('inf')

# Compute temperature deviations for top 5 trajectories
temp_deviations = []
for idx in sorted_indices[:5]:
    traj = trajectories[idx]
    deviation = compute_temp_deviation(traj, temp_celsius)  # Using existing temp_celsius
    temp_deviations.append((idx, deviation))

# Find trajectory closest to -16°C
best_temp_idx = min(temp_deviations, key=lambda x: x[1])[0]

# Plot the best temperature-following trajectory with thick line
best_traj = trajectories[best_temp_idx]
if len(best_traj) > 1:
    ax.plot(best_traj[:, 0], best_traj[:, 1], '-', 
            color='purple',  # or any color you prefer
            linewidth=5, 
            transform=ccrs.PlateCarree(),
            zorder=10)  # Make sure it's on top
    ax.plot(best_traj[0, 0], best_traj[0, 1], 'ko', 
            markersize=8, 
            transform=ccrs.PlateCarree(),
            zorder=11)

plt.title(f'Wind Streamlines at 250hPa - {date}')
plt.savefig(f'streamlines_{date}.png', bbox_inches='tight', dpi=300)
plt.close()
