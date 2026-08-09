import { _decorator, Component } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
import { clearAllStorage } from './self contained/Storage'
import { LevelChangeEvent, LevelCompleteEvent, Locale } from './Common'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []

    private locale: Locale = "ru"

    async onLoad() {
        clearAllStorage()

        this.node.on(LevelCompleteEvent.Name, this.levelComplete, this)
        this.node.on(LevelChangeEvent.Name, this.levelNext, this)

        for (const p of this.pipeline) {
            p.awake?.()
        }

        await this.startLevel(PlayerStorage.levelIndex.value)
    }

    private async startLevel(index: number) {
        const level = await createLevel(this.locale, index)
        for (const p of this.pipeline) {
            p.levelStart?.(level)
        }
    }

    private levelComplete() {
        for (const p of this.pipeline) {
            p.levelFinish?.()
        }
    }

    private async levelNext() {
        PlayerStorage.prevLevel.value = PlayerStorage.currLevel.value
        PlayerStorage.levelIndex.value++
        PlayerStorage.currLevel.value = undefined

        await this.startLevel(PlayerStorage.levelIndex.value)
    }
}
