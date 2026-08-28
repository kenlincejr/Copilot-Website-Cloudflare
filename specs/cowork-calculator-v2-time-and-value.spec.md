# specs/cowork-calculator-v2-time-and-value.spec.md — Cowork calculator, v2: time, value, and three defects

**Status:** Pre-build diff spec. Authored 2026-08-28, for hand-off to a dedicated build chat.
**Target file:** [`cowork-calculator.html`](../cowork-calculator.html) — **edit in place**, single self-contained file.
**Baseline:** `origin/main` at `7c398f5`. Do not start from an older copy.
**Depends on:** [`specs/cowork-calculator.spec.md`](./cowork-calculator.spec.md) (the original product spec — still the authority on tone, provenance rules and non-goals), [`DESIGN.md`](../DESIGN.md), [`coworksession40.html`](../coworksession40.html), [`azure-billing-setup.html`](../azure-billing-setup.html) (**the** authority on Azure plan mechanics — see §5).
**Supersedes nothing.** This is additive.

---

## Why

The tool answers *"what will Cowork cost this customer per month, and can this tenant even buy it."* It answers that well. Six things it does not do, in the order they hurt:

1. **It has no time axis.** Every annual and three-year figure is a steady-state month multiplied by 12 or 36. No rollout works that way, and one consequence is not a modelling simplification but a defect — see §1.
2. **It is entirely about cost.** A consumption conversation that is only about cost is one the partner loses on price.
3. **It produces an estimate, not a configuration.** It tells the partner to "size a tenant limit to the high end above" and then makes them do the arithmetic and the translation into Microsoft's admin surface.
4. **It asks whether the customer already pays for AI and throws the answer away.**
5. **Its partner-economics blocks assume the partner holds the Azure billing account.** An indirect reseller does not, and will be shown a PEC calculation that cannot apply to them (§5).
6. **`/cost` is mentioned in three places and operationalised in none of them** — and the calibration control will stamp `measured` provenance on Microsoft's own modelled defaults (§6).

Six features, built in this order. F1, F5 and F6 each carry a defect; F2–F4 are additive. F1 must land first.

---

## 0. Ground rules that already govern this file

The build chat must read these before touching anything. They are not negotiable and the existing code follows them consistently.

**0.1 — Provenance or silence.** Every number carries a tag: `ms-verified`, `measured`, `partner`, `ms-modeled`, `editorial` (see `RANK` / `weakest()` at the top of the engine). Anything new that is not a published Microsoft figure gets `editorial` or `ms-modeled` and an entry in the assumptions card. Never present an editorial number as Microsoft's.

**0.2 — Withhold rather than guess.** Established twice already in this file: license margin is `null` unless a cost is set on *every* seat-bearing line (`costPartial`), and meter margin is `null` unless the PEC question is answered (`pecKnown`). New derived figures that depend on an unanswered question follow the same rule — return `null`, render an explanation, do not substitute a default and call it an answer.

**0.3 — Never put words in the customer's mouth.** The governance block distinguishes "you told us", "nobody was sure" and "not asked" with three different sentences. Any new question inherits this.

**0.4 — `compute()` is pure and total.** No DOM, no I/O, no `Date.now()`. It deep-copies its input, never mutates the caller's state, never throws, and always returns a trace. There are 239,685 fuzz assertions relying on this. Keep it true.

**0.5 — The customer print is a different document.** `body.print-customer` strips `.deriv`, `.ribbon-deriv`, `.pill`, `.partner-only`, `.whybox`, `#cardTalk`, `#cardNext`, `#cardBilling`, `#cardRecap`, `#basisBar`, `#assumeCard`. Note `.whybox` is coarser than it looks — it hides *all* explainer boxes, including customer-safe ones. Decide per block, and state the decision in a comment.

**0.6 — Two multiplication sites, not one.** There is exactly one place outside `compute()` that annualizes: `p3RiskBlock()` does `usd((c.monthlyCowork - c.coworkLo) * 12)`. F1 must fix that too or the risk block will disagree with the card above it.

---

## 1. F1 — The adoption ramp

### 1.1 The defect

`cccuRequired = monthlyCredits × 12 ÷ 100`, and `renderBillOut()` prints, in bold:

> **What you can say with certainty:** this account needs a **90,600 CCCU** commit for a year of Cowork at these volumes. Take that number to your TD SYNNEX sales rep.

Said with certainty, and true only if the tenant reaches full adoption in month one and stays there. At stock defaults (52 active users), a linear ramp from a 25-user pilot gives a year-one need of:

| Ramp length | Year-one seat-months | vs steady state | Year-one CCCU need | Over-commit if you buy 90,600 |
|---|---|---|---|---|
| 6 months | 543 | 87% | 78,900 | 11,700 CCCU |
| 12 months | 462 | 74% | 67,000 | 23,600 CCCU |

A Copilot Credit P3 is non-cancellable, non-exchangeable and auto-renewing — the tool now says so in `p3RiskBlock()`. So the tool warns about an exposure and then, three paragraphs earlier, tells the partner to buy 24,000 CCCU more of it than year one needs. **That contradiction is the reason F1 goes first.**

### 1.2 State

```js
// A rollout is a curve, not a step. Only the active population ramps —
// credits per active user are a property of the person, not the calendar.
ramp: { mode:'linear', pilotSeats:25, months:6 }
```

- `mode`: `'linear'` | `'none'`. `'none'` reproduces today's behaviour exactly (year one = 12 × steady). Ship with `'linear'`.
- `pilotSeats`: default 25, matching the Copilot in 30 trial the tool already recommends. Clamp to `[0, basisSeats]`.
- `months`: default 6. Clamp to `[1, 24]`. `months === 1` means full adoption in month one and must produce exactly the `'none'` result.

Add to `defaults()`; `hydrate()` handles old sessions automatically.

### 1.3 Engine contract

Compute a 12-element seat vector, then derive everything from it.

```
seats(m) for m = 1..12:
  if mode === 'none' or months <= 1 : basisSeats
  else: min(basisSeats, pilotSeats + (basisSeats - pilotSeats) * (m - 1) / (months - 1))

rampSeatMonths  = Σ seats(m)                      // m = 1..12
steadySeatMonths = basisSeats * 12
rampFactor      = steadySeatMonths > 0 ? rampSeatMonths / steadySeatMonths : 1
```

`rampFactor` is the single scalar everything year-one derives from. Credits per active user do not change with time, so this is exact, not an approximation — say so in a comment.

**New `ctx` fields:**

| Field | Value | Notes |
|---|---|---|
| `rampFactor` | as above, `1` when `mode:'none'` | always finite, always in `(0, 1]` |
| `rampSeats` | the 12-element array | for the month-by-month table in §1.5 |
| `year1Credits` | `Math.round(annualCredits * rampFactor)` | |
| `year1Cowork` | `year1Credits * CU` | customer-facing rate |
| `year1PaygoAnnual` | `year1Credits * CONST.CREDIT_USD` | Microsoft's rate — the P3 comparison basis |
| `year1AllIn` | `year1Cowork + licenseMonthly * 12` | **licenses do not ramp** — see §1.4 |
| `cccuYear1` | `year1Credits / 100` | |
| `rampApplies` | `rampFactor < 0.999` | gate for showing ramp-specific copy |

**Keep `annualCredits`, `paygoAnnual`, `cccuRequired`, `allInAnnual` exactly as they are** — they are now explicitly the *steady-state* figures and every existing consumer stays correct. Rename nothing in `ctx`; add alongside. This keeps the diff reviewable and the fuzz suite honest.

### 1.4 The judgment call the build chat must not get wrong

**Licenses do not ramp.** The customer pays for the Copilot seats they hold whether or not those people have turned Cowork on — that is the whole point of the idle-license line the tool already surfaces in step 3. Only the meter ramps. `year1AllIn` therefore ramps the Cowork half and not the license half. If a future version wants a license ramp it needs its own question, and it is out of scope here.

### 1.5 What changes in the output

**a) The P3 sizing line — the fix.** In `renderBillOut()`, replace the "with certainty" paragraph. When `rampApplies`:

> **Size the commit to year one, not to steady state.** At full adoption this account runs **90,600 CCCU** a year. It will not be at full adoption for the first six months — ramping from 25 users to 52, year one needs about **78,900 CCCU**. Buy the steady-state number and you have pre-paid **11,700 CCCU** you cannot get back, on a plan that auto-renews. Take the year-one figure to your TD SYNNEX rep and re-size at renewal, when you will have real numbers.

The bolded "certainty" framing must go. What is certain is the arithmetic, not the adoption curve.

**b) `cardNumber` cells.** `numAnnual` becomes **Year one** showing `year1AllIn`, with the derivation naming the ramp. Add a sub-line giving the steady-state year. `numThree` becomes `year1AllIn + 2 × allInAnnual` — year one ramped, years two and three steady — and its label says so.

**c) `p3Exposure` and the risk block.** `p3Prepay` is derived from `commitCccu`, which is derived from `annualCredits`. Once the recommendation is year-one-sized, the exposure figure must follow whichever basis the partner is actually being told to buy. Specify: `p3Exposure` continues to reflect *the commit as configured on the billing step*, and the risk block gains one sentence when `rampApplies` and the configured commit exceeds `cccuYear1` — naming the gap in dollars. Fix the inline `* 12` at the same time (§0.6): the shortfall sentence should use `year1Cowork` versus the ramped low band, not `(monthlyCowork - coworkLo) * 12`.

**d) Step 6 UI.** Two controls under the existing billing fields: **pilot size** (number) and **months to full adoption** (number), plus a small inline sparkline or 12-cell strip rendering `rampSeats`. Follow `renderBill()`'s existing pattern; these are number inputs so they need a `patchBill()` on the `focusIn('billBlock')` path — note `refresh()` currently does `if (!focusIn('billBlock')) renderBill(r);`, which means the block simply does not update while focused. That is acceptable today because the block has no derived read-outs. Once the seat strip is in there, it is not. Add `patchBill()`.

**e) `ECHO.step6`.** Currently quotes `paygoAnnual` and `cccuRequired`. Switch to the year-one pair when `rampApplies`, and say "year one".

**f) Assumptions card.** When `rampApplies`, push an assumption: the ramp shape is editorial, the pilot size and length came from the partner, and year one is a projection while steady state is the model.

### 1.6 Invariants (must be asserted in the test harness)

1. `mode:'none'` ⟹ `rampFactor === 1` ⟹ `year1Credits === annualCredits` exactly.
2. `months === 1` produces the identical result to `mode:'none'`.
3. `pilotSeats >= basisSeats` ⟹ `rampFactor === 1`.
4. `0 < rampFactor <= 1` for every input, including `basisSeats === 0`, `pilotSeats` negative, `months` non-integer or garbage.
5. `year1Credits <= annualCredits` always.
6. `cccuYear1 <= cccuRequired` always.
7. `rampSeats` has exactly 12 elements, each finite, monotonically non-decreasing, each `<= basisSeats`.
8. No rendered string anywhere contains `NaN` or `undefined` under the full fuzz.
9. Greenfield (`copilotLicensed === 0`) still produces `$0` and no ramp copy.

---

## 2. F2 — Break-even, in minutes per person per day

### 2.1 What it is

Division, presented at the point in the conversation where the customer is looking at a monthly number and deciding whether it is large. Nothing here is a savings claim and nothing cites a study. The tool computes what the customer is already paying per person per working day, and hands the partner a table so the *customer* supplies the labour rate.

### 2.2 Engine contract

Add `CONST.WORKING_DAYS_PER_MONTH = 21` (currently a bare `21` inside `scenarios()` — hoist it and reference it from both places).

```
perUserPerDayAllIn = basisSeats > 0 ? allInMonthly / basisSeats / WORKING_DAYS : 0
perUserPerDayMeter = basisSeats > 0 ? monthlyCowork / basisSeats / WORKING_DAYS : 0
```

Both `ms-modeled` in provenance terms — they inherit the credit model's confidence — but the *division* is exact and the copy should make that distinction: the input is modelled, the arithmetic is not.

Break-even minutes at a loaded hourly rate `h`: `perUserPerDay / h * 60`.

Optional state: `value: { loadedHourly: null }`. Null by default. When set, the matching row is highlighted and a sentence names it. When null, the table shows four reference rates and no recommendation.

### 2.3 The block

New results card, `#cardValue`, placed **immediately after `#cardNumber`** — before "what if they use it more". The order matters: the customer sees the cost, then the frame, then the upside scenarios.

**Customer-visible. Do not mark `partner-only` and do not wrap it in `.whybox`** (that class is stripped from the customer print — see §0.5). This block is the reason the print exists.

Content, at stock defaults:

> **$198.65 per person per month. $9.46 per working day.**
>
> That is licences and meter together, across 52 people, over 21 working days. Whether it is expensive depends on one number this tool does not have — what an hour of their people's time is worth.
>
> | If an hour costs | Cowork pays for itself at |
> |---|---|
> | $50 | 11 minutes saved per person per day |
> | $75 | 8 minutes |
> | $100 | 6 minutes |
> | $150 | 4 minutes |
>
> *This is division, not a savings estimate. The tool has no view on whether those minutes are real — that is the question to ask in the room, and it is a better question than "is this expensive".*

**Copy rules for this block, which the build chat must hold the line on:**
- Never state or imply hours saved. The table is conditional in both directions.
- Never cite Forrester, Microsoft productivity claims, or any TEI figure. The moment this block cites a benefit study it becomes indefensible and the tool loses the thing that makes it worth using.
- The closing italic line, or something with the same job, stays.

### 2.4 Invariants

1. `basisSeats === 0` ⟹ block suppressed entirely, no division by zero anywhere.
2. `perUserPerDayAllIn * basisSeats * 21 === allInMonthly` to within floating-point tolerance.
3. Break-even minutes finite and positive for every rate in the table, for every fuzz case that renders the block.
4. Block is present in `print-customer` output (assert the class list, not computed style — the print rules live inside `@media print`).

---

## 3. F3 — The Cost Management settings block

### 3.1 What it is

The tool's own scenarios card says "a tenant-level monthly spending limit sized to the high end above" and "per-user limits with email alerts at 50% and 80%". It never produces the numbers. This block does, in a form the partner can read straight into the M365 admin center.

### 3.2 Engine contract

```
// Tenant cap: the top of the band, so a normal bad month does not trip it.
tenantLimitMonthly = roundUpTo(coworkHi, 100)

// Per-user cap: derived from the HEAVIEST persona in the mix, not the average.
// A cap set on the average punishes the legitimate power user, which is the
// one thing that will get the whole policy switched off.
heaviestPersonaUsd  = max over personas with seats > 0 of (effectiveCredits(p) * CU)
perUserLimitMonthly = roundUpTo(heaviestPersonaUsd * PER_USER_HEADROOM, 5)
```

`CONST.PER_USER_HEADROOM = 1.5`, tagged **editorial**, with the reasoning in a comment: the cap exists to catch runaway automation, not to shape normal behaviour, so it sits above the heaviest legitimate persona with room to spare.

Worth knowing while building this: at stock defaults the heaviest persona is Technical at **$228.00/month**, which is exactly the top of Microsoft's published $82–$228 per-user range (`CONST.PER_USER_RANGE.hi`). That is a coincidence of the default tier weights rather than a derivation, but it means the per-user cap is anchored just above Microsoft's own published ceiling — which is a good sentence to have available and a bad one to over-claim. Do not assert a relationship the model does not have.

Also expose `tenantLimitFirstMonth` = `roundUpTo(coworkHi * (rampSeats[0] / basisSeats), 100)` when `rampApplies` — because setting the steady-state cap on day one defeats the purpose of having one.

New `ctx` fields: `tenantLimitMonthly`, `tenantLimitFirstMonth`, `perUserLimitMonthly`, `heaviestPersonaName`, `heaviestPersonaUsd`.

### 3.3 The block

New results card `#cardControls`, placed **after `#cardBilling`**. Customer-visible — the customer should see the guardrails being proposed; that is the point of proposing them.

> **Set these in Microsoft 365 admin center → Copilot → Cost Management.**
>
> | Setting | Value | Why this number |
> |---|---|---|
> | Tenant monthly limit | **$9,900** | Top of the ±30% band. A busy month should not trip it; a runaway should. |
> | — for the first month | **$4,800** | Sized to the 25-user pilot, not to full adoption. |
> | Per-user monthly limit | **$345** | 1.5× the heaviest persona in this mix (Technical, $228/mo). Catches automation, not power users. |
> | Alert thresholds | **50% and 80%** | To the named cost owner. Weekly once tripped. |
> | Review cadence | **Monthly** | Concentration check, top five users, re-forecast. |
>
> A "Copy these settings" button, following the `btnCopyTalk` pattern.

If `governance.namedCostOwner !== 'yes'`, add a line: the alerts need a destination, and nobody has named one.

Under it, a partner-only note tying this to the retainer — the ladder's rung 3 is exactly this work, done monthly.

### 3.4 Invariants

1. `tenantLimitMonthly >= coworkHi` always.
2. `perUserLimitMonthly >= heaviestPersonaUsd` always.
3. `tenantLimitFirstMonth <= tenantLimitMonthly` always.
4. Zero personas with seats, or `basisSeats === 0` ⟹ block suppressed, no `Infinity`, no `-Infinity` from an empty `max`.
5. Every rendered value is a rounded currency string, never a raw float.

---

## 4. F4 — What they already spend on AI

### 4.1 What it is

`state.org.competingAi` is already asked and currently feeds exactly one thing: a Defender for Cloud Apps requirement. If the answer is yes, there is a real number sitting on the customer's credit card and the tool should put it on screen.

### 4.2 State

```js
shadowAi: { tool:'', seats:null, usdPerSeat:null }
```

All null by default. The block renders only when `org.competingAi === 'yes'` **and** both numbers are set. Otherwise, when `competingAi === 'yes'` and the numbers are absent, render a one-line prompt to go and get them — that is a discovery task, and naming it is more useful than hiding the block.

### 4.3 Engine contract

```
shadowMonthly = seats * usdPerSeat        // null unless both set
shadowAnnual  = shadowMonthly * 12
```

`partner` provenance — the partner entered it.

**Do not net it against the Cowork figure.** Do not compute a "saving". The tool does not know that Cowork replaces the other tool, and claiming it does is the kind of unearned assertion §0.1 exists to prevent. Present them side by side and let the partner make the argument.

### 4.4 The block

Inside `#cardNumber`, below the seat-vs-meter split bar. Customer-visible.

> They are already spending **$1,200 a month** on AI — 40 seats of ChatGPT Team at $30 — outside the tenant, outside Purview, and outside anything you can see. The Cowork meter models at **$7,550 a month** for 52 people inside the tenant. Those are different products and this is not a like-for-like swap, but it is the number that belongs next to this one.

And a partner-only line: this figure is the Shadow AI Assessment's opening, and the next-step engine should reference it. If `competingAi === 'yes'`, the existing `nextStep()` rule ordering already tends toward rung 1 — verify it still fires and add the dollar figure to the opener when present.

### 4.5 Invariants

1. Either number missing ⟹ `shadowMonthly === null` and no dollar figure rendered anywhere.
2. Negative or garbage input clamps to 0 or nulls out; never renders a negative spend.
3. `competingAi !== 'yes'` ⟹ block absent regardless of stored numbers.

---

## 5. F5 — Azure billing reality: motion, PEC contingency, markup visibility

### 5.1 Scope discipline — read this before writing any code

This repo already has a complete Azure billing asset: [`azure-billing-setup.html`](../azure-billing-setup.html), 16 sections covering the purchase flow, MCA acceptance, RBAC, budgets, the error playbook, partner-to-partner transfers and a tribal-knowledge section. **This spec adds none of that to the calculator.** Three things come in because they change a number or invalidate a block the calculator already renders. Everything else is a link.

**Explicitly out of scope, link only:** MCA acceptance flow, subscription and resource-group placement, billing region, Azure-side budgets and alerts, legacy MOSA subscriptions, EA scenarios, partner-to-partner transfers, RBAC/GDAP setup, the error playbook.

### 5.2 The correction this section exists to carry

An earlier draft of the partner-economics work in `origin/main` was built on the premise that a CSP partner sets their own price on Cowork consumption. That is true of the *commercial relationship* and misleading about the *mechanism*. [`azure-billing-setup.html` §8](../azure-billing-setup.html) states it correctly:

> There's no manual markup slider on Azure plan consumption. Instead, partners earn margin through Partner Earned Credit (PEC) — a credit tied to the partner retaining active admin permissions on the customer's tenant, rather than to a price you set.

Both layers are real: the partner owns the billing relationship and invoices through their own PSA, so an uplift is possible. But Microsoft hands you no markup field, and the designed margin path is PEC. **The calculator currently presents `creditSellUsd` as a neutral peer of list pricing. It should carry the channel reality.** That reframing is part of this feature, not a copy nicety.

### 5.3 F5a — Which CSP motion (the correctness fix)

Every block added in `7c398f5` — `partnerCostBlock()`, the V-21 inversion warning, `paygoPartnerCost`, `meterMarginAnnual` — assumes the partner holds the Azure billing account. An **indirect reseller** does not; the indirect provider does. No PEC accrues to them, they cannot set the meter rate, and someone else creates the subscription. On a TD SYNNEX-oriented site a large share of readers are indirect resellers, and the tool will currently show them a margin calculation that cannot apply.

**State:**
```js
org: { …, cspMotion:'unsure' }   // 'direct' | 'indirectProvider' | 'indirectReseller' | 'unsure'
```

**Behaviour:**

| `cspMotion` | PEC question | Partner-economics blocks |
|---|---|---|
| `direct`, `indirectProvider` | asked as today | render as today |
| `indirectReseller` | **suppressed** — force `pecKnown === false` | replaced by a short block: the billing relationship sits with your indirect provider, so PEC and the meter rate are theirs, not yours. Your margin here is services. Link to [`azure-billing-setup.html` §3](../azure-billing-setup.html). |
| `unsure` | asked, but the cost block leads with the caveat | render with the motion named as unconfirmed |

Add to `ctx`: `cspMotion`, `holdsBillingAccount` (`cspMotion === 'direct' || cspMotion === 'indirectProvider'`).

`pecKnown` must become `false` when `!holdsBillingAccount`, so §0.2 does the rest automatically and every margin figure withholds itself with no new branching in the render layer.

**Where the question goes:** step 7, alongside the existing `azureCspPlan` question — it is the same conversation. Fold MCA into that question's helper copy rather than adding one: *an Azure plan implies the customer has accepted the Microsoft Customer Agreement; if there is no plan yet, MCA acceptance is the first step, and [the setup guide](../azure-billing-setup.html) walks it.*

### 5.4 F5b — PEC is contingent and fails silently

No new question. A caveat on the answer already given, from [`azure-billing-setup.html` §12](../azure-billing-setup.html):

> Partner Earned Credit can stop accruing without any alert.

PEC is tied to retained admin access on the customer's tenant. Lose GDAP and the credit stops, with no notification. The calculator prints a PEC-adjusted annual cost basis as though it were stable; when `pecStatus === 'yes'`, `partnerCostBlock()` gains one sentence saying it is contingent on retained access and stops silently if that access lapses, with a link.

Also add an assumption-card entry so it survives into the internal print.

### 5.5 F5c — Markup is visible

Cost Management lives in the **customer's** M365 admin center. They see their own credit counts — "Total Copilot Credits used", per-user consumption, the `/cost` figure in-product — and Microsoft publishes $0.01 a credit. The multiplication is available to anyone who wants it.

When `sellMode && creditUsd !== CONST.CREDIT_USD`, raise a warning (not a block — this is a legitimate choice, made with open eyes):

> You are billing the meter at $0.014 a credit against Microsoft's published $0.01. The customer can see their own credit consumption in their admin center, so treat this as a visible uplift, not a hidden one — and decide now how you would answer if they raise it.

This extends the existing `pricing-credit` assumption rather than replacing it.

### 5.6 F5d — MACC, one line, conditional

When `copilotLicensed >= 300`, one line in the billing card: an existing Azure Consumption Commitment can absorb eligible Copilot consumption if the subscription is under the billing account holding the commitment. No modelling, no input, no draw-down calculation. One line and a link. Below 300 seats it does not render.

### 5.7 Invariants

1. `cspMotion === 'indirectReseller'` ⟹ `pecKnown === false` ⟹ `partnerCostAnnual === null` and `meterMarginAnnual === null`, regardless of what `pricing.pec.status` says.
2. Changing `cspMotion` never changes any customer-facing figure — `monthlyCredits`, `monthlyCowork`, `licenseMonthly`, `paygoAnnual`, `cccuRequired` are all invariant to it.
3. The V-21 inversion warning cannot fire when `!holdsBillingAccount`.
4. MACC line absent below 300 Copilot seats, present at or above.
5. Markup warning fires if and only if `sellMode && creditUsd !== 0.01`.

---

## 6. F6 — Make `/cost` do some work

### 6.1 The bug, first

`calApply` (in `renderEffort`'s calibration block) does this:

```js
$('calApply').addEventListener('click', function () {
  var before = E.compute(state).ctx;
  state.calibrated = true;
  …
```

Unconditionally. The three calibration inputs **are** the modelled defaults — 125 / 500 / 1200 — so a partner can click "Use my measured numbers" without touching a field and receive: a band tightened from ±30% to ±15%, a `measured` provenance tag on trace rows F10, F11, B1 and B2, a `Measured ±15%` pill on the ribbon, and a toast reading *"Three tasks bought you that."*

The tool would be stamping `measured` on Microsoft's modelled defaults. That is the single thing this file's provenance system exists to prevent.

**Fix:**
- Hoist the defaults to `CONST.TIER_DEFAULT = { light:125, medium:500, heavy:1200 }` and reference it from `defaults()` and from `calReset` (which currently hardcodes them a second time).
- `calApply` sets `calibrated = true` only if at least one tier value differs from `CONST.TIER_DEFAULT`. Otherwise it does not calibrate, does not fire the toast, and says so: *nothing here has changed from the modelled defaults, so there is nothing to calibrate yet.*
- The engine should not trust the flag either. If `state.calibrated === true` while all three tiers equal the defaults, treat it as uncalibrated and raise a warning — a loaded session file can set the flag directly.

### 6.2 The capture sheet

The tool tells the partner to go and measure and gives them nowhere to write it down. It also recommends 90 days on PayGo before committing, and F1 says size the commit to year one. The thing that closes both loops is measured data at day 90, and nothing currently connects "go measure" to "come back and re-size."

**A third print mode.** Follow the existing `body.print-customer` / `body.print-internal` pattern exactly (CSS at `@media print`, buttons at the bottom of the results screen): add `body.print-capture`, which hides everything except a new `#captureSheet` block.

**Content — one page:**
- Account name and the date the estimate was produced.
- What the model currently says, in one line, so the returning numbers have something to be compared against: *modelled at 755,000 credits a month, $5,285–$9,815, ±30% because this is modelled.*
- Instructions: open a task in Cowork chat, type `/cost`, write the number down. Reproduce the two caveats already in step 5 — `/cost` reports only what a task has **already** used, and it is an in-product approximation, not the billing record.
- A table with **nine blank rows**, three per tier, each with: what the task was, which tier it felt like, credits reported. Three samples per tier, because one is an anecdote.
- A closing line: bring these back and re-run the calculator; the band tightens to ±15% and the commit gets sized on measurement instead of a model.
- Print-only, never rendered on screen except as the button.

**Do not** build multi-sample averaging, variance capture, or usage-data import in this pass. The sheet is paper. The partner types three numbers into the existing three fields.

### 6.3 Wiring `/cost` into the P3 timing

Small, and it completes the argument the tool is already making. In `renderBillOut()`, the "stay on PayGo for the first 90 days" recommendation gains a second clause when `!state.calibrated`: the day-90 action is to re-run this with measured numbers, and the capture sheet is how you get them. When `state.calibrated` is genuinely true, the recommendation changes tone — they have real data, so the commit conversation is live.

### 6.4 Invariants

1. `calibrated` cannot become `true` while all three tiers equal `CONST.TIER_DEFAULT`, by any path — button, loaded session, or hand-edited state.
2. `calibrated === true` ⟹ band is `CONST.BAND.measured` and F10/F11/B1/B2 carry `measured` provenance. `false` ⟹ `modeled` / `ms-modeled`. No third state.
3. `calReset` returns tiers to exactly `CONST.TIER_DEFAULT` and `calibrated` to `false`.
4. The capture sheet renders with the account name absent (unnamed account) and with zero active users, without throwing.
5. `print-capture` shows `#captureSheet` and nothing else; `print-customer` and `print-internal` never show it.

---

## 7. Build order and gates

| # | Feature | Gate before moving on |
|---|---|---|
| 1 | F1 ramp | All §1.6 invariants pass. The P3 "certainty" line is gone. The inline `*12` in `p3RiskBlock()` is gone. Existing 278-check, 74-check and 14-check suites still pass unchanged. |
| 2 | F2 break-even | §2.4 passes. Block confirmed present in customer print. No benefit claim anywhere in the copy. |
| 3 | F3 controls | §3.4 passes. Values reconcile with the band and persona figures shown elsewhere on the page. |
| 4 | F4 shadow AI | §4.5 passes. No netting, no implied saving. |
| 5 | F5 Azure reality | §5.7 passes. An indirect reseller sees no PEC figure by any path. No Azure setup content duplicated from the existing asset — links only. |
| 6 | F6 `/cost` | §6.4 passes. `calibrated` cannot be reached without real edits. Capture sheet prints clean on one page. |

**Do not batch.** Each lands and is verified before the next starts.

F1 first because it is a live contradiction. F5 and F6 could go before F2–F4 if the build chat prefers to clear all three defects first — that is a defensible reordering and the only constraint is that F1 precedes everything.

---

## 8. How to verify — reuse the existing harness

The engine block is `module.exports`-aware, so it runs in Node unmodified. Extract both script blocks and syntax-check them:

```bash
python - <<'PY'
import io,re
s=io.open('cowork-calculator.html',encoding='utf-8').read()
b=re.findall(r'<script>\n(.*?)\n</script>',s,re.S)
io.open('engine.js','w',encoding='utf-8').write(b[0])
io.open('ui.js','w',encoding='utf-8').write(b[1])
PY
node --check engine.js && node --check ui.js
```

Then `require('./engine.js').CoworkEngine` gives you `defaults()`, `compute()`, `applyPreset()`, `balancePersonas()` and the constants.

**Four suites already exist and must keep passing.** Rebuild them from this spec if they are not carried over:

- **Invariants (278 checks):** totality under ~25 adversarial inputs; `active <= copilotLicensed`; meter identity; effort monotonicity; `p3 <= paygo` at full coverage; winner always feasible; `largestRemainder` sums exactly over 200 cases; `copilot_access` reachable.
- **Effort bounds (74 checks):** every exposed effort level × every one of the ten presets stays inside Microsoft's published $0.70–$15.00 per-task envelope **and** the $82–$228 per-user range, with no V-08/V-09 firing.
- **Partner economics (14 checks):** PEC unsure withholds margin; the P3/PEC inversion fires and its warning text is correct; exposure warnings keyed to `p3Holder`; markup math.
- **Fuzz (239,685 assertions over 4,000 sessions):** randomized SKU mixes, seat counts to 800, all activation modes, adversarial tier weights, sell/list mode, partial cost cards, billing overrides, PEC states including negative and bogus, garbage types. Asserts finiteness, non-negativity, identities, and that no rendered warning/why/assumption string contains `NaN` or `undefined`.

**Extend the fuzz for every new feature.** Randomize `ramp` (including `months: 0`, negative pilots, non-integers), `value.loadedHourly`, and `shadowAi`. A feature is not done until it has adversarial coverage.

**Then drive the real page.** Open the file in a browser, click through the new controls, and confirm: no console errors, no `NaN` or `undefined` in `document.body.innerText`, and the print classes are correct — assert against the stylesheet's `@media print` rules, not `getComputedStyle`, which will not reflect print rules in screen media.

**Regression anchor:** stock defaults must still produce **755,000 credits** and **$7,550/month**. If that moves, something is wrong.

---

## 9. Non-goals

- **No ROI or hours-saved modelling** beyond F2's conditional arithmetic. The moment this tool estimates a benefit it stops being defensible.
- **No portfolio or multi-tenant roll-up.** Different tool.
- **No concentration/Pareto model in this pass.** F3's per-user limit is derived from the heaviest persona, which is a principled stand-in. A real variance model is the natural next spec and would improve F3 — note it, do not build it here.
- **No downside scenario rows.** Also worth doing, also not now.
- **No change to the persona, effort, licensing or governance engines.** They were audited on 2026-08-28 and are correct.
- **No Azure billing content.** [`azure-billing-setup.html`](../azure-billing-setup.html) owns it. If a build decision tempts you to explain the Azure plan inside the calculator, link instead. The full out-of-scope list is §5.1.
- **No `/cost` measurement platform.** No multi-sample averaging, no variance capture, no usage-data import, no API. The capture sheet is paper and the partner types three numbers.

---

## 10. Open questions for the build chat

1. **Ramp default `'linear'` or `'none'`?** This spec says `'linear'` at 6 months from a 25-user pilot, because a tool that ships the honest model off-by-default is a tool that ships the dishonest model. If the build chat disagrees, the argument needs to be made in the commit, not silently.
2. **Should `p3Exposure` follow the year-one recommendation or the configured commit?** §1.5(c) says configured, with a gap warning. Confirm that is right — the alternative is that the exposure figure silently disagrees with the billing step's own inputs.
3. **`PER_USER_HEADROOM = 1.5`** is editorial and unvalidated. If anyone has real tenant data on consumption concentration, it should replace the constant and the tag should change.
4. **Working days = 21.** Fine for US/EU. If the tool ever goes elsewhere it becomes a setting.
5. **Should `cspMotion` default to `'unsure'` or to `'direct'`?** This spec says `'unsure'`, consistent with every other posture question in the file. The cost is that a direct-bill partner has to answer one more question before seeing their own margin. If that friction proves worse than the wrong answer, revisit — but the wrong answer here is a margin calculation shown to someone who cannot earn it.
6. **Does the capture sheet belong in this tool at all, or in [`coworksession40.html`](../coworksession40.html)?** It is a field artifact, and the session guide is where field artifacts live. It is specified here because it needs the account's own modelled figures printed on it, which only the calculator has. If the build chat finds a clean way to hand those figures to the session guide instead, that is a better home.

---

## 11. Definition of done

- All four features built, in order, each gated.
- All four test suites pass, extended to cover the new state.
- Stock defaults unchanged at 755,000 credits / $7,550 per month.
- The P3 recommendation and the P3 risk block agree with each other and with the billing step's inputs.
- No block claims a benefit, a saving, or an hour saved.
- Customer print reviewed by eye: the break-even and controls blocks present, every partner-economics block absent.
- No Azure billing mechanics restated inside the calculator; every such reference is a link to [`azure-billing-setup.html`](../azure-billing-setup.html).
- An indirect reseller cannot reach a PEC or meter-margin figure by any path, including a hand-edited session file.
- `calibrated` cannot be reached without the tier values actually differing from `CONST.TIER_DEFAULT`.
- One commit per feature, each explaining what was wrong or missing and why the fix is shaped the way it is.
