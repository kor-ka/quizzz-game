import { ClientUser } from "../user/User";
import { GameState, ClientQuestion } from "../game/Game";
import { SessionState } from "../session/Session";

export type Event = SessionUserJoinedEvent | SessionUserLeftEvent | SessionStateChangedEvent | UserUpdatedEvent | GameStateChangedEvent | GameScoreChangedEvent | GameUserGaveAnswer;



// Session
export interface SessionUserJoinedEvent {
    type: 'SessionUserJoinedEvent';
    sessionId: string;
    user: ClientUser;
}

export interface SessionUserLeftEvent {
    type: 'SessionUserLeftEvent';
    sessionId: string;
    user: ClientUser;
}

export interface SessionStateChangedEvent {
    type: 'SessionStateChangedEvent';
    sessionId: string;
    state: SessionState;
    ttl?: number;
    gid?: string;
}

// User
export interface UserUpdatedEvent {
    type: 'UserUpdatedEvent';
    user: ClientUser;
}

// Game
export interface GameStateChangedEvent {
    gid: string;
    type: 'GameStateChangedEvent';
    state: GameState;
    ttl?: number;
    question?: ClientQuestion;
    stack: { qid: string, category: string; completed: boolean, answer?: string }[];
}

export interface GameUserGaveAnswer {
    gid: string;
    type: 'GameUserGaveAnswer';
    qid: string;
    uid: string;
}

export interface GameScoreChangedEvent {
    gid: string;
    type: 'GameScoreChangedEvent';
    uid: string;
    score: number;
}