#!/bin/sh
# Copy assets to BOTH locations to ensure they're available at all paths

echo "===== COPYING ASSETS ====="

# Create both directory structures
mkdir -p dist/assets/textures/seaice dist/assets/backgrounds
mkdir -p dist/public dist/public/assets/textures/seaice dist/public/assets/backgrounds

# Create .nojekyll file for GitHub Pages (both in root and /public)
echo "Creating .nojekyll files..."
echo "" > dist/.nojekyll
echo "" > dist/public/.nojekyll
ls -la dist/.nojekyll
ls -la dist/public/.nojekyll
echo "Created .nojekyll files to disable GitHub Pages Jekyll processing"

# Create output directories
mkdir -p dist/output/normal/temperature_overlays_normal_2010_feb
mkdir -p dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb

# Copy favicon
echo "Copying favicon..."
cp public/favicon.ico dist/
cp public/favicon.ico dist/public/ 2>/dev/null || :

# Remove old favicon files
echo "Removing old favicon files..."
rm -f dist/sagelabs-favicon.png
rm -f dist/assets/sagelabs-favicon.png

# Core textures - copy only what's needed
echo "Copying core textures..."
cp public/assets/textures/2_no_clouds_8k_no_seaice.jpg dist/assets/textures/
cp public/assets/textures/rodinia_unpix.png dist/assets/textures/
cp public/assets/textures/seaice/*.png dist/assets/textures/seaice/

# Backgrounds
echo "Copying backgrounds..."
cp public/assets/backgrounds/*.webp dist/assets/backgrounds/

# Copy output directory data files
echo "Copying output data files..."
if [ -d "_output" ]; then
  echo "Found _output directory, copying contents..."
  cp -R _output/normal/temperature_overlays_normal_2010_feb/* dist/output/normal/temperature_overlays_normal_2010_feb/ 2>/dev/null || :
  cp -R _output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/* dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/ 2>/dev/null || :
elif [ -d "output" ]; then
  echo "Found output directory, copying contents..."
  cp -R output/normal/temperature_overlays_normal_2010_feb/* dist/output/normal/temperature_overlays_normal_2010_feb/ 2>/dev/null || :
  cp -R output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/* dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/ 2>/dev/null || :
else
  echo "No output directories found - creating empty placeholder files for temperature overlays"
  for i in $(seq -f "%02g" 1 14); do
    touch "dist/output/normal/temperature_overlays_normal_2010_feb/temp_2010-02-$i.png"
    touch "dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/jetstream_traj_2010-02-${i}T00:00:00.000000000_aligned.csv"
  done
fi

# Create empty texture files that GitHub Pages is requesting
echo "Creating empty texture files for GitHub Pages requests..."
touch dist/public/assets/textures/clouds_transparent_2.png
touch dist/public/assets/textures/water_world_pix.jpg
touch dist/public/assets/textures/2_no_clouds_8k.jpg
touch dist/public/assets/textures/2_no_clouds_8k_no_seaice.png
touch dist/public/assets/sagelabs-favicon.png

# Copy all textures to BOTH locations
echo "Copying textures to both paths..."
cp -R public/assets/* dist/assets/
cp -R public/assets/* dist/public/assets/

# Create build marker
echo "{\"buildTime\": \"$(date)\", \"version\": \"1.0.11\"}" > dist/build-info.json

# Verify directories
echo "===== VERIFICATION ====="
echo "Files in dist/public/assets:"
find dist/public/assets -type f | wc -l
echo "Files in dist/assets:"
find dist/assets -type f | wc -l
echo "Files in dist/output:"
find dist/output -type f | wc -l 2>/dev/null || echo "0"

echo "===== ASSET COPYING COMPLETE =====" 