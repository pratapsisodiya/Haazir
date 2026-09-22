/**
 * Post-build: turns the single-page bundle into one real static page per
 * outreach variant — dist/jewellers/index.html, dist/clinics/index.html, and
 * so on.
 *
 * Why not client-side routing: a link pasted into WhatsApp is read by a crawler
 * that never runs JavaScript. It sees only the HTML it was served. So each
 * variant needs its own file carrying its own <title>, description and og:image,
 * or every link previews identically and the personalisation is invisible in the
 * one place it matters most.
 *
 * The JS bundle is shared and unchanged — it reads the path at runtime
 * (src/lib/campaign.js) and renders the matching copy.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEGMENTS } from '../src/lib/segments.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')

const SITE = process.env.SITE_URL ?? 'https://haazir-pink.vercel.app'

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8')

/** Replaces the content of a single meta/link tag, matched on its identifying attribute. */
function setTag(source, attr, name, content) {
  const re = new RegExp(`(<(?:meta|link)\\s+[^>]*${attr}="${name}"[^>]*?(?:content|href)=")[^"]*(")`)
  if (!re.test(source)) {
    throw new Error(`pages.mjs: no tag with ${attr}="${name}" in dist/index.html`)
  }
  return source.replace(re, `$1${content}$2`)
}

for (const segment of SEGMENTS) {
  const url = `${SITE}/${segment.slug}`
  const title = `haazir — WhatsApp agents for ${segment.name}`
  const description = segment.subhead

  let page = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"[\s\S]*?content=")[\s\S]*?(")/, `$1${description}$2`)

  page = setTag(page, 'rel', 'canonical', url)
  page = setTag(page, 'property', 'og:url', url)
  page = setTag(page, 'property', 'og:title', title)
  page = setTag(page, 'property', 'og:description', description)
  page = setTag(page, 'property', 'og:image', `${SITE}/og-${segment.slug}.png`)
  page = setTag(page, 'name', 'twitter:title', title)
  page = setTag(page, 'name', 'twitter:description', description)
  page = setTag(page, 'name', 'twitter:image', `${SITE}/og-${segment.slug}.png`)

  mkdirSync(resolve(DIST, segment.slug), { recursive: true })
  writeFileSync(resolve(DIST, segment.slug, 'index.html'), page)
  console.log(`wrote dist/${segment.slug}/index.html`)
}
