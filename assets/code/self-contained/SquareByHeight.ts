import { _decorator, Component, screen, Size, UITransform, view } from 'cc'
const { ccclass, property, float } = _decorator

@ccclass('SquareByHeight')
export class SquareByHeight extends Component {
    @property(UITransform)
    UITransform: UITransform
    @float
    horizontalPaddings = 20

    private initialHeight: number

    public onLoad() {
        this.initialHeight = this.UITransform.height

        screen.on('window-resize', this.resize, this)
        this.resize()
    }

    private resize() {
        const size = new Size()
        size.width = size.height = Math.min(
            view.getVisibleSize().width - this.horizontalPaddings,
            this.initialHeight
        )
        this.UITransform.setContentSize(size) // emits NodeEventType.SIZE_CHANGED
    }
}
