/**
 * Outreach variants. Each one is a real page — /jewellers, /clinics, /hotels,
 * /coaching — so a link you paste into a chat talks about that person's counter
 * instead of a generic "business".
 *
 * Everything brand-level (the wordmark, the headline, the palette) stays fixed.
 * What changes is the subhead, the sample conversation, which segment the photo
 * strip leads with, and what the calculator opens tuned to.
 */

export const DEFAULT_SEGMENT = {
  slug: '',
  /** Shown in <title> and the OG card. */
  name: 'premium Indian businesses',
  /** How the prospect refers to their own place, used inside WhatsApp messages. */
  noun: 'business',
  eyebrow: null,
  subhead:
    'Your customer messages at 11pm on a Sunday. haazir answers in the language they wrote in, books them the slot they asked for, and hands the thread to your team the moment it needs a person.',
  /** The sample exchange in the hero card. */
  chat: {
    time: '11:42 pm',
    from: 'Is the Kundan set still available?',
    reply: "Ji haan — it's in the Johari Bazaar store. Shall I hold it for you till tomorrow 6pm?",
  },
  /** Which marquee photo the strip leads with. */
  leadImage: null,
  /** Calculator starting point — a plausible mid-size operation. */
  calculator: { enquiries: 45, ticket: 35_000 },
}

export const SEGMENTS = [
  {
    slug: 'jewellers',
    name: 'jewellery showrooms',
    noun: 'jewellery showroom',
    eyebrow: 'For jewellery showrooms',
    subhead:
      'A customer asks about a set at 11pm on a Sunday. haazir answers in the language they wrote in, holds the piece, books the viewing — and hands the thread to your counter staff the moment it turns into a negotiation.',
    chat: {
      time: '11:42 pm',
      from: 'Is the Kundan set still available?',
      reply: "Ji haan — it's in the Johari Bazaar store. Shall I hold it for you till tomorrow 6pm?",
    },
    leadImage: 'Jewellery showrooms',
    calculator: { enquiries: 25, ticket: 45_000 },
  },
  {
    slug: 'clinics',
    name: 'clinics and dental practices',
    noun: 'clinic',
    eyebrow: 'For clinics and dental practices',
    subhead:
      'A patient messages after the front desk has gone home. haazir answers in the language they wrote in, offers the slots that are actually free, sends the reminder the day before — and never gives medical advice.',
    chat: {
      time: '10:18 pm',
      from: 'Doctor sahab ka Saturday ka slot mil jayega?',
      reply: 'Saturday 11:30 am khaali hai. Aapke naam se rakh doon?',
    },
    leadImage: 'Clinics & dental practices',
    calculator: { enquiries: 40, ticket: 2_500 },
  },
  {
    slug: 'hotels',
    name: 'hotels and resorts',
    noun: 'hotel',
    eyebrow: 'For hotels and resorts',
    subhead:
      'An enquiry lands at midnight while your front desk is on a night shift. haazir answers in the language they wrote in, checks what is free, holds the room, and passes the thread over the moment someone wants to negotiate a rate.',
    chat: {
      time: '12:06 am',
      from: 'Do you have a room for 2 nights from the 14th?',
      reply: 'Yes — a deluxe double is free on both nights. Shall I hold it while you check with your family?',
    },
    leadImage: 'Hotels',
    calculator: { enquiries: 35, ticket: 9_000 },
  },
  {
    slug: 'coaching',
    name: 'coaching institutes',
    noun: 'coaching institute',
    eyebrow: 'For coaching institutes',
    subhead:
      'A parent messages at 11pm asking about fees and batch timings. haazir answers in the language they wrote in, sends the fee structure, books the counselling slot — and hands over the moment they ask for a discount.',
    chat: {
      time: '11:05 pm',
      from: 'NEET batch ki fees aur timing bata dijiye',
      reply: 'Zaroor — morning batch 7–10, evening 5–8. Fee structure bhej doon, ya counselling ka slot rakh doon?',
    },
    leadImage: 'Coaching institutes',
    calculator: { enquiries: 40, ticket: 25_000 },
  },
]

/** Looks a segment up by its slug. Returns the generic page for anything else. */
export function findSegment(slug) {
  if (!slug) return DEFAULT_SEGMENT
  return SEGMENTS.find((s) => s.slug === slug) ?? DEFAULT_SEGMENT
}
