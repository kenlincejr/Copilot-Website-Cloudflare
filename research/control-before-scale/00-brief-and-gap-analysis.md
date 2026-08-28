# 00 · Brief, gap analysis, and the sample company

**Authored 2026-08-28.** Written before the research dossiers landed, from the repo itself.
This file is the *frame*. Dossiers 01–07 are the *evidence*. The spec is the *build order*.

---

## 1. What was asked for

A new Customer Zero workshop session:

> **Control Before Scale: Assess, Govern and Earn Trust**
> Build an assessment and governance motion that helps customers move safely from AI
> experimentation to adoption.

The stated problem it exists to solve: **partners lead with the plumbing.** They open the
Copilot conversation with data governance, compliance, DLP and classification — the journey
the customer must complete before Copilot can be switched on — and the conversation dies
there. The session has to teach partners how to run that journey *as a sold, profitable,
recurring motion* rather than as a prerequisite they apologise for.

Scope requested, verbatim in substance:

| # | Requirement |
|---|---|
| R1 | The conversation — what the partner actually says, and when this conversation should happen |
| R2 | The process, step by step, from first meeting to managed governance |
| R3 | How the Shadow AI assessment leads into the Copilot conversation (Purview, Entra, Defender for Cloud Apps) |
| R4 | What the partner must know to facilitate it — the enablement and skills floor |
| R5 | Which assessments exist and are available to partners |
| R6 | Partner deliverables, and what they charge for them |
| R7 | What conversations it opens next |
| R8 | Tools and assessment resources, including third parties (AvePoint expected in the room) |
| R9 | Tribal knowledge — what Microsoft and other partners learned the hard way |
| R10 | A sub-100-user sample company carrying every trip-up, with objections and how to work them |
| R11 | Licensing scenarios — how the customer must be licensed for the partner to deliver this |
| R12 | **The MRR.** How governance of a customer's AI estate becomes recurring revenue |
| R13 | How a partner builds a practice around it, and how it ties to the Microsoft partner program |

Point of view to write from: **a partner CXO figuring out how to build this business
profitably and sustainably.** Not a Microsoft field seller. Not a security consultant.

---

## 2. What the site already has, and what it does not

The single most important design constraint is that **`shadowai.html` already exists** and
covers roughly 35% of the requested surface. The new session must not restate it.

### 2.1 Already covered by [`shadowai.html`](../../shadowai.html)

| Covered | Where |
|---|---|
| Why shadow AI is the opening conversation, and the "lead with plumbing" failure | §1 |
| What SMBs actually have running — categories, tools, exposure | §2 |
| Microsoft's Discover / Block / Protect / Govern model | §3 |
| A 6-week assessment delivery flow with hours and staffing | §4.2–4.3 |
| A 120-user composite engagement | §5 |
| The Business Premium + Suite add-ons vs E5 positioning | §6 |
| Sanction-don't-block | §7 |
| A 30-app enterprise onboarding matrix (SSO/SCIM/admin console) | §8 |
| Partner Center propensity signals as a weekly call list | §9 |
| A six-rung revenue ladder with **editorial** price ranges | §10 |
| Eight objections with reframes | §11 |
| Regulated-vertical premium table | §13 |

### 2.2 Adjacent assets that must be linked, not duplicated

`DESIGN.md` §8b.2 makes this binding: naming another document without linking to it is a
prohibition, not a style note.

| Asset | What it owns | The new session's relationship |
|---|---|---|
| [`shadowai.html`](../../shadowai.html) | Discovery-led opening, shadow AI scan, app matrix | **Upstream.** The new session begins where this ends. |
| [`copilot-adoption-audit.html`](../../copilot-adoption-audit.html) | Post-deployment usage forensics, the export, the prompt library | **Downstream.** Governance proves out here. |
| [`frontier.html`](../../frontier.html) | Partner tier ladder, PCS scoring, certification roadmap, revenue model | **Owns R13's program half.** Link; do not re-derive designations. |
| [`customer-zero-starter-kit/`](../../customer-zero-starter-kit/) | Become Customer Zero, then sell the motion | **The frame.** This session is one of its motions. |
| [`cpb.html`](../../cpb.html) | The primary playbook | Cross-link both ways. |

### 2.3 The actual gap — what the new session must own

These are the requirements no existing asset answers. This list is the session's reason to exist.

| Gap | Requirement | Why it is a gap |
|---|---|---|
| **G1 · The bridge** | R3 | `shadowai.html` asserts "governance readiness is consumption readiness" but never shows the mechanical handoff — which shadow-AI finding maps to which Copilot control, and in what order. This is the session's spine. |
| **G2 · Oversharing remediation** | R2 | Named as a gate in `shadowai.html` §5.3 and then never explained. Nothing on site tells a partner how to *find* and *fix* SharePoint permission sprawl. This is the single biggest real blocker and it is missing. |
| **G3 · Licensing, resolved** | R11 | `shadowai.html` §6.2 explicitly punts — "verify before quoting." The session must resolve it into a decision table a partner can quote from. |
| **G4 · MRR with evidence** | R12 | The revenue ladder's prices are self-declared editorial estimates. R12 asks for researched, sourced, community-validated economics and a practice P&L view. |
| **G5 · Partner program tie-in** | R13 | Absent from `shadowai.html`. `frontier.html` has the ladder but not this motion's specific incentives, funded assessments or specializations. |
| **G6 · Third-party tooling** | R8 | Entirely absent site-wide. AvePoint and the build-vs-buy line are unaddressed. |
| **G7 · The skills floor** | R4 | Nothing tells a partner *whether they are qualified to run this*, or what to do if not. |
| **G8 · Deliverable specimens** | R6 | The engagement "produces" eight artefacts (§4.4) that are named but never shown. Partners cannot sell a deliverable they cannot see. |
| **G9 · A customer that goes wrong** | R10 | The 120-user composite succeeds. Every finding lands, every objection folds. A teaching asset needs a customer that fights back. |
| **G10 · Facilitation design** | — | This is a *workshop session*, not a reference page. Nothing on site specifies room design: timing, exercises, what the facilitator does, what partners leave with. `shadowai.html` is a document; this must also be a room. |

### 2.4 The overlap rule to write into the spec

> Where the new session touches ground `shadowai.html` already holds, it **links and
> advances** — one sentence of orientation, a `a.docref` link, then the new material.
> No section may restate the four-step model, the app matrix, or the shadow-AI statistics.
> If a section's first draft reads like `shadowai.html`, that section is wrong.

---

## 3. House constraints this build inherits

From [`DESIGN.md`](../../DESIGN.md) — binding, not advisory.

| Rule | Consequence for this build |
|---|---|
| §8.1 / §9 | No colour, font-size, radius, shadow outside §1/§2/§4. Design lint at the end. |
| §8.2 | No class the file does not define. New page carries its own `<style>`. |
| §8b.1 | **No `max-width` on any run of prose.** Caught in review repeatedly. |
| §8b.2 | Every reference to another document or section is a link, with an anchor that exists. |
| §8.9 | One file per execution chat. A multi-file build is a multi-part spec. |
| §8.10 | **The open question.** Service prices are frozen; unregistered currency changes are a failed execution. But R12 *is* a currency requirement. See §4 below. |
| Voice | Numbered sections, `id="section-N"`, exact click paths, named traps, a Sources section, contrarian framing (`copilot-adoption-audit.html` §2 is the model). |

### 3.1 The §8.10 problem, stated plainly

`DESIGN.md` §8.10 freezes service prices and forbids introducing a currency value with no
fact ID behind it. `specs/copilot-adoption-audit-buildout.spec.md` took the strict reading
and banned currency from that page entirely.

**That reading cannot survive here.** The session's headline requirement is MRR. A
governance-economics guide with no numbers is not the asset that was asked for.

Proposed resolution, to be confirmed before execution:

1. Every currency figure on the new page is **registered** in `data/facts.json` at authoring
   time, with a source, a source date, and a review date — the same discipline `FACTS.md`
   applies to Microsoft prices.
2. Figures are tagged in the markup by provenance class: **sourced benchmark**, **vendor
   list price**, **community-reported range**, **editorial model**. The reader always knows
   which they are looking at.
3. No figure derived from the frozen service price sheet is restated. The page models
   *governance* economics; it does not re-quote the `$350`/`$400` agent or `$15`/`$25`/`$55`
   user prices that §8.10 protects.
4. Ranges, not point estimates, wherever the evidence is community-sourced.

This is a decision for Ken, and the spec will carry it as an explicit sign-off gate rather
than assuming it.

---

## 4. The sample company — design brief

R10 asks for a sub-100-user company that carries every trip-up. `shadowai.html`'s 120-user
composite is too clean and slightly too large. Proposal:

### Harbor & Vane — 78 employees, regional insurance brokerage

Employee-benefits and commercial P&C brokerage. Three offices. Chosen because a brokerage
stacks more real, verifiable forcing functions into one sub-100-seat body than any other
SMB profile:

| Trait | Why it is in the design |
|---|---|
| **GLBA / FTC Safeguards Rule applies** | Insurance brokers are financial institutions under GLBA. A genuine regulatory lever, not partner marketing. *(Verify scope in dossier 07.)* |
| **Touches PHI through benefits administration** | HIPAA business-associate exposure without being a healthcare provider. Forces the BAA conversation for every sanctioned AI vendor. |
| **Carrier and enterprise-client security questionnaires** | An external party already asks them questions they cannot answer. The partner does not have to manufacture urgency. |
| **Cyber renewal 90 days out** | The single best-timed lever in SMB. The whole engagement can be dated against it. |
| **Acquired a 22-person agency 18 months ago** | Lift-and-shift file-server migration into one SharePoint site. The oversharing catastrophe has a *reason*, which makes it teachable rather than a strawman. |
| **Mixed licensing — Business Standard and Business Premium** | Forces the real licensing conversation (G3), including who can even be assessed. |
| **Owner already expensed 11 ChatGPT Plus seats** | Shadow AI is not hypothetical and not the staff's fault. The buyer is the offender. |
| **"Our last MSP did a security review, we're fine"** | The incumbent-trust objection, which is the hardest one and is absent from `shadowai.html` §11. |
| **The Ops Director is the power user and will resist** | Puts a human obstacle in the room. Partners lose these deals to a person, not an argument. |
| **78 seats** | Below every enterprise tool's economic floor. Forces the build-vs-buy and minimum-viable-toolkit answer (G6). |

The company must be run **twice** through the session: once as the engagement goes when the
partner does it well, and once at the specific points where it derails. The derailment
version is the teaching asset — it is what G9 asks for.

**Open question for Ken:** brokerage vs. the alternatives — a 60-person medical billing / RCM
firm (HIPAA, cleaner but narrower) or a 90-person engineering firm with defence subcontract
work (CMMC phase-in, sharpest deadline, but applies to a small slice of the channel).
Brokerage is recommended: broadest applicability, most levers, least jargon.

---

## 5. What this session is, structurally

Two audiences, one build:

- **The room.** A facilitated workshop session at a Customer Zero event, with AvePoint and
  other vendors present. Needs a run-of-show, exercises, and a leave-behind.
- **The bible.** A standing reference page a partner reads at their desk six weeks later
  while writing a SOW.

The site's existing assets are all the second thing. `coworksession40.html` is the closest
precedent for the first. **The spec must decide whether these are one artefact or two** —
that is the first structural question, and it is answered in the spec, not here.

---

## 6. Status

| Dossier | Topic | Status |
|---|---|---|
| 01 | Microsoft stack and assessment mechanics | commissioned |
| 02 | SMB licensing scenarios | commissioned |
| 03 | MRR, pricing and packaging | commissioned |
| 04 | Microsoft partner program and funding | commissioned |
| 05 | Third-party tooling ecosystem | commissioned |
| 06 | Field knowledge, failure modes, objections | commissioned |
| 07 | Delivery mechanics, deliverables, frameworks | commissioned |
