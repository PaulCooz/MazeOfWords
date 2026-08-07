import { TextAsset } from "cc"
import { Rand } from "./self contained/Rand"
import { loadBundle, loadFile } from "./self contained/Engine"
import { Level } from "./Level"
import { PlayerStorage } from "./PlayerStorage"

const sizesRange = [
    { from: 0, to: 2, wordLength: [4] },
    { from: 2, to: 9, wordLength: [5, 8] },
    { from: 9, to: 15, wordLength: [7, 9] },
    { from: 15, to: 25, wordLength: [9, 14] },
    { from: 25, to: -1, wordLength: [9, 25] },
]

let wordsByLen: string[][]
let loadedLocale: string

async function checkWords(locale: string) {
    if (loadedLocale != locale) {
        const bundle = await loadBundle("bundle")
        const text = (await loadFile<TextAsset>(`words_all_${locale}`, bundle)).text

        wordsByLen = []
        for (const word of text.split('\n')) {
            const len = word.length
            if (len == 0) // the last one
                continue

            while (wordsByLen.length <= len)
                wordsByLen.push([])
            wordsByLen[len].push(word)
        }

        loadedLocale = locale
    }
}

export function isWordExist(word: string) {
    return wordsByLen[word.length]?.includes(word) ?? false
}

function nextWord(index: number) {
    const range = sizesRange.find(r => r.from <= index && (index < r.to || r.to == -1))
    const scoreToLen = {}

    const lenToWordIndex = PlayerStorage.lenToWordIndex.value
    for (const s of range.wordLength)
        scoreToLen[s] = (lenToWordIndex[s] ?? 0) / wordsByLen[s].length

    const prevLevel = PlayerStorage.prevLevel.value
    const prevWordLen = prevLevel?.word.length ?? -1
    if (scoreToLen[prevWordLen] != undefined)
        scoreToLen[prevWordLen]++

    let bestSize = range.wordLength[0]
    let bestScore = scoreToLen[bestSize]
    for (const s of range.wordLength) {
        if (bestScore > scoreToLen[s]) {
            bestScore = scoreToLen[s]
            bestSize = s
        }
    }

    const wordIndex = lenToWordIndex[bestSize] ?? 0
    lenToWordIndex[bestSize] = wordIndex + 1
    PlayerStorage.lenToWordIndex.save()

    return wordsByLen[bestSize][wordIndex % wordsByLen.length]
}

function nextScheme(height: number, width: number, index: number) {
    const rand = new Rand(index)
    const used = {}
    const path = []
    const prevPath = PlayerStorage.prevLevel.value?.scheme ?? []

    const stopWord = "found"
    const steps = [[-1, 0], [+1, 0], [0, -1], [0, +1]]
    const rec = (i: number, j: number) => {
        if (path.length == height * width) {
            if (path.length == prevPath.length && path.every((v, i) => v == prevPath[i]))
                return
            throw stopWord
        }

        rand.shuffle(steps)
        for (const step of steps) {
            const ni = i + step[0], nj = j + step[1],
                indx = ni * width + nj

            if (0 <= ni && ni < height && 0 <= nj && nj < width && !used[indx]) {
                used[indx] = true
                path.push(indx)
                rec(ni, nj)
                path.pop()
                used[indx] = undefined
            }
        }
    }

    try {
        rec(rand.rangeInt(0, height), rand.rangeInt(0, width))
    } catch (e) {
        if (e != stopWord)
            console.error(e)
    }

    return path
}

export async function createLevel(locale: "ru" | "en", index: number) {
    await checkWords(locale)

    let currLevel = PlayerStorage.currLevel.value
    if (currLevel == undefined || currLevel.index != index || currLevel.locale != locale) {
        currLevel = {
            index: index, locale: locale,
            word: undefined,
            height: undefined, width: undefined,
            scheme: undefined,
            bonuses: [], openLetters: []
        }

        currLevel.word = nextWord(index)

        const wordLen = currLevel.word.length
        currLevel.height = currLevel.width = Math.round(Math.sqrt(wordLen))
        if (currLevel.height * currLevel.width < wordLen)
            currLevel.height++

        currLevel.scheme = nextScheme(currLevel.height, currLevel.width, index)

        PlayerStorage.currLevel.value = currLevel
    }
    return new Level(currLevel)
}
