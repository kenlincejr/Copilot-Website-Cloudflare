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
  data/
    players.js        267 players: ADP layer + projections + annotations, baked
  tools/
    bake-players.py   rebuilds data/players.js
    test-engine.js    31 assertions against independently-derived numbers
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

## The optional Claude feature

Off by default. The user pastes their own Anthropic API key; it stays in that
browser's localStorage and the request goes straight from the browser to
`api.anthropic.com` with `anthropic-dangerous-direct-browser-access: true`.
Default model is Haiku 4.5. Claude is given the board's already-computed numbers
and told to trust them rather than substitute consensus rankings — it is there for
judgement on top of the math, not to re-rank anything.
