import * as THREE from 'three';
import * as React from "react";
import { SessionContext } from "../App";
import { Scene, SceneContext } from "./Scene";
import { SessionStateComponent, Game as GameControls } from "./Controls";
import { GameRender } from './GameRender';
import { JoiningRender } from './JoiningRender';
import { useAnimation, IN_OUT } from './useAnimation';
import { Vector3 } from 'three';
import { Idle } from './Idle';

export const camGamePostion = new Vector3();
export const camGameRotation = new Vector3();

camGamePostion.z = -1500
camGamePostion.y = -500;
camGameRotation.x = THREE.Math.degToRad(45);

export const camAwaitPostion = new Vector3();
export const camAwaitRotation = new Vector3();

camAwaitPostion.z = 900;
camAwaitPostion.y = 0;
camAwaitRotation.x = 0;

export const camIdlePostion = new Vector3();
export const camIdleRotation = new Vector3();
camIdlePostion.z = 5600;


export const SessionComponent = () => {
    return <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }} >
        <Scene>
            <SceneRender />
        </Scene>
    </div >
        ;
}

export const SceneRender = () => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);
    let [state, setState] = React.useState<'idle' | 'joining' | 'countdown' | 'game'>('idle');

    let { to: camAnimatTo } = useAnimation(scene.cam);

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
        scene.cam.rotation.setFromVector3(camIdleRotation);
        return () => {
            sub1();
            sub2();
        }
    }, []);

    React.useEffect(() => {
        if (state === 'game' || state === 'countdown') {
            camAnimatTo({ position: camGamePostion, rotation: camGameRotation, pcb: IN_OUT, rcb: IN_OUT }, 1000);
        } else if (state === 'joining') {
            camAnimatTo({ position: camIdlePostion, rotation: camIdleRotation, pcb: IN_OUT, rcb: IN_OUT }, 1000);
        } else if (state === 'idle') {
            camAnimatTo({ position: camIdlePostion, rotation: camIdleRotation, pcb: IN_OUT, rcb: IN_OUT }, 1000);
        }
    }, [state]);

    const toIdle = React.useCallback(() => { setState('idle') }, []);
    const tojoining = React.useCallback(() => { setState('joining') }, []);

    return <>
        {session!.isMobile && (state === 'joining' || state === 'countdown') && <SessionStateComponent />}
        {state === 'game' && <GameControls />}
        <Idle active={state === 'idle'} />
        <GameRender />
        <JoiningRender />
    </>
}