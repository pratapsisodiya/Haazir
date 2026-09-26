import { embedMany, type EmbeddingModel } from 'ai'
import { buffer } from 'node:stream/consumers'
import { and, eq } from 'drizzle-orm'
import { knowledgeChunks, knowledgeFaqs, knowledgeSources, type AnyDatabase } from '@haazir/db'
import { chunkText, faqChunk, type Chunk } from './chunk'
import { crawlSite } from './crawl'
import { pdfPages } from './pdf'

export interface IngestDeps {
  db: AnyDatabase
  embedding: EmbeddingModel
  /** Reads uploaded files (PDF brochures) from storage. */
  readFile(key: string): Promise<NodeJS.ReadableStream>
  fetch?: typeof fetch
}

const EMBED_BATCH = 64

/**
 * Turns one knowledge source into searchable chunks (spec §12): extract,
 * chunk, embed in batches, then swap the source's chunks in one transaction,
 * so the bot never sees a half-ingested source. Re-running is safe.
 */
export async function ingestSource(deps: IngestDeps, orgId: string, sourceId: string) {
  const [source] = await deps.db
    .select()
    .from(knowledgeSources)
    .where(and(eq(knowledgeSources.id, sourceId), eq(knowledgeSources.orgId, orgId)))
  if (!source) throw new Error(`Knowledge source ${sourceId} not found`)

  await deps.db
    .update(knowledgeSources)
    .set({ status: 'processing', error: null })
    .where(eq(knowledgeSources.id, sourceId))

  try {
    const chunks = await chunksFor(deps, source)
    if (!chunks.length) throw new Error('No readable text found')

    const embeddings: number[][] = []
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const result = await embedMany({
        model: deps.embedding,
        // The heading travels with the text: "Fees: ₹4,500" means more than "₹4,500".
        values: batch.map((c) => (c.heading ? `${c.heading}\n${c.content}` : c.content)),
        maxRetries: 2,
      })
      embeddings.push(...result.embeddings)
    }

    await deps.db.transaction(async (tx) => {
      await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, sourceId))
      await tx.insert(knowledgeChunks).values(
        chunks.map((c, i) => ({
          orgId,
          sourceId,
          content:
            c.heading && !c.content.startsWith('Q:') ? `${c.heading}\n${c.content}` : c.content,
          embedding: embeddings[i]!,
          metadata: {
            ...(c.heading ? { heading: c.heading } : {}),
            ...(c.page ? { page: c.page } : {}),
            ...(source.url ? { url: source.url } : {}),
          },
        })),
      )
      await tx
        .update(knowledgeSources)
        .set({ status: 'ready', chunkCount: chunks.length, error: null })
        .where(eq(knowledgeSources.id, sourceId))
    })
    return { chunks: chunks.length }
  } catch (err) {
    await deps.db
      .update(knowledgeSources)
      .set({ status: 'failed', error: (err as Error).message.slice(0, 500) })
      .where(eq(knowledgeSources.id, sourceId))
    throw err
  }
}

async function chunksFor(
  deps: IngestDeps,
  source: typeof knowledgeSources.$inferSelect,
): Promise<Chunk[]> {
  switch (source.type) {
    case 'faq': {
      const faqs = await deps.db
        .select()
        .from(knowledgeFaqs)
        .where(eq(knowledgeFaqs.sourceId, source.id))
      return faqs.map((f) => faqChunk(f.question, f.answer))
    }
    case 'text':
      return chunkText(source.textContent ?? '')
    case 'pdf': {
      if (!source.fileKey) throw new Error('PDF source has no file')
      const data = new Uint8Array(await buffer(await deps.readFile(source.fileKey)))
      return (await pdfPages(data)).flatMap((p) => chunkText(p.text, { page: p.page }))
    }
    case 'url': {
      if (!source.url) throw new Error('URL source has no link')
      const pages = await crawlSite(source.url, { fetchImpl: deps.fetch })
      return pages.flatMap((p) =>
        chunkText(p.text).map((c) => ({ ...c, heading: c.heading ?? p.title })),
      )
    }
  }
}
