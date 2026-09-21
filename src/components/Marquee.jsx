import Photo from './Photo'
import { MARQUEE_IMAGES } from '../lib/images'

/**
 * Edge-to-edge strip that scrolls forever. The list is rendered twice and the
 * track travels exactly -50%, so the loop is seamless. Reduced motion pins it.
 */
export default function Marquee() {
  const reel = [...MARQUEE_IMAGES, ...MARQUEE_IMAGES]

  return (
    <section
      className="relative overflow-hidden border-y border-line bg-paper py-10 sm:py-14"
      aria-label="The businesses haazir answers for"
    >
      <div className="animate-marquee flex w-max gap-4 sm:gap-5">
        {reel.map((image, i) => (
          <Photo
            key={`${image.src}-${i}`}
            image={image}
            aria-hidden={i >= MARQUEE_IMAGES.length}
            sizes="(min-width: 640px) 25rem, 17rem"
            className="aspect-3/2 w-[17rem] shrink-0 rounded-2xl sm:w-[25rem]"
            overlay="from-clay/14 via-transparent to-[#7a4a2e]/18"
          />
        ))}
      </div>

      {/* Soft edges so the strip doesn't end abruptly */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent sm:w-28"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent sm:w-28"
        aria-hidden="true"
      />
    </section>
  )
}
