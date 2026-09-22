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
    Brand.jsx              jharokha mark, wordmark, buttons (all SVG, no image files)
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
