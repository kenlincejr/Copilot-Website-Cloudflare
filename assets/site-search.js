/* assets/site-search.js?v=4: the one site search module
   (specs/site-search-v2.spec.md §3.1). Loaded by every page in sitemap.xml
   (see DESIGN.md 8b.5) except copilot-credit-planner.html, which stays free
   of external scripts.

   One IIFE, no dependencies, no build step, no browser storage. Sections:
     core   pure functions, no DOM; exported for Node tests (tools/test-site-search.js)
     api    requests to the AI Search /search and /chat/completions endpoints
     render results list, status text and the AI answer panel on the home-page card
     jump   ?hl=<phrase>: scroll to and highlight the matching passage
     mount  wires the home-page card (when #site-search exists) and runs jump

   Phase B (spec §4) adds, on the home page only: suggested questions (F2),
   page-type filter chips kept in the URL hash (F3), boosting, rewrite and
   rerank request options from data/site-search-config.json (F4, F5), and the
   streamed AI answer with numbered sources (F1).

   Under Node (module.exports defined) only core is exported and nothing
   touches the DOM or window. */
(function () {
  'use strict';

  var VERSION = '4';
  var ENDPOINT = 'https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/';
  var MAX_PAGES = 6;

  /* ───────────────────────────── core ───────────────────────────── */
  var core = {};

  core.VERSION = VERSION;
  core.ENDPOINT = ENDPOINT;
  core.SEARCH_URL = ENDPOINT + 'search';
  core.CHAT_URL = ENDPOINT + 'chat/completions';
  core.CONFIG_URL = '/data/site-search-config.json?v=' + VERSION;
  core.MAX_PAGES = MAX_PAGES;
  core.MAX_RESULTS = 20;
  core.MAX_SOURCES = 5;

  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  core.esc = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  };
  var reEsc = function (t) { return String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

  // Metadata and chunk text come back entity-encoded (e.g. &amp;); decode
  // once before escaping again. A single pass, so "&amp;lt;" becomes "&lt;".
  var NAMED = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    mdash: '—', ndash: '–', hellip: '…'
  };
  function codePoint(n) {
    if (!isFinite(n) || n <= 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return '�';
    return String.fromCodePoint(n);
  }
  core.decode = function (t) {
    return String(t == null ? '' : t).replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, function (m, e) {
      if (e[0] === '#') {
        return codePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      }
      return has(NAMED, e) ? NAMED[e] : m;
    });
  };

  // Chunks arrive as Markdown converted from the page; flatten to readable prose.
  core.plain = function (md) {
    return md
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s*\|?\s*:?-{2,}.*$/gm, ' ')
      .replace(/[#*_`>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // A page's first chunk opens with a front-matter block (---, description: ...).
  core.body = function (md) {
    return md.replace(/^---\n(?:[\w-]+:.*(?:\n|$))*(?:---\n?)?/, '');
  };

  core.hasTerm = function (text, terms) {
    var lower = text.toLowerCase();
    return terms.some(function (t) { return lower.indexOf(t) >= 0; });
  };

  // The whole query words worth matching (three letters or more), as typed.
  core.queryWords = function (query) {
    return query.replace(/[^\w\s-]/g, ' ').split(/\s+/)
      .filter(function (t) { return t.length > 2; });
  };

  // Words that say nothing about where a passage is: site-common words (every
  // page's breadcrumb says Copilot Playbook) and ordinary English stopwords.
  // Ignored when choosing the passage and phrase for a deep link.
  core.STOPWORDS = (
    'copilot microsoft partner partners playbook td synnex customer customers ' +
    'a an the and or but nor of to in on at by for with from into onto over under about ' +
    'as is are was were be been being am do does did doing done have has had having ' +
    'it its this that these those there here what which who whom whose how why when where ' +
    'can could should would will shall may might must not no yes so if then than too very ' +
    'i me my we us our ours you your yours they them their theirs he him his she her hers ' +
    'all any each both few more most other some such only own same just also get gets ' +
    'need needs want wants make makes use using used one ' +
    'tell show give explain please way ways thing things'
  ).split(' ').reduce(function (o, w) { o[w] = true; return o; }, {});
  core.isStop = function (w) { return has(core.STOPWORDS, String(w).toLowerCase()); };
  core.contentWords = function (words0) {
    return (words0 || []).filter(function (w) { return !core.isStop(w); });
  };

  // Crude stemming so "services" also finds "service" in the passage text:
  // words longer than four letters lose a trailing "es" or "s".
  core.stem = function (t) {
    t = t.toLowerCase();
    return t.length > 4 ? t.replace(/(es|s)$/, '') : t;
  };
  core.termsFor = function (words0) { return words0.map(core.stem); };

  // The terms that locate a passage: content words only, unless the query has
  // nothing else ("copilot"), in which case every word counts.
  core.locatorTerms = function (words0) {
    var content = core.contentWords(words0);
    var terms = core.termsFor(content.length ? content : (words0 || []));
    return terms.filter(function (t, i) { return terms.indexOf(t) === i; });
  };

  // Fallback when a page has no title metadata yet: turn the URL path into words.
  core.titleFromUrl = function (url) {
    var path = url.replace(/^https?:\/\/[^/]+\/?/, '').replace(/(index)?\.html$/, '').replace(/\/$/, '');
    var last = path.split('/').filter(Boolean).pop();
    if (!last) return 'Home';
    return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };

  // Escape text and wrap each query term (to the end of its word) in <mark>.
  // Matching runs on the raw text and each piece is escaped on its own, so a
  // term such as "amp" can never land inside an entity like &amp;.
  core.highlight = function (text, terms) {
    text = String(text);
    var list = (terms || []).filter(Boolean);
    if (!list.length) return core.esc(text);
    var re = new RegExp('(' + list.map(reEsc).join('|') + ')\\w*', 'gi');
    var out = '', last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      out += core.esc(text.slice(last, m.index)) + '<mark>' + core.esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + core.esc(text.slice(last));
  };

  // About 240 characters around the first query term found, terms highlighted.
  core.excerpt = function (text, terms) {
    var lower = text.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = lower.indexOf(terms[i]);
    var start = Math.max(0, (at < 0 ? 0 : at) - 80);
    var cut = text.slice(start, start + 240);
    if (start > 0) cut = '…' + cut.replace(/^\S*\s/, '');
    if (start + 240 < text.length) cut = cut.replace(/\s\S*$/, '') + '…';
    return core.highlight(cut, terms);
  };

  // The ?hl= phrase for a deep link. The passage is split into segments (lines
  // and table cells); segments under six words are dropped (breadcrumbs, labels,
  // headings that repeat on every page). The segment with the most distinct
  // content terms wins (tie: the earliest), and the phrase is up to five words
  // from its first matched term, stopping at a clause break so it stays inside
  // one element on the target page. Fallback: the longest content word.
  core.MIN_SEGMENT_WORDS = 6;
  core.fragmentFor = function (md, terms, words0) {
    words0 = words0 || [];
    var use = core.contentWords(words0).length ? core.locatorTerms(words0) : (terms || []);
    var tests = use.filter(Boolean).map(function (t) {
      return new RegExp('(^|[^a-z0-9])' + reEsc(String(t).toLowerCase()));
    });
    var best = null, bestScore = 0;
    String(md || '').split(/\n|\|/).map(core.plain).forEach(function (seg) {
      var words = seg ? seg.split(' ') : [];
      if (words.length < core.MIN_SEGMENT_WORDS) return;
      var hit = {}, score = 0, first = -1;
      for (var k = 0; k < words.length; k++) {
        var lw = words[k].toLowerCase();
        for (var i = 0; i < tests.length; i++) {
          if (tests[i].test(lw)) {
            if (first < 0) first = k;
            if (!hit[i]) { hit[i] = true; score++; }
          }
        }
      }
      if (score > bestScore) { bestScore = score; best = { words: words, first: first }; }
    });
    if (best) {
      var phrase = [];
      for (var n = best.first; n < best.words.length && phrase.length < 5; n++) {
        phrase.push(best.words[n]);
        if (/[.,;:!?”"')\]]$/.test(best.words[n])) break;
      }
      return phrase.join(' ').replace(/^[“‘"'(\[]+|[.,;:!?”’"')\]]+$/g, '');
    }
    // No usable segment: the rarest-looking query word, which jumps to its
    // first occurrence on the page.
    var pool = core.contentWords(words0);
    if (!pool.length) pool = words0;
    return pool.reduce(function (a, w) { return w.length > a.length ? w : a; }, '');
  };

  // ?hl= is read by the jump section on the target page, which scrolls to the
  // phrase. No #:~:text= fragment: Chrome's own handling of it reset the scroll
  // position the script had just set.
  core.deepLink = function (url, phrase) {
    if (!phrase) return url;
    return url + '?hl=' + encodeURIComponent(phrase);
  };

  // Group chunks by page in rank order; prefer the best-ranked chunk that
  // actually contains a content term, since semantic matches may not.
  core.buildPages = function (chunks, query, maxPages) {
    var words0 = core.queryWords(query);
    var terms = core.locatorTerms(words0);
    var order = [], byUrl = {};
    (chunks || []).forEach(function (c) {
      var url = c && c.item && c.item.key;
      if (!url) return;
      if (!has(byUrl, url)) { byUrl[url] = []; order.push(url); }
      byUrl[url].push(c);
    });
    var pages = [];
    order.slice(0, maxPages == null ? MAX_PAGES : maxPages).forEach(function (url) {
      var group = byUrl[url];
      var meta = group[0].item.metadata || {};
      var texts = group.map(function (c) { return core.body(core.decode(c.text || '')); });
      var md = texts.filter(function (t) { return core.hasTerm(t, terms); })[0] ||
        texts.filter(Boolean)[0] || core.decode(meta.description || '');
      pages.push({
        url: url,
        href: core.deepLink(url, core.fragmentFor(md, terms, words0)),
        title: meta.title ? core.decode(meta.title) : core.titleFromUrl(url),
        text: core.plain(md)
      });
    });
    return { pages: pages, terms: terms, words: words0 };
  };

  // The results list markup. Every value from the API passes through esc (or
  // excerpt, which escapes before adding <mark>).
  core.resultsHtml = function (pages, terms) {
    return pages.map(function (p) {
      return '<li><a href="' + core.esc(p.href) + '">' +
        '<span class="r-title">' + core.esc(p.title) + '</span>' +
        '<span class="r-url">' + core.esc(p.url.replace(/^https?:\/\//, '')) + '</span>' +
        (p.text ? '<span class="r-text">' + core.excerpt(p.text, terms) + '</span>' : '') +
        '</a></li>';
    }).join('');
  };

  core.statusText = function (n) {
    return n
      ? n + (n === 1 ? ' page matched.' : ' pages matched.')
      : 'No pages matched. Try different words.';
  };
  core.STATUS_SEARCHING = 'Searching…';
  core.STATUS_ERROR = 'Search is unavailable right now. Please try again shortly.';

  /* ── config (data/site-search-config.json) ── */

  core.CHIPS = ['all', 'playbook', 'engagement', 'tool', 'customer-zero', 'program'];
  core.CHIP_LABELS = {
    all: 'All',
    playbook: 'Playbook',
    engagement: 'Engagements',
    tool: 'Calculators and tools',
    'customer-zero': 'Customer Zero',
    program: 'Partner program'
  };

  // Identical to data/site-search-config.json; used when the fetch fails, so
  // search never depends on the config file.
  core.DEFAULT_CONFIG = {
    endpoint: ENDPOINT,
    logEndpoint: '',
    suggested: [
      'What changes on December 1 for Copilot Business?',
      'How do I price a managed Copilot service?',
      'What does a Copilot Studio agent engagement include?',
      'How do I run Customer Zero in my own tenant?'
    ],
    chips: core.CHIPS.slice(),
    pageAskExclude: ['/', '/index.html', '/frontier-navigator/pages/'],
    maxPages: MAX_PAGES,
    boost: true,
    rewriteMinWords: 0,
    rerank: false
  };

  var ENDPOINT_RE = /^https:\/\/[0-9a-f-]+\.search\.ai\.cloudflare\.com\/$/;
  var isInt = function (n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; };

  // Validate a config object field by field; anything missing or malformed
  // takes the default, so a bad edit to the JSON cannot break search.
  core.mergeConfig = function (raw) {
    var d = core.DEFAULT_CONFIG, c = {};
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    c.endpoint = typeof raw.endpoint === 'string' && ENDPOINT_RE.test(raw.endpoint) ? raw.endpoint : d.endpoint;
    c.logEndpoint = typeof raw.logEndpoint === 'string' && /^https:\/\/[^\s<>"']+$/.test(raw.logEndpoint) ? raw.logEndpoint : d.logEndpoint;
    var sug = Array.isArray(raw.suggested) ? raw.suggested.filter(function (s) {
      return typeof s === 'string' && s.trim().length > 0 && s.length <= 200;
    }).map(function (s) { return s.trim(); }).slice(0, 6) : null;
    c.suggested = sug && sug.length ? sug : d.suggested.slice();
    var chips = Array.isArray(raw.chips) ? raw.chips.filter(function (v, i, a) {
      return typeof v === 'string' && core.CHIPS.indexOf(v) >= 0 && a.indexOf(v) === i;
    }) : null;
    if (chips && chips.length && chips[0] !== 'all') chips = ['all'].concat(chips.filter(function (v) { return v !== 'all'; }));
    c.chips = chips && chips.length > 1 ? chips : d.chips.slice();
    c.pageAskExclude = Array.isArray(raw.pageAskExclude) ? raw.pageAskExclude.filter(function (s) { return typeof s === 'string'; }) : d.pageAskExclude.slice();
    c.maxPages = isInt(raw.maxPages) && raw.maxPages >= 1 && raw.maxPages <= 20 ? raw.maxPages : d.maxPages;
    c.boost = typeof raw.boost === 'boolean' ? raw.boost : d.boost;
    c.rewriteMinWords = isInt(raw.rewriteMinWords) && raw.rewriteMinWords >= 0 ? raw.rewriteMinWords : d.rewriteMinWords;
    c.rerank = typeof raw.rerank === 'boolean' ? raw.rerank : d.rerank;
    return c;
  };

  core.wordCount = function (q) {
    return String(q || '').trim().split(/\s+/).filter(Boolean).length;
  };

  // The one place a request body is built, for /search and /chat/completions.
  //   opts.type    a chip value; 'all' (or none) sends no filter
  //   opts.config  merged through mergeConfig
  //   opts.stream  true for /chat/completions
  core.requestBody = function (query, opts) {
    opts = opts || {};
    var cfg = core.mergeConfig(opts.config);
    var retrieval = { max_num_results: core.MAX_RESULTS };
    if (opts.type && opts.type !== 'all' && core.CHIPS.indexOf(opts.type) > 0) {
      retrieval.filters = { page_type: opts.type };
    }
    if (cfg.boost) retrieval.boost_by = [{ field: 'priority', direction: 'desc' }];
    var options = { retrieval: retrieval };
    if (cfg.rewriteMinWords > 0 && core.wordCount(query) >= cfg.rewriteMinWords) {
      options.query_rewrite = { enabled: true };
    }
    if (cfg.rerank) options.reranking = { enabled: true };
    var body = { messages: [{ role: 'user', content: query }] };
    if (opts.stream) body.stream = true;
    body.ai_search_options = options;
    return body;
  };

  // The v1 body: no filter, no boost, no rewrite, no rerank.
  core.searchBody = function (query) {
    return core.requestBody(query, { config: { boost: false, rewriteMinWords: 0, rerank: false } });
  };

  /* ── URL hash: #search=<query>&type=<chip> ── */

  core.parseHash = function (hash, chips) {
    var out = { query: '', type: 'all' };
    var s = String(hash || '').replace(/^#/, '');
    if (!/(^|&)(search|type)=/.test(s)) return out;
    var params = {};
    s.split('&').forEach(function (pair) {
      var i = pair.indexOf('='), k = i < 0 ? pair : pair.slice(0, i);
      if (has(params, k)) return; // first value wins, as URLSearchParams.get does
      var v = i < 0 ? '' : pair.slice(i + 1).replace(/\+/g, ' ');
      try { params[k] = decodeURIComponent(v); } catch (e) { params[k] = ''; }
    });
    var q = params.search;
    if (q) out.query = q.trim().slice(0, 300);
    var t = params.type;
    if (t && (chips || core.CHIPS).indexOf(t) >= 0) out.type = t;
    return out;
  };

  core.buildHash = function (query, type) {
    var parts = [];
    query = String(query || '').trim();
    if (query) parts.push('search=' + encodeURIComponent(query));
    if (type && type !== 'all') parts.push('type=' + encodeURIComponent(type));
    return parts.length ? '#' + parts.join('&') : '';
  };

  /* ── server-sent events ── */

  // An incremental parser for text/event-stream (the WHATWG rules): lines end
  // in CRLF, LF or CR; ':' starts a comment; "data" lines join with '\n'; a
  // blank line dispatches. feed() takes any slice of the text and returns the
  // events it completed; a line or a CRLF split across reads is held over.
  // end() flushes the last line and dispatches a pending event even without
  // the closing blank line, so a stream cut short still delivers what it sent.
  core.createSSEParser = function () {
    var buf = '', started = false, data = [], hasData = false, name = '', lastId = '';
    function line(l, out) {
      if (l === '') {
        if (hasData) out.push({ event: name || 'message', data: data.join('\n'), id: lastId });
        data = []; hasData = false; name = '';
        return;
      }
      if (l[0] === ':') return;
      var i = l.indexOf(':'), field = l, value = '';
      if (i >= 0) { field = l.slice(0, i); value = l.slice(i + 1); if (value[0] === ' ') value = value.slice(1); }
      if (field === 'data') { data.push(value); hasData = true; }
      else if (field === 'event') name = value;
      else if (field === 'id' && value.indexOf('\u0000') < 0) lastId = value;
    }
    function run(final) {
      var out = [], pos = 0, re = /\r\n|\r|\n/g, m;
      if (!started && buf) { started = true; if (buf.charCodeAt(0) === 0xfeff) buf = buf.slice(1); }
      re.lastIndex = 0;
      while ((m = re.exec(buf))) {
        if (m[0] === '\r' && m.index === buf.length - 1 && !final) break;
        line(buf.slice(pos, m.index), out);
        pos = m.index + m[0].length;
      }
      buf = buf.slice(pos);
      if (final) {
        if (buf) line(buf, out);
        buf = '';
        line('', out);
      }
      return out;
    }
    return {
      feed: function (text) { buf += String(text == null ? '' : text); return run(false); },
      end: function () { return run(true); }
    };
  };

  // What one event means for the answer panel:
  //   { chunks }  the retrieved sources (event: chunks)
  //   { text }    a piece of the answer
  //   { usage }   the closing usage record
  //   { done }    data: [DONE]
  //   { error }   an error event or payload
  // Unparseable data returns {}.
  core.interpretEvent = function (ev) {
    var out = {};
    if (!ev || typeof ev.data !== 'string') return out;
    if (ev.data.trim() === '[DONE]') { out.done = true; return out; }
    var j;
    try { j = JSON.parse(ev.data); } catch (e) { return out; }
    if (ev.event === 'chunks') {
      if (Array.isArray(j)) out.chunks = j;
      return out;
    }
    if (ev.event === 'error' || (j && typeof j === 'object' && j.error)) {
      out.error = String((j && j.error && (j.error.message || j.error)) || 'error');
      return out;
    }
    var ch = j && j.choices && j.choices[0];
    var piece = ch && ch.delta && ch.delta.content;
    if (typeof piece === 'string' && piece) out.text = piece;
    if (j && j.usage && typeof j.usage === 'object') out.usage = j.usage;
    return out;
  };

  /* ── the AI answer: strict Markdown subset ── */

  // A link is kept only if it stays on this site: https://copilotplaybook.com/...
  // (or www.), or a relative path with no scheme. Returns the URL or null.
  core.safeHref = function (url) {
    url = String(url == null ? '' : url);
    if (!url || url.length > 500) return null;
    if (/[\s\u0000-\u001f\u007f\\"'<>`]/.test(url)) return null;
    if (/&#/.test(url)) return null;
    if (/^https:\/\/(www\.)?copilotplaybook\.com(?=$|[/?#])/i.test(url)) return url;
    if (/^\/\//.test(url)) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
    if (/^[^/?#]*:/.test(url)) return null;
    return url;
  };

  // Bold and italic on text that is already escaped (so it holds no < or >).
  function emphasis(html) {
    return html
      .replace(/\*\*(?=\S)([^<>]*?\S)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?=[^\s*])([^*<>]*?[^\s*<>])\*(?![*\w])/g, '$1<em>$2</em>');
  }
  var LINK_RE = /\[([^\[\]\n]*)\]\(([^()\s]*)\)/g;
  core.inlineMarkdown = function (text) {
    text = String(text == null ? '' : text);
    var out = '', last = 0, m;
    var fmt = function (s) { return emphasis(core.esc(s)); };
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(text))) {
      out += fmt(text.slice(last, m.index));
      var href = core.safeHref(m[2]);
      var label = m[1] || (href ? m[2] : '');
      out += href ? '<a href="' + core.esc(href) + '">' + fmt(label) + '</a>' : core.esc(label);
      last = m.index + m[0].length;
    }
    return out + fmt(text.slice(last));
  };

  // Paragraphs, **bold**, *italic*, '-' '*' and '1.' lists, and on-site
  // [text](url) links. Everything is escaped first; the only tags emitted are
  // p, strong, em, ul, ol, li and a href. A Markdown heading becomes a bold
  // paragraph; rules and fences are dropped. Run again on the whole text as
  // each piece streams in.
  core.renderMarkdown = function (md) {
    var lines = String(md == null ? '' : md).replace(/\r\n?/g, '\n').split('\n');
    var html = '', para = [], list = null;
    function flushPara() {
      if (para.length) html += '<p>' + core.inlineMarkdown(para.join(' ')) + '</p>';
      para = [];
    }
    function flushList() {
      if (list) {
        html += '<' + list.tag + '>' + list.items.map(function (it) {
          return '<li>' + core.inlineMarkdown(it) + '</li>';
        }).join('') + '</' + list.tag + '>';
      }
      list = null;
    }
    lines.forEach(function (raw) {
      var l = raw.replace(/\s+$/, '');
      var item = /^\s*(?:([-*])|(\d{1,3})\.)\s+(\S.*)$/.exec(l);
      var head = /^\s{0,3}#{1,6}\s+(.*?)\s*#*$/.exec(l);
      if (!l.trim() || /^\s*(-{3,}|\*{3,}|_{3,}|`{3,}.*)$/.test(l)) { flushPara(); flushList(); return; }
      if (item) {
        flushPara();
        var tag = item[1] ? 'ul' : 'ol';
        if (list && list.tag !== tag) flushList();
        if (!list) list = { tag: tag, items: [] };
        list.items.push(item[3]);
        return;
      }
      if (head) {
        flushPara(); flushList();
        if (head[1]) html += '<p><strong>' + core.inlineMarkdown(head[1]) + '</strong></p>';
        return;
      }
      if (list && /^\s+\S/.test(l)) { list.items[list.items.length - 1] += ' ' + l.trim(); return; }
      flushList();
      para.push(l.trim());
    });
    flushPara(); flushList();
    return html;
  };

  // The answer as plain text for the clipboard: Markdown markers dropped,
  // links written out, the numbered sources appended.
  core.answerText = function (md, sources) {
    var text = String(md == null ? '' : md).replace(/\r\n?/g, '\n')
      .replace(LINK_RE, function (m, label, url) {
        if (!core.safeHref(url)) return label;
        return !label || label === url ? url : label + ' (' + url + ')';
      })
      .replace(/\*\*(\S(?:[^*]*?\S)?)\*\*/g, '$1')
      .replace(/(^|[^*\w])\*(\S(?:[^*]*?\S)?)\*(?![*\w])/g, '$1$2')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s*\*\s+/gm, '- ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (sources && sources.length) {
      text += '\n\nSources:\n' + sources.map(function (s) { return s.n + '. ' + s.title + ' - ' + s.url; }).join('\n');
    }
    return text;
  };

  // Sources for the answer: the chunks event deduplicated by page in rank
  // order, at most five, each with the same ?hl= deep link the results use.
  core.buildSources = function (chunks, query, max) {
    return core.buildPages(chunks, query, max == null ? core.MAX_SOURCES : max).pages.map(function (p, i) {
      return { n: i + 1, title: p.title, url: p.url, href: p.href };
    });
  };
  core.sourcesHtml = function (sources) {
    return (sources || []).map(function (s) {
      return '<li><a href="' + core.esc(s.href) + '">' + core.esc(s.title) + '</a></li>';
    }).join('');
  };

  core.ANSWER_ASK = 'Get an AI answer';
  core.ANSWER_WRITING = 'Writing…';
  core.ANSWER_BUSY = 'The assistant is busy right now. The results below are still current.';
  core.ANSWER_FOOT = 'AI-generated from the pages listed. Confirm pricing and licensing with Microsoft before quoting a customer.';

  // Jump: text is compared with whitespace collapsed and case folded.
  core.normText = function (t) { return String(t).replace(/\s+/g, ' ').toLowerCase(); };

  // Concatenate text chunks (one per text node, in document order), inserting a
  // space between chunks that would otherwise run together, and return the
  // index of the chunk where the phrase starts, or -1. A phrase that crosses
  // inline markup (<strong>, <a>) still matches.
  core.findPhraseIndex = function (texts, phrase) {
    var target = core.normText(String(phrase || '').trim());
    if (!target) return -1;
    var starts = [], text = '';
    for (var i = 0; i < texts.length; i++) {
      var t = core.normText(texts[i] == null ? '' : texts[i]);
      if (!t) continue;
      if (text && text.slice(-1) !== ' ' && t[0] !== ' ') text += ' ';
      starts.push({ index: i, start: text.length });
      text += t;
    }
    var at = text.indexOf(target);
    if (at < 0) return -1;
    for (var j = starts.length - 1; j >= 0; j--) {
      if (starts[j].start <= at) return starts[j].index;
    }
    return -1;
  };

  core.HIT_CLASS = 'site-search-hit';
  core.HIT_STYLE =
    '.site-search-hit{background:rgba(72,202,228,.22);outline:2px solid #48cae4;' +
    'outline-offset:3px;border-radius:4px;transition:background .6s,outline-color .6s}';
  core.HIT_BLOCK = 'p, li, td, th, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6';
  core.JUMP_SKIP = 'nav, footer, #site-search';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports.SiteSearchCore = core;
    return;
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  /* ───────────────────────────── api ───────────────────────────── */
  var api = {};
  var config = core.mergeConfig(null);

  // Fetched once; any failure (network, status, bad JSON) keeps the defaults.
  api.loadConfig = function () {
    return fetch(core.CONFIG_URL, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (raw) { config = core.mergeConfig(raw); return config; })
      .catch(function () { config = core.mergeConfig(null); return config; });
  };

  api.search = function (query, opts) {
    opts = opts || {};
    return fetch(config.endpoint + 'search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(core.requestBody(query, { type: opts.type, config: config })),
      signal: opts.signal
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return (d.result && d.result.chunks) || []; });
  };

  // Stream an answer. handlers: onChunks(chunks), onText(piece), onUsage(u).
  // Resolves when the stream ends; rejects on HTTP errors, stream errors and
  // timeouts (Error 'timeout'); an abort through opts.signal rejects with the
  // AbortError.
  api.chat = function (query, opts, handlers) {
    opts = opts || {};
    handlers = handlers || {};
    var ctrl = new AbortController(), timer = null, timedOut = false;
    var IDLE_MS = 25000;
    function arm() {
      clearTimeout(timer);
      timer = setTimeout(function () { timedOut = true; ctrl.abort(); }, IDLE_MS);
    }
    if (opts.signal) {
      if (opts.signal.aborted) ctrl.abort();
      else opts.signal.addEventListener('abort', function () { ctrl.abort(); });
    }
    arm();
    var parser = core.createSSEParser();
    function handle(events) {
      for (var i = 0; i < events.length; i++) {
        var r = core.interpretEvent(events[i]);
        if (r.error) throw new Error(r.error);
        if (r.chunks && handlers.onChunks) handlers.onChunks(r.chunks);
        if (r.text && handlers.onText) handlers.onText(r.text);
        if (r.usage && handlers.onUsage) handlers.onUsage(r.usage);
      }
    }
    return fetch(config.endpoint + 'chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(core.requestBody(query, { type: opts.type, config: config, stream: true })),
      signal: ctrl.signal
    }).then(function (r) {
      if (!r.ok || !r.body) throw new Error(r.status || 'no body');
      var reader = r.body.getReader(), decoder = new TextDecoder();
      return (function pump() {
        return reader.read().then(function (step) {
          arm();
          if (step.done) { handle(parser.feed(decoder.decode())); handle(parser.end()); return; }
          handle(parser.feed(decoder.decode(step.value, { stream: true })));
          return pump();
        });
      })();
    }).then(function () { clearTimeout(timer); }, function (err) {
      clearTimeout(timer);
      throw timedOut ? new Error('timeout') : err;
    });
  };

  /* ───────────────────────────── log ───────────────────────────── */
  // Phase D (F11) wires this to the log Worker. Until then it does nothing.
  var log = function () {};

  /* ───────────────────────────── render ───────────────────────────── */
  var render = {};

  render.results = function (els, chunks, query) {
    var built = core.buildPages(chunks, query, config.maxPages);
    els.list.innerHTML = core.resultsHtml(built.pages, built.terms);
    els.status.textContent = core.statusText(built.pages.length);
    return built.pages.length;
  };

  render.clear = function (els) {
    els.list.innerHTML = '';
    els.status.textContent = '';
  };

  // Buttons are built with createElement and textContent: config text never
  // reaches innerHTML.
  render.buttons = function (box, items, cls) {
    while (box.firstChild) box.removeChild(box.firstChild);
    return items.map(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = it.label;
      if (it.pressed != null) b.setAttribute('aria-pressed', it.pressed ? 'true' : 'false');
      if (it.value != null) b.setAttribute('data-value', it.value);
      box.appendChild(b);
      return b;
    });
  };

  /* ───────────────────────────── jump ───────────────────────────── */
  var jump = {};

  // Visible text nodes in document order, outside nav, footer and the search card.
  jump.textNodes = function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest(core.JUMP_SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  };

  jump.locate = function (phrase) {
    var nodes = jump.textNodes();
    var i = core.findPhraseIndex(nodes.map(function (n) { return n.textContent; }), phrase);
    return i < 0 ? null : nodes[i];
  };

  jump.to = function (phrase) {
    var node = jump.locate(phrase);
    if (!node) return false;
    var details = node.parentElement.closest('details');
    while (details) {
      details.open = true;
      details = details.parentElement && details.parentElement.closest('details');
    }
    var block = node.parentElement.closest(core.HIT_BLOCK) || node.parentElement;
    block.classList.add(core.HIT_CLASS);
    // Instant scroll, then once more after late layout (fonts, images, scripted
    // content) has had a chance to move the target.
    block.scrollIntoView({ block: 'center' });
    setTimeout(function () { block.scrollIntoView({ block: 'center' }); }, 450);
    setTimeout(function () { block.classList.remove(core.HIT_CLASS); }, 6000);
    return true;
  };

  jump.run = function () {
    var phrase;
    try { phrase = new URLSearchParams(location.search).get('hl'); } catch (e) { return; }
    if (!phrase || !phrase.trim()) return;

    var style = document.createElement('style');
    style.textContent = core.HIT_STYLE;
    document.head.appendChild(style);

    // Some pages render content with script; retry briefly before giving up.
    function start() {
      var tries = 0;
      (function attempt() {
        if (jump.to(phrase) || ++tries > 10) return;
        setTimeout(attempt, 300);
      })();
    }
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  };

  /* ───────────────────────────── mount ───────────────────────────── */
  var mount = {};

  mount.embedded = function () {
    var framed;
    try { framed = window.top !== window; } catch (e) { framed = true; }
    return framed || !!(document.body && document.body.classList.contains('embedded'));
  };

  // The home-page search card: markup and CSS live in index.html.
  mount.inline = function () {
    var $ = function (id) { return document.getElementById(id); };
    var form = $('site-search-form');
    var input = $('site-search-q');
    var els = { status: $('site-search-status'), list: $('site-search-results') };
    if (!form || !input || !els.status || !els.list) return;
    var ui = {
      suggest: $('site-search-suggest'),
      chips: $('site-search-chips'),
      ask: $('site-search-ask'),
      panel: $('site-search-answer'),
      state: $('site-search-answer-state'),
      body: $('site-search-answer-body'),
      sourcesWrap: $('site-search-answer-sources'),
      sources: $('site-search-sources'),
      foot: $('site-search-answer-foot'),
      actions: $('site-search-answer-actions'),
      copy: $('site-search-copy'),
      up: $('site-search-vote-up'),
      down: $('site-search-vote-down')
    };
    var answerUi = ui.ask && ui.panel && ui.state && ui.body && ui.sources && ui.sourcesWrap &&
      ui.foot && ui.actions && ui.copy && ui.up && ui.down;

    var state = {
      query: '',          // the query of the results on screen
      type: 'all',
      chunks: [],         // the chunks behind those results
      pages: 0,
      answerKey: null,    // query + type the panel holds an answer for
      answerText: '',
      sources: [],
      vote: null
    };
    var pending = null, streaming = null;
    var keyOf = function (q, t) { return t + '\u0000' + q; };

    function setHash() {
      var h = core.buildHash(state.query, state.type);
      try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) { /* file:// or sandboxed */ }
    }

    /* answer panel */
    function stopStream() {
      if (streaming) { streaming.abort(); streaming = null; }
    }
    function clearAnswer() {
      stopStream();
      state.answerKey = null;
      state.answerText = '';
      state.sources = [];
      state.vote = null;
      if (!answerUi) return;
      ui.panel.hidden = true;
      ui.panel.removeAttribute('aria-busy');
      ui.state.textContent = '';
      ui.body.innerHTML = '';
      ui.sources.innerHTML = '';
      ui.sourcesWrap.hidden = true;
      ui.foot.hidden = true;
      ui.actions.hidden = true;
      ui.copy.textContent = 'Copy answer';
      ui.up.setAttribute('aria-pressed', 'false');
      ui.down.setAttribute('aria-pressed', 'false');
    }
    function showAsk(on) { if (answerUi) ui.ask.hidden = !on; }

    function renderSources(chunks) {
      state.sources = core.buildSources(chunks, state.query, core.MAX_SOURCES);
      ui.sources.innerHTML = core.sourcesHtml(state.sources);
      ui.sourcesWrap.hidden = !state.sources.length;
    }

    function answerFailed() {
      ui.panel.removeAttribute('aria-busy');
      ui.state.textContent = '';
      ui.body.textContent = core.ANSWER_BUSY;
      ui.sourcesWrap.hidden = true;
      ui.foot.hidden = true;
      ui.actions.hidden = true;
    }

    function getAnswer() {
      if (!answerUi || !state.query) return;
      var query = state.query, type = state.type;
      clearAnswer();
      state.answerKey = keyOf(query, type);
      showAsk(false);
      ui.panel.hidden = false;
      ui.panel.setAttribute('aria-busy', 'true');
      ui.state.textContent = core.ANSWER_WRITING;
      var ctrl = new AbortController();
      streaming = ctrl;
      var text = '';
      log({ kind: 'answer', q: query, filter: type });
      api.chat(query, { type: type, signal: ctrl.signal }, {
        // A stream that outlives its abort must not touch the panel again.
        onChunks: function (chunks) { if (streaming !== ctrl) return; renderSources(chunks); },
        onText: function (piece) {
          if (streaming !== ctrl) return;
          text += piece;
          state.answerText = text;
          ui.body.innerHTML = core.renderMarkdown(text);
        }
      }).then(function () {
        if (streaming !== ctrl) return;
        streaming = null;
        if (!text.trim()) { answerFailed(); return; }
        // No chunks event (or an empty one): the search results' chunks are the same retrieval.
        if (!state.sources.length) renderSources(state.chunks);
        ui.panel.removeAttribute('aria-busy');
        ui.state.textContent = '';
        ui.foot.hidden = false;
        ui.actions.hidden = false;
      }, function (err) {
        if (streaming !== ctrl) return;
        streaming = null;
        if (err && err.name === 'AbortError') return;
        answerFailed();
      });
    }

    if (answerUi) {
      ui.foot.textContent = core.ANSWER_FOOT;
      ui.ask.textContent = core.ANSWER_ASK;
      ui.ask.addEventListener('click', getAnswer);
      ui.copy.addEventListener('click', function () {
        var text = core.answerText(state.answerText, state.sources);
        var done = function (msg) {
          ui.copy.textContent = msg;
          setTimeout(function () { ui.copy.textContent = 'Copy answer'; }, 2000);
        };
        if (!navigator.clipboard || !navigator.clipboard.writeText) { done('Copy failed'); return; }
        navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done('Copy failed'); });
      });
      [[ui.up, 'up'], [ui.down, 'down']].forEach(function (pair) {
        pair[0].addEventListener('click', function () {
          state.vote = state.vote === pair[1] ? null : pair[1];
          ui.up.setAttribute('aria-pressed', state.vote === 'up' ? 'true' : 'false');
          ui.down.setAttribute('aria-pressed', state.vote === 'down' ? 'true' : 'false');
          log({ kind: 'vote', q: state.query, filter: state.type, vote: state.vote });
        });
      });
    }

    /* search */
    function run(query) {
      query = String(query || '').trim();
      if (!query) return;
      var key = keyOf(query, state.type);
      var keep = state.answerKey === key && !streaming;
      if (!keep) clearAnswer();
      showAsk(false);
      if (pending) pending.abort();
      pending = new AbortController();
      var ctrl = pending, type = state.type;
      state.query = query;
      setHash();
      els.status.textContent = core.STATUS_SEARCHING;
      els.list.innerHTML = '';
      api.search(query, { type: type, signal: ctrl.signal })
        .then(function (chunks) {
          if (pending !== ctrl) return;
          pending = null;
          state.chunks = chunks;
          state.pages = render.results(els, chunks, query);
          showAsk(state.pages > 0 && state.answerKey !== key);
          log({ kind: state.pages ? 'search' : 'zero', q: query, filter: type, n_results: state.pages });
        })
        .catch(function (err) {
          if (pending === ctrl) pending = null;
          if (err.name !== 'AbortError') els.status.textContent = core.STATUS_ERROR;
        });
    }

    function clearAll() {
      if (pending) { pending.abort(); pending = null; }
      render.clear(els);
      clearAnswer();
      showAsk(false);
      state.query = '';
      state.chunks = [];
      setHash();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      run(input.value);
    });

    /* chips and suggestions (F2, F3) */
    var chipButtons = [];
    function paintChips() {
      chipButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-value') === state.type ? 'true' : 'false');
      });
    }
    function drawControls() {
      if (ui.chips) {
        if (config.chips.indexOf(state.type) < 0) state.type = 'all';
        chipButtons = render.buttons(ui.chips, config.chips.map(function (v) {
          return { label: core.CHIP_LABELS[v], value: v, pressed: v === state.type };
        }), 'site-search-chip');
        chipButtons.forEach(function (b) {
          b.addEventListener('click', function () {
            var v = b.getAttribute('data-value');
            if (v === state.type) return;
            state.type = v;
            paintChips();
            var q = input.value.trim() || state.query;
            if (q) run(q); else setHash();
          });
        });
      }
      if (ui.suggest) {
        render.buttons(ui.suggest, config.suggested.map(function (s) { return { label: s }; }), 'site-search-suggestion')
          .forEach(function (b) {
            b.addEventListener('click', function () {
              input.value = b.textContent;
              run(b.textContent);
            });
          });
      }
    }

    // Open the chat bubble from the search card. Its shadow root is open, so its
    // own launcher button can be clicked; if the module never loaded, hide the offer.
    var chatOffer = $('site-search-open-chat');
    if (chatOffer) {
      chatOffer.addEventListener('click', function (e) {
        e.stopPropagation();
        var bubble = document.querySelector('chat-bubble-snippet');
        var launcher = bubble && bubble.shadowRoot && bubble.shadowRoot.querySelector('.bubble-button');
        var win = bubble && bubble.shadowRoot && bubble.shadowRoot.querySelector('.chat-window');
        // Deferred so the bubble's own outside-click handling does not close it again.
        if (launcher && !(win && win.classList.contains('expanded'))) setTimeout(function () { launcher.click(); }, 0);
      });
      setTimeout(function () {
        if (!customElements.get('chat-bubble-snippet')) chatOffer.parentElement.hidden = true;
      }, 8000);
    }

    // Results and the answer close on Escape or on any click outside the card.
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') clearAll();
    });
    document.addEventListener('click', function (e) {
      var open = els.list.firstChild || els.status.textContent || (answerUi && !ui.panel.hidden);
      if (open && !e.target.closest('#site-search')) clearAll();
    });

    // Restore a shared #search=...&type=... once the config is in.
    var restored = core.parseHash(location.hash, core.CHIPS);
    state.type = restored.type;
    drawControls();
    api.loadConfig().then(function () {
      if (config.chips.indexOf(state.type) < 0) state.type = 'all';
      drawControls();
      if (restored.query) {
        input.value = restored.query;
        run(restored.query);
      }
    });
  };

  mount.run = function () {
    if (mount.embedded()) return;
    if (document.getElementById('site-search')) mount.inline();
    jump.run();
  };

  mount.run();
})();
