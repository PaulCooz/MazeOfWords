import { Locale } from "./Common"
import { LevelData } from "./Level"
import { clearAllStorage, StorageValue } from "./self contained/Storage"


export class PlayerStorage {
    static levelIndex = new StorageValue<number>("levelIndex", 0)
    static prevLevel = new StorageValue<LevelData>("prevLevel")
    static currLevel = new StorageValue<LevelData>("currLevel")
    static lenToWordIndex = new StorageValue<{ [wordLen: number]: number }>("lenToWordIndex", {})

    static sound = new StorageValue<number>("sound", 0.5)
    static music = new StorageValue<number>("music", 0.5)

    static lang = new StorageValue<Locale>("lang", "en")

    static coins = new StorageValue<number>("coins", 10)

    static clearAll() {
        clearAllStorage()

        for (const field of Object.values(PlayerStorage)) {
            if (field instanceof StorageValue) {
                field.reset()
            }
        }
    }
}
