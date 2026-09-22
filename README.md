# haazir

Single-page marketing site for **haazir** — a Jaipur studio building WhatsApp AI
agents for premium Indian businesses. React + Tailwind, no backend: every call
to action is a `wa.me` link.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview
```

## Layout

```
src/
  App.jsx                  section order
  index.css                design tokens, grid/marquee/slider styles, reduced-motion rules
  lib/
    site.js                WhatsApp link, email, location  <- edit before launch
    images.js              photography + alt text          <- edit before launch
    format.js              Indian number formatting (lakh / crore, 2-2-3 commas)
    hooks.js               reduced motion, animated numbers, sticky-scroll activation
  components/
    Brand.jsx              jharokha mark, wordmark, buttons, icon tiles (all SVG, no image files)
    Reveal.jsx             fade/lift-in wrapper, fires once per element via IntersectionObserver
    Hero.jsx  Nav.jsx  Marquee.jsx  WhatItDoes.jsx
    Calculator.jsx  HowItWorks.jsx  Pricing.jsx  CallToAction.jsx  Footer.jsx
    Photo.jsx              warm overlay, lazy loading, graceful fallback
```

## Before launch

1. **`src/lib/site.js`** — replace `https://wa.me/91XXXXXXXXXX` with the real
   WhatsApp Business number, and set the contact email. Every CTA reads from
   this one file.
2. **`src/lib/images.js`** — the photos are Unsplash placeholders chosen by
   subject (jharokha window, jewellery case, mandap, clinic reception, coaching
   classroom, Udaipur at dawn, hotel desk). Swap the photo IDs for licensed
   shots. `Photo` falls back to a warm stone gradient if a URL fails, so a dead
   ID degrades quietly rather than showing a broken image.
3. **Calculator assumptions** — `AFTER_HOURS_SHARE` (34%) and `RECOVERY_RATE`
   (12%) live at the top of `Calculator.jsx` and are printed under the sliders.
   Change the constants and the copy updates itself.

## Design rules this codebase holds to

- The page is a single light theme end to end: `#F7F7F4` sections alternating
  with `#FFFFFF`, and `#F1EFE9` ("stone") for the panels that need to sit apart
  — the compliance card, the calculator result and the closing CTA.
- Terracotta is an accent only — buttons, one word in the hero headline, icon
  strokes, one card border. Never a background wash.
- Two terracotta shades, for contrast rather than decoration: `#D2603F` for
  large type, icon strokes, borders and glows; `#A8482B` (`clay-deep`) for
  filled buttons and any terracotta text under 24px. `#D2603F` only reaches
  3.6:1 on off-white and 3.8:1 behind white text, so it fails WCAG AA at body
  sizes; `#A8482B` clears it at 5.4:1 and 5.7:1.
- Headlines: weight 500, `-0.04em` tracking, 0.95–1.05 leading. Body 17px/1.65.
- Nothing animates under `prefers-reduced-motion: reduce` — the marquee stops,
  the counters snap, scrolling is not smoothed.
- No fake testimonials, client logos or statistics anywhere on the page. The
  marquee captions name customer *segments* we build for, not clients.
- Every run of text on the page clears WCAG AA against its actually-painted
  backdrop (verified by compositing each ancestor background, not by eye).

## The interaction layer

- **Sticky nav**, blurred/bordered only once the page has scrolled
  (`useScrolled` in `lib/hooks.js`), with a real mobile menu (hamburger →
  slide-down panel, closes on Escape/resize/link-click, locks body scroll
  while open). `Nav` is rendered at the `App.jsx` level, not inside `Hero` —
  `Hero` uses `overflow-hidden` for its glow/grid, which would otherwise clip
  the nav's stickiness the moment you scrolled past it.
- **Scroll reveals** (`Reveal.jsx`): every section's heading and cards fade
  and lift in once, staggered, the first time they cross into view. Wraps
  `useReveal`'s IntersectionObserver so nothing needed repeating per section.
- **One rule for combining `Reveal` with a hover-interactive card**: never put
  Reveal's entrance transition and a card's own hover transition
  (`transition-[...]`) on the *same* element. Two different
  `transition-property`/`transition-duration` utility classes on one node
  don't merge — only one wins, and which one depends on Tailwind's internal
  utility ordering, not on the order the class names happen to appear in your
  JSX. `Reveal` wraps as a neutral `<div>` (entrance only); the styled
  `<article>` nests inside it (hover only). Same reasoning applies to two
  utilities that both set `display` (see the next point) — split the concern
  onto two elements instead of stacking classes that fight for one property.
- Same trap, different property: **`PrimaryCTA`'s base classes force
  `inline-flex` unconditionally**. A call site that tries to override it with
  `hidden sm:inline-flex` is stacking a second, unconditional `display`
  utility on the same element — cascade order (not JSX order) decides which
  wins, so this is not reliable. Where a `PrimaryCTA` needs to be
  hidden/shown responsively (the desktop-only nav button), wrap it in a
  `<div className="hidden sm:block">` instead of passing display utilities
  through `className`.
- The floating hero message card and pricing/bento cards get a small
  `animate-float` / `hover:-translate-y-*` lift; `IconTile` (`Brand.jsx`) is
  the shared tinted-square icon treatment used in the bento grid and pricing.
- A barely-there noise texture (`.grain`, an inline `feTurbulence` data URI,
  no network request) keeps the large flat CTA panel from reading as a vector
  fill. It's decoration only, at 5% opacity — nothing to swap before launch.
