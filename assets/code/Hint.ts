import { _decorator, Button, Label, UITransform } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Grid } from './level/Grid'
import { Level } from './level/Level'
import { PlayerStorage } from './PlayerStorage'
import { OpenedLetterEvent } from './Common'
import { Config } from './Config'
import { toPromise } from './self contained/Utils'
import { Delegate } from './self contained/Delegate'
import { Coins } from './Coins'
const { ccclass, property } = _decorator

@ccclass('Hint')
export class Hint extends PipelineComponent {
    @property(Button)
    button: Button
    @property(Grid)
    grid: Grid

    @property(Label)
    countLabel: Label
    @property(Coins)
    coins: Coins
    @property(UITransform)
    topUI: UITransform

    private level: Level
    private busy: boolean

    readonly onNoCoins = new Delegate()

    awake() {
        this.button.node.on(Button.EventType.CLICK, this.onClick, this)
        this.countLabel.string = Config.hintCost.toString()
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
            this.onNoCoins.emit()
            this.busy = false
            return
        }

        const cell = this.grid.getWordCell(wordIndex)
        await toPromise(this.coins.subCoin(
            cell.node.worldPosition, 0.1,
            Config.hintCost,
            () => {
                this.level.openLetterIndexes.push(wordIndex)
                cell.setHinted(this.level.directionNextTo(wordIndex), true)
            }
        ))

        this.node.dispatchEvent(new OpenedLetterEvent())

        this.busy = false
    }
}
