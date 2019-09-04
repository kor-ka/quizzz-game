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
import { getCube, useAddMeshRemove as useAddMesh, getCard } from "./Helpers";
import { MeshBasicMaterial } from "three";
import { Idle } from './Idle';
import { makeId } from '../utils/makeId';

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

export const GameCard = (props: { card: { qid: string, category: string, question?: ClientQuestion }, index: number }) => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);

    let [card] = React.useState(getCard());
    useAddMesh(scene, card);

    card.position.y = 500;
    card.position.z = props.index * 100;
    // card.rotation.z = rad(45);

    if (props.index === 0 && scene.cam) {
        // let oldRotation = scene.cam.rotation.clone();
        scene.cam.lookAt(card.position);
    }

    React.useEffect(() => {
        let interval = setInterval(() => {
            card.rotateZ(props.index % 2 === 0 ? 0.01 : -0.01);
        }, 20);
        return () => {
            clearInterval(interval);
        }
    }, []);

    return <div>
        {props.card.qid}
    </div>;

}

export const GameRender = () => {
    let session = React.useContext(SessionContext)!;

    let [cards, setCards] = React.useState<{ qid: string, category: string, question?: ClientQuestion }[]>([]);

    const pop = React.useCallback(() => {
        let res = [...cards];
        res.shift();
        if (res[0]) {
            res[0].question = { text: new Date().toLocaleTimeString(), _id: makeId(), category: new Date().getTime() + 'test' };
        }
        setCards(res);
    }, [cards]);

    const reset = React.useCallback(() => {
        let res = [];
        for (let i = 0; i < 2; i++) {
            res.push({ qid: makeId(), category: new Date().getTime() + 'test' })
        }
        setCards(res);
    }, []);

    const clear = React.useCallback(() => {
        setCards([]);
    }, []);


    React.useEffect(() => {
        reset();
    }, []);

    return <>
        {cards.map((c, i) => <GameCard key={c.qid} card={c} index={i} />)}
        <Button onClick={pop}>Pop</Button>
        <Button onClick={reset}>Reset</Button>
        <Button onClick={clear}>Clear</Button>
    </>

}
