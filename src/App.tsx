//  React Component
// src/App.tsx — TEMPORARY verification, we replace this next session
import { useSimStore, useCallStack, useSimControls, usePhase } from './store/simStore'

export default function App() {
  const callStack = useCallStack()
  const phase     = usePhase()
  const { loadPreset, step, reset } = useSimControls()

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: 'white' }}>

      <h2>Store Verification ✓</h2>

      <div style={{ marginBottom: 16 }}>
        <b>Phase:</b> {phase} &nbsp;|&nbsp;
        <b>Call Stack:</b> {callStack.length} tasks
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => loadPreset('basic')}>Load Basic</button>
        <button onClick={step}>Step →</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div>
        <b>Call Stack contents:</b>
        <pre>{JSON.stringify(callStack, null, 2)}</pre>
      </div>

    </div>
  )
}