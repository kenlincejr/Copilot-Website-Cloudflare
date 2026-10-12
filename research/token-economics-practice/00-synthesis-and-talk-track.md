# Token economics for the SMB Copilot practice: synthesis and the first talk track

**Gathered:** 2026-10-11. **Status:** research synthesis and a draft talk track. No page changed, no fact registered yet.
**Inputs:** three parallel research passes, kept in this folder:
- [`01-microsoft-positioning.md`](./01-microsoft-positioning.md): what Microsoft says publicly, and the CSP mechanics.
- [`02-who-is-monetizing-it.md`](./02-who-is-monetizing-it.md): SMB MSPs, enterprise SIs, tooling, re-billing norms.
- [`03-analyst-frameworks-and-economics.md`](./03-analyst-frameworks-and-economics.md): analysts, FinOps for AI, failure modes, pricing norms, analogies.

**Builds on:** [`research/cowork-calculator-studio-autopilot-2026-10-11.md`](../cowork-calculator-studio-autopilot-2026-10-11.md) (the verified rate card), [`research/copilot-studio-smb-partner-2026-10-11.md`](../copilot-studio-smb-partner-2026-10-11.md) (SMB nuances), and the AgentOps model in [`cpb-model-the-practice.html`](../../cpb-model-the-practice.html) (Tier 1 to 3, the four pricing dials, Credit Wrap).

**House rules applied:** no distributor other than TD SYNNEX is named. Customer Zero data is absent. Every number below carries its source memo and status. Nothing here reaches a page until it has a fact ID in `data/facts.json`.

---

## 1. The one-paragraph answer

The playbook started with a question partners could not answer: "what do I do for the Copilot upcharge?" The three tiers answered it. The question has now changed shape, and Microsoft changed it on purpose. From **December 1, 2026**, every Copilot Business license sold through CSP arrives with usage-based billing switched on and a default ceiling of **4,000 credits per user per month**, which at a penny a credit is **up to $40 a user**, nearly twice the $21 seat. The bill lands on the **partner's** Azure billing account. Microsoft's CFO calls the model "per-seat-plus-consumption," its Chief Partner Officer tells CSP partners to move customers "from conversation to consumption," and Partner Center names "FinOps for AI" as the partner opportunity. Analysts say buyers want AI they can budget, and three-quarters of organizations already blow their AI budgets. Nobody serving SMB has packaged the answer. The partner who can say three plain sentences about the meter, and sell a four-verb service behind them, owns the conversation that now sits inside every Copilot license sale.

---

## 2. What the research established

### 2.1 Microsoft corroborates the thesis in substance, not by name

| What we claim in the playbook | What Microsoft has said or done | Status | Memo |
|---|---|---|---|
| Copilot is now seat plus usage | Amy Hood, FY26 Q4 call, July 29, 2026: "per-seat-plus-consumption." Nadella: "it's seat plus usage." | VERIFIED / SECONDARY | 01 §B |
| Customers need someone to watch the meter | Hood, same call: customers need "observability of token spend and the manageability of token spend." | VERIFIED | 01 §B |
| The partner's job moves to consumption | Nicole Dezen, Apr 21, 2026: "advancing Copilot and agents from conversation to consumption." | VERIFIED | 01 §B |
| Governance is a partner service | Partner Center, Sept 25, 2026: the opportunity is to "manage and optimize AI at scale"; "FinOps for AI introduces new ways to govern costs." | VERIFIED | 01 §B |
| The meter is on by default for SMB | Partner Center, Oct 1, 2026: UBB on by default for new Copilot Business in CSP from Dec 1, 2026; 4,000 credits per user per month default. | VERIFIED | 01 §C |
| The partner carries the bill | Learn, Oct 1, 2026: the Azure subscription must be "linked to your partner billing account." | VERIFIED | 01 §C |
| Microsoft pays for consumption, not just seats | Cowork CSP Activation Incentive from Sept 1, 2026; reported at $50 per incremental Cowork MAU, gated on $2,500+ monthly consumption. | Announcement VERIFIED; dollars SECONDARY | 01 §C, 02 §E |
| "Tokens" is the vocabulary | Microsoft bills in **Copilot Credits**. "Tokens" is investor and engineering language. No token-to-credit conversion is published. | VERIFIED | 01 §D |

**What Microsoft has not said:** "build a managed service around this." It has not published partner margin on credits, and it has no multi-tenant cost view for partners. Those are the gaps the playbook fills, and the talk track must stay honest about them (01 §E).

**One framing correction for us.** Microsoft's partner language is growth: "accelerating consumption growth," "a natural path to expanded consumption." The Cowork incentive only pays when consumption is sustained. A pitch built on "we keep your AI bill down" fights the vendor's incentive. The pitch is **governed growth**: spend the right credits, on purpose, with a receipt (01 §A, 02 §E).

### 2.2 Nobody in SMB has packaged it

Across roughly 60 searches and 35 page reads (02 §A):
- The dominant pattern is a **free** 15 to 30 minute "set your spending policies" session. Several Microsoft partners are giving the first step of the service away.
- The priced retainers that exist (one Australian MSP publishes three hourly tiers) cover governance and adoption and say nothing about credit budgets, thresholds or re-billing.
- **No SMB MSP publicly re-bills Copilot Credits with a markup, prices an included-credit allowance with overage, or sells a per-agent retainer.**
- The enterprise firms (EY, Deloitte, Kyndryl, Cognizant, Insight) have frameworks and essays, and none has a named, priced Copilot consumption service either (02 §C).
- Microsoft's own partner playbook ("M365 MSP to E7 MSP") names "agent lifecycle & cost governance" and "QBR value packs" as ongoing managed work, which is the closest thing to a Microsoft template for what we are proposing (02 §C).

### 2.3 Analysts explain why the service sells

- **Buyers want AI they can budget.** When AI is billed separately, per-seat is the preferred model (42.3%) over consumption (36.6%), because buyers want a predictable number. Microsoft bills by consumption anyway. The partner's product is turning the meter back into a budget (Futurum, 2026-08; 03 §A).
- **Bill shock is normal.** 78% of IT leaders report unexpected charges from consumption or AI pricing (Zylo, Jan 2026). 46.9% of enterprises are over AI budget (Futurum, Sept 2026). 79% of finance leaders had AI overruns (DoiT, Feb 2026) (03 §D).
- **SMB specifically.** AI is the number one SMB technology priority, 40% of SMBs have no full-time IT employee, and "unpredictable costs are a big red flag" (IDC, June 2026; 03 §D).
- **The unit gets cheaper and the bill gets bigger.** Cost per action falls 87% while total token cost passes $68B (IDC, Dec 2025). Agentic tasks use 10 to 100 times the tokens of a simple call (Futurum, Sept 2026) (03 §A).
- **The partner opportunity.** Generative and agentic AI services grow from $59B in 2025 to $267B by 2030 (Omdia, Dec 2025). Omdia's own words: partners need "consumption optimization expertise to track, manage, and optimize variable usage costs and their own margins" (03 §A).
- **A warning.** When organizations overrun on AI, 60.9% cut external contractors and consultants first (Futurum, Sept 2026). An ungoverned credit bill eats the partner's own services line (03 §A).

### 2.4 The framework already exists, and it is simple

FinOps for AI reduces to Inform, Optimize, Operate, run as a loop, with Crawl, Walk, Run maturity. Its Tokenomics guidance for SaaS models (updated June 2026) gives the operating rules an SMB partner can lift as-is (03 §B):
- baseline 30 to 60 days before setting any threshold, then set thresholds at 110 to 120% of baseline;
- alert at 80% and 100% of budget;
- collect 60 to 90 days of baseline before committing to capacity, and calculate break-even before any pre-purchase;
- prefer spillover to pay-as-you-go over throttling;
- measure cost per user per month and cost per successful outcome.

The 30 to 60 day baseline rule and Microsoft's 4,000-credit default fit together: run the default for one billing cycle, then set real caps.

---

## 3. The crayon version

### 3.1 Three sentences every partner must be able to say

1. **"Your Copilot license now comes with a meter."** The seat buys everyday Copilot. Cowork, Code, Autopilot, agents that serve people outside your license, and anything your agents do on their own run on the meter, in Copilot Credits. A credit is a penny.
2. **"The meter's default setting is bigger than the license."** Microsoft ships new Copilot Business tenants with a 4,000-credit default per user. That is up to $40 a month on top of a $21 seat. For 100 users, the license is $2,100 and the default exposure is $4,000.
3. **"Somebody has to read the meter. That's us."** Microsoft built the dials: budgets, per-user limits, alerts, model routing, reports by user, group and agent. It did not build anyone to turn them. The bill comes to us before it comes to you, so we are going to set the budget with you, watch it, tune it and hand you a receipt every month.

### 3.2 The service in four verbs

| Verb | What the partner does | Cadence | Microsoft surface | FinOps source |
|---|---|---|---|---|
| **SET** | Agree a credit budget per tenant and per group. Lower the 4,000 default to the agreed limit. Turn on alerts at 80% and 100%. Decide which services are allowed (auto-apply new services is **on by default**). Pick the funding source: pay-as-you-go, packs, or pre-purchase. | Onboarding, then once per quarter | Copilot > Cost management in the M365 admin center: spending policies, user limits, alerts, request routing, model profiles | Inform; Crawl |
| **WATCH** | Read the meter. Top consumers, idle agents, spikes, users hitting limits, requests for more. Baseline for 30 to 60 days before changing thresholds. | Monthly, 1 to 2 hours per tenant | Cost management reports by policy, user, group, agent, service and funding source; Power Platform admin center for Studio agents; the monthly export | Operate; anomaly detection |
| **TUNE** | Right-size: move steady users to packs ($0.008 a credit instead of $0.01), move steady tenants to a pre-purchase tier (5 to 20% off) only at break-even, retire idle agents, route routine work to cheaper models, remove unused Copilot seats. | Monthly, with a quarterly re-plan | Capacity packs, P3 tiers, model profiles, agent inventory | Optimize |
| **PROVE** | One page a month: credits spent, by whom, on what, next to the outcome. Cost per user per month. Cost per resolved request for each agent. Feed the QBR. | Monthly page; quarterly review | Insights dashboards (preview), the Cowork ROI model, the credit planner's customer report | Operate; cost per successful outcome |

That table is the whole managed service. Everything else in the playbook (Tier 1 to 3, AgentCare, Agent 365 overlay) wraps around it.

### 3.3 The whiteboard

The old MSP math partners already know how to draw:

```
Microsoft 365 Business Premium   $22 / user / month   (the license)
+ your managed services          $30–40 / user / month (the upcharge: helpdesk, security, backup, patching)
```

The Copilot math the playbook taught them:

```
Copilot Business                 $21 / user / month   (the license)
+ Tier 1 AI Essentials           $10–15 / user / month (the upcharge: safe foundation, activation, value proof)
```

The line that is new as of December 1:

```
+ Copilot Credits                $0–40 / user / month  (the meter: Microsoft's price, passed through, budgeted with you)
+ Credit Wrap                    $3–5 / user / month   (reading the meter: SET, WATCH, TUNE, PROVE)
```

The partner's talk-track sentence for the whiteboard: *"The top two lines you already sell. The third line is Microsoft's, and it is on whether you like it or not. The fourth line is what stops the third one from surprising you."*

### 3.4 The three analogies that work with an SMB owner

Pick one per customer. All three come from 03 §F.

- **Managed print.** "You already pay a cent a page and never think about toner. A Copilot credit is a penny. Every agent action has a page price. We run the fleet."
- **The power bill with budget billing.** "Microsoft installed a meter on your AI. We read it, we put you on budget billing, and we call you before the spike, not after."
- **The phone-plan audit.** "Remember when everyone had three lines nobody used? Unused Copilot seats and forgotten agents are the new version. We find them every month."

Why these three and not "cloud cost management": each has one unit the buyer can say out loud, one predictable monthly number, a named person watching the meter, and savings you can point to. Cloud FinOps has none of those for a 40-person company.

---

## 4. Pricing the fourth line

### 4.1 Where the playbook is today

Credit Wrap in [`cpb-model-the-practice.html`](../../cpb-model-the-practice.html) is defined as "Azure consumption markup": buy pooled credits at CSP cost, bill at a 25 to 35% markup, roughly $75 to $150 a month of margin per customer, "modest at Tier 2." The credit planner carries it as a `finops` service line at 30% of the meter (fact F-202). That definition was written when consumption was a side effect of a few Studio agents. Three things have changed under it:

1. **Consumption is now attached to every Copilot Business seat**, not just agent customers. Credit Wrap belongs at Tier 1, not Tier 2.
2. **Pure percentage pricing fails at SMB scale.** Thirty percent of a $250 meter is $75. Thirty percent of a tenant that stays under the default is nothing. The analysts' published norms for spend-based fees are 1 to 5% and nobody publishes a Copilot markup (02 §E, 03 §E).
3. **Microsoft routes the bill through the partner**, so the partner already carries the collection risk whether or not it charges for governance (01 §C).

### 4.2 The recommended structure

This is our synthesis, not a published norm. It follows the structure the analysts and the MSP billing guidance converge on: a predictable fee, pass-through at Microsoft's price, a visible spread, and an optional savings share (02 §E, 03 §E).

| Component | How it is priced | Why | Status |
|---|---|---|---|
| **Credit Wrap floor** | $3 to $5 per user per month, with a $150 to $250 per-tenant minimum | The buyer's predictable number. Covers SET, WATCH, TUNE, PROVE at 1 to 2 hours a month per tenant. | Our modeling; benchmark against the $10 to $30 per user Copilot add-on range reported for MSP AI services (03 §E, single vendor source) |
| **Credits, passed through** | Microsoft's price, as a separate invoice line | Never sell unlimited usage. Keep license, usage, service and labor as separate lines. | Billing guidance, REPORTED (02 §E) |
| **Pack spread** | Buy packs at $0.008 a credit, bill at the $0.01 pay-as-you-go rate for steady consumers | A 20% spread that is visible and defensible: the customer pays the public rate, the partner carries the commitment and the pooling. | INFERRED from verified prices (02 §E); confirm pack pooling rules before publishing |
| **Savings share (optional)** | 25 to 50% of verified savings from retired seats, retired agents, or a pay-as-you-go to pre-purchase move, for one quarter | The telecom expense management precedent. "We only win if you save." | Precedent REPORTED (03 §E) |

**Worked example, 50-user Copilot Business customer, Tier 1 plus Credit Wrap** (our arithmetic on verified unit prices):
- Licenses: 50 × $21 = $1,050 a month, pass-through.
- Tier 1 AI Essentials: 50 × $12 = $600 a month (existing playbook figure).
- Credit Wrap floor: 50 × $4 = $200 a month.
- Credits: budgeted at 1,500 per user (a $15 cap instead of the $40 default) = $750 a month ceiling, pass-through. If 30 of the 50 are steady Cowork users on packs, the spread on their consumption adds roughly $90 a month.
- Partner recurring revenue from the new line: about $290 a month per customer at roughly 85% gross margin once the monthly read is routine. Across 50 customers, roughly $175,000 a year, almost all of it from the floor fee rather than the markup.

That is a different shape from the current Credit Wrap page, which puts the revenue in the markup. The research says put it in the floor, and let the spread be the bonus.

### 4.3 Guardrails the playbook must print beside the price

- **Never promise a token-to-credit conversion.** Microsoft publishes none (01 §D).
- **Never promise that pre-purchase saves money** without a 60 to 90 day baseline and a break-even calculation. Unused P3 credits expire (01 §C, 03 §B).
- **Zero-rating is the first question, not the last.** A licensed user's own use of a standard Copilot Studio agent inside Microsoft channels is free with the seat. The bill comes from Cowork, Code, Autopilot, unlicensed and external users, autonomous runs, computer use and the GitHub harness (cowork-calculator-studio-autopilot memo §3.1). A partner who cannot say this will over-quote and lose the deal.
- **Pack and pre-purchase commitments need an owner clause.** Nobody publishes SOW language for who owns a Copilot Credit commitment when a customer leaves. We should (02 §F).

---

## 5. The talk track, draft one

Written for a partner seller or vCIO talking to an SMB owner or office manager, 30 to 300 seats, who already buys Microsoft 365 and either has Copilot or is about to. Plain words. No "FinOps," no "tokens," no "UBB" in the customer's hearing.

### 5.1 Opening (60 seconds)

*"You know how your Microsoft 365 bill has always been a flat number per person? Copilot changed that this year. The license is still flat, $21 a person. But the new stuff, the part where Copilot actually does work for you instead of answering questions, runs on a meter. Microsoft calls the units credits. A credit is a penny.*

*Here's the thing nobody is telling small businesses. Starting December 1, every new Copilot Business license comes with that meter switched on, and the default setting lets each person spend up to 4,000 credits a month. That's forty dollars. On top of a twenty-one dollar license. For your 50 people, that is a $2,000 a month ceiling you did not agree to.*

*The bill comes to us first, because we are your Microsoft partner. So we are not going to let the default run. We are going to set it with you."*

### 5.2 The three sentences (the whiteboard moment)

Draw the four lines from §3.3. Say the three sentences from §3.1. Stop talking. Let them ask what a credit buys.

### 5.3 "What does a credit actually buy?" (the answer that keeps it simple)

*"Three kinds of work, three price tags.*

- *Asking Copilot a question in Word, Outlook, Teams: included in the license. No meter.*
- *Telling Copilot to go do a job, like 'build me the board pack from these six folders' or 'work through these forty invoices': that runs on the meter, and a job is counted in dollars, not pennies. Microsoft's own range for a heavy user is somewhere between eighty and two hundred-odd dollars a month if nobody is watching.*
- *An agent you build that answers your customers, or runs by itself overnight: every answer and every action is metered, a couple of pennies per answer, a nickel per action.*

*Our job is to make sure the second and third kinds happen on purpose."*

(Figures: Microsoft's published Cowork range is $82 to $228 per active user per month, already on the Cowork calculator page. Studio rate card: generative answer 2 credits, action 5 credits, verified in the rate-card memo.)

### 5.4 The offer (90 seconds)

*"Four things, every month, for $4 a person.*

*We SET the budget with you: a limit per person, a limit for the whole company, an alert at 80%. We WATCH the meter: who is using it, what is sitting idle, anything that spikes. We TUNE it: steady users go on the cheaper prepaid rate, unused seats and forgotten agents get turned off, routine work goes to the cheaper model. And we PROVE it: one page, once a month, that says what you spent and what you got for it.*

*The credits themselves are Microsoft's price, on their own line. We don't mark up the pennies. We charge for reading the meter."*

### 5.5 The ask

*"Before December 1, let's set your limits. Thirty minutes, in your admin center, with you on the call. Then we run one month at the budget we agreed and I bring you the first page."*

### 5.6 Objections

| They say | You say | Backing |
|---|---|---|
| "We'll just leave the default. $40 is a ceiling, not a bill." | "A ceiling nobody is watching becomes the bill. 78% of IT leaders got a surprise charge from this kind of pricing last year. And Microsoft turns on new metered features by default, so the ceiling grows on its own." | Zylo 2026 (03 §D); auto-apply new services default (02 §D) |
| "We'll just turn the meter off." | "You can, and for some people you should. But the meter is where the new Copilot lives: the jobs, the agents, the overnight work. Turning it off keeps you on the chatbot forever. The question is not on or off. It is who decides, and when." | Spataro, Sept 25, 2026: UBB covers Cowork, Code, Autopilot (01 §D) |
| "Isn't this your problem? You're the partner." | "It is, which is why I'm here. The bill comes to us before it comes to you. We are going to govern it either way. I'd rather do it with you, with a budget you chose, than for you after the fact." | Partner billing account link (01 §C) |
| "Why pay you to read a dashboard Microsoft gives us?" | "Microsoft gave you the dials. Nobody at your company has the job of turning them, and 40% of businesses your size have no full-time IT person at all. Four dollars a person buys you someone whose job it is." | IDC SMB, June 2026 (03 §D) |
| "Can't you just put us on prepaid and save us money?" | "Not yet. Prepaid credits expire if you don't use them. We baseline you for two months first, then we move the steady users across when the math says it pays. That is part of what you're paying us to get right." | FinOps break-even rule (03 §B); P3 expiry (01 §C) |
| "What's a credit in tokens?" | "Microsoft doesn't publish that, and anyone who gives you a number is guessing. The credit is the unit. A penny. That's the whole point: you budget in pennies, not tokens." | 01 §D |
| "Our agents are for our own staff. Why would we pay anything?" | "If they're your licensed people using a normal agent in Teams, you don't. That's included. You pay when the agent serves customers, runs on its own, or does the heavy stuff. We'll draw that line for every agent before we build it." | Zero-rating rule (rate-card memo §3.1) |

### 5.7 The December 1 campaign (the first thing to ship)

Competitors are offering the setup session for free. We should turn it into the on-ramp to the paid service:
- **Subject line to every Copilot Business customer:** "Your Copilot bill changes December 1. Let's set your limit first."
- **The 30-minute session** (free): link the Azure billing, lower the default, set the alerts, review auto-apply, name the budget owner.
- **The close at the end of the session:** "That's SET. WATCH, TUNE and PROVE are $4 a person a month. Your first page arrives in 30 days."

---

## 6. What this changes in the playbook

Proposed edits, in order of leverage. None is made yet.

| # | Where | Change | Why |
|---|---|---|---|
| 1 | [`cpb-model-the-practice.html`](../../cpb-model-the-practice.html), Credit Wrap (the "④ Credit Wrap — Azure Consumption Markup" block and Component C) | Rewrite from "Azure consumption markup, modest at Tier 2" to the §4.2 structure: floor fee, pass-through, pack spread, optional savings share. Move it into Tier 1's scope. Replace the $75 / $150 markup example with the §4.2 worked example. | The page's premise (consumption is a Tier 2+ side effect) is no longer true after Dec 1. |
| 2 | New page, or a new section of [`cpb-run-the-engagement.html`](../../cpb-run-the-engagement.html) | "The Meter Conversation": §3.1 three sentences, §3.3 whiteboard, §3.2 four verbs, §5 talk track and objections, §5.7 campaign. | This is the talk track Ken asked for, and the engagement guide is where partners look for words to say. |
| 3 | [`copilot-credit-planner.html`](../../copilot-credit-planner.html), the `finops` service line (F-202, 30% pct-meter) | Add a floor-fee basis (per user plus tenant minimum) alongside the percentage, and surface the Dec 1 default-cap exposure as a card: seats × $40 versus the agreed budget. | The planner is where the number gets quoted; it should quote the shape the research supports. |
| 4 | [`cowork-calculator.html`](../../cowork-calculator.html) | The V-31 warning already planned in the Cowork research memo (§2.3): a modeled user hits the 4,000 default around day 8. | Already specified; this research makes it the opening line of the talk track. |
| 5 | [`index.html`](../../index.html) and the Tier 1 card | One sentence on the home page and in Tier 1 "Safe Foundation": "set the credit budget" joins "oversharing assessment" as a day-one task. | Every Copilot Business customer is now a consumption customer. |
| 6 | `data/facts.json` | Register: Dec 1 default-on and the 4,000-credit cap (Partner Center, Oct 1, 2026); the Hood "per-seat-plus-consumption" and "observability of token spend" quotes (July 29, 2026); the Dezen "conversation to consumption" and "60% of CSP partner revenue" lines (Apr 21, 2026); the Partner Center "manage and optimize AI at scale" and "FinOps for AI" lines (Sept 25, 2026); the Zylo 78%, Futurum 46.9% and 42.3%, IDC 40% figures; the Omdia $59B to $267B forecast. | DESIGN §8 prohibition 10: no number on a page without a fact ID. |
| 7 | [`research/partner-program-journey/03-smb-copilot-practice-economics.md`](../partner-program-journey/03-smb-copilot-practice-economics.md) | Add a pointer to this folder; its "$5 to $15 per user governance MRR [UNVERIFIED]" line now has a better-sourced neighbor. | Keep the research graph connected. |

---

## 7. Open items before any of this is published

1. **Read the gated Microsoft documents with a partner login:** the UBB-for-SMB partner deck and FAQ (aka.ms/UBBforSMB/FAQ), the CSP Partner Copilot FAQ, and the Cowork Activation Incentive deck (aka.ms/coworkactivationbonus). They may answer the two biggest gaps: partner margin on credits, and any partner-side cost visibility (01 §E).
2. **Confirm pack pooling and multi-unit tier purchases** in the Azure portal before the pack-spread line is priced (cowork memo §2.1; 02 §E).
3. **Confirm the Cowork incentive dollar mechanics** ($50 per MAU, $12,500 cap, $2,500 consumption gate) against the Microsoft deck. They are SECONDARY today (01 §C).
4. **Watch FY27 Q1 earnings** (late October 2026) for the first Copilot Credit revenue disclosure, and **Ignite** (Nov 17 to 20) for Autopilot pricing (01 §E; cowork memo §1).
5. **The consumption API returns 403 since September 2026.** Until Microsoft ships the supported alternative, WATCH is a monthly export and a human, not an automation. The talk track says "1 to 2 hours a month per tenant" for that reason (02 §D).
6. **The Channel Insider "$10 per user" default** conflicts with Microsoft's 4,000 credits. Use Microsoft's figure and never the press one (02 §A).
7. **Two product names are live.** The Credits Guide says Microsoft 365 Copilot became Microsoft Copilot in August 2026; Partner Center still writes "Microsoft 365 Copilot Business." Pages should carry both until Microsoft settles it (01 §D).
