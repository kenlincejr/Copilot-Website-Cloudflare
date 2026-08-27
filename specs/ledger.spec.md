# specs/ledger.spec.md

**Target file:** `ledger.html` (905 lines, 52 KB)
**Branch:** `refresh/ledger`
**Authored:** 2026-08-26, Phase 4
**Depends on:** [`DESIGN.md`](../DESIGN.md) §6, [`RESEARCH-DELTA.md`](../RESEARCH-DELTA.md), [`data/facts.json`](../data/facts.json)

---

## Design note — read before executing

`ledger.html` is a **separate design language** (`DESIGN.md` §6, decided 2026-08-26). Fraunces / Public Sans / IBM Plex Mono, a paper-and-ink token vocabulary, gold accent, dual light/dark plus a print override.

**Nothing from `DESIGN.md` §1–§4 applies here.** No `--navy`, no `--teal-light`, no `.callout`, no C1–C13 snippet. This file is **pure-class with only 2 inline styles in 905 lines** — adding a `style=` attribute is a prohibition-2 violation.

Every change below is text inside an existing class-styled element. **No class is added, removed, or restyled.**

---

## Execution prompt

> You are applying `specs/ledger.spec.md` to `ledger.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip and report.**
> - **Do not add any inline `style=` attribute.** Do not add or rename a class. Do not import any token or component from `DESIGN.md` §1–§4 — they do not apply to this file.
> - Commit per change, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **8** |
| LOW risk | 5 |
| MED risk | 3 |
| HIGH risk | 0 |
| **Diff budget** | **+8 / −8 lines** |

`ledger.html` mirrors `cpb.html`'s headline arithmetic in a much smaller surface, so this spec is the same story told in eight changes instead of fifteen. It carries **no** Section B licensing content and **no** HIGH-risk items — it can be approved in one pass.

**Sequencing:** apply after `refresh/cpb` has been reviewed. If you change your mind on the C-01/C-04 framing there, L-01 and L-05 must move with it.

---

### L-01 · Invert the section heading
**Type:** text-rewrite · **Fact IDs:** `F-005` · **Risk:** MED
**Rationale:** Matches `cpb.spec.md` C-01. "Three percent" is no longer the finding.
**Design:** Text inside the existing `<h2>` in `.item-body`. No attributes involved.

```html before:L-01
    <h2>Three percent of the installed base is paying for Copilot.</h2>
```
```html after:L-01
    <h2>Ninety-three percent of the installed base still isn&rsquo;t paying for Copilot.</h2>
```

---

### L-02 · Replace the counter-headline lede
**Type:** text-rewrite · **Fact IDs:** `F-052` · **Risk:** MED
**Rationale:** Microsoft did not restate a YoY paid-seat growth percentage at FY26 Q4, so `+160%` has no current basis. Per your decision, the sevenfold 50k+ seat customer stat replaces it. The "same data, different headline" device survives intact — it just points at a different headline.
**Design:** Text inside `<p class="lede">`, `<strong>` preserved.

```html before:L-02
    <p class="lede">Microsoft reported <strong>+160% year-over-year paid-seat growth</strong> from the same disclosure. Same data, different headline &mdash; and the headline below is the one your customer already read.</p>
```
```html after:L-02
    <p class="lede">From the same disclosure, Microsoft reported that customers buying <strong>50,000+ seats grew more than sevenfold year-over-year</strong>. Same data, different headline &mdash; and the headline below is the one your customer already read.</p>
```

---

### L-03 · Update the numerator
**Type:** value-swap · **Fact IDs:** `F-060` · **Risk:** LOW

```html before:L-03
      <div class="n"><span class="v">15M</span><span class="l">paid Copilot seats</span></div>
```
```html after:L-03
      <div class="n"><span class="v">30M+</span><span class="l">paid Copilot seats</span></div>
```

---

### L-04 · Update the result
**Type:** value-swap · **Fact IDs:** `F-005` · **Risk:** LOW
**Note:** The `~450M` denominator span is deliberately **unchanged** — see L-05.

```html before:L-04
      <div class="n res"><span class="v">3.3%</span><span class="l">paid penetration</span></div>
```
```html after:L-04
      <div class="n res"><span class="v">~6.6%</span><span class="l">paid penetration</span></div>
```

---

### L-05 · Rewrite the source line
**Type:** text-rewrite · **Fact IDs:** `F-005`, `F-006`, `F-021`, `F-033`, `F-034` · **Risk:** MED
**Rationale:** Five facts at once, same as `cpb.spec.md` C-04. The old line claims Microsoft disclosed both numerator and denominator in one quarter; that is no longer true. Kept shorter than the `cpb.html` version — this is a one-page ledger, and the long caveat belongs in the playbook, not here.
**Design:** Text inside `<p class="src">`, `<b>` preserved.

```html before:L-05
    <p class="src"><b>Source:</b> Microsoft FY26 Q2 earnings disclosure (Jan 28, 2026), numerator and denominator. The 3.3% ratio is independent analyst arithmetic &mdash; SAMexpert (Feb 5, 2026), replicated by Stackmatix (Apr 2026) and Office 365 IT Pros.</p>
```
```html after:L-05
    <p class="src"><b>Source:</b> Numerator from Microsoft&rsquo;s FY26 Q4 earnings disclosure (Jul 29, 2026) &mdash; &ldquo;over 30 million paid seats.&rdquo; Denominator is Microsoft&rsquo;s last stated commercial figure, 450M+ (Jan 28, 2026), not restated since; trade estimates put the base nearer 464M, which reads 6.5%. The ratio is analyst arithmetic, not a Microsoft metric.</p>
```

---

### L-06 · Update the market-split lede
**Type:** value-swap · **Fact IDs:** `F-005` · **Risk:** LOW

```html before:L-06
    <p class="lede">The 3.3% splits the installed base into two addressable motions &mdash; and the same five services sell into both.</p>
```
```html after:L-06
    <p class="lede">The 6.6% splits the installed base into two addressable motions &mdash; and the same five services sell into both.</p>
```

---

### L-07 · Acquisition share
**Type:** value-swap · **Fact IDs:** `F-142`, `F-005` · **Risk:** LOW

```html before:L-07
        <div class="pct">96.7%</div>
        <div class="nm">Acquisition</div>
```
```html after:L-07
        <div class="pct">93.4%</div>
        <div class="nm">Acquisition</div>
```

---

### L-08 · Rescue share
**Type:** value-swap · **Fact IDs:** `F-005` · **Risk:** LOW

```html before:L-08
        <div class="pct">3.3%</div>
        <div class="nm">Rescue</div>
```
```html after:L-08
        <div class="pct">6.6%</div>
        <div class="nm">Rescue</div>
```

---

# Section C — a source you supplied, 2026-08-26

### L-09 · Replace the unattributed 64% with a sourced figure
**Type:** text-rewrite · **Fact IDs:** `F-143` (new) · **Risk:** MED
**Rationale:** The out-of-scope table below (as originally authored) flagged `ledger.html:534`'s *"64% of licensed seats go unused"* as unregistered and unattributed — a load-bearing claim for the Rescue motion with no citation anywhere near it. You supplied a source for a closely related, properly-traceable figure: only 20–30% of purchased Copilot seats see sustained weekly use. Traced to independent survey synthesis (Gartner and Forrester enterprise surveys plus reseller channel data, 2025–2026), consistent across multiple outlets — same epistemic category as the Forrester TEI benchmark set already in this document (`F-001`), not a single Microsoft-stated number. Registered as `F-143`.

**This does not just add a citation to the old number — it replaces it.** "64% unused" and "20–30% see weekly use" are not the same measurement (unused could mean zero use ever; not-weekly-active could still include monthly users), so keeping both would plant two different, adjacent-looking percentages for the same argument. The sourced figure replaces the unsourced one rather than sitting beside it.

```html before:L-09
        <p>They wrote the check and the renewal clock is running. <strong>64% of licensed seats go unused</strong> week over week without a structured program. Get there before the usage report writes the non-renewal for them.</p>
```
```html after:L-09
        <p>They wrote the check and the renewal clock is running. Independent surveys put <strong>weekly active use at just 20&ndash;30% of purchased seats</strong> without a structured program. Get there before the usage report writes the non-renewal for them.</p>
```

---

## Out of scope — flagged, not changed

| Location | Item | Why untouched |
|---|---|---|
| `ledger.html:554` | `$8.45` (`F-001`) | Forrester/IDC benchmark set. **Unverified** — see `RESEARCH-DELTA.md` §8. |
| `ledger.html:795` | `$1,750`–`$10,000+` MCI range (`F-039`, `F-040`) | Microsoft program figures, not restated in the July 2026 announcements. Flagged as unverified in `RESEARCH-DELTA.md` §6, not cleared. |
| Whole file | Fonts, tokens, dark/print overrides | `DESIGN.md` §6 — deliberately distinct. Prohibition 6. |

---

## Verification

```bash
git diff --stat main -- ledger.html
```

Expect `1 file changed, 8 insertions(+), 8 deletions(-)`. Every change is an in-place replacement, so line count must not move.

```bash
git diff main -- ledger.html | grep -E '^\+' | grep -c 'style='
```

Must return `0` — no inline style may be introduced into this file.

```bash
grep -c 'Fraunces\|Public Sans\|IBM Plex Mono' ledger.html
```

Must be unchanged from `main`.
