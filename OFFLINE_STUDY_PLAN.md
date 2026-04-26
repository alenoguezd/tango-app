# Offline Study Plan

This app should support offline studying later, but the first PWA step should keep app updates reliable and avoid caching dynamic pages or API responses.

## Future Data Model

Use IndexedDB as the local source for offline study data:

- downloaded decks and cards
- active study session state
- review answers created offline
- a sync queue for Supabase updates once the device is online again

## Sync Direction

Keep Supabase as the server source of truth. When the app comes back online, replay queued review events in creation order and refresh the local deck/progress snapshots after the queue is accepted.

## Service Worker Role

The service worker should stay focused on app lifecycle and a minimal static shell. It should not cache route HTML, React Server Component payloads, API routes, Supabase requests, or auth responses.

Offline study behavior should come from explicit IndexedDB reads and writes inside the app, not from broad network interception.
