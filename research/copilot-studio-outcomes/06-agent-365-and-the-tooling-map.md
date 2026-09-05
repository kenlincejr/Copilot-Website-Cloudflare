# 06 — Agent 365: is it worth covering, what else does the job, and how to position it for SMB

**Gathered:** 2026-08-28. Answers three questions: cover it or not, alternatives, SMB positioning.

## 1. Yes — and there is an urgent reason, not just a completeness reason

**Effective 1 July 2026, AI agent security capabilities for Copilot Studio and Foundry agents
require a Microsoft Agent 365 licence.** They are no longer covered by Defender for Cloud Apps
or Defender for Cloud. *"Tenants without an Agent 365-eligible license lose access to these
capabilities on July 1, 2026."*

Source: `/defender-xdr/security-for-ai/transition-agent-security-to-agent-365` (ms.date 2026-06-02,
updated 2026-07-01)

**That date has passed.** This is not a roadmap item — it is a change that already happened,
eight weeks ago, and most of the channel has not noticed.

### What tenants without Agent 365 lost on 1 July

- Copilot Studio **agent discovery and posture**
- Copilot Studio **agent threat detection and real-time protection**
- **Investigation of agent activity in Advanced Hunting**
- Foundry agent discovery, posture and threat protection
- Third-party cloud agent discovery via Defender for Cloud connectors
- Tenants set to **Block** on Agent 365 real-time protection rules **stopped blocking on 1 July**
  unless rules were redefined under the new policy experience

Also: the `AIAgentsInfo` Advanced Hunting table is deprecated in favour of **`AgentsInfo`**, and the
**AI Agents sub-tab under Cloud Assets was removed for all customers.**

### ⚠ Correction to my own dossier 05

Dossier 05 §3 cites Microsoft's **top-10 agent risks blog (12 Feb 2026)** and its recommended
detection method — **Community Hunting Queries in the Advanced Hunting AI Agents folder.**
**As of 1 July 2026 that detection path requires Agent 365.** Microsoft published the risk list in
February and licensed the detection for it in July. The checklist is still free to read; running it
Microsoft's way is not.

One nuance to preserve rather than flatten: the transition doc also states *"Real-time protection
for Microsoft Copilot Studio through Defender for Cloud Apps remains unchanged for tenants that
continue using this experience."* That sits awkwardly beside the headline. **Treat the exact
boundary as unresolved and say so** — do not let the session assert a clean line Microsoft has not
drawn.

## 2. What Agent 365 actually is

Three pillars — **Observe, Govern, Secure**. Source: `/microsoft-agent-365/overview` (2026-08-19)

- **Observe** — the **agent registry** (single centralised inventory), **agent map**, adoption,
  activity and health; role-specific views for security and business leaders
- **Govern** — lifecycle, access control and compliance via the M365 admin center registry, Entra
  and Purview
- **Secure** — Entra risk-based access for users *and agents acting on their behalf*, Purview
  information protection/DLP, Defender threat detection and real-time protection

**In the M365 admin center Agent workload** the operationally interesting parts are:
- Hero metrics: **agent registry count, active users, agent run-time (total hours worked by agents
  over 30 days), registry sync**
- Governance cards: **pending agent requests, agents at risk, agents without owners, agents with
  exceptions**
- Agent analytics: agents by creator (your org / third party / Microsoft), top build platforms,
  active users over time, trending agents
- Coverage across Copilot Studio, Agent Builder, SharePoint, Agents Toolkit, Foundry, and
  **non-Microsoft platforms such as Manus or Genspark** via registry sync
- **Draft agents are currently visible only from Copilot Studio**

Note two things that map straight onto earlier findings: **"agents without owners"** is top-10 risk
#10, and **"agent run-time"** is a native measure of the thing the AAH formula prices. Microsoft
built dashboard cards for the exact failure modes dossier 02 and 05 identified.

**Governance actions require AI Administrator or Global Administrator.** Other roles can see gaps
but cannot act.

## 3. Pricing and the SMB prerequisite — where the real ambiguity is

- **GA 1 May 2026**, Commercial segment, **per user**
- **$15/user/month** standalone; included in **Microsoft 365 E7 ($99/user/month)** alongside E5,
  Copilot and Entra Suite
- **Admin-led trial: 25 seats for 30 days**, with a banner in the admin center and purchase
  directly from it
- *"At least one user must be licensed with a qualifying Microsoft Agent 365 license to enable
  Agent 365."*

### The prerequisite question — genuinely unresolved

**Microsoft Learn says:** *"Microsoft Agent 365 works best when using Microsoft E5 as a
pre-requisite."* That is soft, hedged language, not a requirement statement.

**Aggregators say:** the SMB path is **Microsoft 365 Business Premium** for tenants under 300
seats, with some sources adding Defender and Purview suites for SMB on top.

⚠ **These are not the same claim and the difference decides whether this session can recommend
Agent 365 to an SMB at all.** No Microsoft page reviewed states a Business Premium path in those
words. **This is the exact failure mode `control-before-scale` V-06/V-07 caught with SAM** — two
dossiers reading one hedged licensing page in opposite directions. Do not repeat it. New tenant
test below.

### The commercial risk that matters more than the price

**Who counts as a "user"?** Vendor-neutral licensing analysts flag this as unresolved in public
guidance: every user in the tenant, every user who can *create* agents, or only the governance
team? A single licence *"covers all agents that person interacts with, manages, owns, or
sponsors."*

**Read that literally and it is dangerous for SMB.** If a 60-person company deploys one helpdesk
agent everybody chats with, "interacts with" plausibly means 60 licences — **$900/month for
governance on top of the credits for running it.** If it means only the governing admins, it is
three licences and $45/month. **That is a 20x spread on the same deployment**, and the partner
who quotes the wrong one loses the deal or eats the difference.

**This is the single most important thing a partner must resolve before quoting**, and the honest
answer today is "confirm in writing with your distributor or Microsoft before you put it in a SOW."
That is genuinely useful advice and nobody is giving it.

Related, and worth stating plainly: **Agent 365 governs agents. It does not build them and it does
not run them.** Copilot Studio credits are a separate meter on a separate invoice. Three billing
mechanics — per-seat Copilot, per-seat Agent 365, consumption credits — arrive at the customer's
finance team at different times in different formats.

## 4. What else does the same work — the overlap map

This is the part a partner cannot easily assemble alone.

| Job | Agent 365 | Free / included alternative | Third party |
|---|---|---|---|
| **Tenant-wide agent inventory** | Agent registry (M365 admin center) — broadest coverage incl. non-Microsoft platforms | **Copilot Agent Kit → Agent Inventory** (free, Power CAT) — Copilot Studio agents only; **Power Platform Inventory** | AvePoint **AgentPulse** — platform-neutral discovery and inventory |
| **Ownerless / dormant agent detection** | "Agents without owners" card, rules-based lifecycle enforcement | Copilot Agent Kit Agent Inventory + manual review; Power Platform Inventory | AgentPulse lifecycle management |
| **Config risk / anti-pattern scan** | Agents-at-risk, aggregated from Entra, Defender and Purview | **Copilot Agent Kit → Agent Review Tool** (free); Copilot Studio **automatic security scan** at publish | AgentPulse policy enforcement |
| **Policy enforcement + SLA + quarantine** | Rules-based lifecycle policy, approval flow, blocking | **Copilot Agent Kit → Compliance Hub** (free) — thresholds, risk levels, **SLA timers**, quarantine/delete | AgentPulse |
| **Connector / DLP boundary** | Purview + Entra integration | **Power Platform DLP data policies** (no Agent 365 needed); **Power Shield** in the Kit | — |
| **Threat detection, real-time protection, Advanced Hunting** | **Agent 365 only, since 1 July 2026** | **No free equivalent.** This is the genuine gap | Third-party CASB/XDR, out of scope for most SMB |
| **Runtime analytics / telemetry** | Agent run-time, active users, trending agents | **Copilot Agent Kit → Agent Insights Hub** (free, App Insights + transcripts); Copilot Studio Analytics | AgentPulse cost insights |
| **Debugging a bad conversation** | — | **Copilot Agent Kit → Agent Debugger** (free) — step-by-step decisions, timing, token usage | — |
| **Backup / rollback of an agent** | Not offered | Solutions + Power Platform pipelines (partial) | **AvePoint — backup and recovery for Copilot Studio agents**, claimed first-to-market |
| **Business value measurement** | Agent run-time hours | **Copilot Studio agents report** (Viva Insights), Savings calculator, **Agent Value** in the Kit | — |

### The conclusion that matters

**Most of what an SMB actually needs on day one is free.** Inventory, anti-pattern scanning,
compliance policy with SLA timers, debugging, analytics and value measurement are all in the
**Copilot Agent Kit** at zero licence cost, plus Power Platform DLP.

**What is genuinely Agent 365-only is threat detection, real-time protection and Advanced Hunting
over agent activity** — the security-operations layer. Everything else has a free or third-party
substitute.

**So Agent 365 is not the entry ticket. It is the escalation.** A partner who tells an SMB they
need $15/user before they can govern a single agent is wrong, and is pricing themselves out of the
first engagement.

## 5. How the partner positions Agent 365 for SMB

**Do not lead with it.** Lead with the free Agent Governance Baseline (dossier 05 §5) — Agent
Inventory, Agent Review Tool, the top-10 checklist, Power Platform DLP. That runs in a Business
Premium tenant at no licence cost and finds real defects. It earns the right to the next
conversation.

**Then position Agent 365 on one of four honest triggers, not as a default:**

1. **Agent count crosses the point where a human cannot track them.** The registry stops being a
   spreadsheet job. Ownerless and dormant agents (top-10 risks #5 and #10) are the tell.
2. **An agent gets autonomy or its own identity.** Once an agent acts on its own rather than as a
   signed-in user, it is a new principal in the tenant and Entra-backed identity governance stops
   being optional.
3. **Agents appear from platforms the partner does not control** — SharePoint agents, Agent
   Builder, or non-Microsoft platforms. **Registry sync is the only thing that sees across all of
   them**, and the Copilot Agent Kit does not.
4. **The customer has a regulatory or contractual obligation** that requires detection and
   response over agent activity, not just configuration hygiene. Post-1-July, that is Agent 365
   or nothing.

**The trial is the sales mechanic: 25 seats, 30 days, admin-led, purchasable from the banner.**
That is a natural paid discovery engagement — run the registry across the tenant, produce the
findings, and let the trial expiry force the decision. **Do not let it lapse silently**; a trial
that ends with nobody watching is worse than never running it.

**And say the quiet part:** the free Copilot Agent Kit path exists today, but the 1 July transition
is evidence of direction of travel. Microsoft published a risk list in February and licensed its
detection method in July. **Assume more of this surface becomes licensed over time, and design the
managed service so the labour and judgement are the product — because those are the parts that do
not get absorbed into a SKU.** That reinforces the dossier 04 §4 conclusion from a second direction.

## 6. Where this lands against `cpb.html`

`cpb.html` already carries **Agent 365 as one of four pricing components** in the AgentOps stack.
This dossier does not change that architecture — it supplies the **qualification logic** that was
missing: *when* the Agent 365 dial gets turned on, and what to use before it does.

## Open items — both gate publication

| # | Test | Why it matters |
|---|---|---|
| **TT-7** | **Is Agent 365 actually purchasable on Business Premium?** Learn hedges with "works best when using Microsoft E5 as a pre-requisite"; aggregators claim a Business Premium SMB path under 300 seats. Check the CSP price list / distributor catalogue. | Decides whether the session can recommend Agent 365 to an SMB at all. Exact repeat of the V-06 SAM failure mode if guessed. |
| **TT-8** | **Who needs a licence?** Every user who interacts with an agent, every maker, or only governing admins? Get it in writing. | 20x cost spread on the same deployment. The single most important number to resolve before quoting. |
| **TT-9** | Does **one** Agent 365 licence light up tenant-wide observe/govern, given *"at least one user must be licensed… to enable Agent 365"*? | If yes, there is a cheap entry point — the same shape as SAM's one-seat unlock. Would be a significant finding. |
