export class SceneVisibilityEnforcer {
    constructor() {
        // Define which objects should be visible in each scene
        this.sceneVisibilityMap = {
            intro: {
                bounds: { start: 0, end: 0.05 },
                allowedObjects: ['intro-header', 'intro-segment', 'earth']
            },
            // simulation: {
            //     bounds: { start: SIM_SEGMENT_START_AT, end: SIM_SEGMENT_END_AT },
            //     allowedObjects: ['sim-controls', 'sim-v-plot', 'sim-solution-plot', 'earth']
            // }
            // ... other scenes
        };
    }

    enforceSceneVisibility(progress, objects) {
        // Determine current scene
        const currentScene = this.getCurrentScene(progress);
        
        if (currentScene) {
            const allowedObjects = this.sceneVisibilityMap[currentScene].allowedObjects;
            
            // Force hide everything not in allowed list
            objects.forEach((obj, id) => {
                const shouldBeVisible = allowedObjects.includes(id);
                this.setObjectVisibility(obj, shouldBeVisible);
            });
        }
    }

    getCurrentScene(progress) {
        return Object.keys(this.sceneVisibilityMap).find(sceneName => {
            const bounds = this.sceneVisibilityMap[sceneName].bounds;
            return progress >= bounds.start && progress <= bounds.end;
        });
    }

    setObjectVisibility(obj, visible) {
        if (obj.element) {
            obj.element.classList.toggle('hidden', !visible);
        } else if (obj.object) {
            obj.object.visible = visible;
        }
    }
} 