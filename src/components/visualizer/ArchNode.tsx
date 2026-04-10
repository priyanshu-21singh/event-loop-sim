// A single architecture node card — the boxes you see in the visualizer.
// Reusable for all 6 nodes (scheduler, call stack, micro, macro, heap, output).
//
// Each node:
//   - Has a border/glow color based on its type
//   - Shows a count of tasks inside it
//   - Shows a list of chip cards
//   - Glows brightly when it's the active node
//   - Shows a Tooltip in turtle mode
//
// WHY make this a single reusable component?
// All 6 nodes have the same visual structure.
// Differences are just data (color, label, tasks).
// One component + different props = DRY code.

import { motion }    from 'framer-motion'
import { ChipList }  from './ChipList'
import { BrainRing } from './BrainRing'
import { Tooltip }   from '../ui/Tooltip'
import { usePhase, useSpeedMode } from '../../store/simStore'
import type { Task } from '../../engine/types'

// Node configuration — color + glow for each node type
const NODE_STYLES: Record<string, { border: string; glow: string }> = {
  scheduler: { border: '#b94fff', glow: 'rgba(185,79,255,0.7)' },
  call:      { border: '#00ffb3', glow: 'rgba(0,255,179,0.7)'  },
  micro:     { border: '#ff8800', glow: 'rgba(255,136,0,0.7)'  },
  macro:     { border: '#00c8ff', glow: 'rgba(0,200,255,0.7)'  },
  heap:      { border: '#ffdd00', glow: 'rgba(255,221,0,0.5)'  },
  output:    { border: '#ff2060', glow: 'rgba(255,32,96,0.5)'  },
}

// Tooltip content for each node — shown in turtle mode
const TOOLTIPS: Record<string, { title: string; body: string }> = {
  scheduler: {
    title: '🧠 Scheduler',
    body:  'The brain of the Event Loop. Decides which queue runs next: sync → micro → macro.',
  },
  call: {
    title: '📚 Call Stack',
    body:  'All synchronous function calls run here. Last in, first out. Must be empty before async queues run.',
  },
  micro: {
    title: '⚡ Microtask Queue',
    body:  'Promise .then() and await continuations live here. The ENTIRE queue drains before any macrotask runs.',
  },
  macro: {
    title: '⏱ Macrotask Queue',
    body:  'setTimeout and setInterval callbacks wait here. Only ONE runs per event loop tick.',
  },
  heap: {
    title: '🏔 Timer Heap',
    body:  'setTimeout registers here, sorted by delay. When timer expires, callback moves to Macrotask Queue.',
  },
  output: {
    title: '📋 Output',
    body:  'Values printed by console.log. The ORDER reveals how the Event Loop scheduled everything.',
  },
}

interface ArchNodeProps {
  nodeKey:     string    // 'call' | 'micro' | 'macro' | 'heap' | 'output' | 'scheduler'
  nodeId:      string    // HTML id — used by canvas to find position
  label:       string    // display name
  sublabel?:   string    // description shown below label
  tasks:       Task[]    // chips to show
  isActive:    boolean   // is this the currently active node?
  isScheduler?: boolean  // special case: show brain ring instead of chip list
  executingId?: string | null
  style?:      React.CSSProperties
}

export function ArchNode({
  nodeKey, nodeId, label, sublabel, tasks,
  isActive, isScheduler, executingId, style,
}: ArchNodeProps) {
  const nodeStyle = NODE_STYLES[nodeKey] ?? NODE_STYLES.call
  const speedMode = useSpeedMode()
  const phase     = usePhase()
  const tooltip   = TOOLTIPS[nodeKey]

  // Show tooltip: only in turtle mode AND when this node is active
  const showTooltip = speedMode === 'turtle' && isActive && phase !== 0

  return (
    <motion.div
      id={nodeId}
      className="absolute flex flex-col items-center"
      style={{
        background:   'rgba(4,4,18,0.92)',
        border:       `1.5px solid ${nodeStyle.border}`,
        borderRadius: 12,
        padding:      '11px 15px',
        backdropFilter: 'blur(10px)',
        color:        nodeStyle.border,
        minWidth:     120,
        ...style,
      }}
      // Framer Motion animates boxShadow based on isActive
      animate={{
        boxShadow: isActive
          ? `0 0 50px ${nodeStyle.glow}, inset 0 0 25px ${nodeStyle.glow.replace('0.7', '0.06')}`
          : '0 0 0px transparent',
      }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.04 }}
    >
      {/* Turtle mode tooltip */}
      {tooltip && (
        <Tooltip title={tooltip.title} body={tooltip.body} visible={showTooltip} />
      )}

      {/* Scheduler gets a spinning ring instead of count */}
      {isScheduler ? (
        <BrainRing />
      ) : (
        <span
          className="text-[1.35rem] font-black leading-none mb-1.5"
          style={{ fontFamily: "'Exo 2', sans-serif", textShadow: `0 0 20px ${nodeStyle.border}` }}
        >
          {tasks.length}
        </span>
      )}

      {/* Node label */}
      <span
        className="font-orbitron text-[0.44rem] tracking-widest uppercase mb-1.5 opacity-90"
      >
        {label}
      </span>

      {/* Chip list */}
      <div className="flex flex-wrap gap-1 justify-center min-h-5 w-full">
        <ChipList tasks={tasks} executingId={executingId} />
      </div>

      {/* Sublabel */}
      {sublabel && (
        <span
          className="mt-1 text-[0.42rem] text-center leading-snug"
          style={{ color: '#4a5070', maxWidth: 130 }}
        >
          {sublabel}
        </span>
      )}
    </motion.div>
  )
}