"""tools/bump-search-version.py

Bump the site-search module version everywhere it is pinned, so browsers
fetch the new script, config and related.json at once instead of serving a
cached copy for up to 10 minutes (DESIGN.md 8b.5). Byte-level and exact:
every page that loads assets/site-search.js?v=OLD must contain the tag exactly
once; line endings are preserved; the Credit Planner never loads the script.

    python tools/bump-search-version.py 5 6
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub_once(path, old, new, expect=1):
    b = path.read_bytes()
    n = b.count(old.encode())
    if n != expect:
        raise SystemExit(f"{path.relative_to(ROOT)}: expected {expect} x {old!r}, found {n}")
    path.write_bytes(b.replace(old.encode(), new.encode()))


def main(old, new):
    tag_old = f'<script src="/assets/site-search.js?v={old}" defer></script>'
    tag_new = f'<script src="/assets/site-search.js?v={new}" defer></script>'
    pages = [p for p in ROOT.rglob("*.html")
             if ".git" not in p.parts and "ff" not in p.relative_to(ROOT).parts[:1]
             and tag_old.encode() in p.read_bytes()]
    for p in pages:
        sub_once(p, tag_old, tag_new)
    mod = ROOT / "assets" / "site-search.js"
    sub_once(mod, f"site-search.js?v={old}:", f"site-search.js?v={new}:")
    sub_once(mod, f"var VERSION = '{old}';", f"var VERSION = '{new}';")
    t = ROOT / "tools" / "test-site-search.js"
    b = t.read_bytes().decode("utf-8")
    for a, z in [(f"eq(C.VERSION, '{old}'", f"eq(C.VERSION, '{new}'"),
                 (f"json?v={old}'", f"json?v={new}'"),
                 (f"js\\?v={old}", f"js\\?v={new}"),
                 (f"?v={old}');", f"?v={new}');"),
                 (f"?v={old}'", f"?v={new}'")]:
        b = b.replace(a, z)
    t.write_bytes(b.encode("utf-8"))
    print(f"bumped v{old} -> v{new} on {len(pages)} pages, the module and its tests")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
