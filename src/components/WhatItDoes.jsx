import { CalendarCheck, Check, Languages, ShieldCheck, UserRound } from 'lucide-react'
import { SectionLabel } from './Brand'
import Reveal from './Reveal'

/**
 * Three equal cards, not a four-tile bento. The bento stacked into 2,000px of
 * phone scrolling to make three points, and the fourth tile (compliance) is
 * better as the one-line strip underneath — it is a reassurance, not a feature.
 */
const CARDS = [
  {
    icon: CalendarCheck,
    title: 'Books and confirms on its own',
    body: 'Your customer picks a slot inside the chat — no callback, no "we\'ll confirm tomorrow". It reads your live calendar, offers only what is free, and sends the reminder the day before.',
  },
  {
    icon: Languages,
    title: 'Hindi, English, Hinglish',
    body: 'Nobody has to switch to English to be understood. Whatever script your customer types in, the reply comes back in the same one — and it switches mid-conversation without being asked.',
  },
  {
    icon: UserRound,
    title: 'Knows when to step back',
    body: 'Price negotiation, a complaint, anything it has not been taught — it hands the thread to a human mid-sentence and stays quiet.',
  },
]

const SAFEGUARDS = [
  'Business verification',
  'Green tick application',
  'Template approvals',
  'Quality rating monitoring',
]

export default function WhatItDoes() {
  return (
    <section id="what-it-does" className="bg-paper py-16 sm:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>What your customer gets</SectionLabel>
          <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,2.9rem)]">
            An answer in seconds, from someone who sounds like your shop.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 70}>
              <article className="h-full rounded-[1.25rem] border border-line bg-white p-6 lift transition-colors duration-200 hover:border-ink/20 sm:p-7">
                <Icon className="h-6 w-6 text-clay" strokeWidth={1.6} />
                <h3 className="mt-5 text-[1.35rem]">{title}</h3>
                <p className="mt-3 text-[0.98rem] text-ink/65">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Compliance, as a strip rather than a whole tile. */}
        <Reveal delay={210} className="mt-4 sm:mt-5">
          <div className="rounded-[1.25rem] border border-line bg-stone px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-10">
              <p className="flex items-start gap-3 lg:max-w-[28rem]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-clay" strokeWidth={1.7} />
                <span className="text-[0.98rem] text-ink/75">
                  <strong className="font-medium text-ink">Your number will not get banned.</strong>{' '}
                  We run on the official WhatsApp Business Platform, not a library signing in as
                  your phone. The compliance work is ours.
                </span>
              </p>

              <ul className="grid gap-2 sm:grid-cols-2 lg:ml-auto lg:shrink-0">
                {SAFEGUARDS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[0.9rem] text-ink/70">
                    <Check className="h-3.5 w-3.5 shrink-0 text-clay-deep" strokeWidth={2.4} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
