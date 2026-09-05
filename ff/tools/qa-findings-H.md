# Workstream H — what data would actually raise the fidelity of the picks

Draftline QA, 2026-09-04. Draft is Monday 2026-09-08 19:00 CDT, Yahoo #257015,
12 teams, 15 rounds, snake, slot 11, full PPR, keeper Drake Maye at pick 59.

Everything below is grounded in what is in `ff/data/players.js` today and in the
actual terms of `composite()` in `ff/assets/engine.js`. Every claim about a field
count or a board rank in this document was produced by running the engine against
the committed data, not from reading the README.

---

## 0. Read this first: where a new number can actually land

`composite()` returns exactly these terms, and a new signal must enter through one
of them or it does nothing:

| Term | Fed by, today | Blast radius |
|---|---|---|
| `value` | `player.pts` (via `customPoints`), `replacement[pos].points`, your roster | Total. Changing `pts` also changes replacement level, `posRank`, `vor`, tiers, and everyone else's `marginal`. |
| `marginal` | `marginalVor()` — same `pts`, your lineup | Same as above |
| `vona` | `expectedBestAvailable()`, which is `pts` filtered by `survival()` → `adp`, `adp_sd` | Large. The only place ADP touches the *score*. |
| `mult` | run detector (+0.12) and style `posBias` / `earlyPosBias` only | Narrow. Nothing else can reach it. |
| `ceilingAdj` | `player.ceiling` only. `((ceiling-70)/100) * 26 * wCeiling`, `wCeiling` ramps 0.20 → 1.00 across rounds 3→15 | Additive, bounded. Max about ±8 points late, ±1.5 in round 1. |
| `riskAdj` | `player.risk` only. `((risk-50)/100) * 26 * wRisk`, `wRisk` ramps 1.00 → 0.30 | Additive, bounded. Max about ±13 in round 1, decaying. |
| `byePenalty` | `player.bye` against your own starters | Narrow, late |
| `tagPenalty` | `player.tag`, and only when a style sets `tagPenalty` (Floor first alone) | Very narrow |
| `bonus` | slot urgency, `stackBonus`, `handcuffBonus` (the latter two only when a style sets them) | Narrow. Balanced sets neither, so under the default style `stackBonus` and `handcuffBonus` are literally zero all night. |
| `blocked` | `depthCap`, floor rounds | Binary |

Two consequences that shape the whole ranking:

1. **`depth`, `depthPos` and `injury` — the 216 depth-chart slots and 51 injury
   designations already baked and already displayed — contribute exactly zero to
   the score.** They are a badge, a column, and a line in the Claude brief.
   Verified: the only reads in `app.js` are at lines 2316, 2557 and 3775, all
   rendering; `engine.js` never mentions either field. The richest signal already
   in the file is not wired into a single point of composite.
2. **`ceilingAdj` and `riskAdj` are the only cheap doors.** They are additive,
   bounded, and touch nothing else. Any new season-level judgment — schedule,
   role security, draft capital, age — should come in through a grade rather than
   through `proj`, because `proj` moves replacement level and re-ranks the entire
   board four days before a draft.

And the number that decides the priority order below:

```
top 100 by composite, empty roster at pick 11:  36 of 100 carry a ceiling/risk grade
top  50:                                        13 of 50
top  24:                                         5 of 24  (McCaffrey, Bowers, Walker, Jeanty, McBride)
```

Rounds 1 through 4 — the picks that decide the season — are 90 percent ungraded.

---

## 1. The verdict, in one paragraph

The highest-fidelity data you can add before Monday is **the same data, four days
newer**, plus **your own league's real Yahoo ADP**, which the app already parses
and which nobody has pasted. After that, the single biggest *modeling* gap is that
the 74 hand grades are applied asymmetrically: a researched player gets a real
`riskAdj` and an unresearched one gets zero, so the grade layer today is a penalty
applied only to the players you bothered to look at. Fixing that with defaults is
about three hours and it is the only item on the 3.H list that changes a top-24
pick. Everything else on the list is either next season's project, or a
plausible-sounding number that will not move a single pick before Monday — and I
say which is which below, including two items I recommend you actively do *not*
do this week because they would make the board worse.

---

## 2. Before Monday — ranked by edge per hour

### H1. Re-bake on Sunday night, and re-pull FFC ADP with it — 45 minutes

**Not on the 3.H list, and it beats everything on it.**

**Source.** Sleeper projections endpoint and `/v1/players/nfl` (free, no account,
the URLs are already in `bake-players.py`); FFC 12-team PPR mock ADP for
`tools/players.json` (free, no account, public page).

**How it enters.** `tools/bake-players.py` → `data/players.js`. Unchanged pipeline.

**Which term.** `value`, `marginal`, `vona`, and through `adp`/`adp_sd`, every
survival number and the whole modeled room.

**Why it is first.** `meta.built` is `2026-09-04` and the ADP window is
`Aug 27–Sep 4`. Between Thursday and Monday there will be final cut-down
fallout, one or two backfield resolutions, and — the big one — ADP moves more in
the 72 hours before Labor Day drafts than in the preceding month. Every
survival probability, every `vona`, every "there / maybe / gone" on the board is
computed against ADP. A five-pick ADP move on a player with `adp_sd 3.4` is the
difference between 85 percent and 20 percent survival, which is the difference
between spending pick 11 on him and waiting until 14. No feature in section 3.H
moves a pick as reliably as that does.

**What could go wrong.** Sleeper asks for at most one call a day on the 15 MB
players feed — pull it Sunday, not repeatedly. A re-bake can move projections;
the brief's own workstream C rule applies (anything moving more than five points
is a finding, not an accepted update). Re-run `test-engine.js` and `audit.js`
after. And add the freshness assertion from workstream G so this cannot be
forgotten on the morning.

---

### H2. Paste your league's Yahoo draft analysis — 20 minutes, zero code

**Also not on the 3.H list.** The feature is built (`assets/draftanalysis.js`),
documented in the README, and as far as this data goes, unused.

**Source.** `https://football.fantasysports.yahoo.com/f1/257015/draftanalysis`.
Free. Behind *your own* login, which you have. Visible to every league member,
not just the commissioner. Six chip clicks (QB/RB/WR/TE/DEF/K) covers the top 30
at each position.

**How it enters.** Pasted in League setup, stored per-league in localStorage as
`S.league.yahooAdp`. `marketAdp()` blends it into what `roomPick()` draws
against.

**Which term.** Not `composite` directly — it changes `survival()` and the
modeled room, which changes `expectedBestAvailable()` and therefore **`vona`**,
plus the WAIT? and VALUE columns you actually read on the clock.

**Why it is second.** Everything else on this board is *mock* ADP. This is real
completed-draft ADP from the platform this league runs on, with a seven-day
movement column, which is live market behavior a static file cannot give you.
At slot 11 the entire question all night is "does he last the 21 picks from 14 to
35", and that question is answered by ADP, not by projections.

**What could go wrong.** Yahoo's page says *"ADP based on standard scoring
settings"*, and this is a full-PPR league. That bias lands hardest on exactly the
players where it matters most — pass-catching backs and slot receivers will be
listed later than a PPR room would take them. Workstream C is checking that
`marketAdp()` blends rather than replaces. Treat these numbers as *where the room
behaves*, not as a ranking, and do not let them override the PPR mock ADP for
pass-catchers. Also: the `?pos=DEF` and `?pos=K` row shapes are noted as
unverified in the README, so paste those two last and check the parse summary.

---

### H3. Confirm every other team's keepers — 30 minutes, zero code

**Not on the 3.H list. Possibly the largest single distortion in the model.**

**Source.** Your league's own settings/team pages. Free.

**How it enters.** League setup → keepers, with a slot per keeper. The app
already supports opponent keepers: `keeperAt()` and `pendingKeepers()`
(`app.js:150`, `:166`) assign `mine: slot === S.league.slot`, so a keeper
belonging to team 4 is removed from the pool and burns team 4's round-N pick.

**Which term.** The pool itself, and therefore `vona` (through
`expectedBestAvailable`), `need`, `bonus` urgency, and the entire pick schedule.

**Why.** Today the board is configured with exactly one keeper: yours. If eleven
other teams keep a player each, then eleven top-100 players are not in the draft
and eleven picks are consumed, and *every* survival number on the board is wrong
in the same direction — the board will tell you players are gone who are still
sitting there, and tell you to reach. This is a five-minute fix if the league has
other keepers and a five-minute confirmation if it does not. Either way you want
to know before 19:00.

**What could go wrong.** Nothing, except that entering a keeper for the wrong
round burns the wrong pick. Verify the schedule display after entering them.

---

### H4. Default ceiling and risk grades for the 193 ungraded players — 3 hours

**This is the top item that is actually on the 3.H list, and the only one that
changes a round-1 pick.**

**Source.** No external source needed. Everything comes from fields already in
`data/players.js` — `depth`, `depthPos`, `injury`, `adp_sd`, `posRank`, `tier`,
`adp` vs `posRank`, `tag` — plus one new field, **age**, which is one line in
`load_player_meta()` away: `players_nfl.json` carries `birth_date` and is already
on disk (gitignored, re-fetch with the URL in the bake script; free, no account).

**How it enters.** `bake-players.py`, writing `ceiling` and `risk` for every
player who lacks one, with a `gradeSource: "modeled"` field so the UI can say
which grades are researched and which are derived. **Do not overwrite a hand
grade.** The 74 that exist are better than any model you will write on Friday.

**Which term.** `ceilingAdj` and `riskAdj`, and nothing else. Bounded, additive,
zero blast radius on replacement level or tiers. This is the safest meaningful
change available.

**Why it is the highest-value code change.** Two reasons, and the second is the
one the brief did not name:

1. The advertised reason: Upside hunter and Floor first are inert on 87 percent
   of the top 50. Upside hunter's whole content is `ceilingWeight: 1.9`, which
   multiplies zero for 37 of the top 50 players. The style renders a diff, moves
   nobody who matters, and the user reasonably concludes the app is lying to them.
2. The reason that costs you points: **under Balanced, the grade layer is a
   penalty applied only to the players you researched.** `riskWeight` defaults to
   1 and `wRisk` is 1.00 in round 1. McCaffrey carries `risk: 88`, so he takes
   `((88-50)/100)*26*1.00 = -9.9` at pick 11. Jonathan Taylor, Puka Nacua,
   Ja'Marr Chase, De'Von Achane and every other ungraded player in the top 24
   takes exactly 0.0 — not because they are safe, but because nobody wrote a note
   about them. That is a systematic bias, not a neutral gap, and it is live in the
   default style at your two most valuable picks. Giving everyone a grade removes
   a bias; it does not merely enable two styles.

**Suggested model, in order of signal quality — all inputs verified present:**

*Risk (50 = neutral, higher = riskier):*
- Injury designation: `IR` / `PUP` / exempt +25, `Questionable` +4 only. Note
  that 45 of the 51 designations are `Questionable` and both Nacua and Chase
  carry one on 4 September; in the first week of September that tag is closer to
  noise than to news, so weight it lightly or it will drag half the top 20 down
  together.
- Depth chart: `depth >= 2` at the same `depthPos` +15 (he has not won the job);
  `depth === 1` −5; no `depth` at all +5 (216 of 267 have one, so a missing slot
  is itself mildly informative).
- Age from `birth_date`: RB 27+ +12 and 29+ +20; WR/TE 30+ +8; QB 36+ +8.
- `adp_sd` as market uncertainty, normalized within position: the market's own
  disagreement is a genuine risk signal and it is already in the file for all 267.
- `tag` in {LANDMINE, INJURY, AVOID} +15.

*Ceiling (70 = neutral, higher = more upside):*
- Youth: rookies and second-year players +12.
- `adpResid` negative (the other market takes him earlier than his peers) +6.
- Positional `tier` 1–2 +8.
- `tag` in {BREAKOUT, SLEEPER, FLAG_PLANT} +10, `RISER` +6.
- Rookie draft capital, if you do H8 below.

Clamp both to roughly 35–95 so a modeled grade can never out-swing a researched
one, and make the defaults *narrower* than the hand grades on purpose.

**Hours.** 2 in the bake, 1 re-running `test-engine.js` and `audit.js` and
eyeballing the top 40 under Balanced, Upside and Floor to confirm the reordering
is defensible. Add an audit assertion that every player has both grades.

**What could go wrong.** This is the item with the most ways to quietly hurt you.
(a) If the modeled grades are as loud as the hand grades, a spreadsheet guess
about age now outranks a researched note — hence the clamp. (b) Double-counting:
`adp_sd` already drives `survival()`, so feeding it into `risk` makes the same
uncertainty move both the score and the wait column; that is defensible but you
should know it is happening. (c) `Questionable` is the trap — 45 players carry it
and if you weight it like a real injury the board will re-rank on a designation
that half the league carries in early September. (d) Reversing the sign. `risk`
is *subtracted*; `ceiling` is *added*. Write the assertion before the model.

---

### H5. A real handcuff map from depth 2 — 1.5 hours

**Source.** Already baked. `depth` and `depthPos` on 216 players; 26 running backs
carry `depth: 2` at `depthPos: "RB"`.

**How it enters.** `app.js:295-298` builds `handcuffTeams` as `{team: true}` for
every team you own an RB on. `composite()` (engine line 548) then pays
`st.handcuffBonus` to *any* RB on that team. Measured against the current data:
30 teams have more than one RB on the board and **37 players would collect the
team-only bonus, against 26 who are genuine depth-2 backs**. So roughly 30 percent
of the bonus today is paid to the wrong player — most often the receiving back who
is not the handcuff at all, and, worse, in both directions: own the backup and the
*starter* collects a handcuff bonus for handcuffing himself.

The fix is small but it is an engine signature change, so per rule 3 of the brief
it is a write-up, not a commit:

```js
// app.js, replacing the team-only map
var handcuffOf = {};
mine.filter(function (p) { return p.pos === "RB"; }).forEach(function (owned) {
  DATA.players.forEach(function (q) {
    if (q.pos === "RB" && q.team === owned.team && q.name !== owned.name &&
        q.depthPos === "RB" && q.depth > (owned.depth || 1)) handcuffOf[q.name] = owned.name;
  });
});
// ...ctx.handcuffOf = handcuffOf;   (keep handcuffTeams for one build as a fallback)

// engine.js composite(), replacing the team test
if (st.handcuffBonus && ctx.handcuffOf && ctx.handcuffOf[player.name] && player.pos === "RB") {
  bonus += st.handcuffBonus;
  reasons.push("handcuffs your " + ctx.handcuffOf[player.name]);
}
```

**Which term.** `bonus`, exclusively.

**Honest edge.** Smaller than it looks, and here is why: **Balanced does not set
`handcuffBonus` at all.** Only Hero RB (5 points) and Zero RB (8 points) do. So if
you draft Balanced on Monday this change moves precisely nothing. It is worth the
90 minutes because it is cheap, because it makes the reason string true instead of
false ("handcuffs your SEA back" pointing at the pass-catching back is a number on
screen that is wrong, which is the thing this whole QA engagement exists to
prevent), and because Zero RB's entire late-round thesis rests on it.

**What could go wrong.** `depth` is missing on 1 of 59 relevant backs, so guard
the comparison. Depth charts in the first week of September are the most volatile
field in the feed — a depth-2 back can be depth-1 by Sunday. And the strict
`q.depth > owned.depth` test means owning the backup no longer flags the starter,
which is correct but will look like a regression to anyone who liked seeing both.

---

### H6. Set `gp` to expected games — but not the way the brief describes — 1 hour

**This one needs a correction before you spend any time on it.** The 3.H item
reads "injury return timelines, not just designations: a `gp` discount for IR and
PUP read from the news date rather than a flat 18." Run against the data, that
recommendation is backwards, and acting on it would cost you points.

**What the data actually says.** Every player carries `gp: 18`. Every one. But the
season totals **already price the absence**:

| Player | Designation | ADP | Board points | Board VOR rank |
|---|---|---|---|---|
| Josh Jacobs | exempt list | 69.3 | 88 | 206 |
| Jordyn Tyson | IR | 158.0 | 113 | 223 |
| Zach Charbonnet | PUP | 137.7 | 68 | 226 |
| James Conner | IR | 152.8 | 58 | 239 |
| Isiah Pacheco | IR | 157.4 | 54 | 244 |
| Tank Dell | IR | 166.9 | 53 | 264 |

An 88-point running back at ADP 69 is not a player projected as if healthy. Sleeper
(RotoWire) has already cut these season totals hard. **Applying a `gp` discount on
top of that would double-count the absence**, and it would do so on six players the
board already ranks between 206 and 264 — that is, it would push players who are
already effectively off the board further off it, and change no pick you would
ever make.

**The real bug is the opposite sign.** `customPoints` uses the season total
directly; `games` only enters `perGame` and, critically, `gamesOver()` — the
per-game yardage bonus model. So for a player whose season total was cut for six
missed games while `gp` still says 18, the model divides a 12-game total across 18
games, understates his per-game mean by a third, and therefore **understates his
150-yard bonus count** in the games he does play. Same arithmetic, milder, applies
to the whole board: `gp: 18` against a 17-game regular season understates every
per-game mean by about 6 percent.

**The correct change**, and it is small: set `proj.gp` to expected games played
(17 for the healthy, a researched number for the six above), **leave the season
totals exactly as Sleeper gives them**, and let `gamesOver()` see the right
per-game rate.

**Which term.** `value`, `marginal`, `vona` — via `pts`. Blast radius is real but
the magnitude is small and confined to the bonus categories, and it is directionally
right for everybody.

**Source for the return timelines.** There is no clean free structured source. The
designations you already have plus one pass through a news digest for six players
is the whole job.

**What could go wrong.** This changes `pts` for the whole board four days out, and
`test-engine.js` pins scores against independently derived numbers, so several
assertions will move. Per rule 5 of the brief, explain each delta before touching
it. If you are short of time on Sunday, **do the six injured players and leave the
17-versus-18 question for after the season** — it is a uniform ~6 percent scaling
of one small category, so it barely reorders anything.

---

### H7. Local-first brief telemetry — 2 hours, and it earns nothing on Monday

**Source.** Your own client. Free by construction.

**How it enters.** Wrap `claudeOnce()` (`app.js:3697`). Per call, append to a
capped array in localStorage: `pick`, `round`, `lead`, `latencyMs`,
`input_tokens`, `output_tokens`, `stop_reason`, `model`, whether the brief was a
re-ask, the brief's named player, the board's number one at that moment, whether
they matched, and — recorded later, in `record()` — who the user actually took.
An export button in More that dumps JSON. Opt-in, off by default, one sentence
saying it never leaves the device.

**Which term.** None. It touches no score.

**Why it is on the before-Monday list anyway.** It is the only way to answer "is
the AI earning its cent" and the only chance to collect the data is a draft that
happens once. Two hours on Sunday buys the entire dataset for next season's
decisions about model, effort setting and whether the brief is worth having.
Ship it behind a flag and make absolutely sure a throw inside the logger cannot
take the brief down with it — wrap every write in try/catch and never let
telemetry sit in the path between the model's answer and the render.

**What could go wrong.** A localStorage quota error during a draft. Cap the array
at a few hundred entries and catch. And do not let this compete with the E1 iPad
fix for Sunday evening — if it does, it loses.

---

### H8. Rookie draft capital as a ceiling input — 1 hour, only as part of H4

**Source.** `nflverse` draft picks (`nflverse-data` GitHub releases, plain CSV
over HTTPS). Free, no account, one `curl`. This is the cleanest free NFL data
source that exists and it needs nothing but a URL.

**How it enters.** A join in `bake-players.py` on normalized name plus draft year,
feeding the `ceiling` model in H4. It is not worth its own field.

**Which term.** `ceilingAdj`.

**Honest edge.** Small on its own — draft capital is mostly already in the ADP —
but it is the single best available signal for the one group where projections are
weakest, first-year players with no target history. Do it only if H4 is going
smoothly and you have an hour spare. The name join is the risk: rookies are
exactly where suffixes and nickname mismatches bite, and `norm()` strips suffixes
already, so check the join count and print the misses rather than trusting it.

---

## 3. Before Monday, as an hour of reading rather than an hour of code

Two of the 3.H items are worth real money this week, but as a **manual check on
your own top 100**, not as a pipeline. Building either one properly is a
next-season project; using either one as a question list takes 45 minutes.

### H9. FantasyPros expert consensus rank and its per-expert spread — 45 minutes, read it, do not import it

**Source.** FantasyPros publishes consensus PPR rankings with Best / Worst /
Average / Std Dev per player on a free public page. The **page** is free and
needs no account. The **CSV export and the API** require an account and, for the
API, a key — so before Monday this is a page you read, not a feed you pull.

**How it would enter.** It would not, cleanly, and this is the important part.
ECR is a *ranking*, and this board's ADP layer is a *draft position*. They are not
the same quantity and blending them is a category error — a player can be ranked
15th by every analyst and drafted 40th, which is information about the market, not
a correction to it. And the per-expert spread is not a substitute for `adp_sd`:
`adp_sd` measures where the room actually takes him (which is what `survival()`
and `roomPick()` need), while the ECR spread measures how much analysts disagree
about how good he is. Feeding analyst disagreement into `survival()` would make the
wait column wrong.

**Which term.** If used at all: `ceilingAdj` / `riskAdj` via the H4 model, where a
wide expert spread is a legitimate risk input. Never `adp_sd`.

**What it is genuinely worth this week.** Sort your top 100 by composite, put ECR
beside it, and read the twenty biggest disagreements. Each one is either (a) a
research note you should refresh, (b) a scoring-rules edge that is exactly why this
app exists — a player the consensus underrates because they are scoring standard
and you are scoring full PPR with 40-yard bonuses and boosted D/ST tiers — or (c) a
join error. You want to know which before Monday. That is a 45-minute read with a
real chance of catching a stale note in the top 100, and it is a better use of the
time than any scraper.

**What could go wrong if you automate it anyway.** Scraping their page is against
their terms, the HTML changes without notice, and you would be introducing a new
ranking source into a board whose whole thesis is that consensus rankings are wrong
for this league's rules. The README's own framing — "Claude is told to trust the
board's numbers rather than substitute consensus rankings" — argues against
importing consensus at all.

### H10. 2025 target share, red-zone share and snap share — 45 minutes as a check, 6 hours as a pipeline

**Source.** `nflverse` weekly player stats and play-by-play, published as CSV and
parquet on GitHub releases. Free, no account, `curl`-able before Monday. This is
genuinely the best free data on this list.

**How it would enter.** As inputs to the H4 risk model (a depth-1 back with a
2025 snap share under 40 percent is carrying role risk the depth chart does not
show), and as a QA layer over the projections: flag every top-150 player whose
Sleeper projection implies volume he has never earned.

**Which term.** `riskAdj` through the grade model. **Not** `value` — do not let a
2025 share number modify a 2026 projection directly. That is a re-projection, and
re-projecting the board four days before a draft using a hand-rolled model is how
you end up trusting your own arithmetic over RotoWire's.

**Honest edge before Monday.** Low as a pipeline, high as a spot check on the
fifteen players where your board most disagrees with ADP. The pipeline is a
six-hour job with a name-join problem and a rookie problem (no 2025 data at all
for a third of the interesting names), and the payoff arrives as a small nudge to
`riskAdj`. Not before Monday. Worth doing properly in the off-season, where it
becomes the backbone of a real grade model.

---

## 4. Actively do not do these before Monday

### H11. Vegas implied team totals and win totals — do not touch the D/ST model this week

**Source.** The Odds API has a free tier but requires signing up for a key
(account). Sportsbook pages are scrapeable but unstable. Aggregator sites publish
season win totals free. So: obtainable, with an account, in an evening.

**How it would enter.** The honest version replaces `PA_DIST` — five hand-
calibrated seven-bucket distributions in `bake-players.py` — with a distribution
derived from each defense's opponents' implied totals. Scientifically, that is
strictly better than hand calibration, and it is the right project.

**Which term.** `value`, `marginal`, `vona`, plus replacement level, `posRank` and
tiers for all 27 defenses.

**Why not this week.** This is the largest blast radius on the entire list applied
to **the sharpest thing the engine does**. The boosted points-allowed tiers are
this app's thesis; the board currently has Houston, Seattle and Denver at VOR
around 60, board ranks 22 to 24, which is the argument for taking a defense at
pick 14. `PA_DIST` is calibrated so a tier-1 unit lands near 175 season points and
a tier-3 near 123, and `test-engine.js` pins those figures against a research
digest derived independently. Swapping the calibration on Friday means the one
number the whole draft plan rests on is now four days old and unvalidated, with the
tests either failing or, worse, edited to agree with it.

**Do this instead, and it is 30 minutes:** pull the win totals by hand, put them in
a column beside your five researched `dst_tier` values, and check they agree. If a
tier-1 defense sits on a team with a 6.5 win total, that is a conversation about the
research, not a change to the model. Use Vegas as a **check on the tier assignment**
before Monday and as a **replacement for `PA_DIST`** in February.

**What could go wrong if you do it anyway.** Points-allowed is a property of the
defense *and* its offense's time of possession *and* game script, none of which an
implied total cleanly separates. You would be trading a calibration that was
validated against an independent research digest for one that is theoretically
better and empirically untested, four days out, on the position the plan depends on.

### H12. Playoff-week strength of schedule, weeks 15 to 17 — genuine but overrated, and it has nowhere to live

**Source.** Free and easy: `nflverse` schedules, or ESPN's public JSON schedule
endpoint. No account. Opponent defensive quality for 2026 is the hard half, and you
have a partial answer already sitting in the data — the researched `dst_tier` on
27 of 32 defenses.

**How it would enter.** A new `sos15_17` field in the bake, and then a decision
about where it lands in `composite()`. There is no existing term for it.
`playoffWeeks` is parsed (`parser.js:162`), stored on the rules
(`app.js:3415`), present in all four presets as `[15,16,17]`, and read by nothing.

**Which term.** It would need a new one, or it folds into `ceilingAdj` as a small
signed nudge. Do **not** put it in `value` by scaling `proj` — that would move
replacement level and tiers on the strength of a three-week matchup guess.

**Honest assessment, as a drafter.** For skill players this is the classic
plausible-sounding number that does not move a pick. A three-week schedule is 18
percent of a season, the projected quality of a 2026 defense in December is a guess
made in September, and the effect size on a receiver's expected points is inside the
noise of the projection itself. If it is worth ±3 points of composite, it is a
tiebreaker between two players the board already rates within 3 points — which is
to say, between two players it does not matter which you take.

**Where it is genuinely real: D/ST, and only D/ST.** A defense's weekly score is
dominated by the opponent's points scored, which is the most matchup-dependent
quantity in fantasy, and this league's boosted tiers (25 for a shutout) amplify it
further. Three good playoff matchups is worth real points to a defense you are
holding rather than streaming. So if you spend an hour on schedule data before
Monday, spend it on **27 rows, not 267**: opponent for weeks 15–17 for each
defense, scored against your own `dst_tier` table as a proxy for offensive quality,
displayed as a column and used as a tiebreak between defenses the board rates
within a few points. That is a genuine edge at pick 14 and it costs an hour.

**What could go wrong.** Using `dst_tier` as a proxy for the opponent's *offense*
is a category error — you would be rating Seattle's week-15 matchup by how good the
opposing *defense* is. You need an offensive-quality proxy, and the cleanest free
one is the implied team total from H11, which brings the account problem back. The
honest cheap version is your own judgment over 27 rows on a Sunday afternoon.

### H13. Yahoo full-PPR ADP — there is no such source, stop looking

**Source.** Yahoo publishes ADP for its own default scoring, which is what the
draft-analysis page says on its face. Yahoo's Fantasy Sports API can return
league-scoring-aware research, but it is OAuth 2.0 behind a developer app
registration and a consent flow — not something to stand up in four days, and not
something to stand up at all for one league.

**What you already have that is better.** FFC's primary ADP **is** 12-team PPR
mock ADP, from 7,681–7,848 mocks in the Aug 27–Sep 4 window. Sleeper's `adp_ppr`
is already baked as `adp2` on 205 players with a de-drifted residual. You have two
PPR ADP sources. The Yahoo paste's job is *platform behavior and movement*, and
the README already says so. Nothing to add here. Zero hours, and the right answer
is no.

---

## 5. After the season

Ranked. These are the ones that compound.

**A1. Post-draft weekly outcome tracking.** Record each week's actual points for
every player you or the room drafted. This is the only thing that can ever tell
you whether the D/ST tier model is right, whether `GAME_SD = {pass: 78, rush: 34,
rec: 32}` matches real week-to-week variance, whether `adp_sd`-driven survival was
calibrated, and whether the 74 hand grades predicted anything. Every other item on
this list is an input; this is the only one that produces a **measurement**. It is
first because without it you cannot rank next year's inputs by anything but taste.
Feed it: a weekly paste of the Yahoo scoreboard, stored alongside the draft, plus
a scoring script. Which term: none directly, all of them eventually. Roughly a day.

**A2. Score the D/ST thesis, then rebuild `PA_DIST` from Vegas.** With A1 in hand,
compute the realized points-allowed distribution per defense and compare it to the
five hand-calibrated buckets. Then rebuild the distributions from opponent implied
totals (H11) and check *that* against the same realized data. This is the item
that either confirms the app's central claim — that boosted tiers move a defense
eight rounds — or corrects it. Terms: `value`/`marginal`/`vona` via `pts`. Two to
three days including the odds pipeline.

**A3. A real grade model, trained rather than hand-written.** Take H4's defaults,
H10's usage shares, H8's draft capital, plus games-missed history and age from
`nflverse` rosters, and fit `ceiling` and `risk` against realized season outcomes
rather than asserting coefficients. Terms: `ceilingAdj`, `riskAdj`. This is where
target share, red-zone share, snap share, age and games-missed history all belong —
as features in one model, not as five separate fields nobody weights consistently.
Three to four days, and it makes Upside hunter and Floor first mean something
across the whole board rather than the 74 players someone had time to read about.

**A4. Read the telemetry from H7 and decide about the AI.** One draft's worth of
per-brief latency, tokens, stop reason, agreement rate and what the user actually
picked answers, empirically: does the brief disagree with the board often enough to
be worth a penny, and when it disagrees, is it right. It also settles the `effort`
question from workstream D with data instead of a judgment call. Half a day of
analysis on data you already collected.

**A5. Weekly playoff SoS, done properly.** With A2's opponent-quality model in
hand, weeks 15–17 becomes a real number rather than a guess, and it can be a
displayed tiebreaker with an honest confidence attached. Half a day, once A2 exists.

**A6. Survival calibration.** Workstream B is already tabulating whether the
board's "there" list survives 70 percent of the time in its own simulator. Whatever
that says, a season of real drafts — yours plus any others you can paste — is the
data that would let `survival()` be fitted rather than assumed. The current model
is a normal CDF on ADP with an SD floor of 1.5, and 23 of the 267 players carry a
suspiciously round `adp_sd` (integers 1, 3, 5, 6, 9, 11–16, 19, 32) that look like
defaults rather than FFC's measured spread. Worth a day.

---

## 6. What this adds up to for the four days you have

| | Hours | Moves a pick Monday? |
|---|---|---|
| H1 re-bake Sunday, fresh ADP | 0.75 | **Yes, several** |
| H2 paste Yahoo draft analysis | 0.3 | **Yes — every survival number** |
| H3 confirm opponent keepers | 0.5 | **Yes, if they exist** |
| H4 default ceiling/risk grades | 3 | **Yes — top 24, under the default style** |
| H5 real handcuff map | 1.5 | Only under Hero RB / Zero RB |
| H6 `gp` = expected games | 1 | Marginally, in the right direction |
| H7 brief telemetry | 2 | No — buys next season |
| H8 rookie draft capital | 1 | Only as part of H4 |
| H9 FantasyPros ECR, read manually | 0.75 | Indirectly, by catching a stale note |
| H12 playoff SoS, defenses only | 1 | Tiebreak at pick 14 |

Total for the whole before-Monday column is about eleven hours, and the first three
rows are ninety minutes of them and carry most of the value. If you get exactly one
evening: **H1, H2 and H3, then H4 if the evening is long.** If workstream A or E1
is still open on Saturday, all of section 2 waits — a board with a correct iPad
layout and a stale ADP beats a board with perfect grades that you cannot tap.
