import { useInView } from '../lib/hooks'

/**
 * Fades its children up as they enter view. Deliberately short — 14px and
 * 600ms — so it reads as the page settling rather than as an effect.
 *
 * The content is always in the DOM; only opacity and transform animate, and the
 * reduced-motion rule in index.css collapses the transition to nothing, so it
 * appears instantly for anyone who has asked for that.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-[600ms] ease-out ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-[14px] opacity-0'
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Tag>
  )
}
