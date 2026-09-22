import { useState } from 'react'
import { MoonStar } from 'lucide-react'
import { SectionLabel } from './Brand'
import Reveal from './Reveal'
import { groupIndian, indianShort, rupees } from '../lib/format'
import { useAnimatedNumber } from '../lib/hooks'

const AFTER_HOURS_SHARE = 0.34
const RECOVERY_RATE = 0.12
const DAYS = 30

export default function Calculator() {
  const [enquiries, setEnquiries] = useState(45)
  const [ticket, setTicket] = useState(35_000)

  const afterHours = enquiries * AFTER_HOURS_SHARE * DAYS
  const recoverable = afterHours * RECOVERY_RATE
  const value = recoverable * ticket

  const animatedAfterHours = useAnimatedNumber(afterHours)
  const animatedRecoverable = useAnimatedNumber(recoverable)
  const animatedValue = useAnimatedNumber(value)

  const short = indianShort(animatedValue)

  return (
    <section id="calculator" className="border-t border-line bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>The cost of silence</SectionLabel>
          <h2 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.1rem)]">
            Move two sliders. See the year you're giving away.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Inputs */}
          <Reveal delay={80}>
            <Slider
              id="enquiries"
              label="Enquiries you get in a day"
              value={enquiries}
              min={5}
              max={200}
              step={1}
              onChange={setEnquiries}
              display={`${groupIndian(enquiries)}`}
              suffix="a day"
            />

            <Slider
              id="ticket"
              label="What an average customer is worth"
              value={ticket}
              min={1_000}
              max={5_00_000}
              step={1_000}
              onChange={setTicket}
              display={rupees(ticket)}
              suffix="per customer"
              className="mt-10"
            />

            <p className="mt-10 max-w-[46ch] border-t border-line pt-6 text-[0.84rem] leading-relaxed text-ink/60">
              Assumptions: {Math.round(AFTER_HOURS_SHARE * 100)}% of enquiries arrive
              outside working hours, across {DAYS} days a month.{' '}
              {Math.round(RECOVERY_RATE * 100)}% of those become customers when they get
              an answer within a minute instead of the next morning. Your own numbers
              will differ — we'd rather read your actual WhatsApp history than guess.
            </p>
          </Reveal>

          {/* Results */}
          <Reveal
            delay={160}
            className="relative overflow-hidden rounded-[1.75rem] border border-line bg-stone p-7 lift sm:p-9"
          >
            <div
              className="pointer-events-none absolute inset-0 grid-bg grid-mask-panel opacity-70"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-clay/10 blur-[90px]"
              aria-hidden="true"
            />

            <div className="relative" aria-live="polite">
              <p className="flex items-center gap-2.5 text-[0.75rem] font-medium tracking-[0.16em] text-ink/60 uppercase">
                <MoonStar className="h-4 w-4 text-clay" strokeWidth={1.7} />
                Every month, roughly
              </p>

              <dl className="mt-7 space-y-6">
                <Stat
                  term="Enquiries that land after hours"
                  value={groupIndian(animatedAfterHours)}
                  unit="messages"
                />
                <Stat
                  term="Customers you'd have kept"
                  value={groupIndian(animatedRecoverable)}
                  unit="people"
                />
              </dl>

              <div className="mt-8 border-t border-line pt-7">
                <dt className="text-[0.95rem] text-ink/65">Revenue walking away</dt>
                <dd className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular text-[clamp(2.6rem,7vw,3.9rem)] leading-none font-medium tracking-[-0.045em] text-clay-deep">
                    &#8377;{short.value}
                  </span>
                  {short.unit && (
                    <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-clay-deep">
                      {short.unit}
                    </span>
                  )}
                  <span className="w-full text-[0.9rem] text-ink/60">
                    {rupees(animatedValue)} a month &middot; {rupees(animatedValue * 12)} a year
                  </span>
                </dd>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Stat({ term, value, unit }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-[0.95rem] text-ink/65">{term}</dt>
      <dd className="tabular shrink-0 text-[1.6rem] font-medium tracking-[-0.035em]">
        {value}
        <span className="ml-1.5 text-[0.85rem] font-normal tracking-normal text-ink/60">
          {unit}
        </span>
      </dd>
    </div>
  )
}

function Slider({ id, label, value, min, max, step, onChange, display, suffix, className = '' }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[1.02rem] text-ink/80">
          {label}
        </label>
        <p className="tabular text-[1.3rem] font-medium tracking-[-0.035em]">
          {display}
          <span className="ml-1.5 text-[0.82rem] font-normal tracking-normal text-ink/60">
            {suffix}
          </span>
        </p>
      </div>

      <input
        id={id}
        type="range"
        className="haazir-range mt-2"
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="flex justify-between text-[0.78rem] text-ink/60">
        <span>{id === 'ticket' ? rupees(min) : groupIndian(min)}</span>
        <span>{id === 'ticket' ? rupees(max) : groupIndian(max)}</span>
      </div>
    </div>
  )
}
