/**
 * Photography. Every entry is an Unsplash photo with a descriptive search slug
 * in the URL, a fixed crop ratio, and real alt text.
 *
 * These are placeholders: swap `id` for the licensed shots before launch.
 * `<Photo>` falls back to a warm stone gradient if a URL ever fails to load,
 * so a dead ID degrades quietly instead of showing a broken image.
 */
const BASE = 'https://images.unsplash.com'

function src(id, slug, w, h) {
  return `${BASE}/photo-${id}?q=80&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&fm=webp&utm_source=haazir&s=${slug}`
}

export function photoSet(id, slug, w, h) {
  return {
    src: src(id, slug, w, h),
    srcSet: [
      `${src(id, slug, Math.round(w / 2), Math.round(h / 2))} ${Math.round(w / 2)}w`,
      `${src(id, slug, w, h)} ${w}w`,
      `${src(id, slug, w * 2, h * 2)} ${w * 2}w`,
    ].join(', '),
  }
}

// 4:5 portrait — the hero window.
export const HERO_IMAGE = {
  ...photoSet('1599661046289-e31897846e41', 'jaipur-haveli-jharokha-window', 800, 1000),
  alt: 'A carved sandstone jharokha window on a Jaipur haveli, its cusped arch and lattice screens lit by low evening sun.',
}

// 3:2 landscape — the marquee strip.
export const MARQUEE_IMAGES = [
  {
    ...photoSet('1515562141207-7a88fb7ce338', 'jewellery-showroom-display-case', 900, 600),
    alt: 'Gold necklaces arranged on velvet inside the lit glass display case of a jewellery showroom.',
  },
  {
    ...photoSet('1583939003579-730e3918a45a', 'rajasthani-wedding-mandap-night', 900, 600),
    alt: 'A marigold-draped wedding mandap at night, strung with warm lights, guests seated beyond it.',
  },
  {
    ...photoSet('1631217868264-e5b90bb7e133', 'modern-clinic-reception-desk', 900, 600),
    alt: 'The reception counter of a modern clinic, pale wood and soft daylight, waiting chairs to one side.',
  },
  {
    ...photoSet('1524178232363-1fb2b075b655', 'coaching-classroom-students', 900, 600),
    alt: 'Rows of desks in a coaching-institute classroom, a whiteboard at the front and afternoon light from high windows.',
  },
  {
    ...photoSet('1515630278258-407f66498911', 'udaipur-lake-palace-dawn', 900, 600),
    alt: 'Lake Pichola in Udaipur at dawn, palace walls and ghats reflected in flat water under a pale sky.',
  },
  {
    ...photoSet('1551882547-ff40c63fe5fa', 'hotel-front-desk-lobby', 900, 600),
    alt: 'A hotel front desk in a quiet lobby, brass lamps lit and a ledger open on the counter.',
  },
]

/** Warm stone gradient, used only if a photo fails to load. */
export const PHOTO_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d9cfc4"/><stop offset="0.55" stop-color="#c9ab97"/>
        <stop offset="1" stop-color="#b08968" stop-opacity="0"/>
      </linearGradient></defs>
      <rect width="3" height="2" fill="#cdbfb2"/><rect width="3" height="2" fill="url(#g)"/>
    </svg>`.replace(/\s+/g, ' '),
  )
