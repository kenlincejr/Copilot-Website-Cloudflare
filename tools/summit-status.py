#!/usr/bin/env python3
"""One-command health and status check for the Executive Summit guide during the event.

Read-only. Checks that the page and both Workers answer, then reads today's numbers from the D1 database
playbook_search through `npx wrangler d1 execute --remote` (your wrangler login). It sends no question to the
assistant and spends nothing: the assistant check posts an empty body, which a healthy, configured Worker
answers with 400 (503 means the API key is missing). Python 3 standard library only. Times are Hawaii time (UTC-10).

Usage (PowerShell, repo root):
    python tools/summit-status.py              # one check
    python tools/summit-status.py --watch 120  # repeat every 120 seconds until you press Ctrl+C
    python tools/summit-status.py --no-db      # only the live endpoint checks (fast, no wrangler)

What it prints: whether the page, announcements and assistant answer; assistant questions used today against the
daily limit of 1200; phones and taps in the last hour and how long since the last tap (a quiet guide during
the event is the first sign of a problem); today's busiest connection against the per-connection limits; active
announcements; profiles with topics; ratings today; any live PIN lockouts. It ends with the one-line live
assistant audit you can run if something looks wrong (about 1 cent for 3 questions).
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

DB = "playbook_search"
WORKER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "workers", "summit-usage")
PAGE = "https://copilotplaybook.com/executive-summit.html"
USAGE = "https://summit-usage.ken-lince.workers.dev"
AI = "https://summit-ai.ken-lince.workers.dev"
ORIGIN = "https://copilotplaybook.com"
UA = "Mozilla/5.0 (summit-status)"
AI_DAILY, AI_PER_CONN, USAGE_PER_CONN = 1200, 2000, 20000   # keep in step with wrangler.jsonc and workers/summit-usage CAPS
HST = timezone(timedelta(hours=-10))


def http(url, method="GET", body=None, origin=True, timeout=20):
    headers = {"User-Agent": UA}
    if origin:
        headers["Origin"] = ORIGIN
    if body is not None:
        headers["Content-Type"] = "text/plain"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read(65536), time.time() - t0
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read(65536), time.time() - t0
    except Exception as e:  # network down, DNS, timeout
        return 0, {}, str(e).encode(), time.time() - t0


def flag(ok, warn=False):
    return "OK  " if ok else ("WARN" if warn else "FAIL")


def live_checks():
    print("Live endpoints")
    print("--------------")
    s, h, b, dt = http(PAGE, "HEAD", origin=False)
    print(f"  {flag(s == 200)} page            {s}  {dt:.1f}s  etag {h.get('ETag', h.get('Etag', '-'))}  modified {h.get('Last-Modified', '-')}")
    s, h, b, dt = http(USAGE + "/a")
    alerts = []
    try:
        alerts = json.loads(b).get("alerts", [])
    except Exception:
        pass
    print(f"  {flag(s == 200 and b.startswith(b'{'))} announcements   {s}  {dt:.1f}s  {len(alerts)} active")
    s, h, b, dt = http(AI + "/ask", "POST", b"{}")
    meaning = {400: "answering (key present)", 503: "API KEY MISSING (not-configured)", 403: "origin refused", 0: "no answer"}.get(s, "unexpected")
    print(f"  {flag(s == 400, warn=False)} assistant        {s}  {dt:.1f}s  {meaning}")
    s, h, b, dt = http(AI + "/ask", "OPTIONS")
    print(f"  {flag(s == 204 and h.get('Access-Control-Allow-Origin') == ORIGIN)} assistant CORS   {s}")


def run_db(sql):
    """Runs one read-only statement through wrangler and returns its rows."""
    npx = "npx.cmd" if os.name == "nt" else "npx"
    out = subprocess.run([npx, "wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql], capture_output=True, text=True, encoding="utf-8", cwd=WORKER_DIR)
    text = out.stdout
    start = text.find("[")
    if out.returncode != 0 or start < 0:
        sys.exit("wrangler could not read the database:" + chr(10) + (out.stderr or text)[-600:])
    return json.loads(text[start:])[0].get("results", [])


def hm(ms):
    return datetime.fromtimestamp(ms / 1000, HST).strftime("%a %I:%M %p").replace(" 0", " ")


def db_checks():
    now = datetime.now(HST)
    day = now.strftime("%Y-%m-%d")
    midnight = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp() * 1000)
    now_ms = int(time.time() * 1000)
    hour_ago = now_ms - 3600 * 1000
    row = run_db(
        "SELECT "
        f"(SELECT COALESCE(SUM(n),0) FROM summit_ai_usage WHERE day='{day}' AND did NOT LIKE 'ip:%') AS asks, "
        f"(SELECT COUNT(*) FROM summit_ai_usage WHERE day='{day}' AND did NOT LIKE 'ip:%') AS ai_phones, "
        f"(SELECT COUNT(DISTINCT did) FROM summit_events WHERE ts > {hour_ago}) AS hour_phones, "
        f"(SELECT COUNT(*) FROM summit_events WHERE ts > {hour_ago}) AS hour_events, "
        f"(SELECT COUNT(DISTINCT did) FROM summit_events WHERE ts >= {midnight}) AS today_phones, "
        f"(SELECT COUNT(*) FROM summit_events WHERE ts >= {midnight}) AS today_events, "
        "(SELECT MAX(ts) FROM summit_events) AS last_ts, "
        f"(SELECT COALESCE(MAX(n),0) FROM summit_ai_usage WHERE day='{day}' AND did LIKE 'ip:%') AS ai_ip, "
        f"(SELECT COALESCE(MAX(fails),0) FROM summit_lockout WHERE key LIKE 'cap:u:{day}:%') AS u_ip, "
        "(SELECT COUNT(*) FROM summit_profiles WHERE t1 IS NOT NULL OR t2 IS NOT NULL OR t3 IS NOT NULL) AS profiles, "
        f"(SELECT COUNT(*) FROM summit_feedback WHERE ts >= {midnight}) AS fb_today, "
        "(SELECT COUNT(*) FROM summit_feedback) AS fb_total, "
        f"(SELECT COUNT(*) FROM summit_lockout WHERE key NOT LIKE 'cap:%' AND until > {now_ms}) AS locked")[0]
    alerts = run_db(f"SELECT id, ts, level, substr(body,1,70) AS body, until FROM summit_alerts WHERE active=1 AND (until IS NULL OR until > {now_ms}) ORDER BY id DESC LIMIT 5")
    print()
    print(f"Today so far (Hawaii {now.strftime('%A %B %d, %I:%M %p').replace(' 0', ' ')})")
    print("-" * 45)
    asks = int(row["asks"])
    print(f"  {flag(asks < AI_DAILY * 0.8, warn=asks < AI_DAILY)} assistant questions   {asks} of {AI_DAILY} daily limit, from {row['ai_phones']} phones")
    print(f"  {flag(int(row['ai_ip']) < AI_PER_CONN * 0.8, warn=True)} busiest connection   {row['ai_ip']} of {AI_PER_CONN} assistant questions (the hotel Wi-Fi counts as one)")
    print(f"  {flag(int(row['u_ip']) < USAGE_PER_CONN * 0.8, warn=True)} busiest connection   {row['u_ip']} of {USAGE_PER_CONN} guide taps sent")
    print(f"        phones today         {row['today_phones']} phones, {row['today_events']} taps")
    last_ts = row["last_ts"]
    if last_ts:
        quiet = (now_ms - int(last_ts)) / 60000
        print(f"  {flag(quiet < 30, warn=True)} last tap received    {hm(int(last_ts))}  ({quiet:.0f} minutes ago)  [quiet is normal overnight, not during the day]")
    else:
        print("  WARN last tap received    none yet")
    print(f"        last hour            {row['hour_phones']} phones, {row['hour_events']} taps")
    print(f"        profiles with topics {row['profiles']}")
    print(f"        ratings              {row['fb_today']} today, {row['fb_total']} in all")
    print(f"  {flag(int(row['locked']) == 0, warn=True)} PIN lockouts live    {row['locked']}")
    print()
    print("Active announcements" + ("" if alerts else ": none"))
    for a in alerts:
        print(f"  #{a['id']}  {a['level']:6}  posted {hm(a['ts'])}  expires {hm(a['until']) if a.get('until') else 'never'}  {a['body']}")


def main():
    ap = argparse.ArgumentParser(description="Health and status check for the Executive Summit guide")
    ap.add_argument("--watch", type=int, metavar="SECONDS", help="repeat every N seconds (Ctrl+C to stop)")
    ap.add_argument("--no-db", action="store_true", help="only the live endpoint checks")
    a = ap.parse_args()
    while True:
        print("\n" + "=" * 60)
        print("Executive Summit guide status  " + datetime.now(HST).strftime("%I:%M:%S %p Hawaii").lstrip("0"))
        print("=" * 60)
        live_checks()
        if not a.no_db:
            db_checks()
        print()
        print("If the assistant looks wrong, run this (about 1 cent, three questions):")
        print("  python tools\\summit-ai-audit.py --run -n 3")
        if not a.watch:
            return
        try:
            time.sleep(max(15, a.watch))
        except KeyboardInterrupt:
            return


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
