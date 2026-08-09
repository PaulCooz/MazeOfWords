import { _decorator, Color, Component, Label, Sprite, Vec3 } from 'cc'
const { ccclass, property } = _decorator

@ccclass('GridCell')
export class GridCell extends Component {
    @property(Label)
    letter: Label
    @property(Sprite)
    background: Sprite

    readonly defaultColor = Color.WHITE
    readonly defaultScale = Vec3.ONE

    i: number
    j: number

    empty: boolean

    public setup(letter: string, i: number, j: number) {
        this.empty = letter == undefined
        if (this.empty) {
            this.node.scale = Vec3.ZERO
        } else {
            this.letter.string = letter
        }

        this.i = i
        this.j = j
    }
}
