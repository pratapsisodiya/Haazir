import { Plus } from 'lucide-react'
import { SectionLabel } from './Brand'
import Reveal from './Reveal'

/**
 * The questions that otherwise cost a round-trip each in a DM. Native
 * <details> — no JS, keyboard-accessible, open on first paint if JS fails.
 */
const QUESTIONS = [
  {
    q: 'Will my WhatsApp number get banned?',
    a: "That's the usual fear, and it comes from the unofficial tools that log into WhatsApp pretending to be your phone. We don't do that. haazir runs on the official WhatsApp Business Platform from Meta. Business verification, template approvals and quality-rating monitoring are our job, not yours.",
  },
  {
    q: 'Do I have to change my number?',
    a: "No — you keep the number your customers already know. What changes is how your team reads it: the number moves onto the official platform, so it stops working through the WhatsApp Business app on a handset, and your staff reply from a shared inbox on any device instead. We do the migration with you.",
  },
  {
    q: 'What if it says something wrong, or promises a discount?',
    a: "It only answers from what you approved. During the build week you message it like a difficult customer and reject every reply that doesn't sound like you — we rewrite until you stop finding them. Anything it hasn't been taught, and anything that turns into negotiation or a complaint, goes to a human mid-sentence.",
  },
  {
    q: 'Will customers realise it is not a person?',
    a: "We don't pretend otherwise, and we don't give it a fake human name. It answers as your business. In practice people care that they got a straight answer at 11pm — and the moment they need a person, they get one.",
  },
  {
    q: 'What happens to my counter staff?',
    a: 'They stop retyping the same twenty answers and start getting only the threads that actually need them. Nobody learns new software: the handover lands in the same shared inbox they already use.',
  },
  {
    q: 'How long before it is live?',
    a: 'About three weeks. An afternoon with you, a working agent on a test number inside a week, then business verification and template approvals with Meta — that last part runs on Meta’s timeline, not ours, so it is the step that can stretch.',
  },
  {
    q: 'What does it actually cost to run?',
    a: '₹5,000 a month, plus what Meta charges per conversation. We pass those through at cost on the same invoice — no markup, itemised. There is no lock-in on the monthly.',
  },
  {
    q: 'Does it work in Hindi?',
    a: 'Hindi, English and Hinglish, out of the box. It replies in whatever script the customer wrote in, and switches mid-conversation without being asked.',
  },
]

export default function Faq() {
  return (
    <section id="faq" className="border-t border-line bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal>
          <SectionLabel>Straight answers</SectionLabel>
          <h2 className="max-w-[18ch] text-[clamp(2rem,4.6vw,3.1rem)]">
            The things everyone asks before they say yes.
          </h2>
        </Reveal>

        <div className="mt-12 max-w-[52rem] divide-y divide-line border-y border-line">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.05rem] text-ink transition-colors hover:text-clay-deep [&::-webkit-details-marker]:hidden">
                {q}
                <Plus
                  className="mt-1 h-4 w-4 shrink-0 text-clay-deep transition-transform duration-200 group-open:rotate-45"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-[60ch] pb-6 text-[0.98rem] text-ink/65">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
