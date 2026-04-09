// Speed control panel in the TopBar.
// Three named mode buttons + a fine-tune slider.
//
// HOW the speed system works end-to-end:
//   1. User clicks a mode button or moves the slider
//   2. setSpeedMode or setDelay is called → updates store
//   3. useSpeedCSS hook (in App.tsx) reads delay from store
//      and sets --step-dur CSS variable on :root
//   4. Every CSS animation that uses var(--step-dur) automatically
//      adjusts — chip pop-in, brain spin, exec glow all scale together
//   5. useSimLoop hook reads delay for its setInterval gap
//      so steps also fire slower/faster

import { useSpeedMode, useDelay, useSimControls } from '../../store/simStore'
import type { SpeedMode } from '../../engine/types'

// Each mode's display data
const MODES: { id: SpeedMode; icon: string; label: string; ms: string; desc: string }[] = [
  { id: 'turtle', icon: '🐢', label: 'Turtle', ms: '2500ms', desc: 'Slow + tooltips'  },
  { id: 'learn',  icon: '📖', label: 'Learn',  ms: '1000ms', desc: 'Comfortable pace' },
  { id: 'pro',    icon: '⚡', label: 'Pro',    ms: '200ms',  desc: 'Fast, no tips'    },
]

const MODE_COLORS: Record<SpeedMode, string> = {
  turtle: '#00ffb3',
  learn:  '#00c8ff',
  pro:    '#b94fff',
}

export function SpeedPanel() {
  const speedMode          = useSpeedMode()
  const delay              = useDelay()
  const { setSpeedMode, setDelay } = useSimControls()

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const ms = parseInt(e.target.value)
    setDelay(ms)
    // Auto-highlight whichever mode is closest
    if      (ms >= 2000) setSpeedMode('turtle')
    else if (ms >= 600)  setSpeedMode('learn')
    else                 setSpeedMode('pro')
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-xl"
      style={{ background: 'rgba(10,10,30,0.8)', border: '1px solid rgba(185,79,255,0.2)' }}
    >
      {/* Label */}
      <span
        className="text-[0.48rem] tracking-widest uppercase"
        style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif", fontWeight: 700 }}
      >
        Speed
      </span>

      {/* Mode buttons */}
      <div className="flex gap-1">
        {MODES.map(m => {
          const active = speedMode === m.id
          const color  = MODE_COLORS[m.id]
          return (
            <button
              key={m.id}
              onClick={() => setSpeedMode(m.id)}
              title={m.desc}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                border:     `1.5px solid ${active ? color : color + '30'}`,
                color:      active ? color : color + '70',
                background: active ? color + '15' : 'transparent',
                boxShadow:  active ? `0 0 14px ${color}35` : 'none',
              }}
            >
              <span className="text-[0.85rem] leading-none">{m.icon}</span>
              <span
                className="text-[0.4rem] font-bold tracking-wider uppercase"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {m.label}
              </span>
              <span className="text-[0.36rem]" style={{ color: '#4a5070' }}>{m.ms}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Fine-tune slider */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-[0.38rem] tracking-widest uppercase"
          style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif" }}
        >
          Fine Tune
        </span>
        <input
          type="range"
          min={150}
          max={3000}
          step={50}
          value={delay}
          onChange={handleSlider}
          className="w-20 h-1 rounded cursor-pointer"
          style={{ accentColor: '#b94fff' }}
        />
        <span
          className="text-[0.42rem] font-bold"
          style={{ color: '#b94fff', fontFamily: "'Exo 2', sans-serif" }}
        >
          {(delay / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  )
}