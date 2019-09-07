import { Event } from '../../server/src/entity/events';
import { SessionModel } from './SessionModel';
import { ClientUser } from '../../server/src/user/User';
import { ClientQuestion, GameState as State } from '../../server/src/game/Game';

export interface GameState {
    id?: string;
    scores: Map<string, { user: ClientUser, score: number }>;
    question?: ClientQuestion;
    stack: { qid: string, category: string, question?: ClientQuestion, active: boolean }[]
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

    handleEvent = (event: Event, notifyers: Set<() => void>) => {
        if (event.type === 'GameStateChangedEvent') {
            if (this.session.sesssionState.state !== 'game' && event.state === 'question') {
                this.session.onGameStarted();
            }
            event.stack.reverse();
            let stack = event.stack.map(q => {
                let isCurretn = q.qid === (event.question && event.question._id);
                if (isCurretn) {
                    return { ...q, question: event.question, active: !q.completed };
                } else {
                    return { ...q, active: true };
                }
            });
            let targetState = event.state;
            if (targetState === 'subResults') {
                targetState = 'question';
                setTimeout(() => {
                    this.setState({ state: event.state });
                    this.notify();
                }, 2000);
            }
            this.setState({ id: event.gid, question: event.question, state: targetState, ttl: event.ttl || 0, stack });

            notifyers.add(this.notify);

        } else if (event.type === 'GameScoreChangedEvent') {
            let user = this.session.users.get(event.uid);
            if (user) {
                this.state.scores.set(event.uid, { user, score: event.score })
                this.setState({ scores: new Map(this.state.scores) });
            }
            notifyers.add(this.notify);

        }
    }

    reset = () => {
        this.state = { scores: new Map(), state: 'wait', ttl: 0, stack: [] };
        this.notify();
    }

}