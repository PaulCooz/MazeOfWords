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
export class OpenedLetterEvent extends Event {
    static readonly Name = "opened-letter"
    constructor() { super(OpenedLetterEvent.Name, true) }
}

export type WordResult = 'correct' | 'bonus' | 'wrong'

export type Locale = "en" | "ru"
export const Locales = ["en", "ru"]

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3,
}
