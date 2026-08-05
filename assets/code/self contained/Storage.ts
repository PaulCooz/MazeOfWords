import { sys } from "cc"

function get(key: string, defaultValue?: any) {
    let t = JSON.parse(sys.localStorage.getItem(key))
    return defaultValue != undefined ? (t ?? defaultValue) : t
}

globalThis.changedLocalStorage = false

function set(key: string, value: any) {
    sys.localStorage.setItem(key, JSON.stringify(value))
    globalThis.changedLocalStorage = true
}

export class StorageValue<T> { // TODO add onChanged event
    private key: string
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

    constructor(key: string, defaultValue?: T) {
        this.key = key
        this._value = get(key, defaultValue)
    }

    save() {
        set(this.key, this._value)
    }
}
