# The Copilot Credit Planner QA Audit Prompt

**Purpose:** paste the prompt below into a fresh Claude Code session running on Fable, opened on the repository `C:\Copilot Website Cloudflare`, to run a full correctness, pricing, UX and sales-accuracy audit of the Copilot Credit Planner and the Cowork calculator it embeds. Written 2026-10-11 against planner engine VERSION 1.0.0, rate card `2026-10-11`, and commit `950485e` on `main`.

**How to use:** start the session in the repo, paste everything under "THE PROMPT" in one message, and let it run. Expect a ranked findings report, a recomputed-scenario workbook, and fixes on a branch. The session pushes nothing to `main` without Ken's explicit approval in that chat.

---

## THE PROMPT

You are auditing a live sales tool. Partners at Microsoft CSP resellers serving SMB customers project it in workshops and print its customer report as a leave-behind. **A wrong number here is said out loud in front of a customer and then invoiced.** Your job is to make sure no partner can ever get an inaccurate result, an outdated Microsoft price, a misleading recommendation, a leaked partner margin, or a broken screen from this tool.

Work as three people at once, and do not let any one of them soften the others:

1. **A Microsoft licensing and channel economics expert.** You know Copilot Credits, Copilot Studio billing, Copilot Cowork usage-based billing, capacity packs, the Copilot Credit Pre-Purchase Plan (P3), CSP motions (direct bill, indirect reseller, outside CSP), partner-earned credit, NCE terms, SMB SKUs and their 300-seat caps, Business Central agents, Dataverse capacity, Agent 365 and the December 1, 2026 CSP Copilot Business usage-based-billing default.
2. **A lead QA engineer** who assumes every derived number is wrong until reproduced by hand from the primary source, types garbage into every field, and opens every file the tool can import with a hostile copy.
3. **A UX and copy editor** for a partner audience: is every screen clear, correctly formatted, consistent, accessible, in US English, and easy to follow live, under pressure, in front of a customer?

### 0 · Ground rules for this session

- **Scope.** The target is `copilot-credit-planner.html` (the hub: Cowork tab, Copilot Studio agents tab, Combined plan & report tab) and `cowork-calculator.html` (the Cowork Cost & Conversation Simulator, embedded as the hub's Cowork tab and still usable on its own). Live URLs: https://copilotplaybook.com/copilot-credit-planner.html and https://copilotplaybook.com/cowork-calculator.html. The home-page card is in `index.html` (`#cowork-heading`).
- **Read first, in this order:**
  - `specs/copilot-credit-planner.spec.md` (the build contract)
  - `research/cowork-calculator-studio-autopilot-2026-10-11.md`
  - `research/copilot-studio-smb-partner-2026-10-11.md`
  - `DESIGN.md`, `FACTS.md`, and the fact records F-009, F-013, F-090, F-147, F-149..F-204 in `data/facts.json`
  - the engine header comment at the top of `<script id="planner-engine">` in `copilot-credit-planner.html` (the full public API and every input/output shape)
  - the Cowork engine (first `<script>` in `cowork-calculator.html`, exported as `CoworkEngine`) and `specs/cowork-calculator-v3-remediation.spec.md`
- **Test suites that must stay green** after any change you make: `node tools/test-credit-planner.js` (~920 checks), `node tools/test-cowork-v3.js` (~15,430), `node tools/test-cowork-motion.js` (~15,190). They self-extract the engines from the pages. Treat them as a floor, not proof: **your job is to find what they do not test.**
- **Never trust the tool's own anchors.** The spec and tests list expected values (15,000 / 9,600 / 16,000 credits; $72,600 / $84,300 / $90,600; 18,125; and so on). Recompute every one independently from Microsoft's published rates before you accept it. If the tool and its tests agree with each other but not with Microsoft, both are wrong.
- **Verify pricing against current primary sources, live, today.** Use web search and fetch. Microsoft Learn pages carry an `ms.date`. The Copilot Credits Guide is at `https://go.microsoft.com/fwlink/?linkid=2368800` and the Copilot Studio Licensing Guide at `https://go.microsoft.com/fwlink/?linkid=2320995`. Use Partner Center announcements, microsoft.com pricing pages, and the Azure P3 pages. Third-party blogs are never a source for a number. For every price you check, record: the value in the tool, the value at the source, the source URL, its date, and a verbatim phrase under 15 words. **Ignite 2026 (November 17–20) may have changed rates. If today is after Ignite, re-verify everything.**
- **Delegate wisely.** Use subagents for the independent recomputation, the live-pricing sweep, the browser walkthroughs and the lint sweeps. Run them in parallel where they are independent. Keep raw page dumps out of your own context. Route models by risk:
  - Fable or Opus: math and pricing judgment.
  - Sonnet: mechanical sweeps and browser click-throughs.
  - Haiku: lookups.
- **Changing things.**
  - **Audit first.** Write the findings report before fixing anything.
  - **Then fix,** on a branch named `qa/credit-planner-audit-<yyyy-mm-dd>`, one finding per commit. Each commit adds or tightens a test that would have caught it, and leaves all three suites green.
  - **Golden snapshot.** The Cowork v3 suite has one. Any fix that moves a stock figure must edit it deliberately and record old → new in the commit message.
  - **No pushing to `main`** and no opening a PR until Ken approves in this chat.
  - **Commit messages** end with the attribution line your session is configured to use.
- **Repo conventions you must follow:**
  - US English everywhere.
  - Never name a rival IT distributor in any deliverable or page. TD SYNNEX is the site owner and is fine.
  - Customer Zero data appears only as percentages and ratios.
  - Every currency value on a page needs a fact ID in `data/facts.json` (DESIGN §8.10).
  - `data/facts.json` is edited with surgical text inserts only: 1-space indent, CRLF working copy, no trailing newline, never a `json.dumps` round trip.
  - No browser storage, analytics, network calls or external scripts on either calculator page (a trust promise to partners).
  - Shell heredocs in this Windows environment mangle backslashes: write patch scripts with the Write tool.
  - Avoid regex escapes inside JavaScript template literals.
  - Any command you hand to Ken must be PowerShell, not bash.

### 1 · Independent recomputation of the math

Build your own calculator, a small Node or Python script in the session scratchpad, straight from the Microsoft rate card. Do not import either engine. Run every scenario below through your script and through each engine (extract the engines the same way the test suites do), and compare to the cent and to the credit. Save the comparison as a CSV workbook: scenario, line, your value, tool value, delta, source.

**Copilot Studio rate card to verify, then use:**
- Classic answer 1; generative answer 2; agent action 5; tenant graph grounding 10.
- Agent flow actions 13 per 100.
- AI tools basic / standard / premium: 1 / 15 / 100 per 10 responses, or per 10 × 1K tokens.
- Reasoning: +10 per started 1K tokens, on top of the feature rate.
- Content processing 8 per page.
- Voice 10 / 35 / 75 per minute.
- Computer use 5 or 15 per step.
- GitHub Copilot harness: 100–300 / 300–500 / 500+ credits per task, at a 40/40/20 split; build sessions 1–20 / 21–60 / 61+.
- Work IQ Tools API 0.1 per call.
- Business Central agents:
  - Sales Order Agent: 2 + 5 per availability check + 5 per quote or order write + 2 + attachment 5 or 2.
  - Payables Agent: 50 per invoice + 5 per line.
  - Expense Agent: 50 per receipt.
- Pay-as-you-go $0.01 per credit. Capacity pack $200 per 25,000 credits a month, no rollover.
- P3: nine fixed tiers (3K / 15K / 30K / 150K / 300K / 750K / 1.5M / 2.25M / 3M CCCU at 5 / 6 / 7 / 8 / 10 / 12 / 14 / 17 / 20%), where 1 CCCU = $1 = 100 credits.
- Enforcement: agents disabled at 125% of prepaid capacity, flows at 100%.
- Dataverse:
  - Baseline 3 / 3 / 1 GB.
  - 15 / 20 / 2 GB once a Copilot Credit purchase option exists.
  - Add-ons $40 / $2 / $10; PAYG $48 / $2.40 / $12.
- Windows 365 for Agents: $0.40 an hour, plus $5 per always-available PC.
- Agent 365: $15 per user.

**Scenario matrix** (each must match your script exactly; any mismatch is a finding):

1. **Microsoft's own worked examples**:
   - 7,200 a day for the support bot.
   - 4,800 for 100 unlicensed users while 50 licensed users are excluded.
   - 20 per order-processing run.
   - 12 for a grounded generative answer.
   - The 18,125 enforcement cutoff (25,000 total, 10,000 to environment A, 500 PAYG to environment D).
   - Computer use: 4 steps = 20 standard / 60 premium.
   - P3 Tier 2 = $14,100 against $15,000 PAYG.
   - Business Central Sales Order 1,650 and Payables 6,500.
   - GitHub harness 10 people × 2 a day × 22 days = 114,400 minimum.
   - 100 users × 4,000 = 400,000.
2. **The three SMB scenarios** for a 60-seat professional-services firm (also the "Three SMB agents" preset):
   - A. Website FAQ: 1,500 conversations × 5 generative turns, external, unauthenticated.
   - B. HR/IT helpdesk: 60 users, 20 licensed, 4 conversations a user, 5 turns, generative + tenant-graph grounded, Teams.
   - C. Invoice intake: 400 autonomous runs × (6 actions + 1 premium prompt).

   Then:
   - Confirm the portfolio and the cheapest way to buy it (pay-as-you-go, whole packs, packs + overflow, P3 tiers).
   - Re-run B on a non-Microsoft channel and with manual authentication.
   - Re-run C with "count the trigger as an action" on.
   - Re-run C with the prompt priced per 1K tokens at 1,500 tokens.
3. **Cowork stock defaults**: 755,000 credits and $7,550 a month; year one 78,839.42 CCCU on the 6-month ramp from 25 users; steady 90,600 CCCU.
   - **P3:** 3 × Tier 3 = $83,700 for steady state; 2 × Tier 3 + Tier 2 + Tier 1 = $72,750 for year one.
   - **Packs:** 30 packs + 5,000 credits a month on PAYG = $72,600 a year.
   - **December 1 cap:** about 14,519 credits per active user, so the cap is hit around day 8.
   - **Holding several P3 plans at once:** this is labeled "Likely". Find out whether Microsoft now states it. If a customer can hold only one plan, every multi-plan answer is wrong and you must say what the correct single-plan answer is.
4. **Combined plan**: Cowork stock + the SMB trio in one pool. Check:
   - every month of the 12-month chart;
   - the year-one cost of the recommended option;
   - the pay-as-you-go baseline;
   - billing order packs → P3 → PAYG with no pack rollover;
   - stranded credit;
   - the month P3 runs out;
   - the Power Platform pre-allocation reducing what Cowork can draw (F-183).
5. **Edges:**
   - Zero agents, zero seats, Cowork excluded.
   - One agent with 1e6 users.
   - A 301-seat Copilot Business tenant (300 cap).
   - A country on the December 1 exclusion list.
   - A plan start month before and after December 2026.
   - Sell rate below, at and above $0.01.
   - Provider rate above sell rate (negative margin must warn, never hide).
   - The PAYG-linked environment that exempts it from enforcement.
   - The ramp at 0%, 100% and 24 months.
6. **Hostile input**: NaN, negative, 1e308, text, empty, prototype keys (`__proto__`, `constructor`, `toString`) in every number, select and file field. Neither engine may throw, show NaN, undefined or Infinity, or produce a negative currency.

**Also prove by construction**:
- Adding licensed users never raises billed credits.
- Partner cost inputs never change any customer-facing number.
- The best purchase option is never more expensive than pay-as-you-go.
- No partner figure ever enters the customer view.

### 2 · Pricing currency and SKU accuracy

**Check every Microsoft number against today's primary source:**
- The full rate card above.
- Capacity pack price and terms.
- All nine P3 tiers and prices; Agent P3 tiers.
- Copilot Business $21 list, $18 promo (and its end date), $25.20 on monthly billing.
- Microsoft 365 Copilot $30; E7 $99; Agent 365 $15 and its prerequisites.
- The SMB bundles: Business Basic + Copilot Business $21, Business Standard with Copilot $23.50, Business Premium with Copilot $32, Business Premium $22.
- Defender and Purview suites $10 / $10 / $15 combined.
- The December 1 default: date, 4,000-credit limit, scope (new purchases only?) and the country list.
- The Agentic Business Solutions specialization threshold ($10,000 TTM per deployment, two deployments).
- Copilot in 30.
- The FY27 Copilot Agents voucher's CSP exclusion.
- Growth-margin workloads.
- Managed Environments enforcement, February 2027.
- Microsoft's current web Copilot Credit Estimator bands, $51–91 for a corporate knowledge worker (aka.ms/CopilotCreditPlanningModel).

**Then:**
- For each fact ID, confirm the page, the engine constant and the `data/facts.json` record all say the same thing, and that `python tools/check-facts.py` resolves its anchors.
- **SKU recommendations.**
  - Walk the Cowork licensing solver (`#cardLic`) and the planner's license-vs-meter crossover through at least eight account shapes: under and over 300 seats, mixed bases, E3/E5 estates, no Copilot seats, Copilot seats with idle users.
  - Confirm every recommended SKU exists in CSP today at the stated price and seat cap, is a valid path to Cowork and to free licensed agent use, and that promo expiry is disclosed wherever a promo price appears.
- Check every Microsoft source link on both pages resolves (no 404s) and that its stated date matches the page.

### 3 · Conversation and recommendation accuracy

**The planner's next-best-action rules.** There are 14:

| ID | Rule |
|---|---|
| NBA-01 | Billing path |
| NBA-02 | Website agents bill every conversation |
| NBA-03 | Power Platform allocations starve Cowork |
| NBA-04 | The 125% switch |
| NBA-05 | December 1 limit |
| NBA-06 | License instead |
| NBA-07 | Business Central default environment |
| NBA-08 | Dataverse overage |
| NBA-09 | GitHub build burn in the SOW |
| NBA-10 | Reasoning bills twice |
| NBA-11 | Measure 90 days, then commit |
| NBA-12 | Agent 365 |
| NBA-13 | Specialization |
| NBA-14 | Default motion |

For each rule:
- Build a scenario that should trigger it and one that should not.
- Confirm the first-match order makes sense in a real sales meeting (a blocker must outrank an upsell).
- Confirm every "why" line quotes the scenario's own numbers correctly.
- Confirm every **Apply** fix changes exactly what it says.

**The rest of the conversation layer:**
- **Talk track:** every line has to be true, customer-addressed and free of jargon.
- **Objection cards (nine):**
  - Each answer is factually right today, uses the scenario's numbers, and never overstates.
  - "Microsoft's estimator says less" claims Microsoft's Copilot Studio agent usage estimator subtracts licensed users twice. Re-test that tool live before letting the claim stand.
  - The "25-credit myth" card must match Learn.
- **Upsell ladder:** the recommended rung must be the next thing to sell, not the biggest.
- **Service prefills:**
  - Agent build $3,500–$8,000 (F-010/F-004).
  - AgentCare $350/$400.
  - Governance base $12.
  - Credit Wrap 30%.
  - Assessment $1,500–$7,500.
  - Agent 365 overlay $10.

  Each must match the Playbook pages it cites (`cpb-model-the-practice.html`, the Cowork calculator's ladder) and be clearly the partner's editable price, never presented as Microsoft's.
- **Cowork calculator layer:** run the same check against its conversation engine (`nextStep` rules, the six-rung ladder, `buildTalk`, `partnerNote`, `ratioBlock`, the "Two Microsoft estimators" reconciliation box), and its warnings V-01 to V-31.
- **Planner warnings P-01 to P-92:**
  - Each must fire when it should and stay silent when it shouldn't.
  - It must read clearly and be marked with the right audience (partner vs customer).
- **Incentives and programs:** never state a figure the sources do not support. The Cowork activation incentive terms are gated, so no figures.

### 4 · Imports, exports, customer views and prints

**Files**, on the hub and the Cowork page, with valid files, files from older schema versions, and hostile files: wrong `__type`, truncated JSON, 5 MB arrays, prototype keys, NaN and 1e308 values, unknown future keys.
- Hub session save and load: `__type: 'credit-planner-session'`. A round trip must restore an identical state, the Cowork session hand-off into the Cowork tab must work, and a stale rate-card version must raise P-03.
- Partner card save and load: `'credit-planner-partner-card'`. It must carry rates and services and never customer data.
- Cowork session (`cowork-session`), rate card (`cowork-rate-card`) and compare (diff) mode.
- None may corrupt state, throw, or silently change a figure.

**Exports:**
- **Quote/handoff text to the provider:** addressed correctly for each CSP motion, carries the year-one need, the fixed-size P3 "Order as" mix and the finality terms, and contains no margin, partner-earned credit, provider cost or service price.
- **CSV cost trace:** consumption rows only. Columns and totals reconcile to the screen.
- **Governance "Copy settings" text:** every click path and value correct.

**Customer view (C / Esc):**
- It must strip partner content from the hub and from the embedded Cowork frame at the same time, and both must exit together.
- Walk every tab in customer view. Enumerate every visible dollar figure and classify it customer-safe or leaked.
- Sell-rate mode must show the customer the partner's price consistently across Cowork and Studio, with the basis labeled.

**Prints (print-customer, print-internal, print-governance, and the Cowork-only print):**
- Use the browser print preview, or emulate print media.
- The combined customer report must fit one page, contain the Cowork figures, carry dated sources and a provenance legend, and leak zero partner economics.
- The partner working copy must contain everything.
- The governance sheet must stand alone.
- Check headers, page breaks, an empty account name and a maxed-out configuration.

### 5 · UI, formatting and usability

Serve the repo over HTTP. A same-origin iframe does not work from `file://`. `.claude/launch.json` has a `site` entry on port 8800; use the browser preview tools. Then walk the tool as a partner would, at 1280×720 (projector), 1440 wide, and 375 wide (phone).

- **Hub frame:**
  - Tabs and the 1/2/3 keys.
  - The Cowork iframe auto-height and the scroll-to-top on each Cowork screen change.
  - The status line ("not yet at results" / "included").
  - Account name and motion sync from the Cowork tab, including total users prefilling from the employee count.
  - Sticky bars, and what happens to them below 720 px.
- **Studio tab:**
  - Every preset and every one of the 12 archetypes, and every "Reproduce Microsoft's example" box.
  - Every agent field: harness; audience × channel × sign-in; licensed headcount; volumes; turns; generative %; greeting; grounding %; actions; flows and their trigger; AI-tool tier and per-response vs per-1K-token pricing; reasoning; content pages; voice; computer use and Windows 365 hours; the autonomous toggles; transcript retention; knowledge GB; Business Central fields.
  - Duplicate, rename, pause and delete.
  - Focus never jumps while typing.
  - Billed / Zero-rated / Likely chips and reason codes are right.
  - The "your licenses already cover" footer is right.
  - The expandable trace shows quantity × rate = credits with a working source link and date.
- **Combined tab:**
  - Include-Cowork control.
  - Plan start month and ramp. Do controls that do nothing stay visible when the ramp is "None"?
  - The 12-month SVG chart is readable and labeled.
  - The purchase options table, the enforcement timeline and "Show Microsoft's example".
  - The governance sheet.
- **Formatting:**
  - Consistent number formats: thousands separators, credits vs dollars, ranges written low–high, rounding rules stated.
  - US date format.
  - Units on every figure.
  - No orphan grid cards (DESIGN §8b.3).
  - No `max-width` on prose.
  - Colors and type sizes only from DESIGN §1–§4.
  - Every named doc reference is a live link.
- **Copy:**
  - Run a US-English sweep on rendered text, not just source (licence, colour, optimise, behaviour, organise, modelled, labelled, cancelled, catalogue, programme, centre, whilst, "per cent").
  - Run a competitor-name sweep.
  - Check for jargon a partner would not say to a customer.
  - Check for any sentence that states a modeled figure as fact.
- **Accessibility:**
  - Every input has a label.
  - Tabs have the correct ARIA roles and states.
  - Focus is visible.
  - Contrast meets 4.5:1 on all text.
  - Keyboard-only operation works end to end.
- **Hygiene:**
  - No console errors or warnings.
  - No network requests from either calculator page.
  - Performance: no visible lag while typing in a 50-agent configuration.

### 6 · Deliverables

1. **`research/credit-planner-qa-audit-<yyyy-mm-dd>.md`**
   - An executive verdict: is the tool safe to put in front of a customer today, yes or no, and why.
   - Then every finding, ranked **Critical** (a customer sees a wrong number, a wrong price, a wrong recommendation or a partner margin), **High**, **Medium**, **Low**.
   - Each finding has: what is wrong, exact reproduction steps (inputs or file), expected vs actual with the arithmetic, the primary source with its date, the user impact, and the proposed fix.
   - Close with a "verified correct" list of everything you checked that passed, so the next audit knows what was covered.
2. **`research/credit-planner-qa-scenarios-<yyyy-mm-dd>.csv`** — the recomputation workbook from section 1.
3. **A pricing-currency table** inside the report: every Microsoft number, its value in the tool, its value at the source, the URL, the date and the match result.
4. **Fixes** on the QA branch, one commit per finding, each with a regression test, all suites green, golden-snapshot moves called out.
5. **A short summary in chat:** counts by severity, the top five findings, what you fixed, what needs Ken's decision, and the PowerShell commands Ken would run to review the branch.

Do not stop early. Do not summarize the tool back to me; I built it. Find what is wrong, prove it, and fix it safely.
