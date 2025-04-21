import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from scipy.ndimage import laplace

# Parameters
LON_POINTS = 256  # Resolution in longitude
LAT_POINTS = 128  # Resolution in latitude
TIME_STEPS = 550  # Number of time steps
DT = 0.05         # Increased significantly
nu = 1e-5         # Reduced diffusion coefficient

# Define the grid
lon = np.linspace(0, 2 * np.pi, LON_POINTS, endpoint=False)  # Longitude
lat = np.linspace(-np.pi / 2, np.pi / 2, LAT_POINTS)         # Latitude
lon_grid, lat_grid = np.meshgrid(lon, lat)

# Initial conditions
z0 = np.sin(lat_grid)  # Unperturbed interface (latitude)
z_prime = 2.0 * np.sin(4 * lon_grid) * np.cos(2 * lat_grid)  # Increased amplitude from 0.8
omega = 0.3 * np.sin(3 * lon_grid) * np.cos(lat_grid)        # Increased from 0.1

# Planetary vorticity (Coriolis parameter)
Omega = 7.2921e-5  # Earth's angular velocity in rad/s
f = 2 * Omega * np.sin(lat_grid)

# Forcing
temp_gradient = 0.5  # Increased from 0.1
F = temp_gradient * np.cos(lat_grid) * np.sin(lon_grid)

# Functions
def advect(field, u, v, dx, dy):
    """Compute the advection term -u · ∇(field)."""
    d_field_x = (np.roll(field, -1, axis=1) - np.roll(field, 1, axis=1)) / (2 * dx)
    d_field_y = (np.roll(field, -1, axis=0) - np.roll(field, 1, axis=0)) / (2 * dy)
    return -(u * d_field_x + v * d_field_y)  # Ensure proper advection

def solve_streamfunction_direct(omega):
    """Solve for streamfunction using an iterative solver (Poisson equation)."""
    psi = np.zeros_like(omega)
    for _ in range(500):  # Increased from 100
        psi_new = laplace(psi) - omega
        psi = 0.95 * psi + 0.05 * psi_new  # More conservative relaxation
        psi = apply_boundary_conditions(psi)
    return psi

def compute_velocity(psi, dx, dy, lat_grid):
    """Compute the velocity field from the streamfunction in spherical geometry."""
    R = 6.371e6  # Earth's radius in meters
    lat_scale = np.cos(lat_grid)
    
    # Scale derivatives by Earth's radius
    u = -(1/R) * np.gradient(psi, axis=0) / dy  # Zonal velocity
    v = (1/R) * np.gradient(psi, axis=1) / (dx * lat_scale)  # Meridional velocity
    
    return u, v

def apply_boundary_conditions(field):
    """Apply periodic and reflective boundary conditions."""
    # Reflective boundary in latitude
    field[0, :] = field[1, :]
    field[-1, :] = field[-2, :]
    # Periodic boundary in longitude
    field[:, 0] = field[:, -2]
    field[:, -1] = field[:, 1]
    return field

def laplacian(field, dx, dy):
    """Compute the Laplacian of a field in spherical coordinates."""
    R = 6.371e6  # Earth's radius in meters
    cos_lat = np.cos(lat_grid)
    
    # Second derivative in longitude (x)
    d2x = (np.roll(field, -1, axis=1) - 2 * field + np.roll(field, 1, axis=1)) 
    d2x = d2x / (dx * dx * cos_lat * cos_lat * R * R)
    
    # First derivative in latitude (y)
    dy1 = (np.roll(field, -1, axis=0) - np.roll(field, 1, axis=0)) / (2 * dy)
    
    # Second derivative in latitude (y)
    d2y = (np.roll(field, -1, axis=0) - 2 * field + np.roll(field, 1, axis=0)) / (dy * dy)
    
    return (1/(R*R)) * (d2x + (1/cos_lat) * dy1 * np.tan(lat_grid) + d2y)

if __name__ == "__main__":
    # Time stepping loop
    dx = lon[1] - lon[0]
    dy = lat[1] - lat[0]
    nu = 1e-4  # Diffusion coefficient
    wavefronts = []

    for t in range(TIME_STEPS):
        # Solve for streamfunction using direct Poisson solver
        psi = solve_streamfunction_direct(omega)
        
        # Compute velocity field
        u, v = compute_velocity(psi, dx, dy, lat_grid)
        
        # Update vorticity with advection, forcing, and diffusion
        adv_omega = advect(omega + f, u, v, dx, dy)  # Include absolute vorticity
        diffusion = nu * laplacian(omega, dx, dy)
        omega += DT * (adv_omega + F + diffusion)
        omega = apply_boundary_conditions(omega)
        
        # Update interface position
        adv_z = advect(z_prime, u, v, dx, dy)
        z_prime -= DT * adv_z
        z_prime = apply_boundary_conditions(z_prime)
        
        # Store wavefront for plotting only every 30th frame
        if t % 30 == 0:
            wavefronts.append(z0 + z_prime)
        
        # Diagnostics (optional)
        if t % 10 == 0:
            print(f"Step {t}, max(omega): {np.max(omega)}, max(z_prime): {np.max(z_prime)}")

    # Animation
    fig, ax = plt.subplots()

    def update(frame):
        ax.clear()
        ax.contourf(lon, lat, wavefronts[frame], levels=20, cmap='viridis')
        ax.set_title(f"Time step: {frame * 30}")  # Multiply by 30 to show actual timestep
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")

    # Adjust number of frames to match saved wavefronts
    num_frames = len(wavefronts)
    ani = FuncAnimation(fig, update, frames=num_frames, repeat=False)

    # Display the animation
    # plt.show()
    ani.save("wavefront_animation.mp4", writer="ffmpeg")
