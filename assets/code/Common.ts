import { Event } from "cc"

export class LevelCompleteEvent extends Event {
    static readonly Name = "level-complete"
    constructor() { super(LevelCompleteEvent.Name, true) }
}

export class LevelChangeEvent extends Event {
    static readonly Name = "level-change"
    constructor() { super(LevelChangeEvent.Name, true) }
}

export class OpenLetterEvent extends Event {
    static readonly Name = "open-letter"

    readonly wordIndex: number

    constructor(wordIndex: number) {
        super(OpenLetterEvent.Name, true)
        this.wordIndex = wordIndex
    }
}
export const HintCost = 1 // TODO create config

export type Locale = "en" | "ru"

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3,
}
