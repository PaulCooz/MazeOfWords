import { _decorator, Component, EventTarget, Node } from 'cc';
import { Level } from './Level'
const { ccclass, property } = _decorator;

@ccclass('PipelineComponent')
export abstract class PipelineComponent extends Component {
    public setup?(level: Level): void
}
