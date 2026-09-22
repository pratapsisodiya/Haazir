import { AlertTriangle, Check, Minus } from 'lucide-react'
import { SectionLabel } from './Brand'
import Reveal from './Reveal'

/**
 * The two things a prospect is actually weighing haazir against: a cheap
 * unofficial bot, and putting another person on the counter. Stated straight —
 * including where the alternatives genuinely win.
 */
const ROWS = [
  {
    label: 'Answers at 11pm on a Sunday',
    bot: ['yes', 'Yes'],
    hire: ['no', 'Only if you staff a night shift'],
    us: ['yes', 'Yes'],
  },
  {
    label: 'Hindi, English and Hinglish',
    bot: ['warn', 'Usually keyword scripts'],
    hire: ['yes', 'Yes'],
    us: ['yes', 'Yes, and switches mid-thread'],
  },
  {
    label: 'Risk to your number',
    bot: ['warn', 'Real — it signs in as your phone'],
    hire: ['yes', 'None'],
    us: ['yes', "None — Meta's official platform"],
  },
  {
    label: 'Thirty conversations at once',
    bot: ['yes', 'Yes'],
    hire: ['no', 'No'],
    us: ['yes', 'Yes'],
  },
  {
    label: 'Knows when to fetch a human',
    bot: ['no', 'No'],
    hire: ['yes', 'They are the human'],
    us: ['yes', 'Hands over mid-thread'],
  },
  {
    label: 'Sounds like your shop',
    bot: ['no', 'Generic templates'],
    hire: ['yes', 'After training'],
    us: ['yes', 'Built from your own transcripts'],
  },
  {
    label: 'What it costs a month',
    bot: ['warn', 'Little, until the number goes'],
    hire: ['warn', 'A salary, plus training'],
    us: ['yes', '₹5,000 + Meta at cost'],
  },
]

const ICONS = {
  yes: { Icon: Check, className: 'text-clay-deep' },
  no: { Icon: Minus, className: 'text-ink/35' },
  warn: { Icon: AlertTriangle, className: 'text-ink/45' },
}

function Cell({ value: [tone, text], className = '', textClass = 'text-ink/65' }) {
  const { Icon, className: iconClass } = ICONS[tone]
  return (
    <td className={`px-5 py-4 align-top text-[0.92rem] ${textClass} ${className}`}>
      <span className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2} aria-hidden="true" />
        {text}
      </span>
    </td>
  )
}

export default function Comparison() {
  return (
    <section id="comparison" className="border-t border-line bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>The honest comparison</SectionLabel>
          <h2 className="max-w-[20ch] text-[clamp(2rem,4.6vw,3.1rem)]">
            Against a cheap bot, and against hiring someone.
          </h2>
          <p className="mt-6 max-w-[46ch] text-ink/65">
            Both alternatives are real, and both beat us at something. Here is the whole
            picture, including the parts that don't flatter us.
          </p>
        </Reveal>

        <Reveal delay={90} className="mt-12">
          {/* Scrolls sideways on a phone rather than collapsing — a comparison
              you can't read across is not a comparison. */}
          <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-white lift">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <caption className="sr-only">
                haazir compared with an unofficial WhatsApp bot and with hiring another
                person
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-5 text-[0.78rem] font-medium tracking-[0.14em] text-ink/60 uppercase">
                    &nbsp;
                  </th>
                  <th scope="col" className="px-5 py-5 text-[0.95rem] font-medium text-ink/70">
                    An unofficial bot
                  </th>
                  <th scope="col" className="px-5 py-5 text-[0.95rem] font-medium text-ink/70">
                    Another person on the counter
                  </th>
                  <th scope="col" className="bg-stone px-5 py-5 text-[0.95rem] font-medium text-ink">
                    haazir
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <th scope="row" className="px-5 py-4 text-[0.95rem] font-normal text-ink">
                      {row.label}
                    </th>
                    <Cell value={row.bot} />
                    <Cell value={row.hire} />
                    <Cell value={row.us} className="bg-stone" textClass="text-ink" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
