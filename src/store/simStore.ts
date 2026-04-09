// src/store/simStore.ts
//
// The single source of truth for all simulation state.
//
// WHY Zustand over React Context or useState?
//
//   useState: state lives in one component. Other components need props.
//             Causes prop drilling. Re-renders entire tree.
//
//   Context: state is accessible anywhere but context has NO optimization.
//            Any change to the context value re-renders EVERY consumer.
//            For a simulation that updates 10x/second, this is fatal.
//
//   Zustand: components subscribe to exactly the slice they need.
//            Only the subscribed components re-render on change.
//            Zero boilerplate. Works outside React (we call it from hooks too).
//
// ARCHITECTURE RULE:
//   This store knows about the engine (imports from ../engine/).
//   Components know about the store (import from ./simStore).
//   The engine knows about NOTHING (no imports from store or components).
//   This one-way dependency chain prevents circular imports and spaghetti.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyStep, type SimState } from '../engine/scheduler'
import { PRESETS, PRESET_ORDER }    from '../engine/presets'
import { SPEED_PRESETS }            from '../engine/types'
import type {
  Task,
  SimStep,
  SpeedMode,
  LogEntry,
  LogType,
  Packet,
} from '../engine/types'

// ─── STORE INTERFACE ──────────────────────────────────────────────────────────
// This is the complete shape of everything in the store.
// Split into logical sections so it's easy to find things.
//
// WHY define this as a separate interface?
// Because create<SimStore>() will enforce this shape.
// Every action and state field must match. TypeScript tells you if something's missing.
interface SimStore {

  // ── Simulation engine state ──
  // These mirror SimState from scheduler.ts exactly.
  // They are kept in sync by the step() action.
  callStack:    Task[]
  microQueue:   Task[]
  macroQueue:   Task[]
  timerHeap:    Task[]
  outputs:      string[]
  currentPhase: 0 | 1 | 2 | 3
  execLine:     number | null

  // ── Step sequence ──
  steps:      SimStep[]    // the full sequence for the current preset/code
  stepIndex:  number       // which step we're on right now
  running:    boolean      // is auto-play active?
  isComplete: boolean      // did we reach 'done'?

  // ── Log ──
  logEntries: LogEntry[]
  startTime:  number       // ms timestamp when simulation started (for log timings)

  // ── Speed ──
  speedMode: SpeedMode
  delay:     number        // ms between steps in auto-play

  // ── Editor ──
  activePreset: string | null  // which preset tab is selected
  customCode:   string         // what's in the editor when using custom mode

  // ── Packets ──
  // Packets live here as a ref target for the canvas — see note in Packet type.
  // We store them separately from SimState because they don't affect simulation logic.
  packets: Packet[]

  // ── Actions ──
  // Convention: actions are verbs. State fields are nouns.
  // This makes it immediately obvious what is data vs behavior.

  loadPreset:   (id: string) => void
  step:         () => void          // advance one step
  run:          () => void          // start auto-play
  pause:        () => void          // stop auto-play
  reset:        () => void          // clear everything back to initial
  setSpeedMode: (mode: SpeedMode) => void
  setDelay:     (ms: number) => void
  addPacket:    (p: Packet) => void
  removePacket: (id: string) => void
}

// ─── INITIAL QUEUE STATE ──────────────────────────────────────────────────────
// Extracted as a constant so reset() can reuse it.
// WHY? DRY — Don't Repeat Yourself. If we add a new queue field later,
// we add it here once and reset() automatically picks it up.
const EMPTY_SIM_STATE: SimState = {
  callStack:    [],
  microQueue:   [],
  macroQueue:   [],
  timerHeap:    [],
  outputs:      [],
  currentPhase: 0,
  execLine:     null,
}

// ─── LOG HELPERS (module-level, not in store) ──────────────────────────────────
// These are pure helper functions used inside actions.
// Keeping them outside the store keeps the store definition clean.
// They don't need access to state — they just build data structures.

let logCounter = 0

// Creates a new LogEntry. The id uses a counter + timestamp combo
// to guarantee uniqueness even if two entries arrive in the same millisecond.
function makeLogEntry(
  message: string,
  type: LogType,
  startTime: number
): LogEntry {
  return {
    id:      `log-${++logCounter}-${Date.now()}`,
    time:    Date.now() - startTime,
    message,
    type,
  }
}

// ─── CREATE STORE ─────────────────────────────────────────────────────────────
// persist() is a Zustand middleware.
// It wraps the store and automatically saves/loads from localStorage.
// We only persist user preferences (speed, last preset) — not simulation state.
// Simulation state is always reset fresh, which makes more sense UX-wise.
//
// WHY wrap with persist at all?
// So users don't lose their speed preference every page refresh.
// It feels polished — the app remembers you.

export const useSimStore = create<SimStore>()(
  persist(

    // This function receives set and get, returns the initial store shape.
    // set()  → schedule a state update
    // get()  → read current state right now (synchronously)
    (set, get) => ({

      // ── Initial state values ──
      ...EMPTY_SIM_STATE,
      steps:        [],
      stepIndex:    0,
      running:      false,
      isComplete:   false,
      logEntries:   [],
      startTime:    Date.now(),
      speedMode:    'learn',
      delay:        SPEED_PRESETS['learn'],
      activePreset: null,
      customCode:   '',
      packets:      [],

      // ─────────────────────────────────────────────────────────────────────
      // loadPreset
      // Loads a named preset: sets the code in the editor, loads steps,
      // and resets all simulation state so we start fresh.
      // ─────────────────────────────────────────────────────────────────────
      loadPreset: (id: string) => {
        const preset = PRESETS[id]
        // Guard: if someone passes an invalid id, do nothing.
        // This protects against stale localStorage data or typos.
        if (!preset) return

        set({
          // Reset all queue state
          ...EMPTY_SIM_STATE,

          // Load the preset's steps
          steps:        preset.steps,
          stepIndex:    0,
          running:      false,
          isComplete:   false,

          // Start phase 1 since there's code to run
          currentPhase: 1,

          // Clear log and packets from any previous run
          logEntries:   [],
          packets:      [],
          startTime:    Date.now(),

          // Mark which preset is active (for tab highlighting)
          activePreset: id,
          customCode:   '',
        })
      },

      // ─────────────────────────────────────────────────────────────────────
      // step
      // Advances the simulation by one step.
      // This is the core action — everything flows through here.
      //
      // Flow:
      //   1. Check if there are steps remaining
      //   2. Read the current step from the sequence
      //   3. Call applyStep() — pure function, returns new state + hints
      //   4. Apply new state to store
      //   5. Process side effect hints (packets, logs)
      // ─────────────────────────────────────────────────────────────────────
      step: () => {
        const state = get()

        // Guard: nothing to do if we've run all steps
        if (state.stepIndex >= state.steps.length) return

        // Guard: nothing to do if already complete
        if (state.isComplete) return

        // Get the step we're about to execute
        const currentStep = state.steps[state.stepIndex]

        // Call the pure scheduler function.
        // It knows nothing about React or Zustand.
        // It just computes what SHOULD happen.
        const result = applyStep(state, currentStep)

        // Build a log entry if the step produced one
        const newLog = result.logMessage
          ? makeLogEntry(result.logMessage, (result.logType as LogType) ?? 'info', state.startTime)
          : null

        // Apply new simulation state + advance the step index
        set({
          // Spread all the queue/phase/line changes from applyStep
          callStack:    result.nextState.callStack,
          microQueue:   result.nextState.microQueue,
          macroQueue:   result.nextState.macroQueue,
          timerHeap:    result.nextState.timerHeap,
          outputs:      result.nextState.outputs,
          currentPhase: result.nextState.currentPhase,
          execLine:     result.nextState.execLine,

          // Move to next step
          stepIndex: state.stepIndex + 1,

          // Mark complete if the step was 'done'
          isComplete: result.isComplete,

          // Stop auto-play if we just finished
          running: result.isComplete ? false : state.running,

          // Append log entry if there is one
          logEntries: newLog
            ? [...state.logEntries, newLog]
            : state.logEntries,
        })

        // ── Side effect: spawn a packet on the canvas ──
        // We do this AFTER set() so the store update lands first.
        // The packet is a visual effect hint — not simulation logic.
        // The canvas layer reads packets from the store and animates them.
        if (result.packetFrom && result.packetTo) {
          const packet: Packet = {
            id:    `pkt-${Date.now()}-${Math.random()}`,
            from:  result.packetFrom  as Packet['from'],
            to:    result.packetTo    as Packet['to'],
            type:  (result.packetType ?? 'sync') as Packet['type'],
            label: result.packetLabel ?? '',
            t:     0,
            trail: [],
          }
          // addPacket is defined below — we call get() to access it
          // because we can't reference store actions before they're defined
          get().addPacket(packet)
        }
      },

      // ─────────────────────────────────────────────────────────────────────
      // run / pause
      // These only flip the `running` flag.
      // The actual interval that calls step() lives in useSimLoop hook —
      // NOT here. The store doesn't manage timers.
      //
      // WHY keep the timer in a hook, not the store?
      // The store is for STATE. A setInterval is a SIDE EFFECT.
      // Mixing them makes the store impossible to reason about.
      // The hook exists exactly to bridge the store's `running` flag
      // with a real browser interval.
      // ─────────────────────────────────────────────────────────────────────
      run: () => {
        const { isComplete, steps, stepIndex } = get()
        // Don't start if there's nothing to run or we're already done
        if (isComplete || stepIndex >= steps.length) return
        set({ running: true })
      },

      pause: () => set({ running: false }),

      // ─────────────────────────────────────────────────────────────────────
      // reset
      // Returns everything to initial state.
      // Preserves speed settings — user preferences survive a reset.
      // ─────────────────────────────────────────────────────────────────────
      reset: () => {
        set({
          ...EMPTY_SIM_STATE,
          steps:        [],
          stepIndex:    0,
          running:      false,
          isComplete:   false,
          logEntries:   [],
          packets:      [],
          startTime:    Date.now(),
          activePreset: null,
          customCode:   '',
          // Notice: speedMode and delay are NOT reset.
          // User's speed preference survives reset. Feels natural.
        })
      },

      // ─────────────────────────────────────────────────────────────────────
      // setSpeedMode / setDelay
      // Two separate actions because the slider bypasses the named modes.
      // setSpeedMode sets both the named mode AND its associated delay.
      // setDelay sets only the delay (used by the fine-tune slider).
      // ─────────────────────────────────────────────────────────────────────
      setSpeedMode: (mode: SpeedMode) => {
        set({
          speedMode: mode,
          delay:     SPEED_PRESETS[mode],
        })
      },

      setDelay: (ms: number) => {
        set({ delay: ms })
      },

      // ─────────────────────────────────────────────────────────────────────
      // addPacket / removePacket
      // Managed by the canvas layer.
      // Canvas spawns packets via addPacket when a step fires.
      // Canvas removes them via removePacket when animation completes (t >= 1).
      // ─────────────────────────────────────────────────────────────────────
      addPacket: (p: Packet) => {
        set(state => ({ packets: [...state.packets, p] }))
      },

      removePacket: (id: string) => {
        set(state => ({
          packets: state.packets.filter(p => p.id !== id)
        }))
      },
    }),

    // ── persist config ──
    // Only save these fields to localStorage.
    // Everything else resets fresh on page load.
    {
      name: 'event-loop-sim-prefs',
      partialize: (state) => ({
        speedMode:    state.speedMode,
        delay:        state.delay,
        activePreset: state.activePreset,
      }),
    }
  )
)

// ─── SELECTOR HOOKS ───────────────────────────────────────────────────────────
// These are pre-built selectors exported as convenience hooks.
//
// WHY export these instead of having components write their own selectors?
//
// 1. Consistency — every component reads phase the same way
// 2. Refactoring — if we rename `currentPhase` to `phase`, we fix it here once
// 3. Readability — `usePhase()` reads better than `useSimStore(s => s.currentPhase)`
//
// Components import and use these like regular hooks:
//   const phase = usePhase()
//   const { run, pause, reset } = useSimControls()

export const usePhase        = () => useSimStore(s => s.currentPhase)
export const useExecLine     = () => useSimStore(s => s.execLine)
export const useCallStack    = () => useSimStore(s => s.callStack)
export const useMicroQueue   = () => useSimStore(s => s.microQueue)
export const useMacroQueue   = () => useSimStore(s => s.macroQueue)
export const useTimerHeap    = () => useSimStore(s => s.timerHeap)
export const useOutputs      = () => useSimStore(s => s.outputs)
export const useLogEntries   = () => useSimStore(s => s.logEntries)
export const usePackets      = () => useSimStore(s => s.packets)
export const useIsRunning    = () => useSimStore(s => s.running)
export const useIsComplete   = () => useSimStore(s => s.isComplete)
export const useActivePreset = () => useSimStore(s => s.activePreset)
export const useDelay        = () => useSimStore(s => s.delay)
export const useSpeedMode    = () => useSimStore(s => s.speedMode)

// Groups related actions so components don't import them one by one
export const useSimControls = () => useSimStore(s => ({
  run:          s.run,
  pause:        s.pause,
  reset:        s.reset,
  step:         s.step,
  loadPreset:   s.loadPreset,
  setSpeedMode: s.setSpeedMode,
  setDelay:     s.setDelay,
}))