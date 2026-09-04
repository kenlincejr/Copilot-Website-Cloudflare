#!/usr/bin/env python3
"""
bake-players.py — merge the research annotation layer with a Sleeper season
projection snapshot and emit /ff/data/players.js (a plain <script>, so the app
works from file:// with no network).

Inputs
  players.json     the 267-player research board (ADP, sd, tags, notes, dst_tier)
  sleeper.json     raw response from
                   https://api.sleeper.com/projections/nfl/2026?season_type=regular&position[]=...
  players_nfl.json raw response from https://api.sleeper.app/v1/players/nfl
                   (~15 MB; Sleeper asks that it be called at most once a day)

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
  TAKE  depth_chart_order, depth_chart_position, injury_status and the injured
        body part from the players endpoint. This is the strongest thing in the
        feed: 607 of 847 active skill players carry a depth chart slot and 155
        carry an injury designation, all of it current and machine-readable.
        The research layer annotates 84 players by hand; this covers the rest.
  TAKE  Sleeper's own ADP, as a SECOND opinion beside FantasyFootballCalculator's
        — never as a replacement. Sleeper's number is computed across its whole
        user base and mixes mock with real drafts, and it refreshes only once or
        twice a month. That staleness is visible in the data: Josh Jacobs sits at
        38 on Sleeper against 69 on FFC because Sleeper has not absorbed his
        30 August move to the Commissioner's Exempt List. So a divergence means
        "these two populations disagree", which is worth seeing, and emphatically
        not "the second number is better".
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

def load_player_meta(path):
    """depth chart slot, injury designation and Sleeper ADP, keyed by normalised name."""
    if not os.path.exists(path):
        print("  (no players_nfl.json — skipping depth chart and injury layer)")
        return {}
    raw = json.load(open(path, encoding="utf-8"))
    out = {}
    for pl in raw.values():
        if not pl.get("team") or pl.get("position") not in ("QB", "RB", "WR", "TE", "K"):
            continue
        nm = norm((pl.get("full_name") or
                   ((pl.get("first_name") or "") + " " + (pl.get("last_name") or ""))))
        if not nm:
            continue
        rec = {}
        if pl.get("depth_chart_order") is not None:
            rec["depth"] = pl["depth_chart_order"]
            rec["depthPos"] = pl.get("depth_chart_position") or pl.get("position")
        if pl.get("injury_status"):
            rec["injury"] = pl["injury_status"]
            if pl.get("injury_body_part"):
                rec["injuryPart"] = pl["injury_body_part"]
        # Prefer the record that actually looks like the fantasy-relevant player.
        prev = out.get(nm)
        if rec and (prev is None or ("depth" in rec and "depth" not in prev)):
            out[nm] = rec
    return out


def main():
    research_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "players.json")
    sleeper_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "sleeper.json")
    research = json.load(open(research_path, encoding="utf-8"))
    sleeper = json.load(open(sleeper_path, encoding="utf-8"))
    meta = load_player_meta(os.path.join(HERE, "players_nfl.json"))

    # index sleeper by (normname, pos) and by (normname) for fallback
    by_np, by_n = {}, defaultdict(list)
    sleeper_adp = {}
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
        if st.get("adp_ppr") and st["adp_ppr"] < 900:
            sleeper_adp.setdefault((nm, pos), st["adp_ppr"])
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

        m = meta.get(nm)
        if m:
            rec.update(m)
        sadp = sleeper_adp.get((nm, pos))
        if sadp:
            rec["adp2"] = round(sadp, 1)

        r = RETURNERS.get(nm)
        if r:
            rec["proj"]["ret_yd"] = r["ret_yd"]
            rec["proj"]["ret_td"] = r["ret_td"]
            rec["returner"] = r["src"]
        players.append(rec)

    meta = dict(research.get("meta", {}))
    # ---- correct the two ADP sources for a structural difference ----------
    #
    # Naively subtracting one ADP from the other is wrong, and wrong in a way that
    # looks like signal. Sleeper ranks about 2,150 players; this board carries 267.
    # A deeper pool pushes late players further down, so the two lists agree
    # closely at the top and drift apart with depth — median Sleeper ADP runs
    # +0.4 against this board in the first fifty picks and +37 by pick 150-200.
    # Reporting that raw difference would flag most of the late rounds as a market
    # disagreement when it is only a difference in denominators.
    #
    # So: fit the expected Sleeper ADP for a given board ADP from the data itself
    # (median within sliding bands, linearly interpolated), and report only the
    # residual — how far he sits from where players of his own ADP normally sit
    # on the other list.
    pairs = sorted((p["adp"], p["adp2"]) for p in players if p.get("adp2"))
    knots = []
    if len(pairs) >= 20:
        step = max(8, len(pairs) // 10)
        for i in range(0, len(pairs), step):
            chunk = pairs[i:i + step]
            if len(chunk) < 4:
                continue
            xs = sorted(c[0] for c in chunk)
            ys = sorted(c[1] for c in chunk)
            knots.append((xs[len(xs) // 2], ys[len(ys) // 2]))

    def expected_adp2(x):
        if not knots:
            return None
        if x <= knots[0][0]:
            return knots[0][1]
        if x >= knots[-1][0]:
            return knots[-1][1]
        for i in range(len(knots) - 1):
            x0, y0 = knots[i]
            x1, y1 = knots[i + 1]
            if x0 <= x <= x1:
                t = 0 if x1 == x0 else (x - x0) / (x1 - x0)
                return y0 + t * (y1 - y0)
        return knots[-1][1]

    for pl in players:
        if pl.get("adp2"):
            exp = expected_adp2(pl["adp"])
            if exp is not None:
                # Negative = the other market takes him earlier than his peers.
                pl["adpResid"] = round(pl["adp2"] - exp, 1)

    meta_out = {
        "proj_source": "Sleeper season projections (RotoWire), 2026 regular season",
        "proj_matched": matched,
        "proj_derived": derived,
        "game_sd": GAME_SD,
        "pa_dist_note": "Points-allowed buckets modeled per D/ST tier; Sleeper publishes none.",
        "depth_source": "Sleeper /v1/players/nfl — depth chart slot and injury designation",
        "adp2_source": "Sleeper platform ADP. Mixes mock and real drafts across their whole "
                       "user base and refreshes once or twice a month, so it is a second "
                       "opinion beside FFC's, not a fresher one.",
        "adp_resid_note": "adpResid is Sleeper's ADP minus what a player at this board ADP "
                          "normally sits at on Sleeper. The raw difference is unusable: "
                          "Sleeper ranks ~2,150 players against this board's 267, so the two "
                          "drift apart with depth for structural reasons (+0.4 picks over the "
                          "first fifty, +37 by 150-200). The residual removes that drift.",
        "baked": "2026-09-04",
    }
    meta = dict(research.get("meta", {}))
    meta.update(meta_out)

    body = json.dumps({"meta": meta, "players": players}, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Generated by ff/tools/bake-players.py — do not hand-edit. */\n")
        f.write("globalThis.DRAFTLINE_DATA = " + body + ";\n")

    print(f"wrote {OUT}")
    print(f"  players: {len(players)}  sleeper-matched: {matched}  modeled/none: {derived}")
    print(f"  depth chart slot: {sum(1 for p in players if 'depth' in p)}"
          f"   injury designation: {sum(1 for p in players if 'injury' in p)}"
          f"   second ADP: {sum(1 for p in players if 'adp2' in p)}")
    res = [p["adpResid"] for p in players if "adpResid" in p]
    if res:
        res.sort()
        print(f"  ADP residual: median {res[len(res)//2]:+.1f}, "
              f"range {res[0]:+.0f} to {res[-1]:+.0f} over {len(res)} players")
    miss = [p["name"] for p in players if p.get("projSource") == "none"]
    print(f"  no projection ({len(miss)}): {', '.join(miss[:25])}")

if __name__ == "__main__":
    main()
