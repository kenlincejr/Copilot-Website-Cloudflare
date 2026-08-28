# specs/agent-never-done.spec.md

**Target file:** `agent-never-done.html` — **new file**, 15 sections
**Also produces:** `assets/agent-never-done/*` · `data/facts.json` additions · `tools/speccheck.py` PAIRS entry
**Branch:** `feature/agent-never-done`
**Authored:** 2026-08-28
**Depends on:** [`DESIGN.md`](../DESIGN.md) §1–§4, §8, §8b · `research/copilot-studio-outcomes/00`–`06`
**Blocked by:** SG-5 only (anchor ids in `cpb.html` §10.5, its own spec, its own chat). SG-1 and SG-2 are closed — see §2.

---

## Why

Partners gravitate to building an agent because it is project-shaped and fits a SOW. That instinct
is about to stop paying, for three reasons the research established:

1. **The Copilot-seat prerequisite most of the channel assumes is not real.** Microsoft's Copilot
   Studio CAT team published in April 2026 that Copilot Chat plus metered Copilot Credits is enough,
   and that capacity packs no longer require an Azure subscription.
2. **The build is being commoditised.** Prebuilt agent galleries — UnifyCloud CloudAtlas AI Factory,
   on the TD SYNNEX line card and resellable today — take a partner most of the way to a working
   agent. Build labour stops being the revenue line.
3. **The agent is never done, and Microsoft says so in four places**, including a published
   90-day / sponsor-review / scale-or-retire rhythm that is a recurring-revenue contract shape
   written by the vendor.

`cpb.html` already owns the **commercial architecture** — the outcome-based primer, the three
AgentOps tiers, AgentCare, Credit Wrap, the Agent 365 dial. `cpbops.html#s4` owns the **delivery
worklist** — five phases, build pricing, the AgentOps Runbook, QBIC. Neither answers *"what are the
best practices, which tools already exist, what does this look like in a real use case, and how do
I earn recurring revenue after the project work is done?"*

That is this page. **It is not a SOW and it is not a pricing model.** It is practice guidance
pointing at tooling that already exists.

**Evidence base:** `research/copilot-studio-outcomes/00`–`06`.
[`00-brief-and-gap-analysis.md`](../research/copilot-studio-outcomes/00-brief-and-gap-analysis.md)
§2 lists the thirteen gaps that are this page's entire scope.

---

## 1. What this page is

**Title:** The Agent Is Never Done
**Eyebrow:** Partner Field Guide · Copilot Studio
**Standfirst:** What has to be true before you build a Copilot Studio agent, which tools already
exist to do the work, and where the recurring revenue lives once the build is finished.

One artefact, three jobs:

- **The bible** — sections 1–13. Read alone at a desk.
- **The room** — section 14. Run of show, reusing the `coworksession40.html` `id="stop-N"` convention.
  Room artefacts are **extracts of Part C figures**. Nothing is authored twice.
- **The register** — section 15. What could not be verified, plus the reference library.

Fifteen sections, level with `control-before-scale`.

### The scope firewall — the single biggest failure mode

**A section that re-explains kicker pricing, the three AgentOps tiers, the four pricing components,
or the five delivery phases is a failed section.** Link, never restate.

| Ground | Owner | Link target |
|---|---|---|
| The term AgentOps | `cpb.html` | `#section-00-agentops` |
| Outcome-based pricing, kicker, five gates | `cpb.html` | `#outcome-based-primer`, `#primer-beat-1`…`#primer-beat-5` |
| Six-stage partner capability ladder | `cpb.html` | `#9-the-agent-maturity-model-a-staircase-to-frontier-partner` |
| Three tiers · four pricing components · four models | `cpb.html` | `#10-the-revenue-runway-from-first-deployment-to-managed-agentops` |
| Monetization gap vs other vendors | `cpb.html` | `#12-the-competitive-battle-card-and-the-monetization-gap` |
| Five delivery phases, ALM environment strategy, golden prompt test set, build pricing, AgentOps Runbook, QBIC | `cpbops.html` | `#s4` |
| Discovery-led opening, app matrix | `shadowai.html` | — |
| Partner roles, minimum viable team, what is subcontractable | `control-before-scale.html` | `#section-12` |
| The five-phase build worklist, its week ranges and deliverables | `cpbops.html` | `#s4` — **durations may be reconciled and linked; nothing else** |
| Tenant-wide oversharing, SAM licence wall | `control-before-scale.html` | (not yet on disk — see out of scope) |

**House rule for every collision:** one sentence of orientation, an `a.docref` link, then the new
material. `DESIGN.md` §8b.2 — every named section is a live link to an anchor that exists.

---

## 2. Sign-off gates

| # | Gate | Status |
|---|---|---|
| **SG-1** | **Currency posture.** | **CLOSED — minimal currency.** Ken: *"we don't need to be that granular… we're not writing a SOW."* Consumption is expressed in **Copilot Credits**, which are not currency and need no fact ID. Currency appears **only** where a Microsoft list price makes a positioning point that cannot be made otherwise, and where a Microsoft-published formula ships a default constant. **Target: fewer than ten currency values on the page.** Every one registers in `data/facts.json` and carries `.prov`. See PART D. |
| **SG-2** | **Naming UnifyCloud on a TD SYNNEX property.** | **CLOSED — name it.** Ken confirms CloudAtlas AI Factory is on the TD SYNNEX line card and resellable. Framing is Ken's: *an option for partners who want to get to market quickly with a prebuilt solution, letting a vendor take the heavy lifting; the TD SYNNEX rep helps with that conversation.* **The point is that options like this exist** — the page is not a UnifyCloud advertisement. §12 works one gallery use case end-to-end and shows what the partner must still do. AvePoint is named separately at a different rung. |
| **SG-3** | **The case-study hole.** No verifiable named SMB Copilot Studio case study with audited outcomes exists. | **Recommendation:** state it plainly in §15 and turn it into the Customer Zero argument. Do **not** use the circulating SMB numbers (67% ticket reduction, CPA +9 hrs/week) — they trace to marketing blogs with no named customer. Laundering those into benchmarks is the exact failure `research/control-before-scale/03` caught two vendors committing. |
| **SG-4** | **The `$8.45` services multiplier is attributed differently in two places** — `cpb.html` §10 says "Microsoft and Forrester", `frontier.html#section-10` says "IDC #US52483124". | **Recommendation:** this page does not restate the multiplier at all. Do not introduce a third attribution. Flagged for a separate fact-delta spec. |
| **SG-5** | **Anchor ids inside `cpb.html` §10.5.** The three-tiers / four-components block has no `id`; §13 and §11 need to link into it. | **Recommendation:** yes — its own small spec, its own chat, landing **before Part B**. `DESIGN.md` §8.9 is one file per execution chat. **Until it lands, link `#10-the-revenue-runway-from-first-deployment-to-managed-agentops` and do not invent an anchor.** |
| **SG-6** | **Where the page starts.** Does it open with the problem, or with the picture of a good engagement? | **CLOSED — open with the picture.** Ken: *"start the doc by framing what good looks like… then we build the sections of the rest of the document to fill in the details on each of those phases."* B-00 is §1; B-01's diagnosis of the SOW instinct moves to §2, where it now reads against a standard the reader has already seen. |
| **SG-7** | **How many staircases the page carries.** B-00's arc, B-04's six rungs, and `cpb.html` §9's capability ladder made three. | **CLOSED — one.** Ken chose *timeline absorbs the rungs*. **B-04 is deleted**; its outbound links, its scope-firewall job and its "rung 4 is the one partners skip" claim all move into B-00. Sections 5–15 keep their original numbers. |
| **SG-8** | **Duration, and “who delivers.”** Both collide — `cpbops.html#s4` publishes week ranges, `control-before-scale.html#section-12` owns roles. | **CLOSED — own durations, deliver by party.** Ken chose *own the whole arc's durations* (recorded as a signed-off exception in B-00, durations only) and *who delivers = by party*, not by role, so §12 is linked rather than restated. |

---

## 3. Tenant tests — stated, not blocking

Ken's decision: **ship with uncertainty stated.** The build proceeds. Every section resting on an
open test carries a `.unver` marker naming what is unknown and what would settle it.

| # | Test | Gates | Status |
|---|---|---|---|
| **TT-1** | Business Premium tenant, **zero Copilot seats** — buy Copilot Credit capacity packs with no Azure subscription and publish a working agent to Copilot Chat. | **B-02**, the page's central claim | ⬜ untested |
| **TT-2** | Build a trivial agent on the **GitHub Copilot harness**; record credits consumed **before publish**. | B-08 | ⬜ untested |
| **TT-3** | Add a **Confidential**-labelled document as knowledge; ask about it. Does any error surface? | B-07 traps | ⬜ untested |
| **TT-4** | Is the **Copilot Studio agents report** reachable in an SMB tenant, and is the default hourly rate editable? | **B-09**, the measurement argument | ⬜ untested |
| **TT-5** | **Managed Environments licensing** — do sharing limits and pipelines require Power Apps/Automate Premium per user? Does a Copilot Studio standalone licence qualify? | B-07 layer 2 | ⬜ untested |
| **TT-6** | Run **Agent Inventory** against a real SMB tenant. How many agents already exist; how many use maker credentials, no auth, or have no owner? | **B-06**, the wedge | ⬜ untested |
| **TT-7** | Is **Agent 365 purchasable on Business Premium**? Learn hedges (*"works best when using Microsoft E5 as a pre-requisite"*); aggregators claim an SMB path under 300 seats. | **B-11** | ⬜ untested |
| **TT-8** | **Who needs an Agent 365 licence** — every user who interacts, every maker, or only governing admins? | **B-11** | ⬜ untested |
| **TT-9** | Does **one** Agent 365 licence enable tenant-wide observe/govern? | B-11 | ⬜ untested |

**TT-1, TT-7 and TT-8 are the three that could repeat the SAM error** — `control-before-scale`
V-06/V-07, where two dossiers read one hedged licensing page in opposite directions. Sections
resting on them get the most explicit markers on the page.

> **A section that depends on an open test ships with the uncertainty stated, or does not ship.
> It does not ship with a guess.**

---

## Execution prompt

> Hand this verbatim to each execution chat.
>
> - Parts run in order: **A → B → C → D**. Each part is its own chat (`DESIGN.md` §8.9). Part B is
>   section-by-section; **do not write more than three sections per chat.**
> - The page is a **new file** and carries its own `<style>` block. Every token comes from
>   `DESIGN.md` §1/§2/§4. Introduce no colour, font-family, font-size, radius or shadow that is not
>   on those lists. No webfont.
> - **No `max-width` on any run of prose** (`DESIGN.md` §8b.1). Narrow the container, never the sentence.
> - **Every reference to another document or section is a link** (`DESIGN.md` §8b.2) to an anchor
>   that exists in the target. If the anchor does not exist, do not invent it — report it.
> - **This page is practice guidance, not a SOW and not a pricing model.** Consumption is expressed
>   in Copilot Credits. Currency is rare and deliberate: **every currency figure carries a fact ID
>   registered in `data/facts.json` and a `.prov` class in markup.** A currency value with no fact ID
>   is a failed execution. **Never restate a service price from `cpb.html`** — those are frozen
>   (§8.10).
> - Where a section covers ground `cpb.html`, `cpbops.html` or `shadowai.html` holds: one sentence
>   of orientation, an `a.docref` link, then the new material. **Never restate.**
> - Prefer naming a **tool that already exists** over describing a process. This page's job is to
>   stop partners searching the internet.
> - Commit per section; message = section ID + one line.
> - Report: sections written, claims that could not be sourced and were cut, actual diff stat.

---

## Summary

| Part | Scope | Output | Risk |
|---|---|---|---|
| **A** | Skeleton, `<style>`, masthead, TOC, section shells, class declarations | 1 file | LOW |
| **B** | The fifteen sections | prose + tables | **HIGH** — the whole argument |
| **C** | Six inline SVG figures | SVG | MEDIUM |
| **D** | Fact registration + `.prov` markup pass | `data/facts.json` | MEDIUM — gates SG-1 |

---
---

# PART A · Skeleton

Build the empty page: head, style block, masthead, TOC, fifteen `<h2>` shells with
`.back-to-toc` + `<hr>` after each. **No section prose.**

### A.1 Head

Copy the `copilot-adoption-audit.html` head bar — it is the current standard and the older pages
are inconsistent:

- Microsoft Clarity IIFE (tag `wsoe1tf6sb`), Google gtag (`G-SGXEJKC80P`), and the Cloudflare
  Web Analytics beacon before `</body>` (token `2cbc3a172bb74e7b883296aaddf17a34`)
- `charset`, `viewport`, `title`
- `description`, `<link rel="canonical" href="https://copilotplaybook.com/agent-never-done.html">`
- `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`
- `twitter:card` (`summary`), `twitter:title`, `twitter:description`
- **No favicon** — the repo has none. **No webfont** — the repo loads none.

### A.2 Body and masthead

```
body { max-width:1160px; margin:0 auto; padding:32px 28px; line-height:1.7; background:#fff; }
.mh-bar   { margin: -32px -28px 0; }
.masthead { margin: 0 -28px 24px; }
.mh-bar-in, .masthead-inner { padding-left:28px; padding-right:28px; }
```

**C14 masthead copied byte-for-byte from `coworksession40.html`**, including the 1,208-character
TD SYNNEX SVG path. Rules that are not negotiable (`DESIGN.md` §3 C14, `specs/header-system.spec.md`):

1. `.mh-bar` is a **direct child of `<body>`**, immediately followed by `.masthead`. Nested in any
   wrapper, `position:sticky` releases.
2. Negative margins match body padding exactly. Larger produces a horizontal scrollbar; smaller
   leaves a white gutter.
3. **`[id] { scroll-margin-top: 58px; }` ships with the block.** Without it every back-to-TOC link
   lands 46px under the pinned bar.
4. **The `@media print` override is not optional** — hides `.mh-bar`, flattens `.masthead` to white
   with a teal bottom border, restores navy `h1`.
5. The SVG is the TD SYNNEX mark, copied verbatim, inside the `<a>`. Do not substitute a glyph.

Breadcrumb: `index.html` → `Copilot Studio` → current page. `.masthead-inner` at `1320px`.

### A.3 Section shells and TOC

- `id="section-N"` on every `<h2>`, N = 1…15. Heading text uses the `N. Title` separator (majority
  convention). `<h3>` sub-headings carry no ids.
- `.back-to-toc` then `<hr>` after every section.
- `<nav id="toc">` with the two-column `counter-reset` list. TOC link text is **shortened** relative
  to the `<h2>` and **omits the leading number** — the CSS counter supplies it.
- `@media (max-width: 720px) { .toc ul { columns: 1; } }`

### A.4 Class declaration table

This is how a new file legally satisfies `DESIGN.md` §8.2. **Define every class below in this page's
own `<style>` block in Part A, before any prose exists.**

| Class | Role | Modelled on |
|---|---|---|
| `.prov` + `prov-ms` / `prov-range` / `prov-survey` / `prov-model` | Provenance tag on a currency figure | new; `control-before-scale.spec.md` PART D |
| `.unver` | Open-tenant-test marker — names what is unknown and what would settle it | new; `.callout warn` palette |
| `.trap` | Silent-failure callout — the thing that reports success and returns nothing | new; `.callout warn` palette, distinct icon treatment |
| `.rung` / `.rungs` | The conversation staircase | `coworksession40.html` `.rungs`/`.rung` |
| `a.docref` | Cross-reference link style | **currently defined only in `cowork-calculator.html`** — define it here |

**Reused from the `DESIGN.md` §3 catalog** — do not redefine, copy the definitions:
`.callout` (+ `subtle` / `warn` / `dark`), `.tablewrap`, `.stat-ribbon`, `.compare-grid`,
`.grid`/`.card`, `.tier-ladder`/`.tier-card`, `.checklist`, `.dodont`, `.flowmap`/`.flowmap-cap`,
`.reslist-group`/`.reslist-item`, `.stop`/`.stop-rail`/`.stop-head`/`.beat`/`.segue`, `blockquote`,
`.tag`, `.section-eyebrow`.

⚠ **`.beat` collision.** This page uses the **`coworksession40.html` facilitation meaning**
(`.beat.say` / `.beat.show` / `.beat.tool`). The `copilot-adoption-audit.html` `.beatbar` cell
component is **not used**. Do not import it.

### A.5 Conventions

- HTML entities throughout: `&mdash; &ndash; &middot; &ldquo; &rdquo; &lsquo; &rsquo; &nbsp; &rarr; &uarr;`
- External links: `target="_blank" rel="noopener"`. Same-site links: neither.
- Banner comment box before each section, matching `coworksession40.html`.

**Register in `index.html` and `sitemap.xml` — as its own change, after Part B lands.**
**Add `("specs/agent-never-done.spec.md", "agent-never-done.html")` to `PAIRS` in `tools/speccheck.py`.**

---
---

# PART B · The fifteen sections

Each row states what the section **owns**, its **evidence**, and what it **must not do**.
Gap IDs refer to [`00-brief-and-gap-analysis.md`](../research/copilot-studio-outcomes/00-brief-and-gap-analysis.md) §2.

### B-ID → section number

*Amended 2026-08-28.* **B-IDs are stable evidence labels and do not renumber.** The page opens
with the engagement arc (**B-00**), which **absorbed B-04**; B-04 no longer exists. Sections 5–15
are unchanged from the original numbering — only the first four moved.

| Section | B-ID | Title |
|---:|---|---|
| 1 | **B-00** | What Good Looks Like — the Engagement End to End |
| 2 | B-01 | The Engagement Partners Think They're Selling |
| 3 | B-02 | The Seat You Don't Need |
| 4 | B-03 | Agent Plumbing Is Not Copilot Plumbing |
| 5 | B-05 | Choose the Harness |
| 6 | B-06 | The Agent Governance Baseline |
| 7 | B-07 | What Must Be True Before You Build |
| 8 | B-08 | The Consumption Model, and How You Manage It |
| 9 | B-09 | Measuring It |
| 10 | B-10 | The Agent Is Never Done |
| 11 | B-11 | Agent 365 — the Escalation, Not the Entry Ticket |
| 12 | B-12 | Buying the First 80% |
| 13 | B-13 | The Toolchain Register |
| 14 | B-14 | The Room |
| 15 | B-15 | What We Could Not Verify, and References |

The **B-02 → B-03 adjacency is preserved** as sections 3 → 4.

---

### B-01 · The engagement partners think they're selling · *gap 1*

**Owns** the opening: the SOW instinct, and the three ways it breaks.

1. **Projects die on cost and unclear value.** Gartner, 25 Jun 2025 — over 40% of agentic AI
   projects cancelled by end of 2027 on escalating cost, unclear business value, or inadequate risk
   controls. Also names *"agent washing."*
2. **Measurement stops at pilot.** Microsoft's own words. Carry the forward reference to B-09.
3. **The margin trap.** Flat-fee MRR over a usage-based cost base. ChannelE2E, Aug 2026:
   *"AI-native is the new pitch. MSPs are still working out the pricing."* **This is the page's
   spine — B-08 resolves it.** Say so here.

**Must not:** open with shadow-AI statistics — `shadowai.html` owns that. Re-argue outcome-based
pricing — link `cpb.html#outcome-based-primer`. Conflate the GitHub Copilot credits revolt with
Copilot Studio credits; if cited, it is **an adjacent product**, flagged as such, used only as
evidence of how customers react to opaque metered billing.

---

### B-02 · The seat you don't need · *gap 6* · **depends on TT-1**

**Owns** the page's central claim. Microsoft Copilot Chat is included with M365/O365 subscriptions
and users can consume custom agents **on a metered basis**. Henry Jammes (Microsoft Copilot Studio
CAT, *The Custom Engine*, 17 Apr 2026): Copilot Chat is enough, agent usage is covered through
Copilot Credits not per-user licensing, and **since April 2026 capacity packs can be bought without
an Azure subscription.**

**Carries the price of the unlock in the same section** — this is not an unqualified win:
- Copilot Chat channel limits: no conversation-start triggers, no hand-off to a live agent, sessions
  reset between conversations, some Adaptive Card actions unsupported.
- **Without a Copilot licence in tenant, generative answers use SharePoint files under 7 MB only**;
  with one, and tenant graph grounding on, 200 MB. **A licensing decision silently changes what the
  agent can read.**

Ships a `.unver` marker on **TT-1**.

**Must not:** present this as free. It is metered, and B-08 explains the meter.

---

### B-03 · Agent plumbing is not Copilot plumbing · *gap 12*

**The safety proof for B-02. The B-02 → B-03 adjacency is fixed and must not be broken.**

**Owns** the reconciliation with `control-before-scale`. Copilot readiness is a **tenant-wide data**
problem — Copilot grounds on the whole tenant graph, so every oversharing defect becomes reachable;
hence SAM, DAG reports, EEEU cleanup. And `control-before-scale` V-06 established **that path does
not execute in most SMB tenants** — SAM requires an E-SKU base and Business Premium does not qualify.

An agent's blast radius is different: **what the maker pointed it at, who it acts as, who can reach
it.** Power Platform and Copilot Studio controls. **None require an E-SKU.**

> The no-seat path does not remove the plumbing. It **swaps** it — trading a tenant-wide permissions
> remediation the SMB cannot license for a scoped agent-governance job it can.

Structural reason it works: no Copilot licence means no tenant graph grounding, so the agent reads
only explicitly attached sources — **capped at 25 SharePoint site URLs under generative
orchestration.** You assess 25 sites, not 40,000.

**Must not overstate.** With end-user credentials the agent still resolves the signed-in user's
permissions, so a genuinely overshared site inside those 25 stays reachable by whoever could already
reach it. What shrinks is *amplification* — Copilot surfacing what a user could open but would never
have found. **Reduced, not eliminated.** State this in the section, not in a footnote.

---

### B-00 · What good looks like — the engagement end to end · **§1** · *absorbs B-04* · **depends on TT-6**

**Ken's directive, 2026-08-28:** *"start the doc by framing what good looks like — what's a successful
engagement look like from beginning to end, first conversation to ongoing managed AgentOps. Then we
build the sections of the rest of the document to fill in the details on each of those phases."*

**This is the page's map, its scope-firewall device, and the artefact partners photograph.** Every
later section refers back as *"this is phase N"* rather than restating. It replaces the six
conversation rungs that were B-04 — **the arc is the ladder.** There is now one staircase on this
page, not two.

**Seven phases**, keyed to the rung ladder in
[`03-prerequisites-and-the-rungs.md`](../research/copilot-studio-outcomes/03-prerequisites-and-the-rungs.md) §3
so the research spine is preserved. Six columns, and **the last four are the ones no sibling
document carries**:

| Column | Content |
|---|---|
| **Phase** | Name and rung number |
| **Duration** | Real elapsed time — see the duration exception below |
| **Who delivers** | **By party**, not by role — partner, distributor, prebuilt-agent vendor, Microsoft, or the customer's named owner |
| **Paper** | None / fixed-fee assessment / SOW / retainer. **Shape only — never a price.** |
| **Licensing** | What must be true in the tenant at that phase, and what must be bought |
| **Detail in** | A live link to the section that details it |

**Owns** the claim that **phase 4 — economics — is the phase partners skip**, quoting build labour
and letting the customer discover the run rate on a Microsoft invoice. This is the sharpest single
claim in the research set and it is why economics is drawn as its own phase rather than folded into
the build: **it gates the quote.**

**Owns** the observation that the arc's first two phases (**standing/visibility** and the **agent
governance baseline**) sit entirely ahead of the paper cpbops describes, and are billable. A partner
whose engagement starts at "Discover" has given away the wedge.

⚠ **The opening paragraph carries two reconciliations, not one.** Without both, this is the third
ladder on the site and reads as a rewrite:

1. Against [`cpb.html#9-the-agent-maturity-model-a-staircase-to-frontier-partner`](../cpb.html) —
   that is a **partner capability** staircase; this is **one customer's engagement**.
2. Against [`cpbops.html#s4`](../cpbops.html) — that is the **five-phase build worklist**
   (Discover → Design → Build & Test → Deploy & Train → AgentOps), an internal delivery
   instrument that **starts at the build**. This arc is wider at both ends: it adds qualification and
   the governance baseline ahead of Discover, and it carries the credit-management layer cpbops has
   no concept of. **State the relationship; do not re-cut cpbops' phases.**

#### ⭐ Signed-off exception — durations

*Ken, 2026-08-28: "own the whole arc's durations."* This page publishes elapsed time for all seven
phases. For the build-side phases the week ranges are **reconciled to `cpbops.html#s4` and
attributed to it by link** — Weeks 1–2, 2–4, 4–8 simple / 4–14 complex, 8–10. This is a
**deliberate, recorded exception** to the never-restate rule, granted because a timeline without
elapsed time does not answer the question the section exists to answer. **It extends to durations
only.** It does not extend to prices, partner hours, pass rates, or deliverable lists — and note
that `cpbops.html#s4` carries the `>90%` golden-prompt pass rate that `OPS-DELTA.md` A1 has already
corrected to **80–90%**. Do not import it in either form.

#### What must not appear

- **No currency.** Not one figure. The Paper column names the *shape* of the commercial instrument
  and links `cpb.html#10-the-revenue-runway-from-first-deployment-to-managed-agentops` for the rates.
  Every service price in `cpb.html` is frozen (`DESIGN.md` §8.10).
- **No partner roles.** *Ken, 2026-08-28: who delivers is "by party."*
  [`control-before-scale.html#section-12`](../control-before-scale.html) owns roles, the minimum
  viable team and what is subcontractable. Link it once; do not restate it.
- **No AgentOps tier names or pricing components** — `cpb.html` owns those.

**Outbound links, one per phase** — phase 0 → [`shadowai.html`](../shadowai.html); phase 1 →
`#section-6` and [`control-before-scale.html#section-6`](../control-before-scale.html) for the
contrast; phases 5–6 → `cpb.html#10-…` and `cpbops.html#s4`.

Figure **C-1** — now the timeline, not the rung staircase.

**Harbor & Vane does not appear here.** The vignettes stay at §8 and §10. This section carries the
arc in the abstract so it reads as a standard, not as one customer's story.

`.unver` on **TT-6** — phase 1's finding volume is the thing an unrun Agent Inventory cannot predict.

---

### B-05 · Choose the harness · *gap 1*

**Owns** the concept outright — the word **appears once on the entire site** today.

A *harness* is the runtime between the agent and the model. Three of them, each with different
capability **and a different billing model**:

| | GitHub Copilot | Standard | Copilot chat |
|---|---|---|---|
| For | Complex multi-step processes | Rule-based agents and flows | Extending M365 Copilot Chat |
| Behaviour | Plans, retries, alternative paths | Follows authored topics | Knowledge grounding |
| Files | Creates/edits Word, Excel, PPT, PDF | No | No |
| Skills + memory | Yes | No | No |
| Publish | Internal or external | Internal or external | Internal only |
| Billing | Usage-based, **starts at build** | Credits, starts at publish | Consumption or included in M365 Copilot |

**Owns the line:** *a partner who quotes without naming the harness has not scoped the work.*

This section **scopes** the engagement; it does not price it. Everything downstream assumes a
harness has been chosen. Figure **C-3**.

---

### B-06 · The agent governance baseline · *gap 12* · **depends on TT-6**

**The assessment artefact** — what a partner audits in a tenant *before touching anything*.
Distinct from B-07: this is **auditing what exists**, B-07 is **preparing to build**.

**Three settings decide blast radius.** Each has a secure default, each can be flipped by a maker,
each throws a security-scan warning the maker can click straight past:

| Setting | Secure default | Dangerous value | Effect |
|---|---|---|---|
| Authentication mode | Authenticate with Microsoft | **No authentication** | Anyone with the link |
| Credentials to use | End user credentials | **Maker-provided credentials** | Every user inherits the maker's permissions |
| Sharing scope | Shared with no one | Everyone in the organisation | No access boundary |

**Owns:** maker-provided credentials is the agent-era open SharePoint site — permanent privilege
escalation for every invoker — and **it is invisible to every Copilot readiness report the channel
sells.** DAG does not see it. SAM does not see it. It lives in Power Platform.

Then **Microsoft's top-10 agent risks** (Microsoft Security Blog, 12 Feb 2026) as the checklist:
broad sharing · no auth · risky HTTP actions · email exfiltration via prompt injection · **dormant
agents** · maker authentication · hardcoded credentials · unreviewed MCP tools · generative
orchestration without instructions · **orphaned agents**.

⚠ **Carry the Agent 365 correction inline here, not deferred to B-11.** Microsoft published the risk
list in February and licensed its recommended detection path — the Advanced Hunting **AI Agents**
community queries — behind an **Agent 365** licence on **1 July 2026**. Name the **free**
alternative in the same breath: Copilot Agent Kit **Agent Inventory** + **Agent Review Tool**.
Without this, B-06 and B-11 contradict each other across five sections.

**Commercially:** this baseline is the wedge, and a better one than the Copilot readiness assessment
— it runs in a Business Premium tenant where SAM does not, finds live defects rather than
theoretical exposure, and needs the customer to have bought nothing first.

Figure **C-6**. `.unver` on **TT-6**.

---

### B-07 · What must be true before you build · *gaps 5, 7*

**The build prerequisites.** Five layers — Layer 3 (who the agent acts as) belongs to B-06:

1. **Who can make an agent** — restrict environment creation, maker roles, and the **zoned
   environment model (safe / supported / IT managed)**. Present the zoned model as a **named
   sellable deliverable**, not a bullet. Production agents never live in the default environment.
2. **What it can connect to** — Power Platform **DLP / data policy** separating Business from
   Non-Business connectors. This is the agent's actual safety boundary. Restrict raw HTTP actions
   and MCP tools by policy. **Power Shield** (Copilot Agent Kit) gives makers an approval workflow
   rather than a silent block. ⚠ **Managed Environments** — needed for sharing limits and pipelines
   — appears to require Power Apps/Automate Premium per user with no standalone SKU. `.unver` on
   **TT-5**; this is the most likely wall on the no-seat path.
3. **What it can read** — scope the 25 sites deliberately and assess *those*. **Source authority**
   (is this content approved and current?) alongside permissions — the dimension nobody checks.
4. **What is recorded** — Purview treats agents as auditable entities; prompts and responses land in
   a hidden Exchange folder, eDiscovery-searchable; DSPM for AI spans Copilot Studio. `.unver`:
   Business Premium reachability is **the same unresolved question as `control-before-scale` TT-2**.
5. **Who owns it** — named accountable owner per agent. Agent Inventory as the registry.

**The `.trap` component carries the silent failures** — this is the highest-frequency real-world
failure class and it has no home anywhere else on the site:
- **Confidential / Highly Confidential and password-protected files cannot be indexed.** They report
  "Ready" and return nothing. **No error surfaces.** `.unver` on **TT-3**. Note the inverse: this
  makes labelling a **cheap control** for holding content out of an agent, and it works on Business
  Premium.
- **ALM does not carry unstructured knowledge sources** — importing an agent does not carry knowledge
  processing. This breaks the dev→test→prod story and must be said out loud.
- Knowledge sync is **4–6 hours**. The agent is never reading live data.

**The capacity trap:** quotas are per Dataverse environment — **10 RPM / 200 RPH in a trial or
developer environment** versus 50 RPM / 1,000 RPH at 1–10 packs. A pilot passes with six testers and
falls over on launch day. Microsoft's guidance: *estimate peak traffic windows rather than relying on
monthly averages.* Rate-limit increases are PAYG-only, by support request, not guaranteed.

**Must not** restate `cpbops.html#s4` Phase 2's ALM environment strategy — orient in one sentence
and link it.

---

### B-08 · The consumption model, and how you manage it · *gaps 2, 3, 4* · **depends on TT-2**

**This section resolves the margin trap B-01 opened with.** That is its job.

**Get the vocabulary right.** The billing unit is the **Copilot Credit**; Microsoft renamed messages
→ Copilot Credits on **1 Sep 2025**. Anything in the channel still saying "messages" is stale.
Capacity is pooled at the tenant and allocable per environment.

**The rate card, in credits** — verified from Microsoft Learn, `ms.date 2026-08-03`:

| Feature | Credits |
|---|---|
| Classic answer | 1 |
| Generative answer | 2 |
| **Agent action** | **5** |
| Tenant graph grounding | 10 |
| Agent flow actions (per 100) | 13 |
| Content processing (per page) | 8 |
| Text/gen AI tools — basic / standard / premium | 1 / 15 / 100 |

⚠ **Correct the folklore explicitly.** Multiple 2026 blog aggregators state an autonomous agent
action is 25+ credits. **Microsoft Learn says 5.** Say so, and say why it matters: a partner
budgeting on the blog number over-quotes by 5x.

**Reasoning models bill on two meters** — feature rate *plus* premium tools per 1K tokens. The
biggest silent cost driver.

**Overage enforcement is the thing that will burn a partner:**
- **125% of prepaid capacity → custom agents are disabled.** In-flight conversations finish; every
  subsequent invocation is rejected. Notification is an email to the tenant admin and a Power
  Platform admin center post — **the customer's users find out by the agent breaking.**
- **Agent-flow enforcement is different and partial:** at 100%, new flow runs block but the agent
  keeps answering. A partial failure is harder to detect than a dead one.
- **Per-agent monthly caps** in PPAC → Licensing → Copilot Studio → Manage Agents. **The day-one
  control**, and most partners never set it.

**The recurring service — this is the resolution.** Microsoft's own **Copilot Credit Estimator**
carries the disclaimer *"do not use as a pricing calculator or for definite forecasts."* **That
disclaimer is the argument for a monthly reconciliation retainer.** Name the loop:
**estimate → cap → monitor → true-up.** Four steps, recurring, tool-supported — not a one-time quote.
This is what answers a flat-fee-over-metered-cost margin trap.

**The build-burn clause**, kept to a short closing block: on the **GitHub Copilot harness** billing
*starts when you start building* — creating with natural language, previewing, testing, and
generating evaluations all consume credits **before publish**. On the standard harness billing starts
after publish. So on the new harness the partner's own development and QA burn the customer's
credits. **Name the clause and the cap. Name no fee.** `.unver` on **TT-2**.

**Second Harbor & Vane vignette.** Figure **C-4**.

**Must not** restate Credit Wrap or any AgentOps pricing — orient and link `cpb.html#10-…`.

---

### B-09 · Measuring it · *gap 8* · **depends on TT-4**

**Owns** the finding that Microsoft has already published the outcome formula, so the partner does
not have to defend a home-made ROI model.

**Four value drivers, each with Microsoft's own pricing formula:** Efficiency (hours returned ×
fully loaded hourly value) · Quality ((error rate before − after) × volume × cost per error) ·
Revenue (conversion or deflection delta × volume × unit revenue × **attribution discount**) ·
Strategic. **Point at the attribution discount** — Microsoft conceding attribution is contestable.
Copy it into the engagement rather than arguing about it later.

**Agent Assisted Hours**, conversational form:
`AAH = (knowledge references + weighted sessions without knowledge references) × time-savings multiplier ÷ 60`
Sessions with no knowledge reference are weighted **resolved 1.0, escalated or abandoned 0.7**.
Default multiplier **6 minutes**, sourced to Microsoft Work Trend Index research. Agent Assisted
Value = AAH × hourly rate, default sourced to US BLS.

**Owns the line:** *whoever configures the hourly rate and the multipliers owns the renewal
conversation.*

**Microsoft's three named measurement failure patterns — the highest-value 200 words on the page:**
1. *Measurement that stops at pilot* — instrumentation strong in pilot, drifts in production.
2. *Activity that doesn't tie to outcomes* — sessions and user counts are not value.
3. **The time-savings trap** — claiming value on theoretical time savings alone *"undermines
   credibility."* **This retires the 1.2-hours-a-week slide with a vendor citation instead of an
   opinion.** Say that explicitly.

Where each metric is read: Copilot Studio Savings calculator, the Copilot Studio agents report in
Viva Insights, Copilot Studio Analytics, Copilot Agent Kit rubrics, custom metrics. `.unver` on
**TT-4** — several live in Viva Insights advanced/analyst templates and SMB reachability is unverified.

**Placed before the engagement material** because rung 3 requires a baseline captured before any build.

**Must not** restate the Forrester TEI figures incorrectly — `OPS-DELTA.md` A3 corrects them to
**9 hrs/month with a 50% recapture factor**, not 3–4 hrs/week. Simplest: do not cite TEI at all.

---

### B-10 · The agent is never done · *gaps 9, 10*

**The page's title section. Two tables.**

**Table 1 — the six sources of ageing, each with a detection method**, not just a taxonomy:
data drift · **model drift** · connector drift · permission drift · process drift · cost drift.
**Model drift is the sharp one:** Microsoft swaps the model beneath the agent; the customer did not
consent and cannot roll back.

**Table 2 — the failure register.** *Named failure · detection surface · free tool · accountable
owner.* This is the residue of a deleted section and it covers what **neither `cpb.html` nor
`cpbops.html` addresses — both describe activity, neither describes failure detection.** Rows:
the 125% kill (admin email only), partial flow enforcement at 100%, **dormant agents** (top-10 #5),
**orphaned agents** (#10), knowledge rot from the 4–6 hour sync and the ALM gap. Tools column draws
on Agent Inventory, Compliance Hub SLA timers, Agent Review Tool, Agent Debugger.

**Microsoft's own support for the thesis**, four places:
- The lifecycle's fifth phase is **operational steady state**, defined as continuous monitoring and
  adjustment. **There is no "complete" phase.**
- The prescribed **expansion rhythm**: *"treating the program as recurring quarterly work… measure
  against baseline for 90 days, review with the sponsor, and decide whether to scale it or retire
  it."* A recurring-revenue contract shape written by the vendor.
- The Responsible AI anti-pattern *"treating RAI as a one-time review"* — *"bias, misuse, and trust
  drift typically appear after go-live, not before."* Named failure mode: *"panic and switch things off."*
- PoC on synthetic or non-representative data *"increases the risk of agents not performing as
  expected in production"* — a direct argument against the free POC agent.

**Owns the observation** that top-10 risks #5 and #10 are **ageing failures**: they cannot be
prevented at build time, only caught by recurring review — and they come from Microsoft's **security**
organisation, not its marketing.

Also owns the reconciliation of Microsoft's **personal productivity / departmental / mission-critical**
tiering against `cpb.html`'s three AgentOps tiers. One paragraph and a link.

**Third Harbor & Vane vignette.** Figure **C-5**.

**Must not re-derive the retainer argument** — `cpbops.html#s4` already asserts drift as its
structural justification. Orient and link.

---

### B-11 · Agent 365 — the escalation, not the entry ticket · *gap 13* · **depends on TT-7, TT-8, TT-9**

**Owns the urgent finding: a licensing change that already happened.** Effective **1 July 2026**,
Copilot Studio and Foundry agent security capabilities require a **Microsoft Agent 365** licence —
no longer covered by Defender for Cloud Apps or Defender for Cloud. *"Tenants without an Agent
365-eligible license lose access to these capabilities on July 1, 2026."* Lost: agent discovery and
posture, threat detection and real-time protection, Advanced Hunting investigation. `AIAgentsInfo`
deprecated for `AgentsInfo`. **Tenants set to Block stopped blocking on 1 July** unless rules were
redefined.

⚠ **Carry the unresolved boundary, do not flatten it.** The same transition doc says real-time
protection for Copilot Studio *through Defender for Cloud Apps* *"remains unchanged for tenants that
continue using this experience."* That sits awkwardly beside the headline. **State that the exact
boundary is unresolved** rather than drawing a line Microsoft has not.

**The overlap map** — what an SMB needs on day one versus what is genuinely Agent 365 only:
inventory, config risk scan, policy with SLA timers, connector/DLP boundary, runtime analytics,
debugging and value measurement are all **free in the Copilot Agent Kit** plus Power Platform DLP.
**Genuinely Agent 365 only: threat detection, real-time protection, and Advanced Hunting over agent
activity** — the security-operations layer. AvePoint AgentPulse covers the same ground
platform-neutrally and is the only source found for **backup and rollback of a Copilot Studio agent**.

**Owns the positioning:** *Agent 365 is the escalation, not the entry ticket.* A partner who tells an
SMB they need a per-user governance licence before they can govern a single agent is wrong and has
priced themselves out of the first engagement.

**Four honest triggers, not a default:** agent count crosses what a human can track · an agent gets
autonomy or its own identity · agents appear from platforms the partner does not control (**registry
sync is the only thing that sees across all of them**) · a regulatory or contractual obligation
requires detection and response.

**Sales mechanic:** the **25-seat, 30-day admin-led trial**, purchasable from the admin center banner
— a natural paid discovery engagement where expiry forces the decision.

`.unver` on **TT-7** (Business Premium purchasability — Learn hedges *"works best when using
Microsoft E5 as a pre-requisite"* while aggregators claim an SMB path) and **TT-8** (who counts as a
licensed user — the answer moves the same deployment by a large multiple; **advise getting it in
writing from the distributor before it goes in a proposal**).

**Must not** restate the Agent 365 pricing component or its slot in the AgentOps stack — this section
supplies the **qualification logic** `cpb.html` lacks. Orient and link.

---

### B-12 · Buying the first 80% — a prebuilt agent, and the last mile · *gap 11* · **SG-2 closed**

**Ken's framing is the section's frame:** there are options for partners who want to get to market
quickly with a prebuilt solution and let a vendor take the heavy lifting. **The point is that such
options exist and are resellable today** — this is not a vendor advertisement.

**UnifyCloud CloudAtlas AI Factory**, on the **TD SYNNEX line card**: an AI Use Case Gallery of
~200 use cases with Case Study / Demo / Proof of Concept actions per entry, filterable by industry
(including **Small and Midsize Business**) and solution area (**Conversational AI** is the largest
group, then data analysis, customer support, knowledge management, employee onboarding). Adjacent
modules: Custom POC, AI Policies, AI Guardian, PTU Calculator, CloudAtlas Solution Assessment. The
partner's **TD SYNNEX rep supports the conversation.**

**The section's spine is one worked use case, end to end** — pick a gallery use case in the
knowledge-mining or customer-support category, matched to Harbor & Vane's renewal triage workflow.
Two columns:

| What arrives from the gallery | What the partner must still do |
|---|---|
| Working agent pattern, tested logic, demo, POC scaffolding | Everything tenant-specific |

**The last-mile list is the payload**, and every item is already owned by an earlier section — this
section is where they compose:
- The customer's SharePoint permissions and oversharing state → B-03
- Sensitivity labels that make knowledge silently unreadable → B-07
- Harness selection and its billing consequence → B-05, B-08
- Capacity, rate limits, the dev-environment trap → B-07
- Credit run-rate, per-agent caps, overage → B-08
- The baseline and who configures the measurement constants → B-09
- The process the agent encodes, and who owns it when it changes → B-10

**Owns the line:** *the gallery gets you a working demo; the last mile is what makes it survive
contact with the customer's tenant, and what keeps it alive afterwards.* And the compression of it:
**"80% of the way there is 80% of the build, not 80% of the engagement."**

**Two cautions:**
- **A prebuilt agent inherits drift on day one.** It was built against someone else's data, process
  and permissions model. All six ageing sources start running the moment it lands.
- **Speed cuts both ways.** A POC in days wins the room, and is a trap if it becomes the production
  agent without being regrounded in the customer's real data — per Microsoft's own warning in B-10.

**AvePoint** is named here too, at a different rung: AgentPulse serves readiness and steady state
where AI Factory accelerates the build. **They compose; they do not compete.** One sentence.

**Must not:** restate `cpb.html`'s per-agent build price — reference it **by link, never by value**
(§8.10 frozen). Become a battle card — `cpb.html#12-…` owns that. One paragraph of commercial claim;
the rest is the risk inventory.

---

### B-13 · The toolchain register · *Ken's explicit ask*

**Purpose, stated in the section's own opening:** so a partner does not have to search the internet
for this. **Every entry carries a one-line "why it matters." A bare link list is a failed section.**

Use the `.reslist-group` / `.reslist-item` dialect from `coworksession40.html`, grouped:

**Microsoft official — start here**
- `microsoft.github.io/agent-resources` — **Microsoft's own curated hub, 250+ resources.** If a
  partner bookmarks one link, this is it.
- Copilot Studio guidance centre, the agent development lifecycle, the agentic AI adoption maturity
  model, the security and governance maturity model, ALM strategy, plan agent deployments for
  throughput and rate limits.
- Microsoft Security Blog, 12 Feb 2026 — the ten agent misconfigurations (B-06's checklist).
- Measure the impact of your agents — the four value drivers and the AAH formula (B-09's source).

**Free accelerators**
- `microsoft/Power-CAT-Copilot-Studio-Kit` — **the AgentOps console, free and open source.** Agent
  Inventory, Compliance Hub, Agent Insights Hub, Agent Debugger, Agent Review Tool, Power Shield,
  Rubrics refinement, Conversation KPIs, Agent Value, Agent Library, automated test/deploy via
  pipelines. Note its prerequisites: Dataverse, system administrator, premium connectors.
- `microsoft/CopilotStudioSamples` — samples and artefacts.
- Copilot Studio automatic security scan — free, built in, and the thing makers click past.

**Calculators and cost tooling**
- **Copilot Credit Estimator** (`microsoft.github.io/copilot-studio-estimator`) — the official one.
  Exports a PDF for procurement. **Carry Microsoft's own disclaimer** — it is B-08's argument for a
  reconciliation retainer.
- `microsoft/FastTrack` → `copilot-agent-strategy/copilot-agents-cost-tool`.
- PPAC → Licensing → Copilot Studio → Environments for actuals, and → Manage Agents for per-agent caps.

**Labs and training**
- `microsoft.github.io/mcs-labs` — Microsoft Copilot Agents Labs. 50+ modules, 30+ labs, bootcamps,
  Agent in a Day, and beginner→advanced academy tracks.

**Detection and governance**
- Defender **AI agents** inventory and the Advanced Hunting **`AgentsInfo`** table, with the
  prebuilt **AI Agents** community queries. ⚠ **Flag the 1 July 2026 Agent 365 licence requirement
  here** — consistent with B-06 and B-11.

**Community authority**
- *The Custom Engine* (Power CAT blog) — the source for B-02's finding.
- Named MVP practitioners on governance and DLP design.

**Must not** duplicate the `.reflist` reference library in B-15. **The register is tools a partner
uses; B-15 is sources this page cites.** State the difference in one line.

---

### B-14 · The room · *facilitation*

Run of show, using the `coworksession40.html` pattern **copied, not re-derived**: `.stop` with
`id="stop-N"`, `.stop-rail` (`.dot` + `.line`), `.stop-head` (`<h3>` + `.stop-time`), `.beat.say` /
`.beat.show` / `.beat.tool`, and `.segue` always last inside `.stop-content`.

Act colours: stops 1–3 default teal, act 2 `.stop.act2`, act 3 `.stop.act3` — matching the
`.tier-ladder` act cards if one is used above the walkthrough.

**Room artefacts are extracts of Part C figures. Nothing is authored twice.** A stop that needs a
visual points at `#section-N` and reuses the figure that already exists there.

Nothing links to `#stop-N`; the ids exist as stable deep-link and print anchors.

---

### B-15 · What we could not verify, and references · *SG-3*

**Three blocks.**

1. **The open tests as a live register** — all nine, each stating what is unknown and what would
   settle it. This is the page's honesty surface.
2. **The case-study hole, stated plainly** (SG-3). No verifiable named SMB Copilot Studio case study
   with audited outcomes exists. Microsoft's own "Ask Microsoft" agent is real and published but is
   an enterprise self-reference. The vivid SMB numbers circulating trace to marketing blogs with no
   named customer and are **not used**. Turn it into the Customer Zero argument: *there is no audited
   SMB case study yet — which is why you instrument the baseline before you build, because you are
   going to be it.*
3. **The reference library** (`.reflist` dialect) grouped *Microsoft official* / *analyst and
   research* / *community*, plus the **`.prov` provenance legend** explaining the four classes to the
   reader.

---
---

# PART C · Figures

Inline SVG inside a `.flowmap` wrapper. Hard-coded hex from `DESIGN.md` §1/§4 — SVG attribute values
do not take `var()`. `role="img"` + a descriptive `aria-label`. `.flowmap-cap` caption below,
italic, `#6b7280`. `svg { width:100%; height:auto; display:block; }` and a `viewBox` so it scales.

**Load the `artifact-diagramming` guidance before authoring C-1 and C-2.**

| ID | Figure | Section | Notes |
|---|---|---|---|
| **C-1** | **The engagement arc** — seven phases left to right on a real time axis, phase 4 (economics) marked as the skipped one, the assessment/SOW/retainer bands shown as three commercial zones beneath, outbound link label per phase | **B-00 (§1)** | The artefact partners photograph. Doubles as the scope-firewall diagram. Replaces the rung staircase |
| **C-2** | **The two plumbings** — Copilot readiness vs agent readiness side by side, with the SAM E-SKU wall drawn across the Copilot side | B-03 | The reconciliation, drawn |
| **C-3** | **The harness fork** — three columns, one billing consequence each | B-05 | |
| **C-4** | **The credit meter** — one interaction decomposed into its charges, with the 125% cliff marked | B-08 | Makes the rate card concrete and the kill switch visible |
| **C-5** | **Six drifts** — ageing sources mapped to detection surface and free tool | B-10 | Feeds the failure register in the same section |
| **C-6** | **Blast radius** — the three settings, secure default vs dangerous value | B-06 | Room artefact |

---
---

# PART D · Fact registration — gates SG-1

**Posture: minimal currency.** Consumption is expressed in **Copilot Credits**, which are not
currency and need no fact ID. Currency appears only where a Microsoft list price makes a positioning
point that cannot be made otherwise, or where a Microsoft-published formula ships a default constant.

**Target: fewer than ten currency values on the entire page.** If a section wants an eleventh, cut it
or express it in relative terms.

**Every currency figure that does ship must carry:**
1. A record in `data/facts.json` — value, `label`, `source_url`, `as_of` (source date), fetch date,
   **review date**, and a unique `anchor` lifted verbatim from the rendered markup.
2. A `.prov` class in markup with one provenance variant:

| Class | Meaning |
|---|---|
| `prov-ms` | Microsoft-published list price, documented entitlement, or a constant Microsoft publishes in its own formula |
| `prov-range` | Corroborated only by resellers or aggregators |
| `prov-survey` | Named analyst or survey |
| `prov-model` | Editorial model |

**Hard rule:** a figure corroborated only by resellers is `prov-range`, never `prov-ms`, no matter
how many blogs repeat it. **The Agent 365 SMB prerequisite is `prov-range` until TT-7 closes.**

**Frozen and out of scope (`DESIGN.md` §8.10):** every service price in `cpb.html` — per-agent
AgentCare rates, per-user tier rates, build fees, and every scenario line derived from them.
**Harbor & Vane references them by link, never by value.** Anything derived from a Microsoft price is
flagged, not recomputed.

Also respect the `OPS-DELTA.md` corrections if this page touches the ground: the golden-prompt pass
rate is *"a realistic pass rate of 80–90%"*, not `>90%` (A1); Forrester TEI is 9 hrs/month with a
50% recapture factor (A3). **Simplest compliance: this page restates neither.**

---

## Out of scope — flagged, not changed

| Item | Why |
|---|---|
| Anchor ids inside `cpb.html` §10.5 | Needed by B-08, B-10, B-11. **Own spec, own chat, lands before Part B** (SG-5). Until then link `#10-the-revenue-runway-…` |
| `$8.45` attribution conflict, `cpb.html` §10 vs `frontier.html#section-10` | Real inconsistency. Own fact-delta spec (SG-4). This page restates neither |
| `OPS-DELTA.md` A1/A3/A4/A6 corrections in `cpbops.html` | Already reported there. This page avoids the ground; it does not fix the other file |
| ~~`control-before-scale.html` is not on disk~~ **— CORRECTED 2026-08-28** | **It is on disk and complete**: 18 sections, `id="section-1"` … `id="section-18"`, and it already defines `.prov`, `.trap` and `a.docref`. Every cross-link to it resolves today. §6 (permissions gate / licence wall) and §12 (who delivers) are the two this page links |
| **ECIF and Microsoft partner funding** | An Advanced Specialization gates ECIF and excludes most partners. If B-08 or B-12 reaches for it, state the gate or send the reader to `frontier.html`. Never present ECIF as generally available |
| `specs/README.md` is stale — documents 5 of 14 specs, still lists `ledger.html` | Flag for Ken; not this build's job |
| Microsoft screenshots | None planned. If added: uncropped, unaltered except resize, credited **"Used with permission from Microsoft."** |
| Companion handouts | None. The register is B-13, per Ken's decision |

---

## Verification

```bash
# 1 · spec applicability — after adding the pair to tools/speccheck.py PAIRS
python tools/speccheck.py specs/agent-never-done.spec.md agent-never-done.html
python tools/speccheck.py --all          # baseline 39 ok / 0 failed — must not degrade
```
```bash
# 2 · DESIGN.md §9 design lint — anything not in §1/§2/§4 is a finding
grep -ohE '#[0-9a-fA-F]{3,6}' agent-never-done.html | sort -u
grep -ohE 'font-size:[ ]*[0-9.]+(rem|px|em)' agent-never-done.html | sort -u
grep -ohE 'font-family:[^;}]*' agent-never-done.html | sort -u
grep -ohE 'border-radius:[ ]*[0-9]+px' agent-never-done.html | sort -u
```
```bash
# 3 · §8b.1 — no max-width on prose
grep -nE 'max-width:[^;}]*(ch|em)' agent-never-done.html
grep -nE '\.(lede|sub|note|callout|hint|body|track)[^{]*\{[^}]*max-width' agent-never-done.html
```
```bash
# 4 · §8b.2 — every named section is a live link
grep -noE '([Ss]ection [0-9]+|Stop [0-9]|Agent Build Engagement Worklist|Outcome-Based)' agent-never-done.html
```
```bash
# 5 · §8.10 — currency count must equal provenance count, and both must be small
grep -oE '\$[0-9][0-9,.]*' agent-never-done.html | wc -l
grep -c 'class="prov' agent-never-done.html
```
```bash
# 6 · anchor integrity — every in-page href resolves to an id
python -c "import io,re;s=io.open('agent-never-done.html',encoding='utf-8').read();ids=set(re.findall(r'id=\"([^\"]+)\"',s));hs=sorted(set(re.findall(r'href=\"#([^\"]+)\"',s)));print('missing:',[h for h in hs if h not in ids])"
```
```bash
# 7 · cross-file anchors — every a.docref target must exist in its target file
grep -oE 'href="(cpb|cpbops|shadowai|frontier|control-before-scale)\.html#[^"]+"' agent-never-done.html | sort -u
```
```bash
# 8 · fact cascade integrity — baseline 271/271 anchors resolving uniquely
python tools/check-facts.py --cascade
```

**Currency count must equal `.prov` count. A mismatch is a failed execution.**
**Currency count must be under ten. If it is not, SG-1's posture was not honoured.**

**Manual render check:** page loads; nothing scrolls horizontally at 375 / 768 / 1440; every
`#section-N` lands below the pinned bar; print preview hides `.mh-bar` and flattens the masthead;
every external link carries `target="_blank" rel="noopener"`; every `a.docref` target anchor exists
in the target file.

---

## Open questions for Ken

1. **Harbor & Vane's named workflow.** Rung 3 requires a named, high-volume workflow, and the company
   was originally chosen for its compliance levers rather than for one. **Renewal triage** is my
   recommendation for a 78-seat brokerage — high volume, deadline-driven, defensible cycle-time
   baseline. Claims first-notice is the alternative.
2. **Which UnifyCloud gallery use case anchors B-12.** I can see the gallery categories but not the
   contents of any individual use case. Pick one that a TD SYNNEX rep would actually put in front of
   an SMB partner, and the section builds around it.
3. **How much of B-12's back-end walkthrough should be UnifyCloud-specific** versus written so it
   applies to any prebuilt-agent vendor. My recommendation is the latter with UnifyCloud as the
   worked example, so the section does not date when the line card changes.
4. **Which of TT-1 / TT-7 / TT-8 to run first.** All three are cheap. TT-1 validates the page's
   central claim; TT-8 is the one that changes what a partner should tell a customer about Agent 365.
