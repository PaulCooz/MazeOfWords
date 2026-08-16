import { _decorator, Component, EventTarget, Node } from 'cc'
import { Level } from './level/Level'
const { ccclass, property } = _decorator

@ccclass('PipelineComponent')
export abstract class PipelineComponent extends Component {
    public load?(): void

    public awake?(): void

    public levelStart?(level: Level): void
    public levelFinish?(): void
}
