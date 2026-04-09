// Draws flying data packets on the packet canvas.
// Each packet travels along a cubic bezier curve from one node to another.
// Leaves a glowing trail. Has an outer ring. Shows a text label.
//
// WHY bezier curves instead of straight lines?
// Straight lines look mechanical. Bezier curves look like data flowing
// through a circuit — much more visually interesting and readable.

import type { Packet, TaskType } from '../engine/types'
import { cubicControlPoints, cubicBezierPoint, type Point } from './bezier'
import { drawLightningBolt, type LightningBolt } from './lightning'

// ─── COLOR MAP ────────────────────────────────────────────────────────────────
// Each task type gets a distinct color for its packet.
// These match the chip colors in the UI nodes.
const PKT_COLORS: Record<TaskType, string> = {
  sync:  'rgba(255,32,96,',    // pink/red  — sync tasks
  micro: 'rgba(255,136,0,',    // orange    — microtasks
  macro: 'rgba(0,200,255,',    // cyan      — macrotasks
  heap:  'rgba(255,221,0,',    // yellow    — timer heap
}

// ─── EDGE DEFINITIONS ─────────────────────────────────────────────────────────
// These are the static connection lines drawn between nodes.
// They show the possible paths data can travel.
export interface EdgeDef {
  from:  string   // NodeId
  to:    string   // NodeId
  color: string   // rgba prefix
}

export const EDGES: EdgeDef[] = [
  { from: 'node-scheduler', to: 'node-call',  color: 'rgba(0,255,179,'  },
  { from: 'node-scheduler', to: 'node-micro', color: 'rgba(255,136,0,'  },
  { from: 'node-scheduler', to: 'node-macro', color: 'rgba(0,200,255,'  },
  { from: 'node-macro',     to: 'node-heap',  color: 'rgba(255,221,0,'  },
  { from: 'node-call',      to: 'node-output',color: 'rgba(255,32,96,'  },
]

// ─── DRAW EDGES ───────────────────────────────────────────────────────────────
// Draws all static connection lines with dashed animation.
// dashOffset increases each frame, making the dashes appear to flow.
export function drawEdges(
  ctx:         CanvasRenderingContext2D,
  getCenter:   (id: string) => Point,
  dashOffset:  number,
): void {
  EDGES.forEach(edge => {
    const a  = getCenter(edge.from)
    const b  = getCenter(edge.to)
    const cp = cubicControlPoints(a, b)

    ctx.save()

    // Dashed flowing line
    ctx.strokeStyle  = edge.color + '0.16)'
    ctx.lineWidth    = 1.2
    ctx.setLineDash([5, 18])
    ctx.lineDashOffset = -dashOffset
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.bezierCurveTo(cp.c1x, cp.c1y, cp.c2x, cp.c2y, b.x, b.y)
    ctx.stroke()

    // Subtle glow underneath
    ctx.setLineDash([])
    ctx.strokeStyle = edge.color + '0.04)'
    ctx.lineWidth   = 9
    ctx.shadowColor = edge.color + '0.35)'
    ctx.shadowBlur  = 8
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.bezierCurveTo(cp.c1x, cp.c1y, cp.c2x, cp.c2y, b.x, b.y)
    ctx.stroke()

    // Arrowhead at destination
    drawArrowhead(ctx, a, b, cp, edge.color + '0.5)')

    ctx.restore()
  })
}

function drawArrowhead(
  ctx:   CanvasRenderingContext2D,
  a:     Point,
  b:     Point,
  cp:    ReturnType<typeof cubicControlPoints>,
  color: string,
): void {
  // Sample two very close points near the end to get the arrival angle
  const tip = cubicBezierPoint(0.97, a, cp, b)
  const pre = cubicBezierPoint(0.91, a, cp, b)
  const ang = Math.atan2(tip.y - pre.y, tip.x - pre.x)

  ctx.save()
  ctx.translate(tip.x, tip.y)
  ctx.rotate(ang)
  ctx.fillStyle   = color
  ctx.shadowColor = color
  ctx.shadowBlur  = 8
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-11, -4.5)
  ctx.lineTo(-11,  4.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// ─── DRAW PACKETS ─────────────────────────────────────────────────────────────
// Draws all currently flying packets.
// Updates each packet's t (progress) and trail in-place.
// Returns array of packet ids that finished (t >= 1) so caller can remove them.
export function drawPackets(
  ctx:        CanvasRenderingContext2D,
  packets:    Packet[],
  getCenter:  (id: string) => Point,
  stepSpeed:  number,   // derived from store delay — faster delay = faster packets
): string[] {
  const finished: string[] = []

  packets.forEach(packet => {
    // Advance packet along the curve
    // stepSpeed is proportional to delay: fast delay → fast packets
    packet.t += stepSpeed
    if (packet.t >= 1) {
      finished.push(packet.id)
      return
    }

    const from = getCenter(packet.from)
    const to   = getCenter(packet.to)
    const cp   = cubicControlPoints(from, to)
    const pos  = cubicBezierPoint(packet.t, from, cp, to)

    // Store position in trail for glow tail effect
    packet.trail.push({ x: pos.x, y: pos.y })
    if (packet.trail.length > 22) packet.trail.shift()

    const color = PKT_COLORS[packet.type] ?? 'rgba(185,79,255,'

    drawPacketTrail(ctx, packet.trail, color)
    drawPacketCore(ctx, pos, color, packet.label)
  })

  return finished
}

// Fading trail behind the packet — makes motion feel physical
function drawPacketTrail(
  ctx:   CanvasRenderingContext2D,
  trail: Packet['trail'],
  color: string,
): void {
  trail.forEach((pt, idx) => {
    const alpha = (idx / trail.length) * 0.55
    const r     = 2.5 + idx * 0.07
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
    ctx.fillStyle = color + alpha + ')'
    ctx.fill()
  })
}

// The actual glowing packet dot + outer ring + label
function drawPacketCore(
  ctx:   CanvasRenderingContext2D,
  pos:   Point,
  color: string,
  label: string,
): void {
  ctx.save()

  // Outer glow shadow
  ctx.shadowColor = color + '1)'
  ctx.shadowBlur  = 22

  // Radial gradient fill — white center fading to color edge
  const pg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 7)
  pg.addColorStop(0,   'rgba(255,255,255,0.95)')
  pg.addColorStop(0.4, color + '0.9)')
  pg.addColorStop(1,   color + '0.1)')
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2)
  ctx.fillStyle = pg
  ctx.fill()

  // Outer ring
  ctx.strokeStyle = color + '0.55)'
  ctx.lineWidth   = 1
  ctx.shadowBlur  = 28
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
  ctx.stroke()

  // Label text above the packet
  if (label) {
    ctx.fillStyle  = 'rgba(255,255,255,0.9)'
    ctx.font       = 'bold 8px JetBrains Mono, monospace'
    ctx.textAlign  = 'center'
    ctx.shadowBlur = 0
    ctx.fillText(label.substring(0, 15), pos.x, pos.y - 17)
  }

  ctx.restore()
}

// Re-export so canvas component can use it directly
export { drawLightningBolt }
export type { LightningBolt }