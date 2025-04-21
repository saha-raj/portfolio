// ------------------------------------------------------------ 
// Create atmosphere
// ------------------------------------------------------------ 
import * as THREE from 'three';

export function createAtmosphereNonLinear(numLayers = 12, baseOpacity = 0.1, color = 0xcae9ff) {

            const AtmosphereHotNonlinear = new THREE.Group();
            const baseGeometry = new THREE.SphereGeometry(1, 64, 64);
            
            for (let i = 0; i < numLayers; i++) {
                const t = i / (numLayers - 1);
                const scale = 1.07 + (0.25 * Math.pow(t, 2.5));
                const opacity = baseOpacity * (0.5 - Math.pow(t, 3.5));
                
                const layer = new THREE.Mesh(
                    baseGeometry,
                    new THREE.MeshPhongMaterial({
                        color: color,
                        transparent: true,
                        opacity: opacity,
                        shininess: 0,
                        depthWrite: false,
                    })
                );

                layer.scale.set(scale, scale, scale);
                AtmosphereHotNonlinear.add(layer);
            }
            
            AtmosphereHotNonlinear.visible = true;  // Start visible
            

    return AtmosphereHotNonlinear;
}