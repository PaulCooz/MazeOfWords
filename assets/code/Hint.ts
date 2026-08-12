import { _decorator, Button, instantiate, Prefab, Sprite, tween, UITransform, Vec3 } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Grid } from './Grid'
import { Level } from './Level'
import { GridCell } from './GridCell'
import { PlayerStorage } from './PlayerStorage'
import { OpenedLetterEvent, OpenLetterEvent } from './Common'
import { Config } from './Config'
import { toPromise } from './self contained/Utils'
const { ccclass, property } = _decorator

@ccclass('Hint')
export class Hint extends PipelineComponent {
    @property(Button)
    button: Button
    @property(Grid)
    grid: Grid

    @property(Sprite)
    coinIcon: Sprite
    @property(Prefab)
    coinPrefab: Prefab
    @property(UITransform)
    topUI: UITransform

    private level: Level
    private busy: boolean

    awake() {
        this.button.node.on(Button.EventType.CLICK, this.onClick, this)
    }

    levelStart(level: Level) {
        this.level = level
        this.busy = false
        this.button.interactable = true

        this.restoreOpenedLetters()
    }

    private restoreOpenedLetters() {
        for (const wordIndex of this.level.openLetterIndexes) {
            const cell = this.grid.getWordCell(wordIndex)
            cell.setHinted(this.level.directionNextTo(wordIndex))
        }
    }

    levelFinish() {
        this.button.interactable = false
    }

    private async onClick() {
        if (this.busy)
            return
        const wordIndex = this.level.nextClosedWordI()
        if (wordIndex == -1)
            return

        this.busy = true

        if (PlayerStorage.coins.value < Config.hintCost) {
            await this.showNoCoinsDialog()
            this.busy = false
            return
        }

        const cell = this.grid.getWordCell(wordIndex)
        this.node.dispatchEvent(new OpenLetterEvent(wordIndex))
        await this.flyCoinTo(cell)

        cell.setHinted(this.level.directionNextTo(wordIndex))
        this.node.dispatchEvent(new OpenedLetterEvent())

        this.busy = false
    }

    private showNoCoinsDialog(): Promise<boolean> {
        return undefined // TODO: no-coins popup / rewarded
    }

    private flyCoinTo(cell: GridCell) {
        const coin = instantiate(this.coinPrefab)

        coin.setParent(this.topUI.node)
        coin.worldPosition = this.coinIcon.node.worldPosition
        const dur = Vec3.distance(coin.worldPosition, cell.node.worldPosition) / 2500.0

        return toPromise(
            tween(coin)
                .to(dur, { worldPosition: cell.node.worldPosition })
                .to(0.2, { scale: Vec3.ZERO }, { easing: 'backIn' })
                .destroySelf()
        )
    }
}
