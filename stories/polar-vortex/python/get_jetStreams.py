import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import numpy as np
import os
from JetStreamLoc import (create_interpolators, integrate_streamline, 
                         compute_endpoint_deviation, compute_temp_deviation,
                         smooth_endpoint_connection, find_temp_crossings)

def process_single_date(year, date, ds_u, ds_v, ds_t):
    """Process a single date and save results"""
    # Extract data for specific date and pressure levels
    u = ds_u.u.sel(valid_time=date, pressure_level=250)
    v = ds_v.v.sel(valid_time=date, pressure_level=250)
    temp = ds_t.t.sel(valid_time=date, pressure_level=600)
    temp_celsius = temp - 273.15

    # Create fast interpolators
    u_interp, v_interp = create_interpolators(u, v)

    # Find -16°C crossing point at 180° longitude
    mid_lat = find_temp_crossings(temp_celsius)
    if mid_lat is None:
        print(f"No -16°C crossing found for date {date}")
        return

    # Generate N evenly spaced starting points around the crossing
    N = 30
    dlat = 10 
    start_lats = np.linspace(mid_lat - dlat/2, mid_lat + dlat/2, N)
    trajectories = []

    # Compute trajectories
    for lat in start_lats:
        start_point = np.array([-179.9, lat])
        traj = integrate_streamline(u_interp, v_interp, start_point)
        trajectories.append(traj)

    # Filter trajectories to only those that go around the world
    global_trajectories = []
    global_indices = []  # Keep track of original indices
    for i, traj in enumerate(trajectories):
        if len(traj) > 2:  # Basic validity check
            lon_span = np.max(traj[:, 0]) - np.min(traj[:, 0])
            if lon_span > 300:  # Using 300 degrees as threshold for "around the world"
                global_trajectories.append(traj)
                global_indices.append(i)

    if not global_trajectories:
        print(f"No global trajectories found for date {date}")
        return

    # Find best temperature-following trajectory among global trajectories
    temp_deviations = []
    for i, traj in enumerate(global_trajectories):
        deviation = compute_temp_deviation(traj, temp_celsius)
        temp_deviations.append((i, deviation))

    best_local_idx = min(temp_deviations, key=lambda x: x[1])[0]
    best_temp_idx = global_indices[best_local_idx]  # Convert back to original index

    # Plot
    plt.figure(figsize=(15, 10))
    ax = plt.axes(projection=ccrs.PlateCarree())

    # Add temperature contours (filled)
    n_levels = 10
    temp_min, temp_max = temp_celsius.min(), temp_celsius.max()
    levels_fill = np.linspace(temp_min, temp_max, n_levels)
    temp_contours = ax.contourf(temp.longitude, temp.latitude, temp_celsius,
                               levels=levels_fill, cmap='coolwarm',
                               transform=ccrs.PlateCarree())

    # Add specific -16°C contour line and find the one that circles the globe
    temp_lines = ax.contour(temp.longitude, temp.latitude, temp_celsius,
                           levels=[-16], colors='black', linewidths=1,
                           transform=ccrs.PlateCarree())

    # Find the contour path that spans the most longitude
    max_span = 0
    global_contour = None
    for path in temp_lines.allsegs[0]:
        vertices = path
        lon_span = np.max(vertices[:, 0]) - np.min(vertices[:, 0])
        if lon_span > max_span:
            max_span = lon_span
            global_contour = path

    # Only display the global contour if found
    if global_contour is not None:
        ax.plot(
            global_contour[:, 0],
            global_contour[:, 1],
            color="#3a86ff",
            linewidth=1,
            transform=ccrs.PlateCarree(),
        )

    ax.add_feature(cfeature.COASTLINE)
    ax.set_global()

    # Plot all global trajectories in light color
    for traj in global_trajectories:
        if len(traj) > 1:
            ax.plot(traj[:, 0], traj[:, 1], "-", color="#06d6a0",
                    linewidth=0.5, transform=ccrs.PlateCarree(), zorder = 12)
            ax.plot(traj[0, 0], traj[0, 1], 'go', markersize=2,
                    transform=ccrs.PlateCarree())

    # Smooth and plot final trajectory
    best_traj = smooth_endpoint_connection(global_trajectories[best_temp_idx])
    if len(best_traj) > 1:
        ax.plot(best_traj[:, 0], best_traj[:, 1], '-',
                color='white', linewidth=5,
                transform=ccrs.PlateCarree(), zorder=10)
        ax.plot(best_traj[0, 0], best_traj[0, 1], 'ko',
                markersize=2, transform=ccrs.PlateCarree(), zorder=11)

    plt.title(f'Wind Streamlines at 250hPa - {date}')
    plt.savefig(f'_output/streamlines_{date}.png', bbox_inches='tight', dpi=300)
    plt.close()

    # Save the final trajectory coordinates
    output_file = f'_output/jetstream_traj_{date}.csv'
    np.savetxt(output_file, best_traj,
               delimiter=',', header='longitude,latitude',
               comments='', fmt='%.6f')

# Create output directory
os.makedirs('_output', exist_ok=True)

# Process each year
for year in range(2002, 2025):
    print(f"Processing year {year}...")
    try:
        # Open datasets for the year
        ds_u = xr.open_dataset(f"_data/u_wind_{year}.nc")
        ds_v = xr.open_dataset(f"_data/v_wind_{year}.nc")
        ds_t = xr.open_dataset(f"_data/temperature_{year}.nc")
        
        # Get all dates in the dataset
        dates = ds_u.valid_time.values
        
        # Process each date
        for date in dates:
            date_str = str(date)[:10]  # Convert to YYYY-MM-DD format
            print(f"Processing date {date_str}")
            try:
                process_single_date(year, date, ds_u, ds_v, ds_t)
            except Exception as e:
                print(f"Error processing date {date_str}: {str(e)}")
                continue
                
        # Close datasets
        ds_u.close()
        ds_v.close()
        ds_t.close()
        
    except FileNotFoundError:
        print(f"Data files not found for year {year}, skipping...")
        continue
    except Exception as e:
        print(f"Error processing year {year}: {str(e)}")
        continue 
