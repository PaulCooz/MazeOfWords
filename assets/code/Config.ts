export class Config {
    static hintCost = 10
    static startCoins = 20
    static correctCoins = 3
    static bonusCoins = 1
    static rewardedCoins = 15

    static levelProgression = [
        { from: 0, to: 2, wordLength: [4] },
        { from: 2, to: 9, wordLength: [5, 8] },
        { from: 9, to: 15, wordLength: [7, 9] },
        { from: 15, to: 20, wordLength: [9, 14] },
        { from: 20, to: -1, wordLength: [14, 25] },
    ]
}
