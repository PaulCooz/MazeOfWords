import { CrazyGames } from "./CrazyGames"
import { Delegate } from "../Delegate"
import { Locale } from "../Locale"
import { YandexGames } from "./YandexGames"
import { Mock } from "./Mock"

export interface IPlatformStorage {
    get<T>(key: string, defaultValue?: T): T
    set<T>(key: string, value: T): void
    clear(): void
}

export const enum ControlFlags {
    Empty = 0,
    BlockInput = 1 << 0,
    MuteAudio = 1 << 1,
    All = BlockInput | MuteAudio,
}

export interface IPlatform {
    get lang(): Locale

    readonly storage: IPlatformStorage

    get control(): ControlFlags
    readonly onControlChange: Delegate<ControlFlags>

    set gamePaused(v: boolean)

    init(): Promise<void>
    pullPlayerData(config: object, resetStorageValues: () => void): Promise<void>

    showInter(): Promise<boolean>
    showRewarded(): Promise<boolean>

    submitScore(value: number): Promise<void>
}


const Class: { [key in string]: new () => IPlatform } = {
    ["CG"]: CrazyGames,
    ["YG"]: YandexGames,
    ["MOCK"]: Mock,
}

export const Platform: IPlatform = new (Class[globalThis.Platform || "MOCK"])()
