/* assets/site-search.js?v=6: the one site search module
   (specs/site-search-v2.spec.md §3.1). Loaded by every page in sitemap.xml
   (see DESIGN.md 8b.5) except copilot-credit-planner.html, which stays free
   of external scripts.

   One IIFE, no dependencies, no build step, no browser storage. Sections:
     core   pure functions, no DOM; exported for Node tests (tools/test-site-search.js)
     api    requests to the AI Search /search and /chat/completions endpoints
     log    anonymous search events, batched in memory, sent with sendBeacon (F11)
     render results list, status text, the suggestion line
     search one search UI (box, suggestions, results, AI answer, sources),
            rendered into the home-page card or into the launcher panel
     jump   ?hl=<phrase>: scroll to and highlight the matching passage
     mount  the home-page card (when #site-search exists), otherwise the
            floating launcher; the keyboard shortcuts; "Read this next"; jump

   Phase B (spec §4): suggested searches (F2), boosting, rewrite and rerank
   request options from data/site-search-config.json (F4, F5), and the
   streamed AI answer with numbered sources (F1). The page-type filter chips
   (F3) were removed on 2026-10-12; the page_type metadata stays.

   Phase C: the launcher and Ctrl+K / Cmd+K / "/" (F6), Ask about this page
   (F7) and "Read this next" (F8), each in a shadow root (spec D3) whose
   stylesheet uses literal DESIGN §1 values. No UI runs inside a frame or when
   body.embedded is set. Logging (F11) sends nothing when logEndpoint is empty.

   Under Node (module.exports defined) only core is exported and nothing
   touches the DOM or window. */
(function () {
  'use strict';

  var VERSION = '6';
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

  // Identical to data/site-search-config.json; used when the fetch fails, so
  // search never depends on the config file. A suggestion is a short link
  // label and the full question it runs.
  core.DEFAULT_CONFIG = {
    endpoint: ENDPOINT,
    logEndpoint: 'https://playbook-search-log.ken-lince.workers.dev/',
    suggested: [
      { label: 'December 1 changes', query: 'What changes on December 1 for Copilot Business?' },
      { label: 'Managed service pricing', query: 'How do I price a managed Copilot service?' },
      { label: 'Studio agents', query: 'What does a Copilot Studio agent engagement include?' },
      { label: 'Customer Zero', query: 'How do I run Customer Zero in my own tenant?' }
    ],
    pageAskExclude: ['/', '/index.html', '/frontier-navigator/pages/'],
    maxPages: MAX_PAGES,
    boost: true,
    rewriteMinWords: 0,
    rerank: false,
    answerMaxResults: 10
  };

  var ENDPOINT_RE = /^https:\/\/[0-9a-f-]+\.search\.ai\.cloudflare\.com\/$/;
  var isInt = function (n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; };

  // One suggestion: { label, query } (a bare string is both). Null if unusable.
  core.suggestion = function (s) {
    if (typeof s === 'string') s = { label: s, query: s };
    if (!s || typeof s !== 'object' || typeof s.label !== 'string' || typeof s.query !== 'string') return null;
    var label = s.label.trim(), query = s.query.trim();
    if (!label || !query || label.length > 80 || query.length > 200) return null;
    return { label: label, query: query };
  };

  // Validate a config object field by field; anything missing or malformed
  // takes the default, so a bad edit to the JSON cannot break search. An
  // empty logEndpoint is valid and turns logging off.
  core.mergeConfig = function (raw) {
    var d = core.DEFAULT_CONFIG, c = {};
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    c.endpoint = typeof raw.endpoint === 'string' && ENDPOINT_RE.test(raw.endpoint) ? raw.endpoint : d.endpoint;
    c.logEndpoint = typeof raw.logEndpoint === 'string' && (raw.logEndpoint === '' || /^https:\/\/[^\s<>"']+$/.test(raw.logEndpoint)) ? raw.logEndpoint : d.logEndpoint;
    var sug = Array.isArray(raw.suggested) ? raw.suggested.map(core.suggestion).filter(Boolean).slice(0, 6) : null;
    c.suggested = sug && sug.length ? sug : d.suggested.map(function (x) { return { label: x.label, query: x.query }; });
    c.pageAskExclude = Array.isArray(raw.pageAskExclude) ? raw.pageAskExclude.filter(function (s) { return typeof s === 'string'; }) : d.pageAskExclude.slice();
    c.maxPages = isInt(raw.maxPages) && raw.maxPages >= 1 && raw.maxPages <= 20 ? raw.maxPages : d.maxPages;
    c.boost = typeof raw.boost === 'boolean' ? raw.boost : d.boost;
    c.rewriteMinWords = isInt(raw.rewriteMinWords) && raw.rewriteMinWords >= 0 ? raw.rewriteMinWords : d.rewriteMinWords;
    c.rerank = typeof raw.rerank === 'boolean' ? raw.rerank : d.rerank;
    c.answerMaxResults = isInt(raw.answerMaxResults) && raw.answerMaxResults >= 1 && raw.answerMaxResults <= core.MAX_RESULTS ? raw.answerMaxResults : d.answerMaxResults;
    return c;
  };

  core.wordCount = function (q) {
    return String(q || '').trim().split(/\s+/).filter(Boolean).length;
  };

  // The one place a request body is built, for /search and /chat/completions.
  //   opts.config    merged through mergeConfig
  //   opts.stream    true for /chat/completions; retrieves config.answerMaxResults
  //                  chunks instead of 20, which roughly halves an answer's cost
  //   opts.filters   Ask about this page only: { filename, folder } from
  //                  core.pageFilter. Search sends no filter.
  //   opts.messages  a conversation from core.chatMessages; default is the one
  //                  user message
  core.requestBody = function (query, opts) {
    opts = opts || {};
    var cfg = core.mergeConfig(opts.config);
    var retrieval = { max_num_results: opts.stream ? cfg.answerMaxResults : core.MAX_RESULTS };
    var f = opts.filters;
    if (f && typeof f === 'object' && !Array.isArray(f)) {
      var filters = {}, n = 0;
      Object.keys(f).forEach(function (k) {
        if (typeof f[k] === 'string' && f[k]) { filters[k] = f[k]; n++; }
      });
      if (n) retrieval.filters = filters;
    }
    if (cfg.boost) retrieval.boost_by = [{ field: 'priority', direction: 'desc' }];
    var options = { retrieval: retrieval };
    if (cfg.rewriteMinWords > 0 && core.wordCount(query) >= cfg.rewriteMinWords) {
      options.query_rewrite = { enabled: true };
    }
    if (cfg.rerank) options.reranking = { enabled: true };
    var messages = Array.isArray(opts.messages) && opts.messages.length ? opts.messages : [{ role: 'user', content: query }];
    var body = { messages: messages };
    if (opts.stream) body.stream = true;
    body.ai_search_options = options;
    return body;
  };

  // The v1 body: no filter, no boost, no rewrite, no rerank.
  core.searchBody = function (query) {
    return core.requestBody(query, { config: { boost: false, rewriteMinWords: 0, rerank: false } });
  };

  /* ── URL hash: #search=<query> ── */

  // A legacy &type= from the removed filter chips is ignored.
  core.parseHash = function (hash) {
    var out = { query: '' };
    var s = String(hash || '').replace(/^#/, '');
    if (!/(^|&)search=/.test(s)) return out;
    var params = {};
    s.split('&').forEach(function (pair) {
      var i = pair.indexOf('='), k = i < 0 ? pair : pair.slice(0, i);
      if (has(params, k)) return; // first value wins, as URLSearchParams.get does
      var v = i < 0 ? '' : pair.slice(i + 1).replace(/\+/g, ' ');
      try { params[k] = decodeURIComponent(v); } catch (e) { params[k] = ''; }
    });
    var q = params.search;
    if (q) out.query = q.trim().slice(0, 300);
    return out;
  };

  core.buildHash = function (query) {
    query = String(query || '').trim();
    return query ? '#search=' + encodeURIComponent(query) : '';
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
  // links written out, the numbered sources appended, then the footer line
  // (the disclaimer) when one is passed.
  core.answerText = function (md, sources, foot) {
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
    if (foot && text) text += '\n\n' + foot;
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

  /* ── Phase C: launcher, Ask about this page, Read this next ── */

  // Folders in the index are full URLs of the canonical host.
  core.SITE_ORIGIN = 'https://copilotplaybook.com';
  core.RELATED_URL = '/data/related.json?v=' + VERSION;
  core.RELATED_EXCLUDE = ['/', '/index.html', '/frontier-navigator/pages/'];
  core.ASK_TURNS = 6;
  core.ASK_NONE = "This page doesn't cover that. Try searching the whole playbook.";
  core.ASK_NONE_BUTTON = 'Search the whole playbook';
  core.ASK_BUSY = 'The assistant is busy right now. Please try again in a minute.';
  core.LOG_DISCLOSURE = 'Searches are logged without any personal details to improve the playbook.';

  // Where the shortcut keys must not be stolen: anything that takes typing.
  var NON_TEXT_INPUT = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'];
  core.isTextField = function (t) {
    if (!t || typeof t !== 'object') return false;
    if (t.isContentEditable) return true;
    var tag = String(t.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag !== 'INPUT') return false;
    return NON_TEXT_INPUT.indexOf(String(t.type || 'text').toLowerCase()) < 0;
  };

  // 'open' for Ctrl+K or Cmd+K anywhere, and for "/" outside a text field.
  core.shortcutAction = function (e, inField) {
    if (!e || e.isComposing || e.defaultPrevented) return null;
    var k = String(e.key || '');
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && k.toLowerCase() === 'k') return 'open';
    if (k === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !inField) return 'open';
    return null;
  };

  // Focus trap: given the focusable count, the focused index (-1: none of
  // them) and Shift, the index to focus instead, or null to let Tab move on
  // its own (it is not at either end).
  core.trapIndex = function (count, index, shift) {
    if (!(count > 0)) return null;
    if (index < 0 || index >= count) return shift ? count - 1 : 0;
    if (shift && index === 0) return count - 1;
    if (!shift && index === count - 1) return 0;
    return null;
  };

  // An exclusion list entry ending in "/" is a prefix (except "/" itself,
  // which is the home page only); anything else is an exact path.
  core.pathExcluded = function (pathname, list) {
    var p = String(pathname || '/');
    return (list || []).some(function (x) {
      if (typeof x !== 'string' || !x) return false;
      if (x === '/') return p === '/';
      if (x.slice(-1) === '/') return p.indexOf(x) === 0;
      return p === x;
    });
  };
  core.pageAskAllowed = function (pathname, exclude) {
    return !core.pathExcluded(pathname, exclude == null ? core.DEFAULT_CONFIG.pageAskExclude : exclude);
  };
  core.relatedAllowed = function (pathname) {
    return !core.pathExcluded(pathname, core.RELATED_EXCLUDE);
  };

  // The built-in metadata that scopes retrieval to one page, verified live
  // 2026-10-12: filename is the file name, folder the canonical URL of its
  // directory ("https://copilotplaybook.com/" for root pages). Both are needed:
  // index.html exists in more than one folder.
  core.pageFilter = function (pathname) {
    var p = String(pathname || '/');
    try { p = decodeURI(p); } catch (e) { /* keep as is */ }
    if (p[0] !== '/') p = '/' + p;
    var i = p.lastIndexOf('/');
    var dir = p.slice(0, i + 1), file = p.slice(i + 1);
    if (!file) file = 'index.html';
    else if (!/\.[a-z0-9]+$/i.test(file)) file += '.html'; // a pretty URL: /cpb serves cpb.html
    return { filename: file, folder: core.SITE_ORIGIN + dir };
  };

  // Headings that are navigation or apparatus, not something to explain.
  core.SKIP_HEADING = /^(table of contents|contents|on this page|in this (guide|page|document|section)|jump to|sources?\b|references?\b|appendix|glossary|further reading|related\b|footnotes|notes$|changelog|version history|citations|provenance|about this (page|guide|document))/i;

  // An H2's text without its section number ("3 · The Customer's New Problem").
  core.cleanHeading = function (t) {
    return String(t == null ? '' : t).replace(/\s+/g, ' ').trim()
      .replace(/^(?:(?:section|part|step|stop)\s+)?\d{1,2}(?:\.\d{1,2})*\s*[·.:)|\-–—]\s*/i, '')
      .replace(/[\s↑#¶]+$/, '')
      .trim();
  };

  // Up to three suggested questions from the page's H2s, spread over the
  // page (first, middle, last) rather than the first three.
  core.askQuestions = function (headings, max) {
    max = max == null ? 3 : max;
    var seen = {}, list = [];
    (headings || []).forEach(function (h) {
      var c = core.cleanHeading(h);
      if (c.length < 4 || c.length > 90 || core.SKIP_HEADING.test(c)) return;
      var k = c.toLowerCase();
      if (has(seen, k)) return;
      seen[k] = true;
      list.push(c);
    });
    var picks = list;
    if (list.length > max) {
      picks = [];
      for (var i = 0; i < max; i++) {
        var at = max === 1 ? 0 : Math.round(i * (list.length - 1) / (max - 1));
        if (picks.indexOf(list[at]) < 0) picks.push(list[at]);
      }
    }
    return picks.map(function (c) { return 'Explain: ' + c; });
  };

  // The messages for one Ask-about-this-page turn: at most `cap` prior
  // messages (default 6, three exchanges), starting with a user turn, then the
  // new question. Prior answers are cut to 4,000 characters.
  core.chatMessages = function (history, question, cap) {
    cap = cap == null ? core.ASK_TURNS : cap;
    var prior = (history || []).filter(function (m) {
      return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim();
    }).map(function (m) { return { role: m.role, content: m.content.slice(0, 4000) }; });
    prior = cap > 0 ? prior.slice(Math.max(0, prior.length - cap)) : [];
    while (prior.length && prior[0].role !== 'user') prior.shift();
    return prior.concat([{ role: 'user', content: String(question == null ? '' : question).trim() }]);
  };

  /* ── logging (F11): pure event builders ── */

  core.LOG_KINDS = ['search', 'zero', 'click', 'answer', 'vote', 'ask_page'];
  core.LOG_Q_MAX = 200;
  core.LOG_BATCH = 20;
  core.LOG_QUEUE_MAX = 100;

  // Query text as logged: control characters and runs of whitespace collapsed,
  // email addresses and long digit runs (phone or account numbers) masked,
  // capped at 200 characters. Null when nothing is left.
  core.cleanQuery = function (q) {
    if (typeof q !== 'string') return null;
    var s = q.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, '[email]')
      .replace(/\+?\d[\d ().-]{6,}\d/g, function (m) { return m.replace(/\D/g, '').length >= 9 ? '[number]' : m; });
    s = s.slice(0, core.LOG_Q_MAX).trim();
    return s || null;
  };

  core.stripQuery = function (url) { return String(url == null ? '' : url).split(/[?#]/)[0]; };

  // A page or link URL as logged: no query or hash, www folded into the
  // canonical host.
  core.canonicalUrl = function (url) {
    return core.stripQuery(url).replace(/^https?:\/\/www\.copilotplaybook\.com(?=\/|$)/i, core.SITE_ORIGIN);
  };

  // One event, or null. Only kind, q, n, url, rank and page are ever sent;
  // url is kept only when it is on the site.
  core.logEvent = function (kind, fields, page) {
    if (core.LOG_KINDS.indexOf(kind) < 0) return null;
    var f = fields && typeof fields === 'object' ? fields : {}, e = { kind: kind };
    var q = core.cleanQuery(f.q);
    if (q) e.q = q;
    if (isInt(f.n) && f.n >= 0 && f.n <= 100) e.n = f.n;
    if (typeof f.url === 'string') {
      var u = core.canonicalUrl(f.url);
      if (u.indexOf(core.SITE_ORIGIN + '/') === 0 && u.length <= 300) e.url = u;
    }
    if (isInt(f.rank) && f.rank >= 1 && f.rank <= 50) e.rank = f.rank;
    if (typeof page === 'string' && page) e.page = core.canonicalUrl(page).slice(0, 300);
    return e;
  };

  // Add to the in-memory queue, dropping the oldest past the cap.
  core.enqueue = function (queue, ev, max) {
    if (!ev) return queue;
    queue.push(ev);
    var over = queue.length - (max == null ? core.LOG_QUEUE_MAX : max);
    if (over > 0) queue.splice(0, over);
    return queue;
  };

  // Take up to 20 events off the front of the queue as one request body.
  core.takeBatch = function (queue, max) {
    if (!queue || !queue.length) return null;
    return JSON.stringify({ events: queue.splice(0, max == null ? core.LOG_BATCH : max) });
  };

  core.logUrl = function (endpoint) {
    return typeof endpoint === 'string' && /^https:\/\//.test(endpoint) ? endpoint.replace(/\/+$/, '') + '/e' : '';
  };

  /* ── Read this next (F8) ── */

  // The keys data/related.json may use for this path: as given, and the
  // folder and index.html spellings of the same page.
  core.pathKeys = function (pathname) {
    var p = String(pathname || '/');
    try { p = decodeURI(p); } catch (e) { /* keep as is */ }
    var out = [p];
    if (/\/index\.html$/.test(p)) out.push(p.replace(/index\.html$/, ''));
    else if (/\/$/.test(p)) out.push(p + 'index.html');
    else if (!/\.[a-z0-9]+$/i.test(p)) out.push(p + '.html');
    return out;
  };

  // Exactly three cards or none (DESIGN §8b.3: three, never four).
  core.relatedFor = function (data, pathname) {
    if (!data || typeof data !== 'object') return null;
    var keys = core.pathKeys(pathname), list = null;
    for (var i = 0; i < keys.length && !list; i++) if (has(data, keys[i]) && Array.isArray(data[keys[i]])) list = data[keys[i]];
    if (!list) return null;
    var self = keys, seen = {};
    var items = list.filter(function (it) {
      if (!it || typeof it.url !== 'string' || typeof it.title !== 'string' || !it.title.trim()) return false;
      if (!core.safeHref(it.url) || self.indexOf(it.url) >= 0 || has(seen, it.url)) return false;
      seen[it.url] = true;
      return true;
    }).slice(0, 3);
    return items.length === 3 ? items : null;
  };

  // Cut at a word boundary to about n characters.
  core.truncate = function (text, n) {
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    n = n == null ? 120 : n;
    if (text.length <= n) return text;
    var cut = text.slice(0, n + 1);
    cut = /\s/.test(cut) ? cut.replace(/\s+\S*$/, '') : cut.slice(0, n);
    cut = cut.replace(/[\s,;:.—–-]+$/, '');
    return (cut || text.slice(0, n)) + '…';
  };

  /* ── shadow-root styles (spec D3, §6) ──
     Literal values copied from DESIGN §1: --teal #005F6B, --teal-light
     #007B8A, --navy #003057, --line #dde1e7, --soft #f7f8fa, --text #1a2330,
     --accent #e4f0f3, --radius 8px, --shadow-sm, --shadow-md; the §2.1 house
     stack; §4 greys (#374151, #6b7280, #9ca3af) and callout values (#00474f,
     #c5dde3); the v1 focus ring. Sizes from the §2.2 scale only. */
  var FONT = "'Segoe UI', 'Inter', Georgia, sans-serif";
  var RING = '0 0 0 3px rgba(72,202,228,.3)';

  // The search UI, shared by the home card's classes and the panel.
  core.SEARCH_CSS = [
    '.site-search-form{display:flex;gap:8px}',
    '.site-search-form input{flex:1;min-width:0;padding:11px 14px;border:1px solid #dde1e7;border-radius:8px;background:#fff;color:#1a2330;font:inherit;font-size:.9rem}',
    '.site-search-form input:focus{outline:none;border-color:#005F6B;box-shadow:' + RING + '}',
    '.site-search-form button{padding:0 18px;border:0;border-radius:8px;background:#005F6B;color:#fff;font:inherit;font-size:.88rem;font-weight:700;cursor:pointer}',
    '.site-search-form button:hover{background:#007B8A}',
    '.site-search-form button:focus-visible{outline:none;box-shadow:' + RING + '}',
    '.site-search-form button:disabled{opacity:.6;cursor:default}',
    '.site-search-suggest{margin:10px 0 0;color:#6b7280;font-size:.82rem;line-height:1.6}',
    '.site-search-suggest:empty{display:none}',
    '.site-search-try{margin-right:6px;color:#6b7280}',
    '.site-search-sep{margin:0 8px;color:#9ca3af}',
    '.site-search-suggestion{padding:0;border:0;background:none;color:#005F6B;font:inherit;font-weight:600;text-align:left;cursor:pointer}',
    '.site-search-suggestion:hover{text-decoration:underline}',
    '.site-search-suggestion:focus-visible{outline:none;box-shadow:' + RING + '}',
    '.site-search-status{margin:10px 0 0;color:#6b7280;font-size:.78rem}',
    '.site-search-status:empty{display:none}',
    '.site-search-results{margin:8px 0 0;padding:0;list-style:none}',
    '.site-search-results li+li{margin-top:8px}',
    '.site-search-results a{display:block;padding:12px 14px;border:1px solid #dde1e7;border-radius:8px;background:#fff;color:inherit;text-decoration:none;transition:border-color .15s,box-shadow .15s}',
    '.site-search-results a:hover,.site-search-results a:focus-visible{outline:none;border-color:#005F6B;box-shadow:0 1px 4px rgba(0,0,0,.07)}',
    '.site-search-results .r-title{display:block;color:#003057;font-size:.95rem;font-weight:700;line-height:1.3}',
    '.site-search-results .r-url{display:block;margin-top:2px;color:#005F6B;font-size:.72rem;overflow-wrap:anywhere}',
    '.site-search-results .r-text{display:block;margin-top:6px;color:#374151;font-size:.85rem;line-height:1.5}',
    '.site-search-results mark{padding:0 1px;background:rgba(72,202,228,.25);color:inherit}',
    '.site-search-ask,.site-search-copy,.site-search-vote{border:1px solid #dde1e7;border-radius:8px;background:#fff;font:inherit;cursor:pointer;transition:border-color .15s,background .15s,color .15s}',
    '.site-search-ask{margin:10px 0 0;padding:7px 14px;border-color:#005F6B;color:#005F6B;font-size:.82rem;font-weight:700}',
    '.site-search-ask:hover{background:#005F6B;color:#fff}',
    '.site-search-copy{padding:4px 11px;color:#005F6B;font-size:.72rem;font-weight:700;line-height:1.35}',
    '.site-search-copy,.site-search-vote{border-color:#c5dde3}',
    '.site-search-copy:hover,.site-search-vote:hover{border-color:#005F6B}',
    '.site-search-vote{display:inline-flex;align-items:center;justify-content:center;width:30px;height:26px;padding:0;color:#6b7280}',
    '.site-search-vote[aria-pressed="true"]{border-color:#005F6B;background:#005F6B;color:#fff}',
    '.site-search-vote svg{width:15px;height:15px}',
    '.site-search-ask:focus-visible,.site-search-copy:focus-visible,.site-search-vote:focus-visible{outline:none;border-color:#005F6B;box-shadow:' + RING + '}',
    '.site-search-answer{margin:10px 0 0;padding:16px 20px;border:1px solid #c5dde3;border-left:4px solid #005F6B;border-radius:0 8px 8px 0;background:#e4f0f3}',
    '.site-search-answer-title{margin:0 0 6px;color:#00474f;font-size:.85rem;font-weight:700;letter-spacing:.3px}',
    '.site-search-answer-state{margin-left:6px;color:#6b7280;font-size:.72rem;font-weight:400;letter-spacing:0;animation:ps-writing 1.4s ease-in-out infinite}',
    '@keyframes ps-writing{50%{opacity:.45}}',
    '.site-search-answer-body{color:#1a2330;font-size:.88rem;line-height:1.55;overflow-wrap:anywhere}',
    '.site-search-answer-body p,.site-search-answer-body ul,.site-search-answer-body ol{margin:0 0 8px}',
    '.site-search-answer-body ul,.site-search-answer-body ol{padding-left:20px}',
    '.site-search-answer-body li+li{margin-top:2px}',
    '.site-search-answer-body>:last-child{margin-bottom:0}',
    '.site-search-answer-body a,.site-search-sources a{color:#005F6B;font-weight:600}',
    '.site-search-answer-label{margin:12px 0 4px;color:#00474f;font-size:.58rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase}',
    '.site-search-sources{margin:0;padding-left:20px;font-size:.82rem;line-height:1.5;overflow-wrap:anywhere}',
    '.site-search-answer-foot{margin:8px 0 0;color:#6b7280;font-size:.68rem;font-style:italic}',
    '.site-search-answer-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:10px 0 0}',
    '@media (max-width:640px){.site-search-answer{padding:14px 15px}.site-search-form button{padding:0 14px}}'
  ].join('');

  core.PANEL_CSS = [
    ':host{all:initial}',
    '*,*::before,*::after{box-sizing:border-box}',
    '[hidden]{display:none!important}',
    '.launcher{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;margin:0;padding:9px 14px;border:1px solid #005F6B;border-radius:8px;background:#005F6B;color:#fff;font-family:' + FONT + ';font-size:.82rem;font-weight:700;line-height:1.2;box-shadow:0 4px 16px rgba(0,0,0,.09);cursor:pointer;transition:background .15s,border-color .15s}',
    '.launcher:hover{background:#007B8A;border-color:#007B8A}',
    '.launcher:focus-visible{outline:none;box-shadow:' + RING + ',0 4px 16px rgba(0,0,0,.09)}',
    '.launcher svg{width:15px;height:15px;flex:none}',
    '.backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(0,48,87,.35);opacity:0;transition:opacity .18s}',
    '.backdrop.in{opacity:1}',
    '.dialog{position:fixed;z-index:2147483002;top:8vh;left:50%;width:720px;max-width:calc(100vw - 32px);max-height:84vh;display:flex;flex-direction:column;border:1px solid #dde1e7;border-radius:8px;background:#fff;color:#1a2330;font-family:' + FONT + ';font-size:.9rem;font-weight:400;line-height:1.5;text-align:left;box-shadow:0 4px 16px rgba(0,0,0,.09);opacity:0;transform:translate(-50%,8px);transition:opacity .18s,transform .18s}',
    '.dialog.in{opacity:1;transform:translate(-50%,0)}',
    '.head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px 0}',
    '.title{margin:0;color:#005F6B;font-size:.58rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase}',
    '.close{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;margin:0;padding:0;border:1px solid #dde1e7;border-radius:8px;background:#fff;color:#374151;cursor:pointer}',
    '.close:hover{border-color:#005F6B;color:#005F6B}',
    '.close:focus-visible{outline:none;border-color:#005F6B;box-shadow:' + RING + '}',
    '.close svg{width:15px;height:15px}',
    '.tabs{display:flex;gap:4px;margin:6px 0 0;padding:0 16px;border-bottom:1px solid #dde1e7}',
    '.tab{margin:0 0 -1px;padding:8px 10px;border:0;border-bottom:2px solid transparent;background:none;color:#6b7280;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer}',
    '.tab:hover{color:#005F6B}',
    '.tab[aria-selected="true"]{color:#005F6B;border-bottom-color:#005F6B}',
    '.tab:focus-visible{outline:none;border-radius:8px 8px 0 0;box-shadow:' + RING + '}',
    '.body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 16px 16px}',
    '.ask-head{margin:0 0 2px;color:#003057;font-size:.95rem;font-weight:700;line-height:1.3}',
    '.ask-note{margin:0 0 10px;color:#6b7280;font-size:.78rem}',
    // Page questions are whole sentences: one per line, no separators.
    '.ask-suggest .site-search-sep{display:none}',
    '.ask-suggest .site-search-try{display:block}',
    '.ask-suggest .site-search-suggestion{display:block;margin:2px 0 0}',
    '.ask-log{margin:4px 0 0}',
    '.turn{margin:14px 0 0}',
    '.ask-you{margin:0;color:#003057;font-size:.88rem;font-weight:700}',
    '.turn .site-search-answer{margin-top:6px}',
    '.foot{margin:0;padding:8px 16px 12px;border-top:1px solid #dde1e7;color:#6b7280;font-size:.68rem;font-style:italic}',
    '.foot a{color:#005F6B;font-style:normal;font-weight:600}',
    core.SEARCH_CSS,
    '@media (max-width:640px){',
    '.dialog{top:auto;bottom:0;left:0;right:0;width:100%;max-width:100%;max-height:88vh;border-bottom:0;border-radius:8px 8px 0 0;transform:translateY(8px)}',
    '.dialog.in{transform:none}',
    '}',
    '@media (prefers-reduced-motion:reduce){.backdrop,.dialog,.launcher{transition:none}.site-search-answer-state{animation:none}}'
  ].join('');

  core.RELATED_CSS = [
    ':host{all:initial;display:block}',
    '*,*::before,*::after{box-sizing:border-box}',
    // Inside a page container the row takes the container's width and gutters;
    // placed straight in <body> it gets the .stage width and its own gutters.
    '.related{margin:32px 0 64px;color:#1a2330;font-family:' + FONT + ';font-size:.9rem;line-height:1.5;text-align:left}',
    ':host([data-edge]) .related{max-width:1000px;margin:32px auto 64px;padding:0 16px}',
    ':host([data-edge][data-fit]) .related{max-width:none;margin:32px 0 64px;padding:0}',
    '.label{margin:0 0 10px;color:#005F6B;font-size:.58rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase}',
    '.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}',
    '.card{display:flex;flex-direction:column;padding:18px 20px;border:1px solid #dde1e7;border-radius:8px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 1px 4px rgba(0,0,0,.07);transition:border-color .15s,box-shadow .15s}',
    '.card:hover,.card:focus-visible{outline:none;border-color:#005F6B;box-shadow:0 4px 16px rgba(0,0,0,.09)}',
    '.card-h{display:block;margin:0 0 6px;color:#003057;font-size:.95rem;font-weight:600;line-height:1.35}',
    '.card-b{display:block;flex:1;margin:0;color:#374151;font-size:.88rem;line-height:1.6}',
    '.card-go{display:block;margin-top:10px;color:#005F6B;font-size:.82rem;font-weight:700}',
    '@media (max-width:640px){.grid{grid-template-columns:1fr}}',
    '@media (prefers-reduced-motion:reduce){.card{transition:none}}'
  ].join('');

  /* ── shadow-root markup: static templates; the only data, the page title
     and the related cards, passes through esc ── */

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  core.ICON_SEARCH = SVG + '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  core.ICON_CLOSE = SVG + '<path d="M18 6 6 18M6 6l12 12"/></svg>';
  core.ICON_UP = SVG + '<path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18.4 21H7V10l4.3-7.4A1.9 1.9 0 0 1 15 5.9Z"/></svg>';
  core.ICON_DOWN = SVG + '<path d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 5.6 3H17v11l-4.3 7.4A1.9 1.9 0 0 1 9 18.1Z"/></svg>';

  // The launcher, the backdrop and the dialog with both tabs.
  //   opts.title  the page's meta title, for "Questions about <title>"
  core.shellHtml = function (opts) {
    opts = opts || {};
    return '<style>' + core.PANEL_CSS + '</style>' +
      '<button type="button" class="launcher" aria-haspopup="dialog" aria-expanded="false" aria-keyshortcuts="Control+K Meta+K /" title="Search the playbook (Ctrl+K)">' + core.ICON_SEARCH + '<span>Search</span></button>' +
      '<div class="backdrop" hidden></div>' +
      '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="ps-title" hidden>' +
        '<div class="head"><h2 class="title" id="ps-title">Copilot Playbook search</h2>' +
        '<button type="button" class="close" aria-label="Close search">' + core.ICON_CLOSE + '</button></div>' +
        '<div class="tabs" role="tablist" aria-label="Search or ask">' +
          '<button type="button" class="tab" role="tab" id="ps-tab-search" aria-controls="ps-pane-search" aria-selected="true">Search the playbook</button>' +
          '<button type="button" class="tab" role="tab" id="ps-tab-ask" aria-controls="ps-pane-ask" aria-selected="false" tabindex="-1">Ask about this page</button>' +
        '</div>' +
        '<div class="body">' +
          '<div class="pane" role="tabpanel" id="ps-pane-search" aria-labelledby="ps-tab-search">' +
            '<form class="site-search-form ps-form" role="search">' +
              '<input type="search" class="ps-q" name="q" placeholder="Search the playbook, e.g. Copilot Credits billing" aria-label="Search the playbook" autocomplete="off">' +
              '<button type="submit">Search</button>' +
            '</form>' +
            '<div class="site-search-suggest ps-suggest" role="group" aria-label="Suggested searches"></div>' +
            '<p class="site-search-status ps-status" role="status" aria-live="polite"></p>' +
            '<button type="button" class="site-search-ask ps-ask" hidden>' + core.esc(core.ANSWER_ASK) + '</button>' +
            '<div class="site-search-answer ps-answer" aria-live="polite" hidden>' +
              '<p class="site-search-answer-title">AI answer <span class="site-search-answer-state ps-state"></span></p>' +
              '<div class="site-search-answer-body ps-body"></div>' +
              '<div class="ps-sources-wrap" hidden><p class="site-search-answer-label">Sources</p><ol class="site-search-sources ps-sources"></ol></div>' +
              '<p class="site-search-answer-foot ps-foot" hidden>' + core.esc(core.ANSWER_FOOT) + '</p>' +
              '<div class="site-search-answer-actions ps-actions" hidden>' +
                '<button type="button" class="site-search-copy ps-copy">Copy answer</button>' +
                '<button type="button" class="site-search-vote ps-up" aria-pressed="false" aria-label="Helpful answer" title="Helpful">' + core.ICON_UP + '</button>' +
                '<button type="button" class="site-search-vote ps-down" aria-pressed="false" aria-label="Unhelpful answer" title="Not helpful">' + core.ICON_DOWN + '</button>' +
              '</div>' +
            '</div>' +
            '<ol class="site-search-results ps-results"></ol>' +
          '</div>' +
          '<div class="pane" role="tabpanel" id="ps-pane-ask" aria-labelledby="ps-tab-ask" hidden>' +
            '<p class="ask-head">Questions about <em>' + core.esc(opts.title || 'this page') + '</em></p>' +
            '<p class="ask-note">Answers come only from this page.</p>' +
            '<form class="site-search-form ask-form">' +
              '<input type="search" class="ask-q" name="q" placeholder="Ask a question about this page" aria-label="Ask a question about this page" autocomplete="off">' +
              '<button type="submit">Ask</button>' +
            '</form>' +
            '<div class="site-search-suggest ask-suggest" role="group" aria-label="Suggested questions"></div>' +
            '<div class="ask-log" aria-live="polite"></div>' +
          '</div>' +
        '</div>' +
        '<p class="foot">' + core.esc(core.LOG_DISCLOSURE) + ' <a href="/ask.html">Open the full assistant</a></p>' +
      '</div>';
  };

  // One Ask-about-this-page turn; the question and answer are filled in with
  // textContent and core.renderMarkdown.
  core.turnHtml = function () {
    return '<div class="turn">' +
      '<p class="ask-you"></p>' +
      '<div class="site-search-answer">' +
        '<p class="site-search-answer-title">Answer <span class="site-search-answer-state"></span></p>' +
        '<div class="site-search-answer-body"></div>' +
        '<button type="button" class="site-search-ask t-none" hidden>' + core.esc(core.ASK_NONE_BUTTON) + '</button>' +
        '<div class="t-sources" hidden><p class="site-search-answer-label">Sources</p><ol class="site-search-sources"></ol></div>' +
        '<p class="site-search-answer-foot" hidden>' + core.esc(core.ANSWER_FOOT) + '</p>' +
        '<div class="site-search-answer-actions" hidden><button type="button" class="site-search-copy">Copy answer</button></div>' +
      '</div>' +
    '</div>';
  };

  // "Read this next": the stylesheet alone (items null) or three cards.
  core.relatedHtml = function (items) {
    var html = '<style>' + core.RELATED_CSS + '</style>';
    if (!items || !items.length) return html;
    return html + '<section class="related" aria-labelledby="pr-h"><h2 class="label" id="pr-h">Read this next</h2><div class="grid">' +
      items.map(function (it) {
        return '<a class="card" href="' + core.esc(it.url) + '">' +
          '<span class="card-h">' + core.esc(core.decode(it.title)) + '</span>' +
          (it.description ? '<span class="card-b">' + core.esc(core.truncate(core.decode(it.description), 120)) + '</span>' : '') +
          '<span class="card-go">Open the page &rarr;</span></a>';
      }).join('') + '</div></section>';
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports.SiteSearchCore = core;
    return;
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  /* ───────────────────────────── api ───────────────────────────── */
  var api = {};
  var config = core.mergeConfig(null);
  var SCRIPT = document.currentScript;
  var configLoad = null;

  // Fetched once; any failure (network, status, bad JSON) keeps the defaults.
  api.loadConfig = function () {
    if (configLoad) return configLoad;
    configLoad = fetch(core.CONFIG_URL, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (raw) { config = core.mergeConfig(raw); return config; })
      .catch(function () { config = core.mergeConfig(null); return config; });
    return configLoad;
  };

  api.search = function (query, opts) {
    opts = opts || {};
    return fetch(config.endpoint + 'search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(core.requestBody(query, { config: config })),
      signal: opts.signal
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return (d.result && d.result.chunks) || []; });
  };

  // Stream an answer. opts.messages (a conversation) and opts.filters (one
  // page) are for Ask about this page. handlers: onChunks(chunks),
  // onText(piece), onUsage(u). Resolves when the stream ends; rejects on HTTP
  // errors, stream errors and timeouts (Error 'timeout'); an abort through
  // opts.signal rejects with the AbortError.
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
      body: JSON.stringify(core.requestBody(query, { config: config, stream: true, messages: opts.messages, filters: opts.filters })),
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
  // Anonymous events (spec F11, D7), queued in memory and sent in batches of
  // 20 with sendBeacon when the page is hidden or left, and every 10 seconds.
  // Nothing is queued or sent while config.logEndpoint is empty, and a send
  // never blocks or breaks the page.
  var logQueue = [];
  var log = function (kind, fields) {
    if (!config.logEndpoint) return;
    core.enqueue(logQueue, core.logEvent(kind, fields, location.href), core.LOG_QUEUE_MAX);
  };
  log.flush = function () {
    var url = core.logUrl(config.logEndpoint);
    if (!url) { logQueue.length = 0; return; }
    if (!logQueue.length || !navigator.sendBeacon) return;
    var body;
    while ((body = core.takeBatch(logQueue, core.LOG_BATCH))) {
      try { navigator.sendBeacon(url, body); } catch (e) { /* fire and forget */ }
    }
  };
  log.start = function () {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') log.flush();
    });
    window.addEventListener('pagehide', log.flush);
    setInterval(function () { if (logQueue.length) log.flush(); }, 10000);
  };

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

  // The suggestion line: "Try:" then text links separated by middle dots.
  // Built with createElement and textContent: config text never reaches
  // innerHTML.
  render.suggestLine = function (box, items, onPick) {
    while (box.firstChild) box.removeChild(box.firstChild);
    if (!items || !items.length) return [];
    var doc = box.ownerDocument;
    var lead = doc.createElement('span');
    lead.className = 'site-search-try';
    lead.textContent = 'Try:';
    box.appendChild(lead);
    return items.map(function (it, i) {
      if (i) {
        var sep = doc.createElement('span');
        sep.className = 'site-search-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '·';
        box.appendChild(sep);
      }
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'site-search-suggestion';
      b.textContent = it.label;
      if (it.query !== it.label) b.title = it.query;
      b.addEventListener('click', function () { onPick(it); });
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

  jump.style = function () {
    if (jump.styled) return;
    jump.styled = true;
    var style = document.createElement('style');
    style.textContent = core.HIT_STYLE;
    document.head.appendChild(style);
  };

  jump.to = function (phrase) {
    var node = jump.locate(phrase);
    if (!node) return false;
    jump.style();
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
    jump.style();

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

  // A link to a passage on the page already open: jump in place instead of
  // reloading. Returns true when it did.
  jump.inPage = function (a) {
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }
    var here = core.pathKeys(location.pathname), there = core.pathKeys(url.pathname);
    if (here.indexOf(there[0]) < 0 && there.indexOf(here[0]) < 0) return false;
    if (url.host !== location.host && core.canonicalUrl(url.href).indexOf(core.SITE_ORIGIN + '/') !== 0) return false;
    var phrase = url.searchParams.get('hl');
    return !!(phrase && jump.to(phrase));
  };

  /* ───────────────────────────── search ───────────────────────────── */
  // One search UI, rendered into the home-page card or the launcher panel.
  //   ui    the elements: form, input, status, list, suggest, ask, panel,
  //         state, body, sourcesWrap, sources, foot, actions, copy, up, down
  //   opts  hash: keep #search= in the URL (home only)
  //         onLink(event, anchor): called before a result or source link navigates
  function searchUI(ui, opts) {
    opts = opts || {};
    var els = { status: ui.status, list: ui.list };
    var answerUi = !!(ui.ask && ui.panel && ui.state && ui.body && ui.sources && ui.sourcesWrap &&
      ui.foot && ui.actions && ui.copy && ui.up && ui.down);

    var state = {
      query: '',          // the query of the results on screen
      chunks: [],         // the chunks behind those results
      pages: 0,
      answerKey: null,    // the query the panel holds an answer for
      answerText: '',
      sources: [],
      vote: null
    };
    var pending = null, streaming = null;

    function setHash() {
      if (!opts.hash) return;
      var h = core.buildHash(state.query);
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
      var query = state.query;
      clearAnswer();
      state.answerKey = query;
      showAsk(false);
      ui.panel.hidden = false;
      ui.panel.setAttribute('aria-busy', 'true');
      ui.state.textContent = core.ANSWER_WRITING;
      var ctrl = new AbortController();
      streaming = ctrl;
      var text = '';
      log('answer', { q: query });
      api.chat(query, { signal: ctrl.signal }, {
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
        copyText(ui.copy, core.answerText(state.answerText, state.sources, core.ANSWER_FOOT));
      });
      [[ui.up, 'up'], [ui.down, 'down']].forEach(function (pair) {
        pair[0].addEventListener('click', function () {
          state.vote = state.vote === pair[1] ? null : pair[1];
          ui.up.setAttribute('aria-pressed', state.vote === 'up' ? 'true' : 'false');
          ui.down.setAttribute('aria-pressed', state.vote === 'down' ? 'true' : 'false');
          if (state.vote) log('vote', { q: state.query, n: state.vote === 'up' ? 1 : 0 });
        });
      });
      ui.sources.addEventListener('click', function (e) { linkClick(e, ui.sources); });
    }

    // Result and source clicks: logged with their 1-based rank and the URL
    // without its ?hl= phrase.
    function linkClick(e, list) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a || !list.contains(a)) return;
      var li = a.closest('li'), rank = 0;
      for (var n = li; n; n = n.previousElementSibling) rank++;
      log('click', { q: state.query, url: core.stripQuery(a.href), rank: rank });
      if (opts.onLink) opts.onLink(e, a);
    }
    els.list.addEventListener('click', function (e) { linkClick(e, els.list); });

    /* search */
    function run(query) {
      query = String(query || '').trim();
      if (!query) return;
      var keep = state.answerKey === query && !streaming;
      if (!keep) clearAnswer();
      showAsk(false);
      if (pending) pending.abort();
      pending = new AbortController();
      var ctrl = pending;
      state.query = query;
      setHash();
      els.status.textContent = core.STATUS_SEARCHING;
      els.list.innerHTML = '';
      api.search(query, { signal: ctrl.signal })
        .then(function (chunks) {
          if (pending !== ctrl) return;
          pending = null;
          state.chunks = chunks;
          state.pages = render.results(els, chunks, query);
          showAsk(state.pages > 0 && state.answerKey !== query);
          log('search', { q: query, n: state.pages });
          if (!state.pages) log('zero', { q: query, n: 0 });
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

    ui.form.addEventListener('submit', function (e) {
      e.preventDefault();
      run(ui.input.value);
    });

    /* suggested searches (F2) */
    function drawSuggest() {
      if (!ui.suggest) return;
      render.suggestLine(ui.suggest, config.suggested, function (s) {
        ui.input.value = s.query;
        run(s.query);
      });
    }

    return {
      run: run,
      clearAll: clearAll,
      drawSuggest: drawSuggest,
      input: ui.input,
      isOpen: function () {
        return !!(els.list.firstChild || els.status.textContent || (answerUi && !ui.panel.hidden));
      }
    };
  }

  function copyText(button, text) {
    var label = button.textContent === 'Copied' || button.textContent === 'Copy failed' ? 'Copy answer' : button.textContent;
    var done = function (msg) {
      button.textContent = msg;
      setTimeout(function () { button.textContent = label; }, 2000);
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) { done('Copy failed'); return; }
    navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done('Copy failed'); });
  }

  /* ───────────────────────────── ask ───────────────────────────── */
  // Ask about this page (F7): a conversation scoped to this page with
  // core.pageFilter. History lives in memory only and is never stored.
  //   el    form, input, submit, suggest, log
  //   page  { filter, questions }
  //   toSearch(question): switch to the Search tab and run the question there
  function askUI(el, page, toSearch, onLink) {
    var history = [], busy = null;

    render.suggestLine(el.suggest, page.questions.map(function (q) { return { label: q, query: q }; }), function (s) { ask(s.query); });
    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(el.input.value);
    });

    function newTurn() {
      var holder = document.createElement('div');
      holder.innerHTML = core.turnHtml();
      var root = holder.firstChild;
      var q = function (sel) { return root.querySelector(sel); };
      return {
        root: root, you: q('.ask-you'), panel: q('.site-search-answer'), state: q('.site-search-answer-state'),
        body: q('.site-search-answer-body'), none: q('.t-none'), sourcesWrap: q('.t-sources'),
        sources: q('.site-search-sources'), foot: q('.site-search-answer-foot'),
        actions: q('.site-search-answer-actions'), copy: q('.site-search-copy')
      };
    }

    function ask(question) {
      question = String(question || '').trim();
      if (!question || busy) return;
      el.input.value = '';
      var t = newTurn(), text = '', sources = [], none = false;
      t.you.textContent = question;
      t.state.textContent = core.ANSWER_WRITING;
      t.panel.setAttribute('aria-busy', 'true');
      t.sources.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!a) return;
        var li = a.closest('li'), rank = 0;
        for (var n = li; n; n = n.previousElementSibling) rank++;
        log('click', { q: question, url: core.stripQuery(a.href), rank: rank });
        onLink(e, a);
      });
      el.log.appendChild(t.root);
      t.root.scrollIntoView({ block: 'nearest' });
      log('ask_page', { q: question });
      var ctrl = new AbortController();
      busy = ctrl;
      el.submit.disabled = true;
      var messages = core.chatMessages(history, question, core.ASK_TURNS);
      api.chat(question, { messages: messages, filters: page.filter, signal: ctrl.signal }, {
        onChunks: function (chunks) {
          if (busy !== ctrl) return;
          // Nothing on this page matched: stop before the model answers from nothing.
          if (!chunks.length) { none = true; ctrl.abort(); return; }
          sources = core.buildSources(chunks, question, core.MAX_SOURCES);
          t.sources.innerHTML = core.sourcesHtml(sources);
          t.sourcesWrap.hidden = !sources.length;
        },
        onText: function (piece) {
          if (busy !== ctrl || none) return;
          text += piece;
          t.body.innerHTML = core.renderMarkdown(text);
        }
      }).then(function () { finish(null); }, finish);

      function finish(err) {
        if (busy !== ctrl) return;
        busy = null;
        el.submit.disabled = false;
        t.panel.removeAttribute('aria-busy');
        t.state.textContent = '';
        if (none) {
          t.body.textContent = core.ASK_NONE;
          t.sourcesWrap.hidden = true;
          t.none.hidden = false;
          t.none.addEventListener('click', function () { toSearch(question); });
          return;
        }
        if (err || !text.trim()) {
          t.body.textContent = core.ASK_BUSY;
          t.sourcesWrap.hidden = true;
          return;
        }
        history.push({ role: 'user', content: question }, { role: 'assistant', content: text });
        t.foot.hidden = false;
        t.actions.hidden = false;
        t.copy.addEventListener('click', function () {
          copyText(t.copy, core.answerText(text, sources, core.ANSWER_FOOT));
        });
      }
    }

    return { ask: ask };
  }

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
    var ui = {
      form: $('site-search-form'),
      input: $('site-search-q'),
      status: $('site-search-status'),
      list: $('site-search-results'),
      suggest: $('site-search-suggest'),
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
    if (!ui.form || !ui.input || !ui.status || !ui.list) return null;
    var s = searchUI(ui, { hash: true });

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
    ui.input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') s.clearAll();
    });
    document.addEventListener('click', function (e) {
      if (s.isOpen() && !e.target.closest('#site-search')) s.clearAll();
    });

    // Restore a shared #search=... once the config is in.
    var restored = core.parseHash(location.hash);
    s.drawSuggest();
    api.loadConfig().then(function () {
      s.drawSuggest();
      if (restored.query) {
        ui.input.value = restored.query;
        s.run(restored.query);
      }
    });
    return s;
  };

  // The page's own title and H2s, for the Ask tab. A page with fewer than
  // three usable H2s also offers its H3s.
  mount.pageInfo = function () {
    var meta = document.querySelector('meta[name="title"]');
    var title = (meta && meta.getAttribute('content')) || document.title || '';
    var texts = function (sel) {
      return Array.prototype.slice.call(document.querySelectorAll(sel))
        .filter(function (h) { return !h.closest('nav, footer, #site-search, [hidden]'); })
        .map(function (h) { return h.textContent; });
    };
    var questions = core.askQuestions(texts('h2'), 3);
    if (questions.length < 3) questions = core.askQuestions(texts('h2').concat(texts('h3')), 3);
    return {
      title: core.decode(title).trim(),
      questions: questions,
      filter: core.pageFilter(location.pathname)
    };
  };

  // The floating launcher and its panel (F6, F7), in a shadow root.
  mount.launcher = function () {
    var info = mount.pageInfo();
    var host = document.createElement('playbook-search');
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML = core.shellHtml({ title: info.title });
    document.body.appendChild(host);
    var q = function (sel) { return root.querySelector(sel); };
    var button = q('.launcher'), backdrop = q('.backdrop'), dialog = q('.dialog');
    var tabs = { search: q('#ps-tab-search'), ask: q('#ps-tab-ask') };
    var panes = { search: q('#ps-pane-search'), ask: q('#ps-pane-ask') };
    var inputs = { search: q('.ps-q'), ask: q('.ask-q') };
    var current = 'search', open = false, trigger = null, search = null, asker = null;

    function askAllowed() { return core.pageAskAllowed(location.pathname, config.pageAskExclude); }

    function onLink(e, a) {
      if (jump.inPage(a)) { e.preventDefault(); close(false); }
    }

    function build() {
      if (search) return;
      search = searchUI({
        form: q('.ps-form'), input: inputs.search, status: q('.ps-status'), list: q('.ps-results'),
        suggest: q('.ps-suggest'), ask: q('.ps-ask'), panel: q('.ps-answer'), state: q('.ps-state'),
        body: q('.ps-body'), sourcesWrap: q('.ps-sources-wrap'), sources: q('.ps-sources'),
        foot: q('.ps-foot'), actions: q('.ps-actions'), copy: q('.ps-copy'), up: q('.ps-up'), down: q('.ps-down')
      }, { hash: false, onLink: onLink });
      search.drawSuggest();
      api.loadConfig().then(function () { search.drawSuggest(); });
      asker = askUI({
        form: q('.ask-form'), input: inputs.ask, submit: q('.ask-form button'),
        suggest: q('.ask-suggest'), log: q('.ask-log')
      }, info, function (question) {
        select('search', false);
        inputs.search.value = question;
        search.run(question);
        inputs.search.focus();
      }, onLink);
    }

    function select(name, focus) {
      if (name === 'ask' && !askAllowed()) name = 'search';
      current = name;
      ['search', 'ask'].forEach(function (k) {
        var on = k === name;
        tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[k].tabIndex = on ? 0 : -1;
        panes[k].hidden = !on;
      });
      if (focus) inputs[name].focus();
    }

    function focusables() {
      return Array.prototype.slice.call(dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'))
        .filter(function (el) {
          return !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden]') && el.getClientRects().length > 0;
        });
    }

    function show(name) {
      build();
      q('.tabs').hidden = !askAllowed();
      if (!open) {
        open = true;
        backdrop.hidden = false;
        dialog.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        // Two frames so the transition runs from the hidden state.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { backdrop.classList.add('in'); dialog.classList.add('in'); });
        });
      }
      select(name || current, true);
    }

    function close(restore) {
      if (!open) return;
      open = false;
      backdrop.classList.remove('in');
      dialog.classList.remove('in');
      backdrop.hidden = true;
      dialog.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      var t = trigger;
      trigger = null;
      if (restore === false) return;
      if (t && t !== document.body && t.isConnected && typeof t.focus === 'function') t.focus();
      else button.focus();
    }

    button.addEventListener('click', function () { trigger = button; show(); });
    backdrop.addEventListener('click', function () { close(); });
    q('.close').addEventListener('click', function () { close(); });
    tabs.search.addEventListener('click', function () { select('search', true); });
    tabs.ask.addEventListener('click', function () { select('ask', true); });
    q('.tabs').addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
      e.preventDefault();
      var name = e.key === 'Home' ? 'search' : e.key === 'End' ? 'ask' : current === 'search' ? 'ask' : 'search';
      select(name, false);
      tabs[current].focus();
    });

    // Keep focus inside the dialog while it is open.
    document.addEventListener('focusin', function (e) {
      if (open && e.target !== host) {
        var list = focusables();
        if (list.length) list[0].focus();
      }
    });

    return {
      isOpen: function () { return open; },
      open: function (from) {
        if (!open) trigger = from || document.activeElement;
        show('search');
      },
      close: close,
      trap: function (e) {
        var list = focusables();
        var r = core.trapIndex(list.length, list.indexOf(root.activeElement), e.shiftKey);
        if (r !== null) { e.preventDefault(); list[r].focus(); }
      }
    };
  };

  // Ctrl+K and Cmd+K (and "/" outside a text field): the launcher panel, or on
  // the home page the inline box. Escape and Tab while the panel is open.
  mount.keys = function (home, panel) {
    document.addEventListener('keydown', function (e) {
      var path = e.composedPath ? e.composedPath() : [];
      var target = path[0] || e.target;
      if (panel && panel.isOpen()) {
        if (e.key === 'Escape') { e.preventDefault(); panel.close(); return; }
        if (e.key === 'Tab') { panel.trap(e); return; }
      }
      if (core.shortcutAction(e, core.isTextField(target)) !== 'open') return;
      if (home) {
        e.preventDefault();
        home.input.focus();
        home.input.select();
        var r = home.input.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) home.input.scrollIntoView({ block: 'center' });
      } else if (panel) {
        e.preventDefault();
        panel.open(target);
      }
    });
  };

  // "Read this next" (F8): three cards before the last <footer>, else at the
  // end of <main>, else before this script. The data loads only when the spot
  // comes near the viewport.
  mount.related = function () {
    if (!core.relatedAllowed(location.pathname)) return;
    var host = document.createElement('playbook-related');
    var footers = document.getElementsByTagName('footer');
    var last = footers[footers.length - 1], main = document.querySelector('main');
    if (last && last.parentNode) last.parentNode.insertBefore(host, last);
    else if (main) main.appendChild(host);
    else if (SCRIPT && SCRIPT.parentNode) SCRIPT.parentNode.insertBefore(host, SCRIPT);
    else document.body.appendChild(host);
    if (host.parentNode === document.body) {
      host.setAttribute('data-edge', '');
      // Line the row up with the page's own content column: take the width of
      // the nearest visible block above it, so the cards share its left and
      // right edges instead of sitting inside a fixed 1000px box.
      var ref = host.previousElementSibling;
      while (ref && (/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(ref.tagName) || !ref.offsetWidth)) ref = ref.previousElementSibling;
      if (ref) {
        var fit = function () { host.style.maxWidth = ref.getBoundingClientRect().width + 'px'; };
        host.setAttribute('data-fit', '');
        host.style.marginLeft = host.style.marginRight = 'auto';
        fit();
        window.addEventListener('resize', fit);
      }
    }
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML = core.relatedHtml(null);
    function load() {
      fetch(core.RELATED_URL, { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          var items = core.relatedFor(data, location.pathname);
          if (items) root.innerHTML = core.relatedHtml(items);
        })
        .catch(function () { /* no row; the page is unaffected */ });
    }
    if (!('IntersectionObserver' in window)) { load(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (x) { return x.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: '600px 0px' });
    io.observe(host);
  };

  mount.run = function () {
    if (mount.embedded()) return;
    api.loadConfig();
    log.start();
    var home = document.getElementById('site-search') ? mount.inline() : null;
    var panel = home ? null : mount.launcher();
    mount.keys(home, panel);
    mount.related();
    jump.run();
  };

  mount.run();
})();
