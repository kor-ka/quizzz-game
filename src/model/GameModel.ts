import { Event } from '../../server/src/entity/events';
import { SessionModel } from './SessionModel';
import { ClientUser } from '../../server/src/user/User';
import { ClientQuestion, GameState as State } from '../../server/src/game/Game';

export interface GameState {
    id?: string;
    scores: Map<string, { user: ClientUser, score: number }>;
    question?: ClientQuestion;
    stack: { qid: string, category: string, question?: ClientQuestion }[]
    state: State | 'wait';
    ttl: number
}

export class GameModel {
    session: SessionModel;
    constructor(session: SessionModel) {
        this.session = session;
    }

    state: GameState = { scores: new Map(), state: 'wait', ttl: 0, stack: [] };
    setState = (state: Partial<GameState>) => {
        this.state = { ...this.state, ...state };
    }
    listeners = new Set<(state: GameState) => void>();

    listen = (lsitener: (state: GameState) => void) => {
        this.listeners.add(lsitener);
        lsitener(this.state);
        return () => {
            this.listeners.delete(lsitener);
        }
    }

    notify = () => {
        this.listeners.forEach(l => l(this.state));
    }


    // TOOD create separate game states?
    handleEvent = (event: Event, notifyers: Set<() => void>) => {
        if (event.type === 'GameStateChangedEvent') {
            let stack = event.stack.map(q => q.qid === (event.question && event.question._id) ? { ...q, question: event.question } : q);
            this.setState({ id: event.gid, question: event.question, state: event.state, ttl: event.ttl || 0, stack });
            notifyers.add(this.notify);
        } else if (event.type === 'GameScoreChangedEvent') {
            let user = this.session.users.get(event.uid);
            if (user) {
                this.state.scores.set(event.uid, { user, score: event.score })
            }
            notifyers.add(this.notify);
        }
    }

}