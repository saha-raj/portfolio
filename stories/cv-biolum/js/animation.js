document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const config = {
        baseImageDir: 'assets/images/rgb_frames/',
        overlayImageDir: 'assets/images/overlay_frames/',
        imageFormat: 'webp',
        framePadding: 6,
        totalFramesToLoad: 100,  // We'll only load 100 frames
        minFrame: 1,
        animationSpeed: 50,
    };

    // --- Get DOM Elements ---
    const imageContainer = document.getElementById('image-container');
    const baseImage = document.getElementById('base-image');
    const overlayImage = document.getElementById('overlay-image');
    const trackToggle = document.getElementById('track-toggle');
    const loadingStatus = document.getElementById('loading-status');

    // Show initial loading state
    if (loadingStatus) {
        loadingStatus.style.display = 'block';
        loadingStatus.textContent = 'Loading frames...';
    }
    if (imageContainer) {
        imageContainer.style.display = 'none'; // Hide container until first frame is ready
    }

    // --- State Variables ---
    let isPlaying = false;
    let animationFrameId = null;
    let currentFrame = config.minFrame;
    let isOverlayVisible = true;
    let lastFrameTime = 0;

    // --- Preloaded Image Cache ---
    const preloadedBaseImages = [];
    const preloadedOverlayImages = [];

    function formatFrameNumber(frame) {
        return frame.toString().padStart(config.framePadding, '0');
    }

    function updateDisplay(frame) {
        // Convert the current frame number to an index in our preloaded arrays
        const frameIndex = (frame - config.minFrame) % config.totalFramesToLoad;
        
        if (preloadedBaseImages[frameIndex] && preloadedBaseImages[frameIndex].complete) {
            baseImage.src = preloadedBaseImages[frameIndex].src;
        } else {
            console.warn(`Base image for frame index ${frameIndex} not ready`);
        }

        if (isOverlayVisible) {
            if (preloadedOverlayImages[frameIndex] && preloadedOverlayImages[frameIndex].complete) {
                overlayImage.src = preloadedOverlayImages[frameIndex].src;
                overlayImage.classList.remove('hidden');
            } else {
                console.warn(`Overlay image for frame index ${frameIndex} not ready`);
                overlayImage.classList.add('hidden');
            }
        } else {
            overlayImage.classList.add('hidden');
        }
    }

    function animationLoop(timestamp) {
        if (!isPlaying) return;

        const elapsed = timestamp - lastFrameTime;

        if (elapsed >= config.animationSpeed) {
            lastFrameTime = timestamp - (elapsed % config.animationSpeed);

            currentFrame++;
            // Loop back to start after reaching totalFramesToLoad
            if (currentFrame > (config.minFrame + config.totalFramesToLoad - 1)) {
                currentFrame = config.minFrame;
            }
            updateDisplay(currentFrame);
        }

        animationFrameId = requestAnimationFrame(animationLoop);
    }

    function playAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(animationLoop);
        console.log("Animation started");
    }

    function pauseAnimation() {
        if (!isPlaying) return;
        isPlaying = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        console.log("Animation paused");
    }

    trackToggle.addEventListener('click', () => {
        isOverlayVisible = !isOverlayVisible;
        if (isOverlayVisible) {
            trackToggle.textContent = 'Hide Tracks';
            updateDisplay(currentFrame);
        } else {
            overlayImage.classList.add('hidden');
            trackToggle.textContent = 'Show Tracks';
        }
    });

    function preloadImages() {
        let loadedCount = 0;
        const totalImages = config.totalFramesToLoad * 2; // Base + Overlay

        console.log(`Starting preload of ${totalImages} images...`);
        if (loadingStatus) {
            loadingStatus.textContent = `Loading: 0 / ${totalImages}`;
        }

        // Only load the first config.totalFramesToLoad frames
        for (let i = 0; i < config.totalFramesToLoad; i++) {
            const frameNumber = config.minFrame + i;
            const frameStr = formatFrameNumber(frameNumber);

            // Preload Base Image
            preloadedBaseImages[i] = new Image();
            preloadedBaseImages[i].onload = imageLoaded;
            preloadedBaseImages[i].onerror = imageError;
            preloadedBaseImages[i].src = `${config.baseImageDir}${frameStr}.${config.imageFormat}`;

            // Preload Overlay Image
            preloadedOverlayImages[i] = new Image();
            preloadedOverlayImages[i].onload = imageLoaded;
            preloadedOverlayImages[i].onerror = imageError;
            preloadedOverlayImages[i].src = `${config.overlayImageDir}${frameStr}.${config.imageFormat}`;
        }

        function imageLoaded() {
            loadedCount++;
            if (loadingStatus && (loadedCount % 10 === 0 || loadedCount === totalImages)) {
                loadingStatus.textContent = `Loading: ${loadedCount} / ${totalImages}`;
            }
            
            // Show first frame as soon as both its base and overlay are loaded
            if (loadedCount === 2) { // First base and overlay
                if (imageContainer) {
                    imageContainer.style.display = 'block';
                }
                updateDisplay(currentFrame);
            }
            
            if (loadedCount === totalImages) {
                allImagesLoaded();
            }
        }

        function imageError() {
            loadedCount++;
            console.error(`Failed to load image: ${this.src}`);
            if (loadedCount === totalImages) {
                allImagesLoaded();
            }
        }

        function allImagesLoaded() {
            console.log("All frames preloaded!");
            if (loadingStatus) {
                loadingStatus.style.display = 'none';
            }
            playAnimation();
        }
    }

    // --- Initial Setup ---
    console.log("Animation viewer setup initiated");
    if (isOverlayVisible) {
        overlayImage.classList.remove('hidden');
        trackToggle.textContent = 'Hide Tracks';
    } else {
        overlayImage.classList.add('hidden');
        trackToggle.textContent = 'Show Tracks';
    }
    
    // Start preloading
    preloadImages();
}); 