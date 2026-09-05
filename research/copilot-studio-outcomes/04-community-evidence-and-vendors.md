# 04 — Community evidence, the SMB case-study problem, and third-party vendors

**Gathered:** 2026-08-28.

## 1. What the community is actually doing — honest read

### The channel is moving, but on pricing it is stuck

- **a competing distributor launched an Agent Store (June 2026)** letting partners package, deliver and monetise AI
  through existing a competing distributor systems. Agent monetisation was the headline theme of a distributor conference 2026.
  (ChannelPro coverage.)
- **ChannelE2E's own framing, Aug 2026: *"AI-native is the new pitch. MSPs are still working out
  the pricing."*** and *"MSPs are all in on AI. The revenue still hasn't followed."* That is the
  most honest summary of the state of the channel available, and it is the session's opening.
- The named structural problem: **providers bill a flat monthly fee while their own AI cost is
  usage-based** — prompts, automated actions, and how long an agent runs in the background all
  move the cost of delivery. Flat-fee MRR over a metered cost base is a margin trap. This is the
  thing the session must solve, not celebrate.

### Emerging price shapes in the wild (community-reported, NOT verified)

Treat these as *shapes*, not benchmarks. Sourced from AI-agency pricing blogs, not invoices.

- **Agent Licensing Model**: setup fee + monthly "agent licence" covering maintenance, API cost
  fluctuation and model upgrades. Reported ~$20K setup + ~$2K/month.
- **Hybrid retainer**: fixed core for AI-ops monitoring and maintenance, plus variable per new
  workflow built. Reported ~$4K/month core.
- **Risk premium**: a reported 15–20% uplift held back against model drift and token spikes.

⚠ **PROVENANCE WARNING.** These numbers come from marketing blogs by AI agencies selling the
model. No practitioner invoices were located. Reddit r/msp is hard-blocked to this toolchain —
the same gap flagged as SG-4 in `specs/control-before-scale.spec.md`. **Either a human reads
those threads, or the session states plainly that its pricing evidence is vendor list prices
and survey data, not practitioner invoices.** Do not launder these into benchmarks.

### Channel economics — Partner Economics 2026 forecast
- **41%** of MSP revenue growth now attributed to AI-related services vs **~33%** from traditional seat growth
- Conservative three-year scenario: legacy services billings **−30%**, human-delivered support revenue **−60%**
- Proprietary IP and vertical solutions = the **#1 stated partner priority for 2026**
- Microsoft raised AI incentives ~**50%** and Azure outcome-based incentives ~**70%** YoY
- McKinsey benchmark: about **a quarter of its global fees** now tied to client outcomes
- ⚠ The source states no sample size or methodology. Cite as a forecast, not a measurement.

## 2. The failure evidence — this is the honest spine of "an agent is never done"

- **Gartner (25 Jun 2025): over 40% of agentic AI projects will be cancelled by end of 2027**,
  due to escalating costs, unclear business value, or inadequate risk controls. Gartner also
  names **"agent washing"** and estimates only ~130 of thousands of agentic vendors are real.
  From a Jan 2025 poll of 3,412 webinar attendees: 19% significant investment, 42% conservative,
  8% none, 31% wait-and-see/unsure.
- **Copilot credit billing shock is a documented, live community grievance.** GitHub community
  discussion #198015: **374 upvotes, 92 comments, 107 participants**, June–Aug 2026. Reported
  cases include a Pro+ monthly allocation exhausted in two days, 52% of monthly tokens in one
  day, and ~$700 of tokens over four days building a website. Core complaint: *no cost preview
  before a task runs.* Visual Studio Magazine ran it twice (4 Jun 2026, 7 Aug 2026).
  ⚠ **This is GitHub Copilot credits, an adjacent product, not Copilot Studio credits.** Do not
  conflate them in the session. It is legitimate as evidence of *how customers react to opaque
  metered AI billing* — which is exactly the risk a Copilot Studio agent carries.

**The three findings compose into the session's argument:** Gartner says 40% get cancelled on
cost and unclear value; Microsoft says measurement stops at pilot and time-savings claims
undermine credibility; the community shows what happens when metered AI billing surprises
someone. The partner's job — and the MRR — is to be the layer that prevents all three.

## 3. The SMB case-study problem — state it, do not paper over it

**No verifiable, named SMB Copilot Studio case study with audited outcome numbers was located.**

What exists:
- **Microsoft's own** "Ask Microsoft" web agent: up to **61% lower latency, up to 70% fewer human
  escalations**. Real, published, and an enterprise self-reference — not an SMB proof point.
- Microsoft Learn maintains `guidance/adoption-case-studies` — worth a human read for SMB-sized examples.
- **Forrester TEI: 116% ROI (enterprise) to 353% (SMB) over three years** for M365 Copilot, and
  ~1.2 hours/week saved per user from Microsoft telemetry. ⚠ Commissioned TEI study, composite
  organisation — and it is **M365 Copilot, not Copilot Studio agents**.
- The vivid SMB numbers circulating (boutique retailer −67% tickets, solo CPA +9 hrs/week,
  cleaning franchise missed leads 38%→9%) trace to **marketing blogs with no named customer**.
  **Do not use them.** They are exactly the "time-savings trap" Microsoft warns about.

**Recommendation: make this a feature of the session, not a hole in it.** The honest line is:
*"There is no audited SMB case study yet. That is why you instrument the baseline before you
build — because you are going to be the case study."* That is more persuasive to a sceptical
partner than a borrowed number, and it is consistent with the Customer Zero posture already in
the site.

## 4. Third-party and distributor-adjacent vendors

### AvePoint — the strongest fit, and already a TD SYNNEX motion
- **AgentPulse** — AI agent management and governance: discovery and inventory, shared
  governance, business context, policy enforcement, **cost insights**, platform-neutral.
- **Backup and recovery for Copilot Studio agents** — AvePoint claims first-to-market. An agent
  you can roll back is a materially different risk conversation, and directly serves the
  "never done" thesis: versioning a living asset.
- **Elements Edition** — multi-tenant security and lifecycle management **built for MSP partners**.
- **Already joint with TD SYNNEX**: the TD SYNNEX + AvePoint **Copilot Readiness Assessment**,
  a five-week tenant analysis. That is rung 2 of the ladder, already resellable.

### UnifyCloud — CloudAtlas AI Factory (corrected 2026-08-28, per Ken + product screenshot)

My first pass searched the wrong product line and reported CloudPilot (migration code analysis).
Wrong. **The relevant product is CloudAtlas AI Factory**, and it ships prepackaged Copilot Studio
agents.

**Ken's characterisation, which is the authoritative statement here:** UnifyCloud provides
prepackaged Copilot Studio agents that get the partner **~80% of the way to a solution**; the
partner takes it **the last mile**.

**Confirmed from the product UI (screenshot) and vendor material:**
- **AI Use Case Gallery** — **200** use cases in the live product (vendor marketing says 250+),
  each with **Case Study / Demo / Proof of Concept** actions and a **"Consumed POC"** state
- Filter by **Industry** — Financial Services 36, Human Resources 22, Manufacturing & Resources 16,
  Health 14, **Small and Midsize Business 14**, Professional Services 14, Technology–IT 12, Retail
- Filter by **Solution Area** — **Conversational AI 77**, Data Analysis & Insights 32,
  Customer Support 17, Knowledge Management 17, Employee Onboarding 14, Entity Extraction 10,
  Process Automation 9
- Adjacent modules in the same console: **Custom POC**, **AI Policies**, **AI Guardian**
  (responsible-AI: model bias evaluation, security, compliance), **PTU Calculator**,
  **CloudAtlas Solution Assessment**
- Vendor claims: POCs built **in days**, four phases (workshop/use-case selection → POC → pilot →
  production), **600+ AI POC engagements** of prior experience, supports Generative AI, Agentic AI,
  Fabric **and Copilot agents**
- UnifyCloud is a Microsoft Solutions Partner (Infrastructure, Digital & App Innovation, Data & AI)
  and a five-consecutive-year Partner of the Year honouree
- Listed on Microsoft Marketplace / AppSource as `unify-cloud-llc.ca-aifactory`

⚠ **The public web under-documents the Copilot Studio agent specifics.** The unifycloud.com AI
Factory page does not mention Copilot Studio agent generation at all; the marketplace listing is
403 to this toolchain. **The 80%-and-last-mile framing is Ken's, from the line card, and is not
publicly corroborated.** Questions to put to UnifyCloud directly before the session cites any of it:

1. Which harness do the packaged agents target — standard, Copilot chat, or GitHub Copilot?
   This determines the billing model and whether build burn hits the customer (dossier 03 §4).
2. How are packaged agents delivered — solution import, template, or managed deployment? Does
   ALM carry the knowledge sources, or does the documented unstructured-knowledge ALM gap apply?
3. **When UnifyCloud updates a gallery template, what happens to a deployed instance?**
   This is the versioning question the whole "never done" thesis turns on.
4. Does the gallery agent arrive instrumented — is there a baseline and a measurement surface,
   or does the partner add that?
5. Commercial shape for partners: per-POC, subscription, or bundled with an assessment?

### Why the 80/20 model matters more than it looks — the strategic read

**A productised 80% collapses build labour as a revenue line.** The $3,500–$8,000 per-agent build
price in `cpb.html` is under direct pressure from exactly this kind of gallery. That is not a
threat to the playbook's thesis — **it is the strongest argument for it.** You cannot bill hours
for work a gallery did. What is left to charge for is the last mile, the outcome, and the ongoing.

**And the last mile is precisely where every risk in this research lives.** None of it is
transferable, because all of it is tenant-specific:

- the customer's SharePoint permissions and oversharing state
- sensitivity labels that make knowledge silently unreadable (dossier 03 §2)
- harness selection and its billing consequence
- capacity, rate limits and the dev-environment 10 RPM trap
- credit run-rate estimation, per-agent caps, overage enforcement
- the baseline, the instrumentation, and who configures the $72 rate (dossier 02 §1)
- the process the agent encodes, and who owns it when it changes

**The gallery gets you a working demo. The last mile is what makes it survive contact with the
customer's tenant, and what keeps it alive afterwards.** That is a clean, honest articulation of
where partner value sits once the build is commoditised — and it is a better session argument
than anything I had before this correction.

**Two cautions to carry into the session:**

- **A prepackaged agent inherits drift on day one.** It was built against someone else's data,
  process and permissions model. Every one of the six ageing sources (dossier 02 §3) starts
  running the moment it lands, and question 3 above — template updates versus deployed instances —
  is unresolved.
- **Speed cuts both ways.** Microsoft's own guidance warns that PoC on synthetic or non-representative
  data *"increases the risk of agents not performing as expected in production."* A POC in days is
  a genuine advantage for winning the room, and a genuine trap if that POC becomes the production
  agent without being regrounded in the customer's real data. **"80% of the way there" is 80% of
  the build, not 80% of the engagement.** Worth saying in those words.

### AvePoint — still relevant, different slot
AvePoint is not the alternative to UnifyCloud; it sits at a different point on the ladder.
UnifyCloud AI Factory accelerates **rung 5 (build)**. AvePoint AgentPulse serves **rung 2
(readiness)** and **rung 6 (steady state)**. They compose rather than compete.

### Microsoft's own tooling — free, and it changes where the margin is
The **Copilot Agent Kit** (Power CAT, free, open source) is effectively a ready-built AgentOps
console:
- **Agent Inventory** — tenant-wide registry of every custom agent, its features, auth mode, knowledge sources
- **Compliance Hub** — policy evaluation at scale with configurable thresholds, risk levels,
  **SLA timers** and enforcement actions (manual review, **quarantine**, delete)
- **Agent Insights Hub** — aggregated telemetry from App Insights + transcripts
- **Agent Review Tool** — scans for anti-patterns affecting performance or security
- **Agent Debugger**, **Conversation Analyzer**, **Conversation KPIs**, **Rubrics refinement**
  (evaluation standards tuned to agree with human judgement), **Agent Value** dashboard
- **Power Shield** — approval workflow for connector access in DLP policy
- **Automated test + deploy via Power Platform Pipelines**

**Strategic read: the tooling is free, so the margin is entirely in the labour and the judgement.**
A partner who says "we license a governance platform" is beaten by one who says "we run the
Compliance Hub, we set the thresholds, we own the SLA timer." Also note the kit's own
prerequisites: Dataverse, system administrator role, and premium-connector licensing.

### Microsoft partner funding
- **ECIF** — $10K for PoC workshops up to six figures for large engagements; partner submits a
  SOW per customer engagement for Microsoft to review against eligibility.
  ⚠ **An Advanced Specialization is the gate**, which excludes most partners. Do not present
  ECIF as generally available.
- **Copilot and Agents at Work** engagements — refreshed agent-focused engagement packages
  from envisioning through scaled deployment.
- Agent 365 and M365 E7 added as **Tier 1 qualifying keywords** in Modern Work CSP incentives.

## Sources
Microsoft Learn (multiple, cited inline in dossiers 01–03) · The Custom Engine blog (Power CAT) ·
Gartner press release 2025-06-25 · GitHub community discussion #198015 · Visual Studio Magazine
2026-06-04 and 2026-08-07 · partnereconomics.com 2026 channel forecast · ChannelE2E ·
ChannelPro (a distributor conference 2026) · avepoint.com · unifycloud.com · news.tdsynnex.com
