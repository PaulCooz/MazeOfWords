import { _decorator, AudioClip, Component } from 'cc'
import { Audio } from './Audio'
import { PipelineComponent } from './PipelineComponent'
import { PopupManager } from './self-contained/PopupManager'
const { ccclass, property } = _decorator

@ccclass('AudioHelper')
export class AudioHelper extends PipelineComponent {
    @property(AudioClip)
    buttonClick: AudioClip

    @property(AudioClip)
    popupOpen: AudioClip
    @property(AudioClip)
    popupClose: AudioClip

    public awake(): void {
        PopupManager.onPushPopup.append(() => Audio.playSound(this.popupOpen, 0.5))
        PopupManager.onHidePopup.append(() => Audio.playSound(this.popupClose, 0.5))
    }

    public playClick() {
        Audio.playSound(this.buttonClick, 0.3)
    }
}


