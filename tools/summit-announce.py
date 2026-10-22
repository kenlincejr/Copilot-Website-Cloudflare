#!/usr/bin/env python3
"""Post, list or clear Executive Summit guide announcements.

An announcement shows as a banner at the top of the guide on every attendee's phone within about a minute.
It is stored in the table summit_alerts of the D1 database playbook_search, written through
`npx wrangler d1 execute --remote` with your wrangler login. Python 3 standard library only.

Usage (PowerShell, repo root):
    python tools/summit-announce.py "The bus to Secret Beach leaves at 1:20, not 1:30"
    python tools/summit-announce.py "Severe surf advisory today. Stay out of the water." --urgent
    python tools/summit-announce.py "Dinner moves to 6:30" --hours 12      # disappears after 12 hours (default 36)
    python tools/summit-announce.py --list
    python tools/summit-announce.py --clear 3        # clear one announcement
    python tools/summit-announce.py --clear all      # asks you to type yes first (add --yes to skip the question)
"""

import argparse
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time

DB = "playbook_search"
WORKER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workers", "summit-usage")


def run_sql(sql, want_rows=False):
    """Reads use --command (the SQL here never contains user text). Writes go through a temp file so the
    announcement text can hold any quotes without being mangled by the shell."""
    path = None
    if want_rows:
        cmd = f'npx wrangler d1 execute {DB} --remote --json --command "{sql}"'
    else:
        with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as f:
            f.write(sql)
            path = f.name
        cmd = f'npx wrangler d1 execute {DB} --remote --json --file "{path}"'
    try:
        out = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=WORKER_DIR)
    finally:
        if path:
            os.unlink(path)
    text = out.stdout
    start = text.find("[")
    if out.returncode != 0 or start < 0:
        sys.exit("wrangler could not reach the database:\n" + (out.stderr or text)[-600:])
    data = json.loads(text[start:])
    return data[0].get("results", []) if want_rows else None


def esc(s):
    return s.replace("'", "''")


def clear_target(v):
    """--clear takes a whole-number announcement id or the word all."""
    v = v.strip()
    if v.lower() == "all":
        return "all"
    if not re.fullmatch(r"[0-9]{1,9}", v) or int(v) < 1:
        raise argparse.ArgumentTypeError(f"'{v}' is not an announcement id. Use a whole number from --list, or all.")
    return int(v)


def hours_value(v):
    """--hours takes a positive number, up to one year."""
    try:
        h = float(v)
    except ValueError:
        h = float("nan")
    if not math.isfinite(h) or h <= 0 or h > 8760:
        raise argparse.ArgumentTypeError(f"'{v}' is not a number of hours. Use a positive number, such as 12 or 0.5 (at most 8760).")
    return h


def confirm(question):
    """Typed yes, or nothing happens. A closed or empty stdin counts as no."""
    try:
        return input(f"{question} Type yes to continue: ").strip().lower() == "yes"
    except EOFError:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("text", nargs="?", help="the announcement (up to 280 characters)")
    ap.add_argument("--urgent", action="store_true", help="show it as an urgent (yellow) banner")
    ap.add_argument("--hours", type=hours_value, default=36, help="hours until it disappears on its own (default 36)")
    ap.add_argument("--list", action="store_true", help="show current announcements")
    ap.add_argument("--clear", type=clear_target, metavar="ID|all", help="clear one announcement by id, or all of them (all asks for a typed yes)")
    ap.add_argument("--yes", action="store_true", help="skip the confirmation question for --clear all")
    a = ap.parse_args()

    if a.clear is not None:
        if a.clear == "all":
            if not a.yes and not confirm("This takes down every active announcement on every phone."):
                sys.exit("Nothing cleared.")
            run_sql("UPDATE summit_alerts SET active = 0 WHERE active = 1;")
            print("Cleared all announcements.")
        else:
            run_sql(f"UPDATE summit_alerts SET active = 0 WHERE id = {a.clear};")
            print(f"Cleared announcement {a.clear}.")
        return
    if a.list or not a.text:
        rows = run_sql("SELECT id, level, datetime(ts/1000,'unixepoch','-10 hours') AS posted_hst, "
                       "CASE WHEN until IS NULL THEN 'until cleared' ELSE datetime(until/1000,'unixepoch','-10 hours') END AS expires_hst, body "
                       "FROM summit_alerts WHERE active = 1 ORDER BY id DESC;", want_rows=True)
        if not rows:
            print("No active announcements.")
        for r in rows:
            print(f"[{r['id']}] {r['level']:<6} posted {r['posted_hst']} HST, expires {r['expires_hst']}\n     {r['body']}")
        return

    text = a.text.strip()
    if not text or len(text) > 280:
        sys.exit(f"Keep it between 1 and 280 characters (this one is {len(text)}).")
    now = int(time.time() * 1000)
    until = now + int(a.hours * 3600 * 1000)
    level = "urgent" if a.urgent else "info"
    run_sql(f"INSERT INTO summit_alerts (ts, level, body, until, active) VALUES ({now}, '{level}', '{esc(text)}', {until}, 1);")
    print(f"Posted ({level}, shows for {a.hours:g} hours). Phones pick it up within about a minute.")
    print(f"  {text}")


if __name__ == "__main__":
    main()
