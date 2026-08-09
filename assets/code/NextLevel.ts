import { _decorator, Button, Tween, tween, Vec3 } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { LevelChangeEvent } from './Common'
const { ccclass, property } = _decorator

@ccclass('NextLevel')
export class NextLevel extends PipelineComponent {
    @property(Button)
    button: Button

    readonly defaultScale = new Vec3()

    anim: Tween

    awake() {
        this.defaultScale.set(this.node.scale)
        this.button.node.on(Button.EventType.CLICK, this.onClick, this)

        this.hide(false)
    }

    levelFinish() {
        this.show()
    }

    private onClick() {
        this.hide(true)
        this.node.dispatchEvent(new LevelChangeEvent())
    }

    private show() {
        this.node.scale = Vec3.ZERO

        if (this.anim?.running)
            this.anim.stop()

        this.anim = tween(this.node)
            .to(0.3, { scale: this.defaultScale }, { easing: 'backOut' })
            .call(() => this.button.interactable = true)
            .start()
    }

    private hide(animated: boolean) {
        if (this.anim?.running)
            this.anim.stop()
        this.button.interactable = false // fix button's transition

        if (animated) {
            this.anim = tween(this.node)
                .to(0.2, { scale: Vec3.ZERO }, { easing: 'sineIn' })
                .start()
        } else {
            this.node.scale = Vec3.ZERO
        }
    }
}

