/* summit-usage: anonymous usage counts for the Executive Summit guide
   (https://copilotplaybook.com/executive-summit.html).

   POST /u   body: {"did":"<random phone id>","mode":"app|browser","events":[{kind,label,n}, ...]}
             Sent with navigator.sendBeacon (text/plain, so no CORS preflight). Up to 20 events a request.
   GET  /a   active announcements for the banner: {"alerts":[{id,ts,level,body}]}. Posted with tools/summit-announce.py.
   POST /announce  {pin, did, action:'post'|'clear', text, level, hours, id}. The PIN is the Worker secret ANNOUNCE_PIN, checked here
             (never in the page). Wrong guesses are counted per connection, per device and globally, and lock out for 15 minutes.
   POST /f   session feedback: {did,session,title,rating,a1,a2,followup,note,name,company,contact}. One row per device
             and session; sending again updates it. Name, company and contact are kept only when followup is true.

   GET  /p   attendee conversation profiles: {"profiles":{"<person id>":{topics:[up to 3],linkedin,ts}}}. Written by attendees about themselves.
   POST /p   {did, pid, token, action:'save'|'remove', topics:[up to 3 short strings], linkedin}. The first phone to save for a person id claims it
             (the Worker keeps only a hash of the phone's secret token); later saves must present the same token. Reset a claim with tools/summit-profiles.py.

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

const PID = /^[a-z0-9-]{3,40}$/, TOKEN = /^[a-z0-9]{16,48}$/, LINKEDIN = /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[\w%.À-ɏ-]{2,100}\/?$/i;
const line = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function cleanProfile(b) {
  if (!b || typeof b !== 'object') return null;
  const did = typeof b.did === 'string' && /^[a-z0-9]{8,32}$/.test(b.did) ? b.did : null;
  const pid = typeof b.pid === 'string' && PID.test(b.pid) ? b.pid : null;
  const token = typeof b.token === 'string' && TOKEN.test(b.token) ? b.token : null;
  if (!did || !pid || !token) return null;
  if (b.action === 'remove') return { did, pid, token, remove: true };
  const topics = (Array.isArray(b.topics) ? b.topics : []).map((t) => line(t, 90)).filter(Boolean).slice(0, 3);
  let linkedin = line(b.linkedin, 160);
  if (linkedin && !/^https?:\/\//i.test(linkedin)) linkedin = 'https://' + linkedin;
  if (linkedin && !LINKEDIN.test(linkedin)) return { error: 'bad-linkedin' };
  linkedin = linkedin ? linkedin.replace(/^http:/i, 'https:') : '';
  if (!topics.length && !linkedin) return { error: 'empty' };
  return { did, pid, token, topics, linkedin };
}

const enc = new TextEncoder();
async function shortHash(s) { const d = await crypto.subtle.digest('SHA-256', enc.encode('summit|' + s)); return [...new Uint8Array(d)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join(''); }
function safeEqual(a, b) { // constant-time comparison
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = enc.encode(a), y = enc.encode(b); let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}
// The whole resort shares one connection, so the per-connection limit is generous; the device limit is what stops casual guessing.
const LOCK_MS = 15 * 60 * 1000, LIMITS = { ip: 25, did: 5, global: 60 };

async function handleAnnounce(body, request, env, origin) {
  const h = cors(origin), json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...h, 'Content-Type': 'application/json' } });
  if (!env.ANNOUNCE_PIN) return json(503, { error: 'not-configured' });
  const did = typeof body.did === 'string' && /^[a-z0-9]{8,32}$/.test(body.did) ? body.did : 'none';
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const keys = [['ip', 'ip:' + await shortHash(ip)], ['did', 'did:' + did], ['global', 'global']];
  const now = Date.now();
  const rows = await env.DB.prepare('SELECT key, fails, first_ts, until FROM summit_lockout WHERE key IN (?, ?, ?)').bind(...keys.map((k) => k[1])).all();
  const byKey = Object.fromEntries((rows.results || []).map((r) => [r.key, r]));
  if (keys.some(([, k]) => byKey[k] && byKey[k].until > now)) return json(429, { error: 'locked' });
  if (!safeEqual(String(body.pin || ''), String(env.ANNOUNCE_PIN))) {
    for (const [kind, k] of keys) {
      const r = byKey[k]; const fresh = !r || now - r.first_ts > LOCK_MS;
      const fails = fresh ? 1 : r.fails + 1, first = fresh ? now : r.first_ts, until = fails >= LIMITS[kind] ? now + LOCK_MS : 0;
      await env.DB.prepare('INSERT INTO summit_lockout (key, fails, first_ts, until) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET fails = excluded.fails, first_ts = excluded.first_ts, until = excluded.until').bind(k, fails, first, until).run();
    }
    return json(401, { error: 'wrong-pin' });
  }
  await env.DB.prepare('DELETE FROM summit_lockout WHERE key IN (?, ?)').bind(keys[0][1], keys[1][1]).run();
  if (body.action === 'clear') {
    if (body.id === 'all') await env.DB.prepare('UPDATE summit_alerts SET active = 0 WHERE active = 1').run();
    else if (Number.isInteger(body.id)) await env.DB.prepare('UPDATE summit_alerts SET active = 0 WHERE id = ?').bind(body.id).run();
    else return json(400, { error: 'bad-request' });
    return json(200, { ok: true });
  }
  const text = typeof body.text === 'string' ? body.text.replace(/[\u0000-\u001f]/g, ' ').trim() : '';
  if (!text || text.length > 280) return json(400, { error: 'bad-text' });
  const level = body.level === 'urgent' ? 'urgent' : 'info';
  const hours = Math.min(48, Math.max(1, Number(body.hours) || 24));
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM summit_alerts WHERE ts > ?').bind(now - 60 * 1000).first();
  if (recent && recent.n >= 3) return json(429, { error: 'slow-down' });
  const res = await env.DB.prepare('INSERT INTO summit_alerts (ts, level, body, until, active) VALUES (?, ?, ?, ?, 1)').bind(now, level, text, now + hours * 3600 * 1000).run();
  return json(200, { ok: true, id: res.meta && res.meta.last_row_id });
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
    if (request.method === 'GET' && url.pathname === '/p') {
      const { results } = await env.DB.prepare('SELECT pid, ts, t1, t2, t3, linkedin FROM summit_profiles').all();
      const profiles = {};
      for (const r of results || []) profiles[r.pid] = { topics: [r.t1, r.t2, r.t3].filter(Boolean), linkedin: r.linkedin || '', ts: r.ts };
      return new Response(JSON.stringify({ profiles }), { status: 200, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (request.method !== 'POST' || !['/u', '/f', '/announce', '/p'].includes(url.pathname)) return new Response(null, { status: 404, headers: cors(origin) });
    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors(origin) });
      body = JSON.parse(text);
    } catch (err) {
      return new Response(null, { status: 400, headers: cors(origin) });
    }
    if (url.pathname === '/announce') return handleAnnounce(body, request, env, origin);
    if (url.pathname === '/p') {
      const h = cors(origin), reply = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...h, 'Content-Type': 'application/json' } });
      const pr = cleanProfile(body);
      if (!pr) return reply(400, { error: 'bad-request' });
      if (pr.error) return reply(400, { error: pr.error });
      const hash = await shortHash('profile|' + pr.token);
      const row = await env.DB.prepare('SELECT token_hash FROM summit_profiles WHERE pid = ?').bind(pr.pid).first();
      if (row && row.token_hash && !safeEqual(row.token_hash, hash)) return reply(403, { error: 'claimed' });   // an empty hash means the claim was reset
      if (pr.remove) { if (row) await env.DB.prepare('DELETE FROM summit_profiles WHERE pid = ?').bind(pr.pid).run(); return reply(200, { ok: true }); }
      if (!row) {
        const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM summit_profiles').first();
        if (n && n.n >= 120) return reply(429, { error: 'full' });
      }
      await env.DB.prepare('INSERT INTO summit_profiles (pid, token_hash, ts, t1, t2, t3, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(pid) DO UPDATE SET token_hash = excluded.token_hash, ts = excluded.ts, t1 = excluded.t1, t2 = excluded.t2, t3 = excluded.t3, linkedin = excluded.linkedin')
        .bind(pr.pid, hash, Date.now(), pr.topics[0] || null, pr.topics[1] || null, pr.topics[2] || null, pr.linkedin || null).run();
      return reply(200, { ok: true });
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
