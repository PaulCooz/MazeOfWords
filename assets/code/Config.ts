import { getFlags } from "./self contained/Yandex"

export class Config {
    static hintCost = 1
    static startCoins = 10

    static interCooldown = 60 // secs since last interstitial or session start

    static levelProgression = [
        { from: 0, to: 2, wordLength: [4] },
        { from: 2, to: 9, wordLength: [5, 8] },
        { from: 9, to: 15, wordLength: [7, 9] },
        { from: 15, to: 20, wordLength: [9, 14] },
        { from: 20, to: -1, wordLength: [13, 25] },
    ]

    static async load() {
        try {
            const flags = await getFlags()
            for (const key of Object.keys(flags)) {
                try {
                    Config[key] = JSON.parse(flags[key])
                } catch {
                    console.error(`bad config flag ${key}: ${flags[key]}`)
                }
            }
        } catch (e) {
            console.error("config load failed", e)
        }
    }
}
