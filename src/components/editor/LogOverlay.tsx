// Scrollable log of every simulation event at the bottom of the editor.
// Each entry shows: timestamp, colored message, border color by type.
//
// WHY put the log in the editor pane?
// Because the log is about CODE execution — which line ran, what was pushed.
// It's contextually related to the code above it, not the visualization.

import { useLogEntries } from '../../store/simStore'
import { useEffect, useRef } from 'react'

// Color per log type — matches the queue/node colors throughout the app
const TYPE_COLORS: Record<string, string> = {
  sync:  '#ff2060',
  micro: '#ff8800',
  macro: '#00c8ff',
  out:   '#00ffb3',
  info:  '#b94fff',
}

export function LogOverlay() {
  const entries    = useLogEntries()
  const bottomRef  = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        maxHeight:   130,
        borderTop:   '1px solid rgba(185,79,255,0.12)',
        background:  'rgba(2,2,8,0.97)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-3 py-1 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
      >
        <span
          className="text-[0.5rem] font-bold tracking-widest uppercase"
          style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif" }}
        >
          Timeline
        </span>
        <span className="ml-auto text-[0.48rem]" style={{ color: '#1a1a3a' }}>
          {entries.length} events
        </span>
      </div>

      {/* Scrollable entries */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <p className="px-3 py-2 text-[0.52rem] italic" style={{ color: '#1a1a3a' }}>
            No events yet — run a preset to begin
          </p>
        )}
        {entries.map(entry => {
          const color = TYPE_COLORS[entry.type] ?? '#4a5070'
          return (
            <div
              key={entry.id}
              className="flex items-baseline gap-1.5 px-3 text-[0.55rem] leading-7"
              style={{
                borderLeft: `2px solid ${color}55`,
                animation:  'logSlide 0.15s ease',
                color,
              }}
            >
              <span className="text-[0.44rem] flex-shrink-0" style={{ color: '#1a1a3a', minWidth: 32 }}>
                {(entry.time / 1000).toFixed(2)}s
              </span>
              {/* dangerouslySetInnerHTML because logMessage contains <b> and <i> tags */}
              <span dangerouslySetInnerHTML={{ __html: entry.message }} />
            </div>
          )
        })}
        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}