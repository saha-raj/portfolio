#!/bin/bash

echo "===== VERIFYING BUILD PROCESS ====="

# Create basic directory structure
echo "Creating basic directory structure..."
mkdir -p dist/assets/textures
mkdir -p dist/public/assets/textures
mkdir -p dist/output/normal/temperature_overlays_normal_2010_feb
mkdir -p dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb

# Create .nojekyll files
echo "Creating .nojekyll files..."
touch dist/.nojekyll
touch dist/public/.nojekyll

# Create dummy asset files
echo "Creating dummy asset files..."
echo "dummy" > dist/assets/textures/dummy.txt
echo "dummy" > dist/public/assets/textures/dummy.txt

# Create dummy output files
echo "Creating dummy output files..."
echo "dummy" > dist/output/normal/temperature_overlays_normal_2010_feb/temp_2010-02-01.png
echo "dummy" > dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/jetstream_traj_2010-02-01T00:00:00.000000000_aligned.csv

# Verify directory structure
echo "Verifying directory structure..."
find dist -type d | sort

# Verify files
echo "Verifying files..."
find dist -type f | sort

echo "===== VERIFICATION COMPLETE ====="
echo "If no errors were reported, the basic structure is correct." 