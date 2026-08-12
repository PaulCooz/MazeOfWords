import { _decorator, Component, Label, Sprite, Tween, tween, Widget } from 'cc'
import { labelStringTween, toPromise, waitSec } from './Utils'
const { ccclass, property } = _decorator

const ShowTop = 15, HideTop = -150
const MorphDuration = 0.5, MinDuration = 1.2, ReadPerChar = 0.05
// TODO review this
@ccclass('Toast')
export class Toast extends Component {
    private static _instance: Toast

    @property(Sprite)
    panel: Sprite
    @property(Widget)
    widget: Widget
    @property(Label)
    label: Label

    private busy = false
    private pending: string = null
    private wakeHold: () => void = null
    private panelAnim: Tween

    public setup() { // call it manually!
        Toast._instance = this

        this.widget.top = HideTop
        this.label.string = ''
    }

    static push(message: string) {
        Toast._instance?.pushMessage(message)
    }

    private pushMessage(message: string) {
        if (this.busy) {
            this.pending = message
            this.wakeHold?.()
            return
        }
        this.run(message)
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
            const hold = MinDuration + current.length * ReadPerChar
            const signal = await this.waitHold(hold)

            if (signal == 'timeout' && this.pending == null)
                break

            await waitSec(0.5)
            const next = this.pending
            this.pending = null
            if (next == null)
                break

            await toPromise(labelStringTween(this.label, next, MorphDuration))
            current = next
        }

        await this.animateTop(HideTop, 0.25, 'backIn')
        this.label.string = ''
        this.busy = false

        if (this.pending != null) {
            const next = this.pending
            this.pending = null
            this.run(next)
        }
    }

    private waitHold(sec: number): Promise<'timeout' | 'replace'> {
        return new Promise(resolve => {
            const id = setTimeout(() => {
                this.wakeHold = null
                resolve('timeout')
            }, sec * 1000)

            this.wakeHold = () => {
                clearTimeout(id)
                this.wakeHold = null
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
