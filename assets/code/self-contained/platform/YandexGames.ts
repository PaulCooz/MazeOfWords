import { sys } from "cc"
import { Delegate } from "../Delegate"
import { Locale } from "../Locale"
import { ControlFlags, IPlatform, IPlatformStorage } from "./Platform"
import { waitSec } from "../Utils"

const SdkWaitSec = 2, DataSyncIntervalSec = 4, InterDelaySec = 60
const LangMap = { ["ru"]: "ru", ["be"]: "ru", ["kk"]: "ru", ["uk"]: "ru", ["uz"]: "ru" }

export class YandexGames implements IPlatform {
    get lang(): Locale { return LangMap[globalThis.YG_Lang] ?? "en" }

    readonly storage: IPlatformStorage

    private yndxPause = false
    private gamePause = false
    private _paused: boolean

    get control() { return this.yndxPause ? ControlFlags.All : ControlFlags.Empty }
    readonly onControlChange = new Delegate<ControlFlags>()

    private loaded = false
    set gamePaused(v: boolean) {
        if (!this.loaded) {
            globalThis.YG.features.LoadingAPI.ready()
            this.loaded = true
        }
        this.gamePause = v
        this.refreshGameplay()
    }

    private changedLocalStorage = false

    constructor() {
        const self = this
        this.storage = {
            get<T>(key: string, defaultValue?: T) {
                try {
                    const raw = sys.localStorage.getItem(key)
                    if (raw != null && raw != "") {
                        const t = JSON.parse(raw)
                        return defaultValue != undefined ? (t ?? defaultValue) : t
                    }
                } catch {
                    // ignore
                }
                return defaultValue
            },
            set<T>(key: string, value: T) {
                if (value == undefined)
                    sys.localStorage.removeItem(key)
                else
                    sys.localStorage.setItem(key, JSON.stringify(value))
                self.changedLocalStorage = true
            },
            clear() {
                sys.localStorage.clear()
                self.changedLocalStorage = true
            }
        }
    }

    async init() {
        while (globalThis.YG == undefined)
            await waitSec(0.1)

        globalThis.YG.on("game_api_pause", () => {
            this.yndxPause = true
            this.onControlChange.emit(this.control)
            this.refreshGameplay()
        })
        globalThis.YG.on("game_api_resume", () => {
            this.yndxPause = false
            this.onControlChange.emit(this.control)
            this.refreshGameplay()
        })
    }

    pullPlayerData(config: object, resetStorageValues: () => void): Promise<void> {
        return Promise.all([
            this.pullFlags(config),
            this.pullData(resetStorageValues)
        ]).then(this.syncData.bind(this))
    }
    private async pullFlags(config: object) {
        const flags = await globalThis.YG.getFlags()
        for (const key of Object.keys(flags)) {
            try {
                config[key] = JSON.parse(flags[key])
            } catch {
                console.error(`bad config flag ${key}: ${flags[key]}`)
            }
        }
    }
    private async pullData(resetStorageValues: () => void) {
        try {
            const data = await globalThis.YG_Player.getData()
            for (const key of Object.keys(data))
                this.storage.set(key, data[key])
        } catch (e) {
            console.error("cloud pull failed", e)
        }
        resetStorageValues()
    }
    private syncData() {
        this.changedLocalStorage = false
        setInterval(() => {
            if (this.changedLocalStorage) {
                this.changedLocalStorage = false
                globalThis.YG_Player
                    .setData(this.exportAllStorage())
                    .catch(console.error)
            }
        }, DataSyncIntervalSec * 1000)
    }

    private refreshGameplay() {
        if (globalThis.YG == undefined)
            return

        const paused = this.yndxPause || this.gamePause
        if (this._paused == paused)
            return
        this._paused = paused

        if (paused)
            globalThis.YG.features.GameplayAPI.stop()
        else
            globalThis.YG.features.GameplayAPI.start()
    }

    private lastFullscreen = Date.now()
    showInter() {
        if ((Date.now() - this.lastFullscreen) < InterDelaySec * 1000)
            return Promise.resolve(false)

        return new Promise<boolean>(resolve => {
            globalThis.YG.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => { },
                    onClose: (wasShown: boolean) => {
                        this.lastFullscreen = Date.now()
                        resolve(wasShown)
                    },
                    onError: console.error,
                }
            })
        })
    }
    showRewarded() {
        let success = false
        return new Promise<boolean>(resolve => {
            globalThis.YG.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => { },
                    onRewarded: () => success = true,
                    onClose: () => resolve(success),
                    onError: console.error,
                }
            })
        })
    }

    async submitScore(value: number) {
        try {
            if (!globalThis.YG_Player.isAuthorized())
                return
            await globalThis.YG.leaderboards.setScore("level", value)
        } catch (e) {
            console.error(e)
        }
    }

    private exportAllStorage(): object {
        const data = {}
        for (let i = 0; i < sys.localStorage.length; i++) {
            const key = sys.localStorage.key(i)
            const value = this.storage.get(key)
            if (value != undefined)
                data[key] = value
        }
        return data
    }
}
