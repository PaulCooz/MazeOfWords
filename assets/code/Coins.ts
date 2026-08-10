import { _decorator, Component, Label, Node } from 'cc';
import { PipelineComponent } from './PipelineComponent';
import { PlayerStorage } from './PlayerStorage';
const { ccclass, property } = _decorator;

@ccclass('Coins')
export class Coins extends PipelineComponent {
    @property(Label)
    label: Label

    public awake(): void {
        this.label.string = PlayerStorage.coins.value.toString()
    }
}
