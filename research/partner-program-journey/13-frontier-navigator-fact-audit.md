# Frontier Navigator: Fact Audit Against MAICPP Ground Truth

**Research dossier 13 · Partner Program Journey (Zero to Frontier)**
Compiled 12 October 2026. Audits every program claim in `frontier-navigator/` (scoring engine, data files, pages, SVG) against: (1) this dossier series (dated 2026-08-28), (2) the site's published `copilot-specialization.html` and `frontier.html`, and (3) live Microsoft Learn and Partner Center pages fetched on 2026-10-12.

**Headline:** the Navigator's scoring model does not match any of Microsoft's six Partner Capability Score (PCS) models. Its stage ladder copies stale content from `frontier.html` (Action Pack, a second $4,875 fee, a "Second Designation" rung). And it predates the biggest change since the August research: **Microsoft launched the Frontier Partner *specialization* on 30 September 2026, with official requirements.** The live docs also update dossier 02's provisional reconstruction: the official Frontier spec does **not** require three designations, and Data & AI is not required (Digital & App Innovation also qualifies).

Tag legend: `[MS-LIVE]` = Microsoft Learn / Partner Center page fetched 2026-10-12 (with `updated_at`) · `[REPO]` = this research series or site page · `[CHANNEL]` = channel press or partner press, not Microsoft-authored.

---

## 1. Summary verdict table

| # | Claim (file:line) | Verdict | One-line correction |
|---|---|---|---|
| 1 | Stage 0 cost "$0-$475/yr" (scoring.js:10) | **WRONG** | Enrollment is $0. The $475 is the retired Action Pack. Use "$0". |
| 2 | Stage 1 "Partner Launch $350/yr" (scoring.js:18) | CORRECT (price) / MISLEADING (as a rung) | $350 is right, but it is an optional benefits package, not a prerequisite for anything. Only one purchase is allowed per Partner Global Account. Show Core $925 and Expanded $4,125 alongside it. |
| 3 | Stage 2 "Solutions Partner $4,875/yr" (scoring.js:26) | CORRECT | The fee is $4,875/yr. Add "covers every designation you qualify for". |
| 4 | Stage 2 unlocks "Logo usage, co-sell access, advanced incentives" (scoring.js:27) | MISLEADING | SMB opportunities are leads, not co-sell. Most commerce incentives are not gated on a designation. Fix the list (§3). |
| 5 | Stage 3 "Second Designation +$4,875/yr" (scoring.js:31-37) | **WRONG** | Extra designations cost $0. No second designation is needed for the Copilot specialization. Delete the rung. |
| 6 | Stage 3 unlocks "Copilot specialization eligibility" (scoring.js:35) | **WRONG** | Any one of Modern Work, Business Applications or Security already unlocks it. |
| 7 | Stage 4 Copilot spec requirement "Solutions Partner status plus deployment proof and attestations" (scoring.js:44) | **WRONG / OUTDATED** | The real requirements are 1,000 Copilot MAU growth AND 5 net customers at ≥5 MAU, two groups of 5 certified people, and a third-party audit. Customer references and attestations are gone. |
| 8 | Stage 4 unlocks "Marketplace differentiation" (scoring.js:43) | MISLEADING | Marketplace requirement is "N/A" for this spec. What it does unlock is the specialization badge, capped incremental benefits, and (per channel press) Copilot engagement-incentive eligibility from 1 Jan 2027. |
| 9 | Stage 5 "Frontier Partner: Elite path; multiple designations, specializations" (scoring.js:47-53) | **OUTDATED** | The Frontier Partner specialization went live 30 Sep 2026 with official requirements (§3). The old badge retires end of June 2027. |
| 10 | PCS categories 30/30/25/15 (scoring.js:99-104; export.js:25-28, 101-104) | **WRONG** | No designation uses these maxes. Use the per-designation model in §2. |
| 11 | Performance bands 1→10, 3→15, 5→20, 7→25, 10→30 (scoring.js:68-73) | **WRONG** | Every designation is linear per customer. Example: Azure is 10 points per customer, max 30 at 3 customers. |
| 12 | "$500/month Azure spend" net-add rule for all focuses (questions.json:69, scoring.js:177) | **WRONG** (outside Azure) | This rule exists only for the three Azure designations on the SMB track: ≥$500 ACR in at least one of the last two months. Modern Work, Security and Business Applications each use a different rule. |
| 13 | Skilling 5 points per intermediate, 10 per advanced, cap 30 (scoring.js:75) | **WRONG** | Skilling is per designation and has step gates. Examples: Security SMB is 4+4 gates then 8 per person (max 40); Modern Work SMB is 5 per intermediate person (max 10) and 15 per advanced person (max 15). |
| 14 | Usage growth from ACR % bands, max 25 (scoring.js:77-81) | **WRONG** | ACR % growth is the Azure model only: 1 point per 1%, max 20. Modern Work uses MAU, Security uses protected users or security ACR, and Business Applications uses monthly consumption value. |
| 15 | Deployments = count of product types checked, max 15 (scoring.js:83-87) | **WRONG** | Each designation counts deployments its own way (customer tenants at an activity threshold, or unique Azure services). Maxes are 25, 20, 20 or 10. |
| 16 | 70-point threshold (scoring.js:164; results.js:17) | CORRECT but incomplete | Add the rule that **every metric must be >0**, met on **any one day** in the qualification window. The tool does not enforce the every-metric rule. |
| 17 | `determineStage`: score ≥70 ⇒ Solutions Partner; score ≥40 ⇒ Partner Launch (scoring.js:121-122) | **WRONG** | A score of 70+ makes you *Qualified*, not *Enrolled*: you must still pay. Launch is a purchase and is not reached by score. |
| 18 | Copilot spec rule `designation === "multiple" && hasProof && hasCopilot && score >= 80` (scoring.js:117) | **WRONG** | Specializations do not use PCS. One qualifying designation is enough. Proof means MAU, customer count, certifications and audit, not case studies. |
| 19 | currentTier option "Action Pack" (questions.json:10) | **OUTDATED** | Retired 22 Jan 2025, and every remaining subscription has now expired. Remove it. |
| 20 | currentTier "Frontier Partner" (questions.json:13) | MISLEADING | Frontier is not a tier. Split it into "Frontier Partner badge (retiring June 2027)" and "Frontier Partner specialization". |
| 21 | Advanced-cert examples "SC-200, MS-700, AZ-305, AZ-500" (questions.json:47) | **WRONG** | Only AZ-305 is an Expert (advanced) certification. SC-200, MS-700 and AZ-500 are Associate level, and AZ-500 retired 31 Aug 2026. |
| 22 | Deployment option "Copilot for Microsoft 365" (questions.json:113) | OUTDATED naming | Rename to "Microsoft 365 Copilot". |
| 23 | `primaryFocus` lacks Business Applications (questions.json:151-156) | **WRONG (gap)** | Add `business_apps`. formatFocus (scoring.js:141) and designation (questions.json:27) already support it. |
| 24 | Designation option "Azure" (questions.json:26) | MISLEADING | There are three Azure designations with different skilling: Data & AI, Digital & App Innovation, Infrastructure. |
| 25 | `recommendedCertification` (scoring.js:147-151) | **WRONG** | Security: AZ-500 is retired, so use SC-500 + SC-200, then SC-401/SC-300/SC-100. Modern Work: MS-700 is *intermediate*; the advanced cert is MS-102, which retires 30 Nov 2026. Azure: AZ-104 is also a gate. Business Applications is missing. |
| 26 | resources.json URLs (8 entries) | MIXED | One soft-404 (incentives). Two "TD SYNNEX templates" have no public trace. One clinic name is wrong. See §4.7. |
| 27 | benchmarks.json (all numbers) | **UNVERIFIABLE** | No source. This breaks the site rule that every number needs a published source. Remove the numbers or relabel them as illustrative (§4.8). |
| 28 | `frontier.html` (the source the tool copied) | **OUTDATED in 8 places** | See §4.10. `copilot-specialization.html` agrees with the live docs. |

---

## 2. The correct PCS model per designation (machine-friendly)

**Common rules** `[MS-LIVE partner-capability-score, updated 2026-05-11]`:
- **Qualify:** total ≥70 of 100 **and** every metric >0, both met on **at least one day** in the qualification window.
- **Window if not enrolled:** the current month plus the previous five full calendar months.
- **Window if renewing:** the anniversary month plus the last five months, plus a 30-day renewal window.
- **Enroll:** Qualified status lets you purchase the designation ($4,875/yr). It is valid 13 months from purchase, including a one-month renewal window.
- **Tracks:**
  - Modern Work and Security are scored on **both** Enterprise and SMB tracks, and the **higher solution-area total** counts. Microsoft picks the higher track total, not the higher score per metric `[MS-LIVE solutions-partner-modern-work 2026-08-26; solutions-partner-security 2026-08-31]`.
  - Azure designations: SMB if ≥80% of customers are SMB (last month's data).
  - Business Applications: SMB if the partner has ≤4 unique workloads at >$5,000 revenue per customer tenant in both month-1 and month-13.
- **Partial points:** points are linear up to each metric's cap.
- **Data refresh:** performance and customer success refresh by the 20th of each month; skilling refreshes about 10 days after a certification.

### 2.1 Category maxes (per designation, totals = 100)

| designation | perf_net_customer_adds | skilling_intermediate | skilling_advanced | cs_usage_growth | cs_deployments | source |
|---|---|---|---|---|---|---|
| modern_work | 20 | 10 | 15 | 30 | 25 | solutions-partner-modern-work (2026-08-26) |
| security | 20 | 40 | — (no advanced metric) | 20 | 20 | solutions-partner-security (2026-08-31) |
| data_ai_azure | 30 | 40 | — (not applicable) | 20 | 10 | solutions-partner-azure (2026-08-03) |
| digital_app_innovation_azure | 30 | 20 | 20 | 20 | 10 | solutions-partner-azure (2026-08-03) |
| infrastructure_azure | 30 | 20 | 20 | 20 | 10 | solutions-partner-azure (2026-08-03) |
| business_applications | 15 | 20 | 15 | 30 | 20 | solutions-partner-business (2026-07-31) |

Microsoft inconsistencies to know about (do not "fix" these in the model; flag them in UI copy):
- (a) The Azure page says all three Azure designations need ">0 in advanced certifications", but also says advanced "isn't applicable to Data & AI". Model Data & AI as four metrics (30/40/20/10).
- (b) The Security page's "Thresholds" paragraph says "10 customer additions ... required to earn the maximum 20 points", which contradicts its own SMB rule (4 points × 5). Model SMB as 5.
- (c) The PCS overview page leaves Security out of its multi-track list, yet the Security page dual-scores. Follow the Security page.

### 2.2 Metric rules

| designation | track | metric | max_pts | unit | pts_per_unit | units_for_max | eligibility rule | association types |
|---|---|---|---|---|---|---|---|---|
| modern_work | smb | net_customer_adds | 20 | net new customer tenant (TTM) | 2 | 10 | tenant has ≥1 eligible workload with 11–300 paid licenses | CPOR, CSP T1/T2 |
| modern_work | enterprise | net_customer_adds | 20 | net new customer tenant | 4 | 5 | tenant has ≥1 eligible workload with >300 paid licenses | CPOR, DPOR |
| modern_work | smb | skilling_intermediate | 10 | certified person | 5 | 2 | MS-700, SC-300, MS-721, Endpoint Admin (MD-102), Copilot & Agent Administration Fundamentals, MS-900 (retired 2026-03-31; counts to 2027-03-31) | — |
| modern_work | enterprise | skilling_intermediate | 10 | certified person | 2.5 | 4 | same list | — |
| modern_work | smb | skilling_advanced | 15 | certified person | 15 | 1 | MS-102 (retires 2026-11-30; counts to 2027-11-30); Teams Meetings & Meeting Rooms Technical Assessment (retired 2026-06-15; counts to 2027-06-15) | — |
| modern_work | enterprise | skilling_advanced | 15 | certified person | 7.5 | 2 | same list | — |
| modern_work | smb | usage_growth | 30 | MAU growth (YoY) | 30/500 (CPOR) or 30/2,000 (CSP); higher wins | 500 CPOR / 2,000 CSP | SMB tenants; counts only from association date | CPOR, CSP T1/T2 |
| modern_work | enterprise | usage_growth | 30 | MAU growth | 30/1,000 (CPOR) or 30/4,000 (DPOR) | 1,000 / 4,000 | Enterprise tenants | CPOR, DPOR |
| modern_work | smb | deployments | 25 | net new tenant with ≥40% of paid licenses active | 5 (CPOR) or 2.5 (CSP); higher wins | 5 CPOR / 10 CSP | excludes tenants already >40% when claimed in the last 12 months | CPOR, CSP T1/T2 |
| modern_work | enterprise | deployments | 25 | same | 5 (CPOR) or 2.5 (DPOR) | 5 / 10 | — | CPOR, DPOR |
| security | smb | net_customer_adds | 20 | net new customer | 4 | 5 | M365: tenant with 5–300 paid licenses on an eligible security workload; Azure: ≥$600 security ACR TTM | M365: CPOR, CSP T1/T2; Azure: PAL, CSP T1/T2 |
| security | enterprise | net_customer_adds | 20 | net new customer | 2 | 10 | M365 >300 licenses; Azure ≥$600 ACR TTM | same |
| security | smb | skilling_intermediate | 40 | gates + person | Step 1 (SC-500 or AZ-500*) = 4 flat; Step 2 (SC-200) = 4 flat; Step 3 = 8 per person (SC-100, SC-300, SC-401, retired SC-400*) | 1 + 1 + 4 people | Step 3 scores only if Steps 1 and 2 are met | — |
| security | enterprise | skilling_intermediate | 40 | gates + person | Steps 1 and 2 need ≥2 people each, 0 points; Step 3 = 6.67 per person | 2 + 2 + 6 people | same gating | — |
| security | both | deployments | 20 | net new deployment | 3.33 | 6 | SMB M365: 5–300-license tenant with ≥15% of paid licenses active; SMB Azure: $750–$12,000 security ACR TTM; Enterprise: >300 licenses / >$12,000 ACR | same as net adds |
| security | smb | usage_growth | 20 | protected users or security ACR growth | 1 per 50 protected users, or 1 per $750 security ACR | 1,000 users / $15,000 | — | same |
| security | enterprise | usage_growth | 20 | same | 1 per 125 users, or 1 per $1,250 | 2,500 / $25,000 | — | same |
| azure (all 3) | smb | net_customer_adds | 30 | net new customer tenant | 10 | 3 | ≥**$500 ACR in at least one of the last two months**, any Azure Service Level 2 service | CSP T1/T2, DPOR, PAL |
| azure (all 3) | enterprise | net_customer_adds | 30 | same | 10 | 3 | ≥$1,000 ACR in one of the last two months | same |
| data_ai | smb | skilling_intermediate | 40 | gates + person | AZ-104 gate = 4 flat; AZ-305 gate = 4 flat; then 4 per person with a D&AI associate cert (DP-300, DP-600, DP-700, Data Analyst, Cosmos DB, AI Apps & Agents Developer, etc.) | 10 people total | Steps 1 and 2 mandatory | — |
| data_ai | enterprise | skilling_intermediate | 40 | person | Steps 1 and 2 need ≥2 people each, 0 points; then 4 per person | 10 | — | — |
| digital_app_innovation | smb | skilling_intermediate | 20 | gate + person | AZ-104 gate = 4; then 4 per person (Power Platform Developer, Azure AI Cloud Developer, GitHub Agentic AI Developer, Azure Developer*) | 5 | — | — |
| digital_app_innovation | smb | skilling_advanced | 20 | gate + person | AZ-305 gate = 4; then 4 per person (DevOps Engineer Expert, Power Platform Solution Architect Expert, GitHub Actions/Admin/Advanced Security/Copilot) | 5 | — | — |
| infrastructure | smb | skilling_intermediate | 20 | gate + person | AZ-104 gate = 4; then 4 per person (Azure Network Engineer, Windows Server Hybrid Admin) | 5 | — | — |
| infrastructure | smb | skilling_advanced | 20 | gate + person | AZ-305 gate = 4; then 4 per person (AVD Specialty, Azure for SAP Specialty) | 5 | — | — |
| dai / infra | enterprise | skilling (both) | 20 each | person | gate needs ≥2 people, 0 points; then 4 per person | 5 | — | — |
| azure (all 3) | both | usage_growth | 20 | % YoY growth in qualifying ACR | 1 per 1% | 20% | total qualifying ACR TTM ≥$1,000 | CSP T1/T2, DPOR, PAL |
| azure (all 3) | both | deployments | 10 | unique Azure Service Level 2 service with >0 ACR (TTM) | 2 | 5 | Virtual Machines and VM Licenses excluded | same |
| business_applications | smb | net_customer_adds | 15 | net new workload per customer tenant | 3 | 5 | workload ≥**$250 revenue in a month** | CPOR (RevRec/OSA/Perf), CSP T1/T2, DPOR |
| business_applications | enterprise | net_customer_adds | 15 | same | 3 | 5 | ≥$1,500/month | same |
| business_applications | smb | skilling_intermediate | 20 | person | 4 | 5 | D365/Power Platform associate certs (e.g., Intelligent Applications Builder, Power Platform Developer, BC Functional Consultant) | — |
| business_applications | enterprise | skilling_intermediate | 20 | person | 1 | 20 | same | — |
| business_applications | smb | skilling_advanced | 15 | person | 7.5 | 2 | Agentic AI Business Solutions Architect (AB-100), BC Developer Associate, three Expert certs retired 2026-06-30 (valid one year) | — |
| business_applications | enterprise | skilling_advanced | 15 | person | 2.14 | 7 | same | — |
| business_applications | both | usage_growth | 30 | % YoY growth in monthly consumption value (MCV) | 1 per 1% | 30% | baseline MCV ≥25,000 (SMB) / ≥50,000 (Ent) 12 months ago | — |
| business_applications | both | deployments | 20 | net new workload deployment | 4 | 5 | workload ≥5,000 MCV (SMB) / ≥10,000 (Ent) per tenant | — |

\* AZ-500 (Azure Security Engineer Associate) retired 2026-08-31 and is valid for one year if passed before then. SC-500 is the "Cloud and AI Security Engineer Associate" `[MS-LIVE learn.microsoft.com/credentials/certifications/cloud-and-ai-security-engineer-associate]`. SC-400 retired 2025-05-31.

**Implementation notes for a correct model:**
1. Ask the target designation first. Score Modern Work and Security on both tracks and take the higher **total**.
2. Enforce every metric >0.
3. Inputs must be per designation:
   - Modern Work: eligible SMB tenants added, MAU growth, tenants at ≥40% active.
   - Security: customers added, people by step, protected-user growth, deployments at ≥15% active.
   - Azure: customers at ≥$500/month, ACR growth %, number of distinct paid Azure services.
   - Business Applications: workloads at ≥$250/month, MCV growth %, workloads at ≥5,000 MCV.
4. Ask for association type (CPOR vs CSP) for Modern Work, because CPOR thresholds are ¼ to ½ of CSP's.

---

## 3. The correct stage ladder (costs and requirements)

| # | Stage | Cost (USD) | Requirement | What it unlocks | Source |
|---|---|---|---|---|---|
| 0 | **MAICPP member** (enrolled, verified) | **$0** | Business email domain and Entra work account. Accept the MAICPP Agreement. Pass verification (email, ID, employment, business; typically 3–5 business days). | Partner Center, PartnerIDs (PGA/PLA), training, ability to buy packages and enroll as a CSP indirect reseller | 01-day-zero-onboarding.md:12-27 |
| — | *Optional, parallel:* benefits package | **Launch $350/yr** (one purchase per Partner Global Account, "no exceptions") · **Core $925/yr** · **Expanded $4,125/yr** | Purchase in Partner Center. **Not a prerequisite** for any designation. | Launch: 5 Business Premium seats, $700 Azure. Core: $2,400 Azure, 2 support incidents, 5 advisory hours. Expanded: 10 M365 Copilot seats, 25K Copilot Studio credits/mo, $5,000 Azure. | [MS-LIVE] partner-launch-benefits (2026-07-27), partner-success-core-benefits (2026-06-25), partner-success-expanded-benefits (2026-06-25) |
| — | *Optional, parallel:* CSP indirect reseller | $0 | Sign the MPA and accept a distributor relationship. Keep ≥$1,000 TTM CSP revenue/yr, MFA and a security contact. | The ability to transact | 01-day-zero-onboarding.md:79-95 |
| 1 | **Solutions Partner** (first designation) | **$4,875/yr** + tax. One fee covers **all** designations. | Qualified status (70/100 and every metric >0 on any day in the window), then purchase | Designation badge (one of three customer-facing badges since Aug 2026). 50 cloud support incidents, 50 advisory hours. Designation product benefits (e.g., Modern Work: 200× E5, 20× M365 Copilot, $4,000 Azure; Security: 100× E5, $10,000 Azure, $5,000/yr Security Copilot). Eligibility for specializations. | [MS-LIVE] mpn-pay-fee-silver-gold-competency (2026-04-09); solutions-partner-faq (2026-03-02): "subsequent ... designations can be attained ... with no extra fee"; 01-day-zero-onboarding.md:69-73 |
| 1b | Additional designations | **$0** | Qualify (70 points etc.) in the other solution area | Automatic enrollment in that area | [MS-LIVE] partner-capability-score; solutions-partner-faq |
| 2 | **Microsoft 365 Copilot specialization** | No program fee. Partner pays a third-party audit: **~$2,700, ISSI, 4 hours** (Microsoft checklist planning price). | Active designation in **any one** of Modern Work, Business Applications, Security. **1,000 M365 Copilot MAU growth AND 5 net customers (each ≥5 MAU)**, TTM, via CPOR/CSP T1/T2. **5+ people** with SC-401 (or the retired Applied Skill) **AND 5+ people** with AB-620 or AB-100 (or the retired Applied Skill). **Audit required.** Marketplace N/A. | Specialization badge. Incremental benefits (cap: 3 specializations each for Modern Work, Security and Business Applications; 5 for Azure). Reported gate for Copilot engagement incentives from 1 Jan 2027 `[CHANNEL]`. | [MS-LIVE] specializations-apply (updated 2026-09-30; Copilot section unchanged from the 2026-08-03 text); introduction-to-pcs (2026-08-05); 09-…authoritative.md:22-75; 10-…checklists.md |
| 3 | **Frontier prerequisite specializations** | No program fee; one audit each | **Data Security** (Security designation; 2,500 Purview IP MAU growth; 6× SC-401 + 4 Applied Skills; audit). **Identity and Access Management** (Security designation; 2,000 Entra ID P1/P2 MAU growth; 6× SC-300; audit). **AI Apps on Azure *or* AI Platform on Azure** (Data & AI *or* Digital & App Innovation designation; audit). | Prerequisites for stage 4 | [MS-LIVE] specializations-apply (2026-09-30) |
| 4 | **Frontier Partner specialization** (live **30 Sep 2026**) | No program fee. Audit **$4,000, 8 hours** (planning price), against checklist V1.0 active 22 Jul to 31 Dec 2026. | Active enrollment in **M365 Copilot + Data Security + Identity and Access Management**, AND **AI Apps on Azure or AI Platform on Azure**. **5 employees** with the Frontier Transformation Engineer **Titan** badge (Skilling Hub, linked to Partner Center). **3 employees** with active **DP-600** (Fabric Analytics Engineer Associate); the same people may count toward both. **Third-party audit** (book it only after all other prerequisites are met; complete within 30 days of applying). | Customer-facing Frontier Partner specialization badge. Frontier-aligned co-sell eligibility. Microsoft Agent pre-purchase plan (P3) credits and **Microsoft 365 E7** licensing. Packaged GTM resources. MAICPP Concierge support during qualification and audit. | [MS-LIVE] announcements/2026-september ("Frontier Partner specialization now live", 2026-09-30); specializations-apply §Frontier Partner; Frontier Partner Specialization Program guide & audit checklist PDF (assetsprod.microsoft.com, fetched 2026-10-12) |
| legacy | Frontier Partner **badge** | n/a | Partner press: 3 designations (AI Business Solutions, Security, a Cloud & AI Platforms path) + 3 specializations (Copilot; AI Apps/AI Platform/Agentic DevOps; Data Security) | Logo Builder badge. **Retires end of June 2027**; still attainable in FY27. | 02-frontier-and-copilot-tier-ladder.md:20-33 `[CHANNEL]` + [MS-LIVE] announcements/2026-august |

**Is "Second Designation" a real prerequisite?**
- For the Copilot specialization: **No.** It accepts any one of three designations.
- Only **Secure AI Productivity** requires two designations (Modern Work AND Security).
- For the Frontier Partner specialization, at least **two** designations are implied: Security (which carries Data Security, IAM and also the Copilot spec) plus Data & AI or Digital & App Innovation (which carries AI Apps or AI Platform). This is a minimum implied by the eligibility lines, not a stated rule.

**Is there a fee to hold a designation?** Yes. $4,875/yr covers all designations combined. Specializations carry no fee; audits are partner-paid.

**Frontier Partner, how earned:**
- The **specialization** is the current, official route (requirements above).
- The **badge** is legacy and retires June 2027.
- Neither is invitation-based, and neither is a "tier".

**Recommended replacement for `stageDefinitions`** (keeps the six-node UI):

```js
[
 { id:0, name:"MAICPP Member", shortName:"Member", cost:"$0",
   unlocks:"Partner Center, PartnerID, training; can buy benefits packages and enroll as a CSP indirect reseller",
   requirement:"Enroll at partner.microsoft.com and pass verification (typically 3-5 business days)" },
 { id:1, name:"Benefits Package (optional)", shortName:"Package", cost:"$350 Launch / $925 Core / $4,125 Expanded per year",
   unlocks:"Internal-use licenses and Azure credits ($700 / $2,400 / $5,000); Expanded adds 10 Microsoft 365 Copilot seats",
   requirement:"Purchase in Partner Center. Launch can be bought once per Partner Global Account. Not required for a designation." },
 { id:2, name:"Solutions Partner", shortName:"Designation", cost:"$4,875/yr (covers every designation you qualify for)",
   unlocks:"Designation badge, 50 cloud support incidents, 50 advisory hours, product benefits, specialization eligibility",
   requirement:"70+ of 100 PCS points in one solution area with every metric above zero, on any day in the qualification window; then purchase" },
 { id:3, name:"Microsoft 365 Copilot Specialization", shortName:"Copilot", cost:"No program fee; third-party audit about $2,700",
   unlocks:"Specialization badge and incremental benefits; expected gate for Copilot engagement incentives from January 1, 2027",
   requirement:"Modern Work, Business Applications, or Security designation; 1,000 Copilot MAU growth and 5 net customers at 5+ MAU; 5+ SC-401 and 5+ AB-620/AB-100 holders; pass audit" },
 { id:4, name:"Frontier Prerequisites", shortName:"Prereqs", cost:"No program fee; one audit per specialization",
   unlocks:"Eligibility for the Frontier Partner specialization",
   requirement:"Data Security and Identity and Access Management (Security designation) plus AI Apps or AI Platform on Azure (Data & AI or Digital & App Innovation designation)" },
 { id:5, name:"Frontier Partner Specialization", shortName:"Frontier", cost:"No program fee; audit about $4,000",
   unlocks:"Frontier specialization badge, Frontier-aligned co-sell, Agent pre-purchase credits, Microsoft 365 E7 licensing, Concierge support",
   requirement:"Copilot + Data Security + IAM + (AI Apps or AI Platform) specializations; 5 Frontier Transformation Engineer Titan badges; 3 DP-600 holders; pass audit" }
]
```

`continuum-stages.svg:24-55` hard-codes the old six labels and must be updated to match.

---

## 4. Per-claim findings

### 4.1 `stageDefinitions` (scoring.js:5-54)

- **scoring.js:10 cost "$0-$475/yr" → WRONG.**
  - Fact: enrollment has no fee [01:12]. $475 is the retired Action Pack.
  - Action Pack new purchases and renewals ended **22 Jan 2025** [MS-LIVE mpn-get-action-pack, updated 2026-03-09]. Every remaining subscription has expired by now (Oct 2026).
  - Fix: `cost: "$0"`.
- **scoring.js:11 "basic benefits, early enablement" → MISLEADING.** Free membership has no product benefits. Fix: "Partner Center access, PartnerID, training and marketing resources".
- **scoring.js:16-20 Partner Launch "$350/yr" → CORRECT price; ordering MISLEADING.**
  - The price is verified [MS-LIVE partner-launch-benefits 2026-07-27: "$350 USD"; one purchase per PGA, "No exceptions"].
  - But it is not a rung on the path to a designation. Present it as optional and parallel, alongside Core $925 and Expanded $4,125.
- **scoring.js:26 "$4,875/yr" → CORRECT** [MS-LIVE mpn-pay-fee 2026-04-09].
- **scoring.js:27 "Logo usage, co-sell access, advanced incentives" → MISLEADING.**
  - Co-sell: per 06-cosell §1, SMB opportunities are leads, not co-sell.
  - Incentives: CSP incentives (Strategic Product Accelerator, Growth Accelerator) need no designation [02:60]. Some engagement incentives start at 25 capability points + $25K TTM CSP revenue [00:52].
  - Fix: "Designation badge, support incidents and advisory hours, product benefits, specialization eligibility".
- **scoring.js:28 "Earn 70+ PCS points in one solution area" → INCOMPLETE.** Append "with every metric above zero, then purchase".
- **scoring.js:31-37 "Second Designation", "+$4,875/yr", "Copilot specialization eligibility" → WRONG on all three counts.**
  - [MS-LIVE solutions-partner-faq: "subsequent Solutions Partner designations can be attained ... with no extra fee"]
  - [MS-LIVE specializations-apply: Copilot eligibility = "any one of three solution areas: Modern Work, Business Applications, or Security"]
  - Delete the rung.
- **scoring.js:40-45 Copilot spec → WRONG/OUTDATED.**
  - "Deployment proof and attestations" is not the requirement. Customer references were replaced by an audit in July 2026 [09:70-73].
  - "Marketplace differentiation" is wrong: Marketplace is N/A for this spec.
  - "No direct fee" is right, but add "audit about $2,700".
- **scoring.js:47-53 Frontier Partner → OUTDATED.**
  - The official specialization went live 30 Sep 2026.
  - "Elite path" is not a cost. Use "No program fee; audit about $4,000".
  - "Maximum co-sell priority, field co-marketing, elite status" is not Microsoft's benefit list. Use the Sept 30 announcement list (§3).

### 4.2 `calculatePCS` (scoring.js:61-106)

- **Category names.**
  - Microsoft has **three categories** (Performance, Skilling, Customer success) and **four to five metrics**: net customer adds, intermediate certs, advanced certs, usage growth, deployments [MS-LIVE partner-capability-score].
  - The tool's four buckets merge intermediate and advanced, and treat usage growth and deployments as categories. Minor, but the export prints "/30, /30, /25, /15" (export.js:25-28, 101-104), which match no designation.
- **Maxes 30/30/25/15 → WRONG.** See §2.1. The closest real model is Azure Digital & App Innovation or Infrastructure (30 / 20+20 / 20 / 10), and even there skilling is 40, not 30.
- **Performance bands (scoring.js:68-73) → WRONG.**
  - Every designation is linear: Modern Work SMB 2/customer to 10; Security SMB 4/customer to 5; Azure 10/customer to 3; Business Applications 3/workload to 5.
  - The tool gives 30 points only at 10 customers. An Azure SMB partner actually maxes at **3**.
- **"$500/month Azure spend" (questions.json:69; scoring.js:177) → WRONG outside Azure.**
  - The Azure rule is "at least USD500 ACR in at least one of the last two months" (SMB) [MS-LIVE solutions-partner-azure 2026-08-03]. So even for Azure, "per month for the year" is stricter than the real rule.
  - Modern Work counts a tenant with 11–300 paid licenses on an eligible workload (including M365 Copilot).
  - Security counts a tenant with 5–300 licenses on a security workload, or ≥$600 security ACR TTM.
  - Business Applications counts a workload at ≥$250 in a month.
- **Skilling 5/10 per cert, cap 30 (scoring.js:75) → WRONG.**
  - Real per-person values range from 1 to 15 points depending on designation and track.
  - Security, Azure, Data & AI and Digital & App Innovation have **mandatory gate certs** (e.g., Security needs SC-500 and SC-200 before any Step 3 points; Azure needs AZ-104, plus AZ-305 for D&AI or advanced).
  - Microsoft counts people, not certificates: "Each certified individual is counted once" [MS-LIVE modern-work]. The tool's help text says this (questions.json:38), but its separate intermediate and advanced inputs can double-count one person across metrics. That is actually allowed by Microsoft across the two metrics, so this part is fine.
- **Usage growth from ACR % (scoring.js:77-81) → WRONG for 4 of 6 designations.**
  - Azure: 1 point per 1% ACR growth, so **20% growth = max 20**. The tool needs 50% for its max of 25.
  - Modern Work: MAU growth (500 CPOR / 2,000 CSP for 30 points, SMB).
  - Security: protected users or security ACR.
  - Business Applications: MCV growth %, 1 point per 1% to 30, with a baseline floor.
- **Deployments (scoring.js:83-87) → WRONG.**
  - Microsoft calculates deployments from association telemetry; nobody "documents" them.
  - Modern Work: net new tenants at ≥40% of paid licenses active.
  - Security: tenants at ≥15% active, or $750–$12K security ACR.
  - Azure: distinct Service Level 2 services with ACR >0.
  - Business Applications: workloads ≥5,000 MCV.
- **"min points per category"**: the real rule is **≥1 point (>0) in every metric** (Modern Work page: "at least one point in each of the following individual metrics"). The tool never enforces it.
  - Example: 0 deployments + 70 elsewhere is impossible in reality but "qualifies" in the tool.

### 4.3 70-point threshold, `determineStage`, Copilot spec rule (scoring.js:108-124)

- **70 points → CORRECT** [MS-LIVE partner-capability-score]. Add: every metric >0, on any day in the qualification window.
- **scoring.js:121** `if (score >= 70) return 2` → WRONG. Qualified ≠ Enrolled. Show it as "Designation-ready (purchase required)".
- **scoring.js:122** `if (score >= 40) return 1` → WRONG. Launch is a $350 purchase, not a score band. Remove it.
- **scoring.js:117** `designation === "multiple" && hasProof && hasCopilot && score >= 80` → WRONG on four counts:
  - Multiple designations are not needed.
  - Case studies are not proof.
  - Ticking "Copilot deployed" is not the 1,000-MAU / 5-customer bar.
  - PCS ≥80 is irrelevant, because specializations are not PCS-scored.
  - Fix: `designationIn(["modern_work","business_apps","security"]) && copilotMauGrowth >= 1000 && copilotCustomers5Mau >= 5 && sc401Holders >= 5 && agentCertHolders >= 5 && auditPassed`. This needs new questions; until they exist, ask "Do you hold the Microsoft 365 Copilot specialization?" directly.
- **scoring.js:116** `currentTier === "frontier"` → MISLEADING (see 4.4).
- **scoring.js:118** `designation === "multiple"` ⇒ stage 3 → WRONG (the rung does not exist). Also, "multiple" loses *which* designations, which decides Copilot and Frontier eligibility. For example, Infrastructure + Data & AI does **not** unlock the Copilot spec. Replace the select with a multi-select checkbox list of the six designations.

### 4.4 `questions.json`

- **:4 "What is your current MAICPP tier?"** MAICPP has no tiers. Use "Where are you in the program today?"
- **:10 "Action Pack" → OUTDATED.** Remove it. Add "Partner Success Core" and "Partner Success Expanded".
- **:13 "Frontier Partner" → MISLEADING.** Split into "Frontier Partner badge (retires June 2027)" and "Frontier Partner specialization".
- **:21 help** "the main bridge into specializations and Frontier readiness" → CORRECT in substance: designations are prerequisite to specializations [MS-LIVE introduction-to-pcs].
- **:26 "Azure"** → MISLEADING. List Data & AI, Digital & App Innovation, Infrastructure separately.
- **:28 "Multiple designations"** → replace with multi-select (see 4.3).
- **:33-38 intermediate certs** → OK as a count. Note that Security has **no advanced metric**; Microsoft classifies SC-100 (an Expert cert) under its intermediate Step 3.
- **:47 help "Examples include SC-200, MS-700, AZ-305, AZ-500" → WRONG.**
  - SC-200 = Security Operations Analyst **Associate**.
  - MS-700 = Teams Administrator **Associate** (still active; listed as Modern Work *intermediate*).
  - AZ-500 = Azure Security Engineer **Associate**, **retired 31 Aug 2026**.
  - Only AZ-305 (Azure Solutions Architect **Expert**) is advanced.
  - Replace with: "Examples: MS-102 (Microsoft 365 Administrator Expert, retires November 30, 2026), AZ-305 (Azure Solutions Architect Expert), AB-100 (Agentic AI Business Solutions Architect), Azure DevOps Engineer Expert."
  - Sources: [MS-LIVE cert pages, HTTP 200: security-operations-analyst "Exam SC-200"; m365-teams-administrator-associate "Exam MS-700"; azure-solutions-architect "Exam AZ-305"; azure-security-engineer "retired on August 31, 2026"; m365-administrator-expert "Exam MS-102 ... retire on November 30, 2026"].
- **MS-700 retired/renamed?**
  - Not retired: the cert page is live with Exam MS-700, and the Modern Work PCS page still lists it.
  - Modern Work also now lists **MS-721** (Collaboration Communications Systems Engineer Associate) and "Copilot and Agent Administration Fundamentals".
- **:69 label** "$500 per month Azure spend" → WRONG framing (see 4.2). Make the question designation-aware.
- **:74 help** "approximates the SMB path performance category" → MISLEADING (Azure SMB only).
- **:81 help** "calibrate SMB versus enterprise path" → MISLEADING.
  - Azure track depends on **customer mix** (≥80% SMB customers), not partner ACR.
  - The ACR floor was removed 1 Jul 2026 [04-partner-program.md:91 in control-before-scale; MS announcements/2026-july].
- **:92-105 ACR growth bands** → bands are fine as input, but only meaningful for Azure (max at 20%). Add a "20%+" band.
- **:107-119 deployments checklist** → MISLEADING.
  - These products map to different designations: Copilot/Intune → Modern Work; Defender for Endpoint (P2 only) and Intune → Security; AVD → Infrastructure ACR.
  - Azure Migrate's discovery and assessment are largely free, so it typically generates little or no ACR and may not count as an Azure "deployment".
  - Fix: ask per-designation deployment counts using Microsoft's definitions.
- **:113 "Copilot for Microsoft 365"** → OUTDATED. Use "Microsoft 365 Copilot".
- **:125 caseStudies help** "critical for specialization and Frontier readiness" → OUTDATED for Copilot, Data Security, IAM and Frontier (all audit-based).
  - Only Calling, Custom Solutions and Meetings for Teams, Modernize Endpoints and Secure AI Productivity still take **3 customer references** each [09:145-155; MS-LIVE specializations-apply].
  - Reframe as "audit evidence readiness" and keep case studies as marketing assets.
- **:135-138 MCI** → The name "Microsoft Commerce Incentives" is still current (FY27 resource collection title). The partner page is now titled "Microsoft Commercial Incentives for Partners", and the guide is the "Microsoft Commercial Partner Incentives Guide" [MS-LIVE announcements/2026-october].
  - Help text "after designation" is MISLEADING: most CSP incentives are not designation-gated.
- **:151-156 primaryFocus** → missing `business_apps` (WRONG). Also split Azure.
- **:167 "Reach Frontier Partner status"** → "Earn the Frontier Partner specialization".

### 4.5 `recommendedCertification` (scoring.js:147-151) and gap and roadmap text

Corrected mapping (SMB track, cheapest path to >0 in every skilling metric):

| focus | recommend | why |
|---|---|---|
| security | **SC-500 + SC-200 first** (4 + 4 point gates), then **SC-401 or SC-300 or SC-100** (8 points each) | AZ-500 retired 2026-08-31; SC-401 also counts toward the Copilot and Data Security specializations |
| modern_work | **MS-700 or MD-102 or SC-300** (intermediate, 5 points each ×2) + **MS-102** (advanced, 15 points; **sit it before Nov 30, 2026**) | Modern Work's advanced metric has no listed successor after MS-102 retires |
| data_ai | AZ-104 + AZ-305 (gates) + DP-600 / DP-700 / Data Analyst | DP-600 is also a Frontier spec requirement (×3) |
| digital_app_innovation | AZ-104 (int gate) + AZ-305 (adv gate) + GitHub Copilot / DevOps Expert | |
| infrastructure | AZ-104 + AZ-305 + Network Engineer / AVD Specialty | |
| business_apps | Intelligent Applications Builder / Power Platform Developer (int, 4 points each ×5) + **AB-100** (adv, 7.5 points ×2) | AB-100 also counts toward the Copilot spec's agent group |

- **scoring.js:171-172** "N additional advanced certification(s) ... in MS-700" → WRONG. MS-700 is intermediate.
- **scoring.js:177-178** "$500/month Azure spend" and "confirm PAL association" → Azure-only. For M365 workloads the association is **CPOR** (or automatic via CSP). Make it designation-aware.
- **scoring.js:183-184** "Document N more qualifying deployments in Partner Center" / "Package ... with customer evidence" → MISLEADING. Deployments are computed from association and usage data. Correct the action to "Claim CPOR on deployments you influenced and drive active usage above the designation's threshold (40% of licenses for Modern Work, 15% for Security)".
- **scoring.js:188-189** MCI "before applying for designation benefits" → MISLEADING (incentives and designation benefits are separate).
- **scoring.js:199, 244** TD SYNNEX readiness review / BDM meeting → fine. Use the verified program names **MAICPP Clinics** and **Microsoft Coaches** [11:59-60].
- **scoring.js:232** "Close or expand at least two qualifying Azure customer opportunities" → Azure-only regardless of focus. Make it designation-aware.

### 4.6 `index.html` and `pages/*.html`

- index.html:49-50 "100 estimated PCS point model" → CORRECT (100-point scale).
- index.html:102 "Answer 15 focused questions" → CORRECT (questions.json has 15).
- index.html:107 "estimates PCS by performance, skilling, usage growth, and deployments" → acceptable shorthand. Microsoft groups usage growth and deployments under Customer success.
- index.html:31 "Microsoft Frontier journey" → ambiguous. "Microsoft Frontier" is also the customer early-access program [02:15]. Prefer "the path to the Frontier Partner specialization".
- index.html:122 "registration through Solutions Partner designations, specialization readiness, and Frontier status" → fine once the ladder is fixed.
- compare.html:29-31 "SMB readiness cohorts", "Peer comparison" → UNVERIFIABLE (see 4.8).
- compare.html:43 "Benchmarks are static planning references, not Microsoft-published performance rankings" → good disclaimer, but it does not supply a source.
- compare.html:46-53 "within 10 points of 70 ... skilling and deployment proof are often the fastest levers" → opinion with no source.
  - In Modern Work SMB, one advanced person = 15 points, which really is the fastest lever.
  - "Deployment proof" is not a mechanism.
  - Reword it as Modern Work-specific guidance.
- results.html:32, roadmap.html:47-49, app.js footer "Partner Center remains the official source of record" → CORRECT and worth keeping.
- assessment.html:30 "Answers are saved locally in this browser" → accurate (localStorage).
- `continuum-stages.svg:24-55` → same stale ladder as stageDefinitions ("Second Designation", "Elite readiness").

### 4.7 `resources.json` URL checks (fetched 2026-10-12, browser user agent)

| line | title / type | URL | HTTP | Matches description? | Fix |
|---|---|---|---|---|---|
| 3-8 | "MAICPP Readiness Clinic" (TD SYNNEX enablement) | tdsynnex.com/na/us/microsoft/ | 200 ("Microsoft Authorized Distributor \| TD SYNNEX") | Generic hub page. The verified program name is **MAICPP Clinics** [11:59]. | Rename to "MAICPP Clinics" and deep-link if a clinic page exists |
| 11-16 | "Partner Center Association Checklist" (**TD SYNNEX template**) | partner.microsoft.com/ | 200 (MAICPP marketing home) | **No.** No such TD SYNNEX template has a public trace. The link is Microsoft's homepage. | Replace with Microsoft's own docs: learn.microsoft.com/en-us/partner-center/membership/link-partner-id-for-azure-performance-pal-dpor (200) and the CPOR claim doc learn.microsoft.com/en-us/partner-center/incentives/submit-osa-claim (200). Or confirm the template exists internally first. |
| 19-24 | Microsoft Learn: Teams Administrator | …/m365-teams-administrator-associate/ | 200 (Exam MS-700) | Yes. Note it is an *intermediate* cert. | Keep; label "intermediate" |
| 27-32 | Security Operations Analyst | …/security-operations-analyst/ | 200 (SC-200) | Yes | Keep. Add SC-500 (…/cloud-and-ai-security-engineer-associate/, 200) and SC-401 (…/information-security-administrator/, 200). |
| 35-40 | Azure Solutions Architect | …/azure-solutions-architect/ | 200 (AZ-305) | Yes | Keep |
| 43-48 | "Copilot Customer Proof Packet" (**TD SYNNEX template**) | tdsynnex.com/na/us/microsoft/ | 200 (generic) | **No.** No such template has a public trace, and the Copilot spec uses an audit, not references. | Replace with Microsoft's **M365 Copilot specialization audit checklist**: assetsprod.microsoft.com/en-us/copilot-specialization-audit-checklist.pdf (302 → signed CDN, public). Add the Frontier checklist: assetsprod.microsoft.com/en-us/frontier-partner-specialization-audit-checklist.pdf (302, public). |
| 51-56 | Microsoft Commerce Incentives Overview | partner.microsoft.com/membership/incentives | **Soft 404**: HTTP 200 but serves "404 - Page Not Found" (redirects to /en-US/notfound) | **Broken** | Replace with https://partner.microsoft.com/en-us/partnership/partner-incentives (200, "Microsoft Commercial Incentives for Partners"; aka.ms/partnerincentives resolves to it) |
| 59-64 | Microsoft AI Cloud Partner Program | partner.microsoft.com/membership | 200 → /en-US/partnership ("Get started here") | Yes | Keep, or use the canonical /en-us/partnership |

Also: every `focus` array omits `business_apps`, and stage keys "0"-"4" must be remapped after the ladder fix.

### 4.8 `benchmarks.json` → UNVERIFIABLE

- `peerAverage: 52`, `peerByStage {18,38,72,78,84,91}` and the four cohorts (38/63/78/88) have **no source**.
- Microsoft does not publish PCS distributions.
- Line 12 also repeats "Action Pack".
- The compare page labels them "SMB peer average" (compare.js:9, 14), which implies measured peer data.

This breaks the site rule that every number needs a published source. If the numbers came from TD SYNNEX's own partner base, the Customer Zero rule (shapes, not numbers) applies anyway.

Recommendation, in order of preference:
1. **Remove** the peer numbers and compare against **Microsoft's own thresholds** instead (70 total; per-metric maxes from §2; "points to 70"; "metrics at zero").
2. If cohorts stay, relabel them "Illustrative planning bands (not measured data)", drop the "SMB peer average" wording, and remove `peerByStage`.
3. If TD SYNNEX has real aggregated data, publish shapes only (e.g., "most partners who stall are short on usage growth") with a dated internal-source note.

### 4.9 Site rules

- **US English:** grep of all `.html/.js/.json` found no UK spellings. PASS.
- **Competing distributors:** none named in the tool. PASS. (This dossier also avoids naming them; dossier 02's distributor-sourced figures are cited only by file reference.)
- **Customer data as shapes:** benchmarks.json would breach this if its numbers came from real partner data (see 4.8).

### 4.10 Contradictions in the site's own pages

**`frontier.html` vs live docs. This page is the origin of most of the tool's errors.**

| frontier.html line | Says | Live fact | Verdict |
|---|---|---|---|
| 930, 979-989 | Stage 0 "Action Pack / Registered ~$475/yr ... Purchase Action Pack" | Retired 22 Jan 2025; enrollment $0 | OUTDATED (also flagged in 00:83) |
| 1032 | Modern Work: "50 users on M365 E5 ... $4,500 Azure" | 200× E5, 20× Copilot, $4,000 Azure | WRONG (flagged 00:82, 84) |
| 1049 | Security "$4,875/yr (addl.)" | $0 extra | WRONG |
| 1053 | Security "$9,000 Azure ... M365 E5 (50 users)" | $10,000 Azure, 100× E5 | WRONG (00:82) |
| 945 | "Add Second Designation" rung | Not a prerequisite | MISLEADING |
| 1094, 1351-1360 | Frontier badge = 3 designations + 3 specs, presented as the goal | The Frontier Partner **specialization** is live (30 Sep 2026): 4 specializations + 5 Titan badges + 3× DP-600 + $4,000 audit; badge retires June 2027 | OUTDATED |
| 1222-1227 | Modern Work Skilling Intermediate "15 pts max", Advanced "10 pts max" | Intermediate **10**, Advanced **15** | WRONG (swapped) |
| ~1028 / 1222 | MS-102 listed as Modern Work *intermediate* | MS-102 is the **advanced** (Expert) cert, retiring 30 Nov 2026 | WRONG |
| 877 | "As of April 2026, only a small number of partners globally hold it" | Unsourced count | UNVERIFIABLE |

**`copilot-specialization.html`** ("Requirements verified 3 Aug 2026", line 291):
- It matches the live `specializations-apply` page (updated 2026-09-30; the Copilot section text is unchanged): any one of three designations; 1,000 MAU AND 5 customers at ≥5 MAU; 5 + 5 certified people; audit.
- Its Modern Work SMB "10 net adds · 2+1 certified" (334) and Security SMB "5 net adds" (348) are correct.
- **The Navigator contradicts it** on the Copilot prerequisite ("multiple designations") and on proof (case studies vs audit).
- **The two site pages contradict each other:** `frontier.html` implies a second designation step before the Copilot spec, while `copilot-specialization.html` correctly says any one designation suffices.

**Dossier corrections from this audit:**
- **Dossier 02 §2:** the Frontier Partner specialization requirements were "provisional channel reconstruction". They are now official and match closely, with three differences:
  - Prerequisites are stated as "all three of Copilot, Data Security, IAM" plus "at least one of AI Apps or AI Platform". Dossier 00:58's "Accelerate Developer Productivity" option does **not** appear in the specialization; it was a badge-era option.
  - "Titan" is now part of the badge name.
  - Audit price: $4,000 / 8 hours.
- **control-before-scale/04 §1.3 line 70:** "16 of 25 skilling points" for Security SMB is wrong. The Security skilling max is **40** (4 + 4 + 8 × 4), so 3 people = 16 of **40**.
- **control-before-scale/04 line 49:** "Fundamentals-level certifications do not count" is contradicted for Modern Work. Its intermediate list includes Microsoft 365 Fundamentals (through 2027-03-31) and Copilot and Agent Administration Fundamentals.

---

## 5. Sources (all accessed 2026-10-12 unless noted)

**Microsoft Learn / Partner Center** (`updated_at` from page metadata):
- Partner Capability Score: https://learn.microsoft.com/en-us/partner-center/membership/partner-capability-score (2026-05-11)
- Solutions Partner for Modern Work: https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-modern-work (2026-08-26)
- Solutions Partner for Security: https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-security (2026-08-31)
- Solutions Partner for Data & AI, Infrastructure, and Digital & App Innovation: https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-azure (2026-08-03)
- Solutions Partner for Business Applications: https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-business (2026-07-31)
- Introduction to Solutions Partner designations: https://learn.microsoft.com/en-us/partner-center/membership/introduction-to-pcs (2026-08-05)
- Solutions Partner FAQ: https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-faq (2026-03-02)
- Pay the Solutions Partner designation fee: https://learn.microsoft.com/en-us/partner-center/membership/mpn-pay-fee-silver-gold-competency (2026-04-09)
- Partner Launch Benefits: https://learn.microsoft.com/en-us/partner-center/membership/partner-launch-benefits (2026-07-27)
- Partner Success Core: https://learn.microsoft.com/en-us/partner-center/membership/partner-success-core-benefits (2026-06-25)
- Partner Success Expanded: https://learn.microsoft.com/en-us/partner-center/membership/partner-success-expanded-benefits (2026-06-25)
- Action Pack (retired): https://learn.microsoft.com/en-us/partner-center/membership/mpn-get-action-pack (2026-03-09)
- Apply for specializations: https://learn.microsoft.com/en-us/partner-center/membership/specializations-apply (2026-09-30)
- Specializations overview: https://learn.microsoft.com/en-us/partner-center/membership/specializations (2026-09-30)
- Announcements, September 2026 ("Frontier Partner specialization now live", 2026-09-30): https://learn.microsoft.com/en-us/partner-center/announcements/2026-september
- Announcements, October 2026 (new Security designation workloads, 2026-10-05; growth margin GA): https://learn.microsoft.com/en-us/partner-center/announcements/2026-october
- Tech Community, "Now live: earn the Frontier Partner specialization": https://techcommunity.microsoft.com/blog/specialization-blog/now-live-earn-the-frontier-partner-specialization/4560493 (search result, not fetched)
- Frontier Partner Specialization Program guide, audit checklist & FAQ V1.0 (20 pp): https://assetsprod.microsoft.com/en-us/frontier-partner-specialization-audit-checklist.pdf
- M365 Copilot specialization audit checklist: https://assetsprod.microsoft.com/en-us/copilot-specialization-audit-checklist.pdf (302 verified 2026-10-12; content per dossier 10, 2026-08-28)
- Certification pages: security-operations-analyst (SC-200), m365-teams-administrator-associate (MS-700), m365-collaboration-communications-systems-engineer (MS-721), azure-solutions-architect (AZ-305), azure-security-engineer (AZ-500, retired 2026-08-31), cloud-and-ai-security-engineer-associate (SC-500), information-security-administrator (SC-401), m365-administrator-expert (MS-102, retires 2026-11-30), all under https://learn.microsoft.com/en-us/credentials/certifications/
- Microsoft Commercial Incentives for Partners: https://partner.microsoft.com/en-us/partnership/partner-incentives

**Repo (dated 2026-08-28 unless noted):**
- research/partner-program-journey/00-brief-and-synthesis.md (lines 46-58, 74-90)
- 01-day-zero-onboarding.md (12-27, 33-73, 79-95)
- 02-frontier-and-copilot-tier-ladder.md (10-42, 75-80)
- 05-program-universe-taxonomy.md (141, 252, 305)
- 09-specialization-requirements-authoritative.md (22-75, 145-186)
- 10-specialization-audit-checklists.md (6-9; ISSI, 4 hours, ~$2,700)
- 11-distributor-layer-and-frontier-disti.md (8-14, 54-70)
- research/control-before-scale/04-partner-program.md (39-99)
- copilot-specialization.html (291, 334, 348, 373, 553-558)
- frontier.html (877, 930-1094, 1212-1250, 1351-1360) (both site pages as of 2026-10-12)

**Audited files:**
- frontier-navigator/assets/js/scoring.js
- data/questions.json, data/benchmarks.json, data/resources.json
- index.html, pages/{assessment,results,roadmap,compare,resources,export}.html
- assets/js/{app,assessment,compare,export,resources,results,roadmap}.js
- assets/img/continuum-stages.svg
