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

    public levelStart(level: Level): void {
        this.level = level

        PlayerStorage.lang.onChange.append(this.updateLabel, this)
    }

    private updateLabel() {
        this.label.string = `${localize("Level")}: ${this.level.index + 1}`
    }
}
