import { _decorator, Component, Node } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Level } from './Level'
import { PopupManager } from './self contained/PopupManager'
import { SettingsPopup } from './SettingsPopup'
const { ccclass, property } = _decorator

@ccclass('PopupHelper')
export class PopupHelper extends PipelineComponent {
    private level: Level

    public levelStart(level: Level): void {
        this.level = level
    }

    public openSettings() {
        PopupManager.show(SettingsPopup)
    }
}


