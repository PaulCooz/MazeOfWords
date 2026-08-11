import { _decorator, Component } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
import { HintCost, LevelChangeEvent, LevelCompleteEvent, OpenedLetterEvent, OpenLetterEvent } from './Common'
import { Level } from './Level'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []

    private level: Level

    async onLoad() {
        PlayerStorage.clearAll() // for debug

        this.node.on(LevelCompleteEvent.Name, this.levelComplete, this)
        this.node.on(LevelChangeEvent.Name, this.levelNext, this)
        this.node.on(OpenLetterEvent.Name, this.openLetter, this)
        this.node.on(OpenedLetterEvent.Name, this.openedLetter, this)

        PlayerStorage.lang.onChange.append(this.startLevel, this)

        for (const p of this.pipeline) {
            p.awake?.()
        }

        await this.startLevel()
    }

    private async startLevel() {
        const index = PlayerStorage.levelIndex.value
        this.level = await createLevel(PlayerStorage.lang.value, index)
        for (const p of this.pipeline) {
            p.levelStart?.(this.level)
        }
        if (this.level.allLettersOpened)
            this.levelComplete()
    }

    private openLetter(event: OpenLetterEvent) {
        PlayerStorage.coins.value -= HintCost
        this.level.openLetterIndexes.push(event.wordIndex)
    }
    private openedLetter() {
        if (this.level.allLettersOpened) {
            this.levelComplete()
        } else {
            this.level.saveAsCurr()
        }
    }

    private levelComplete() {
        const lenToWordIndex = PlayerStorage.getLenToWordIndex(this.level.locale)
        const len = this.level.word.length
        lenToWordIndex[len] = (lenToWordIndex[len] ?? 0) + 1
        PlayerStorage.lenToWordIndexes.save()

        for (const p of this.pipeline) {
            p.levelFinish?.()
        }
    }

    private async levelNext() {
        const locale = PlayerStorage.lang.value
        PlayerStorage.setPrevLevel(locale, PlayerStorage.getCurrLevel(locale))
        PlayerStorage.levelIndex.value++
        PlayerStorage.setCurrLevel(locale, undefined)

        await this.startLevel()
    }
}
