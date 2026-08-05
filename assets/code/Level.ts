export interface LevelData {
    index: number
    locale: string

    word: string
    height: number
    width: number
    scheme: number[]

    bonuses: string[]
    openLetters: number[]
}

export class Level implements LevelData {
    index: number
    locale: string

    word: string
    height: number
    width: number
    scheme: number[]

    bonuses: string[]
    openLetters: number[]

    constructor(data: LevelData) {
        Object.assign(this, data)
    }
}
