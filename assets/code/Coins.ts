import { _decorator, instantiate, Label, math, Prefab, Sprite, Tween, tween, UITransform, Vec3 } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { PlayerStorage } from './PlayerStorage'
import { GridInput } from './GridInput'
import { WordResult } from './Common'
import { GridCell } from './GridCell'
import { Config } from './Config'
import { Level } from './Level'
import { labelCounterTween } from './self contained/Utils'
const { ccclass, property } = _decorator

@ccclass('Coins')
export class Coins extends PipelineComponent {
    @property(Label)
    label: Label
    @property(Sprite)
    coinIcon: Sprite
    @property(Prefab)
    coinPrefab: Prefab
    @property(UITransform)
    topUI: UITransform

    @property(GridInput)
    gridInput: GridInput

    private level: Level

    awake() {
        this.label.string = PlayerStorage.coins.value.toString()

        PlayerStorage.coins.onChange.append(this.coinsChanged, this)
        this.gridInput.onWordEnter.append(this.tryReward, this)
    }

    public levelStart(level: Level): void {
        this.level = level
    }

    private coinsChanged(newValue: number) {
        Tween.stopAllByTarget(this.label)
        labelCounterTween(this.label, newValue).start()
    }

    private tryReward(tuple: [result: WordResult, word: string, cells: GridCell[]]) {
        const [result, word, cells] = tuple

        let amount = 0
        if (result == 'correct')
            amount = Config.correctCoins
        else if (result == 'bonus' && !this.level.bonuses.includes(word))
            amount = Config.bonusCoins
        if (amount <= 0)
            return

        for (let i = 0; i < amount; i++) {
            const t = Math.round(math.lerp(0, cells.length - 1, i / (amount - 1)))
            this.flyCoin(cells[t].node.worldPosition, i * 0.1)
        }
    }

    private flyCoin(from: Vec3, delay: number) {
        const coin = instantiate(this.coinPrefab)
        coin.setParent(this.topUI.node)
        coin.worldPosition = from

        const dest = this.coinIcon.node.worldPosition
        const dur = Vec3.distance(from, dest) / 2000.0

        tween(coin)
            .delay(delay)
            .to(dur, { worldPosition: dest })
            .call(() => PlayerStorage.coins.value += 1)
            .to(0.2, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .destroySelf()
            .start()
    }
}
