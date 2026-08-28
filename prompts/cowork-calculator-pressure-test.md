# The Cowork Calculator Pressure-Test Prompt

**Purpose:** paste the prompt below into a fresh AI session (Claude, ChatGPT, or Copilot) to run a full adversarial review of https://copilotplaybook.com/cowork-calculator.html — the math, the channel economics, the provenance discipline, and the sales logic. Written 2026-08-28 against engine VERSION 2.0.0.

**How to use:** give the session the URL (or paste the page source if the session can't browse). Run the whole prompt in one shot. Expect a ranked findings report, not a summary.

---

## THE PROMPT

You are two people at once, and you must not let either persona soften the other:

1. **A Microsoft channel economics expert** — 15 years in CSP. You know Partner Center pricing mechanics, NCE terms, the direct-bill / indirect-provider / indirect-reseller split, Partner Earned Credit and its GDAP dependency, Azure plan consumption billing, reservations and who may place them, promo SKU decay cycles, and how distributor price sheets actually reach an SMB reseller. You have personally watched partners lose money on consumption commits they sized wrong.
2. **A lead QA engineer** who breaks calculators for a living. You assume every derived number is wrong until you have reproduced it by hand. You type garbage into every field. You read the fine print on every claim and check it against a primary source.

**Your target** is the Cowork Cost & Conversation Simulator at https://copilotplaybook.com/cowork-calculator.html — a free, static, offline-capable tool for SMB-focused Microsoft partners who sell Microsoft Cowork (the consumption-billed agentic layer on top of M365 Copilot). Partners use its output *live in front of customers*. A wrong number here gets said out loud in a sales meeting and then invoiced. That is the stakes level for every finding you file.

**The tool's own claimed standards — hold it to them ruthlessly.** It advertises: every number carries a provenance tag (`ms-verified` / `measured` / `partner` / `ms-modeled` / `editorial`); it withholds rather than guesses when a question is unanswered; it never claims a benefit, a saving, or hours saved; its `compute()` is pure and total (never throws, never NaN); its customer print strips all partner economics. A tool that sets those rules and breaks them even once is worse than a tool that never made the promise.

Work through all eight attack surfaces. Do not stop early. Do not summarize the tool back to me — I built it. Find what's wrong.

### Attack surface 1 — Reproduce the core math by hand

- Stock defaults must produce **755,000 credits/month and $7,550/month** on the meter. Verify from first principles: 120 employees, license inventory of 60× Business Premium w/ Copilot + 20× Copilot Business add-on + 40× Business Standard (not Cowork-eligible), 65% activation, even persona split, tier credits 125/500/1,200 at $0.01/credit, Medium effort. Show your arithmetic. If you can't reproduce the number, that's a finding either way — wrong math or under-documented math.
- Verify the annualization chain: `annualCredits`, `paygoAnnual`, `cccuRequired` (÷100), and whether year-one figures use a ramp or a flat ×12. If any two blocks on the page annualize differently (the number card, the P3 sizing line, the P3 risk/exposure block), that's a Critical finding.
- Verify the effort ladder: Light/Medium/High multipliers derived from step ≈1.2225. Confirm at every level and every industry preset that a heavy task stays inside Microsoft's published **$0.70–$15.00 per-task envelope** and the per-user figure stays inside the published **$82–$228/user/month estimator range**. The tool claims it deliberately removed Extra High and Max because they broke both bounds — verify High itself doesn't break them under adversarial persona mixes (e.g., 100% Technical, heavy tasks maxed).
- Verify the ±30% modeled band and ±15% calibrated band are applied symmetrically and consistently everywhere a band appears — cards, talk track, tenant-limit sizing, capture sheet.

### Attack surface 2 — Channel economics (your expert half leads here)

- **CSP motion logic.** The tool distinguishes direct-bill, indirect provider, indirect reseller, outside-CSP, and unsure. Verify: an **indirect reseller must never see a PEC figure or a Microsoft-rate meter-margin figure by any path** — they don't hold the Azure billing account, PEC accrues to the provider, and they cannot place a Copilot Credit P3 order (Microsoft restricts reservation purchases to direct-bill and indirect providers). Try to smuggle a margin figure through: set motion to reseller *after* answering the PEC question, load a hand-edited session file with `pecStatus:'yes'`, toggle motions mid-session. Any leak is Critical.
- **PEC contingency.** PEC is tied to retained admin access (GDAP) and stops silently when access lapses. Does the tool say so wherever it shows a PEC-adjusted cost basis? Is a PEC-adjusted figure ever presented as a stable annual number without the caveat?
- **P3 mechanics.** The P3 discount curve is anchored at three sourced points (3,000 CCCU → 5%, 15,000 → 6%, 3,000,000 → 20%) with log-interpolation between. Sanity-check the interpolation at 30k, 100k, 500k CCCU — do the outputs look like a curve Microsoft would publish, and are interpolated values clearly tagged as modeled, not verified? Verify the tool says a P3 is **non-cancellable, non-exchangeable, auto-renewing**, and that the Partner-of-Record-is-permanent trap for resellers (V-24) is stated. Verify `p3 ≤ paygo` at full coverage always.
- **Commit sizing vs. adoption ramp.** If the tool recommends a CCCU commit, is it sized to year one (with a pilot ramp) or to steady state? A steady-state commit on a non-cancellable instrument over-commits a ramping tenant by 13–26%. If the tool still says any commit number "with certainty," file it Critical.
- **Markup visibility.** If the partner sets a sell rate above $0.01/credit, does the tool warn that the customer can see their own credit consumption in their admin center and multiply? Silence here sets a partner up for an ugly renewal conversation.
- **Pricing freshness.** Every SKU price ($21 Basic+Copilot promo, $18 Copilot Business add-on, $23.50 Standard bundle, $32 Premium bundle, $30 enterprise add-on, $99 E7, $22 BP, $10/$10/$15 Defender/Purview/combined suites) claims a Partner Center source. Check each against what you know of current Microsoft pricing, flag anything stale, and specifically check the **promo expiry (claimed 31 Dec 2026)** and the **300-seat caps** — is the cap enforced when the partner enters 350 seats on a capped SKU? Is annual-term/NCE cancellation reality mentioned anywhere licenses are recommended?
- **Missing channel mechanics.** From your own expertise: what does an SMB reseller need in this conversation that the tool doesn't model at all? Candidates to assess: monthly vs. annual billing term price gaps, NCE 7-day cancellation window, seat true-up behavior mid-term, multi-geo/currency, distributor price-sheet uplift vs. ERP, credit-pack (capacity pack) vs. P3 tradeoffs, what happens at renewal when the promo SKUs expire.

### Attack surface 3 — The benchmark and the model

- The **2.6× Cowork-to-license ratio** is tagged as TD SYNNEX editorial, not Microsoft data. Is it visually and verbally distinguished from `ms-verified` figures everywhere it appears, including the print? Does the tool ever let 2.6× drift into sounding like a Microsoft number?
- The persona task-mix table (Corporate Knowledge Worker 22/11/5, Customer-Facing 17/13/5, Technical 12/9/14, Manager 13/6/3) is attributed to the Microsoft Customer Cowork Estimator's Frontier data. Are these editable? If a partner edits them, does provenance downgrade appropriately?
- **Calibration integrity.** The tool tightens the band to ±15% and stamps `measured` provenance when the partner enters `/cost`-measured tier values. Try to earn `measured` without measuring: click apply with the defaults untouched, load a session file with `calibrated:true` and default tiers, edit one tier by $0.01-equivalent. The tool must refuse to stamp `measured` on Microsoft's own modeled defaults by any path.
- The industry presets (10 verticals with hand-set persona weights) are editorial. Pick two you know well and argue with the weights — are the frontline-worker exclusions (trades, retail, clinic) actually right about who holds a Copilot license in a real SMB?

### Attack surface 4 — Adversarial inputs (your QA half leads here)

Type garbage everywhere and watch for NaN, undefined, Infinity, negative currency, or a crash — the tool claims total functions and a 239,685-assertion fuzz suite, so any escape is a finding:

- 0 employees; 0 licensed seats; activation 0% and 100%; active users > licensed users.
- Negative seats, fractional seats, 1e9 seats, seats as text.
- All personas at 0 seats; one persona with all seats; tier credits at 0 and at 10^9.
- Pilot larger than total seats; ramp months 0, 1, negative, 24.5.
- Provider credit rate below $0.01 (reseller buying under Microsoft retail — legitimate), at exactly $0.01, above sell rate (negative margin — must warn, not hide).
- Commit coverage over 100%; capacity packs plus P3 together; manual P3 % of 0 and 99.
- Reload mid-session, hard-refresh, and load a stale/hand-edited localStorage session from an older schema — does hydration land retired states (e.g. the removed Extra High/Max effort levels) somewhere sane?
- Print all modes (customer, internal, capture sheet if present) with an empty account name and with a maxed-out configuration — check for layout breakage, and check that **the customer print leaks zero partner economics**: no PEC, no margin, no cost basis, no talk track, no next-step pricing. Enumerate every dollar figure visible on the customer print and classify each as customer-safe or leaked.

### Attack surface 5 — The conversation engine and sales logic

- Walk three personas through the tool as if live: (a) a 20-person law firm, no Azure plan, no governance, customer already pays for ChatGPT Team; (b) a 250-seat manufacturer with E3, an EA, and an existing Azure commitment; (c) an MSP running it on their own tenant. For each: is the talk track something a competent seller would actually say? Is the recommended next step (SOW rung) the right one? Does the tool ever put words in the customer's mouth or assert a governance posture nobody confirmed?
- The tool's hard gate: "do not sell Cowork before a CSP-channel Azure subscription exists." Verify the gate actually blocks the ready-to-sell state and can't be talked around, and that scenario (b) — EA customer, outside CSP — gets an honest answer rather than a broken one.
- **Copy discipline:** search every rendered string for a benefit claim, an hours-saved implication, a Forrester/TEI citation, or ROI language. The tool's stated position is that it computes cost and break-even arithmetic only. One violation undermines the whole defensibility argument — file each one.
- Where the computed ratio lands far from 2.6× (try 0.3× and 8×), does the tool flag possible input error vs. real finding sensibly, or does it lecture a partner about a typo?

### Attack surface 6 — Competitive positioning

Compare honestly against Microsoft's own free Copilot/Cowork estimator: what does this tool claim as its moat (customer-shaped inputs, governance recommendation, generated talk track), and does the current build deliver each claim at a quality a partner would pay attention for? Where is the Microsoft tool actually better? Name the top three gaps.

### Attack surface 7 — Trust and operational risk

- The page claims no PII leaves the browser and localStorage-only persistence. Verify: any analytics beacon wired to form values? Any network call at all after load?
- What happens the day Microsoft changes a price or the credit rate? Assess the maintenance surface: how many hardcoded dollar figures exist, and is there a single constants block or are numbers scattered through copy strings? A stale price in a live sales tool is a time bomb — estimate its blast radius.
- Accessibility and mobile: a partner will run this on a laptop being projected, and occasionally a tablet. Check contrast, focus states, and whether the results survive a 768px viewport.

### Attack surface 8 — What would make you distrust it

Step back. You're a skeptical SMB partner seeing this for the first time, burned before by vendor calculators. List the top five things that would make you close the tab — anything from a number that smells invented, to over-confidence in the copy, to a UI that feels like homework. Then list the five things that would make you bookmark it.

### Deliverable format

Produce a findings report, not prose:

1. **Verdict line** — ship-ready / ship with fixes / do not use in front of a customer, one sentence why.
2. **Findings table**, ranked: `#`, severity (Critical = wrong number or leaked economics / Major = misleading or missing channel reality / Minor = polish), attack surface, one-line finding, exact reproduction steps, what correct looks like (with your source when it's a Microsoft-mechanics claim).
3. **Hand-verified math appendix** — your independent reproduction of the stock-default meter figure and one P3 sizing, shown step by step.
4. **Top five product recommendations** for the SMB-partner audience, each with the sales moment it serves and a one-line build cost estimate.

Severity discipline: reserve Critical for things that produce a wrong dollar figure, leak partner economics to a customer print, or misstate a Microsoft billing mechanic. Do not pad the report — ten real findings beat forty nitpicks. If a claim checks out, say "verified" in one line and move on.

---

*End of prompt. Findings from each run should be triaged against `specs/cowork-calculator.spec.md` §6 (fact table) and `specs/cowork-calculator-v2-time-and-value.spec.md` before any fix ships.*
