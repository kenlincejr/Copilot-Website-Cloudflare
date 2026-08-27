# specs/CopilotIB-urlfix-seams.spec.md

**Target file:** `CopilotIB.html`
**Branch:** `refresh/copilot-ib`
**Authored:** 2026-08-27, correctness pass — continuation
**Depends on:** [`CopilotIB-urlfix.spec.md`](CopilotIB-urlfix.spec.md) — **must be applied first**

---

## Why this spec exists

`CopilotIB-urlfix.spec.md` corrected the false claim inside Section 2 but left three fragments of connective prose that were written to introduce the *old* argument. They are not wrong in isolation; they no longer follow from the content around them. This is the class of defect no anchor check or design lint catches — only reading the section end to end does.

Three seams, found on read-back:

1. `<h3>What the URL Field Actually Does</h3>` is followed by *"one of two things happens depending on which toggle is active"* — but the corrected table no longer describes two states of one toggle. It contrasts a scoped site source with open web search.
2. The table's first column header is still `Toggle State`. Neither corrected row is a toggle state.
3. `<h3>What Actually Works Instead</h3>` introduced the alternatives to a capability the document said was broken. Now that the capability works, "instead" contradicts the section above it.

Separating these from the eight substantive corrections keeps that spec reviewable as a single argument, and makes clear these three are consequences of it rather than independent findings.

---

## Execution prompt

> You are applying `specs/CopilotIB-urlfix-seams.spec.md` to `CopilotIB.html` and **nothing else**.
> - `specs/CopilotIB-urlfix.spec.md` must already be applied. If any `BEFORE` below fails to match, verify that first and **stop**.
> - Locate each `BEFORE`, confirm it matches **exactly once**, replace with `AFTER` verbatim.
> - Class-first file. Do not add inline styles. Do not restyle the table — `DESIGN.md` C9, the element selectors handle it.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **3** |
| LOW risk | 3 |
| **Diff budget** | **+3 / −3 lines** |
| New CSS classes | **0** |
| New tokens / colours | **0** |

All three are single-line text replacements inside existing markup. Any structural change is a stop signal.

---

### IB-09 · Correct the table's lead-in sentence
**Type:** text-rewrite · **Claim IDs:** `B-015` · **Risk:** LOW
**Rationale:** "One of two things happens depending on which toggle is active" described the old OFF/ON framing. The corrected table contrasts two different retrieval behaviours.

```html before:IB-09
<p>When you paste a URL into the "Enter a URL or name or drop files here" field and submit it, one of two things happens depending on which toggle is active:</p>
```
```html after:IB-09
<p>Scoping an agent to named sites and letting it search the open web are two different behaviours, and the distinction matters more than the field's plain appearance suggests:</p>
```

---

### IB-10 · Correct the table's first column header
**Type:** value-swap · **Claim IDs:** `B-015` · **Risk:** LOW
**Rationale:** Neither corrected row is a toggle state. `DESIGN.md` C9 — `th` styling is handled by the element selector; only the text changes.

```html before:IB-10
  <thead><tr><th>Toggle State</th><th>What Happens to the URL</th></tr></thead>
```
```html after:IB-10
  <thead><tr><th>Configuration</th><th>What the Agent Actually Does</th></tr></thead>
```

---

### IB-11 · Correct the alternatives heading
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** "Instead" presupposes the URL source does not work. The pair of callouts beneath it is still valuable — it now contrasts a URL that will silently fail with the three configurations that hold up — so the heading is corrected rather than the block removed.

```html before:IB-11
<h3>What Actually Works Instead</h3>
```
```html after:IB-11
<h3>When a URL Is the Wrong Tool</h3>
```

---

## Out of scope — flagged, not changed

| Item | Why it is not in this spec |
|---|---|
| The green callout's three alternatives | Still correct and still useful. Item 3 ("enable Search all websites and write an explicit rule") remains the right advice for content that fails the URL rules. |
| Section 2's `<h2>` and `id` | Set by `IB-01`. Untouched here. |
| The rest of the document's connective prose | Sections 3–8 were not edited by the correctness pass, so no seams were introduced there. They are re-read as part of the follow-on rewrite. |
