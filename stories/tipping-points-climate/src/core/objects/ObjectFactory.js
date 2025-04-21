import * as THREE from 'three';
import { PotentialPlot } from './PotentialPlot.js';
import { MODEL_PARAMS } from '../simulation/constants.js';
import { marked } from '../../../public/assets/lib/marked.esm.js';
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

export class ObjectFactory {
    static createObject(config) {
        switch(config.type) {
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
            case 'sim-controls':
                return this.createSimControls(config);
            case 'sim-v-plot':
                return this.createVPlot(config);
            case 'sim-solution-plot': 
                return this.createSolutionPlot(config);
            case 'standalonePotentialPlot':
                return this.createStandalonePotentialPlot(config);
            case 'standaloneTemperaturePlot':
                return this.createStandaloneTemperaturePlot(config);
            case 'animatedSolutionPlot':
                return this.createAnimatedSolutionPlot(config);
            case 'animatedPotentialPlot':
                return this.createAnimatedPotentialPlot(config);
            case 'animatedHysteresisPlot':
                return this.createAnimatedHysteresisPlot(config);
            case 'albedoPlot':
                return this.createAlbedoPlot(config);
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
            
            
            // earthMesh.rotation.x = 45 * Math.PI / 180;
            // earthMesh.rotation.z = 10 * Math.PI / 180;
            
            // create atmosphere models
            const atmPaleBlueDot1 = createAtmosphereSingleLayer();
            const atmPaleBlueDot2 = createAtmosphereSingleLayer();
            const atmosphereHotNonlinear = createAtmosphereNonLinear(12, 0.1, 0xcae9ff);
            const simAtmosphereHotNonlinear = createAtmosphereNonLinear(12, 0.1, 0xcae9ff);

            // Add atmosphere models to earth mesh
            earthMesh.add(atmPaleBlueDot1);
            earthMesh.add(atmPaleBlueDot2);
            earthMesh.add(atmosphereHotNonlinear);
            earthMesh.add(simAtmosphereHotNonlinear);

            // create shadow cylinder
            const shadowCylinder = createShadowCylinder(4, 1.01);
            // const shadowCylinder = createShadowCylinder(4, 1.01, new THREE.Vector3(-7, -10, 20), earthMesh);

            earthMesh.add(shadowCylinder);

            // create ice models
            const icePaleBlueDot = createIceGroup('icePaleBlueDot', 6, 1.01);
            const iceGroup = createIceGroup('iceGroup');    
            const iceGroup2 = createIceGroup('iceGroup2');

            const snowballEarthGroup = createIceGroup('snowballEarthGroup');
            const simIceGroup = createIceGroup('simIceGroup');




            
            earthMesh.add(iceGroup);
            earthMesh.add(snowballEarthGroup);
            earthMesh.add(icePaleBlueDot);
            earthMesh.add(simIceGroup);
            earthMesh.add(iceGroup2);

            // After creating all patches
            // console.log('SimIceGroup created with patches:', simIceGroup.children.length);


            return {
                type: '3dObject',
                object: earthMesh,
                extras: {
                    needsLight: true,
                    atmPaleBlueDot1: atmPaleBlueDot1,
                    atmPaleBlueDot2: atmPaleBlueDot2,
                    atmosphereHotNonlinear: atmosphereHotNonlinear,
                    simAtmosphereHotNonlinear: simAtmosphereHotNonlinear,
                    shadowCylinder: shadowCylinder,
                    material: material,
                    iceGroup: iceGroup,
                    icePaleBlueDot: icePaleBlueDot,
                    simIceGroup: simIceGroup,
                    snowballEarthGroup: snowballEarthGroup,
                    iceGroup2: iceGroup2
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
        slider1.min = '0.1';
        slider1.max = '0.45';
        slider1.step = '0.001';
        slider1.value = '0.233';
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
        slider2.value = '300';  
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
        const element = plot.element;
        element.id = 'sim-v-plot';  // Set the ID explicitly
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createSolutionPlot(config) {
        const plot = new SolutionPlot(config);
        const element = plot.element;
        element.id = 'sim-solution-plot';  // Set the ID explicitly
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createStandalonePotentialPlot(config) {
        const plot = new StandalonePotentialPlot(config);
        const element = plot.element;
        element.id = 'explanation-potential';  // Set the ID explicitly
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createStandaloneTemperaturePlot(config) {
        const plot = new StandaloneTemperaturePlot(config);
        const element = plot.element;
        element.id = 'explanation-temperature';  // Set the ID explicitly
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createAnimatedSolutionPlot(config) {
        const plot = new StandaloneAnimatedSolutionPlot(config);
        const element = plot.element;
        element.id = 'animated-solution-plot';
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createAnimatedPotentialPlot(config) {
        const plot = new StandaloneAnimatedPotentialPlot(config);
        const element = plot.element;
        element.id = 'animated-potential-plot';
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createAnimatedHysteresisPlot(config) {
        const plot = new StandaloneAnimatedHysteresisPlot(config);
        const element = plot.element;
        element.id = 'animated-hysteresis-plot';
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

    static createAlbedoPlot(config) {
        const plot = new StandaloneAlbedoPlot(config);
        const element = plot.element;
        element.id = 'albedo-plot';
        return {
            type: 'plot',
            object: element,
            extras: {
                plot: plot
            }
        };
    }

} 