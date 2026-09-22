import { ArrowDown } from 'lucide-react'
import { GhostCTA, PrimaryCTA } from './Brand'
import Photo from './Photo'
import { HERO_IMAGE } from '../lib/images'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-paper">
      {/* 68px grid, radially masked so it fades at the edges */}
      <div className="pointer-events-none absolute inset-0 grid-bg grid-mask-hero" aria-hidden="true" />
      {/* terracotta glow, top-left */}
      <div
        className="pointer-events-none absolute -top-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-clay/12 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1180px] px-5 pt-12 pb-20 sm:px-8 lg:pt-16 lg:pb-28">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
          {/* Left column */}
          <div className="animate-hero-rise">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pr-4 pl-3 text-[0.8rem] text-ink/70 lift">
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="animate-ring absolute h-2 w-2 rounded-full bg-[#16a34a]" aria-hidden="true" />
                <span className="animate-dot h-2 w-2 rounded-full bg-[#16a34a]" />
              </span>
              Live on the official WhatsApp Business Platform
            </p>

            <h1 className="mt-7 text-[clamp(2.65rem,7.4vw,4.6rem)]">
              Someone is <span className="text-clay">always</span> at the window.
            </h1>

            <p className="mt-6 max-w-[34rem] text-[1.0625rem] text-ink/65">
              Your customer messages at 11pm on a Sunday. haazir answers in the language
              they wrote in, books them the slot they asked for, and hands the thread to
              your team the moment it needs a person.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryCTA>Send us a WhatsApp</PrimaryCTA>
              <GhostCTA href="#calculator">
                See what silence costs
                <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
              </GhostCTA>
            </div>

            <p className="mt-7 text-[0.9rem] text-ink/60">
              Built in Jaipur. Hindi, English and Hinglish out of the box.
            </p>
          </div>

          {/* Right column — the window */}
          <div className="animate-hero-rise relative mx-auto w-full max-w-[26rem] [animation-delay:120ms] lg:max-w-none">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-clay/14 blur-[70px]"
              aria-hidden="true"
            />
            <Photo
              image={HERO_IMAGE}
              priority
              sizes="(min-width: 1024px) 34rem, 90vw"
              className="relative aspect-4/5 rounded-[1.75rem] ring-1 ring-ink/10"
              overlay="from-clay/14 via-transparent to-ink/20"
            />

            {/* Floating message card, overlapping the bottom-left corner */}
            <figure className="animate-float absolute -bottom-7 -left-4 w-[15.5rem] rounded-2xl border border-line bg-white/95 p-3.5 shadow-[0_18px_44px_-14px_rgb(14_16_19_/_0.25)] backdrop-blur-sm sm:-left-8 sm:w-[17.5rem]">
              <figcaption className="mb-2.5 flex items-center gap-2 text-[0.7rem] tracking-[0.12em] text-ink/60 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" aria-hidden="true" />
                11:42 pm
              </figcaption>
              <p className="rounded-2xl rounded-bl-md bg-stone px-3.5 py-2.5 text-[0.9rem] leading-snug text-ink/80">
                Is the Kundan set still available?
              </p>
              <p className="mt-2 ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md bg-forest px-3.5 py-2.5 text-[0.9rem] leading-snug text-paper">
                Ji haan — it's in the Johari Bazaar store. Shall I hold it for you till
                tomorrow 6pm?
              </p>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
