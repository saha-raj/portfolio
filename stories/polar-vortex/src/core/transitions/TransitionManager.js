import { lerpPosition, calculateProgress } from '../../utils/interpolation.js';
import { defaults, typeDefaults } from '../../config/globalConfig.js';

export class TransitionManager {
    /**
     * Calculate object's current position based on lifecycle state
     * @param {Object} config - Object configuration
     * @param {number} scrollProgress - Current scroll progress (0-1)
     * @returns {{position: {x: number, y: number}, opacity: number, visible: boolean}}
     */
    static calculateTransition(config, scrollProgress) {
        // Get type defaults first
        const typeDefault = typeDefaults[config.type];
        
        // Merge position with type defaults and ensure a default position exists
        const defaultPosition = typeDefault?.position || { x: 0, y: 0 };
        const position = config.position || defaultPosition;  // Ensure we always have a position
        const { transition = {} } = config;
        const { entry_from, exit_to } = transition;
        
        // Merge entry_from with type defaults
        const effectiveEntryFrom = entry_from ? {
            x: position.x,
            y: position.y,
            ...(typeDefault?.transition?.entry_from || {}),
            ...entry_from
        } : typeDefault?.transition?.entry_from ? {
            x: position.x,
            y: position.y,
            ...typeDefault.transition.entry_from
        } : null;

        // // Add debug logging for intro elements AFTER effectiveEntryFrom is defined
        // if (config.type === 'intro-header' || config.type === 'intro-description') {
        //     console.log('TransitionManager calculating for:', {
        //         id: config.id,
        //         type: config.type,
        //         initiallyVisible: config.initiallyVisible,
        //         scrollProgress,
        //         position: config.position,
        //         effectiveEntryFrom,
        //         returnValue: {
        //             position: effectiveEntryFrom ? { 
        //                 x: effectiveEntryFrom.x ?? position.x,
        //                 y: effectiveEntryFrom.y ?? position.y
        //             } : position,
        //             opacity: config.initiallyVisible ? 1 : (effectiveEntryFrom?.opacity ?? 0),
        //             visible: config.initiallyVisible || false
        //         }
        //     });
        // }

        // Merge exit_to with type defaults
        const effectiveExitTo = exit_to ? {
            x: position.x,
            y: position.y,
            ...(typeDefault?.transition?.exit_to || {}),
            ...exit_to
        } : typeDefault?.transition?.exit_to ? {
            x: position.x,
            y: position.y,
            ...typeDefault.transition.exit_to
        } : null;

        // // Debug logging
        // if (config.id === 'earth') {
        //     console.log('TransitionManager Calculation:', {
        //         scrollProgress,
        //         initialPosition: position,
        //         entryFrom: effectiveEntryFrom,
        //         currentState: {
        //             isBeforeEntry: effectiveEntryFrom && scrollProgress < effectiveEntryFrom.at,
        //             isDuringEntry: effectiveEntryFrom && scrollProgress >= effectiveEntryFrom.at && 
        //                 scrollProgress <= (effectiveEntryFrom.at + (effectiveEntryFrom.duration || defaults.transition.entry.duration)),
        //         }
        //     });
        // }

        // // Debug only for annotation
        // if (config.id === 'annotation1') {
        //     console.log('Annotation State:', {
        //         scrollProgress,
        //         beforeEntry: entry_from && scrollProgress < entry_from.at,
        //         duringEntry: entry_from && scrollProgress >= entry_from.at && 
        //             scrollProgress <= (entry_from.at + (entry_from.duration || defaults.transition.entry.duration)),
        //         duringExit: exit_to && scrollProgress >= exit_to.at && 
        //             scrollProgress <= (exit_to.at + (exit_to.duration || defaults.transition.exit.duration)),
        //         afterExit: exit_to && scrollProgress > (exit_to.at + (exit_to.duration || defaults.transition.exit.duration))
        //     });
        // }

        // Always start at configured position
        // if (scrollProgress === 0) {
        //     return {
        //         position: { ...position },
        //         opacity: transition.entry_from?.opacity ?? 1,
        //         visible: true
        //     };
        // }

        // Before entry - but respect initiallyVisible
        const EPSILON = 0.0001;
        if (!effectiveEntryFrom || (scrollProgress + EPSILON) < effectiveEntryFrom.at) {
            return {
                position: position,  // Use the guaranteed position
                opacity: config.initiallyVisible ? 1 : (effectiveEntryFrom?.opacity ?? 0),
                visible: config.initiallyVisible || false
            };
        }

        // During entry transition
        if (effectiveEntryFrom && scrollProgress >= effectiveEntryFrom.at && 
            scrollProgress <= (effectiveEntryFrom.at + (effectiveEntryFrom.duration || defaults.transition.entry.duration))) {
            
            const entryProgress = calculateProgress(
                scrollProgress,
                effectiveEntryFrom.at,
                effectiveEntryFrom.at + (effectiveEntryFrom.duration || defaults.transition.entry.duration)
            );

            return {
                position: lerpPosition(effectiveEntryFrom, position, entryProgress),
                opacity: effectiveEntryFrom.opacity !== undefined ? 
                    lerpPosition({ x: effectiveEntryFrom.opacity }, { x: 1 }, entryProgress).x :
                    lerpPosition({ x: defaults.transition.opacity.initial }, { x: defaults.transition.opacity.entry }, entryProgress).x,
                visible: true
            };
        }

        // During exit transition
        if (effectiveExitTo && scrollProgress >= effectiveExitTo.at && 
            scrollProgress <= (effectiveExitTo.at + (effectiveExitTo.duration || defaults.transition.exit.duration))) {
            
            const exitProgress = calculateProgress(
                scrollProgress,
                effectiveExitTo.at,
                effectiveExitTo.at + (effectiveExitTo.duration || defaults.transition.exit.duration)
            );

            return {
                position: lerpPosition(position, effectiveExitTo, exitProgress),
                opacity: effectiveExitTo.opacity !== undefined ?
                    lerpPosition({ x: 1 }, { x: effectiveExitTo.opacity }, exitProgress).x :
                    lerpPosition({ x: 1 }, { x: defaults.transition.opacity.exit }, exitProgress).x,
                visible: true
            };
        }

        // After exit - object should be invisible
        if (exit_to && scrollProgress > (exit_to.at + (exit_to.duration || defaults.transition.exit.duration))) {
            return {
                position: { ...exit_to },
                opacity: 0,
                visible: false
            };
        }

        // Default sitting position
        return {
            position: { ...position },
            opacity: 1,
            visible: true
        };
    }
}
