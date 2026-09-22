import Photo from './Photo'
import { MARQUEE_IMAGES } from '../lib/images'
import { SEGMENT } from '../lib/campaign'

/**
 * Edge-to-edge strip that scrolls forever. The list is rendered twice and the
 * track travels exactly -50%, so the loop is seamless. Reduced motion pins it.
 *
 * On a segment page the strip leads with that segment's photo, so a jeweller
 * sees a showroom first rather than a hotel desk.
 */
export default function Marquee() {
  const lead = MARQUEE_IMAGES.findIndex((i) => i.label === SEGMENT.leadImage)
  const ordered =
    lead > 0 ? [...MARQUEE_IMAGES.slice(lead), ...MARQUEE_IMAGES.slice(0, lead)] : MARQUEE_IMAGES
  const reel = [...ordered, ...ordered]

  return (
    <section
      className="marquee-group relative overflow-hidden border-y border-line bg-white py-12 sm:py-16"
      aria-labelledby="who-for"
    >
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <h2 id="who-for" className="text-[0.75rem] font-medium tracking-[0.16em] text-ink/60 uppercase">
          Who we build for
        </h2>
      </div>

      <div className="animate-marquee mt-8 flex w-max gap-4 sm:gap-5">
        {reel.map((image, i) => {
          const duplicate = i >= MARQUEE_IMAGES.length
          return (
            <figure
              key={`${image.src}-${i}`}
              aria-hidden={duplicate || undefined}
              className="relative w-[17rem] shrink-0 sm:w-[25rem]"
            >
              <Photo
                image={image}
                sizes="(min-width: 640px) 25rem, 17rem"
                className="aspect-3/2 rounded-2xl"
                overlay="from-clay/12 via-transparent to-ink/35"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[0.78rem] font-medium text-ink/80">
                {image.label}
              </figcaption>
            </figure>
          )
        })}
      </div>

      {/* Soft edges so the strip doesn't end abruptly */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent sm:w-28"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent sm:w-28"
        aria-hidden="true"
      />
    </section>
  )
}
