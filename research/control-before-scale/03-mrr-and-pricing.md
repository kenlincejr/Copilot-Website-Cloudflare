# The Money: Pricing, Packaging and Recurring Revenue for AI Governance in the SMB Channel

**Research dossier — "Control Before Scale" practice guide**
**Compiled:** 28 August 2026
**Audience:** Partner CXO building an AI governance / data security posture / Copilot readiness practice for 25–300 seat customers
**Scope:** What partners actually charge, what they actually earn recurring, what the published benchmarks say, and where the published record simply runs out.

---

## 0. How to read this dossier (and a warning about the evidence base)

Every figure below carries a tag:

| Tag | Meaning |
|---|---|
| `[SURVEY/BENCHMARK]` | Published, methodology-disclosed research over a population of firms |
| `[VENDOR]` | A vendor's or consultancy's own suggested/list pricing, or its content-marketing "guide" |
| `[VENDOR — RATE CARD]` | A specific price a specific firm publishes for its own service. Stronger than a "guide" |
| `[PRACTITIONER/COMMUNITY]` | Named practitioner, consultancy, or channel-media reporting of practice |
| `[ANECDOTE-SINGLE-SOURCE]` | One firm's claim about its own results |
| `[UNVERIFIED]` | Appeared in a search summary but I could not fetch and confirm the primary page |
| `[MODELLED]` | My own construction from cost inputs — not observed pricing |

**Three structural findings about the evidence itself, which matter more than any single number:**

**(1) There is no independent benchmark for governance-service pricing. None.** The most honest statement in the entire corpus comes from vCSO.ai's 2026 vCISO pricing benchmark, which is an aggregation of published provider list prices and states plainly in its methodology that all figures derive from "provider-published list prices, provider benchmarks, or named salary sources" and that **no independent invoice-level survey exists as of 2026** ([vcso.ai, 2026](https://vcso.ai/learn/vciso-pricing-benchmark-2026/)) `[VENDOR]`. That is the correct frame for everything that follows. There is excellent survey data on MSP *economics* (Kaseya, Service Leadership). There is essentially **zero** survey data on what an AI governance engagement sells for. What exists is list prices and vendor playbooks.

**(2) Reddit — the single richest vein of candid practitioner pricing talk — was inaccessible for this research.** r/msp is explicitly blocked to the crawler used here (both direct fetch and domain-restricted search return hard errors). Every "reddit" result returned by the search layer was in fact a vendor blog that had been surfaced by the query, not a forum thread. **I have therefore not cited a single Reddit figure, and this dossier's practitioner layer is weaker than the brief intended.** Any number in this document presented as community consensus would be fabricated. I have substituted named practitioner sources (CIAOPS, TruMethods, Technology Marketing Toolkit, ChannelE2E, Channel Insider) where possible. This gap is itself a finding: if you want real community pricing data, someone on your team has to go read r/msp, MSPGeek Slack and the Tech Tribe manually.

**(3) The vendor "guides" are heavily incestuous.** Nuronus's 2026 MSP compliance pricing guide and ScalePad's ControlMap Compliance-as-a-Service Bootcamp publish **identical** figures — the same $50–$150/user/month band, the same $3,000–$7,500 gap assessment, the same 15-seat worked example landing on $4,375/month MRC and $12,500 in project fees. Treat these as **one** source, not two. I have marked them accordingly.

---

## 1. Assessment and project pricing: what the market actually charges

### 1.1 The table

| Price point | Service | Seats / scope | Source & date | Type |
|---|---|---|---|---|
| **$5,000** | Microsoft Copilot Readiness Assessment | Explicitly **50 users**; includes data sanitisation, external access management, use-case development, governance frameworks and acceptable use policy | [F12.net](https://f12.net/services/microsoft-copilot-readiness-assessment/), accessed Aug 2026 | `[VENDOR — RATE CARD]` |
| **~$15,000** | Copilot Readiness Assessment, fixed fee, 2–3 weeks | Enterprise-leaning | EPC Group blog, via search summary Aug 2026 | `[VENDOR]` `[UNVERIFIED]` — see note below |
| **From $5,000** | "Get AI Ready: 2-Wk Microsoft Copilot Readiness Assessment" | Scoped after discovery | Noventiq/Softline, [Microsoft Marketplace](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/softlineholdingplc1652432925791.glb_copilotassessment) | `[VENDOR — RATE CARD]` `[UNVERIFIED]` |
| **$45,000** | "Microsoft 365 Copilot Data and Security Readiness: 4-Week Assessment" | 4 weeks | Spyglass MTG, [Microsoft Marketplace](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/spyglassmtgllc.copilotreadiness) | `[VENDOR — RATE CARD]` `[UNVERIFIED]` (page returned 403 on fetch) |
| **$50,000** | "M365 Modern Work Copilot Readiness Assessment", 6 weeks | Enterprise | Synergy Technical, [Microsoft Marketplace](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/synergytechnicalllc1600449890082.m365_modern_work_copilot_readiness_assessment) | `[VENDOR — RATE CARD]` `[UNVERIFIED]` |
| **$0** | "Copilot for M365 Launch — Free Readiness Assessment: 1-hr" | 1 hour | IT Partner 365, [Microsoft Marketplace](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/itpartner365-4100178.copilot_microsoft365_free_readiness_assessment) | `[VENDOR — RATE CARD]` |
| **$5,000–$15,000** (or **free** as an acquisition play) | AI Readiness Audit | SMB MSP program | [Cloudiway MSP AI Readiness Program](https://cloudiway.com/ai-readiness-msp-program/), 2026 | `[VENDOR]` |
| **$15,000–$40,000** | Risk remediation — "fix permissions & governance" | Follows the audit above | Cloudiway, as above | `[VENDOR]` |
| **$3,000–$15,000** | AI readiness assessment, SMB segment | SMB | [ConsultKit, 2026](https://www.consultkit.ai/blog/how-to-price-an-ai-readiness-assessment-what-the-market-actually-pays-in-2026-1773479248460) | `[VENDOR]` (aggregator) |
| **$1,500–$3,000** | "Discovery" tier — scorecard, 3–5 interviews, debrief, 1–2 weeks | Smallest viable paid assessment | ConsultKit, as above | `[VENDOR]` |
| **$2,000–$8,000** | AI readiness audit, "narrow SMB engagement" | SMB | Aries Consulting Group, 2026 | `[VENDOR]` `[UNVERIFIED]` |
| **$3,000–$7,500** | Initial compliance gap assessment | SMB MSP client | [Nuronus 2026](https://nuronus.com/blog/msp-compliance-pricing-guide-2026) / [ScalePad ControlMap](https://www.scalepad.com/controlmap/compliance-as-a-service-bootcamp/how-to-price-services/) — **same figures, count as one** | `[VENDOR]` |
| **$2,000–$5,000** | Policy and documentation development | Per framework | Nuronus / ScalePad, as above | `[VENDOR]` |
| **$5,000–$10,000** | Pre-audit preparation | Per audit cycle | Nuronus / ScalePad, as above | `[VENDOR]` |
| **$5,000–$15,000** | ISO 42001 gap analysis by external consultant | SMB AI management system | Multiple ISO 42001 cost guides, 2026 | `[VENDOR]` |
| **$15,000–$50,000** | Full ISO 42001 implementation, SMB | "depending on scope, maturity, number of AI systems in scope" | ISO 42001 cost guides, 2026 | `[VENDOR]` |
| **AUD $10,000–$50,000** | Essential Eight assessment (Australia) | SMB | [techassist.au](https://techassist.au/essential-eight-compliance-cost/), 2026 | `[VENDOR]` |
| **$40,000–$75,000** | "Big 4 equivalent assessment" | Comparison anchor only | EPC Group / Cloudiway marketing | `[VENDOR]` — competitive framing, not a partner price |
| **$350–$750/hour** | Big 4 consulting rate anchor | — | [EPC Group](https://www.epcgroup.net/blog/microsoft-copilot-consulting-cost-pricing) | `[VENDOR]` |
| **$150–$250/hour** | MSP project/professional services rate | Billed in advance | [Growth Generators 2026](https://www.growth-generators.com/post/the-complete-msp-pricing-guide-2026-benchmarks-models-and-tiers) | `[VENDOR]` |

**A caution on the EPC Group $15,000.** The search layer attributed a "$15,000 fixed-fee, 2–3 week" Copilot readiness assessment to EPC Group. When I fetched EPC Group's own Copilot consulting cost page directly, it states the readiness assessment is "**fixed fee, quoted after discovery (2 weeks)**" with **no published rate card**. The $15,000 may come from a different EPC page or may be a search-summary artefact. Treat it as indicative, not confirmed.

### 1.2 What the shape of that table tells you

**The market is bimodal, and the gap is the SMB opportunity.** There is a cluster at **$0–$5,000** (the SMB / lead-generation end) and a cluster at **$45,000–$50,000** (the enterprise Microsoft Marketplace listings). There is remarkably little published in the $10,000–$40,000 middle. For a 25–300 seat customer, only the lower cluster is relevant, and F12's **$5,000 for 50 users** is the single most useful data point in the corpus because it is a *published price against a stated seat count*. That is **$100 per seat, one time.**

**Per-seat is the honest unit for SMB assessment pricing.** Almost nobody publishes it that way, but F12's $5,000/50 seats gives a defensible anchor. If you hold $100/seat and floor it, a 60-seat customer is a $6,000 assessment and a 90-seat customer is $9,000 — which sits squarely inside ConsultKit's $5,000–$15,000 "Comprehensive" tier and Cloudiway's $5K–$15K audit band. **Three independent-ish sources converging on $5K–$15K for an SMB AI/Copilot readiness assessment is the strongest pricing signal in this entire dossier.**

### 1.3 Paid or loss-leader? The argument is live and the evidence cuts both ways

Robin Robins (Technology Marketing Toolkit) is the most-cited voice on the lead-generation side: **"security assessment is the number one lead generation offer right now for MSPs that is getting people in the door"** ([mspsuccess.com](https://mspsuccess.com/2023/04/it-state-of-the-industry/), 2023; her firm continued expanding compliance and co-managed offerings through 2026) `[PRACTITIONER/COMMUNITY]`.

The automation vendors have made the free assessment structurally cheaper. inforcer argues MSPs can offer framework-aligned M365 security assessments free "because they take minutes, not hours" ([inforcer](https://www.inforcer.com/insights/how-to-conduct-microsoft-365-security-assessments-for-msp-prospects)) `[VENDOR]`. Syncro and CyberDrain released **Snapshot**, a free Microsoft tenant security assessment for MSPs. Blacksmith Infosec publishes a free open-source 20-question risk assessment tool for MSPs and vCISOs. Cloudiway claims its platform cuts an audit from "8 days" to "**90 minutes**", with "**96% margins**" and "**60%+ remediation conversion**" `[ANECDOTE-SINGLE-SOURCE]` — these are unaudited vendor self-claims and should not be planned against.

The counter-argument is the sharpest practitioner point in the corpus, and it is about IP leakage rather than cost recovery:

> "If you don't charge for the assessment, then the client can grab your assessment report, thank you for all that free consultancy, and then go to another MSP and ask them for a cheaper quote to remediate the work."
> — [CloudBlue PSA](https://www.cloudbluepsa.com/blog/how-to-effectively-price-your-msp-contracts-using-assessments) `[PRACTITIONER/COMMUNITY]`

The same source describes the resolution most disciplined MSPs land on: **charge for the report, and credit the report fee against any remediation work the client subsequently commissions.** This is the single most transferable packaging mechanic in the dossier. It preserves the qualifying function of a price, protects the IP, and removes the buyer's objection.

**Synthesis:** free automated *scan* as a top-of-funnel object; **paid** assessment as the deliverable that contains judgement, roadmap and policy. The scan finds the oversharing; the assessment tells them what to do about it. Only the second one is worth money, and only the second one should be given a price.

---

## 2. Converting assessment into recurring governance MRR

### 2.1 The recurring pricing table

| Model | Figure | Basis / scope | Source & date | Type |
|---|---|---|---|---|
| **vCISO — Core security advisory** | **$1,000–$1,500 / client / month** | Annual assessment, quarterly reviews, basic policies, exec summary | [Cynomi, 2026](https://cynomi.com/blog/vciso-pricing-models-for-msps-how-to-price-security-advisory-services-in-2026/) | `[VENDOR]` |
| **vCISO — Full programme** | **$2,000–$3,500 / client / month** | Continuous posture tracking, multi-framework, risk register, QBR reporting | Cynomi, 2026 | `[VENDOR]` |
| **vCISO — Strategic advisory** | **$3,500–$5,000 / client / month** | Board reporting, BIA, vendor risk, IR planning | Cynomi, 2026 | `[VENDOR]` |
| **vCISO — SMB segment (50–200 employees)** | **$3,000–$7,000 / month** (SideChannel); **$4,000–$8,000 / month** (Zip Security) | Published list prices | [vcso.ai benchmark, 2026](https://vcso.ai/learn/vciso-pricing-benchmark-2026/) | `[VENDOR]` aggregation |
| **vCISO — startup / <50 employees** | **$1,500–$4,000 / month** | Published list prices | vcso.ai, 2026 | `[VENDOR]` |
| **vCISO — hourly advisory** | **$175–$600 / hour**; overages $250–$400/hr | — | vcso.ai, 2026 | `[VENDOR]` |
| **Compliance monitoring & maintenance** | **$50–$150 / user / month** | The core "compliance-as-a-service" band | Nuronus / ScalePad ControlMap (**one source**) | `[VENDOR]` |
| **HIPAA add-on** | **$15–$30 / user / month** | Layered over base support | Nuronus, 2026 | `[VENDOR]` |
| **PCI-DSS add-on** | **$10–$20 / user / month** | Quarterly vuln scanning | Nuronus, 2026 | `[VENDOR]` |
| **CMMC add-on** | **$30–$60 / user / month** | Defence supply chain | Nuronus, 2026 | `[VENDOR]` |
| **Audits & assessments folded into MRC** | **$500–$2,000 / month** | Instead of annual project billing | ScalePad ControlMap | `[VENDOR]` |
| **Incident response retainer** | **$500–$1,500 / month** | — | Nuronus / ScalePad | `[VENDOR]` |
| **Co-managed SIEM** | **$1,000–$5,000 / month** | By data/event volume | Nuronus / ScalePad | `[VENDOR]` |
| **AI governance premium add-on** | **AUD $1,500–$5,000 / month** (~USD $1,000–$3,300) | "premium add-on to existing GRC programmes, depending on scope" | [6clicks, 2026](https://www.6clicks.com/resources/blog/msps-ai-governance-as-a-service-2026) | `[VENDOR]` |
| **Essential Eight ML1 — fully productised** | **AUD $139 / user / month** (Fortress tier) | Full E8 Maturity Level 1 built into the managed plan | Otaris (AU), 2026 | `[VENDOR — RATE CARD]` |
| **Essential Eight ML2 / ML3** | **AUD $179 / $219 per user / month** (Knox / Titan tiers) | Framework maturity *is* the tier ladder | Otaris (AU), 2026 | `[VENDOR — RATE CARD]` |
| **Managed E8 entry point** | "from **AUD $250 / user / month**" | Managed model | Australian E8 pricing guides, 2026 | `[VENDOR]` `[UNVERIFIED]` |
| **Managed security generally** | **$50–$200+ / user / month** | Depending on scope and coverage depth | Meriplex 2026 | `[VENDOR]` |
| **Copilot adoption service** | **$30 / user / month**, framed against "users must save 30 min/week to break even" | Partner rate reference | Surfaced Aug 2026 | `[UNVERIFIED]` `[ANECDOTE-SINGLE-SOURCE]` |

### 2.2 The Otaris pattern is the most instructive thing in this table

Otaris (Australia) does not sell "compliance" as an add-on. It sells **three managed tiers whose defining difference is the Essential Eight maturity level they deliver**: Fortress = ML1 at $139/user/month, Knox = ML2 at $179, Titan = ML3 at $219 `[VENDOR — RATE CARD]`.

This is the good/better/best problem solved correctly. The uplift from ML1 to ML2 is **$40/user/month** and from ML2 to ML3 is a further **$40**. The customer is not buying "more security" — an unbounded, unfalsifiable thing they will resist paying more for. They are buying a **named external maturity level** that they can be asked about by an insurer, a prime contractor or a board. The framework does the selling, and the price ladder has a reason to exist.

Directly transferable to AI governance: the equivalent ladder is **NIST AI RMF / ISO 42001 alignment tiers**, or in the Microsoft stack, a **Purview posture ladder** (labelled → DLP-enforced → DSPM-for-AI monitored and attested).

### 2.3 The $50–$150/user/month compliance band — handle carefully

This band appears in the two sources that are actually one source (Nuronus / ScalePad ControlMap). It is the most-quoted number in MSP compliance content and it deserves scrutiny, because their own worked example does not survive contact with the SMB market:

> **15-seat client → $4,375/month MRC + $12,500 one-time project fees → ~$52,500 annual recurring**
> — ScalePad ControlMap, Compliance-as-a-Service Bootcamp `[VENDOR]`

$4,375 ÷ 15 seats = **$292 per seat per month for compliance alone**, on top of base managed services. Against the Kaseya finding that the largest single MRR segment is now **up to $1,000/month per client** (30% of MSPs), a 15-seat client paying $4,375/month for compliance is not a typical SMB engagement — it is a highly regulated outlier (the example bundles a $1,500/month SIEM). **Do not present this figure to a partner as an SMB benchmark.** The defensible reading of the same source is the per-user band's *lower half*: **$50–$80/user/month** for governance and compliance layered on standard managed services, with the $150 end reserved for regulated verticals.

### 2.4 Cynomi's conversion claims: useful, unaudited

Cynomi (a vCISO platform vendor, so directly interested) claims `[VENDOR]` `[ANECDOTE-SINGLE-SOURCE]`:

- **"Over 50% of assessment clients convert to vCISO engagements"**
- **40%** of providers see increased margins from vCISO services
- **70% reduction in assessment workload** through standardisation
- **81%** of vCISO providers already use AI/automation, with **68%** average workload reduction

And its revenue ladder: 10 clients at a mixed average of $2,000/month = **$20,000 MRR / $240,000 ARR**; 30 clients at $2,500 = **$75,000 MRR / $900,000 ARR**.

None of this is independently verified. The **structural** advice, however, is consistent with everything else in the corpus and is worth carrying: Cynomi's named pricing mistakes are *starting below $1,500/month* (which "positions services as a commodity"), *billing hourly instead of on retainer*, *offering a single price with no tiers*, and *discounting to win*.

### 2.5 The honest gap: nobody publishes AI-governance MRR at SMB scale

For a 60–90 seat customer, I found **exactly one** published AI-governance recurring price — 6clicks' AUD $1,500–$5,000/month, and 6clicks is a GRC platform vendor describing an add-on to an existing GRC programme, not an SMB MSP rate card. **There is no published per-seat AI governance MRR figure for the SMB market as of August 2026.** Anyone quoting one is extrapolating. This is a genuine white space — and, for a partner building a practice now, an argument for setting the price rather than discovering it.

---

## 3. Benchmarks: the ground the pricing sits on

This is where the evidence is genuinely strong, because two real surveys exist.

| Metric | Figure | Source & date | Type |
|---|---|---|---|
| **MSPs whose typical customer spends >$25,000/yr** | **41%**, down from **75%** the prior year | [Kaseya 2026 State of the MSP](https://pages.thechannelco.com/rs/329-KEI-124/images/Asset-1-Kaseya-2026-State-of-the-MSP-Report-2026.pdf), n>1,000 MSPs | `[SURVEY/BENCHMARK]` |
| **Largest average-MRR-per-client segment** | **Up to $1,000/month — 30%** of MSPs, up from 24% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs reporting $7,501–$10,000 MRR/client** | **6%**, doubled YoY | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs not profitable** | **10%**, doubled from 5% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs at 16–20% net profit** | **18%**, up from 15% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs above 30% net profit** | **15%** (from 16%) | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **Security as a top-3 revenue source** | **52%** of MSPs (2nd only to endpoint/network at 64%) | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **Regulatory compliance & reporting as a top-3 revenue source** | **8%** | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **AI & automation as a top-3 revenue source** | **13%** | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs offering AI/automation services** | **38%** (vs backup 79%, endpoint 73%, security 72%, compliance 42%) | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs reporting YoY cybersecurity revenue growth** | **71%** — highest of any category | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs reporting YoY BCDR revenue growth** | **50%** | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **Clients naming AI & automation their #1 need for 2026** | **48%** — ahead of security (42%) and backup (36%) | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs who are their clients' primary cybersecurity advisor** | **61%** ("most or all" clients) | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs citing difficulty demonstrating value quickly** | **19%**, nearly doubled from 10% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs citing difficulty hiring cyber staff** | **39%**, up from 29% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs citing security product complexity as a barrier** | ~**50%**, up from 38% | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **MSPs saying compliance audit readiness improved from automation** | **16%** — near the bottom of the KPI list | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **New clients that are competitive takeaways** | **33%** mostly switching; only **12%** first-time MSP users | Kaseya 2026 | `[SURVEY/BENCHMARK]` |
| **Best-in-class adjusted EBITDA** | **19%+ for a sixth consecutive year** | [Service Leadership / ConnectWise, Jun 2026](https://www.globenewswire.com/news-release/2026/06/23/3316157/0/en/service-leadership-report-reveals-historic-growth-for-it-solution-providers-and-the-operational-factors-defining-this-economic-shift.html) | `[SURVEY/BENCHMARK]` |
| **Top-quartile managed IT adj. EBITDA vs median** | **20.6%** vs **8.7%** (2024) | Service Leadership, Jun 2026 | `[SURVEY/BENCHMARK]` |
| **MSP total revenue growth** | **9.6%**, up from 7.1%; adj. EBITDA grew **17.1%** | Service Leadership, Jun 2026 | `[SURVEY/BENCHMARK]` |
| **Q4 2024 average MSP adjusted EBITDA** | **11.1%**; **18%** of MSPs reported a loss | [Service Leadership, Feb 2025](https://www.connectwise.com/company/press/releases/service-leadership-index-q4-data) | `[SURVEY/BENCHMARK]` |
| **Managed services as share of MSP revenue** | **44%**, up from 34% | [Barracuda, Evolving Landscape of the MSP Business 2024](https://assets.barracuda.com/assets/docs/dms/bmsp-rp-evolving-landscape-of-the-msp-business-2024.pdf) | `[SURVEY/BENCHMARK]` |
| **Orgs ≤2,000 employees relying on MSPs for security** | **73%** | [Barracuda MSP Customer Insight Report 2025](https://assets.barracuda.com/assets/docs/dms/msp-customer-insight-report-2025.pdf), Vanson Bourne, n=2,000, Apr–May 2025 | `[SURVEY/BENCHMARK]` |
| **SMBs wanting MSPs to manage security tool sprawl** | **52%**; **51%** want strategy evolution | Barracuda 2025 | `[SURVEY/BENCHMARK]` |
| **Average MSP all-in seat price** | **under $100/seat**; TruPeer members 20–30% above average | TruMethods / Gary Pica | `[PRACTITIONER/COMMUNITY]` |
| **Gary Pica's stated seat-price targets** | Formerly **$150/seat**; more recently **$300/seat** as "the new standard" | TruMethods / SmarterMSP | `[PRACTITIONER/COMMUNITY]` |
| **All-in per-user pricing tiers** | Bronze $75–125 / Silver $125–200 / Gold $200–400 per user/month | [Growth Generators 2026](https://www.growth-generators.com/post/the-complete-msp-pricing-guide-2026-benchmarks-models-and-tiers) — self-described "community of 400+ MSPs", **no third-party sourcing** | `[VENDOR]` |
| **Security stack cost before margin** | **$20–$37 per endpoint/month** | [Flamingo 2026](https://www.flamingo.run/blog/msp-security-stack) | `[VENDOR]` |
| **Component costs** | EDR+managed SOC $5–12; co-managed SIEM $4–12; MFA/identity $3–6; DNS filtering $1–2; BCDR+M365 backup $5–10; patch/vuln $2–4 (per endpoint/month) | Flamingo 2026 | `[VENDOR]` |
| **Margin floor on the security stack** | "Margins below **30%** on this stack rarely survive a mid-year price hike from one vendor" | Flamingo 2026 | `[VENDOR]` |
| **Duplicate spend found in stack audits** | **$3–$5 per endpoint/month** | Flamingo 2026 | `[VENDOR]` |
| **Recommended markup on true delivery cost** | **60–100%** | Growth Generators 2026 | `[VENDOR]` |

### 3.1 The two numbers a partner CXO must internalise

**Deal sizes collapsed and the recurring floor dropped.** Kaseya's finding that customers spending >$25,000/year fell from **75% to 41%** in a single year, while the *largest* MRR band is now **up to $1,000/month per client**, is the most consequential fact in this dossier. It means the AI governance offer cannot be priced as an enterprise consulting engagement bolted onto an SMB. A $45,000 Copilot readiness assessment (Spyglass, Synergy) is priced for a customer that no longer exists in the SMB channel.

**The AI revenue gap is the whole opportunity.** **48%** of MSPs say AI/automation is their clients' number-one need, **38%** of MSPs offer AI services, but only **13%** count AI as a meaningful revenue source. Kaseya's own reading: "many providers are still defining, packaging and pricing these services." That is a 35-point gap between demand and monetisation, and it is a packaging failure, not a demand failure. ChannelE2E's channel brief reaches the same conclusion from the other direction — that MSPs are "all in on AI" and "the revenue still hasn't followed", and that the risk is "folding unlimited AI into a fixed-price plan before the costs are predictable", which is "a good way to lose margin quietly, month after month" ([ChannelE2E, 2026](https://www.channele2e.com/news/channel-brief-msps-are-all-in-on-ai-the-revenue-still-hasnt-followed-1)) `[PRACTITIONER/COMMUNITY]`.

**Governance is not yet a revenue line for most MSPs.** Only **8%** name regulatory compliance and reporting as a top-3 revenue source, and only **16%** report that automation improved their compliance audit readiness. Compliance is delivered by 42% and monetised by 8%. That asymmetry is precisely the "one-and-done assessment trap" showing up in survey data.

---

## 4. Packaging patterns with evidence behind them

### 4.1 Land-and-expand: the published sequence

Cloudiway publishes the full four-stage ladder `[VENDOR]`:

**Audit ($5K–$15K, or free for acquisition) → Risk remediation, "fix permissions & governance" ($15K–$40K) → Copilot deployment (recurring licences + change management) → Managed services (ongoing monitoring & governance)**, claiming **$50K–$100K+ total revenue per client**.

The same shape appears in the Microsoft/a competing distributor partner motion, phrased as a lifecycle: **Assess → Activate → Adopt → Optimise & Govern → Extend with Agents**. a competing distributor announced a relationship with **inforcer** on **9 June 2026** specifically productising *Copilot Readiness Assessments*, a *Copilot Manager* for governing deployments, and **shadow AI detection** across customer tenants ([a competing distributor]([competitor source withheld])) `[VENDOR]`. inforcer reports 1,200+ MSP partners with 100+ joining monthly. **No pricing, margin or market-size figures were disclosed in that announcement** — worth stating, because the vendor-side productisation of this exact offer is running well ahead of any published economics for it.

For a 60–90 seat customer, the Cloudiway ladder needs deflating by roughly a factor of two to three: a $15K–$40K remediation project is a *very* large ask against a client whose entire managed-services spend may be $10K–$25K/year.

### 4.2 Tie the MRR to an external framework — the strongest pattern in the evidence

The Otaris E8 tier ladder (§2.2) is the proof. So is the Nuronus framework-specific add-on structure (HIPAA $15–30, PCI $10–20, CMMC $30–60 per user/month) — every one of those add-ons exists because someone *outside* the relationship demands it.

Robert Crane (CIAOPS), writing 11 August 2026, frames the distinction that makes this saleable in an AI context:

> "Security keeps the bad guys out. Compliance stops the good guys doing the wrong thing."
> — [CIAOPS, 11 Aug 2026](https://blog.ciaops.com/2026/08/11/security-keeps-the-bad-guys-out-compliance-stops-the-good-guys-doing-the-wrong-thing/) `[PRACTITIONER/COMMUNITY]`

Crane's related posts — *AI Governance Starts Before Copilot Does* (21 Jul 2026) and *Data Governance Is the Real Copilot Readiness Test* (27 Aug 2026) — make the partner-side argument explicitly: data governance is "a pathway into security baselines, identity protection, information protection, SharePoint reviews and policy clean-up", positioning Copilot as "part of a broader maturity journey rather than just another licence to sell." The opportunity he names is a partner saying: *"Before we deploy Copilot broadly, let's make sure your Microsoft 365 environment is in reasonable shape."*

Candidate anchors for an SMB AI governance tier, ranked by how likely an SMB is to actually be asked for evidence: **cyber insurance questionnaires** and **customer/prime-contractor security questionnaires** (highest — these bite at 60 seats), then **Essential Eight / CIS Controls** (regional), then **NIST AI RMF** (useful vocabulary, no enforcement), then **ISO 42001** (real but expensive — $15K–$50K SMB implementation, out of reach for most sub-100-seat firms), then **EU AI Act** (only if the customer has EU exposure). CMMC is the highest-value anchor of all ($30–$60/user/month add-on) but only for the defence supply chain.

### 4.3 Fold the recurring assessment *into* the MRC

ScalePad's structure includes a line most MSPs miss: **"Audits & assessments: $500–$2,000/month if included in MRC"** `[VENDOR]`. This is the direct structural antidote to the one-and-done trap. Rather than selling an annual assessment as a project the client may decline next year, the reassessment is a monthly line item and the deliverable is a **quarterly attestation report**. ConnectSecure describes the same tier logic — basic (monthly scan, quarterly report, one framework) / professional (bi-weekly scan, monthly report, remediation guidance, few frameworks) / premium (continuous monitoring, automated remediation recommendations, audit prep, multiple frameworks) — and recommends **annual contracts with monthly payment terms** ([ConnectSecure](https://connectsecure.com/blog/compliance-as-a-service-for-msps-how-to-drive-predictable-revenue)) `[VENDOR]`. Note that ConnectSecure publishes **no** actual prices; it is a tier-structure source only.

### 4.4 Co-terming with the M365 renewal

I searched for evidence on co-terming governance MRR with the CSP/M365 renewal and **found none published**. This is a genuine data gap. The mechanic is sound and widely practised anecdotally, but no source in this corpus documents minimum-commitment terms, co-term rates, or renewal-attach figures for governance services. Report it as a recommendation, not as an observed pattern.

---

## 5. What partners get wrong

The candid post-mortem literature is thinner than the brief hoped — largely because r/msp was inaccessible. What follows is drawn from named sources.

**Underpricing that quietly destroys the contract.** ScopeStack's worked example is the clearest published illustration: an MSP wins a **100-seat contract at $95/endpoint/month** while true delivery cost runs **$115/endpoint** — a **$20/endpoint/month loss, $24,000/year on one contract** ([ScopeStack](https://scopestack.io/blog/the-hidden-costs-of-underpricing-how-msps-can-avoid-profit-erosion)) `[VENDOR]`. Cross-check that against Flamingo's **$20–$37/endpoint/month security stack cost before margin**: if you are selling all-in at $95–$125 and your security stack alone is $37, the governance layer has no room in the price. **Governance MRR must be priced as an increment, never absorbed.**

**Giving away the remediation.** Covered in §1.3. The report walks; the remediation gets re-bid; the MSP funded a competitor's proposal.

**Selling fear rather than enablement.** Cynomi's *Stop Selling Fear* and N-able's *Selling Security Without Fear* both describe the same failure mode and the same client objection — *"You're just trying to scare me into buying more services."* The consequential argument is commercial, not ethical: **fear-based selling caps pricing power.** A client buying "minimum viable protection" treats the service as a cost centre and negotiates hard; a client buying an outcome (a passed insurance questionnaire, a won contract, safely-enabled Copilot) does not. For AI governance specifically this is decisive — the buyer *wants* Copilot. Governance sold as the thing that lets them turn it on is an enabler; governance sold as the thing that stops them is a tax.

**Failing to build delivery repeatability.** ProVal Technologies states the mechanic plainly: the first client's AI governance framework "takes real effort — developing the policies, configuring the controls, building training materials, establishing the review cadence"; the second deployment reuses most of it, turning "a custom engagement into a structured, repeatable service" ([ProVal](https://www.provaltech.com/blog/ai-governance-playbook-for-msps-policies-every-client-should-have/)) `[PRACTITIONER/COMMUNITY]`. Kaseya's data shows why this is now urgent rather than optional: **39%** of MSPs can't hire cyber staff (up from 29%), ~**50%** cite product complexity (up from 38%), and only **16%** report automation improving compliance audit readiness. Nuronus adds the human cost: "pricing compliance like a commodity add-on burns out the team fast."

**The value-proof gap.** The share of MSPs unable to quickly demonstrate value **nearly doubled, 10% → 19%** (Kaseya 2026), while difficulty maintaining consistent client documentation rose 10% → 17%. With **33%** of new clients being competitive takeaways, an attestation-style quarterly governance report is not overhead — it is the retention artefact.

---

## 6. AI-specific: what the new offers command

**The category is real and the pricing is not yet published.** What exists:

- **AI governance as a premium add-on: AUD $1,500–$5,000/month** (6clicks, 2026) `[VENDOR]` — the only published recurring AI-governance figure I could find, and it is framed as an add-on to an existing GRC programme, not an SMB MSP rate.
- **AI readiness assessment, SMB: $3,000–$15,000** (ConsultKit), **$2,000–$8,000** (Aries), **$5,000–$15,000** (Cloudiway), **$5,000 at 50 seats** (F12, rate card). Convergent.
- **AI acceptable use policy** is universally described as *part of* a governance package, never separately priced. F12 bundles "governance frameworks and acceptable use policies" into its $5,000 assessment.
- **Shadow AI assessment** is now a productised vendor capability (a distributor-packaged readiness capability, June 2026; Acronis GenAI Protection) but **no partner publishes a price for it.** Search summaries indicated most managed-AI providers "price per scope rather than publishing flat rates", with readiness assessments ranging "free to a few thousand dollars" `[UNVERIFIED]`.
- **Copilot adoption / change management:** one **$30/user/month** reference, justified by "users need to save 30 minutes per week to break even" `[UNVERIFIED]` `[ANECDOTE-SINGLE-SOURCE]`. Note this exactly equals the M365 Copilot licence price — an elegant framing (services at 1× licence) but a single unconfirmed sighting. Microsoft has **increased standard partner margin for M365 Copilot Business and eligible M365 Business bundles** (a competing distributor, 2026) but the delta is not published in the sources I reached.
- **ISO 42001** as an AI governance anchor: gap analysis **$5,000–$15,000**, SMB implementation **$15,000–$50,000**, GRC platform ISO 42001 modules **$7,500–$10,000/year** `[VENDOR]`. For 25–300 seats this is mostly aspirational; use NIST AI RMF vocabulary and insurance/customer questionnaires as the practical driver instead.

**ConsultKit's conversion economics are worth carrying with a health warning** `[VENDOR]`: tiered models are claimed to convert **35–40% better** than standalone hourly proposals; industry specialisation commands a **20–30% premium**; top independents achieve **$350–$500/hour effective** on assessment work; and the assessment-to-implementation multiplier is illustrated as a $10K assessment converting to a $150K project (**15×**). Those last two are enterprise-scale and should be deflated hard for SMB; the 20–30% specialisation premium is the most portable claim.

---

## 7. Deal-shape realism for a 60–90 seat customer

**This section is `[MODELLED]`.** No published source gives an SMB AI-governance deal shape at this seat count. What follows is built from the sourced inputs above and labelled as construction.

### 7.1 What they will realistically pay

**Assessment: $5,000–$9,000.** Anchored on F12's published **$100/seat at 50 seats** `[VENDOR — RATE CARD]`, cross-checked against Cloudiway's $5K–$15K and ConsultKit's $5K–$15K "Comprehensive" tier. Below $4,000 you cannot deliver judgement, only a scan. Above $12,000 you are competing with the customer's instinct to defer Copilot entirely. Credit the fee against remediation.

**Remediation project: $8,000–$20,000.** Cloudiway's $15K–$40K deflated for seat count. At 60–90 seats the work is real — SharePoint permission and oversharing remediation, sensitivity label design and rollout, DLP policy, Entra conditional access hardening, retention — but it is weeks, not months.

**Governance MRR: $1,200–$2,700/month.** Two routes to the same landing zone, which is why I have moderate confidence in it:

- *Per-seat route:* the defensible lower half of the $50–$150/user/month compliance band, taken as a **$20–$30/user/month governance increment** over an existing managed-services seat price — 60 seats × $25 = **$1,500/month**; 90 × $25 = **$2,250/month**.
- *Retainer route:* Cynomi's **Core ($1,000–$1,500)** to **Full ($2,000–$3,500)** vCISO tiers; vcso.ai's SMB band starts at **$3,000** but that is a pure-play vCISO price for a security-first buyer, not a governance increment on an MSP contract.

**Against the Kaseya reality check:** the largest MRR-per-client band is now **up to $1,000/month**, and only **6%** of MSPs get $7,501–$10,000. A 60–90 seat customer at, say, $130/user all-in is a $7,800–$11,700/month account — top-decile in the Kaseya distribution. **A $1,500–$2,250/month governance uplift is therefore a 15–25% increase on an already-large SMB account.** It is achievable, but only with an external framework driving it (§4.2), and it will not be achieved with a fear pitch.

### 7.2 What delivery costs you

`[MODELLED]` from published rate inputs:

- **Assessment:** 20–30 hours of senior time. At a $150–$250/hour published MSP project rate as a proxy for loaded cost-plus, that is roughly **$1,800–$3,500 of internal cost** if you are running a productised, tool-assisted process — implying **55–70% gross margin at a $6,000 price**. Cloudiway's "96% margin, 90-minute audit" claim is a vendor's best case and should not be planned against; but "8 days manual" is equally the wrong planning number once the second delivery reuses the first one's templates.
- **Ongoing governance:** budget **2–4 hours/month** of senior delivery plus tooling. At a fully loaded $100–$120/hour that is **$200–$500/month of labour**, plus per-seat tooling. Purview capability at the depth this offer needs generally implies **E5 or E5 Compliance** licensing on the customer side (Microsoft states the new DSPM experience is available to M365 E5 and E5 Compliance customers) — a licensing uplift that must be surfaced early or it will detonate the deal mid-delivery.
- **Margin floor:** apply Flamingo's rule — **below 30% on the stack, one vendor price rise erases the line**. Target 60%+ gross on governance MRR, which the labour numbers above support at $1,500/month.

### 7.3 The shape that holds together

**$6,000 assessment (credited) → $12,000 remediation → $1,800/month managed governance on a 12-month term, co-termed with the M365 renewal.** Year one ≈ **$33,600**; steady state **$21,600/year recurring**. That converts an SMB customer from Kaseya's shrinking >$25K band into a durable account, and it does so on numbers every component of which traces to a published source.

---

## 8. Where the data does not exist — stated plainly

1. **No independent, invoice-level survey of governance or vCISO pricing exists** as of 2026. vcso.ai says so in its own methodology. Every recurring figure in §2 is a list price or a vendor playbook.
2. **No published per-seat AI-governance MRR for the SMB market.** One AUD-denominated GRC add-on range is the entire published record.
3. **No published shadow-AI assessment price.** The capability is productised (inforcer/a competing distributor, June 2026); the price is not public.
4. **No published data on co-terming governance MRR with M365/CSP renewals**, minimum commitment terms, or renewal-attach rates.
5. **No survey data on assessment-to-managed-services conversion rates** from a neutral source. Cynomi says >50%, Cloudiway says >60% remediation conversion; both sell the tooling.
6. **Reddit/r/msp and MSP forum threads were inaccessible to this research.** The practitioner layer here is thinner than it should be and must be supplemented manually.
7. **Kaseya's Figure 18 (revenue growth by service line)** shows compliance management growing materially more slowly than security (71%) and BCDR (50%); the exact compliance figure could not be reliably mapped from the extracted PDF layout and is therefore not cited.

---

## Source list

- Kaseya, *2026 State of the MSP Report* (n>1,000 MSPs) — [PDF](https://pages.thechannelco.com/rs/329-KEI-124/images/Asset-1-Kaseya-2026-State-of-the-MSP-Report-2026.pdf) — `[SURVEY/BENCHMARK]`
- Service Leadership / ConnectWise, annual profitability report, [June 2026](https://www.globenewswire.com/news-release/2026/06/23/3316157/0/en/service-leadership-report-reveals-historic-growth-for-it-solution-providers-and-the-operational-factors-defining-this-economic-shift.html) and [Q4 index, Feb 2025](https://www.connectwise.com/company/press/releases/service-leadership-index-q4-data) — `[SURVEY/BENCHMARK]`
- Barracuda, [*MSP Customer Insight Report 2025*](https://assets.barracuda.com/assets/docs/dms/msp-customer-insight-report-2025.pdf) (Vanson Bourne, n=2,000, Apr–May 2025) and [*Evolving Landscape of the MSP Business 2024*](https://assets.barracuda.com/assets/docs/dms/bmsp-rp-evolving-landscape-of-the-msp-business-2024.pdf) — `[SURVEY/BENCHMARK]`
- [vCSO.ai 2026 vCISO Pricing Benchmark](https://vcso.ai/learn/vciso-pricing-benchmark-2026/) — `[VENDOR]` aggregation with explicit methodology caveat
- [Cynomi, vCISO Pricing Models for MSPs 2026](https://cynomi.com/blog/vciso-pricing-models-for-msps-how-to-price-security-advisory-services-in-2026/) and [Stop Selling Fear](https://cynomi.com/blog/stop-selling-fear-the-msps-guide-to-scaling-security-services/) — `[VENDOR]`
- [ScalePad ControlMap, Compliance-as-a-Service Bootcamp: How to Price Your Services](https://www.scalepad.com/controlmap/compliance-as-a-service-bootcamp/how-to-price-services/) and [Nuronus 2026 MSP Compliance Pricing Guide](https://nuronus.com/blog/msp-compliance-pricing-guide-2026) — **same figures, one source** — `[VENDOR]`
- [F12.net Microsoft Copilot Readiness Assessment](https://f12.net/services/microsoft-copilot-readiness-assessment/) — $5,000 / 50 users — `[VENDOR — RATE CARD]`
- Microsoft Marketplace consulting-service listings: [Spyglass MTG $45k](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/spyglassmtgllc.copilotreadiness), [Synergy Technical $50k](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/synergytechnicalllc1600449890082.m365_modern_work_copilot_readiness_assessment), [Noventiq from $5k](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/softlineholdingplc1652432925791.glb_copilotassessment), [IT Partner 365 free](https://marketplace.microsoft.com/en-us/marketplace/consulting-services/itpartner365-4100178.copilot_microsoft365_free_readiness_assessment) — `[VENDOR — RATE CARD]`
- [Cloudiway MSP AI Readiness Partner Program](https://cloudiway.com/ai-readiness-msp-program/) — `[VENDOR]` / `[ANECDOTE-SINGLE-SOURCE]`
- [ConsultKit, How to Price an AI Readiness Assessment (2026)](https://www.consultkit.ai/blog/how-to-price-an-ai-readiness-assessment-what-the-market-actually-pays-in-2026-1773479248460) — `[VENDOR]`
- [6clicks, Why MSPs should offer AI governance as a service in 2026](https://www.6clicks.com/resources/blog/msps-ai-governance-as-a-service-2026) — `[VENDOR]`
- [Flamingo, MSP Security Stack 2026](https://www.flamingo.run/blog/msp-security-stack) and [MSP Pricing Models 2026](https://www.flamingo.run/blog/msp-pricing-models) — `[VENDOR]`
- [Growth Generators, Complete MSP Pricing Guide 2026](https://www.growth-generators.com/post/the-complete-msp-pricing-guide-2026-benchmarks-models-and-tiers) — `[VENDOR]`, self-reported community data
- [ScopeStack, The Hidden Costs of Underpricing](https://scopestack.io/blog/the-hidden-costs-of-underpricing-how-msps-can-avoid-profit-erosion) — `[VENDOR]`
- [CloudBlue PSA, How to effectively price your MSP contracts using assessments](https://www.cloudbluepsa.com/blog/how-to-effectively-price-your-msp-contracts-using-assessments) — `[PRACTITIONER/COMMUNITY]`
- CIAOPS (Robert Crane): [Data Governance Is the Real Copilot Readiness Test, 27 Aug 2026](https://blog.ciaops.com/2026/08/27/data-governance-is-the-real-copilot-readiness-test/); [AI Governance Starts Before Copilot Does, 21 Jul 2026](https://blog.ciaops.com/2026/07/21/ai-governance-starts-before-copilot-does/); [Security Keeps the Bad Guys Out…, 11 Aug 2026](https://blog.ciaops.com/2026/08/11/security-keeps-the-bad-guys-out-compliance-stops-the-good-guys-doing-the-wrong-thing/); [Purview DSPM for AI in SMBs, 1 Oct 2025](https://blog.ciaops.com/2025/10/01/microsoft-purview-dspm-for-ai-in-smbs/) — `[PRACTITIONER/COMMUNITY]`
- [ChannelE2E: AI-native is the new pitch / MSPs are all in on AI, the revenue still hasn't followed](https://www.channele2e.com/news/channel-brief-msps-are-all-in-on-ai-the-revenue-still-hasnt-followed-1) — `[PRACTITIONER/COMMUNITY]`
- [Channel Insider, 'AI Readiness' Is the New MSP Differentiator](https://www.channelinsider.com/a/artificial-intelligence/ai-readiness-is-the-new-msp-differentiator/) — `[PRACTITIONER/COMMUNITY]` (no pricing)
- [ProVal Technologies, AI Governance Playbook for MSPs](https://www.provaltech.com/blog/ai-governance-playbook-for-msps-policies-every-client-should-have/) — `[PRACTITIONER/COMMUNITY]`
- [ConnectSecure, Compliance as a Service for MSPs](https://connectsecure.com/blog/compliance-as-a-service-for-msps-how-to-drive-predictable-revenue) — `[VENDOR]`, tiers only, no prices
- [inforcer, How to Conduct M365 Security Assessments for MSP Prospects](https://www.inforcer.com/insights/how-to-conduct-microsoft-365-security-assessments-for-msp-prospects) — `[VENDOR]`
- TruMethods / Gary Pica via [SmarterMSP](https://smartermsp.com/msp-pricing-models/) and [MSP Success](https://mspsuccess.com/2025/02/stop-racing-to-the-bottom-strategies-to-elevate-msp-pricing-and-value/) — `[PRACTITIONER/COMMUNITY]`
- Robin Robins / Technology Marketing Toolkit via [MSP Success, State of the Industry](https://mspsuccess.com/2023/04/it-state-of-the-industry/) — `[PRACTITIONER/COMMUNITY]`
- [N-able, Selling Security Without Fear](https://www.n-able.com/blog/selling-security-without-fear-how-msps-can-use-risk-conversations-to-build-trust-and-drive-value) — `[VENDOR]`
- [EPC Group, Microsoft Copilot Consulting Cost](https://www.epcgroup.net/blog/microsoft-copilot-consulting-cost-pricing) — `[VENDOR]`
- [Meriplex, Managed Security Services Cost 2026](https://meriplex.com/managed-security-services-cost-2026/) — `[VENDOR]`
- Otaris (AU) Essential Eight tier pricing; [techassist.au Essential Eight Compliance Cost](https://techassist.au/essential-eight-compliance-cost/) — `[VENDOR — RATE CARD]` / `[VENDOR]`
- [Microsoft Learn, Purview DSPM for AI](https://learn.microsoft.com/en-us/purview/data-security-posture-management-learn-about) — `[VENDOR]` (licensing)
