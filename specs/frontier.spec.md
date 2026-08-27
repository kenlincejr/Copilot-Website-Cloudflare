# specs/frontier.spec.md

**Target file:** `frontier.html` (1,773 lines, 121 KB)
**Branch:** `refresh/frontier`
**Authored:** 2026-08-26, Phase 4
**Depends on:** [`DESIGN.md`](../DESIGN.md), [`RESEARCH-DELTA.md`](../RESEARCH-DELTA.md) §6 and §7

---

## The headline problem

`frontier.html:1005` and `:1026` describe the Copilot Specialization requirements in detail. **Those requirements changed on 1 July 2026**, and the page now instructs partners to:

- study for **MS-102**, which has been **removed** from the requirement
- certify five people on **APL-4002** and five on **APL-7008**, both of which are **retired**
- collect **3 verifiable customer references**, which have been **replaced** by a third-party capabilities audit

It also uses the old name. The specialization is now the **Microsoft 365 Copilot specialization**.

This is not a stale statistic. A partner acting on this page will spend real money on retired exams and gather evidence that is no longer accepted. **FR-01 is the highest-value single change in the entire refresh**, and it is the one I would ship first if you could only ship one.

---

## Execution prompt

> You are applying `specs/frontier.spec.md` to `frontier.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip and report.**
> - Do not introduce any color, font, size, radius, or shadow not in `DESIGN.md`.
> - Commit per change, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **5** |
| LOW risk | 0 |
| MED risk | 3 |
| HIGH risk | 2 |
| **Diff budget** | **+9 / -5 lines** |

Two HIGH-risk items, both worth reading in full: **FR-01** (specialization requirements — a large in-place content replacement) and **FR-04** (removing two unsourced stats).

---

### FR-01 · Rewrite the Copilot Specialization requirements — **HIGH**
**Type:** text-rewrite · **Fact IDs:** none registered — **add these to `facts.json`** · **Risk:** HIGH
**Source:** [Microsoft Learn — Partner Center announcements, July 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-july), *"Microsoft 365 Copilot specialization updates"*
**Rationale:** See above. Every skilling line and the evidence requirement changed.

**What changed, precisely:**

| | Was | Now |
|---|---|---|
| Name | Microsoft Copilot specialization | **Microsoft 365 Copilot specialization** |
| Performance | 1,000 MAU growth + 5 net new customers | **paid M365 Copilot monthly active usage (MAU) only** |
| Skilling ① | MS-102 (×5) | **removed** |
| Skilling ② | SC-401 or APL-4002 (×5) | APL-4002 **retired** |
| Skilling ③ | APL-7008 (×5) | **retired**, replaced by AB-620 |
| New certs | — | **AB-100** (Agentic AI Business Solutions Architect), **AB-620** (AI Agent Builder Associate) |
| Evidence | 3 verifiable customer references | **third-party capabilities audit**, requires real customer examples, valid 2 years |

**Design:** Content only, inside the existing `.tc-col-text` div. Every `<strong>`, `<em>`, and `<br>` idiom in the surrounding cell is preserved. No class added, no inline style introduced. `frontier.html` is class-first (`DESIGN.md` §5).

**Deliberately preserved:** the closing `<em>` note about the MAU threshold being the common SMB blocker. It is still true, and it is now *more* true — MAU is the whole performance metric.

```html before:FR-01
<strong>Skilling (all three required):</strong><br>① 5 people with <em>MS-102</em>: Microsoft 365 Enterprise Administrator Expert<br>② 5 people with <em>SC-401</em> (Information Protection) or <em>APL-4002</em> (Security &amp; Compliance for Copilot)<br>③ 5 people with <em>APL-7008</em>: Create Custom Agents with Microsoft Copilot Studio<br><br><strong>Customer references:</strong> 3 verifiable customer references — at least 1 must demonstrate transformation of business processes through agent implementation.<br><br><em>Note: The 1,000 MAU threshold is the most common blocker for SMB partners. Start accumulating CPOR associations now.</em>
```
```html after:FR-01
<strong>Skilling (updated for FY27):</strong><br>① <em>MS-102</em> has been <strong>removed</strong> from this specialization&rsquo;s requirements.<br>② <em>APL-4002</em> (Security &amp; Compliance for Copilot) and <em>APL-7008</em> (Create Custom Agents with Copilot Studio) are <strong>retired</strong>.<br>③ New requirements: <em>AB-100</em> (Agentic AI Business Solutions Architect) and <em>AB-620</em> (AI Agent Builder Associate), which replaces APL-7008.<br><br><strong>Customer references are gone.</strong> As of July 1, 2026 they are replaced by a <strong>third-party capabilities audit</strong>. The audit requires real customer examples and remains valid for two years.<br><br><strong>Performance</strong> is now measured on paid Microsoft 365 Copilot monthly active usage (MAU) <em>only</em>.<br><br><em>Note: MAU is now the entire performance metric, which makes it the decisive blocker for SMB partners rather than merely the most common one. Start accumulating CPOR associations now. Confirm current thresholds in Partner Center before committing budget &mdash; this specialization was renamed and rescoped on July 1, 2026.</em>
```

---

### FR-02 · Rename the specialization in the Frontier badge requirements
**Type:** value-swap · **Fact IDs:** none registered · **Risk:** MED
**Rationale:** Same rename, second location. This cell also restates the old requirements in summary form, so the summary sentence is corrected with it.

```html before:FR-02
① Microsoft Copilot specialization<br>
```
```html after:FR-02
① Microsoft 365 Copilot specialization (renamed and rescoped July 1, 2026)<br>
```

---

### FR-03 · Correct the summarised specialization requirements
**Type:** text-rewrite · **Fact IDs:** none registered · **Risk:** MED
**Rationale:** This sentence restates the superseded requirements FR-01 fixes. Left alone, the page would contradict itself two cells apart.

```html before:FR-03
The Copilot specialization alone requires 1,000 MAU growth + 5 net new customers + 15 certified individuals across three cert tracks + 3 customer references with agent implementation.
```
```html after:FR-03
As of July 1, 2026 the Microsoft 365 Copilot specialization is measured on paid Copilot MAU, a reduced certification set built on AB-100 and AB-620, and a third-party capabilities audit in place of customer references.
```

---

### FR-04 · Remove two unsourced outcome stats — **HIGH**
**Type:** block-remove · **Fact IDs:** `F-141`, `F-130` · **Risk:** HIGH
**Rationale:** `RESEARCH-DELTA.md` §7. Neither *"96% year-over-year growth tracked by partners with Azure certifications"* nor *"51% increase in Azure revenue for designation earners"* could be traced to any public Microsoft source. Unlike the equivalent stats in `cpb.html` — which carry an *Inforcer MSP AI Report, 2026* citation directly beneath them — **these three stat blocks carry no attribution at all** in the markup.

The `51%` block additionally asserts *"measured outcomes, not projections."* That is an explicit credibility claim with nothing behind it, in a document whose argument is that partners should trust its arithmetic. It is the weakest markup on the site.

**The `71%` stat is retained.** It is equally unattributed here, but the same figure appears in `cpb.html` sourced to the Microsoft Work Trend Index (`F-017`, `F-055`), so there is a plausible provenance to recover. **Action for you: confirm the `71%` source and add the citation** — otherwise it should follow these two out.

**This is a removal, not a rewrite.** If you have the internal Microsoft partner deck these came from, say so and I will respec this as an attribution change instead. Removing real data because we could not find the citation is a worse outcome than citing it properly.

```html before:FR-04
    <div class="invest-stat">
      <div class="invest-stat-k">96%</div>
      <div class="invest-stat-l">Year-over-year growth tracked by partners with Azure certifications specifically</div>
    </div>
    <div class="invest-stat">
      <div class="invest-stat-k">51%</div>
      <div class="invest-stat-l">Increase in Azure revenue for designation earners — measured outcomes, not projections</div>
    </div>
```
```html after:FR-04

```

---

### FR-05 · Add the FY27 program changes that help your reader
**Type:** block-insert · **Fact IDs:** none registered — **add to `facts.json`** · **Risk:** MED
**Source:** [Microsoft Learn — Partner Center announcements, July 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-july)
**Rationale:** Three FY27 changes land directly on this page's audience and none are mentioned:

1. **SMB track eligibility expanded.** The Azure consumed revenue threshold is **removed** for the three solution paths feeding Cloud & AI Platforms. Partners with ≥80% of customers in SMC-C/SMB now qualify for the SMB track. This is the single most useful FY27 change for an SMB partner and it lowers a barrier the page currently presents as fixed.
2. **Designation badges consolidated six → three** (AI Business Solutions, Cloud & AI Platforms, Security), effective 1 July 2026. **Qualification requirements are unchanged** — the six solution paths still drive scoring and specializations. The page must not overstate this; it is a presentation change.
3. **CSP growth margins launch 1 October 2026** — additional margin for new-to-offer, seat expansion, and adoption across select AI workloads. Sandbox available now.

**Design:** `DESIGN.md` **C1 · Callout**, base teal variant — this is opportunity, not caution, so `warn` would be wrong. Class-based, consistent with this file. Inserted immediately after the `.invest-stats` block that FR-04 trims, so the section closes on current information rather than unsourced history.

**Apply FR-04 before FR-05** — FR-05's anchor is the closing tag of the block FR-04 edits.

```html before:FR-05
  </div>

  <!-- Partner quote -->
```
```html after:FR-05
  </div>

  <div class="callout">
    <div class="callout-title">What changed for you on July 1, 2026</div>
    <div class="callout-body"><strong>The SMB track just got easier.</strong> Microsoft removed the Azure consumed revenue threshold for SMB-track eligibility across the three solution paths that feed the Cloud &amp; AI Platforms designation. If at least 80% of your customer base sits in the SMB and SMC-C segments, you qualify for the SMB track &mdash; no ACR floor. <strong>Designation badges consolidated from six to three</strong> (AI Business Solutions, Cloud &amp; AI Platforms, Security), but this is a presentation change only: the six solution paths still drive scoring, requirements, and specializations, and how you qualify has not changed. <strong>CSP growth margins launch October 1, 2026</strong>, paying additional margin for new-to-offer, seat expansion, and adoption across select AI workloads &mdash; sandbox environments are available now to model the impact before it goes live.</div>
  </div>

  <!-- Partner quote -->
```

---

## Out of scope — flagged, not changed

`RESEARCH-DELTA.md` §6 was explicit that the July 2026 announcements **do not restate** the FY25/FY26 program dollar figures on this page, and confirming each needs Partner Center access I do not have. **None of the following were verified, and none are changed.** Treat every one as unverified until someone checks it in Partner Center.

| Location | Item | Fact ID |
|---|---|---|
| `:806` | `$4,875` annual Solutions Partner designation cost | `F-014` |
| `:811` | `95%` of legacy competency partners without a designation, TD SYNNEX internal, **FY25** | `F-038` |
| `:942` | `$350/yr` Partner Launch Benefits package | `F-092` |
| `:985` | `$5,000` Security Copilot credits, `$9,000` Azure bulk credits | `F-047`, `F-048` |
| `:1060`, `:1064` | Designation fee line, `MS-102 & SC-200 exams (~$165/exam)` | — |
| elsewhere | `$18,750` MCI on $500K CSP revenue, `$4,500` Azure credits, `$2,500` pilot setup fee, `$700` Azure credits | `F-045`, `F-095`, `F-084`, `F-108` |

**`:1064` deserves a note.** The investment table still budgets for **MS-102**, which FR-01 removes from the specialization requirements. The exam still exists and still counts toward the Modern Work designation (`:963`), so the line is not wrong — but a reader who has just read FR-01 will find it confusing. **Worth a follow-up once the Partner Center figures are verified.**

`F-038` is also now questionable on its own terms: given FR-05's expanded SMB eligibility, the share of legacy competency partners without a designation has probably moved since FY25. It is internal TD SYNNEX data, so only you can refresh it.

---

## Verification

```bash
git diff --stat main -- frontier.html
```

Expect `1 file changed, ~9 insertions(+), ~5 deletions(-)`. FR-04 removes 8 lines and FR-05 adds 5, so the net is close to flat despite two structural changes.

```bash
grep -c 'APL-7008\|APL-4002' frontier.html
```

Must return `0` for standalone requirement references — FR-01 mentions both, but only as retired.

```bash
grep -c 'measured outcomes, not projections' frontier.html
```

Must return `0`.

```bash
git diff main -- frontier.html | grep -E '^\+' | grep -cE 'style='
```

Must return `0` — this is a class-first file.
