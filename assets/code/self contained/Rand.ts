export class Rand {
    private state: number

    constructor(seed: number = 0) {
        this.state = seed >>> 0
    }

    public next() { // [0, 1) mulberry32
        let t = this.state = (this.state + 0x6D2B79F5) >>> 0
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    public range(minInclusive: number, maxExclusive: number) {
        return minInclusive + this.next() * (maxExclusive - minInclusive)
    }

    public rangeInt(minInclusive: number, maxExclusive: number) {
        return Math.floor(this.range(minInclusive, maxExclusive))
    }

    public chance(percents: number) {
        return this.next() < percents / 100.0
    }

    public shuffle<T>(arr: T[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.rangeInt(0, i + 1)
            const t = arr[i]
            arr[i] = arr[j]
            arr[j] = t
        }
    }
}
