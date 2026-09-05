# Draft day — one page

Print this Sunday night. Read it with a phone in the other hand.

---

## 0. The card

- **Draft:** Monday 2026-09-08, 19:00 CDT. Yahoo #257015.
- **League:** 12 teams, 15 rounds, snake, full PPR.
- **My slot:** 11.
- **Keeper:** Drake Maye, round 5 (pick 59). The schedule skips it — it is not one of
  the fourteen picks below.
- **My fourteen picks:** 11, 14, 35, 38, 62, 83, 86, 107, 110, 131, 134, 155, 158, 179.
- **`app.js` / `engine.js` / `ff.css` lock:** ______________________ holds it until
  ______________________. Nobody else touches those three files until it is released.
  Write the name and time in by hand Sunday night — this page does not know who is
  working when it is printed.

---

## 1. Monday morning

Run these in order. Each has its expected output next to it. If your terminal doesn't
match, stop and fix it — do not draft on a red suite.

1. **Start the Worker**, in its own terminal, and leave it running all day:
   ```
   cd ff/worker && npx wrangler dev --port 8787 --local
   ```
   Expected: it prints a listening address and does not exit. Leave the window open.

2. **Run the full suite**, in a second terminal:
   ```
   bash ff/tools/test-all.sh
   ```
   Expected, exactly:
   ```
   7 suite(s) passed, 0 suite(s) failed, 0 suite(s) skipped
   ```
   Seven, not six: the six Node suites plus `test-accounts.sh`, which only runs when
   step 1 took. If you see `6 passed, 1 skipped` you are looking at a
   **`SKIP  test-accounts.sh` line, and a skip is not a pass.** **A `SKIP test-accounts.sh` line is not a pass.** It means
   step 1 didn't take; go back and fix the Worker before doing anything else.

3. **Do not re-bake by default.** The bake is a Sunday-evening step and it has
   already happened; running it again Monday with no fresh FFC pull rewrites the
   board from the same inputs and buys nothing. Confirm instead that Sunday's bake is
   the one in the tree:
   ```
   git log --oneline -3 -- ff/data/players.js
   ```
   Expected: the top line is Sunday's bake commit. Re-bake **only** if the news moved
   something real overnight — see §3, which is the whole procedure including the FFC
   apply step this one deliberately omits.

4. **Audit the fresh bake:**
   ```
   node ff/tools/audit.js
   ```
   Expected: `0 high, 0 medium`. Some `low` lines are normal — those are judgment
   calls, not bugs. A `medium` freshness line means Sunday's bake did not land, or
   landed without stamping `meta.built`; go to §3. A `high` line means stop and get help before the draft, not during it.

5. **Confirm the build stamp locally:**
   ```
   node ff/tools/test-config.js
   ```
   Expected: pass. This checks `config.js`'s `build` value matches the `?v=` stamp on
   every script tag in both `app.html` and `index.html`, and that the proxy URL is the
   production Worker, not a loopback address.

6. **Deploy**, however you normally push this site live (Cloudflare Pages / GitHub
   Pages, whichever this repo uses).

7. **Verify the deployed build stamp over the wire** — this is the step that proves
   the site the iPad will load is the site you just tested, not a cached one:
   ```
   curl -s "https://copilotplaybook.com/ff/assets/config.js?bust=$(date +%s)" | grep build
   ```
   Expected: the `build:` value printed matches the one in your local
   `ff/assets/config.js`, exactly. If it doesn't match, the deploy hasn't landed yet
   or went somewhere else — do not proceed until it does. (Confirm this is really the
   live URL before Monday; if the site is hosted at a different path, swap it in here
   now, not at 18:55.)

8. **Confirm the Worker answers** (the production one, not local):
   ```
   curl -s -o /dev/null -w "%{http_code}\n" https://draftline-api.ken-lince.workers.dev/api/session
   ```
   Expected: an HTTP status code, not a curl error / timeout. Any code at all means the
   Worker is up; a curl error (`curl: (7) Failed to connect`) means it is not.

9. **Sign in from the iPad** itself, in Safari, against the deployed site, with the
   real account. Confirm the draft board loads with the keeper shown at round 5 and
   the schedule skipping pick 59.

10. **Run `ff/tools/ipad-check.md`** on the iPad now, not at 18:55. Any BLOCKER row
    failing stops the plan — see §7.

---

## 2. The stale-client trap

`checkForUpdate()` runs exactly once, at page load. There is no polling — nothing on
the page ever asks again. Once the iPad has the board open, **no deploy reaches it**
until someone reloads that tab, on purpose, by hand.

Consequence: a fix pushed after the iPad is already sitting on the draft screen does
nothing until reloaded. Don't count on it landing itself.

**Deploy freeze: 12:00 Monday.** After noon, don't ship anything you haven't
personally reloaded and re-verified on the iPad. If something must go out after the
freeze:

1. Deploy it.
2. **Then tell the user to reload the tab.** Not "deploy" alone — always both steps,
   said out loud, before you consider the fix live.

The banner that appears after a reload says "A newer version of Draftline is
deployed" with a Reload button — but that banner is what step 2 produces. It cannot
appear on its own before someone reloads once.

---

## 3. Contingency re-bake

**When to:** ADP moved meaningfully since the morning bake — a run of news, a big
name suspended or ruled out, anything that would change who's gone by pick 35.

**When not to:** anything less than that. A re-bake this late is only as good as the
diff review behind it; don't run one you don't have five minutes to read.

**Sleeper's players file is 15 MB and is pulled once a day.** Sunday's pull already
spent that call. Re-baking again Monday does **not** re-pull Sleeper — it only
touches ADP, via the short form below.

**Short form** (ADP-only update, no new Sleeper pull):

```
cp ff/data/players.js /tmp/players.before.js
python ff/tools/apply-ffc.py ff/tools/fixtures/ffc-latest.txt --write
python ff/tools/bake-players.py
node ff/tools/bake-diff.js /tmp/players.before.js ff/data/players.js
```

Save the fresh FFC paste to `ff/tools/fixtures/ffc-latest.txt` first. `apply-ffc.py`
is dry-run without `--write`, and it refuses to write at all if fewer than 90% of the
names match — that means the page shape changed, and it is protecting the ADP layer
rather than blanking it four hours before the draft. **Take the refusal seriously; do
not work around it.**

The snapshot copy is not optional: `bake-diff.js` compares two files, and
`ff/data/players.js` is one minified line, so `git diff` on it is unreadable.

Read what `bake-diff.js` prints — points movers above 5, survival at picks 11 and 14
before/after, injury/depth/projSource changes. **The diff is reviewed, not just run.**
If nothing in the diff would change tonight's plan, don't bother committing it.

Then **bump the build stamp** in `ff/assets/config.js` and in the `?v=` stamps on
both `app.html` and `index.html` — the same value in all of them — and redeploy
(§1 steps 6–8 again). Skipping the stamp bump means the re-bake ships silently and
nobody's client ever asks for it (§2).

---

## 4. Worker down mid-draft

Every AI panel — the on-deck brief, "Ask again", the report, the style menu's
"Why?" — degrades independently to one line saying Claude is unavailable, with its
own control re-enabled so you can retry later. **The board itself is unaffected.**
Nothing about recording a pick, the roster, survival numbers or the tracker touches
the Worker.

Rules for the night:

- **Keep drafting off the board.** You do not need a brief to make a pick — the
  board's own composite ranking and the "still need" line are enough.
- **Do not troubleshoot on the clock.** If the Worker is down, that's a fact for
  after the round, not a problem to fix between the timer starting and your pick.
- **Do not redeploy the Worker during a draft.** A mid-draft redeploy is a second,
  self-inflicted outage layered on top of the first one. Wait for a gap of several
  picks, or wait for the draft to end.

---

## 5. Out of step with Yahoo

This is the most likely failure of the night. You are watching Yahoo's screen and
typing into this one, and typing lags reality by a pick here and there.

**How it shows up.** The status bar's `drift()` check compares the pick number you
typed into "live pick" against the count this board has recorded. If they disagree,
the status bar turns amber:

- **You're behind** ("You're N picks behind the real draft") — a **Catch up N picks**
  button opens the catch-up list, one row per missed pick, in order, each addressed
  to the team whose slot it was.
- **You're ahead** (you recorded more than Yahoo has actually made) — an **Undo N**
  button walks the extra picks back off.

**The rule: when you don't know who went, record "Didn't catch the name."** Both the
live tracker's own button (next to the record box) and each row of the catch-up list
support this. Do not guess.

**Why an unknown pick is safe and a wrong guess is not.** Recording "Didn't catch the
name" spends that team's slot and moves the pick count forward — the count stays
right — but leaves the player himself in the pool, available to be recorded
correctly later if you find out who it was. A guessed name that's wrong does none of
that safely: it removes the wrong player from the pool, credits him to the wrong
team's roster, and from that point every survival percentage, every VONA, every
composite rank and every recommendation this board makes is computed against a pool
that's quietly false — and nothing on screen tells you that happened. One unknown
pick costs the pool one player, once. One wrong guess corrupts the board for the
rest of the night.

---

## 6. Two devices

Sync is per-account, and two devices open on the same account can each move the
draft forward without the other seeing it happen. When one reloads and finds the
other has since saved a different version, you get a banner:

> "This draft was also changed on \<device\> \<time ago\>. Two versions exist and
> only one can win — nothing has been overwritten yet."

Two buttons:

- **"Use that one"** — takes the other device's version. Reloads this device onto it.
- **"Keep this one"** — keeps what's on the screen in front of you right now, and
  overwrites the account with it.

**Choosing either one deletes the other draft.** There is no merge. Whatever picks
exist only on the losing side are gone the moment you tap.

**Prevention first: draft from one device.** Decide before the draft starts which
device is the one of record and leave the other closed, or in read-only "watch"
mode if that's how you're using it. If a second device must be open, never record a
pick from it — the moment two devices both write, one of them is going to lose this
banner's coin flip, and it will be for real players.

---

## 7. If the app dies entirely

Fall back to paper. Sunday night, from **Sort: your points**, print the full board.
That ranking is draftable on its own — it does not need survival, VONA or a brief to
be useful, just a name and a position at the top when it's your turn.

Keep next to it:

- **Your fourteen pick numbers:** 11, 14, 35, 38, 62, 83, 86, 107, 110, 131, 134,
  155, 158, 179.
- **Roster requirements** for what you're filling: QB, RB, RB, WR, WR, FLEX, TE, K,
  DEF as starters, the rest to bench.
- **The keeper:** Drake Maye, already in at round 5 / pick 59 — don't draft a QB
  thinking that slot is open.

If the app comes back mid-draft, everything you drafted on paper goes into
"Didn't catch the name" / catch-up as unknown picks for the other 11 teams, and by
name for your own — never guess a name to save time re-entering it.

---

## 8. Do not, on draft day

1. Do not ship anything after 12:00 without reloading the iPad yourself and telling
   the user to reload theirs. A silent deploy after noon is the same as no deploy.
2. Do not guess a name you didn't catch. "Didn't catch the name" costs one player.
   A wrong guess costs the whole board.
3. Do not redeploy the Worker mid-draft to fix an AI problem. The board doesn't need
   it; wait for a gap.
4. Do not run two devices both recording picks. Pick one device of record before
   19:00 and stick to it.
5. Do not treat a `SKIP test-accounts.sh` line as a pass. It means the Worker
   wasn't up when the suite ran — go fix that, then re-run.
6. Do not accept a `medium` or `high` line from `audit.js` as background noise.
   `medium` on freshness means re-bake; anything `high` means stop and look before
   the draft, not during it.
7. Do not edit `app.js`, `engine.js` or `ff.css` on draft day unless you are the
   name written in §0's lock line, and even then, not once the draft has started.
8. Do not skip the iPad check because "it worked yesterday." Run
   `ff/tools/ipad-check.md` fresh, on the device, the same day.
