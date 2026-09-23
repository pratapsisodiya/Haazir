/**
 * Renders the home-screen icons a phone needs to install the site as an app.
 *
 * Committed to public/, so a normal `npm install && npm run build` never needs a
 * browser. Re-run only when the mark changes:
 *
 *     npm i -D playwright-core          # once; not a default dependency
 *     node scripts/icons.mjs
 */
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public')

const ARCH =
  'M26 86V58q6.7-4.4 4-12 7.5-3.8 6-12 7.8-3.5 7-12 7-1.8 7-9 0 7.2 7 9-.8 8.5 7 12-1.5 8.2 6 12-2.7 7.6 4 12v28H58v-8H42v8H26Z'

/**
 * @param size   px, square
 * @param radius border-radius as a % of the tile — 0 for full bleed
 * @param inset  how much of the tile the arch occupies, 0–1. Maskable icons get
 *               a smaller arch so Android can crop to a circle/squircle without
 *               clipping it (the safe zone is the middle 80%).
 */
function tile(size, radius, inset) {
  const glyph = Math.round(size * inset)
  // The rounded tile is its own element: a border-radius on <body> does not
  // leave transparent corners under omitBackground, it just paints a square.
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { margin: 0; padding: 0; }
  html, body { width: ${size}px; height: ${size}px; background: transparent; }
  .tile { width: ${size}px; height: ${size}px; border-radius: ${radius}%;
          background: #D2603F; display: flex; align-items: center;
          justify-content: center; overflow: hidden; }
  svg { width: ${glyph}px; height: ${glyph}px; display: block; }
</style></head>
<body><div class="tile"><svg viewBox="0 0 100 100"><path d="${ARCH}" fill="#F7F7F4"/></svg></div></body></html>`
}

const ICONS = [
  // [file, size, radius %, arch share of tile]
  ['icon-192.png', 192, 22, 0.6],
  ['icon-512.png', 512, 22, 0.6],
  // Full bleed, smaller glyph: Android masks this one to whatever shape it likes.
  ['icon-maskable-512.png', 512, 0, 0.46],
  // iOS applies its own rounding, so this is square too.
  ['apple-touch-icon.png', 180, 0, 0.58],
]

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

if (!existsSync(executablePath)) {
  console.error(`No Chromium at ${executablePath}. Set PLAYWRIGHT_CHROMIUM to one.`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })

for (const [file, size, radius, inset] of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  await page.setContent(tile(size, radius, inset), { waitUntil: 'load' })
  await page.screenshot({ path: resolve(OUT, file), omitBackground: true })
  await page.close()
  console.log(`wrote public/${file}`)
}

await browser.close()
