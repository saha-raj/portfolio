export class DebugLogger {
    constructor() {
        this.lastLoggedProgress = -1;
        this.logThreshold = 0.01; // Log every 1% change
        this.lastEarthPosition = null;
    }

    logProgress(progress) {
        // Only log if progress has changed by threshold amount
        if (Math.abs(progress - this.lastLoggedProgress) >= this.logThreshold) {
            console.log(`Scroll Progress: ${(progress * 100).toFixed(2)}%`);
            this.lastLoggedProgress = progress;
        }
    }

    logObjectState(id, state) {
        if (id === 'earth') {
            // Log only when position changes
            const currentPos = JSON.stringify(state.position);
            if (this.lastEarthPosition !== currentPos) {
                console.log('%cEarth Position Change:', 'color: #ff0000; font-weight: bold');
                console.log('Previous:', this.lastEarthPosition ? JSON.parse(this.lastEarthPosition) : 'Initial');
                console.log('Current:', state.position);
                console.log('Scroll Progress:', this.lastLoggedProgress);
                console.log('Transforms:', state.transforms);
                this.lastEarthPosition = currentPos;
            }
        }
    }
} 