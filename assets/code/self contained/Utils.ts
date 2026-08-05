import { Label, math, Tween, tween } from "cc"

export function labelCounterTween(label: Label, value: number, duration: number = 0.2) {
    return tween(label).to(duration, {
        string: {
            value: value,
            progress(start: number, end: number, current: number, ratio: number) {
                return Math.trunc(math.lerp(start, end, ratio)).toString()
            }
        }
    })
}

export function toPromise(tween: Tween): Promise<void> {
    return new Promise((resolve, _) => {
        tween.call(() => resolve()).start()
    })
}
