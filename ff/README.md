# Draftline — `/ff/`

A fantasy draft assistant that re-scores every projection through the user's actual
league rules and drafts off the result. No build step: the board is static files that
run in the browser, and a small Cloudflare Worker behind them holds accounts, the saved
draft, and the shared Claude key. Nothing about a pick waits on the network.

Lives at `copilotplaybook.com/ff/` (and `lincezone.com/ff/`, same repo root).
Excluded from `robots.txt` and carries `noindex` — it is not part of the
partner-facing site and is not linked from it.

```
ff/
  index.html          landing page + account sign-in
  app.html            draft room
  assets/
    ff.css            dark instrument-panel styles (own system; not DESIGN.md's)
    engine.js         scoring + draft math. Pure functions, no DOM, no network.
    presets.js        scoring rule sets. Scoring is data, not code.
    auth.js           account client: sign in/up against the Worker, hold the session
    sync.js           pulls the account's saved draft in, pushes autosaves back
    parser.js         league-settings paste parser
    app.js            draft room UI
    config.js         deployment config (the Claude proxy URL)
  worker/             Cloudflare Worker: accounts, saved drafts, shared Anthropic key
    src/index.js      routing, the Claude proxy and its limits
    src/accounts.js   signup/login/session/state over KV
  data/
    players.js        267 players: ADP layer + projections + annotations, baked
  tools/
    bake-players.py   rebuilds data/players.js
    test-engine.js    31 assertions against independently-derived numbers
    test-parser.js    112 assertions against a real Yahoo settings page
    test-accounts.sh  26 assertions against a local `wrangler dev`
    fixtures/         verbatim capture of that page
    players.json      the research board (input to the bake)
```

## The landing page

The first version argued one point at length: that boosted D/ST scoring tiers move a
defense 183 points and eight rounds. That is true, it is the sharpest thing the engine
does — and it is a quirk of *one* league. A visitor whose league scores defenses the
normal way reads three paragraphs and a table about a rule they do not have, and never
finds out the app has a draft room, a clock, a modeled field of eleven opponents, a
practice mode, nine strategies or a graded report.

The version after that sold the whole product, but sold it in *prose* — three steps, six
feature cards and a table, which is a lot of reading before you see anything the app
actually does. So the page is now a short pitch and three pictures of the product:

1. **Hero** — one paragraph on what it is, three one-line claims about what makes it
   different, and the sign-in panel beside it.
2. **Three framed shots**, each the app's own markup rendered by the app's own
   stylesheet inside a `.shot` frame, with a caption under it:
   - **Live draft results** — the eight players whose ADP sits nearest pick 38, and the
     chance each is still on the board when you get there. Computed on page load by
     `engine.js` from the baked ADP spread, so it cannot drift from the app. The spread
     runs about 78% down to 25% for players a consensus list prints in a row, which is the
     whole argument for carrying a distribution instead of an average.
   - **The on-deck brief** — a `rec top` card exactly as `renderBrief()` builds one.
     Static, and captioned as an example from a practice draft.
   - **The report card** — the twelve-row grade table and Claude's read of it. Also static
     and captioned as such.
3. **Close** — the call to action and the sources footer.

The three shots are one continuous story on purpose: the survival math argues for
McConkey at 38, the brief takes him, and he turns up as the best pick on the graded
roster. Keep them consistent if you edit any of them.

The **live** shot is the one that has to stay honest. It reads `DRAFTLINE_DATA` and calls
`E.survival()` — the same function the board's survival column uses — so if the ADP data
is rebuilt, the page changes with it and nothing needs re-writing. The two static shots
are labeled *from a practice draft* in the frame chrome and again in the caption, because
they are illustrations rather than live output and the page should not pretend otherwise.

Removed with the rewrite: the numbered three-step strip, the six feature cards, and the
PPR-versus-standard movers table. Their CSS went with them.

**Sign in vs. create is a segmented control, not a corner link.** The old panel put
"Create a profile" as a small text link in the header, which is the one control a
first-time visitor needs and the least visible thing in the box. Both are buttons of
equal weight now, the page opens on whichever is right (create when this device has no
remembered names), and each mode carries a one-line explanation of what it is about to do.

## Design decisions worth knowing

**Accounts are real, and the draft follows them.** This used to be a localStorage
record per browser, which meant a name and password made on a laptop did not exist
on a phone — and signing in from the phone answered "No profile with that name on
this device." That sentence was true and useless. Accounts now live in the Worker's
`USERS` KV namespace; the password is hashed there with PBKDF2-SHA256 at 100k
iterations and a per-account salt, and the browser keeps only a session token.
100k is not a preference — it is the ceiling the Workers runtime enforces, and
`wrangler dev --local` does not enforce it, so a higher number passes every local
test and then throws on the deployed Worker.

There is deliberately no email on file, so there is **no password reset and no
recovery** — the sign-in panel says so before you commit to one.

**Local is still the source of truth while you draft.** `sync.js` does not replace
localStorage, it feeds it. `hydrate()` runs once in `app.html` *before* `app.js` is
loaded and makes localStorage agree with the account; `save()` writes locally first
and then hands the same JSON to a debounced `push()`. So a pick is recorded and the
board re-rendered without waiting on a request, and an unreachable server means the
board opens on whatever this device already had.

Writes carry the revision they were editing. If the server has moved past it, two
devices hold two different drafts and the app says so and offers the choice rather
than picking a winner — the one thing you cannot do at 8pm on draft night is
silently throw away somebody's picks. Failed pushes back off and retry, and also
retry on `online` and when the tab comes back to the foreground, because a
backgrounded tab has its timers throttled to about once a minute.

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

## The quick start

A brand new account used to land on `openSetup()` cold: forty scoring fields, no
statement of what to do first, and no way to tell which of it mattered. Worse, the
default league was the author's own — `kinda_highlanders`, slot 11, Drake Maye kept in
round 5 — so a stranger's first board was scored in somebody else's rules and holding a
player they had never heard of. `defaultLeague()` is neutral now (`ppr_standard`, slot 1,
no keepers), and it is only ever used when there is no saved state at all, so nobody's
existing league moves.

In its place, **Quick start** opens once per account per device and lives permanently at
**More › Quick start guide**. It is a checklist, not a page of instructions: every step is
checked against the state the app is actually in, and says so in its own line.

| # | Step | Done when |
|---|------|-----------|
| 1 | Tell it about your league | `league.configured`, set by **Save league** |
| 2 | Decide how much you'll track | same trip — the mode has a default, so what this asks is whether you have seen the choice |
| 3 | Name the other teams | half the other slots carry a name |
| 4 | Add the keepers | at least one keeper recorded |
| 5 | Add real draft data from your platform | `yahooAdp()` is non-empty |
| 6 | Rehearse the whole thing | `S.simulated` — a run that is under way but has not simulated yet says so separately |

Two things make it worth the space. **Each step says what skipping it costs**, in its own
sentence, because skipping is a real choice — the board is fully usable with none of it
done, and a guide that only nags is a guide people close. And **each step's button opens
the exact panel it is about**: `openSetup(section)` takes a `<details>` selector, opens it
and scrolls it into view, so "Name the teams" lands on the team-name grid rather than at
the top of the scoring form.

Under the checklist, two things that are explanation rather than a task: what the three
Claude features do during a draft (with a live status line saying whether the automatic
brief is on and how far ahead it fires), and what the report gives you at the end. Then
one warning panel that states the whole bypass in four lines — you can skip all of it,
here is exactly what you lose.

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
work from once the draft is running. It has four bands, top to bottom, and it is
built so that the four questions you have on every single pick are answered in
that order without scrolling:

1. **Head — where you are.** Your own state in a phrase you can read across a
   room ("You're on the clock", "You're up next", "You're up in 4 picks"), then
   the round, the pick out of the whole draft, and your next two picks. A
   hairline bar shows how far through the draft the room actually is.
2. **Do — the one next action.** Exactly one instruction, in a sentence, with at
   most one button: catch up when the board has fallen behind Yahoo, Simulate in
   a practice run, "take it off the board" on your own turn, and otherwise which
   team pick N belongs to and how to record it. The branches are exclusive, so
   there is never a second thing competing to be the next move.
3. **Order — the picks either side of now.** Three picks ahead, the pick on the
   clock, four behind, in one descending column. Reading down it is going back in
   time. Your own upcoming picks are called out, keepers are labeled, and every
   recorded pick shows the position and the player. "Am I still in step with the
   room" is a glance rather than a comparison.
4. **Keep — the step-away band.** One line saying how long since a pick landed on
   this board, and behind it the way back when the answer is "a while ago". See
   *Stepping away* below.

There is no search box in the tracker. **A pick is recorded on the player list**
— double-click a row on a desktop, tap it twice on a tablet — which is where the
names already are, alongside the ADP, the tier and the survival number. The pick
is credited to whoever is on the clock, and **who?** on the row credits a
different team in the same action.

### A pick you did not see

**Pick went to…** opens the team grid. Choosing a team logs that pick against
them with no player name: the slot is spent, the count moves on, and the player
himself stays on the board.

This replaced a button called **Missed the name**, which was two steps pretending
to be one. It logged the pick against whoever the snake said was on the clock —
a guess exactly when you are not watching closely — and if you then found the
player and assigned him, that recorded a *second* pick. One real selection ate
two slots, and the draft log stopped matching the draft. Everything downstream of
that log is wrong when it happens: survival, VONA, every suggestion.

So the team is chosen rather than assumed, and the other half is closed too: the
**who?** popover on any undrafted player lists the picks that are on the board
with no name, under *"or fill in a pick you missed"*. Choosing one puts his name
on that pick in place. The team that was credited is untouched — this corrects
the name, not the owner — and no extra pick is spent.

Stop and Start over are folded behind the **⋯**, so a thumb cannot find Start
over while reaching for something else.

### There is no pick clock

There used to be a countdown here, and a Pause for it, and a per-league clock
length in settings. It counted down from the last pick *recorded on this board*,
which meant it was never Yahoo's timer and could not have been: nobody takes their
full two minutes, and the next team is on the clock the instant the last one picks.
It was precision the board did not have, dressed up as a number.

What survives it is the timestamp underneath — when a pick last landed here —
which answers the question that is actually worth asking on draft night.

## The league, not just your team

Team names are edited **in the Rosters view** — click any card's title and type;
it saves as you go. (They are also in League setup, under "Who else is in the
league", but the roster cards are where people look for them.) They replace
"team 7" everywhere — the live draft box,
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

## Stepping away, and getting back

Every number the board produces — survival, VONA, the on-deck brief — is computed
against whichever pick the app thinks the draft is on. Miss a few opponent picks
and all of them are wrong, confidently and without a word. That is the same failure
shape as any silent data bug, and it is the most likely thing to go wrong during a
live draft.

The failure is not mistyping a pick. It is getting up for five minutes.

The fix is not a prompt for every pick either; between picks 38 and 62 there are
twenty-three of those. Nor is it what used to be here — a pick number you re-typed
every round so the strip could turn red when the two disagreed. That only ever
worked if it was fed, and feeding it is exactly the chore a person sitting in a
live draft will not do. Instead:

- **The step-away band**, at the bottom of the live draft box, says how long it has
  been since a pick landed on this board. Past eight minutes of silence it turns
  amber — *"Nothing recorded for 14 min — stepped away?"* — and opens itself. It is
  a question, not an alarm; being away from the screen is a normal thing to have
  done.
- **One number gets you back.** Read the pick Yahoo is on, type it in, and the band
  answers immediately: *"6 picks to record."* Press **Catch up 6**.
- **The catch-up sheet** is one row per missed slot, in order, each addressed to
  the team whose slot it was, each with a one-click ADP guess. The names are a
  guess and the UI says so — what matters is that those players are off the board,
  and roughly the right players being gone beats the right players still sitting
  there.
- A row you leave blank, or fill with a name already drafted, records as an
  **unknown pick**. The slot is consumed and the player stays available. Refusing
  to record it would leave the app permanently behind, which is the failure this
  exists to prevent.
- Typing a number *lower* than the board's own count means something is recorded
  here that has not happened. The band says so and points at **Undo** in the app
  bar rather than growing a second button for it.

## The draft plan

Pressing **Start draft** opens it once, and **More › Draft plan** reopens it any
time. It is what this draft probably looks like from your seat, before the first
pick — forty full drafts simulated by `runMock()` against your style's knobs,
your scoring, your roster shape, your keepers and your real Yahoo ADP where you
have pasted it. The room drafts the way the market drafts; you draft the way your
style says.

**Why this plan looks like this** comes first, because a manager who knows he is
taking a defense in round 7 and does not know *why* will talk himself out of it
at 19:40 with eleven people waiting. Four derived blocks:

- **What your scoring does**, from the impact analysis. In a league with boosted
  D/ST points-allowed tiers this reads: *"DEF gains ground in your league. From
  the best DEF down to the last one you can start is 61 points here against 37
  on the baseline — 63% more positional edge. Expect the board to take DEFs
  earlier than ADP does. The best DEF is the #22 player on this board, against
  #40 on the baseline."* That sentence explains most of what the table below
  does, and it was previously buried underneath it.
- **What your seat does.** The snake is arithmetic, not a preference, and it
  decides more about a draft's shape than most managers realize. Slot 11 of 12
  reads: *"Your picks arrive in pairs 3 apart, then a gap of 21. You are choosing
  two players at a time, so pair them by position rather than taking the same one
  twice."* A middle slot is told it has no turn to plan around, rather than being
  told it does.
- **What your style does**, read off the knobs actually in force rather than the
  style's blurb — so a style you have edited describes what it now is. Zero RB
  reports "RB down 55% for the first 5 rounds, WR up 30%…"; Balanced says it has
  no thumb on the scale and that this is the thing to change if the plan is not
  the draft you want.
- **Floors you set.** Two rounds in every draft are decided by a setting rather
  than by the board. The block says so plainly: if the plan takes a defense the
  moment the floor lifts, that is your scoring saying the position is worth more
  than what is left around it — not the board's opinion.

**Round by round** is the body of it: every one of your picks, the position it
most often turns into, and the two or three names most often there. A pick where
the simulation genuinely splits says so — "TE 63% or RB 38%" — and a kept round
is marked kept rather than predicted.

Under each pick is **the engine's own account of it** — `composite()` already
writes the sentence explaining itself, so the plan keeps it instead of guessing
at a reason afterwards. Pick 83 reads *"fills an empty DEF slot · +61 to your
lineup over a free DEF (DEF12)"*. Rounds where nothing can crack the starting
lineup say exactly that, which is the honest answer to "what am I doing in round
10". A reason is only shown when at least half the simulations gave it, and pick
numbers are stripped before counting or no two would ever match.

**When each starting slot gets filled** is the same data as a row of chips: the
round your first back, receiver, tight end, quarterback, defense and kicker
arrive. A position you already hold reads "you have one" rather than naming a
round — the first version of this told a manager holding a kept quarterback that
his first QB was in round 11, which was the second.

**What that means for you** is at most five sentences, and only the ones the
numbers support: the shape the plan comes out in, the two or three picks the
simulation is genuinely confident about, and — the note a panel like this usually
leaves out — where it stops being confident. When no single name holds even a
fifth of the drafts from some round on, it says so and hands you back to the live
suggestions. Then one or two headlines from the scoring impact analysis, which is
the only part of the panel about the league rather than about the draft.

**The honesty rule.** Every name carries the share of drafts it actually appeared
in. "Chase Brown, 31%" is a true sentence; "you will get Chase Brown in round 3"
is not, and it is the sentence a panel like this wants to write. The seed is
fixed, so opening it twice does not quietly show you two different drafts.

It is deliberately a local simulation rather than a Claude call — this is the
screen somebody opens at 18:55 on hotel wifi, and a plan that needs a network is
not a plan. Forty drafts is about half a second of blocked main thread, so the
modal paints its spinner first.

## The player card

Hovering a row at a desk, or the first tap on a tablet, opens a compact card
anchored to that row. It carries what makes the player stand out, not every
number the engine touched:

- **Three tiles** — his points in your scoring, what he adds to the best starting
  lineup you can actually field, and the odds he survives to your next pick.
  Three, because three is what decides between two players.
- **The market line** — mock ADP, real completed-draft Yahoo ADP where you have
  pasted it, and this week's seven-day move. Then whether that makes him a
  bargain or a reach *at the pick on the clock*.
- **Standout lines**, at most four, ordered so that things which change whether
  you take him at all come before things that change how you feel about it: an
  injury outranks a market move, running out of a tier outranks a depth chart.
  Every line is present only because it had something to say — a card that
  prints eight labels and six em-dashes is worse than one that prints two facts.
  The hand-written research note lands here, in full, and the card scrolls rather
  than truncating it.
- **The same actions the row carries**, and one **Full breakdown** button.

A drafted player's card says who has him and stops there — survival and the
composite are computed for players still on the board, and rendering `NaN%` into
a card is worse than having no card.

### Why the breakdown moved

The full scoring teardown used to live in the middle column, and it rendered
whether or not anyone asked: `renderRecs` ended by selecting the top
recommendation and calling `renderDetail` on it, so two tables of composite
arithmetic sat permanently under the suggestion cards. On touch that card also
carried `order: -1`, which put it *above* the live draft box — so on draft day,
tapping any player to look at him pushed the box, the brief and the
recommendations off the screen. Tapping a player to read about him cost you the
panel you draft from.

It is a modal now, opened deliberately by **Full breakdown** or by **Why?** on a
recommendation, and it cannot displace anything. The middle column is the draft
column again: the live box, Claude's brief, the three suggestions.

## The board keeps drafted players

Picked players stay in the list, struck through and dimmed, in their original
ranked position, with who took them and at which pick. The gaps in the ranking
are themselves the information — a run is visible as a cluster of strikethroughs
near the top of a position. Toggle with the `drafted` pill; the choice persists.

## The two bands at the top

Three of them used to repeat each other and the tracker. The app bar carried pick,
round, who was on the clock, your next pick and a countdown; the status strip
repeated the picks-until-you're-up, four clauses of roster need and the countdown
again; and a ticker repeated round, on the clock, on deck, your pick and the recent
picks — every one of which the live draft box already showed in the middle column
with more room. On an iPad the strip crowded into a ribbon nobody could read.

Now:

- **App bar** — identity and actions only. Undo, Rosters, Ask Claude, and one
  More menu holding report, style, columns, league setup, save/load and sign out,
  so the bar cannot overflow on a tablet.
- **Roster-gap strip** — one idea, and one the box does not carry: the holes in
  your starting lineup, as chips, capped at four with a count for the rest, and
  how many picks are left to fill them. No state phrase, no round, no pick number,
  no clock. It wraps rather than scrolling, because a status bar that hides half
  of itself off the right edge is worse than a taller one.
- **Ticker** — deleted. (It had already stopped rendering: there was no `#ticker`
  element and nothing called `renderTicker()`.)
- **Live draft box** — everything else.

## Resizable columns

At the 1040px-and-up, three-column layout, the hairline between board/rec and
between rec/roster is also a drag handle (`.colgrip` in `assets/ff.css`, wired
in `assets/app.js`). A saved width is stored as a share, not a pixel count —
`minmax(floor, Nfr)`, same shape the built-in default already uses — so it still
makes sense after the window resizes or on a different monitor, and it is
written as a small stylesheet scoped to `@media (min-width:1040px)` rather than
as inline style, so it can never fight the narrower breakpoints below. Double-
click a handle to put both back to their built-in widths.

## iPad

Landscape (1194) keeps all three columns. Portrait (834) drops to board plus
recommendation with the roster full-width underneath, rather than collapsing to
one column and burying the recommendation under 200 player rows. Under
`hover: none` the row actions stop hiding behind a hover that never arrives and
take a real column, rows grow to a 54px tap target, and every input is 16px so
iOS does not zoom the layout on focus. The app bar scrolls inside itself and the
roster-gap strip wraps — nothing makes the page itself scroll sideways.

## Cache busting

GitHub Pages serves everything with `max-age=600`, HTML included, so a push takes
up to ten minutes to reach a browser that already has the page. Two mechanisms,
because the obvious one is not enough:

1. Every `<script>` and `<link>` carries a `?v=` stamp. **Bump it on every asset
   change** — find-and-replace the value across `index.html` and `app.html`.
2. That alone does not work, and the reason is worth internalizing: the stamps
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

## What the market is allowed to say about a grade

Every player carries a `ceiling` and a `risk`. 74 of the 267 get theirs from the
hand-written research layer; the other 193 are modeled here. Two market signals
adjust both, and they are different in kind, which is why they are not summed
into one number.

**`adpResid` is disagreement.** Sleeper's price for a player against what a
player at this board's price normally costs there. Negative is Sleeper reaching
earlier — one room is higher on him than the other. Disagreement in *either*
direction is uncertainty, so it raises risk by its magnitude while only its
direction moves the ceiling.

**`ytrend` is movement.** Picks earlier or later in real Yahoo drafts over the
last seven days, on the platform this league actually runs on. That is not
disagreement, it is news arriving — a starter named, a competitor hurt, a camp
report — and it reaches draft rooms well before it reaches a season projection.
So it is directional on both terms: a player the market is moving toward gets a
higher ceiling and a slightly lower risk. The ceiling moves more than the risk,
because movement is better evidence about upside than about floor.

### Two wires that were missing

`modelGrades()` used to open with `if (researched) return`, so **the 84 annotated
players — the ones a manager actually agonizes over in rounds 3 through 10 — were
the only players on the board no market signal could ever reach.** A hand grade
written before camp cannot know the market has moved forty picks on somebody
since; refusing to look is not respect for the research, it is a stale number
defended. Research is the base now and the market updates it at **half** the
weight it carries on a modeled player. On the shipped board that moves 59 of the
74, almost all by a point or two — Sam LaPorta, whose residual is −59.9, moves
the most at +4.

`ytrend` reached the opponent room model and the TREND column and **nothing
else** — it never moved a player's own grade. Worse, it was attached to the board
a dozen lines *below* the `composite()` call that priced him, in the same loop,
so even the wire that looked connected could not have fired. It is attached
before scoring now, at both the live board and the mock.

Grades are stored as `ceilingBase` / `riskBase` and recomputed from the base
every time, so `applyMarketSignals()` is idempotent and can re-run whenever
fresher draft data is pasted without compounding on its own output.

### It is silent when it has nothing to say

`ytrend` is null until the Yahoo draftanalysis page is pasted, and the baked
board carries none. On a board with no telemetry this term does nothing at all —
it does not invent a trend from the static ADP that is already priced through
survival and VONA. `test-engine.js` pins that as its own assertion.

**Not done yet:** VONA is still computed as the expected best available *at a
position*, so a specific falling player is averaged into his position's
expectation rather than priced as himself. That is the remaining half of "take
the steal at another position", and it needs a seeded-draft harness to tune
safely rather than by eye.

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

## What your scoring does to the draft

League setup → **What your scoring does to the draft**, and it opens itself the
moment a settings paste is applied, because that is the moment the question is
live.

Consensus ADP is drafted under full PPR with standard everything else. Your
league is not that, and the board already knows it — the `VS STD` column has
always shown, player by player, what your rules are worth to him. What it never
did was answer the question a player actually has, which is not "what is Ja'Marr
Chase worth here" but **"so what changes about how I draft?"**

This panel answers it by measurement rather than by assertion. It does not know
anything about PPR or six-point passing touchdowns. It builds the board twice —
once under your rules, once under the baseline — and reports what moved.

### Three comparisons, kept apart

Conflating them produces nonsense in exactly the leagues that most need the
answer: a 14-team superflex league would otherwise have its superflex slot
reported as a scoring effect.

| | what varies | what is held |
|---|---|---|
| **scoring** | your scoring vs the baseline's | your roster and team count |
| **shape** | your lineup vs a plain 12-team one | your scoring |
| **knobs** | one rule reverted to the baseline | every other rule at your values |

The knob pass is the one worth understanding. Each differing rule is reverted on
its own, the board rebuilt, and the disturbance measured — so a rule is credited
with what it *did*, not with how large its number looks. In `kinda_highlanders`
that ranking puts the boosted points-allowed tiers at the top and the 40-yard
bonuses near the bottom, which is the opposite of how they read on the settings
page.

### Ground, not points

The first version of this compared each position's edge against its own baseline
edge. In a no-PPR league it told the reader to take running backs later,
receivers later *and* tight ends later. Every one of those was true in absolute
points — stripping receptions out shrinks every position's edge — and the advice
was useless, because a draft is nothing but positions in an order and you cannot
take all of them later.

So the **Ground** column divides out what your scoring does to every position at
once, by measuring each position's edge ratio against the median ratio across
positions. What is left is the reordering. The same numbers now say receivers and
tight ends come down the board and quarterbacks come up, which is both the
correct read and one somebody can act on.

**Edge** itself is the drop from the best player at a position to the last one
you can start — not projected points. A position's projected total says nothing
on its own: quarterbacks outscore everyone every year and go in the eighth round
anyway.

Deliberately *not* in that table: where the **last** starter at a position sits
in the board order. It looks like the natural companion to **Best** and it is
worthless, because VOR is zero at replacement level by construction — every
position's last starter lands in the same handful of slots no matter what the
scoring says. It moved by one place across every league tried, which is a metric
reporting on its own definition rather than on the league.

### It is allowed to say there is nothing here

A league scored like the baseline is told exactly that, and gets one sentence
instead of a report. A tool that always finds an edge is not measuring anything,
and `test-impact.js` pins that case first.

### The superflex slot, which it used to admit it could not price

`replacementRanks()` shared out the `FLEX` slot and ignored `SUPERFLEX`
entirely, so a superflex league's quarterback replacement level came out
identical to a one-quarterback league's — reachable by anyone, since `parser.js`
maps Yahoo's `Q/W/R/T` to `SUPERFLEX`. The panel used to say so out loud and tell
the reader to treat every QB figure as a floor.

It is priced now. `SUPERFLEX_SPLIT` shares the slot out the way `FLEX_SPLIT`
shares the flex, at **QB 0.941** and the rest by `FLEX_SPLIT`, and the number is
measured rather than chosen: fill every base slot on this board and a round of
flexes, and the worst quarterback still in the pool beats the twelfth flex-type
body left over by 3.3 points a week in full PPR and 6.4 in non-PPR. No scoring
here makes the slot anything but a quarterback. What is left over is supply, not
preference — twenty-four slots want a quarterback every week and the board
carries about twenty-seven who project a real season, so byes are not always
coverable. One bye in seventeen is a conservative ceiling on how often the slot
is not a quarterback, and erring that way underprices quarterbacks slightly
rather than overpricing them.

The panel reports the result through the same per-team lineup sentence every
other roster difference goes through — a 14-team superflex league is told it
starts *QB 1.9 a team against 1.0* — with no special case and no apology.

**Still not priced:** `assignRoster()` and everything built on it —
`positionalNeed()`, the lineup panel, `depthCap()` — know about `FLEX` and not
about `SUPERFLEX`, so the slot moves replacement level and VOR but does not yet
appear as a slot your second quarterback can be placed in.

### Cost

Six boards, plus one per differing rule — about 40 in a heavily customized
league, and roughly a second in a browser. The panel is closed until asked for,
and its report is cached against a signature of the rules it was built from, so
it is paid for once and only by the people who open it.

It reads the scoring form as it currently stands, **saved or not**: it sits in
the same modal as those inputs, and somebody who has just typed a number into one
expects the analysis to be about the number they can see.

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

`node ff/tools/test-impact.js` — 101 assertions against `assets/impact.js`.
Weighted toward the *claims* rather than the plumbing, because this is the one
file that produces prose and prose is believed: a wrong number in a column gets
squinted at, while a wrong sentence saying "take quarterbacks earlier than ADP"
gets acted on in the third round and cannot be taken back. It pins that a league
scored like the baseline is told there is nothing there; that a no-PPR league is
told receivers come down rather than that everything does; that reverting a
D/ST rule changes no offensive player's score; and that the superflex caveat is
present exactly while the engine still cannot price the slot.

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

### Accounts on the same Worker

`src/accounts.js` serves everything under `/api/`; the Claude proxy keeps the bare
root, so a browser still running an older build of the page is unaffected. It needs
the `USERS` KV namespace already bound in `wrangler.jsonc` — a namespace separate
from `LIMITS` on purpose, because clearing rate-limit counters is a reasonable thing
to do and must not be able to take the accounts with it.

Adding an origin to `ALLOWED_ORIGINS` is what lets a new domain sign in at all.

### Signup is invite-only

Creating an account takes a one-use code. The board spends a shared Anthropic key
on every brief, so an account anyone can make is a bill anyone can run up; a code
issued out of band is the smallest thing that closes that, and it does not need an
email, a payment or anything else the app would then have to hold.

A code is eight characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ` — no `0`, `1`,
`I`, `L`, `O` or `U`, because these are read off one phone screen and typed into
another. It is displayed as `K7M2-PQ4X`; the hyphen is cosmetic, and the field on
the signup form puts it back as you type. Codes live in `USERS` under `ic:`,
alongside the accounts rather than the disposable counters.

Mint them through the admin route, which is gated on the `ADMIN_TOKEN` secret
rather than on a session — there is no notion of an admin account. A missing or
wrong token gets the same 404 an unknown route does, because a 401 would confirm
there is something here worth finding a token for:

The token is read by the same `bearer()` parser the session tokens use, so it has
to be letters, digits, `_` or `-` — a token with a `+` or `=` in it is rejected
before it is ever compared, and looks from the outside exactly like a wrong one.
Random hex is the safe shape:

```powershell
npx wrangler secret put ADMIN_TOKEN     # once, from ff/worker
$h = @{ Authorization = "Bearer $env:DRAFTLINE_ADMIN_TOKEN"; "content-type" = "application/json" }
Invoke-RestMethod -Method Post -Uri "https://draftline-api.ken-lince.workers.dev/api/admin/codes" -Headers $h -Body '{"count":5,"note":"league text thread"}'
```

`GET` the same route to see every code with the account that spent it. Codes are
never deleted on use — a spent one records who used it and when, and an expired one
that still exists tells you what happened where a vanished one looks exactly like a
code that was never issued.

Two things that look like oversights and are not. Signup marks the code spent
*before* it writes the account: KV has no compare-and-swap, so the window in which
two requests both see one unused code cannot be closed, only narrowed to the width
of a single put. And the per-address limit on wrong codes is allowed to *refuse*,
unlike the sign-in limit keyed on an account name — a bucket keyed on the address
cannot be aimed at a chosen victim, and there is no innocent way to get a code
wrong ten times running.

`ff/tools/invite-and-payment-spec.md` has the rest of the reasoning, plus the
unbuilt second half: taking $9.99 through PayPal and Venmo to mint a code
automatically.

To exercise it end to end against a local Worker. The suite mints its own codes, so
it needs the admin secret — put `ADMIN_TOKEN = "local-dev-admin-token"` in
`ff/worker/.dev.vars` (gitignored) for a local run, or export
`DRAFTLINE_ADMIN_TOKEN` to match the deployed secret:

```bash
cd ff/worker && npx wrangler dev --port 8787 --local
bash ../tools/test-accounts.sh
```
