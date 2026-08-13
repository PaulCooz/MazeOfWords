import { _decorator, Color, Component, Label, Sprite, Tween, tween, Vec3 } from 'cc'
import { Direction } from './Common'
const { ccclass, property } = _decorator

enum State {
    Idle = 1 << 0,
    Hinted = 1 << 1,
    Pressed = 1 << 2,
}

const ColorHinted = new Color(180, 140, 255)
const ArrowColor = Color.BLACK

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
    private hintedDir: Direction
    private inputDir: Direction

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
        this.refreshDirection()

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

    public setHinted(direction: Direction, animated = false) {
        this.hinted = true
        this.hintedDir = direction

        if (animated)
            this.animateHint(direction)
        else {
            this.refreshDirection()
            if (!this.pressed)
                this.background.color = this.idleColor
        }
    }

    public setInputDirection(direction: Direction) {
        this.inputDir = direction
        this.refreshDirection()
    }

    private animateHint(direction: Direction) {
        for (const sprite of this.hintedDirection) {
            Tween.stopAllByTarget(sprite)
            sprite.color = Color.TRANSPARENT
        }

        if (direction != null) {
            tween(this.hintedDirection[direction])
                .to(0.1, { color: ArrowColor })
                .start()
        }

        if (!this.pressed) {
            Tween.stopAllByTarget(this.background)
            tween(this.background)
                .to(0.1, { color: ColorHinted })
                .start()
        }
    }

    private refreshDirection() {
        for (const sprite of this.hintedDirection) {
            Tween.stopAllByTarget(sprite)
            sprite.color = Color.TRANSPARENT
        }

        const direction = this.inputDir ?? (this.hinted ? this.hintedDir : undefined)
        if (direction != null) {
            tween(this.hintedDirection[direction])
                .to(0.1, { color: ArrowColor })
                .start()
        }
    }
}
