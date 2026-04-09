// Wraps react-resizable-panels' PanelResizeHandle with visual styling.
// The handle is the draggable bar between panels.
//
// WHY wrap it?
// Because PanelResizeHandle renders a bare div with no styling.
// We want a glowing line that brightens on hover/drag.
// Wrapping keeps the styling in one place — all resize handles look the same.

import { PanelResizeHandle } from 'react-resizable-panels'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
}

export function ResizeHandle({ direction }: ResizeHandleProps) {
  const isHoriz = direction === 'horizontal'

  return (
    <PanelResizeHandle
      className="group relative flex items-center justify-center"
      style={{
        // Horizontal handle = wide, thin height (sits between top/bottom panels)
        // Vertical handle   = thin width, full height (sits between left/right panels)
        width:  isHoriz ? '100%' : '6px',
        height: isHoriz ? '6px'  : '100%',
        cursor: isHoriz ? 'row-resize' : 'col-resize',
        background: 'rgba(185,79,255,0.06)',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      {/* The visible line in the center of the handle */}
      <div
        style={{
          width:      isHoriz ? '60px' : '2px',
          height:     isHoriz ? '2px'  : '60px',
          borderRadius: 2,
          background:   'rgba(185,79,255,0.3)',
          transition:   'all 0.2s',
          boxShadow:    '0 0 6px rgba(185,79,255,0.2)',
        }}
        className="group-hover:!bg-npurple group-hover:![box-shadow:0_0_12px_rgba(185,79,255,0.6)]
                   group-data-[resize-handle-active]:!bg-npurple"
      />
    </PanelResizeHandle>
  )
}