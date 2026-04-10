// App.tsx — the root component.
//
// WHAT this file does:
//   1. Sets up the three-panel resizable layout with react-resizable-panels
//   2. Runs the two global hooks (sim loop + speed CSS sync)
//   3. Loads the default preset on first render
//   4. Renders TopBar, EditorPane, VizPane, BottomBar
//
// WHAT this file does NOT do:
//   - Any simulation logic (that's in the engine + store)
//   - Any animation (that's in canvas files + Framer Motion)
//   - Any state (that's in Zustand)
//   - It is a pure layout orchestrator
//
// react-resizable-panels layout:
//
//   ┌─────────────────────────────────────────────┐
//   │               TopBar (fixed height)          │
//   ├──────────────────┬──────────────────────────┤
//   │                  │                           │
//   │   EditorPane     │      VizPane              │
//   │   (resizable)    │      (resizable)          │
//   │                  │                           │
//   │                  ├──────────────────────────┤
//   │                  │   BottomBar               │
//   └──────────────────┴──────────────────────────┘
//
// The vertical resize handle sits between EditorPane and the right column.
// The horizontal resize handle sits between VizPane and BottomBar.

import { useEffect }             from 'react'
import { PanelGroup, Panel }     from 'react-resizable-panels'
import { ResizeHandle }          from './components/layout/ResizeHandle'
import { TopBar }                from './components/layout/TopBar'
import { EditorPane }            from './components/editor/EditorPane'
import { VizPane }               from './components/visualizer/VizPane'
import { BottomBar }             from './components/controls/BottomBar'
import { useSimLoop }            from './hooks/useSimLoop'
import { useSpeedCSS }           from './hooks/useSpeedCSS'
import { useSimControls }        from './store/simStore'

export default function App() {
  // ── Global hooks ────────────────────────────────────────────────────────
  // These hooks have no visual output — they just run side effects.

  // Drives auto-play: when running=true, calls step() every `delay` ms
  useSimLoop()

  // Keeps --step-dur CSS variable in sync with store delay
  // This makes ALL CSS animations scale with the speed setting
  useSpeedCSS()

  // ── Load default preset on first render ─────────────────────────────────
  const { loadPreset } = useSimControls()

  useEffect(() => {
    loadPreset('basic')
  }, [loadPreset])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* Fixed-height topbar */}
      <TopBar />

      {/* Resizable panel area — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        {/*
          PanelGroup direction="horizontal" = left/right split
          autoSaveId saves panel sizes to localStorage automatically.
          User's preferred layout persists across page refreshes.
        */}
        <PanelGroup
          direction="horizontal"
          autoSaveId="event-loop-layout"
          className="h-full"
        >

          {/* ── Left: Editor Panel ── */}
          {/*
            defaultSize: starts at 32% of total width
            minSize: cannot shrink below 18%
            collapsible: can be fully collapsed by double-clicking handle
          */}
          <Panel
            defaultSize={32}
            minSize={18}
            collapsible
          >
            <EditorPane />
          </Panel>

          {/* Vertical resize handle between editor and right column */}
          <ResizeHandle direction="vertical" />

          {/* ── Right: Viz + Bottom stacked vertically ── */}
          <Panel minSize={35}>
            <PanelGroup direction="vertical" className="h-full">

              {/* Visualization canvas area */}
              <Panel defaultSize={72} minSize={45}>
                <VizPane />
              </Panel>

              {/* Horizontal resize handle between viz and bottom bar */}
              <ResizeHandle direction="horizontal" />

              {/* Bottom bar — output + phase + controls */}
              {/*
                maxSize prevents the bottom bar from taking over the screen.
                minSize ensures controls are always visible.
              */}
              <Panel
                defaultSize={28}
                minSize={14}
                maxSize={42}
              >
                <BottomBar />
              </Panel>

            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>

    </div>
  )
}