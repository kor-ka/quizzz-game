import * as THREE from 'three';
import * as React from "react";
import { SessionState } from "../../server/src/session/Session";
import { SessionContext } from "../App";
import { ClientUser } from "../../server/src/user/User";
import { FlexLayout, Button, Input } from "../ui/ui";
import { GameState } from "../model/GameModel";
import { ClientQuestion, answer } from "../../server/src/game/Game";
import { Scene, SceneContext } from "./Scene";
import { SessionStateComponent as DebugSessionStateComponent, Users as DebugUsers, Game as DebugGame } from "./DEbugComponents";
import { getCube, useAddMeshRemove as useAddMesh, getCard, wrapText, getTextMesh } from "./Helpers";
import { MeshBasicMaterial, Vector3, Mesh } from "three";
import { Idle } from './Idle';
import { makeId } from '../utils/makeId';
import { useAnimation } from './useAnimation';
import { MeshText2D, textAlign } from 'three-text2d';
import { hashCode } from '../utils/hashCode';

export const SessionComponent = () => {
    return <FlexLayout style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <Scene>
            {/* <div><DebugSessionStateComponent /></div>
            <div><DebugUsers /></div>
            <div><DebugGame /></div> */}
            <SceneRender />
        </Scene>
    </FlexLayout >;
}

export const SceneRender = () => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);
    let [state, setState] = React.useState<'idle' | 'joining' | 'countdown' | 'game'>('idle');


    React.useEffect(() => {
        let sessionState = session.sesssionState;
        let users = session.users;

        let update = () => {
            if (sessionState.state === 'await' || sessionState.state === 'connecting') {
                setState(users.size === 0 ? 'idle' : 'joining')
            } else if (sessionState.state === 'countdown') {
                setState('countdown')
            } else if (sessionState.state === 'game') {
                setState('game');
            }
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
        {/* <Idle active={state === 'idle'} /> */}
        {/* <Button style={{ border: state === 'idle' ? '1px solid black' : '' }} onClick={toIdle}>Idle</Button>
        <Button style={{ border: state === 'joining' ? '1px solid black' : '' }} onClick={tojoining}>joining</Button> */}
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
            // animate
            scene.scene.remove(card);
        }
    }, []);

    let { to: cardAnimatTo } = useAnimation(card);

    React.useEffect(() => {
        if (props.question!!) {
            if (props.active) {
                console.log(props.qid, 'animate to active');

                // find position infront of cam
                let angle = THREE.Math.degToRad(90 - scene.cam.fov / 2);

                // todo - respect aspect
                let distance = (160) * Math.tan(angle);

                let mesh = new THREE.Mesh();
                scene.cam.add(mesh);
                mesh.translateZ(-distance);

                let targetPostion = new Vector3();
                mesh.getWorldPosition(targetPostion);

                let targetRotation = scene.cam.rotation.clone();
                targetRotation.z += THREE.Math.degToRad(-90);
                targetRotation.x += THREE.Math.degToRad(-180);
                let targetRotationVector = targetRotation.toVector3();

                cardAnimatTo({
                    position: targetPostion,
                    // position: new Vector3(0, 0, 250),
                    pcb: [.34, .24, .18, 1.06],
                    rotation: targetRotationVector,
                    // rotation: new Vector3(THREE.Math.degToRad(-90), 0, THREE.Math.degToRad(-90)),
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
                // text: 'Вопро́с — форма мысли, выраженная в основном языке предложением, которое произносят или пишут, когда хотят что-нибудь спросить, то есть получить интересующую информацию.',
                // text: 'Вопро́с — форма мысли.',
                text: props.question.text,
                fontSize: 60,
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


    let [cards, setCards] = React.useState<{ qid: string, category: string, question?: ClientQuestion, active: boolean }[]>([]);

    const pop = React.useCallback(() => {
        let res = [...cards];

        let last = res[res.length - 1];
        if (last) {
            if (last.active) {
                last.active = false;
            } else {
                res.pop();
                if (res[res.length - 1]) {
                    res[res.length - 1].question = { text: new Date().toLocaleTimeString(), _id: makeId(), category: new Date().getTime() + 'test' };
                }
            }
        }
        setCards(res);
    }, [cards]);

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

    React.useEffect(() => {
        reset();
    }, []);

    return <>
        {cards.map((c, i) => <GameCard key={c.qid} index={i} {...c} />)}
        <Button onClick={pop}>Pop</Button>
        <Button onClick={reset}>Reset</Button>
    </>

}
