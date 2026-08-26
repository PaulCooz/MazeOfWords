import { _decorator } from 'cc'
import { RevealButton } from '../RevealButton'
import { LevelChangeEvent } from '../Common'
import { Platform } from '../self-contained/platform/Platform'
const { ccclass } = _decorator

@ccclass('NextLevel')
export class NextLevel extends RevealButton {
    levelFinish() {
        this.show()
    }

    protected onClick() {
        this.hide(true)
        Platform.showInter()
            .then(() => this.node.dispatchEvent(new LevelChangeEvent()))
    }
}
