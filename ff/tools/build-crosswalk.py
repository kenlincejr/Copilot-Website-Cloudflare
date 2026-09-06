#!/usr/bin/env python3
"""
build-crosswalk.py — resolve every board player to a set of stable IDs, once.

Why this exists
  Every join in this repo is currently by normalized name, and the name lookup
  in bake-players.py has a fallback that drops the position constraint entirely:

      cands = [s for (p2, s) in by_n.get(nm, []) if p2 == pos] or \\
              [s for (_p, s) in by_n.get(nm, [])]

  The `or` means a receiver can silently inherit a same-named quarterback's
  numbers, against a Sleeper file holding 12,226 people including retirees and
  practice squads. That is a live hazard rather than a theoretical one, and
  adding six more name-joined sources on top of it multiplies the surface by six.

  So: do the name join **once**, against a spine that carries position and team,
  review the leftovers by hand, commit the result, and let every subsequent
  source join by integer ID. One name join that a person has looked at beats
  seven that nobody has.

The spine is nflverse roster_2026.csv, which carries sleeper_id, yahoo_id,
espn_id, gsis_id, pfr_id, draft_number and rookie_year in a single row.

Usage
  python build-crosswalk.py                 dry run — report only
  python build-crosswalk.py --write         write tools/crosswalk.json
  python build-crosswalk.py --board X.json  default tools/players.json

Refusal
  Below MATCH_RATE_FLOOR on the eligible population this tool exits 1 without
  writing, on the same reasoning apply-ffc.py uses: a twenty-point coverage drop
  three days before a draft means the file's shape changed, not that fifty
  players stopped existing. Fix the parser; do not force the write.
"""

import argparse, datetime, json, os, sys
import ffsignals as F

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "crosswalk.json")
SPINE = os.path.join(HERE, "raw", "roster_2026.csv")

MATCH_RATE_FLOOR = 0.95

# Positions the spine can possibly cover. DEF has no roster row by construction
# — a defense is not a person — so it is excluded from the denominator rather
# than counted as a miss forever.
SKILL = ("QB", "RB", "WR", "TE")
ELIGIBLE = SKILL + ("K",)

ID_FIELDS = ("sleeper_id", "yahoo_id", "espn_id", "gsis_id", "pfr_id")
EXTRA_FIELDS = ("draft_number", "rookie_year", "years_exp")

# Hand resolutions. These win over every automatic tier and survive rebuilds,
# which is the entire point of writing them down instead of loosening a rule.
# Add an entry only with a `why` that says what the automatic match got wrong.
MANUAL = {
    # "norm name|POS": {"gsis_id": "00-0000000", "why": "..."},
}


def load_board(path):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    return d["players"] if isinstance(d, dict) else d


def load_spine(path):
    rows = F.read_csv(path)
    # The roster file carries a week column; collapse to one row per person,
    # preferring the row that carries the most IDs so a sparse week cannot
    # shadow a complete one.
    best = {}
    for r in rows:
        if (r.get("position") or "").upper() not in ELIGIBLE:
            continue
        gid = F.ident(r.get("gsis_id")) or (F.norm(r.get("full_name") or "") + "|"
                                            + (r.get("position") or ""))
        score = sum(1 for k in ID_FIELDS if F.ident(r.get(k)) is not None)
        if gid not in best or score > best[gid][0]:
            best[gid] = (score, r)
    return [r for _s, r in best.values()]


def ids_of(row):
    out = {}
    for k in ID_FIELDS:
        v = F.ident(row.get(k))
        if v is not None:
            out[k] = v
    for k in EXTRA_FIELDS:
        v = F.num(row.get(k))
        if v is not None:
            out[k] = int(v)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", default=os.path.join(HERE, "players.json"))
    ap.add_argument("--spine", default=SPINE)
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()

    if not os.path.exists(a.spine):
        print("no spine at %s — run: python fetch-sources.py --only roster" % a.spine)
        return 2

    board = load_board(a.board)
    spine = load_spine(a.spine)

    by_npt, by_np = {}, {}
    for r in spine:
        nm, pos, tm = (F.norm(r["full_name"]), (r["position"] or "").upper(),
                       F.team(r.get("team")))
        by_npt.setdefault((nm, pos, tm), []).append(r)
        by_np.setdefault((nm, pos), []).append(r)

    rep = F.MatchReport("crosswalk", "nflverse roster_2026.csv",
                        floor=MATCH_RATE_FLOOR)
    rep.source_rows = len(spine)

    players, claimed, team_moves = {}, set(), []
    eligible_board = [p for p in board if p["pos"] in ELIGIBLE]
    rep.eligible = sum(1 for p in board if p["pos"] in SKILL)

    for p in board:
        pos = p["pos"]
        if pos not in ELIGIBLE:
            continue
        k = F.key(p["name"], pos)
        nm, team = F.norm(p["name"]), F.team(p.get("team"))

        row, tier = None, None
        if k in MANUAL:
            want = MANUAL[k]
            for r in by_np.get((nm, pos), []) or spine:
                if all(F.ident(r.get(f)) == str(v) for f, v in want.items()
                       if f in ID_FIELDS):
                    row, tier = r, "manual"
                    break
        if row is None:
            cands = by_npt.get((nm, pos, team))
            if cands and len(cands) == 1:
                row, tier = cands[0], "name_pos_team"
        if row is None:
            cands = by_np.get((nm, pos))
            if cands and len(cands) == 1:
                row, tier = cands[0], "name_pos"
                if F.team(cands[0].get("team")) != team:
                    team_moves.append("%s %s->%s" % (
                        p["name"], team, F.team(cands[0].get("team")) or "?"))

        if row is None:
            if pos in SKILL:
                rep.miss("%s %s %s" % (p["name"], pos, team))
            continue

        ids = ids_of(row)
        ids["tier"] = tier
        players[k] = ids
        if pos in SKILL:
            rep.hit(k, tier)
        gid = ids.get("gsis_id")
        if gid:
            claimed.add(gid)

    # The feed side. bake-players.py has never printed this, and it is where a
    # player nobody on the board has heard of shows up — which is the entire
    # reason for adding sources in the first place.
    for r in spine:
        gid = F.ident(r.get("gsis_id"))
        if gid and gid not in claimed and (r.get("position") or "").upper() in SKILL:
            if F.num(r.get("years_exp")) is not None:
                rep.extra("%s %s %s" % (r["full_name"], r["position"],
                                        (r.get("team") or "?")))

    if team_moves:
        rep.note("team changed since the board was written (%d): %s"
                 % (len(team_moves), " · ".join(team_moves[:12])
                    + (" …" if len(team_moves) > 12 else "")))

    print(rep.render(extra_cap=25))

    # Two people resolved onto one identity is the silent-sleeper-disappears
    # failure. It has to be an error, not a note.
    seen, dupes = {}, []
    for k, v in players.items():
        gid = v.get("gsis_id")
        if gid:
            if gid in seen:
                dupes.append("%s and %s both resolve to %s" % (seen[gid], k, gid))
            seen[gid] = k
    if dupes:
        print("\n   !! DUPLICATE IDENTITIES — two board players, one person:")
        for d in dupes:
            print("      " + d)

    cover = {f: sum(1 for v in players.values() if f in v) for f in ID_FIELDS}
    print("\n   id coverage over %d resolved: %s" % (
        len(players), " · ".join("%s %d" % (f.replace("_id", ""), n)
                                 for f, n in cover.items())))

    if not rep.passed or dupes:
        print("\nREFUSING TO WRITE: match rate %.0f%% against a %.0f%% floor%s.\n"
              "Fix the join, don't force the write." % (
                  100 * rep.rate, 100 * MATCH_RATE_FLOOR,
                  " and %d duplicate identities" % len(dupes) if dupes else ""))
        return 1

    if not a.write:
        print("\ndry run — pass --write to save %s" % os.path.relpath(OUT, HERE))
        return 0

    doc = {
        "meta": {
            "built": datetime.date.today().isoformat(),
            "spine": "nflverse roster_2026.csv",
            "board": len(board), "eligible": rep.eligible,
            "resolved": len(players),
            "by_tier": dict(sorted(rep.tiers.items())),
            "note": "Key is norm(name)|POS. Position is in the key so that a "
                    "cross-position mismatch cannot be represented at all.",
        },
        "manual": MANUAL,
        "players": dict(sorted(players.items())),
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("\nwrote %s (%d players)" % (os.path.relpath(OUT, HERE), len(players)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
