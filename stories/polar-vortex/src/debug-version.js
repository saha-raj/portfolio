// Debug version file to help track deployments
export const DEBUG_VERSION = '1.0.2';
export const DEBUG_TIMESTAMP = new Date().toISOString();
export const DEBUG_MESSAGE = 'This build includes fixed asset paths without public/ prefix';

// Function to test asset paths
export function testAssetPaths() {
    console.log('Testing asset paths...');
    const assetPaths = [
        'assets/textures/2_no_clouds_8k_no_seaice.jpg',
        'assets/textures/rodinia_unpix.png',
        'assets/textures/seaice/seaice_2001.png',
        'assets/backgrounds/pbd.webp'
    ];
    
    // Test using both Image and fetch
    assetPaths.forEach(path => {
        // Test with Image object
        const img = new Image();
        const fullPath = import.meta.env.BASE_URL + path;
        img.onload = () => console.log(`✅ Image loaded: ${fullPath}`);
        img.onerror = () => {
            console.error(`❌ Image failed to load: ${fullPath}`);
            
            // Additional fetch test for the same resource
            fetch(fullPath)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
                    console.log(`✅ Fetch successful for: ${fullPath}`);
                    return response;
                })
                .catch(error => console.error(`❌ Fetch failed for: ${fullPath}`, error));
        };
        img.src = fullPath;
        
        console.log(`🔍 Attempting to load: ${fullPath}`);
    });

    // Also log base URL for debugging
    console.log(`Base URL: ${import.meta.env.BASE_URL}`);
    console.log(`Absolute URL example: ${window.location.origin}${import.meta.env.BASE_URL}assets/sagelabs-favicon.png`);
} 