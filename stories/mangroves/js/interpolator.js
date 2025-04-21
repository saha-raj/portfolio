class FrameInterpolator {
    constructor() {
        this.canvas = document.getElementById('transition-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Set canvas size
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    // Create intermediate frame between two images
    interpolateFrames(frame1, frame2, progress) {
        const tempCanvas1 = document.createElement('canvas');
        const tempCanvas2 = document.createElement('canvas');
        tempCanvas1.width = tempCanvas2.width = this.width;
        tempCanvas1.height = tempCanvas2.height = this.height;
        
        const ctx1 = tempCanvas1.getContext('2d');
        const ctx2 = tempCanvas2.getContext('2d');
        
        // Draw both frames
        ctx1.drawImage(frame1, 0, 0, this.width, this.height);
        ctx2.drawImage(frame2, 0, 0, this.width, this.height);
        
        // Get image data
        const imageData1 = ctx1.getImageData(0, 0, this.width, this.height);
        const imageData2 = ctx2.getImageData(0, 0, this.width, this.height);
        const resultData = this.ctx.createImageData(this.width, this.height);
        
        // Interpolate pixels
        for (let i = 0; i < imageData1.data.length; i += 4) {
            resultData.data[i] = imageData1.data[i] * (1 - progress) + imageData2.data[i] * progress;
            resultData.data[i + 1] = imageData1.data[i + 1] * (1 - progress) + imageData2.data[i + 1] * progress;
            resultData.data[i + 2] = imageData1.data[i + 2] * (1 - progress) + imageData2.data[i + 2] * progress;
            resultData.data[i + 3] = 255;
        }
        
        this.ctx.putImageData(resultData, 0, 0);
    }

    show() {
        this.canvas.style.display = 'block';
    }

    hide() {
        this.canvas.style.display = 'none';
    }
}

window.frameInterpolator = new FrameInterpolator();