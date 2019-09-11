import * as THREE from 'three';
import * as React from "react";
import { SceneContext } from './Scene';
import { camIdlePostion, camIdleRotation } from './SesssionComponent';
import { Mesh } from 'three';
import { getCard } from './Helpers';

const getCyl = (color: string) => {
    let geo = new THREE.CylinderGeometry(500, 500, 500, 10, 1, true);
    geo.rotateX(THREE.Math.degToRad(90));
    let res = new THREE.Mesh(geo, spiralTexture(color))
    return res;
}

const spiralTexture = (color: string) => {
    let w = 400;
    let h = 200



    let canvas = document.createElement('canvas');
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;

    var ctx = canvas.getContext('2d')!;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    // ctx.fillStyle = '#fff'
    // ctx.fillRect(0, 0, w + 1, h + 1);
    ctx.beginPath();
    ctx.lineTo(w, h);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, w)
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    var texture = new THREE.Texture(canvas);
    // canvas.remove();
    texture.needsUpdate = true;

    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.BackSide });
}

export const Idle = React.memo((props: { active: boolean }) => {

    let scene = React.useContext(SceneContext);
    let [holder] = React.useState(new Mesh());

    React.useEffect(() => {
        scene.scene.add(holder);
        holder.position.copy(camIdlePostion);
        holder.rotation.setFromVector3(camIdleRotation);
        holder.updateMatrixWorld();

        // TUBE
        let cyls: THREE.Mesh[] = [];
        for (let i = 0; i < 10; i++) {
            cyls.push(getCyl('black'));
        }

        cyls.map(c => holder.add(c));

        // CARD
        let card = getCard({ depth: 30 });
        card.position.z -= 800;
        holder.add(card);

        let dispose = scene.subscribeTicks((now) => {

            // TUBE ANIMATION
            let time = 5000 * cyls.length;
            let distance = cyls.length * 500;
            cyls.map((c, i) => {
                let interoplated = ((now - time / cyls.length * i) % time) / time;
                c.position.z = distance * interoplated - cyls.length * 500 + 200;
                c.rotateZ(0.003);
            });

            // Card ANIMATION
            let angle = THREE.Math.degToRad(30);
            card.rotation.y = Math.sin(1 / 732 * now) * angle;
            card.rotation.z = THREE.Math.degToRad(-90) + Math.cos(1 / 952 * now) * angle;
            // console.warn(Math.sin(time));

        })

        return () => {
            dispose();
            scene.cam.remove(holder);
        }


    }, []);

    React.useEffect(() => {
        if (props.active) {

        } else {

        }
    }, [props.active])


    return <div />;
})
