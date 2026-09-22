import { SEGMENTS, findSegment } from './segments'

/**
 * Reads the outreach context out of the URL, once, at load.
 *
 *   /jewellers          → the jewellery-showroom variant of the page
 *   /?for=jewellers     → same thing, for when a clean path isn't available
 *   ?ref=batch-3        → tags where this visitor came from; rides along at the
 *                         end of every WhatsApp message they send you, so you
 *                         can tell which outreach round actually landed.
 */
function read() {
  if (typeof window === 'undefined') {
    return { segment: findSegment(''), ref: null }
  }

  const params = new URLSearchParams(window.location.search)
  const fromPath = window.location.pathname.replace(/^\/|\/$/g, '')
  const slug = SEGMENTS.some((s) => s.slug === fromPath) ? fromPath : params.get('for')

  const ref = params.get('ref')

  return {
    segment: findSegment(slug),
    // Keep it short and boring — it ends up visible in the customer's message.
    ref: ref ? ref.slice(0, 40).replace(/[^\w.\- ]/g, '') : null,
  }
}

export const { segment: SEGMENT, ref: REF } = read()
