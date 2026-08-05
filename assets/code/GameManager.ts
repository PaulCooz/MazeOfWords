import { _decorator, Component, tween } from 'cc';
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []

    async onLoad() {
        const level = await createLevel("ru", PlayerStorage.levelIndex.value)
        for(const p of this.pipeline) {
            p.setup(level)
        }
    }
}


