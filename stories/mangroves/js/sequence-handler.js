// Make toggleExpand available globally
window.toggleExpand = function() {
    if (sequenceState.isExpanded) {
        collapseSequence();
    } else {
        expandSequence();
    }
};

const sequenceState = {
    isExpanded: false,
    sequenceBlock: document.querySelector('.sequence-block')
};

function expandSequence() {
    sequenceState.isExpanded = true;
    sequenceState.sequenceBlock.classList.add('is-fullscreen');
    document.body.style.overflow = 'hidden';
    window.setScrollHandlerActive(true);
    
    // Update year label position for expanded state
    const yearLabel = d3.select('.year-label');
    yearLabel.attr('y', window.innerHeight - 80);  // 80px from bottom in expanded state
}

function collapseSequence() {
    sequenceState.isExpanded = false;
    sequenceState.sequenceBlock.classList.remove('is-fullscreen');
    document.body.style.overflow = '';
    window.setScrollHandlerActive(false);
    
    // Reset year label position for collapsed state
    const yearLabel = d3.select('.year-label');
    const containerWidth = d3.select('#visualization-container').node().getBoundingClientRect().width;
    const containerHeight = containerWidth * (9/16);
    yearLabel.attr('y', containerHeight - 40);  // 40px from bottom in collapsed state
}

// Remove all scroll-based expansion triggers and arrow navigation

// Separate escape key handler
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sequenceState.isExpanded) {
        collapseSequence();
        
        // Double-check button visibility after collapse
        const expandButton = d3.select('.expand-collapse-toggle');
        if (expandButton.node()) {
            expandButton
                .style('opacity', '0.8')
                .style('display', null)
                .style('visibility', 'visible');
        }
    }
});