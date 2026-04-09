// Watches `running` and `delay` from the store.
// When running=true, fires step() every `delay` ms.
// Lives in a hook (not the store) because setInterval is a side effect.
import { useEffect, useRef } from 'react'
import { useSimStore } from '../store/simStore'

export function useSimLoop() {
  const running = useSimStore(s => s.running)
  const delay   = useSimStore(s => s.delay)
  const step    = useSimStore(s => s.step)

  // useRef so the interval always calls the latest step without re-creating
  const stepRef = useRef(step)
  stepRef.current = step

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => stepRef.current(), delay)
    return () => clearInterval(id)   // cleanup on pause or unmount
  }, [running, delay])
}