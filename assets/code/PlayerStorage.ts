import { LevelData } from "./Level"
import { StorageValue } from "./self contained/Storage"


export class PlayerStorage {
    static levelIndex = new StorageValue<number>("levelIndex", 0)
    static prevLevel = new StorageValue<LevelData>("prevLevel")
    static currLevel = new StorageValue<LevelData>("currLevel")
    static lenToWordIndex = new StorageValue<{ [wordLen: number]: number }>("lenToWordIndex", {})
}
