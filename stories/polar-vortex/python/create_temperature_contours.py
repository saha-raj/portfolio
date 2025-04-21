import xarray as xr
import numpy as np
from pathlib import Path
import cartopy.crs as ccrs
import os
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import pandas as pd
from scipy.ndimage import gaussian_filter
import argparse
from datetime import datetime

def load_temperature_data(year, month, day):
    """Load temperature data for a specific date."""
    # Get the script's directory
    script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    data_dir = script_dir / "_data/temperature-DAILY-JAN-FEB"
    filename = f"temperature_{year}.nc"
    file_path = data_dir / filename
    
    print(f"Looking for file: {file_path}")
    
    if not file_path.exists():
        raise FileNotFoundError(f"No data file found for year {year} at {file_path}")
    
    # Load the dataset
    ds = xr.open_dataset(file_path)
    
    # Create target datetime
    target_date = np.datetime64(f"{year}-{month:02d}-{day:02d}")
    
    # Find the matching time index
    try:
        time_index = np.where(ds.valid_time.values == target_date)[0][0]
    except IndexError:
        raise ValueError(f"No data found for date {target_date}")
    
    # Extract temperature data for the specific date (surface level)
    temp_data = ds.t[time_index, 0]
    
    # Convert from Kelvin to Celsius
    temp_data = temp_data - 273.15
    
    return temp_data

def create_temperature_contours(temp_data, output_path, min_temp=-40, max_temp=-15):
    """Create temperature contours using matplotlib and save as PNG."""
    # Create output directory if it doesn't exist
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create figure with exact 2:1 aspect ratio
    plt.figure(figsize=(14.4, 7.2))  # 2:1 aspect ratio for equirectangular
    ax = plt.axes(projection=ccrs.PlateCarree())

    # Set the plot extent to cover the entire globe
    ax.set_extent([-180, 180, -90, 90], crs=ccrs.PlateCarree())

    # Define the 5 colors from warmest to coolest
    # colors = ['#bbdefb', '#64b5f6', '#2196f3', '#1976d2', '#0d47a1']
    # colors = ["#03045e", "#0077b6", "#00b4d8", "#90e0ef", "#caf0f8"]

    # pink-blue
    # colors = ["#f8f9fb", "#e1ecf7", "#aecbeb", "#83b0e1", "#71a5de"]
    
    # New blue gradient from light to dark
    # colors = ['#0055AB', '#3479BF', '#699ED3', '#9DC2E6', '#D1E6FA']
    colors = ['#7C0FF8', '#9145F9', '#A77BF9', '#BCB0FA', '#D1E6FA']
    n_bins = 5  # Use exactly 5 levels
    cmap = LinearSegmentedColormap.from_list("custom_blues", colors, N=n_bins)

    # Apply Gaussian smoothing to the temperature data
    # Convert xarray to numpy array for smoothing
    temp_array = temp_data.values
    smoothed_data = gaussian_filter(temp_array, sigma=1.0)

    # Mask temperatures above max_temp
    masked_data = np.ma.masked_where(smoothed_data > max_temp, smoothed_data)

    # Create the temperature plot using pcolormesh for NH data
    cs = ax.pcolormesh(temp_data.longitude, temp_data.latitude, masked_data,
                    transform=ccrs.PlateCarree(),
                    vmin=min_temp,
                    vmax=max_temp,
                    cmap=cmap,
                    alpha=0.9)

    # Remove axes and make background transparent
    ax.axis('off')
    plt.gca().set_facecolor('none')
    plt.gcf().set_facecolor('none')

    # Save the plot with exact dimensions and no padding
    plt.savefig(output_path, 
                bbox_inches='tight', 
                pad_inches=0, 
                transparent=True, 
                dpi=100)
    plt.close()

    print(f"Saved temperature contour to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create temperature contour plots.')
    parser.add_argument('--max-temp', type=float, default=-15,
                      help='Maximum temperature threshold in Celsius (default: -15)')
    parser.add_argument('--min-temp', type=float, default=-40,
                      help='Minimum temperature threshold in Celsius (default: -40)')
    parser.add_argument('--start-date', type=str, required=True,
                      help='Start date in YYYY-MM-DD format')
    parser.add_argument('--end-date', type=str, required=True,
                      help='End date in YYYY-MM-DD format')
    parser.add_argument('--output-dir', type=str, required=True,
                      help='Output directory path for temperature overlays')
    
    args = parser.parse_args()
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    
    # Create output directory if it doesn't exist
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate list of dates
    current_date = start_date
    while current_date <= end_date:
        year = current_date.year
        month = current_date.month
        day = current_date.day
        
        print(f"\nProcessing {year}-{month:02d}-{day:02d}")
        try:
            # Load temperature data
            temp_data = load_temperature_data(year, month, day)
            
            # Create output filename
            output_path = output_dir / f"temp_{year}-{month:02d}-{day:02d}.png"
            
            # Create and save contours
            create_temperature_contours(temp_data, output_path, 
                                     min_temp=args.min_temp, 
                                     max_temp=args.max_temp)
            
        except Exception as e:
            print(f"Error processing date: {e}")
        
        # Move to next day
        current_date = datetime.strptime(f"{year}-{month:02d}-{day+1:02d}", '%Y-%m-%d') 
