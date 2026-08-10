import { _decorator, Canvas, Label } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { PlayerStorage } from './PlayerStorage'
import { OpenLetterEvent } from './Common'
import { labelCounterTween } from './self contained/Utils'
const { ccclass, property } = _decorator

@ccclass('Coins')
export class Coins extends PipelineComponent {
    @property(Label)
    label: Label

    awake() {
        this.refresh(false)

        let n = this.node // TODO sub to storage property callback
        while (n) {
            if (n.getComponent(Canvas)) {
                n.on(OpenLetterEvent.Name, () => this.refresh(true), this)
                break
            }
            n = n.parent
        }
    }

    private refresh(animated: boolean) {
        const value = PlayerStorage.coins.value
        if (animated)
            labelCounterTween(this.label, value).start()
        else
            this.label.string = value.toString()
    }
}
