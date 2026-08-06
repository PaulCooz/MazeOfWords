import { _decorator, instantiate, Layout, NodeEventType, Prefab, Size, Widget } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { AspectRatio } from './self contained/AspectRatio'
import { Level } from './Level'
import { GridCell } from './GridCell'
const { ccclass, property } = _decorator

const MaxCellSize = 250

@ccclass('Grid')
export class Grid extends PipelineComponent {
    @property(Layout)
    layout: Layout
    @property(Widget)
    widget: Widget
    @property(AspectRatio)
    aspectRatio: AspectRatio

    @property(Prefab)
    cellPrefab: Prefab

    private cells: GridCell[] = []

    private level: Level

    setup(level: Level) {
        this.level = level
        this.createCells()

        this.aspectRatio.node.on(NodeEventType.SIZE_CHANGED, this.resizeCells, this)
        this.resizeCells()
    }

    private createCells() {
        for (let h = 0; h < this.level.height; h++) {
            for (let w = 0; w < this.level.width; w++) {
                const item = instantiate(this.cellPrefab).getComponent(GridCell)
                item.node.parent = this.layout.node
                item.setup(this.level.charAt(h, w))
                this.cells.push(item)
            }
        }
    }

    private resizeCells() {
        let gridSize = this.aspectRatio.UITransform.contentSize

        const ly = this.layout
        const h = this.level.height
        const w = this.level.width
        const cellSize = Math.min(Math.min(
            (gridSize.x - ly.paddingLeft - ly.paddingRight - ly.spacingX * (w - 1)) / w,
            (gridSize.y - ly.paddingTop - ly.paddingBottom - ly.spacingY * (h - 1)) / h
        ), MaxCellSize)
        ly.cellSize = new Size(cellSize, cellSize)
        ly.constraint = 2 // TODO enum
        ly.constraintNum = w

        this.widget.horizontalCenter = (gridSize.width - (cellSize * w + this.layout.spacingX * (w - 1))) / 2
    }
}


