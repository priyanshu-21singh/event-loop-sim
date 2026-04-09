// Generates a jagged lightning bolt as an array of points.
// Called when a packet is spawned — a bolt flashes along the same path.
//
// WHY separate from the canvas renderer?
// Because generating points (pure math) and drawing (canvas API)
// are two different concerns. This function is testable and reusable.

export interface LightningPoint {
  x: number
  y: number
}

export interface LightningBolt {
  points: LightningPoint[]
  color:  string
  life:   number   // 1.0 → 0.0, decreases each frame
}

/**
 * Creates a jagged bolt from (x1,y1) to (x2,y2).
 * segments: how many jagged points to generate (more = more chaotic)
 * jitter: max pixel deviation from the straight path
 */
export function createLightningBolt(
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  segments = 8,
  jitter   = 28,
): LightningBolt {
  const points: LightningPoint[] = [{ x: x1, y: y1 }]

  for (let i = 1; i < segments; i++) {
    const t       = i / segments
    // Linear interpolation along the straight path
    const baseX   = x1 + (x2 - x1) * t
    const baseY   = y1 + (y2 - y1) * t
    // Jitter decreases near endpoints so the bolt connects cleanly
    const falloff = 1 - Math.abs(t - 0.5) * 1.6
    const j       = jitter * Math.max(0, falloff)
    points.push({
      x: baseX + (Math.random() - 0.5) * j,
      y: baseY + (Math.random() - 0.5) * j,
    })
  }

  points.push({ x: x2, y: y2 })
  return { points, color, life: 1.0 }
}

/**
 * Draws one lightning bolt onto a canvas context.
 * Called every animation frame while life > 0.
 */
export function drawLightningBolt(
  ctx:  CanvasRenderingContext2D,
  bolt: LightningBolt,
): void {
  if (bolt.points.length < 2) return

  ctx.save()
  ctx.globalAlpha = bolt.life * 0.85

  // Outer glow stroke
  ctx.strokeStyle = bolt.color
  ctx.shadowColor = bolt.color
  ctx.shadowBlur  = 14
  ctx.lineWidth   = 1.5
  ctx.beginPath()
  bolt.points.forEach((pt, i) =>
    i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
  )
  ctx.stroke()

  // Bright white core — makes it look electric
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.shadowBlur  = 4
  ctx.lineWidth   = 0.5
  ctx.beginPath()
  bolt.points.forEach((pt, i) =>
    i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
  )
  ctx.stroke()

  ctx.restore()
}