import { _decorator, Label, math } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { Coins } from './Coins'
import { showRewardedVideo } from './self-contained/Yandex'
import { Config } from './Config'
import { Delegate } from './self-contained/Delegate'
const { ccclass, property } = _decorator

@ccclass('RewardedAd')
export class RewardedAd extends PipelineComponent {
    @property(Coins)
    coins: Coins
    @property(Label)
    countLabel: Label

    private busy = false

    public awake(): void {
        this.countLabel.string = `+${Config.rewardedCoins}`
    }

    public async onClick() {
        if (this.busy)
            return
        this.busy = true

        if (await showRewardedVideo()) {
            const amount = Config.rewardedCoins
            const flyCount = Math.round(math.clamp(amount / 2, 1, 10))
            let added = 0
            for (let i = 0; i < flyCount; i++) {
                const add = i < flyCount - 1 ? Math.floor(amount / flyCount) : amount - added
                this.coins.addCoin(this.node.worldPosition, 0.5 + i * 0.05, add)
                added += add
            }
        }

        this.busy = false
    }
}
