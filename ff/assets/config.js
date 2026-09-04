/* Deployment config. Edit this file, not the app.

   claudeProxy: URL of the Worker that holds the shared API key. When set, every
   visitor gets the Claude features without supplying a key of their own; the key
   lives only as a Cloudflare secret. Blank it out to fall back to per-user keys.

   build: bumped on every deploy, and must match the ?v= stamp on the script tags.
   GitHub Pages serves HTML with max-age=600, so a browser that already has the
   page keeps running it — and the version stamps inside that HTML are stale too,
   which makes them useless exactly when they matter. The app re-fetches this file
   past the cache on load and offers a reload when the two disagree. */
globalThis.DRAFTLINE_CONFIG = {
  claudeProxy: "https://draftline-api.ken-lince.workers.dev",
  build: "20260904p"
};
