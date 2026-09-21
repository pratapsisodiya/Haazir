import { useEffect, useRef, useState } from 'react'

/** True when the visitor has asked for reduced motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Eases a number toward `target`. Snaps instantly under reduced motion.
 */
export function useAnimatedNumber(target, { duration = 650 } = {}) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(target)
  const frame = useRef(0)
  const from = useRef(target)

  useEffect(() => {
    if (reduced) {
      setDisplay(target)
      from.current = target
      return
    }

    const start = performance.now()
    const origin = from.current
    const delta = target - origin
    if (delta === 0) return

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      const value = origin + delta * eased
      from.current = value
      setDisplay(value)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration, reduced])

  return display
}

/**
 * Reports which of the registered elements is closest to the middle of the
 * viewport. Used by the sticky "how it works" scroller.
 */
export function useActiveInViewport(count) {
  const [active, setActive] = useState(0)
  const refs = useRef([])

  useEffect(() => {
    const nodes = refs.current.filter(Boolean)
    if (!nodes.length) return

    const pick = () => {
      const middle = window.innerHeight / 2
      let best = 0
      let bestDistance = Infinity
      nodes.forEach((node, i) => {
        const box = node.getBoundingClientRect()
        const distance = Math.abs(box.top + box.height / 2 - middle)
        if (distance < bestDistance) {
          bestDistance = distance
          best = i
        }
      })
      setActive(best)
    }

    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [count])

  return [active, refs]
}

/** Adds a class once the element has been scrolled into view, for entrances. */
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15, ...options },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, shown]
}
