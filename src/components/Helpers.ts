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

export const getCard = (params?: { depth?: number }) => {
    let depth = 3;
    if (params) {
        depth = params.depth || depth;
    }

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
        depth,
        bevelEnabled: false,
    });
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff });

    let mesh = new THREE.Mesh(geometry, material);

    mesh.geometry.center();

    let text = getTextMesh({ w: 440, h: 310, text: '?', fontSize: 300, x: 40, y: -40, color: 'white', background: true })
    mesh.add(text);
    text.position.z = depth / 2 + 3;
    text.rotation.z = THREE.Math.degToRad(90);

    mesh.castShadow = true;
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
export let getTextMesh = (props: { w: number, h: number, text: string, fontSize: number, padding?: number, color?: string, font?: string, bold?: boolean, x?: number, y?: number, background?: boolean }) => {
    let { w, h, text, fontSize, padding, color, font, bold, x, y, background } = props;
    padding = padding || 0;
    color = color || 'black';
    font = font || 'Arial';
    let canvas = document.createElement('canvas');
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;

    var ctx = canvas.getContext('2d')!;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    if (background) {
        let radius = 35;
        let bgPadding = 6;
        ctx.beginPath();
        ctx.lineTo(bgPadding, h / 2);
        ctx.arc(bgPadding + radius, bgPadding + radius, radius, THREE.Math.degToRad(180), THREE.Math.degToRad(-90));
        ctx.arc(w - bgPadding - radius, bgPadding + radius, radius, THREE.Math.degToRad(-90), THREE.Math.degToRad(0));
        ctx.arc(w - bgPadding - radius, h - bgPadding - radius, radius, THREE.Math.degToRad(0), THREE.Math.degToRad(90));
        ctx.arc(bgPadding + radius, h - bgPadding - radius, radius, THREE.Math.degToRad(90), THREE.Math.degToRad(-180));
        ctx.lineTo(bgPadding, h / 2);
        let gradient = ctx.createLinearGradient(0, h, w, 0)
        gradient.addColorStop(0, '#0E2268');
        gradient.addColorStop(1, '#173199');
        ctx.fillStyle = gradient;

        ctx.fill();
    }

    var maxWidth = w;
    var lineHeight = fontSize;

    fontSize = fontSize * Math.min(1, 100 / text.length);

    ctx.font = `${bold ? 'bold' : ''} ${fontSize}px ${font}`;
    // context.fillStyle = '#f9e'
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, 1000, 1000);
    wrapText(ctx, text, maxWidth, lineHeight, color, h, padding, x, y);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    let material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });

    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 10, 10), material);
    canvas.remove();

    return mesh;
}

