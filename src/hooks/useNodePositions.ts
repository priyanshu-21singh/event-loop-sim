// Returns a function that reads the center of any arch node.
// Canvas uses this every animation frame to know where to draw packet paths.
import { useCallback } from 'react'
import type { NodeId } from '../engine/types'

export function useNodePositions(containerRef: React.RefObject<HTMLElement | null>) {
  const getCenter = useCallback((nodeId: NodeId): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const container = containerRef.current
    const el        = document.getElementById(nodeId)
    if (!el) return { x: 0, y: 0 }
    const cr = container.getBoundingClientRect()
    const nr = el.getBoundingClientRect()
    return {
      x: nr.left - cr.left + nr.width  / 2,
      y: nr.top  - cr.top  + nr.height / 2,
    }
  }, [containerRef])

  return { getCenter }
}