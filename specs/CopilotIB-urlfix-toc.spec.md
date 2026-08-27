# specs/CopilotIB-urlfix-toc.spec.md

**Target file:** `CopilotIB.html`
**Branch:** `refresh/copilot-ib`
**Authored:** 2026-08-27, correctness pass — defect fix
**Depends on:** [`CopilotIB-urlfix.spec.md`](CopilotIB-urlfix.spec.md) — **must be applied first**

---

## Why this spec exists

**This is a defect in `CopilotIB-urlfix.spec.md`, recorded rather than quietly folded in.**

That spec's invariant budget asserted *"TOC is untouched"* and instructed the executor to stop if any change reached `<nav id="toc">`. That was wrong. `IB-01` retitled Section 2 from *"The URL Problem: Why It's There and Why It Doesn't Work"* to *"Website URLs: A Real Source, With Narrow Rules"* — and the table of contents names every section by its title. Leaving the TOC alone meant the document's contents list still advertised the retracted claim, in the one place a reader looks first.

Every mechanical gate passed. `speccheck` was 8/8. The anchor-resolution check was clean, because `href="#section-2"` still resolves to `id="section-2"` — the *link* was never broken, only the *label* on it. The design lint found nothing because no value changed.

It was caught by rendering the page and reading it. That is the argument for keeping Gate 7 non-optional, and the reason the follow-on rewrite — which renumbers and retitles far more than one section — must treat the TOC as a first-class change target rather than an invariant.

**Correction to the parent spec's invariant:** any change to an `<h2>` title implies a change to its TOC entry. The two must move together or the document contradicts itself.

---

## Execution prompt

> You are applying `specs/CopilotIB-urlfix-toc.spec.md` to `CopilotIB.html` and **nothing else**.
> - `specs/CopilotIB-urlfix.spec.md` must already be applied.
> - Locate each `BEFORE`, confirm it matches **exactly once**, replace with `AFTER` verbatim.
> - The `href="#section-2"` fragment is preserved byte-for-byte. Only the link text changes. If the `href` differs in your diff, **stop**.

---

## Summary

| | |
|---|---:|
| Changes | **2** |
| LOW risk | 2 |
| **Diff budget** | **+2 / −2 lines** |
| Anchors changed | **0** |
| New CSS classes | **0** |

---

### IB-12 · Update the TOC entry to match the retitled section
**Type:** value-swap · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** The contents list is the most-read line in the document and it still states the retracted claim. Text inside the existing `<a>` only; `href` untouched so no anchor moves.

```html before:IB-12
      <li><a href="#section-2">The URL Problem: Why It's There and Why It Doesn't Work</a></li>
```
```html after:IB-12
      <li><a href="#section-2">Website URLs: A Real Source, With Narrow Rules</a></li>
```

---

### IB-13 · Correct the document subtitle
**Type:** text-rewrite · **Claim IDs:** `B-014` · **Risk:** LOW
**Rationale:** *"why URLs behave the way they do"* is not false, but it is the masthead promise of a document whose central URL argument has been replaced. Restating it around the behaviour that actually catches people keeps the promise accurate.
**Design:** Existing `.subtitle` class, text only.

```html before:IB-13
  <div class="subtitle">Technical Reference — How the agent actually uses knowledge, and why URLs behave the way they do</div>
```
```html after:IB-13
  <div class="subtitle">Technical Reference — How the agent actually uses knowledge, and why sources fail without telling you</div>
```

---

## Out of scope — flagged, not changed

| Item | Why it is not in this spec |
|---|---|
| `Classification: TD SYNNEX Internal — Confidential` (line 578) | Removed in the follow-on rewrite alongside the last-updated stamp, so the header is edited once. Still visible on a public page until then. |
| The other seven TOC entries | Their sections were not retitled by the correctness pass. Sections 3, 5 and 6 are retitled or removed by the follow-on rewrite, which updates their TOC entries in the same spec. |
