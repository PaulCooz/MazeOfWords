import { _decorator, Color, Component, Label, Sprite, Vec3 } from 'cc'
import { Direction } from './Common'
const { ccclass, property } = _decorator

enum State {
    Idle = 1 << 0,
    Hinted = 1 << 1,
    Pressed = 1 << 2,
}

const ColorHinted = new Color(180, 140, 255)

@ccclass('GridCell')
export class GridCell extends Component {
    @property(Label)
    letter: Label
    @property(Sprite)
    background: Sprite

    @property([Sprite])
    hintedDirection: Sprite[] = []

    readonly defaultColor = Color.WHITE
    readonly defaultScale = Vec3.ONE

    private state: State

    i: number
    j: number

    empty: boolean

    get hinted() {
        return (this.state & State.Hinted) != 0
    }
    private set hinted(v: boolean) {
        this.state = v ? this.state | State.Hinted : this.state & ~State.Hinted
    }

    get pressed() {
        return (this.state & State.Pressed) != 0
    }
    set pressed(v: boolean) {
        this.state = v ? this.state | State.Pressed : this.state & ~State.Pressed
    }

    get idleColor() { return this.hinted ? ColorHinted : this.defaultColor }

    public setup(i: number, j: number, letter: string) {
        this.state = State.Idle

        this.empty = letter == undefined
        if (this.empty) {
            this.node.scale = Vec3.ZERO
        } else {
            this.node.scale = this.defaultScale
            this.letter.string = letter
            this.background.color = this.defaultColor
        }

        this.i = i
        this.j = j
    }

    public setHinted(direction: Direction | null) {
        this.hinted = true

        if (direction != null)
            this.hintedDirection[direction].node.active = true
        if (!this.pressed)
            this.background.color = this.idleColor
    }
}
