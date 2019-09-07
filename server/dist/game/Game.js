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
const bson_1 = require("bson");
const MDB_1 = require("../MDB");
const WorkQueue_1 = require("../workQueue/WorkQueue");
const Session_1 = require("../session/Session");
exports.toClientQuestion = (question) => {
    return {
        _id: question._id.toHexString(),
        category: question.category,
        text: question.text,
        textAnswers: question.textAnswers,
        open: question.open !== 'false' ? question.open : undefined
    };
};
exports.GAME = () => MDB_1.MDB.collection('games');
exports.QUESTION = () => MDB_1.MDB.collection('questions');
exports.GAME_QUESTION = () => MDB_1.MDB.collection('game_questions');
exports.GAME_USER_ANSWER = () => MDB_1.MDB.collection('game_user_answer');
exports.GAME_USER_SCORE = () => MDB_1.MDB.collection('game_user_score');
exports.startGame = (sid, after) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: filter user known questions
    let questions = yield exports.QUESTION().aggregate([{ $sample: { size: 10 } }]).toArray();
    let ttl = new Date().getTime() + after;
    let qid = questions[0]._id;
    let gid = (yield exports.GAME().insertOne({ state: 'wait', stateTtl: ttl, sid })).insertedId;
    console.log("START GAME", gid);
    try {
        yield exports.GAME_QUESTION().insertMany(questions.map(q => ({ gid, qid: q._id, completed: false, categoty: q.category })), { ordered: false });
    }
    catch (e) {
        // ignore duplicates
        // console.warn(e);
    }
    yield WorkQueue_1.WORK_QUEUE_GAME().insertOne({ gid, type: 'GameChangeState', ttl, to: 'question', qid });
    return gid;
});
exports.moveToState = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.to === 'subResults') {
        // mark question as completed
        yield exports.GAME_QUESTION().update({ gid: args.gid, qid: args.qid }, { $set: { completed: true } });
        // update scores
        let currentAnswers = yield exports.GAME_USER_ANSWER().find({ gid: args.gid, qid: args.qid }).toArray();
        console.warn('[GAME]', 'sub results', 'answers', currentAnswers.length);
        for (let ca of currentAnswers) {
            yield exports.GAME_USER_SCORE().update({ gid: ca.gid, uid: ca.uid }, { $inc: { points: ca.points } }, { upsert: true });
        }
        // update state
        let stateTtl = new Date().getTime() + 10000;
        yield exports.GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl } });
        // pick and schedule next state
        let candidate = yield exports.GAME_QUESTION().findOne({ gid: args.gid, completed: false });
        console.warn('[GAME]', 'candidate', candidate && candidate.qid);
        if (candidate) {
            yield WorkQueue_1.WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'question', qid: candidate.qid, gid: args.gid });
        }
        else {
            yield WorkQueue_1.WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'results', qid: args.qid, gid: args.gid });
        }
    }
    else if (args.to === 'question') {
        let session = (yield exports.GAME().findOne(args.gid)).sid;
        yield Session_1.onGameStarted(session);
        // update state
        let stateTtl = new Date().getTime() + 20000;
        yield exports.GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl, qid: args.qid } });
        // schedule reults
        yield WorkQueue_1.WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'subResults', qid: args.qid, gid: args.gid });
    }
    else if (args.to === 'results') {
        // update state
        let stateTtl = new Date().getTime() + 5000;
        yield exports.GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl, qid: args.gid } });
        // reset session state
        let game = yield exports.GAME().findOne({ _id: args.gid });
        if (game) {
            yield WorkQueue_1.WORK_QUEUE_SESSION().insertOne({ type: 'SessionChangeState', sid: game.sid, to: 'await', ttl: stateTtl });
        }
    }
});
exports.gameHandleMessage = (uid, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.type === 'Answer') {
        yield exports.answer(uid, message.qid, message.gid, message.answer);
    }
});
exports.answer = (uid, qid, gid, answer) => __awaiter(void 0, void 0, void 0, function* () {
    let u = new bson_1.ObjectId(uid);
    let g = new bson_1.ObjectId(gid);
    let q = new bson_1.ObjectId(qid);
    let game = yield exports.GAME().findOne({ _id: g });
    let question = yield exports.QUESTION().findOne({ _id: q });
    if (game && game.qid && question) {
        let points = 1;
        points *= game.qid.equals(q) ? 1 : 0;
        points *= (question.answer.toLowerCase() === answer.toLowerCase()) ? 1 : 0;
        yield exports.GAME_USER_ANSWER().insertOne({ gid: g, qid: q, uid: u, answer, points });
    }
});
