// Run / Pause / Step / Reset buttons.
// Each button reads exactly the state it needs and calls one action.
//
// WHY four separate buttons instead of a single toggle?
//   - Run/Pause is one button that changes label based on `running`
//   - Step lets the user advance one step at a time for learning
//   - Reset clears everything
//   - Each has a distinct visual weight matching its importance
//
// Disabled states are derived from store state:
//   - Run/Step disabled when: no steps loaded, or simulation complete
//   - Step disabled when: auto-running (can't manually step while auto-playing)
//   - Reset always enabled

import { useIsRunning, useIsComplete, useSimStore, useSimControls } from '../../store/simStore'

export function SimButtons() {
  const running    = useIsRunning()
  const isComplete = useIsComplete()
  const stepIndex  = useSimStore(s => s.stepIndex)
  const totalSteps = useSimStore(s => s.steps.length)
  const { run, pause, step, reset } = useSimControls()

  const hasSteps   = totalSteps > 0
  const canAdvance = hasSteps && !isComplete && stepIndex < totalSteps
  const canStep    = canAdvance && !running

  function handleRunPause() {
    if (running) pause()
    else run()
  }

  // Progress percentage for the run button label area
  const progress = hasSteps ? Math.round((stepIndex / totalSteps) * 100) : 0

  return (
    <div className="flex items-center gap-2">

      {/* RUN / PAUSE — primary action, largest visual weight */}
      <button
        onClick={handleRunPause}
        disabled={!canAdvance && !running}
        className="relative overflow-hidden px-5 py-2 rounded-lg font-orbitron text-[0.62rem] font-bold tracking-widest uppercase transition-all duration-150"
        style={{
          background: canAdvance || running
            ? 'linear-gradient(135deg,#00ffb3,#00cc7a)'
            : 'rgba(255,255,255,0.05)',
          color:      canAdvance || running ? '#001a0e' : '#1a1a3a',
          cursor:     canAdvance || running ? 'pointer' : 'not-allowed',
          boxShadow:  canAdvance || running ? '0 0 20px rgba(0,255,179,0.3)' : 'none',
          minWidth:   90,
        }}
      >
        {/* Shimmer effect on hover */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:  'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
            transform:   'translateX(-100%)',
            transition:  'transform 0.5s',
          }}
        />
        {isComplete ? '✓ Done' : running ? '⏸ Pause' : '▶ Run'}
      </button>

      {/* STEP — secondary */}
      <button
        onClick={step}
        disabled={!canStep}
        className="px-4 py-2 rounded-lg text-[0.62rem] font-mono border transition-all duration-150"
        style={{
          borderColor: canStep ? '#b94fff' : '#1a1a3a',
          color:       canStep ? '#b94fff' : '#1a1a3a',
          background:  canStep ? 'rgba(185,79,255,0.08)' : 'transparent',
          cursor:      canStep ? 'pointer' : 'not-allowed',
        }}
      >
        Step ›
      </button>

      {/* RESET */}
      <button
        onClick={reset}
        className="px-3 py-2 rounded-lg text-[0.62rem] font-mono border transition-all duration-150"
        style={{
          borderColor: '#ff2060',
          color:       '#ff2060',
          background:  'transparent',
          cursor:      'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,32,96,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        ↺
      </button>

      {/* Progress indicator */}
      {hasSteps && (
        <span
          className="text-[0.48rem] ml-1"
          style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif" }}
        >
          {stepIndex}/{totalSteps} · {progress}%
        </span>
      )}

    </div>
  )
}