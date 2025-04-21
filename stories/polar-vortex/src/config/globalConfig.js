import { sceneContent } from '../content/contentForExport_2.js';


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
 * @property {string} type - "header" | "segment" | "3dObject"
 * @property {string} [content] - Text content if applicable
 * @property {Position} position - Resting position
 * @property {Object} transition - Entry and exit transitions
 * @property {TransitionPoint} [transition.entry_from] - Entry transition
 * @property {TransitionPoint} [transition.exit_to] - Exit transition
 * @property {Transformation[]} [transformations] - Array of transformations
 */

/**
 * @typedef {Object} BackgroundConfig
 * @property {string} id - Unique identifier
 * @property {string} file - Path to image file
 * @property {number} entry.at - When to start showing
 * @property {number} exit.at - When to stop showing
 */





// -----------------------------------------
// --------------- CONSTANTS ---------------    
// -----------------------------------------

const DUR_TRANS_FRAC = 0.2;
const HEIGHT_MULTIPLIER = 150;
const DELAY_FRAC_SEGMENT = 0.05;

const EARTH_X = 50;  
const EARTH_Y = 35;  

export const INTRO_HEAD_X = 50;
export const INTRO_HEAD_Y = 60;
export const INTRO_SEGMENT_X = 50;
export const INTRO_SEGMENT_Y = 75;

export const HEAD_X = 50;
export const HEAD_Y = 10;
export const SEGMENT_X = HEAD_X;
export const SEGMENT_Y = 75;

const SCROLL_dX = 0;
const SCROLL_dY = 50;

const SIM_SEGMENT_NUM = 28; // as in contentForExport.js

// -----------------------------------------
// -----------------------------------------



const NUM_SEGMENTS = Object.keys(sceneContent)
    .filter(key => key.startsWith('segment-'))
    .length;

const DUR_SEGMENT = 1 / NUM_SEGMENTS;


// const DUR_SEGMENT = 1 / NUM_SEGMENTS;
export const DUR_TRANS = DUR_SEGMENT * DUR_TRANS_FRAC;
export const DELAY = DUR_SEGMENT * DELAY_FRAC_SEGMENT;

export const SIM_SEGMENT_START_AT = (SIM_SEGMENT_NUM / NUM_SEGMENTS);
export const SIM_SEGMENT_END_AT   = (SIM_SEGMENT_NUM + 1) / NUM_SEGMENTS;
export const SIM_SEGMENT_LOCK_START_AT = SIM_SEGMENT_START_AT + DUR_TRANS;
export const SIM_SEGMENT_LOCK_END_AT   = SIM_SEGMENT_END_AT;


export const SIM_SEGMENT_RETURN_BACK_AT = (SIM_SEGMENT_NUM - 1) / NUM_SEGMENTS + DUR_TRANS;
export const SIM_SEGMENT_FORWARD_TO_AT = SIM_SEGMENT_END_AT + DUR_TRANS;

export const sceneConfig = {
    totalScenes: NUM_SEGMENTS,
    heightPerScene: HEIGHT_MULTIPLIER,
    totalHeight: NUM_SEGMENTS * HEIGHT_MULTIPLIER
};

export const defaults = {
    transition: {
        duration: DUR_TRANS,
        opacity: { entry: 1, exit: 0, initial: 0 },
        entry: { duration: DUR_TRANS },
        exit: { duration: DUR_TRANS }
    },
    transform: { duration: DUR_TRANS }
};

// Type-specific defaults
export const typeDefaults = {
    'intro-header': {
        position: { x: INTRO_HEAD_X, y: INTRO_HEAD_Y },
        initiallyVisible: true,
        transition: {
            entry_from: {
                x: INTRO_HEAD_X, y: INTRO_HEAD_Y,
                opacity: 1
            },
            exit_to: {
                x: INTRO_HEAD_X, y: INTRO_HEAD_Y - SCROLL_dY,
                opacity: 1
            }
        }
    },
    'intro-segment': {
        position: { x: INTRO_SEGMENT_X, y: INTRO_SEGMENT_Y },
        initiallyVisible: true,
        transition: {
            entry_from: {
                x: INTRO_SEGMENT_X, y: INTRO_SEGMENT_Y,
                opacity: 1
            },
            exit_to: {
                x: INTRO_SEGMENT_X, y: INTRO_SEGMENT_Y - SCROLL_dY,
                opacity: 0
            }
        }
    },
    'header': {
        position: { x: HEAD_X, y: HEAD_Y },
        transition: {
            entry_from: {
                x: HEAD_X + SCROLL_dX, y: HEAD_Y + SCROLL_dY,
                opacity: 0
            },
            exit_to: {
                x: HEAD_X - SCROLL_dX, y: HEAD_Y - SCROLL_dY,
                opacity: 0
            }
        }
    },
    'segment': {
        position: { x: SEGMENT_X, y: SEGMENT_Y },
        transition: {
            entry_from: {
                x: SEGMENT_X + SCROLL_dX, y: SEGMENT_Y + SCROLL_dY,
                opacity: 0
            },
            exit_to: {
                x: SEGMENT_X - SCROLL_dX, y: SEGMENT_Y - SCROLL_dY,
                opacity: 0
            }
        }
    }
};



/** @type {ObjectConfig[]} */

const configObjects = [

    {   // --------------------- EARTH ---------------------
        id: "earth",
        type: "3dObject",
        position: { x: EARTH_X, y: EARTH_Y },
        initiallyVisible: true,
        transition: {
            entry_from: null,
            exit_to: null
        },
        transformations: [
            {
                type: "scale",
                scale_to: 1.0,
                at: 0,
                duration: 0.0
            }
        ]
    },


    // Add date annotations for Feb 1-14, 2010 in scene 2
    ...Array.from({ length: 14 }, (_, i) => {
        const day = i + 1;  // Start from Feb 1
        
        const date = `February ${day}, 2010`;
        const segmentStart = DUR_SEGMENT * 2;  // Start at segment 2
        const duration = DUR_SEGMENT * 1 / 14;  // Spread across 1 segment (14 days)
        const startAt = segmentStart + (duration * i);
        const endAt = startAt + duration;
        
        return {
            id: `date2010-02-${day.toString().padStart(2, '0')}`,
            type: "annotation",
            content: date,
            position: { x: 50, y: 55 },
            transition: {
                entry_from: {
                    x: 50, y: 55,
                    at: startAt,
                    duration: 0.001,  // Fast fade in
                    opacity: 0
                },
                exit_to: {
                    x: 50, y: 55,
                    at: endAt,
                    duration: 0.001,  // Fast fade out
                    opacity: 0
                }
            }
        };
    }).filter(Boolean),



    {
        id: "background-2",
        type: "background",
        file: `${import.meta.env.BASE_URL}assets/backgrounds/pbd.webp`,
        entry: { at: 0 },
        exit: { at: 1 }
    },

];

// Override positions
const textConfigOverrides = {
    'segment-23': {
        position: { x: SEGMENT_X, y: SEGMENT_Y-28},  
    }
};

// Debug: log the content we're working with
// console.log('Scene content:', sceneContent);

// Get all header numbers in sequence
const headerNumbers = Object.keys(sceneContent)
    .filter(key => key.startsWith('header-'))
    .map(key => parseInt(key.split('-')[1]))
    .sort((a, b) => a - b);

// Create map of header number to next header number
const nextHeaderMap = {};
headerNumbers.forEach((num, index) => {
    nextHeaderMap[num] = index < headerNumbers.length - 1 ? 
        headerNumbers[index + 1] : 
        NUM_SEGMENTS; // For last header, use total segments
});


// Only add timing to numbered header and segment text objects
const textConfigObjects = Object.entries(sceneContent)
    .filter(([id]) => id.startsWith('header-') || id.startsWith('segment-'))
    .map(([id, content]) => {
        const segmentNum = parseInt(id.split('-')[1]);
        const type = id === 'header-0' ? 'intro-header' : 
                  id === 'segment-0' ? 'intro-segment' :
                  id.startsWith('header') ? 'header' : 'segment';
        
        // Set position based on type
        let position;
        if (type === 'intro-header') {
            position = { x: INTRO_HEAD_X, y: INTRO_HEAD_Y };
        } else if (type === 'intro-segment') {
            position = { x: INTRO_SEGMENT_X, y: INTRO_SEGMENT_Y };
        } else if (type === 'header') {
            position = { x: HEAD_X, y: HEAD_Y };
        } else {
            position = { x: SEGMENT_X, y: SEGMENT_Y };
        }

        // Calculate exit time based on type
        const exitAt = id.startsWith('header-') ? 
            DUR_SEGMENT * nextHeaderMap[segmentNum] : // For headers, exit at next header
            DUR_SEGMENT * (segmentNum + 1);          // For segments, exit after duration

        return {
            id,
            type,
            initiallyVisible: segmentNum === 0,
            position,
            content: content || '',
            transition: {
                entry_from: { at: DUR_SEGMENT * segmentNum },
                exit_to: { at: exitAt }
            }
        };
    });

// Apply overrides
const finalTextConfigObjects = textConfigObjects.map(obj => {
    if (textConfigOverrides[obj.id]) {
        return { ...obj, ...textConfigOverrides[obj.id] };
    }
    return obj;
});

// Combine arrays, keeping original objects unchanged
export const globalConfig = {
    objects: [...configObjects, ...finalTextConfigObjects],
    totalScenes: NUM_SEGMENTS,
    heightPerScene: HEIGHT_MULTIPLIER,
    totalHeight: NUM_SEGMENTS * HEIGHT_MULTIPLIER
};

// Debug: log the final arrays
// console.log('Config objects:', configObjects);
// console.log('Text config objects:', textConfigObjects);
// Debug: log the final config
// console.log('Final global config:', globalConfig);

export const extraConfig = [
    {
        id: "atmosphereHotNonlinear",
        entry: { at: 0 },
        exit: { at: 1 }
    },

    // Feb 1 data showing from scene 0 to scene 2
    {
        id: "jetStream2010-02-01",
        type: "jetStream",
        entry: { at: 0 },
        exit: { at: DUR_SEGMENT * 2 },
        params: {
            year: "2010-02-01T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-01",
        type: "temperature",
        entry: { at: 0 },
        exit: { at: DUR_SEGMENT * 2 },
        params: {
            date: "2010-02-01",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-01",
        type: "annotation",
        content: "February 1, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: 0,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 2 - scene 2 (1/13th of the segment)
    {
        id: "jetStream2010-02-02",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13 },
        params: {
            year: "2010-02-02T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-02",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13 },
        params: {
            date: "2010-02-02",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-02",
        type: "annotation",
        content: "February 2, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 3 - scene 2 (2/13th of the segment)
    {
        id: "jetStream2010-02-03",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13 },
        params: {
            year: "2010-02-03T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-03",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13 },
        params: {
            date: "2010-02-03",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-03",
        type: "annotation",
        content: "February 3, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 4 - scene 2 (3/13th of the segment)
    {
        id: "jetStream2010-02-04",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13 },
        params: {
            year: "2010-02-04T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-04",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13 },
        params: {
            date: "2010-02-04",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-04",
        type: "annotation",
        content: "February 4, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 2 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 5 - scene 2 (4/13th of the segment)
    {
        id: "jetStream2010-02-05",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13 },
        params: {
            year: "2010-02-05T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-05",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13 },
        params: {
            date: "2010-02-05",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-05",
        type: "annotation",
        content: "February 5, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 3 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 6 - scene 2 (5/13th of the segment)
    {
        id: "jetStream2010-02-06",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13 },
        params: {
            year: "2010-02-06T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-06",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13 },
        params: {
            date: "2010-02-06",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-06",
        type: "annotation",
        content: "February 6, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 4 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 7 - scene 2 (6/13th of the segment)
    {
        id: "jetStream2010-02-07",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13 },
        params: {
            year: "2010-02-07T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-07",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13 },
        params: {
            date: "2010-02-07",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-07",
        type: "annotation",
        content: "February 7, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 5 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 8 - scene 2 (7/13th of the segment)
    {
        id: "jetStream2010-02-08",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13 },
        params: {
            year: "2010-02-08T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-08",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13 },
        params: {
            date: "2010-02-08",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-08",
        type: "annotation",
        content: "February 8, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 6 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 9 - scene 2 (8/13th of the segment)
    {
        id: "jetStream2010-02-09",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13 },
        params: {
            year: "2010-02-09T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-09",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13 },
        params: {
            date: "2010-02-09",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-09",
        type: "annotation",
        content: "February 9, 2010 ---",
        position: { x: 50, y: 70 },
        transition: {
            entry_from: {
                x: 50, y: 70,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 7 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 70,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 10 - scene 2 (9/13th of the segment)
    {
        id: "jetStream2010-02-10",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13 },
        params: {
            year: "2010-02-10T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-10",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13 },
        params: {
            date: "2010-02-10",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-10",
        type: "annotation",
        content: "February 10, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 8 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 11 - scene 2 (10/13th of the segment)
    {
        id: "jetStream2010-02-11",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13 },
        params: {
            year: "2010-02-11T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-11",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13 },
        params: {
            date: "2010-02-11",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-11",
        type: "annotation",
        content: "February 11, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 9 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 12 - scene 2 (11/13th of the segment)
    {
        id: "jetStream2010-02-12",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13 },
        params: {
            year: "2010-02-12T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-12",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13 },
        params: {
            date: "2010-02-12",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-12",
        type: "annotation",
        content: "February 12, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 10 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 13 - scene 2 (12/13th of the segment)
    {
        id: "jetStream2010-02-13",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 12 / 13 },
        params: {
            year: "2010-02-13T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-13",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13 },
        exit: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 12 / 13 },
        params: {
            date: "2010-02-13",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-13",
        type: "annotation",
        content: "February 13, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 12 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // February 14 in scene 2 (13/13th) and continuing to the end
    {
        id: "jetStream2010-02-14",
        type: "jetStream",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 12 / 13 },
        exit: { at: DUR_SEGMENT * 4 },
        params: {
            year: "2010-02-14T00:00:00.000000000",
            isNormalDay: true
        }
    },
    {
        id: "temp2010-02-14",
        type: "temperature",
        entry: { at: DUR_SEGMENT * 2 + DUR_SEGMENT * 12 / 13 },
        exit: { at: DUR_SEGMENT * 4 },
        params: {
            date: "2010-02-14",
            isNormalDay: true
        }
    },
    {
        id: "date2010-02-14",
        type: "annotation",
        content: "February 14, 2010",
        position: { x: 50, y: 50 },
        transition: {
            entry_from: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 11 / 13,
                duration: 0.0001,
                opacity: 0
            },
            exit_to: {
                x: 50, y: 50,
                at: DUR_SEGMENT * 2 + DUR_SEGMENT * 13 / 13,
                duration: 0.0001,
                opacity: 0
            }
        }
    },

    // Background and movements remain unchanged
    {
        id: "background-2",
        type: "background",
        file: `${import.meta.env.BASE_URL}assets/backgrounds/pbd.webp`,
        entry: { at: 0 },
        exit: { at: 1 }
    },

];



