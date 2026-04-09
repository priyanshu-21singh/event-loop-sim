// TopBar sits at the top spanning the full width.
// Shows: logo, LIVE badge, current phase, speed panel.
//
// It reads `currentPhase` from the store to show the correct phase label.
// PHASE_INFO maps phase number → display name + color.

import { Pill }       from '../ui/Pill'
import { SpeedPanel } from '../controls/SpeedPanel'
import { usePhase }   from '../../store/simStore'
import { PHASE_INFO } from '../../engine/types'

export function TopBar() {
  const phase     = usePhase()
  const phaseInfo = PHASE_INFO[phase]

  return (
    <header
      className="relative z-20 flex items-center gap-3 px-5"
      style={{
        height:       58,
        background:   'rgba(2,2,8,0.97)',
        borderBottom: '1px solid rgba(185,79,255,0.18)',
        backdropFilter: 'blur(30px)',
        flexShrink: 0,
      }}
    >
      {/* Animated rainbow border line at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg,transparent,#b94fff,#00c8ff,#00ffb3,transparent)',
          animation:  'topbarGlow 3s linear infinite',
        }}
      />

      {/* Logo */}
      <h1
        className="font-orbitron font-black tracking-widest text-base select-none flex-shrink-0"
        style={{
          backgroundImage:    'linear-gradient(90deg,#00ffb3,#00c8ff,#b94fff,#ff2060)',
          backgroundSize:     '200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip:     'text',
          animation:          'logoFlow 4s linear infinite',
        }}
      >
        ⟳ EVENT LOOP
      </h1>

      {/* Live badge */}
      <Pill color="#00ffb3" pulse>LIVE</Pill>

      {/* Current phase */}
      <Pill color={phaseInfo.color}>
        {phase === 0 ? 'IDLE' : `PH${phase}`}
      </Pill>

      {/* Phase description — only shown when not idle */}
      {phase !== 0 && (
        <span
          className="text-[0.5rem] tracking-wider hidden md:block"
          style={{ color: phaseInfo.color, fontFamily: "'Exo 2', sans-serif", opacity: 0.8 }}
        >
          {phaseInfo.desc}
        </span>
      )}

      {/* Push speed panel to right */}
      <div className="flex-1" />
      <SpeedPanel />
    </header>
  )
}