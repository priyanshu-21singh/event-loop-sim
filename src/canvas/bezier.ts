export interface Point { x: number; y: number }

export interface CubicCP { c1x: number; c1y: number; c2x: number; c2y: number }

export function cubicControlPoints(a: Point, b: Point): CubicCP {
  const dx = b.x - a.x, dy = b.y - a.y
  return { c1x: a.x + dx * 0.1, c1y: a.y + dy * 0.55,
           c2x: b.x - dx * 0.1, c2y: b.y - dy * 0.55 }
}

export function cubicBezierPoint(t: number, a: Point, cp: CubicCP, b: Point): Point {
  const u = 1 - t
  return {
    x: u*u*u*a.x + 3*u*u*t*cp.c1x + 3*u*t*t*cp.c2x + t*t*t*b.x,
    y: u*u*u*a.y + 3*u*u*t*cp.c1y + 3*u*t*t*cp.c2y + t*t*t*b.y,
  }
}


