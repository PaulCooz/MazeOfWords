import { Event } from "cc"

export class LevelCompleteEvent extends Event {
    static readonly Name = "level-complete"
    constructor() { super(LevelCompleteEvent.Name, true) }
}

export class LevelChangeEvent extends Event {
    static readonly Name = "level-change"
    constructor() { super(LevelChangeEvent.Name, true) }
}

export type Locale = "en" | "ru"
