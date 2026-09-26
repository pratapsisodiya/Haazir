/**
 * Teach the bot from the command line (Phase 2; the "Bot ko sikhayein" screen
 * arrives in Phase 3). Works on the org in WHATSAPP_ORG_SLUG.
 *
 *   pnpm knowledge:add faq "Parking hai?" "Haan, two-wheeler ke liye."
 *   pnpm knowledge:add text notes.txt --title "Institute ke niyam"
 *   pnpm knowledge:add pdf brochure.pdf
 *   pnpm knowledge:add url https://example-institute.in
 *   pnpm knowledge:reindex          # queue every source that isn't ready
 *   pnpm knowledge:reindex --all    # re-embed everything (after changing EMBEDDING_MODEL)
 *   pnpm knowledge:list
 *
 * Add --now to ingest here instead of queueing it for the worker.
 */
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { Queue } from 'bullmq'
import { and, eq, ne } from 'drizzle-orm'
import { createModels, ingestSource } from '@haazir/ai-core'
import { createDb, knowledgeFaqs, knowledgeSources, organizations } from '@haazir/db'
import type { IngestJob } from '@haazir/messaging'
import { JOB_OPTIONS, QUEUES } from '@haazir/shared'
import { loadEnv } from '@haazir/shared/env'
import { createStorage } from '@haazir/storage'

const env = loadEnv()
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { title: { type: 'string' }, now: { type: 'boolean' }, all: { type: 'boolean' } },
})
const [command, kind, ...rest] = positionals
// File paths are relative to where the command was typed, not to apps/worker.
const fromCwd = (file: string) => resolve(env.INIT_CWD ?? process.cwd(), file)

const { db, close } = createDb(env.DATABASE_URL, { max: 2 })
const [org] = await db
  .select()
  .from(organizations)
  .where(eq(organizations.slug, env.WHATSAPP_ORG_SLUG))
if (!org) {
  console.error(`No org "${env.WHATSAPP_ORG_SLUG}". Run pnpm db:seed first.`)
  process.exit(1)
}

async function dispatch(sourceIds: string[]) {
  if (values.now) {
    const models = createModels(env)
    const storage = createStorage(env)
    for (const id of sourceIds) {
      const result = await ingestSource(
        { db, embedding: models.embedding, readFile: async (key) => (await storage.get(key)).body },
        org!.id,
        id,
      )
      console.log(`  ${id}: ${result.chunks} chunks`)
    }
    return
  }
  const queue = new Queue<IngestJob>(QUEUES.ingest, {
    connection: { url: env.REDIS_URL },
    defaultJobOptions: JOB_OPTIONS.ingest,
  })
  for (const id of sourceIds) await queue.add('ingest', { orgId: org!.id, sourceId: id })
  await queue.close()
  console.log(`Queued ${sourceIds.length} source(s); the worker will embed them.`)
}

try {
  if (command === 'add') {
    let sourceId: string
    if (kind === 'faq') {
      const [question, answer] = rest
      if (!question || !answer) throw new Error('Usage: knowledge:add faq "question" "answer"')
      const title = values.title ?? 'Sawaal-Jawab'
      let [source] = await db
        .select()
        .from(knowledgeSources)
        .where(
          and(
            eq(knowledgeSources.orgId, org.id),
            eq(knowledgeSources.type, 'faq'),
            eq(knowledgeSources.title, title),
          ),
        )
      source ??= (
        await db.insert(knowledgeSources).values({ orgId: org.id, type: 'faq', title }).returning()
      )[0]!
      await db
        .insert(knowledgeFaqs)
        .values({ orgId: org.id, sourceId: source.id, question, answer })
      sourceId = source.id
    } else if (kind === 'text') {
      const file = rest[0]
      if (!file) throw new Error('Usage: knowledge:add text <file.txt> [--title T]')
      const [source] = await db
        .insert(knowledgeSources)
        .values({
          orgId: org.id,
          type: 'text',
          title: values.title ?? basename(file),
          textContent: await readFile(fromCwd(file), 'utf8'),
        })
        .returning()
      sourceId = source!.id
    } else if (kind === 'pdf') {
      const file = rest[0]
      if (!file) throw new Error('Usage: knowledge:add pdf <file.pdf> [--title T]')
      const [source] = await db
        .insert(knowledgeSources)
        .values({ orgId: org.id, type: 'pdf', title: values.title ?? basename(file) })
        .returning()
      const key = `orgs/${org.id}/knowledge/${source!.id}.pdf`
      await createStorage(env).put(key, await readFile(fromCwd(file)), 'application/pdf')
      await db
        .update(knowledgeSources)
        .set({ fileKey: key })
        .where(eq(knowledgeSources.id, source!.id))
      sourceId = source!.id
    } else if (kind === 'url') {
      const url = rest[0]
      if (!url) throw new Error('Usage: knowledge:add url <https://…>')
      const [source] = await db
        .insert(knowledgeSources)
        .values({ orgId: org.id, type: 'url', title: values.title ?? new URL(url).hostname, url })
        .returning()
      sourceId = source!.id
    } else {
      throw new Error('knowledge:add faq|text|pdf|url …')
    }
    console.log(`Added ${kind} source ${sourceId}.`)
    await dispatch([sourceId])
  } else if (command === 'reindex') {
    const sources = await db
      .select({ id: knowledgeSources.id })
      .from(knowledgeSources)
      .where(
        values.all
          ? eq(knowledgeSources.orgId, org.id)
          : and(eq(knowledgeSources.orgId, org.id), ne(knowledgeSources.status, 'ready')),
      )
    await dispatch(sources.map((s) => s.id))
  } else if (command === 'list') {
    const sources = await db
      .select()
      .from(knowledgeSources)
      .where(eq(knowledgeSources.orgId, org.id))
    for (const s of sources) {
      console.log(
        `${s.status.padEnd(10)} ${s.type.padEnd(4)} ${String(s.chunkCount).padStart(4)} chunks  ${s.title}${s.error ? `  (${s.error})` : ''}`,
      )
    }
  } else {
    console.log(
      'pnpm knowledge:add faq|text|pdf|url …  |  pnpm knowledge:reindex [--all]  |  pnpm knowledge:list',
    )
  }
} catch (err) {
  console.error((err as Error).message)
  process.exitCode = 1
} finally {
  await close()
}
