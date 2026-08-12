import { _decorator } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Hint } from './Hint'
import { Toast } from './self contained/Toast'
import { localize } from './Lang'
const { ccclass, property } = _decorator

@ccclass('RewardedAd')
export class RewardedAd extends PipelineComponent {
    @property(Hint)
    hint: Hint

    public awake(): void {
        this.hint.onNoCoins.append(this.hintToSelf, this)
    }

    private hintToSelf() {
        Toast.push(localize("NoCoinsForHint"))
    }

    public onClick() {
        // TODO rewarded adv and +coins
    }
}


