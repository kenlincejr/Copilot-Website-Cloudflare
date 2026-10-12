/* tools/site-gate.js
   The 100% gate for site-wide work (specs/site-search-v2.spec.md). Runs every
   suite in the repo plus the structural checks site search depends on, and
   prints one score. Anything below 100% is a stop: fix it before the next step.

     node tools/site-gate.js            (from the repo root)
     node tools/site-gate.js --fast     (skip the two long Cowork suites)

   Sections: S sitemap · M meta tags · J search script placement · I isolation ·
   A assets · F facts (against the recorded baseline) · T test suites.
*/
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const FAST = process.argv.includes('--fast');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

let pass = 0, fail = 0;
const fails = [];
let sectionName = '';
function section(n) { sectionName = n; }
function ok(c, msg) { if (c) pass++; else { fail++; fails.push('[' + sectionName + '] ' + msg); } }

// The search script every sitemap page loads. Bump with the asset's ?v=.
const SEARCH_SCRIPT = /<script src="\/assets\/(site-search|site-search-jump)\.js\?v=\d+" defer><\/script>/g;
// Pages that must stay script-isolated (their own suites forbid external scripts).
const NO_SEARCH_SCRIPT = ['copilot-credit-planner.html'];
// Tracked public HTML deliberately left out of the sitemap, with the reason.
const OUT_OF_SITEMAP = {
  'cpbbackup.html': 'backup',
  'cpb-original-backup.html': 'backup',
  'cpb-field-guide.html': 'unlinked, awaiting a decision',
  'ask.html': 'chat shell, no content (spec D9)',
};
const PAGE_TYPES = ['playbook', 'engagement', 'tool', 'customer-zero', 'program'];
// check-facts.py mismatches that predate site search (recorded 2026-10-12 at
// commit 3620fe6). A new ID here is a regression; one disappearing is a fix.
const FACTS_BASELINE = ['F-001', 'F-004', 'F-006', 'F-009', 'F-010', 'F-017', 'F-020', 'F-025', 'F-027', 'F-028', 'F-034', 'F-036', 'F-055', 'F-058', 'F-059', 'F-156', 'F-176'];

// ── S: sitemap ──
section('S');
const sm = read('sitemap.xml');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(locs.length > 0, 'sitemap has <loc> entries');
ok(new Set(locs).size === locs.length, 'sitemap has no duplicate <loc>');
ok((sm.match(/<url>/g) || []).length === (sm.match(/<\/url>/g) || []).length, 'sitemap <url> tags balanced');
const files = locs.map((u) => {
  let p = u.replace(/^https:\/\/copilotplaybook\.com\//, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
});
files.forEach((f, i) => {
  ok(locs[i].startsWith('https://copilotplaybook.com/'), 'absolute https loc: ' + locs[i]);
  ok(fs.existsSync(path.join(ROOT, f)), 'sitemap entry exists on disk: ' + f);
  ok(!/^ff\//.test(f) && !/backup/i.test(f) && f !== 'ask.html', 'sitemap excludes ff/, backups, ask.html: ' + f);
});
const tracked = cp.execSync('git ls-files "*.html"', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
tracked.filter((f) => !/^ff\//.test(f)).forEach((f) => {
  ok(files.includes(f) || OUT_OF_SITEMAP[f], 'tracked page is in the sitemap or explicitly excluded: ' + f);
});
const htmlPages = files.filter((f) => f.endsWith('.html'));

// ── M: meta tags (DESIGN 8b.5) ──
section('M');
htmlPages.forEach((f) => {
  const s = read(f);
  const head = (s.split(/<\/head>/i)[0]) || '';
  [['name="title"', 'title'], ['property="og:title"', 'og:title'], ['name="description"', 'description'], ['property="og:description"', 'og:description']].forEach(([attr, label]) => {
    const n = (head.match(new RegExp('<meta[^>]*' + attr.replace(/"/g, '"') + '[^>]*>', 'g')) || []).length;
    ok(n === 1, f + ': exactly one ' + label + ' meta tag in <head> (got ' + n + ')');
  });
  const t = /<meta name="title" content="([^"]*)"/.exec(head);
  ok(t && t[1].trim().length > 0 && t[1].length <= 80, f + ': title meta is non-empty and at most 80 characters');
  // Spec 3.2: filter chips and boosting read these two custom metadata fields.
  const pt = [...head.matchAll(/<meta name="page_type" content="([^"]*)"/g)];
  ok(pt.length === 1 && PAGE_TYPES.includes(pt[0][1]), f + ': exactly one page_type meta with an allowed value');
  const pr = [...head.matchAll(/<meta name="priority" content="([^"]*)"/g)];
  ok(pr.length === 1 && /^[123]$/.test(pr[0][1]), f + ': exactly one priority meta, 1 to 3');
});

// ── J: search script placement ──
section('J');
htmlPages.forEach((f) => {
  const s = read(f);
  const n = (s.match(SEARCH_SCRIPT) || []).length;
  if (NO_SEARCH_SCRIPT.includes(f)) ok(n === 0, f + ': stays free of the search script');
  else ok(n === 1, f + ': loads the search script exactly once (got ' + n + ')');
  const at = s.search(SEARCH_SCRIPT), end = s.lastIndexOf('</body>');
  if (n === 1) ok(at < end && at > s.lastIndexOf('</footer>') - 1, f + ': search script sits after the content, before </body>');
});
const versions = new Set();
htmlPages.forEach((f) => { (read(f).match(SEARCH_SCRIPT) || []).forEach((t) => versions.add(t)); });
ok(versions.size <= 1, 'every page loads the same search script version (' + [...versions].join(' | ') + ')');

// ── I: isolation ──
section('I');
NO_SEARCH_SCRIPT.forEach((f) => ok(!/<script[^>]+src=/i.test(read(f)), f + ': no external <script src> at all'));

// ── A: assets ──
section('A');
fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => /^site-search.*\.js$/.test(f)).forEach((f) => {
  const p = path.join(ROOT, 'assets', f);
  let parsed = true;
  try { cp.execSync('node --check "' + p + '"', { stdio: 'ignore' }); } catch (e) { parsed = false; }
  ok(parsed, 'assets/' + f + ' parses');
  const src = read('assets/' + f);
  ok(!/\b(licence|colour|optimis|behaviour|catalogue|artefact|modelled|cancelled|labelled)\b/i.test(src), 'assets/' + f + ': US English');
  ok(!/\blocalStorage\b|\bsessionStorage\b|indexedDB/.test(src), 'assets/' + f + ': no browser storage (site trust design)');
});
if (fs.existsSync(path.join(ROOT, 'data/site-search-config.json'))) {
  let cfg = null;
  try { cfg = JSON.parse(read('data/site-search-config.json')); } catch (e) { cfg = null; }
  ok(cfg && /^https:\/\/[0-9a-f-]+\.search\.ai\.cloudflare\.com\/$/.test(cfg.endpoint), 'site-search-config.json parses and names the endpoint');
}

// ── F: facts against baseline ──
section('F');
let factsOut = '';
try { factsOut = cp.execSync('python tools/check-facts.py', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { factsOut = (e.stdout || '') + (e.stderr || ''); }
// Only the closing "!!! N cascade fact(s)" summary counts; line-number drift
// (MOVED) is expected whenever a page above an anchor changes.
const summary = factsOut.split(/^!!! /m)[1] || '';
const factIds = [...new Set([...summary.matchAll(/^\s+(F-\d{3})\s/gm)].map((m) => m[1]))];
const regressions = factIds.filter((id) => !FACTS_BASELINE.includes(id));
ok(regressions.length === 0, 'no new check-facts mismatches beyond the 2026-10-12 baseline' + (regressions.length ? ': ' + regressions.join(', ') : ''));

// ── T: suites ──
section('T');
const suites = ['test-credit-planner.js'].concat(FAST ? [] : ['test-cowork-v3.js', 'test-cowork-motion.js']);
if (fs.existsSync(path.join(ROOT, 'tools/test-site-search.js'))) suites.push('test-site-search.js');
suites.forEach((t) => {
  let out = '', code = 0;
  try { out = cp.execSync('node tools/' + t, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { out = e.stdout || ''; code = e.status || 1; }
  const m = /(\d+) passed, (\d+) failed/.exec(out);
  ok(code === 0 && m && m[2] === '0', t + ': ' + (m ? m[1] + ' passed, ' + m[2] + ' failed' : 'no summary line'));
});

// ── score ──
const total = pass + fail;
const score = total ? Math.floor((pass / total) * 10000) / 100 : 0;
if (fails.length) { console.log('\nFailures:'); fails.forEach((f) => console.log('  ' + f)); }
console.log('\nsite-gate: ' + pass + ' passed, ' + fail + ' failed  →  ' + score + '%' + (fail ? '  ✗ STOP' : '  ✓ GO'));
process.exit(fail ? 1 : 0);
