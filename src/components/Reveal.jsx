import { useReveal } from '../lib/hooks'

/**
 * Fades and lifts its children in once they scroll into view. `delay` is in
 * milliseconds and is meant for staggering a handful of siblings (cards in a
 * grid), not for anything load-bearing — content is present in the DOM
 * immediately, only its opacity/transform animate.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const [ref, shown] = useReveal()

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Tag>
  )
}
