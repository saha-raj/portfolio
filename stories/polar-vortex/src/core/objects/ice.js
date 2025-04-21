import * as THREE from 'three';

export function createIceGroup(groupName, numPatches = 360 * 10, sphereRadius = 1.01) {
    const iceGroup = new THREE.Group();

    for (let i = 0; i < numPatches; i++) {
        const theta = Math.random() * Math.PI * 2; // Random longitude
        const phi = Math.acos(2 * Math.random() - 1); // Random latitude

        const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
        const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
        const z = sphereRadius * Math.cos(phi);

        const numSides = Math.floor(Math.random() * 4) + 4; // 4-7 sides
        const vertices = [];
        const baseRadius = 0.1;

        for (let j = 0; j < numSides; j++) {
            const angle = (j / numSides) * Math.PI * 2;
            const radius = baseRadius * (0.3 + Math.random() * 1.9); // Random radius
            vertices.push(new THREE.Vector2(
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            ));
        }

        const shape = new THREE.Shape(vertices);
        const iceGeometry = new THREE.ShapeGeometry(shape);

        const iceMaterial = new THREE.MeshPhongMaterial({
            color: 0xdee2e6,
            side: THREE.DoubleSide,
            blending: THREE.NoBlending,
            depthWrite: true,
            alphaTest: 0.5
        });

        const icePatch = new THREE.Mesh(iceGeometry, iceMaterial);

        icePatch.rotation.z = Math.random() * Math.PI * 2;
        icePatch.position.set(x, y, z);
        icePatch.lookAt(0, 0, 0);

        iceGroup.add(icePatch);
    }

    iceGroup.name = groupName; // Optional: assign a name for debugging
    iceGroup.visible = false;

    return iceGroup;
}
