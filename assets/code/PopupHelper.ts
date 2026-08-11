import { _decorator } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { PopupManager } from './self contained/PopupManager'
import { SettingsPopup } from './SettingsPopup'
const { ccclass } = _decorator

@ccclass('PopupHelper')
export class PopupHelper extends PipelineComponent {
    public openSettings() {
        PopupManager.show(SettingsPopup)
    }
}
