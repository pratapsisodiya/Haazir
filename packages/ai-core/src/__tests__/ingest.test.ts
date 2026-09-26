import { Readable } from 'node:stream'
import { eq } from 'drizzle-orm'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { knowledgeChunks, knowledgeSources } from '@haazir/db'
import { chunkText, estimateTokens, faqChunk } from '../ingest/chunk'
import { assertPublicUrl, crawlSite, extractPage, isPrivateAddress } from '../ingest/crawl'
import { ingestSource } from '../ingest/ingest'
import { pdfPages } from '../ingest/pdf'
import { retrieve } from '../retrieval'
import { createTranscriber } from '../stt'
import { createFixture, hashEmbedding } from './helpers'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('chunkText', () => {
  it('keeps short documents whole, with their heading', () => {
    const chunks = chunkText(
      'Fees aur kishtein:\n\nRS-CIT ki fees ek baar mein.\n\nTally ki do kishton mein.',
    )
    expect(chunks).toEqual([
      {
        content: 'RS-CIT ki fees ek baar mein.\n\nTally ki do kishton mein.',
        heading: 'Fees aur kishtein',
        page: undefined,
      },
    ])
  })

  it('splits long text near 500 tokens, overlapping about 50', () => {
    const para = (i: number) =>
      `Paragraph ${i}. ` + 'Computer training ke baare mein jaankari. '.repeat(20)
    const chunks = chunkText(Array.from({ length: 12 }, (_, i) => para(i)).join('\n\n'))
    expect(chunks.length).toBeGreaterThan(2)
    for (const c of chunks) expect(estimateTokens(c.content)).toBeLessThanOrEqual(560)
    // The start of each chunk repeats the end of the previous one.
    const lastWords = chunks[0]!.content.split(/\s+/).slice(-5).join(' ')
    expect(chunks[1]!.content).toContain(lastWords)
  })

  it('counts Devanagari as denser than Latin', () => {
    expect(estimateTokens('फीस कितनी है')).toBeGreaterThan(estimateTokens('fees kitni h'))
  })

  it('makes one chunk per FAQ', () => {
    expect(faqChunk(' Parking hai? ', ' Haan, two-wheeler ke liye. ')).toEqual({
      content: 'Q: Parking hai?\nA: Haan, two-wheeler ke liye.',
      heading: 'Parking hai?',
    })
  })
})

describe('website reading safety', () => {
  it('knows private and internal addresses', () => {
    for (const ip of [
      '127.0.0.1',
      '10.0.0.5',
      '172.16.3.4',
      '192.168.1.1',
      '169.254.169.254',
      '::1',
      'fd00::1',
      '::ffff:10.0.0.1',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true)
    }
    for (const ip of ['8.8.8.8', '103.21.244.1', '2606:4700::1111'])
      expect(isPrivateAddress(ip), ip).toBe(false)
  })

  it('refuses links to the cloud metadata service or localhost, and non-http schemes', async () => {
    await expect(assertPublicUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
      /not a public website/,
    )
    await expect(
      assertPublicUrl('http://localhost:4000', async () => ['127.0.0.1']),
    ).rejects.toThrow()
    await expect(assertPublicUrl('file:///etc/passwd')).rejects.toThrow(/Only http/)
  })
})

describe('crawlSite', () => {
  const page = (body: string, links: string[] = []) =>
    new HttpResponse(
      `<html><head><title>Shiksha</title><script>var x=1</script></head><body><nav>Menu</nav><main><h1>${body}</h1><p>${body} ke baare mein poori jaankari yahan milegi.</p>${links.map((l) => `<a href="${l}">x</a>`).join('')}</main><footer>© 2026</footer></body></html>`,
      { headers: { 'content-type': 'text/html' } },
    )

  it('reads same-site pages, obeys robots.txt, skips other sites and files', async () => {
    server.use(
      http.get(
        'https://shiksha.test/robots.txt',
        () => new HttpResponse('User-agent: *\nDisallow: /admin'),
      ),
      http.get('https://shiksha.test/', () =>
        page('Home', ['/courses', '/admin/secret', 'https://other.test/x', '/brochure.pdf']),
      ),
      http.get('https://shiksha.test/courses', () => page('Courses', ['/'])),
    )
    const pages = await crawlSite('https://shiksha.test/', {
      resolve: async () => ['93.184.216.34'],
    })
    expect(pages.map((p) => p.url)).toEqual([
      'https://shiksha.test/',
      'https://shiksha.test/courses',
    ])
    expect(pages[0]!.text).toContain('Home ke baare mein')
    expect(pages[0]!.text).not.toContain('var x')
    expect(pages[0]!.text).not.toContain('Menu')
  })

  it('stops at the page limit', async () => {
    server.use(
      http.get('https://big.test/robots.txt', () => new HttpResponse(null, { status: 404 })),
      http.get('https://big.test/*', ({ request }) => {
        const n = Number(new URL(request.url).pathname.slice(1) || 0)
        return page(`Page ${n}`, [`/${n + 1}`, `/${n + 2}`])
      }),
    )
    const pages = await crawlSite('https://big.test/0', {
      maxPages: 5,
      resolve: async () => ['93.184.216.34'],
    })
    expect(pages).toHaveLength(5)
  })

  it('extracts readable text with structure', () => {
    const { text, title } = extractPage(
      '<title>T</title><body><h2>Fees</h2><p>RS-CIT ₹4,500</p></body>',
      'u',
    )
    expect(title).toBe('T')
    expect(text).toMatch(/Fees\s*\n+\s*RS-CIT ₹4,500/)
  })
})

/** The smallest valid PDF with one line of text, built by hand so the test needs no fixture file. */
function tinyPdf(text: string) {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    (() => {
      const stream = `BT /F1 12 Tf 20 100 Td (${text}) Tj ET`
      return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    })(),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

describe('pdfPages', () => {
  it('reads the text of each page', async () => {
    const pages = await pdfPages(tinyPdf('Python + AI: 4 mahine ka course'))
    expect(pages).toEqual([
      { page: 1, text: expect.stringContaining('Python + AI: 4 mahine ka course') },
    ])
  })
})

describe('ingestSource', () => {
  it('embeds the seeded FAQs into searchable chunks, and retrieval finds the right one', async () => {
    const f = await createFixture()
    try {
      const [faq] = await f.db
        .select()
        .from(knowledgeSources)
        .where(eq(knowledgeSources.type, 'faq'))
      const deps = { db: f.db, embedding: hashEmbedding(), readFile: async () => Readable.from([]) }
      expect(await ingestSource(deps, f.org.id, faq!.id)).toEqual({ chunks: 11 })

      const [source] = await f.db
        .select()
        .from(knowledgeSources)
        .where(eq(knowledgeSources.id, faq!.id))
      expect(source).toMatchObject({ status: 'ready', chunkCount: 11 })

      const hits = await retrieve(
        f.db,
        hashEmbedding(),
        f.org.id,
        'admission ke liye kaunse documents chahiye',
      )
      expect(hits[0]?.content).toContain('Aadhaar card')

      // Re-ingesting replaces, never duplicates.
      await ingestSource(deps, f.org.id, faq!.id)
      expect(await f.db.$count(knowledgeChunks, eq(knowledgeChunks.sourceId, faq!.id))).toBe(11)
    } finally {
      await f.close()
    }
  })

  it('marks a source failed with a readable reason', async () => {
    const f = await createFixture()
    try {
      const [src] = await f.db
        .insert(knowledgeSources)
        .values({ orgId: f.org.id, type: 'text', title: 'empty', textContent: '   ' })
        .returning()
      const deps = { db: f.db, embedding: hashEmbedding(), readFile: async () => Readable.from([]) }
      await expect(ingestSource(deps, f.org.id, src!.id)).rejects.toThrow('No readable text found')
      const [after] = await f.db
        .select()
        .from(knowledgeSources)
        .where(eq(knowledgeSources.id, src!.id))
      expect(after).toMatchObject({ status: 'failed', error: 'No readable text found' })
    } finally {
      await f.close()
    }
  })

  it("won't ingest another org's source", async () => {
    const f = await createFixture()
    try {
      const [faq] = await f.db.select().from(knowledgeSources)
      const deps = { db: f.db, embedding: hashEmbedding(), readFile: async () => Readable.from([]) }
      await expect(
        ingestSource(deps, '00000000-0000-0000-0000-000000000000', faq!.id),
      ).rejects.toThrow(/not found/)
    } finally {
      await f.close()
    }
  })
})

describe('speech to text', () => {
  it('is off without a key, rather than failing later', () => {
    expect(createTranscriber({ STT_PROVIDER: 'openai' })).toBeNull()
    expect(createTranscriber({ STT_PROVIDER: 'sarvam' })).toBeNull()
  })

  it('calls Sarvam the way its official SDK does', async () => {
    let seen: { key: string | null; form: FormData } | undefined
    server.use(
      http.post('https://api.sarvam.ai/speech-to-text', async ({ request }) => {
        seen = { key: request.headers.get('api-subscription-key'), form: await request.formData() }
        return HttpResponse.json({
          transcript: 'आरएससीआईटी की फीस कितनी है',
          language_code: 'hi-IN',
        })
      }),
    )
    const stt = createTranscriber({ STT_PROVIDER: 'sarvam', SARVAM_API_KEY: 'sk_test' })!
    const result = await stt.transcribe(
      new Uint8Array([79, 103, 103, 83]),
      'audio/ogg; codecs=opus',
    )
    expect(result).toEqual({ text: 'आरएससीआईटी की फीस कितनी है', language: 'hi-IN' })
    expect(seen?.key).toBe('sk_test')
    expect(seen?.form.get('model')).toBe('saaras:v3')
    expect(seen?.form.get('mode')).toBe('transcribe')
    expect(seen?.form.get('language_code')).toBe('unknown')
    expect((seen?.form.get('file') as File).name).toBe('voice.ogg')
  })
})
