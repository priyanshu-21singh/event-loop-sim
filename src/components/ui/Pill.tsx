// Reusable status pill component.
// Used in TopBar for LIVE indicator and phase display.
//
// WHY a separate component?
// Because TopBar uses 3 of these with different colors/behaviors.
// Extracting it prevents copy-paste and keeps TopBar readable.

interface PillProps {
  children:  React.ReactNode
  color?:    string       // CSS color value
  pulse?:    boolean      // shows pulsing dot (for LIVE indicator)
  className?: string
}

export function Pill({ children, color = '#b94fff', pulse, className = '' }: PillProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.52rem] font-bold tracking-widest uppercase select-none ${className}`}
      style={{
        border:     `1px solid ${color}55`,
        color,
        background: `${color}12`,
        fontFamily: "'Exo 2', sans-serif",
      }}
    >
      {pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: color,
            animation:  'liveBlip 1s ease infinite',
          }}
        />
      )}
      {children}
    </div>
  )
}