import * as THREE from 'three';
import { PotentialPlot } from './PotentialPlot.js';
import { MODEL_PARAMS } from '../simulation/constants.js';
import { createIceGroup } from './ice.js';
import { createShadowCylinder } from './shadowCylinder.js';
import { createAtmosphereNonLinear } from './atmosphereNonLinear.js';
import { createAtmosphereSingleLayer } from './atmosphereSingleLayer.js';
import { SolutionPlot } from './SolutionPlot.js';
import { StandalonePotentialPlot } from './StandalonePotentialPlot.js';
import { StandaloneTemperaturePlot } from './StandaloneTemperaturePlot.js';
import { StandaloneAnimatedSolutionPlot } from './StandaloneAnimatedSolutionPlot.js';
import { StandaloneAnimatedPotentialPlot } from './StandaloneAnimatedPotentialPlot.js';
import { StandaloneAnimatedHysteresisPlot } from './StandaloneAnimatedHysteresisPlot.js';
import { StandaloneAlbedoPlot } from './StandaloneAlbedoPlot.js';
import { createJetStreamTrajectory } from './JetStreamTrajectory.js';
import { createAnimatedJetStreamTrajectory } from './AnimatedJetStreamTrajectory.js';
import { createSeaIceLayer } from './SeaIceLayer.js';

function createTemperatureLayer(date, radius = 1.03, opacity = 0.7, isNormalDay = false) {
    const group = new THREE.Group();

    // Create a simple sphere geometry slightly larger than the Earth
    const geometry = new THREE.SphereGeometry(radius, 64, 32);

    // Load the temperature texture from the appropriate directory
    const textureLoader = new THREE.TextureLoader();
    let tempTexture;
    let texturePath;
    
    // For February 2010 data
    if (date.startsWith('2010-02')) {
        texturePath = `${import.meta.env.BASE_URL}output/normal/temperature_overlays_normal_2010_feb/temp_${date}.png`;
        console.log('Loading normal day temperature data from:', texturePath);
        tempTexture = textureLoader.load(texturePath);
    } else {
        console.error(`Unsupported date format: ${date}`);
        return group;
    }

    tempTexture.onload = () => {
        console.log(`Successfully loaded temperature texture for ${date}`);
    };

    tempTexture.onerror = (err) => {
        console.error(`Failed to load temperature texture for ${date}:`, err);
    };

    // const material = new THREE.MeshBasicMaterial({
    //     map: tempTexture,
    //     transparent: true,
    //     opacity: opacity,
    //     side: THREE.FrontSide,
    //     depthWrite: false,
    // });

    const material = new THREE.MeshPhongMaterial({
        map: tempTexture,
        transparent: true,
        opacity: opacity,
        side: THREE.FrontSide,
        depthWrite: false,
        // emissive: 0xffffff,  // Make it glow
        emissiveMap: tempTexture,  // Use same texture for glow
        // emissiveIntensity: 0.5  // Adjust this value as needed
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    group.visible = false;

    return group;
}

export class ObjectFactory {
    static createObject(config) {
        switch (config.type) {
            case '3dObject':
                return this.create3DObject(config);
            case 'intro-header':
            case 'intro-segment':
            case 'header':
            case 'segment':
            case 'annotation':
                return this.createText(config);
            case 'button':
                return this.createButton(config);
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
            const earthTexture = textureLoader.load(`${import.meta.env.BASE_URL}assets/textures/2_no_clouds_8k_no_seaice.jpg`);
            
            // Create a more realistic material that responds better to lighting
            const material = new THREE.MeshPhongMaterial({
                map: earthTexture,
                specular: 0x333333,
            });
            const earthMesh = new THREE.Mesh(geometry, material);
            
            // Scale the Earth to 1.0 to match globalConfig transformations
            earthMesh.scale.set(1.0, 1.0, 1.0);

            // Add Earth's axial tilt (23.5 degrees)
            earthMesh.rotation.z = 23.5 * Math.PI / 180;

            // Create atmosphere models
            const atmosphereNonlinear = createAtmosphereNonLinear(12, 0.1, 0xcae9ff);
            // Add atmosphere models to earth mesh
            earthMesh.add(atmosphereNonlinear);

            // Create sea ice layers for each year
            const seaIce2001 = createSeaIceLayer('2001', 1.01, 0.6, 0xffffff);
            earthMesh.add(seaIce2001);
            const seaIce2002 = createSeaIceLayer('2002', 1.01, 0.6, 0xffffff);
            const seaIce2003 = createSeaIceLayer('2003', 1.01, 0.6, 0xffffff);
            
            earthMesh.add(seaIce2002);
            earthMesh.add(seaIce2003);

            // Create jet streams and temperature layers for normal days (Feb 1-14, 2010)
            const normalJetStreams = {};
            const normalTempLayers = {};
            for (let day = 1; day <= 14; day++) {
                const date = `2010-02-${day.toString().padStart(2, '0')}`;
                
                // Create jet stream
                const jetStream = createJetStreamTrajectory(
                    `${date}T00:00:00.000000000`, 
                    1.05, 
                    0.05, 
                    0xbbdefb, 
                    true
                );
                const streamId = `jetStream${date}`;
                normalJetStreams[streamId] = jetStream;
                earthMesh.add(jetStream);

                // Create temperature layer
                const tempLayer = createTemperatureLayer(date, 1.03, 0.7, true);
                const layerId = `temp${date}`;
                normalTempLayers[layerId] = tempLayer;
                earthMesh.add(tempLayer);
            }

            return {
                type: '3dObject',
                object: earthMesh,
                extras: {
                    needsLight: true,
                    atmosphereHotNonlinear: atmosphereNonlinear,
                    ...normalJetStreams,  // Add normal days jet streams
                    ...normalTempLayers,  // Add normal days temperature layers
                    seaIce2001: seaIce2001,
                    seaIce2002: seaIce2002,
                    seaIce2003: seaIce2003,
                    material: material
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

} 