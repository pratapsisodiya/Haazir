import { CalendarCheck, Check, Languages, ShieldCheck, UserRound } from 'lucide-react'
import { IconTile, SectionLabel } from './Brand'
import Reveal from './Reveal'

const SLOTS = [
  { time: '11:30 am', label: 'Tue' },
  { time: '4:00 pm', label: 'Tue', selected: true },
  { time: '6:15 pm', label: 'Wed' },
]

const SAFEGUARDS = [
  'Business verification',
  'Green tick application',
  'Template approvals',
  'Quality rating monitoring',
]

const cardBase =
  'h-full rounded-[1.5rem] border border-line bg-white p-7 lift transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ink/12 hover:lift-md sm:p-8'

export default function WhatItDoes() {
  return (
    <section id="what-it-does" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>What your customer gets</SectionLabel>
          <h2 className="max-w-[20ch] text-[clamp(2rem,4.6vw,3.1rem)]">
            An answer in seconds, from someone who sounds like your shop.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:gap-5 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
          {/* Wide — scheduling. Reveal handles the grid slot + entrance; the
              nested <article> owns its own (differently-timed) hover transition. */}
          <Reveal delay={0} className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <article className={cardBase}>
              <IconTile icon={CalendarCheck} />
              <h3 className="mt-6 text-[clamp(1.5rem,2.6vw,1.95rem)]">
                It books, reschedules and confirms on its own.
              </h3>
              <p className="mt-4 max-w-[38ch] text-ink/65">
                Your customer picks a slot inside the chat — no callback, no "we'll
                confirm tomorrow". It reads your live calendar, offers only what's
                actually free, and sends the reminder the day before.
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5" role="group" aria-label="Example appointment slots">
                {SLOTS.map((slot) => (
                  <span
                    key={slot.time}
                    aria-current={slot.selected ? 'true' : undefined}
                    className={`flex items-baseline gap-2 rounded-xl border px-4 py-2.5 text-[0.92rem] transition-colors ${
                      slot.selected
                        ? 'border-clay-deep bg-clay-deep text-white'
                        : 'border-line bg-paper text-ink/65'
                    }`}
                  >
                    <span className={slot.selected ? 'text-white/90' : 'text-ink/60'}>
                      {slot.label}
                    </span>
                    <span className="font-medium tabular">{slot.time}</span>
                  </span>
                ))}
              </div>
            </article>
          </Reveal>

          {/* Tall — languages */}
          <Reveal delay={80} className="lg:col-start-4 lg:row-span-2 lg:row-start-1">
            <article className={`${cardBase} flex flex-col`}>
              <IconTile icon={Languages} />
              <h3 className="mt-6 text-[1.6rem]">Hindi, English, Hinglish</h3>
              <p className="mt-4 text-ink/65">
                Nobody has to switch to English to be understood. Whatever script your
                customer types in, the reply comes back in the same one.
              </p>

              <div className="mt-8 flex flex-1 flex-col justify-end gap-2.5">
                <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-stone px-4 py-3 font-deva text-[1.02rem] leading-relaxed text-ink/80">
                  कल का अपॉइंटमेंट बदलना है
                </p>
                <p className="ml-auto w-fit max-w-[94%] rounded-2xl rounded-br-md bg-forest px-4 py-3 font-deva text-[1.02rem] leading-relaxed text-paper">
                  ज़रूर। कल 4 बजे या परसों 11:30 — कौन सा ठीक रहेगा?
                </p>
              </div>
            </article>
          </Reveal>

          {/* Small — handover */}
          <Reveal delay={160} className="lg:col-start-3 lg:row-start-1">
            <article className={cardBase}>
              <IconTile icon={UserRound} />
              <h3 className="mt-6 text-[1.6rem]">Knows when to step back</h3>
              <p className="mt-4 text-ink/65">
                Price negotiation, a complaint, anything it hasn't been taught — it hands
                the thread to a human mid-sentence and stays quiet.
              </p>
            </article>
          </Reveal>

          {/* Wide — compliance, set apart in stone rather than dark */}
          <Reveal delay={240} className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
            <article className="relative h-full overflow-hidden rounded-[1.5rem] border border-line bg-stone p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ink/12 hover:lift-md sm:p-8">
              <div
                className="pointer-events-none absolute inset-0 grid-bg grid-mask-panel opacity-60"
                aria-hidden="true"
              />
              <div className="relative sm:flex sm:items-start sm:justify-between sm:gap-10">
                <div className="max-w-[26rem]">
                  <IconTile icon={ShieldCheck} className="bg-white ring-clay/20" />
                  <h3 className="mt-6 text-[clamp(1.5rem,2.6vw,1.95rem)]">
                    Built so your number never gets banned.
                  </h3>
                  <p className="mt-4 text-ink/65">
                    We run on the official WhatsApp Business Platform, not an unofficial
                    library scraping your phone. The compliance work is ours, not yours.
                  </p>
                </div>

                <ul className="mt-8 grid gap-3 sm:mt-1 sm:shrink-0">
                  {SAFEGUARDS.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[0.98rem] text-ink/75">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-clay/35 bg-white">
                        <Check className="h-3.5 w-3.5 text-clay-deep" strokeWidth={2.4} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
