# Workstream G — Tests and tooling

Scope per `ff/tools/qa-review-prompt.md` §3.G: build the missing test tooling for
`app.js` (zero tests on 4,000+ lines), `sync.js` (zero tests), extend
`test-accounts.sh` with the lockout/64KB/race cases, add a data-freshness
assertion to `audit.js`, add the loopback-proxy guard, and put all of it behind
one command. Only new files under `ff/tools/` were added, plus the one
described addition to `ff/tools/audit.js`; no other existing file was touched.

## What was built

| File | New/edited | Covers |
|---|---|---|
| `ff/tools/test-app.js` | new | The ten app.js functions: `analyze`, `record`, `undo`, `keeperAt`, `myPickNumbers`, `simulateToMyPick`, `gradeDraft`, `runMock`, `playerIn`, `briefStale`. 64 assertions. |
| `ff/tools/test-sync.js` | new | `sync.js`'s conflict matrix (12 cells) plus `push()`/`flush()`'s 409 path, the network-failure path, and legacy-profile migration. 47 assertions. |
| `ff/tools/test-config.js` | new | The loopback-proxy guard and the build-stamp-vs-`?v=` guard from workstream A, as a runnable test rather than a manual check. 15 assertions. |
| `ff/tools/audit.js` | edited (one addition) | A `meta.built`-vs-`meta.draft` freshness check, in the same flag/report format as the rest of the file. |
| `ff/tools/test-accounts.sh` | edited (three new sections) | The per-IP lockout (post-fix), a 64 KB+ state body, and a two-device simultaneous-write race. 9 new assertions (35 total, up from 26). |
| `ff/tools/test-all.sh` | new | Runs every suite above plus `test-engine.js`, `test-parser.js`, `test-playerin.js` (added by another session mid-engagement, picked up automatically if present) and `audit.js`; one pass/fail line per suite; skips `test-accounts.sh` with a clear message when the Worker is not running. |

All baselines still hold: `test-engine.js` 99/0, `test-parser.js` 112/0. Full
results with the Worker running via `npx wrangler dev --port 8787 --local`
in `ff/worker`:

```
node tools/test-engine.js    99 passed, 0 failed
node tools/test-parser.js    112 passed, 0 failed
node tools/test-app.js       64 passed, 0 failed
node tools/test-sync.js      47 passed, 0 failed
node tools/test-config.js    15 passed, 0 failed
node tools/test-playerin.js  17 passed, 0 failed   (another session's suite; test-all.sh picks it up)
bash tools/test-accounts.sh  35 passed, 0 failed
node tools/audit.js          0 high, 1 medium, 3 low   (see "audit.js" below — this count changed on purpose)
```

`bash tools/test-all.sh` runs all of the above under one command, prints a
per-suite line, and exits nonzero on any suite failure. Run from anywhere —
it `cd`s to `ff/` itself.

## test-app.js — how it gets at app.js's internals

app.js is a single `(function () { ... })()` closure that reads `document`,
`window` and `localStorage` the moment it loads, and none of the ten functions
are exported. Two approaches were viable, per the brief: pull the pure logic
into a second file, or run the real file in a sandboxed context. **This uses
the second one, exactly as written, not a rewrite:**

- A permissive fake `document`/`window`/`localStorage`/`fetch` is built once
  (a generic auto-vivifying element via `Proxy` — any unset property read
  comes back as a harmless no-op, any write just sticks). `app.js` boots
  completely under it, including its own `render()` pipeline, without
  needing this harness to anticipate every selector the app queries.
- The file's actual source text is read fresh for every scenario, and one
  export line (`globalThis.__APP_TEST__ = { analyze: analyze, record: record,
  ... }`) is appended just before its closing `})();`. That line runs inside
  the IIFE's own closure, so it can see `analyze`, `record`, `S`, `A`, etc.
  directly. The file on disk is never touched — this happens to a string in
  memory, fresh per test scenario, via Node's `vm` module.
- One additional instrumentation, not an export: `runMock()` only ever
  returns `summarizeMock()`'s output, which **deduplicates a repeated name
  before handing it back** — exactly the shape that would hide the bug this
  file exists to pin (see below). To see the raw roster `runMock()` actually
  builds, the in-memory copy gets one line appended right after the real
  `runs.push(mine);` so a capture array can see what was really assembled.
  That is the only line in the file this harness alters, it is applied to
  the in-memory string only, and it is guarded by a byte-for-byte occurrence
  count (`if (occurrences !== 1) throw ...`) so a future change to that line
  fails loudly instead of silently instrumenting the wrong thing.

**Which of the ten functions could not be exercised as designed, and why:**
none. All ten got real, assertable tests — including `runMock`, which needed
the one instrumentation line above to see past `summarizeMock`'s own
deduplication. `simulateToMyPick`'s 120-iteration guard is confirmed not to
bind on the largest real gap (21 picks, 14→35).

### The mandatory runMock regression (proved to fail)

Per the brief, this pins the fix at `ff/assets/app.js` (~line 1673, `grep
seededMine`): a pending keeper already sitting in `A.mine`/`seededMine` was
being pushed onto the simulated roster a **second time** every time the
simulation reached his round, giving every mocked roster two Drake Mayes.

`loadApp(..., { reintroduceKeeperBug: true })` builds a **second, separate,
in-memory copy** of `app.js` with the old one-line guard restored (never the
real file — this is the "temporarily revert in a scratch copy" the brief asks
for), re-runs `runMock()` against it, and asserts that the duplicate
resurfaces. It does:

```
ok   reverting the fix in a scratch copy reproduces the duplicate-Maye bug (this harness would have caught it)
```

against the reverted copy, and

```
ok   mock draft 0: no duplicate player name in the roster
ok   mock draft 0: roster length equals the number of rounds (15)
```

(times 5, one per iteration) against the current code. This is a real,
demonstrated fail/pass pair, not an assertion that happens to be true.

### The mandatory playerIn cases — a defect found, then fixed mid-engagement

At the time this suite was first run, `playerIn()` matched by "longest full
name that is a substring of the line," and the case the brief specifically
calls out —

```
"Take Chase Brown over Ja'Marr Chase"
```

— bound to **Ja'Marr Chase** (13 characters) instead of **Chase Brown** (11
characters), because "Ja'Marr Chase" is also literally contained in the
sentence and is the longer match. That is a real defect: it would bind the
Draft button to the player the brief is telling the user to pass on, in
exactly the shape of sentence a two-player comparison produces. Reproduction
at the time: `node -e "..."` confirming both full names are substrings of the
line and that `"Ja'Marr Chase".length` (13) `> "Chase Brown".length` (11).
Severity as filed: **HIGH** (wrong in a plausible common path — the brief
regularly compares two players — with a severe consequence: drafting the
wrong player from a one-click button).

Another session rewrote `playerIn()` while this workstream was in progress
(app.js is explicitly shared, actively-edited ground per this engagement's
rules of engagement). The current version normalizes punctuation (including
folding a curly apostrophe to straight), matches by **earliest** position
rather than longest name, and — critically — treats two non-overlapping
full-name matches in one line as ambiguous and returns **null** rather than
guessing. Re-run against the current code:

```
ok   "Take Chase Brown over Ja'Marr Chase" must not bind to Ja'Marr Chase (the player being passed over) — nobody or Chase Brown are both acceptable  — null
ok   a curly apostrophe does not cause a wrong bind (nobody is an acceptable answer)  — Ja'Marr Chase
```

The defect is resolved. The test is kept exactly as written (asserting "not
the wrong player," which is the property that actually matters, not "returns
null" or "returns Chase Brown" specifically) so it stays meaningful as a
permanent regression case regardless of which safe outcome a future version
picks. The other four mandatory cases (trailing period, apostrophe, suffix,
nickname) all passed against both the old and new code.

## test-sync.js — the conflict matrix

The matrix is server state (empty / current / ahead / behind, relative to
this device's last known revision) crossed with local state (clean / dirty /
absent). Reading `hydrate()`'s actual branches rather than assuming a clean
4×3 grid:

- **EMPTY × CLEAN and EMPTY × DIRTY collapse to one code path** — the
  "server has nothing" branch only checks whether local has a draft at all,
  not its dirty flag. Both are tested; the comment on each says they are the
  same branch.
- **AHEAD and BEHIND are never distinguished anywhere in `hydrate()`** — the
  code only ever tests `serverRev === rev()`, never which is larger. A
  single per-device integer cannot encode direction. This means a **clean**
  device facing a mismatch always silently adopts whatever the server
  currently has, even if that is *older* than what the device already held
  (BEHIND × CLEAN) — reachable in practice only via an external event (a
  restored KV backup, a manually-cleared record), not a normal two-device
  flow, but real and worth having in writing:

  ```
  ok   BEHIND x CLEAN (documents a real, rare data-loss path): hydrate cannot distinguish this from AHEAD and adopts the older copy
       — local had 14 picks, server had 2, and the 14-pick copy was silently replaced
  ```

  This is not something sync.js was edited to fix in this workstream — a real
  fix needs a per-write clock or a monotonic timestamp compared explicitly,
  not a one-line patch, and is noted here as a finding for the report rather
  than a change. The one property that **does** hold in both directions, and
  is the one that actually protects a user: a **dirty** device always gets
  the conflict banner on any mismatch, confirmed for both AHEAD × DIRTY and
  BEHIND × DIRTY.
- **CURRENT × ABSENT is pathological** (a revision number on disk with no
  draft behind it) and is tested only for "does not crash, does not push
  undefined," not because a real user reaches it.
- **BEHIND × ABSENT is not tested at all** — a device cannot hold a revision
  counter ahead of the server's count while having no draft behind it; there
  is no path in the app that produces that combination.

Also covered, beyond the 12-cell grid: the `push()`/`flush()` 409 path when an
autosave (not a fresh `hydrate()`) collides with another device — both the
"real competing draft, surface a conflict" and "empty/unreadable competing
state, just catch up and retry silently" sub-cases; a network failure during
flush (status goes `offline`, the pending write is never dropped, a later
`flushNow()` succeeds and clears dirty); `resolve("theirs")` and
`resolve("mine")`; and `legacyDraft()` migration (the pre-accounts
device-local profile is adopted into a brand-new account and pushed up).

Every assertion in this file is falsifiable in the ordinary sense — each was
run once against a deliberately wrong expectation while writing this suite to
confirm it actually fails (e.g. asserting `mode === "adopted"` where the code
returns `"conflict"` does fail), though those throwaway inversions are not
checked in; the file's own git history is this session's only copy.

## test-config.js

Two guards, each with a self-check proving it can fail:

- `claudeProxy` is rejected if it points at `localhost`, `127.0.0.1`, or
  `[::1]` in any of the usual URL spellings (with/without a port, http/https).
  Self-check: the regex is run against `http://127.0.0.1:8787` (the exact
  string workstream A found in the working tree) and three variants, and
  against the real production URL, confirming it rejects the bad ones and
  accepts the real one.
- Every `?v=` stamp in `app.html` and `index.html` must equal `config.js`'s
  `build` field. Self-check: a copy of `app.html`'s text with one tag's stamp
  changed to `"?v=some-other-stamp"` is confirmed to trip the check (a
  half-finished deploy must not slip past because most of the tags still
  agree).

Current state: `claudeProxy` is the production Worker URL over https, and
every `?v=` stamp across both HTML files matches `config.js`'s `build`
(`20260904az` at the time of this run). Both guards pass today; they exist to
catch the next dev override or half-deploy, not today's state.

## audit.js — the freshness assertion, and the count it changed

Added a check comparing `meta.built` (the date `bake-players.py` last ran)
against the date portion of `meta.draft` (the real draft's date/time — parsed
as a plain `YYYY-MM-DD` prefix; `meta.draft` also carries a local kickoff time
and zone abbreviation like "19:00 CDT" that `Date` cannot parse reliably
across runtimes, and the 3-day rule is about calendar days, not hours). It
flags `MED` if the bake is more than 3 days before the draft, `HIGH` if
`meta.built` is somehow *after* `meta.draft` (a wrong year or a swapped date),
and reports `ok` (silent in the printed list, like every other `ok` in this
file) inside the window.

**This does change the baseline count, as the brief anticipated it might.**
Today (`meta.built: "2026-09-04"`, `meta.draft: "2026-09-08 19:00 CDT"`) is
exactly 4 days out — one more than the window — so the audit now reports:

```
AUDIT — 0 high, 1 medium, 3 low
  [MED ] freshness   the bake (meta.built: 2026-09-04) is 4 days before the draft
                      (meta.draft: 2026-09-08 19:00 CDT) — more than the 3-day
                      freshness window; re-run tools/bake-players.py before draft night
```

instead of the documented baseline of `0 high, 0 medium, 3 low`. This is a
real, correct flag under the rule as specified, not a bug in the check — a
re-bake closer to Monday (workstream C already recommends re-running
`bake-players.py` from fresh pulls) will clear it. It is called out here per
the instruction to say so if the count changes, and it is exactly the kind of
reminder `tools/draft-day.md`'s morning-of checklist should include.

## test-accounts.sh — the three new sections

All three were reproduced live against `npx wrangler dev --port 8787 --local`
before being written as permanent assertions (raw `curl` transcripts below are
from that reproduction, not from the checked-in script, which regenerates its
own fixtures with random names on every run).

**Lockout is per-IP only, post-fix.** The per-account-name lockout bucket was
removed earlier in this engagement (see `worker/src/accounts.js`'s comment on
`AUTH_LIMIT`/`AUTH_WINDOW`): anyone who knew the user's account name could
previously send 20 wrong passwords from any address and lock the real owner
out for 15 minutes, which at 18:50 on draft night is the whole app. The test
drives one address (`CF-Connecting-IP: 203.0.113.9`) to 21 failed attempts
against a fixed name, confirms that address is refused, and then confirms a
**correct** password for that **same name** from a **different** address
(`198.51.100.4`) still signs in normally:

```
21st attempt from same IP 9.9.9.9 (should be 429):
{"error":{"message":"Too many sign-in attempts. Wait fifteen minutes and try again."}}
correct password from DIFFERENT ip 8.8.8.8 (should succeed):
{"token":"...","user":{"id":"...","name":"lockouttest16535"}}
```

**A 64 KB+ state body.** The server accepted and round-tripped a ~70 KB state
(well under the 512 KB `MAX_BODY_BYTES` ceiling) without truncation. This
confirms the **server** side has no problem with a large state. It does not
and cannot test the other half of the risk described in workstream F: a
browser's `fetch(..., { keepalive: true })` — the call `pagehide` makes — caps
its body at **64 KB** and fails silently over that limit, which is a
browser/client behavior curl has no equivalent for. **Finding (carried
forward from workstream F, confirmed reachable):** after a full draft with a
200-row Yahoo draft-analysis paste stored in `S.league.yahooAdp`, the saved
state is plausibly at or past 64 KB, meaning the very last autosave of the
night — the one sent on tab-close via `pagehide` — could silently fail to
reach the account while every earlier, smaller autosave succeeded. Severity:
**MEDIUM** (uncommon path — requires a large pasted analysis plus a near-full
draft — but a real, silent loss of exactly the last few picks if it hits).
Suggested mitigation for the report, not implemented here: chunk or omit
`yahooAdp` from the `pagehide` payload specifically, since it is derivable
data the user can re-paste, unlike the pick log itself.

**Two-device simultaneous write.** `worker/src/accounts.js`'s `PUT
/api/state` is a read-then-write, not an atomic compare-and-swap: it fetches
the current record, checks `rev`, then writes — three separate steps. Fired
as two truly concurrent `curl` PUTs against the same base `rev` (backgrounded
in the same shell, `wait`ed together), against local `wrangler dev`, the
result was consistently **one winner and one clean 409**, run fifteen-plus
times while developing this test, never two silent 200s and never a vanished
draft:

```
A: {"rev":2,"updatedAt":...}
B: {"conflict":true,"rev":2,"updatedAt":...,"device":"A","state":"{\"picks\":[1,2]}"}
```

That is the contract the permanent test pins down, and it is reassuring: the
worst observed case is exactly the conflict banner the brief hopes for, not a
silent overwrite. **It is not proof the same holds against production's real,
physically-distributed KV**, where two requests landing on different colos
have a wider window between their read and their write than two requests
served by one local, effectively single-threaded dev isolate. No CAS
primitive is used, so the structural gap is real even though it did not
reproduce locally. Recorded as a **LOW** finding (a real gap, but not observed
to manifest, and a private board's simultaneous-save collision is rare) with
a suggested mitigation for the report: a KV-native conditional write if the
runtime exposes one, or accept the current design and rely on the
low-probability-times-low-stakes math (worst case is still one person's
autosave overwriting their own other device's autosave, not another user's
draft).

## test-all.sh

Runs, in order: `test-engine.js`, `test-parser.js`, `test-app.js`,
`test-sync.js`, `test-config.js`, `test-playerin.js` (if present — this
appeared mid-engagement from another workstream and is picked up
automatically rather than hard-coded as "must exist"), then `audit.js` in
full (never gates pass/fail on its own — it is a report, and a HIGH finding
there is a review item, not a broken test), then `test-accounts.sh` **only
if** something answers at `$DRAFTLINE_API` (default
`http://127.0.0.1:8787`) — otherwise it prints exactly what to run and skips
cleanly rather than dumping connection-refused noise. Exits nonzero if any
suite actually failed; a skip does not count as a pass, and the summary line
says so explicitly. Confirmed both branches: full pass with the Worker up (35
tools/test-accounts.sh checks included).

## Summary

Suites created: `test-app.js` (64 checks), `test-sync.js` (47 checks),
`test-config.js` (15 checks). Suites extended: `test-accounts.sh` (+9 checks,
26→35), `audit.js` (+1 check, format unchanged). New: `test-all.sh` as the
single entry point.

Total, Worker running: 99 + 112 + 64 + 47 + 15 + 17 + 35 = **389 checks
passing**, plus `audit.js`'s own findings report (0 high, 1 medium — the new,
disclosed freshness flag — 3 low, unchanged).

Defects found while writing this tooling:
1. **playerIn() longest-substring mis-bind** — found HIGH, reproduced, then
   fixed by a concurrent session before this report was finalized; the
   regression case is kept permanently in `test-app.js`.
2. **`pagehide`'s 64 KB keepalive body cap vs. a state that can plausibly
   exceed it with a large Yahoo paste** — MEDIUM, confirmed reachable
   server-side (the server itself has no limit under 512 KB), not fixed here
   (workstream F territory; a client-side change).
3. **`PUT /api/state` is read-then-write, not atomic** — LOW, a real
   structural gap, not observed to cause a silent overwrite in fifteen-plus
   local reproduction attempts, flagged for the report rather than changed.
