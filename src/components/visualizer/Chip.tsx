// A single task chip — the colored card shown inside a queue node.
//
// Uses Framer Motion for:
//   - Entry animation: spring scale-in with rotation
//   - Exit animation: scale-out upward with rotation
//   - Layout animation: if chips rearrange, they slide smoothly
//
// WHY Framer Motion instead of CSS keyframes for chips?
// CSS keyframes are static — you can't do spring physics or FLIP.
// Framer Motion's `layout` prop automatically animates position changes
// when siblings are added/removed. This is called FLIP animation and
// it's very hard to do manually.

import { motion } from 'framer-motion'
import type { Task } from '../../engine/types'

// Colors for each task type — gradient backgrounds
const CHIP_STYLES: Record<string, { bg: string; shadow: string; color: string }> = {
  sync:  { bg: 'linear-gradient(135deg,#ff2060,#7a0030)', shadow: 'rgba(255,32,96,0.4)',   color: '#fff' },
  micro: { bg: 'linear-gradient(135deg,#ff8800,#7a3d00)', shadow: 'rgba(255,136,0,0.4)',   color: '#fff' },
  macro: { bg: 'linear-gradient(135deg,#00c8ff,#005a75)', shadow: 'rgba(0,200,255,0.4)',   color: '#fff' },
  heap:  { bg: 'linear-gradient(135deg,#ffdd00,#7a6000)', shadow: 'rgba(255,221,0,0.3)',   color: '#000' },
}

interface ChipProps {
  task:       Task
  isExecuting: boolean   // true while this chip is glowing (exec step)
}

export function Chip({ task, isExecuting }: ChipProps) {
  const style = CHIP_STYLES[task.type] ?? CHIP_STYLES.sync

  return (
    // `layout` tells Framer Motion to animate this chip's position
    // if it moves within its container (e.g. when a sibling is removed)
    <motion.span
      layout
      // Entry animation
      initial={{ scale: 0, rotate: -8, opacity: 0 }}
      animate={{
        scale:     1,
        rotate:    0,
        opacity:   1,
        boxShadow: isExecuting
          ? ['0 0 4px rgba(255,255,255,0.1)', '0 0 20px rgba(255,255,255,0.95)', '0 0 40px #fff', '0 0 20px rgba(255,255,255,0.95)']
          : `0 0 8px ${style.shadow}`,
      }}
      // Exit animation
      exit={{ scale: 0, y: -12, rotate: 10, opacity: 0 }}
      transition={{
        type:      'spring',
        stiffness: 500,
        damping:   30,
        // Exec glow cycles
        boxShadow: isExecuting
          ? { duration: 0.35, repeat: Infinity, repeatType: 'reverse' }
          : { duration: 0.2 },
      }}
      className="inline-block px-2 py-1 rounded text-[0.54rem] font-bold tracking-wide whitespace-nowrap cursor-default"
      style={{
        background: style.bg,
        color:      style.color,
      }}
    >
      {task.label}
    </motion.span>
  )
}