/* tools/test-site-search.js
   Suite for assets/site-search.js (specs/site-search-v2.spec.md §3.1, Phase A
   step 4). Self-extracting: reads the module, normalizes CRLF to LF and runs it
   in a bare vm context with only { module, exports, console }, which must
   export SiteSearchCore without touching the DOM. Nothing to keep in sync by hand.

     node tools/test-site-search.js          (from the repo root)

   Sections: A load · B esc · C decode · D plain and body · E terms and stemming ·
   F titleFromUrl · G excerpt and hostile input · H fragmentFor and deepLink ·
   I grouping · J phrase finder · K fixture · L static checks.
*/
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'assets', 'site-search.js');
const src = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const sandbox = { module: { exports: {} }, console: console };
sandbox.exports = sandbox.module.exports;
vm.createContext(sandbox);
let loadError = null;
try { vm.runInContext(src, sandbox, { filename: 'site-search.js' }); } catch (e) { loadError = e; }
const C = sandbox.module.exports.SiteSearchCore;
if (!C) { console.error('module did not export SiteSearchCore' + (loadError ? ': ' + loadError.message : '')); process.exit(1); }

let pass = 0, fail = 0, skip = 0;
const section = { name: '' };
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL [' + section.name + ']: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function SKIP(msg) { skip++; console.log('SKIP [' + section.name + ']: ' + msg); }
function sec(n) { section.name = n; }
const ELL = '…';
const stripTags = (h) => h.replace(/<[^>]*>/g, '');
const unesc = (h) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
// Every tag in generated markup: only the ones the module means to emit.
const ALLOWED_TAG = /^<\/?(li|a|span|mark)(\s+(href|class)="[^"<>]*")*\s*>$/;
function tagsSafe(html) { return (html.match(/<[^>]*>?/g) || []).every((t) => ALLOWED_TAG.test(t)); }
function chunk(url, text, meta, score) { return { text: text, score: score == null ? 0.5 : score, item: { key: url, metadata: meta || {} } }; }

// ── A: load ──
sec('A');
ok(!loadError, 'module runs in a bare vm context' + (loadError ? ': ' + loadError.message : ''));
['esc', 'decode', 'plain', 'body', 'hasTerm', 'queryWords', 'stem', 'termsFor', 'titleFromUrl', 'excerpt', 'fragmentFor',
  'deepLink', 'buildPages', 'resultsHtml', 'statusText', 'searchBody', 'normText', 'findPhraseIndex'].forEach((k) => {
  eq(typeof C[k], 'function', 'core.' + k + ' is a function');
});
eq(C.ENDPOINT, 'https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/', 'endpoint constant');
eq(C.SEARCH_URL, C.ENDPOINT + 'search', 'search URL');
eq(C.CHAT_URL, C.ENDPOINT + 'chat/completions', 'chat URL');
eq(C.MAX_PAGES, 6, 'six pages at most');
eq(JSON.stringify(C.searchBody('services')),
  '{"messages":[{"role":"user","content":"services"}],"ai_search_options":{"retrieval":{"max_num_results":20}}}',
  'request body identical to v1');
eq(C.searchBody('a "quoted" <q>').messages[0].content, 'a "quoted" <q>', 'query passes through to the body unchanged');
['window', 'document', 'location', 'fetch'].forEach((g) => ok(!(g in sandbox), 'no ' + g + ' created in the Node context'));
eq(C.statusText(0), 'No pages matched. Try different words.', 'status: none');
eq(C.statusText(1), '1 page matched.', 'status: one');
for (let n = 2; n <= 6; n++) eq(C.statusText(n), n + ' pages matched.', 'status: ' + n);
eq(C.STATUS_SEARCHING, 'Searching' + ELL, 'searching status');
eq(C.STATUS_ERROR, 'Search is unavailable right now. Please try again shortly.', 'error status');

// ── B: esc ──
sec('B');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
Object.keys(ESC).forEach((c) => {
  eq(C.esc(c), ESC[c], 'esc ' + c);
  eq(C.esc('a' + c + 'b'), 'a' + ESC[c] + 'b', 'esc inside text ' + c);
  eq(C.esc(c + c + c), ESC[c] + ESC[c] + ESC[c], 'esc repeated ' + c);
});
eq(C.esc('&amp;'), '&amp;amp;', 'esc does not skip existing entities');
eq(C.esc('plain text 123'), 'plain text 123', 'esc leaves plain text');
eq(C.esc(''), '', 'esc empty');
eq(C.esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;', 'esc hostile tag');
for (let i = 0; i < 128; i++) {
  const ch = String.fromCharCode(i), out = C.esc(ch);
  ok(!/[<>"']/.test(out) && (ch === '&' || out === ch || ESC[ch] === out), 'esc char code ' + i);
}
eq(unesc(C.esc('“quotes” & <b>')), '“quotes” & <b>', 'esc round-trips');

// ── C: decode ──
sec('C');
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
  '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“', '&mdash;': '—',
  '&ndash;': '–', '&hellip;': '…', '&#x27;': "'", '&#X27;': "'", '&#x2014;': '—', '&#8212;': '—',
  '&#038;': '&', '&#x26;': '&', '&#169;': '©', '&#x1F600;': '\u{1F600}', '&apos;': "'" };
Object.keys(ENT).forEach((e) => {
  eq(C.decode(e), ENT[e], 'decode ' + e);
  eq(C.decode('x' + e + 'y'), 'x' + ENT[e] + 'y', 'decode inside text ' + e);
  if (e !== '&amp;') eq(C.decode('&amp;' + e.slice(1)), e, 'double-encoded ' + e + ' stays single-decoded');
});
eq(C.decode('Cowork Cost &amp; Conversation Simulator'), 'Cowork Cost & Conversation Simulator', 'decode real title');
eq(C.decode('&amp;amp;'), '&amp;', 'decode is a single pass');
eq(C.decode('&unknown;'), '&unknown;', 'unknown named entity left alone');
eq(C.decode('AT&T'), 'AT&T', 'bare ampersand left alone');
eq(C.decode('&amp'), '&amp', 'entity without semicolon left alone');
eq(C.decode('&#0;'), '�', 'NUL numeric becomes replacement char');
eq(C.decode('&#xD800;'), '�', 'surrogate numeric becomes replacement char');
eq(C.decode('&#x110000;'), '�', 'out-of-range numeric becomes replacement char');
eq(C.decode(''), '', 'decode empty');
eq(C.decode(null), '', 'decode null');
eq(C.decode(undefined), '', 'decode undefined');
eq(C.decode('no entities here'), 'no entities here', 'decode plain');
eq(C.decode('&lt;script&gt;'), '<script>', 'decode yields raw markup (escaped again on output)');
for (let cp = 32; cp < 400; cp += 7) {
  eq(C.decode('&#' + cp + ';'), String.fromCodePoint(cp), 'decimal &#' + cp + ';');
  eq(C.decode('&#x' + cp.toString(16) + ';'), String.fromCodePoint(cp), 'hex &#x' + cp.toString(16) + ';');
}

// ── D: plain and body ──
sec('D');
eq(C.plain('See ![diagram](/img/a.png) here'), 'See here', 'image removed');
eq(C.plain('Read [the playbook](https://copilotplaybook.com/cpb.html) now'), 'Read the playbook now', 'link text kept, URL dropped');
eq(C.plain('[a](x) and [b](y)'), 'a and b', 'two links');
eq(C.plain('# Heading one'), 'Heading one', 'h1 marker stripped');
eq(C.plain('### Heading three'), 'Heading three', 'h3 marker stripped');
eq(C.plain('| a | b |\n|---|---|\n| 1 | 2 |'), 'a b 1 2', 'table pipes and rule stripped');
eq(C.plain('| :--- | ---: |'), '', 'aligned table rule stripped');
eq(C.plain('**bold** and *em* and __u__ and `code`'), 'bold and em and u and code', 'emphasis stripped');
eq(C.plain('> quoted line'), 'quoted line', 'blockquote marker stripped');
eq(C.plain('  many    spaces\n\nand\tlines  '), 'many spaces and lines', 'whitespace collapsed and trimmed');
eq(C.plain(''), '', 'plain empty');
eq(C.plain('---\nrule'), 'rule', 'dash rule line stripped');
['#', '*', '_', '`', '>', '|'].forEach((ch) => ok(C.plain('a' + ch + ch + 'b').indexOf(ch) < 0, 'plain removes ' + ch));
eq(C.body('---\ndescription: A page\ntitle: X\n---\nBody text'), 'Body text', 'closed front matter stripped');
eq(C.body('---\ndescription: A page\ntitle: X\n---Body'), 'Body', 'closing fence without newline');
eq(C.body('---\ndescription: truncated chunk'), '', 'truncated front matter stripped');
eq(C.body('---\ndescription: one\nog-title: two\n'), '', 'truncated front matter with hyphenated keys');
eq(C.body('Body first\n---\ndescription: x'), 'Body first\n---\ndescription: x', 'front matter only at the start');
eq(C.body('No front matter'), 'No front matter', 'body unchanged without front matter');
eq(C.body('---\n\nBody'), '\nBody', 'empty front matter fence');

// ── E: terms and stemming ──
sec('E');
eq(JSON.stringify(C.queryWords('services')), '["services"]', 'one word');
eq(JSON.stringify(C.queryWords('a to cpb services')), '["cpb","services"]', 'words of two letters or fewer dropped');
eq(JSON.stringify(C.queryWords('cost? (credits), "agents"!')), '["cost","credits","agents"]', 'punctuation dropped');
eq(JSON.stringify(C.queryWords('self-service')), '["self-service"]', 'hyphen kept');
eq(JSON.stringify(C.queryWords('   ')), '[]', 'blank query');
// The stem only has to be a prefix of the singular: "services" -> "servic" still finds "service".
const STEMS = { services: 'servic', Services: 'servic', agents: 'agent', credits: 'credit', licenses: 'licens',
  copilot: 'copilot', cows: 'cows', tools: 'tool', boxes: 'box', pass: 'pass', class: 'clas', cost: 'cost', is: 'is', bus: 'bus', yes: 'yes', news: 'news' };
Object.keys(STEMS).forEach((w) => eq(C.stem(w), STEMS[w], 'stem ' + w));
['service', 'Service', 'services', 'self-service'].forEach((t) => ok(C.hasTerm('one ' + t + ' here', C.termsFor(['services'])), '"services" finds "' + t + '"'));
['agent', 'agents', 'Agent'].forEach((t) => ok(C.hasTerm('an ' + t, C.termsFor(['agents'])), '"agents" finds "' + t + '"'));
['cat', 'dog', 'are', 'the', 'and', 'for'].forEach((w) => eq(C.stem(w), w, 'short word untouched: ' + w));
['cat', 'dog', 'bit', 'map'].forEach((w) => eq(C.stem(w + 's'), w + 's', 'four-letter boundary: ' + w + 's kept as is'));
['work', 'cost', 'plan', 'tier'].forEach((w) => eq(C.stem(w + 's'), w, 'five-letter boundary: ' + w + 's trimmed'));
['credit', 'agent', 'meter', 'seat'].forEach((w) => ok(C.stem(w + 's').length <= w.length + 1, 'plural trimmed or kept: ' + w));
ok(!C.hasTerm('nothing relevant', ['servic']), 'hasTerm false');
ok(C.hasTerm('UPPER CASE SERVICE', ['servic']), 'hasTerm case-insensitive');
ok(!C.hasTerm('anything', []), 'hasTerm with no terms');

// ── F: titleFromUrl ──
sec('F');
const TITLES = {
  'https://copilotplaybook.com/': 'Home',
  'https://copilotplaybook.com': 'Home',
  'https://copilotplaybook.com/index.html': 'Home',
  'https://copilotplaybook.com/customer-zero-starter-kit/index.html': 'Customer Zero Starter Kit',
  'https://copilotplaybook.com/customer-zero-starter-kit/': 'Customer Zero Starter Kit',
  'https://copilotplaybook.com/frontier-navigator/pages/compare.html': 'Compare',
  'https://copilotplaybook.com/copilot-credit-planner.html': 'Copilot Credit Planner',
  'https://copilotplaybook.com/cpb_model_the-practice.html': 'Cpb Model The Practice',
  'https://copilotplaybook.com/CopilotApp.html': 'CopilotApp',
  'http://www.copilotplaybook.com/frontier.html': 'Frontier',
};
Object.keys(TITLES).forEach((u) => eq(C.titleFromUrl(u), TITLES[u], 'titleFromUrl ' + u));

// ── G: excerpt and hostile input ──
sec('G');
const words = [];
for (let i = 0; i < 200; i++) words.push('word' + i);
const longText = words.join(' ');
for (let pos = 0; pos < 200; pos += 3) {
  const t = 'target';
  const text = words.slice(0, pos).concat([t]).concat(words.slice(pos)).join(' ');
  const html = C.excerpt(text, [t]);
  const vis = unesc(stripTags(html));
  ok(vis.length <= 245, 'excerpt length bound at position ' + pos + ' (' + vis.length + ')');
  ok(/<mark>target<\/mark>/.test(html), 'excerpt shows and marks the term at position ' + pos);
  const at = text.indexOf(t);
  eq(vis.startsWith(ELL), at - 80 > 0, 'leading ellipsis only when cut at position ' + pos);
  eq(vis.endsWith(ELL), Math.max(0, at - 80) + 240 < text.length, 'trailing ellipsis only when cut at position ' + pos);
  const inner = vis.replace(/^…/, '').replace(/…$/, '');
  ok(inner.split(' ').every((w) => w === 'target' || /^word\d+$/.test(w)), 'no partial words at the cut edges at position ' + pos);
}
eq(C.excerpt('short text', ['short']), '<mark>short</mark> text', 'short text no ellipsis');
eq(C.excerpt('short text', []), 'short text', 'no terms: plain escaped text');
eq(C.excerpt(longText, ['absent']).slice(-1), ELL, 'term absent: from the start, trailing ellipsis');
ok(!C.excerpt(longText, ['absent']).startsWith(ELL), 'term absent: no leading ellipsis');
eq(C.excerpt('Services and service-led self-service', ['servic']),
  '<mark>Services</mark> and <mark>service</mark>-led self-<mark>service</mark>', 'highlight extends to the end of the word, case kept');
eq(C.excerpt('agents agentic agent', ['agent']), '<mark>agents</mark> <mark>agentic</mark> <mark>agent</mark>', 'each occurrence marked');
eq(C.excerpt('cost and credit', ['cost', 'credit']), '<mark>cost</mark> and <mark>credit</mark>', 'two terms marked');
eq(C.excerpt('a+b (c) [d] $e', ['a+b']), '<mark>a+b</mark> (c) [d] $e', 'regex metacharacters in a term are literal');
ok(tagsSafe(C.excerpt('x.y*z', ['.*'])), 'regex-looking term is safe');
const HOSTILE = [
  '<img src=x onerror=alert(1)>', '"><img src=x onerror=alert(1)>', "'><svg onload=alert(1)>", '<script>alert(1)</script>',
  '&lt;img src=x onerror=alert(1)&gt;', '&amp;lt;script&amp;gt;', '<a href="javascript:alert(1)">x</a>', '</span></a><img onerror=x>',
  '&#60;img onerror=alert(1)&#62;', '&#x3C;svg onload=1&#x3E;', '<mark onclick=x>m</mark>', '<<img/onerror=1>>'
];
HOSTILE.forEach((h, i) => {
  [[], ['img'], ['onerror'], ['alert'], ['script'], ['lt', 'amp'], ['quot']].forEach((terms) => {
    const html = C.excerpt('Lead text ' + h + ' services tail ' + h, terms);
    ok(tagsSafe(html), 'excerpt hostile #' + i + ' terms ' + JSON.stringify(terms) + ': only <mark> tags');
    ok(!/<img|<svg|<script/i.test(html), 'excerpt hostile #' + i + ' terms ' + JSON.stringify(terms) + ': no raw <img/<svg/<script');
  });
});
// The whole page path: hostile chunk text, title and URL through buildPages and resultsHtml.
HOSTILE.forEach((h, i) => {
  const chunks = [chunk('https://copilotplaybook.com/x.html?a="' + h, 'Intro ' + h + ' services ' + h, { title: h + ' services' })];
  const built = C.buildPages(chunks, 'services ' + h, 6);
  const html = C.resultsHtml(built.pages, built.terms);
  ok(tagsSafe(html), 'resultsHtml hostile #' + i + ': only li/a/span/mark tags with href/class');
  ok(!/<img|<svg|<script/i.test(html), 'resultsHtml hostile #' + i + ': no raw <img/<svg/<script');
  ok(!(html.match(/<[^>]*>/g) || []).some((t) => /onerror|onload|onclick|javascript:/i.test(t.replace(/"[^"]*"/g, '""'))), 'resultsHtml hostile #' + i + ': no event handler or javascript: outside quoted attribute values');
  eq((html.match(/<li>/g) || []).length, 1, 'resultsHtml hostile #' + i + ': one result');
});

// ── H: fragmentFor and deepLink ──
sec('H');
const T = (q) => C.termsFor(C.queryWords(q));
const W = (q) => C.queryWords(q);
eq(C.fragmentFor('We sell managed services revenue and expands the retainer today', T('services'), W('services')),
  'services revenue and expands the', 'five words from the term');
eq(C.fragmentFor('Our services, priced. More words', T('services'), W('services')), 'services', 'stops at comma, comma stripped');
eq(C.fragmentFor('Price the services; then sell', T('services'), W('services')), 'services', 'stops at semicolon');
eq(C.fragmentFor('Price the services now: then sell', T('services'), W('services')), 'services now', 'stops at colon');
eq(C.fragmentFor('Sell services today. Then more', T('services'), W('services')), 'services today', 'stops at period');
eq(C.fragmentFor('Are services ready? Yes', T('services'), W('services')), 'services ready', 'stops at question mark');
eq(C.fragmentFor('Sell “services that land” well', T('services'), W('services')), 'services that land', 'curly quotes stripped');
eq(C.fragmentFor('Sell ‘services’ well', T('services'), W('services')), 'services’ well', 'opening single curly quote stripped');
eq(C.fragmentFor('Sell "services" well', T('services'), W('services')), 'services', 'straight quotes stripped');
eq(C.fragmentFor('Sell (services) well', T('services'), W('services')), 'services', 'parentheses stripped');
eq(C.fragmentFor('| Tier | Managed services cell | Price |', T('services'), W('services')), 'services cell', 'phrase stays inside one table cell');
eq(C.fragmentFor('line one\nservices on line two\nline three', T('services'), W('services')), 'services on line two', 'phrase stays on one line');
eq(C.fragmentFor('**Bold** [linked services](x.html) text', T('services'), W('services')), 'services text', 'Markdown flattened first');
eq(C.fragmentFor('Nothing relevant here', T('managed services'), W('managed services')), 'managed', 'fallback: first whole query word');
eq(C.fragmentFor('Nothing relevant here', [], []), '', 'fallback with no words: empty');
eq(C.fragmentFor('credit agents meter', T('meter agents'), W('meter agents')), 'meter', 'first term wins over earlier text position');
eq(C.fragmentFor('', T('services'), W('services')), 'services', 'empty passage falls back');
eq(C.deepLink('https://copilotplaybook.com/a.html', ''), 'https://copilotplaybook.com/a.html', 'no phrase: plain URL');
eq(C.deepLink('https://copilotplaybook.com/a.html', 'services revenue'), 'https://copilotplaybook.com/a.html?hl=services%20revenue', 'phrase encoded');
eq(C.deepLink('https://copilotplaybook.com/a.html', 'a&b=c #d'), 'https://copilotplaybook.com/a.html?hl=a%26b%3Dc%20%23d', 'reserved characters encoded');
eq(C.deepLink('https://copilotplaybook.com/a.html', '“x” — y'), 'https://copilotplaybook.com/a.html?hl=%E2%80%9Cx%E2%80%9D%20%E2%80%94%20y', 'Unicode encoded as UTF-8');
ok(C.deepLink('https://copilotplaybook.com/a.html', 'x').indexOf('#:~:text=') < 0, 'never a text fragment');
['<', '>', '"', "'", ' ', '&', '?', '#', '/', '+', '%'].forEach((ch) => {
  const u = C.deepLink('https://copilotplaybook.com/a.html', 'a' + ch + 'b');
  eq(decodeURIComponent(u.split('?hl=')[1]), 'a' + ch + 'b', 'deepLink round-trips ' + ch);
  ok(!/[<>" #&+]/.test(u.split('?hl=')[1]), 'deepLink encodes ' + ch);
});

// ── I: grouping ──
sec('I');
const U = (n) => 'https://copilotplaybook.com/p' + n + '.html';
{
  const chunks = [];
  for (let i = 0; i < 20; i++) chunks.push(chunk(U(i % 8), 'chunk ' + i + ' about services', { title: 'Page ' + (i % 8) }));
  for (let max = 0; max <= 9; max++) {
    const pages = C.buildPages(chunks, 'services', max).pages;
    eq(pages.length, Math.min(max, 8), 'maxPages ' + max + ' honored');
    eq(new Set(pages.map((p) => p.url)).size, pages.length, 'one entry per page at maxPages ' + max);
    pages.forEach((p, i) => eq(p.url, U(i), 'rank order kept at maxPages ' + max + ' slot ' + i));
  }
  eq(C.buildPages(chunks, 'services').pages.length, 6, 'default maxPages is 6');
}
{
  const chunks = [
    chunk(U(1), 'semantic match with no query word', { title: 'One' }, 0.9),
    chunk(U(2), 'second page mentions services', { title: 'Two' }, 0.8),
    chunk(U(1), 'later chunk that names the services we sell', { title: 'One' }, 0.7),
    chunk(U(1), 'third chunk also services', { title: 'One' }, 0.6)
  ];
  const pages = C.buildPages(chunks, 'services', 6).pages;
  eq(pages.length, 2, 'two pages');
  eq(pages[0].url, U(1), 'page order follows first appearance');
  eq(pages[0].text, 'later chunk that names the services we sell', 'best-ranked chunk containing a term preferred');
  eq(pages[0].href, U(1) + '?hl=' + encodeURIComponent('services we sell'), 'deep link from the chosen chunk');
  eq(pages[1].title, 'Two', 'title from metadata');
}
{
  const pages = C.buildPages([chunk(U(1), 'nothing here', {}), chunk(U(1), 'nor here', {})], 'services', 6).pages;
  eq(pages[0].text, 'nothing here', 'no chunk with a term: first non-empty chunk');
  eq(pages[0].href, U(1) + '?hl=services', 'fallback deep link is the first query word');
  eq(pages[0].title, 'P1', 'no metadata title: titleFromUrl');
}
{
  const pages = C.buildPages([chunk(U(1), '', { description: 'Desc with services &amp; more' })], 'services', 6).pages;
  eq(pages[0].text, 'Desc with services & more', 'empty chunks: decoded description');
}
{
  const pages = C.buildPages([chunk(U(1), '---\ndescription: front matter services\n---\nBody about services here', { title: 'A &amp; B' })], 'services', 6).pages;
  eq(pages[0].text, 'Body about services here', 'front matter stripped from chunk');
  eq(pages[0].title, 'A & B', 'title decoded');
}
{
  const pages = C.buildPages([chunk(U(1), 'Fees &amp; services &mdash; priced', {})], 'services', 6).pages;
  eq(pages[0].text, 'Fees & services — priced', 'chunk text decoded once');
}
{
  const pages = C.buildPages([{ text: 'x' }, { item: {} }, null, chunk(U(3), 'services', {})], 'services', 6).pages;
  eq(pages.length, 1, 'chunks without item.key skipped');
}
eq(C.buildPages([], 'services', 6).pages.length, 0, 'no chunks: no pages');
eq(C.buildPages(undefined, 'services', 6).pages.length, 0, 'undefined chunks: no pages');
eq(C.resultsHtml([], []), '', 'no pages: empty markup');
{
  const html = C.resultsHtml([{ url: 'https://copilotplaybook.com/a.html', href: 'https://copilotplaybook.com/a.html?hl=x', title: 'T', text: '' }], []);
  eq(html, '<li><a href="https://copilotplaybook.com/a.html?hl=x"><span class="r-title">T</span><span class="r-url">copilotplaybook.com/a.html</span></a></li>', 'markup shape identical to v1, no r-text when empty');
}

// ── J: phrase finder ──
sec('J');
eq(C.normText('  A\n\tB  C '), ' a b c ', 'normText collapses whitespace and folds case');
eq(C.findPhraseIndex(['Hello world'], 'world'), 0, 'single node');
eq(C.findPhraseIndex(['Intro. ', 'Services ', 'revenue'], 'services revenue'), 1, 'phrase across two nodes starts in the second');
eq(C.findPhraseIndex(['We sell ', 'manag', 'ed services'], 'managed services'), -1, 'a word split by markup does not match (v1 behavior: a space is inserted)');
eq(C.findPhraseIndex(['alpha', 'beta'], 'alpha beta'), 0, 'space inserted between nodes that would run together');
eq(C.findPhraseIndex(['alpha', 'beta'], 'alphabeta'), -1, 'nodes are not glued into one word');
eq(C.findPhraseIndex(['one\n  two\tthree'], 'one two three'), 0, 'newlines and tabs match spaces');
eq(C.findPhraseIndex(['one two three'], '  one   two\nthree '), 0, 'phrase whitespace normalized and trimmed');
eq(C.findPhraseIndex(['ONE Two'], 'one two'), 0, 'case-insensitive');
eq(C.findPhraseIndex(['x', '', 'y z'], 'y z'), 2, 'empty nodes skipped, index stays the original');
eq(C.findPhraseIndex(['x', '   ', 'y'], 'x y'), 0, 'whitespace-only node between words');
eq(C.findPhraseIndex(['first services', 'second services'], 'services'), 0, 'first occurrence wins');
eq(C.findPhraseIndex(['a b'], 'missing'), -1, 'absent phrase');
eq(C.findPhraseIndex(['a b'], ''), -1, 'empty phrase');
eq(C.findPhraseIndex(['a b'], '   '), -1, 'blank phrase');
eq(C.findPhraseIndex([], 'a'), -1, 'no nodes');
eq(C.findPhraseIndex(['services revenue and expands the managed service retainer'], 'services revenue and expands the'), 0, 'frontier.html sample phrase');
// Generated: a sentence split at every possible boundary, with varied whitespace.
{
  const sentence = 'Partners grow services revenue and expand the managed service retainer every quarter';
  const target = 'services revenue and expand the';
  const at = sentence.indexOf(target);
  for (let cut = 1; cut < sentence.length; cut++) {
    const parts = [sentence.slice(0, cut), sentence.slice(cut)];
    const idx = C.findPhraseIndex(parts, target);
    const cutInsideWord = /\S/.test(sentence[cut - 1]) && /\S/.test(sentence[cut]);
    if (cutInsideWord && cut > at && cut < at + target.length) {
      eq(idx, -1, 'split inside a phrase word at ' + cut + ' does not match (space is inserted)');
    } else {
      eq(idx, cut <= at ? 1 : 0, 'split at ' + cut + ': phrase found in the right node');
    }
  }
  ['\n', '\t', '  ', ' \n '].forEach((ws) => {
    eq(C.findPhraseIndex([sentence.replace(/ /g, ws)], target), 0, 'whitespace variant ' + JSON.stringify(ws));
    eq(C.findPhraseIndex(sentence.split(' ').map((w) => w + ws), target), 2, 'one node per word with ' + JSON.stringify(ws));
  });
  eq(C.findPhraseIndex(sentence.split(' '), target), 2, 'one node per word, no whitespace');
}

// ── K: fixture ──
sec('K');
const FIX = path.join(ROOT, 'tools', 'fixtures', 'site-search-services.json');
if (!fs.existsSync(FIX)) SKIP('fixture missing: ' + FIX);
else {
  const d = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  const chunks = (d.result && d.result.chunks) || [];
  ok(chunks.length > 0, 'fixture has chunks (' + chunks.length + ')');
  const built = C.buildPages(chunks, 'services', C.MAX_PAGES);
  const pages = built.pages;
  ok(pages.length > 0 && pages.length <= 6, 'fixture builds 1 to 6 pages (' + pages.length + ')');
  eq(new Set(pages.map((p) => p.url)).size, pages.length, 'fixture pages unique');
  let withTerm = 0;
  const firstOrder = [];
  chunks.forEach((c) => { if (c.item && c.item.key && firstOrder.indexOf(c.item.key) < 0) firstOrder.push(c.item.key); });
  pages.forEach((p, i) => {
    eq(p.url, firstOrder[i], 'fixture rank order slot ' + i);
    ok(typeof p.title === 'string' && p.title.trim().length > 0, 'fixture page ' + i + ' has a title (' + p.title + ')');
    ok(p.title.indexOf('&amp;') < 0, 'fixture page ' + i + ' title decoded');
    ok(p.href.indexOf('https://copilotplaybook.com/') === 0, 'fixture page ' + i + ' href is on copilotplaybook.com');
    const phrase = C.fragmentFor(p.text ? (chunks.filter((c) => c.item.key === p.url).map((c) => C.body(C.decode(c.text || ''))).filter((t) => C.hasTerm(t, built.terms))[0] || '') : '', built.terms, built.words);
    if (phrase) ok(/\?hl=[^&#]+/.test(p.href), 'fixture page ' + i + ' href carries ?hl= (' + p.href + ')');
    ok(p.text.length > 0, 'fixture page ' + i + ' has passage text');
    const anyTerm = chunks.some((c) => c.item.key === p.url && C.hasTerm(C.body(C.decode(c.text || '')), built.terms));
    if (anyTerm) { withTerm++; ok(C.hasTerm(p.text, built.terms), 'fixture page ' + i + ' passage contains a query term'); }
    else ok(p.href === p.url + '?hl=services', 'fixture page ' + i + ' with no term in any chunk falls back to the query word');
  });
  const html = C.resultsHtml(pages, built.terms);
  ok(tagsSafe(html), 'fixture markup uses only the expected tags');
  eq((html.match(/<li>/g) || []).length, pages.length, 'fixture markup has one <li> per page');
  ok(withTerm > 0 && (html.match(/<mark>/g) || []).length >= withTerm, 'fixture markup highlights the term in every passage');
  pages.forEach((p, i) => ok(unesc(stripTags(C.excerpt(p.text, built.terms))).length <= 245, 'fixture excerpt ' + i + ' length bound'));
}

// ── L: static checks ──
sec('L');
ok(!/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/i.test(src), 'no browser storage');
ok(!/document\.cookie/.test(src), 'no cookies');
ok(!/#:~:text=/.test(src.replace(/No #:~:text= fragment/g, '')), 'no text-fragment links built');
ok(!/\beval\s*\(|new Function\s*\(/.test(src), 'no eval');
ok(!/document\.write/.test(src), 'no document.write');
ok(!/createElement\(\s*['"]textarea/.test(src), 'decode does not use a textarea');
const assigns = [...src.matchAll(/\.(innerHTML|outerHTML)\s*=(?!=)\s*([^;]*);/g)];
ok(assigns.length > 0, 'innerHTML assignments found to check (' + assigns.length + ')');
assigns.forEach((m) => ok(/^''$/.test(m[2].trim()) || /^core\.resultsHtml\(/.test(m[2].trim()), 'innerHTML fed only by \'\' or core.resultsHtml: ' + m[0]));
ok(!/insertAdjacentHTML/.test(src), 'no insertAdjacentHTML');
{
  const body = /core\.resultsHtml = function[\s\S]*?\n {2}\};/.exec(src);
  ok(body, 'resultsHtml found');
  if (body) {
    const interp = [...body[0].matchAll(/\+\s*([^'+\n][^+\n]*?)\s*\+/g)].map((x) => x[1].trim()).filter((x) => /^p\./.test(x) || /p\./.test(x));
    interp.forEach((x) => ok(/^core\.(esc|excerpt)\(/.test(x) || /^\(p\.text \?/.test(x), 'resultsHtml interpolation goes through esc or excerpt: ' + x));
    ok(/core\.esc\(p\.href\)/.test(body[0]) && /core\.esc\(p\.title\)/.test(body[0]) && /core\.esc\(p\.url/.test(body[0]) && /core\.excerpt\(p\.text/.test(body[0]), 'href, title, url and text are all escaped');
  }
}
ok(/textContent = core\.statusText/.test(src), 'status set through textContent');
ok(/if \(typeof module !== 'undefined' && module\.exports\) \{\s*module\.exports\.SiteSearchCore = core;\s*return;/.test(src), 'Node export returns before any browser code');
ok(src.indexOf('module.exports.SiteSearchCore') < src.indexOf('document.'), 'no document access before the Node export');
ok(/window\.top !== window/.test(src) && /classList\.contains\('embedded'\)/.test(src), 'embedded guard present');
ok(!/\b(colour|behaviour|licence|optimis|organis|catalogue|artefact|modelled|cancelled|labelled|centre|favourite|analyse)\w*/i.test(src), 'US English');
ok(/max_num_results: core\.MAX_RESULTS/.test(src), 'request body built in one place');
ok(!/launcher\s*=\s*document\.createElement|attachShadow/.test(src), 'no launcher or floating UI yet (Phase C)');
['site-search-form', 'site-search-q', 'site-search-status', 'site-search-results', 'site-search-open-chat'].forEach((id) => ok(src.indexOf("'" + id + "'") > 0, 'mount wires #' + id));
{
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ['site-search-form', 'site-search-q', 'site-search-status', 'site-search-results', 'site-search-open-chat'].forEach((id) => ok(idx.indexOf('id="' + id + '"') > 0, 'index.html still has #' + id));
  ok(idx.indexOf('id="site-search"') > 0, 'index.html still has #site-search');
  eq((idx.match(/<script src="\/assets\/site-search\.js\?v=3" defer><\/script>/g) || []).length, 1, 'index.html loads the module once');
  ok(idx.indexOf('site-search-jump.js') < 0, 'index.html no longer loads the jump file');
  ok(idx.indexOf('function fragmentFor') < 0, 'index.html inline search script removed');
  ok(/search-snippet\.es\.js/.test(idx), 'index.html keeps the chat bubble module');
}
ok(!/site-search\.js/.test(fs.readFileSync(path.join(ROOT, 'copilot-credit-planner.html'), 'utf8')), 'credit planner stays free of the module');

console.log('\n' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
process.exit(fail ? 1 : 0);
