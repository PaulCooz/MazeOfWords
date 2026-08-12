import { _decorator, Component, screen, Size, UITransform, view, Widget } from 'cc'
const { ccclass, property } = _decorator

@ccclass('AspectRatio')
export class AspectRatio extends Component {
    @property(UITransform)
    UITransform: UITransform

    private initialRatio: number
    private initialHeight: number
    private initialPadding: number

    public onEnable() {
        const tr = this.UITransform

        this.initialRatio = tr.height / tr.width
        this.initialHeight = tr.height

        const viewWidth = view.getVisibleSize().width
        this.initialPadding = viewWidth - tr.width

        screen.on('window-resize', this.resize, this)
        this.resize()
    }

    private resize() {
        const viewWidth = view.getVisibleSize().width
        const preferredWidth = viewWidth - this.initialPadding

        let size = new Size()
        size.height = Math.min(preferredWidth, this.initialHeight)
        size.width = size.height * this.initialRatio

        this.UITransform.setContentSize(size) // emits NodeEventType.SIZE_CHANGED
    }

    public onDisable() {
        screen.off('window-resize', this.resize, this)
    }
}
