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
| Changes | **7** |
| LOW risk | 1 |
| MED risk | 6 |
| HIGH risk | 0 |
| **Diff budget** | **+21 / −14 lines** |

W-05 inserts a 5-line callout and W-07 replaces a 7-line list with a 9-line one. The other five changes are in-place.

If insertions exceed 25 or deletions exceed 17, **stop**.

**Scope note.** These seven changes fix every *provably wrong* framing on the page, add the *missing billing model*, and close the four-month currency gap. No HIGH-risk items — approvable in one pass.

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

### W-07 · Replace the "last 90 days" bullets
**Type:** block-remove + block-insert · **Fact IDs:** none registered — **add these to `facts.json`** · **Risk:** MED
**Decision:** *You chose option A, 2026-08-26.*
**Rationale:** The section heading promises currency and the newest bullet is dated 17 April 2026. Five material things happened after it, and the section as written omits every one — including Cowork's own general availability. Replacing the content is the smallest change that makes the heading true.

The heading is retitled to a **dated window** rather than a rolling one. A rolling "last 90 days" heading is a promise that decays the moment it ships; a dated window stays honest as it ages.

**Design:** Plain `<ul>`/`<li>` with `<strong>` date leads, exactly matching the list idiom being replaced. No class, no inline style, no new token. `cowork.html` is class-first.
**Preserved:** the `<h3>` element itself and the `<p>Source:...</p>` line that follows the list are **not** touched by this change — the Opus 4.7 citation below remains accurate for the April entry it supports.

**Ordering note:** apply W-07 **after** W-06. Both touch model naming, and W-06's anchor is a table cell that this change does not overlap.

```html before:W-07
<h3>What changed in the last 90 days (and why it matters)</h3>
<ul>
  <li><strong>Feb 10, 2026</strong> &mdash; Claude Cowork hit Windows GA. Anthropic now has a mature <em>non</em>-coding desktop agent that competes directly with Copilot Cowork on the local-file side.</li>
  <li><strong>March 2026</strong> &mdash; 1M-token context went GA on Opus 4.6 and Sonnet 4.6 in Claude Code, no beta header, no long-context premium.</li>
  <li><strong>April 14, 2026</strong> &mdash; Claude Code desktop was redesigned for parallel sessions, integrated terminal, HTML/PDF preview, and shipped <strong>Routines</strong> &mdash; scheduled cloud-run automations (Pro 5/day, Max 15/day, Team/Enterprise 25/day). This is the Anthropic equivalent of Cowork&rsquo;s Scheduled Prompts, aimed at developers.</li>
  <li><strong>April 16, 2026</strong> &mdash; Claude Opus 4.7 landed in Copilot Cowork&rsquo;s model selector. Microsoft&rsquo;s framing: Opus 4.7 is tuned to <em>&ldquo;follow instructions more closely and route requests to the right capabilities and Work IQ data.&rdquo;</em></li>
  <li><strong>April 17, 2026</strong> &mdash; Claude Design launched as a research preview. Opus 4.7&ndash;powered. Five days old at the time of writing.</li>
</ul>
```
```html after:W-07
<h3>What changed between April and August 2026 (and why it matters)</h3>
<ul>
  <li><strong>April 16, 2026</strong> &mdash; Claude Opus 4.7 landed in Copilot Cowork&rsquo;s model selector. Microsoft&rsquo;s framing: Opus 4.7 is tuned to <em>&ldquo;follow instructions more closely and route requests to the right capabilities and Work IQ data.&rdquo;</em></li>
  <li><strong>June 16, 2026</strong> &mdash; <strong>Cowork reached general availability and moved to usage-based billing.</strong> This is the big one. Cowork now bills separately from the Copilot licence, metered in Copilot Credits. Tenants with a user active in the Frontier programme between March 30 and June 16 had a grace period that expired July 1, 2026.</li>
  <li><strong>June 2026</strong> &mdash; GA worldwide brought multi-model support, new plugins, reworked skill management and navigation, <strong>Microsoft Purview integration</strong>, branded templates, and image creation. Purview integration is the one that matters commercially: Cowork output is now governable with the same tooling as the rest of the tenant.</li>
  <li><strong>June 2026</strong> &mdash; <strong>Claude Fable 5 (preview)</strong> became available as an opt-in, admin-controlled model in Cowork on Frontier. Cowork is no longer fixed to a single model.</li>
  <li><strong>July 2026</strong> &mdash; Claude became selectable in <strong>Copilot Chat</strong> for active subscribers, a Tasks tab shipped, and automatic installation of the Microsoft 365 Copilot app resumed on eligible commercial Windows devices.</li>
  <li><strong>August 2026</strong> &mdash; Cost Management landed in the Microsoft 365 admin centre: Copilot Credits visibility, clearer policy enforcement, better overage handling, and more reliable alerts. If you are running a Cowork practice, this is your instrumentation.</li>
</ul>
```

---

## Deferred

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
