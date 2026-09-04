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
volume and efficiency instead, and labeled as estimates in the UI. Every kicker
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
Fisher's exact 1-D clustering (dynamic programming), minimizing variance within
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
`test-engine.js` pin the behavior.

## Three panels that were harder to read than the data in them

**Still need** was six bordered chips that all turned amber at once, because at
the start of a draft every slot is empty — a wall of alarm saying nothing except
"you have not drafted yet". Then it was a quiet strip of pips, which was calmer
but still a second list of the same slots, printed below the first one: to read
it you had to hold the roster in your head. It is not a section at all now. Each
roster row carries its own count in the left column — `RB 2/2`, `WR 1/2` — read
off the actual lineup assignment so the flex is right, teal when the position is
filled and amber only when you are genuinely running out of picks for it.

**The target cards** spent most of their height on a sentence that read
"+108 over replacement (RB31)" — once per card, the same shape of number three
times, in prose, where it is hardest to compare. The three numbers that actually
decide between the cards are a row now, aligned across all three so the eye can
run down a column: what he adds to the lineup you can field, whether he will
still be there next time you choose, and how many of his tier are left. The
sentence keeps only the thing a number cannot say.

**Every roster** listed each position's players on one wrapping line separated by
middots, which broke names across columns and never answered the question you
open that panel to ask. It is the lineup now — one slot per row with a fixed
label column, empty starting slots shown as empty, bench underneath — so a team
with no quarterback and no tight end reads as exactly that at a glance.

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
- **WAIT?** — survival odds read as a decision, and *which* decision depends on
  whose pick it is. On the clock: `wait` / `risky` / `NOW` — above 70% he lasts to
  your following pick so spend this one elsewhere, under 35% it is now or never.
  While you are waiting you cannot take anybody now, so `NOW` answers a question
  nobody asked; the column reads `there` / `maybe` / `gone` instead, which is the
  only thing that is live. The header names the pick it measures to, and that
  pick moves when you come on the clock — it used to stay pinned to the current
  one, quietly labeling players you could see on the board as `risky`.
- **VALUE** — `fell 1.2` / `fair` / `reach 1.4`, his ADP against the pick on the
  clock in *rounds*. "fell" is the free money.

The numeric originals (`VOR`, `SURV`, `Δ`, `ADP`) are all still on the menu for
anyone who prefers them, alongside `VS STD` — what your scoring does to him
versus plain PPR, which is the arbitrage the whole tool exists for.

## Naming the team that took him

"Someone else took him" put a player in the nethers: off the board, credited to
whichever team the snake said was on the clock, and if that guess was wrong
there was no way to say so. Which team holds a player is not trivia \u2014 it is how
you read what the room still needs \u2014 and it is the one thing a user can always
look up on their league's own draft board.

So every row names the team. On an available player, **who?** beside the fast
"gone" button opens a picker of the twelve teams and credits the one you name.
On a player already recorded, **move** re-credits him \u2014 the repair for a
catch-up run that guessed wrong, or a mis-click three rounds ago. The picker
marks the team currently on the clock as the safe bet, and says plainly that
changing the credit does not move the pick, only who is charged with it.

The one place it is not offered is your own clock, where "somebody else took
him" cannot happen and offering it would credit your own pick to another team.

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

## Two ways in

The practice run was the best thing in here and the most hidden: a ghost button
labeled *Simulate*, tucked inside a tracker you only ever see **once the draft
is already live** — findable on the one night it is worthless. It is a front
door now, beside the real one. **Start / practice** in the app bar opens a screen
that explains both paths before committing to either:

- **Practice run** — the room drafts itself and stops the moment the pick is
  yours. You choose from the same board with the same suggestions and the same
  clock, then set it running again. Repeat to the end of round fifteen.
- **The real thing** — you record each pick as it happens and the board stays
  honest against it.

The screen carries the loop as four numbered steps, what the modeled room is
actually doing, how much of the board is priced off the user's own real draft
data versus mock ADP, and **the date of the last data pull with its age in
days** — turning amber past a week, because a rehearsal against stale data
rehearses the wrong board. Everything the practice run records is an ordinary
pick: undo works on any one of them, and *Reset draft* clears the lot.

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

This was a ten-row chart of every bye week in the league, nine rows of which were
empty, to answer one question: is any week going to leave you short. That answer
is a sentence, so it is a sentence — one line under the roster naming the week,
how many starters are out and which of them, amber one short of the threshold and
red at it. The week each player is out is already on his own roster row, colored
the same way, so the line and the rows agree.

Only **starters** are counted; bench players on a bye cost nothing. On the board,
the bye cell colors when a pick would create a problem, and the two problems are
distinct:

- **amber (watch)** — another starter at that position is already on that bye.
- **red (clash)** — you would have no like-for-like starter that week, because
  every slot at the position is already idle then.
- **red (overload)** — too many starters idle in one week, whatever they play.
  The threshold is 3 by default and the draft style can move it.

## What a player is worth to *your* roster

Value over replacement asks what a player is worth to an average team. That is
the right question until you own somebody at his position, and the wrong one
immediately afterwards — it keeps comparing him to a stranger rather than to the
man already in your slot.

The board is built on **marginal value over replacement** instead: assign your
optimal starting lineup with the player added, assign it again with a freely
available body at his position added, and take the difference. Against an empty
slot it reproduces classic VOR almost exactly. Against a filled one it collapses
to zero, which is the honest answer — a third tight end in a one-tight-end league
cannot enter your lineup, and neither could the waiver body he is measured
against.

Value over next available is computed the same way, so scarcity at a position you
cannot start is worth nothing. This is what stops the same recommendation coming
back: taking a player at a position now visibly lowers what the next one there is
worth, which the old per-position VONA could not express.

A player who cannot start today is still worth something — he is one injury from
starting, he covers a bye, and the late rounds are where upside is bought — so
the open-market value he carries beyond his value to your lineup is kept at a
fraction, shrinking with each body you already hold at the position. The fraction
is set by how many lineup spots he could ever occupy: three at running back
(two starters plus the flex), one at quarterback, and none worth counting at
kicker or defense, which you stream rather than bench. Before that, a backup
D/ST was priced at eighteen points of value against a startable tight end's
eleven. And a player whose marginal value is zero is no longer described as
adding anything "to your lineup" — that sentence used to sit directly under
"can't crack your starting lineup" on the same card, the board contradicting
itself in two consecutive lines. Value
*below* replacement is kept whole: on a picked-over board it is the only thing
separating the remaining players, and discounting it would rank the tail of the
draft by noise.

`needWeight` now interpolates between the two: 0 is best-player-available and
roster-blind by definition, 1 is fully roster-aware. Need has left the
multiplier entirely, so nothing about roster fit can hide in it.

**What this replaced.** Need used to live in a multiplier over a roster-blind
VOR, and that multiplier had a dead zone. It counted bodies against starting
slots, and the surplus discount only began past `starters + 1` — so in a one-TE
league a second *and* a third tight end both scored at the same flat 0.75, and
drafting the second did not make the third one point cheaper. Once every starting
slot was full, every position collapsed to that same 0.75 and the board reverted
to pure best-available for the entire back half of the draft, precisely where
roster fit is the only thing that matters. Running all twelve draft slots under
four styles, **every single mock draft finished with three tight ends**. It was
the engine's fixed point, not bad luck. It is two now, across all forty-eight,
and the freed pick goes to a third receiver — a position this league starts two
of plus a flex.

The flex accounting had a smaller version of the same bug: `room` granted every
flex-eligible position a flex slot of its own, so running back, receiver and
tight end could each claim the one slot a running back was already sitting in.
`openFlexSlots()` asks the actual assignment instead.

## The modeled room

Both the practice run and the mock drafts need the other eleven teams to draft,
and "take the top of the list" is not what a room does. One model serves both
(`E.roomPick`), and it does three things a list cannot:

**It draws, rather than picks.** Every team draws near a player's draft position
using **that player's own standard deviation** — the same `adp_sd` the survival
column reads. A consensus first-rounder goes within a pick or two of his ADP
every time; a late-round dart lands anywhere across two rounds. Reaches and
slides happen at the rate they actually happen, instead of never.

**It uses the realest number available.** Where the user has pasted their
league's Yahoo draft analysis, the room drafts against **real completed-draft
ADP from the platform this league runs on**, leaned halfway toward where the
market has moved in the last seven days, and weighted by how often the player is
drafted at all — someone taken in 40% of leagues is not reliably taken at his
ADP. Everyone else falls back to mock-draft ADP. The UI says which, and what
percentage of the board is covered, rather than letting the user assume.

**It has rosters.** Opponents obey the same `depthCap` you do, counted against
what each team has actually drafted so far — including the real picks already
recorded, so a mock run mid-draft starts from the league as it stands rather
than an empty one. Nobody takes a third kicker. It also leans half a standard
deviation into a positional run once one starts.

What it still does not model, stated in the UI: nobody in the room is chasing
their own team's players, and no team in it is reading the room the way a human
does.

## Mock drafts

Style names tell you nothing about what they leave you holding. The Style panel
runs the draft out from wherever it currently stands — 25 times, or 50 when
comparing two — against the modeled room above, with your own picks chosen by
the style's composite score. It reports the median starting
lineup, the positional composition, and the most common player in each slot with
how often he filled it. About 80ms for 50 drafts.

Both styles in a comparison get the **identical sequence of opponent picks**,
from a seeded generator reset per style, so a difference between them is the
style rather than the dice.

The mock runs the *same* `composite()` the live board runs, on the same context:
it recomputes `positionalNeed` and passes `myPlayers` after every one of your
picks, so marginal value, the VONA gate and the position caps all apply exactly
as they do on the clock, and it continues from wherever the live draft currently
stands rather than from an empty roster. There is no second, simpler model to
drift out of step with the first. What the mock does *not* do is give the
opponents a brain — they take from the next four by ADP at random, which is the
"where would he realistically land" model and the reason the caveat below is
stated in the UI.

The first version skipped value-over-next-available to save time. That turned out
to be a much worse shortcut than it sounded: with nothing to counterweight raw
VOR, the engine kept taking the position with the fattest number and every style
produced the same running-back-heavy roster. It is computed properly now, and
Hero RB, RB-heavy and Zero RB separate as they should.

The caveat is stated in the UI: a room that drafts to ADP has no runs, no
reaches, and nobody chasing their own team's players.

Running the mock out from an empty roster across all twelve draft slots is also
the cheapest end-to-end check on the scoring there is, and it is what caught the
three-tight-end fixed point described above. `test-engine.js` runs a
fifteen-round draft per style and asserts the roster that comes out is legal and
startable.

## Draft style

**Bias has to keep its sign.** A style's positional weights were applied by
multiplying the composite, which is correct only while the composite is
positive. It is not, for most of the back half of a draft: once your starters are
full, everyone left on the board is below replacement, and multiplying a negative
number by 1.35 makes a pick look *worse*. RB-heavy was pushing late running backs
down and Zero RB was pulling them up — each style doing the opposite of what it
says on the card, in exactly the rounds where a style is supposed to be steering.
The multiplier is applied as a signed shift against the magnitude now
(`raw + (mult - 1) * |raw|`), which is the same arithmetic wherever the old form
was right and correct where it was not. Six assertions in `test-engine.js` pin
the direction, including one that a style's effect on an above-replacement player
is unchanged to the penny.

## What your style did to this pick

A weight is invisible. You pick Zero RB, the board rearranges, and nothing tells
you whether the player now at the top is there because he is good or because you
told the engine to dislike running backs. So the board is scored a second time
under Balanced whenever a style is active, and every pick carries the receipt:

```
WHAT ZERO RB DID TO THIS PICK
Score under Balanced      -13
Score under Zero RB       -10   +3
Board rank                #10 -> #6  ·  up 4 places
  ^ RB weighted x1.15 all draft
  ^ ceiling weighted x1.25 (his grade 80)
```

The bullets are the knobs of your chosen style that actually bit on *this*
player, with the direction each one pushed — not the whole knob list, which the
style diff already shows. A player no knob touches says so, because "your style
moved him four places without weighting anything about him" is itself worth
knowing: it means the style moved everyone *around* him.

The recommendation cards carry the one-line version (`ZERO RB +3 · #10→#6`), and
the same figures go into the Claude brief, so the on-deck note can tell you when
a pick is only on top because of the style — or when the style is steering you
wrong here.

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
2026 writing and is labeled RB-heavy for that reason.

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

## Research flags, in the reader's language

The annotation layer's tags are the vocabulary the sources use, and one of them
was industry jargon nobody outside the industry has heard: **flag plant** is what
an analyst calls staking their name on a player, and on a draft board under a
two-minute clock it means nothing at all. The badge now reads **CONVICTION**, and
every tag carries a sentence saying what it is claiming — `FLAG_PLANT` reads "a
high-conviction call, analysts staking their name on him going well past where
the market has him"; `RISER`/`FALLER` read RISING and SLIDING. The data keys are
untouched, so `tagPenalty` in a draft style and the bake script are unaffected,
and search matches either the badge or the underlying key.

The same sentence goes to Claude alongside the tag, so the brief explains the
flag rather than repeating the jargon back. The label map lives in `engine.js`
(`E.TAG_LABEL`) rather than the app, because the engine's own reason strings
render tag names too — two copies would eventually disagree, and did.

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
`/f1/<league>/draftanalysis` and parses it (`assets/draftanalysis.js`). **The page
is visible to every league member, not just the commissioner.** It shows thirty
at a time, so the instructions point at the position chips — six pastes covers
the top thirty at each position, which reaches more of the board than paging the
combined list. `?pos=RB` and friends jump straight there for QB/RB/WR/TE;
`?pos=DEF` and `?pos=K` come back empty and need the chip clicked, and those two
row shapes are unverified. It is stored per-league in localStorage rather than baked, because it is
that user's own view of the market and goes stale the moment they stop pasting.

Two columns come out of it: **REAL** (where the room actually took him) and
**7DAY** (which way he has moved this week, ↑ earlier / ↓ later). Both go to
Claude as well.

Stated in the UI, because it matters: Yahoo's page says *"ADP based on standard
scoring settings"*, so these are not this league's PPR numbers. They are for
market behavior and movement, not ranking — the board keeps using its own
scoring for that.

## The audit

`node ff/tools/audit.js` hunts the class of bug the tiering had: numbers that
render without error and are quietly wrong. It checks that no depth-chart slot or
team contradicts the board, that nothing scores non-finite or zero, that
replacement ranks exist within each position, that survival stays in [0,1] at the
extremes, that tiers neither fragment into singletons nor collapse into one
bucket, that the composite is finite for every player, that a full position is
actually blocked, and that the ADP residual is centered. Re-run it after any
change to the bake or the engine.

It found one real bug on its first run — see the ADP residual note below — and
its own first version had a false-positive check that flagged every running back
as mis-joined because the regex stripping receiver side-designators (LWR/RWR)
also ate the R in RB.

## Tests

`node ff/tools/test-engine.js` — 85 assertions. It checks the scoring engine
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
rather than substitute consensus rankings. It is there for judgment on top of
the math, not to re-rank anything.

### The on-deck brief

The feature worth having. When the user's pick is a configurable number of picks
away (default 2), the app fires exactly one request and renders the answer at the
top of the center column — so the call is already on screen when the clock
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
| Per-IP rate limit (90/min) | Catches a loop, not a person |
| Daily ceiling ($50, all callers) | The runaway stop; the board still works |
| 96 KB body cap, last 8 messages only | Nobody can stuff the context window |

**The limits are not a usage policy.** This is a private board shared with a
dozen friends, and a limit a real draft night can reach is a limit that fires on
the one evening the thing has to work. They sit where nobody using the app as
intended will meet them: `max_tokens` defaults to 2000 and caps at 8000, so the
prompt decides how long an answer is rather than the budget; ninety requests a
minute from one address is a loop, not a person. A question costs about a cent
and a whole draft night of briefs for twelve people is well under a dollar, so
the $50 daily stop is fifty times a busy night. If it ever trips, something is
wrong rather than popular.

The ceiling stays, and stays deliberately. The key lives in the Worker, and the
origin allowlist is a browser convention rather than a security boundary —
anything that can make an HTTP request can claim any `Origin` it likes. The
ceiling is the only control that still holds against something that is not a
browser.

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
