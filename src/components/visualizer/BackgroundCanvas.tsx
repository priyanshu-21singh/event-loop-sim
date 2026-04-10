// Fullscreen background canvas — particles, grid, scan line, ambient orbs.
// Runs its own requestAnimationFrame loop completely independent of React.
// Never reads from Zustand. Never causes React re-renders.
//
// WHY useRef for the canvas instead of just grabbing it by id?
// useRef gives us a direct reference to the DOM element.
// React controls when the element exists (after mount, before unmount).
// Using document.getElementById would work but is fragile — the element
// might not exist yet when the code runs.

import { useEffect, useRef } from 'react'
import { createParticles, drawBackground, type Particle } from '../../canvas/bgRenderer'

export function BackgroundCanvas() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  // We store particles and time in refs — NOT state.
  // State would cause re-renders. Refs are mutable boxes that don't trigger renders.
  const particlesRef = useRef<Particle[]>([])
  const tRef         = useRef(0)
  const rafRef       = useRef<number>(0)  // stores the requestAnimationFrame id for cleanup

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas to match its container
    function resize() {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Recreate particles when resized so they fill the new size
      particlesRef.current = createParticles(90, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop — runs forever until component unmounts
    function loop() {
      if (!canvas || !ctx) return
      tRef.current += 0.012
      drawBackground(ctx, canvas.width, canvas.height, particlesRef.current, tRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    // Cleanup: cancel the animation frame and remove resize listener
    // This runs when the component unmounts — prevents memory leaks
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, []) // Empty deps — run once on mount, cleanup on unmount

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}