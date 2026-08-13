import { Color, Label, math, Node, Tween, tween } from "cc"
import { Curve, CurveKind } from "./Curve"

export function withA(alpha: number, color: Color) {
    const n = color.clone()
    n.a = alpha
    return n
}

export function withX<T extends { clone: () => T, x: number }>(x: number, v: T): T {
    const n = v.clone()
    n.x = x
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

export function labelStringTween(label: Label, text: string, duration: number = 0.3) {
    const from = label.string ?? "", to = text
    const state = { t: 0 }
    return tween(state).to(duration, { t: 1 }, {
        onUpdate: () => label.string = morphString(from, to, state.t),
    })
}

function morphString(from: string, to: string, ratio: number) {
    if (ratio <= 0)
        return from
    if (ratio >= 1)
        return to

    const reveal = Math.floor(Math.max(from.length, to.length) * ratio)
    let out = ""
    for (let i = 0; i < Math.round(math.lerp(from.length, to.length, ratio)); i++)
        out += (i < reveal ? to[i] : from[i]) ?? ""
    return out
}

export function tracePathTween(node: Node, path: Node[], duration: number, kind: CurveKind = "Catmull-Rom") {
    const curve = new Curve(path.map(p => p.worldPosition), kind)
    return tween(node).to(duration, {}, {
        onUpdate: (target, ratio) => target.worldPosition = curve.pointAt(ratio)
    })
}

export function toPromise(tween: Tween): Promise<void> {
    return new Promise((resolve, _) => {
        tween.call(() => resolve()).start()
    })
}

export function waitSec(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
}
