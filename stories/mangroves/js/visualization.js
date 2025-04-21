// Image preloading and caching
const imageCache = {
    location1: new Map(),
    location2: new Map()
};

// Load and cache images for a location
async function preloadImages(location) {
    const config = window.visualizationConfig;
    const format = config.imageFormat || 'webp';
    
    // Preload images in chunks
    const chunkSize = 5;
    for (let year = config.years.start; year <= config.years.end; year += chunkSize) {
        const promises = [];
        
        for (let i = 0; i < chunkSize && (year + i) <= config.years.end; i++) {
            const currentYear = year + i;
            if (!imageCache[location].has(currentYear)) {
                promises.push(loadImage(`assets/${location}/frames/${currentYear}.${format}`));
            }
        }
        
        // Wait for chunk to load
        const images = await Promise.all(promises);
        images.forEach((img, index) => {
            imageCache[location].set(year + index, img);
        });
    }
}

// Load coastline SVG
async function loadCoastline(location) {
    try {
        const response = await fetch(`assets/${location}/coastline.svg`);
        const svgData = await response.text();
        
        // Create a temporary div to parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Get original viewBox if it exists, or set a default
        const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
        
        // Create new SVG content with matching scaling behavior
        return `<svg 
            viewBox="${viewBox}"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            class="coastline-svg">
            ${svgElement.innerHTML}
        </svg>`;
        
    } catch (error) {
        console.error(`Failed to load coastline for ${location}:`, error);
        return null;
    }
}

// Update visualization with new image
function updateVisualization(year) {
    const startTime = performance.now();
    
    const state = window.visualizationState;
    const layers = window.visualizationLayers;
    
    console.log('Updating visualization:', {
        location: state.currentLocation,
        year: year,
        imageExists: imageCache[state.currentLocation].has(year),
        cachedYears: Array.from(imageCache[state.currentLocation].keys())
    });
    
    // Update image
    const currentImage = imageCache[state.currentLocation].get(year);
    if (currentImage) {
        // Ensure image is fully decoded before showing
        currentImage.decode()
            .then(() => {
                // Remove existing image if any
                layers.images.selectAll('image').remove();
                
                // Add new image
                layers.images.append('image')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('preserveAspectRatio', 'xMidYMid slice')
                    .attr('href', currentImage.src);
            })
            .catch(err => console.error('Error decoding image:', err));
    }

    // Update year display
    layers.overlay.select('.year-label')
        .text(year);
        
    const endTime = performance.now();
    console.log(`Frame update took ${(endTime - startTime).toFixed(2)}ms`);
}

// Initialize location
async function updateLocation(location) {
    console.log('Updating location:', {
        newLocation: location,
        imagesLoaded: Array.from(imageCache[location].keys())
    });
    
    const state = window.visualizationState;
    const layers = window.visualizationLayers;
    const config = window.visualizationConfig;
    
    // Load coastline
    const coastlineData = await loadCoastline(location);
    if (coastlineData) {
        layers.coastline.html(coastlineData);
    }

    // Update location label with display name from config
    const locationName = config.locations[location].name;
    layers.overlay.select('.location-label')
        .text(locationName);

    // Update hint text
    updateHintText(location);

    await preloadImages(location);
    updateVisualization(state.currentYear);
}

// Helper function to load single image
async function loadImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = path;
    });
}

// Export functions for use in other modules
window.updateVisualization = updateVisualization;
window.updateLocation = updateLocation;
window.preloadImages = preloadImages;
