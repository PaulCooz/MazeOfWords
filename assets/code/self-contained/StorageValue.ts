import { Delegate } from "./Delegate"
import { Platform } from "./platform/Platform"

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
        this.value = Platform.storage.get(this.key, typeof d == "function" ? (d as () => T)() : d)
    }

    save() {
        Platform.storage.set(this.key, this._value)

        if (this._onChange)
            this._onChange.emit(this._value)
    }
}
