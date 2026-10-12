# Who is already monetizing Copilot consumption management, and how

**Gathered:** 2026-10-11. **Status:** research record, no page changed. Research-agent memo, kept verbatim; first person is the agent's.
**Part of:** [`research/token-economics-practice/`](./00-synthesis-and-talk-track.md). Tags: **PUBLISHED** means the price is on the vendor's own site. **REPORTED** means press, blog or community. **INFERRED** means derived here. No distributor is used as a primary source; the one distributor-originated item is marked [distributor source] and UNVERIFIED.

---

## A. Headline verdict

**Nobody serving SMBs is yet visibly monetizing consumption management as a priced, recurring line item.** Across about 60 searches and 35 page fetches I found three groups:

1. **Free or advisory "set your spending policies before the deadline" offers.** This is the dominant pattern. Typical forms are a free 15–30 minute session in the admin center, a free licensing review, or a consultation. Examples include Quisitive, Windows Management Experts, Universal Cloud, Solv Systems, Coretek, Technspire and Managed Solution. None publishes an ongoing fee.
2. **Priced Copilot governance and adoption retainers that leave consumption out or barely mention it.** The best published example is Ericom (Australia): three monthly tiers with stated hours. Its scope covers telemetry and usage reviews but says nothing about credit budgets, spending policies or re-billing.
3. **Named but unpriced "agent cost" services.** FiveForward (UK) "Embed" says it keeps clients' agents running and controls credit spend by moving routine steps to standard automations. No price is shown.

I found **no SMB MSP that publicly re-bills Copilot Credits with a markup.** I also found none that publishes an included-credit allowance with overage, or prices per agent. The only published guidance on re-billing structure is vendor content marketing (Scopable). It explicitly advises against unlimited usage and recommends watch, approval and stop thresholds, but quotes no markup percentage.

**Why the market is behind:** the deadlines only just arrived. Cowork usage billing began July 1, 2026. Microsoft announced on 2026-10-01 that CSP Copilot Business licenses get usage-based billing on by default from **2026-12-01** (moved from November 2), with a default limit of 4,000 credits per user per month ([Partner Center, Oct 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-october)). At $0.01 per credit that default is a **$40 per user per month exposure ceiling (INFERRED)**, almost twice the $21 license itself. That gap is the sales argument for a managed service, and nobody has turned it into a packaged offer yet.

Note the conflicting figure: Channel Insider (2026-09-29) reported the preset limit as "$10 per user per month" ([source](https://www.channelinsider.com/channel-business/news-microsoft-copilot-csp-partner-opportunities/)). Microsoft's own October 1 update says 4,000 credits. Use Microsoft's figure.

**What the best SMB offers look like (a composite, since no single offer has it all):**
- A paid onboarding or readiness fee
- A per-user or per-tenant monthly governance layer
- Telemetry and usage reviews on a monthly cadence
- A QBR "value pack"
- Explicit exclusions (agent builds and configuration changes are scoped separately)

The missing piece in every one is a **credit budget the client approves, with thresholds, an approval workflow and a monthly credits-to-value report**. That is the thesis, and it is open ground.

---

## B. SMB MSP examples

| Who | Offer | What's included | Price / model | Source and date |
|---|---|---|---|---|
| **Ericom** (AU MSP) | Microsoft 365 Copilot Governance and Adoption | AI Council, monthly governance forums, policy records, risk register, persona mapping, champion network, "usage monitoring against your scenarios", Copilot telemetry reviews, DLP and label assessment, maturity benchmarking. Excludes incident support, configuration changes, training delivery and agent building. | **PUBLISHED.** Foundation A$2,330/mo (8 hrs), Accelerate A$4,660/mo (16 hrs), Scale A$9,320/mo (32 hrs). Onboarding A$2,330. Extra hours A$340. 6-month minimum, then 3-month rolling. Retainer by hours, **no consumption component.** | [ericom.com.au](https://ericom.com.au/solutions/ai/ai-managed-services/), accessed 2026-10-11 (no page date) |
| **FiveForward** (UK) | "Embed" stage of the FiveForward Framework, plus "Discover" to build credit budgets | Ongoing agent management, credit cost control, routine steps moved to standard automation, rechecking Microsoft rate cards | **Not published** (free 30-minute call) | [fiveforward.co.uk](https://fiveforward.co.uk/insights/copilot-credits-explained-what-each-microsoft-workload-costs/), updated 2026-10-03 |
| **Universal Cloud** (NL) | Copilot Credits cost-management setup | Spending limits and alerts matched to budget, choosing Cowork pilot teams, the Anthropic-model enablement decision, usage monitoring | Not published (contact form) | [universal.cloud](https://universal.cloud/en/blog/article/copilot-credits-copilot-business-november-2026/), 2026-09-17 |
| **Solv Systems** (consultancy) | Copilot setup "so the first invoice holds no surprises" | Spending policies and user limits sized from real usage, a pilot group, agents only where the numbers justify them | Not published | [solv-systems.com](https://solv-systems.com/resources/copilot-business-usage-based-billing), 2026-10-08 |
| **Quisitive** (Microsoft Frontier Partner) | Free Copilot Cowork consumption session | 15–30 minutes live in the admin center; leaves spending policies, alerts and model routing configured | **PUBLISHED: free**, one-time | [quisitive.com](https://quisitive.com/copilot-cowork-pricing-2026-how-usage-based-billing-works/), 2026 (pre-July 1) |
| **Windows Management Experts** | Free licensing review plus pilot planning | Checks the Azure billing link, spending policies, pilot users, usage monitoring | Free review; implementation not priced | [windowsmanagementexperts.com](https://windowsmanagementexperts.com/copilot-cowork-credit-based-billing/), 2026 |
| **Coretek** | Cowork telemetry analysis | Recommends the right mix of PAYG, capacity packs and pre-purchase via Customer Success | Not published | [coretek.com](https://coretek.com/blog/copilot-cowork-billing-what-it-means-for-your-business), 2026 |
| **Copilot Consulting** | Managed Governance Service | Monthly compliance reports with an analyst call, quarterly risk reviews, 24/7 governance-metric monitoring, audit evidence | "Contact for quote"; fixed price or time and materials. **No consumption line.** | [copilotconsulting.com](https://www.copilotconsulting.com/services/managed-governance), [/pricing](https://www.copilotconsulting.com/pricing), 2026 |

**Benchmarks from vendor content (REPORTED, not actual MSP offers):**
- Scopable recommends a "$500 to $1,500 onboarding engagement plus a $15 to $25 per user monthly management layer" for Copilot ([2026-05-20](https://scopable.io/blog/microsoft-copilot-for-msps)).
- Scopable also suggests: readiness assessment $2,500–$6,000, Copilot rollout $3,500–$10,000, AI governance retainer $750–$2,500/month, workflow automation $5,000–$25,000 ([2026](https://scopable.io/blog/msp-ai-services-pricing-2026)).
- Scopable's resale math: about $540/year of margin on 25 seats at 10%. That is the case for service revenue over resale margin.

**Platform enablement aimed at MSPs:**
- **Inforcer Copilot Manager** (launched 2026-05-01, 200+ MSPs in beta) covers adoption visibility, power users, unused licenses and shadow AI. Neither the launch coverage nor the product write-up mentions credit or consumption monitoring. Pricing is not disclosed. ([Technology Reseller](https://technologyreseller.uk/inforcer-launches-copilot-manager-to-help-msps-scale-secure-profitable-ai-services/), [ChannelPro 2026-05-07](https://www.channelpronetwork.com/2026/05/07/copilot-manager/))
- **Nerdio** argues "Copilot is a service, not a SKU" (2026-07-08) but gives no pricing and no consumption content ([source](https://getnerdio.com/blog/copilot-is-a-service-not-a-sku-how-msps-are-packaging-ai-enablement-for-real-revenue/)).
- **[distributor source], UNVERIFIED:** a distributor runs a "Managed Intelligence Provider" program and markets Copilot Business within it. Treat it as **competitor-sensitive** and do not cite it by name.

**Where I looked and found nothing on consumption:** ConnectWise, Kaseya, N-able, Huntress, Auvik, SkyKick, CoreView, Augmentt (its 2026 Secure Autopilot release covers DLP for Copilot, not credits), CloudCapsule (its Cowork post for MSPs, 2026-07-10, advises piloting and monitoring credits but describes no credit feature: [source](https://www.cloudcapsule.io/blog/copilot-cowork-usage-based-pricing-msp-review/)) and Microsoft 365 Lighthouse. Reddit r/msp and ChannelE2E either did not surface relevant threads or could not be fetched (HTTP 403).

---

## C. Enterprise frameworks and their common skeleton

| Firm | Named offer / framework | Shape | Pricing model | Savings claimed | Source |
|---|---|---|---|---|---|
| **Microsoft (partner guidance)** | M365 Copilot Managed Services Playbook ("M365 MSP to E7 MSP") | Assess (wk 0–2), Activate (wk 3–6), Adopt (wk 7–12), Optimize & Govern (ongoing: monthly governance review, QBR value packs), Extend with Agents (includes "agent lifecycle & cost governance") | Per-user or per-tenant monthly managed fee (REPORTED via search summary; full text not fetchable) | none | [Tech Community](https://techcommunity.microsoft.com/blog/partnernews/from-m365-msp-to-m365-e7-msp-your-playbook-is-here/4530981), 2026 |
| **Kyndryl** | Agentic Service Management | Maturity assessment, gap analysis against ISO 42001, phased roadmap, run through Kyndryl Bridge; governance via Agentic AI Digital Trust | Not disclosed | none (cites 200M automations a month) | [kyndryl.com](https://www.kyndryl.com/us/en/about-us/news/2026/04/new-agentic-service-management), 2026-04-02 |
| **Cognizant** | Secure AI Services | Lifecycle security, runtime monitoring, governance and compliance for agentic AI | Not disclosed | none | 8-K exhibit, [SEC](https://www.sec.gov/Archives/edgar/data/0001058290/000105829026000030/exhibit9916302026.htm), May 2026 (REPORTED via search summary) |
| **EY** | Agentic FinOps / EY.ai Value Blueprints | 7-category TCO: tokens, licenses, platform, governance, organizational change, failure and recovery, "AI taxes"; assign budget owners before spending | Not disclosed | Example of one interaction costing 30x more ($0.04 in 2023, $1.20 in 2026) | [ey.com](https://www.ey.com/en_us/insights/ai/agentic-ai-token-costs), 2026-06-01 |
| **Deloitte** | AI token economics for CFOs | Strategy first, value across the chain, rigorous oversight with dedicated FinOps and KPIs | Recommends usage-, outcome- or value-based pricing over per-seat | Cites a client case: "90% cost savings while tripling token volumes" | [deloitte.com](https://www.deloitte.com/us/en/services/consulting/articles/cfo-guide-ai-token-economics.html), 2026-04-22 |
| **KPMG** | Q2 AI Pulse (survey, not a service) | 35% of leaders say AI cost literacy (token and inference pricing) is a barrier | n/a | n/a | [kpmg.com](https://kpmg.com/us/en/media/news/q2-ai-pulse-2026.html), Q2 2026 |
| **Insight** | M365 E7 launch partner, Agent 365 launch partner, "client zero" | Agent governance plus managed security | Not disclosed | 91% internal Copilot adoption | [BusinessWire](https://www.businesswire.com/news/home/20260701463525/en/Insight-to-Offer-Microsoft-365-E7-AI-Powered-Frontier-Suite-to-Market-Leading-by-Example-with-Its-Own-Enterprise-Wide-Deployment), 2026-07-01 |
| **Eficode** (GitHub partner) | Copilot Usage and Readiness Review | Cost impact, which teams use it, what drives consumption, model guidance, ownership, link to outcomes | Not disclosed | none | [eficode.com](https://www.eficode.com/insights/blog/turning-github-copilot-usage-based-billing-into-a-competitive-advantage), 2026-05-13 |

**Industry frame:**
- The FinOps Foundation's "FinOps for AI" uses Crawl, Walk, Run. It flags allocation, anomaly management, forecasting and rate optimization as the capabilities that behave differently for AI ([updated 2026-02-17](https://www.finops.org/wg/finops-for-ai-overview/)).
- The Linux Foundation launched a **Tokenomics Foundation** at FinOps X (CIO Dive, [2026-06-12](https://www.ciodive.com/news/foundation-tackle-ai-token-cost-management/822839/)).
- The State of FinOps 2026 says 98% of practitioners now manage AI spend (SiliconANGLE, [2026-06-10](https://siliconangle.com/2026/06/10/finops-ai-goes-beyond-token-economics-agentic-costs-emerge-finopsx/)).
- TSIA (2026-02-04) says pricing is moving to a hybrid of subscription, consumption and outcome components ([source](https://www.tsia.com/blog/state-of-managed-services-2026-ai-economics)).

**Common skeleton across all of them.** Proposed phase vocabulary:
1. **Assess / Inform.** Baseline usage, readiness, TCO categories, estimates from the Copilot Credit Estimator.
2. **Activate / Guardrail.** Billing method, spending policies, user and policy limits, alerts, request routing.
3. **Adopt / Attribute.** Pilot cohorts, showback by user, group, agent and department.
4. **Optimize / Govern (ongoing).** Monthly review of top consumers, idle agents, right-sizing among capacity packs, pre-purchase and PAYG, model routing.
5. **Extend / Prove value.** Agent lifecycle, outcome metrics, QBR value pack.

**Gaps across the enterprise firms:** Avanade, Accenture, Capgemini, Infosys, TCS, Wipro, CDW, SoftwareOne, DXC, PwC and Rackspace have no **named Copilot-consumption managed service with public pricing**. The SIs talk about outcome-based deals in general. Capgemini cited a "non-FTE" agentic mega-deal, per the HFS Agentic Services 2026 report ([PDF](https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/2026/04/hfs-horizons-agentic-services-2026.pdf)), but nothing is tied to Copilot Credits. The Accenture/Avanade "agentic factory" is sold by subscription ([Accenture newsroom, 2026](https://newsroom.accenture.com/news/2026/accenture-and-avanade-collaborate-with-microsoft-to-develop-agentic-factory-to-help-reduce-manufacturing-downtime)). That is an outcome-product model, not consumption management.

---

## D. Tooling that makes it deliverable

**Microsoft native (the real delivery surface):**
- **Copilot > Cost management** in the M365 admin center ([Learn, updated 2026-10-02](https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-overview-copilot-credits)) covers:
  - spending policies at organization, user and group level, with policy alerts and per-user threshold notifications
  - credit-request routing
  - consumption by policy, user, group, agent, service and funding source
  - read-only "reader" roles for finance
  - "Auto-apply new services" **on by default**, which is a risk an MSP should review
- **MC1479276** (2026-09-25): FinOps for AI capabilities went to preview in September 2026, including model and effort assignment by Entra group and consumption dashboards in Insights. End-user credit visibility is GA ([merill.net](https://mc.merill.net/message/MC1479276)).
- **Agent 365 cost management** now covers Cowork, Work IQ, Code and Managed Runtime, with Copilot Studio planned for October 2026 (Tech Community "What's new in Agent 365, Sept 2026", reported via search).
- **Power Platform admin center** gives per-agent Copilot Studio consumption.
- **Microsoft Analytics Hub (GitHub Pages)** has several Power BI and browser templates ([source](https://microsoft.github.io/Analytics-Hub/cowork-billing/)):
  - **Consumption Central** spans Cowork, Copilot Studio, GitHub Copilot and Foundry.
  - **Cowork Credit Chargeback** includes row-level security and watchlists.
  - A FOCUS-aligned FinOps report and a Multi-Budget Chargeback tool are also available.
  - All of these are single-tenant and CSV- or Viva-based.
- **Critical constraint:** since September 2026 the Copilot Credit consumption endpoint returns **HTTP 403** to flows, connectors and scripts. A "supported alternative" is expected later in 2026 ([MCS CAT blog](https://microsoft.github.io/mcscatblog/posts/copilot-credit-consumption-api/), [PR #379](https://github.com/microsoft/mcscatblog/pull/379)). **Automated multi-tenant credit monitoring is therefore not currently possible through supported APIs.**
- **Partner Center:** credits land on the customer's Azure subscription and show up in the daily rated usage reconciliation files ([Learn](https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-compare-dashboard-views)). That is billing data, not governance data.
- **ASPX** now surfaces Cowork usage signals for selling ([Sept 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-september)).

**Third-party:**
- **Rencore** (page dated about August 2026): GA cost management for Copilot Studio, covering chargeback by owner and department, alerts within 7 days of PAYG thresholds, idle-agent detection and pack right-sizing. Agent Builder, Agent 365 and Cowork are "coming soon." No MSP or multi-tenant support is stated and no price is given ([rencore.com](https://rencore.com/en/solution/manage-copilot-agent-costs/)). **Closest commercial product to a credit dashboard.**
- **Flexera AI Spend Management** (early access, announced at FinOps X 2026) covers applications, agents and models ([Flexera recap](https://www.flexera.com/blog/perspectives/finops-x-2026-recap/)).
- **IBM Cloudability** added Anthropic and OpenAI connectors in 2026.
- **CloudZero, Finout and Vantage** cover LLM-API token spend. I found **no M365 Copilot Credit connector** from any of them; GitHub Copilot is reported only via cloud or GitHub connections ([CloudZero](https://www.cloudzero.com/blog/ai-cost-management/), [Finout](https://www.finout.io/blog/ai-budgeting-guide-13-tools-to-control-ai-spend)).

**AI gateways:** Azure APIM `llm-token-limit` plus per-subscription token metrics for chargeback, Cloudflare AI Gateway spend limits (up to 20 rules, returns 429 or falls back to a cheaper model), LiteLLM budgets per key and team (open source), and Portkey budgets (Enterprise tier) ([Maxim](https://www.getmaxim.ai/articles/ai-spend-management-top-5-gateways-for-team-budgets-in-2026/), [APIM sample](https://github.com/chmald/ai-cost-governance-gateway)). **Gateways cannot sit in front of M365 Copilot, Cowork or Copilot Studio SaaS traffic.** They only govern Foundry or direct-API workloads. For an SMB Copilot practice, gateways belong in the "custom agents" tier, not in core credit management.

---

## E. Re-billing norms and markup evidence

**Copilot Credits specifically:** **no published markup evidence.** The best structural guidance (Scopable, [2026-07-04](https://scopable.io/blog/ai-billing-for-msps)):
- Keep license, usage, managed service and project labor as separate lines.
- Never sell unlimited usage.
- Set a monthly usage allowance per pilot group.
- Use watch, approval and stop thresholds.
- Get written approval before raising limits.

**Analogs (all REPORTED):**
- **Azure in CSP:**
  - About 15% Partner Earned Credit for managed consumption, paid only with correct PAL/AOBO attribution. The FY27 Azure ceiling is about 15% versus about 19–20% for Modern Work ([licenseq](https://licenseq.com/microsoft-fy27-partner-incentives/), [Cloud Factory blog](https://blog.cloudfactorygroup.com/posts/microsoft-fy27-partner-incentives-what-changed-and-how-to-get-paid-now)).
  - Net Azure resale margin is often 3–8% for indirect resellers. Compute markups run 10–25% with value-add ([search synthesis of CloudBolt and Scopable](https://www.cloudbolt.io/azure-expert-msp/azure-csp-billing/)).
  - Four billing models: pass-through plus a management fee (cleanest), cost-plus, percentage of spend, and fixed bundles (only with hard caps) ([Scopable Azure CSP](https://scopable.io/blog/azure-csp-billing-msps)).
- **AWS MSPs:** a management fee of **10–25% of spend**, or 5–10% for AWS Managed Services. FinOps-as-a-service runs $2,000–$10,000/month ([CloudBolt](https://www.cloudbolt.io/msp-best-practices/msp-pricing-models/), [Opsio](https://opsiocloud.com/knowledge-base/aws-managed-services-cost-pricing/)).
- **Telecom expense management:** 1–5% of spend (smaller clients nearer 5%), $1–$15 per device per month, or gain-share at 15–50% of identified savings ([Tellennium](https://tellennium.com/how-much-will-a-telecom-expense-management-service-cost/), [Socium](https://www.sociumit.com/resources/blog/tem-pricing-guide-2026)).

**Microsoft is already paying for consumption, not just seats:**
- The **Copilot Cowork CSP Activation Incentive** launched 2026-09-01 ([Partner Center Sept 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-september)). Terms, as reported (not shown on the Microsoft page): $50 per qualified incremental Cowork monthly active user, capped at $12,500 per tenant, with thresholds of 50+ Cowork MAU and $2,500+ monthly Cowork consumption sustained through month three.
- **Growth margin** went live 2026-10-01 on qualifying Copilot growth ([Oct 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-october)).
- **INFERRED implication:** partners have a reason to grow consumption, which conflicts with a "cost control" pitch. The honest framing is "governed growth": budget plus value proof, not minimization.

**Price anchors for re-billing math:**
- PAYG is $0.01 per credit. A capacity pack is $200 for 25,000 credits ($0.008 each).
- The Pre-Purchase Plan runs from 5% off at 3,000 CCCU ($2,850) to 20% off at 3,000,000 CCCU ([CIAOPS, 2026-06-20](https://blog.ciaops.com/2026/06/20/copilot-credit-pre-purchase-plans/)).
- A pack bought at $0.008 and re-billed at PAYG-equivalent $0.01 gives a **20% spread (INFERRED)**. That is the most natural "markup" for an MSP pooling packs, but nobody publishes doing it.

---

## F. White space (what nobody is doing yet)

1. **Multi-tenant credit monitoring for MSPs.**
   - Lighthouse, Inforcer, Augmentt, CoreView, Nerdio and CloudCapsule show no credit dashboards.
   - Microsoft's own templates are single-tenant, and the consumption API has returned 403 since September.
   - Whoever ships cross-tenant credit visibility first, or whoever builds the manual monthly-export process into a service, owns the category.
2. **A priced included-credit bundle with overage**, for example "Copilot Managed: 2,000 credits per user per month included, $X per 1,000 above, approval at 80%." I found zero examples.
3. **Per-agent retainers**, meaning a monthly fee per production agent covering tuning, cost per run and idle-agent retirement. Rencore has the tooling; no SMB MSP sells the service.
4. **A credits-to-value QBR**: credits spent per outcome, using the Cowork ROI model and Insights dashboards. Microsoft's playbook names "QBR value packs" but nobody shows the artifact.
5. **Default-on remediation as a December 1 campaign.** Lowering 4,000 credits ($40 per user) to a client-approved limit is a concrete, time-boxed, sellable action. Competitors are offering it free.
6. **Managed GitHub Copilot with AI-credit governance for SMB.** GitHub moved to AI Credits on 2026-06-01 ([GitHub blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)), and Reddit reports of bill shock followed. The only partner offer I found is Eficode's unpriced enterprise review. GitHub Copilot Harness now also bills through M365 Copilot Credits, so a unified "one credit budget" service is open.
7. **Re-billing contract language.** Nobody publishes MSA or SOW clauses for Copilot Credit pass-through, approval authority or who owns pre-purchase commitments. The Azure-CSP analog exists; the Copilot one does not.

**Competitor-sensitive flags:** the distributor "Managed Intelligence" program (do not name). Microsoft's Cowork incentive and growth margin terms are partly gated; verify against the incentives guide ([aka.ms/coworkactivationbonus](https://aka.ms/coworkactivationbonus)) before publishing figures.

**Fetch limits:** these were 403 or rendered empty, so their content above comes only from search summaries: MSSP Alert, ChannelE2E, Business Standard and Microsoft Tech Community pages (E7 MSP playbook, Agent 365 Sept 2026).
