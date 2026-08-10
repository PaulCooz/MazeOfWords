// TODO доделать!

type KeyType = string | number
type Callback = [Function, any]

export class Delegate<T> {
    public _callback: { [key in KeyType]: Callback }

    public on(key: KeyType, callback: Function, target?: unknown, once?: boolean): AnyFunction {
        if (!this.hasEventListener(key, callback, target)) {
            let list = this._callback[key]
            if (!list) {
                list = this._callback[key] = callbackListPool.alloc()
            }
            const info = callbackInfoPool.alloc()
            info.set(callback, target, once)
            list.callbackInfos.push(info)
        }
        return callback
    }

    public hasEventListener(key: EventTypeClass, callback?: AnyFunction, target?: unknown): boolean {
        const list = this._callbackTable && this._callbackTable[key]
        if (!list) {
            return false
        }

        // check any valid callback
        const infos = list.callbackInfos
        if (!callback) {
            // Make sure no cancelled callbacks
            if (list.isInvoking) {
                for (let i = 0; i < infos.length; ++i) {
                    if (infos[i]) {
                        return true
                    }
                }
                return false
            } else {
                return infos.length > 0
            }
        }

        for (let i = 0; i < infos.length; ++i) {
            const info = infos[i]
            if (info && info.check() && info.callback === callback && info.target === target) {
                return true
            }
        }
        return false
    }

    public removeAll(keyOrTarget: unknown): void {
        const type = typeof keyOrTarget
        if (type === 'string' || type === 'number') {
            // remove by key
            const list = this._callbackTable && this._callbackTable[keyOrTarget as string | number]
            if (list) {
                if (list.isInvoking) {
                    list.cancelAll()
                } else {
                    list.clear()
                    callbackListPool.free(list)
                    delete this._callbackTable[keyOrTarget as string | number]
                }
            }
        } else if (keyOrTarget) {
            // remove by target
            for (const key in this._callbackTable) {
                const list = this._callbackTable[key]!
                if (list.isInvoking) {
                    const infos = list.callbackInfos
                    for (let i = 0; i < infos.length; ++i) {
                        const info = infos[i]
                        if (info && info.target === keyOrTarget) {
                            list.cancel(i)
                        }
                    }
                } else {
                    list.removeByTarget(keyOrTarget)
                }
            }
        }
    }

    public off(key: EventTypeClass, callback?: AnyFunction, target?: unknown): void {
        const list = this._callbackTable && this._callbackTable[key]
        if (list) {
            const infos = list.callbackInfos
            if (callback) {
                for (let i = 0; i < infos.length; ++i) {
                    const info = infos[i]
                    if (info && info.callback === callback && info.target === target) {
                        list.cancel(i)
                        break
                    }
                }
            } else {
                this.removeAll(key)
            }
        }
        this._offCallback?.()
    }

    public emit(key: EventTypeClass, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void {
        const list: CallbackList = this._callbackTable && this._callbackTable[key]!
        if (list) {
            const rootInvoker = !list.isInvoking
            list.isInvoking = true

            const infos = list.callbackInfos
            for (let i = 0, len = infos.length; i < len; ++i) {
                const info = infos[i]
                if (info) {
                    const callback = info.callback
                    const target = info.target
                    // Pre off once callbacks to avoid influence on logic in callback
                    if (info.once) {
                        this.off(key, callback, target)
                    }
                    // Lazy check validity of callback target,
                    // if target is CCObject and is no longer valid, then remove the callback info directly
                    if (!info.check()) {
                        this.off(key, callback, target)
                    } else if (target) {
                        callback.call(target, arg0, arg1, arg2, arg3, arg4)
                    } else {
                        callback(arg0, arg1, arg2, arg3, arg4)
                    }
                }
            }

            if (rootInvoker) {
                list.isInvoking = false
                if (list.containCanceled) {
                    list.purgeCanceled()
                }
            }
        }
    }

    public clear(): void {
        for (const key in this._callbackTable) {
            const list = this._callbackTable[key]
            if (list) {
                list.clear()
                callbackListPool.free(list)
                delete this._callbackTable[key]
            }
        }
    }
}