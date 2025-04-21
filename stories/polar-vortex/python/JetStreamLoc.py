import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.signal import savgol_filter
from scipy.interpolate import CubicSpline

def create_interpolators(u, v):
    """Create fast interpolation functions for u and v wind fields"""
    lats = u.latitude.values
    lons = u.longitude.values
    
    u_interp = RegularGridInterpolator((lats, lons), u.values,
                                      bounds_error=False, fill_value=None)
    v_interp = RegularGridInterpolator((lats, lons), v.values,
                                      bounds_error=False, fill_value=None)
    return u_interp, v_interp

def integrate_streamline(u_interp, v_interp, start_point, dt=360, max_steps=8640*10):
    """Integrate a single streamline through the vector field"""
    trajectory = [start_point]
    point = start_point.copy()
    
    for step in range(max_steps):
        try:
            u_val = float(u_interp([point[1], point[0]]))
            v_val = float(v_interp([point[1], point[0]]))
            
            if np.isnan(u_val) or np.isnan(v_val):
                break
                
            if point[1] <= 0 or point[1] >= 90 or abs(point[0]) >= 180:
                break
                
            lat_rad = np.radians(point[1])
            meters_per_deg_lon = 111000 * np.cos(lat_rad)
            meters_per_deg_lat = 111000
            
            u_meters = u_val * dt
            v_meters = v_val * dt
            
            u_deg = u_meters / meters_per_deg_lon
            v_deg = v_meters / meters_per_deg_lat
            
            new_point = point + np.array([u_deg, v_deg])
            
            if abs(new_point[0]) > 180:
                break
                
            point = new_point
            point[1] = np.clip(point[1], -90, 90)
            
            trajectory.append(point.copy())
            
        except (ValueError, RuntimeError) as e:
            break
            
    return np.array(trajectory)

def compute_endpoint_deviation(trajectory, initial_lat):
    """Compute how close the trajectory comes to its initial latitude at 180°"""
    if len(trajectory) < 2:
        return float('inf')
    
    east_points = trajectory[trajectory[:, 0] >= 179]
    if len(east_points) == 0:
        return float('inf')
    
    lon_span = np.max(trajectory[:, 0]) - np.min(trajectory[:, 0])
    if lon_span < 300:
        return float('inf')
    
    lat_deviations = abs(east_points[:, 1] - initial_lat)
    return np.min(lat_deviations)

def compute_temp_deviation(trajectory, temp_field, target_temp=-16):
    """Compute average deviation from target temperature along trajectory in Western Hemisphere"""
    if len(trajectory) < 2:
        return float('inf')
    
    lats = temp_field.latitude.values
    lons = temp_field.longitude.values
    temp_interp = RegularGridInterpolator((lats, lons), temp_field.values,
                                         bounds_error=False, fill_value=None)
    
    deviations = []
    for point in trajectory:
        # Only consider points in Western Hemisphere (-180 to 0)
        if -180 <= point[0] <= 0:
            try:
                temp = float(temp_interp([point[1], point[0]]))
                if not np.isnan(temp):
                    deviations.append(abs(temp - target_temp))
            except ValueError:
                continue
    
    return np.mean(deviations) if deviations else float('inf')

def smooth_endpoint_connection(trajectory):
    """Smooth trajectory using cubic spline for endpoints and Savitzky-Golay filter overall"""
    # Find points near 180° (both east and west)
    buffer = 5  # degrees from 180°
    east_mask = trajectory[:, 0] >= (180 - buffer)
    west_mask = trajectory[:, 0] <= (-180 + buffer)
    
    if any(east_mask) and any(west_mask):
        # Get indices for spline region
        east_idx = np.where(east_mask)[0]
        west_idx = np.where(west_mask)[0]
        
        # Create spline region
        spline_region = np.concatenate([west_idx, east_idx])
        spline_lons = trajectory[spline_region, 0]
        spline_lats = trajectory[spline_region, 1]
        
        # Create and evaluate cubic spline
        cs = CubicSpline(spline_lons, spline_lats, bc_type='natural')
        trajectory[spline_region, 1] = cs(spline_lons)
    
    # Apply Savitzky-Golay filter to entire trajectory
    trajectory[:, 1] = savgol_filter(trajectory[:, 1], window_length=51, polyorder=5)
    
    return trajectory

def find_temp_crossings(temp_field, target_temp=-16):
    """Find latitudes where target temperature crosses 180° longitude"""
    # Get temperature values along 180° longitude (or closest to it)
    lons = temp_field.longitude.values
    lon_idx = np.argmin(np.abs(lons - 180))  # Find closest to 180°
    lon_180 = lons[lon_idx]
    
    temp_slice = temp_field.sel(longitude=lon_180)
    
    # Find where temperature crosses target value
    temp_diff = temp_slice - target_temp
    crossings = []
    
    # Find sign changes in temperature difference
    for i in range(len(temp_diff)-1):
        if temp_diff[i] * temp_diff[i+1] <= 0:
            crossings.append(temp_diff.latitude.values[i])
    
    if not crossings:
        print(f"Debug: No crossings found. Temperature range at {lon_180}°E: {temp_slice.min().values:.1f}°C to {temp_slice.max().values:.1f}°C")
        return None
    
    # Return midpoint
    mid_lat = np.mean(crossings)
    print(f"Debug: Found crossing at {mid_lat:.1f}°N")
    return mid_lat 