# Copilot Credit Planner QA audit, 2026-10-11

**Scope:** `copilot-credit-planner.html` (hub: Cowork tab, Copilot Studio agents tab, Combined plan and report tab) and `cowork-calculator.html` (standalone and embedded). Audited against a frozen snapshot of commit `bc1bb04` on `main` (both pages clean in the working copy). Planner engine VERSION 1.0.0, rate card `2026-10-11`. All three suites were green on the snapshot before the audit began: planner 919, Cowork v3 15,430, Cowork motion 15,188.

**Method:** six independent passes, each from an independent calculator or a live source, never from the tool's own anchors: (1) planner engine recomputation and brute-force optimizer oracle, (2) Cowork engine recomputation and licensing-solver walk, (3) live Microsoft pricing sweep against primary sources, (4) conversation layer (next-best-action rules, talk track, objections, ladder, warnings P-xx and V-xx), (5) session files, exports, customer view and CSV, (6) browser walkthrough and customer-view leak enumeration; plus a lead white-box read of the money path. Every Critical below was reproduced a second time by the lead with a separate script before it was ranked. Recomputation workbook: [`credit-planner-qa-scenarios-2026-10-11.csv`](credit-planner-qa-scenarios-2026-10-11.csv) (546 rows; a nonzero `delta` marks a finding).

**No files in the tool were changed by this audit.** Every fix below is a proposal.

---

## 1. Executive verdict

**Not yet safe to put in front of a customer without a partner who knows where the traps are.** The arithmetic is right: every Microsoft rate, every Microsoft worked example, all nine P3 tiers, the capacity-pack math, the billing-order drawdown, the enforcement thresholds and the 755,000-credit Cowork stock case reproduce to the credit and the cent, and the purchase optimizer was never beaten by brute force in 1,341 random checks. No partner margin, provider cost, PEC or service price leaks into the customer view, the customer print, the quote text, the CSV or the Cowork handoff payload, even with every partner field seeded with distinctive values. File loading survived a 48-case hostile battery and 6,320 hostile engine calls without a throw, a NaN or a prototype pollution.

What fails is the layer that turns correct credits into a recommendation or a customer price:

- The Cowork **licensing solver** mis-handles the 300-seat cap at exactly 300 seats and compares add-on paths net of the base the customer already owns against bundles priced gross, so it can recommend the wrong SKU and quote a wrong "cheaper by" figure on the customer-visible licensing card.
- The planner's **license-versus-meter verdict** is computed at Microsoft list even when the customer is quoted the partner's sell prices, and it gives monthly-billing customers the annual-only $18 promo. The verdict, the warning, the next-best-action and the customer report can therefore disagree with one another on the same screen.
- With a partner **sell pack price** set, the customer report's "cheapest way to buy it" can cost more than the pay-as-you-go figure printed beside it.
- The **Cowork tab and the Combined tab can price the same credits at two different rates** in one session, both visible in customer view.
- Three **base SKU prices in the Cowork calculator are stale** against microsoft.com today (Business Basic $7, Business Standard $14, E3 $39), which skews the derived Copilot component of two bundles.
- The customer's **"middle scenario" headline carries a 10% buffer** the rate card does not, so the headline dollar figure for the three SMB scenarios reads $4,759.20 where the rate-card answer is $4,272.

Severity counts: **Critical 9 · High 14 · Medium 32 · Low 36.** Everything the tool says about Microsoft's rates is right today; the Critical and High items are about which number is shown, at which price basis, to whom.

---

## 2. Findings

Severity rule: **Critical** = a customer could see or hear a wrong number, a wrong price, a wrong recommendation, or a partner margin. **High** = a partner-visible wrong figure, a wrong Microsoft term, or a customer-visible figure that is misleading rather than wrong. **Medium** = spec deviation, missing disclosure, or a wrong figure in an edge the fast path does not reach. **Low** = copy, defaults, hygiene.

Each finding: what is wrong · reproduction · expected vs actual · source · impact · proposed fix. Pages are the snapshot copies; line numbers refer to `cowork-calculator.html` (CW) or `copilot-credit-planner.html` (CP).

### Critical

**C-01 · Cowork licensing solver treats the inclusive 300-seat cap as breached at exactly 300 seats.**
Repro: Cowork page, 300 × Business Premium with Copilot (`bprem_cop`), governance all yes. Expected: Microsoft's cap is "for up to 300 users" (microsoft.com, live 2026-10-11), so staying put at 300 × $32 = $9,600 a month is valid, and V-05 correctly stays silent at 300. Actual: `requirements()` adds a mandatory `scale` gap when `copilotLicensed >= 300` (CW 2311; also the `at-scale` rule CW 2643 and copy CW 4128), so only enterprise paths qualify: enterprise Copilot at $19,800 a month (300 × $30 + 300 × $36 E3), or E7 at $29,700 with governance unasked. The recommended price jumps from $6,279 at 299 seats to $19,800 at 300, and the "Why this one" box contradicts itself ("under the 300-seat cap" then "a path above the 300-seat SMB cap"). Impact: a 300-seat customer is told to spend $10,200 a month more than necessary. Fix: `>= 300` → `> 300` in all three places; add a 300-seat regression case to the Cowork suite.

**C-02 · Cowork licensing solver prices add-on paths net of the owned base but bundles and E7 gross.**
Repro: 150 Business Premium + 150 Copilot Business add-on, governance all yes. Expected: the add-on all-in is 150 × ($22 + $18) = $6,000; Business Premium with Copilot is 150 × $32 = $4,800; the bundle is $1,200 a month cheaper ($1,650 once the promo ends). Actual: the solver recommends the add-on at $2,700 ($18 a user) because an add-on path costs `per × needed + base × unowned` while a bundle costs `per × needed`. Same defect: 250 Business Standard + add-on (bundle saves $1,750), 50 Business Basic + add-on (bundle saves $150), 60 Business Premium with a 25-seat pilot (upgrade $250, shown $450), 1,200 E5 + enterprise Copilot where the tool recommends E7 at $118,800 and says the add-on is "$69/user cheaper" when the true gap is $9 a user ($99 − $90), and 500 E3 + Copilot where the gap is $33 not $69. Impact: wrong SKU and wrong "cheaper by" dollars on the customer-visible licensing card. Fix: price every path as the change to the customer's current monthly bill (credit retired bases), or price every path all-in on one basis; add the six shapes above to the suite.

**C-03 · Planner license-versus-meter verdict is computed at list while the customer sees sell prices.**
Repro A: helpdesk archetype, 40 conversations a user a month (2,400 credits a user), partner Business seat sell price $25. Actual: verdict `license` (2,400 > list promo break-even 1,800), NBA-06 fires, customer-facing P-75 says "would save about $240 a month"; the customer view's own `licenseInstead.savingUsdMonthly` for the same card is **−$40** because at $25 a seat the seats cost more than the meter. Repro B: 1,700 credits a user with a sell credit price of $0.013: verdict `meter`, no NBA-06, but the customer view shows a **+$163.90** a month saving from licensing. Source: `crossoverFrom()` (CP 2250) uses `RC.seat*` and `breakEven()` at $0.01; `customerView()` reprices `seatUsd` and the saving from `customerRate`. Impact: the verdict, the warning and the report disagree on the same screen. Fix: compute the verdict from covered credits × customer $/credit against the customer seat price; generate P-75 and NBA-06 from those same figures; test that verdict sign equals the sign of the customer-view saving.

**C-04 · The crossover gives monthly-billing customers the annual-only $18 promo.**
Repro: helpdesk, `tenant.businessBilling = 'monthly'`, about 2,000 credits a user, start 2026-11. Expected: SKU monthly at $25.20, break-even 2,520, verdict meter. Actual: SKU promo $18, break-even 1,800, verdict license, NBA-06 fires, P-75 "save about $80.16 a month". Source: F-176 and the Copilot Business page: the promo is annual commitment, first year only; in `crossoverFrom()` the promo check runs before the billing check. Impact: a wrong license recommendation read to the customer. Fix: check monthly billing before the promo; the promo applies only to `annual` (or the default) basis.

**C-05 · With a partner sell pack price, the customer's "cheapest way to buy it" costs more than pay-as-you-go.**
Repro: SMB trio preset, total users 60, 20 Business seats, `partner.sellPackUsd = 300`, credits at list. Actual: customer view `buy.yearUsd` = 12 × $300 + 12 × 19,660 × $0.01 = **$5,959.20** labeled the cheapest option, beside `buy.paygYearUsd` = **$5,359.20**. Reproduced in 1,343 of 2,000 random states. Cause: `optimize()` prices at list; `customerView()` then reprices the list choice at `customerRate.packUsd` and `usdPerCredit`. Impact: a customer sees a recommended plan that is more expensive than the baseline printed next to it. Fix: run the optimizer at the customer's prices for everything customer-facing; add a test `buy.yearUsd ≤ buy.paygYearUsd`.

**C-06 · Objection card O-8 ("You're marking up credits") always says credits are priced at Microsoft list.**
Repro: any state with `partner.sellCreditUsd` set, or a Cowork payload with `sellMode: true`. Actual: OBJ-08 is the literal string "Credits are priced at Microsoft list in this plan" (CP 2723) while `customerRate.note` on the same result says "Credits priced at your partner's rate of $0.013 a credit." OBJ-01 likewise always says "The meter is $0.01 a credit" and uses list break-evens. Impact: a partner reads a false statement aloud on the markup objection. Fix: build OBJ-08 and OBJ-01 from `r.customerRate`; say "list" only when `creditSource === 'list'`.

**C-07 · With no Cowork lane, the governance sheet tells the customer to set a 0-credit tenant spending limit.**
Repro: SMB trio with no Cowork session. Actual: `governance.tenantLimit = {credits: 0, usd: 0}` and alerts at 50/80/100% of 0; the customer sheet renders "A tenant spending limit of 0 credits a month, with a 15% buffer". Cause: `tenantLimit = roundUp(peak.m365.hi × 1.15, 1000)` and `m365` is the Cowork lane only (CP 2219). Impact: a customer-facing governance instruction that would stop every agent on day one if followed. Fix: omit the tenant line and its alerts when `m365` is 0, or size the limit on the pool the spending policy actually covers.

**C-08 · The Cowork tab and the Combined tab can price the same Cowork credits at two rates, both visible in customer view.**
Repro (browser, snapshot served on localhost): set the hub's partner sell price to $0.0123 a credit, leave the Cowork tab's own pricing step on "Microsoft list". The Cowork tab shows "$7,550 Cowork credits/month" ($0.01) while the Combined tab and the printed customer report show "$6,501–$12,072 at your partner's price" for the identical 755,000 credits. Cause: the hub never pushes `partner.sellCreditUsd` into the frame; the only same-origin frame access is for load and print (CP 3370–4621), and `customerRateFrom()` prefers the hub's partner price over the Cowork payload's (CP 1793). Impact: two dollar figures for one usage in one meeting. Fix: push the hub's sell price into the Cowork pricing step by default, or show a visible "the Cowork tab is priced at list" warning on both tabs when they disagree.

**C-09 · Three base SKU prices in the Cowork calculator are stale against microsoft.com today.**
Tool: Business Basic $6.00, Business Standard $12.50, E3 $36.00. Source (microsoft.com plans-and-pricing, live 2026-10-11): $7.00, $14.00, $39.00. `copilotComponent()` subtracts the base price from the bundle price, so the Copilot share of Business Standard with Copilot shows $11.00 (should be $9.50) and of Business Basic + Copilot $15 (should be $14); the error carries into `copilotSpend`, the benchmark ratio and every licensing-solver path that adds a base. Impact: a wrong Microsoft price in a customer-visible table. Fix: update the three constants, mark them ms-verified with a microsoft.com source dated 2026-10-11, and move the Cowork golden snapshot deliberately (record old → new).

### High

**H-01 · The customer's "middle scenario" headline is the rate-card figure plus 10%.** SMB trio at list: the rate card gives 40,600 a month → 1 pack + 15,600 PAYG = $4,272 a year against $4,872 PAYG (anchors A19/A20). The customer sees "$4,759.20 … middle scenario, against $5,359.20" because Studio and BC agents get mid = point × 1.10 and hi = point × 1.20 (`STUDIO_BAND_PCT`, F-179). `lo` always equals the rate-card point and the agent rows show lo–hi correctly. Fix: headline the point estimate and present the Microsoft buffer as a labeled range.

**H-02 · An environment with a zero allocation and tenant draw on reports a day-1 hard stop.** Repro: SMB trio; environments = the tool's own "Recommended layout" (Default 0 / draw on, Production 0 / draw off, Sandbox 5,000); set each card's env to Default. Actual: events "Custom agents in Default are disabled at 125% (0 credits)" and "flows blocked at 100% of 0 credits" on day 1; customer warnings P-50 and P-51 repeat "around day 1". Expected: with tenant draw on, the environment draws from the tenant remainder (20,000 here), so the true stops are day 13 (flows) and day 16 (agents), exactly what the engine computes when the cards are unassigned. Cause: `enforcementFrom()` uses `e.allocation` as the cap regardless of `tenantDraw` (CP 2170); the Cowork starvation test also ignores draw-on consumption. Fix: for draw-on environments, spill consumption above the allocation into the tenant pool and cut against allocation + remainder; count that spill in the Microsoft 365 remainder.

**H-03 · The Cowork solver recommends a downgrade.** 100 or 299 × Business Premium with Copilot, governance all yes → recommends Business Basic + Copilot Business at $21, dropping Business Premium. Correct answer: no license change. Fix: treat the highest owned base as a floor.

**H-04 · V-31's "raise the limit to" figure is too low for the heaviest persona.** V-31 advises 19,000 = ceil(14,519.23 × 1.3 / 500) × 500 from the average user (755,000 / 52 basis seats); a Technical-persona user models at 22,800 a month and still hits the raised limit around day 25. Fix: size to the heaviest persona × 1.3 (30,000 at stock).

**H-05 · The partner's credit markup changes the Cowork usage diagnosis.** At a $0.012 sell rate `ratioBench` becomes 3.775 instead of 3.146, crossing the 3.5 trigger: the next step flips to "concentration … runs hot" and the customer talk track gains "running above the 2.6× benchmark" with usage unchanged. Fix: compute ratios and triggers at $0.01.

**H-06 · Copilot Business ($18) is recommended to estates that cannot buy it.** `tenantBase 'e5'`, 500 enterprise seats, 50 unlicensed at 3,600 credits → promo SKU, "save $900 a month" (expected enterprise $30, about $300). `fitsBiz` checks only `U ≤ 300 − business seats`, ignoring total users and E-suite seats; 250 unlicensed with 100 Business seats held go wholly to enterprise instead of splitting. Fix: offer Business only when total users ≤ 300 and no E3/E5/enterprise seats; split at the cap otherwise.

**H-07 · $18 appears without the December 31 expiry where the recommendation is made.** Planner: P-76 fires only when Business seats > 0, so NBA-06, P-75, OBJ-01 and `customerView.licenseInstead.seatUsd = 18` carry no expiry; a horizon starting 2026-12 with an agent live in month 6 prices $18 for seats bought after the promo ends. Cowork: no end date on the licensing table, "Why this one" or the ratio block; at $21 a 150-seat recommendation is understated by $450 a month from January; monthly billing at $25.20 is not modeled. Fix: state the expiry wherever $18 or the promo SKU appears; judge eligibility at the purchase month.

**H-08 · NBA-11 "Measure 90 days, then commit" never fires with default settings.** The optimizer always picks packs (5, 56, 84 or 2,800 packs a month for 200k to 100M credits) because $0.008 a pack credit matches the Tier 9 discount, and NBA-11 checks only for P3 or mixed plans; 84 packs a month (about $201,600 on annual terms per P-37) gets no 90-day advice. When packs are disallowed the opener says "run on capacity packs … for a quarter", but packs are billed annually (F-013). P-30, P-32, P-34, P-38, P-73 and P-74 are likewise unreachable unless packs are off. Fix: trigger on `packs > 1 || p3.units > 0` with no measured quantity (the spec rule), fix the opener, add the spec's Apply fix.

**H-09 · The upsell ladder shows the $12 per-user run retainer as the price of "Environment and governance setup", never recommends rung 2, and ticks rungs that never happened.** `ladder()` picks the `governance` service (F-201) for rung 3 although the spec and the page's own services note say setup has no Playbook price and ships empty; an agent not yet built (`startMonth 4`) gets rung 4 AgentCare; every rung below the recommended one is ticked regardless of its condition. Fix: a separate setup key with a null price; implement "highest rung whose condition holds" and tick only rungs that hold.

**H-10 · P-53 (customer) prints the wrong start date for the December 1 default.** Horizon start 2027-03 → "From March 2027, new CSP Copilot Business licenses get usage-based billing on by default…". Expected December 1, 2026 (F-156); the message prints the first horizon month instead of `RC.capDate`.

**H-11 · Step-up pack schedules leave out committed spend after month 12.** SMB trio + Cowork ramp 25→100 seats over 6 months: best is "stepping up from 6 to 22 packs" at $68,071.70. P-37 (partner-only) says each added pack has its own annual term, which commits 46 pack-months past month 12 (4×1 + 3×2 + 3×3 + 3×4 + 3×5) = $9,200; with the tail the plan costs $77,271.70, more than the best flat option (14 packs + Tier 2, $71,146.11). The customer sees $68,071.70 with no mention of the tail. Fix: confirm Microsoft's co-term rule for added packs; then count the tail in commitment, expected cost and the strand test, or correct P-37.

**H-12 · The conservative appetite tests stranding in the low scenario; the spec says the mid.** `optimize({lo 20,000, mid 25,000, hi 30,000} × 12, conservative)`: under the spec rule 1 pack is admissible at $2,550 expected; the engine checks `strand.lo ≤ 5% × cost.lo` (1 pack strands $480 of $2,400 = 20%) and recommends PAYG at $3,000, $450 more. The page discloses "stranded spend in the low scenario", so this is a spec/code conflict to settle, but it costs the default customer money. Fix: pick one definition and align spec, code and copy.

**H-13 · Tenant-graph grounding is billed on classic answers.** Helpdesk card, 50% generative, 100% grounded: expected 40 × 4 × (2.5 classic + 5 generative + 25 grounding on the 2.5 generative turns) = 5,200 (F-164: grounding is +10 on a generative answer; spec: grounded = generative × graphPct); actual 9,200 because all 5 turns are grounded. The UI label reads "Turns grounded on tenant data (%)". Fix: grounded = min(groundedPct, genPct) × turns, and relabel.

**H-14 · The customer-facing enforcement events (P-50, P-51, timeline) cite the high-end day while labeled "mid", and the environment allocation the governance sheet recommends sits below modeled high-end use and can exceed prepaid capacity.** SMB trio, 1 pack: P-50 says "around day 20"; the mid-scenario day is 21, flows 16 shown vs 17 mid. The recommended Production allocation is 45,000 = roundUp(48,720 × 1.15 × 100/125, 1000) for a 44,660 mid / 48,720 hi, relying on the 100–125% band, so flows block at 100% in the high scenario (P-54 discloses this to the partner only, and fires even when the partner's actual allocation is above hi). 45,000 + 5,000 Sandbox = 50,000 against one prepaid pack (25,000) leaves the Microsoft 365 remainder at 0 if applied. Fix: label the scenario of each day; allocate ≥ hi × buffer; warn when Σ allocations > prepaid of the recommended plan.

### Medium

**Purchase and pool**
- M-01 · Cowork year-one buying guidance ignores capacity packs. The page steers year one to 2 × Tier 3 + Tier 2 + Tier 1 = $72,750 + $839.42 PAYG = $73,589.42 (the total is never displayed). Cheaper on the same ramp: 21 packs all year $68,747.88; 16 packs + 1 × Tier 3 $67,509.62. Holding 30 packs flat in year one costs $72,350 and wastes 1,151,058 credits ($9,208.46), never shown.
- M-02 · Cowork's P3 headline is steady state while the page sizes the order on a ramp. The P3 cell says "saves $6,300"; the same 3 × Tier 3 bought for the ramped year one loses $4,860.58 against PAYG (78,839.42 CCCU < the 83,700 break-even). With P3 selected, the risk block's "$10,950 of pre-paid credit nobody burns" should be $10,379.34 (11,160.58 CCCU × $0.93).
- M-03 · Several P3 plans held at once are never labeled "Likely" on the Cowork page (B4 trace tagged ms-modeled; prose says it "is how Azure reservations work"), and in the planner the customer buy text carries no chip when `best.p3.count > 1` (P-30 is partner-only). Microsoft has no explicit sentence either way for Copilot Credit P3 (Agent P3 says "additional plans can be purchased"; plans "can't split or merge"). If one plan per customer: Cowork steady Tier 3 + PAYG $88,500 (saves $2,100, not $6,300); year one Tier 3 + PAYG $76,739.42 (saves $2,100, not $5,250); 755,000 flat overall unchanged (30 packs, $72,600); SMB trio unchanged (single Tier 1). Keep "Likely" everywhere, including the customer text.
- M-04 · At 301 seats the Cowork solver moves all 301 to E3 + enterprise Copilot ($19,866); 300 × Business Premium with Copilot + 1 enterprise seat is $9,666 and valid (Business and Enterprise plans mix in one tenant). The planner's room check is likewise all-or-nothing (299 seats + 2 unlicensed → both priced Enterprise).
- M-05 · E5 estates are pushed to E7 to "close" label, DLP and Defender for Cloud Apps gaps that E5 already licenses; the gaps are configuration.
- M-06 · Tenant enforcement leaves Cowork's draw out of the shared remainder. SMB trio + 755,000 Cowork, 30 packs held, basis current: the tool tests only agents (44,660 / 48,720) against 750,000 and reports no events; if Cowork counts (F-183), flows stop day 29 mid / 22 hi and agents cut day 28 hi. Say plainly that Cowork is excluded, or include it.
- M-07 · NBA-03 and P-52 (customer risk) blame allocations when the shortfall is the purchase plan (they fire on any allocation above zero when packs fall short of Cowork's high demand; with zero allocations the remainder is unchanged). Spec uses the Cowork mid; starvation has no day (mid day 26 computable).
- M-08 · The template ramps autonomous and Business Central cards; the spec says they do not. full-estate preset: month-1 low 5,505 vs 27,240 un-ramped; year-one low short 65,205 credits (about $652); best plan $13,677.49 vs $14,294.74.

**Conversation layer**
- M-09 · NBA-05 states the high-end result as fact ("your people will hit it", "working day 20") when the mid scenario stays under the cap; Cowork V-31 says "around day 5" (calendar, rounded) for the same load where the planner says working day 4 (mid) or 3 (hi). No Apply fix though the spec defines one.
- M-10 · NBA-14 "No blocker found" is always appended, including under an NBA-01 blocker; if any rule throws, only NBA-14 remains.
- M-11 · The talk track carries partner-only text: the NBA-13 specialization opener, and P-28 (a customer warning also in `customerView().warnings`) ends with "Say it plainly: a website agent is a metered service."
- M-12 · Most spec talk-track lines are missing (T-ZERO, T-BUY, T-GUARD, T-ADJ, T-SEAT); with no agents and no Cowork the opener reads "about 0–0 credits a month, roughly $0–$0".
- M-13 · NBA-04's Apply fix does nothing in the agents-cut case (caps already "yes"); the fix that clears it (link to PAYG) lives only on P-50.
- M-14 · "Reasoning bills twice / costs twice" (NBA-10 opener, customer P-20) overstates: reasoning adds 10 credits per started 1K tokens on top of the step (F-167).
- M-15 · OBJ-07 offers $15 Agent 365 to E3 and unsure tenants without the prerequisite (F-009) and gives no Dataverse use or month figure.
- M-16 · O-2 is correct on 4,800 vs 9,600 (re-tested live: Microsoft's estimator shows a 9,600 grounding line then "−4,800 negated for 20 licensed users"; at 30 licensed users its total goes stale at 4,800) but is unhedged: no test date, "every line here cites Microsoft's billing rates page" is false, and at ≥ half licensed it says "Microsoft's estimator shows 0 credits".
- M-17 · O-9 is about Autopilot; the spec's build-burn objection ({buildLo}–{buildHi}) does not exist.
- M-18 · NBA-02 is narrower than the spec (external AND no-auth; external with manual auth and internal no-auth agents are missed); its why line uses lo only, no dollar figure, no cap fix.
- M-19 · Rule order puts upsells ahead of blockers (NBA-02 outranks 03, 04, 05; NBA-06 outranks NBA-07). Recommend blockers first: 01, 03, 04, 05, 07.
- M-20 · The Assessment price ($1,500–$7,500, F-204) is not in the Playbook; F-204 cites `cowork-calculator.html` (circular). Playbook: `cpb-field-guide.html` "Shadow AI Discovery Sprint $3.5K–$7.5K" (590) and posture assessment "$3K–$10K" (700); `cpb-model-the-practice.html` "Discovery & Scoping (paid assessment) $3,500–$5,000" (4187). The spec contradicts itself (§S6 $1,500–$7,500; §S7 ladder $3,500–$5,000). The planner ladder shows "$1,500 one-time"; the Cowork AUP rung ($1,000–$5,000) differs from the field guide's $1.5K–$3.5K. **Ken's decision:** pick one source and update F-204, `RUNG_FIXED` and the spec together.
- M-21 · Ladder rung 6 shows Agent 365 at "$10 per user a month" beside OBJ-07's $15. The $10 matches the Playbook overlay (F-203) and the spec's "$15 + fee" is stale, but the ladder does not say Microsoft's $15 license is separate.
- M-22 · P-77's message says "Move the rest to the enterprise SKU"; its Apply fix caps Business at 300 and drops the other seats.
- M-23 · Default `tenantBase` is `'premium'` (spec `'unsure'`): P-65 is suppressed for the customer, Agent 365 shows eligible and NBA-12 fires on an unconfirmed base.
- M-24 · Agent 365 eligibility has no Defender + Purview path. Spec §S1 has `tenant.suites`; the engine has no such field (`eligible = tenantBase ∈ {premium, e5}`), while the UI copy still says "or the Defender and Purview suites", so a customer who owns the suites on an E3 or Standard base is told Agent 365 is blocked.

**Pricing citations (values all correct; the citations are not)**
- M-25 · PAYG $0.01 (F-149, `payg`) cites usage-based-billing-overview, which no longer states $0.01 and now carries ms.date 2026-09-30 (tool 2026-08-21). Re-cite to the Credits Guide p.4 or the Learn pay-as-you-go-meters page.
- M-26 · P3 tiers (F-155, `ms-p3`) cite the Learn P3 page, where the tier table is an image, and record 2026-10-08 where the page's ms.date is 2026-07-17. Re-cite to the Credits Guide p.5 or the Studio Licensing Guide p.14.
- M-27 · E7 $99 (F-049) and enterprise Copilot $30 (F-090) are sourced to a third-party blog (samexpert.com); both values are correct on microsoft.com today. Re-point; refresh `ms-cop-ent` (2026-05-01).
- M-28 · The tool omits Microsoft's P3 caveat "Pre-purchase plan discounts don't combine with other discounts".
- M-29 · Two Learn pages disagree on whether Agent P3 or Copilot P3 is drawn first (ubb-setup: Agent P3 first; agent-pre-purchase: Copilot P3 first). Disclose; do not assert.

**Files, embed, browser**
- M-30 · The cowork-lane payload emits an 18th key, `employees`, which the planner uses; spec §4.4 says the 17-key set is exact and tests assert it. Add it to the spec and `validateCoworkPayload`, or drop it.
- M-31 · About 79 inputs inside the Cowork iframe (license table, build burn, per-task cost rows) have no label, `for` or `aria-label`.
- M-32 · The "Customer view" floating pill overlaps content at 375 px width.

### Low

- L-01 · Governance click paths exist twice: the engine's `clickPaths` (4 rows, surfaced in `customerView().guardrails`) is never read; the UI uses `GOV_WHERE` (8 rows). No disagreement today; no test ties them.
- L-02 · Cowork `loadRateCard` does `Object.assign(E.defaults().pricing, c.pricing)` before `normalize`, so an own `__proto__` key from JSON briefly pollutes before the JSON round-trip erases it; CoworkEngine has no bad-key guard anywhere. Filter `__proto__`/`constructor`/`prototype` before merging.
- L-03 · Quote text for indirect resellers reads "To: your provider (TD SYNNEX)" (CP 4418). Correct for this site's partners; wrong for a partner whose provider is another distributor. Ken's call whether to make it configurable.
- L-04 · Harness split 40/40/20 (`ghSplit`) cites the harness Learn page, which does not contain it; it is in the live web estimator. Agent P3 tiers 2 and 3 appear only in the Studio Licensing Guide, not the cited Learn page.
- L-05 · Date drift: `ms-value` tool 2026-08-28 vs 2026-06-04; `ms-bc-billing` 2026-07-08 (updated_at) vs ms.date 2026-02-04; F-182 2026-09-09 vs 2026-08-03. Pick one convention.
- L-06 · Three microsoft.com URLs now redirect (/copilot/business and /enterprise → /copilot/solutions/…; the security add-on page → /advanced-security-suites).
- L-07 · F-195: Copilot in 30 now has a published end date of 2026-12-31 (Partner Center August); the note still says it is not confirmed. Copilot in 30 is shown with a "Not for this account" pill rather than hidden.
- L-08 · E5 $60 is now published; the Cowork calculator still labels it "implied".
- L-09 · "Per started 1K tokens" rounding is the tool's assumption, not Microsoft's wording; label it. AI tools at 0 tokens per 1K bill 1 unit (premium 10 credits) where Microsoft's wording implies 0.
- L-10 · The Agent 365 announcement headline and body differ; the tool follows the body, which is correct. Both guides log the August 2026 rename to "Microsoft Copilot"; the price pages still sell "Microsoft 365 Copilot" SKUs, so the labels are still right.
- L-11 · V-31 cap day: "Day 8" is `Math.round(8.26)`; 4,000 credits are crossed during calendar day 9, or working day 7. It also fires with no purchase-date or country input.
- L-12 · Cowork hostile input (1,131 runs): 5 throws (`personaPreset` set to `__proto__`, `constructor` or `toString`; a whole state that is a string or number); `skuId: {}` prints "[object Object]" in V-27; `activation.rate = 1e308` prints "Infinity%" in the trace. No negative currency, no prototype pollution.
- L-13 · A Cowork sell rate of 0 or negative silently falls back to $0.01.
- L-14 · The Cowork "one light task every working day" scenario uses 21 days ($1,365); the web estimator uses 22 ($1,430).
- L-15 · The Cowork reconcile box is tagged Modeled although $51–91 is verified (F-158), and shows no ratio ($142.50 is 1.57× to 2.79× the web band).
- L-16 · Cowork partner-economics warnings (V-21/22/24/25/26/29) live in the flags card, hidden only in customer view and customer print.
- L-17 · For a greenfield 500 E3 estate, Cowork's "Why this one" says SMB bundles are available while every SMB path is marked infeasible.
- L-18 · V-11, V-12 and V-20 do not exist; the planner has 67 distinct P-ids (missing P-07, P-08, P-19, P-42–49, P-66–69, P-80–89).
- L-19 · OBJ-04 states the origin of the "25" as fact ("unused weight in Microsoft's old estimator code"); the 5-credit rate is right.
- L-20 · OBJ-06 not to spec: no {p3pct}, no "only if you use all of it", "commit units" jargon, $0.008 shown in sell mode.
- L-21 · OBJ-03 says autonomous runs "always bill" though F-182 is inferred; prints "covers 0 credits" where the generic line belongs. The "No figures in this scenario" marker is a digit regex (always flags OBJ-08, never flags cards full of zeros).
- L-22 · No Apply fix on NBA-02, 05, 06, 07, 08, 09, 11, 12 though the spec defines one; NBA-01's fix only sets `azurePayg`; NBA-09 ignores GitHub agents with no build sessions.
- L-23 · P-10 is unreachable (`normalize` nulls an invalid payload first; P-12 shows instead). P-54 fires on almost every capped environment. P-15 divides monthly volume by 31 and never checks the 100-emails-a-day limit it quotes.
- L-24 · The activation incentive carries an ms-verified pill with no fact behind it; the Credit Wrap range is stored 30–30 so the column shows 30% not 25–35%.
- L-25 · Two Cowork `nextStep` lines state unsourced claims as fact (insurance attestations on renewal applications; healthcare supervision obligation); the Cowork talk track states the 65% activation default as "people who'd really use Cowork".
- L-26 · The spec and F-010 point the $3,500–$8,000 build fee at `cpb.html` Stage 2; `cpb.html` is now a hub; the figure lives in `cpb-model-the-practice.html` (3023, 3317, 3705) and `cpb-field-guide.html` (487, 513).
- L-27 · Counts round to 2 dp per conversation (genPct 33.33 over 5 turns: 10,005 vs 9,999.75; 33.333 flow actions × 1,000 runs: 4,332.90 vs 4,333.29).
- L-28 · BC Expense preset uses 100 receipts (5,000); spec 50 (2,500). The rate is right.
- L-29 · Dataverse: 1,048,576 KB per GB (spec 1,000,000; anchor A22 expects 0.5 GB and the suite was written to the engine's 2.9296875 instead); 20 KB per session (spec 50); the 15/20/2 GB entitlement switches on when any agent is modeled, not when a billing path exists.
- L-30 · The spec's per-card `perAgentCap` does not exist; only the tenant-level yes/no/unsure flag. A ramp longer than 12 months is silently clamped.
- L-31 · Default `totalUsers` 50 (spec 0): the Studio ribbon shows "50 users without a Copilot license" before anything is entered. Template defaults: `reasoning.tokens` 0 (spec 2,000) so reasoning on adds nothing; autonomous keeps `daysActive` 22 (spec 30); `turns` 0 (spec 5); agent `env` '' (spec production / default).
- L-32 · Appetite admissibility wording ("stranded spend in the low scenario") is disclosed on the page; see H-12 for the spec conflict.
- L-33 · P-21's "Likely" is jargon in customer copy.
- L-34 · A blocked request to cloudflareinsights.com appeared in the browser console when the snapshot was served locally; neither page's source references it, so it is almost certainly the hosting layer. Confirm it is absent on the live site, since the footer promises no analytics.
- L-35 · The Cowork year-one credits emit as 7,883,942 against an exact sum of 7,883,942.31 (rounding only).
- L-36 · `fitsBiz` and the Cowork solver both ignore `monthly` billing for the bundle paths; $25.20 is never modeled in the Cowork licensing table.

---

## 3. Pricing-currency table (primary sources, live 2026-10-11, before Ignite)

Verbatim phrases and the full URL list are in the pricing sweep's working notes; this table records item, tool value, source value, source and date, and the match result. "Yes*" means the value matches but the tool cites the wrong page or date (see M-25 to M-29, L-04 to L-06).

| Item | Tool | Source | Source and date | Match |
|---|---|---|---|---|
| Classic / generative / action / grounding | 1 / 2 / 5 / 10 | same | Learn requirements-messages-management, ms.date 2026-08-03 | Yes |
| Agent flow actions | 13 per 100 | same | same | Yes |
| AI tools basic/standard/premium | 1/15/100 per 10 responses or 10 × 1K tokens | same | same | Yes |
| Reasoning | +10 per 1K tokens on top of the feature rate | same ("started" is the tool's rounding) | same | Yes |
| Content processing | 8 per page | same | same | Yes |
| Voice | 10 / 35 / 75 per minute | same | same | Yes |
| Computer use | 5 / 15 per step | same | Learn computer-use, 2026-07-03 | Yes |
| Harness runtime tiers | 100–300 / 300–500 / 500+ | same (image) | Learn billing-credit-overview 2026-09-10; Credits Guide p.16, 2026-10-08 | Yes |
| Harness split | 40/40/20 | same | aka.ms/CopilotCreditPlanningModel (live); not on the cited Learn page | Yes* |
| Harness build sessions | 1–20 / 21–60 / 61+ | same (image) | Credits Guide p.15 | Yes |
| Work IQ Tools API | 0.1 per call | same | Credits Guide p.13 | Yes |
| BC Sales Order / Payables / Expense | 2/2/5/5/5/5/2; 50 + 5 per line; 50 | same | Learn tenant-admin-center-manage-consumption-billing, ms.date 2026-02-04 (updated 2026-07-08) | Yes* |
| Payables limits | 100 emails / 500 invoices a day / 10 pages / 5 MB | same | Learn payables-agent, 2026-10-02 | Yes |
| Autonomous trigger runs billed | true, Likely | stated only for agent flows; order example bills 20 | rates page | Yes (Likely still right) |
| "25 per action" | retired | absent everywhere | rates page, both guides, live estimator | Yes |
| Enforcement | 125% agents / 100% flows | same | rates page | Yes |
| PAYG | $0.01 | $0.01 | Credits Guide p.4; Studio Licensing Guide p.13; not on the cited ubb-overview page | Yes* |
| Capacity pack | $200 / 25,000 a month, annual, no rollover | same | Studio Licensing Guide p.15, 2026-10-07 | Yes |
| P3 tiers | 3K–3M CCCU at 5/6/7/8/10/12/14/17/20% | 300K–300M credits, same | Credits Guide p.5; Studio guide p.14; Learn P3 page is an image, ms.date 2026-07-17 | Yes* |
| CCCU | $1 = 100 credits | same | Learn copilot-credit-p3 | Yes |
| Several P3 plans at once | Likely | not stated either way | Studio guide p.14–15; Learn P3 | Yes (Likely right) |
| Agent P3 tiers | 20K/100K/500K at 5/10/15% | same | Studio guide p.14 (Learn shows Tier 1 only) | Yes* |
| Billing order; M365 share | packs → P3 → PAYG; purchased − pre-allocated | same | Learn usage-based-billing-copilot-credits-setup, 2026-10-01 | Yes |
| Dataverse baseline / Studio / add-ons / PAYG | 3/3/1; 15/20/2; $40/$2/$10; $48/$2.40/$12 | same | Learn capacity-storage 2026-09-30; Studio guide p.8–9; Learn pay-as-you-go-meters 2026-08-14 | Yes |
| Windows 365 for Agents | $0.40 an hour; $5 a PC | same (US) | Learn windows-365/agents pricing, 2026-05-01 | Yes |
| Copilot Business list / promo / monthly / cap | $21 / $18 to 2026-12-31 / $25.20 / 300 | same ("for up to 300 users"; promo first year, annual) | microsoft.com (redirects to /copilot/solutions/business); Partner Center July 2026-07-29 | Yes |
| Enterprise Copilot | $30 | $30 ($31.50 monthly) | microsoft.com | Yes* (fact cites a blog) |
| E7 | $99 | $99 | microsoft.com/…/enterprise/e7 | Yes* (fact cites a blog) |
| Agent 365 | $15; Business Premium / E5 / Defender + Purview | same | microsoft.com/microsoft-agent-365; Partner Center July | Yes |
| Bundles: Basic + Copilot / Standard with Copilot / Premium with Copilot / Premium | $21 / $23.50 / $32 / $22 | same | Partner Center July; microsoft.com business plans | Yes |
| Defender / Purview / both | $10 / $10 / $15 | same | microsoft.com (redirects to /advanced-security-suites) | Yes |
| **Business Basic (Cowork)** | **$6.00** | **$7.00** | microsoft.com plans-and-pricing | **No** |
| **Business Standard (Cowork)** | **$12.50** | **$14.00** | microsoft.com business-standard | **No** |
| **E3 (Cowork)** | **$36.00** | **$39.00** | microsoft.com enterprise plans-and-pricing | **No** |
| E5 (Cowork, "implied") | $60 | $60, published | same | Yes (relabel) |
| December 1 default: date / scope / limit / countries | 2026-12-01 / new purchases / 4,000 adjustable / AU BE BR FR DE IN IT KR NL PL ES | same ("new purchases … standalone offers and bundles") | Partner Center October, 2026-10-08 | Yes |
| Specialization Pathway Two | $10,000 TTM each, two deployments | same | Partner Center August, 2026-08-25 | Yes |
| Copilot in 30 | 25 users / 30 days / <300 / from 2026-08-01 | same, plus end date 2026-12-31 | Partner Center July and August | Yes (note stale) |
| FY27 voucher | excludes CSP | same | fpc.microsoft.com KB-01841 | Yes |
| Growth margin workloads | Copilot, E5, E7, Defender, Purview, W365 Enterprise; not Studio | same | Partner Center October | Yes |
| Managed Environments enforcement | 2027-02 | same | Learn managed-environment-licensing, 2026-08-31 | Yes |
| Web estimator bands / $ per user | 100–280 / 280–400 / 400–700 a day; $51–91 | same ($5.10K–$9.06K for 100 users) | aka.ms/CopilotCreditPlanningModel, live | Yes |
| Buffer | 10–20% | same | Learn agent-usage-estimator, 2026-08-03 | Yes |
| AAH multipliers; AAV rate; report minimum | 6 / 2.8 min; $72; 50 licenses | same | Viva copilot-studio-agents 2026-06-23; agent-business-value 2026-06-04 | Yes* (ms-value date) |
| Estimator double-subtraction (O-2) | 4,800 vs 9,600 | reproduced live: 9,600 grounding line, "−4,800 negated for 20 licensed users" | microsoft.github.io/copilot-studio-estimator, live | Yes |

Could not verify from a primary source: whether a customer may hold several Copilot Credit P3 plans at once; whether autonomous triggers are billed as a general rule (stated only for flows); rounding to a started 1K tokens. All three are labeled Likely or disclosed in the tool, which is the right treatment.

---

## 4. Verified correct

**Rate card and Microsoft worked examples (independent calculator = tool, to the credit):** support bot 7,200 a day and 216,000 a month; sales research 4,800 billed + 2,400 zero-rated a day with licensed users subtracted once as a headcount; order processing 20 a run; grounded generative answer 12; enforcement example remainder 14,500, flows 14,500, agents 18,125, environment A 12,500, PAYG environment exempt; computer use 20 standard / 60 premium for 4 steps; P3 tiers $2,850 / $14,100 / $27,900 / $138,000 / $270,000 / $660,000 / $1,290,000 / $1,867,500 / $2,400,000 and Tier 2 $14,100 against $15,000 PAYG; BC Sales Order 1,650, Payables 6,500, Expense 2,500 at 50 receipts; GitHub harness 440 tasks → low 114,400 / high 184,800 with heavy flagged as a minimum; 100 × 4,000 = 400,000; blueprints 15 / 12 / 77 / 48; break-evens 3,000 / 2,100 / 1,800 / 2,520.

**SMB scenarios:** A 15,000; B 9,600 billed + 4,800 zero-rated; C 16,000; portfolio 40,600 a month and 487,200 a year; B on a website or with manual sign-in 14,400; C with trigger as action 18,000; C per 1K tokens at 1,500 tokens 20,000; C + 1 content page 19,200; A with 20% classic 13,500; A with 20% logging a lead 16,500; A with a greeting 16,500. At the rate-card point every appetite gives 1 pack + 15,600 PAYG = $4,272 a year; alternatives 2 packs $4,800, PAYG $4,872, Tier 1 + PAYG $4,722. Flows 13 per 100 prorated with no rounding to blocks; reasoning 1 / 999 / 1,000 / 1,001 tokens → 10 / 10 / 10 / 20; voice 3,050 for 10 conversations of 1, 2 and 3 minutes; Work IQ always billed.

**Cowork stock case:** persona credits 14,250 / 14,625 / 22,800 / 8,225 a user; 755,000 credits and $7,550 a month; band $5,285–$9,815; $145.19 per active user; 52 active of 80. Ramp seats 25, 30.4, 35.8, 41.2, 46.6, then 52; monthly credits 362,980.77 / 441,384.62 / 519,788.46 / 598,192.31 / 676,596.15 / 755,000 × 7; year one 7,883,942 credits = 78,839.42 CCCU; steady 90,600 CCCU. Steady P3 3 × Tier 3 $83,700 + $600 PAYG = $84,300 displayed, 7.0% effective, confirmed global cheapest by brute force; year-one P3 mix $72,750 + $839.42 PAYG = $73,589.42 with the 839 CCCU remainder disclosed; packs 30 + 5,000 PAYG = $72,600; PAYG $90,600; "packs match only Tier 9 per credit" is right. Sell-mode margins exact at $0.009 / $0.01 / $0.012; negative margin fires V-29 and is never clamped; margin stays null until the cost basis is known; PEC defaults unsure and is not applied. V-31 per-user 14,519 (÷ 52 basis seats) and silent outside CSP. Web-estimator band $51.04–$90.64 recomputes from F-159; ratios 3.15× / 5.24× / 7.86×; implied activation 54%, actual 65%. All 28 existing V-warnings fire on their trigger state and stay silent on their control state.

**Purchase optimizer and combined plan:** the search cost model equals the month-by-month drawdown in the order packs (no rollover) → P3 (12-month pool) → PAYG; the DP enumerates both exact and covering P3 mixes so the "Tier 2 beats five Tier 1s" case is caught; 755,000 flat ranks packs $72,600 < P3 $84,300 < PAYG $90,600; combined SMB trio + Cowork matches every month's lo/mid/hi for the flat and the 25→100 ramp (72 values each); flat best 23 packs $82,336.20 for all appetites; year dollars, PAYG credits, stranded credits and P3 run-out month re-simulate to the cent for every recommended option; Microsoft 365 remainder 750,000 − 100,000 = 650,000 with starvation flagged; the optimizer was never beaten in 1,341 brute-force checks across random demands and all three appetites.

**Invariants (2,000 fixed-seed random states):** licensing one more user never raised billed credits, per card or in the pool; lo ≤ mid ≤ hi everywhere; billed + zero-rated = gross on every card; best ≤ PAYG at list for every appetite; partner cost-side inputs (motion, provider rates, PEC, services, costs) never changed the pool, the best option or `customerView()`, which stayed byte-identical; the sell price moves only the labeled customer-rate fields and never the pool credits or the best option.

**Leak and isolation:** `customerView()` with every partner field set to distinctive values contains none of margin, marginPct, cost, provider, pecPct, costMonthly, motion, asks, nba, talk, objections, ladder, specialization, incentives, AgentCare, Credit Wrap or 30%; the quote text for all four motions, the CSV, the governance sheet, the customer print, the Cowork talk track and the Cowork handoff payload carry no partner figure; the hub source has no storage, fetch, XHR or beacon; `postMessage` targets `location.origin`; customer view (C / Esc) applies to the hub and the iframe together and exits together.

**Files:** hub session round-trips with every field group (compute equal before and after); `customerSafe` strips every partner value; partner card carries pricing and services and zero customer data and changes only `state.partner` on load; P-03 fires on an older rate card and the state reprices; 48 hostile files across three parsers and 6,320 hostile engine calls: no throw, no NaN or Infinity, no negative currency, no prototype pollution, readable `ok:false` reasons. CSV header matches the 17 spec columns byte for byte; quantity × rate = credits on every row; per-agent sums reconcile to the result (point and point + hi rows); RFC 4180 quoting round-trips.

**Browser (snapshot served locally at 1280 / 1440 / 375):** tab ARIA roles and states; 1 / 2 / 3 keys; Cowork status line through all seven questions to results; Combined "Include Cowork" auto-wiring; Combined tab and customer print agree with each other; Cowork-only print fires in the iframe; no horizontal scroll at any width; zero console errors from app code; zero partner markers anywhere in customer view.

**Edges:** zero agents → PAYG; one agent with 1e6 users → 10,000,000; 301 Business seats → P-77 and Enterprise; the 11 excluded countries get no December default while US and GB do; start months 2026-10 to 2027-01 apply the default and 2025-10 does not; the promo is live only when the start is ≤ 2026-12; ramp factors at 0%, 100% and 10% over 6 months; paused cards contribute 0; a PAYG-linked environment is never cut.

---

## 5. Not covered by this audit

Exhaustive per-field browser sweep of all 12 archetypes and every card field (engine-level coverage is complete; the browser pass was time-boxed), the standalone governance print and the 50-card layout stress in the browser, formal contrast measurement, and true paginated print rendering (content was confirmed leak-free and condensed; page count was not visually confirmed). Ignite 2026 (November 17–20) may change rates; everything in §3 should be re-run after 2026-11-24.

---

## 6. Postscript: fixes applied (2026-10-11, branch qa/credit-planner-audit-2026-10-11)

Every Critical and High finding, every Medium except the two owner decisions, and the mechanical Lows were fixed on top of main at 29eadc9, one finding per commit, each with a regression test that failed before the fix and passed after. Suites on the merged result: planner 1,291, Cowork v3 16,296, Cowork motion 15,188, all green. The Cowork golden snapshot moved once, for C-09 (licenseMonthly 2,780 → 2,840; allInMonthly 10,330 → 10,390). The Cowork branch's new facts were renumbered F-226 to F-229 at merge because main had taken F-205 to F-225 in the meantime.

**Left for the owner:** M-20 (the Assessment price source), L-03 (the "To: your provider (TD SYNNEX)" quote line), and whether partner revenue should follow the customer-price plan rather than the list-price plan when the two differ (the partner notes flag the difference). Monthly billing at $25.20 is still not modeled on the Cowork page. The fact checker's 163 pre-existing MOVED/AMBIGUOUS flags are unchanged.

**Commits (newest first):**

- `272b90b` US English on the Cowork page: modeled, labeled, canceled, percent, license
- `1c057ef` C-03 (conversation side), M-07: P-75 quotes the customer-basis saving; NBA-03 gives the starvation day when the engine has it
- `1a886e5` L-33, L-34: P-21 in plain words for the customer; confirm neither tool page loads Cloudflare Web Analytics
- `9742884` L-23: P-15 checks the 100-emails-a-day Payables limit it quotes, per active day
- `9c3d9cf` L-22: spec Apply fixes on NBA-06, 07, 08, 09 and 12; NBA-09 fires on any GitHub card
- `ed14c55` L-19, L-20, L-21: objection cards to spec; "no figures" marker keyed on unfilled placeholders
- `727ccec` L-35: accept a rounded Cowork year one and carry the exact ramp sum
- `f99547b` L-31: spec card defaults: 5 turns, 2,000 reasoning tokens, 30 days on autonomous, production env
- `a1a6229` L-01: the governance sheet reads the engine click paths instead of keeping a second copy
- `ba244bb` L-25: hedge two unsourced next-step claims and call 65% a modeled activation
- `f33178c` M-32: the Customer view pill no longer sits on content at 375 px
- `59bd129` L-30: add the per-card perAgentCap and feed it to the governance per-agent limits
- `e29b4b5` L-17: stop offering SMB bundles in "Why this one" when none is feasible
- `45a85a1` M-31: label the hub's three file inputs (session, partner card, Cowork session)
- `240b563` L-16: mark partner-economics warnings partner-only on the warning itself
- `1183c8d` L-29: Dataverse in decimal GB at 50 KB a session, 15/20/2 GB only once a billing path exists
- `1aa5fb6` L-15: tag the web estimator's $51-$91 band Microsoft and show the ratio
- `b6dd7e3` M-25..M-29, L-04..L-07, L-10, L-24, L-26: correct citations (values unchanged)
- `46b67d6` L-09 + L-28: 0 tokens per 1K bills 0 AI-tool units; BC Expense preset at 50 receipts
- `d9d7b77` L-14: price "one light task every working day" on 22 working days
- `d258d49` L-13: warn when the credit sell rate is $0 or below
- `c731b7a` M-23 + M-24: default the tenant base to 'unsure' and add the Defender + Purview suites path
- `a2651fe` L-12: survive hostile presets, non-object states, object SKU ids and huge rates
- `b33cf69` L-02: filter prototype keys out of a loaded rate card before merging
- `a1c9675` M-08: autonomous and Business Central cards run at full volume, not on the adoption ramp
- `1910891` M-22: P-77 fix moves the Business seats above 300 to enterprise instead of dropping them
- `e5a1617` M-30 (2/2): assert spec section 4.4 lists exactly the emitted payload keys
- `a94fee5` M-30 (1/2): list the cowork-lane payload's employees key in spec section 4.4
- `bc48fa1` M-07: blame Cowork starvation on allocations only when they cause it, on the middle scenario, with a day
- `2bce8a6` M-19: blockers first in the next-best-action order (01, 03, 04, 05, 07, then 02, 06, 08-13); spec table to match
- `c1bf841` M-05: stop pushing E5 estates to E7 for gaps E5 already licenses
- `eca277a` M-18: NBA-02 fires on an external audience or no sign-in, with credits and dollars at the customer rate
- `e6e7bcb` M-04: let a past-cap estate put 300 on a Business bundle and the rest on enterprise
- `164b00e` M-17: O-9 becomes the spec build-burn objection; the Autopilot text is dropped
- `ace4ee0` M-06: count Cowork's draw in the tenant pool's enforcement cut
- `c689806` M-03: label several P3 plans held at once "Likely" (ms-inferred)
- `7796bbd` M-16: hedge O-2 with its test date, drop the false citation claim, never say the estimator shows 0
- `4e53eb6` M-02: pair the steady P3 saving with the ramped year one; fix stranded credit
- `51e90fe` M-15: OBJ-07 states the Agent 365 prerequisite, whether this tenant meets it, and the Dataverse use
- `e78c1b4` H-14: label every enforcement day with its scenario, allocate at high x buffer, warn past prepaid
- `b404d8f` M-01: weigh capacity packs in the year-one buying guidance
- `f2d873a` M-14: reasoning "adds 10 credits per started 1,000 tokens on top of the step", not "bills twice"
- `1523582` M-13: NBA-04 Apply links the environment to pay-as-you-go when limits are set and agents are still cut
- `5cfc457` M-12: add the spec talk-track headlines T-ZERO, T-BUY, T-GUARD, T-ADJ, T-SEAT; say plainly when nothing is modeled
- `d885d78` H-13: bill tenant-graph grounding on generative turns only, and relabel the field
- `826f636` H-07: date every promo price on the Cowork page (promo through 2026-12-31)
- `39d3b4a` H-12: test the commit appetite against the middle scenario, as spec 6.2 says
- `ef844cf` M-11: keep partner-only text out of the talk track (NBA-13 opener, P-28 coaching)
- `f43f7c7` H-11: pin the co-term model for step-up packs and correct P-37
- `4658117` M-10: NBA-14 only when nothing else matched; a throwing rule skips itself, not the others
- `3b0f726` H-05: read the usage diagnosis at Microsoft's $0.01, never the sell rate
- `e467617` H-06: offer Copilot Business only to estates that can buy it, and split at the 300-seat cap
- `fe6f1ba` M-09: NBA-05 hedges to the high scenario when only it crosses, and gets the spec Apply fix
- `49e10a1` H-02: let a tenant-draw environment spill into the tenant pool instead of stopping on day 1
- `795ca90` H-10: P-53 prints the December 1, 2026 default date (RC.capDate), not the first horizon month
- `4eadbab` L-11: give V-31's cap day as the working day the limit is crossed
- `6bd15ed` H-04: size V-31's raised per-user limit on the heaviest persona
- `eed99ee` H-09: ladder gets its own unpriced setup rung, the spec per-rung conditions and honest ticks
- `f87435b` H-01: headline the customer's buy line at the rate-card point, buffer as a labeled "up to"
- `4a0c5ee` H-03: treat the highest owned Business base as a floor in the solver
- `a6b98b0` C-09: correct three stale base SKU prices and verify E5 (also L-08)
- `a160f25` H-08: fire NBA-11 on packs > 1 or any P3 with nothing measured; fix its opener; add its Apply fix
- `5711fd8` C-07: omit the tenant spending limit and its alerts when there is no Microsoft 365 lane
- `9bf50b6` C-05: choose the customer's plan at the customer's prices, so buy never exceeds pay-as-you-go
- `56a6a47` H-07: state "promo through 2026-12-31" wherever $18 appears; fire P-76 whenever the crossover uses the promo
- `b54eca1` C-03 + C-04: judge license-or-meter at the customer's prices, monthly billing before the promo
- `26f87c1` C-02: price every licensing path all-in on one basis
- `ba5119c` C-08: warn on both tabs when the Cowork tab is priced at list and the plan at the partner rate
- `bee668c` C-06: build OBJ-08 and OBJ-01 from the customer rate, not Microsoft list
- `8ce1c66` C-01: treat the 300-seat SMB cap as inclusive in the licensing solver
