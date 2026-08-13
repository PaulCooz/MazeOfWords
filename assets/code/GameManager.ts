import { _decorator, Component } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { createLevel } from './level/LevelGenerator'
import { PlayerStorage } from './PlayerStorage'
import { LevelChangeEvent, LevelCompleteEvent, Locale, OpenedLetterEvent } from './Common'
import { Level } from './level/Level'
import { Config } from './Config'
import { CloudSave } from './CloudSave'
import { initYandex, loadingReady, setGamePaused, setLeaderboardScore, yandexLang } from './self contained/Yandex'
import { PopupManager } from './self contained/PopupManager'
import { Toast } from './self contained/Toast'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property([PipelineComponent])
    pipeline: PipelineComponent[] = []
    @property(PopupManager)
    popupManager: PopupManager
    @property(Toast)
    toast: Toast

    private level: Level
    private playing = false

    async onLoad() {
        this.popupManager.setup()
        this.toast.setup()

        this.node.on(LevelCompleteEvent.Name, this.levelComplete, this)
        this.node.on(LevelChangeEvent.Name, this.levelNext, this)
        this.node.on(OpenedLetterEvent.Name, this.openedLetter, this)
        PopupManager.onPushPopup.append(this.checkPause, this)
        PopupManager.onPopPopup.append(this.checkPause, this)

        await initYandex()
        await Promise.all([Config.load(), CloudSave.pull()])

        if (!PlayerStorage.langChosen.value)
            PlayerStorage.lang.value = yandexLang() as Locale

        CloudSave.startPushLoop()

        PlayerStorage.lang.onChange.append(this.startLevel, this)

        for (const p of this.pipeline) {
            p.awake?.()
        }

        loadingReady()
        submitLevelScore()
        await this.startLevel()
    }

    private async startLevel() {
        const index = PlayerStorage.levelIndex.value
        this.level = await createLevel(PlayerStorage.lang.value, index)
        for (const p of this.pipeline) {
            p.levelStart?.(this.level)
        }

        this.playing = true
        this.checkPause()

        if (this.level.allLettersOpened)
            this.levelComplete()
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
        this.playing = false
        this.checkPause()
    }

    private async levelNext() {
        const locale = PlayerStorage.lang.value
        PlayerStorage.setPrevLevel(locale, PlayerStorage.getCurrLevel(locale))
        PlayerStorage.levelIndex.value++
        PlayerStorage.setCurrLevel(locale, undefined)
        submitLevelScore()

        await this.startLevel()
    }

    private checkPause() {
        setGamePaused(!this.playing || !PopupManager.empty())
    }
}

function submitLevelScore() {
    setLeaderboardScore("level", PlayerStorage.levelIndex.value + 1)
}
