import { UserConnection } from "./user/UserConnection";
import { GameWatcher } from "./Game";
import { ChangeStream, ObjectId } from "mongodb";
import { MDBChangeOp } from "./utils/MDBChangeOp";
import { USERS, User, getUser, toClient } from "./user/User";
import { Event } from "./entity/events";
import { Message } from "./entity/messages";
import { MDB } from "./MDB";

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
    topScore?: number;
}

export let createSession = async () => {
    return await SESSIONS().insertOne({ state: 'await' });
}

let sessionWatchers = new Map<string, SessionWatcher>();

export let getSessionWatcher = async (id: string) => {
    let res = sessionWatchers.get(id);
    if (!res) {
        res = new SessionWatcher(id);
        await res.init();
        sessionWatchers.set(id, res);
    }
    return res;
}



export class SessionWatcher {
    sessionWatcher?: ChangeStream;
    gameWatcher?: GameWatcher;
    connections = new Set<UserConnection>();
    id: string;
    sessionUsersWatcher?: ChangeStream;
    userWatchers = new Map<string, ChangeStream>();

    constructor(id: string) {
        this.id = id;
    }


    init = async () => {
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });

        // subscribe for updates
        this.sessionWatcher = SESSIONS().watch([{ $match: { _id: this.id } }], { fullDocument: 'updateLookup' });
        this.sessionWatcher.on('change', async (next: MDBChangeOp<Session>) => {
            if (next.operationType === 'update') {
                this.emitAll({ type: 'SessionStateChangedEvent', state: next.fullDocument.state, sessionId: this.id, ttl: next.fullDocument.stateTtl });
            }
        });


        let sessionUsers = await SESSION_USER().find({ sid: this.id });
        sessionUsers.map(this.watchUser);


        // detect user list changes
        this.sessionUsersWatcher = SESSION_USER().watch([{ $match: { sid: this.id } }], { fullDocument: 'updateLookup' });
        this.sessionUsersWatcher.on('change', async (next: MDBChangeOp<SessionUser>) => {
            let user = await getUser(next.fullDocument.uid);
            if (next.operationType === 'insert') {
                if (user) {
                    this.emitAll({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
                }
                this.watchUser(next.fullDocument);
            } else if (next.operationType === 'delete') {
                if (user) {
                    this.emitAll({ type: 'SessionUserLeftEvent', sessionId: this.id, user: toClient(user) });
                }
                let w = this.userWatchers.get(next.fullDocument._id.toHexString());
                if (w) {
                    await w.close();
                    this.userWatchers.delete(next.fullDocument._id.toHexString());
                }
            }
        });

    }

    ////
    // User io
    ////

    handleMessage = async (message: Message) => {
        if (message.type === 'SessionStartGameCountdown') {
            await this.startCountdown()
        } else if (message.type === 'SessionStopGameCountdown') {
            await this.stopCountDown();
        }
    }

    startCountdown = async () => {
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });
        if (session && session.state === 'await') {
            await SESSIONS().updateOne({ _id: session._id }, { $set: { state: 'countdown' } });
        }

    }

    stopCountDown = async () => {
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });
        if (session && session.state === 'countdown') {
            await SESSIONS().updateOne({ _id: session._id }, { $set: { state: 'await' } });
        }
    }


    addUserConnection = async (connection: UserConnection) => {
        // update user session state
        this.connections.add(connection);
        if (connection.isMobile) {
            await SESSION_USER().updateOne({ uid: connection.user!._id.toHexString(), sid: this.id }, { $set: { isMobile: !!connection.isMobile } }, { upsert: true });
        } else {
            await SESSION_USER().deleteOne({ uid: connection.user!._id.toHexString(), sid: this.id });
        }

        // notify user about current state
        let sessionUsers = await SESSION_USER().find({ sid: this.id, isMobile: true });

        let batch: Event[] = [];
        sessionUsers.map(async su => {
            let user = await getUser(su.uid);
            if (user) {
                batch.push({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
            }
        });

        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });
        batch.push({ type: 'SessionStateChangedEvent', sessionId: this.id, state: session!.state })

        // TODO: add game state

        connection.emit(batch);

    }

    removeUserConnection = (connection: UserConnection) => {
        this.connections.delete(connection);
        if (this.connections.size === 0) {
            this.dispose();
            sessionWatchers.delete(this.id);
        }
        SESSION_USER().deleteOne({ uid: connection.user!._id.toHexString() });
    }

    ////
    // UTIL
    ////
    emitAll = (event: Event | Event[]) => {
        this.connections.forEach(c => {
            c.emit(event);
        });
    }

    watchUser = (user: SessionUser) => {
        let watcher = USERS().watch([{ $match: { _id: user._id } }], { fullDocument: 'updateLookup' });
        this.userWatchers.set(user._id.toHexString(), watcher);

        watcher.on('change', async (next: MDBChangeOp<User>) => {
            if (next.operationType === 'update') {
                this.emitAll({ type: 'UserUpdatedEvent', user: toClient(next.fullDocument) });
            }
        });
    }


    dispose = () => {
        if (this.sessionWatcher) {
            this.sessionWatcher.close();
        }
        if (this.sessionUsersWatcher) {
            this.sessionUsersWatcher.close();
        }
        this.userWatchers.forEach(w => w.close());
    }
}
