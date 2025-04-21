export class VisibilityManager {
    constructor(objects, segmentBounds) {
        this.objects = objects;
        this.bounds = segmentBounds;
        this.lastUpdate = 0;
    }

    // Strategy 1: Direct RAF manipulation
    enforceVisibilityRAF(progress) {
        const isInSegment = progress >= this.bounds.start && progress <= this.bounds.end;
        ['sim-controls', 'sim-v-plot', 'sim-solution-plot'].forEach(id => {
            const obj = this.objects.get(id);
            if (obj?.element) {
                obj.element.classList.toggle('hidden', !isInSegment);
            } else if (obj?.object) {
                obj.object.classList.toggle('hidden', !isInSegment);
            }
        });
    }

    // Strategy 2: State machine
    updateVisibilityState(progress) {
        const state = this.determineState(progress);
        this.enforceStateVisibility(state);
    }

    // Strategy 3: Scene exit cleanup
    cleanupOnExit(progress) {
        if (progress < this.bounds.start || progress > this.bounds.end) {
            this.forceHideAllSimElements();
        }
    }
} 