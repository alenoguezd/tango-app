// Minimal service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Don't intercept requests, just pass through
  // Clone the request first to avoid "body already used" error
  const request = event.request.clone ? event.request.clone() : event.request;
  event.respondWith(fetch(request));
});
