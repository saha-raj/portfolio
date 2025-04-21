#!/bin/bash
set -e  # Exit immediately if a command fails

echo "===== SIMULATING GITHUB ACTIONS BUILD PROCESS ====="

# Clean up any previous test
echo "Cleaning up previous test..."
rm -rf test-dist
rm -rf test-build

# Create the test directory structure
mkdir -p test-build

# Step 1: Clone the current state (like GitHub checkout action)
echo "Step 1: Cloning current state to test directory..."
# Instead of clone, we'll copy the relevant files
mkdir -p test-build/src
mkdir -p test-build/public
cp -R src test-build/
cp -R public test-build/
cp package.json test-build/
cp package-lock.json test-build/
cp vite.config.js test-build/
cp index.html test-build/
cp asset-test.html test-build/ 2>/dev/null || :
cp copy-assets.sh test-build/
cp .github/workflows/deploy.yml test-build/ 2>/dev/null || :

# Step 2: Enter the test directory
cd test-build

# Step 3: Setup (like GitHub Actions setup steps)
echo "Step 3: Setting up environment..."
# We're using the local Node installation

# Step 4: Create basic directory structure (like in GitHub Actions)
echo "Step 4: Creating basic directory structure..."
mkdir -p dist
mkdir -p dist/public
echo "Creating .nojekyll files with echo..."
echo "" > dist/.nojekyll
echo "" > dist/public/.nojekyll
echo "Verifying .nojekyll files:"
ls -la dist/.nojekyll
ls -la dist/public/.nojekyll

# Step 5: Install dependencies (like in GitHub Actions)
echo "Step 5: Installing dependencies..."
npm ci

# Step 6: Run the build (like in GitHub Actions)
echo "Step 6: Running build..."
npm run build

# Step 6.5: Double-check .nojekyll files after build
echo "Step 6.5: Double-checking .nojekyll files after build..."
if [ ! -f "dist/.nojekyll" ]; then
  echo "⚠️ dist/.nojekyll is missing, recreating..."
  echo "" > dist/.nojekyll
else
  echo "✅ dist/.nojekyll exists"
fi

if [ ! -f "dist/public/.nojekyll" ]; then
  echo "⚠️ dist/public/.nojekyll is missing, recreating..."
  echo "" > dist/public/.nojekyll
else
  echo "✅ dist/public/.nojekyll exists"
fi

echo "Final verification of .nojekyll files:"
ls -la dist/.nojekyll
ls -la dist/public/.nojekyll

# Step 7: Debug directories (like in GitHub Actions)
echo "Step 7: Debugging directories..."
echo "Listing build directories..."
ls -la dist/ || echo "No dist directory"
ls -la dist/public/ || echo "No dist/public directory"
ls -la public/ || echo "No public directory"

echo "Checking .nojekyll files..."
test -f dist/.nojekyll && echo "dist/.nojekyll exists" || echo "dist/.nojekyll missing"
test -f dist/public/.nojekyll && echo "dist/public/.nojekyll exists" || echo "dist/public/.nojekyll missing"

# Step 8: Debug file structure (like in GitHub Actions)
echo "Step 8: Debugging file structure..."
echo "=== Files in dist ==="
find dist -type f | grep -v "node_modules" | sort
echo "=== Files in dist/output ==="
find dist/output -type f 2>/dev/null || echo "No output files found"

# Step 9: Check for critical files
echo "Step 9: Checking for critical files..."
echo "Checking for index.html..."
test -f dist/index.html && echo "✅ dist/index.html exists" || echo "❌ dist/index.html missing"

echo "Checking for favicon..."
test -f dist/favicon.ico && echo "✅ dist/favicon.ico exists" || echo "❌ dist/favicon.ico missing"

echo "Checking for earth texture..."
test -f dist/assets/textures/2_no_clouds_8k_no_seaice.jpg && echo "✅ dist/assets/textures/2_no_clouds_8k_no_seaice.jpg exists" || echo "❌ dist/assets/textures/2_no_clouds_8k_no_seaice.jpg missing"

echo "Checking for output directories..."
test -d dist/output/normal/temperature_overlays_normal_2010_feb && echo "✅ Temperature overlays directory exists" || echo "❌ Temperature overlays directory missing"
test -d dist/output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb && echo "✅ Jetstream trajectories directory exists" || echo "❌ Jetstream trajectories directory missing"

# Return to original directory
cd ..

echo "===== TEST COMPLETED ====="
echo "Results can be found in the test-build/dist directory" 