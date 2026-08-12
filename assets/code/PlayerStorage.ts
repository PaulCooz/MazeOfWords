import { Locale } from "./Common"
import { Config } from "./Config"
import { LevelData } from "./Level"
import { clearAllStorage, StorageValue } from "./self contained/Storage"

type LevelType = { [locale in Locale]?: LevelData }
type Len2WordIndexType = { [locale in Locale]?: { [wordLen: number]: number } }

export class PlayerStorage {
    static levelIndex = new StorageValue<number>("levelIndex", 0)

    static currLevels = new StorageValue<LevelType>("currLevels", {})
    static prevLevels = new StorageValue<LevelType>("prevLevels", {})
    static lenToWordIndexes = new StorageValue<Len2WordIndexType>("lenToWordIndexes", {})

    static sound = new StorageValue<number>("sound", 0.5)
    static music = new StorageValue<number>("music", 0.5)

    static lang = new StorageValue<Locale>("lang", "en")
    static langChosen = new StorageValue<boolean>("langChosen", false) // ignore yandex default if picked lang

    static coins = new StorageValue<number>("coins", () => Config.startCoins)

    static getCurrLevel(locale: Locale) {
        return this.currLevels.value[locale]
    }
    static setCurrLevel(locale: Locale, data: LevelData | undefined) {
        this.setLevel(locale, data, this.currLevels)
    }

    static getPrevLevel(locale: Locale) {
        return this.prevLevels.value[locale]
    }
    static setPrevLevel(locale: Locale, data: LevelData | undefined) {
        this.setLevel(locale, data, this.prevLevels)
    }

    private static setLevel(locale: Locale, data: LevelData | undefined, val: StorageValue<LevelType>) {
        const map = val.value
        if (data == undefined)
            delete map[locale]
        else
            map[locale] = data
        val.save()
    }

    static getLenToWordIndex(locale: Locale) {
        const map = this.lenToWordIndexes.value
        if (map[locale] == undefined)
            map[locale] = {}
        return map[locale]
    }

    static resetAll() {
        for (const field of Object.values(PlayerStorage)) {
            if (field instanceof StorageValue) {
                field.reset()
            }
        }
    }

    static clearAll() {
        clearAllStorage()
        this.resetAll()
    }
}
