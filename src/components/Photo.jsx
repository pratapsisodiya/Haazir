import { useState } from 'react'
import { PHOTO_FALLBACK } from '../lib/images'

/**
 * Photograph with a warm overlay so it sits inside the palette, and a quiet
 * stone-gradient fallback if the source ever fails.
 */
export default function Photo({
  image,
  className = '',
  imgClassName = '',
  priority = false,
  overlay = 'from-clay/16 via-transparent to-ink/22',
  sizes,
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      <img
        src={failed ? PHOTO_FALLBACK : image.src}
        srcSet={failed ? undefined : image.srcSet}
        sizes={sizes}
        alt={image.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onError={() => setFailed(true)}
        className={`photo-warm h-full w-full object-cover ${imgClassName}`}
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${overlay}`}
        aria-hidden="true"
      />
    </div>
  )
}
