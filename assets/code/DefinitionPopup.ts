import { _decorator, WebView } from 'cc'
import { Popup } from './self contained/Popup'
const { ccclass, property } = _decorator

@ccclass('DefinitionPopup')
export class DefinitionPopup extends Popup {
    @property(WebView)
    webView: WebView

    public url: string

    onSetup(): void {
        this.webView.url = this.url
    }
}
