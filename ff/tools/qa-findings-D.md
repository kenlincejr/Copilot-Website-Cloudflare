# Workstream D — the AI layer (static half)

Static audit only. **No live Claude API call was made at any point.** The harness
replaces `fetch` with a stub that records the attempt and rejects, so nothing left the
machine. Everything below is derived from reading the code and from replaying the real
prompt builders against real board states in Node.

- Source read: `ff/assets/app.js` (4,366 lines at the time of reading), `ff/worker/src/index.js`,
  `ff/assets/engine.js`, `ff/assets/config.js`, `ff/app.html`.
- Harness: `<scratch>/harness.js` loads `data/players.js`, `presets.js`, `engine.js`,
  `strategies.js`, `parser.js`, `draftanalysis.js` and then `app.js` under a stubbed DOM,
  injecting an export hook immediately before the IIFE's closing `})();`. **The file on
  disk is not modified.** `<scratch>/states.js` drives the board to any pick with the same
  seeded `E.roomPick` machinery `simulateToMyPick()` uses, taking the board's own top
  composite on the user's picks.
- League used throughout: `kinda_highlanders`, 12 teams, slot 11, 15 rounds, Balanced,
  Drake Maye as a round-5 keeper (pick 59).
- Model facts (pricing, adaptive thinking, `output_config.effort`, minimum cacheable
  prefix) were taken from the `claude-api` skill's current tables, not from memory.

Counts: **1 BLOCKER, 3 HIGH, 4 MEDIUM, 6 LOW, 2 STRATEGY.**

---

## D1 — BLOCKER — `playerIn()` binds the Draft button to the wrong player when the answer's first line names two players

**Defect.** `playerIn()` scans the whole board for names contained in the line and keeps the
longest match, so a first line of the form "Take X over Y" binds to whichever of X and Y has
the longer name — not to the one being recommended.

**Reproduction.** `node <scratch>/probe3.js`, board driven to pick 11 (`states.js` seed 20260908).

```
Ja'Marr Chase (WR)             <- two players, take X over Y       | "Take Chase Brown over Ja'Marr Chase"
Ja'Marr Chase (WR)             <- two players, reversed            | "Take Ja'Marr Chase over Chase Brown"
Bhayshul Tuten (RB)            <- substring trap: short surname    | "Take Bucky Irving over Bhayshul Tuten"
```

Both orderings return Ja'Marr Chase. In the first case the advice is Chase Brown and the
button drafts Ja'Marr Chase. `renderBrief()` feeds that player straight into
`briefTakeHtml(pick, myTurn() ? "Draft" : ...)` and the button's `data-btake` is the wrong
name, so a single tap on the clock records the wrong pick. The head rendered above it
(`briefHeadHtml`) also shows the wrong player, his position pill, team, bye and board rank,
so nothing on screen contradicts it.

**Evidence — the code.** `app.js` (`playerIn`, ~4042):

```js
var hit = null;
A.all.forEach(function (p) {
  if (s.indexOf(p.name) >= 0 && (!hit || p.name.length > hit.name.length)) hit = p;
});
return hit;
```

The comment above it explains longest-wins as protection against "a surname sitting inside a
longer name". That hazard does not actually exist in this data — I checked every pair of the
267 board names and **no board name is a substring of another** (`probe3b.js`,
"board-name substring collisions (0)"). So the rule buys nothing and costs this.

**Why the prompt does not save it.** `briefQuestion()` asks for "the player you would take,
and nothing else on that line", which makes this disobedience rather than the normal case.
But the same `playerIn()` also parses the `If gone:` line, which is *specified* as a clause
("name one fallback in a single clause"), and a clause naming a contrast ("If gone: Bucky
Irving over Bhayshul Tuten") misbinds the Fallback button by the same rule. Frequency is a
live-run question (see the live section); correctness is not.

**Proposed fix (not applied).** Prefer the *earliest* match, and only break ties on length —
the recommended player is the subject of the sentence and comes first in every natural
phrasing of "Take X over Y":

```js
function playerIn(line) {
  var s = (line || "").trim();
  if (!s) return null;
  if (A.byName[s]) return A.byName[s];
  var hit = null, hitAt = Infinity;
  A.all.forEach(function (p) {
    var at = s.indexOf(p.name);
    if (at < 0) return;
    // Earliest wins: in "Take X over Y" the recommendation is X. Length only
    // breaks a tie between two names starting at the same offset.
    if (at < hitAt || (at === hitAt && p.name.length > hit.name.length)) { hit = p; hitAt = at; }
  });
  return hit;
}
```

Belt and braces: refuse the bind entirely when two *different* board names appear in the
line and neither contains the other, and render the head as plain text with no Draft button.
Binding to nobody is the documented acceptable outcome; binding to the wrong man is not.

---

## D2 — HIGH — At the user's last pick the prompt states a fabricated 100% survival for every candidate

**Defect.** `A.myAfter` is null at the final pick. `analyze()` then sets `p.survNext = 1` as a
placeholder, and `claudeContext()` prints that placeholder while labelling it with
`(A.myAfter || A.myNext)` — the pick the brief is about. The model is told, in the same
sentence, that a player has a 41% chance of reaching pick 179 and a 100% chance of still
being there at pick 179.

**Reproduction.** `node <scratch>/gen.js` (state 5) and `node <scratch>/probe6.js`.

Waiting at pick 177 for 179:

```
- Tre' Harris (WR LAC, bye 7): ... chance he reaches the pick I am writing about (179) is 41%,
  chance he is still there at my FOLLOWING pick (179) is 100%, composite -90
```

On the clock at pick 179 the first clause disappears and only the false one is left, for
every candidate:

```
=== cur 179 myNext 179 myAfter null ===
- Malik Washington (WR MIA, bye 6): ... chance he is still there at my FOLLOWING pick (179) is 100%, composite -68
- Jalen Nailor (WR LV, bye 13): ... chance he is still there at my FOLLOWING pick (179) is 100%, composite -69
- Jalen McMillan (WR TB, bye 10): ... chance he is still there at my FOLLOWING pick (179) is 100%, composite -69
- Kayshon Boutte (WR HOU, bye 8): ... chance he is still there at my FOLLOWING pick (179) is 100%, composite -73
```

**Evidence — the code.** `analyze()` (~341): `p.survNext = myAfter ? E.survival(p, myAfter) : 1;`
`claudeContext()` (~3854): `", chance he is still there at my FOLLOWING pick (" + (A.myAfter || A.myNext) + ") is " + Math.round(p.survNext * 100) + "%"`.
The `|| A.myNext` and the `: 1` are each defensible on their own; together they print a
sentence that is false.

**Scope.** Reachable at pick 179 (the user's last), and at any pick where `myUpcoming` has
one entry left. It is the last pick of the night, so the cost of a bad answer is small — but
it is a number in the prompt that disagrees with the board, which the brief's own rubric puts
at HIGH.

**Proposed fix (not applied).** Suppress the clause when there is no following pick:

```js
(A.myAfter ? ", chance he is still there at my FOLLOWING pick (" + A.myAfter + ") is " +
             Math.round(p.survNext * 100) + "%" : ", this is my last pick of the draft")
```

---

## D3 — HIGH — In the late rounds the `surv >= 0.25` filter removes the board's own best available players, and the prompt then forbids naming anyone else

**Defect.** While waiting, `claudeContext()` keeps only candidates with `p.surv >= 0.25`, then
tells the model "Name a player from this list and nobody else." `survival()` is an
unconditional normal CDF on ADP — it does not know the player is still on the board — so a
player who has already outlived his ADP by twenty picks scores near zero survival for the
next two. In round 15 that removes almost the whole top of the board.

**Reproduction.** `node <scratch>/probe2.js`.

```
=== cur 177 -> myNext 179 (round 15) ===
pool 30, pass surv>=0.25: 11, fallback fires: false
board's own top 12 by composite (what the cards rank):
   1. Malik Washington       WR  comp   -68  adp  151.1  surv   2%   <-- DROPPED from the brief
   2. Jalen Nailor           WR  comp   -69  adp  157.2  surv   2%   <-- DROPPED from the brief
   3. Jalen McMillan         WR  comp   -69  adp  138.7  surv   0%   <-- DROPPED from the brief
   4. Kayshon Boutte         WR  comp   -73  adp  159.9  surv  12%   <-- DROPPED from the brief
   5. Tre Tucker             WR  comp   -77  adp  130.9  surv   0%   <-- DROPPED from the brief
   6. Ryan Flournoy          WR  comp   -78  adp  166.8  surv  21%   <-- DROPPED from the brief
   7. Jordyn Tyson           WR  comp   -89  adp    158  surv   9%   <-- DROPPED from the brief
   8. Tre' Harris            WR  comp   -90  adp  174.4  surv  41%
   ...
dropped from the top 12: 11
  best DROPPED comp -68 (Malik Washington) vs best LISTED comp -90 (Tre' Harris)
```

Eleven of the board's top twelve are withheld. The best answer the model is permitted to
give is the board's number eight, 22 composite points behind the number one that the
recommendation cards are showing on the same screen. Earlier rounds are milder but real:

```
=== cur 131 -> myNext 131 (round 11) ===   dropped from the top 12: 6
=== cur 155 -> myNext 155 (round 13) ===   dropped from the top 12: 5
```

**Root cause, confirmed.** `engine.js`:

```js
function survival(player, pickNumber) {
  var sd = Math.max(player.adp_sd || 6, 1.5);
  return 1 - normCdf((pickNumber - (player.adp || 200)) / sd);
}
```

Nothing conditions on the current pick. Malik Washington has ADP 151 and is still on the
board at pick 177; the model of him says he has a 2% chance of surviving two more picks.

**I read the comment first.** The block above the filter explains it correctly — handing over
the raw top of the board meant naming players the teams in between were about to take. That
reasoning holds in rounds 1 to 8, where ADP and the live board still agree. It inverts in the
last rounds, where the players still available are by definition the ones ADP got wrong.

**The fallback does not catch it.** `if (live.length < 6) live = pool;` never fired once in a
full 180-pick draft: across 164 waiting states the minimum passing the filter was 11
(`probe1.js`: "minimum passing surv>=0.25: 11 at 159->179", "fallback (live<6) fired: 0
times"). Eleven is above the threshold and catastrophically wrong. Twenty states produced a
list of 11 rather than 12, all of them at `-> 179`.

**Proposed fix (not applied), smallest first.** Condition survival on the pick already
reached, which is the honest statement of the question being asked:

```js
// engine.js
function survival(player, pickNumber, fromPick) {
  var sd = Math.max(player.adp_sd || 6, 1.5);
  var s = 1 - normCdf((pickNumber - (player.adp || 200)) / sd);
  if (!fromPick) return s;
  var s0 = 1 - normCdf((fromPick - (player.adp || 200)) / sd);
  return s0 > 0 ? Math.min(1, s / s0) : 1;   // P(survive to N | survived to fromPick)
}
```

This changes a formula, so per the rules of engagement it stops here for the user to decide.
A prompt-only mitigation that does not touch the engine: raise the fallback threshold from
`< 6` to `< 12`, so the list is topped up from the unfiltered pool whenever the filter cannot
fill it, and mark the topped-up entries as "past his ADP and still here". That keeps the
round 1-8 behavior the comment is defending and fixes rounds 12-15.

---

## D4 — HIGH — A typographic apostrophe or a dropped suffix loses the Draft button on 24 of 267 players

**Defect.** `playerIn()` matches by exact substring against the board's spelling. Two forms
that a language model produces routinely fail: the curly apostrophe U+2019 in place of the
data's straight `'`, and a name with the suffix trimmed.

**Reproduction.** `node <scratch>/probe3b.js`.

```
players with an apostrophe (8): Ja'Marr Chase, De'Von Achane, D'Andre Swift, Ka'imi Fairbairn,
  Wan'Dale Robinson, De'Zhaun Stribling, Tre' Harris, Ja'Kobi Lane

curly-apostrophe form -> playerIn result:
  Ja’Marr Chase            -> NULL
  De’Von Achane            -> NULL
  D’Andre Swift            -> NULL
  ... (all 8 NULL)

players with a suffix (16): James Cook III, Travis Etienne Jr., Harold Fannin Jr., Luther Burden III,
  Kyle Pitts Sr., Brian Thomas Jr., Marvin Harrison Jr., Aaron Jones Sr., Chris Rodriguez Jr.,
  Chris Godwin Jr., Michael Pittman Jr., Deebo Samuel Sr., Tyrone Tracy Jr., Mike Washington Jr.,
  Omar Cooper Jr., Odell Beckham Jr.

suffix stripped -> playerIn result:
  James Cook               -> NULL
  Marvin Harrison          -> NULL
  ... (all 16 NULL)
```

24 of 267 players, 9% of the board. It matters more than 9% suggests: James Cook III,
Marvin Harrison Jr., Brian Thomas Jr., Michael Pittman Jr., Ja'Marr Chase and De'Von Achane
are all top-40 picks, and James Cook III is the board's number one at pick 11 in the real
state 1 payload below.

**Failure mode is safe but expensive on the clock.** `pick` comes back null, so `renderBrief`
falls through to `'<div class="rec-head"><span class="name">' + esc(head) + "</span></div>"`
and `briefTakeHtml(null, ...)` returns "". The user gets the advice with no Draft button, no
Why? button and no board rank, and has to type the name into search under the clock. Not a
wrong pick, so HIGH rather than BLOCKER.

Note the reverse direction already works: the board's "Kenneth Walker" is found from
"Kenneth Walker III" because the data string is a substring of the answer. The failure is
only when the answer is *shorter* or differently punctuated than the data.

**Proposed fix (not applied).** `normName()` already exists in `app.js` (line 49) and does
exactly this normalization — it lowercases, strips diacritics, folds `.` and `'` to spaces,
and drops jr/sr/ii/iii/iv/v. It is used for the Yahoo ADP join and not for this. Match on
normalized forms, falling back to the current exact scan:

```js
function playerIn(line) {
  var s = (line || "").trim();
  if (!s) return null;
  if (A.byName[s]) return A.byName[s];
  var ns = normName(s.replace(/’/g, "'"));
  var hit = null, hitAt = Infinity;
  A.all.forEach(function (p) {
    var at = ns.indexOf(normName(p.name));
    if (at < 0 || !p.name) return;
    if (at < hitAt) { hit = p; hitAt = at; }
  });
  return hit;
}
```

`normName` collapses to space-separated words, so a normalized substring match can straddle a
word boundary; guard with a word-boundary check if that matters. Combining this with D1's
earliest-wins rule fixes both defects in one function.

---

## D5 — MEDIUM — `REPORT_SOLO_SYSTEM` can never run, and "Ask Claude" in board-only mode is a silent no-op

**Defect.** The `#reportAsk` handler returns before it ever reaches the Claude call when the
draft is in solo mode, so the branch that would use `REPORT_SOLO_SYSTEM` is unreachable and
the button does nothing visible except re-render a table that is already on screen.

**Reproduction (code read, `app.js` ~1353-1412).**

```js
$("#reportAsk").addEventListener("click", function () {
  ...
  if (!isLive()) {
    ...
    $("#reportBody").innerHTML = ...              // re-renders the same table
    return rows;                                  // <-- returns here
  }
  var out = $("#reportOut"); ...
  claudeCall(..., isLive() ? REPORT_SYSTEM : REPORT_SOLO_SYSTEM, 4000)
```

Past the early return `isLive()` is necessarily true, so the ternary always picks
`REPORT_SYSTEM`. The same is true of `var table = !isLive() ? "(board-only mode — no opponent
rosters were tracked)" : ...` immediately above it. `REPORT_SOLO_SYSTEM` is a well-written
prompt (three paragraphs, no invented league context, under 220 words) that is dead.

**User-visible consequence.** A user who ran the draft in "Just the board" mode opens the
report, presses the button that says it will have Claude read the draft, and nothing happens —
no spinner, no error, no answer.

**Proposed fix (not applied).** Move the early return out of the ask handler and into
`renderReport()` only (which already has its own copy of the solo table), and let the ask
handler build the solo payload:

```js
$("#reportAsk").addEventListener("click", function () {
  if (!claudeReady()) { closeModal("#reportModal"); $("#btnClaude").click(); return; }
  var rows = isLive() ? gradeDraft() : null;
  var out = $("#reportOut");
  out.classList.remove("hidden"); out.classList.remove("err");
  out.querySelector(".claude-out").innerHTML = '<span class="spinner"></span> reading the draft…';
  $("#reportAsk").disabled = true;
  var table = isLive() ? rows.map(...).join("\n")
                       : "(board-only mode — no opponent rosters were tracked)";
  var myRoster = (isLive() ? allRosters()[S.league.slot] : A.mine).map(...).join("\n");
  claudeCall(..., isLive() ? REPORT_SYSTEM : REPORT_SOLO_SYSTEM, 4000)...
});
```

Alternatively, if solo-mode reports are deliberately out of scope, hide `#reportAsk` when
`!isLive()` and delete `REPORT_SOLO_SYSTEM`. Either is fine; a button that does nothing is not.

---

## D6 — MEDIUM — The report prompt asks the one question its payload cannot answer

**Defect.** `REPORT_SYSTEM` asks for "which rival team is the real threat and why". The payload
contains no rival roster and no rival player name — only a rank, a letter, a points total, a
slots-filled count and a bye note per team. The model can restate the number one row, or it
can invent. That is exactly the pressure that "trust them, do not recompute or re-rank" is
there to resist, applied by the prompt itself.

**Reproduction.** `node <scratch>/probe6.js`, section "report payload: rival information
available" — this is the complete rival content of the message, verbatim:

```
  1. your team — grade A+, 1818 projected starter points, 7 of 9 slots filled
  2. team 9 — grade A, 1681 projected starter points, 7 of 9 slots filled
  3. team 1 — grade A-, 1636 projected starter points, 7 of 9 slots filled
  ...
  (no rival roster, no rival player names, are included anywhere in the payload)
```

`gradeDraft()` already computes `r.best` (each team's highest-scoring player) and
`renderReport()` puts it in the on-screen table, but the string built for the prompt at
`app.js:1393` drops it. Only `myRoster` is listed by name.

**Judgment on "trust the grades, do not re-rank".** For three of the four paragraphs the
instruction is likely to hold, because the grades are handed over as fact and the model has
nothing to re-rank with — there is no per-player data on rivals to build a rival ranking
from. The instruction is doing very little work; the payload is doing it. The threat
paragraph is the exception and is the one place fabrication has room. It is worth noting that
the phrasing "do not recompute or re-rank" also discourages the model from saying the useful
thing — "your A+ is 29 points clear of an A, which is noise" — so the instruction is slightly
mis-aimed: what you want forbidden is *substituting consensus rankings*, not *reading the
margins in the table you were given*.

**Proposed fix (not applied).** Either give the model the data the question needs, or stop
asking it. Cheapest is to add each rival's best pick and positional shape, which `gradeDraft`
already has:

```js
return "  " + r.rank + ". " + r.name + " — grade " + r.grade + ", " +
  Math.round(r.pts) + " projected starter points, " + r.starters + " of " +
  (r.starters + r.empty) + " slots filled" +
  (r.best ? ", best pick " + r.best.name + " (" + r.best.pos + ", " + Math.round(r.best.pts) + ")" : "") +
  (r.worstBye && r.worstBye.n >= 3 ? ", " + r.worstBye.n + " starters on the week " + r.worstBye.week + " bye" : "");
```

and tighten the system line to "Trust the grades and points as given; do not substitute
consensus rankings. Reading the margins between them is welcome."

---

## D7 — MEDIUM — A Worker error page surfaces a JSON parser message to the user

**Defect.** `claudeOnce()` calls `r.json()` on every response without checking the content
type. A Cloudflare 5xx or a Worker exception returns an HTML error page, `r.json()` rejects
with a parser error, and that message is what the AI panel shows.

**Reproduction (code read, `app.js` ~3976-3998, plus the shape of the Worker's failure
modes).**

```js
return fetch(url, {...})
  .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
```

The `.json()` rejection is not an `AbortError`, so the catch rethrows it unchanged;
`renderBrief` stores `"!" + err.message` and renders:

```
Claude is unavailable: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
The board below is unaffected.
```

The panel does degrade to one line and the board is untouched, so the workstream-D promise in
item 7 holds — but the one line is a parser message. Worker-down is the single most likely AI
failure on draft night and it is the one that reads worst.

**Not reproduced end to end.** I did not stand up a failing Worker (that would mean network
calls against the deployment). This is a code-read finding: the branch is unambiguous but the
exact string a Cloudflare 502 produces is inferred, not observed.

**Proposed fix (not applied).**

```js
.then(function (r) {
  return r.text().then(function (t) {
    var j; try { j = JSON.parse(t); }
    catch (e) { j = { error: { message: r.status
      ? "The Claude proxy answered with an error (HTTP " + r.status + ")."
      : "The Claude proxy is not reachable." } }; }
    return { ok: r.ok, j: j };
  });
})
```

---

## D8 — MEDIUM — `resetDraft()` clears `briefCache` but not `briefTries`, so a new draft can start with its re-asks already spent

**Defect.** The two maps that govern the stale-brief loop are keyed by pick number.
`resetDraft()` clears one of them.

**Reproduction (code read).** `app.js:1013` inside the reset block:

```js
  view.selected = null;
  view.rosterSlot = null;
  briefCache = {};
```

and the declaration at ~4033:

```js
var briefCache = {};   // reassigned wholesale by resetDraft
var briefTries = {};   // re-asks per pick, so a bad answer cannot bill in a loop
```

`briefTries` is only ever written by `renderBrief` (increment) and by the "Ask again" button
(`briefTries[A.myNext] = 0`). Nothing clears it on reset. So a practice draft that burned both
re-asks at pick 11, followed by "Start over" and the real draft, reaches pick 11 with
`briefTries[11] === 2`: the first stale brief of the night is not re-asked at all and the user
goes straight to the "went at pick N" banner with no fresh advice.

The comment on `briefCache` ("reassigned wholesale by resetDraft") reads as though both were
handled; only one is.

**Proposed fix (not applied).** One line, next to the existing one:

```js
  briefCache = {};
  briefTries = {};
```

---

## D9 — LOW — `renderSpend()` prices the user-key path as Haiku 4.5 while the model menu offers Sonnet 5 and Opus 5

**Defect.** `renderSpend()` hard-codes $1/$5 per million for the non-proxy path. `app.html`
offers three models on that path.

**Reproduction.** `app.js:3709`:

```js
// Must match the prices the Worker pins, or the running total quietly lies.
var usd = PROXY ? (s.in / 1e6) * 2.0 + (s.out / 1e6) * 10.0
                : (s.in / 1e6) * 1.0 + (s.out / 1e6) * 5.0;
```

`app.html:510-514`:

```html
<select id="modelSel">
  <option value="claude-haiku-4-5">Haiku 4.5 — cheap and fast (recommended for a live draft)</option>
  <option value="claude-sonnet-5">Sonnet 5 — more considered, more expensive</option>
  <option value="claude-opus-5">Opus 5 — best reasoning, slowest</option>
</select>
```

Against the current price table (`claude-api` skill): Haiku 4.5 $1/$5, Sonnet 5 $2/$10,
Opus 5 $5/$25. Choosing Sonnet 5 under-reports by 2x; Opus 5 by 5x.

**Reachability, honestly.** With `claudeProxy` set — which it is in the committed
`config.js` (`https://draftline-api.ken-lince.workers.dev`, build `20260904av`) — `claudeReady()`
is true, `claudePanes()` hides `#claudeSetup`, and `claudeOnce()` always takes the PROXY
branch. The model select is never shown and the key path never runs. This is only live if
someone blanks `claudeProxy`. Hence LOW, not MEDIUM.

**Proposed fix (not applied).** A price table keyed by model id:

```js
var PRICES = { "claude-haiku-4-5": [1, 5], "claude-sonnet-5": [2, 10], "claude-opus-5": [5, 25] };
var pr = PROXY ? [2, 10] : (PRICES[claudeCfg.model] || PRICES["claude-haiku-4-5"]);
var usd = (s.in / 1e6) * pr[0] + (s.out / 1e6) * pr[1];
```

---

## D10 — LOW — A brand-new account spends a Claude call on first paint

**Defect.** `claudeCfg.auto` defaults to true and `claudeCfg.lead` to 2. A new account starts
on `defaultLeague()` — `ppr_standard`, 12 teams, **slot 1** — so at pick 1 the user's next
pick is 1, the gap is 0, and `renderBrief()` fires immediately during the boot `render()`,
before the quick-start modal has been answered and before the league has been configured.

**Reproduction.** Loading `app.js` in the harness with a fresh (empty) localStorage recorded
two outbound requests during boot:

```
fetch attempts: 2 [
  'https://draftline-api.ken-lince.workers.dev',
  'assets/config.js?bust=1788568285164'
]
```

The first is the brief. It describes a board scored in `ppr_standard` at slot 1, which is not
the user's league, under a modal the user has not dismissed.

**Judgment.** Auto-brief is on by design and pick 1 is a legitimate moment to write one, so
this is behaving as configured rather than malfunctioning. It costs roughly one cent and
produces advice about the wrong league. LOW.

**Proposed fix (not applied).** Suppress the brief until the draft has actually started, which
`renderBrief` can already tell:

```js
if (!claudeReady() || !claudeCfg.auto || !A.myNext || !S.draftStarted) { el.innerHTML = ""; return; }
```

---

## D11 — LOW — The brief's DRAFT STATE line names the round of the pick on the clock, not of the pick it is advising

**Defect.** `claudeContext()` prints `A.onClock.round`, which is `ownerOfPick(A.cur).round`.
The brief is written for `A.myNext`. At a round boundary they differ.

**Reproduction.** `node <scratch>/probe7.js`:

```
cur 36: myNext 38 myAfter 62
  prompt: DRAFT STATE: pick 36 of 180, round 3. My next pick is 38, then 62 (24 picks apart).
```

Pick 38 is in round 4. The model is told the round is 3 while being asked for the round-4
pick. `analyze()` already computes the right thing for its own use —
`var round = myNext ? ownerOfPick(myNext).round : ownerOfPick(cur).round;` — and puts it in
`ctx.round`; the prompt uses the other one.

**Impact.** Small but not zero: round drives the D/ST and kicker floors and a good deal of
draft heuristics the model brings with it. LOW.

**Proposed fix (not applied).** `", round " + A.ctx.round +` in the DRAFT STATE line, or spell
out both: `"pick 36 of 180 (round 3); the pick I am asking about is 38, in round 4"`.

---

## D12 — LOW — Double period in the style line of every prompt

`STRATS[...].tagline` ends in a period and the template appends another.

```
MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below
already have it applied.
```

Present in all five payloads below. Fix: drop the `"."` after the tagline in `claudeContext()`
(~3890), or strip a trailing period from the tagline.

---

## D13 — LOW — `teamsAhead()` reads `S.picks`, not `allPicks()`, so an opponent's pending keeper does not count toward that team's needs

**Code read, impact not reproduced.** `opponentRosters()` iterates `S.picks`. `pendingKeepers()`
exists precisely because a keeper is off the board before pick 1 and is deliberately not in
`S.picks`; `allPicks()` is the accessor that unions them. Every other consumer that needs
ownership uses `allPicks()` (`draftedNames`, `allRosters`, `analyze`). `teamsAhead()` does not.

In this league only the user holds a keeper and the user's own slot is skipped by
`teamsAhead()`, so there is no reproduction here — the "TEAMS PICKING BEFORE YOU" lines in all
five payloads are correct. If a second team's keeper is ever entered, that team's roster line
would read one player short and its "still needs" would be overstated.

Fix: `S.picks.forEach` becomes `allPicks().forEach` in `opponentRosters()`.

---

## D14 — LOW — No `AbortController` means no timeout at all

**Code read, not reproduced.** `claudeOnce()`:

```js
var ctl = typeof AbortController === "function" ? new AbortController() : null;
var timer = ctl && setTimeout(function () { ctl.abort(); }, CLAUDE_TIMEOUT_MS);
```

If `AbortController` is missing, `timer` is `false`, no abort is scheduled, and the fetch can
hang forever — the exact permanent-spinner failure the comment above says the timeout exists
to prevent. `AbortController` has shipped in iOS Safari since 12.1 and every desktop browser
of interest, so this is unreachable on the draft-night device. Recording it because the
guard's intent is defeated silently rather than loudly.

Fix: if there is no `AbortController`, race the fetch against a `setTimeout` rejection instead.

---

## Checked and sound

Each of these was verified, not assumed. Do not re-check them.

**Every number the brief quotes matches the board.** `probe5.js` reparses each built payload
and asserts each figure back against `A`: pick, total picks, round, `myNext`, `myAfter`, the
gap, each "TEAMS PICKING BEFORE YOU" line, and per candidate the points, VOR, ADP, bye,
composite, the marginal-value figure, both survival percentages and the pick number each
survival is labeled with.

```
checked 579 assertions, 0 mismatches
```

across all five states. The only defect found by that check is D2's placeholder, which the
probe reports separately as SUSPECT because the number is internally consistent and
externally false.

**The two survival horizons are correctly separated.** While waiting, the first is
`survival(p, myNext)` and the second `survival(p, myAfter)`, each labeled with its own pick
number. On the clock the first clause is omitted entirely and only the following-pick horizon
is shown. This is the fix the comment at `claudeContext` describes and it works.

**The marginal-value sentence is right in both directions.** Positive marginal renders "he
adds N pts to my starting lineup over a free RB"; zero or negative renders "he CANNOT crack my
starting lineup — I am already better at RB". Verified against `p.compDetail.marginal` on
every candidate in every state (part of the 579). State 4 is the useful case: with RB 3/2 and
TE 1/1 filled, ten of twelve candidates correctly carry the CANNOT sentence.

**A `blocked` player can never appear.** `claudeContext()` filters
`!(p.compDetail && p.compDetail.blocked)` *before* both the survival filter and the `< 6`
fallback, so both paths draw from the already-clean pool. Across a full 180-pick draft
(`probe1.js`), 164 waiting states, with as many as 77 blocked players sitting in `A.avail`:

```
blocked players that reached a candidate list: 0
```

**Keeper handling in the prompt is correct.** Drake Maye appears as the QB starter from pick 1;
pick 59 is skipped in the schedule; the gap sentence is keeper-aware
(`probe7.js`: "My next pick is 38, then 62 (24 picks apart)", not 21 to a slot already spent);
and at pick 62 the roster shows five players from picks 11, 14, 35, 38 and the keeper.

**The style-effect sentence is absent on Balanced, by design.** `styleEffect()` returns null
when `p.compNeutral == null`, and `analyze()` only computes the neutral board when
`Object.keys(activeKnobs()).length > 0`. Balanced has no knobs, so the second scoring pass is
skipped and there is nothing to report. All five payloads below are Balanced and correctly
carry no style sentence. Under a named style the sentence is emitted from `fx.delta`,
`fx.from` and `fx.to`, which are `p.comp - p.compNeutral`, `p.rankNeutral` and `p.rankStyled` —
the same numbers the board's own style panel shows.

**The empty-answer retry cannot recurse (item 5).** `claudeCall` calls `claudeOnce` in its own
catch, not `claudeCall`. Exactly one retry is possible. A second empty answer throws the same
`emptyAnswer` error, which the brief's catch turns into
`briefCache[forPick] = "!" + err.message` and renders as
"Claude is unavailable: The model used its whole token budget reasoning and returned nothing.
Ask again, or ask for something shorter." — a readable sentence, with the Ask again button
beneath it, and no spinner. Budgets double as documented: brief 2500 -> 5000 (Worker cap
8000, so it passes); report 4000 -> 8000 (exactly the cap); free-form and style undefined ->
2000 then `Math.max(4000, 0)` = 4000.

**The 30-second abort is clean (item 6).** The `AbortError` is converted to "Claude took longer
than 30 seconds to answer.", carries no `emptyAnswer` flag so `claudeCall` does not retry
(no double spend on a timeout), and lands in the same failed-card render: the spinner's
`innerHTML` is replaced wholesale, the "Ask again" button is rendered unconditionally in
`rec-actions`, and `renderBrief` writes only to `#brief` — `A`, `S.picks` and every other panel
are untouched. The timer is cleared on both the success and failure legs of the trailing
`.then(ok, err)`.

**Worker-down degrades everywhere (item 7).** All four AI entry points terminate in a `.catch`
that writes a message and re-enables its control, and none rethrows:
`renderBrief` (caches `"!"+message`), `askClaude` (`out.classList.add("err")`),
`#reportAsk`, `#styleAsk`. `renderBrief`'s call is asynchronous, so a rejection cannot
propagate into `render()`. Nothing in the render path reads a Claude result synchronously.
The message text on the 5xx path is D7's complaint; the structure is sound.

**Two devices cannot double-count spend (item 8).** `briefCache` and `briefTries` are
`var`s inside the app IIFE — in memory, per tab, gone on reload — so device B asks its own
briefs and neither device reuses the other's. The spend counter lives in `claudeCfg`, written
by `claudeSaveCfg()` to `localStorage` under `KEY_CLAUDE = "draftline.claude." + me.id`, and
`sync.js` only ever pushes `KEY_STATE` (`"draftline.state." + user.id`, `app.js:146`
`if (SYNC) SYNC.push(raw)`). `claudeCfg` is never synced, never sent to the account and never
merged. The consequence is the opposite of double counting: each device under-reports,
showing only its own calls. The authoritative shared figure is the one the Worker returns —
`result.budget.spentToday` — which `renderSpend()` already appends as "shared spend today $X
of $50.00". Worth knowing when reading the line, not worth changing.

**Pricing matches the current table (item 9).** `claude-api` skill, models table:
Sonnet 5 $2.00 in / $10.00 out per million; Haiku 4.5 $1.00 / $5.00. `renderSpend()` uses
2.0/10.0 on the proxy path and 1.0/5.0 on the key path; `worker/src/index.js` uses
`PRICE_IN = 2.0`, `PRICE_OUT = 10.0` with `MODEL = "claude-sonnet-5"`. All correct. The only
caveat is D9's model menu. Note also that `renderSpend()` counts `input_tokens` and
`output_tokens` only — correct today, because nothing sets `cache_control`, so
`cache_creation_input_tokens` and `cache_read_input_tokens` are always zero.

**The brief's model claims are correct (item 9).** Per the `claude-api` skill: on Sonnet 5,
`{type: "adaptive"}` is the only on-mode and **omitting `thinking` entirely runs adaptive**.
The Worker sends no `thinking` parameter, so adaptive thinking is on at default effort, and
thinking tokens are billed and counted as output — which is exactly why a tight `max_tokens`
can return a thinking block and no text, and why the empty-answer retry exists. Confirmed.
`output_config.effort` is GA on Sonnet 5 with no beta header, accepts
`low`/`medium`/`high`/`xhigh`/`max`, and defaults to `high` when omitted. The Worker sets no
`output_config`, so every call today runs at `high`. The brief is right that this is the
single largest server-side lever available and that it belongs in the Worker. Two further
facts worth having: `thinking.display` defaults to `"omitted"` on Sonnet 5, which is harmless
here because the client filters for `b.type === "text"`; and mid-conversation system messages
are *not* supported on Sonnet 5, so the `system` field is the only operator channel.

**Prompt caching is not worth pursuing (item 10) — confirmed, with a correction to the
reasoning.** Sonnet 5's minimum cacheable prefix is **1024 tokens** (`claude-api` skill,
`shared/prompt-caching.md`; the minimum is not monotonic across generations — 512 on Opus 5,
4096 on Haiku 4.5). Measured prompt sizes (character counts are exact; token figures are an
offline estimate at ~3.7 chars/token, since running `count_tokens` would have meant an API
call):

```
SYSTEM                   973 chars  ~  263 tokens
REPORT_SYSTEM            626 chars  ~  169 tokens
REPORT_SOLO_SYSTEM       510 chars  ~  138 tokens
STYLE_SYSTEM            1689 chars  ~  456 tokens
```

Every system prompt is three to seven times below the minimum, so a breakpoint on `system`
would silently create nothing — `cache_creation_input_tokens: 0`, no error. The brief's
conclusion is right. Its stated reason ("a few hundred tokens") is right for `system`; the
sharper statement is that the *cacheable prefix* is `tools` then `system` then `messages`, and
since there are no tools, a `system`-only breakpoint is all that is on offer without touching
the message, and it is four times too small.

The one case the brief's reasoning does not cover, and which I checked so nobody has to:
the brief payload itself is ~1,760-2,000 tokens, comfortably over the minimum, and the
re-ask path and the empty-answer retry send a *byte-identical* message within seconds. A
breakpoint at the end of the user message would let those hit cache. It is still not worth
it: cache writes cost 1.25x and reads 0.1x, so the break-even is more than one reuse, and a
re-ask happens a handful of times a night at best. Expected saving is a few cents per draft
against a new failure surface. Leave it alone.

**Rate limiting is comfortable (item 11).** The Worker allows `RATE_LIMIT = 90` per
`CF-Connecting-IP` per fixed 60-second bucket. Worst case with twelve people behind one NAT:

- In a 12-team draft every pick belongs to exactly one person, so the party's brief rate is
  bounded by the *room's pace*, not by the headcount. A fast room at 30 seconds a pick is
  2 picks a minute.
- Each pick triggers at most one auto-brief for its owner (`briefCache[A.myNext]` is set to
  `null` before the call, so re-renders cannot ask twice), plus at most 2 stale re-asks (D8's
  cap), plus at most 1 empty-answer retry per call: **6 requests per pick, absolute ceiling.**
- That is **12 requests a minute** at 30 s/pick. Add ad-hoc questions — say one per pick, with
  its own retry — and it is 16. At an absurd 15 s/pick it is about 32.
- Headroom is therefore roughly 5x at a realistic pace and 3x at an unrealistic one. The
  window is a fixed bucket (`Math.floor(Date.now()/1000/60)`) rather than sliding, which is
  more permissive at a boundary, not less.

One note for workstream F rather than D: `/api/` is dispatched to `handleAccounts` *before*
the rate-limit block, so account and state-sync traffic does not consume the 90 — and is
itself unlimited.

**Miscellaneous, verified sound.** The Worker pins the model and clamps `max_tokens` to
[200, 8000]; the client's 2500 and 4000 both pass through unchanged. The 12,000-character
`system` slice is far above every prompt here (largest is `STYLE_SYSTEM` at 1,689). The
96,000-byte body cap is far above the largest payload measured (7,399 characters). The
`messages.slice(-8)` is a no-op — every call sends exactly one message.

---

## What still requires live calls

None of the following can be answered without spending the owner's money, and all of it is
deliberately deferred pending approval.

| Question | Why it needs live calls |
|---|---|
| **Latency p50 and p95** for the brief against the 30-second client timeout and the two-minute clock. The brief's own bar is: p95 above 12 seconds is HIGH, because the brief is written up to two picks ahead and in a fast room will arrive after the pick. | Wall-clock only. Adaptive thinking at default effort makes this unpredictable from the prompt size. |
| **Real token usage** — input, output, and how much of the output is thinking. My 1,760-2,000 token figures are an offline character-count estimate; `count_tokens` is itself an API call. | Needs `response.usage`. |
| **The `output_config.effort` comparison** — `low` and `medium` against the default `high`, on the same states, for latency, tokens and whether the advice degrades. This is the largest efficiency lever and it belongs in the Worker. | Requires a Worker change plus paired runs. |
| **Advice quality** — 20 briefs under Balanced and 10 under Hero RB: the board's number one, the brief's pick, the fallback, and whether the argument was grounded in something the board cannot see or was a restatement of the composite. | Only the model can answer this. |
| **Whether the report obeys "trust the grades, do not re-rank"**, and specifically what it does with the threat paragraph the payload cannot support (D6). | Only the model can answer this. |
| **The real frequency of D1 and D4** — how often the model puts two players on line 1, uses a typographic apostrophe, or drops a suffix. This sets whether D1 is a once-a-draft hazard or a once-a-season one. It does not change the severity: a wrong bind is a wrong bind. | Needs a corpus of real answers. |

**Recommended live-run plan: about 100 calls, roughly $2, one sitting.**

- 30 brief calls at default effort across a seeded practice draft (20 Balanced, 10 Hero RB).
  These serve triple duty: quality tally, the latency sample, and the answer-format corpus
  for D1/D4.
- 60 brief calls re-running 30 of those states at `effort: "low"` and `effort: "medium"`,
  behind a temporary Worker deploy that reads the setting from an environment variable so the
  client is untouched.
- 5 report calls (three live-mode, two solo once D5 is fixed) and 5 style calls.

Cost estimate at Sonnet 5 rates ($2/$10 per million): roughly 2,000 input tokens per brief
and, allowing generously for adaptive thinking, 1,200 output tokens — about $0.016 a call.
100 calls is about **$1.60**, call it under $3 with the larger report payloads. That is well
inside the $50 daily stop but is more than a whole real draft night costs, so it is worth the
owner saying yes first.

Pacing: at any human pace this stays far under 90 requests a minute. If the runs are
scripted, put a one-second sleep between calls — a tight loop of 100 would trip the limit and,
per the rules of engagement, that would itself be a finding about the tester.

---

## Strategy notes

These are opinions, not defects.

### S1 — A 12-team percentile is a ranking, not a report card

`gradeDraft()` sorts by projected starting-lineup points and assigns
`LETTERS[Math.floor(i / n * LETTERS.length)]` from a 12-entry table. With 12 teams that
reduces to `LETTERS[rank - 1]` exactly: the curve is forced, every draft issues exactly one
A+ and exactly one D, and the letter carries no information the rank column does not already
carry.

```
   1. your team    grade A+  pts  2132     ...     11. team 2  grade D+  pts 1683
   2. team 7       grade A   pts  2103             12. team 5  grade D   pts 1647
  top-to-bottom spread: 485 pts (22.7% of the leader)
  distinct letters issued: 11 over 12 teams
```

In the seeded draft above, 22.7% top to bottom, the curve happens to be defensible. But it
would issue the identical letters if the spread were 20 points, telling the last-place manager
he drafted a D when he drafted a B-minus in a tight league. It also cannot say "everybody
drafted well", which is the honest verdict some drafts deserve.

There is a second artifact mid-draft. The report can be opened at any pick, and in a snake
the teams at the turn have taken more picks than the teams in the middle:

```
=== gradeDraft mid-draft at pick 100 ===
   3. team 1       grade A-  pts  1636 picks 9
  10. team 2       grade C-  pts  1234 picks 9
```

The header does say "grades will move as the rest come in", which is honest, and points are
compared across unequal pick counts either way.

**Recommendation.** Grade against the margin, not the rank. The least invasive version keeps
the same table and changes one line: letter from the team's share of the league-leading
starting lineup, on a fixed scale — for example A+ at 98% of the leader and above, A at 95,
A- at 92, B+ at 89, B at 85, B- at 81, C+ at 77, C at 73, C- at 69, D+ at 65, D below. A tight
league then produces a cluster of B-pluses and a blowout produces one A+ and two Ds, which is
what the reader actually wants to know. Keep the rank column as it is; it is already the
honest ordering. If the fixed scale is unappealing, a z-score against the league mean is the
same idea with self-calibrating thresholds. Either way, tell the model in `REPORT_SYSTEM` which
scale it is reading.

### S2 — Following the board's number one from slot 11 produced a six-back roster

This is an observation from driving the board, not a defect, and it belongs to workstream B —
but it came out of this workstream's harness and is worth passing on. `states.js` takes the
board's own top composite at every one of the user's picks. From slot 11 under Balanced that
produced:

```
STARTERS FILLED: QB 2/1, RB 6/2, WR 2/2, TE 2/1, K 1/1, DEF 1/1
MY BENCH: Trevor Lawrence (QB); Sam LaPorta (TE); Jordan Mason (RB);
          Chris Rodriguez Jr. (RB); Tyrone Tracy Jr. (RB)
```

Six running backs and two wide receivers, with the second WR (Makai Lemon, 171 pts) taken at
pick 131. It graded A+ in the simulated field, so the engine is internally consistent — the
scoring genuinely likes backs in this format. But a sharp drafter would not field two starting
receivers in full PPR, and the composite never pushed back because the FLEX and bench weights
kept rating a fourth back above a startable third receiver. Worth a look under workstream B's
`FLEX_SPLIT` and `benchWeight` items; noted here only because the AI layer inherits it. The
brief itself behaved correctly inside that state — at pick 62, with WR 0/2 open, the top two
candidates it was handed were both receivers.

---

## Appendix — the five brief payloads in full

Generated by `node <scratch>/gen.js`. League `kinda_highlanders`, 12 teams, slot 11, 15
rounds, Balanced, Drake Maye keeper at pick 59. Opponent picks are the app's own `E.roomPick`
room model with a fixed seed (20260908); the user's picks are the board's own top composite.
These are the exact strings `briefQuestion()` returns — nothing has been reformatted.

```text


==============================================================================
State 1 — pick 9, waiting for pick 11
  cur=9 myNext=11 myAfter=14 round=1 avail=258 mine=1 picks=8
==============================================================================
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 9 of 180, round 1. My next pick is 11, then 14 (3 picks apart).

RUN IN PROGRESS: WR, RB

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: EMPTY; RB: EMPTY; WR: EMPTY; WR: EMPTY; TE: EMPTY; FLEX: EMPTY; K: EMPTY; DEF: EMPTY

STARTERS FILLED: QB 1/1, RB 0/2, WR 0/2, TE 0/1, K 0/1, DEF 0/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Every player here has a real chance of reaching pick 11; the ones the teams in between will almost certainly take are already removed. Name a player from this list and nobody else.
- James Cook III (RB BUF, bye 7): 264 pts in this league, VOR 108, depth chart RB1, he adds 108 pts to my starting lineup over a free RB, ADP 11.4, chance he reaches the pick I am writing about (11) is 56%, chance he is still there at my FOLLOWING pick (14) is 17%, composite 127
- De'Von Achane (RB MIA, bye 6): 261 pts in this league, VOR 104, depth chart RB1, he adds 104 pts to my starting lineup over a free RB, ADP 9.8, chance he reaches the pick I am writing about (11) is 25%, chance he is still there at my FOLLOWING pick (14) is 1%, composite 122
- Derrick Henry (RB BAL, bye 13): 250 pts in this league, VOR 94, depth chart RB1, he adds 94 pts to my starting lineup over a free RB, ADP 15.9, chance he reaches the pick I am writing about (11) is 98%, chance he is still there at my FOLLOWING pick (14) is 79%, composite 106
- Saquon Barkley (RB PHI, bye 10): 250 pts in this league, VOR 93, depth chart RB1, he adds 93 pts to my starting lineup over a free RB, ADP 18.3, chance he reaches the pick I am writing about (11) is 98%, chance he is still there at my FOLLOWING pick (14) is 90%, composite 105
- Kenneth Walker (RB KC, bye 5): 247 pts in this league, VOR 90, depth chart RB1, he adds 90 pts to my starting lineup over a free RB, ADP 21.1, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 97%, composite 102, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Best situation of his career. KC was 8th in rushing success rate with the 3rd-lowest stuff rate. 2nd in explosive run rate, 1st in missed tackles forced per attempt. Now the favorite for goal-line work he never had in SEA. 3rd-easiest early schedule.
- Omarion Hampton (RB LAC, bye 7): 246 pts in this league, VOR 89, depth chart RB1, he adds 89 pts to my starting lineup over a free RB, ADP 22.3, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 98%, composite 100
- Brock Bowers (TE LV, bye 13): 257 pts in this league, VOR 94, depth chart TE1, he adds 94 pts to my starting lineup over a free TE, ADP 34.4, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 100%, composite 96, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Fitzmaurice takes him anywhere in the back half of Rd 2. 112-1194-5 on 153 targets as a rookie; last yr was a Wk1 PCL/bone bruise. Scored 7 TDs in 8 games once healthy. Anemic LV WR room + TE-friendly Cousins + Kubiak. McBride-2025 comp.
- CeeDee Lamb (WR DAL, bye 14): 275 pts in this league, VOR 74, depth chart LWR1, he adds 74 pts to my starting lineup over a free WR, ADP 10.3, chance he reaches the pick I am writing about (11) is 34%, chance he is still there at my FOLLOWING pick (14) is 1%, composite 89
- Ashton Jeanty (RB LV, bye 13): 237 pts in this league, VOR 80, depth chart RB1, listed Questionable (Knee), he adds 80 pts to my starting lineup over a free RB, ADP 20.8, chance he reaches the pick I am writing about (11) is 99%, chance he is still there at my FOLLOWING pick (14) is 96%, composite 87, flagged BREAKOUT (Tipped to take a big step up this season.). Research note: Monitoring case, no official Week 1 designation yet. Yates' breakout pick — a 1st-rd fantasy pick last yr who was solid but unspectacular. Note he was among the four RBs with the least room before contact.
- Nico Collins (WR HOU, bye 8): 266 pts in this league, VOR 66, depth chart LWR1, he adds 66 pts to my starting lineup over a free WR, ADP 21.1, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 99%, composite 75
- Trey McBride (TE ARI, bye 14): 238 pts in this league, VOR 75, depth chart TE1, he adds 75 pts to my starting lineup over a free TE, ADP 29.9, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 100%, composite 72, flagged LANDMINE (Real downside risk at the price he is going for — the research expects him to disappoint the pick you would spend.). Research note: 169 targets and 11 TDs both scream regression — TD total was 2x his career high. ARI led NFL in attempts but used the No.3 pick on Jeremiyah Love and wants MHJ involved. Could throw 100 fewer times; Carson Beck audition looms.
- Javonte Williams (RB DAL, bye 14): 215 pts in this league, VOR 58, depth chart RB1, he adds 58 pts to my starting lineup over a free RB, ADP 34.6, chance he reaches the pick I am writing about (11) is 100%, chance he is still there at my FOLLOWING pick (14) is 100%, composite 66

TEAMS PICKING BEFORE YOU:
  pick 9 — team 9 has empty, still needs QB, RB, WR, TE, K, DEF
  pick 10 — team 10 has empty, still needs QB, RB, WR, TE, K, DEF

QUESTION: I am about to be on the clock at pick 11. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.

==============================================================================
State 2 — on the clock at pick 11
  cur=11 myNext=11 myAfter=14 round=1 avail=256 mine=1 picks=10
==============================================================================
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 11 of 180, round 1. My next pick is 11, then 14 (3 picks apart).

RUN IN PROGRESS: RB

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: EMPTY; RB: EMPTY; WR: EMPTY; WR: EMPTY; TE: EMPTY; FLEX: EMPTY; K: EMPTY; DEF: EMPTY

STARTERS FILLED: QB 1/1, RB 0/2, WR 0/2, TE 0/1, K 0/1, DEF 0/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

AVAILABLE RIGHT NOW, BY THE BOARD'S OWN SCORE. I am on the clock, so every player here is takeable this second. Name a player from this list and nobody else.
- James Cook III (RB BUF, bye 7): 264 pts in this league, VOR 108, depth chart RB1, he adds 108 pts to my starting lineup over a free RB, ADP 11.4, chance he is still there at my FOLLOWING pick (14) is 17%, composite 127
- Derrick Henry (RB BAL, bye 13): 250 pts in this league, VOR 94, depth chart RB1, he adds 94 pts to my starting lineup over a free RB, ADP 15.9, chance he is still there at my FOLLOWING pick (14) is 79%, composite 106
- Saquon Barkley (RB PHI, bye 10): 250 pts in this league, VOR 93, depth chart RB1, he adds 93 pts to my starting lineup over a free RB, ADP 18.3, chance he is still there at my FOLLOWING pick (14) is 90%, composite 105
- Kenneth Walker (RB KC, bye 5): 247 pts in this league, VOR 90, depth chart RB1, he adds 90 pts to my starting lineup over a free RB, ADP 21.1, chance he is still there at my FOLLOWING pick (14) is 97%, composite 102, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Best situation of his career. KC was 8th in rushing success rate with the 3rd-lowest stuff rate. 2nd in explosive run rate, 1st in missed tackles forced per attempt. Now the favorite for goal-line work he never had in SEA. 3rd-easiest early schedule.
- Omarion Hampton (RB LAC, bye 7): 246 pts in this league, VOR 89, depth chart RB1, he adds 89 pts to my starting lineup over a free RB, ADP 22.3, chance he is still there at my FOLLOWING pick (14) is 98%, composite 100
- Brock Bowers (TE LV, bye 13): 257 pts in this league, VOR 94, depth chart TE1, he adds 94 pts to my starting lineup over a free TE, ADP 34.4, chance he is still there at my FOLLOWING pick (14) is 100%, composite 96, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Fitzmaurice takes him anywhere in the back half of Rd 2. 112-1194-5 on 153 targets as a rookie; last yr was a Wk1 PCL/bone bruise. Scored 7 TDs in 8 games once healthy. Anemic LV WR room + TE-friendly Cousins + Kubiak. McBride-2025 comp.
- Ashton Jeanty (RB LV, bye 13): 237 pts in this league, VOR 80, depth chart RB1, listed Questionable (Knee), he adds 80 pts to my starting lineup over a free RB, ADP 20.8, chance he is still there at my FOLLOWING pick (14) is 96%, composite 87, flagged BREAKOUT (Tipped to take a big step up this season.). Research note: Monitoring case, no official Week 1 designation yet. Yates' breakout pick — a 1st-rd fantasy pick last yr who was solid but unspectacular. Note he was among the four RBs with the least room before contact.
- CeeDee Lamb (WR DAL, bye 14): 275 pts in this league, VOR 74, depth chart LWR1, he adds 74 pts to my starting lineup over a free WR, ADP 10.3, chance he is still there at my FOLLOWING pick (14) is 1%, composite 80
- Trey McBride (TE ARI, bye 14): 238 pts in this league, VOR 75, depth chart TE1, he adds 75 pts to my starting lineup over a free TE, ADP 29.9, chance he is still there at my FOLLOWING pick (14) is 100%, composite 72, flagged LANDMINE (Real downside risk at the price he is going for — the research expects him to disappoint the pick you would spend.). Research note: 169 targets and 11 TDs both scream regression — TD total was 2x his career high. ARI led NFL in attempts but used the No.3 pick on Jeremiyah Love and wants MHJ involved. Could throw 100 fewer times; Carson Beck audition looms.
- Nico Collins (WR HOU, bye 8): 266 pts in this league, VOR 66, depth chart LWR1, he adds 66 pts to my starting lineup over a free WR, ADP 21.1, chance he is still there at my FOLLOWING pick (14) is 99%, composite 67
- Javonte Williams (RB DAL, bye 14): 215 pts in this league, VOR 58, depth chart RB1, he adds 58 pts to my starting lineup over a free RB, ADP 34.6, chance he is still there at my FOLLOWING pick (14) is 100%, composite 66
- Jeremiyah Love (RB ARI, bye 14): 214 pts in this league, VOR 58, depth chart RB1, listed Questionable (Ankle), he adds 58 pts to my starting lineup over a free RB, ADP 27.6, chance he is still there at my FOLLOWING pick (14) is 100%, composite 65

TEAMS PICKING BEFORE YOU:
  (you are on the clock now)

QUESTION: I am about to be on the clock at pick 11. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.

==============================================================================
State 3 — pick 33, waiting for pick 35
  cur=33 myNext=35 myAfter=38 round=3 avail=234 mine=3 picks=32
==============================================================================
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 33 of 180, round 3. My next pick is 35, then 38 (3 picks apart).

RUN IN PROGRESS: WR

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: James Cook III (RB, 264 pts, bye 7); RB: Derrick Henry (RB, 250 pts, bye 13); WR: EMPTY; WR: EMPTY; TE: EMPTY; FLEX: EMPTY; K: EMPTY; DEF: EMPTY

STARTERS FILLED: QB 1/1, RB 2/2, WR 0/2, TE 0/1, K 0/1, DEF 0/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Every player here has a real chance of reaching pick 35; the ones the teams in between will almost certainly take are already removed. Name a player from this list and nobody else.
- Colston Loveland (TE CHI, bye 10): 219 pts in this league, VOR 55, depth chart TE1, he adds 55 pts to my starting lineup over a free TE, ADP 54.6, chance he reaches the pick I am writing about (35) is 98%, chance he is still there at my FOLLOWING pick (38) is 96%, composite 55
- Travis Etienne Jr. (RB NO, bye 8): 210 pts in this league, VOR 54, depth chart RB1, he adds 54 pts to my starting lineup over a free RB, ADP 37.2, chance he reaches the pick I am writing about (35) is 68%, chance he is still there at my FOLLOWING pick (38) is 43%, composite 54
- D'Andre Swift (RB CHI, bye 10): 211 pts in this league, VOR 54, depth chart RB1, listed Questionable (Undisclosed), he adds 54 pts to my starting lineup over a free RB, ADP 43.7, chance he reaches the pick I am writing about (35) is 97%, chance he is still there at my FOLLOWING pick (38) is 89%, composite 54
- David Montgomery (RB HOU, bye 8): 209 pts in this league, VOR 52, depth chart RB1, he adds 52 pts to my starting lineup over a free RB, ADP 54.5, chance he reaches the pick I am writing about (35) is 100%, chance he is still there at my FOLLOWING pick (38) is 99%, composite 52
- Cam Skattebo (RB NYG, bye 8): 204 pts in this league, VOR 47, depth chart RB1, he adds 47 pts to my starting lineup over a free RB, ADP 39.8, chance he reaches the pick I am writing about (35) is 83%, chance he is still there at my FOLLOWING pick (38) is 64%, composite 48
- Bucky Irving (RB TB, bye 10): 200 pts in this league, VOR 43, depth chart RB1, he adds 43 pts to my starting lineup over a free RB, ADP 46.3, chance he reaches the pick I am writing about (35) is 98%, chance he is still there at my FOLLOWING pick (38) is 94%, composite 43, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: The whole industry is fading him. From Wk10 of his rookie yr through the playoff loss he averaged 111.6 scrimmage yds/gm over 9 games. 3.93 YAC/att led all RBs with 60+ carries in '24. Still averaged 20.3 touches even with Tucker on the goal line and White on 3rd down.
- Tyler Warren (TE IND, bye 13): 204 pts in this league, VOR 41, depth chart TE1, listed Questionable (Groin), he adds 41 pts to my starting lineup over a free TE, ADP 66, chance he reaches the pick I am writing about (35) is 100%, chance he is still there at my FOLLOWING pick (38) is 100%, composite 40
- Sam LaPorta (TE DET, bye 6): 199 pts in this league, VOR 36, depth chart TE1, listed Questionable (Hip), the other ADP market is 60 picks higher on him than players of his price here, he adds 36 pts to my starting lineup over a free TE, ADP 109, chance he reaches the pick I am writing about (35) is 100%, chance he is still there at my FOLLOWING pick (38) is 100%, composite 34, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Draft Sharks calls him solid value in the TE tier.
- Quinshon Judkins (RB CLE, bye 11): 198 pts in this league, VOR 42, depth chart RB1, he adds 42 pts to my starting lineup over a free RB, ADP 50.3, chance he reaches the pick I am writing about (35) is 100%, chance he is still there at my FOLLOWING pick (38) is 99%, composite 34, flagged LANDMINE (Real downside risk at the price he is going for — the research expects him to disappoint the pick you would spend.). Research note: RB26 in PPG Wks 2-15 despite 18.7 touches — volume-driven and TD-dependent. 40th of 49 in explosive run rate, 2nd-to-last in rushing success rate. Returning from dislocated ankle + fractured fibula; rebuilt OL that's never played together.
- Jaylen Waddle (WR DEN, bye 10): 224 pts in this league, VOR 24, depth chart RWR1, he adds 24 pts to my starting lineup over a free WR, ADP 44.3, chance he reaches the pick I am writing about (35) is 97%, chance he is still there at my FOLLOWING pick (38) is 90%, composite 30, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Moves from an offense 29th in neutral pass rate to one that was 4th, and 4th in total attempts. 12th in targets per route, 12th in YPRR, 7th in first downs per route, 12th in separation score. Beat Sutton in every category but route win rate.
- Tee Higgins (WR CIN, bye 6): 228 pts in this league, VOR 27, depth chart RWR2, listed Questionable (Heel), he adds 27 pts to my starting lineup over a free WR, ADP 36.1, chance he reaches the pick I am writing about (35) is 60%, chance he is still there at my FOLLOWING pick (38) is 34%, composite 29
- Emeka Egbuka (WR TB, bye 10): 228 pts in this league, VOR 27, depth chart LWR1, listed Questionable (Undisclosed), he adds 27 pts to my starting lineup over a free WR, ADP 35.7, chance he reaches the pick I am writing about (35) is 57%, chance he is still there at my FOLLOWING pick (38) is 29%, composite 27, flagged INJURY (Carrying an injury worth checking before you put him in a lineup.). Research note: Sprained toe that may affect Week 1 availability. Also worth knowing: he opened last yr at 5.0-89-1.0 per game over five games, then fell to 3.2-41-0.1 over his final 12 with 5.5 yds/target.

TEAMS PICKING BEFORE YOU:
  pick 33 — team 9 has RB/RB, still needs QB, WR, TE, K, DEF
  pick 34 — team 10 has RB/RB, still needs QB, WR, TE, K, DEF

QUESTION: I am about to be on the clock at pick 35. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.

==============================================================================
State 4 — on the clock at pick 62 (Drake Maye keeper taken at 59)
  cur=62 myNext=62 myAfter=83 round=6 avail=206 mine=5 picks=61
==============================================================================
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 62 of 180, round 6. My next pick is 62, then 83 (21 picks apart).

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: James Cook III (RB, 264 pts, bye 7); RB: Derrick Henry (RB, 250 pts, bye 13); WR: EMPTY; WR: EMPTY; TE: Colston Loveland (TE, 219 pts, bye 10); FLEX: Breece Hall (RB, 214 pts, bye 13); K: EMPTY; DEF: EMPTY

STARTERS FILLED: QB 1/1, RB 3/2, WR 0/2, TE 1/1, K 0/1, DEF 0/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

AVAILABLE RIGHT NOW, BY THE BOARD'S OWN SCORE. I am on the clock, so every player here is takeable this second. Name a player from this list and nobody else.
- Parker Washington (WR JAX, bye 7): 216 pts in this league, VOR 15, depth chart SWR1, he adds 15 pts to my starting lineup over a free WR, ADP 62.6, chance he is still there at my FOLLOWING pick (83) is 0%, composite 23, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: Wks 16-19 he was JAX's clear WR1: 22.3 PPR/gm, 113.5 yds/gm, 28.9% target share, 3.78 YPRR, 33.3% first-read share. Lawrence has always preferred him and Meyers over BTJ. 85.1 PFF receiving grade.
- Rome Odunze (WR CHI, bye 10): 211 pts in this league, VOR 11, depth chart LWR2, listed Questionable (Leg), he adds 11 pts to my starting lineup over a free WR, ADP 54.6, chance he is still there at my FOLLOWING pick (83) is 0%, composite 17, flagged BREAKOUT (Tipped to take a big step up this season.). Research note: Draft Sharks flags him as a potential 2026 steal.
- Tyler Warren (TE IND, bye 13): 204 pts in this league, VOR 41, depth chart TE1, listed Questionable (Groin), he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 66, chance he is still there at my FOLLOWING pick (83) is 2%, composite 12
- Sam LaPorta (TE DET, bye 6): 199 pts in this league, VOR 36, depth chart TE1, listed Questionable (Hip), the other ADP market is 60 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 109, chance he is still there at my FOLLOWING pick (83) is 90%, composite 10, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: Draft Sharks calls him solid value in the TE tier.
- Harold Fannin Jr. (TE CLE, bye 11): 183 pts in this league, VOR 20, depth chart TE1, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 74.1, chance he is still there at my FOLLOWING pick (83) is 17%, composite 6
- Bhayshul Tuten (RB JAX, bye 7): 177 pts in this league, VOR 20, depth chart RB1, listed Questionable (Illness), he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 54, chance he is still there at my FOLLOWING pick (83) is 0%, composite 6
- Jaylen Warren (RB PIT, bye 9): 173 pts in this league, VOR 16, depth chart RB1, he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 62.3, chance he is still there at my FOLLOWING pick (83) is 0%, composite 6
- Trevor Lawrence (QB JAX, bye 7): 301 pts in this league, VOR 8, depth chart QB1, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 92.5, chance he is still there at my FOLLOWING pick (83) is 79%, composite 4, flagged CONVICTION (A high-conviction call — analysts are staking their name on him going well past where the market has him, rather than a consensus ranking.). Research note: From Wk5 on he outscored every player at every position at 23 pts/gm; ~28 with a full WR room. Top-5 in PPG, 1st in expected fantasy pts/gm. 4th-most RZ pass attempts, 3rd-most RZ carries, 9 rush TDs (only Allen had more). Yr 2 with Coen.
- Rhamondre Stevenson (RB NE, bye 11): 171 pts in this league, VOR 14, depth chart RB1, he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 61.5, chance he is still there at my FOLLOWING pick (83) is 0%, composite 4
- Jalen Hurts (QB PHI, bye 10): 312 pts in this league, VOR 18, depth chart QB1, the other ADP market is 26 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at QB, so he is bench depth and nothing else, ADP 77.9, chance he is still there at my FOLLOWING pick (83) is 33%, composite 4, flagged SLEEPER (Going later in drafts than his projection says he should.). Research note: PFF's early-round QB target.
- TreVeyon Henderson (RB NE, bye 11): 173 pts in this league, VOR 16, depth chart RB2, listed Questionable (Leg), he CANNOT crack my starting lineup — I am already better at RB, so he is bench depth and nothing else, ADP 64.3, chance he is still there at my FOLLOWING pick (83) is 0%, composite 4
- Kyle Pitts Sr. (TE ATL, bye 11): 174 pts in this league, VOR 11, depth chart TE1, he CANNOT crack my starting lineup — I am already better at TE, so he is bench depth and nothing else, ADP 81.6, chance he is still there at my FOLLOWING pick (83) is 45%, composite 3

TEAMS PICKING BEFORE YOU:
  (you are on the clock now)

QUESTION: I am about to be on the clock at pick 62. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.

==============================================================================
State 5 — pick 177, waiting for pick 179
  cur=177 myNext=179 myAfter=null round=15 avail=91 mine=14 picks=176
==============================================================================
LEAGUE: Kinda Highlanders (Yahoo #257015), 12 teams, I pick at slot 11.

SCORING THAT DIFFERS FROM DEFAULT: 1 pt per reception; yardage bonuses at 400/500 pass, 150/200 rush and rec; 40+ yard play and TD bonuses; return yards at 1 pt per 20; boosted D/ST points-allowed tiers (25 for a shutout, 14 for 7-13) — this makes an elite defense worth roughly a 7th-round pick, not a 15th

DRAFT STATE: pick 177 of 180, round 15. My next pick is 179.

MY STARTERS: QB: Drake Maye (QB, 320 pts, bye 11); RB: James Cook III (RB, 264 pts, bye 7); RB: Derrick Henry (RB, 250 pts, bye 13); WR: Parker Washington (WR, 216 pts, bye 7); WR: Makai Lemon (WR, 171 pts, bye 10); TE: Colston Loveland (TE, 219 pts, bye 10); FLEX: Breece Hall (RB, 214 pts, bye 13); K: Cameron Dicker (K, 143 pts, bye 7); DEF: Houston Defense (DEF, 336 pts, bye 8)

MY BENCH: Trevor Lawrence (QB, 301 pts, bye 7); Sam LaPorta (TE, 199 pts, bye 6); Jordan Mason (RB, 156 pts, bye 6); Chris Rodriguez Jr. (RB, 134 pts, bye 7); Tyrone Tracy Jr. (RB, 113 pts, bye 8)

STARTERS FILLED: QB 2/1, RB 6/2, WR 2/2, TE 2/1, K 1/1, DEF 1/1

Compare any candidate against the man already in that slot, not against the league. A player who cannot start for me is worth close to nothing however well he scores in the abstract — say so plainly rather than arguing him up.

MY DRAFT STYLE: Balanced — Value over replacement, need as a tiebreaker.. The scores below already have it applied. Say when a pick is only on top because of the style, and say so too when the style is steering me wrong here.

LIKELY AVAILABLE WHEN MY TURN COMES, BY THE BOARD'S OWN SCORE. Every player here has a real chance of reaching pick 179; the ones the teams in between will almost certainly take are already removed. Name a player from this list and nobody else.
- Tre' Harris (WR LAC, bye 7): 115 pts in this league, VOR -86, depth chart RWR3, listed Questionable (Undisclosed), he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 174.4, chance he reaches the pick I am writing about (179) is 41%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -90
- Caleb Douglas (WR MIA, bye 6): 96 pts in this league, VOR -104, depth chart RWR2, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 164.5, chance he reaches the pick I am writing about (179) is 28%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -101
- Isaac TeSlaa (WR DET, bye 6): 89 pts in this league, VOR -112, depth chart LWR3, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 175.6, chance he reaches the pick I am writing about (179) is 40%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -112
- Jaylin Noel (WR HOU, bye 8): 86 pts in this league, VOR -114, depth chart SWR3, listed Questionable (Hamstring), he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 171, chance he reaches the pick I am writing about (179) is 32%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -113
- Keon Coleman (WR BUF, bye 7): 87 pts in this league, VOR -114, depth chart LWR3, listed Questionable (Foot), he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 172.3, chance he reaches the pick I am writing about (179) is 39%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -117
- Darius Slayton (WR NYG, bye 8): 78 pts in this league, VOR -123, depth chart RWR4, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 177.5, chance he reaches the pick I am writing about (179) is 39%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -124
- Xavier Legette (WR CAR, bye 5): 67 pts in this league, VOR -134, depth chart RWR3, listed Questionable (Lower Body), he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 175.7, chance he reaches the pick I am writing about (179) is 46%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -131
- Troy Franklin (WR DEN, bye 10): 67 pts in this league, VOR -134, depth chart SWR5, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 182.1, chance he reaches the pick I am writing about (179) is 55%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -133
- Tyquan Thornton (WR KC, bye 5): 64 pts in this league, VOR -137, depth chart LWR3, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 174.5, chance he reaches the pick I am writing about (179) is 43%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -135
- Tank Dell (WR HOU, bye 8): 53 pts in this league, VOR -148, depth chart SWR6, listed IR (Knee - ACL + MCL), the other ADP market is 37 picks higher on him than players of his price here, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 166.9, chance he reaches the pick I am writing about (179) is 26%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -153, flagged INJURY (Carrying an injury worth checking before you put him in a lineup.). Research note: On injured reserve with a return designation.
- Xavier Hutchinson (WR HOU, bye 8): 37 pts in this league, VOR -163, depth chart LWR4, he CANNOT crack my starting lineup — I am already better at WR, so he is bench depth and nothing else, ADP 185.3, chance he reaches the pick I am writing about (179) is 65%, chance he is still there at my FOLLOWING pick (179) is 100%, composite -163

TEAMS PICKING BEFORE YOU:
  pick 177 — team 9 has RB/RB/WR/RB/QB/TE/RB/WR/TE/WR/DEF/RB/K/WR, still needs starters full
  pick 178 — team 10 has RB/RB/TE/WR/QB/RB/QB/WR/WR/RB/DEF/K/TE/RB, still needs starters full

QUESTION: I am about to be on the clock at pick 179. Give me the call before the timer starts.
Answer in exactly this shape, no headings, no bullets:
Line 1 — the player you would take, and nothing else on that line.
Then two or three sentences on why, grounded in my open roster slots, the board's numbers and anything the research notes flag.
Last line — start it with "If gone:" and name one fallback in a single clause. Do not quote survival percentages on that line; a fallback is by definition the player you take when the first one is already gone.
Under 110 words total. If the board's top pick is right, say so plainly and spend your words on what it cannot see.
Every player listed above is ON THE BOARD right now — nobody has taken them. A survival percentage is the chance he lasts until my pick, not a report that he has gone. Never describe an available player as gone, taken or off the board: say he is unlikely to last, which is the thing that is actually true.```
