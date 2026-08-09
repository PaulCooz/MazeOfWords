import { _decorator, Component, tween } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
import { clearAllStorage } from './self contained/Storage'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []

    async onLoad() {
        // TODO subscribe to level finish event

        for (const p of this.pipeline) {
            if (p.awake)
                p.awake()
        }

        const level = await createLevel("ru", PlayerStorage.levelIndex.value)
        for (const p of this.pipeline) {
            if (p.levelStart)
                p.levelStart(level)
        }
    }

    private levelFinish() {
        for (const p of this.pipeline) {
            if (p.levelFinish) {
                p.levelFinish()
            }
        }
    }
}


