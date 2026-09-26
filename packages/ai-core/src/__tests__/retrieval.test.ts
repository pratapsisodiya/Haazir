import { describe, expect, it } from 'vitest'
import { fuse, textQueryTerms, type Hit } from '../retrieval'

const hit = (id: string, similarity: number): Hit => ({
  id,
  content: id,
  sourceId: 's',
  metadata: {},
  similarity,
})

describe('fuse (reciprocal rank fusion)', () => {
  it('puts chunks found by both searches first', () => {
    const vector = [hit('a', 0.8), hit('b', 0.7), hit('c', 0.6)]
    const text = [hit('c', 0.6), hit('d', 0.5)]
    const ids = fuse(vector, text).map((c) => c.id)
    expect(ids.slice(0, 2)).toEqual(['c', 'a'])
    expect(ids.slice(2).sort()).toEqual(['b', 'd']) // equal rank in one list each: a tie
  })

  it('drops chunks below the similarity threshold however they ranked', () => {
    expect(fuse([hit('a', 0.9), hit('noise', 0.1)], [hit('noise', 0.1)]).map((c) => c.id)).toEqual([
      'a',
    ])
  })

  it('keeps the top N', () => {
    const many = Array.from({ length: 8 }, (_, i) => hit(`v${i}`, 0.9))
    expect(fuse(many, [])).toHaveLength(5)
  })
})

describe('textQueryTerms', () => {
  it('keeps words and digits only, so user text cannot inject query syntax', () => {
    expect(textQueryTerms("RS-CIT ki fees! & | ' :* kya?")).toEqual([
      'rs',
      'cit',
      'ki',
      'fees',
      'kya',
    ])
    expect(textQueryTerms('फीस कितनी है')).toEqual(['फीस', 'कितनी', 'है'])
  })
})
