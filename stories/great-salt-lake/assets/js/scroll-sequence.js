class ScrollSequence {
    constructor() {
        this.sequenceBlocks = document.querySelectorAll('.sequence-block');
        this.currentFrame = 1;
        this.isActive = false;
        this.TOTAL_FRAMES = 38;
        this.lastWheelTime = Date.now();
        this.WHEEL_THROTTLE = 150;
        this.touchStartY = 0;
        this.touchThreshold = 5; // minimum pixels to trigger frame change

        // Update all event listeners with passive: false
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Optional: Add wheel event directly to sequence block for better control
        this.sequenceBlocks.forEach(block => {
            block.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        });
    }

    handleTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
    }

    handleTouchMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault(); // Prevent default scroll
        
        const now = Date.now();
        if (now - this.lastWheelTime < this.WHEEL_THROTTLE) return;
        
        const touchY = event.touches[0].clientY;
        const deltaY = this.touchStartY - touchY;

        if (Math.abs(deltaY) > this.touchThreshold) {
            this.lastWheelTime = now;
            if (deltaY > 0) {
                this.nextFrame();
            } else {
                this.previousFrame();
            }
            this.touchStartY = touchY;
        }
    }

    setupIntersectionObserver() {
        const options = {
            threshold: [0, 1]
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log('Intersection:', {
                    isIntersecting: entry.isIntersecting,
                    blockTop: entry.target.getBoundingClientRect().top,
                    hasReachedEnd: this.hasReachedEnd,
                    currentFrame: this.currentFrame
                });
            });
        }, options);

        this.sequenceBlocks.forEach(block => observer.observe(block));
    }

    activateSequence(block) {
        if (this.isActive || this.hasReachedEnd) return;
        
        // Store next element's position before any changes
        const nextElement = block.nextElementSibling;
        const nextTop = nextElement?.getBoundingClientRect().top;
        
        this.isActive = true;
        this.activeBlock = block;
        this.currentFrame = 1;
        this.activationScrollY = window.scrollY;
        
        this.placeholder = document.createElement('div');
        this.placeholder.style.height = `${block.offsetHeight}px`;
        block.parentNode.insertBefore(this.placeholder, block);
        
        block.classList.add('is-active');
        document.body.classList.add('sequence-scrolling');
        
        // Force next element back to original position
        if (nextElement) {
            const newTop = nextElement.getBoundingClientRect().top;
            const diff = newTop - nextTop;
            this.placeholder.style.height = `${block.offsetHeight - diff}px`;
        }
    }

    deactivateSequence() {
        if (!this.isActive) {
            console.log('Deactivate called but sequence not active');
            return;
        }
        
        console.log('Deactivating sequence:', {
            wasActive: this.isActive,
            currentFrame: this.currentFrame
        });
        
        this.isActive = false;
        document.body.classList.remove('sequence-scrolling');
        this.activeBlock.classList.remove('is-active');
        
        // When scrolling up from first frame, return to activation position
        if (this.currentFrame === 1) {
            window.scrollTo({
                top: this.activationScrollY,
                behavior: 'smooth'
            });
        }
        
        // Remove placeholder
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
    }

    handleWheel(event) {
        console.log('Wheel event:', {
            delta: Math.sign(event.deltaY),
            isActive: this.isActive,
            hasReachedEnd: this.hasReachedEnd,
            currentFrame: this.currentFrame,
            scrollY: window.scrollY
        });
        
        if (!this.isActive || this.hasReachedEnd) {
            console.log('Wheel event ignored:', { isActive: this.isActive, hasReachedEnd: this.hasReachedEnd });
            return;
        }
        
        const delta = Math.sign(event.deltaY);
        
        // Allow upward scrolling if we're at the first frame
        if (delta < 0 && this.currentFrame === 1) {
            console.log('Deactivating sequence - scrolling up from first frame');
            this.deactivateSequence();
            return;
        }
        
        event.preventDefault();
        
        // Throttle frame changes
        const now = Date.now();
        if (now - this.lastWheelTime < this.WHEEL_THROTTLE) return;
        this.lastWheelTime = now;
        
        if (delta > 0) {
            // Scrolling down
            if (this.currentFrame < this.TOTAL_FRAMES) {
                console.log('Next frame:', { current: this.currentFrame, total: this.TOTAL_FRAMES });
                this.nextFrame();
            } else {
                // When reaching last frame
                console.log('Reached last frame - deactivating sequence');
                this.hasReachedEnd = true;
                this.deactivateSequence();
                window.scrollTo({
                    top: this.activeBlock.offsetTop + this.activeBlock.offsetHeight,
                    behavior: 'smooth'
                });
            }
        } else if (delta < 0 && this.currentFrame > 1) {
            console.log('Previous frame:', { current: this.currentFrame });
            this.previousFrame();
        }
    }

    nextFrame() {
        if (this.currentFrame >= this.TOTAL_FRAMES) return;
        
        this.currentFrame++;
        this.updateFrame();
    }

    previousFrame() {
        if (this.currentFrame <= 1) return;
        
        this.currentFrame--;
        this.updateFrame();
    }

    updateFrame() {
        const frame = this.activeBlock.querySelector('.current-frame');
        if (frame) {
            frame.src = `assets/images/frames/${this.currentFrame.toString().padStart(3, '0')}.jpg`;
        }
        
        // Update progress bar
        const progress = this.activeBlock.querySelector('.sequence-progress');
        if (progress) {
            const percentage = ((this.currentFrame - 1) / (this.TOTAL_FRAMES - 1)) * 100;
            progress.style.width = `${percentage}%`;
        }
    }

    handleScroll() {
        if (!this.isActive && !this.hasReachedEnd) {
            this.sequenceBlocks.forEach(block => {
                const rect = block.getBoundingClientRect();
                console.log('Scroll check:', {
                    blockTop: rect.top,
                    isActive: this.isActive,
                    hasReachedEnd: this.hasReachedEnd,
                    scrollY: window.scrollY,
                    currentFrame: this.currentFrame
                });
                
                if (rect.top <= 0) {
                    this.activateSequence(block);
                }
            });
        } else if (this.hasReachedEnd) {
            // Reset end state if we scroll back above the trigger point
            const rect = this.sequenceBlocks[0].getBoundingClientRect();
            if (rect.top > 0) {
                this.hasReachedEnd = false;
                this.currentFrame = 1;
                this.updateFrame();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });
    
    // Reset any active states
    document.body.classList.remove('sequence-scrolling');
    document.querySelectorAll('.sequence-block').forEach(block => {
        block.classList.remove('is-active');
    });
    
    new ScrollSequence();
});