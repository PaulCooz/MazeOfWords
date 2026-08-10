import { _decorator, Label } from 'cc';
import { PipelineComponent } from './PipelineComponent';
import { Level } from './Level';
const { ccclass, property } = _decorator;

@ccclass('LevelLabel')
export class LevelLabel extends PipelineComponent {
    @property(Label)
    label: Label

    public levelStart(level: Level): void {
        this.label.string = `level: ${level.index + 1}`
    }
}
