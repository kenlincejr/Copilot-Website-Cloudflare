/* summit-usage: anonymous usage counts for the Executive Summit guide
   (https://copilotplaybook.com/executive-summit.html).

   POST /u   body: {"did":"<random phone id>","mode":"app|browser","events":[{kind,label,n}, ...]}
             Sent with navigator.sendBeacon (text/plain, so no CORS preflight). Up to 20 events a request.
   GET  /a   active announcements for the banner: {"alerts":[{id,ts,level,body}]}. Posted with tools/summit-announce.py.
   POST /f   session feedback: {did,session,title,rating,a1,a2,followup,note,name,company,contact}. One row per device
             and session; sending again updates it. Name, company and contact are kept only when followup is true.

   Privacy: no names, contact details, IP address or user agent are stored. `did` is a random
   id the phone generates for itself, used only to count unique devices. Only requests whose
   Origin is the site itself are accepted. */

const ORIGINS = new Set(['https://copilotplaybook.com', 'https://www.copilotplaybook.com']);
const KINDS = new Set(['open', 'view', 'pin', 'day', 'map_tab', 'card_made', 'card_shown', 'call', 'mail', 'refresh', 'weather']);
const MODES = new Set(['app', 'browser']);
const MAX_EVENTS = 20;
const MAX_BODY = 8 * 1024;

const cors = (origin) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
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

const txt = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const sessionKey = (v) => (typeof v === 'string' && /^[\w .:+'’&-]{1,80}$/.test(v.trim()) ? v.trim() : null);

export function cleanFeedback(b, now) {
  if (!b || typeof b !== 'object') return null;
  const did = typeof b.did === 'string' && /^[a-z0-9]{8,32}$/.test(b.did) ? b.did : null;
  const session = sessionKey(b.session);
  const rating = Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5 ? b.rating : null;
  if (!did || !session || !rating) return null;
  const followup = b.followup === true ? 1 : 0;
  return {
    ts: now, did, session, rating, followup,
    title: txt(b.title, 140), a1: txt(b.a1, 800), a2: txt(b.a2, 800),
    note: followup ? txt(b.note, 800) : null,
    name: followup ? txt(b.name, 80) : null,
    company: followup ? txt(b.company, 80) : null,
    contact: followup ? txt(b.contact, 120) : null,
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (!ORIGINS.has(origin)) return new Response(null, { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'GET' && url.pathname === '/a') {
      const { results } = await env.DB.prepare('SELECT id, ts, level, body FROM summit_alerts WHERE active = 1 AND (until IS NULL OR until > ?) ORDER BY id DESC LIMIT 5').bind(Date.now()).all();
      return new Response(JSON.stringify({ alerts: results || [] }), { status: 200, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (request.method !== 'POST' || (url.pathname !== '/u' && url.pathname !== '/f')) return new Response(null, { status: 404, headers: cors(origin) });
    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors(origin) });
      body = JSON.parse(text);
    } catch (err) {
      return new Response(null, { status: 400, headers: cors(origin) });
    }
    if (url.pathname === '/f') {
      const fb = cleanFeedback(body, Date.now());
      if (!fb) return new Response(null, { status: 400, headers: cors(origin) });
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM summit_feedback WHERE did = ?').bind(fb.did).first();
      if (n && n.n >= 40) return new Response(null, { status: 429, headers: cors(origin) });
      await env.DB.prepare('INSERT INTO summit_feedback (ts, did, session, title, rating, a1, a2, followup, note, name, company, contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(did, session) DO UPDATE SET ts = excluded.ts, title = excluded.title, rating = excluded.rating, a1 = excluded.a1, a2 = excluded.a2, followup = excluded.followup, note = excluded.note, name = excluded.name, company = excluded.company, contact = excluded.contact')
        .bind(fb.ts, fb.did, fb.session, fb.title, fb.rating, fb.a1, fb.a2, fb.followup, fb.note, fb.name, fb.company, fb.contact).run();
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    const rows = clean(body, Date.now());
    if (rows.length) {
      const stmt = env.DB.prepare('INSERT INTO summit_events (ts, did, kind, label, n, mode) VALUES (?, ?, ?, ?, ?, ?)');
      await env.DB.batch(rows.map((r) => stmt.bind(r.ts, r.did, r.kind, r.label, r.n, r.mode)));
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  },
};
