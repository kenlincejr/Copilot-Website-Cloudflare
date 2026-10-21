/* summit-usage: anonymous usage counts for the Executive Summit guide
   (https://copilotplaybook.com/executive-summit.html).

   POST /u   body: {"did":"<random phone id>","mode":"app|browser","events":[{kind,label,n}, ...]}
             Sent with navigator.sendBeacon (text/plain, so no CORS preflight). Up to 20 events a request.

   Privacy: no names, contact details, IP address or user agent are stored. `did` is a random
   id the phone generates for itself, used only to count unique devices. Only requests whose
   Origin is the site itself are accepted. */

const ORIGINS = new Set(['https://copilotplaybook.com', 'https://www.copilotplaybook.com']);
const KINDS = new Set(['open', 'view', 'pin', 'day', 'map_tab', 'card_made', 'card_shown', 'call', 'mail', 'refresh', 'weather']);
const MODES = new Set(['app', 'browser']);
const MAX_EVENTS = 20;
const MAX_BODY = 8 * 1024;

const cors = (origin) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
const label = (v) => (typeof v === 'string' && /^[\w .:+'’-]{1,40}$/.test(v.trim()) ? v.trim() : null);
const int = (v) => (Number.isInteger(v) && v >= 0 && v <= 100000 ? v : null);

export function clean(body, now) {
  if (!body || typeof body !== 'object') return [];
  const did = typeof body.did === 'string' && /^[a-z0-9]{8,32}$/.test(body.did) ? body.did : null;
  if (!did) return [];
  const mode = MODES.has(body.mode) ? body.mode : null;
  return (Array.isArray(body.events) ? body.events : []).slice(0, MAX_EVENTS)
    .filter((e) => e && typeof e === 'object' && KINDS.has(e.kind))
    .map((e) => ({ ts: now, did, kind: e.kind, label: label(e.label), n: int(e.n), mode }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (!ORIGINS.has(origin)) return new Response(null, { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST' || url.pathname !== '/u') return new Response(null, { status: 404, headers: cors(origin) });
    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors(origin) });
      body = JSON.parse(text);
    } catch (err) {
      return new Response(null, { status: 400, headers: cors(origin) });
    }
    const rows = clean(body, Date.now());
    if (rows.length) {
      const stmt = env.DB.prepare('INSERT INTO summit_events (ts, did, kind, label, n, mode) VALUES (?, ?, ?, ?, ?, ?)');
      await env.DB.batch(rows.map((r) => stmt.bind(r.ts, r.did, r.kind, r.label, r.n, r.mode)));
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  },
};
