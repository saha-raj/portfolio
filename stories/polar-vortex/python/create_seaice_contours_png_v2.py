import xarray as xr
import glob
import os
import numpy as np
import matplotlib.pyplot as plt

# Additional imports for mask creation
import cartopy.io.shapereader as shpreader
from shapely.geometry import mapping
import rasterio
from rasterio.features import rasterize


def create_land_mask(lat, lon, resolution="110m"):
    """
    Create a 2D land mask (land=1, ocean=0) by rasterizing the Natural Earth
    'land' polygons onto the given lat-lon grid.

    lat, lon should be 1D arrays. This function returns a 2D numpy array
    (same shape as [len(lat), len(lon)]).
    """
    # Load Natural Earth land polygons via Cartopy
    shpfilename = shpreader.natural_earth(
        resolution=resolution, category="physical", name="land"
    )
    land_geometries = list(shpreader.Reader(shpfilename).geometries())

    # Approximate lat/lon spacing
    lat_res = abs(lat[1] - lat[0])  # spacing between consecutive lat points
    lon_res = abs(lon[1] - lon[0])  # spacing between consecutive lon points

    # Set up an affine transform for rasterio
    # - If your lat array is in descending order, this is typical for global data.
    #   Adjust accordingly if lat is ascending.
    transform = rasterio.transform.from_origin(
        west=lon[0], north=lat[0], xsize=lon_res, ysize=lat_res
    )

    # Prepare an empty array for the land mask
    height = len(lat)
    width = len(lon)
    out_shape = (height, width)

    # Rasterize: polygon area -> 1, background -> 0
    land_mask = rasterize(
        ((geom, 1) for geom in land_geometries),
        out_shape=out_shape,
        fill=0,  # ocean
        transform=transform,
        dtype=np.uint8,
    )

    return land_mask


def create_seaice_image(data, lats, lons, date_str, land_mask=None):
    """Create an equirectangular projection image of sea ice concentration.
    If land_mask is provided, set land pixels to NaN before plotting."""

    # If we have a land mask, set sea ice to NaN over land
    # land=1 means set that location to NaN (so it won't show up in final plot).
    if land_mask is not None:
        data = np.where(land_mask == 1, np.nan, data)

    # Create figure with specific size for equirectangular projection
    plt.figure(figsize=(20, 10))  # 2:1 aspect ratio for equirectangular

    # Roll the data array to shift 180° to left edge
    data = np.roll(data, data.shape[1] // 2, axis=1)

    # Create a masked array where ocean (low concentration) is transparent
    masked_data = np.ma.masked_where(
        data < 0.15, data
    )  # Mask values below 15% concentration

    # Plot
    plt.imshow(
        masked_data,
        extent=[180, -180, -90, 90],  # Set lon extent from 180 to -180
        cmap="Greys_r",  # White ice on transparent background
        vmin=0,
        vmax=1,
    )

    plt.axis("off")  # Remove axes

    # Save with transparency
    output_file = f"public/assets/textures/seaice/seaice_{date_str}.png"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    plt.savefig(
        output_file, bbox_inches="tight", pad_inches=0, transparent=True, dpi=300
    )
    plt.close()

import numpy as np
from scipy.ndimage import binary_erosion, binary_dilation


def smooth_land_mask(land_mask, iterations=1, method="erosion"):
    """
    Apply morphological operations to shrink or expand the land mask.

    land_mask: 2D array (1 = land, 0 = ocean).
    iterations: how many times to apply the operation.
    method: 'erosion' or 'dilation'.
    """
    # Convert to boolean for morphological ops
    mask_bool = land_mask.astype(bool)

    struct = np.ones((3, 3), dtype=bool)  # 3x3 structuring element

    if method == "erosion":
        # Erode land inward (remove 1-pixel ring of coast)
        for _ in range(iterations):
            mask_bool = binary_erosion(mask_bool, structure=struct)
    elif method == "dilation":
        # Dilate land outward (add 1-pixel ring into ocean)
        for _ in range(iterations):
            mask_bool = binary_dilation(mask_bool, structure=struct)

    # Return to 0/1 array
    return mask_bool.astype(np.uint8)


# -----------------------------------------------------------------------
# MAIN SCRIPT TO PROCESS FILES & CREATE IMAGES
# -----------------------------------------------------------------------

# Process only year 2000 files (change the pattern as needed)
for file in sorted(glob.glob("_python/_data/seaice_monthly/*2000*01_v02.grib")):
    ds = xr.open_dataset(file, engine="cfgrib")

    # Get date info from filename
    filename = os.path.basename(file)
    year_month = filename.split("_")[5]
    date_str = f"{year_month[:4]}-{year_month[4:6]}"

    # Extract data arrays
    sea_ice_data = ds["siconc"].values  # shape: [lat, lon]
    lats = ds["latitude"].values
    lons = ds["longitude"].values

    # Create a land mask on the first iteration (assuming lat/lon consistent across all)
    # If lat/lon change across files, you'll need to recreate the mask each time.
    if not "land_mask" in locals():
        land_mask = create_land_mask(lats, lons, resolution="110m")

    # land_mask is initially 1=land, 0=ocean
    land_mask = create_land_mask(lats, lons, resolution='110m')

    # Erode land by 1 pixel:
    land_mask = smooth_land_mask(land_mask, iterations=1, method='erosion')

    # Now apply the mask when plotting
    create_seaice_image(
        sea_ice_data,
        lats,
        lons,
        date_str,
        land_mask=land_mask
    )


    # Create image using the land mask
    create_seaice_image(sea_ice_data, lats, lons, date_str, land_mask=land_mask)

    print(f"Created sea ice image for {date_str}")
