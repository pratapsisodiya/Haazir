import { extractText, getDocumentProxy } from 'unpdf'

/** Text of each page of a PDF (brochures), page numbers kept for citations. */
export async function pdfPages(data: Uint8Array): Promise<{ page: number; text: string }[]> {
  const pdf = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: false })
  return (text as string[]).map((t, i) => ({ page: i + 1, text: t })).filter((p) => p.text.trim())
}
