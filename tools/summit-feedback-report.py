#!/usr/bin/env python3
"""Executive Summit session feedback report.

Reads the session feedback the guide collects (table summit_feedback in the D1 database playbook_search) through
`npx wrangler d1 execute --remote`, with your wrangler login. Read-only. Python 3 standard library only.

Ratings and comments are anonymous. Name, company and contact are stored only when a person ticked the
"follow up with me" box, and they appear only in the follow-up section.

Usage (PowerShell, repo root):
    python tools/summit-feedback-report.py                 # summary on screen
    python tools/summit-feedback-report.py --csv out       # also write CSV files into the folder "out"
    python tools/summit-feedback-report.py --md notes.md   # write a plain-text digest you can hand to Claude to summarize
"""

import argparse
import csv
import json
import os
import subprocess
import sys

DB = "playbook_search"
WORKER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workers", "summit-usage")


def q(sql):
    cmd = f'npx wrangler d1 execute {DB} --remote --json --command "{sql}"'
    out = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=WORKER_DIR)
    text = out.stdout
    start = text.find("[")
    if out.returncode != 0 or start < 0:
        sys.exit("wrangler could not read the database:\n" + (out.stderr or text)[-600:])
    return json.loads(text[start:])[0].get("results", [])


def write_csv(folder, name, rows, cols):
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, name + ".csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in cols})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", metavar="FOLDER")
    ap.add_argument("--md", metavar="FILE")
    a = ap.parse_args()

    summary = q("SELECT session, MAX(title) AS title, COUNT(*) AS responses, ROUND(AVG(rating),2) AS avg_rating, "
                "SUM(rating>=4) AS fours_and_fives, SUM(rating<=2) AS ones_and_twos, SUM(followup) AS followups "
                "FROM summit_feedback GROUP BY session ORDER BY session")
    comments = q("SELECT session, title, rating, a1, a2 FROM summit_feedback WHERE (a1 IS NOT NULL OR a2 IS NOT NULL) ORDER BY session, rating DESC")
    follow = q("SELECT session, title, rating, name, company, contact, note FROM summit_feedback WHERE followup = 1 ORDER BY session, ts")

    print("EXECUTIVE SUMMIT SESSION FEEDBACK")
    print("=" * 33)
    if not summary:
        print("No feedback yet.")
        return
    total = sum(r["responses"] for r in summary)
    print(f"{total} responses across {len(summary)} sessions; {len(follow)} asked for a follow-up.\n")
    print(f"{'Session':<58} {'Resp':>4} {'Avg':>5} {'4-5':>4} {'1-2':>4} {'Follow':>6}")
    for r in summary:
        t = (r["title"] or r["session"])[:56]
        print(f"{t:<58} {r['responses']:>4} {r['avg_rating']:>5} {r['fours_and_fives']:>4} {r['ones_and_twos']:>4} {r['followups']:>6}")
    if follow:
        print("\nFOLLOW-UP REQUESTS")
        print("-" * 18)
        for r in follow:
            who = ", ".join(x for x in (r.get("name"), r.get("company")) if x) or "(no name given)"
            print(f"- {who} | {r.get('contact') or 'no contact given'} | {r['title'] or r['session']} ({r['rating']} stars)")
            if r.get("note"):
                print(f"    Wants to talk about: {r['note']}")

    if a.csv:
        write_csv(a.csv, "session_summary", summary, ["session", "title", "responses", "avg_rating", "fours_and_fives", "ones_and_twos", "followups"])
        write_csv(a.csv, "comments", comments, ["session", "title", "rating", "a1", "a2"])
        write_csv(a.csv, "followups", follow, ["session", "title", "rating", "name", "company", "contact", "note"])
        print(f"\nWrote CSV files to {a.csv}")
    if a.md:
        lines = ["# Executive Summit session feedback", ""]
        for r in summary:
            lines += [f"## {r['title'] or r['session']}", f"{r['responses']} responses, average {r['avg_rating']} of 5.", ""]
            for c in (x for x in comments if x["session"] == r["session"]):
                lines.append(f"- {c['rating']} stars. Most useful: {c['a1'] or '(blank)'} | Change or more of: {c['a2'] or '(blank)'}")
            lines.append("")
        lines += ["## Follow-up requests", ""]
        for r in follow:
            lines.append(f"- {r.get('name') or 'Unnamed'} ({r.get('company') or 'no company'}), {r.get('contact') or 'no contact'}: {r['title'] or r['session']}. {r.get('note') or ''}")
        with open(a.md, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        print(f"Wrote digest to {a.md}")


if __name__ == "__main__":
    main()
