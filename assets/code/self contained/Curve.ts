import { Vec3 } from "cc"

export interface KindParams {
    alpha?: number
}
export type CurveKind = 'lines' | 'Catmull-Rom' | 'Bézier'

const segmenter: { [key in CurveKind]: (points: Vec3[], kindParams?: KindParams) => Segment[] } = {
    ["lines"]: toLineSegments,
    ["Catmull-Rom"]: toCatmullRomSegments,
    ["Bézier"]: toBezierSegments,
}

interface Segment {
    len: number
    lerp(n: number): Vec3
}

export class Curve {
    private readonly segments: Segment[]
    private readonly _totalLength: number

    public get totalLen(): number { return this._totalLength }

    public constructor(points: Vec3[], kind: CurveKind, kindParams?: KindParams) {
        this.segments = segmenter[kind](points, kindParams)

        this._totalLength = 0
        for (const s of this.segments) {
            this._totalLength += s.len
        }
    }

    public pointAt(normLen: number): Vec3 {
        const s = this.segments
        let i = 0, len = normLen * this.totalLen
        while (i < s.length && len - s[i].len > 0) {
            len -= s[i].len
            i++
        }
        return i == s.length
            ? s[s.length - 1].lerp(1)
            : s[i].lerp(len / s[i].len)
    }
}


function toLineSegments(points: Vec3[]) {
    const segments: Segment[] = []
    for (let i = 0; i < points.length - 1; i++) {
        segments.push({
            len: Vec3.distance(points[i], points[i + 1]),
            lerp: n => Vec3.lerp(new Vec3(), points[i], points[i + 1], n)
        })
    }
    return segments
}

function toCatmullRomSegments(points: Vec3[], kindParams: KindParams) {
    const alpha = kindParams?.alpha ?? 0.5
    if (points.length < 2)
        return []

    const segments: Segment[] = []
    const knot = (i: number) => points[i < 0 ? 0 : i >= points.length ? points.length - 1 : i]
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = knot(i - 1), p1 = knot(i), p2 = knot(i + 1), p3 = knot(i + 2)
        segments.push({
            len: arcLength(t => catmullRom(p0, p1, p2, p3, t, alpha)),
            lerp: n => catmullRom(p0, p1, p2, p3, n, alpha)
        })
    }
    return segments
}

function toBezierSegments(points: Vec3[]): Segment[] {
    if (points.length < 2)
        return []

    const bezier = (points: Vec3[], t: number) => {
        const p = points.map(x => x.clone())
        for (let k = 1; k < p.length; k++)
            for (let i = 0; i < p.length - k; i++)
                Vec3.lerp(p[i], p[i], p[i + 1], t)
        return p[0]
    }
    return [{
        len: arcLength(t => bezier(points, t), (points.length - 1) * 4),
        lerp: n => bezier(points, n)
    }]
}

function catmullRom(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number, alpha: number): Vec3 {
    const t0 = 0
    const t1 = t0 + Math.pow(Vec3.distance(p0, p1), alpha)
    const t2 = t1 + Math.pow(Vec3.distance(p1, p2), alpha)
    const t3 = t2 + Math.pow(Vec3.distance(p2, p3), alpha)
    const tt = t1 + (t2 - t1) * t

    const lerpKnot = (a: Vec3, b: Vec3, ta: number, tb: number, t: number) =>
        Vec3.lerp(new Vec3(), a, b, ta == tb ? 0 : (t - ta) / (tb - ta))
    const a1 = lerpKnot(p0, p1, t0, t1, tt)
    const a2 = lerpKnot(p1, p2, t1, t2, tt)
    const a3 = lerpKnot(p2, p3, t2, t3, tt)
    const b1 = lerpKnot(a1, a2, t0, t2, tt)
    const b2 = lerpKnot(a2, a3, t1, t3, tt)
    return lerpKnot(b1, b2, t1, t2, tt)
}

function arcLength(point: (t: number) => Vec3, steps = 8) {
    let len = 0, prev = point(0)
    for (let i = 1; i <= steps; i++) {
        const p = point(i / steps)
        len += Vec3.distance(prev, p)
        prev = p
    }
    return len
}
