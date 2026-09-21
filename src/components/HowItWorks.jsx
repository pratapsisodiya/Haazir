import { SectionLabel } from './Brand'
import { useActiveInViewport } from '../lib/hooks'

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
    body: 'We handle business verification and template approvals with Meta, then move it onto your real number. Each month you get a one-page report: enquiries answered, bookings made, threads handed to your team.',
  },
]

export default function HowItWorks() {
  const [active, refs] = useActiveInViewport(STEPS.length)

  return (
    <section id="how-it-works" className="border-t border-line bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
          {/* Pinned heading */}
          <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.6vw,3.1rem)]">
              Three weeks, and nobody learns new software.
            </h2>
            <p className="mt-6 max-w-[38ch] text-ink/58">
              You keep the same number, the same team, the same way of speaking to
              customers. We do the part that takes an engineer.
            </p>

            <ol className="mt-9 hidden items-center gap-3 lg:flex" aria-hidden="true">
              {STEPS.map((step, i) => (
                <li
                  key={step.n}
                  className={`h-[3px] w-12 rounded-full transition-colors duration-500 ${
                    i <= active ? 'bg-clay' : 'bg-line'
                  }`}
                />
              ))}
            </ol>
          </div>

          {/* Scrolling steps */}
          <ol className="mt-12 space-y-14 lg:mt-0 lg:space-y-0 lg:py-[30vh]">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                ref={(node) => {
                  refs.current[i] = node
                }}
                className={`transition-opacity duration-500 lg:flex lg:min-h-[52vh] lg:flex-col lg:justify-center ${
                  i === active ? 'opacity-100' : 'lg:opacity-40'
                }`}
              >
                <p className="tabular text-[0.82rem] font-medium tracking-[0.2em] text-clay">
                  {step.n}
                </p>
                <h3 className="mt-4 max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.4rem)]">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-[46ch] text-ink/58">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
