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
    let currentIndex = 0;
    
    // Set initial positions and active states
    function initCarousel() {
        // Set initial active item
        items.forEach(item => item.classList.remove('active'));
        items[0].classList.add('active');
        
        // Update button states
        updateButtons();
        
        // Initialize video playback
        updateVideos();
        
        // Center the first item
        centerItem(0);
    }
    
    function centerItem(index) {
        const item = items[index];
        const carouselSection = document.querySelector('.carousel-section');
        const carouselWidth = carouselSection.offsetWidth;
        const itemRect = item.getBoundingClientRect();
        const itemWidth = itemRect.width;
        
        // Calculate the offset needed to center this item
        const itemOffsetLeft = item.offsetLeft;
        const centerOffset = (carouselWidth - itemWidth) / 2;
        const translateX = centerOffset - itemOffsetLeft;
        
        // Apply the transform
        track.style.transform = `translateX(${translateX}px)`;
        console.log(`Centering item ${index}: translateX(${translateX}px)`);
    }
    
    function updateCarousel() {
        // Update active classes
        items.forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
        
        // Center the current item
        centerItem(currentIndex);
        
        // Manage video playback
        updateVideos();
        
        // Update button states
        updateButtons();
    }
    
    function updateVideos() {
        // Play videos in active item, pause videos in inactive items
        items.forEach((item, index) => {
            const video = item.querySelector('video');
            if (video) {
                if (index === currentIndex) {
                    // Play video in active item
                    video.play().catch(e => console.log("Video play error:", e));
                } else {
                    // Pause video in inactive items
                    video.pause();
                }
            }
        });
    }
    
    function updateButtons() {
        prevButton.disabled = currentIndex <= 0;
        nextButton.disabled = currentIndex >= items.length - 1;
        prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
        nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
    }
    
    // Event listeners
    nextButton.addEventListener('click', function() {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    prevButton.addEventListener('click', function() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
            currentIndex++;
            updateCarousel();
        }
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
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
        
        if (touchEndX < touchStartX - swipeThreshold && currentIndex < items.length - 1) {
            // Swipe left, move to next
            currentIndex++;
            updateCarousel();
        }
        
        if (touchEndX > touchStartX + swipeThreshold && currentIndex > 0) {
            // Swipe right, move to previous
            currentIndex--;
            updateCarousel();
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        centerItem(currentIndex);
    });
    
    // Initialize the carousel
    initCarousel();
}); 