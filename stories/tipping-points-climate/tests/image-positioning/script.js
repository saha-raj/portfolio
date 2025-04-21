let isVisible = false;
const background = document.getElementById('background');

// Load test image
const testImage = new Image();
testImage.src = 'pbd.webp';  // your image
testImage.onload = () => {
    // Set actual image dimensions
    background.style.width = testImage.width + 'px';
    background.style.height = testImage.height + 'px';
    background.style.backgroundImage = `url(${testImage.src})`;
    background.style.backgroundSize = '100% 100%';  // Use actual size
    background.style.backgroundPosition = 'center';
    background.style.backgroundRepeat = 'no-repeat';
};

function toggleImage() {
    isVisible = !isVisible;
    background.style.opacity = isVisible ? '1' : '0';
}