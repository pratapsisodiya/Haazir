import { ArrowDown } from 'lucide-react'
import { GhostCTA, PrimaryCTA } from './Brand'
import Photo from './Photo'
import Nav from './Nav'
import { HERO_IMAGE } from '../lib/images'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-ink text-paper">
      {/* 68px grid, radially masked so it fades at the edges */}
      <div className="pointer-events-none absolute inset-0 grid-bg grid-mask-hero" aria-hidden="true" />
      {/* terracotta glow, top-left */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-clay/22 blur-[130px]"
        aria-hidden="true"
      />

      <Nav />

      <div className="relative mx-auto max-w-[1180px] px-5 pt-10 pb-20 sm:px-8 lg:pt-16 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-16">
          {/* Left column */}
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pr-4 pl-3 text-[0.8rem] text-paper/70">
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="animate-ring absolute h-2 w-2 rounded-full bg-[#4ade80]" aria-hidden="true" />
                <span className="animate-dot h-2 w-2 rounded-full bg-[#4ade80]" />
              </span>
              Live on the official WhatsApp Business Platform
            </p>

            <h1 className="mt-7 text-[clamp(2.65rem,7.4vw,4.6rem)]">
              Someone is <span className="text-clay">always</span> at the window.
            </h1>

            <p className="mt-6 max-w-[34rem] text-[1.0625rem] text-paper/62">
              haazir builds WhatsApp agents for jewellers, clinics, hotels and coaching
              institutes across India — answering enquiries, booking appointments and
              following up at 11pm on a Sunday, in the language your customer writes in.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryCTA>Send us a WhatsApp</PrimaryCTA>
              <GhostCTA href="#calculator" tone="light">
                See what silence costs
                <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
              </GhostCTA>
            </div>

            <p className="mt-7 text-[0.9rem] text-paper/38">
              Built in Jaipur. Hindi, English and Hinglish out of the box.
            </p>
          </div>

          {/* Right column — the window */}
          <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-clay/25 blur-[70px]"
              aria-hidden="true"
            />
            <Photo
              image={HERO_IMAGE}
              priority
              sizes="(min-width: 1024px) 34rem, 90vw"
              className="relative aspect-4/5 rounded-[1.75rem] ring-1 ring-white/10"
              overlay="from-clay/18 via-transparent to-ink/45"
            />

            {/* Floating message card, overlapping the bottom-left corner */}
            <figure className="absolute -bottom-7 -left-4 w-[15.5rem] rounded-2xl border border-white/14 bg-white/[0.07] p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:-left-8 sm:w-[17.5rem]">
              <figcaption className="mb-2.5 flex items-center gap-2 text-[0.7rem] tracking-[0.12em] text-paper/45 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" aria-hidden="true" />
                11:42 pm
              </figcaption>
              <p className="rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5 text-[0.9rem] leading-snug text-paper/85">
                Is the Kundan set still available?
              </p>
              <p className="mt-2 ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md bg-forest px-3.5 py-2.5 text-[0.9rem] leading-snug text-paper/95">
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
