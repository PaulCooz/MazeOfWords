import { Color, Label, math, Tween, tween } from "cc"

export function withA(alpha: number, color: Color) {
    const n = color.clone()
    n.a = alpha
    return n
}

export function withY<T extends { clone: () => T, y: number }>(y: number, v: T): T {
    const n = v.clone()
    n.y = y
    return n
}

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
