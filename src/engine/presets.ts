// src/engine/presets.ts
//
// Each preset is a complete Preset object: an id, a display name,
// the JS source code shown in the editor, and the exact sequence
// of SimSteps that the scheduler will execute one at a time.
//
// Steps are authored by hand for presets because they need to be
// pedagogically precise — we control exactly what the learner sees.
// Custom code uses the parser (parser.ts) which generates steps automatically.

import type { Preset } from './types'

// Small helper to keep step authoring concise
const t = (id: string, label: string, type: 'sync' | 'micro' | 'macro' | 'heap') =>
  ({ id, label, type } as const)

export const PRESETS: Record<string, Preset> = {

  // ── 1. BASIC ───────────────────────────────────────────────────────────
  // Purely synchronous. Nothing async, no queues except Call Stack.
  // Perfect first preset — the learner sees the simplest possible execution.
  basic: {
    id:   'basic',
    name: 'Basic Sync',
    code: `// Pure synchronous code
// Only the Call Stack is used
// Runs exactly top to bottom

console.log('start');
console.log('middle');
console.log('end');`,
    steps: [
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('b1', 'log("start")', 'sync'),
          line: 5,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'b1', output: '"start"', line: 5 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('b2', 'log("middle")', 'sync'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'b2', output: '"middle"', line: 6 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('b3', 'log("end")', 'sync'),
          line: 7,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'b3', output: '"end"', line: 7 },
      },
      { phase: 0, action: { kind: 'done' } },
    ],
  },

  // ── 2. PROMISE ──────────────────────────────────────────────────────────
  // Introduces the Microtask Queue.
  // Key insight: .then() callbacks are NOT run immediately.
  // They are scheduled into microQueue and run AFTER all sync code.
  promise: {
    id:   'promise',
    name: 'Promise',
    code: `// Promises schedule callbacks in the
// Microtask Queue — runs after ALL sync,
// but BEFORE any setTimeout

console.log('sync 1');

Promise.resolve()
  .then(() => console.log('micro 1'))
  .then(() => console.log('micro 2'));

console.log('sync 2');`,
    steps: [
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('p1', 'log("sync 1")', 'sync'),
          line: 5,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'p1', output: '"sync 1"', line: 5 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('p2', 'Promise.resolve()', 'sync'),
          line: 7,
        },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'microQueue',
          from: 'node-call',
          task: t('p3', '.then → "micro 1"', 'micro'),
          line: 8,
        },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 'p2', line: 7 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('p4', 'log("sync 2")', 'sync'),
          line: 11,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'p4', output: '"sync 2"', line: 11 },
      },
      // ── Now phase 2: drain the entire microQueue ──
      {
        phase: 2,
        action: { kind: 'exec', queue: 'microQueue', taskId: 'p3', output: '"micro 1"', line: 8 },
      },
      {
        phase: 2,
        action: {
          kind: 'push', queue: 'microQueue',
          from: 'node-micro',
          task: t('p5', '.then → "micro 2"', 'micro'),
          line: 9,
        },
      },
      {
        phase: 2,
        action: { kind: 'exec', queue: 'microQueue', taskId: 'p5', output: '"micro 2"', line: 9 },
      },
      { phase: 0, action: { kind: 'done' } },
    ],
  },

  // ── 3. SETTIMEOUT ───────────────────────────────────────────────────────
  // Introduces the Timer Heap and Macrotask Queue.
  // Key insight: setTimeout goes through TWO steps:
  //   1. Registered in Timer Heap with delay
  //   2. After delay expires, moves to Macrotask Queue
  //   3. THEN runs — only after ALL sync and ALL micro are done
  timer: {
    id:   'timer',
    name: 'setTimeout',
    code: `// setTimeout goes: Timer Heap → Macrotask Queue
// It fires LAST — after all sync AND microtasks

console.log('A');

setTimeout(() => {
  console.log('timer callback');
}, 0);

console.log('B');`,
    steps: [
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('t1', 'log("A")', 'sync'),
          line: 4,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 't1', output: '"A"', line: 4 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('t2', 'setTimeout(fn, 0)', 'sync'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'timerHeap',
          from: 'node-call',
          task: t('t3', 'delay: 0ms', 'heap'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 't2', line: 6 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('t4', 'log("B")', 'sync'),
          line: 10,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 't4', output: '"B"', line: 10 },
      },
      // ── Timer fires: heap → macroQueue ──
      {
        phase: 2,
        action: { kind: 'heapFire', heapTaskId: 't3', line: 6 },
      },
      {
        phase: 3,
        action: {
          kind: 'push', queue: 'macroQueue',
          from: 'node-scheduler',
          task: t('t5', 'cb → log("timer")', 'macro'),
          line: 7,
        },
      },
      {
        phase: 3,
        action: { kind: 'exec', queue: 'macroQueue', taskId: 't5', output: '"timer callback"', line: 7 },
      },
      { phase: 0, action: { kind: 'done' } },
    ],
  },

  // ── 4. ASYNC / AWAIT ────────────────────────────────────────────────────
  // Key insight: async/await is syntactic sugar over Promises.
  // Code after 'await' becomes a .then() callback — a microtask.
  // The function suspends, outer sync code continues, then resumes.
  asyncAwait: {
    id:   'asyncAwait',
    name: 'async/await',
    code: `// async/await = Promise under the hood
// Code after 'await' resumes as a microtask

async function main() {
  console.log('before await');
  await Promise.resolve();
  console.log('after await'); // ← microtask!
}

main();
console.log('sync after call');`,
    steps: [
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('a1', 'main()', 'sync'),
          line: 10,
        },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('a2', 'log("before await")', 'sync'),
          line: 5,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'a2', output: '"before await"', line: 5 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('a3', 'await Promise...', 'sync'),
          line: 6,
        },
      },
      // await suspends main() — schedules resume as microtask
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'microQueue',
          from: 'node-call',
          task: t('a4', 'resume main()', 'micro'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 'a3', line: 6 },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 'a1', line: 10 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('a5', 'log("sync after")', 'sync'),
          line: 11,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'a5', output: '"sync after call"', line: 11 },
      },
      // ── Resume: micro phase ──
      {
        phase: 2,
        action: { kind: 'exec', queue: 'microQueue', taskId: 'a4', output: '"after await"', line: 7 },
      },
      { phase: 0, action: { kind: 'done' } },
    ],
  },

  // ── 5. FULL MIX ─────────────────────────────────────────────────────────
  // The classic interview question.
  // Tests understanding of all three phases together.
  // Answer: 1 → 2 → promise → timer
  fullMix: {
    id:   'fullMix',
    name: 'Full Mix',
    code: `// Classic interview question
// Predict the exact output order!

console.log('1');

setTimeout(() => console.log('timer'), 0);

Promise.resolve()
  .then(() => console.log('promise'));

console.log('2');

// Answer: 1 → 2 → promise → timer`,
    steps: [
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('m1', 'log("1")', 'sync'),
          line: 4,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'm1', output: '"1"', line: 4 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('m2', 'setTimeout(fn, 0)', 'sync'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'timerHeap',
          from: 'node-call',
          task: t('m3', 'delay: 0ms', 'heap'),
          line: 6,
        },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 'm2', line: 6 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('m4', 'Promise.resolve()', 'sync'),
          line: 8,
        },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'microQueue',
          from: 'node-call',
          task: t('m5', '.then → "promise"', 'micro'),
          line: 9,
        },
      },
      {
        phase: 1,
        action: { kind: 'pop', queue: 'callStack', taskId: 'm4', line: 8 },
      },
      {
        phase: 1,
        action: {
          kind: 'push', queue: 'callStack',
          from: 'node-scheduler',
          task: t('m6', 'log("2")', 'sync'),
          line: 11,
        },
      },
      {
        phase: 1,
        action: { kind: 'exec', queue: 'callStack', taskId: 'm6', output: '"2"', line: 11 },
      },
      // ── Phase 2: drain microQueue ──
      {
        phase: 2,
        action: { kind: 'exec', queue: 'microQueue', taskId: 'm5', output: '"promise"', line: 9 },
      },
      // ── Timer fires ──
      {
        phase: 2,
        action: { kind: 'heapFire', heapTaskId: 'm3', line: 6 },
      },
      // ── Phase 3: run macrotask ──
      {
        phase: 3,
        action: {
          kind: 'push', queue: 'macroQueue',
          from: 'node-scheduler',
          task: t('m7', 'cb → "timer"', 'macro'),
          line: 6,
        },
      },
      {
        phase: 3,
        action: { kind: 'exec', queue: 'macroQueue', taskId: 'm7', output: '"timer"', line: 6 },
      },
      { phase: 0, action: { kind: 'done' } },
    ],
  },
}

// Ordered list for rendering tabs left to right
export const PRESET_ORDER = ['basic', 'promise', 'timer', 'asyncAwait', 'fullMix']