import * as THREE from 'three';
import * as React from "react";
import { Scene, SceneContext } from "./Scene";
import BezierEasing from 'bezier-easing';
import { PerspectiveCamera } from 'three';

export const IN_OUT = [.42, 0, .58, 1] as [number, number, number, number];

export const interpolate = (from: number, to: number, i: number) => {
    return (from + (to - from) * i);
}

export const useAnimation = (mesh: THREE.Mesh | PerspectiveCamera) => {

    let scene = React.useContext(SceneContext);

    let [animation, setAnimation] = React.useState<{ to: { position?: THREE.Vector3, rotation?: THREE.Vector3 }, from: { position: THREE.Vector3, rotation: THREE.Vector3 }, start: number, end: number, rcb?: BezierEasing.EasingFunction, pcb?: BezierEasing.EasingFunction }>({ to: {}, from: {} as any, start: 0, end: 0 });

    let to = React.useCallback((to: { position?: THREE.Vector3, rotation?: THREE.Vector3, rcb?: [number, number, number, number], pcb?: [number, number, number, number] }, duration: number) => {
        let now = new Date().getTime();
        setAnimation({ to, from: { position: mesh.position.clone(), rotation: mesh.rotation.toVector3() }, start: now, end: now + duration, rcb: to.rcb ? BezierEasing(...to.rcb) : undefined, pcb: to.pcb ? BezierEasing(...to.pcb) : undefined });
    }, []);

    React.useEffect(() => {
        let dispose = scene.subscribeTicks(() => {
            let time = new Date().getTime();
            let mu = time < animation.end ? ((time - animation.start) / (animation.end - animation.start)) : 1;

            if (animation.to.position) {
                let pmu = animation.pcb ? animation.pcb(mu) : mu;
                mesh.position.x = interpolate(animation.from.position.x, animation.to.position.x, pmu);
                mesh.position.y = interpolate(animation.from.position.y, animation.to.position.y, pmu);
                mesh.position.z = interpolate(animation.from.position.z, animation.to.position.z, pmu);
            }
            if (animation.to.rotation) {
                let rmu = animation.rcb ? animation.rcb(mu) : mu;
                mesh.rotation.x = interpolate(animation.from.rotation.x, animation.to.rotation.x, rmu);
                mesh.rotation.y = interpolate(animation.from.rotation.y, animation.to.rotation.y, rmu);
                mesh.rotation.z = interpolate(animation.from.rotation.z, animation.to.rotation.z, rmu);
            }

        });
        return () => {
            // keep subscription till animation end
            let time = new Date().getTime();
            setTimeout(dispose, (animation.end || time) - time);
            dispose();
        }
    }, [animation]);

    return { to };
}