import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './AppShell'
import { MORE_NAV, PRIMARY_NAV } from './nav'

// Every screen is its own chunk (§14.11: < 250 KB gzip on first load), so a
// phone opening the inbox never downloads the campaign builder.
const placeholder =
  (navKey: string): RouteObject['lazy'] =>
  async () => {
    const { PlaceholderPage } = await import('@/features/placeholder/PlaceholderPage')
    return { Component: () => <PlaceholderPage navKey={navKey} /> }
  }

const screens: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('@/features/home/HomePage')).default }),
  },
  // Screens later phases build; each replaces its placeholder.
  {
    path: 'settings',
    lazy: async () => ({ Component: (await import('@/features/settings/SettingsPage')).default }),
  },
  ...[...PRIMARY_NAV.slice(1), ...MORE_NAV.flat()]
    .filter((item) => item.key !== 'settings')
    .map((item) => ({
      path: item.to.slice(1),
      lazy: placeholder(item.key),
    })),
  {
    path: '*',
    lazy: async () => ({
      Component: (await import('@/features/placeholder/NotFoundPage')).default,
    }),
  },
]

const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    hydrateFallbackElement: <ShellFallback />,
    children: screens,
  },
]

// The component gallery ships in development builds only (§14.9).
if (import.meta.env.DEV) {
  routes.unshift({
    path: '/dev/components',
    hydrateFallbackElement: <ShellFallback />,
    lazy: async () => ({ Component: (await import('@/features/dev/ComponentsPage')).default }),
  })
}

export const router = createBrowserRouter(routes)

/** Shown for the split second before the first screen's chunk arrives. */
function ShellFallback() {
  return <div className="min-h-dvh bg-paper" aria-busy="true" />
}
