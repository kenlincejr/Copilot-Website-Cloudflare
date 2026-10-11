# Cowork calculator: adding Copilot Studio and Autopilot

**Gathered:** 2026-10-11. **Status:** research and wiring plan, no code changed.
**Inputs:** three parallel research passes: (1) architecture map of `cowork-calculator.html`, (2) Autopilot primary-source sweep, (3) Copilot Studio rate and price re-verification against Learn and the October 2026 guides. Builds on `research/copilot-studio-outcomes/01-economics-and-billing.md` (2026-08-28), which this supersedes where they differ.

---

## 1. Verdict

| Module | Can we match the Cowork calculator's fidelity? | Why |
|---|---|---|
| **Copilot Studio, standard harness** | **Yes, and the rates are tighter than Cowork's.** | A published, deterministic rate card, unchanged since at least June 2026 (Wayback snapshots compared). The uncertainty sits entirely in the volume inputs, which is the same uncertainty Cowork already discloses. Microsoft publishes worked examples we can lock as regression anchors. |
| **Copilot Studio, GitHub Copilot harness** | **Yes, at the same fidelity as Cowork.** | Microsoft publishes only light/medium/heavy task bands (100–300 / 300–500 / 500+ credits), the same shape as Cowork's tiers. Same ±band treatment applies. |
| **Autopilot** | **No, not today.** | Private preview since end of September 2026. No rate card, no estimator, no benchmark, and it is absent from the October 2026 Credits Guide and from the admin center's UBB service list. Any number we print would be ours, not Microsoft's. |

Autopilot is still worth adding, but as a **readiness and exposure panel**, not a priced line, with a clearly labeled what-if that never enters customer totals. It becomes a priced module the day Microsoft publishes a rate. Ignite (2026-11-17 to 11-20) is the likely date.

---

## 2. Findings that affect the page we already ship

These came out of the research and are independent of the new modules.

### 2.1 The P3 discount is interpolated, and Microsoft sells discrete tiers

- **What the page does:** `P3_ANCHORS` (cowork-calculator.html ~L1153) has three sourced points and log-interpolates between them. The code comment says "only three points are sourced."
- **What Microsoft publishes:** the October 2026 Copilot Credits Guide and the Azure portal (copilot-credit-p3, ms.date 2026-07-17) now show all nine tiers. Each is a fixed purchase size.

  | Tier | CCCU | Credits | Discount | Price |
  |---|---|---|---|---|
  | 1 | 3,000 | 300K | 5% | $2,850 |
  | 2 | 15,000 | 1.5M | 6% | $14,100 |
  | 3 | 30,000 | 3M | 7% | $27,900 |
  | 4 | 150,000 | 15M | 8% | $138,000 |
  | 5 | 300,000 | 30M | 10% | $270,000 |
  | 6 | 750,000 | 75M | 12% | $660,000 |
  | 7 | 1.5M | 150M | 14% | $1,290,000 |
  | 8 | 2.25M | 225M | 17% | $1,867,500 |
  | 9 | 3M | 300M | 20% | $2,400,000 |

- **The effect on stock defaults** (computed from the live engine):
  - The engine gives `commitCccu` 90,600 a **10.75%** discount: `p3Annual` $80,859, `p3Saving` $9,741.
  - Under the real tiers, 90,600 CCCU is three Tier-3 purchases (90,000 CCCU at **7%**, $83,700) plus 600 CCCU on PAYG. The saving is about **$6,300**.
  - The page overstates the P3 saving by about $3,400, or roughly 55%. It is tagged `ms-modeled`, so the provenance is honest, but the full table now exists and the interpolation should go.
- **To confirm before fixing:** that buying multiple units of one tier is allowed. The Azure portal is the check. The fix is a cheapest-cover optimizer: tier purchases plus a PAYG remainder, never interpolation.
- **Test impact:** the 78,839 / 90,600 CCCU *asks* do not move. The discount, `p3Annual`, `p3Saving` and the V-24 dollar figure (test-cowork-v3 L2010) do.

### 2.2 Capacity packs are mispriced in the engine

- The engine prices `capacityPacksCccu` at $1/CCCU, which is $0.01 per credit.
- The real pack price is **$200 for 25,000 credits per month = $0.008 per credit**, with no rollover. That is cheaper than every P3 tier except Tier 9.
- `data/facts.json` already carries the correct $200/25,000 figure, so the engine and facts.json disagree.
- The input has no UI today, so the live exposure is nil. It matters as soon as pooling exists.
- Billing order in the Microsoft 365 admin center (setup page, ms.date 2026-10-01): **capacity packs → Copilot Credit P3 → Agent P3 → PAYG.**

### 2.3 The December 1 CSP default will cut off the users we model

- **The change:** from **2026-12-01**, new Copilot Business licenses sold through CSP get UBB switched on by default, with a **4,000 credits per user per month** default limit (Partner Center, October 2026 announcements). That limit is about $40.
- **What the page models:** $145 per active Cowork user per month on stock defaults, inside Microsoft's own $82–$228 published range.
- **The consequence:** a modeled user would hit the default limit around day 8 of the month, unless the admin raises it.
- This is a partner talking point the page should carry now, as a warning on the Copilot Business SKU path. The pattern is like V-05, and the next free warning ID is V-31.

### 2.4 Product rename

- The Credits Guide change log says Microsoft 365 Copilot was renamed **Microsoft Copilot** in August 2026.
- The page copy should be swept, as a separate commit.

### 2.5 The test baseline is already red on HEAD

- `test-cowork-v3.js`: 13,120 passed, 7 failed. `test-cowork-motion.js`: 15,183 passed, 2 failed.
- **Cause:** 9c8be33 removed `indirectProvider` without updating the suites (motion L67-71, v3 R1.9/R8.2). ba6b007 rewrote the ratio paragraph (R7.4).
- On this Windows checkout, v3 also **crashes** at R9.2: the `uiSource` end markers assume LF, and the working copy is CRLF.
- This must be green before any module work, or "both suites pass" proves nothing.

---

## 3. Copilot Studio: verified constants

Every value is from a Microsoft primary source; the page date is ms.date unless noted. Each one needs a fact ID in `data/facts.json` before it can appear in the page (DESIGN §8, prohibition 10).

| Key | Value | Source |
|---|---|---|
| PAYG per credit | $0.01 | pay-as-you-go-meters (2026-08-14); Credits Guide Oct 2026 |
| Capacity pack | $200 / 25,000 credits / month, billed annually, no rollover | Copilot Studio Licensing Guide Oct 2026 |
| CCCU | 1 CCCU = $1 = 100 credits; 1-year term; non-cancelable; auto-renews | Licensing Guide; copilot-credit-p3 (2026-07-17) |
| P3 tiers | Table in §2.1 | Credits Guide Oct 2026; Azure portal |
| Agent P3 (ACU) | 20K / 100K / 500K ACU at 5 / 10 / 15%; applied after Copilot P3 | Licensing Guide Oct 2026; agent-pre-purchase (2026-09-29) |
| Classic answer | 1 (also each proactive greeting or conversation start) | requirements-messages-management (2026-08-03); faq-billing-licensing |
| Generative answer | 2 | rate card |
| Agent action | 5 (triggers, topic transitions, deep reasoning, connector/MCP/REST calls) | rate card |
| Tenant graph grounding | 10, so a grounded answer costs 12 in total | rate card |
| Agent flow actions | 13 per 100 | rate card |
| AI tools basic / standard / premium | 0.1 / 1.5 / 10 per response, or the same per 1K tokens | rate card |
| Reasoning models | Feature rate **plus** 10 per 1K tokens (they bill twice) | rate card |
| Content processing | 8 per page | rate card |
| Voice classic / GenAI / premium | 10 / 35 / 75 per minute | rate card |
| Computer use | 5 per step standard; 15 per step premium (Claude Opus 4.6); **never zero-rated** | computer-use (2026-07-03) |
| Code interpreter | Billed at the premium AI-tools rate | code-interpreter-for-prompts (2026-09-30) |
| GitHub Copilot harness, run | 100–300 / 300–500 / 500+ per task | billing-credit-overview (2026-09-10) |
| GitHub Copilot harness, build | 1–20 / 21–60 / 61+ per creation session; **bills from build, not publish** | Credits Guide Oct 2026 |
| GitHub harness estimator defaults | 22 working days; 40/40/20 light/medium/heavy split; assumes Anthropic Opus 4.8 | Copilot Credit Estimator bundle (2026-09-23) |
| Work IQ Tools API; Managed Runtime | 0.1 per call each | Credits Guide Oct 2026 |
| Enforcement | Standard-harness agents disabled at 125% of prepaid; flows blocked at 100% | rate card |
| Estimator buffer | Add 10–20% | agent-usage-estimator (2026-08-03) |

### 3.1 The zero-rating rule is the headline

- **Free:** business-to-employee use by an M365 Copilot-licensed user, under that user's own identity, in Microsoft channels, on the standard or Copilot chat harness.
- **Never free:** GitHub Copilot harness, computer use, the Work IQ API, and B2C or external-channel traffic.
- **Fair use:** "fair usage limits apply," and they are not quantified anywhere.
- **What it means for the estimate:** for a typical internal agent, **the Copilot license is the meter.** The bill comes from unlicensed users, external customers, autonomous runs, CUA and the GitHub harness.
- **Open item:** whether autonomous triggers running under a licensed maker's identity are zero-rated. Microsoft's own estimator always bills them. Default to billed, labeled.

### 3.2 Microsoft worked examples, for use as regression anchors

| # | Scenario | Result |
|---|---|---|
| 1 | Customer support: `[(4×1)+(2×2)] × 900` | **7,200** credits per day |
| 2 | Sales performance: `[(4×2)+(4×10)] × 100` unlicensed users (the 50 licensed users are excluded) | **4,800** |
| 3 | Order processing: 4 actions × 5 | **20** per run |
| 4 | Tenant-graph prompt | **12** |
| 5 | Enforcement: 25,000 total, 10,000 to environment A, 500 to PAYG environment D; tenant remainder 14,500 | Cutoff at **18,125** |
| 6 | Computer use, 4 steps | **20** standard / **60** premium |
| 7 | P3: 1.5M credits | **$14,100** vs $15,000 PAYG |
| 8 | Harness: 10 people × 2 per day × 22 days = 440; at 40/40/20 | Minimum **114,400** |
| 9 | CSP Copilot Business: 100 users × 4,000 | **400,000** per month cap |

Microsoft's own per-volume blueprints: expense receipt 15, approval 12, timesheet 77, Business Central expense 50, payables 50 + 5 per line, sales research 48. These make good preset archetypes.

### 3.3 Where Microsoft's Studio estimator falls short, which is our edge

- PAYG pricing only: no packs, no P3, no pooling with Cowork.
- Classic answers and greetings are never charged.
- Flows don't scale with traffic.
- No generative-answer credit on action turns.
- Dead legacy weights (`autonomous: 25`) are left in the code, which is the likely origin of the "25 credits per autonomous action" folklore.

---

## 4. Cowork and Studio share one pool, so the page must too

- "Copilot Credits are pooled at the tenant level" (Credits Guide, October 2026).
- Power Platform admin center (manage-usage-github-copilot-harness, 2026-08-28): Studio consumption **reduces the prepaid capacity available to Cowork**.
- Microsoft 365 admin center: available credits = purchased − credits pre-allocated to Power Platform environments.
- **Rule for the calculator:** size packs, P3 and PAYG against **Cowork + Studio (+ an Autopilot what-if) together**, applying packs → P3 → PAYG in that order. Pricing each product separately double-counts the packs and hides the tier jump that pooling buys.

---

## 5. Autopilot: what is known

| Item | Status |
|---|---|
| Product | Autopilot in the new Microsoft Copilot app, formerly Microsoft Scout. A persistent, cloud-hosted agent with its own identity, memory, computer and workspace. Announced 2026-09-25 (Official Microsoft Blog; Partner Center). |
| Status | Private preview from end of September 2026. No GA date. |
| Billing | Usage-based billing in pooled Copilot Credits. **Requires a USL** (user-subscription-license-usage-based-billing, 2026-10-05). |
| Rate | **None published.** Microsoft prices its other agentic workloads on Models + Runtime + Context + Tools (Credits Guide pp. 6, 11, 16). Autopilot is long-running, so runtime is the probable cost driver. This is an inference, not a source. |
| Included allowance | None found in M365 Copilot, E5, E7 ($99) or Agent 365 ($15). |
| Admin trap | Spending policies have **"Auto-apply new services" on by default**. When Autopilot lands as a billed service, existing policies cover it automatically unless an admin turns that off. |
| Not the same thing | Foundry "autopilots" (an Entra agent-identity category, Agent 365 seats), GitHub Copilot CLI autopilot mode (GitHub AI credits), Windows Autopilot (device provisioning). All are ruled out of a Copilot Credit model. |

---

## 6. Wiring plan: add, rename nothing

### Phase 0: green baseline

- Update the suites for the `indirectProvider` removal and the R7.4 copy rewrite.
- Make the `uiSource` end markers line-ending agnostic (normalize `\r\n` → `\n` on read).
- Commit separately.

### Phase 1: correct the existing billing math, with Ken's product call on the anchor change

- Replace `P3_ANCHORS` interpolation with the nine-tier table and a cheapest-cover optimizer.
- Fix pack pricing to $0.008 per credit.
- Add the packs → P3 → PAYG order.
- Add V-31 for the CSP Copilot Business 4,000-credit default.
- Update the V-24 test expectation deliberately, with the diff shown.

### Phase 2: Copilot Studio module

- **Engine:**
  - Add a pure `computeAgents(state)` inside the existing first-`<script>` IIFE.
  - Export it on `CoworkEngine`.
  - Return it as a sibling key `r.agents`, never inside `ctx`. This keeps `assertCtxSane` and the 17-key motion-invariance list out of the blast radius.
- **State:**
  - Add a new top-level branch `agents: { enabled:false, list:[] }`. `hydrate()` defaults missing top-level keys, so old session files load unchanged.
  - The nested `list` must be clamped explicitly in `normalize()`. The hydrate merge is one level deep, and R1 totality will catch it otherwise.
- **The first question is the harness fork:**
  - Standard or chat harness: priced off the rate card.
  - GitHub Copilot harness: tier bands, plus a build-phase line.
- **Per agent, ask:**
  - Audience: licensed internal, unlicensed internal, or external.
  - Monthly conversations or runs.
  - Turns per conversation.
  - Percent grounded in the tenant graph.
  - Actions per run.
  - Flows.
  - AI-tool tier.
  - Reasoning yes/no and tokens.
  - CUA steps and model.
- **Presets:** Microsoft's archetypes (support bot, order processing, expense receipt, approval, sales research).
- **UI:**
  - One new wizard step, "Agents," between step 5 and step 6, so the billing step sizes the pooled commit.
  - One `span2` results card.
  - Economics go in `.partner-only` or inside `#cardBilling`. **No new IDs in the strip sets**, which are asserted at exactly 12 selectors.
  - Update the hard-coded "seven questions" copy, `.pathlist`, `STEP_ICON`, `ECHO` and the intro list.

### Phase 3: pooled commit

- A pure `pooledCommit(ctx, agents, autopilot)` sizes the commit on the combined total.
- Cowork's own `cccuRequired` / `commitCccu` / `p3Annual` stay as Cowork-only figures.
- Only the quote export, ECHO.step6 and V-24 switch to the pooled figures, and only when a module is enabled.

### Phase 4: Autopilot readiness panel

- **Partner-only.**
- **Readiness checklist:**
  - USL in place.
  - Frontier enrollment.
  - "Allow agents built by Microsoft" turned on.
  - AI provider (Anthropic) enabled.
  - Spending policy exists.
  - **"Auto-apply new services" decision made.**
  - Per-user limits set.
- **Optional what-if:**
  - Inputs: number of Autopilots and tasks per day.
  - Priced on the GitHub-harness task bands as a stated proxy.
  - Provenance `editorial`.
  - Shown as a separate "headroom to reserve" line. **Never in customer totals or print.**
- **Date stamp:** "No Microsoft rate as of 2026-10-11, re-check after Ignite."

### Phase 5: third self-extracting suite, `tools/test-cowork-agents.js`

Must assert:
- Modules off ⇒ every existing ctx field deep-equal to before, including the 755,000 / $7,550 and 78,839 anchors.
- All nine Microsoft worked examples in §3.2 reproduce exactly.
- Hostile and `1e308` inputs stay finite.
- No CCCU, P3 or margin figure reaches the customer view or print.
- Old session files without `agents` load to the anchor.
- The Autopilot what-if never appears in customer totals.

---

## 7. Partner context: what makes it more than a calculator

1. **License or meter crossover.**
   - An unlicensed user whose agent usage exceeds about 3,000 credits/month ($30) costs more on the meter than an M365 Copilot license would. At Copilot Business promo pricing ($18), the break-even is about 1,800 credits.
   - The page can say, per agent: *"license these N users instead. It's cheaper and they get Copilot."* That turns a consumption quote into a seat conversation.
2. **Pooling surprise.**
   - Studio consumption silently eats Cowork's prepaid capacity and spills to PAYG.
   - Show the pooled tier jump, and recommend environment allocation with "draw from tenant pool" turned off.
3. **The 125% kill switch is an SLA event.**
   - Agents go dark at 125% of prepaid; flows stop at 100%; users find out by the agent breaking.
   - Per-agent caps are the first-day configuration: Power Platform admin center → Licensing → Copilot Studio → Manage agents. There is no tenant-wide default agent limit.
   - Azure budgets only alert. That is a managed-service line item.
4. **The GitHub harness bills from build.** A pilot needs a build budget in the SOW. Developer and trial environments moved to UBB on 2026-09-01.
5. **Reasoning bills twice.** It is the biggest silent cost driver, and it needs a toggle with an explicit warning.
6. **December 1 default-on** for CSP Copilot Business (§2.3).
7. **Specialization progress.**
   - The Copilot Studio specialization requires 2 new customer deployments at at least $10,000 TTM each (Partner Center, July 2026; verify the exact wording).
   - The page can flag when a modeled deal's annual Studio spend clears that bar.
8. **Incentives.**
   - Copilot Cowork CSP Activation Incentive (launched 2026-09-01; terms gated).
   - CSP growth margin from 2026-10-01 for Copilot, E5 and E7 (Copilot Studio is not listed).
   - The Frontier Partner specialization grants Agent P3 credits.
9. **Autopilot readiness** as a discovery hook: the "Auto-apply new services" default is a concrete reason to open a governance conversation now, before a price exists.

---

## 8. Not verified, still open

- Whether multiple purchases of one P3 tier are allowed. Check in the Azure portal; this decides the optimizer.
- Whether autonomous triggers under a licensed identity are zero-rated.
- Per-model or per-token rates and the harness-fee formula for the GitHub harness.
- The numeric fair-use limit.
- Windows 365 for Agents pricing for CUA.
- Whether the PAYG meter works on a CSP Azure plan subscription.
- CSP part numbers for P3 and PAYG. The capacity pack is CFQ7TTC0LH1F.
- Copilot Credit P3 eligibility wording differs between sources: Azure page "Copilot Studio" vs the Microsoft 365 setup page "Cowork". The pooling statements are unambiguous.
- The terms of the Cowork activation incentive (gated; third-party figures unverified).
- Everything Autopilot pricing.

## 9. Sources

All dates are ms.date or published dates.

**Microsoft Learn: Copilot Studio**
- requirements-messages-management (2026-08-03)
- harnesses-overview (2026-09-21)
- agents-experience/billing-credit-overview (2026-09-10)
- faq-billing-licensing (2026-08-03)
- agent-usage-estimator (2026-08-03)
- computer-use (2026-07-03)
- code-interpreter-for-prompts (2026-09-30)
- guidance/govern-credit-consumption (2026-10-06)

**Microsoft Learn: Power Platform**
- manage-usage-github-copilot-harness (2026-08-28)
- pay-as-you-go-meters (2026-08-14)

**Microsoft Learn: Azure reservations**
- copilot-credit-p3 (2026-07-17)
- agent-pre-purchase (2026-09-29)

**Microsoft Learn: Microsoft 365 Copilot**
- usage-based-billing-copilot-credits-setup (2026-10-01)
- user-subscription-license-usage-based-billing (2026-10-05)

**Microsoft Learn: Partner Center announcements**
- July (2026-07-29)
- September (2026-09-30)
- October (2026-10-08)

**Guides**
- Copilot Credits Guide, October 2026 (Last-Modified 2026-10-08)
- Copilot Studio Licensing Guide, October 2026 (Last-Modified 2026-10-07)
- Copilot Studio Licensing Guide, February 2026, for P3 USD prices

**Blogs**
- Official Microsoft Blog, 2026-09-25: Introducing the new Copilot with Home, Code and Autopilot
- Tech Community, 2026-09-25: Evolution of the Copilot pricing model

**Estimators**
- microsoft.github.io/copilot-studio-estimator (served JS, 2026-07-01)
- aka.ms/CopilotCreditPlanningModel (bundle, 2026-09-23)
