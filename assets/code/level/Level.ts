import { Direction, Locale } from "../Common"
import { PlayerStorage } from "../PlayerStorage"

export interface LevelData {
    index: number
    locale: string

    word: string
    height: number
    width: number
    scheme: number[]

    bonuses: string[]
    openLetterIndexes: number[]
}

export class Level implements LevelData {
    index: number
    locale: Locale

    word: string
    height: number
    width: number
    scheme: number[]

    bonuses: string[]
    openLetterIndexes: number[]

    get allLettersOpened() { return this.openLetterIndexes.length >= this.word.length }

    constructor(data: LevelData) {
        Object.assign(this, data)
    }

    wordI2gridI(wordIndex: number): number { return this.scheme[wordIndex] }
    wordI2gridP(wordIndex: number): [number, number] {
        const gi = this.wordI2gridI(wordIndex)
        return [Math.trunc(gi / this.width), gi % this.width]
    }
    gridP2wordI(i: number, j: number) { return this.scheme.indexOf(i * this.width + j) }

    letterAt(i: number, j: number) { return this.word[this.gridP2wordI(i, j)] }

    nextClosedWordI() {
        for (let i = 0; i < this.word.length; i++) {
            if (!this.openLetterIndexes.includes(i))
                return i
        }
        return -1
    }
    directionNextTo(wordIndex: number): Direction {
        if (wordIndex + 1 >= this.word.length)
            return null

        const [y1, x1] = this.wordI2gridP(wordIndex)
        const [y2, x2] = this.wordI2gridP(wordIndex + 1)
        if (x1 > x2) return Direction.Right
        if (x1 < x2) return Direction.Left
        if (y1 > y2) return Direction.Up
        if (y1 < y2) return Direction.Down
    }

    saveAsCurr() {
        PlayerStorage.setCurrLevel(this.locale, {
            index: this.index,
            locale: this.locale,
            word: this.word,
            height: this.height,
            width: this.width,
            scheme: this.scheme,
            bonuses: this.bonuses,
            openLetterIndexes: this.openLetterIndexes,
        })
    }
}
