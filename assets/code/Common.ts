import { Event } from "cc"

export class LevelCompleteEvent extends Event {
    static readonly Name = "level-complete"
    constructor() { super(LevelCompleteEvent.Name, true) }
}

export class LevelChangeEvent extends Event {
    static readonly Name = "level-change"
    constructor() { super(LevelChangeEvent.Name, true) }
}

export class OpenedLetterEvent extends Event {
    static readonly Name = "opened-letter"
    constructor() { super(OpenedLetterEvent.Name, true) }
}

export type WordResult = 'correct' | 'bonus' | 'wrong'

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3,
}
