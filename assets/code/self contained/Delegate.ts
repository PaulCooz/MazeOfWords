type EventCallback<T> = (arg: T) => void
type EventTarget = object

export class Delegate<T = void> {
    private _callbacks: [EventCallback<T>, EventTarget, boolean][] = []

    append(callback: EventCallback<T>, target?: EventTarget) {
        this._callbacks.push([callback, target, false])
    }

    once(callback: EventCallback<T>, target?: EventTarget) {
        this._callbacks.push([callback, target, true])
    }

    pop(callback: EventCallback<T>, target: EventTarget) {
        const i = this._callbacks.findLastIndex(c => c[0] == callback && c[1] == target && !c[2])
        if (i >= 0)
            this._callbacks.splice(i, 1)
    }

    emit(arg: T) {
        for (const call of Array.from(this._callbacks)) {
            const [callback, target, once] = call

            if (target) {
                callback.call(target, arg)
            } else {
                callback(arg)
            }

            if (once) {
                const i = this._callbacks.findIndex(c => c[0] == callback && c[1] == target && c[2])
                if (i >= 0)
                    this._callbacks.splice(i, 1)
            }
        }
    }

    clear() {
        this._callbacks.length = 0
    }

    awaiter() {
        return new Promise(resolve => this.once(resolve))
    }
}
