# Workstream F — Accounts, sync and security

QA pass over `ff/worker/src/accounts.js`, `ff/worker/src/index.js`, `ff/assets/auth.js`,
`ff/assets/sync.js`. All reproductions below were run against a local `npx wrangler dev
--port 8787 --local` instance from `ff/worker`, never against the deployed Worker. The
existing `tools/test-accounts.sh` suite (26 checks) passed before and after this pass —
nothing here regressed the baseline.

Severity follows the brief: BLOCKER = cannot draft, HIGH = wrong/misleading in a common
path or a real security exposure, MEDIUM = wrong in an uncommon path or a real usability
cost, LOW = everything else.

---

## F1 — BLOCKER — the account-name-keyed lockout locks the real user out, and an attacker needs nothing but the name

**Defect.** `POST /api/login` rate-limits failed attempts on two buckets — `ip:<ip>` and
`nm:<name>` (`accounts.js:183`). Either bucket alone can trip the 429. Because the name
bucket is keyed only on the account name, and account names are exactly what a "private
board with a dozen friends" would naturally know or guess (first names, team names,
`kenlince`, etc.), anyone who knows the user's sign-in name can lock the real account out
for 15 minutes, from a different IP than the user's own, using only 20 POSTs — no password
guessing skill required, no rate limit on their own side beyond the same 20/IP/15min they're
already spending on the target's name.

**Reproduction.**

```bash
B=http://127.0.0.1:8787
O="Origin: http://localhost:8123"
J='content-type: application/json'
VIP="CF-Connecting-IP: 10.0.0.5"   # the real user's IP
AIP="CF-Connecting-IP: 203.0.113.9" # attacker's IP — deliberately different
VICTIM="kinda-highlanders-user"

curl -s -H "$O" -H "$VIP" -H "$J" -d "{\"name\":\"$VICTIM\",\"password\":\"correcthorse\"}" $B/api/signup
curl -s -H "$O" -H "$VIP" -H "$J" -d "{\"name\":\"$VICTIM\",\"password\":\"correcthorse\"}" $B/api/login   # works

for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code} " -H "$O" -H "$AIP" -H "$J" \
    -d "{\"name\":\"$VICTIM\",\"password\":\"guess$i\"}" $B/api/login
done

curl -s -H "$O" -H "$VIP" -H "$J" -d "{\"name\":\"$VICTIM\",\"password\":\"correcthorse\"}" $B/api/login
```

**Evidence (actual output).**

```
== victim signs up from their own IP ==
{"token":"30c82bcd...","user":{"id":"p_e1aa8c38e14940eb","name":"kinda-highlanders-user"}}
== victim logs in fine, from their own IP, before attack ==
{"token":"700560d9...","user":{"id":"p_e1aa8c38e14940eb","name":"kinda-highlanders-user"}}
== attacker, from a totally different IP, sends 20 wrong passwords for the victim's known account name ==
401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401
== victim, from THEIR OWN IP, now tries the correct password ==
{"error":{"message":"Too many sign-in attempts. Wait fifteen minutes and try again."}}
```

The victim's own IP never sent a bad password. The lockout is purely a function of the
attacker knowing the name. At 18:50 on draft night this is a fifteen-minute window in which
the user cannot sign in on a fresh device (an already-signed-in device with a cached token
keeps working — `AUTH.current()` is synchronous off localStorage — but a re-login, a second
device, or a session that expired mid-week is blocked).

**Proposed fix (diff, not applied).** Keep the per-IP bucket, which is real brute-force
protection and does not have this failure mode (an attacker would have to rotate 20 IPs
per 15-minute window to make a dent, which is a materially higher bar than "know the
name"). Drop the name bucket from the block decision; keep counting it (cheap, and useful
if the product ever wants per-account throttling or alerting later), but never let it alone
cause a 401 sign-in to *also* refuse a correct password.

```diff
--- a/ff/worker/src/accounts.js
+++ b/ff/worker/src/accounts.js
@@
   /* --------------------------------------------------------------- login */
   if (path === "/api/login" && method === "POST") {
     const name = String(body.name || "").trim();
     const password = String(body.password || "");
-    const buckets = [`ip:${ip}`, `nm:${name.toLowerCase()}`];
-    for (const b of buckets) {
-      if ((await attempts(env, b)).over) {
-        return json({ error: { message:
-          "Too many sign-in attempts. Wait fifteen minutes and try again." } }, 429);
-      }
-    }
+    const buckets = [`ip:${ip}`, `nm:${name.toLowerCase()}`];
+    // Brute force is bounded per IP, which is the bucket an attacker cannot
+    // cheaply multiply. The per-name bucket is still counted below so a
+    // targeted attempt is visible, but it must never be the thing that locks
+    // out the account itself — that would let anyone who merely knows a
+    // name deny the real owner service by spending 20 requests from any IP
+    // that is not the owner's own, which is exactly the draft-night risk.
+    if ((await attempts(env, `ip:${ip}`)).over) {
+      return json({ error: { message:
+        "Too many sign-in attempts. Wait fifteen minutes and try again." } }, 429);
+    }
     const id = await env.USERS.get(nameKey(name));
     const rec = id ? await env.USERS.get(userKey(id), "json") : null;

     // One message for both halves, so this cannot be used to enumerate names.
     if (!rec || !sameHash(await derive(password, rec.salt), rec.hash)) {
       await countFailure(env, buckets);
       return json({ error: { message: "That name and password don't match an account." } }, 401);
     }
     return json(await startSession(env, rec), 200);
   }
```

This is the "per-IP only" option the brief calls out as acceptable. It is a ~10-line
change, self-contained to `accounts.js`, and does not touch signup's IP-bucket check
(`accounts.js:156`), which has no name-keyed twin and is already sound.

---

## F5 — MEDIUM — KV's real eventual consistency can beat the optimistic-revision check; not reproducible against local wrangler, but the mechanism is real

**Defect (reasoned, not directly reproduced).** `PUT /api/state` does a plain
read-then-write against KV with no compare-and-swap (`accounts.js:220-238`): read `cur`,
compare `sentRev` to `cur.rev`, write `cur.rev + 1` if they match. Cloudflare's own docs
describe KV as eventually consistent, with writes that can take up to 60 seconds to
propagate across edge locations and no atomic read-modify-write primitive. Two devices
writing within that propagation window, from two different colos, can each independently
read the same stale `rev`, each pass the equality check, and each write `rev+1` — the
second physical write silently wins with no 409 ever returned to either device, because
neither device's read ever saw the other's write. That is a silent overwrite, which is
exactly the failure mode the brief says the worst case must not be.

**What I actually reproduced.** Two concurrent `curl` loops hitting the *same* local
wrangler process at the same `rev`:

```bash
curl -s -X PUT ... -d '{"rev":1,"state":"...deviceTag A...","device":"Device A"}' $B/api/state &
curl -s -X PUT ... -d '{"rev":1,"state":"...deviceTag B...","device":"Device B"}' $B/api/state &
wait
```

```
A: 200
B: 409
final server state: {"rev":2, ..., "device":"Device A", "state":"...A..."}
```

This is correct behavior — one wins, the other gets the conflict banner path, nothing was
silently lost. But `wrangler dev --local`'s KV emulation is a single in-process store with
strict read-after-write consistency (there is exactly one copy of the data, so any two
requests processed by the same isolate necessarily serialize enough for the second read to
see the first write). **This test cannot exercise the actual eventual-consistency race**;
it can only prove the optimistic-concurrency logic is correct when reads are consistent,
which they always will be in this local harness. I am reporting this as **not reproduced**,
with the mechanism above stated plainly, per the rules of engagement.

**Why this is still worth fixing.** The failure only bites two devices saving inside the
propagation window (roughly the debounce delay, 1.5s, plus KV's real-world propagation,
which is usually much faster than the documented 60s ceiling but not guaranteed zero) —
an uncommon path, which is why this is MEDIUM and not HIGH. But when it happens the result
is one device's whole draft silently vanishing with no banner, which is worse than the
documented, tested conflict path for every other case in `sync.js`.

**Recommendation (do not implement — this is a formula/architecture call).** Move
`stateKey(id)` off KV and onto a Durable Object (one per account, or one shared DO keyed by
account id) for `GET`/`PUT /api/state` only. Durable Objects give a single consistent
owner for that key with real compare-and-swap via `blockConcurrencyWhile` or the built-in
transactional storage API, which closes this race outright rather than narrowing it. Leave
`LIMITS` and session lookups on KV — they are read-heavy, short-TTL, and slippage there is
explicitly acceptable (see F8). This is a bigger change than the ~30-line threshold for a
same-session fix, so it is written up rather than applied.

---

## F6 — MEDIUM/HIGH — stored XSS via a team name renders unescaped `innerHTML` in four call sites

**Defect.** `esc()` (`app.js:12`) exists and is used correctly in most places, but
`teamLabel()` (`app.js:134`) — which returns the raw, attacker-controlled string typed
into the team-names setup form (`S.league.teamNames[slot-1]`, no character restriction) —
is interpolated directly into HTML strings assigned via `.innerHTML` **without** `esc()`
in at least these four places:

| Line | Function | Sink |
|---|---|---|
| `app.js:610` | catch-up rows | `$("#catchupRows").innerHTML = rows.map(...)` |
| `app.js:684-685` | ticker `seg()` | `el.innerHTML = seg("on the clock", teamLabel(...), ...)` |
| `app.js:2568` | board row "who" sub-label | flows into `rowHtml()` → `$("#plist").innerHTML` |
| `app.js:3024` | draft log | `$("#log").innerHTML = S.picks...map(...)` |

(For contrast, the same function *is* correctly wrapped in `esc()` at `app.js:822`, `852`,
`858`, `862`, `876` — the tracker card got it right, these four did not.)

A team named `"><img src=x onerror=alert(1)>` (entered once through Settings → Team names,
a plain text field with no length or character restriction beyond the roster form's own)
would execute script the next time that team appears on the clock, in the pick log, in a
catch-up row, or as the owner of a taken player — i.e., within the first few picks of any
real draft, unattended.

**Reproduction.** Extracted the exact code from `app.js:674-686` (the `seg()` helper and
the ticker's `innerHTML` assignment) and ran it under Node with the payload as a team name,
to show byte-for-byte what string reaches `.innerHTML`:

```
node -e '
var teamLabel = function (name) { return name; };  // teamLabel returns this string raw
function seg(k, v, mine) {
  return "<span class=\"seg" + (mine ? " me" : "") + "\"><span class=\"k\">" + k +
         "</span><span class=\"v\">" + v + "</span></span>";
}
var payload = "\"><img src=x onerror=alert(1)>";
console.log(seg("on the clock", teamLabel(payload), true));
'
```

```
<span class="seg me"><span class="k">on the clock</span><span class="v">"><img src=x onerror=alert(1)></span></span>
```

Assigning that string to `.innerHTML` (which `app.js:680` does verbatim) causes the browser
to parse an `<img>` tag with a broken `src` and execute `onerror`. I did not click this
through in a live browser session (config.js currently points at the production Worker,
and the rules of engagement bar testing against production or on a page whose network
calls would reach it) — this is a static/logical reproduction of the exact vulnerable
string, not a live-browser confirmation. The mechanism is standard, well-documented DOM
behavior (assigning attacker-controlled markup via `innerHTML` executes it), so I am
reporting this as a confirmed defect rather than "not reproduced," but flagging the gap
honestly.

**Checked and found safe:** the player-search field (`#search`) does not reflect the raw
query into any HTML — matches come only from the static, `esc()`-wrapped player list
(`app.js:912-921`), so a search of `"><img src=x onerror=alert(1)>` just yields "no
players match," nothing renders unescaped. The account name (`index.html` `profileList`,
`app.js:23`) is escaped or set via `textContent`. The style `why` string (`app.js:1917`) is
escaped. The Claude AI output is set via `textContent` in the transport paths
(`app.js:1413`, `3984`) and `esc()`-wrapped where it is built into `innerHTML`
(`app.js:4133`, `4137`).

**Proposed fix (diff, not applied — small enough to actually apply on a second pass, held
here to keep this report's scope to non-destructive reproduction).**

```diff
--- a/ff/assets/app.js
+++ b/ff/assets/app.js
@@ -607,7 +607,7 @@
   $("#catchupRows").innerHTML = rows.map(function (r, i) {
     return '<div class="catchup-row">' +
       '<span class="slotlbl">pick ' + r.pick + "<br>" +
-        (r.mine ? '<span class="mine">you</span>' : teamLabel(r.slot, true)) + "</span>" +
+        (r.mine ? '<span class="mine">you</span>' : esc(teamLabel(r.slot, true))) + "</span>" +
       '<input type="text" list="allPlayers" data-cu="' + i + '" value="" placeholder="who went here?">' +
@@ -681,8 +681,8 @@
     seg("round", A.onClock.round + " of " + S.league.rounds) +
     '<span class="sep"></span>' +
     (isLive()
-      ? seg("on the clock", teamLabel(A.onClock.slot, true), A.onClock.slot === S.league.slot) +
-        (onDeck ? seg("on deck", teamLabel(onDeck, true), onDeck === S.league.slot) : "")
+      ? seg("on the clock", esc(teamLabel(A.onClock.slot, true)), A.onClock.slot === S.league.slot) +
+        (onDeck ? seg("on deck", esc(teamLabel(onDeck, true)), onDeck === S.league.slot) : "")
       : seg("pick", String(A.cur))) +
@@ -2565,7 +2565,7 @@
   var who = t ? '<span class="sub">' +
-        (isLive() || t.mine ? teamLabel(t.slot, true) + " · " : "") +
+        (isLive() || t.mine ? esc(teamLabel(t.slot, true)) + " · " : "") +
         (t.keeper ? "kept R" + ownerOfPick(t.pick).round : t.pick) + "</span>" : "";
@@ -3021,7 +3021,7 @@
     return '<div style="padding:2px 0;' + (p.mine ? "color:var(--teal)" : "color:var(--dim)") + '">' +
       '<span class="mono">' + p.pick + "</span> " +
-      (isLive() || p.mine ? teamLabel(p.slot, true) + " · " : "") +
+      (isLive() || p.mine ? esc(teamLabel(p.slot, true)) + " · " : "") +
```

This is a 4-line, purely additive diff (wrap 4 existing call sites in the `esc()` that is
already imported and already used correctly nearby); it is being written up rather than
auto-applied only because the rules of engagement class this session as read-only on
`app.js`. Recommend applying it verbatim with `test-engine.js`/`test-parser.js` re-run
(neither touches this code, so no regression risk expected) before Monday.

---

## F2 — LOW — signup's 409 confirms an account name exists

**Note.** `POST /api/signup` returns `409 "That name is already taken."` when the name key
already exists (`accounts.js:159-161`), which lets anyone enumerate names one guess at a
time — confirmed in the baseline suite (`test-accounts.sh`, "duplicate name" check, still
passing). For a private board shared with a dozen people who already know each other's
names, this leaks nothing that isn't already common knowledge, and it does not compose
with F1 the way a name-based lockout would (an attacker still needs the exact name to do
anything with it, and now they can only *learn* names one at a time by guessing, not
attack an account once they have one). Not worth spending the fix budget on before Monday;
worth a one-line note if this board ever opens to people who don't already know each
other.

---

## F3 — checked and sound — expired/deleted session produces the right banner without losing the local draft

**Reproduction.**

```bash
NAME="expiry-test-XXXXX"
TOK=$(signup "$NAME" ...)
curl -s -X POST -H "Authorization: Bearer $TOK" $B/api/logout        # {"ok":true}
curl -s -i -X PUT -H "Authorization: Bearer $TOK" -d '{"rev":0,"state":"...","device":"test"}' $B/api/state
```

**Evidence.**

```
HTTP/1.1 401 Unauthorized
{"error":{"message":"Not signed in."},"signedOut":true}
```

`sync.js`'s `flush()` catches exactly this shape (`err.status === 401` → `SYNC.status =
"off"`, `notify("signedout", {})`, `sync.js:292`), and `app.js:4299-4303` renders "Your
sign-in expired, so nothing is being saved to your account. This device's copy is intact"
with a working "Sign in again" link to `index.html`. Nothing in that path touches
`localStorage.removeItem` on the draft key — the draft state key (`draftline.state.<id>`)
is untouched by a 401, only the session (`draftline.session`) is dropped by
`AUTH.logout()`, and only when `call()` in `auth.js` sees `data.signedOut` on a 401
(`auth.js:75`) — which the `/api/logout`, `/api/session`, and `/api/state` paths all set,
but `/api/login`'s own 401 (wrong password) deliberately does not, so a failed login
attempt cannot itself trigger a spurious sign-out.

---

## F4 — checked and sound — `PUT /api/state` size and shape, and the client's `looksLikeADraft` guard

**Reproduction — a literal `"<script>"` string as state:**

```bash
curl -s -i -X PUT ... -d '{"rev":0,"state":"<script>","device":"test"}' $B/api/state
# HTTP/1.1 200 OK  {"rev":1,"updatedAt":...}
curl -s ... $B/api/state
# {"rev":1,"updatedAt":...,"device":"test","state":"<script>"}
```

The server stores it verbatim, as documented (`accounts.js:24` doc comment: "PUT ... 512
KB up to). The client-side guard is what actually matters, and it works: `sync.js`'s
`looksLikeADraft()` (`sync.js:59-65`) does `JSON.parse(incoming)` and requires
`o.league.teams` and `Array.isArray(o.picks)`. `JSON.parse('<script>')` throws a
`SyntaxError`, `looksLikeADraft` catches it and returns `false`, and `hydrate()`
(`sync.js:174-181`) takes the branch that **does not adopt** the incoming state — it only
advances the local `rev` pointer so a later save can overwrite the poisoned entry. A device
that hydrates against this account never puts `"<script>"` into its own
`draftline.state.<id>` key, so it never reaches any renderer.

**Reproduction — a 500 KB string as state:**

```bash
node -e "fs.writeFileSync('big500k.json', JSON.stringify({rev:1,state:'A'.repeat(500*1024),device:'test'}))"
curl -s -i -X PUT ... --data-binary @big500k.json $B/api/state
# HTTP/1.1 200 OK  {"rev":2,...}
```

Accepted (under the 512 KB cap) and, same as above, `JSON.parse('AAAA...A')` throws, so
`looksLikeADraft` rejects it client-side too. A genuinely oversized body is rejected
server-side:

```bash
node -e "fs.writeFileSync('big600k.json', JSON.stringify({rev:2,state:'A'.repeat(600*1024),device:'test'}))"
curl -s -i -X PUT ... --data-binary @big600k.json $B/api/state
# HTTP/1.1 413 Payload Too Large
```

Both ends of this check out: the 512 KB server cap is enforced, and the client refuses to
adopt anything that doesn't parse into the minimal shape a real draft has, regardless of
size. Sound.

---

## F7 — checked and sound (with a margin note) — the pagehide keepalive flush against the 64 KB browser cap

**Method.** Built a realistic full 12-team, 15-round draft state (180 picks, 12 team
names, a full scoring-rules object with ~40 keys, playoff weeks, one keeper) plus a
200-entry `S.league.yahooAdp` store shaped exactly like `draftanalysis.js`'s output
(`{all, recent, pct, rank}` per player, keyed by normalized name), serialized it the way
`save()` does (`app.js:117-123`), and wrapped it the way `sync.js`'s `flush()` does for the
`PUT` body (`sync.js:262-266`).

```
200 yahoo rows -> state 28.4KB, PUT body 32.7KB
```

**Result.** 32.7 KB is roughly half of the 64 KB keepalive cap — comfortable headroom for
the scenario the brief specifies (a 200-row paste after a full draft). I also checked the
scaling, since Yahoo's Draft Analysis pages cover far more than 200 skill-position players
if someone pages through QB/RB/WR/TE fully:

```
267 yahoo rows -> state 33.3KB, PUT body 38.2KB
400 yahoo rows -> state 42.9KB, PUT body 49.1KB
500 yahoo rows -> state 50.2KB, PUT body 57.4KB
```

Even at 500 rows (more than the entire 267-player board, and more than a realistic
single-league paste session) the body stays under 64 KB, but the margin does compress —
57.4 KB is 90% of the cap. This is not a finding against the 200-row scenario the brief
asked about (checked and sound there), but it is a fact worth having in mind: if the
research board ever grows past ~267 players, or the pick log grows notes fields, or a
second device's `device` label plus retry metadata is ever added to the PUT body, the
margin at the high end of Yahoo-paste usage is not large. No action needed before Monday.

---

## F8 — checked and sound — rate-limit and spend counters are racy by design, and the race is bounded the way the comment claims

**Reproduction.** Set a throwaway local `.dev.vars` (`ANTHROPIC_API_KEY=dummy-local-test-key-not-real`,
deleted immediately after this test, never committed) so the proxy's rate-limit code path
executes before failing Anthropic's own auth check (which costs nothing — it 401s on the
key, no tokens are billed). Fired 20 concurrent `POST /` requests at local wrangler and
read the `rl:` counter directly out of local KV via wrangler's local explorer API:

```bash
for i in $(seq 1 20); do
  ( curl -s -o /dev/null --max-time 6 -X POST http://127.0.0.1:8787/ -H "Origin: http://localhost:8123" \
    -H "content-type: application/json" -d '{"messages":[{"role":"user","content":"hi"}]}' & )
done
wait
curl -s ".../storage/kv/namespaces/<LIMITS-id>/values/rl:unknown:<window>"
```

```
rl:unknown:29809450 => 21
```

(21 = 1 from an earlier single request in the same window + 20 from the burst — no
increments lost in this run.) `wrangler dev --local` runs a single JS isolate, so this test
under-represents real multi-colo concurrency, but it confirms the code path is exactly what
`index.js:183-186`'s comment describes: a plain `get` then `put`, no lock, no
compare-and-swap. The comment's claim — "for a handful of drafters that costs a few cents
of slippage... a fair trade against standing up a Durable Object for a counter" — is
structurally correct: because every racing writer computes its increment from its own
locally-read value and TTLs are short (`RATE_WINDOW * 2` for the limiter, 172800s/2 days
for spend), a lost update under-counts by at most the number of truly concurrent writers in
that instant, and the daily $50 ceiling means the worst case is a few dollars of overspend
in a pathological all-twelve-people-at-once scenario, never an unbounded runaway. Sound as
designed; not worth a Durable Object for this.

---

## F9 — checked and sound, flagged for a decision — `payload.system` is forwarded from the client, bounded only by length and the daily budget

**What the code does.** `index.js:169`: `system: typeof payload.system === "string" ?
payload.system.slice(0, 12000) : undefined`. There is no allowlist of system prompts —
whatever string the client sends becomes the system prompt sent to Sonnet 5 under the
owner's key, up to 12,000 characters. Confirmed by reading the code; not something to
"reproduce" beyond that reading, since exploiting it would mean spending the owner's key
for no test purpose, which the rules of engagement forbid.

**Recommendation (do not implement).** For a private board of a dozen friends who already
know the origin allowlist is a courtesy and not a security boundary, an attacker who wants
to spend the owner's key already can, at the pinned model and the per-IP/daily-budget
ceilings, regardless of what system prompt they send — the $50/day stop is the actual
backstop, not the prompt. What `payload.system` being open *adds* is that the money gets
spent on an arbitrary task the owner didn't design (someone else's chatbot, translation
service, etc.) rather than always being spent on Draftline's own four prompts. If that
distinction matters to the owner, the fix is for the Worker to hold `SYSTEM`,
`briefQuestion`'s template, `REPORT_SYSTEM`/`REPORT_SOLO_SYSTEM`, and `STYLE_SYSTEM` itself
and accept a `promptId` plus structured variables from the client instead of a raw string —
a bigger change (moves four prompt templates from `app.js` into `index.js`, and changes the
request shape `claudeOnce()` builds), which is exactly why this is a recommendation and not
a diff. For a dozen friends, I would not spend the time before Monday; the daily ceiling
already bounds the actual dollar risk to the same $50 either way.

---

## F10 — checked and sound — the password never appears in a URL, a log line, `console.log`, or the Worker's observability output

**Method.** Grepped `worker/src/accounts.js`, `worker/src/index.js`, and `assets/auth.js`
for `console.` and `password`. The password is read from the POST/PUT JSON body only
(`accounts.js:149`, `182`; `auth.js:102`, `112`) and is never assigned to a URL, a query
string, or passed to `console.log`/`console.error` anywhere in these files. There is no
other logging call in the accounts path. `wrangler.jsonc`'s `"observability": { "enabled":
true }` turns on Cloudflare Workers Logs, which records request metadata (method, URL,
status, and anything the Worker code explicitly logs) — it does not capture request bodies
unless the code logs them, and this code does not. Sound.

---

## Checked and sound, summary

- F3 — expired/deleted session → correct banner, local draft intact, login's own 401 does
  not trigger a spurious sign-out.
- F4 — `PUT /api/state`: 512 KB server cap enforced (413 above it); client's
  `looksLikeADraft` rejects any state that doesn't parse into the minimal draft shape,
  including a literal `"<script>"` and a 500 KB junk string — neither is ever adopted onto
  a healthy device.
- F7 — a realistic full draft plus a 200-row Yahoo paste is ~33 KB, about half the 64 KB
  keepalive cap. Margin note only, no action needed.
- F8 — the rate-limit/spend counter race is structurally as described in the code comment:
  bounded slippage, never a runaway, given the daily ceiling.
- F9 — behavior confirmed as documented; a real design decision for the owner, not a bug.
- F10 — no password leakage into any URL, log, or observability surface.
- Player-search field: does not reflect its raw query into HTML anywhere; a payload typed
  into search just returns "no matches."
- Account name (index.html's recent-names list, app.js's `#whoami`): escaped or
  `textContent`, sound.
- Style "why" string and Claude AI answer text: escaped where built into `innerHTML`, or
  set via `textContent` in the transport paths.
- Baseline `tools/test-accounts.sh` (26 checks: origin allowlist, signup rules, login,
  session, state round-trip, conflict, cross-account isolation, logout, proxy/API routing
  coexistence) — all passing before and after this pass.

## Findings index

| id | severity | one-line |
|---|---|---|
| F1 | BLOCKER | Anyone who knows the account name can lock the real user out for 15 minutes, from any IP but the user's own |
| F5 | MEDIUM | KV's real eventual consistency can beat the optimistic-revision check and silently drop a device's draft; not reproducible on local wrangler (its KV is strongly consistent), mechanism confirmed by reasoning from Cloudflare's documented KV model |
| F6 | MEDIUM/HIGH | Stored XSS via a team name in 4 `innerHTML` call sites that skip the `esc()` used correctly nearby |
| F2 | LOW | Signup's 409 confirms an account name exists |
| F7 | note only | Full draft + 200-row Yahoo paste is ~33 KB, half the 64 KB keepalive cap |
| F8 | note only | Rate-limit/spend counter race is real but bounded, as the code comment claims |
| F9 | recommendation only | `payload.system` is forwarded from the client; recommend the Worker hold the four prompts itself, do not implement |
| F10 | sound | No password leakage into URLs, logs, or observability output |
