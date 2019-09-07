import { SessionWatcher } from "../session/SesionWatcher";
import { GAME, Game, QUESTION, toClientQuestion, GAME_USER_SCORE, GameUserScore, GAME_QUESTION, GameQuestion } from "./Game";
import { ObjectId } from "bson";
import { ChangeStream } from "mongodb";
import { MDBChangeOp } from "../utils/MDBChangeOp";
import { UserConnection } from "../user/UserConnection";
import { Event } from "../entity/events";
import { SESSIONS } from "../session/Session";

export class GameWatcher {
    session: SessionWatcher;

    gameWatcher: ChangeStream;
    scoreWatcher: ChangeStream;
    constructor(session: SessionWatcher) {
        this.session = session;
    }

    init = async () => {
        let session = await SESSIONS().findOne({ _id: new ObjectId(this.session.id) });
        this.gameWatcher = GAME().watch([{ $match: { 'fullDocument.sid': new ObjectId(this.session.id) } }], { fullDocument: 'updateLookup' })
        this.gameWatcher.on('change', async (next: MDBChangeOp<Game>) => {
            let gid = next.fullDocument._id;
            if (next.operationType === 'update' || next.operationType === 'insert') {
                let question = await QUESTION().findOne({ _id: next.fullDocument.qid });
                let questions = (await GAME_QUESTION().find({ gid }).toArray()).map(q => ({ qid: q.qid.toHexString(), category: q.categoty, completed: q.completed }));

                let res: Event[] = [];
                if (next.fullDocument.state === 'subResults') {
                    let scores = await GAME_USER_SCORE().find({ gid }).toArray();
                    scores.map(score => res.push({ type: 'GameScoreChangedEvent', gid: gid.toHexString(), uid: score.uid.toHexString(), score: score.points }));

                }
                res.push({ type: 'GameStateChangedEvent', gid: gid.toHexString(), state: next.fullDocument.state, ttl: next.fullDocument.stateTtl, question: question && toClientQuestion(question), stack: questions });
                this.session.emitAll(res)
            }
        })
        if (session && session.gameId) {
            this.session.emitAll(await this.getFullState(session.gameId));
        }
    }

    getFullState = async (gid: ObjectId) => {
        let game = await GAME().findOne({ _id: gid });
        let question = await QUESTION().findOne({ _id: game.qid });
        let questions = (await GAME_QUESTION().find({ gid: gid, completed: false }).toArray()).map(q => ({ qid: q.qid.toHexString(), category: q.categoty, completed: q.completed }));
        let scores = await GAME_USER_SCORE().find({ gid: gid }).toArray();
        let batch: Event[] = [];

        batch.push({ type: 'GameStateChangedEvent', gid: gid.toHexString(), state: game.state, ttl: game.stateTtl, question: question && toClientQuestion(question), stack: questions })
        for (let score of scores) {
            batch.push({ type: 'GameScoreChangedEvent', gid: gid.toHexString(), uid: score.uid.toHexString(), score: score.points });
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
        gameWatchers.delete(this.session.id);
    }
}

const gameWatchers = new Map<string, GameWatcher>();
export const getGameWatcher = async (session: SessionWatcher) => {
    let gw = gameWatchers.get(session.id);
    if (!gw) {
        gw = new GameWatcher(session);
        await gw.init();
        gameWatchers.set(session.id, gw);
    }
    return gw;
}