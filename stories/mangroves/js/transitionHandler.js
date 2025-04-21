// Transition state management
const transitionState = {
    frames: [],
    currentFrameIndex: 0,
    animationFrame: null
};

// Add at the top with other constants
const TRANSITION_FRAME_DURATION = 300; // milliseconds per frame

// Load transition frames for a given direction
async function loadTransitionFrames(fromLocation, toLocation) {
    transitionState.frames = [];
    
    // Load 45 frames with .webp extension
    for (let i = 1; i <= 45; i++) {
        const frameNumber = i.toString().padStart(4, '0');  // converts 1 to "0001"
        const framePath = `assets/${fromLocation}/transitions/frame_${frameNumber}.webp`;  // Changed from .png to .webp
        
        try {
            const frame = await loadImage(framePath);
            transitionState.frames.push(frame);
        } catch (error) {
            console.error(`Error loading transition frame ${framePath}:`, error);
        }
    }
}

// Helper function to load an image
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Perform transition animation
function performTransition(fromLocation, toLocation) {
    return new Promise(async (resolve) => {
        const state = window.visualizationState;
        const layers = window.visualizationLayers;
        const config = window.visualizationConfig;
        
        state.isTransitioning = true;

        // Hide coastline during transition only if it's currently visible
        if (state.coastlineVisible) {
            layers.coastline.style('opacity', 0);
        }

        // Load transition frames
        await loadTransitionFrames(fromLocation, toLocation);
        
        const FRAME_DURATION = 30; // Adjust this value (in milliseconds) to control transition speed
        const frames = transitionState.frames;
        let frameIndex = 0;
        
        // Simple frame-by-frame animation
        function animate() {
            if (frameIndex >= frames.length) {
                state.isTransitioning = false;
                state.currentLocation = toLocation;
                
                // Show coastline after transition only if toggle is on
                if (state.coastlineVisible) {
                    layers.coastline.transition()
                        .duration(300)
                        .style('opacity', 1);
                }
                
                // 2. Reset to first year and update visualization
                state.currentYear = config.years.start;
                updateVisualization(state.currentYear);
                
                // 3. Update year display and scroll indicator
                layers.overlay.select('.year-label')
                    .text(state.currentYear);
                updateScrollIndicator(state.currentYear);
                
                if (isPlaying) {
                    clearInterval(playInterval);
                    isPlaying = false;
                    d3.select('.play-pause-toggle').select('.toggle-icon')
                        .attr('href', 'assets/general/play.svg');
                }
                
                resolve();
                return;
            }

            // Update current frame
            layers.images.select('image')
                .attr('href', frames[frameIndex].src);

            frameIndex++;
            setTimeout(() => {
                requestAnimationFrame(animate);
            }, FRAME_DURATION);
        }

        // Start animation
        animate();
    });
}

// Cancel ongoing transition
function cancelTransition() {
    if (transitionState.animationFrame) {
        cancelAnimationFrame(transitionState.animationFrame);
        transitionState.animationFrame = null;
    }
    window.visualizationState.isTransitioning = false;
}

// Switch location with transition
async function switchLocation(targetLocation) {
    const state = window.visualizationState;
    
    if (state.isTransitioning || state.currentLocation === targetLocation) return;
    
    console.log('Switching to location:', targetLocation);
    
    try {
        await performTransition(state.currentLocation, targetLocation);
        
        // Update location and reload coastline
        state.currentLocation = targetLocation;
        await updateLocation(targetLocation);  // This should load the correct coastline
        
        // Update visualization
        updateVisualization(state.currentYear);
            
    } catch (error) {
        console.error('Transition failed:', error);
        cancelTransition();
    }
}

// Export functions for use in other modules
window.switchLocation = switchLocation;
window.cancelTransition = cancelTransition;
