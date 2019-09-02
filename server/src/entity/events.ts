import { ClientUser } from "../user/User";
import { GameState } from "../Game";
import { SessionState } from "../Session";

export type Event = SessionUserJoinedEvent | SessionUserLeftEvent | SessionStateChangedEvent | UserUpdatedEvent | GameStateChangedEvent | GameScoreChangedEvent;



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
}

// User
export interface UserUpdatedEvent {
    type: 'UserUpdatedEvent';
    user: ClientUser;
}

// Game
export interface GameStateChangedEvent {
    type: 'GameStateChangedEvent';
    state: GameState;
    ttl?: number;
}

export interface GameScoreChangedEvent {
    type: 'GameScoreChangedEvent';
    scores:
    {
        uid: string;
        score: number;
    }[];
}