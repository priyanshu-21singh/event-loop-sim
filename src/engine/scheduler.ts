// src/engine/scheduler.ts
//
// Pure function that applies one SimStep to the current simulation state.
// This is the core logic of the entire app.
//
// "Pure" means:
//   - given the same inputs, always returns the same output
//   - never modifies the input objects (returns new objects)
//   - no side effects (no DOM, no network, no React)
//
// This makes it trivially testable and completely decoupled from the UI.

import type { SimStep, Task, QueueKey } from './types'

// The shape of state this function reads and produces.
// The Zustand store holds this exact shape.
export interface SimState {
  callStack:    Task[]  // running functions
  microQueue:   Task[]  // promise tasks
  macroQueue:   Task[]  // setTimeout
  timerHeap:    Task[]  // waiting timers
  outputs:      string[] // concole.log
  currentPhase: 0 | 1 | 2 | 3  // sync/micro/macro
  execLine:     number | null  // highlight code line 
}

// What the scheduler returns in addition to new state.
// The store uses these to trigger side effects (canvas packets, logs).
export interface StepResult {
  nextState:      SimState
  packetFrom?:    string   // NodeId — spawn a flying packet from here
  packetTo?:      string   // NodeId — to here
  packetType?:    string   // TaskType — determines color
  packetLabel?:   string
  logMessage?:    string
  logType?:       string
  isComplete:     boolean  // true when action.kind === 'done'
}

// ─────────────────────────────────────────────
// MAIN FUNCTION
// take current state + one step ==> return result
export function applyStep(state: SimState, step: SimStep): StepResult {
  // Spread state to create a new object — never mutate input
  const next: SimState = {
    ...state,
    callStack:  [...state.callStack],
    microQueue: [...state.microQueue],
    macroQueue: [...state.macroQueue],
    timerHeap:  [...state.timerHeap],
    outputs:    [...state.outputs],
    currentPhase: step.phase,
    execLine:   null,
  }

  const result: StepResult = {
    nextState:  next,
    isComplete: false,
  }

  const action = step.action

  switch (action.kind) {

    case 'push': {
      // A new task is pushed into a queue.
      // We also record which line of code triggered this.
      getQueue(next, action.queue).push(action.task)
      //find the correct queue(micro or macro)
      //Return that array 
      // add a task into it 
      next.execLine = action.line ?? null
      result.packetFrom  = action.from
      result.packetTo    = queueToNodeId(action.queue)
      result.packetType  = action.task.type
      result.packetLabel = action.task.label
      result.logMessage  = `push <b>${action.task.label}</b> → <i>${action.queue}</i>`
      result.logType     = action.task.type
      break
    }

    case 'exec': {
      // A task is executed: removed from its queue, output recorded.
      const queue = getQueue(next, action.queue)
      const idx = queue.findIndex(t => t.id === action.taskId)
      if (idx !== -1) queue.splice(idx, 1)
      if (action.output) next.outputs.push(action.output)
      next.execLine = action.line ?? null
      result.logMessage = `exec <b>${action.taskId}</b> from <i>${action.queue}</i>`
      result.logType    = action.queue === 'callStack' ? 'sync'
                        : action.queue === 'microQueue' ? 'micro' : 'macro'
      if (action.output) {
        result.packetFrom  = queueToNodeId(action.queue)
        result.packetTo    = 'node-output'
        result.packetType  = 'sync'
        result.packetLabel = action.output
      }
      break
    }

    case 'pop': {
      // A task is removed from a queue without executing (e.g. resolved Promise wrapper)
      const queue = getQueue(next, action.queue)
      const idx = queue.findIndex(t => t.id === action.taskId)
      if (idx !== -1) queue.splice(idx, 1)
      next.execLine     = action.line ?? null
      result.logMessage = `return <b>${action.taskId}</b> from ${action.queue}`
      result.logType    = 'sync'
      break
    }

    case 'heapFire': {
      // Timer expires: remove from timerHeap, packet flies to macroQueue node.
      // The actual macroQueue push happens in the NEXT step (kind: 'push').
      const idx = next.timerHeap.findIndex(t => t.id === action.heapTaskId)
      if (idx !== -1) next.timerHeap.splice(idx, 1)
      next.execLine      = action.line ?? null
      result.packetFrom  = 'node-heap'
      result.packetTo    = 'node-macro'
      result.packetType  = 'heap'
      result.packetLabel = '⚡ fire!'
      result.logMessage  = 'Timer heap fired → Macrotask Queue'
      result.logType     = 'macro'
      break
    }

    case 'done': {
      // Simulation finished.
      next.currentPhase = 0
      next.execLine     = null
      result.isComplete = true
      result.logMessage = '✓ Execution complete'
      result.logType    = 'out'
      break
    }
  }

  result.nextState = next
  return result
}

// ─────────────────────────────────────────────
// HELPERS
// Private to this module — not exported.
// ─────────────────────────────────────────────

// Returns a direct reference to the correct queue array inside state.
// Used inside applyStep to mutate the copy (not the original).
function getQueue(state: SimState, key: QueueKey): Task[] {
  switch (key) {
    case 'callStack':  return state.callStack
    case 'microQueue': return state.microQueue
    case 'macroQueue': return state.macroQueue
    case 'timerHeap':  return state.timerHeap
  }
}

// Converts a QueueKey to the DOM node id it visually corresponds to.
function queueToNodeId(queue: QueueKey): string {
  const map: Record<QueueKey, string> = {
    callStack:  'node-call',
    microQueue: 'node-micro',
    macroQueue: 'node-macro',
    timerHeap:  'node-heap',
  }
  return map[queue]
}