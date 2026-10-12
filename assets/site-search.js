/* assets/site-search.js?v=3: the one site search module
   (specs/site-search-v2.spec.md §3.1). Loaded by every page in sitemap.xml
   (see DESIGN.md 8b.5) except copilot-credit-planner.html, which stays free
   of external scripts.

   One IIFE, no dependencies, no build step, no browser storage. Sections:
     core   pure functions, no DOM; exported for Node tests (tools/test-site-search.js)
     api    requests to the AI Search /search and /chat/completions endpoints
     render results list and status text on the home-page search card
     jump   ?hl=<phrase>: scroll to and highlight the matching passage
     mount  wires the home-page card (when #site-search exists) and runs jump

   Under Node (module.exports defined) only core is exported and nothing
   touches the DOM or window. */
(function () {
  'use strict';

  var ENDPOINT = 'https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/';
  var MAX_PAGES = 6;

  /* ───────────────────────────── core ───────────────────────────── */
  var core = {};

  core.ENDPOINT = ENDPOINT;
  core.SEARCH_URL = ENDPOINT + 'search';
  core.CHAT_URL = ENDPOINT + 'chat/completions';
  core.MAX_PAGES = MAX_PAGES;
  core.MAX_RESULTS = 20;

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  core.esc = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  };

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
      return Object.prototype.hasOwnProperty.call(NAMED, e) ? NAMED[e] : m;
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

  // Crude stemming so "services" also finds "service" in the passage text:
  // words longer than four letters lose a trailing "es" or "s".
  core.stem = function (t) {
    t = t.toLowerCase();
    return t.length > 4 ? t.replace(/(es|s)$/, '') : t;
  };
  core.termsFor = function (words0) { return words0.map(core.stem); };

  // Fallback when a page has no title metadata yet: turn the URL path into words.
  core.titleFromUrl = function (url) {
    var path = url.replace(/^https?:\/\/[^/]+\/?/, '').replace(/(index)?\.html$/, '').replace(/\/$/, '');
    var last = path.split('/').filter(Boolean).pop();
    if (!last) return 'Home';
    return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };

  // About 240 characters around the first query term found, terms highlighted.
  core.excerpt = function (text, terms) {
    var lower = text.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = lower.indexOf(terms[i]);
    var start = Math.max(0, (at < 0 ? 0 : at) - 80);
    var cut = text.slice(start, start + 240);
    if (start > 0) cut = '…' + cut.replace(/^\S*\s/, '');
    if (start + 240 < text.length) cut = cut.replace(/\s\S*$/, '') + '…';
    var html = core.esc(cut);
    if (!terms.length) return html;
    var re = new RegExp('(' + terms.map(function (t) {
      return core.esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')\\w*', 'gi');
    return html.replace(re, '<mark>$&</mark>');
  };

  // A few words from the line or table cell where a query term first appears,
  // for the ?hl= deep link. Stops at the first clause break so the phrase stays
  // inside one element on the target page.
  core.fragmentFor = function (md, terms, words0) {
    var segments = md.split(/\n|\|/).map(core.plain).filter(Boolean);
    for (var i = 0; i < terms.length; i++) {
      for (var j = 0; j < segments.length; j++) {
        var words = segments[j].split(' ');
        for (var k = 0; k < words.length; k++) {
          if (words[k].toLowerCase().indexOf(terms[i]) >= 0) {
            var phrase = [];
            for (var n = k; n < words.length && phrase.length < 5; n++) {
              phrase.push(words[n]);
              if (/[.,;:!?”"')\]]$/.test(words[n])) break;
            }
            return phrase.join(' ').replace(/^[“‘"'(\[]+|[.,;:!?”’"')\]]+$/g, '');
          }
        }
      }
    }
    // No term in this passage: fall back to the first whole query word, which
    // jumps to its first occurrence on the page.
    return words0[0] || '';
  };

  // ?hl= is read by the jump section on the target page, which scrolls to the
  // phrase. No #:~:text= fragment: Chrome's own handling of it reset the scroll
  // position the script had just set.
  core.deepLink = function (url, phrase) {
    if (!phrase) return url;
    return url + '?hl=' + encodeURIComponent(phrase);
  };

  // Group chunks by page in rank order; prefer the best-ranked chunk that
  // actually contains a query term, since semantic matches may not.
  core.buildPages = function (chunks, query, maxPages) {
    var words0 = core.queryWords(query);
    var terms = core.termsFor(words0);
    var order = [], byUrl = {};
    (chunks || []).forEach(function (c) {
      var url = c && c.item && c.item.key;
      if (!url) return;
      if (!Object.prototype.hasOwnProperty.call(byUrl, url)) { byUrl[url] = []; order.push(url); }
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

  core.searchBody = function (query) {
    return {
      messages: [{ role: 'user', content: query }],
      ai_search_options: { retrieval: { max_num_results: core.MAX_RESULTS } }
    };
  };

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

  api.search = function (query, opts) {
    opts = opts || {};
    return fetch(core.SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(core.searchBody(query)),
      signal: opts.signal
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return (d.result && d.result.chunks) || []; });
  };

  /* ───────────────────────────── render ───────────────────────────── */
  var render = {};

  render.results = function (els, chunks, query) {
    var built = core.buildPages(chunks, query, MAX_PAGES);
    els.list.innerHTML = core.resultsHtml(built.pages, built.terms);
    els.status.textContent = core.statusText(built.pages.length);
  };

  render.clear = function (els) {
    els.list.innerHTML = '';
    els.status.textContent = '';
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
    var form = document.getElementById('site-search-form');
    var input = document.getElementById('site-search-q');
    var els = {
      status: document.getElementById('site-search-status'),
      list: document.getElementById('site-search-results')
    };
    if (!form || !input || !els.status || !els.list) return;
    var pending = null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var query = input.value.trim();
      if (!query) return;
      if (pending) pending.abort();
      pending = new AbortController();
      els.status.textContent = core.STATUS_SEARCHING;
      els.list.innerHTML = '';
      api.search(query, { signal: pending.signal })
        .then(function (chunks) { render.results(els, chunks, query); })
        .catch(function (err) {
          if (err.name !== 'AbortError') els.status.textContent = core.STATUS_ERROR;
        });
    });

    // Open the chat bubble from the search card. Its shadow root is open, so its
    // own launcher button can be clicked; if the module never loaded, hide the offer.
    var chatOffer = document.getElementById('site-search-open-chat');
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

    // Results close on Escape or on any click outside the search card.
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') render.clear(els);
    });
    document.addEventListener('click', function (e) {
      if (els.list.firstChild && !e.target.closest('#site-search')) render.clear(els);
    });
  };

  mount.run = function () {
    if (mount.embedded()) return;
    if (document.getElementById('site-search')) mount.inline();
    jump.run();
  };

  mount.run();
})();
