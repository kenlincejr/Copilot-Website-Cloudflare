# Draftline — `/ff/`

A fantasy draft assistant that re-scores every projection through the user's actual
league rules and drafts off the result. Static files only: no server, no build step,
no network calls during a draft.

Lives at `copilotplaybook.com/ff/` (and `lincezone.com/ff/`, same repo root).
Excluded from `robots.txt` and carries `noindex` — it is not part of the
partner-facing site and is not linked from it.

```
ff/
  index.html          landing page + profile sign-in
  app.html            draft room
  assets/
    ff.css            dark instrument-panel styles (own system; not DESIGN.md's)
    engine.js         scoring + draft math. Pure functions, no DOM, no network.
    presets.js        scoring rule sets. Scoring is data, not code.
    auth.js           device-local profiles (PBKDF2 hash in localStorage)
    parser.js         league-settings paste parser
    app.js            draft room UI
    config.js         deployment config (the Claude proxy URL)
  worker/             Cloudflare Worker holding the shared Anthropic key
  data/
    players.js        267 players: ADP layer + projections + annotations, baked
  tools/
    bake-players.py   rebuilds data/players.js
    test-engine.js    31 assertions against independently-derived numbers
    test-parser.js    112 assertions against a real Yahoo settings page
    fixtures/         verbatim capture of that page
    players.json      the research board (input to the bake)
```

## Design decisions worth knowing

**No accounts, and the UI says so.** GitHub Pages / Cloudflare Pages serves static
files; there is nowhere to put a user table. A "profile" is a localStorage record
whose password is stored as a PBKDF2-SHA256 hash with a random salt. It gates the
profile on that device and nothing more. All state is namespaced under a
`profileId` so a real backend can be added later without a migration.

**Projections are baked, never fetched at draft time.** `data/players.js` is a
plain `<script>` assigning a global, so the app also runs from `file://` with the
network off. Source: Sleeper's public season projections endpoint (RotoWire
numbers), fetched once and committed.

**What we did not take from Sleeper, and why.** Sleeper's `rec_0_4 … rec_40p`
buckets are a fixed 18/18/27/18/9/9 split applied to every player — synthetic, not
projected — so the 40+ yard bonus counts are estimated from each player's own
volume and efficiency instead, and labelled as estimates in the UI. Every kicker
in the feed carries an identical stat line, so kickers are modeled off positional
rank. Sleeper publishes no points-allowed buckets at all, so D/ST points allowed
is a per-game probability distribution across the seven tiers, driven by the
researched `dst_tier`. That last one is where most of the edge lives.

**Yardage bonuses are per-game step functions**, estimated from a normal
distribution around the projected per-game mean — applying them once to a season
total would be wrong in both directions.

## How tiers are computed

The first attempt broke a tier wherever the gap to the next player beat a
multiple of the position's median gap. That is wrong in a way that only shows up
at the top of the board, which is the worst place for it: the median is dragged
down by the long compressed tail — dozens of players within a point or two of one
another — so the threshold came out around six points. Six points across a whole
season is noise, and the result was Gibbs T1, Robinson T2, McCaffrey T3. Three
singleton tiers covering the three best backs in the draft, which is useless and
looks broken enough to make someone distrust the rest of the board.

`assignTiers()` in `engine.js` now partitions each position optimally with
Fisher's exact 1-D clustering (dynamic programming), minimising variance within
each tier. It reads the shape of the whole position rather than reacting to one
local gap, and it produces:

- **RB** T1 Gibbs + Robinson · T2 McCaffrey + Taylor · T3 the eight from Cook to
  Jeanty
- **TE** T1 Bowers + McBride — the elite-tight-end cliff, which is why that
  strategy exists
- **QB** T1 Josh Allen alone, and that singleton is *right*: he is 34 points
  clear
- **DEF** T1 the top four, matching the researched tiers

O(k·n²), about 68k operations for the 92-deep receiver board, inside
`buildBoard` — which does not run per keystroke. Six assertions in
`test-engine.js` pin the behaviour.

## Columns

Four columns, chosen by the user from thirteen, via **choose columns** under the
filters. Defaults: points, bye, tier, wait.

Two things drove the design.

**Tooltips do not exist on a tablet.** So the picker itself is the documentation:
each option carries a full sentence on what it is *for*, not just what it is, and
you get at it by tapping.

**A raw number makes the reader do the interpreting, and there is no time for
that on a two-minute clock.** A percentage is a fact; "NOW" is a decision. So the
columns that can be read as a decision are:

- **TIER** — `T5 (1)`. Players grouped by the scoring cliffs at their position.
  Inside a tier they are interchangeable, so the question stops being *who is
  best* and becomes *how many are left*. The bracket is exactly that; at `(1)` he
  is the last of his group and waiting drops you a whole tier. Amber at 1.
  See **How tiers are computed** below — the obvious approach is wrong.
- **WAIT?** — `wait` / `risky` / `NOW`, from survival odds against your own next
  pick. Above 70% spend this pick elsewhere; under 35% it is now or never.
- **VALUE** — `fell 1.2` / `fair` / `reach 1.4`, his ADP against the pick on the
  clock in *rounds*. "fell" is the free money.

The numeric originals (`VOR`, `SURV`, `Δ`, `ADP`) are all still on the menu for
anyone who prefers them, alongside `VS STD` — what your scoring does to him
versus plain PPR, which is the arbitrage the whole tool exists for.

## Recording a pick

Each row carries two buttons. The left one is the team on the clock's initials —
pressing it means *they* took him, and he comes off the board. The right one,
**TO ME**, puts him on your roster instead. A legend under the filters spells
that out with the current team's name in it, because two initialisms on a row are
not self-explanatory.

On your own pick there is only one button, **DRAFT**, because "someone else took
him" is not a thing that can happen on your turn. Ownership is derived from the
clock in live mode rather than from which button was pressed: a pick recorded at
your slot is yours either way. Without that, a mis-click credited the player to
your slot with `mine: false` — he appeared on your team in Rosters and nowhere on
your own roster panel.

## Starting over

**Start over** sits in the tracker's control row while a draft is running, and
again in the stopped/complete panel, which is where people look for it. It clears
every pick and returns to pick 1 and touches nothing else — scoring, roster
shape, keepers, team names, draft style and column choices all survive, which is
what makes it safe to press when you just want another run at it. Keepers come
straight back because a keeper is roster configuration, not a pick.

It is destructive, so it asks with itself rather than with a browser dialog:
first press arms the button and turns it red, second press does it, and it
disarms after four seconds on its own. `armOnce()` in `app.js`.

## Pause, stop, simulate

The tracker header carries three controls. **Pause** stops the clock only and
hands the elapsed time back on resume, so the countdown continues rather than
jumping. **Stop** ends the tracker, keeps every pick, and offers Resume and the
report. **Simulate** fills in opponent picks up to your next one — roughly best
available by ADP with some noise — so the whole flow can be rehearsed before it
matters. Simulated picks are ordinary picks: undo works on them, the tracker
labels the draft as containing them, and Reset draft in League clears the lot.

## Viewing another team

The roster panel's heading is a dropdown. Pick any team to see their roster,
their positional needs and their bye clashes computed exactly the way yours are.
Reading an opponent mid-draft is how you work out what they are about to take,
and making that a modal is friction you do not have on a two-minute clock.

## Two ways to run a draft

Chosen at the top of League setup, and switchable mid-draft without losing
anything.

**Live draft** attributes every pick to whoever is on the clock. That buys the
tracker, all twelve rosters, a graded league report, and opponent-need inference
for the Claude brief — "both teams ahead of you still need a back" is a sharper
survival read than a standard deviation. It costs you recording *who* took each
player rather than just that he is gone.

**Just the board** tracks only your team. You still mark players off as they go —
the pool has to be right or nothing downstream is — but nothing is attributed to
anyone. Your points, value over replacement and survival odds are *identical*,
because those need the pick count, not who made the picks. What you lose is the
tracker, the rosters view, the league table, and the opponent context in the
brief. The report in this mode says so plainly and shows your roster against
replacement level instead of inventing a field of twelve to rank you in.

The picker states the cost of each rather than selling both as equivalent.

## Start draft, and the tracker

`Start draft` opens a panel at the top of the middle column and is the thing to
work from once the draft is running. In one place: the round and pick, who is on
the clock, the next three on deck, your next pick with how many away and roughly
how long that is on your league's clock, the last six picks with the team that
made them — and, most importantly, a box to record the pick that is happening
right now.

That box takes partial names ("bijan", "chase") and matches against what is
actually still available, so it cannot put an already-drafted player back on a
roster. Whatever you type goes to whoever is on the clock. **Didn't catch it**
records an unknown pick: the slot is spent, the player stays available, and the
board's pick count stays level with the real draft, which matters more than the
name.

Underneath, it says whether the board is in step with the live pick number, and
offers catch-up when it isn't.

## The league, not just your team

Team names are edited **in the Rosters view** — click any card's title and type;
it saves as you go. (They are also in League setup, under "Who else is in the
league", but the roster cards are where people look for them.) They replace
"team 7" everywhere — ticker, status strip,
draft log, catch-up sheet, the row action button, and the report. **Rosters**
shows all twelve at once, grouped by position with bye weeks, or one at a time.

Every pick has always been attributed to whoever was on the clock; that was just
invisible. The search placeholder now names the team the next Enter will credit,
and each row's action button carries that team's initials.

## Draft report

Grades are **computed, not asked for**. Each team's best legal starting lineup is
scored in the league's own rules, ranked against the rest, and the letter is a
percentile of that. Surplus adds every pick's points above replacement, which
rewards depth a starting lineup can't show. Bye risk flags three or more starters
idle in one week.

Claude is then asked to *read the table* — the shape of your draft, the biggest
weakness and its cost, which rival is the real threat, and two concrete waiver or
trade moves. It is told to trust the numbers and not re-rank them.

## Bye weeks

A tracker in the right column counts your **starters** — bench players on a bye
cost nothing — per week, with the positions in each. On the board, the bye cell
colours when a pick would create a problem, and the two problems are distinct:

- **amber (watch)** — another starter at that position is already on that bye.
- **red (clash)** — you would have no like-for-like starter that week, because
  every slot at the position is already idle then.
- **red (overload)** — too many starters idle in one week, whatever they play.
  The threshold is 3 by default and the draft style can move it.

## Mock drafts

Style names tell you nothing about what they leave you holding. The Style panel
runs the draft out from wherever it currently stands — 25 times, or 50 when
comparing two — with the room taking roughly the best available by ADP and your
own picks chosen by the style's composite score. It reports the median starting
lineup, the positional composition, and the most common player in each slot with
how often he filled it. About 80ms for 50 drafts.

Both styles in a comparison get the **identical sequence of opponent picks**,
from a seeded generator reset per style, so a difference between them is the
style rather than the dice.

The first version skipped value-over-next-available to save time. That turned out
to be a much worse shortcut than it sounded: with nothing to counterweight raw
VOR, the engine kept taking the position with the fattest number and every style
produced the same running-back-heavy roster. It is computed properly now, and
Hero RB, RB-heavy and Zero RB separate as they should.

The caveat is stated in the UI: a room that drafts to ADP has no runs, no
reaches, and nobody chasing their own team's players.

## Draft style

Nine styles, each a set of overrides on the same composite score in
`engine.js` — `posBias`, `earlyPosBias`, `needWeight`, `ceilingWeight`,
`riskWeight`, `posFloorRound`, `tagPenalty`, `stackBonus`, `handcuffBonus`,
`byeTolerance`. Nothing in a style is an opinion the engine cannot act on.

Picking one shows a diff before it applies: which knobs move, and — the part
that matters — **which players move, with arrows**, computed by scoring the live
board twice. Zero RB on an empty roster lifts Nacua and Smith-Njigba into the top
three and drops Gibbs and Robinson four or five places. Undo returns to Balanced.

The taxonomy follows current coverage rather than received wisdom: Hero RB is the
prevalent 2026 approach, the market has swung back toward drafting backs early,
and Zero RB is genuinely contrarian this season. "Robust RB" barely appears in
2026 writing and is labelled RB-heavy for that reason.

**Free-text tuning.** Describe how you want to draft and Claude proposes the
knobs. Everything it returns goes through `sanitizeKnobs()`: unknown keys are
dropped, known ones are coerced and clamped to the bounds in
`DRAFTLINE_KNOB_SPEC`, and the user still sees the diff before anything applies.
A model proposing draft weights is a suggestion; letting it write arbitrary
numbers into the scoring engine would not be.

## Staying in sync with the real draft

Every number the board produces — survival, VONA, the on-deck brief — is computed
against whichever pick the app thinks the draft is on. Miss a few opponent picks
and all of them are wrong, confidently and without a word. That is the same
failure shape as any silent data bug, and it is the most likely thing to go wrong
during a live draft.

The fix is not a prompt for every pick; between picks 38 and 62 there are
twenty-three of those, and a modal in the way of each one loses to a two-minute
clock. Instead:

- A **live pick** field in the app bar. Type whatever pick number the real draft
  is showing. It is a checkpoint, not a counter — once your own recorded count
  passes it, it carries forward on its own.
- A **status strip** that owns the top of the board: teal when you are on the
  clock, amber when you are within three picks, and red the moment your count and
  the reported live pick disagree.
- **Catch up** when they do: one row per missed slot, each with a one-click ADP
  guess. The names are a guess and the UI says so — what matters is that those
  players are off the board, and roughly the right players being gone beats the
  right players still sitting there.
- A row you leave blank, or fill with a name already drafted, records as an
  **unknown pick**. The slot is consumed and the player stays available. Refusing
  to record it would leave the app permanently behind, which is the failure this
  exists to prevent.

## The board keeps drafted players

Picked players stay in the list, struck through and dimmed, in their original
ranked position, with who took them and at which pick. The gaps in the ranking
are themselves the information — a run is visible as a cluster of strikethroughs
near the top of a position. Toggle with the `drafted` pill; the choice persists.

The ticker under the status strip carries round, who is on the clock, who is on
deck, your next pick, and the last five names off the board — the draft log in
the right column is a record, the ticker is what you glance at.

The pick clock is a stopwatch, not a mirror: nothing here talks to Yahoo. Enter
your league's seconds-per-pick and it counts down from the last pick you
recorded, answering "roughly how long until I'm up" rather than claiming to know
the real timer.

## The three bands at the top

They used to repeat each other and the tracker. The app bar carried pick, round,
who was on the clock, your next pick and the countdown; the status strip repeated
the picks-until-you're-up; and the ticker repeated round, on the clock, on deck,
your pick and the recent picks — every one of which the tracker already showed in
the middle column with more room.

Now:

- **App bar** — identity and actions only. Undo, Rosters, Ask Claude, and one
  More menu holding report, style, columns, league setup, save/load and sign out,
  so the bar cannot overflow on a tablet.
- **Status strip** — the one thing that must be readable without looking
  anywhere: whose turn it is, how far away you are, or that you are out of sync;
  plus the countdown, right-aligned and large.
- **Ticker** — deleted.
- **Tracker** — everything else, and it gained the two orphaned inputs (live
  pick, clock seconds) that had been sitting in the app bar with no context.

## iPad

Landscape (1194) keeps all three columns. Portrait (834) drops to board plus
recommendation with the roster full-width underneath, rather than collapsing to
one column and burying the recommendation under 200 player rows. Under
`hover: none` the row actions stop hiding behind a hover that never arrives and
take a real column, rows grow to a 54px tap target, and every input is 16px so
iOS does not zoom the layout on focus. The app bar, status strip and ticker
scroll inside themselves — nothing makes the page itself scroll sideways.

## Cache busting

GitHub Pages serves everything with `max-age=600`, HTML included, so a push takes
up to ten minutes to reach a browser that already has the page. Two mechanisms,
because the obvious one is not enough:

1. Every `<script>` and `<link>` carries a `?v=` stamp. **Bump it on every asset
   change** — find-and-replace the value across `index.html` and `app.html`.
2. That alone does not work, and the reason is worth internalising: the stamps
   live *inside* the cached HTML, so a stale page names stale assets and busts
   nothing. `assets/config.js` therefore carries a matching `build` string, and
   the app re-fetches that file with `cache: "no-store"` on load. If the deployed
   build has moved past the running one it offers a reload to
   `app.html?v=<build>` — a URL the cache has never seen. Keep `build` and the
   `?v=` stamps in step or the banner never fires.

## Depth charts, injuries, and a second ADP

Three layers baked from Sleeper's free `/v1/players/nfl` endpoint and its
projections feed, answering "what is actually happening out there" rather than
"what did a mock drafter click".

**Depth chart slot** — `RB1`, `RB4`, `LWR2`. 216 of the 267 players on this board
carry one, against the 84 the hand-written research layer reaches. It is the best
available answer to *has he actually won the job*, and it corroborates the
research independently: Josh Jacobs reads RB4, Zach Charbonnet RB4.

**Injury designation** — Questionable / IR / PUP with the body part, shown as a
badge on the row because it is too important to sit behind a column toggle. 51
players on the board carry one, and it knows things the 4 September digest does
not: Puka Nacua and Ja'Marr Chase are both listed Questionable.

**A second ADP**, and this one needs care. Sleeper's own ADP is computed across
its entire user base, **mixes mock with real drafts, and refreshes only once or
twice a month**. It is therefore a second opinion, not a fresher one. The proof
is in the data: Josh Jacobs sits at 38 on Sleeper against 69 on FFC purely
because Sleeper has not absorbed his 30 August move to the Commissioner's Exempt
List. The `SPLIT` column shows the disagreement and its description says exactly
this — a wide split is a question, not an answer.

All three go into the Claude brief, and the system prompt tells it that depth and
injury are current while an ADP split usually means one market is behind the
news, so it should say which rather than assume an edge.

`tools/players_nfl.json` is ~15 MB and gitignored; re-fetch it with the URL in
`bake-players.py`. Sleeper asks that it be called at most once a day.

## Rebuilding the data

```bash
curl -s -o ff/tools/sleeper.json \
  "https://api.sleeper.com/projections/nfl/2026?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K&position[]=DEF"
python ff/tools/bake-players.py
node ff/tools/test-engine.js
```

`sleeper.json` is ~3 MB and is not committed. The ADP and annotation layers live in
`tools/players.json`; refresh that file to update ADP, injuries and notes.

## Real draft data, for free

Everything else on this board is mock-draft ADP. Yahoo publishes ADP from **real
completed drafts**, on the platform this league actually runs on, alongside a
**last-seven-days** column — which is live market movement, the one thing a
static file cannot give you. It is free and it is behind the user's own login.

League setup → *Add real Yahoo draft data* takes a paste of
`/f1/<league>/draftanalysis` and parses it (`assets/draftanalysis.js`). The page
paginates thirty at a time; pastes accumulate, and the top hundred or so is what
matters. It is stored per-league in localStorage rather than baked, because it is
that user's own view of the market and goes stale the moment they stop pasting.

Two columns come out of it: **REAL** (where the room actually took him) and
**7DAY** (which way he has moved this week, ↑ earlier / ↓ later). Both go to
Claude as well.

Stated in the UI, because it matters: Yahoo's page says *"ADP based on standard
scoring settings"*, so these are not this league's PPR numbers. They are for
market behaviour and movement, not ranking — the board keeps using its own
scoring for that.

## The audit

`node ff/tools/audit.js` hunts the class of bug the tiering had: numbers that
render without error and are quietly wrong. It checks that no depth-chart slot or
team contradicts the board, that nothing scores non-finite or zero, that
replacement ranks exist within each position, that survival stays in [0,1] at the
extremes, that tiers neither fragment into singletons nor collapse into one
bucket, that the composite is finite for every player, that a full position is
actually blocked, and that the ADP residual is centred. Re-run it after any
change to the bake or the engine.

It found one real bug on its first run — see the ADP residual note below — and
its own first version had a false-positive check that flagged every running back
as mis-joined because the regex stripping receiver side-designators (LWR/RWR)
also ate the R in RB.

## Tests

`node ff/tools/test-engine.js` — 31 assertions. It checks the scoring engine
against Sleeper's own PPR totals (must match to within 2%), and checks survival
probabilities, replacement levels, the keeper-adjusted pick schedule and the D/ST
point totals against figures derived independently in the research digest.

`node ff/tools/test-parser.js` — 112 assertions against
`fixtures/yahoo-settings.txt`, a verbatim capture of a real Yahoo Scoring &
Settings page. The last block cross-checks every parsed value against the
hand-built `kinda_highlanders` preset: two independently produced paths must
agree on all forty-odd scoring keys.

Three things about that page break a reasonable-looking parser, all covered in
`assets/parser.js`:

- **Changed settings render as three lines.** Label, the literal words "Yahoo
  Default", then `<your value> <Yahoo's value>`. Skip lines without a number and
  you drop every non-default setting — precisely the ones this tool exists for.
- **The same label means different things per section.** "Interception" is 2
  under Defense/Special Teams and -2 under Offense; "Return Yards" and
  "Touchdown" appear in both. Rules are scoped to the section heading.
- **The label can contain a number.** "Points Allowed 0 points" is worth 25.
  Values are read from the text *after* the matched label, never from the start
  of the line.

## The Claude feature

Claude is given the board's already-computed numbers and told to trust them
rather than substitute consensus rankings. It is there for judgement on top of
the math, not to re-rank anything.

### The on-deck brief

The feature worth having. When the user's pick is a configurable number of picks
away (default 2), the app fires exactly one request and renders the answer at the
top of the centre column — so the call is already on screen when the clock
starts, rather than thirty seconds into a two-minute timer. It is cached against
the pick number, so re-renders, undo and reload never spend twice.

What makes the question worth asking is the context, not the model. Claude gets
the board's own numbers, the research notes on the specific players still
available, and — the part no ADP-based tool has — **what the teams picking
between now and your turn still need**. Every recorded pick is attributed to the
team that was on the clock, so opponent rosters come for free, and "both teams
ahead of you still need a running back" says more about who survives than a
standard deviation does.

### Two ways it gets its key

`assets/config.js` decides. If `claudeProxy` is set, the page calls that Worker
and nobody needs a key of their own. If it is blank, the app falls back to asking
each user for their own key, held in their own localStorage and sent straight to
`api.anthropic.com` with `anthropic-dangerous-direct-browser-access: true`.

### The Worker

`worker/` is the shared-key path. There is no way to put one key in front of many
users on a static site without a server in the middle: embedding it in the
JavaScript means anyone can read it out of View Source and spend the balance.

Because the proxy is public, anyone who can open the page can spend the owner's
money. The Worker bounds that rather than trusting the client:

| Control | Why |
|---|---|
| Origin allowlist | Only the real pages can call it |
| Model + `max_tokens` pinned server-side | A caller cannot ask for Opus at 64k |
| Sonnet 5, not Haiku | Haiku 4.5 was measurably unreliable on this task — see below |
| Per-IP rate limit (12/min) | Stops a single tab hammering it |
| Daily budget ceiling ($2, all callers) | Hard stop; the board still works |
| 24 KB body cap, last 4 messages only | Nobody can stuff the context window |

**On the model choice.** The brief asks for reasoning across ~15 players with six
numbers each while holding a pick schedule straight. Haiku 4.5 failed that
repeatedly in live testing: it named an empty WR slot and then recommended a
running back, and called a 24-pick gap "three picks" with the correct number on
screen beside it. Sonnet 5 is ~3x the token price and still lands near a penny a
question. The daily ceiling is unchanged, so the worst case costs the same — it
just buys fewer answers. Roughly 15 cents for a full draft.

Deploying it:

```bash
cd ff/worker
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY   # interactive; never in the repo
```

The key is a Cloudflare secret. It is not in this repo, not in `wrangler.jsonc`,
and not readable from the deployed page. Watch spend with `npx wrangler tail`, and
change the ceilings at the top of `worker/src/index.js`.
