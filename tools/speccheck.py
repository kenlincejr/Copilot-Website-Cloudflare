#!/usr/bin/env python3
"""
speccheck.py - verify that every BEFORE anchor in a change spec matches its
target file exactly once.

Run this THREE times in a spec's life:

  1. Phase 4, while authoring  - proves the spec is applicable
  2. Phase 5, before executing - proves nothing drifted since authoring
  3. Phase 5, after executing  - every BEFORE should now match ZERO times
                                 (use --applied)

Usage:
    python tools/speccheck.py specs/cpb.spec.md cpb.html
    python tools/speccheck.py specs/cpb.spec.md cpb.html --applied
    python tools/speccheck.py --all

Exit code 0 = all good, 1 = at least one anchor is wrong.

Spec format this reads:

    ```html before:C-01
    ...verbatim source...
    ```
    ```html after:C-01
    ...verbatim replacement...
    ```

An `after` block that is empty or whitespace-only marks a block-remove; the
idempotency check is skipped for those.
"""
import re
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# spec -> target, the Phase 4 set
PAIRS = [
    ("specs/cpb.spec.md",         "cpb.html"),
    ("specs/ledger.spec.md",      "ledger.html"),
    ("specs/cowork.spec.md",      "cowork.html"),
    ("specs/frontier.spec.md",    "frontier.html"),
    ("specs/starter-kit.spec.md", "customer-zero-starter-kit/index.html"),
    ("specs/copilot-adoption-audit-buildout.spec.md", "copilot-adoption-audit.html"),
]

BLOCK_RE = re.compile(r"```html (before|after):([A-Z]{1,3}-\d+)\n(.*?)```", re.S)


def parse(spec_text):
    before, after = {}, {}
    for kind, cid, body in BLOCK_RE.findall(spec_text):
        if body.endswith("\n"):
            body = body[:-1]
        (before if kind == "before" else after)[cid] = body
    return before, after


def sort_key(cid):
    return int(cid.split("-")[1])


def check(spec_path, target_path, applied=False, quiet=False):
    spec = open(os.path.join(ROOT, spec_path), encoding="utf-8").read()
    raw = open(os.path.join(ROOT, target_path), encoding="utf-8").read()
    before, after = parse(spec)

    if not before:
        print(f"FAIL {spec_path}: no before: blocks found")
        return 0, 1

    ok = bad = 0

    for cid in sorted(before, key=sort_key):
        n = raw.count(before[cid])
        note = ""

        # A block-insert keeps its own anchor inside the replacement, so after
        # execution its BEFORE legitimately still matches once. Expecting zero
        # there would report a correct edit as a failure.
        insert_style = cid in after and before[cid] in after[cid]
        want = (1 if insert_style else 0) if applied else 1

        if cid not in after:
            note = "  <-- NO MATCHING after: BLOCK"
            n = -1
        elif applied:
            # after execution the AFTER text should be present instead
            na = raw.count(after[cid])
            if after[cid].strip() and na < 1:
                note = "  <-- AFTER text not found; change may not have applied"
            elif insert_style:
                note = "  (block-insert; anchor retained by design)"
        else:
            if not after[cid].strip():
                note = "  (block-remove; idempotency check skipped)"
            else:
                na = raw.count(after[cid])
                if na > 0:
                    note = f"  <-- WARNING: AFTER already present {na}x"

        good = (n == want) and not note.startswith("  <--")
        if good:
            ok += 1
        else:
            bad += 1
        if not quiet or not good:
            print(f"{'OK  ' if good else 'FAIL'} {cid}: BEFORE matches {n}x "
                  f"(expected {want}){note}")

    print(f"     {spec_path} -> {target_path}: "
          f"{ok} ok, {bad} failed, {len(before)} changes")
    return ok, bad


def main():
    args = [a for a in sys.argv[1:]]
    applied = "--applied" in args
    args = [a for a in args if not a.startswith("--")]

    if "--all" in sys.argv[1:]:
        t_ok = t_bad = 0
        for spec, target in PAIRS:
            if not os.path.exists(os.path.join(ROOT, spec)):
                print(f"SKIP {spec} (not present)")
                continue
            if not os.path.exists(os.path.join(ROOT, target)):
                print(f"SKIP {spec} (target {target} not present)")
                continue
            o, b = check(spec, target, applied)
            t_ok += o
            t_bad += b
            print()
        print(f"TOTAL: {t_ok} ok, {t_bad} failed")
        return 1 if t_bad else 0

    if len(args) != 2:
        print(__doc__)
        return 2

    _, bad = check(args[0], args[1], applied)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
