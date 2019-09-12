import { MDB } from "../MDB";
import { ObjectId } from "bson";
import { SessionState, moveToState as sessionMoveToState } from "../session/Session";
import { GameState, moveToState as gameMoveToState } from "../game/Game";

type Work = SessionChangeState | GameChangeState;

interface WorkBase {
    type: string;
    _id: ObjectId;
    ttl: number;
    lock?: boolean;
}

export interface SessionChangeState extends WorkBase {
    type: 'SessionChangeState';
    sid: ObjectId;
    gid?: ObjectId;
    to: SessionState;
}

export interface GameChangeState extends WorkBase {
    type: 'GameChangeState';
    gid: ObjectId;
    to: GameState;
    qid: ObjectId;
    sid: ObjectId;
}

export let WORK_QUEUE_SESSION = () => MDB.collection<SessionChangeState>('work_queue');
export let WORK_QUEUE_GAME = () => MDB.collection<GameChangeState>('work_queue');
let WORK_QUEUE = () => MDB.collection<Work>('work_queue');

const performWork = async (work: Work) => {
    if (work.type === 'SessionChangeState') {
        await sessionMoveToState(work);
    } else if (work.type === 'GameChangeState') {
        await gameMoveToState(work);
    }
}

let started = false;
export const startWorker = () => {
    if (started) {
        return
    }
    started = true;
    setInterval(async () => {
        // what if node shut down after lock but before complete?
        let work = await WORK_QUEUE().findOneAndUpdate({ ttl: { $lte: new Date().getTime() }, lock: { $ne: true } }, { $set: { lock: true } });
        if (work.ok === 1 && work.value) {
            try {
                await performWork(work.value);
            } catch {
                await WORK_QUEUE().updateOne({ _id: work.value._id }, { $set: { lock: false } });
            }
        }
    }, 300);
}
