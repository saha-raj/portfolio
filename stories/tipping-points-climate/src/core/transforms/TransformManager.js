import { lerp, lerpPosition, calculateProgress } from '../../utils/interpolation.js';
import { defaults } from '../../config/globalConfig.js';

export class TransformManager {
    /**
     * @param {Object} transform - Transform configuration
     * @param {string} transform.type - Type of transformation
     * @param {number} transform.at - Start progress
     * @param {number} transform.duration - Duration of transform
     */
    static calculateTransform(transform, currentProgress, previousValue = null) {
        const duration = transform.duration || defaults.transform.duration;
        const endProgress = transform.at + duration;
        
        let progress;
        if (currentProgress < transform.at) {
            progress = 0;
        } else if (currentProgress > endProgress) {
            progress = 1;
        } else {
            progress = calculateProgress(currentProgress, transform.at, endProgress);
        }

        switch (transform.type) {
            case 'scale':
                const startScale = previousValue ?? 1;
                return {
                    type: 'scale',
                    value: lerp(startScale, transform.scale_to, progress)
                };
            
            case 'translation':
                const startTranslation = previousValue ?? { x: 0, y: 0 };
                return {
                    type: 'translation',
                    value: {
                        x: lerp(startTranslation.x, transform.delta_x || 0, progress),
                        y: lerp(startTranslation.y, transform.delta_y || 0, progress)
                    }
                };
            
            case 'rotation':
                const startRotation = previousValue ?? 0;
                return {
                    type: 'rotation',
                    value: lerp(startRotation, transform.rotate_to || 0, progress)
                };
            
            case 'camera_look':
                const startLook = previousValue ?? { x: 0, y: 0, z: 0 };
                const worldX = (transform.look_x - 50) / 25;
                const worldY = -(transform.look_y - 50) / 25;
                return {
                    type: 'camera_look',
                    value: {
                        x: lerp(startLook.x, worldX, progress),
                        y: lerp(startLook.y, worldY, progress),
                        z: lerp(startLook.z, transform.look_z || 0, progress)
                    }
                };
            
            default:
                return null;
        }
    }

    /**
     * @param {Array} transformations - Array of transformation configs
     * @param {number} scrollProgress - Current scroll progress (0-1)
     */
    static getActiveTransforms(transformations, scrollProgress) {
        if (!transformations?.length) return {};

        const finalTransforms = {};
        const sortedTransforms = [...transformations].sort((a, b) => a.at - b.at);
        
        // Keep track of previous values for each transform type
        const previousValues = {};
        
        sortedTransforms.forEach(transform => {
            if (scrollProgress >= transform.at) {
                const calculated = this.calculateTransform(
                    transform, 
                    scrollProgress,
                    previousValues[transform.type]
                );
                
                if (calculated) {
                    finalTransforms[calculated.type] = calculated.value;
                    previousValues[calculated.type] = calculated.value;
                }
            }
        });

        return finalTransforms;
    }
}
