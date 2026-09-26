import { ArrowDown } from 'lucide-react'
import { GhostCTA, PrimaryCTA } from './Brand'
import Thread from './Thread'
import { SEGMENT } from '../lib/campaign'

/**
 * The demo is the hero. Previously this was a stock photo of a window with a
 * single chat bubble pinned to it, and the actual working thread sat a third of
 * the way down the page — so the most persuasive thing on the site was the one
 * thing nobody scrolled to.
 *
 * On a phone the three blocks run headline → thread → buttons: proof before the
 * ask, and it lifts the thread ~150px so it is properly on screen rather than
 * peeking over the fold by an inch. On a desktop the text stacks in column one
 * and the thread sits beside it, which is why the placement is explicit rather
 * than two nested columns.
 */
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-paper">
      {/* 68px grid, radially masked so it fades at the edges */}
      <div className="pointer-events-none absolute inset-0 grid-bg grid-mask-hero" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-clay/12 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1180px] px-5 pt-8 pb-14 sm:px-8 lg:pt-14 lg:pb-20">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:gap-16">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pr-4 pl-3 text-[0.8rem] text-ink/70 lift">
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="animate-ring absolute h-2 w-2 rounded-full bg-[#16a34a]" aria-hidden="true" />
                <span className="animate-dot h-2 w-2 rounded-full bg-[#16a34a]" />
              </span>
              Live on the official WhatsApp Business Platform
            </p>

            <h1 className="mt-5 text-[clamp(2.4rem,6.4vw,4.2rem)]">
              Someone is <span className="text-clay">always</span> at the window.
            </h1>

            {SEGMENT.eyebrow && (
              <p className="mt-4 text-[0.95rem] font-medium text-clay-deep">{SEGMENT.eyebrow}</p>
            )}

            <p className="mt-4 max-w-[34rem] text-[1.0625rem] text-ink/65">{SEGMENT.subhead}</p>
          </div>

          {/* The thread itself — this is the pitch, not decoration beside it. */}
          <div className="mx-auto w-full max-w-[26rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center">
            <Thread {...SEGMENT.thread} />
            <p className="mt-3 text-center text-[0.82rem] text-ink/60 lg:text-left">
              A real exchange, start to hand-off. Nobody on the team was awake.
            </p>
          </div>

          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryCTA>Send us a WhatsApp</PrimaryCTA>
              <GhostCTA href="#calculator">
                See what silence costs
                <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
              </GhostCTA>
            </div>

            <p className="mt-5 text-[0.9rem] text-ink/60">
              Built in Jaipur. Hindi, English and Hinglish out of the box.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
