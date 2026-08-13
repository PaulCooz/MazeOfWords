import { _decorator, AudioClip, instantiate, Label, math, Prefab, Sprite, Tween, tween, UITransform, Vec3 } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { PlayerStorage } from './PlayerStorage'
import { GridInput } from './level/GridInput'
import { WordResult } from './Common'
import { GridCell } from './level/GridCell'
import { Config } from './Config'
import { Level } from './level/Level'
import { labelCounterTween } from './self contained/Utils'
import { Rand } from './self contained/Rand'
import { Audio } from './Audio'
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

    @property([AudioClip])
    audioClips: AudioClip[] = []

    private level: Level
    private rand: Rand
    private prevCoins: number

    awake() {
        this.rand = new Rand()
        this.prevCoins = PlayerStorage.coins.value
        this.label.string = this.prevCoins.toString()

        PlayerStorage.coins.onChange.append(this.coinsChanged, this)
        this.gridInput.onWordEnter.append(this.tryReward, this)
    }

    public levelStart(level: Level): void {
        this.level = level
    }

    private coinsChanged(newValue: number) {
        const diff = Math.abs(newValue - this.prevCoins)
        if (diff == 0)
            return
        this.prevCoins = newValue

        Tween.stopAllByTarget(this.label)

        const duration = (diff - 1) / 30
        if (duration <= 0)
            this.label.string = newValue.toString()
        else
            labelCounterTween(this.label, newValue, duration).start()

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
            const t = Math.round(math.lerp(0, cells.length - 1, i / Math.max(amount - 1, 1)))
            this.addCoin(cells[t].node.worldPosition, 0.1 + i * 0.1)
        }
    }

    public addCoin(from: Vec3, delay: number, amount = 1, beforeHide?: () => void) {
        return this.flyCoinFromTo(from, this.coinIcon.node.worldPosition, delay, amount, beforeHide)
    }

    public subCoin(to: Vec3, delay: number, amount = 1, beforeHide?: () => void) {
        return this.flyCoinFromTo(this.coinIcon.node.worldPosition, to, delay, -amount, beforeHide)
    }

    private flyCoinFromTo(from: Vec3, to: Vec3, delay: number, inc: number, beforeHide?: () => void) {
        const coin = instantiate(this.coinPrefab)
        coin.setParent(this.topUI.node)
        coin.worldPosition = from
        coin.scale = Vec3.ZERO

        if (inc < 0)
            Audio.playSoundRand(this.audioClips, 0.1)

        // curved by midpoint + normal
        const l = this.rand.range(0.1, 0.3)
        const sub = new Vec3(to.x - from.x, to.y - from.y)
        const mid = new Vec3(from.x + l * sub.x, from.y + l * sub.y)
        const norm = sub.normalize()
        const skew = this.rand.range(0, 300), sign = this.rand.chance(50) ? +skew : -skew
        mid.y += -sign * norm.x
        mid.x += sign * norm.y

        const dur = Vec3.distance(from, to) / 2000.0
        const tv0 = sub, tv1 = new Vec3()
        return tween(coin)
            .to(delay, { scale: Vec3.ONE }, { easing: 'backOut' })
            .to(dur, {}, {
                easing: 'quartIn',
                onUpdate(_, ratio) {
                    coin.worldPosition = Vec3.lerp(tv0,
                        Vec3.lerp(tv0, from, mid, ratio),
                        Vec3.lerp(tv1, mid, to, ratio),
                        ratio
                    )
                },
            })
            .call(() => {
                PlayerStorage.coins.value += inc
                if (inc > 0)
                    Audio.playSoundRand(this.audioClips, 0.1)
                beforeHide?.()
            })
            .to(0.2, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .destroySelf()
            .start()
    }
}
