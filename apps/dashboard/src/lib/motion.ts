import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches
}

/**
 * Counts from 0 to `target` once, on mount: the one orchestrated moment in the
 * app (§14.7). 300ms, ease-out. With reduced motion it starts at the target.
 * Later changes to `target` jump straight there; nothing re-animates.
 */
export function useCountUp(target: number, duration = 300) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const [done, setDone] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (done) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3 // ease-out cubic
      setValue(target * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
      else setDone(true)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, done])

  return value
}
