import { Delegate } from "./Delegate"

const SdkWaitMs = 15000
const mockLog = (..._: any[]) => { } // swap to console.log when debugging SDK mock

let yndxPause = false
let gamePause = false
let prevStopped: boolean
export const onYaPause = new Delegate<boolean>()

export async function initYandex() {
    if (globalThis.YaGames != undefined) { // sdk.js is connected
        const deadline = Date.now() + SdkWaitMs
        while (globalThis.YG == undefined && Date.now() < deadline) // index.ejs is initializing
            await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (globalThis.YG == undefined)
        installMock()

    globalThis.YG.on("game_api_pause", () => {
        yndxPause = true
        onYaPause.emit(yndxPause)
        refreshGameplay()
    })
    globalThis.YG.on("game_api_resume", () => {
        yndxPause = false
        onYaPause.emit(yndxPause)
        refreshGameplay()
    })
}
export function loadingReady() {
    globalThis.YG.features.LoadingAPI.ready()
}
function refreshGameplay() {
    if (globalThis.YG == undefined)
        return

    const paused = yndxPause || gamePause
    if (prevStopped == paused)
        return
    prevStopped = paused

    if (paused)
        globalThis.YG.features.GameplayAPI.stop()
    else
        globalThis.YG.features.GameplayAPI.start()
}
export function setGamePaused(paused: boolean) {
    gamePause = paused
    refreshGameplay()
}

export function yandexLang(): string {
    const lang = globalThis.YG_Lang ?? "en"
    return ["ru", "be", "kk", "uk", "uz"].includes(lang) ? "ru" : lang
}

export function getFlags(): Promise<{ [key: string]: string }> {
    return globalThis.YG.getFlags()
}

export function getPlayerData(): Promise<object> {
    return globalThis.YG_Player.getData()
}
export function setPlayerData(data: object): Promise<void> {
    return globalThis.YG_Player.setData(data)
}

type AdvCallbacks = {
    onOpen?: () => void
    onRewarded?: () => void
    onClose?: (wasShown?: boolean) => void
    onError?: (error?: any) => void
}

export function showFullscreenAdv(): Promise<boolean> {
    return new Promise(resolve => {
        globalThis.YG.adv.showFullscreenAdv({
            callbacks: {
                onClose: (wasShown: boolean) => resolve(wasShown)
            }
        })
    })
}
export function showRewardedVideo(): Promise<boolean> {
    let success = false
    return new Promise(resolve => {
        globalThis.YG.adv.showRewardedVideo({
            callbacks: {
                onRewarded: () => success = true,
                onClose: (wasShown: boolean) => resolve(wasShown && success),
            }
        })
    })
}

export async function setLeaderboardScore(name: string, score: number) {
    try {
        if (!globalThis.YG_Player.isAuthorized())
            return
        await globalThis.YG.leaderboards.setScore(name, score)
    } catch (e) {
        console.error(e)
    }
}

function installMock() {
    mockLog("[Yandex] SDK not found, using mock")

    globalThis.YG_Lang = "en"
    globalThis.YG_Player = {
        getData: () => Promise.resolve({}),
        setData: (_data: object) => Promise.resolve(),
        isAuthorized: () => true,
    }
    globalThis.YG = {
        features: {
            LoadingAPI: { ready: () => mockLog("[Yandex] game ready") },
            GameplayAPI: {
                start: () => mockLog("[Yandex] gameplay start"),
                stop: () => mockLog("[Yandex] gameplay stop"),
            },
        },
        adv: {
            showFullscreenAdv: (opts?: { callbacks?: AdvCallbacks }) => {
                mockLog("[Yandex] fullscreen adv")
                opts?.callbacks?.onClose?.(true)
            },
            showRewardedVideo: (opts?: { callbacks?: AdvCallbacks }) => {
                mockLog("[Yandex] rewarded video")
                opts?.callbacks?.onRewarded?.()
                opts?.callbacks?.onClose?.(true)
            },
        },
        on: (_event: string, _listener: Function) => { },
        getFlags: (params?: { defaultFlags?: object }) => Promise.resolve({ ...(params?.defaultFlags ?? {}) }),
        leaderboards: {
            setScore: (name: string, score: number) => {
                mockLog("[Yandex] setScore", name, score)
                return Promise.resolve()
            },
        },
        environment: { i18n: { lang: globalThis.YG_Lang } },
    }
}
