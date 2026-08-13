import { _decorator, Component, Label, Tween, tween, Widget } from 'cc'
import { labelStringTween, toPromise } from './Utils'
const { ccclass, property } = _decorator

const ShowTop = 15, HideTop = -160
const MorphDuration = 0.7, MinDuration = 1, ReadPerChar = 0.05

@ccclass('Toast')
export class Toast extends Component {
    private static _instance: Toast

    @property(Widget)
    widget: Widget
    @property(Label)
    label: Label

    private busy = false
    private pending: string = null
    private drop: () => void = null
    private panelAnim: Tween

    public setup() { // call it manually!
        Toast._instance = this

        this.widget.top = HideTop
        this.label.string = ''
    }

    static push(message: string) {
        Toast._instance.pushMessage(message)
    }

    private pushMessage(message: string) {
        if (this.label.string == message || this.pending == message)
            return
        if (this.busy) {
            this.pending = message
            this.drop?.()
            return
        }
        this.run(message)
    }

    public tryDrop() {
        this.drop?.()
    }

    private async run(message: string) {
        this.busy = true
        this.pending = null

        let current = message
        this.label.string = ''
        await Promise.all([
            this.animateTop(ShowTop, 0.35, 'backOut'),
            toPromise(labelStringTween(this.label, current, MorphDuration)),
        ])

        while (true) {
            const signal = await this.hold(MinDuration + current.length * ReadPerChar)
            if (signal == 'timeout')
                break

            const next = this.pending
            this.pending = null
            if (!next)
                break

            await toPromise(labelStringTween(this.label, next, 2 * MorphDuration))
            current = next
        }

        await this.animateTop(HideTop, 0.25, 'backIn')
        this.label.string = ''

        if (this.pending != null) {
            const next = this.pending
            this.pending = null
            this.run(next)
        } else {
            this.busy = false
        }
    }

    private hold(sec: number): Promise<'timeout' | 'replace'> {
        return new Promise(resolve => {
            const id = setTimeout(() => {
                this.drop = null
                resolve('timeout')
            }, sec * 1000)

            this.drop = () => {
                clearTimeout(id)
                this.drop = null
                resolve('replace')
            }
        })
    }

    private animateTop(top: number, duration: number, easing: 'backOut' | 'backIn') {
        this.panelAnim?.stop()
        this.panelAnim = tween(this.widget).to(duration, { top }, { easing })
        return toPromise(this.panelAnim)
    }
}
