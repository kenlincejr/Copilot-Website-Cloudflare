#!/usr/bin/env python3
"""Site usage report: real visitors and what they search for.

Two sources, both read-only:

  Visitors   Cloudflare Web Analytics (the JS beacon on every page), through
             the GraphQL Analytics API. Bots that never run the beacon are not
             counted, and the bot flag removes most of the ones that do. Counts
             are sampled, so they come back rounded to tens. Needs
             CLOUDFLARE_API_TOKEN: a token with Account > Account Analytics >
             Read. Without it this section is skipped.
  Search     The playbook_search D1 log written by workers/search-log, read
             through `npx wrangler d1 execute` with your wrangler login.

Neither costs a search query. Python 3 stdlib only.

Usage (PowerShell, repo root):
    python tools/site-usage-report.py [--days 30]
"""

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ACCOUNT = "7688c4c427308a1436b3d389c3e3ef72"
SITE_TAG = "3b084e67ce5b43b28e664c09d4deb713"
HOST = "copilotplaybook.com"
GRAPHQL = "https://api.cloudflare.com/client/v4/graphql"
D1_NAME = "playbook_search"
# Rows written by our own tests, not visitors.
TEST_QUERIES = ("gate smoke test",)


def heading(text):
    print()
    print(text)
    print("-" * len(text))


def table(rows, cols, limit=None):
    rows = rows[:limit] if limit else rows
    if not rows:
        print("  (none)")
        return
    widths = [max(len(c), *(len(str(r.get(c, ""))) for r in rows)) for c in cols]
    print("  " + "  ".join(c.ljust(w) for c, w in zip(cols, widths)))
    for r in rows:
        print("  " + "  ".join(str(r.get(c, "")).ljust(w) for c, w in zip(cols, widths)))


# ── Visitors (Web Analytics) ──

def graphql(token, query, variables):
    body = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(GRAPHQL, data=body, method="POST", headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    if out.get("errors"):
        raise RuntimeError(out["errors"][0].get("message", "GraphQL error"))
    return out["data"]["viewer"]["accounts"][0]


def rum_groups(token, start, end, dimension, limit=10):
    dims = "dimensions{%s}" % dimension if dimension else ""
    query = (
        "query($a:String!,$s:Time!,$e:Time!){viewer{accounts(filter:{accountTag:$a}){"
        "rumPageloadEventsAdaptiveGroups(limit:%d,orderBy:[count_DESC],filter:{"
        "datetime_geq:$s,datetime_lt:$e,siteTag:\"%s\",requestHost:\"%s\",bot:0})"
        "{count sum{visits} %s}}}}" % (limit, SITE_TAG, HOST, dims)
    )
    acct = graphql(token, query, {"a": ACCOUNT, "s": start, "e": end})
    rows = []
    for g in acct["rumPageloadEventsAdaptiveGroups"]:
        row = {"page views": g["count"], "visits": g["sum"]["visits"]}
        if dimension:
            row[dimension] = g["dimensions"][dimension] or "(none)"
        rows.append(row)
    return rows


def visitors_section(days):
    heading("Visitors (Web Analytics, bots excluded, sampled)")
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not token:
        print("  Skipped: set CLOUDFLARE_API_TOKEN to a token with")
        print("  Account Analytics Read. Dashboard: Analytics > Web analytics.")
        return
    end = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    start = end - dt.timedelta(days=days)
    s, e = start.isoformat().replace("+00:00", "Z"), end.isoformat().replace("+00:00", "Z")
    try:
        total = rum_groups(token, s, e, None, 1)
        t = total[0] if total else {"visits": 0, "page views": 0}
        print("  %s visits, %s page views, last %d days" % (t["visits"], t["page views"], days))
        for dim, label, limit in (
            ("requestPath", "Top pages", 15),
            ("refererHost", "Where visits came from", 10),
            ("countryName", "Countries", 10),
            ("deviceType", "Devices", 5),
            ("date", "By day", days + 1),
        ):
            print()
            print("  " + label)
            rows = rum_groups(token, s, e, dim, limit)
            if dim == "date":
                rows.sort(key=lambda r: r["date"])
            table(rows, [dim, "visits", "page views"])
    except (urllib.error.URLError, RuntimeError, KeyError, IndexError) as err:
        print("  Could not read Web Analytics: %s" % err)


# ── Search (D1 log) ──

def d1(sql):
    cmd = "npx wrangler d1 execute %s --remote --json --command \"%s\"" % (D1_NAME, sql)
    run = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8")
    if run.returncode != 0:
        raise RuntimeError((run.stderr or run.stdout).strip().splitlines()[-1:] or ["wrangler failed"])
    return [stmt["results"] for stmt in json.loads(run.stdout)]


def search_section(days):
    heading("Search (playbook_search log)")
    since = "ts > (strftime('%%s','now') - %d*86400) * 1000" % days
    tests = " AND lower(coalesce(q,'')) NOT IN (%s)" % ",".join("'%s'" % q for q in TEST_QUERIES)
    w = "WHERE " + since + tests
    statements = [
        "SELECT kind, count(*) AS n FROM events %s GROUP BY kind ORDER BY n DESC" % w,
        "SELECT date(ts/1000,'unixepoch') AS day, sum(kind='search') AS searches, "
        "sum(kind='answer') AS answers, sum(kind='click') AS clicks FROM events %s GROUP BY day ORDER BY day" % w,
        "SELECT lower(q) AS query, count(*) AS times FROM events %s AND kind='search' "
        "GROUP BY lower(q) ORDER BY times DESC LIMIT 25" % w,
        "SELECT lower(q) AS query, count(*) AS times FROM events %s AND kind='zero' "
        "GROUP BY lower(q) ORDER BY times DESC LIMIT 15" % w,
        "SELECT lower(q) AS question, count(*) AS times FROM events %s AND kind IN ('answer','ask_page') "
        "GROUP BY lower(q) ORDER BY times DESC LIMIT 15" % w,
        "SELECT url AS page, count(*) AS clicks, round(avg(rank),1) AS avg_rank FROM events %s "
        "AND kind='click' GROUP BY url ORDER BY clicks DESC LIMIT 15" % w,
        "SELECT sum(n=1) AS helpful, sum(n=0) AS not_helpful FROM events %s AND kind='vote'" % w,
    ]
    try:
        kinds, by_day, top, zero, asks, clicks, votes = d1("; ".join(statements))
    except (RuntimeError, ValueError, OSError) as err:
        print("  Could not read the search log: %s" % err)
        print("  If wrangler's login expired, run: npx wrangler login")
        return
    totals = {r["kind"]: r["n"] for r in kinds}
    print("  %d searches, %d AI answers, %d page questions, %d result clicks, last %d days" % (
        totals.get("search", 0), totals.get("answer", 0), totals.get("ask_page", 0),
        totals.get("click", 0), days))
    v = votes[0] if votes else {}
    print("  AI answer votes: %s helpful, %s not helpful" % (v.get("helpful") or 0, v.get("not_helpful") or 0))
    for label, rows, cols in (
        ("By day", by_day, ["day", "searches", "answers", "clicks"]),
        ("Top searches", top, ["query", "times"]),
        ("Searches that found nothing (write these pages next)", zero, ["query", "times"]),
        ("Questions asked of the AI", asks, ["question", "times"]),
        ("Most clicked results", clicks, ["page", "clicks", "avg_rank"]),
    ):
        print()
        print("  " + label)
        table(rows, cols)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--days", type=int, default=30)
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("copilotplaybook.com usage, last %d days (run %s)" % (args.days, dt.date.today().isoformat()))
    visitors_section(args.days)
    search_section(args.days)


if __name__ == "__main__":
    main()
