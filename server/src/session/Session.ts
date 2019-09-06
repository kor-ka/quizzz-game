import { ObjectId } from "mongodb";
import { Message } from "../entity/messages";
import { MDB } from "../MDB";
import { SessionChangeState, WORK_QUEUE_SESSION } from "../workQueue/WorkQueue";
import { startGame } from "../game/Game";

export type SessionState = 'await' | 'countdown' | 'game'
export let SESSIONS = () => MDB.collection<Session>('sessions');
export let SESSION_USER = () => MDB.collection<SessionUser>('sessionUsers');
export interface Session {
    _id: ObjectId;
    state: SessionState;
    stateTtl?: number;
    gameId?: ObjectId;
}

export interface SessionUser {
    _id: ObjectId;
    sid: string;
    uid: string;
    online: boolean;
    connectionId: string;
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
    } else if (message.type === 'SessionReset') {
        await reset(message.id);
    }
}

let startCountdown = async (sessionId: string) => {
    let session = await SESSIONS().findOne({ _id: new ObjectId(sessionId) });
    if (session && session.state === 'await') {
        let ttl = new Date().getTime() + 10000;
        let gid = await startGame(session._id, 10000);
        await SESSIONS().updateOne({ _id: new ObjectId(session._id) }, { $set: { state: 'countdown', stateTtl: ttl, gameId: gid } });
        await WORK_QUEUE_SESSION().insertOne({ type: 'SessionChangeState', ttl, sid: new ObjectId(sessionId), to: 'game', gid });
    }

}

let stopCountDown = async (sessionId: string) => {
    let session = await SESSIONS().findOne({ _id: new ObjectId(sessionId) });
    if (session && session.state === 'countdown') {
        await WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', to: 'game', sid: new ObjectId(sessionId) })
        await SESSIONS().updateOne({ _id: new ObjectId(session._id) }, { $set: { state: 'await', stateTtl: 0 } });
    }
}

let reset = async (sessionId: string) => {
    await WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', sid: new ObjectId(sessionId) })
    await SESSIONS().updateOne({ _id: new ObjectId(sessionId) }, { $set: { state: 'await', stateTtl: 0, gameId: null } });
}

export let moveToState = async (to: SessionChangeState) => {
    if (to.to === 'game') {
        await SESSIONS().updateOne({ _id: new ObjectId(to.sid) }, { $set: { state: to.to, stateTtl: 0, gameId: to.gid } });
    } else {
        await SESSIONS().updateOne({ _id: new ObjectId(to.sid) }, { $set: { state: to.to, stateTtl: 0, gameId: to.gid } });

    }
}


