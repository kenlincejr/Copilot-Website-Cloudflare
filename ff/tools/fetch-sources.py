#!/usr/bin/env python3
"""
fetch-sources.py — pull every external feed the signal layer needs, to disk.

This tool touches the network. `bake-players.py` does not, and that separation is
the point of having two tools. At 18:55 on draft night, on hotel wifi that is
dropping packets, the bake has to produce either the same board it produced this
morning or a clean failure — never a board that is silently missing expert
consensus because one GET timed out. So the network lives here, the bake reads
only from disk, and the manifest is how the bake knows how old what it is reading
happens to be.

Usage
  python fetch-sources.py                 fetch everything whose TTL has expired
  python fetch-sources.py --list          print the manifest as an age table, exit
  python fetch-sources.py --only ecr      fetch one source (repeatable)
  python fetch-sources.py --force         ignore TTLs and refetch
  python fetch-sources.py --snapshot      also write today's ADP snapshot

Output
  tools/raw/manifest.json   per source: url, fetched, bytes, sha256[:12], etag, asof
  tools/raw/<name>.<ext>    the payload, written atomically
  tools/snapshots/adp-YYYY-MM-DD.json   committed; see the note below

Why tools/snapshots/ is committed when tools/raw/ is not
  Velocity — how fast a player is moving in a market — cannot be computed from one
  observation. It needs two, taken on different days, and no endpoint on the list
  publishes a historical series. So the snapshot files are the only record that a
  given day ever happened, they are ~15 KB each, and losing them to a `git clean`
  is a failure you cannot recover from by re-running anything. They are small and
  irreplaceable, which is exactly the profile of a thing that belongs in git.

Manners
  Every source here is free, keyless and run by somebody else. Requests are
  sequential with a pause between them, conditional where the server supports it,
  and skipped entirely while the local copy is inside its TTL. Sleeper asks that
  its player feed be called at most once a day; the TTL below makes that
  mechanically true rather than something a person has to remember.
"""

import argparse, datetime, hashlib, json, os, ssl, sys, time
import urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
SNAPS = os.path.join(HERE, "snapshots")
MANIFEST = os.path.join(RAW, "manifest.json")

UA = "draftline/1.0 (personal fantasy football tool; contact via repo)"
TIMEOUT = 60
PAUSE = 1.0

NFLVERSE = "https://github.com/nflverse/nflverse-data/releases/download"

# ESPN's player endpoint is filtered by a header, not a query string. A mangled
# filter returns 400, and one documented variant of it (filterStatsForTopScoring
# PeriodIds) returns 400 even when well-formed — so this is a frozen constant and
# must never be built by interpolation.
ESPN_FILTER = json.dumps({
    "players": {
        "limit": 1500,
        "filterStatsForSplitTypeIds": {"value": [0]},
        "sortDraftRanks": {"sortPriority": 100, "sortAsc": True, "value": "PPR"},
    }
}, separators=(",", ":"))


# Sentinel for a source that must be fetched with urllib's own User-Agent.
NO_UA = {"User-Agent": None}


def espn_scoreboard(week):
    return ("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
            "?seasontype=2&week=%d&dates=2026" % week)


# name -> (url, filename, ttl_seconds, extra_headers)
#
# TTLs are set by how fast the thing behind them actually changes, not by how
# fresh it would be nice to have. Sleeper's 2025 season stats have been frozen
# since January; refetching 2.45 MB of them hourly is rude and buys nothing.
SOURCES = {
    "ecr":       ("https://raw.githubusercontent.com/dynastyprocess/data/master/"
                  "files/db_fpecr_latest.csv", "db_fpecr_latest.csv", 21600, {}),
    "roster":    (NFLVERSE + "/rosters/roster_2026.csv", "roster_2026.csv", 21600, {}),
    "stats25":   (NFLVERSE + "/stats_player/stats_player_reg_2025.csv",
                  "stats_player_reg_2025.csv", 2592000, {}),
    "snaps25":   (NFLVERSE + "/snap_counts/snap_counts_2025.csv",
                  "snap_counts_2025.csv", 2592000, {}),
    "draft":     (NFLVERSE + "/draft_picks/draft_picks.csv", "draft_picks.csv", 2592000, {}),
    "espn_kona": ("https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026"
                  "/segments/0/leaguedefaults/3?view=kona_player_info",
                  "espn_kona.json", 10800, {"X-Fantasy-Filter": ESPN_FILTER}),
    # site.api.espn.com 403s on a custom User-Agent and answers 200 on urllib's
    # default. Backwards from every other host here, verified 2026-09-05, and the
    # reason NO_UA exists. Do not "fix" these by adding the polite UA back.
    "espn_w01":  (espn_scoreboard(1),  "espn_scoreboard_w01.json", 21600, NO_UA),
    "espn_w15":  (espn_scoreboard(15), "espn_scoreboard_w15.json", 21600, NO_UA),
    "espn_w16":  (espn_scoreboard(16), "espn_scoreboard_w16.json", 21600, NO_UA),
    "espn_w17":  (espn_scoreboard(17), "espn_scoreboard_w17.json", 21600, NO_UA),
    "ffc":       ("https://fantasyfootballcalculator.com/api/v1/adp/ppr"
                  "?teams=12&year=2026&position=all", "ffc_ppr.json", 21600, {}),
}


# ---------------------------------------------------------------- manifest

def load_manifest():
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_manifest(m):
    write_atomic(MANIFEST, json.dumps(m, indent=1, sort_keys=True).encode("utf-8"))


def write_atomic(path, data):
    """A killed fetch must never leave a truncated CSV where the bake will find
    it and happily parse the first 40% of a file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def age_str(iso):
    if not iso:
        return "never"
    try:
        t = datetime.datetime.fromisoformat(iso)
    except Exception:
        return "?"
    secs = (datetime.datetime.now() - t).total_seconds()
    if secs < 3600:
        return "%dm" % (secs // 60)
    if secs < 86400:
        return "%.1fh" % (secs / 3600)
    return "%.1fd" % (secs / 86400)


# ---------------------------------------------------------------- as-of

def extract_asof(name, path):
    """The source's own idea of when its data is from, which is not the same
    thing as when we downloaded it. The ECR mirror is a standing example: it
    carries a scrape_date that can be days behind the moment you fetch it, and a
    signal that reports its download time as its freshness is lying."""
    try:
        if name == "ecr":
            import csv, io
            with open(path, encoding="utf-8", errors="replace") as f:
                for row in csv.DictReader(f):
                    if row.get("scrape_date"):
                        return row["scrape_date"][:10]
            return None
        if name == "espn_kona":
            with open(path, encoding="utf-8", errors="replace") as f:
                d = json.load(f)
            for p in d.get("players", [])[:50]:
                own = (p.get("player") or {}).get("ownership") or {}
                if own.get("date"):
                    return datetime.datetime.fromtimestamp(
                        own["date"] / 1000).date().isoformat()
            return None
    except Exception as e:
        print("    (could not read an as-of date: %s)" % e)
    return None


# ---------------------------------------------------------------- fetch

def fetch_one(name, force=False):
    url, fname, ttl, headers = SOURCES[name]
    path = os.path.join(RAW, fname)
    man = load_manifest()
    rec = man.get(name, {})

    if not force and os.path.exists(path) and rec.get("fetched"):
        try:
            t = datetime.datetime.fromisoformat(rec["fetched"])
            if (datetime.datetime.now() - t).total_seconds() < ttl:
                print("  %-10s skip (fresh, %s old)" % (name, age_str(rec["fetched"])))
                return True
        except Exception:
            pass

    hdrs = dict({"User-Agent": UA}, **headers)
    hdrs = {k: v for k, v in hdrs.items() if v is not None}
    req = urllib.request.Request(url, headers=hdrs)
    # A 304 costs the server almost nothing and costs us one round trip instead
    # of 3.76 MB. Only offered when we already hold a copy to fall back on.
    if not force and os.path.exists(path):
        if rec.get("etag"):
            req.add_header("If-None-Match", rec["etag"])
        elif rec.get("last_modified"):
            req.add_header("If-Modified-Since", rec["last_modified"])

    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                body = r.read()
                rec = {
                    "url": url, "file": fname, "status": r.status,
                    "fetched": datetime.datetime.now().isoformat(timespec="seconds"),
                    "bytes": len(body),
                    "sha256": hashlib.sha256(body).hexdigest()[:12],
                    "etag": r.headers.get("ETag"),
                    "last_modified": r.headers.get("Last-Modified"),
                }
                write_atomic(path, body)
                rec["asof"] = extract_asof(name, path)
                man = load_manifest()
                man[name] = rec
                save_manifest(man)
                print("  %-10s %s  %s  %s%s" % (
                    name, r.status, human(len(body)), rec["sha256"],
                    "  asof " + rec["asof"] if rec.get("asof") else ""))
                return True
        except urllib.error.HTTPError as e:
            if e.code == 304:
                man = load_manifest()
                man.setdefault(name, {}).update(
                    {"fetched": datetime.datetime.now().isoformat(timespec="seconds"),
                     "status": 304})
                save_manifest(man)
                print("  %-10s 304 not modified" % name)
                return True
            if e.code >= 500 and attempt == 1:
                time.sleep(3)
                continue
            print("  %-10s FAIL HTTP %s" % (name, e.code))
            return False
        except Exception as e:
            if attempt == 1:
                time.sleep(3)
                continue
            print("  %-10s FAIL %s" % (name, e))
            return False
    return False


def human(n):
    for unit in ("B", "KB", "MB"):
        if n < 1024 or unit == "MB":
            return "%.0f%s" % (n, unit) if unit == "B" else "%.1f%s" % (n, unit)
        n /= 1024.0


# ---------------------------------------------------------------- snapshots

def write_snapshot():
    """Today's ADP, from every market we can see, keyed by name.

    This is the input to velocity and it is the one thing in this tool that
    cannot be recovered by running the tool again tomorrow. Two observations on
    two days is the minimum that makes "he is moving" a measurable claim rather
    than a feeling."""
    import csv, io
    today = datetime.date.today().isoformat()
    out = {"fetched": datetime.datetime.now().isoformat(timespec="seconds"),
           "date": today, "markets": {}}

    # FFC — real 12-team PPR drafts, and the board's primary ADP
    try:
        with open(os.path.join(RAW, "ffc_ppr.json"), encoding="utf-8") as f:
            d = json.load(f)
        players = d.get("players") or d.get("data", {}).get("players") or []
        out["markets"]["ffc"] = {p["name"]: p["adp"] for p in players if p.get("adp")}
    except Exception as e:
        print("  snapshot: no FFC (%s)" % e)

    # ESPN — ownership ADP across their whole user base
    try:
        with open(os.path.join(RAW, "espn_kona.json"), encoding="utf-8") as f:
            d = json.load(f)
        m = {}
        for row in d.get("players", []):
            p = row.get("player") or {}
            own = p.get("ownership") or {}
            adp = own.get("averageDraftPosition")
            if p.get("fullName") and adp and adp > 0:
                m[p["fullName"]] = round(adp, 2)
        out["markets"]["espn"] = m
    except Exception as e:
        print("  snapshot: no ESPN (%s)" % e)

    # Sleeper — from the season projection file the bake already downloads
    try:
        with open(os.path.join(HERE, "sleeper.json"), encoding="utf-8") as f:
            d = json.load(f)
        m = {}
        for row in d:
            pl = row.get("player") or {}
            adp = (row.get("stats") or {}).get("adp_ppr")
            nm = " ".join(x for x in (pl.get("first_name"), pl.get("last_name")) if x)
            if nm and adp:
                m[nm] = round(adp, 2)
        out["markets"]["sleeper"] = m
    except Exception as e:
        print("  snapshot: no Sleeper (%s)" % e)

    os.makedirs(SNAPS, exist_ok=True)
    path = os.path.join(SNAPS, "adp-%s.json" % today)
    write_atomic(path, json.dumps(out, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    counts = ", ".join("%s %d" % (k, len(v)) for k, v in sorted(out["markets"].items()))
    print("  snapshot   adp-%s.json  (%s)" % (today, counts or "EMPTY"))
    return bool(out["markets"])


# ---------------------------------------------------------------- main

def cmd_list():
    man = load_manifest()
    print("%-11s %-8s %-9s %-11s %s" % ("source", "age", "bytes", "asof", "file"))
    for name in SOURCES:
        r = man.get(name, {})
        print("%-11s %-8s %-9s %-11s %s" % (
            name, age_str(r.get("fetched")),
            human(r["bytes"]) if r.get("bytes") else "-",
            r.get("asof") or "-", SOURCES[name][1]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--snapshot", action="store_true")
    ap.add_argument("--snapshot-only", action="store_true")
    a = ap.parse_args()

    if a.list:
        cmd_list()
        return 0

    os.makedirs(RAW, exist_ok=True)

    if a.snapshot_only:
        return 0 if write_snapshot() else 1

    names = a.only or list(SOURCES)
    bad = [n for n in names if n not in SOURCES]
    if bad:
        print("unknown source(s): %s\nknown: %s" % (", ".join(bad), ", ".join(SOURCES)))
        return 2

    print("fetching %d source(s) into tools/raw/" % len(names))
    ok = 0
    for i, n in enumerate(names):
        if fetch_one(n, force=a.force):
            ok += 1
        if i < len(names) - 1:
            time.sleep(PAUSE)

    if a.snapshot or not a.only:
        write_snapshot()

    print("\n%d of %d sources in hand." % (ok, len(names)))
    # A partial fetch is not a failure worth stopping a pipeline over — the bake
    # refuses signals individually and keeps going. But say so in the exit code
    # so a scripted pre-draft run can notice.
    return 0 if ok == len(names) else 1


if __name__ == "__main__":
    sys.exit(main())
