# Draftline build spec — everything left to do, in order

**Written 2026-09-04. The draft is Monday 2026-09-08, 19:00 CDT.** Four days.

This is the executable plan. It supersedes `qa-review-prompt.md` as the thing to work
from — that document was the *investigation* brief and its workstreams are now finished.
This one is the *build* brief: what is broken, what the fix is, how you know it worked,
and what order to do it in.

Every item carries a pointer to the report that found it. Those reports hold the
reproductions, the pasted evidence and the term-by-term tables. **Read the finding before
you build the fix.** Nothing here restates evidence that already exists three files away.

---

## Status as of 2026-09-05 — read this first

Most of Phases 1 and 2 landed between the 09-04 writing and now. Verified by grepping the
code for each item's signature on 2026-09-05; the item sections below are kept as the
record of *why*, but do not rebuild anything marked done.

| Item | Status | Evidence |
|---|---|---|
| P1.1 build stamp | done, recurring | `config.js` build `20260905k`; bump again on every deploy |
| P1.2 fabricated 100% survival | done | `claudeContext()` prints "this is my last pick of the draft" |
| P1.3 candidate filter hid the best | done | `briefCandidates()` keeps `comp > bestLive` |
| P1.4 `marketAdp()` standard-scoring bias | done | leans FFC ADP by half the 7-day trend; never reads `yadp` raw |
| P1.5 Sunday re-bake | **open, Sunday** | `draft-day.md` §3 |
| P1.6 runbook | done | `tools/draft-day.md` |
| P1.7 iPad device check | **open, user runs it** | `tools/ipad-check.md` |
| P1.8 live-flow tests | partly | `test-app.js` 423 checks incl. reassign/recordTo; catch-up path coverage unverified |
| P2.1 payload redesign | done | `rosterBlock`, `supplyBlock`, `teamsAheadBlock`, `styleBlock` |
| P2.2 `briefVoid()` | done | four local tests, one re-ask on gaps ≥ 8 |
| P2.3 invariant guard | done | `composite()` −100 while a starter slot is open |
| P2.4 `lineupSpots` flex door | done | `openFlexSlots(ctx.myPlayers)` |
| P2.5 Hero RB anchor | done, unmeasured | `posBias RB 1.05` after round 5; E in the suggestion review measures shape |
| P2.6 style leverage | done | ceiling schedule moves with the weight (`tc`) |
| P2.7 remaining findings | superseded | by the suggestion review below |
| P3.1 measure `roomPick` | done 09-05 | table in the item |
| P3.3 still-need in words | done | roster-gap strip, `renderStatus()` |
| P3.4 brief provenance | done | eyebrow says "written N picks ago" |

**What is actually left to build, in order:**

1. **P2.8 — `styleBlock()` sends the preset, not the style in force · Sonnet · 30 min.**
   Custom and Claude-tuned knobs never reach the model and the payload ends
   `My own notes on it: [object Object]`. Build the block from `activeKnobs()`, diff against
   the preset, name the user's own knobs. Assertion in `test-app.js`. Evidence:
   `qa-suggestion-prompt.md` C1 and `tools/traces/hero_rb-seed11-pick38.txt`.
2. **P2.9 — the payload's hard-coded "worth roughly a 7th-round pick" · Sonnet · 20 min.**
   `scoringHighlights()` asserts it; the board's own VOR puts the best DEF at #22 and
   `impact.js` computes `bestRank`/`bestRound`. Print the computed number. (C3.)
3. **P2.10 — bake date in the payload · Sonnet · 15 min.** `SYSTEM` says injuries and depth
   "are current"; say "as of <meta.built>" and put the date on the LEAGUE line. (C4.)
4. **P3.2 — the live draft board · Opus to design, Sonnet to build · 5 hours.** The headline
   build item. Fully specified in its section below, with the P3.1 numbers that shape it.
5. **The suggestion-engine review · Opus xhigh · 3 days · runs before any engine change.**
   `qa-suggestion-prompt.md` is the investigation brief for the composite itself: no wait
   cost (B1), fallen players unpriced (B2), grades and market movement inert (B3), the
   late-round collapse (B4), replacement level (B5), the floors (B6), bye semantics (B7),
   roster-blind survival (B8), injury as a badge (B9), handcuffs by team name (B10), and the
   model eval (D). Its findings become P2.11 onward; **do not build engine terms from the
   headings without the review's measurements.**
6. P1.5 and P1.7 on their days. P3.5 only if a real Yahoo page proves it.

The serialization rule stands: one session edits `engine.js`, `app.js`, `ff.css` at a time.
Another session has been landing commits to `app.js` daily; pull before you branch.

---

## 0. How to use this document

1. Work the phases in order. Phase 1 is ship-or-not. Phase 2 is the quality of the pick.
   Phase 3 is the night itself. Phase 4 is after the season.
2. Inside a phase, work top to bottom. The order encodes dependencies, and a few items
   are explicitly gated on an earlier one.
3. One commit per item, in this repo's voice: what was wrong, what it cost, why the fix is
   the fix. Look at `git log` before writing the first one.
4. Run `bash ff/tools/test-all.sh` before and after every item. An item is not done until
   it is green, and a skip is not a pass.
5. **Do not batch.** Several of these change the same three functions. Landing them one at
   a time with the suite green between each is the only way to know which one moved a number.

### Model routing

| Work | Model | Why |
|---|---|---|
| Engine math, scoring, strategy judgment, prompt design, anything with a formula | **Opus** | These need a drafter's judgment as well as an engineer's, and several are wrong in ways that pass tests |
| Mechanical verification, test writing, fuzzing, data joins, greps, CSS | **Sonnet** | High volume, low judgment, verifiable against a fixed answer |
| Single-fact lookups | **Haiku** | Rare here |

Read-only analysis can fan out in parallel. **Anything that edits `engine.js`, `app.js` or
`ff.css` must be serialized** — three sessions editing those files at once already cost this
project a tangled history once.

---

## 1. Where the app is right now

### Committed and done

| Commit | What it fixed | Severity |
|---|---|---|
| `ea07ebd` | Account-name lockout — anyone who knew the name could lock the owner out for 15 min | BLOCKER |
| `9996121` | Stored XSS via team name in four `innerHTML` sinks | HIGH |
| `089106f` | iPad layout (E1) + `runMock` keeper double-count (B2) + modeled ceiling/risk grades | BLOCKER + HIGH |
| `3d80c08` | Empty starting slots priced against a draft-start constant (I1) | BLOCKER |
| `4a02c62` | Draft button bound to the wrong player; 24 names unmatched (D1, D4) | BLOCKER + HIGH |
| `2c9e094` | `app.js`/`sync.js`/config under test, one command | — |
| `a54c142` | The eight QA reports and workstreams I, I2, I3, J | — |

### Baselines that must hold

```
bash ff/tools/test-all.sh
```

```
test-engine.js    99 passed   test-app.js     64 passed
test-parser.js   112 passed   test-sync.js    47 passed
test-config.js    15 passed   test-playerin.js 17 passed
audit.js          0 high, 1 medium, 3 low
test-accounts.sh  35 checks — needs `npx wrangler dev --port 8787 --local` in ff/worker
```

The 1 medium in `audit.js` is the freshness check firing correctly: the bake is four days
before the draft and the window is three. **It clears when H1 runs on Sunday.** Do not
silence it.

### The reports

`ff/tools/qa-findings-{B,C,D,F,G,H,I,I2}.md`. B is engine math, C is data, D is the AI layer,
F is accounts and security, G is tooling, H is the fidelity roadmap, I is suggestion quality,
I2 is the AI payload redesign.

### Decisions already made — do not relitigate

- **The AI call stays at lead 2.** Settled in `qa-review-prompt.md` §I3 with the reasoning.
  At slot 11 the gaps alternate 3 and 21 all night, so on half the turns "right after we
  pick" and "at lead 2" are the same moment, and on the other half a name chosen 21 picks
  early is a guess. What is missing is a later *check*, not an earlier call.
- **A guard is not a substitute for the value term.** Workstream I measured it: on the
  shipped engine, 925 of 930 invariant violations had no player with a positive marginal
  anywhere on the board, so a guard had nobody to promote and moved the headline rate 0.3
  points. I1 landed first for that reason. A guard is now viable *because* I1 shipped.
- **Prompt caching is pointless here.** Sonnet 5's minimum cacheable prefix is 1024 tokens;
  the largest system prompt is ~456. Verified in D. Do not spend time on it.
- **Do not teach the prompt to distrust the board.** If a ranking is wrong, fix the ranking.
  I2 drafted that sentence three times and cut it three times; §9 of that report says why.

---

## 2. Rules of engagement

1. **Verify, then claim.** Every change carries a reproduction and a test. Anything you
   could not reproduce is reported as "not reproduced" with what you tried — never dropped,
   never promoted.
2. **Read the comment before you decide something is a bug.** This engine's comments record
   several previous fixes for the exact bug class you are looking at. Understanding why an
   earlier fix was insufficient is usually the assignment.
3. **The engine's tests encode independently derived numbers.** If you change the engine and
   a test moves, the test is probably right. Explain the delta before you touch an assertion,
   and never weaken one to make a fix look good.
4. **Do not refactor.** The code has a voice and a lot of load-bearing comments.
5. US English throughout, in code and prose.
6. Never commit `config.js` pointing at a loopback address. `test-config.js` guards this.
7. **Money.** The proxy spends the owner's Anthropic key. Live AI runs need explicit
   approval and a stated call count. Never loop them.

---

## 3. Phase 1 — before Monday, ship-critical

Everything in this phase is either wrong on screen during a draft or a thing you cannot do
after Monday.

### P1.1 — Bump the build stamp · Sonnet · 5 minutes

`config.js` says `20260904av`; both HTML files say `20260904aw`. `checkForUpdate()` compares
the client's config against the deployed config, so a stale stamp there means **no visitor
gets the reload banner** — the one mechanism for pushing a fix on draft day.

`test-config.js` does not catch it because it checks the two HTML files agree with each
other. **Extend it to assert `config.js`'s `build` equals the `?v=` stamps.** That extension
is the actual deliverable; bumping the stamp is the easy half.

**Acceptance:** `node ff/tools/test-config.js` fails on the current mismatch, passes after
the bump, and the new assertion has a self-check proving it can fail.

### P1.2 — D2: the prompt asserts a fabricated 100% survival · Opus · 30 minutes

*Source: `qa-findings-D.md` D2 (HIGH).*

`A.myAfter` is null at the user's last pick. `analyze()` sets `p.survNext = 1` as a
placeholder and `claudeContext()` prints it while labelling it with `(A.myAfter || A.myNext)`.
The model is told, in one sentence, "41% chance he reaches pick 179" and "100% chance he is
still there at pick 179." On the clock at 179 only the false 100% is shown, for every
candidate.

**Fix:** suppress the second horizon entirely when there is no pick after this one, rather
than printing a placeholder as a fact.

**Acceptance:** build the payload at pick 179 and at the last pick of a 15-round draft; no
survival claim about a pick that does not exist appears in either. Add it to `test-app.js`.

### P1.3 — D3: the candidate filter hides the board's own best players · Opus · 1 hour

*Source: `qa-findings-D.md` D3 (HIGH).*

The brief filters candidates to `surv >= 0.25` and then instructs the model: "Name a player
from this list and nobody else." At 177→179, **11 of the board's top 12 are dropped**, so the
best legal answer is the board's #8, 22 composite points behind the #1 the cards on screen
are showing. The `< 6` fallback never fires — the measured minimum across a full 180-pick
draft is 11.

**This interacts with P2.1.** Read I2 §5 before designing the fix; the reserve rule proposed
there (at least half the candidates must be able to start, and the best body at an open slot
always leads) is the same list-construction problem. **Do them together or do this one
second.**

**Acceptance:** across a full simulated draft, the board's #1 by composite is in the
candidate list at every one of the user's picks, or the prompt no longer claims the list is
exhaustive. State which you chose and why.

### P1.4 — C1: `marketAdp()` imports standard-scoring bias into a full-PPR board · Opus · 1 hour

*Source: `qa-findings-C.md` C1 (HIGH).*

Yahoo's Draft Analysis ADP is computed under **standard scoring**. `marketAdp()` does not
blend it with the full-PPR mock ADP as documented — it replaces the point estimate wholesale.
Measured against the real fixture, receivers shift a mean **+3.15 picks later**, up to +11.9
for Chris Olave and +7.3 for A.J. Brown. The board then believes PPR-premium receivers survive
longer than the live room will actually allow — which is exactly the wrong error at slot 11,
where the whole night is "does he last from 14 to 35."

**Gate:** this only bites if the user pastes their Yahoo draft analysis, which H2 recommends
they do. So either fix the blend or drop H2. Do not ship both as they stand.

**Acceptance:** with the fixture loaded, the mean receiver shift against pure PPR mock ADP is
stated and defended. Add the fixture to `test-parser.js` (this closes C5 as well).

### P1.5 — H1: re-bake Sunday night with a fresh FFC pull · Sonnet · 45 minutes, Sunday

*Source: `qa-findings-H.md` H1 — ranked the single highest-value action available.*

ADP is the sole input to `survival()`, `roomPick()` and therefore `vona`, and it moves more
in the 72 hours before Labor Day than in the month before. Re-pull FFC, re-run
`tools/bake-players.py`, diff against the committed board, and **investigate any player whose
points move by more than 5** before accepting the bake.

**This must happen on Sunday 9/7 or Monday 9/8, not before.** It also clears the `audit.js`
freshness medium.

**Acceptance:** `node ff/tools/audit.js` reports 0 medium. The diff is reviewed, not just
run. Commit the new `players.js` with the diff summary in the message.

### P1.6 — The draft-day runbook · Sonnet · 1 hour

Write `ff/tools/draft-day.md`, one page:

- What to run Monday morning: re-bake, `test-all.sh` **with the Worker up**, confirm the
  deployed build stamp matches, confirm the Worker answers, sign in from the iPad.
- What to do if the Worker is down mid-draft (every AI panel degrades to one line; the board
  is unaffected — this is verified in D).
- What to do if the board falls out of step with Yahoo (catch-up flow).
- What to do if two devices conflict (the banner, and what each button does).
- **The one-line fallback if the app dies entirely:** the board sorted by "your points" is a
  printable ranking. Print it Sunday night and have it on paper.

### P1.7 — E2 real-device iPad certification · Sonnet to write, user to run · 30 min + 15 min

*Source: `qa-review-prompt.md` §E2. The emulated pass is done; the real-device pass is not.*

E1 shipped and was verified at 744×1133 and 1133×744 in an emulator that **stops reporting
touch above 768px** — so the landscape touch layout has never run on a real device. E2's own
gate: "works on my laptop does not count."

Write the 15-minute checklist the user runs on the actual iPad in Safari, signed in to the
real account, against the deployed site. Prioritize the rows where a failure is a BLOCKER:
row buttons, search, tracker. Explicitly check: nine rows visible in portrait, no keyboard on
load, three columns in landscape, two taps to record, and Split View beside the Yahoo client
at 50/50 and 30/70.

### P1.8 — E live-draft flow tests · Sonnet · 2 hours

*Source: `qa-review-prompt.md` §E, scripts 1–12. None have been run end to end against the
deployed site.*

The highest-value five, in order: **catch-up** (close the tab mid-draft, reopen, record six
picks including one unknown, confirm no double-record), **undo and re-credit**, **offline**
(kill the network at pick 40, record ten picks, restore, confirm the account has them),
**two devices** (conflict banner, both buttons, and confirm the losing draft is really gone
and the user was told before it went), **sign out and back in mid-draft**.

---

## 4. Phase 2 — the quality of the pick

I1 fixed the biggest thing. These are what is left between the board and a recommendation a
sharp drafter would agree with.

### P2.1 — Implement the AI payload redesign · Opus · 3–4 hours

*Source: `qa-findings-I2.md`, all sections. Diffs are drafted in §8 and not applied.*

Confirmed measurements: the roster is **126 tokens of 2,541 (5%)** against 1,860 for the
candidate list. At pick 110, WR2 was empty and the twelve candidates were **5 TE, 4 QB, 3 RB —
zero receivers** — under "name a player from this list and nobody else." Every candidate
carried "he CANNOT crack my starting lineup", including, at pick 86, the receiver who would
have filled the hole; that sentence read "I am already better at WR" while `WR: EMPTY` sat two
paragraphs above. `STARTERS FILLED: RB 5/2`.

The proposal is **31% smaller** (2,541 → 1,760) while adding a roster block, a supply block
and a style block.

Build it in this order:
1. `rosterBlock()` — per position: starting slots, filled, points of the body in each slot,
   the drop from that body to the best available, flex state, bye stacks, picks remaining.
   This is the "strength at position" the user asked for.
2. `supplyBlock()` — counts and tier-cliff distance per position. **Not a list.**
3. The reserve rule on candidate construction (this also resolves P1.3).
4. `teamsAheadBlock()` — replacing the inline block.
5. The style block. **On Balanced its job is to say "nothing at all — do not invent a style
   argument."** Today the prompt asks the model to "say when a pick is only on top because of
   the style", which invites a fabrication that is undetectable from the outside.
6. The claim rule from I2 §7b: every claim traces to a fact the app actually holds.

**Note the I1 interaction.** I1 has now shipped, so the "he cannot crack my starting lineup"
sentence attached to a startable receiver should already be gone. **Verify that before
building** — re-print the pick-86 payload first and see what actually changed.

**Acceptance:** payloads printed at pick 86 and pick 110 with token counts; no false statement
about the roster in either; at pick 110 the candidate list contains receivers. No live call
needed to prove any of this.

### P2.2 — The `briefVoid()` staleness check · Opus · 1 hour

*Source: `qa-review-prompt.md` §I3, points 3–6.*

`briefStale()` re-asks on exactly one condition: the named player is taken. A brief written
two picks out therefore survives its own **fallback** being drafted, a run starting, and a
startable body falling to the user — and is still on screen when the clock starts.

Replace it with four local tests: named player gone, fallback gone, a player now ranks #1 who
was not in the candidate list, a run detected at a position the brief argued about. **All
deterministic, no API call.** One re-ask maximum, and only on gaps of 8+ — on a 3-pick gap two
calls collide inside 90 seconds. **Never block the Draft button on a pending re-ask:** the old
brief stays on screen and is replaced in place.

**Acceptance:** all four conditions unit-tested in `test-app.js`. Worst-case calls per minute
restated against the Worker's 90/IP limit.

### P2.3 — The invariant guard · Opus · 45 minutes

*Source: `qa-findings-I.md` I7.*

With I1 shipped, the headline rate is 2.0% and the invariant — *while a startable slot is
empty, the board's #1 must have marginal > 0* — breaks on 4.2%. I measured that **100% of the
residual violations are now fixable by a guard**, and the twelve-line guard closes them to
0.0% while keeping 99/0.

Land it **only after** confirming those numbers still hold against the shipped I1, and state
in the commit that the guard is a backstop on a correct value term rather than a substitute
for one.

### P2.4 — I2 (finding): `lineupSpots` counts an occupied flex slot · Opus · 1 hour

*Source: `qa-findings-I.md` I2 (HIGH). **Not** the same as the I2 workstream.*

`positionalNeed()` was fixed to ask `openFlexSlots()`; `composite()` still does the old
arithmetic and adds `roster.FLEX` for every flex-eligible position unconditionally. A second
TE behind a filled flex keeps `benchWeight` 0.280 where one door earns 0.077 — **3.6× too
high**, and 2.7× too high for WR3 and RB4.

**This breaks two engine tests.** Rule 3 applies: explain both deltas before touching either
assertion. On its own this fix moves the headline rate 35.3% → 34.8%, so it is a correctness
fix rather than a quality one — sequence it after P2.3 and judge it on the arithmetic, not on
the rate.

### P2.5 — B1: Hero RB never gets its anchor back · Opus · 1 hour

*Source: `qa-findings-B.md` B1 (HIGH).*

Hero RB takes a **tight end at pick 11 in 98% of 200 seeded drafts** and has no anchor back
after picks 11 and 14 in 62% of them. `earlyPosBias RB 0.78` de-emphasizes the anchor pick
itself, so the style behaves as Elite TE + Zero RB — the opposite of its own description.

**Gate:** only matters if the user runs Hero RB. Workstream B's drafter recommendation is
**Balanced** on this data. Ask before spending the hour.

### P2.6 — B7 / style leverage · Opus · 2 hours

*Source: `qa-findings-B.md` B7 (MEDIUM), plus I's style section.*

Four of nine styles are functionally identical to Balanced. `mult` was **1.00 on all 25 rows
at both of the user's real states**, and six of seven styles recommended the same backup tight
end at pick 86. `balanced` is `knobs: {}` — literally no overrides.

I1 *restores* style leverage late, because bias is a signed shift on a quantity that was 0.0
for the player who should have been #1. **Re-measure before designing anything**; the shipped
engine may already have moved this.

### P2.7 — Remaining engine and data findings · Opus / Sonnet · as time allows

Ranked by what actually reaches the screen:

| Id | Severity | What | Model |
|---|---|---|---|
| I4 | MEDIUM | Urgency bonus is arithmetically **zero for rounds 1–10** of 15, so nothing backstopped I1 | Opus |
| I5 | MEDIUM | Empty K slot invisible rounds 8–13 (best K at board rank 134, blocked). UI, not engine | Sonnet |
| B3 | MEDIUM | `gp: 18` is Sleeper's **week** count; the season is 17 games. Inert for offense (<0.17 pts) but scales every D/ST points-allowed by 18/17 — −9.8 pts, −3.0 VOR at tier 1. `PA_DIST`'s 175/123 targets only hold at 18, so this is a two-sided change | Opus |
| C3 | MEDIUM | 26 of 51 injury-flagged players have no note and no discount, including Nacua and Chase | Sonnet |
| B5 | MEDIUM | `survival()` and `roomPick()` disagree by up to 58pp; wide-SD players go 9.7 picks early in the simulator | Opus |
| B4 | MEDIUM | Run detector fires in **50.6%** of 8-pick windows — 4-of-8 is the base rate, not a run | Opus |
| D5–D8 | MEDIUM | `REPORT_SOLO_SYSTEM` unreachable; report prompt asks what its payload cannot answer; Worker error leaks a JSON parser message; `briefTries` survives `resetDraft()` | Sonnet |
| C2 | MEDIUM | Jacobs' injury field reads "NA/Groin" not exempt-list; only the hand note is right | Sonnet |
| B6 | MEDIUM | "Can't crack your starting lineup" shown for an empty slot. **Re-check — I1 may have fixed it** | Sonnet |
| B8 | MEDIUM | Modeled room finishes with 8.8/12 kickers, 10.8/12 defenses | Opus |
| B9–B12, C4, C5, D9–D14, F2, I6 | LOW | See the reports | Sonnet |

**F5 and F9 are decisions, not fixes.** F5: KV is eventually consistent and a two-colo race
can silently drop a draft; the fix is a Durable Object for one key. F9: the Worker forwards a
client-supplied `system` prompt, so any visitor can run an arbitrary prompt on the owner's key,
bounded only by the $50/day stop. **Both are the owner's call. Recommend, do not implement.**

---

## 5. Phase 3 — the night itself

*Source: `qa-review-prompt.md` §J.*

The number that justifies this phase: **the user has 15 picks and has to record 180.** Their
own picks are two taps after E1. The other 165 are typed by hand, on a clock, while watching
Yahoo on the same screen.

### P3.1 — Measure `roomPick` before building anything · Opus · 1 hour — DONE 2026-09-05

`node ff/tools/measure-roompick.js` exists and was run on 2026-09-05: 200 seeded drafts,
33,000 opponent picks, `roomPick`'s frequency-ranked prediction scored against a
structurally different "chalk with reaches" room (read the file header — there is no logged
real draft, so this is a proxy, not ground truth).

```
round   top-1   top-3   top-5        round   top-1   top-3   top-5
  1     32.0%   88.0%   94.6%          8     25.0%   52.3%   68.0%
  2     31.9%   80.5%   91.8%          9     21.7%   42.3%   57.5%
  3     31.5%   69.2%   86.8%         10     16.2%   35.8%   55.0%
  4     30.1%   68.0%   90.1%         11     12.9%   31.0%   50.0%
  5     12.8%   52.2%   80.4%         12      1.5%    7.7%   23.8%
  6     16.6%   58.3%   79.1%         13      1.3%   12.0%   27.6%
  7     29.0%   66.7%   87.6%         14      7.3%   16.3%   30.5%
                                      15      6.5%   24.6%   41.7%
overall: top-1 18.4%  top-3 47.0%  top-5 64.3%
```

**Verdict: ship P3.2, and let the round decide the treatment.** Three predictions cover the
actual pick well over half the time through round 8 and near 90% in the first two rounds,
which is where the room moves fastest and the user is most behind. From round 9 the three
are a coin toss and from round 12 they are noise; they stay on screen only if they are labeled
as guesses, and the "tap him in the list" path is the primary action there. The round-5/6 dip
is the QB and TE runs the chalk room does not model; expect it on the night.

### P3.2 — The live draft board · Opus to design, Sonnet to build · 5 hours

**What the user asked for, in their words (2026-09-05):** an easy-to-read live draft board at
the top of the middle column that keeps the app in step with the Yahoo client. It must show,
at a glance, which team is on the clock, what round and pick it is, who was picked last, and
the three players that team is probably about to take, so that recording an opponent's pick
is one tap and moving to the next pick is automatic. When the team takes somebody else, the
user goes to the player list and double-clicks or taps the button to credit that player to
that team, and the board moves on. The whole live experience has to be clean, interactive and
obvious: at every moment the user knows exactly what is going on and exactly what to do next
to keep the draft moving.

**What exists.** `renderTracker()` already has the four bands the README describes — head
(where *you* are), do (one instruction, one button), order (three ahead, the clock, four
behind), keep (the step-away band and catch-up). The user's screenshot at pick 3 shows the
gap: the bold line is "You're up in 8 picks", the team on the clock is a sentence inside the
do band, the last pick is a row in the order list with no emphasis, and there is nothing to
tap — every one of the 165 opponent picks is a hunt through the player list.

**The redesign, band by band.** Keep the four bands; change what each one leads with.

1. **The clock, not you.** The bold line becomes the draft's state: `Pick 3 · Round 1 ·
   TEAM 3 on the clock`, with the team name in the team's own color chip so it can be found
   across a room. The second line is you: `You're up in 8 · picks 11 and 14`. When it is your
   pick the two lines swap and the panel takes the `up` treatment it already has. The
   progress hairline stays.
2. **Last pick, said once and loudly.** A single line directly under the head: `Last: pick 2 ·
   team 2 · RB Jahmyr Gibbs`, with the position chip, and an inline **Undo** on it for four
   seconds after a record (the same `armOnce` pattern as Start over — one press, no dialog).
   This is the line the user checks against the Yahoo panel after every pick, so it is the
   line that has to be right and visible without scrolling. An unknown pick reads `Last: pick
   2 · team 2 · name not recorded · name him` with the existing re-credit path behind it.
3. **The do band becomes the pick-to-pick loop.** For an opponent on the clock:
   - The instruction: `Pick 3 goes to team 3.` One line.
   - **Three predicted picks as tap targets**, from `roomPick` run as a Monte Carlo over the
     current pool with the on-clock team's own roster counts and depth cap, ordered by
     **probability, not board rank**. Each target shows name, position chip, NFL team and
     ADP, so the user can confirm identity against the Yahoo panel at a glance before
     touching it. One tap records that player to the team on the clock, the last-pick line
     updates with its Undo, the head advances, and the next team's three targets render
     in the same place — no scroll, no focus change. That is the loop.
   - **Honest labels by round**, from the P3.1 table: through round 8 the group is captioned
     `likely` and the chips are full weight; rounds 9 to 11 read `maybe`; from round 12 the
     caption is `long shots` and the chips are the ghost treatment. The caption is text
     computed from the round, so the design degrades with the measurement rather than
     pretending.
   - Under the targets, the fallback in one sentence: `Took someone else? Tap him in the
     player list` (desktop: `double-click him`), and the existing **Pick went to…** for a
     name the user did not catch. The player list's row button already carries the on-clock
     team's initials; that path does not change.
   - Targets must never include a player the team cannot take (`depthCap` — the room model
     already refuses them) and must use the same `marketAdp()` the practice room uses, so a
     pasted Yahoo file sharpens them.
   - With no Yahoo paste in rounds 12 and later, and a top-3 under 10%, consider showing
     only the caption and the fallback; the number decides, and the spec allows it.
4. **The order band stays**, but two corrections. The team label on a past pick must be the
   team the pick was *credited to*, and when that differs from the snake's owner it says so
   (`team 1 · re-credited`): the screenshot shows pick 2 labeled `team 1` under pick 3 for
   team 3, which is either a re-credit or a defect and the row cannot currently tell the user
   which. And the three upcoming rows carry the same predicted first choice per team in dim
   text, so the user can see a run forming before it lands.
5. **The keep band stays as it is.** Catch-up is the recovery when the loop is broken by
   absence; the loop above is what keeps it from breaking.

**On the user's own pick.** The do band becomes what it is now — the brief's pick with its
Draft button and the three cards below — with one addition: the last-pick line and the head
stay in the same place, so the panel does not jump between the two modes.

**Why the risk J1 named is now acceptable.** J1's concern stands: a tapped wrong name is a
silently wrong board. Three things answer it. The target shows enough to confirm identity
(name, position, NFL team, ADP) rather than a bare name. The record is undone by one press on
the last-pick line for four seconds, and by Undo in the app bar after that. And the targets
sit above the order band, not at the bottom where a thumb rests. Measure the wrong-tap rate
in the E2 device check before the night: five people, twenty picks each, against a printed
Yahoo mock. If it is above one in fifty, the chips get a second tap to confirm on touch.

**Keyboard, desktop only.** `1`, `2`, `3` record the corresponding target when nothing has
focus; `Escape` undoes within the four seconds. Show the digits on the chips.

**Layout.** The band grows by one row of three chips, about 48 px on touch. The E1 rule holds:
nine board rows visible under the sticky head at 744×1133 and the tracker fully visible at
1133×744 without scrolling the column. If the row does not fit in portrait, the order band
drops from four past picks to two — the last-pick line already carries the most recent one.

**Tests, in `test-app.js`, before the UI is styled:**
- the three targets are ordered by `roomPick` frequency, never by composite;
- no target violates the on-clock team's `depthCap`, including K and DEF;
- tapping a target records the player to the on-clock slot with `mine: false`, advances
  `currentPick()` by one, and the next call produces targets for the next team;
- undo within the window removes exactly that pick and restores the pool, survival numbers
  and the team's roster to the byte;
- a re-credited pick is labeled in the order band;
- the round caption is `likely` at round 8 and `maybe` at round 9;
- in a `Just the board` league the targets are still offered (the pool is what matters) but
  the record is unattributed, and the head reads the pick count without a team.

**Acceptance.** Time twenty consecutive opponent picks on the iPad against the Yahoo mock:
a predicted pick records in one tap and under two seconds; an unpredicted one in two taps
and under six; the user never has to scroll the middle column to do either; and after every
record, the head, the last-pick line and the next targets are correct without a refresh.
Screenshots at both iPad viewports go in the commit.

**Pointer.** The suggestion-engine review (`qa-suggestion-prompt.md`, workstream H) verifies
that the same `roomPick` and `marketAdp()` feed these targets and the practice room, so the
rehearsal and the night draft the same room.

### P3.3 — "Still need", in words · Sonnet · 30 minutes

`positionalNeed()` computes it every render and the status strip does not print it. In the
user's round-8 screenshot the answer was "WR2 and K" and nothing on screen said so. One line,
always visible: what is empty, and how many picks are left to fill it. **Highest value per
minute of work in this document.**

### P3.4 — Brief provenance · Sonnet · 20 minutes

The header reads `CLAUDE · ON THE CLOCK AT PICK 86`. Say which pick it was written for and
how many picks have gone since, so a two-pick-old plan does not read as a fresh decision.

### P3.5 — Batch-record from Yahoo · Sonnet, speculative · 2 hours

Investigate whether Yahoo's live results panel can be pasted to reconcile several picks at
once. **Verify against a real Yahoo page on an iPad before proposing anything**, and if it
cannot usefully be copied there, say so and drop it.

**Constraint on all of Phase 3:** the board must keep nine rows visible under the sticky head
at 744×1133 — that is E1's acceptance criterion and it is already tight. Check every addition
at both iPad viewports.

---

## 6. Phase 4 — after the draft

*Source: `qa-findings-H.md` §5.*

1. **Post-draft weekly outcome tracking.** The only item that produces a *measurement* rather
   than another input. Without it, `PA_DIST`, `GAME_SD`, `adp_sd` calibration and the 74 hand
   grades can never be scored against reality.
2. **Score the D/ST thesis, then rebuild `PA_DIST` from Vegas implied totals.** Right project,
   wrong week — it changes `pts` for all 27 defenses and the boosted-tier board rank is the
   entire pick-14 plan.
3. **A fitted grade model** — H4's defaults plus nflverse usage shares, draft capital, age and
   games-missed history as features in one trained model rather than five hand-weighted fields.

H explicitly says **do not** touch before Monday: Vegas totals (H11), playoff-week SOS (H12 —
"genuine but overrated, and it has nowhere to live"), and Yahoo full-PPR ADP (H13 — "there is
no such source, stop looking").

---

## 7. Live AI runs — needs approval before any of it

*Source: `qa-findings-D.md`, final section. ~100 calls, under $3, one sitting.*

Nothing in the AI layer has been measured against a real model. Everything in D and I2 is
static analysis. Still unanswered:

- **Latency p50/p95 against the 30-second client timeout and the two-minute clock.** D's
  threshold: if p95 is above 12 seconds that is HIGH, because the brief is written two picks
  ahead and in a fast room it will arrive after the pick.
- **The `output_config.effort` setting.** The Worker sets none, so Sonnet 5 runs adaptive
  thinking at default effort and those tokens count against `max_tokens`. D calls this the
  single largest efficiency lever available and it belongs in the Worker. Test `low` and
  `medium` against the default on the same 30 states.
- **Advice quality.** 20 briefs under Balanced and 10 under Hero RB: the board's #1, the
  brief's pick, the fallback, and whether the argument was grounded in something the board
  could not see or was a restatement of the composite. A brief that always agrees is not
  earning its cost; one that disagrees for reasons already in the composite is arguing with
  itself.

**Run this after P2.1 and P2.2 land**, so the numbers describe the payload that will actually
ship. One second between scripted calls. The Worker's limit is 90/IP/minute and the daily stop
is $50; a test that trips either is itself a finding.

---

## 8. What "done" looks like

Monday morning, in this order:

```bash
cd ff/worker && npx wrangler dev --port 8787 --local   # in one terminal
bash ff/tools/test-all.sh                              # in another — 7 suites, 0 skips
python ff/tools/bake-players.py                        # fresh FFC pull
node ff/tools/audit.js                                 # 0 high, 0 medium
node ff/tools/test-config.js                           # stamp matches, proxy is production
```

Then: the deployed build stamp matches `config.js`, the Worker answers, the account signs in
from the iPad, the E2 checklist passes on the real device, and the printed board is on paper
as the fallback.

**The honest summary of where this stands.** The board's arithmetic was wrong in a way that
made it recommend a backup at a filled position on 35% of mid-round picks, and in round 8 on
100% of them; that is fixed and measured. The Draft button could record the wrong player; that
is fixed and pinned. The iPad was unusable and is now usable, though not yet on the actual
device. What has never been tested is the AI layer against a real model, and the flows —
catch-up, offline, two devices — that decide whether the app survives contact with a live
draft. **That is where the remaining risk is, and it is all in Phase 1.**
