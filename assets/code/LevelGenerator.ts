import { TextAsset } from "cc"
import { Rand } from "./self contained/Rand"
import { loadBundle, loadFile } from "./self contained/Engine"
import { Level } from "./Level"
import { PlayerStorage } from "./PlayerStorage"
import { Locale } from "./Common"
import { Config } from "./Config"

const MaxWordLen = 25

let wordsByLen: string[][]
let loadedLocale: string

async function checkWords(locale: string) {
    if (loadedLocale != locale) {
        const bundle = await loadBundle("words")
        const text = (await loadFile<TextAsset>(`words_all_${locale}`, bundle)).text

        wordsByLen = []
        for (let i = 0; i <= MaxWordLen; i++)
            wordsByLen.push([])

        for (const word of text.split('\n')) {
            const len = word.length
            if (len == 0) // the last one
                continue
            wordsByLen[len].push(word)
        }

        loadedLocale = locale
    }
}

export function isWordExist(word: string) {
    return word.length > 3 ? (wordsByLen[word.length]?.includes(word) ?? false) : false
}

function nextWord(locale: Locale, index: number) {
    const range = Config.levelProgression.find(r => r.from <= index && (index < r.to || r.to == -1))
    const minS = range.wordLength[0], maxS = range.wordLength[range.wordLength.length - 1]
    const scoreToLen = {}

    const lenToWordIndex = PlayerStorage.getLenToWordIndex(locale)
    for (let s = minS; s <= maxS; s++) {
        const count = wordsByLen[s].length
        scoreToLen[s] = count == 0 ? undefined : (lenToWordIndex[s] ?? 0) / count
    }

    const prevLevel = PlayerStorage.getPrevLevel(locale)
    const prevWordLen = prevLevel?.word.length ?? -1
    if (scoreToLen[prevWordLen] != undefined)
        scoreToLen[prevWordLen]++

    let bestSize: number
    let bestScore: number
    for (let s = minS; s <= maxS; s++) {
        if (bestScore == undefined || (scoreToLen[s] != undefined && bestScore > scoreToLen[s])) {
            bestScore = scoreToLen[s]
            bestSize = s
        }
    }

    const wordIndex = lenToWordIndex[bestSize] ?? 0
    return wordsByLen[bestSize][wordIndex % wordsByLen.length]
}

function nextScheme(locale: Locale, height: number, width: number, index: number) {
    const rand = new Rand(index)
    const path = [], used = {}
    const stopWord = "found"
    const rec = (i: number, j: number) => {
        const idx = i * width + j
        used[idx] = true
        path.push(idx)

        if (path.length == height * width)
            throw stopWord

        const steps = [[-1, 0], [+1, 0], [0, -1], [0, +1]]
        rand.shuffle(steps)
        for (const step of steps) {
            const ni = i + step[0], nj = j + step[1]
            if (0 <= ni && ni < height && 0 <= nj && nj < width && !used[ni * width + nj])
                rec(ni, nj)
        }

        used[idx] = undefined
        path.pop()
    }

    try {
        const prevLevel = PlayerStorage.getPrevLevel(locale),
            pi = prevLevel ? Math.trunc(prevLevel.scheme[0] / prevLevel.width) : -1,
            pj = prevLevel ? prevLevel.scheme[0] % prevLevel.width : -1
        while (true) { // TODO optimization!
            const i = rand.rangeInt(0, height), j = rand.rangeInt(0, width)
            if (pi == i && pj == j)
                continue
            rec(i, j)
        }
    } catch (e) {
        if (e != stopWord)
            console.error(e)
    }

    return path
}

export async function createLevel(locale: Locale, index: number) {
    await checkWords(locale)

    let currLevel = PlayerStorage.getCurrLevel(locale)
    if (currLevel == undefined || currLevel.index != index) {
        currLevel = {
            index: index, locale: locale,
            word: undefined,
            height: undefined, width: undefined,
            scheme: undefined,
            bonuses: [], openLetterIndexes: []
        }

        currLevel.word = nextWord(locale, index)

        const wordLen = currLevel.word.length
        currLevel.height = currLevel.width = Math.round(Math.sqrt(wordLen))
        if (currLevel.height * currLevel.width < wordLen)
            currLevel.height++

        currLevel.scheme = nextScheme(locale, currLevel.height, currLevel.width, index)

        PlayerStorage.setCurrLevel(locale, currLevel)
    }
    return new Level(currLevel)
}
