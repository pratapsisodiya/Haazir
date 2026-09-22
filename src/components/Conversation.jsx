import { useEffect, useRef, useState } from 'react'
import { RotateCcw, UserRound } from 'lucide-react'
import { SectionLabel } from './Brand'
import Reveal from './Reveal'
import { SEGMENT } from '../lib/campaign'
import { useInView, usePrefersReducedMotion } from '../lib/hooks'

const TYPING_MS = 850
const READING_MS = 700

/**
 * Plays a real thread out message by message when it scrolls into view — the
 * closest thing to a demo we can put on a page, since the product is a chat.
 *
 * Under reduced motion the whole exchange renders at once: the content is the
 * point, the timing is decoration.
 */
export default function Conversation() {
  const { opened, messages, handover } = SEGMENT.thread
  const reduced = usePrefersReducedMotion()
  const [wrapRef, inView] = useInView({ threshold: 0.3, rootMargin: '0px' })

  // How many messages are on screen, and whether a typing bubble is showing.
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

    let at = 0
    messages.forEach((message, i) => {
      // Their messages just land; ours are preceded by a typing bubble.
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
        at += i === 0 ? 300 : READING_MS
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
    // Replaying on segment change is intentional — the thread itself changes.
  }, [inView, reduced, messages])

  const finished = shown >= messages.length

  return (
    <section id="conversation" className="border-t border-line bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-20">
          <Reveal>
            <SectionLabel>A thread, start to finish</SectionLabel>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.6vw,3.1rem)]">
              It answers. Then it knows when to stop.
            </h2>
            <p className="mt-6 max-w-[40ch] text-ink/65">
              This is the whole shape of it. A question after closing, a straight answer,
              the booking made — and then the moment it hits something that isn't its
              call, it steps back and puts a person on it.
            </p>
            <p className="mt-5 max-w-[40ch] text-ink/65">
              Nobody on your team had to be awake for any of it.
            </p>

            {finished && !reduced && (
              <button
                type="button"
                onClick={play}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[0.88rem] text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
              >
                <RotateCcw className="h-4 w-4 text-clay-deep" strokeWidth={1.8} />
                Play it again
              </button>
            )}
          </Reveal>

          {/* The thread */}
          <div ref={wrapRef} className="mt-12 lg:mt-0">
            <div className="mx-auto max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-line bg-paper lift">
              <header className="flex items-center gap-3 border-b border-line bg-white px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone text-ink/60">
                  <UserRound className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.95rem] font-medium">Customer</span>
                  <span className="block text-[0.75rem] text-ink/60">{opened}</span>
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[0.72rem] tracking-[0.1em] text-ink/60 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden="true" />
                  Live
                </span>
              </header>

              {/* min-height stops the card resizing under the reader as it fills */}
              <div className="flex min-h-[26rem] flex-col justify-end gap-2.5 px-5 py-6">
                {/* Only what has been "sent" is rendered, so each arrival animates
                    on mount and the stack grows upward from the bottom. */}
                {messages.slice(0, shown).map((message, i) => (
                  <p
                    key={i}
                    className={`animate-message-in max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-snug ${
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
                  <p className="mt-3 flex items-center justify-center gap-2 border-t border-line pt-4 text-[0.78rem] text-ink/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden="true" />
                    {handover}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
