import { _decorator, Button, Component, Node, Sprite, Vec3 } from 'cc'
import { PipelineComponent } from './PipelineComponent'
const { ccclass, property } = _decorator

@ccclass('NextLevel')
export class NextLevel extends PipelineComponent {
    @property(Sprite)
    sprite: Sprite

    readonly defaultScale = new Vec3()

    awake() {
        this.defaultScale.set(this.node.scale)
        this.node.scale = Vec3.ZERO
    }

    // TODO show the button on level finish and start next level on click
}


