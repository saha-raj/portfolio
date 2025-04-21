// At the top of the file, after your existing variables
let isScrollHandlerActive = false;

// Throttle function to limit scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Calculate year based on scroll position
function calculateYearFromScroll(deltaY) {
    const state = window.visualizationState;
    const config = window.visualizationConfig;
    
    if (state.isTransitioning) return state.currentYear;
    
    const direction = deltaY > 0 ? 1 : -1;
    const newYear = state.currentYear + direction;
    
    // Use years from config
    if (newYear >= config.years.start && newYear <= config.years.end) {
        return newYear;
    }
    return state.currentYear;
}

// Update scroll indicator position
function updateScrollIndicator(year) {
    const config = window.visualizationConfig;
    const totalYears = config.years.end - config.years.start;
    const progress = (year - config.years.start) / totalYears;
    
    const scrollHeight = 200; // Height of scroll track
    const indicatorHeight = 20; // Height of indicator
    const topPosition = progress * (scrollHeight - indicatorHeight);
    
    d3.select('.scroll-indicator')
        .transition()
        .duration(100)
        .attr('y', topPosition);
}

// Main scroll handler
const handleScroll = throttle((event) => {
    const state = window.visualizationState;
    
    if (state.isTransitioning) return;
    
    event.preventDefault();
    
    const newYear = calculateYearFromScroll(event.deltaY);
    if (newYear !== state.currentYear) {
        state.currentYear = newYear;
        
        // Update year display
        d3.select('.year-label')
            .text(state.currentYear);
            
        // Update scroll indicator
        updateScrollIndicator(state.currentYear);
        
        // Trigger image update
        updateVisualization(state.currentYear);
    }
}, 100);

// Modify your scroll event listener
window.addEventListener('wheel', (event) => {
    if (window.visualizationState.isTransitioning) return;
    
    if (isScrollHandlerActive) {
        event.preventDefault();
        handleScroll(event);
    }
}, { passive: false });

// Add this function to control scroll handling
function setScrollHandlerActive(active) {
    isScrollHandlerActive = active;
}

// Export the function
window.setScrollHandlerActive = setScrollHandlerActive;

// Export function for use in other modules
window.updateScrollIndicator = updateScrollIndicator;
