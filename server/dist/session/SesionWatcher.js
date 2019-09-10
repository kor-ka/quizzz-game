"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameWatcher_1 = require("../game/GameWatcher");
const mongodb_1 = require("mongodb");
const User_1 = require("../user/User");
const Session_1 = require("./Session");
let sessionWatchers = new Map();
exports.getSessionWatcher = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let res = sessionWatchers.get(id);
    if (!res) {
        res = new SessionWatcher(id);
        yield res.init();
        sessionWatchers.set(id, res);
    }
    return res;
});
class SessionWatcher {
    constructor(id) {
        this.connections = new Set();
        this.userWatchers = new Map();
        this.init = () => __awaiter(this, void 0, void 0, function* () {
            this.gameWatcher = yield GameWatcher_1.getGameWatcher(this);
            // subscribe for updates
            this.sessionWatcher = Session_1.SESSIONS().watch([{ $match: { 'fullDocument._id': new mongodb_1.ObjectId(this.id) } }], { fullDocument: 'updateLookup' });
            console.log('subscribe');
            this.sessionWatcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                if (next.operationType === 'update' || next.operationType === 'insert') {
                    this.emitAll({ type: 'SessionStateChangedEvent', state: next.fullDocument.state, sessionId: this.id, ttl: next.fullDocument.stateTtl, gid: next.fullDocument.gameId && next.fullDocument.gameId.toHexString() });
                }
            }));
            // detect user list changes
            this.sessionUsersWatcher = Session_1.SESSION_USER().watch([{ $match: { 'fullDocument.sid': this.id } }], { fullDocument: 'updateLookup' });
            this.sessionUsersWatcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                let user = yield User_1.getUser(next.fullDocument.uid);
                if (user && (next.operationType === 'insert' || next.operationType === 'update')) {
                    //let active = next.fullDocument.online && next.fullDocument.visible;
                    let active = true;
                    if (active) {
                        this.watchUser(next.fullDocument);
                        this.emitAll({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: User_1.toClient(user) });
                    }
                    else {
                        this.emitAll({ type: 'SessionUserLeftEvent', sessionId: this.id, user: User_1.toClient(user) });
                        let w = this.userWatchers.get(next.fullDocument._id.toHexString());
                        if (w) {
                            yield w.close();
                            this.userWatchers.delete(next.fullDocument._id.toHexString());
                        }
                    }
                }
            }));
            let sessionUsers = yield Session_1.SESSION_USER().find({ sid: this.id, visible: true, online: true }).toArray();
            for (let su of yield sessionUsers) {
                this.watchUser(su);
            }
            console.log('[SessionWatcher]', 'inited');
        });
        this.addUserConnection = (connection) => __awaiter(this, void 0, void 0, function* () {
            // update user session state
            this.connections.add(connection);
            yield Session_1.SESSION_USER().updateOne({ uid: connection.user._id.toHexString(), sid: this.id }, { $set: { visible: !!connection.isMobile, online: true, connectionId: connection.id } }, { upsert: true });
            // notify user about current state
            // users
            let sessionUsers = yield Session_1.SESSION_USER().find({ sid: this.id, visible: true, online: true }).toArray();
            let batch = [];
            for (let su of yield sessionUsers) {
                let user = yield User_1.getUser(su.uid);
                if (user) {
                    batch.push({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: User_1.toClient(user) });
                }
            }
            // session
            let session = yield Session_1.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(this.id) });
            batch.push({ type: 'SessionStateChangedEvent', sessionId: this.id, state: session.state, ttl: session.stateTtl, gid: session.gameId && session.gameId.toHexString() });
            if (session.gameId) {
                batch.push(...yield this.gameWatcher.getFullState(session.gameId));
            }
            connection.emit(batch);
        });
        this.removeUserConnection = (connection) => __awaiter(this, void 0, void 0, function* () {
            this.connections.delete(connection);
            if (this.connections.size === 0) {
                this.dispose();
                sessionWatchers.delete(this.id);
            }
            yield Session_1.SESSION_USER().updateOne({ uid: connection.user._id.toHexString(), sid: this.id, connectionId: connection.id }, { $set: { online: false } });
        });
        ////
        // UTIL
        ////
        this.emitAll = (event) => {
            this.connections.forEach(c => {
                c.emit(event);
            });
        };
        this.watchUser = (user) => {
            if (this.userWatchers.get(user._id.toHexString())) {
                return;
            }
            let watcher = User_1.USERS().watch([{ $match: { 'fullDocument._id': new mongodb_1.ObjectId(user.uid) } }], { fullDocument: 'updateLookup' });
            this.userWatchers.set(user._id.toHexString(), watcher);
            watcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                if (next.operationType === 'update') {
                    this.emitAll({ type: 'UserUpdatedEvent', user: User_1.toClient(next.fullDocument) });
                }
            }));
        };
        this.dispose = () => {
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
        };
        this.id = id;
    }
}
exports.SessionWatcher = SessionWatcher;
