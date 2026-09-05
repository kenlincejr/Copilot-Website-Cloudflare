# Workstream I — Why the board stacks a position you have already filled

Draftline QA, 2026-09-04. Scope: section I of `ff/tools/qa-review-prompt.md`, all
eight numbered tasks. **Read-only on source.** No file under `ff/assets`,
`ff/data`, `ff/app.html`, `ff/index.html`, `ff/assets/ff.css` or `ff/worker` was
edited, and nothing was committed. Every number below comes from the shipped
`engine.js` loaded standalone, or from an in-memory patched copy of it, driven by
a harness that transcribes `app.js`'s `analyze()` context, `ownerOfPick`,
`keeperAt`, `myUpcoming`, `marketAdp` and `runMock`'s room loop line for line.

**Baseline, before and after:** `node ff/tools/test-engine.js` → `99 passed, 0 failed`.
The primary proposed fix (I1) also runs `99 passed, 0 failed`. The secondary fix
(I2) moves two assertions; the delta is explained in I2 rather than absorbed.

League state throughout: `kinda_highlanders`, 12 teams, 15 rounds, slot 11,
Balanced (`knobs = {}`, so `needWeight` defaults to 1 and `aware = 1`), keeper
Drake Maye round 5 / pick 59, `byeTolerance` 3, `defFloorRound` 7,
`kFloorRound` = rounds − 1 = 14.

**Counts: 1 BLOCKER, 1 HIGH, 3 MEDIUM, 1 LOW**, plus the invariant (I7) with its
proposed guard, a note on what the draft style contributed, a drafter's read of
the pick-86 board, and a "checked and sound" section.

**The headline (task 7).** Across 200 seeded drafts from slot 11 under Balanced
with the keeper, at every one of the user's picks in rounds 5–15, the rate at
which the board's number-one ranked player sits at a position with **no open
starting slot** while a startable slot elsewhere is **empty**:

| engine | headline rate | invariant violations | median starting-lineup pts | `test-engine.js` |
|---|---|---|---|---|
| shipped | **35.3 %** (705 / 2000) | **61.2 %** (930 / 1519) | 2151 | 99 / 0 |
| + I2 alone (`lineupSpots` via `openFlexSlots`) | 34.8 % (696 / 2000) | 60.7 % | 2154 | 97 / 2 |
| + I7 guard alone (no term fix) | 35.0 % (700 / 2000) | 60.8 % | 2152 | 99 / 0 |
| **+ I1 alone (empty-slot replacement)** | **2.0 %** (40 / 2000) | **4.2 %** | **2175** | **99 / 0** |
| + I1 and the I7 guard | 0.2 % (4 / 2000) | 0.0 % | 2179 | 99 / 0 |
| + I1, I2 and the I7 guard | 0.0 % (0 / 2000) | 0.0 % | 2180 | 97 / 2 |

I2 is the hypothesis the brief leads with. It is correct arithmetic and it is
worth doing, but **on its own it moves the defect rate by half a percentage
point.** I1 is the fix. Take I1 first.

**The invariant column is the second measurement, added at the user's request**
(*"make sure we're not suggesting a backup TE in the 8th round as our suggested
choice"*), and it is stated as a hard rule in I7 below: *while the user has an
empty starting slot he is allowed to fill, no player whose marginal contribution
to the starting lineup is ≤ 0 may be ranked #1*. The shipped engine breaks it on
**61.2 %** of the picks where it applies — and in **925 of those 930 cases there
was no unblocked player on the whole board with a positive marginal**, so an
invariant guard bolted onto the shipped engine would have had nobody to promote.
That is the sharpest available proof that the value term, not a guard, is what is
wrong. See I7 for both options and the recommendation.

---

## BLOCKER

### I1 — BLOCKER — filling an empty starting slot is scored against a draft-start replacement level the pool has already fallen to, so it is worth zero and the board ranks a backup at a filled position above it

**Defect.** `composite()` measures every player against
`ctx.replacement[pos].points`, a league-wide constant computed once by
`replacementRanks()` before pick 1. By round 8 the pool at a deep position has
been drafted down *to that constant*, so `marginalVor()` for the very player who
would fill your empty starting slot returns 0.0 — while a backup at a position
you are already full at keeps a fraction of a real open-market surplus and
therefore outscores him. The board then ranks a second tight end and a second
quarterback above the only receiver who would actually enter the lineup.

**Reproduction.** `node scratch/task1.js shipped`. Rebuilds the user's two
screenshot states — pick 86 and pick 110, `kinda_highlanders`, Balanced, 12
teams, 15 rounds, slot 11, keeper Drake Maye — with the room modeled by the
shipped `roomPick` on a fixed seed (20260908) and the user's own picks forced to
the roster in the screenshots.

*Reconstruction note, stated plainly.* The roster is exactly the one in the
screenshots. The other 78 picks are a seeded model of the room, not the user's
real draft, so a handful of names differ from his board (Harold Fannin Jr. and
Tony Pollard come off the board in my room; Sam LaPorta tiers 2 rather than 1).
The *mechanism* reproduces exactly: at pick 86 the top of the board is tight ends
and quarterbacks with `marginal = 0.0` on every card, and at pick 110 the top ten
is eight tight ends and two quarterbacks with WR2 empty — which is the report.

**Evidence — pick 86, round 8, shipped engine, top 25 by composite.**

```
pick 86  round 8  myNext 86  myAfter 107
roster: QB:Drake Maye | RB:Derrick Henry | RB:Saquon Barkley | WR:Ladd McConkey | WR:EMPTY |
        TE:Sam LaPorta | FLEX:Breece Hall | K:EMPTY | DEF:Houston Defense
bench: (none)
openFlexSlots = 0
need: QB(have 1/1 short 0.00)  RB(have 3/2 short 0.00)  WR(have 1/2 short 1.00)
      TE(have 1/1 short 0.00)  K(have 0/1 short 1.00)  DEF(have 1/1 short 0.00)
replacement pts: QB 293.7(QB12)  RB 156.7(RB31)  WR 200.7(WR29)  TE 163.4(TE13)
                 K 127.8(K12)  DEF 274.7(DEF12)

#   player                   pos  pts    vor     open    marg    lineup  beyond  lSpot bDep bWt    value    vona    mult  ceil   risk   bye  tag  bonus  blk  SCORE
1   Tucker Kraft             TE   177.0  13.6    13.6    0.0     0.0     13.6    2     0    0.280  3.8      1.1     1.00  3.1    1.4    0.0  0.0  0.0    -    6.1
2   Trevor Lawrence          QB   301.4  7.7     7.7     0.0     0.0     7.7     1     1    0.077  0.6      0.5     1.00  3.1    -0.8   0.0  0.0  0.0    -    4.8
3   Jalen Hurts              QB   311.6  17.9    17.9    0.0     0.0     17.9    1     1    0.077  1.4      1.2     1.00  2.3    -0.3   0.0  0.0  0.0    -    4.7
4   Travis Kelce             TE   173.8  10.5    10.5    0.0     0.0     10.5    2     0    0.280  2.9      0.2     1.00  2.5    1.5    0.0  0.0  0.0    -    4.0
5   Caleb Williams           QB   299.2  5.5     5.5     0.0     0.0     5.5     1     1    0.077  0.4      0.3     1.00  1.7    0.8    0.0  0.0  0.0    -    1.4
6   Dalton Kincaid           TE   166.0  2.6     2.6     0.0     0.0     2.6     2     0    0.280  0.7      0.0     1.00  2.3    1.7    0.0  0.0  0.0    -    1.4
7   J.K. Dobbins             RB   162.1  5.4     5.4     0.0     0.0     5.4     3     1    0.231  1.2      1.2     1.00  0.8    1.4    0.0  0.0  0.0    -    1.3
8   Jordan Mason             RB   155.6  -1.0    -1.0    0.0     0.0     -1.0    3     1    0.231  -1.0     0.0     1.00  2.3    0.0    0.0  0.0  0.0    -    1.3
9   Mark Andrews             TE   164.9  1.6     1.6     0.0     0.0     1.6     2     0    0.280  0.4      0.0     1.00  1.4    0.7    0.0  0.0  0.0    -    1.2
10  Justin Herbert           QB   295.4  1.8     1.8     0.0     0.0     1.8     1     1    0.077  0.1      0.0     1.00  1.4    0.5    0.0  0.0  0.0    -    1.0
11  Bo Nix                   QB   293.6  -0.1    -0.1    0.0     0.0     -0.1    1     1    0.077  -0.1     0.0     1.00  0.3    -0.3   0.0  0.0  0.0    -    0.5
12  George Kittle            TE   171.9  8.5     8.5     0.0     0.0     8.5     2     0    0.280  2.4      0.0     1.00  1.2    3.7    0.0  0.0  0.0    -    -0.1
13  Jayden Reed              WR   200.7  0.0     0.0     0.0     0.0     0.0     3     0    0.420  0.0      0.0     1.00  1.2    1.4    0.0  0.0  0.0    -    -0.1
14  Jake Ferguson            TE   162.0  -1.4    -1.4    0.0     0.0     -1.4    2     0    0.280  -1.4     0.0     1.00  1.6    0.7    0.0  0.0  0.0    -    -0.5
15  Jaxson Dart              QB   293.7  0.0     0.0     0.0     0.0     0.0     1     1    0.077  0.0      0.0     1.00  0.8    1.4    0.0  0.0  0.0    -    -0.6
16  Brock Purdy              QB   300.5  6.8     6.8     0.0     0.0     6.8     1     1    0.077  0.5      0.4     1.00  -0.6   0.8    0.0  0.0  0.0    -    -0.7
17  Kyle Monangai            RB   156.5  -0.2    -0.2    0.0     0.0     -0.2    3     1    0.231  -0.2     0.0     1.00  1.9    2.7    0.0  0.0  0.0    -    -1.0
18  Brenton Strange          TE   163.4  0.0     0.0     0.0     0.0     0.0     2     0    0.280  0.0      0.0     1.00  0.0    1.4    0.0  0.0  0.0    -    -1.4
19  Isaiah Likely            TE   159.6  -3.8    -3.8    0.0     0.0     -3.8    2     0    0.280  -3.8     0.0     1.00  2.0    0.8    0.0  0.0  0.0    -    -2.6
20  Rico Dowdle              RB   162.9  6.2     6.2     0.0     0.0     6.2     3     1    0.231  1.4      1.4     1.00  -3.1   3.7    0.0  0.0  0.0    -    -4.7
21  T.J. Hockenson           TE   157.1  -6.2    -6.2    0.0     0.0     -6.2    2     0    0.280  -6.2     0.0     1.00  1.9    0.8    0.0  0.0  0.0    -    -5.2
22  Brian Thomas Jr.         WR   198.6  -2.1    -2.1    -2.1    -2.1    0.0     3     0    0.420  -2.1     0.0     1.00  0.3    4.2    0.0  0.0  0.0    -    -6.0
23  Hunter Henry             TE   155.8  -7.6    -7.6    0.0     0.0     -7.6    2     0    0.280  -7.6     0.0     1.00  1.6    0.7    0.0  0.0  0.0    -    -6.7
24  Kenny Gainwell           RB   153.8  -2.9    -2.9    0.0     0.0     -2.9    3     1    0.231  -2.9     0.0     1.00  -2.3   1.7    0.0  0.0  0.0    -    -6.9
25  MarShawn Lloyd           RB   150.9  -5.8    -5.8    0.0     0.0     -5.8    3     1    0.231  -5.8     0.0     1.00  0.2    1.5    0.0  0.0  0.0    -    -7.2
```

**Point at the terms.** Read row 1 against row 13.

- Tucker Kraft, TE: `marg = 0.0` — he cannot enter a lineup that already starts
  Sam LaPorta with the flex full. But `open = pts − replPts = 177.0 − 163.4 =
  13.6`, and `benchWeight` keeps 0.280 of it: `value = 3.8`. Score 6.1, board #1.
- Jayden Reed, WR: the WR2 slot is **empty**. He would start on Sunday. And
  `open = 200.7 − 200.7 = 0.0`, because **Jayden Reed is himself WR29 — he *is*
  the replacement player.** `marg = 0.0`, `value = 0.0`, score −0.1, board #13.

That is the whole defect in two rows. The arithmetic is not "a second tight end
is worth too much"; it is that **filling a hole is worth nothing**, because the
static replacement rank has been reached by the pool. The board's own card says
so out loud (app.js:2832 renders `d.marginal` as "to your lineup", which is where
the user's screenshot reads "0 to your lineup"), and the reason strings agree:

```
  #1 Tucker Kraft (TE) score 6.1  marginal 0.0
       - can't crack your starting lineup — depth only
       - best bench TE left — 14 over a free one if you ever need him
  best WR: Jayden Reed board rank 13  score -0.1
       reasons: ["can't crack your starting lineup — depth only"]
```

Reed's *only* reason string is "can't crack your starting lineup" while the WR2
slot is empty. (That is workstream B's B6 — see "Where I agree and disagree with
B" below.)

**Quantified against `expectedBestAvailable()`** — the brief's task-4 question.
At pick 86 the user's next pick is 107. `expectedBestAvailable(avail, 107).WR` is
**173.4** points, against a static WR replacement of 200.7:

```
WR replacement = Jayden Reed (WR29) 200.7 pts
expectedBestAvailable WR at my next pick (107) = 173.4 pts
  contenders: Jayden Reed p=0.04, Brian Thomas Jr. p=0.00, Carnell Tate p=0.00,
              Chris Godwin Jr. p=0.00, Jordan Addison p=0.12, Michael Pittman Jr. p=0.00

name                     pts     surv@107  marg(vs WR29)  marg(vs EBA@107)  delta
Jayden Reed              200.7      0.04            0.0              27.2    27.2
Brian Thomas Jr.         198.6      0.00           -2.1              25.1    27.2
Carnell Tate             180.0      0.00          -20.7               6.6    27.2
Chris Godwin Jr.         176.1      0.00          -24.5               2.7    27.2
Jordan Addison           174.4      0.13          -26.3               0.9    27.2
Michael Pittman Jr.      173.4      0.00          -27.3              -0.1    27.2
```

Filling WR2 now rather than at pick 107 is worth **27.2 points**, or 1.6 points a
week over the season — and the shipped board prices it at **zero**. Reed is 4 %
to survive to 107. The correction is a uniform +27.2 to every receiver, so it
does not reorder within the position; it lifts the position onto the board, which
is exactly what is missing.

Note that the same arithmetic is *already right* for a position whose pool has
not fallen to its replacement rank: the best kicker at pick 86 scores
`marg = 20.7` against K12, and the best defense at pick 83 scores 61.4. It fails
only where the pool has been drafted down to the constant, which in this league
is receiver from round 7 on and running back from round 8 on.

**Whole-draft rate (task 7).**

```
VARIANT shipped   drafts 200   user picks scored 2000
  strict (the empty slot is one you are allowed to fill this round): 705 / 2000 = 35.3%
  loose  (counting the floor-blocked K/DEF holes too):               986 / 2000 = 49.3%

round  picks  bad   rate    top-1 position mix
    6    200   13    6.5%   WR 86%  TE 12%  RB 3%
    7    200    0    0.0%   DEF 100%
    8    200  200  100.0%   TE 93%  QB 7%  RB 1%
    9    200  197   98.5%   RB 59%  QB 37%  TE 3%  WR 2%
   10    200  186   93.0%   QB 49%  RB 44%  WR 7%
   11    200  110   55.0%   RB 60%  WR 39%  QB 1%
   12    200    0    0.0%   WR 64%  RB 37%
   13    200    0    0.0%   RB 79%  WR 22%
   14    200    0    0.0%   K 100%
   15    200    0    0.0%   WR 84%  RB 16%

position of the offending #1: RB 321 (46%)  TE 199 (28%)  QB 185 (26%)
mean marginal of the offending #1:      0.02
mean marginal of a non-offending #1:    5.08
```

Round 8 is **100 %**, rounds 9 and 10 are 98.5 % and 93 %. That is the user's
screenshots, reproduced 200 times out of 200. The "strict" definition excludes
holes the engine forbids you to fill this round (K before round 14, DEF before
round 7); the "loose" figure counts them and is reported for completeness.

The rate falls to zero at round 12 not because the board improves but because the
urgency bonus finally switches on at round 11 (see I4) and the hole is filled
four rounds later than it should have been.

**Severity.** BLOCKER. The brief's own bar: "`BLOCKER` if it survives to a pick
the user would actually make". It does — in every simulated draft, at the pick
the user made in the practice run. It is the number the app exists to produce.

**Proposed diff (NOT applied).** `ff/assets/engine.js`, in `composite()`, at
line 558 as the file stands at commit `089106f`:

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@ -555,6 +555,24 @@ function composite(player, ctx) {
     var reasons = [];
     var replPts = ((ctx.replacement && ctx.replacement[player.pos]) || {}).points || 0;
+    // Filling an empty starting slot is not the same decision as adding another
+    // body, and one replacement number cannot tell them apart. The rank
+    // replacementRanks() derives is a draft-start constant: by round 8 a deep
+    // position has been picked down to it, so `marginal` for the very player who
+    // would fill your empty slot comes out at zero — at pick 86 the WR2 slot was
+    // empty and the best receiver left WAS WR29, so filling it scored 0.0 while a
+    // second tight end kept 28% of a real surplus and took the top of the board.
+    // Against an empty slot the honest baseline is the body the model expects to
+    // be there at your next pick, which expectedBestAvailable already computes.
+    // Taking the lower of the two keeps it a strict correction: early, when the
+    // pool is still well above the replacement rank, nothing moves at all.
+    var slotBaseline = false;
+    var slotEmpty = (ctx.rules.roster[player.pos] || 0) > (need.have || 0);
+    if (slotEmpty && ctx.vona && ctx.vona[player.pos] &&
+        ctx.vona[player.pos].expected < replPts) {
+      replPts = ctx.vona[player.pos].expected;
+      slotBaseline = true;
+    }
@@ -604,7 +622,11 @@ function composite(player, ctx) {
     var vona = 0;
-    if (ctx.vona && ctx.vona[player.pos]) {
+    // With the empty-slot baseline in play, `value` is already measured against
+    // what you would get at your next pick, so VONA here would be a second copy
+    // of the same difference — the double count the two clamps below exist to
+    // prevent. Reed at pick 86 scored 27.2 of value and 27.2 of VONA before this.
+    if (!slotBaseline && ctx.vona && ctx.vona[player.pos]) {
```

and one matching reason-string correction, because the existing string names the
static replacement rank and the number is no longer measured against it:

```diff
@@ -749,9 +771,11 @@
     if (value > 0.5 && ctx.replacement[player.pos]) {
       reasons.push(marginal > 0.5
-        ? "+" + Math.round(value) + " to your lineup over a free " + player.pos +
-          " (" + player.pos + String(ctx.replacement[player.pos].rank) + ")"
+        ? "+" + Math.round(value) + " to your lineup over " + (slotBaseline
+            ? "what's likely left at pick " + ctx.nextPick
+            : "a free " + player.pos + " (" + player.pos +
+              String(ctx.replacement[player.pos].rank) + ")")
         : "best bench " + player.pos + " left — " + Math.round(player.vor) +
           " over a free one if you ever need him");
     }
```

**Result after the fix.** `node scratch/task1.js C2`, same two states:

```
================ PICK 86 (round 8) — WITH I1 ================
#   player                   pos  pts    vor     open    marg    lineup  beyond  lSpot bDep bWt    value    vona    mult  ceil   risk   bye  tag  bonus  blk  SCORE
1   Jayden Reed              WR   200.7  0.0     0.0     0.0     0.0     0.0     3     0    0.420  27.2     0.0     1.00  1.2    1.4    0.0  0.0  0.0    -    27.1
2   Brian Thomas Jr.         WR   198.6  -2.1    -2.1    -2.1    -2.1    0.0     3     0    0.420  25.1     0.0     1.00  0.3    4.2    0.0  0.0  0.0    -    21.2
3   Carnell Tate             WR   180.0  -20.7   -20.7   -20.7   -20.7   0.0     3     0    0.420  6.6      0.0     1.00  0.6    0.5    0.0  0.0  0.0    -    6.7
4   Tucker Kraft             TE   177.0  13.6    13.6    0.0     0.0     13.6    2     0    0.280  3.8      1.1     1.00  3.1    1.4    0.0  0.0  0.0    -    6.1
5   Trevor Lawrence          QB   301.4  7.7     7.7     0.0     0.0     7.7     1     1    0.077  0.6      0.5     1.00  3.1    -0.8   0.0  0.0  0.0    -    4.8
6   Jalen Hurts              QB   311.6  17.9    17.9    0.0     0.0     17.9    1     1    0.077  1.4      1.2     1.00  2.3    -0.3   0.0  0.0  0.0    -    4.7
7   Travis Kelce             TE   173.8  10.5    10.5    0.0     0.0     10.5    2     0    0.280  2.9      0.2     1.00  2.5    1.5    0.0  0.0  0.0    -    4.0
8   Chris Godwin Jr.         WR   176.1  -24.5   -24.5   -24.5   -24.5   0.0     3     0    0.420  2.7      0.0     1.00  -0.2   1.0    0.0  0.0  0.0    -    1.5
9   Caleb Williams           QB   299.2  5.5     5.5     0.0     0.0     5.5     1     1    0.077  0.4      0.3     1.00  1.7    0.8    0.0  0.0  0.0    -    1.4
10  Dalton Kincaid           TE   166.0  2.6     2.6     0.0     0.0     2.6     2     0    0.280  0.7      0.0     1.00  2.3    1.7    0.0  0.0  0.0    -    1.4
11  J.K. Dobbins             RB   162.1  5.4     5.4     0.0     0.0     5.4     3     1    0.231  1.2      1.2     1.00  0.8    1.4    0.0  0.0  0.0    -    1.3
12  Jordan Mason             RB   155.6  -1.0    -1.0    0.0     0.0     -1.0    3     1    0.231  -1.0     0.0     1.00  2.3    0.0    0.0  0.0  0.0    -    1.3
13  Mark Andrews             TE   164.9  1.6     1.6     0.0     0.0     1.6     2     0    0.280  0.4      0.0     1.00  1.4    0.7    0.0  0.0  0.0    -    1.2
14  Jordan Addison           WR   174.4  -26.3   -26.3   -26.3   -26.3   0.0     3     0    0.420  0.9      0.0     1.00  0.5    0.8    0.0  0.0  0.0    -    1.0
15  Justin Herbert           QB   295.4  1.8     1.8     0.0     0.0     1.8     1     1    0.077  0.1      0.0     1.00  1.4    0.5    0.0  0.0  0.0    -    1.0
16  Bo Nix                   QB   293.6  -0.1    -0.1    0.0     0.0     -0.1    1     1    0.077  -0.1     0.0     1.00  0.3    -0.3   0.0  0.0  0.0    -    0.5
17  George Kittle            TE   171.9  8.5     8.5     0.0     0.0     8.5     2     0    0.280  2.4      0.0     1.00  1.2    3.7    0.0  0.0  0.0    -    -0.1
18  Jake Ferguson            TE   162.0  -1.4    -1.4    0.0     0.0     -1.4    2     0    0.280  -1.4     0.0     1.00  1.6    0.7    0.0  0.0  0.0    -    -0.5
19  Jaxson Dart              QB   293.7  0.0     0.0     0.0     0.0     0.0     1     1    0.077  0.0      0.0     1.00  0.8    1.4    0.0  0.0  0.0    -    -0.6
20  Brock Purdy              QB   300.5  6.8     6.8     0.0     0.0     6.8     1     1    0.077  0.5      0.4     1.00  -0.6   0.8    0.0  0.0  0.0    -    -0.7
21  Kyle Monangai            RB   156.5  -0.2    -0.2    0.0     0.0     -0.2    3     1    0.231  -0.2     0.0     1.00  1.9    2.7    0.0  0.0  0.0    -    -1.0
22  Brenton Strange          TE   163.4  0.0     0.0     0.0     0.0     0.0     2     0    0.280  0.0      0.0     1.00  0.0    1.4    0.0  0.0  0.0    -    -1.4
23  Matthew Golden           WR   172.7  -28.0   -28.0   -28.0   -28.0   0.0     3     0    0.420  -0.8     0.0     1.00  0.0    1.7    0.0  0.0  0.0    -    -2.5
24  Isaiah Likely            TE   159.6  -3.8    -3.8    0.0     0.0     -3.8    2     0    0.280  -3.8     0.0     1.00  2.0    0.8    0.0  0.0  0.0    -    -2.6
25  Makai Lemon              WR   171.1  -29.5   -29.5   -29.5   -29.5   0.0     3     0    0.420  -2.3     0.0     1.00  2.0    2.5    0.0  0.0  0.0    -    -2.8
```

*(The `open`, `marg`, `lineup` and `beyond` columns in this table are printed by
the harness against the static replacement so the two tables line up column for
column; `value` and `SCORE` are the engine's own, computed against the empty-slot
baseline. The +27.2 lives in `value`.)*

Reason strings after the fix:

```
  #1 Jayden Reed (WR) score 27.1  marginal 27.2
       - fills an empty WR slot
       - +27 to your lineup over a free WR (WR29)      <- corrected by the third hunk above
  #2 Brian Thomas Jr. (WR) score 21.2  marginal 25.1
       - fills an empty WR slot
  #4 Tucker Kraft (TE) score 6.1  marginal 0.0
       - can't crack your starting lineup — depth only
```

**Result at pick 110 (round 10) — WITH I1.** Shipped, the top ten was eight tight
ends and two quarterbacks with Kyler Murray at #11 and Kincaid at #2, which is
the user's second screenshot. After:

```
#   player                   pos  pts    vor     marg    value    vona   ceil  risk  SCORE
1   Josh Downs               WR   174.8  -25.9   -25.9   16.3     0.0    -1.6  0.0   14.7
2   Makai Lemon              WR   171.1  -29.5   -29.5   12.6     0.0     2.6  2.0   13.2
3   Matthew Golden           WR   172.7  -28.0   -28.0   14.2     0.0     0.0  1.3   12.8
4   Khalil Shakir            WR   173.1  -27.5   -27.5   14.6     0.0    -2.0  1.3   11.3
5   Tucker Kraft             TE   177.0   13.6     0.0    3.8      3.0     4.0  1.1    8.2
6   Jalen Coker              WR   168.4  -32.2   -32.2    9.9     0.0    -1.2  0.7    8.1
7   Quentin Johnston         WR   166.4  -34.2   -34.2    7.9     0.0    -0.2  0.9    6.8
8   Xavier Worthy            WR   164.0  -36.7   -36.7    5.4     0.0     2.4  1.1    6.8
9   Romeo Doubs              WR   163.7  -37.0   -37.0    5.2     0.0     0.4  -0.3   5.8
10  Dalton Kincaid           TE   166.0    2.6     0.0    0.7      0.0     3.0  1.3    2.4
11  Jordan Mason             RB   155.6   -1.0     0.0   -1.0      0.0     3.0  0.0    1.9
12  Mark Andrews             TE   164.9    1.6     0.0    0.4      0.0     1.8  0.5    1.7
```

Before: eight tight ends in the top ten. After: eight receivers, with the empty
WR2 slot being filled and Kraft, the best bench tight end, sitting fifth where he
belongs.

**Regression safety.**

```
node ffcopy/tools/test-engine.js   (engine.js + I1)   ->  99 passed, 0 failed
```

And the fix is inert where it should be. `min()` means it can only ever *lower*
the baseline, and early in a draft the pool is far above the replacement rank:

```
=== I1 must not move the early board (every slot empty, deep pool) ===
  pick  11  top-10 identical: true   max |score delta| over top 40: 0.000   #1 De'Von Achane
  pick  14  top-10 identical: true   max |score delta| over top 40: 0.000   #1 Chase Brown
  pick  35  top-10 identical: true   max |score delta| over top 40: 0.000   #1 Trey McBride
  pick  62  top-10 identical: true   max |score delta| over top 40: 4.292   #1 Tyler Warren

=== DEF at pick 83 (round 7, DEF slot empty, floor just released) ===
  shipped  top 5: Houston(61.4), Seattle(60.0), Denver(59.0), Philadelphia(37.5), Baltimore(34.5)
  I1       top 5: Houston(61.4), Seattle(60.0), Denver(59.0), Philadelphia(37.5), Baltimore(34.5)
```

Rounds 1–4 — the user's "no brainer" — do not move by a thousandth of a point.
The pick-14 defense thesis and the round-7 defense call are untouched. And the
roster it produces is better, not merely different, over the same 200 seeded
drafts: median starting-lineup points **2151 → 2175**, p25 2135 → 2164, and
200 / 200 drafts still finish with every starting slot filled.

---

## HIGH

### I2 — HIGH — `composite()`'s `lineupSpots` counts a flex slot that is already occupied, so a second tight end is priced with no depth discount at all

**Defect.** This is the brief's lead hypothesis and it is **confirmed as
arithmetic**. `positionalNeed()` was deliberately fixed to ask `openFlexSlots()`
how many flex slots are really empty (`engine.js:531`, and the comment above it
says why). `composite()` at line 582 still does the old arithmetic: it adds
`roster.FLEX` for every flex-eligible position unconditionally, whether or not a
running back is already sitting in the flex.

**Reproduction.** `node scratch/diag.js`, four positions × flex open / flex
filled, `benchWeight = min(0.45, 0.14 · lineupSpots) · 0.55^benchDepth`:

```
case                 have  flexOpen  lSpot(now)  bDep(now)  bWt(now)   lSpot(fix)  bDep(fix)  bWt(fix)
QB2, flex OPEN         1         1           1          1     0.077            1          1     0.077
QB2, flex FILLED       1         0           1          1     0.077            1          1     0.077
TE2, flex OPEN         1         1           2          0     0.280            2          0     0.280
TE2, flex FILLED       1         0           2          0     0.280            1          1     0.077
RB3, flex OPEN         2         1           3          0     0.420            3          0     0.420
RB3, flex FILLED       3         0           3          1     0.231            2          2     0.085
WR3, flex OPEN         2         1           3          0     0.420            3          0     0.420
WR3, flex FILLED       2         0           3          0     0.420            2          1     0.154
```

The brief's worked table is exact: on the round-8 roster, with Breece Hall in the
flex, a second tight end keeps **0.280** of his open-market surplus with **no
depth discount whatsoever** where he should keep 0.077. That is 3.6× too high,
and it switches on at the moment the flex fills. It is also 2.7× too high for a
third receiver and 2.7× for a fourth back, which the brief did not anticipate.

That is task 3's answer as well: **B checked the arithmetic against the current
`lineupSpots` and found it correct, and it is correct — with a wrong input.** The
formula is right; the door count is wrong whenever the flex is occupied.

**But it is not what put Fannin and Kraft at the top of the board.** With I2
applied alone, Kraft's score at pick 86 falls from 6.1 to 3.0 and he drops from
#1 to #3 — behind Trevor Lawrence and Jalen Hurts, two *quarterbacks* behind a
keeper. Jayden Reed is still #12 at −0.1. The whole-draft rate barely moves:

```
VARIANT A (I2 alone)   705/2000 = 35.3%  ->  696/2000 = 34.8%
  round 8: 100% (mix flips from TE 93% to QB 84%)
  round 9:  99.5%   round 10: 89.5%   round 11: 56.0%
```

The board stops stacking tight ends and starts stacking quarterbacks. That is why
I1 is the fix and I2 is a correctness cleanup that should ride behind it.

**Proposed diff (NOT applied).**

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@ -580,8 +580,15 @@
     var flexEl2 = (ctx.rules.roster.flexEligible || ["RB", "WR", "TE"]);
-    var lineupSpots = (ctx.rules.roster[player.pos] || 0) +
-      (flexEl2.indexOf(player.pos) >= 0 ? (ctx.rules.roster.FLEX || 0) : 0);
+    // The flex is only a door into the lineup while it is open. Counting it
+    // unconditionally is the same arithmetic positionalNeed() was fixed to stop
+    // doing: it let every flex-eligible position claim the one flex slot a
+    // running back was already sitting in, so with the flex full a second tight
+    // end carried benchDepth 0 and kept 0.280 of his surplus — a first body's
+    // weight at a two-slot position, 3.6x what one door earns.
+    var flexOpen2 = ctx.myPlayers ? openFlexSlots(ctx.myPlayers, ctx.rules)
+                                  : (ctx.rules.roster.FLEX || 0);
+    var lineupSpots = (ctx.rules.roster[player.pos] || 0) +
+      (flexEl2.indexOf(player.pos) >= 0
+        ? Math.min(ctx.rules.roster.FLEX || 0, flexOpen2) : 0);
```

(The first context line above is shown as it reads in the file at `089106f`:
`var flexEl2 = (ctx.rules.roster.flexEligible || ["RB", "WR", "TE"]);`.)

**Two tests move. Per rule 5, the delta, before anyone touches an assertion.**

```
  FAIL TE2 keeps the fraction his 2 doors earn (Kyle Pitts Sr.)  — got 0.1, expected ~0.28
  FAIL RB4 keeps the fraction his 3 doors earn (Jaylen Warren)   — got 0.1, expected ~0.231
  97 passed, 2 failed
```

These two assertions are at `tools/test-engine.js:418-431`. They do **not** encode
an independently derived number: `doorsFor(pos)` in the test file is a *verbatim
restatement of the shipped `lineupSpots` line*, so the test asserts the formula
against itself. It cannot catch a wrong flex count by construction. Worse, the
fixture the assertions run on is `R62` — and the test's own inline comment on the
tight-end row reads `// behind Tyler Warren, flex taken`. The test is being run in
exactly the state the fix is about, and it is pinning the wrong answer.

The correct update is to teach `doorsFor` the same thing the engine is being
taught, and to keep the assertion:

```diff
--- a/ff/tools/test-engine.js
+++ b/ff/tools/test-engine.js
-function doorsFor(pos) {
-  var r = ken.roster;
-  return (r[pos] || 0) + (r.flexEligible.indexOf(pos) >= 0 ? (r.FLEX || 0) : 0);
-}
+// Doors into the lineup: the position's own starting slots, plus the flex only
+// while the flex is still open. R62 has Barkley in the flex, so a tight end has
+// one door on that roster, not two.
+function doorsFor(pos, mine) {
+  var r = ken.roster;
+  var flexOpen = E.openFlexSlots(mine, ken);
+  return (r[pos] || 0) +
+    (r.flexEligible.indexOf(pos) >= 0 ? Math.min(r.FLEX || 0, flexOpen) : 0);
+}
```
with `doorsFor(pos, R62)` at the call site. The expected values then become 0.077
for TE2 and 0.085 for RB4, which the patched engine produces. The third case
(QB2, one door, 0.077) is unaffected either way, and the two regression
assertions immediately below it ("the second quarterback is no longer priced like
the first") still hold.

The third TE cap assertion, the "no more than two tight ends" mock-draft
assertion and the five style mocks all still pass.

**I would land I1 first, on its own, and I2 second**, so that if anything on
draft night looks wrong there is one change to reason about rather than two.

---

## MEDIUM

### I3 — MEDIUM — with an empty starting slot and a filled flex, VONA becomes a second copy of the value term once I1 is applied

**Defect (in the fix, not in the shipped code — recorded so it is not lost).**
The naive form of I1 — swap `replPts` for `expectedBestAvailable` and stop —
double counts. `vona` is computed as
`value − valueOf(ctx.vona[pos].expected, …)`; once `replPts` *is*
`ctx.vona[pos].expected`, the later body's value is exactly 0 and `vona` collapses
to a whole extra copy of `value`, entering at `VONA_WEIGHT = 0.5`.

**Evidence.** Jayden Reed at pick 86, I1 without the guard:

```
1   Jayden Reed  WR  value 27.2  vona 27.2  SCORE 40.7      <- 27.2 + 0.5 * 27.2
```

with the guard (`!slotBaseline`):

```
1   Jayden Reed  WR  value 27.2  vona  0.0  SCORE 27.1
```

40.7 is a 50 % inflation of a term that is already the right size. This is the
identical failure the comment at `engine.js:617-626` describes ("the failure that
let a quarterback outscore the whole board one pick after a quarterback was
drafted") — the clamps there cannot catch it because `Math.min(value, …)` is
satisfied when the two numbers are the same number.

The guard is the second hunk of I1's diff and it is not optional. Measured both
ways over 200 drafts: without the guard 1.3 % and median lineup 2180; with the
guard 2.0 % and median 2175. The ungrated version scores marginally better on
both metrics *because* it over-reaches for the hole — which is the wrong reason
to be right, and it is the behavior that makes a board untrustworthy in the one
state nobody tested.

### I4 — MEDIUM — the empty-slot urgency bonus is arithmetically zero for the first ten rounds of a fifteen-round draft

**Defect.** `composite()`'s urgency bonus is the only term in the whole function
that names an empty starting slot, and
`pressure = max(0, min(1, 1 − (rounds − round) / 5))` is **exactly zero** for
every round up to and including `rounds − 5`. In a 15-round league that is
rounds 1 through 10.

**Reproduction.** `node scratch/diag.js`.

```
round  rounds-round  pressure  urgency@short=1  fires?
   1..10      14..5     0.00         0.0        no
  11          4         0.20         9.0        YES
  12          3         0.40        18.0        YES
  13          2         0.60        27.0        YES
  14          1         0.80        36.0        YES
  15          0         1.00        45.0        YES
```

At pick 86 the user has `need.WR.short = 1.00` and `need.K.short = 1.00`, and the
`bonus` column is `0.0` for all 267 players. Nothing on the board says the WR2
slot is empty except a reason string that is itself wrong (I1).

**Is it a defect?** Partly. With seven rounds left and two holes there is genuine
slack, and a 45-point thumb on the scale in round 8 would be worse than the
disease. I am *not* proposing to make it fire earlier. What is a defect is that
this leaves rounds 1–10 with **no** term that distinguishes an empty starting slot
from a full one once `marginal` has been broken by I1 — the bonus is the backstop
and the backstop is off. Fixing I1 restores the distinction inside `value`, which
is where the comment at `engine.js:546-551` says need is supposed to live, so I4
needs no code change of its own once I1 lands.

It is recorded because it explains the shape of the whole-draft table: the rate
drops to 0 % at round 12 in the shipped engine not because the board gets smarter
but because `pressure` finally becomes non-zero at round 11, and the hole gets
filled four rounds and about fifty board points too late.

**If anything changes here**, the honest version scales pressure by *holes against
picks remaining* rather than by rounds alone, so that a roster with three holes
and four picks left is louder than one with one hole and four picks left. That is
a formula change and it is not needed for Monday.

### I5 — MEDIUM — the empty kicker slot is invisible from round 8 to round 13; the board says nothing about it at all

**Defect (task 8).** K was 0/1 from round 8 through round 10 in the user's draft
and never surfaced. `kFloorRound = rounds − 1 = 14` is deliberate and I agree with
it. But the board does not *say* anything about the hole in the meantime: every
card that mentions it is a blocked kicker buried at board rank 111 or worse.

**Evidence.**

```
pick 86 (round 8):
  best K: Brandon Aubrey  pts 148.4  score -978.9  board rank 134  blocked="no K before round 14"
       reasons: ["fills an empty K slot","+21 to your lineup over a free K (K12)",
                 "3.6 rounds ahead of ADP"]
  cards mentioning the empty K slot anywhere on the board: 11   (all of them blocked kickers)
pick 110 (round 10):
  best K: Brandon Aubrey  score -977.8  board rank 111  blocked="no K before round 14"
```

So the information exists — the engine even computes that Aubrey is +21 to the
lineup — and it is rendered 134 rows down a list nobody scrolls on a two-minute
clock.

**The good news, measured.** The late rounds do *not* arrive with two empty slots
and no warning. Over 200 seeded drafts under every variant tested,
**0 / 200 finished with an empty starting slot**, and the round-14 board is 100 %
kicker at the top:

```
round  top-1 position mix
   14   K 100%
   15   WR 84%  RB 16%
```

which matches B's finding that the kicker floor holds and does not block round 15.

**Proposed change (NOT applied) — UI, not engine.** No formula change. The status
strip or the roster panel should carry a single standing line while any starting
slot is empty and the position is floor-blocked, e.g. *"K still empty — the board
will offer one from round 14"*. That is workstream E's call and it is one line of
render. I flag it here because the user specifically asked, and the answer is
"the arithmetic is right, the screen is silent".

---

## LOW

### I6 — LOW — `FLEX_SPLIT`'s 0.05 tight-end share of an open flex does nothing at all

**Task 5's answer.** `positionalNeed()` gives a flex-eligible position
`flexOpen · FLEX_SPLIT[pos]` of extra `short`. For tight end that is **0.05**.

```
FLEX_SPLIT = {"RB":0.55,"WR":0.4,"TE":0.05}
  flexOpen 1  ->  RB claim 0.55   WR claim 0.40   TE claim 0.05

need.TE, roster with LaPorta and the flex still open: {"have":1,"starters":1,"short":0.05}
need.TE, roster with no tight end at all:             {"have":0,"starters":1,"short":1.05}
```

`short` is read in exactly three places: the urgency bonus (dead before round 11,
see I4), the `need.short > 0.9` reason string, and the `need.short > 0.5` branch.
A claim of 0.05 crosses none of those thresholds, ever. So the answer to "is 0.05
why a tight end is never urgent when you need one and never discouraged when you
do not" is: **no — 0.05 is doing nothing whatever, in either direction.** When the
tight-end slot is genuinely empty `short` is 1.05 and the 0.05 is noise on top of
a 1.0; when it is filled, 0.05 is below every threshold.

What actually decides a tight end in an open flex is `marginalVor`, which uses the
real `assignRoster` and does not read `FLEX_SPLIT` at all. Verified:

```
roster with NO tight end at pick 86:
  top 5: Sam LaPorta(TE 42.9), Harold Fannin Jr.(TE 20.2), Tucker Kraft(TE 15.4),
         Jalen Hurts(QB 4.7), Dalton Kincaid(TE 3.3)
same roster WITH Sam LaPorta, flex still open:
  top 5: Tucker Kraft(TE 17.3), Travis Kelce(TE 11.8), J.K. Dobbins(RB 7.5),
         George Kittle(TE 6.0), Trevor Lawrence(QB 4.8)
```

Both are right. With no tight end the board screams for one; with one rostered
and an open flex a second tight end really can start, and 17.3 is a defensible
score for a body who would enter the lineup. `FLEX_SPLIT` earns its keep in
`replacementRanks()` (it sets TE replacement at TE13) and nowhere else in this
chain. No change proposed.

---

## The invariant

### I7 — the hard rule, tested; and the guard-versus-term question answered

**The user's standard, in their words:** *"make sure we're not suggesting a backup
TE in the 8th round as our suggested choice."*

**The invariant that says it in arithmetic.** *While the user has an empty
starting slot he is allowed to fill this round, no player whose marginal
contribution to the starting lineup is ≤ 0 may be the board's #1.*

("Allowed to fill this round" excludes the K hole before round 14 and the DEF
hole before round 7, which the engine deliberately blocks. Including them would
make the invariant unsatisfiable by design rather than by defect.)

**Measured over the same 200 seeded drafts, rounds 5–15.**

```
engine     applies    violations              of which fixable      not fixable
shipped    1519/2000  930 = 61.2%             5   (0.5%)            925
I2 alone   1510/2000  916 = 60.7%             0   (0.0%)            916
guard only 1514/2000  920 = 60.8%             0   (0.0%)            920
I1 alone    854/2000   36 =  4.2%             36  (100%)              0
I1 + guard  818/2000    0 =  0.0%             -                       -
I1+I2+guard 814/2000    0 =  0.0%             -                       -

  shipped violations by round: 6:11  8:200  9:200  10:199  11:188  12:121  13:11
  I1 alone violations by round: 6:11  8:6  9:19
```

"Fixable" means: at that pick, at least one unblocked player on the board had
`marginal > 0`, so a guard would have had somebody to promote.

**Read the "not fixable" column. It is the finding.** On the shipped engine, in
**925 of 930 violations there was no unblocked player anywhere on the 267-man
board who added a single point to the starting lineup** — not even the receiver
who would walk straight into the empty WR2 slot. That is the static replacement
level swallowing the whole board, and it means **a guard alone is a no-op**:

```
VARIANT G (shipped + guard, no term fix)
  headline rate  35.3% -> 35.0%
  invariant      61.2% -> 60.8%
  median lineup  2151  -> 2152
```

Bolting the guard onto the shipped engine changes essentially nothing, because
the guard's whole mechanism is "prefer the player who helps your lineup" and the
broken value term says nobody does.

**With I1 in place the guard becomes both cheap and complete.** After I1 the
residual 4.2 % are all cases where a positive-marginal player existed and was
simply out-scored — exactly what a guard is for:

```
VARIANT C2G (I1 + guard)
  headline rate  35.3% -> 0.2%      invariant 61.2% -> 0.0%
  median lineup  2151  -> 2179      test-engine.js: 99 passed, 0 failed
VARIANT AC2G (I1 + I2 + guard)
  headline rate  35.3% -> 0.0%      invariant 61.2% -> 0.0%
  median lineup  2151  -> 2180      test-engine.js: 97 passed, 2 failed (the I2 delta)
```

**The guard, if it is taken (NOT applied).** It is deliberately *uniform* — every
zero-marginal player takes the same penalty — so when nobody left on the board can
help, it reorders nothing at all. It is a guard, not a valuation.

```diff
--- a/ff/assets/engine.js
+++ b/ff/assets/engine.js
@@ -729,6 +729,18 @@
     if (blocked) score -= 1000;
+    // While a starting slot is empty, a body that adds nothing to the lineup you
+    // can field is never the pick, however much open-market surplus he carries.
+    // This is a guard on the ranking, not a valuation: it is applied uniformly to
+    // every zero-marginal player, so on a board where nobody left can help it
+    // reorders nothing. It exists because "a backup tight end in round 8 while
+    // your WR2 is empty" is a statement about the shape of the roster that no
+    // amount of arithmetic about that tight end can be trusted to express.
+    if (ctx.myPlayers && aware > 0.5 && marginal <= 0.5) {
+      if (ctx._openStarters == null)
+        ctx._openStarters = assignRoster(ctx.myPlayers, ctx.rules).slots
+          .filter(function (s) { return !s.player; }).length;
+      if (ctx._openStarters > 0) score -= 100;
+    }
```

`aware > 0.5` keeps it off Best-player-available, which turns roster awareness off
on purpose.

**My engineering judgment, plainly.**

A guard that has to fire is a confession that the value term is still wrong
underneath, and I would not want one carrying the load. On the shipped engine that
is not even an option — the guard cannot fire usefully, because the term is *so*
wrong that no candidate exists to promote. So the ordering is not a matter of
taste:

1. **I1 is mandatory and must come first.** It is the correct term. It takes the
   invariant from 61.2 % to 4.2 % on its own, passes all 99 tests, and it is the
   only change here that adds points to the median starting lineup (+24).
2. **The guard is worth taking as well, behind it.** It closes the residual 4.2 %
   to 0.0 % for twelve lines, costs nothing on the tests, and — this is the part I
   would weigh most four days out — it makes the property the user cares about a
   *guarantee* rather than a statistical improvement. After I1 the guard fires on
   2 % of picks; it is a backstop, not a crutch.
3. **I would not ship the guard alone under any circumstances.** It looks like a
   fix, it changes the headline rate by 0.3 points, and it would leave the user
   with the same board and a false sense that the problem was addressed.

If only one change can be made before Monday: **I1.** If two: **I1 then the
guard.** If three: **I1, the guard, then I2 with its test update.**

**One caveat on the guard.** The residual 36 cases it eliminates are concentrated
at rounds 6, 8 and 9 with an open flex, where the board's #1 is a tight end whose
marginal is exactly 0.0 while a receiver at +6 sits behind him. In every one of
those the guard's answer is the answer I would give as a drafter. But the guard's
−100 is a magic number: it is safe because unblocked composite scores at these
states run from about −40 to +73, and it must be re-checked if the scoring rules
ever widen that range. A cleaner long-term form is a two-key sort (marginal-positive
first, then score) in the render layer rather than a constant in the score — but
that touches `app.js`'s sorting in five places and is a bigger change than this.

---

## Task 6 — is `depthCap` the right instrument?

**Short answer: no, and after I1 it no longer has to be.**

`depthCap("TE") = roster.TE + 1 = 2`, so a **second** tight end is never blocked —
which is precisely the state the user hit. The cap could not have saved him. The
brief's suspicion is right: a cap that is the only thing preventing a bad
recommendation is a cap that will be wrong in the one state nobody tested, and
this was that state.

Measured at a roster that already holds two tight ends, scoring the best remaining
one with the −1000 removed to see whether `value` alone keeps him down:

```
=== is depthCap('TE')=2 still the only thing stopping a third TE? ===
  shipped  best 3rd TE Dalton Kincaid  blocked="you already have 2 at TE"
           score without the cap 2.1  -> board rank 10 of 158
           board #1 is Houston Defense (DEF) at 72.9
  I1       identical
```

So at *three* tight ends the value term is already doing the work — the cap is
belt-and-braces, not load-bearing, and I would leave it. The failure was at
**two**, where there is no cap at all, and the answer there is I1 plus I2 making
the second body uncompetitive on value: after both fixes, Kraft at pick 86 scores
6.1 against Jayden Reed's 27.1 and sits fourth. That is the right instrument —
the cap never has to fire.

I would **not** tighten `depthCap("TE")` to 1. A one-TE league with a tier cliff
genuinely justifies a backup, the comment at `engine.js:778-781` says so, and
after I1 the board reaches for one only when the flex is open and he would start.

---

## What the draft style contributed to these two boards: nothing

The other half of the user's sentence is *"it's suggesting the next player based
on FACTS adjusted for the scoring in that league and how the player decides their
style."* So: how much of the ranking he is unhappy with is the style?

**None of it.** `strategies.js` has `balanced: { knobs: {} }` — the default style
applies no overrides whatsoever. In `composite()` the style reaches the score
through exactly one place, the `mult` term (`mult = 1`, plus 0.12 for a detected
run, times `earlyPosBias` or `posBias`). Read the `mult` column in either
term-by-term table above: **it is `1.00` on all 25 rows at pick 86 and all 25 rows
at pick 110**, before and after the fix. `runs` is empty at both states and
`bias` is 1 for every position. The style contributed a multiplier of one to every
number the user was looking at.

Scored under all nine styles at the pick-86 state, before and after:

```
--- pick 86, shipped engine ---
  Balanced               #1 Tucker Kraft (TE 6.1  mult 1.00)   top-10 mult range 1.00-1.00
  Zero RB                #1 Tucker Kraft (TE 7.6  mult 1.00)   top-10 mult range 1.00-1.15
  RB-heavy               #1 Tucker Kraft (TE 5.9  mult 1.00)   top-10 mult range 1.00-1.05
  Upside hunter          #1 Tucker Kraft (TE 13.2 mult 1.00)   top-10 mult range 1.00-1.00
  Elite tight end        #1 Tucker Kraft (TE 6.1  mult 1.00)   top-10 mult range 1.00-1.00
  Hero RB                #1 Tucker Kraft (TE 6.1  mult 1.00)   top-10 mult range 1.00-1.05
  Best player available  #1 Jalen Hurts  (QB 28.7 mult 1.00)   top-10 mult range 1.00-1.00

--- pick 86, with I1 ---
  Balanced               #1 Jayden Reed  (WR 27.1 mult 1.00)
  Zero RB                #1 Jayden Reed  (WR 27.7 mult 1.00)
  RB-heavy               #1 Jayden Reed  (WR 26.9 mult 1.00)
  Upside hunter          #1 Jayden Reed  (WR 30.4 mult 1.00)
  Elite tight end        #1 Jayden Reed  (WR 27.1 mult 1.00)
  Hero RB                #1 Jayden Reed  (WR 27.1 mult 1.00)
  Best player available  #1 Jalen Hurts  (QB 28.7 mult 1.00)
```

Six of the seven styles that reached round 8 recommended the *same* backup tight
end, and after the fix the same six recommend the same receiver. The positional
biases (`earlyPosBias`) only apply through round 5, so by round 8 every style
except Best-player-available and Zero RB has nothing left to say. This is B7's
finding ("four of the nine styles are functionally identical to Balanced") showing
up on the exact board the user complained about: **the style was not a factor in
the ranking he is unhappy with, and fixing the style would not have fixed it.**

**Best player available is the honest exception and is correct as it stands.** It
sets `needWeight = 0`, so `aware = 0`, `value = open` and the whole roster-aware
half of the arithmetic is deliberately switched off. It recommends Jalen Hurts
before and after, which is precisely what "best player available, ignore my
roster" means. The invariant guard in I7 is gated on `aware > 0.5` so it leaves
BPA alone.

**Does the fix change how much room a style has to move the board?** Yes, and in
the right direction. The style enters as a signed shift on
`raw = value + 0.5·vona`, so its leverage is proportional to `|raw|`. Today, at
these mid-draft states, `raw` for the player who should be #1 is **0.0** — a 15 %
Zero RB bias on zero is zero, which is why Zero RB and Balanced produce the same
#1 with a 1.5-point difference in score. After I1, `raw` for that player is 27.2,
so the same 15 % is worth 4.1 points. **The styles get their leverage back on the
back half of the draft as a side effect of I1**, which is worth knowing before
B7's other style work is attempted: some of what looks like an inert style today
is an inert *value term* underneath it.

---

## Where I agree and disagree with workstream B

**B6 — "can't crack your starting lineup" shown while that slot is empty.**
Reproduced independently, at the pick-86 state as well as B's pick-131 one:
Jayden Reed's only reason string is "can't crack your starting lineup — depth
only" while WR2 is empty. **I agree it is a defect and I agree with B's
diagnosis** that `marginal <= 0.5` is true of everyone at a position whose
replacement rank is long gone.

**I disagree with B's proposed fix as a standalone.** B's diff gates the string on
`need.short <= 0.5`, which corrects the *sentence* and leaves the *number* wrong —
the card would then read "fills an empty WR slot" over "0 to your lineup" and a
board rank of 13, which is a worse contradiction than the one it replaces. B's
severity of MEDIUM is right for a string bug and wrong for what is underneath it:
the string is a symptom of a BLOCKER. Fix I1 and B6's sentence corrects itself —
verified, the string becomes "fills an empty WR slot" with the player at #1. If I1
is not taken, B6's gate should still be applied, but it is then a plaster.

**B12 — "at round 7 the board's entire top eight is defenses."** Reproduced
exactly, and confirmed unaffected by I1 (top five at pick 83 identical to a tenth
of a point). **I agree with B that this is a render problem and not a maths one**,
and I agree with B's remedy of collapsing cards at a position already capped to
one. It is a *different* disease from I1 despite looking similar: at round 7 the
board is stacking a position whose starting slot is genuinely **empty** and whose
value is genuinely +61. That is the board being right and looking wrong. I1 is the
board being wrong.

**B's "checked and found sound" on bench-weight arithmetic.** B's table is
arithmetically correct and I reproduce it exactly. But B computed the door count
from the shipped `lineupSpots`, which is the term under test — see I2 and task 3.
Re-run with the flex correct, the second tight end's weight is 0.077 and not
0.280 whenever the flex is occupied. **This is the one place I contradict B's
"sound" list**, and it is a wrong input to a right formula rather than an error in
B's work.

**B7's default ceiling and risk grades have since landed** (commit `089106f`,
"Give every player a ceiling and a risk"), so every player in the tables above
carries a modeled grade. That is why `ceilingAdj` and `riskAdj` are non-zero on
players B would have seen at 0.0.

---

## As a drafter: what I would take at pick 86

**Roster:** QB Drake Maye (320.2) · RB Derrick Henry, Saquon Barkley · WR Ladd
McConkey, **empty** · TE Sam LaPorta (199.4) · FLEX Breece Hall · K **empty** ·
DEF Houston.

**I would take Brian Thomas Jr., with Jayden Reed as the coin-flip.**

The decision at pick 86 is not "who is the best player left", it is "WR2 is empty
and my next pick is 21 away". What is left at receiver:

```
Jayden Reed        t5  201 pts  adp 91.1  surv@107 0.04
Brian Thomas Jr.   t5  199 pts  adp 73.1  surv@107 0.00
Carnell Tate       t6  180 pts  adp 79.7  surv@107 0.00
Chris Godwin Jr.   t6  176 pts            surv@107 0.00
Jordan Addison     t6  174 pts            surv@107 0.13
```

Two tier-5 receivers and then a cliff to tier 6. Neither survives to 107 — Reed at
4 %, Thomas at 0 %. Wait, and the model says you field a 173-point body instead of
a 200-point one: **27 points, 1.6 a week, every week.** Thomas over Reed on two
grounds the composite cannot weigh well: he is thirteen picks past an ADP of 73
(the room has already passed on him twice, which at this stage of a draft is where
value lives), and he is the higher-variance body in a league where six of twelve
make the playoffs. Reed is the safer 2.1 points. I would not argue with anyone who
took Reed.

**Is any of the board's shipped top five defensible? No — not one of them.**

1. **Tucker Kraft (TE)** — you start Sam LaPorta. Kraft is a genuinely good TE2 and
   he is 1.4 rounds ahead of ADP, but he is a bench body in a one-TE league with
   the flex already full. Nothing he does reaches your lineup this season unless
   LaPorta gets hurt.
2. **Trevor Lawrence (QB)** — 301.4 behind a keeper at 320.2. He is *worse than
   what you have*, on a roster that starts one quarterback.
3. **Jalen Hurts (QB)** — 311.6, also worse than Maye. Taking him is spending pick
   86 to make your quarterback room 8.6 points *shallower* than you thought.
4. **Travis Kelce (TE)** — same argument as Kraft, three points weaker.
5. **Caleb Williams (QB)** — 299.2. Third-string arithmetic.

The user's judgment quoted in the brief — *"any drafter would question two tight
ends inside two rounds of each other in the first eight rounds, when a tier-1
tight end is already rostered"* — is correct, and understates it. Four of the five
are backups at positions he already starts, and two of them are downgrades on the
starter. The brief's own model saw this and said so: *"Nothing on this list
actually starts for you."* It was reading a broken board correctly.

---

## Checked and sound

- **`positionalNeed()` is correct** and does exactly what its comment claims. At
  pick 86 with Breece Hall in the flex, `openFlexSlots` returns 0 and every
  flex claim is 0.00. The bug is that `composite()` does not make the same call.
- **`openFlexSlots()`, `assignRoster()` and `lineupPoints()` are correct** at every
  state exercised — nine slots, greedy by points, flex fallback for eligible
  positions, leftovers to the bench. `marginalVor()`'s identity
  (`lineupPoints(mine+player) − lineupPoints(mine+replacement)`) reconstructs by
  hand at both states.
- **`composite()` reconstructs from its own returned terms** at both states:
  `score = value + 0.5·vona + (mult−1)·|value + 0.5·vona| + ceilingAdj − riskAdj −
  byePenalty − tagPenalty + bonus − 1000·blocked` held exactly for all 25 rows in
  every table above, shipped and patched.
- **The keeper is handled correctly.** Drake Maye is off the board before pick 1,
  occupies the QB slot, counts `have.QB = 1` against `positionalNeed` and
  `depthCap`, and the schedule skips pick 59 (`myUpcoming` at pick 86 returns
  `[86, 107]`, at pick 110 returns `[110, 131]`). Confirms B.
- **The `blocked` floors fire correctly** at both states: no K before round 14, no
  DEF before round 7, no third QB, no third TE, no second K or DEF.
- **`depthCap` cannot produce an unfillable round** — confirms B's construction
  argument, and empirically 0 / 200 drafts finished with an empty starting slot
  under any of the five engine variants tested.
- **The round-7 defense call is untouched by everything proposed here**: Houston
  61.4 / Seattle 60.0 / Denver 59.0 at pick 83, identical shipped and patched.
- **The early rounds are untouched.** Picks 11, 14 and 35 are identical to
  0.000 points across the top 40 with I1 applied.
- **Neither proposed fix changes the median drafted composition** (QB 2 · RB 6 ·
  WR 3 · TE 2 · K 1 · DEF 1 over 200 drafts, before and after). What changes is
  *when* the WR2 slot gets filled and therefore who fills it, which is worth
  +24 median starting-lineup points.

## Not reproduced

- **A state in which the tight-end cap is the only thing preventing a bad
  recommendation.** With two tight ends rostered, the third scores 2.1 with the
  cap lifted against a board leader of 72.9 — rank 10 of 158. I could not
  construct a state where removing `depthCap("TE")` changed the recommendation.
  Reported as "not reproduced"; the real hole is at *two* tight ends, where no cap
  exists, and that is I1/I2.
- **Harold Fannin Jr. as board #1.** In my seeded room he is drafted at pick 74
  (ADP 74.1) and is off the board at 86, so I could not put him at the top of the
  table the way the user's screenshot does. The mechanism reproduces on Tucker
  Kraft, who is the same case with 5.9 fewer points; Fannin at 182.9 would score
  roughly 3.2 points higher and sit first. Recorded as a difference between my
  modeled room and the user's practice draft, not as a failure to reproduce the
  defect.

## Harness

Throwaway, under the session scratchpad, run with `node`; nothing was added to the
repository.

```
lib.js       loads engine.js (shipped, or patched in memory), presets, data;
             transcribes ownerOfPick / keeperAt / myUpcoming / marketAdp /
             analyze()'s ctx; recomputes composite's private sub-terms
states.js    rebuilds the pick-86 and pick-110 states from the screenshots
patches.js   the candidate fixes, each with an asserted anchor so a concurrent
             edit to engine.js fails loudly instead of measuring the wrong thing
task1.js     the term-by-term top-25 tables       node task1.js shipped|A|C2|AC2
task7.js     the headline rate over 200 drafts    node task7.js shipped|A|C2 200
diag.js      urgency schedule, EBA comparison, benchDepth boundary, FLEX_SPLIT
checks.js    early-board no-change proof, DEF at 83, depthCap probe
reasons.js   reason strings and the kicker question at both states
             (node task7.js also reports the I7 invariant; variants shipped, A,
              C2, AC2, G, C2G, AC2G)
ffcopy/      a copy of assets+data+test-engine.js used only to run the 99-test
             suite against a patched engine; the real tree is never written to
```

---

## Recommendation

**Take I1. It is the single change to make first.** It is 18 lines in one
function, it passes all 99 existing tests unchanged, it does not move rounds 1–4
by a thousandth of a point, it does not touch the defense thesis, and it takes the
rate at which the board recommends a position you are full at while a starting
slot sits empty from **35.3 % to 2.0 %** — and the user's own invariant, "never a
backup tight end in round 8 while a starting slot is empty", from **61.2 % broken
to 4.2 % broken** — while adding 24 points to the median starting lineup.

Then, in this order: **the I7 guard** (twelve lines, still 99 / 0, closes the
invariant to 0.0 % and the headline rate to 0.2 %), and **I2** with the
`doorsFor` test update explained above. Do not ship the guard without I1: measured
on its own it moves the headline rate by 0.3 points and the invariant by 0.4,
because on the shipped value term there is nobody for it to promote.
