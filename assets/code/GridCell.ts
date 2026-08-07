import { _decorator, Color, Component, Label, Sprite, Vec3 } from 'cc'
const { ccclass, property } = _decorator

@ccclass('GridCell')
export class GridCell extends Component {
    @property(Label)
    letter: Label
    @property(Sprite)
    background: Sprite

    readonly defaultColor = new Color()
    readonly defaultScale = new Vec3()

    i: number
    j: number

    public setup(letter: string, i: number, j: number) {
        this.defaultColor.set(this.background.color)
        this.defaultScale.set(this.node.scale)

        this.letter.string = letter
        this.i = i
        this.j = j
    }
}
