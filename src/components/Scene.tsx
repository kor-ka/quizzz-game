import * as React from "react";
import * as ReactDOM from "react-dom";
import * as THREE from 'three';
export const isChromium = (window as any).chrome;

export const SceneContext = React.createContext<{ scene?: THREE.Scene, cam?: THREE.PerspectiveCamera }>({});

export class Scene extends React.PureComponent<{}, { scene?: THREE.Scene, cam?: THREE.PerspectiveCamera }> {
    ref = React.createRef<HTMLDivElement>();
    scene?: THREE.Scene;
    cam?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    frameId?: number;
    minSceneCamZ = 5000;
    constructor(props: any) {
        super(props);
        this.state = {};
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
            this.cam.position.z = this.minSceneCamZ;
            this.cam.position.x = 0;
            this.cam.position.y = 0;

            //ADD RENDERER
            this.renderer = new THREE.WebGLRenderer({ antialias: true })
            this.renderer.setClearColor('#ffffff')
            this.renderer.setSize(width, height)
            e.appendChild(this.renderer.domElement)

            var gridHelper = new THREE.GridHelper(1000000, 1000);
            gridHelper.rotateX(1.5708);
            this.scene.add(gridHelper);
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
        this.renderScene()
        this.frameId = window.requestAnimationFrame(this.tick)
    }


    renderScene = () => {
        this.renderer!.render(this.scene!, this.cam!);
    }
    render() {
        return (
            <SceneContext.Provider value={{ scene: this.state.scene, cam: this.state.cam }}>
                <div
                    style={{ width: window.innerWidth, height: window.innerHeight }}
                    ref={this.ref}
                />
                {this.props.children}
            </SceneContext.Provider>
        )
    }
}