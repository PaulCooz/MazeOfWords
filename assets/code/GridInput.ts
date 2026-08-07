import { _decorator, Color, NodeEventType, tween, Tween, Vec3 } from 'cc'
import { Grid } from './Grid'
import { PipelineComponent } from './PipelineComponent'
import { Level } from './Level'
import { GridCell } from './GridCell'
import { isWordExist } from './LevelGenerator'
import { toPromise } from './self contained/Utils'
const { ccclass, property } = _decorator

const SelectScale = 0.95
const SelectDuration = 0.08
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

    private level: Level
    private pressing = false
    private busy = false
    private path: GridCell[] = []

    public setup(level: Level) {
        this.level = level

        this.grid.cells.forEach(cell => this.on(cell))
        this.node.on(NodeEventType.MOUSE_UP, this.mouseUp, this)
    }

    private on(cell: GridCell) {
        cell.node.on(NodeEventType.MOUSE_DOWN, () => this.mouseDown(cell), this)
        cell.node.on(NodeEventType.MOUSE_ENTER, () => this.enter(cell), this)
    }

    private mouseDown(cell: GridCell) {
        if (this.busy)
            return

        this.pressing = true
        this.clearPath(false)
        this.enter(cell)
    }

    private enter(cell: GridCell) {
        if (!this.pressing || this.busy)
            return

        const last = this.path[this.path.length - 1]
        const prev = this.path[this.path.length - 2]

        if (cell == last)
            return
        if (cell == prev) {
            this.deselectCell(this.path.pop()!)
            return
        }

        if (this.path.includes(cell))
            return
        if (this.path.length > 0 && !this.isAdjacent(last, cell))
            return

        this.path.push(cell)
        this.selectCell(cell)
    }

    private async mouseUp() {
        if (!this.pressing || this.busy)
            return

        this.pressing = false
        if (this.path.length == 0)
            return

        const word = this.path.map(c => c.letter.string).join('')
        const result = this.evaluateWord(word)

        this.busy = true
        await this.playResult(result)
        this.clearPath(result != 'wrong')

        if (result == 'bonus') {
            this.level.bonuses.push(word)
            this.level.saveAsCurr()
        }

        this.busy = false
    }

    private evaluateWord(word: string): WordResult {
        if (word == this.level.word)
            return 'correct'
        if (!this.level.bonuses.includes(word) && word.length > 1 && isWordExist(word))
            return 'bonus'
        return 'wrong'
    }

    private isAdjacent(a: GridCell, b: GridCell) {
        return Math.abs(a.i - b.i) + Math.abs(a.j - b.j) == 1
    }

    private selectCell(cell: GridCell) {
        this.stopCellTweens(cell)
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
        tween(cell.node)
            .to(SelectDuration, { scale: cell.defaultScale }, { easing: 'sineOut' })
            .start()
        tween(cell.background)
            .to(SelectDuration, { color: cell.defaultColor })
            .start()
    }

    private resetCell(cell: GridCell) {
        this.stopCellTweens(cell)
        cell.node.scale = cell.defaultScale
        cell.background.color = cell.defaultColor
    }

    private clearPath(animated: boolean) {
        while (this.path.length > 0) {
            const cell = this.path.pop()!
            if (animated)
                this.deselectCell(cell)
            else
                this.resetCell(cell)
        }
    }

    private stopCellTweens(cell: GridCell) {
        Tween.stopAllByTarget(cell.node)
        Tween.stopAllByTarget(cell.background)
    }

    private playResult(result: WordResult) {
        const cells = [...this.path]
        switch (result) {
            case 'correct':
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
            const pulse = cell.defaultScale.clone().multiplyScalar(1.1)
            return Promise.all([
                toPromise(tween(cell.background).to(ResultDuration, { color })),
                toPromise(
                    tween(cell.node)
                        .to(ResultDuration * 0.5, { scale: pulse }, { easing: 'backOut' })
                        .to(ResultDuration * 0.5, { scale: cell.defaultScale }, { easing: 'sineIn' })
                ),
            ])
        }))
    }

    private animateDecline(cells: GridCell[]) {
        return Promise.all(cells.map(cell => {
            this.stopCellTweens(cell)
            const pos = cell.node.position.clone()
            return toPromise(
                tween(cell.node)
                    .parallel(
                        tween(cell.background)
                            .to(0.1, { color: ColorWrong })
                            .to(0.15, { color: cell.defaultColor }),
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
