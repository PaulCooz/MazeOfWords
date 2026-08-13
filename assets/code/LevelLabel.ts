import { _decorator, Label } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Level } from './Level'
import { localize } from './Lang'
import { PlayerStorage } from './PlayerStorage'
const { ccclass, property } = _decorator

@ccclass('LevelLabel')
export class LevelLabel extends PipelineComponent {
    @property(Label)
    label: Label

    private level: Level

    awake() {
        PlayerStorage.lang.onChange.append(this.updateLabel, this)
    }

    public levelStart(level: Level): void {
        this.level = level
        this.updateLabel()
    }

    private updateLabel() {
        if (!this.level)
            return
        this.label.string = `${localize("LVL")}\n${this.level.index + 1}`
    }
}
