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
import { getCube, useAddMeshRemove as useAddMesh } from "./Helpers";
import { MeshBasicMaterial } from "three";
import { Idle } from './Idle';

export const SessionComponent = () => {
    return <FlexLayout style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <Scene>
            <div><DebugSessionStateComponent /></div>
            <div><DebugUsers /></div>
            <div><DebugGame /></div>
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
        <Idle active={state === 'idle'} />
        <Button style={{ border: state === 'idle' ? '1px solid black' : '' }} onClick={toIdle}>Idle</Button>
        <Button style={{ border: state === 'joining' ? '1px solid black' : '' }} onClick={tojoining}>joining</Button>
    </>
}
