import pandas as pd
import numpy as np
import os
from pathlib import Path

def calculate_rotation_angle(start_point, end_point):
    """Calculate angle needed to rotate trajectory so endpoints align"""
    # Get the latitude difference at the endpoints
    delta_lat = end_point[1] - start_point[1]
    
    # Calculate the total longitudinal distance
    delta_lon = end_point[0] - start_point[0]
    
    # Calculate the rotation angle (in radians) and negate it
    rotation_angle = -np.arctan2(delta_lat, delta_lon)
    
    return rotation_angle

def rotate_point(point, pivot, angle):
    """Rotate a point around a pivot point by given angle"""
    # Translate point to origin (subtract pivot)
    translated = point - pivot
    
    # Create rotation matrix
    rotation_matrix = np.array([
        [np.cos(angle), -np.sin(angle)],
        [np.sin(angle), np.cos(angle)]
    ])
    
    # Apply rotation and translate back
    rotated = np.dot(rotation_matrix, translated) + pivot
    
    return rotated

def process_trajectory(df):
    """Process single trajectory with proper rotation about start point"""
    # Get start and end points
    start_point = np.array([df.iloc[0]['longitude'], df.iloc[0]['latitude']])
    end_point = np.array([df.iloc[-1]['longitude'], df.iloc[-1]['latitude']])
    
    # Calculate needed rotation angle
    angle = calculate_rotation_angle(start_point, end_point)
    
    # Create array of points
    points = df[['longitude', 'latitude']].values
    
    # Rotate all points around start point
    rotated_points = np.array([
        rotate_point(point, start_point, angle) 
        for point in points
    ])
    
    # Create new dataframe with rotated points
    df_rotated = pd.DataFrame({
        'longitude': rotated_points[:, 0],
        'latitude': rotated_points[:, 1]
    })
    
    return df_rotated

def process_files(input_dir):
    """Process all trajectory files in the specified directory"""
    input_dir = Path(input_dir)
    
    if not input_dir.exists():
        raise FileNotFoundError(f"Directory {input_dir} not found")
    
    for file_path in input_dir.glob('*.csv'):
        if file_path.stem.endswith('_aligned'):
            continue
            
        try:
            print(f"Processing {file_path.name}")
            
            # Load data
            df = pd.read_csv(file_path)
            
            # Print original endpoints
            print(f"Original start: ({df.iloc[0]['longitude']:.4f}, {df.iloc[0]['latitude']:.4f})")
            print(f"Original end: ({df.iloc[-1]['longitude']:.4f}, {df.iloc[-1]['latitude']:.4f})")
            
            # Apply rotation
            df_aligned = process_trajectory(df)
            
            # Print aligned endpoints
            print(f"Aligned start: ({df_aligned.iloc[0]['longitude']:.4f}, {df_aligned.iloc[0]['latitude']:.4f})")
            print(f"Aligned end: ({df_aligned.iloc[-1]['longitude']:.4f}, {df_aligned.iloc[-1]['latitude']:.4f})")
            
            # Save aligned trajectory in the same directory
            output_path = file_path.parent / f"{file_path.stem}_aligned{file_path.suffix}"
            df_aligned.to_csv(output_path, index=False)
            
        except Exception as e:
            print(f"Error processing {file_path.name}: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Align jet stream trajectories')
    parser.add_argument('input_dir', help='Directory containing trajectory CSV files')
    
    args = parser.parse_args()
    
    try:
        process_files(args.input_dir)
        print("Processing complete!")
    except Exception as e:
        print(f"Error: {str(e)}") 