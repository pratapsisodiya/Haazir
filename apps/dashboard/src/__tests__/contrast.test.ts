import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * §14.2: "Contrast AA minimum for all text (check with a script in CI for
 * token pairs)." Reads the real tokens.css, so changing a colour that breaks
 * contrast fails the build.
 */
const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

function tokensIn(block: string) {
  const out: Record<string, string> = {}
  for (const [, name, hex] of block.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)) {
    out[name!] = hex!.toLowerCase()
  }
  return out
}

const blockAfter = (marker: string) => {
  const start = css.indexOf(marker)
  return css.slice(start, css.indexOf('}', start))
}

const light = tokensIn(blockAfter('@theme'))
const dark = tokensIn(blockAfter("[data-theme='dark'] {"))

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** `bg-danger-600/10` over a background, as the browser composites it. */
function mix(fg: string, bg: string, alpha: number) {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16)
  return (
    '#' +
    [1, 3, 5]
      .map((i) => Math.round(ch(fg, i) * alpha + ch(bg, i) * (1 - alpha)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

// [text, background, minimum]. 4.5 for body text, 3 for UI boundaries (focus).
type Pair = [string, string | ((t: Record<string, string>) => string), number]
const PAIRS: Pair[] = [
  ['ink', 'paper', 4.5],
  ['ink', 'surface', 4.5],
  ['ink-muted', 'paper', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['madder-700', 'surface', 4.5], // active nav, links
  ['madder-700', 'madder-50', 4.5], // active nav item, "Aap" pill
  ['paper', 'madder-700', 4.5], // primary button
  ['paper', 'danger-600', 4.5], // danger button
  ['pottery-600', 'pottery-50', 4.5], // paid / bot pill
  ['pottery-600', 'surface', 4.5],
  ['ink', 'marigold-50', 4.5], // due pill (text is ink; marigold is the icon)
  ['ink', 'madder-50', 4.5], // outbound chat bubble
  ['danger-600', 'surface', 4.5], // input error text
  ['danger-600', (t) => mix(t['danger-600']!, t.surface!, 0.1), 4.5], // overdue pill
  ['focus', 'paper', 3],
  ['focus', 'surface', 3],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (_name, tokens) => {
  it('defines every colour token', () => {
    expect(Object.keys(tokens)).toEqual(
      expect.arrayContaining(['ink', 'paper', 'madder-700', 'focus']),
    )
    expect(Object.keys(tokens).length).toBeGreaterThanOrEqual(14)
  })

  it.each(
    PAIRS.map(([fg, bg, min]) => [fg, typeof bg === 'string' ? bg : 'tinted', min, bg] as const),
  )('%s on %s meets %s:1', (fg, _label, min, bg) => {
    const background = typeof bg === 'string' ? tokens[bg]! : bg(tokens)
    const ratio = contrast(tokens[fg]!, background)
    expect(
      ratio,
      `${fg} ${tokens[fg]} on ${background} = ${ratio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(min)
  })
})
