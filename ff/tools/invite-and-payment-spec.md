# Draftline: invite codes, and paid signup

Status: **part 1 is built and tested** (worker/src/accounts.js, assets/auth.js,
index.html, tools/test-accounts.sh — 51/51 passing against a local Worker). Part 2
is spec only, and the "what money breaks" section below is the reason to think
before starting it.

Two separate things, and they should stay separate and ship in that order:

1. **Invite codes** — a one-use code is required to create an account. This is the
   spam gate, and it is worth building whether or not anyone ever pays.
2. **Paid signup** — $9.99 through PayPal (with the Venmo button) mints a code
   automatically. A code you already hold skips the payment entirely.

Part 1 is small and self-contained. Part 2 is a real integration with a business
account, fees, refunds and a webhook behind it, and it changes one of the app's
standing design decisions (see "What money breaks", below). Do not start it until
part 1 is deployed and a few people have signed up through it.

---

## Part 1 — invite codes

### The code itself

Eight characters from `23456789ABCDEFGHJKMNPQRSTVWXYZ` — no `0`, `1`, `I`, `L`,
`O`, `U`, because these get read off a phone screen and typed into another one.
Displayed as `XXXX-XXXX`; the hyphen is cosmetic and stripped on input.

That is 30^8 ≈ 6.6 x 10^11 codes. Against the failure limit below, guessing one is
not a thing that happens.

Normalization, applied identically in the browser and on the Worker: uppercase,
drop everything that is not in the alphabet, then require exactly 8 characters. A
typo that lands on an excluded character simply fails to match and gets the
ordinary "that code isn't valid" message — no clever look-alike mapping, because a
mapping table is one more thing that can disagree between the two ends.

### Storage

New key prefix in the existing **USERS** namespace, not a new namespace. A code is
durable data of the same kind as an account, and the comment in `wrangler.jsonc`
already draws the line in the right place: LIMITS is disposable, USERS is not.

    ic:<NORMALIZED CODE>  ->  {
      code:      "K7M2PQ4X",       // as issued, for display
      note:      "Dave from work", // free text, so the list is readable later
      source:    "manual" | "paypal",
      created:   1757000000000,
      expiresAt: 0,                // 0 = never; otherwise epoch ms
      maxUses:   1,
      uses:      0,
      usedBy:    [],               // [{ id, name, at, ip }]
      capture:   ""                // PayPal capture id, part 2 only
    }

No KV `expirationTtl` on the record even when `expiresAt` is set. An expired code
that still exists tells you what happened; one that has evaporated looks identical
to one that was never issued.

### Minting

Two ways in, both of which write the same record:

**Admin route** (the one to use):

    POST /api/admin/codes
    Authorization: Bearer <ADMIN_TOKEN>
    { count: 5, note: "league text thread", maxUses: 1, expiresDays: 0 }
    -> { codes: ["K7M2-PQ4X", ...] }

    GET /api/admin/codes  -> every code with its use record

`ADMIN_TOKEN` is a Worker secret (`npx wrangler secret put ADMIN_TOKEN`), 32 random
hex, and the route 404s — not 401s — when the header is missing or wrong, so the
existence of an admin surface is not advertised. Rate-limit it on the IP bucket
like everything else.

PowerShell, from anywhere:

```powershell
$h = @{ Authorization = "Bearer $env:DRAFTLINE_ADMIN_TOKEN"; "content-type" = "application/json" }
Invoke-RestMethod -Method Post -Uri "https://draftline-api.ken-lince.workers.dev/api/admin/codes" -Headers $h -Body '{"count":5,"note":"league text thread"}'
```

**Direct KV write**, as the escape hatch when the route is broken — write the JSON
to a file first, because quoting a JSON blob inline is its own small nightmare:

```powershell
npx wrangler kv key put --binding USERS "ic:K7M2PQ4X" --path .\code.json --remote
```

As built, the admin route is gated on the `ADMIN_TOKEN` secret and answers a
missing or wrong token with the same 404 an unknown route gives.

I can hand you code *strings* on request, but a string is not a code until it has a
record in KV — the Worker only knows about what it can read back. So either the
route or the `wrangler` call has to run.

### Redemption

`POST /api/signup` grows a required third field, `invite`, and the order of
operations inside the handler matters:

1. Normalize the code. Missing or malformed -> 400, "That signup code doesn't look
   right — it's eight characters, like `K7M2-PQ4X`." (This check is free and
   costs nothing to fail, so it happens before any KV read.)
2. Check the invite failure bucket for this IP. Over -> 429.
3. Existing name and password validation, unchanged.
4. Read `ic:<CODE>`. Missing, `uses >= maxUses`, or past `expiresAt` -> 403, one
   message for all three: "That signup code isn't valid, or it's already been
   used." Count a failure on the invite bucket.
5. Existing "name is already taken" check.
6. **Mark the code used first**, then create the account. If the account write
   throws, revert the mark.
7. Append `{id, name, at, ip}` to `usedBy` and return the session as it does today.

Step 6 is deliberately in that order. KV has no transaction, so two requests that
read the same unused code in the same instant can both pass step 4 — marking first
narrows that window to microseconds instead of the width of a PBKDF2 derivation,
which is ~100ms of wall clock at 100k iterations. It cannot close it, and for a
board shared with a dozen friends the failure mode (one code used twice) is worth
exactly nothing to an attacker and is visible in `usedBy` afterwards. Do not build
a Durable Object for this.

**Failure limit.** New bucket, `iv:<ip>`, and unlike the login name bucket this one
*may* refuse: 10 bad codes per IP per 15 minutes. The reasoning that makes the name
bucket advisory does not apply — an invite bucket keyed on IP cannot be aimed at a
victim, and there is no legitimate reason to get a code wrong ten times.

**Do not add a `/api/invite/check` endpoint.** Validating the code before the user
types a password would be marginally nicer, and it hands out a free oracle for
grinding the code space with no account creation attached. One round trip at the
end is fine.

### The form

`index.html`, inside the existing `#authBody`, a new `.field` that follows the same
pattern as `#confirmField` — present in the markup, `hidden` toggled by `setMode`,
shown only when `creating`:

```html
<div class="field hidden" id="codeField">
  <label for="authCode">Signup code</label>
  <input type="text" id="authCode" autocomplete="off" autocapitalize="characters"
         spellcheck="false" maxlength="9" placeholder="K7M2-PQ4X">
  <small class="dimtext" style="display:block;margin-top:6px">
    Draftline is invite-only right now. Ask Ken for a code.
  </small>
</div>
```

Changes around it:

- `setMode()` toggles `#codeField` on `creating`, same line as `#confirmField`.
- An `input` listener that uppercases, strips out-of-alphabet characters, and
  re-inserts the hyphen after four — so what the user sees always matches what
  gets sent.
- `go()` reads it and passes it through: `A.create(name, pw, code)`.
- The Enter-key listener list gains `authCode`.
- `authIntro` for create mode changes to name the code: *"Pick any name and any
  password, and enter the signup code you were given. It works on every device you
  draft from."*
- The "Used on this device" pill path is untouched — it only ever sets login mode.

`assets/auth.js`: `create(name, password, invite)` validates the shape client-side
(8 characters after normalizing) with the same message the server uses, so the
common typo never costs a round trip, and puts `invite` in the POST body.

### Migration

Existing accounts are unaffected — this only touches signup. Mint a handful of
codes before deploying so that nobody, including you, is locked out of making an
account the moment it goes live.

### Tests

`tools/test-accounts.sh` already covers signup and login against the deployed
Worker. Add: signup with no code (400), with a garbage code (403), with a good code
(200), with the *same* good code a second time (403), and confirm the account from
the successful case can still log in afterwards.

---

## Part 2 — paid signup

Short answer to the question as asked: **yes for PayPal and Venmo together, no for
"no charges."** Those two can't both be true.

### What is actually available

Venmo has no standalone merchant API for a website. The only way to take Venmo on a
web page is as a funding source inside **PayPal Checkout**, which needs a PayPal
**Business** account with Venmo enabled (a personal account upgrades in place, free,
a few minutes). One integration then gets you the PayPal button, the Venmo button
and card entry.

The zero-fee path — a `paypal.me/...` link and your `@venmo` handle, paid
friends-and-family — has no API, no webhook and no way for the page to know a
payment happened. It is also, for something you are selling, against PayPal's terms
and leaves both sides with no protection. It is a fine *manual* option (see below),
but it cannot gate anything automatically.

### Fees, plainly

PayPal standard checkout in the US is 3.49% + $0.49 on a $9.99 charge, so about
**$0.84**, leaving roughly **$9.15**. Venmo through PayPal is priced the same.
There is no configuration that removes this. If you take money through a processor,
the processor takes a cut; the only question is whose.

(For completeness: Stripe Checkout is a noticeably smaller integration for exactly
this shape and costs about the same — but it has no Venmo. You asked for Venmo, so
this spec is PayPal.)

### Flow

    +- index.html, "Create an account" -----------------------------+
    |  Have a code?  -> type it, sign up, done. Never sees PayPal.  |
    |  No code?      -> "Get access, $9.99" -> PayPal / Venmo / card|
    |                    -> code appears, form auto-fills           |
    +---------------------------------------------------------------+

Payment mints a code. Signup consumes a code. The two halves never touch each
other, which is what makes this cheap: part 1 is the only thing the signup handler
knows about, and paying is just another way a record lands in `ic:`.

### Wiring

Page: PayPal's JS SDK, loaded only when the user opens the payment panel, so the
signup screen for someone holding a code stays as fast as it is today:

    https://www.paypal.com/sdk/js?client-id=<PUBLIC>&currency=USD&enable-funding=venmo

Worker, three new routes:

- `POST /api/pay/order` -> creates the PayPal order server-side with the amount
  **pinned at 9.99 in the Worker**. The client never sends an amount. Returns the
  order id.
- `POST /api/pay/capture {orderID}` -> captures, verifies `status === "COMPLETED"`
  and that the captured amount is exactly 9.99 USD, mints an `ic:` record with
  `source:"paypal"` and the capture id, and returns the code. Keyed on capture id
  for idempotency, so a double-submit returns the same code instead of a second one.
- `POST /api/pay/webhook` -> PayPal's `PAYMENT.CAPTURE.COMPLETED`, signature
  verified against `PAYPAL_WEBHOOK_ID`. This is the backstop for the person who
  pays and then closes the tab before the capture call returns: the code exists
  either way, and they can retrieve it. Same idempotency key, so whichever of the
  two paths arrives second is a no-op.

Also worth handling: `PAYMENT.CAPTURE.REFUNDED` -> revoke the code, and if it has
already been redeemed, disable the account it made.

Config: `PAYPAL_CLIENT_ID` and `PAYPAL_WEBHOOK_ID` as vars in `wrangler.jsonc`
(both are public), `PAYPAL_SECRET` as a Worker secret. Build against
`api-m.sandbox.paypal.com` first; the base URL is one constant.

### Venmo caveats

US only. The Venmo button appears only when PayPal decides the browser and buyer
qualify — on mobile it hands off to the Venmo app, and on some desktop browsers it
does not show at all. Design the panel so that it is PayPal-or-card with Venmo as a
bonus when it renders, not a layout with a Venmo-shaped hole in it.

### What money breaks

This is the part worth thinking about before anything gets built.

**The "no password reset" stance stops being defensible.** It is a reasonable trade
for a free board shared with friends — the sign-in copy says so plainly and it is
honest. It is not a reasonable trade for something someone paid $9.99 for. They
forget the password, they have lost the thing they bought, and you have no way to
identify them as its owner. If payment ships, signup needs an email on file, or at
minimum the paid path needs to record the PayPal payer email against the code so
there is *something* to match a person to. That is a change to `accounts.js`, to the
sign-in copy, and probably to `index.html`'s closing paragraph.

**Claude spend becomes cost of goods.** At roughly a cent a question, $9.99 covers
a drafter many times over, so the economics are not close. But the $50/day runaway
stop in `worker/src/index.js` now has paying customers behind it, and its message
("something is looping rather than that people are asking a lot of questions")
would be read by someone who paid. Worth an alert on it if money is involved.

**Refunds, and a sentence about what is being sold.** Once there is a price there
needs to be a line on the page saying what $9.99 buys and for how long — one draft?
one season? forever? — because that is the first thing anyone will ask, and the
answer determines whether a code should carry an expiry.

---

## Recommended order

1. Build part 1. It is maybe 150 lines across `accounts.js`, `auth.js` and
   `index.html`, and it solves the actual problem in the request: nobody in the
   wild can make an account and start spending your API key.
2. Take money manually for a while if you want to: put `paypal.me/<you>` and your
   Venmo handle on the page, and mint a code by hand when someone pays. Zero code,
   and it tells you whether anyone pays at all before you build a checkout.
3. Build part 2 only if step 2 gets enough volume that minting by hand is annoying.
