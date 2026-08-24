import { Delegate } from "./Delegate"
import { Locale } from "./Locale"

export interface IPlatformStorage {
    get<T>(key: string, defaultValue: T): T
    set<T>(key: string, value: T): void
    clear(): void
    save(): void
}

// TODO
export interface IPlatform {
    get lang(): Locale

    readonly storage: IPlatformStorage
    readonly onMuteAudio: Delegate<boolean>

    init(): Promise<void>

    // event on loaded
    // event on stop playing

    // flags
    // leaderboard

    get canShowInter(): boolean
    showInter(): Promise<boolean>

    get canShowRewarded(): boolean
    showRewarded(): Promise<boolean>
}

export const Platform: IPlatform = undefined
