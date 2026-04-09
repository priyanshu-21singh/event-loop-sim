// CodeMirror 6 extension that highlights the currently executing line.
//
// HOW CodeMirror 6 decorations work:
// CodeMirror doesn't let you just "set a background color on line 5".
// Instead you use the Extension system:
//   1. Create a StateField — stores which line is highlighted
//   2. Create a ViewPlugin — reads that field and draws decorations
//   3. Combine them into an extension you pass to EditorView
//
// A Decoration.line() applies CSS class to an entire line.
// We update the StateField from outside (from React) by dispatching
// a state transaction with our custom effect.

import {
  StateField,
  StateEffect,
  type Extension,
} from '@codemirror/state'
import {
  EditorView,
  Decoration,
  type DecorationSet,
} from '@codemirror/view'

// StateEffect is how you send custom data into CodeMirror's state machine.
// Think of it like an "action" in Redux — it carries a payload.
// Here the payload is the line number to highlight (or null to clear).
export const setExecLine = StateEffect.define<number | null>()

// The CSS class we apply to the highlighted line
const execLineDeco = Decoration.line({
  attributes: { class: 'cm-exec-line' },
})

// StateField holds the current decoration set.
// It starts empty (no highlight).
// When it receives a setExecLine effect, it rebuilds the decorations.
export const execLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,

  update(decorations, transaction) {
    // Map existing decorations through document changes
    // (if user types, line numbers shift — this keeps decorations correct)
    let updated = decorations.map(transaction.changes)

    // Check if any of the effects in this transaction is our setExecLine effect
    for (const effect of transaction.effects) {
      if (effect.is(setExecLine)) {
        const lineNum = effect.value
        if (lineNum === null) {
          // Clear highlight
          updated = Decoration.none
        } else {
          try {
            // Convert line number to document position
            const line = transaction.state.doc.line(lineNum)
            updated    = Decoration.set([execLineDeco.range(line.from)])
          } catch {
            // Line number out of range — ignore
            updated = Decoration.none
          }
        }
      }
    }

    return updated
  },

  // Tell CodeMirror this field provides decorations
  provide: field => EditorView.decorations.from(field),
})

// The CSS for the highlighted line.
// We inject it as a CodeMirror theme extension.
// This keeps the styles co-located with the extension that uses them.
const execLineTheme = EditorView.baseTheme({
  '.cm-exec-line': {
    background:  'rgba(0,255,179,0.07) !important',
    borderLeft:  '2px solid rgba(0,255,179,0.6)',
    animation:   'execLineSlide 0.25s ease',
  },
})

// Export the combined extension — just pass this to EditorView extensions
export function execLineExtension(): Extension {
  return [execLineField, execLineTheme]
}