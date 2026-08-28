# The Microsoft Partner Program Universe: Where MAICPP Actually Sits

**Research dossier — 05 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026. Fiscal context: Microsoft FY27 began 1 July 2026.

Tag legend: `[MS-OFFICIAL]` = learn.microsoft.com / partner.microsoft.com / Microsoft-authored, with URL and date · `[CHANNEL-PRESS]` · `[COMMUNITY]` · `[UNVERIFIED]`.

---

## 0. The headline structural finding

**MAICPP is not the umbrella for everything.** Microsoft's documentation supports a three-layer model that Microsoft itself never draws:

1. **MAICPP** = the *membership/credential* program (identity, agreement, designations, specializations, benefits packages). It is the **gateway**, not the container.
2. **Transaction authorizations** (CSP, Marketplace publishing, EA/MCA-E) = **separate programs with separate agreements** that *require* MAICPP membership as a precondition but are **not governed by it**.
3. **Incentives/GTM** (MCI, co-sell, growth margins) = **conditional layers** requiring *both* MAICPP attainment (designations) *and* a transaction authorization.

The decisive citation is in the MAICPP Agreement itself [MS-OFFICIAL, MAICPP Agreement, March 2024 version via lawinsider.com/contracts/6TYPRiCPTpx]:

> "Participating in the MAICPP may be an eligibility requirement to participate in other Microsoft programs… but this Agreement does not alter, amend, or modify the terms of any such program. In the event of a conflict… the terms of the separate program or agreement govern such program."

That is Microsoft explicitly stating MAICPP is a **prerequisite, not a parent**. It is the single most useful sentence for answering a partner's "how does this all fit together" question.

---

## 1. Structural diagram

```
                    MICROSOFT ENTRA ID WORK ACCOUNT / TENANT
                                    │
                    ┌───────────────┴───────────────┐
                    │   PARTNER CENTER ACCOUNT      │
                    │  (PGA + PLA created on        │
                    │   MAICPP enrollment)          │
                    └───────────────┬───────────────┘
                                    │
        ╔═══════════════════════════▼════════════════════════════╗
        ║  LAYER 1 — MEMBERSHIP / CREDENTIAL                     ║
        ║  MAICPP  ·  agreement: MAICPP Agreement                ║
        ║  (auto-effective 2026-09-01, no signature required)    ║
        ╠════════════════════════════════════════════════════════╣
        ║  Free base membership (enrollment + verification)      ║
        ║   ├─ Paid benefit packages (one purchase each):        ║
        ║   │    Partner Launch Benefits ........... $350        ║
        ║   │    Partner Success Core .............. $925        ║
        ║   │    Partner Success Expanded .......... $4,125      ║
        ║   ├─ Solutions Partner designation ....... $4,875      ║
        ║   │    6 PATHWAYS  →  3 BADGES (renamed Aug 2026)      ║
        ║   │      Data&AI / DigApp / Infra  → Cloud & AI Plat.  ║
        ║   │      Modern Work / Biz Apps    → AI Business Sol.  ║
        ║   │      Security                  → Security          ║
        ║   │    gate: Partner Capability Score ≥70/100          ║
        ║   │          AND every metric >0                       ║
        ║   ├─ Specializations (free; REQUIRE a designation)     ║
        ║   ├─ Solutions Partner for Training Services .. $4,875 ║
        ║   ├─ Solutions Partner WITH CERTIFIED SOFTWARE (ISV)   ║
        ║   ├─ Support Services designation (distributors)       ║
        ║   ├─ Frontier Distributor designation                  ║
        ║   ├─ Frontier Partner badge (RETIRES June 2027)        ║
        ║   │    → Frontier Partner specialization (FY27)        ║
        ║   └─ Azure Expert MSP  ⚠ RETIRING                      ║
        ║        new enrollments stop 2026-09-15                 ║
        ║        renewals end January 2027                       ║
        ╚═══════════════════════╤════════════════════════════════╝
                                │ MAICPP membership is a PRECONDITION
                                │ for everything below, but does NOT
                                │ govern their terms
        ┌───────────────────────┼───────────────────────┬─────────────────┐
        ▼                       ▼                       ▼                 ▼
╔═══════════════╗   ╔═══════════════════╗   ╔══════════════════╗  ╔═══════════════╗
║ LAYER 2a      ║   ║ LAYER 2b          ║   ║ LAYER 2c         ║  ║ LAYER 2d      ║
║ CSP           ║   ║ MARKETPLACE       ║   ║ DIRECT/VL        ║  ║ SPECIALTY     ║
║ agreement:MPA ║   ║ agreement:        ║   ║ (customer signs) ║  ║ AUTHORIZATIONS║
║ (per REGION)  ║   ║ Publisher Agmt    ║   ║ EA / MCA-E /     ║  ║ AEP, GCC,     ║
║               ║   ║ v8.0, eff.        ║   ║ MCA-Online /     ║  ║ GCC-High/DoD, ║
║ ┌───────────┐ ║   ║ 2026-07-01        ║   ║ Open Value       ║  ║ AOS-G, ADR/   ║
║ │Indirect   │ ║   ║                   ║   ║                  ║  ║ Surface, MAR, ║
║ │Reseller   │ ║   ║ list-only  OR     ║   ║ partner role is  ║  ║ Training Svcs,║
║ │(low bar)  │ ║   ║ transactable      ║   ║ influence/POR,   ║  ║ FastTrack     ║
║ ├───────────┤ ║   ║                   ║   ║ not billing      ║  ║ Ready         ║
║ │Distributor│ ║   ║ NO designation    ║   ║                  ║  ║               ║
║ │(Indirect  │ ║   ║ required to       ║   ║ EA being retired ║  ║ each = own    ║
║ │Provider)  │ ║   ║ publish           ║   ║ for <2,400 seats ║  ║ application + ║
║ ├───────────┤ ║   ╚═════════╤═════════╝   ╚══════════════════╝  ║ own terms     ║
║ │Direct Bill│ ║             │                                   ╚═══════════════╝
║ │(high bar) │ ║             │
║ └───────────┘ ║             │
╚═══════╤═══════╝             │
        │                     │
        └──────────┬──────────┘
                   ▼
   ╔═══════════════════════════════════════════════════════════╗
   ║  LAYER 3 — INCENTIVES / GTM (require Layer 1 AND Layer 2) ║
   ╠═══════════════════════════════════════════════════════════╣
   ║  MCI (Microsoft Commerce Incentives) — engagement-based    ║
   ║  Growth margins (Direct Bill + Distributors ONLY,          ║
   ║      sandbox now, production 2026-10-01)                   ║
   ║  Co-op funds · ECIF · Cloud Accelerate Factory             ║
   ║  Co-sell: ready → Azure IP co-sell eligible → MACC         ║
   ║  Marketplace Rewards · ISV Success                         ║
   ║       ⚠ ALL FOUR ISV PROGRAMS CONSOLIDATING Sept 2026      ║
   ║         into FRONTIER ACCELERATE FOR MARKETPLACE           ║
   ╚═══════════════════════════════════════════════════════════╝

   ╔═══════════════════════════════════════════════════════════╗
   ║  CROSS-CUTTING (bind regardless of layer)                  ║
   ║  Partner Code of Conduct — updated, effective 2026-08-01   ║
   ║  Partner Center security requirements (MFA etc.)           ║
   ║  Business verification / vetting (annual)                  ║
   ╚═══════════════════════════════════════════════════════════╝

   ╔═══════════════════════════════════════════════════════════╗
   ║  INDIVIDUAL-LEVEL (NOT company programs)                   ║
   ║  Microsoft Certifications · MCT · MVP · Frontier Engineer  ║
   ║  badge (Titan Academy)                                     ║
   ╚═══════════════════════════════════════════════════════════╝
```

---

## 2. The taxonomy by class

Three adjustments to the naive classification: (i) individual credentials are a distinct class Microsoft conflates with org programs; (ii) "designations" is a **plural family** (Solutions Partner, certified software, Training Services, Support Services, Frontier Distributor), not one thing; (iii) **Frontier** is a brand family spanning classes, not a program.

### (a) Membership / credential — the MAICPP interior

| Construct | Cost | Gate | Status |
|---|---|---|---|
| MAICPP base enrollment | Free (no fee found) | Global admin, work account, legal entity, MAICPP Agreement acknowledgement | Active [MS-OFFICIAL] |
| Partner Launch Benefits | $350 | none | Active |
| Partner Success Core | $925 | none | Active |
| Partner Success Expanded | $4,125 | none | Active (successor to legacy Silver) |
| Solutions Partner designation | $4,875 | PCS ≥70/100 + every metric >0 | Active |
| Specializations | $0 | aligned designation + performance + skilling + audit/reference | Active |
| Training Services designation | $4,875 | base criteria + 1 solution area | Active |
| Solutions Partner w/ certified software | varies (auditor) | transactable Marketplace offer and/or IP co-sell + audit | Active, folding Sept 2026 |
| Support Services designation | — | SPD + CSP enrollment + ASfP/PSfP/UfP | Active |
| Frontier Distributor designation | — | Distributor Capability Score 33/37 + 3rd-party assessment | Active |
| Azure Expert MSP | $0 | all 3 Azure designations + audit | **RETIRING** |
| Legacy Silver / Gold | — | — | Retired 2025-01-22 |
| Action Pack (MAPS) / Learning Action Pack | — | — | Retired 2025-01-22 |

[MS-OFFICIAL — learn.microsoft.com/partner-center/membership/mpn-overview, updated 2026-06-25; introduction-to-pcs, 2026-08-05; partner-capability-score, 2026-05-11; specializations, 2026-07-31; azure-expert-msp, 2026-08-19]

**New finding vs dossiers 00–04: Azure Expert MSP is retiring.** New enrollments stop **15 September 2026**; renewals end **January 2027**; the **Frontier Partner specialization is the designated transition path**. This materially changes the Frontier story — Frontier is not only the Copilot apex, it is where Microsoft is landing its top Azure services credential too.

**Solutions Partner badge rename (Aug 2026)** [MS-OFFICIAL, announcements/2026-august, 2026-08-13]: six *pathways* remain the unit of requirement, scoring, benefits, and specialization mapping; three *badges* are the customer-facing rollup. "No action is required—your designations, requirements, benefits, and specializations remain unchanged."

**Specialization churn is the highest-velocity area of the program.** Effective 2026-07-31: Analytics + Data Warehouse Migration + Business Intelligence → **Analytics on Azure**; Low Code + Intelligent Automation → **Agentic Business Solutions**; Kubernetes + Migrate Enterprise Apps → **App Modernization on Azure**. Adoption & Change Management retired 2026-06-25. All four Security specializations moved to partner-funded biennial third-party audit as of 2026-07-30. Agentic Security in design for FY27. [MS-OFFICIAL]

### (b) Transaction / route-to-market

| Route | Partner's legal instrument | Customer's instrument |
|---|---|---|
| CSP Indirect Reseller | MPA (per CSP region) | Microsoft Customer Agreement |
| CSP Distributor (Indirect Provider) | MPA | MCA |
| CSP Direct Bill | **Direct Bill MPA** (distinct variant, per tenant) | MCA |
| Marketplace publishing | **Microsoft Publisher Agreement v8.0**, eff. 2026-07-01 | ISV's own customer agreement |
| Marketplace via CSP | MPA + CSP Program Guide third-party offer terms | MCA |
| EA | — (partner is LSP/influencer) | Enterprise Agreement |
| MCA-E | — | MCA for Enterprise |
| MCA-Online / Open Value | — | respective agreement |

[MS-OFFICIAL — enroll/microsoft-partner-agreement, 2026-06-25; enroll/csp-overview, 2026-06-25; customers/csp-commercial-marketplace-contracting, 2025-12-07]

**EA is being squeezed out — and it is not a MAICPP change at all.** [CHANNEL-PRESS — redresscompliance, licenseq, samexpert, dynamicconsultantsgroup, 2026] From 2025-11-01, organizations at roughly ≤2,400 users/devices can no longer renew an EA; they move to CSP (partner-led) or MCA-E (direct). Microsoft has routinely declined new EAs since early 2025. **This is the single biggest structural shift in route-to-market**, and it is pure upside for CSP partners — it pushes mid-market customers into the partner-led channel. Corroborating [MS-OFFICIAL] signal: the July 2026 expansion of the **EA-to-CSP for Azure transition tool** beyond Azure Expert MSP to any partner with a Cloud & AI Platforms designation + Direct Bill authorization.

### (c) Incentive / economics

- **MCI** — the consolidated incentives program, structured as **engagements** grouped by solution area, each with its own partner qualification, customer qualification, proof-of-execution requirements and rates, surfaced dynamically in Partner Center rather than in public docs. [MS-OFFICIAL — incentives/mci-engagements, 2025-12-03; incentives-determined-your-program-eligibility, 2025-09-15] The authoritative engagement list and rate card live only in the **sign-in-gated** FY27 Incentives guide (aka.ms/incentivesguide).
- **Attribution mechanisms** in specialization criteria: **PAL, CPOR, CSP T1, CSP T2, CSPCPOR**. [MS-OFFICIAL, announcements/2026-august]
- **Growth margins** — distinct from MCI. "Partner-earned economics (a partner margin), not a customer-facing discount." **Direct Bill partners and Distributors only.** Sandbox from 2026-07-07; production **2026-10-01**. Qualifying: new-to-offer, seat expansion (must be a *new subscription* mid-term), trial-to-paid, upgrades. Stacks with customer promotions (margin first, promo second); does **not** stack with Specialized Offers. Channel-shift (EA→CSP) explicitly excluded. [MS-OFFICIAL — pricing/growth-margins, 2026-08-11]
- **Co-op funds** — FY27 guidance "evolved"; delivered via Partner Marketing Center Pro. [MS-OFFICIAL, announcements/2026-august, 2026-08-24]
- **ECIF** — live; now a named engagement path into Cloud Accelerate Factory requiring one-time activation. [MS-OFFICIAL, announcements/2026-july, 2026-07-08]
- **Cloud Accelerate Factory** — zero-cost Microsoft-led deployment across 30+ Azure services. **Expanded July 2026** from Azure Migrate & Modernize / Azure Innovate participants only, to all partners holding any of ~17 listed Azure specializations. [MS-OFFICIAL]
- **PEC (partner-earned credit)** — not confirmed in FY27 docs. See could-not-verify.

### (d) Go-to-market / co-sell

Four statuses forming a strict ladder [MS-OFFICIAL — referrals/co-sell-requirements, updated 2026-08-18]:

```
In market → Co-sell ready → Azure IP co-sell eligible → (MACC eligibility)
                          → Business Applications co-sell eligible
```

**Co-sell ready** requires: PartnerID + active Marketplace account, complete business profile, offer published live on Marketplace, sales contact per geography, co-sell collateral (one-pager + pitch deck).

- **Services partners additionally need at least one Solutions Partner designation** for Professional service solutions. ← the cleanest "designation gates co-sell" fact.
- **Business Applications ISVs additionally need ISV Success enrollment.**

**Azure IP co-sell eligible** adds: ≥$100,000 ACR or Marketplace Billed Sales org-wide TTM (Azure credits/ACO excluded); Azure-platformed technical validation; reference architecture diagram; **offer transactability on Marketplace**. Critically: **"Azure IP co-sell eligible status is a prerequisite for MACC eligibility of an offer"** [MS-OFFICIAL] — this resolves the common confusion that any marketplace purchase decrements MACC.

**FY27 co-sell shift — the big one.** [MS-OFFICIAL — announcements/2026-july, 2026-07-10]

> "In FY27… Marketplace becomes the primary path for co-sell at scale… **In FY27, PRACR no longer operates as a broad co-sell mechanism**, and partner engagement instead aligns to Marketplace-first execution."

Partner Reported Azure Consumed Revenue is functionally dead as a co-sell mechanism; credit now flows through **Marketplace Billed Sales**. **Doc conflict:** co-sell-requirements (updated 2026-08-18) still describes the pre-FY27 model.

### (e) Publishing / ISV

- **Microsoft Marketplace** — unified brand; Azure Marketplace + AppSource consolidated (announced 2025-09-25 [CHANNEL-PRESS]), now the term used throughout Learn [MS-OFFICIAL]. Includes an **AI Apps and Agents** category. 3% standard store service fee; no cost to publish.
- **ISV Success** — free year 1, $1,550/yr after. Requires MAICPP **and** Marketplace membership. Tiers: Core / Expanded (invite-only) / Advanced (requires a Certified Software Designation; up to $50K Azure sponsorship + up to $100K cash incentive).
- **Marketplace Rewards** — free, keyed to Billed Sales, requires a *transactable* listing.
- **Agent Store** — hub inside Microsoft Copilot; admin-approval governed; four intake paths including Copilot Studio and the Agent 365 SDK. **Distinct surface from the Marketplace AI Apps and Agents category**; no Microsoft doc reconciles the two submission flows.
- **⚠ Frontier Accelerate for Marketplace** [MS-OFFICIAL, announcements/2026-july, 2026-07-29] — "a new unified offering, coming in September 2026" that "combines ISV Success, Marketplace Rewards, Azure IP co-sell, and certified software designations into one experience." Existing partners transition automatically at renewal. **Four constructs collapse into one within days of this dossier's date.**

### (f) Specialty authorizations

AEP (education), CSP for US Government / GCC (separate validation intake, requires existing CSP enrollment) [MS-OFFICIAL, enroll/csp-gcc-validate], GCC High / DoD, AOS-G [CHANNEL-PRESS only], Nonprofit (now under **Microsoft Elevate** branding, and notably **not** a partner authorization — nonprofits self-register and third parties are barred from registering on their behalf) [MS-OFFICIAL, industry/nonprofit], ADR/Surface, MAR/TPR refurbisher [CHANNEL-PRESS only], Training Services Partner (renamed from Learning Partner), FastTrack Ready.

### (g) Technical / delivery

Cloud Accelerate Factory; FastTrack (customer benefit at 150+ licenses) + FastTrack Ready (partner designation); support plans **ASfP / PSfP / UfP (Unified for Partners)**; Technical Presales and Deployment (TPD) advisory. **Partner University retires 2026-06-15** with linkings credited to June 2027 [CHANNEL-PRESS] — part of a systemic shift from assessments to **certifications + third-party audits**.

### (h) Community / recognition

- **MISA** — nomination-only, and the bar is far higher than "community": services partners need a Security designation **plus all four Security specializations**, plus ≥6 Frontier Accelerate for Security workshops via MCI in TTM, plus a published managed security service offer. [MS-OFFICIAL, microsoft.com/security/business/intelligent-security-association]
- **Partner of the Year 2026** — nominations closed 2026-07-07; **winners announced 2026-11-11 at Ignite**. New categories include "Frontier Transformation." [MS-OFFICIAL/CHANNEL-PRESS]
- **Inner Circle** — appears rebranded to "AI Business Solutions Inner Circle" [CHANNEL-PRESS, inferred; no Microsoft confirmation].
- **MVP** — individual; no prerequisite relationship with MAICPP in either direction.

---

## 3. The agreement stack

**Five distinct instruments. They do not nest — they stack in parallel over a shared account.**

| # | Agreement | Governs | Who signs | Acceptance mechanic |
|---|---|---|---|---|
| 1 | **MAICPP Agreement** | Program membership: Microsoft Materials, Offers/Programs, Products | Every partner org, once | Acknowledged at enrollment. Updated version published 2026-07-01; **auto-effective 2026-09-01, no signature required** |
| 2 | **Microsoft Partner Agreement (MPA)** | The CSP program | CSP partners — **once per CSP region**; Direct Bill variant is per-tenant | Global admin accepts in Partner Center. **Updated MPA auto-effective 2026-12-01** except Direct Bill and Distributor partners in France. 180-day notice standard. China and France require explicit acceptance |
| 3 | **Microsoft Publisher Agreement** | Marketplace listing/publishing/monetization | Any publisher | **v8.0, effective 2026-07-01.** Action-triggered: "By publishing (or attempting to publish) a Listing… you agree" |
| 4 | **Microsoft Customer Agreement (MCA)** | The end customer's purchase | **The customer**, not the partner | Partner must confirm acceptance before ordering CSP offers |
| 5 | **Partner Code of Conduct** | Compliance, anti-corruption, remediation | All partners | **Updated effective 2026-08-01**, adding mandatory participation in anti-corruption/remediation programs |

Plus **incorporated-by-reference instruments** — contractually binding, not separately signed: Program Guides (per program), the **CSP Program Guide** (aka.ms/MPAProgramGuide), the **FY27 Incentives guide**, the **Growth Margin Guide**, the **ISV Success Benefits Guide** (explicitly "incorporated into the Microsoft AI Cloud Partner Program Agreement"), the **Advisor Addendum**, and Publisher Agreement **Addenda A–E**.

**Note the date divergence:** MAICPP Agreement auto-effective **2026-09-01**; MPA auto-effective **2026-12-01**. Two agreements, two effective dates three months apart, both auto-effective without signature. A partner who "signed nothing this year" will be bound by two revised agreements before January.

**A sixth, easily-missed instrument:** MAICPP **benefit packages are purchased through an MCA billing account**. Effective 2026-11-01 benefit expiry aligns to *offer purchase date* rather than first-redemption date, and "partners can only redeem benefits on tenants under that billing account (not third-party tenants)." [MS-OFFICIAL, announcements/2026-august, 2026-08-03] So the MCA appears on the *partner's own* side of the stack too.

---

## 4. Prerequisite graph

```
MAICPP enrollment + active MAICPP Agreement
  └─► REQUIRED for: CSP (all tiers), incentives, benefits, Solutions Partner label,
                    ISV Success, Training Services, MISA, Support Services

Partner Capability Score ≥70 AND every metric >0
  └─► Solutions Partner designation (then PURCHASE at $4,875)
        └─► Specializations (aligned pathway; free)
        │     └─► Cloud Accelerate Factory (~17 Azure specializations)
        │     └─► MISA services path (Security SPD + ALL 4 Security specializations)
        └─► Azure Expert MSP (all 3 Azure designations) [RETIRING]
        └─► Services co-sell ready (Professional service offers)
        └─► CSP Direct Bill (≥1 SPD)
        └─► EA-to-CSP for Azure tool (Cloud & AI Platforms SPD + Direct Bill)

CSP Indirect Reseller (12 months)  ──┐
+ ≥$1M CSP TTM revenue (PGA)         │
+ ASfP or PSfP support plan (PGA)    ├─► CSP DIRECT BILL
+ ≥1 Solutions Partner designation   │      └─► accept Direct Bill MPA
+ Partner Center security reqs       │      └─► Growth margins (DB + Distributors only)
+ capabilities assessment (pass)     │
+ business verification + credit     ┘

CSP enrollment ──► GCC / US Government validation (separate intake form)
CSP enrollment + SPD + support plan ──► Support Services designation

Marketplace account + Publisher Agreement ──► publish (list-only or transactable)
  └─► + business profile + collateral + live offer ──► CO-SELL READY
        └─► + $100K ACR/MBS TTM + technical validation
            + reference architecture + transactability  ──► AZURE IP CO-SELL ELIGIBLE
              └─► MACC eligibility (strict prerequisite)
```

### What is genuinely independent of a designation

The part partners most often get wrong. **All of the following need no Solutions Partner designation:**

1. **Enroll in MAICPP and hold membership indefinitely.** No designation gate, no fee found.
2. **Buy Partner Launch / Success Core / Success Expanded benefits.** These are the *alternative* to designations — explicitly the migration path recommended for legacy Silver holders.
3. **Publish to Microsoft Marketplace**, list-only or transactable. Confirmed by negative evidence across the Publisher Agreement and Marketplace FAQ, and positively by co-sell-requirements, which imposes the designation requirement *only* on services partners' Professional service offers.
4. **Become a CSP Indirect Reseller and transact.** Requirements: active MAICPP membership + PLA + ability to sign + a distributor relationship. **No designation.** (A [CHANNEL-PRESS, cloudcockpit.com] claim that CSP participation requires "≥1 designation OR ≥25 PCS points" is **contradicted** by [MS-OFFICIAL, csp-overview], which lists no such requirement for the indirect model. Treat the 25-point claim as unverified — note this is a *different* thing from the 25-point MCI eligibility mechanic in dossier 03, which is well attested.)
5. **Achieve co-sell ready status as an ISV.** The designation requirement attaches to *services* offers only.
6. **Earn Azure IP co-sell eligible status.** Gated on revenue and technical validation, not designations.
7. **Hold individual credentials** — certifications, MCT, MVP — entirely orthogonal to org designations.

**What genuinely requires a designation:** CSP Direct Bill, specializations, Azure Expert MSP, services co-sell, Support Services designation, MISA services path, most MCI engagements, the EA-to-CSP tool.

---

## 5. History / naming — for decoding partner vocabulary

| Old term | New term | When |
|---|---|---|
| Microsoft Partner Network (MPN) | Microsoft Cloud Partner Program (MCPP) | **2022-10-03** |
| MCPP | Microsoft AI Cloud Partner Program (MAICPP) | announced **2023-07-18** at Inspire; auto-transitioned |
| MPN ID | **PartnerID** (PGA + PLA) | with Partner Center consolidation |
| 18 Competencies, Silver/Gold | 6 Solutions Partner designations, PCS ≥70 | **2022-10-01**; benefits renewals ended **2025-01-22** |
| Advanced Specializations | Specializations | with MCPP |
| Microsoft Action Pack (MAPS) / LAPS | Partner Success Core / Expanded | retired **2025-01-22** |
| Microsoft Cloud Reseller Agreement (MCRA) / Cloud Distributor Agreement (MCDA) | **Microsoft Partner Agreement (MPA)** | MPA supersedes both |
| Azure Marketplace + AppSource | **Microsoft Marketplace** | announced 2025-09-25 [CHANNEL-PRESS] |
| Learning Partner | Training Services Partner | — |
| Six designation names | Three badge names | **2026-08** (pathways unchanged) |
| Azure Expert MSP | Frontier Partner specialization | wind-down 2026-09-15 → 2027-01 |
| PRACR co-sell | Marketplace Billed Sales (MBS) | FY27 |
| ISV Success + Marketplace Rewards + Azure IP co-sell + certified software designations | **Frontier Accelerate for Marketplace** | Sept 2026 |

Specialization renames: AI and Machine Learning on Azure → **AI Platform on Azure**; Build AI Apps with Azure → **AI Apps on Azure**; Accelerate Developer Productivity → **Agentic DevOps with Azure and GitHub**; Information Protection and Governance → **Data Security**; Teamwork Deployment → **Secure AI Productivity**; Microsoft Copilot → **Microsoft 365 Copilot** specialization.

---

## 6. "Frontier" — disambiguation (a genuine trap)

At least **seven** distinct referents as of Aug 2026. Do not assume shared hierarchy:

1. **Frontier Transformation** — FY27 partner GTM narrative/theme.
2. **Frontier Firm** — customer maturity segment label (marketing).
3. **Frontier Accelerate** — customer-facing FY27 unified value framework, with per-solution-area variants (for Azure, Security, Business Processes, Marketplace).
4. **Frontier Accelerate for Marketplace** — partner-facing ISV consolidation, Sept 2026.
5. **Frontier Partner badge** — earned credential; retires end of June 2027.
6. **Frontier Partner specialization** — its successor; also the designated Azure Expert MSP transition path.
7. **Frontier Distributor designation** — CSP distributor designation (33/37 metrics).

Plus: **"Frontier"** the Microsoft 365 Copilot early-access feature channel (a product flag, not a partner program); **Microsoft Frontier Company**, a $2.5B subsidiary announced 2026-04-21 [CHANNEL-PRESS]; **Frontier Engineer badge** (individual, via Titan Academy); and **Windows 365 Frontline**, unrelated and itself renamed **Windows 365 Flex** on 2026-09-03. Channel press routinely conflates these.

---

## 7. Ambiguities and contradictions — findings in their own right

1. **⚠ Direct contradiction on Direct Bill TTM revenue, between two live Microsoft pages.** `csp-overview` (2026-06-25): "$1M in CSP trailing 12 months transactional revenue at the PGA level… **Indirect Reseller revenue is excluded**." `direct-bill-eligibility-requirements` (2026-08-26): "at least USD $1 million in eligible CSP revenue **as an Indirect Reseller** at the PGA level." Mutually exclusive readings of the same requirement. **This affects dossier 01 §4 — flag both readings.**
2. **The Direct Bill requirements table is labelled "FY26"** on a page dated 2026-08-26 — two months into FY27.
3. **Microsoft never states where CSP sits relative to MAICPP.** The membership overview enumerates MAICPP's "key programs" — **CSP is absent from that list**. The enrollment overview says: after MAICPP activation, "check your eligibility and explore being a Cloud Solution Provider, Microsoft Marketplace, and more." That is *adjacent*, not *inside*. Combined with the MAICPP Agreement's "does not alter, amend, or modify" clause, the defensible reading is **prerequisite + parallel, not parent + child** — but Microsoft never says so plainly. This is the root cause of partner confusion.
4. **"Solutions Partner" is overloaded three ways**: (a) any MAICPP member offering software/services (Microsoft's broad legal definition); (b) a holder of a Solutions Partner *designation*; (c) a prefix on unrelated constructs (with certified software, for Training Services).
5. **`introduction-to-pcs` (2026-08-05) still presents Azure Expert MSP as live** — two weeks before the retirement notice posted on the Azure Expert MSP page (2026-08-19).
6. **`co-sell-requirements` (2026-08-18) does not reflect the FY27 PRACR/Marketplace-first change** announced 2026-07-10 on the same site.
7. **Marketplace FAQ names the "Microsoft Partner Agreement" as the publishing prerequisite** — but the MPA is the CSP agreement. Almost certainly loose post-rebrand language meaning MAICPP; no page reconciles it.
8. **MAICPP enrollment is now enforced at *tenant* level for CSP Direct Bill**, while designations, TTM revenue, and support plan remain *PGA* level. Introduced with the Eligibility Dashboard (2026-08-27, rolling out through mid-September, enforcement +90 days). A partner can be compliant at PGA level and still lose an individual tenant.

---

## 8. Could not verify

1. **Full text of the updated MAICPP Agreement** (auto-effective 2026-09-01) — preview PDF redirects to auth. Structural quotes above are from a **March 2024 version** via lawinsider; the 2026 version's changes are unverified.
2. **FY27 MCI engagement list, rates, per-engagement eligibility** — sign-in gated.
3. **Growth Margin Guide** contents (lookback periods, seat multiples, strategic SKU mix thresholds) — sign-in gated.
4. **Whether MAICPP base enrollment carries any fee** — no fee in any doc retrieved and priced offers are all optional add-ons, but no page states "free" explicitly.
5. **Partner-earned credit (PEC) status in FY27** — not found. Cannot confirm whether it persists, folded into growth margins, or retired.
6. **Frontier Partner specialization criteria** — confirmed to exist and to be the Azure Expert MSP successor; requirements not published.
7. **Frontier Accelerate for Marketplace mechanics** — announced for Sept 2026; transition rules "forthcoming."
8. **partner.microsoft.com content generally** — 403s to bots throughout, including the MCAPS Start for Partners FY27 blog.
9. **AEP, AOS-G, MAR/RRP/TPR refurbisher programs** — no official Microsoft page located; entirely channel-press sourced.
10. **Distributor (Indirect Provider) revenue/capability thresholds** — a $30M TTM per region figure circulates [CHANNEL-PRESS] but is not published by Microsoft.
11. **Whether Agent Store submission and Marketplace "AI Apps and Agents" submission are one flow or two** — no doc reconciles them.
12. **"Unified for Partners (UfP)" support plan** — appears in official docs as a third option alongside ASfP/PSfP, marked "when broadly available"; no dedicated documentation found.
