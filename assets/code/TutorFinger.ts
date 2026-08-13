import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc'
import { tracePathTween } from './self contained/Utils'
const { ccclass } = _decorator

const PressScale = new Vec3(0.85, 0.85, 1)
const TraceSpeed = 3
const Clicks = 3
const HideDuration = 0.2

@ccclass('TutorFinger')
export class TutorFinger extends Component {
    private destroyed = false

    clickTo(node: Node) {
        this.node.active = true
        this.node.worldPosition = node.worldPosition
        this.node.scale = Vec3.ZERO

        tween(this.node)
            .delay(0.2)
            .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
            .delay(0.3)
            .repeat(Clicks, tween(this.node)
                .to(0.2, { scale: PressScale })
                .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
                .delay(1)
            )
            .to(HideDuration, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .destroySelf()
            .start()
    }

    tracePath(path: Node[]) {
        if (path.length == 0)
            return

        const dur = Math.max(0.3, path.length / TraceSpeed)
        this.node.active = true
        tween(this.node)
            .set({ worldPosition: path[0].worldPosition, scale: Vec3.ZERO })
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .delay(0.2)
            .to(0.2, { scale: PressScale })
            .then(tracePathTween(this.node, path, dur))
            .to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .delay(0.2)
            .to(HideDuration, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .delay(1.6)
            .union()
            .repeatForever()
            .start()
    }

    stop() {
        if (this.destroyed)
            return
        this.destroyed = true

        Tween.stopAllByTarget(this.node)
        tween(this.node)
            .to(HideDuration, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .destroySelf()
            .start()
    }

    protected onDestroy(): void {
        this.destroyed = true
    }
}
