import * as THREE from 'three';
import * as React from "react";
import { Vector3 } from 'three';
import { SceneContext } from './Scene';
import { MeshText2D, textAlign } from 'three-text2d'

export const useAddMeshRemove = (mesh: THREE.Mesh | THREE.Mesh[]) => {
    let scene = React.useContext(SceneContext);
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
    var height = 440, width = 310, radius = 40;

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
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    let mesh = new THREE.Mesh(geometry, material);

    mesh.geometry.center();

    return mesh;
}

export let wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, color: string) => {
    var words = text.split(' ');
    var line = '';
    var lines = 1;
    context.fillStyle = color;
    for (let n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lines++;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line || text, x, y);
    return lines;
}
export let getTextMesh = (props: { width: number, height: number, text: string, fontSize: number, padding?: number, color?: string }) => {
    let { width, height, text, fontSize, padding, color } = props;
    padding = padding || 0;
    color = color || 'black';
    let canvas = document.createElement('canvas');
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    var context = canvas.getContext('2d')!;
    var maxWidth = (width - padding * 2) * window.devicePixelRatio;
    var lineHeight = fontSize * 0.4 * window.devicePixelRatio;
    var x = (canvas.width - maxWidth) / 2;
    var y = lineHeight + padding
    context.font = `${fontSize}px Arial`;
    context.fillStyle = 'rgba(0,0,0,0)'
    context.fillRect(0, 0, 1000, 1000);
    let lines = wrapText(context, text, x, y, maxWidth, lineHeight, color);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    let material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });

    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 10, 10), material);
    canvas.remove();

    let resHeight = lines * lineHeight;

    console.warn(lines, lineHeight);
    if (resHeight < (height - padding * 2)) {
        mesh.translateX(-((height - padding * 2) - resHeight) / 2)
    }

    return mesh;
}

