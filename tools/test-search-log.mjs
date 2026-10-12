/* tools/test-search-log.mjs
   Suite for workers/search-log (spec F11, D7): origin lock, payload limits,
   field cleaning, privacy (nothing about the client is stored), retention.
   Runs the Worker module directly against an in-memory D1 stand-in.

     node tools/test-search-log.mjs
*/
import worker, { clean } from '../workers/search-log/src/index.js';

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL: ' + msg); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

function fakeDB() {
  const db = { rows: [], deletes: [] };
  db.prepare = (sql) => ({
    sql,
    bind: (...args) => ({ sql, args, run: async () => { if (/^DELETE/.test(sql)) db.deletes.push(args); return {}; } }),
  });
  db.batch = async (stmts) => { stmts.forEach((s) => db.rows.push(s.args)); return []; };
  return db;
}
const req = (opts) => new Request('https://playbook-search-log.example.workers.dev' + (opts.path || '/e'), {
  method: opts.method || 'POST',
  headers: Object.assign({ 'Content-Type': 'text/plain' }, opts.origin === null ? {} : { Origin: opts.origin || 'https://copilotplaybook.com' }, opts.headers || {}),
  body: opts.method === 'OPTIONS' || opts.method === 'GET' ? undefined : (opts.body !== undefined ? opts.body : JSON.stringify({ events: opts.events || [] })),
});

// ── clean() ──
const now = 1791800000000;
eq(clean({ kind: 'search', q: '  cowork  ', filter: 'tool', n: 6, page: 'https://copilotplaybook.com/' }, now),
  { ts: now, kind: 'search', q: 'cowork', filter: 'tool', n: 6, url: null, rank: null, page: 'https://copilotplaybook.com/' }, 'clean keeps a valid search');
ok(clean({ kind: 'hack' }, now) === null, 'unknown kind dropped');
ok(clean(null, now) === null && clean('x', now) === null && clean([], now) === null, 'non-objects dropped');
ok(clean({ kind: 'search', q: 'x'.repeat(500) }, now).q.length === 200, 'query capped at 200 characters');
ok(clean({ kind: 'search', q: '   ' }, now).q === null, 'blank query stored as null');
ok(clean({ kind: 'search', q: 7 }, now).q === null, 'non-string query stored as null');
ok(clean({ kind: 'search', filter: 'evil' }, now).filter === null, 'unknown filter dropped');
['all', 'playbook', 'engagement', 'tool', 'customer-zero', 'program'].forEach((f) => ok(clean({ kind: 'search', filter: f }, now).filter === f, 'filter allowed: ' + f));
ok(clean({ kind: 'click', url: 'https://evil.example/x' }, now).url === null, 'off-site url dropped');
ok(clean({ kind: 'click', url: 'javascript:alert(1)' }, now).url === null, 'javascript url dropped');
ok(clean({ kind: 'click', url: 'https://copilotplaybook.com.evil.example/' }, now).url === null, 'look-alike host dropped');
ok(clean({ kind: 'click', url: 'https://copilotplaybook.com/cowork.html?hl=x' }, now).url === 'https://copilotplaybook.com/cowork.html?hl=x', 'site url kept');
ok(clean({ kind: 'click', rank: 0 }, now).rank === null && clean({ kind: 'click', rank: 51 }, now).rank === null && clean({ kind: 'click', rank: 2.5 }, now).rank === null, 'rank bounds and integers');
ok(clean({ kind: 'click', rank: 3 }, now).rank === 3, 'rank kept');
ok(clean({ kind: 'search', n: -1 }, now).n === null && clean({ kind: 'search', n: 101 }, now).n === null, 'n bounds');
['search', 'zero', 'click', 'answer', 'vote', 'ask_page'].forEach((k) => ok(clean({ kind: k }, now) !== null, 'kind allowed: ' + k));
const extra = clean({ kind: 'search', ip: '1.2.3.4', ua: 'x', email: 'a@b.c' }, now);
eq(Object.keys(extra).sort(), ['filter', 'kind', 'n', 'page', 'q', 'rank', 'ts', 'url'], 'only the fixed columns survive (privacy)');

// ── fetch() ──
const env = { DB: fakeDB() };
let r = await worker.fetch(req({ origin: 'https://evil.example', events: [{ kind: 'search', q: 'a' }] }), env);
ok(r.status === 403 && env.DB.rows.length === 0, 'foreign origin rejected, nothing stored');
r = await worker.fetch(req({ origin: null, events: [{ kind: 'search', q: 'a' }] }), env);
ok(r.status === 403 && env.DB.rows.length === 0, 'missing origin rejected');
r = await worker.fetch(req({ method: 'OPTIONS' }), env);
ok(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === 'https://copilotplaybook.com', 'preflight answered for the site');
r = await worker.fetch(req({ origin: 'https://www.copilotplaybook.com', events: [{ kind: 'search', q: 'www' }] }), env);
ok(r.status === 204 && env.DB.rows.length === 1, 'www origin accepted');
r = await worker.fetch(req({ method: 'GET' }), env);
ok(r.status === 404, 'GET is 404');
r = await worker.fetch(req({ path: '/other' }), env);
ok(r.status === 404, 'other path is 404');
r = await worker.fetch(req({ body: '{not json' }), env);
ok(r.status === 400, 'bad JSON is 400');
r = await worker.fetch(req({ body: 'x'.repeat(17 * 1024) }), env);
ok(r.status === 413, 'oversized body is 413');
const before = env.DB.rows.length;
r = await worker.fetch(req({ events: Array.from({ length: 50 }, (_, i) => ({ kind: 'search', q: 'q' + i })) }), env);
ok(r.status === 204 && env.DB.rows.length - before === 20, 'at most 20 events stored per request');
const b2 = env.DB.rows.length;
r = await worker.fetch(req({ events: [{ kind: 'nope' }, { kind: 'zero', q: 'missing topic', n: 0 }] }), env);
ok(env.DB.rows.length - b2 === 1, 'invalid events dropped, valid ones kept');
const last = env.DB.rows[env.DB.rows.length - 1];
eq(last.slice(1), ['zero', 'missing topic', null, 0, null, null, null], 'row column order matches the INSERT');
ok(typeof last[0] === 'number' && last[0] > 1.7e12, 'server timestamp in milliseconds');
r = await worker.fetch(req({ body: JSON.stringify({ nothing: true }) }), env);
ok(r.status === 204, 'empty event list is fine');
ok(env.DB.rows.every((row) => row.length === 8), 'every stored row has exactly the 8 columns');

// ── scheduled() retention ──
await worker.scheduled({}, env);
ok(env.DB.deletes.length === 1, 'cron runs one delete');
const cutoff = env.DB.deletes[0][0];
ok(Math.abs(Date.now() - 90 * 86400000 - cutoff) < 5000, 'cron deletes rows older than 90 days');

console.log('\n' + pass + ' passed, ' + fail + ' failed, 0 skipped');
process.exit(fail ? 1 : 0);
