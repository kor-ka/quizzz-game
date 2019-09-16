import * as THREE from 'three';
import * as React from "react";
import { SessionContext } from "../App";
import { ClientQuestion } from "../../server/src/game/Game";
import { SceneContext } from "./Scene";
import { getCard, getTextMesh } from "./Helpers";
import { Vector3, PerspectiveCamera, Mesh } from "three";
import { useAnimation } from './useAnimation';
import { hashCode } from '../utils/hashCode';
import { makeId } from '../utils/makeId';
import { camGameRotation, camGamePostion } from './SesssionComponent';

export const GameCard = React.memo((props: { qid: string, category: string, question?: ClientQuestion, active: boolean, index: number }) => {
    let session = React.useContext(SessionContext)!;
    let scene = React.useContext(SceneContext);

    let [card] = React.useState(getCard());
    let { to: cardAnimatTo } = useAnimation(card);
    React.useEffect(() => {

        // position above target place
        card.position.z = props.index * 6 + 700;
        card.rotation.z = THREE.Math.degToRad(-45);

        // shake stack
        let positionTremor = 10;
        let xTremor = hashCode(props.qid + 'x') % positionTremor - positionTremor / 2;
        card.position.x += xTremor;
        let yTremor = hashCode(props.qid + 'y') % positionTremor - positionTremor / 2;
        card.position.y += yTremor;

        let rotationTremor = THREE.Math.degToRad(5);
        let zTremor = hashCode(props.qid + 'z') % rotationTremor - rotationTremor / 2;
        card.rotation.z += zTremor;

        // drop to target position
        let targetPostion = card.position.clone();
        targetPostion.z -= 700;
        cardAnimatTo({ position: targetPostion, pcb: [.74, .08, .89, .78] }, 500)

        scene.scene.add(card);
        return () => {
            scene.scene.remove(card);
        }
    }, []);


    React.useEffect(() => {
        if (!props.active) {
            console.log(props.qid, 'animate to old');
            cardAnimatTo({ position: new Vector3(100, 0, 700), rotation: new Vector3(THREE.Math.degToRad(-90), 0, THREE.Math.degToRad(0)) }, 200);
        } else if (props.question) {
            // find position infront of cam
            let base = 310 + 20;
            let vertAngle = THREE.Math.degToRad(90 - scene.cam.fov / 2);
            let distanceV = base / 2 * Math.tan(vertAngle);

            let horisontalBase = (base * scene.cam.aspect) / 2;
            let horAngle = Math.atan(distanceV / horisontalBase);

            let distanveH = (440 + 20) / 2 * Math.tan(horAngle);

            let camMesh = new Mesh();
            camMesh.position.copy(camGamePostion);
            camMesh.rotation.setFromVector3(camGameRotation);
            camMesh.updateMatrixWorld();

            let mesh = new THREE.Mesh();
            camMesh.add(mesh);
            mesh.translateZ(-Math.max(distanceV, distanveH));

            if (session.isMobile) {
                let height = 2 * Math.max(distanceV, distanveH) * Math.tan(THREE.Math.degToRad(scene.cam.fov / 2));
                // mesh.position.y -= (height - 160) / 2;
                mesh.position.y += (height - 310) / 2 - 10;
            }

            let targetPostion = new Vector3();
            mesh.getWorldPosition(targetPostion);

            let targetRotation = camGameRotation.clone();
            targetRotation.z += THREE.Math.degToRad(-90);
            targetRotation.x += THREE.Math.degToRad(-180);

            let targetRotationVector = targetRotation;
            cardAnimatTo({
                position: targetPostion,
                pcb: [.34, .24, .18, 1.06],
                rotation: targetRotationVector,
                rcb: [.42, 0, .3, 1.01]
            }, 1000);
        }

    }, [props.question!!, props.active]);

    React.useEffect(() => {
        let text: THREE.Mesh;
        if (props.question && props.question.text) {
            let text = getTextMesh({
                w: 440, h: 310,
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

    return <div style={{ display: 'none' }} />;

});


export const GameRender = () => {
    let scene = React.useContext(SceneContext);
    let session = React.useContext(SessionContext);

    let [cards, setCards] = React.useState<{ qid: string, category: string, question?: ClientQuestion, active: boolean }[]>([]);

    React.useEffect(() => {
        scene.cam.rotation.x = THREE.Math.degToRad(45);
        session!.game.listen(gs => {
            setCards(gs.stack);
        });
    }, []);

    // const reset = React.useCallback(() => {
    //     let res = [];
    //     for (let i = 0; i < 10; i++) {
    //         res.push(
    //             {
    //                 qid: makeId(),
    //                 category: new Date().getTime() + 'test',
    //                 active: true,
    //                 // question: i === 9 ? { text: new Date().toLocaleTimeString(), _id: makeId(), category: new Date().getTime() + 'test' } : undefined,
    //             }
    //         );
    //     }
    //     setCards(res);
    // }, []);

    // React.useEffect(() => {
    //     reset();
    // }, []);

    return <>
        {cards.map((c, i) => <GameCard key={c.qid} index={i} {...c} />)}
    </>

}
