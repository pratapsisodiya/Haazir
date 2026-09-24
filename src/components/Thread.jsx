import { useEffect, useRef, useState } from 'react'
import { RotateCcw, UserRound } from 'lucide-react'
import { useInView, usePrefersReducedMotion } from '../lib/hooks'

const TYPING_MS = 600
const READING_MS = 450

/**
 * A scripted WhatsApp thread that plays out message by message. The product is
 * a chat, so this is the demo — which is why it now sits in the hero rather
 * than a third of the way down the page.
 *
 * It starts when it enters view, which for the hero means immediately. Under
 * reduced motion the whole exchange renders at once: the exchange is the
 * content, the timing is decoration.
 */
export default function Thread({ opened, messages, handover, className = '' }) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView({ threshold: 0 })

  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(false)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const play = () => {
    clearTimers()
    setShown(0)
    setTyping(false)

    let at = 400 // a beat, so the page settles before it starts
    messages.forEach((message, i) => {
      if (message.who === 'agent') {
        at += READING_MS
        timers.current.push(setTimeout(() => setTyping(true), at))
        at += TYPING_MS
        timers.current.push(
          setTimeout(() => {
            setTyping(false)
            setShown(i + 1)
          }, at),
        )
      } else {
        at += i === 0 ? 0 : READING_MS
        timers.current.push(setTimeout(() => setShown(i + 1), at))
      }
    })
  }

  useEffect(() => {
    if (reduced) {
      setShown(messages.length)
      setTyping(false)
      return
    }
    if (inView) play()
    return clearTimers
  }, [inView, reduced, messages])

  const finished = shown >= messages.length

  return (
    <figure ref={ref} className={`overflow-hidden rounded-[1.5rem] border border-line bg-paper lift ${className}`}>
      <figcaption className="flex items-center gap-3 border-b border-line bg-white px-4 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone text-ink/60">
          <UserRound className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.9rem] font-medium">Customer</span>
          <span className="block text-[0.72rem] text-ink/60">{opened}</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[0.7rem] tracking-[0.1em] text-ink/60 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden="true" />
          Live
        </span>
      </figcaption>

      {/* A floor under the bubbles so the card does not resize as it fills. */}
      <div className="flex min-h-[21rem] flex-col justify-end gap-2 px-4 py-5">
        {messages.slice(0, shown).map((message, i) => (
          <p
            key={i}
            className={`animate-message-in max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.88rem] leading-snug ${
              message.who === 'agent'
                ? 'ml-auto rounded-br-md bg-forest text-paper'
                : 'rounded-bl-md bg-white text-ink/80 ring-1 ring-line'
            }`}
          >
            {message.text}
          </p>
        ))}

        {typing && (
          <span
            className="ml-auto flex w-fit items-center gap-1 rounded-2xl rounded-br-md bg-forest px-4 py-3"
            aria-label="typing"
          >
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        )}

        {finished && (
          <p className="mt-2 flex items-center justify-center gap-2 border-t border-line pt-3.5 text-[0.75rem] text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden="true" />
            {handover}
            {!reduced && (
              <button
                type="button"
                onClick={play}
                className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-ink/60 transition-colors hover:text-clay-deep"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} />
                Replay
              </button>
            )}
          </p>
        )}
      </div>
    </figure>
  )
}

function Dot({ delay = '0ms' }) {
  return (
    <span
      className="animate-typing h-1.5 w-1.5 rounded-full bg-paper/70"
      style={{ animationDelay: delay }}
    />
  )
}
