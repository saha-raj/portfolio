import * as THREE from 'three';
import * as d3 from 'd3';

export function createSeaIceLayerOLD(year, radius = 1.01, opacity = 0.8, color = 0xffffff) {
    const group = new THREE.Group();
    
    d3.json(`data/seaice_geojson/${year}.json`)
        .then(data => {
            const gridSize = 360; // Higher resolution
            const concentrationGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
            
            // Fill the grid with normalized coordinates and smooth the data
            data.features.forEach(feature => {
                let [lon, lat] = feature.geometry.coordinates;
                const concentration = feature.properties.concentration;
                
                // Normalize longitude to -180 to 180
                lon = lon > 180 ? lon - 360 : lon;
                
                // Convert to grid indices with sub-pixel precision
                const latIdx = ((90 - lat) * (gridSize/180));
                const lonIdx = ((180 + lon) * (gridSize/360));
                
                // Apply gaussian blur to each point
                const blurRadius = 3;
                const sigma = 1.5;
                
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                    for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                        const targetLatIdx = Math.floor(latIdx + dy);
                        const targetLonIdx = Math.floor(lonIdx + dx);
                        
                        // Handle wraparound for longitude
                        const wrappedLonIdx = ((targetLonIdx + gridSize) % gridSize);
                        
                        if (targetLatIdx >= 0 && targetLatIdx < gridSize) {
                            // Gaussian weight
                            const dist2 = (dx * dx + dy * dy);
                            const weight = Math.exp(-dist2 / (2 * sigma * sigma));
                            
                            concentrationGrid[targetLatIdx][wrappedLonIdx] = Math.max(
                                concentrationGrid[targetLatIdx][wrappedLonIdx],
                                concentration * weight
                            );
                        }
                    }
                }
            });

            const positions = [];
            const indices = [];
            let vertexIndex = 0;

            // Create triangles with adaptive resolution
            for (let latIdx = 0; latIdx < gridSize-1; latIdx += 1) {
                for (let lonIdx = 0; lonIdx < gridSize-1; lonIdx += 1) {
                    const concentration = concentrationGrid[latIdx][lonIdx];
                    const lat = 90 - (latIdx * 180/gridSize);
                    
                    if (concentration > 0.15 && Math.abs(lat) > 60) {
                        // Get concentrations at corners
                        const c00 = concentration;
                        const c10 = concentrationGrid[latIdx][lonIdx + 1] || 0;
                        const c01 = concentrationGrid[latIdx + 1][lonIdx] || 0;
                        const c11 = concentrationGrid[latIdx + 1][lonIdx + 1] || 0;
                        
                        // Only create geometry if there's a significant gradient
                        if (Math.max(c00, c10, c01, c11) - Math.min(c00, c10, c01, c11) > 0.1) {
                            // Create vertices for this cell
                            for (let corner = 0; corner < 4; corner++) {
                                const cornerLat = latIdx + (corner & 2 ? 1 : 0);
                                const cornerLon = lonIdx + (corner & 1 ? 1 : 0);
                                
                                const lat = 90 - (cornerLat * 180/gridSize);
                                const lon = ((cornerLon * 360/gridSize) - 180) + 180;
                                
                                const phi = lat * Math.PI / 180;
                                const theta = lon * Math.PI / 180;
                                
                                positions.push(
                                    -radius * Math.cos(phi) * Math.cos(theta),
                                    radius * Math.sin(phi),
                                    radius * Math.cos(phi) * Math.sin(theta)
                                );
                            }

                            // Create triangles
                            indices.push(
                                vertexIndex, vertexIndex + 2, vertexIndex + 1,
                                vertexIndex + 1, vertexIndex + 2, vertexIndex + 3
                            );
                            
                            vertexIndex += 4;
                        }
                    }
                }
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity * 0.5,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        });

    group.visible = false;
    return group;
} 

export function createSeaIceLayer(year, radius = 1.01, opacity = 0.8, color = 0xffffff) {
    const group = new THREE.Group();

    // Create a simple sphere geometry slightly larger than the Earth
    const geometry = new THREE.SphereGeometry(radius, 64, 32);

    // Load the sea ice texture
    const textureLoader = new THREE.TextureLoader();
    const iceTexture = textureLoader.load(`${import.meta.env.BASE_URL}assets/textures/seaice/seaice_${year}.png`);

    const material = new THREE.MeshBasicMaterial({
        map: iceTexture,
        transparent: true,
        opacity: opacity,
        color: color,
        side: THREE.FrontSide,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    group.visible = false;

    return group;
}