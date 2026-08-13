import { _decorator, Prefab, UITransform } from 'cc';
import { PipelineComponent } from './PipelineComponent';
const { ccclass, property } = _decorator;

@ccclass('Tutor')
export class Tutor extends PipelineComponent {
    @property(UITransform)
    topUI: UITransform
    @property(Prefab)
    fingerPrefab: Prefab
}
