# The signal layer — turning tribal knowledge into a number that scores

Draft: Tuesday 2026-09-08, 19:00 CDT. Board baked 2026-09-04.
Status: design only. Nothing here is built yet.

---

## 1. What the board already does, and the one thing it cannot do

The engine's shape is right. A pick's score is

    score = base + ceilingAdj - riskAdj - byePenalty - tagPenalty + bonus

where `base` is VOR computed through this league's exact rules, and `ceiling`
and `risk` are 0-100 grades that carry everything the projection does not.
Those grades come from one of two places (`engine.js:436`):

* the **research layer** — 84 of 267 players hand-annotated with
  `tag / ceiling / risk / note / source`, or
* a **derived fallback** — projected points percentile, Sleeper depth-chart
  slot, injury designation, and a market residual.

On top of that sits `applyMarket()` (`engine.js:316-381`), which nudges ceiling
and risk from two market facts: seven-day Yahoo ADP movement, and `adpResid`,
Sleeper's price against what a player at this board price normally costs on
Sleeper. The comment there already states the governing principle correctly:
**direction moves the ceiling, magnitude of disagreement moves the risk.**

So the machine for absorbing outside information exists. What it lacks is
information. Specifically:

**Every non-projection signal in the app today is a market signal.** FFC ADP,
Sleeper ADP, Yahoo ADP. Three prices for the same thing. Prices can tell you
that two rooms disagree; they cannot tell you both rooms are wrong, and "both
rooms are wrong" is the entire definition of a sleeper.

**Coverage is inverted.** The 84 annotated players are the famous ones. The 183
unannotated players are where the gems are, and for those the board falls back
to depth chart and injury flag — which is to say, back to roughly what ADP
already knows.

**The prose does not score.** A `note` reaches Claude and reaches the card. It
never touches the number, so the board sorts as if the research had not
happened. The `edge` tag is worse than that: 36 players carry `DEEP_THREAT`,
`BONUS_RUSHER` or `DST_ARBITRAGE`, it is baked into `players.js`, and **nothing
reads it** — not the engine, not the board, not the Claude payload. Those are
scoring-rule edges in a league with 40+ yard bonuses and return yards at 20/pt,
which is precisely where this league differs from default, and they are
invisible. That is the disease in one field.

**Survival reads price only.** `surv` is ADP plus `adp_sd`. It does not know a
player is being taken two rounds earlier this week than last. Timing is where
drafts are won, and the timing model is the least informed thing in the app.

---

## 2. The twelve signal families

Ranked by value per unit of work, with what each one knows that ADP does not.

### A. Expert consensus residual (ECR − ADP)

FantasyPros ECR is the median of 130+ published expert ranking sets, and it
carries a best rank, a worst rank and a standard deviation across those experts.

* **What it knows:** the difference between what analysts write and what
  drafters do. This is the literal, canonical form of "the experts like him more
  than his price."
* **How to use it:** *not* raw ECR minus ADP. ECR ranks ~300 players against
  this board's 267 and the two scales drift apart with depth for the same
  structural reason `adpResid` already corrects for. Regress ECR rank on board
  ADP, take the residual. Reuse the `adpResid` method verbatim.
* **Second signal, free:** the expert best/worst spread is genuine
  *disagreement* telemetry. Wide spread means high risk in both directions. That
  is a cleaner risk input than anything currently in the derived fallback.
* **Access:** official API (`api.fantasypros.com/public/v2/json`, `x-api-key`),
  free key for prototyping, production key bundled with HOF at ~$9/mo. Cheapest
  edge in this entire document.

### B. Sharp-market gap — the single best signal for *this* draft

Not all ADP markets are equal, and the app currently treats them as if they
were. Two populations:

* **Sharp:** NFFC / FFPC (high-stakes, real money), Underdog best ball (deep,
  liquid, daily refresh). These absorb news within hours.
* **Casual:** Yahoo, ESPN, Sleeper. These lag by days, sometimes weeks — the
  bake script already documents a live example, Josh Jacobs at 38 on Sleeper
  against 69 on FFC because Sleeper had not absorbed his 30 August move to the
  Commissioner's Exempt List.

**Ken drafts in a Yahoo league.** So `sharpADP − yahooADP` is not an abstract
disagreement; it is the exact number of picks of discount the room is going to
hand him, player by player. A player the sharps take at 60 and Yahoo drafters
take at 88 is available at 88 *in this room* and worth 60. That is the whole
product in one subtraction.

This is the highest-value item on the list and it is nearly free: Underdog ADP
is published daily on several public tables, Yahoo real-draft ADP arrives
Monday, and `apply-ffc.py` already has the merge plumbing.

### C. ADP velocity, with a cause attached

One-, three- and seven-day movement per market. `ytrend` does this for Yahoo
already. Extend it and read it two ways:

* Moving fast in a **sharp** market, flat in Yahoo — news propagating and not
  yet priced here. Maximum opportunity, decaying by the hour.
* Moving in **both** — already priced. The sleeper list you read was read by
  eleven other people in your league.

Velocity has a causation problem that no number solves: a player rises because
of a camp report, or because the man ahead of him tore an ACL. Those are
different bets. The cause has to come from family L.

**Velocity must feed `surv`, not just score.** A player with +9 picks of
seven-day sharp movement will not last to your next pick even though his stored
ADP says he will. Build an *effective* ADP from stored ADP plus a bounded
velocity and sharp-gap correction, and let survival read that. This is the
change that most directly alters behavior, because it changes when you reach.

### D. Betting markets — the sharpest projections in existence

Season-long player props (rushing yards, receiving yards, receptions, TDs,
passing yards) are projections with money behind them, published by
institutions that lose real dollars for being wrong. They are, on average, less
wrong than any free projection set, including the RotoWire numbers this board is
built on.

* **Wire them through the league's own scoring.** Take the prop-implied stat
  line, feed it to the existing points function, get prop-implied fantasy points
  in *this* league. Then `vegasGap = vegasPts − boardPts`. When Vegas says 1,180
  rushing yards and RotoWire says 940, one is wrong, and the board should say
  which one it is standing on.
* **The absence of a line is information too.** Books post season props only for
  players they think matter. A deep sleeper who *has* a posted rushing-yards
  line is a player the market is taking seriously.
* **Team win totals and season point totals** give offensive environment, which
  is a team-level multiplier on everybody.
* **Perishable.** Season-long props thin out and get pulled near kickoff, and
  books shade toward public money in the last week. Pull them Monday, stamp the
  timestamp, and treat a week-old line as a week-old line.
* **Access:** The Odds API has a free tier; several comparison pages publish the
  lines in scrapable tables.

### E. Prior-season opportunity metrics (not production)

Production is what ADP already prices. Opportunity is what predicts next year.

* **Route participation rate** (routes / team dropbacks) — the most stable and
  most predictive receiver metric there is. 85% route share with mediocre
  production is a breakout waiting; 55% route share with good production is a
  bust waiting.
* **YPRR** — efficiency independent of volume. High YPRR with low route share is
  the textbook sleeper shape.
* **WOPR** = 1.5 × target share + 0.7 × air-yards share. One number, free from
  play-by-play, and it beats target share alone.
* **RB:** snap share, routes run (this is full PPR — receiving backs are
  mispriced by default), carries inside the ten, goal-line carry share.
* **TDs over expected** — the cleanest two-way regression signal. Twelve TDs on
  eight expected regresses down next year; the inverse regresses up. ADP
  systematically overpays last year's touchdowns.
* **Access:** nflverse / nflreadr, free, CC-BY. WOPR, air yards and target share
  come straight from play-by-play. True routes-run and YPRR need FTN charting
  (in nflverse, CC-BY-SA) or PFF (paid).
* **Cost:** the biggest lift on this list. A one-shot extraction for the 183
  unannotated players is realistic; a maintained pipeline is not, before Tuesday.

### F. Vacated opportunity

For each team, sum the targets, carries and routes that belonged to players no
longer on the roster or now buried on the depth chart, then hand them to who is
left in depth order.

This is the mechanical version of "who gets more work this year," it is the
number one driver of breakouts, and **both inputs are already on disk** —
`players_nfl.json` has current depth charts, and last year's usage is one
nflverse pull away. Highest value-to-effort ratio of the modeled signals.

### G. Draft capital and age

* NFL draft pick number is the best single rookie predictor. Teams give snaps to
  the players they spent picks on, and they give those snaps sooner than ADP
  expects.
* "Draft capital says starter, depth chart says starter, ADP says backup" is the
  loudest buy signal in fantasy, and all three inputs are free.
* Age curves as a risk input: receiver breakout age, the running-back cliff
  around 27-28 (the existing CMC note is a hand-written instance of exactly
  this), the tight end year-three leap.
* **Access:** free. Sleeper's players feed already carries age, years of
  experience and draft position; we download it and throw those fields away.

### H. Scheme, pace and play volume

New coordinator, pass rate over expectation, neutral-script pace, plays per
game. An offense that adds sixty plays over a season is worth real points to
everyone on it. Team-level multiplier, thirty-two rows, hand-maintainable.

### I. Schedule, and specifically the fantasy playoffs

Weeks 1-4 SOS matters a little. **Weeks 15-17 SOS matters a lot and almost
nobody prices it.** Two receivers at identical ADP, one of whom faces three
bottom-five pass defenses in the weeks that decide the league, is a real
tiebreak that costs nothing to compute.

Elegantly, the opponent-strength input can be Vegas team totals from family D,
so this signal is nearly free once D exists.

### J. Injury specifics beyond the designation

We have Sleeper's designation. We do not have recovery timeline, practice
participation, or snap ramp — and the difference between year-one and year-two
post-ACL is one of the better-documented discounts in the sport. Monday and
Wednesday practice reports are the freshest telemetry that exists anywhere.

### K. Field behavior and pick distributions

Per-market "percent of drafts in which he was gone by pick N" is strictly better
than assuming a normal distribution around ADP with `adp_sd`. It feeds `surv`
directly and it fixes the tails, which is where reach-or-wait decisions live.

### L. The beat-writer sweep — the actual tribal knowledge

Everything above is structured. The thing Ken is actually asking about — what
the writers, the camp reporters and the analysts are *saying* — is not, and this
is where Claude earns its place in the stack.

**The mechanism that matters: make it structured on the way in.**

Do not ask Claude for prose about a player and paste the prose into `note`. Ask
for a schema:

    { player, roleDirection: -2..+2, roleConfidence: 0..1,
      cause: "camp" | "depth" | "injury" | "scheme" | "usage" | "none",
      asOf: date, oneLine: string, sources: [url] }

`roleDirection` scores. `oneLine` and `sources` explain. `cause` is what
disambiguates family C's rising-player problem. `asOf` is what lets the system
discount a stale report the way the SYSTEM prompt already discounts a stale
depth chart.

Run it over a bounded set — the sixty-odd players who are both within reach of
Ken's picks and flagged by any numeric signal as a divergence. That is an
affordable batch on Monday night, and the output merges into the same annotation
layer the hand research already writes to. The hand layer does not get replaced;
it gets extended to the 183 players nobody had time for.

---

## 3. The data model

A `signals` object per player, sitting beside `proj`, where every entry carries
a value, a source and an as-of date. Provenance is not decoration — the app
already tells the user how old the board is, and the SYSTEM prompt already
reasons about that staleness. Every new signal inherits that obligation.

    signals: {
      ecrResid:  { v: -18.4, src: "FantasyPros ECR, n=142",       as: "2026-09-07" },
      ecrSpread: { v: 31,    src: "FantasyPros best/worst",        as: "2026-09-07" },
      sharpGap:  { v: -14.2, src: "Underdog vs Yahoo real drafts", as: "2026-09-08" },
      adpVel7:   { v: 9.1,   src: "Underdog 7-day",                as: "2026-09-08" },
      vegasPts:  { v: 214,   src: "props priced by league rules",  as: "2026-09-07" },
      vegasGap:  { v: 23,    src: "vs board projection",           as: "2026-09-07" },
      wopr:      { v: 0.61,  src: "nflverse 2025 pbp",             as: "2026-09-06" },
      tdOverX:   { v: 3.8,   src: "nflverse 2025",                 as: "2026-09-06" },
      vacTgt:    { v: 142,   src: "vacated, depth-weighted",       as: "2026-09-06" },
      capital:   { v: 41,    src: "2025 NFL draft",                as: "static"     },
      psos:      { v: -0.7,  src: "wk15-17 vs Vegas totals",       as: "2026-09-07" },
      roleDir:   { v: 1, conf: 0.7, cause: "depth",
                   src: "Claude beat sweep", as: "2026-09-08",
                   note: "...", sources: ["..."] }
    }

And the dead `edge` tag gets resurrected as a real term, because in a league
with 40+ yard bonuses and return yards at 20 per point, `DEEP_THREAT` and
`BONUS_RUSHER` are worth measurable points that the generic projection does not
capture.

---

## 4. How it scores

Five rules, in order of importance.

### Rule 1 — signals never touch `pts`

The projection is priced by league rules and must stay auditable end to end. A
signal that could move `pts` would make every downstream number unfalsifiable.
Signals move grades and price, never the projection.

The one exception worth arguing about is `vegasGap`, which genuinely is a
competing projection. Even there: do not overwrite. Carry both, show the gap,
and let the gap move ceiling and risk. A board that says "our projection is 940,
Vegas says 1,180, and here is what each implies" is more useful than a board
that silently splits the difference.

### Rule 2 — direction to ceiling, disagreement to risk

This is `applyMarket()`'s existing principle and it generalizes to every family.
Signed signals (sharpGap, ecrResid, vegasGap, roleDir, vacTgt, tdOverX) move
ceiling by their sign and risk by a fraction of their magnitude. Pure
disagreement signals (ecrSpread, cross-market variance) move risk only.

### Rule 3 — a new, separate `edgeAdj` term

    score = base + ceilingAdj - riskAdj + edgeAdj - byePenalty - tagPenalty + bonus

Ceiling is a statement about the **player**. Edge is a statement about the
**price**. Collapsing them loses the distinction the product is built on: "he is
good" and "he is cheap" are different claims, they come from different evidence,
and a user deciding whether to reach needs to know which one he is being sold.
`edgeAdj` carries the market families (A, B, C, K); ceiling and risk carry the
player families (D, E, F, G, H, I, J, L).

### Rule 4 — coverage-safe compositing

The engine has been burned by this exact thing before; `engine.js:248-253`
records a bug where a truthiness check made the whole ceiling/risk term vanish.
The signal layer has a bigger version of the same trap: a signal that exists for
forty players will silently outrank two hundred players whose only sin is
missing data.

So:

* **Mean-center within the coverage set.** A player with no data scores 0
  (neutral), never a penalty.
* **Fixed weight budget.** Family weights sum to a constant, so adding a
  thirteenth signal dilutes rather than inflates.
* **Orthogonalize inside families.** ECR, sharp ADP and Yahoo ADP are largely
  the same latent variable; adding them naively triples the weight of consensus,
  which is the opposite of the goal. One budget for the market family, residuals
  within it — the `adpResid` trick, applied everywhere. Same for usage: route
  share, target share and WOPR are near-collinear. Pick one at full weight.
* **Bound every contribution.** No single signal may move a player more than a
  fixed number of points. A scrape error should cost a few spots, never the
  first round.

### Rule 5 — feed `surv`, not only `score`

Build `adpEff` from stored ADP corrected by sharp gap and velocity, and let the
survival model read it. Score tells you who to want. Survival tells you when to
take him. Right now only one of those two is informed.

---

## 5. Why we surfaced this pick — the explanation layer

The engine already emits `reasons`. Every signal that moves a player past a
threshold should add one sentence in plain English, carrying its source and its
date. Not "high upside." Things like:

* "Sharp drafters take him fourteen picks earlier than Yahoo drafters do. You
  are in a Yahoo league, so that gap is your discount."
* "Vegas has his rushing line at 1,180. This board projects 940. In your scoring
  that is twenty-three points — call it a round and a half."
* "He ran a route on 84% of his team's dropbacks and finished as WR38. The 84%
  is the number that repeats. The WR38 is not."
* "Three of the ten targets that left this offense were his to inherit, and the
  depth chart now lists him first."
* "Nine of eleven experts have him ahead of his price; the two who don't have
  him fifty spots lower, which is why his risk grade is up as well as his
  ceiling."

### The confidence ladder

Every surfaced gem states which rung it stands on:

| Rung | Evidence | Character |
|---|---|---|
| **Priced** | market disagreement (A, B, C, K) | soft — the market may simply be right |
| **Modeled** | usage, vacated work, Vegas (D, E, F, G, I) | medium — a real mechanism, no confirmation |
| **Reported** | camp and beat reporting (J, L) | strong but perishable, and dated |
| **Confirmed** | depth chart move, transaction | hard |

A gem standing on three rungs is a different bet from one standing on one, and
that difference is exactly what a user needs in order to decide whether to reach
a round early. Pair it with a **"what would change our mind"** line — naming the
fact that would kill the thesis is what makes the rest of it trustworthy.

Claude's job in the payload then shifts. Today it gets numbers and is told to
trust them. With a signal layer it should get numbers *and their provenance*,
and be asked the question it is actually good at: **do these signals agree on a
story, or are they three restatements of one thing?**

---

## 6. QA — how this breaks

Every one of these has bitten a project like this before.

1. **Name matching across seven sources.** `norm()` exists and is good. Every
   new source needs a match report that *prints the unmatched names*. A silent
   name miss is how a sleeper disappears, and it disappears quietly, which is
   the worst failure mode available.
2. **Stale props.** Books shade toward public money in the final week. Stamp
   every line and let the age be visible.
3. **Sleeper-list survivor bias.** Content sites publish sleeper lists to be
   interesting. Once a player is on ten lists he is not cheap any more —
   velocity (family C) is the check, and it must be run *against* every list.
4. **Cause confusion.** A player rising because the starter tore an ACL is a
   different asset from one rising on merit. Direction without cause is a
   half-signal; family L supplies the other half.
5. **Double counting consensus.** Covered in Rule 4, and it is the most likely
   way this layer makes the board *worse* rather than better.
6. **League-rule bypass.** Every imported projection or prop must be priced
   through this league's rules — return yards at 20/pt, 40+ bonuses, boosted
   D/ST tiers. A signal that arrives in generic PPR points and is compared to
   this board's points is comparing two different currencies.
7. **Weights asserted rather than fit.** See section 8.
8. **The audit gate.** `audit.js` already flags board data older than three
   days. Every signal needs the same gate at its own appropriate age — a
   seven-day-old velocity number is not a velocity number.

---

## 7. What to do before Tuesday

Triaged. The draft is in three days and the schedule is the constraint.

**Tier A — Monday, free or ~$9, high value**

1. Yahoo real-draft ADP refresh (already planned), and compute `sharpGap`
   against it. This is the money signal for this specific draft.
2. Underdog ADP with 1/3/7-day movement.
3. FantasyPros ECR plus expert best/worst spread. One month of HOF.
4. Season-long Vegas props for the players who have them, priced through the
   existing scoring function.
5. Vacated targets and carries — both inputs are already on disk.
6. Resurrect the `edge` tag as a real scoring term. Thirty-six players, already
   researched, currently worth nothing.

**Tier B — if Monday goes well**

7. WOPR, air-yards share and TDs-over-expected from nflverse, one-shot, for the
   183 unannotated players.
8. Playoff SOS from Vegas team totals.
9. Structured Claude beat sweep over the ~60 flagged, in-reach players.

**Tier C — after the draft, this is the actual product**

10. Nightly structured beat sweep.
11. Per-market pick distributions feeding `surv`.
12. Weight calibration. See below.

---

## 8. The thing that makes this a model instead of an opinion

Every weight in section 4 is currently a guess, including mine.

The fix is a backtest, and it is a weekend of work: take 2025 preseason ADP and
reconstruct these same signals as of the same point in the calendar, then check
which ones actually predicted end-of-season points *above what ADP expected*.
That last clause is the whole trick — predicting fantasy points is easy and
useless, because ADP already does it. The only question worth asking is which
signals predicted the residual.

My prior on the answer, based on what is publicly known about these metrics:
route participation and vacated opportunity hold up, Vegas props hold up,
sharp-versus-casual ADP gap holds up in *this* application because it is nearly
tautological, expert consensus residual is weaker than it feels, and published
sleeper lists are worth close to nothing by the time they are published. That is
a prior, not a result, and it is exactly what the backtest is for.

Until it exists, every weight should be small, bounded, and shipped with the
honest label that it is a prior and not a measurement. A board that moves a
player nine spots for a reason it can name and date is worth having. A board
that moves him ninety for a reason it cannot defend is the thing this project
has spent its whole life avoiding.

---

## 9. Sources consulted

* FantasyPros API — https://www.fantasypros.com/api-data/
* FantasyPros ECR explainer — https://support.fantasypros.com/hc/en-us/sections/115000004767-Expert-Consensus-Rankings-ECR
* FantasyPros best-ball ADP — https://www.fantasypros.com/nfl/adp/best-ball-overall.php
* Sleeper API docs (trending add/drop) — https://docs.sleeper.com/
* nflreadr / nflverse — https://nflreadr.nflverse.com/
* nflreadpy — https://github.com/nflverse/nflreadpy
* Underdog ADP tables — https://www.draftsharks.com/adp/underdog · https://www.stackedfantasy.com/best-ball/adp/underdog · https://www.sharpfootballanalysis.com/fantasy/fantasy-football-adp-half-ppr-underdog-best-ball/
* Season-long player props — https://fantasyteamadvice.com/nfl/season-long-props · https://www.sharpfootballanalysis.com/betting/nfl-season-long-player-props/ · https://establishtherun.com/nfl-player-props-we-bet-season-long-2/
* 2026 sleeper/breakout coverage — https://www.espn.com/fantasy/football/story/_/page/FFSleepBustBreak26-49030808/fantasy-football-2026-rankings-nfl-sleepers-breakouts-busts · https://www.fantasypros.com/2026/09/fantasy-football-sleepers-experts-love-to-draft-2026/ · https://www.rotowire.com/football/article/2026-fantasy-football-sleepers-breakout-rookies-second-year-players-updated-131255
