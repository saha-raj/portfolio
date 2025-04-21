export class DebugOverlay {
    constructor() {
        this.createOverlay();
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: #8d99ae;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 9999;
            pointer-events: none;
        `;

        this.progressElement = document.createElement('div');
        this.sceneElement = document.createElement('div');
        
        overlay.appendChild(this.sceneElement);
        overlay.appendChild(this.progressElement);
        
        document.body.appendChild(overlay);
    }

    updateProgress(progress) {
        this.progressElement.textContent = `Progress: ${(progress * 100).toFixed(2)}%`;
    }

    updateScene(sceneNumber) {
        this.sceneElement.textContent = `Scene: ${sceneNumber}`;
    }
} 