import { UserConnection } from "../user/UserConnection";
import { GameWatcher, getGameWatcher } from "../game/GameWatcher";
import { ChangeStream, ObjectId } from "mongodb";
import { MDBChangeOp } from "../utils/MDBChangeOp";
import { USERS, User, getUser, toClient } from "../user/User";
import { Event } from "../entity/events";
import { SESSIONS, SESSION_USER, Session, SessionUser } from "./Session";

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
        if (session.gameId) {
            this.gameWatcher = await getGameWatcher(session.gameId, this);
        }

        // subscribe for updates
        this.sessionWatcher = SESSIONS().watch([{ $match: { 'fullDocument._id': new ObjectId(this.id) } }], { fullDocument: 'updateLookup' });
        this.sessionWatcher.on('change', async (next: MDBChangeOp<Session>) => {
            if (next.operationType === 'update' || next.operationType === 'insert') {
                this.emitAll({ type: 'SessionStateChangedEvent', state: next.fullDocument.state, sessionId: this.id, ttl: next.fullDocument.stateTtl, gid: session.gameId && session.gameId.toHexString() });

                if (this.gameWatcher && (!next.fullDocument.gameId || !this.gameWatcher.id.equals(next.fullDocument.gameId))) {
                    this.gameWatcher.dispose();
                }
                if (next.fullDocument.gameId && (!this.gameWatcher || !this.gameWatcher.id.equals(next.fullDocument.gameId))) {
                    this.gameWatcher = await getGameWatcher(next.fullDocument.gameId, this);
                }
            }
        });


        let sessionUsers = await SESSION_USER().find({ sid: this.id });
        sessionUsers.map(this.watchUser);

        // detect user list changes
        this.sessionUsersWatcher = SESSION_USER().watch([{ $match: { 'fullDocument.sid': this.id } }], { fullDocument: 'updateLookup' });
        this.sessionUsersWatcher.on('change', async (next: MDBChangeOp<SessionUser>) => {
            let user = await getUser(next.fullDocument.uid);
            if (user && (next.operationType === 'insert' || next.operationType === 'update')) {
                let active = next.fullDocument.online && next.fullDocument.visible;
                if (active) {
                    this.emitAll({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
                    this.watchUser(next.fullDocument);
                } else {
                    this.emitAll({ type: 'SessionUserLeftEvent', sessionId: this.id, user: toClient(user) });
                    let w = this.userWatchers.get(next.fullDocument._id.toHexString());
                    if (w) {
                        await w.close();
                        this.userWatchers.delete(next.fullDocument._id.toHexString());
                    }
                }
            }
        });

        console.log('[SessionWatcher]', 'inited');
    }

    addUserConnection = async (connection: UserConnection) => {
        // update user session state
        this.connections.add(connection);
        await SESSION_USER().updateOne({ uid: connection.user!._id.toHexString(), sid: this.id }, { $set: { visible: !!connection.isMobile, online: true, connectionId: connection.id } }, { upsert: true });

        // notify user about current state
        // users
        let sessionUsers = await SESSION_USER().find({ sid: this.id, isMobile: true, online: true });

        let batch: Event[] = [];
        for (let su of await sessionUsers.toArray()) {
            let user = await getUser(su.uid);
            if (user) {
                batch.push({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
            }
        }

        // session
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });
        batch.push({ type: 'SessionStateChangedEvent', sessionId: this.id, state: session!.state, ttl: session!.stateTtl, gid: session.gameId && session.gameId.toHexString() })

        if (this.gameWatcher) {
            batch.push(...await this.gameWatcher.getFullState())
        }
        connection.emit(batch);

    }

    removeUserConnection = (connection: UserConnection) => {
        this.connections.delete(connection);
        if (this.connections.size === 0) {
            this.dispose();
            sessionWatchers.delete(this.id);
        }
        SESSION_USER().updateOne({ uid: connection.user!._id.toHexString(), sid: this.id, connectionId: connection.id }, { $set: { online: false } });
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
        if (this.userWatchers.get(user._id.toHexString())) {
            return
        }
        let watcher = USERS().watch([{ $match: { 'fullDocument._id': new ObjectId(user.uid) } }], { fullDocument: 'updateLookup' });
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

        if (this.gameWatcher) {
            this.gameWatcher.dispose();
        }
    }
}
