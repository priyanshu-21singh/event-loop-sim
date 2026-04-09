// Tooltip that appears above architecture nodes in Turtle mode.
// Explains WHY the highlighted node is doing what it does.
//
// WHY only in turtle mode?
// Because experienced devs find tooltips distracting.
// Beginners need the explanation. Speed mode = learning intent signal.

interface TooltipProps {
  title:   string
  body:    string
  visible: boolean   // controlled by parent — shown when node is active + turtle mode
}

export function Tooltip({ title, body, visible }: TooltipProps) {
  if (!visible) return null

  return (
    <div
      className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-52 text-left pointer-events-none"
      style={{
        transform:   'translateX(-50%)',
        animation:   'tooltipIn 0.3s ease',
        background:  'rgba(4,4,20,0.98)',
        border:      '1px solid rgba(0,255,179,0.4)',
        borderRadius: 8,
        padding:     '8px 12px',
        boxShadow:   '0 0 20px rgba(0,255,179,0.15)',
      }}
    >
      {/* Arrow pointing down */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top:         '100%',
          width:       0,
          height:      0,
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop:   '5px solid rgba(0,255,179,0.4)',
        }}
      />
      <p
        className="mb-1 text-[0.55rem] font-bold tracking-wider"
        style={{ color: '#00ffb3', fontFamily: "'Exo 2', sans-serif" }}
      >
        {title}
      </p>
      <p className="text-[0.5rem] leading-relaxed" style={{ color: 'rgba(0,255,179,0.7)' }}>
        {body}
      </p>
    </div>
  )
}