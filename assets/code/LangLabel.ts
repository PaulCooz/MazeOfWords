import { _decorator, CCString, Component, Label } from 'cc'
import { localize } from './Lang'
import { PlayerStorage } from './PlayerStorage'
const { ccclass, property } = _decorator

@ccclass('LangLabel')
export class LangLabel extends Component {
    @property(Label)
    label: Label
    @property(CCString)
    key: string

    protected onLoad(): void {
        PlayerStorage.lang.onChange.append(this.updateLabel, this)
        this.updateLabel()
    }

    private updateLabel() {
        this.label.string = localize(this.key)
    }

    protected onDestroy(): void {
        PlayerStorage.lang.onChange.pop(this.updateLabel, this)
    }
}
