/**
 * The test box (spec §12) on the command line: ask the bot something and see
 * its answer, what it understood, which tools and documents it used, and
 * whether the guardrails objected. Nothing is sent to WhatsApp.
 *
 *   pnpm bot:ask "RSCIT ki fees kitni hai bhaiya"
 *   pnpm bot:ask "RS-CIT की फीस कितनी है?"
 */
import { and, eq, inArray } from 'drizzle-orm'
import { createModels, decideReply } from '@haazir/ai-core'
import {
  contacts,
  conversations,
  createDb,
  knowledgeChunks,
  messages,
  organizations,
  whatsappAccounts,
} from '@haazir/db'
import { loadEnv } from '@haazir/shared/env'

const env = loadEnv()
const question = process.argv.slice(2).join(' ').trim()
if (!question) {
  console.error('Usage: pnpm bot:ask "your question"')
  process.exit(1)
}

const { db, close } = createDb(env.DATABASE_URL, { max: 2 })
try {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, env.WHATSAPP_ORG_SLUG))
  const [account] = org
    ? await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.orgId, org.id))
    : []
  if (!org || !account) throw new Error('Run pnpm db:seed and pnpm whatsapp:connect first.')

  // A private playground contact: its history makes follow-up questions work.
  await db
    .insert(contacts)
    .values({ orgId: org.id, waId: 'playground', profileName: 'Playground' })
    .onConflictDoNothing()
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.orgId, org.id), eq(contacts.waId, 'playground')))
  await db
    .insert(conversations)
    .values({ orgId: org.id, contactId: contact!.id, whatsappAccountId: account.id })
    .onConflictDoNothing()
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.orgId, org.id), eq(conversations.contactId, contact!.id)))
  const [message] = await db
    .insert(messages)
    .values({
      orgId: org.id,
      conversationId: conversation!.id,
      direction: 'in',
      type: 'text',
      body: question,
    })
    .returning()

  const decision = await decideReply(
    { db, models: createModels(env), now: () => new Date() },
    { orgId: org.id, conversationId: conversation!.id, messageId: message!.id },
  )

  console.log(
    `\n${decision.kind.toUpperCase()}${'reason' in decision ? ` (${decision.reason})` : ''}`,
  )
  if ('content' in decision) {
    console.log(`\n${decision.content.body}`)
    if (decision.content.kind === 'buttons')
      console.log(decision.content.buttons.map((b) => `[ ${b.title} ]`).join(' '))
    // Keep the bot's side of the playground conversation for follow-ups.
    await db.insert(messages).values({
      orgId: org.id,
      conversationId: conversation!.id,
      direction: 'out',
      type: 'text',
      body: decision.content.body,
      sentBy: 'bot',
      status: 'read',
    })
  }
  if ('trace' in decision) {
    const t = decision.trace
    console.log(`\nUnderstood: ${t.intent} · ${t.language} · confidence ${t.confidence}`)
    console.log(`Tools: ${t.toolCalls.map((c) => c.name).join(', ') || 'none'}`)
    if (t.retrievedChunkIds.length) {
      const chunks = await db
        .select()
        .from(knowledgeChunks)
        .where(inArray(knowledgeChunks.id, t.retrievedChunkIds))
      console.log('Sources used:')
      for (const c of chunks) console.log(`  - ${c.content.replace(/\s+/g, ' ').slice(0, 90)}`)
    }
    if (t.guardrailFlags.length) console.log(`Guardrails: ${t.guardrailFlags.join(', ')}`)
    console.log(
      `${t.latencyMs} ms · ${t.inputTokens} in / ${t.outputTokens} out tokens · ${t.model}\n`,
    )
  }
} catch (err) {
  console.error((err as Error).message)
  process.exitCode = 1
} finally {
  await close()
}
