# 03 — Prerequisites, and the rungs of the conversation

**Gathered:** 2026-08-28. Primary sources: Microsoft Learn unless noted.

## 1. The SMB unlock nobody in the channel has internalised

**You do not need a Microsoft 365 Copilot seat to run an agent engagement.**

- **Copilot Chat** is included at no additional cost for every Entra account on a Microsoft 365
  or Office 365 subscription. Users can consume custom agents built by the organisation
  **on a metered basis**.
  Source: `/microsoft-365/copilot/agent-essentials/agent-prerequisites` (2026-06-17)
- Henry Jammes (Microsoft Copilot Studio CAT, "The Custom Engine" blog, **17 Apr 2026**) states
  the case directly: Copilot Chat is enough; agent usage is *"covered through Copilot Credits,
  not per-user Copilot licensing."* And critically — **as of April 2026 capacity packs can be
  bought without an Azure subscription.**
- **Microsoft 365 Copilot Business — $21/user/month, up to 300 seats per tenant**, since
  1 Dec 2025, on Business Basic / Standard / Premium. This is the SMB SKU. (Verify: aggregator-sourced.)

**Why this matters to the session.** The prevailing channel sequence is *sell Copilot seats →
prove adoption → then talk agents*. That sequence gates the agent conversation behind a $21–$30
per-seat commitment the SMB has not made. The metered path means **an agent engagement can start
in a tenant with zero Copilot seats.** That reorders the whole conversation, and it is a
genuinely non-obvious finding.

Limitations of the Copilot Chat channel (from CAT blog): no conversation-start triggers, no GIF
rendering, some Adaptive Card actions unsupported, no hand-off to a live agent, sessions reset
between conversations. Those are scoping constraints, not blockers.

## 2. Hard prerequisites — the gate list

### Identity and admin
- Roles required: **AI Admin**, Global Admin, or Global Reader (view-only). Microsoft explicitly
  recommends least-privilege over Global Admin.
- Power Platform service admin roles: Power Platform administrator / Dynamics 365 administrator.
- Recommended: **Entra PIM** for JIT activation of AI Administrator and Search Administrator,
  with approval workflow and MFA.

### Platform
- A **Power Platform environment with Dataverse**. Production and sandbox environments only for
  pay-as-you-go — trial/dev environments are not eligible.
- **Managed Environments** required to use pipelines and the managed-environment governance
  controls.
- A **DLP / data policy** separating Business from Non-Business connectors on every environment
  running production agents.
- **Environment strategy** — Microsoft's zoned model at maturity level 300 is
  **safe / supported / IT managed**.

### Data
- SharePoint permissions and oversharing remediation. Microsoft's own readiness framing is
  source scope, permissions, **source authority**, and ownership.
- ⚠ **Documents labelled *Confidential* or *Highly Confidential*, and password-protected files,
  cannot be indexed as knowledge.** They report as "Ready" and then silently return nothing.
  This is a live trap: a customer who has done classification well finds the agent answers
  nothing, with no error.
- ⚠ Without a Microsoft 365 Copilot licence in the same tenant, generative answers only use
  **SharePoint files under 7 MB**. With one, and with tenant graph grounding on, the limit is 200 MB.
  **A licensing decision silently changes what the agent can read.**

### Capacity — the prerequisite everyone skips
Quotas are **per Dataverse environment**, and they scale with how many packs you own:

| Generative AI quota | Tenant billing capability |
|---|---|
| 50 RPM / 1,000 RPH | 1–10 prepaid packs |
| 80 RPM / 1,600 RPH | 11–50 packs |
| 100 RPM / 2,000 RPH | 51–150 packs |
| 10 RPM / 200 RPH | **Trial or developer environments** |
| 100 RPM / 2,000 RPH | PAYG environments, and M365 Copilot users |

Plus 8,000 RPM for messages to an agent. Rate-limit increases: **PAYG environments only**, by
support request, not guaranteed.

**The SMB failure mode is explicit here.** A partner pilots in a dev environment at
**10 RPM / 200 RPH**, it works fine for six testers, and it falls over on launch day. Microsoft's
guidance says it plainly: *estimate peak traffic windows rather than relying on monthly averages.*

### Structural limits worth knowing before scoping
- 500 knowledge sources per agent; **25 SharePoint site URLs max with generative orchestration**
- 8,000 characters of instructions for a Copilot agent
- 1,000 topics/agent, 200 trigger phrases/topic, 100 skills/agent
- SharePoint lists: 15 lists, 35,000 rows across them, first 2,048 rows per query
- Knowledge sync frequency **4–6 hours** — the agent is never reading live data
- ALM is **not supported** for unstructured knowledge sources; importing an agent does not
  carry the knowledge processing. **This breaks the dev→test→prod story and needs saying out loud.**

## 3. The rungs of the conversation — draft ladder

A first pass at the negotiation staircase. Each rung has a thing that must be true before the
next rung is even sayable.

| Rung | The conversation | Must be true first | How the partner earns it |
|---|---|---|---|
| **0. Standing** | "We should look at where your work actually goes." | Partner has tenant access and a track record | Existing MSP relationship, or the shadow-AI audit |
| **1. Visibility** | "Here is what your people are already doing with AI, ungoverned." | Discovery tooling in place | `shadowai.html` owns this rung |
| **2. Readiness** | "Your data is not ready to be read by a machine." | Permissions/oversharing assessment run | Paid assessment; TD SYNNEX/AvePoint offer exists |
| **3. Candidate** | "Here is one high-volume, named workflow worth automating." | A **baseline** captured before any build | Microsoft: *"anchor every agent to a named, high-volume workflow"* |
| **4. Economics** | "Here is what it will cost to run, per month, and who pays for the build burn." | Credit estimate run, per-agent caps configured | The estimator + cap configuration is the deliverable |
| **5. Build** | The SOW | Environment, DLP, capacity, owner all in place | Fixed base + success kicker |
| **6. Steady state** | "It is never done. Here is the retainer." | Instrumentation shipped with the agent | AgentOps MRR |

**The rung most partners skip is 4.** They quote build labour and let the customer discover the
run-rate on a Microsoft invoice. That is the single most relationship-damaging thing in this
whole motion.

## 4. Who pays for the build burn — a SOW clause that does not yet exist

On the **GitHub Copilot harness**, billing *"starts when you start building."* Creating a
solution with natural language, **previewing and testing the agent, and generating and running
evaluations all consume credits** — before anything is published.
Source: `/microsoft-copilot-studio/agents-experience/billing-credit-overview` (2026-08-18)

On the standard harness, billing starts after publish.

So: **on the new harness the partner's own development, testing and QA burn the customer's
credits.** Every SOW needs a clause naming who funds development consumption, and a cap on it.
Nobody in the channel is writing this clause yet. This is the sharpest single piece of
practical content in the whole research set.

## Open items
- [ ] Verify M365 Copilot Business $21/300-seat cap at a Microsoft source
- [ ] Confirm Viva Insights licensing needed for the Copilot Studio agents report in an SMB tenant
- [ ] Confirm whether Agent 365 ($15/user/mo add-on, GA 1 May 2026) is reachable on Business Premium
