export type GameState = 'pickingQuestions' | 'question' | 'answer' | 'subResults' | 'results';

export class GameWatcher {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
}