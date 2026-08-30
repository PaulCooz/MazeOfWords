import { AssetManager, TextAsset } from "cc"
import { loadBundle, loadFile } from "../self-contained/Engine"
import { Locale } from "../self-contained/Locale"
import { Config } from "../Config"
import { PlayerStorage } from "../PlayerStorage"
import { Rand } from "../self-contained/Rand"
import { Level } from "./Level"

const MaxWordLen = 25

let wordsByLen: string[][]
let loadedLocale: string
let bundle: AssetManager.Bundle

export function loadWordConfigBundle() {
    return loadBundle("words")
        .then(b => bundle = b)
}

async function checkWords(locale: string) {
    if (loadedLocale != locale) {
        const text = (await loadFile<TextAsset>(`words_all_${locale}`, bundle)).text

        wordsByLen = []
        for (let i = 0; i <= MaxWordLen; i++)
            wordsByLen.push([])

        for (const word of text.split(/\r?\n/)) {
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
    const bucket = wordsByLen[bestSize]
    return bucket[wordIndex % bucket.length]
}

function nextScheme(locale: Locale, height: number, width: number, index: number) {
    const schemes = allSchemes(height, width)
    const prevLevel = PlayerStorage.getPrevLevel(locale)
    const pi = prevLevel ? Math.trunc(prevLevel.scheme[0] / prevLevel.width) : -1
    const pj = prevLevel ? prevLevel.scheme[0] % prevLevel.width : -1

    const start = index % schemes.length
    for (let n = 0; n < schemes.length; n++) {
        const path = schemes[(start + n) % schemes.length]
        if (Math.trunc(path[0] / width) != pi || path[0] % width != pj)
            return path
    }
    return schemes[start]
}

const schemeCache: { [key: string]: number[][] } = {}
function allSchemes(height: number, width: number) {
    const key = `${height}x${width}`
    if (schemeCache[key])
        return schemeCache[key]

    const n = height * width
    const path = [], found = []
    const used = new Uint8Array(n), steps = [[-1, 0], [+1, 0], [0, -1], [0, +1]]

    const rec = (i: number, j: number) => {
        const idx = i * width + j
        used[idx] = 1
        path.push(idx)

        if (path.length == n)
            found.push(Array.from(path))
        else {
            for (const step of steps) {
                const ni = i + step[0], nj = j + step[1]
                if (0 <= ni && ni < height && 0 <= nj && nj < width && !used[ni * width + nj])
                    rec(ni, nj)
            }
        }

        used[idx] = 0
        path.pop()
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (n % 2 == 1 && (i + j) % 2 == 1)
                continue
            rec(i, j)
        }
    }

    new Rand(height * 31 + width).shuffle(found)
    schemeCache[key] = found
    return found
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
