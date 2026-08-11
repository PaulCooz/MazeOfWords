import { _decorator, Color, Input, input, Label, NodeEventType, tween, Tween, Vec3 } from 'cc'
import { Grid } from './Grid'
import { PipelineComponent } from './PipelineComponent'
import { Level } from './Level'
import { GridCell } from './GridCell'
import { isWordExist } from './LevelGenerator'
import { toPromise } from './self contained/Utils'
import { Direction, LevelCompleteEvent } from './Common'
const { ccclass, property } = _decorator

const SelectScale = 0.95
const SelectDuration = 0.1
const ResultDuration = 0.3

const ColorSelected = new Color(130, 200, 255)
const ColorCorrect = new Color(100, 230, 130)
const ColorBonus = new Color(255, 210, 80)
const ColorWrong = new Color(255, 90, 90)

type WordResult = 'correct' | 'bonus' | 'wrong'

@ccclass('GridInput')
export class GridInput extends PipelineComponent {
    @property(Grid)
    grid: Grid
    @property(Label)
    wordLabel: Label

    private level: Level
    private pressing: boolean
    private busy: boolean
    private completed: boolean
    private path: GridCell[] = []

    get word() {
        return this.path.map(c => c.letter.string).join('')
    }

    awake() {
        this.node.on(NodeEventType.MOUSE_UP, this.mouseUp, this)
        input.on(Input.EventType.MOUSE_UP, this.mouseUp, this)
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

        cell.node.on(NodeEventType.MOUSE_DOWN, () => this.mouseDown(cell), this)
        cell.node.on(NodeEventType.MOUSE_ENTER, () => this.enter(cell), this)
    }

    private mouseDown(cell: GridCell) {
        if (this.busy || this.completed)
            return

        this.pressing = true
        this.clearPath(false)
        this.enter(cell)
    }

    private enter(cell: GridCell) {
        if (!this.pressing || this.busy || this.completed)
            return

        const last = this.path[this.path.length - 1]
        const prev = this.path[this.path.length - 2]

        if (cell == last)
            return
        if (cell == prev) {
            this.updateLabel()
            const removed = this.path.pop()
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
        this.updateLabel()
        this.selectCell(cell)
    }

    private async mouseUp() {
        if (!this.pressing || this.busy)
            return

        this.pressing = false
        if (this.path.length == 0)
            return

        const cells = [...this.path]
        const word = this.word
        const result = this.evaluateWord(word)

        this.busy = true
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
        if (word == this.level.word)
            return 'correct'
        if (isWordExist(word))
            return 'bonus'
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
        this.wordLabel.string = this.word
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
