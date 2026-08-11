import { _decorator, Label } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { PlayerStorage } from './PlayerStorage'
import { labelCounterTween } from './self contained/Utils'
const { ccclass, property } = _decorator

@ccclass('Coins')
export class Coins extends PipelineComponent {
    @property(Label)
    label: Label

    awake() {
        this.label.string = PlayerStorage.coins.value.toString()

        PlayerStorage.coins.onChange.append(this.coinsChanged, this)
    }

    private coinsChanged(newValue: number) {
        labelCounterTween(this.label, newValue).start()
    }
}
