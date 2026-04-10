// The spinning ring animation inside the Scheduler node.
// Two counter-rotating rings that spin faster/slower with speed.
// Uses CSS animation driven by --step-dur so speed panel affects it.

import { useIsRunning } from '../../store/simStore'

export function BrainRing() {
  const running = useIsRunning()

  // Animation duration derived from the CSS variable.
  // When --step-dur changes, the spin speed changes proportionally.
  const outerDur = 'calc(var(--step-dur) * 0.07)'
  const innerDur = 'calc(var(--step-dur) * 0.045)'

  return (
    <div className="relative w-14 h-14 mb-2">
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border:           '2px solid transparent',
          borderTopColor:   '#b94fff',
          borderRightColor: '#00c8ff',
          animation:        running ? `brainSpin ${outerDur} linear infinite` : 'none',
        }}
      />
      {/* Inner ring — spins opposite direction */}
      <div
        className="absolute rounded-full"
        style={{
          inset:            7,
          border:           '1.5px solid transparent',
          borderBottomColor: '#00ffb3',
          borderLeftColor:  '#ff8800',
          animation:        running ? `brainSpin ${innerDur} linear infinite reverse` : 'none',
        }}
      />
      {/* Center label */}
      <div
        className="absolute inset-0 flex items-center justify-center font-orbitron text-[0.33rem] tracking-wider"
        style={{ color: '#b94fff' }}
      >
        BRAIN
      </div>
    </div>
  )
}