import { sceneContent } from '../content/contentForExport.js';


/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} TransitionPoint
 * @property {number} x
 * @property {number} y
 * @property {number} at - Scroll progress when transition starts (0-1)
 * @property {number} duration - Duration of transition in scroll progress (0-1)
 */

/**
 * @typedef {Object} Transformation
 * @property {string} type - "scale" | "translation" | "rotation"
 * @property {number} at - Scroll progress when transform starts (0-1)
 * @property {number} duration - Duration of transform in scroll progress (0-1)
 * @property {number} [scale_to] - Target scale for "scale" type
 * @property {number} [delta_x] - X translation for "translation" type
 * @property {number} [delta_y] - Y translation for "translation" type
 * @property {number} [rotate_to] - Target rotation for "rotation" type
 */

/**
 * @typedef {Object} ObjectConfig
 * @property {string} id - Unique identifier
 * @property {string} type - "header" | "description" | "3dObject"
 * @property {string} [content] - Text content if applicable
 * @property {Position} position - Resting position
 * @property {Object} transition - Entry and exit transitions
 * @property {TransitionPoint} [transition.entry_from] - Entry transition
 * @property {TransitionPoint} [transition.exit_to] - Exit transition
 * @property {Transformation[]} [transformations] - Array of transformations
 */

// 1. First, define all constants and default exports
const EARTH_X = 50;  // Center of screen horizontally
const EARTH_Y = 50;  // Center of screen vertically

export const TITLE_X = 5;
export const TITLE_Y = 15;
export const TITLE_DESC_X = 5;
export const TITLE_DESC_Y = TITLE_Y + 10;


export const HEADER_X = 5;
export const HEADER_Y = 10;
export const DESC_X = HEADER_X;
export const DESC_Y = HEADER_Y + 10;

const SCROLL_dX = 0;
const SCROLL_dY = 100;



const NUM_SCENES = 8;
const SCENE_DURATION = 1 / NUM_SCENES;          // Each scene is 1/n of total progress
const TRANSITION_DURATION_FRAC = 0.2;         // Transitions take 10% of scene duration
const TRANSITION_DURATION = SCENE_DURATION * TRANSITION_DURATION_FRAC;
const HEIGHT_MULTIPLIER = 300;


// Scene Control
export const sceneControl = {
    numScenes: NUM_SCENES,
    sceneDuration: SCENE_DURATION,
    transitionDuration: TRANSITION_DURATION,
    heightMultiplier: HEIGHT_MULTIPLIER
};

// Scene Configuration
export const sceneConfig = {
    totalScenes: NUM_SCENES,
    heightPerScene: HEIGHT_MULTIPLIER,
    totalHeight: NUM_SCENES * HEIGHT_MULTIPLIER
};

// Type-specific defaults
export const typeDefaults = {
    header: {
        position: { x: HEADER_X, y: HEADER_Y },
        transition: {
            entry_from: {
                x: HEADER_X + SCROLL_dX, y: HEADER_Y + SCROLL_dY,
                opacity: 0
            },
            exit_to: {
                x: HEADER_X - SCROLL_dX, y: HEADER_Y - SCROLL_dY,
                opacity: 0
            }
        }
    },
    description: {
        position: { x: DESC_X, y: DESC_Y },
        transition: {
            entry_from: {
                x: DESC_X + SCROLL_dX, y: DESC_Y + SCROLL_dY,
                opacity: 0
            },
            exit_to: {
                x: DESC_X - SCROLL_dX, y: DESC_Y - SCROLL_dY,
                opacity: 0
            }
        }
    }
};

export const defaults = {
    transition: {
        duration: TRANSITION_DURATION,
        opacity: { entry: 1, exit: 0, initial: 0 },
        entry: { duration: TRANSITION_DURATION },
        exit: { duration: TRANSITION_DURATION }
    },
    transform: { duration: TRANSITION_DURATION }
};

// 2. Define configObjects before using it
const configObjects = [
    {   // --------------------- EARTH ---------------------
        id: "earth",
        type: "3dObject",
        position: { x: EARTH_X, y: EARTH_Y },
        transition: {
            entry_from: { x: EARTH_X, y: EARTH_Y, at: 0, duration: 0.1 },
            exit_to: null
            // exit_to: { x: EARTH_X, y: EARTH_Y - SCROLL_dY, at: 0.9, duration: 0.01 }
        },
        transformations: [
            {
                type: "scale",
                scale_to: 0.1,
                at: 0.2, duration: 0.05
            },
            {
                type: "scale",
                scale_to: 1,
                at: 0.25, duration: 0.05
            },
            {
                type: "camera_look",
                look_x: 20,     // Look 2 units right
                look_y: 38,     // Keep vertical look same
                look_z: 0,     // Keep depth same
                at: 0.9,       // Start at 20% scroll
                duration: 0.05  // Take 5% of scroll to complete
            }
        ]
    },
    {   // --------------------- SCENE 0 ---------------------
        id: "title",
        type: "titleText",
        initiallyVisible: true,
        position: { x: TITLE_X, y: TITLE_Y },
        transition: {
            entry_from: {
                x: TITLE_X, y: TITLE_Y,
                duration: 0.001, 
                opacity: 1
            },
            exit_to: {
                x: TITLE_X, y: TITLE_Y - SCROLL_dY,
                opacity: 1
            }
        }
    },
    {   // --------------------- SCENE 0 ---------------------
        id: "description-title-1",
        type: "description",
        initiallyVisible: true,
        position: { x: TITLE_DESC_X, y: TITLE_DESC_Y },
        transition: {
            entry_from: {
                x: TITLE_DESC_X, y: TITLE_DESC_Y,
                at: 0, duration: 0.001, opacity: 1, duration: 0.05
            },
            exit_to: {
                x: TITLE_DESC_X, y: TITLE_DESC_Y - SCROLL_dY,
                at: SCENE_DURATION, opacity: 1
            }
        }
    },

    {
        id: "my-annotation",
        type: "annotation",
        content: "Your annotation text here",
        position: { x: 40, y: 20 },  // Screen coordinates
        transition: {
            entry_from: {
                x: 40, y: 20,  // Starting position
                at: 0.53,  // When to start appearing
                duration: 0.01,
                opacity: 0
            },
            exit_to: {
                x: 40, y: 20,  // Exit position (typically moves up)
                at: 0.58,  // When to start disappearing
                duration: 0.01,
                opacity: 0
            }
        }
    },

    {
        id: 'return-to-story',
        type: 'button',
        position: {
            x: 50,
            y: 5
        },
        style: {
            cursor: 'pointer',
            border: 'none',
            padding: '10px',
            className: 'scroll-button scroll-button-up'
        },
        transition: {
            entry_from: {
                at: 0.85,
                opacity: 0,
                duration: 0.2
            },
            exit_to: {
                at: 0.96,
                opacity: 0,
                duration: 0.2
            }
        }
    },
    {
        id: 'forward-to-story',
        type: 'button',
        // content: '⌃',
        position: {
            x: 50,
            y: 90
        },
        style: {
            // fontSize: '96px',
            cursor: 'pointer',
            border: 'none',
            padding: '10px',
            className: 'scroll-button scroll-button-down'
        },
        transition: {
            entry_from: {
                at: 0.85,
                opacity: 0,
                duration: 0.2
            },
            exit_to: {
                at: 0.96,
                opacity: 0,
                duration: 0.2
            }
        }
    },
    {   // --------------------- SIMULATION CONTROLS ---------------------
        id: "sim-controls",
        type: "sim-controls",
        position: {
            x: HEADER_X,    // Position on right side of screen
            y: HEADER_Y + 20     // Vertically centered
        },
        transition: {
            entry_from: {
                x: HEADER_X,
                y: HEADER_Y + SCROLL_dY,
                at: 0.9,        // Appear with simulation scene
                opacity: 0,
                // duration: 0.01 
            },
            exit_to: {
                x: HEADER_X,
                y: HEADER_Y - SCROLL_dY,
                at: 0.96,       // Disappear when leaving simulation
                opacity: 0,
                // duration: 0.01 
            }
        }
    },
    {   // --------------------- POTENTIAL PLOT ---------------------
        id: "sim-v-plot",
        type: "sim-v-plot",
        position: {
            x: HEADER_X,
            y: HEADER_Y + 40
        },
        transition: {
            entry_from: {
                x: HEADER_X,
                y: HEADER_Y + SCROLL_dY,
                at: 0.9,        // Appear with simulation scene
                opacity: 0,
                // duration: 0.01 
            },
            exit_to: {
                x: HEADER_X,
                y: HEADER_Y - SCROLL_dY,
                at: 0.96,       // Disappear when leaving simulation
                opacity: 0,
                // duration: 0.01 
            }
        }
    }
];

// 3. Initialize globalConfig with configObjects immediately
export const globalConfig = [...configObjects];

console.log('Initial globalConfig:', globalConfig);

// 4. Fetch additional config
fetch('/src/content/generated_config.json')
    .then(response => {
        console.log('Fetch response:', response.status);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Additional config loaded:', data);
        // Filter out duplicates before adding
        const newData = data.filter(item => 
            !globalConfig.some(existing => existing.id === item.id)
        );
        globalConfig.push(...newData);
        console.log('Final globalConfig:', globalConfig);
    })
    .catch(error => {
        console.error('Error loading generated config:', error);
    });

// 6. Export extraConfig last
export const extraConfig = [
    // {
    //     id: "atmosphere",
    //     entry: { at: 0 },
    //     exit: { at: 0.9 }    
    // },
    {
        id: "atmosphereHotNonlinear",
        entry: { at: 0 },
        exit: { at: 0.90 }
    },
    {
        id: "shadowCylinder",
        entry: { at: 0.5 },
        exit: { at: 0.6 }
    },
    // {
    //     id: "earthTexture",
    //     file: 'public/assets/textures/water_world_pix.jpg',
    //     entry: { at: 0.32 },
    //     exit: { at: 0.88 }
    // },
    {
        id: "simAtmosphereHotNonlinear",
        entry: { at: 0.90 },
        exit: { at: 0.96 }
    },
    {
        id: "earthTexture",
        file: 'public/assets/textures/earth_noClouds.0330.jpg',
        entry: { at: 0.0 },
        exit: { at: 0.3 }
    },
    {
        id: "earthTexture",
        file: 'public/assets/textures/rodinia_unpix.png',
        entry: { at: 0.3 },
        exit: { at: 0.96 }
    },
    // {
    //     id: "earthTexture",
    //     file: 'public/assets/textures/earth_noClouds.0330.jpg',
    //     entry: { at: 0.4 },
    //     exit: { at: 0.6 }    
    // },
    {
        id: "iceGroup",
        entry: { at: 0.27 },
        exit: { at: 0.35 },
        maxRadius: 0.7  // Maximum size of ice patches
    },
    {
        id: "iceGroup",
        entry: { at: 0.55 },
        exit: { at: 0.85 },
        maxRadius: 0.9  // Maximum size of ice patches
    },
    {
        id: "simIceGroup",
        entry: { at: 0.9 },
        exit: { at: 0.96 },
        maxRadius: 0.2  // Maximum size of ice patches
    }
];

