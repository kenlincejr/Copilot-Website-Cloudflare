# 01 — Copilot Studio economics, billing and cost management

**Gathered:** 2026-08-28. **Status:** primary sources verified against Microsoft Learn.

## 1. The billing unit changed twice — get the vocabulary right

- Billing currency is now the **Copilot Credit**, not the "message". Microsoft renamed
  messages → Copilot Credits on **1 Sep 2025**. Anything in the channel still saying
  "messages" is pre-Sep-2025 material.
- Pooled **at the tenant**, allocable **per environment**.

## 2. Rate card — verified from Learn (ms.date 2026-08-03)

Source: https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management

| Agent feature | Credits | Free for M365 Copilot–licensed user? |
|---|---|---|
| Classic answer | 1 | Yes |
| Generative answer | 2 | Yes |
| **Agent action** | **5** | Yes (CUA excluded) |
| Tenant graph grounding | 10 | Yes |
| Agent flow actions (per 100) | 13 | Yes, only via "When an agent calls the flow" trigger |
| Text/gen AI tools — basic (per 10 responses) | 1 | Yes |
| Text/gen AI tools — standard | 15 | Yes |
| Text/gen AI tools — premium (reasoning) | 100 | Yes |
| Content processing (per page) | 8 | Yes |
| Classic voice / GenAI voice / Premium GenAI voice (per min) | 10 / 35 / 75 | — |

**⚠ CORRECTION TO CHANNEL FOLKLORE.** Multiple 2026 blog aggregators state "an autonomous
agent action is 25+ credits". Microsoft Learn says **agent action = 5**. The blogs are wrong
or stale. Do not restate the 25 figure.

**Reasoning models bill twice**: feature rate + premium tools rate per 1K tokens. This is the
single biggest silent cost driver and the thing a partner must explain before quoting.

## 3. Price

- Capacity pack: **$200/pack/month for 25,000 Copilot Credits** (= $0.008/credit).
- **Pay-as-you-go** meter, billed in arrears via an **Azure subscription** (a prerequisite —
  see 02).
- **Pre-Purchase Plan**: Copilot Credit Commit Units, **up to 20% saving** for up-front purchase.
- Maker licence is free. **No per-user fee.**
- M365 Copilot at $30/user/mo includes Copilot Chat and the **Standard harness** — B2E usage
  by a licensed user under that user's identity is "no charge", subject to *fair usage limits
  Microsoft reserves the right to change*. **That reservation is a commercial risk to name in a SOW.**

## 4. Overage enforcement — the thing that will burn a partner

- Overage grace up to **125% of prepaid capacity**. At 125%: **custom agents are disabled.**
  In-flight conversations finish; every subsequent invocation is rejected with
  *"This agent is currently unavailable. It has reached its usage limit."*
- Notification: email to the tenant admin + Power Platform admin center post. **The customer's
  users find out by the agent breaking.** This is a managed-service SLA event and belongs in
  the AgentOps contract.
- **Agent flow enforcement is different**: at 100% of capacity new flow runs are *blocked*, but
  the agent keeps answering. Partial failure — harder to detect than a dead agent.
- Escape hatches: reallocate capacity between environments, buy more, or attach PAYG (PAYG
  environments are exempt from enforcement).
- **Per-agent monthly caps** can be set: PPAC → Licensing → Copilot Studio → Manage Agents.
  This is the cost-control lever the partner should configure on day one.

## 5. Calculators

- **Official**: Copilot Credit Estimator — https://microsoft.github.io/copilot-studio-estimator/
  (Microsoft-owned GitHub Pages). Inputs: agent type, traffic, orchestration, knowledge, tools.
  Exports a PDF for procurement. Microsoft's own disclaimer says *do not use as a pricing
  calculator or for definite forecasts*.
- Learn doc: /microsoft-copilot-studio/agent-usage-estimator
- Microsoft **FastTrack** repo: `microsoft/FastTrack/copilot-agent-strategy/copilot-agents-cost-tool`
- Community: cps-budget-guide.github.io; bradlaw76 cost calculator v1.3.5.1
- Actuals: PPAC → Licensing → Copilot Studio → Environments → Copilot credit consumption
  details; plus /microsoft-copilot-studio/analytics-consumption.

**Playbook angle:** estimate → cap → monitor → true-up is a four-step recurring service, not
a one-time quote. Microsoft's own disclaimer is the partner's argument for a monthly
reconciliation retainer.

## 6. Harnesses — new in 2026, changes the whole quote

Source: https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview (2026-07-28)

A *harness* is the runtime between the agent and the model. Three of them:

| | GitHub Copilot harness | Standard harness | Copilot chat harness |
|---|---|---|---|
| For | Complex multi-step processes | Rule-based agents/flows | Extending M365 Copilot Chat |
| Behaviour | Plans, retries, alternative paths | Follows authored topics | Knowledge grounding only |
| Files | Creates/edits Word, Excel, PPT, PDF | No | No |
| Skills + memory | Yes | No | No |
| Publish to | Internal or external | Internal or external | Internal only |
| Billing | Separate model (billing-credit-overview) | Credits per rate card above | Consumption or included in M365 Copilot |

**This is the fork that decides the price of the engagement.** "Build me an agent" on the
Copilot chat harness is a knowledge-grounding job; on the GitHub Copilot harness it is a
process-automation job with a different billing meter. A partner who quotes without naming
the harness has not scoped the work.

## Open items
- [ ] Verify GitHub Copilot harness billing model (agents-experience/billing-credit-overview)
- [ ] Confirm whether Business Premium tenants can attach PAYG (Azure sub requirement)
- [ ] Confirm current M365 Copilot list price and E7/Agent 365 interaction
