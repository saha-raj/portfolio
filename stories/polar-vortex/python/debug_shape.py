import xarray as xr
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path
from skimage import measure
import argparse
from datetime import datetime
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import os
from scipy.interpolate import interp1d


def fourier_decomposition(coords, n_points=360):
    """Perform Fourier decomposition of the contour using complex coordinates"""
    # Use complex coordinates
    z = coords[:, 0] + 1j * coords[:, 1]
    
    # Make sure contour is closed
    if not np.allclose(z[0], z[-1]):
        z = np.append(z, z[0])
    
    # Calculate cumulative distance along the contour
    dz = np.diff(z)
    ds = np.abs(dz)
    s = np.cumsum(ds)
    s = np.insert(s, 0, 0)  # Add starting point
    
    # Normalize distance to [0, 2π]
    s = 2 * np.pi * s / s[-1]
    
    # Resample to equal angular spacing
    theta = np.linspace(0, 2*np.pi, n_points)
    z_regular = np.interp(theta, s, z.real) + 1j * np.interp(theta, s, z.imag)
    
    # Perform FFT
    fft = np.fft.fft(z_regular)
    amplitudes = np.abs(fft) / n_points
    
    # Print first few modes for debugging
    print(f"\nFFT amplitudes:")
    print(f"Mode 0 (mean): {amplitudes[0]:.3f}")
    print(f"Mode 1 (displacement): {amplitudes[1]:.3f}")
    print(f"Mode 2 (elongation): {amplitudes[2]:.3f}")
    
    return amplitudes[:3]  # Return first 3 wavenumbers (0, 1, 2)


def get_contour_coords(data, level):
    """Extract coordinates without creating matplotlib figure"""
    # Extend data across dateline to ensure continuous contours
    lons = data.longitude.values
    lats = data.latitude.values
    
    # Add points beyond -180 and +180
    extra_lons_left = lons[lons > 0] - 360
    extra_lons_right = lons[lons < 0] + 360
    extended_lons = np.concatenate([extra_lons_left, lons, extra_lons_right])
    
    # Extend the data array
    left_data = data.sel(longitude=data.longitude[data.longitude > 0]).values
    right_data = data.sel(longitude=data.longitude[data.longitude < 0]).values
    extended_data = np.concatenate([left_data, data.values, right_data], axis=1)
    
    # Create extended grid
    lon_grid, lat_grid = np.meshgrid(extended_lons, lats)
    
    # Find contours using matplotlib's contour
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots()
    cs = ax.contour(lon_grid, lat_grid, extended_data, levels=[level])
    plt.close()
    
    # Get all contours at this level
    paths = cs.allsegs[0]
    if not paths:
        raise ValueError("No contour found at specified level")
    
    # Debug print
    print(f"\nFound {len(paths)} contours at level {level}")
    for i, p in enumerate(paths):
        mean_lat = np.mean(p[:, 1])
        print(f"Contour {i}: length={len(p)}, mean_lat={mean_lat:.1f}°N")
    
    # Filter for contours that are in the polar region (mean lat > 50°N)
    # AND have significant length (to avoid small polygons)
    min_length = 100  # Minimum number of points for a valid contour
    polar_contours = [p for p in paths if np.mean(p[:, 1]) > 50 and len(p) > min_length]
    if not polar_contours:
        raise ValueError("No polar contours found")
    
    # Get the longest polar contour
    contour = max(polar_contours, key=len)
    print(f"\nSelected contour length: {len(contour)}")
    
    # Normalize longitudes back to [-180, 180]
    x, y = contour[:, 0], contour[:, 1]
    x = np.mod(x + 180, 360) - 180
    
    return np.column_stack([x, y])


def get_vortex_threshold(data):
    """Determine appropriate threshold for vortex edge detection"""
    # Get data range
    valid_data = data.values[~np.isnan(data.values)]
    if len(valid_data) == 0:
        return None

    # Use 25th percentile as threshold since we want low values for the vortex
    threshold = np.percentile(valid_data, 10)
    return threshold


def calculate_angular_momentum_metrics(data):
    """Calculate angular momentum metrics using moments"""
    # Invert data so vortex (low values) have high weights
    weights = data.values.max() - data.values

    # Get coordinates relative to pole
    lats = data.latitude
    lons = data.longitude
    y, x = np.meshgrid(lats, lons, indexing="ij")

    # Convert to Cartesian-like coordinates
    dx = (x - np.mean(x)) * np.cos(np.deg2rad(y))
    dy = y - np.mean(y)

    # Calculate moments of inertia using inverted weights
    Ixx = np.sum(weights * dy**2)
    Iyy = np.sum(weights * dx**2)
    Ixy = np.sum(weights * dx * dy)

    # Calculate principal moments
    I_matrix = np.array([[Ixx, Ixy], [Ixy, Iyy]])
    eigenvals = np.linalg.eigvals(I_matrix)

    # Sort eigenvalues
    I1, I2 = np.sort(eigenvals)[::-1]

    # Calculate moment ratio and asymmetry
    moment_ratio = I1 / I2
    asymmetry = (I1 - I2) / (I1 + I2)

    return moment_ratio, asymmetry


def plot_debug_view(data, date_str):
    """Plot polar stereographic view with contours"""
    # Create figure with polar projection
    fig = plt.figure(figsize=(15, 5))
    
    # First subplot: Raw data contours
    ax1 = fig.add_subplot(131, projection=ccrs.Orthographic(0, 90))
    ax1.set_global()
    ax1.gridlines()
    ax1.add_feature(cfeature.COASTLINE)
    ax1.add_feature(cfeature.BORDERS)
    
    # Plot filled contours and contour lines
    threshold = get_vortex_threshold(data)
    cf = ax1.contourf(data.longitude, data.latitude, data.values,
                     transform=ccrs.PlateCarree(), cmap='rainbow')
    cs = ax1.contour(data.longitude, data.latitude, data.values,
                    transform=ccrs.PlateCarree(), colors='k', linewidths=0.5)
    ax1.clabel(cs, inline=True, fontsize=8)
    plt.colorbar(cf, ax=ax1, label='Geopotential Height (m)')
    ax1.set_title('Raw Data Contours\nGeopotential Height (m)')
    
    # Second subplot: Angular Momentum metrics
    ax2 = fig.add_subplot(132, projection=ccrs.Orthographic(0, 90))
    ax2.set_global()
    ax2.gridlines()
    ax2.add_feature(cfeature.COASTLINE)
    ax2.add_feature(cfeature.BORDERS)
    
    # Calculate and display angular momentum metrics
    moment_ratio, asymmetry = calculate_angular_momentum_metrics(data)
    ax2.set_title(f'Moment Ratio: {moment_ratio:.2f}\nAsymmetry: {asymmetry:.2f}')
    
    # Plot the weights used in the calculation
    weights = data.values.max() - data.values
    cf = ax2.contourf(data.longitude, data.latitude, weights,
                      transform=ccrs.PlateCarree(),
                      cmap='YlOrRd')
    plt.colorbar(cf, ax=ax2, label='Weights (inverted heights)')
    
    # Third subplot: FFT analysis contour
    ax3 = fig.add_subplot(133, projection=ccrs.Orthographic(0, 90))
    ax3.set_global()
    ax3.gridlines(linestyle='--', alpha=0.3, color='blue')
    ax3.add_feature(cfeature.COASTLINE)
    ax3.add_feature(cfeature.BORDERS)
    
    # Get median contour and calculate FFT
    level = float(data.quantile(0.3))  # 40th percentile
    
    # Create extended grid for contour finding
    lons = data.longitude.values
    lats = data.latitude.values
    extra_lons_left = lons[lons > 0] - 360
    extra_lons_right = lons[lons < 0] + 360
    extended_lons = np.concatenate([extra_lons_left, lons, extra_lons_right])
    left_data = data.sel(longitude=data.longitude[data.longitude > 0]).values
    right_data = data.sel(longitude=data.longitude[data.longitude < 0]).values
    extended_data = np.concatenate([left_data, data.values, right_data], axis=1)
    lon_grid, lat_grid = np.meshgrid(extended_lons, lats)
    
    # Get all contours
    cs = ax3.contour(lon_grid, lat_grid, extended_data, levels=[level],
                     transform=ccrs.PlateCarree())
    paths = cs.allsegs[0]
    
    # Filter for polar contours with minimum length
    min_length = 100
    polar_contours = [p for p in paths if np.mean(p[:, 1]) > 50 and len(p) > min_length]
    if not polar_contours:
        raise ValueError("No polar contours found")
    
    # Get the longest contour
    contour = max(polar_contours, key=len)
    
    # Plot the selected contour
    ax3.plot(contour[:, 0], contour[:, 1], 'r-', 
            transform=ccrs.PlateCarree(), 
            linewidth=2,
            label='Selected Contour')
    
    # Calculate FFT using this exact contour
    amplitudes = fourier_decomposition(contour)
    wave2_amp = amplitudes[2] / amplitudes[0]
    
    ax3.set_title(f'FFT Analysis Contour\nWave-2 Amplitude: {wave2_amp:.3f}')
    ax3.legend()
    
    plt.suptitle(f'Vortex Analysis Debug View - {date_str}')
    plt.tight_layout()
    
    # Save figure instead of showing
    output_file = f'_python/_output/debug_shape.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    # Open the saved image
    os.system(f'open {output_file}')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Debug vortex shape metrics")
    parser.add_argument("date", type=str, help="Date to analyze (YYYY-MM-DD)")
    args = parser.parse_args()
    
    # Parse date and get year
    target_date = datetime.strptime(args.date, '%Y-%m-%d')
    year = target_date.year
    
    # Read data
    print(f"Reading data for {year}...")
    ds = xr.open_dataset(f"_python/temp_downloads/geop_500mb/data_{year}.nc")
    
    # Get data for specific date
    time_index = abs(ds.valid_time - np.datetime64(args.date)).argmin()
    data = ds['z'].isel(valid_time=time_index).squeeze()
    
    # Plot debug view
    plot_debug_view(data, args.date)
