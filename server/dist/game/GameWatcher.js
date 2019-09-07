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
const Game_1 = require("./Game");
class GameWatcher {
    constructor(id, session) {
        this.init = () => __awaiter(this, void 0, void 0, function* () {
            this.gameWatcher = Game_1.GAME().watch([{ $match: { 'fullDocument._id': this.id } }], { fullDocument: 'updateLookup' });
            this.gameWatcher.on('change', (next) => __awaiter(this, void 0, void 0, function* () {
                if (next.operationType === 'update') {
                    let question = yield Game_1.QUESTION().findOne({ _id: next.fullDocument.qid });
                    let questions = (yield Game_1.GAME_QUESTION().find({ gid: next.fullDocument._id }).toArray()).map(q => ({ qid: q.qid.toHexString(), category: q.categoty, completed: q.completed }));
                    let res = [];
                    if (next.fullDocument.state === 'subResults') {
                        let scores = yield Game_1.GAME_USER_SCORE().find({ gid: this.id }).toArray();
                        scores.map(score => res.push({ type: 'GameScoreChangedEvent', gid: this.id.toHexString(), uid: score.uid.toHexString(), score: score.points }));
                    }
                    res.push({ type: 'GameStateChangedEvent', gid: this.id.toHexString(), state: next.fullDocument.state, ttl: next.fullDocument.stateTtl, question: question && Game_1.toClientQuestion(question), stack: questions });
                    this.session.emitAll(res);
                }
            }));
            this.session.emitAll(yield this.getFullState());
        });
        this.getFullState = () => __awaiter(this, void 0, void 0, function* () {
            let game = yield Game_1.GAME().findOne({ _id: this.id });
            let question = yield Game_1.QUESTION().findOne({ _id: game.qid });
            let questions = (yield Game_1.GAME_QUESTION().find({ gid: this.id, completed: false }).toArray()).map(q => ({ qid: q.qid.toHexString(), category: q.categoty, completed: q.completed }));
            let scores = yield Game_1.GAME_USER_SCORE().find({ gid: this.id }).toArray();
            let batch = [];
            batch.push({ type: 'GameStateChangedEvent', gid: this.id.toHexString(), state: game.state, ttl: game.stateTtl, question: question && Game_1.toClientQuestion(question), stack: questions });
            for (let score of scores) {
                batch.push({ type: 'GameScoreChangedEvent', gid: this.id.toHexString(), uid: score.uid.toHexString(), score: score.points });
            }
            return batch;
        });
        this.dispose = () => {
            if (this.gameWatcher) {
                this.gameWatcher.close();
            }
            if (this.scoreWatcher) {
                this.scoreWatcher.close();
            }
            gameWatchers.delete(this.id.toHexString());
        };
        this.id = id;
        this.session = session;
    }
}
exports.GameWatcher = GameWatcher;
const gameWatchers = new Map();
exports.getGameWatcher = (id, session) => __awaiter(void 0, void 0, void 0, function* () {
    let gw = gameWatchers.get(id.toHexString());
    if (!gw) {
        gw = new GameWatcher(id, session);
        yield gw.init();
        gameWatchers.set(id.toHexString(), gw);
    }
    return gw;
});
