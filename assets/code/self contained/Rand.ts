import { math } from "cc"

export class Rand {
    private seed: number

    constructor(seed: number = 0) {
        this.seed = seed
    }

    public range(minInclusive: number, maxExclusive: number) {
        this.seed++
        return math.pseudoRandomRange(this.seed, minInclusive, maxExclusive)
    }

    public rangeInt(minInclusive: number, maxExclusive: number) {
        this.seed++
        return math.pseudoRandomRangeInt(this.seed, minInclusive, maxExclusive)
    }

    public chance(percents: number) {
        this.seed++
        return math.pseudoRandom(this.seed) < percents / 100.0
    }

    public shuffle<T>(arr: T[]) {
        for (let i = 0; i < arr.length; i++) {
            let j = this.rangeInt(0, arr.length)

            let t = arr[i]
            arr[i] = arr[j]
            arr[j] = t
        }
    }
}
