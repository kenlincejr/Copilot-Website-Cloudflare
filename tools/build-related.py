"""tools/build-related.py: build data/related.json, the "Read this next" row
(specs/site-search-v2.spec.md F8, Phase C step 3).

For each HTML page in sitemap.xml, query the AI Search /search endpoint with
the page's own meta title and description (metadata_only, boosting on), drop
the page itself, and keep the top three distinct pages, preferring at least one
whose page_type differs from the source page's. Card titles and descriptions
come from the target pages' own meta tags, read from disk, so a stale index
cannot put a wrong title on a card.

One query per page (about 35; a page whose first query leaves fewer than
three others gets up to two more), 2.1 seconds apart to stay under the instance's
30-per-minute rate limit. Run it when the sitemap changes, not on every deploy:

    python tools/build-related.py            (from the repo root)
    python tools/build-related.py --dry-run  (print, do not write)
    python tools/build-related.py --missing  (requery only pages with fewer than three)

An empty result is usually the rate limit, not a real miss: the script waits
20 seconds and retries that page twice before giving up on it.

Standard library only. The endpoint's bot check rejects Python's default User
Agent, so requests carry a browser-like one and the site's Origin.
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://copilotplaybook.com'
ENDPOINT = 'https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/search'
HEADERS = {
    'Content-Type': 'application/json',
    'Origin': SITE,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/130.0 Safari/537.36',
}
DELAY = 2.1
KEEP = 3
# Never a "read this next" target: the home page is one click away everywhere.
NOT_A_TARGET = {'/'}
OUT = ROOT / 'data' / 'related.json'


def sitemap_pages():
    """Sitemap <loc> paths for HTML pages, in sitemap order: '/cpb.html', '/frontier-navigator/'."""
    sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    out = []
    for loc in re.findall(r'<loc>([^<]+)</loc>', sm):
        path = loc[len(SITE):] if loc.startswith(SITE) else loc
        file = path.lstrip('/')
        if file == '' or file.endswith('/'):
            file += 'index.html'
        if file.endswith('.html'):
            out.append((path or '/', file))
    return out


def meta(file):
    s = (ROOT / file).read_text(encoding='utf-8')
    head = re.split(r'</head>', s, flags=re.I)[0]

    def get(name):
        m = re.search(r'<meta name="' + name + r'" content="([^"]*)"', head)
        return html.unescape(m.group(1)).strip() if m else ''
    return {'title': get('title'), 'description': get('description'), 'page_type': get('page_type')}


def search(query):
    body = {
        'messages': [{'role': 'user', 'content': query}],
        'ai_search_options': {'retrieval': {
            'max_num_results': 20,
            'metadata_only': True,
            'boost_by': [{'field': 'priority', 'direction': 'desc'}],
        }},
    }
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode('utf-8'), headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode('utf-8'))
    return (data.get('result') or {}).get('chunks') or []


def to_path(url, known):
    """An index URL to its sitemap path, or None when it is not a sitemap HTML page."""
    if not isinstance(url, str) or not url.startswith(SITE):
        return None
    p = url[len(SITE):] or '/'
    p = p.split('?')[0].split('#')[0]
    if p in known:
        return p
    alt = p[:-len('index.html')] if p.endswith('/index.html') else (p + 'index.html' if p.endswith('/') else None)
    return alt if alt in known else None


def pick(ranked, own_type, types):
    """Top three distinct pages; if all three share the source's page_type, the
    best-ranked page of another type replaces the third."""
    top = ranked[:KEEP]
    if len(top) == KEEP and all(types.get(p) == own_type for p in top):
        other = next((p for p in ranked[KEEP:] if types.get(p) != own_type), None)
        if other:
            top = top[:KEEP - 1] + [other]
    return top


def main():
    dry = '--dry-run' in sys.argv
    missing = '--missing' in sys.argv
    pages = sitemap_pages()
    known = {p for p, _ in pages}
    info = {p: meta(f) for p, f in pages}
    types = {p: info[p]['page_type'] for p in known}
    old = json.loads(OUT.read_text(encoding='utf-8')) if missing and OUT.exists() else {}
    out, short, calls = {}, [], 0
    for i, (path, _file) in enumerate(pages):
        if missing and len(old.get(path) or []) >= KEEP:
            out[path] = old[path]
            continue
        m = info[path]
        # The page's own title and description first; if that leaves fewer than
        # three other pages, the description alone, then the title alone.
        queries = [(m['title'] + '. ' + m['description']).strip(), m['description'], m['title']]
        ranked = []
        for query in [q for q in queries if q]:
            if len(ranked) >= KEEP:
                break
            chunks = []
            for attempt in range(3):
                if calls:
                    time.sleep(DELAY if attempt == 0 else 20)
                calls += 1
                try:
                    chunks = search(query)
                except urllib.error.HTTPError as e:
                    print('HTTP %s for %s: %s' % (e.code, path, e.read()[:300]), file=sys.stderr)
                    return 1
                if chunks:
                    break
            for c in chunks:
                p = to_path(((c or {}).get('item') or {}).get('key'), known)
                if p and p != path and p not in NOT_A_TARGET and p not in ranked:
                    ranked.append(p)
        chosen = pick(ranked, types.get(path), types)
        if len(chosen) < KEEP:
            short.append(path)
        out[path] = [{'url': p, 'title': info[p]['title'], 'description': info[p]['description']} for p in chosen]
        print('%2d %-52s -> %s' % (i + 1, path, ', '.join(chosen)))
    print('%d queries, %d pages short of %d' % (calls, len(short), KEEP) + (': ' + ', '.join(short) if short else ''))
    if dry:
        return 0
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n', encoding='utf-8', newline='\n')
    print('wrote', OUT.relative_to(ROOT))
    return 1 if short else 0


if __name__ == '__main__':
    sys.exit(main())
