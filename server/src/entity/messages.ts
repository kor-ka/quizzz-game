export type Message = SessionInit | UserRename | SessionStartGameCountdown | SessionStopGameCountdown | SessionReset | Answer;

// Session
export interface SessionInit {
    type: 'InitSession';
    id: string;
}

export interface SessionStartGameCountdown {
    type: 'SessionStartGameCountdown';
    id: string;
}

export interface SessionStopGameCountdown {
    type: 'SessionStopGameCountdown';
    id: string;
}

export interface SessionReset {
    type: 'SessionReset';
    id: string;
}

// User
export interface UserRename {
    type: 'UserRename';
    name: string;
}

// Game
export interface Answer {
    type: 'Answer';
    gid: string;
    qid: string;
    answer: string;
}