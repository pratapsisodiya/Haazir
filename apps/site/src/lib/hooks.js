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


/** True once the page has scrolled past `offset` — drives the nav's blur-on-scroll. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(() =>
    typeof window === 'undefined' ? false : window.scrollY > offset,
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])

  return scrolled
}

/**
 * True once the element has been scrolled into view. Latches — it never flips
 * back — so content that has appeared stays put instead of flickering.
 */
// threshold 0 rather than a fraction: a section taller than the viewport can
// never show "15% of itself", so a fraction makes tall content reveal late (or
// never). The negative bottom margin is what delays the trigger instead, and it
// behaves the same whatever the element's height.
export function useInView({ rootMargin = '0px 0px -15% 0px', threshold = 0 } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    // No observer (old browser, or the node never mounted): show it rather than
    // leaving content stuck invisible.
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return [ref, inView]
}

/** How far down the page we are, 0–1. Drives the reading-progress bar. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)
    }

    // rAF-throttled: scroll fires far more often than we can usefully paint.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return progress
}

