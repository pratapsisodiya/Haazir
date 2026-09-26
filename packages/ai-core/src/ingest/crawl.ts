import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import * as cheerio from 'cheerio'
import robotsParser from 'robots-parser'

export const CRAWLER_USER_AGENT = 'HaazirBot/1.0 (+https://haazir-pink.vercel.app)'
const MAX_BYTES = 2 * 1024 * 1024

export interface CrawledPage {
  url: string
  title: string
  text: string
}

/**
 * Owners type in their website URL, and this server fetches it: without a
 * check, "http://169.254.169.254/" would read the cloud's metadata service.
 * Only public addresses are fetched, after DNS resolution.
 */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase()
    if (v6 === '::1' || v6 === '::') return true
    if (v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80')) return true
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return mapped ? isPrivateAddress(mapped[1]!) : false
  }
  const [a = 0, b = 0] = ip.split('.').map(Number)
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  )
}

export type Resolver = (host: string) => Promise<string[]>
const dnsResolver: Resolver = async (host) =>
  (await lookup(host, { all: true })).map((a) => a.address)

export async function assertPublicUrl(raw: string, resolve: Resolver = dnsResolver): Promise<URL> {
  const url = new URL(raw)
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('Only http(s) links can be read')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [host] : await resolve(host)
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new Error(`${url.hostname} is not a public website`)
  }
  return url
}

/** Readable text of one HTML page: no scripts, menus or footers. */
export function extractPage(html: string, url: string): CrawledPage & { links: string[] } {
  const $ = cheerio.load(html)
  const title = $('title').first().text().trim() || $('h1').first().text().trim() || url
  const links = $('a[href]')
    .map((_, a) => $(a).attr('href'))
    .get()
  $('script, style, noscript, nav, footer, header, form, svg, iframe').remove()
  const blocks = $('main').length ? $('main') : $('body')
  // Headings and paragraphs on their own lines, so the chunker sees structure.
  blocks.find('h1, h2, h3, h4, p, li, tr, br, div').each((_, el) => {
    $(el).append('\n\n')
  })
  const text = blocks
    .text()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*(\n\s*)+/g, '\n\n')
    .trim()
  return { url, title, text, links }
}

/**
 * Reads an institute's website (spec §12): same domain only, at most 20
 * pages, obeying robots.txt, public addresses only, HTML only.
 */
export async function crawlSite(
  start: string,
  {
    maxPages = 20,
    fetchImpl = globalThis.fetch,
    resolve = dnsResolver,
  }: { maxPages?: number; fetchImpl?: typeof fetch; resolve?: Resolver } = {},
): Promise<CrawledPage[]> {
  const origin = (await assertPublicUrl(start, resolve)).origin
  const robotsUrl = `${origin}/robots.txt`
  const robotsText = await fetchImpl(robotsUrl, {
    headers: { 'user-agent': CRAWLER_USER_AGENT },
    signal: AbortSignal.timeout(8_000),
  })
    .then((r) => (r.ok ? r.text() : ''))
    .catch(() => '')
  const robots = robotsParser(robotsUrl, robotsText)

  const queue = [new URL(start).href.split('#')[0]!]
  const seen = new Set(queue)
  const pages: CrawledPage[] = []

  while (queue.length && pages.length < maxPages) {
    const url = queue.shift()!
    if (robots.isAllowed(url, CRAWLER_USER_AGENT) === false) continue
    try {
      await assertPublicUrl(url, resolve)
      const res = await fetchImpl(url, {
        headers: { 'user-agent': CRAWLER_USER_AGENT, accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) continue
      if (new URL(res.url || url).origin !== origin) continue // redirected off-site
      const html = (await res.text()).slice(0, MAX_BYTES)
      const page = extractPage(html, url)
      if (page.text.length > 50) pages.push({ url, title: page.title, text: page.text })
      for (const href of page.links) {
        try {
          const next = new URL(href, url)
          next.hash = ''
          if (
            next.origin === origin &&
            !seen.has(next.href) &&
            !/\.(pdf|jpe?g|png|gif|zip|mp4|docx?)$/i.test(next.pathname)
          ) {
            seen.add(next.href)
            queue.push(next.href)
          }
        } catch {
          /* not a URL */
        }
      }
    } catch {
      /* one bad page doesn't stop the crawl */
    }
  }
  return pages
}
