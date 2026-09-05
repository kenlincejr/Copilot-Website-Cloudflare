# 00 — Brief and gap analysis: the Copilot Studio outcome-based session

**Authored:** 2026-08-28. Read this first. Dossiers 01–04 hold the evidence.

## 1. The single most important finding is about scope, not content

`cpb.html` **already owns the commercial architecture.** It has:

- an **Outcome-Based Project Work primer** (§ "outcome-based-primer") — definition, why AI
  specifically, the fixed-base-plus-kicker structure, five gates, the worked
  traditional-vs-outcome comparison
- the **Agent Maturity Model** (§9) and the **Revenue Runway to Managed AgentOps** (§10)
- **three AgentOps tiers** (AI Essentials / AI Operations / AI Transformation), **four pricing
  components** (Per-User Base, AgentCare, Credit Wrap, Agent 365), **four monetization models**,
  flat-vs-stacked pricing, per-agent build pricing of $3,500–$8,000+
- the **Partner Monetization Gap** (§12)

**So the new session must not re-author outcome-based pricing or the MRR tiers.** A section that
re-explains kicker pricing is a failed section. `cpb.html` answers *"what do I charge?"*

**The gap is execution depth on Copilot Studio specifically.** The unanswered question is
*"what do I actually do, in what order, with what facts, and what will bite me?"* Every gap
below is Copilot-Studio-shaped and none of it is on the site today.

## 2. The ten gaps — the session's entire scope

1. **Harnesses.** Three of them (GitHub Copilot / standard / Copilot chat), each with different
   capability *and different billing*. A partner who quotes without naming the harness has not
   scoped the work. Nothing on the site mentions harnesses. → 01 §6
2. **Who pays for the build burn.** On the GitHub Copilot harness, billing starts the moment you
   start building — previewing, testing and running evaluations all consume the customer's
   credits before publish. **No SOW in the channel has this clause.** → 03 §4
3. **The credit rate card, correctly.** The channel is repeating wrong numbers (agent action is
   5 credits, not 25) and stale vocabulary ("messages", renamed Sept 2025). → 01 §2
4. **Overage enforcement.** At 125% of prepaid capacity, custom agents are **switched off**.
   Agent-flow enforcement is different and partial. This is an MRR-bearing SLA event. → 01 §4
5. **Capacity and rate limits as a prerequisite.** 50 RPM/1,000 RPH at 1–10 packs; **10 RPM in a
   dev environment**. Pilots pass and launches fail. → 03 §2
6. **The metered path around the Copilot seat.** Copilot Chat + Copilot Credits means an agent
   engagement can begin in a tenant with **zero Copilot seats** — and since April 2026, without
   an Azure subscription. This reorders the standard channel sequence. → 03 §1
7. **The silent data traps.** Confidential / Highly Confidential labelled files cannot be
   indexed and fail silently. 7 MB SharePoint limit without a Copilot licence in-tenant.
   ALM does not carry unstructured knowledge sources. 4–6 hour sync. → 03 §2
8. **Microsoft's published outcome formula.** Agent Assisted Hours, the 6-minute multiplier, the
   $72 default rate, the four value drivers with pricing formulas, and the **attribution
   discount**. The partner does not need a home-made ROI model. → 02 §1
9. **When is the agent done — never, and Microsoft says so.** Operational steady state has no
   exit. The 90-day / sponsor-review / scale-or-retire rhythm. Six sources of ageing. → 02 §2–3
10. **The AgentOps toolchain is free.** The Copilot Agent Kit is a complete governance and
    observability console at zero licence cost, which means the margin is entirely labour and
    judgement. This should change how Tier 2/3 delivery is described. → 04 §4
12. **Agent plumbing is not Copilot plumbing — and it is the first sale.** The no-seat path swaps
    a tenant-wide permissions remediation the SMB cannot license (SAM needs an E-SKU, per
    `control-before-scale` V-06) for scoped agent governance it can. Three settings decide blast
    radius — authentication mode, **maker vs end-user credentials**, sharing scope — all with
    secure defaults a maker can click past. Microsoft's **top-10 agent risks (Feb 2026)** is the
    assessment checklist, and it is invisible to every Copilot readiness report the channel
    sells. → 05
13. **Agent 365 — a licensing change that already happened.** On **1 July 2026** Copilot Studio
    agent discovery, posture, threat detection, real-time protection and Advanced Hunting moved
    behind an Agent 365 licence. Tenants without one lost them. Most of the channel has not
    noticed. Agent 365 is the **escalation, not the entry ticket** — most of what an SMB needs on
    day one is free in the Copilot Agent Kit. → 06
11. **The build is being commoditised, and that is the argument.** Prepackaged agent galleries
    (UnifyCloud CloudAtlas AI Factory) take the partner ~80% of the way. Build labour stops
    being the revenue line; the last mile, the outcome and the ongoing become it — and the last
    mile is every tenant-specific risk in gaps 1–9. **"80% of the way there" is 80% of the
    build, not 80% of the engagement.** → 04 §4

## 3. The three findings that should change what Ken believes

**(a) The Copilot-seat prerequisite is not real.** The whole channel sequences agents behind a
Copilot seat purchase. Microsoft's own CAT team published the opposite in April 2026. If this
holds up in a tenant test it is the most valuable single recommendation the session can make.

**(b) Microsoft has already written the outcome contract.** The four value drivers each come
with a *pricing formula*, and the AAH formula ships with defaults sourced to BLS and to
Microsoft's own research. The outcome-based conversation is no longer a partner invention that
needs defending — it is a Microsoft report whose constants the partner configures. **Whoever
sets the hourly rate and the multipliers owns the renewal.**

**(c) Microsoft has pre-emptively discredited the channel's current pitch.** "The time-savings
trap": claiming value on theoretical time savings alone *undermines credibility*. That is the
1.2-hours-a-week slide most partners are presenting right now. The session can retire it with
a vendor citation rather than an opinion.

## 4. What the research could not establish — say so in the session

- **No verifiable, named SMB Copilot Studio case study with audited outcomes exists.** The vivid
  SMB numbers circulating are marketing blogs with no named customer. → 04 §3
- **No practitioner invoices.** r/msp is hard-blocked to this toolchain, same as SG-4 in
  `specs/control-before-scale.spec.md`. Community price *shapes* are vendor marketing. → 04 §1
- **UnifyCloud CloudAtlas AI Factory** ships prepackaged Copilot Studio agents — a 200-use-case
  gallery with POC generation, plus AI Guardian, AI Policies, PTU Calculator and Solution
  Assessment. Ken's framing: **80% of the way there, partner takes the last mile.** The public
  web under-documents the Copilot Studio specifics and five questions remain open for UnifyCloud
  directly. **AvePoint is not an alternative — it serves rungs 2 and 6 where AI Factory serves
  rung 5.** → 04 §4

## 5. Proposed sign-off gates (for the spec)

| # | Gate | Recommendation |
|---|---|---|
| SG-1 | **Currency policy.** DESIGN.md §8.10 forbids unregistered currency values; this research carries ~15. | Register in `data/facts.json` with source + review date, tagged by provenance: *Microsoft published rate / vendor list price / community-reported shape / editorial model*. Never restate the community shapes as benchmarks. |
| SG-2 | **Relationship to `cpb.html`.** | Session is execution depth, not commercial architecture. Every commercial claim links back rather than restating. One explicit reconciliation note. |
| SG-3 | **The case-study hole.** | State it plainly and turn it into the Customer Zero argument, rather than borrowing unattributed SMB numbers. |
| SG-4 | **UnifyCloud vs AvePoint.** Ken decides from the actual line card. | Research says AvePoint. |

## 6. Proposed tenant tests (Customer Zero shaped)

| # | Test | What it decides |
|---|---|---|
| TT-1 | In a **Business Premium** tenant with **zero Copilot seats**, can you buy Copilot Credit capacity packs (no Azure sub) and publish a working agent to Copilot Chat? | Whether gap 6 — the biggest finding — is real or a doc artefact. Highest value. |
| TT-2 | Build a trivial agent on the **GitHub Copilot harness** and record credits consumed **before publish**. | Puts a real number on the build-burn clause. Turns gap 2 from a warning into a figure. |
| TT-3 | Add a **Confidential**-labelled document as knowledge and ask about it. | Confirms the silent-failure trap and whether any error surfaces. |
| TT-4 | Is the **Copilot Studio agents report** in Viva Insights reachable in an SMB tenant, and can the $72 rate be edited? | Decides whether §8's outcome measurement is executable for SMB or enterprise-only. |
| TT-5 | **Managed Environments licensing.** Do sharing limits and pipelines require Power Apps/Automate Premium for every user, and does a Copilot Studio standalone licence qualify? | Highest-risk unknown on the no-seat path. If premium-per-user is required, Layer 2 of the plumbing has a cost the session must state. → 05 §4 |
| TT-6 | Run **Agent Inventory** against a real SMB tenant. How many agents already exist, and how many use maker credentials, no authentication, or have no owner? | Decides whether the Agent Governance Baseline is a real wedge or a theoretical one. → 05 §5 |
| TT-2b | Inherited from `control-before-scale` TT-2, still open: **Purview / DSPM for AI on Business Premium.** | Layer 5 of the plumbing cannot be asserted for SMB until this is run. |
| TT-7 | **Is Agent 365 purchasable on Business Premium?** Learn hedges ("works best when using Microsoft E5 as a pre-requisite"); aggregators claim an SMB path under 300 seats. Check the CSP price list. | Decides whether the session can recommend Agent 365 to an SMB at all. Exact repeat of the V-06 SAM failure mode if guessed. → 06 §3 |
| TT-8 | **Who needs an Agent 365 licence** — every user who interacts with an agent, every maker, or only governing admins? Get it in writing. | 20x cost spread on the same deployment. The most important number to resolve before quoting. → 06 §3 |
| TT-9 | Does **one** Agent 365 licence enable tenant-wide observe/govern? | If yes, a cheap entry point in the same shape as SAM's one-seat unlock. → 06 §3 |

**A section that depends on an open test ships with the uncertainty stated, or does not ship.**
