import * as THREE from 'three';

export const gradient = (w: number, h: number, start: string, end: string) => {
    let canvas = document.createElement('canvas');
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;

    var ctx = canvas.getContext('2d')!;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    let gradient = ctx.createLinearGradient(0, h, w, 0)
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    var texture = new THREE.Texture(canvas);
    canvas.remove();
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
};