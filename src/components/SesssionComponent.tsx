import * as THREE from 'three';
import * as React from "react";
import { SessionContext } from "../App";
import { ClientQuestion } from "../../server/src/game/Game";
import { Scene, SceneContext } from "./Scene";
import { SessionStateComponent, Game as GameControls } from "./Controls";
import { getCard, getTextMesh } from "./Helpers";
import { Vector3 } from "three";
import { useAnimation } from './useAnimation';
import { hashCode } from '../utils/hashCode';
import { makeId } from '../utils/makeId';

export const SessionComponent = () => {
    return <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }} >
        <Scene>
            <SceneRender />
        </Scene>
    </div >
        ;
}

export const SceneRender = () => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);
    let [state, setState] = React.useState<'idle' | 'joining' | 'game'>('idle');

    React.useEffect(() => {
        let sessionState = session.sesssionState;
        let users = session.users;

        let update = () => {

            if (sessionState.state === 'await' || sessionState.state === 'connecting') {
                setState(users.size === 0 ? 'idle' : 'joining')
            } else if (sessionState.state === 'countdown') {
                setState('joining')
            } else if (sessionState.state === 'game') {
                setState('game');
            }

            console.warn(sessionState, users);

        }



        let sub1 = session.subscribeSessionState(s => {
            sessionState = s;
            update();
        });
        let sub2 = session.subscribeUsers(u => {
            users = users;
            update();
        });
        return () => {
            sub1();
            sub2();
        }
    }, []);

    const toIdle = React.useCallback(() => { setState('idle') }, []);
    const tojoining = React.useCallback(() => { setState('joining') }, []);

    return <>
        <div style={{ position: 'absolute', top: 0 }}>{state}</div>
        {/* <Idle active={state === 'idle'} /> */}
        {/* <Button style={{ border: state === 'idle' ? '1px solid black' : '' }} onClick={toIdle}>Idle</Button>
        <Button style={{ border: state === 'joining' ? '1px solid black' : '' }} onClick={tojoining}>joining</Button> */}
        {state === 'joining' && <SessionStateComponent />}
        {state === 'game' && <GameControls />}
        <GameRender />
    </>
}

export const GameCard = React.memo((props: { qid: string, category: string, question?: ClientQuestion, active: boolean, index: number }) => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);

    let [card] = React.useState(getCard());
    React.useEffect(() => {


        card.position.z = props.index * 6;
        card.rotation.z = THREE.Math.degToRad(-45);

        let positionTremor = 10;
        let xTremor = hashCode(props.qid + 'x') % positionTremor - positionTremor / 2;
        card.position.x += xTremor;
        let yTremor = hashCode(props.qid + 'y') % positionTremor - positionTremor / 2;
        card.position.y += yTremor;

        let rotationTremor = THREE.Math.degToRad(5);
        let zTremor = hashCode(props.qid + 'z') % rotationTremor - rotationTremor / 2;
        card.rotation.z += zTremor;

        scene.scene.add(card);
        return () => {
            scene.scene.remove(card);
        }
    }, []);

    let { to: cardAnimatTo } = useAnimation(card);

    React.useEffect(() => {
        if (props.question!!) {
            if (props.active) {

                // find position infront of cam
                let base = 310 + 20;
                let vertAngle = THREE.Math.degToRad(90 - scene.cam.fov / 2);
                let distanceV = base / 2 * Math.tan(vertAngle);

                let horisontalBase = (base * scene.cam.aspect) / 2;
                let horAngle = Math.atan(distanceV / horisontalBase);

                let distanveH = (440 + 20) / 2 * Math.tan(horAngle);

                let mesh = new THREE.Mesh();
                scene.cam.add(mesh);

                mesh.translateZ(-Math.max(distanceV, distanveH));

                if (session.isMobile) {
                    let height = 2 * Math.max(distanceV, distanveH) * Math.tan(THREE.Math.degToRad(scene.cam.fov / 2));
                    // mesh.position.y -= (height - 160) / 2;
                    mesh.position.y += (height - 310) / 2 - 10;
                }

                let targetPostion = new Vector3();
                mesh.getWorldPosition(targetPostion);

                let targetRotation = scene.cam.rotation.clone();
                targetRotation.z += THREE.Math.degToRad(-90);
                targetRotation.x += THREE.Math.degToRad(-180);

                let targetRotationVector = targetRotation.toVector3();
                cardAnimatTo({
                    position: targetPostion,
                    pcb: [.34, .24, .18, 1.06],
                    rotation: targetRotationVector,
                    rcb: [.42, 0, .3, 1.01]
                }, 1000);

            } else {
                console.log(props.qid, 'animate to old');
                cardAnimatTo({ position: new Vector3(100, 0, 700), rotation: new Vector3(THREE.Math.degToRad(-90), 0, THREE.Math.degToRad(0)) }, 200);
            }

        }
    }, [props.question!!, props.active]);

    React.useEffect(() => {
        let text: THREE.Mesh;
        if (props.question && props.question.text) {
            let text = getTextMesh({
                width: 440, height: 310,
                text: props.question.text,
                fontSize: 40,
                padding: 40
            });
            card.add(text);

            text.rotation.x = THREE.Math.degToRad(180);
            text.rotation.z = THREE.Math.degToRad(-90);
            text.position.z = -2;
        }

        return () => {
            if (text) {
                card.remove(text);
            }
        }
    }, [props.question && props.question.text]);

    return <></>;

});

export const GameRender = () => {
    let scene = React.useContext(SceneContext);
    scene.cam.rotation.x = THREE.Math.degToRad(45);
    let session = React.useContext(SessionContext);


    // if (session!.isMobile) {
    //     scene.cam.translateY(50);
    // }


    let [cards, setCards] = React.useState<{ qid: string, category: string, question?: ClientQuestion, active: boolean }[]>([]);

    React.useEffect(() => {
        session!.game.listen(gs => {
            setCards(gs.stack);
        });
    }, []);

    const reset = React.useCallback(() => {
        let res = [];
        for (let i = 0; i < 10; i++) {
            res.push(
                {
                    qid: makeId(),
                    category: new Date().getTime() + 'test',
                    active: true,
                    question: i === 9 ? { text: new Date().toLocaleTimeString(), _id: makeId(), category: new Date().getTime() + 'test' } : undefined,
                }
            );
        }
        setCards(res);
    }, []);

    // React.useEffect(() => {
    //     reset();
    // }, []);

    return <>
        {cards.map((c, i) => <GameCard key={c.qid} index={i} {...c} />)}
    </>

}
