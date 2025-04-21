import cdsapi
import os
import zipfile
import shutil

# Create directories if they don't exist
if not os.path.exists('_python/_data'):
    os.makedirs('_python/_data')
if not os.path.exists('_python/temp_downloads'):
    os.makedirs('_python/temp_downloads')

# Initialize CDS client
c = cdsapi.Client()

# Define years to download
years = [str(year) for year in range(2009, 2025)]

for year in years:
    print(f"\nProcessing year {year}...")

    # Download data
    download_path = f"_python/temp_downloads/data_{year}.nc"
    result = c.retrieve(
        "derived-era5-pressure-levels-daily-statistics",
        {
            "product_type": "reanalysis",
            "variable": ["geopotential"],
            "year": year,
            "month": ["01", "02", "12"],  
            "day": [
                "01",
                "02",
                "03",
                "04",
                "05",
                "06",
                "07",
                "08",
                "09",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26",
                "27",
                "28",
                "29",
                "30",
                "31",
            ],
            "pressure_level": ["100"],
            "daily_statistic": "daily_mean",
            "time_zone": "utc+00:00",
            "frequency": "6_hourly",
            "area": [90, -180, 0, 180],
        },
        download_path
    )

    # # Move and rename files
    # source_dir = f'_python/temp_downloads/{year}'
    # for filename in os.listdir(source_dir):
    #     if filename.startswith('temperature'):
    #         new_name = f'temperature_{year}.nc'
    #     elif filename.startswith('u_component'):
    #         new_name = f'u_wind_{year}.nc'
    #     elif filename.startswith('v_component'):
    #         new_name = f'v_wind_{year}.nc'
    #     elif filename.startswith("geopotential"):
    #         new_name = f"geopotential_{year}.nc"
    #     else:
    #         continue

    #     shutil.move(
    #         os.path.join(source_dir, filename),
    #         os.path.join('_python/_data', new_name)
    #     )

    # # Clean up temporary files
    # os.remove(f'_python/temp_downloads/data_{year}.zip')
    # os.rmdir(f'_python/temp_downloads/{year}')

    print(f"Completed processing for {year}")

# Clean up temp directory
# os.rmdir('_python/temp_downloads')

print("\nDownload and processing complete!")
