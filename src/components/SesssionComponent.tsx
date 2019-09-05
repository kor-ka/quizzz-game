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
    let [text, setText] = React.useState<Mesh>();
    React.useEffect(() => {


        card.position.z = props.index * 11;
        card.rotation.z = THREE.Math.degToRad(-45);
        let text = getTextMesh({
            width: 440, height: 310,
            // text: 'Вопро́с — форма мысли, выраженная в основном языке предложением, которое произносят или пишут, когда хотят что-нибудь спросить, то есть получить интересующую информацию.',
            text: 'Вопро́с — форма мысли.',
            fontSize: 60,
            padding: 40
        });
        card.add(text);

        text.rotation.x = THREE.Math.degToRad(180);
        text.rotation.z = THREE.Math.degToRad(-90);
        text.position.z = -10;


        scene.scene.add(card);
        return () => {
            // animate
            setTimeout(() => {
                scene.scene.remove(card);
            }, 2000);
        }
    }, []);

    let { to: cardAnimatTo } = useAnimation(card);

    React.useEffect(() => {
        if (props.question!!) {
            // card.position.fromArray(new Vector3(0, 0, 50).toArray());
            // card.rotation.fromArray(new Vector3(THREE.Math.degToRad(90), 0, THREE.Math.degToRad(90)).toArray());
            if (props.active) {
                console.log(props.qid, 'animate to active');
                cardAnimatTo({
                    position: new Vector3(0, 0, 250),
                    pcb: [.34, .24, .18, 1.06],
                    rotation: new Vector3(THREE.Math.degToRad(-90), 0, THREE.Math.degToRad(-90)),
                    rcb: [.42, 0, .3, 1.01]
                }, 1000);
            } else {
                console.log(props.qid, 'animate to old');
                cardAnimatTo({ position: new Vector3(100, 0, 700), rotation: new Vector3(THREE.Math.degToRad(-90), 0, THREE.Math.degToRad(0)) }, 200);
            }

        }
    }, [props.question!!, props.active]);

    React.useEffect(() => {
        // if (props.question && props.question.text) {
        //     let text = new MeshText2D("RIGHT", { align: textAlign.right, font: '30px Arial', fillStyle: '#000000', antialias: true }).mesh;
        //     setText(text);
        //     scene.scene.add(text);
        //     text.translateX(10);

        // } else if (text) {
        //     card.remove(text);
        //     setText(undefined);
        // }

        // return () => {
        //     if (text) {
        //         card.remove(text);
        //         setText(undefined);
        //     }
        // }
    }, [props.question && props.question.text]);

    return <div>
        {/* {JSON.stringify(props)} */}
        {/* <canvas ref={canvasRef} width={440 * window.devicePixelRatio} height={310 * window.devicePixelRatio} style={{ position: 'absolute', right: -500 }} /> */}
    </div>;

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
        for (let i = 0; i < 3; i++) {
            res.push(
                {
                    qid: makeId(),
                    category: new Date().getTime() + 'test',
                    active: true,
                    question: i === 2 ? { text: new Date().toLocaleTimeString(), _id: makeId(), category: new Date().getTime() + 'test' } : undefined,
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
