# specs/copilot-token-economics-r2.spec.md: Release 2 of The Meter Conversation, every meter

**Status:** Approved 2026-10-12. Ken delegated the §2 decisions ("use your best judgement"; pricing "use whatever the public research suggests and ballpark it to SMB pricing"). The decisions below are final.

**Target:**
- [`copilot-token-economics.html`](../copilot-token-economics.html): restructure from one meter to every meter in the tenant, and add the partner monetization conversation.
- [`data/facts.json`](../data/facts.json): facts F-234 onward, each with an occurrence anchor in the page.
- [`sitemap.xml`](../sitemap.xml): `lastmod` for the page, same commit (DESIGN §8b.5).

One file per execution chat (DESIGN §8 prohibition 9). The page and its facts are one execution; the follow-on files in §9 are separate specs.

**Depends on:**
- Release 1 spec: [`copilot-token-economics.spec.md`](./copilot-token-economics.spec.md). Every Release 1 design decision in its §4 still holds.
- Research, all in [`research/token-economics-practice/`](../research/token-economics-practice/):
  - [`05-github-copilot-billing.md`](../research/token-economics-practice/05-github-copilot-billing.md): GitHub billing.
  - [`06-agent-and-github-monetization-market.md`](../research/token-economics-practice/06-agent-and-github-monetization-market.md): what partners sell and charge, 25 price points.
  - [`06b-analyst-pricing-benchmarks.md`](../research/token-economics-practice/06b-analyst-pricing-benchmarks.md): analyst and industry benchmarks.
  - [`07-agents-and-github-partner-conversation.md`](../research/token-economics-practice/07-agents-and-github-partner-conversation.md): the draft conversation, price sheet and worked example.
  - [`08-verification-pass.md`](../research/token-economics-practice/08-verification-pass.md): primary-source checks and two corrections.
  - [`09-other-microsoft-ai-meters.md`](../research/token-economics-practice/09-other-microsoft-ai-meters.md): Business Central, AI Builder, Security Copilot, Foundry and the rest.
- [`DESIGN.md`](../DESIGN.md): §1 to §4, prohibitions §8, the §8b rules, the §9 lint.

---

## 1. Why a Release 2

Release 1 is strong on one meter: Copilot Credits spent by people through Cowork, Code and Autopilot. The research since shows the partner's customers carry more meters than that, and the ones the page underplays are where the surprises and the unpriced revenue sit.

| Gap in Release 1 | What the research found | Source |
|---|---|---|
| Agents appear as one price tag and one zero-rating callout | Every billed agent needs its own limit. Microsoft ships **no tenant-wide default agent limit**, and the per-agent hard stop **turns the agent off** | Memo 08, rows 10 and 11 |
| Business apps are absent | Business Central's Payables, Expense and Sales Order agents bill Copilot Credits. After **November 1, 2026**, AI Builder credits can no longer be bought or renewed and new premium licenses stop including them; when they run out, flows draw Copilot Credits or stop | Memo 09; F-185 to F-188 |
| GitHub is one phrase, "the GitHub harness" | GitHub Copilot has its own meter since June 1, 2026. Paid usage is **on by default** with no budget, there is **no fallback** to cheaper models, and the **CSP Azure plan cannot carry the bill** | Memos 05 and 08 |
| AgentCare is linked, never priced; the $350 has no source | No partner, analyst or community source publishes a per-agent monthly price. Builds are priced at $4,000 to $15,000; governance retainers at $750 to $2,500 a month | Memos 06 and 06b |
| The page sells one service for one meter | The four verbs work on every meter; only the unit and the admin screen change | Memo 07 |

The Release 2 pitch, in one sentence: **every Microsoft AI meter in the customer's tenant, priced in the unit that drives it, run as one practice with one monthly page.**

---

## 2. Decisions, made 2026-10-12

Ken delegated these. Each row records the choice and why.

| # | Decision | Options | Decision |
|---|---|---|---|
| **D1** | Structure | (a) Insert a new "Every Meter" section after §3 and renumber; (b) append new material at the end | **(a)**. The map belongs before the service and the price. Renumbering is mechanical; every `#section-N` anchor and in-page cross-reference moves with it (§3 below). |
| **D2** | AgentCare pricing on this page | (a) Keep the flat $350 / $400; (b) risk tiers with a tenant floor | **(b)**: internal agent $150 to $250, workflow or autonomous $350 to $500, customer-facing $750 to $1,500, and a $500 floor per tenant once any agent is live, the bottom of the market's starter agent retainer ($500 to $2,500 for one or two automations). This lifts DESIGN §8 prohibition 10 for these lines on this page only, registered as `our-price` facts. Model the Practice keeps $350 / $400 until its own spec (§9). |
| **D3** | Developer meter price | (a) Price it; (b) describe it unpriced | **(a)**: GitHub guardrails setup $1,500 to $2,500 one-time; developer governance $5 to $10 a developer a month, $150 minimum. Labeled as our price with no market equivalent. |
| **D4** | Outcome pricing for customer-facing agents | (a) On the page as a Tier 3 option; (b) research only | **(a)**, boxed as advanced, with the four conditions. Vendor anchors are now verified on their own pages. |
| **D5** | The other meters | (a) Price them; (b) a watch list | **(b)**. Business Central and AI Builder get full treatment because they bill Copilot Credits. Security Copilot, Foundry, Fabric and Agent 365 go on a watch list. |
| **D6** | The page title | (a) Keep; (b) retitle | **(a) Keep "The Meter Conversation."** Change the subtitle and lede to "every meter." The URL and the home-page card stay valid. |

---

## 3. New page structure

| New § | Title | Source | Change |
|---|---|---|---|
| 1 | The Answer, On One Page | old 1 | Rewrite lede, hero, metric cards, recap grid (§4.1) |
| 2 | What Changed: Seats Plus Usage | old 2 | Four new timeline entries (§4.2) |
| 3 | The Customer's New Problem | old 3 | Reword third price tag and zero-rating callout (§4.3) |
| **4** | **Every Meter in the Tenant** | **new** | The map, four meters, the watch list, the book segmentation (§4.4) |
| 5 | Nobody Has Packaged It Yet | old 4 | Add the market price evidence (§4.5) |
| 6 | The Three Sentences | old 5 | Broaden sentence 1 and 3 bodies (§4.6) |
| 7 | The Service in Four Verbs | old 6 | Add the verb-by-meter table and agent and developer bullets (§4.7) |
| 8 | The Whiteboard | old 7 | Add the "per agent" whiteboard line (§4.8) |
| 9 | **Pricing Every Meter** | old 8 | Restructured (§4.9) |
| 10 | How the Money Flows Through Distribution | old 9 | GitHub callout, business-app note, set-up steps (§4.10) |
| 11 | Governed Growth, Not Cost Cutting | old 10 | One new row and one sentence (§4.11) |
| **12** | **The Practice Conversation** | **new** | For the partner's leadership team: the questions, the answers, the 90-day plan (§4.12) |
| 13 | The Talk Track | old 11 | Three new short conversations (§4.13) |
| 14 | Objections | old 12 | Six new rows (§4.14) |
| 15 | **Three Dates, Three Campaigns** | old 13 | November 1, December 1 and the agent sweep (§4.15) |
| 16 | Guardrails: What Never To Say | old 14 | Four new traps (§4.16) |
| 17 | Sources, Provenance and Related Guides | old 15 | New sources and research links (§4.17) |

**Mechanics:** update the TOC, every `id="section-N"`, every in-page "see section N" reference, and the "How to use this" callout's section ranges. The masthead date becomes the ship date.

---

## 4. Section-by-section changes

Copy below is drop-in prose in the page's voice. Plain words, US English, no em-dashes. Numbers carry `data-fact` spans per §5.

### 4.1 Section 1, The Answer, On One Page

**Masthead subtitle,** replacing the current one:
> Your customers' Microsoft AI now runs on meters: Copilot Credits for people, for agents and for business apps, and GitHub credits for developers. Most are switched on by default, none is watched, and the biggest one bills through you. This is the customer's new problem, the three sentences that explain it, the four-verb service that solves it on every meter, and what to charge for each.

**Hero statement,** second sentence replaced:
> The seat was the key. *The credit is the meter.* Microsoft built the meters, switched most of them on by default, set the defaults above the license, and routed the biggest bill through you. Nobody is reading them.

**Metric cards.** Keep three (`.metrics` holds 3, DESIGN §8b.3):

| Card | Value | Label | Source line |
|---|---|---|---|
| 1 (warn) | $40 | What the default lets each Copilot Business user spend on top of the $21 seat: 4,000 credits at $0.01 | Partner Center, October 1, 2026. On from December 1. |
| 2 (warn) | None | The default credit limit Microsoft sets on an agent. A website agent bills every answer until someone sets one | Microsoft Learn, govern credit consumption, October 2026 |
| 3 | On | GitHub Copilot paid usage, by default, for every organization, with no budget set | GitHub documentation, since June 1, 2026 |

The December 1 date moves into the hero sub-line: "The people meter switches on December 1. The others are already running."

**Recap grid,** three items kept, copy replaced:
- **THE PROBLEM · Your customer bought flat numbers and got meters.** Everyday Copilot is still in the seat. The work Copilot does, the agents that answer customers, the business-app agents that process invoices, and the AI developers use all run on meters. A credit is a penny on each of them, and the customer chose none of the defaults.
- **THE SERVICE · Four verbs, every meter, once a month.** SET the budget and the limits. WATCH the meter. TUNE who buys what. PROVE it on one page. Only the admin screen changes from meter to meter.
- **THE MONEY · Price each meter in the unit that drives it.** Per user for people, per agent for agents, per developer for developers. Credits pass through at Microsoft's price. Your fee is the predictable line, with a floor under each one.

### 4.2 Section 2, timeline additions

Add four entries in date order:
- **May 1, 2026 · Agent 365 goes generally available.** Microsoft's control plane for agents: inventory, identity and lifecycle. A per-user seat, not a meter. Business Premium qualifies.
- **June 1, 2026 · GitHub Copilot moves to AI credits.** Each license includes a pooled monthly allowance. Additional usage is on by default. Developers have been on a meter since.
- **September 1, 2026 · Building agents starts costing credits.** Copilot Studio developer and trial environments using the GitHub harness move to usage billing, from the first build action.
- **November 1, 2026 · AI Builder credits stop being sold.** No new or renewed AI Builder add-ons, and new premium licenses no longer include them. When a customer's AI Builder credits run out, Power Automate's AI steps draw Copilot Credits, or stop if none are available.

The grid of timeline cards is a vertical list; adding entries creates no orphan.

### 4.3 Section 3, The Customer's New Problem

- **Third price tag**, retitled "An agent that serves other people, runs alone, or works in your business apps." Body: "2 credits for a generative answer, 5 for an action, in Copilot Studio. Business Central's Payables agent is 50 credits an invoice plus 5 a line. Metered when the agent answers customers, unlicensed staff or external channels, runs on its own schedule, or works inside Business Central."
- **Zero-rating callout**, add one sentence at the end: "Section 4 shows every meter and which of your customers has it."

### 4.4 Section 4, Every Meter in the Tenant (new)

**Lead paragraph:**
> Release 1 of this page was about one meter: the credits people spend when Copilot does a job. Your customers have more than one. Some sit inside the Copilot license, some inside Business Central or Power Automate, and one belongs to GitHub. They share a unit, a penny, and almost nothing else: different admin screens, different defaults, different invoices. This section is the map.

**4.1 · The map** (C9 data table, comparison column left-aligned per §8b.4):

| Meter | What runs it up | Where you see and cap it | Default | Whose invoice |
|---|---|---|---|---|
| **People** · Copilot Credits | Cowork, Code, Autopilot | Microsoft 365 admin center, Copilot, Cost management | On for new CSP Copilot Business from December 1; 4,000 credits a user a month | Yours, through TD SYNNEX |
| **Agents** · Copilot Credits | Agents serving customers, unlicensed staff or external channels; autonomous runs; computer use; GitHub-harness builds | Power Platform admin center, per agent and per environment | Environments draw from the tenant pool; no default agent limit | Yours, through TD SYNNEX |
| **Business apps** · Copilot Credits | Business Central Payables, Expense and Sales Order agents; Power Automate AI steps once AI Builder credits run out | Power Platform admin center, capacity allocation | Off until billing is configured; stops when the quota runs out | Yours, through TD SYNNEX |
| **Developers** · GitHub AI Credits | Premium-model chat, coding agent, code review, CLI | GitHub organization or enterprise billing | Paid usage on, no budget, no fallback to cheaper models | The customer's, paid to GitHub |

Below the table, a C2 teal-rule note: "Cowork, Copilot Studio and Work IQ all land on the Azure invoice under one service name, Microsoft Copilot Studio. Attribution by meter needs separate subscriptions or the admin-center exports."

**4.2 · The agent meter, in five facts** (bulleted):
- **Free only when four things hold.** A licensed user, signed in with their own Microsoft identity, in Copilot Chat, Teams or SharePoint, on the standard or chat harness. Anything else bills: website, WhatsApp, SMS, voice, guests, unlicensed staff, autonomous triggers, computer use.
- **No default limit.** Microsoft's own guidance: allocate a fixed amount per environment, turn off tenant draw, and set a limit per agent.
- **The hard stop turns the agent off.** It protects the bill and breaks the service. Set the alert threshold well below the stop, and name who decides whether to raise it.
- **Building costs credits now.** GitHub-harness agents bill from the first build action, in developer and trial environments too. Put a build budget in the statement of work.
- **Estimates run low.** Turning on reasoning or tenant grounding after launch multiplies the credits per answer. Freeze those settings in the agent's scope.

**4.3 · The business-app meter** (C1 callout, title "Your Business Central and Power Automate customers are on the meter without a Copilot seat"):
> Business Central's Payables agent is 50 credits an invoice plus 5 a line, and the Expense agent is 50 a receipt. Neither is covered by the Copilot included in Business Central. They draw from the default Power Platform environment unless you relink them. Separately, AI Builder credits can no longer be bought or renewed after November 1, 2026, and new premium licenses stop including them. When a customer's AI Builder credits run out, Power Automate's AI steps draw Copilot Credits, or stop if none are available. Every Business Central and Power Automate customer is heading onto the meter whether or not they bought Copilot.

**4.4 · The developer meter** (bulleted):
- **Since June 1, 2026, GitHub bills Copilot usage in AI credits.** A credit is a penny. Copilot Business includes 1,900 a license a month and costs $19; Enterprise includes 3,900 and costs $39. The allowance pools across the organization.
- **Paid usage is on by default.** GitHub's words: "Additional usage is enabled by default." No budget is set for you.
- **When a budget runs out, work stops.** "There is no automatic fallback to lower-cost models." A developer hits a wall mid-release.
- **The controls exist:** user budgets, cost-center budgets, enterprise spending limits, alerts at 75, 90 and 100%, a switch that stops paid usage, and in-product requests for more.
- **It is not on your invoice.** GitHub's Azure billing does not support the CSP Azure plan, so the customer pays GitHub directly. That is why nobody watches it, and why the service is governance, not resale.
- **Two GitHub meters, not one.** The GitHub harness inside Copilot Studio bills Copilot Credits on your invoice. GitHub Copilot for developers bills GitHub credits on theirs.

**4.5 · The watch list** (C9 table, four rows: Security Copilot, Azure AI Foundry, Fabric Copilot, Agent 365). Columns: meter, what it is, why it is not on the price sheet yet. Key lines: Security Copilot has no Business Premium inclusion; Foundry is opt-in Azure consumption for custom builds; Fabric is rare at 30 to 300 seats; Agent 365 is a $15 seat, not a meter. Closing sentence: "Same four verbs if a customer has one. Price it when it appears in more than a handful of your tenants."

**4.6 · Which of your customers has which meter** (C6 three-across grid, 3 children):
- **Every Copilot Business customer** has the people meter from December 1. That is your whole Copilot book.
- **Every customer with an agent or Business Central** has the agent meter. Pull the agent inventory and the Business Central list.
- **Every customer with developers** has the GitHub meter today. Software firms, agencies, engineering firms, manufacturers with an in-house team.

### 4.5 Section 5, Nobody Has Packaged It Yet

Keep the three cards. Add after them a C9 table titled "What the market charges, October 2026" with a provenance column using the existing chips (MS, Survey, Reported, Ours):

| What is sold | Market price | Provenance |
|---|---|---|
| Copilot Studio agent build | $4,000 to $15,000 one-time | Reported: Microsoft Marketplace listings from US, UK, Canadian, Australian and EU partners |
| Copilot readiness review | $1,500 to $2,500 one-time | Reported: MSP pricing guide |
| AI governance retainer | $750 to $2,500 a month | Reported: MSP pricing guide |
| Copilot or AI management add-on | $10 to $30 a user a month | Reported: MSP pricing guides |
| Recurring price per agent | None published | Our search of partners, analysts and MSP forums |
| Recurring GitHub governance | None published | Same |
| Vendor agents, per resolved conversation | $0.99 to $2 | Third party: Intercom, Zendesk, Salesforce pricing pages |

Then one paragraph:
> Builds are priced and the customer has seen the numbers. Running agents is not priced anywhere. MSP 501 found 91% of MSPs now offer or use AI; Kaseya's 2026 survey found 13% call it meaningful revenue. The gap is packaging, not demand, and the unpriced line is the monthly one.

Firm names stay in the research memos (house rule: describe sellers by market).

### 4.6 Section 6, The Three Sentences

- Sentence 1 body: "The seat buys everyday Copilot. Cowork, Code and Autopilot, agents that serve people outside your license, agents that run on their own, and the agents in Business Central all run on the meter, in Copilot Credits. Your developers' AI has its own meter at GitHub. A credit is a penny on both."
- Sentence 2 unchanged.
- Sentence 3 body: replace "reports by user, group and agent" with "reports by user, group and agent, and a limit for every agent," and end with "on every meter."

### 4.7 Section 7, The Service in Four Verbs

- Lead sentence: add "The verbs are the same on every meter. Only the admin screen changes."
- After the four phase cards, add a C9 table, "The four verbs, meter by meter":

| Verb | People | Agents and business apps | Developers |
|---|---|---|---|
| SET | Lower the 4,000 default; alerts at 80 and 100%; review auto-apply | Draw the free-or-billed line per agent; fixed allocation per environment; tenant draw off; a limit per agent with the alert below the stop; build budget for harness agents; relink Business Central agents off the default environment | Decide the paid-usage policy; a default user budget; cost centers by team; alerts at 75, 90 and 100%; who approves increase requests |
| WATCH | Top users, users at limit, spikes | Credits per agent per week; trigger counts; failed runs; idle agents; Business Central invoices processed | Pool burn; users at budget; coding-agent sessions; model mix |
| TUNE | Packs for steady users; idle seats | Retire idle agents; freeze reasoning and grounding; fix noisy triggers | Enterprise seats only where the pool math says so; steer routine work to cheaper models by policy |
| PROVE | Cost per user per month | Cost per resolved request; cost per invoice processed | Cost per developer per month beside delivery metrics the team already tracks |

- In the SET detail panel, add: "List every agent and mark it free or billed. Set a monthly limit on every billed agent in the Power Platform admin center, with the notification threshold at 80%."
- In the WATCH panel's Surface line, add: "GitHub organization billing for developer credits."

### 4.8 Section 8, The Whiteboard

Chart C is unchanged. After the whiteboard sentence, add a C2 note titled "The second whiteboard, for agents":
> One line per agent: the build, once. The care, every month, priced by who the agent talks to. The credits, passed through. "Agents pay you twice: once to build, every month to run."

### 4.9 Section 9, Pricing Every Meter

Retitle. New subsection order:

**9.1 · Where the playbook is today, and why it moves.** Keep the Credit Wrap text. Add one paragraph:
> AgentCare in Model the Practice charges $350 an agent at Tier 2 and $400 at Tier 3, one rate for every agent. We went looking for a market price to test it against and found none: no partner, analyst or forum publishes a monthly price per agent. The nearest anchors put one agent at $350 below every recurring floor the market shows, and one rate misprices both ends. An internal FAQ agent costs nothing to run and needs an hour a month. A website agent carries billed traffic, brand risk and a weekly review.

**9.2 · What the market charges.** One sentence pointing to the table in section 5, then the analyst line: "Gartner, Forrester and IDC publish no per-agent or per-developer benchmark. Their message is direction: spending moves from seats to usage and outcomes."

**9.3 · Price each meter in the unit that drives it.** C9 table with the provenance chips (D2, D3):

| Line | Unit | Price | Provenance |
|---|---|---|---|
| Credit Wrap, people | per user a month, tenant minimum | $3 to $5, minimum $150 to $250 | Ours |
| Agent build | per agent, one-time | $3,500 to $8,000+, plus a build-credit budget for harness agents | Ours; market builds $4,000 to $15,000 (Reported) |
| AgentCare, internal agent | per agent a month | $150 to $250 | Ours |
| AgentCare, workflow, autonomous or Business Central agent | per agent a month | $350 to $500 | Ours |
| AgentCare, customer-facing agent | per agent a month | $750 to $1,500 | Ours; starter agent retainers $500 to $2,500 (Reported) |
| AgentCare floor | per tenant a month, once any agent is live | $500 | Ours; bottom of the starter agent retainer band, $500 to $2,500 for one or two automations (Reported) |
| GitHub guardrails setup | per organization, one-time | $1,500 to $2,500 | Ours; readiness review band (Reported) |
| Developer governance | per developer a month, minimum | $5 to $10, minimum $150 | Ours; no market price exists |
| Credits, every meter | pass-through | Microsoft's or GitHub's price, own line | MS |

Under the table, one sentence: "The floor means a customer with one internal agent pays $500, not $200. It covers the inventory, the limits and the monthly page that every agent customer needs."

Then a C6 rule strip, three cells (`.rule-strip`, 3 children): "Pass the meter through" · "A floor under every line" · "Price from the hours, reprice quarterly."

**9.4 · Worked example A: 50 users, Tier 1 plus Credit Wrap.** The current 8.3 table and Chart D, unchanged.

**9.5 · Worked example B: one customer, every meter.** A 50-seat professional services firm with Copilot Business, an internal HR agent, a customer-facing intake agent and eight developers on GitHub Copilot Business. Table columns: line, arithmetic, monthly, who keeps it.

| Line | Arithmetic | Monthly | Who keeps it |
|---|---|---|---|
| Copilot Business | 50 × $21 | $1,050 | Microsoft, less your CSP margin |
| Credits, people | 1,500 a user budget | up to $750 | Microsoft, passed through |
| Credits, intake agent | one pack of 25,000 | $200 | Microsoft, passed through |
| Tier 1 AI Essentials | 50 × $12 | $600 | You |
| Credit Wrap | 50 × $4 | $200 | You |
| AgentCare, HR agent | internal tier | $200 | You |
| AgentCare, intake agent | customer-facing tier | $750 | You |
| Developer governance | minimum | $150 | You |
| GitHub Copilot Business | 8 × $19, 15,200 pooled credits | $152 | The customer pays GitHub directly |

Summary line: "On your invoice: up to $2,000 a month passed through, $1,900 a month of your recurring fee. One-time: two agent builds and the GitHub setup." Follow with: "The agent line, $950, sits inside the market's $750 to $2,500 governance retainer band. The intake agent at 20 credits a resolved conversation costs about $0.20 a conversation in credits."

**9.6 · The outcome option, for customer-facing agents** (C1 callout, title "Advanced: price by the resolved conversation, Tier 3 only"):
> Customers already see vendor agents priced at $0.99 to $2 per resolved conversation. A resolved web conversation of five answers and two actions is 20 credits, about $0.20. A price of $0.75 to $1.50 per resolved conversation, credits included, covers the meter, the care and a margin. Offer it only when the agent has run 60 days and the cost per resolution is known, reasoning and grounding settings are frozen in the contract, "resolved" is defined the way the customer's own reports count it, and a monthly minimum and a per-agent limit sit underneath it. Before those hold, you are underwriting Microsoft's meter.

**9.7 · Guardrails that print beside the price.** Keep the four. Add:
- **Never set a hard stop without an alert below it.** The stop turns the agent off.
- **Never put GitHub credits on your invoice as if you carry them.** The customer pays GitHub.
- **Never quote one AgentCare rate for every agent.** Price by who it talks to.

### 4.10 Section 10, How the Money Flows Through Distribution

- **9.1 billing paths:** the `.fork` grid is pinned at two columns, so do not add a third branch. Add a C1 callout after the fork, titled "A third path you don't carry: GitHub":
  > GitHub Copilot seats and AI credits are billed by GitHub. GitHub's Azure billing connection does not support the CSP Azure plan, so for most partners the customer pays GitHub directly. You carry no collection risk on it and earn no margin. You sell the governance.
- Add to the "credits" branch a bullet: "Business Central and Power Automate agent credits travel the same path."
- **Revenue table:** split "Agent operations" into the three AgentCare tiers plus the floor; add "Developer governance · Customer · per developer with a minimum · Recurring."
- **Set-up steps:** add to step 3 "Set a monthly limit on every billed agent, with the alert at 80%. Relink Business Central agents off the default environment." Add a step 7, "Govern the meters you don't bill": set the GitHub paid-usage policy and default budget with the customer.
- **One-slide version:** replace "Agents pay you twice" with "Agents pay you twice: once to build, every month to run, priced by who they talk to." Add: "GitHub pays you for governance only. The customer pays GitHub."

### 4.11 Section 11, Governed Growth

Add a row to the incentive table: "**FY27 CSP incentives** · Seat volume, up-stack moves and consumption · Nothing pays for governing agent or developer spend. The margin comes from your fee." Status chip: Reported.

### 4.12 Section 12, The Practice Conversation (new)

**Lead:**
> Sections 13 and 14 are what your seller says to a customer. This section is the conversation one step earlier: the one your leadership team has about whether to build this, what to charge, and what to do this quarter. It is written as the questions partners ask us, and our answers.

**12.1 · "Which meter do we start with?"**
> The one already running. For most SMB books that is the people meter from December 1, because every Copilot Business customer has it. If you have Business Central customers, the Payables agent is already billing. If you have customers with developers, GitHub has been metering since June. Start where the bill already exists.

**12.2 · "What should we charge?"**
> Builds are priced, $4,000 to $15,000, and your customers have seen those numbers. Monthly AI governance retainers run $750 to $2,500. Nobody publishes a monthly price per agent or per developer. So price the care by risk: a couple hundred a month for an internal agent, $350 to $500 for one that runs on its own or works in Business Central, $750 and up for one that talks to your customer's customers. Put a $500 floor under it once any agent is live, which is where the market's entry retainer for one or two automations starts. Pass the credits through on their own line.

**12.3 · "Why not just mark up the credits?"**
> Because the customer can see Microsoft's public price, nobody publishes a credit margin, and the math is small. Thirty percent of a $200 agent bill is $60. That does not pay for the hour it takes to read it. Charge for the hour.

**12.4 · "Our customers don't have developers. Why care about GitHub?"**
> Most don't. Pull the list of the ones that do. For them, GitHub is the meter already running with no budget, and the bill never crosses your desk, so nobody is watching it. It is the easiest first conversation you will have, because the risk is already live.

**12.5 · "Won't capping spend hurt our Microsoft incentives?"**
> Governed growth, not cost cutting. A limit the customer chose keeps the agent alive. An unwatched bill gets the agent switched off, and Gartner expects over 40% of agentic AI projects to be canceled over cost, value or risk by the end of 2027.

**12.6 · The 90-day plan** (C6 numbered steps, five items):
1. **Run the agent inventory.** Every agent you or the customer built: who it talks to, where, whether it runs alone. Mark each one free or billed.
2. **Limit every billed agent.** A monthly limit in the Power Platform admin center, the alert at 80%, a named person who decides on increases.
3. **Pull the Business Central and Power Automate list.** Check which customers run the Payables or Expense agent, and which Power Automate flows use AI Builder steps and when their credits run out.
4. **Pull the GitHub list.** Set a default user budget and decide the paid-usage policy with each customer.
5. **One page, every meter.** Credits by people, by agent and by developer, each next to an outcome. A template filled from exports, not a custom report.

### 4.13 Section 13, The Talk Track

Keep 13.1 to 13.5 (old 11.1 to 11.5). Add three short "You say" blocks in the existing style:

- **13.6 · When the customer has an agent.** "Before we build an agent, we decide who it talks to. If it's your licensed staff in Teams, it's free to run. If it's your customers, every answer costs a couple of pennies, so we put a limit on it the day it goes live and an alert well before the limit. An agent that runs on its own is a meter that runs while you sleep. We read it every week."
- **13.7 · When the customer runs Business Central or Power Automate.** "The invoice agent in Business Central is about fifty cents an invoice in credits. That's cheap next to a person keying it, and it's still a meter. We set the budget, and we show you cost per invoice next to the invoices it handled. And after November 1, Microsoft stops selling the AI credits your Power Automate flows use today. When yours run out, those flows move to the same meter. We'll move you across before anything stops."
- **13.8 · When the customer has developers.** "Your developers' AI has been on a meter since June, and nobody set a budget. If the budget runs out, the tool just stops, mid-release. We'll set one with you so a busy week doesn't become a surprise bill, and nobody gets cut off without warning."

Arithmetic note for 13.7: a one-line invoice is 55 credits, about $0.55 at pay-as-you-go. Flag as derived (§6).

### 4.14 Section 14, Objections

Add six rows (they say · you say · backing):
1. "Our agents only serve our staff." · "Then they're free, if your staff are licensed and use them in Teams or Copilot. Unlicensed staff and anything that runs on its own bill. We'll check every one." · Zero-rating rule; Copilot Chat agent guidance.
2. "Just set the hard stop and we're safe." · "The stop turns the agent off. Your customers see a dead chat window. We set the alert well below it and decide together before it trips." · Power Platform admin center, per-agent limits.
3. "$750 a month for one agent?" · "Not for an internal one; that's a couple hundred. The $750 is for agents that talk to your customers, where the bill and the brand risk live. Market retainers for one or two automations start at $500." · Market evidence, section 5.
4. "Business Central's Copilot is included." · "The everyday Copilot features are. The Payables, Expense and Sales Order agents run on credits." · Business Central consumption billing documentation.
5. "GitHub is the developers' problem." · "It's the budget owner's problem the day the bill arrives or the tool stops mid-release. Paid usage is on by default and there's no budget until someone sets one." · GitHub billing documentation.
6. "Won't capping it hurt your Microsoft incentives?" · "A cap you chose keeps the agent alive. An unwatched bill gets it switched off." · Section 11; Gartner.

### 4.15 Section 15, Three Dates, Three Campaigns

Retitle. Keep the December 1 timeline and 15.1 checklist. Add before it a C6 three-across grid (3 children):
- **November 1 · The AI Builder sunset.** To every customer whose flows use AI Builder: "After November 1, Microsoft stops selling the AI credits your flows run on. Let's plan the move to Copilot Credits before a flow stops."
- **December 1 · The people meter.** The existing campaign.
- **Any week · The agent and developer sweep.** To every customer with an agent, Business Central agents or GitHub seats: "Your AI has meters with no limits. Thirty minutes to set them." The free session is SET; the close is AgentCare and developer governance.

Add two items to the "Before you sell this" checklist: "You have set a per-agent limit and seen what happens when an agent hits it, in your own tenant." "You have set a GitHub budget on your own organization."

### 4.16 Section 16, Guardrails

Add five traps (total 11, stacked full width, no grid):
- **Trap 7 · "Agents are free with Copilot."** Only when all four tests hold. Say "most internal agents are free; anything facing customers or running alone is metered."
- **Trap 8 · "GitHub credits and Copilot Credits are the same."** Same penny, different meter, different invoice. The GitHub harness in Copilot Studio is Copilot Credits; GitHub Copilot is GitHub credits.
- **Trap 9 · "We'll put a hard stop on it and you're covered."** The stop turns the agent off. Alert first, decide, then stop.
- **Trap 10 · "Every agent is $350 a month to manage."** One rate overcharges the internal agent and undercharges the website agent. Price by who it talks to.
- **Trap 11 · "Your AI Builder credits disappear on November 1."** Microsoft's page says both that seeded credits are removed on November 1 and that they are honored to the end of the contract term. Say what is certain: no new or renewed AI Builder credits after November 1.

### 4.17 Section 17, Sources

- **Microsoft, primary:** add govern credit consumption (October 6, 2026); manage Copilot Studio credits capacity, per-agent limits (October 2, 2026); Business Central consumption billing (July 8, 2026); AI Builder credit management (October 9, 2026); usage-based billing dashboards vs Azure bill (September 25, 2026); Security Copilot inclusion (June 19, 2026).
- **New subsection "GitHub":** usage-based billing for organizations and enterprises; plans for GitHub Copilot; connecting an Azure subscription; the June 1, 2026 changelog.
- **Analysts and surveys:** add MSP 501 (September 23, 2026); Kaseya 2026 State of the MSP.
- **New subsection "Market prices":** Intercom Fin, Zendesk, Salesforce Agentforce pricing pages, read October 12, 2026; the Marketplace and MSP pricing evidence, described by market with the research memo link.
- **Research behind this page:** add links to memos 05, 06, 06b, 07, 08 and 09 (§8b.2: every named document is a link).
- **Where this sits in the playbook:** add a line under Model the Practice: "AgentCare's per-agent rate is priced by risk on this page; Model the Practice will follow."

---

## 5. Facts to register

**New, F-234 onward:**

| ID | Value | Label | Type | Source |
|---|---|---|---|---|
| F-234 | 1,900 | GitHub Copilot Business included AI credits per license per month | microsoft-reported | docs.github.com |
| F-235 | 3,900 | GitHub Copilot Enterprise included AI credits per license per month | microsoft-reported | docs.github.com |
| F-236 | $19 | GitHub Copilot Business per seat per month | microsoft-reported | docs.github.com |
| F-237 | $39 | GitHub Copilot Enterprise per seat per month | microsoft-reported | docs.github.com |
| F-238 | June 1, 2026 | GitHub Copilot usage billing moves to AI credits | microsoft-reported | github.blog changelog |
| F-239 | Additional usage is enabled by default | GitHub paid usage default for organizations and enterprises | microsoft-reported | docs.github.com |
| F-240 | no automatic fallback to lower-cost models | GitHub behavior when a budget is exhausted | microsoft-reported | docs.github.com |
| F-241 | unsupported | CSP Azure plan (MS-AZR-0017G) for GitHub's Azure billing connection | microsoft-reported | docs.github.com |
| F-242 | automatically turned off | Copilot Studio per-agent hard stop behavior at the limit | microsoft-reported | learn.microsoft.com |
| F-243 | no tenant-wide default agent limit | Power Platform admin center default | microsoft-reported | learn.microsoft.com |
| F-244 | November 1, 2026 | Last date existing customers can buy or renew AI Builder credits; seeded credits stop with new premium licenses (the page also says existing seeded credits are honored to contract end) | microsoft-reported | learn.microsoft.com/ai-builder/credit-management, ms.date 2026-10-08 |
| F-245 | September 1, 2026 | Developer and trial environments on usage billing for the GitHub harness | microsoft-reported | learn.microsoft.com |
| F-246 | 91% | MSPs offering or using AI (MSP 501, Channel Futures) | analyst | businesswire |
| F-247 | 13% | MSPs calling AI a meaningful revenue source (Kaseya 2026) | analyst | kaseya.com |
| F-248 | $750-$2,500 | AI governance retainer per month, SMB MSP market | third-party | MSP pricing guide |
| F-249 | $4,000-$15,000 | Copilot Studio agent build, Marketplace listing band | third-party | Microsoft Marketplace |
| F-250 | $10-$30 | MSP AI or Copilot add-on per user per month | third-party | MSP pricing guides |
| F-251 | $0.99 | Intercom Fin per outcome | third-party | fin.ai/pricing |
| F-252 | $1.50 / $2.00 | Zendesk automated resolution, committed / pay-as-you-go | third-party | zendesk.com/pricing |
| F-253 | $2 | Salesforce Agentforce per conversation | third-party | salesforce.com |
| F-254 | $150-$250 | AgentCare internal agent per month (if D2 approved) | our-price | this page |
| F-255 | $350-$500 | AgentCare workflow, autonomous or Business Central agent per month (D2) | our-price | this page |
| F-256 | $750-$1,500 | AgentCare customer-facing agent per month (D2) | our-price | this page |
| F-257 | $500 | AgentCare per-tenant floor (D2) | our-price | this page |
| F-261 | $500-$2,500 | Starter AI agent retainer per month, one or two automations (anchor for the floor) | third-party | AI agency pricing guides, memo 06 |
| F-258 | $1,500-$2,500 | GitHub guardrails setup (D3) | our-price | this page |
| F-259 | $5-$10, $150 minimum | Developer governance per developer per month (D3) | our-price | this page |
| F-260 | $0.75-$1.50 | Outcome option per resolved conversation (D4) | our-price | this page |

**Reused:** F-149, F-157, F-156, F-176, F-013, F-162, F-163 (rate card), F-172 and F-173 (harness), F-185 to F-188 (Business Central agents), F-199 and F-200 (the current $350 / $400, cited in 9.1), F-201, F-214 (IDC 40%), F-218 (Gartner), F-220, F-221.

Every new fact gets an occurrence anchor and `python tools/check-facts.py` must exit 0.

## 6. Derived arithmetic, flagged per DESIGN §8 and not registered

- Worked example B: 50 × $21 = $1,050; $750 + $200 = $950 agent care; $600 + $200 + $200 + $750 + $150 = $1,900; $1,050 + $750 + $200 = $2,000; 8 × $19 = $152; 8 × 1,900 = 15,200.
- Outcome option: 5 × 2 + 2 × 5 = 20 credits = $0.20.
- Business Central: 50 + 5 = 55 credits = $0.55 for a one-line invoice.
- Credit markup: 30% × $200 = $60.

## 7. Design decisions recorded for sign-off (DESIGN §8 prohibition 7)

- **No new classes.** Every new block uses an existing class on this page: `.metrics`, `.recap-grid`, `.pricetags`, C9 tables in `.tablewrap`, `.rule-strip`, `.callout`, `.trap`, `.sentence`, the timeline cards and the existing provenance chips.
- **No new charts.** Chart C and Chart D stay as they are. The meter map and the verb-by-meter matrix are tables, which carry the content at phone width.
- **Grids:** `.metrics` keeps 3 children; `.recap-grid` 3; each new three-across grid has exactly 3; `.rule-strip` additions have 3; `.fork` keeps 2, and the GitHub path is a callout. Traps are full-width blocks, not a grid.
- **Firm names:** none in the page's market tables. Sellers are described by market. No distributor other than TD SYNNEX is named.

## 8. Gates before merge

1. `python tools/check-facts.py` exits 0.
2. DESIGN §9 lint greps return only values in §1, §2, §4.
3. §8b greps: no `max-width` on prose; every named playbook document and research memo is a link; no 4- or 5-child auto-fit grid; no prose in a numeric cell; `sitemap.xml` `lastmod` updated.
4. US English grep clean; no distributor other than TD SYNNEX; no Customer Zero data.
5. Every `#section-N` link resolves; the TOC has 17 entries; every "see section N" reference points to the renumbered section.
6. Rendered at desktop and phone width; the two new tables in section 4 and section 7 scroll inside `.tablewrap` on a phone; masthead pins on scroll.

## 9. Follow-on specs, one file each

| File | Change | Depends on |
|---|---|---|
| [`cpb-model-the-practice.html`](../cpb-model-the-practice.html) | AgentCare to risk tiers and the floor; Credit Wrap to the floor-first structure; link to this page | D2, and the Release 1 proposal in memo 00 §6 |
| [`copilot-credit-planner.html`](../copilot-credit-planner.html) | AgentCare prefill by audience and trigger; Business Central agent card if absent; the default-ceiling card | D2 |
| [`index.html`](../index.html) | Home card copy: "every meter," not one | This release |
| [`cowork-calculator.html`](../cowork-calculator.html) | None | — |

## 10. Open items, not blocking

1. Read the github.blog changelog post for the June to September 2026 promotional allowance before mentioning it. The page does not need it.
2. Verify the Dynamics 365 Sales Premium included-credit figure and the Agent 365 price on Microsoft pages before they leave the watch list.
3. Teams Premium, Teams Phone agents and Azure Communication Services were not researched.
4. **The most valuable evidence we don't have:** a private survey of five to ten trusted SMB partners on what they charge per agent today. The public web has no answer. Its results should replace the "Ours" labels in 9.3 where they can.
