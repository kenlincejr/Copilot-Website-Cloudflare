# 05 — The plumbing: what must be addressed before building Studio agents

**Gathered:** 2026-08-28. Written in answer to: *if the Copilot seat isn't required, what governance
still is?*

## 1. The central insight: agent plumbing is not Copilot plumbing

This is the section that makes the "no Copilot seat needed" finding safe to publish.

**Copilot readiness** is a *tenant-wide data* problem. Microsoft 365 Copilot grounds on the whole
tenant graph, so every oversharing defect anywhere in the tenant becomes reachable the moment a
seat is assigned. That is why the channel's readiness playbook is SharePoint Advanced Management,
Data Access Governance reports, EEEU cleanup, Restricted Access Control.

**And `control-before-scale` V-06 established that path does not execute in most SMB tenants.**
SAM requires an Office 365 / Microsoft 365 **E-SKU base**. Business Premium does not qualify.

**Agent readiness is a different problem with a different admin surface.** An agent's blast radius
is not the tenant graph — it is **what the maker explicitly pointed it at, who it acts as, and who
can reach it.** Those are Power Platform and Copilot Studio controls, and **none of them require
an E-SKU base.**

### The reconciliation, stated plainly

> The no-seat path does not remove the plumbing. It **swaps** it — trading a tenant-wide
> permissions remediation the SMB cannot license for a scoped agent-governance job it can.

And there is a structural reason the swap works, not just a licensing coincidence:

**Without a Microsoft 365 Copilot licence in the tenant, tenant graph grounding is not on the
table.** The agent reads only the knowledge sources a maker explicitly attached — capped at
**25 SharePoint site URLs** under generative orchestration, files **under 7 MB**. That is a
containment architecture by default. The metered path is *less capable and narrower* than the
licensed path, and the narrowness is the safety property.

**Do not overstate this.** With end-user credentials the agent still resolves the signed-in user's
SharePoint permissions, so a genuinely overshared site inside those 25 remains reachable by anyone
who could already reach it. What shrinks is the *amplification* problem — Copilot surfacing things
a user could technically open but would never have found. It shrinks from tenant-wide to 25 named
sites. **Reduced, not eliminated.** The honest line is: *you still assess the sources you ground
in — but you assess 25 sites, not 40,000.*

## 2. The three settings that decide the blast radius

Every one has a secure default. Every one can be flipped by a maker. Every one triggers a security
scan warning the maker can click straight past.
Source: `/microsoft-copilot-studio/security-scan`

| Setting | Secure default | The dangerous value | What happens |
|---|---|---|---|
| **Authentication mode** | Authenticate with Microsoft (Entra ID) | **No authentication** | Anyone with the link can chat with the agent |
| **Credentials to use** | **End user credentials** | **Maker-provided credentials** | *Every user gets the maker's permissions.* Privilege escalation by design |
| **Sharing scope** | Shared with no one | Shared with everyone in the organisation | No access boundary |

**"Maker-provided credentials" is the single most dangerous setting in Copilot Studio.** The agent
runs with elevated permissions for every invoker, permanently, and the only friction is a warning
at publish time. If a partner audits one thing before touching anything else, it is this.

**This is the agent-era equivalent of an open SharePoint site — and it is invisible to every
Copilot readiness report the channel currently sells.** DAG reports do not see it. SAM does not
see it. It lives in Power Platform.

## 3. Microsoft's own top-10 agent risks — the assessment checklist, pre-written

Microsoft Security Blog, **12 Feb 2026**. This is the readiness checklist for agents, published by
Microsoft, and there is no equivalent asset on the site today.

| # | Misconfiguration | Consequence |
|---|---|---|
| 1 | Overly broad agent sharing | Unintended access, expanded attack surface |
| 2 | Agents without authentication | Public exposure, data leakage |
| 3 | Risky HTTP request actions | Bypasses connector validation, throttling, identity controls |
| 4 | Email-based data exfiltration | Prompt injection turns an email action into an exfil channel |
| 5 | **Dormant agents and components** | Stale privileged access nobody is watching |
| 6 | **Maker (author) authentication** | Privilege escalation, separation-of-duties bypass |
| 7 | Hardcoded credentials | Secrets outside enterprise rotation, visible in agent definitions |
| 8 | Unreviewed MCP tools | Undocumented access paths |
| 9 | Generative orchestration without instructions | Behaviour drift, unintended actions |
| 10 | **Orphaned agents (no active owner)** | Escapes review cycles entirely |

Detection: **Community Hunting Queries in the Advanced Hunting portal's AI Agents folder**,
plus Power Platform Inventory, quarantine, and data policies.

**Note items 5 and 10.** *Dormant* and *orphaned* agents are ageing failures, not build failures —
they cannot be prevented at build time, only caught by a recurring operational review. They are
the strongest available proof that the agent is never done, and they come from Microsoft's
security organisation rather than its marketing.

## 4. The prerequisite stack, in dependency order

### Layer 1 — Who can make an agent at all
The default Power Platform environment is open to every licensed user. Before anything else:
- Restrict environment creation; decide who gets a maker role
- Establish the **zoned environment model** — *safe / supported / IT managed* (maturity level 300)
- Production agents never live in the default environment

### Layer 2 — What an agent can connect to
- **Power Platform DLP / data policy** separating Business from Non-Business connectors. This is
  the agent's actual safety boundary, and Microsoft's maturity model names failing to treat it as
  one an anti-pattern.
- Restrict raw **HTTP actions** (risk 3) and **MCP tools** (risk 8) by policy
- **Power Shield** in the Copilot Agent Kit gives makers an approval workflow to request connector
  access rather than being silently blocked — the difference between governance that enables and
  governance that gets bypassed
- ⚠ **Managed Environments** — needed for sharing limits (risk 1) and pipelines — is gated on
  every user holding **Power Apps Premium / Power Automate Premium / Power Pages / qualifying
  Dynamics 365**. There is no standalone Managed Environments SKU. **This is a real SMB cost and
  it is the most likely wall on this path.** Open item — verify against the Power Platform
  Licensing Guide (August 2026) and whether a Copilot Studio standalone licence qualifies.

### Layer 3 — Who the agent acts as
- End-user credentials, not maker credentials (risk 6)
- Authentication on (risk 2)
- **Entra Agent ID** for autonomous agents — an agent with its own identity is a new principal in
  the tenant, subject to Conditional Access, identity governance and entitlement management
- **Entra PIM** for JIT activation of AI Administrator and Search Administrator

### Layer 4 — What it can read
- Scope the 25 sites deliberately; assess *those* for oversharing rather than the tenant
- **Source authority** — is this content approved and current? Microsoft names it alongside
  permissions as a readiness dimension, and it is the one nobody checks
- Sensitivity labels: **Confidential / Highly Confidential and password-protected files cannot be
  indexed and fail silently.** In an agent context this behaves as a *control* — labelling is a
  cheap way to hold content out of an agent, and it works on Business Premium

### Layer 5 — What is recorded
Purview treats agents as auditable entities alongside users and apps:
- Audit covers **agent-to-human, human-to-agent, agent-to-tools and agent-to-agent** interactions
- Prompts and responses land in a hidden folder in the user's Exchange Online mailbox, searchable
  and holdable via **eDiscovery**
- Retention/deletion policies apply to AI prompts and outputs
- **DSPM for AI** gives a unified view across Copilot Studio, M365 Copilot, Security Copilot and
  enterprise AI apps; a June 2026 Data Lifecycle Management capability adds policy recommendations
- ⚠ **What of this is reachable on Business Premium is still unverified.** This is the same
  unresolved question as `control-before-scale` **TT-2**. Do not assert Purview coverage for an
  SMB tenant until someone runs it.

### Layer 6 — Who owns it, and who notices when it rots
- **Agent Inventory** (Copilot Agent Kit, free) — tenant-wide registry: features used, auth mode,
  knowledge sources
- Named accountable owner per agent — risks 5 and 10 are unfixable without it
- **Compliance Hub** — thresholds, risk levels, SLA timers, and enforcement up to quarantine/delete
- **Agent Review Tool** — anti-pattern scan
- Recurring review cadence. This layer *is* the AgentOps retainer.

## 5. What this means commercially — the plumbing is the first sale

The partner does not walk in and build. The sequence is:

1. **Agent Governance Baseline** *(fixed fee, days not weeks)* — run Agent Inventory across the
   tenant, check every existing agent against Microsoft's top-10, and report. In most SMB tenants
   there are already agents nobody inventoried, made in Copilot Chat and Teams. **This finds
   maker-credential and no-auth agents that no Copilot readiness report would ever surface.**
2. **Environment and policy build** *(fixed fee)* — zoned environments, DLP/connector policy,
   maker roles, PIM on AI Administrator, authentication enforcement.
3. **Source assessment, scoped** *(fixed fee)* — the 25 sites, not the tenant. Permissions,
   labels, and **source authority**.
4. *Then* the agent build.
5. **AgentOps retainer** — because 5 and 10 on the top-10 list only appear over time.

**Step 1 is the wedge, and it is a better wedge than the Copilot readiness assessment**, because
it works in a Business Premium tenant where SAM does not, it finds live security defects rather
than theoretical exposure, and it does not require the customer to have bought anything first.

## 6. Two open items that gate publication

- **TT-5 (new): Managed Environments licensing.** If sharing limits and pipelines require premium
  per-user licences across the tenant, Layer 2 has a cost the session must state. Highest-risk
  unknown on this path.
- **TT-2 (inherited from `control-before-scale`, still open): Purview/DSPM for AI on Business
  Premium.** Layer 5 cannot be asserted for SMB until this is run.

**A section that depends on an open test ships with the uncertainty stated, or does not ship.**
