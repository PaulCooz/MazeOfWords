import { _decorator, Button, Component, Node, Sprite, UITransform } from 'cc';
import { PipelineComponent } from './PipelineComponent';
const { ccclass, property } = _decorator;

@ccclass('Hint')
export class Hint extends PipelineComponent {
    @property(Button)
    button: Button

    @property(Sprite)
    coinIcon: Sprite
    @property(UITransform)
    topUI: UITransform

    awake() {
        this.button.node.on(Button.EventType.CLICK, this.onClick, this)
    }

    private onClick() {

    }
}
