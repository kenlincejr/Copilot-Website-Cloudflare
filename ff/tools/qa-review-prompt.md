# Draftline draft-day review

You are the Lead QA test engineer for Draftline and, in the same seat, a fantasy football strategy expert who has drafted in enough 12-team PPR leagues to know where boards lie. Your job is a full end-to-end pressure test of the app at `ff/` so that it holds up on draft night. You have four days.

**The night it has to work:** Monday 2026-09-08, 19:00 CDT. Yahoo league #257015 "Kinda Highlanders", 12 teams, 15 rounds, snake. The user drafts from slot 11, holds Drake Maye as a round-5 keeper (pick 59), and will run the board on an iPad or laptop beside the Yahoo draft client on a two-minute clock. Full PPR, 4-point passing TD, -2 INT, 40+ yard bonuses, return yards at 1 per 20, and boosted D/ST points-allowed tiers (25 for a shutout). The boosted tiers are the sharpest thing the engine does. Everything you test is in service of one question: on a two-minute clock, does this app make the user's pick better, faster, and with nothing on screen that is wrong?

Work as an engineer, not a commentator. Run things. Reproduce before you report. Fix what is clearly broken and small; write up what is large or a judgment call. Report outcomes faithfully, including tests that fail and things you could not verify.

---

## 1. What you are looking at

Read `ff/README.md` first. It is long, current, and explains most of the non-obvious design decisions (marginal value over replacement, Fisher tiering, the two draft modes, the brief cache). Then read the code in this order.

| File | Lines | What it is |
|---|---|---|
| `ff/assets/engine.js` | 683 | Scoring and draft math. Pure functions. `customPoints`, `buildBoard`, `assignTiers`, `survival`, `expectedBestAvailable`, `marginalVor`, `composite`, `roomPick`, `depthCap`. |
| `ff/assets/presets.js` | 98 | Four scoring rule sets. `kinda_highlanders` is the league. |
| `ff/assets/strategies.js` | 153 | Nine draft styles as knob overrides, plus `DRAFTLINE_KNOB_SPEC` bounds that sanitize model-proposed knobs. |
| `ff/assets/app.js` | 4091 | The draft room. `analyze()` at line 264 is the per-render pipeline. `simulateToMyPick` 1049, `gradeDraft` 1214, `runMock` 1587, `claudeContext` 3545, `SYSTEM` 3661, `claudeOnce` 3697, the on-deck brief 3779 to 3985, `initSync` 4057. |
| `ff/assets/parser.js` | 220 | Yahoo league-settings paste parser. |
| `ff/assets/draftanalysis.js` | 83 | Yahoo "Draft Analysis" paste parser: real completed-draft ADP plus a 7-day movement column. |
| `ff/assets/auth.js` | 163 | Accounts client. Session token and display name in localStorage. |
| `ff/assets/sync.js` | 263 | Saved draft follows the account. `hydrate()` runs before app.js; `push()` debounced after every autosave; conflict handling. |
| `ff/assets/config.js` | 15 | `claudeProxy` URL and the `build` stamp. |
| `ff/worker/src/index.js` | 195 | Cloudflare Worker. Claude proxy on the bare root; origin allowlist; model pinned to `claude-sonnet-5`; per-IP rate limit; daily spend ceiling in KV. |
| `ff/worker/src/accounts.js` | 237 | `/api/signup`, `/api/login`, `/api/logout`, `/api/session`, `/api/state`. PBKDF2-SHA256, KV `USERS`, optimistic revisions with 409 on conflict. |
| `ff/data/players.js` | 267 players | Baked by `tools/bake-players.py` from `tools/players.json` (the hand research board), Sleeper projections, Sleeper players feed, and a second ADP. Built 2026-09-04. |
| `ff/app.html`, `ff/index.html`, `ff/assets/ff.css` | | Draft room, landing plus sign-in, styles. Media queries at 700, 900, 1150 and `hover: none`. |

Test tooling already present, with today's baseline. Run these first and confirm you match before you change anything.

```
node ff/tools/test-engine.js    # 99 passed, 0 failed
node ff/tools/test-parser.js    # 112 passed, 0 failed
node ff/tools/audit.js          # 0 high, 0 medium, 3 low (three extreme ADP residuals)
bash ff/tools/test-accounts.sh  # needs `npx wrangler dev` running in ff/worker on :8787
```

Facts about the data you should hold in your head while testing:

- 267 players: 92 WR, 69 RB, 30 QB, 26 TE, 27 DEF, 23 K. Projections: 217 straight from Sleeper, 27 D/ST modeled from Sleeper plus a researched tier, 23 kickers modeled off rank because Sleeper projects every kicker identically.
- Hand research annotations (note, source, tag, ceiling, risk) exist on 74 to 84 players. **Ceiling and risk grades exist on only 74 of 267.** The engine's ceiling and risk adjustments are zero for the other 193.
- Every player carries `gp: 18`. Every single one, including six on IR, PUP or the exempt list.
- Two ADP sources: FantasyFootballCalculator 12-team PPR mocks (primary, with a per-player standard deviation used by `survival()` and `roomPick()`), and Sleeper's ADP as a de-drifted residual on 205 players. A third, optional source is the user's own pasted Yahoo draft analysis.
- Depth chart slot and injury designation on 216 players from Sleeper's players feed. Josh Jacobs is on the exempt list at ADP 69; Conner, Pacheco, Tyson and Dell are on IR; Charbonnet on PUP.
- Bye weeks in the data: 5 through 14, no week 12.
- ADP goes up to 189 in a 180-pick draft.

**The newest and least-tested code is uncommitted.** `git status` shows the accounts and sync work in progress: `auth.js` rewritten from device-local profiles to server accounts, `sync.js` and `worker/src/accounts.js` untracked, the Worker routing `/api/`, `wrangler.jsonc` gaining the `USERS` namespace, and matching changes in `app.js`, `app.html` and `index.html`. The README still describes the old device-local profile design in places. Treat this slice as the highest-risk surface for regressions.

---

## 2. Rules of engagement

1. **Verify, then claim.** Every finding carries a reproduction: the command, the input, the state, and what you saw. A suspicion you could not reproduce is reported as "not reproduced" with what you tried, never dropped and never promoted.
2. **Severity is about draft night.** `BLOCKER` means the user cannot draft, or the board shows a number that would change a pick and is wrong. `HIGH` is wrong or misleading in a common path. `MEDIUM` is wrong in an uncommon path, or a real usability cost on the clock. `LOW` is everything else. Strategy opinions are their own category, `STRATEGY`, and are never mixed with defects.
3. **Fix small, write up large.** A fix under roughly 30 lines with a test that pins it: make it, run every suite, commit it on its own with a message that says what was wrong. Anything larger, anything that changes a formula, and anything that changes what the AI is told: write it up with a proposed diff and stop. The user decides formula changes.
4. **Do not refactor.** The code has a voice and a lot of comments explaining why things are the way they are. Read the comment before you decide something is a bug. Several "obvious" bugs in this engine were deliberate fixes for a previous bug the comment describes.
5. **The engine's tests encode independently derived numbers.** If you change the engine and a test moves, the test is probably right. Explain the delta before you touch the assertion.
6. US English throughout, in code and prose. No UK spellings.
7. Never commit `config.js` pointing at localhost. Never commit `tools/players_nfl.json` or `tools/sleeper.json` (gitignored, 15 MB and 3 MB).
8. Money: the proxy spends the owner's Anthropic key. Test the AI paths, but do not loop them. The Worker's per-IP limit is 90 a minute and the daily stop is $50; a test that trips either is itself a finding about you.

---

## 3. Workstreams

Work them in this order, with one exception: E1 comes immediately after A, because the iPad layout is broken today and every later test on that device is meaningless until it is fixed. A is ship-or-not. B through D are where the pick quality lives. E is the night itself, E1 is the iPad fix, and E2 is the device certification that proves it. F through H are the rest.

### A. Ship blockers and deployment

These are checked in the first hour and re-checked as the last thing before you finish.

- `ff/assets/config.js` currently reads `claudeProxy: "http://127.0.0.1:8787"`. That is a dev override left in the working tree. Deployed as-is, every visitor's Claude call and every account call goes to their own loopback and fails. Confirm the production value (`https://draftline-api.ken-lince.workers.dev`, per `git diff`), and add a guard so this cannot ship: at minimum a check in whatever deploy step exists, or a Node one-liner test that fails on a loopback proxy URL.
- The `build` stamp is `20260904at` in `config.js` and on every `?v=` script tag in both HTML files. `checkForUpdate()` at `app.js:3986` compares the two. Verify a mismatch produces the reload banner and that the reload lands on a URL the cache has not seen. Verify a stale-HTML client with an old `players.js` still opens the board.
- The Worker's `ALLOWED_ORIGINS` includes `http://localhost:8123` in production. Note it as a finding and state the actual risk honestly: Origin is spoofable, so the allowlist is a courtesy check, and the real bounds are the model pin, the rate limit, and the daily stop.
- `wrangler.jsonc` binds `LIMITS` and `USERS`. Confirm both namespaces exist on the deployed Worker and that `ANTHROPIC_API_KEY` is set as a secret. Confirm the deployed Worker is the version with `/api/` routing, or say plainly that it is not deployed yet and that the accounts feature will 404 in production until it is.
- Do a full clean-browser run against the deployed site, not just local: sign up, open the board, run a practice draft to round 3, ask for a brief, reload, sign out, sign in on a second browser profile, confirm the draft came with the account.

### B. Engine math and strategy soundness

You are auditing `engine.js` as both an engineer and a drafter. For each item, say whether the math is right, and then say whether a sharp drafter would agree with what it does to the board.

**Scoring (`customPoints`).**
- Rebuild by hand the season score for one player per position under `kinda_highlanders` and compare to the engine to the point. Pick players with bonuses in play: a 4,500-yard passer, a 1,400-yard receiver, a tier-1 defense, a top kicker.
- The per-game yardage-bonus model uses a normal distribution around the per-game mean with `GAME_SD = { pass: 78, rush: 34, rec: 32 }`. Sanity-check those standard deviations against what you know of week-to-week variance for a starting QB, RB1 and WR1. Say whether the 150 and 200-yard bonus counts the model produces for the top ten at each position look like a real season.
- `gp` is 18 for every player. Check what `bake-players.py` does with Sleeper's games figure and whether an 18 is Sleeper's number or a default. The 2026 regular season length matters here: if it is 17 games, every per-game rate and every D/ST points-allowed total is scaled by 18/17. Then the second half: a player on IR with `gp: 18` is projected as if healthy. Decide whether the projection already prices the absence (Sleeper's season totals may) or whether the bake should discount games for IR, PUP and exempt-list designations it already reads from the players feed.
- D/ST is where the edge lives and where the model is thinnest: `PA_DIST` in the bake is five hand-calibrated seven-bucket distributions, one per researched tier. Recompute the implied season points-allowed score for each tier under both `kinda_highlanders` and `yahoo_default`, compare to the README's stated targets (tier 1 near 175, tier 3 near 123), and then answer the strategy question: does the board's placement of the top defenses (currently VOR around 60, board rank inside the top 15 overall) match what a strong drafter in this league would actually do at pick 11 and 14? A defense at pick 14 is the thesis; pressure-test the thesis.
- Return yards on D/ST are a flat 950 plus 40 per tier step. Say whether that is close enough at 20 yards per point, and what it does to the D/ST ordering.
- Kickers are modeled purely off positional rank. Confirm this cannot promote a kicker above the `kFloorRound` (rounds minus one, so round 14) in any state, and that the kicker floor does not prevent taking one in round 15 when it is the last empty slot.

**Replacement, VOR, marginal value (`replacementRanks`, `buildBoard`, `marginalVor`, `composite`).**
- `FLEX_SPLIT = { RB: 0.55, WR: 0.40, TE: 0.05 }` decides replacement rank. Argue for or against those weights in a full-PPR league with one flex, and show what the board's top 24 look like under a 0.45/0.50/0.05 split so the user can see the sensitivity.
- Walk `composite()` end to end for one player in three roster states: empty roster at pick 11, roster with two RBs at pick 62, roster with every starter filled at pick 131. Print every term (`value`, `marginal`, `vona`, `mult`, `ceilingAdj`, `riskAdj`, `byePenalty`, `tagPenalty`, `bonus`, `blocked`) and confirm each moves in the direction its comment claims.
- The bench weight formula: `benchWeight = (K or DEF ? 0.04 : min(0.45, 0.14 * lineupSpots)) * 0.55^benchDepth`. Check the depth arithmetic at the boundary (`need.have - lineupSpots + 1`) for a second QB, a third RB, a second TE, and confirm none of them is priced like a starter.
- VONA is clamped `max(0, min(value, value - max(0, later)))` and enters at `VONA_WEIGHT = 0.5`. Show that at a 3-pick gap VONA is near zero and at the 21-pick gap between picks 14 and 35 it materially reorders the top five. Then judge: at slot 11 in a 12-team snake the gaps are 3 then 21, alternately, all night. Is the board correctly aggressive at pick 14 (the long wait follows) and correctly patient at pick 11 (pick 14 is three away)?
- `depthCap`: QB hard-capped at 2, TE at roster+1, RB and WR at roster+4 when flex-eligible. In a 15-round league with 6 bench slots, confirm the caps cannot leave the user with an unfillable round (all positions blocked). Try to construct that state.
- Keeper handling: the keeper is removed from the pool before pick 1 (commit 32d3b0e). Confirm Drake Maye is off the board at pick 1, sits in the QB slot, counts against `depthCap` and `positionalNeed`, and that the pick schedule at slot 11 skips pick 59. Confirm undo cannot un-keep him.

**Survival and the modeled room (`survival`, `expectedBestAvailable`, `roomPick`, `runMock`).**
- `survival()` is a normal CDF on ADP with a per-player SD floored at 1.5. Check its calibration: for the picks the user actually has (11, 14, 35, 38, 62, 83, 86, 107, 110, 131, 134, 155, 158, 179), tabulate how many players the board calls "there" (over 70%) at the next pick, and compare to a simulated room's outcomes over 500 seeded `runMock` iterations. If the board's "there" list survives less than 70% of the time in its own simulator, the two are inconsistent and one is wrong.
- `roomPick()` opponents ignore `defFloorRound` and `kFloorRound`. Confirm opponents cannot draft a defense in round 2 or a kicker in round 6 in practice, and if the ADP draw allows it, decide whether that is a realistic room or a bug.
- The run detector (`detectRuns`: 4 of the last 8 at one position) adds 12% and pulls the room half an SD toward the position. Judge whether that magnitude matches how real rooms behave in a 12-team PPR draft, and whether the board should also see a run coming from the positional needs of the teams ahead (it already computes `teamsAhead()` for the brief but the composite does not use it).
- Simulate the whole draft from slot 11 under all nine styles, 200 iterations each, with the seed fixed. Report median lineup points, positional composition, and the three most common first-four-round shapes per style. Then say, as a drafter, which style you would run in this league on this data and why, and whether any style produces a roster you would refuse to field.
- `simulateToMyPick` has a guard of 120 iterations. Confirm that is never the binding constraint (the largest gap is 21 picks).

**Strategies (`strategies.js`).**
- Hero RB uses `earlyPosBias RB 0.78` with `earlyRounds 5`. From slot 11 the "one anchor back" has to be pick 11 or 14. Confirm the style actually produces one back in those two picks and not zero or two.
- Upside hunter and Floor first only move players who carry a `ceiling` or `risk` grade, which is 74 of 267. Show what fraction of the top 100 by composite have a grade, and state the consequence: those two styles are inert on most of the board. Propose the least invasive way to give every player a default grade (positional baseline, age, depth chart, injury designation, ADP standard deviation as a proxy for market uncertainty).
- `handcuffBonus` fires for any RB on the same team as an RB you own, including the starter's teammate who is a receiving back rather than the backup. The data has `depth` and `depthPos`. Propose using depth 2 at the same position as the actual handcuff test.
- `stackBonus` fires for any WR or TE on the QB's team. Fine, but check that it does not fire for the QB's fourth receiver at pick 155 in a way that beats a startable body.
- The knob sanitizer (`sanitizeKnobs`, `KNOB_SPEC`) is the only thing between a model-proposed JSON object and the engine. Fuzz it: nested objects, strings where numbers go, negative numbers, unknown positions, 50 keys, a `why` key with HTML in it. Confirm nothing escapes the bounds and nothing throws.

### C. Data and research fidelity

- Re-run `tools/bake-players.py` from the committed `players.json` and current Sleeper pulls and diff the result against `data/players.js`. Any player whose points change by more than five under `kinda_highlanders` is a finding: either news moved or the bake is unstable.
- Audit the name join. `audit.js` checks depth-chart position and team agreement. Extend the check to injury: every player carrying an `injury` field should have a `note` or a projection that reflects it. List every Questionable, IR, PUP and exempt player with their ADP and their board rank and say, for each, whether the board is pricing him right for a draft on 9/8.
- The three extreme ADP residuals the audit flags (Kincaid, Tyson, Ridley) each need a one-line explanation: news, a bad join, or a real market split.
- Check the 84 research notes for staleness. Sources are dated 7/29 through 9/4. Anything dated before 8/20 that concerns a role, an injury or a depth chart is suspect four days before the season. Flag the ones that matter for a top-100 player.
- The research board is 267 deep. A 12-team, 15-round draft takes 180 players, and the modeled room needs a pool beyond that. Check the tail: are there startable RB4s, WR5s and TE2s the room would actually take in rounds 13 to 15 that are missing, so the simulator drafts the wrong bodies late and inflates the user's late-round survival odds?
- `adp_sd` drives both survival and the simulator. Confirm it is FFC's real per-player spread and not a default for players outside FFC's coverage. Count how many players have a suspiciously round or identical SD.
- The Yahoo Draft Analysis paste is "ADP based on standard scoring settings". The app uses it for movement and for where the room actually takes people. Check that `marketAdp()` blends it with the PPR mock ADP in a way that does not import standard-scoring bias into a full-PPR survival estimate for pass-catching backs and slot receivers, which is exactly where the two ADPs diverge most.
- Verify the parser fixtures still match a Yahoo settings page copied today. Yahoo changes copy. If you can, capture a fresh paste of league #257015's settings page and the draft analysis pages and add them as fixtures.

### D. The AI layer

The Worker pins `claude-sonnet-5` and forwards `system`, `messages`, and a clamped `max_tokens` (default 2000, cap 8000). It sends no `thinking` parameter and no `output_config`. On Sonnet 5 that means adaptive thinking is on at default effort, and thinking tokens count against `max_tokens`, which is why the client retries once at double the budget when a response comes back with no text block. The client times out at 30 seconds. Pricing in `renderSpend()` is $2 in and $10 out per million for the proxy path and $1 and $5 for a user-supplied Haiku 4.5 key. Both match the current price table.

There are four prompts: `SYSTEM` plus `claudeContext()` for free-form questions, `briefQuestion()` for the on-deck brief, `REPORT_SYSTEM` and `REPORT_SOLO_SYSTEM` for the draft report, and `STYLE_SYSTEM` for turning a sentence into knobs.

**Correctness of what the model is told.**
- Build the exact `briefQuestion()` payload at five real states (pick 9 waiting for 11, on the clock at 11, pick 33 waiting for 35, on the clock at 62 with the keeper in place, pick 177 waiting for 179) and read them as a person. Every number in them must match what the board shows. Check especially: the two survival horizons, the "teams picking before you" needs, the marginal-value sentence, and the style-effect sentence.
- The brief hands the model 12 candidates filtered to `surv >= 0.25` while waiting. Confirm the filter cannot empty the list to under six in the late rounds (there is a fallback) and that a candidate the board has `blocked` never appears.
- `playerIn()` matches the first line of the answer against the board by substring, longest name wins. Break it: an answer whose first line is "Take Chase Brown over Ja'Marr Chase", a first line with a nickname, a first line with a trailing period, a player with an apostrophe or a suffix. Confirm the Draft button binds to the right player or to nobody, never to the wrong one.
- The stale-brief logic re-asks at most twice when the named player is taken, then shows the "went at pick N" banner. Reproduce all three states with the practice run and confirm the spend counter reflects the re-asks.
- The report prompt says "trust the grades, do not re-rank". Send a real completed practice draft and check the model obeys. Grades are a percentile of projected starter points, with A+ through D over 12 slots. Say whether a 12-team percentile grade is a fair report card or whether it should grade against a fixed scale.

**Quality of the advice.** Run at least 20 briefs across a practice draft under Balanced and 10 under Hero RB. For each, record: the board's number one, the brief's pick, the fallback, and whether the brief's argument was grounded in something the board could not see (a research note, a depth-chart fact, the needs of the teams ahead) or was a restatement of the composite. Tally how often the brief disagrees with the board and, when it does, whether you agree with it as a drafter. A brief that always agrees is not earning its cost. A brief that disagrees for reasons already in the composite is arguing with itself.

**Efficiency and resilience.**
- Measure per-call latency and token usage for the brief across those runs. Report the median and p95 latency against the 30-second client timeout and the two-minute clock. If p95 is above 12 seconds, that is `HIGH`: the brief is written up to two picks ahead, and at 30 seconds per pick in a fast room it will arrive after the pick.
- The Worker does not set `output_config.effort`. Test the brief at `effort: "low"` and `"medium"` server-side against the default, on the same 20 states, for latency, tokens and whether the advice degrades. Recommend a setting. This is the single largest efficiency lever available and it belongs in the Worker, not the client.
- Prompt caching: the system prompt is a few hundred tokens and the context changes every pick, so a cache breakpoint will not clear the minimum cacheable prefix on this model. Confirm that reasoning and say so, so nobody spends time on it.
- The empty-answer retry doubles `max_tokens` (2500 to 5000 for the brief). Confirm the retry cannot itself recurse and that a second empty answer surfaces a readable error, not a spinner.
- The 30-second abort: confirm the spinner clears, the "Ask again" button appears, and the board underneath is untouched.
- Kill the Worker and run a full practice draft. Every AI panel must degrade to a one-line message and the board must be indistinguishable from the AI-on state otherwise.
- Two devices on the same draft: confirm the brief cache is per-device (it is in-memory) and that the spend counter, which is in localStorage, does not double-count.
- Rate-limit realism: the limit is 90 per IP per minute and the draft party may put twelve people behind one NAT. Estimate worst-case calls per minute with auto-brief at lead 2 plus re-asks and say whether 90 is comfortably above it.

### E. The draft room, on the clock

Script these as a real night and run each one on a laptop at 1150 wide, an iPad in landscape, and an iPad in portrait. Use the in-app browser and take screenshots as evidence. Time every interaction that happens on the clock; anything over two taps or five seconds to record a pick is a finding.

1. **Cold start.** Fresh browser, deployed site. Create account, land on the board, League setup opens. Paste the settings fixture, confirm the parse summary matches the preset, save. Set pick clock to 90 seconds (Yahoo's default is 90 for this league; check the league page). Confirm the keeper shows in the roster and the schedule skips pick 59.
2. **The real thing.** Start a live draft. Record picks 1 through 10 by typing partial names and pressing Enter, credited to whoever is on the clock. Use "Didn't catch it" once. Confirm the ticker, status strip, on-deck list and pick clock agree with each other at every step. At pick 9 confirm the brief is written for pick 11 and names someone the board rates. On the clock at 11, draft from the brief's button. Confirm the roster, the "still need" counts and the bye line update together.
3. **Catch-up.** Close the tab at pick 20. Reopen. The draft should be where you left it. Now say the real draft is at pick 26: use catch-up to record six picks, including one unknown. Confirm the pick count lands on 26 and no player was double-recorded.
4. **Mistakes.** Undo a pick with Ctrl+Z and with the button. Re-credit a pick to another team with "move". Record a player to yourself by mistake and fix it. Confirm every fix leaves rosters, needs and the pool consistent.
5. **Pause and stop.** Pause the clock for two minutes, resume, confirm the remaining time is right. Stop the draft at pick 100, read the report, resume, finish.
6. **The long wait.** At pick 15 (right after pick 14), the next pick is 35. Confirm the board reads "there / maybe / gone" against pick 35, not "wait / risky / NOW", and that the header names pick 35. Simulate to 35. Confirm the brief was asked once, at lead 2, and not on every render.
7. **Late rounds.** From pick 131 on, every starter is filled. Confirm the board is recommending bench value and the last empty K and DEF slots with sensible urgency, that blocked players are not on the cards, and that the final two rounds do not present a board of nothing but negative numbers without explanation.
8. **Columns and filters.** Change columns, filter by position, search with a diacritic ("Dobbins", "Nacua", "St. Brown"), toggle "show taken", sort by every option. Confirm the sticky header, the row buttons, and the column picker fit at every width and that nothing needs a hover to be discovered on the iPad.
9. **Offline.** Turn off the network at pick 40. Record ten picks. Turn it back on. Confirm the sync status goes offline, then saved, and that the account has the ten picks.
10. **Two devices.** Draft five picks on device A, three different picks on device B without reloading A. Reload A. You must see the conflict banner with both device labels and both buttons, and choosing either must do exactly what it says. Then confirm the losing side's draft is really gone and the user was told so before it went.
11. **Reset.** Use "Start over" (armed button, two presses). Confirm keepers, names, style, columns and scoring survive and picks do not.
12. **Sign out and back in mid-draft.** The board must return with the draft intact.

Also check the things a reviewer forgets: the search field must not trigger a password manager or autofill on iPad Safari; Enter in the pick box must never submit a form; the More menu must not clip at 700 wide; focus must return to search after every pick; the status bar and the sync banner must not stack into three bars.

### E1. The iPad layout is broken today. Fix it first.

The user opened the deployed board on an iPad mini in Chrome, portrait, at pick 1, and it is unusable. They report landscape looks the same. Screenshot evidence, read left to right and top to bottom:

- The keyboard is up on page load with Chrome's autofill accessory bar (key, card, location) floating over the roster strip. Nobody tapped anything.
- Each player row is about 170px tall. The name and its four numbers are on one line and the three action buttons (`ERIC`, `who?`, `TO ME`) are stacked underneath in the first grid track, with `TO ME` wrapped onto two lines. Three players are visible on the whole screen.
- Names are truncated: "Jahmyr Gibbs ...", "Bijan Robinso...", "Christian McC...".
- The sort select is clipped to "Sort: suggestec".
- The position filter pills wrap to two rows.
- The legend under the filters says "or press Enter" and "Shift+Enter", which mean nothing on a touch device.
- The roster strip at the bottom is reduced to its own dropdown line and disappears under the keyboard.

This is the device the draft will be run from, so this is a `BLOCKER`, and it is the first thing you fix after workstream A. The root causes are all known. Confirm each against the code, then fix.

**Root causes.**

1. **Row actions have no grid track on touch.** `.rowacts` is an absolute-positioned hover overlay on desktop (`ff.css:332`), deliberately not given a column so the name keeps its width. The `hover: none` block (`ff.css:597`) makes it `position: static`, which turns it into a grid item, but the row template is generated by `renderColumnHeads()` (`app.js:2416`) as `[22px] minmax(0,1fr) + one track per chosen column`, written with `!important`, and it never adds a track for the actions. So the actions auto-place onto a second grid row inside the first track, three 40px buttons stack in a 22px or name-width cell, and the row doubles in height. This is the whole mess in the screenshot and it happens at every iPad width, landscape included, because it is a touch rule, not a width rule.
2. **Autofocus on boot.** `app.js:4125` calls `$("#search").focus()` unconditionally. On iOS that raises the keyboard and the browser's autofill bar before the user has done anything, and the `readonly` guard in `guardSearch()` (`app.js:3013`) removes itself on the focus event, so it does not prevent it.
3. **`100vh` shell.** `.app` is `height: 100vh` (`ff.css:171`). On iPad Safari and Chrome the visible area is shorter than `100vh` by the browser chrome, and shorter again by the keyboard, so the bottom of the column stack is unreachable.
4. **Name width.** At 744 CSS px portrait the board column is about 400px. Four data columns at 46 to 64px each, 8px gaps and 28px padding leave the name around 150px. Compact mode (`innerWidth < 1000`) drops only the 22px rank track.
5. **Sort select** has an inline `width:150px` in `app.html` and inherits the 16px touch font, so the longest option clips.
6. **Legend copy** (`app.js:1983`) is written for a keyboard.
7. **Filter pills** are nine pills at 13px with 8x13 padding under `hover: none`; they do not fit one row under 800px.
8. **Breakpoint.** The two-column layout kicks in under 1150px, so the mini in landscape (1133) and the 9th-gen iPad (1080) get two columns plus the roster strip at 46vh, even though three columns fit from 1040px. In landscape that strip takes half of a short screen.
9. **Detail card placement.** Tapping a row renders the player's detail card, which already carries "I drafted him" and "Someone else took him" buttons (`app.js:2827`), but `#detail` sits below the three recommendation cards in the middle column (`app.html:82`), so on an iPad the buttons land off-screen.

**The fix. Do this design, not a patch.**

On a touch device a row is one line and you act on a player by tapping him. That fixes the row height, the name width and the button wrap at once, and it reuses the detail card's existing actions instead of building a new control.

- Detect touch once at boot: `document.body.classList.toggle("touch", matchMedia("(hover: none) and (pointer: coarse)").matches)`. Every rule below keys on `body.touch`, not on width, and `renderColumnHeads()` reads the same flag so CSS and the generated template agree.
- On touch, `.rowacts` is `display: none`. No track, no overlay. Rows are a single line at a 48px minimum height with the name track taking whatever is left.
- On touch and compact together, cap the chosen columns at three, default `pts`, `tier`, `wait`, and say so in the column picker. Four stay allowed in landscape.
- On touch, `#detail` renders at the top of the middle column, above the brief and the recommendation cards, with a close control, a 44px `<team> took him` button, a `who?` button that opens the existing assign picker, and a `TO ME` / `DRAFT` button that follows `myTurn()` exactly as the row buttons do today. The selected row stays highlighted with `.sel` so the user can see which player the card is about. On desktop nothing moves.
- Keep the fast path: search, then the keyboard's Go key records to the team on the clock. Change `enterkeyhint` to `go` and confirm the iOS Go key fires the `Enter` handler. Shift+Enter has no touch equivalent; the `TO ME` path on touch is the detail card.
- Do not focus the search field at boot on touch. Keep the desktop autofocus and the `/` shortcut. Confirm the autofill bar no longer appears until the user taps the field, and that `data-1p-ignore`, `data-lpignore` and `autocomplete=off` still hold when they do.
- `.app { height: 100vh; height: 100dvh; }` and `.col { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }` so a column at its end does not rubber-band the page, and the last row is reachable with the toolbar visible.
- Move the three-column breakpoint to `max-width: 1039px` so every current iPad in landscape gets three columns and no roster strip. Under that, keep two columns and the roster strip, but drop the strip's cap to `38vh` in portrait so nine or more board rows stay visible.
- Sort select: remove the inline width, let it size to content, and drop the "Sort:" prefix from the option labels on touch.
- Legend on touch: "Tap a player to draft him or mark him taken. Search, then Go, records the top match to <team>."
- Pills on touch: one row, `flex-wrap: nowrap; overflow-x: auto`, counts kept, scrollbar hidden the way the appbar already does it.
- Nothing in the engine or in the recording logic changes. `record()`, `openAssign()` and the `.sel` state are the same functions with a different entry point.

**Fallback if the tap-to-act card slips.** The minimum that makes the board usable is a CSS-only change: on touch, `.rowacts { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 6px; }` with `white-space: nowrap` and 36px buttons. Rows become two clean lines at about 96px, which is five or six players on the mini. It is worse than the design above and better than what ships today. Do it first if you are unsure you can finish the card, then replace it.

**Size.** About sixty lines of CSS and forty of JavaScript across `renderColumnHeads`, `rowHtml`, `renderList`, `renderDetail`, the legend and the boot line, plus one attribute in `app.html`. No new components. Half a day of work, then the full E2 pass to prove it.

**Acceptance.** On an iPad mini in portrait, with no keyboard up, at least nine player rows are visible below the sticky head. The longest names on the board ("Marvin Harrison Jr.", "Amon-Ra St. Brown", "Kenneth Walker III") show unclipped with their team code. Recording any pick takes at most two taps from the board. Nothing is focused on load. In landscape the mini shows three columns. The E2 matrix passes on the real device, and the desktop layout is pixel-identical to today.

### E2. iPad certification

The draft will be run from an iPad. This workstream is a pass/fail certification of that device, separate from the flow tests in E, and it is not done until every cell in the matrix below is a pass with a screenshot behind it. "Works on my laptop" does not count.

**What the code promises.** Read `ff.css` before you start; the layout makes specific claims you are checking.

- `.app` is a flex column at `height: 100vh` with the three panels as independently scrolling `.col` containers. The page itself should never scroll; only the columns do.
- Three columns need 1040px (`minmax(420px) + minmax(320px) + 300px`). Landscape on every current iPad is 1080 or wider (9th gen 1080, mini 1133, 10th gen and Air 1180, Pro 11 1194, Pro 13 1376). At 1024 the grid overflows, so also test 1024 wide and decide whether that width still matters.
- Under 1150 wide (every iPad in portrait: 744 to 1032) the grid drops to two columns and the roster becomes a full-width strip underneath capped at 46vh. Under 700 it goes to one column with the board capped at 58vh.
- `body.compact` is set when `innerWidth < 1000`, which drops the rank column and changes the row template. So portrait is compact and landscape is not, and rotating the device crosses that line. A 150ms debounced resize handler re-renders the column heads and the list on rotate.
- `@media (hover: none)` moves the per-row action buttons from a hover overlay to a real always-visible column, raises tap targets to a 44px minimum, forces every input to 16px so iOS does not zoom on focus, and makes modals scroll inside themselves at 94vh with momentum scrolling.
- The appbar and status bar scroll horizontally inside themselves rather than letting the page scroll sideways.
- The search field is `type=search` with `autocomplete=off`, `data-1p-ignore`, `data-lpignore`, `enterkeyhint=done` and `inputmode=search` to keep iOS autofill and password managers off it.
- The team-assign popover and the style menu are `position: fixed` and clamp themselves to `innerWidth`.

**How to test it.** Two passes, and the second is the one that counts.

1. **Emulated pass, in the in-app browser.** Use the browser's resize tool at these exact viewports, both against the deployed site: 1180x820 and 820x1180 (iPad 10th gen and Air), 1194x834 and 834x1194 (Pro 11), 1133x744 and 744x1133 (mini), 1080x810 and 810x1080 (9th gen), and 1024x768 as the overflow probe. Note that the in-app browser only switches to a touch user agent below 768 wide, so `hover: none` styles will not apply at iPad widths there. Use it for layout, column math, scrolling containers and rotation. For touch behavior in emulation, use Chrome DevTools device mode through the Claude in Chrome tools with an iPad profile, which does emulate touch and `hover: none`.
2. **Real-device pass, on the actual iPad the user will draft from,** in Safari, against the deployed site, signed in to the real account. This is the gate. Every row in the matrix is re-run here. If you cannot drive the device yourself, write the matrix as a checklist the user runs in fifteen minutes and collect the results.

**The matrix.** Run every row in landscape and portrait, on the emulated set and on the real device. Record pass/fail per cell with a screenshot path.

| Area | Check |
|---|---|
| Shell | Nothing scrolls except the three columns and the modals. No horizontal page scroll at any width. The page does not bounce or reveal a gap when a column hits its end. With Safari's toolbar visible, the bottom of the roster column and the bottom of the board are reachable; `100vh` on iPad Safari is taller than the visible area, so check whether the last row hides behind the toolbar and whether `100dvh` is the fix. |
| Columns | Landscape shows three columns with the roster at 300px. Portrait shows two with the roster strip underneath, and that strip scrolls on its own within 46vh. At 1024 wide, say what overflows. The `.cols` grid never leaves a column narrower than its content. |
| Rotation | Rotate at pick 1, mid-draft, with a modal open, with the column picker open, and with the assign popover open. Column heads and rows re-render within a beat; the compact class flips; nothing is left positioned off screen; no popover or menu is stranded. |
| Board rows | Every row shows its position pill, name, the four chosen columns and the action buttons without truncation of the name at the widest common name in the data ("Marvin Harrison Jr.", "Amon-Ra St. Brown", "Kenneth Walker III"). Taken players render struck through and their buttons are gone. |
| Columns picker | "choose columns" opens a picker that fits on screen, every option's sentence is readable, toggling a column re-renders the heads and rows, and the choice survives reload. Test all thirteen columns on; the row must still fit or scroll inside the board, never widen the page. |
| Row buttons | The team-initials button and TO ME are visible without a hover, both at least 44px tall, and a tap lands on the intended row and not its neighbor. Test at the top of the list, at the bottom, and mid-scroll. "who?" opens the team picker within the viewport and closes on outside tap. "move" on a taken player does the same. On your own pick the single DRAFT button appears. |
| Search | Tapping the search field does not zoom the page, does not offer a saved password or email, and shows the keyboard with a Done key. Typing a partial name filters live. Enter records to the team on the clock. Focus returns to search after each pick. The keyboard does not cover the row you need to tap; if it does, say so. |
| Tracker | In the live tracker, the record box, "Didn't catch it", Pause, Stop, Simulate and Start over are all tappable at 44px, the on-deck list is readable, and the pick clock is legible from arm's length. The armed Start over turns red and disarms after four seconds. |
| Brief and cards | The on-deck brief renders in the middle column with its Draft, Fallback, Why? and Ask again buttons on one or two lines, never overflowing the card. The three target cards keep their three aligned numbers in a row at portrait width. |
| Roster panel | The team dropdown opens a native picker and switches rosters. The bye line and each row's counts fit. In portrait the roster strip is scrollable to the bench. |
| Rosters view | All twelve team cards render in a grid that reflows to two columns in portrait. Tapping a card title edits the name with the keyboard, Enter blurs and saves, and the name shows on the ticker immediately. |
| Modals | League setup, Draft style, Columns, Save/load, Claude, Report, Start/practice, Catch-up. Each opens within 94vh, scrolls to its own buttons in landscape (the short axis), closes with its own button, and does not leave the page scrolled underneath. The settings paste textarea accepts a paste from the Yahoo page in Safari and the parse summary appears. |
| Menus | More opens fully on screen at every width and does not clip at the right edge. The style list positions itself inside the viewport. Escape is not available on an iPad; every menu and popover must close on an outside tap. |
| Status bars | The status bar, the sync banner and the update banner can all be present; they stack without pushing the columns off screen, and each scrolls horizontally rather than wrapping into a wall. |
| Text and contrast | No text under 12px anywhere on screen during a draft. Mono numbers align. Teal-on-dark and amber-on-dark pass a contrast check at the iPad's default brightness in a lit room; say which do not. |
| Sleep and return | Lock the iPad for five minutes mid-draft, unlock. The clock resumes correctly, the page has not reloaded, and if it has, the draft is intact and the sync status is accurate. |
| Background tab | Switch to the Yahoo draft tab for two picks and come back. Safari may have suspended the page; the pick count and clock must be right, and if Safari reloaded it, the board returns to the same state. |
| Split View | Draftline in Split View beside the Yahoo draft client at 50/50 and at 30/70. Report which layout it lands in at each split and whether the pick can still be recorded in two taps. This is the realistic draft-night arrangement. |
| Performance | With all thirteen columns on and the taken players shown, scrolling the full 267-row board is smooth, and a pick records with no visible lag. Time `analyze()` plus render on the device; anything over 250ms on a pick is a finding. |

Anything that fails on the real device is `HIGH` at minimum. A failure in the row-button, search, or tracker rows is a `BLOCKER`, because those are the taps that happen on the clock.

### F. Accounts, sync and security

Read `accounts.js`, `auth.js` and `sync.js` together. Then:

- **Lockout on draft night.** Failed logins are counted per IP and per account name, 20 in 15 minutes. Anyone who knows the user's account name can send 20 wrong passwords at 18:50 and lock the user out until 19:05. Reproduce it against local wrangler. Propose the fix that keeps brute-force protection without a name-keyed lockout (per-IP only, or a name-keyed limit that slows rather than blocks, or exempting a valid password from the name counter). This is the one security finding with a direct draft-night consequence.
- Signup returns 409 "already taken", which confirms a name exists. Note it; decide whether it matters for a private board with a dozen users.
- Sessions are 90-day random tokens in KV, sent as Bearer, stored in localStorage. Logout deletes the KV key. Confirm a deleted or expired token produces the "signed in expired" banner with a working sign-in link and does not lose the local draft.
- `PUT /api/state` accepts any JSON up to 512 KB and stores it verbatim. Confirm the client validates on the way in (`looksLikeADraft`) so a poisoned state cannot crash the board on another device, and check what a `state` of `"<script>"` or a 500 KB string does end to end.
- `pagehide` flushes with `keepalive: true`. Browsers cap keepalive bodies at 64 KB. Measure the state size after a full draft with a Yahoo draft-analysis paste of 200 rows stored in `S.league.yahooAdp`. If it is near 64 KB the last save of the night silently fails.
- KV is eventually consistent. Two devices saving within a second of each other can both see `rev` unchanged. Reproduce with two curl loops against local wrangler and confirm the worst case is a conflict banner, not a silent overwrite.
- XSS: every `innerHTML` in `app.js` and `index.html` is supposed to pass user-controlled text through `esc()`. Grep every `innerHTML` and every attribute built from user data (team names, account name, pasted Yahoo text, Claude output, the `why` string from the style prompt) and confirm each is escaped or set via `textContent`. Try a team name of `"><img src=x onerror=alert(1)>` and a player search of the same.
- Rate limit and spend counters are read-modify-write on KV. Note the race and confirm the comment's claim that slippage is a few cents, not a runaway.
- The proxy forwards `payload.system` from the client, sliced to 12,000 characters. That means any visitor can run an arbitrary system prompt through the owner's key at Sonnet 5 prices, bounded only by the daily $50 stop. Say whether that is acceptable for a private board or whether the Worker should hold the four system prompts itself and accept only a prompt id from the client. Recommend, do not implement.
- Confirm the password never appears in a URL, a log line, `console.log`, or the Worker's observability output.

### G. Tests and tooling

- `app.js` is 4,091 lines with no tests. Identify the ten functions in it whose failure would change a pick or lose a draft (`analyze`, `record`, `undo`, `keeperAt`, `myPickNumbers`, `simulateToMyPick`, `gradeDraft`, `runMock`, `playerIn`, `briefStale`) and write a Node harness that exercises them against a fake DOM or by extracting the pure parts. Do not restructure `app.js` to do it; a thin shim that stubs `document` is fine.
- `sync.js` has no tests. Write the conflict matrix as a table (server empty / current / ahead / behind, local clean / dirty / absent) and a test per cell against a fake fetch.
- `test-accounts.sh` covers the API. Add the lockout case, the 64 KB state case, and the two-device race.
- Add a data-freshness assertion to `audit.js`: fail if `meta.built` is more than three days before the draft date in `meta.draft`.
- Add the loopback-proxy guard from workstream A as a test that runs with the others.
- Put all of it behind one command (`npm test` or a `tools/test-all.sh`) so the user can run everything the morning of the draft.

### H. What is not wired in yet

The user asked directly: what data or telemetry could be added that would raise the fidelity of the picks? Answer as a strategist, ranked by edge per hour of work, and be honest about what can be done before Monday versus what is next season's project. Consider at least:

- **Strength of schedule for weeks 15 to 17.** `playoffWeeks` is already parsed from the settings page and stored on the rules, and the engine ignores it. Opponent defensive rank by week for the playoff stretch is a real tiebreaker between two players the board rates equally, and D/ST playoff-week matchups matter more in this league than in most.
- **A real handcuff map** from the depth chart already in the data (depth 2, same team, same position), replacing the team-only heuristic.
- **Default ceiling and risk grades** for the 193 unannotated players, so Upside and Floor styles work on the whole board.
- **FantasyPros expert consensus rank with its per-expert spread.** A different signal from ADP: where analysts disagree is where the market is uncertain, and the spread is a better "reach or fell" input than one mock-draft SD.
- **Vegas implied team totals and win totals** as a season-level scoring environment prior, especially for the D/ST tier model, which is hand-calibrated today.
- **2025 target share, red-zone share, snap share** for the top 150 skill players, to separate volume that is projected from volume that was earned.
- **Injury return timelines**, not just designations: a `gp` discount for IR and PUP that is read from the news date rather than a flat 18.
- **Games-missed history and age** as inputs to the risk grade.
- **Rookie draft capital** as an input to the ceiling grade.
- **Yahoo ADP for full-PPR leagues** if there is a source for it; the current Yahoo paste is standard scoring.
- **Client telemetry, opt-in and local first:** log per brief the latency, tokens, stop reason, whether it agreed with the board, and what the user actually picked. After one draft that is the dataset that tells you whether the AI is earning its cost. Keep it in localStorage with an export button; do not ship it to the Worker without asking.
- **Post-draft outcome tracking:** a place to record weekly results so the projections and the D/ST thesis can be scored against reality after the season. This is next season's edge.

For each, say: the source, whether it is free, how it enters the bake or the engine, which term of `composite()` it changes, and what could go wrong.

### I. Why the board stacks a position you have already filled

**This is the highest-priority workstream after A and E1, and it outranks the rest of B.**
It was raised by the user from a live practice draft, not found by testing, which means
the existing suites do not cover it. Read this whole section before touching anything.

**What the user saw.** Two screenshots from a practice draft on the real league settings,
slot 11, Drake Maye kept at pick 59.

*Round 8, pick 86.* The roster reads QB 1/1 Drake Maye, RB 2/2 Derrick Henry and Saquon
Barkley, WR 1/2 Ladd McConkey, WR empty, TE 1/1 Sam LaPorta (199 pts, tier 1), FLEX 1/1
Breece Hall, K 0/1 empty, DEF 1/1 Houston. The board's top five by composite are: 1 TE
Harold Fannin Jr., 2 TE Tucker Kraft, 3 QB Trevor Lawrence, 4 RB Tony Pollard, 5 TE Dalton
Kincaid. The "Take one of these" card for Fannin says, in the app's own words, **"0 to your
lineup"** and **"can't crack your starting lineup — depth only"** — and ranks him number
one anyway. The brief picked Kraft and argued: *"Nothing on this list actually starts for
you — WR2 stays empty another round regardless, since even Reed grades VOR 0 and can't beat
replacement there."*

*Round 10, pick 110.* Same draft. The top twenty-four of the board is almost entirely tight
ends and quarterbacks — the two positions this roster has filled — while WR2 is still empty
and K is still 0/1. The brief recommended Kyler Murray as a second quarterback behind the
keeper, with Dalton Kincaid as the fallback.

The user's judgment, which is correct and is the standard this workstream is measured
against: *any drafter would question two tight ends inside two rounds of each other in the
first eight rounds, when a tier-1 tight end is already rostered.*

**The lead. Confirm or refute it first, before anything else in this section.**

`positionalNeed()` (`engine.js:531`) was deliberately fixed to ask the real lineup how many
flex slots are actually open, and the comment above it says why:

> Ask the actual assignment how many flex slots are still empty rather than subtracting
> surpluses position by position. The old arithmetic let three positions each claim the same
> flex slot that one running back was already sitting in.

`composite()` (`engine.js:582`) still does that old arithmetic:

```js
var lineupSpots = (ctx.rules.roster[player.pos] || 0) +
  (flexEl2.indexOf(player.pos) >= 0 ? (ctx.rules.roster.FLEX || 0) : 0);
```

It adds `roster.FLEX` for every flex-eligible position unconditionally and never asks
whether the flex is occupied. `openFlexSlots()` already exists, one function above, and is
exactly the call that is missing. On the round-8 roster above, where Breece Hall is *in* the
flex:

| term | today | with the flex counted as taken |
|---|---|---|
| `lineupSpots` (TE) | 2 | 1 |
| `benchDepth` = `have - lineupSpots + 1` | 0 | 1 |
| `Math.pow(0.55, benchDepth)` | 1.00 — no discount at all | 0.55 |
| `benchWeight` | 0.28 | 0.077 |

A second tight end keeps 28% of his open-market surplus with no depth discount whatsoever,
priced as the first body at a two-slot position. That is 3.6x too high, and it switches on
at exactly the moment the flex fills — which is why rounds 1 to 4 are, in the user's words,
"a no brainer" and everything after breaks down.

Do not assume this is the whole answer. It is one hypothesis with a clean mechanism. Prove
how much of the observed behavior it accounts for, in points of composite, and then keep
going: the ranking above is wrong by more than one term's worth, and there are at least
three other candidates below.

**What to do.**

1. **Reproduce the exact board first.** Rebuild both states — pick 86 and pick 110 with the
   rosters listed above, `kinda_highlanders`, Balanced, 12 teams, 15 rounds, slot 11, keeper
   Drake Maye — and print the top twenty-five by composite with every term of `composite()`
   broken out per player: `value`, `marginal`, `open`, `lineup`, `beyond`, `benchDepth`,
   `benchWeight`, `vona`, `mult`, `ceilingAdj`, `riskAdj`, `byePenalty`, `tagPenalty`,
   `blocked`. You must be able to point at the terms that put Fannin above every startable
   body before you propose anything. Save the table in the report.
2. **Then fix `lineupSpots` to use `openFlexSlots()`** and print the same table again. Report
   the new top twenty-five at both states and say plainly how much moved. This changes a
   formula, so per rule 3 it is written up with a proposed diff rather than committed — but
   it is small, it is the same call `positionalNeed()` already makes, and if it holds up it
   is the single recommendation to make first. Say so if it is.
3. **`benchDepth` at the boundary, again, with the flex correct.** Re-run the check that
   workstream B did (`B` found it correct) with `lineupSpots` fixed, because B checked the
   arithmetic against the *current* `lineupSpots` and would not have caught a wrong input to
   a right formula. Second QB, second TE, third RB, third WR, with the flex both open and
   filled. Four cases each.
4. **The empty-slot problem, which is the other half and may be larger.** WR2 was *empty*
   and the app still said no available receiver was worth anything — "even Reed grades VOR 0
   and can't beat replacement there", with Jayden Reed at 201 points sitting at board #12.
   Work out what `marginalVor()` returns for Reed into that empty WR2 slot and why it is
   near zero. The suspicion: `replacementPts` is a league-wide positional replacement level
   computed once by `replacementRanks()`, so in a deep full-PPR receiver pool the marginal
   value of filling an empty starting slot is measured against a body the user does not
   have and may never get. Filling an empty starter is not the same decision as adding a
   fourth one, and the arithmetic currently cannot tell them apart. Decide whether
   replacement for an *empty starting slot* should instead be the best body the model expects
   to be available at the user's next pick at that position — which is what `expectedBestAvailable()`
   already computes — rather than a static positional constant. Quantify both ways at pick 86.
5. **`FLEX_SPLIT` interacts with all of this.** `positionalNeed()` spreads the open flex
   across RB/WR/TE at 0.55/0.40/0.05. When the flex is *closed*, `flexOpen` is 0 and the
   split is moot; when it is open, TE claims 5% of it. Check whether `short` is doing
   anything useful for TE at all, and whether the 0.05 is why a tight end is never urgent
   when you need one and never discouraged when you do not.
6. **`depthCap` is the last line of defense and it is not holding.** TE is capped at
   roster+1 = 2, so a second tight end is never `blocked`. Given the tier cliff at tight end,
   ask whether the cap is the right instrument at all, or whether the real answer is that
   the *value* term should make a second TE uncompetitive so the cap never has to fire.
   A cap that is the only thing preventing a bad recommendation is a cap that will be wrong
   in the one state nobody tested.
7. **Then measure it across the whole draft, not just two states.** Simulate 200 seeded
   drafts from slot 11 under Balanced with the keeper, and for every one of the user's picks
   from round 5 to round 15 record: the position the board ranked first, whether that
   position had an empty starting slot, whether it was already full, and the `marginal` of
   the top-ranked player. Report the rate at which the board's number one is a position with
   no open starting slot while a starting slot elsewhere is empty. That number is the
   headline of this workstream. Do it before and after any fix you propose.
8. **Kickers and defenses.** K was 0/1 from round 8 through round 10 in the user's draft and
   never surfaced. `kFloorRound` is rounds-1 = 14, which is deliberate and probably right,
   but confirm the board says something useful about an empty K slot rather than nothing at
   all, and that the late rounds do not arrive with two empty slots and no warning.

**Severity.** A board that ranks a filled position first while a starting slot is empty is
`HIGH` at minimum and `BLOCKER` if it survives to a pick the user would actually make —
this is the number the app exists to produce, and the user has now seen it be wrong three
times in one practice draft. Treat the user's report as the reproduction; your job is the
mechanism.

### I2. What the AI is told, and what it should be told instead

The brief at pick 86 was not stupid — it reasoned correctly from a board that was already
wrong, and then said so out loud: *"Nothing on this list actually starts for you."* That is
the model doing its job with bad inputs. Fixing I will fix most of this. But the user has
asked a second, separate question that stands on its own, and it is a design question rather
than a defect:

> The AI logic needs to focus on the player's current roster, strength at position, open
> positions, what they need at each position — and give an overall "this is where we're at,
> this is what we need, here are general suggestions for the next round", and then the
> "take one of these" cards carry the specific picks and the why.

And the constraint the user correctly identified:

> We can't ship the entire draft and everyone that's been picked on every single AI call.

**What to work out.**

- **Read `briefQuestion()` and `claudeContext()` and write down exactly what the model gets
  about the user's own roster today.** Not what you assume — the literal payload, printed, at
  the pick-86 state above. The user's diagnosis is that roster state is thin or absent
  relative to the candidate list. Confirm or refute it with the printed payload. Workstream D
  is auditing whether the numbers in that payload are *correct*; this is a different
  question — whether the right *things* are in it at all.
- **Design the roster-state block.** Per position: how many starting slots, how many filled,
  the points of the body currently in each slot, the drop from that body to the best
  available at that position, whether the flex is open and who is in it, the bye collisions,
  and the count of picks remaining. That is roughly twenty numbers and it is the cheapest
  useful context in the whole payload — far cheaper than the twelve candidate blocks already
  being sent. Cost it in tokens.
- **Answer the user's constraint properly.** They are right that the whole draft cannot go in
  every call. Work out what actually has to: the user's own roster (small, changes by one
  row per pick), the positional supply left (a count and a tier-cliff distance per position,
  not a list), what the teams between now and the user's next pick need (`teamsAhead()`
  already computes this and the composite ignores it), and the candidate list. Everything
  else — the 180 picks, the other eleven rosters in full — is summarizable to a few numbers.
  Propose the payload, in full, with a token count, and show it at the pick-86 and pick-110
  states so it can be read as a person would read it.
- **Split the ask.** The user wants two different things from the model and today they are
  one prompt: a *situation read* ("this is where we're at, this is what we need, this is what
  the next two rounds have to accomplish") and a *pick* ("take him, here is why, here is the
  fallback"). Propose how to get both without doubling the calls or the latency — the same
  answer in two labeled parts is the obvious candidate, but say whether the situation read
  should be cached across picks between the user's turns, since it changes far more slowly
  than the candidate list.
- **Ground the "why".** The user's standard is "reliable, accurate predictions based on facts
  we know — not guesses." Enumerate what the app actually knows that the model could cite: the
  scoring engine's own points, the tier and how many are left in it, survival probability to
  the next pick, the research note and its date, the depth-chart slot, the injury designation,
  the bye collisions, what the teams ahead need. Then state the rule the prompt should carry:
  every claim in the brief must trace to one of those, and a claim that cannot is not made.
  Propose the prompt language for it.
- **Do not implement any of this.** Propose it, in full, with the diff and the payloads, and
  stop. This changes what the model is told, which rule 3 reserves for the user.

**One thing to be careful about.** Do not fix the brief by teaching the prompt to work around
a broken board. If the composite ranks a second tight end first, the answer is workstream I,
not a sentence in the system prompt telling the model to distrust the ranking. Say so if you
find yourself drafting that sentence.

### I3. When the AI call happens — decided

This was an open question the user asked to have settled. It is settled here, and the
answer is binding on any implementation of I2's payload redesign. Two workstreams reached
it independently; the reasoning is recorded so nobody relitigates it.

**The schedule decides it.** At slot 11 in a 12-team snake the gaps alternate all night:

```
11 → 14   gap 3        86  → 107  gap 21
14 → 35   gap 21       107 → 110  gap 3
35 → 38   gap 3        110 → 131  gap 21
38 → 59   gap 21  (keeper)   131 → 134  gap 3
59 → 62   gap 3        134 → 155  gap 21
62 → 83   gap 21       155 → 158  gap 3
83 → 86   gap 3        158 → 179  gap 21
```

Seven short gaps of 3 and seven long gaps of 21. **On the seven short gaps, "right after we
pick" and "at lead 2" are the same moment** — pick 83 to pick 86 is three picks, so a lead of
2 fires one pick after the user's own. The question therefore only bites on the long gaps,
and there it answers itself: a name chosen 21 picks early is a guess. `survival()` at 21 picks
carries the full width of the ADP distribution, and workstream B measured `survival()` and
`roomPick()` disagreeing by up to 58 points on individual players, with wide-SD players coming
off the board 9.7 picks early in the simulator. Two picks out, roughly two players come off
and the answer is nearly certain.

**The decision.**

1. **The pick call stays at lead 2.** It is the earliest moment the answer is reliable and the
   latest moment it is still on screen before the clock starts. Do not move it to the user's
   own pick, and do not defer it to gap 0.
2. **Do not add a second call on the short gaps.** Two calls inside a 3-pick turn collide
   inside 90 seconds of real time and the second arrives after the clock has started.
3. **The real defect is not when the call happens — it is that it never happens again.**
   `renderBrief()` caches by `A.myNext` and reuses that text at gap 2, 1 and 0, and
   `briefStale()` re-asks on exactly one condition: the named player is taken. A brief
   therefore survives its own fallback being drafted, a positional run starting, and a
   startable body falling to the user. Replace `briefStale()` with a `briefVoid()` that runs
   four local tests — named player gone, fallback gone, a player now ranks #1 who was not in
   the candidate list, a run detected at a position the brief argued about — and re-asks only
   when one fires. This is deterministic, costs nothing, and needs no API call to evaluate.
4. **Allow at most one re-ask, and only on the gaps of 8 or more.** On a 3-pick gap there is
   no time for it and nothing material changes in three picks.
5. **The situation read is cached, not a second call.** Cache it on a fingerprint of the
   roster so it is rewritten only when the roster changes — which is once per turn by
   construction — and reuse it across the re-ask. Measured at +25 input tokens and −55 output
   tokens on every re-ask.
6. **Never block the Draft button on a pending re-ask.** The existing brief stays on screen
   and is replaced in place when the new one lands. A spinner where a recommendation was is
   worse than a recommendation two picks old.

State in the report what this does to worst-case calls per minute against the Worker's 90-per-IP
limit, and confirm it stays inside the client's 30-second timeout on the 3-pick turns.

### J. The night itself: making the app cheap to operate while drafting

Raised by the user, and it is a workstream rather than a polish pass because of one number:
**the user has 15 picks and has to record 180.** Their own picks are two taps after E1. The
other 165 are typed by hand, one at a time, on a clock, while watching the Yahoo client on the
same screen. That asymmetry is where draft night actually gets expensive, and almost nothing
has been spent on it.

Everything below reuses math the app already computes. Nothing here needs new data.

**J1. Predicted pick tap targets. The largest single reduction in work on the night.**

`roomPick()` already models what the team on the clock will take — it is the engine that runs
the whole practice draft. It is not surfaced anywhere in the live tracker. Surface it: with a
team on the clock, show its most likely picks as buttons above the record box, so recording an
opponent's pick becomes one tap instead of a typed name. When the prediction misses, the user
types as they do today; nothing is lost.

- **Measure the hit rate before building the UI, and let the number decide the design.** Over
  200 seeded drafts, for every opponent pick, report how often the actual pick is `roomPick`'s
  first choice, and how often it is in the top 3 and the top 5. Break it down by round, because
  round 2 and round 13 will not behave alike. If the top-5 rate is below about 50% the feature
  is still worth building — half of 165 picks is 80 fewer names typed — but the presentation
  has to be honest about being a guess.
- **The risk is the whole design problem, and it is worse than the reward.** A tapped wrong
  name is a silently wrong board: the pool, every survival number, the roster of the team it was
  credited to, and every subsequent recommendation are all wrong, and nothing on screen says so.
  Typing a name is slow and self-checking; tapping a plausible name is fast and is not. So the
  buttons must show enough to confirm identity at a glance — name, position, team — must never
  be positioned where the thumb lands by default, and must read as predictions rather than
  facts. Propose the treatment. Say plainly whether you would ship it at the hit rate you measured.
- Order the buttons by `roomPick` probability, not by board rank: this is a prediction about
  what *they* will do, not about who is best, and the two differ most exactly where the user
  most needs help.
- The "Didn't catch it" and `move` paths already exist and are the recovery. Confirm a wrong
  tap is recoverable in one action and that undo restores the pool exactly.

**J2. Say what the user still needs, in words, where they are already looking.**

`positionalNeed()` computes it every render and the status strip does not print it. In the
user's round-8 screenshot the answer was "WR2 and K" and no line on screen said so — it had to
be read off the roster panel slot by slot. One line, always visible: what is still empty, and
how many picks are left to fill it. This is the question the user asks themselves before every
single pick, and the app knows the answer and does not say it.

**J3. Say what the brief is, and how old it is.**

The brief header reads `CLAUDE · ON THE CLOCK AT PICK 86`. It should say which pick it was
written for and how many picks have gone since, so a two-pick-old plan does not read as a fresh
decision. This matters most until I3's `briefVoid()` lands and matters somewhat after.

**J4. Batch-record from the Yahoo draft results panel.**

Yahoo's own draft board is on the screen beside this app all night. The catch-up flow exists,
and `draftanalysis.js` already parses a Yahoo paste. Investigate whether the live results panel
can be pasted to reconcile several picks at once after the user looks away. Verify against a real
Yahoo page before proposing anything — this one is speculative in a way J1 to J3 are not, and if
the page cannot be usefully copied on an iPad, say so and drop it.

**Constraints on all of J.** Screen space in portrait is already the binding constraint after
E1 — the board must keep nine rows visible under the sticky head, which is the E1 acceptance
criterion, so anything added to the tracker column has to earn its height. Check every proposal
at 744x1133 and 1133x744 before recommending it. Time every interaction that happens on the
clock; the brief's standard is two taps and five seconds to record a pick, and J1 exists to
beat it, not to match it.

---

## 4. Deliverables

1. **A findings report** at `ff/tools/qa-report-2026-09-0X.md`, ordered by severity, each finding with: id, severity, workstream, one-sentence defect, reproduction, evidence (command output or screenshot path), proposed fix or the commit that fixed it. Strategy opinions in their own section at the end. Things checked and found sound are listed too, briefly, so the user knows what was covered and does not re-check it.
2. **Commits** for every small fix, one per finding, tests included, all suites green, on the current branch. Do not touch `config.js` except to restore the production proxy URL if the user confirms that is the intent.
3. **Proposed diffs** for anything larger, inline in the report, not applied.
4. **A draft-day runbook**, one page, at `ff/tools/draft-day.md`: what to run the morning of 9/8 (re-bake the data, run all tests, confirm the deployed build stamp, confirm the Worker answers, confirm the account signs in from the iPad), what to do if the Worker is down during the draft, what to do if the board falls out of step with Yahoo, what to do if two devices conflict, and the one-line fallback if the app dies entirely (the board sorted by "your points" is a printable ranking; print it).
5. **The fidelity ranking** from workstream H, as its own section of the report, with a clear line between "before Monday" and "after the season".
6. **The iPad fix** from workstream E1, as its own short commit series (touch detection and row rule, detail card placement, breakpoint and shell height, copy and controls), each commit green on every suite, with before and after screenshots at 744x1133 and 1133x744 in the report.
7. **The iPad matrix** from workstream E2, filled in per cell for landscape and portrait, emulated and real device, with screenshot paths, as its own section of the report. If the real-device pass could not be run, the section says so and ships the fifteen-minute checklist for the user to run instead.

8. **The suggestion-quality report** from workstream I, as its own section: the two term-by-term board tables at pick 86 and pick 110 before and after any fix, the whole-draft rate at which the board's number one is a position with no open starting slot, and the proposed diff. The workstream I2 payload redesign follows it, with the full proposed payload printed at both states and its token count.

9. **The draft-night operating report** from workstream J: the measured `roomPick` top-1/top-3/top-5 hit rate by round, a recommendation on whether to ship the predicted tap targets at that hit rate, and the proposed treatment for J1 to J4 checked at both iPad viewports. Section I3 is already decided and is a constraint on this work, not an open question.

End with a single paragraph, in plain words, answering the user's actual question: on draft night, does this hold up, and what are the two or three things they should do between now and then.
