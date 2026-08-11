import { LevelData } from "./Level"
import { clearAllStorage, StorageValue } from "./self contained/Storage"


export class PlayerStorage {
    static levelIndex = new StorageValue<number>("levelIndex", 0)
    static prevLevel = new StorageValue<LevelData>("prevLevel")
    static currLevel = new StorageValue<LevelData>("currLevel")
    static lenToWordIndex = new StorageValue<{ [wordLen: number]: number }>("lenToWordIndex", {})

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
