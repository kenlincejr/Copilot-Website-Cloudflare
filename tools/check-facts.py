#!/usr/bin/env python3
"""
check-facts.py - Phase 6 verification.

For every occurrence registered in data/facts.json, assert that its anchor
string still appears EXACTLY ONCE in the live file, and that the anchor still
contains the value the ledger says it contains.

This is what catches a missed occurrence in the cascade set: if an execution
chat updated `3.3%` in cpb.html but not in ledger.html, this reports it.

    python tools/check-facts.py            # full report
    python tools/check-facts.py --changed  # only anchors that no longer match
    python tools/check-facts.py --cascade  # only facts spanning >1 file

Exit code 0 = every anchor resolves uniquely, 1 = at least one does not.

IMPORTANT - reading the output after Phase 5:

A "MOVED" result is EXPECTED for any fact a spec deliberately changed. The
anchor was lifted from the pre-change file, so a successful edit invalidates
it. That is the point: MOVED tells you the edit landed. What you are hunting
for is the opposite - a fact in the cascade set where SOME files report MOVED
and others still report OK. That is a half-applied change, and it means the
site is now internally inconsistent.

After a spec merges, regenerate the affected anchors so the ledger tracks the
new baseline.
"""
import json
import sys
import os
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "data", "facts.json")


def main():
    changed_only = "--changed" in sys.argv
    cascade_only = "--cascade" in sys.argv

    if not os.path.exists(LEDGER):
        print("data/facts.json not found - run the Phase 2 sweep first")
        return 2

    data = json.load(open(LEDGER, encoding="utf-8"))
    facts = data["facts"]

    cache = {}

    def read(rel):
        if rel not in cache:
            p = os.path.join(ROOT, rel)
            cache[rel] = open(p, encoding="utf-8", errors="replace").read() \
                if os.path.exists(p) else None
        return cache[rel]

    stats = collections.Counter()
    problems = []

    for f in facts:
        files = {o["file"] for o in f["occurrences"]}
        if cascade_only and len(files) < 2:
            continue

        results = []
        for o in f["occurrences"]:
            raw = read(o["file"])
            if raw is None:
                verdict = "MISSING-FILE"
            else:
                n = raw.count(o["anchor"])
                if n == 1:
                    verdict = "OK" if f["value"] in o["anchor"] else "OK-NOVALUE"
                elif n == 0:
                    verdict = "MOVED"
                else:
                    verdict = f"AMBIGUOUS({n})"
            stats[verdict.split("(")[0]] += 1
            results.append((o["file"], o["line"], verdict))

        verdicts = {v for _, _, v in results}

        # the finding that matters: a cascade fact applied unevenly
        half = len(files) > 1 and "OK" in verdicts and "MOVED" in verdicts
        if half:
            problems.append((f, results))

        if changed_only and verdicts == {"OK"}:
            continue

        flag = "  <== HALF-APPLIED" if half else ""
        print(f"{f['id']} [{f['kind']}] {f['value']}{flag}")
        for fl, ln, v in results:
            print(f"     {v:14s} {fl}:{ln}")

    print()
    print("--- totals ---")
    for k, v in stats.most_common():
        print(f"  {v:5d}  {k}")

    if problems:
        print()
        print(f"!!! {len(problems)} cascade fact(s) applied to some files but "
              f"not others:")
        for f, _ in problems:
            print(f"    {f['id']}  {f['value']}")
        print("    The site is internally inconsistent. Fix before merging.")

    bad = stats["AMBIGUOUS"] + stats["MISSING-FILE"] + len(problems)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
