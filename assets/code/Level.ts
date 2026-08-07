import { PlayerStorage } from "./PlayerStorage"

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

    charAt(i: number, j: number) {
        return this.word[this.scheme.indexOf(i * this.width + j)]
    }

    saveAsCurr() {
        PlayerStorage.currLevel.value = {
            index: this.index,
            locale: this.locale,
            word: this.word,
            height: this.height,
            width: this.width,
            scheme: this.scheme,
            bonuses: this.bonuses,
            openLetters: this.openLetters,
        }
    }
}
