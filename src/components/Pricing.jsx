import { PrimaryCTA, SectionLabel } from './Brand'

const PLANS = [
  {
    name: 'Build',
    price: '₹25,000',
    cadence: 'once',
    badge: 'starts here',
    body: 'Reading your history, writing the agent, getting it through Meta verification and onto your number.',
    points: ['Discovery afternoon', 'Agent built to your transcript', 'Verification & template approvals'],
    featured: true,
  },
  {
    name: 'Run',
    price: '₹5,000',
    cadence: 'per month',
    body: 'Hosting, monitoring, and the edits you ask for as your catalogue, staff and prices change.',
    points: ['Uptime & quality monitoring', 'Unlimited copy edits', 'One-page monthly report'],
  },
  {
    name: 'Messages',
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
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.1rem)]">
          Two numbers and a pass-through.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`group relative flex flex-col rounded-[1.5rem] border bg-paper p-7 lift transition-transform duration-200 hover:-translate-y-1 sm:p-8 ${
                plan.featured ? 'border-clay' : 'border-line'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-clay-deep px-3 py-1 text-[0.72rem] font-medium tracking-[0.1em] text-white uppercase">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-[1.05rem] font-medium tracking-[0.02em] text-ink/60 uppercase">
                {plan.name}
              </h3>

              <p className="mt-5 flex items-baseline gap-2">
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
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <PrimaryCTA>Ask what yours would cost</PrimaryCTA>
          <p className="text-[0.92rem] text-ink/60">
            No retainer lock-in. Cancel the monthly whenever you like.
          </p>
        </div>
      </div>
    </section>
  )
}
