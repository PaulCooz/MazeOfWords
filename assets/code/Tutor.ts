import { _decorator, Input, instantiate, Prefab, UITransform } from 'cc'
import { globalInput } from './self-contained/GlobalInput'
import { PipelineComponent } from './PipelineComponent'
import { Grid } from './level/Grid'
import { GridInput } from './level/GridInput'
import { Hint } from './Hint'
import { RewardedAd } from './RewardedAd'
import { TutorFinger } from './TutorFinger'
import { Level } from './level/Level'
import { WordResult } from './Common'
import { GridCell } from './level/GridCell'
import { Toast } from './self-contained/Toast'
import { localize } from './Lang'
import { waitSec } from './self-contained/Utils'
import { PlayerStorage } from './PlayerStorage'
import { PopupManager } from './self-contained/PopupManager'
const { ccclass, property } = _decorator

@ccclass('Tutor')
export class Tutor extends PipelineComponent {
    @property(UITransform)
    topUI: UITransform
    @property(Prefab)
    fingerPrefab: Prefab

    @property(Grid)
    grid: Grid
    @property(GridInput)
    gridInput: GridInput
    @property(Hint)
    hint: Hint
    @property(RewardedAd)
    rewardedAd: RewardedAd

    private finger: TutorFinger
    private level: Level
    private wrongs: number
    private wrongsToTrace: number
    private pointingAd = false

    awake() {
        globalInput.on(Input.EventType.TOUCH_START, this.dismiss, this)

        this.hint.onNoCoins.append(this.onNoCoins, this)
        PlayerStorage.coins.onChange.append(this.onCoins, this)
    }

    levelStart(level: Level) {
        this.dismiss()

        this.wrongs = 0
        this.wrongsToTrace = 3
        this.level = level

        if (level.index < 2 && PopupManager.empty()) {
            if (level.index == 0)
                waitSec(1)
                    .then(() => Toast.push(localize("TutorTrace")))

            this.showTrace()
        }
        if (level.index == 4) {
            waitSec(1)
                .then(() => Toast.push(localize("TutorBonus")))
        }
        if (level.index < 5)
            this.gridInput.onWordEnter.append(this.onWord, this)
    }

    levelFinish() {
        if (this.level.index < 5)
            this.gridInput.onWordEnter.pop(this.onWord, this)
    }

    private dismiss() {
        this.pointingAd = false
        this.finger?.stop()
        this.finger = null
    }

    private spawn() {
        const finger = instantiate(this.fingerPrefab).getComponent(TutorFinger)
        finger.node.setParent(this.topUI.node)
        return finger
    }

    private onWord(tuple: [result: WordResult, word: string, cells: GridCell[]]) {
        const [result] = tuple
        if (result != 'wrong')
            return

        this.wrongs++
        if (this.wrongs >= this.wrongsToTrace) {
            this.wrongsToTrace *= 3
            this.showTrace()
        }
    }

    private onNoCoins() {
        Toast.push(localize("NoCoinsForHint"))

        this.finger?.stop()
        this.pointingAd = true
        this.finger = this.spawn()
        this.finger.clickTo(this.rewardedAd.node)
    }

    private onCoins() {
        if (!this.pointingAd)
            return
        this.dismiss()
    }

    private async showTrace() {
        await waitSec(0.35)

        this.finger?.stop()
        this.finger = this.spawn()

        const path = []
        for (let i = 0; i < this.level.word.length; i++)
            path.push(this.grid.getWordCell(i).node)
        this.finger.tracePath(path)
    }
}
