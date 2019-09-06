import * as THREE from 'three';
import * as React from "react";
import { Vector3, ExtrudeGeometry } from 'three';
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
        depth: 3,
        bevelEnabled: false,
    });
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    let mesh = new THREE.Mesh(geometry, material);



    mesh.geometry.center();

    let text = getTextMesh({ width: 440, height: 310, text: 'Q?', fontSize: 440, font: 'Courier', bold: true, x: 200, y: -85 })
    mesh.add(text);
    text.position.z = 2;
    text.rotation.z = THREE.Math.degToRad(90);

    return mesh;
}

export let wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number, color: string, height: number, padding: number, x?: number, y?: number) => {
    var words = text.split(' ');
    var line = '';
    context.fillStyle = color;

    let lines: string[] = [];
    let realWidth = 0;
    for (let n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var testMetrics = context.measureText(testLine);
        if (testMetrics.width > maxWidth - (padding * 2) && n > 0) {
            // context.fillText(line, x, y);
            lines.push(line);
            var realMetrics = context.measureText(line);
            realWidth = Math.max(realWidth, realMetrics.width);
            line = words[n] + ' ';


        }
        else {
            line = testLine;
        }
    }
    var realMetrics = context.measureText(line);

    lines.push(line);
    realWidth = Math.max(realWidth, realMetrics.width);

    let startY = lineHeight + (height - lineHeight * lines.length) / 2 + (y || 0);
    let startX = (maxWidth - realWidth) / 2 + (x || 0);
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], startX, startY + lineHeight * i);
    }
}
export let getTextMesh = (props: { width: number, height: number, text: string, fontSize: number, padding?: number, color?: string, font?: string, bold?: boolean, x?: number, y?: number }) => {
    let { width, height, text, fontSize, padding, color, font, bold, x, y } = props;
    padding = padding || 0;
    color = color || 'black';
    font = font || 'Arial';
    let canvas = document.createElement('canvas');
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    var context = canvas.getContext('2d')!;
    context.scale(devicePixelRatio, devicePixelRatio);
    var maxWidth = width;
    var lineHeight = fontSize;
    context.font = `${bold ? 'bold' : ''} ${fontSize}px ${font}`;
    // context.fillStyle = '#f9e'
    context.fillStyle = 'rgba(0,0,0,0)'
    context.fillRect(0, 0, 1000, 1000);
    wrapText(context, text, maxWidth, lineHeight, color, height, padding, x, y);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    let material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });

    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 10, 10), material);
    canvas.remove();

    return mesh;
}

