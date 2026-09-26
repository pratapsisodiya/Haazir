import { SectionLabel } from './Brand'
import Reveal from './Reveal'

/**
 * Three steps, three columns. This used to be a sticky-scroll section that
 * pinned the heading and dimmed each step as you passed it — a nice effect that
 * cost 2,169px of desktop scrolling to deliver three short paragraphs. The
 * paragraphs are the point.
 */
const STEPS = [
  {
    n: '01',
    title: 'We sit with you for an afternoon',
    body: 'We read three months of your real WhatsApp history — the repeat questions, the way your staff says no, the phrases customers actually use. That transcript is the spec. Nothing gets invented in a workshop.',
  },
  {
    n: '02',
    title: 'We build it and you break it',
    body: 'Within a week there is a working agent on a test number. You message it like a difficult customer and reject every reply that does not sound like you. We rewrite until you stop finding them.',
  },
  {
    n: '03',
    title: 'It goes live and you see the numbers',
    body: 'We handle business verification and template approvals with Meta, then move it onto your real number. Each month you get a one-page report: enquiries answered, bookings made, threads handed over.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-paper py-16 sm:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="max-w-[46rem]">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,2.9rem)]">
            Three weeks, and nobody learns new software.
          </h2>
          <p className="mt-5 max-w-[46ch] text-ink/65">
            You keep the same number, the same team, the same way of speaking to customers.
            We do the part that takes an engineer.
          </p>
        </Reveal>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 80} className="border-t border-line pt-6">
              <p className="tabular text-[0.8rem] font-medium tracking-[0.2em] text-clay-deep">
                {step.n}
              </p>
              <h3 className="mt-3 text-[1.35rem]">{step.title}</h3>
              <p className="mt-3 text-[0.98rem] text-ink/65">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
