import * as THREE from 'three';

export const cardGradient = (w: number, h: number, radius: number, padding: number, start: string, end: string) => {

  let canvas = document.createElement('canvas');
  canvas.width = w * devicePixelRatio;
  canvas.height = h * devicePixelRatio;

  var ctx = canvas.getContext('2d')!;
  ctx.scale(devicePixelRatio, devicePixelRatio);


  ctx.beginPath();
  ctx.lineTo(padding, h / 2);
  ctx.lineTo(padding, padding + radius);
  ctx.arc(padding + radius, padding + radius, radius, THREE.Math.degToRad(180), THREE.Math.degToRad(90));
  ctx.lineTo(w - padding - radius, padding);
  ctx.arc(w - padding - radius, padding + radius, radius, THREE.Math.degToRad(90), THREE.Math.degToRad(0));
  ctx.lineTo(w - padding, h - padding - radius);
  ctx.arc(w - padding - radius, h - padding - radius, radius, THREE.Math.degToRad(0), THREE.Math.degToRad(-90));
  ctx.lineTo(padding + radius, h - padding);
  ctx.arc(padding + radius, h - padding - radius, radius, THREE.Math.degToRad(-90), THREE.Math.degToRad(-180));
  ctx.lineTo(padding, h / 2);

  ctx.fill()

  var texture = new THREE.Texture(canvas);
  canvas.remove();
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;

  return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
};

export var gradientShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      value: new THREE.Color("#060606")
    },
    color2: {
      value: new THREE.Color("#090909")
    }
  },
  vertexShader: `
      varying vec2 vUv;
  
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
  fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
    
      varying vec2 vUv;
      
      void main() {
        
        gl_FragColor = vec4(mix(color1, color2, ((vUv.x + vUv.y) * 75.0) - 73.0), 1.0);
      }
    `,
  wireframe: false
});