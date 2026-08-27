#!/usr/bin/env python3
"""
apply-spec.py - mechanically apply a change spec to its target file.

This exists so that Phase 5 execution involves no judgment at all. It reads the
`before:`/`after:` blocks out of a spec and performs literal replacements. It
cannot reword, restyle, reformat, or improvise an anchor, because it has no
capacity to do any of those things.

    python tools/apply-spec.py specs/frontier.spec.md frontier.html
    python tools/apply-spec.py specs/frontier.spec.md frontier.html --dry-run

Rules enforced, matching the standing execution prompt:

  * Exactly one file is written - the target passed on the command line.
  * A BEFORE that matches zero times, or more than once, is SKIPPED and
    reported. It is never guessed at.
  * Changes apply in numeric ID order, so a spec can rely on ordering
    (e.g. frontier FR-04 before FR-05).
  * A change ID with no `after:` block is treated as withdrawn and skipped
    (cpb C-09).
  * Any edit that would touch a line longer than 4,000 characters aborts the
    whole run - this is the cpb.html base64 guard.
  * Re-running is safe. A change whose AFTER is already present is reported as
    already-applied rather than applied twice. The one exception is a
    block-remove (empty AFTER): its already-applied state is indistinguishable
    from a missing anchor, so a re-run reports it as SKIPPED. That is a false
    alarm, not a failure - nothing is written.

Exit code 0 = every change applied, 1 = at least one was skipped.
"""
import re
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCK_RE = re.compile(r"```html (before|after):([A-Z]{1,3}-\d+)\n(.*?)```", re.S)
LONG_LINE = 4000


def parse(spec_text):
    before, after = {}, {}
    for kind, cid, body in BLOCK_RE.findall(spec_text):
        if body.endswith("\n"):
            body = body[:-1]
        (before if kind == "before" else after)[cid] = body
    return before, after


def guard_base64(raw, before_text, cid):
    """Refuse to edit if the anchor sits on a pathologically long line."""
    idx = raw.find(before_text)
    if idx < 0:
        return True
    start = raw.rfind("\n", 0, idx) + 1
    end = raw.find("\n", idx + len(before_text))
    end = len(raw) if end < 0 else end
    if end - start > LONG_LINE:
        print(f"ABORT {cid}: anchor sits on a {end - start}-char line. "
              f"This is the base64 guard. Nothing was written.")
        return False
    return True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if len(args) != 2:
        print(__doc__)
        return 2

    spec_path, target_path = args
    spec = open(os.path.join(ROOT, spec_path), encoding="utf-8").read()
    target_abs = os.path.join(ROOT, target_path)
    raw = original = open(target_abs, encoding="utf-8").read()

    before, after = parse(spec)
    applied, skipped, withdrawn, already = [], [], [], []

    for cid in sorted(before, key=lambda c: int(c.split("-")[1])):
        if cid not in after:
            withdrawn.append(cid)
            print(f"SKIP  {cid}: withdrawn (no after: block)")
            continue

        # A block-insert keeps its own anchor inside the replacement, which
        # makes a naive re-run insert the block a second time. Detect that the
        # change is already present and skip it as already-applied.
        insert_style = before[cid] in after[cid]
        if insert_style and after[cid] in raw:
            already.append(cid)
            print(f"SKIP  {cid}: already applied (block-insert)")
            continue

        n = raw.count(before[cid])
        if n != 1:
            if n == 0 and after[cid].strip() and after[cid] in raw:
                already.append(cid)
                print(f"SKIP  {cid}: already applied")
                continue
            skipped.append((cid, f"BEFORE matched {n}x, expected 1"))
            print(f"SKIP  {cid}: BEFORE matched {n}x, expected exactly 1")
            continue

        if not guard_base64(raw, before[cid], cid):
            return 2

        raw = raw.replace(before[cid], after[cid], 1)
        applied.append(cid)
        print(f"APPLY {cid}")

    if dry:
        print("\n--dry-run: nothing written")
    elif raw != original:
        open(target_abs, "w", encoding="utf-8", newline="").write(raw)
        print(f"\nWROTE {target_path}")
    else:
        print("\nNo change to write")

    print(f"\napplied {len(applied)}, skipped {len(skipped)}, "
          f"withdrawn {len(withdrawn)}, of {len(before)} in spec")
    if skipped:
        print("\nSKIPPED - these need a human:")
        for cid, why in skipped:
            print(f"  {cid}: {why}")
    return 1 if skipped else 0


if __name__ == "__main__":
    sys.exit(main())
