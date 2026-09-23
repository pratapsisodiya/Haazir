/**
 * Minimal service worker. Two jobs: make the site installable as an app, and
 * let it open with no signal — useful when you're showing it to someone inside
 * a showroom with two bars.
 *
 * The cautious part is the strategy. A service worker that serves HTML from
 * cache can pin a stale page on someone's phone permanently, which would be far
 * worse than having no worker at all. So:
 *
 *   - Navigations are network-first. A deploy is picked up on the next load;
 *     the cache is only a fallback for when the network is gone.
 *   - /assets/* is content-hashed by Vite, so those filenames never change
 *     meaning. Only those are cache-first.
 *   - Nothing else is intercepted; fonts and images go straight to the network.
 *
 * Bump VERSION to evict everything on the next visit.
 */
const VERSION = 'haazir-v1'

self.addEventListener('install', () => {
  // Take over as soon as possible rather than waiting for every tab to close.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Leave cross-origin alone — Google Fonts has its own caching, and we do not
  // want to be responsible for anyone else's freshness.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (fresh.ok) {
            const cache = await caches.open(VERSION)
            cache.put(request, fresh.clone())
          }
          return fresh
        } catch {
          // Offline: this page if we have it, otherwise the home page, other-
          // wise let the browser show its own error.
          return (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error()
        }
      })(),
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached

        const fresh = await fetch(request)
        if (fresh.ok) {
          const cache = await caches.open(VERSION)
          cache.put(request, fresh.clone())
        }
        return fresh
      })(),
    )
  }
})
