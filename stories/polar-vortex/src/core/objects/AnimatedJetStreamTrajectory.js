import * as THREE from 'three';
import * as d3 from 'd3';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export function createAnimatedJetStreamTrajectory(radius = 1.01, opacity = 0.8, color = 0xffffff) {
    console.log("Creating animated jet stream");
    const group = new THREE.Group();
    const years = ['2001', '2002', '2003'];
    const streams = new Map();
    
    years.forEach(year => {
        console.log(`Loading data for year ${year}`);
        const geometry = new LineGeometry();
        const material = new LineMaterial({
            color: color,
            linewidth: 5,
            transparent: true,
            opacity: 0,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            dashed: false,
            alphaToCoverage: false,
            depthWrite: false,
            depthTest: true
        });

        const jetStreamMesh = new Line2(geometry, material);
        jetStreamMesh.visible = true;
        jetStreamMesh.renderOrder = 1;
        
        d3.csv(`${import.meta.env.BASE_URL}python/output/traj/jetstream_traj_${year}-01-01T00:00:00.000000000.csv`)
            .then(data => {
                console.log(`Loaded data for year ${year}, points: ${data.length}`);
                const positions = [];
                data.forEach(d => {
                    const lon = parseFloat(d.longitude);
                    const lat = parseFloat(d.latitude);
                    const phi = (90 - lat) * Math.PI / 180;
                    const theta = (lon + 180) * Math.PI / 180;

                    positions.push(
                        -radius * Math.sin(phi) * Math.cos(theta),
                        radius * Math.cos(phi),
                        -radius * Math.sin(phi) * Math.sin(theta)
                    );
                });
                geometry.setPositions(positions);
                jetStreamMesh.computeLineDistances();
                material.needsUpdate = true;
                console.log(`Set up complete for year ${year}`);
            })
            .catch(error => {
                console.error(`Error loading data for year ${year}:`, error);
            });

        streams.set(year, jetStreamMesh);
        group.add(jetStreamMesh);
    });

    window.addEventListener('resize', () => {
        streams.forEach(stream => {
            stream.material.resolution.set(window.innerWidth, window.innerHeight);
        });
    });

    group.visible = true;
    
    // Add standard visibility methods expected by the lifecycle system
    group.show = () => {
        console.log("Show called on animated jet stream group");
        group.visible = true;
    };

    group.hide = () => {
        console.log("Hide called on animated jet stream group");
        group.visible = false;
        streams.forEach(stream => {
            stream.material.opacity = 0;
            stream.material.needsUpdate = true;
        });
    };
    
    // Method for scroll-based opacity control
    group.updateProgress = (progress, year) => {
        console.log(`[DEBUG] updateProgress called with progress: ${progress}, year: ${year}`);
        if (year) {
            const stream = streams.get(year);
            if (stream) {
                stream.visible = true;
                stream.material.opacity = progress;
                stream.material.needsUpdate = true;
                console.log(`[DEBUG] Updated ${year} opacity to ${progress}`);
            } else {
                console.warn(`[DEBUG] No stream found for year ${year}`);
            }
        } else {
            console.warn(`[DEBUG] No year provided for progress update`);
        }
    };

    // Add a debug method
    group.debugStreams = () => {
        console.log('[DEBUG] Current streams:');
        streams.forEach((stream, year) => {
            console.log(`Year ${year}:`, {
                visible: stream.visible,
                opacity: stream.material.opacity
            });
        });
    };

    // Call debug on creation
    setTimeout(() => {
        console.log('[DEBUG] Initial state:');
        group.debugStreams();
    }, 2000);
    
    return group;
} 