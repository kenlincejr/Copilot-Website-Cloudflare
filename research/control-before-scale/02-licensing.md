# 02 — Licensing: what an SMB must own before you can sell AI governance

**Research date: 28 August 2026.** Every price and entitlement below carries a URL and the date the page was checked. All prices are US list, USD, per user per month unless stated.

**Source tags used throughout:**
`[MS-OFFICIAL]` = microsoft.com / learn.microsoft.com / Partner Center announcements.
`[PARTNER/RESELLER]` = distributor, CSP, MSP or licensing-consultancy content.
`[COMMUNITY]` = MVP blogs, forums, Microsoft Q&A answers (not authoritative).
`[UNVERIFIED]` = could not confirm from a primary source; treat as a hypothesis.

> **The single most important finding.** The old answer — "Business Premium customers can't buy the compliance stack, they have to step up to E3+E5 Compliance" — is **out of date and now wrong**. Since September 2025 Microsoft sells **Microsoft Purview Suite for Business Premium** and **Microsoft Defender Suite for Business Premium** as add-ons that attach directly to a Business Premium base, capped at 300 seats. That changes the entire upsell ladder for this motion. See §2.

---

## 1. The SMB base SKUs

### 1.1 Current list prices (post 1 July 2026)

Microsoft executed a global pricing and packaging update on **1 July 2026**, announced 4 December 2025, applying across all channels including CSP. `[MS-OFFICIAL]` — Partner Center June 2026 announcements, "Reminder: Microsoft 365 pricing and packaging updates coming in 2026", https://learn.microsoft.com/en-us/partner-center/announcements/2026-june (checked 2026-08-28); public FAQ at https://www.microsoft.com/en-us/licensing/news/2026-m365-packaging-pricing-updates-faq (checked 2026-08-28).

| SKU | List price (annual commitment) | Source tag |
| --- | --- | --- |
| Microsoft 365 Business Basic | $7.00 | `[PARTNER/RESELLER]` |
| Microsoft 365 Business Standard | $14.00 (up from $12.50) | `[PARTNER/RESELLER]` |
| Microsoft 365 Business Premium | **$22.00 — unchanged** | `[PARTNER/RESELLER]` |
| Microsoft 365 Apps for business | $10.00 | `[MS-OFFICIAL]` (compare page) |
| Microsoft 365 Business Standard **with Copilot** | $23.50 annual / $28.20 monthly commitment | `[MS-OFFICIAL]` |
| Microsoft 365 Business Premium **with Copilot** | $32.00 annual / $38.40 monthly commitment | `[MS-OFFICIAL]` |
| Microsoft 365 E3 | $39.00 (up from $36.00) | `[PARTNER/RESELLER]` |
| Microsoft 365 E5 | $60.00 (up from $57.00) | `[PARTNER/RESELLER]` |
| Microsoft 365 E7 ("Frontier Suite", GA 1 May 2026) | $99.00 | `[PARTNER/RESELLER]` |

**A trap for your quoting engine.** The public Microsoft compare page at https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products (checked 2026-08-28) now leads with the **Copilot-bundled** prices — it renders Business Standard at $23.50 and Business Premium at $32.00. Those are the *with Copilot* SKUs, not the base SKUs. If a customer screenshots that page and asks why your quote says $22, this is why. The base Business Premium price of $22.00 is `[PARTNER/RESELLER]`-sourced (multiple independent CSP blogs agree); I could **not** get Microsoft's own price table to render a clean base-SKU figure, because the marketing site now defaults to the bundle. **Verify the base price in the Partner Center price list before quoting.**

The July 2026 uplift also added entitlements, not just cost: Business plans gained 50 GB of additional mailbox storage (Business Premium primary mailbox reportedly moving 50 GB → 100 GB) and enhanced Copilot Chat experiences; E3 gained Defender for Office 365 Plan 1. `[PARTNER/RESELLER]`

**Renewal mechanics:** the new pricing applies at each subscription's **next renewal on or after 1 July 2026**, not immediately. Customers on multi-year agreements continue at current pricing until renewal. `[MS-OFFICIAL]` (packaging FAQ, checked 2026-08-28).

### 1.2 The 300-seat ceiling — exactly what it applies to

This is the definitive wording, and it is worth quoting to customers verbatim:

> "Our Microsoft 365 Business base per-user plans are designed for organizations with up to 300 users. For example, if an organization is provisioned for 250 seats of Business Premium, the organization is eligible to provision only 50 more seats in total across the Business family of plans. Microsoft reserves the right to enforce the tenant limit of 300 provisioned licenses across the Business family of plans. Organizations with more than 300 users should consider subscribing to Microsoft 365 for enterprise plans."

`[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-plan-options (checked 2026-08-28; page ms.date 2025-07-18).

Read carefully, because three things follow:

1. **The cap is per-tenant and shared across the whole Business family** — Basic + Standard + Premium + Apps for business are counted together against one 300 pool. It is *not* 300 of each.
2. **It caps provisioned licences, not users.** A tenant can hold 800 user objects; what it cannot do is provision a 301st Business-family licence.
3. **The same page explicitly permits mixing**: "You can combine Enterprise, Business, and standalone plans (for example, Exchange Online Plan 1) within a single account." So 300 × Business Premium + 200 × E3 in one tenant is a supported, compliant configuration. `[MS-OFFICIAL]`

Enforcement is a real-time purchase/assignment block at seat 301 rather than a retrospective audit. `[PARTNER/RESELLER]` / `[COMMUNITY]` — this specific mechanism is widely reported by resellers and in Microsoft Q&A threads but I could not find a first-party Microsoft page that describes the enforcement behaviour. Treat the *mechanism* as `[UNVERIFIED]`; the *right to enforce* is `[MS-OFFICIAL]`.

### 1.3 What Business Premium actually entitles

Microsoft's own component list, from the admin documentation:

> "Microsoft 365 Apps installed on your devices; protection for your user accounts with **Microsoft Entra ID P1**; endpoint management, security, and mobile application management with **Microsoft Intune Plan 1**; protection for your devices with **Microsoft Defender for Business**; protection for email and files with **Microsoft Defender for Office 365 Plan 1**; **Microsoft Purview Information Protection** and **data loss prevention (DLP)** for email and files with Microsoft Purview."

`[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/microsoft-365/admin/security-and-compliance/add-defender-suite-business-premium (checked 2026-08-28).

Confirmed Purview entitlements for Business Premium, from the Purview service description (https://learn.microsoft.com/en-us/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description, checked 2026-08-28, page ms.date 2026-08-03) `[MS-OFFICIAL]`:

- **Manual sensitivity labelling** — yes (BP is named in the entitled column).
- **DLP for Exchange Online, SharePoint Online, OneDrive** — yes (BP named explicitly).
- **Retention policies and retention labels** (creation, publishing, org-wide/location-wide scopes) — yes (BP named).
- **Audit (Standard)**, including Audit (Standard) for Copilot interactions — yes.
- **eDiscovery (standard)** for sites, files and email — yes.
- **Compliance Manager** — available, but "assessment availability and management capabilities depend on your licensing agreement" (i.e. BP gets a reduced template set).
- **DLP to safeguard prompts** in Copilot / Copilot Chat — yes; the service description footnotes this as "available to all users of Microsoft Copilot and Copilot Chat".
- **Sensitivity label inheritance from input to output for Microsoft 365** — yes, *with* a Microsoft 365 Copilot licence.

#### What Business Premium does **not** include — be precise

All `[MS-OFFICIAL]` from the Purview service description unless noted:

- **Service-side / automatic sensitivity labelling.** The entitled column is "Microsoft 365 E5/A5/G5, Microsoft Purview Suite/GOV/FLW, Microsoft Defender + Purview Suite FLW, Microsoft 365 E5 Information Protection and Governance". Business Premium is absent. The page states plainly: "Sensitivity labeling, including automatic or policy-based labeling, requires a Microsoft 365 E5 license or Microsoft 365 Information Protection and Governance (IPG)."
- **DLP to restrict Copilot from processing files and emails.** The service description has an explicit table row for this, and the Business Basic/Standard/Premium column is **No** — *as is the E3 column*. Only E5, the Purview Suite family, and IPG get **Yes**. This is the single most consequential gap in the whole dossier: the control that stops Copilot grounding on labelled sensitive content is not in Business Premium *or* E3.
- **Endpoint DLP** (Windows/macOS device DLP) — E5 / Purview Suite family / IPG only.
- **DLP for cloud apps in the browser** and **DLP over the network** — same restricted set.
- **Insider Risk Management** — E5 / Purview Suite family / Insider Risk Management SKU only.
- **Communication Compliance** — E5 / Purview Suite family / Office 365 E5 only.
- **Audit (Premium)** — one-year audit retention, crucial-events logging, high-bandwidth Management Activity API. Not in BP base.
- **eDiscovery (premium)** — not in BP base.
- **Records Management** (mark as record, event-based retention, disposition review, file plan) and **adaptive policy scopes** — not in BP base.
- **Auto-apply retention labels via trainable classifier** — not in BP base.
- **Information Barriers, Customer Key, Customer Lockbox, Double Key Encryption, Advanced Message Encryption, Privileged Access Management** — not in BP base.
- **Content Explorer / data classification analytics** — not in BP base.
- **Entra ID P2** — no Identity Protection, no PIM, no risk-based Conditional Access, **no access reviews**. BP includes P1 only, so Conditional Access yes, access reviews no. `[MS-OFFICIAL]` https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing (checked 2026-08-28).
- **Entra ID Governance** (entitlement management, lifecycle workflows, ML access recommendations) — separate $7.00 add-on requiring a P1 or P2 base. `[MS-OFFICIAL]` same page.
- **Defender for Cloud Apps** (CASB / shadow-IT and OAuth app discovery) — not in BP base.
- **Defender for Identity, Defender for Endpoint P2, Defender for Office 365 P2** — not in BP base.
- **SharePoint Advanced Management** and therefore **Restricted Content Discovery** — not in BP base. See §2.4.

---

## 2. The gap SKUs — and the "can I even buy it on Business Premium?" question

### 2.1 The answer that most partners get wrong

Two different things are true at once, and conflating them is the classic error:

**(a) The enterprise E5 Compliance add-on cannot attach to Business Premium.** Microsoft 365 E5 Compliance lists Microsoft 365 E3 / Office 365 E3 + EMS E3 as prerequisites; Business Standard and Business Premium are not eligible prerequisite licences. `[COMMUNITY]` — multiple Microsoft Q&A threads (https://learn.microsoft.com/en-us/answers/questions/5490730/licensing-confirmation-request-e5-compliance-add-o and https://learn.microsoft.com/en-gb/answers/questions/5958076/, checked 2026-08-28) and `[PARTNER/RESELLER]` (office365itpros.com, https://office365itpros.com/2025/04/11/microsoft-e5-security-add-on/, checked 2026-08-28: "The Microsoft E5 Compliance add-on is not available for Business Premium (but that might change)"). I could not find a Microsoft Product Terms page stating this in one line — the evidence is the *absence* of Business plans from the eligible-base list. Tag the specific claim `[COMMUNITY]`, high confidence.

**(b) But Microsoft built SMB-specific equivalents.** Since September 2025 there are dedicated add-ons that attach to Business Premium. These are the SKUs you sell.

### 2.2 The Business Premium add-on family — the core of the upsell

`[MS-OFFICIAL]` — https://www.microsoft.com/en-us/security/pricing/small-medium-business/security-add-on-plans (checked 2026-08-28).

| Add-on SKU | List price | Base licence required |
| --- | --- | --- |
| **Microsoft Purview Suite for Microsoft 365 Business Premium** | **$10.00** paid yearly | Microsoft 365 Business Premium |
| **Microsoft Defender Suite for Microsoft 365 Business Premium** | **$10.00** paid yearly | Microsoft 365 Business Premium |
| **Microsoft Defender and Purview Suites for Microsoft 365 Business Premium** (combined) | **$15.00** paid yearly | Microsoft 365 Business Premium |

The seat cap is confirmed in the Purview service description footnote: **"Add-ons require a Microsoft 365 Business Premium base license and are capped at 300 seats total."** `[MS-OFFICIAL]` (Purview service description, Audit (Premium) section, checked 2026-08-28). The pricing page itself does not restate the cap.

**Defender Suite for Business Premium components** — Microsoft's own list `[MS-OFFICIAL]` (admin doc, checked 2026-08-28):

- **Microsoft Entra ID P2** — "adds advanced security and governance features with Microsoft Entra ID Protection and Microsoft Entra ID Governance"
- **Microsoft Defender for Identity**
- **Microsoft Defender for Endpoint Plan 2** — threat hunting, live response, six months device data retention
- **Microsoft Defender for Office 365 Plan 2** — AIR, attack simulation training, threat trackers, advanced hunting, Threat Explorer
- **Microsoft Defender for Cloud Apps** — "identify and manage shadow IT"

Note Microsoft's own wording says Entra ID P2 here "adds ... Microsoft Entra ID Governance". That is loose phrasing — the standalone Entra ID Governance SKU is a separate $7.00 product and P2 does not include entitlement management or lifecycle workflows. Treat "Governance" in that sentence as meaning P2's governance-adjacent features (access reviews, PIM), not the Entra ID Governance SKU. `[UNVERIFIED]` — I could not get Microsoft to disambiguate this on a single page, and it is a plausible source of a mis-sold expectation.

**Purview Suite for Business Premium components** — Microsoft's pricing page describes capabilities rather than SKU names: AI-powered DLP with classification and automatic safeguarding; automated classification, retention labelling and records management at scale; end-to-end message and attachment encryption; continuous control mapping / compliance posture; insider-risk detection and remediation. `[MS-OFFICIAL]`

A detailed component breakdown `[COMMUNITY]` — CIAOPS, https://blog.ciaops.com/2025/10/08/microsoft-defender-and-purview-suites-for-m365-business-premium-detailed-breakdown/ (checked 2026-08-28) — lists: Information Protection Premium (auto-labelling, Customer Key), advanced DLP (Teams + endpoints), Insider Risk Management, Communication Compliance, Records Management & Data Lifecycle Management, eDiscovery (Premium), Audit (Premium), full Compliance Manager, and DSPM for AI. That list is consistent with everything I could confirm in the service description, but only *some* rows are individually confirmed in first-party docs (Audit Premium is; see §2.3).

**Economics for the pitch:** Business Premium $22 + combined suites $15 = **$37/seat**, versus Microsoft 365 E5 at $60/seat. E5's remaining advantages over that stack are Power BI Pro, Teams Phone, Audio Conferencing, unlimited seats, and Security Copilot inclusion (§4).

### 2.3 Where the primary docs explicitly name the Business Premium add-ons — and where they don't

This matters enormously and is the trap most likely to bite you.

**Explicitly named `[MS-OFFICIAL]`:** the Audit (Premium) table in the Purview service description has a dedicated column headed "Microsoft Purview Suite for Business Premium, Microsoft Defender + Purview Suite for Business Premium", marked **Yes** for both Audit (Premium) and Audit (Premium) for Microsoft Copilot interactions.

**Not explicitly named:** almost every other table in that same service description names "Microsoft Purview Suite/EDU/GOV/FLW and Microsoft Defender + Purview Suite FLW" — the *enterprise* and *frontline* variants — without listing the Business Premium variants. That includes the tables for Insider Risk Management, Communication Compliance, Endpoint DLP, automatic sensitivity labelling, and **DLP to restrict Copilot from processing files and emails**.

Two readings are possible: (i) "Microsoft Purview Suite" is a family name and the Business Premium variant inherits, or (ii) the tables are literal and the Business Premium variant is genuinely narrower. Microsoft's marketing page for the SMB add-on *does* claim insider-risk detection and DLP classification, which supports reading (i). **I could not resolve this definitively.** `[UNVERIFIED]`

**Practical guidance:** before you commit a governance managed service to delivering DLP-for-Copilot-processing or Insider Risk on a Business Premium + Purview Suite tenant, prove it in a live tenant or get it in writing from your distributor. Do not sell the capability off the marketing bullet.

### 2.4 SharePoint Advanced Management and Restricted Content Discovery

SAM is **not** included in Business Premium, and not in E5 either. Two routes exist:

1. **Included with a Microsoft 365 Copilot licence at no extra cost** (announced Ignite 2024, effective early 2025). `[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license (checked 2026-08-28).
2. **Standalone add-on**, reported at $3.00/user/month `[PARTNER/RESELLER]` (o365hq.com, checked 2026-08-28). I could not confirm $3.00 on a Microsoft page — treat the number as `[UNVERIFIED]`.

**Restricted Content Discovery has a stricter condition than SAM itself.** SAM administration is available via a Copilot licence *or* the standalone SAM add-on, but RCD specifically requires the tenant to hold **at least one assigned Copilot licence**. `[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/sharepoint/restricted-content-discovery (checked 2026-08-28). So a Business Premium tenant with zero Copilot seats cannot use RCD even if it buys SAM standalone. This is the cleanest "you must buy Copilot before I can govern Copilot" moment in the whole stack, and it is worth putting on a slide.

RCD also has a limit you must disclose: it suppresses content from tenant-wide search and Copilot, but it **does not remove content from the search index** — Purview eDiscovery and auto-labelling still see it. It is a containment control, not a deletion control. `[MS-OFFICIAL]`

### 2.5 The other gap SKUs, priced

`[MS-OFFICIAL]` — https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing (checked 2026-08-28):

| SKU | Price | Prerequisite |
| --- | --- | --- |
| Entra ID P1 | $7.00 | — (included in Business Premium and E3) |
| Entra ID P2 | $10.00 | — (included in E5; in Defender Suite for BP) |
| **Entra ID Governance** | $7.00 | **Requires Entra ID P1 or P2** |
| **Entra Suite** | $12.00 | "A subscription to Microsoft Entra ID P1 or a package that includes Microsoft Entra ID P1 is required" |
| Entra Internet Access | $5.00 | — |
| Entra Private Access | $5.00 | — |
| Entra Workload ID | $3.00 per workload identity | — |

Because Business Premium includes P1, **Entra ID Governance and the Entra Suite are both legitimately purchasable on a Business Premium base.** That is a genuinely useful and under-sold fact: an SMB can get access reviews and entitlement management without touching E5. (Access reviews also come via P2 inside the Defender Suite for BP at $10 — usually the better buy if you want the Defender components too.)

**Defender for Cloud Apps standalone**: reported at $3.50/user/month annual `[PARTNER/RESELLER]`, with another source saying $5.00 `[PARTNER/RESELLER]`. Sources disagree; I could not confirm either figure on a Microsoft page. **Do not quote a price.** For an SMB the question is largely moot — DfCA is inside the $10 Defender Suite for Business Premium, which is almost certainly cheaper than buying it standalone plus the other components.

**Microsoft 365 E5 Security add-on** was made available to Business Premium tenants in April 2025 at $12/user/month, bundling Defender for Endpoint P2, Entra ID P2, Defender for Cloud Apps, Defender for Identity and Defender for Office 365 P2. `[PARTNER/RESELLER]` (office365itpros.com, checked 2026-08-28). That component list is **identical** to the Defender Suite for Business Premium at $10. It is very likely the same product renamed and repriced in the September 2025 SMB packaging, but I could not confirm that Microsoft retired the $12 E5 Security SKU for Business Premium. `[UNVERIFIED]` — check both in the Partner Center price list; if both are live, sell the $10 one.

---

## 3. Microsoft 365 Copilot licensing as of August 2026

### 3.1 The 2026 packaging change — this is the headline

At Build 2026 (2 June) Microsoft announced that Copilot stops being a promotional add-on for Business plans. **Effective 1 July 2026:** `[MS-OFFICIAL]` — Partner Center June 2026 announcements, "New Microsoft 365 Business with Copilot SKUs available July 1", https://learn.microsoft.com/en-us/partner-center/announcements/2026-june (checked 2026-08-28).

Quoting the announcement:

> "Promotional offers for **Microsoft 365 Business Standard with Copilot** and **Microsoft 365 Business Premium with Copilot** are transitioning into permanent subscriptions, with updated list pricing of **23.50 USD** and **32 USD** per user per month, respectively. New SKUs are available July 1, with price list preview starting June 1 in Partner Center."
>
> "**New promo** — Microsoft 365 Business Basic + Microsoft 365 Copilot Business: **21 USD** per user per month after a 25% off promo, which runs **through December 31, 2026**. There's no license/user minimum (1 – 300 licenses/users, annual subscription with annual billing)."
>
> "**Extended promo** — Microsoft 365 Copilot Business remains available as a standalone offering at **18 USD** per user per month after 15% promo, now extended **through December 31, 2026**. There's no license/user minimum (1 – 300 licenses/users, annual subscription with annual billing)."

### 3.2 Copilot price and prerequisite table

| SKU | Price | Prerequisite / notes | Tag |
| --- | --- | --- | --- |
| Microsoft 365 Copilot (enterprise) | $30.00 annual | Requires qualifying base: M365 E3, E5, Business Standard or Business Premium | `[PARTNER/RESELLER]` — the $30 figure is widely reported but I could not render it from Microsoft's own pricing page in this pass |
| **Microsoft 365 Copilot Business** (SMB add-on) | **$21.00 list; $18.00 after 15% promo through 31 Dec 2026**. Monthly-billing rate shown as $25.20 | Base must be **Business Basic, Business Standard or Business Premium**. **Max 300 seats/tenant. No seat minimum.** | `[MS-OFFICIAL]` |
| Microsoft 365 Business Standard with Copilot | $23.50 annual / $28.20 monthly | Permanent SKU from 1 Jul 2026; 1–300 seats | `[MS-OFFICIAL]` |
| Microsoft 365 Business Premium with Copilot | $32.00 annual / $38.40 monthly | Permanent SKU from 1 Jul 2026; 1–300 seats | `[MS-OFFICIAL]` |
| Microsoft 365 Copilot Chat | **$0 — included** with Business Basic, Business Standard, Business Premium, Apps for business and all enterprise plans | Web-grounded chat, enterprise data protection, IT controls, file upload, image generation, pay-as-you-go agents. **Cannot ground on tenant data.** | `[MS-OFFICIAL]` support page + `[PARTNER/RESELLER]` |
| Microsoft 365 E7 | $99.00 | Bundles E5 + Microsoft 365 Copilot + Agent 365 + Entra Suite. GA 1 May 2026 | `[PARTNER/RESELLER]` |

`[MS-OFFICIAL]` sources: Copilot pricing page https://www.microsoft.com/en-us/microsoft-365-copilot/pricing and Copilot Business FAQ https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-business-faq (both checked 2026-08-28; FAQ updated 2026-08-25).

### 3.3 Copilot Business — the rules you will actually hit

Direct from the Microsoft FAQ `[MS-OFFICIAL]` (checked 2026-08-28):

- **Definition of SMB:** "organizations with 300 or fewer users who hold a license for a Microsoft 365 Business Basic, Business Standard, or Business Premium plan."
- **Capability parity:** "The Copilot Business add-on delivers the same capabilities as the Microsoft Copilot offering." So this is not a cut-down Copilot — it is the same product at an SMB price.
- **Seat limit:** 300 per tenant. Above that, move to Microsoft 365 Copilot.
- **Term and billing:** "Copilot Business plans are available as an annual commitment with either monthly or annual billing; **there's no month-to-month purchasing agreement** for the Copilot Business plans." Monthly *billing* on an annual *term* is allowed; a monthly *term* is not.
- **No mid-term SKU swap:** an existing Microsoft Copilot customer "must wait until your annual purchase commitment ends to change plans", and existing Copilot licences will **not** auto-convert to Copilot Business at renewal.
- **A hard trap:** "If I have a Microsoft 365 Business Standard or Business Premium plan and the Copilot Business add-on, can I upgrade to an Enterprise plan? **No.** You can't upgrade to an Enterprise plan from a Microsoft 365 Business Standard or Business Premium plan with Copilot Business. You must wait until your commitment end date to move to an Enterprise plan." **This locks a growing SMB out of the E3/E5 path for up to twelve months.** If the customer is anywhere near 300 seats or has a funded compliance requirement, think hard before attaching Copilot Business.
- Copilot Business can attach to Microsoft 365 for business plans **without Teams**.
- Shared Computer Activation is supported.

### 3.4 CSP term, billing and promotional levers

- **7-day cancellation window** on new-commerce subscriptions; no mid-term seat reductions. `[PARTNER/RESELLER]`
- **Three-year CSP purchasing option for Microsoft 365 Copilot** introduced May 2026. From **1 June 2026**, eligible CSP partners can offer **15% off net partner price** for customers committing to the three-year option with **300+ licences**, through **30 September 2026**. Billing is triennial commitment with annual billing. `[MS-OFFICIAL]` — Partner Center June 2026 announcements (checked 2026-08-28). Note the 300+ threshold puts this out of reach for most of the 25–300 seat band — it is an enterprise lever, not an SMB one.
- **30-day Copilot Business trial** launched 1 August 2026 through CSP: free 25-seat trial, auto-renews to paid by default (25 seats), 7-day cancellation window; partners can adjust renewal seat count, term and billing before conversion. `[PARTNER/RESELLER]` (a competing distributor, checked 2026-08-28). **The auto-renew default is a client-relationship landmine — diary it.**
- **Cost-of-capital uplift:** from **1 October 2026**, a **5% premium** applies to **annual-term CSP software subscriptions billed monthly** (SQL Server, Windows Server, CALs, System Center). Applies at renewal on or after that date. `[MS-OFFICIAL]` — Partner Center August 2026 announcements, https://learn.microsoft.com/en-us/partner-center/announcements/2026-august (checked 2026-08-28). Note the scope: as announced this targets **software** subscriptions. Whether an equivalent uplift lands on online-services annual-term-monthly-billing is **not confirmed** — several reseller blogs describe it more broadly. `[UNVERIFIED]`

### 3.5 Agent consumption — Copilot Credits

Copilot Credits are now the unified consumption currency across Copilot Studio, Copilot Cowork, Microsoft Scout and the Work IQ API. `[MS-OFFICIAL]` — Partner Center June 2026 announcements (checked 2026-08-28).

- **$0.01 per credit** pay-as-you-go, or **$0.008 per credit** prepaid via a **$200/month capacity pack of 25,000 credits**. Break-even is 20,000 credits/month. `[PARTNER/RESELLER]` — multiple independent sources agree; I could not render Microsoft's own credit price page in this pass.
- Microsoft changed the billing unit from "messages" to "Copilot Credits" on 1 September 2025, with no change to pack quantity or PAYG rate. `[PARTNER/RESELLER]`
- **Copilot Cowork requires a Microsoft 365 Copilot licence *and* usage-based billing with Copilot Credits.** `[MS-OFFICIAL]`
- **Work IQ API (GA 16 June 2026)** is billed purely on Copilot Credits — "There's no separate Work IQ API subscription, SKU, or per-user license." Critically: "For users accessing Microsoft 365 Copilot prebuilt agents, Work IQ usage is covered by licensing, and no Copilot Credits are required." Charges arise when users invoke **custom** agents built in Copilot Studio, Foundry or third-party platforms grounded in M365 data. `[MS-OFFICIAL]`
- **Copilot Chat includes pay-as-you-go agents** — an admin can switch these on without licensing every user. `[PARTNER/RESELLER]` This is the ungoverned-spend vector to raise in every assessment: an unlicensed Copilot Chat tenant can still incur unbounded agent charges.

### 3.6 Agent 365 — a new licensing prerequisite worth flagging

Effective **1 June 2026**, Microsoft introduced a licence prerequisite for **new** Agent 365 purchases: `[MS-OFFICIAL]` — Partner Center June 2026 announcements (checked 2026-08-28).

> "For new Agent 365 purchases beginning June 1: ... **Small and medium-sized business (SMB) customers must have Microsoft 365 Business Premium.**" (Enterprise customers must have Microsoft 365 E5.) "Customers without these prerequisite licenses may not have access to certain Agent 365 capabilities."

Agent 365 is reported at **$15/user/month standalone**, licensed **per user, not per agent** — one user licence covers every agent that person interacts with, manages, owns or sponsors. `[PARTNER/RESELLER]` (SAMexpert, checked 2026-08-28). Microsoft's Purview service description adds: "Microsoft Purview security and compliance capabilities for agents on Microsoft Foundry and Entra-connected AI apps will be supported by **Microsoft 365 E7 and Agent365 SKUs**." `[MS-OFFICIAL]`

**Read that last line carefully.** Purview governance *of agents outside Microsoft 365* is gated behind E7 or Agent 365. A Business Premium + Purview Suite tenant does not get it.

### 3.7 Microsoft 365 Premium

**Microsoft 365 Premium exists, but it is a consumer SKU**, launched October 2025 at $19.99/month, bundling M365 Personal/Family apps with Copilot, up to 6 TB OneDrive and advanced security. It replaced the retired standalone Copilot Pro. `[PARTNER/RESELLER]` It is **not** a commercial SKU and has no place in this motion. If a customer raises it, that is a signal they are reading consumer marketing.

---

## 4. Security Copilot — and why it is not an SMB motion

**Pricing** `[MS-OFFICIAL]` — https://www.microsoft.com/en-us/security/pricing/microsoft-security-copilot (checked 2026-08-28):

- **Provisioned SCU: $4.00 per SCU per hour**, minimum 1 SCU, priced hourly and billed monthly.
- **Overage SCU: $6.00 per SCU**, billed on usage.

**The arithmetic that ends the conversation.** One provisioned SCU running continuously is 24 × 30.4 × $4 ≈ **$2,920/month**, roughly $35,000/year. For a 100-seat SMB that is more than the entire Microsoft 365 spend. Provisioned capacity bills whether or not you use it — Microsoft's own worked example in the docs shows a customer using 3.5 SCUs across two hours being billed for 10.

**The inclusion model is E5/E7 only.** `[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/copilot/security/security-copilot-inclusion (checked 2026-08-28, page ms.date 2026-06-19):

> "Customers with Microsoft 365 E5 and E7 will have **400 Security Compute Units (SCU) each month for every 1,000 paid user license**, up to 10,000 SCUs each month at no additional cost."

It scales down below 1,000 licences (400 users → 160 SCUs/month), there is no minimum licence count, SCUs reset monthly and do not roll over, and provisioning is automatic ("zero click activation"). **Business Premium is not eligible** — eligibility is stated as "All Microsoft 365 E5 and E7 customers", and Sentinel customers without E5/E7 are explicitly excluded.

**For MSPs**, the same page states: if an MSP deploys Security Copilot for a customer who is on E5 or E7, that customer "is no longer separately billed for Security Copilot".

**Verdict for this practice guide:** Security Copilot is realistic for SMB partners only in the narrow case where a customer has already gone to E5 or E7. For the 25–300 seat Business Premium majority it is not a viable line item, and quoting provisioned SCUs to them will lose the deal. Say so plainly rather than leaving it as an option on the menu.

---

## 5. Partner-side licensing and access

### 5.1 CSP and Partner Center

Microsoft 365 Lighthouse is available to partners enrolled in the **CSP program**, both indirect resellers and direct-bill partners. `[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/microsoft-365/lighthouse/m365-lighthouse-requirements (checked 2026-08-28).

**Customer tenant requirements for full Lighthouse functionality** `[MS-OFFICIAL]`:

- At least one Enterprise, Business, Frontline or Education subscription of Microsoft 365, Office 365, Exchange Online, Windows 365 Business, or Microsoft Defender for Business
- **No more than 2,500 licensed users**
- Resident in the same geographic region (Americas / EU / Asia+Australia) as the managing partner
- **GDAP or a legacy DAP relationship** is required for onboarding

Tenants that do not meet these get only a limited experience: GDAP setup and management, user search, user details, tenant tagging and service health.

**A specific gotcha for the assessment motion:** for customer data to appear in Lighthouse's Risky users, MFA and SSPR reports, the customer tenant must hold **Entra ID P1 or later**. Business Premium clears this; Business Basic and Business Standard do not. So a Business Standard prospect is partly invisible in your multi-tenant tooling — which is itself a good reason to lead the upsell with Business Premium.

Lighthouse also ships a **GDAP setup wizard** with role recommendations by MSP job function and reusable GDAP templates. `[MS-OFFICIAL]`

### 5.2 GDAP roles for running an AI governance assessment

`[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/partner-center/customers/gdap-least-privileged-roles-by-task and https://learn.microsoft.com/en-us/partner-center/customers/gdap-supported-workloads (both checked 2026-08-28).

A least-privilege, read-mostly set for a Copilot readiness / AI governance assessment:

| Assessment task | Least-privileged GDAP role |
| --- | --- |
| Read everything a Global Admin can see, without change rights | **Global Reader** |
| Defender XDR portal — incidents, advanced hunting, threat analytics, DfCA/DfI/MDE signal | **Security Reader** |
| Read security policies across Microsoft 365 (including DLP policy discovery) | **Security Reader** |
| Intune / endpoint posture read | **Intune Administrator**, **Global Reader**, **Reports Reader**, or **Security Reader** (all supported for Intune) |
| SharePoint admin centre — sites, sharing policies, access control | **SharePoint Administrator** or **Global Reader** |
| Exchange admin centre read | **Global Reader** (also Exchange Administrator, Security Administrator) |
| Purview — Audit, Compliance Manager, MIP/DLP, DLM, Records Management | **Compliance Administrator** (see the caveat below) |
| Directory/licence inventory | **Directory Readers** |
| Lighthouse multi-tenant access | Lighthouse honours whatever GDAP roles you hold; supported set includes Global Reader, Security Reader, Security Operator, Compliance Administrator, Intune Administrator, Conditional Access Administrator |

**Recommended assessment bundle:** Global Reader + Security Reader, escalating to SharePoint Administrator only where you need to read site-level sharing and sensitivity-label configuration. Everything else in an assessment should be read-only.

**Two GDAP limitations that will actually break your assessment:**

1. **Purview compliance roles need a user object in the customer tenant.** GDAP grants role-based permissions without creating a user object in the customer's Entra directory, but Purview compliance role groups require the identity to exist in the tenant (member or guest) before it can be assigned Compliance Administrator or Audit Reader and successfully retrieve audit data. The workaround is to add the partner engineer as a **guest** in the customer tenant and assign the Purview role explicitly, in addition to GDAP. `[COMMUNITY]` — Microsoft Q&A threads at https://learn.microsoft.com/en-us/answers/questions/5605544/ and https://learn.microsoft.com/en-us/answers/questions/2276172/ (checked 2026-08-28). Microsoft's GDAP supported-workloads page does list Purview Audit as supported *but* flags **"Search audit log"** as an issue — consistent with the community reports. Plan for guest accounts and get the customer's consent in the engagement letter.
2. **Named GDAP gaps in the Purview workload** `[MS-OFFICIAL]`: **Content Explorer ("View labeled content in Content Explorer") is not supported**, nor is creating/managing **Trainable Classifiers**, nor **groups and sites label support**, nor **disposition management**, nor **archiving / PST import**. Content Explorer is the single most useful surface for an oversharing assessment. Budget for a customer-tenant account to run it.
3. Also worth knowing: partners with **Security Reader or Global Reader via GDAP get a "No Access" error** on Entra Roles and administrators in a tenant with **PIM enabled** — only Global Administrator works. `[MS-OFFICIAL]` And SharePoint GDAP roles deliberately cannot edit files or file/folder permissions in customer sites, closed as a security risk.

### 5.3 Security Copilot via GDAP

Security Copilot supports GDAP for the standalone portal, with **Security Operator** or **Security Reader** recommended — but the customer must perform an extra step to map the GDAP role to a Security Copilot role, and individual plugins may not support GDAP. Embedded Security Copilot experiences inherit GDAP support from the host workload (so Security Copilot in Purview and in Defender XDR work). `[MS-OFFICIAL]`

### 5.4 Partner internal-use / NFR licences for demo

Partner benefit packages (Partner Success Launch / Core / Expanded, plus Solutions Partner designations and specializations) include product licences for the partner's **own internal use**. `[MS-OFFICIAL]` — https://learn.microsoft.com/en-us/partner-center/benefits/mpn-benefits-software (checked 2026-08-28). Two constraints matter:

- Licences are **not perpetual** — "You're entitled, and have the right, to use the licenses only during your membership."
- As of 13 February 2026 Microsoft added product licences across all benefit tiers, and FY26 partners can **split or combine benefit packages across multiple tenants**. `[PARTNER/RESELLER]`

**I could not confirm** the specific FY27 quantities of Microsoft 365 Copilot, Business Premium, or the Business Premium Defender/Purview Suites in each benefit package, nor whether internal-use licences may lawfully be used to run *customer-facing demos* as opposed to internal operations. The Terms of Participation Guide (https://assetsprod.microsoft.com/mpn/en-us/microsoft-ai-cloud-partner-program-terms-of-participation-guide.pdf) is the authority. `[UNVERIFIED]` — **check this before you build a demo tenant strategy on it.** The general rule in prior years has been that internal-use rights cover demonstration to prospects but not production use for customers; do not assume that survived FY27 unchanged.

---

## 6. Entitlement matrix — governance capability by SKU

Columns: **BS** = Business Standard · **BP** = Business Premium · **BP+P** = BP + Purview Suite for Business Premium · **BP+D** = BP + Defender Suite for Business Premium · **E3** = Microsoft 365 E3 · **E5** = Microsoft 365 E5.

Legend: **Y** = entitled · **N** = not entitled · **P** = partial · **?** = documented ambiguously (see notes).

| Governance capability | BS | BP | BP+P | BP+D | E3 | E5 | Where documented |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **DSPM for AI** (full: content capture, one-click policies) | N | P | ? | N | N | Y | Purview svc desc + DSPM considerations page¹ |
| **Sensitivity labels — manual** | N² | **Y** | Y | Y | Y | Y | Purview svc desc, sensitivity labelling table (BP named) |
| **Auto-labelling — client & service-side** | N | **N** | ? | N | N | **Y** | Purview svc desc: "requires a Microsoft 365 E5 license or ... IPG" |
| **DLP — Exchange / SPO / OneDrive** | N | **Y** | Y | Y | Y | Y | Purview svc desc, DLP EXO/SPO/ODB (BP named) |
| **DLP for Copilot — safeguard prompts** | **Y** | **Y** | Y | Y | Y | Y | Purview svc desc: "available to all users of Microsoft Copilot and Copilot Chat" |
| **DLP for Copilot — restrict Copilot processing labelled files/email** | **N** | **N** | ? | N | **N** | **Y** | Purview svc desc, DLP for Microsoft Copilot table — BS/BP **and E3** all marked No |
| **Endpoint DLP** | N | N | ? | N | N | Y | Purview svc desc, Endpoint DLP table |
| **Restricted Content Discovery** | N | N³ | N³ | N³ | N³ | N³ | learn.microsoft.com/sharepoint/restricted-content-discovery — needs SAM **and** ≥1 assigned Copilot licence |
| **SharePoint Advanced Management** | N | N | N | N | N | N | Included with M365 Copilot licence, or standalone add-on |
| **Insider Risk Management** | N | N | ? | N | N | Y | Purview svc desc, IRM table |
| **Communication Compliance** | N | N | ? | N | N | Y | Purview svc desc, CC table |
| **Defender for Cloud Apps — shadow-IT discovery** | N | **N** | N | **Y** | N | Y | Defender Suite for BP admin doc |
| **Conditional Access** (Entra P1) | N | **Y** | Y | Y | Y | Y | Entra pricing page — P1 in BP and E3 |
| **Risk-based CA / Identity Protection / PIM** (Entra P2) | N | N | N | **Y** | N | Y | Defender Suite for BP admin doc; Entra pricing |
| **Access reviews** (Entra P2) | N | **N** | N | **Y** | N | Y | Entra pricing page |
| **Entitlement management / lifecycle workflows** (Entra ID Governance) | N | N⁴ | N⁴ | N⁴ | N⁴ | N⁴ | Separate $7 SKU; requires P1/P2 base — **purchasable on BP** |
| **Audit (Standard)** incl. Copilot interactions | Y | **Y** | Y | Y | Y | Y | Purview svc desc, Audit (Standard) table |
| **Audit (Premium)** — 1-year retention, Copilot audit records | N | **N** | **Y** | N | N | Y | Purview svc desc, Audit (Premium) table — **BP add-on named explicitly** |
| **Retention policies & labels (basic)** | P⁵ | **Y** | Y | Y | Y | Y | Purview svc desc, retention licensing |
| **Records management / adaptive scopes / trainable-classifier auto-apply** | N | N | ? | N | N | Y | Purview svc desc, retention licensing |
| **eDiscovery (standard)** | Y | Y | Y | Y | Y | Y | Purview svc desc, eDiscovery table |
| **eDiscovery (premium)** | N | N | ? | N | N | Y | Purview svc desc, eDiscovery table |
| **Purview governance of agents outside M365** (Foundry, Entra-connected AI) | N | N | N | N | N | N⁶ | Purview svc desc: "supported by Microsoft 365 E7 and Agent365 SKUs" |
| **Security Copilot included capacity** | N | **N** | N | N | **N** | **Y** (400 SCU / 1,000 licences) | security-copilot-inclusion page |

**Notes**

1. DSPM for AI on Business Premium without add-ons gives a limited experience — the DSPM for AI page renders and some insights appear, and you can label data and apply DLP to Copilot to restrict *labelled* content, but one-click policies that rely on Insider Risk or Communication Compliance do not function and you cannot capture prompt/response content. `[COMMUNITY]` (CIAOPS and practitioner blogs, checked 2026-08-28). Microsoft's DSPM prerequisites page confirms the mechanics — Copilot licences assigned, auditing on, collection policies, device onboarding, Purview browser extension, and pay-as-you-go billing for non-Microsoft AI apps — but does not give a per-SKU entitlement table. `[MS-OFFICIAL]` https://learn.microsoft.com/en-us/purview/dspm-for-ai-considerations (checked 2026-08-28).
2. Business Standard is absent from the entitled column for manual sensitivity labelling in the Purview service description, which lists "Microsoft 365 E5/A5/G5/E3/A3/G3/F1/F3/**Business Premium**". Business Standard's information-protection story is essentially empty — this is the strongest single argument for the Standard → Premium step-up.
3. RCD is available in any of these **only if** the tenant holds SAM (via a Copilot licence or the standalone add-on) **and** at least one assigned Copilot licence. It is a Copilot-attach control, not a base-SKU control.
4. Not *included* in any of these, but **purchasable** on any of them, because all include Entra ID P1. This is the row partners most often get wrong in the pessimistic direction.
5. Business Standard gets Teams-channel/chat retention only where the retention or deletion period exceeds 30 days; it is named for Teams locations but not for general retention-policy user rights. `[MS-OFFICIAL]`
6. E5 alone does not cover it; E7 or the Agent 365 SKU does. Agent 365 requires Business Premium (SMB) or E5 (enterprise) as a prerequisite for new purchases from 1 June 2026.

**Every "?" in the BP+P column is the §2.3 ambiguity**: the Purview service description names the enterprise/frontline "Microsoft Purview Suite" variants in those tables without naming the Business Premium variant, while Microsoft's SMB marketing page claims the capabilities. Resolve per-tenant before you sell.

---

## 7. The trap list

**1. Business Standard is not a governance base.** No sensitivity labels, no DLP, no Entra P1, no Intune, and it is invisible to Lighthouse's identity reports. You cannot deliver a credible AI governance assessment on Business Standard. Step-up to Business Premium is the mandatory first move, not an upsell you can defer.

**2. E3 is not the compliance answer either.** The DLP-for-Copilot-processing row is **No** for E3 as well as Business Premium. A customer who steps up to E3 for "enterprise compliance" and expects to block Copilot from grounding on labelled content has bought the wrong thing. The control lives in E5 / the Purview Suite family / the IPG SKU.

**3. "The feature works but the licence doesn't cover it."** Purview and Defender features are largely **tenant-activated**. The Purview service description is unusually blunt: "Though some tenant services are currently not capable of limiting benefits to specific users, appropriate subscription licenses are required for use of each online service." Auditing, eDiscovery and Information Protection are "enabled at the tenant level for all users within the tenant" by default. Meaning: a tenant with a handful of E5 seats can *technically* run a policy across all 200 users, and be out of compliance the entire time. Microsoft's guidance is that "any user benefiting from the service requires a license", and it enumerates who counts as benefiting: users with a Purview role, mailbox/OneDrive/Teams-chat/device owners covered by a policy, and — for shared locations like SharePoint sites, M365 Groups and Teams channels — **owners and members**, though visitors and view-only users do not. This is the audit exposure to name explicitly in your governance managed-service scope.

**4. Mixed-SKU tenants are legal but operationally hostile.** Mixing Business and Enterprise plans in one tenant is explicitly permitted. But tenant-level features then behave inconsistently, per-user entitlement checks silently no-op for unlicensed users, and your "why isn't this policy applying" tickets multiply. Insist on a licence-inventory step in every assessment, and report it as a distribution, not a headline count.

**5. The 300-seat wall has a Copilot Business tripwire attached.** Growing past 300 forces a move to Enterprise plans for the excess. But if the customer has **Copilot Business** attached, Microsoft's FAQ says you **cannot** upgrade to an Enterprise plan until the commitment end date. A 280-seat customer on Business Premium + Copilot Business who hires 40 people in Q2 is stuck. Sequence the conversation: if growth to 300+ is plausible inside twelve months, do not attach Copilot Business — attach Microsoft 365 Copilot on an enterprise-compatible footing instead.

**6. Copilot Business ≠ Microsoft 365 Copilot for billing purposes even though it is for features.** Same capabilities per Microsoft, but no auto-conversion at renewal, no mid-term plan change, and 300-seat cap. Two customers with identical Copilot experiences can be on completely different upgrade paths.

**7. Restricted Content Discovery requires a Copilot licence in the tenant.** You cannot pre-remediate oversharing with RCD before the customer buys Copilot. Plan the remediation sequence around this, or use SAM's other controls plus sensitivity labels.

**8. RCD does not remove content from the index.** eDiscovery and auto-labelling still reach restricted sites. Do not describe it to a customer as making content "invisible".

**9. Ungoverned agent spend on a free tier.** Copilot Chat is free with every Business plan and admins can enable **pay-as-you-go agents** without licensing users. Copilot Credits at $0.01 each have no natural ceiling. A tenant with zero Copilot licences can still generate a surprising invoice. Include agent-billing configuration in the assessment scope.

**10. The Copilot Business trial auto-renews.** 25 seats, annual commitment, 7-day cancellation window. Diary it at day 20.

**11. Content Explorer is not available over GDAP.** The best oversharing-evidence surface requires a guest account in the customer tenant. Get that into the engagement letter up front rather than discovering it mid-assessment.

**12. Purview audit access over GDAP needs a tenant user object.** Same fix, same reason. `[COMMUNITY]`

**13. PIM breaks GDAP reader roles for Entra role review.** Global Reader and Security Reader hit "No Access" on Entra Roles and administrators in PIM-enabled tenants. `[MS-OFFICIAL]`

---

## 8. CSP price-change cadence and 2026 price movements

- **1 July 2026** — global Microsoft 365 pricing and packaging update across all channels including CSP; announced 4 December 2025. Applies at each subscription's next renewal on or after that date. `[MS-OFFICIAL]`
- **1 July 2026** — Business Standard with Copilot ($23.50) and Business Premium with Copilot ($32.00) become permanent SKUs. `[MS-OFFICIAL]`
- **1 October 2026** — 5% cost-of-capital uplift on annual-term CSP **software** subscriptions billed monthly, at renewal on or after that date. `[MS-OFFICIAL]`
- **Monthly operational cadence** — CSP price changes occur on a monthly cadence, with a price-list preview published in advance. Note that **no NCE license-based preview price list was published on 1 July 2026** for the August preview. `[MS-OFFICIAL]`
- **Annual local-currency updates every January from FY27.** Microsoft has moved from twice-yearly FX-driven local-currency adjustments to a single annual update. "The next local currency update will be effective **January 1, 2027**, and occur annually on this date, except in limited exceptional circumstances. Notifications ... will be issued in advance every **November**." `[PARTNER/RESELLER]`, corroborated by multiple CSP sources; the underlying announcement is in the Partner Center July 2026 announcements. **For non-US partners this is the single most important planning date in this document.**
- **Promotions live now:** Copilot Business at $18 (15% off) through 31 December 2026; Business Basic + Copilot Business at $21 (25% off) through 31 December 2026; Purview Suite for Business Premium at 50% off when bought with Business Premium and Copilot Business or Microsoft 365 Copilot, 1 December 2025 – 31 December 2026 `[PARTNER/RESELLER]`; 15% off three-year Copilot commitments at 300+ licences through 30 September 2026 `[MS-OFFICIAL]`.

---

## 9. The recommended upsell ladder for this motion

1. **Business Standard → Business Premium** (+$8). Non-negotiable. Buys Entra ID P1 + Conditional Access, Intune P1, Defender for Business, Defender for Office 365 P1, sensitivity labels and DLP. Without it there is no assessment to run and no service to manage.
2. **Business Premium → + Copilot** ($22 → $32 bundled, or +$18–21 as Copilot Business). Buys the AI capability *and* SharePoint Advanced Management, which unlocks Restricted Content Discovery and the SAM governance controls. Check the 300-seat trajectory first (trap 5).
3. **+ Purview Suite for Business Premium** (+$10, 50% off through Dec 2026 when bought with Copilot). Buys Audit (Premium) — confirmed — plus the claimed Insider Risk, Communication Compliance, auto-labelling, records management and DSPM for AI. **Verify the specific capability you are selling.**
4. **+ Defender Suite for Business Premium** (+$10, or +$15 for both suites). Buys Entra ID P2 (access reviews, PIM, risk-based CA), Defender for Cloud Apps (shadow-AI discovery — directly relevant to AI governance), DfE P2, DfO P2, Defender for Identity.
5. **Optional: Entra ID Governance** (+$7) for entitlement management and access reviews at scale — purchasable on the P1 in Business Premium.
6. **Only at 300+ seats, or where E5-exclusive capability is genuinely required: step to E3/E5.** Business Premium + both suites is $37 versus E5 at $60. E5 buys unlimited seats, Power BI Pro, Teams Phone, and Security Copilot inclusion.
7. **Agent 365** ($15) once the customer runs custom agents — requires Business Premium as the SMB prerequisite from 1 June 2026.

---

## 10. Things I could not verify

Listed so nothing here is mistaken for confirmed.

1. **Base Business Premium at $22.00 post-1-July-2026 from a Microsoft page.** The Microsoft compare page now renders the Copilot bundle price ($32). $22.00 is `[PARTNER/RESELLER]` consensus only. Confirm in the Partner Center price list.
2. **Microsoft's own price table for the July 2026 uplift.** The licensing-news FAQ points to a linked table that would not render. E3 $39 / E5 $60 and Business Basic $7 / Standard $14 are `[PARTNER/RESELLER]` consensus, not first-party-confirmed.
3. **Microsoft 365 Copilot enterprise at $30.** Widely reported; the Microsoft pricing page rendered only the Business-tier plans in this pass.
4. **Whether "Microsoft Purview Suite" in the service description tables includes the Business Premium variant.** The Audit (Premium) table names it explicitly; Insider Risk, Communication Compliance, auto-labelling, Endpoint DLP, eDiscovery Premium and DLP-for-Copilot-processing do not. **This is the highest-value open question in the dossier** and directly determines whether a $37/seat Business Premium stack can do real Copilot data governance or only partial.
5. **Whether the $12 Microsoft 365 E5 Security add-on for Business Premium and the $10 Defender Suite for Business Premium are the same product**, and whether both are currently orderable.
6. **SharePoint Advanced Management standalone at $3.00.** `[PARTNER/RESELLER]` only.
7. **Defender for Cloud Apps standalone price.** Sources disagree ($3.50 vs $5.00). Do not quote.
8. **Copilot Credits at $0.01 / $0.008 and the $200/25,000 pack** from a Microsoft page. `[PARTNER/RESELLER]` consensus only.
9. **Agent 365 at $15/user/month.** `[PARTNER/RESELLER]` only; the E5/Business Premium prerequisite is `[MS-OFFICIAL]`.
10. **Microsoft 365 E7 at $99 and its GA date of 1 May 2026.** `[PARTNER/RESELLER]`; the *existence* of E7 and its Security Copilot inclusion are `[MS-OFFICIAL]`.
11. **Whether the 1 October 2026 5% monthly-billing uplift extends beyond software subscriptions to online services.** As announced it names software (SQL Server, Windows Server, CALs, System Center). Reseller commentary implies broader scope.
12. **The exact 300-seat enforcement mechanism** (real-time block at seat 301). Microsoft states only that it "reserves the right to enforce".
13. **FY27 partner internal-use licence quantities**, and whether internal-use rights permit customer-facing demonstration. Check the Terms of Participation Guide before designing a demo-tenant strategy.
14. **Whether the Purview GDAP guest-account requirement for audit access has been fixed in 2026.** The community reports are recent and the GDAP supported-workloads page still flags "Search audit log" as an issue, but that page's ms.date is 2025-03-19 and may be stale.
15. **Business Premium mailbox moving to 100 GB** in the July 2026 packaging change. `[PARTNER/RESELLER]`.

---

## Appendix — primary sources, all checked 2026-08-28

| Topic | URL |
| --- | --- |
| 300-seat limit, plan families, mixing plans | https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-plan-options |
| Purview entitlements by SKU (the master table) | https://learn.microsoft.com/en-us/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-purview-service-description |
| Business Premium components; Defender Suite for BP | https://learn.microsoft.com/en-us/microsoft-365/admin/security-and-compliance/add-defender-suite-business-premium |
| SMB security add-on prices | https://www.microsoft.com/en-us/security/pricing/small-medium-business/security-add-on-plans |
| Copilot Business FAQ (eligibility, 300 cap, term/billing, no-enterprise-upgrade) | https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-business-faq |
| Copilot plans and pricing | https://www.microsoft.com/en-us/microsoft-365-copilot/pricing |
| Business with Copilot SKUs, promos, Copilot Credits, Agent 365 prerequisite | https://learn.microsoft.com/en-us/partner-center/announcements/2026-june |
| 5% monthly-billing uplift, Oct 2026 | https://learn.microsoft.com/en-us/partner-center/announcements/2026-august |
| July 2026 packaging/pricing FAQ | https://www.microsoft.com/en-us/licensing/news/2026-m365-packaging-pricing-updates-faq |
| Entra prices and prerequisites | https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing |
| Security Copilot SCU pricing | https://www.microsoft.com/en-us/security/pricing/microsoft-security-copilot |
| Security Copilot E5/E7 inclusion, 400 SCU/1,000 licences | https://learn.microsoft.com/en-us/copilot/security/security-copilot-inclusion |
| SAM included with Copilot licences | https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license |
| Restricted Content Discovery | https://learn.microsoft.com/en-us/sharepoint/restricted-content-discovery |
| DSPM for AI prerequisites | https://learn.microsoft.com/en-us/purview/dspm-for-ai-considerations |
| GDAP least-privileged roles | https://learn.microsoft.com/en-us/partner-center/customers/gdap-least-privileged-roles-by-task |
| GDAP supported workloads and gaps | https://learn.microsoft.com/en-us/partner-center/customers/gdap-supported-workloads |
| Lighthouse requirements | https://learn.microsoft.com/en-us/microsoft-365/lighthouse/m365-lighthouse-requirements |
| Partner software benefits | https://learn.microsoft.com/en-us/partner-center/benefits/mpn-benefits-software |
