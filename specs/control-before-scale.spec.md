# specs/control-before-scale.spec.md

> **SUPERSEDED 2026-08-28 — BUILT.** This 15-section draft was written before the scope
> expanded to cover AvePoint depth, staffing and certifications, Purview-from-zero, and the
> tiered pricing ladder. The asset shipped as **18 sections** at
> [`control-before-scale.html`](../control-before-scale.html).
>
> Retained for its sign-off gates (§2), tenant tests (§3) and out-of-scope table, all of which
> still apply. The section map below is historical — read the built page instead.

**Target file:** `control-before-scale.html` — **new file**, 15 sections
**Also produces:** `assets/control-before-scale/*` · `data/facts.json` additions · two companion handouts
**Branch:** `feature/control-before-scale`
**Authored:** 2026-08-28
**Depends on:** [`DESIGN.md`](../DESIGN.md) §1–§4, §8, §8b · `research/control-before-scale/00`–`09`
**Blocked by:** four sign-off gates in §2 and three tenant tests in §3. **Do not start Part B until all seven are closed.**

---

## Why

The workshop needs a session called **Control Before Scale: Assess, Govern and Earn Trust**.
The problem it exists to solve is that partners lead with the plumbing — data governance,
DLP, classification, compliance — and the Copilot conversation dies before it starts.

Two things make this a build rather than a rewrite.

**1. A third of it already exists and must not be written twice.**
[`shadowai.html`](../shadowai.html) owns the discovery-led opening, the app matrix, the
delivery flow and the revenue ladder. The gap analysis in
[`research/control-before-scale/00-brief-and-gap-analysis.md`](../research/control-before-scale/00-brief-and-gap-analysis.md)
§2.3 lists the ten things no asset on the site answers. **Those ten gaps are this page's
entire scope.** A section that reads like `shadowai.html` is a failed section.

**2. The research found that the standard SMB playbook does not execute.**
SharePoint Advanced Management — the whole oversharing toolkit, which is the actual gate in
front of Copilot — requires an Office 365 or Microsoft 365 **E-SKU base**. Business Premium
is not on Microsoft's supported list. The sequence most of the channel is running today
(*buy one Copilot seat → unlock SAM → run the DAG reports → remediate → roll out*) cannot be
executed in most SMB tenants. See
[`09-verifications.md`](../research/control-before-scale/09-verifications.md) V-06, and V-07
for the two research dossiers that got this wrong in opposite directions.

That finding is the page's spine. Everything else — licensing, tooling, pricing, the sample
company — arranges around the seam it creates: **data protection is reachable on Business
Premium; permissions remediation is not.**

---

## 1. What this page is

One artefact, two jobs. Resolved per
[`08-session-design-draft.md`](../research/control-before-scale/08-session-design-draft.md) §4:

- **The bible** — a standing reference a partner reads alone at a desk six weeks later while
  writing a SOW. Sections 1–13.
- **The room** — a facilitation section specifying the run of show, with the five room
  artefacts marked as extracts of figures that already exist in the body. Section 14.

Nothing is authored twice. `coworksession40.html` is the precedent for run-of-show markup
and its `id="stop-N"` anchor convention is reused.

---

## 2. Sign-off gates — Ken decides, execution does not improvise

| # | Gate | Recommendation | Why it cannot be improvised |
|---|---|---|---|
| **SG-1** | **Currency policy.** `DESIGN.md` §8.10 forbids introducing a currency value with no fact ID. `specs/copilot-adoption-audit-buildout.spec.md` banned currency from that page outright. This page's headline requirement is MRR. | Register every figure in `data/facts.json` with source, source date and review date. Tag each in markup by provenance — **sourced benchmark / vendor list price / community-reported range / editorial model**. No figure derived from the frozen service price sheet is restated. | §8.10 is a prohibition with revert consequences. An execution chat introducing ~40 currency values without a policy is a failed execution by definition. |
| **SG-2** | **Which Microsoft model anchors the page.** `shadowai.html` §3 uses Discover → Block → Protect → Govern. Dossier 01 reports Microsoft's live Copilot methodology is Remediate → Guardrails → Regulations, and that the older series is stale. | Lead with Microsoft's current framing; carry one explicit reconciliation note linking back to [`shadowai.html#section-3`](../shadowai.html#section-3). Raise a separate small fact-delta spec for `shadowai.html`. | Anchoring to the old model inherits staleness; anchoring to the new one contradicts a sibling page. Either way the site argues with itself. |
| **SG-3** | **The sample company.** | **Harbor & Vane** — 78 employees, regional insurance brokerage. Design brief and rationale in [`00`](../research/control-before-scale/00-brief-and-gap-analysis.md) §4. | Alternatives (medical billing, defence subcontractor) change which compliance levers section 2 can use and which objections section 10 can teach. |
| **SG-4** | **Reddit gap disclosure.** r/msp and r/Office365 hard-block the toolchain; dossier 03 cited **zero** practitioner figures rather than invent them. | Either a human reads those threads before Part B, or section 15 states plainly that the pricing evidence is surveys and vendor list prices, not practitioner invoices. | Presenting vendor list prices as community benchmarks is precisely the failure dossier 03 caught two vendors committing. The page must not repeat it. |

---

## 3. Tenant tests — run before Part B

These are three claims the page wants to make that no document settles. Each is a
Customer-Zero-shaped task: run it on your own tenant, then write what happened.

| # | Test | What it decides | Status |
|---|---|---|---|
| **TT-1** | Does a **mixed tenant** carrying a small number of M365 E3 seats satisfy SAM's org-wide base requirement? Microsoft words it *"Your organization must have one of the following base licenses"* — not per-user. | If yes, "buy three E3 seats" is a cheap path around the wall and becomes the most valuable single recommendation on the page. If no, section 6's fork is permanent. | ⬜ untested |
| **TT-2** | Is **DSPM for AI** actually present in Purview Suite for Business Premium? Microsoft's page says "policy-based controls for AI experiences and Copilot interactions" and never uses the term; the Purview service description has no DSPM section; DSPM for AI is now "(classic)". | Determines whether section 5 can name DSPM as the discovery surface for an SMB, or must describe the capability without the product name. **Highest risk of shipping a wrong claim.** | ⬜ untested |
| **TT-3** | Does the **Defender Suite for Business Premium** carry full Defender for Cloud Apps? Corroborated only by CIAOPS. | If yes, $15/user/month is the price of shadow AI discovery for an SMB — the answer to the question the whole session turns on. If no, section 7's tooling floor changes materially. | ⬜ untested |

**A section that depends on an open test ships with the uncertainty stated, or does not
ship.** It does not ship with a guess.

---

## Execution prompt

> You are applying `specs/control-before-scale.spec.md`.
> - **Confirm all four gates in §2 are signed off and all three tests in §3 are resolved or
>   explicitly deferred before writing any markup.** If any is open, stop and report.
> - Parts run in order: **A → B → C → D → E**. Each part is its own chat
>   (`DESIGN.md` §8.9). Part B is section-by-section; do not write more than three sections
>   per chat.
> - The page is a **new file** and carries its own `<style>` block. Every token comes from
>   `DESIGN.md` §1/§2/§4. Introduce no colour, font-family, font-size, radius or shadow that
>   is not on those lists.
> - **No `max-width` on any run of prose** (`DESIGN.md` §8b.1). Narrow the container, never
>   the sentence.
> - **Every reference to another document or section is a link** (`DESIGN.md` §8b.2), with an
>   anchor that exists in the target. Add the anchor to the target file if it does not — as
>   its own change, in its own chat.
> - **Every currency figure must carry a fact ID registered in `data/facts.json`** and a
>   provenance class in markup. A currency value with no fact ID is a failed execution.
> - **Nothing from the "do not repeat" list in `06-field-knowledge.md` §9 may appear on the
>   page.** Check every statistic against it.
> - Where a section covers ground `shadowai.html` holds: one sentence of orientation, an
>   `a.docref` link, then the new material. Never restate.
> - Commit per section; message = section ID + one line.
> - Report: sections written, claims that could not be sourced and were cut, actual diff stat.

---

## Summary

| Part | Scope | Output | Risk |
|---|---|---|---|
| **A** | Page skeleton, `<style>`, TOC, masthead, section shells | 1 file | LOW |
| **B** | The fifteen sections | prose + tables | **HIGH** — the whole argument |
| **C** | Six figures | inline SVG + assets | MED |
| **D** | Fact registration | `data/facts.json` | MED — gates SG-1 |
| **E** | Two companion handouts | new files | LOW |

---
---

# PART A · Skeleton

Build the shell only. No body prose.

- Masthead matching `shadowai.html` / `copilot-adoption-audit.html`: eyebrow, title,
  standfirst, byline, updated date.
- Title: **Control Before Scale**. Standfirst: *Assess, govern and earn trust — the
  assessment and governance motion that gets an SMB from AI experimentation to adoption.*
- TOC with all fifteen entries, every `<h2>` carrying `id="section-N"`.
- Back-to-TOC link after each section, per house convention.
- `.stage` shell; `.masthead-inner` at `1320px` per `DESIGN.md` §8b.1 precedent.
- Register in `index.html` and `sitemap.xml` — **as its own change, after Part B lands.**

Components this page needs beyond the `DESIGN.md` §3 catalog. Each is declared here and
defined in the page's own `<style>`:

| Class | Role | Modelled on |
|---|---|---|
| `.gate` | A hard stop in the sequence — the two or three things that must be true before Copilot is enabled | new; `.callout warn` palette |
| `.fork` | A two-branch licensing decision | `.quad` in `copilot-adoption-audit.html` |
| `.prov` | Provenance tag on every currency figure | new; four variants, see Part D |
| `.saidline` | What the partner actually says, verbatim | `.sayline` in `copilot-adoption-audit.html` |
| `.stop` | Run-of-show segment, section 14 | `coworksession40.html`, reuse `id="stop-N"` |
| `.trap` | A named failure mode | `.traps` in `copilot-adoption-audit.html` |

---

# PART B · The fifteen sections

Each row states what the section **owns**, its **evidence**, and what it **must not do**.
Gap IDs refer to [`00`](../research/control-before-scale/00-brief-and-gap-analysis.md) §2.3.

### B-01 · The conversation that stalls, and the one that doesn't

Opening provocation. The `copilot-adoption-audit.html` §2 pattern — assert what the channel
believes, then show it wrong. The specific reversal: *partners think leading with governance
is the safe, responsible opening. It is the reason the deal dies.* And the sharper one:
**the governance objection is usually raised by the partner, not the customer.**

Do **not** open with shadow AI statistics. `shadowai.html` §1–2 owns them and the reader has
seen them.

### B-02 · When this conversation happens · *R1*

The trigger map. Evidence: dossier 07's compliance-lever ranking. Cyber insurance renewal is
the strongest lever in SMB — annual, sector-agnostic, headcount-agnostic, with a named signer
and a hard date. Then FTC Safeguards, CMMC Phase 1 (in force 10 Nov 2025), ABA Formal
Opinion 512, Illinois HB 3773 (1 Jan 2026).

**Must state what does *not* apply.** EU AI Act high-risk obligations pushed to Dec 2027 /
Aug 2028; Colorado SB 24-205 repealed and replaced (now 1 Jan 2027) — partner marketing still
citing "February 2026" is citing a dead law. Dossier 07 is emphatic that overstating
applicability to small business is the channel's most common error. **This section's
credibility comes from the exclusions.**

### B-03 · Harbor & Vane · *SG-3*

The 78-seat brokerage. Facts only — no findings. One page, reproducible as a handout.
Design brief: [`00`](../research/control-before-scale/00-brief-and-gap-analysis.md) §4.

### B-04 · The bridge · *G1 — the spine*

Finding → control → sequence position, with gates marked. The figure is C-1.

The load-bearing content is **what is optional**. Partners over-scope because nobody has told
them what can follow enablement rather than precede it. Microsoft's own blueprint
(dossier 06, ms.date 17 Apr 2026) supplies the pattern: apply RCD + DLP-for-Copilot as
*interim* protections, fix permissions, **then remove the interim protections** — and notes
partners routinely skip step three, leaving customers paying for a Copilot that cannot see
their own content. That third step is a `.trap`.

### B-05 · The permissions gate, and the licence wall · *G2 + V-06*

The section the page exists for.

1. What oversharing actually is in a real tenant, and why Copilot surfaces it.
2. **"Copilot respects existing permissions" is true and is not a defence** — it is a
   statement about access control, not exposure. RCD exists precisely because *they
   technically had access* was not good enough. (Dossier 06, field lesson 5.)
3. The SAM toolkit, named feature by feature.
4. **The wall.** Verbatim base-SKU list, Learn URL, fetch date. Business Premium absent.
5. **The correction in both directions**, per V-07 — one Copilot seat unlocks SAM *on an
   E-SKU base*; the channel is currently wrong both ways.
6. What a sub-100-seat partner does instead: native SharePoint admin reports, SPO PowerShell,
   and the free tooling from dossier 05.

Depends on **TT-1**.

### B-06 · The licensing decision · *G3*

A decision table, not a feature matrix. The question is never "what does E5 include" — it is
"this customer is on mixed Business Standard and Business Premium; what can I sell and
deliver on Monday."

Confirmed at primary source (V-01): Purview Suite for Business Premium **$10/user/month paid
yearly**, 300-seat cap, BP base required; Defender + Purview combined **$15**; the SMB stack
at **~$37** against E5 at **$60**. **50% off Purview Suite when purchased with Microsoft 365
Copilot, 1 Dec 2025 – 31 Dec 2026** — Microsoft funding this motion directly, with a deadline
four months after the workshop.

The two mis-sales, stated plainly:
- **E3 is not the compliance step-up customers think it is.** "Restrict Copilot from
  processing files and emails" is **No** on Business Premium *and* **No** on E3.
- **Selling label-based Copilot exclusion on bare Business Premium is a mis-sale.** With the
  Purview Suite attached it is in scope. (V-01.)

Also: Copilot Business locks the enterprise upgrade door until commitment end (dossier 02);
Content Explorer is **not supported over GDAP** and Purview audit access needs the engineer as
a guest user — both belong in the engagement letter.

Depends on **TT-2**.

### B-07 · What you can actually deliver — the tooling floor · *G6*

Minimum viable toolkit at 78 seats, near-zero licence cost: ScubaGear, Maester, Monkey365,
Microsoft365DSC, SPO PowerShell, M365 Lighthouse. Then the honest build-vs-buy line from
dossier 05: **match the pricing unit to the portfolio shape, not the feature list.** Per-user
pricing with a floor punishes small tenants — AvePoint's published SKUs carry 500-user
minimums, Syskit and Rencore 100, Nudge $750/month flat.

**AvePoint handling.** Even-handed and factual, not promotional
([`08`](../research/control-before-scale/08-session-design-draft.md) §3). The UK a public-sector framework
schedule is the only real published rate card found — and its 500-user minimums are exactly
why it does not reach this market unaided. State that. A vendor section that cannot survive
the customer's own seat count is not useful to a partner.

The comparison table from dossier 05, with a **realistic at sub-100 seats: yes/no/marginal**
column. Depends on **TT-3**.

### B-08 · The engagement, step by step · *R2*

Stage 0–4, roughly 40–60 partner hours over 3–4 weeks (dossier 07's SMB-scaled synthesis,
**marked as synthesis**, derived by cutting network/app-version checkpoints from the only
published detailed methodology — a 480–520 person-hour enterprise blueprint that is not
sellable at this seat count).

Hard calendar constraints, sourced: DSPM for AI's 4-day delay on first default assessment,
≥48-hour wait after any run, 30-day expiry on custom assessments, item-level scanning capped
at **10 SharePoint sites, SharePoint only, no OneDrive**, 200k items per location.

**Remediation is where estimates break** — the blueprint reports 90%+ of tenants scoring
Yellow or Red on SharePoint permissions. Scope remediation separately, always.

### B-09 · The deliverables · *G8*

Show them, do not name them. Every artefact gets structure and a specimen fragment. The
`copilot-adoption-audit.html` precedent is a redacted specimen, and this page needs the same.

**Confirmed negative, from dossier 07: SANS does not publish an AI acceptable use policy
template. Do not cite one.** Also: no authoritative guidance was found on the
unauthorised-practice-of-law boundary for MSP policy work — say so rather than implying the
partner may write policy freely.

### B-10 · Where it derails · *G9*

Harbor & Vane, second pass. The same engagement at the four points it goes wrong. Objections
in situ, not in a table — the three that actually end deals: incumbent trust ("our last MSP
reviewed us"), the recurring-fee objection ("why pay monthly for a one-time cleanup" —
answered by Microsoft re-attesting its own containers every six months), and the
permissions myth from B-05.

The eight softer objections in [`shadowai.html#section-11`](../shadowai.html#section-11) are
linked, not restated.

Also here: **the pilot dies at month three for adoption reasons, not governance reasons**
(dossier 06). A governance-only engagement that ignores adoption produces a clean tenant
nobody uses.

### B-11 · The money · *G4, gated on SG-1*

Assessment → remediation → recurring. Lead with the survey finding that is the session's
commercial thesis: Kaseya's *2026 State of the MSP* (n>1,000) — **48% of MSPs name AI as
their clients' number-one need; 13% earn meaningful revenue from AI, 8% from compliance
work.** Same source: clients spending >$25k/year collapsed 75% → 41%; unprofitable MSPs
doubled to 10%.

The four evidence-backed models from dossier 03: framework-as-tier-ladder; paid assessment
credited against remediation; reassessment folded into MRC with quarterly attestation;
governance as a priced increment, never absorbed.

**Every figure carries its provenance class.** Dossier 03's own methodological findings are
part of the section, not hidden: no independent invoice-level survey of governance pricing
exists; two "independent" sources publish identical figures and are one source; the widely
cited per-user compliance band implies an outlier per-seat rate. **The honesty is the
differentiator** — every competing guide launders vendor list prices into benchmarks.

### B-12 · Building the practice · *G7*

The skills floor. What the partner must have personally done — run the assessment on their own
tenant is the non-negotiable. The certifications that matter. When to hire versus subcontract.
The repeatability threshold at which delivery cost falls enough for the MRR to carry a person.
Service Leadership's margin frame (best-in-class 19%+ adjusted EBITDA) as the target.

### B-13 · The Microsoft program · *G5*

Link [`frontier.html`](../frontier.html) for the tier ladder; do not re-derive designations.
This section covers only what is specific to this motion, from dossier 04:

- **Solutions Partner for Security via the SMB track** — the 70-point bar need only be
  cleared on **one single day inside a rolling six-month window**, which most small partners
  do not know.
- **CPOR hygiene first** — it is free, thresholds are a quarter to a half of CSP's for
  identical points, and usage growth counts only from the date of association.
- **Security Immersion Briefings** — since Jan 2026 uncapped, resellers can deliver and claim,
  focus is Defender/Purview for Business Premium at 50–300 licences. Exactly this customer.
- **Defer** the specializations — partner-funded third-party audits every two years from
  30 July 2026, validating documented repeatable delivery, not skills. Build the methodology
  first. Note the cap: three security specializations earn benefits, a fourth earns nothing.
- **Skip** marketplace, MACC, FastTrack (150-seat floor — *that gap is the market*), and
  ECIF/Copilot Vouchers (excludes CSP, requires 500 seats).

**All FY27 incentive rates are gated and unverified** (dossier 04's own list). Name the
mechanism, never the rate.

### B-14 · Running the session · *G10*

The run of show from [`08`](../research/control-before-scale/08-session-design-draft.md) §2,
as `.stop` blocks with `id="stop-N"`. The 60/90/120-minute variants. The vendor placement
rule. The facilitator floor. Every room artefact marked as an extract of a figure already in
the body.

### B-15 · Sources, and what we could not verify

House convention, plus an explicit **"do not repeat"** table — dossier 06 §9's eight
unverifiable statistics, dossier 03's identical-source finding, dossier 04's gated FY27 rates,
and the Reddit gap per **SG-4**. Every open tenant test from §3 that did not close.

---

# PART C · Figures

| ID | Figure | Section | Notes |
|---|---|---|---|
| **C-1** | **The bridge** — finding → control → sequence, gates marked | B-04 | The artefact partners photograph. Inline SVG, both-theme legible. |
| **C-2** | **The licence wall** — what Business Premium reaches and what it does not | B-05/B-06 | The seam. Two columns, one hard rule between them. |
| **C-3** | Engagement timeline with the DSPM calendar constraints on it | B-08 | |
| **C-4** | Harbor & Vane findings — the derailment view | B-10 | |
| **C-5** | The money: year-one shape vs recurring | B-11 | Gated on SG-1. |
| **C-6** | Run-of-show timing bar | B-14 | `coworksession40.html` precedent. |

Load `artifact-diagramming` guidance before authoring C-1 and C-2. Microsoft screenshots, if
used, follow the policy already established in
[`specs/copilot-adoption-audit-buildout.spec.md`](copilot-adoption-audit-buildout.spec.md):
uncropped, unaltered except resize, credited **"Used with permission from Microsoft."**

---

# PART D · Fact registration — gates SG-1

Every currency figure and every perishable claim registers in `data/facts.json` before Part B
prose ships, with: value, source URL, source date, fetch date, **review date**, and provenance.

Four provenance classes, rendered as `.prov` variants:

| Class | Meaning | Example |
|---|---|---|
| `prov-ms` | Microsoft-published list price or documented entitlement | Purview Suite $10/user/mo |
| `prov-survey` | Named survey with a sample size | Kaseya 2026 State of the MSP |
| `prov-range` | Community-reported range, multiple independent sources | assessment fee bands |
| `prov-model` | Editorial model, composed by this page from cited inputs | the year-one deal shape |

**A figure corroborated only by resellers is `prov-range`, never `prov-ms`, no matter how many
blogs repeat it.** This is the V-05 rule and it exists because the licensing material is full
of blogs recycling each other.

Review dates: Microsoft prices **31 Dec 2026** (the promo expiry forces a check anyway);
survey figures at next edition; editorial models annually.

---

# PART E · Companion handouts

| ID | Artefact | Notes |
|---|---|---|
| **E-1** | Harbor & Vane profile — one page, both sides usable | Extract of B-03. Distributed face down, turned on cue. |
| **E-2** | Pricing worksheet — the exercise B table | Extract of B-11. **See open question 2 below before printing.** |

---

## Out of scope — flagged, not changed

| Item | Why |
|---|---|
| `CopilotIB.html` Restricted SharePoint Search guidance (lines 886, 895–896) | Stale — new enablement blocked 31 Jul 2026. Real defect. **Needs its own small spec.** `DESIGN.md` §8.9. |
| `shadowai.html` §3 four-step model | Possibly superseded. See **SG-2**. Own spec. |
| `shadowai.html` §10 revenue ladder prices | Editorial estimates predating this research. Reconciling them is a separate decision — this page must not silently contradict a sibling. **Flag for Ken.** |
| `frontier.html` program figures | Already unverified per `frontier.spec.md`. Link, do not restate. |
| Anything in `data/facts.json` not added by Part D | §8.10. |

---

## Verification

Add to `PAIRS` in `tools/speccheck.py`. Then, per `DESIGN.md` §9:

```bash
grep -ohE '#[0-9a-fA-F]{3,6}' control-before-scale.html | sort -u
```

```bash
grep -nE 'max-width:[^;}]*(ch|em)' control-before-scale.html
```

```bash
python tools/check-facts.py --cascade
```

Plus one check specific to this build — every currency figure must carry a provenance class:

```bash
grep -oE '\$[0-9][0-9,.]*' control-before-scale.html | wc -l
```

Compare against the `.prov` count. **They must match.** A mismatch is a failed execution.

---

## Open questions for Ken

1. **Slot length and room shape** (`08` §7). Table exercises need tables. A theatre-style room
   of 200 turns segments 2 and 5 into polls, which is a materially weaker session.
2. **Is the pricing exercise safe to run with competitors present?** Partners discussing
   prices in a facilitated setting is common at channel events and is also the kind of thing
   counsel has views about. The exercise runs equally well against **delivery cost and
   margin** rather than price, if that is cleaner.
3. **Does AvePoint take the segment-3 slot, or does the vendor slot rotate per event?**
4. **`shadowai.html` price reconciliation** — see the out-of-scope table. Two pages carrying
   different numbers for the same service is the exact defect `FACTS.md` §2 exists to prevent.
