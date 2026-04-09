// The entire left panel.
// Composes: header bar, PresetTabs, CodeEditor, LogOverlay.
//
// This component owns the "custom mode" local state —
// whether we're in preset (readOnly) or custom (editable) mode.
// When in custom mode, it shows the Analyze button and allows editing.

import { useState, useCallback } from 'react'
import { PresetTabs }  from './PresetTabs'
import { CodeEditor }  from './CodeEditor'
import { LogOverlay }  from './LogOverlay'
import { useSimControls, useActivePreset } from '../../store/simStore'
import { parseCodeToSteps } from '../../engine/parser'
import { PRESETS }          from '../../engine/presets'

const CUSTOM_STARTER = `// ✎ Write JavaScript — ⚡ Analyze or Ctrl+Enter
// Supported: console.log · setTimeout · Promise.resolve().then()

console.log('hello');
setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('world');`

export function EditorPane() {
  const [isCustom,   setIsCustom]   = useState(false)
  const [customCode, setCustomCode] = useState(CUSTOM_STARTER)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)

  const activePreset           = useActivePreset()
  const { loadPreset, loadCustom } = useSimControls()

  // The code currently shown in the editor
  const displayCode = isCustom
    ? customCode
    : (activePreset ? PRESETS[activePreset]?.code ?? '' : PRESETS['basic'].code)

  // Switch to custom mode
  const handleCustom = useCallback(() => {
    setIsCustom(true)
    setErrorMsg(null)
  }, [])

  // Switch back to a preset
  const handleLoadPreset = useCallback((id: string) => {
    setIsCustom(false)
    setErrorMsg(null)
    loadPreset(id)
  }, [loadPreset])

  // Parse custom code and load as simulation steps
  const handleAnalyze = useCallback(() => {
    setErrorMsg(null)
    const steps = parseCodeToSteps(customCode)
    if (!steps || steps.length <= 1) {
      setErrorMsg('No recognized patterns. Use: console.log() · setTimeout(() => ...) · Promise.resolve().then(() => ...)')
      return
    }
    loadCustom(customCode, steps)
    // Switch to read-only so exec line shows correctly
    setIsCustom(false)
  }, [customCode, loadCustom])

  // Ctrl+Enter shortcut
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (isCustom) handleAnalyze()
    }
  }, [isCustom, handleAnalyze])

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{ background: 'rgba(2,2,8,0.98)', borderRight: '1px solid rgba(185,79,255,0.1)' }}
      onKeyDown={handleKeyDown}
    >
      {/* Animated right-edge trace */}
      <div
        className="absolute top-0 right-0 w-px h-full pointer-events-none"
        style={{
          background: 'linear-gradient(180deg,transparent,#b94fff,transparent)',
          opacity: 0.3,
          animation: 'topbarGlow 3s ease infinite',
        }}
      />

      {/* ── Header bar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ background: 'rgba(4,4,16,1)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* macOS traffic lights */}
        <div className="flex gap-1.5">
          {['#ff5f57','#ffbd2e','#28c840'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>

        <span
          className="flex-1 text-[0.56rem] font-bold tracking-wider uppercase"
          style={{ color: '#4a5070', fontFamily: "'Exo 2', sans-serif" }}
        >
          Code Editor — script.js
        </span>

        <span
          className="text-[0.48rem] px-2 py-0.5 rounded"
          style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.2)', color: '#00c8ff' }}
        >
          JS
        </span>

        {/* Analyze button — only visible in custom mode */}
        {isCustom && (
          <button
            onClick={handleAnalyze}
            className="px-3 py-1 text-[0.58rem] rounded transition-all duration-150"
            style={{
              border:     '1px solid #b94fff',
              background: 'rgba(185,79,255,0.1)',
              color:      '#b94fff',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⚡ Run
          </button>
        )}
      </div>

      {/* ── Preset tabs ── */}
      <PresetTabs
        onCustom={handleCustom}
        isCustom={isCustom}
        onPreset={handleLoadPreset}
      />

      {/* ── Code editor ── */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          value={displayCode}
          readOnly={!isCustom}
          onChange={isCustom ? setCustomCode : undefined}
        />
      </div>

      {/* ── Error message ── */}
      {errorMsg && (
        <div
          className="px-3 py-2 text-[0.58rem] leading-relaxed flex-shrink-0"
          style={{
            background: 'rgba(255,32,96,0.07)',
            borderTop:  '1px solid rgba(255,32,96,0.15)',
            color:      '#ff6b9d',
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── Bottom hint bar ── */}
      <div
        className="flex items-center gap-2 px-3 py-1 flex-shrink-0"
        style={{ background: 'rgba(4,4,16,1)', borderTop: '1px solid rgba(255,255,255,0.03)' }}
      >
        <span className="flex-1 text-[0.5rem] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: '#4a5070' }}>
          {isCustom
            ? 'Edit code · ⚡ Run or Ctrl+Enter to simulate'
            : 'Preset (read-only) · click ✎ custom to write code'}
        </span>
      </div>

      {/* ── Timeline log ── */}
      <LogOverlay />
    </div>
  )
}