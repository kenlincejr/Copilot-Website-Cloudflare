# Co-Sell, Marketplace, and the IP Path — and Why SMB Partners Don't Get Co-Sell

**Research dossier — 06 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026. Fiscal context: Microsoft FY27 began 1 July 2026.

Tag legend: `[MS-OFFICIAL]` = learn.microsoft.com / microsoft.com primary, URL + doc date · `[CHANNEL-PRESS]` · `[COMMUNITY]` · `[UNVERIFIED]`.

**Coverage note.** Q1–Q3 (co-sell mechanics, how co-sell pays, the SMB reality) are densely researched. Q4–Q6 (marketplace mechanics for services partners, the IP/agent-publishing path, marketplace economics) are partial — the sub-streams assigned to them did not return, and the research agent's WebSearch budget was exhausted. Gaps are marked **NOT RESEARCHED** rather than guessed.

---

## 1. The headline finding for an SMB partner

**Microsoft states, in its own documentation, that SMB does not get co-sell — it gets a lead handoff.** [MS-OFFICIAL, learn.microsoft.com/partner-center/referrals/manage-leads, ms.date 2026-01-09, updated 2026-07-29]:

> "**SMB Opportunities** are leads from Microsoft sellers who gather the requirements from a customer and are helping them find the right partner to solve a customer problem. **SMB Opportunities leads aren't the same as co-sell opportunities, in which a Microsoft sales representative is actively engaged with the partner and customer until the deal closes.**"

That is the crux. Everything below explains the machinery that makes it true, and what an SMB partner should chase instead.

### The gating chain that excludes SMB

Partner Center's operative customer taxonomy is binary plus a fallback [MS-OFFICIAL, manage-co-sell-opportunities, updated 2026-07-23]. When selecting a customer for a deal you get three tabs:

- **Microsoft Managed** — "the deal is **eligible for Azure IP co-sell deal registration**"
- **Microsoft Unmanaged** — "the deal ***isn't* eligible** for IP co-sell deal registration"
- **Other** — Moody's database accounts; registration possible only if later matched to a managed account

Then the hard gates stack:

1. **Deal registration requires a Microsoft-managed account.** [MS-OFFICIAL, register-deals, updated 2026-07-21]
2. **Deal value ≥ USD 25,000.** Below this Microsoft does not even display a decline reason. [MS-OFFICIAL, referrals-faq]
3. **An explicit decline reason exists for exactly this case:** *"No Microsoft seller directly manages this customer: Our sales team can't assist you because Microsoft doesn't manage the customer."* [MS-OFFICIAL, referrals-faq]
4. **Only IP incentives are eligible for deal registration** — Azure IP co-sell, Biz Apps Premium, Biz Apps Standard. [MS-OFFICIAL, referrals-faq] → **a pure services partner cannot register deals at all.**
5. Marketplace certification policy **§3000.3.1 is literally titled "Segmentation"** [MS-OFFICIAL, learn.microsoft.com/legal/marketplace/certification-policies, updated 2026-08-20] — Microsoft codifies a segment gate in legal policy. Body text unretrievable; see could-not-verify.

**Segment names confirmed in official docs:** **SMC-Corporate** — "**Joint planning leads** are leads from Microsoft **SMC-Corporate sellers**… help align customer territory planning and support co-selling success" [MS-OFFICIAL, manage-leads]. This is the *lowest* segment at which a named Microsoft seller proactively plans with partners. And **SMB**, per the quote in §1. No primary Microsoft page defines the full Enterprise / SMC-Managed / SMC-Corporate / SMB model with seat or revenue thresholds — see could-not-verify.

### What an SMB-focused services partner can actually use

All [MS-OFFICIAL]:

- **Partner-led deals** — give Microsoft visibility into pipeline without requesting help. Costs nothing, feeds Microsoft's data, and **still eligible for deal registration** where the other criteria are met.
- **Leads → SMB Opportunities tab** — post-QRP, this is where shared SMB referrals land.
- **Leads → Joint planning leads** — from SMC-Corporate sellers; territory planning with partners.
- **Leads → Marketplace leads** — inbound from your business profile or offer listing; call-to-action filter values now include **"Request private offer."**
- **P2P co-sell** — invite a partner who *does* hold the managed-account relationship into the deal.
- **MCI engagements** — customer nominated by domain/tenant ID; **no managed-account requirement stated**. See §3.
- **CSP margin + FY27 growth margin** — this is the real SMB money, not co-sell.

**Lead SLA discipline matters.** 14-day expiry on inbound; a "flame" icon marks customers who explicitly asked to be contacted and downgrades after 72 hours; mandatory **Qualification** and **Evaluation** (BANT) substages now gate the Won button. And responsiveness is scored: "When you respond in a timely fashion to incoming requests, **we'll increase your visibility in future partner search results**." [MS-OFFICIAL, manage-leads updated 2026-07-29; manage-co-sell-opportunities]

---

## 2. Co-sell mechanics in FY27

### 2.1 The status ladder

[MS-OFFICIAL, referrals/co-sell-requirements, ms.date 2024-07-02, updated 2026-08-18]

| Status | Meaning |
|---|---|
| **In market** | Solution linked to a live Marketplace offer; co-sell-ready requirements not met |
| **Co-sell ready** | Co-sell-ready requirements met |
| **Azure IP co-sell eligible** | Co-sell-ready plus four additional requirements |
| **Business Applications co-sell eligible** | D365 apps on Dataverse / Power Apps offers enrolled in ISV Success |

Terminology note: "Azure IP co-sell **eligible**" is the current FY27 term; "incentivized" survives only in legacy page wording.

**Co-sell ready requires:** PartnerID + active Marketplace account in Partner Center; complete business profile; **offer published live on Marketplace**; a sales contact per co-sell-eligible geography; listing docs on the Co-sell > Solutions page. **Services partners additionally need ≥1 Solutions Partner designation** for Professional service solutions. **Business Applications ISVs additionally need ISV Success enrollment.** Office/Teams/Outlook/Excel add-ins are explicitly **not eligible** for co-sell-ready status.

**Azure IP co-sell eligible additionally requires** (solution type must be **IP**): **USD 100,000** ACR or Marketplace Billed Sales org-wide TTM (Azure credits/ACO excluded); Microsoft technical validation, "primarily platformed in Azure"; a reference architecture diagram; and **offer transactability on Marketplace**. Critically: **"Azure IP co-sell eligible status is a prerequisite for MACC eligibility of an offer."**

**Solution types** are Device / **IP (application)** / Managed service / Service. A consultancy selects Service or Managed service, which **structurally excludes it from Azure IP co-sell eligible** — and therefore from MACC eligibility. [MS-OFFICIAL, co-sell-configure, updated 2026-08-18; MACC implication is a necessary inference, [UNVERIFIED] as a direct Microsoft statement]

### 2.2 The services co-sell carve-out — and a documentation conflict worth testing

[MS-OFFICIAL, referrals/services-co-sell, ms.date 2025-07-17, updated 2025-09-25]:

> "…qualified Microsoft partners who have either Solutions partner designations, Specializations, or Azure Expert Managed Services Provider (MSP), **can now co-sell with Microsoft sellers without having to publish a Microsoft Marketplace Consulting services offer.**"

Partners create a services co-sell opportunity in the **Referrals** workspace, setting a **Partner role** (Presales envisioning / Solution design / Proof of concept / Business strategy / Deployment services / Adoption and change management / Transaction / Managed services) plus Solution area and Solution play for routing. Microsoft sellers can send *inbound* services opportunities to designation/specialization/Azure Expert MSP holders, evaluating them **"based on the partner's business profile that is published in Partner Center."**

> **⚠ Conflict — flag before planning around it.** [MS-OFFICIAL, referrals-faq, ms.date 2026-01-09] still states the **New Deal** button is greyed out unless you "Have a solution that: Is published in Microsoft Marketplace. Has a status of **co-sell ready**." Restated in manage-co-sell-opportunities (updated 2026-07-23) and in connector-salesforce (updated 2026-08-19, which lists "Your IP/Services solution must be Co-sell ready" as a prerequisite). This directly contradicts the services-co-sell page. [UNVERIFIED] inference: either the FAQ pages are stale, or the carve-out applies only to *inbound* seller-originated services co-sell. **This is the single most important thing for a services partner to test empirically in Partner Center before planning around it.**

**The business profile is the discovery surface** for services partners — it "showcases their capabilities and designation status to Microsoft Sellers appropriately in our internal tools as well as on Microsoft Marketplace listings." Requires the **Business profile admin** role. For an SMB services partner this is the single highest-leverage free asset in Partner Center, and it is almost universally neglected.

### 2.3 Deal types, SLA, and scoring

[MS-OFFICIAL, manage-co-sell-opportunities, updated 2026-07-23]

Deal types: Azure IP co-sell · Services co-sell · Partner-to-partner (P2P) · Solution assessments (vetted partners only) · **Partner-led** (work alone, grant Microsoft visibility) · **Private** (no Microsoft visibility, upgradeable later).

- **Microsoft sellers have a 14-day window** to decide whether to participate; unanswered inbound opportunities archive as *expired*.
- Sales stages map to MCEM: Created 10% (Listen and Consult) → Accepted 10% → Qualified 20% → Developed 40% (Inspire and Design) → Proposed 60% (Empower and Achieve) → Negotiated 80% → Won 100% (Realize Value).
- **Referral Confidence Score** — High/Medium/Low ML score visible to sellers "so sellers can prioritize the best opportunities" (100% rollout 2025-05-01). **Gen-AI "Auto Notes"** drafts the Customer Needs / notes-to-seller sections.
- **Solution Area and Solution Play are now mandatory** for all new IP co-sell deals via portal and bulk upload.

**FY26 solution plays most relevant to a Copilot/agent practice** [MS-OFFICIAL, services-co-sell — no FY27 table published as of fetch]: AI Business Solutions → **Copilot and Agents at Work**, **Innovate with Low Code AI and Agents**, **Secure AI Productivity**, **Scale Business Operations with AI**, Data Security. Cloud and AI Platforms → **Innovate with Azure AI Apps and Agents**.

### 2.4 QRP is retired — where leads live now

[MS-OFFICIAL, announcements/2026-march, dated 2026-03-27]:

> "Microsoft retires the Qualified Referral Program (QRP) at the end of March 2026 and consolidates lead/referral sharing into our standard motions … a single system of record for co-sell and Marketplace conversions."

Shared referrals no longer land as "qualified leads"; they land in **Referrals → Leads → SMB Opportunities**. Concierge engagement moves to activating the Concierge benefit in Partner Center (the QRP request form retired 2026-01-30). QRP data went read-only for a target 90 days for export.

---

## 3. How co-sell actually pays

### 3.1 PRACR is dead; Marketplace is the rail

[MS-OFFICIAL, announcements/2026-july, "Azure IP co-sell updates," dated 2026-07-10, audience: Software Development Companies]:

> "While the **Partner Reported Azure Consumed Revenue (PRACR)** model operated as the co-sell mechanism in the past, Microsoft is moving toward a more automated, **Marketplace-first** approach."
> "In FY27… **Marketplace becomes the primary path for co-sell at scale**…"
> "**Co-sell credit for Marketplace transactions continues to be recognized through Marketplace Billed Sales (MBS).**"

Operational contact: IPCosellDesk@microsoft.com. Corroborated [CHANNEL-PRESS] Cloud Factory 2026-07-19/20; Channel Dive 2026-07-13.

### 3.2 What a partner earns from a co-sell win

**Nothing directly.** There is no per-referral bounty documented anywhere in Partner Center. The verified monetization channels:

**(a) Deal registration → Azure IP co-sell attribution.** [MS-OFFICIAL, register-deals, updated 2026-07-21] Requires: deal type co-sell or partner-led; **≥ USD 25,000**; **Microsoft manages the customer account**; ≥1 Azure IP co-sell eligible solution; status won. Mechanics: 72-hour minimum between creation and Won; 60 days from contract signature to register; perpetual contracts amortized over 6 years; auto-approval except ACV > USD 1M, multi-partner referrals, or PAYG. Exception requests take up to 14 working days and are not appealable through support. **ISV Connect deal registration** is the Business Applications analogue at a **> USD 5,000** threshold.

Explicit FY27 steer for non-transacting partners [MS-OFFICIAL, register-deals]: *"For partners who are not transacting on Microsoft Marketplace today, we encourage you to also continue registering deals and using Partner Center to share referrals… In addition, we encourage you to attain a **Solutions Partner with certified software** for your Azure deals."*

**(b) MCI engagements — the viable on-ramp for a services partner.** [MS-OFFICIAL, incentives/mci-engagements, ms.date 2025-12-03; mci-engagements-customers, updated 2025-09-15] Two payout shapes: **fixed pay** (nominate customer by domain / tenant ID / TPID / Azure subscription ID) and **variable pay** (nominate only by MSX opportunity ID; declared hours are immutable after submission). Requires customer **consent by email** within a per-engagement SLA, and an enrolled MAICPP location with a valid **payee (bank/tax) profile**.

The link to co-sell is explicit and is the key mechanic:

> "Some partner activity-type engagements can have referral creation and co-selling enabled … the system creates a **partner-led referral** corresponding to the claim. … Once the claim gets consent from the customer, the partner-led referral **might get upgraded to a co-sell referral** if customer qualifies… **Microsoft field sellers then get visibility of the claim and can co-sell with partners.**" [MS-OFFICIAL, mci-engagements-customers]

→ **You get paid for the engagement (workshop/assessment), not for the co-sell.** The co-sell is downstream of the claim, not the other way round. For an SMB partner this inverts the usual mental model: run the funded engagement, and the referral creates itself.

**(c) ECIF.** Field-nominated by Microsoft AEs/PDMs, no self-service portal. Commonly cited requirements — an advanced specialization, ~10:1 ACR-to-funding ratio — are [COMMUNITY]/[UNVERIFIED]; **no learn.microsoft.com page documents ECIF eligibility or rates.** FY27 process change [MS-OFFICIAL, announcements/2026-july, 2026-07-08]: partners must complete a **one-time activation form**, then submit eligible engagements directly. Partner-nominated engagements can now combine existing incentives with Cloud Accelerate Factory.

**(d) Cloud Accelerate Factory.** Microsoft-delivered deployment capacity pulled into partner engagements — delivery subsidy, not cash. "For select workload types, you may be able to access Cloud Accelerate Factory through the **Microsoft 365 Copilot specialization**." [MS-OFFICIAL, announcements/2026-july]

**(e) CSP margin / growth margin.** Growth margin launches **2026-10-01**; sandbox from 2026-07-07 for distributors and direct-bill partners. ⚠ For indirect resellers, [CHANNEL-PRESS] notes "the earnings ceiling applies at the **distributor tier**, not automatically to resellers" — verify pass-through with your distributor.

**(f) Co-op funds.** FY27 guidance "evolved"; delivered via Partner Marketing Center Pro (pmc.partner.microsoft.com). [MS-OFFICIAL, announcements/2026-august]

### 3.3 Why a Microsoft seller would bring you a deal

Direction is well attested; **the rate is not published.** [COMMUNITY, Clazar, updated 2026-08-28]: "Microsoft sales reps earn quota credit when they sell Azure IP co-sell eligible solutions, creating a direct financial incentive for Microsoft's massive field sales organization." No primary source states a percentage. The historically reported "100% of marketplace-billed revenue retires Azure quota" is **[UNVERIFIED]**.

Microsoft's own marketing outcomes, relayed [CHANNEL-PRESS, Maven Collective FY27 recap]: "84% higher win rates," "41% larger deal sizes," "55% growth in shared deals." Directional only.

---

## 4. Marketplace for a services partner (partial)

**Confirmed:**

- **Publishing needs only a PartnerID.** "The minimum requirement to publish in the online stores is a Partner ID. These benefits are available to all partners regardless of … competency, Solutions partner designation, Action Pack subscription status, or partner type." [MS-OFFICIAL, marketplace-offers/gtm-your-marketplace-benefits, ms.date 2024-08-19, updated 2025-09-25]
- **Marketplace Rewards for List/Trial/Consulting offers accrue once every 12 months at partner level**; transactable offers get an "evergreen benefit engagement based on performance by trailing 12-months." [MS-OFFICIAL, same] — confirms prior research.
- **Services-only partners are excluded from ISV Success and sponsorship**, verbatim: "Marketplace billed sales (MBS) from professional services count for software development companies with transactable apps. **Service-only partners aren't eligible, and sponsorship for services-only deals isn't provided.**" [MS-OFFICIAL, same]
- **"Request private offer"** — launched 2026-07-20, **disabled by default**, toggled on per eligible transactable offer. Customers request from the listing page; requests flow into existing Marketplace lead management, APIs, and CRM connectors. Now a call-to-action filter value in Referrals → Leads → Marketplace leads. [MS-OFFICIAL, announcements/2026-july; manage-leads]
- **Private offers now support 1–120 month terms** (up to 10 years), including non-standard lengths, "for SaaS and **professional services** offers." **Multiparty private offers expanded to 36 markets.** [CHANNEL-PRESS, Cloud Factory 2026-07-20]
- **Reach**: single storefront at marketplace.microsoft.com plus in-product surfaces across M365, D365, Power Platform, Azure, Power BI; "sell to customers across **141 geographies**"; new **AI Apps and Agents category**. [MS-OFFICIAL, marketplace-offers/overview, ms.date 2026-05-27]
- **New offer type: Dragon Copilot Physician apps and agents** (US only), announced 2026-08-20 — and notably it *is* Azure IP co-sell eligible-capable. [MS-OFFICIAL, announcements/2026-august]

**NOT RESEARCHED:** the consulting-offer publishing flow itself, pricing/duration fields, listing-vs-transactable configuration, MPO mechanics and reseller margin model, whether professional-service offers are MPO-eligible, MACC drawdown percentage.

---

## 5. The IP path (partial)

**Confirmed:**

- **Frontier Accelerate for Marketplace** — [MS-OFFICIAL, announcements/2026-july, 2026-07-29 and announcements/2026-june, 2026-06-25]: "a new unified Microsoft offering **for software companies**, **launching this fall**, brings together **ISV Success, Marketplace Rewards, Azure IP co-sell, and Solutions Partner with certified software designations**." Existing partners "transition automatically at renewal." Also: from FY27 **Azure sponsorship moves to use-case-specific allocations** — separate allowances for customer deployments (larger) and no-cost trials (smaller). The "software companies" restriction is explicit and confirms prior research.
- **ISV Success** — "$126,000 (USD) of value at no cost … for the first year"; Marketplace Rewards claims "up to **7x** higher Marketplace-billed sales." [MS-OFFICIAL, microsoft.com/isv/marketplace]
- **Marketplace Rewards mechanics** — tiers keyed on Marketplace-billed sales, Business Applications solution value, or Teams App MAU; transacting partners get a dedicated Engagement Manager; activation requires a company marketing contact whose email differs from the Partner Center account email; benefits refresh annually on the anniversary of first receipt; governed by the Publisher Agreement + Commercial Benefits Program Addendum; **English only**. [MS-OFFICIAL, gtm-your-marketplace-benefits]
- **Agentic Business Solutions specialization prerequisite:** Business Applications OR Digital & App Innovation OR Modern Work designation. [MS-OFFICIAL, introduction-to-pcs, updated 2026-08-05]
- **Benefit caps by area:** Azure 5 specializations, Business Applications 3, Modern Work 3, Security 3. [MS-OFFICIAL, same] — confirms control-before-scale/04 §2.6.

**NOT RESEARCHED:** commercial marketplace account creation, Publisher Agreement terms, per-offer-type technical validation, SaaS fulfillment APIs, metered billing, Entra ID SSO requirements, **Agent Store submission and validation**, Copilot Studio agent publishing to Marketplace, M365 Certified / App Compliance tiers, "Microsoft Verified Solution Status" / "Copilot-ready" badge naming, declarative vs custom-engine agent monetization, whether agents are transactable, and all out-of-pocket costs for the IP path.

---

## 6. Marketplace economics — the fee is 3%, not 20%

[MS-OFFICIAL, https://www.microsoft.com/en-us/isv/marketplace, fetched 2026-08-28, page undated]:

> - "**3% agency fee** when customers purchase your offer through Marketplace"
> - "**50% reduced agency fee for all renewals sold as private offers** through Marketplace" (→ **1.5% effective**)

**This supersedes the historical 20% / 10% / 3% tier structure.** [UNVERIFIED] inference: Microsoft appears to have collapsed the tiers to a flat 3% baseline rather than reserving 3% for IP-co-sell-eligible deals. **Not found on learn.microsoft.com or in the Publisher Agreement text — verify before relying on it.**

Growth claims: "**$300B** partner services revenue opportunity by 2030" [MS-OFFICIAL, microsoft.com/isv/marketplace]; "more than **$6 in services revenue for every $1 of software sold** through Marketplace" [CHANNEL-PRESS, Maven Collective].

---

## 7. Correction to prior research: "Partner Center for Sales"

**Could not be verified and should not be repeated as fact.** Exact-phrase search returns no Microsoft or third-party source naming such a product or experience. It appears in control-before-scale/04 §7 as a [CHANNEL-PRESS] forward-looking item; treat it as unsubstantiated.

What genuinely exists in FY27 and may be what that referred to:
- **QRP retirement → unified referrals front door** in Partner Center Referrals (2026-03-27) [MS-OFFICIAL]
- **Partner Center agent endpoint** — "Effective June 2026… available for direct integration for all partner organizations. The PC agent endpoint supports all capabilities offered through the Partner Center AI assistant user experience." [MS-OFFICIAL, announcements/2026-july, 2026-07-20]
- **Pitch Maker Agent (beta)** — announced June 2026 [MS-OFFICIAL, title confirmed, body not extracted]

---

## 8. Could not verify

1. **"Partner Center for Sales"** — no source names such an experience. See §7.
2. **Certification policy §3000 body text** — §3000.1, §3000.2, **§3000.3.1 Segmentation**, §3000.4 MACC eligibility. Page too large for WebFetch past the ToC. **§3000.3.1 is very likely the authoritative statement of which customer segments qualify for Azure IP co-sell deal registration — the highest-value unretrieved source in this dossier.** Needs a browser fetch or PDF export.
3. **Microsoft seller quota-retirement rate** — direction confirmed, percentage not published anywhere reachable.
4. **Official FY27 customer segmentation model** — no primary page defining Enterprise / SMC-Managed / SMC-Corporate / SMB / SME&C with thresholds. SMC-Corporate and SMB confirmed only incidentally via lead-type definitions. SME&C is [CHANNEL-PRESS]/[COMMUNITY] only (Ralph Haupter reportedly leading a new SME&C organization).
5. **The services-co-sell contradiction** (§2.2) — needs empirical testing in a live Partner Center tenant.
6. **Marketplace fee structure in a Microsoft legal/learn source** — 3% / 1.5% stated only on a marketing page.
7. **MACC drawdown percentage** for marketplace purchases.
8. **Marketplace payout mechanics** — thresholds, schedule, currency, seller-of-record/tax treatment.
9. **ECIF on any Microsoft primary source** — all detail is [COMMUNITY].
10. **Cloud Ascent / propensity data** — existence and access path in FY27 unverified. Do not assume it still exists.
11. **Distributor-led SMB demand gen** (TD SYNNEX, Ingram, Pax8, Arrow) and Digital Marketing Content OnDemand — not researched.
12. **All of §5's publishing mechanics** and every out-of-pocket cost on the IP path.
13. **partner.microsoft.com hard-403s to WebFetch** — blocked the Frontier Accelerate for Marketplace landing page, the co-sell membership page, and the M365 Copilot specialization requirements page. techcommunity blog bodies render title-only.
