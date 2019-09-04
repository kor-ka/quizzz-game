import { SessionWatcher } from "../session/SesionWatcher";
import { GAME, Game, QUESTION, toClientQuestion, GAME_USER_SCORE, GameUserScore, GAME_QUESTION, GameQuestion } from "./Game";
import { ObjectId } from "bson";
import { ChangeStream } from "mongodb";
import { MDBChangeOp } from "../utils/MDBChangeOp";
import { UserConnection } from "../user/UserConnection";
import { Event } from "../entity/events";

export class GameWatcher {
    id: ObjectId;
    session: SessionWatcher;

    gameWatcher: ChangeStream;
    scoreWatcher: ChangeStream;
    constructor(id: ObjectId, session: SessionWatcher) {
        this.id = id;
        this.session = session;
    }

    init = async () => {
        this.gameWatcher = GAME().watch([{ $match: { 'fullDocument._id': this.id } }], { fullDocument: 'updateLookup' })
        this.gameWatcher.on('change', async (next: MDBChangeOp<Game>) => {
            if (next.operationType === 'update') {
                let question = await QUESTION().findOne({ _id: next.fullDocument.qid });
                let questions = (await GAME_QUESTION().find({ gid: next.fullDocument._id, completed: false }).toArray()).map(q => ({ qid: q._id.toHexString(), category: q.categoty }));
                this.session.emitAll({ type: 'GameStateChangedEvent', gid: this.id.toHexString(), state: next.fullDocument.state, ttl: next.fullDocument.stateTtl, question: question && toClientQuestion(question), stack: questions })
            }
        })

        this.scoreWatcher = GAME_USER_SCORE().watch([{ $match: { 'fullDocument.gid': this.id } }], { fullDocument: 'updateLookup' })
        this.scoreWatcher.on('change', async (next: MDBChangeOp<GameUserScore>) => {
            if (next.operationType === 'update' || next.operationType === 'insert') {
                this.session.emitAll({ type: 'GameScoreChangedEvent', gid: this.id.toHexString(), uid: next.fullDocument.uid.toHexString(), score: next.fullDocument.points });
            }
        })

        this.session.emitAll(await this.getFullState());
    }

    getFullState = async () => {
        let game = await GAME().findOne({ _id: this.id });
        let question = await QUESTION().findOne({ _id: game.qid });
        let questions = (await GAME_QUESTION().find({ gid: this.id, completed: false }).toArray()).map(q => ({ qid: q._id.toHexString(), category: q.categoty }));
        let scores = await GAME_USER_SCORE().find({ gid: this.id }).toArray();
        let batch: Event[] = [];

        batch.push({ type: 'GameStateChangedEvent', gid: this.id.toHexString(), state: game.state, ttl: game.stateTtl, question: question && toClientQuestion(question), stack: questions })
        for (let score of scores) {
            batch.push({ type: 'GameScoreChangedEvent', gid: this.id.toHexString(), uid: score.uid.toHexString(), score: score.points });
        }
        return batch;
    }

    dispose = () => {
        if (this.gameWatcher) {
            this.gameWatcher.close();
        }
        if (this.scoreWatcher) {
            this.scoreWatcher.close();
        }
    }
}

const gameWatchers = new Map<string, GameWatcher>();
export const getGameWatcher = async (id: ObjectId, session: SessionWatcher) => {
    let gw = gameWatchers.get(id.toHexString());
    if (!gw) {
        gw = new GameWatcher(id, session);
        await gw.init();
        gameWatchers.set(id.toHexString(), gw);
    }
    return gw;
}