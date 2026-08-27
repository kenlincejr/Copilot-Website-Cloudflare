# specs/starter-kit.spec.md

**Target file:** `customer-zero-starter-kit/index.html` (17.7 KB)
**Branch:** `refresh/starter-kit`
**Authored:** 2026-08-26, Phase 4
**Depends on:** [`RESEARCH-DELTA.md`](../RESEARCH-DELTA.md) §1, [`data/facts.json`](../data/facts.json)

---

## Why this file is in the refresh at all

It was not in your v2 target list. The Phase 2 sweep put it there: **28 registered claims, the third-highest count on the site**, and it carries the FY26 Q3 penetration figures — making it the file that was *closest* to current before this refresh and the one that will look *most* wrong after `refresh/cpb` merges.

Leave it out and the site ships three different penetration figures instead of two.

**This file is a separate design system** — `customer-zero-starter-kit/` uses its own `kit.css` and its own class vocabulary (`.stat-block`, `.stat-num`, `.stat-note`, `.source-note`). `DESIGN.md` §1–§4 do **not** apply here (prohibition 6). Every change below is text inside an existing class-styled element; no class, token, or component crosses the boundary.

**One thing this file does better than the rest of the site, and it must survive.** Its source notes already say the right things: *"4.4% is a derived calculation, not a Microsoft-stated customer percentage"* and *"Treat the 4.4% penetration as a calculation from disclosed Microsoft seat counts and a prior commercial-seat denominator."* That is exactly the epistemic care `cpb.spec.md` C-04 is trying to retrofit into `cpb.html`. **Preserve the hedging, change only the numbers.**

---

## Execution prompt

> You are applying `specs/starter-kit.spec.md` to `customer-zero-starter-kit/index.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**. In particular, do **not** edit `kit.css`, `become-customer-zero.html`, or `build-sellable-services.html`.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip and report.**
> - Do not add an inline `style=` attribute, a class, or any token from `DESIGN.md` — this directory is a separate design system.
> - Commit per change, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **5** |
| LOW risk | 2 |
| MED risk | 3 |
| HIGH risk | 0 |
| **Diff budget** | **+5 / −5 lines** |

Small, mechanical, and fully approvable in one pass. Every change is an in-place replacement.

**Sequencing:** must merge in the same window as `refresh/cpb` and `refresh/ledger`. Merging any one of the three alone leaves the site internally inconsistent.

---

### SK-01 · Update the paid-seat count
**Type:** value-swap · **Fact IDs:** `F-018` · **Risk:** LOW

```html before:SK-01
          <span class="stat-num">20M+</span>
          <span class="stat-label">Paid seats</span>
          <span class="stat-note">Microsoft FY26 Q3 earnings call, Apr 29 2026.</span>
```
```html after:SK-01
          <span class="stat-num">30M+</span>
          <span class="stat-label">Paid seats</span>
          <span class="stat-note">Microsoft FY26 Q4 earnings disclosure, Jul 29 2026.</span>
```

---

### SK-02 · Update the derived penetration
**Type:** value-swap · **Fact IDs:** `F-016`, `F-006` · **Risk:** MED
**Rationale:** The existing note already flags the denominator as "prior" — good instinct, and now more important, because Microsoft still has not restated it. The note is extended to name the trade estimate, matching the framing agreed for `cpb.html` C-04 and `ledger.html` L-05.

```html before:SK-02
          <span class="stat-num">~4.4%</span>
          <span class="stat-label">Derived penetration</span>
          <span class="stat-note">20M+ paid seats against the prior 450M+ Microsoft 365 commercial-seat denominator.</span>
```
```html after:SK-02
          <span class="stat-num">~6.6%</span>
          <span class="stat-label">Derived penetration</span>
          <span class="stat-note">30M+ paid seats against the prior 450M+ Microsoft 365 commercial-seat denominator, which Microsoft has not restated since Jan 2026; trade estimates near 464M would read 6.5%.</span>
```

---

### SK-03 · Update the evidence-table row
**Type:** text-rewrite · **Fact IDs:** `F-018`, `F-016`, `F-022`, `F-031` · **Risk:** MED
**Rationale:** Four facts in one row. The citation link must move from the FY26 Q3 earnings event to FY26 Q4. **The closing hedge — *"a derived calculation, not a Microsoft-stated customer percentage"* — is preserved verbatim.**

```html before:SK-03
<td>20M+ paid Microsoft 365 Copilot seats; using the prior 450M+ Microsoft 365 commercial paid-seat denominator yields roughly 4.4% derived penetration.</td><td><a href="https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q3">Microsoft FY26 Q3 earnings call, Apr 29 2026</a>; 4.4% is a derived calculation, not a Microsoft-stated customer percentage.</td>
```
```html after:SK-03
<td>30M+ paid Microsoft 365 Copilot seats; using the prior 450M+ Microsoft 365 commercial paid-seat denominator yields roughly 6.6% derived penetration.</td><td><a href="https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast">Microsoft FY26 Q4 earnings disclosure, Jul 29 2026</a>; 6.6% is a derived calculation, not a Microsoft-stated customer percentage.</td>
```

---

### SK-04 · Update the source note
**Type:** text-rewrite · **Fact IDs:** `F-016`, `F-022` · **Risk:** MED
**Rationale:** Same figures, third location. The Gartner reference and the "directional practitioner synthesis" caveat are preserved unchanged — neither was contradicted by the research.

```html before:SK-04
      <p class="source-note">Adoption-gap figures are drawn from Microsoft FY26 Q3 earnings context and Gartner 2024/2025 Copilot adoption research. Treat the 4.4% penetration as a calculation from disclosed Microsoft seat counts and a prior commercial-seat denominator, not a Microsoft-stated customer percentage. The blocker cards are directional practitioner synthesis, not separately sourced percentage claims.</p>
```
```html after:SK-04
      <p class="source-note">Adoption-gap figures are drawn from Microsoft FY26 Q4 earnings context and Gartner 2024/2025 Copilot adoption research. Treat the 6.6% penetration as a calculation from disclosed Microsoft seat counts and a prior commercial-seat denominator, not a Microsoft-stated customer percentage. The blocker cards are directional practitioner synthesis, not separately sourced percentage claims.</p>
```

---

### SK-05 · Update the remaining quarter label
**Type:** value-swap · **Fact IDs:** `F-022` · **Risk:** LOW
**Rationale:** `F-022` (`FY26 Q3`) has three occurrences in this file. SK-01 and SK-03 cover two. This is the third.
**Execution note:** if this `BEFORE` does not match after SK-01 and SK-03 have been applied, that means only two occurrences existed and the third was inside a string those changes already rewrote. **Skip and report — do not hunt for it.**

```html before:SK-05
Microsoft FY26 Q3 earnings context
```
```html after:SK-05
Microsoft FY26 Q4 earnings context
```

---

## Out of scope — flagged, not changed

| Location | Item | Fact ID | Why untouched |
|---|---|---|---|
| `:64` | Forrester TEI `116%` three-year ROI, `$19.7M` NPV, ~10-month payback | `F-064`, `F-082` | Forrester benchmark set — **unverified**, `RESEARCH-DELTA.md` §8 |
| `:93` | Forrester SMB model `132%–353%` ROI, `$358K–$955K` NPV | `F-027`, `F-093`, `F-094` | Same |
| `:65` | `20%` higher win rate, `5%` more sales opportunities (Microsoft Partner Blog, Dec 16 2025) | `F-025`, `F-065` | Sourced and dated; not contradicted by anything in the research |
| `:64` | Microsoft Inside Track, Aug 28 2025 | `F-064` | Sourced and dated |
| `become-customer-zero.html` | 9 registered claims | various | **Separate file, separate branch.** Prohibition 9 — if a change here appears to need it, stop and report. |

`become-customer-zero.html` carries `F-009` (`$15` Agent 365) and `F-058` (`82%` Work Trend Index). The Agent 365 prerequisite change applies there too. **It needs its own small spec** — deliberately not folded into this one.

---

## Verification

```bash
git diff --stat main -- customer-zero-starter-kit/index.html
```

Expect `1 file changed, 5 insertions(+), 5 deletions(-)`.

```bash
grep -c '4\.4%\|20M+\|FY26 Q3' customer-zero-starter-kit/index.html
```

Must return `0`.

```bash
git diff --stat main -- customer-zero-starter-kit/kit.css customer-zero-starter-kit/become-customer-zero.html customer-zero-starter-kit/build-sellable-services.html
```

Must return empty — no sibling file may be touched.
