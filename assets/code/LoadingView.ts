import { _decorator, Component, Sprite, Tween, tween } from 'cc'
import { withA } from './self-contained/Utils'
const { ccclass, property } = _decorator

@ccclass('LoadingView')
export class LoadingView extends Component {
    @property(Sprite)
    back: Sprite
    @property(Sprite)
    radial: Sprite

    private anim: Tween

    public load(): void {
        this.anim = tween(this).sequence(
            tween(this.radial).to(1, { fillStart: 0, fillRange: 1 }, { easing: 'linear' }),
            tween(this.radial).to(1, { fillStart: 1, fillRange: 0 }, { easing: 'linear' }),
            tween(this).call(() => this.radial.fillStart = 0),
        ).repeatForever().start()
    }

    public hide() {
        this.anim.stop()
        tween(this.back)
            .to(0.1, { color: withA(0, this.back.color) })
            .call(() => this.node.destroy())
            .start()
    }
}
