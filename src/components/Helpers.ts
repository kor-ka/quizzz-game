import * as THREE from 'three';
import * as React from "react";

export const useAddMeshRemove = (scene: { scene?: THREE.Scene | undefined }, mesh: THREE.Mesh | THREE.Mesh[]) => {
    let toRemove = Array.isArray(mesh) ? mesh : [mesh];
    if (scene.scene) {
        scene.scene.add(...toRemove);
    }
    React.useEffect(() => {
        if (scene.scene) {
            scene.scene.remove(...toRemove);
        }
    }, [])
}

export const getCube = () => {
    const geometry = new THREE.BoxGeometry(100, 100, 100);;
    const material = new THREE.MeshBasicMaterial({ color: "#ff00ee" })
    return new THREE.Mesh(geometry, material)
}