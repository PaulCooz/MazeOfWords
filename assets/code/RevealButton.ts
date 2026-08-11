import { _decorator, Button, Tween, tween, Vec3, Widget } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Level } from './Level'
const { ccclass, property } = _decorator

@ccclass('RevealButton')
export abstract class RevealButton extends PipelineComponent {
    @property(Button)
    button: Button
    @property(Widget)
    widget: Widget

    private anim: Tween

    awake() {
        this.button.node.on(Button.EventType.CLICK, this.onClick, this)
    }

    levelStart(_level: Level) {
        this.hide(false)
    }

    protected abstract onClick(): void

    protected show() {
        if (this.anim?.running)
            this.anim.stop()

        this.node.setScale(Vec3.ONE)
        this.widget.updateAlignment()
        this.node.setScale(Vec3.ZERO)

        this.anim = tween(this.node)
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .call(() => this.button.interactable = true)
            .start()
    }

    protected hide(animated: boolean) {
        if (this.anim?.running)
            this.anim.stop()
        this.button.interactable = false

        if (animated) {
            this.anim = tween(this.node)
                .to(0.15, { scale: Vec3.ZERO }, { easing: 'backIn' })
                .start()
        } else {
            this.node.scale = Vec3.ZERO
        }
    }
}
