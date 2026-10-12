/* playbook-search-log: anonymous site-search analytics for copilotplaybook.com
   (specs/site-search-v2.spec.md F11, decision D7).

   POST /e   body: {"events":[{kind, q, filter, n, url, rank, page}, ...]}
             Sent by assets/site-search.js with navigator.sendBeacon (text/plain,
             so no CORS preflight). Up to 20 events per request.
   Cron      daily: deletes rows older than 90 days.

   Privacy: nothing about the client is stored. No IP, user agent, cookies or
   identifiers; query text is capped at 200 characters. Only requests whose
   Origin is the site itself are accepted. */

const ORIGINS = new Set(['https://copilotplaybook.com', 'https://www.copilotplaybook.com']);
const SITE = 'https://copilotplaybook.com/';
const KINDS = new Set(['search', 'zero', 'click', 'answer', 'vote', 'ask_page']);
const FILTERS = new Set(['all', 'playbook', 'engagement', 'tool', 'customer-zero', 'program']);
const MAX_EVENTS = 20;
const MAX_BODY = 16 * 1024;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const sitePath = (v) => {
  const s = str(v, 300);
  return s && s.startsWith(SITE) ? s : null;
};

// Returns a clean row, or null to drop the event.
export function clean(e, now) {
  if (!e || typeof e !== 'object' || !KINDS.has(e.kind)) return null;
  const filter = typeof e.filter === 'string' && FILTERS.has(e.filter) ? e.filter : null;
  return {
    ts: now,
    kind: e.kind,
    q: str(e.q, 200),
    filter,
    n: int(e.n, 0, 100),
    url: sitePath(e.url),
    rank: int(e.rank, 1, 50),
    page: sitePath(e.page),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (!ORIGINS.has(origin)) return new Response(null, { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST' || url.pathname !== '/e') return new Response(null, { status: 404, headers: cors(origin) });

    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return new Response(null, { status: 413, headers: cors(origin) });
    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors(origin) });
      body = JSON.parse(text);
    } catch (err) {
      return new Response(null, { status: 400, headers: cors(origin) });
    }
    const now = Date.now();
    const rows = (Array.isArray(body && body.events) ? body.events : []).slice(0, MAX_EVENTS)
      .map((e) => clean(e, now)).filter(Boolean);
    if (rows.length) {
      const stmt = env.DB.prepare('INSERT INTO events (ts, kind, q, filter, n, url, rank, page) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      await env.DB.batch(rows.map((r) => stmt.bind(r.ts, r.kind, r.q, r.filter, r.n, r.url, r.rank, r.page)));
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  },

  async scheduled(controller, env) {
    await env.DB.prepare('DELETE FROM events WHERE ts < ?').bind(Date.now() - RETENTION_MS).run();
  },
};
