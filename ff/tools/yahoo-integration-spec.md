# Yahoo league sync + week-to-week — build spec

Status: design only. Nothing here is built.
Written 2026-09-06. Draft is 2026-09-08 19:00 CDT — **none of this ships before it.**

This document is self-contained so it can be handed to a fresh session. It
assumes the reader knows nothing about the repo beyond what §1 says.

---

## 1. Where this plugs in

Draftline is a static page (GitHub Pages) plus one Cloudflare Worker.

| Piece | What it already does | What this spec adds |
|---|---|---|
| `worker/src/index.js` | Claude proxy — pinned model, origin allowlist, per-IP rate limit, daily spend ceiling | Yahoo OAuth routes, Yahoo read proxy, response normalizer |
| `worker/src/accounts.js` | Accounts, sessions, saved draft state in `USERS` KV | Yahoo tokens filed per account |
| `assets/sync.js` | Pushes/pulls the saved draft so it follows the account | Untouched — a different sync entirely, do not confuse them |
| `assets/parser.js` | Parses a pasted Yahoo settings page into the §2.1 rules object | Gains an API-fed sibling that emits the **same object** |
| `tools/crosswalk.json` | `name|POS` → `sleeper_id`, **`yahoo_id`**, `espn_id`, `gsis_id`, `pfr_id` | The join key for every Yahoo player |
| `tools/sig_sources.py` | 8 signal loaders (ECR, ESPN injury, usage, Vegas, draft capital, velocity) | Weekly variants — see §9 |

Two facts that make this cheap:

1. **The player-identity problem is already solved.** Yahoo returns
   `player_key` = `<game>.p.<id>`; the numeric half is exactly `yahoo_id` in
   `crosswalk.json`. No fuzzy name matching anywhere in this integration.
2. **There is already a server with secrets.** Yahoo's API sends no CORS
   headers, so the browser cannot call it. The Worker is the proxy, and it
   already holds a secret and enforces an origin allowlist.

**Hard constraint on Phase B:** the API settings importer must emit the *same*
rules object `parser.js` emits. That keeps `engine.js`, `strategies.js`,
`presets.js` and the whole board untouched. Violating this turns a 2-day job
into a 2-week one.

---

## 2. Confidence legend

Research on 2026-09-06 against Yahoo's docs and community sources. Every claim
below carries one of:

- **[DOC]** — officially documented
- **[COMM]** — community-reported, consistent across sources
- **[UNC]** — uncertain, conflicting, or unverified

**Anything marked [UNC] that a phase depends on is listed in §3. Do not write
code against an [UNC] claim before spiking it.**

---

## 3. Spike list — do these first, in this order

Each is small. Together they decide whether the phases below are buildable as
written.

| # | Question | Blocks | How |
|---|---|---|---|
| ~~1~~ | ~~Does the app have Fantasy scope?~~ | — | **ANSWERED 2026-09-06 — NO. See §4a. This blocks every other spike.** |
| 2 | **Is `stat_modifiers` present in your league's `settings`?** | Phase B | One GET. Dump and grep. Without it you cannot recompute fantasy points and Phase B is dead. |
| 3 | **Live-draft latency.** | Phase C | Join a Yahoo mock, poll `draftresults` every 2s, log pick→visible lag and whether `draft_status` reads `drafting`. |
| 4 | **Is `faab_balance` on the team object?** | Phase E waivers | One GET against a FAAB league. |
| 5 | **Confirm player projections are absent.** | Phase E, §9 | Dump `players;status=A` and `player/<key>/stats`, grep for anything projection-shaped. |
| 6 | **The 2026 NFL `game_key`.** | Everything | `GET /game/nfl` |
| 7 | **Does API access require review approval?** | Everything | See §4. Ken registered an app on 2026-09-06 — try spike 1 and find out. |

---

## 4a. MEASURED 2026-09-06 — the app has no Fantasy entitlement

This is no longer a risk. It is the current state, established by probe
(`tools/yahoo-probe.py`) against a real app registered the same day.

**Nothing in this spec is buildable until Yahoo grants Fantasy API access.**

What was measured, and what each result means:

| Sent to `request_auth` | Result | Reading |
|---|---|---|
| no `scope` param | 302 to login; consent completes; tokens issue **normally** | Yahoo will happily give you a working OAuth token with no Fantasy entitlement on it |
| that token → `GET /game/nfl` | `401 oauth_problem="additional_authorization_required"` | The token is valid. It just cannot see Fantasy |
| `scope=fspt-r` | **302 with `error=invalid_scope`, before login** | The app is not permitted to *request* Fantasy scope |
| `fspt-w`, `openid fspt-r`, `sdps-r`, `fantasy-r` | same `invalid_scope` | Not a wrong-string problem |

Three conclusions that change how Phase A is written:

1. **The app-creation form's missing Fantasy Sports checkbox is not benign.**
   It is gone because self-service Fantasy access is gone. Registering an app
   grants OAuth; it does not grant Fantasy. Access comes only from the review at
   `https://sports.yahoo.com/developer/access/`.

2. **Yahoo's docs are wrong about `scope`, and the community is right —
   but only conditionally.** The OAuth guide does not list `scope` as an
   authorize parameter and implies app registration carries the permission. In
   fact an entitled app must send `fspt-r`, and an unentitled one is rejected for
   asking. Send `fspt-r`. **[MEASURED]**

3. **Failure is silent until first use, and Phase A must not trust the token
   exchange.** With no scope you get a clean redirect, a valid access token, a
   valid refresh token, and no error of any kind. Nothing goes wrong until an API
   call. **The connect flow must make one probe call — `GET /game/nfl` — and
   report "connected" only if that succeeds.** A green state earned by a
   successful token exchange is a lie, and it is the exact bug this would ship
   with if nobody had measured it.

### What unblocks this

Submit the access application at `https://sports.yahoo.com/developer/access/`,
referencing the existing Client ID. The form asks for a product description,
what data is needed, whether use is personal/single-league, and expected users in
3-6 months. **[DOC]** Yahoo warns that "incomplete or insufficiently detailed
submissions cannot be evaluated and will be closed without further
correspondence" — so answer it properly the first time.

**[UNC]** Review turnaround is unknown and on Yahoo's clock. Treat every phase
below as parked until it clears. Re-run `python tools/yahoo-probe.py url` with
`$env:YAHOO_SCOPE="fspt-r"` to test — the moment `invalid_scope` stops coming
back, access has been granted.

---

## 4. Access gate — a schedule risk, not a detail

**[DOC]** `developer.yahoo.com/fantasysports/guide/` now 308-redirects to
`sports.yahoo.com/developer`. There is an **application and manual review**
at `sports.yahoo.com/developer/access/`, and Yahoo states the API is
**read-only — "write access is not available at this time."**

Consequences:

- **Read-only is fine.** This spec never writes to Yahoo. The app tells you what
  to do; you do it in Yahoo. Design around this permanently — do not build a
  "claim this waiver" button, it cannot work.
- **[UNC]** Whether a newly created app gets Fantasy scope without approval, and
  how long review takes. This is spike 1 and it gates the schedule. If review is
  required, submit the application immediately — the answer arrives on Yahoo's
  clock, not ours. The form asks whether use is personal/single-league; answer
  honestly, it is.
- **[DOC] Attribution is mandatory.** The UI must display **"Fantasy data
  provided by Yahoo Fantasy"** with the official logo, unaltered — no recoloring,
  no combining with other brands. Put it in the sync panel and the league-setup
  modal. This is a launch blocker, not a nicety.
- **[UNC]** The terms forbid "separating its underlying data," which reads as a
  constraint on extracting Yahoo data into a standalone dataset. Caching to
  survive rate limits is operationally necessary; warehousing Yahoo data is not.
  Cache with TTLs, do not build a Yahoo data lake.

---

## 5. Two corrections to earlier assumptions

Both were stated in conversation before this research. Both were wrong.

1. **"FantasyPros used a browser extension because the Yahoo API lagged during
   drafts."** Backwards. **[COMM]** FantasyPros started *with* Yahoo's public API
   and moved to an extension to cover **ESPN**, which had no public API, and to
   avoid OAuth. This is a mild *positive* signal for the API path.

2. **"`draftresults` may only populate after the draft completes."** **[COMM]**
   It updates live. The `yahoo_fantasy_api` maintainer documents that
   `draft_results()` "if called during the draft… includes the players that have
   been drafted thus far," and distinguishes completed picks from an in-flight
   auction nomination — a level of detail that only comes from observation.
   Pre-draft it returns an empty list, not an error.

   **But [UNC]: nobody has published latency numbers.** Spike 3 is still
   mandatory. "It updates" and "it updates fast enough to draft against" are
   different claims.

---

## 6. Phase A — OAuth (foundation, no product value on its own)

### Endpoints **[DOC]**

```
GET  https://api.login.yahoo.com/oauth2/request_auth
       ?client_id=<id>&redirect_uri=<exact>&response_type=code&state=<opaque>
POST https://api.login.yahoo.com/oauth2/get_token
       Authorization: Basic base64(client_id:client_secret)
       grant_type=authorization_code&code=<code>&redirect_uri=<exact>
POST https://api.login.yahoo.com/oauth2/get_token
       grant_type=refresh_token&refresh_token=<t>&redirect_uri=<exact>
```

- **Access token: 1 hour [DOC].** Refresh proactively at ~55 min.
- **Refresh token: long-lived [DOC]**, survives a password change. **[COMM]** can
  still be invalidated by user revocation. Re-auth is a normal handled path, not
  an exception — build the "reconnect Yahoo" button in Phase A, not later.
- **`redirect_uri` is required on refresh too.** Omitting it is the single most
  common integration bug. **[DOC]**
- Registered callback: `https://draftline-api.ken-lince.workers.dev/api/yahoo/callback`.
  Must match **byte-for-byte**, including no trailing slash.
- **[COMM]** `http://localhost` is not reliably accepted. Local dev uses
  `redirect_uri=oob` (Yahoo displays the code for manual paste) or tests against
  the deployed Worker. Do not plan on a localhost callback.

### Worker routes

```
GET  /api/yahoo/start      -> 302 to request_auth; mints `state`, stores it 10 min in LIMITS
GET  /api/yahoo/callback   -> validates state, exchanges code, stores tokens, 302 back to the app
POST /api/yahoo/disconnect -> deletes the token record
GET  /api/yahoo/status     -> { connected, leagues?, lastSync, expiresAt }
GET  /api/yahoo/proxy?path=<url-encoded fantasy path>
```

### Token storage

`USERS` KV, key `yahoo:<userId>`:

```json
{ "access": "...", "refresh": "...", "expiresAt": 1788731021,
  "guid": "...", "leagueKey": "461.l.1000", "connectedAt": 1788731021 }
```

Filed under the **Draftline account id**, so Yahoo access follows the account
across devices exactly as the saved draft already does.

### Security rules — non-negotiable

- **The refresh token never reaches the browser.** Ever. The client calls
  `/api/yahoo/proxy`; the Worker attaches the bearer.
- **`/api/yahoo/proxy` allowlists paths by regex.** It is not an open proxy. Only
  `league/`, `team/`, `game/`, `player/`, `users;use_login=1` prefixes, and only
  GET. An open proxy carrying a user's Yahoo credential is the worst possible
  bug in this codebase.
- **`state` is validated.** No state, no token exchange.
- Existing origin allowlist and per-IP rate limit apply unchanged.

### Acceptance

Connect → consent → redirected back with `connected: true`; a token refresh at
the hour boundary is invisible; disconnect revokes locally and the app falls back
to manual with no data loss.

---

## 7. Phase B — settings import (highest value per unit of risk)

Runs **before** the draft, so nothing is time-critical and a failure costs
nothing but a fallback to the paste flow. Ship this even if Phase C never does.

### Calls

```
GET /users;use_login=1/games;game_keys=<gameKey>/leagues?format=json   # discovery
GET /league/<key>/settings?format=json
GET /league/<key>/teams?format=json
GET /game/<gameKey>/stat_categories?format=json
GET /league/<key>/players;status=A/draft_analysis?format=json          # Yahoo ADP, free
```

### What comes back **[DOC]**

- `scoring_type` — `head` / `headpoint` / `roto` / `point`
- `stat_categories.stats[]` — `stat_id`, `enabled`, `name`, `display_name`,
  `position_type`
- **`stat_modifiers.stats[]`** — `{stat_id, value}`. **[UNC] — spike 2.** This is
  the actual scoring. Without it, Phase B cannot produce a rules object.
- `roster_positions[]` — `position`, `position_type`, `count`
- `waiver_type`, `waiver_rule`, **`uses_faab`**
- `playoff_start_week`, `num_playoff_teams`
- `draft_type`, `is_auction_draft`, `draft_time`
- **Keeper settings: [UNC]** — not in the verified sample. Player-level
  `is_keeper` exists **[COMM]**. Do not promise keeper import without a spike.

### Why this beats the paste parser

`parser.js` carries 112 assertions against three documented traps in Yahoo's
*rendered HTML*: settings changed from default render as three lines, the same
label means different things in different sections, and labels contain numbers.
The API returns **stable integer `stat_id`s with numeric modifiers**. All three
traps stop existing, and a Yahoo page redesign stops being able to break scoring.

**But [UNC]:** `stat_id` stability across seasons is not guaranteed. **Fetch
`stat_categories` per `game_key` and cache it keyed by `game_key`. Never
hardcode the map.**

### Output contract

A rules object **byte-identical in shape** to `parser.js` output. Add one field:
`source: "yahoo-api" | "paste"`, surfaced in League setup so it is always visible
which produced the current rules. Both paths keep working; the paste flow is the
fallback and the non-Yahoo story.

### Acceptance

Import against Ken's real league, then diff the emitted rules object against the
one produced by pasting the same league's settings page. **They must match.**
Any difference is a bug in one of the two and must be resolved before Phase C.

---

## 8. Phase C — live draft sync, and how the draft UI changes

Gated on spike 3. If latency is bad, ship A + B and stop.

### The call

```
GET /league/<key>/draftresults?format=json
```

**[DOC]** Per pick: `pick`, `round`, `team_key`, `player_key`, `cost` (auction).
**Nothing else** — no name, no position. Resolve `player_key` → `yahoo_id` →
`crosswalk.json` → board player. **Pre-fetch the player universe before the
draft; never resolve names mid-draft.**

### What the API does not give you **[COMM/UNC]**

- **No `current_pick`, no `on_the_clock`, no clock.** Infer next pick as
  `max(pick) + 1`. The app already decided it has no pick clock and documented
  why — that decision stands and this changes nothing.
- **No push.** **[DOC]** REST GET only. Polling is the only route.
- **Auction: the nominated player is invisible until the bid closes [COMM].** An
  auction draft is materially weaker on this API. Ken's league is snake; note the
  limitation and move on.

### Reconciliation — the hard part, and where the bugs live

`pick` is a natural key: an integer, unique, assigned by Yahoo. Reconcile on it
and the whole class of double-application bugs disappears.

On every poll, for each Yahoo pick `p`:

| Local state at `p.pick` | Action |
|---|---|
| nothing | append the pick |
| `unknown: true` | fill it — `name`, `unknown: false`. Exactly what `fillUnknown()` already does |
| same name | no-op |
| **different name** | **Yahoo wins.** Overwrite, and tell the user in the banner: "Yahoo says pick 34 was X, not Y — corrected." |

Rules:

- **Never delete a Yahoo-confirmed pick.** Local-only picks beyond Yahoo's
  high-water mark are kept — they are picks you recorded that Yahoo has not
  published yet.
- **Apply in ascending pick order.** Same reason the catch-up sheet does.
- **Every correction is visible.** A sync that silently rewrites the board is
  worse than no sync, because you trust it. Silent disagreement is the failure
  mode that makes this feature net-negative.
- Reuse `record()` and `fillUnknown()`. Do not write a second write path into
  `S.picks`.

### The draft UI when sync is on

The current live-draft box has four bands: **Head** (where you are), **Do** (one
next action), **Order** (picks either side of now), **Keep** (step-away). Sync
changes two of them.

**Do — the manual-entry instruction is replaced, not removed.**

| Sync state | "Do" band shows |
|---|---|
| healthy, not your turn | *"Synced. Pick 34 — Team 7 took Player X, 6s ago."* No button. Nothing to do. |
| healthy, your turn | *"You're on the clock."* The board's recommendation and the Draft buttons stay exactly as they are — **the app never picks for you and cannot, the API is read-only.** |
| stalled < 60s | *"Synced — waiting on Yahoo (18s)."* Still no action. |
| stalled > 60s | *"Sync hasn't heard from Yahoo in 2 min."* Button: **Record manually** — falls back to today's flow. |
| disconnected / token dead | *"Yahoo sync is off."* Button: **Reconnect**. Manual entry resumes automatically. |

The manual pick list, the assign popover, and `fillUnknown` **all stay wired**.
Sync is an input to the board, never a replacement for the board's own controls.
If sync dies at pick 40, the app is exactly the app it is today.

**Keep — the step-away band becomes a sync-health band.**

Today it says how long since a pick landed *on this board* and offers catch-up.
With sync on it says how long since a pick landed *from Yahoo*, which is a
sharper question. The catch-up sheet stays, unchanged, as the fallback when sync
is stalled — **do not delete it, and do not weaken it.** It is the thing that
makes Phase C safe to ship at all.

**One new surface: a sync status chip** in the app bar. Three states — green
"synced 6s ago", amber "waiting 40s", grey "off". One click opens connect /
disconnect / league picker. This is also where the mandatory Yahoo attribution
lives (§4).

### Polling

- **2s during your own on-the-clock window and the two picks either side.**
- **5s otherwise while `draft_status === "drafting"`.**
- **Stop entirely** when `draft_status === "postdraft"` or the draft is complete.
- Back off to 30s after any error; hard-stop on a 999 (see §11).
- Poll from the **client through the Worker proxy**, not a Worker cron — the
  draft is a foreground activity and there is no reason to keep state warm
  server-side.

Cost: a 3-hour draft at 5s is ~2,160 requests. Workers free tier is 100k/day.
Not a concern. Yahoo's app-level budget is (see §11).

### Acceptance

Run a full Yahoo mock draft with sync on. Required: every pick lands within the
measured latency; no pick is double-recorded; a deliberately mis-recorded manual
pick is corrected by Yahoo **and the correction is announced**; killing the
network mid-draft degrades to the manual flow with no data loss; reconnecting
back-fills every missed pick.

---

## 9. Phase D — in-season read layer

**This is the phase that justifies the whole integration.** The draft argument
for syncing is weak: a pick is a pick, and typing it yourself gives the engine an
identical input. In-season the argument inverts — twelve teams transacting all
week and a waiver pool that is the complement of twelve rosters is not data
anyone enters by hand. The API is the only practical source.

### Calls **[DOC]**

```
GET /league/<key>/transactions;types=add,drop,trade?format=json
GET /league/<key>/players;status=FA;start=0;count=25?format=json    # true free agents
GET /league/<key>/players;status=W;start=0;count=25?format=json     # on waivers
GET /league/<key>/teams/roster;week=<N>?format=json                 # ALL rosters, one call
GET /league/<key>/scoreboard;week=<N>?format=json
GET /league/<key>/teams?format=json                                 # waiver_priority, faab_balance
GET /league/<key>/players;status=A/percent_owned?format=json        # ownership trend
GET /player/<key>/stats;type=week;week=<N>?format=json
```

### What each gives you

- **Transactions [DOC]** — `type`, `status`, **`timestamp`** (unix seconds), and
  per player `source_type` (`freeagents`/`waivers`/`team`) and
  `destination_team_key`. **[COMM]** `faab_bid` on FAAB waiver claims.
  **[UNC]** No documented date filter — fetch and filter client-side on
  `timestamp`. You see *executed* transactions only, never the losing bids.
- **FA vs W [COMM]** — `status=FA` is immediately addable, `status=W` is
  waiver-locked. **This split is exactly "what's on waivers" vs "what I can grab
  now."** For a single player, `/player/<key>/ownership` gives status plus the
  waiver clear date without paging the pool.
- **All rosters in one call [DOC]** — `league/<key>/teams/roster;week=N`. Use
  this, never N per-team calls. **`selected_position`** distinguishes starters
  from `BN`/`IR` — this is the team-vs-team matchup input. **[UNC]** whether a
  past week returns the lineup *as locked* or the current roster retro-applied;
  spike before building "who should you have started."
- **`waiver_priority` [DOC]** and **`faab_balance` [COMM, UNC — spike 4]** are
  both on the **team** object. One `/teams` call gets all twelve. Cheap; do it.
- **`percent_owned` with a `delta` field [COMM]** — week-over-week ownership
  change. **This is the waiver-buzz signal and it is one of the genuinely good
  things this API offers.** **[UNC]** exact delta semantics.
- **Team-level projections [DOC]** — `team_projected_points` on the scoreboard,
  for current and future weeks.

### The hole that changes the architecture

**Per-player projected points are NOT available. [COMM, consensus]**

Team-level projections exist. Player-level do not. Yahoo's own UI has rich
projections (FTN, THE BLITZ, BAKER, ceiling/floor for Fantasy Plus); **none of it
is exposed through the API.** You cannot derive players by subtraction from the
team total either.

**Consequence: an external weekly projection source is a first-class dependency
of Phase E, not an afterthought.** Scraping Yahoo's UI is fragile and sits badly
against the terms in §4 — do not.

What the repo has today is **draft-shaped**, not week-shaped:

| Loader in `sig_sources.py` | Ports to weekly? |
|---|---|
| `load_vegas` | **Yes, natively.** Game totals and spreads are inherently per-week and are the single best weekly signal available. |
| `load_usage` | **Yes.** Snap share, target share, route participation — this is what actually predicts next week. |
| `load_espn` (injury) | Yes, and it matters more weekly than seasonally. |
| `load_ecr` | Only if a *weekly* ECR feed is used; season-long ECR is meaningless by Week 6. |
| `load_capital`, `load_velocity` | **No.** Draft capital and ADP velocity are pre-season concepts. Retire them in-season. |

**Build the weekly projection before building anything that consumes it.**
Matchup comparison and waiver suggestions are both just views onto it. Built in
the wrong order you get a nice UI over ECR, which is the exact complaint
`signal-layer-spec.md` already makes: *"three prices for the same thing."*

---

## 10. Phase E — the week-to-week product

Everything here depends on §9's projection existing. Ordered by dependency.

### E1. Team-vs-team matchup

Inputs: both rosters with `selected_position` (yours and your opponent's),
league scoring rules from Phase B, weekly projections from §9.

Output: your best legal lineup vs. theirs, position by position, with the
projected margin, the two or three slots that actually decide it, and where your
bench beats your starter.

The app already has `lineupPoints()` and `gradeDraft()`, which score a roster on
the best legal starting lineup under a league's rules. **Reuse them.** This is
the same computation against a weekly projection instead of a season one.

### E2. Start/sit

Falls out of E1 for free: any bench player projected above the starter in a slot
he is eligible for. `eligible_positions` **[DOC]** on every roster player is what
makes the legality check exact rather than a guess.

### E3. Waiver suggestions

Inputs: `status=FA` and `status=W` pools, your roster holes, weekly projections,
`percent_owned.delta` as a buzz signal, `waiver_priority` and `faab_balance`.

Output: ranked adds with the drop each implies, split into "addable now" (FA) and
"needs a claim" (W), and — where `uses_faab` — **a bid as a share of your
remaining budget**. *"Bid $14 of your remaining $73"* is a decision; a bare name
is a list. This is why spike 4 matters.

**The app must never claim a waiver.** Write access is off **[DOC]** and this
spec does not want it. Draftline advises; Ken acts in Yahoo.

### E4. The Claude layer

Worth noting the fit is much better here than during a draft. The Worker already
proxies Sonnet with a pinned model and a daily spend ceiling. Weekly analysis has
**no latency pressure** (read Wednesday morning, not on a 90-second clock),
**richer context** (two full rosters, a ruleset, a slate), and a genuinely
narrative output — which is what the model is good at, rather than a number
better computed deterministically.

Ten questions a week sits nowhere near the ceiling that a three-hour draft
stress-tested.

**Feed Claude the computed projection and the matchup table — never raw Yahoo
JSON.** The numbers are the app's job; the reading is Claude's.

### E5. Tribal knowledge

Ken's stated goal: hand-maintained weekly notes that reach the analysis. The
draft board already has this shape — a research layer of
`tag / ceiling / risk / note / source` annotations. `signal-layer-spec.md`
records the flaw to avoid: **"the prose does not score."** A note reaches Claude
and the card but never touches the number, so the board sorts as if the research
had not happened.

Do not repeat that in-season. A weekly note must either move a projection or be
explicitly marked as commentary. Pick one per note; do not ship a third silent
category.

---

## 11. Rate limits and the fetch layer

**[DOC] Yahoo publishes no rate limit.** Only that it "may temporarily throttle
or limit access" for excessive short-period usage.

- **[COMM] Blocking is per registered app ID, not per user.** Your app's
  aggregate traffic is the budget and one heavy user degrades everyone.
  **Build a global, app-wide request budget in the Worker, not a per-user one.**
  `LIMITS` KV already does exactly this shape of counting for the Claude spend
  ceiling — copy the pattern.
- **[UNC] The widely repeated "999 requests/hour" is unsubstantiated** and looks
  like a folk conflation with Yahoo's HTTP 999 block page. **Do not put it in
  code as a constant.**
- **[COMM] One reported working pattern: ~100 requests, then pause ~30s.** Treat
  as an order of magnitude.
- **[COMM] Failure is often not a clean 429.** Expect `RemoteDisconnected`
  (connection closed, no HTTP status) and an HTML **999** block page.
  **A naive retry-on-exception loop extends the ban — reportedly 2–24 hours.**
  The client must treat connection resets and non-JSON HTML bodies as rate-limit
  signals and back off hard.

### The pagination trap

**[COMM]** The players collection returns **max 25 per request**, and `start` is
a **zero-based offset in players** (0, 25, 50…), not a page index. Some wrappers
expose it as a page number and multiply internally — do not confuse them.

**A full free-agent sweep is dozens of sequential requests, and it is the single
biggest rate-limit exposure in-season.** Mitigations, in order:

1. **Sort server-side** (`;sort=`) so page 1 is the page that matters, and stop
   after 2–3 pages.
2. **Use `out=`** **[DOC]** to fetch several league sub-resources in one call:
   `/league/<key>;out=settings,standings,scoreboard`.
3. **Cache with TTLs** in `LIMITS` KV: settings ~24h, rosters ~1h, transactions
   ~15m, free agents ~30m. In-season data changes hourly at most.
4. **Poll on page load and via a Worker cron, not a loop.** Nothing in-season
   needs sub-minute freshness.

### The response-shape trap — read this before writing the fetch layer

Yahoo's JSON is a mechanical XML→JSON transcode, not designed JSON. Three
pathologies, all **[COMM]**-confirmed and visible in Yahoo's own samples:

1. **Numeric-string keys instead of arrays.** Collections are objects keyed
   `"0"`, `"1"`, … with a sibling `"count"`. Iterate `0..count-1`; `Array.map`
   does not work.
2. **Arrays of single-key objects.** One entity's fields arrive as a list of
   one-property objects: `[{player_key:…},{player_id:…},{name:{…}},…]`.
3. **Positional instability — the dangerous one.** Absent elements are
   **omitted**, shifting every later index. A player's `display_position` sits at
   index 10 or 9 depending on whether an injury `status` object is present — and
   `status` is absent for healthy players. **This is the number one cause of
   silently-wrong Yahoo parsing.**

**Rule: never index by position. Always search by key.** Write **one normalizer
at the HTTP boundary** — flatten single-key-object arrays into plain objects,
convert `{0,1,…,count}` into real arrays — and let no raw Yahoo shape past it.
Everything downstream consumes clean objects.

Other mechanics: `?format=json` goes **last**, after any `;path;filters`. Player
sub-resources (`stats`, `percent_owned`, `ownership`, `draft_analysis`) are
**mutually exclusive — one per player call [DOC]**; mitigate with `out=` at the
league level.

### Failure table **[COMM]**

| Symptom | Cause | Handling |
|---|---|---|
| `401` | Access token expired (1h) | Refresh at ~55min; refresh-on-401 once, then re-auth |
| HTML **999** page | App-level block | Back off hours. **Do not retry-loop** |
| `RemoteDisconnected` | Same block, no status | Treat as rate limit, not transient |
| Wrong field values | Positional indexing | Search by key |
| `400` on `format=json` | Query string before path filters | `;filters` first, `?format=json` last |
| Refresh fails | `redirect_uri` omitted | Always include it |
| Empty `draftresults` | `draft_status = predraft` | Expected, not an error |

---

## 12. Build order

| Phase | Depends on | Risk | Ship independently? |
|---|---|---|---|
| Spikes 1–7 | — | none | — |
| A — OAuth | spike 1, 7 | low | No product value alone |
| B — settings import | A, spike 2 | **low** | **Yes** |
| C — live draft sync | A, B, spike 3 | **high** | Yes, offseason + a full mock |
| D — in-season reads | A, B | low | Yes |
| E1/E2 — matchup, start/sit | D, §9 projection | medium | Yes |
| E3 — waivers | D, spike 4, §9 | medium | Yes |
| E4/E5 — Claude, tribal notes | E1–E3 | low | Yes |

**Recommended sequence:** spikes → A → B → **D → §9 projection → E** → C last.

Phase C is deliberately last despite being the flashiest. It is the highest-risk,
lowest-information-gain piece — a pick entered by hand and a pick from the API are
the same input to the engine — and it is the only phase with an unrepeatable,
time-critical deadline attached. Everything in D and E is recoverable week to
week, read-only, and self-correcting on the next poll.

---

## 13. Out of scope, permanently

- **Any write to Yahoo.** Read-only **[DOC]**, and this spec does not want it.
- **A browser extension.** DOM-fragile, needs store distribution, and **does not
  work on iPad** — which given the iPad work already in this repo is the wrong
  trade.
- **Scraping Yahoo's web UI for projections.** Fragile, and sits badly against
  §4. Use an external projection source instead.
- **A pick clock.** The app removed one on purpose and documented why. The API
  has no clock to restore it with **[COMM]**.
- **Multi-league switching**, until one league works end to end.

---

## 14. Test

Follow the repo's existing pattern — `tools/test-all.sh` runs every suite;
`test-accounts.sh` needs the Worker running locally.

New suites:

- `test-yahoo-normalize.js` — the §11 normalizer against **recorded fixtures** of
  real Yahoo payloads. Include a player **with** and **without** an injury
  `status` and assert both parse identically. That single pair pins the
  positional-instability bug.
- `test-yahoo-settings.js` — the Phase B importer against a recorded `settings`
  payload, asserting the emitted rules object matches `parser.js` output for the
  same league. This is the Phase B acceptance test.
- `test-yahoo-reconcile.js` — the §8 table, every row, plus: out-of-order polls,
  a duplicate poll, a poll that arrives while a manual pick is being recorded.
- Extend `test-accounts.sh` with the OAuth route contract (state validation, the
  proxy path allowlist, refresh-on-401).

**Record fixtures from Ken's real league during the spikes and commit them.**
Every suite above depends on having real payloads to test against, and the spikes
are the only time they get captured.
