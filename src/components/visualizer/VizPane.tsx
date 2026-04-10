// The entire center/right visualization panel.
// Currently just a thin wrapper around ArchGraph.
// This component exists as a boundary so we can add things
// (like a mode toggle or overlay) above/below the graph later
// without touching ArchGraph itself.

import { ArchGraph } from './ArchGraph'

export function VizPane() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'rgba(2,2,8,0.55)' }}
    >
      <ArchGraph />
    </div>
  )
}