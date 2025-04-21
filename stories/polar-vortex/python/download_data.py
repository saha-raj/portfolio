import cdsapi
import os
import zipfile
import shutil

# Create directories if they don't exist
if not os.path.exists('_data'):
    os.makedirs('_data')
if not os.path.exists('temp_downloads'):
    os.makedirs('temp_downloads')

# Initialize CDS client
c = cdsapi.Client()

# Define years to download
years = [str(year) for year in range(2000, 2025)]

for year in years:
    print(f"\nProcessing year {year}...")
    
    # Download data
    result = c.retrieve(
        'derived-era5-pressure-levels-daily-statistics',
        {
            'product_type': 'reanalysis',
            'variable': [
                'temperature',
                'u_component_of_wind',
                'v_component_of_wind'
            ],
            'year': year,
            'month': ['01', '02'],  # January
            'day': [
                '01', '02', 
                '03', '04', '05', '06',
                '07', '08', '09', '10', '11', '12',
                '13', '14', '15', '16', '17', '18',
                '19', '20', '21', '22', '23', '24',
                '25', '26', '27', '28', '29', '30',
                '31'
            ],
            'pressure_level': ['250', '600'],
            'daily_statistic': 'daily_mean',
            'time_zone': 'utc+00:00',
            'frequency': '6_hourly',
            'area': [90, -180, 0, 180],
        },
        f'temp_downloads/data_{year}.zip'
    )
    
    # Unzip the file
    print(f"Unzipping data for {year}...")
    with zipfile.ZipFile(f'temp_downloads/data_{year}.zip', 'r') as zip_ref:
        zip_ref.extractall(f'temp_downloads/{year}')
    
    # Move and rename files
    source_dir = f'temp_downloads/{year}'
    for filename in os.listdir(source_dir):
        if filename.startswith('temperature'):
            new_name = f'temperature_{year}.nc'
        elif filename.startswith('u_component'):
            new_name = f'u_wind_{year}.nc'
        elif filename.startswith('v_component'):
            new_name = f'v_wind_{year}.nc'
        else:
            continue
        
        shutil.move(
            os.path.join(source_dir, filename),
            os.path.join('_data', new_name)
        )
    
    # Clean up temporary files
    os.remove(f'temp_downloads/data_{year}.zip')
    os.rmdir(f'temp_downloads/{year}')
    
    print(f"Completed processing for {year}")

# Clean up temp directory
# os.rmdir('temp_downloads')

print("\nDownload and processing complete!")