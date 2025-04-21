export class BackgroundManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // console.log('Background container:', this.container);
        this.backgrounds = new Map();
        this.currentBackground = null;
        this.currentProgress = 0;
    }

    loadBackground(config) {
        const img = new Image();
        img.src = config.file;
        
        img.onload = () => {
            img.className = 'background-image';
            
            // Set initial visibility based on whether this should be visible at start
            const shouldBeVisibleAtStart = config.entry.at === 0;
            img.style.cssText = `
                opacity: ${shouldBeVisibleAtStart ? '1' : '0'} !important;
                visibility: visible !important;
                display: block !important;
            `;
            
            this.backgrounds.set(config.id, {
                element: img,
                config: config
            });
            
            // Sort backgrounds by entry time and append in order
            const sortedBackgrounds = Array.from(this.backgrounds.values())
                .sort((a, b) => a.config.entry.at - b.config.entry.at);
                
            // Clear container and append in order
            this.container.innerHTML = '';
            sortedBackgrounds.forEach(bg => {
                this.container.appendChild(bg.element);
            });
        };

        img.onerror = (e) => {
            console.error('Failed to load background image:', config.file, e);
        };
    }

    updateProgress(progress) {
        this.currentProgress = progress;
        this.backgrounds.forEach(({element, config}) => {
            const shouldBeVisible = progress >= config.entry.at && progress <= config.exit.at;
            
            // Remove !important to allow CSS transition to work
            element.style.opacity = shouldBeVisible ? '1' : '0';
            
            // No need for RAF check since we're using CSS transitions
        });
    }
} 