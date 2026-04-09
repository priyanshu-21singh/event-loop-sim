// Keeps --step-dur CSS variable in sync with store delay.
// Every CSS animation references --step-dur so all animations
// stretch/compress proportionally when speed changes.
import { useEffect } from 'react'
import { useSimStore } from '../store/simStore'

export function useSpeedCSS() {
  const delay = useSimStore(s => s.delay)

  useEffect(() => {
    document.documentElement.style.setProperty('--step-dur', `${delay}ms`)
  }, [delay])
}