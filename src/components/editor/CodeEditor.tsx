// The actual code editor — a CodeMirror 6 instance wrapped in React.
//
// HOW CodeMirror 6 integrates with React:
// CodeMirror is NOT a React component. It's a vanilla JS library.
// We use useRef to hold the EditorView instance,
// and useEffect to create/destroy it when the component mounts/unmounts.
//
// To update the editor from outside (e.g. load a new preset):
// We dispatch a transaction to the EditorView.
// React state doesn't own the editor content — CodeMirror does.
//
// To read execLine changes from Zustand and apply them to CodeMirror:
// We useEffect on execLine, then dispatch a setExecLine effect.

import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment }  from '@codemirror/state'
import { defaultKeymap }             from '@codemirror/commands'
import { javascript }                from '@codemirror/lang-javascript'
import { oneDark }                   from '@codemirror/theme-one-dark'
import { execLineExtension, setExecLine } from './execLineExtension'
import { useExecLine } from '../../store/simStore'

interface CodeEditorProps {
  value:     string         // current code to display
  readOnly:  boolean        // true for presets, false for custom mode
  onChange?: (code: string) => void  // called when user edits (custom mode only)
}

// Compartment lets us reconfigure one part of the editor without rebuilding it.
// We use it to toggle readOnly on/off when switching preset ↔ custom.
const readOnlyCompartment = new Compartment()

export function CodeEditor({ value, readOnly, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef      = useRef<EditorView | null>(null)
  const execLine     = useExecLine()

  // ── Create the editor on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          // Core extensions
          lineNumbers(),
          highlightActiveLine(),
          javascript(),
          oneDark,
          keymap.of(defaultKeymap),

          // Our custom exec line highlight
          execLineExtension(),

          // Editable compartment — can be reconfigured later
          readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),

          // Listen for document changes → call onChange
          EditorView.updateListener.of(update => {
            if (update.docChanged && onChange) {
              onChange(update.state.doc.toString())
            }
          }),

          // Custom theme overrides to match our dark neon aesthetic
          EditorView.theme({
            '&': {
              height:     '100%',
              background: 'rgba(2,2,8,1)',
              fontSize:   '0.7rem',
              fontFamily: "'JetBrains Mono', monospace",
            },
            '.cm-scroller': {
              overflow:   'auto',
              lineHeight: '1.72',
            },
            '.cm-content': {
              padding: '14px 0',
            },
            '.cm-gutters': {
              background:  'rgba(2,2,8,1)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
              color:       '#1a1a3a',
            },
            '.cm-activeLineGutter': { background: 'rgba(0,200,255,0.06)' },
            '.cm-cursor': { borderLeftColor: '#00c8ff' },
            '&.cm-focused': { outline: 'none' },
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only run on mount — value changes handled separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync value from outside ──────────────────────────────────────────────
  // When parent changes `value` (e.g. loading a new preset),
  // replace the entire document content.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return   // no change — skip dispatch

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }, [value])

  // ── Sync readOnly from outside ───────────────────────────────────────────
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly])

  // ── Sync execution line highlight ────────────────────────────────────────
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: setExecLine.of(execLine),
    })
  }, [execLine])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden"
      style={{ cursor: readOnly ? 'default' : 'text' }}
    />
  )
}