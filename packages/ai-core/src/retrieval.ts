import { embed, type EmbeddingModel } from 'ai'
import { sql } from 'drizzle-orm'
import type { AnyDatabase } from '@haazir/db'

export interface Hit {
  id: string
  content: string
  sourceId: string
  metadata: Record<string, unknown>
  /** Cosine similarity to the question, 0..1. */
  similarity: number
}

export interface RetrievedChunk extends Hit {
  /** Reciprocal-rank-fusion score: higher is better. */
  score: number
}

export interface RetrieveOptions {
  /** Candidates from each search. */
  perSearch?: number
  /** Chunks passed to the answer. */
  top?: number
  /** Below this cosine similarity a chunk is noise, however it ranked. */
  minSimilarity?: number
}

const RRF_K = 60

/**
 * Reciprocal rank fusion (spec §11.1): each list contributes 1/(60 + rank), so
 * a chunk found by both meaning and words beats one found by either alone,
 * and neither search's raw scores need to be comparable.
 */
export function fuse(vectorHits: Hit[], textHits: Hit[], { top = 5, minSimilarity = 0.25 } = {}) {
  const byId = new Map<string, RetrievedChunk>()
  for (const list of [vectorHits, textHits]) {
    list.forEach((hit, rank) => {
      const existing = byId.get(hit.id)
      const add = 1 / (RRF_K + rank + 1)
      if (existing) existing.score += add
      else byId.set(hit.id, { ...hit, score: add })
    })
  }
  return [...byId.values()]
    .filter((c) => c.similarity >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
}

/**
 * Words for an OR full-text query: letters, digits and combining marks only
 * (Hindi vowel signs are marks), so user text can't inject tsquery syntax.
 */
export function textQueryTerms(question: string): string[] {
  const words = question.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []
  return [...new Set(words.filter((w) => w.length > 1))].slice(0, 20)
}

export const toVectorLiteral = (values: number[]) => `[${values.join(',')}]`

/**
 * Hybrid retrieval over one org's knowledge: pgvector cosine top-k plus
 * Postgres full-text top-k, fused, thresholded. Business facts (fees, dates,
 * seats) never come from here; those come from tools reading the database.
 */
export async function retrieve(
  db: AnyDatabase,
  embeddingModel: EmbeddingModel,
  orgId: string,
  question: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const perSearch = options.perSearch ?? 8
  const { embedding } = await embed({ model: embeddingModel, value: question, maxRetries: 1 })
  const vec = toVectorLiteral(embedding)

  const vectorRows = rowsOf<RawHit>(
    await db.execute(sql`
    select id, content, source_id, metadata, 1 - (embedding <=> ${vec}::vector) as similarity
    from knowledge_chunks
    where org_id = ${orgId}
    order by embedding <=> ${vec}::vector
    limit ${perSearch}`),
  )

  const terms = textQueryTerms(question)
  const textRows = terms.length
    ? rowsOf<RawHit>(
        await db.execute(sql`
        select id, content, source_id, metadata, 1 - (embedding <=> ${vec}::vector) as similarity
        from knowledge_chunks, to_tsquery('simple', ${terms.join(' | ')}) as q
        where org_id = ${orgId} and tsv @@ q
        order by ts_rank_cd(tsv, q) desc
        limit ${perSearch}`),
      )
    : []

  return fuse(vectorRows.map(toHit), textRows.map(toHit), options)
}

// node-postgres and PGlite both return { rows }; the generic database type can't say so.
const rowsOf = <T>(result: unknown) => (result as { rows: T[] }).rows

type RawHit = {
  id: string
  content: string
  source_id: string
  metadata: Record<string, unknown>
  similarity: number | string
}

const toHit = (r: RawHit): Hit => ({
  id: r.id,
  content: r.content,
  sourceId: r.source_id,
  metadata: r.metadata ?? {},
  similarity: Number(r.similarity),
})
