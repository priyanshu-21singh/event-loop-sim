// Pure canvas drawing functions for the background layer.
// No React, no state. Just math and canvas API calls.

// WHY pure functions instead of a class?
// Pure functions are easier to reason about.
// The canvas component creates the state objects (particles, time)
// and passes them in. The functions just draw.
export interface Particle {
  x:  number
  y:  number
  vx: number    // velocity x
  vy: number    // velocity y
  r:  number    // radius
  a:  number    // base alpha
  // color prefix like 'rgba(185,79,255,'  — we append alpha + ')'
  colorPrefix: string
}



const COLOR_PREFIXES = [
  'rgba(185,79,255,',  
  'rgba(0,200,255,',    
  'rgba(0,255,179,',    
]

/**
 * Creates N particles with random positions and velocities.
 * Call this once when the canvas mounts, then pass the array to drawBackground.
 */
export function createParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x:           Math.random() * w,
    y:           Math.random() * h,
    vx:          (Math.random() - 0.5) * 0.14,
    vy:          (Math.random() - 0.5) * 0.14,
    r:           Math.random() * 1.3 + 0.3,
    a:           Math.random() * 0.35 + 0.05,
    colorPrefix: COLOR_PREFIXES[Math.floor(Math.random() * COLOR_PREFIXES.length)],
  }))
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────

/**
 * Draws one complete background frame.
 * Mutates particle positions (moves them each frame).
 * t is the elapsed time counter — increases ~0.01 per frame.
 */
export function drawBackground(
  ctx:       CanvasRenderingContext2D,
  w:         number,
  h:         number,
  particles: Particle[],
  t:         number,
): void {
  ctx.clearRect(0, 0, w, h)

  drawGrid(ctx, w, h, t)
  drawOrbs(ctx, w, h, t)
  drawScanLine(ctx, w, h, t)
  drawParticles(ctx, w, h, particles, t)
}

// Faint perspective grid — gives the cyberpunk depth feeling
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const alpha = 0.022 + 0.008 * Math.sin(t)
  ctx.strokeStyle = `rgba(80,40,160,${alpha})`
  ctx.lineWidth   = 1

  for (let x = 0; x < w; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
}

// Three large radial gradient "orbs" in the background — create depth
function drawOrbs(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const orbs = [
    { xr: 0.15, yr: 0.3,  color: 'rgba(185,79,255,' },
    { xr: 0.85, yr: 0.7,  color: 'rgba(0,200,255,'  },
    { xr: 0.5,  yr: 0.88, color: 'rgba(0,255,179,'  },
  ]

  orbs.forEach((orb, i) => {
    const ox    = w * orb.xr
    const oy    = h * orb.yr
    const alpha = 0.035 + 0.015 * Math.sin(t * 1.2 + i * 2.1)
    const g     = ctx.createRadialGradient(ox, oy, 0, ox, oy, 220)
    g.addColorStop(0, orb.color + alpha + ')')
    g.addColorStop(1, orb.color + '0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

// Horizontal scan line that sweeps downward — old-monitor aesthetic
function drawScanLine(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const y  = (t * 55) % h
  const sg = ctx.createLinearGradient(0, y - 35, 0, y + 35)
  sg.addColorStop(0,   'rgba(185,79,255,0)')
  sg.addColorStop(0.5, 'rgba(185,79,255,0.025)')
  sg.addColorStop(1,   'rgba(185,79,255,0)')
  ctx.fillStyle = sg
  ctx.fillRect(0, y - 35, w, 70)
}

// Move particles and draw them — wrap at edges so they never disappear
function drawParticles(
  ctx:       CanvasRenderingContext2D,
  w:         number,
  h:         number,
  particles: Particle[],
  t:         number,
) {
  particles.forEach(p => {
    // Move
    p.x += p.vx
    p.y += p.vy
    // Wrap edges
    if (p.x < 0) p.x = w
    if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h
    if (p.y > h) p.y = 0

    // Pulsing alpha — each particle breathes at its own frequency
    const alpha = p.a * (0.65 + 0.35 * Math.sin(t * 2 + p.x * 0.01))
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.colorPrefix + alpha + ')'
    ctx.fill()
  })
}