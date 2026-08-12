import { exportAllStorage, importAllStorage } from "./self contained/Storage"
import { getPlayerData, setPlayerData } from "./self contained/Yandex"
import { PlayerStorage } from "./PlayerStorage"

const PushIntervalSec = 4

export class CloudSave {
    static async pull() {
        try {
            importAllStorage(await getPlayerData())
        } catch (e) {
            console.error("cloud pull failed", e)
        }
        PlayerStorage.resetAll()
        globalThis.changedLocalStorage = false
    }

    static startPushLoop() {
        setInterval(() => {
            if (globalThis.changedLocalStorage) {
                globalThis.changedLocalStorage = false
                setPlayerData(exportAllStorage())
                    .catch(e => console.error("cloud push failed", e))
            }
        }, PushIntervalSec * 1000)
    }
}
