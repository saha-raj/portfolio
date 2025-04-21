#!/bin/bash
# This script ensures .nojekyll files are correctly placed in the dist directory
set -e

echo "====== FIXING .nojekyll FILES ======"

echo "Ensuring dist directory exists..."
mkdir -p dist
mkdir -p dist/public

echo "Debugging: Current directory structure..."
pwd
find . -type d -maxdepth 2 | sort

echo "Creating .nojekyll files with echo commands..."
# Create the root dist/.nojekyll file
echo "" > dist/.nojekyll
chmod 644 dist/.nojekyll

# Create the dist/public/.nojekyll file
echo "" > dist/public/.nojekyll  
chmod 644 dist/public/.nojekyll

echo "Verifying .nojekyll files..."
ls -la dist/.nojekyll || echo "dist/.nojekyll missing!"
ls -la dist/public/.nojekyll || echo "dist/public/.nojekyll missing!"

# Copy from public if exists
if [ -f "public/.nojekyll" ]; then
  echo "Found public/.nojekyll, copying to dist..."
  cp -f public/.nojekyll dist/
  cp -f public/.nojekyll dist/public/
fi

echo "Final verification..."
find dist -name ".nojekyll" | sort
echo "====== .nojekyll FIX COMPLETE ======" 