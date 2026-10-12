# Token economics for the SMB Copilot practice: analyst, framework and economics layer

**Gathered:** 2026-10-11. **Status:** research record, no page changed. Research-agent memo, kept verbatim; first person is the agent's.
**Part of:** [`research/token-economics-practice/`](./00-synthesis-and-talk-track.md).
**Method note.** **VERIFIED** means the publisher's own page was read. **VERIFIED-excerpt** means the publisher's own page came up in search results but blocked direct fetch (403); the excerpt matches several press reports. **SECONDARY** means a press or vendor summary. The Gartner newsroom, Omdia report pages, Bain and parts of McKinsey all returned 403 or timed out. No distributor other than TD SYNNEX is named.

---

## (A) The analysts' view of the shift, and the size of the partner opportunity

**What is shifting.** Every major firm describes the same move: away from per-seat pricing, toward meters (usage, capacity, actions, outcomes), with seats kept as a base layer.

- **Bain, "AI Pricing: A Reality Check on Effort, Usage, and Outcomes" (2026-08-10), VERIFIED-excerpt.** https://www.bain.com/insights/ai-pricing-a-reality-check-on-effort-usage-and-outcomes/
  - About 10% of software companies use outcome-based meters, about 35% effort-based and about 55% output-based.
  - Most companies add meters on top of seats rather than replacing seats.
  - Bain's key line: "most usage-based pricing is capacity-based pricing with overages," and capacity, not raw consumption, is becoming the preferred model.
  - That describes Microsoft's design exactly: an included allowance, capacity packs, then PAYG overage.
- **Futurum, "The Pricing Split" (2H 2026 survey; PDF dated 2026-08), SECONDARY via search excerpt.** https://futurumgroup.com/wp-content/uploads/2026/08/The-Pricing-Split-Why-Core-Software-and-AI-Cant-Share-One-Commercial-Model_AIOKK202608.pdf
  - For core software, buyers prefer consumption (28.9%) and outcomes (22.2%) over seats (12.6%).
  - For AI that is billed separately, per-seat comes first (42.3%), ahead of consumption (36.6%), because buyers want AI costs they can budget.
  - **This is the single best analyst justification for the managed service.** Microsoft bills AI by consumption. The buyer wants a predictable number. The partner's job is to turn the meter back into a budget.
- **Futurum press release (2026-05-12), VERIFIED.** https://futurumgroup.com/press-release/are-outcome-based-and-hybrid-ai-pricing-models-rewriting-the-vendor-playbook/
  - 43% of buyers prefer consumption pricing, 27% outcome-based, and under 20% per-user.
- **Futurum (2026-09-25), VERIFIED via the Business Wire copy.** https://www.financialcontent.com/article/bizwire-2026-9-25-agentic-ai-can-raise-token-use-per-task-up-to-100-times-accelerating-the-shift-away-from-per-token-pricing-futurum-research-finds
  - Agentic AI can raise token use per task "10 to 100 times" compared with a simple inference call.
  - Survey of 824 AI decision-makers.
- **IDC, "Agent Adoption" (2025-12-10), VERIFIED.** https://www.idc.com/resource-center/blog/agent-adoption-the-it-industrys-next-great-inflection-point/
  - G2000 agent use will rise 10x by 2027 while token and API loads rise 1,000x.
  - Over 1 billion deployed agents by 2029.
  - Cost per action falls 87%, yet annual token delivery cost passes $68B.
  - Vendors must "move beyond seats and licenses"; MSPs need platforms offering "speed, transparency, and scale."
  - Crayon version: **the unit gets cheaper, the bill gets bigger.**
- **FinOps Foundation / J.R. Storment, "Token Economics: The Atomic Unit of AI Value" (2026-05-10), VERIFIED.** https://www.finops.org/insights/token-economics-the-atomic-unit-of-ai-value/
  - Makes the same point: the cost of a token at a fixed tier drifts down, but the mix and volume an enterprise actually consumes does not.
- **Gartner, AI coding costs (press release 2026-06-24), VERIFIED-excerpt plus SECONDARY coverage.** https://www.gartner.com/en/newsroom/press-releases/2026-06-24-gartner-predicts-ai-coding-costs-will-surpass-average-developer-salary-by-2028-as-token-consumption-surges and https://www.theregister.com/ai-and-ml/2026/06/24/ai-coding-agents-could-soon-cost-more-than-the-developers-using-them/5260864
  - AI coding costs will exceed the average developer salary by 2028.
  - Nearly a quarter of technology leaders already spend $200–$500 per developer per month on tokens; about 6% spend over $2,000.
  - Analyst Nitish Tyagi: token discipline "will not emerge through developer choice alone."
  - Directly relevant to GitHub Copilot premium requests.
- **Gartner, $234B of application spend at risk from agentic AI (2026-07-01), VERIFIED-excerpt.** https://www.gartner.com/en/newsroom/press-releases/2026-07-01-gartner-says-us-dollars-234-billion-in-enterprise-application-software-spend-is-at-risk-from-agentic-artificial-intelligence
  - Agents weaken the link between usage and seats.
- **Forrester, Predictions 2026 (2025-10-28), VERIFIED-excerpt.** https://investor.forrester.com/news-releases/news-release-details/forresters-2026-technology-security-predictions-ais-hype-fades-0
  - Enterprises will defer 25% of planned AI spend into 2027.
  - Fewer than one-third of decision-makers can tie AI to financial growth.
  - CFOs will get pulled into AI deals.
- **HFS Research, "Agentic Services 2026" (2026-04), SECONDARY via excerpt.** https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/2026/04/hfs-horizons-agentic-services-2026.pdf
  - 76% of enterprise clients are open to outcome or gainshare models, but only 5% of contracts use them.
- **BCG, "Rethinking B2B Software Pricing in the Agentic AI Era" (2025), SECONDARY.** https://www.bcg.com/publications/2025/rethinking-b2b-software-pricing-in-the-era-of-ai
  - Gives a taxonomy: usage, agents, interactions, jobs completed, financial outcomes.

**How big the partner opportunity is**

- **Omdia (Jay McBain), via Channel Dive (2025-12-18), SECONDARY reporting VERIFIED Omdia numbers.** https://www.channeldive.com/news/managed-services-608b-tech-growth-omdia-jay-mcbain/807746/
  - Generative and agentic AI services: **$59B in 2025, rising to $267B by 2030**, the fastest-growing services segment.
  - Managed services: a $608B market growing 13% a year, and 27% of partner revenue.
  - 84% of partners now earn managed-services income.
  - 44% of partners build or deploy agents today; 64% expect to within 18 months.
  - Omdia report page: https://omdia.tech.informa.com/om141868/from-genai-to-agents-the-us$267-billion-ai-opportunity-for-partners
- **Omdia, "The $347bn AI Services Opportunity" (2026), VERIFIED-excerpt.** https://omdia.tech.informa.com/om147057/the-$347bn-ai-services-opportunity-partner-opportunity-and-readiness-challenges
  - AI services reach $347B by 2031 at a 32.5% CAGR, but "most partners aren't ready."
- **Omdia, generative AI channel opportunity, VERIFIED-excerpt.** https://omdia.tech.informa.com/om142214/generative-ai-will-be-a-us1586-billion-opportunity-for-the-channel-ecosystem-by-2028
  - A $158.6B opportunity for the channel by 2028.
- **Omdia blog, "How partners win in the Agentic AI era" (2025-12), VERIFIED-excerpt.** https://omdia.tech.informa.com/blogs/2025/dec/how-partners-win-in-the-agentic-ai-era-pricing-packaging-and-strategy-for-ai
  - Partners need "consumption optimization expertise to track, manage, and optimize variable usage costs and their own margins."
  - It lists consumption-plus, subscription/managed-services and hybrid "implementation + ongoing optimization fees" models.
  - **This is the closest any analyst comes to naming the service on the thesis.**
- **Omdia, channel sales (2026), SECONDARY.** https://www.channeldive.com/news/channel-partner-sales-growth-2026-omdia/810530/
  - The channel will pass $4T in 2026, up 6.7%.
- **Copilot specifically.** No Omdia or IDC report sizing the Copilot services attach rate was found.
  - Search snippets credit Omdia with "60% of CSP partner revenue is now tied to value-added services," appearing alongside Microsoft Partner Center material. The original source could not be confirmed here. (Note from synthesis: memo 01 found the sentence in Nicole Dezen's 2026-04-21 Microsoft blog post, so attribute it to that post, not to Omdia.)

**A warning for partners.** Futurum (2026-09-10, VERIFIED) found that 60.9% of organizations reallocating money to cover AI overruns **cut external contractors and consultants first**. https://futurumgroup.com/press-release/46-9-of-enterprises-report-ai-spend-over-budget-in-2h-2026/
- An uncontrolled AI bill eats the partner's own services budget. Cost control protects the partner's revenue.

---

## (B) FinOps for AI, reduced to the simplest loop

**What the Foundation publishes.**

- **Core framework phases: Inform, Optimize, Operate**, as an iterative cycle (no date on the page). VERIFIED. https://www.finops.org/framework/phases/
- **"FinOps for AI Overview" (2026-02-17), VERIFIED.** https://www.finops.org/wg/finops-for-ai-overview/
  - Maturity: Crawl, Walk, Run.
  - Eight personas: data scientists, data engineers, software/prompt engineers, business analysts, DevOps, product managers, leadership, end users.
  - KPIs: cost per inference, cost per API call, token consumption (cost ÷ tokens), utilization efficiency, anomaly detection rate, ROI, time to business value, time to first prompt.
  - Steps are grouped as Enablement → Governance → Architecture → Operations. Operations includes "apply usage limits, quotas, and throttling" and anomaly detection.
- **AI technology-category page (undated), VERIFIED.** https://www.finops.org/framework/technology-categories/ai/
  - Personas: FinOps, Engineering, Finance, Product, Procurement, Leadership.
  - Admits that "consumption volumes are virtually impossible to predict," so forecasts must be revised more often.
- **"Tokenomics: Managing AI Value in SaaS Model Token Costs" (last updated 2026-06-03), VERIFIED. This is the most relevant document for Copilot.** https://www.finops.org/wg/token-economics-saas/
  - **Crawl (months 1–3):** inventory spend, assign named owners, basic dashboards, account-level alerts.
  - **Walk (months 3–9):** attribute spend to workloads, publish unit costs, anomaly detection.
  - **Run (month 9+):** chargeback, policy enforcement, commitments based on forecasts.
  - Unit metrics: cost per query, **cost per user per month**, **cost per successful outcome** (counting only quality-cleared runs), cost per business transaction.
  - Alert rules:
    - Baseline 30–60 days before setting any threshold.
    - Then set thresholds at 110–120% of baseline.
    - Alert at 80% and 100% of budget.
  - Commitments:
    - "Calculate break-even utilization before committing."
    - Collect 60–90 days of baseline before reserving capacity.
    - Prefer spillover to PAYG over throttling.
  - It calls out seat-plus-usage copilots (GitHub Copilot by name) as a viral spend category with poor visibility.
- **State of FinOps 2026, VERIFIED.** https://data.finops.org/
  - 1,192 respondents; 20% SMB.
  - 98% now manage AI spend (31% two years ago).
  - 90% manage SaaS and 64% manage licensing. Copilot-style spend is formally in scope.

**Does it map to a 4–5 step loop?** Yes, and cleanly. The Foundation's own documents support this crayon loop:

| # | Step (crayon word) | FinOps source |
|---|---|---|
| 1 | **SEE**: inventory licenses, credits, agents; name an owner for each | Inform / Crawl "spend inventory, named owners" |
| 2 | **SET**: budget, caps and alerts at 80/100%, approved agents list | Governance; "usage limits, quotas"; alert thresholds |
| 3 | **MEASURE**: one unit cost per use case (cost per resolved request) | Walk "publish unit cost metrics"; cost per successful outcome |
| 4 | **TUNE**: right-size seats, retire idle agents, move PAYG to packs or pre-purchase at break-even | Optimize; "break-even utilization before committing" |
| 5 | **REPORT**: monthly one-page showback to the owner, then repeat | Operate; showback/chargeback |

The 30–60 day baseline rule fits naturally with the CSP default of 4,000 credits per user per month from 2026-12-01: run the default for a baseline period, then set real caps.

---

## (C) Unit-economics vocabulary SMB partners can borrow

| Term | Who publishes it | Typical published number | Source / date / status |
|---|---|---|---|
| Cost per successful outcome | FinOps Foundation | Method only: count quality-cleared runs only | finops.org/wg/token-economics-saas, 2026-06-03, VERIFIED |
| Cost per user per month | FinOps Foundation | Method only | same |
| Cost per inference / per API call / cost per token | FinOps Foundation | Method only | finops.org/wg/finops-for-ai-overview, 2026-02-17, VERIFIED |
| Cost per resolution (outcome) | Intercom Fin | $0.99 per outcome; 50-outcome monthly minimum with third-party helpdesk | intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes (undated), SECONDARY pricing summaries 2026 |
| Cost per automated resolution | Zendesk | $1.50 committed / $2.00 PAYG | zendesk.com/blog/ai/agentic-ai/outcome-based-pricing/ (undated); SECONDARY e.g. getmacha.com 2026 |
| Cost per action / per conversation | Salesforce Agentforce | $0.10 per action (Flex Credits, $500 per 100k credits), $2 per conversation | SECONDARY: salesforceben.com/complete-guide-to-agentforce-pricing-options/ (2026) |
| Cost per credit | Microsoft | $0.01 PAYG; 25,000-credit pack at $200 (~$0.008) | Verified in the site's own facts (F-155 to F-184) against the October 2026 Credits Guide |
| Cost per developer per month (tokens) | Gartner | $200–$500 typical; 6% above $2,000 | Gartner 2026-06-24, VERIFIED-excerpt |
| Cost per action trend | IDC | −87% by 2029 while total spend rises | idc.com, 2025-12-10, VERIFIED |
| Token multiplier per agentic task | Futurum | 10–100x a simple call | 2026-09-25, VERIFIED |
| Share of agentic cost spent on refinement | McKinsey | 60% | SECONDARY: marketscale.com, 2026-07-25 |

**Crayon tip:** a Copilot Credit costs one cent, the same order as a black-and-white printed page ($0.01–$0.015, see F). "Every agent action has a page price" is a defensible analogy.

---

## (D) Failure-mode evidence

**Budget overruns**

- **FinOps Foundation State of FinOps 2026:** 73% report AI costs above original projections.
  - SECONDARY (several 2026 recaps, e.g. https://www.beri.net/article/ai-finops-2026-73-percent-blow-budget-cfo-fix). It is not on the data.finops.org summary that was readable.
- **Futurum (2026-09-10), VERIFIED; 1,636 decision-makers.** https://futurumgroup.com/press-release/46-9-of-enterprises-report-ai-spend-over-budget-in-2h-2026/
  - **46.9% over budget**: 35.6% moderately, 11.3% substantially. 10% have **no formal AI budget at all**.
  - Response: 43.3% "absorb and reconcile later"; only 17.2% pause.
- **DoiT (2026-02), VERIFIED; 500 finance leaders, US/UK, 1,000+ employees.** https://www.doit.com/blog/ai-spending-survey
  - **79% had overruns** in the past 12 months.
  - Mature FinOps organizations had 89% overruns, averaging 30.9% over; early-stage organizations had 69%, averaging 16.1%. "Maturity surfaces problems."
  - Only 15% can calculate AI ROI without bottlenecks.
  - Ownership is split between Technology (55%) and Finance (53%).
- **McKinsey Enterprise AI FinOps survey (May 2026; n=75), SECONDARY.** https://www.marketscale.com/industries/software-and-technology/60-of-agentic-ai-costs-go-to-response-refinement-and-most-enterprises-are-already-over-budget (2026-07-25)
  - **93% over AI budget**; 1 in 5 constrained AI use because of cost.
  - McKinsey's own page: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-cost-of-intelligence-how-cios-can-manage-ai-demand-at-scale (timed out). Per secondary excerpts, it says 20–30% of enterprise AI spend is "unaccounted for."
  - The sample is small; cite it as a practitioner survey.
- **Gartner (via Campus Technology, 2026-06-22), SECONDARY.** https://campustechnology.com/articles/2026/06/22/gartner-half-of-gen-ai-projects-could-exceed-budget-by-2028.aspx
  - **50% of GenAI projects will exceed budget by 2028.**
  - Inference will be at least 70% of lifetime cost.
  - Agentic AI multiplies model calls.
- **Gartner (2024-10-21), VERIFIED-excerpt.** https://www.gartner.com/en/newsroom/press-releases/2024-10-21-gartner-identifies-four-emerging-challenges-to-delivering-value-from-ai-safely-and-at-scale
  - Teams that don't understand how costs scale risk a **500–1,000% error** in cost calculations.
  - Over 90% of CIOs said cost limits AI value.
- **Gartner (2025-06-25), VERIFIED-excerpt.** https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
  - **Over 40% of agentic AI projects will be canceled by end of 2027** due to escalating costs, unclear value or weak risk controls.

**Bill shock, shadow AI and unused seats**

- **Zylo 2026 SaaS Management Index (2026-01-29), VERIFIED.** https://zylo.com/news/2026-saas-management-index
  - **78% of IT leaders reported unexpected charges from consumption-based or AI pricing.**
  - 61% cut projects because of unplanned SaaS increases.
  - 36% of licenses unused.
  - Expensed SaaS up 267%; ChatGPT is the most expensed app.
  - Business units control 81% of SaaS spend.
- **Gartner (2025-11-19), VERIFIED-excerpt plus SECONDARY.** https://www.gartner.com/en/newsroom/press-releases/2025-11-19-gartner-identifies-critical-genai-blind-spots-that-cios-must-urgently-address0
  - Over 40% of organizations will have shadow-AI security or compliance incidents by 2030.
  - 69% of security leaders suspect employees use public GenAI.
- **Unused pre-purchase or credit packs.** No survey measuring unused AI pre-purchases or credit packs was found. Searches returned only vendor blogs.
  - The nearest proxy is the FinOps break-even guidance in (B).
  - A claim that "IDC: 49% have ≥10% of Copilot seats unused" appears only on vendor blogs; **unverified, do not publish.**

**SMB specifically**

- **IDC (2026-06-30), VERIFIED; 2,700+ decision-makers.** https://www.idc.com/resource-center/blog/from-wait-and-see-to-all-in-how-smbs-are-rewriting-their-ai-story/
  - AI is now the #1 SMB technology priority.
  - **40% of SMBs have no full-time IT employee.**
  - "Unpredictable costs are a big red flag"; SMBs prefer transparent, credit-based pricing.
- The SMB statistics that circulate ("68% exceed budget, 42% average overrun," "$18,000 average AI spend") come from unattributed blogs. **Do not use.**

---

## (E) Pricing norms for services built around consumption

| Model | Published norm | Source / date / status |
|---|---|---|
| % of managed cloud spend (tools/platforms) | ~1–3% (e.g., 2–3% for legacy suites; ~1% for newer tools) | usage.ai/blogs/finops/cloud-cost-optimization-software-cost/ (2026), SECONDARY; finout.io/pricing, vendor, VERIFIED-excerpt |
| Share of realized savings | 15–30% of savings; "no savings, no fee" | usage.ai/blogs/finops/savings-based-cloud-cost-optimization-pricing/ (2026), SECONDARY |
| Telecom expense mgmt, % of spend | 1–5% of spend, sliding down as spend grows | tellennium.com/how-much-will-a-telecom-expense-management-service-cost/ (undated), SECONDARY |
| TEM per device / per line | $1–$10 per device; $2–$15 per line per month | Tellennium; sociumit.com/resources/blog/tem-pricing-guide-2026, SECONDARY |
| TEM gain-share | 25–50% of savings | Tellennium, SECONDARY |
| Print, cost per page | $0.01–$0.015 mono, $0.06–$0.12 color, all-inclusive | perryprotech.com/2026/07/15/managed-print-services-cost/ and similar, SECONDARY |
| MSP Copilot services (SMB) | $2,500–$6,000 readiness project; $750–$2,500/month governance retainer; or $10–$30/user/month add-on | scopable.io/blog/msp-ai-services-pricing-2026 (2026), SECONDARY, single vendor source |
| Agentic partner models | consumption-plus, managed subscription, implementation + ongoing optimization fee, outcome-based | Omdia blog 2025-12, VERIFIED-excerpt |

**The 5–15% figure.** **No published source** was found for "FinOps managed services charge 5–15% of managed cloud spend." The published norms are lower (1–5%) for spend-based fees and 15–30% for savings-based fees. The 5–15% range is plausible for small accounts where a fixed floor dominates, but present it as an assumption, not a norm.

**Recommended structure for SMB** (synthesis from the norms above):
1. A flat monthly governance fee per tenant, or a small per-user fee. This is the buyer's predictable number, which is what Futurum shows buyers want for AI.
2. Credits passed through at Microsoft price.
3. Optional gain-share on verified savings, such as idle seats removed or a PAYG-to-pack switch.

At SMB spend levels, a percentage of AI spend alone produces trivial fees (2% of a $500/month credit bill is $10), which is why a fixed floor is needed.

---

## (F) The three best analogies for an SMB buyer

1. **Managed print: "cost per page" becomes "cost per agent action."**
   - Why it works: SMB owners already sign cost-per-page contracts.
   - The unit price is about one cent, the same order as a Copilot Credit.
   - The pitch is identical: one known rate, supplies included, no surprise toner orders.
   - The industry promise of 20–30% savings from moving unmanaged to managed (attributed to Gartner and Quocirca in SECONDARY sources, e.g. perryprotech.com 2026-07-15) gives a familiar proof shape.
   - Talk track: *"You never let printers run wild. Agents print money the same way."*
2. **The electric utility bill with a budget plan: meter, budget billing, usage alerts.**
   - Why it works: everyone already understands a meter, a monthly average plan, and an alert when usage spikes.
   - It matches Microsoft's design: allowance, pack and PAYG are base load, budget plan and overage.
   - It also matches Bain's finding that capacity-with-overage is the real model.
   - Talk track: *"Microsoft installed a meter on your AI. We read it, budget it, and call you before the spike."*
3. **Telecom expense management / the cell-phone plan audit.**
   - Why it works: SMBs remember overage bills and unused lines.
   - TEM's offer was simple: we audit every line, kill the unused ones, put you on the right plan, and you pay per line or a share of what we save.
   - That maps one-to-one to idle Copilot seats, orphaned agents and right-sizing between packs and PAYG.
   - The gain-share precedent (25–50%) makes "we only win if you save" credible.
   - Talk track: *"Remember when everyone had three phone lines nobody used? Unused Copilot seats and forgotten agents are the new version."*

Cloud cost management is the direct technical ancestor, but it is a weaker SMB story: most SMBs never had a large Azure bill, and the published fees are percentage-of-spend models built for enterprise. Use it with partners as proof the model exists; use the three above with buyers.

**What made each simple:**
- one unit the buyer can say aloud (page, kilowatt-hour, line, now credit);
- one predictable monthly number;
- a named person who watches the meter;
- savings you can point to.

These are the four properties the managed consumption service has to copy.

---

**Searched, found nothing usable:**
- a16z: no 2026 piece on consumption pricing for buyers or the channel located.
- ISG: no agentic pricing figures located.
- Canalys/Omdia: no Copilot-specific attach-rate data verified.
- No survey on unused AI pre-purchases.
- No primary SMB-specific AI overrun survey.
