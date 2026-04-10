// The bottom bar spanning the right column.
// Contains: output console, phase badge, sim buttons.
//
// Layout: [output strip ←→ flex grow] [phase badge] [buttons]
// On smaller screens the phase badge moves below.

import { OutputConsole } from './OutputConsole'
import { SimButtons }    from './SimButtons'
import { usePhase }      from '../../store/simStore'
import { PHASE_INFO }    from '../../engine/types'

export function BottomBar() {
  const phase     = usePhase()
  const phaseInfo = PHASE_INFO[phase]

  return (
    <div
      className="relative flex items-center gap-3 px-4 h-full overflow-hidden"
      style={{
        background:   'rgba(2,2,8,0.98)',
        borderTop:    '1px solid rgba(185,79,255,0.12)',
        flexShrink:   0,
      }}
    >
      {/* Gradient border line at the top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg,transparent,#00c8ff,#b94fff,transparent)',
          opacity: 0.4,
        }}
      />

      {/* Output console — takes remaining space */}
      <OutputConsole />

      {/* Phase badge */}
      <div
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-center"
        style={{
          background:  `${phaseInfo.color}10`,
          border:      `1px solid ${phaseInfo.color}30`,
          minWidth:    110,
        }}
      >
        <div
          className="font-orbitron text-[0.52rem] tracking-widest"
          style={{
            color:     phaseInfo.color,
            animation: phase !== 0 ? 'phaseBlink 1.2s step-end infinite' : 'none',
          }}
        >
          {phaseInfo.name}
        </div>
        <div
          className="text-[0.42rem] mt-0.5 leading-tight"
          style={{ color: '#4a5070', maxWidth: 120 }}
        >
          {phaseInfo.desc}
        </div>
      </div>

      {/* Sim control buttons */}
      <SimButtons />
    </div>
  )
}