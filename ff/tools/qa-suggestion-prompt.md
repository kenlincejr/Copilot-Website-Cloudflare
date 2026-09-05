# Draftline suggestion engine — the round-by-round pressure test

You are the Lead QA test engineer for Draftline and, in the same seat, a fantasy football
strategist who has drafted from slot 11 of a 12-team full-PPR league enough times to know
what a 21-pick gap does to a plan. Your job is one question, asked at every one of the
user's fifteen picks:

> **When the app tells the user who to take, did every piece of data the app already holds
> reach that decision, with the right weight, and is the decision right?**

Not "is the number on screen plausible". Whether *this* input — the roster he already has,
the strength of the man in that slot, the bye clash, the tier cliff, the player falling past
his ADP, the injury designation, the last seven days of real drafts, what the two teams
picking before him still need, the style he chose — actually changed the score, the three
cards, and what Claude was told. An input that is displayed in a column, or sent to the model,
or held in the data file, but never moves the ranking is **not wired in**. Say so, per input,
per round, with the evidence.

**The night it has to work:** Monday 2026-09-08, 19:00 CDT. Yahoo league "Kinda Highlanders",
12 teams, 15 rounds, snake. Slot 11. Drake Maye kept in round 5 (pick 59). Full PPR, 4-pt
passing TD, -2 INT, 40+ yard bonuses, return yards 1 per 20, boosted D/ST points-allowed tiers
(25 for a shutout). Two-minute clock. The user's picks: 11, 14, 35, 38, [59 keeper], 62, 83,
86, 107, 110, 131, 134, 155, 158, 179 — seven gaps of 3 and seven gaps of 21.

Work as an engineer. Run things. Reproduce before you report. Fix what is small and clearly
broken; write up what is large or a judgment call as a diff, not applied. Report outcomes
faithfully — a failing test is reported with its output, a thing you could not verify is
reported as unverified, and "not reproduced" is a valid finding.

---

## 0. How to run this review

**Model and effort.** Run this prompt on **Claude Opus 5** at effort `xhigh` (Claude Fable 5.1
if it is available in the session). The strategy verdicts in §4 and the eval grading in §D
need that tier. Hand the mechanical sweeps — running the tracer across seeds and styles,
diffing payloads, tabulating terms — to **Sonnet 5** subagents with the exact command and the
exact table shape you want back; do not let a subagent draw a strategy conclusion. Never
downgrade the model for the verdicts to save money; this is the pass that decides draft night.

**Money.** Workstream D makes real API calls. The budget is **$15** for the whole eval, stated
up front and not to be exceeded; the design below costs about $8. Go through
`api.anthropic.com` directly with the user's key (`ant auth status`, or `ANTHROPIC_API_KEY`),
not through the deployed Worker, because the Worker pins the model and the comparison needs
four configurations. Say the call count before you make the calls. Never loop a call on a
failure.

**Time box.** Three days. A is the same day. B and C are day one and two. D is day two. E, F,
G are day three. If you are behind, G is the part that can slip to after the draft — everything
else is about the picks themselves.

**Where you write.** `ff/tools/qa-findings-S.md` for findings (S for suggestions; B through I2
and `live` already exist and are the prior art — read `qa-findings-live.md` and the I2 headings
before you start, do not re-derive them). `ff/tools/qa-findings-S-eval.md` for the model eval.
Fixes go in the code with a test that would have caught them. Proposed-not-applied diffs go in
the findings file in full.

**The tools already in the tree.** Run these first and confirm you match before touching
anything:

```
node ff/tools/test-engine.js     # 131 passed, 0 failed
node ff/tools/test-app.js        # 396 passed, 0 failed
node ff/tools/audit.js           # 0 high, 1 medium (bake freshness), 3 low
node ff/tools/trace-suggestions.js --style balanced --seed 11 --quiet
```

The last one is new and is the instrument for this review. It walks a seeded practice draft
from slot 11 with the modeled room drafting the other eleven teams, and at every one of the
user's picks — on deck two picks out, and on the clock — prints the roster as the engine sees
it, the top eight by composite with **every term of the score broken out** next to the inputs
those terms were fed, the three cards `renderRecs()` would show, the eight names the on-deck
brief may name, the best *blocked* player and what he would have scored, every player twelve
or more picks past his ADP and where the board ranks him, and writes the literal
`briefQuestion()` payload to `ff/tools/traces/<style>-seed<N>-pick<P>.txt`. `--style`,
`--seed`, `--custom '{"posBias":{"TE":1.3}}'` vary it. It reuses `test-app.js`'s sandbox
unmodified. Three traces are already there from this prompt's authoring — balanced, zero_rb,
and hero_rb with custom knobs, all seed 11 — and the facts in §2 and §4 below are read off them.

---

## 1. What you are looking at

Read `ff/README.md` first; it is current and explains the design decisions (marginal value over
replacement, Fisher tiers, VONA, the modeled room, the brief cache). Then the code in this
order:

| File | What it is |
|---|---|
| `ff/assets/engine.js` | The math. `customPoints` → `buildBoard` (VOR, tiers, `modelGrades`, `applyMarketSignals`) → `survival`, `expectedBestAvailable`, `marginalVor`, `positionalNeed` → **`composite()`**, the function this whole review is about → `roomPick`, `depthCap`, `detectRuns`. |
| `ff/assets/app.js` | `analyze()` builds the per-render context and calls `composite()` on every player. `renderRecs()` picks the three cards. `briefCandidates()`, `applyReserveRule()`, `claudeContext()`, `rosterBlock()`, `runLine()`, `teamsAheadBlock()`, `styleBlock()`, `supplyBlock()`, `scoringHighlights()`, `SYSTEM`, `briefQuestion()`, `renderBrief()`, `briefVoid()` are the AI layer. `simulateToMyPick()` and `runMock()` are the modeled room. `activeKnobs()` is the style in force. `byeRisk()` is the UI's bye logic. Search by function name — this file is edited daily and line numbers do not survive. |
| `ff/assets/strategies.js` | Nine styles as knob overrides; `DRAFTLINE_KNOB_SPEC` bounds. |
| `ff/assets/presets.js` | `kinda_highlanders`: QB1 RB2 WR2 TE1 FLEX1 K1 DEF1 BN6, `playoffWeeks: [15,16,17]`. |
| `ff/data/players.js` | 267 players, baked 2026-09-04. Per player: `adp`, `adp_sd`, `adp_rank` (FFC PPR mocks); `proj` (Sleeper/RotoWire); `depth`, `depthPos`, `injury`, `injuryPart` (Sleeper players feed); `adp2`, `adpResid` (Sleeper platform ADP, de-drifted); on 74–84: `note`, `source`, `tag`, `ceiling`, `risk`; on 27 DEF: `dst_tier`. |
| `ff/worker/src/index.js` | The proxy. Model pinned `claude-sonnet-5`, `output_config: { effort: "low" }`, `max_tokens` 2000 default / 8000 cap, system sliced to 12,000 chars. |
| `ff/tools/qa-findings-live.md` | The one live measurement so far: 92 calls, Sonnet 5, p95 4.4 s at effort low, named the board's #1 in 27–29 of 30. Read it; D extends it rather than repeating it. |

**The pipeline, in one line.** `players.js` → `buildBoard()` (points, VOR, tiers, grades) →
`analyze()` attaches Yahoo paste, re-applies market signals, calls `composite(p, ctx)` on every
player → `p.comp` ranks the board → `renderRecs()` shows the top three that survive to the next
pick at ≥15% → `briefCandidates()` hands eight to `claudeContext()` → `briefQuestion()` adds
the teams-ahead block and the answer shape → Worker → Sonnet 5 low → `renderBrief()` binds the
Draft button to the name on line 1.

**The score.** `Score = (Value + 0.5·VONA)·(1 + runs + bias − 1) + CeilingAdj − RiskAdj −
ByePenalty − TagPenalty + UrgencyBonus + StackBonus + HandcuffBonus − 1000 if blocked − 100 if
zero-marginal while a starter slot is open.` Value is marginal value over replacement against
the user's own lineup, with a bench fraction for surplus. VONA is per position, bonus-only,
clamped to `[0, value]`.

---

## 2. The wiring table — fill it in, and it is the deliverable

This is the review. For every input the app holds, say where it enters. The columns are: the
input; where it comes from; how many of 267 carry it; whether it moves **the score** (name
the term in `composite()`), whether it is shown on **the cards/board**, whether it reaches
**the payload** (name the block); and a verdict — `WIRED`, `DISPLAY-ONLY`, `PAYLOAD-ONLY`,
`SCORE-ONLY`, `INERT` (wired but too small to ever change a pick), or `ABSENT`. Where the
row is prefilled it was read off the code and the seed-11 traces during authoring; **verify
each one and correct it if the trace disagrees.** Add rows for anything you find that is
missing here.

| Input | Source | Coverage | Score term | Cards / board | Payload | Prefilled verdict |
|---|---|---|---|---|---|---|
| Projected points in league scoring | `customPoints` | 267 | `value` via `marginalVor` | pts column, card | every candidate line, roster block | WIRED |
| Roster: who is in each slot and his points | `assignRoster` | — | `marginalVor` measures against your actual lineup | roster panel | `rosterBlock` slot by slot with drop to best left | WIRED |
| Open starting slots | `startingSlots` | — | `slotBaseline`, urgency bonus, the −100 guard | roster-gap strip | "STARTING SLOTS STILL EMPTY" | WIRED |
| Bench depth at position | `positionalNeed` | — | `benchWeight` (0.55^depth) | — | — | WIRED |
| Tier and how many left in it | `assignTiers`, `tierLeft` | 267 | **none** | TIER column, card "tier N, k left" | only the *best* player per position in `supplyBlock`; **not on the candidate line** | DISPLAY-ONLY |
| Survival to next pick (per player) | `survival` (ADP normal CDF) | 267 | **none directly**; only through `expectedBestAvailable` → VONA at the *position* | WAIT? column, card | candidate line, two horizons | DISPLAY-ONLY as a per-player term — see B1 |
| ADP standard deviation | FFC | 267 | survival only | — | — | SCORE-ONLY, and only via VONA |
| Fallen past ADP (12+ picks) | `adp − currentPick` | — | **none** — a reason *string* only (the "rounds ahead of ADP" push in `composite()`) | VALUE column "fell 1.2" | `[pastADP]` note only when the survival filter would have hidden him | DISPLAY-ONLY — see B2 |
| Ceiling / risk grade | research on 74, modeled on 193 | 267 | `ceilingAdj`, `riskAdj`: `((g−70)/100)·26·w`, `w = 0.2` in rounds 1–3 | Why? modal | **not on the candidate line** | INERT in rounds 1–8 (±1 to ±4 on composites of 60–127; max 11.7 on outliers); decisive in rounds 9+ only because everything else is zero — see B3, B4 |
| 7-day real-draft movement `ytrend` | Yahoo paste, null until pasted | 0 baked | ceiling +5·t, risk −3·t → **about 1 point** of composite for a 3-pick move | 7DAY column | candidate line, "moved N picks earlier" | INERT in the score; PAYLOAD as prose — see B3 |
| Cross-market disagreement `adpResid` | Sleeper vs FFC | 205 | via ceiling/risk, same scale | SPLIT column | only if `|resid| ≥ 25` | INERT |
| Real Yahoo ADP `yadp`, `ypct` | Yahoo paste | 0 baked | room model only (`marketAdp`) | REAL column | candidate line | WIRED for the room, DISPLAY for the user's own pick |
| Injury designation | Sleeper feed, 4 days old | 51 | modeled risk only (+4 Q, +10 PUP/NA, +16 IR) → then scaled to ±1–4 | badge | candidate line "listed IR (knee)" | INERT in score; PAYLOAD-ONLY effectively — see B9 |
| Projected games `gp` | Sleeper | 267, **all 18** | `gp < 17` risk term **never fires**; IR players project a full season | — | — | INERT — see B9 |
| Injury history, age, years of experience | Sleeper feed has `age` on 826, `years_exp` on 847 — **not baked** | 0 | — | — | — | ABSENT |
| Depth chart slot | Sleeper feed | 216 | modeled risk only (±4–10 → scaled) | badge | candidate line | INERT in score; PAYLOAD |
| Research note and tag | hand layer | 84 / 74 | `tagPenalty` only under Floor first | badge, card | candidate line, in full | PAYLOAD; SCORE only in one style |
| Bye week — week overload | `byeCounts` of starters | — | `byePenalty` when starters already on that week ≥ tolerance (3) | BYE column amber/red | "STARTERS SHARING A BYE" only at ≥ tolerance; candidate line has the week | WIRED, but see B7 for the semantics |
| Bye week — position clash (no like-for-like starter that week) | `byeRisk()` in the UI | — | **none** | BYE column red "clash" | **none** | DISPLAY-ONLY — see B7 |
| Bye cover (this bench pick covers a starter's week) | — | — | none | — | none | ABSENT |
| What the teams picking before me still need | `teamsAhead()` | live mode | **none** — survival is roster-blind | — | `teamsAheadBlock`, on deck only | PAYLOAD-ONLY — see B8 |
| A positional run (4 of last 8) | `detectRuns` | — | `mult += 0.12` on the run position | banner | `runLine` | WIRED, but see B8 |
| Handcuff | `handcuffTeams` = any team where you own an RB | — | `handcuffBonus` under Hero/Zero RB only; **team match, not depth-chart match**; Balanced has none | — | none | SCORE in 2 styles, crude; PAYLOAD ABSENT — see B10 |
| Stack | your QB's team | — | `stackBonus` under Stack style only; WR/TE → QB direction only | — | none | SCORE in 1 style; PAYLOAD ABSENT |
| Draft style — preset knobs | `activeKnobs()` | — | `bias`, `earlyPosBias`, weights, floors | style chip, receipt | `styleBlock` lists the **preset's** knobs | WIRED |
| Draft style — custom / Claude-tuned knobs | `S.league.styleCustom` (a knob object) | — | `activeKnobs()` merges them → WIRED in the score | receipt | **NOT listed**; the block appends `"My own notes on it: [object Object]"` | **BROKEN in the payload** — see C1, verified in `traces/hero_rb-seed11-pick38.txt` line 34 |
| Position floors (DEF round 7, K round 14) | league settings | — | `blocked` → −1000 | roster line "locked" | roster block "cannot be taken until round 7" | WIRED — and doing a job the score should do, see B6 |
| Keeper (Maye, R5) | `pendingKeepers` | — | in `myPlayers` from pick 1 | roster | roster block | WIRED — verify QB cap and stack team from pick 1 |
| Playoff weeks 15–17, opponent by week | `playoffWeeks` parsed and stored; **no schedule data anywhere** | 0 | — | — | — | ABSENT — see G |
| Bake date / freshness | `meta.built` | — | — | start screen | **none**; `SYSTEM` says injuries "are current" | ABSENT from payload — see C4 |
| Scoring impact ("elite DEF is the #22 player on this board") | `impact.js` | — | — | impact panel | replaced by a **hard-coded** sentence "worth roughly a 7th-round pick" in `scoringHighlights()` | WRONG in payload — see C3 |

When the table is done, the summary line of your report is the count of inputs by verdict and
the list of `INERT`, `DISPLAY-ONLY`, `PAYLOAD-ONLY` and `ABSENT` rows that a strategist would
say should decide a pick. That list is the work.

---

## 3. Rules of engagement

1. **Verify, then claim.** Every finding carries a reproduction: the tracer command, the seed,
   the pick, the line of the trace or payload. A number in a finding is a number you printed.
2. **Severity is about draft night.** `BLOCKER`: a pick the app would recommend that a
   competent strategist would call wrong on the evidence the app itself holds. `HIGH`: an
   input that should decide a pick and cannot. `MEDIUM`: a payload or display defect that
   could mislead the user or the model. `LOW`: everything else.
3. **Do not fix the board by teaching the prompt to distrust it.** If `composite()` ranks a
   second tight end over a startable receiver, the fix is `composite()`. If you catch yourself
   drafting a sentence for `SYSTEM` that says "the ranking may be wrong", stop and write the
   engine finding instead. (I2 §9 records this rule; it still holds.)
4. **No engine change without a seeded before/after.** Any change to `composite()`,
   `survival()`, `replacementRanks()` or the floors is measured with the tracer across all nine
   styles and at least five seeds, and the invariant suite in `test-engine.js` (legal,
   startable, no third TE, no second K) must still pass. Report the picks that changed.
5. **The style is the user's decision, not a bug.** Zero RB producing a WR-heavy roster is
   correct. Zero RB producing two tight ends in the first four picks is not — see E.
6. **Numbers the app already computes beat numbers you assert.** The impact analysis knows the
   DEF's true board rank. Use it. Never paste a hand number into a prompt string.
7. **Report faithfully.** Tests that fail are quoted. Things you could not run are listed under
   "not verified" with the reason.

---

## 4. Workstreams

### A. The round-by-round walk

Run the tracer for every style at seeds 11, 22, 33, 44, 55 (45 traces, about ten seconds
each). For **every one of the user's fourteen non-keeper picks**, at both the on-deck and the
on-the-clock state, answer the following in a table with one row per pick and a column per
question. Each cell is `yes (term)`, `no`, or `n/a`, and a `no` where a strategist says it
should be `yes` is a finding.

1. **Roster.** Did the board's #1 fill an open starting slot or beat the man in the slot? By
   how much per week (`marginal / 17`)? If neither, is a bench body the right pick *this
   round* — and what is the payload telling Claude he is for (handcuff, bye cover, upside)?
2. **Strength in slot.** Did the ranking know how good the incumbent is? (`rosterBlock` names
   the drop to the best left; check the card said the same.)
3. **Tier cliff.** Was the #1 the last of his tier, and did that change his score? (It
   cannot today — no term. Say what the pick *would* have been if it had.)
4. **Wait or take.** For the #1 and the #2: survival to the following pick, and the
   expected best at that position at that pick (`ctx.vona[pos].expected`). If the #1 survives
   ≥ 85% and the #2 ≤ 30% with a lineup add within 15 points, the board is wrong — see B1.
5. **Fallen.** Any player 12+ picks past ADP in the top 20 by composite. Where did he rank,
   and did the pick change if his ADP is treated as the market's projection (see B2)?
6. **Bye.** Would the #1 make a position clash or an overload? Did the score know? Did the
   payload say which starters share the week?
7. **Injury.** Was anyone in the top 8 carrying a designation, and did that move him more than
   one place? (It will not; that is B9.)
8. **Movement.** With a synthetic Yahoo paste applied (`--yahoo` — add this flag to the tracer:
   take `tools/fixtures/yahoo-draftanalysis.txt` through `DRAFTLINE_YAHOO.parse` and write
   `S.league.yahooAdp` in the shape the paste handler writes it — search app.js for
   `S.league.yahooAdp = store`), did a +3-pick weekly move reorder anything?
9. **Opponents.** At the on-deck state, did the two teams ahead need the #1's position, and
   did survival reflect that? (It does not; B8.)
10. **Style.** Did the style change the pick versus Balanced (`styleEffect`), and did the payload
    tell Claude what the style actually is (`activeKnobs()`, not the preset)?
11. **Cards vs brief vs board.** Were the three cards, the brief's eight, and the board's top
    three the same players? Where they differ, is the difference explainable (survival filter,
    reserve rule) and is the explanation on screen?

Then, separately for **rounds 9 to 15**, where every composite is negative and the ranking is
decided by a few points of grade adjustment: list the picks and say what a strategist would
have done with those six bench spots for this roster (handcuff for Cook or Henry, an
upside RB behind an injured starter, a WR3 that covers WR1's week 7 bye, a second DEF only
if the tiers say so, a QB2 only in a superflex league) and whether any of those reasons
exists as a term. In the seed-11 balanced trace the bench came out `QB, TE, WR, RB, RB, RB` —
a second quarterback and a second tight end in a one-QB one-TE league with a six-man bench,
chosen because `ceilingAdj` of 3.4 beat 1.8. Say whether that is a roster you would take
into week 1.

### B. The score — the terms that are missing, and the ones that are inert

Every item here has evidence from the seed-11 traces. Reproduce, then decide.

**B1. There is no wait cost. The composite never discounts a player for being certain to
survive to the next pick.** VONA is bonus-only and per position: `vona = max(0, min(value,
value − laterValue))`. When the expected best at his position at your next pick is as good as
he is, VONA is zero and he keeps his *full* value. Survival is not in the score at all — it is
a column. Evidence: `balanced-seed11`, pick 62 (round 6). Board #1 Parker Washington composite
20. Houston Defense, blocked by the round-7 floor, would score **61** unblocked with **94%**
survival to pick 83 — and did in fact survive, and was taken at 83. Remove the floor and the
board takes a defense in round 6 that it could have had a round later with near certainty.
The floor is the only thing enforcing "wait", and it is a setting, not a calculation.

Build the **sure-thing test** as an assertion in `test-engine.js`: player A, value 60,
survival 0.95, position expected-best at next pick ≈ 60; player B, value 20, survival 0.20,
position expected-best at next pick ≈ 8. B must rank above A. Then propose the term. The
candidates are (a) pure dynamic VBD — rank by `value − E[best at position at next pick]`, with
value as tiebreaker, which is VONA as *the* score rather than a half-weight tilt; (b) an
explicit per-player wait discount `value · (1 − w · survival)`; (c) a blend. Measure all three
across styles and seeds. Report which one keeps the DEF in round 7–8 **without the floor**,
and what it does to the RB/WR order in rounds 1–4. The README's own note says this is "the
remaining half of 'take the steal at another position'"; this is where it gets done or gets a
dated decision not to.

**B2. A player falling past his ADP is worth nothing extra.** `composite()` appends
"N rounds ahead of ADP" to the reasons and changes no term. Evidence: seed 11, pick 107 —
Jonathon Brooks 15 picks past ADP at board #12; pick 131 — Xavier Worthy 25 picks past at
#10, Romeo Doubs 22 past at #11. Their projections did not move, so the board did not move.
But ADP *is* the market's projection, and a 25-pick fall in real drafts either means news the
projection has not absorbed or a genuine bargain; either way it is information. Decide: (a) a
term (ADP-implied points versus projected points, weighted by `adp_sd`, positive only when he
has fallen), (b) payload-only — every candidate line states picks past ADP whenever ≥ 6, not
only when the survival filter would have hidden him, or (c) both. Cost (a) against the
double-count risk with B1, since a player who has fallen is by definition one who survived.

**B3. The grades and the market signals are inert where the draft is decided.** Verified:
Balanced, round 1, max `|ceilingAdj|` or `|riskAdj|` across all 267 is 11.7 (an outlier);
across the top 8 at every pick through round 8 it is under 4 on composites of 60 to 127. A
+3-pick seven-day move on Chase Brown changes his composite by **1.04** in round 1 and 1.29 in
round 8. Upside hunter's ceiling weight of 1.9 reaches 10.5 at most. The README says
`ytrend` "reaches the score"; it does, at a size that cannot change a pick before round 9. So
the answer to "are we using recent live-draft movement" is: it is in the payload as a
sentence, and in the score as noise. Decide whether that is intended. If movement is news
(the README argues it is), it belongs in the ADP the room model and survival read — it already
half-does for the room (`marketAdp` leans halfway to the 7-day number) but **not for the user's
own survival**, which reads static `adp`. Measure: apply the Yahoo fixture, compare `survival()`
and `marketAdp()` per player, and report the largest gaps.

**B4. Rounds 9–15 collapse to a coin toss.** Once every starter is filled, every unblocked
player scores −95 to −150 (the −100 zero-marginal guard plus a bench fraction of a negative
VOR). The ranking among them is decided by `ceilingAdj` differences of one to three points.
Evidence: pick 110, Jordan Mason −98 / Justin Herbert −98 / Bo Nix −99. This is exactly where
the missing inputs — handcuff, bye cover, injury history, age, upside, ADP fall — would decide
the pick, and none of them is a term. Propose the late-round score: what a bench spot is *for*
on this roster (cover for a specific starter's bye, insurance behind a specific injured or
aged starter, a lottery ticket at a position where the tiers are flat), computed from data the
app has (`depth`, `team`, `bye`, `injury`, `tier`, and `age`/`years_exp` once baked). Do not
add a knob; add a reason the card can print.

**B5. Replacement level decides the RB/WR shape, and it is one choice.** `replacementRanks`
uses last-starter-plus-flex-share: RB31 at 157 points, WR29 at 201, TE13 at 163, QB12 at 294.
That 44-point gap between the RB and WR baselines is why the seed-11 balanced draft opened
RB-RB-TE-RB (Cook, Henry, Bowers, Javonte Williams at 38 over Tetairoa McMillan, 227 pts,
ADP 31.8, six picks past ADP) and its WR1 was Parker Washington at pick 62 — the payload at
86 reads "WR: 0 above replacement". The engine is internally consistent. The question is
whether "last starter" is the right baseline in a league with six bench spots, where the
freely available WR in week 4 is not WR29. Run the sensitivity: replacement at starters+flex
(today), at starters+flex+2 per team, and at starters+flex+bench-share, and report the round
each position is first taken under each, across seeds. Then give the strategist's verdict for
*this* league — full PPR, 2 WR + FLEX — on whether RB-RB-TE-RB from slot 11 is the draft
the user wants, and cite the projections that make it so or not.

**B5a — measured 2026-09-05, and the cause is narrower than B5 assumed.** Not the choice of
baseline: a hardcoded constant that contradicts the scoring. `FLEX_SPLIT = {RB .55, WR .40,
TE .05}` in `engine.js` is applied to every league. Deriving the split from the points instead
— mandatory starters off the top of each position, then the flex slots to the best bodies
left — gives, per preset:

| preset | measured flex share | RB / WR replacement rank |
|---|---|---|
| standard_non_ppr | RB .58, WR .42 | 31 / 29 |
| yahoo_default | RB .25, WR .75 | 27 / 33 |
| ppr_standard | WR 1.00 | 24 / 36 |
| kinda_highlanders | **WR 1.00** | **24 / 36** |

The shipped constant reproduces `standard_non_ppr` to two decimals, which is where it came
from. This league is full PPR, where a point per reception moves receivers past backs at
every depth beyond the top two dozen — RB32 scores 156 against WR32's 189, and by rank 48 it
is 88 against 168 — so every flex slot goes to a receiver and the constant is 12 ranks wrong
in each direction. That is the 44-point baseline gap B5 describes, and it is an artifact.

**Measured with `tools/measure-roster.js`** (25 seeded drafts, bye-adjusted season points —
for each of 17 weeks, drop everyone on bye, field the best legal lineup, sum):

| | lineup pts | bye-adjusted | shape |
|---|---|---|---|
| shipped | 2177 | 2122 | 6.0 RB / 3.0 WR |
| measured flex split | 2190 | 2132 | 3.1 RB / 5.9 WR |
| + symmetric bench scaling | 2199 | 2134 | 3.0 RB / 6.0 WR |
| the ADP-driven room, same sims | — | — | **4.9 RB / 5.4 WR** |

**Not landed, deliberately, four days out.** The fix is right and the gain is real but small
(+0.5% on the objective), and it swaps one corner solution for its mirror image: 3.0 backs in
a league that starts two plus a flex, against a market that rosters 4.9. Both corners come
from the same place — `valueOf()` keeps a below-replacement deficit whole while scaling
surplus to `benchWeight`, so whichever position currently sits above its own line wins every
full-lineup pick. Symmetric scaling does not break the corner on its own (measured above),
because in full PPR receivers genuinely do outscore backs at depth; what is missing is the
injury premium on running backs, which is why the market holds five. It also breaks one
engine assertion and five in `test-impact.js`, the latter because the panel's relative measure
silently assumed replacement ranks are constant between a league and its baseline.

**What the review has to decide**, with the tool above to hand: whether to land the measured
split (it is a straightforward bug fix), and what supplies the RB depth premium the points
cannot see. The honest candidates are a games-missed prior per position (B9's data), or an
explicit depth target per position — the market's own 4.9/5.4 is an empirical one. Do not
land the split alone without answering the second half; a board that builds three backs is
not obviously better than one that builds six.

**B6. The floors are patches over B1.** `defFloorRound: 7` and `kFloorRound: rounds − 1` are
hard blocks. With the boosted D/ST tiers, Houston Defense is the **#22 player on this board
by VOR** (round 2 value), with ADP 97 and 94% survival to pick 83. The correct behavior —
take him around round 7 because he will be there — falls out of a wait term and not out of a
floor. Once B1 has a candidate term, run the board with the floors removed and report where
the DEF and K land per seed. If they land in rounds 7–9 and 14–15 on their own, the floors
become defaults the user can lower, not walls. If they do not, say why not.

**B7. Bye semantics.** Three checks. (a) `byePenalty` fires when starters already on the
week ≥ tolerance (3), so the *third* starter on a week costs nothing and the fourth costs 5;
`byeRisk()` in the UI agrees (`total + 1 > tol` is the fourth); but the README says the report
"flags three or more starters idle in one week". The seed-11 balanced roster finished with
**three** starters on week 11 (Maye, Reed, Myers): no penalty was charged during the draft and
the report then flags it. Make the score, the column and the report agree on one number, and
say which number — three starters out in one week with a six-man bench is a real week. (b) A **position clash** — a WR whose bye matches both your WR starters — is red in
the UI and zero in the score. Add the assertion, then the term. (c) A kicker or defense on a
bye is a stream, not a hole; the penalty prices them like a quarterback. Decide whether K and
DEF byes count at all.

**B8. Survival is roster-blind, and the run multiplier is a blunt proxy for that.**
`survival()` is a normal CDF on ADP. `teamsAhead()` knows that both teams picking between now
and your turn already have two running backs; the payload tells Claude; the score does not
know. Meanwhile a run at RB adds 12% to every RB's score — even at pick 11 with your next pick
at 14 and the two teams in between full at RB (seed 11, pick 11: `mult 1.12`, "RB run in
progress"). Measure across the traces: how often the run multiplier changed the #1, and in how
many of those the teams ahead could not take that position anyway. Propose survival conditioned
on the teams ahead (a team whose starters are full at a position draws from it at a fraction —
`roomPick` already refuses past `depthCap`; use the same rule), and retire the multiplier if
the conditioned survival makes it redundant.

**B9. Injury is a badge, not a number.** All 267 carry `gp: 18`, including six on IR, PUP or
the exempt list (Jacobs, Tyson, Charbonnet, Conner, Pacheco, Dell), so the `gp < 17` risk term
has never fired and every one of them projects a full season. The designation adds +4 to +16
to a modeled risk that is then scaled to a point or two. Decide the treatment: a games
discount on the projection read from the designation (IR: weeks until eligible; PUP: 4; NA:
the exempt-list rule) is the honest one and moves points, not grades. Bake `age` and
`years_exp` (already in `players_nfl.json`, never read by `bake-players.py`) and say how they
enter risk. Then the payload: say the bake date beside every designation (C4).

**B10. Handcuff and stack are team-name matches.** `handcuffTeams[team] = true` for any team
where you own an RB, so the bonus goes to the *starter* if you own the backup, and only under
two styles. The depth chart is in the data: Bijan → Brian Robinson (ADP 163), McCaffrey →
Kaelon Black (163), Cook → Ty Johnson (168); Gibbs' and Taylor's backups are not on the
267-board at all. Build the real map (`depth === 2`, same team, same position), report which
top-24 RBs have a handcuff on the board, and decide whether the bonus belongs in Balanced with
a small weight in rounds 11+. The stack bonus is one-directional (WR/TE after QB); with Maye
kept from pick 1 that direction is the one that matters here, but say so.

### C. The payload — what Claude is told

**C1. Custom knobs never reach the model. BROKEN.** `styleBlock()` reads
`STRATS[key].knobs` and then appends `S.league.styleCustom` as if it were prose. `styleCustom`
is a knob object (`S.league.styleCustom = customKnobs` in the style-apply handler, fed by the
Claude-tuning flow and the style editor).
Verified in `traces/hero_rb-seed11-pick38.txt` line 34: `"...handcuffBonus 5. My own notes on
it: [object Object]"` — the TE 1.3 bias and ceilingWeight 1.4 actually in force are absent, and
the model is told the preset instead. Fix: build the block from `activeKnobs()`, diff against
the preset, and say which knobs are the user's own. Add the assertion to `test-app.js`
(`styleBlock()` under a custom knob must name the knob and must not contain `[object`). Then
check the two other places that read the preset instead of the active knobs: the style
comparison (`runMock((STRATS[a] || {}).knobs ...)`) and anything that prints "what your
style does".

**C2. The candidate line is missing the facts that decide bench picks and cliff picks.** Read
`traces/balanced-seed11-pick86.txt` and `-pick107.txt`. Each candidate carries points, VOR,
marginal, lineup add, depth, injury, ADP, survival, composite, tag, note. It does **not** carry:
his tier and how many are left in it (the supply block gives it only for the best at each
position); his ceiling/risk grade and where it came from; his ADP spread; whether he is the
handcuff to a back you own; whether his bye covers or collides with a specific starter's; his
age or games played last year; the *date* of the research note (the `source` field carries it
and is dropped). For a bench pick those are the whole decision. Propose the line, cost it in
tokens against the ~3,300 mean input today, and show it at pick 107.

**C3. "Worth roughly a 7th-round pick" is hand-written and wrong.** `scoringHighlights()`
hard-codes it. The board's own VOR puts the best DEF at #22 overall, and `impact.js`
computes `bestRank` and `bestRound` for exactly this sentence. Replace the string with the
computed rank and round, and have the test pin that the number in the payload is the number the
impact panel shows.

**C4. The model is told injuries and depth "are current".** `SYSTEM` says so. The bake is
four days old on draft night unless re-run (audit flags it). Add the bake date to the LEAGUE
line and change the sentence to "as of <date>". Then decide whether `injury_notes` and
`news_updated` from the players feed (19 and 833 of 879 carry them) should be baked so the
payload can say what the designation is about.

**C5. Teams ahead, on the clock.** `teamsAheadBlock()` is "none" once you are on the clock,
which is correct, but the brief written on deck is what is on screen at that moment and it was
written against two teams' needs. Confirm the on-deck brief is the one shown on the clock
(the cache is by `A.myNext`) and that `briefVoid()`'s four tests cover a team ahead taking the
position — it checks the named player and the fallback, not "the position I argued about
just lost its last tier-1 body". Say whether that fifth test is worth adding.

**C6. Ask the two questions the user actually has.** The user's own words (I2): a situation
read — "this is where we're at, this is what we need, here is what the next two rounds have to
accomplish" — and a pick with a fallback. Today it is one prompt asking for the pick. I2 §6
proposed caching the situation read on a roster fingerprint. Decide it, with the token cost,
and write the prompt language. Keep the rule from I2 §7b: every claim in the brief traces to a
number in the payload, and a claim that cannot is not made.

### D. The model — is Sonnet 5 at effort low the right engine for this brief?

`qa-findings-live.md` measured agreement with the board (27–29 of 30) and latency (p95 4.4 s at
low). It did not measure the thing that matters: **does the brief catch the board when the
board is wrong?** A brief that agrees with a correct board is worth its cost only if it would
disagree with an incorrect one.

Build `ff/tools/eval-brief.js`. Raw `fetch` to `https://api.anthropic.com/v1/messages` — the
app's own transport is raw fetch and the eval should exercise the same request shape as
`claudeOnce()`; there is no SDK in this dependency-free tree and adding one for a test is not
worth the divergence. Request body: `model`, `max_tokens: 2500`, `output_config: { effort }`,
`system: SYSTEM`, `messages: [{role:"user", content: payload}]`. Thinking is adaptive by
default on every model here; do not pass `budget_tokens` (rejected on Sonnet 5 and Opus 5). For
the Opus 5 runs add `betas: ["server-side-fallback-2026-07-01"]` and `fallbacks: "default"` so a
safety refusal does not count as a model failure; check `stop_reason` before reading content
and record `refusal` separately. Headers: `x-api-key`, `anthropic-version: 2023-06-01`,
`anthropic-beta` only for the fallback beta.

**Two payload sets.**

1. *Replay* — 40 real payloads sampled from the 45 traces: every round represented, on deck
   and on the clock, at least three styles. Deterministic checks per answer: line 1 binds
   through `playerIn()`; the name is in the candidate list; an "If gone:" line exists and
   names a different listed player; no word from {gone, taken, off the board} applied to a
   listed player; every number in the answer appears in the payload (regex the integers and
   percentages — a number the model invented is a HIGH); under 110 words.
2. *Planted errors* — 24 payloads made from real ones by changing one fact so that the board's
   #1 is wrong on the evidence in the payload, with a known correct answer:
   - the #1 gains "listed IR (knee)" and a note "out until week 10"; expected: the #2
   - three starters already on the #1's bye week in the roster block; expected: a different
     week's candidate within 10 points
   - the #1 is a second TE "CANNOT crack my starting lineup" while WR2 is EMPTY and a WR
     with +lineup is #3; expected: the WR
   - the #1 survives to the following pick at 96% and the #2 at 8%, lineup add within 10;
     expected: the #2 (the wait test — this is B1 asked of the model)
   - the style block says Zero RB, round 2, and the #1 is an RB; expected: the best non-RB
     unless the RB's lineup add is double
   - a candidate 22 picks past ADP with the same lineup add as the #1; expected: either, but
     the answer must mention the fall
   - teams ahead both full at the #2's position and the #2 within 3 points; expected: #1 now,
     #2 named as the fallback with the reason
   - the research note on the #1 says "opens the season suspended 6 games"; expected: #2
   Each planted payload states its expected answer and the sentence the answer should contain.

**Four configurations**, same payloads, one call each, no retries: `claude-sonnet-5` low
(shipped), `claude-sonnet-5` medium, `claude-opus-5` low, `claude-opus-5` medium. Optionally
`claude-haiku-4-5` (`thinking` omitted) as the floor, since the README's Haiku verdict was
anecdotal. That is 64 × 4 = 256 calls, about $2.60 for the Sonnet pair and $6.50 for the Opus
pair at list prices; say the count before you run it.

**Report**, per configuration: p50/p95/max latency; mean input/output tokens and cost per
call; replay pass rate on every deterministic check; agreement with the board's #1; **planted
catch rate** (named the expected player *and* gave the planted reason); invented-number rate;
refusals. Then the decision, in one paragraph: which model and effort the Worker should pin,
against three constraints — p95 under 8 s (the brief is written two picks out and the room
moves), catch rate, and cost per draft under a dollar. Sonnet 5 low is the incumbent; it keeps
the job unless a configuration beats it on catch rate without failing latency. If Opus 5 low
wins on catch rate and holds p95, that is the recommendation and the cost is stated per draft.
Write the Worker diff for whichever wins, including `PRICE_IN`/`PRICE_OUT` for the daily
ceiling arithmetic (Sonnet 5 $2/$10, Opus 5 $5/$25 per million).

### E. The style contract

Each style's card promises a shape. Check it delivers one, across seeds, and that the payload
describes the shape in force. Evidence to start from: `zero_rb-seed11` opened WR, WR, TE, **TE**
(Bowers 35, Loveland 38 into the FLEX), first RB at 62, and finished with a tight end in the
flex of a full-PPR league. `earlyPosBias TE 1.15` plus the TE cliff did that. Zero RB means
receivers, not tight ends. For each of the nine, over five seeds: the position of picks 1–5,
the round the first RB/WR/TE/QB/DEF/K arrives, and whether the final lineup is one the style's
own blurb describes. `test-engine.js` asserts legality and startability per style; add the
shape assertions the blurbs imply (Zero RB: no RB in rounds 1–4 and no second TE before the
FLEX is a WR; Hero RB: exactly one RB in rounds 1–3; Elite TE: a T1 TE by round 3 when one is
available; RB-heavy: two RBs by round 3).

### F. The room, briefly

The other eleven teams draft to ADP with noise and a depth cap; they do not read the board and
do not chase needs beyond the cap. That is stated in the UI and it is fine for rehearsal. Two
checks only: (1) with the Yahoo fixture applied, `marketAdp()` leans halfway toward the 7-day
number for the room — confirm the user's own survival column does not (B3) and say whether
that asymmetry is defensible on draft night; (2) `measure-roompick.js` exists — run it and
quote the survival-vs-room gap it reports, since B1's wait term will read survival.

### G. Data we hold and do not use, and data that is free and not wired

Two lists. Rank the combined list by **edge per hour of work**, and mark each `before Monday`
or `next season`. For every row: source, free or not, how it enters (bake or engine or
payload), which term of `composite()` or which payload block it changes, and what could go
wrong.

**G1. Already downloaded, never baked.** `tools/players_nfl.json` (879 active skill players)
carries, unread by `bake-players.py`: `age` (826), `years_exp` (847), `birth_date`,
`news_updated` (833), `injury_notes` (19), `status`, `search_rank`, `yahoo_id` (217),
`espn_id` (210), `rotowire_id`, `gsis_id`. `tools/sleeper.json` carries per player
`adp_half_ppr`, `adp_std`, `adp_2qb` beside the `adp_ppr` that is baked, plus `rec_fd`,
`rush_fd`, `pass_fd` (first downs) and the WR/RB/TE reception bonus fields. The Yahoo ID is
worth a sentence of its own: it makes the Yahoo paste join by ID instead of `normName`, which
is the join that currently silently misses on suffixes and apostrophes.

**G2. Free and external.** The verified list is in the appendix below — endpoints, auth,
fields seen, freshness. Read it, re-verify anything you will wire, and write the row.

### H. The live draft board uses the same room

`draftline-build-spec.md` P3.2 specifies the live draft board: the clock line, the last-pick
line, and three predicted picks for the team on the clock as one-tap record targets, with the
treatment set by the P3.1 hit-rate table (top-3 88% in round 1, about 50% by round 5, under
10% from round 12, against a synthetic room). Two checks belong to this review rather than to
the build: (1) the targets, the practice run and the mock plan must all draw from one
`roomPick` over one `marketAdp()` — a rehearsal that drafts a different room than the night's
tap targets predict is a rehearsal of the wrong draft; assert it. (2) Once a Yahoo paste is
applied, re-run `measure-roompick.js` with `yadp`/`ypct` populated (add the flag) and report
what the `pct`-availability and run terms do to the top-3 rate by round, because they never
fire on the bare board the table was measured on.

---

## 5. Deliverables

1. **`ff/tools/qa-findings-S.md`** — the wiring table from §2 completed and corrected; the
   round-by-round table from A for all nine styles (one summary table, per-seed detail in an
   appendix); findings for B1–B10, C1–C6, E, F with severity, reproduction and either the
   applied fix or the proposed diff; G ranked.
2. **`ff/tools/qa-findings-S-eval.md`** — D in full: the harness, both payload sets, the
   per-configuration table, the decision, the Worker diff.
3. **Code**: fixes for anything `BLOCKER` or clearly-broken-and-small (C1 and C3 are both),
   each with an assertion in `test-app.js` or `test-engine.js`; the sure-thing assertion from
   B1 and the shape assertions from E added even where the fix is not applied (a failing
   assertion that documents a known gap is marked `todo` in the output, not deleted); the
   `--yahoo` flag on the tracer; `eval-brief.js`.
4. **A five-line summary at the top of `qa-findings-S.md`**: inputs by verdict; the picks the
   board gets wrong today and why; the model decision; what changed in the code; what is
   proposed and waiting on the user.

Everything you change is committed on a branch, never to `main`, with the tests passing and
the commit message saying which finding it closes.

---

## Appendix — free data sources, verified 2026-09-05

Every endpoint below was fetched on 2026-09-05 and the HTTP status recorded. Field names are
ones that appeared in a real response; nothing is inferred. Re-verify before wiring — these
are third-party surfaces and any of them can move.

### Ranked for *this* league (1-QB, full PPR, boosted D/ST, Monday draft)

| # | Source | What it adds to a pick | Enters | Effort |
|---|---|---|---|---|
| 1 | **ESPN scoreboard odds, weeks 15–17** (§A5c) | The only free source with playoff-week spreads and totals already posted. Implied team totals for weeks 15–17 → a D/ST and QB matchup prior, and the playoff-SOS tiebreaker between two players the board rates equally. | bake → new `pw` field per team; payload line; a small late-round term | 1 h |
| 2 | **Sleeper 2025 season stats** (§A2) | Real 2025 snap share, target share, red-zone targets and carries, games active — separates "the projection likes him" from "the offense fed him". Also `gp`/`gms_active` for 2022–2025: a four-year durability curve, the games-missed history B9 wants. | bake → `usage` block; risk grade; payload line | 1.5 h |
| 3 | **Sleeper 2026 schedule** (§A4) | 27 KB, all 18 weeks. Byes derived; weeks 15–17 opponents to join with #1. | bake | 0.5 h |
| 4 | **DynastyProcess ECR mirror** (§A7) | Expert consensus rank with `sd`, `best`, `worst` across 127 experts. Disagreement among analysts is a different signal from disagreement among drafters (`adp_sd`), and it is the "reach or fell" input the README asked for. CORS `*`, keyless, license-clean. | bake → `ecr`, `ecrSd`; ceiling/risk input; payload | 1 h |
| 5 | **ESPN `kona_player_info`** (§A5a) | A second independent ADP with its own `percentChange` (ownership movement — the free, no-paste version of the 7-day signal), plus `injuryStatus` refreshed today. Callable from the browser (CORS reflects origin) — could be live on draft night, not baked. | bake, or live at load | 1.5 h |
| 6 | **Sleeper trending adds/drops** (§A1) | Which of two similar bench fliers the market is already moving on. Rank signal, not magnitude. | bake or live; late-round tiebreak | 0.5 h |
| 7 | **ESPN injuries** (§A5b) | Beat-writer `shortComment` per designation, timestamped today — what the designation is *about*, which Sleeper's feed lacks. | payload line beside the designation | 1.5 h |
| 8 | **nflverse `roster_2026.csv`** (§A6) | `sleeper_id`, `yahoo_id`, `espn_id`, `gsis_id` crosswalk. Enabler for 4, 5 and the Yahoo paste join by ID. | bake | 1 h |
| 9 | **nflverse `stats_player_reg_2025.csv`** (§A6) | `wopr`, `target_share`, `air_yards_share`, EPA. Refines 2. Needs a real CSV parser and a server-side fetch. | bake | 2 h |
| 10 | **nflverse `draft_picks.csv`** (§A6) | 2026 rookie round and pick — the ceiling input for the ten or so rookies on the board. | bake → ceiling | 0.75 h |
| — | Sleeper `adp_2qb`, FFC `2qb` format, ESPN `SUPERFLEX` rank, ECR `redraft-op` | Superflex market pricing on endpoints already called. Irrelevant Monday; the cheapest win in the app for a superflex league. | bake | 0.5 h total |

Not usable before Monday: Yahoo's OAuth API (401; application process), The Odds API (key),
DraftKings direct (403). Keep the Yahoo paste.

### A1. Sleeper trending
`https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=50` and
`.../trending/drop?...` — 200, no auth, CORS `*`, `s-maxage=600`. Array of `{count,
player_id}` only. `lookback_hours=168` works. `player_id` is a team abbreviation for DSTs.

### A2. Sleeper 2025 season stats
`https://api.sleeper.com/stats/nfl/2025?season_type=regular&position[]=RB&position[]=WR&position[]=TE&position[]=QB&order_by=pts_ppr`
— 200, 2.45 MB, 3,116 rows; 2022–2024 also 200. 129 stat keys. Verified populated:
`gp`, `gms_active`, `off_snp`, `tm_off_snp` (snap share = ratio), `rec_tgt`, `rec_rz_tgt`,
`rush_rz_att`, `pass_rz_att`, `rec_air_yd`, `rec_yar`, `rec_drop`, `rush_btkl`, `rush_yac`,
`pos_rank_ppr`, `pts_ppr`. Embedded `player` carries `years_exp`, `news_updated`,
`injury_*`. Frozen (last_modified ≈ 2026-01-05). Provider `sportradar` here versus
`rotowire` for projections — do not mix.

### A3. Sleeper weekly projections and the ADP suite
`https://api.sleeper.com/projections/nfl/2026/1?season_type=regular&position[]=RB...` —
200, carries `opponent`, `team`, `date`, `week`, 48 stat keys, updated today. The season
endpoint the bake already calls also carries `adp_ppr`, `adp_half_ppr`, `adp_std`,
`adp_2qb`, dynasty and rookie variants on every row (`adp_rookie` is 999 for veterans).

### A4. Sleeper 2026 schedule
`https://api.sleeper.app/schedule/nfl/regular/2026` — 200, 27 KB, 273 rows for 272 games
(dedupe on `game_id`), weeks 1–18, keys `status, date, home, week, game_id, away`. No bye
field; a team absent in a week is on bye.

### A5. ESPN, unauthenticated
**5a.** `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/3?view=kona_player_info`
with header `X-Fantasy-Filter: {"players":{"limit":1500,"filterStatsForSplitTypeIds":{"value":[0]},"sortDraftRanks":{"sortPriority":100,"sortAsc":true,"value":"PPR"}}}`
— 200, 3.76 MB with the split filter (18 MB without; `filterStatsForTopScoringPeriodIds`
returns 400). 1,036 players. `ownership.{averageDraftPosition, averageDraftPositionPercentChange,
percentChange, percentOwned, percentStarted, auctionValueAverage, date}`;
`draftRanksByRankType.{STANDARD, PPR, SUPERFLEX}.rank`; `injuryStatus` (ACTIVE 808,
QUESTIONABLE 124, INJURY_RESERVE 51, OUT 9, SUSPENSION 1); `stats[]` with `statSourceId` 0
actual / 1 projected and `seasonId`; `lastNewsDate`. CORS reflects `Origin` and preflight
allows `x-fantasy-filter`, so it is callable from the page.
**5b.** `https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries` — 200, 9 MB,
CORS `*`, 800 rows, `{id, longComment, shortComment, status, date, athlete, type}`; the
athlete id is only in `athlete.links[].href`.
**5c.** `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=15&dates=2026`
— 200, CORS `*`, ~256 KB per week, `max-age=1`. `competitions[0].odds[0].{provider, overUnder,
spread, details, ...}` (DraftKings). **16 of 16 games carry `overUnder` and `spread` in weeks
1, 15, 16 and 17.** `spread` is signed relative to the **home** team; `details` is text naming
the favorite — use `spread`. Home implied total = `overUnder/2 − spread/2`.

### A6. nflverse (GitHub, no auth)
`raw.githubusercontent.com` sends CORS `*`; release assets redirect to
`objects.githubusercontent.com` with **no** CORS header, so they need a server-side fetch
(the bake script, or the Worker). All CSVs carry quoted fields with embedded commas
(`headshot_url`); a naive split shifts every column — use a real parser.
- `https://github.com/nflverse/nfldata/raw/master/data/games.csv` — 200, 272 rows for 2026;
  `spread_line`/`total_line` populated for week 1 only (16/16), week 16 (4/16), none for 15,
  17, 18. Unique columns: `away_rest`, `home_rest`, `div_game`, `roof`, `surface`.
- `.../releases/download/stats_player/stats_player_reg_2025.csv` — 200 (the `player_stats`
  tag is legacy and 404s for 2025). Columns include `target_share`, `air_yards_share`,
  `wopr`, `racr`, `games`, `targets`, `carries`, `receiving_epa`, `fantasy_points_ppr`.
  `stats_player_week_2025.csv` adds `week`, `opponent_team`.
- `.../snap_counts/snap_counts_2025.csv` — 200, `offense_snaps`, `offense_pct` per game.
- `.../injuries/injuries_2025.csv` — 200, `report_status`, `practice_status` per week; no
  `date_modified`.
- `.../draft_picks/draft_picks.csv` — 200, 257 rows for 2026, `round`, `pick`, `age`.
- `.../rosters/roster_2026.csv` — 200, `sleeper_id, yahoo_id, espn_id, gsis_id, pfr_id,
  years_exp, rookie_year, draft_number`.
- `.../pfr_advstats/advstats_season_rec.csv` (and `_rush`) — 200, updated today, `adot`,
  `brk_tkl`, `drop_percent`.
- `depth_charts_2026.csv` is current but 46 MB of history — Sleeper's `depth_chart_order`
  covers it. `nextgen_stats` ships only `.csv.gz`/`.parquet`. `snap_counts_2026`,
  `injuries_2026`: 404 (season not started).

### A7. Expert consensus
- `https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_fpecr_latest.csv`
  — 200, 999 KB, CORS `*`, scraped 2026-09-04. Filter `page_type`/`ecr_type`:
  `redraft-overall/ro` (525 rows), per-position `redraft-rb/rp` etc., and `redraft-op/rsf`
  (superflex). Columns `player, id, pos, team, ecr, sd, best, worst, bye, scrape_date`.
  `id` is the FantasyPros player id; `yahoo_id` is NA here — join through `roster_2026.csv`.
- FantasyPros' documented v2 API returns 403 without a key; the key is free but tied to a
  membership tier and an application. Their site-internal `partners.fantasypros.com`
  endpoint answers 200 keyless with `rank_ecr, rank_min, rank_max, rank_std, tier,
  player_yahoo_id, player_bye_week` — but it is CORS-locked to fantasypros.com and
  undocumented, and their ToS governs it. Prefer the mirror above.

### A8. Sleeper players feed — population counts that matter
`https://api.sleeper.app/v1/players/nfl` — 14.65 MB, 12,226 players. `years_exp` 12,158;
`age` 10,977; `news_updated` 8,228; `injury_status` 786; `injury_body_part` 708 (e.g. "Knee -
ACL"); `injury_notes` 92 and short; **`injury_start_date` 0 and `practice_participation` 1** —
these keys exist and are empty, do not model on them. `yahoo_id` on 6,750, `espn_id` on
6,736: the join keys to the Yahoo paste, ESPN and FantasyPros. `metadata.rookie_year` exists;
draft capital does not — use nflverse `draft_picks.csv`.

### A9. FantasyFootballCalculator, already wired
`https://fantasyfootballcalculator.com/api/v1/adp/ppr?teams=12&year=2026&position=all` is
the source in use (7,430 drafts, 08-29 → 09-05). The same endpoint answers for `2qb` (7,208
drafts), `half-ppr` (2,879) and `dynasty` (111 — too thin). Same keys: `adp, times_drafted,
high, low, stdev, bye`.
