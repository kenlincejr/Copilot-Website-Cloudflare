#!/usr/bin/env python3
"""List, reset or remove Executive Summit conversation profiles.

Attendees write up to three conversation topics (and an optional LinkedIn link) about themselves in the guide. They live
in the table summit_profiles of the D1 database playbook_search. The first phone to save for a person claims that profile;
use --reset when someone changes phones or loses their saved data, or --remove to take a profile down.
Python 3 standard library only.

Usage (PowerShell, repo root):
    python tools/summit-profiles.py                  # list everything
    python tools/summit-profiles.py --reset jacob-sanders    # let that person save again from a new phone (keeps the topics)
    python tools/summit-profiles.py --remove jacob-sanders   # delete the profile
    python tools/summit-profiles.py --remove all     # asks you to type yes first (add --yes to skip the question)
"""

import argparse
import json
import os
import re
import subprocess
import sys

DB = "playbook_search"
WORKER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workers", "summit-usage")


def run_sql(sql, want_rows=False):
    cmd = f'npx wrangler d1 execute {DB} --remote --json --command "{sql}"'
    out = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=WORKER_DIR)
    text = out.stdout
    start = text.find("[")
    if out.returncode != 0 or start < 0:
        sys.exit("wrangler could not reach the database:\n" + (out.stderr or text)[-600:])
    data = json.loads(text[start:])
    return data[0].get("results", []) if want_rows else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", metavar="ID", help="clear the phone claim for one person id, keeping their topics")
    ap.add_argument("--remove", metavar="ID", help="delete one profile, or 'all'")
    ap.add_argument("--yes", action="store_true", help="skip the confirmation question for --remove all")
    args = ap.parse_args()
    for v in (args.reset, args.remove):
        if v and v != "all" and not re.fullmatch(r"[a-z0-9-]{3,40}", v):
            sys.exit("That is not a valid person id (lowercase letters, digits and hyphens).")
    if args.reset == "all":
        sys.exit("Reset one person at a time.")
    if args.reset:
        # An empty hash can never match a phone's token, so the next phone to save claims the profile again.
        run_sql(f"UPDATE summit_profiles SET token_hash = '' WHERE pid = '{args.reset}'")
        print(f"Reset {args.reset}. The next phone to save for that person claims it.")
        return
    if args.remove:
        if args.remove == "all" and not args.yes:
            try:
                typed = input("This deletes every saved conversation profile and frees every phone claim. Type yes to continue: ").strip().lower()
            except EOFError:
                typed = ""
            if typed != "yes":
                sys.exit("Nothing removed.")
        run_sql("DELETE FROM summit_profiles" + ("" if args.remove == "all" else f" WHERE pid = '{args.remove}'"))
        print(f"Removed {args.remove}.")
        return
    rows = run_sql("SELECT pid, ts, t1, t2, t3, linkedin FROM summit_profiles ORDER BY ts DESC", True)
    if not rows:
        print("No profiles yet.")
        return
    for r in rows:
        print(f"{r['pid']}  (updated {r['ts']})")
        for t in (r["t1"], r["t2"], r["t3"]):
            if t:
                print(f"    - {t}")
        if r["linkedin"]:
            print(f"    LinkedIn: {r['linkedin']}")
    print(f"\n{len(rows)} profile(s).")


if __name__ == "__main__":
    main()
