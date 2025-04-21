/**
 * Basic linear interpolation between two values based on progress
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} progress - Current progress (0-1)
 * @returns {number} Interpolated value
 */
export const lerp = (start, end, progress) => {
    return start + (end - start) * clamp(progress, 0, 1);
};

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Calculates normalized progress within a range
 * @param {number} current - Current value
 * @param {number} start - Start of range
 * @param {number} end - End of range
 * @returns {number} Normalized progress (0-1)
 */
export const calculateProgress = (current, start, end) => {
    if (start === end) return 1;
    return clamp((current - start) / (end - start), 0, 1);
};

/**
 * Interpolates between two 2D positions
 * @param {{x: number, y: number}} start - Starting position
 * @param {{x: number, y: number}} end - Ending position
 * @param {number} progress - Current progress (0-1)
 * @returns {{x: number, y: number}} Interpolated position
 */
export const lerpPosition = (start, end, progress) => {
    return {
        x: lerp(start.x, end.x, progress),
        y: lerp(start.y, end.y, progress)
    };
};

// Placeholder for future easing functions
export const Easing = {
    LINEAR: (t) => t,
    // Add more easing functions here as needed
};
