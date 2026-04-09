// Tab row across the top of the editor.
// One tab per preset + a "custom" tab for user code.
//
// WHY tabs instead of a dropdown?
// Tabs show all options simultaneously — no click needed to see what's available.
// For a simulator, discoverability matters more than compact space.

import { useActivePreset, useSimControls } from '../../store/simStore'
import { PRESETS, PRESET_ORDER }           from '../../engine/presets'

interface PresetTabsProps {
  onCustom:  () => void                 // called when user clicks the custom tab
  isCustom:  boolean                    // is custom mode currently active?
  onPreset?: (id: string) => void       // optional override for preset loading
}

export function PresetTabs({ onCustom, isCustom, onPreset }: PresetTabsProps) {
  const activePreset = useActivePreset()
  const { loadPreset: storeLoad } = useSimControls()
  const loadPreset = onPreset ?? storeLoad

  return (
    <div
      className="flex overflow-x-auto flex-shrink-0"
      style={{ background: 'rgba(4,4,16,0.97)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Preset tabs */}
      {PRESET_ORDER.map(id => {
        const preset  = PRESETS[id]
        const isActive = activePreset === id && !isCustom
        return (
          <button
            key={id}
            onClick={() => loadPreset(id)}
            className="px-3 py-1.5 text-[0.56rem] font-mono border-b-2 whitespace-nowrap transition-all duration-150 flex-shrink-0"
            style={{
              borderBottomColor: isActive ? '#00c8ff' : 'transparent',
              color:             isActive ? '#00c8ff' : '#4a5070',
              background:        isActive ? 'rgba(0,200,255,0.04)' : 'transparent',
            }}
          >
            {preset.name}
          </button>
        )
      })}

      {/* Custom tab */}
      <button
        onClick={onCustom}
        className="px-3 py-1.5 text-[0.56rem] font-mono border-b-2 whitespace-nowrap transition-all duration-150 flex-shrink-0"
        style={{
          borderBottomColor: isCustom ? '#b94fff' : 'transparent',
          color:             isCustom ? '#b94fff' : '#4a5070',
          background:        isCustom ? 'rgba(185,79,255,0.04)' : 'transparent',
        }}
      >
        ✎ custom
      </button>
    </div>
  )
}