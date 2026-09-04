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
    app.js            draft room UI
    config.js         deployment config (the Claude proxy URL)
  worker/             Cloudflare Worker holding the shared Anthropic key
  data/
    players.js        267 players: ADP layer + projections + annotations, baked
  tools/
    bake-players.py   rebuilds data/players.js
    test-engine.js    31 assertions against independently-derived numbers
    test-parser.js    29 assertions on the league-settings paste parser
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

## Rebuilding the data

```bash
curl -s -o ff/tools/sleeper.json \
  "https://api.sleeper.com/projections/nfl/2026?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K&position[]=DEF"
python ff/tools/bake-players.py
node ff/tools/test-engine.js
```

`sleeper.json` is ~3 MB and is not committed. The ADP and annotation layers live in
`tools/players.json`; refresh that file to update ADP, injuries and notes.

## Tests

`node ff/tools/test-engine.js` — 31 assertions. It checks the scoring engine
against Sleeper's own PPR totals (must match to within 2%), and checks survival
probabilities, replacement levels, the keeper-adjusted pick schedule and the D/ST
point totals against figures derived independently in the research digest.

`node ff/tools/test-parser.js` — 29 assertions on the settings paste parser,
against a realistic Yahoo clipboard dump. The one it cares most about: Yahoo
prints `Label <tab> League Value <tab> Yahoo Default Value`, so the parser must
take the *first* number. Reading the second would silently load somebody else's
scoring, which would be worse than not parsing at all. Rule order matters too —
"Missed Field Goal 0-19" contains "Field Goal 0-19", so misses are matched before
makes.

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
| Per-IP rate limit (12/min) | Stops a single tab hammering it |
| Daily budget ceiling ($2, all callers) | Hard stop; the board still works |
| 24 KB body cap, last 4 messages only | Nobody can stuff the context window |

Deploying it:

```bash
cd ff/worker
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY   # interactive; never in the repo
```

The key is a Cloudflare secret. It is not in this repo, not in `wrangler.jsonc`,
and not readable from the deployed page. Watch spend with `npx wrangler tail`, and
change the ceilings at the top of `worker/src/index.js`.
