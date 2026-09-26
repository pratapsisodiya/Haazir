/**
 * Splits documents into ~500-token chunks with ~50 tokens of overlap, keeping
 * the nearest heading with each chunk (spec §12). Token counts are estimates:
 * good enough for sizing, no tokenizer dependency.
 */

export interface Chunk {
  content: string
  heading?: string
  page?: number
}

/** Roughly 4 characters per token for Latin text, 2 for Devanagari. */
export function estimateTokens(text: string): number {
  const deva = text.match(/[ऀ-ॿ]/g)?.length ?? 0
  return Math.ceil(deva / 2 + (text.length - deva) / 4)
}

const isHeading = (line: string) =>
  /^#{1,6}\s/.test(line) ||
  (line.length <= 60 && /[:：]$/.test(line)) ||
  (line.length <= 50 && line.length >= 3 && line === line.toUpperCase() && /[A-Z]/.test(line))

function splitLong(paragraph: string, maxTokens: number): string[] {
  const sentences = paragraph.split(/(?<=[.!?।])\s+/)
  const out: string[] = []
  let current = ''
  for (const s of sentences) {
    const next = current ? `${current} ${s}` : s
    if (estimateTokens(next) > maxTokens && current) {
      out.push(current)
      current = s
    } else {
      current = next
    }
  }
  if (current) out.push(current)
  // A single enormous "sentence" (tables, lists without punctuation): hard split.
  return out.flatMap((part) => {
    if (estimateTokens(part) <= maxTokens * 1.5) return [part]
    const size = maxTokens * 3
    return Array.from({ length: Math.ceil(part.length / size) }, (_, i) =>
      part.slice(i * size, (i + 1) * size),
    )
  })
}

function tail(text: string, tokens: number): string {
  const words = text.split(/\s+/)
  let acc = ''
  for (let i = words.length - 1; i >= 0; i--) {
    const next = `${words[i]} ${acc}`.trim()
    if (estimateTokens(next) > tokens) break
    acc = next
  }
  return acc
}

export function chunkText(
  text: string,
  {
    maxTokens = 500,
    overlapTokens = 50,
    page,
  }: { maxTokens?: number; overlapTokens?: number; page?: number } = {},
): Chunk[] {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)

  const chunks: Chunk[] = []
  let heading: string | undefined
  let current = ''
  let currentHeading: string | undefined

  const flush = () => {
    if (current.trim()) chunks.push({ content: current.trim(), heading: currentHeading, page })
  }

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length === 1 && isHeading(lines[0]!)) {
      heading = lines[0]!.replace(/^#+\s*/, '').replace(/[:：]$/, '')
      continue
    }
    for (const part of splitLong(block, maxTokens)) {
      const next = current ? `${current}\n\n${part}` : part
      if (estimateTokens(next) > maxTokens && current) {
        flush()
        const overlap = tail(current, overlapTokens)
        current = overlap ? `${overlap}\n\n${part}` : part
        currentHeading = heading
      } else {
        if (!current) currentHeading = heading
        current = next
      }
    }
  }
  flush()
  return chunks
}

/** An FAQ is already the right size: one chunk each, the question as heading. */
export function faqChunk(question: string, answer: string): Chunk {
  return { content: `Q: ${question.trim()}\nA: ${answer.trim()}`, heading: question.trim() }
}
