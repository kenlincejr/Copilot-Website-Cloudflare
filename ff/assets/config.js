/* Deployment config. Edit this file, not the app.
   claudeProxy: URL of the Worker that holds the shared API key. When set, every
   visitor gets the Claude features without supplying a key of their own; the key
   lives only as a Cloudflare secret. Blank it out to fall back to per-user keys. */
globalThis.DRAFTLINE_CONFIG = {
  claudeProxy: "https://draftline-api.ken-lince.workers.dev"
};
