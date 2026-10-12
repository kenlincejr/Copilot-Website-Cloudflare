# How the market monetizes agent and GitHub consumption, October 2026

**Gathered:** 2026-10-12. **Status:** research-agent memo, first pass. Mostly SECONDARY (blogs and explainers). A second pass for published partner price points is appended below when it lands. Distributors excluded by house rule.

## 1. Per-agent managed services
- **No SMB Microsoft partner publicly lists a per-agent monthly price** for managed Copilot Studio agents. The category is named by Microsoft but unpriced by the channel. SECONDARY (absence of evidence).
- **Generic AI-agency retainers**, not Microsoft-specific: Starter $500 to $2,500 a month for one or two automations with monitoring; Growth $2,500 to $8,000 for three to six with drift and hallucination review; Enterprise $10,000 to $25,000+. SECONDARY: nicherly.com, duet.so, abbacustechnologies.com (2026).
- **Microsoft names the service line:** "agent registry and lifecycle management" and "Copilot Credits cost governance" (Microsoft Tech Community partner news, 2026). Copilot Studio shipped an "AgentOps" feature area in April 2026. SECONDARY.
- **A ready-made scope:** nine Copilot Studio governance controls in dependency order: environments, data policies, sharing limits, identity, inventory, audit, cost, lifecycle, register (epcgroup.net, Oct 2026).

## 2. Re-billing credits
- No named MSP publishes a marked-up Copilot Credit resale rate. Confirms memo 02.
- Studio overage blocks features progressively after a grace buffer (Learn, manage-copilot-studio-messages-capacity).

## 3. GitHub Copilot services
- No SMB-focused partner publishes a priced GitHub Copilot governance service. Advice in the market: Business tier below about 50 developers; Enterprise only when its controls are needed (finout.io, 2026). SECONDARY.

## 4. Failure modes
- "A runaway agent can rack up thousands of dollars in a weekend" when spend limits are open; a misfiring autonomous trigger multiplies per-run charges (teamsfox.com, 2026). SECONDARY.
- Turning on reasoning or tenant grounding moves a response from 2 credits toward 100+; live draw runs 30 to 60% above first estimates when nobody modeled it (same source). SECONDARY, single vendor blog.
- A Gartner figure is relayed by blogs (40% of enterprises on consumption AI pricing exceed budget by 2x by 2027). Not traced to Gartner; do not publish.
- Microsoft's control plane is Agent 365 (GA May 1, 2026).

## 5. Incentives
- FY27 CSP incentives reward seat volume, up-stack moves, Copilot Studio expansion and Azure consumption. Nothing pays specifically for governing agent run-cost. SECONDARY (partner blogs).
- The agent-governance margin has to come from the service fee.

## 6. Outcome-price anchors (vendor list prices)

| Vendor | Unit | Price | Status |
|---|---|---|---|
| Intercom Fin | per resolution | $0.99 | SECONDARY via vendor comparison page |
| Salesforce Agentforce | per conversation, or Flex Credits | $2.00, or $500 per 100,000 credits (about $0.10 an action) | SECONDARY |
| Zendesk | per verified automated resolution | $1.50 committed, $2.00 PAYG | SECONDARY |
| Freshdesk | per session | about $0.10 | SECONDARY |

**Pattern:** $1 to $2 per successful outcome, billing only verified resolutions.

---

## 7. Second pass: published price points (2026-10-12)

VERIFIED = page fetched and number confirmed. SECONDARY = search synthesis or a fetch that returned 403. Marketplace listings are Microsoft Marketplace or AppSource consulting offers. Firm names stay in this research file only; partner-facing pages describe them by market.

| # | Seller | What is sold | Price | Unit | Market | Status |
|---|---|---|---|---|---|---|
| 1 | US Power Platform specialist | Managed service, full governance and PM tier | $20,000 | a month | Mid-market, US | VERIFIED |
| 2 | same | Managed service, development and break-fix tier | $10,000 | a month | Mid-market, US | VERIFIED |
| 3 | same | Managed service, admin and break-fix tier | $3,000 | a month | SMB and mid-market, US | VERIFIED |
| 4 | MSP pricing guide | Copilot readiness review | $1,500 to $2,500 | project | SMB, 50-seat example | SECONDARY |
| 5 | same | Copilot pilot rollout | $3,500 to $5,000 | project | SMB | SECONDARY |
| 6 | same | Copilot admin and adoption retainer | $750 to $1,250 | a month | SMB | SECONDARY |
| 7 | same | AI governance buildout | $6,000 to $10,000 | project | SMB and mid-market | SECONDARY |
| 8 | same | AI governance retainer | $750 to $2,500 | a month | SMB | SECONDARY |
| 9 | same | Compliance-tier add-on | $15 to $25 | a user a month | SMB, regulated | SECONDARY |
| 10 | same | AI-assisted reporting add-on | $500 to $2,000 | a month | SMB | SECONDARY |
| 11 | same | Workflow automation or agent build | $5,000 to $25,000 | project | SMB and mid-market | SECONDARY |
| 12 | same | Copilot licensing onboarding | $500 to $1,500 | one-time | SMB | SECONDARY |
| 13 | same | Ongoing Copilot management layer | $15 to $25 | a user a month | SMB | SECONDARY |
| 14 | US MSP, Marketplace | Copilot Studio chatbot build | $15,000 | one-time | SMB and mid-market | SECONDARY |
| 15 | US solution provider, Marketplace | Generative AI solutions with Copilot Studio | $50,000 | one-time | Enterprise | SECONDARY |
| 16 | UK partner, Marketplace | Agentic AI enablement with Copilot Studio | £9,750 | one-time | SMB and mid-market | SECONDARY |
| 17 | Canadian partner, Marketplace | Employee self-service agent | CA$7,070 | one-time | SMB | SECONDARY |
| 18 | Australian partner, Marketplace | Copilot Studio vision and value workshop | A$11,000 | one-time | SMB and mid-market | SECONDARY |
| 19 | Several, Marketplace | Copilot Studio in a day | $3,000 to $4,000 | one day | SMB | SECONDARY |
| 20 | EU partner, Marketplace | Copilot accelerate proof of concept | €4,608 | one-time | SMB and mid-market | SECONDARY |
| 21 | EU partner, Marketplace | GitHub Copilot one-month proof of value | €9,184 | one-time | SMB and mid-market dev shops | SECONDARY |
| 22 | Big Four firm, Marketplace | GitHub Copilot enablement | $1 placeholder | contact us | Enterprise | SECONDARY, low confidence |
| 23 | Global partner, Marketplace | GitHub Copilot four-week assessment | Free | — | Global | SECONDARY |
| 24 | AI agency pattern | Agent license: setup plus maintenance | $20,000 + $2,000 | setup + a month | Mid-market | SECONDARY |
| 25 | AI agency pattern | Starter agent retainer, one or two automations | $500 to $2,500 | a month | SMB | SECONDARY |

Full source URLs for rows 1 to 25 are in the agent transcript for this session; rows 1 to 3 and 4 to 13 come from imperiumdynamics.com/power-platform-managed-services and scopable.io (msp-ai-services-pricing-2026, microsoft-copilot-for-msps). Marketplace rows are listing IDs on appsource.microsoft.com and marketplace.microsoft.com.

**The "$8 to $800 per agent per month" figure** is blog modeling of Microsoft's meter (an agent's raw credit cost), not a partner price. No Microsoft source publishes it.

**Community:** repeated searches of r/msp and r/sysadmin found no thread quoting a per-agent charge. The pricing conversation is not happening in public.

### Patterns
- **No one sells a recurring per-agent SKU.** Builds are flat projects, clustering $4,000 to $15,000. Recurring work is a monthly retainer ($750 to $2,500) or a per-user add-on ($15 to $30).
- **The build band is global.** UK, Canadian, Australian and EU listings land in the same range.
- **GitHub governance is the least monetized category.** Three listings: one free, one placeholder, one real proof of value. No SMB recurring offer anywhere.
- **The nearest recurring proxy** is Power Platform managed service, tiered by scope at $3,000, $10,000 and $20,000 a month.
