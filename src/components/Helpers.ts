import * as THREE from 'three';
import * as React from "react";
import { Vector3 } from 'three';

export const useAddMeshRemove = (scene: { scene?: THREE.Scene | undefined }, mesh: THREE.Mesh | THREE.Mesh[]) => {
    React.useEffect(() => {
        let toRemove = Array.isArray(mesh) ? mesh : [mesh];
        if (scene.scene) {
            scene.scene.add(...toRemove);
        }
        return () => {
            if (scene.scene) {
                scene.scene.remove(...toRemove);
            }
        }
    }, [])
}

export const getCube = () => {
    const geometry = new THREE.BoxGeometry(100, 100, 100);;
    const material = new THREE.MeshLambertMaterial({ color: "#ff00ee" })
    return new THREE.Mesh(geometry, material)
}

export const getCard = () => {
    var height = 88, width = 62, radius = 8;

    var shape = new THREE.Shape();


    shape.moveTo(0, height / 2);
    shape.lineTo(0, height - radius);
    shape.absarc(radius, height - radius, radius, THREE.Math.degToRad(180), THREE.Math.degToRad(90), true);
    shape.lineTo(width - radius, height);
    shape.absarc(width - radius, height - radius, radius, THREE.Math.degToRad(90), THREE.Math.degToRad(0), true);
    shape.lineTo(width, radius);
    shape.absarc(width - radius, radius, radius, THREE.Math.degToRad(0), THREE.Math.degToRad(270), true);
    shape.lineTo(radius, 0);
    shape.absarc(radius, radius, radius, THREE.Math.degToRad(270), THREE.Math.degToRad(180), true);
    shape.lineTo(0, height / 2);



    var geometry = new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: 2,
        bevelEnabled: false,
    });
    var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

    let mesh = new THREE.Mesh(geometry, material);

    mesh.geometry.center();
    let scale = 5;
    mesh.geometry.scale(scale, scale, scale);

    return mesh;
}
