import { Hammer, MessageCircle, RefreshCw } from 'lucide-react'
import { IconTile, PrimaryCTA, SectionLabel } from './Brand'
import Reveal from './Reveal'

const PLANS = [
  {
    name: 'Build',
    icon: Hammer,
    price: '₹25,000',
    cadence: 'once',
    badge: 'starts here',
    body: 'Reading your history, writing the agent, getting it through Meta verification and onto your number.',
    points: ['Discovery afternoon', 'Agent built to your transcript', 'Verification & template approvals'],
    featured: true,
  },
  {
    name: 'Run',
    icon: RefreshCw,
    price: '₹5,000',
    cadence: 'per month',
    body: 'Hosting, monitoring, and the edits you ask for as your catalogue, staff and prices change.',
    points: ['Uptime & quality monitoring', 'Unlimited copy edits', 'One-page monthly report'],
  },
  {
    name: 'Messages',
    icon: MessageCircle,
    price: 'At cost',
    cadence: 'passed through',
    body: "Meta charges per conversation. We bill you exactly what they bill us, on the same invoice.",
    points: ["Meta's published rates", 'No markup, no minimum', 'Itemised every month'],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-line bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.1rem)]">
            Two numbers and a pass-through.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 90}>
              <article
                className={`group relative flex h-full flex-col rounded-[1.5rem] border bg-paper p-7 lift transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:lift-md sm:p-8 ${
                  plan.featured
                    ? 'border-clay shadow-[0_0_0_1px_rgb(210_96_63_/_0.12),0_20px_44px_-24px_rgb(210_96_63_/_0.45)]'
                    : 'border-line'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-7 rounded-full bg-clay-deep px-3 py-1 text-[0.72rem] font-medium tracking-[0.1em] text-white uppercase">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-[1.05rem] font-medium tracking-[0.02em] text-ink/60 uppercase">
                    {plan.name}
                  </h3>
                  <IconTile icon={plan.icon} size={38} />
                </div>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="tabular text-[clamp(2.1rem,4vw,2.7rem)] leading-none font-medium tracking-[-0.045em]">
                    {plan.price}
                  </span>
                  <span className="text-[0.92rem] text-ink/60">{plan.cadence}</span>
                </p>

                <p className="mt-5 text-[0.98rem] text-ink/65">{plan.body}</p>

                <ul className="mt-6 space-y-2.5 border-t border-line pt-6 text-[0.94rem] text-ink/65">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-clay" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <PrimaryCTA>Ask what yours would cost</PrimaryCTA>
          <p className="text-[0.92rem] text-ink/60">
            No retainer lock-in. Cancel the monthly whenever you like.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
