// The output strip showing console.log results in order.
// Sits in the bottom bar, scrolls horizontally.
//
// Each output badge appears with a pop-in animation.
// The order of badges IS the answer to "what does this code output?"
// This is the most important visual feedback for the learner.

import { useOutputs } from '../../store/simStore'
import { motion, AnimatePresence } from 'framer-motion'

export function OutputConsole() {
  const outputs = useOutputs()

  return (
    <div className="flex items-center gap-2 flex-1 overflow-hidden min-w-0">

      {/* Label */}
      <span
        className="text-[0.5rem] font-bold tracking-widest uppercase flex-shrink-0"
        style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif" }}
      >
        output
      </span>

      {/* Count */}
      <span className="text-[0.5rem] flex-shrink-0" style={{ color: '#1a1a3a' }}>
        {outputs.length}
      </span>

      {/* Scrollable badge strip */}
      <div className="flex gap-1.5 overflow-x-auto flex-1 items-center py-1">
        {outputs.length === 0 ? (
          <span className="text-[0.55rem] italic" style={{ color: '#1a1a3a' }}>
            waiting…
          </span>
        ) : (
          <AnimatePresence>
            {outputs.map((out, i) => (
              <motion.span
                key={`${out}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex-shrink-0 px-2.5 py-1 rounded text-[0.65rem] font-bold"
                style={{
                  background: 'rgba(0,255,179,0.07)',
                  border:     '1px solid rgba(0,255,179,0.18)',
                  color:      '#00ffb3',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {out}
              </motion.span>
            ))}
          </AnimatePresence>
        )}
      </div>

    </div>
  )
}