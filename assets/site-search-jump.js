/* Site search landing: when a page is opened from the home-page search with
   ?hl=<phrase>, scroll to the first place that phrase appears and highlight it.
   Browser text fragments (#:~:text=) do the same thing natively, but not every
   browser or embedded viewer honors them, so this is the dependable path.
   Every page listed in sitemap.xml loads this file (see DESIGN.md 8b.5). */
(function () {
  var phrase;
  try { phrase = new URLSearchParams(location.search).get('hl'); } catch (e) { return; }
  if (!phrase || !phrase.trim()) return;

  var norm = function (t) { return t.replace(/\s+/g, ' ').toLowerCase(); };
  var target = norm(phrase.trim());

  // Concatenate visible text nodes, remembering where each one starts, so a
  // phrase that crosses inline markup (<strong>, <a>) still matches.
  function locate() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest('nav, footer, #site-search')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], text = '', n;
    while ((n = walker.nextNode())) {
      var t = norm(n.textContent);
      if (!t) continue;
      if (text && text.slice(-1) !== ' ' && t[0] !== ' ') text += ' ';
      nodes.push({ node: n, start: text.length });
      text += t;
    }
    var at = text.indexOf(target);
    if (at < 0) return null;
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].start <= at) return nodes[i].node;
    }
    return null;
  }

  function jump() {
    var node = locate();
    if (!node) return false;
    var details = node.parentElement.closest('details');
    while (details) {
      details.open = true;
      details = details.parentElement && details.parentElement.closest('details');
    }
    var block = node.parentElement.closest('p, li, td, th, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6') || node.parentElement;
    block.classList.add('site-search-hit');
    block.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () { block.classList.remove('site-search-hit'); }, 6000);
    return true;
  }

  var style = document.createElement('style');
  style.textContent =
    '.site-search-hit{background:rgba(72,202,228,.22);outline:2px solid #48cae4;' +
    'outline-offset:3px;border-radius:4px;transition:background .6s,outline-color .6s}';
  document.head.appendChild(style);

  // Some pages render content with script; retry briefly before giving up.
  function start() {
    var tries = 0;
    (function attempt() {
      if (jump() || ++tries > 10) return;
      setTimeout(attempt, 300);
    })();
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
