import { sys } from "cc"
import { Delegate } from "./Delegate"

function get(key: string, defaultValue?: any) {
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
}

globalThis.changedLocalStorage = false

function set(key: string, value: any) {
    if (value == undefined) {
        sys.localStorage.removeItem(key)
    } else {
        sys.localStorage.setItem(key, JSON.stringify(value))
    }
    globalThis.changedLocalStorage = true
}

export function clearAllStorage() {
    sys.localStorage.clear()
    globalThis.changedLocalStorage = true
}

export function exportAllStorage(): object {
    const data = {}
    for (let i = 0; i < sys.localStorage.length; i++) {
        const key = sys.localStorage.key(i)
        const value = get(key)
        if (value != undefined)
            data[key] = value
    }
    return data
}

export function importAllStorage(data: object) {
    for (const key of Object.keys(data))
        set(key, data[key])
}

export class StorageValue<T> {
    private key: string
    private defaultValue: T | (() => T)

    private _value: T
    get value(): T {
        return this._value
    }
    set value(v: T) {
        if (this._value == v)
            return

        this._value = v
        this.save()
    }

    private _onChange: Delegate<T>
    get onChange() {
        if (!this._onChange)
            this._onChange = new Delegate<T>()
        return this._onChange
    }

    constructor(key: string, defaultValue?: T | (() => T)) {
        this.key = key
        this.defaultValue = defaultValue
        this.reset()
    }

    reset() {
        const d = this.defaultValue
        this.value = get(this.key, typeof d == "function" ? (d as () => T)() : d)
    }

    save() {
        set(this.key, this._value)

        if (this._onChange)
            this._onChange.emit(this._value)
    }
}
