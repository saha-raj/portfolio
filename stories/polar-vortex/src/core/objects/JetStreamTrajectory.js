import * as THREE from 'three';
import * as d3 from 'd3';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export function createJetStreamTrajectory(year, radius = 1.01, opacity = 1, color = 0xffffff, isNormalDay = false) {
    const geometry = new LineGeometry();
    const material = new LineMaterial({
        color: color,
        linewidth: 8,
        transparent: true,
        opacity: opacity,
        depthWrite: false,  // Prevent z-fighting between line segments
        depthTest: true,    // Still test against other objects
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });

    const jetStreamMesh = new Line2(geometry, material);
    
    // Create group to hold both line and points
    const group = new THREE.Group();
    group.add(jetStreamMesh);
    
    // Create points for animation
    const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({
        color: 0x42a5f5,
        transparent: false,
        opacity: 0.05
    });
    
    const points = [];
    const NUM_POINTS = 50;

    // Load from appropriate directory
    let dataPath;
    // For February 2010 data
    if (year.startsWith('2010-02')) {
        // First try the aligned file
        const alignedPath = `${import.meta.env.BASE_URL}output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/jetstream_traj_${year}_aligned.csv`;
        const originalPath = `${import.meta.env.BASE_URL}output/normal/jetstream_trajectories_ALIGNED_normal_2010_feb/jetstream_traj_${year}.csv`;
        dataPath = alignedPath;
        
        // Log which file we're trying to load
        console.log('Attempting to load jet stream data from:', dataPath);
    } else {
        console.error('No valid data path for year:', year);
        return group;
    }

    if (!dataPath) {
        console.error('No valid data path for year:', year);
        return group;
    }

    d3.csv(dataPath)
        .then(data => {
            if (!data || data.length === 0) {
                console.error('No data loaded from:', dataPath);
                return;
            }

            console.log(`Successfully loaded ${data.length} points for jet stream from ${dataPath}`);
            console.log('Sample data point:', data[0]);

            const positions = [];
            const cumulativeDistances = [0];  // Track actual distances along path
            let totalDistance = 0;
            
            // First point
            let lastPoint = null;
            
            data.forEach((d, index) => {
                const lon = parseFloat(d.longitude);
                const lat = parseFloat(d.latitude);
                
                // Add validation to check for NaN values
                if (isNaN(lon) || isNaN(lat)) {
                    console.error(`Invalid coordinates at index ${index}:`, d);
                    return; // Skip this point
                }

                const phi = (90 - lat) * Math.PI / 180;
                const theta = (lon + 180) * Math.PI / 180;

                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(theta);
                
                // Validate calculated positions
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    console.error(`Calculated NaN position at index ${index}:`, {
                        lon, lat, phi, theta, x, y, z
                    });
                    return; // Skip this point
                }
                
                positions.push(x, y, z);
                
                // Calculate cumulative distance
                if (lastPoint) {
                    const distance = Math.sqrt(
                        Math.pow(x - lastPoint.x, 2) +
                        Math.pow(y - lastPoint.y, 2) +
                        Math.pow(z - lastPoint.z, 2)
                    );
                    totalDistance += distance;
                    cumulativeDistances.push(totalDistance);
                }
                lastPoint = {x, y, z};
            });

            // Validate final positions array
            if (positions.length === 0) {
                console.error('No valid positions generated for:', dataPath);
                return;
            }

            console.log(`Generated ${positions.length / 3} valid positions`);
            
            // Reverse the positions array to make animation go west to east
            const reversedPositions = [];
            for (let i = positions.length - 3; i >= 0; i -= 3) {
                reversedPositions.push(positions[i], positions[i + 1], positions[i + 2]);
            }
            
            geometry.setPositions(reversedPositions);
            
            // Create points along the path
            for (let i = 0; i < NUM_POINTS; i++) {
                const point = new THREE.Mesh(pointGeometry, pointMaterial.clone());
                points.push(point);
                group.add(point);
            }
            
            // Recalculate cumulative distances for reversed positions
            const newCumulativeDistances = [0];
            let newTotalDistance = 0;
            
            for (let i = 0; i < reversedPositions.length - 3; i += 3) {
                const p1 = {
                    x: reversedPositions[i],
                    y: reversedPositions[i + 1],
                    z: reversedPositions[i + 2]
                };
                const p2 = {
                    x: reversedPositions[i + 3],
                    y: reversedPositions[i + 4],
                    z: reversedPositions[i + 5]
                };
                
                const distance = Math.sqrt(
                    Math.pow(p2.x - p1.x, 2) +
                    Math.pow(p2.y - p1.y, 2) +
                    Math.pow(p2.z - p1.z, 2)
                );
                newTotalDistance += distance;
                newCumulativeDistances.push(newTotalDistance);
            }
            
            // Store data for animation using reversed positions
            group.userData.positions = reversedPositions;
            group.userData.points = points;
            group.userData.totalDistance = newTotalDistance;
            group.userData.cumulativeDistances = newCumulativeDistances;

            // Function to update point positions
            const updatePointPositions = (time) => {
                points.forEach((point, i) => {
                    const t = ((time + i / NUM_POINTS) % 1);  // Offset each point in time
                    const targetDistance = t * newTotalDistance;
                    
                    // Find the segment containing this distance
                    let segmentIndex = 0;
                    while (segmentIndex < newCumulativeDistances.length - 1 && 
                           newCumulativeDistances[segmentIndex + 1] < targetDistance) {
                        segmentIndex++;
                    }
                    
                    // Get position within segment
                    const segmentStart = newCumulativeDistances[segmentIndex];
                    const segmentEnd = newCumulativeDistances[segmentIndex + 1];
                    const segmentLength = segmentEnd - segmentStart;
                    const segmentProgress = (targetDistance - segmentStart) / segmentLength;
                    
                    // Get start and end positions of segment
                    const startPos = {
                        x: reversedPositions[segmentIndex * 3],
                        y: reversedPositions[segmentIndex * 3 + 1],
                        z: reversedPositions[segmentIndex * 3 + 2]
                    };
                    const endPos = {
                        x: reversedPositions[(segmentIndex + 1) * 3],
                        y: reversedPositions[(segmentIndex + 1) * 3 + 1],
                        z: reversedPositions[(segmentIndex + 1) * 3 + 2]
                    };
                    
                    // Interpolate position
                    point.position.set(
                        startPos.x + (endPos.x - startPos.x) * segmentProgress,
                        startPos.y + (endPos.y - startPos.y) * segmentProgress,
                        startPos.z + (endPos.z - startPos.z) * segmentProgress
                    );
                });
            };

            // Store animation function
            group.userData.animate = (time) => {
                updatePointPositions(time);
            };
        })
        .catch(error => {
            console.error('Error loading jet stream data:', error);
        });

    // Handle window resize
    window.addEventListener('resize', () => {
        material.resolution.set(window.innerWidth, window.innerHeight);
    });

    group.visible = false;
    return group;
} 