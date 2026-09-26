import { SEGMENTS } from '../lib/segments'
import { SEGMENT } from '../lib/campaign'

/**
 * Replaces the six-photo marquee. That strip cost a section of height and a
 * scroll of someone's patience to say something a single line says better —
 * and every photo in it was an unverified stock placeholder.
 *
 * On a segment page the reader's own trade is marked, so a jeweller sees
 * themselves named rather than hunting for it.
 */
export default function SegmentBar() {
  return (
    <section className="border-y border-line bg-white" aria-label="Who haazir is built for">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-x-8 gap-y-3 px-5 py-5 sm:px-8 md:flex-row md:items-center">
        <p className="shrink-0 text-[0.75rem] font-medium tracking-[0.16em] text-ink/60 uppercase">
          Built for
        </p>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {SEGMENTS.map((segment) => {
            const current = segment.slug === SEGMENT.slug
            return (
              <li
                key={segment.slug}
                aria-current={current ? 'true' : undefined}
                className={`text-[0.95rem] ${current ? 'font-medium text-clay-deep' : 'text-ink/65'}`}
              >
                {segment.name.charAt(0).toUpperCase() + segment.name.slice(1)}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
