import { UserConnection } from "../user/UserConnection";
import { GameWatcher } from "../Game";
import { ChangeStream, ObjectId } from "mongodb";
import { MDBChangeOp } from "../utils/MDBChangeOp";
import { USERS, User, getUser, toClient } from "../user/User";
import { Event } from "../entity/events";
import { Message } from "../entity/messages";
import { MDB } from "../MDB";

export type SessionState = 'await' | 'countdown' | 'game' | 'score'
export let SESSIONS = () => MDB.collection<Session>('sessions');
export let SESSION_USER = () => MDB.collection<SessionUser>('sessionUsers');
export interface Session {
    _id: ObjectId;
    state: SessionState;
    stateTtl?: number;
    gameId?: string;
}

export interface SessionUser {
    _id: ObjectId;
    sid: string;
    uid: string;
    online: boolean;
    visible: boolean;
    topScore?: number;
}

export let createSession = async () => {
    return await SESSIONS().insertOne({ state: 'await' });
}
export let handleMessage = async (message: Message) => {
    if (message.type === 'SessionStartGameCountdown') {
        await startCountdown(message.id)
    } else if (message.type === 'SessionStopGameCountdown') {
        await stopCountDown(message.id);
    }
}

let startCountdown = async (sessionId: string) => {
    let session = await SESSIONS().findOne({ _id: new ObjectId(sessionId) });
    if (session && session.state === 'await') {
        await SESSIONS().updateOne({ _id: new ObjectId(session._id) }, { $set: { state: 'countdown' } });
    }

}

let stopCountDown = async (sessionId: string) => {
    let session = await SESSIONS().findOne({ _id: new ObjectId(sessionId) });
    if (session && session.state === 'countdown') {
        await SESSIONS().updateOne({ _id: new ObjectId(session._id) }, { $set: { state: 'await' } });
    }
}


