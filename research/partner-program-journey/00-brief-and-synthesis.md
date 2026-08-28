# Zero to Frontier: Brief, Synthesis, and Corrections Ledger

**Research dossier — 00 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026 from three parallel research passes. Fiscal context: Microsoft FY27 began 1 July 2026.

**The question:** "I have a pulse and a credit card and want to be a Microsoft partner" → full Frontier partner status. What is the step-by-step, where does MAICPP come in, what does it cost, and how does an SMB-focused partner monetize a Copilot practice along the way?

**Companion dossiers:**

- [01-day-zero-onboarding.md](01-day-zero-onboarding.md) — enrollment, verification, benefits packages, designation fee, CSP enrollment paths
- [02-frontier-and-copilot-tier-ladder.md](02-frontier-and-copilot-tier-ladder.md) — Frontier badge/specialization, Copilot Jumpstart ladder, Frontier Distributor, relationship map
- [03-smb-copilot-practice-economics.md](03-smb-copilot-practice-economics.md) — cost stack, revenue stack, profitability shape, time-to-money
- [04-roadmap-and-service-alignment.md](04-roadmap-and-service-alignment.md) — **the field-guide source of record.** Re-based for partners who already transact through a distributor; maps the house service catalog to program evidence
- [05-program-universe-taxonomy.md](05-program-universe-taxonomy.md) — the whole Microsoft partner universe, the three-layer model, the five-agreement stack, prerequisite graph, naming history, Frontier disambiguation
- [06-cosell-marketplace-and-ip.md](06-cosell-marketplace-and-ip.md) — co-sell mechanics, why SMB gets leads not co-sell, marketplace for services partners, the IP path
- [07-adjacent-programs-and-authorizations.md](07-adjacent-programs-and-authorizations.md) — MISA, MXDR, FastTrack, Solution Assessments, training, device, education/government/nonprofit, recognition programs, each with a pursue/later/ignore verdict
- [08-support-entitlements-for-indirect-resellers.md](08-support-entitlements-for-indirect-resellers.md) — the three support systems partners conflate, why the 50 incidents can't touch M365 or customer Azure, GDAP as the real path, TPD advisory hours, and why buying ASfP doesn't help
- [09-specialization-requirements-authoritative.md](09-specialization-requirements-authoritative.md) — **the reference of record for all specialization requirements.** Verbatim from specializations-apply (updated 2026-08-03); supersedes the figures in 02, 03 and 04
- [10-specialization-audit-checklists.md](10-specialization-audit-checklists.md) — inside the Copilot and Data Security audits: ISSI, $2,700/4 hours, six capabilities and fifteen controls verbatim, Module A explained, the process clocks, and Microsoft's own list of why partners fail
- [11-distributor-layer-and-frontier-disti.md](11-distributor-layer-and-frontier-disti.md) — Frontier Distributor and the reseller-specialization metric, TD SYNNEX's verified enablement portfolio, the subcontract/CPOR question, the audit-prep white space, and a BD question list
- [12-real-delivery-capability.md](12-real-delivery-capability.md) — **what it takes behind the badge.** Microsoft's seven agentic roles and four partner readiness roles, the seniority uplift hidden in the July 2026 cert change, Purview remediation durations that don't compress, Copilot Studio's 31-item manage checklist and credit economics, the four people-shapes, and why CCMP beats Prosci for the ACM control
- Prior art: [../control-before-scale/04-partner-program.md](../control-before-scale/04-partner-program.md) (FY27 program mechanics, SMB tracks, incentive catalog) and [../control-before-scale/03-mrr-and-pricing.md](../control-before-scale/03-mrr-and-pricing.md) (services pricing evidence)

**Published artifacts:** *Zero to Frontier* (the from-scratch briefing) and *Channel Field Guide* (the roadmap version for partners already transacting, with the program-universe map and adjacency triage).

**Late additions that change earlier conclusions — read these first if returning to this work:**

0. **⚠ CORRECTION, 28 Aug 2026 — the Copilot specialization thresholds ARE published.** Dossiers 02 and 03 recorded the post-July-2026 performance requirement as "paid Copilot MAU only, threshold unpublished" and tagged it `[UNVERIFIED]`. That was wrong. [learn.microsoft.com/partner-center/membership/specializations-apply](https://learn.microsoft.com/en-us/partner-center/membership/specializations-apply) (updated 2026-08-03) carries the full current requirement set: **1,000 MAU growth AND 5 net customer growth, each customer at ≥5 MAU**, via CPOR/CSP T1/T2, plus **two separate groups of five certified people** (not five total), plus an audit. See **[dossier 09](09-specialization-requirements-authoritative.md)**, which is now the reference of record for all specialization requirements and supersedes the figures in 02, 03 and 04.

0b. **The Copilot audit checklist is public and downloadable** — `assetsprod.microsoft.com` is *not* gated (it 302s to a signed CDN URL), and `partner.microsoft.com` returns 403 to bots but **200 to plain curl**. Several "gated" items in earlier dossiers were therefore reachable all along. The Copilot audit is **ISSI, 4 hours, ~$2,700, six capabilities and fifteen binary controls**; Security audits are **$2,700 Module B or $4,000 Module A+B**, with Module A reusable across the four Security specializations. See **[dossier 10](10-specialization-audit-checklists.md)**.

0c. **Frontier Distributors are scored on their resellers' specialization attainment** — which makes distributor help a shared interest rather than a favour. See **[dossier 11](11-distributor-layer-and-frontier-disti.md)**. Also corrects three misattributed TD SYNNEX program names carried from frontier.html.

1. **Azure Expert MSP is retiring** (new enrolments close 2026-09-15, renewals end Jan 2027), with the **Frontier Partner specialization as its designated successor**. Frontier is absorbing Microsoft's top Azure services credential, not just the Copilot apex. (Dossier 05 §2a, 07 §10)
2. **MAICPP is a gateway, not a container** — proven from the MAICPP Agreement's own text. CSP and Marketplace are parallel programs with separate agreements. (Dossier 05 §0)
3. **SMB does not get co-sell**, stated by Microsoft: "SMB Opportunities leads aren't the same as co-sell opportunities." The workable substitute is that an **MCI engagement claim auto-creates a partner-led referral** that can be promoted to co-sell. (Dossier 06 §1, §3.2b)
4. **The $2,000 / 50-seat Business Premium Defender/Purview deployment accelerator** is the most reachable Microsoft delivery money for this segment — gated on the Security *designation*, not a specialization. Channel-sourced; verify in the gated MCI guide. (Dossier 07 §4)
5. **Copilot voucher floor resolved at 500 seats** (the 200-seat snippet is superseded), and **FastTrack's data-migration floor dropped 500 → 150**. (Dossier 07 §3)
6. **No Authorized Education Partner status is required to sell CSP EDU**, and **an MSP does not need its own CMMC certification** — both reverse widespread channel folklore. CMMC Phase II was also suspended 2026-07-13. (Dossier 07 §7)
7. **"Partner Center for Sales" could not be verified** and should not be repeated as fact; it appears in control-before-scale/04 §7 as forward-looking channel press. (Dossier 06 §7)

---

## 1. The ladder, reconciled (one paragraph per rung)

**Rung 0 — Enroll (free, ~1 week).** Business email domain + Entra work account → MAICPP enrollment at partner.microsoft.com → five-check verification (email, ID, employment, business docs, discretionary trust questionnaire), typically 3–5 business days. Auto-issues PGA + PLA PartnerIDs. $0.

**Rung 1 — Tool up ($350–$4,125/yr).** Buy a benefits package: Launch $350 (5 BP seats, $700 Azure, one-time-ever tier), Core $925 (15 seats, $2,400 Azure, support incidents + advisory hours), Expanded $4,125 (the only package with **10 M365 Copilot seats + 25K Copilot Studio credits/mo + $5,000 Azure**). For a Copilot practice, Expanded is the internal lab; Core is the budget floor. Run Copilot on yourselves — customer zero.

**Rung 2 — Get transactable ($0).** CSP **indirect reseller**: separate tenant recommended, business verification again, sign the MPA, provide support email/phone, accept a distributor relationship (TD SYNNEX / Pax8 / Ingram — $0 to join). Ongoing bar: $1,000 TTM CSP revenue/yr, MFA, security contact. Ignore direct bill until far later: it now requires **12 months as an indirect reseller + $1M TTM CSP revenue + a designation + an ASfP/Premier support plan (~$16.5K/yr)**.

**Rung 3 — First revenue and the points engine (months 1–6).** Sell Business Premium + Copilot bundles and run Copilot in 30 trials (through Dec 31, 2026); keep the promo spread (15–25% off Copilot SKUs through year-end). Get 2–3 people certified on the Modern Work SMB path (~$495 of exams). Claim **CPOR on every workload you influence the day you influence it** — usage growth only counts from association date, and CPOR thresholds are ¼–½ of CSP thresholds. Key unlock: **MCI incentives start at 25 capability points + $25K TTM CSP revenue — before the designation.** FY27 rates: 12.5% Growth Accelerator + 7% strategic accelerator on Copilot/E5/E7/Agent 365/Copilot Studio (≈19.5% ceiling), paid 60% cash / 40% co-op; core rebate on plain M365 run-rate is now 0%.

**Rung 4 — Solutions Partner designation (months 6–12, $4,875/yr).** 70/100 partner capability score on the SMB track (Modern Work: 10 net adds of 11–300-seat tenants, 2 intermediate + 1 advanced certified people, 500 MAU CPOR usage growth, 5 deployments at 40% active) — needed on **any single day** in a rolling 6-month window. One $4,875 fee covers every designation you qualify for, so add Security in parallel for $0 more (SMB path: 5 net adds, 3 certified people covering SC-500/SC-200/SC-300-or-SC-100). Designation benefits: 200 E5 + 20 Copilot seats + $4,000 Azure (Modern Work), 50 support incidents, 50 advisory hours, co-sell eligibility, and — from Jan 2026 reporting — access to most partner-led incentives. Customer-facing badge: "Solutions Partner for AI Business Solutions."

**Rung 5 — Microsoft 365 Copilot specialization (months 12–24, audit ~$2.4–5K est.).** Prerequisite: any of Business Applications / Modern Work / Security designations. Performance: **paid Copilot MAU only** (post-July-2026 threshold unpublished — confirm in Partner Center). Skilling: 5 individuals across SC-401 / AB-100 / AB-620. Evidence: partner-funded third-party capabilities audit, valid 2 years. **This is the deadline rung: from Jan 1, 2027 Copilot MCI engagement incentives require this specialization** (Jumpstart Ready honored only through Dec 31, 2026). No separate purchase — covered by the designation fee; the audit is the incremental cost.

**Rung 6 — Frontier (months 24+).** The **badge** (attainable through June 2027): 3 designations (AI Business Solutions, Security, a Cloud & AI Platforms path) + 3 specializations (M365 Copilot; AI Apps on Azure *or* AI Platform on Azure *or* Accelerate Developer Productivity; Data Security). The **specialization** that replaces it (later in FY27, provisional channel reconstruction): 4 specializations simultaneously (adds Identity & Access Management), 5 Frontier Transformation Engineer badge holders, 3× DP-600, biennial third-party audit; benefits reportedly include Agent prepurchase credits, E7 licensing, co-sell priority, Concierge support. For an SMB partner this is a multi-year enterprise-grade bar; the profitable stopping point is Rung 5 plus Data Security — per the playbook's own framing, "one step ahead of every other partner in your market."

## 2. The money, in three sentences

Cash to build: **~$8,300 year one, ~$10–12K year two** — and the 40% co-op accrual can reimburse exams and program fees once incentives flow. Resale margin alone is structurally insufficient (100 Copilot Business seats ≈ $252/mo margin; FY27 zeroed the core rebate on run-rate M365): the engine is **productized services** — $5–15K readiness assessments, $7.5–25K deployments, $10–30K SMB agent builds, $50–150/user/mo governance MRR — with license margin + MCI as tailwind, which is exactly the shape of the IDC $8.45-services-per-$1-Microsoft figure Microsoft itself markets. Time-to-money: margin dollar in weeks, first MCI rebate month ~7–13, designation-gated accelerator dollars month 12+.

## 3. FY27 deadline board

| Date | Event |
|---|---|
| Sep 30, 2026 | E3/E5 CSP promos + enterprise Copilot 20% promo end; E7 promos transact-by |
| Oct 1, 2026 | Growth margins live (direct bill + distributors only); −5% legacy SKU margin; E7 promos retire |
| Dec 31, 2026 | Copilot Business promos, BB+Copilot 25% bundle, Copilot in 30, 50%-off Purview for BP end; **last day Jumpstart Ready satisfies Copilot incentive eligibility** |
| Jan 1, 2027 | **M365 Copilot specialization required for Copilot MCI engagement incentives** [CHANNEL-PRESS] |
| End Jun 2027 | Frontier Partner **badge** retires; Frontier Partner **specialization** is the successor |

## 4. Corrections / confirmations ledger vs the playbook

| Playbook item | Status after this research |
|---|---|
| `frontier.html` $4,875 designation fee (F-014, was [UNVERIFIED]) | **CONFIRMED** [MS-OFFICIAL mpn-pay-fee page, updated 2026-04-09] |
| `frontier.html` $350 Partner Launch Benefits (F-092, was [UNVERIFIED]) | **CONFIRMED** [MS-OFFICIAL partner-launch-benefits, updated 2026-07-27] |
| `frontier.html` $700 Azure credits in Launch (F-108) | **CONFIRMED** [MS-OFFICIAL, same page] |
| `frontier.html` $5,000 Security Copilot credits / Security designation (F-047) | **CONFIRMED** ($5,000/yr Security Copilot credits) [MS-OFFICIAL benefits-at-a-glance] |
| `frontier.html` "$4,500 Azure bulk credits" for Modern Work (F-095) | **CONTRADICTED** — benefits-at-a-glance says **$4,000** Azure for Modern Work; $9,000 for Security also contradicted (**$10,000**). Update the page. |
| `frontier.html` Stage 0 "Action Pack ~$475/yr" | **STALE** — Action Pack retired Jan 2025; ladder should start at free Registered → Launch $350. |
| `frontier.html` Modern Work "50 users on M365 E5" | **CONTRADICTED** — benefits-at-a-glance says **200× E5** + 20 Copilot seats for Modern Work. Verify in Partner Center; page understates. |
| `frontier.html` Frontier = "AI Apps on Azure" specifically | **BROADENED** — Slalom attainment statement says AI Apps on Azure OR AI Platform on Azure OR Accelerate Developer Productivity satisfies slot ②. |
| `frontier.html` Frontier designation ① "Modern Work or Business Applications" | **QUESTIONED** — Slalom lists AI Business Solutions (= BizApps+Modern Work commercial area) + Security + Cloud & AI Platform-aligned. Under the Aug 2026 badge consolidation these converge; page wording survives but should reference the new badge names. |
| `frontier.html` Stage 4 still shows "1,000 MAU + 5 net adds" as current performance | **STALE** — that's the pre-July-2026 bar; performance is now paid-MAU-only, threshold unpublished. |
| control-before-scale/04 §3.3 "Copilot spec required for incentives Jan 1, 2027" [UNVERIFIED] | **STRENGTHENED** to [CHANNEL-PRESS] — Crayon FY27 partner briefing deck p.24 states it verbatim; still no Microsoft public page. |
| control-before-scale/04 Frontier badge "retires end June 2027" | **CONFIRMED** [MS-OFFICIAL Aug 2026 announcements] |
| Voucher program 500-seat floor | **CONFLICT** — KB-01831 renders both 500 (fuller render) and 200 (snippet). Keep 500, flag. |

## 5. What still needs a Partner Center login or PDM conversation

1. Post-July-2026 **Copilot specialization MAU threshold** (the single most planning-critical unknown).
2. **Copilot specialization audit price** (planning range $2.4–5K is extrapolated).
3. **Growth margin percentages** (gated Growth Margin Guide; live Oct 1, 2026).
4. Official **Frontier Partner specialization requirements** (channel reconstruction only until Microsoft publishes).
5. **Security Immersion Briefing payment amounts** ($2K/$1.5K community-sourced).
6. FY27 **new benefits package** contents/prices (E7, Agent 365, Copilot Business, Defender/Purview BP suites).
7. Exact distributor **price sheets** (NDA; plan on 8–12% off ERP).
