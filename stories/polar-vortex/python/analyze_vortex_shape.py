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
    # Get contours directly from array
    contours = measure.find_contours(data.values, level)
    
    if not contours:
        raise ValueError("No contour found at specified level")
    
    # Get the longest contour
    contour = max(contours, key=len)
    
    # Convert indices to lat/lon coordinates
    y_coords, x_coords = contour[:, 0], contour[:, 1]
    lats = np.interp(y_coords, range(len(data.latitude)), data.latitude)
    lons = np.interp(x_coords, range(len(data.longitude)), data.longitude)
    
    return np.column_stack([lons, lats])

def fourier_decomposition(coords, n_points=360):
    """Perform Fourier decomposition of the contour"""
    # Convert to polar coordinates around the pole
    x, y = coords[:, 0], coords[:, 1]
    r = np.sqrt(x**2 + y**2)
    theta = np.arctan2(y, x)
    
    # Shift angles to [0, 2π] range
    theta = np.where(theta < 0, theta + 2*np.pi, theta)
    
    # Sort by angle
    sort_idx = np.argsort(theta)
    theta = theta[sort_idx]
    r = r[sort_idx]
    
    # Add first point to end to close the contour
    if theta[-1] - theta[0] < 2*np.pi:
        theta = np.append(theta, theta[0] + 2*np.pi)
        r = np.append(r, r[0])
    
    # Create regular angular grid
    theta_regular = np.linspace(theta[0], theta[-1], n_points)
    
    # Interpolate radius to regular angular grid
    f = interp1d(theta, r, bounds_error=False, fill_value='extrapolate')
    r_regular = f(theta_regular)
    
    # Perform FFT
    fft = np.fft.fft(r_regular)
    amplitudes = np.abs(fft) / n_points
    
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

def find_local_maxima(data, sigma=3.0):
    """Find significant local maxima after smoothing"""
    # Smooth the data
    smoothed = gaussian_filter(data, sigma)
    
    # Find local maxima
    neighborhood_size = 50  # Increased from 5 to reduce noise
    local_max = maximum_filter(smoothed, size=neighborhood_size)
    maxima = (smoothed == local_max)
    
    # Add significance threshold
    threshold = np.percentile(smoothed, 95)  # Only consider top 25% values
    maxima = maxima & (smoothed > threshold)
    
    # Get coordinates of maxima
    y_max, x_max = np.where(maxima)
    
    # Convert to lat/lon and calculate distances from pole
    lats = data.latitude.values[y_max]
    lons = data.longitude.values[x_max]
    values = smoothed[y_max, x_max]
    
    # Sort by value to get primary maxima
    sort_idx = np.argsort(-values)
    distances = 90 - lats[sort_idx]  # Distance from pole
    
    return len(distances), distances[0] if len(distances) > 0 else np.nan

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

def fit_ellipse_to_contour(data, threshold=None):
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

def calculate_pca_metrics(data):
    """Calculate PCA-based metrics of vortex shape"""
    # Mask to polar region (>50°N)
    polar_mask = data.latitude >= 50
    polar_data = data.where(polar_mask, drop=True)
    
    # Get spatial coordinates for remaining points
    lats = polar_data.latitude
    lons = polar_data.longitude
    y, x = np.meshgrid(lats, lons, indexing='ij')
    
    # Flatten arrays properly
    coords = np.column_stack([x.ravel(), y.ravel()])
    
    # Remove any NaN values
    valid_mask = ~np.isnan(polar_data.values)
    # Make weights positive by subtracting from max value
    valid_data = polar_data.values[valid_mask]
    weights = valid_data.max() - valid_data  # Now weights are positive
    valid_coords = coords[valid_mask.ravel()]
    
    # Calculate covariance matrix
    cov_matrix = np.cov(valid_coords.T, aweights=weights)
    
    # Get eigenvalues
    eigenvals = np.linalg.eigvals(cov_matrix)
    eigenvals = np.sort(eigenvals)[::-1]  # Sort in descending order
    
    # Calculate metrics
    pca_ratio = eigenvals[0]/eigenvals[1]  # ratio of first two components
    pca_explained = eigenvals[0]/eigenvals.sum()  # variance explained by first component
    
    return pca_ratio, pca_explained

def calculate_elongation_index(data, threshold=None):
    """Calculate elongation index using contour points"""
    from skimage import measure
    
    # Get dynamic threshold if none provided
    if threshold is None:
        threshold = get_vortex_threshold(data)
        if threshold is None:
            return np.nan
    
    # Invert data to find low values
    values = -data.squeeze().values
    contours = measure.find_contours(values, -threshold)
    if not contours:
        return np.nan
    
    # Get longest contour
    contour = max(contours, key=len)
    
    # Convert to lat/lon coordinates
    y_coords, x_coords = contour[:, 0], contour[:, 1]
    lats = np.interp(y_coords, range(len(data.latitude)), data.latitude)
    lons = np.interp(x_coords, range(len(data.longitude)), data.longitude)
    
    # Calculate distances between all points
    from scipy.spatial.distance import pdist
    coords = np.column_stack([lons, lats])
    distances = pdist(coords)
    
    # Get maximum distance (major axis)
    major_axis = np.max(distances)
    
    # Calculate perimeter
    perimeter = np.sum(np.sqrt(np.diff(lons)**2 + np.diff(lats)**2))
    
    # Calculate elongation index
    elongation_index = major_axis / perimeter
    
    return elongation_index

def calculate_edge_displacement(data, threshold=None):
    """Calculate mean displacement of edge points from center"""
    from skimage import measure
    
    # Get dynamic threshold if none provided
    if threshold is None:
        threshold = get_vortex_threshold(data)
        if threshold is None:
            return np.nan
    
    # Invert data to find low values
    values = -data.squeeze().values
    contours = measure.find_contours(values, -threshold)
    if not contours:
        return np.nan
    
    # Get longest contour
    contour = max(contours, key=len)
    
    # Convert to lat/lon coordinates
    y_coords, x_coords = contour[:, 0], contour[:, 1]
    lats = np.interp(y_coords, range(len(data.latitude)), data.latitude)
    lons = np.interp(x_coords, range(len(data.longitude)), data.longitude)
    
    # Calculate centroid
    center_lat = np.mean(lats)
    center_lon = np.mean(lons)
    
    # Calculate distances from center
    distances = np.sqrt((lons - center_lon)**2 + (lats - center_lat)**2)
    
    # Calculate mean and std of distances
    mean_displacement = np.mean(distances)
    displacement_std = np.std(distances)
    
    # Normalize by mean displacement
    edge_displacement = displacement_std / mean_displacement
    
    return edge_displacement

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
                *[np.nan] * 15  # 15 metrics + date
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
            n_maxima, primary_dist = find_local_maxima(data)
            
            # New SSW metric
            polar_height = calculate_polar_height_metric(data)
            
            # New ellipse metrics
            ellipse_params = fit_ellipse_to_contour(data)
            if ellipse_params is not None:
                xc, yc, a, b, theta = ellipse_params
                aspect_ratio = a/b
                ellipticity = np.sqrt(1 - (b/a)**2)
            else:
                aspect_ratio = np.nan
                ellipticity = np.nan
            
            # Add angular momentum metrics
            moment_ratio, asymmetry = calculate_angular_momentum_metrics(data)
            
            # Add PCA metrics
            pca_ratio, pca_explained = calculate_pca_metrics(data)
            
            # Add new metrics
            elongation = calculate_elongation_index(data)
            edge_disp = calculate_edge_displacement(data)
            
            results.append([
                date_str, 
                float(wave1_amp), 
                float(wave2_amp),
                float(mean_grad),
                float(grad_uniformity),
                int(n_maxima),
                float(primary_dist),
                float(polar_height),
                float(aspect_ratio),
                float(ellipticity),
                float(moment_ratio),
                float(asymmetry),
                float(pca_ratio),
                float(pca_explained),
                float(elongation),
                float(edge_disp)
            ])
            
            # print(f"Processed {date_str}")
            
        except Exception as e:
            print(f"Error processing {time.values}: {str(e)}")
            continue
    
    # Save to CSV
    columns = ['date', 'displacement', 'stretching', 
               'mean_gradient', 'gradient_uniformity',
               'n_maxima', 'primary_maximum_dist',
               'polar_height', 'aspect_ratio', 'ellipticity',
               'moment_ratio', 'asymmetry',
               'pca_ratio', 'pca_explained',
               'elongation_index', 'edge_displacement']
    df = pd.DataFrame(results, columns=columns)
    df.to_csv('_python/_output/vortex_metrics.csv', index=False)
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
            ds = xr.open_dataset(f"_python/temp_downloads/geop_100mb/data_{year}.nc")

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
        output_file = f'_python/_output/analysis_vortex_{args.start_year}_{args.end_year}_{args.pressure}mb.csv'
        combined_metrics.to_csv(output_file, index=False)
        print(f"\nSaved combined metrics to {output_file}")

        # Create plots
        plot_metrics(combined_metrics)
        print("\nSummary of results:")
        print(combined_metrics.describe())
    else:
        print("No results to process!") 
