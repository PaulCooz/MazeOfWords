import { Delegate } from "./Delegate";
import { IPlatform, IPlatformStorage } from "./Platform";
import { waitSec } from "./Utils";

export class CrazyGames implements IPlatform {
    SDK: any
    user: any

    // TODO
    get canShowInter(): boolean {
        return undefined
    }
    get canShowRewarded(): boolean {
        return undefined
    }
    onMuteAudio: Delegate<boolean>;

    storage: IPlatformStorage = {
        get(key, defaultValue) {
            try {
                const raw = this.SDK.data.getItem(key)
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
                this.SDK.data.removeItem(key)
            else
                this.SDK.data.setItem(key, JSON.stringify(value))
        },
        clear() {
            this.SDK.data.clear()
        },
        save() {
            // auto every 1 sec
        },
    }

    get lang() {
        return this.user?.systemInfo.locale.slice(0, 2)
    }

    private loaded = false
    private playing: boolean
    set gamePlaying(v: boolean) {
        if (!this.loaded) {
            this.SDK.game.loadingStop()
            this.loaded = true
        }

        if (this.playing != v) {
            this.playing = v
            if (v)
                this.SDK.game.gameplayStart()
            else
                this.SDK.game.gameplayStop()
        }
    }

    async init() {
        while (!globalThis.CG_isReady) {
            await waitSec(0.1)
        }
        if (this.SDK.user.isUserAccountAvailable) {
            this.user = this.SDK.user
        }
        this.SDK = globalThis.CrazyGames.SDK
    }

    showInter() {
        return new Promise<boolean>(resolve => {
            this.SDK.ad.requestAd("midgame", {
                adStarted: () => { },
                adError: () => resolve(false),
                adFinished: () => resolve(true),
            })
        })
    }

    showRewarded() {
        return new Promise<boolean>(resolve => {
            this.SDK.ad.requestAd("rewarded", {
                adStarted: () => { },
                adError: () => resolve(false),
                adFinished: () => resolve(true),
            })
        })
    }

    async submitScore(value: number) {
        if (this.user) {
            const encryptedScore = await encryptScore(value, "encryption-key")
            this.user.submitScore({
                encryptedScore: encryptedScore,
                score: value,
            })
        }
    }
}

async function encryptScore(score: number, encryptionKey: string) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const algorithm = { name: 'AES-GCM', iv: iv }
    const keyBytes = new Uint8Array(atob(encryptionKey).split('').map((c) => c.charCodeAt(0)))
    const cryptoKey = await window.crypto.subtle.importKey('raw', keyBytes, algorithm, false, ['encrypt'])
    const dataBuffer = new TextEncoder().encode(score.toString())
    const encryptedBuffer = await window.crypto.subtle.encrypt(algorithm, cryptoKey, dataBuffer)

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    return btoa(String.fromCharCode(...combined))
}
