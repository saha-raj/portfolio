import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs  # type: ignore
import os
import numpy as np
from scipy.signal import savgol_filter  # type: ignore
import pandas as pd  # type: ignore
from PIL import Image
from datetime import datetime
import json
import argparse  # Add this import


def find_jet_stream_with_uncertainty(wind_magnitude, lats, lons):
    """Calculate jet stream position and uncertainty for each longitude."""
    # Focus on Northern Hemisphere band
    lat_mask = (lats >= 30) & (lats <= 70)
    nh_winds = wind_magnitude[lat_mask]
    nh_lats = lats[lat_mask]

    jet_lats = np.zeros(len(lons))
    uncertainties = np.zeros(len(lons))

    for i in range(len(lons)):
        wind_profile = nh_winds[:, i]
        weights = wind_profile**2
        jet_lats[i] = np.average(nh_lats, weights=weights)

        # Calculate uncertainty based on "peakedness" of wind profile
        max_wind = np.max(wind_profile)
        norm_profile = wind_profile / max_wind
        high_winds = norm_profile > 0.8
        uncertainties[i] = np.sum(high_winds) / len(wind_profile)

    # Smooth both the position and uncertainty
    jet_lats = savgol_filter(jet_lats, window_length=51, polyorder=3)
    uncertainties = savgol_filter(uncertainties, window_length=51, polyorder=3)

    # Force matching ends for periodic boundary
    avg_end = (jet_lats[0] + jet_lats[-1]) / 2
    jet_lats[0] = avg_end
    jet_lats[-1] = avg_end

    return jet_lats, uncertainties


def compute_polar_cap_area(group_data, lon_west, lon_east):
    """Compute area between pole and front for given longitude range."""
    na_data = group_data[
        (group_data["longitude"] >= lon_west) & (group_data["longitude"] <= lon_east)
    ].copy()

    na_data = na_data.sort_values("longitude").reset_index(drop=True)
    lats_rad = np.radians(na_data["latitude"].values)
    lons_rad = np.radians(na_data["longitude"].values)

    R = 6371  # Earth's radius in kilometers
    total_area = 0
    for i in range(len(lons_rad) - 1):
        lat = lats_rad[i]
        dlon = lons_rad[i + 1] - lons_rad[i]
        area = R**2 * (1 - np.sin(lat)) * dlon
        total_area += area

    return total_area


def analyze_year(year, save_plots=True):
    """Analyze front positions and statistics for a given year."""
    # Load data
    ds_u = xr.open_dataset(f"_data/u_wind_{year}.nc")
    ds_v = xr.open_dataset(f"_data/v_wind_{year}.nc")

    # Check longitude format and convert if needed
    if ds_u.longitude.min() < 0:  # If using -180 to 180 format
        # Convert to 0 to 360 format
        ds_u['longitude'] = (ds_u.longitude + 360) % 360
        ds_v['longitude'] = (ds_v.longitude + 360) % 360

    # North American longitude bounds (in 0-360 format)
    lon_west, lon_east = 230, 300  # 230°E = 130°W, 300°E = 60°W

    all_front_positions = []
    daily_stats = []

    # Process each day
    for day in range(len(ds_u.valid_time)):
        try:
            # Get wind components at 250 hPa
            u_wind = ds_u.u.isel(valid_time=day, pressure_level=1)
            v_wind = ds_v.v.isel(valid_time=day, pressure_level=1)
            date = pd.to_datetime(ds_u.valid_time[day].values)

            # Calculate wind magnitude and front position
            wind_magnitude = np.sqrt(u_wind**2 + v_wind**2)
            jet_lats, uncertainties = find_jet_stream_with_uncertainty(
                wind_magnitude, ds_u.latitude, ds_u.longitude
            )

            # Store front positions
            positions_df = pd.DataFrame({
                "date": [date] * len(ds_u.longitude),
                "longitude": ds_u.longitude.values,
                "latitude": jet_lats,
                "uncertainty": uncertainties,
            })
            all_front_positions.append(positions_df)

            # Calculate daily statistics
            na_positions = positions_df[
                (positions_df["longitude"] >= lon_west)
                & (positions_df["longitude"] <= lon_east)
            ]
            
            # Check if we have valid positions in North America
            if len(na_positions) > 0:
                min_lat = na_positions["latitude"].min()
                min_lat_lon = na_positions.loc[na_positions["latitude"].idxmin(), "longitude"]
                polar_area = compute_polar_cap_area(positions_df, lon_west, lon_east)

                daily_stats.append({
                    "date": date,
                    "min_latitude": min_lat,
                    "min_lat_longitude": min_lat_lon,
                    "polar_cap_area": polar_area,
                    "mean_latitude": na_positions["latitude"].mean(),
                    "mean_uncertainty": na_positions["uncertainty"].mean(),
                })
            else:
                print(f"Warning: No valid positions found in North America for {date}")
                
        except Exception as e:
            print(f"Error processing day {day} of year {year}: {str(e)}")
            continue

    if not all_front_positions:
        raise ValueError(f"No valid data found for year {year}")

    return pd.concat(all_front_positions), pd.DataFrame(daily_stats)


def save_daily_plot(date, positions_df, day_number):
    """Generate and save plot for a single day."""
    fig = plt.figure(figsize=(15, 10))
    ax = plt.axes(projection=ccrs.PlateCarree())
    ax.set_extent([-180, 0, 20, 90], crs=ccrs.PlateCarree())

    # Add background image
    img = plt.imread("_data/2_no_clouds_8k.jpg")
    img_extent = [-180, 180, -90, 90]
    ax.imshow(img, origin="upper", extent=img_extent, transform=ccrs.PlateCarree())

    # Plot front with varying line width
    max_width, min_width = 5, 0.1
    line_widths = max_width * (1 - positions_df["uncertainty"])
    line_widths = np.clip(line_widths, min_width, max_width)

    for i in range(len(positions_df) - 1):
        ax.plot(
            positions_df["longitude"].iloc[i : i + 2],
            positions_df["latitude"].iloc[i : i + 2],
            "k-",
            linewidth=line_widths.iloc[i],
            transform=ccrs.PlateCarree(),
        )

    ax.set_title(f'Polar Front Position - {date.strftime("%Y-%m-%d")}')
    plt.savefig(f"_frames/{day_number+1:02d}.png", dpi=300, bbox_inches="tight")
    plt.close()


def main(year_start, year_end, save_plots=False):
    """Main function to process multiple years."""
    # Create output directory
    if not os.path.exists('_data'):
        os.makedirs('_data')
    
    all_years_positions = []
    all_years_stats = []
    
    # Process each year
    for year in range(year_start, year_end + 1):
        print(f"Processing year {year}...")
        positions_df, stats_df = analyze_year(year, save_plots=save_plots)
        
        # Save year-specific data
        positions_df.to_csv(f'_data/front_positions_{year}.csv', index=False)
        stats_df.to_csv(f'_data/daily_statistics_{year}.csv', index=False)
        
        all_years_positions.append(positions_df)
        all_years_stats.append(stats_df)
    
    # Combine all years
    all_positions = pd.concat(all_years_positions)
    all_stats = pd.concat(all_years_stats)

    # Save combined data
    all_positions.to_csv("_data/front_positions_all.csv", index=False)
    all_stats.to_csv("_data/daily_statistics_all.csv", index=False)

    # Find and save extreme events
    min_lat_idx = all_stats["min_latitude"].idxmin()
    max_area_idx = all_stats["polar_cap_area"].idxmax()
    
    min_lat_day = all_stats.loc[min_lat_idx]
    max_area_day = all_stats.loc[max_area_idx]

    extremes = {
        "min_latitude": {
            "date": pd.Timestamp(min_lat_day["date"]).strftime("%Y-%m-%d"),
            "value": float(min_lat_day["min_latitude"]),
            "longitude": float(min_lat_day["min_lat_longitude"]),
        },
        "max_polar_area": {
            "date": pd.Timestamp(max_area_day["date"]).strftime("%Y-%m-%d"),
            "value": float(max_area_day["polar_cap_area"]),
            "min_lat": float(max_area_day["min_latitude"]),
            "mean_lat": float(max_area_day["mean_latitude"]),
        },
    }

    with open("_data/extreme_events.json", "w") as f:
        json.dump(extremes, f, indent=2)

    print("Analysis complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Analyze polar front position data.')
    parser.add_argument('--start', type=int, required=True, help='Start year (inclusive)')
    parser.add_argument('--end', type=int, required=True, help='End year (inclusive)')
    parser.add_argument('--save-plots', action='store_true', help='Generate and save daily plots')
    args = parser.parse_args()
    
    # Create _frames directory if plotting is enabled
    if args.save_plots and not os.path.exists('_frames'):
        os.makedirs('_frames')
    
    main(args.start, args.end, args.save_plots)
