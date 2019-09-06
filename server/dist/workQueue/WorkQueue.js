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
const MDB_1 = require("../MDB");
const Session_1 = require("../session/Session");
const Game_1 = require("../game/Game");
exports.WORK_QUEUE_SESSION = () => MDB_1.MDB.collection('work_queue');
exports.WORK_QUEUE_GAME = () => MDB_1.MDB.collection('work_queue');
let WORK_QUEUE = () => MDB_1.MDB.collection('work_queue');
const performWork = (work) => __awaiter(void 0, void 0, void 0, function* () {
    if (work.type === 'SessionChangeState') {
        yield Session_1.moveToState(work);
    }
    else if (work.type === 'GameChangeState') {
        yield Game_1.moveToState(work);
    }
});
let started = false;
exports.startWorker = () => {
    if (started) {
        return;
    }
    started = true;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        // what if node shut down after lock but before complete?
        let work = yield WORK_QUEUE().findOneAndUpdate({ ttl: { $lte: new Date().getTime() }, lock: { $ne: true } }, { $set: { lock: true } });
        if (work.ok === 1 && work.value) {
            try {
                yield performWork(work.value);
            }
            catch (_a) {
                yield WORK_QUEUE().updateOne({ _id: work.value._id }, { $set: { lock: false } });
            }
        }
    }), 500);
};
