// ------------------------------------------------------------ 
// Create regular atmosphere 
// ------------------------------------------------------------ 

import * as THREE from 'three';

export function createAtmosphereSingleLayer(sphereRadius = 1.1, opacity = 0.2, color = 0xffffff, emissive = 0x4f9aff) {

    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);

    // const cloudsRegular = new THREE.TextureLoader().load('public/assets/textures/clouds_transparent.png');

    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        // map: cloudsRegular,
        color: color,
        transparent: true,
        opacity: opacity,
        side: THREE.FrontSide,
        shininess: 1,
        emissive: emissive,
        emissiveIntensity: 0.4
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    atmosphereMesh.visible = false;
    return atmosphereMesh;
}