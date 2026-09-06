#!/usr/bin/env python3
"""
sig_sources.py — one loader per external source, all to the same contract.

Contract
  Each loader is a dict:
    { "name": str,
      "floor": float,                       # coverage floor on the eligible set
      "eligible": callable(player) -> bool, # who could possibly have this data
      "registry": { field: {...} },         # provenance, one entry per field
      "load": callable(raw_dir, xwalk, board) -> (values, report) }
  `values` is { "norm name|POS": { field: raw_value } } in natural units only.
  Centering into z-scores happens once, in the bake, after every loader has run.

Two rules that are not negotiable, because getting either wrong is how this
layer makes the board worse rather than better.

  Nothing here writes `pts`. The projection stays priced by league rules and
  auditable end to end; signals move grades and price, never the projection.
  impact.js reads only pts/vorRank, so it is insulated by this rule and acts as
  a canary — if test-impact.js starts failing, a signal leaked.

  A signal is all-or-nothing. Below its floor the bake drops it for *every*
  player rather than applying it to the ones it happens to cover, because a
  signal covering forty players silently outranks two hundred whose only sin is
  missing data.

Eligibility is per-signal and not "the whole board". Rookies legitimately have
no 2025 usage; measuring their absence against a flat floor would make a healthy
nflverse pull look broken in a year with a big rookie class.
"""

import json, os
import ffsignals as F

SKILL = ("QB", "RB", "WR", "TE")


def _is_skill(p):
    return p["pos"] in SKILL


def _is_veteran(p, xwalk):
    ids = xwalk.get(F.key(p["name"], p["pos"])) or {}
    ry = ids.get("rookie_year")
    return bool(ry) and ry < 2026


def _is_rookie(p, xwalk):
    ids = xwalk.get(F.key(p["name"], p["pos"])) or {}
    return ids.get("rookie_year") == 2026


def _by_id(xwalk, field):
    """Reverse the crosswalk: source id -> board key."""
    out = {}
    for k, ids in xwalk.items():
        v = ids.get(field)
        if v is not None:
            out[str(v)] = k
    return out


def _asof(raw_dir, name):
    try:
        with open(os.path.join(raw_dir, "manifest.json"), encoding="utf-8") as f:
            return (json.load(f).get(name) or {}).get("asof")
    except Exception:
        return None


# ==================================================================== ECR

def load_ecr(raw_dir, xwalk, board):
    """FantasyPros expert consensus, via the DynastyProcess mirror.

    ECR is the median of ~130 published expert ranking sets and it carries the
    best rank, the worst rank and the spread across those experts. The spread is
    the more interesting half: disagreement among analysts is a different fact
    from disagreement among drafters, and the board has never had it.

    The mirror's yahoo_id column is NA on every row, verified, so this is the one
    source that must join by name — but through the crosswalk key, which carries
    position, so the cross-position failure mode is still unrepresentable.
    """
    path = os.path.join(raw_dir, "db_fpecr_latest.csv")
    asof = _asof(raw_dir, "ecr")
    rep = F.MatchReport("ecr", "DynastyProcess mirror of FantasyPros ECR "
                        "(redraft-overall)", floor=0.85, asof=asof)
    vals = {}
    if not os.path.exists(path):
        rep.note("file missing — run fetch-sources.py --only ecr")
        return vals, rep

    rows = [r for r in F.read_csv(path)
            if r.get("page_type") == "redraft-overall" and r.get("ecr_type") == "ro"]
    rep.source_rows = len(rows)
    by_key = {}
    for r in rows:
        pos = (r.get("pos") or "").upper()
        # The mirror spells defenses DST; the board says DEF.
        if pos == "DST":
            pos = "DEF"
        by_key.setdefault(F.key(r.get("player") or "", pos), r)

    elig = [p for p in board if _is_skill(p)]
    rep.eligible = len(elig)
    for p in board:
        k = F.key(p["name"], p["pos"])
        r = by_key.get(k)
        if not r:
            if _is_skill(p):
                rep.miss("%s %s" % (p["name"], p["pos"]))
            continue
        ecr, sd = F.num(r.get("ecr")), F.num(r.get("sd"))
        if ecr is None:
            continue
        d = {"ecr": round(ecr, 1)}
        if sd is not None:
            d["ecrSd"] = round(sd, 2)
        best, worst = F.num(r.get("best")), F.num(r.get("worst"))
        if best is not None and worst is not None:
            d["ecrSpread"] = int(worst - best)
        vals[k] = d
        if _is_skill(p):
            rep.hit(k, "name_pos")

    # The residual, not the raw difference. ECR ranks 525 players against this
    # board's 267 and the two scales drift apart with depth for structural
    # reasons, so a raw ECR-minus-ADP measures the depth of the lists as much as
    # it measures the player. Same de-drift as adpResid, same implementation.
    _add_residual(vals, board, "ecr", "ecrResid")

    claimed = set(vals)
    for k, r in by_key.items():
        if (k not in claimed and (F.num(r.get("ecr")) or 999) <= 320
                and not k.endswith("|DEF") and not k.endswith("|K")):
            rep.extra("%s %s ecr %s" % (r.get("player"), r.get("pos"), r.get("ecr")))
    return vals, rep


def _add_residual(vals, board, field, out_field):
    """How far he sits from where players of his board price normally sit.

    Two fits, not one, and the second is the one that keeps this honest.

    The first removes the drift in the *level*: two ranked lists of different
    depths pull apart as you go deeper, so a raw difference measures the depth
    of the lists as much as it measures the player.

    The second removes the drift in the *spread*, and without it this signal is
    close to worthless. Measured on this board, the standard deviation of the
    ECR residual runs 7.5 picks inside the top 24 and 42.4 picks past 140 — five
    and a half times wider. Ranks are simply noisier at depth. So a residual
    z-scored against the whole board hands almost every extreme value to
    late-round players, and it does that whether or not the market disagrees
    about them at all: it is measuring the depth of the board and calling it an
    edge. Dividing by the spread expected at his own price is what makes
    "twenty picks of disagreement" mean the same thing in round two as in round
    thirteen.

    Same sliding-band median as the level fit, so there is one method here, not
    two. The raw residual is kept in picks for display and audit — a number a
    person can eyeball — while the studentised one is what gets scored.
    """
    adp = {F.key(p["name"], p["pos"]): p.get("adp") for p in board}
    pairs = [(adp[k], v[field]) for k, v in vals.items()
             if adp.get(k) is not None and v.get(field) is not None]
    expected = F.knot_residual(pairs)

    raw = {}
    for k, v in vals.items():
        if v.get(field) is None or adp.get(k) is None:
            continue
        e = expected(adp[k])
        if e is not None:
            # Negative = this market takes him earlier than his board-price peers.
            r = round(v[field] - e, 1)
            v[out_field] = r
            raw[k] = r

    # Floored, because at the very top of the board the expected spread collapses
    # toward zero and dividing by it turns a one-pick difference into a screaming
    # edge. Jahmyr Gibbs went 1.4 here, 2.4 on ECR and 1.3 on ESPN — three
    # markets in violent agreement that he is the first player off the board —
    # and an unfloored denominator scored that as the largest discount available.
    # Two picks is about the sampling noise in an ADP built from thousands of
    # drafts, so nothing tighter than that is a real disagreement.
    # Two tests, and a disagreement has to pass both.
    #
    # Studentising alone answers "is this unusual for a player at his price",
    # and on its own it promotes trivia at the top of the board: Gibbs went 1.4
    # here, 2.4 on ECR and 1.3 on ESPN, three markets agreeing he is the first
    # player off the board, and a purely statistical reading scored that as the
    # largest discount available. It is unusual and it is worth nothing, because
    # nobody drafting at pick 11 can convert a one-pick disagreement about the
    # first overall player.
    #
    # The raw gap alone answers "is this worth acting on" and fails the other
    # way, handing every extreme to the late rounds where ranks are noisy.
    #
    # So: studentise for significance, then shrink by the raw gap against half a
    # round. A disagreement must be both larger than normal at his price AND big
    # enough in picks to move when you actually pick.
    SPREAD_FLOOR = 2.0
    MEANINGFUL_PICKS = 6.0
    spread = F.knot_residual((adp[k], abs(r)) for k, r in raw.items())
    for k, r in raw.items():
        sc = spread(adp[k])
        if sc is None:
            continue
        std = r / max(sc, SPREAD_FLOOR)
        vals[k][out_field + "Std"] = round(
            std * min(1.0, abs(r) / MEANINGFUL_PICKS), 3)


# =================================================================== ESPN

ESPN_INJURY = {"ACTIVE": None, "QUESTIONABLE": "Questionable", "OUT": "Out",
               "DOUBTFUL": "Doubtful", "INJURY_RESERVE": "IR",
               "SUSPENSION": "SUSP", "DAY_TO_DAY": "Questionable"}


def load_espn(raw_dir, xwalk, board):
    """ESPN ownership: a third ADP, a second injury opinion, superflex rank.

    Worth having beside Sleeper's injury designation precisely because the two
    will sometimes disagree, and a disagreement between two injury feeds is a
    fact the board currently has no way to represent.

    averageDraftPositionPercentChange is a percent over an undocumented window.
    It is emitted, but as a rank percentile rather than as picks, because
    treating an unlabelled percent as a number of picks would be inventing a
    unit the source never claimed.
    """
    path = os.path.join(raw_dir, "espn_kona.json")
    asof = _asof(raw_dir, "espn_kona")
    rep = F.MatchReport("espn", "ESPN kona_player_info ownership", floor=0.90,
                        asof=asof)
    vals = {}
    if not os.path.exists(path):
        rep.note("file missing — run fetch-sources.py --only espn_kona")
        return vals, rep

    with open(path, encoding="utf-8") as f:
        rows = json.load(f).get("players", [])
    rep.source_rows = len(rows)
    by_espn = _by_id(xwalk, "espn_id")
    rep.eligible = sum(1 for p in board if _is_skill(p))

    # One or two board players have no espn_id in the crosswalk. A name+pos
    # fallback costs nothing and it is still position-constrained, so it cannot
    # produce the cross-position match the id join exists to prevent.
    by_name = {F.key(p["name"], p["pos"]): True for p in board}
    skill_keys = {F.key(p["name"], p["pos"]) for p in board if _is_skill(p)}

    seen = set()
    for row in rows:
        p = row.get("player") or {}
        k = by_espn.get(str(p.get("id")))
        tier = "espn_id"
        if not k:
            for pos in SKILL:
                cand = F.key(p.get("fullName") or "", pos)
                if cand in by_name and cand not in seen:
                    k, tier = cand, "name_pos"
                    break
        if not k:
            own = p.get("ownership") or {}
            if (own.get("averageDraftPosition") or 999) <= 200:
                rep.extra("%s adp %.0f" % (p.get("fullName"),
                                           own["averageDraftPosition"]))
            continue
        own = p.get("ownership") or {}
        d = {}
        adp = own.get("averageDraftPosition")
        if adp and adp > 0:
            d["adp3"] = round(adp, 1)
        if own.get("percentOwned") is not None:
            d["espnOwn"] = round(own["percentOwned"], 1)
        pc = own.get("averageDraftPositionPercentChange")
        if pc is not None:
            d["adpVelPct"] = round(pc, 4)
        sf = ((p.get("draftRanksByRankType") or {}).get("SUPERFLEX") or {}).get("rank")
        if sf:
            d["espnSF"] = int(sf)
        inj = ESPN_INJURY.get((p.get("injuryStatus") or "").upper())
        if inj:
            d["injury2"] = inj
        if d:
            vals[k] = d
            seen.add(k)
            if k in skill_keys:
                rep.hit(k, tier)

    for p in board:
        if _is_skill(p) and F.key(p["name"], p["pos"]) not in seen:
            rep.miss("%s %s" % (p["name"], p["pos"]))

    _add_residual(vals, board, "adp3", "adpResid3")
    return vals, rep


# ================================================================ nflverse

def load_usage(raw_dir, xwalk, board):
    """Last season's opportunity, which is not last season's production.

    Production is what ADP already prices. Opportunity is what predicts next
    year, and WOPR (1.5 x target share + 0.7 x air-yards share) is the compact
    form of it. target_share and air_yards_share are emitted alongside for
    display and audit, but they are algebraically inside WOPR — the scoring half
    is handed exactly one of the three, or the weight of one latent variable is
    tripled.

    Rookies are excluded from the denominator rather than counted as misses:
    having no 2025 season is a fact about the calendar, not a coverage failure.
    """
    stats = os.path.join(raw_dir, "stats_player_reg_2025.csv")
    snaps = os.path.join(raw_dir, "snap_counts_2025.csv")
    rep = F.MatchReport("usage", "nflverse stats_player_reg_2025 + snap_counts_2025",
                        floor=0.75, asof=_asof(raw_dir, "stats25"))
    vals = {}
    if not os.path.exists(stats):
        rep.note("file missing — run fetch-sources.py --only stats25")
        return vals, rep

    rows = F.read_csv(stats)
    rep.source_rows = len(rows)
    by_gsis = _by_id(xwalk, "gsis_id")
    elig = [p for p in board if _is_skill(p) and _is_veteran(p, xwalk)]
    rep.eligible = len(elig)
    elig_keys = {F.key(p["name"], p["pos"]) for p in elig}

    for r in rows:
        k = by_gsis.get(F.ident(r.get("player_id")) or "")
        if not k:
            continue
        d = {}
        for src, dst, nd in (("wopr", "wopr", 3), ("target_share", "tgtShare", 3),
                             ("air_yards_share", "airShare", 3),
                             ("targets", "tgt25", 0), ("carries", "car25", 0),
                             ("games", "gp25", 0)):
            v = F.num(r.get(src))
            if v is not None:
                d[dst] = round(v, nd) if nd else int(v)
        if d:
            vals.setdefault(k, {}).update(d)
            if k in elig_keys:
                rep.hit(k, "gsis_id")

    # Snap share is per game in this file; the season number is the mean.
    if os.path.exists(snaps):
        by_pfr = _by_id(xwalk, "pfr_id")
        acc = {}
        for r in F.read_csv(snaps):
            k = by_pfr.get(F.ident(r.get("pfr_player_id")) or "")
            if not k:
                continue
            pct = F.num(r.get("offense_pct"))
            if pct is not None:
                a = acc.setdefault(k, [0.0, 0])
                a[0] += pct
                a[1] += 1
        game_rows = 0
        for k, (tot, n) in acc.items():
            if n:
                vals.setdefault(k, {})["snapPct"] = round(tot / n, 3)
                game_rows += n
        rep.note("snap share from %d players over %d game rows" % (len(acc), game_rows))
    else:
        rep.note("no snap_counts_2025.csv — snapPct absent")

    for p in elig:
        if F.key(p["name"], p["pos"]) not in vals:
            rep.miss("%s %s" % (p["name"], p["pos"]))
    return vals, rep


# ================================================================== Vegas

def load_vegas(raw_dir, xwalk, board):
    """Team implied totals now, and for the weeks that decide the league.

    `spread` is signed relative to the HOME team and `details` is prose naming
    the favourite. Use the number, never the prose. Verified against week 15's
    SF @ LAC: overUnder 47.5, spread -2.5, details "LAC -2.5" — so home is
    favoured by 2.5 and home implied = 47.5/2 - (-2.5)/2 = 25.0, away 22.5.

    Week 1 gives the offensive environment. Weeks 15-17 give the thing almost
    nobody prices: the strength of schedule in the fantasy playoffs. `psos` is
    the mean implied total of the opponents a team faces in those three weeks —
    so for a defense, facing weak offenses is a good thing, and the sign is
    flipped in the engine rather than here.

    Season-long *player* props would be the stronger signal by far, but they are
    not obtainable free. Team implied total gives every player on an offense the
    same number, which is exactly why it carries a small weight.
    """
    rep = F.MatchReport("vegas", "ESPN scoreboard odds (DraftKings), wk 1 + 15-17",
                        floor=0.95, asof=_asof(raw_dir, "espn_w15"))
    vals = {}
    weeks = {}
    for wk, fn in ((1, "espn_scoreboard_w01.json"), (15, "espn_scoreboard_w15.json"),
                   (16, "espn_scoreboard_w16.json"), (17, "espn_scoreboard_w17.json")):
        path = os.path.join(raw_dir, fn)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        implied, opp = {}, {}
        for e in d.get("events", []):
            comps = e.get("competitions") or []
            if not comps:
                continue
            c = comps[0]
            odds = (c.get("odds") or [{}])[0]
            ou, spread = odds.get("overUnder"), odds.get("spread")
            home = away = None
            for t in c.get("competitors", []):
                ab = F.team((t.get("team") or {}).get("abbreviation"))
                if t.get("homeAway") == "home":
                    home = ab
                else:
                    away = ab
            if not (home and away):
                continue
            opp[home], opp[away] = away, home
            if ou is None or spread is None:
                continue
            implied[home] = round(ou / 2.0 - spread / 2.0, 2)
            implied[away] = round(ou / 2.0 + spread / 2.0, 2)
        weeks[wk] = (implied, opp)
        rep.note("week %d: %d teams with an implied total" % (wk, len(implied)))

    if not weeks:
        rep.note("no scoreboard files — run fetch-sources.py --only espn_w15")
        return vals, rep

    rep.source_rows = sum(len(i) for i, _o in weeks.values())
    w1 = weeks.get(1, ({}, {}))[0]

    # Playoff SOS: mean implied total of the opponent faced in weeks 15-17.
    psos, cnt = {}, {}
    for wk in (15, 16, 17):
        implied, opp = weeks.get(wk, ({}, {}))
        for tm, o in opp.items():
            if o in implied:
                psos[tm] = psos.get(tm, 0.0) + implied[o]
                cnt[tm] = cnt.get(tm, 0) + 1

    teams_seen = set()
    rep.eligible = len(board)
    for p in board:
        tm = F.team(p.get("team"))
        k = F.key(p["name"], p["pos"])
        d = {}
        if tm in w1:
            d["teamTot"] = w1[tm]
        if cnt.get(tm):
            d["psos"] = round(psos[tm] / cnt[tm], 2)
            d["psosWks"] = cnt[tm]
        if d:
            vals[k] = d
            teams_seen.add(tm)
            rep.hit(k, "team")
        else:
            rep.miss("%s %s (%s)" % (p["name"], p["pos"], tm or "?"))
    rep.note("%d teams covered" % len(teams_seen))
    return vals, rep


# ================================================================ capital

def load_capital(raw_dir, xwalk, board):
    """Where the NFL drafted him, which is the best single rookie predictor.

    Teams give snaps to the players they spent picks on, and they give them
    sooner than fantasy ADP expects. "Draft capital says starter, depth chart
    says starter, ADP says backup" is the loudest buy signal in the sport, and
    with this field all three finally sit on the same record.
    """
    path = os.path.join(raw_dir, "draft_picks.csv")
    rep = F.MatchReport("capital", "nflverse draft_picks.csv (2026)", floor=0.90,
                        asof=_asof(raw_dir, "draft"))
    vals = {}
    if not os.path.exists(path):
        rep.note("file missing — run fetch-sources.py --only draft")
        return vals, rep

    rows = [r for r in F.read_csv(path) if r.get("season") == "2026"]
    rep.source_rows = len(rows)
    by_gsis = _by_id(xwalk, "gsis_id")

    # `pick` is within-round in some vintages of this file and overall in
    # others. Decide from the data rather than assuming.
    picks = [F.num(r.get("pick")) for r in rows]
    picks = [x for x in picks if x is not None]
    overall_already = max(picks) > 40 if picks else False

    elig = [p for p in board if _is_skill(p) and _is_rookie(p, xwalk)]
    rep.eligible = len(elig)

    for r in rows:
        k = by_gsis.get(F.ident(r.get("gsis_id")) or "")
        if not k:
            continue
        rnd, pk = F.num(r.get("round")), F.num(r.get("pick"))
        if rnd is None or pk is None:
            continue
        overall = int(pk) if overall_already else int((rnd - 1) * 32 + pk)
        vals[k] = {"capital": overall, "draftRound": int(rnd)}
        if k in {F.key(x["name"], x["pos"]) for x in elig}:
            rep.hit(k, "gsis_id")

    for p in elig:
        if F.key(p["name"], p["pos"]) not in vals:
            rep.miss("%s %s" % (p["name"], p["pos"]))
    rep.note("pick column read as %s" % ("overall" if overall_already else "within-round"))
    return vals, rep


# ================================================================ velocity

def load_velocity(raw_dir, xwalk, board):
    """How fast a market is moving on him, from our own archived snapshots.

    No endpoint on the list publishes a historical ADP series, so velocity is
    something we can only have because we wrote down what we saw on a previous
    day. That is why tools/snapshots/ is committed while tools/raw/ is not.

    With one snapshot this yields nothing and says so. That is the correct
    behaviour on day one and it is why the field is null-guarded everywhere
    downstream.
    """
    snaps_dir = os.path.join(os.path.dirname(raw_dir), "snapshots")
    rep = F.MatchReport("velocity", "archived ADP snapshots (self-recorded)",
                        floor=0.0)
    vals = {}
    try:
        files = sorted(f for f in os.listdir(snaps_dir)
                       if f.startswith("adp-") and f.endswith(".json"))
    except Exception:
        files = []
    if len(files) < 2:
        rep.note("only %d snapshot(s) on disk — velocity needs two different days. "
                 "Run fetch-sources.py again tomorrow." % len(files))
        return vals, rep

    def read(fn):
        with open(os.path.join(snaps_dir, fn), encoding="utf-8") as f:
            return json.load(f)

    new, old = read(files[-1]), read(files[0])
    rep.note("%s vs %s" % (old.get("date"), new.get("date")))
    rep.eligible = sum(1 for p in board if _is_skill(p))

    # Snapshots are keyed by display name, so fold both sides to the board key.
    board_key = {}
    for p in board:
        board_key.setdefault(F.norm(p["name"]), F.key(p["name"], p["pos"]))

    for market, field in (("ffc", "velFfc"), ("espn", "velEspn"),
                          ("sleeper", "velSleeper")):
        a, b = old.get("markets", {}).get(market, {}), new.get("markets", {}).get(market, {})
        if not a or not b:
            continue
        n = 0
        for nm, then in a.items():
            k = board_key.get(F.norm(nm))
            now = b.get(nm)
            if not k or now is None:
                continue
            # Positive = being taken EARLIER now than before, i.e. rising.
            mv = round(then - now, 2)
            if abs(mv) >= 0.01:
                vals.setdefault(k, {})[field] = mv
                n += 1
        rep.note("%s: %d players moved" % (market, n))

    for k in vals:
        rep.hit(k, "snapshot")
    rep.source_rows = sum(len(v) for v in new.get("markets", {}).values())
    return vals, rep


# ================================================================ registry

LOADERS = [
    {"name": "ecr", "floor": 0.85, "load": load_ecr,
     "registry": {
         "ecr": {"label": "Expert consensus rank", "unit": "rank", "z": False,
                 "source": "DynastyProcess mirror of FantasyPros ECR (redraft-overall)",
                 "url": "https://raw.githubusercontent.com/dynastyprocess/data/"
                        "master/files/db_fpecr_latest.csv",
                 "note": "The median of ~130 published expert ranking sets."},
         "ecrSd": {"label": "Expert disagreement", "unit": "ranks", "z": True,
                   "center": "pos", "source": "FantasyPros ECR sd",
                   "note": "Spread of opinion among the experts, which is a "
                           "different fact from spread of opinion among drafters. "
                           "Wide means high risk in both directions."},
         "ecrSpread": {"label": "Expert best-to-worst", "unit": "ranks", "z": False,
                       "source": "FantasyPros ECR best/worst"},
         "ecrResidStd": {"label": "Expert consensus residual, studentised",
                         "unit": "local sd", "z": True, "center": "pos",
                         "scores": "priceZ",
                         "source": "derived from ECR against board ADP",
                         "note": "The residual divided by the residual spread "
                                 "normal at his own price. Without this the "
                                 "signal measures the depth of the board rather "
                                 "than the market: raw residual sd runs 7.5 "
                                 "picks in the top 24 and 42.4 past pick 140."},
         "ecrResid": {"label": "Expert consensus residual", "unit": "ranks",
                      "z": False,
                      "source": "derived from ECR against board ADP",
                      "note": "ECR rank minus what a player at this board price "
                              "normally ranks at on ECR. The raw difference is "
                              "unusable: ECR ranks 525 players against this "
                              "board's 267, so the two scales drift apart with "
                              "depth for structural reasons. Negative means the "
                              "experts are higher on him than his price."}}},

    {"name": "espn", "floor": 0.90, "load": load_espn,
     "registry": {
         "adp3": {"label": "ESPN ADP", "unit": "picks", "z": False,
                  "source": "ESPN kona_player_info ownership.averageDraftPosition"},
         "adpResid3Std": {"label": "ESPN ADP residual, studentised",
                          "unit": "local sd", "z": True, "center": "pos",
                          "scores": "priceZ",
                          "source": "derived from ESPN ADP against board ADP",
                          "note": "Scaled by the residual spread normal at his "
                                  "own price; see ecrResidStd."},
         "adpResid3": {"label": "ESPN ADP residual", "unit": "picks", "z": False,
                       "source": "derived from ESPN ADP against board ADP",
                       "note": "Negative means ESPN's population takes him "
                               "earlier than players of his board price."},
         "adpVelPct": {"label": "ESPN ADP change", "unit": "percent", "z": False,
                       "source": "ESPN averageDraftPositionPercentChange",
                       "note": "A percent over a window ESPN does not document. "
                               "Kept as a percent for that reason — calling it a "
                               "number of picks would invent a unit."},
         "espnOwn": {"label": "ESPN rostered", "unit": "percent", "z": False,
                     "source": "ESPN ownership.percentOwned"},
         "espnSF": {"label": "ESPN superflex rank", "unit": "rank", "z": False,
                    "source": "ESPN draftRanksByRankType.SUPERFLEX"},
         # Sparse by nature: only a hurt player carries a designation, so there
         # is no coverage number this field is supposed to hit and the audit's
         # floor check does not apply to it.
         "injury2": {"label": "ESPN injury designation", "unit": "text", "z": False,
                     "sparse": True,
                     "source": "ESPN injuryStatus",
                     "note": "A second opinion beside Sleeper's. Where the two "
                             "disagree, that disagreement is itself the news."}}},

    {"name": "usage", "floor": 0.75, "load": load_usage,
     "registry": {
         "wopr": {"label": "Weighted opportunity", "unit": "wopr", "z": True,
                  "center": "pos",
                  "source": "nflverse stats_player_reg_2025",
                  "note": "1.5x target share + 0.7x air-yards share. Opportunity, "
                          "not production — production is what ADP already "
                          "prices. Handed to the scoring half ALONE: tgtShare and "
                          "airShare are algebraically inside it and adding them "
                          "would triple the weight of one latent variable."},
         "tgtShare": {"label": "Target share", "unit": "share", "z": False,
                      "source": "nflverse stats_player_reg_2025",
                      "note": "Display and audit only — inside wopr."},
         "airShare": {"label": "Air-yards share", "unit": "share", "z": False,
                      "source": "nflverse stats_player_reg_2025",
                      "note": "Display and audit only — inside wopr."},
         "snapPct": {"label": "Snap share", "unit": "share", "z": True,
                     "center": "pos",
                     "source": "nflverse snap_counts_2025 (mean of offense_pct)"},
         "tgt25": {"label": "2025 targets", "unit": "count", "z": False,
                   "source": "nflverse stats_player_reg_2025"},
         "car25": {"label": "2025 carries", "unit": "count", "z": False,
                   "source": "nflverse stats_player_reg_2025"},
         "gp25": {"label": "2025 games", "unit": "count", "z": False,
                  "source": "nflverse stats_player_reg_2025"}}},

    {"name": "vegas", "floor": 0.95, "load": load_vegas,
     "registry": {
         "teamTot": {"label": "Vegas implied team total", "unit": "points",
                     "z": True, "center": "board",
                     "source": "ESPN scoreboard odds (DraftKings), week 1",
                     "note": "Offensive environment. Team-level, so everyone on "
                             "an offense gets the same number — which is exactly "
                             "why it carries a small weight."},
         "psos": {"label": "Playoff schedule", "unit": "points", "z": True,
                  "center": "board",
                  "source": "ESPN scoreboard odds, weeks 15-17",
                  "note": "Mean implied total of the opponents faced in the weeks "
                          "that decide the league. Low is good for a defense and "
                          "bad for everyone else; the engine flips the sign, not "
                          "the bake."},
         "psosWks": {"label": "Playoff weeks priced", "unit": "count", "z": False,
                     "source": "ESPN scoreboard odds, weeks 15-17"}}},

    {"name": "capital", "floor": 0.90, "load": load_capital,
     "registry": {
         "capital": {"label": "NFL draft slot", "unit": "overall pick", "z": True,
                     "center": "pos", "invert": True,
                     "source": "nflverse draft_picks.csv (2026)",
                     "note": "Best single rookie predictor there is. Lower is "
                             "better, so the z-score is inverted at bake time."},
         "draftRound": {"label": "NFL draft round", "unit": "round", "z": False,
                        "source": "nflverse draft_picks.csv (2026)"}}},

    {"name": "velocity", "floor": 0.0, "load": load_velocity,
     "registry": {
         "velFfc": {"label": "FFC 7-day move", "unit": "picks", "z": False,
                    "source": "archived FFC ADP snapshots",
                    "note": "Positive = being taken earlier now than before."},
         "velEspn": {"label": "ESPN move", "unit": "picks", "z": True,
                     "center": "pos", "source": "archived ESPN ADP snapshots"},
         "velSleeper": {"label": "Sleeper move", "unit": "picks", "z": False,
                        "source": "archived Sleeper ADP snapshots"}}},
]
