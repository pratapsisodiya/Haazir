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
    site.js                number, email, and the pre-filled WhatsApp openers  <- edit before launch
    segments.js            the outreach variants (/jewellers, /clinics, ...)   <- your copy lives here
    campaign.js            reads the segment + ?ref= tag out of the URL, once
    images.js              photography + alt text          <- edit before launch
    format.js              Indian number formatting (lakh / crore, 2-2-3 commas)
    hooks.js               reduced motion, animated numbers, sticky-scroll activation
  components/
    Brand.jsx              jharokha mark, wordmark, buttons (all SVG, no image files)
    Hero.jsx  Nav.jsx  Marquee.jsx  WhatItDoes.jsx  Faq.jsx
    Calculator.jsx  HowItWorks.jsx  Pricing.jsx  CallToAction.jsx  Footer.jsx
    Photo.jsx              warm overlay, lazy loading, graceful fallback
scripts/
  og.mjs                   renders the link-preview cards into public/ (run by hand)
  pages.mjs                post-build: one static page per segment, own meta tags
```

## Before launch

1. **`src/lib/site.js`** — replace `91XXXXXXXXXX` with the real WhatsApp
   Business number, and set the contact email. Every CTA reads from this one
   file. `SITE_URL` there, and the hardcoded domain in `index.html` +
   `scripts/pages.mjs`, need the real domain once you have one — they are what
   the link-preview card points at.
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
- **Motion and decoration are used sparingly, on purpose, not as a "modern AI
  product" signature.** No scroll-triggered fade/lift-ins, no floating or
  breathing elements, no ambient glow behind every panel, no grain/noise
  texture, no glassmorphism (translucent-plus-blur) anywhere — including the
  sticky nav and mobile menu, which are solid white once they take a
  background. The two terracotta glows that remain (top-left of the hero, and
  behind the hero photo) are the ones the original brief actually asked for;
  every other glow this codebase tried along the way got removed. What's left
  is: a sticky nav, a working mobile menu, the sticky-scroll "how it works"
  section (all functional, not decorative), a flat resting shadow on cards
  (`.lift` in `index.css`), and a plain `hover:-translate-y-1` on pricing
  cards — the "lift 4px on hover" the brief asked for, nothing more.

## Interaction that stayed

- **Sticky nav**, transparent until the page has scrolled (`useScrolled` in
  `lib/hooks.js`), then a solid white bar with a border and a resting shadow
  — no blur. A real mobile menu: hamburger → slide-down panel, closes on
  Escape/resize/link-click, locks body scroll while open. `Nav` is rendered
  at the `App.jsx` level, not inside `Hero` — `Hero` uses `overflow-hidden`
  for its grid/glow, which would otherwise clip the nav's stickiness the
  moment you scrolled past it.
- **`PrimaryCTA`'s base classes force `inline-flex` unconditionally.** A call
  site that tries to override it with `hidden sm:inline-flex` is stacking a
  second, unconditional `display` utility on the same element — cascade
  order (not JSX order) decides which wins, so that override is not
  reliable. Where a `PrimaryCTA` needs to be hidden/shown responsively (the
  desktop-only nav button), wrap it in `<div className="hidden sm:block">`
  instead of passing display utilities through `className`.

## The outreach kit

This site is an outbound asset: it gets pasted into a WhatsApp chat or opened
in front of someone at their counter. Everything below exists for that, not for
search traffic.

- **Link previews.** `index.html` carries the full og:/twitter: set, and
  `public/og*.png` are the cards themselves. Without these, a pasted link shows
  as bare text and reads as spam — which is the single cheapest way to lose a
  cold prospect. Regenerate the cards with `npm run og` after a wording or
  brand change (needs `npm i -D playwright-core`; it is deliberately not a
  default dependency, since the PNGs are committed).
- **One page per segment.** `/jewellers`, `/clinics`, `/hotels`, `/coaching`.
  Each is a real file in `dist/`, written by `scripts/pages.mjs` after the
  Vite build, carrying its own title, description and og:image — a crawler
  never runs the JS, so client-side routing would make every link preview
  identically. The bundle is shared; `lib/campaign.js` reads the path at
  runtime and swaps the subhead, the sample conversation, which photo the
  strip leads with, and what the calculator opens tuned to. Add or edit
  variants in `lib/segments.js` — no other file needs touching.
- **Every CTA opens a started conversation.** `whatsappLink(context)` in
  `lib/site.js` pre-fills the message, worded per button and per segment, so
  the prospect never lands in an empty thread: the pricing button asks about
  Build + Run, the closing one leaves the cursor after "here's an enquiry we
  missed:", the calculator one carries the figure.
- **`?ref=` tags the outreach round.** `haazir.example/jewellers?ref=johari-1`
  appends `(ref: johari-1)` to whatever the prospect sends you, so replies are
  attributable to a batch without any analytics. Stripped to word characters
  and 40 chars, since it ends up visible in someone's message.
- **A shareable calculator.** The sliders write to `?e=` and `?t=`, and "Copy
  link with these numbers" hands you a URL that opens on the prospect's own
  figures. Dial in their enquiry volume and ticket size, send the link, let
  the page make the argument. The URL stays clean until a slider actually
  moves, so an untouched outreach link is not cluttered.
- **An FAQ that pre-empts the DM round-trips** — the ban question, the
  number-migration question, the "what if it says something wrong" question.
  Eight of them, in `Faq.jsx`.

Segment calculator defaults (`lib/segments.js`) are deliberately conservative.
The model multiplies up quickly, and an opening figure that reads as hype costs
more trust than a big number buys attention.
