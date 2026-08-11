import { _decorator } from 'cc'
import { RevealButton } from './RevealButton'
import { LevelChangeEvent } from './Common'
const { ccclass } = _decorator

@ccclass('NextLevel')
export class NextLevel extends RevealButton {
    levelFinish() {
        this.show()
    }

    protected onClick() {
        this.hide(true)
        this.node.dispatchEvent(new LevelChangeEvent())
    }
}
