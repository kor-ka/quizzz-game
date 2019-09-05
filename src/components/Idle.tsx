import * as THREE from 'three';
import * as React from "react";
import { SessionContext } from '../App';
import { SceneContext } from './Scene';
import { getCube, useAddMeshRemove } from './Helpers';

export const Idle = (props: { active: boolean; }) => {

    let [cube, setCube] = React.useState(getCube())
    useAddMeshRemove(cube);

    React.useEffect(() => {
        let interval = setInterval(() => {
            cube.rotation.x += 0.1;
            cube.rotation.y += 0.1;
            cube.rotation.z += 0.1;
        }, 20);
        return () => {
            clearInterval(interval);
        }
    });

    cube.material = new THREE.MeshBasicMaterial({ color: props.active ? '#ff00ee' : '#00ffee' })


    return null;
}
