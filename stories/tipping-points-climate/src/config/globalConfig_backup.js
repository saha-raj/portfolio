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

// Define constants in percentage values (0-100)
const EARTH_X = 50;  // Center of screen horizontally
const EARTH_Y = 50;  // Center of screen vertically

export const HEADER_X = 5;
export const HEADER_Y = 10;

export const TITLE_X = 5;
export const TITLE_Y = 15;

export const DESC_X = HEADER_X;
export const DESC_Y = HEADER_Y + 10;

const SCROLL_dX = 0;
const SCROLL_dY = 100;



const NUM_SCENES = 6;
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

/** @type {ObjectConfig[]} */

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
            // {
            //     type: "translation",
            //     delta_x: 150, 
            //     delta_y: 100,
            //     at: 0.05, duration: 0.05
            // },
            {
                type: "camera_look",
                look_x: 20,     // Look 2 units right
                look_y: 38,     // Keep vertical look same
                look_z: 0,     // Keep depth same
                at: 0.9,       // Start at 20% scroll
                duration: 0.05  // Take 5% of scroll to complete
            }
            // { 
            //     type: "camera_look",
            //     look_x: -1.6,     // Look 2 units right
            //     look_y: 0.63,     // Keep vertical look same
            //     look_z: 0,     // Keep depth same
            //     at: 0.1,       // Start at 20% scroll
            //     duration: 0.05  // Take 5% of scroll to complete
            // },
            // {
            //     type: "camera_look",
            //     look_x: 0,     // Return to center
            //     look_y: 0,
            //     look_z: 0,
            //     at: 0.2,      // Start at 25% scroll
            //     duration: 0.05
            // }
            // {
            //     type: "scale",
            //     scale_to: 1,
            //     at: 0.75,
            // }
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
                at: 0, duration: 0.001, opacity: 1, duration: 0.05
            },
            exit_to: {
                x: TITLE_X, y: TITLE_Y - SCROLL_dY,
                at: SCENE_DURATION, opacity: 1
            }
        }
    },
    {   // --------------------- SCENE 0 ---------------------
        id: "description-title-1",
        type: "description",
        initiallyVisible: true,
        position: { x: TITLE_X, y: TITLE_Y + 15 },
        transition: {
            entry_from: {
                x: TITLE_X, y: TITLE_Y + 15,
                at: 0, duration: 0.001, opacity: 1, duration: 0.05
            },
            exit_to: {
                x: TITLE_X, y: TITLE_Y + 15 - SCROLL_dY,
                at: SCENE_DURATION, opacity: 1
            }
        }
    },
    

    {   // --------------------- SCENE 1 ---------------------
        id: "header-1",
        type: "header",
        // content: "Climate Tipping Points",
        position: { x: HEADER_X, y: HEADER_Y },
        transition: {
            entry_from: {
                x: HEADER_X, y: HEADER_Y,
                at: 0.05, duration: 0.001, opacity: 0, duration: 0.05
            },
            exit_to: {
                x: HEADER_X, y: HEADER_Y - SCROLL_dY,
                at: SCENE_DURATION, opacity: 0
            }
        }
    },
    {
        id: "description-1",
        type: "description",
        // content:
        //     "Modeling the Earth's Climate is a complex affair. " +
        //     "It involves many different physical processes, " +
        //     "and many different types of data.",
        position: { x: DESC_X, y: DESC_Y },
        transition: {
            entry_from: {
                x: DESC_X, y: DESC_Y,
                at: 0, duration: 0.001, duration: 0.05
            },
            exit_to: {
                x: DESC_X, y: DESC_Y - SCROLL_dY,
                at: SCENE_DURATION,
            }
        }
    },
    {   // --------------------- SCENE 2 ---------------------
        id: "header-2",
        type: "header",
        // content: "A Pale Blue Dot",
        transition: {
            entry_from: { at: SCENE_DURATION },
            exit_to: { at: SCENE_DURATION * 2 }
        }
    },
    {
        id: "description-2",
        type: "description",
        // content:
        //     "What we do to simplify",
        position: { x: DESC_X, y: DESC_Y },
        transition: {
            entry_from: { at: SCENE_DURATION },
            exit_to: { at: SCENE_DURATION * 2 }
        }
    },
    {   // --------------------- SCENE 3 ---------------------
        id: "header-3",
        type: "header",
        // content: "Building (the simplest) Climate Model",
        transition: {
            entry_from: { at: SCENE_DURATION * 2 },
            exit_to: { at: SCENE_DURATION * 3 }
        }
    },
    {
        id: "description-3",
        type: "description",
        // content:
        //     "Energy Balance",
        transition: {
            entry_from: { at: SCENE_DURATION * 2 },
            exit_to: { at: SCENE_DURATION * 3 }
        }
    },
    {   // --------------------- SCENE 4 ---------------------
        id: "header-4",
        type: "header",
        // content: "Incoming Energy",
        transition: {
            entry_from: { at: SCENE_DURATION * 3 },
            exit_to: { at: SCENE_DURATION * 4 }
        }
    },
    {
        id: "description-4",
        type: "description",
        // content:
        //     "Ein, The Stefan-Boltzmann equation: $$P = \\beta A T^4$$ where $\\sigma$ is the Stefan-Boltzmann constant.",
        transition: {
            entry_from: { at: SCENE_DURATION * 3 },
            exit_to: { at: SCENE_DURATION * 4 }
        }
    },
    {
        id: "my-annotation",
        type: "annotation",
        // content: "Your annotation text here",
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
    {   // --------------------- SCENE 5 ---------------------
        id: "header-5",
        type: "header",
        // content: "Outgoing Energy",
        transition: {
            entry_from: { at: SCENE_DURATION * 4 },
            exit_to: { at: SCENE_DURATION * 5 }
        }
    },
    {
        id: "description-5",
        type: "description",
        // content:
        //     "Eout",
        transition: {
            entry_from: { at: SCENE_DURATION * 4 },
            exit_to: { at: SCENE_DURATION * 5 }
        }
    },
    {   // --------------------- SCENE 6 ---------------------
        id: "header-6",
        type: "header",
        // content: "Tipping Points",
        transition: {
            entry_from: { at: SCENE_DURATION * 5 },
            exit_to: { at: 0.9 }
        }
    },
    {
        id: "description-6",
        type: "description",
        // content:
        //     "Critical Transitions",
        transition: {
            entry_from: { at: SCENE_DURATION * 5 },
            exit_to: { at: 0.9 }
        }
    },
    // {   
    //     id: "simulation-button",
    //     type: "button",
    //     content: "Enter Simulation",
    //     position: { x: 50, y: 50 },
    //     transition: {
    //         entry_from: { at: 0.98, opacity: 0 },
    //         exit_to: { at: 1, opacity: 0 }
    //     }
    // }
    {
        id: 'return-to-story',
        type: 'button',
        // content: '⌃',
        position: {
            x: 50,
            y: 5
        },
        style: {
            // fontSize: '96px',
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
                at: 0.98,
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
                at: 0.98,
                opacity: 0,
                duration: 0.2
            }
        }
    },
    {   // --------------------- SIMULATION ---------------------
        id: "header-7",
        type: "header",
        // content: "Simulation",
        transition: {
            entry_from: { at: 0.9 },
            exit_to: { at: 0.96 }
        }
    },
    {
        id: "description-7",
        type: "description",
        // content:
        //     "Use the sliders to change the parameters of the simulation.",
        transition: {
            entry_from: { at: 0.9 },
            exit_to: { at: 0.96 }
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

export const globalConfig = configObjects.map(obj => {
    // Only check for content if it's a text-based type
    const needsContent = ['titleText', 'header', 'description', 'annotation', 'button'].includes(obj.type);
    
    if (needsContent && !sceneContent[obj.id]) {
        console.warn(`No content found for text element with id: ${obj.id}`);
    }

    return {
        ...obj,
        content: sceneContent[obj.id] || ''
    };
});

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

