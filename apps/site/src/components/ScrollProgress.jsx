import { useScrollProgress } from '../lib/hooks'

/**
 * A 2px terracotta rule across the top showing how far through the page you
 * are. It reports position rather than animating, so there is nothing to
 * disable under reduced motion — it simply tracks the scrollbar.
 */
export default function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent" aria-hidden="true">
      <div
        className="h-full origin-left bg-clay"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
