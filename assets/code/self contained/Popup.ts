import { _decorator, Component, Sprite, tween, Tween } from 'cc'
import { Delegate } from './Delegate'
import { toPromise } from './Utils'
const { ccclass, property } = _decorator

@ccclass('Popup')
export abstract class Popup<TResult = void> extends Component {
    private showing = false
    private closed = false

    protected result: TResult

    private _onClosed: Delegate<TResult>
    get onClosed() {
        if (!this._onClosed)
            this._onClosed = new Delegate<TResult>()
        return this._onClosed
    }

    @property(Sprite)
    fade: Sprite
    @property(Sprite)
    panel: Sprite

    setup(params: object) {
        Object.assign(this, params)
    }

    show(): Tween {
        const anim = tween(this).sequence(
            tween(this.fade).to(0.3, { color: this.fade.color })
        )
        this.showing = true
    }

    hide(): Tween {
        // TODO tween animation
        this.showing = false
    }

    async close(result?: TResult) {
        if (this.closed)
            return
        this.closed = true

        if (this.showing) {
            await toPromise(this.hide())
        }

        if (result != undefined)
            this.result = result
        if (this._onClosed)
            this._onClosed.emit(this.result)

        this.node.destroy()
    }
}
