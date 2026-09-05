# Workstream I2 — what the AI is told, and what it should be told instead

**Status: design proposal. Nothing in this document has been applied.** No file under
`ff/` was modified other than this one. No Claude API call was made, by me or by any
harness, at any point. Rule 3 reserves changes to what the model is told for the user, so
this ends with diffs and stops.

Scope is section I2 of `ff/tools/qa-review-prompt.md`: whether the *right things* are in
the payload at all, and what it should become. Whether the numbers in it are *correct* is
workstream D and is not audited here — except where a number is used to generate an
English claim that is false, which is a question about the payload's content rather than
its arithmetic (see F-I2-3).

---

## 0. Method, and what is verified versus reconstructed

**Harness.** `assets/app.js` is a single IIFE with no exports, so the payloads below were
produced by loading the real, unmodified file into a stubbed DOM under `node:vm`, with the
boot tail (`syncKeepers(); initSync(); … render(); …`) replaced in memory by an export
block. `engine.js`, `presets.js`, `strategies.js` and `data/players.js` are loaded
verbatim from the working tree. **Nothing on disk under `ff/` was touched.** The strings
printed in section 1 are the literal return value of `briefQuestion()`, not a
reconstruction of it.

Harness files (scratch, outside the repo, under the session scratchpad):

```
harness.js        stubbed DOM + app.js loader
build-states.js   builds the two draft states, writes states.json
proposal.js       the proposed payload builder
tok.js            offline token estimator
```

**The two states.** Both are the real engine on `kinda_highlanders`, 12 teams, 15 rounds,
slot 11, Balanced, Drake Maye kept at round 5 / pick 59. My own picks are forced to the
roster the user reported; the other 79 picks are drawn by the app's own `roomPick()` with
`Math.random` seeded to 20260908, which is the same room model `simulateToMyPick()` uses.

*Verified against the user's report:*

| | user reported | harness produced |
|---|---|---|
| pick 86 roster | QB Maye, RB Henry/Barkley, WR McConkey + empty, TE LaPorta 199, FLEX Hall, K empty, DEF Houston | identical |
| pick 86 board top 5 | TE, TE, QB, RB, TE | TE Kraft, QB Lawrence, TE Pitts, QB Williams, TE Kincaid |
| pick 110 board top 24 | "almost entirely tight ends and quarterbacks" | 18 of the top 25 are TE or QB |
| pick 110 roster | WR2 still empty, K still 0/1 | identical |

*Reconstructed, and labeled as such:* the individual opponent picks, and the user's own
picks at 86 and 107 (the report does not say what they took). I took the board's
top-ranked **RB** at each, because that is the only choice consistent with the pick-110
state the user describes — one QB, one TE, WR2 empty, K empty. Harold Fannin Jr. and Tony
Pollard, who were #1 and #4 in the user's pick-86 screenshot, were drawn off the board by
the seeded room before pick 86 in my run; Tucker Kraft is #1 instead. The *shape* the
workstream is about — a filled position ranked first while a starting slot is empty —
reproduces exactly.

**Timing.** Both payloads are captured on deck at lead 2, which is when `renderBrief()`
actually fires: pick 84 writing for 86, pick 108 writing for 110.

**Token counts are estimates.** No tokenizer package is installed in this environment and
live API calls are forbidden, so I could not call Anthropic's token-counting endpoint or
run a local BPE. `tok.js` averages two independent estimators — characters ÷ 3.7, and a
piece-wise count over words, digit runs and punctuation. They agree within 6% on every
string measured. **Treat every token figure below as ±10%, and treat the *ratios* as much
more reliable than the absolutes** — both payloads are measured the same way, so the delta
is sound even if the level is off.

---

## 1. The current payload, printed in full

### 1a. What it is made of

`briefQuestion()` = `claudeContext()` + a `TEAMS PICKING BEFORE YOU` block + a `QUESTION`
block. It is sent as the single user message. `SYSTEM` (249 est. tokens) is sent alongside
it on every call and is not counted in the body figures below.

| section | pick 86 | pick 110 | share |
|---|---:|---:|---:|
| League / scoring / draft state / style / the "compare against the man in the slot" paragraph | 378 | 410 | 15% / 16% |
| — of which **the roster itself** (`MY STARTERS`, `MY BENCH`, `STARTERS FILLED`) | **126** | **152** | **5.0% / 6.1%** |
| Candidate list, 12 players | 1,860 | 1,779 | **73% / 71%** |
| Teams picking before you | 50 | 53 | 2% |
| Question and answer-shape instructions | 254 | 254 | 10% |
| **Total user message** | **2,541** | **2,495** | |
| Plus `SYSTEM` | 249 | 249 | |
| **Total input per brief** | **2,790** | **2,744** | |

At $2 per million input tokens that is **$0.0056 per brief**. Input cost is not the
problem and no part of this proposal should be argued on input price. Latency is the
constraint, and latency is driven by output plus adaptive thinking, not by 2,500 input
tokens.

### 1b. Pick 86, round 8 — the literal string

```text
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 84 of 180, round 7. My next pick is 86, then 107 (21 picks apart).

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: Derrick Henry (RB, 250 pts, bye 13); RB: Saquon Barkley (RB, 250 pts, bye 10); WR: Ladd McConkey (WR, 232 pts, bye 7); WR: EMPTY; TE: Sam LaPorta (TE, 199 pts, bye 6); FLEX: Breece Hall (RB, 214 pts, bye 13); K: EMPTY; DEF: Houston Defense (DEF, 336 pts, bye 8)

STARTERS FILLED: QB 1/1, RB 3/2, WR 1/2, TE 1/1, K 0/1, DEF 1/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Every player here has a real chance of reaching pick 86; the ones the teams in between will almost certainly take are already removed. Name a player from this list and nobody else.
- Tucker Kraft (TE GB, bye 11): 177 pts in this league, VOR 14, depth chart TE1, listed Questionable (Knee - ACL), the other ADP market is 48 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 102.6, chance he reaches the pick I am writing about (86) is 81%, chance he is still there at my FOLLOWING pick (107) is 41%, composite 6, flagged BREAKOUT (Tipped to take a big step up this season.). Research note: His 9.3 yds/target led all TEs by a full 1.5 yards over the next-closest player. The only thing missing was volume. Even with an efficiency dip, more work is a clean trade. Realistic path to top-3 TE if the recovery holds.
- Trevor Lawrence (QB JAX, bye 7): 301 pts in this league, VOR 8, depth chart QB1, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 92.5, chance he reaches the pick I am writing about (86) is 71%, chance he is still there at my FOLLOWING pick (107) is 11%, composite 5, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: From Wk5 on he outscored every player at every position at 23 pts/gm; ~28 with a full WR room. Top-5 in PPG, 1st in expected fantasy pts/gm. 4th-most RZ pass attempts, 3rd-most RZ carries, 9 rush TDs (only Allen had more). Yr 2 with Coen.
- Kyle Pitts Sr. (TE ATL, bye 11): 174 pts in this league, VOR 11, depth chart TE1, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 81.6, chance he reaches the pick I am writing about (86) is 35%, chance he is still there at my FOLLOWING pick (107) is 1%, composite 4
- Caleb Williams (QB CHI, bye 10): 299 pts in this league, VOR 6, depth chart QB1, the other ADP market is 26 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 87.2, chance he reaches the pick I am writing about (86) is 54%, chance he is still there at my FOLLOWING pick (107) is 5%, composite 1
- Dalton Kincaid (TE BUF, bye 7): 166 pts in this league, VOR 3, depth chart TE1, the other ADP market is 85 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 148, chance he reaches the pick I am writing about (86) is 100%, chance he is still there at my FOLLOWING pick (107) is 98%, composite 1, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Led ALL TEs at 2.79 YPRR — best mark by a TE with 40+ targets since Kittle in 2020. Also led in targets per route (0.27) and fantasy pts per route (0.70). Finished TE19 only because he ran a route on 44.2% of pass plays (40th). Beane publicly said the goal is more snaps. Healthy all summer.
- J.K. Dobbins (RB DEN, bye 10): 162 pts in this league, VOR 5, depth chart RB1, he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 86.8, chance he reaches the pick I am writing about (86) is 53%, chance he is still there at my FOLLOWING pick (107) is 3%, composite 1, flagged RISING (The room has been taking him earlier than it was a week ago.). Research note: Multi-week climb as Denver's early-down hammer. A fine RB2/flex whenever he's on the field — availability has always been the question, not the role.
- Jordan Mason (RB MIN, bye 6): 156 pts in this league, VOR -1, depth chart RB1, he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 112.7, chance he reaches the pick I am writing about (86) is 95%, chance he is still there at my FOLLOWING pick (107) is 64%, composite 1, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Beat Aaron Jones in all five key efficiency metrics: 4.8 vs 4.2 YPC, +1.02 vs -0.12 RYOE/att, 2.42 vs 1.67 YAC/att, 83.8 vs 69.5 PFF. Jones posted career lows in all five at 31. New OL coach brings outside zone — Mason averages 5.6 YPC on it.
- Mark Andrews (TE BAL, bye 13): 165 pts in this league, VOR 2, depth chart TE1, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 131.7, chance he reaches the pick I am writing about (86) is 100%, chance he is still there at my FOLLOWING pick (107) is 95%, composite 1
- Justin Herbert (QB LAC, bye 7): 295 pts in this league, VOR 2, depth chart QB1, the other ADP market is 32 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 104.4, chance he reaches the pick I am writing about (86) is 92%, chance he is still there at my FOLLOWING pick (107) is 42%, composite 1
- Bo Nix (QB DEN, bye 10): 294 pts in this league, VOR 0, depth chart QB1, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 111.9, chance he reaches the pick I am writing about (86) is 97%, chance he is still there at my FOLLOWING pick (107) is 64%, composite 1
- George Kittle (TE SF, bye 8): 172 pts in this league, VOR 9, depth chart TE1, listed Questionable (Achilles), he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 91.8, chance he reaches the pick I am writing about (86) is 65%, chance he is still there at my FOLLOWING pick (107) is 16%, composite 0, flagged INJURY (Carrying an injury worth checking before you put him in a lineup.). Research note: 32 and coming off a torn Achilles; still a monitoring case with no official Week 1 designation.
- Jayden Reed (WR GB, bye 11): 201 pts in this league, VOR 0, depth chart SWR2, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 91.1, chance he reaches the pick I am writing about (86) is 71%, chance he is still there at my FOLLOWING pick (107) is 4%, composite 0, flagged RISING (The room has been taking him earlier than it was a week ago.). Research note: Up ~7 spots returning to health from a broken collarbone and Jones-fracture surgery that cost him most of 2025. Doubs and Wicks are both gone — those vacated targets go to Reed, Watson and Golden.

TEAMS PICKING BEFORE YOU:
  pick 84 — team 12 has RB/RB/QB/WR/WR/QB, still needs TE, K, DEF
  pick 85 — team 12 has RB/RB/QB/WR/WR/QB, still needs TE, K, DEF

QUESTION: I am about to be on the clock at pick 86. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.
```

### 1c. Pick 110, round 10 — the literal string

```text
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 108 of 180, round 9. My next pick is 110, then 131 (21 picks apart).

RUN IN PROGRESS: WR

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: Derrick Henry (RB, 250 pts, bye 13); RB: Saquon Barkley (RB, 250 pts, bye 10); WR: Ladd McConkey (WR, 232 pts, bye 7); WR: EMPTY; TE: Sam LaPorta (TE, 199 pts, bye 6); FLEX: Breece Hall (RB, 214 pts, bye 13); K: EMPTY; DEF: Houston Defense (DEF, 336 pts, bye 8)

MY BENCH: J.K. Dobbins (RB, 162 pts, bye 10); Jordan Mason (RB, 156 pts, bye 6)

STARTERS FILLED: QB 1/1, RB 5/2, WR 1/2, TE 1/1, K 0/1, DEF 1/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Every player here has a real chance of reaching pick 110; the ones the teams in between will almost certainly take are already removed. Name a player from this list and nobody else.
- Dalton Kincaid (TE BUF, bye 7): 166 pts in this league, VOR 3, depth chart TE1, the other ADP market is 85 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 148, chance he reaches the pick I am writing about (110) is 97%, chance he is still there at my FOLLOWING pick (131) is 81%, composite 2, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Led ALL TEs at 2.79 YPRR — best mark by a TE with 40+ targets since Kittle in 2020. Also led in targets per route (0.27) and fantasy pts per route (0.70). Finished TE19 only because he ran a route on 44.2% of pass plays (40th). Beane publicly said the goal is more snaps. Healthy all summer.
- Justin Herbert (QB LAC, bye 7): 295 pts in this league, VOR 2, depth chart QB1, the other ADP market is 32 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 104.4, chance he reaches the pick I am writing about (110) is 34%, chance he is still there at my FOLLOWING pick (131) is 2%, composite 2
- Bo Nix (QB DEN, bye 10): 294 pts in this league, VOR 0, depth chart QB1, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 111.9, chance he reaches the pick I am writing about (110) is 56%, chance he is still there at my FOLLOWING pick (131) is 8%, composite 1
- Jake Ferguson (TE DAL, bye 14): 162 pts in this league, VOR -1, depth chart TE1, the other ADP market is 55 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 133.7, chance he reaches the pick I am writing about (110) is 91%, chance he is still there at my FOLLOWING pick (131) is 56%, composite 0
- Kyle Monangai (RB CHI, bye 10): 156 pts in this league, VOR 0, depth chart RB2, listed Questionable (Knee), he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 109.9, chance he reaches the pick I am writing about (110) is 50%, chance he is still there at my FOLLOWING pick (131) is 5%, composite 0
- Jaxson Dart (QB NYG, bye 8): 294 pts in this league, VOR 0, depth chart QB1, the other ADP market is 38 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 119.1, chance he reaches the pick I am writing about (110) is 79%, chance he is still there at my FOLLOWING pick (131) is 15%, composite 0, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Flashed as a rookie: 63.7% completions, 15 TD to 5 INT behind a shaky supporting cast.
- Brenton Strange (TE JAX, bye 7): 163 pts in this league, VOR 0, depth chart TE1, the other ADP market is 54 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 163.3, chance he reaches the pick I am writing about (110) is 100%, chance he is still there at my FOLLOWING pick (131) is 97%, composite -1, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: PFF late-round TE value. Held a 14% target share at 4.4 targets/gm in JAX and out-targeted BTJ in games with Washington and Meyers healthy.
- Isaiah Likely (TE NYG, bye 8): 160 pts in this league, VOR -4, depth chart TE1, the other ADP market is 49 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 136.4, chance he reaches the pick I am writing about (110) is 92%, chance he is still there at my FOLLOWING pick (131) is 62%, composite -2, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: In 9 career games without Andrews: 3.4 rec, 50.3 yds, 0.7 TD per game — a full-season pace of 58-856-11 that would have been TE2 in total PPR points. Top-8 in yards per catch and per target among 53 TEs with 100+ targets. 3yr/$40M, 5th-highest-paid TE. Reportedly Dart's favorite target.
- T.J. Hockenson (TE MIN, bye 6): 157 pts in this league, VOR -6, depth chart TE1, the other ADP market is 62 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 170.3, chance he reaches the pick I am writing about (110) is 99%, chance he is still there at my FOLLOWING pick (131) is 95%, composite -5
- Hunter Henry (TE NE, bye 11): 156 pts in this league, VOR -8, depth chart TE1, the other ADP market is 49 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 159.3, chance he reaches the pick I am writing about (110) is 100%, chance he is still there at my FOLLOWING pick (131) is 93%, composite -6
- Kyler Murray (QB MIN, bye 6): 282 pts in this league, VOR -11, depth chart QB1, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 132.5, chance he reaches the pick I am writing about (110) is 97%, chance he is still there at my FOLLOWING pick (131) is 55%, composite -7, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Best QB value on the board. Named MIN starter and his ADP never moved — still Rd 12. Never finished worse than QB12 in PPG before last yr's 5-game season; 7th among active QBs in career PPG. O'Connell's offenses ranked 3rd/5th/5th in QB passing points. 36.7 career rush yds/gm.
- Patrick Mahomes (QB KC, bye 5): 285 pts in this league, VOR -9, depth chart QB1, listed Questionable (Knee - ACL), he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 104.5, chance he reaches the pick I am writing about (110) is 34%, chance he is still there at my FOLLOWING pick (131) is 2%, composite -9

TEAMS PICKING BEFORE YOU:
  pick 108 — team 12 has RB/RB/QB/WR/WR/QB/RB/TE, still needs K, DEF
  pick 109 — team 12 has RB/RB/QB/WR/WR/QB/RB/TE, still needs K, DEF

QUESTION: I am about to be on the clock at pick 110. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.
```

---

## 2. Verdict on the user's diagnosis

> Diagnosis under test: *roster state is thin or absent relative to the candidate list.*

**CONFIRMED, and it is worse than "thin".** The evidence, all of it from the printed
payloads above.

**F-I2-1 — the roster is 5% of the payload and the candidate list is 73%.**
126 estimated tokens of roster against 1,860 of candidates at pick 86; 152 against 1,779
at pick 110. The model is handed fourteen times more text about twelve players it might
take than about the nine players it already owns and is supposed to be reasoning from.

**F-I2-2 — what is in those 126 tokens is a name list, not a roster state.**
`MY STARTERS` gives name, position, points and bye per slot. `STARTERS FILLED` gives
have/starters counts. That is the whole of it. Every one of the following is computed by
`analyze()` on the very same render and then **not sent**:

| known and not sent | where it already exists | why it decides a pick |
|---|---|---|
| the best body still on the board at each position | `A.avail`, one sort | the drop from the man in the slot is the actual "strength at position" the user asked for |
| what will still be there at the following pick, per position | `A.ctx.vona[pos].expected` (`expectedBestAvailable`) | this is the cost of waiting, in points, per position |
| tier and how many of that tier remain | `p.tier`, `p.tierLeft` | the number that decides whether you can wait a round |
| positional supply left, and how much of it is above replacement | `A.avail`, `A.board.replacement` | "there are 48 receivers left and none above replacement" is the whole argument |
| bye collisions among *starters* | `A.byeCounts`, `A.byePos` | byes are sent per player and never aggregated |
| picks remaining | `A.upcoming.length` | "K is 0/1 with 6 picks left" is urgency; "K 0/1" alone is not |
| bench slots used and available | `A.roster.benchMax` | decides whether a bench flier is even legal |
| the K and DEF floor rounds | `ctx.kFloorRound`, `ctx.defFloorRound` | without them an empty K slot reads as negligence rather than a deliberate deferral |
| the dated source of every research note | `p.source`, on all 84 annotated players | the note is sent; its provenance and date are stripped |
| whether the flex is open or closed | `E.openFlexSlots()` | inferable from the `FLEX:` line, never stated |

**F-I2-3 — the roster counts that *are* sent are misleading, and one repeated sentence is
simply false.**

- `STARTERS FILLED: RB 3/2` at pick 86 and `RB 5/2` at pick 110. Those come from
  `positionalNeed()`'s raw `have` count, which includes the flex and the bench. "5 of 2"
  is not a state a reader can act on, and it contradicts the `MY STARTERS` line directly
  above it, which shows two RB slots and a separate FLEX.
- Every one of the twelve candidate blocks at **both** states carries the sentence
  *"he CANNOT crack my starting lineup — I am already better at `<POS>`, so he is bench
  depth and nothing else."* Twelve of twelve, at both picks. It costs **316 estimated
  tokens per call** in pure repetition.
- At pick 86 that sentence is attached to **Jayden Reed**, a wide receiver, and reads
  *"I am already better at WR"* — while `MY STARTERS` two paragraphs above says
  **`WR: EMPTY`**. It is generated from `compDetail.marginal <= 0`, and `marginalVor()`
  returns 0 for Reed because the league-wide WR replacement level *is Jayden Reed*
  (`board.replacement.WR = { rank: 29, points: 200.66, name: "Jayden Reed" }`). The
  arithmetic is workstream I item 4; the *claim* is I2's, and it is the payload telling the
  model a plain falsehood about the user's roster. Severity **HIGH**: a model that has been
  told it cannot fill an empty slot will not fill it, which is exactly the behavior the
  user reported.

**F-I2-4 — at pick 110 the candidate list contains no player who can fill an open slot.**
WR2 is empty and K is empty. The twelve candidates are 5 TE, 4 QB, 2 RB and 1 more QB —
**zero WR** — under the instruction *"Name a player from this list and nobody else."* The
model has no legal answer that fills the hole it has just been shown. This is downstream of
the composite (workstream I) — the list is `sort(comp)` — but it is also a payload
composition question in its own right: the list is built from one ranking with no guarantee
that the positions the roster actually needs are represented at all.

**F-I2-5 — `TEAMS PICKING BEFORE YOU` is nearly all noise.**
At pick 86 it reads `still needs TE, K, DEF` for both rows; at pick 110, `still needs K,
DEF`. `teamsAhead()` computes shortage as `have[pos] < roster[pos]` with no reference to
the floor rounds every drafter obeys, so **every team in the league "needs" K and DEF on
every call until round 14**. Strip those and pick 110's entry becomes "team 12, short at
nothing they would take here" — which is the true and useful statement. The block also
prints the same team twice with its full roster string repeated, because a snake turn gives
one team both picks.

**F-I2-6 — duplication and dead weight in the candidate blocks.**
Each block spells out `chance he reaches the pick I am writing about (86) is 81%, chance he
is still there at my FOLLOWING pick (107) is 41%` — 26 tokens of scaffolding around two
numbers, twelve times. Tag glosses are printed in full every time the tag appears
(`SLEEPER (Going later in drafts than his projection says he should.)` five times at pick
110). Research notes are sent whole, up to 380 characters, with the source and date
removed.

**What the payload gets right, and should keep.** Two survival horizons rather than one.
The `blocked` filter and the `surv >= 0.25` filter with the under-six fallback. Naming the
following pick explicitly. The scoring-highlights line, which is the only place the boosted
D/ST tiers are explained. The instruction never to describe an available player as gone.
All of these survive into the proposal unchanged.

---

## 3. The proposed roster-state block, field by field

Per position, one line. All of it is already in `A` at render time; none of it needs a new
computation beyond one sort per position.

| field | source | format | why |
|---|---|---|---|
| filled / slots | `assignRoster(mine, rules).slots`, grouped by `pos`, **FLEX excluded** | `WR 1/2` | replaces the `RB 5/2` nonsense: starting slots only, flex counted once and separately |
| who is in each slot | `slot.player.name`, `.pts`, `.bye` | `Ladd McConkey 232 (bye 7)` | unchanged from today |
| empty count | slots with no player | `+ 1 EMPTY` | the hole, stated as a hole |
| best left at the position | `max(pts)` over `A.avail` filtered to `pos` | `best left Jayden Reed 201` | **the "strength at position" the user asked for.** Uses projected points, not composite — points is a fact the engine owns, composite is the number under repair |
| expected best at the following pick | `A.ctx.vona[pos].expected` | `expect 174 at 107` | the cost of waiting, per position, in points. Already computed for VONA and thrown away |
| flex occupancy | `openFlexSlots()` / the FLEX slot's player | `FLEX Breece Hall RB 214 — FLEX IS CLOSED` | states in words what today is only inferable |
| bench | `A.roster.bench`, `A.roster.benchMax` | `BENCH 2/6: Dobbins RB 162, Mason RB 156` | today the bench is a bare name list with no capacity |
| open starting slots, rolled up | derived from the above | `OPEN STARTING SLOTS: WR, K` | one line the model cannot miss |
| floor rounds on open slots | `ctx.kFloorRound`, `ctx.defFloorRound` | `— K is floored to round 14 and cannot be taken yet` | stops an empty K reading as an error |
| bye stack among starters | `A.byeCounts` + the slots | `week 13: 2 (Derrick Henry, Breece Hall) (I tolerate 3)` | today byes are per player and never added up |
| picks remaining | `A.upcoming.length` | in `WHERE I AM`: `6 picks left including this one` | turns "K 0/1" into urgency |

**Cost: 256 estimated tokens at pick 86, 270 at pick 110** — up from 126/152 today, so
about **+125 tokens**, or 5% of one current payload. The user's instinct that this is the
cheapest useful context in the whole thing is right: it costs one fifteenth of the
candidate list and it is the half of the decision the model currently cannot see.

A second block, `WHAT IS LEFT ON THE BOARD`, costs **216/217 tokens** and answers the
question the roster block raises — six lines, one per position: how many are left, how many
above replacement, the best one with his tier and how many remain in it, and the size of
the drop to the next tier.

---

## 4. The proposed payload, printed in full

Built by the harness's `proposal.js` from the same `A` object `analyze()` already returns.

| section | pick 86 | pick 110 |
|---|---:|---:|
| League / scoring / where I am | 146 | 146 |
| **MY DRAFT STYLE** (new — section 5b) | 126 | 126 |
| **MY ROSTER** | 256 | 270 |
| **WHAT IS LEFT ON THE BOARD** | 216 | 217 |
| BETWEEN NOW AND MY PICK | 43 | 48 |
| Candidates (8, under the reserve rule of section 11) | 583 | 507 |
| Question, answer shape, grounding rule | 392 | 393 |
| **Total user message** | **1,760** | **1,706** |
| Today | 2,541 | 2,495 |
| **Delta** | **−781 (−31%)** | **−789 (−32%)** |
| Plus `SYSTEM`, unchanged | 249 | 249 |
| **Total input per brief** | **2,009** vs 2,790 | **1,955** vs 2,744 |

**It is smaller than what ships today and it carries strictly more decision-relevant
fact.** The saving comes from four places, none of which is a fact being dropped:

1. Twelve candidates → eight, reserve-ruled so at least half can start (section 11). About
   −430 tokens, and the list gained four receivers at pick 110 where it had none.
2. The 316-token repeated "he CANNOT crack my starting lineup" paragraph → one compact
   phrase per candidate that also names the empty slot. About −250 tokens.
3. Pipe-delimited candidate lines instead of English scaffolding around every number
   (`there 81%@86/41%@107` in place of 26 tokens of prose). About −200 tokens.
4. Research notes truncated at a sentence boundary near 190 characters, with the **source
   and date added back**. Roughly neutral: shorter notes, provenance restored.
5. Against that, **+126 tokens of style block** (section 5b), which today is one sentence
   of tagline and nothing else.

**Latency.** Input is 24% smaller, which is worth perhaps a few hundred milliseconds of
prefill and no more. The real latency lever is the output, and the proposal *adds* a
situation read of up to 40 words (~55 tokens) while trimming the pick from 110 to 90 words
(~27 tokens). Net output +28 tokens, so **expect the two-part answer to be roughly 0.5 to 1
second slower than today's** on the same thinking budget. Section 6 says how to get that
back on re-asks. This is an estimate from token counts, not a measurement — measuring it
needs live calls, which are deferred pending the owner's approval, and workstream D holds
the latency budget and the `output_config.effort` lever that dwarfs everything here.

### 4a. Pick 86, proposed

```text
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, 15 rounds, snake, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

WHERE I AM: pick 84 of 180, round 7. My next pick is 86, then 107 (21 apart). 8 picks left including this one.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker. The default. Takes the best value on the board, leans toward positions you still need to start, and buys floor early and ceiling late.
  What it is doing to the composite this round: nothing at all — this style sets no overrides, so the composite below is the engine's own unmodified opinion. Do not credit or blame the style for any ranking here, and do not invent a style argument: there is not one to make.

MY ROSTER. "best left" is the best body still on the board at that position by this league's own scoring; "expect" is what the model thinks will still be there at my following pick.
  QB 1/1  Drake Maye 320 (bye 11) | best left Trevor Lawrence 301, expect 295 at 107
  RB 2/2  Derrick Henry 250 (bye 13), Saquon Barkley 250 (bye 10) | best left Rico Dowdle 163, expect 155 at 107
  WR 1/2  Ladd McConkey 232 (bye 7) + 1 EMPTY | best left Jayden Reed 201, expect 174 at 107
  TE 1/1  Sam LaPorta 199 (bye 6) | best left Tucker Kraft 177, expect 171 at 107
  K 0/1  1 EMPTY | best left Brandon Aubrey 148, expect 148 at 107
  DEF 1/1  Houston Defense 336 (bye 8) | best left Seattle Defense 335, expect 318 at 107
  FLEX  Breece Hall RB 214 (bye 13) — FLEX IS CLOSED
  BENCH 0/6
  OPEN STARTING SLOTS: WR, K — K is floored to round 14 and cannot be taken yet
  STARTERS SHARING A BYE: week 13: 2 (Derrick Henry, Breece Hall) (I tolerate 3)

WHAT IS LEFT ON THE BOARD
  QB: 21 left, 3 above replacement (294 pts). Best Trevor Lawrence 301 (tier 2, 5 left in it); next tier best 285 (-17)
  RB: 39 left, 2 above replacement (157 pts). Best Rico Dowdle 163 (tier 6, 9 left in it); next tier best 139 (-24)
  WR: 57 left, 0 above replacement (201 pts). Best Jayden Reed 201 (tier 5, 1 left in it); next tier best 180 (-21)
  TE: 19 left, 5 above replacement (163 pts). Best Tucker Kraft 177 (tier 3, 10 left in it); next tier best 153 (-24)
  K: 23 left, 11 above replacement (128 pts). Best Brandon Aubrey 148 (tier 1, 5 left in it); next tier best 139 (-9)
  DEF: 25 left, 10 above replacement (275 pts). Best Seattle Defense 335 (tier 1, 3 left in it); next tier best 312 (-22)

BETWEEN NOW AND MY PICK
  picks 84, 85 — team 12 (RB/RB/QB/WR/WR/QB), short at TE/DEF
  Last 8 picks: WR 3, TE 2, RB 1, QB 1, DEF 1

CANDIDATES — likely to still be there at pick 86. Name a player from this list and nobody else.
- Jayden Reed WR GB bye11 | 201 pts | tier 5 (1 left) | +201 — fills an open WR slot | dep SWR2 | ADP 91.1 | there 71%@86/4%@107 | comp 0 | RISING
    note (FantasyPros 8/26 + RotoBaller): Up ~7 spots returning to health from a broken collarbone and Jones-fracture surgery that cost him most of 2025.
- Tucker Kraft TE GB bye11 | 177 pts | tier 3 (10 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep TE1 | Questionable (Knee - ACL) | ADP 102.6 | 2nd market +48 on him | there 81%@86/41%@107 | comp 6 | BREAKOUT
    note (PFF 8/26): His 9.3 yds/target led all TEs by a full 1.5 yards over the next-closest player. The only thing missing was volume. Even with an efficiency dip, more work is a clean trade.
- Trevor Lawrence QB JAX bye7 | 301 pts | tier 2 (5 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep QB1 | ADP 92.5 | there 71%@86/11%@107 | comp 5 | CONVICTION
    note (Erickson 9/4): From Wk5 on he outscored every player at every position at 23 pts/gm; ~28 with a full WR room. Top-5 in PPG, 1st in expected fantasy pts/gm.
- Kyle Pitts Sr. TE ATL bye11 | 174 pts | tier 3 (10 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep TE1 | ADP 81.6 | there 35%@86/1%@107 | comp 4
- Caleb Williams QB CHI bye10 | 299 pts | tier 2 (5 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep QB1 | ADP 87.2 | 2nd market +26 on him | there 54%@86/5%@107 | comp 1
- Jordan Addison WR MIN bye6 | 174 pts | tier 6 (10 left) | +174 — fills an open WR slot | dep RWR2 | ADP 96.3 | there 86%@86/13%@107 | comp -27
- Josh Downs WR IND bye13 | 175 pts | tier 6 (10 left) | +175 — fills an open WR slot | dep SWR1 | Questionable (Undisclosed) | ADP 91.5 | there 72%@86/5%@107 | comp -27
- Matthew Golden WR GB bye11 | 173 pts | tier 6 (10 left) | +173 — fills an open WR slot | dep RWR3 | ADP 105.7 | there 97%@86/45%@107 | comp -30

QUESTION: I am on deck for pick 86. Answer in two labeled parts and nothing else.

PART A — SITUATION. Two sentences, 40 words maximum. Where this roster stands, which starting slots are still open, and what the next two rounds have to accomplish. Use the drop between the man in the slot and the best left at that position to say where waiting costs the most points.

PART B — THE PICK.
Line 1: the player's name, and nothing else on that line.
Then two or three sentences of why, in this order: what he does for an open slot or an upgrade in points, what the supply and survival numbers say about waiting, and the one thing the research note or depth chart adds.
Last line: start it with "If gone:" and name one fallback in a single clause. No survival percentages on that line.
PART B under 90 words.

GROUNDING RULE. Every claim you make must trace to one of the facts above: the projected points, the tier and how many of it are left, the counts of who is left above replacement, the survival percentages, the ADP and its movement, the depth-chart slot, the injury designation, the bye weeks, the research note and its dated source, or what the teams picking before me are short at. If a claim cannot point at one of those, do not make it. Do not bring in rankings, projections or news from outside this message, and do not recompute any number here.

Everyone in the candidate list is on the board right now. A survival percentage is the chance he lasts until my pick, never a report that he has gone.
```

### 4b. Pick 110, proposed

```text
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, 15 rounds, snake, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

WHERE I AM: pick 108 of 180, round 9. My next pick is 110, then 131 (21 apart). 6 picks left including this one.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker. The default. Takes the best value on the board, leans toward positions you still need to start, and buys floor early and ceiling late.
  What it is doing to the composite this round: nothing at all — this style sets no overrides, so the composite below is the engine's own unmodified opinion. Do not credit or blame the style for any ranking here, and do not invent a style argument: there is not one to make.

MY ROSTER. "best left" is the best body still on the board at that position by this league's own scoring; "expect" is what the model thinks will still be there at my following pick.
  QB 1/1  Drake Maye 320 (bye 11) | best left Caleb Williams 299, expect 283 at 131
  RB 2/2  Derrick Henry 250 (bye 13), Saquon Barkley 250 (bye 10) | best left Jonathon Brooks 157, expect 135 at 131
  WR 1/2  Ladd McConkey 232 (bye 7) + 1 EMPTY | best left Jordan Addison 174, expect 159 at 131
  TE 1/1  Sam LaPorta 199 (bye 6) | best left Dalton Kincaid 166, expect 165 at 131
  K 0/1  1 EMPTY | best left Brandon Aubrey 148, expect 147 at 131
  DEF 1/1  Houston Defense 336 (bye 8) | best left Denver Defense 334, expect 310 at 131
  FLEX  Breece Hall RB 214 (bye 13) — FLEX IS CLOSED
  BENCH 2/6: J.K. Dobbins RB 162, Jordan Mason RB 156
  OPEN STARTING SLOTS: WR, K — K is floored to round 14 and cannot be taken yet
  STARTERS SHARING A BYE: week 13: 2 (Derrick Henry, Breece Hall) (I tolerate 3)

WHAT IS LEFT ON THE BOARD
  QB: 20 left, 2 above replacement (294 pts). Best Caleb Williams 299 (tier 2, 4 left in it); next tier best 285 (-14)
  RB: 32 left, 0 above replacement (157 pts). Best Jonathon Brooks 157 (tier 6, 3 left in it); next tier best 139 (-18)
  WR: 48 left, 0 above replacement (201 pts). Best Jordan Addison 174 (tier 6, 4 left in it); next tier best 168 (-6)
  TE: 14 left, 1 above replacement (163 pts). Best Dalton Kincaid 166 (tier 3, 6 left in it); next tier best 153 (-13)
  K: 23 left, 11 above replacement (128 pts). Best Brandon Aubrey 148 (tier 1, 5 left in it); next tier best 139 (-9)
  DEF: 23 left, 8 above replacement (275 pts). Best Denver Defense 334 (tier 1, 1 left in it); next tier best 312 (-21)

BETWEEN NOW AND MY PICK
  picks 108, 109 — team 12 (RB/RB/QB/WR/WR/QB/RB/TE), short at DEF
  Last 8 picks: WR 5, TE 1, DEF 1, RB 1 — WR RUN IN PROGRESS

CANDIDATES — likely to still be there at pick 110. Name a player from this list and nobody else.
- Matthew Golden WR GB bye11 | 173 pts | tier 6 (4 left) | +173 — fills an open WR slot | dep RWR3 | ADP 105.7 | there 34%@110/1%@131 | comp -26
- Dalton Kincaid TE BUF bye7 | 166 pts | tier 3 (6 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep TE1 | ADP 148 | 2nd market +85 on him | there 97%@110/81%@131 | comp 2 | SLEEPER
    note (Smola/Draft Sharks 8/31): Led ALL TEs at 2.79 YPRR — best mark by a TE with 40+ targets since Kittle in 2020. Also led in targets per route (0.27) and fantasy pts per route (0.70).
- Justin Herbert QB LAC bye7 | 295 pts | tier 2 (4 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep QB1 | ADP 104.4 | 2nd market +32 on him | there 34%@110/2%@131 | comp 2
- Bo Nix QB DEN bye10 | 294 pts | tier 2 (4 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep QB1 | ADP 111.9 | there 56%@110/8%@131 | comp 1
- Jake Ferguson TE DAL bye14 | 162 pts | tier 3 (6 left) | +0 — DEPTH ONLY, cannot start; WR still EMPTY | dep TE1 | ADP 133.7 | 2nd market +55 on him | there 91%@110/56%@131 | comp 0
- Makai Lemon WR PHI bye10 | 171 pts | tier 6 (4 left) | +171 — fills an open WR slot | dep SWR3 | ADP 132.1 | 2nd market +62 on him | there 95%@110/53%@131 | comp -25
- Jalen Coker WR CAR bye5 | 168 pts | tier 7 (7 left) | +168 — fills an open WR slot | dep SWR2 | ADP 120 | there 85%@110/13%@131 | comp -30
- Xavier Worthy WR KC bye5 | 164 pts | tier 7 (7 left) | +164 — fills an open WR slot | dep RWR2 | ADP 105.6 | there 30%@110/0%@131 | comp -31 | SLEEPER
    note (PFF WR piece): PFF late-round option with a path to increased production.

QUESTION: I am on deck for pick 110. Answer in two labeled parts and nothing else.

PART A — SITUATION. Two sentences, 40 words maximum. Where this roster stands, which starting slots are still open, and what the next two rounds have to accomplish. Use the drop between the man in the slot and the best left at that position to say where waiting costs the most points.

PART B — THE PICK.
Line 1: the player's name, and nothing else on that line.
Then two or three sentences of why, in this order: what he does for an open slot or an upgrade in points, what the supply and survival numbers say about waiting, and the one thing the research note or depth chart adds.
Last line: start it with "If gone:" and name one fallback in a single clause. No survival percentages on that line.
PART B under 90 words.

GROUNDING RULE. Every claim you make must trace to one of the facts above: the projected points, the tier and how many of it are left, the counts of who is left above replacement, the survival percentages, the ADP and its movement, the depth-chart slot, the injury designation, the bye weeks, the research note and its dated source, or what the teams picking before me are short at. If a claim cannot point at one of those, do not make it. Do not bring in rankings, projections or news from outside this message, and do not recompute any number here.

Everyone in the candidate list is on the board right now. A survival percentage is the chance he lasts until my pick, never a report that he has gone.
```

Read as a person, the difference at pick 110 is the whole workstream. Today the model is
told `WR: EMPTY` and then handed five tight ends and four quarterbacks and told to pick one
of them. In the proposal it is told WR is open, that McConkey 232 is the only receiver on
the roster, that the best receiver left is 174 and the model expects 159 by pick 131, that
48 receivers remain and **none** is above the 201-point replacement level, that a WR run is
in progress (5 of the last 8 picks), and Matthew Golden is in the candidate list carrying
`+173 — fills an open WR slot`. That is a decision a person can make, and every number in
it is one the app already computed and already threw away.

---

## 5. The user's constraint: what actually has to be in every call

> "We can't just ship the entire draft and everyone that's been picked on every single AI call."

They are right, and the good news is that **the app never did**. `claudeContext()` sends
neither the pick log nor the opponent rosters; the only opponent information in the payload
is the two `TEAMS PICKING BEFORE YOU` rows. The 180 picks and the eleven other rosters were
never in it. So the constraint is already satisfied — what is wrong is the *distribution* of
the budget that was spent instead.

Here is the full inventory and its disposition.

| what exists | in every call? | form |
|---|---|---|
| **My roster, slot by slot** | **yes** | 11 lines. Changes by one row per pick |
| **My open starting slots and the flex** | **yes** | one rolled-up line |
| **Best left, and expected-best-at-next-pick, per position** | **yes** | 6 numbers, on the roster lines |
| **Positional supply left + tier cliff** | **yes** | 6 lines, one per position — counts and one name, never a list |
| **Teams between now and my pick, and what they are short at** | **yes** | one line per distinct team, floor-filtered |
| **Position mix of the last 8 picks + run flag** | **yes** | one line. This is the whole draft, summarized to six integers |
| **Candidate list** | **yes** | 8, plus a forced entry per open starting slot |
| League rules and scoring deltas | yes | unchanged, ~90 tokens; cheap, and it is what makes the D/ST thesis legible |
| Pick numbers, round, picks remaining, bench capacity | yes | one line |
| **The 180-pick log** | **no** | already absent. Summarized to the last-8 position mix and the run flag |
| **The other 11 rosters in full** | **no** | already absent. Summarized to the position string of the teams picking before you, which is the only part that can change your pick |
| **Every player's research note** | **no** | candidates only, 190 characters, with the source and date |
| Your own draft history, round by round | no | the roster *is* the summary of it; the order it arrived in changes nothing |
| Anything about teams picking *after* you | no | they cannot take a player before you do |

**The summarization scheme, stated as a rule.** Anything that is a *list* over the whole
league collapses to a *count plus one name*. Six integers (the last-8 position mix) replace
85 picks. Six lines (supply per position) replace 180 available players. One position
string per team ahead replaces eleven rosters. The only place a list survives is the
candidate block, because naming a player is the answer the brief exists to give.

**One composition rule that is not a summarization.** The candidate list must contain the
best available body at every open starting slot, added after the composite sort if the sort
did not produce one. I want to be explicit that this is **not** the forbidden fix. It is a
rule about what the model is permitted to see, in the candidate-selection code, so that
"name a player from this list" cannot be a trap. It contains no language telling the model
to doubt the ranking; the composite ordering is still printed on every line as `comp`. When
workstream I lands, this rule will usually be a no-op — and at pick 110 today it is the only
thing in the payload that can fill WR2.

---

## 6. Splitting the ask, and whether to cache the situation read

**Two labeled parts, one call.** A second call cannot be afforded: the client times out at
30 seconds, the brief is written two picks ahead on a two-minute clock, and two sequential
calls put the p95 past the pick. Two parallel calls double the tokens and both still have
to land. The answer shape becomes:

```
PART A — SITUATION. Two sentences, 40 words maximum. Where this roster stands, which
starting slots are still open, and what the next two rounds have to accomplish. Use the
drop between the man in the slot and the best left at that position to say where waiting
costs the most points.

PART B — THE PICK.
Line 1: the player's name, and nothing else on that line.
Then two or three sentences of why, in this order: what he does for an open slot or an
upgrade in points, what the supply and survival numbers say about waiting, and the one
thing the research note or depth chart adds.
Last line: start it with "If gone:" and name one fallback in a single clause. No survival
percentages on that line.
PART B under 90 words.
```

`Line 1` of PART B stays a bare name so `playerIn()` / `briefPlayer()` keep working — but
`renderBrief()` takes `lines.shift()` on the whole answer today, so **the client must peel
PART A off before taking the head line**, or the Draft button binds to nothing. That is a
real, small change and it is in the diff at 8.8. `briefStale()` and the "If gone:" fallback
matching are otherwise unaffected.

**Caching: yes, but keyed on the roster, not on the pick.** The situation read is a function
of the roster, and the roster changes exactly once per user turn. Between the user's turns
the brief can be re-asked three more times — twice by `briefStale()` when the named player
goes, and once whenever the user presses "Ask again". Those re-asks are pure repetition of
the situation.

Recommendation: cache PART A keyed on a roster fingerprint (the sorted names of `A.mine` is
sufficient and cheap), and on a re-ask feed the cached text back into the prompt with:

```
PART A — SITUATION. This is what you told me at my last pick:
  "<cached text>"
Reprint it unchanged unless a number above has moved it, in which case give the one
sentence that changed.
```

Measured: this costs **+25 input tokens** (1,760 → 1,785 at pick 86) and saves roughly 55
output tokens plus the reasoning behind them on every re-ask. Output is 5× the price of
input and is the thing the user waits on, so that is the right trade — and it also means the
situation read on screen does not silently reword itself between a brief and its re-ask,
which would read as the app changing its mind.

Display: render PART A above the pick in the brief card, in the eyebrow's voice, and leave
it on screen while a re-ask spinner runs. The user then has "this is where we're at"
visible continuously with the pick swapping underneath it, which is the shape they asked
for.

**What I would not do:** a separate periodic "situation" call on a timer. It is a third
network path to fail on draft night, for a paragraph that changes fifteen times in three
hours.

---

## 7. What the app genuinely knows, and the rule that binds every claim to it

### 7a. The enumeration

Facts with a definite provenance in the data or the engine. Coverage counted from
`ff/data/players.js` (267 players).

**Per player**

| fact | field / function | coverage | provenance |
|---|---|---|---|
| projected points in *this league's* rules | `customPoints()` → `p.pts` | 267 | the engine, from Sleeper projections; D/ST and K modeled |
| value over replacement | `p.vor`, `board.replacement[pos]` | 267 | engine |
| what he adds to the lineup I can field today | `lineupPoints(mine+[p]) − lineupPoints(mine)` | 267 | `assignRoster` arithmetic |
| tier, and how many of that tier are left | `p.tier` (Fisher), `p.tierLeft` | 267 | engine |
| survival to my next pick and to the one after | `survival(p, pick)` | 267 | normal CDF on ADP with `p.adp_sd` |
| ADP and its spread | `p.adp`, `p.adp_sd` | 267 | FFC 12-team PPR mocks, 7,681–7,848 drafts, Aug 27 – Sep 4 |
| second-market residual | `p.adpResid` | 205 | Sleeper ADP, de-drifted |
| real Yahoo draft position + 7-day movement | `p.yadp`, `p.ytrend` | only if the user pasted it | Yahoo draft analysis, standard scoring |
| depth-chart slot | `p.depth`, `p.depthPos` | 216 | Sleeper players feed |
| injury designation and body part | `p.injury`, `p.injuryPart` | 51 | Sleeper players feed |
| bye week | `p.bye` | 267 | data |
| research note **and its dated source** | `p.note`, `p.source` | 84 | named analysts, 7/29 – 9/4 |
| research tag | `p.tag` → `E.TAG_LABEL` | 74 | research board |
| ceiling / risk grade | `p.ceiling`, `p.risk` | **74 only** | research board |
| team | `p.team` | 267 | data |

**Per roster / per state**

| fact | source |
|---|---|
| every starting slot and who is in it | `assignRoster()` |
| open starting slots, and whether the flex is open | `assignRoster()`, `openFlexSlots()` |
| bench occupancy and capacity | `assignRoster()`, `rules.roster.BN` |
| bye collisions among starters, and the tolerance | `A.byeCounts`, `S.league.byeTolerance` |
| picks remaining and their numbers | `myUpcoming()` |
| K and DEF floor rounds | `ctx.kFloorRound`, `ctx.defFloorRound` |
| depth caps, and who is blocked | `depthCap()`, `compDetail.blocked` |
| best available and expected-best-at-next-pick per position | `A.avail`, `expectedBestAvailable()` |
| positional supply left, and how much is above replacement | `A.avail`, `board.replacement` |
| position mix of the last 8 picks, and any run | `detectRuns()` |
| what the teams picking before me are short at | `teamsAhead()` |
| the league's scoring deltas | `scoringHighlights()` |
| the active style and what it moved | `activeKnobs()`, `styleEffect()` |

**Explicitly NOT known, and therefore not citable.** Strength of schedule (`playoffWeeks`
is parsed and the engine ignores it). Target share, snap share, red-zone share. Vegas
totals. Expert consensus rank. Games missed, age, draft capital. Injury *return timelines* —
only the designation. Games played: `gp` is 18 for **every** player including six on
IR/PUP/exempt, so nothing may cite availability. Ceiling and risk for the 193 unannotated
players — the engine's adjustment there is zero, and a claim about a player's floor or
upside that is not one of the 74 is a guess.

### 7b. The prompt language

Added to the user message, after the answer shape:

```
GROUNDING RULE. Every claim you make must trace to one of the facts above: the projected
points, the tier and how many of it are left, the counts of who is left above replacement,
the survival percentages, the ADP and its movement, the depth-chart slot, the injury
designation, the bye weeks, the research note and its dated source, or what the teams
picking before me are short at. If a claim cannot point at one of those, do not make it.
Do not bring in rankings, projections or news from outside this message, and do not
recompute any number here.
```

And two sentences replacing the corresponding lines in `SYSTEM`:

```
Everything you need is in the message, including the state of the user's own roster; argue
from those numbers and from the dated research notes and from nothing else, because you
have no rankings, news or projections of your own that are newer or better than what you
have been given. Where the message is silent, say it is silent rather than filling the gap.
```

Note what this deliberately does *not* say. It does not say the ranking may be wrong, it
does not tell the model to check the composite against the roster, and it does not ask it
to prefer an open slot over the board's number one. See section 9.

---

## 8. Proposed diffs — not applied

`app.js` is being edited by another session and every line number in the review prompt is
already stale, so these are given as whole-function replacements against the current
working tree rather than line-anchored hunks. Three new functions, two rewrites, one small
change in `renderBrief()`, two sentences in `SYSTEM`. `engine.js` is **not** touched by
this workstream.

Two further diffs live with the findings that motivate them and are part of the same
change: **`styleBlock()` in section 10b** (the style block, which replaces the
`MY DRAFT STYLE` clause in 8.6) and **the reserve rule in section 11** (which sits inside
the candidate selection of 8.5), plus **`briefVoid()` in section 12c** (which replaces
`briefStale()`).

### 8.1 `engine.js` — nothing

No change. `lineupPoints`, `openFlexSlots`, `expectedBestAvailable`, `assignRoster` and
`TAG_LABEL` are all already on the public API.

### 8.2 `app.js` — new: `rosterBlock()`

```js
/**
 * The half of the decision the payload could not see. Every number here is
 * already on `A` when this runs; the only new work is one sort per position.
 *
 * "best left" is projected points, not composite. Points is what the scoring
 * engine owns outright; composite is a judgment on top of it, and the brief
 * gets that separately on every candidate line. A roster block that ranked the
 * board would be two opinions where one fact belongs.
 */
function rosterBlock() {
  var R = S.league.rules.roster, POS = ["QB", "RB", "WR", "TE", "K", "DEF"];
  var slotsBy = {}, flex = null;
  A.roster.slots.forEach(function (s) {
    if (s.pos === "FLEX") { flex = s; return; }
    (slotsBy[s.pos] = slotsBy[s.pos] || []).push(s);
  });
  var bestLeft = {};
  POS.forEach(function (pos) {
    bestLeft[pos] = A.avail.filter(function (p) { return p.pos === pos; })
      .sort(function (a, b) { return b.pts - a.pts; })[0] || null;
  });

  var open = [], lines = POS.filter(function (pos) { return (R[pos] || 0) > 0; })
    .map(function (pos) {
      var ss = slotsBy[pos] || [];
      var got = ss.filter(function (s) { return s.player; });
      var empty = ss.length - got.length;
      if (empty) open.push(pos + (empty > 1 ? " x" + empty : ""));
      var b = bestLeft[pos];
      var later = A.ctx.vona && A.ctx.vona[pos] ? A.ctx.vona[pos].expected : null;
      return "  " + pos + " " + got.length + "/" + ss.length + "  " +
        got.map(function (s) {
          return s.player.name + " " + Math.round(s.player.pts) + " (bye " + s.player.bye + ")";
        }).join(", ") +
        (empty ? (got.length ? " + " : "") + empty + " EMPTY" : "") +
        (b ? " | best left " + b.name + " " + Math.round(b.pts) +
             (later != null ? ", expect " + Math.round(later) + " at " +
              (A.myAfter || A.myNext) : "")
           : " | nothing left");
    });

  if (flex) lines.push("  FLEX  " + (flex.player
    ? flex.player.name + " " + flex.player.pos + " " + Math.round(flex.player.pts) +
      " (bye " + flex.player.bye + ") — FLEX IS CLOSED"
    : "EMPTY — FLEX IS OPEN to " + (R.flexEligible || ["RB","WR","TE"]).join("/")));
  if (flex && !flex.player) open.push("FLEX");

  var bench = A.roster.bench || [];
  lines.push("  BENCH " + bench.length + "/" + (A.roster.benchMax || 6) +
    (bench.length ? ": " + bench.map(function (p) {
      return p.name + " " + p.pos + " " + Math.round(p.pts);
    }).join(", ") : ""));

  // An empty K slot in round 8 is a deliberate deferral, not a hole. Saying so
  // is the difference between the model filling it four rounds early and the
  // model never mentioning it at all.
  var kFloor = Math.max(1, S.league.rounds - 1), dFloor = S.league.defFloorRound || 7;
  var floors = [];
  if (open.indexOf("K") >= 0 && A.onClock.round < kFloor)
    floors.push("K is floored to round " + kFloor + " and cannot be taken yet");
  if (open.indexOf("DEF") >= 0 && A.onClock.round < dFloor)
    floors.push("DEF is floored to round " + dFloor);
  lines.push("  OPEN STARTING SLOTS: " +
    (open.join(", ") || "none — every slot filled") +
    (floors.length ? " — " + floors.join("; ") : ""));

  var byes = Object.keys(A.byeCounts).filter(function (w) { return A.byeCounts[w] >= 2; })
    .sort(function (a, b) { return A.byeCounts[b] - A.byeCounts[a]; })
    .map(function (w) {
      return "week " + w + ": " + A.byeCounts[w] + " (" + A.roster.slots
        .filter(function (s) { return s.player && String(s.player.bye) === String(w); })
        .map(function (s) { return s.player.name; }).join(", ") + ")";
    });
  lines.push("  STARTERS SHARING A BYE: " + (byes.join("; ") || "none") +
    " (I tolerate " + (S.league.byeTolerance || 3) + ")");

  return "MY ROSTER. \"best left\" is the best body still on the board at that position " +
    "by this league's own scoring; \"expect\" is what the model thinks will still be " +
    "there at my following pick.\n" + lines.join("\n");
}
```

### 8.3 `app.js` — new: `supplyBlock()`

```js
/**
 * What is left, as counts. This is where the 180-pick log and the eleven other
 * rosters go: nobody needs to read them to know that 48 receivers remain and
 * none of them is above replacement.
 */
function supplyBlock() {
  return "WHAT IS LEFT ON THE BOARD\n" +
    ["QB", "RB", "WR", "TE", "K", "DEF"].map(function (pos) {
      var pool = A.avail.filter(function (p) { return p.pos === pos; })
                        .sort(function (a, b) { return b.pts - a.pts; });
      if (!pool.length) return "  " + pos + ": none left";
      var repl = ((A.board.replacement[pos]) || {}).points || 0;
      var b = pool[0];
      var inTier = pool.filter(function (p) { return p.tier === b.tier; }).length;
      var next = pool.filter(function (p) { return p.tier > b.tier; })[0];
      return "  " + pos + ": " + pool.length + " left, " +
        pool.filter(function (p) { return p.pts > repl; }).length +
        " above replacement (" + Math.round(repl) + " pts). Best " + b.name + " " +
        Math.round(b.pts) + " (tier " + b.tier + ", " + inTier + " left in it)" +
        (next ? "; next tier best " + Math.round(next.pts) + " (" +
                Math.round(next.pts - b.pts) + ")" : "");
    }).join("\n");
}
```

### 8.4 `app.js` — rewrite: `teamsAheadBlock()`, replacing the inline block in `briefQuestion()`

```js
/**
 * One line per distinct team, not per pick: a snake turn hands the same team
 * both picks, and printing its roster twice says nothing the once did not.
 *
 * And a team is not "short at K" in round 9. `teamsAhead()` measures shortage
 * against the roster, which makes every team in the league short at K and DEF
 * on every call until round 14 — tokens spent on a fact that is true of
 * everybody and therefore tells you nothing.
 */
function teamsAheadBlock() {
  if (A.myNext <= A.cur)
    return "BETWEEN NOW AND MY PICK\n  I am on the clock now.\n" + runLine();
  var byTeam = {};
  teamsAhead().forEach(function (t) {
    (byTeam[t.slot] = byTeam[t.slot] || { picks: [], roster: t.roster, needs: t.needs })
      .picks.push(t.pick);
  });
  var round = A.onClock.round;
  var kFloor = Math.max(1, S.league.rounds - 1), dFloor = S.league.defFloorRound || 7;
  var rows = Object.keys(byTeam).map(function (slot) {
    var t = byTeam[slot];
    var needs = t.needs.split(", ").filter(function (n) {
      if (n === "K") return round >= kFloor;
      if (n === "DEF") return round >= dFloor;
      return n && n !== "starters full";
    });
    return "  pick" + (t.picks.length > 1 ? "s " : " ") + t.picks.join(", ") +
      " — team " + slot + " (" + t.roster + "), short at " +
      (needs.length ? needs.join("/") : "nothing they would take here");
  });
  return "BETWEEN NOW AND MY PICK\n" + rows.join("\n") + "\n" + runLine();
}

/** The whole draft, summarized to six integers. */
function runLine() {
  var c = A.runInfo.counts || {};
  return "  Last " + (A.runInfo.window || 8) + " picks: " +
    Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })
      .map(function (k) { return k + " " + c[k]; }).join(", ") +
    (Object.keys(A.runInfo.runs).length
      ? " — " + Object.keys(A.runInfo.runs).join("/") + " RUN IN PROGRESS" : "");
}
```

### 8.5 `app.js` — rewrite: the candidate line inside `claudeContext()`

The pool, the `blocked` filter, the `surv >= 0.25` filter and the under-six fallback are
**unchanged**. Three things change: 12 → 8, the slot-coverage guarantee, and the line
format.

```js
  var top = live.sort(function (a, b) { return b.comp - a.comp; }).slice(0, 8);

  // Coverage. "Name a player from this list and nobody else" is a trap if the
  // list cannot fill the slot the roster block has just said is empty — at
  // pick 110 of the reported draft it held five tight ends, four quarterbacks
  // and no receiver at all, with WR2 open. This is a rule about what the model
  // is allowed to see, not an instruction to distrust the ranking: the
  // composite is still printed on every line, and once the composite prices an
  // empty starting slot correctly this will almost always be a no-op.
  var seen = {}; top.forEach(function (p) { seen[p.name] = true; });
  openStartingPositions().forEach(function (pos) {
    var b = live.filter(function (p) { return p.pos === pos && !seen[p.name]; })
                .sort(function (a, b2) { return b2.pts - a.pts; })[0];
    if (b) { top.push(b); seen[b.name] = true; }
  });

  var lines = top.map(function (p) {
    var bits = [Math.round(p.pts) + " pts", "tier " + p.tier + " (" + p.tierLeft + " left)"];

    // What he adds to the lineup I can field TODAY: his full points into an
    // empty slot, the upgrade over the incumbent into a filled one, zero if he
    // is worse. This is assignRoster arithmetic and nothing else — it does not
    // subtract a replacement body, which is why it cannot say "I am already
    // better at WR" about a receiver going into an empty WR2.
    var add = Math.round(E.lineupPoints(A.mine.concat([p]), S.league.rules) -
                         E.lineupPoints(A.mine, S.league.rules));
    var opens = openStartingPositions().indexOf(p.pos) >= 0;
    bits.push(opens ? "+" + add + " — fills an open " + p.pos + " slot"
            : add > 0 ? "+" + add + " over the " + p.pos + " in my slot"
                      : "+0 — bench only, my " + p.pos + "s are better");

    if (p.depth) bits.push("dep " + (p.depthPos || p.pos) + p.depth);
    if (p.injury) bits.push(p.injury + (p.injuryPart ? " (" + p.injuryPart + ")" : ""));
    bits.push("ADP " + p.adp + (p.yadp != null ? "/Yahoo " + p.yadp : ""));
    if (p.ytrend != null && Math.abs(p.ytrend) >= 1)
      bits.push((p.ytrend > 0 ? "+" : "") + p.ytrend + " picks in 7d");
    if (p.adpResid != null && Math.abs(p.adpResid) >= 25)
      bits.push("2nd market " + (p.adpResid < 0 ? "+" : "-") +
                Math.round(Math.abs(p.adpResid)) + " on him");
    bits.push("there " + (waiting ? Math.round(p.surv * 100) + "%@" + A.myNext + "/" : "") +
              Math.round(p.survNext * 100) + "%@" + (A.myAfter || A.myNext));
    bits.push("comp " + Math.round(p.comp));
    if (A.byeCounts[p.bye] >= (S.league.byeTolerance || 3)) bits.push("bye clash wk " + p.bye);
    if (p.tag) bits.push(E.TAG_LABEL[p.tag] || p.tag);
    var fx = styleEffect(p);
    if (fx && (Math.abs(fx.delta) >= 1 || fx.move))
      bits.push("style " + (fx.delta >= 0 ? "+" : "") + Math.round(fx.delta) +
                ", rank " + fx.from + "→" + fx.to);

    var line = "- " + p.name + " " + p.pos + " " + p.team + " bye" + p.bye +
               " | " + bits.join(" | ");
    if (p.note) {
      // The note's date is the fact that makes it usable four days before the
      // season. Sending the note and dropping the source was sending an
      // assertion with no provenance.
      var note = p.note;
      if (note.length > 190) {
        var cut = note.slice(0, 190), dot = cut.lastIndexOf(". ");
        note = dot > 60 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, "") + "…";
      }
      line += "\n    note (" + (p.source || "research") + "): " + note;
    }
    return line;
  }).join("\n");
```

with the helper:

```js
/** Starting positions with an empty slot right now. FLEX is not a position. */
function openStartingPositions() {
  var out = [];
  A.roster.slots.forEach(function (s) {
    if (!s.player && s.pos !== "FLEX" && out.indexOf(s.pos) < 0) out.push(s.pos);
  });
  return out;
}
```

### 8.6 `app.js` — `claudeContext()` assembly

`MY STARTERS` / `MY BENCH` / `STARTERS FILLED` and the "Compare any candidate against the
man already in that slot" paragraph are **replaced** by `rosterBlock()` + `supplyBlock()`.
The paragraph goes because the roster block now states the comparison as numbers rather
than asking for it as an attitude.

```js
  return [
    "LEAGUE: " + (S.league.rules.name || "custom") + ", " + S.league.teams + " teams, " +
      S.league.rounds + " rounds, snake, I pick at slot " + S.league.slot + ".",
    "SCORING THAT DIFFERS FROM DEFAULT: " + scoringHighlights(),
    "WHERE I AM: pick " + A.cur + " of " + (S.league.teams * S.league.rounds) +
      ", round " + A.onClock.round + ". My next pick is " + A.myNext +
      (A.myAfter ? ", then " + A.myAfter + " (" + (A.myAfter - A.myNext) + " apart)" : "") +
      ". " + A.upcoming.length + " pick" + (A.upcoming.length === 1 ? "" : "s") +
      " left including this one. Style: " + styleName() +
      ((STRATS[S.league.style || "balanced"] || {}).tagline
        ? " — " + STRATS[S.league.style || "balanced"].tagline : "") +
      "; the composite below already has it applied.",
    rosterBlock(),
    supplyBlock(),
    (waiting
      ? "CANDIDATES — likely to still be there at pick " + A.myNext +
        ". Name a player from this list and nobody else."
      : "CANDIDATES — takeable right now. Name a player from this list and nobody " +
        "else.") + "\n" + lines
  ].filter(Boolean).join("\n\n");
```

`RUN IN PROGRESS` moves out of here and into `runLine()` inside `teamsAheadBlock()`, so it
sits beside the last-8 counts that produced it.

### 8.7 `app.js` — `briefQuestion()`

```js
function briefQuestion() {
  var cached = briefSituation[rosterKey()];
  return claudeContext() + "\n\n" + teamsAheadBlock() +
    "\n\nQUESTION: I am " + (A.myNext > A.cur ? "on deck for" : "on the clock at") +
    " pick " + A.myNext + ". Answer in two labeled parts and nothing else.\n\n" +
    (cached
      ? "PART A — SITUATION. This is what you told me at my last pick:\n  \"" +
        cached + "\"\nReprint it unchanged unless a number above has moved it, in " +
        "which case give the one sentence that changed."
      : "PART A — SITUATION. Two sentences, 40 words maximum. Where this roster " +
        "stands, which starting slots are still open, and what the next two rounds " +
        "have to accomplish. Use the drop between the man in the slot and the best " +
        "left at that position to say where waiting costs the most points.") +
    "\n\nPART B — THE PICK.\n" +
    "Line 1: the player's name, and nothing else on that line.\n" +
    "Then two or three sentences of why, in this order: what he does for an open slot " +
    "or an upgrade in points, what the supply and survival numbers say about waiting, " +
    "and the one thing the research note or depth chart adds.\n" +
    "Last line: start it with \"If gone:\" and name one fallback in a single clause. " +
    "No survival percentages on that line.\n" +
    "PART B under 90 words.\n\n" +
    "GROUNDING RULE. Every claim you make must trace to one of the facts above: the " +
    "projected points, the tier and how many of it are left, the counts of who is left " +
    "above replacement, the survival percentages, the ADP and its movement, the " +
    "depth-chart slot, the injury designation, the bye weeks, the research note and its " +
    "dated source, or what the teams picking before me are short at. If a claim cannot " +
    "point at one of those, do not make it. Do not bring in rankings, projections or " +
    "news from outside this message, and do not recompute any number here.\n\n" +
    "Everyone in the candidate list is on the board right now. A survival percentage is " +
    "the chance he lasts until my pick, never a report that he has gone.";
}

/** The situation read is a function of the roster, so cache it against one. */
var briefSituation = {};
function rosterKey() {
  return A.mine.map(function (p) { return p.name; }).sort().join("|");
}
```

### 8.8 `app.js` — `renderBrief()`, the part that reads the answer

Only the head-line extraction changes. PART A is peeled off, stored against the roster key,
and rendered above the pick; PART B's first line is still the bare name that `briefPlayer()`
and `playerIn()` expect.

```js
  // The answer arrives in two labeled parts now. Peel PART A off before the
  // head line is taken, or the situation read becomes the player name and the
  // Draft button binds to nobody.
  var parts = splitBrief(body);        // { situation, pick }
  if (parts.situation) briefSituation[rosterKey()] = parts.situation;
  var lines = parts.pick.split("\n").filter(function (l) { return l.trim(); });
  var head = failed ? "" : lines.shift();
```

```js
/**
 * "PART A — SITUATION" / "PART B — THE PICK", tolerant of the model dropping a
 * label. If B is missing we treat the whole answer as the pick, which is what
 * shipped before this change and is never worse than showing no pick at all.
 */
function splitBrief(text) {
  var b = text.search(/^\s*PART\s*B\b/im);
  if (b < 0) return { situation: "", pick: text };
  var a = text.search(/^\s*PART\s*A\b/im);
  var sit = (a >= 0 ? text.slice(a, b) : "").replace(/^\s*PART\s*A[^\n]*\n?/i, "").trim();
  var pick = text.slice(b).replace(/^\s*PART\s*B[^\n]*\n?/i, "").trim();
  return { situation: sit, pick: pick };
}
```

Render the situation on its own line above the recommendation head, in the eyebrow's voice,
and leave it on screen while a re-ask spins.

### 8.9 `app.js` — `SYSTEM`, two sentences

```diff
   "Trust those numbers — do not recompute them and " +
-  "do not substitute generic consensus rankings. Your job is judgment on top of the math: " +
+  "do not substitute generic consensus rankings. Everything you need is in the message, " +
+  "including the state of the user's own roster; argue from those numbers and from the " +
+  "dated research notes and from nothing else, because you have no rankings, news or " +
+  "projections of your own that are newer or better than what you have been given. " +
+  "Where the message is silent, say it is silent rather than filling the gap. " +
+  "Your job is judgment on top of the math: " +
```

### 8.10 What has to be re-tested before this ships

- `briefPlayer()` / `playerIn()` against a two-part answer, including a model that drops the
  PART B label, prints "PART B — THE PICK" and the name on the same line, or emits a
  markdown heading. `splitBrief()` covers all three; a unit test should pin them.
- `briefStale()` and the "went at pick N" banner still fire on the PART B head line.
- The `surv >= 0.25` filter with 8 candidates instead of 12: the under-six fallback needs
  re-checking in the late rounds, because a smaller slice reaches it sooner.
- `renderBrief()`'s card layout with a situation paragraph above the head, at 744px.
- No live-call verification of *answer quality* was possible here. That is the first thing
  to run once the owner approves live runs, on these same two states, and it belongs with
  workstream D's latency and `output_config.effort` measurements rather than being repeated
  separately.

---

## 9. The thing I was told to watch for

I drafted, at three separate points, a sentence telling the model that the board's ranking
may not reflect the roster and that it should prefer a player who fills an open slot. Each
time it was the same instinct: the pick-110 payload has no receiver in it, and the cheapest
way to get one recommended is to tell the model to go looking. **Every version of that
sentence is out of this proposal.** The composite ranking is printed on every candidate line
as `comp` and is never qualified, contradicted or hedged in any of the language above. If a
second tight end outranks a receiver for an empty WR2, workstream I's `lineupSpots` /
`openFlexSlots()` fix and the empty-starting-slot replacement question are the answer, and
this document must not be allowed to make that failure quieter.

The one thing on this side of the line is the slot-coverage guarantee in 8.5: the candidate
list must be able to answer the question it is being asked. That is a rule about what is
visible, in code, not about what to believe, in prose — and after workstream I lands it
should mostly stop firing, which is the test of whether I drew the boundary in the right
place.

---

## 10. Style: what the model is told about how the user wants to draft

### 10a. The claim, checked

The claim handed to me was that `briefQuestion()` says **nothing** about style. That is
**partly refuted and mostly confirmed**, and the distinction matters.

**Refuted:** `claudeContext()` does contain a style line, and it is in the pick-86 payload
printed at section 1b:

```
MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below
already have it applied. Say when a pick is only on top because of the style, and say so
too when the style is steering me wrong here.
```

**Confirmed, and this is the substance of it:**

- **F-I2-7 (HIGH) — on Balanced the per-candidate style signal can never print.**
  `strategies.js:29` gives `balanced: { … knobs: {} }` — no overrides at all. `analyze()`
  computes `var styled = Object.keys(activeKnobs()).length > 0`, which is `false`, so
  `p.compNeutral` is set to `null` for every player. `styleEffect()` (`app.js:2255`) returns
  `null` the moment `p.compNeutral == null`. The `claudeContext()` line that would print
  *"my Balanced style moves him +N and from board rank X to Y versus neutral scoring"* is
  gated on `fx && (…)` and therefore **never executes on the default style**. Verified by
  inspection of all three files and confirmed by the printed payloads: neither the pick-86
  nor the pick-110 payload contains the word "moves" or a board-rank comparison.
- **F-I2-8 (MEDIUM) — the style is named but never explained.** `STRATS` carries a `detail`
  field on all nine styles ("The prevalent 2026 approach. Take one high-end running back
  early as an anchor, then largely ignore the position…"), and it is **never sent**. The
  model gets a name and a nine-word tagline. It is not told what Hero RB is *for*, that
  `earlyRounds` is 5, that RB is weighted x0.78 through it, or that `handcuffBonus` is 5.
- **F-I2-9 (MEDIUM) — the prompt invites a fabrication on Balanced.** *"Say when a pick is
  only on top because of the style"* is asked on a style that did literally nothing. There
  is no style effect to report, and the model has no way to know that, so the instruction
  is a standing invitation to invent one. Under the section 7 grounding rule this is the
  prompt itself asking for an ungrounded claim.
- **F-I2-10 (LOW, cosmetic)** — `tagline` already ends in a period and the code appends
  `". The scores below…"`, producing `need as a tiebreaker.. The scores`. Visible in the
  printed payload at section 1b.

### 10b. The proposed style block

Derived entirely from `activeKnobs()` and the `STRATS` entry — no hand-written strategy
text per style, so a user-authored custom style is described as accurately as a built-in
one. **126 estimated tokens.** At pick 86 on Balanced it renders:

```
MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker. The default. Takes
the best value on the board, leans toward positions you still need to start, and buys floor
early and ceiling late.
  What it is doing to the composite this round: nothing at all — this style sets no
overrides, so the composite below is the engine's own unmodified opinion. Do not credit or
blame the style for any ranking here, and do not invent a style argument: there is not one
to make.
```

**That is the answer to "what should the prompt say when the style is Balanced?"** — say
that it did nothing, and forbid the style argument outright. Silence is what produced the
gap; a claim of influence would be worse than silence.

On a style that *does* have knobs, the same builder walks `activeKnobs()` and prints only
what is biting in this round. Hero RB at round 8 would render:

```
MY DRAFT STYLE: Hero RB — One anchor back, then pivot to receivers. The prevalent 2026
approach. Take one high-end running back early as an anchor, then largely ignore the
position while everyone else is paying up, and come back for volume later. Hedges against
running-back volatility without punting the position entirely.
  What it is doing to the composite this round: all draft it weights RB x1.05, WR x1;
+5 to backs behind a back I own. Every candidate line carries a "style" entry when it moved
him. Say when a pick is on top only because of the style, and say so too when the style is
steering me wrong here.
```

Note that it correctly drops `earlyPosBias` at round 8 because `earlyRounds` is 5 — the
model is told what applies *now*, not what applied in round 2.

The proposed candidate line also carries `style +N, rank X→Y` per player whenever
`styleEffect()` returns something, which on any non-Balanced style it does. The two
together are the whole answer to "how is it choosing based on style": the block says what
the style is doing to the board, and the per-player entry says what it did to this man.

```js
/**
 * What the style is, what it is for, and what it is actually doing to the
 * composite in THIS round — read off activeKnobs() rather than written out per
 * style, so a custom style the user typed is described as accurately as a
 * built-in one.
 *
 * The Balanced branch matters more than the other one. Balanced has no knobs at
 * all, so `styled` is false in analyze(), compNeutral is null, styleEffect()
 * returns null, and the per-candidate style sentence never prints — which left
 * the default style, the one almost everybody runs, sending no style signal
 * whatsoever while the prompt still asked the model to say when a pick was "only
 * on top because of the style". That is an invitation to invent one. Say plainly
 * that there is nothing to say.
 */
function styleBlock() {
  var st = STRATS[S.league.style || "balanced"] || STRATS.balanced;
  var k = activeKnobs(), round = A.ctx.round, out = [];
  if (k.earlyPosBias && round <= (k.earlyRounds || 5))
    out.push("through round " + (k.earlyRounds || 5) + " it weights " +
      Object.keys(k.earlyPosBias).map(function (p) {
        return p + " ×" + k.earlyPosBias[p]; }).join(", "));
  if (k.posBias) out.push("all draft it weights " +
    Object.keys(k.posBias).map(function (p) { return p + " ×" + k.posBias[p]; }).join(", "));
  if (k.needWeight != null && k.needWeight !== 1)
    out.push("roster-awareness is turned " + (k.needWeight === 0
      ? "off — pure value over replacement" : "down to " + k.needWeight));
  if (k.ceilingWeight != null && k.ceilingWeight !== 1)
    out.push("ceiling weighted ×" + k.ceilingWeight);
  if (k.riskWeight != null && k.riskWeight !== 1)
    out.push("risk weighted ×" + k.riskWeight);
  if (k.stackBonus) out.push("+" + k.stackBonus + " to receivers sharing a team with my QB");
  if (k.handcuffBonus) out.push("+" + k.handcuffBonus + " to backs behind a back I own");
  if (k.posFloorRound) out.push("no " + Object.keys(k.posFloorRound).join("/") +
    " before their floor round");

  return "MY DRAFT STYLE: " + styleName() + " — " + st.tagline.replace(/\.\s*$/, "") + ". " +
    (st.detail || "") +
    "\n  What it is doing to the composite this round: " +
    (out.length
      ? out.join("; ") + ". Every candidate line carries a \"style\" entry when it moved " +
        "him. Say when a pick is on top only because of the style, and say so too when " +
        "the style is steering me wrong here."
      : "nothing at all — this style sets no overrides, so the composite below is the " +
        "engine's own unmodified opinion. Do not credit or blame the style for any " +
        "ranking here, and do not invent a style argument: there is not one to make.");
}
```

It replaces the `MY DRAFT STYLE` clause in the `WHERE I AM` line of section 8.6 and becomes
its own paragraph. The `.replace(/\.\s*$/, "")` fixes F-I2-10.

One more line for the answer shape in `briefQuestion()`, so the style reaches the *output*
and not only the input:

```
If the style moved this pick, say which knob did it. If the style did nothing, do not
mention it.
```

---

## 11. The hard constraint: never suggest a backup TE in round 8

> "make sure we're not suggesting a backup TE in the 8th round as our suggested choice"

Taken as a hard constraint. There are only two ways to make it structural rather than
merely likely: do not send the player, or forbid the answer. Only the first is enforceable
from this side, so the gate is a filter on the candidate list.

**The reserve rule, as proposed and as measured in the payloads at section 4:**

1. Compute the open starting slots that are actually **draftable this round** — an empty K
   in round 8 does not count, because `kFloorRound` is 14 and the engine already blocks it.
2. If there are none, the list is the top 8 by composite, exactly as today.
3. If there are some, split the survivors into those who **can enter the starting lineup
   today** (`lineupPoints(mine+[p]) − lineupPoints(mine) > 0`) and those who cannot.
   **At least half of the eight must come from the first group, whenever that many exist.**
4. **The best available body at an open starting slot, by projected points, always leads the
   list** — whatever the composite says about him.
5. Every candidate who cannot start carries `+0 — DEPTH ONLY, cannot start; WR still EMPTY`,
   naming the slot being left open.

**Measured effect at the two reported states:**

| | today | with the reserve rule |
|---|---|---|
| pick 86, receivers in the list (WR2 empty) | 1 of 12, described as *"I am already better at WR"* | **4 of 8**, led by Jayden Reed at `+201 — fills an open WR slot` |
| pick 110, receivers in the list (WR2 empty) | **0 of 12** | **4 of 8**, led by Matthew Golden at `+173` |
| bench-only candidates that name the empty slot | none | all of them |
| candidate-block tokens | 1,860 / 1,779 | 583 / 507 |

A backup tight end can still be *argued for* — Tucker Kraft is still on the pick-86 list at
`comp 6`, and there are drafts where taking him is right. What is now impossible is the
pick-110 state, where the model was handed twelve players, none of whom could fill the empty
slot, and told to name one of them.

**Say it plainly: this gate is the seatbelt, not the brakes.** It cannot make a wrong
ranking right. At pick 86 the composite still puts Kraft (`comp 6`) above Reed (`comp 0`)
for a roster with an empty WR2, and the reserve rule does not touch that — it only ensures
Reed is on the menu and labeled. **Workstream I's `lineupSpots` / `openFlexSlots()` fix and
the empty-starting-slot replacement question are the actual repair.** If this gate ships and
workstream I does not, the app will still be recommending the wrong player; it will just be
recommending him from a list that happened to contain a right answer. Ship both, and ship I
first.

---

## 12. One call or two — the cadence

### 12a. Two facts about today's behavior, verified

**F-I2-11 (HIGH) — there is exactly one brief per turn and it is never revisited.**
`renderBrief()` returns early on `gap > (claudeCfg.lead || 2)`, caches by `A.myNext`, and
re-renders the same cached text at gap 2, gap 1 and gap 0. `briefStale()` returns true on
one condition only — `briefPlayer(text).takenBy` — and its own comment says so: *"Nothing
else invalidates it, so a quiet board still costs one call."* So a brief written two picks
early is still on screen when the user is on the clock even if the **fallback** was taken, a
**run** started, or a startable body at the empty slot **fell**. There is no final-decision
check. The user's intuition here was correct.

**F-I2-12 (explains a confusing observation, not a defect).** In practice mode the brief
appears to fire the instant the user's pick arrives. That is `simulateToMyPick()`: it
records opponent picks in a loop up to `A.myNext` and only then calls `render()`, so the gap
collapses from 21 (or 3) to 0 in a single step and `renderBrief()` runs once, at gap 0. In a
**live draft**, where picks are recorded one at a time, the gap decrements normally and the
brief fires at gap 2, exactly as designed — two picks before the clock reaches the user.
**The live behavior is not what the practice run shows.** Nothing is broken; it is worth
knowing before draft night, because it means the live brief is written against a board that
is two picks staler than the one practice made it look.

### 12b. The three candidates, costed

Slot 11's schedule alternates a **3-pick gap** and a **21-pick gap** all night
(11→14→35→38→62→83→86→107→110→131…). The right cadence is not the same on both.

| | (a) one call at lead 2 + deterministic re-check | (b) two calls: situation after the pick, decision at lead 1 | (c) one call deferred to gap 0/1 |
|---|---|---|---|
| calls per turn | 1, plus roughly 0.4 on long gaps | 2 always | 1 |
| input per turn | 2,009 + 2,009 when it fires, about **2,800 average** | ~700 + ~1,500 = **2,200** | **2,009** |
| output per turn | ~150, +90 when it fires | ~60 + ~90 = ~150 | ~150 |
| cost per 14-turn draft | ~$0.11 | ~$0.10 | ~$0.07 |
| freshness at the clock | good — re-checks when the board moved | good — decision written at lead 1 | best |
| latency at the clock | none normally; one call when a check fires, with the old brief still on screen | on a 3-pick gap both calls land inside ~90 seconds | the whole p95 lands on the user's clock |
| failure surface | 1 request, sometimes 2 | **2 requests every turn, both must land** | 1 request, worst timing |

Cost is not the discriminator — every option is under fifteen cents a draft against a $50
daily ceiling. **Latency and failure surface are**, and the 3-pick gap is where they bite.

### 12c. Recommendation: (a), gap-aware

**Keep one call at lead 2, and add a deterministic staleness re-check that costs nothing
unless it fires.** Concretely:

- **Long gap (≥ 8 picks — every second turn at slot 11).** Fire at lead 2 as today. Allow
  **one** re-ask at gap 0 if the brief is void by the test below. Twenty-one picks is plenty
  of board movement to justify it, and the user has time to read the new answer.
- **Short gap (< 8 picks).** Fire at lead 2 and do not re-check. Three picks cannot move the
  board enough to be worth spending the clock, and the existing `briefStale()` rule already
  covers the one case that matters — the named player went.
- **Never** open a second request while the user is on the clock unless the brief is
  genuinely void, and never blank the card while it runs: the previous brief stays on screen
  under the spinner.

Extend the staleness test from one condition to four, all free to compute inside the
analysis that just ran:

```js
/**
 * A brief written two picks early is a prediction, and predictions go off.
 * Today only one thing voids it — the named player being taken — so a brief
 * survives its own fallback being drafted, a run starting at the position you
 * are short at, and a startable body falling to you. None of those are visible
 * to the reader, who sees a confident recommendation written against a board
 * that no longer exists.
 *
 * All four tests are local arithmetic on the analysis we just did. None of them
 * costs a call; only firing does.
 */
function briefVoid(text) {
  if (!text || text.charAt(0) === "!") return false;
  var p = briefPlayer(text);
  if (p && p.takenBy) return "the player it named is gone";

  var alt = playerIn((text.split("\n").filter(function (l) {
    return /^\s*if gone\s*:/i.test(l); })[0]) || "");
  if (alt && alt.takenBy && p && !p.takenBy) return "the fallback is gone";

  var open = openStartingPositions();
  if (!open.length || !p) return false;

  // Somebody who can actually start for you has fallen past the man in the
  // brief by more than half a point a week.
  var addOf = function (q) {
    return E.lineupPoints(A.mine.concat([q]), S.league.rules) -
           E.lineupPoints(A.mine, S.league.rules);
  };
  var mine = addOf(p);
  var better = A.avail.some(function (q) {
    return open.indexOf(q.pos) >= 0 && !q.takenBy && addOf(q) > mine + 10;
  });
  if (better) return "a startable body at an empty slot has fallen";

  // A run at a position you still have to fill changes the price of waiting.
  if (open.some(function (pos) { return A.runInfo.runs[pos]; }))
    return "a run has started at a position I still have to fill";

  return false;
}
```

and gate the re-ask on the gap the brief was written across, so the short turns are
untouched. Store that gap beside the cached text when the brief is requested rather than
recomputing it:

```js
  var written = briefWrittenAt[A.myNext];              // pick number when asked
  var longGap = written != null && (A.myNext - written) >= 8;
  var reason  = briefVoid(cached);
  var budget  = longGap ? 2 : 1;                       // re-asks allowed for this pick
  if (cached && reason && (briefTries[A.myNext] || 0) < budget) { /* re-ask */ }
```

When a re-ask fires, tell the reader why in one line above the new brief — *"asked again: a
run has started at a position I still have to fill"* — because a recommendation that changes
under you with no explanation is worse than one that is slightly stale.

**Against the 30-second timeout and the two-minute clock:** the worst case is a single
re-ask at gap 0 on a long-gap turn. Today's brief already runs one blocking call in exactly
that position when the named player is taken, so this adds no new worst case — it adds three
more conditions under which the existing worst case occurs, on half the turns, with the old
brief left visible throughout. **It does not touch the p95 of a single call, which is
workstream D's number and the one that actually decides whether any of this arrives in
time.**

**Rate limit:** the worst case here is 2 calls per user turn. Twelve people behind one NAT,
each taking a pick roughly every two minutes, is about 12 calls a minute against a limit of
90. Comfortable. (D owns this check; this is a sanity figure, not a substitute for it.)

**Why not (b).** Two calls every turn doubles the number of requests that must land on a
network the user does not control, for a saving of about a penny a draft, and on the 3-pick
turns the two calls collide inside ninety seconds. The good half of (b) — a situation read
written once and reused — is already in this proposal as the section 6 cache, which gets the
same benefit with zero extra requests.

**Why not (c).** Deferring to gap 0 puts the entire p95 on the user's clock. The review
prompt's own bar is that a p95 above 12 seconds is HIGH; (c) makes every brief pay it, on
every turn, on a 90-second Yahoo clock, and in a fast room a 3-pick gap can be thirty
seconds of real time. It trades away the one thing the user cannot get back.

---

## 13. The user's proposed architecture, evaluated

> "each round after our pick the app should do its thing to determine what are the likely
> picks that will still be available at the time that we pick and make a decision based on
> our actual needs which players we should draft from those and in what order … then we
> could ship those few names … along with our current roster status."

**Agreed on the shape, and it is close to what section 4 already builds.** Three points of
agreement and two of disagreement.

**Agree — availability prediction stays math, not an AI call.** `survival()` is a normal CDF
over each player's own ADP standard deviation, drawn from 7,681–7,848 real FFC mocks;
`expectedBestAvailable()` folds it into a per-position expectation; `roomPick()` models the
room. A model asked "who will be there at pick 110" would be guessing from ADP numbers it
had to be handed anyway, would add seconds of latency to produce a worse answer, and could
not be validated against anything. The engine already computes this correctly and cheaply.
**The app computes the shortlist deterministically; the model decides among it.** Agreed
without reservation.

**Agree — the whole draft does not need to be shipped.** It never was: `claudeContext()`
sends no pick log and no opponent rosters. Section 5 is the full accounting.

**Agree — the shortlist should be built from need, not from raw board order.** That is the
reserve rule of section 11.

**Disagree, first — "it doesn't need what's happened for the entire draft" is right about
the log and wrong about two derived facts.** Two summaries of what has happened are the only
things ADP genuinely cannot tell you, and both are one line each: the position mix of the
last eight picks with the run flag (`detectRuns()`), and what the teams picking before you
are short at (`teamsAhead()`). Nine tokens and forty-three tokens respectively at pick 86.
Keep them. Everything else about the 180 picks goes.

**Disagree, second — do not let the app fix the order.** The user's phrasing is "which
players we should draft from those **and in what order**". If the app decides the order, the
model's job collapses to writing prose around a decision already made, and the review
prompt's own standard applies: *"A brief that always agrees is not earning its cost."* The
three recommendation cards below the brief are already the app's order. The value of the
call is precisely the cases where it departs from that order on a fact the composite cannot
weigh — a research note dated 9/4, an ACL designation, a depth-chart slot, what the two
teams ahead are short at. So: **the app fixes the shortlist, the model is free to reorder
within it, and the prompt requires it to say which fact made it depart from the composite.**
That is one extra clause in the answer shape and it is the thing that makes the call worth
paying for:

```
If you name someone other than the highest-composite player in the list, say in the same
sentence which fact above made you depart from the ranking.
```

Note that this clause is safe under the section 9 boundary. It does not tell the model the
ranking is wrong or invite it to distrust the composite; it requires it to *show its work*
when it disagrees, which is the same discipline the grounding rule applies everywhere else.

**What the user's architecture and this proposal have in common, stated plainly:** the app
does the arithmetic — who is likely there, what the roster needs, what the style is doing,
what the supply looks like — and ships a short list plus a roster state. The model does the
judgment. That is the right division of labor, and it is what section 4 prints.
