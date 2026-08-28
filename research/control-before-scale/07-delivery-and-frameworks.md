# 07 — Delivery Mechanics and the Framework Backdrop

**Research dossier for the MSP/CSP practice guide — SMB market, 25–300 seats**
**Compiled 28 August 2026. All regulatory status statements are "as of 28 August 2026" unless otherwise noted.**

**Source tags:** `[REGULATOR/STANDARD]` primary regulator or standards body · `[MS-OFFICIAL]` Microsoft Learn / Microsoft adoption sites · `[PARTNER-PUBLISHED]` a partner, MSP or consultancy publishing its own methodology · `[PRESS]` trade press, law-firm client alerts, analyst or vendor commentary · `[UNVERIFIED]` could not be confirmed against a primary source; treat as a lead, not a claim.

**A standing warning for the guide.** The single most common error in partner marketing on this topic is telling a 60-seat company that the EU AI Act, ISO 42001 or the Colorado AI Act obliges it to act. In almost every case it does not. The levers that genuinely bite at sub-100 seats are sectoral (HIPAA, FTC Safeguards, PCI DSS, CMMC), professional-conduct (bar rules), contractual (customer security questionnaires, DPAs) and — increasingly and most usefully — **insurance**. Everything below is written to keep that distinction sharp.

---

## 1. Published assessment methodologies a partner can adopt or adapt

### 1.1 NIST AI Risk Management Framework (AI RMF 1.0) and the Generative AI Profile

`[REGULATOR/STANDARD]` AI RMF 1.0 was released **26 January 2023**. It is organised around four core functions — **GOVERN, MAP, MEASURE, MANAGE** — and is explicitly "intended for voluntary use." NIST also publishes a companion **Playbook**, a **Roadmap**, and **crosswalks** to other frameworks. As of April 2026 the AI RMF is under revision as part of the White House AI Action Plan, and on **7 April 2026** NIST announced a concept note for an AI RMF Profile on Trustworthy AI in Critical Infrastructure.
https://www.nist.gov/itl/ai-risk-management-framework (fetched 28 Aug 2026)

`[REGULATOR/STANDARD]` **NIST AI 600-1, the Generative AI Profile**, was published **26 July 2024**. It extends — does not replace — AI RMF 1.0, mapping the four functions onto twelve generative-AI-specific risk categories and offering on the order of 200 suggested actions. Risk categories include data provenance, confabulation/hallucination, IP, information integrity, and dual-use/CBRN concerns.
https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf · https://www.nist.gov/itl/ai-risk-management-framework

`[PRESS]` The Playbook is distributed as PDF, CSV, Excel and JSON, which makes it directly importable into a GRC tool or even a spreadsheet-based risk register — the practical reason a small partner can use it without buying anything. Reported at https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook (format claim per https://www.openlayer.com/blog/nist-ai-rmf-implementation-guide, Apr 2026).

**Why it matters to a 25–300 seat partner engagement.** AI RMF is free, US-authored, non-certifiable, and structured enough to give an assessment report a defensible spine. Use GOVERN as the policy/committee section, MAP as the AI inventory and use-case register, MEASURE as the monthly metrics pack, MANAGE as the remediation roadmap. That mapping alone converts a tenant-config audit into something a board will accept as "AI governance."

### 1.2 ISO/IEC 42001 (and its relationship to ISO/IEC 27001)

`[PRESS]` ISO/IEC 42001:2023 is an AI management system standard with **38 Annex A controls** grouped under nine control objectives (A.2–A.10), covering AI policy, internal organisation, resources, impact assessment, AI life cycle, data, transparency, use, and third-party relationships. ISO/IEC 27001's Annex A protects confidentiality/integrity/availability and says nothing about whether a model is fair, explainable or used as intended; 42001's A.5 (assessing impacts of AI systems) and A.7 (data) are the gap-fillers. **ISO/IEC 42005** provides the AI impact-assessment method that A.5 leans on.
https://www.konfirmity.com/blog/iso-42001-controls · https://encorsys.com/blog/iso-42001-vs-iso-27001 · https://mindsetcyber.com.au/iso-42001-controls-list/

`[PRESS]` **Cost reality for SMB.** Reported 2026 figures: Stage 1 + Stage 2 certification audit **~$5,000–$15,000 for small organisations**, $15,000–$30,000 mid-size; another source gives an SMB band of $7,500–$25,000. Total elapsed 6–12 months. Implementation consulting is quoted at $45K–$100K *even where ISO 27001 already exists*, plus roughly $25K–$65K of internal labour over six months. Years 2–3 surveillance audits run 40–60% of the year-1 audit fee. Sources note the audit market is immature enough that quotes for the same scope vary by 3×.
https://elevateconsult.com/insights/iso-42001-certification-cost-breakdown-what-enterprise-ai-teams-pay-in-2026/ · https://compyl.com/blog/iso-42001-certification-cost/ · https://iso42001toolkit.com/iso-42001-certification-cost.html

**Guide position:** for a 60-seat firm, ISO 42001 certification is almost never the right recommendation. Use 42001 Annex A as a **checklist to structure the deliverables**, and reserve certification advice for clients who sell into enterprises that demand it, or who are themselves building/deploying AI products.

### 1.3 CIS Microsoft 365 Foundations Benchmark

`[PRESS]` **v7.0.0 was released 19 May 2026**: 21 new controls, ~55 updated, 2 removed. Structural change of note for partners: the (L1)/(L2) tags were removed from recommendation titles and **Global Recommendation IDs (GRIDs)** introduced for cross-benchmark mapping — which breaks any report template keyed to old title strings.
https://www.oneadvanced.com/resources/whats-new---cis-microsoft-365-foundations-benchmark-v7.0.0/ (fetched 28 Aug 2026)

`[PRESS]` The benchmark has carried Copilot guidance since v4.0.0. The specific control worth quoting to customers is **3.2.3 "Ensure DLP policies are published for Copilot users" (L1)** — requiring at least one DLP policy scoped to Microsoft 365 Copilot and Copilot Chat interactions. It is an **L1** control, i.e. baseline rather than discretionary.
https://www.oneadvanced.com/resources/whats-new---cis-microsoft-365-foundations-benchmark-v7.0.0/ · https://mondoo.com/blog/microsoft-365-cis-benchmark-5-0-what-you-need-to-know

`[MS-OFFICIAL]` Microsoft acknowledges CIS Benchmarks as a recognised configuration baseline for M365.
https://learn.microsoft.com/en-us/compliance/regulatory/offering-cis-benchmark

### 1.4 CISA SCuBA secure configuration baselines for M365

`[REGULATOR/STANDARD]` CISA established the SCuBA project in 2022 and released **v1.0 of the M365 Secure Configuration Baselines together with the ScubaGear assessment tool in December 2023**, covering Microsoft Entra ID, Defender for Office 365, Exchange Online, SharePoint Online/OneDrive, Teams and Power Platform. ScubaGear is a **no-cost** PowerShell tool that reports a tenant's conformance to the baselines, and CISA makes both the baselines and the tool available to private-sector organisations, not only federal agencies.
https://www.cisa.gov/news-events/news/cisa-finalizes-microsoft-365-secure-configuration-baselines · https://www.cisa.gov/news-events/alerts/2023/12/21/cisa-releases-microsoft-365-secure-configuration-baselines-and-scubagear-tool · https://www.cisa.gov/resources-tools/services/m365-defender-office

`[UNVERIFIED]` I could not confirm the exact current baseline version number or the most recent release date as of Aug 2026 — cisa.gov returned 403 to automated fetch. **Before publishing, check the version and date directly at cisa.gov/scuba and at github.com/cisagov/ScubaGear.** Do not print a version number on the strength of this dossier.

**Practical value.** ScubaGear is the single best free artefact for the discovery stage of an SMB engagement: it runs read-only, produces an HTML/JSON conformance report in an afternoon, and gives the findings workshop a government-authored authority that a partner's own spreadsheet does not carry. Pair it with Microsoft Secure Score for a two-source view.

### 1.5 Microsoft's own assessment vehicles

`[MS-OFFICIAL]` **Microsoft Learn Assessments** hosts a free, self-service **AI Readiness Assessment** questionnaire that partners can co-run with a customer and export.
https://learn.microsoft.com/en-us/assessments/94f1c697-9ba7-4d47-ad83-7c6bd94b1505/ · browse: https://learn.microsoft.com/en-us/assessments/browse/

`[MS-OFFICIAL]` **Funded partner engagements.** Microsoft's ABS engagements portal lists funded and unfunded workshop/assessment offers partners can deliver to qualified customers.
https://microsoftpartners.microsoft.com/abs/engagements/

`[PRESS]` Reported FY26/FY27 funding bands: **Azure Accelerate** $5K–$175K per engagement; **Copilot + Power Accelerate** with Envisioning $5K–$25K and Deployment Accelerator $5K–$50K, scaled by seat count and market tier. Treat the specific numbers as indicative — eligibility and amounts change each fiscal year and are gated in Partner Center.
https://www.aicloudpartners.com/guides/microsoft-partner-program-guide.html

`[UNVERIFIED]` The classic "Solution Assessment" programme (the licensing/estate-inventory-funded assessment that produced the 2023 Solution Assessments Partner of the Year award — https://www.businesswire.com/news/home/20230626438659/en) appears to have been folded into the broader Accelerate/ABS engagement framework. **Verify current programme name, eligibility and funding in Partner Center before describing it in the guide.** Partner Center announcements for July and August 2026 are the authoritative place to check:
https://learn.microsoft.com/en-us/partner-center/announcements/2026-july · https://learn.microsoft.com/en-us/partner-center/announcements/2026-august

### 1.6 Microsoft Purview DSPM for AI — the discovery engine

This is the most operationally important tool in the whole engagement, so the detail matters.

`[MS-OFFICIAL]` Data risk assessments live at **Purview portal > DSPM > Discover > Data risk assessments**. A **default assessment runs weekly against the top 100 SharePoint sites by usage** (and, separately, the top 100 Fabric workspaces once a one-time Entra app registration is configured). First run has a **4-day delay** before results appear; after any assessment completes, wait **at least 48 hours** for results, which then do not update — a fresh assessment is needed to see change.
https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing (page ms.date 1 May 2026, updated 25 Jun 2026)

`[MS-OFFICIAL]` Each site's flyout has **Overview / Identify / Protect / Monitor** tabs. *Identify* shows how much data has been scanned for sensitive information types and can trigger on-demand classification. *Protect* offers four remediations: **restrict access by label** (a DLP policy stopping Copilot and agents summarising labelled data), **restrict all items** (SharePoint Restricted Content Discovery to exempt sites from Copilot), **create an auto-labeling policy**, and **create retention policies** for content untouched for 3+ years. *Monitor* gives counts of items shared with anyone / everyone in the org / specific people / externally, and launches a SharePoint site access review.
Same URL.

`[MS-OFFICIAL]` **Custom assessments** support item-level scanning with remediation, but only for Microsoft 365, currently **only SharePoint (not OneDrive)**, a **maximum of 10 SharePoint sites for item-level scanning**, and require a registered Entra application. Item-level remediation actions: **Resolve, Apply sensitivity label, Notify (site owner, non-customisable email), Remove sharing link**. Custom assessment results expire after **30 days**; use the duplicate option to re-run. **Limits: 200,000 items per location; file counts may be inaccurate above 100,000 files per location.** Both default and custom assessments **export to Excel, CSV, JSON, TSV** — which is how findings get into a partner's own report template.
Same URL.

`[MS-OFFICIAL]` The broader Purview surface supported for Copilot interactions: DSPM and DSPM for AI, Auditing, data classification, sensitivity labels, encryption without labels, DLP, Insider Risk Management (there is a **"Risky AI usage" policy template** covering prompt-injection and protected-material access), Communication Compliance, eDiscovery, Data Lifecycle Management, and **Compliance Manager regulatory templates for AI regulations**. Microsoft's own recommended getting-started order is: (1) confirm auditing is on, (2) work the Microsoft 365 Copilot view sections — *Assess and prevent oversharing*, *Secure your data*, *Discover activity*, (3) apply **one-click policies**, (4) wait ≥1 day and read the Reports page, (5) add retention/eDiscovery controls.
https://learn.microsoft.com/en-us/purview/ai-m365-copilot (ms.date 1 May 2026, updated 25 Jun 2026)

`[MS-OFFICIAL]` The named one-click policies are: *Protect your data with sensitivity labels*; *DSPM for AI – Detect risky AI usage*; *DSPM for AI – Unethical behavior in AI apps*; *DSPM for AI – Protect sensitive data from Copilot processing*; *DSPM for AI – Detect sensitive info shared with AI via network*.
Same URL.

`[MS-OFFICIAL]` Prompts and responses are captured in the **unified audit log**; eDiscovery searches them via `ItemClass` = `IPM.SkypeTeams.Message.Copilot.*` or the query-builder condition *Type contains any of → Copilot activity*. Retention policies use the **"Microsoft Copilot Experiences"** location. Endpoint DLP can warn or block pasting sensitive content into third-party generative AI sites in a browser.
Same URL.

### 1.7 SharePoint Advanced Management (SAM)

`[MS-OFFICIAL]` SAM provides the **Oversharing Baseline Report**, **Permission State / Permissioned User reports**, **Site Access Reviews** (delegating review to site owners), and **Restricted Content Discovery**. Microsoft positions this explicitly as Copilot-readiness tooling.
https://learn.microsoft.com/en-us/sharepoint/get-ready-copilot-sharepoint-advanced-management · https://techcommunity.microsoft.com/blog/microsoft365copilotblog/mitigate-oversharing-to-govern-microsoft-365-copilot-and-agents/4448744

`[PRESS]` The Oversharing Baseline Report scans **all** sites rather than only recently active ones — a meaningful distinction when scoping remediation effort.
https://techcommunity.microsoft.com/blog/healthcareandlifesciencesblog/sharepoint-advanced-management-helping-with-copilot-readiness--oversharing/4355206

### 1.8 Copilot Control System and Agent 365

`[MS-OFFICIAL]` The Copilot Control System has three pillars: **Security and governance**, **Management controls**, **Measurement and reporting**. Management controls sit mainly in the Microsoft 365 admin center, Power Platform admin center and Copilot Studio, and cover agent lifecycle from deployment to retirement.
https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-control-system/management-controls · https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-control-system/security-governance

`[PRESS]` **Agent 365** — a control plane for observing, governing and securing AI agents including third-party ones — reportedly went generally available **1 May 2026**.
https://www.microsoft.com/insidetrack/blog/shaping-ai-management-at-microsoft-with-agent-365-and-copilot-controls/ · https://www.helpnetsecurity.com/2026/05/14/copilot-studio-security-governance-updates/

`[MS-OFFICIAL]` Power Platform governance now lets admins define authentication/access policies for agents at environment or environment-group level — require Entra ID auth, allow approved external providers, or prohibit anonymous access.
https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-platform-governance-administration/manage-copilot-security-enhanced-admin-controls

---

## 2. The regulatory backdrop — and who it actually touches

### 2.1 EU AI Act — mostly *not* an SMB lever, and partners keep getting this wrong

`[REGULATOR/STANDARD]` Per the European Commission's own AI Act page (fetched 28 Aug 2026):

| Milestone | Date |
|---|---|
| Entry into force | 1 August 2024 |
| Prohibited practices (1–8) | February 2025 |
| GPAI obligations | 2 August 2025 |
| General application + Article 50 transparency duties | **2 August 2026** |
| Prohibited practice 9 (CSAM/nudification) | December 2026 |
| High-risk, stand-alone (Annex III) | **2 December 2027** |
| High-risk, product-embedded (Annex I) | **2 August 2028** |

The **AI Omnibus amendments entered into force 27 July 2026**, pushing the high-risk regime to the December 2027 / August 2028 dates above and extending "simplified requirements" beyond SMEs to small mid-caps. Deployer duties named on the page: ensure human oversight and monitoring, and report serious incidents and malfunctioning.
https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai

`[PRESS]` Council adopted the Digital Omnibus text on 29 June 2026 following a 7 May 2026 political agreement; SME/startup fines are capped at the lower of the fixed sum or the percentage.
https://trilateralresearch.com/responsible-ai/eu-ai-act-implementation-timeline-mapping-your-models-to-the-new-risk-tiers · https://www.legiscope.com/blog/eu-ai-act-timeline-deadlines.html

**Applicability, stated plainly for the guide.** A US or UK SMB of 25–300 seats that uses Microsoft 365 Copilot internally is a **deployer** of a general-purpose AI system, not a provider, and its use is almost never Annex III high-risk. Its realistic AI Act exposure is (a) **Article 50 transparency** if it puts an AI chatbot in front of EU consumers or publishes synthetic media, and (b) **AI literacy** duties. Recruitment screening, credit scoring, and worker-management uses are the exceptions that can pull an SMB into Annex III — and even those now sit at December 2027. **Do not tell a 60-seat client the EU AI Act requires an AI management system.**

### 2.2 US state AI laws

`[PRESS]` **Colorado.** SB 24-205 (2024) was postponed by SB 25B-004, signed **28 August 2025**, moving the effective date from 1 February 2026 to **30 June 2026**. It was then **repealed and replaced** by **SB 26-189, signed 14 May 2026**, substituting a narrower notice/transparency framework with an effective date of **1 January 2027**. A federal court had blocked enforcement of the predecessor.
https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/colorado-postpones-implementation-of-colorado-ai-act-sb-24-205 · https://www.seyfarth.com/news-insights/colorado-enacts-artificial-intelligence-replacement-law.html · https://www.mcdermottlaw.com/insights/colorado-ai-law-in-flux-comprehensive-replacement-bill-signed-after-federal-court-blocks-predecessors-enforcement/ · https://leg.colorado.gov/bills/sb25b-004

> **Guide note:** any partner marketing still citing "Colorado AI Act, effective February 2026" is citing a law that no longer exists in that form. This is the cleanest available example of why the guide should date-stamp every regulatory claim.

`[PRESS]` **Texas TRAIGA (HB 149)** signed 22 June 2025, **effective 1 January 2026**. Intent-based prohibitions on AI developed/deployed for restricted purposes (incitement to self-harm, unlawful discrimination, infringement of constitutional rights, CSAM). Applies broadly to entities operating, developing or deploying AI in Texas or offering AI products to Texas residents — but the prohibitions are conduct-specific, not a compliance-programme mandate.
https://www.nortonrosefulbright.com/en/knowledge/publications/c6c60e0c/the-texas-responsible-ai-governance-act · https://www.bakerbotts.com/thought-leadership/publications/2025/july/texas-enacts-responsible-ai-governance-act-what-companies-need-to-know

`[PRESS]` **Illinois HB 3773** (amending the Illinois Human Rights Act) signed 9 August 2024, **effective 1 January 2026**: using AI in recruitment, hiring, promotion, discharge, discipline or tenure without notice — or in a discriminatory way, or using ZIP codes as proxies — is a civil rights violation. **This one genuinely reaches small employers with Illinois staff.**
https://www.berkshireassociates.com/blog/texas-enacts-new-law-for-employers-using-artificial-intelligence · https://www.bakerbotts.com/thought-leadership/publications/2026/january/us-ai-law-update

`[PRESS]` **Utah AI Policy Act (SB 149)** effective 1 May 2024; later amendments narrowed disclosure to on-request and higher-risk contexts.
https://www.bakerbotts.com/thought-leadership/publications/2026/january/us-ai-law-update

`[PRESS]` **California CCPA ADMT regulations.** Finalised 2025. Businesses using ADMT for **significant decisions** must give a pre-use notice, an opt-out, and access rights, with **compliance required by 1 January 2027** for existing users and before deployment for anyone adopting later. Risk-assessment obligations attach from **1 January 2026** with **initial assessments due 31 December 2027**; one source additionally cites an April 2027 date for ADMT-specific risk assessments. **The CCPA's own applicability thresholds still gate all of this** — most sub-100-seat firms fall below them.
https://www.akingump.com/en/insights/alerts/new-california-regulations-regarding-employer-use-of-automated-decision-making-technology-compliance-required-by-january-1-2027 · https://www.littler.com/news-analysis/asap/californias-automated-decisionmaking-technology-regulations-seven-steps · https://www.skadden.com/insights/publications/2025/10/california-finalizes-cppa-regulations

`[PRESS]` **State comprehensive privacy laws generally.** ~20 states enacted as of 2026; **Indiana, Kentucky and Rhode Island took effect 1 January 2026**. Thresholds matter enormously for SMB: Indiana and Kentucky use Virginia-style 100,000-consumer (or 25,000 + >50% revenue from data sales) thresholds; Rhode Island 35,000; Utah requires $25M revenue *and* a consumer count; **Texas has no consumer-count threshold and instead exempts SBA-defined small businesses**.
https://www.enzuzo.com/blog/us-state-privacy-laws · https://www.ketch.com/blog/posts/us-privacy-laws-2026 · https://www.zerodaylaw.com/blog/us-state-privacy-acts

---

## 3. Sector rules that create genuine SMB urgency

### 3.1 HIPAA

`[PRESS]` The **Security Rule NPRM was published 6 January 2025**; the comment period closed 7 March 2025 with ~4,745 comments. **No final rule exists as of Aug 2026.** OCR's agenda had targeted spring 2026; OMB's Unified Agenda (RIN 0945-AA22) now shows **July 2027** for final action.
https://www.hipaajournal.com/new-hipaa-regulations/ · https://compliancy-group.com/proposed-hipaa-security-rule-update-2026/ · https://www.bdemerson.com/article/hipaa-security-rule-update-2026

**Correct framing for the guide:** do not sell the proposed rule as an obligation. Sell the **existing** rule — §164.308(a)(1)(ii)(A) risk analysis, which remains the most-cited deficiency in OCR investigations. A Copilot deployment materially changes the flow of ePHI inside a tenant, which makes an updated risk analysis defensible, current-rule work. That is a much stronger and more honest pitch than speculating about 2027.

### 3.2 FTC Safeguards Rule

`[REGULATOR/STANDARD]` Applies to non-bank "financial institutions" under GLBA — a category far wider than the name suggests: **auto dealers that arrange financing or leasing, tax preparers and accountants, mortgage brokers and lenders, collection agencies, real-estate settlement services, finders**. Requires a written information security programme with a named qualified individual, plus MFA and encryption. Entities maintaining information on **fewer than 5,000 consumers are exempt from specific elements** — written risk assessment, continuous monitoring / periodic penetration testing and vulnerability assessment, written incident-response plan, and the annual report to the board — but remain subject to the Rule itself. Breach of unencrypted customer information affecting **≥500 consumers must be reported to the FTC within 30 days**.
https://www.ftc.gov/legal-library/browse/rules/safeguards-rule · https://www.ftc.gov/business-guidance/resources/automobile-dealers-ftcs-safeguards-rule-frequently-asked-questions · https://practicalprivacy.wyrick.com/blog/not-just-for-auto-dealers-what-the-ftcs-updated-safeguards-rule-means-for-all-non-bank-financial-institutions

**Why this is a top-three SMB lever.** A 40-person accountancy or a 25-person auto dealership is squarely covered, already has a written ISP obligation, and has just introduced a tool that reads every document in the tenant. The AI acceptable use policy and the data-access remediation slot straight into the existing programme rather than being a new expense to justify. Note the 5,000-consumer exemption carefully — it removes the *written risk assessment* obligation, which is exactly the artefact a partner most wants to sell. Sell it as good practice for those clients, not as a legal requirement.

### 3.3 PCI DSS v4.0.1

`[PRESS]` Of 64 new v4.x requirements, **51 were future-dated and became mandatory 31 March 2025**. v4.0.1 (June 2024) was a clarification release and did not move that date. **v4.0.1 is the only active version**; there is no remaining grace period. References to "2026 deadlines" concern the first assessment/SAQ/ROC filings scored against the full standard, not a new effective date.
https://blog.pcisecuritystandards.org/now-is-the-time-for-organizations-to-adopt-the-future-dated-requirements-of-pci-dss-v4-x · https://www.twosense.ai/blog/breaking-down-pci-4-future-dated-timeline-and-requirements

**AI relevance is indirect** — PCI does not regulate AI. The connection is that Copilot indexing SharePoint content can surface cardholder data that should never have been stored there, which is a PCI finding regardless of Copilot. Use it as a discovery output, not a legal hook.

### 3.4 CMMC

`[PRESS]` The **48 CFR rule took effect 10 November 2025**, making CMMC an enforceable DoD contract requirement. **Phase 1 runs 10 Nov 2025 – 9 Nov 2026**: Level 1 and Level 2 **self-assessments** as a pre-award condition, with affirmations in SPRS. Phase 2 was to begin 10 November 2026, but **as of 13 July 2026 the Department of War has suspended Phases II and III** pending a 60-day CMMC Reform Task Force review.
https://secureframe.com/hub/cmmc/proposed-final-rule · https://isidefense.com/blog/cmmc-update-what-the-48-cfr-final-rule-means-for-your-business · https://www.clarkschaefer.com/insights/cmmc-phase-2-timeline-explained

`[UNVERIFIED]` The outcome of that review, and whether Phase 2 has since resumed or been re-dated, could not be confirmed. **Check acq.osd.mil/cmmc before publishing any Phase 2 date.**

**SMB relevance:** high, and specific. A 90-seat defence supplier holding CUI has a live, contract-award-gating obligation *today* under Phase 1, and Copilot's ability to surface CUI across a tenant is a direct CMMC access-control and media-protection concern. This is the sharpest urgency lever in the list — but only for the defence-supply-chain slice of the SMB market.

### 3.5 SEC

`[REGULATOR/STANDARD]` Form 8-K **Item 1.05** requires disclosure of material cybersecurity incidents within four business days of the materiality determination; annual reports must describe risk management, strategy and governance. **Smaller reporting companies began complying with Item 1.05 on 15 June 2024** (all other registrants 18 December 2023).
https://www.sec.gov/files/33-11216-fact-sheet.pdf · https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/cybersecurity-risk-management-strategy-governance-incident-disclosure

**Applies only to SEC registrants.** Essentially irrelevant to a private 25–300 seat business. Include it in the guide only as a *client-of-your-client* pressure: private SMBs supplying public companies get the obligation pushed down contractually.

### 3.6 Professional conduct — lawyers

`[REGULATOR/STANDARD]` **ABA Formal Opinion 512**, issued **29 July 2024**, is the first national ethics guidance on generative AI. It applies Model Rules on competence (1.1), confidentiality (1.6), client communication (1.4), candour to tribunals (3.3), supervisory duties (5.1/5.3) and fees (1.5). Lawyers need a **reasonable understanding of a tool's capabilities and limitations** without becoming experts; required verification is task- and tool-specific; and fees must reflect time actually spent.
https://www.americanbar.org/news/abanews/aba-news-archives/2024/07/aba-issues-first-ethics-guidance-ai-tools/ · https://thebarexaminer.ncbex.org/article/fall-2024/generative-artificial-intelligence-tools/

`[PRESS]` As of March 2026, **35+ state bar associations** have issued AI guidance; commentary describes a 2026 shift from advisory guidance toward enforceable rule language.
https://legalaicompliance.help/ · https://thelegalprompts.com/blog/ai-legal-ethics-bar-association-guidelines

**Why this is the best lever for the legal vertical.** Confidentiality under Rule 1.6 and the supervision duty under 5.3 map directly onto the two things a partner actually delivers: a tenant where Copilot cannot surface one client's matter to another client's team, and a written, acknowledged AI use policy with training records. A 15-lawyer firm has a professional-discipline exposure, not a regulatory one — and that is more persuasive, not less.

### 3.7 Cyber insurance — the strongest under-used lever

`[PRESS]` The most concrete published account of what carriers now ask lists **seven AI questions at 2026 renewal**: (1) do you have a **written AI use policy**; (2) are employees **trained on AI misuse**, with structured training and completion records; (3) can you **document it** (completion certificates, training reports, acknowledgment records producible during a claims investigation); (4) do you have a **dated AI risk assessment on file** naming which tools are used, what data they can reach and what controls apply; (5) is **AI governance integrated into the security programme** rather than standalone; (6) **have any prior incidents involved AI**, including employee misuse of public tools; (7) do you **audit AI tool usage** — evidence of monitoring, an approval process, and whether real usage matches the approved list. The same source claims **81% of cyber insurers now include AI governance questions**; no carriers are named.
https://aisafeiq.com/blog/cyber-insurance-7-ai-questions-2026 (fetched 28 Aug 2026)

`[PRESS]` Corroborating commentary: an AI governance section appeared on applications across the market during 2025 and accelerated into 2026; carriers want to know which AI tools are in use, whether there is an approval process, and whether approved lists reflect reality. Modern questionnaires run to 200–400 questions. The framing used repeatedly in the trade press is that **AI controls are becoming a condition of coverage in the same way MFA did** — with the implication that misrepresentation could support a claim denial.
https://gogravity.net/blog/cyber-insurance-renewal-questionnaire-walkthrough-2026/ · https://www.buildmvpfast.com/blog/cyber-insurance-ai-requirements-2026 · https://www.kovrr.com/blog-post/does-cyber-insurance-cover-ai-incidents

`[PRESS]` On the insurer's own side, the **NAIC Model Bulletin on the Use of Artificial Intelligence Systems by Insurers** was adopted **4 December 2023**; by mid-2026 roughly **24–25 states plus DC have adopted it**, with several more in progress and California, Colorado, New York and Texas running their own frameworks. NAIC maintains the official adoption map.
https://content.naic.org/sites/default/files/legal-adoption-map-ai-model-bulletin.pdf · https://www.quarles.com/newsroom/publications/nearly-half-of-states-have-now-adopted-naic-model-bulletin-on-insurers-use-of-ai

`[UNVERIFIED]` The "81% of cyber insurers" figure and the specific seven-question list come from a single vendor blog. **Before the guide prints either, get an actual renewal application PDF from a broker** — Coalition, Corvus/Travelers, At-Bay, Chubb, Beazley and CFC are the usual SMB-market carriers. A redacted real application is worth more to a partner audience than any statistic, and it is obtainable in a week.

**Why this is the best lever of all for 25–300 seats.** It is annual, unavoidable, has a named decision-maker (the owner or CFO signing the application), a hard date (renewal), and a quantifiable consequence (premium, sub-limits, coverage denial). Unlike every regulation above, it applies regardless of sector, state or headcount. **The guide should build the commercial pitch around the renewal calendar, not around the EU AI Act.**

### 3.8 Shadow AI — the demand-side evidence

`[PRESS]` Widely reported 2026 survey figures: **71% of workers use unapproved AI tools, 51% weekly**; 80%+ report using unapproved tools; 45% of US workers use AI at work without disclosing it; **38% have shared sensitive company data with AI tools without permission**; only ~25% of organisations have comprehensive visibility into AI usage, against 78% of executives who believe they do.
https://jumpcloud.com/blog/11-stats-about-shadow-ai-in-2026 · https://www.teramind.co/l/shadow-ai-report-2026/ · https://www.secondtalent.com/resources/shadow-ai-stats/

`[UNVERIFIED]` These are vendor-published survey numbers with wide variance and no consistent methodology. Use **one** of them, attributed and dated, or use none. Do not stack them.

---

## 4. The engagement, stage by stage

Below is the best-supported sequence, assembled from the one genuinely detailed published partner blueprint plus Microsoft's own recommended order of operations. Durations and effort marked **[S]** are sourced; **[E]** are my synthesis, adjusted downward from the enterprise blueprint for a 25–300 seat tenant.

### 4.1 The sourced enterprise baseline

`[PARTNER-PUBLISHED]` The most complete published methodology found is a **4-week / 20-business-day, 12-checkpoint** Copilot Readiness Assessment blueprint:

- **Checkpoints:** 1 licensing · 2 identity & MFA · 3 SharePoint permissions · 4 data classification coverage · 5 DLP readiness · 6 Purview integration · 7 network · 8 application versions · 9 governance framework · 10 regulatory compliance mapping · 11 user readiness & change management · 12 executive briefing.
- **Team and allocation:** Assessment Lead 100% × 4 wks; Security/Identity Engineer 60%; SharePoint/M365 Admin 80% (wks 1–3); Compliance Lead 60% (wks 2–4); Change Manager 40% (wks 3–4); Executive Sponsor 5%. **Total ~480–520 person-hours.**
- **Tooling:** M365 admin centre, Entra portal, SharePoint admin centre, **PnP PowerShell**, Microsoft Graph API, Purview (DLP, Content Explorer, eDiscovery), network test tools, survey platform.
- **Customer must provide:** named executive sponsor with budget authority, licensing inventory, existing classification/governance documents, stakeholder alignment across IT/security/compliance/business, admin access at **Global Reader minimum**, current DLP policies and compliance documentation.
- **Scoring:** each checkpoint Green/Yellow/Red. Decision rule — **one Red blocks deployment; two or more Yellows force a phased rollout.**
- **Headline finding:** the SharePoint permissions audit is the highest failure point, with **90%+ of enterprises scoring Yellow or Red**.

https://www.copilotconsulting.com/insights/copilot-readiness-assessment-program-blueprint (fetched 28 Aug 2026)

`[PARTNER-PUBLISHED]` Corroborating market shape from Microsoft Marketplace consulting listings: readiness assessments are commonly scoped at **2–4 weeks**; one listing is a **4-week, $45,000** data-and-security readiness engagement. Deliverables recurring across listings: identity readiness report (MFA coverage %, conditional access gaps, hybrid sync health), DLP readiness report (coverage gaps, Copilot workload inclusion), and a **permission risk heatmap** across SharePoint/OneDrive/Teams.
https://marketplace.microsoft.com/en-us/marketplace/consulting-services/insight-5305567.m365_copilot_readiness_assessment · https://marketplace.microsoft.com/en-us/marketplace/consulting-services/spyglassmtgllc.copilotreadiness · https://marketplace.microsoft.com/en-us/marketplace/consulting-services/cloud-direct-1665588.copilot_readiness_assessment

> **Critical scaling caveat for the guide.** 480–520 hours at typical partner rates is a six-figure engagement. That is an enterprise number and it is **not** sellable into a 25–300 seat business. The table below is the SMB-scaled version. The honest statement to make in the guide is: *this is the enterprise blueprint, here is what survives when you cut it to a company with one IT person and no compliance function.*

### 4.2 SMB-scaled engagement table (25–300 seats)

| # | Stage | Elapsed | Partner effort | Customer effort | Who | Tooling | Customer must provide | What goes wrong |
|---|---|---|---|---|---|---|---|---|
| 0 | **Pre-engagement qualification** | 1 wk **[E]** | 2–4 h **[E]** | 1 h | Account lead | Discovery call script; licence check | Tenant licence summary; named sponsor; sector; insurance renewal date | No executive sponsor → assessment lands with no budget behind it. Qualifying out is a valid outcome. |
| 1 | **Data collection / discovery** | 3–5 days elapsed, mostly unattended **[E]** | 8–14 h **[E]** | 2 h | M365/security engineer | ScubaGear; Secure Score; **DSPM for AI default + one custom assessment**; SAM Oversharing Baseline; PnP PowerShell; Graph **[S: tooling list]** | **Global Reader** at minimum **[S]**; Entra app registration if item-level scanning is needed **[S]**; existing DLP/label config | **DSPM timing traps: 4-day delay on first default assessment; ≥48 h wait after any run; custom results expire at 30 days; item-level capped at 10 SharePoint sites, SharePoint only, 200k items per location** **[S]**. Plan the calendar around these or the workshop slips. |
| 2 | **Analysis and scoring** | 4–5 days **[E]** | 12–20 h **[E]** | 0 | Assessment lead + compliance lead | Exported CSV/JSON from DSPM **[S]**; CIS v7.0.0 or SCuBA as the scoring frame; NIST AI RMF functions as report spine | Answers to ~10 clarifying questions | Scoring everything Red. Rank by *exploitability × sensitivity*, not raw counts. |
| 3 | **Findings workshop** | 1 session, 90–120 min **[E]** | 8–12 h incl. prep **[E]** | 3–6 people × 2 h | Assessment lead + sponsor | Slide pack + one-pager + live tenant demo | Sponsor, IT owner, one business owner, ideally the person who signs the insurance application | Presenting to IT only. The oversharing number has to land in front of whoever owns the risk. |
| 4 | **Remediation plan** | 3–5 days **[E]** | 6–10 h **[E]** | 2 h | Assessment lead | Risk register + roadmap templates | Prioritisation decisions; budget signal | Roadmap with no owners or dates. Every line needs a named owner and a target month. |
| 5 | **Remediation execution** | 3–8 weeks **[E]** | 25–70 h **[E]**, scaling with SharePoint sprawl | 5–15 h of site-owner time | Engineer + site owners | Restricted Content Discovery; **DSPM one-click policies** **[S]**; auto-labelling; SAM **Site Access Reviews** delegated to site owners **[S]**; retention for 3-yr-stale content **[S]** | Site owners who will actually do the reviews | **This is where the estimate breaks.** The 90%+ Yellow/Red rate on SharePoint permissions **[S]** means remediation, not assessment, is the real work. Price it separately or time-and-materials. |
| 6 | **Policy and governance stand-up** | Runs parallel to 5 **[E]** | 8–14 h **[E]** | 3 h | Compliance lead | AUP template; committee charter; RACI | Legal review sign-off; HR distribution channel | Partner drafting policy as if it were legal advice — see §5. |
| 7 | **Pilot enablement** | 4–6 weeks **[E]** | 12–20 h **[E]** | Champions ~2 h/wk | Change manager | Copilot Success Kit; Scenario Library **[S]** | 8–20 named pilot users incl. champions | Licences assigned to whoever asked loudest instead of to identified scenarios. |
| 8 | **Ongoing governance (recurring)** | Monthly + quarterly **[E]** | 4–8 h/month **[E]** | 1 h/month | Service delivery manager | Secure Score history; DSPM reports; Copilot usage report; audit log | Attendance at the quarterly review | Reporting metrics that never move. Rotate the focus metric each quarter. |

**Total for a well-run SMB engagement, stages 0–4: roughly 40–60 partner hours over 3–4 weeks [E]** — roughly one-tenth of the published enterprise blueprint, achieved by cutting network/app-version checkpoints (rarely blockers in an SMB), running one workshop instead of staged briefings, and relying on tool-generated output rather than bespoke analysis. Stages 5–7 are separately scoped.

`[MS-OFFICIAL]` Microsoft's own adoption framing for the back half is a **five-phase model — Plan, Implement, Adopt, Manage, Improve** — with a planning checklist covering executive sponsorship, a cross-functional team, champion identification, technical readiness, community nurturing and ongoing monitoring. Microsoft mandates **no fixed timeline**, and prefers on-demand and community-led training over a fixed cadence. Recurring **Service Health Reviews** bring leadership, technical staff and stakeholders together to review progress, risks and expansion.
https://adoption.microsoft.com/en-us/copilot/essential-guide/plan/ (fetched 28 Aug 2026)

---

## 5. Deliverables

### 5.1 The artefact set actually handed over

`[PARTNER-PUBLISHED]` The published 4-week blueprint hands over twelve numbered reports: licensing gap, identity readiness, SharePoint permissions audit (risk-ranked), data classification coverage (label adoption by department), DLP readiness, Purview integration assessment, network readiness, application readiness, governance framework gap analysis, regulatory compliance map, user readiness (AI literacy + champion nominations), and an executive readiness briefing with scoring matrix, deployment recommendation and budgeted remediation roadmap.
https://www.copilotconsulting.com/insights/copilot-readiness-assessment-program-blueprint

**SMB-appropriate consolidation [E].** Twelve documents is unmanageable for a 60-seat client. Collapse to six:

1. **Executive one-pager** — the readiness verdict (Go / Go-with-conditions / Remediate-first), three numbers (oversharing count, Secure Score, label coverage), three actions, cost.
2. **Assessment report** — structured on NIST AI RMF GOVERN/MAP/MEASURE/MANAGE, with a CIS v7.0.0 or SCuBA appendix showing per-control conformance.
3. **Risk register** — one row per finding: description, affected data, likelihood, impact, control mapping (CIS ID / AI RMF subcategory), owner, target date, status. This is the artefact insurers and auditors ask for by name.
4. **Remediation roadmap** — sequenced, owner-and-date bearing, split into "before Copilot licences are assigned" and "within 90 days."
5. **AI acceptable use policy** (see §6) plus a **data classification scheme** — for an SMB, three or four labels: Public / Internal / Confidential / Restricted. More than four fails.
6. **Governance operating model** — a one-page RACI and a short steering-committee charter.

### 5.2 Recurring artefacts

- **Monthly governance report** (2–3 pages, metrics in §8).
- **Quarterly steering committee pack** — trend lines, risk register movement, one decision to make.
- **Annual attestation letter** — a factual statement of controls implemented and dates, addressed to the client, useful for insurance applications and customer security questionnaires. `[E]` **Do not word it as an audit opinion or a certification.** It attests to what the partner configured and observed, nothing more.

### 5.3 Templates worth pointing partners at

| Artefact | Source | Tag | Note |
|---|---|---|---|
| AI acceptable use policy | ISACA, https://www.isaca.org/resources/artificial-intelligence-acceptable-use-policy-template | `[PRESS]` | Requires member login or registration form. |
| AI acceptable use policy | FRSecure, https://frsecure.com/ai-acceptable-use-policy-template/ | `[PRESS]` | Free. |
| AI acceptable use policy | Adelia Risk, https://adeliarisk.com/ai-acceptable-use-policy-template/ | `[PRESS]` | Free, editable. |
| Security policy library (36 templates) | SANS / Cybersecurity Risk Foundation, https://www.sans.org/information-security-policy/ | `[PRESS]` | Free. **Verified 28 Aug 2026: no AI-specific AUP template was visible in the library.** Do not cite "the SANS AI policy" — it does not appear to exist. |
| AI RMF Playbook (PDF/CSV/XLSX/JSON) | NIST AIRC, https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook | `[REGULATOR/STANDARD]` | Free; the best free basis for a risk register. |
| ScubaGear + M365 baselines | CISA, https://www.cisa.gov/resources-tools/services/m365-defender-office | `[REGULATOR/STANDARD]` | Free, no-cost assessment tool. |
| AI committee RACI matrix | OneTrust, https://www.onetrust.com/resources/ai-committee-raci-matrix-roles-rights-and-responsibilities-for-enterprise-ai-infographic/ | `[PRESS]` | Gated download. |
| Governance committee charter | Polygraf, https://polygraf.ai/ai-compliance-library/ai-governance-committee-charter-template/ | `[PRESS]` | Free; covers membership, decision rights by data tier, meeting cadence, quarterly reporting. |
| Governance charter, NIST/EU-mapped | TechJack, https://techjacksolutions.com/downloads/free-ai-governance-charter-template/ | `[PRESS]` | Free. |
| CIS M365 Foundations Benchmark v7.0.0 | CIS (registration required) | `[REGULATOR/STANDARD]` | Free to download after registration. |

`[UNVERIFIED]` The vendor charter/RACI templates above were identified via search-result summaries, not opened and read end-to-end. **Read each before recommending it in print.**

---

## 6. The AI acceptable use policy for a sub-100-person company

### 6.1 What belongs in it `[E]`, cross-checked against the insurer questions in §3.7

1. **Scope and definitions** — which tools, which people (including contractors), which data.
2. **The approved tool list** — named, with owner and review date. This is the item insurers probe hardest, and the one most likely to be fiction.
3. **A prohibited list** — consumer/free-tier tools, personal accounts, anything not on the approved list.
4. **Data rules bound to the classification scheme** — what may be pasted into what, expressed as "Restricted never leaves the tenant," not as prose.
5. **Human review and verification** — every AI output that reaches a client, a regulator or a court is verified by a named human. This is the line that carries ABA 512 and equivalent professional duties.
6. **Disclosure** — when the client, the counterparty or the employee must be told AI was involved. Anchor to Illinois HB 3773 for employment decisions and EU AI Act Article 50 where an EU consumer is on the other end.
7. **Prohibited use cases** — do not use AI as the sole basis for hiring, firing, promotion, discipline, credit or benefits decisions. This single clause keeps most SMBs out of Annex III, out of Colorado SB 26-189, and out of California's ADMT regime.
8. **Incident reporting** — what to do when sensitive data goes into the wrong tool, with a named contact and a deadline. Insurers ask about prior AI incidents; an SMB with no reporting route will answer that question wrongly and honestly.
9. **Monitoring notice** — that prompts and responses are logged and auditable (they are: unified audit log).
10. **Acknowledgment and training record** — signature/attestation with a date. **This is the artefact, not the policy text, that an insurer asks to see.**
11. **Review cadence** — annual minimum, plus on any new tool.

### 6.2 Positioning policy work without practising law `[E]`

`[UNVERIFIED]` I could not find published guidance from any bar association or MSP trade body specifically on where MSP compliance services cross into unauthorised practice of law. **Treat the following as reasoned practice guidance, not as a sourced rule, and have it reviewed by counsel before publication.**

The defensible posture:

- **Sell the control, not the conclusion.** "We configured DLP so labelled content is not processed by Copilot" is a technical statement. "You are HIPAA compliant" is a legal one. Never the second.
- **Ship a draft, not a final.** Deliver the AUP as a working draft explicitly for client counsel review, with a cover note saying so. Bill for the drafting effort, not for legal judgement.
- **Never opine on applicability.** Do not tell a client whether the EU AI Act, CCPA or Colorado law applies to it. Map controls to frameworks and let counsel decide scope. A control-to-framework map is engineering; an applicability determination is legal advice.
- **Keep an attorney in the referral network.** For clients in regulated sectors, co-deliver. The partner does the tenant, the lawyer does the applicability memo.
- **Watch the E&O policy wording.** Many MSP professional-liability policies exclude legal or compliance advisory services. Check before selling a "compliance" SKU under that name.

---

## 7. Change management and adoption, interlocked with governance

`[MS-OFFICIAL]` The **Copilot Success Kit** contains: Implementation Summary Guide for Leaders, User Enablement Guide, Technical Readiness Guide, adoption planning checklist, the interactive **Scenario Library**, user experience strategy guide, stakeholder engagement worksheet, licence allocation guide, engagement tools and templates, and digital swag.
https://adoption.microsoft.com/en-us/copilot/success-kit/ (fetched 28 Aug 2026)

`[PRESS]` A **Copilot Success Kit for SMB** is referenced as a reduced version covering the critical components, and a separate **Copilot Chat Success Kit** exists at https://adoption.microsoft.com/en-us/copilot-chat/success-kit/. `[UNVERIFIED]` The SMB variant's exact contents were not confirmed — the Success Kit page fetch did not surface a distinct SMB section. Verify before citing.

`[MS-OFFICIAL]` The **Microsoft 365 Champion Program** is a separate, external community resource rather than a kit component; Microsoft's planning checklist recommends identifying champions among willing early adopters in common departments. Training is framed as on-demand and community-led rather than a fixed cadence.
https://adoption.microsoft.com/en-us/copilot/essential-guide/plan/

### How the two workstreams interlock rather than compete `[E]`

The failure mode in SMB engagements is a sequential model — "governance first, adoption in six months" — which loses the client's attention, or its inverse, which produces the oversharing incident. The design that avoids both:

- **Gate licence assignment, not the engagement.** Copilot licences go to pilot users only after the *specific data* those users touch has been remediated. That is a narrow, achievable gate; tenant-wide remediation is not.
- **Make champions the remediation labour.** Site access reviews delegated to site owners `[S: SAM feature]` are exactly the people the champions programme recruits. One cohort, two jobs.
- **Run the pilot as the measurement instrument.** The pilot's audit log and DSPM output are the evidence base for the first quarterly governance report. Adoption generates the governance metrics.
- **Put both on one steering committee.** Separate governance and adoption committees in a 60-person company means the same four people meeting twice. One committee, two standing agenda items.

---

## 8. Measurement — what a partner can actually report monthly

All metrics below are obtainable from Microsoft's own reporting. Access requirements matter and are frequently the reason a promised metric does not appear.

`[MS-OFFICIAL]` **Role requirements:** **AI Administrator** for the M365 admin centre Copilot reports and for enabling/delegating the Copilot Dashboard; **Global Administrator** to assign the Insights Analyst and Insights Administrator roles; **Insights Analyst** for the Advanced Insights Analyst Workbench and Power BI templates; **Audit Reader** to search Purview audit logs; **Content Explorer Content Viewer** membership to see actual prompt and response text in DSPM activity detail.
https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-reports-for-admins (updated 18 Aug 2026) · https://learn.microsoft.com/en-us/purview/ai-m365-copilot

### Monthly pack `[E for the pack; each metric sourced]`

| Metric | Source | Reference |
|---|---|---|
| **Microsoft Secure Score** — current, delta, and improvement actions closed | Defender XDR; historical view for trend | `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score |
| **Oversharing counts** — items shared with anyone / everyone in org / externally, per site | DSPM data risk assessment **Monitor** tab | `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing |
| **Potentially overshared items** and remediation actions taken (resolved / labelled / notified / link removed) | DSPM custom assessment item-level tab | `[MS-OFFICIAL]` same |
| **Label coverage** — labelled vs unlabelled sensitive items; scanned vs unscanned | DSPM **Identify** tab; Purview content explorer | `[MS-OFFICIAL]` same |
| **DLP hits on the Copilot location** | Purview DLP, "Microsoft 365 Copilot and Copilot Chat" policy location | `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/purview/ai-m365-copilot |
| **Sanctioned vs shadow AI** — sensitive info shared with AI via network; endpoint DLP blocks on paste to third-party AI sites | DSPM one-click policy *Detect sensitive info shared with AI via network*; Endpoint DLP | `[MS-OFFICIAL]` same |
| **Risky AI usage / unethical interactions** — counts by severity | DSPM Reports > *Copilot experiences & agents*; Insider Risk *Risky AI usage* template | `[MS-OFFICIAL]` same |
| **Copilot readiness** — licence eligibility, app readiness, technical blockers | M365 admin centre > Reports > Usage > Microsoft Copilot > Readiness | `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-reports-for-admins |
| **Copilot usage** — active users, avg daily active, total prompts, prompts/user, active days, top agents; 7/30/90/180-day trend | M365 admin centre > Reports > Usage > Microsoft Copilot > Usage | `[MS-OFFICIAL]` same; https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-365-copilot-usage |
| **Adoption by app and feature; impact and sentiment** | Copilot Dashboard, Adoption and Impact tabs (Pulse/Glint sentiment; industry benchmarks) | `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-control-system/measurement-reporting |
| **Agent inventory and consumption** | Power Platform admin centre; Copilot Studio Analytics | `[MS-OFFICIAL]` same |
| **Risk register movement** — opened / closed / overdue | Partner's own register | `[E]` |

**Reporting cautions to put in the guide `[E]`:**
- Copilot usage per-user detail is **anonymised by default** in the admin centre; changing that is a tenant setting with employee-relations consequences. Do not flip it without written instruction.
- DSPM default assessments cover the **top 100 sites by usage** only — never present them as full-tenant coverage.
- Secure Score is a *relative* number affected by licence changes; a score that drops because a licence lapsed is not a governance failure, and the report must say so.
- Prompt-and-response text is visible only to Content Explorer Content Viewer members. Reading employee prompts is a decision for the client, in writing, and usually needs an HR and works-council conversation.

---

## 9. Open items to verify before publication

| Item | Why unresolved | Where to check |
|---|---|---|
| Current CISA SCuBA M365 baseline version and release date | cisa.gov returned 403 to automated fetch | cisa.gov/scuba; github.com/cisagov/ScubaGear releases |
| Whether the Microsoft "Solution Assessment" programme still exists under that name in FY27 | Programme appears folded into Accelerate/ABS engagements; gated content | Partner Center announcements 2026-07 / 2026-08; microsoftpartners.microsoft.com/abs/engagements |
| Current Accelerate funding bands for FY27 | Third-party summary only | Partner Center incentives pages |
| CMMC Phase 2 status after the July 2026 suspension | Task force review outcome not published in accessible sources | acq.osd.mil/cmmc |
| Real cyber-insurance AI questionnaire wording; the "81% of insurers" figure | Single vendor-blog source | Obtain a redacted 2026 renewal application from a broker |
| Contents of the SMB-specific Copilot Success Kit | Not visible on the Success Kit landing page | adoption.microsoft.com/copilot/success-kit |
| UPL boundary for MSP compliance/policy services | No bar-association or trade-body guidance located | Client counsel; state bar UPL committee guidance; MSP E&O policy wording |
| The 480–520-hour blueprint's provenance | Partner-published, no methodology stated for the "90%+ Yellow/Red" claim | Treat as illustrative; do not present as an industry benchmark |
