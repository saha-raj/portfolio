import xarray as xr
import numpy as np
from scipy.interpolate import interp1d
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.path import Path
from scipy.ndimage import gaussian_filter, maximum_filter
import matplotlib.dates as mdates
from scipy.optimize import least_squares
from skimage import measure
import argparse
from datetime import datetime


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

    # Filter for contours that are in the polar region (mean lat > 40°N)
    # AND have significant length (to avoid small polygons)
    min_length = 100  # Minimum number of points for a valid contour
    polar_contours = [p for p in paths if np.mean(p[:, 1]) > 40 and len(p) > min_length]
    if not polar_contours:
        raise ValueError("No polar contours found")

    # Get the longest polar contour
    contour = max(polar_contours, key=len)
    print(f"\nSelected contour length: {len(contour)}")

    # Normalize longitudes back to [-180, 180]
    x, y = contour[:, 0], contour[:, 1]
    x = np.mod(x + 180, 360) - 180

    return np.column_stack([x, y])


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
    theta = np.linspace(0, 2 * np.pi, n_points)
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


def calculate_gradient_metrics(data):
    """Calculate gradient-based metrics"""
    # Convert to polar coordinates (centered on pole)
    lats = data.latitude
    lons = data.longitude
    y, x = np.meshgrid(lats, lons, indexing='ij')
    r = 90 - y  # Distance from pole in degrees
    
    # Calculate radial gradient
    grad_r = np.gradient(data, axis=0)  # Latitude gradient
    
    # Average gradient in radial direction (30-60°N)
    mask = (y >= 60) & (y <= 80)
    mean_grad = np.mean(np.abs(grad_r[mask]))
    grad_uniformity = np.std(grad_r[mask]) / mean_grad  # Lower = more uniform
    
    return mean_grad, grad_uniformity


def calculate_polar_height_metric(data):
    """Calculate polar cap (60-90°N) average geopotential height"""
    # Select polar region (60-90°N)
    polar_mask = data.latitude >= 65
    polar_data = data.where(polar_mask)
    
    # Calculate area-weighted mean
    weights = np.cos(np.deg2rad(polar_data.latitude))
    polar_mean = float(polar_data.weighted(weights).mean(['latitude', 'longitude']))
    
    return polar_mean

def get_vortex_threshold(data):
    """Determine appropriate threshold for vortex edge detection"""
    # Get data range
    valid_data = data.values[~np.isnan(data.values)]
    if len(valid_data) == 0:
        return None
        
    # Use 25th percentile as threshold since we want low values for the vortex
    threshold = np.percentile(valid_data, 25)
    return threshold


    """Fast ellipse fitting using contour points"""
    from skimage import measure
    
    # Get dynamic threshold if none provided
    if threshold is None:
        threshold = get_vortex_threshold(data)
        if threshold is None:
            return None
    
    # Get contour at threshold
    # Note: find_contours finds contours where values are ABOVE threshold
    # So we invert the data to find low values
    contours = measure.find_contours(-data.values, -threshold)
    if not contours:
        return None
        
    # Get longest contour
    contour = max(contours, key=len)
    
    # Downsample contour points (every 20th point)
    contour = contour[::20]
    
    # Convert to lat/lon
    y_coords, x_coords = contour[:, 0], contour[:, 1]
    lats = np.interp(y_coords, range(len(data.latitude)), data.latitude)
    lons = np.interp(x_coords, range(len(data.longitude)), data.longitude)
    
    # Simple ellipse parameters from points
    center_lon = np.mean(lons)
    center_lat = np.mean(lats)
    
    # Calculate semi-major and semi-minor axes
    dx = lons - center_lon
    dy = lats - center_lat
    
    # Get principal components
    coords = np.column_stack([dx, dy])
    cov = np.cov(coords.T)
    evals, evecs = np.linalg.eig(cov)
    
    # Sort eigenvalues in descending order
    sort_indices = np.argsort(evals)[::-1]
    a = 2 * np.sqrt(evals[sort_indices[0]])  # semi-major axis
    b = 2 * np.sqrt(evals[sort_indices[1]])  # semi-minor axis
    theta = np.arctan2(evecs[1, sort_indices[0]], evecs[0, sort_indices[0]])
    
    return [center_lon, center_lat, a, b, theta]

def calculate_angular_momentum_metrics(data):
    """Calculate angular momentum metrics using moments"""
    # Invert data so vortex (low values) have high weights
    weights = data.values.max() - data.values
    
    # Get coordinates relative to pole
    lats = data.latitude
    lons = data.longitude
    y, x = np.meshgrid(lats, lons, indexing='ij')
    
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
    moment_ratio = I1/I2
    asymmetry = (I1 - I2)/(I1 + I2)
    
    return moment_ratio, asymmetry

def analyze_vortex_shape(ds):
    results = []
    
    print("Analyzing vortex shape for each timestep...")
    # Get year from dataset
    year = pd.to_datetime(ds.valid_time[0].values).year
    times = pd.date_range(start=f'{year}-01-01', periods=len(ds.valid_time), freq='D')
    
    for i, time in enumerate(ds.valid_time):
        date = times[i]
        date_str = date.strftime('%Y-%m-%d')
        
        # Skip if not in Jan or Feb or Dec
        if date.month not in [1, 2, 12]:
            # Add NaN row to maintain time series continuity
            results.append([
                date_str,
                *[np.nan] * 7  
            ])
            continue
            
        # Get 2D data slice for winter months
        data = ds['z'].isel(valid_time=i).squeeze()
        
        try:
            print(f"Processing {date_str}")
            
            # Check data range before processing
            if np.all(np.isnan(data)):
                print(f"Warning: All NaN values for {date_str}")
                results.append([date_str, *[np.nan] * 15])
                continue
                
            # Lower the threshold if needed
            threshold = 50000
            if np.nanmax(data) < threshold:
                threshold = np.nanpercentile(data, 95)  # Use 95th percentile as fallback
                print(f"Adjusting threshold to {threshold:.0f} for {date_str}")
            
            # Original Fourier metrics
            level = float(data.quantile(0.5))
            coords = get_contour_coords(data, level)
            amplitudes = fourier_decomposition(coords)
            wave1_amp = amplitudes[1] / amplitudes[0]
            wave2_amp = amplitudes[2] / amplitudes[0]
            
            # Gradient and maxima metrics
            mean_grad, grad_uniformity = calculate_gradient_metrics(data)
            
            # New SSW metric
            polar_height = calculate_polar_height_metric(data)
        
            
            # Add angular momentum metrics
            moment_ratio, asymmetry = calculate_angular_momentum_metrics(data)
            
            
            results.append([
                date_str, 
                float(wave1_amp), 
                float(wave2_amp),
                float(mean_grad),
                float(grad_uniformity),
                float(polar_height),
                float(moment_ratio),
                float(asymmetry),
            ])
            
            # print(f"Processed {date_str}")
            
        except Exception as e:
            print(f"Error processing {time.values}: {str(e)}")
            continue
    
    # Save to CSV
    columns = ['date', 
               'wave1_amp', 
               'wave2_amp', 
               'mean_gradient', 
               'gradient_uniformity',
               'polar_height', 
               'moment_ratio', 
               'asymmetry'
               ]
    
    df = pd.DataFrame(results, columns=columns)
    # df.to_csv('_python/_output/vortex_metrics.csv', index=False)
    return df

def plot_metrics(df):
    """Plot all metrics over time"""
    df['date'] = pd.to_datetime(df['date'])
    
    # Filter for Jan and Feb
    mask = df['date'].dt.month.isin([1, 2])
    df = df[mask].copy()
    
    # Create figure with multiple subplots
    fig, (ax1, ax2, ax3, ax4, ax5, ax6, ax7, ax8) = plt.subplots(8, 1, figsize=(12, 32))
    
    # Plot Fourier metrics
    ax1.plot(df['date'], df['displacement'], 'b-', label='Wave-1', linewidth=2)
    ax1.plot(df['date'], df['stretching'], 'r-', label='Wave-2', linewidth=2)
    ax1.set_ylabel('Wave Amplitude')
    ax1.set_title('Fourier Decomposition Metrics')
    ax1.grid(True)
    ax1.legend()
    
    # Plot structural metrics
    ax2.plot(df['date'], df['mean_gradient'], 'g-', label='Mean Gradient', linewidth=2)
    ax2.plot(df['date'], df['primary_maximum_dist'], 'm-', label='Distance to Maximum', linewidth=2)
    ax2_twin = ax2.twinx()
    ax2_twin.plot(df['date'], df['n_maxima'], 'k--', label='Number of Maxima')
    ax2.set_ylabel('Gradient & Distance')
    ax2_twin.set_ylabel('Number of Maxima')
    ax2.set_title('Structural Metrics')
    ax2.grid(True)
    
    # Plot polar height (SSW metric)
    ax3.plot(df['date'], df['polar_height'], 'purple', label='Polar Height', linewidth=2)
    ax3.set_ylabel('Geopotential Height (m²/s²)')
    ax3.set_title('Polar Cap Average Height (SSW Indicator)')
    ax3.grid(True)
    ax3.legend()
    
    # Plot ellipse metrics
    ax4.plot(df['date'], df['aspect_ratio'], 'b-', label='Aspect Ratio', linewidth=2)
    ax4_twin = ax4.twinx()
    ax4_twin.plot(df['date'], df['ellipticity'], '--', color='red', label='Ellipticity')
    ax4.set_ylabel('Aspect Ratio')
    ax4_twin.set_ylabel('Ellipticity')
    ax4.set_title('Ellipse Metrics')
    ax4.grid(True)
    
    # Plot angular momentum metrics
    ax5.plot(df['date'], df['moment_ratio'], 'g-', label='Moment Ratio', linewidth=2)
    ax5_twin = ax5.twinx()
    ax5_twin.plot(df['date'], df['asymmetry'], '--', color='tab:orange', label='Asymmetry')
    ax5.set_ylabel('Moment Ratio')
    ax5_twin.set_ylabel('Asymmetry')
    ax5.set_title('Angular Momentum Metrics')
    ax5.grid(True)
    
    # Plot PCA metrics
    ax6.plot(df['date'], df['pca_ratio'], 'b-', label='PCA Ratio', linewidth=2)
    ax6_twin = ax6.twinx()
    ax6_twin.plot(df['date'], df['pca_explained'], '--', color='red', label='Variance Explained')
    ax6.set_ylabel('PCA Ratio')
    ax6_twin.set_ylabel('Variance Explained')
    ax6.set_title('PCA Metrics')
    ax6.grid(True)
    
    # Plot elongation index
    ax7.plot(df['date'], df['elongation_index'], 'b-', label='Elongation Index', linewidth=2)
    ax7.set_ylabel('Elongation Index')
    ax7.set_title('Vortex Elongation')
    ax7.grid(True)
    ax7.legend()
    
    # Plot edge displacement
    ax8.plot(df['date'], df['edge_displacement'], 'r-', label='Edge Displacement', linewidth=2)
    ax8.set_ylabel('Edge Displacement')
    ax8.set_title('Vortex Edge Displacement')
    ax8.grid(True)
    ax8.legend()
    
    # Combine legends for plots with twin axes
    for ax, ax_twin in [(ax2, ax2_twin), (ax4, ax4_twin), (ax5, ax5_twin), (ax6, ax6_twin)]:
        lines1, labels1 = ax.get_legend_handles_labels()
        lines2, labels2 = ax_twin.get_legend_handles_labels()
        ax.legend(lines1 + lines2, labels1 + labels2)
    
    # Format x-axis for all subplots to show dates better
    for ax in [ax1, ax2, ax3, ax4, ax5, ax6, ax7, ax8]:
        ax.tick_params(axis='x', rotation=45)
        ax.xaxis.set_major_locator(mdates.YearLocator())  # Show yearly ticks
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
    
    plt.tight_layout()
    
    # Save with year range in filename
    start_year = df['date'].dt.year.min()
    end_year = df['date'].dt.year.max()
    plt.savefig(f'_python/_output/vortex_metrics_{start_year}_{end_year}.png')
    print("Time series plots saved as vortex_metrics.png")

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(
        description="Analyze polar vortex shape for a range of years"
    )
    parser.add_argument("start_year", type=int, help="Start year (YYYY)")
    parser.add_argument("end_year", type=int, help="End year (YYYY)")
    parser.add_argument("pressure", type=int, help="Pressure level in mb/hPa")
    args = parser.parse_args()

    all_results = []

    # Loop through years
    for year in range(args.start_year, args.end_year + 1):
        print(f"\nProcessing year {year}...")
        try:
            # Read the NetCDF file
            ds = xr.open_dataset(f"_python/_data/geop_{args.pressure}mb/data_{year}.nc")

            # Get metrics for this year
            metrics = analyze_vortex_shape(ds)
            all_results.append(metrics)

        except Exception as e:
            print(f"Error processing year {year}: {str(e)}")
            continue

    # Combine all results
    if all_results:
        combined_metrics = pd.concat(all_results, ignore_index=True)

        # Save to CSV with descriptive filename
        output_file = f"_python/_output/analysis_vortex_v2_{args.start_year}_{args.end_year}_{args.pressure}mb.csv"
        combined_metrics.to_csv(output_file, index=False)
        print(f"\nSaved combined metrics to {output_file}")

        # Create plots
        # plot_metrics(combined_metrics)
        # print("\nSummary of results:")
        # print(combined_metrics.describe())
    else:
        print("No results to process!") 
