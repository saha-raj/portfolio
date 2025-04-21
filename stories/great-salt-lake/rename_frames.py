import os
import re

# Path to frames directory
frames_dir = 'assets/images/frames'

# Get all files in frames directory that match the pattern
files = [f for f in os.listdir(frames_dir) if f.startswith('frame_') and f.endswith('_shifted_outlined.jpg')]

# Extract numbers and create pairs of (number, filename)
file_pairs = []
for filename in files:
    match = re.search(r'frame_(\d+)_', filename)
    if match:
        number = int(match.group(1))
        file_pairs.append((number, filename))
    else:
        print(f"Warning: Couldn't extract frame number from {filename}")

# Sort by the extracted number
file_pairs.sort(key=lambda x: x[0])

# Rename files
for index, (_, old_name) in enumerate(file_pairs, 1):
    old_path = os.path.join(frames_dir, old_name)
    new_path = os.path.join(frames_dir, f'{index:03d}.jpg')
    print(f'Renaming {old_name} -> {index:03d}.jpg')
    os.rename(old_path, new_path)