// ------------------------------------------------------------ 
// Create shadow cylinder and end cap   
// ------------------------------------------------------------ 

import * as THREE from 'three';

export function createShadowCylinder(cylinderLength = 4, sphereRadius = 1.01) {

    const cylinderGeometry = new THREE.CylinderGeometry(sphereRadius, sphereRadius, cylinderLength, 64); 
    const cylinderMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const shadowCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    
    // Create end cap
    const capGeometry = new THREE.CircleGeometry(1, 64);
    const capMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    });
    const endCap = new THREE.Mesh(capGeometry, capMaterial);
    
    // Position at far end of cylinder
    endCap.position.y = -cylinderLength/2;  // Move to far end
    endCap.rotation.x = Math.PI/2;  // Rotate to face outward
    
    shadowCylinder.add(endCap);
    
    // Rotate cylinder to align with X axis and position it
    shadowCylinder.rotation.z = Math.PI/2;
    // By default, cylinder is centered at origin, so we need to move it by half its length + earth radius
    shadowCylinder.position.x = (cylinderLength/2);
    
    shadowCylinder.visible = false;  // Start invisible

    return shadowCylinder;
}