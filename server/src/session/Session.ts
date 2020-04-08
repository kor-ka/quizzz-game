import { ObjectId, ClientSession } from "mongodb";
import { Message } from "../entity/messages";
import { MDB } from "../MDB";
import { SessionChangeState, WORK_QUEUE_SESSION, WORK_QUEUE_GAME } from "../workQueue/WorkQueue";
import { startGame } from "../game/Game";

export type SessionState = 'await' | 'countdown' | 'game'
export let SESSIONS = () => MDB.collection<Session>('sessions');
export let SESSION_USER = () => MDB.collection<SessionUser>('sessionUsers');
export interface Session {
    _id: ObjectId;
    state: SessionState;
    stateTtl?: number;
    gameId?: ObjectId;
    alias?: string;
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

export let createSession = async (alias?: string) => {
    return await SESSIONS().insertOne({ state: 'await', alias });
}
export let handleMessage = async (message: Message, ctx: ClientSession) => {
    if (message.type === 'SessionStartGameCountdown') {
        await startCountdown(message.id, ctx)
    } else if (message.type === 'SessionStopGameCountdown') {
        await stopCountDown(message.id, ctx);
    } else if (message.type === 'SessionReset') {
        await reset(message.id);
    }
}

let startCountdown = async (sessionId: string, ctx: ClientSession) => {
    let session = await SESSIONS().findOne({ _id: new ObjectId(sessionId) });
    if (session && session.state === 'await') {
        let ttl = new Date().getTime() + 10000;
        await SESSIONS().updateOne({ _id: new ObjectId(session._id) }, { $set: { state: 'countdown', stateTtl: ttl } }, { session: ctx });
        await startGame(session._id, 10000, ctx);
    }
}

let stopCountDown = async (sessionId: string, ctx: ClientSession) => {
    await WORK_QUEUE_GAME().deleteMany({ type: 'GameChangeState', sid: new ObjectId(sessionId) }, { session: ctx });
    await WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', sid: new ObjectId(sessionId) }, { session: ctx });
    await SESSIONS().updateOne({ _id: new ObjectId(sessionId) }, { $set: { state: 'await', stateTtl: 0, gameId: null } }, { session: ctx });
}

let reset = async (sessionId: string) => {
    await WORK_QUEUE_GAME().deleteMany({ type: 'GameChangeState', sid: new ObjectId(sessionId) });
    await WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', sid: new ObjectId(sessionId) });
    await SESSIONS().updateOne({ _id: new ObjectId(sessionId) }, { $set: { state: 'await', stateTtl: 0, gameId: null } });
}

export let moveToState = async (to: SessionChangeState) => {
    await SESSIONS().updateOne({ _id: new ObjectId(to.sid) }, { $set: { state: to.to, stateTtl: 0, gameId: to.gid } });
}

export let onGameStarted = async (sid: ObjectId, gid: ObjectId) => {
    await SESSIONS().update({ _id: sid, state: 'countdown' }, { $set: { state: 'game', gameId: gid } });
}


