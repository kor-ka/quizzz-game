import * as THREE from 'three';
import * as React from "react";
import { SessionContext } from '../App';
import { SceneContext } from './Scene';
import { getCard, getTextMesh } from './Helpers';
import { useAnimation } from './useAnimation';
import { ClientUserIndexed } from '../model/SessionModel';
import { spiralCoord } from '../utils/spiralCoord';
import { camIdlePostion } from './SesssionComponent';


const UserCards = (props: { user: ClientUserIndexed }) => {
    let scene = React.useContext(SceneContext);

    let [card] = React.useState(getCard());
    let { to: cardAnimatTo } = useAnimation(card);

    React.useEffect(() => {

        card.rotation.y = THREE.Math.degToRad(180);

        card.position.z = camIdlePostion.z - 300;

        let coords = spiralCoord(props.user.index + 2);

        // position above target place
        card.rotation.z = THREE.Math.degToRad(45);
        card.translateX(coords[0] * (310 + 30));
        card.translateY(coords[1] * (440 + 30));

        // drop to target position
        let targetPostion = card.position.clone();
        targetPostion.z -= 1200;
        cardAnimatTo({ position: targetPostion, pcb: [.74, .08, .89, .78] }, 500)

        scene.scene.add(card);
        return () => {
            scene.scene.remove(card);
        }
    }, []);

    React.useEffect(() => {
        let text = getTextMesh({
            w: 440, h: 310,
            text: props.user.name || '???',
            fontSize: 40,
            padding: 40,
            background: true,
            color: 'white',
        });
        card.add(text);

        text.rotation.x = THREE.Math.degToRad(180);
        text.rotation.z = THREE.Math.degToRad(-90);
        text.position.z = -2;
        return () => {
            card.remove(text);

        }
    }, [props.user.name])

    return <><div style={{ display: 'none' }} /></>
}

export const JoiningRender = () => {
    let session = React.useContext(SessionContext)!;
    let [users, setUsers] = React.useState<Map<string, ClientUserIndexed>>(new Map());
    React.useEffect(() => {
        session!.subscribeUsers(u => {
            setUsers(u);
            // let map = new Map<string, ClientUserIndexed>();
            // for (let i = 0; i < 2; i++) {
            //     map.set(i + '', { index: i, _id: i + '', name: i + '' });
            // }
            // setUsers(map);
        });
    }, []);

    return <>{Array.from(users.values()).map(u => <UserCards user={u} />)}</>
}