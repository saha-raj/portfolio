import xarray as xr
import numpy as np


def calculate_pvi(ds, level=50):
    """
    Calculate daily Polar Vortex Index at specified pressure level

    Parameters:
    -----------
    ds : xarray.Dataset
        Dataset containing geopotential height ('z') variable
    level : int
        Pressure level in hPa (default 50)
    """
    # Select level and polar cap region (65°N-90°N)
    z = ds.z.sel(pressure_level=level)
    z_polar = z.sel(latitude=slice(90, 65))  # Note: your latitude goes from 90 to 0

    # Calculate area weights (cos(latitude))
    weights = np.cos(np.deg2rad(z_polar.latitude))
    weights = weights / weights.sum()

    # Calculate area-weighted mean over polar cap
    z_cap = (z_polar * weights).sum(dim="latitude").sum(dim="longitude")

    # Since we only have 2 days of data, we can't compute climatology
    # Instead, let's just return the area-weighted mean for now
    return z_cap


def main():
    # Read the NetCDF file
    ds = xr.open_dataset("_python/temp_downloads/data_2000.nc")

    # Print pressure levels available
    print("Available pressure levels:", ds.pressure_level.values)

    # Calculate area-weighted mean for both days
    z_cap = calculate_pvi(ds)

    # Print results
    for time, value in zip(z_cap.valid_time.values, z_cap.values):
        print(f"Date: {np.datetime_as_string(time, unit='D')}, Value: {value:.2f}")


if __name__ == "__main__":
    main()
