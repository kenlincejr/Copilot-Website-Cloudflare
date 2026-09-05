# 02 — Measurement, the "agent is never done" argument, and its Microsoft backing

**Gathered:** 2026-08-28. Primary source: Microsoft Learn.

## 1. Microsoft has published the outcome formula. This is the biggest single find.

Source: `/microsoft-copilot-studio/guidance/agent-business-value-measure-impact` (ms.date 2026-06-04)

### Four value drivers — with pricing formulas Microsoft itself supplies

| Driver | Measures | Microsoft's pricing formula |
|---|---|---|
| **Efficiency** | Productive hours returned | Hours returned x fully loaded productive-hour value |
| **Quality** | Error reduction, consistency, compliance | (error rate before - after) x volume x cost per error |
| **Revenue** | Retained/expanded/new business | (conversion or deflection delta) x volume x unit revenue x **attribution discount** |
| **Strategic** | Decision velocity, confidence, optionality | option premium + retention value + resilience value |

Note the **attribution discount** in the revenue formula. Microsoft is conceding that
attribution is contestable. A partner writing an outcome-based SOW should copy that discount
into the contract rather than argue about it after the fact.

### Agent Assisted Hours (AAH) — the published formula

**Conversational agents:**
AAH = (Knowledge references + Weighted sessions without knowledge references) x Time savings multiplier / 60

- Each knowledge-source reference counts once.
- Sessions with no knowledge reference are weighted by outcome: **resolved = 1.0, escalated or abandoned = 0.7**.
- **Default time savings multiplier = 6 minutes**, sourced to Microsoft Work Trend Index research.

**Autonomous agents:**
AAH = (Knowledge refs x retrieval savings + Action time savings + Successful sessions without actions x generic savings) / 60

**Agent Assisted Value = AAH x hourly rate.** **Default hourly rate = $72**, sourced to
US BLS Employer Costs for Employee Compensation. The rate is customisable in the report calculator.

Microsoft's published worked example: 10,000 engaged sessions/month → 1,440 hours/month →
$103,680/month, about **$1.24M/year**.

**Partner implication.** The customer can be shown a number that Microsoft computes, using
Microsoft's defaults, in Microsoft's own report. The partner does not have to defend a
home-made ROI model. **Whoever configures the hourly rate and the multipliers owns the outcome
conversation.** That is a service, and it is the anchor of an outcome-based fee.

### Where each metric is read — all of it billable configuration work

- Efficiency → **Copilot Studio Savings calculator** (`analytics-cost-savings`), **Copilot Studio agents report** in Viva Insights
- Quality → **Copilot Studio Analytics**, **Copilot Agent Kit rubrics**
- Revenue → **Copilot business impact report** (Viva Insights)
- Strategic → **Copilot Studio custom metrics**, **Viva Glint Copilot Impact Survey**

WARNING: several of these live in **Viva Insights advanced/analyst** templates — a licensing
dependency to verify for SMB tenants. Logged as an open tenant test.

### Leading vs lagging indicators
Microsoft's own table pairs one of each per value driver, reviewed **quarterly**. That cadence
is exactly what a managed AgentOps contract sells.

### Three named failure patterns — excellent session content

1. **"Measurement that stops at pilot"** — instrumentation is strong in pilot, then drifts in production.
2. **"Activity that doesn't tie to outcomes"** — sessions and user counts show usage, not value.
3. **"The time-savings trap"** — claiming value on theoretical time savings alone
   *"undermines credibility"*. Microsoft's own words. This kills the
   "1.2 hours/week x headcount x salary" slide most of the channel is still presenting.

## 2. "An agent is never done" — Microsoft says so, in four places

**(a) The lifecycle has no terminal state.** Five phases: discovery → experimentation → build
→ deploy → **operational steady state**, defined as *"continuously monitor, evaluate, and
adjust to maintain operability standards as business requirements and underlying technologies
evolve."* There is no "complete" phase.
Source: `/agents/architecture/deployment-lifecycle` (2026-07-06)

**(b) Microsoft prescribes an expansion rhythm, not a finish line.**

> *"Operate an expansion rhythm, treating the program as recurring quarterly work. Pick a new
> high-volume workflow, build or configure the agent, measure against baseline for 90 days,
> review with the sponsor, and decide whether to scale it or retire it."*

A **90-day measurement window + sponsor review + scale-or-retire decision** is a ready-made MRR
contract shape, written by the vendor.

**(c) Responsible AI anti-pattern: "Treating Responsible AI as a one-time review."**

> *"AI systems change over time as prompts, data, and usage patterns evolve. Bias, misuse, and
> trust drift typically appear after go-live, not before."*

Named failure mode: *"panic and switch things off."*
Source: `/agents/adoption-maturity-model/maturity-model-security-governance` (2026-03-31)

**(d) Drift is named in the build guidance.** *"Minimize the time between experimentation and
build phases to reduce the risk of model or data drift affecting agent performance."* And PoC
on synthetic data *"increases the risk of agents not performing as expected in production."*
That is a direct argument against the free-POC-agent much of the channel is giving away.

## 3. The six sources of ageing — draft taxonomy for the session

1. **Data drift** — the grounding corpus ages; content moves, is renamed, is archived.
2. **Model drift** — Microsoft swaps the model beneath the agent. The customer did not consent and cannot roll back.
3. **Connector / API drift** — the agent is only as good as the connector it reaches through, and connectors change.
4. **Permission drift** — the agent's blast radius changes as tenant ACLs change under it.
5. **Process drift** — the business changes the workflow the agent encodes; the agent does not know.
6. **Cost drift** — usage grows or a reasoning model is swapped in and the credit bill moves. At 125% of capacity the agent is switched off with no warning to end users (dossier 01).

## 4. Maturity model — the governance ladder to sell against

Five levels: 100 Initial → 200 Repeatable → 300 Defined → 400 Capable → 500 Efficient, across
governance/security, operations/lifecycle and Responsible AI.

Level-specific anti-patterns, directly usable as session content:

- **100 "Shadow AI proliferation"** — ties straight into `shadowai.html`
- **200 "Governance theater"** — formal process, no risk reduction
- **300 "Operations silos"**
- **400 "Automation complexity"**
- **500 "Innovation stagnation"**

Universal anti-patterns worth quoting:

- *"No inventory and no ownership"* — no registry, no lifecycle status, no accountable owner.
- *"Controls are 'guidance-only' instead of enforceable."*
- *"Treating all agents as the same (no tiered approach by risk and criticality)"* — over-restricts
  productivity agents, driving shadow AI, while under-governing mission-critical ones.
- *"Cost and usage governance is unmanaged"* — spend grows without visibility and governance
  *"can't prioritize what to scale or retire."*

The **zoned governance model** (safe / supported / IT managed environments) appears at level 300
and is a concrete sellable deliverable.

Microsoft's tiering language — **personal productivity / departmental / mission-critical** —
maps onto three managed-service tiers. Check against the three AgentOps tiers already in
`cpb.html` before authoring anything new.
