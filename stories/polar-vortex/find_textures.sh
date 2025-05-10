#!/bin/bash
echo "Searching for texture references..."
echo "----------------------------------------"

TEXTURES=(
    "clouds_transparent"
    "1_earth_8k"
    "cartoon"
    "water_world_pix"
)

for texture in "${TEXTURES[@]}"; do
    echo "Looking for references to: $texture"
    echo "----------------------------------------"
    grep -r "$texture" src/
    echo "----------------------------------------"
done