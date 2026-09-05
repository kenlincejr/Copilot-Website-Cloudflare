# Workstream C — Data and research fidelity

QA pass over `ff/tools/players.json` → `ff/data/players.js` (baked 2026-09-04) for
the Kinda Highlanders draft, Monday 2026-09-08. Read-only: no source file under
`ff/assets`, `ff/data`, `ff/app.html`, `ff/index.html` or `ff/assets/ff.css` was
edited, and nothing was committed. All scratch work (re-bakes, diff scripts) ran
under a temp scratchpad, not in the repo.

Baselines confirmed unchanged before starting:

```
node ff/tools/test-engine.js    -> 99 passed, 0 failed
node ff/tools/test-parser.js    -> 112 passed, 0 failed
node ff/tools/audit.js          -> AUDIT — 0 high, 0 medium, 3 low
  [LOW] adp   Dalton Kincaid residual -85
  [LOW] adp   Jordyn Tyson residual -83
  [LOW] adp   Calvin Ridley residual 75
```

---

## Findings

### C1 — HIGH — `marketAdp()` replaces the PPR mock ADP with a standard-scoring number, not a blend, and imports a measurable anti-PPR bias into survival for exactly the players the brief named

**Defect.** `assets/app.js:1032-1038` does not blend the two ADP sources the way
the surrounding comment and `draftanalysis.js`'s own docstring say it should.
Once a player has a pasted Yahoo Draft Analysis row (`p.yadp`), `marketAdp()`
returns `p.yadp - (p.ytrend||0)*0.5` as the point estimate — the standard-scoring
number, trend-adjusted — and *never* re-mixes in `p.adp` (the FFC full-PPR mock
ADP). The FFC value is dropped outright for that player, for the rest of the
session, in every place that calls `marketAdp()`: `simulateToMyPick` (line 1075)
and the room-pick path (line 1682). `assets/draftanalysis.js:9-11` is explicit
that Yahoo's number is "based on standard scoring settings... use them for
*movement*... not as a ranking" — `marketAdp()` uses it as the ranking.

**Reproduction.** Parsed the shipped fixture `tools/fixtures/yahoo-draftanalysis.txt`
(a real Yahoo Draft Analysis paste, standard scoring, top 30 players) with
`assets/draftanalysis.js`, joined each row to the same player's full-PPR `adp`
in `data/players.js` by normalized name, and computed `delta = adpAll(standard) - adp(PPR)`
per position:

```
RB n=14  mean delta(std-ppr) = -1.04
WR n=13  mean delta(std-ppr) = +3.15
QB n=1   mean delta(std-ppr) = -12.80
TE n=2   mean delta(std-ppr) = -7.95
```

Individual full-PPR-relevant WRs shift the most: Chris Olave +11.9, A.J. Brown
+7.3, Drake London +6.9, Justin Jefferson +1.7, Jaxon Smith-Njigba +1.9, Puka
Nacua +2.3. Pass-catching backs move the other way inside the RB group: De'Von
Achane +5.5 (his receiving work is worth more in PPR, so standard ADP undersells
him relative to his PPR ADP — same bias, same direction, opposite sign because
he's an RB) versus volume/TD backs like Saquon Barkley -7.1 and Kenneth Walker
-5.7, which standard scoring rates *more* aggressively than PPR does.

**Evidence.** Script and full per-player table:
`C:\Users\Ken\AppData\Local\Temp\claude\...\scratchpad\` session run, reproduced with:

```js
require("./data/players.js");
var D = globalThis.DRAFTLINE_DATA;
var DA = require("./assets/draftanalysis.js");
var res = DA.parse(fs.readFileSync("./tools/fixtures/yahoo-draftanalysis.txt","utf8"));
// join by normalized name, delta = r.adpAll - p.adp, bucket by p.pos
```
Output above (RB/WR/QB/TE means) is the pasted evidence.

**Consequence for this league.** Once the user pastes Draft Analysis pages
(the workflow the README and `draftanalysis.js` docstring both recommend, "for
where the room actually takes people"), `survival()` and `roomPick()` start
scoring exactly the WRs this league's full-PPR, 1-catch-per-point format pays
the most for (the possession/slot types: A.J. Brown, Chris Olave, Drake London,
Justin Jefferson) as if they'll survive several picks longer than the live room
will actually let them. That is precisely a case where a wrong number could
change a pick: the board would say "there" on a target the real 12-team PPR
room takes first. The SD used alongside this shifted mean is still `p.adp_sd`
(FFC's PPR-mock spread, unchanged) — so the mean moves to a standard-scoring
number while the spread stays PPR-shaped, a second, smaller mismatch on top of
the first.

**Proposed fix (not applied — this is a formula change per rules of engagement).**
Blend the two ADPs instead of replacing one with the other, e.g.:

```js
function marketAdp(p) {
  if (p.yadp != null) {
    var trended = p.yadp - (p.ytrend || 0) * 0.5;
    var blended = 0.5 * trended + 0.5 * p.adp;      // half PPR, half standard+trend
    return { adp: blended, sd: p.adp_sd, pct: p.ypct != null ? p.ypct : null, real: true };
  }
  return { adp: p.adp, sd: p.adp_sd, pct: null, real: false };
}
```
The 0.5/0.5 split is a starting point, not a derived constant — the user should
pick the weight, per rule 5 ("the user decides formula changes"). A cleaner
alternative: keep using `p.yadp` for *movement* only (the `ytrend` arrow shown
in the ADP-trend column), and drive the ranking/survival number off `p.adp`
plus a scaled nudge from the residual, rather than substituting sources
wholesale.

---

### C2 — MEDIUM — Sleeper's automated injury field is wrong, not just stale, for the one player the research explicitly flags as "HARD AVOID"

**Defect.** Josh Jacobs was placed on the Commissioner's Exempt List Aug 30
(per the hand-written research note) — he cannot practice or play while on it.
Sleeper's players feed does not carry an Exempt List status as an injury
designation at all; instead his `injury_status` field reads literally `"NA"`
with `injury_body_part: "Groin"`, which is almost certainly a stale leftover
from an older, unrelated injury. `bake-players.py`'s `load_player_meta()`
(line 159-162) copies `injury_status` verbatim whenever it is truthy, and `"NA"`
is a non-empty string, so it passes through and gets attached to the board.

**Reproduction.**
```
node -e 'require("./data/players.js");
  var j = globalThis.DRAFTLINE_DATA.players.find(p=>p.name==="Josh Jacobs");
  console.log(j.injury, j.injuryPart);'
```
**Evidence.**
```
NA Groin
```
And in `app.js:2557-2559`, any truthy `p.injury` renders a badge:
`esc(p.injury === "Questionable" ? "Q" : p.injury)` — for Jacobs this would
literally print an "NA" badge with tooltip "NA — Groin", which reads as "not
applicable" rather than "exempt/unavailable." The hand-written note ("HARD
AVOID... Placed on the Commissioner's Exempt List Aug 30") is still shown
elsewhere on the card and does carry the real information, and his `vor`-based
board rank (206th overall against an ADP of 69.3, confirmed in C3's table)
already reflects the discount correctly — so this does not currently
mis-price the pick. It does mean the automated join is actively producing a
misleading label for this one player rather than simply omitting one, which is
worth distinguishing from the more common "no note yet" gaps in C3.

**Proposed fix (not applied).** In `bake-players.py`, treat `"NA"` (and any
other Sleeper injury-status sentinel that isn't a real designation) as absent:
```python
if pl.get("injury_status") and pl["injury_status"] not in ("NA",):
    rec["injury"] = pl["injury_status"]
    ...
```
This is under 30 lines and would not change any test's asserted numbers, but
per the read-only scope of this pass it is written up rather than applied.

---

### C3 — MEDIUM — 26 of 51 injury-flagged players, including two top-6 overall picks, carry a Q/IR/PUP badge with no note and no projection discount behind it

**Defect (extends `audit.js`'s join check to injury, per the brief).** The
research board annotates only 74-84 of 267 players by hand. Cross-referencing
every player who carries a Sleeper `injury` designation against whether they
also carry a hand-written `note`, 26 of 51 do not — and every player's `proj`
uses a flat `gp: 18` regardless, so nothing in the projection itself reflects
reduced availability or role risk either. Two of the 26 sit inside the top 6
overall by board rank: Puka Nacua (board rank 5) and Ja'Marr Chase (board rank
6), both tagged "Questionable" with no accompanying context.

**Reproduction.**
```js
require("./data/players.js");
var E = require("./assets/engine.js"), P = require("./assets/presets.js");
var board = E.buildBoard(globalThis.DRAFTLINE_DATA.players, P.kinda_highlanders);
var flagged = board.players.filter(p => (p.injury && p.injury!=="NA") || p.injury==="NA");
// 51 total; 25 have p.note, 26 do not
```
**Evidence — full table, sorted by board rank** (adp = FFC full-PPR mock ADP,
boardRank = overall VOR rank in `kinda_highlanders`):

| Player | Pos | ADP | Board rank | Injury | Note? |
|---|---|---|---|---|---|
| Christian McCaffrey | RB | 6.3 | 3 | Questionable | yes |
| Puka Nacua | WR | 2.8 | 5 | Questionable | **no** |
| Ja'Marr Chase | WR | 3.8 | 6 | Questionable | **no** |
| Ashton Jeanty | RB | 20.8 | 17 | Questionable | yes |
| Jeremiyah Love | RB | 27.6 | 26 | Questionable | **no** |
| Breece Hall | RB | 32.1 | 27 | Questionable | yes |
| D'Andre Swift | RB | 43.7 | 30 | Questionable | **no** |
| Tyler Warren | TE | 66.0 | 41 | Questionable | **no** |
| Malik Nabers | WR | 26.9 | 42 | Questionable | yes |
| Sam LaPorta | TE | 109.0 | 45 | Questionable | yes |
| Zay Flowers | WR | 24.6 | 52 | Questionable | yes |
| Tee Higgins | WR | 36.1 | 56 | Questionable | **no** |
| Emeka Egbuka | WR | 35.7 | 57 | Questionable | yes |
| Mike Evans | WR | 55.6 | 61 | Questionable | yes |
| Bhayshul Tuten | RB | 54.0 | 64 | Questionable | **no** |
| TreVeyon Henderson | RB | 64.3 | 70 | Questionable | **no** |
| Tucker Kraft | TE | 102.6 | 77 | Questionable | yes |
| Luther Burden III | WR | 53.0 | 80 | Questionable | yes |
| Rome Odunze | WR | 54.6 | 83 | Questionable | yes |
| George Kittle | TE | 91.8 | 88 | Questionable | yes |
| Jonathon Brooks | RB | 92.0 | 105 | Questionable | yes |
| Kyle Monangai | RB | 109.9 | 111 | Questionable | **no** |
| Chuba Hubbard | RB | 81.8 | 126 | Questionable | yes |
| Patrick Mahomes | QB | 104.5 | 129 | Questionable | **no** |
| DK Metcalf | WR | 66.3 | 140 | Questionable | yes |
| Carnell Tate | WR | 79.7 | 154 | Questionable | **no** |
| Josh Downs | WR | 91.5 | 166 | Questionable | **no** |
| Rachaad White | RB | 119.0 | 168 | Questionable | **no** |
| Jacory Croskey-Merritt | RB | 114.0 | 169 | Questionable | **no** |
| Michael Pittman Jr. | WR | 77.1 | 170 | Questionable | **no** |
| Khalil Shakir | WR | 101.6 | 172 | Questionable | **no** |
| Wan'Dale Robinson | WR | 86.4 | 173 | Questionable | **no** |
| Jakobi Meyers | WR | 87.4 | 175 | Questionable | **no** |
| Tyrone Tracy Jr. | RB | 157.0 | 188 | Questionable | yes |
| Keaton Mitchell | RB | 158.6 | 195 | Questionable | yes |
| Terrance Ferguson | TE | 161.6 | 198 | Questionable | yes |
| Kenyon Sadiq | TE | 163.1 | 199 | Questionable | yes |
| Josh Jacobs | RB | 69.3 | 206 | NA (see C2) | yes |
| De'Zhaun Stribling | WR | 124.7 | 207 | Questionable | yes |
| Jalen McMillan | WR | 138.7 | 209 | Questionable | yes |
| Tre' Harris | WR | 174.4 | 220 | Questionable | **no** |
| Jordyn Tyson | WR | 158.0 | 223 | IR (see C5*) | yes |
| Zach Charbonnet | RB | 137.7 | 226 | PUP | yes |
| Alvin Kamara | RB | 153.2 | 233 | Questionable | **no** |
| James Conner | RB | 152.8 | 239 | IR | **no** |
| Ty Johnson | RB | 167.7 | 242 | Questionable | **no** |
| Isiah Pacheco | RB | 157.4 | 244 | IR | **no** |
| Keon Coleman | WR | 172.3 | 251 | Questionable | **no** |
| Jaylin Noel | WR | 171.0 | 253 | Questionable | **no** |
| Xavier Legette | WR | 175.7 | 261 | Questionable | **no** |
| Tank Dell | WR | 166.9 | 264 | IR | yes |

*(Jordyn Tyson's residual is discussed in C5, not a separate finding here.)*

Confirmed the gp:18-regardless-of-injury behavior directly:
```
Puka Nacua proj: {gp:18, rec:107, rec_yd:1400, rec_td:10, ...}  sleeperPPR=312.5
Ja'Marr Chase proj: {gp:18, rec:109, rec_yd:1345, rec_td:11, ...} sleeperPPR=311.1
```
Both are full, undiscounted 18-game WR1 workloads — nothing about the
"Questionable" tag reduces either projection or reads through into a note.

**Judgment for 9/8.** The board does surface these correctly as a "Q" badge
with a tooltip (`app.js:2557-2559`) and the AI brief context includes "listed
Questionable (...)" (`app.js:3785`), so this is not a silent gap — the flag is
visible. What's missing is *severity*: a "Questionable" tag issued days before
Week 1 with no note reads identically whether it's a Wednesday rest-day
non-issue or a real question about availability, and for the two players where
it matters most (Nacua at rank 5, Chase at rank 6) the user has to research it
themselves on the clock. The six IR/PUP/exempt-list players at the bottom of
the table (Conner, Pacheco, Tyson, Dell, Charbonnet, Jacobs) are all priced far
below their raw ADP by board rank (see C5's ADP-vs-board-rank table) — that part
is working as intended and is listed under "checked and sound" below.

**Proposed fix (not applied).** Not a code fix — a research-effort
recommendation: prioritize backfilling notes for the no-note players inside
the top 100 board rank first — Puka Nacua (5), Ja'Marr Chase (6), Jeremiyah
Love (26), D'Andre Swift (30), Tyler Warren (41), Tee Higgins (56), Bhayshul
Tuten (64) and TreVeyon Henderson (70) — starting with Nacua and Chase since
they land in the first two rounds at slot 11.

---

### C4 — LOW — Eleven research notes predate the 8/20 staleness threshold, and 17 more cite an undated source; the stale group includes the entire D/ST tier research and one top-30 RB

**Defect.** Per the brief's own cutoff (a source dated before 8/20 concerning
role, injury or depth chart is suspect four days before the season), two
categories of the 84 hand-written notes fail the check:

1. **Dated, but before 8/20 (11 notes):** Breece Hall's only note is sourced
   "Draft Sharks 7/29" (board rank 27 — inside the top 30) and argues an ADP
   thesis unrelated to and written before his current "Questionable/Thigh"
   injury designation (Sleeper's `news_updated` timestamp for injury data is
   2026-09-01, a month after the note). The other ten are every single D/ST
   tier note in the file — Seattle, Denver, Houston, LA Rams, Minnesota, New
   England, Philadelphia, LA Chargers, Jacksonville and Baltimore Defense —
   all sourced "Samulski/Rotoworld 8/19," which predates the typical NFL
   53-man roster cutdown (~8/26) and any post-cutdown personnel or scheme
   news. All ten sit at board ranks 22-60, i.e. inside the top 100 the brief
   asks about, and the README calls the D/ST tier model "the sharpest thing
   the engine does" (`qa-review-prompt.md` line 5) — it is also the one part
   of the board resting entirely on this one 16-day-stale source.
2. **No date at all (17 notes):** sources like "PFF WR piece," "ESPN
   sleepers," "PFF RB piece" carry no date, so freshness cannot be checked one
   way or the other. Five of these are inside the top 100 board rank: Ashton
   Jeanty (17), DeVonta Smith (48), Jalen Hurts (67), Jadarian Price (72), and
   Brenton Strange (108, just outside).

**Reproduction.**
```js
require("./data/players.js");
var withNotes = globalThis.DRAFTLINE_DATA.players.filter(p => p.note);
console.log(withNotes.length); // 84
var dateRe = /\b(\d{1,2})\/(\d{1,2})\b/;
withNotes.filter(p => !dateRe.test(p.source||"")).length; // 17, undated
```
**Evidence.**
```
Breece Hall           | RB | boardRank=27 | source=Draft Sharks 7/29
Seattle Defense       | DEF | boardRank=23 | source=Samulski/Rotoworld 8/19
Denver Defense        | DEF | boardRank=24 | source=Samulski/Rotoworld 8/19
Houston Defense       | DEF | boardRank=22 | source=Samulski/Rotoworld 8/19
LA Rams Defense       | DEF | boardRank=35 | source=Samulski/Rotoworld 8/19
Minnesota Defense     | DEF | boardRank=50 | source=Samulski/Rotoworld 8/19
New England Defense   | DEF | boardRank=51 | source=Samulski/Rotoworld 8/19
Philadelphia Defense  | DEF | boardRank=44 | source=Samulski/Rotoworld 8/19
LA Chargers Defense   | DEF | boardRank=60 | source=Samulski/Rotoworld 8/19
Jacksonville Defense  | DEF | boardRank=54 | source=Samulski/Rotoworld 8/19
Baltimore Defense     | DEF | boardRank=46 | source=Samulski/Rotoworld 8/19
Rome Odunze           | WR | boardRank=83 | source=Draft Sharks 8/19   (1 day short of the line)

Undated, top-100: Ashton Jeanty (17), DeVonta Smith (48), Jalen Hurts (67),
Jadarian Price (72), Brenton Strange (108).
```
(Two dates, Sam LaPorta 8/21 and Chris Bell/Malik Davis 8/23, are past the line
and are not flagged.)

**Judgment.** This is not necessarily wrong — depth-chart *tier* assessments
for defenses move slower than individual player news, and a defense's PA-tier
research is closer to a season-long scouting judgment than a day-to-day injury
report. But given the brief's own framing of D/ST as the sharpest edge in the
model, and that all ten tier notes share one 16-day-old source with no
independent confirmation, it is worth a five-minute recheck before the draft:
were there any personnel moves on these ten defenses' fronts/secondaries
between 8/19 and 9/4 that would move a tier?

**Proposed fix.** Not a code change — a content task for the user: re-verify
the ten D/ST tier notes and Breece Hall's thesis against a source dated this
week, and add a date to the 17 undated sources going forward so this check is
mechanical next time.

---

### C5 — LOW — the Yahoo Draft Analysis parser fixture has no automated regression test

**Defect.** `tools/fixtures/yahoo-draftanalysis.txt` exists and `assets/
draftanalysis.js` exists, but `tools/test-parser.js` only loads and asserts
against `tools/fixtures/yahoo-settings.txt` (confirmed by reading the file: the
only `fixtures/` reference in it is `yahoo-settings.txt`, `test-parser.js:15`).
`grep -rn "draftanalysis" tools/*.js` returns nothing — no test file calls
`DRAFTLINE_YAHOO.parse()` at all. The "112 passed, 0 failed" baseline never
exercises this parser, so a future Yahoo copy-format change to the Draft
Analysis page would go undetected by `npm test`/`test-parser.js` even though
the fixture is sitting right there.

**Reproduction.**
```
node tools/test-parser.js    # 112 passed — does not touch draftanalysis.js
grep -rn "draftanalysis" tools/*.js
```
**Evidence.** Manually ran the parser against the shipped fixture to confirm it
still works today:
```js
var DA = require("./assets/draftanalysis.js");
var res = DA.parse(fs.readFileSync("./tools/fixtures/yahoo-draftanalysis.txt","utf8"));
console.log(res.rows.length, res.skipped);   // 30 0
```
All 30 rows parsed correctly (0 skipped), field-checked against three sample
rows (Jahmyr Gibbs, Puka Nacua with the `Q` flag, Christian McCaffrey with the
`Q` flag) — names, teams, positions, ranks and both ADP columns all correct.
**The parser itself is sound today; the gap is regression coverage.**

Also could not attempt the brief's "capture a fresh paste of league #257015's
settings page and draft analysis pages" — that requires signing in to the
user's private Yahoo commissioner account, which is out of scope for this
session (credential entry is off-limits regardless of framing). **Not
reproduced / not attempted; flagging for the user to do directly** rather than
guessing at what a fresh page would contain.

**Proposed fix (not applied).** Add a `test-draftanalysis.js` (or fold into
`test-parser.js`) that loads `yahoo-draftanalysis.txt`, asserts `rows.length
=== 30` and `skipped === 0`, and spot-checks 2-3 known rows by name/adp. Under
30 lines; would not change any existing assertion.

---

## Checked and sound

- **Bake reproducibility.** Re-ran `bake-players.py` from the committed
  `tools/players.json` against (a) the exact same `sleeper.json` /
  `players_nfl.json` snapshots used for the committed bake, and (b) freshly
  pulled Sleeper data (`api.sleeper.app/v1/players/nfl` and
  `api.sleeper.com/projections/nfl/2026`, pulled live during this session).
  Computed `customPoints()` under `kinda_highlanders` for all 267 players in
  both re-bakes against the committed `data/players.js`. **Max |delta| = 0.0
  in both cases** — the same-snapshot bake is byte-for-byte reproducible, and
  the ~5-hour-fresher live pull moved zero players by any amount in projected
  points (one incidental field change: Travis Hunter's depth-chart slot
  disappeared between pulls, which does not feed `customPoints`). No player
  anywhere near the >5-point threshold the brief asks about.
- **`adp_sd` is real per-player FFC data, not a default.** Mean SD rises
  monotonically with ADP position (2.22 for picks 1-24, 4.71 for 25-48, 8.12
  for 49-72, ... 19.59 for 151-190) — the shape a real per-player mock-draft
  spread should have, not a flat placeholder. 177 of 267 values are unique;
  the largest cluster (value 16.0) is shared by only 5 players spanning three
  positions and ADPs from 158.8 to 170.2 with no other correlation — consistent
  with coincidental rounding in a real feed, not a hardcoded fallback. No
  group of players sharing one suspiciously round SD value was found.
- **Kincaid / Tyson / Ridley residual explanations** (the three LOW findings
  `audit.js` already flags):
  - **Dalton Kincaid (residual -84.9):** real market split, not news or a bad
    join. His hand note (Smola/Draft Sharks 8/31) documents a genuine
    efficiency-vs-usage gap (led all TEs in yards per route run and fantasy
    points per route, but only TE19 in fantasy output because of a 44.2%
    route rate). Sleeper's broader, more continuously-refreshed user base has
    bought that breakout thesis considerably harder (adp2 87.4) than FFC's
    12-team PPR mock pool has (adp 148). Depth chart (BUF, TE, depth 1)
    confirms the join is clean.
  - **Jordyn Tyson (residual -83.1):** news, per the pattern the bake script's
    own docstring calls out for Josh Jacobs. His note (FantasyPros 8/26) says
    a hamstring injury is now expected to linger "possibly as far as Week 7"
    and he is on IR. FFC's mock window (Aug 27-Sep 4) already prices that in
    (adp 158); Sleeper's ADP, which "refreshes only once or twice a month" per
    `bake-players.py`'s comment, is still carrying his pre-injury value (adp2
    105.4). Team (NO) and position (WR) both match; not a join problem.
  - **Calvin Ridley (residual +75):** real market split, verified not a bad
    join. Checked `players_nfl.json` directly — there is exactly one active
    Calvin Ridley record (id 4981, TEN, WR, depth_chart_order 3, RWR), no
    collision with the inactive Stevan Ridley or the unrelated Riley Ridley,
    and `sleeper.json` shows the same single Calvin Ridley row with
    `adp_ppr=253.2`. He is genuinely a real, documented WR3 on Tennessee's
    depth chart; FFC's smaller 12-team PPR mock pool (adp 152.5) is pricing
    that role more optimistically than Sleeper's much larger cross-section of
    drafters (adp2 253.2) — a real disagreement about how much a buried
    veteran is worth, not a data error.
- **Name/team/position join** (`audit.js` section 1, extended manually for
  this pass): 0 depth-chart-position mismatches, 0 team mismatches, across all
  267 players. Spot-checked the three ADP-residual outliers above by hand
  against the raw Sleeper feed as an independent check beyond what `audit.js`
  runs automatically — all three joins are clean.
- **`yahoo-settings.txt` fixture.** Parses cleanly against the current
  `assets/parser.js` (`test-parser.js`: 112 passed, 0 failed) and reproduces
  the exact `kinda_highlanders` rule set byte-for-byte when hand-diffed
  against `assets/presets.js` (25 yd/pt passing with 400/500 bonuses, 4pt pass
  TD, -2 INT, 10 yd/pt rushing and receiving with 150/200 bonuses, full PPR,
  20 yd/pt returns, the full boosted D/ST PA ladder, 12 teams, the exact
  QB/RB/RB/WR/WR/TE/FLEX/K/DEF/6BN/2IR roster, fractional points on).
- **Board tail depth, rounds 13-15 (ADP 145-180).** Counted positions inside
  the top 180 by ADP (55 RB, 67 WR, 16 TE, 21 QB, 12 DEF, 9 K = 180) and found
  14 RB, 25 WR and 10 TE left on the board beyond pick 180 for in-season
  streaming. Listed all 65 RB/WR/TE names that fall in the 145-180 ADP window
  by hand: the group is dominated by plausible depth-chart backups, handcuffs
  and rookie committee backs (e.g. Samaje Perine, Tyler Allgeier, Brian
  Robinson, Justice Hill at RB; Jauan Jennings, Rashod Bateman, Jalen Nailor at
  WR; Hunter Henry, Dalton Schultz, Pat Freiermuth at TE), not filler names —
  **but this is NOT REPRODUCED as a positive claim of completeness.** I have
  no reliable, independently-verifiable source for the real 2026 NFL depth
  charts to confirm no startable body is missing outright, and I did not find
  one to check against inside this session's scope. Reporting the counts and
  the visible roster plausibility, and leaving the "is anyone missing"
  question open rather than asserting soundness I can't back up.

---

## Summary

| id | severity | one-line |
|---|---|---|
| C1 | HIGH | `marketAdp()` swaps in standard-scoring ADP wholesale (not a blend) once a Yahoo Draft Analysis paste exists, measurably undervaluing full-PPR WRs (mean +3.15 picks, up to +11.9) relative to what the live PPR room will actually do |
| C2 | MEDIUM | Josh Jacobs' automated injury field reads "NA / Groin" instead of his real Exempt List status; only the hand note catches it |
| C3 | MEDIUM | 26 of 51 injury-flagged players, including top-6 picks Puka Nacua and Ja'Marr Chase, have no note and no projection discount behind their Questionable/IR/PUP badge |
| C4 | LOW | 11 research notes predate the 8/20 staleness line (all 10 D/ST tier notes plus Breece Hall) and 17 more cite an undated source; five top-100 players affected beyond the D/ST group |
| C5 | LOW | The Yahoo Draft Analysis parser has a fixture but zero automated test coverage in `test-parser.js`, though it still parses correctly today (30/30 rows) |
