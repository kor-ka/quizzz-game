import { ObjectId } from "bson";
import { MDB } from "../MDB";
import { WORK_QUEUE_GAME, GameChangeState, WORK_QUEUE_SESSION } from "../workQueue/WorkQueue";
import { Message } from "../entity/messages";
import { promises } from "fs";

export type GameState = 'wait' | 'question' | 'subResults' | 'results';

export interface Game {
    _id: ObjectId;
    sid: ObjectId;
    state: GameState;
    stateTtl: number;
    qid?: ObjectId;
}

interface Question {
    _id: ObjectId;
    category: string;
    text: string;
    textAnswers: string[];
    open?: 'text' | 'number' | 'false';
    answer: string;
}

export interface GameQuestion {
    _id: ObjectId;
    qid: ObjectId;
    gid: ObjectId;
    categoty: string;
    completed: boolean;
}

interface GameUserAnswer {
    _id: ObjectId;
    qid: ObjectId;
    gid: ObjectId;
    uid: ObjectId;
    answer: string;
    points: number;
}

export interface GameUserScore {
    _id: ObjectId;
    gid: ObjectId;
    uid: ObjectId;
    points: number;
}

// client shit

export interface ClientQuestion {
    _id: string;
    category: string;
    text: string;
    textAnswers?: string[];
    open?: 'text' | 'number';
}

export const toClientQuestion = (question: Question): ClientQuestion => {
    return {
        _id: question._id.toHexString(),
        category: question.category,
        text: question.text,
        textAnswers: question.textAnswers,
        open: question.open !== 'false' ? question.open : undefined
    }
}

export let GAME = () => MDB.collection<Game>('games');
export let QUESTION = () => MDB.collection<Question>('questions');
export let GAME_QUESTION = () => MDB.collection<GameQuestion>('game_questions');
export let GAME_USER_ANSWER = () => MDB.collection<GameUserAnswer>('game_user_answer');
export let GAME_USER_SCORE = () => MDB.collection<GameUserScore>('game_user_score');


export const startGame = async (sid: ObjectId, after: number) => {

    // TODO: filter user known questions
    let questions = await QUESTION().aggregate([{ $sample: { size: 3 } }]).toArray();

    let ttl = new Date().getTime() + after;
    let qid = questions[0]._id;
    let gid = (await GAME().insertOne({ state: 'wait', stateTtl: ttl, sid })).insertedId;
    console.log("START GAME", gid);
    try {
        await GAME_QUESTION().insertMany(questions.map(q => ({ gid, qid: q._id, completed: false, categoty: q.category })), { ordered: false });
    } catch (e) {
        // ignore duplicates
        // console.warn(e);
    }
    await WORK_QUEUE_GAME().insertOne({ gid, type: 'GameChangeState', ttl, to: 'question', qid })
    return gid;
}

export const moveToState = async (args: GameChangeState) => {

    if (args.to === 'subResults') {
        // mark question as completed
        await GAME_QUESTION().update({ gid: args.gid, qid: args.qid }, { $set: { completed: true } });

        // update scores
        let currentAnswers = await GAME_USER_ANSWER().find({ gid: args.gid, qid: args.qid }).toArray();
        console.warn('[GAME]', 'sub results', 'answers', currentAnswers.length);
        for (let ca of currentAnswers) {
            await GAME_USER_SCORE().update({ gid: ca.gid, uid: ca.uid }, { $inc: { points: ca.points } }, { upsert: true });
        }
        // update state
        let stateTtl = new Date().getTime() + 10000;
        await GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl } });

        // pick and schedule next state
        let candidate = await GAME_QUESTION().findOne({ gid: args.gid, completed: false });
        console.warn('[GAME]', 'candidate', candidate && candidate.qid);
        if (candidate) {
            await WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'question', qid: candidate.qid, gid: args.gid });
        } else {
            await WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'results', qid: args.qid, gid: args.gid });
        }

    } else if (args.to === 'question') {
        // update state
        let stateTtl = new Date().getTime() + 20000;
        await GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl, qid: args.qid } });

        // schedule reults
        await WORK_QUEUE_GAME().insertOne({ type: 'GameChangeState', ttl: stateTtl, to: 'subResults', qid: args.qid, gid: args.gid });

    } else if (args.to === 'results') {
        // update state
        let stateTtl = new Date().getTime() + 20000;
        await GAME().update({ _id: args.gid }, { $set: { state: args.to, stateTtl, qid: args.gid } });

        // reset session state
        let game = await GAME().findOne({ _id: args.gid });
        if (game) {
            await WORK_QUEUE_SESSION().insertOne({ type: 'SessionChangeState', sid: game.sid, to: 'await', ttl: stateTtl })
        }
    }

}

export const gameHandleMessage = async (uid: string, message: Message) => {
    if (message.type === 'Answer') {
        await answer(uid, message.qid, message.gid, message.answer);
    }
}

export const answer = async (uid: string, qid: string, gid: string, answer: string) => {
    let u = new ObjectId(uid);
    let g = new ObjectId(gid);
    let q = new ObjectId(qid);
    let game = await GAME().findOne({ _id: g });
    let question = await QUESTION().findOne({ _id: q });
    if (game && game.qid && question) {
        let points = 1;
        points *= game.qid.equals(q) ? 1 : 0;
        points *= (question.answer.toLowerCase() === answer.toLowerCase()) ? 1 : 0;
        await GAME_USER_ANSWER().insertOne({ gid: g, qid: q, uid: u, answer, points });
    }
}