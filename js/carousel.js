/**
 * Carousel functionality for the portfolio website
 * 
 * Features:
 * - Arrow navigation to scroll through cards
 * - Center focus with grayed out inactive cards
 * - Responsive behavior
 * - Automatic initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const track = document.querySelector('.carousel-track');
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    const prevButton = document.querySelector('.carousel-nav.prev');
    const nextButton = document.querySelector('.carousel-nav.next');
    
    // Settings
    const itemWidth = items[0].getBoundingClientRect().width;
    const moveAmount = itemWidth;
    let currentIndex = 0;
    
    // Calculate total items visible based on viewport width
    let itemsVisible = getVisibleItems();
    window.addEventListener('resize', () => {
        itemsVisible = getVisibleItems();
        updateCarousel();
    });
    
    // Set initial positions and active states
    function initCarousel() {
        // Add necessary width to the track
        track.style.width = `${items.length * itemWidth}px`;
        
        // Set initial active class
        updateActiveItems();
        
        // Update button states
        updateButtons();
        
        // Center the active item
        updateCarousel();
    }
    
    function getVisibleItems() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth >= 992) return 3;
        if (viewportWidth >= 768) return 2;
        return 1;
    }
    
    function updateCarousel() {
        console.log(`Current Index: ${currentIndex}`);
        items.forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
        const activeItem = items[currentIndex];
        const offset = -activeItem.offsetLeft + (track.offsetWidth - activeItem.offsetWidth) / 2;
        track.style.transform = `translateX(${offset}px)`;
        updateButtons();
    }
    
    function updateActiveItems() {
        // Remove all active classes
        items.forEach(item => item.classList.remove('active'));
        
        // Calculate center index
        const centerIndex = currentIndex + Math.floor(itemsVisible / 2);
        
        // Add active class to center item(s)
        if (itemsVisible === 1) {
            // Only one item visible, so active item is the current one
            if (items[currentIndex]) items[currentIndex].classList.add('active');
        } else if (itemsVisible % 2 === 0) {
            // Even number of visible items, so two center items
            const firstCenter = centerIndex - 1;
            const secondCenter = centerIndex;
            if (items[firstCenter]) items[firstCenter].classList.add('active');
            if (items[secondCenter]) items[secondCenter].classList.add('active');
        } else {
            // Odd number of visible items, so one center item
            if (items[centerIndex]) items[centerIndex].classList.add('active');
        }
    }
    
    function updateButtons() {
        prevButton.disabled = currentIndex <= 0;
        nextButton.disabled = currentIndex >= items.length - 1;
        prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
        nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
    }
    
    function moveNext() {
        if (currentIndex < items.length - itemsVisible) {
            currentIndex++;
            updateCarousel();
        }
    }
    
    function movePrev() {
        console.log('Previous button function called');
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    }
    
    // Event listeners
    nextButton.addEventListener('click', function() {
        console.log('Next button clicked');
        if (currentIndex < items.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    prevButton.addEventListener('click', function() {
        console.log('Previous button clicked');
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') moveNext();
        if (e.key === 'ArrowLeft') movePrev();
    });
    
    // Add touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50; // Minimum distance for a swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left, move to next
            moveNext();
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right, move to previous
            movePrev();
        }
    }
    
    // Initialize the carousel
    initCarousel();
    
    // Set first item as active initially
    items[0].classList.add('active');
}); 