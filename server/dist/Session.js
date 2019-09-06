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
const mongodb_1 = require("mongodb");
const User_1 = require("./user/User");
const MDB_1 = require("./MDB");
exports.SESSIONS = () => MDB_1.MDB.collection('sessions');
exports.SESSION_USER = () => MDB_1.MDB.collection('sessionUsers');
exports.createSession = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.SESSIONS().insertOne({ state: 'await' });
});
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
            let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(this.id) });
            console.log('[SessionWatcher]', 'init', session);
            // subscribe for updates
            this.sessionWatcher = exports.SESSIONS().watch([{ $match: { 'fullDocument._id': new mongodb_1.ObjectId(this.id) } }], { fullDocument: 'updateLookup' });
            this.sessionWatcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                console.log('[SessionWatcher]', 'change', next);
                if (next.operationType === 'update') {
                    this.emitAll({ type: 'SessionStateChangedEvent', state: next.fullDocument.state, sessionId: this.id, ttl: next.fullDocument.stateTtl });
                }
            }));
            let sessionUsers = yield exports.SESSION_USER().find({ sid: this.id });
            sessionUsers.map(this.watchUser);
            // detect user list changes
            this.sessionUsersWatcher = exports.SESSION_USER().watch([{ $match: { 'fullDocument.sid': this.id } }], { fullDocument: 'updateLookup' });
            this.sessionUsersWatcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                let user = yield User_1.getUser(next.fullDocument.uid);
                if (user && (next.operationType === 'insert' || next.operationType === 'update')) {
                    let active = next.fullDocument.online && next.fullDocument.visible;
                    if (active) {
                        this.emitAll({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: User_1.toClient(user) });
                        this.watchUser(next.fullDocument);
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
            console.log('[SessionWatcher]', 'inited');
        });
        ////
        // User io
        ////
        this.handleMessage = (message) => __awaiter(this, void 0, void 0, function* () {
            if (message.type === 'SessionStartGameCountdown') {
                yield this.startCountdown();
            }
            else if (message.type === 'SessionStopGameCountdown') {
                yield this.stopCountDown();
            }
        });
        this.startCountdown = () => __awaiter(this, void 0, void 0, function* () {
            let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(this.id) });
            if (session && session.state === 'await') {
                yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(session._id) }, { $set: { state: 'countdown' } });
            }
        });
        this.stopCountDown = () => __awaiter(this, void 0, void 0, function* () {
            let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(this.id) });
            if (session && session.state === 'countdown') {
                yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(session._id) }, { $set: { state: 'await' } });
            }
        });
        this.addUserConnection = (connection) => __awaiter(this, void 0, void 0, function* () {
            // update user session state
            this.connections.add(connection);
            yield exports.SESSION_USER().updateOne({ uid: connection.user._id.toHexString(), sid: this.id }, { $set: { visible: !!connection.isMobile, online: true } }, { upsert: true });
            // notify user about current state
            let sessionUsers = yield exports.SESSION_USER().find({ sid: this.id, isMobile: true, online: true });
            let batch = [];
            for (let su of yield sessionUsers.toArray()) {
                let user = yield User_1.getUser(su.uid);
                if (user) {
                    batch.push({ type: 'SessionUserJoinedEvent', sessionId: this.id, user: User_1.toClient(user) });
                }
            }
            let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(this.id) });
            batch.push({ type: 'SessionStateChangedEvent', sessionId: this.id, state: session.state });
            // TODO: add game state
            connection.emit(batch);
        });
        this.removeUserConnection = (connection) => {
            this.connections.delete(connection);
            if (this.connections.size === 0) {
                this.dispose();
                sessionWatchers.delete(this.id);
            }
            exports.SESSION_USER().updateOne({ uid: connection.user._id.toHexString(), sid: this.id }, { $set: { online: false } });
        };
        ////
        // UTIL
        ////
        this.emitAll = (event) => {
            this.connections.forEach(c => {
                c.emit(event);
            });
        };
        this.watchUser = (user) => {
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
        };
        this.id = id;
    }
}
exports.SessionWatcher = SessionWatcher;
