import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from 'three';
import { FlexLayout } from "../ui/ui";
export const isChromium = (window as any).chrome;

export const SceneContext = React.createContext<{ scene: THREE.Scene, cam: THREE.PerspectiveCamera, subscribeTicks: (listener: () => void) => () => void }>({} as any);
export const minSceneCamZ = 500;

export class Scene extends React.PureComponent<{}, { scene?: THREE.Scene, cam?: THREE.PerspectiveCamera }> {
    ref = React.createRef<HTMLDivElement>();
    scene?: THREE.Scene;
    cam?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    frameId?: number;

    tickListeners = new Set<() => void>();
    constructor(props: any) {
        super(props);
        this.state = {};
    }

    subscribeTicks = (listener: () => void) => {
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
            this.cam.position.z = minSceneCamZ;
            this.cam.position.y = -500;
            this.cam.rotation.x = THREE.Math.degToRad(45);

            const color = 0xFFFFFF;
            const intensity = 1;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(0, 10, 400);
            light.target.position.set(5, 500, 200);
            this.scene.add(light);
            this.scene.add(light.target);

            //ADD RENDERER
            this.renderer = new THREE.WebGLRenderer({ antialias: true })
            this.renderer.setClearColor('#ffffff')
            this.renderer.setSize(width, height)
            e.appendChild(this.renderer.domElement)

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
        this.tickListeners.forEach(l => l());
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