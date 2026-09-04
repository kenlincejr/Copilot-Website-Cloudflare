#!/usr/bin/env python3
"""
bake-players.py — merge the research annotation layer with a Sleeper season
projection snapshot and emit /ff/data/players.js (a plain <script>, so the app
works from file:// with no network).

Inputs
  players.json   the 267-player research board (ADP, sd, tags, notes, dst_tier)
  sleeper.json   raw response from
                 https://api.sleeper.com/projections/nfl/2026?season_type=regular&position[]=...

Output
  ../data/players.js   globalThis.DRAFTLINE_DATA = { meta, players: [...] }

What we take from Sleeper, and what we don't
  TAKE  pass/rush/rec volume, TDs, INTs, fumbles, games, and DEF sack/int/fum/TD.
        These are RotoWire's real numbers and they differ player to player.
  DROP  Sleeper's rec_0_4 .. rec_40p buckets. They are a fixed 18/18/27/18/9/9
        percentage split applied to every player — synthetic, not projected.
        We estimate 40+ yard events ourselves and flag them `est`.
  DROP  Sleeper's kicker lines. Every kicker is projected identically
        (9/8/841/42 for all of them). We model kickers off positional rank.
  ADD   Points-allowed tier distributions driven by the researched dst_tier.
        Sleeper has no PA tiers at all, and PA is the single biggest scoring
        difference in a league with boosted D/ST tiers.
"""

import json, math, os, re, sys, unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "data", "players.js")

# ---------------------------------------------------------------- name keys

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}

def norm(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().replace(".", " ").replace("'", "").replace("-", " ")
    parts = [p for p in re.split(r"\s+", s) if p and p not in SUFFIXES]
    return " ".join(parts)

# ------------------------------------------------------- big-play estimators
# Rates below are league-average shares, applied to each player's own volume and
# efficiency. They move the needle only for the 40+ yard bonus categories, which
# are worth ~1 point each. Labeled `est: true` in the output so the UI can say so.

def est_events(pos, s):
    """Estimated counts of 40+ yard plays and 40+ yard TDs."""
    out = {}
    cmp_ = s.get("pass_cmp", 0)
    if cmp_:
        ypc = s.get("pass_yd", 0) / max(cmp_, 1)          # yards per completion
        out["comp40"] = round(cmp_ * 0.019 * (ypc / 11.5), 2)
        out["pass_td40"] = round(s.get("pass_td", 0) * 0.105, 2)
    att = s.get("rush_att", 0)
    if att:
        ypa = s.get("rush_yd", 0) / max(att, 1)
        out["run40"] = round(att * 0.0075 * (ypa / 4.3), 2)
        out["rush_td40"] = round(s.get("rush_td", 0) * 0.045, 2)
    rec = s.get("rec", 0)
    if rec:
        ypr = s.get("rec_yd", 0) / max(rec, 1)
        base = 0.030 if pos in ("WR", "TE") else 0.016
        out["rec40"] = round(rec * base * (ypr / 12.0), 2)
        out["rec_td40"] = round(s.get("rec_td", 0) * (0.13 if pos in ("WR", "TE") else 0.07), 2)
    return {k: v for k, v in out.items() if v}

# Per-game standard deviations used to turn a season total into an expected
# number of games clearing a yardage bonus threshold. Season totals alone can
# never trigger a per-game step function correctly (spec §4).
GAME_SD = {"pass": 78.0, "rush": 34.0, "rec": 32.0}

# ------------------------------------------------------- D/ST tier modelling
# Probability a tier-N defense lands in each points-allowed bucket in a game:
#   [0, 1-6, 7-13, 14-20, 21-27, 28-34, 35+]
# Calibrated so that, run through Ken's PA values (25/20/14/10/5/-1/-4), a tier-1
# unit lands near 175 season points and a tier-3 near 123 — the figures the
# research digest derives independently.
PA_DIST = {
    1: [0.040, 0.120, 0.220, 0.260, 0.200, 0.110, 0.050],
    2: [0.030, 0.090, 0.190, 0.250, 0.220, 0.150, 0.070],
    3: [0.020, 0.060, 0.150, 0.240, 0.240, 0.190, 0.100],
    4: [0.015, 0.045, 0.120, 0.210, 0.250, 0.220, 0.140],
    5: [0.010, 0.030, 0.090, 0.180, 0.250, 0.250, 0.190],
}
SAFETY_BY_TIER = {1: 1.1, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6}

# Team kick + punt return yardage credited to the D/ST. Weaker defenses concede
# more scores and therefore field more kickoffs, so this rises slightly as the
# tier gets worse. Worth ~50 points a season in a league that pays 20 yds/point
# and nothing at all in one that doesn't — which is the point.
def dst_return_yards(tier):
    return 950 + 40 * (tier - 1)

# ------------------------------------------------------------ kicker model
# Sleeper projects every kicker identically, so rank is the only signal we have.
# Bucket shares are league-average FG-attempt distribution by distance.
FG_SHARE = [("0_19", 0.03), ("20_29", 0.22), ("30_39", 0.28), ("40_49", 0.27), ("50p", 0.20)]
FG_ACC = {"0_19": 0.99, "20_29": 0.97, "30_39": 0.92, "40_49": 0.82, "50p": 0.68}

def kicker_line(rank, games):
    """rank is 1-based among kickers on the board."""
    atts = max(24.0, 36.0 - 0.45 * (rank - 1))
    xpa = max(26.0, 42.0 - 0.55 * (rank - 1))
    line = {"gp": games, "fg_att": round(atts, 1),
            "xpm": round(xpa * 0.965, 1), "xp_miss": round(xpa * 0.035, 2)}
    for bucket, share in FG_SHARE:
        a = atts * share
        line["fgm_" + bucket] = round(a * FG_ACC[bucket], 2)
        line["fgmiss_" + bucket] = round(a * (1 - FG_ACC[bucket]), 2)
    return line

# ---------------------------------------------------------------- returners
# Honest scope: the research digest could not build a 32-team returner map, so
# neither can we. These are the only two confirmed at the time of the build.
# The app lets the user flag anyone else, and return yards are off by default
# for everyone not listed here.
RETURNERS = {
    "luke mccaffrey": {"ret_yd": 700, "ret_td": 0.4, "src": "WAS primary KR+PR, confirmed"},
}

# ==================================================================== main

def main():
    research_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "players.json")
    sleeper_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "sleeper.json")
    research = json.load(open(research_path, encoding="utf-8"))
    sleeper = json.load(open(sleeper_path, encoding="utf-8"))

    # index sleeper by (normname, pos) and by (normname) for fallback
    by_np, by_n = {}, defaultdict(list)
    def_by_team = {}
    for row in sleeper:
        p = row.get("player") or {}
        pos = p.get("position")
        st = row.get("stats") or {}
        if pos == "DEF":
            def_by_team[(p.get("team") or row.get("team") or "").upper()] = st
            continue
        nm = norm(f"{p.get('first_name','')} {p.get('last_name','')}")
        if not nm:
            continue
        # keep the row with the most projected volume if duplicated
        key = (nm, pos)
        prev = by_np.get(key)
        if prev is None or (st.get("pts_ppr", 0) or 0) > (prev.get("pts_ppr", 0) or 0):
            by_np[key] = st
        by_n[nm].append((pos, st))

    players, matched, derived = [], 0, 0
    k_rank = 0
    for src in research["players"]:
        pos, name = src["pos"], src["name"]
        rec = {k: src[k] for k in
               ("name", "pos", "team", "bye", "adp", "adp_sd", "adp_rank") if k in src}
        for k in ("tag", "ceiling", "risk", "note", "source", "edge", "dst_tier"):
            if k in src:
                rec[k] = src[k]

        if pos == "DEF":
            st = def_by_team.get(src["team"].upper(), {})
            tier = src.get("dst_tier", 3)
            gp = 18
            rec["proj"] = {
                "gp": gp,
                "sack": st.get("sack", 40.0),
                "int": st.get("int", 12.0),
                "fum_rec": st.get("fum_rec", 8.0),
                "def_td": (st.get("pass_int_td", 0) or 0) + (st.get("def_fum_td", 0) or 0)
                          + (st.get("def_kr_td", 0) or 0) + (st.get("pr_td", 0) or 0) or 2.0,
                "blk_kick": st.get("blk_kick", 0.8),
                "safety": SAFETY_BY_TIER.get(tier, 0.8),
                "pa_dist": PA_DIST.get(tier, PA_DIST[3]),
                "ret_yd": dst_return_yards(tier),
            }
            rec["projSource"] = "sleeper+tier" if st else "tier"
            matched += 1 if st else 0
            players.append(rec)
            continue

        if pos == "K":
            k_rank += 1
            rec["proj"] = kicker_line(k_rank, 18)
            rec["projSource"] = "modeled"
            derived += 1
            players.append(rec)
            continue

        nm = norm(name)
        st = by_np.get((nm, pos))
        if st is None:
            cands = [s for (p2, s) in by_n.get(nm, []) if p2 == pos] or \
                    [s for (_p, s) in by_n.get(nm, [])]
            st = cands[0] if cands else None

        if st:
            matched += 1
            gp = st.get("gp") or 17
            proj = {
                "gp": gp,
                "pass_yd": st.get("pass_yd", 0), "pass_td": st.get("pass_td", 0),
                "pass_int": st.get("pass_int", 0), "pass_cmp": st.get("pass_cmp", 0),
                "pass_att": st.get("pass_att", 0), "pass_2pt": st.get("pass_2pt", 0),
                "rush_yd": st.get("rush_yd", 0), "rush_td": st.get("rush_td", 0),
                "rush_att": st.get("rush_att", 0), "rush_2pt": st.get("rush_2pt", 0),
                "rec": st.get("rec", 0), "rec_yd": st.get("rec_yd", 0),
                "rec_td": st.get("rec_td", 0), "rec_2pt": st.get("rec_2pt", 0),
                "fum_lost": st.get("fum_lost", 0),
            }
            proj = {k: round(v, 2) for k, v in proj.items() if v}
            proj["gp"] = gp
            proj.update(est_events(pos, st))
            rec["proj"] = proj
            rec["projSource"] = "sleeper"
            rec["sleeperPPR"] = round(st.get("pts_ppr", 0), 1)
        else:
            derived += 1
            rec["proj"] = {"gp": 17}
            rec["projSource"] = "none"

        r = RETURNERS.get(nm)
        if r:
            rec["proj"]["ret_yd"] = r["ret_yd"]
            rec["proj"]["ret_td"] = r["ret_td"]
            rec["returner"] = r["src"]
        players.append(rec)

    meta = dict(research.get("meta", {}))
    meta.update({
        "proj_source": "Sleeper season projections (RotoWire), 2026 regular season",
        "proj_matched": matched,
        "proj_derived": derived,
        "game_sd": GAME_SD,
        "pa_dist_note": "Points-allowed buckets modeled per D/ST tier; Sleeper publishes none.",
        "baked": "2026-09-04",
    })

    body = json.dumps({"meta": meta, "players": players}, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Generated by ff/tools/bake-players.py — do not hand-edit. */\n")
        f.write("globalThis.DRAFTLINE_DATA = " + body + ";\n")

    print(f"wrote {OUT}")
    print(f"  players: {len(players)}  sleeper-matched: {matched}  modeled/none: {derived}")
    miss = [p["name"] for p in players if p.get("projSource") == "none"]
    print(f"  no projection ({len(miss)}): {', '.join(miss[:25])}")

if __name__ == "__main__":
    main()
