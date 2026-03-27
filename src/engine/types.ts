// src/engine/types.ts
//
// This is the single source of truth for all data shapes in the app.
// Every component, store, and engine function imports types from here.
// If the shape of data needs to change, there is exactly one place to change it.

// ─────────────────────────────────────────────
// TASKS
// A Task is one piece of work sitting in a queue.
// type tells us which queue it belongs to and how to style it.
// ─────────────────────────────────────────────
export type TaskType = 'sync' | 'micro' | 'macro'| 'heap'


export interface Task {
    id: string     // unique identifier e.g "task-001"
    label: string  //display text e.g 'log("hello")'
    type: TaskType // determines color and which queue it can live in
}

// ─────────────────────────────────────────────
// QUEUES
// QueueKey is the internal name for each queue.
// NodeId is the DOM element id of the corresponding node card.
// These are separate because the DOM id follows a naming convention
// while QueueKey is used for state management.
// ─────────────────────────────────────────────
export type QueueKey = 'callStack' | 'microQueue' | 'macroQueue' | 'timerHeap'


export type NodeId = 'node-scheduler' | 'node-call' | 'node-micro' | 'node-macro' | 'node-heap' | 'node-output' 

// Maps every QueueKey to the NodeId it visually corresponds to.
// Used by the canvas layer to know where to draw packet paths.
 export const QUEUE_TO_NODE: Record<QueueKey, NodeId> = {
    callStack: 'node-call',
    microQueue: 'node-macro',
    macroQueue: 'node-macro',
    timerHeap: 'node-heap',
 }  

 // ─────────────────────────────────────────────
// STEPS
// A SimStep is one discrete moment in the simulation.
// The scheduler reads steps one at a time and applies them to state.
//
// We use a discriminated union for StepAction.
// This means TypeScript can narrow the type based on the `kind` field.
// Inside a switch(action.kind) block, TS knows exactly which fields exist.
// ─────────────────────────────────────────────
export type StepAction = 
| {
    kind: 'push'
    queue: QueueKey
    task: Task
    from: NodeId    // which node is seanding this task
    line?: number   // source code line to highlight in editor
}
| {
    kind: 'exac'
    queue: QueueKey
    taskId: string // id of the task being executed 
    output?: string // if execution produces console output 
    line?: number
} 
| {
    kind: 'pop'
    queue: QueueKey
    taskId: string // id of the task being removed without executing
    line?: number
}
|{
    kind: 'heapFire'
    heapTaskId: string // the timer task moving from heap==> macroQueue
    line?: number 
}
| {
    kind : 'done' // singals simulation is complete 
}

export interface SimStep {
    phase: 0 | 1 | 2 | 3 // which execution phase this step belong to 
    action: StepAction 
} 

// ─────────────────────────────────────────────
// PRESETS
// A Preset is a named example with code and its pre-computed step sequence.
// The parser (parser.ts) generates steps from custom code at runtime.
// Presets have their steps hardcoded so they are always correct.
// ─────────────────────────────────────────────
// A preset = ready-made example of your simulation 
export interface Preset {
    id: string
    name: string  // display name in the tab 
    code: string  // the javascript source shown in the editor 
    steps: SimStep[]
} 
// const preset: Preset = {
//   id: "simple",
//   name: "Simple Example",
//   code: `
//     console.log("Hi");
//   `,
//   steps: [
//     {
//       phase: 1,
//       action: {
//         kind: "exec",
//         queue: "callStack",
//         taskId: "t1",
//         output: "Hi"
//       }
//     }
//   ]
// };  


// SPEED SYSTEM
// SpeedMode is the named preset.
// delay is the actual milliseconds between simulation steps.
// The CSS variable --step-dur is kept in sync with delay by useSpeedCSS hook.
// ─────────────────────────────────────────────
export type SpeedMode = 'turtle' | 'learn' | 'pro'

export const SPEED_PRESETS: Record<SpeedMode, number> = {
  turtle: 2500,   // slow — tooltips visible, packets drift
  learn:  1000,   // default — comfortable pace
  pro:    200,    // fast — just watch the rhythm
}

// PHASE INFO = details shown in UI for each phase 
// Metadata for each execution phase.
// Used by TopBar and BottomBar to show contextual information.
// ─────────────────────────────────────────────   like game level
export interface PhaseInfo {
    name: string
    desc: string
    color: string // css color value for dynamic styling 
} 

export const PHASE_INFO: Record<number, PhaseInfo> = {
  0: {
    name:  'IDLE',
    desc:  'Select a preset or write custom code to begin',
    color: '#b94fff',
  },
  1: {
    name:  'PHASE 1 — SYNC',
    desc:  'Executing synchronous code on the Call Stack',
    color: '#00ffb3',
  },
  2: {
    name:  'PHASE 2 — MICRO',
    desc:  'Draining entire Microtask Queue (Promises / await)',
    color: '#ff8800',
  },
  3: {
    name:  'PHASE 3 — MACRO',
    desc:  'Processing one Macrotask (Timer callback)',
    color: '#00c8ff',
  },
}

// PACKETS
// A Packet is the animated dot flying between nodes on the canvas.
// It is NOT part of the simulation state — it lives only in the canvas layer.
// Created when a step fires, destroyed when t reaches 1.
// ───────────────────────────────────────────── 

export interface Packet {
    id: string
    from: NodeId
    to: NodeId
    type: TaskType
    label: string 
    t: number    // progress 0==> 1
    trail: Array<{ x: number; y: number}> // last N poistion for the glow tail

}

// Log ENTRY
// Each simulation step appends an entry to the execution timeline.

export type LogType = 'sync' | 'micro' | 'macro' | 'out' | 'info' 

export interface LogEntry {
    id: string
    time: number // ms since simulation started 
    message: string // Html strng for rich text(bold, italic)
    type:LogType
}