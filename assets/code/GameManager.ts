import { _decorator, Component } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
import { HintCost, LevelChangeEvent, LevelCompleteEvent, Locale, OpenLetterEvent } from './Common'
import { Level } from './Level'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []

    private level: Level
    private locale: Locale = "ru"

    async onLoad() {
        PlayerStorage.clearAll()

        this.node.on(LevelCompleteEvent.Name, this.levelComplete, this)
        this.node.on(LevelChangeEvent.Name, this.levelNext, this)
        this.node.on(OpenLetterEvent.Name, this.openLetter, this)

        for (const p of this.pipeline) {
            p.awake?.()
        }

        await this.startLevel(PlayerStorage.levelIndex.value)
    }

    private async startLevel(index: number) {
        this.level = await createLevel(this.locale, index)
        for (const p of this.pipeline) {
            p.levelStart?.(this.level)
        }
    }

    private openLetter(event: OpenLetterEvent) {
        PlayerStorage.coins.value -= HintCost

        this.level.openLetterIndexes.push(event.wordIndex)
        if (this.level.allLettersOpened) {
            this.levelComplete()
        } else {
            this.level.saveAsCurr()
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
