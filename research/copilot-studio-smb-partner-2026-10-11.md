# Copilot Studio for the SMB CSP partner: cost nuances, partner economics and a calculator teardown

**Gathered:** 2026-10-11. **Status:** research record, no code changed.
**Feeds:** [`specs/copilot-credit-planner.spec.md`](../specs/copilot-credit-planner.spec.md), the build contract for `copilot-credit-planner.html`.
**Builds on:** [`research/cowork-calculator-studio-autopilot-2026-10-11.md`](./cowork-calculator-studio-autopilot-2026-10-11.md), which holds the verified rate card, the nine P3 tiers and the Microsoft worked examples. That file is still the authority on those constants; this one adds what an SMB partner trips over around them. It also builds on [`research/copilot-studio-outcomes/`](./copilot-studio-outcomes/) (2026-08-28), and supersedes it where they differ.

**Inputs:** two research passes on 2026-10-11:
1. an SMB nuance sweep across Microsoft Learn, the October 2026 Copilot Studio Licensing Guide and Copilot Credits Guide, Partner Center announcements and the Business Central docs;
2. a hands-on teardown of nine Copilot Studio cost calculators, each run against the same three SMB scenarios.

**Source rules for this file.**
- Dates are the page's `ms.date`, or the guide's publication month.
- Learn URLs were rebuilt from the page slugs the research pass recorded. Spot-check each one before a page links to it.
- No wholesale distributor is named. Where a figure came only from a distributor's blog, the source reads **[distributor source withheld]** and the figure is marked **UNVERIFIED**. It must not reach a page until a Microsoft source confirms it.
- Customer Zero data does not appear here.
- Community and ISV calculators are named, because they are tools, not competitors.

**Status words used below.**

| Word | Meaning |
|---|---|
| **Verified** | Stated in a Microsoft primary source. |
| **LIKELY** | Implied by Microsoft sources in more than one place, but never stated in one sentence. The calculator labels it Likely. |
| **UNVERIFIED** | Secondary source only. Never priced on a page. |
| **Inference** | Our reading, with the reasoning shown. |

---

## 1. SMB cost nuances: the lines that sit next to the credit pool

The Studio rate card is deterministic (see the earlier research file, §3). SMB quotes go wrong on everything *next to* it. These are the lines a partner has to name, or explain why they don't apply.

### 1.1 Dataverse capacity

Every Copilot Studio agent lives in a Dataverse environment, and transcripts and uploaded knowledge files take up capacity in it.

| Item | Value | Status | Source |
|---|---|---|---|
| Tenant default with no Copilot Studio entitlement (Business Basic, Standard or Premium) | 3 GB database, 3 GB file, 1 GB log | Verified | environments-overview (2026-05-28); capacity-storage (2026-09-30) |
| One-time tenant default once a Copilot Credit purchasing option is configured | 15 GB database, 20 GB file, 2 GB log. It is granted once and **does not grow with more packs**. | Verified | Copilot Studio Licensing Guide, Oct 2026, p. 8 |
| Free database capacity needed to create a production or sandbox environment | 1 GB of tenant database capacity | Verified | environments-overview (2026-05-28) |
| Capacity add-ons, annual, per GB per month | Database $40; Database Tier 2 $30 (minimum 1,000 GB); File $2; Log $10 | Verified | Licensing Guide, Oct 2026, p. 9 |
| Dataverse pay-as-you-go, per environment, above 1 GB database and 1 GB file | Database $48; File $2.40; Log $12 per GB per month | Verified | Licensing Guide, Oct 2026, p. 9 |
| At 100% of capacity | Creating, copying and restoring environments is blocked. After 30 days, sandboxes go into admin mode. After 90 days, environments are disabled. Environments linked to pay-as-you-go are exempt. | Verified | capacity-storage (2026-09-30) |
| Conversation transcripts | Saved to Dataverse. Default retention 30 days. They can be switched off, but that breaks enhanced reporting. | Verified | admin-transcript-controls (2026-08-27) |
| Uploaded knowledge files | 512 MB per file; 500 files per agent. The Dataverse search index counts toward database capacity. | Verified | knowledge-add-file-upload (2026-09-29) |

**Calculator implications.**
- Dataverse is a **non-credit adjacent line**. It is never added to the credit pool.
- Show the baseline: 3/3/1 GB by default, or 15/20/2 GB once a pack or pay-as-you-go is configured.
- Grow the database line by transcripts (sessions × KB per session × retention) and by knowledge files plus their search index.
- Price any overage at $40 per GB a month (annual add-on) or $48 (pay-as-you-go), and say which one.
- Warn when an environment would leave less than 1 GB of free tenant database capacity, because the customer then cannot create the sandbox the plan recommends.

### 1.2 Flows and request limits

| Item | Value | Status | Source |
|---|---|---|---|
| Agent flows | Billed in Copilot Credits (13 per 100 actions), not in Power Platform requests | Verified | flows-overview (2026-06-18); rate card |
| Cloud flows | Use Power Automate licensing and sit outside Copilot Studio enforcement | Verified | flows-overview (2026-06-18) |
| Converting a cloud flow to an agent flow | One-way. There is no route back. | Verified | flows-overview (2026-06-18) |
| Request limits per 24 hours | Microsoft 365 seeded: 6,000 per user. Copilot Studio packs: 250,000. Power Automate Premium: 40,000 per user. Power Automate Process: 250,000 per flow. | Verified | api-request-limits-allocations (2026-09-08) |

**Calculator implications.**
- Agent flows go in the credit trace. Cloud flows do not; they raise a Power Automate Premium flag when they use premium connectors.
- Converting a cloud flow to an agent flow triggers a one-way warning in the environments section.

### 1.3 Pay-as-you-go through Azure, in CSP

| Item | Value | Status | Source |
|---|---|---|---|
| How PAYG is wired in CSP | The reseller creates the Azure subscription and links it through a billing policy in the Power Platform admin center | Verified | copilot pay-as-you-go overview (2026-07-17) |
| New CSP Copilot Business licenses from December 1, 2026 | Include the Azure setup | Verified | Partner Center announcements, October 2026 (2026-10-08) |
| PAYG and P3 against Azure commitments | Both decrement MACC. Neither is eligible for Azure Prepayment. | Verified | copilot pay-as-you-go overview (2026-07-17); copilot-credit-p3 |
| BYOM / Azure AI Foundry models | Billed separately on Azure, not in Copilot Credits | Verified | billing-licensing (2026-08-03) |

**Calculator implications.**
- "No billing path" (no pack, no PAYG link and no Azure subscription) is the first next-best-action rule. Nothing else matters until it is fixed.
- BYOM is an editable pass-through line in adjacent costs, never in the pool.

### 1.4 Pre-purchase: Copilot Credit P3 and Agent P3

- **Copilot Credit P3:** the nine fixed tiers are in the earlier file, §2.1 (F-155).
- **Agent P3:** 20K / 100K / 500K Agent Commit Units at 5% / 10% / 15% (F-177). It applies after Copilot Credit P3 in the billing order.

**Calculator implications.**
- Agent P3 is **disclosed only**. The optimizer never recommends it, because its eligibility for Copilot Studio credits in an SMB tenant is not confirmed for CSP.

### 1.5 Windows 365 for Agents (computer use hosting)

| Item | Value | Status | Source |
|---|---|---|---|
| PAYG hosting | $0.40 per VM-hour (US) up to $0.80 (South America) | Verified | microsoft.com/windows-365/agents; pricing-paygo-always-available (2026-05-01) |
| Always-available Cloud PC | $5–$10 per VM per month, plus hourly | Verified | as above |
| Trial | 50 free hours | Verified | as above |
| Hosted browser / Cloud PC pool | Preview | Verified | configure-where-computer-use-runs (2026-05-07) |

**Calculator implications.**
- This is an Azure line, separate from credits.
- Price it as hours × $0.40, plus $5 per always-on PC (F-171). The $5–$10 range and the regional ceiling go in the fact notes.
- Computer-use steps themselves are credits (5 standard, 15 premium, F-170) and are **never zero-rated**.

### 1.6 Agent 365

| Item | Value | Status | Source |
|---|---|---|---|
| Price | $15 per user per month, annual (F-009), or included in E7 at $99 (F-049) | Verified | Agent 365 overview; licensing FAQ |
| Who is licensed | Each user who delegates to, owns or sponsors agents | Verified | Agent 365 licensing FAQ (question 122) |
| SMB prerequisite from 2026-06-01 | Business Premium | Verified | Partner Center, July 2026 |
| Full functionality | Needs Defender Suite and Purview Suite | Verified | Agent 365 product terms |

**Calculator implications.**
- The line is **$15 × agent owners and sponsors**, not × every user who chats with an agent.
- It is blocked with an explanation when the tenant base is not Business Premium.
- The earlier dossier (`copilot-studio-outcomes/06`) flagged that "interacts with" could be read as every user. The FAQ's owner/delegate/sponsor wording narrows it, but the spec keeps this in the open register until a CSP price-list check.

### 1.7 Entra Agent ID

Agent identities have been created automatically for new agents since May 2026, with no license cost listed (admin-use-entra-agent-identities, 2026-08-21).

**Calculator implications.**
- No line.
- One governance-sheet row: "agent identities are created for you; review them in Entra."

### 1.8 Work IQ and Managed Runtime

- **Work IQ Tools API:** variable, plus 0.1 credit per tool call. It is not included in the Copilot license (F-174).
- **Copilot Managed Runtime:** 0.1 credit per API call, in paid preview.
- **Microsoft 365 UBB scope:** both are planned to join it.

**Calculator implications.**
- Out of Release 1.
- The Work IQ lane comes in Release 2. Until then, the Studio tab says plainly that Work IQ calls are not modeled and are never zero-rated.

### 1.9 Support

Professional Direct support is optional, at $9 per license per month.

**Calculator implications.**
- Not modeled. Mentioned once in the research only.

---

## 2. Environments and application lifecycle (ALM)

| Item | Value | Status | Source |
|---|---|---|---|
| Developer and trial environments on UBB from 2026-09-01 | Applies to the **GitHub Copilot harness**. Build, preview, evaluation and runtime are all billed, whatever the license. The standard and chat harnesses are unaffected. | Verified | manage-usage-github-copilot-harness (2026-08-28) |
| Test chat and flow-designer test runs | Do not consume credits | Verified | as above |
| Trial licenses | Can build and test, but cannot publish. Trial environments last 30 days. Developer environments have one owner. | Verified | requirements-licensing (2026-05-04); environments-overview |
| Environments without an allocation | Draw from the tenant pool by default | Verified | manage-copilot-studio-copilot-credits-capacity (2026-10-02) |
| Microsoft's cost-isolation posture | Allocate a fixed amount. Turn off tenant draw. Don't link PAYG. Set per-agent limits. Classify environments as Exploration, Test/validation or Funded production. There is **no tenant-wide default agent limit**. | Verified | guidance/govern-credit-consumption (2026-10-06) |
| Managed Environments | Included with the Studio tenant license, Copilot-for-Studio rights or Studio PAYG. Once it is on, **all active usage in that environment needs premium licenses**. Enforcement starts February 2027. | Verified | managed-environment-licensing (2026-08-31) |

**Recommended SMB layout** (inference from the Microsoft posture above):

| Environment | Role | Credit setting |
|---|---|---|
| **Default** | Personal productivity | Business Central agents draw here unless the BC environment is relinked |
| **Production** (one) | All published agents | A fixed allocation, plus a per-agent cap on each agent |
| **Sandbox** (one) | Builds and tests | A small fixed allocation, with tenant draw off |

Managed Environments go on the agent Production environment only, and only when it holds no seeded users.

**Calculator implications.**
- The Studio tab's "Build and environments" section proposes this three-environment layout and a per-environment allocation.
- It raises a February 2027 warning when Managed Environments are on in an environment that has seeded (non-premium) users.
- GitHub harness build burn is a separate pre-go-live line (F-173). Standard-harness test chat is free, and the page says so, so partners stop padding the SOW for it.

---

## 3. Channels, audience, authentication, and zero-rating

The zero-rating rule is the single biggest lever in an SMB quote. It is **narrower than partners assume**. A conversation is zero-rated only when **all four** of these hold:
1. the user is licensed;
2. they are authenticated with their own Microsoft identity;
3. they are in a Microsoft channel: Copilot Chat, Teams or SharePoint;
4. the agent runs on the standard or chat harness, and the step is not computer use or Work IQ.

The source is publication-fundamentals-publish-channels (2026-09-16), plus the rate card.

| Situation | Billed? | Status |
|---|---|---|
| Websites, Direct Line custom apps | Always billed | Verified |
| Facebook, WhatsApp | Always billed | Verified |
| Azure Bot Service channels (Slack, Telegram, Twilio SMS, Line, Email) | Always billed | Verified |
| Telephony and voice | Always billed | Verified |
| Handoff to Dynamics 365 Customer Service | Always billed | Verified |
| Teams guests, and unlicensed internal users | Billed | Inference: no license covers them |
| Autonomous trigger runs under a licensed maker | Billed | LIKELY (F-182) |

**Authentication modes** (configuration-end-user-authentication, 2026-05-01):

| Mode | Where it works | Zero-ratable? |
|---|---|---|
| **None** | Public channels only | No |
| **Microsoft** | Required for Teams and Microsoft 365 | **The only mode that can be zero-rated** |
| **Manual** (Entra or OAuth2) | Any channel | No, always billed |

**Copilot Chat users without a Copilot license** (m365-agents-admin-guide, 2026-04-07):
- Instruction-only and public-web agents are free.
- Agents grounded in tenant data are metered. They are **off by default**, and they need a pack or PAYG.
- The Power Platform admin center reports this usage under "Microsoft 365 Copilot Chat".
- Users of agents need no license of their own.

**Teams Phone Agent:** needs Teams Phone plus a resource-account license. A long call runs to 40 or more credits. This is out of Release 1 and noted for the voice lane.

**Calculator implications.**
- Each agent card asks **audience × channel × authentication** as three separate fields, never as one "licensed share" slider.
- **Licensed users are a headcount**, subtracted once.
- Invalid combinations are refused with a reason. For example, "no authentication" cannot be chosen with Teams.
- Each priced line carries a reason code (`Z-…`) and a chip: Billed, Zero-rated, or Billed (Likely).

---

## 4. First-party agents, with Business Central formulas

### 4.1 Business Central Sales Order Agent (sales-order-agent, 2026-10-02)

| Step, per email | Credits |
|---|---|
| Analyze the email | 2 |
| Each availability check | 5 |
| Each quote or order create/update | 5 |
| Reply | 2 |
| Attachments | 5 if sales data is found, 2 if not |

**Microsoft's example:** `[2 + 5 + 5 + 2 + (5 × 0.5)] × 100 = 1,650` credits a month. The 0.5 is the share of emails with an attachment that holds sales data.

### 4.2 Business Central Payables Agent (payables-agent, 2026-10-02)

- **Rate:** 50 credits per invoice, plus 5 per invoice line.
- **Microsoft's example:** `(50 + 5 × 3) × 100 = 6,500` credits a month.
- **Operating limits:** 100 emails a day; 500 invoices a day; PDFs of 10 pages or fewer and 5 MB or less.
- **Emails without a valid PDF** are free.

### 4.3 Business Central Expense Agent

50 credits per receipt (preview).

### 4.4 Behavior that matters to the quote

- **Where BC agents draw credits:** from the **default Power Platform environment**, unless the BC environment is linked to another one (tenant-admin-center-manage-consumption-billing, 2026-02-04).
- **When credits run out**, the agent stops, then works through the backlog later (sales-order-agent, 2026-10-02). That is a delay, not data loss, and it's still an SLA conversation.

### 4.5 Dynamics 365 Sales and Customer Service agents

- **Where the rates live:** in the Dynamics 365 Licensing Guide. Microsoft's estimator covers Sales Qualification, Case Management, Customer Intent, Quality Evaluation, Account Reconciliation and Supplier Communications.
- **1,000 credits per Premium user per month:** a secondary source claims this allowance. **UNVERIFIED**; not used.

### 4.6 SharePoint agents and Agent Builder

- **Who can use them:** licensed users, or anyone once PAYG is enabled.
- **Agent Builder generative answers without tenant grounding** are free.
- **SharePoint "advanced" tasks** are billed through UBB, even for licensed users.
- **Templates:** Microsoft publishes no per-template consumption.

**Calculator implications.**
- The archetype menu ships three BC cards with the formulas above, each with "reproduce Microsoft's example" (1,650 and 6,500).
- They default to the default environment, which fires next-best-action rule 7: relink and cap.
- The Payables card shows the operating limits beside the volume field, and refuses volumes above 500 invoices a day.
- Agent Builder ungrounded answers carry their own zero-rated reason code.

---

## 5. SMB licensing mechanics

| Item | Value | Status | Source |
|---|---|---|---|
| Copilot Studio User License | $0, for makers. Requires a tenant pack. | Verified | Licensing Guide, Oct 2026 |
| Makers in PAYG or P3 tenants | Use the free Author role, granted through a security group in the Power Platform admin center | Verified | requirements-licensing (2026-05-04) |
| Capacity pack | SKU CFQ7TTC0LH1F, $200 a month billed annually (F-013). CSP can sell credits. | Verified | Licensing Guide, Oct 2026 |
| CSP pack price points | $210 (one-year term, monthly billing); $240 (one-month term) | **UNVERIFIED** | [distributor source withheld] |
| PAYG | Needs an Azure subscription | Verified | copilot pay-as-you-go overview (2026-07-17) |
| P3 | Bought in the Azure portal | Verified | copilot-credit-p3 |
| Power Apps / Power Automate premium | Not needed for agent flows. Needed for cloud flows with premium connectors, for apps, and for users in Managed Environments. | Verified | managed-environment-licensing (2026-08-31); flows-overview |

**SMB Copilot SKUs** (Partner Center, July 2026; F-144 to F-147, F-176):

| SKU | Price |
|---|---|
| Business Standard with Copilot | $23.50 |
| Business Premium with Copilot | $32 |
| Business Basic + Copilot Business | $21, promotional |
| Copilot Business standalone | $18 promotional through December 2026; $21 annual list; $25.20 monthly billing |

All of them carry a **300-seat cap**.

**Calculator implications.**
- Seats are entered by SKU.
- The crossover uses the price the customer will actually pay: promo while it is live, then annual or monthly list.
- "Buy" routes to the partner's quote, never to Microsoft's direct signup.
- The pack price shown is the Microsoft list price (F-013). A CSP price point is a provider input, never a default.

---

## 6. Partner economics, FY27

| Item | Value | Status | Source |
|---|---|---|---|
| CSP growth margin, live 2026-10-01 | For Copilot, E5, E7, Defender Suite, Purview Suite and W365 Enterprise. **Copilot Studio is not listed.** | Verified | Partner Center, October 2026 (2026-10-08) |
| Defender / Purview Suite for Business Premium | 7.5% promo, under 300 seats | Verified | Partner Center, October 2026 |
| Copilot in 30 | A 25-user, 30-day Copilot Business trial for customers under 300 employees, through CSP, from 2026-08-01 | Verified | Partner Center, July 2026 (2026-07-29) |
| UBB default-on, 2026-12-01 | 4,000 credits per user per month (F-156, F-157). Excluded at first: AU, BE, BR, FR, DE, IN, IT, KR, NL, PL, ES. | Verified | Partner Center, October 2026 |
| Cowork activation incentive | Exists; terms gated | Verified that it exists | Partner Center, September 2026 |
| Agentic Business Solutions specialization, Pathway Two | Two new Copilot Studio deployments of at least $10K TTM each (F-178), under CPOR, CSP T1 or CSP T2 | Verified | Partner Center, August 2026; July 2026 spec |
| Pathway Two skills | 5 people as Functional Consultant, Intelligent App Builder or AI Agent Builder; 2 as Developer or RPA; 2 with AB-100 | Verified | as above |
| Pathway Two other requirements | A Marketplace consulting offer, plus the AI Business Solutions or Cloud & AI Platforms designation | Verified | as above |
| M365 Copilot specialization | Requires AB-100 or AB-620 | Verified | Partner Center, July 2026 |
| Frontier Partner specialization | Later in FY27 | Verified as announced | Partner Center |
| FY27 Copilot Agents Voucher | Copilot Studio Platform Subscription purchases from 2026-07-01 to 2027-06-30. **CSP customers are ineligible.** The partner must be Copilot Jumpstart Ready or above. Redeem within 6 months; 30% is paid at SOW approval and 70% at proof of execution. | Verified | FPC knowledge base article KB-01841 |
| MCI rates for Copilot Studio | Not found | **UNVERIFIED** | [distributor source withheld] |
| PEC on the Copilot Credit PAYG meter | Not stated for this meter | **UNVERIFIED** | partner-earned-credit (2024-10-07) is generic |
| Partner service pricing | Microsoft publishes no guidance | — | — |

**Calculator implications.**
- Partner economics are partner-only, and limited to verified incentives.
- PEC on the meter defaults to 0, is editable, and is labeled unverified.
- The voucher card says plainly that it does not apply to CSP customers.
- Specialization progress counts a modeled deployment toward the $10K bar.
- Service prices come from this site's own Playbook (`type: "our-price"`), never from Microsoft.

---

## 7. Value and ROI: Agent Assisted Hours and Agent Assisted Value

| Item | Value | Status | Source |
|---|---|---|---|
| Cost savings per run or per tool | Configurable in Copilot Studio analytics | Verified | analytics-cost-savings (2025-09-18) |
| Agent Assisted Hours (AAH) | (knowledge references + weighted sessions without references) × multiplier. Escalated or abandoned sessions are weighted 0.7. The default multiplier is 6 minutes. The autonomous action multiplier is about 2.8 minutes. | Verified | guidance/agent-business-value-metrics-reference (2026-06-04) |
| Agent Assisted Value (AAV) | AAH × $72 an hour by default, editable (F-154) | Verified | as above |
| Viva Insights report eligibility | At least 50 Copilot licenses and at least 4 weeks of data. **Many SMB tenants will not qualify.** | Verified | Viva Insights copilot-studio-agents template (2026-06-23) |
| Deflection guidance | $5–$10 per human contact against about $0.50 per resolved agent session | Verified but **stale** | guidance/deflection-overview (2024-05-03) |
| SMB case studies with numbers | None found | — | — |

**Calculator implications.**
- Value is optional, off in the customer print until the partner switches it on, and labeled "Microsoft's formula, your inputs".
- The page states the 50-license eligibility rule. For most SMB tenants, this calculation is the only Agent Assisted Value figure they will see.
- The deflection cost per human contact defaults to empty. The 2024 range is shown as a hint, with its date.

---

## 8. Governance controls, and the export columns for the Release 2 actuals import

### 8.1 Controls a partner can set (the governance sheet)

| Control | Where | Behavior |
|---|---|---|
| Per-agent monthly limit, notification threshold and hard stop | Power Platform admin center → Licensing → Copilot Studio → Manage agents | Stops one agent, not the tenant |
| Environment allocation, plus the tenant-draw toggle | Power Platform admin center → Licensing → Copilot Studio → Environments | An allocated environment stops drawing on the tenant pool once draw is off |
| Environment-group rule "Cost controls – Draw from tenant credit pool" | Power Platform admin center → Environment groups → Rules | Sets the draw policy for every environment in the group |
| Azure budgets | Azure portal → Cost Management → Budgets | **Alert only**. They never stop spend. |
| Microsoft 365 spending policies | Microsoft 365 admin center → Billing → Cost management | User, group or tenant scope; monthly limit; per-user limit; threshold emails; billing method |
| "Auto-apply new services" | Within each spending policy | **On by default.** New billed services (Autopilot, Teams Phone Agent, Managed Runtime, SharePoint advanced) join existing policies automatically. |
| Transcript retention | Copilot Studio admin transcript controls | Default 30 days |

### 8.2 Export columns: what Release 2 can map

**Power Platform admin center, detailed environment report.**
- Columns: Agent name, Product / AI feature, Channel, LLM model, Knowledge sources / Tool used, Billed credits, Non-billed credits.
- Granularity: daily for 3 months, monthly for 12 months.

**Microsoft 365 admin center, Cost Management Policies view.**
- Fields: Policy, Policy status, Scope, Active users, Credit usage, Current spending limit, Limit utilization, Billing method.
- Exports are asynchronous snapshots, and **their column headers are unpublished**.
- Refresh: Overview every 4 hours, Consumption every 2 hours.

**Power Platform request CSV.**
- Columns: Environment ID, Environment Name, Caller ID, Caller Type, Usage Datetime, Entitled quantity, Total consumed quantity, Power Automate Requests.
- The non-licensed variant adds Resource Type, Resource ID, Meter Category, Meter Subcategory and Consumed Quantity.

**Calculator implications.**
- Release 1 ships the governance settings sheet (customer-safe, with click paths) and no import.
- Release 2's actuals import must map columns by meaning, never by exact header string. This is the same lesson as the Copilot usage export.
- "Billed credits" and "Non-billed credits" map to Billed and Zero-rated, which is a direct check on the audience matrix.

---

## 9. Upcoming changes

| Change | When | Effect on the calculator |
|---|---|---|
| Agent 365 cost management extended to Copilot Studio agents | Planned, October 2026 | Governance sheet gains a row when it ships |
| Microsoft 365 UBB scope grows: Teams Phone Agent, Managed Runtime, SharePoint advanced. "Auto-apply new services" stays on by default. | Rolling | Governance sheet's Auto-apply row; NBA copy |
| Managed Environments licensing enforcement | February 2027 | Environments warning (§2) |
| Managed Runtime and apps | Paid preview | Not modeled |
| Ignite 2026 billing changes | None published yet. **Re-check after November 17–20.** | "Re-check after Ignite" stamp on the page; review the rate card by 2026-11-24 |
| CSP Copilot Business UBB default-on | 2026-12-01 | NBA rule 5, plus the enforcement timeline |
| Copilot Business $18 promo ends | 2026-12-31 | Crossover switches to $21 / $25.20 |

---

## 10. Studio calculator teardown

### 10.1 The three SMB anchor scenarios

These anchors are for a 60-seat professional-services firm.

**Rate card used** (F-161 to F-170):

| Item | Credits |
|---|---|
| Classic answer | 1 |
| Generative answer | 2 |
| Agent action | 5 |
| Tenant graph grounding | 10 |
| Agent flow actions | 13 per 100 |
| AI tools, basic / standard / premium | 0.1 / 1.5 / 10 per response, or per 1K tokens |
| Reasoning | +10 per 1K tokens |

**Billing rules applied:**
- Licensed B2E use is zero-rated in Microsoft channels under the user's own identity.
- Flows are free only through the agent trigger.
- Computer use is never free.
- PAYG is $0.01 a credit; a pack is 25,000 credits for $200.

**A. Website FAQ and lead capture** (external, unauthenticated, generative)
- **Base:** 1,500 conversations a month × 5 turns = 7,500 generative answers × 2 = **15,000 credits = $150 a month**.
- **Sensitivity, 20% classic:** 6,000 × 2 + 1,500 × 1 = **13,500**.
- **Sensitivity, lead capture:** if 20% of conversations log a lead with one action, 300 × 5 adds **1,500**.

**B. Internal HR/IT helpdesk** (tenant-graph grounded, 5 turns, Teams)
- **Per turn:** 2 (generative) + 10 (grounding) = **12**.
- **Gross:** 60 users × 4 conversations a month × 5 turns = 1,200 turns × 12 = **14,400**.
- **Zero-rated:** 20 licensed users in Teams, Microsoft 365 or SharePoint = 400 turns × 12 = **4,800**.
- **Net billed:** 40 unlicensed × 20 turns × 12 = **9,600 = $96 a month**.
- **On a non-Microsoft channel:** all **14,400** are billed.

**C. Autonomous invoice intake**
- **Base:** 400 runs × (6 actions × 5 + 1 premium prompt × 10) = 400 × 40 = **16,000 credits = $160 a month**.
- **Trigger counted as an action, or the prompt counted as an action:** 400 × 45 = **18,000**.
- **Premium prompt priced per 1K tokens at 1,500 tokens:** two started 1K units = 20 per run, so 400 × 50 = **20,000**.
- **One content page per invoice:** 400 × 8 adds **3,200**.

**Portfolio: 40,600 credits a month (487,200 a year)**

| Purchase option | Monthly | Annual | Note |
|---|---|---|---|
| PAYG only | $406 | $4,872 | — |
| 2 packs | $400 | $4,800 | 9,400 credits unused every month (no rollover) |
| **1 pack + 15,600 PAYG** | **$356** | **$4,272** | **Best** |
| P3 Tier 1 + PAYG | — | $4,722 | 300K credits at 5% ($2,850) + 187,200 PAYG ($1,872) |

**Arithmetic and rules behind these options.**
- **Billing order:** packs, then P3, then PAYG (F-181). Packs also apply to Cowork spending policies, so this portfolio and a Cowork lane share one pool.
- **Pack break-even:** a pack pays off once monthly overflow exceeds 20,000 credits ($200 ÷ $0.01).

**License vs meter, for scenario B.**
- An unlicensed helpdesk user costs 240 credits ($2.40) a month.
- At the Copilot Business $21 list price, a seat pays for itself on metering alone only above about 2,100 credits a user a month.
- So seats in this scenario must be justified by Copilot and Cowork value, not by agent metering. The calculator has to say that both ways.

**Cowork pooling.** Microsoft's planning model puts 20 Cowork knowledge workers at about 102K–181K credits a month. That alone dwarfs this agent portfolio, and it moves the purchase decision into P3 territory once pooled.

### 10.2 Nine tools against the anchors

Totals are A + B + C against 40,600.

| Tool | A | B | C | Total vs 40,600 | What went wrong, or right |
|---|---|---|---|---|---|
| **Microsoft Copilot Studio agent usage estimator** (microsoft.github.io/copilot-studio-estimator) | 15,000 | **4,800** | 14,001.5 | −16.7% | (1) **Licensed-user double subtraction.** It shows 9,600 consumed for the 40 unlicensed users, then "−4,800 negated for 20 users". With 30 licensed users, the net is 0. `multi-agent-calculations.js` computes billable = total − licensed *and* calls `calculateNegatedCredits`. (2) Premium prompt modifier of 1.5 credits per trigger, not 10. (3) No autonomous type. (4) "% of responses from knowledge" drops the remainder, so 80% gives 12,000, not 13,500. (5) "Buy Copilot Credits" links to Microsoft direct signup (SKU CFQ7TTC0LH1F), not CSP. PDF export and multi-agent cards are good. |
| **Microsoft web Copilot Credit Estimator** (aka.ms/CopilotCreditPlanningModel) | — | — | — | n/a | Covers Cowork and the GitHub harness only. Pre-production host. No export. |
| **FastTrack cost tool v2** (github.com/microsoft/FastTrack, copilot-agent-strategy) | 15,000 | 9,604.8 | 16,000 | ≈ 0% | Per-operation entry; eligibility checkbox; flow trigger settings; production vs test budget; per-meter trace; PAYG, packs, P3 1–9 and Agent P3; CSV and print; source table dated 2026-09-28. No save; one agent at a time. |
| **ogradyliam5** (community, GitHub) | 15,000 | 9,600 | 16,000 | 0% | Pack optimizer; harness side by side; dev/test burn; URL state; copy as Markdown; locked rate card, with edits flagged. **Risk:** the licensed count applies to every session, including autonomous runs. |
| **Copilot Ramp Playbook** (community) | 15,000 | 9,600 | 16,000 | 0% | Interactive vs autonomous; channel; harness; budget check; .md and .csv export; link sharing; "My estimates" cart; Proposal Composer; Excel batch import; Cowork mode; ROI. Under active development. **No pack or P3 optimizer.** |
| **bradlaw76 cost calculator v1.3.5.1** (community) | 15,004 | 14,410 | 20,798 | +23.7% | Trigger priced at 7; reasoning a flat 10; no licensing; 22 business days. PDF funding report; editable unit price; Client Mode. |
| **andersjensen.org** | 15,000 | 9,600 | 14,000 | −4.9% | Breakdown internally inconsistent; no prompt tier. Gives a PAYG-vs-pack recommendation; URL parameters; rates dated 2026-08-12. |
| **Platform Forge Labs** | 15,000 | 9,360–10,080 | 12,000 | −10.4% | 5%-step sliders; 15% contingency by default; no prompts; no autonomous type. Plain verdict: "one pack baseline + PAYG overflow". |
| **WorkAgent.ai** | 16,000 | 7,800 | 12,500 | −10.6% | Coarse sliders; licensed share defaults to 40%, so A drops to 9,600 if left alone; no prompts or flows. Vendor price comparison; pack rounding; effective $ per credit. |

**Guidance sites, not calculators:**
- **cps-budget-guide** (cps-budget-guide.github.io): enforcement step chart, P3 tier table, the Power Platform admin center tabs, and a seller value-proposition tab.
- **Witivio:** makes the point that limits live in three places.

**Verdict.**
- Only **FastTrack v2, ogradyliam5 and the Copilot Ramp Playbook** reproduce all three anchors.
- **Microsoft's own Studio estimator under-states B by 50%**, because of the double subtraction, and under-states C through its prompt modifier.

### 10.3 Scored matrix

**Total scores (out of 33):**

| Tool | Score |
|---|---|
| Copilot Ramp Playbook | 21 |
| FastTrack v2 | 18 |
| ogradyliam5 | 17 |
| andersjensen.org | 12 |
| Platform Forge Labs | 9 |
| Microsoft Studio estimator | 8 |
| WorkAgent.ai | 7 |
| Microsoft web estimator | 5 |
| bradlaw76 | 5 |

The per-criterion point scores were not kept in the condensed report. The capability matrix below records what each tool does, as observed in the teardown. It is not a re-score.

"n/o" means the condensed report did not record the capability either way. It is not a "no".

| Capability | MS Studio est. | MS web | FastTrack v2 | ogradyliam5 | Ramp | bradlaw76 | andersjensen | Platform Forge | WorkAgent |
|---|---|---|---|---|---|---|---|---|---|
| Reproduces A / B / C | A only | n/a | Yes (≈) | Yes | Yes | A only (≈) | A and B | A only | No |
| Licensed users handled correctly | No (double subtraction) | n/a | Yes (eligibility checkbox) | Partial (applies to autonomous runs too) | Yes | No (no licensing) | Yes | Partial (range) | No (40% share default) |
| Autonomous agent type | No | n/a | Per-operation | n/o | Yes | n/o | n/o | No | n/o |
| Prompt and reasoning pricing | Wrong modifier (1.5) | n/a | n/o | n/o | n/o | Reasoning flat 10 | No prompt tier | No prompts | No prompts |
| Flow trigger rule | n/o | n/a | Yes | n/o | n/o | n/o | n/o | n/o | No flows |
| Purchase options (packs / P3 / PAYG) | No | n/o | PAYG, packs, P3 1–9, Agent P3 | Pack optimizer | No optimizer | Editable unit price | PAYG-vs-pack verdict | Pack + overflow verdict | Pack rounding, $/credit |
| Cowork estimate | No | Yes (Cowork only) | n/o | n/o | Separate mode | n/o | n/o | n/o | n/o |
| Export or print | PDF | No | CSV, print | Copy Markdown | .md, .csv, Proposal Composer | PDF funding report | n/o | n/o | n/o |
| Saved or shareable state | n/o | n/o | No | URL | Link, estimates cart | n/o | URL parameters | n/o | n/o |
| Partner margin, Copilot Business seats, 300-seat cap, default environment, managed-service attach | No | No | No | No | No | No | No | No | No |

**No tool models** Copilot Business seats, the 300-seat cap, Business Premium, the default environment, partner margin, or managed-service attach. Those, plus full Cowork pooling, are this planner's differentiators.

### 10.4 Fifteen gaps the planner closes

| # | Gap | What closing it means |
|---|---|---|
| 1 | Licensed math tied to channel and identity | Licensed users as a headcount; autonomous runs never free; the flow trigger rule; A/B/C shipped as regression tests |
| 2 | Partner economics | Customer price vs partner cost; margin on packs and services; who bills; "Buy" goes to the partner, never to Microsoft direct |
| 3 | Portfolio pooling | Studio + Cowork + Copilot Chat PAYG in one pool |
| 4 | Purchase optimizer | Packs vs 1 pack + PAYG overflow vs P3; the ~20K-a-month break-even; monthly expiry; the annual commitment in dollars |
| 5 | License-vs-meter crossover | Plus the non-metering reasons to buy seats |
| 6 | Branded customer proposal | Partner name; assumptions; dated rate card; bands; per-meter trace; services scope |
| 7 | Autonomous agent type | With trigger-as-action and prompt-as-action toggles |
| 8 | Prompt and reasoning token metering | Per response or per 1K tokens, with started-unit rounding |
| 9 | Governance deliverable | — |
| 10 | Conversation support | Talk tracks, objections, upsell |
| 11 | Side-by-side scenarios | — |
| 12 | Save, version and freeze | — |
| 13 | SMB templates and defaults | Business Premium profile; 300 seats or fewer; Copilot Business count; default-environment warning; a 30-day calendar for public agents |
| 14 | Exact inputs plus an actuals true-up | The true-up is Release 2 |
| 15 | Rate-card change tracking | — |

### 10.5 UX patterns worth taking

| Source | Pattern | Planner decision |
|---|---|---|
| ogradyliam5 | Locked rate card with edits flagged; "N packs + X PAYG" verdict | Adopt. **URL state is rejected**, because of the no-PII-in-URL rule; session files replace it. |
| FastTrack v2 | Per-meter trace with a Treatment column; eligibility checkbox; production vs test budget; pack utilization; dated source and confidence table | Adopt all. Treatment becomes the Z-code chip. |
| Copilot Ramp Playbook | Describe → guided → detailed entry; escalation row; Excel batch import; estimates cart → Proposal Composer | Adopt guided entry via archetypes and the combined report. **Batch import goes to Release 2.** |
| bradlaw76 | Client Mode | Already the hub's customer view |
| Microsoft Studio estimator | Multi-agent cards; PDF | Adopt cards. Print via the browser, not a library. |
| Microsoft web estimator | Persona bands | Already in the Cowork tab |
| andersjensen.org, Platform Forge Labs, WorkAgent.ai | Plain-language verdicts: "PAYG below 20,000 a month", "one pack baseline + PAYG overflow", "rounding to whole packs", effective $ per credit | Adopt as optimizer copy |
| cps-budget-guide | Enforcement step chart; P3 tier table; seller value tab | Adopt as the enforcement timeline and the conversation layer |

**Calculator implications (whole teardown).**
- Ship A, B and C as one-click presets *and* as exact regression anchors.
- Name Microsoft's double subtraction in the "Microsoft's estimator says less" objection card, with the 4,800-vs-9,600 numbers.
- Never use a coarse slider for a count.
- Never let a licensed share default silently.

---

## Sources

### Microsoft guides

| Source | URL | Date |
|---|---|---|
| Copilot Studio Licensing Guide | https://go.microsoft.com/fwlink/?linkid=2320995 | October 2026 (Last-Modified 2026-10-07) |
| Copilot Credits Guide | https://go.microsoft.com/fwlink/?linkid=2368800 | October 2026 (Last-Modified 2026-10-08) |

### Microsoft Learn: Copilot Studio

| Page | URL | ms.date |
|---|---|---|
| requirements-messages-management (rate card) | https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management | 2026-08-03 |
| billing-licensing | https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing | 2026-08-03 |
| requirements-licensing | https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-licensing | 2026-05-04 |
| guidance/govern-credit-consumption | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/govern-credit-consumption | 2026-10-06 |
| admin-transcript-controls | https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-transcript-controls | 2026-08-27 |
| knowledge-add-file-upload | https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-file-upload | 2026-09-29 |
| flows-overview | https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview | 2026-06-18 |
| configuration-end-user-authentication | https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication | 2026-05-01 |
| publication-fundamentals-publish-channels | https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels | 2026-09-16 |
| agent-usage-estimator | https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-usage-estimator | 2026-08-03 |
| computer-use | https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use | 2026-07-03 |
| configure-where-computer-use-runs | https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-where-computer-use-runs | 2026-05-07 |
| admin-use-entra-agent-identities | https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-use-entra-agent-identities | 2026-08-21 |
| analytics-cost-savings | https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-cost-savings | 2025-09-18 |
| guidance/agent-business-value-metrics-reference | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-business-value-metrics-reference | 2026-06-04 |
| guidance/deflection-overview | https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/deflection-overview | 2024-05-03 (stale) |
| whats-new | https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new | 2026-10-05 |

### Microsoft Learn: Power Platform

| Page | URL | ms.date |
|---|---|---|
| manage-copilot-studio-copilot-credits-capacity | https://learn.microsoft.com/en-us/power-platform/admin/manage-copilot-studio-copilot-credits-capacity | 2026-10-02 |
| manage-usage-github-copilot-harness | https://learn.microsoft.com/en-us/power-platform/admin/manage-usage-github-copilot-harness | 2026-08-28 |
| capacity-storage | https://learn.microsoft.com/en-us/power-platform/admin/capacity-storage | 2026-09-30 |
| environments-overview | https://learn.microsoft.com/en-us/power-platform/admin/environments-overview | 2026-05-28 |
| api-request-limits-allocations | https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations | 2026-09-08 |
| managed-environment-licensing | https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing | 2026-08-31 |

### Microsoft Learn: Microsoft 365, Business Central, Windows 365, Agent 365, Viva

| Page | URL | ms.date |
|---|---|---|
| m365-agents-admin-guide | https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/m365-agents-admin-guide | 2026-04-07 |
| Copilot pay-as-you-go overview | https://learn.microsoft.com/en-us/microsoft-365/copilot/pay-as-you-go/overview | 2026-07-17 |
| Usage-based billing: overview, manage, monitor | https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-overview-copilot-credits | 2026-09-30 / 2026-10-01 |
| BC tenant-admin-center-manage-consumption-billing | https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center-manage-consumption-billing | 2026-02-04 |
| BC Sales Order Agent | https://learn.microsoft.com/en-us/dynamics365/business-central/sales-order-agent | 2026-10-02 |
| BC Payables Agent | https://learn.microsoft.com/en-us/dynamics365/business-central/payables-agent | 2026-10-02 |
| Windows 365 for Agents pricing | https://learn.microsoft.com/en-us/windows-365/agents/pricing-paygo-always-available | 2026-05-01 |
| Windows 365 for Agents product page | https://www.microsoft.com/en-us/windows-365/agents | retrieved 2026-10-11 |
| Agent 365 overview, licensing FAQ (Q122), product terms | https://learn.microsoft.com/en-us/microsoft-agent-365/overview | retrieved 2026-10-11 |
| Viva Insights: Copilot Studio agents report template | https://learn.microsoft.com/en-us/viva/insights/org-team-insights/copilot-studio-agents | 2026-06-23 |

### Partner Center

| Source | URL | Date |
|---|---|---|
| Announcements, October 2026 | https://learn.microsoft.com/en-us/partner-center/announcements/2026-october | 2026-10-08 |
| Announcements, August 2026 | https://learn.microsoft.com/en-us/partner-center/announcements/2026-august | 2026-08-25 |
| Announcements, July 2026 | https://learn.microsoft.com/en-us/partner-center/announcements/2026-july | 2026-07-29 |
| Partner-earned credit | https://learn.microsoft.com/en-us/partner-center/billing/partner-earned-credit | 2024-10-07 |
| FY27 Copilot Agents Voucher, FPC knowledge base KB-01841 | Partner Center sign-in required; no public URL | retrieved 2026-10-11 |

### Microsoft blogs

| Source | URL | Date |
|---|---|---|
| Official Microsoft Blog: the new Copilot | https://blogs.microsoft.com/blog/2026/09/25/ | 2026-09-25 |

### Calculators tested (all tested 2026-10-11)

| Tool | Location |
|---|---|
| Microsoft Copilot Studio agent usage estimator | https://microsoft.github.io/copilot-studio-estimator/ |
| Microsoft web Copilot Credit Estimator | https://aka.ms/CopilotCreditPlanningModel |
| FastTrack cost tool v2 | https://github.com/microsoft/FastTrack (copilot-agent-strategy/copilot-agents-cost-tool) |
| ogradyliam5 | GitHub, user ogradyliam5 |
| Copilot Ramp Playbook | community site |
| bradlaw76 cost calculator v1.3.5.1 | GitHub, user bradlaw76 |
| andersjensen.org | https://andersjensen.org |
| Platform Forge Labs | vendor site |
| WorkAgent.ai | https://workagent.ai |
| cps-budget-guide | https://cps-budget-guide.github.io |
| Witivio | vendor blog |

### Withheld or unverified

| Claim | Source |
|---|---|
| CSP pack price points of $210 and $240 | [distributor source withheld], UNVERIFIED |
| MCI rates for Copilot Studio | [distributor source withheld], UNVERIFIED |
| Dynamics 365 1,000 credits per Premium user per month | secondary source, UNVERIFIED |
