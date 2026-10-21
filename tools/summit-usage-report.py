#!/usr/bin/env python3
"""Executive Summit guide usage report.

Reads the anonymous counts the guide sends to workers/summit-usage (table summit_events in the
D1 database playbook_search) through `npx wrangler d1 execute --remote`, using your wrangler login.
Read-only. Python 3 standard library only. Times are Hawaii time (UTC-10).

What is counted: opens, tab views, map pins, agenda days, contact cards created and shown, concierge
call and email taps, refreshes. What is never stored: names, contact details, what is typed into the
contact card, IP address or user agent. A "device" is a random id the phone made for itself.

Usage (PowerShell, repo root):
    python tools/summit-usage-report.py              # everything so far
    python tools/summit-usage-report.py --csv out    # also write CSV files into the folder "out"
"""

import argparse
import csv
import json
import os
import subprocess
import sys

DB = "playbook_search"
HST = "'unixepoch','-10 hours'"


def q(sql):
    cmd = f'npx wrangler d1 execute {DB} --remote --json --command "{sql}"'
    out = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workers", "summit-usage"))
    text = out.stdout
    start = text.find("[")
    if out.returncode != 0 or start < 0:
        sys.exit("wrangler could not read the database:\n" + (out.stderr or text)[-600:])
    return json.loads(text[start:])[0].get("results", [])


def show(title, rows, cols, csvdir=None, name=None):
    print()
    print(title)
    print("-" * len(title))
    if not rows:
        print("  (nothing yet)")
        return
    widths = [max(len(str(c)), *(len(str(r.get(c, ""))) for r in rows)) for c in cols]
    print("  " + "  ".join(str(c).ljust(w) for c, w in zip(cols, widths)))
    for r in rows:
        print("  " + "  ".join(str(r.get(c, "")).ljust(w) for c, w in zip(cols, widths)))
    if csvdir and name:
        os.makedirs(csvdir, exist_ok=True)
        with open(os.path.join(csvdir, name + ".csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            for r in rows:
                w.writerow({c: r.get(c, "") for c in cols})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", metavar="FOLDER", help="also write each table as a CSV file")
    a = ap.parse_args()

    tot = q("SELECT COUNT(DISTINCT did) AS devices, COUNT(*) AS events, "
            f"datetime(MIN(ts)/1000,{HST}) AS first_seen, datetime(MAX(ts)/1000,{HST}) AS last_seen FROM summit_events")[0]
    print("EXECUTIVE SUMMIT GUIDE USAGE (Hawaii time)")
    print("=" * 42)
    print(f"  Unique devices : {tot['devices']}")
    print(f"  Events         : {tot['events']}")
    print(f"  First / last   : {tot['first_seen']}  /  {tot['last_seen']}")
    if not tot["events"]:
        print("\nNo data yet. The guide reports only from copilotplaybook.com, never in rehearsal mode (?now=) or with Do Not Track.")
        return

    show("Devices and opens by day",
         q(f"SELECT date(ts/1000,{HST}) AS day, COUNT(DISTINCT did) AS devices, SUM(kind='open') AS opens FROM summit_events GROUP BY day ORDER BY day"),
         ["day", "devices", "opens"], a.csv, "by_day")
    show("How they opened it (installed app vs browser)",
         q("SELECT COALESCE(mode,'unknown') AS mode, COUNT(DISTINCT did) AS devices FROM summit_events GROUP BY mode ORDER BY devices DESC"),
         ["mode", "devices"], a.csv, "app_vs_browser")
    show("Tab views (people who viewed each tab, and total views)",
         q("SELECT label AS tab, COUNT(DISTINCT did) AS devices, COUNT(*) AS views FROM summit_events WHERE kind='view' GROUP BY label ORDER BY views DESC"),
         ["tab", "devices", "views"], a.csv, "tabs")
    show("Agenda days viewed",
         q("SELECT label AS day, COUNT(DISTINCT did) AS devices, COUNT(*) AS views FROM summit_events WHERE kind='day' GROUP BY label ORDER BY views DESC"),
         ["day", "devices", "views"], a.csv, "agenda_days")
    show("Map: which map (1 resort, 2 trails, 3 inside)",
         q("SELECT label AS map, COUNT(DISTINCT did) AS devices, COUNT(*) AS switches FROM summit_events WHERE kind='map_tab' GROUP BY label ORDER BY switches DESC"),
         ["map", "devices", "switches"], a.csv, "map_tabs")
    show("Map: most-tapped places",
         q("SELECT label AS place, COUNT(DISTINCT did) AS devices, COUNT(*) AS taps FROM summit_events WHERE kind='pin' GROUP BY label ORDER BY taps DESC LIMIT 20"),
         ["place", "devices", "taps"], a.csv, "pins")
    show("Contact cards and resort contact taps",
         q("SELECT kind, COUNT(DISTINCT did) AS devices, COUNT(*) AS times FROM summit_events WHERE kind IN ('card_made','card_shown','call','mail','refresh') GROUP BY kind ORDER BY times DESC"),
         ["kind", "devices", "times"], a.csv, "actions")
    show("Weather feed (ok = weather and ocean both loaded)",
         q("SELECT label AS result, COUNT(*) AS loads FROM summit_events WHERE kind='weather' GROUP BY label"),
         ["result", "loads"], a.csv, "weather")
    show("Busiest hours (Hawaii time)",
         q(f"SELECT strftime('%m-%d %H:00', ts/1000, {HST}) AS hour, COUNT(DISTINCT did) AS devices FROM summit_events GROUP BY hour ORDER BY devices DESC LIMIT 12"),
         ["hour", "devices"], a.csv, "busiest_hours")


if __name__ == "__main__":
    main()
