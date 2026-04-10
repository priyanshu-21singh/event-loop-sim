// Renders the list of chips inside a queue node.
// AnimatePresence from Framer Motion enables exit animations.
// Without AnimatePresence, removed items disappear instantly.
// With it, Framer Motion runs the exit animation before removing from DOM.

import { AnimatePresence } from 'framer-motion'
import { Chip }            from './Chip'
import type { Task }       from '../../engine/types'

interface ChipListProps {
  tasks:       Task[]
  executingId?: string | null   // which task id is currently executing (for glow)
}

export function ChipList({ tasks, executingId }: ChipListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-[0.5rem] italic" style={{ color: '#1a1a3a' }}>
        empty
      </p>
    )
  }

  return (
    // AnimatePresence watches its children.
    // When a child with a key is removed, it runs that child's exit animation
    // before removing it from the DOM.
    // mode="popLayout" is perfect for queues — it shifts layout immediately
    // so new items don't overlap with exiting ones.
    <AnimatePresence mode="popLayout">
      {tasks.map(task => (
        <Chip
          key={task.id}             // key is required for AnimatePresence to track items
          task={task}
          isExecuting={task.id === executingId}
        />
      ))}
    </AnimatePresence>
  )
}