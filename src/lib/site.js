import { REF, SEGMENT } from './campaign'

// Single place for the details that change when this goes live.
export const WHATSAPP_NUMBER = '91XXXXXXXXXX'
export const EMAIL = 'hello@haazir.studio'
export const LOCATION = 'Jaipur, Rajasthan'
export const SITE_URL = 'https://haazir-pink.vercel.app'

/**
 * The opening line each button drops into the customer's chat, so nobody has to
 * stare at an empty thread wondering what to type. `noun` is their kind of
 * business, taken from whichever variant of the page they are reading.
 */
const OPENERS = {
  hero: (noun) => `Hi haazir — I run a ${noun} and I'd like to see what your WhatsApp agent would do for us.`,
  nav: (noun) => `Hi haazir — I run a ${noun} and I'd like to know more.`,
  pricing: (noun) => `Hi haazir — what would Build + Run come to for my ${noun}?`,
  missed: (noun) => `Hi haazir — here's an enquiry my ${noun} missed:\n\n`,
  calculator: (noun, extra) =>
    `Hi haazir — your calculator puts ${extra} a month walking away from my ${noun}. I'd like to talk about it.`,
}

/**
 * Builds a wa.me link with the message already written.
 *
 * @param context one of the OPENERS keys
 * @param extra   optional detail folded into the message (the calculator's figure)
 */
export function whatsappLink(context = 'hero', extra = '') {
  const write = OPENERS[context] ?? OPENERS.hero
  let text = write(SEGMENT.noun, extra)

  // A quiet tag so you can tell which outreach round this reply came from.
  if (REF) text += `\n\n(ref: ${REF})`

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
