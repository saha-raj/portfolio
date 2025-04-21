// Configuration
const defaultConfig = {
    startYear: 1984,
    endYear: 2022,
    width: window.innerWidth,
    height: window.innerHeight,
    transitionDuration: 750
};

// State management
let state = {
    currentLocation: null,
    currentYear: null,
    isTransitioning: false,
    coastlineVisible: true
};

// Initialize main SVG
const svg = d3.select('#visualization-container')
    .append('svg')
    .attr('class', 'main-svg')
    .attr('width', defaultConfig.width)
    .attr('height', defaultConfig.height);

// Create layers for different elements
const layers = {
    images: svg.append('g').attr('class', 'image-layer'),
    coastline: svg.append('g').attr('class', 'coastline-layer'),
    overlay: svg.append('g').attr('class', 'overlay-layer')
};

// Add location label first (at the top)
layers.overlay.append('text')
    .attr('class', 'location-label')
    .attr('x', 20)
    .attr('y', 60);  // Position from top

// Add hint text next to location name
const hintText = layers.overlay.append('text')
    .attr('class', 'hint-text')
    .attr('x', 20)
    .attr('y', 90)  // 30px below the location name
    .style('fill', 'rgba(255, 255, 255, 0.8)');  // Slightly transparent white

// Update hint text based on location
function updateHintText(location) {
    const hint = location === 'location1' ? 
        "Press 2 to see how the Mangrove forest prevents erosion" :
        "Press 1 to see erosion without the Mangrove forest";
    hintText.text(hint);
}

// Get the visualization container dimensions
const vizContainer = d3.select('#visualization-container');
const containerWidth = vizContainer.node().getBoundingClientRect().width;
const containerHeight = containerWidth * (9/16);  // 16:9 aspect ratio

// Add year label
const yearLabel = layers.overlay.append('text')
    .attr('class', 'year-label')
    .attr('x', 20)
    .attr('y', containerHeight - 40)  // Fixed distance from bottom
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle')
    .text('1984');

// Debug log
console.log('Year label created:', {
    element: yearLabel.node(),
    text: yearLabel.text(),
    x: yearLabel.attr('x'),
    y: yearLabel.attr('y'),
    containerWidth: containerWidth
});

// Add resize handler for the year label
window.addEventListener('resize', () => {
    const newWidth = vizContainer.node().getBoundingClientRect().width;
    const newHeight = newWidth * (9/16);
    yearLabel.attr('y', newHeight - 40);  // Maintain fixed distance from bottom
});

// Add coastline toggle button below both texts
const toggleButton = layers.overlay.append('g')
    .attr('class', 'coastline-toggle')
    .attr('transform', 'translate(20, 140)')  // Moved down to accommodate hint text
    .style('cursor', 'pointer');

// Button background
toggleButton.append('rect')
    .attr('width', 150)
    .attr('height', 30)
    .attr('rx', 5)
    .attr('class', 'toggle-background');

// Button text - set initial state to "Hide" since coastline is visible
toggleButton.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .attr('text-anchor', 'start')
    .attr('class', 'toggle-text')
    .text('1984 Coastline: Hide');

// When creating the button
console.log('Initial setup:');
console.log('SVG width:', defaultConfig.width);
console.log('Button position:', defaultConfig.width - 60);
console.log('SVG viewBox:', svg.attr('viewBox'));

// Add expand/collapse button AFTER all other overlay elements
const expandCollapseButton = layers.overlay.append('g')
    .attr('class', 'expand-collapse-toggle')
    .attr('transform', `translate(${containerWidth - 60}, 30)`)
    .style('cursor', 'pointer')
    .style('pointer-events', 'all');

// Button background
expandCollapseButton.append('rect')
    .attr('width', 40)
    .attr('height', 40)
    .attr('rx', 5)
    .attr('class', 'toggle-background');

// Add SVG icon container
expandCollapseButton.append('image')
    .attr('class', 'toggle-icon')
    .attr('width', 24)
    .attr('height', 24)
    .attr('x', 8)
    .attr('y', 8)
    .attr('href', 'assets/general/expand.svg');

// Add click handler
expandCollapseButton.on('click', () => {
    window.toggleExpand();
    // Update icon and position based on state
    if (sequenceState.isExpanded) {
        expandCollapseButton
            .attr('transform', `translate(${window.innerWidth - 60}, 30)`)
            .select('.toggle-icon')
            .attr('href', 'assets/general/collapse.svg');
    } else {
        expandCollapseButton
            .attr('transform', `translate(${containerWidth - 60}, 30)`)
            .select('.toggle-icon')
            .attr('href', 'assets/general/expand.svg');
    }
});

console.log('Container width:', containerWidth);
console.log('Button created:', expandCollapseButton.node());
console.log('Button element:', expandCollapseButton.node());
console.log('Button parent:', expandCollapseButton.node().parentNode);

// Create scroll progress indicator
const scrollProgress = layers.overlay.append('g')
    .attr('transform', `translate(${defaultConfig.width - 30}, ${defaultConfig.height/2 - 100})`);

scrollProgress.append('rect')
    .attr('class', 'scroll-progress')
    .attr('width', 4)
    .attr('height', 200)
    .attr('rx', 2);

scrollProgress.append('rect')
    .attr('class', 'scroll-indicator')
    .attr('width', 4)
    .attr('height', 20)
    .attr('rx', 2);

// Window resize handler
window.addEventListener('resize', () => {
    defaultConfig.width = window.innerWidth;
    defaultConfig.height = window.innerHeight;
    
    svg.attr('width', defaultConfig.width)
       .attr('height', defaultConfig.height);
       
    // Update year label position on resize
    layers.overlay.select('.year-label')
        .attr('x', 20)
        .attr('y', defaultConfig.height - 40);
        
    scrollProgress.attr('transform', 
        `translate(${defaultConfig.width - 30}, ${defaultConfig.height/2 - 100})`);
        
    expandCollapseButton.attr('transform', 
        `translate(${containerWidth - 60}, 30)`);
});

// Export for use in other modules
window.visualizationState = state;
window.visualizationLayers = layers;
window.visualizationConfig = defaultConfig;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', init);

// Add to main.js
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const configData = await response.json();
        
        // Merge with default config
        window.visualizationConfig = {
            ...defaultConfig,
            locations: configData.locations,
            years: configData.years
        };
        
        // Set initial state
        state.currentLocation = Object.keys(configData.locations)[0];
        state.currentYear = configData.years.start;
        
        return true;
    } catch (error) {
        console.error('Error loading configuration:', error);
        return false;
    }
}

// Initialize visualization
async function init() {
    const configLoaded = await loadConfig();
    if (!configLoaded) return;
    
    // Initialize visualization
    updateLocation(state.currentLocation);
    updateYear(state.currentYear);
    
    // Update location label with display name from config
    const locationName = window.visualizationConfig.locations[state.currentLocation].name;
    layers.overlay.select('.location-label')
        .text(locationName);
}

// Test function
async function testSetup() {
    console.log('Config loaded:', window.visualizationConfig);
    console.log('Current state:', window.visualizationState);
    
    // Test image loading with correct format
    try {
        const format = window.visualizationConfig.imageFormat || 'webp';
        const testImage = await loadImage(`assets/location1/frames/1984.${format}`);
        console.log('Image loading works:', testImage !== null);
    } catch (error) {
        console.error('Image loading failed:', error);
    }
    
    // Test coastline loading
    try {
        const coastline = await loadCoastline('location1');
        console.log('Coastline loading works:', coastline !== null);
    } catch (error) {
        console.error('Coastline loading failed:', error);
    }
}

// Call after init
document.addEventListener('DOMContentLoaded', async () => {
    await init();
    await testSetup();
});

// Add this function near the top with other state management
function updateYear(year) {
    const state = window.visualizationState;
    state.currentYear = year;
    
    // Update year display
    layers.overlay.select('.year-label')
        .text(year);
        
    // Update scroll indicator
    updateScrollIndicator(year);
}

// Add this near the bottom of main.js
document.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        switchLocation('location1');
    } else if (event.key === '2') {
        switchLocation('location2');
    }
});

// Add click handler
toggleButton.on('click', () => {
    state.coastlineVisible = !state.coastlineVisible;
    
    toggleButton.select('.toggle-text')
        .text(`1984 Coastline: ${state.coastlineVisible ? 'Hide' : 'Show'}`);
    
    // Update button appearance
    toggleButton.select('.toggle-background')
        .classed('toggle-active', state.coastlineVisible);
    
    // Show/hide coastline
    layers.coastline
        .transition()
        .duration(300)
        .style('opacity', state.coastlineVisible ? 1 : 0);
});

// Add expand hint text (add this after all your existing overlay elements are created)
const expandHint = layers.overlay.append('text')
    .attr('class', 'expand-hint')
    .attr('x', 20)
    .attr('y', 115)  // Position below the existing hint
    .style('fill', 'rgba(255, 255, 255, 0.8)')
    .text('Expand to scroll through time lapse imagery');

// Add play/pause button below coastline toggle
const playPauseButton = layers.overlay.append('g')
    .attr('class', 'play-pause-toggle')
    .attr('transform', 'translate(20, 180)')  // 40px below coastline toggle (which is at 140)
    .style('cursor', 'pointer')
    .style('pointer-events', 'all');

// Button background
playPauseButton.append('rect')
    .attr('width', 40)
    .attr('height', 40)
    .attr('rx', 5)
    .attr('class', 'toggle-background');

// Add SVG icon container
playPauseButton.append('image')
    .attr('class', 'toggle-icon')
    .attr('width', 24)
    .attr('height', 24)
    .attr('x', 8)
    .attr('y', 8)
    .attr('href', 'assets/general/play.svg');

// Add click handler
let isPlaying = false;
let playInterval;

playPauseButton.on('click', () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseButton.select('.toggle-icon')
            .attr('href', 'assets/general/pause.svg');
            
        // Start auto-advancing through years
        playInterval = setInterval(() => {
            const state = window.visualizationState;
            const config = window.visualizationConfig;
            
            let newYear = state.currentYear + 1;
            if (newYear > config.endYear) {
                newYear = config.startYear;
            }
            
            state.currentYear = newYear;
            updateVisualization(newYear);
            updateScrollIndicator(newYear);
        }, 200);  // Advance every 200ms (adjust this value to control speed)
    } else {
        playPauseButton.select('.toggle-icon')
            .attr('href', 'assets/general/play.svg');
        clearInterval(playInterval);
    }
});
