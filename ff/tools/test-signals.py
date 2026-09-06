#!/usr/bin/env python3
"""
test-signals.py — the pure functions under the signal layer, pinned.

Everything here runs without a network and without a bake. These are the pieces
where a mistake is silent: a CSV parser that shifts columns, a name key that
stops matching, a residual fit that goes flat at the ends of the board, a
centring that leaves a mean somewhere other than zero, and — the one most likely
to be wrong — the sign convention on a betting spread.
"""

import os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ffsignals as F

_pass = _fail = 0


def ok(label, cond, detail=""):
    global _pass, _fail
    if cond:
        _pass += 1
        print("  ok   " + label + (("  — " + detail) if detail else ""))
    else:
        _fail += 1
        print("  FAIL " + label + (("  — " + detail) if detail else ""))


print("\n== read_csv survives quoted fields ==")
# The failure the appendix warns about: a quoted field containing a comma. A
# naive line.split(",") shifts every column to the right of it. The loud version
# gives you a numeric column full of URL fragments; the quiet version shifts one
# numeric column into another and parses perfectly.
with tempfile.TemporaryDirectory() as td:
    p = os.path.join(td, "t.csv")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write('name,note,wopr\n')
        f.write('"Smith, Jr., Bob","a note, with commas",0.61\n')
        f.write('Plain Guy,no commas here,0.42\n')
    rows = F.read_csv(p)
    ok("both rows parse", len(rows) == 2, str(len(rows)))
    ok("the embedded comma did not shift a column",
       rows[0]["wopr"] == "0.61", rows[0]["wopr"])
    ok("and the quoted name survives whole",
       rows[0]["name"] == "Smith, Jr., Bob", rows[0]["name"])

print("\n== norm() and the join key ==")
ok("apostrophes are stripped, not spaced", F.norm("Ja'Marr Chase") == "jamarr chase",
   F.norm("Ja'Marr Chase"))
ok("suffixes drop", F.norm("Kenneth Walker III") == "kenneth walker",
   F.norm("Kenneth Walker III"))
ok("and so does a period-suffix", F.norm("Marvin Harrison Jr.") == "marvin harrison",
   F.norm("Marvin Harrison Jr."))
ok("accents fold", F.norm("Amon-Ra St. Brown") == "amon ra st brown",
   F.norm("Amon-Ra St. Brown"))
# Position lives in the key so that the cross-position join bake-players.py's
# fallback allows is not merely unlikely but unrepresentable.
ok("position is part of the key", F.key("Josh Allen", "QB") != F.key("Josh Allen", "WR"))

print("\n== ident() folds every spelling of an id ==")
ok('"9509" and 9509 and "9509.0" are one id',
   F.ident("9509") == F.ident(9509) == F.ident("9509.0") == "9509")
ok("nflverse NA becomes None", F.ident("NA") is None and F.ident("") is None)
ok("a non-numeric id passes through", F.ident("GibbJa00") == "GibbJa00")

print("\n== team aliases ==")
ok("LA folds to LAR", F.team("LA") == "LAR")
ok("an unknown code passes through", F.team("KC") == "KC")

print("\n== knot_residual: the fit, and the ends ==")
# A monotone drift with a known offset. The residual has to find the drift and
# report the offset, not the drift.
pairs = [(x, 2.0 * x + 5) for x in range(1, 200)]
exp = F.knot_residual(pairs)
mid = exp(100)
ok("the fit tracks a linear drift in the middle", abs(mid - 205) < 12, str(round(mid, 1)))

# The bug this is really here for. Each knot sits at the median of a band, so
# the first knot is well inside the board; a flat clamp compares every player
# above it against that median instead of against himself, and manufactures a
# large residual for the best players on the board out of nothing.
lo = exp(1)
ok("it extrapolates below the first knot instead of going flat",
   abs(lo - 7) < 20, "expected ~7 at x=1, got " + str(round(lo, 1)))
ok("and above the last knot", exp(250) > exp(199), str(round(exp(250), 1)))
ok("an empty fit returns None rather than guessing", F.knot_residual([])(5) is None)

print("\n== center(): mean zero, clipped, and absent is not zero ==")
vals = {("p%d" % i): float(i) for i in range(60)}
z, stats = F.center(vals)
mean = sum(z.values()) / len(z)
ok("the centred mean is zero", abs(mean) < 1e-9, str(mean))
ok("every value got a z", len(z) == 60)

vals2 = dict(vals); vals2["outlier"] = 10000.0
z2, st2 = F.center(vals2)
ok("an outlier clips at exactly 3", abs(z2["outlier"] - 3.0) < 1e-9, str(z2["outlier"]))
ok("and the clip is counted", st2["clipped"] >= 1, str(st2["clipped"]))

vals3 = dict(vals); vals3["nodata"] = None
z3, _ = F.center(vals3)
ok("a None value produces no key at all — absent is not average",
   "nodata" not in z3)

# Below the minimum group size the standard deviation is not stable enough to
# trust, so the group collapses into the board rather than being scored against
# a spread computed from a dozen players.
small = {("a%d" % i): float(i) for i in range(14)}
groups = {k: "TE" for k in small}
z4, st4 = F.center(small, groups)
ok("a group under 20 falls back to board-wide", "board-wide" in st4["groups"],
   ", ".join(st4["groups"]))

flat = {("f%d" % i): 7.0 for i in range(30)}
z5, _ = F.center(flat)
ok("a constant is not a signal — every z is zero, none is NaN",
   all(v == 0.0 for v in z5.values()))

print("\n== Vegas: the sign convention ==")
# The bug most likely to be written here, so it is pinned by hand rather than by
# a round trip. ESPN's `spread` is signed relative to the HOME team, and the
# `details` string names the favourite in prose that must be ignored.
#
# Verified against the real week-15 feed: SF @ LAC, overUnder 47.5, spread -2.5,
# details "LAC -2.5" — home favoured by 2.5, so home is the higher total.
def implied(ou, spread):
    return (round(ou / 2.0 - spread / 2.0, 2), round(ou / 2.0 + spread / 2.0, 2))

home, away = implied(47.5, -2.5)
ok("the favoured home team gets the higher implied total", home > away,
   "home %.2f away %.2f" % (home, away))
ok("home implied is 25.0", home == 25.0, str(home))
ok("away implied is 22.5", away == 22.5, str(away))
ok("the two implied totals sum to the over/under", abs(home + away - 47.5) < 1e-9)
home2, away2 = implied(44.0, 3.0)
ok("and an away favourite inverts it", away2 > home2,
   "home %.2f away %.2f" % (home2, away2))

print("\n== MatchReport refuses below its floor ==")
r = F.MatchReport("t", "src", floor=0.9)
r.eligible = 100
for i in range(80):
    r.hit("k%d" % i)
ok("80 of 100 against a 90% floor does not pass", not r.passed, "%.0f%%" % (100 * r.rate))
for i in range(80, 95):
    r.hit("k%d" % i)
ok("95 of 100 does", r.passed, "%.0f%%" % (100 * r.rate))
r.miss("Somebody Missing")
ok("the report names who was missed", "Somebody Missing" in r.render())

print("\n%d passed, %d failed\n" % (_pass, _fail))
sys.exit(1 if _fail else 0)
