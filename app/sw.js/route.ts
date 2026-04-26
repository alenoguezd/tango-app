const appVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.npm_package_version ||
  "development";

const serviceWorker = `
const APP_VERSION = ${JSON.stringify(appVersion)};
const CACHE_PREFIX = "tango-";

self.addEventListener("install", () => {
  // Keep updates user-controlled so studying sessions are not interrupted.
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.__TANGO_APP_VERSION__ = APP_VERSION;
`;

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(serviceWorker, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
    },
  });
}
