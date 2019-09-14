import { UserConnection } from "../user/UserConnection";
import { GameWatcher, getGameWatcher } from "../game/GameWatcher";
import { ChangeStream, ObjectId } from "mongodb";
import { MDBChangeOp } from "../utils/MDBChangeOp";
import { USERS, User, getUser, toClient } from "../user/User";
import { Event } from "../entity/events";
import { SESSIONS, SESSION_USER, Session, SessionUser } from "./Session";
import { watchUser } from "../user/UserWatcher";

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
    gameWatcher: GameWatcher;
    connections = new Set<UserConnection>();
    id: string;
    sessionUsersWatcher?: ChangeStream;
    userWatchers = new Map<string, () => void>();

    constructor(id: string) {
        this.id = id;
    }


    init = async () => {
        this.gameWatcher = await getGameWatcher(this);

        // subscribe for updates
        this.sessionWatcher = SESSIONS().watch([{ $match: { 'fullDocument._id': new ObjectId(this.id) } }], { fullDocument: 'updateLookup' });
        console.log('subscribe')
        this.sessionWatcher.on('change', async (next: MDBChangeOp<Session>) => {
            if (next.operationType === 'update' || next.operationType === 'insert') {
                this.emitAll({ type: 'SessionStateChangedEvent', state: next.fullDocument.state, sessionId: this.id, ttl: next.fullDocument.stateTtl, gid: next.fullDocument.gameId && next.fullDocument.gameId.toHexString() });
            }
        });

        // detect user list changes
        this.sessionUsersWatcher = SESSION_USER().watch([{ $match: { 'fullDocument.sid': this.id } }], { fullDocument: 'updateLookup' });
        this.sessionUsersWatcher.on('change', async (next: MDBChangeOp<SessionUser>) => {
            let user = await getUser(next.fullDocument.uid);
            if (user && (next.operationType === 'insert' || next.operationType === 'update')) {
                let active = next.fullDocument.online && next.fullDocument.visible;
                if (active) {
                    this.watchUser(next.fullDocument);
                    this.emitAll({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
                } else {
                    this.emitAll({ type: 'SessionUserLeftEvent', sessionId: this.id, user: toClient(user) });
                    let w = this.userWatchers.get(next.fullDocument._id.toHexString());
                    if (w) {
                        w();
                        this.userWatchers.delete(next.fullDocument._id.toHexString());
                    }
                }
            }
        });

        let sessionUsers = await SESSION_USER().find({ sid: this.id, visible: true, online: true }).toArray();

        for (let su of await sessionUsers) {
            this.watchUser(su);
        }

        console.log('[SessionWatcher]', 'inited');
    }

    addUserConnection = async (connection: UserConnection) => {
        // update user session state
        this.connections.add(connection);
        await SESSION_USER().updateOne({ uid: connection.user!._id.toHexString(), sid: this.id }, { $set: { visible: !!connection.isMobile, online: true, connectionId: connection.id } }, { upsert: true });

        // notify user about current state
        // users
        let sessionUsers = await SESSION_USER().find({ sid: this.id, visible: true, online: true }).toArray();

        let batch: Event[] = [];
        for (let su of await sessionUsers) {
            let user = await getUser(su.uid);
            if (su.online && su.visible && user) {
                batch.push({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: toClient(user) });
            }
        }

        // session
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.id) });
        batch.push({ type: 'SessionStateChangedEvent', sessionId: this.id, state: session!.state, ttl: session!.stateTtl, gid: session.gameId && session.gameId.toHexString() })

        if (session.gameId) {
            batch.push(...await this.gameWatcher.getFullState(session.gameId));
        }

        connection.emit(batch);

    }

    removeUserConnection = async (connection: UserConnection) => {
        this.connections.delete(connection);
        if (this.connections.size === 0) {
            this.dispose();
            sessionWatchers.delete(this.id);
        }
        await SESSION_USER().updateOne({ uid: connection.user!._id.toHexString(), sid: this.id, connectionId: connection.id }, { $set: { online: false } });
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
        let userWatcher = watchUser(user.uid, next => {
            this.emitAll({ type: 'UserUpdatedEvent', user: toClient(next) });
        });
        this.userWatchers.set(user.uid, userWatcher);
    };


    dispose = () => {
        if (this.sessionWatcher) {
            this.sessionWatcher.close();
        }
        if (this.sessionUsersWatcher) {
            this.sessionUsersWatcher.close();
        }
        this.userWatchers.forEach(w => w());

        if (this.gameWatcher) {
            this.gameWatcher.dispose();
        }
    }
}
