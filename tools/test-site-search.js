/* tools/test-site-search.js
   Suite for assets/site-search.js (specs/site-search-v2.spec.md §3.1, Phase A
   step 4). Self-extracting: reads the module, normalizes CRLF to LF and runs it
   in a bare vm context with only { module, exports, console }, which must
   export SiteSearchCore without touching the DOM. Nothing to keep in sync by hand.

     node tools/test-site-search.js          (from the repo root)

   Sections: A load · B esc · C decode · D plain and body · E terms and stemming ·
   F titleFromUrl · G excerpt and hostile input · H fragmentFor and deepLink ·
   I grouping · J phrase finder · K fixture · M config, requestBody and hash ·
   N server-sent events · O Markdown renderer · P sources and copied answer ·
   L static checks.
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
  'deepLink', 'buildPages', 'resultsHtml', 'statusText', 'searchBody', 'normText', 'findPhraseIndex',
  'highlight', 'isStop', 'contentWords', 'locatorTerms', 'mergeConfig', 'wordCount', 'requestBody', 'parseHash', 'buildHash',
  'createSSEParser', 'interpretEvent', 'safeHref', 'inlineMarkdown', 'renderMarkdown', 'answerText', 'buildSources', 'sourcesHtml'].forEach((k) => {
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
// Entity-safe highlight: matching runs on raw text, so a term never lands
// inside an entity the escaping produced (the Phase A quirk).
{
  const TA = (q) => C.termsFor(C.queryWords(q));
  eq(JSON.stringify(TA('&amp; pricing')), '["amp","pricing"]', '"&amp;" in a query becomes the term "amp"');
  eq(C.excerpt('Fees & pricing', TA('&amp; pricing')), 'Fees &amp; <mark>pricing</mark>', '"&amp;" query: no mark inside the escaped ampersand');
  eq(C.excerpt('AT&T amplifies reach', ['amp']), 'AT&amp;T <mark>amplifies</mark> reach', 'amp marks a real word, not the entity');
  eq(C.excerpt('a < b and lt', ['lt']), 'a &lt; b and <mark>lt</mark>', 'lt marks the word, not &lt;');
  eq(C.excerpt('say "quote" and x > y', ['quot', 'gt']), 'say &quot;<mark>quote</mark>&quot; and x &gt; y', 'quot and gt never split an entity');
  eq(C.excerpt("it's #39", ['39']), 'it&#39;s #<mark>39</mark>', 'numeric entity left whole');
  eq(C.excerpt('The text &amp; more', ['amp']), 'The text &amp;<mark>amp</mark>; more', 'literal "&amp;" text: the visible word amp is marked, entity intact');
  eq(C.highlight('<b>x</b>', ['b']), '&lt;<mark>b</mark>&gt;x&lt;/<mark>b</mark>&gt;', 'highlight escapes around the mark');
  eq(C.highlight('plain', []), 'plain', 'highlight with no terms');
  eq(C.highlight('a&b', ['']), 'a&amp;b', 'empty term ignored');
  const SPECIAL = ['&', '<', '>', '"', "'"];
  const ETERMS = ['amp', 'lt', 'gt', 'quot', '39', 'a', 'm', 'p', 't', 'q'];
  let n = 0;
  SPECIAL.forEach((c1) => SPECIAL.forEach((c2) => ['amp', 'lt', 'gt', 'quot', 'x'].forEach((w) => {
    const text = 'A' + c1 + w + c2 + ' ' + w + c1 + 'z';
    const html = C.excerpt(text, ETERMS);
    const entities = html.replace(/<\/?mark>/g, '').match(/&[^;\s]*;/g) || [];
    ok(entities.every((e) => /^&(amp|lt|gt|quot|#39);$/.test(e)), 'entities stay whole for ' + JSON.stringify(text) + ' -> ' + html);
    ok(!/&[a-z#0-9]*<mark>/.test(html), 'no <mark> inside an entity for ' + JSON.stringify(text));
    eq(unesc(stripTags(html)), text, 'visible text unchanged for ' + JSON.stringify(text));
    n++;
  })));
  ok(n === 125, 'entity grid covered (' + n + ')');
}
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
// Phase B rule: site-common words and stopwords are ignored; segments (lines,
// table cells) under six words are dropped; the segment with the most distinct
// content terms wins (tie: earliest); the phrase is up to five words from the
// first matched term, stopping at clause punctuation. Fallback: the longest
// content word of the query.
sec('H');
const T = (q) => C.termsFor(C.queryWords(q));
const W = (q) => C.queryWords(q);
const F = (md, q) => C.fragmentFor(md, T(q), W(q));
eq(F('We sell managed services revenue and expands the retainer today', 'services'),
  'services revenue and expands the', 'five words from the term');
eq(F('Our services, priced well for every partner. More words', 'services'), 'services', 'stops at comma, comma stripped');
eq(F('Price the services; then sell to the whole base', 'services'), 'services', 'stops at semicolon');
eq(F('Price the services now: then sell to the base', 'services'), 'services now', 'stops at colon');
eq(F('Sell services today. Then more words follow here', 'services'), 'services today', 'stops at period');
eq(F('Are services ready? Yes they are ready now', 'services'), 'services ready', 'stops at question mark');
eq(F('Sell “services that land” well with every buyer', 'services'), 'services that land', 'curly quotes stripped');
eq(F('Sell ‘services’ well with every buyer in the room', 'services'), 'services’ well with every buyer', 'opening single curly quote stripped');
eq(F('Sell "services" well with every buyer in the room', 'services'), 'services', 'straight quotes stripped');
eq(F('Sell (services) well with every buyer in the room', 'services'), 'services', 'parentheses stripped');
eq(F('| Tier | Managed services cell for the whole tenant | Price |', 'services'), 'services cell for the whole', 'phrase stays inside one table cell');
eq(F('line one\nservices on line two of the passage\nline three', 'services'), 'services on line two of', 'phrase stays on one line');
eq(F('**Bold** [linked services](x.html) text and more words here', 'services'), 'services text and more words', 'Markdown flattened first');
eq(F('Run a self-service portal for every seat in the tenant', 'service'), 'self-service portal for every seat', 'hyphenated word matches at the hyphen');
eq(F('The disservice was noted by every reviewer here', 'service'), 'service', 'a term inside a word does not match');
// Segments under six words are dropped.
eq(F('Managed services pricing\nBody text without the term at all here', 'services'), 'services', 'short heading dropped: fallback');
eq(F('| Tier | Managed services | Price list for every seat |', 'services'), 'services', 'short table cell dropped: fallback');
eq(F('one two three four five services', 'services'), 'services', 'six-word segment kept (boundary)');
eq(F('one two three four services', 'services'), 'services', 'five-word segment dropped (boundary): fallback word');
eq(F('one two three four five services here', 'services'), 'services here', 'seven-word segment kept');
// The breadcrumb problem: "Copilot" is on every page; it no longer decides the phrase.
{
  const md = 'Copilot Playbook › Copilot Business › Pricing and meters\n' +
    'On December 1 the meter turns on for every new Copilot Business license in CSP.';
  const q = 'What changes on December 1 for Copilot Business?';
  const ph = F(md, q);
  eq(ph, 'December 1 the meter turns', 'breadcrumb loses to the body line with more content terms');
  ok(!/^copilot/i.test(ph), 'phrase does not start at a breadcrumb "Copilot"');
}
{
  const md = 'Home › Copilot Playbook › Copilot Credit Planner tool\nCopilot Playbook for partners\n' +
    'Set a credit limit per user before the meter runs in the tenant.';
  eq(F(md, 'Copilot credit limit'), 'credit limit per user before', 'two distinct terms beat one, breadcrumb skipped');
  eq(F(md, 'Copilot Playbook'), 'Copilot Playbook › Copilot Credit', 'a query of site words only still matches them');
}
eq(F('Copilot Playbook › Home\nThis line names no query word at all, none', 'copilot'), 'copilot', 'site-word-only query, no long segment: fallback');
// Most distinct terms, not most hits; tie goes to the earliest segment.
{
  const md = 'meter meter meter meter meter meter appears here a lot\nThe meter bills credits per agent for every user';
  eq(F(md, 'meter credits'), 'meter bills credits per agent', 'distinct terms win over repeated hits');
  const tie = 'First line names the meter once for us all\nSecond line also names the meter for us all';
  eq(F(tie, 'meter'), 'meter once for us all', 'tie: the earliest segment');
}
eq(F('credit agents meter and more words to fill the line', 'meter agents'), 'agents meter and more words', 'phrase starts at the first matched word in the segment');
// Stopwords never score.
eq(F('How do we do this and what is it for the team\nPrice the credits per agent for every user', 'how do credits work'),
  'credits per agent for every', 'stopwords in the query do not pick a segment');
eq(F('Nothing relevant here at all today, really', 'managed services'), 'services', 'fallback: the longest content word');
eq(F('Nothing relevant here at all today, really', 'cpb pricing calculator'), 'calculator', 'fallback: longest of three');
eq(F('Nothing relevant here at all today, really', 'agent meter'), 'agent', 'fallback tie: the first longest');
eq(F('Nothing relevant here at all today, really', 'Copilot for partners'), 'partners', 'fallback with only site words: the longest word');
eq(C.fragmentFor('Nothing relevant here', [], []), '', 'fallback with no words: empty');
eq(F('', 'services'), 'services', 'empty passage falls back');
eq(C.fragmentFor(undefined, T('services'), W('services')), 'services', 'undefined passage falls back');
['the', 'and', 'what', 'copilot', 'microsoft', 'partner', 'partners', 'playbook', 'td', 'synnex', 'customer', 'customers', 'Copilot', 'MICROSOFT']
  .forEach((w) => ok(C.isStop(w), 'stopword: ' + w));
['credits', 'meter', 'agent', 'december', 'business', 'pricing', 'cowork'].forEach((w) => ok(!C.isStop(w), 'not a stopword: ' + w));
eq(JSON.stringify(C.contentWords(W('What changes on December 1 for Copilot Business?'))), '["changes","December","Business"]', 'content words of a real query');
eq(JSON.stringify(C.locatorTerms(W('services Services credits'))), '["servic","credit"]', 'locator terms deduplicated');
eq(JSON.stringify(C.locatorTerms(W('Copilot playbook'))), '["copilot","playbook"]', 'locator terms fall back to all words');
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

// ── M: config, requestBody and the URL hash ──
sec('M');
const BOOST = '"boost_by":[{"field":"priority","direction":"desc"}]';
const DEF = C.DEFAULT_CONFIG;
eq(DEF.endpoint, C.ENDPOINT, 'default endpoint is the constant');
eq(JSON.stringify(DEF.chips), '["all","playbook","engagement","tool","customer-zero","program"]', 'default chips in spec order');
eq(DEF.suggested.length, 4, 'four suggested questions by default');
eq(DEF.boost, true, 'boost on by default');
eq(DEF.rewriteMinWords, 0, 'rewrite off by default');
eq(DEF.rerank, false, 'rerank off by default');
eq(DEF.maxPages, 6, 'maxPages default');
eq(JSON.stringify(C.CHIPS.map((v) => C.CHIP_LABELS[v])), '["All","Playbook","Engagements","Calculators and tools","Customer Zero","Partner program"]', 'chip labels exactly as spec §3.2');
{
  const CFG = path.join(ROOT, 'data', 'site-search-config.json');
  ok(fs.existsSync(CFG), 'data/site-search-config.json exists');
  if (fs.existsSync(CFG)) {
    let raw = null;
    try { raw = JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch (e) { raw = null; }
    ok(raw && typeof raw === 'object', 'config parses as JSON');
    if (raw) {
      eq(JSON.stringify(C.mergeConfig(raw)), JSON.stringify(raw), 'config file is valid as written (merge changes nothing)');
      eq(JSON.stringify(raw), JSON.stringify(DEF), 'config file and inline defaults are identical');
      ['endpoint', 'suggested', 'chips', 'pageAskExclude', 'maxPages', 'boost', 'rewriteMinWords', 'rerank'].forEach((k) => ok(k in raw, 'config has ' + k));
    }
  }
}
eq(JSON.stringify(C.mergeConfig(null)), JSON.stringify(DEF), 'null config: defaults');
eq(JSON.stringify(C.mergeConfig('nonsense')), JSON.stringify(DEF), 'string config: defaults');
eq(JSON.stringify(C.mergeConfig([1, 2])), JSON.stringify(DEF), 'array config: defaults');
eq(JSON.stringify(C.mergeConfig({})), JSON.stringify(DEF), 'empty config: defaults');
[['https://evil.example.com/', 'other host'], ['http://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/', 'http'],
  ['https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com', 'no trailing slash'], [42, 'number'],
  ['https://x.search.ai.cloudflare.com.evil.com/', 'suffix trick']].forEach(([e, why]) => eq(C.mergeConfig({ endpoint: e }).endpoint, C.ENDPOINT, 'bad endpoint rejected: ' + why));
eq(C.mergeConfig({ endpoint: 'https://0123abcd-0000.search.ai.cloudflare.com/' }).endpoint, 'https://0123abcd-0000.search.ai.cloudflare.com/', 'another instance endpoint accepted');
eq(JSON.stringify(C.mergeConfig({ suggested: ['  One?  ', '', 7, 'Two?'] }).suggested), '["One?","Two?"]', 'suggestions trimmed, empties and non-strings dropped');
eq(C.mergeConfig({ suggested: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] }).suggested.length, 6, 'at most six suggestions');
eq(JSON.stringify(C.mergeConfig({ suggested: [] }).suggested), JSON.stringify(DEF.suggested), 'empty suggestions: defaults');
eq(C.mergeConfig({ suggested: ['x'.repeat(201)] }).suggested.length, 4, 'over-long suggestion dropped: defaults');
eq(JSON.stringify(C.mergeConfig({ chips: ['tool', 'playbook'] }).chips), '["all","tool","playbook"]', 'chips without all: all first');
eq(JSON.stringify(C.mergeConfig({ chips: ['all', 'evil', 'tool', 'tool'] }).chips), '["all","tool"]', 'unknown and duplicate chips dropped');
eq(JSON.stringify(C.mergeConfig({ chips: ['all'] }).chips), JSON.stringify(DEF.chips), 'only all: defaults');
eq(JSON.stringify(C.mergeConfig({ chips: 'tool' }).chips), JSON.stringify(DEF.chips), 'chips not an array: defaults');
[[0, 6], [21, 6], [3.5, 6], ['4', 6], [1, 1], [20, 20], [8, 8]].forEach(([v, w]) => eq(C.mergeConfig({ maxPages: v }).maxPages, w, 'maxPages ' + JSON.stringify(v)));
[[-1, 0], [2.5, 0], ['4', 0], [4, 4], [0, 0]].forEach(([v, w]) => eq(C.mergeConfig({ rewriteMinWords: v }).rewriteMinWords, w, 'rewriteMinWords ' + JSON.stringify(v)));
[['yes', true], [0, true], [false, false]].forEach(([v, w]) => eq(C.mergeConfig({ boost: v }).boost, w, 'boost ' + JSON.stringify(v)));
[['yes', false], [1, false], [true, true]].forEach(([v, w]) => eq(C.mergeConfig({ rerank: v }).rerank, w, 'rerank ' + JSON.stringify(v)));
eq(C.mergeConfig({ logEndpoint: 'javascript:alert(1)' }).logEndpoint, '', 'logEndpoint must be https');
eq(C.mergeConfig({ logEndpoint: 'https://playbook-search-log.example.workers.dev/' }).logEndpoint, 'https://playbook-search-log.example.workers.dev/', 'https logEndpoint kept');
// requestBody
const RB = (q, o) => JSON.stringify(C.requestBody(q, o));
eq(RB('services'), '{"messages":[{"role":"user","content":"services"}],"ai_search_options":{"retrieval":{"max_num_results":20,' + BOOST + '}}}', 'default: boost, no filter');
eq(RB('services', { type: 'all' }), RB('services'), 'All sends no filter');
eq(RB('services', { type: 'evil' }), RB('services'), 'unknown type sends no filter');
eq(RB('services', { type: '' }), RB('services'), 'empty type sends no filter');
C.CHIPS.slice(1).forEach((v) => eq(RB('services', { type: v }),
  '{"messages":[{"role":"user","content":"services"}],"ai_search_options":{"retrieval":{"max_num_results":20,"filters":{"page_type":"' + v + '"},' + BOOST + '}}}',
  'filter for chip ' + v));
eq(RB('services', { config: { boost: false } }), '{"messages":[{"role":"user","content":"services"}],"ai_search_options":{"retrieval":{"max_num_results":20}}}', 'boost off: v1 body');
eq(RB('services', { config: { boost: false }, type: 'tool' }), '{"messages":[{"role":"user","content":"services"}],"ai_search_options":{"retrieval":{"max_num_results":20,"filters":{"page_type":"tool"}}}}', 'boost off with a filter');
{
  const cfg = { rewriteMinWords: 4 };
  ok(!('query_rewrite' in C.requestBody('cowork calculator', { config: cfg }).ai_search_options), 'two words: no rewrite at 4');
  ok(!('query_rewrite' in C.requestBody('price a managed', { config: cfg }).ai_search_options), 'three words: no rewrite at 4');
  eq(JSON.stringify(C.requestBody('how to price services', { config: cfg }).ai_search_options.query_rewrite), '{"enabled":true}', 'four words: rewrite at 4');
  eq(JSON.stringify(C.requestBody('  how   to\tprice services  now ', { config: cfg }).ai_search_options.query_rewrite), '{"enabled":true}', 'whitespace-separated word count');
  ok(!('query_rewrite' in C.requestBody('a b c d e f g h i j k l', { config: { rewriteMinWords: 0 } }).ai_search_options), 'rewriteMinWords 0: never');
  eq(JSON.stringify(C.requestBody('x', { config: { rewriteMinWords: 1 } }).ai_search_options.query_rewrite), '{"enabled":true}', 'rewriteMinWords 1: always');
}
ok(!('reranking' in C.requestBody('x').ai_search_options), 'rerank off: no reranking');
eq(JSON.stringify(C.requestBody('x', { config: { rerank: true } }).ai_search_options.reranking), '{"enabled":true}', 'rerank on');
eq(RB('how to price services', { type: 'engagement', stream: true, config: { rewriteMinWords: 4, rerank: true } }),
  '{"messages":[{"role":"user","content":"how to price services"}],"stream":true,"ai_search_options":{"retrieval":{"max_num_results":20,"filters":{"page_type":"engagement"},' + BOOST + '},"query_rewrite":{"enabled":true},"reranking":{"enabled":true}}}',
  'everything on, streamed: exact body');
ok(!('stream' in C.requestBody('x')), 'search body has no stream flag');
{
  const s = C.requestBody('q', { type: 'tool' }), ch = C.requestBody('q', { type: 'tool', stream: true });
  eq(JSON.stringify(ch.ai_search_options), JSON.stringify(s.ai_search_options), 'chat sends the same retrieval options as the search');
}
['a "quoted" <q>', 'x\ny', '&amp;', ' '].forEach((q) => eq(C.requestBody(q).messages[0].content, q, 'query passes through unchanged: ' + JSON.stringify(q)));
eq(C.wordCount(''), 0, 'wordCount empty');
eq(C.wordCount('   '), 0, 'wordCount blank');
eq(C.wordCount('one'), 1, 'wordCount one');
eq(C.wordCount(' one  two\nthree\tfour '), 4, 'wordCount mixed whitespace');
eq(C.wordCount(null), 0, 'wordCount null');
// hash
eq(C.buildHash('', 'all'), '', 'empty state: no hash');
eq(C.buildHash('services', 'all'), '#search=services', 'All omitted');
eq(C.buildHash('services', 'tool'), '#search=services&type=tool', 'type kept');
eq(C.buildHash('', 'tool'), '#type=tool', 'type without a query');
eq(C.buildHash('  managed services  ', undefined), '#search=managed%20services', 'query trimmed and encoded');
['services', 'managed services', 'a&b=c', '#hash?', '100% + more', 'What changes on December 1 for Copilot Business?', '“curly” — dash', 'a+b', 'emoji \u{1F600}', 'x=y&type=tool'].forEach((q) => {
  C.CHIPS.forEach((t) => {
    const back = C.parseHash(C.buildHash(q, t));
    ok(back.query === q && back.type === t, 'hash round-trips ' + JSON.stringify(q) + ' / ' + t + ' (got ' + JSON.stringify(back) + ')');
  });
});
eq(JSON.stringify(C.parseHash('')), '{"query":"","type":"all"}', 'no hash');
eq(JSON.stringify(C.parseHash('#section-3')), '{"query":"","type":"all"}', 'a page anchor is not a search');
eq(JSON.stringify(C.parseHash('#search=x&type=evil')), '{"query":"x","type":"all"}', 'unknown type: All');
eq(JSON.stringify(C.parseHash('#type=program')), '{"query":"","type":"program"}', 'type only');
eq(JSON.stringify(C.parseHash('#search=%20%20')), '{"query":"","type":"all"}', 'blank query');
eq(JSON.stringify(C.parseHash('search=a+b')), '{"query":"a b","type":"all"}', 'form-encoded plus reads as a space, no leading #');
eq(C.parseHash('#search=' + 'x'.repeat(500)).query.length, 300, 'query capped at 300 characters');
eq(JSON.stringify(C.parseHash('#search=%E0%A4%A')), '{"query":"","type":"all"}', 'malformed escape does not throw');
eq(JSON.stringify(C.parseHash('#search=x&type=tool', ['all', 'playbook'])), '{"query":"x","type":"all"}', 'type outside the configured chips: All');

// ── N: server-sent events ──
sec('N');
const P = (pieces) => {
  const p = C.createSSEParser();
  let ev = [];
  pieces.forEach((s) => { ev = ev.concat(p.feed(s)); });
  return ev.concat(p.end()).map((e) => ({ event: e.event, data: e.data }));
};
const J = (x) => JSON.stringify(x);
eq(J(P(['data: a\n\n'])), '[{"event":"message","data":"a"}]', 'one event');
eq(J(P(['event: chunks\ndata: [1]\n\n'])), '[{"event":"chunks","data":"[1]"}]', 'named event');
eq(J(P(['event: chunks\ndata: [1]\n\ndata: b\n\n'])), '[{"event":"chunks","data":"[1]"},{"event":"message","data":"b"}]', 'event name resets after dispatch');
eq(J(P(['data: one\ndata: two\ndata: three\n\n'])), '[{"event":"message","data":"one\\ntwo\\nthree"}]', 'multi-line data joined with LF');
eq(J(P(['data: a\r\n\r\ndata: b\r\n\r\n'])), '[{"event":"message","data":"a"},{"event":"message","data":"b"}]', 'CRLF line endings');
eq(J(P(['data: a\r\rdata: b\r\r'])), '[{"event":"message","data":"a"},{"event":"message","data":"b"}]', 'CR line endings');
eq(J(P(['data: a\r\ndata: b\ndata: c\r\r\n'])), '[{"event":"message","data":"a\\nb\\nc"}]', 'mixed line endings');
eq(J(P([': ping\n\ndata: a\n: comment inside\ndata: b\n\n'])), '[{"event":"message","data":"a\\nb"}]', 'comments ignored, even between data lines');
eq(J(P([':\n\n'])), '[]', 'bare colon comment');
eq(J(P(['data:x\n\n'])), '[{"event":"message","data":"x"}]', 'no space after colon');
eq(J(P(['data:  x\n\n'])), '[{"event":"message","data":" x"}]', 'only one leading space removed');
eq(J(P(['data\n\n'])), '[{"event":"message","data":""}]', 'field with no colon: empty data');
eq(J(P(['data: a:b:c\n\n'])), '[{"event":"message","data":"a:b:c"}]', 'colons in the value kept');
eq(J(P(['\n\n\n\n'])), '[]', 'blank lines alone dispatch nothing');
eq(J(P(['event: x\n\n'])), '[]', 'event name without data dispatches nothing');
eq(J(P(['retry: 1000\nid: 7\nfoo: bar\ndata: a\n\n'])), '[{"event":"message","data":"a"}]', 'retry, id and unknown fields ignored');
eq(J(P(['﻿data: a\n\n'])), '[{"event":"message","data":"a"}]', 'BOM stripped at the start');
eq(J(P(['data: ﻿a\n\n'])), '[{"event":"message","data":"﻿a"}]', 'BOM inside data kept');
eq(J(P(['', '﻿', 'data: a\n\n'])), '[{"event":"message","data":"a"}]', 'BOM after an empty read still stripped');
eq(J(P(['data: a'])), '[{"event":"message","data":"a"}]', 'end() flushes an unterminated last event');
eq(J(P(['data: a\n'])), '[{"event":"message","data":"a"}]', 'end() dispatches without the closing blank line');
eq(J(P(['data: a\r'])), '[{"event":"message","data":"a"}]', 'end() treats a held CR as a line end');
eq(J(P([])), '[]', 'nothing fed');
eq(J(P([null, undefined, ''])), '[]', 'null and undefined reads are empty');
{
  const p = C.createSSEParser();
  eq(J(p.feed('data: a\n')), '[]', 'no dispatch before the blank line');
  eq(J(p.feed('\n').map((e) => e.data)), '["a"]', 'dispatch on the blank line');
  eq(J(p.feed('data: b\r')), '[]', 'trailing CR held');
  eq(J(p.feed('\n')), '[]', 'CRLF across reads is one line end, not two');
  eq(J(p.feed('\r\n').map((e) => e.data)), '["b"]', 'then the blank line dispatches');
}
// Every split point of a small CRLF stream, and one character at a time.
{
  const sample = 'event: chunks\r\ndata: [{"a":1},\r\ndata: {"b":2}]\r\n\r\n: keep-alive\r\n\r\ndata: {"x":"é—…"}\r\n\r\ndata: [DONE]\r\n\r\n';
  const want = J(P([sample]));
  eq(J(JSON.parse(want).map((e) => e.event)), '["chunks","message","message"]', 'sample parses to three events');
  for (let i = 0; i <= sample.length; i++) eq(J(P([sample.slice(0, i), sample.slice(i)])), want, 'sample split at ' + i);
  for (let i = 1; i < sample.length; i += 3) {
    for (let j = i + 1; j < sample.length; j += 7) eq(J(P([sample.slice(0, i), sample.slice(i, j), sample.slice(j)])), want, 'sample split at ' + i + ' and ' + j);
  }
  eq(J(P(sample.split(''))), want, 'one character per read');
  eq(J(P([sample.replace(/\r\n/g, '\n')])), want, 'LF variant identical');
  eq(J(P([sample.replace(/\r\n/g, '\r')])), want, 'CR variant identical');
}
// interpretEvent
const IE = (event, data) => J(C.interpretEvent({ event: event, data: data }));
eq(IE('chunks', '[{"text":"x"}]'), '{"chunks":[{"text":"x"}]}', 'chunks event');
eq(IE('chunks', '{"not":"array"}'), '{}', 'chunks event that is not an array');
eq(IE('message', '[DONE]'), '{"done":true}', 'DONE');
eq(IE('message', ' [DONE] '), '{"done":true}', 'DONE with spaces');
eq(IE('message', '{"choices":[{"delta":{"content":"Hi"}}]}'), '{"text":"Hi"}', 'delta text');
eq(IE('message', '{"choices":[{"delta":{"content":""}}]}'), '{}', 'empty delta');
eq(IE('message', '{"choices":[{"delta":{}}],"usage":{"neurons":3}}'), '{"usage":{"neurons":3}}', 'usage record');
eq(IE('message', '{"choices":[{"delta":{"content":"a"}}],"usage":{"neurons":1}}'), '{"text":"a","usage":{"neurons":1}}', 'text and usage together');
eq(IE('message', '{"choices":[]}'), '{}', 'no choices');
eq(IE('message', '{"choices":[{"delta":{"content":7}}]}'), '{}', 'non-string content ignored');
eq(IE('message', 'not json'), '{}', 'unparseable data');
eq(IE('message', '{"error":{"message":"rate limited"}}'), '{"error":"rate limited"}', 'error payload');
eq(IE('error', '{"code":429}'), '{"error":"error"}', 'error event');
eq(J(C.interpretEvent(null)), '{}', 'null event');
// The recorded live stream (tools/fixtures/site-search-answer.sse).
const SSE_FIX = path.join(ROOT, 'tools', 'fixtures', 'site-search-answer.sse');
let fixtureAnswer = '', fixtureSourceChunks = null;
if (!fs.existsSync(SSE_FIX)) SKIP('fixture missing: ' + SSE_FIX);
else {
  const bytes = fs.readFileSync(SSE_FIX);
  const { TextDecoder } = require('util');
  const viaBytes = (cuts) => {
    const p = C.createSSEParser(), dec = new TextDecoder();
    let ev = [], last = 0;
    cuts.concat([bytes.length]).forEach((c) => { ev = ev.concat(p.feed(dec.decode(bytes.subarray(last, c), { stream: true }))); last = c; });
    ev = ev.concat(p.feed(dec.decode())).concat(p.end());
    return ev;
  };
  const whole = viaBytes([]);
  const summary = (ev) => {
    const out = { chunks: null, text: '', usage: null, done: 0, n: ev.length };
    ev.forEach((e) => {
      const r = C.interpretEvent(e);
      if (r.chunks) out.chunks = r.chunks.length;
      if (r.text) out.text += r.text;
      if (r.usage) out.usage = r.usage;
      if (r.done) out.done++;
    });
    return J(out);
  };
  const want = summary(whole);
  ok(whole.length > 10, 'fixture stream has events (' + whole.length + ')');
  eq(whole[0].event, 'chunks', 'first event is chunks');
  const first = C.interpretEvent(whole[0]);
  ok(Array.isArray(first.chunks) && first.chunks.length > 0, 'chunks event carries an array (' + (first.chunks || []).length + ')');
  fixtureSourceChunks = first.chunks;
  ok(first.chunks.every((c) => c.item && typeof c.item.key === 'string' && typeof c.text === 'string'), 'chunks have the search chunk shape');
  eq(whole[whole.length - 1].data, '[DONE]', 'last event is [DONE]');
  const s = JSON.parse(want);
  fixtureAnswer = s.text;
  ok(s.text.length > 40, 'answer text assembled (' + s.text.length + ' characters)');
  ok(/December 1/.test(s.text), 'answer mentions December 1');
  ok(s.usage && s.usage.neurons > 0, 'final usage record carries neurons');
  eq(s.done, 1, 'exactly one DONE');
  ok(whole.slice(1).every((e) => e.event === 'message'), 'every later event is a message');
  // Split the raw bytes at a sample of offsets: every 97th byte, both ends,
  // and around every multi-byte UTF-8 character and every line break.
  const offs = new Set([0, 1, 2, bytes.length - 2, bytes.length - 1, bytes.length]);
  for (let i = 0; i < bytes.length; i += 97) offs.add(i);
  for (let i = 0, nb = 0, nl = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0x80 && nb < 120) { offs.add(i); offs.add(i + 1); nb++; }
    if (bytes[i] === 0x0a && nl < 200) { offs.add(i); offs.add(i + 1); nl++; }
  }
  let splitOk = 0;
  offs.forEach((o) => { if (o >= 0 && o <= bytes.length && summary(viaBytes([o])) === want) splitOk++; });
  eq(splitOk, offs.size, 'fixture split at ' + offs.size + ' byte offsets: identical result every time');
  // Random small reads, as a browser delivers them (seeded, reproducible).
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let run = 0; run < 25; run++) {
    const cuts = [];
    for (let at = 0; at < bytes.length;) { at += 1 + Math.floor(rnd() * (run < 5 ? 8 : 300)); if (at < bytes.length) cuts.push(at); }
    eq(summary(viaBytes(cuts)), want, 'fixture in ' + (cuts.length + 1) + ' random reads (run ' + run + ')');
  }
  const txt = bytes.toString('utf8');
  eq(summary(P([txt.replace(/\n/g, '\r\n')]).map((e) => e)), want, 'fixture with CRLF line endings');
  eq(summary(P([txt.replace(/\n/g, '\r')])), want, 'fixture with CR line endings');
}

// ── O: Markdown renderer ──
sec('O');
const MD = (s) => C.renderMarkdown(s);
const MD_TAG = /^<(\/?(p|strong|em|ul|ol|li)|a href="[^"<>]*"|\/a)>$/;
function mdSafe(html) {
  const tags = html.match(/<[^>]*>?/g) || [];
  if (!tags.every((t) => MD_TAG.test(t))) return false;
  const hrefs = [...html.matchAll(/<a href="([^"]*)">/g)].map((m) => unesc(m[1]));
  if (!hrefs.every((h) => C.safeHref(h) === h)) return false;
  // Balanced and properly nested.
  const stack = [];
  for (const t of tags) {
    const m = /^<(\/?)([a-z]+)/.exec(t);
    if (!m[1]) stack.push(m[2]);
    else if (stack.pop() !== m[2]) return false;
  }
  return stack.length === 0;
}
eq(MD(''), '', 'empty');
eq(MD(null), '', 'null');
eq(MD('Hello'), '<p>Hello</p>', 'one paragraph');
eq(MD('One\n\nTwo'), '<p>One</p><p>Two</p>', 'two paragraphs');
eq(MD('One\nstill one'), '<p>One still one</p>', 'single newline joins the paragraph');
eq(MD('One\r\n\r\nTwo'), '<p>One</p><p>Two</p>', 'CRLF');
eq(MD('  \n\nText  \n\n  '), '<p>Text</p>', 'blank lines trimmed');
eq(MD('**bold** text'), '<p><strong>bold</strong> text</p>', 'bold');
eq(MD('*it* text'), '<p><em>it</em> text</p>', 'italic');
eq(MD('a *b* c'), '<p>a <em>b</em> c</p>', 'one-letter italic');
eq(MD('**a *b* c**'), '<p><strong>a <em>b</em> c</strong></p>', 'italic inside bold');
eq(MD('**a** and **b**'), '<p><strong>a</strong> and <strong>b</strong></p>', 'two bolds');
eq(MD('**unclosed bold'), '<p>**unclosed bold</p>', 'unclosed bold stays literal (mid-stream)');
eq(MD('*unclosed'), '<p>*unclosed</p>', 'unclosed italic stays literal');
eq(MD('2 * 3 * 4'), '<p>2 * 3 * 4</p>', 'spaced asterisks are not italic');
eq(MD('snake_case and __dunder__'), '<p>snake_case and __dunder__</p>', 'underscores literal');
eq(MD('** spaced **'), '<p>** spaced **</p>', 'bold needs no inner space at the edges');
eq(MD('- a\n- b'), '<ul><li>a</li><li>b</li></ul>', 'dash list');
eq(MD('* a\n* b'), '<ul><li>a</li><li>b</li></ul>', 'star list');
eq(MD('1. a\n2. b\n10. c'), '<ol><li>a</li><li>b</li><li>c</li></ol>', 'numbered list');
eq(MD('- a\n1. b'), '<ul><li>a</li></ul><ol><li>b</li></ol>', 'list type change starts a new list');
eq(MD('Intro:\n- a\n- b\nAfter'), '<p>Intro:</p><ul><li>a</li><li>b</li></ul><p>After</p>', 'paragraph, list, paragraph without blank lines');
eq(MD('- a\n  continued\n- b'), '<ul><li>a continued</li><li>b</li></ul>', 'indented continuation joins the item');
eq(MD('- **Bold** item with [link](/cpb.html)'), '<ul><li><strong>Bold</strong> item with <a href="/cpb.html">link</a></li></ul>', 'inline formatting inside items');
eq(MD('  - nested'), '<ul><li>nested</li></ul>', 'indented item flattened');
eq(MD('-not a list'), '<p>-not a list</p>', 'dash without space is text');
eq(MD('1.5 million'), '<p>1.5 million</p>', 'decimal is not a list');
eq(MD('### Heading'), '<p><strong>Heading</strong></p>', 'heading becomes a bold paragraph');
eq(MD('## Heading ##'), '<p><strong>Heading</strong></p>', 'closing hashes dropped');
eq(MD('#hashtag'), '<p>#hashtag</p>', 'hash without space is text');
eq(MD('a\n---\nb'), '<p>a</p><p>b</p>', 'rule dropped');
eq(MD('```\ncode\n```'), '<p>code</p>', 'fences dropped, content as text');
// Links
eq(MD('[Token economics](https://copilotplaybook.com/copilot-token-economics.html)'), '<p><a href="https://copilotplaybook.com/copilot-token-economics.html">Token economics</a></p>', 'on-site absolute link');
eq(MD('[w](https://www.copilotplaybook.com/cpb.html)'), '<p><a href="https://www.copilotplaybook.com/cpb.html">w</a></p>', 'www link');
eq(MD('[r](/cpb.html#section-2)'), '<p><a href="/cpb.html#section-2">r</a></p>', 'root-relative link');
eq(MD('[r](cpb.html?hl=x&y=z)'), '<p><a href="cpb.html?hl=x&amp;y=z">r</a></p>', 'relative link, ampersand escaped in the attribute');
eq(MD('[a](#top)'), '<p><a href="#top">a</a></p>', 'anchor link');
eq(MD('[a](../x.html)'), '<p><a href="../x.html">a</a></p>', 'parent-relative link');
eq(MD('[](https://copilotplaybook.com/)'), '<p><a href="https://copilotplaybook.com/">https://copilotplaybook.com/</a></p>', 'empty label shows the URL');
eq(MD('[**b**](/x.html)'), '<p><a href="/x.html"><strong>b</strong></a></p>', 'bold inside link text');
eq(MD('**[b](/x.html)**'), '<p>**<a href="/x.html">b</a>**</p>', 'bold never crosses a link boundary');
eq(MD('https://copilotplaybook.com/cpb.html'), '<p>https://copilotplaybook.com/cpb.html</p>', 'bare URL is text');
const UNSAFE = ['https://evil.example.com/', 'http://copilotplaybook.com/', 'javascript:alert(1)', 'JaVaScRiPt:alert', 'javascript:alert`1`',
  'data:text/html,hi', 'vbscript:x', 'mailto:a@b.c', 'tel:123', '//evil.com/x', '/\\evil.com', '\\\\evil.com', 'https://copilotplaybook.com.evil.com/',
  'https://copilotplaybook.com@evil.com/', 'https://copilotplaybook.comevil.com/', 'https:/copilotplaybook.com/', 'java&#115;cript:alert',
  'https://evil.com/?u=https://copilotplaybook.com/', 'ftp://copilotplaybook.com/', 'x:y', 'a"b', "a'b", 'a<b', 'a>b', 'a`b', '\u0001x', ''];
UNSAFE.forEach((u) => {
  eq(C.safeHref(u), null, 'safeHref rejects ' + JSON.stringify(u));
  const html = MD('[label](' + u + ')');
  ok(html.indexOf('<a ') < 0, 'unsafe link rendered without an anchor: ' + JSON.stringify(u) + ' -> ' + html);
  ok(mdSafe(html), 'unsafe link output is safe markup: ' + JSON.stringify(u));
});
eq(MD('[label](javascript:alert)'), '<p>label</p>', 'unsafe link: the label as plain text');
eq(MD('[x](javascript:alert(1))'), '<p>[x](javascript:alert(1))</p>', 'URL with parentheses is not a link at all');
['https://copilotplaybook.com', 'https://copilotplaybook.com/', 'https://COPILOTPLAYBOOK.COM/x', 'https://copilotplaybook.com?x=1', 'https://copilotplaybook.com#a',
  '/x', 'x.html', './x', '../x', '#a', '?q=1', 'customer-zero-starter-kit/index.html'].forEach((u) => eq(C.safeHref(u), u, 'safeHref keeps ' + u));
// Hostile model output.
const HOSTILE_MD = [
  '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><img src=x onerror=alert(1)>', "'><svg onload=alert(1)>",
  '[x](javascript:alert(1))', '[x](javascript:alert)', '[<img src=x onerror=1>](https://copilotplaybook.com/)',
  '[x](https://copilotplaybook.com/"onmouseover="alert(1))', "[x](https://copilotplaybook.com/'onmouseover='1)",
  '[x](https://copilotplaybook.com/" onmouseover="alert(1))', '**<b>bold</b>**', '*<i>x</i>*', '&lt;script&gt;alert(1)&lt;/script&gt;',
  '&#60;img src=x onerror=1&#62;', '&amp;lt;', '[a [b] c](https://copilotplaybook.com/)', '[[x]](https://copilotplaybook.com/)',
  '[x]([y](https://copilotplaybook.com/))', '[x](https://copilotplaybook.com/)(javascript:1)', '`<svg onload=1>`', '<a href="javascript:1">x</a>',
  '- <script>x</script>\n- [a](data:text/html,<script>)', '1. **[x](//evil.com)**', '<style>*{}</style>', '<iframe src=//evil.com>',
  '[x](https://copilotplaybook.com/</a><script>)', '**a [b** c](/x)', '[*a*](/x) *b [c* d](/y)', '\u0000<script>', '<!-- comment -->', '<![CDATA[x]]>'
];
HOSTILE_MD.forEach((h, i) => {
  const html = MD('Lead text ' + h + ' tail.\n\n' + h);
  ok(mdSafe(html), 'hostile #' + i + ' renders only p/strong/em/ul/ol/li/a href, balanced, safe hrefs: ' + html);
  ok(!/<(script|img|svg|iframe|style|b|i)\b/i.test(html), 'hostile #' + i + ': no raw tag');
  ok(!(html.match(/<[^>]*>/g) || []).some((t) => /on\w+=|javascript:|data:/i.test(t.replace(/href="[^"]*"/, ''))), 'hostile #' + i + ': no handler in any tag');
});
eq(MD('&lt;b&gt;'), '<p>&amp;lt;b&amp;gt;</p>', 'entities in model text shown literally, not decoded');
eq(MD('<b>x</b>'), '<p>&lt;b&gt;x&lt;/b&gt;</p>', 'tags escaped');
eq(MD('a & b'), '<p>a &amp; b</p>', 'ampersand escaped');
// Fuzz: random strings over the characters that matter.
{
  const ALPHA = ['*', '**', '[', ']', '(', ')', '<', '>', '"', "'", '&', '#', '-', '1.', ' ', '\n', '\n\n', 'a', 'b', '/', ':', 'javascript:', 'https://copilotplaybook.com/', '//', '`', '_', '\\', 'on', '='];
  let seed = 99;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  let allSafe = true, firstBad = '';
  for (let i = 0; i < 3000; i++) {
    let s = '';
    const len = 1 + rnd(40);
    for (let k = 0; k < len; k++) s += ALPHA[rnd(ALPHA.length)];
    const html = MD(s);
    if (!mdSafe(html) || /<(script|img|svg)/i.test(html)) { allSafe = false; firstBad = firstBad || JSON.stringify(s) + ' -> ' + html; }
  }
  ok(allSafe, '3000 fuzzed inputs render safe, balanced markup' + (firstBad ? ': ' + firstBad : ''));
}
// Progressive rendering: every prefix of the recorded answer is safe.
if (fixtureAnswer) {
  let allSafe = true;
  for (let i = 0; i <= fixtureAnswer.length; i++) if (!mdSafe(MD(fixtureAnswer.slice(0, i)))) allSafe = false;
  ok(allSafe, 'every prefix of the recorded answer renders safe markup');
  const html = MD(fixtureAnswer);
  ok(/<a href="https:\/\/copilotplaybook\.com\/[^"]+">/.test(html), 'recorded answer: its on-site link is kept');
  ok(html.startsWith('<p>'), 'recorded answer renders as paragraphs');
}

// ── P: sources and the copied answer ──
sec('P');
{
  const chunks = [];
  for (let i = 0; i < 12; i++) chunks.push(chunk(U(i % 7), 'Meter text about credits for chunk number ' + i, { title: 'Page ' + (i % 7) }));
  const src = C.buildSources(chunks, 'credits');
  eq(src.length, 5, 'at most five sources');
  eq(J(src.map((s) => s.n)), '[1,2,3,4,5]', 'numbered from 1');
  eq(J(src.map((s) => s.url)), J([0, 1, 2, 3, 4].map(U)), 'deduplicated by page in rank order');
  const pages = C.buildPages(chunks, 'credits', 5).pages;
  src.forEach((s, i) => eq(s.href, pages[i].href, 'source ' + (i + 1) + ' uses the same ?hl= link as the results'));
  ok(src.every((s) => /\?hl=/.test(s.href)), 'every source has a ?hl= link');
  eq(C.buildSources(chunks, 'credits', 2).length, 2, 'max honored');
  eq(C.buildSources([], 'x').length, 0, 'no chunks: no sources');
  eq(C.buildSources(undefined, 'x').length, 0, 'undefined chunks: no sources');
  eq(C.sourcesHtml([]), '', 'no sources: empty markup');
  eq(C.sourcesHtml([{ n: 1, title: 'A & B', url: 'https://copilotplaybook.com/a.html', href: 'https://copilotplaybook.com/a.html?hl=x%20y' }]),
    '<li><a href="https://copilotplaybook.com/a.html?hl=x%20y">A &amp; B</a></li>', 'source markup shape');
}
HOSTILE.forEach((h, i) => {
  const src = C.buildSources([chunk('https://copilotplaybook.com/x.html?a="' + h, 'Intro ' + h + ' credits', { title: h })], 'credits ' + h);
  const html = C.sourcesHtml(src);
  ok(tagsSafe(html) && !/<img|<svg|<script/i.test(html), 'sourcesHtml hostile #' + i + ': only li/a tags');
});
if (fixtureSourceChunks) {
  const q = 'What changes on December 1 for Copilot Business?';
  const src = C.buildSources(fixtureSourceChunks, q);
  ok(src.length >= 1 && src.length <= 5, 'fixture sources: 1 to 5 (' + src.length + ')');
  eq(new Set(src.map((s) => s.url)).size, src.length, 'fixture sources unique');
  eq(src[0].url, fixtureSourceChunks[0].item.key, 'fixture source 1 is the top chunk page');
  ok(src.every((s) => s.href.indexOf(s.url) === 0 && s.title.length > 0), 'fixture sources have titles and on-page links');
  const hl = src.map((s) => decodeURIComponent((s.href.split('?hl=')[1] || '')));
  ok(hl.every((p) => !/^copilot\b/i.test(p)), 'fixture source phrases never start at "Copilot" (' + J(hl) + ')');
}
eq(C.answerText('**Bold** and *it*.\n\n- one\n* two', []), 'Bold and it.\n\n- one\n- two', 'plain text: markers dropped');
eq(C.answerText('See [Token economics](https://copilotplaybook.com/t.html).', []), 'See Token economics (https://copilotplaybook.com/t.html).', 'link written out');
eq(C.answerText('[https://copilotplaybook.com/t.html](https://copilotplaybook.com/t.html)', []), 'https://copilotplaybook.com/t.html', 'URL label not repeated');
eq(C.answerText('[click](javascript:alert)', []), 'click', 'unsafe link: label only');
eq(C.answerText('### Head\ntext', []), 'Head\ntext', 'heading marker dropped');
eq(C.answerText('Answer.', [{ n: 1, title: 'T', url: 'https://copilotplaybook.com/t.html' }, { n: 2, title: 'U', url: 'https://copilotplaybook.com/u.html' }]),
  'Answer.\n\nSources:\n1. T - https://copilotplaybook.com/t.html\n2. U - https://copilotplaybook.com/u.html', 'sources appended, numbered');
eq(C.answerText('', null), '', 'empty answer');
eq(C.ANSWER_FOOT, 'AI-generated from the pages listed. Confirm pricing and licensing with Microsoft before quoting a customer.', 'footer line exactly');
eq(C.ANSWER_BUSY, 'The assistant is busy right now. The results below are still current.', 'busy line exactly');
eq(C.ANSWER_ASK, 'Get an AI answer', 'button label');
eq(C.ANSWER_WRITING, 'Writing' + ELL, 'writing state');

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
assigns.forEach((m) => ok(/^''$/.test(m[2].trim()) || /^core\.(resultsHtml|renderMarkdown|sourcesHtml)\(/.test(m[2].trim()), 'innerHTML fed only by \'\' or a core markup builder: ' + m[0]));
ok(assigns.some((m) => /core\.renderMarkdown\(/.test(m[2])) && assigns.some((m) => /core\.sourcesHtml\(/.test(m[2])), 'answer and sources rendered through the core builders');
ok(!/\.outerHTML\s*=/.test(src), 'no outerHTML');
ok(/b\.textContent = it\.label/.test(src), 'chip and suggestion labels set through textContent');
ok(/ui\.body\.textContent = core\.ANSWER_BUSY/.test(src), 'busy message set through textContent');
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
eq((src.match(/max_num_results/g) || []).length, 1, 'max_num_results appears once');
eq((src.match(/core\.requestBody\(query, \{ type: opts\.type, config: config/g) || []).length, 2, 'search and chat both build their body with core.requestBody');
ok(/config: config, stream: true \}\)\)/.test(src), 'chat requests a stream');
ok(/var log = function \(\) \{\};/.test(src), 'log() is a no-op hook until Phase D');
ok(/log\(\{ kind: 'vote'/.test(src) && /log\(\{ kind: 'answer'/.test(src), 'votes and answers call log()');
ok(!/sendBeacon/.test(src), 'nothing sent anywhere yet (Phase D)');
ok(/navigator\.clipboard\.writeText\(text\)/.test(src), 'copy uses navigator.clipboard');
ok(/history\.replaceState\(/.test(src) && !/history\.pushState/.test(src), 'hash kept with replaceState only');
ok(/streaming\.abort\(\)/.test(src) && /pending\.abort\(\)/.test(src), 'in-flight search and stream are aborted');
eq(C.VERSION, '4', 'module version');
eq(C.CONFIG_URL, '/data/site-search-config.json?v=4', 'config fetched with the same ?v as the script');
ok(/assets\/site-search\.js\?v=4/.test(src.split('\n')[0]), 'header names ?v=4');
ok(!fs.existsSync(path.join(ROOT, 'assets', 'site-search-jump.js')), 'assets/site-search-jump.js deleted');
ok(!/launcher\s*=\s*document\.createElement|attachShadow/.test(src), 'no launcher or floating UI yet (Phase C)');
const IDS = ['site-search-form', 'site-search-q', 'site-search-status', 'site-search-results', 'site-search-open-chat',
  'site-search-suggest', 'site-search-chips', 'site-search-ask', 'site-search-answer', 'site-search-answer-state', 'site-search-answer-body',
  'site-search-answer-sources', 'site-search-sources', 'site-search-answer-foot', 'site-search-answer-actions', 'site-search-copy',
  'site-search-vote-up', 'site-search-vote-down'];
IDS.forEach((id) => ok(src.indexOf("'" + id + "'") > 0, 'mount wires #' + id));
{
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  IDS.forEach((id) => eq((idx.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'index.html has #' + id + ' once'));
  {
    const at = idx.indexOf('id="site-search"');
    const card = idx.slice(at, idx.indexOf('</section>', at));
    IDS.forEach((id) => ok(card.indexOf('id="' + id + '"') > 0, '#' + id + ' sits inside the search card'));
    const order = ['site-search-form', 'site-search-suggest', 'site-search-chips', 'site-search-status', 'site-search-answer', 'site-search-results'].map((id) => card.indexOf('id="' + id + '"'));
    ok(order.every((v, i) => i === 0 || v > order[i - 1]), 'card order: box, suggestions, chips, status, answer panel, results');
    ok(/id="site-search-answer"[^>]*aria-live="polite"/.test(card), 'answer panel is aria-live polite');
    ok(/id="site-search-chips"[^>]*role="group"/.test(card), 'chips row is a labeled group');
    ok(/id="site-search-vote-up"[^>]*aria-pressed="false"/.test(card) && /id="site-search-vote-down"[^>]*aria-pressed="false"/.test(card), 'thumbs carry aria-pressed');
    ok(!/style="/.test(card), 'no inline style in the card (index.html is a pure-class file)');
  }
  ['.site-search-chip', '.site-search-suggestion', '.site-search-answer', '.site-search-sources', '.site-search-ask'].forEach((c) => ok(idx.indexOf('\n' + c + ' {') >= 0 || idx.indexOf('\n' + c + ',') >= 0 || idx.indexOf('\n' + c + ':') >= 0, 'index.html styles ' + c));
  ok(idx.indexOf('id="site-search"') > 0, 'index.html still has #site-search');
  eq((idx.match(/<script src="\/assets\/site-search\.js\?v=4" defer><\/script>/g) || []).length, 1, 'index.html loads the module once, ?v=4');
  ok(idx.indexOf('site-search.js?v=3') < 0, 'index.html no longer loads ?v=3');
  ok(idx.indexOf('site-search-jump.js') < 0, 'index.html no longer loads the jump file');
  ok(idx.indexOf('function fragmentFor') < 0, 'index.html inline search script removed');
  ok(/search-snippet\.es\.js/.test(idx), 'index.html keeps the chat bubble module');
}
ok(!/site-search\.js/.test(fs.readFileSync(path.join(ROOT, 'copilot-credit-planner.html'), 'utf8')), 'credit planner stays free of the module');

console.log('\n' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
process.exit(fail ? 1 : 0);
