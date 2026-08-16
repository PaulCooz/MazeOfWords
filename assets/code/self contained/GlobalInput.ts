import { Event, EventTarget, input } from 'cc'

// crutch for input. I hope this will be fixed in future engine versions

const BeforeUi = 2

type EngineInput = typeof input & {
    _registerEventDispatcher(dispatcher: {
        priority: number
        dispatchEvent(event: Event): boolean
        onThrowException(): void
    }): void
}

class GlobalInput {
    private readonly events = new EventTarget()

    constructor() {
        const register = (input as EngineInput)._registerEventDispatcher
        if (typeof register != 'function')
            throw new Error('globalInput: engine _registerEventDispatcher missing')

        register.call(input, {
            priority: BeforeUi,
            dispatchEvent: (event: Event) => {
                const stopped = event.propagationStopped
                const immediate = event.propagationImmediateStopped
                this.events.emit(event.type, event)
                event.propagationStopped = stopped
                event.propagationImmediateStopped = immediate
                return true
            },
            onThrowException() { },
        })
    }

    on(type: string, callback: (...args: any[]) => void, target?: object) {
        this.events.on(type, callback, target)
        return callback
    }

    off(type: string, callback?: (...args: any[]) => void, target?: object) {
        this.events.off(type, callback, target)
    }

    once(type: string, callback: (...args: any[]) => void, target?: object) {
        this.events.once(type, callback, target)
        return callback
    }
}

export const globalInput = new GlobalInput()
