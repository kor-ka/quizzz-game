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
const MDB_1 = require("../MDB");
const WorkQueue_1 = require("../workQueue/WorkQueue");
const Game_1 = require("../game/Game");
exports.SESSIONS = () => MDB_1.MDB.collection('sessions');
exports.SESSION_USER = () => MDB_1.MDB.collection('sessionUsers');
exports.createSession = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.SESSIONS().insertOne({ state: 'await' });
});
exports.handleMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.type === 'SessionStartGameCountdown') {
        yield startCountdown(message.id);
    }
    else if (message.type === 'SessionStopGameCountdown') {
        yield stopCountDown(message.id);
    }
    else if (message.type === 'SessionReset') {
        yield reset(message.id);
    }
});
let startCountdown = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(sessionId) });
    if (session && session.state === 'await') {
        let ttl = new Date().getTime() + 10000;
        let gid = yield Game_1.startGame(session._id, 10000);
        yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(session._id) }, { $set: { state: 'countdown', stateTtl: ttl, gameId: gid } });
        yield WorkQueue_1.WORK_QUEUE_SESSION().insertOne({ type: 'SessionChangeState', ttl, sid: new mongodb_1.ObjectId(sessionId), to: 'game', gid });
    }
});
let stopCountDown = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    let session = yield exports.SESSIONS().findOne({ _id: new mongodb_1.ObjectId(sessionId) });
    if (session && session.state === 'countdown') {
        yield WorkQueue_1.WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', to: 'game', sid: new mongodb_1.ObjectId(sessionId) });
        yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(session._id) }, { $set: { state: 'await', stateTtl: 0 } });
        if (session.gameId) {
            yield WorkQueue_1.WORK_QUEUE_GAME().deleteMany({ type: 'GameChangeState', gid: session.gameId });
        }
    }
});
let reset = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    yield WorkQueue_1.WORK_QUEUE_SESSION().deleteMany({ type: 'SessionChangeState', sid: new mongodb_1.ObjectId(sessionId) });
    yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(sessionId) }, { $set: { state: 'await', stateTtl: 0, gameId: null } });
});
exports.moveToState = (to) => __awaiter(void 0, void 0, void 0, function* () {
    if (to.to === 'game') {
        yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(to.sid) }, { $set: { state: to.to, stateTtl: 0, gameId: to.gid } });
    }
    else {
        yield exports.SESSIONS().updateOne({ _id: new mongodb_1.ObjectId(to.sid) }, { $set: { state: to.to, stateTtl: 0, gameId: to.gid } });
    }
});
