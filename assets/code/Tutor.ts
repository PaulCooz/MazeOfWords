import { _decorator, Canvas, instantiate, NodeEventType, Prefab, UITransform } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Grid } from './Grid'
import { GridInput } from './GridInput'
import { Hint } from './Hint'
import { RewardedAd } from './RewardedAd'
import { TutorFinger } from './TutorFinger'
import { Level } from './Level'
import { WordResult } from './Common'
import { GridCell } from './GridCell'
import { Toast } from './self contained/Toast'
import { localize } from './Lang'
import { waitSec } from './self contained/Utils'
import { PlayerStorage } from './PlayerStorage'
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
    @property(Canvas)
    canvas: Canvas

    private finger: TutorFinger
    private level: Level
    private wrongs: number
    private wrongsToTrace: number
    private pointingAd = false

    awake() {
        this.canvas.node.on(NodeEventType.MOUSE_DOWN, this.dismiss, this)

        this.hint.onNoCoins.append(this.onNoCoins, this)
        PlayerStorage.coins.onChange.append(this.onCoins, this)
    }

    levelStart(level: Level) {
        this.dismiss()

        this.wrongs = 0
        this.wrongsToTrace = 3
        this.level = level

        if (level.index < 2) {
            if (level.index == 0)
                waitSec(1)
                    .then(() => Toast.push(localize("TutorTrace")))

            this.showTrace()
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
