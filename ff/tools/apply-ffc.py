#!/usr/bin/env python3
"""
apply-ffc.py — apply a pasted FantasyFootballCalculator 12-team PPR ADP table
to ff/tools/players.json.

This does NOT touch the network. FFC has no public paste-friendly API for this
league's purposes, so the workflow is: open the FFC ADP page by hand, select
the table, paste it into a text file, and run this tool against the paste.

Usage
  python apply-ffc.py [paste.txt] [players.json] [--write]

  paste.txt      default tools/fixtures/ffc-latest.txt (the real paste, dropped
                 in place on draft week). Until that paste exists, this repo
                 ships a synthetic stand-in at tools/fixtures/ffc-sample.txt
                 (12-15 rows in plausible FFC shape, real names, made-up
                 numbers) purely so the tool has something to run against and
                 be reviewed with. Swap in the real paste before draft night.
  players.json   default tools/players.json, the 267-player research board.
  --write        actually rewrite players.json. Without it, this is a dry run:
                 everything prints, nothing is saved. This default-to-safe
                 behavior is deliberate — a bad invocation four hours before
                 the draft must not be able to blank the ADP layer silently.

What this touches, and what it will never touch
  WRITES  adp, adp_sd, adp_rank — the three fields FFC actually publishes.
  NEVER   tag, ceiling, risk, note, source, edge, dst_tier. Those are 84
          players' worth of hand research (see players.json's "annotated"
          count) that cannot be regenerated from an ADP pull. If you find
          this tool touching any of those seven keys, that is a bug: assert
          PROTECTED_KEYS below and keep it that way.
"""

import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PASTE = os.path.join(HERE, "fixtures", "ffc-latest.txt")
DEFAULT_SAMPLE = os.path.join(HERE, "fixtures", "ffc-sample.txt")
DEFAULT_PLAYERS = os.path.join(HERE, "players.json")

# These are the 84 hand-annotated fields. apply-ffc.py may read players.json
# but must never write any of these keys back — see the module docstring.
PROTECTED_KEYS = ("tag", "ceiling", "risk", "note", "source", "edge", "dst_tier")

MATCH_RATE_FLOOR = 0.90

# ---------------------------------------------------------------- norm() ---
# Reused verbatim from bake-players.py so that a name matches the same way in
# both tools. Loaded by path (not `import bake-players` — the hyphen makes
# that an invalid module name) rather than copied, so the two can never drift.
_spec = importlib.util.spec_from_file_location("bake_players", os.path.join(HERE, "bake-players.py"))
_bake = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bake)
norm = _bake.norm

# --------------------------------------------------------------- parsing ---
# FFC's ADP page renders one row per player: overall rank, name, position,
# team, bye week, ADP, and a standard-deviation-ish spread. Copy-pasted out of
# a browser table that usually arrives tab-separated, but the exact whitespace
# is whatever the browser felt like that day, so this parses defensively: tabs
# first, falling back to a looser space-separated pattern, and any line that
# doesn't fit either shape is skipped and counted rather than raising.
NUM = r"[\d.]+"
SPACE_ROW = re.compile(
    r"^\s*\d+\s+(?P<name>.+?)\s+(?P<pos>QB|RB|WR|TE|K|DEF|DST)\s*[-,]?\s*"
    r"(?P<team>[A-Z]{2,3})\s+(?P<bye>\d{1,2})\s+(?P<adp>" + NUM + r")\s+(?P<sd>" + NUM + r")\s*$"
)


def parse_row(line):
    """Return (name, pos, team, bye, adp, sd) or None if the line isn't a data row."""
    if not line.strip():
        return None
    if "\t" in line:
        cols = [c.strip() for c in line.split("\t")]
        if len(cols) < 6:
            return None
        rank, name, pos, team = cols[0], cols[1], cols[2], cols[3]
        rest = cols[4:]
        if not rank.isdigit() or not rest[0].replace(".", "", 1).isdigit():
            return None  # looks like the header row
        try:
            bye = int(rest[0])
            adp = float(rest[1])
            sd = float(rest[2])
        except (ValueError, IndexError):
            return None
        pos = "DST" if pos.upper() == "DEF" else pos.upper()
        return name, pos, team.upper(), bye, adp, sd

    m = SPACE_ROW.match(line)
    if not m:
        return None
    pos = m.group("pos").upper()
    pos = "DST" if pos == "DEF" else pos
    return (m.group("name"), pos, m.group("team").upper(),
            int(m.group("bye")), float(m.group("adp")), float(m.group("sd")))


def parse_paste(text):
    rows, skipped = [], 0
    for line in text.splitlines():
        parsed = parse_row(line)
        if parsed is None:
            if line.strip():
                skipped += 1
            continue
        rows.append(parsed)
    return rows, skipped


# ------------------------------------------------------------------ main ---

def main():
    argv = [a for a in sys.argv[1:] if a not in ("--write", "--dry-run")]
    write = "--write" in sys.argv[1:]

    paste_path = argv[0] if len(argv) > 0 else DEFAULT_PASTE
    players_path = argv[1] if len(argv) > 1 else DEFAULT_PLAYERS

    if not os.path.exists(paste_path) and paste_path == DEFAULT_PASTE:
        print(f"no real paste at {paste_path} yet -- falling back to the synthetic "
              f"fixture at {DEFAULT_SAMPLE} so the tool has something to run against.")
        paste_path = DEFAULT_SAMPLE

    text = open(paste_path, encoding="utf-8").read()
    rows, skipped = parse_paste(text)
    print(f"parsed {len(rows)} rows from {paste_path} ({skipped} line(s) skipped as unreadable)")

    board = json.load(open(players_path, encoding="utf-8"))
    by_norm = {}
    for p in board["players"]:
        by_norm.setdefault(norm(p["name"]), []).append(p)

    board_seen = set()
    changes = []      # (name, pos, old_adp, new_adp)
    unmatched_ffc = []
    matched = 0

    for i, (name, pos, team, bye, adp, sd) in enumerate(rows, start=1):
        key = norm(name)
        cands = by_norm.get(key)
        pl = None
        if cands:
            pl = next((c for c in cands if c["pos"] == pos), cands[0])
        if pl is None:
            unmatched_ffc.append(f"{name} ({pos} {team})")
            continue
        matched += 1
        board_seen.add(id(pl))
        old_adp = pl.get("adp")
        if old_adp != adp:
            changes.append((pl["name"], pl["pos"], old_adp, adp))
        pl["adp"] = adp
        pl["adp_sd"] = sd
        pl["adp_rank"] = i
        for k in PROTECTED_KEYS:
            assert k not in ("adp", "adp_sd", "adp_rank")  # protected set never overlaps writes

    match_rate = matched / len(rows) if rows else 0.0
    print(f"matched {matched}/{len(rows)} FFC rows against the board ({match_rate:.0%})")

    print("\n== ADP changes, sorted by |delta| descending ==")
    changes.sort(key=lambda c: abs((c[3] or 0) - (c[2] or 0)), reverse=True)
    for name, pos, old, new in changes:
        old_s = f"{old:g}" if old is not None else "none"
        delta = (new - old) if old is not None else 0
        sign = "+" if delta >= 0 else ""
        print(f"  {name} {pos} | adp {old_s} -> {new:g} ({sign}{delta:g})")
    if not changes:
        print("  (no ADP values changed)")

    print(f"\n== FFC rows not found on the board ({len(unmatched_ffc)}) -- candidate risers/new names ==")
    for u in unmatched_ffc:
        print(f"  {u}")

    board_absent = [p["name"] for p in board["players"] if id(p) not in board_seen]
    print(f"\n== Board names absent from this pull ({len(board_absent)}) ==")
    for n in board_absent[:40]:
        print(f"  {n}")
    if len(board_absent) > 40:
        print(f"  ... and {len(board_absent) - 40} more")

    if match_rate < MATCH_RATE_FLOOR:
        print(f"\nREFUSING TO WRITE: match rate {match_rate:.0%} is below the "
              f"{MATCH_RATE_FLOOR:.0%} floor. That almost always means the paste shape "
              f"changed and this parser is silently misreading it -- not that the "
              f"player pool actually shifted that much four hours before a draft. "
              f"Fix the parser, don't force the write.")
        sys.exit(1)

    if not write:
        print("\nDRY RUN -- no file written. Re-run with --write to save.")
        return

    with open(players_path, "w", encoding="utf-8") as f:
        json.dump(board, f, indent=1, ensure_ascii=False)  # matches players.json's existing style
        f.write("\n")
    print(f"\nwrote {players_path}")


if __name__ == "__main__":
    main()
