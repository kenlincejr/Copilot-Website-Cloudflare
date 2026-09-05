# Workstream B — Engine math and strategy soundness

Draftline QA, 2026-09-04. Scope: everything under "B. Engine math and strategy
soundness" in `ff/tools/qa-review-prompt.md`. Read-only on source; all work done
with throwaway Node harnesses that re-implement `app.js`'s draft plumbing
(`ownerOfPick`, `keeperAt`, `pendingKeepers`, `myUpcoming`, `analyze()`'s ctx,
`runMock`, `sanitizeKnobs`) transcribed line for line, so every number below is
produced by the shipped `engine.js` under the shipped league state.

**Baseline, before and after:** `node ff/tools/test-engine.js` → `99 passed, 0 failed`.
No source file was edited. Nothing was committed.

League state used throughout unless stated: `kinda_highlanders`, 12 teams, 15
rounds, slot 11, keeper Drake Maye round 5 (pick 59), `byeTolerance` 3,
`defFloorRound` 7, `kFloorRound` = rounds − 1 = 14.

Counts: **0 BLOCKER, 2 HIGH, 5 MEDIUM, 4 LOW**, plus a STRATEGY section.

---

## HIGH

### B1 — HIGH — Hero RB takes a tight end at pick 11 in 98% of drafts and never gets its "anchor back"

**Defect.** The Hero RB style's own copy says "Take one high-end running back
early as an anchor", but from slot 11 it recommends a tight end at pick 11 in
98% of simulated drafts and does not own a back after picks 11 and 14 in 62% of
them; the first back arrives at pick 38 more often than at pick 14.

**Reproduction.** `runMock` with `DRAFTLINE_STRATEGIES.hero_rb.knobs`, 200
iterations, seed 20260908, slot 11, keeper in place. Also reproduced
deterministically on the live board (`analyze()` at pick 11 with the pool filled
down to ADP order).

**Evidence.**

```
Hero RB
   pick 11 position mix: TE 98%  RB 1.5%  WR 0.5%
   pick 14 position mix: WR 61.5%  RB 37%  TE 1.5%
   first RB taken at pick: 11 (1.5%)  14 (37%)  35 (1%)  38 (54%)  62 (3%)  86 (3.5%)

Elite tight end
   pick 11 position mix: TE 100%
   pick 14 position mix: RB 87%  TE 13%
   first RB taken at pick: 14 (87%)  35 (13%)

  Hero RB  RBs at picks 11+14: 0x123 1x77 2x0   median RBs through round 5 = 1
```

Live board, same state, no randomness:

```
  Hero RB  @ pick 11: Brock Bowers(TE 101.0 bias1.05), James Cook III(RB 87.6 bias0.78),
                      Nico Collins(WR 87.0 bias1.18), Chase Brown(RB 80.3 bias0.78)
  Balanced @ pick 11: James Cook III(RB 112.3 bias1), Chase Brown(RB 103.0 bias1),
                      Brock Bowers(TE 96.3 bias1)
```

**Cause.** `earlyPosBias.RB = 0.78` cuts the top back's score by 22%
(107.5 → 87.6) while `TE 1.05` lifts Bowers (96.3 → 101.0). Nothing in the style
pulls a back back up once one is *not* yet owned, so the de-emphasis applies to
the anchor pick itself. Hero RB is implemented as "soft Zero RB with a TE tilt"
and lands on almost the same pick 11 as Elite tight end.

**Proposed diff (not applied)** — make the de-emphasis conditional on already
owning a back, which is what "one anchor, then pivot" means:

```diff
--- a/ff/assets/strategies.js
+++ b/ff/assets/strategies.js
@@
     knobs: {
       earlyRounds: 5,
-      earlyPosBias: { RB: 0.78, WR: 1.18, TE: 1.05 },
+      // The anchor is the point of the style, so the early de-emphasis has to
+      // start *after* it. Rounds 1-2 are left neutral at running back; the
+      // pivot begins in round 3.
+      earlyRounds: 5,
+      earlyPosBias: { RB: 0.95, WR: 1.18, TE: 1.00 },
+      posFloorRound: {},
       posBias: { RB: 1.05, WR: 1.0 },
       handcuffBonus: 5
     }
```

This is a knob change only, so it needs a judgment call from the user rather
than a unilateral fix. The structurally correct version is a new knob —
`earlyPosBias` that is applied only once `need[pos].have >= 1` — which is a
formula change and out of scope for a small fix. Whichever is chosen, the style
needs a pinned test: "Hero RB owns exactly one RB after picks 11 and 14 in a
majority of 200 seeded runs."

---

### B2 — HIGH — `runMock` counts the keeper twice, so the style-comparison card reports QB 2 and never drafts a backup quarterback

**Defect.** `runMock` seeds the user's roster from `A.mine` (which already
contains the pending keeper) and then pushes the keeper again when the loop
reaches his pick, so every simulated roster holds two Drake Mayes.

**Reproduction.** Fresh state, pick 1, keeper Drake Maye round 5. `runMock(balanced.knobs, 1, 12345)`.

**Evidence.**

```
=== runMock keeper double-count ===
  mine.length = 16 (15 rounds, 14 drafted + 1 keeper => expect 15)
  duplicates: Drake Maye x2
  reported composition: {"QB":2,"RB":6,"TE":2,"WR":4,"DEF":1,"K":1}
  actual distinct:      {"QB":1,"RB":6,"TE":2,"WR":4,"DEF":1,"K":1}
  from pick 70 (keeper already consumed): duplicates = (none) ; mine.length=15
```

**Consequences.** (a) `summarizeMock` reports `QB 2` for every style on the Draft
style comparison card — a wrong number on a screen the user reads to choose how
to draft. (b) `positionalNeed` sees `have.QB = 2`, `depthCap("QB") = 2`, so the
simulated user is blocked from ever taking a real second quarterback — the mock
cannot show you what a QB2 would cost. (c) One roster row is a duplicate name.
The bug is live for the entire window in which the style comparison is actually
used (any time the draft has not yet passed pick 59) and disappears afterwards,
which is why it survives casual testing.

**Proposed diff (not applied).**

```diff
--- a/ff/assets/app.js
+++ b/ff/assets/app.js
@@ -1632,7 +1632,11 @@ function runMock(knobs, iterations, seed) {
       var k = keeperAt(pk);
       if (k) {
         taken[k.name] = true;
-        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name]) mine.push(byName[k.name]);
+        // `seededMine` came from allPicks(), which already includes pending
+        // keepers, so re-adding him here gave the simulated roster two of him:
+        // the style card then reported QB 2 and depthCap blocked a real backup.
+        if (ownerOfPick(pk).slot === S.league.slot && byName[k.name] &&
+            !mine.some(function (q) { return q.name === k.name; }))
+          mine.push(byName[k.name]);
         continue;
       }
```

Under 30 lines, and it has a natural pinning test (`runMock` roster length ===
rounds, no duplicate names), but it changes what the mock reports, so it is
written up rather than committed per rule 3's "anything that changes a formula"
neighbourhood. It is the first thing I would take.

---

## MEDIUM

### B3 — MEDIUM — `gp: 18` is Sleeper's *week* count, not games played; the 2026 season is 17 games, and the D/ST points-allowed calibration silently depends on the error

**Defect.** `bake-players.py` reads Sleeper's `gp` for offensive players
(`gp = st.get("gp") or 17`) and hard-codes 18 for D/ST and kickers. Sleeper's
`gp` is a constant 18 for essentially every player in the feed, including 255
players carrying an injury designation, so it is the number of weeks in the
schedule, not a projection. The same dataset proves the season is 17 games. The
error is inert for offense but scales every D/ST points-allowed total by 18/17.

**Reproduction and evidence.**

Sleeper's raw feed (`ff/tools/sleeper.json`, 3,304 records):

```
sleeper gp histogram: Counter({18.0: 3272, 1.0: 32})
injury_status: Counter({None: 3049, 'Questionable': 162, 'IR': 67, 'NA': 15, 'PUP': 7, 'Sus': 2, 'DNR': 2})
gp for injured: Counter({18.0: 255})
```

The board itself says the season is 18 weeks and therefore 17 games — 32 teams,
one bye each, byes spread over weeks 5–11 and 13–14:

```
teams 32
teams per bye week { '5': 2, '6': 4, '7': 4, '8': 4, '9': 2, '10': 4, '11': 6, '13': 4, '14': 2 }
```

with `playoffWeeks: [15,16,17]` in every preset and `SEASON_WEEKS = 17` in
`engine.js`, whose own default is `var games = p.gp || 17`. An 18-game season
would need 19+ weeks and two byes a team.

Board effect, `buildBoard` at gp 18 vs the same data at gp 17:

```
name                  tier  pts18   pts17   d     vor18  vor17  ovRank18 ovRank17
Houston Defense        1    335.6   325.8    -9.8   60.9   57.9       22       22
Seattle Defense        1    334.6   324.8    -9.8   59.9   56.9       23       26
Denver Defense         1    333.6   323.8    -9.8   58.9   55.9       24       27
Pittsburgh Defense     3    275.7   268.9    -6.8    1.0    1.0      103      103
DEF replacement 18: 274.68  17: 267.87

biggest non-DEF change: Dak Prescott 301.89 -> 302.05 (+0.164); K delta 0.000
```

So: every defense loses 6.8–9.8 points of "your points" and the top tier loses
3.0 VOR; no offensive player moves by more than 0.17 points; kickers do not move.
Nothing changes rank in the top 21. **Not a blocker**, and not a pick change.

**The part that matters more.** `PA_DIST` was hand-calibrated *at 18 games*. Its
own comment states the targets and the tests assert them:

```
tier  ken/gm   ken*17   ken*18   yahoo/gm  yah*17  yah*18   meanPA
  1    9.770    166.1    175.9     2.070    35.2    37.3   17.1
  2    8.380    142.5    150.8     1.510    25.7    27.2   19.1
  3    6.810    115.8    122.6     0.870    14.8    15.7   21.2
  4    5.525     93.9     99.5     0.375     6.4     6.8   23.1
  5    4.150     70.6     74.7    -0.160    -2.7    -2.9   25.0
```

The bake's stated targets ("tier 1 near 175, tier 3 near 123") are hit only at
18 games. At 17 they are 166 and 116. The distributions themselves are sane —
tier 1 implies 17.1 points allowed a game, tier 5 implies 25.0 — so the
*distribution* is right and the *multiplier* is wrong, and the two errors were
fitted against each other. Under `yahoo_default` the same tiers are worth 37/16/−3
season points, a 40-point tier-1-to-tier-5 spread against 101 in Ken's rules,
which is exactly the "boosted tiers are the edge" claim and it holds either way.

**Second half: does the projection price an absence?** Yes, comprehensively — so
the bake should *not* discount games for IR/PUP/exempt. Sleeper's season totals
already do it:

```
Josh Jacobs    RB  NA   adp  69.3  pts  88.2  vor  -68.4  posRank 48  vorRank 206
Zach Charbonnet RB PUP  adp 137.7  pts  68.0  vor  -88.7  posRank 55  vorRank 226
James Conner   RB  IR   adp 152.8  pts  57.9  vor  -98.8  posRank 63  vorRank 239
Alvin Kamara   RB  Ques adp 153.2  pts  63.6  vor  -93.1  posRank 61  vorRank 233
```

Jacobs carries a market ADP of 69 and a board rank of 206. The board is already
burying him. A `gp` discount on top of that would double-count the absence.
`gp` only ever divides into a per-game mean for the bonus model and multiplies
the D/ST points-allowed total, so a wrong `gp` on an injured player costs
essentially nothing.

**Proposed diff (not applied).** Two lines, but they move a formula and every
D/ST number on the board, so this is the user's call:

```diff
--- a/ff/tools/bake-players.py
+++ b/ff/tools/bake-players.py
@@
-# Calibrated so that, run through Ken's PA values (25/20/14/10/5/-1/-4), a tier-1
-# unit lands near 175 season points and a tier-3 near 123 — the figures the
-# research digest derives independently.
+# Calibrated so that, run through Ken's PA values (25/20/14/10/5/-1/-4) over a
+# SEVENTEEN-game season, a tier-1 unit lands near 175 season points and a tier-3
+# near 123 — the figures the research digest derives independently. Sleeper's
+# `gp` is a constant 18 for every player in the feed, injured ones included: it
+# is the number of weeks in the schedule, not games played. 2026 is 18 weeks and
+# 17 games (32 teams, one bye each, weeks 5-14).
+GAMES = 17
@@
-            gp = 18
+            gp = GAMES
@@
-            rec["proj"] = kicker_line(k_rank, 18)
+            rec["proj"] = kicker_line(k_rank, GAMES)
@@
-            gp = st.get("gp") or 17
+            gp = GAMES   # Sleeper's own value is a constant 18 = weeks, not games
```

and then re-fit `PA_DIST` so tier 1 lands at 175/17 = 10.29 points a game and
tier 3 at 123/17 = 7.24 (they are currently 9.77 and 6.81), or accept the lower
targets and move the assertions in `test-engine.js` with an explanation. Doing
the `gp` change *without* re-fitting drops every defense 9.8 points and the
tier-1 VOR from 60.9 to 57.9, which is the smaller of the two evils but is still
a deliberate re-rating. If nothing is done before Monday, note in the runbook
that D/ST "your points" read about 3% high in absolute terms and that this does
not change the ordering.

---

### B4 — MEDIUM — the run detector fires in half of all eight-pick windows; "4 of the last 8" is the base rate, not a run

**Defect.** `detectRuns` flags a run at 4 of the last 8 picks at one position.
In a 12-team PPR draft that threshold is met at receiver a third of the time and
at running back a fifth of the time by ordinary drafting. `composite` then adds
12% to every player at that position, and `roomPick` pulls the modeled room half
a standard deviation toward it.

**Reproduction.** 500 seeded full-draft simulations through the shipped
`roomPick` on the shipped ADP and per-player SDs; every rolling 8-pick window
scored with the shipped `detectRuns`. 86,000 windows.

**Evidence.**

```
=== run detector empirical fire rate (8-pick window, 500 sims) ===
  windows sampled 86000, any run detected in 43499 (50.6%)
    WR: 28819 (33.5% of windows)
    RB: 19050 (22.2% of windows)
    QB:   453 (0.5%)   TE: 376 (0.4%)   K: 306 (0.4%)   DEF: 143 (0.2%)

  max same-position count in window (n=34400):
    2 of 8: 10.3%   3 of 8: 38.9%   4 of 8: 33.9%   5 of 8: 14.4%   6 of 8: 2.3%   7 of 8: 0.2%

  P(WR >= 4 of 8) = 33.5%    P(WR >= 5 of 8) = 11.0%    P(WR >= 6 of 8) = 1.8%
  P(RB >= 4 of 8) = 22.4%    P(RB >= 5 of 8) =  5.7%    P(RB >= 6 of 8) = 0.7%
```

The modal window already contains 3 of one position and 4 is the second most
common outcome. A signal that is on half the night is not a signal. The cost is
real: 12% on a value of 110 at the top of the board is +13 points, comfortably
enough to reorder across positions, and it fires on noise. It also drives
`renderRunBanner`, so the board cries wolf about a run for half the draft.

**Proposed diff (not applied).** Raising the threshold to 5 takes the overall
fire rate from 50.6% to about 17% and the receiver rate from 33.5% to 11.0%,
which is roughly the frequency at which a room really does stampede a position:

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@
-  /** ≥4 of the last 8 picks at one position. */
+  /** ≥5 of the last 8 picks at one position.
+      4 of 8 is the base rate, not a run: across 500 simulated drafts it is met
+      in 33% of windows at receiver and 22% at running back, so a 12% bump fired
+      half the night on ordinary drafting. 5 of 8 fires in 11% and 6%. */
   function detectRuns(recentPicks) {
     var last = recentPicks.slice(-8), counts = {}, runs = {};
     last.forEach(function (p) { counts[p.pos] = (counts[p.pos] || 0) + 1; });
     Object.keys(counts).forEach(function (pos) {
-      if (counts[pos] >= 4) runs[pos] = counts[pos];
+      if (counts[pos] >= 5) runs[pos] = counts[pos];
     });
     return { runs: runs, counts: counts, window: last.length };
   }
```

A better version scores the count against the position's own base rate in this
league rather than a flat integer, but that is a formula change.

**On the second half of the brief's question — should the composite also see a
run coming from the needs of the teams ahead?** Yes, and it is the higher-value
change. `teamsAhead()` already computes it for the brief. Between picks 14 and 35
twenty other picks happen; knowing that seven of the nine teams ahead of you still
need a tight end is a far better predictor than what the last eight picks were.
The clean entry point is `expectedBestAvailable`: bias each opponent's implied
pick toward positions the teams between you and your next pick are short at,
rather than adding another term to `composite`. That keeps it inside the survival
model, where it belongs, instead of double-counting with the run multiplier.

---

### B5 — MEDIUM — `survival()` and `roomPick()` are two different models of the same event, and they disagree by up to 58 points on individual players

**Defect.** `survival()` is a marginal normal CDF on ADP: P(adp + sd·Z > pick).
`roomPick()` redraws every remaining player at every pick and takes the minimum
draw, which is an order statistic, not that CDF. High-SD players get one
independent chance to come up short at every pick, so the simulator drafts them
far earlier than their ADP; tight-SD players are crowded out and go slightly
later. The board's WAIT? column and the practice draft therefore tell the user
different things about the same player.

**Reproduction.** 300 seeded room simulations of the full draft; mean realized
pick number per player compared to the ADP the room was handed. Plus 500 sims
measuring P(available at 35 | available at 14) against `survival(p, 35)`.

**Evidence.**

```
  mean drift, tight ADP (sd<6,  n=49):  +1.51 picks later than ADP
  mean drift, wide  ADP (sd>=15, n= 8):  -9.70 picks (i.e. drafted ~10 picks EARLY)

=== survival vs roomPick: error by adp_sd bucket, gate 14 -> 35 ===
  sd<6      n= 36  mean pred 0.377  mean actual 0.456  bias +0.080
                   worst: Tetairoa McMillan sd3.4 adp31.8 pred 0.17 act 0.58
  sd 6-12   n= 10  mean pred 0.882  mean actual 0.852  bias -0.030
                   worst: Josh Allen sd7.7 adp33.3 pred 0.41 act 0.20

  14 ->  35   worst miss: Josh Jacobs (RB) pred 0.87 act 0.29
  62 ->  83   worst miss: James Conner (RB) pred 0.91 act 0.47
```

Josh Jacobs (adp 69.3, sd large after the exempt-list move) is called 87% to
last from 14 to 35 by the board and lasts 29% of the time in the app's own
simulator. Tetairoa McMillan is called 17% and lasts 58%. Both are exactly the
kind of player the user is deciding between at picks 14 and 35.

**Which one is right?** `survival()`. `adp` and `adp_sd` come from 7,681–7,848
real FFC mocks, so the marginal CDF is measured. `roomPick`'s min-of-draws is a
sampling device that does not reproduce its own inputs. So the defect is in the
simulator, and it affects the practice draft, `simulateToMyPick` and the style
comparison — not the WAIT? column.

**The aggregate is fine, which is why this is MEDIUM and not HIGH.** The "there"
list is well calibrated overall (see the calibration table in the sound list
below); at most 3 of 146 players called "there" fall under 70% actual survival at
any gate. The failure is per player and concentrated in the wide-SD tail.

**Proposed diff (not applied).** Do not change `roomPick`'s mechanism — it is
what makes the rehearsal feel like a room. Instead damp the per-pick redraw so
the realized distribution matches the marginal one. The cheapest correction is
to shrink the spread by the number of chances a player gets before his ADP:

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@ function roomPick
-      var sd = Math.max(c.sd || 6, 1.5);
-      var draw = c.adp + sd * gauss(rnd);
+      // Every remaining player is redrawn at every pick and the minimum is
+      // taken, so a player gets one chance to come up short per pick between
+      // now and his ADP. Left un-damped that is an order statistic, not his
+      // ADP distribution: measured over 300 simulated drafts, sd>=15 players
+      // went 9.7 picks earlier than the ADP they were handed while sd<6 players
+      // went 1.5 later. Damping the spread by the number of chances restores it.
+      var sd = Math.max(c.sd || 6, 1.5);
+      var chances = Math.max(1, c.adp - (opts.pick || c.adp));
+      var draw = c.adp + sd * gauss(rnd) * Math.sqrt(1 / Math.sqrt(chances));
```

This needs `roomPick`'s callers to pass the current pick number, and the exponent
wants fitting against the same 300-sim harness rather than guessing. It is a
formula change; write it up, do not ship it four days out. **For Monday the safe
statement is: trust the WAIT? column, and treat the practice draft's treatment of
volatile players (Jacobs, Conner, anyone with a large `adp_sd`) as pessimistic.**

---

### B6 — MEDIUM — the board says "can't crack your starting lineup — depth only" about a player who would fill an empty starting slot

**Defect.** In `composite`, the lead reason is chosen on `marginal <= 0.5`, which
in the back half of the draft is true of everyone at a position whose replacement
rank is long gone — including when the starting slot at that position is empty.
The same card then also carries "picks are running out to fill WR" from the
urgency bonus, so the board contradicts itself in two consecutive lines. This is
the same class of contradiction the comment at `engine.js:582` says was fixed for
the other pair of reasons.

**Reproduction.** Play the board's own top recommendation at every one of the
user's 14 picks; inspect the top three cards at each pick for a reason that says
"can't crack" while `assignRoster` still has an empty slot the player fits.

**Evidence.**

```
== STATE 3 (pick 131) ==  round 11
   slots: QB:Drake Maye | RB:James Cook III | RB:Derrick Henry | WR:Parker Washington |
          WR:EMPTY | TE:Brock Bowers | FLEX:D'Andre Swift | K:EMPTY | DEF:Houston Defense
   player: Makai Lemon (WR)  pts 171.1  vor -29.5  repl 200.7
     value = -29.5447   marginal = -29.5447   bonus = 9.0000   score = -16.9993
     reasons: WR run in progress / picks are running out to fill WR /
              can't crack your starting lineup — depth only
```

The WR slot is empty. Lemon starts the moment he is drafted. The board's lead
sentence says he cannot.

Frequency across styles, top-3 cards at all 14 of the user's picks:

```
  Balanced                1 / 42 recommendation cards (2%)  at picks: 131:Makai Lemon
  Hero RB                 1 / 42 (2%)  at picks: 131:Makai Lemon
  Zero RB                 1 / 42 (2%)  at picks: 86:Jordan Mason
  Best player available   0 / 42 (0%)
  Floor first             1 / 42 (2%)  at picks: 131:Makai Lemon
```

Rare but concentrated in the late rounds, which is where the user is skimming
fastest.

**Proposed diff (not applied).** Gate the "depth only" sentence on there actually
being no slot for him, which the context already knows via `need.short`:

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@
-    if (ctx.myPlayers && aware > 0.5 && marginal <= 0.5)
+    // `marginal <= 0.5` is true of everyone at a position whose replacement rank
+    // is long gone, empty starting slot or not. Late in a draft that put "can't
+    // crack your starting lineup" directly under "picks are running out to fill
+    // WR" on the same card, with the WR slot empty.
+    if (ctx.myPlayers && aware > 0.5 && marginal <= 0.5 && need.short <= 0.5)
       reasons.push("can't crack your starting lineup — depth only");
-    else if (need.short > 0.9) reasons.push("fills an empty " + player.pos + " slot");
+    else if (need.short > 0.9) reasons.push("fills an empty " + player.pos + " slot");
+    else if (need.short > 0.5)
+      reasons.push("fills your last open " + player.pos + " slot, below replacement");
```

Reason strings only, no arithmetic, and it wants a test that pins the pick-131
state.

---

### B7 — MEDIUM — four of the nine styles are functionally identical to Balanced

**Defect.** RB-heavy, Upside hunter and Stack the quarterback produce the same
picks and the same median lineup as Balanced from slot 11 on this data. The user
is offered nine choices, four of which are one choice.

**Reproduction.** All nine styles, `runMock` 200 iterations each, seed 20260908,
keeper double-count (B2) removed for the reporting only.

**Evidence.**

```
  Balanced               median 2164  p25 2137 p75 2180   RB-RB-TE-RB 47% | RB-RB-RB-TE 46% | RB-RB-RB-QB 7%
  RB-heavy               median 2164  p25 2137 p75 2180   RB-RB-TE-RB 47% | RB-RB-RB-TE 46% | RB-RB-RB-QB 7%
  Upside hunter          median 2164  p25 2137 p75 2179   RB-RB-TE-RB 47% | RB-RB-RB-TE 46% | RB-RB-RB-QB 7%
  Stack the quarterback  median 2164  p25 2135 p75 2178   RB-RB-TE-RB 47% | RB-RB-RB-TE 46% | RB-RB-RB-QB 7%
  Floor first            median 2146  p25 2132 p75 2171   RB-RB-TE-RB 47% | RB-RB-RB-TE 46% | RB-RB-RB-QB 7%
  Elite tight end        median 2141  p25 2132 p75 2159   TE-RB-TE-RB 87% | TE-TE-RB-RB 13% | TE-RB-RB-RB 1%
  Hero RB                median 2138  p25 2128 p75 2150   TE-WR-TE-RB 54% | TE-RB-TE-RB 33% | TE-WR-TE-QB 6%
  Best player available  median 2112  p25 2080 p75 2128   RB-RB-TE-RB 43% | RB-RB-RB-RB 41% | RB-RB-QB-RB 13%
  Zero RB                median 2111  p25 2107 p75 2129   TE-WR-TE-WR 89% | TE-WR-TE-QB 10% | WR-WR-TE-TE 1%

  median composition, ALL NINE styles: QB 1  RB 6  WR 4  TE 2  K 1  DEF 1
```

Causes, one per style:

- **RB-heavy** (`earlyPosBias RB 1.35, WR 0.88`) is inert because Balanced
  already takes a back at 11 and 14 in 100% of runs. There is nothing left to
  push.
- **Upside hunter** and **Floor first** only move players carrying a `ceiling` or
  `risk` grade, and the grades are thin exactly where the decisions are:

```
  players with a ceiling OR risk grade: 74 / 267   (ceiling 74, risk 74)
    top  25 by composite:  6 graded (24%)
    top  50 by composite: 14 graded (28%)
    top 100 by composite: 36 graded (36%)
    top 150 by composite: 55 graded (37%)
    top 100 by position: RB 12/36  WR 12/31  TE 8/18  QB 4/15
```

  Upside changed the rank of 53 of the top 100 and Floor 76, but neither moved
  the top five, and Upside's mock outcome is identical to Balanced's to the
  point.
- **Stack** fires correctly (the keeper is Drake Maye, NE; A.J. Brown, Romeo
  Doubs and Hunter Henry are NE on this board) but only ever on a marginal pick:

```
  A.J. Brown   comp 60.6  bonus 10.0  "stacks your NE quarterback"
  Romeo Doubs @ pick 131: comp -17.2 (bonus 19.0 = 10 stack + 9 urgency)
               board rank 1 -> without the bonus rank ~3   moved 2 places
  Hunter Henry @ pick 131: blocked (TE cap 2)
```

  So the brief's worry — the QB's fourth receiver beating a startable body at
  pick 155 — is **not reproduced**. At pick 155 in a Stack draft no NE pass
  catcher was left on the board and the Stack and Balanced orderings were
  identical to within 0.7 points. The +10 does move a player about two places
  late, which is proportionate.

**Proposed fix for Upside/Floor (not applied), least invasive first.** Give
every ungraded player a default `ceiling` and `risk` in the bake, from data the
board already carries, and mark them so the UI can say the grade is derived:

```
  ceiling default = 50
      + 12 if depth == 1 at his own depthPos     (a starter's role is the ceiling)
      + 10 if adp_sd / adp > 0.25                (the market itself disagrees about him)
      +  8 if pos in (WR, TE) and years_exp <= 2 (breakout window)
      -  8 if depth >= 3
  risk default = 50
      + 18 if injury in (IR, PUP, NA)   + 8 if injury == Questionable
      + 10 if depth >= 3                (role not secured)
      + 10 if adp_sd / adp > 0.25
      -  8 if depth == 1 and no injury
      clamp both to [20, 90], and set `gradeSource: "derived"`
```

That is about twenty lines in `bake-players.py` and no engine change at all —
`composite` already reads `player.ceiling` and `player.risk` and does nothing
when they are absent. The four inputs (depth chart slot, injury designation,
`adp_sd`, ADP) are all already in `data/players.js`. The risk is that a derived
grade is quietly treated as research; the mitigation is the `gradeSource` field
and a badge. **This is the single highest-value item in workstream B for making
two of the nine styles real**, and it is a data change rather than a formula
change, which makes it safe to do before Monday if there is time.

For **RB-heavy**, the honest answer is that it should be merged into Balanced or
relabelled: on this board, with `FLEX_SPLIT` at 0.55 RB, Balanced *is* RB-heavy.

---

### B8 — MEDIUM — the modeled room finishes the draft with only 8.8 of 12 kickers and 10.8 of 12 defenses

**Defect.** `roomPick` is pure ADP draw plus position caps. It has no notion of
"I must field a kicker on Sunday", so the modeled room under-drafts the two
positions every real room fills in the last two rounds by obligation.

**Reproduction.** 300 seeded full-draft room simulations; count teams holding at
least one K and one DEF at pick 180.

**Evidence.**

```
  teams holding a K at the end of the draft:   mean  8.8 of 12
  teams holding a DEF at the end of the draft: mean 10.8 of 12

round  QB   RB   WR   TE   K   DEF   (500 sims x 11 opponents)
   13  519 1366 1426  640  885  664
   14  602 1497 1392  652  837  520
   15  596 1742 1378  564  781  439
```

**Consequence.** The practice draft leaves about three extra kickers and one
extra defense on the board through the last two rounds, so waiting looks safer
in rehearsal than it will be on the night. It does not touch the live WAIT?
column, which is computed from ADP and not from the simulator.

**Proposed diff (not applied).** Give `roomPick` the same starting-slot urgency
the user gets, using the counts it is already handed:

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@ function roomPick
       if (c.pct != null && c.pct < 100) draw += (100 - c.pct) * 0.12;
+      // Nobody goes into week 1 without a kicker. With `rounds` and the pick
+      // number in hand, a team with an empty required slot and few picks left
+      // reaches for it the way a real room does; without this the modeled room
+      // finished the draft with 8.8 of 12 kickers.
+      if (opts.roundsLeft != null && (roster[pl.pos] || 0) > 0 &&
+          (counts[pl.pos] || 0) < (roster[pl.pos] || 0))
+        draw -= Math.max(0, 40 - 12 * opts.roundsLeft);
```

Needs `roundsLeft` threaded through both call sites. Low risk, but it changes
what the rehearsal shows, so it is a write-up.

---

## LOW

### B9 — LOW — `GAME_SD` makes the 150 and 200-yard bonuses inert; the best receiver in the league earns 0.22 bonus points a season

**Defect.** `GAME_SD = { pass: 78, rush: 34, rec: 32 }` with a symmetric normal
around the per-game mean produces bonus counts that are an order of magnitude
below a real season. Weekly yardage is right-skewed and the receiving and rushing
SDs are 30–40% low for a workhorse, so both the shape and the width understate
the right tail that the bonus is a step function on.

**Evidence.**

```
  WR (threshold 150, SD 32):
    Puka Nacua        yd 1400  perGame 77.8  gamesOver@sd32 0.22  @sd45 0.96  bonusPts 0.22
    Ja'Marr Chase     yd 1345  perGame 74.7  gamesOver@sd32 0.17  @sd45 0.84  bonusPts 0.17
  RB (threshold 150, SD 34):
    Derrick Henry     yd 1406  perGame 78.1  gamesOver@sd34 0.31  @sd48 1.18  bonusPts 0.32
    Jonathan Taylor   yd 1385  perGame 76.9  gamesOver@sd34 0.28  @sd48 1.12  bonusPts 0.29
  QB (threshold 400, SD 78):
    Dak Prescott      yd 4292  perGame 238.4 gamesOver@sd78 0.35  @sd109 1.25 bonusPts 0.36
```

Judgment as a drafter: the passing SD of 78 is about right — weekly passing yards
for a starter really do run an SD near 75–85, and 0.35 400-yard games for a
4,300-yard passer is defensible. The rushing and receiving numbers are not. A
1,400-yard receiver has two or three 150-yard games in a normal season, not 0.22;
a 1,400-yard back has two or three, not 0.31. Raising `rec` to ~45 and `rush` to
~48 puts both near 1.0, which is still conservative but no longer a rounding
error.

**Why it is LOW and not higher.** The bonus is 1 point at 150 and 2 at 200, and
the error is nearly monotone in yardage, so correcting it moves the elite by
2–3 points and everyone else by less, out of a VOR spread over 100 points. Nobody
changes a pick over it. But it means the league's headline bonus rules are, in
practice, not being scored. The separate 40+ yard *play* bonuses are modeled
properly and are worth real points (Nacua 3.6, Bowers 2.7), so the feature is not
wholly inert.

**Proposed diff (not applied).**

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@
-  var GAME_SD = { pass: 78, rush: 34, rec: 32 };
+  // Per-game standard deviations. Passing is measured; rushing and receiving
+  // were set from season-total dispersion, which is far narrower than the
+  // week-to-week spread a workhorse actually has, so the 150-yard step was
+  // never being reached: at rec 32 a 1,400-yard receiver cleared 150 in 0.22
+  // games a season against a real two or three. Weekly yardage is also
+  // right-skewed, which a symmetric normal cannot express, so these are
+  // deliberately at the top of the plausible range.
+  var GAME_SD = { pass: 78, rush: 48, rec: 45 };
```

and mirror the same three numbers in `bake-players.py`'s `GAME_SD` and in
`meta.game_sd`. Several assertions in `test-engine.js` will move; the delta is
+0.7 points on the top receiver and back and less than 0.1 on everyone outside
the top 20 at each position, and it should be explained in the commit rather
than absorbed.

### B10 — LOW — `sanitizeKnobs` accepts any key that names an `Object.prototype` member, and writes `NaN` past its own bounds

**Defect.** `var spec = KNOBS[k]` is a prototype-chain lookup, so
`KNOBS["toString"]`, `KNOBS["constructor"]`, `KNOBS["valueOf"]` and friends are
all truthy. The key is then treated as a known knob with `spec.min`/`spec.max`
undefined, the clamp produces `NaN`, and `NaN` is written into the accepted knob
set and reported as accepted.

**Reproduction.** `sanitizeKnobs({ toString: 5, needWeight: 1 })`.

**Evidence.**

```
  key "toString":            KEPT -> NaN   knobs={"toString":null}  rejected=[]
  key "valueOf":             KEPT -> NaN   rejected=[]
  key "hasOwnProperty":      KEPT -> NaN   rejected=[]
  key "constructor":         KEPT -> NaN   rejected=[]
  key "isPrototypeOf":       KEPT -> NaN   rejected=[]
  key "propertyIsEnumerable":KEPT -> NaN   rejected=[]

  {toString:5,needWeight:1} -> {"toString":null,"needWeight":1}
  String(knobs) THREW: Cannot convert object to primitive value
  merged into a strategy: {"toString":null,"needWeight":1} ; merged.toString is a number
```

The engine never reads any of these keys, so no board number moves. The damage is
that the knobs object becomes non-stringifiable and a bogus row appears in the
style-diff table claiming a knob was accepted. It requires the model to emit such
a key, which `STYLE_SYSTEM` does not ask for, hence LOW.

**Proposed diff (not applied).** One line:

```diff
--- a/ff/assets/app.js
+++ b/ff/assets/app.js
@@ -1454,1 +1454,3 @@
-    var spec = KNOBS[k];
+    // Own-property lookup only: KNOBS["toString"] finds Object.prototype.toString,
+    // which is truthy, and the clamp against its undefined bounds yields NaN.
+    var spec = Object.prototype.hasOwnProperty.call(KNOBS, k) ? KNOBS[k] : null;
```

**Everything else about the sanitizer is watertight.** Twenty-two fuzz cases —
`null`, `undefined`, strings, numbers, arrays, nested objects three deep, a
2,000-deep recursive object, strings where numbers go, negatives, `Infinity`,
`NaN`, `1e308`, hex and scientific strings, booleans, 50 unknown keys, a `why`
key carrying `<img src=x onerror=alert(1)>`, `JSON.parse`'d `__proto__`
pollution, a `valueOf` that throws, unknown positions including `__proto__` and
`constructor` inside a map, `posFloorRound` floats, `tagPenalty` at 1e6 —
produced **0 throws and 0 bounds escapes**, and `Object.prototype` was not
polluted.

### B11 — LOW — D/ST return yards are a near-constant 47–56 points and rise as the defense gets worse

**Observation, not a bug.** `dst_return_yards(tier) = 950 + 40·(tier−1)` at 20
yards a point gives 47.5 (tier 1) through 55.5 (tier 5) — about 15% of every
defense's total, applied almost uniformly, and pointing the wrong way relative to
tier.

```
  ret_yd by tier: t1=950 t2=990 t3=1030 t4=1070 t5=1110
  -> pts at 20 yd/pt: 47.5 49.5 51.5 53.5 55.5   (spread 8.0 points)
  tier inversions in the D/ST ordering: 0
```

Is 950 close enough? Yes. A team's combined kick and punt return yardage under
the current kickoff rules runs roughly 950–1,250, so the model is at the
conservative end but in range, and the tier gradient (worse defenses concede more
scores and therefore field more kickoffs) is the right sign for the wrong-looking
reason. The 8-point spread is swamped by the 101-point points-allowed spread, so
it never reorders the position — confirmed, zero tier inversions across all 27
defenses. The only real consequence is that it adds ~50 points to every D/ST's
"your points" column, which inflates the position against offense for anyone
reading raw points rather than VOR. VOR is unaffected because replacement absorbs
it.

### B12 — LOW — at round 7 the board's entire top eight is defenses

**Observation.** The moment `defFloorRound` releases at round 7, ranks 1 through
8 on the composite board are all D/ST. `depthCap("DEF") = 1` means the second one
is blocked the instant you take the first, so the state resolves in one pick, but
the card stack in between reads oddly.

```
pick 83 (round 7) board top 8:
  1. Houston Defense      DEF comp 61.1  vor 60.9  adp 97.5
  2. Seattle Defense      DEF comp 59.9  vor 59.9  adp 81.6
  3. Denver Defense       DEF comp 58.9  vor 58.9  adp 87
  4. LA Rams Defense      DEF comp 51.5  vor 51.5  adp 104.3
  5. Philadelphia Defense DEF comp 37.5  ...  8. New England Defense DEF comp 31.5
```

The composite is arithmetically right — a tier-1 unit really is worth +61 to the
lineup over DEF12 under these rules — but presenting eight of them is a UI
problem rather than a maths one, and it hands the user no information after the
first card. A one-line render change (collapse cards at a position already capped
to one, once the top one is shown) would fix it; that is workstream E's call.

---

## Checked and found sound

**`customPoints` is exact.** Rebuilt the season score by hand — a separate
implementation of `erf`, `normCdf`, `gamesOver` and every category, not a reuse
of the engine — for one player per position under `kinda_highlanders`, chosen
where the bonuses bite. Every category and every total matched to floating-point
noise:

```
Dak Prescott (QB, 4292 pass yd)  TOTAL hand 301.8897  engine 301.8897  delta 0.000e+0
Derrick Henry (RB, 1406 rush yd) TOTAL hand 250.4565  engine 250.4565  delta 0.000e+0
Puka Nacua (WR, 1400 rec yd)     TOTAL hand 317.6187  engine 317.6187  delta -5.7e-14
Brock Bowers (TE, 1077 rec yd)   TOTAL hand 257.1739  engine 257.1739  delta -5.7e-14
Seattle Defense (tier 1)         TOTAL hand 334.5600  engine 334.5600  delta 0.000e+0
Brandon Aubrey (K, rank 1)       TOTAL hand 148.4100  engine 148.4100  delta 0.000e+0
```

Every category line matched individually too, including the 4-point pass TD, the
−2 interception, both 40+ yard categories, the return-yard line and the
seven-bucket points-allowed dot product.

**`composite()` reconstructs from its own terms at every roster state tested.**
Walked term by term at an empty roster at pick 11, two RBs at pick 62 and every
starter filled at pick 131, printing `value`, `marginal`, `aware`, `vona`,
`mult`, `bias`, `ceilingAdj`, `riskAdj`, `byePenalty`, `tagPenalty`, `bonus`,
`blocked`, and recomputing `score = value + 0.5·vona + (mult−1)·|value + 0.5·vona|
+ ceilingAdj − riskAdj − byePenalty − tagPenalty + bonus − 1000·blocked`. The
identity held exactly in every case. Each term moved in the direction its comment
claims: `marginal` collapsed to 0 for a fourth back and a second quarterback,
`vona` collapsed to 0 at a 3-pick gap, `bonus` grew as rounds ran out (9.0 at
round 11, 45.0 at round 15), `blocked` fired on the floors and the caps.

**Bench weight arithmetic at the boundary.** `benchDepth = max(0, have −
lineupSpots + 1)`, `benchWeight = base · 0.55^benchDepth`:

```
  QB  lineupSpots=1 base=0.140  have0->0.1400  have1->0.0770  have2->0.0424
  RB  lineupSpots=3 base=0.420  have0..2->0.4200  have3->0.2310  have4->0.1271
  WR  lineupSpots=3 base=0.420  have0..2->0.4200  have3->0.2310  have4->0.1271
  TE  lineupSpots=2 base=0.280  have0..1->0.2800  have2->0.1540  have3->0.0847
  K   lineupSpots=1 base=0.040  have0->0.0400  have1->0.0220
  DEF lineupSpots=1 base=0.040  have0->0.0400  have1->0.0220
```

Correct on every case the brief names. The second quarterback behind the keeper
carries 7.7% of his surplus, not a starter's weight. The third running back
carries the full 0.42 — which is right, because with two RB slots and a flex he
genuinely has three doors into the lineup — and the fourth drops to 0.231. The
second tight end carries 0.28 because the flex is his second door. None of them
is anywhere near a starter's weight of 1.0, and the K/DEF backup at 0.022 is the
"you stream those" case the comment describes.

**`depthCap` cannot produce an unfillable round.** Blocking every position at once
needs QB 2 + RB 6 + WR 6 + TE 2 + K 1 + DEF 1 = **18 bodies**, and the draft is 15
rounds. Adding the round floors only makes it harder (rounds 1–6 need 16 bodies by
round 6; rounds 7–13 need 17 by round 13). The state is unreachable by
construction, and I could not construct it.

**Keeper handling is correct on every point the brief lists.**

```
pick schedule slot 11: 11,14,35,38,59,62,83,86,107,110,131,134,155,158,179
myUpcoming(1):         11,14,35,38,   62,83,86,107,110,131,134,155,158,179   <- 59 skipped
pendingKeepers at pick 1: [{"pick":59,"name":"Drake Maye","slot":11,"mine":true,"keeper":true,"pending":true}]
Drake Maye in avail at pick 1? false
roster slots at pick 1: QB:Drake Maye | RB:- | RB:- | WR:- | WR:- | TE:- | FLEX:- | K:- | DEF:-
need QB: {"have":1,"starters":1,"short":0}
after taking a second QB: best remaining QB blocked = "already have two quarterbacks"
```

He is off the board before pick 1, sits in the QB slot, counts against
`positionalNeed` (`have: 1`) and against `depthCap` (a third QB is blocked at
−1000), and the schedule skips 59. `pendingKeepers()` filters on names already in
`S.picks`, so undo cannot un-keep him: the keeper is regenerated from
`S.league.keepers` on every render and only suppressed when a real pick has
recorded that name. The schedule matches `meta.your_picks` exactly.

**VONA behaves as designed at both gap sizes.** Same available pool at pick 11,
scored twice, once with `nextPick` 14 and once with 35:

```
  next pick 14 (gap 3)                    | next pick 35 (gap 21)
   1. James Cook III   s 112.3 vona  9.5  |  James Cook III   s 133.2 vona 51.3
   2. Chase Brown      s 103.0 vona  3.3  |  Chase Brown      s 123.9 vona 45.2
   3. Brock Bowers     s  96.3 vona  0.0  |  Derrick Henry    s 112.6 vona 37.6
   4. Derrick Henry    s  93.8 vona  0.0  |  Saquon Barkley   s 111.7 vona 37.0
   5. Saquon Barkley   s  93.2 vona  0.0  |  Kenneth Walker   s 108.5 vona 34.2
  mean VONA gap3 = 0.052   gap21 = 1.752
  max  VONA gap3 = 9.507   gap21 = 51.332
  top-5 reordered? true
```

At a 3-pick gap VONA is zero for all but the two players genuinely at risk. At a
21-pick gap it reorders the top five, promoting Henry and Barkley over Bowers.
The two clamps described in the comment both hold: `vona` never exceeds `value`,
and it never goes negative.

**As a drafter, the slot-11 rhythm is right.** At pick 11 the board is patient —
pick 14 is three away, almost everyone survives, take the best player. At pick 14
it turns aggressive because 21 picks follow, and it correctly promotes the backs
who will not survive (Henry surv@35 0.79, Barkley 0.90) over the tight end who
will (Bowers 1.00). That is exactly how a good drafter plays the turn, and it is
the single best thing the engine does.

**Survival calibration against 500 seeded room simulations.** For each of the
user's picks, every player the board calls "there" (survival > 0.70 at the next
pick), measured against how often the app's own simulator actually leaves him:

```
pick  nextPick  gap  #called-there  mean predicted  mean actual   bias   [<70% actual]
  11 ->  14      3       252            0.997          0.999     +0.002    0/252
  14 ->  35     21       227            0.996          0.996     -0.001    1/227
  35 ->  38      3       224            0.997          0.999     +0.003    0/224
  38 ->  62     24       199            0.991          0.993     +0.002    0/199
  62 ->  83     21       178            0.980          0.985     +0.005    1/178
  83 ->  86      3       172            0.981          0.996     +0.015    0/172
  86 -> 107     21       146            0.977          0.986     +0.009    3/146
 107 -> 110      3       141            0.976          0.998     +0.022    0/141
 110 -> 131     21       116            0.929          0.979     +0.049    1/116
 131 -> 134      3       112            0.917          0.992     +0.075    0/112
 134 -> 155     21        42            0.821          0.973     +0.152    0/42
 155 -> 158      3        31            0.816          0.994     +0.178    0/31
```

The brief's failure condition — "if the board's 'there' list survives less than
70% of the time in its own simulator, the two are inconsistent" — **does not
fire**. At most 3 of 146 fall short at any gate. The bias is uniformly positive,
so the column is conservative: it tells you a player might be gone slightly more
often than he is, which is the safe direction. The conservatism grows late
(+15 to +18 points from round 12 on) because ADP runs to 189 in a 180-pick draft
and there is simply nobody left to take those players. Per-player errors are the
real story and are written up as B5.

**`roomPick` opponents do not draft a defense in round 2 or a kicker in round 6.**
Even without `defFloorRound` and `kFloorRound`, over 33,000 opponent picks in
rounds 1–6:

```
  rounds 1-6: DEF 25 of 33000 opponent picks (0.08%), K 2 (0.01%)
round  QB    RB    WR    TE    K   DEF
   1     2  2845  2652     1    0    0
   2    77  2603  2755    65    0    0
   6   986  1794  2073   624    2   21
   9   811  1342  1853   785   79  630
  12   531  1400  1549   563  743  714
```

Not a bug and not worth adding floors for: the ADP draw already makes it
essentially impossible, and the handful that get through (0.08%) are a realistic
amount of eccentricity. D/ST picks peak in rounds 9–12 and kickers in 12–14,
which matches the ADP the room is drawing on.

**The kicker floor holds, and does not block round 15.** `kFloorRound = rounds − 1
= 14`. Across a full 180-pick draft, a kicker was never the top of the board while
the board was scored for a round earlier than 14. The one case that looks like a
violation is not one: at pick 156 the board scores for `myNext` = 158, which is
round 14, so the kicker is legally unblocked and the header names pick 158. That
is the design, and it is correct.

```
    pick 155 r13 bestK comp -956.1 boardRank 55 blocked="no K before round 14"
    pick 158 r14 bestK comp   55.7 boardRank  1 blocked=null
```

And with the kicker deliberately never taken, at pick 179 with K as the last empty
slot:

```
  slots: ... | K:EMPTY | DEF:Houston Defense
  round 15 (pick 179) board top 5: Blake Grupe(K 48.8), Tyler Loop(K 46.8),
                                   Harrison Butker(K 45.0), Will Reichard(K 43.1)
  best K: Blake Grupe comp 48.8 bonus 45.0 blocked=null  board rank 1
```

The floor does not fire in round 15 and the urgency bonus (45.0) puts the kicker
at the top of the board with a positive number, which is the correct behaviour
and answers the brief's "board of nothing but negative numbers" worry for the
final round.

**`simulateToMyPick`'s 120-iteration guard is never the binding constraint.**

```
  gaps between my picks: 3,21,3,24,21,3,21,3,21,3,21,3,21 ; max = 24
  largest single simulate = 23 opponent picks; guard = 120
```

The 24-pick gap is 38 → 62, longer than the brief's stated 21 because
`myUpcoming` correctly skips the keeper's pick 59. Even the worst case is 23
against a guard of 120. Confirmed sound.

**`handcuffBonus` fires on team, not on the depth chart — the brief's proposed
fix is supported by the data.** 216 of 267 players carry a depth chart slot:

```
  DET RBs: Jahmyr Gibbs [depth 1 RB] adp 1.4 | Isiah Pacheco [depth 4 RB] adp 157.4
  BAL RBs: Derrick Henry [depth 1 RB] adp 15.9 | Justice Hill [depth 2 RB] adp 164
  PHI RBs: Saquon Barkley [depth 1 RB] adp 18.3 | Jaydon Blue [depth ? ?] adp 158.3 | Tank Bigsby [depth 2 RB] adp 159.4
  CIN RBs: Chase Brown [depth 1 RB] adp 13 | Samaje Perine [depth 2 RB] adp 147.6
```

`depth === 2 && depthPos === "RB"` picks out Justice Hill, Tank Bigsby and Samaje
Perine — the actual handcuffs — and correctly excludes Isiah Pacheco at depth 4,
who would collect the bonus today if you owned Gibbs. The fix needs a fallback for
the 51 players with no depth (fall back to team-only for those, or skip the bonus)
and is otherwise a two-line change in `composite`'s handcuff block plus a
`handcuffTeams` map that carries the position and depth rather than just `true`.
Recommended; not applied.

**`sanitizeKnobs` bounds enforcement** — 22 fuzz cases, 0 throws, 0 escapes, no
prototype pollution. Full table under B10.

**Tier assignment.** `assignTiers` (Fisher's exact 1-D clustering) put the top
three backs in one tier rather than three, which is the failure the comment
describes, and produced zero tier inversions in the D/ST ordering.

---

## STRATEGY

*Opinions, not defects. None of the below is a bug report.*

### S1 — The pick-14 defense thesis, pressure-tested

**The engine does not implement it, and that is the right call.** At pick 14
(round 2) the top defense is scored −939.1 and blocked with "no DEF before round
7". The 335.6 points and 60.9 VOR are visible in the columns; the recommendation
is not. So the worry that the board might tell the user to take a defense in the
second round is unfounded.

What the engine *does* say is take one in round 7, and there it is emphatic:
Houston at 61.1, ADP 97.5, board rank 1 of everything. Is that right?

The case for it. Ken's tiers pay 25 for a shutout and 20 for 1–6 against Yahoo's
10 and 7. Run through the modeled distributions that is a 101-point spread from
tier 1 to tier 5 in this league against 40 in Yahoo's default. A tier-1 unit
scores 175.9 points of points-allowed alone, more than the entire projected
output of a startable WR3. Nobody else in the room is scoring the position that
way, so the market price (ADP 81–97) is set by leagues where the defense is worth
a third as much. That is a genuine, structural, league-specific edge and it is the
best thing in this app.

The case against it, which I would want the user to hold in his head on Monday:

1. **The whole 61 rests on one hand-judged integer.** `dst_tier` is a research
   call, and the gap between adjacent tiers is 25 points of points-allowed. Get
   Houston's tier wrong by one and 61 becomes 36. There is no market check on it —
   ADP has Baltimore at 162.8 and Houston at 97.5, and the model has them 26
   points apart, which is a big disagreement to be carrying on a hand grade.
2. **Defenses are the most streamable position in fantasy football.** The
   week-to-week correlation of D/ST scoring is the weakest of any position, and a
   manager who streams the best matchup every week captures a large fraction of a
   tier-1 defense's edge for a round-14 pick. The engine's model is a season
   average and cannot see that.
3. **The boosted tiers cut both ways.** −4 for allowing 35+ is real too, and the
   tier-1 distribution still puts 5% of games in that bucket.

**My call:** take a top defense, but at the back of round 8 or in round 9, not at
83. The board's own numbers support waiting — Seattle's ADP is 81.6, Denver's 87,
the Rams' 104.3, and the modeled room takes almost no defenses before round 8
(503 of 5,500 opponent picks in round 8, 21 in round 6). There are four defenses
worth 51+ VOR, so you do not need the first one. Spending pick 83 on a WR3 and
pick 86 or 107 on Denver or the Rams captures most of the edge and costs a round
of skill-position value. The one thing I would not do is let it slip past round
10, because that is where the room starts taking them and the tier-1/tier-2 group
is only ten deep.

### S2 — `FLEX_SPLIT` 0.55/0.40/0.05 in a full-PPR one-flex league

The split sets replacement rank: RB 31, WR 29, TE 13 at the shipped weights;
RB 29, WR 30 at 0.45/0.50/0.05. Effect on VOR: every back loses 5.4 points and
every receiver gains 2.1 under the flatter split.

**Top 24 under both splits, so the user can see the sensitivity:**

```
  #  0.55/0.40 (shipped)              vor  |  0.45/0.50                       vor   move
   1 Jahmyr Gibbs (RB)              178.5  |  Jahmyr Gibbs (RB)             173.1    0
   2 Bijan Robinson (RB)            172.2  |  Bijan Robinson (RB)           166.8    0
   3 Christian McCaffrey (RB)       137.5  |  Christian McCaffrey (RB)      132.1    0
   4 Jonathan Taylor (RB)           119.3  |  Puka Nacua (WR)               119.0   +2
   5 Puka Nacua (WR)                117.0  |  Ja'Marr Chase (WR)            117.5   -1
   6 Ja'Marr Chase (WR)             115.4  |  Jonathan Taylor (RB)          113.9   -1
   7 James Cook III (RB)            107.5  |  James Cook III (RB)           102.1    0
   8 De'Von Achane (RB)             103.8  |  De'Von Achane (RB)             98.4    0
   9 Chase Brown (RB)               101.3  |  Chase Brown (RB)               95.9    0
  10 Brock Bowers (TE)               93.8  |  Brock Bowers (TE)              93.8    0
  11 Derrick Henry (RB)              93.8  |  Jaxon Smith-Njigba (WR)        90.6   +1
  12 Saquon Barkley (RB)             93.2  |  Derrick Henry (RB)             88.4   +1
  13 Kenneth Walker (RB)             90.3  |  Saquon Barkley (RB)            87.8   +2
  14 Omarion Hampton (RB)            89.1  |  Amon-Ra St. Brown (WR)         86.2   +2
  15 Jaxon Smith-Njigba (WR)         88.6  |  Kenneth Walker (RB)            84.9   -4
  16 Amon-Ra St. Brown (WR)          84.1  |  Omarion Hampton (RB)           83.7   -2
  17 Ashton Jeanty (RB)              80.0  |  CeeDee Lamb (WR)               76.2   +2
  18 Trey McBride (TE)               74.9  |  Trey McBride (TE)              74.9    0
  19 CeeDee Lamb (WR)                74.1  |  Ashton Jeanty (RB)             74.6   -2
  20 Josh Allen (QB)                 68.2  |  Josh Allen (QB)                68.2    0
  21 Nico Collins (WR)               65.7  |  Nico Collins (WR)              67.7    0
  22 Houston Defense (DEF)           60.9  |  Houston Defense (DEF)          60.9    0
  23 Seattle Defense (DEF)           59.9  |  Seattle Defense (DEF)          59.9    0
  24 Denver Defense (DEF)            58.9  |  Denver Defense (DEF)           58.9    0
```

**My view, as a drafter.** 0.55 RB is a shade RB-heavy for full PPR. In a
12-team, one-flex, full-PPR league the flex is filled by a receiver at least as
often as by a back, because PPR raises the floor of the WR3/WR4 body you would
otherwise stream. I would run 0.48/0.47/0.05, which is nearly the flat split, and
I would expect it to move Nacua and Chase above Jonathan Taylor at pick 4–6 —
which is where I would want them.

But this is a preference, not an error. The shipped weight is inside the range a
reasonable person defends, it is coherent with the rest of the app's stated 2026
read ("the market has swung back toward taking backs early"), and — importantly —
**it is not what is producing the RB-heavy rosters.** I checked: the drafted
composition is `QB 1 RB 6 WR 4 TE 2 K 1 DEF 1` under *both* splits over 100
seeded drafts. The 6-back roster comes from `depthCap("RB") = 6` and from
running backs and receivers sharing the same bench weight of 0.42, not from
`FLEX_SPLIT`. If the user wants a more receiver-shaped roster the lever is
`depthCap`, not the flex split. In full PPR I would rather end a draft with
5 RB / 5 WR than 6 / 4, and I would get there by capping RB at 5.

### S3 — Which of the nine styles I would actually run on Monday

**Balanced.** Not as a hedge — as the read.

The board at slot 11 is a running back board. Picks 11 and 14 sit in the middle
of a group of seven backs worth 89 to 108 VOR (Cook, Chase Brown, Henry, Barkley,
Walker, Hampton, Jeanty) and one tight end worth 93.8 (Bowers). Balanced takes
two of those backs at 11 and 14 in 100% of 200 seeded drafts and posts the
highest median lineup in the field at 2,164 points, tied with the three styles
that are functionally identical to it. It is also the only style that gets the
turn right: patient at 11 (VONA near zero over a 3-pick gap), aggressive at 14
(VONA 37 on Henry and Barkley over the 21-pick wait). That is the correct read of
a 12-team snake from the 11 hole and it is what I would do by hand.

What I would refuse to field:

- **Zero RB, unequivocally.** Median 2,111, the worst in the field alongside BPA,
  and the shape is TE-WR-TE-WR in 89% of drafts with the first back not arriving
  until pick 62. Taking a tight end at pick 11 to open a Zero RB draft is two
  contrarian bets stacked on each other. The style's own copy admits the 2026
  market has moved against it. In a league where six of twelve make the playoffs
  you do not need this.
- **Best player available.** Median 2,112, and 41% of drafts open RB-RB-RB-RB.
  Turning need off entirely on a board this RB-thick produces a roster you cannot
  start.

What I would consider and reject:

- **Hero RB** is broken as described in B1 — it takes Brock Bowers at 11 in 98%
  of drafts and does not have an anchor back after 14 in 62% of them, which is
  the opposite of the style. Even if it worked, its median (2,138) is 26 points
  behind Balanced on this board.
- **Elite tight end** is the most interesting of the alternatives and the one I
  would actually think about. It takes Bowers at 11 in 100% of drafts and a back
  at 14 in 87%, median 2,141. Bowers at 93.8 VOR against the TE13 replacement is
  a real weekly edge at the position with the steepest cliff, and Trey McBride at
  74.9 makes the second tier genuinely thin. I reject it only because the back
  you get at 14 after spending 11 on a tight end is the seventh-best of that
  group rather than the second, and 26 points of median is a lot to pay for
  positional advantage in a league that starts one tight end.
- **Floor first** (median 2,146, second-best) is the sleeper answer and I would
  switch to it if the ceiling and risk grades covered the board. They cover 24%
  of the top 25. Until B7's default grades exist, "Floor first" is Balanced with
  a rounding error attached to 36 players.

**The honest summary of the nine:** there are really four styles here —
Balanced (= RB-heavy = Upside = Stack), Elite TE, Hero RB (which is a TE-first
style today), and Zero RB — plus BPA and Floor first as small perturbations of
Balanced. Fixing B1 and giving Upside and Floor real grades (B7) would turn four
of them back into distinct choices; that is the highest-value strategy work in
this workstream.

### S4 — The three things I would change before Monday, in order

1. **Fix the `runMock` keeper double-count (B2).** One line, and the style
   comparison card is currently telling the user his roster has two
   quarterbacks.
2. **Derive default ceiling and risk grades for the 193 ungraded players (B7).**
   Twenty lines in the bake, no engine change, and it makes two of the nine
   styles real for the first time.
3. **Decide the `gp` question (B3) and write the answer down**, even if the
   answer is "leave it". If nothing changes, the runbook should say that D/ST
   "your points" read about 3% high in absolute terms and that the ordering is
   unaffected — because someone will notice 335 points for a defense and want to
   know.

Everything else in this report can wait until after the season.
