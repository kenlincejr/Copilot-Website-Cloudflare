#!/usr/bin/env python3
"""
ffsignals.py — the pieces every signal loader needs, defined once.

This module exists because the alternative is six copies of a name normalizer
that drift apart over a weekend. `bake-players.py` used to own `norm()` and
`apply-ffc.py` reached into that file by path with importlib rather than copy it
— a deliberate act, documented there, to make drift impossible. This file is that
same instinct with the plumbing tidied: `norm` lives here, `bake-players.py`
re-exports it, and `apply-ffc.py` keeps working unchanged because it imports the
name from the module it always did.

Nothing here fetches. Nothing here writes the board. These are pure functions and
one small accumulator, so they can be tested without a network or a bake.
"""

import csv, math, re, sys, unicodedata

# The Windows console defaults to cp1252, which cannot encode the arrows and
# middots these reports use, and a report that crashes on a player's name is
# worse than no report. Importing this module makes stdout safe for anything.
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---------------------------------------------------------------- name keys

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}


def norm(name):
    """Fold a display name to a join key.

    Moved here verbatim from bake-players.py. Do not "improve" it in isolation:
    assets/app.js has a JS transliteration of this exact function and the two
    have to agree, because the Yahoo paste is keyed with the JS one and joined
    against keys made with this one.
    """
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = s.lower().replace(".", " ").replace("'", "").replace("-", " ")
    parts = [p for p in re.split(r"\s+", s) if p and p not in SUFFIXES]
    return " ".join(parts)


# Every feed spells a few of these differently, and an abbreviation difference
# is not a team change. Left unfolded, the Rams alone produce seven false
# "he moved teams" warnings, which is how a report teaches people to ignore it.
TEAM_ALIAS = {
    "LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV", "WSH": "WAS",
    "WFT": "WAS", "JAC": "JAX", "ARZ": "ARI", "BLT": "BAL", "CLV": "CLE",
    "HST": "HOU", "SL": "LAR", "GNB": "GB", "KAN": "KC", "NWE": "NE",
    "NOR": "NO", "SFO": "SF", "TAM": "TB",
}


def team(t):
    """Fold a team abbreviation to the board's spelling."""
    t = (t or "").strip().upper()
    return TEAM_ALIAS.get(t, t)


def key(name, pos):
    """The canonical join key. Position is *in* the key on purpose.

    bake-players.py's name lookup has a fallback that drops the position
    constraint entirely, which means a receiver can silently inherit a
    same-named quarterback's numbers. Putting position in the key makes that
    class of bug unrepresentable rather than merely unlikely.
    """
    return norm(name) + "|" + (pos or "").upper()


# ---------------------------------------------------------------- CSV

def read_csv(path, encoding="utf-8"):
    """Read a CSV into a list of dicts, with a real parser.

    Every nflverse CSV carries quoted fields with embedded commas (headshot_url
    is the usual culprit). A naive line.split(",") shifts every column to the
    right of it. The loud failure is a numeric column full of URL fragments; the
    quiet one is a numeric column shifted into another numeric column, which
    parses fine and is wrong. Hence: csv.DictReader, always.
    """
    with open(path, encoding=encoding, errors="replace", newline="") as f:
        return list(csv.DictReader(f))


def num(v, default=None):
    """CSV numbers arrive as strings, and nflverse writes NA for missing."""
    if v is None:
        return default
    s = str(v).strip()
    if s == "" or s.upper() in ("NA", "NAN", "NULL", "NONE"):
        return default
    try:
        return float(s)
    except ValueError:
        return default


def ident(v):
    """Normalize an id to a bare string.

    IDs cross these files as "9509", 9509, and — when a column round-tripped
    through a float — "9509.0". All three must land on one key or the join
    misses silently.
    """
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s.upper() in ("NA", "NAN", "NULL", "NONE"):
        return None
    try:
        f = float(s)
        if f.is_integer():
            return str(int(f))
    except ValueError:
        pass
    return s


# ------------------------------------------------------------ knot residual

def knot_residual(pairs, min_pairs=20, bands=10, min_band=8, min_chunk=4):
    """Fit y as a function of x by sliding-band medians; return expected(x).

    Extracted verbatim from the adpResid computation in bake-players.py so that
    every "how far is he from where players of his price normally sit" signal
    uses one implementation. The reason the raw difference is unusable is worth
    restating: two ranked lists of different depths drift apart structurally as
    you go deeper, so the difference between them measures the depth of the
    lists as much as it measures the player. The residual removes that drift.

    Returns a callable, or a callable returning None when there is not enough
    data to fit anything.
    """
    pairs = sorted((x, y) for x, y in pairs if x is not None and y is not None)
    knots = []
    if len(pairs) >= min_pairs:
        step = max(min_band, len(pairs) // bands)
        for i in range(0, len(pairs), step):
            chunk = pairs[i:i + step]
            if len(chunk) < min_chunk:
                continue
            xs = sorted(c[0] for c in chunk)
            ys = sorted(c[1] for c in chunk)
            knots.append((xs[len(xs) // 2], ys[len(ys) // 2]))

    def expected(x):
        if not knots or x is None:
            return None
        # Linear extrapolation past the end knots, not a flat clamp.
        #
        # The flat form is wrong in a way that looks exactly like signal, and it
        # is worst precisely where the board is most valuable. Each knot sits at
        # the median of a band of about two dozen players, so the first knot is
        # around pick 12 — and a flat clamp compares every one of the top twelve
        # players against that median instead of against himself. Jahmyr Gibbs,
        # taken 1.4 here and 2.4 on the expert list, came out with a ten-pick
        # "discount" that was nothing but the shape of the extrapolation. Two
        # ranked lists both start at 1, so near the top the honest expectation
        # is close to the identity, and a line through the first two knots gets
        # there while a horizontal one cannot.
        if x <= knots[0][0]:
            if len(knots) < 2 or knots[1][0] == knots[0][0]:
                return knots[0][1]
            sl = (knots[1][1] - knots[0][1]) / (knots[1][0] - knots[0][0])
            return knots[0][1] + sl * (x - knots[0][0])
        if x >= knots[-1][0]:
            if len(knots) < 2 or knots[-1][0] == knots[-2][0]:
                return knots[-1][1]
            sl = (knots[-1][1] - knots[-2][1]) / (knots[-1][0] - knots[-2][0])
            return knots[-1][1] + sl * (x - knots[-1][0])
        for i in range(len(knots) - 1):
            x0, y0 = knots[i]
            x1, y1 = knots[i + 1]
            if x0 <= x <= x1:
                t = 0 if x1 == x0 else (x - x0) / (x1 - x0)
                return y0 + t * (y1 - y0)
        return knots[-1][1]

    expected.knots = knots
    return expected


# ---------------------------------------------------------------- centering

MIN_GROUP = 20
CLIP = 3.0


def center(values, groups=None, min_group=MIN_GROUP, clip=CLIP):
    """Mean-center and scale a signal to z-scores, within group.

    Three decisions are baked in here and each one is load-bearing.

    Centering happens at bake time, not in the engine, because the engine
    rebuilds the board as players come off it — so an engine-time z-score would
    drift for a player because *somebody else* was drafted, which is
    unfalsifiable behaviour in the hours you most need to trust the number.

    Centering happens within the coverage set, so a player with no data gets no
    key at all rather than a zero. Absent means "we do not know"; zero means
    "average"; conflating them is how a signal covering forty players silently
    outranks two hundred whose only sin is missing data.

    Centering happens within position where there is enough of a position to do
    it, because a running back's target share and a receiver's do not share a
    scale. Below `min_group` the standard deviation is not stable enough to
    trust, so the group falls back to the whole board and says so.

    Returns (zscores, stats) where zscores is keyed like `values` and omits any
    key whose value was None.
    """
    vals = {k: v for k, v in values.items() if v is not None and _finite(v)}
    if not vals:
        return {}, {"n": 0, "groups": {}, "clipped": 0}

    if groups is None:
        groups = {k: "all" for k in vals}

    buckets = {}
    for k in vals:
        buckets.setdefault(groups.get(k, "all"), []).append(k)

    # Small groups collapse into one board-wide bucket rather than being scored
    # against a standard deviation computed from a dozen players.
    small = [g for g, ks in buckets.items() if len(ks) < min_group]
    if small:
        merged = []
        for g in small:
            merged.extend(buckets.pop(g))
        buckets.setdefault("board-wide", []).extend(merged)

    out, stats, clipped = {}, {}, 0
    for g, ks in buckets.items():
        xs = [vals[k] for k in ks]
        mean = sum(xs) / len(xs)
        var = sum((x - mean) ** 2 for x in xs) / len(xs)
        sd = math.sqrt(var)
        stats[g] = {"n": len(ks), "mean": round(mean, 4), "sd": round(sd, 4)}
        if sd < 1e-9:
            # A constant is not a signal. Emitting zeros would be honest but
            # useless; emitting nothing keeps it out of the score entirely.
            for k in ks:
                out[k] = 0.0
            continue
        for k in ks:
            z = (vals[k] - mean) / sd
            if z > clip:
                z, _c = clip, 1
                clipped += 1
            elif z < -clip:
                z, _c = -clip, 1
                clipped += 1
            out[k] = round(z, 3)

    return out, {"n": len(vals), "groups": stats, "clipped": clipped,
                 "clip": clip, "min_group": min_group}


def _finite(v):
    try:
        f = float(v)
        return f == f and abs(f) != float("inf")
    except (TypeError, ValueError):
        return False


# ---------------------------------------------------------------- reporting

class MatchReport:
    """What joined, what did not, and — in both directions — which names.

    The bake prints board-side misses truncated at 25 and has never printed the
    feed side at all. The feed side is where a player you have not heard of
    shows up, which is the entire point of adding sources. So this reports both,
    and it reports the tier every match came in at, because a join that
    succeeded only on a bare name is a different kind of fact from one that
    matched on name, position and team.
    """

    def __init__(self, name, source, floor=0.85, asof=None):
        self.name = name
        self.source = source
        self.floor = floor
        self.asof = asof
        self.tiers = {}
        self.matched = set()
        self.board_missing = []
        self.feed_extra = []
        self.eligible = 0
        self.source_rows = 0
        self.notes = []

    def hit(self, k, tier="name_pos"):
        self.matched.add(k)
        self.tiers[tier] = self.tiers.get(tier, 0) + 1

    def miss(self, label):
        self.board_missing.append(label)

    def extra(self, label):
        self.feed_extra.append(label)

    def note(self, s):
        self.notes.append(s)

    @property
    def rate(self):
        return (len(self.matched) / self.eligible) if self.eligible else 0.0

    @property
    def passed(self):
        return self.rate >= self.floor

    def render(self, extra_cap=20):
        L = []
        head = "== %s — %s" % (self.name, self.source)
        if self.asof:
            head += " (as of %s)" % self.asof
        L.append(head + " ==")
        L.append("   %d source rows -> %d/%d eligible board players (%.0f%%)   "
                 "FLOOR %.0f%%  %s"
                 % (self.source_rows, len(self.matched), self.eligible,
                    100 * self.rate, 100 * self.floor,
                    "PASS" if self.passed else "REFUSED"))
        if self.tiers:
            L.append("   tiers: " + " · ".join(
                "%s %d" % (t, n) for t, n in sorted(self.tiers.items())))
        for n in self.notes:
            L.append("   " + n)
        # Board-side misses print in full. Truncating this list is how a sleeper
        # disappears quietly, which is the worst failure mode available here.
        if self.board_missing:
            L.append("   -- %d board players unmatched --" % len(self.board_missing))
            L.append("      " + " · ".join(self.board_missing))
        else:
            L.append("   -- 0 board players unmatched --")
        if self.feed_extra:
            L.append("   -- %d source rows with no board player (candidate risers) --"
                     % len(self.feed_extra))
            L.append("      " + " · ".join(self.feed_extra[:extra_cap])
                     + (" …" if len(self.feed_extra) > extra_cap else ""))
        return "\n".join(L)
