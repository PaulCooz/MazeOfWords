import { CrazyGames } from "./CrazyGames"
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

    set gamePlaying(v: boolean)

    init(): Promise<void>

    // flags?

    get canShowInter(): boolean
    showInter(): Promise<boolean>

    get canShowRewarded(): boolean
    showRewarded(): Promise<boolean>

    submitScore(value: number): Promise<void>
}

// TODO
const Class = {
    ["CG"]: CrazyGames,
}[globalThis.Platform]

export const Platform: IPlatform = new Class()
