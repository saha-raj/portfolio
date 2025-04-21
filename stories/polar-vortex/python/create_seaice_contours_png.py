import xarray as xr
import glob
import os
import numpy as np
import matplotlib.pyplot as plt

def create_seaice_image(data, lats, lons, date_str):
    """Create an equirectangular projection image of sea ice concentration"""
    
    # Create figure with specific size for equirectangular projection
    plt.figure(figsize=(20, 10))  # 2:1 aspect ratio for equirectangular
    
    # Roll the data array to shift 180° to left edge
    data = np.roll(data, data.shape[1]//2, axis=1)
    
    # Create a masked array where ocean (low concentration) is transparent
    masked_data = np.ma.masked_where(data < 0.15, data)  # Mask values below 15% concentration
    
    # Create the plot
    plt.imshow(masked_data, 
               extent=[180, -180, -90, 90],  # Set lon extent from 180 to -180
               cmap='Greys_r',  # White ice on transparent background
               vmin=0, 
               vmax=1)
    
    plt.axis('off')  # Remove axes
    
    # Save with transparency
    output_file = f"public/assets/textures/seaice_{date_str}.png"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    plt.savefig(output_file, 
                bbox_inches='tight', 
                pad_inches=0,
                transparent=True,
                dpi=300)
    plt.close()

# Process only year 2000 files
for file in sorted(glob.glob("_python/_data/seaice_monthly/*200*01_v02.grib")):
    ds = xr.open_dataset(file, engine='cfgrib')
    
    # Get date info from filename
    filename = os.path.basename(file)
    year_month = filename.split('_')[5]
    date_str = f"{year_month[:4]}-{year_month[4:6]}"
    
    # Create image
    create_seaice_image(
        ds['siconc'].values,
        ds.latitude.values,
        ds.longitude.values,
        date_str
    )
    
    print(f"Created sea ice image for {date_str}")