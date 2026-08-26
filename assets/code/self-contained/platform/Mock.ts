import { sys } from "cc"
import { Delegate } from "../Delegate"
import { Locale } from "../Locale"
import { ControlFlags, IPlatform, IPlatformStorage } from "./Platform"

export class Mock implements IPlatform {
    get lang(): Locale { return "en" }

    readonly storage: IPlatformStorage = {
        get(key, defaultValue) {
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
        set(key, value) {
            if (value == undefined)
                sys.localStorage.removeItem(key)
            else
                sys.localStorage.setItem(key, JSON.stringify(value))
        },
        clear() {
            sys.localStorage.clear()
        }
    }

    get control() { return ControlFlags.Empty }
    readonly onControlChange = new Delegate<ControlFlags>()

    set gamePaused(_: boolean) { }

    init = () => Promise.resolve()
    pullPlayerData = (_: object, __: () => void) => Promise.resolve()

    showInter = () => Promise.resolve(true)
    showRewarded = () => Promise.resolve(true)

    submitScore = (_: number) => Promise.resolve()
}
