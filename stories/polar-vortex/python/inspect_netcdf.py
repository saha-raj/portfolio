import xarray as xr

def print_netcdf_info(filepath):
    """Print detailed information about a netCDF file's structure"""
    ds = xr.open_dataset(filepath)
    print(f"\nFile: {filepath}")
    print("\n=== Dimensions ===")
    print(ds.dims)
    print("\n=== Variables ===")
    print(ds.variables)
    print("\n=== Coordinates ===")
    print(ds.coords)
    print("\n=== First few time values (if exists) ===")
    if 'time' in ds.coords:
        print(ds.time.values[:5])
    elif 'valid_time' in ds.coords:
        print(ds.valid_time.values[:5])
    print("\n=== Data Variables ===")
    print(ds.data_vars)
    ds.close()

if __name__ == "__main__":
    year = 2001
    print_netcdf_info(f"_data/u_wind_{year}.nc")
    print_netcdf_info(f"_data/v_wind_{year}.nc") 
    print_netcdf_info(f"_data/temperature_{year}.nc")
