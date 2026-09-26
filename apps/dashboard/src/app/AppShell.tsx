import { BellIcon, DotsThreeCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router'
import { IconButton } from '@/components/Button'
import { Wordmark } from '@/components/Jharokha'
import { LanguageToggle, ThemeToggle } from '@/components/LanguageToggle'
import { Sheet } from '@/components/Sheet'
import { cn } from '@/lib/cn'
import { MORE_NAV, PRIMARY_NAV, type NavItem } from './nav'

/**
 * Phones and tablets (< 1024px): top bar + five bottom tabs, with "Aur" opening
 * a sheet. Desktop: a 240px sidebar with the same groups (§15).
 */
export function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <TopBar />
        <main id="main" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
        <BottomTabs />
      </div>
    </div>
  )
}

function TopBar() {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper pr-2 pl-4 lg:hidden">
      {/* The org name and branch switcher replace the wordmark once login lands (Phase 3). */}
      <Wordmark />
      <IconButton label={t('shell.notifications')}>
        <BellIcon />
      </IconButton>
    </header>
  )
}

function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-surface lg:flex">
      <div className="flex h-16 items-center justify-between pr-2 pl-5">
        <Wordmark />
        <IconButton label={t('shell.notifications')}>
          <BellIcon />
        </IconButton>
      </div>
      <nav aria-label={t('nav.main')} className="flex-1 overflow-y-auto pb-4">
        {[PRIMARY_NAV, ...MORE_NAV].map((group, i) => (
          <ul
            key={i}
            className={cn(
              'py-1',
              i > 0 &&
                'relative mt-1 pt-1 before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-rule',
            )}
          >
            {group.map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} />
              </li>
            ))}
          </ul>
        ))}
      </nav>
      {/* Language is one tap away everywhere; theme lives in Settings on desktop. */}
      <div className="border-t border-rule p-5">
        <LanguageToggle />
      </div>
    </aside>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const Glyph = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'relative flex h-11 items-center gap-3 px-5 text-body transition-colors duration-150',
          isActive
            ? 'bg-madder-50 font-semibold text-madder-700'
            : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* The madder binding strip marks where you are (§14.5). */}
          {isActive && <span className="absolute inset-y-0 left-0 w-1 bg-madder-700" aria-hidden />}
          <Glyph className="size-6 shrink-0" weight={isActive ? 'fill' : 'regular'} aria-hidden />
          {t(`nav.${item.key}`)}
        </>
      )}
    </NavLink>
  )
}

function BottomTabs() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const inMore = MORE_NAV.flat().some((item) => pathname.startsWith(item.to))

  return (
    <>
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'} className={tabClass}>
                {({ isActive }) => <TabContent item={item} active={isActive} />}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={tabClass({ isActive: inMore })}
            >
              <DotsThreeCircleIcon
                className="size-6"
                weight={inMore ? 'fill' : 'regular'}
                aria-hidden
              />
              {t('nav.more')}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title={t('shell.moreTitle')}
        closeLabel={t('shell.close')}
      >
        <nav aria-label={t('shell.moreTitle')}>
          {MORE_NAV.map((group, i) => (
            <ul
              key={i}
              className={cn(
                'py-1',
                i > 0 &&
                  'relative mt-1 pt-1 before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-rule',
              )}
            >
              {group.map((item) => (
                <li key={item.to}>
                  <MoreLink item={item} onNavigate={() => setMoreOpen(false)} />
                </li>
              ))}
            </ul>
          ))}
        </nav>
        <div className="flex flex-col gap-4 border-t border-rule p-5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Sheet>
    </>
  )
}

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex h-full w-full flex-col items-center justify-center gap-0.5 text-small transition-colors duration-150',
    isActive ? 'font-semibold text-madder-700' : 'text-ink-muted',
  )
}

function TabContent({ item, active }: { item: NavItem; active: boolean }) {
  const { t } = useTranslation()
  const Glyph = item.icon
  return (
    <>
      <Glyph className="size-6" weight={active ? 'fill' : 'regular'} aria-hidden />
      {t(`nav.${item.key}`)}
    </>
  )
}

function MoreLink({ item, onNavigate }: { item: NavItem; onNavigate(): void }) {
  const { t } = useTranslation()
  const Glyph = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex h-13 items-center gap-3 px-5 text-body',
          isActive ? 'bg-madder-50 font-semibold text-madder-700' : 'text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-0 left-0 w-1 bg-madder-700" aria-hidden />}
          <Glyph className="size-6 shrink-0" weight={isActive ? 'fill' : 'regular'} aria-hidden />
          {t(`nav.${item.key}`)}
        </>
      )}
    </NavLink>
  )
}
