import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import geopandas as gpd
from shapely.geometry import Point
import matplotlib.pyplot as plt
import sys

def load_na_boundary():
    """Load North America boundary from local Natural Earth Data file"""
    print("Starting to load GeoJSON file...")
    world = gpd.read_file('_python/ne_110m_admin_0_countries.geojson')
    print("GeoJSON loaded, filtering for North America...")
    
    na = world[world['CONTINENT'] == 'North America']
    print(f"Found {len(na)} North American countries...")
    
    na = na[~na['NAME'].isin(['Greenland'])]
    print("Excluded Greenland...")
    
    return na

def visualize_trajectory(file_path, na_boundary):
    """Visualize single trajectory and its intersection with North America"""
    # Read trajectory
    df = pd.read_csv(file_path)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(15, 10))
    
    # Plot North America boundary
    na_boundary.plot(ax=ax, color='lightgray', edgecolor='black')
    
    # Plot full trajectory
    ax.plot(df['longitude'], df['latitude'], 'b-', label='Full Trajectory', alpha=0.5)
    
    # Create points and check which ones are in North America
    points = [Point(lon, lat) for lon, lat in zip(df['longitude'], df['latitude'])]
    na_mask = [point_in_na(point, na_boundary) for point in points]
    
    # Get points within North America
    na_df = df[na_mask]
    
    # Plot trajectory within North America
    ax.plot(na_df['longitude'], na_df['latitude'], 'r-', 
            label='Within North America', linewidth=2)
    
    # Find and plot max/min latitude points within NA
    max_lat_idx = na_df['latitude'].idxmax()
    min_lat_idx = na_df['latitude'].idxmin()
    
    ax.plot(na_df.loc[max_lat_idx, 'longitude'], na_df.loc[max_lat_idx, 'latitude'], 
            'g*', markersize=15, label='Max Latitude')
    ax.plot(na_df.loc[min_lat_idx, 'longitude'], na_df.loc[min_lat_idx, 'latitude'], 
            'm*', markersize=15, label='Min Latitude')
    
    # Calculate latitude difference
    lat_diff = na_df['latitude'].max() - na_df['latitude'].min()
    
    # Set plot limits
    ax.set_xlim(-180, -50)  # Rough bounds for North America
    ax.set_ylim(20, 80)
    
    # Add title with latitude difference
    ax.set_title(f'Trajectory Analysis: {Path(file_path).name}\nLatitude Range within NA: {lat_diff:.2f}°')
    ax.legend()
    ax.grid(True)
    
    plt.savefig('_python/_output/trajectory_analysis.png')
    plt.close()
    
    # Print the values
    print(f"\nLatitude range within North America:")
    print(f"Max: {na_df['latitude'].max():.2f}°N at {na_df.loc[max_lat_idx, 'longitude']:.2f}°E")
    print(f"Min: {na_df['latitude'].min():.2f}°N at {na_df.loc[min_lat_idx, 'longitude']:.2f}°E")
    print(f"Difference: {lat_diff:.2f}°")

def point_in_na(point, na_boundary):
    """Check if point is within North America"""
    return any(na_boundary.contains(point))

def main():
    if len(sys.argv) != 2:
        print("Usage: python analyze_latitude_range.py YYYY-MM-DD")
        sys.exit(1)
        
    date_str = sys.argv[1]
    try:
        # Validate date format
        datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        print("Error: Date must be in format YYYY-MM-DD")
        sys.exit(1)
    
    # Load North America boundary
    print("Loading North America boundary data...")
    na_boundary = load_na_boundary()
    
    # Construct filename with nanoseconds
    filename = f"jetstream_traj_{date_str}T00:00:00.000000000.csv"
    file_path = Path('_python/_output') / filename
    
    if not file_path.exists():
        print(f"Error: No file found for date {date_str}")
        sys.exit(1)
    
    print(f"\nAnalyzing file: {file_path.name}")
    visualize_trajectory(file_path, na_boundary)
    print("Analysis complete. Check trajectory_analysis.png")

if __name__ == "__main__":
    main() 