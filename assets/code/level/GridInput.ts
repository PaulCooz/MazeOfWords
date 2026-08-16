import { _decorator, AudioClip, Color, EventTouch, Input, Label, NodeEventType, tween, Tween, Vec3 } from 'cc'
import { globalInput } from '../self contained/GlobalInput'
import { Grid } from './Grid'
import { Level } from './Level'
import { GridCell } from './GridCell'
import { PipelineComponent } from '../PipelineComponent'
import { Direction, LevelCompleteEvent, WordResult } from '../Common'
import { Delegate } from '../self contained/Delegate'
import { Audio } from '../Audio'
import { isWordExist } from './LevelGenerator'
import { toPromise } from '../self contained/Utils'
const { ccclass, property } = _decorator

const SelectScale = 0.95
const SelectDuration = 0.1
const ResultDuration = 0.3

const ColorSelected = new Color(130, 200, 255)
const ColorCorrect = new Color(100, 230, 130)
const ColorBonus = new Color(255, 210, 80)
const ColorWrong = new Color(255, 90, 90)

@ccclass('GridInput')
export class GridInput extends PipelineComponent {
    @property(Grid)
    grid: Grid
    @property(Label)
    wordLabel: Label

    @property([AudioClip])
    audioClips: AudioClip[] = []

    @property([AudioClip])
    wordWrongClips: AudioClip[] = []
    @property([AudioClip])
    wordBonusClips: AudioClip[] = []
    @property([AudioClip])
    wordCorrectClips: AudioClip[] = []
    private wordResToClip: { [key in WordResult]: AudioClip[] }

    private level: Level
    private pressing: boolean
    private busy: boolean
    private completed: boolean
    private path: GridCell[] = []

    get word() {
        return this.path.map(c => c.originalLetter).join('')
    }

    readonly onWordEnter = new Delegate<[result: WordResult, word: string, cells: GridCell[]]>()

    awake() {
        this.wordLabel.string = ""

        globalInput.on(Input.EventType.TOUCH_END, this.touchEnd, this)
        globalInput.on(Input.EventType.TOUCH_CANCEL, this.touchEnd, this)
        globalInput.on(Input.EventType.TOUCH_MOVE, this.touchMove, this)

        this.wordResToClip = {
            ["wrong"]: this.wordWrongClips,
            ["bonus"]: this.wordBonusClips,
            ["correct"]: this.wordCorrectClips,
        }
    }

    levelStart(level: Level) {
        this.level = level
        this.completed = false
        this.busy = false
        this.pressing = false
        this.clearPath(false)
        this.grid.cells.forEach(cell => this.on(cell))
    }

    levelFinish() {
        this.completed = true
    }

    private on(cell: GridCell) {
        if (cell.empty)
            return

        cell.node.on(NodeEventType.TOUCH_START, () => this.touch(cell), this)
        cell.node.on(NodeEventType.TOUCH_MOVE, this.touchMove, this)
        cell.node.on(NodeEventType.TOUCH_END, this.touchEnd, this)
        cell.node.on(NodeEventType.TOUCH_CANCEL, this.touchEnd, this)
    }

    private touch(cell: GridCell) {
        if (this.busy || this.completed)
            return

        this.pressing = true
        this.clearPath(false)
        this.enter(cell)
    }

    private touchMove(event: EventTouch) {
        if (!this.pressing || this.busy || this.completed)
            return

        const loc = event.getLocation()
        for (const cell of this.grid.cells) {
            if (cell.empty)
                continue
            if (cell.UITransform.hitTest(loc)) {
                this.enter(cell)
                return
            }
        }
    }

    private enter(cell: GridCell) {
        if (!this.pressing || this.busy || this.completed)
            return

        const last = this.path[this.path.length - 1]
        const prev = this.path[this.path.length - 2]

        if (cell == last)
            return
        if (cell == prev) {
            const removed = this.path.pop()
            this.playSound()
            this.updateLabel()
            prev.setInputDirection(null)
            removed.setInputDirection(null)
            this.deselectCell(removed)
            return
        }

        if (this.path.includes(cell))
            return
        if (this.path.length > 0 && !this.isAdjacent(last, cell))
            return

        if (last)
            last.setInputDirection(this.directionBetween(last, cell))

        this.path.push(cell)
        this.playSound()
        this.updateLabel()
        this.selectCell(cell)
    }

    private async touchEnd() {
        if (!this.pressing || this.busy)
            return

        this.pressing = false
        if (this.path.length == 0)
            return

        const cells = [...this.path]
        const word = this.word
        const result = this.evaluateWord(word)
        Audio.playSoundRand(this.wordResToClip[result], 0.6)

        this.busy = true
        this.onWordEnter.emit([result, word, cells])
        await this.playResult(result, cells)

        if (result == 'correct') {
            for (const cell of cells)
                cell.pressed = false
            this.path.length = 0
            this.updateLabel()
            this.node.dispatchEvent(new LevelCompleteEvent())
        } else {
            this.clearPath(result != 'wrong')

            if (result == 'bonus' && !this.level.bonuses.includes(word)) {
                this.level.bonuses.push(word)
                this.level.saveAsCurr()
            }
        }

        this.busy = false
    }

    private evaluateWord(word: string): WordResult {
        const lw = this.level.word
        if (word == lw)
            return 'correct'
        if (isWordExist(word))
            return word.length == lw.length ? 'correct' : 'bonus'
        return 'wrong'
    }

    private isAdjacent(a: GridCell, b: GridCell) {
        return Math.abs(a.i - b.i) + Math.abs(a.j - b.j) == 1
    }

    private directionBetween(a: GridCell, b: GridCell): Direction {
        if (a.j > b.j) return Direction.Right
        if (a.j < b.j) return Direction.Left
        if (a.i > b.i) return Direction.Up
        if (a.i < b.i) return Direction.Down
    }

    private applyPathDirections(cells: GridCell[]) {
        for (let i = 0; i < cells.length; i++) {
            const d = i + 1 < cells.length ? this.directionBetween(cells[i], cells[i + 1]) : undefined
            cells[i].setInputDirection(d)
        }
    }

    private updateLabel() {
        this.wordLabel.string = this.word.toUpperCase()
    }

    private playSound() {
        const p = this.path.length, c = this.audioClips.length
        Audio.playSound(this.audioClips[p < c ? p : c - 1], 0.3)
    }

    private selectCell(cell: GridCell) {
        this.stopCellTweens(cell)
        cell.pressed = true
        const scale = cell.defaultScale.clone().multiplyScalar(SelectScale)
        tween(cell.node)
            .to(SelectDuration, { scale }, { easing: 'backOut' })
            .start()
        tween(cell.background)
            .to(SelectDuration, { color: ColorSelected })
            .start()
    }

    private deselectCell(cell: GridCell) {
        this.stopCellTweens(cell)
        cell.pressed = false
        cell.setInputDirection(null)
        tween(cell.node)
            .to(SelectDuration, { scale: cell.defaultScale }, { easing: 'sineOut' })
            .start()
        tween(cell.background)
            .to(SelectDuration, { color: cell.idleColor })
            .start()
    }

    private resetCell(cell: GridCell) {
        this.stopCellTweens(cell)
        cell.pressed = false
        cell.setInputDirection(null)
        cell.node.scale = cell.defaultScale
        cell.background.color = cell.idleColor
    }

    private clearPath(animated: boolean) {
        while (this.path.length > 0) {
            const cell = this.path.pop()
            if (animated)
                this.deselectCell(cell)
            else
                this.resetCell(cell)
        }
        this.updateLabel()
    }

    private stopCellTweens(cell: GridCell) {
        Tween.stopAllByTarget(cell.node)
        Tween.stopAllByTarget(cell.background)
    }

    private playResult(result: WordResult, cells: GridCell[]) {
        switch (result) {
            case 'correct':
                this.applyPathDirections(cells)
                return this.animateAccept(cells, ColorCorrect)
            case 'bonus':
                return this.animateAccept(cells, ColorBonus)
            case 'wrong':
                return this.animateDecline(cells)
        }
    }

    private animateAccept(cells: GridCell[], color: Color) {
        return Promise.all(cells.map(cell => {
            this.stopCellTweens(cell)
            const pulse = cell.defaultScale.clone().multiplyScalar(1.05)
            return toPromise(tween(cell.node)
                .parallel(
                    tween(cell.background)
                        .to(ResultDuration, { color }),
                    tween(cell.node)
                        .to(ResultDuration * 0.5, { scale: pulse }, { easing: 'backOut' })
                        .to(ResultDuration * 0.5, { scale: cell.defaultScale }, { easing: 'sineIn' })
                )
            )
        }))
    }

    private animateDecline(cells: GridCell[]) {
        return Promise.all(cells.map(cell => {
            this.stopCellTweens(cell)
            const pos = cell.node.position.clone()
            return toPromise(tween(cell.node)
                .parallel(
                    tween(cell.background)
                        .to(0.1, { color: ColorWrong })
                        .to(0.15, { color: cell.idleColor }),
                    tween(cell.node)
                        .to(0.05, { position: new Vec3(pos.x - 8, pos.y, pos.z) })
                        .to(0.05, { position: new Vec3(pos.x + 8, pos.y, pos.z) })
                        .to(0.05, { position: new Vec3(pos.x - 8, pos.y, pos.z) })
                        .to(0.05, { position: new Vec3(pos.x + 8, pos.y, pos.z) })
                        .to(0.05, { position: pos })
                        .to(0.1, { scale: cell.defaultScale }, { easing: 'sineOut' }),
                )
            )
        }))
    }
}
