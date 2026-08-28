# The Third-Party and ISV Tooling Ecosystem for AI Governance, Shadow-AI Discovery and M365 Data-Security Posture

**Research dossier for a Microsoft partner (MSP/CSP) practice guide — SMB market, 25–300 seats**
**Compiled 28 August 2026. All external claims carry a URL and a source tag.**

Source tags used throughout:
`[VENDOR-OFFICIAL]` vendor's own site or documentation · `[MARKETPLACE]` distributor/marketplace listing or public framework price list · `[PRACTITIONER/COMMUNITY]` independent practitioner or community writing · `[PRESS]` trade press or newswire · `[UNVERIFIED]` aggregator, SEO comparison site, or second-hand figure that could not be corroborated against a primary source.

---

## 0. Executive framing: the pricing-opacity problem

Before any of the detail below, the single most important honest finding of this research:

**Almost nothing in this category publishes a real price.** AvePoint, CoreView, Varonis, Rencore, ProvisionPoint, ShareGate Protect, Hornetsecurity 365 Permission Manager, Augmentt, Torii, Zluri, Josys, Cynomi and AvePoint's own AgentPulse all route the buyer to "request pricing." AvePoint's public pricing page states only that the model "flexes to your unique business needs" and can be "based on user count or the amount of data" ([VENDOR-OFFICIAL], https://www.avepoint.com/pricing, fetched 28 Aug 2026).

There are four honourable exceptions where genuine list prices exist and can be quoted with confidence:

1. **Public-sector framework price lists.** AvePoint's non-US framework pricing document is a full published SKU-by-SKU list price schedule ([MARKETPLACE], https://assets.applytosupply.digitalmarketplace.service.gov.uk/a public-sector framework-14/documents/92220/660786558656601-pricing-document-2024-05-03-0934.pdf, document dated 3 May 2024). It is the only place this research found AvePoint numbers attached to named SKUs. Caveats: sterling, ex-VAT, non-US public sector, dated 2024, and almost every SKU carries a **500-user minimum** — which is the single most consequential fact in this entire dossier for a 25–300 seat practice.
2. **Self-serve SaaS vendors** who genuinely publish: Syskit, Orchestry, ShareGate Migrate, Nudge Security, ManageEngine, Chrome Enterprise Premium, CIPP.
3. **Perpetual/tiered on-prem tooling** (ManageEngine) where a price grid is published by user band.
4. **Open source**, which is free and therefore trivially priceable.

Everything else in this document should be treated as "budgetary" and re-quoted. Where this dossier repeats a figure from an aggregator or comparison site, it is tagged `[UNVERIFIED]` and should not be put in front of a client.

---

## 1. AvePoint

### 1.1 What the portfolio actually is in 2026

AvePoint's public architecture is now a single umbrella — the **AvePoint Confidence Platform** — with a separate multi-tenant edition for the channel, **AvePoint Elements**. The August 2026 platform update post names the current product set ([VENDOR-OFFICIAL], https://www.avepoint.com/blog/solutions-blog/avepoint-updates-august-2026, published Aug 2026):

| Product | What it does | Relevance to a Copilot readiness / oversharing engagement |
|---|---|---|
| **AgentPulse (Command Center)** | Discovers AI agents, identifies owners, monitors usage, surfaces governance gaps; multicloud (M365 + Google Cloud) | The AI-governance-specific SKU. Agent inventory, agent-driven oversharing, pay-per-use cost exposure |
| **AvePoint Insights** | Centralised discovery and monitoring of permissions, sensitive data and now M365 agents, with risk assessment | The oversharing discovery engine — item-level exposure reporting across SharePoint, Teams, OneDrive, Groups |
| **AvePoint Policies** | Policy enforcement and drift remediation, including agent-ownership and channel-ownership governance | The "keep it fixed" half of the motion; converts a one-off remediation into a standing control |
| **AvePoint EnPower** | Entra/M365 administration, sensitive-access monitoring, and now AI-agent lifecycle management (agent timeline reports, renewal, automated governance workflows) | Identity/access hygiene and agent lifecycle |
| **AvePoint Opus** | Records management, information lifecycle, content classification, retention and disposal; AI recommendations for governance frameworks; file-share discovery | ROT (redundant/obsolete/trivial) cleanup — improves Copilot answer quality and shrinks the exposure surface |
| **AvePoint Cense** | Microsoft licence optimisation and cost visibility; in 2026 extended to surface users and agents driving pay-as-you-go AI charges | The commercial conversation — Copilot licence right-sizing, agent consumption cost control |
| **AvePoint tyGraph** | M365 analytics; 2026 additions show how AI agents interact with SharePoint content, plus agent access monitoring | Adoption measurement and post-deployment evidence; integrates with Cense for Copilot adoption vs licence spend |
| **Cloud Governance / MyHub** | Workspace lifecycle, provisioning, renewal/attestation workflows, self-service governance for end users | The shared-accountability model — pushes access decisions to site owners rather than the helpdesk |
| **AvePoint Fly** | Migration (tenant-to-tenant, file share, Google, Slack/Box/Dropbox) | Adjacent, but the usual reason a partner is in the tenant in the first place |
| **Cloud Backup** | M365, Dynamics 365, Salesforce, Google, Azure/IaaS-PaaS, and SaaS apps (Jira, Trello, ServiceNow, GitHub) | The recurring-revenue anchor most MSPs already sell; the wedge into the rest of the portfolio |
| **ReCenter** | User-controlled recovery to alternate locations | Backup UX |
| **Confide** | Secure external collaboration workspaces | Niche; occasionally relevant to regulated SMBs |
| **MaivenPoint** (Curricula, Examina, Training+) | LMS and M365 training content | Adoption/training arm |

Two naming notes worth carrying into the workshop: **"Policies & Insights" (P&I)** is still how the market and the price lists refer to the pair, but AvePoint now markets them as separable products. And **EnPower** is not new — it is AvePoint's Entra/admin product that has absorbed AI-agent lifecycle in 2026.

**AgentPulse Command Center** is the newest and the most directly on-topic. It was announced 18 November 2025 and reached general availability 9 March 2026 ([PRESS]/[VENDOR-OFFICIAL], https://www.avepoint.com/news/avepoint-announces-general-availability-of-agent-pulse-command-center-with-multicloud-agentic-ai-governance-260309). Its stated jobs: track pay-per-use agent costs to avoid surprise bills, remediate accidental oversharing, and enforce DLP-style controls per agent. **No pricing, tiering or billing model has been published for AgentPulse** — it is sold through enterprise conversations only. Treat any AgentPulse figure you hear at the workshop as a quote, not a list price.

### 1.2 How AvePoint positions against Microsoft's own tooling

AvePoint's own comparison against SharePoint Advanced Management (SAM) is the argument a partner will hear in the room, so it is worth knowing precisely ([VENDOR-OFFICIAL], https://www.avepoint.com/blog/solutions-blog/gearing-up-for-copilot-how-avepoints-confidence-platform-soars-above-sharepoint-advanced-management). AvePoint claims SAM is limited by:

- reports built on **changes in the last 28 days**, not a complete permissions inventory;
- **site-level** archival only, with no document/library/list granularity;
- an **admin-led** model that routes every access decision back through IT;
- no **shared-accountability** remediation model that lets business owners act.

Those first and third points are fair and checkable. Microsoft's own SAM documentation confirms that the sharing-links activity report and the "Everyone except external users" (EEEU) insights are scoped to **the last 28 days** ([VENDOR-OFFICIAL], https://learn.microsoft.com/en-us/sharepoint/advanced-management, updated 18 Aug 2026). But the same page shows SAM in 2026 is materially broader than AvePoint's framing implies: **permission state reports** for sites, OneDrive and files give a genuine current-state snapshot; **site access reviews** delegate remediation to site owners (which is a shared-accountability model, if a thinner one); **Restricted Content Discovery (RCD)** stops high-risk sites surfacing in Copilot and agent experiences; **agent access insights** show how agents interact with content; and **site policy comparison** benchmarks up to 10,000 sites against a baseline using AI.

Be even-handed at the workshop: AvePoint's advantage is depth (item-level history, cross-workload including Power BI, continuous inventory, business-user workflow), not the existence of the capability.

### 1.3 The licensing fact that decides everything for SMB

Microsoft's SAM prerequisites are the fulcrum ([VENDOR-OFFICIAL], https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-prerequisites, updated 18 Aug 2026):

- SAM requires a base of **Office 365 E3/E5/A5, or Microsoft 365 E1/E3/E5/A5**, or GCC/GCC-High/DoD.
- It unlocks when **at least one user in the tenant is assigned a Microsoft Copilot licence** (that user need not be an admin) — or via the **SharePoint Advanced Management Plan 1** add-on on a SharePoint K/P1/P2 subscription — or via **Microsoft 365 E7 (the Frontier Suite)**.
- Some features (e.g. restricted site creation by apps) require the **Plan 1 add-on** regardless.

**Microsoft 365 Business Premium is not on the base-subscription list.** That is the decisive constraint for a 25–300 seat practice: the typical SMB tenant on Business Premium cannot get SAM by buying one Copilot seat. This is the gap that AvePoint, Syskit, Orchestry, Rencore and ShareGate Protect are all selling into, and it is the honest reason a third-party tool exists in an SMB Copilot engagement at all. Verify this against the current service description before you put it in a deck — Microsoft has moved SAM entitlements between SKUs before, and a practitioner guide flags exactly that "feature migration risk," recommending annual re-validation ([PRACTITIONER/COMMUNITY], https://www.tiagoscarvalho.com/microsoft-365-copilot/sharepoint-advanced-management-copilot-readiness-2026).

That same practitioner guide is useful ballast in the other direction. It argues small tenants with clean estates — **fewer than 50 sites, mature sensitivity labels, restricted external sharing, no regulatory driver** — can reasonably defer SAM entirely, and warns that RCD blocks *discovery*, not *access* (a user with a direct URL still gets in), and that Restricted SharePoint Search is temporary containment, not a security boundary. It also draws a boundary a partner should repeat verbatim: *"If your reason for buying SAM is 'we need DLP for SharePoint,' the answer is Microsoft Purview, not SAM."*

### 1.4 AvePoint Elements — the MSP edition

Elements is the multi-tenant platform AvePoint sells to the channel. The product page describes six areas ([VENDOR-OFFICIAL], https://www.avepoint.com/products/elements): Baseline Management, User & Device Management, Workspace Management, License Optimization, Risk & Change Management, and Marketplace Integration (licence purchasing and billing). Claimed outcomes on that page — 85%+ time saving on configuration enforcement, 30% fewer support tickets, 40% ARPU lift, up to 60% faster onboarding — are vendor marketing figures with no published methodology; quote them as claims, not findings.

The June 2026 Elements release notes give a more concrete picture of the modules as shipped ([VENDOR-OFFICIAL], https://www.avepoint.com/blog/msp-and-channel/elements-platform-updates-june-2026): User Management, Baseline Management, Azure Security Management, Workspace Management and App Management. Notable additions: **Permission Simulation** ("preview exactly what a user can see and do" before granting access), a **built-in CIS Level 2 baseline**, an App Configuration File Hub for staging Intune packages, and App Management becoming a standalone service with Winget integration. Notably, that release contains **no AI/Copilot governance features** — the AI governance work (AgentPulse, Insights agent monitoring, EnPower agent lifecycle) currently sits in the Confidence Platform, not in Elements. If AvePoint is in the room, that is the sharpest question to ask them: *when does agent governance land in the multi-tenant Elements console?*

**Partner motion.** AvePoint's partner AI-readiness page describes four partner models (MSP, systems integrator, reseller, distributor), and for the distributor/reseller tier offers **white-labelled kits, centralised onboarding and campaign-ready content**, plus downloadable solution brochures in partner editions (AI Confidence, Secure Cloud & AI, Smart Operations) ([VENDOR-OFFICIAL], https://www.avepoint.com/solutions/partners/ai-readiness). It also references **AvePoint Partner Talent Services** — rentable delivery specialists — on the MSP page ([VENDOR-OFFICIAL], https://www.avepoint.com/solutions/partners/managed-services-providers). Neither page publishes programme tiers, thresholds or pricing. There is **no publicly documented free assessment tool** analogous to a "run this script, get a report" giveaway; the free entry point is a trial plus a partner-led demo.

**Where to buy.** AvePoint's own "where to buy" page lists **a competing distributor, Synnex (TD SYNNEX), TechData, several competing distributors, Carahsoft, D&H, Arrow, a competing distributor and a competing distributor** ([VENDOR-OFFICIAL], https://www.avepoint.com/partners/buy). **a competing distributor is not listed** on that page — do not assert a competing distributor availability without checking the a competing distributor catalogue directly. a competing distributor carries a dedicated AvePoint vendor page and an "Elements for Partners" one-pager ([MARKETPLACE], [competitor source withheld] and [competitor source withheld]), but **a distributor marketplace pricing is behind partner authentication** — this research could not retrieve a public Elements price from a competing distributor.

### 1.5 AvePoint pricing — the finding is that there isn't any

**AvePoint publishes no US pricing for Insights, Policies, Opus, Cense, EnPower, Cloud
Governance, tyGraph, AgentPulse or Elements.** No rate card, no starting-from figure, no tier
structure. The only CTA on its pricing page is "Request Pricing."

Non-US public-sector framework schedules do exist and were reviewed during this research.
**They are deliberately not reproduced here** — foreign-currency public-sector framework rates
are not a usable basis for US SMB quoting, and carrying them into an asset invites a partner
to quote a number that does not apply to them.

What is usable, and what should go in the guide:

- **Seat minimums are the harshest in the category.** AvePoint's own published list carries a
  **500-user minimum** on nearly every SKU, with a 12-month minimum term on the Policies and
  Insights bundle. Competing tools sit at 100 users, and some have no minimum at all.
- **Whether buying through distribution removes that minimum is unconfirmed.** No public source
  answers it either way.
- **The action is to get a written quote at the actual seat count through TD SYNNEX**, and to
  ask specifically whether seats can be aggregated across a portfolio of small tenants to meet
  the floor.
### Syskit Point — the transparency benchmark
Syskit publishes a clean price grid ([VENDOR-OFFICIAL], https://www.syskit.com/pricing, fetched 28 Aug 2026): **Management €10 / user / year**, **Security €20 / user / year**, **Governance €30 / user / year**, Enterprise custom. Management covers inventory, reporting, permission management, external sharing controls and storage insight; Security adds auditing, alerts and report subscriptions; Governance adds workspace lifecycle, policy automation, provisioning and Teams app access. Add-ons exist for Power Platform governance, licence optimisation, dedicated deployment and extended audit retention (2–7 years). **Minimum 100 users** on the cloud tiers, Enterprise at 1,000+. The pricing page **does not mention an MSP or multi-tenant model** — so treat Syskit as a per-tenant purchase you resell, not a portfolio console. At 100 seats the Governance tier is roughly €3,000/year (~€2.50/user/month); the Management tier at €1,000/year is the cheapest credible commercial oversharing-inventory product found in this research.

### ShareGate
Two products. **ShareGate Migrate** publishes flat annual prices: **Essentials $5,995/yr** (1 activation, tenants to 250 employees), **Migrate Pro $9,995/yr** (5 activations, to 1,000 employees), **Enterprise from $17,995/yr** (25 activations), all with unlimited data and users ([VENDOR-OFFICIAL], https://sharegate.com/pricing). **ShareGate Protect** — the governance product — is **per licensed M365 user, guests excluded, with no feature tiers**, but the actual rate is quote-only ("get a precise quote tailored to your tenant"). Notably it includes a **ShareGate MCP** server at all tiers, which matters if the partner wants to drive governance queries from an AI assistant. **Partner pricing is available for approved partners.** For an MSP, the Migrate Essentials price is the interesting one: a single $5,995 activation covers unlimited tenants under 250 employees, which is a workable portfolio economics story for migration — but Protect is priced per end-customer.

### CoreView
Four editions — Tenant Resilience, Tenant Management, CoreView ONE, ONE Enterprise — with **no published prices and no published seat minimums**; several relevant capabilities (Access Reviews, Control for SharePoint, Auditing, Delegation Management) are **optional add-ons** rather than included ([VENDOR-OFFICIAL], https://www.coreview.com/pricing). CoreView does market an explicit MSP motion with **white-label multi-tenant M365 governance, 130+ reports and 60+ out-of-the-box policies and remediations**, and states MSP pricing exists but is available only to MSPs ([VENDOR-OFFICIAL], https://cdn.prod.website-files.com/612933c2d902f2ac80205a6f/66fce500163b7cdf4185ca04_CoreView_for_MSPs_White_Label.pdf). Genuinely multi-tenant; genuinely unpriced.

### Varonis
Positioned squarely at Copilot data-security posture: capturing all Copilot prompts and responses and the files referenced in responses, in a searchable audit trail, plus a **free Microsoft 365 Copilot readiness assessment** available via Azure Marketplace ([VENDOR-OFFICIAL], https://www.varonis.com/blog/microsoft-copilot-security-product). The free assessment is genuinely useful as a door-opener. Pricing is quote-only and enterprise-shaped; this research found **no credible published per-user figure** and no MSP multi-tenant console. Realistic at sub-100 seats: **no** — but the free readiness assessment is realistic at any size and worth knowing about.

### Netwrix
Netwrix has an unusual amount of self-serve transparency for this category: **self-service plans starting at $20 per enabled AD user + cloud-only Entra ID user** ([VENDOR-OFFICIAL], https://netwrix.com/en/buy-now/). **Access Analyzer** — the product that does the unstructured-data permissions work — is priced on a hybrid metric: **per-user for access review and policy enforcement, plus per-GB scanning fees for data discovery** ([UNVERIFIED] for the hybrid-metric description, sourced from analyst/aggregator commentary rather than a Netwrix price page; https://netwrix.com/en/products/access-analyzer/ describes the product without pricing). The per-GB component is the risk: it makes cost unpredictable against a messy SharePoint estate, which is exactly the estate you are being hired to assess.

### Rencore Governance
Explicitly and unusually **multi-tenant for MSPs**: *"As an MSP, you can manage multiple customer tenants with differing plans without having to switch accounts,"* with multi-tenant capability listed across all tiers and configuration export/import between environments ([VENDOR-OFFICIAL], https://rencore.com/en/pricing). Three tiers — Professional, Premium, Enterprise — licensed per assigned M365 licence, with a **100-user minimum** on Professional/Premium and Enterprise at 1,000+. **No rates published.** Third-party sources cite Essentials from **$0.55/user/month** and Professional from **$1.10/user/month** ([UNVERIFIED], via https://www.softwaresuggest.com/rencore and similar), which if accurate would make Rencore among the cheapest genuinely multi-tenant options — but it is uncorroborated and the tier names don't match the current pricing page. Rencore also markets governance for Copilot, agents and Power Platform, which makes it one of the closest structural fits to this motion. **Worth a direct quote request.**

### Orchestry
Publishes real prices ([VENDOR-OFFICIAL], https://www.orchestry.com/pricing): **Starter $2,499/tenant/year flat, unlimited users**; **Professional from $4,999/tenant/year**; **Enterprise from $7,499/tenant/year**, the latter two per-user with volume discounts, counting licensed M365 users only (guests and unlicensed excluded). Multi-currency. **Partner/reseller programme exists in 25 countries**, with partners acting as licensing provider and bundling Orchestry with their own services; partners get free access for up to 28 days. Orchestry markets a dedicated **Copilot Readiness** capability ([VENDOR-OFFICIAL], https://www.orchestry.com/microsoft-365-copilot/copilot-readiness). The Starter tier at $2,499/tenant is the clearest "flat price, small tenant" option in the governance category — but note it's *per tenant*, so portfolio cost scales linearly with customer count.

### ProvisionPoint 365
Per licensed M365 user, billed annually, guests excluded, auto-renewing; **no published rates**, quote-only, multi-currency, 30-day free trial without a credit card, and a **separate partner/reseller programme** ([VENDOR-OFFICIAL], https://provisionpoint.com/pricing/). Primarily a provisioning/lifecycle and permissions self-service tool rather than an oversharing-discovery engine — useful for the "keep it clean going forward" half, weaker for the initial audit.

### Hornetsecurity 365 Permission Manager
Does the core job well: permission visibility across SharePoint, OneDrive and Teams; bulk "Quick Actions" to fix permission problems; predefined and custom compliance policies with automated remediation; alerts on critical sharing changes; audit-grade reporting ([VENDOR-OFFICIAL], https://www.hornetsecurity.com/en/services/365-permission-manager/). It is bundled into higher tiers of **365 Total Protection** (Plans 1–4), and Hornetsecurity separately sells **365 Multi Tenant Manager for MSPs**. A **free 30-day trial** starts on activation, after which the service becomes chargeable ([VENDOR-OFFICIAL], https://support.hornetsecurity.com/hc/en-us/articles/19687518613649-Activating-365-Permission-Manager). **No standalone price is published**; 365 Total Protection tiers are cited in the €2.75–€11.00/user/month range by aggregators ([UNVERIFIED], https://www.g2.com/products/hornetsecurity-365-total-protection/pricing). This is the strongest candidate for "already in the stack": many SMB-focused MSPs already resell Hornetsecurity 365 Total Protection through a competing distributor or a distributor, in which case Permission Manager may already be entitled at no incremental cost. **Check the customer's existing Total Protection tier before quoting anything else.**

### ManageEngine M365 Manager Plus
The only vendor here with a fully published per-band grid ([VENDOR-OFFICIAL], https://www.manageengine.com/microsoft-365-management-reporting/pricing-details.html):

| Users | Standard (annual) | Professional (annual) |
|---|---|---|
| 100 | $345 | $595 |
| 200 | $595 | $945 |
| 500 | $945 | $1,545 |
| 1,000 | $1,545 | $2,395 |
| 2,000 | $2,795 | $3,995 |
| 5,000 | $5,995 | $7,995 |

A **free edition** exists, and a 30-day Professional trial. One helpdesk technician is included per licence; an Exchange Online Backup add-on runs $145–$1,295/year. Multiple tenants can be managed from one interface. At **$595/year for 100 users on Professional**, this is by a wide margin the cheapest commercial reporting/auditing product in the comparison — but understand what you are buying: it is a reporting, auditing and delegated-administration tool, not an oversharing-remediation workflow engine. It will tell you who has access to what; it will not run an owner attestation campaign for you.

---

## 3. Shadow AI and SaaS discovery

### The honest segmentation
There are three architectures, and they price very differently:

1. **Identity/email-metadata discovery** (Nudge Security, Augmentt Discover, 1Password XAM). No agents, no proxies. Fast to deploy, SMB-priced, excellent at "who signed up for what with a work email." Blind to in-session behaviour.
2. **Browser-based** (Push Security, Chrome Enterprise Premium, Island). Sees actual prompts and pastes. Requires extension or browser deployment.
3. **Network/proxy CASB-SSE** (Netskope, Zscaler). Comprehensive, module-priced, enterprise minimums.

### Nudge Security — the SMB benchmark
The clearest published pricing in the whole category ([VENDOR-OFFICIAL], https://www.nudgesecurity.com/pricing, fetched 28 Aug 2026): **Essential — up to 150 users, $750/month billed annually, all features included**; **Growth — 150–1,500 users, $5/user/month billed annually**; Enterprise custom above 1,500. "Active user" = licensed user with a mailbox in Google Workspace or M365; archived/deleted/suspended users don't count. No per-seat limits on platform access. Free trial. Available via AWS Marketplace. In May 2026 it added **browser-based discovery of shadow AI agents** covering platforms without public agent-inventory APIs — Airbyte, Atlassian Rovo, ChatGPT Workspace Agents, Cursor Automations, OpenAI Workflows, Retool Agents, Zapier Agents, Zoom Workflows and more ([PRESS], https://www.helpnetsecurity.com/2026/05/28/nudge-browser-based-agentic-ai-security/).

The arithmetic matters for a 25–300 seat practice: at **60 seats, $750/month is $12.50/user/month** — more than the Business Premium licence in some cases. The Essential tier's flat floor makes Nudge excellent value at 140 users and poor value at 40. Multi-client portfolio management reportedly requires separate organisational instances ([UNVERIFIED], https://raic.rhindoncyber.com/resources/shadow-ai/smb-buyerguide-2026 — note this source is vendor-adjacent SEO content promoting a competing product and should be corroborated with Nudge directly).

### Augmentt
The most explicitly MSP-native tool in this section. Four products: **Secure Autopilot** (policy management and compliance auditing against CIS, CISA SCuBA, NIST CSF 2.0, Essential 8 and CMMC), **Engage Autopilot** (user lifecycle), **Intune Autopilot**, and **Discover** (SaaS and AI app monitoring across 22,000+ applications with per-client usage trends). Pricing is explicitly flexible — *"per seat or per tenant, your call"* — with volume discounts and terms up to three years, and a free trial ([VENDOR-OFFICIAL], https://www.augmentt.com/pricing/). **No dollar figures are published.** The per-tenant option is the important structural feature: it is the only discovery tool found here that will let a partner price a 30-seat client without a per-seat floor destroying the margin. Also worth noting that Secure Autopilot audits against **CISA SCuBA** — the same baseline as the free ScubaGear tool in §6 — so a partner can start free and upgrade the same framework into a managed service.

### Push Security
Browser-extension security platform. **From $5/user/month**, with every licence including the full platform regardless of scale — behavioural phishing detection, credential security, session-hijacking detection, extension management, **AI visibility, SaaS discovery**, DLP building blocks and custom detections ([VENDOR-OFFICIAL], https://pushsecurity.com/pricing and https://pushsecurity.com/product). No browser migration required. At 60 seats that's $300/month for both shadow-AI visibility and a real identity-attack control — arguably the best value-per-dollar in this section for an SMB, though multi-tenant MSP administration is not documented on the public pages and should be confirmed.

### Harmonic Security
Endpoint/inline interception of AI prompts with context-aware policies (not keyword matching) and user coaching. Its research corpus is worth citing at the workshop independent of whether you buy it: analysis of **22,458,240 enterprise GenAI prompts across calendar 2025** found that while only ~40% of companies had purchased official AI subscriptions, employees at **over 90% of organisations** were actively using AI tools, and that **six AI applications accounted for 92.6% of all sensitive-data exposure**, with source code (30%), legal material (22.3%) and M&A data (12.6%) leading the categories ([VENDOR-OFFICIAL], https://www.harmonic.security/resources/what-22-million-enterprise-ai-prompts-reveal-about-shadow-ai-in-2025). Pricing: **enterprise, unpublished.**

### Prompt Security
**Acquired by SentinelOne, completed September 2025** ([UNVERIFIED] for the exact completion date, via https://aona.ai/resources/comparisons/prompt-security-vs-harmonic/ — corroborate with SentinelOne's own announcement before citing). It is now a SentinelOne platform capability rather than a standalone SMB purchase; expect it to be sold with a Singularity platform commitment.

### Netskope / Zscaler
Both gate AI controls behind add-on modules. Netskope's AI controls sit in higher tiers and AI governance is a newer separately-sold add-on; Zscaler's prompt-level DLP is not in the base proxy and requires the Data Protection add-on, with AI Guard and AI scanning licensed separately again ([UNVERIFIED]/competitor-authored analysis, https://dope.security/post/zscaler-competitors-zscaler-vs-netskope and https://zerotrustcost.com/netskope-pricing — these are written by a competing vendor, so treat the framing as adversarial even where the facts are broadly right). Indicative Netskope bands cited: **$4–8/user/month** for base SWG+CASB on a three-year commit, **$9–14/user/month** for a mid-tier bundle with ZTNA and basic DLP; neither vendor publishes list pricing. The consistent theme across independent commentary is **enterprise minimums and module stacking make the per-seat maths unfavourable at small scale**. Verdict for sub-100 seats: **no**.

### Browser controls: Chrome Enterprise Premium vs Island
**Chrome Enterprise Premium is $6/user/month**, adding real-time DLP, data masking and AI governance controls including controls aimed at unsanctioned GenAI tools, managed through Chrome Browser Cloud Management ([PRESS], https://www.computerworld.com/article/2088368/google-adds-a-premium-option-for-chrome-enterprise.html; https://thenextweb.com/news/google-chrome-enterprise-ai-coworker-agentic-browser). **Island reportedly starts around $25,000/year** ([UNVERIFIED], https://www.selecthub.com/enterprise-browsers/island-browser-vs-chrome-enterprise/) — a platform priced for enterprises. For a 25–300 seat customer already standardised on Chrome, Chrome Enterprise Premium at $6/user is the only browser-layer AI control with a defensible SMB price. Island is out of range.

### 1Password Extended Access Management
Discovers shadow SaaS, unmanaged credentials, AI agents and non-human identities; secures with vaulting and runtime least-privilege; audits access decisions across humans and agents ([VENDOR-OFFICIAL], https://1password.com/extended-access-management and https://1password.com/features/saas-discovery). Built partly on the Kolide acquisition and sold as a separate layer on top of the password manager, **not bundled into standard seat prices**. A pricing page exists (https://1password.com/pricing/xam) but no per-user XAM figure could be confirmed in this research. Strategically attractive for MSPs who already deploy 1Password Business — the discovery comes with an existing relationship and an existing agent.

### SaaS management platforms (Torii, Zluri, Josys)
All three are quote-only. Torii offers Basic, Professional and Enterprise tiers spanning SaaS management, identity governance and AI management, "priced to your environment" ([VENDOR-OFFICIAL], https://www.toriihq.com/pricing). Zluri is custom-priced. Josys publishes no pricing. These are IT-finance tools first, security tools second, and none has a documented MSP multi-tenant console. **Not realistic at sub-100 seats** — the deployment effort alone exceeds the value at that size.

### A warning about the "best shadow AI tools for MSPs" genre
Two of the most search-visible comparison pages in this space (lavawall.com, raic.rhindoncyber.com) are **vendor-authored content marketing** that concludes, in both cases, that the authoring vendor is the only tool meeting all criteria. They do carry some useful uncorroborated figures — Cyberhaven ~$40k+/yr, Reco ~$25k+/yr, Obsidian ~$30k+/yr as enterprise-tier examples ([UNVERIFIED], https://raic.rhindoncyber.com/resources/shadow-ai/smb-buyerguide-2026) — but every number and every ranking there needs corroboration. Their one genuinely reusable observation, which happens to be correct and is worth stealing for the practice guide: *detection without a governance programme still leaves the client non-compliant with NIST AI RMF, ISO 42001 and the EU AI Act.* Discovery is the beginning of the engagement, not the deliverable.

---

## 4. AI-specific governance, policy and compliance tooling

### Vanta and Drata
Vanta has a dedicated **AI Governance module** with an agent and use-case registry plus **ISO 42001, NIST AI RMF and EU AI Act** support, and was the first major GRC vendor to ship a dedicated ISO 42001 module (March 2024) ([UNVERIFIED]/analyst review, https://aiactindex.eu/reviews/vanta and https://truvocyber.com/blog/drata-vs-vanta-iso-42001 — corroborate against Vanta's own product pages before quoting). Pricing commentary puts average Vanta contracts at **$30,000–$45,000/year** in 2025–26 with a Foundation tier (single framework, under 50 employees) around **$7,500–$10,000/year**, and Drata across a **$7,500 to $100,000+** range ([UNVERIFIED], https://episki.com/compare/vs/vanta-vs-drata, https://www.secureleap.tech/blog/drata-review-pricing-top-alternatives-for-compliance-automation). Certified-partner discounts of 15–25% off list are cited but not confirmed by either vendor. **Neither has a documented MSP multi-tenant model of the kind an SMB practice needs**, and at a $7,500 floor these are not tools you attach to a 40-seat client. They are tools you sell to the one client in your base pursuing a certification.

### Compliance Scorecard — the MSP-native option
Purpose-built for MSPs, MSSPs and vCISO practices: assessments, policy management, risk registers, evidence collection and CMMC SPRS scoring. Version 10, launched February 2026, added a **governed AI system** where every prompt is viewable and modifiable, context is explicitly configured rather than inferred, and all changes are version-controlled — and critically, **AI is optional, not required**, so a provider can adopt AI-assisted workflows at their own pace ([VENDOR-OFFICIAL], https://compliancescorecard.com/2026/02/compliance-scorecard-launches-version-10/; [PRESS], https://www.channelpronetwork.com/2026/02/18/compliance-scorecard-v10/). **AI capabilities including BYOK are included at no additional cost.** G2 lists a Peer Group offering at **$299/month** ([MARKETPLACE], https://www.g2.com/products/compliancerisk-io-inc-compliance-scorecard/pricing) — the only near-list price found for an MSP compliance platform with an AI governance capability. This is the strongest candidate for the "AI acceptable-use policy plus risk register, delivered across a portfolio" job.

### Cynomi
vCISO automation platform with a 2026 expansion adding AI agents for MSP/MSSP/vCISO practices, seven new vulnerability-management integrations, scheduled scanning, a centralised Files Repository and expanded "AI Coworker" capabilities ([PRESS], https://www.channelinsider.com/security/tools-and-platforms/cynomi-ai-ciso-agents-msp-security-automation/; https://www.channelpronetwork.com/2026/05/12/cynomi-ai-powered-vciso/). Cynomi's own content reports **81% of vCISO providers already use AI/automation with an average 68% workload reduction** ([VENDOR-OFFICIAL], https://cynomi.com/blog/vciso-pricing-models-for-msps-how-to-price-security-advisory-services-in-2026/) — a vendor survey figure, so treat accordingly. **No published pricing**; third-party reporting says quotes are scoped on number of vCISOs, seats or clients, with small-team licences "starting in the low five figures per year" ([UNVERIFIED], https://getcybr.com/vs-cynomi/ and https://www.realciso.io/cynomi-alternative-for-a-vciso/ — both competitor-authored). Cynomi is the platform that generates the policy set and the risk register at portfolio scale; it is a practice investment, not a per-client cost.

### The gap
There is **no credible dedicated "AI acceptable-use policy generator"** worth naming as a product category. In practice this job is done inside Compliance Scorecard, Cynomi, or a partner's own template library. Do not build the practice guide around a tool that doesn't exist; build it around a template the partner owns, tracked in whichever GRC platform they already run.

---

## 5. MSP delivery infrastructure

### Microsoft 365 Lighthouse — free, and the floor
Available to any partner in the CSP programme (indirect reseller or direct bill). Each customer tenant needs **delegated access (GDAP or DAP)**, at least one qualifying M365/O365/Exchange Online/Windows 365 Business/Defender for Business subscription, **no more than 2,500 licensed users**, and residency in the partner's geographic region ([VENDOR-OFFICIAL], https://learn.microsoft.com/en-us/microsoft-365/lighthouse/m365-lighthouse-requirements). Tenants that don't meet the bar get only a limited experience (GDAP setup, user search, tenant tagging, service health). For user-management reporting — risky users, MFA, SSPR — customer tenants need **Entra ID P1 or later**, which **is included in Business Premium**. Lighthouse is optimised for exactly the Business Premium + Defender for Business SMB profile. It costs nothing and every CSP partner already has it. It is not a governance product — it will not enumerate SharePoint permissions — but it is the multi-tenant baseline that any governance motion sits on top of.

### CIPP (CyberDrain Improved Partner Portal)
The most important tool in this section for a cost-conscious practice. Open source, on GitHub, with **over 8,000 MSPs reportedly running it in production** ([VENDOR-OFFICIAL]/[PRACTITIONER], https://github.com/KelvinTegelaar/CIPP; https://cyberdrain.com/). Costs, from the official documentation ([VENDOR-OFFICIAL], https://docs.cipp.app/troubleshooting/frequently-asked-questions):

- **Self-hosted:** roughly **€25/month** in Azure consumption on the click-to-deploy configuration with average usage. Independent commentary puts the realistic band at **$10–30/month**, rising above $100 with high tenant counts or heavy write operations ([UNVERIFIED], https://rallied.ai/blog/cipp-m365/).
- **Hosted CIPP:** **€99/month**, including automatic updates, unlimited support, weekly live training, a Have I Been Pwned / breach-detection API key, early access to new Graph APIs, on-site training event access, and no contract lock-in. Roughly **100% faster** than self-hosted per the docs.
- **Licensing:** works with any M365 licence in the partner tenant; feature-specific licences still apply (Intune management needs Intune licences). **No special GDAP licensing required**, but technicians must be members of the M365 GDAP security groups CIPP creates.

**Risk profile — be candid about this in the guide.** CIPP is an application holding GDAP-delegated administrative access to every customer tenant a partner manages. That makes it, by construction, among the highest-value targets in the partner estate. The material risks are: (a) the self-hosted deployment's security is entirely the partner's responsibility — Azure resource hardening, secrets management, conditional access on the app registration, technician MFA; (b) supply-chain exposure to an open-source project the partner does not control; (c) the audit question — a client asking "who at your company can read my SharePoint permissions, and how is that logged?" needs an answer. CIPP's own model requires **vendor sponsorship to fund new integrations**, which is a healthy transparency signal but also means integration roadmap follows vendor money, not partner priority. None of this is a reason not to use it; all of it is a reason to document it. Nerdio also publishes CIPP-related material, indicating meaningful ecosystem overlap ([VENDOR-OFFICIAL], https://getnerdio.com/cyberdrain-cipp/).

Does CIPP serve *this* motion? Partly. It excels at multi-tenant Entra/Intune/Exchange configuration, baselines and standards enforcement. It is not a SharePoint permissions-inventory engine. For oversharing discovery it is a delivery chassis, not the tool.

### Nerdio
Nerdio Manager for MSP publishes AVD and Windows 365 plans **from $3.00/user/month**, with a **minimum customer-account licence cost around $60** and a Gov Edition minimum of **$250/tenant/month** ([UNVERIFIED] for the specific figures, aggregated at https://www.saasworthy.com/product/nerdio-manager-for-msp/pricing; vendor page at https://getnerdio.com/pricing/msp/ requires contact). One aggregator asserts "$30 per user/month with real cost often 3x higher" — flatly inconsistent with the $3 figure and a good illustration of why aggregator pricing must be corroborated. Nerdio is primarily a Windows 365/AVD and M365 cost-management platform; it is adjacent to this motion, not central to it.

### Rewst, CloudRadial, ScalePad
- **Rewst** — hyperautomation for MSPs, quote-based, **budget at least $1,000/month** for a small-to-midsize MSP ([UNVERIFIED], https://rallied.ai/blog/rewst-pricing/). Its role here is turning a repeatable governance report into a scheduled, ticketed workflow across the portfolio. Worth it only once the motion is standardised.
- **CloudRadial** — client portal and service-delivery platform integrating with ConnectWise, Autotask, HaloPSA, Kaseya BMS and Syncro ([VENDOR-OFFICIAL]/[UNVERIFIED], https://www.softwareadvice.com/msp/cloudradial-profile/). This is where a customer-facing governance report *lives* — a standing portal page rather than a PDF emailed quarterly.
- **ScalePad Lifecycle Insights** — vCIO and QBR tooling; the natural place to land a recurring governance scorecard in a quarterly business review ([VENDOR-OFFICIAL], https://www.scalepad.com/news/scalepad-launches-product-capabilities-to-support-a-new-era-of-customer-success-in-the-msp-channel/).

None of the three produces the governance data. All three are how you *deliver* it repeatedly and get paid for it. That distinction is the whole build-vs-buy argument in §7.

---

## 6. Free and low-cost assessment tooling — the near-zero-cost first engagement

This is where a sub-100-seat first assessment actually gets delivered profitably.

**SharePoint Advanced Management, where entitled.** If the customer has any Copilot licence and an E1/E3/E5 or O365 E3/E5 base, SAM is already paid for and gives you: permission state reports for sites/OneDrive/files, site permissions for a given user, sensitivity label snapshot, sharing links activity (28 days), EEEU insights (28 days), site access reviews delegated to owners, restricted content discovery, agent insights, and **DAG reports drivable from the SharePoint Online PowerShell module** ([VENDOR-OFFICIAL], https://learn.microsoft.com/en-us/sharepoint/advanced-management and .../powershell-for-data-access-governance). The PowerShell path is the important one for a partner: it means the report can be scripted, scheduled and templated rather than clicked.

**ScubaGear (CISA).** PowerShell-based automated assessment of an M365 tenant against CISA's SCuBA baselines. Queries M365 APIs, evaluates against Rego policies via Open Policy Agent, and outputs **HTML, JSON and CSV** ([VENDOR-OFFICIAL], https://github.com/cisagov/ScubaGear; https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project). Surpassed 30,000 downloads per CISA ([PRESS]/[VENDOR-OFFICIAL], https://www.cisa.gov/news-events/news/cisas-scubagear-tool-improves-security-organizations-using-m365-and-surpasses-30000-downloads-0). Free. The HTML output is close enough to client-presentable that a light template wrapper makes it a deliverable. Crucially, **Augmentt Secure Autopilot audits against the same SCuBA baseline**, so the free tool and the paid upgrade share a framework — a clean commercial ladder.

**Maester.** Open-source, PowerShell, community/MVP-built on Pester; includes SCuBA tests alongside broader M365 security checks and fits a security-as-code workflow you can run repeatedly ([PRACTITIONER/COMMUNITY], via https://blog.admindroid.com/free-microsoft-365-management-tools/). Its repeatability is the point: it turns an assessment into a regression test you re-run monthly.

**Monkey365.** Open-source security assessment for M365, Azure and Entra ID; identifies misconfigurations and evaluates against CIS and other benchmarks without requiring the operator to learn multiple Graph modules or navigate several admin portals; integrates into CI/CD or scheduled automation ([VENDOR-OFFICIAL], https://github.com/silverhack/monkey365). Free.

**Microsoft365DSC.** Snapshots any tenant's configuration and compares it against a blueprint, making tenant drift visible ([VENDOR-OFFICIAL], https://microsoft365dsc.com/; https://github.com/Microsoft365DSC/Microsoft365DSC). This is how a partner enforces a standard baseline across a portfolio at zero licence cost. Important 2026 development: **Microsoft launched public preview of Tenant Configuration Management APIs on Microsoft Graph on 27 January 2026** ([PRACTITIONER/COMMUNITY], https://blog.admindroid.com/automate-microsoft-365-settings-with-microsoft365dsc/), which over time may make first-party configuration management viable and reduce dependence on DSC.

**Varonis's free Copilot readiness assessment** via Azure Marketplace ([VENDOR-OFFICIAL], https://www.varonis.com/blog/microsoft-copilot-security-product) is a genuine zero-cost data point for a partner, with the obvious caveat that it exists to generate a Varonis pipeline.

**What free tooling does not do.** It produces evidence, not remediation, and not ongoing enforcement. There is no free equivalent of an owner-attestation campaign, a policy that auto-remediates a new EEEU share within the hour, or a portfolio-wide dashboard. That is precisely the boundary at which money starts being worth spending.

---

## 7. Build vs buy: where the line sits

Direct practitioner commentary on this specific threshold proved hard to source — Reddit is not retrievable by this research tool, and the searchable MSP community writing on "scripts vs platform for M365 governance" is thin and heavily colonised by vendor content marketing. What follows is therefore reasoned from the pricing structures documented above rather than quoted from practitioners, and should be tagged accordingly in the practice guide.

**The seat-minimum wall.** The clearest hard boundary in the data. AvePoint's published SKUs carry **500-user minimums**; Syskit and Rencore carry **100-user minimums**; Nudge's Essential tier has a **$750/month floor** regardless of headcount. Below roughly 100 seats, most of this category is either unbuyable or priced at a per-user rate that makes it unsellable. A 40-seat client is a scripts client. This is a structural fact about the market, not a judgement about the client's risk.

**The per-tenant vs per-user fork.** For a portfolio of small customers, per-tenant pricing (Orchestry Starter at $2,499/tenant/year, Augmentt's per-tenant option, ManageEngine's 100-user band at $345–$595/year) scales linearly and predictably. Per-user pricing with a floor punishes small tenants brutally. The right question at 10 customers is not "which platform is best" but "which platform's *unit* matches my portfolio's shape."

**Three plausible thresholds:**

1. **Under ~5 customers, or any customer under ~50 seats:** free tooling only. ScubaGear + Maester + SAM PowerShell (where entitled) + Microsoft365DSC. Delivery cost is your time; there is no licence to recover.
2. **Around 10 customers, or any customer over ~150 seats:** buy one platform. The economics flip because you are now re-running the same assessment ten times a quarter and the labour saved exceeds the licence. Ten tenants on ManageEngine Professional at the 100-user band is under $6,000/year; ten on Orchestry Starter is $24,990/year; a single Compliance Scorecard practice licence at ~$299/month covers the policy and risk-register side across all of them.
3. **Above ~25 customers, or a portfolio with genuine mid-market tenants:** the automation layer (Rewst) and the customer-facing delivery layer (CloudRadial or ScalePad) start paying for themselves, and a multi-tenant governance console (Rencore, CoreView, AvePoint Elements) becomes defensible.

The best available proxy for practitioner sentiment is CIPP's adoption: **8,000+ MSPs** running an open-source multi-tenant console rather than buying one. That is a strong revealed preference for "free and self-operated" in this channel, and it is the competitive reality any paid platform — AvePoint Elements included — has to overcome. The counter-argument is equally revealed: CIPP does not do SharePoint permissions inventory, which is why the paid governance category exists at all.

---

## 8. Comparison table

| Tool | What it does in this motion | Multi-tenant / MSP | Pricing model | Realistic sub-100 seats | Source |
|---|---|---|---|---|---|
| **AvePoint AgentPulse** | AI agent discovery, ownership, cost and DLP control | Not documented for Elements | Unpublished | Unknown | [VENDOR] avepoint.com/news/...260309 |
| **AvePoint Elements** | Multi-tenant baselines, permission simulation, CIS L2, workspace governance | **Yes** | Unpublished; distribution/D&H/a competing distributor | Unknown | [VENDOR] avepoint.com/products/elements |
| **Syskit Point** | Permissions inventory, external sharing, access reviews, lifecycle | Not on pricing page | €10 / €20 / €30 per user/**year**, 100-user min | **Marginal** (100 min) | [VENDOR] syskit.com/pricing |
| **ShareGate Protect** | Governance risk assessment, tenant-wide visibility, MCP server | Partner pricing available | Per licensed user, quote-only | Unknown | [VENDOR] sharegate.com/pricing |
| **ShareGate Migrate** | Migration (adjacent) | 1–25 activations | $5,995 / $9,995 / $17,995 per year flat | **Yes** (Essentials covers <250-emp tenants) | [VENDOR] sharegate.com/pricing |
| **CoreView** | Multi-tenant M365 governance, 130+ reports, 60+ policies, white-label | **Yes** | Quote-only, add-on model | Unknown | [VENDOR] coreview.com/pricing |
| **Varonis** | Copilot prompt/response audit trail, data-security posture; **free readiness assessment** | No | Quote-only, enterprise | **No** (paid); yes for free assessment | [VENDOR] varonis.com/blog/... |
| **Netwrix Access Analyzer** | Unstructured-data permissions analysis | No | Hybrid per-user + **per-GB scanning** | Marginal; per-GB risk | [VENDOR] netwrix.com/en/buy-now/ |
| **Rencore Governance** | Governance for M365, Copilot, agents, Power Platform | **Yes, explicitly** | Per assigned licence, 100-user min, rates unpublished | **Marginal** | [VENDOR] rencore.com/en/pricing |
| **Orchestry** | Workspace governance + Copilot readiness | Reseller programme, 25 countries | **$2,499 flat / $4,999+ / $7,499+ per tenant per year** | **Yes** (Starter) | [VENDOR] orchestry.com/pricing |
| **ProvisionPoint 365** | Provisioning, lifecycle, self-service permissions | Partner programme | Per licensed user, quote-only | Unknown | [VENDOR] provisionpoint.com/pricing/ |
| **Hornetsecurity 365 Permission Manager** | Permission visibility + bulk remediation + compliance policies | Separate MSP multi-tenant product | Bundled in 365 Total Protection tiers; standalone unpublished | **Yes if already in stack** | [VENDOR] hornetsecurity.com/en/services/365-permission-manager/ |
| **ManageEngine M365 Manager Plus** | Reporting, auditing, delegated admin across tenants | Multiple tenants, one console | **$345–$595/yr at 100 users**; free edition | **Yes — cheapest commercial** | [VENDOR] manageengine.com/.../pricing-details.html |
| **Nudge Security** | Shadow SaaS + shadow AI + AI agent discovery via identity/email + browser | MSP programme; separate instances per client | **$750/mo <150 users; $5/user/mo 150–1,500** | **Marginal** (flat floor) | [VENDOR] nudgesecurity.com/pricing |
| **Augmentt** | SaaS/AI discovery (22,000+ apps) + SCuBA/CIS/NIST/E8/CMMC policy audit | **Yes, MSP-native** | **Per seat or per tenant**, figures unpublished | **Yes** (per-tenant option) | [VENDOR] augmentt.com/pricing/ |
| **Push Security** | Browser-based AI visibility, SaaS discovery, identity attack detection | Not documented | **From $5/user/mo, full platform** | **Yes** | [VENDOR] pushsecurity.com/pricing |
| **Harmonic Security** | Inline prompt interception, context-aware AI DLP, user coaching | No | Enterprise, unpublished | **No** | [VENDOR] harmonic.security |
| **Prompt Security** | AI prompt security — now part of SentinelOne | Via SentinelOne | Platform commitment | **No** | [UNVERIFIED] aona.ai comparison |
| **Netskope / Zscaler AI controls** | Network-layer AI app control and prompt DLP | Enterprise | Module stacking, enterprise minimums | **No** | [UNVERIFIED] dope.security, zerotrustcost.com |
| **Chrome Enterprise Premium** | Browser DLP, data masking, GenAI controls | Via Chrome Browser Cloud Management | **$6/user/mo** | **Yes** | [PRESS] computerworld.com |
| **Island** | Enterprise browser with in-browser DLP | Enterprise | **~$25,000/yr floor** | **No** | [UNVERIFIED] selecthub.com |
| **1Password XAM** | Shadow SaaS/AI, credentials, agent + non-human identity discovery | Not documented | Separate layer above password manager; unpublished | Unknown | [VENDOR] 1password.com/extended-access-management |
| **Torii / Zluri / Josys** | SaaS spend + identity governance | No MSP console documented | Quote-only | **No** | [VENDOR] toriihq.com/pricing |
| **Vanta / Drata** | ISO 42001, NIST AI RMF, EU AI Act; AI use-case & agent registry | Partner discounts cited, no MSP console | ~$7.5k floor to $100k+ | **No** | [UNVERIFIED] aiactindex.eu, episki.com |
| **Compliance Scorecard** | MSP GRC: policies, risk register, evidence, CMMC SPRS; governed AI, BYOK, AI at no extra cost | **Yes, MSP-native** | **~$299/mo** (G2 listing) | **Yes** | [VENDOR] compliancescorecard.com/2026/02/...; [MARKETPLACE] G2 |
| **Cynomi** | vCISO automation, policy generation, AI agents for MSPs | **Yes, MSP-native** | Unpublished; "low five figures/yr" for small teams | Practice-level buy | [PRESS] channelinsider.com; [UNVERIFIED] getcybr.com |
| **M365 Lighthouse** | Multi-tenant baseline, GDAP, device/user posture | **Yes** | **Free** with CSP; ≤2,500 users/tenant | **Yes** | [VENDOR] learn.microsoft.com/.../m365-lighthouse-requirements |
| **CIPP** | Multi-tenant M365 admin, baselines, standards | **Yes** | **~€25/mo self-host; €99/mo hosted** | **Yes** | [VENDOR] docs.cipp.app |
| **Nerdio Manager for MSP** | AVD/W365 + M365 cost management | **Yes** | From $3/user/mo; ~$60 min per customer account | Marginal | [UNVERIFIED] saasworthy |
| **Rewst** | Automating the governance workflow across the portfolio | **Yes** | Quote; ~$1,000+/mo | Portfolio-level buy | [UNVERIFIED] rallied.ai |
| **CloudRadial / ScalePad** | Customer-facing governance report, QBR delivery | **Yes** | Quote / per-client | Portfolio-level buy | [VENDOR] cloudradial, scalepad |
| **ScubaGear (CISA)** | Automated SCuBA baseline assessment, HTML/JSON/CSV output | Run per tenant | **Free** | **Yes** | [VENDOR] github.com/cisagov/ScubaGear |
| **Maester** | Repeatable M365 security tests incl. SCuBA, security-as-code | Run per tenant | **Free** | **Yes** | [PRACTITIONER] admindroid blog |
| **Monkey365** | M365/Azure/Entra misconfiguration + CIS assessment | Run per tenant | **Free** | **Yes** | [VENDOR] github.com/silverhack/monkey365 |
| **Microsoft365DSC** | Config snapshot, blueprint comparison, drift detection | Run per tenant | **Free** | **Yes** | [VENDOR] microsoft365dsc.com |
| **SharePoint Advanced Management** | DAG reports, permission state, EEEU insights, RCD, site access reviews, agent insights | Per tenant | Unlocked by ≥1 Copilot licence **on E1/E3/E5/O365 E3/E5 base**, or SAM Plan 1 add-on | **Only if licensed** — Business Premium excluded | [VENDOR] learn.microsoft.com/.../prerequisites |

---

## 9. What could not be priced

Stated plainly, so nobody invents a number: **AvePoint Elements, AvePoint AgentPulse, AvePoint's current (non-a public-sector framework, non-UK, 2026) commercial rate card, a competing distributor/TD SYNNEX marketplace prices for any AvePoint SKU, ShareGate Protect, CoreView (all editions), Varonis, Rencore's actual per-user rates, ProvisionPoint 365, Hornetsecurity 365 Permission Manager standalone, Augmentt (any SKU), Harmonic Security, Torii, Zluri, Josys, 1Password XAM, Cynomi, and Island.** Every one of those is "contact sales." Every figure attributed to them anywhere in this document from a third party is tagged `[UNVERIFIED]` and should be re-quoted before it reaches a client.

---

## 10. Follow-up research worth commissioning

1. **Log into distribution StreamOne and capture actual AvePoint Elements and Cloud Backup partner prices.** These are behind authentication and are the single highest-value missing data point for the practice guide.
2. **Confirm whether a competing distributor carries AvePoint** — it is absent from AvePoint's own "where to buy" page.
3. **Verify SAM entitlement for Business Premium against the current SharePoint Online service description**, not just the prerequisites page. This one fact determines whether a third-party tool is mandatory or optional for the typical SMB.
4. **Ask AvePoint directly, at the workshop:** when does agent governance (AgentPulse / Insights agent monitoring) reach the multi-tenant Elements console, is there a sub-500-seat commercial motion for Policies & Insights through distribution, and is there a partner-delivered free assessment artefact.
5. **Get quotes** from Rencore (multi-tenant, 100-seat minimum) and Augmentt (per-tenant) — these two have the structural shape that fits a 25–300 seat portfolio best, and both are unpriced.
6. **Retrieve practitioner sentiment from r/msp and MSPGeek directly** (not retrievable by this research tool) on the scripts-vs-platform threshold and on CIPP risk management.
