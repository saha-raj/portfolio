import * as THREE from 'three';
import * as d3 from 'd3';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LifecycleManager } from './core/lifecycle/LifecycleManager.js';
import { 
    globalConfig, 
    sceneConfig, 
    extraConfig,
    SIM_SEGMENT_START_AT,
    SIM_SEGMENT_END_AT,
    SIM_SEGMENT_LOCK_START_AT,
    SIM_SEGMENT_LOCK_END_AT,
    SIM_SEGMENT_RETURN_BACK_AT,
    SIM_SEGMENT_FORWARD_TO_AT,
    DUR_TRANS
} from './config/globalConfig.js';
import { ObjectFactory } from './core/objects/ObjectFactory.js';
import { DebugLogger } from './debug/DebugLogger.js';
// import { DebugOverlay } from './debug/DebugOverlay.js';
import { ClimateModel } from './core/simulation/climate-model.js';
import { BackgroundManager } from './components/BackgroundManager.js';
import { StandaloneAnimatedSolutionPlot } from './core/objects/StandaloneAnimatedSolutionPlot.js';
import { testAssetPaths, DEBUG_VERSION } from './debug-version.js';

// Debug version check
console.log(`Loading application version: ${DEBUG_VERSION}`);
console.log(`Testing asset accessibility in build`);
testAssetPaths();

// -------------- ASSET TEST --------------
// Debug - test accessing critical assets
const testAssets = [
    'assets/textures/2_no_clouds_8k_no_seaice.jpg',
    'assets/textures/rodinia_unpix.png',
    // Removed favicon tests
];

console.log('Environment Base URL:', import.meta.env.BASE_URL);
console.log('Window location:', window.location.href);

testAssets.forEach(path => {
    const fullPath = `${import.meta.env.BASE_URL}${path}`;
    console.log(`Testing asset path: ${fullPath}`);
    
    // Try HEAD request first to check if file exists
    fetch(fullPath, { method: 'HEAD' })
        .then(response => {
            console.log(`HEAD check for ${path}: ${response.status} ${response.statusText}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            console.log(`✅ Asset exists (HEAD): ${fullPath}`);
            return fetch(fullPath); // Try a regular GET request
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            console.log(`✅ Asset accessible (GET): ${fullPath}`);
            return response;
        })
        .catch(error => {
            console.error(`❌ Asset check failed: ${fullPath}`, error);
            // Try relative path as fallback
            const relativePath = `./${path}`;
            console.log(`Attempting fallback with relative path: ${relativePath}`);
            return fetch(relativePath)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    console.log(`✅ Asset accessible via relative path: ${relativePath}`);
                    return response;
                })
                .catch(fallbackError => {
                    console.error(`❌ All attempts failed for: ${path}`, fallbackError);
                });
        });
});
// -------------- END ASSET TEST --------------

// Set color management before anything else
THREE.ColorManagement.enabled = true;
THREE.ColorManagement.legacyMode = false;

let currentSimulation = null;  // Move this to top level if not already there

class ScrollCanvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.lifecycle = new LifecycleManager();
        this.debugLogger = new DebugLogger();
        // this.debugOverlay = new DebugOverlay();
        
        // Add console.log to verify initialization
        this.backgroundManager = new BackgroundManager('background-container');
        // console.log('Background Manager initialized:', this.backgroundManager);
        
        this.setupScene();


        // Store simulation results at class level
        let currentSimulation = null;

        const updatePotentialPlot = (gValue, tempValue) => {
            const simVPlot = this.objects.get('sim-v-plot');
            if (simVPlot && simVPlot.extras.plot) {
                const climateModel = new ClimateModel();
                
                // Calculate potential data using model's temperature range
                const temps = climateModel.generateTempRange();
                const potentialData = {
                    temps: temps,
                    values: temps.map(T => 
                        climateModel.calculatePotential(T, parseFloat(gValue))
                    ),
                    initialTemp: parseFloat(tempValue)
                };

                // Simulate from the actual initial temperature
                const simulation = climateModel.simulateTemperature(
                    parseFloat(tempValue),  // Use actual initial temperature
                    parseFloat(gValue),
                    1000,  // timeSteps
                    1000000    // dt
                );

                // Store simulation results with albedo values
                currentSimulation = {
                    ...simulation,
                    albedos: simulation.temperatures.map(T => climateModel.calculateAlbedo(T))
                };
                
                const equilibriumTemp = simulation.temperatures[simulation.temperatures.length - 1];
                simVPlot.extras.plot.updatePlot(potentialData, equilibriumTemp);
            }
        };

        const updateSolutionPlot = (simulation) => {
            const simSolutionPlot = this.objects.get('sim-solution-plot');
            if (simSolutionPlot && simSolutionPlot.extras.plot && simulation) {
                // Find index where we're close enough to equilibrium
                const TEMP_THRESHOLD = 0.05;  // Define threshold for "close enough"
                const equilibriumTemp = simulation.temperatures[simulation.temperatures.length - 1];
                
                // Find first index where we're within threshold of equilibrium
                const equilibriumIndex = simulation.temperatures.findIndex(temp => 
                    Math.abs(temp - equilibriumTemp) < TEMP_THRESHOLD
                );

                // If we found a valid index, use it to trim the data
                const endIndex = equilibriumIndex !== -1 ? equilibriumIndex + 1 : simulation.temperatures.length;
                
                const solutionData = {
                    times: simulation.times.slice(0, endIndex),
                    temperatures: simulation.temperatures.slice(0, endIndex)
                };
                
                simSolutionPlot.extras.plot.updatePlot(solutionData);
            }
        };

        let simControls = null;
        
        // Create and add objects
        globalConfig.objects.forEach(config => {
            const object = ObjectFactory.createObject(config);
            if (!object) return;
            
            if (config.id === 'sim-controls') {
                simControls = object;
            }
            
            if (object.type === '3dObject') {
                this.scene.add(object.object);
                // Add shadow cylinder to scene if it exists
                if (object.extras && object.extras.shadowCylinder) {
                    this.scene.add(object.extras.shadowCylinder);
                }
            } else if (object.type === 'plot') {
                this.container.appendChild(object.object);
            } else {
                this.container.appendChild(object.element);
            }
            
            this.objects.set(config.id, object);
            this.lifecycle.registerObject(config);

            if (!object.positionLogged) {
                const element = object?.object;
                // console.log('Plot creation:', {
                //     id: element?.id,
                //     type: object?.type,
                //     element: element,
                //     inlineStyles: element?.style ? {
                //         position: element.style.position,
                //         left: element.style.left,
                //         top: element.style.top,
                //         transform: element.style.transform
                //     } : 'No inline styles'
                // });
                object.positionLogged = true;
            }
        });

        // Initialize plot after all objects are created and registered
        if (simControls) {
            const gValue = simControls.controls.gSlider.value;
            const tempValue = simControls.controls.tempSlider.value;
            // console.log('Initial values:', {
            //     gValue,
            //     tempValue,
            //     hasSimControls: !!simControls,
            //     hasControls: !!(simControls && simControls.controls),
            //     hasSliders: !!(simControls && simControls.controls && 
            //                  simControls.controls.gSlider && 
            //                  simControls.controls.tempSlider)
            // });

            updatePotentialPlot(gValue, tempValue);  // This creates currentSimulation
            updateSolutionPlot(currentSimulation);   // Add this line to initialize solution plot

            // Add this initial ice scale calculation AFTER updatePotentialPlot
            const earth = this.objects.get('earth');
            // console.log('Earth object:', {
            //     hasEarth: !!earth,
            //     hasExtras: !!(earth && earth.extras),
            //     hasIceGroup: !!(earth && earth.extras && earth.extras.simIceGroup),
            //     simIceGroupVisible: earth?.extras?.simIceGroup?.visible,
            //     hasCurrentSimulation: !!currentSimulation
            // });

            if (earth && earth.extras && earth.extras.simIceGroup && currentSimulation) {
                // Use currentSimulation.albedos[0] instead of calculating directly
                const albedo = currentSimulation.albedos[0];
                const scale = Math.min(Math.max((albedo - 0.13) / (0.57 - 0.13), 0), 1);
                
                // console.log('Ice calculation:', {
                //     tempValue,
                //     albedo,
                //     scale,
                //     currentSimulationExists: !!currentSimulation,
                //     simIceGroup: earth.extras.simIceGroup,
                //     simIceChildren: earth.extras.simIceGroup.children,
                //     simIceParent: earth.extras.simIceGroup.parent,
                //     simIceMatrix: earth.extras.simIceGroup.matrix,
                //     simIceWorldMatrix: earth.extras.simIceGroup.matrixWorld
                // });
                
                earth.extras.simIceGroup.visible = true;
                // console.log('Ice visibility after setting:', earth.extras.simIceGroup.visible);
                earth.extras.simIceGroup.children.forEach(icePatch => {
                    icePatch.scale.set(scale, scale, 1);
                });
                // console.log('Ice visibility after scaling:', earth.extras.simIceGroup.visible);

                // Dispatch temp-slider-change event to trigger the handler
                const event = new CustomEvent('temp-slider-change', { 
                    detail: { value: tempValue }
                });
                document.dispatchEvent(event);
            }
        }
        
        this.bindEvents();
        this.animate();
        
        // Initialize debug utilities
        // this.debugLogger = new DebugLogger();
        // this.debugOverlay = new DebugOverlay();
        this.lastProgress = 0;
        this.lastScrollTime = null;
        this.lastScrollY = 0;
        this.scrollVelocity = 0;
        this.lastVerifyTime = 0;  // Track last verification time
        
        // Set scroll height based on sceneConfig
        document.body.style.minHeight = `${sceneConfig.totalScenes * sceneConfig.heightPerScene}vh`;
        
        // Preload textures including default
        this.earthTextures = new Map();
        const textureLoader = new THREE.TextureLoader();
        
        // Load default texture first
        const defaultTexture = textureLoader.load('assets/textures/2_no_clouds_8k_no_seaice.jpg', 
            // Add success callback
            (texture) => {
                texture.colorSpace = 'srgb';
                const earth = this.objects.get('earth');
                if (earth && earth.extras) {
                    earth.extras.material.map = texture;
                    earth.extras.material.needsUpdate = true;
                    this.renderer.render(this.scene, this.camera);  // Force initial render
                }
            }
        );
        this.earthTextures.set('default', defaultTexture);
        
        // Load config textures
        extraConfig.forEach(config => {
            if (config.id === 'earthTexture') {
                const texture = textureLoader.load(config.file);
                texture.colorSpace = 'srgb';
                this.earthTextures.set(config.file, texture);
            }
        });

        // Add simulation button handler
        const simButton = this.objects.get('simulation-button');
        if (simButton && simButton.element) {
            simButton.element.addEventListener('click', () => {
                this.initSimulation();
                this.enterSimulation();
            });
        }

        // Check for return scroll position
        const returnScroll = sessionStorage.getItem('returnScroll');
        if (returnScroll) {
            window.scrollTo(0, parseFloat(returnScroll));
            sessionStorage.removeItem('returnScroll');
        }

        // Event listeners
        document.addEventListener('g-slider-change', (event) => {
            if (!simControls) return;
            const gValue = event.detail.value;
            const tempValue = simControls.controls.tempSlider.value;
            
            // Update plot
            updatePotentialPlot(gValue, tempValue);
            
            // Update atmosphere opacity with proper checks
            const earth = this.objects.get('earth');
            if (earth && earth.extras && earth.extras.simAtmosphereHotNonlinear) {
                const simAtmosphere = earth.extras.simAtmosphereHotNonlinear;
                
                // First make sure atmosphere is visible
                simAtmosphere.visible = true;
                
                // Calculate base opacity from g value
                const baseOpacity = (parseFloat(gValue) - 0.3) / (0.45 - 0.3);  // normalize to [0,1]
                
                // Update opacity for each layer in the atmosphere group
                simAtmosphere.children.forEach((layer, i) => {
                    if (layer.material) {
                        const t = i / (simAtmosphere.children.length - 1);
                        layer.material.opacity = baseOpacity * (0.1 * (0.5 - Math.pow(t, 3.5)));
                    }
                });
            }

            // Add this after potential plot update
            updateSolutionPlot(currentSimulation);
        });

        document.addEventListener('temp-slider-change', (event) => {
            if (!simControls) return;
            const tempValue = event.detail.value;
            const gValue = simControls.controls.gSlider.value;
            updatePotentialPlot(gValue, tempValue);

            // Add this after potential plot update
            updateSolutionPlot(currentSimulation);
        });

        // Modify updateObjects to handle atmosphere switching
        const originalUpdateObjects = this.updateObjects.bind(this);
        this.updateObjects = () => {
            // Run original update first
            originalUpdateObjects();

            // Then handle simulation atmosphere visibility
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = window.scrollY / scrollHeight;
            
            const earth = this.objects.get('earth');
            if (earth && earth.extras) {
                const regularAtmosphere = earth.extras.atmosphereHotNonlinear;
                const simAtmosphere = earth.extras.simAtmosphereHotNonlinear;
                const simIceGroup = earth.extras.simIceGroup;
                
                if (regularAtmosphere && simAtmosphere) {
                    // In simulation scene
                    if (progress >= SIM_SEGMENT_START_AT && progress <= SIM_SEGMENT_END_AT) {
                        regularAtmosphere.visible = false;
                        simAtmosphere.visible = true;
                        if (simIceGroup) {
                            simIceGroup.visible = true;
                            
                            // Get initial temperature from slider
                            const simControls = this.objects.get('sim-controls');
                            if (simControls) {
                                const tempValue = simControls.controls.tempSlider.value;
                                const climateModel = new ClimateModel();
                                const albedo = climateModel.calculateAlbedo(parseFloat(tempValue));
                                const scale = Math.min(Math.max((albedo - 0.13) / (0.57 - 0.13), 0), 1);
                                
                                simIceGroup.children.forEach(icePatch => {
                                    icePatch.scale.set(scale, scale, 1);
                                });
                            }
                        }
                    } else {
                        // Outside simulation scene
                        regularAtmosphere.visible = true;
                        simAtmosphere.visible = false;
                        if (simIceGroup) {
                            simIceGroup.visible = false;
                        }
                    }
                }
            }

            // Handle snowballEarthGroup transitions
            if (earth && earth.extras.snowballEarthGroup) {
                const config = extraConfig.find(c => c.id === 'snowballEarthGroup');
                if (config) {
                    const { entry, exit, startDecrease, startSize, endSize, entryDuration } = config;
                    
                    if (progress >= entry.at && progress <= exit.at) {
                        earth.extras.snowballEarthGroup.visible = true;
                        
                        let scale;
                        // Grow in
                        if (progress <= entry.at + config.entryDuration) {
                            scale = (progress - entry.at) / config.entryDuration;
                        }
                        // Shrink out
                        else if (progress >= exit.at - config.exitDuration) {
                            scale = (exit.at - progress) / config.exitDuration;
                        }
                        // Hold at full size
                        else {
                            scale = 1.0;
                        }
                        
                        earth.extras.snowballEarthGroup.children.forEach(patch => {
                            patch.scale.set(scale, scale, 1);
                        });
                    } else {
                        earth.extras.snowballEarthGroup.visible = false;
                    }
                }
            }

            // Handle atmosphere transitions
            extraConfig.forEach(config => {
                if (config.id === 'atmPaleBlueDot1') {
                    const atmosphere = earth.extras.atmPaleBlueDot1;
                    
                    if (progress >= config.entry.at && progress <= config.exit.at) {
                        atmosphere.visible = true;
                        
                        // Linear interpolation of opacity
                        const t = (progress - config.entry.at) / (config.exit.at - config.entry.at);
                        const opacity = config.entryOpacity + (config.exitOpacity - config.entryOpacity) * t;
                        
                        // Update material
                        atmosphere.material.opacity = opacity;
                        atmosphere.material.emissive.setHex(config.color);
                    } else {
                        atmosphere.visible = false;
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.id === 'atmPaleBlueDot2') {
                    const atmosphere = earth.extras.atmPaleBlueDot2;
                    
                    if (progress >= config.entry.at && progress <= config.exit.at) {
                        atmosphere.visible = true;
                        
                        // Linear interpolation of opacity
                        const t = (progress - config.entry.at) / (config.exit.at - config.entry.at);
                        const opacity = config.entryOpacity + (config.exitOpacity - config.entryOpacity) * t;
                        
                        // Update material
                        atmosphere.material.opacity = opacity;
                        atmosphere.material.emissive.setHex(config.color);
                    } else {
                        atmosphere.visible = false;
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.id === 'icePaleBlueDot') {
                    const iceGroup = earth.extras.icePaleBlueDot;
                    
                    if (progress >= config.entry.at && progress <= config.exit.at) {
                        iceGroup.visible = true;
                        
                        // Linear interpolation of scale
                        const t = (progress - config.entry.at) / (config.exit.at - config.entry.at);
                        const scale = t * config.maxRadius;
                        
                        iceGroup.children.forEach(patch => {
                            patch.scale.set(scale, scale, 1);
                        });
                    } else {
                        iceGroup.visible = false;
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.id === 'iceGroup2') {
                    const earth = this.objects.get('earth');
                    if (earth && earth.extras && earth.extras.iceGroup2) {
                        const iceGroup2 = earth.extras.iceGroup2;
                        
                        if (progress >= config.entry.at && progress <= config.exit.at) {
                            iceGroup2.visible = true;
                            const t = (progress - config.entry.at) / (config.exit.at - config.entry.at);
                            const scale = t * config.maxRadius;
                            
                            iceGroup2.children.forEach(patch => {
                                patch.scale.set(scale, scale, 1);
                            });
                        } else {
                            iceGroup2.visible = false;
                        }
                    }
                }
            });

            // Handle Earth screen-space movements
            // const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            // const progress = window.scrollY / scrollHeight;
            
            extraConfig.forEach(config => {
                if (config.id === "earthScreenMovement") {
                    let finalOffset = 0; // Track the final offset from all completed movements

                    config.movements.forEach(movement => {
                        if (progress >= movement.startAt) {
                            if (progress <= movement.endAt) {
                                // During movement: interpolate
                                const movementProgress = (progress - movement.startAt) / (movement.endAt - movement.startAt);
                                const eased = easeInOutCubic(movementProgress);
                                const currentOffset = movement.startOffset + (movement.endOffset - movement.startOffset) * eased;
                                finalOffset = currentOffset;
                            } else {
                                // After movement: maintain final position
                                finalOffset = movement.endOffset;
                            }
                        }
                    });

                    // Apply the final calculated offset
                    if (finalOffset !== 0) {
                        this.moveEarthInScreenSpace(finalOffset);
                    }
                }
            });

            // Handle extra configurations
            extraConfig.forEach(config => {
                if (config.type === "yearSequence") {
                    const earth = this.objects.get('earth');
                    if (!earth || !earth.extras.animatedJetStream) return;

                    // Get the jetStream object
                    const jetStream = earth.extras.animatedJetStream;

                    // Check if we're within the overall sequence timeframe
                    if (progress >= config.entry.at && progress <= config.exit.at) {
                        // Find which year should be visible
                        const activeYear = config.years.find(yearConfig => 
                            progress >= yearConfig.entry.at && 
                            progress <= yearConfig.exit.at
                        );

                        if (activeYear) {
                            console.log(`[DEBUG] Showing jet stream for year ${activeYear.year}`);
                            jetStream.showYear(activeYear.year);
                        }
                    } else {
                        // Outside the sequence timeframe, hide all
                        jetStream.hideAll();
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.type === 'jetStream') {
                    const jetStream = earth.extras[config.id];
                    if (jetStream) {
                        const shouldBeVisible = progress >= config.entry.at && progress <= config.exit.at;
                        jetStream.visible = shouldBeVisible;
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.type === 'seaIce') {
                    const seaIce = earth.extras[config.id];
                    if (seaIce) {
                        const entryAt = config.entry.at;
                        const exitAt = config.exit.at;
                        // Only update visibility if it needs to change
                        const shouldBeVisible = progress >= entryAt && progress <= exitAt;
                        if (seaIce.visible !== shouldBeVisible) {
                            seaIce.visible = shouldBeVisible;
                            // Optional: log only when visibility changes
                            console.log(`${config.id} visibility changed to: ${shouldBeVisible}`);
                        }
                    }
                }
            });

            extraConfig.forEach(config => {
                if (config.type === 'temperature') {
                    const tempLayer = earth.extras[config.id];
                    if (tempLayer) {
                        const entryAt = config.entry.at;
                        const exitAt = config.exit.at;
                        // Only update visibility if it needs to change
                        const shouldBeVisible = progress >= entryAt && progress <= exitAt;
                        if (tempLayer.visible !== shouldBeVisible) {
                            tempLayer.visible = shouldBeVisible;
                            // Optional: log only when visibility changes
                            console.log(`${config.id} visibility changed to: ${shouldBeVisible}`);
                        }
                    }
                }
            });
        };

        // Add animation button handler
        document.addEventListener('run-animation-click', () => {
            if (!currentSimulation) return;

            const earth = this.objects.get('earth');
            const simVPlot = this.objects.get('sim-v-plot');
            const simSolutionPlot = this.objects.get('sim-solution-plot');
            const simControls = this.objects.get('sim-controls');
            
            if (!earth || !earth.extras || !earth.extras.simIceGroup || 
                !simVPlot || !simVPlot.extras.plot || 
                !simSolutionPlot || !simSolutionPlot.extras.plot ||
                !simControls) return;

            const tempSlider = simControls.controls.tempSlider;
            const gValue = simControls.controls.gSlider.value;
            
            // Create climate model instance for potential calculations
            const climateModel = new ClimateModel();
            
            // Disable slider during animation
            tempSlider.disabled = true;
            
            const simIceGroup = earth.extras.simIceGroup;
            simIceGroup.visible = true;

            const { temperatures, albedos } = currentSimulation;
            const FPS = 60;
            const FRAME_TIME = 5000 / FPS;
            let lastFrameTime = 0;
            let frameIndex = 0;
            const TEMP_THRESHOLD = 0.05;  // Use same threshold as plot update
            const equilibriumTemp = temperatures[temperatures.length - 1];
            const equilibriumIndex = temperatures.findIndex(temp => 
                Math.abs(temp - equilibriumTemp) < TEMP_THRESHOLD
            );
            const endIndex = equilibriumIndex !== -1 ? equilibriumIndex + 1 : temperatures.length;

            let animationFrame;

            // Force remove any existing tracking dot before starting
            simVPlot.extras.plot.removeTrackingDot();
            
            const animate = (currentTime) => {
                if (currentTime - lastFrameTime < FRAME_TIME) {
                    animationFrame = requestAnimationFrame(animate);
                    return;
                }
                
                if (frameIndex < endIndex && Math.abs(temperatures[frameIndex] - equilibriumTemp) > TEMP_THRESHOLD) {
                    // Update ice
                    const albedo = albedos[frameIndex];
                    const scale = Math.min(Math.max((albedo - 0.13) / (0.57 - 0.13), 0), 1);
                    simIceGroup.children.forEach(icePatch => {
                        icePatch.scale.set(scale, scale, 1);
                    });
                    
                    // Update tracking dot
                    const currentPotential = climateModel.calculatePotential(temperatures[frameIndex], parseFloat(gValue));
                    simVPlot.extras.plot.updateTrackingDot(temperatures[frameIndex], currentPotential);
                    
                    // Update slider position
                    tempSlider.value = temperatures[frameIndex];
                    
                    // Add solution plot update
                    simSolutionPlot.extras.plot.animateToPoint(
                        currentSimulation.times[frameIndex],
                        temperatures[frameIndex]
                    );
                    
                    frameIndex++;
                    lastFrameTime = currentTime;
                    animationFrame = requestAnimationFrame(animate);
                } else {
                    // Animation complete - use final values at endIndex
                    cancelAnimationFrame(animationFrame);
                    tempSlider.disabled = false;
                    
                    // Set final values using endIndex
                    const finalTemp = temperatures[endIndex - 1];
                    tempSlider.value = finalTemp;
                    const finalPotential = climateModel.calculatePotential(finalTemp, parseFloat(gValue));
                    simVPlot.extras.plot.updateTrackingDot(finalTemp, finalPotential);
                    
                    simSolutionPlot.extras.plot.finishAnimation();
                }
            };

            // Initialize both plots
            const initialTemp = temperatures[0];
            const initialPotential = climateModel.calculatePotential(initialTemp, parseFloat(gValue));
            simVPlot.extras.plot.initTrackingDot(initialTemp, initialPotential);
            simSolutionPlot.extras.plot.startAnimation(currentSimulation);

            animationFrame = requestAnimationFrame(animate);
        });

        // Add temperature slider handler
        document.addEventListener('temp-slider-change', (event) => {
            const tempValue = event.detail.value;
            
            // Add immediate ice size update
            const earth = this.objects.get('earth');
            if (earth && earth.extras && earth.extras.simIceGroup) {
                const climateModel = new ClimateModel();
                const albedo = climateModel.calculateAlbedo(parseFloat(tempValue));
                const scale = Math.min(Math.max((albedo - 0.13) / (0.57 - 0.13), 0), 1);
                
                // Only update if not in animation
                if (!earth.extras.simIceGroup.children[0]?.userData.isAnimating) {
                    earth.extras.simIceGroup.children.forEach(icePatch => {
                        icePatch.scale.set(scale, scale, 1);
                    });
                }
            }
        });

        extraConfig.forEach(config => {
            if (config.type === 'background') {
                this.backgroundManager.loadBackground(config);
            }
        });

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enabled = true;

        // Add this after other object lifecycle handling
        document.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = window.scrollY / scrollHeight;
            
            // Handle animated solution plot lifecycle
            globalConfig.objects.forEach(config => {
                if (config.type === 'animatedSolutionPlot') {
                    const plot = this.objects.get(config.id);
                    if (plot && plot.extras && plot.extras.plot) {
                        if (progress >= config.transition.entry_from.at && 
                            progress <= config.transition.exit_to.at) {
                            plot.extras.plot.startAnimation();
                        } else {
                            plot.extras.plot.stopAnimation();
                        }
                    }
                }
            });
        });
    }

    setupScene() {
        // Three.js setup
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x1B2737);
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Position camera
        this.camera.position.x = -4;
        this.camera.position.y = 3.2;
        this.camera.position.z = 3;

        // this.camera.position.x = 0;
        // this.camera.position.y = 0;
        // this.camera.position.z = 7;

        // this.scene.position.set(0, 1, 0);


        // Add camera lookAt - can be removed if needed
        this.camera.lookAt(0, 0, 0);  // Look at origin/center of scene

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x1B2737, 1);
        this.renderer.outputColorSpace = 'srgb';
        THREE.ColorManagement.enabled = true;

        this.container.appendChild(this.renderer.domElement);

        // Create objects container
        this.objects = new Map();

        // Add lighting for 3D objects
        // Ambient light provides overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.05);
        this.scene.add(ambientLight);
        
        // Directional light simulates sunlight
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-10, 5, 10);
        this.scene.add(directionalLight);
        
        // Hemisphere light provides natural sky/ground lighting variation
        const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0x000000, 1);
        this.scene.add(hemisphereLight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enabled = false;
    }

    setupObjects() {
        globalConfig.forEach(config => {
            this.lifecycle.registerObject(config);
            
            const object = ObjectFactory.createObject(config);
            
            if (object.type === 'text') {
                this.container.appendChild(object.element);
            } else if (object.type === '3dObject') {
                this.scene.add(object.object);
            }
            
            this.objects.set(config.id, object);
        });

        // Immediate initial update
        this.updateObjects();
    }

    updateObjects() {
        const visibleObjects = this.lifecycle.getVisibleObjects();
        
        // First hide all non-3D objects
        this.objects.forEach((object) => {
            if (object.type === '3dObject') return;  // Skip 3D objects
            if (object.type === 'plot') {  // Handle plots
                object.object.style.display = 'none';
            } else {  // Handle other DOM elements
                object.element.style.display = 'none';
            }
        });
     
        visibleObjects.forEach(({ id, state }) => {
            const object = this.objects.get(id);
            if (!object) return;
     
            const { position, opacity, transforms, visible } = state;
     
            if (object.type === '3dObject') {
                // Special case for Earth to ensure its scale doesn't change when scrolling starts
                if (id === 'earth') {
                    // Only apply position, not scale changes at the beginning
                    object.object.position.set(
                        (position.x - 50) / 25,
                        -(position.y - 50) / 25,
                        0
                    );
                    
                    // Ensure Earth scale is always 1.0
                    object.object.scale.setScalar(1.0);
                    
                    // Make sure atmosphere is visible
                    if (object.extras && object.extras.atmosphereHotNonlinear) {
                        object.extras.atmosphereHotNonlinear.visible = true;
                    }
                    
                    // Apply other transforms if needed
                    if (transforms.translation) {
                        object.object.position.x += transforms.translation.x / 50;
                        object.object.position.y -= transforms.translation.y / 50;
                    }
                    
                    if (transforms.rotation) {
                        object.object.rotation.z = transforms.rotation;
                    }
                } else {
                    // Normal handling for other 3D objects
                    const normalizedX = (position.x - 50) / 25;
                    const normalizedY = -(position.y - 50) / 25;
                    
                    object.object.position.set(
                        normalizedX,
                        normalizedY,
                        0
                    );
                    
                    if (transforms.scale && object.extras?.shadowCylinder) {
                        const scale = transforms.scale;
                        const cylinderLength = 4;
                        
                        object.object.scale.setScalar(scale);
                        object.extras.shadowCylinder.scale.setScalar(scale);
                        object.extras.shadowCylinder.position.x = (cylinderLength/2) * scale;
                    }
                    
                    if (transforms.translation) {
                        object.object.position.x += transforms.translation.x / 50;
                        object.object.position.y -= transforms.translation.y / 50;
                    }
                    
                    if (transforms.rotation) {
                        object.object.rotation.z = transforms.rotation;
                    }
                }
                
                // Add camera look handling
                if (transforms.camera_look) {
                    const look = transforms.camera_look;
                    this.camera.lookAt(look.x, look.y, look.z);
                }
            } else if (object.type.includes('plot')) {  // Handle all plot types
                if (visible) {
                    object.object.style.display = 'block';
                    object.object.style.opacity = opacity;
                    object.object.style.transform = this.getTransformString(transforms);
                    
                    // Enhanced logging
                    if (!object.positionLogged) {
                        // console.log('Plot object details:', {
                        //     objectId: object.object.id,  // Log the actual element ID
                        //     parentId: object.object.parentElement?.id,  // Log parent ID if it exists
                        //     type: object.type,
                        //     element: object.object,
                        //     className: object.object.className
                        // });
                        object.positionLogged = true;
                    }
                    
                    // Check by ID instead of type
                    switch (object.object.id) {
                        case 'sim-v-plot':
                            // Let CSS handle positioning
                            break;
                        case 'sim-solution-plot':
                            // Let CSS handle positioning
                            break;
                        case 'explanation-potential':
                            object.object.style.left = `${position.x}%`;
                            object.object.style.top = `${position.y}%`;
                            break;
                        case 'explanation-temperature':
                            object.object.style.left = `${position.x}%`;
                            object.object.style.top = `${position.y}%`;
                            break;
                        default:
                            object.object.style.left = `${position.x}%`;
                            object.object.style.top = `${position.y}%`;
                    }
                }
            } else {  // Handle other DOM elements
                if (visible) {
                    object.element.style.display = 'block';
                    object.element.style.left = `${position.x}%`;
                    object.element.style.top = `${position.y}%`;
                    object.element.style.opacity = opacity;
                    object.element.style.transform = this.getTransformString(transforms);
                    
                    // Add MathJax reprocessing only if element contains math
                    if (object.element.innerHTML.match(/\$\$(.*?)\$\$|\$(.*?)\$/)) {
                        MathJax.typesetPromise([object.element]).catch(err => {
                            console.warn('MathJax reprocessing failed:', err);
                        });
                    }
                }
            }
        });
     }

    getTransformString(transforms) {
        const parts = [];
        if (transforms.scale) parts.push(`scale(${transforms.scale})`);
        if (transforms.translation) {
            parts.push(`translate(${transforms.translation.x}px, ${transforms.translation.y}px)`);
        }
        if (transforms.rotation) parts.push(`rotate(${transforms.rotation}rad)`);
        return parts.join(' ');
    }

    bindEvents() {
        let forceUnlocked = false;
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;
        let lockedPosition = null;

        const handleScroll = (e) => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = window.scrollY / scrollHeight;
            
            scrollVelocity = Math.abs(window.scrollY - lastScrollY);
            lastScrollY = window.scrollY;
            
            if (progress >= SIM_SEGMENT_LOCK_START_AT && progress <= SIM_SEGMENT_LOCK_END_AT && !forceUnlocked) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!lockedPosition) {
                    lockedPosition = window.scrollY;
                }
                
                window.scrollTo(0, lockedPosition);
                return false;
            }
            
            // Reset lock when outside range on EITHER side
            if (progress < SIM_SEGMENT_LOCK_START_AT || progress > SIM_SEGMENT_LOCK_END_AT) {
                forceUnlocked = false;
                lockedPosition = null;
            }
        };

        // Bind to both wheel and touch events
        window.addEventListener('wheel', handleScroll, { passive: false });
        window.addEventListener('touchmove', handleScroll, { passive: false });

        // Button handler stays the same
        const returnButton = this.objects.get('return-to-story');
        if (returnButton && returnButton.element) {
            returnButton.element.addEventListener('click', () => {
                forceUnlocked = true;
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({
                    // top: Math.floor(SIM_SEGMENT_RETURN_BACK_AT * scrollHeight),
                    top: SIM_SEGMENT_RETURN_BACK_AT * scrollHeight,
                    behavior: 'smooth'
                });
            });
        }

        // Add new forward button handler
        const forwardButton = this.objects.get('forward-to-story');
        if (forwardButton && forwardButton.element) {
            forwardButton.element.addEventListener('click', () => {
                forceUnlocked = true;
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({
                    // top: Math.floor(SIM_SEGMENT_FORWARD_TO_AT * scrollHeight),
                    top: SIM_SEGMENT_FORWARD_TO_AT * scrollHeight,
                    behavior: 'smooth'
                });
            });
        }

        window.addEventListener('scroll', () => {
            const now = Date.now();
            const timeDelta = now - (this.lastScrollTime || now);
            this.lastScrollTime = now;
            
            const currentScrollY = window.scrollY;
            const scrollDelta = Math.abs(currentScrollY - this.lastScrollY);
            this.lastScrollY = currentScrollY;
            
            // Calculate scroll velocity (pixels per millisecond)
            this.scrollVelocity = scrollDelta / (timeDelta || 1);
            
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = currentScrollY / scrollHeight;
            
            // Comment out debug logging
            // this.debugLogger.logProgress(progress);
            // this.debugOverlay.updateProgress(progress);
            // this.debugOverlay.updateScene(this.getCurrentScene(progress));
            
            this.lifecycle.updateProgress(progress);
            
            // Get Earth object and its extras
            const earth = this.objects.get('earth');
            if (earth && earth.extras) {
                // Handle visibility and textures
                extraConfig.forEach(config => {
                    const entryAt = config.entry?.at || 0;
                    const exitAt = config.exit?.at || 1.0;
                    
                    if (config.id === 'earthTexture') {
                        if (progress >= entryAt && progress <= exitAt) {
                            const texture = this.earthTextures.get(config.file);
                            if (texture && earth.extras.material.map !== texture) {
                                earth.extras.material.map = texture;
                                earth.extras.material.needsUpdate = true;
                            }
                            return; // Exit once we find an active texture
                        }
                    } else if (config.id === 'iceGroup') {
                        const iceGroup = earth.extras.iceGroup;
                        // console.log('Ice Group Check:', {
                        //     progress,
                        //     entryAt,
                        //     exitAt,
                        //     shouldBeVisible: progress >= entryAt && progress <= exitAt
                        // });
                        if (progress >= entryAt && progress <= exitAt) {
                            iceGroup.visible = true;
                            // console.log('Setting ice visible:', {
                            //     progress,
                            //     entryAt,
                            //     exitAt,
                            //     actualVisibility: iceGroup.visible
                            // });
                            // Calculate growth progress
                            const growthProgress = (progress - entryAt) / (exitAt - entryAt);
                            const radius = config.maxRadius * growthProgress;
                            
                            // Update each ice patch
                            iceGroup.children.forEach(patch => {
                                patch.scale.set(radius, radius, 1);
                            });
                        } else {
                            iceGroup.visible = false;
                        }
                    } else if (config.id === 'atmosphereHotNonlinear') {
                        const regularAtmosphere = earth.extras.atmosphereHotNonlinear;
                        if (regularAtmosphere) {
                            regularAtmosphere.visible = progress >= entryAt && progress <= exitAt;
                        }
                    } else if (config.id === 'simAtmosphereHotNonlinear') {
                        const simAtmosphere = earth.extras.simAtmosphereHotNonlinear;
                        if (simAtmosphere) {
                            const shouldBeVisible = progress >= entryAt && progress <= exitAt;
                            simAtmosphere.visible = shouldBeVisible;
                            // console.log('Sim atmosphere visibility:', {
                            //     progress,
                            //     entryAt,
                            //     exitAt,
                            //     shouldBeVisible,
                            //     isVisible: simAtmosphere.visible
                            // });
                        }
                    } else if (config.id === 'simIceGroup') {
                        const simIceGroup = earth.extras.simIceGroup;
                        if (progress >= entryAt && progress <= exitAt) {
                            simIceGroup.visible = true;
                            // Calculate growth progress
                            const growthProgress = (progress - entryAt) / (exitAt - entryAt);
                            const radius = config.maxRadius * growthProgress;
                            
                            // Update each ice patch
                            simIceGroup.children.forEach(patch => {
                                patch.scale.set(radius, radius, 1);
                            });
                        } else {
                            simIceGroup.visible = false;
                        }
                    } else {
                        const extra = earth.extras[config.id];
                        if (extra) {
                            extra.visible = progress >= entryAt && progress <= exitAt;
                        }
                    }
                });
                
                // If no texture config is active, use default
                const isAnyTextureActive = extraConfig.some(config => 
                    config.id === 'earthTexture' && 
                    progress >= (config.entry?.at || 0) && 
                    progress <= (config.exit?.at || 1.0)
                );
                
                if (!isAnyTextureActive) {
                    const defaultTexture = this.earthTextures.get('default');
                    if (defaultTexture && earth.extras.material.map !== defaultTexture) {
                        earth.extras.material.map = defaultTexture;
                        earth.extras.material.needsUpdate = true;
                    }
                }
            }

            this.backgroundManager.updateProgress(progress);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate Earth around Y-axis
        const earth = this.objects.get('earth');
        if (earth && earth.object) {
            // const rotationSpeed = 0.0005;
            const rotationSpeed = 0;

            // Earth tilt is around Z by -23.5°, so spin axis is original Y, tilted by -23.5° around Z.
            const tiltAngle = 23.5 * Math.PI / 180;
            const rotationAxis = new THREE.Vector3(0, 1, 0)
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), tiltAngle)
                .normalize();

            // Rotate around that single tilted axis
            earth.object.rotateOnAxis(rotationAxis, rotationSpeed);

            // Handle jet streams and sea ice visibility/animation
            if (earth.extras) {
                // Existing jet stream code
                Object.entries(earth.extras).forEach(([id, object]) => {
                    if (id.startsWith('jetStream') && object && object.visible && object.userData.animate) {
                        object.userData.animate(performance.now() * 0.0001);
                    }
                });

                // Add sea ice handling
                ['seaIce2001', 'seaIce2002', 'seaIce2003'].forEach(id => {
                    const seaIce = earth.extras[id];
                    if (seaIce && seaIce.visible) {
                        // Currently no animation, just ensuring visibility is handled
                        seaIce.visible = true;
                    }
                });
            }
        }

        // Calculate velocity and decay it over time
        if (this.scrollVelocity > 0) {
            this.scrollVelocity *= 0.95;
        }
        
        // Force update if we were scrolling fast and just stopped
        if (this.lastScrollTime && Date.now() - this.lastScrollTime > 150) {
            if (this.scrollVelocity > 0.5) {
                const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                this.lifecycle.forceUpdateStates(progress);
            }
            this.lastScrollTime = null;
            this.scrollVelocity = 0;
        }
        
        this.updateObjects();
        this.renderer.render(this.scene, this.camera);

        this.controls.update();
    }

    getCurrentScene(progress) {
        // Get all visible objects at current progress
        const visibleObjects = this.lifecycle.getVisibleObjects();
        
        // Find the highest segment number among visible objects
        let currentScene = 0;  // Default to scene 1
        
        visibleObjects.forEach(({ id }) => {
            if (id.startsWith('segment-')) {
                const sceneNum = parseInt(id.split('-')[1]);
                if (!isNaN(sceneNum) && sceneNum > currentScene) {
                    currentScene = sceneNum;
                }
            }
        });
        
        return currentScene;
    }

    initSimulation() {
        if (!this.simulationScene) {
            this.simulationScene = new SimulationScene(this.container);
            this.simulationScene.onReturnToStory = () => this.exitSimulation();
        }
    }
    
    enterSimulation() {
        // Fade out current scene
        this.container.style.opacity = 0;
        
        setTimeout(() => {
            // Hide scroll scene
            this.container.style.display = 'none';
            document.body.style.overflow = 'hidden';  // Disable scrolling
            
            // Show and fade in simulation
            this.container.style.display = 'block';
            this.simulationScene.activate();
            this.container.style.opacity = 1;
        }, 500);  // Match fade duration
    }
    
    exitSimulation() {
        // Fade out simulation
        this.container.style.opacity = 0;
        
        setTimeout(() => {
            // Hide simulation
            this.simulationScene.deactivate();
            
            // Force scene refresh by reloading the page and setting scroll position
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const targetScroll = scrollHeight * 0.9;
            
            // Store target scroll position in sessionStorage
            sessionStorage.setItem('returnScroll', targetScroll);
            
            // Reload page
            window.location.reload();
        }, 500);
    }

    moveEarthInScreenSpace(verticalOffset) {
        const earth = this.objects.get('earth');
        if (!earth || !earth.object) return;
        
        // Get current position in world space
        const worldPos = new THREE.Vector3();
        earth.object.getWorldPosition(worldPos);
        
        // Project current position to NDC (Normalized Device Coordinates)
        const screenPos = worldPos.clone().project(this.camera);
        
        // Adjust Y in screen space (NDC coordinates are in range -1 to 1)
        screenPos.y += verticalOffset / 1000; 
        
        // Keep X and Z unchanged
        const newWorldPos = screenPos.unproject(this.camera);
        
        // Update only the Y position
        earth.object.position.y = newWorldPos.y;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ScrollCanvas('canvas-container');
});

// Add this easing function (optional, but makes movement smoother)
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
