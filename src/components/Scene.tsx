import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from 'three';
import { FlexLayout } from "../ui/ui";
import { MeshLambertMaterial, MeshBasicMaterial } from "three";
import { camIdlePostion, camIdleRotation } from "./SesssionComponent";
import { gradient } from "../materials/gradient";
export const isChromium = (window as any).chrome;

export const SceneContext = React.createContext<{ scene: THREE.Scene, cam: THREE.PerspectiveCamera, subscribeTicks: (listener: (now: number) => void) => () => void }>({} as any);
export const minSceneCamZ = 500;

export class Scene extends React.PureComponent<{}, { scene?: THREE.Scene, cam?: THREE.PerspectiveCamera }> {
    ref = React.createRef<HTMLDivElement>();
    scene?: THREE.Scene;
    cam?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    frameId?: number;

    tickListeners = new Set<(now: number) => void>();
    constructor(props: any) {
        super(props);
        this.state = {};
    }

    subscribeTicks = (listener: (now: number) => void) => {
        this.tickListeners.add(listener);
        return () => {
            this.tickListeners.delete(listener);
        }
    }

    componentDidMount() {

        if (this.ref.current) {
            let e = ReactDOM.findDOMNode(this.ref.current) as Element;
            const width = e.clientWidth
            const height = e.clientHeight
            //ADD SCENE
            this.scene = new THREE.Scene()
            //ADD CAMERAS
            this.cam = new THREE.PerspectiveCamera(
                75,
                width / height,
                0.1,
                // so bad
                Number.MAX_SAFE_INTEGER
            )
            this.cam.position.copy(camIdlePostion);
            this.cam.rotation.setFromVector3(camIdleRotation);

            this.scene.add(this.cam);

            const color = 0xFFFFFF;
            const intensity = 1;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(1000, -1000, 4000);
            light.target.position.set(0, 10, 0);
            light.castShadow = true;
            this.scene.add(light);
            this.scene.add(light.target);

            //ADD RENDERER
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setClearColor('#fffffe');
            this.renderer.setSize(width, height);

            // SHADOWS
            this.renderer.shadowMapEnabled = true;
            this.renderer.shadowMapDebug = true;


            e.appendChild(this.renderer.domElement)

            // let w = 9000;
            // let h = 9000;
            // let floor = new THREE.PlaneGeometry(w, h);
            // let floorMesh = new THREE.Mesh(floor, gradient(w, h, 'black', '#333'));
            // floorMesh.receiveShadow = true;

            // this.scene.add(floorMesh);

            var gridHelper = new THREE.GridHelper(100000, 1000);
            gridHelper.rotateX(1.5708);
            // this.scene.add(gridHelper);
            this.start()

            this.setState({ scene: this.scene, cam: this.cam });
        }

    }
    componentWillUnmount() {
        this.stop()
        // this.ref.removeChild(this.renderer.domElement)
    }
    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.tick)
        }
    }
    stop = () => {
        cancelAnimationFrame(this.frameId!)
    }
    tick = () => {
        let now = new Date().getTime()
        this.tickListeners.forEach(l => l(now));
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.tick)
    }


    renderScene = () => {
        this.renderer!.render(this.scene!, this.cam!);
    }
    render() {
        return (
            <SceneContext.Provider value={{ scene: this.state.scene!, cam: this.state.cam!, subscribeTicks: this.subscribeTicks }}>
                <div
                    style={{ width: window.innerWidth, height: window.innerHeight }}
                    ref={this.ref}
                />
                <FlexLayout style={{ width: '100%', height: '100%', position: 'absolute' }} divider={0}>
                    {this.state.cam && this.state.scene && this.props.children}
                </FlexLayout>
            </SceneContext.Provider>
        )
    }
}