import * as THREE from 'three';
import { PotentialPlot } from './PotentialPlot.js';
import { MODEL_PARAMS } from '../simulation/constants.js';
import { marked } from '../../../public/assets/lib/marked.esm.js';
import { createIceGroup } from './ice.js';


export class ObjectFactory {
    static createObject(config) {
        switch(config.type) {
            case '3dObject':
                return this.create3DObject(config);
            case 'intro-header':     // Changed from titleText
            case 'intro-description':// Added new type            case 'header':
            case 'header':
            case 'description':
            case 'annotation':
                return this.createText(config);
            case 'button':
                return this.createButton(config);
            case 'sim-controls':
                return this.createSimControls(config);
            case 'sim-v-plot':
                return this.createVPlot(config);
            default:
                console.warn(`Unknown object type: ${config.type}`);
                return null;
        }
    }

    static createText(config) {
        const element = document.createElement('div');
        
        // First convert markdown to HTML, but preserve LaTeX delimiters
        const tempContent = config.content.replace(/\$\$(.*?)\$\$|\$(.*?)\$/g, match => {
            // Replace LaTeX with a temporary placeholder
            return `###LATEX${encodeURIComponent(match)}###`;
        });
        
        // Parse markdown
        let htmlContent = marked.parse(tempContent);
        
        // Restore LaTeX
        htmlContent = htmlContent.replace(/###LATEX(.*?)###/g, match => {
            return decodeURIComponent(match.replace('###LATEX', '').replace('###', ''));
        });
        
        element.innerHTML = htmlContent;
        
        // Process LaTeX if present
        if (htmlContent.match(/\$\$(.*?)\$\$|\$(.*?)\$/)) {
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise([element]).catch((err) => {
                    console.warn('MathJax processing failed:', err);
                });
            }
        }
        
        element.className = `text-element text-type-${config.type}`;
        return {
            type: 'text',
            element: element
        };
    }

    static create3DObject(config) {
        if (config.id === 'earth') {
            const geometry = new THREE.SphereGeometry(1, 64, 64);
            
            // Load texture
            const textureLoader = new THREE.TextureLoader();
            // const earthTexture = textureLoader.load('public/assets/textures/earth_noClouds.0330_cutout.jpg');
            const earthTexture = textureLoader.load('public/assets/textures/1_earth_8k.jpg');


            const material = new THREE.MeshPhongMaterial({
                map: earthTexture,
                // shininess: 30,
                // emissive: 0x4f9aff,
                // emissiveIntensity: 0.3,

            });
            const earthMesh = new THREE.Mesh(geometry, material);
            // earthMesh.visible = true;

            // Add Earth's axial tilt (23.5 degrees)
            earthMesh.rotation.z = 23.5 * Math.PI / 180;
            
            // ------------------------------------------------------------ 
            // Create regular atmosphere 
            // ------------------------------------------------------------ 
            const atmosphereGeometry = new THREE.SphereGeometry(1.1, 64, 64);

            const cloudsRegular = new THREE.TextureLoader().load('public/assets/textures/clouds_transparent.png');

            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                map: cloudsRegular,
                color: 0xffffff,
                transparent: true,
                opacity: 0.2,
                side: THREE.FrontSide,
                shininess: 1,
                emissive: 0x4f9aff,
                emissiveIntensity: 0.4
            });
            const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            
            // ------------------------------------------------------------ 
            // Create hot atmosphere with 3 linearly spaced layers
            // ------------------------------------------------------------ 
            const atmosphereHot = new THREE.Group();  // Container for all hot atmosphere layers
            
            const hotLayers = [
                { radius: 1.1,  opacity: 0.2, intensity: 0.9 },
                { radius: 1.12, opacity: 0.15, intensity: 0.4 },
                { radius: 1.15, opacity: 0.1, intensity: 0.2 }
            ];
            
            hotLayers.forEach(layer => {
                const geometry = new THREE.SphereGeometry(layer.radius, 64, 64);
                const material = new THREE.MeshPhongMaterial({
                    color: 0xff4800,  // More reddish for heat
                    transparent: true,
                    opacity: layer.opacity,
                    side: THREE.DoubleSide,
                    shininess: 0,
                    emissive: 0xff4800,
                    emissiveIntensity: layer.intensity,
                    blending: THREE.AdditiveBlending
                });
                const mesh = new THREE.Mesh(geometry, material);
                atmosphereHot.add(mesh);
            });
            
            // Add both to earth but hide initially
            earthMesh.add(atmosphereMesh);
            earthMesh.add(atmosphereHot);
            atmosphereMesh.visible = false;  // Start invisible
            atmosphereHot.visible = false;   // Start invisible
            
            // ------------------------------------------------------------ 
            // Create hot atmosphere with N nonlinearly spaced layers
            // ------------------------------------------------------------ 
            const atmosphereHotNonlinear = new THREE.Group();
            const baseGeometry = new THREE.SphereGeometry(1, 64, 64);
            const numLayers = 12;

            for (let i = 0; i < numLayers; i++) {
                const t = i / (numLayers - 1);
                const scale = 1.07 + (0.25 * Math.pow(t, 2.5));
                const opacity = 0.1 * (0.5 - Math.pow(t, 3.5));
                
                const layer = new THREE.Mesh(
                    baseGeometry,
                    new THREE.MeshPhongMaterial({
                        color: 0xcae9ff,
                        transparent: true,
                        opacity: opacity,
                        shininess: 0,
                    })
                );

                layer.scale.set(scale, scale, scale);
                atmosphereHotNonlinear.add(layer);
            }
            
            // ------------------------------------------------------------ 
            // Create simulation atmosphere (new)
            // ------------------------------------------------------------ 
            const simAtmosphereHotNonlinear = new THREE.Group();
            
            for (let i = 0; i < numLayers; i++) {
                const t = i / (numLayers - 1);
                const scale = 1.07 + (0.25 * Math.pow(t, 2.5));
                const opacity = 0.1 * (0.5 - Math.pow(t, 3.5));
                
                const layer = new THREE.Mesh(
                    baseGeometry,
                    new THREE.MeshPhongMaterial({
                        color: 0xcae9ff,
                        transparent: true,
                        opacity: opacity,
                        shininess: 0,
                    })
                );

                layer.scale.set(scale, scale, scale);
                simAtmosphereHotNonlinear.add(layer);
            }
            
            simAtmosphereHotNonlinear.visible = false;  // Start invisible
            
            // Add both to earth
            atmosphereHotNonlinear.visible = true;
            earthMesh.add(atmosphereHotNonlinear);
            earthMesh.add(simAtmosphereHotNonlinear);

            // ------------------------------------------------------------ 
            // Create shadow cylinder and end cap   
            // ------------------------------------------------------------ 
            const cylinderLength = 4;  // Adjusted for visibility
            const cylinderGeometry = new THREE.CylinderGeometry(1.01, 1.01, cylinderLength, 64);  // Slightly larger to prevent z-fighting
            const cylinderMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const shadowCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
            
            // Create end cap
            const capGeometry = new THREE.CircleGeometry(1, 64);
            const capMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide
            });
            const endCap = new THREE.Mesh(capGeometry, capMaterial);
            
            // Position at far end of cylinder
            endCap.position.y = -cylinderLength/2;  // Move to far end
            endCap.rotation.x = Math.PI/2;  // Rotate to face outward
            
            shadowCylinder.add(endCap);
            
            // Rotate cylinder to align with X axis and position it
            shadowCylinder.rotation.z = Math.PI/2;
            // By default, cylinder is centered at origin, so we need to move it by half its length + earth radius
            shadowCylinder.position.x = (cylinderLength/2);
            
            shadowCylinder.visible = false;  // Start invisible
            earthMesh.add(shadowCylinder);
            
            // // ------------------------------------------------------------ 
            // // Create ice patches
            // // ------------------------------------------------------------ 
            // const iceGroup = new THREE.Group();
            // const NUM_ICE_PATCHES = 360*10;
            // const SPHERE_RADIUS = 1.01; // Slightly above Earth's surface

            // // Generate random points on sphere
            // for (let i = 0; i < NUM_ICE_PATCHES; i++) {
            //     // Random spherical coordinates
            //     const theta = Math.random() * Math.PI * 2; // Random longitude (0 to 2π)
            //     const phi = Math.acos(2 * Math.random() - 1); // Random latitude (arccos method for uniform distribution)
                
            //     // Convert to Cartesian coordinates
            //     const x = SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi);
            //     const y = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
            //     const z = SPHERE_RADIUS * Math.cos(phi);

            //     // Create irregular polygon
            //     const numSides = Math.floor(Math.random() * 4) + 4; // 4-7 sides
            //     const vertices = [];
            //     const baseRadius = 0.1;
                
            //     // Create irregular vertices
            //     for (let j = 0; j < numSides; j++) {
            //         const angle = (j / numSides) * Math.PI * 2;
            //         // Vary radius between 0.7 and 1.3 of base radius
            //         const radius = baseRadius * (0.3 + Math.random() * 1.9);
            //         vertices.push(new THREE.Vector2(
            //             radius * Math.cos(angle),
            //             radius * Math.sin(angle)
            //         ));
            //     }

            //     // Create geometry from vertices
            //     const shape = new THREE.Shape(vertices);
            //     const iceGeometry = new THREE.ShapeGeometry(shape);
                
            //     const iceMaterial = new THREE.MeshPhongMaterial({
            //         color: 0xdee2e6,
            //         // transparent: true,
            //         // opacity: 0.2,
            //         side: THREE.DoubleSide,
            //         blending: THREE.NoBlending,
            //         depthWrite: true,    // write to the depth buffer
            //         alphaTest: 0.5       // discard fragments with low alpha
            //     });
                
            //     const icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
                
            //     // Random rotation
            //     const randomRotation = Math.random() * Math.PI * 2;
            //     icePatch.rotation.z = randomRotation;
                
            //     // Position and orient ice patch
            //     icePatch.position.set(x, y, z);
            //     icePatch.lookAt(0, 0, 0); // Orient perpendicular to surface
                
            //     iceGroup.add(icePatch);

                
            // }

            // iceGroup.visible = false;
            // earthMesh.add(iceGroup);

            // // ------------------------------------------------------------ 
            // // Create snowball Earth ice patches
            // // ------------------------------------------------------------ 
            // const snowballEarthGroup = new THREE.Group();

            // for (let i = 0; i < NUM_ICE_PATCHES; i++) {
            //     const theta = Math.random() * Math.PI * 2;
            //     const phi = Math.acos(2 * Math.random() - 1);
                
            //     const x = SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi);
            //     const y = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
            //     const z = SPHERE_RADIUS * Math.cos(phi);

            //     const numSides = Math.floor(Math.random() * 4) + 4;
            //     const vertices = [];
            //     const baseRadius = 0.1;
                
            //     for (let j = 0; j < numSides; j++) {
            //         const angle = (j / numSides) * Math.PI * 2;
            //         const radius = baseRadius * (0.3 + Math.random() * 1.9);
            //         vertices.push(new THREE.Vector2(
            //             radius * Math.cos(angle),
            //             radius * Math.sin(angle)
            //         ));
            //     }

            //     const shape = new THREE.Shape(vertices);
            //     const iceGeometry = new THREE.ShapeGeometry(shape);
                
            //     const iceMaterial = new THREE.MeshPhongMaterial({
            //         color: 0xdee2e6,
            //         side: THREE.DoubleSide,
            //         blending: THREE.NoBlending,
            //         depthWrite: true,
            //         alphaTest: 0.5
            //     });
                
            //     const icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
            //     icePatch.rotation.z = Math.random() * Math.PI * 2;
            //     icePatch.position.set(x, y, z);
            //     icePatch.lookAt(0, 0, 0);
                
            //     snowballEarthGroup.add(icePatch);
            // }

            // snowballEarthGroup.visible = false;
            // earthMesh.add(snowballEarthGroup);



            // // ------------------------------------------------------------ 
            // // Create simulation ice patches
            // // ------------------------------------------------------------ 
            // const simIceGroup = new THREE.Group();

            // // Generate random points on sphere
            // for (let i = 0; i < NUM_ICE_PATCHES; i++) {
            //     // Random spherical coordinates
            //     const theta = Math.random() * Math.PI * 2; // Random longitude (0 to 2π)
            //     const phi = Math.acos(2 * Math.random() - 1); // Random latitude (arccos method for uniform distribution)
                
            //     // Convert to Cartesian coordinates
            //     const x = SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi);
            //     const y = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
            //     const z = SPHERE_RADIUS * Math.cos(phi);

            //     // Create irregular polygon
            //     const numSides = Math.floor(Math.random() * 4) + 4; // 4-7 sides
            //     const vertices = [];
            //     const baseRadius = 0.1;
                
            //     // Create irregular vertices
            //     for (let j = 0; j < numSides; j++) {
            //         const angle = (j / numSides) * Math.PI * 2;
            //         // Vary radius between 0.7 and 1.3 of base radius
            //         const radius = baseRadius * (0.3 + Math.random() * 1.9);
            //         vertices.push(new THREE.Vector2(
            //             radius * Math.cos(angle),
            //             radius * Math.sin(angle)
            //         ));
            //     }

            //     // Create geometry from vertices
            //     const shape = new THREE.Shape(vertices);
            //     const iceGeometry = new THREE.ShapeGeometry(shape);
                
            //     const iceMaterial = new THREE.MeshPhongMaterial({
            //         color: 0xdee2e6,
            //         // transparent: true,
            //         // opacity: 0.2,
            //         side: THREE.DoubleSide,
            //         blending: THREE.NoBlending,
            //         depthWrite: true,    // write to the depth buffer
            //         alphaTest: 0.5       // discard fragments with low alpha
            //     });
                
            //     const icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
                
            //     // Random rotation
            //     const randomRotation = Math.random() * Math.PI * 2;
            //     icePatch.rotation.z = randomRotation;
                
            //     // Position and orient ice patch
            //     icePatch.position.set(x, y, z);
            //     icePatch.lookAt(0, 0, 0); // Orient perpendicular to surface
                
            //     simIceGroup.add(icePatch);

                
            // }

            // simIceGroup.visible = false;
            // earthMesh.add(simIceGroup);

            // Use the external function to create different ice groups
            const iceGroup = createIceGroup('iceGroup');
            const snowballEarthGroup = createIceGroup('snowballEarthGroup');
            const simIceGroup = createIceGroup('simIceGroup');

            earthMesh.add(iceGroup);
            earthMesh.add(snowballEarthGroup);
            earthMesh.add(simIceGroup);

            // After creating all patches
            // console.log('SimIceGroup created with patches:', simIceGroup.children.length);








            return {
                type: '3dObject',
                object: earthMesh,
                extras: {
                    needsLight: true,
                    atmosphere: atmosphereMesh,
                    atmosphereHot: atmosphereHot,
                    atmosphereHotNonlinear: atmosphereHotNonlinear,
                    simAtmosphereHotNonlinear: simAtmosphereHotNonlinear,
                    shadowCylinder: shadowCylinder,
                    material: material,
                    iceGroup: iceGroup,
                    simIceGroup: simIceGroup,
                    snowballEarthGroup: snowballEarthGroup
                }
            };
        }
        return null;
    }

    static createButton(config) {
        const button = document.createElement('button');
        button.textContent = config.content;
        button.style.position = 'absolute';
        button.style.left = `${config.position.x}%`;
        button.style.top = `${config.position.y}%`;
        button.style.transform = 'translate(-50%, -50%)';
        button.style.opacity = '0';
        
        // Apply any additional styles from config
        if (config.style) {
            if (config.style.className) {
                button.className = config.style.className;
            }
            Object.entries(config.style).forEach(([key, value]) => {
                if (key !== 'className') {
                    button.style[key] = value;
                }
            });
        }
        
        return {
            type: 'button',
            element: button
        };
    }

    static createSimControls(config) {
        // console.log("Creating sim controls...");
        const container = document.createElement('div');
        container.className = 'sim-controls sim-controls-visibility';  // Add visibility class
        
        // Add sliderGroup right after container
        const sliderGroup = document.createElement('div');
        sliderGroup.className = 'slider-group';
        
        // Basic styling to make it visible
        container.style.position = 'absolute';
        // container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        // container.style.padding = '20px';
        // container.style.borderRadius = '5px';
        
        // Create first slider group
        const slider1Group = document.createElement('div');
        // slider1Group.style.marginBottom = '20px';
        
        const slider1Label = document.createElement('label');
        slider1Label.textContent = 'Greenhouse Gas Parameter (g)';
        slider1Label.style.display = 'block';
        
        const slider1Value = document.createElement('span');
        slider1Value.textContent = '0.3';
        // slider1Value.style.marginLeft = '10px';
        
        const slider1 = document.createElement('input');
        slider1.type = 'range';
        slider1.min = '0.3';
        slider1.max = '0.45';
        slider1.step = '0.001';
        slider1.value = '0.355';
        slider1.className = 'simulation-slider g-slider';
        // slider1.style.display = 'block';
        // slider1.style.width = '200px';
        
        // Update value display when slider moves
        slider1.addEventListener('input', (event) => {
            slider1Value.textContent = slider1.value;
            
            // Dispatch custom event with slider value
            const sliderEvent = new CustomEvent('g-slider-change', {
                detail: { value: parseFloat(slider1.value) }
            });
            document.dispatchEvent(sliderEvent);
        });
        
        // Create second slider group
        const slider2Group = document.createElement('div');
        // slider2Group.style.marginBottom = '200px';
        
        const slider2Label = document.createElement('label');
        slider2Label.textContent = 'Initial Temperature (K)';
        slider2Label.style.display = 'block';
        
        const slider2 = document.createElement('input');
        slider2.type = 'range';
        slider2.min = '220';
        slider2.max = '320';
        slider2.value = '292';  // Temporarily back to hardcoded value until we fix imports
        slider2.className = 'simulation-slider temp-slider';
        
        const slider2Value = document.createElement('span');
        slider2Value.textContent = slider2.value;
        
        slider2.addEventListener('input', () => {
            if (!slider2.disabled) {  // Only trigger if not disabled
                slider2Value.textContent = slider2.value;
                // Dispatch event for temperature changes
                document.dispatchEvent(new CustomEvent('temp-slider-change', {
                    detail: { value: slider2.value }
                }));
            }
        });
        
        // Create run button
        const runButton = document.createElement('button');
        runButton.textContent = 'Run';
        runButton.className = 'sim-button';
        
        // Add click handler to dispatch the event
        runButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('run-animation-click'));
        });
        
        // Add everything to container
        const slider1Container = document.createElement('div');
        slider1Container.appendChild(slider1);
        slider1Container.appendChild(slider1Value);

        const slider2Container = document.createElement('div');
        slider2Container.appendChild(slider2);
        slider2Container.appendChild(slider2Value);

        sliderGroup.appendChild(slider1Label);
        sliderGroup.appendChild(slider1Container);
        sliderGroup.appendChild(slider2Label);
        sliderGroup.appendChild(slider2Container);
        container.appendChild(sliderGroup);
        container.appendChild(runButton);
        
        // console.log("Sim controls created:", container);
        return {
            type: 'sim-controls',
            element: container,
            controls: {
                gSlider: slider1,
                tempSlider: slider2,
                runButton: runButton
            }
        };
    }

    static createVPlot(config) {
        const plot = new PotentialPlot(config);
        // console.log('Plot element:', plot.element);
        // console.log('Is Node:', plot.element instanceof Node);
        return {
            type: 'plot',
            object: plot.element,  // Should be a DOM element
            extras: {
                plot: plot        // Keep reference to plot object
            }
        };
    }


} 