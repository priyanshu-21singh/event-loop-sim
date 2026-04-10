// Positions all 6 architecture nodes inside the visualizer.
// Uses absolute positioning with percentage-based coordinates
// so nodes scale naturally when the panel is resized.
//
// HOW active node detection works:
//   - The store's currentPhase + the last step's action tell us which node is active
//   - We derive activeNodeId from those by reading the latest log entry
//   - Alternatively (simpler): we check which queue was last pushed/exec'd
//   - We pass isActive={true} only to the currently highlighted node
//
// Each node reads its own slice from the store via selector hooks.
// ArchGraph itself only orchestrates layout — it doesn't fetch data for children.

import { useRef }       from 'react'
import { ArchNode }     from './ArchNode'
import { BackgroundCanvas } from './BackgroundCanvas'
import { PacketCanvas }     from './PacketCanvas'
import {
  useCallStack, useMicroQueue, useMacroQueue,
  useTimerHeap, useOutputs, usePhase, useSimStore,
} from '../../store/simStore'

export function ArchGraph() {
  // containerRef is passed to PacketCanvas so it can calculate
  // node positions relative to the viz pane, not the entire window
  const containerRef = useRef<HTMLDivElement>(null)

  const callStack  = useCallStack()
  const microQueue = useMicroQueue()
  const macroQueue = useMacroQueue()
  const timerHeap  = useTimerHeap()
  const outputs    = useOutputs()
  const phase      = usePhase()

  // Derive which node is "active" from the phase
  // Phase 1 → call stack is main active node (+ scheduler)
  // Phase 2 → microtask queue
  // Phase 3 → macrotask queue
  // We also check the last log entry for heap/output activity
  const lastLog    = useSimStore(s => s.logEntries.at(-1))
  const lastMsg    = lastLog?.message ?? ''

  const activeNodeId = (() => {
    if (phase === 0) return null
    if (lastMsg.includes('timerHeap') || lastMsg.includes('heap fired')) return 'node-heap'
    if (lastMsg.includes('node-output') || lastMsg.includes('output')) return 'node-output'
    if (phase === 1) return 'node-call'
    if (phase === 2) return 'node-micro'
    if (phase === 3) return 'node-macro'
    return null
  })()

  // Which task id is currently executing — for chip glow effect
  const executingId = useSimStore(s => {
    const last = s.logEntries.at(-1)
    if (!last) return null
    // Extract taskId from log message like "exec <b>task-id</b>"
    const match = last.message.match(/>([^<]+)<\/b>/)
    return match ? match[1] : null
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
    >
      {/* Layer 0: background particles + grid */}
      <BackgroundCanvas />

      {/* Layer 1: bezier edge lines + flying packets */}
      <PacketCanvas containerRef={containerRef} />

      {/* Layer 2: node cards (DOM, above canvas) */}
      <div className="absolute inset-0" style={{ zIndex: 2, pointerEvents: 'none' }}>

        {/* Scheduler — top center */}
        <ArchNode
          nodeKey="scheduler"
          nodeId="node-scheduler"
          label="Scheduler"
          sublabel="orchestrates execution"
          tasks={[]}
          isActive={phase !== 0}
          isScheduler
          style={{ left: '50%', top: '5%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}
        />

        {/* Call Stack — middle left */}
        <ArchNode
          nodeKey="call"
          nodeId="node-call"
          label="Call Stack"
          sublabel="LIFO · sync code"
          tasks={callStack}
          isActive={activeNodeId === 'node-call'}
          executingId={executingId}
          style={{ left: '4%', top: '42%', pointerEvents: 'auto' }}
        />

        {/* Microtask Queue — middle center */}
        <ArchNode
          nodeKey="micro"
          nodeId="node-micro"
          label="Microtask Queue"
          sublabel="Promise · async/await"
          tasks={microQueue}
          isActive={activeNodeId === 'node-micro'}
          executingId={executingId}
          style={{ left: '50%', top: '42%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}
        />

        {/* Macrotask Queue — middle right */}
        <ArchNode
          nodeKey="macro"
          nodeId="node-macro"
          label="Macrotask Queue"
          sublabel="setTimeout · setInterval"
          tasks={macroQueue}
          isActive={activeNodeId === 'node-macro'}
          executingId={executingId}
          style={{ right: '4%', top: '42%', pointerEvents: 'auto' }}
        />

        {/* Timer Heap — bottom right */}
        <ArchNode
          nodeKey="heap"
          nodeId="node-heap"
          label="Timer Heap"
          sublabel="sorted by delay"
          tasks={timerHeap}
          isActive={activeNodeId === 'node-heap'}
          style={{ right: '4%', top: '74%', pointerEvents: 'auto' }}
        />

        {/* Output — bottom left */}
        <ArchNode
          nodeKey="output"
          nodeId="node-output"
          label="console.log"
          sublabel=""
          tasks={outputs.map((o, i) => ({ id: `out-${i}`, label: o, type: 'sync' as const }))}
          isActive={activeNodeId === 'node-output'}
          style={{ left: '4%', top: '74%', pointerEvents: 'auto' }}
        />

      </div>
    </div>
  )
}