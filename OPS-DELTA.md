# OPS-DELTA.md — deep pass on `cpbops.html`

**Researched 2026-08-27.** Nothing was written to `cpbops.html`. This is a findings report.

**Scope.** `cpbops.html` (916 lines, byline *April 2026*, untouched since 16 Jul) checked against: every Microsoft Learn page it cites, current Partner Center announcements through Aug 2026, `CPBWorkbook.xlsx` Tabs 2 / 8 / 9, and the sibling pages already refreshed in the last pass (`cpb.html`, `cowork.html`, `frontier.html`, `coworksession40.html`).

**Headline.** The engagement *structure* holds up — five gates, five phases, the Microsoft lifecycle mapping, the RACI, the ALM strategy, all three case studies. What has moved is the **evidence layer underneath it**: four of the numbers this document presents as Microsoft standards are no longer what Microsoft says, and the readiness toolkit at Gate 1 is describing a SharePoint admin experience that has been rebuilt since April.

Second-order finding: **the workbook is now ahead of the guide.** Tab 8 and Tab 9 already carry FY27 SMB pricing, Cowork GA, Copilot Credits, and the native Agent Evaluation feature. `cpbops.html` is the companion document explaining tabs that have since been updated without it.

---

## Tier A — factual errors against a source the document itself cites

These are the seven that matter most, because each one is presented in the markup as a Microsoft standard with a citation badge attached.

### A1. The `>90% pass rate` gate is no longer Microsoft's number

The document states this **six times** — the Section 2 stat block, the Tab 9 intro, the Phase 2 golden-prompt block, the Phase 3 header, the Phase 3 body, and the pass-rate interpretation table — each attributed to *Microsoft Copilot Studio Agent Evaluation Checklist*.

That checklist ([now at `learn.microsoft.com/en-us/agents/agent-evaluation/evaluation-checklist`](https://learn.microsoft.com/en-us/agents/agent-evaluation/evaluation-checklist), `ms.date` 2026-02-10, updated 2026-05-20) now says the opposite:

> **Evaluation passing score**: Agents can produce varying responses to the same prompt due to their probabilistic nature… To ensure reliable evaluation, run each test set multiple times and calculate the average success rate. **Aim for a realistic pass rate of 80-90%, based on your business needs.**

Three separate corrections fall out of this:

- **The threshold moved** — 80–90%, not >90%.
- **It is explicitly *not* binary.** The document's "Hold the gate: … The gate is binary" callout now argues against its own source, which frames the number as business-dependent.
- **Single-run measurement is now wrong method.** Microsoft asks for *multiple runs averaged*. The Phase 3 formula `pass rate = (passed ÷ total) × 100` describes one run.

The 75–90% / <75% interpretation bands underneath are also orphaned — under the new guidance, 85% is a pass, not a "review false positives first" state.

**My recommendation:** keep >90% but relabel it as *the CPB production gate* — a deliberately stricter bar than Microsoft's floor, which is a defensible and sellable position — and cite Microsoft's 80–90% as the industry baseline you are choosing to exceed. That preserves the commercial argument (the gate is what the customer is paying for) without misattributing the number. It also survives the next doc revision.

### A2. The Adoption Planning Checklist is a five-phase model, not four

Stated twice — Section 1 (*"four-phase deployment model and Champion program structure"*) and the Reference List. [The live page](https://adoption.microsoft.com/en-us/copilot/essential-guide/plan/) is now **Plan → Implement → Adopt → Manage → Improve**.

The five-phase shape is actually better for you: *Manage* and *Improve* are exactly Gates 4–5 plus the Tier 1 ongoing cadence, so the CPB structure maps onto it more cleanly than it did onto four.

### A3. The Forrester TEI time-savings figure is roughly 60% too high

Gate 4's ROI Report section says *"Time savings per user per week — Microsoft benchmark: 3–4 hrs/user/wk for professional services"* with a **Forrester TEI** badge. [The TEI study](https://tei.forrester.com/go/microsoft/M365Copilot/?lang=en-us) reports **9 hours per month** — about **2.25 hrs/week** — against a $38 fully-burdened hourly rate, with 50% of recovered time recaptured to other productive work.

3–4 hrs/wk is 12–16 hrs/month. This is the single most dangerous number in the document, because it sits inside the deliverable a customer's finance team reads, multiplied by a loaded labor rate and 52 weeks. **Same error is in the workbook** (Tab 8, Gate 4, "Build Copilot ROI Report draft").

Note also the *50% recapture* factor — Forrester does not treat saved time as dollar-for-dollar recovered value, and the ROI Report's `loaded labor rate × hrs saved × active users × 52` formula does. Worth adding the haircut before a CFO finds it for you.

### A4. The 30% threshold is not in the source it is attributed to

Section 3 says *"Microsoft's Copilot adoption framework establishes a concrete intervention trigger"* badged to the **M365 Copilot SMB Success Kit**, and the Reference List describes that source as carrying the *"30% threshold framework."*

I could not find a 30% figure on [the SMB page](https://adoption.microsoft.com/en-us/copilot/smb/) or in the Success Kit. What is there: the **flight crew model** (correctly cited), four pillars (Leadership / Target Scenarios / Technical Readiness / User Enablement), and one statistic — *engaged employees are 2.6× more likely to fully support a successful AI transformation.*

There **is** now a correct citation for a threshold of this shape. Viva Insights **Copilot Analytics** shipped a rebuilt Copilot Adoption Overview in 2026 that *"introduces external benchmarks for the percentage of active Copilot users"* — a real, Microsoft-supplied benchmark the partner can pull per tenant. That is a stronger claim than a fixed 30%, and it is a better story: *we benchmark you against Microsoft's population, not a rule of thumb.*

**Recommendation:** re-badge 30% as the CPB intervention trigger (same treatment as A1), and cite Copilot Analytics benchmarks as the measurement instrument.

> Side note that corrects `RESEARCH-DELTA.md` §8: the **2.6× multiplier** is not TD SYNNEX-internal and not net-new. It is published on Microsoft's SMB adoption page. If it goes into the site it can be cited publicly.

### A5. Section 7 arithmetic — two errors, one cause

The financial table's totals do not sum, and do not match Tab 2:

| Line | `cpbops.html` | Tab 2 / recomputed | |
|---|---:|---:|---|
| Total Recurring Retainer gross profit | **$134,120** | **$133,920** | ✗ |
| Total Copilot Practice gross profit | **$253,340** | **$253,140** (Tab 2 cell J41) | ✗ |

`51,840 + 16,200 + 34,650 + 5,535 + 15,840 + 4,500 + 5,355 = 133,920`. One $200 slip in the retainer subtotal propagates into the grand total. Every other cell in the table — all seven retainer rows, all five project rows, the $240,000 project subtotal, $119,220 project GP, $504,600 total revenue — reconciles to Tab 2 exactly.

### A6. The Phase 5 drift trigger is inverted

Phase 5 cadence table: *"Pass rate vs. baseline; tuning tickets **if <5pp drop**"*. As written that fires when the agent has barely moved and stays silent when it collapses. Tab 9 has it right: *"if policy compliance or response quality drops **>5 points** from baseline, trigger agent tuning sprint."*

### A7. The MCI reference link is dead

`https://partner.microsoft.com/en-us/membership/microsoft-commerce-incentives` → 404 (`partner.microsoft.com/en-US/notfound`). Every other link in the document resolves, though **six of the seven Microsoft Learn links now redirect** (see C8).

---

## Tier B — Microsoft mechanics that changed under the document

### B1. Gate 1's oversharing toolkit describes an admin experience that has been rebuilt

This is the largest single block of work. The document names four SAM tools; [the current Copilot-readiness guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/get-ready-copilot-sharepoint-advanced-management) (`ms.date` 2026-07-16, updated 2026-08-18) is a five-step flow, and [the entitlement matrix](https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license) (2026-06-30) now enumerates ~20 included features across three categories.

**Two of your four tool names are stale:**

| `cpbops.html` | Current name |
|---|---|
| "Site permissions across your organization report" | **Site permissions baseline report** (a *permission state report*) |
| "Permissioned User Report" | **Site permissions for users report** |
| Site Access Reviews | ✓ correct — *"Site access review for all reports"*, included, updated Jul 2026 with customizable owner notifications |
| Restricted Access Control (RAC) | ✓ correct and included |

**Five things are missing, and three of them are load-bearing for services you sell:**

- **Restricted Content Discovery (RCD)** — the single most important omission. RCD blocks a site from surfacing in Copilot and org-wide search **without touching permissions**, which is precisely the "governance cleanup is in progress" state your RAC bullet describes — and it is the lighter, faster instrument for it. Included with the Copilot license. Enhancements rolled out worldwide late July 2026 ([MC1427972](https://mc.merill.net/message/MC1427972)). Microsoft's own guidance is explicit that it reduces discovery but is *not* a substitute for permission remediation — which is exactly the framing your Gate 1 already uses for RAC.
- **Content Management Assessment hub** — SharePoint admin center → Advanced Management → *Start assessment*. Microsoft's **Step 1**, ahead of the DAG report. It literally *"defines Copilot readiness for the organization"* and tracks progress across recurring 30-day runs. This is a productized version of your `$3,500 × 12/year` Copilot Readiness Assessment line, and it should be the engine inside that deliverable rather than a competitor to it. The recurring-assessment cadence is also a clean Tier 1 retainer artifact.
- **SharePoint Admin Agent** — a governance agent that reads the reports and recommends actions. Doubles as your best "use Copilot internally first" proof point (Priority #1) and as a Gate 1 accelerator.
- **AI insights** (*Get AI insights* on DAG, sharing-links, sensitivity-label, inactive-site and change-history reports) — collapses the interpretation labour in a readiness assessment.
- **Site lifecycle management + Microsoft 365 Archive + Microsoft 365 Backup** — Steps 2 and 5 of Microsoft's flow. Your Orchestry citation already flags *"storage estate as the most-skipped readiness dimension"*; Microsoft now ships the tools for it (site ownership / inactive-site / attestation policies), and archived content is explicitly excluded from Copilot grounding.

**Also:** the EEEU report is now a named activity report (top 100 sites shared org-wide in the past 28 days). Your text says remediate `"Everyone except external users"` without naming the report that finds them.

**And the entitlement citation should change.** Replacing *"per Microsoft's November 2024 announcement"* + the hedge footnote with the live feature matrix is a straight upgrade — it is dated, exhaustive, and covers WW/GCC/GCC-H/DoD. Two real caveats it surfaces that you can now state precisely instead of hedging:

- **Restricted site creation by apps is NOT included** — requires the SAM Plan 1 add-on.
- **The sensitivity-labels DAG report requires E5 or G5.** This bites your Gate 1 timing note directly: an SMB on Business Premium can apply labels but cannot run the label-coverage report. Worth saying out loud in the regulated-vertical guidance.

### B2. Purview DSPM for AI is absent — and the rest of the site already has it

`cpb.html` and `coworksession40.html` both carry DSPM for AI. `cpbops.html` does not mention it. Microsoft's own [M365 Agents Checklist](https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/m365-agents-checklist) names exactly three resources for "manage oversharing of SharePoint content": SAM, **DSPM for AI**, and the Secure & Governed blueprint. You cite one of three.

DSPM for AI data risk assessments now run **weekly by default over the top 100 SharePoint sites by usage**, and 2026 added item-level remediation (resolve / apply label / notify owner / remove sharing link). Licensing caveat for your audience: full DSPM needs E5 or E5 Compliance — but note the current CSP promo, **50% off Purview Suite for Business Premium customers with Copilot**, which is the offer that makes this reachable for an SMB and belongs in the Gate 1 conversation.

Also: the Secure & Governed blueprint is now organised as **three pillars — Remediate oversharing / Set up guardrails / Meet regulations** — with a [downloadable PDF and PPT](https://aka.ms/Copilot/SecureGovernBlueprintPDF). Your Reference List calls it a "phased oversharing remediation framework," which is now only the first pillar.

### B3. Copilot Credits are missing entirely — Credit Wrap is Azure-only

`cowork.html` (6 refs), `frontier.html` (2), `coworksession40.html` (3) all discuss Copilot Credits. `cpbops.html`: zero. Its Credit Wrap is described purely as *"30% Azure markup"* / *"$250–500 Azure/mo"*, matching `cpb.html`'s Credit Wrap section — which means **both** are behind the rest of the site.

Current reality: Copilot Studio has billed in **Copilot Credits** since 1 Sep 2025 — **$0.01 PAYG, $0.008 prepaid** ($200 / 25,000-credit pack), plus a pre-purchase commit-unit plan. Consumption is feature-based and stacks: Microsoft's own worked example is **12 credits for one tenant-graph-grounded response** (10 grounding + 2 generative answer), rising past **112 credits** with reasoning enabled. Cowork bills on the same meter.

For a document whose thesis is *managed services and cost governance*, this is a missing service line rather than a missing footnote — and it is the strongest available answer to "what does AgentCare actually protect me from." Two supporting assets worth naming:

- The [Copilot Studio Agent Consumption Estimator](https://microsoft.github.io/copilot-studio-estimator/) — Microsoft's own scoping tool. This belongs in Phase 1, where you size the SOW.
- **Copilot Analytics cost-management insights** (default-enabled) now surface Copilot Credit usage and spend, including Cowork — the reporting surface for the Credit Wrap and the AgentOps MBR.

**Workbook note:** Tab 9 Phase 1 still says *"message credits ($200/month for 25K messages, or $0.008/message)"* — pre-Sept-2025 terminology. It also says autonomous agents consume credits, which understates it: consumption is per-feature across generative answers and grounding, not autonomy-gated.

### B4. Copilot in 30 — the biggest net-new addition available to you

GA in CSP New Commerce **1 Aug 2026**, running through **31 Dec 2026**. A **25-user, 30-day M365 Copilot Business trial** for organisations under 300 employees. Product ID `CFQ7TTC0MM8R`, SKU `006Z`.

This lands directly on top of Pre-Gate → Gate 2 and gives the Activation Sprint a zero-cost front door. What Microsoft ships with it:

- **[Copilot Success Planner](https://aka.ms/CopilotIn30)** — free, no sign-in, shareable *before* the trial is transacted. Generates a per-user 30-day plan plus a sponsor/admin roadmap covering setup, comms, progress tracking, and end-of-trial evaluation.
- A prescribed four-week arc: **Outlook (W1) → Teams/meetings (W2) → Word/Excel/PowerPoint (W3) → agents (W4)**, with Cowork prompts in W3–4 if left enabled.
- [Copilot in 30 launch kit](https://aka.ms/Copilotin30Kit), Copilot Success Microskilling series (from 3 Aug 2026), and a [partner FAQ](https://aka.ms/CSPM365CopilotPartnerFAQ).

Two things to reconcile deliberately rather than paste in: Microsoft's four-week arc is a **competing sequence** to your Gate 1 → Gate 2 rollout, and the Success Planner overlaps your `$1,500–$3,000` prompt-library-v1 deliverable. My read is that both are accretive — Microsoft supplies the generic scaffold, you supply the role-specific library, the governance work, and the measurement — but the guide should say so explicitly, or a partner will read it as free substitution for a billable deliverable.

### B5. AgentOps has grown a control plane the document doesn't know about

Four capabilities that landed since April, all of which make AgentCare more deliverable and more defensible:

- **Copilot Control System (CCS)** in the M365 admin center — the agent inventory, sharing/publishing policy, connector governance, and lifecycle approval surface. Microsoft's Agents Checklist is built around it. Your AgentOps runbook lists eight items and none of them reference where the agent inventory actually lives.
- **Multi-tenant agent management** — public preview, announced Aug 2026. Consolidated agent inventory across every tenant a partner governs, install/block across tenants, per-tenant risk and activity insights, tenant switcher with no separate admin accounts. *(Risk/activity insights require an Agent 365 license on the user.)* This is the single most MSP-relevant thing in the August announcements and it is what makes "10 customers × 3 agents" operable by one AI Specialist — the exact scenario your Phase 5 economics describe.
- **Agent Evaluation, GA 31 Mar 2026**, built into Copilot Studio: upload test sets, reuse Test Pane interactions, AI-generated test queries from agent metadata. Tab 9 Phase 3 already cites it; the guide still describes the monthly evaluation run as manual work. The **Copilot Studio Kit (Power CAT)** is the deterministic enterprise-gate layer above it — the right pairing for regulated verticals.
- **Microsoft Entra Agent ID** — agent identities as first-class Entra objects with lifecycle, least privilege, and adaptive access. Governing them requires **M365 E7, or Agent 365 + Entra P1/M365 E3**. Relevant to the Tier 3 stack and to the Data/Security Eng RACI row.

The evaluation checklist also restructured into **four stages** (foundational test sets → baseline & improve → systematic expansion → continuous quality operation) with named quality categories — *Foundational core / Agent robustness / Architecture test / Edge cases* — that map almost one-to-one onto your "Test Types to Run" list and would let you cite Microsoft's taxonomy instead of your own. It adds **event-based re-evaluation triggers** (model change, major knowledge update, new tool/connector, production incident) alongside the scheduled cadence; your Phase 5 is monthly-only, and a model change is the one event that most justifies the retainer. There is also a [downloadable editable template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit).

### B6. Agent 365's prerequisite is in `cpb.html` but not here

`cpb.html` now carries it: *"Agent 365 purchases require M365 E5, A5, or Business Premium — or the Defender and Purview suites — underneath them."* Effective 1 Jun 2026. `cpbops.html` sells an **Agent 365 Overlay** in the Section 7 model (1 customer × 75 users × $10/user/mo) and names it in Tab 9 Phase 5 with no qualification note. For an SMB-facing guide that is the difference between a $10 overlay and a $10 overlay that requires Business Premium underneath.

### B7. Only two of four agent-build paths are covered

The Agent Builder vs. Copilot Studio comparison table is accurate — names, capabilities, and the `$3,500–$8,000` / `$12,000–$28,000` split all check out. But Microsoft documents **four** paths: **SharePoint agents**, Agent Builder, Copilot Studio, and the **M365 Agents Toolkit** (pro-code, VS Code).

The SharePoint agents gap is a live inconsistency: your own template list includes *"SharePoint site knowledge agent,"* which is a SharePoint agent — the cheapest path, built from a document library in minutes, no Copilot Studio involved. A binary Agent Builder / Copilot Studio decision table routes that engagement to the wrong tool and overprices it. Tab 9 Phase 3 already references the Agents Toolkit for partner-tenant UAT sideloading.

### B8. Gate 2's dashboard deliverable is being commoditized

Gate 2 bills *"Build Copilot Usage Analytics Dashboard — Power BI or Viva Insights"* at `$2,500–$4,000`. Copilot Analytics now ships a consolidated one-page Copilot Adoption Overview with external active-user benchmarks, a daily "latest usage snapshot" Power BI report, and default-enabled Copilot Credit cost insights — and as of mid-July 2026 **managers no longer need a Viva Insights license** for team views.

The deliverable is still real, but its value has shifted from *building* to *configuring, benchmarking, and interpreting*. Reposition the line rather than defend the old description; the honest version ("we configure Microsoft's analytics against your KPI and read it for you monthly") is also the more durable one.

---

## Tier C — internal alignment

### C1. The 30% threshold is filed under the wrong gate

The guide's signal table maps *"Active user % > 30% by Day 30"* to **Gate 3**, and the Gate 3 summary reads *"Active-user % vs. 30% threshold."* Tab 8 puts that review at **Gate 2 (Week 6)** — *"target 30%+ active users within first 30 days"* — and sets a **different, higher bar at Gate 3: `>40%` active by Day 45, `<30%` requires intervention.**

So the guide both misplaces the checkpoint and drops the Day 45 benchmark entirely. Partners running the tab and reading the guide side by side will get two different answers about what Gate 3 tests.

### C2. Pre-Engagement is missing the licensing check the workbook now has

The "Four Steps Partners Consistently Skip" covers baseline KPI, oversharing, IT-only pilot, and counter-metric. Tab 8 Pre-Gate has since gained two more, and one is arguably the biggest skip of all:

- **Verify M365 licensing eligibility** — carrying the current FY27 SMB lineup: *"$18/user/mo standalone (promo through Dec 2026) or bundled at $21–23.50/user/mo via M365 Business Basic/Standard with Copilot (GA since Jul 1, 2026)."* This matches the pricing research in `RESEARCH-DELTA.md` §2. The guide names no license prices at all.
- **Audit MFA and Conditional Access posture.**

The four-skips framing is strong writing and I would not dilute it lightly — but a licensing-eligibility miss is a scope-and-margin failure, not a nice-to-have, and it now has a home in the tab the guide is supposed to explain.

### C3. Tab 8's ongoing cadence has no counterpart in the guide

Tab 9 Phase 5 gets a full seven-row cadence table (monthly / quarterly / annual, with "what it signals to the customer"). Tab 8's **ONGOING · Monthly Retainer Cadence** block — MBR, prompt refresh, compliance review, quarterly QBR, and the **T1→T2 progression check at Month 3–4** (active rate >40%, named workflow, sponsor open to $350/agent/mo) — gets nothing. Section 3 stops at Gate 5.

That asymmetry undercuts Section 2's whole argument. The document's thesis is that structure creates the recurring reason to be in front of the customer; the Tier 1 retainer is where that actually happens, and it is the one part not described.

### C4. Build-fee range conflicts inside the workbook

Tab 8 Gate 4 says the simple agent build proposal is **`$5,000–$8,000`**. Tab 9 (both the header and the Financial Reference block) and `cpbops.html` (four places) all say **`$3,500–$8,000`**. The guide is consistent with Tab 9; **Tab 8 is the outlier and should be corrected there**, not here. Flagging it because a fix applied to the guide instead would be backwards.

Worth a deliberate look regardless: `$3,500` is also the Agent Discovery Workshop floor, so a customer reading both numbers sees discovery and build starting at the same price.

### C5. Everything that checked out clean

Recording these so the next pass doesn't re-litigate them:

- **Copilot Studio agent development lifecycle** — still **discovery → experimentation → build → deploy → operational steady state**. Your Phase-name mapping note is correct and still useful.
- **All three case studies are live and accurately described.** [Mike Morse](https://www.microsoft.com/en/customers/story/23309-michael-morse-law-firm-microsoft-365) (LMS built in-house, John Georgatos CIO, quote verbatim), [Newman's Own](https://www.microsoft.com/en/customers/story/23048-newmans-own-microsoft-365-copilot) (3hr → 30–60min briefs, 3× campaigns, 50 employees, three departments), [Morula Health](https://www.microsoft.com/en/customers/story/1759306888687672662-morulahealth-microsoft-365-business-premium-health-provider-en-united-kigdom) (weeks → days, UK life sciences). No changes needed.
- **Microsoft Agent Store** still exists under that name — not renamed. It is the in-product surface; **Microsoft Marketplace** is now the transaction surface sharing the same catalog. Worth one sentence, no rewrite.
- **DAG report path** (SharePoint Admin Center → Reports → Data access governance) — correct.
- **ALM guidance** (minimum Dev + Prod, add Test for regulated, managed solution to Prod) — matches Microsoft's checklist. Tab 9 adds *"all ALM environments require Dataverse"*, which the guide could usefully carry.
- **Agent Builder / Copilot Studio naming and split** — correct.
- **15–20 golden prompts** — this is your number, not Microsoft's (Microsoft now says start with one per key scenario and iterate). It is fine to keep as CPB methodology; just don't badge it as Microsoft's.
- **Sensitivity labels are not a technical prerequisite** — correct, and matches Tab 8.
- **Section 7 vs Tab 2** — every input cell reconciles exactly. Only the two subtotals in A5 are wrong.
- **Pricing alignment with `cpb.html`** — Tier 1 $12, Tier 2 $12 base / $20–25 flat, Tier 3 $15, AgentCare $350/$400, Agent 365 overlay $10, Credit Wrap 30%, ~$1,725/mo Tier 2 stacked. All consistent.

### C6. Two unsourced claims in stat-block markup

Same category as `F-130` / `F-141` in `RESEARCH-DELTA.md` §7:

- **"3× faster Copilot deal close rate — Microsoft FY26 Partner Data"** — appears twice (Priority #1 and the Section 2 stat block) and is a load-bearing argument. I could not find a public Microsoft source. The nearest published claims are directionally supportive but different: Microsoft's partner blog says partners who adopt internally *"build credibility and move faster"*; third-party data puts champion-program organisations at **2–3× higher activation rates** (not close rates). Either attribute it to a specific internal Microsoft partner deck, or soften to the qualitative form Microsoft actually publishes.
- **"40–60% more Phase 3 rework — CPB Playbook field data"** — appears twice, self-attributed. Internally consistent with Tab 9, so it's a disclosure question rather than a factual one: is "field data" a defensible label for it?

### C7. Byline, version, and count

- Byline reads **April 2026** — four months stale, and the document contains no other date stamp.
- Footer says *"Companion to cpb.html Playbook v9"* and Section 1 cites *"CPB Playbook v9"*. `cpb.html` is still v9, but is now titled **"The Frontier Partner Playbook"**. Naming drift, not a version mismatch.
- Contents lists *"Reference List — 13 Clickable Sources."* Any addition changes that count — it will need updating, or rewording to drop the number.

### C8. Six of seven Microsoft Learn links now redirect

All resolve (200), so nothing is broken — but every one lands somewhere other than where it points, and two moved into a **new `learn.microsoft.com/en-us/agents/` documentation hub** (`ms.service: agentic-computing`), which is a signal Microsoft has reorganised agent guidance as a product area of its own.

| Cited | Redirects to |
|---|---|
| `/microsoft-copilot-studio/guidance/architecture/deployment-lifecycle` | `/agents/architecture/deployment-lifecycle` |
| `/microsoft-copilot-studio/guidance/evaluation-checklist` | `/agents/agent-evaluation/evaluation-checklist` |
| `/sharepoint/get-ready-copilot-sharepoint-advanced-management` | `/microsoft-365/copilot/get-ready-copilot-sharepoint-advanced-management` |
| `/copilot/microsoft-365/agent-essentials/m365-agents-checklist` | `/microsoft-365/copilot/agent-essentials/m365-agents-checklist` |
| `partner.microsoft.com/.../microsoft-commerce-incentives` | **404** |
| `customers.microsoft.com` | `microsoft.com/en-us/customers` |
| `syskit.com/blog/copilot-readiness-assessment/` | trailing-slash normalise (cosmetic) |

The four non-Microsoft partner sources (Syskit, Orchestry, AvePoint, inforcer, E2E Agentic Bridge) are all live.

---

## Tier D — the MCI line needs a decision, and I can't make it from public sources

Section 7 models **$30,000/year in MCI reimbursements at 100% margin** — 12.5% of project revenue and 5.9% of total practice revenue — and Gate 5 makes the application a checklist item. `RESEARCH-DELTA.md` §6 flagged FY27 program mechanics as landing mid-refresh; here is what the FY27 changes look like from outside Partner Center.

**Cuts, effective 1 Jul 2026:** Core incentives were **removed for Microsoft 365 and Dynamics 365 CSP transactions for indirect resellers**. Investment is being reallocated toward growth-focused incentives — net-new customers, new seats, upsell, strategic workload adoption. **CSP growth margins launch 1 Oct 2026.**

**Support:** Microsoft has *increased* partner margins on M365 Copilot, and Copilot remains one of the largest FY27 investment areas, with MCI funded workshops explicitly spanning strategy → PoC → deployment → adoption → custom agent development. Funded-engagement mechanics (partner activities, CPOR claims) are intact.

**What I could not determine:** whether the specific engagement a partner would claim at Gate 5 still exists under the same name and rate, and whether an indirect reseller in TD SYNNEX's channel is on the cut side or the growth side of the reallocation. That needs Partner Center access, or your TD SYNNEX MCI contact.

Until then the existing footnote is doing real work and should stay. My recommendation is to strengthen it — name FY27 and 1 Jul 2026 explicitly, note the Core incentive removal for indirect resellers — and, if the $30,000 can't be confirmed within the refresh window, consider showing the practice totals both with and without it. A number that large at 100% margin is worth being able to defend line by line.

The dead link (A7) should point at [aka.ms/incentivesguide](https://aka.ms/incentivesguide), which is the live FY27 incentives guide.

---

## Suggested order of work

1. **A1 · A3 · A4** — the three misattributed Microsoft standards. Highest reputational exposure, and A3 is inside a customer-facing deliverable. **A3 must also be fixed in Tab 8.**
2. **A5 · A6 · A2 · A7** — mechanical corrections, an hour's work.
3. **B1** — the Gate 1 rebuild. Largest single block; the RCD and Content Management Assessment additions are what make it worth doing rather than patching.
4. **C1 · C2 · C3** — guide↔workbook reconciliation. Cheap, and it stops the two artifacts contradicting each other in front of a partner.
5. **B4** — Copilot in 30. The strongest net-new content available, and it expires 31 Dec 2026, so its shelf life is finite.
6. **B3 · B5 · B6** — Copilot Credits, the agent control plane, the Agent 365 prerequisite. These bring `cpbops.html` level with `cowork.html` / `frontier.html` / `cpb.html`.
7. **B2 · B7 · B8 · C6 · C7 · C8** — DSPM, the two missing build paths, the dashboard repositioning, unsourced claims, byline, canonical URLs.
8. **Tier D** — needs your Partner Center answer before anything can be written.

**Two calls that are yours, not a spec's:**

- **A1 and A4 both hinge on the same decision:** do CPB's thresholds get re-badged as *CPB standards that exceed Microsoft's baseline*, or do they move to match Microsoft? Re-badging is stronger commercially and factually honest, but it changes the rhetorical register of two of the document's most quoted lines.
- **B4:** how much of Microsoft's free Copilot in 30 scaffolding to absorb, given it overlaps a billable Gate 1 deliverable.

---

## Sources

- [Microsoft Learn — Agent evaluation checklist](https://learn.microsoft.com/en-us/agents/agent-evaluation/evaluation-checklist)
- [Microsoft Learn — Agent development lifecycle](https://learn.microsoft.com/en-us/agents/architecture/deployment-lifecycle)
- [Microsoft Learn — Get ready for Copilot with SharePoint Advanced Management](https://learn.microsoft.com/en-us/microsoft-365/copilot/get-ready-copilot-sharepoint-advanced-management)
- [Microsoft Learn — SAM features in Microsoft Copilot licenses](https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license)
- [Microsoft Learn — Restricted Content Discovery](https://learn.microsoft.com/en-us/sharepoint/restricted-content-discovery)
- [Microsoft Learn — Microsoft 365 Agents Checklist](https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/m365-agents-checklist)
- [Microsoft Learn — Secure & governed data foundation blueprint](https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance)
- [Microsoft Learn — Prevent oversharing with Purview DSPM data risk assessments](https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing)
- [Microsoft Learn — Copilot Control System: management controls](https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-control-system/management-controls)
- [Microsoft Learn — Entra Agent ID governance](https://learn.microsoft.com/en-us/entra/id-governance/agent-id-governance-overview)
- [Microsoft Learn — Copilot Studio billing rates and management](https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management)
- [Microsoft Learn — Partner Center announcements, August 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-august)
- [Microsoft Learn — Partner Center announcements, July 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-july)
- [Microsoft Adoption — Copilot adoption planning checklist](https://adoption.microsoft.com/en-us/copilot/essential-guide/plan/)
- [Microsoft Adoption — Copilot for Small and Medium Business](https://adoption.microsoft.com/en-us/copilot/smb/)
- [Microsoft Partner Blog — From AI curiosity to Copilot adoption in 30 days](https://partner.microsoft.com/en-us/blog/article/copilot-activation-for-fy27)
- [Microsoft Community Hub — Agent Evaluation in Copilot Studio is now GA](https://techcommunity.microsoft.com/blog/copilot-studio-blog/agent-evaluation-in-microsoft-copilot-studio-is-now-generally-available/4507392)
- [Microsoft Community Hub — Mitigate oversharing to govern Copilot and agents](https://techcommunity.microsoft.com/blog/microsoft365copilotblog/mitigate-oversharing-to-govern-microsoft-365-copilot-and-agents/4448744)
- [Microsoft Community Hub — Microsoft 365 E7 and Agent 365 are now generally available](https://techcommunity.microsoft.com/blog/microsoft_365blog/microsoft-365-e7-and-agent-365-are-now-generally-available/4516295)
- [Forrester — The Total Economic Impact of Microsoft 365 Copilot](https://tei.forrester.com/go/microsoft/M365Copilot/?lang=en-us)
- [Message Center MC1427972 — Restricted content discovery enhancements](https://mc.merill.net/message/MC1427972)
- [Copilot Studio Agent Consumption Estimator](https://microsoft.github.io/copilot-studio-estimator/)
