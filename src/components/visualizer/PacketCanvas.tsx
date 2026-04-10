// The animated packet canvas — draws bezier packets flying between nodes.
// Also draws lightning bolts when a packet spawns.
//
// HOW it reads packets from Zustand:
//   - usePackets() subscribes to the packets array
//   - When a new packet is added, this component re-renders
//   - The animation loop reads the latest packets via a ref
//     (so the loop itself doesn't need to re-start on every state change)
//
// WHY use both usePackets (for re-render trigger) AND a ref (for loop access)?
// The rAF loop runs 60fps. If it read directly from React state,
// it would need to be recreated every time packets change.
// Instead: usePackets triggers one re-render that updates the ref,
// and the loop reads from the ref — no loop restart needed.

import { useEffect, useRef } from 'react'
import { usePackets, useSimStore, useDelay } from '../../store/simStore'
import { useNodePositions }  from '../../hooks/useNodePositions'
import { drawEdges, drawPackets } from '../../canvas/packetRenderer'
import { createLightningBolt, drawLightningBolt, type LightningBolt } from '../../canvas/lightning'
import type { Packet, NodeId } from '../../engine/types'

interface PacketCanvasProps {
  // Reference to the viz pane container — needed for node position calculations
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function PacketCanvas({ containerRef }: PacketCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const packets    = usePackets()
  const delay      = useDelay()
  const rafRef     = useRef<number>(0)
  const dashOffset = useRef(0)

  // Lightning bolts are purely visual — not in Zustand
  const boltsRef = useRef<LightningBolt[]>([])

  // Mutable copy of packets for the rAF loop
  // Updated every render (which happens when packets change)
  const packetsRef = useRef<Packet[]>([])

  const { getCenter } = useNodePositions(containerRef)

  // Keep packetsRef in sync with React state
  // This is called on every render — cheap assignment
  packetsRef.current = packets.map(p => ({ ...p }))

  // Previous packet ids — detect newly added packets to spawn lightning
  const prevPacketIds = useRef<Set<string>>(new Set())

  // Detect new packets and spawn a lightning bolt for each
  useEffect(() => {
    const currentIds = new Set(packets.map(p => p.id))
    packets.forEach(p => {
      if (!prevPacketIds.current.has(p.id)) {
        // This is a new packet — spawn a lightning bolt along the same path
        const from = getCenter(p.from as NodeId)
        const to   = getCenter(p.to   as NodeId)
        if (from.x !== 0 || from.y !== 0) {
          boltsRef.current.push(
            createLightningBolt(from.x, from.y, to.x, to.y, getPacketColor(p.type))
          )
        }
      }
    })
    prevPacketIds.current = currentIds
  }, [packets, getCenter])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas || !containerRef.current) return
      canvas.width  = containerRef.current.offsetWidth
      canvas.height = containerRef.current.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function loop() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Advance dash animation
      dashOffset.current = (dashOffset.current + 0.65) % 22

      // Draw static edge lines with flowing dashes
      drawEdges(ctx, (id: string) => getCenter(id as NodeId), dashOffset.current)

      // Draw and advance lightning bolts
      for (let i = boltsRef.current.length - 1; i >= 0; i--) {
        const bolt = boltsRef.current[i]
        bolt.life -= 0.07
        if (bolt.life <= 0) {
          boltsRef.current.splice(i, 1)
          continue
        }
        drawLightningBolt(ctx, bolt)
      }

      // Packet speed — proportional to delay
      // Faster delay = packets move faster across the canvas
      const pktSpeed = Math.max(0.008, 0.018 * (1200 / Math.max(delay, 150)))

      // Draw packets, get ids of finished ones
      const finished = drawPackets(
        ctx,
        packetsRef.current,
        (id: string) => getCenter(id as NodeId),
        pktSpeed,
      )

      // Remove finished packets from Zustand store
      if (finished.length > 0) {
        finished.forEach(id => useSimStore.getState().removePacket(id))
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  // Re-run if delay changes (affects packet speed)
  }, [delay, getCenter, containerRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}

function getPacketColor(type: string): string {
  const map: Record<string, string> = {
    sync:  'rgba(255,32,96,0.85)',
    micro: 'rgba(255,136,0,0.85)',
    macro: 'rgba(0,200,255,0.85)',
    heap:  'rgba(255,221,0,0.85)',
  }
  return map[type] ?? 'rgba(185,79,255,0.85)'
}