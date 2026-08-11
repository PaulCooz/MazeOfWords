import { _decorator, Component, NodeEventType, Sprite, Tween, tween } from 'cc'
import { Delegate } from './Delegate'
import { toPromise, withA, withY } from './Utils'
const { ccclass, property } = _decorator

@ccclass('Popup')
export abstract class Popup<TResult = void> extends Component {
    private showing = false
    private closed = false
    private anim: Tween

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

    onSetup?(): void
    onClose?(): void

    setup(params?: object) {
        if (params)
            Object.assign(this, params)

        this.fade.node.on(NodeEventType.TOUCH_END, this.close, this)

        if (this.onSetup)
            this.onSetup()
    }

    show() {
        if (this.showing)
            return Promise.resolve()
        this.showing = true

        this.fade.color = withA(0, this.fade.color)
        this.panel.color = withA(0, this.panel.color)
        this.panel.node.position = withY(-1000, this.panel.node.position)

        this.anim?.stop()
        this.anim = tween(this).parallel(
            tween(this.fade).to(0.2, { color: withA(200, this.fade.color) }),
            tween(this.panel).to(0.2, { color: withA(255, this.panel.color) }),
            tween(this.panel.node).to(0.3, { position: withY(0, this.panel.node.position) }, { easing: 'backOut' }),
        )
        return toPromise(this.anim)
    }

    hide() {
        if (!this.showing)
            return Promise.resolve()
        this.showing = false

        this.anim?.stop()
        this.anim = tween(this).parallel(
            tween(this.fade).to(0.3, { color: withA(0, this.fade.color) }),
            tween(this.panel).to(0.2, { color: withA(0, this.panel.color) }),
            tween(this.panel.node).to(0.2, { position: withY(-1000, this.panel.node.position) }, { easing: 'backIn' }),
        )
        return toPromise(this.anim)
    }

    async close(result?: TResult) {
        if (this.closed)
            return
        this.closed = true

        if (this.onClose)
            this.onClose()

        if (this.showing)
            await this.hide()

        if (result != undefined)
            this.result = result
        if (this._onClosed)
            this._onClosed.emit(this.result)

        this.node.destroy()
    }
}
