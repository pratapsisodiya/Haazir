import { CalendarCheck, Check, Languages, ShieldCheck, UserRound } from 'lucide-react'
import { SectionLabel } from './Brand'

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
  'rounded-[1.5rem] border border-line bg-white p-7 lift transition-colors duration-200 hover:border-ink/20 sm:p-8'

export default function WhatItDoes() {
  return (
    <section id="what-it-does" className="bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <SectionLabel>What your customer gets</SectionLabel>
        <h2 className="max-w-[20ch] text-[clamp(2rem,4.6vw,3.1rem)]">
          An answer in seconds, from someone who sounds like your shop.
        </h2>

        <div className="mt-12 grid gap-4 sm:gap-5 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
          {/* Wide — scheduling */}
          <article className={`${cardBase} lg:col-span-2 lg:col-start-1 lg:row-start-1`}>
            <CalendarCheck className="h-6 w-6 text-clay" strokeWidth={1.6} />
            <h3 className="mt-6 text-[clamp(1.5rem,2.6vw,1.95rem)]">
              It books, reschedules and confirms on its own.
            </h3>
            <p className="mt-4 max-w-[38ch] text-ink/65">
              Your customer picks a slot inside the chat — no callback, no "we'll confirm
              tomorrow". It reads your live calendar, offers only what's actually free,
              and sends the reminder the day before.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5" role="group" aria-label="Example appointment slots">
              {SLOTS.map((slot) => (
                <span
                  key={slot.time}
                  aria-current={slot.selected ? 'true' : undefined}
                  className={`flex items-baseline gap-2 rounded-xl border px-4 py-2.5 text-[0.92rem] ${
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

          {/* Tall — languages */}
          <article className={`${cardBase} flex flex-col lg:col-start-4 lg:row-span-2 lg:row-start-1`}>
            <Languages className="h-6 w-6 text-clay" strokeWidth={1.6} />
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

          {/* Small — handover */}
          <article className={`${cardBase} lg:col-start-3 lg:row-start-1`}>
            <UserRound className="h-6 w-6 text-clay" strokeWidth={1.6} />
            <h3 className="mt-6 text-[1.6rem]">Knows when to step back</h3>
            <p className="mt-4 text-ink/65">
              Price negotiation, a complaint, anything it hasn't been taught — it hands
              the thread to a human mid-sentence and stays quiet.
            </p>
          </article>

          {/* Wide — compliance, set apart in stone rather than dark */}
          <article className="relative overflow-hidden rounded-[1.5rem] border border-line bg-stone p-7 transition-colors duration-200 hover:border-ink/20 sm:p-8 lg:col-span-3 lg:col-start-1 lg:row-start-2">
            <div
              className="pointer-events-none absolute inset-0 grid-bg grid-mask-panel opacity-60"
              aria-hidden="true"
            />
            <div className="relative sm:flex sm:items-start sm:justify-between sm:gap-10">
              <div className="max-w-[26rem]">
                <ShieldCheck className="h-6 w-6 text-clay" strokeWidth={1.6} />
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
        </div>
      </div>
    </section>
  )
}
