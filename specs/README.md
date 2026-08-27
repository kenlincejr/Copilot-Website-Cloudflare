# specs/ — Phase 4 change specs

**Authored 2026-08-26.** Five specs, **39 atomic changes**, every `BEFORE` anchor verified to match its target file **exactly once**.

You review these. You do not review diffs.

---

## The set

| Spec | Target | Changes | LOW | MED | HIGH | Diff budget |
|---|---|---:|---:|---:|---:|---|
| [`cpb.spec.md`](cpb.spec.md) | `cpb.html` | 15 | 7 | 6 | **2** | +16 / −16 |
| [`ledger.spec.md`](ledger.spec.md) | `ledger.html` | 8 | 5 | 3 | 0 | +8 / −8 |
| [`cowork.spec.md`](cowork.spec.md) | `cowork.html` | 6 | 1 | 5 | 0 | +7 / −6 |
| [`frontier.spec.md`](frontier.spec.md) | `frontier.html` | 5 | 0 | 3 | **2** | +9 / −5 |
| [`starter-kit.spec.md`](starter-kit.spec.md) | `customer-zero-starter-kit/index.html` | 5 | 2 | 3 | 0 | +5 / −5 |
| | **total** | **39** | **15** | **20** | **4** | |

---

## How to review this in twenty minutes

**Read four changes properly.** They are the only ones where a spec is asking you to decide something rather than execute something:

1. **`cpb.spec.md` C-09** — the funnel's `0.17` third stage. It rests on an unsourced 5.15% power-user rate. Doubling it assumes that rate survived a doubling in penetration, and there is no evidence either way. Three options laid out; **my recommendation is B, drop the stage.** *Blocked until you answer.*
2. **`cpb.spec.md` C-10** — the caption clause that follows from C-09. `about three` → `about seven` is safe; `one in six hundred` inherits C-09's uncertainty.
3. **`frontier.spec.md` FR-01** — the Copilot Specialization requirements. The single highest-value change in the refresh. **Ship this one even if you ship nothing else.**
4. **`frontier.spec.md` FR-04** — removing the `96%` and `51%` stats. If you have the internal Microsoft deck they came from, say so and I will respec this as an attribution change instead of a deletion.

**Skim the 20 MED changes.** They are prose rewrites inside existing markup — the wording is the thing to check, not the mechanics.

**Approve the 15 LOW changes in a block.** Every one is a value swap inside markup whose style attributes are preserved byte-for-byte.

---

## Merge order

```
      ledger.html already on main (baseline for all branches)
                        │
   ┌──────────┬─────────┼──────────┬────────────────┐
   │          │         │          │                │
refresh/    refresh/  refresh/  refresh/       refresh/
  cpb       ledger  starter-kit  cowork         frontier
   │          │         │          │                │
   └──── merge together ┘      independent      independent
      (penetration cluster)
```

**The three left-hand branches must merge in the same window.** `cpb.html`, `ledger.html`, and `customer-zero-starter-kit/index.html` all carry the penetration cluster. Merging one alone leaves the site stating two different penetration figures — the exact defect this refresh exists to fix.

`refresh/cowork` and `refresh/frontier` are independent and can merge whenever they are reviewed. `refresh/frontier` is the one with the most urgent real-world consequence.

---

## The gate before Phase 5

Two things are still open. Both are in `cpb.spec.md`:

- **C-09** is explicitly blocked pending your choice of option A, B, or C.
- **C-10** follows C-09 and cannot be finalised before it.

Everything else is executable as written.

---

## Tools

Verify a spec still applies before executing it:

```bash
python tools/speccheck.py --all
```

Verify a single spec:

```bash
python tools/speccheck.py specs/cpb.spec.md cpb.html
```

After execution, confirm every change landed (every `BEFORE` should now match **zero** times):

```bash
python tools/speccheck.py specs/cpb.spec.md cpb.html --applied
```

Phase 6 — catch a cascade fact applied to some files but not others:

```bash
python tools/check-facts.py --cascade
```

**Baseline as of authoring:** `speccheck --all` reports 39 ok / 0 failed. `check-facts` reports 271/271 anchors resolving uniquely. If either degrades before Phase 5 starts, something edited a target file outside this process.

---

## What every spec guarantees

- Every `BEFORE` string was verified to match **exactly once** at authoring time and is re-verifiable with `speccheck`.
- Every `AFTER` preserves the original style attributes **byte-for-byte** unless the change is explicitly a design change with its own justification. None of these 39 are.
- Changes are **independently revertible**. Skipping one does not break the next.
- Every spec carries a **diff budget**. If execution's actual diff exceeds it, that is a stop signal, not a rounding error.
- Every spec has an **"Out of scope — flagged, not changed"** table recording what was deliberately left alone and why. Nothing was silently skipped.

---

## What is deliberately not here

| | Why |
|---|---|
| `customer-zero-starter-kit/become-customer-zero.html` | 9 registered claims including the Agent 365 prerequisite. **Needs its own small spec.** Not folded into `starter-kit.spec.md` — one file per spec, per prohibition 9. |
| `cowork.html`'s "last 90 days" section | A rewrite, not an edit. Three scope options are laid out at the foot of `cowork.spec.md`; **recommend option A.** |
| `shadowai.html`, `cowork-session.html` | Net-new pages. Slipped per your 2–6 week deadline decision. |
| `cpbops.html`, `cpbbackup.html` | `cpbops.html` carries 16 claims, none in the penetration cluster and none contradicted by the research. `cpbbackup.html` is a stale fork — see `DESIGN.md` §7. |
| Forrester / IDC benchmark set | **Unverified.** `RESEARCH-DELTA.md` §8. No spec touches a figure that has not been checked. |
| `frontier.html` FY25/FY26 program dollar figures | **Unverified** — needs Partner Center access. Every one is listed in `frontier.spec.md`'s out-of-scope table. |
