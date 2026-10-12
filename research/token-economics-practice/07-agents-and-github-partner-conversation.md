# Beyond Cowork: the agent meter and the GitHub meter, and the conversation to have with SMB partners

**Drafted:** 2026-10-12, corrected the same day by memo 08. **Status:** research synthesis and draft partner conversation. No page changed, no fact registered.
**Inputs:** [`05-github-copilot-billing.md`](./05-github-copilot-billing.md) (GitHub billing, verified on GitHub's docs), [`06-agent-and-github-monetization-market.md`](./06-agent-and-github-monetization-market.md) (what partners sell and charge, 25 price points), [`06b-analyst-pricing-benchmarks.md`](./06b-analyst-pricing-benchmarks.md) (analyst and industry benchmarks), plus the verified Studio rate card and zero-rating rules in [`../copilot-studio-smb-partner-2026-10-11.md`](../copilot-studio-smb-partner-2026-10-11.md).
**Rule for this memo:** market evidence first, playbook numbers second. Where a price is our synthesis, it says so.

---

## 1. The short answer

The Meter Conversation page covers one meter well: Copilot Credits spent by people (Cowork, Code, Autopilot). SMB partners actually face **three meters**, and the other two are where the surprises come from.

| Meter | What runs it up | Where the admin sees it | Default state | Who sells governance today |
|---|---|---|---|---|
| **Copilot Credits, people** | Cowork, Code, Autopilot | Microsoft 365 admin center, Cost management | On for new CSP Copilot Business from Dec 1, 4,000 credits a user a month | Nobody priced; free setup sessions everywhere |
| **Copilot Credits, agents** | Agents serving unlicensed or external users, autonomous runs, computer use, the GitHub harness in Copilot Studio | Power Platform admin center, per agent and per environment | Environments draw from the tenant pool; **no tenant-wide default agent limit** | Nobody prices a recurring per-agent service publicly |
| **GitHub AI Credits, developers** | Premium-model chat, coding agent, code review, CLI | GitHub org or enterprise billing, paid by the customer; the CSP Azure plan is not supported | **Paid usage on by default, no default budget**, no fallback to cheaper models | Almost nobody: three Marketplace listings worldwide, one of them free |

Same penny everywhere, three admin screens, three invoices. The four verbs stay the same on every meter: **SET, WATCH, TUNE, PROVE**. That is the difference between a fee and a practice.

---

## 2. What it looks like, exactly

### 2.1 The agent meter

- **Rate card:** a generative answer is 2 credits, an action is 5. A credit is a penny on pay-as-you-go, $0.008 on a $200 pack of 25,000.
- **The first question for every agent is "is it free?"** A conversation is free with the seat only when all four hold: a licensed user, signed in with their own Microsoft identity, in Copilot Chat, Teams or SharePoint, on the standard or chat harness. Anything else bills: websites, WhatsApp, SMS, voice, guests, unlicensed staff, autonomous triggers, computer use.
- **Most SMB internal agents cost nothing to run.** The meter starts when the agent faces customers or runs on its own. That is also where the risk sits.
- **Building can cost money now.** The GitHub harness in Copilot Studio bills Copilot Credits from the first build action, and developer and trial environments moved to usage billing on Sept 1, 2026. A pilot needs a build budget in the statement of work.
- **The controls exist but are not on by default.** Per-agent monthly limits with alerts and a hard stop live in the Power Platform admin center. Azure budgets only alert; they never stop spend. Microsoft's own guidance: allocate a fixed amount per environment, turn off tenant draw, set per-agent limits.

### 2.2 The GitHub meter

All verified on GitHub's documentation unless marked.

- **Since June 1, 2026, GitHub bills Copilot usage in GitHub AI Credits.** A credit is a penny, priced by model and tokens.
- **Each license includes credits, pooled across the organization:** 1,900 a month with Copilot Business ($19 a seat), 3,900 with Copilot Enterprise ($39, secondary source).
- **Overage is on by default with no budget set.** GitHub's words: "Additional usage is enabled by default for organizations and enterprises."
- **When a budget runs out, work stops.** "There is no automatic fallback to lower-cost models when a budget is exhausted." A developer can hit a wall mid-sprint.
- **Controls:** user-level budgets, cost-center budgets, enterprise spending limits, alerts at 75, 90 and 100%, a policy switch that hard-stops paid usage, and in-product requests for more budget.
- **Two different GitHub meters.** GitHub Copilot for developers bills GitHub AI Credits. The GitHub harness inside Copilot Studio bills Microsoft Copilot Credits. Partners confuse these, and so will customers.

### 2.3 Who in an SMB book actually has the GitHub meter

Most 30 to 300 seat customers have no developers. The ones that do are software companies, ISVs, agencies, engineering firms and manufacturers with a small internal dev team. For them, GitHub is often the first AI meter that already runs today, months ahead of Cowork.

---

## 3. What the market is charging

### 3.1 The evidence in one table

| What is sold | Market price | Evidence |
|---|---|---|
| Copilot Studio agent build | $4,000 to $15,000 one-time; workshops $3,000 to $4,000 | Marketplace listings from US, UK, Canadian, Australian and EU partners land in the same band |
| Copilot readiness review | $1,500 to $2,500 | MSP pricing guide, 50-seat example |
| AI governance retainer | $750 to $2,500 a month | MSP pricing guide; analyst coverage |
| Copilot admin and adoption retainer | $750 to $1,250 a month | MSP pricing guide |
| Copilot or AI management add-on | $10 to $30 a user a month | MSP pricing guides |
| Starter AI agent retainer, one or two automations | $500 to $2,500 a month | AI agency pricing guides, not Microsoft-specific |
| Power Platform managed service | $3,000 / $10,000 / $20,000 a month by scope | One US specialist's published tiers, verified |
| GitHub Copilot proof of value | about $10,000 one-time | One EU listing; the only real GitHub price found |
| Recurring per-agent price | **None published** | No partner, analyst or community source |
| Recurring GitHub governance price | **None published** | No partner, analyst or community source |
| Vendor outcome prices for AI agents | $0.99 to $2 per resolved conversation | Intercom, Zendesk and Salesforce list prices, via aggregators |

Almost all of these are SECONDARY. Gartner, Forrester and IDC publish no per-agent or per-developer benchmark. Their consistent message is direction, not price: spending moves from seats to usage and outcomes, and Gartner expects 40% or more of agentic AI projects to be canceled by the end of 2027 over cost, value or risk.

### 3.2 What partners have learned so far

1. **Everyone offers AI; few make money from it.** The MSP 501 report has 91% of MSPs offering or using AI. Kaseya's 2026 State of the MSP has 48% calling AI clients' top need and 13% calling it meaningful revenue. The gap is packaging, not demand.
2. **The setup session is being given away.** Spending-policy sessions are commonly free. Give away SET; charge for WATCH, TUNE and PROVE.
3. **Builds are priced; running agents are not.** The market has settled build pricing. Nobody has named the monthly line for keeping an agent accurate, safe and inside budget. That is the open ground.
4. **Agent estimates run low.** Practitioner blogs report live draw 30 to 60% above estimate when reasoning or tenant grounding gets switched on after launch. Single source; treat it as a warning, not a statistic.
5. **Runaway triggers are the headline risk.** An autonomous trigger that fires more than expected multiplies its charge all weekend. The per-agent hard stop exists and almost nobody sets it.
6. **Microsoft pays for seats and consumption, not governance.** FY27 incentives reward seat volume, up-stack moves and consumption. The governance margin has to come from the service fee.
7. **Nobody talks prices in public.** Reddit and MSP forums returned no thread quoting a per-agent charge. Partners are pricing this privately or not at all.

### 3.3 Where the $350 per agent came from

- **It has no external source.** The $350 (Tier 2) and $400 (Tier 3) AgentCare rates have been in the playbook since its first commit on May 15, 2026. The facts ledger types them as "our price," and FACTS.md lists them as an unresolved pricing question.
- **The market neither confirms nor contradicts it.** No one publishes a per-agent monthly price.
- **The nearest anchors put $350 at the low end.** A starter retainer for one or two automations runs $500 to $2,500 a month. An AI governance retainer runs $750 to $2,500. One agent at $350 sits below every recurring floor the market shows.
- **One flat rate misprices most agents.** An internal FAQ agent used by licensed staff costs nothing to run and needs about an hour a month. A customer-facing agent on the website carries billed traffic, brand risk and weekly review. Charging both $350 overcharges the first and undercharges the second.

**Recommendation:** keep a per-agent line, tier it by risk, and put a monthly floor under it that matches the market retainer band.

---

## 4. The recommended price sheet

Our synthesis from the market bands above. Not a published norm.

| Line | Unit | Price | Market anchor |
|---|---|---|---|
| **Credit Wrap** (people meter) | per user a month, tenant minimum | $3 to $5, minimum $150 to $250 | Unchanged from the page; no market equivalent |
| **Agent build** | per agent, one-time | $3,500 to $8,000+, plus a build-credit budget for GitHub-harness agents | Marketplace builds cluster $4,000 to $15,000; the playbook range is low-to-middle and safe |
| **AgentCare, internal agent** (licensed staff, zero-rated) | per agent a month | $150 to $250 | About an hour a month: source freshness, usage, one fix |
| **AgentCare, workflow or autonomous agent** (metered, runs on its own) | per agent a month | $350 to $500 | The current $350 belongs here: per-agent cap, trigger review, run failures, cost per run |
| **AgentCare, customer-facing agent** (external, always billed) | per agent a month | $750 to $1,500 | Matches the starter agent retainer band; weekly transcript review, brand and accuracy risk |
| **AgentCare floor** | per tenant a month, once any agent is live | $750 | The bottom of the AI governance retainer band |
| **Outcome option** (customer-facing, Tier 3 only) | per resolved conversation, meter included | $0.75 to $1.50, monthly minimum | Under vendor list prices of $0.99 to $2; see §4.1 |
| **GitHub guardrails setup** | per organization, one-time | $1,500 to $2,500 | Readiness review band |
| **Developer meter governance** | per developer a month, minimum | $5 to $10, minimum $150 | No market price exists; priced as Credit Wrap's sibling and kept cheap on purpose |

Rules that hold across every line:
- **Pass the meter through at Microsoft's or GitHub's price**, on its own invoice line. Charge for labor. No published partner margin on credits exists; do not quote one.
- **Put a floor under every recurring line.** A percentage of a small meter is nothing.
- **Price from the hours.** Write down the monthly hours each agent tier takes, and reprice once a quarter against what the team actually logged.
- **One invoice, separate lines:** licenses, people credits, agent credits, GitHub overage, Credit Wrap, AgentCare, developer governance.
- **One monthly PROVE page for every meter**, filled from exports. A custom report per customer eats the margin.

### 4.1 Why the outcome option works, and when not to offer it

Illustrative arithmetic on the verified rate card: a resolved web conversation with five generative answers and two actions is 20 credits, or $0.20 on pay-as-you-go. Customers already see vendor agents priced at $0.99 to $2 per resolution. A partner quoting $1 per resolved conversation, meter included, has room for the credits, the care and a margin.

Offer it only when:
- the agent has run 60 days and the cost per resolution is known;
- reasoning and tenant grounding settings are frozen in the contract, because they multiply the credits per answer;
- "resolved" is defined and counted the way the customer's own reports count it;
- a monthly minimum and a per-agent hard cap sit underneath it.

Before those hold, the partner is underwriting Microsoft's meter.

---

## 5. Worked example: one customer, three meters

A 50-seat professional services firm with Copilot Business, one internal HR agent, one customer-facing intake agent on its website, and eight developers on GitHub Copilot Business.

| Line | Who keeps it | Monthly |
|---|---|---|
| Copilot Business, 50 × $21 | Microsoft, pass-through | $1,050 |
| Copilot Credits for people, budget 1,500 a user | Microsoft, pass-through | up to $750 |
| Copilot Credits for the intake agent, one $200 pack of 25,000 | Microsoft, pass-through | $200 |
| GitHub Copilot Business, 8 × $19, 15,200 pooled credits | Customer pays GitHub directly | $152, not on the partner invoice |
| GitHub overage budget, set and capped | Customer pays GitHub directly | up to $100, not on the partner invoice |
| Tier 1 AI Essentials, 50 × $12 | Partner | $600 |
| Credit Wrap, 50 × $4 | Partner | $200 |
| AgentCare, internal HR agent | Partner | $200 |
| AgentCare, customer-facing intake agent | Partner | $750 |
| Developer meter governance, minimum | Partner | $150 |

One-time: two agent builds at $3,500 and $8,000, plus GitHub guardrails setup at $2,000.

| Total | Monthly |
|---|---|
| Pass-through ceiling on the partner invoice | $2,000 |
| Partner recurring | $1,900 |

The partner's recurring line is more than double the Tier 1 plus Credit Wrap figure on the current page. The agent line, $950, sits inside the market's $750 to $2,500 governance retainer band.

---

## 6. Best practices, meter by meter

| Verb | People meter | Agent meter | GitHub meter |
|---|---|---|---|
| **SET** | Lower the 4,000 default; alerts at 80 and 100%; review auto-apply of new services | Draw the free-or-billed line per agent before building; fixed allocation per environment; tenant draw off; per-agent limit with hard stop; a build budget for GitHub-harness agents | Decide the paid-usage policy; set a user-level default budget; cost centers by team; alerts at 75, 90 and 100%; decide who approves budget-increase requests |
| **WATCH** | Monthly export; top users; users at their limit | Credits per agent per week; trigger counts; failed runs; idle agents | Pooled credit burn; users at budget; coding-agent sessions; model mix |
| **TUNE** | Packs for steady users; remove idle seats | Retire idle agents; freeze reasoning and grounding settings; fix noisy triggers | Move heavy users to Enterprise only when the pool math says so; steer routine work to cheaper models by policy, since nothing falls back on its own |
| **PROVE** | Cost per user per month | Cost per resolved request, counting only runs that worked | Cost per developer per month next to delivery metrics the team already tracks |

---

## 7. The partner conversation

Written for a TD SYNNEX partner manager or practice lead talking to an SMB partner owner or service manager. It follows the page's voice: plain words, no "FinOps" or "tokens."

### 7.1 Opening

*"You've probably heard about December 1 and the Copilot meter. That's the one everyone is talking about. I want to talk about the two meters nobody is talking about yet.*

*The first is agents. Every agent you build for a customer either runs free with the license or runs on the meter, and the difference is decided by who it talks to and where. The internal FAQ bot in Teams? Free. The same bot on the customer's website? Every answer is billed. An agent that runs on its own overnight? Billed, every run. And nothing stops it unless somebody sets a limit per agent.*

*The second is GitHub. If any of your customers have developers, they've been on a usage meter since June. Each seat comes with a pool of credits, overage is switched on by default with no budget, and when a budget does run out, the developer just stops. There's no drop to a cheaper model.*

*Same penny everywhere. Three different admin screens. And as far as we can find, no partner anywhere has a price for watching the last two."*

### 7.2 The three questions partners ask, and the answers

**"What should I charge?"**
*"Here's what we can see in the market. Agent builds are priced, $4,000 to $15,000, and your customers have seen those numbers. Monthly AI governance retainers run $750 to $2,500. Nobody publishes a monthly price per agent or per developer. So price the care by risk: a couple hundred a month for an internal agent, three-fifty to five hundred for one that runs on its own, seven-fifty and up for one that talks to the customer's customers. Put a $750 floor under it once any agent is live. And pass the credits through at Microsoft's price on their own line."*

**"Can't I just mark up the credits?"**
*"You can try, but nobody publishes a credit margin and the customer can see the public price. Thirty percent of a $200 agent bill is $60. That doesn't pay for the hour you spend reading it. Charge for the hour."*

**"My customers don't have developers. Why do I care about GitHub?"**
*"Most don't. Pull the list of the ones that do: software shops, agencies, engineers, manufacturers with an internal team. For them, GitHub is the meter that's already running, today, with no budget. That's your easiest first conversation, because the risk is already live."*

### 7.3 What we tell partners to do this quarter

1. **Run the agent inventory.** For every agent you've built or a customer has built, write down who it talks to, where, and whether it runs on its own. Mark each one free or billed.
2. **Set a per-agent limit on every billed agent.** It's a setting in the Power Platform admin center, and it's the one control that actually stops spend.
3. **Pull your GitHub list.** Find every customer with GitHub Copilot seats. Set a default user budget and decide the paid-usage policy with them.
4. **Re-paper agent statements of work.** Add a build-credit budget for GitHub-harness agents, the free-or-billed line for each agent, and the AgentCare tier.
5. **Put all three meters on one monthly page.** Credits by people, by agent and by developer, each next to an outcome.

### 7.4 Lines partners can use with their customers

- **Agents:** *"Before we build an agent, we decide who it talks to. If it's your licensed staff in Teams, it's free to run. If it's your customers, every answer costs a couple of pennies, and we put a hard limit on it the day it goes live."*
- **Autonomous agents:** *"An agent that runs on its own is a meter that runs while you sleep. We cap it, and we read it every week."*
- **GitHub:** *"Your developers' AI has been on a meter since June, and nobody set a budget. We'll set one, so a busy week doesn't become a surprise bill, and so nobody gets cut off mid-release without warning."*
- **The whole thing:** *"Three meters, one page, every month. Microsoft's and GitHub's prices on their own lines. Our work on ours."*

### 7.5 Objections from partners

| They say | You say |
|---|---|
| "$750 a month for one agent? My customers won't pay that." | "For an internal agent, don't charge that; charge a couple hundred. The $750 is for agents that face customers or run alone, which is where the bill and the brand risk live. Market retainers for one or two automations start at $500." |
| "Customers will do this themselves in the admin center." | "Forty percent of businesses this size have no full-time IT person. The controls exist. Nobody has the job of turning them." |
| "Isn't GitHub a separate company?" | "Separate meter, separate screen, and the customer usually pays GitHub directly, so the bill never crosses your desk. That is exactly why nobody is watching it. You sell the governance, not the credits." |
| "Microsoft wants consumption. Won't capping it hurt my incentives?" | "Governed growth, not cost cutting. A cap the customer chose keeps the agent alive. An unwatched bill gets the agent shut off, and Gartner expects 40% of agent projects to be canceled over cost, value or risk." |

---

## 8. What changes in the playbook

Proposed, none made yet.

| # | Where | Change |
|---|---|---|
| 1 | `copilot-token-economics.html`, §8 | Add the "per user, per agent, per developer" price table from §4, with the market anchor column. |
| 2 | `copilot-token-economics.html`, new section | A short GitHub section: pooled credits, overage on by default, no fallback, the controls. |
| 3 | `copilot-token-economics.html`, §8 or §9 | The three-meter worked example from §5. |
| 4 | `cpb-model-the-practice.html`, AgentCare | Replace the flat $350 / $400 with the three risk tiers and the $750 floor, and link AgentCare to Credit Wrap: per user, per agent, per developer. |
| 5 | `copilot-credit-planner.html` | Make the AgentCare prefill depend on the agent's audience and trigger, which the planner already captures. |
| 6 | `data/facts.json` | Register the GitHub facts in memo 05 and the market bands in memo 06, typed as market evidence, separate from our prices. |

## 9. Before anything here is published

1. Resolved in memo 08: vendor outcome prices verified on their own pages.
2. Resolved in memo 08: $39 verified.
3. Resolved in memo 08: the CSP Azure plan cannot carry GitHub billing; the customer pays GitHub.
4. Resolved: Gartner press release of June 25, 2025, already registered as F-218.
5. Ask three to five trusted SMB partners, privately, what they charge per agent today. The public web has no answer, so a short partner survey is the most valuable next piece of evidence we can get.
