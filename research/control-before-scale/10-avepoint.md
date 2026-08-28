# 10 · AvePoint — portfolio, engagement mapping, partner commercials

**Compiled 2026-08-28.** Public sources only. No partner portal, a distributor marketplace, TD SYNNEX
StreamOne or AvePoint Learn authenticated content was accessed. Every price below is either a
published framework/reseller rate or explicitly tagged unverified.

Supersedes and deepens §1 of [`05-tooling-ecosystem.md`](05-tooling-ecosystem.md).

Tags: `[VENDOR-OFFICIAL]` · `[MARKETPLACE]` · `[PARTNER-PROGRAM]` · `[PRACTITIONER]` · `[PRESS]` · `[UNVERIFIED]`

---

## 0. The seven findings that matter

1. **AvePoint's substantive documentation is behind a login.** `learn.avepoint.com` publishes
   navigation trees and "About" pages; every substantive article — the Exposure report, Risk
   Analysis reports, the Policies rule catalog, the whole Elements user guide — returns a
   sign-in wall. **A partner cannot self-serve-evaluate AvePoint from public docs.** Asking for
   doc logins at the workshop is the cheapest, highest-value ask in the room.
2. **There is no product called "MaestroBridge."** That name was invented in the research
   prompt and must not reach the guide. **Maestro** is the AI classification engine inside
   **Opus**. No AvePoint product index, search result or press release uses "MaestroBridge."
3. **Insights does not require an E-SKU.** It consumes Microsoft's security, activity and
   compliance *feeds* rather than crawling content, so it works on Business Premium. **This is
   the answer to the SAM wall in [`09-verifications.md`](09-verifications.md) V-06.**
4. **Policies inherits Microsoft's E5 label wall.** Three rules require M365 E5; one requires
   Entra ID P1/P2. §3.3.
5. **Reseller price points exist that the prior dossier missed** — with no stated user minimum
   on the listings. §4.4.
6. **A genuine self-serve 30-day free trial exists** at `www.avepointonlineservices.com`,
   confirmed in two AvePoint brochures. Its deliverable is the **Risk Assessment Report**. §5.
7. **Elements — the MSP platform — is entirely unpriced and contains no AI/Copilot
   governance** as of the June 2026 release. The governance motion and the multi-tenant motion
   are two different consoles.

---

## 1. The portfolio

### 1.1 The name-translation table

AvePoint's website, price lists, docs and marketplace listings use **different names for the
same thing**. This is a practical quoting hazard.

| Marketing name (website) | SKU name (price lists, docs) |
|---|---|
| Data & Security Insights | **Insights for Microsoft 365** |
| Policy Enforcement & Drift Control | **Policies for Microsoft 365** |
| Records & Information Lifecycle Management | **AvePoint Opus** |
| Access & Power Platform Governance | **AvePoint EnPower** |
| Adoption & Usage Analytics | **AvePoint tyGraph** |
| License & Cost Management | **AvePoint Cense** |
| Data Owner Engagement | **AvePoint MyHub** |
| Workspace lifecycle | **AvePoint Cloud Governance** |
| Content and Identity Migration | **AvePoint Fly** |
| Agentic AI Governance | **AgentPulse Command Center** |
| Virtual data rooms | **AvePoint Confide** |
| MSP multi-tenant platform | **AvePoint Elements** |

Source: [VENDOR-OFFICIAL] https://www.avepoint.com/products, fetched 2026-08-28, cross-checked
against AvePoint's own published portfolio list.

The umbrella is the **AvePoint Confidence Platform**, framed around four data challenges —
Overexposed Data, Digital Sprawl, Data Loss & Interruption, Legacy & Fragmented Data. Platform
coverage: Microsoft 365, Google Workspace, Salesforce, Dynamics 365, Azure, Entra ID, Power
Platform. https://www.avepoint.com/products/confidence-platform

### 1.2 What each product does in this motion

| Product | What it does | Microsoft capability it replaces / augments |
|---|---|---|
| **Insights** | Aggregates permissions, sensitivity and activity across Teams, Groups, SharePoint, OneDrive (plus Google, Salesforce, AWS, Box, Jira and others in preview). Prioritizes by customer-defined risk. Bulk remediation in-report. | **Augments/replaces SAM DAG reports and EEEU insights — and works without SAM.** |
| **Policies** | 30+ out-of-the-box policies at service and tenant level. Detects configuration drift, alerts or auto-reverts **as often as every 2 hours**. Violations Report with click-to-fix. | No native M365 equivalent for continuous drift detection with auto-revert. |
| **Opus** | Information lifecycle: classification via the **Maestro** AI engine, retention, defensible disposal, archival to cheaper storage, **File Share Discovery** for on-prem. AI Recommendations GA Aug 2026. | Replaces/extends Purview retention labels and SharePoint archive. Differentiator: archival at **site, document, list and library** level vs SAM's site-only. |
| **EnPower** | Entra/M365/Power Platform delegated administration; sensitive-access monitoring; **AI agent lifecycle** — agent timeline reports, manual renewal, contact election, automated agent governance workflows. | Augments Entra PIM; replaces need for E5/Entra P2 in some delegation scenarios. |
| **Cense** | License allocation, adoption and budget reporting; surfaces users and agents driving pay-as-you-go AI charges. | Augments M365 admin center licensing and Copilot usage reports. |
| **tyGraph** | Workforce/adoption analytics. 2026 addition: site details showing **how AI agents interact with SharePoint content**. | Augments Viva Insights and the Copilot usage report. |
| **AgentPulse Command Center** | Discovery and inventory of agents across **Copilot Studio, Microsoft Foundry, SharePoint agents, personal agents, chat agents, Google Vertex AI**; agent risk definitions; DLP on **prompts, retrieval and outputs**; agent cost/FinOps. GA 2026-03-09. | Augments Copilot Studio admin, Purview DSPM for AI and SAM agent insights — and goes multicloud, which Microsoft does not. |
| **Cloud Governance** | Workspace provisioning, lifecycle, renewal/attestation, dynamic metadata, Enterprise App renewal. | Replaces manual provisioning + Entra access reviews (which need Entra P2). |
| **MyHub** | End-user workspace directory inside Teams; **owner recertification and attestation**; OneDrive cleanup attestations; Loop workspace governance. | **Replaces SAM Site Access Reviews** — which SMB tenants cannot have. |
| **Fly** | Migration: tenant-to-tenant, file share, on-prem, Google, Slack, Box, Dropbox. 2026: mobile device migration across Intune tenants. | Replaces manual/SPMT migration. |
| **Cloud Backup** | M365, Dynamics, Salesforce, Google, Azure/AWS, SaaS apps. 2026: external sharing recovery with automatic user reconnection; **Rapid Recovery System** prioritizing sites by activity/growth/size/sensitivity. | Replaces/augments Microsoft 365 Backup. |
| **Compliance Guardian** | Enterprise risk assessment, **150+ built-in checks**, automated protective actions (delete, quarantine, redact, encrypt). Cloud **and on-premises**. | Overlaps Purview DLP; reaches where Purview cannot. |
| **Elements** | Multi-tenant MSP platform. Six modules — Baseline Management, User & Device Management, Workspace Management, License Optimization, Risk & Change Management, Marketplace Integration. | Overlaps M365 Lighthouse and CIPP. |

Sources: [VENDOR-OFFICIAL] avepoint.com/products;
https://www.avepoint.com/blog/solutions-blog/avepoint-updates-august-2026;
https://www.avepoint.com/solutions/agentic-ai-governance; [PRESS] AgentPulse GA release
2026-03-09.

### 1.3 The dependency graph nobody puts in a slide

- **Policies ← Cense.** The two license-reclamation rules are annotated: *"You must have a
  Cense license to enable these rules!"* [VENDOR-OFFICIAL] AvePoint Policies Product Brochure.
- **Policies ← Insights.** Insights offers **Intelligent Remediation**, which *"suggests rules
  from Policies for Microsoft 365 matched to security risks detected by Insights."* The core
  loop — Insights finds it, Policies fixes and holds it — **only closes if you own both.**
- **Insights integrates with** MyHub, AgentPulse, Cloud Governance, Cloud Backup and Policies.
  Each integration needs its own subscription.
- **Opus tiering:** Analysis → Action → Archive, each a prerequisite for the next.

**Minimum viable stack for a Copilot readiness engagement: Insights + Policies.** Minimum
viable *sustainable* stack adds **MyHub** for owner attestation. Everything else is upsell.

---

## 2. When to use what — the stage mapping

### 2.1 AvePoint's own three-step frame

From the Copilot solution brochure: **Prepare your data** → **Secure your data** → **Optimize
only**. Its stated scan envelopes: **"Scan up to 100TB of data in your tenant"** (Opus ROT
analysis, delivered as Power BI reports) and **"Scan up to 5 TB of your collaboration data to
identify exposure risks such as content with anonymous links or Teams with shadow users"**
(Insights).

That 20:1 ratio shows where AvePoint thinks the effort is. It is also enterprise-shaped — a
78-seat customer does not have 5TB of collaboration data.

### 2.2 The mapping table

| Engagement stage | Product | Specific feature / report | What you get | Naming confidence |
|---|---|---|---|---|
| **Pre-sales / door-opener** | Insights (free trial) | **Risk Assessment Report** — out-of-the-box exportable PDF | *"Quickly summarizes changes to your environment, as well as identifying and prioritizing high-risk action items... Easily sharable, this PDF report can be used as a benchmark to track progress over time."* | **High** |
| **Pre-sales — AI angle** | AgentPulse | Automated agent discovery/inventory; creation/usage trend views | "You have 41 agents nobody inventoried." | High |
| **Discovery — permissions baseline** | Insights | **Risk Analysis → Workspaces Reports**, **Detailed Records Reports** | Workspace-level then item-level exposure. Full inventory, not a 28-day delta. | High |
| **Discovery — "who can see this"** | Insights | **Search Center** — object-based or user-based search | "Show me everything user X can reach." **The most demo-able screen.** | High |
| **Discovery — broad-access exposure** | Insights | **Exposure Report** | *"Surfaces where content is exposed through external sharing, broad access groups."* | Medium — report named; columns gated |
| **Discovery — the EEEU control** | Insights | **Risk Definition Administration** → exposure definitions | *"Use our recommended exposure definitions, or adjust large groups and external user settings."* | Medium |
| **Discovery — shadow users** | Insights | **Shadow Users and Groups Access Report** | Access via nested groups or direct grants the owner cannot see. | **High** — in nav tree AND service definition |
| **Discovery — links** | Insights | **Shared Links report** | Anonymous, company, specific-people links. | High |
| **Discovery — label coverage** | Insights | Risk prioritization by **Microsoft SITs and Sensitivity Labels** | Prioritization *by* label — **not** a standalone coverage report. | Medium |
| **Discovery — ROT and storage** | Opus | **Discovery & Analysis** → Power BI reports on ROT and inactive data; **File Share Discovery** | The data-quality half. Improves Copilot answer quality. | **High** |
| **Discovery — cross-tenant** | Insights | **Permissions Matrix Report** | *"Your springboard to manage permissions across tenants."* | **High** |
| **Findings readout** | Insights | Risk Assessment Report + Dashboard (risk score, activity, access) | The readout deck writes itself. | High |
| **Findings readout — data story** | Opus | Power BI export to SharePoint (2026) | Partner can brand the ROT analysis rather than screenshot AvePoint's UI. | High |
| **Remediation — bulk fix** | Insights | **Risk Remediation** + in-report bulk actions | *"expire, remove, or edit permissions granted to external users, shadow users, or via anonymous links."* **Expiry is what native tooling handles worst.** | High |
| **Remediation — rule suggestion** | Insights → Policies | **Intelligent Remediation** | Insights proposes the Policies rule that would have prevented the finding. **Best demo moment in the platform; the upsell bridge.** | High |
| **Remediation — owner-led** | MyHub | Recertification / attestation, incl. OneDrive cleanup | Push the decision to the site owner. | High |
| **Ongoing — drift** | Policies | **Violations Report**; External Sharing Settings, Teams Settings Enforcement, **Remove Shadow Users**, Shared Channel Creation Restriction, Scan External Users, Direct Sharing Prevention | Alert or revert **every 2 hours**. | **High** |
| **Ongoing — tenant** | Policies | **Ghost User Detection**, Groups/Teams Creation & Deletion Restriction, **Remove Inactive Guest Users**, **Control Access from Unmanaged Devices** | Ghost User Detection and Inactive Guest Users are what SMBs notice first. | High |
| **Ongoing — provisioning** | Cloud Governance | Provisioning workflows, renewal/attestation, Enterprise App renewal | Stops new sprawl. | High |
| **Copilot enablement — licensing** | Cense | License allocation, adoption, budget; PAYG AI spend by user/agent | "Which 12 people get the license" and "who is burning credits." | High |
| **Copilot enablement — agents** | AgentPulse | Agent risk definitions; DLP on prompts, retrieval, outputs; cost tracking | Governs the agent, not just the content. | High |
| **Copilot enablement — agent lifecycle** | EnPower | Agent timeline reports, manual renewal, contact election | Ownership and renewal for agents. | High |
| **Copilot enablement — agent ownership rules** | Policies | Agent ownership governance rules; channel ownership enforcement | New Aug 2026. | High |
| **Post-deployment — risk** | Insights | **Time-based security dashboards** for **anonymous links, external user access, shadow users**; risk score over time | **These three metrics are the QBR scorecard.** | **High** |
| **Post-deployment — adoption** | tyGraph | Usage analytics; AI agent interactions with SharePoint content | Proves the Copilot spend. | High |
| **Post-deployment — agent sprawl** | Insights | **Agent Reports** under Risk Analysis — *"identify high-risk, inactive, or ownerless agents"* | A cheaper path to basic agent hygiene than AgentPulse. | High |
| **Audit trail** | Insights | **Activity Explorer**; central audit of admin activity | Answers "who at the MSP changed what." | High |
| **Multi-tenant delivery** | **Elements** | **Permission Simulation**; **CIS Level 2** baselines; SharePoint workspace management; sensitivity label management; License Optimization | Portfolio-scale layer. **No AI/Copilot governance as of June 2026.** | High |

### 2.3 Two honesty notes that must survive into the guide

**(a) AvePoint does not publicly name an "Everyone Except External Users" report.** Microsoft
names EEEU explicitly in SAM. AvePoint's equivalent is configurable *"exposure definitions"*
over *"large groups and external user settings."* The capability almost certainly covers EEEU,
but the exact report column could not be verified because docs are gated. **Workshop question 9.**

**(b) There is no publicly named sensitivity-label coverage report.** Insights *uses* labels as
a prioritization input. Whether it produces "% of sites labeled / unlabeled sites holding PII"
is unverified. **Workshop question 10.**

---

## 3. The Business Premium question

### 3.1 The Microsoft constraint

SAM requires a base of **O365 E3/E5/A5 or M365 E1/E3/E5/A5** (or GCC/GCC-High/DoD). Business
Premium is not on that list — see [`09-verifications.md`](09-verifications.md) V-06. The typical
SMB tenant therefore cannot obtain DAG reports, permission state reports, EEEU insights,
sharing-links activity, Restricted Content Discovery, site access reviews, site policy
comparison or agent access insights — **even if it buys Copilot seats.**

### 3.2 What AvePoint covers for a Business Premium tenant

| Unavailable on Business Premium | AvePoint substitute | AvePoint's own MS-license dependency |
|---|---|---|
| DAG / permission state reports | **Insights** — Workspaces + Detailed Records; Permissions Matrix | **None found** |
| EEEU insights | **Insights** — Exposure Report + exposure definitions | None found |
| Sharing links activity (28-day) | **Insights** — Shared Links, **full history not a 28-day window** | None found |
| Site access reviews | **MyHub** attestation; **Cloud Governance** renewal | None found |
| **Restricted Content Discovery** | **No direct equivalent.** AvePoint's answer is to fix the permission rather than hide the content. Arguably better; definitely slower. | n/a |
| Restricted SharePoint Search | No equivalent | n/a |
| Site policy comparison | **Policies** (30+ OOTB) and **Elements Baseline Management** (CIS L1/L2) | see 3.3 |
| Agent access insights | Insights Agent Reports, AgentPulse, EnPower | None found |
| Entra Access Reviews (needs P2) | MyHub attestation + Cloud Governance renewal | None found |

### 3.3 Where AvePoint DOES have a Microsoft-license dependency

[VENDOR-OFFICIAL] https://learn.avepoint.com/policies-for-microsoft-365/about-policies-for-microsoft-365.html, fetched 2026-08-28:

| AvePoint Policies capability | Requires |
|---|---|
| Content Sensitivity Label Enforcement | **Microsoft 365 E5** |
| Site Sensitivity Label Enforcement | **Microsoft 365 E5** |
| Content Creation and Upload Restriction | **Microsoft 365 E5** |
| Inactive Guest User Detection | **Microsoft Entra ID P1/P2** |

Business Premium includes Entra ID P1, so the guest rule works. The three E5 rules do not. All
three are **label-enforcement** rules. **AvePoint has not built around Microsoft's E5 label
wall; it inherits it.**

### 3.4 The headline for the guide

> For a Microsoft 365 Business Premium tenant, AvePoint Insights delivers the discovery half of
> what SharePoint Advanced Management would give an E3+Copilot tenant, with no Microsoft E-SKU
> dependency and better history depth than SAM's 28-day window. AvePoint Policies delivers
> continuous drift enforcement that has no Microsoft equivalent at any SKU — except three
> sensitivity-label enforcement rules that still require E5. Restricted Content Discovery has no
> AvePoint equivalent; AvePoint's position is that you should fix the permission rather than
> hide the site.

**Caveat to verify:** Insights' risk prioritization leans on Microsoft SITs and the Microsoft
activity feed, whose depth varies by SKU. **No AvePoint statement exists on degraded Insights
functionality at Business Premium level.** It is plausible Insights works with a thinner
sensitivity signal. **Workshop question 6 — the most commercially important one here.**

---

## 4. Partner commercials

### 4.1 Elements

Six modules. The one packaging fact AvePoint publishes: *"Baseline, Workspace, or User
Management automatically unlocks Risk, Change, and Marketplace capabilities at no extra cost."*
Effectively **three purchasable modules with three bundled**.

Shipped June 2026: mandatory MFA enrollment for local users; Azure Virtual Desktop Session
Monitor (preview); **Permission Simulation**; centralized SharePoint management workspace;
automated license management by user activity; **CIS Level 2 profiles out of the box**;
multitenant baseline deployment wizard; **sensitivity label management**; Azure database
security rules. **Zero mentions of Copilot or AI.**

An **Elements Graph API** exists (https://learn.avepoint.com/graphapi/elements/overview.html) —
meaning a partner can pull Elements data into Rewst/CloudRadial/ScalePad rather than living in
AvePoint's UI.

**Pricing: none published anywhere.** No tier, no trial, no minimum, no free edition. Only CTA
is "Request a Demo." The Elements "Get started" page — where onboarding, licensing and GDAP
requirements live — is behind the login.

### 4.2 The partner program

Relaunched as a **points-based Global Partner Program, 2025-08-12** ([PRESS]).

- Partners **advance on engagement and expertise rather than revenue alone** — explicitly framed
  as *"enabling smaller but highly committed partners to access premium benefits."* The most
  partner-relevant sentence AvePoint has published.
- Points from: partner development and onboarding, pre-sales lead generation, recurring services
  revenue, renewal rates, co-marketing.
- Higher tiers: lead sharing, co-sell support, **business development investment funds** (the
  MDF analogue), dedicated solution engineering, certifications, speaking opportunities.
- Public pages claim **"6,000+ Channel partners"**, **"100+ Marketplaces"**, and *"tiered
  pricing that increases with partner engagement."* The MSP page adds **AvePoint Partner Talent
  Services** — rentable delivery specialists.

**Not published anywhere public:** tier names, point thresholds, discount percentages, deal
registration mechanics, MDF amounts, **NFR/internal-use entitlement**, certification
requirements. All behind the partner portal.

**Leverage for the negotiation** [PRESS]: partner-generated ARR reached **58% in Q1 2026**;
channel is *"roughly half of AvePoint's recurrent business"*; sales-and-marketing cost fell from
41% of revenue (2021) to ~31%. Q1 2026 SaaS revenue $93.4M (+35% YoY). **AvePoint needs the
channel more than the channel needs AvePoint, and they know it.**

### 4.3 Where to buy

AvePoint's list: TD SYNNEX, TechData, Carahsoft and several other distributors.

- **a competing distributor** — confirmed. Listed SKUs: **Elements**, **tyGraph**, **MyHub**, **Cloud Backup**,
  **Fly**, **AvePoint Control Suite**. No public pricing. **"AvePoint Control Suite" appears
  only in a competing distributor's taxonomy and nowhere on avepoint.com — workshop question 4.**
- **TD SYNNEX StreamOne Ion** — confirmed; Elements plus backup/data-management. A StreamOne Ion
  **ConnectWise connector** exists, relevant for MSP billing automation.
- **a competing distributor** — **still unconfirmed.** Absent from AvePoint's own where-to-buy page. **Do not
  assert a competing distributor availability.**
- **Microsoft commercial marketplace** — listings exist for Insights, Policies (BYOL) and Cloud
  Governance. Plans-and-price tabs returned **403** to automated fetch. **A partner with a
  browser should check these — highest-yield remaining public-pricing lead.**

### 4.4 Pricing — there is none, in US dollars, anywhere

**AvePoint publishes no US pricing for any product in the portfolio.** Non-US public-sector
framework schedules were located during this research and are **deliberately not carried
forward** — foreign-currency, foreign-market, framework-specific rates from 2024 are not a
usable basis for quoting a US SMB customer, and reproducing them invites exactly the wrong
kind of confidence.

What is established and usable:

| Fact | Detail |
|---|---|
| Seat minimum | **500 users** on nearly every SKU on AvePoint's own published list; 12-month minimum term on the Policies and Insights bundle |
| Elements (MSP platform) | **No pricing published in any form.** No tier, no minimum, no trial, no free edition. Only CTA is "Request a Demo." |
| AgentPulse | **No pricing published.** GA 2026-03-09. |
| Distribution pricing | Behind partner authentication |
| Microsoft commercial marketplace listings | Exist for Insights, Policies (BYOL) and Cloud Governance; plan-and-price tabs returned HTTP 403 to automated fetch. **A partner with a browser should check these** — best remaining public-pricing lead. |
| De-identified aggregate contract data | One third-party source reports a ~$48k/year average for "AvePoint, SMB (50–1,000 employees)", n=6, whole-portfolio not per-SKU. `[UNVERIFIED]` — **never show a client.** |

**The action:** get a written quote at the real seat count through TD SYNNEX, and ask whether
seats aggregate across a portfolio of small tenants to meet the 500-user floor.

---

## 5. Free and low-cost assessment tools

| Offer | What it is | Cost |
|---|---|---|
| **Self-serve 30-day free trial** | Both the Insights and Policies brochures carry *"Start your free trial today: www.avepointonlineservices.com."* a public-sector framework confirms *"possible to trial the product for a 30 day period at no cost online."* | **Free, 30 days** |
| **Insights Risk Assessment Report** | The shareable PDF. **This is the trial's deliverable.** | Free within trial |
| **Trial license via account portal** | *"AvePoint provides trials of software... with limited user or data allowance for testing."* http://account.avepoint.com | Free, limited |
| **MSP Copilot Technical Readiness Checklist** (eBook) | Four steps; **does not name AvePoint products in visible content**, which makes it more useful as a client-facing artifact than most vendor content. | Free, email-gated |
| **Gartner reprint** — "Go Beyond Baseline Microsoft 365 GenAI Controls to Secure Copilot" | The more useful of the two gated eBooks for a boardroom. | Free, gated |
| **Partner white-label kits** | White-labeled kits, centralized onboarding, campaign-ready content, partner-edition brochures. | With partnership |

**What does not exist:** there is **no free AvePoint Copilot readiness scan** analogous to
Varonis's, and **no free tier of Insights**. This is a genuine competitive weakness and the
guide should say so.

**The partner play that works:** 30-day Insights trial as the assessment engine → Risk
Assessment Report as the readout → your labor around it. Because the report is designed to be
re-run as a benchmark, **the second run is the recurring-revenue hook.** Pair with free
ScubaGear/Maester output for the configuration-baseline half Insights does not touch.

---

## 6. Minimums and the SMB reality

| Source | Minimum stated |
|---|---|
| AvePoint's own a public-sector framework pricing document (2024-05-03) | **500 users** on nearly every SKU; 12-month minimum term on P&I |
| Reseller listings | **Not specified** |
| Policies listing | **Not specified** |
| Reseller listings, bundle | **Not specified** |
| Elements | No minimum published — no pricing published at all |
| Distribution | Behind partner authentication |

**Arguments the minimum is negotiable or absent in channel:** a competing distributor's entire model is
small-quantity monthly resale to SMB-serving MSPs, and AvePoint chose to list six SKUs there —
a 500-seat floor is structurally incompatible. AvePoint's own marketing says *"a cost
effective solution to meet the varied needs of customers, big and small."* The 2025 program
explicitly rewards smaller partners. Channel is 58% of ARR.

100TB/5TB envelopes are enterprise-shaped; even discounted, the ~$48k average SMB contract is
not a 78-seat number.

### The position for the guide

> AvePoint's own published price list carries a 500-user minimum that would price out a 78-seat
> customer entirely. UK reseller listings for the same SKUs publish per-user rates with no stated
> minimum, and AvePoint's a competing distributor presence is structurally incompatible with a 500-seat floor — but
> **no public source confirms that channel purchase removes it.** Until a partner obtains a
> written quote at sub-100 seats, treat AvePoint as **unproven below 100 seats and confirmed
> viable above 500.** Portfolio aggregation — committing 500+ seats across many small tenants —
> is the obvious ask.

**Workshop question 1, and it decides whether AvePoint is a recommendation or a "when you grow
into it."**

---

## 7. Honest competitive positioning

### Genuinely stronger

**Against native Microsoft (SAM):**
- **License reach.** Insights works on Business Premium; SAM does not. For 25–300 seats this is
  not a feature advantage, it is an *availability* advantage, and it is decisive.
- **History depth.** SAM's sharing-links and EEEU insights are scoped to 28 days; Insights keeps
  a continuous inventory.
- **Archival granularity.** SAM archives sites only; Opus archives sites, documents, lists and
  libraries with bring-your-own storage.
- **Continuous enforcement.** Policies' alert-or-revert every 2 hours has no Microsoft
  equivalent at any SKU.
- **Cross-workload and multicloud.** Microsoft governs Microsoft.

**Against Syskit Point:** far broader portfolio, genuine multicloud, a real MSP multi-tenant
platform. Syskit's pricing page does not mention MSP or multi-tenant at all.
**Against ShareGate:** Protect is narrower — no records management, licensing optimization,
agent governance or migration breadth.
**Against CoreView:** comparable multi-tenant story, but CoreView puts Access Reviews, SharePoint
control, auditing and delegation behind **optional add-ons**; Insights includes bulk remediation
in base.
**Against Varonis:** dramatically cheaper, and has an actual channel/MSP motion.

### Genuinely weaker — say these out loud

- **Pricing opacity is worse than competitors'.** Syskit publishes €10/€20/€30 per user per year.
  Orchestry publishes $2,499 flat per tenant. ManageEngine publishes a full band grid. AvePoint
  publishes a Request Pricing button. **In a category where transparency exists, choosing not to
  publish is a competitive disadvantage and a real friction cost.**
- **Documentation is gated.** A partner cannot pre-qualify AvePoint against a client requirement
  without a sales conversation.
- **No free assessment tool.** Varonis gives one away. Weaker land motion.
- **Seat minimums are the harshest documented in the category** — 500 vs Syskit/Rencore's 100 vs
  Orchestry Starter and ManageEngine's none.
- **Portfolio sprawl is a delivery cost.** Ten products with a cross-dependency graph. Syskit
  does the core job in three tiers with one product. For a small MSP training two engineers, that
  simplicity has real value AvePoint cannot match.
- **The MSP console and the governance products are separate.** Elements has no AI/Copilot
  governance and, on public evidence, does not surface Insights or Policies data. Rencore
  explicitly markets *"manage multiple customer tenants without having to switch accounts."*
  AvePoint has not made that claim for governance.
- **AvePoint's own SAM comparison is dated.** It presents SAM as 28-day-only and admin-led,
  understating SAM as of Aug 2026 — permission state reports give a current-state snapshot, site
  access reviews *are* a delegation model, RCD and site policy comparison exist. **Do not repeat
  AvePoint's framing uncritically; anyone who has read Microsoft's docs will correct you, and it
  costs credibility.**
- **AgentPulse is unpriced and enterprise-shaped.**

### In one paragraph

For a 25–300 seat practice, **AvePoint is the strongest option on capability breadth and the
weakest on commercial accessibility.** Right for the top of the range (150–300 seats, regulated,
already buying Cloud Backup, needing records management or multicloud); wrong at 40 seats unless
the channel demonstrably removes the minimum. The tools that beat it at the bottom of the range
beat it on price transparency and unit of purchase, not on function.

---

## 8. What could not be determined

Elements pricing/tiering/minimums/free tier · AgentPulse pricing or MSP availability ·
AvePoint's current 2026 rate card outside the 2024 UK framework · distribution
prices · Microsoft marketplace plan pricing (403) · partner tier names, thresholds, margins, MDF
amounts, deal registration, NFR entitlement · the internal structure of the Insights Exposure
report · the full Policies rule catalog · whether Insights degrades on Business Premium ·
whether a competing distributor carries AvePoint.

---

## 9. The 22 questions to ask AvePoint at the workshop

Ordered by commercial value. **The first five change the guide's recommendation.**

**Commercial / minimums**
1. **Does buying through a competing distributor or TD SYNNEX remove the 500-user minimum on Policies & Insights?
   If not, can a partner aggregate seats across a portfolio of tenants to meet it?** *(Get it in
   writing.)*
2. What is the actual per-seat price for Policies & Insights at 75, 150 and 300 seats, in the
3. What is Elements priced at, on what unit, with what minimum, and is there a free or NFR tier?
   Which of Baseline / Workspace / User Management is the entry purchase?
4. **What is "AvePoint Control Suite," which appears in the a competing distributor catalog but nowhere on
   avepoint.com? Does it bundle Insights and Policies?**
5. What is AgentPulse priced at, on what unit, and is it available through distribution?

**The Business Premium question**
6. **Does Insights function at full fidelity on a Business Premium tenant?** Are Microsoft SITs,
   sensitivity labels and the activity feed available, or is the risk-prioritization signal
   degraded?
7. Beyond the four documented dependencies, does any AvePoint capability require an E-SKU?
8. Does AvePoint have any equivalent to Restricted Content Discovery — excluding a site from
   Copilot grounding without changing its permissions?

**Product specifics**
9. In the Exposure Report, is "Everyone Except External Users" a first-class named exposure type,
   or configured through "large groups"? **Show me the screen.**
10. Is there a sensitivity-label coverage report — "% of sites labeled" / "unlabeled sites
    containing PII"? Or is label data only a prioritization input?
11. Which specific report shows permission drift over time? Can drift be reported per-site to a
    site owner rather than to IT?
12. When does agent governance reach the multi-tenant Elements console? The June 2026 release
    contains none of it.
13. Can Elements surface Insights and Policies findings across tenants, or does governance remain
    a per-tenant login?
14. What is the Elements Graph API's coverage? Can a partner pull findings into Rewst,
    CloudRadial or ScalePad for QBR reporting?

**Partner program**
15. Tier names, point thresholds, discount at each tier, deal-registration process and discount?
16. What NFR / internal-use licenses does a partner get, and at which tier?
17. Are business development investment funds available below the top tier, and what is the claim
    process?
18. **Can we get AvePoint Learn documentation logins for our engineers, today?** *(Cheapest,
    highest-value ask in the room.)*
19. Is there a partner-deliverable free assessment artifact comparable to Varonis's, beyond the
    30-day trial?
20. What is the trial's actual user and data allowance, and can a partner run sequential trials
    across a portfolio of prospects without friction?

**Sanity checks**
21. Does AvePoint sell through a competing distributor? (Absent from your own where-to-buy page.)
    partner-delivered version at SMB scale? What does a partner earn delivering it?
