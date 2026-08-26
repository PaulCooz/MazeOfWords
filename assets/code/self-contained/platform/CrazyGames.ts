import { Delegate } from "../Delegate"
import { ControlFlags, IPlatform, IPlatformStorage } from "./Platform"
import { addFlag, hasFlag, subFlag, waitSec } from "../Utils"
import { Locale } from "../Locale"
import { sys } from "cc"


export class CrazyGames implements IPlatform {
    SDK: any
    user: any
    data = sys.localStorage

    private _control = ControlFlags.Empty
    get control() { return this._control }
    set control(c: ControlFlags) {
        if (this._control == c)
            return
        this._control = c
        this.onControlChange.emit(this._control)
    }
    readonly onControlChange = new Delegate<ControlFlags>()

    private get muteAudio(): boolean { return hasFlag(this._control, ControlFlags.MuteAudio) }
    private set muteAudio(v: boolean) {
        if (this.muteAudio == v)
            return
        this.control = (v ? addFlag : subFlag)(this._control, ControlFlags.MuteAudio)
    }

    readonly storage: IPlatformStorage

    get lang(): Locale { return this.user?.systemInfo.locale.slice(0, 2) ?? "en" }

    private loaded = false
    private paused: boolean
    set gamePaused(v: boolean) {
        if (!this.loaded) {
            this.SDK.game.loadingStop()
            this.loaded = true
        }

        if (this.paused != v) {
            this.paused = v
            if (v)
                this.SDK.game.gameplayStop()
            else
                this.SDK.game.gameplayStart()
        }
    }

    constructor() {
        const self = this
        this.storage = {
            get(key, defaultValue) {
                try {
                    const raw = self.data.getItem(key)
                    if (raw != null && raw != "") {
                        const t = JSON.parse(raw)
                        return defaultValue != undefined ? (t ?? defaultValue) : t
                    }
                } catch {
                    // ignore
                }
                return defaultValue
            },
            set(key, value) {
                if (value == undefined)
                    self.data.removeItem(key)
                else
                    self.data.setItem(key, JSON.stringify(value))
            },
            clear() {
                self.data.clear()
            }
        }
    }

    async init() {
        while (!globalThis.CG_isReady)
            await waitSec(0.1)

        this.SDK = globalThis.CrazyGames.SDK
        this.data = this.SDK.data

        if (this.SDK.user.isUserAccountAvailable)
            this.user = this.SDK.user

        this.muteAudio = this.SDK.game.settings.muteAudio
        this.SDK.game.addSettingsChangeListener(({ muteAudio }) => this.muteAudio = muteAudio)
    }
    pullPlayerData(_: object, resetStorageValues: () => void) {
        resetStorageValues()
        return Promise.resolve()
    }

    showInter() {
        return new Promise<boolean>(resolve => {
            this.SDK.ad.requestAd("midgame", {
                adStarted: () => this.control = ControlFlags.All,
                adError: () => this.advFinished(resolve, false),
                adFinished: () => this.advFinished(resolve, true),
            })
        })
    }
    showRewarded() {
        return new Promise<boolean>(resolve => {
            this.SDK.ad.requestAd("rewarded", {
                adStarted: () => this.control = ControlFlags.All,
                adError: () => this.advFinished(resolve, false),
                adFinished: () => this.advFinished(resolve, true),
            })
        })
    }
    private advFinished(resolve: (v: boolean) => void, success: boolean) {
        resolve(success)
        this.control = this.SDK.game.settings.muteAudio ? ControlFlags.MuteAudio : ControlFlags.Empty
    }

    submitScore(_: number): Promise<void> {
        return Promise.resolve() // ignore till invite

        // return this.user
        //     ? encryptScore(value)
        //         .then(encrypted => this.user.submitScore({
        //             encryptedScore: encrypted,
        //             score: value,
        //         }))
        //     : Promise.resolve()
    }
}

// 32-byte base64 Encryption Key from CrazyGames Developer Portal → Leaderboards (generate there; must match portal)
const ScoreEncryptionKey = "while i don't have the key, i'll ignore this shit"
async function encryptScore(score: number) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const algorithm = { name: 'AES-GCM', iv }
    const keyBytes = Uint8Array.from(atob(ScoreEncryptionKey), c => c.charCodeAt(0))

    const cryptoKey = await window.crypto.subtle.importKey('raw', keyBytes, algorithm, false, ['encrypt'])
    const dataBuffer = new TextEncoder().encode(score.toString())
    const encryptedBuffer = await window.crypto.subtle.encrypt(algorithm, cryptoKey, dataBuffer)

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    return btoa(String.fromCharCode(...combined))
}
