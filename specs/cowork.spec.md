# specs/cowork.spec.md

**Target file:** `cowork.html` (1,811 lines, 116 KB)
**Branch:** `refresh/cowork`
**Authored:** 2026-08-26, Phase 4
**Depends on:** [`DESIGN.md`](../DESIGN.md), [`RESEARCH-DELTA.md`](../RESEARCH-DELTA.md) §5

---

## Why this file is different

The other specs correct numbers. This one corrects a **premise**.

`cowork.html` is written throughout as though Copilot Cowork is a Frontier preview and Microsoft 365 E7 is a forthcoming SKU. Both went generally available months ago — **Cowork on 16 June 2026**, E7 on 1 May 2026. The page also runs a section titled *"What changed in the last 90 days"* whose most recent entry is 17 April 2026, and a byline reading `Last updated: April 22, 2026`.

A page that advertises its own recency and is four months stale is worse than a page with no date at all. That is why `RESEARCH-DELTA.md` §5 puts this file first after the penetration cluster.

**The single largest gap is not a stale date.** Cowork now bills on **consumption** — Copilot Credits at $0.01 each, typical task $0.70–$15 — and `cowork.html` does not mention this anywhere. For a playbook built on managed services and cost governance, consumption billing is a service line, not a footnote.

`cowork.html` is a **class-first file** (19 inline styles across 1,811 lines). Prefer classes. The one inline style this spec touches (W-01) already exists and its signature is preserved byte-for-byte.

---

## Execution prompt

> You are applying `specs/cowork.spec.md` to `cowork.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report**.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip and report.**
> - Do not introduce any color, font, size, radius, or shadow not in `DESIGN.md`. This is a class-first file — do not add inline styles.
> - Commit per change, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **6** |
| LOW risk | 1 |
| MED risk | 5 |
| HIGH risk | 0 |
| **Diff budget** | **+7 / −6 lines** (W-05 adds one line) |

**Scope note.** This spec fixes the *provably wrong* framings and the *missing billing model*. It does **not** rewrite the "What changed in the last 90 days" section wholesale — see "Deferred" below. Six changes make the page honest. Making it current is a larger job that needs your input on scope.

---

### W-01 · Refresh the byline stamp
**Type:** value-swap · **Fact IDs:** none · **Risk:** LOW
**Rationale:** This is the only `Last updated` stamp on the page, and it is the thing that makes every other staleness visible. It must move with this spec, not in Phase 6.
**Design:** Existing inline style preserved byte-for-byte. `DESIGN.md` §5 records this file's stamp format (`Last updated: Month DD, YYYY`, with a colon) — kept.
**Execution note:** set the date to the day this branch is merged, not necessarily the date below.

```html before:W-01
  <div style="font-size:.95rem;color:#6b7280;margin-top:10px;">Prepared by: <strong>Ken Lince</strong> &mdash; Sr. Director, Cloud Engineering, <strong>TD SYNNEX</strong> &nbsp;&middot;&nbsp; Last updated: April 22, 2026</div>
```
```html after:W-01
  <div style="font-size:.95rem;color:#6b7280;margin-top:10px;">Prepared by: <strong>Ken Lince</strong> &mdash; Sr. Director, Cloud Engineering, <strong>TD SYNNEX</strong> &nbsp;&middot;&nbsp; Last updated: August 26, 2026</div>
```

---

### W-02 · E7 is GA, not a preview (stat ribbon)
**Type:** text-rewrite · **Fact IDs:** `F-049`, `F-007` · **Risk:** MED
**Rationale:** The `$99` price is **verified correct**. The parenthetical is not — E7 has been GA since 1 May 2026 via EA, EAS, MCA-E, and CSP. The FY27 promotions running to 31 Dec 2026 are also worth surfacing, since they are live now.
**Design:** Text inside the existing `.sr-l` element. The `.sr-s` source line beneath it is **not** touched.

```html before:W-02
    <div class="sr-l">Per user/month list price for M365 E7, the broad-availability SKU (Frontier preview today; GA May&nbsp;1,&nbsp;2026)</div>
```
```html after:W-02
    <div class="sr-l">Per user/month list price for M365 E7, GA since May&nbsp;1,&nbsp;2026 via EA, EAS, MCA-E, and CSP &mdash; FY27 promotions run through Dec&nbsp;31,&nbsp;2026</div>
```

---

### W-03 · E7 is GA, not a preview (comparison table)
**Type:** text-rewrite · **Fact IDs:** `F-049`, `F-007` · **Risk:** MED
**Rationale:** Same defect, second location. `DESIGN.md` C9 — plain semantic table, no inline restyling.

```html before:W-03
      <td>M365 Frontier preview today &middot; E7 at <strong>$99/user/mo</strong> &middot; GA May 1, 2026</td>
```
```html after:W-03
      <td>GA since May 1, 2026 &middot; E7 at <strong>$99/user/mo</strong> &middot; Cowork itself GA Jun 16, 2026 on usage-based billing</td>
```

---

### W-04 · Access and geography — correct the availability premise
**Type:** text-rewrite · **Fact IDs:** `F-049`, `F-007` · **Risk:** MED
**Rationale:** *"Frontier preview today. Broad availability is gated on M365 E7 … GA May 1, 2026"* is now wrong on both halves. Cowork went GA worldwide on 16 June 2026. The other two bullets in this list (Anthropic opt-in in EU/EFTA/UK; unavailable in GCC/GCC High/DoD/sovereign) were **not** contradicted by anything in the research and are left alone.

```html before:W-04
  <li><strong>Frontier preview today.</strong> Broad availability is gated on M365 E7 ($99/user/month), GA May 1, 2026.</li>
```
```html after:W-04
  <li><strong>Generally available worldwide since June 16, 2026.</strong> Cowork now bills on consumption rather than being gated behind a preview; M365 E7 ($99/user/month) has been GA since May 1, 2026.</li>
```

---

### W-05 · Add the billing model — **the important one**
**Type:** block-insert · **Fact IDs:** none yet — register these in `facts.json` · **Risk:** MED
**Rationale:** Cowork moved to **usage-based billing on 16 June 2026**. It bills in **Copilot Credits at $0.01 each**; a typical task runs **$0.70–$15**. Tenants with a user active in the Frontier program between 30 March and 16 June 2026 had a grace period to 1 July 2026 (now expired). Admin controls include spending limits, usage alerts, user-level controls, reporting, and prepaid plans. August 2026 added Copilot Credits visibility and overage handling in the M365 admin center.

None of this is on the page. It is the single most commercially relevant fact about Cowork for a managed-services practice — it converts Cowork from a licensing conversation into a cost-governance retainer.

**Design:** `DESIGN.md` **C1 · Callout**, `warn` variant. Used because consumption billing with no ceiling is a caution, not an aside. Class-based, consistent with this file's convention. Inserted immediately after the corrected availability bullet list.
**Prices:** these are Microsoft's published rates, in scope under `DESIGN.md` prohibition 10. No service pricing is implied or added.

```html before:W-05
  <li><strong>Unavailable in GCC, GCC High, DoD, and sovereign clouds.</strong></li>
</ul>
```
```html after:W-05
  <li><strong>Unavailable in GCC, GCC High, DoD, and sovereign clouds.</strong></li>
</ul>

<div class="callout warn">
  <div class="callout-title">Cowork bills on consumption, not seats</div>
  <div class="callout-body">Since <strong>June 16, 2026</strong> Cowork bills separately from the Copilot licence, metered in <strong>Copilot Credits at $0.01 each</strong>. A single task typically runs <strong>$0.70 to $15</strong> depending on the model, how much organisational context it retrieves, how many tools it calls, and how long it runs. The Frontier grace period expired July 1, 2026. Admins get spending limits, usage alerts, user-level controls, reporting, and prepaid plans &mdash; and as of August 2026, Copilot Credits visibility and overage handling in the Microsoft 365 admin centre. For a managed practice this is the opening: an unbounded consumption line on a customer&rsquo;s invoice is a governance engagement, not a licence renewal.</div>
</div>
```

---

### W-06 · Correct the model in the capability matrix
**Type:** value-swap · **Fact IDs:** `F-019` · **Risk:** MED
**Rationale:** The matrix states Cowork's model is *"Fixed: Opus 4.7"*. As of June 2026, **Claude Fable 5 (preview)** is available as an opt-in, admin-controlled model in Cowork (Frontier), and Cowork GA brought **multi-model support**. "Fixed" is now the wrong word in two ways.
**Design:** `DESIGN.md` C9 — table cell content only.

```html before:W-06
<td>Fixed: Opus 4.7</td>
```
```html after:W-06
<td>Multi-model since GA; Fable 5 opt-in in Frontier</td>
```

---

## Deferred — needs your scope decision

### The "What changed in the last 90 days" section (`cowork.html:831–839`)

Five bullets, all dated February–April 2026. The heading is a promise the content no longer keeps. Everything below happened **after** the newest bullet:

| Date | Event |
|---|---|
| 16 Jun 2026 | **Cowork GA + usage-based billing** |
| Jun 2026 | GA worldwide: multi-model, new plugins, updated skill management and navigation, **Purview integration**, branded templates, image creation |
| Jun 2026 | **Claude Fable 5 (preview)** as opt-in admin-controlled model in Cowork (Frontier) |
| Jul 2026 | Claude added to **Copilot Chat** for active subscribers; Tasks tab; M365 Copilot app auto-install resumes on eligible commercial Windows devices |
| Aug 2026 | Cost Management: Copilot Credits visibility, overage handling, policy enforcement |

I have **not** written this as a change because it is a rewrite, not an edit, and the right scope is your call:

- **Option A — replace the five bullets** with the five above and retitle to a dated window. Contained, ~6 lines, MED risk.
- **Option B — retitle only** to *"What changed between February and April 2026"* and leave the content. One-line change, honest, but leaves a four-month hole in a page whose whole value is currency.
- **Option C — full section rewrite**, restructured around GA as the dividing line. HIGH risk, needs its own spec revision.

**Recommend A.** It is the smallest change that makes the heading true.

### Also deferred

| Item | Note |
|---|---|
| `cowork.html:810`, `:862`, `:964`, `:1218`, `:1717` | Five further Opus 4.7 references in prose and source lists. W-06 fixes the one place the model is *specified as fixed*. The rest are historically accurate statements about April 2026 and are not wrong — but a reader will notice the page names Opus 4.7 six times and Fable 5 once. **Worth a follow-up pass.** |
| GeekWire `Mar 9 2026` citation on the `$99` stat | Still accurate as a citation for the price. Left alone. |

---

## Verification

```bash
git diff --stat main -- cowork.html
```

Expect `1 file changed, ~13 insertions(+), ~6 deletions(-)` — W-05 adds a 5-line block, the other five changes are in-place.

```bash
git diff main -- cowork.html | grep -E '^\+' | grep -cE 'style='
```

Must return `0` **except** for W-01, which preserves an existing inline style. Expected result: `1`.

```bash
grep -c 'Frontier preview today' cowork.html
```

Must return `0`.
