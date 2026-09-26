import { CalendarPlusIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Input } from '@/components/Input'
import { LedgerCard } from '@/components/LedgerCard'
import { StatusPill } from '@/components/StatusPill'
import { cn } from '@/lib/cn'

const html = (node: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>)

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    expect(html(<Button>Save</Button>)).toContain('type="button"')
  })

  it('blocks repeat taps while loading and says so to screen readers', () => {
    const out = html(<Button loading>Sending</Button>)
    expect(out).toContain('disabled=""')
    expect(out).toContain('aria-busy="true"')
    expect(out).toContain('Sending')
  })

  it('is at least 44px tall at every size', () => {
    for (const size of ['md', 'lg', 'responsive'] as const) {
      expect(html(<Button size={size}>x</Button>)).toMatch(/\bh-1[12]\b/)
    }
  })

  it('renders icons at 20px', () => {
    expect(
      html(
        <Button>
          <CalendarPlusIcon /> Book
        </Button>,
      ),
    ).toContain('[&amp;_svg]:size-5')
  })
})

describe('Input', () => {
  it('connects the label, and the error, to the field', () => {
    const out = html(<Input id="fee" label="Fee" error="Fee must be more than 0" />)
    expect(out).toContain('for="fee"')
    expect(out).toContain('aria-invalid="true"')
    expect(out).toContain('aria-describedby="fee-note"')
    expect(out).toContain('id="fee-note"')
  })
})

describe('StatusPill', () => {
  it('always pairs colour with an icon and a label', () => {
    for (const tone of ['success', 'attention', 'danger', 'neutral', 'bot', 'human'] as const) {
      const out = html(<StatusPill tone={tone}>Label</StatusPill>)
      expect(out).toContain('<svg')
      expect(out).toContain('Label')
    }
  })
})

describe('LedgerCard', () => {
  it('writes money in Indian format and gives screen readers the final figure', () => {
    const out = html(
      <LedgerCard
        title="Aaj ka hisaab"
        rows={[{ label: 'Fees mili', value: 1_850_000, kind: 'money' }]}
      />,
    )
    expect(out).toContain('<span class="sr-only">₹18,500</span>')
    expect(out).toContain('ledger-rules')
  })

  it('makes rows with a destination tappable', () => {
    expect(
      html(<LedgerCard title="t" rows={[{ label: 'Leads', value: 3, to: '/leads' }]} />),
    ).toContain('href="/leads"')
  })
})

describe('EmptyState', () => {
  it('frames the icon in the jharokha arch', () => {
    const out = html(<EmptyState icon={UsersThreeIcon} title="No leads yet" body="…" />)
    expect(out).toContain('clip-path:url(#jharokha-arch)')
    expect(out).toContain('<h2')
  })
})

describe('cn', () => {
  it('keeps a custom text size and a text colour together', () => {
    expect(cn('text-small text-ink')).toBe('text-small text-ink')
    expect(cn('text-body', 'text-small')).toBe('text-small')
  })
})
