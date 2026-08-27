# specs/copilot-adoption-audit-buildout.spec.md

**Target file:** `copilot-adoption-audit.html` (172 KB, 13 sections)
**Also produces:** `copilot-adoption-audit-workbook.xlsx` · `tools/build-audit-workbook.py` · `assets/copilot-adoption-audit/*.png`
**Branch:** `feature/audit-buildout`
**Authored:** 2026-08-27
**Depends on:** [`DESIGN.md`](../DESIGN.md) §1–§4, §8, §8b · the live page at [copilotplaybook.com/copilot-adoption-audit.html](https://copilotplaybook.com/copilot-adoption-audit.html)

---

## Why

The page is live and the argument holds. Two things about it are weaker than the rest.

**1. Section 10 describes a workbook it does not give you.** It hands the reader formulas written against column letters they must substitute by hand. That is a worksheet exercise dressed as a deliverable, and it contradicts the page's own claim that this takes an afternoon rather than a project. **Ship the workbook.**

**2. The page talks about reports without ever showing them.** It names the Copilot usage report, the agents usage report, the readiness report, the Copilot Dashboard and the concealment setting — and the navigation, period options and role requirements are scattered, several of them only in Sources at the very end. A partner reading Section 3.2 is told to "pull a 90-day window" and is never told from where. **Every place a report is named, the reader must learn which report, which portal, which menu path, which period and which role — at that point in the page, not in an appendix.**

Microsoft's screenshot policy permits the fix for the second problem: screenshots of commercially released products may be used in documentation and on websites provided they are **not cropped and not otherwise altered except to resize**, are not boot/splash/beta screens, and carry the credit **"Used with permission from Microsoft."** The repo already self-hosts Partner Center screenshots under `assets/azure-billing/`, so the pattern exists.

---

## Execution prompt

> You are applying `specs/copilot-adoption-audit-buildout.spec.md`.
> - Three parts. **Part A touches no existing file.** Parts B and C both edit `copilot-adoption-audit.html` and **B must run before C**. Run each part as its own chat.
> - For each HTML change: locate the `before:` block, confirm it matches **exactly once**, replace with the `after:` block verbatim. Do not improve, reword, reformat or restyle anything else.
> - If a `before` string does not match, or matches more than once: **skip and report.**
> - Introduce no colour, font-family, font-size, radius or shadow that is not in `DESIGN.md` §1/§2/§4 **or already present in this file** — it carries its own component set (`.rev`, `.quad`, `.traps`, `.pcard`, `.sayline`, `.clickpath`, `.grouprule`, `.figure`).
> - No `max-width` on any run of prose (`DESIGN.md` §8b.1).
> - **No currency figure may be introduced anywhere** (`DESIGN.md` §8.10). Not in the page, not in the workbook.
> - Verify with `python tools/speccheck.py specs/copilot-adoption-audit-buildout.spec.md copilot-adoption-audit.html` before you start and `--applied` when you finish.
> - Commit per change; message = change ID + one line.
> - Report: changes applied, changes skipped and why, actual diff stat.

## Summary

| Part | Scope | Changes | Risk | Diff budget |
|---|---|---:|---|---|
| **A** | The workbook + its builder | build only | MED | new files |
| **B** | Report cards where each report is named | 8 | LOW–MED | +120 / −8 |
| **C** | Six Microsoft screenshots, self-hosted, attributed | 6 | LOW | +55 / −2 |

Stop if Part B insertions exceed 145 lines or Part C exceeds 70.

Add this spec to `PAIRS` in `tools/speccheck.py` so `--all` covers it.

---
---

# PART A · Ship the workbook

**Deliverables:** `copilot-adoption-audit-workbook.xlsx` at the repo root, and `tools/build-audit-workbook.py` that regenerates it. The builder is committed so the workbook is reproducible rather than an unmaintainable binary — same convention as `tools/speccheck.py`.

## A.1 · The one design decision that matters

**The workbook detects its own columns by header text.** The export's column order varies with which columns the admin switched on, so hand-mapping letters is the single most likely point of failure — and it is what the page currently asks for.

Use `MATCH(header_text, 'Paste Export'!$A$1:$BZ$1, 0)` on `Setup`, and `INDEX('Paste Export'!$A$2:$BZ$1001, row, col_index)` everywhere else. The partner pastes and reads; they map nothing.

## A.2 · Toolchain constraints — not optional

| Constraint | Why |
|---|---|
| `openpyxl` to write, then **`python scripts/recalc.py <file> 120`** from the `xlsx` skill | openpyxl writes formulas with no cached values; until recalculated every formula reads as `None` to pandas and to `data_only=True`. **Never ship while recalc reports `errors_found`.** |
| **Never** `XLOOKUP`, `XMATCH`, `SORT`, `FILTER`, `UNIQUE`, `SEQUENCE` | The verifying LibreOffice cannot evaluate them under any prefix, and openpyxl-written spilling functions have no spill metadata — only the top-left cell gets a value and recalc still reports zero errors. Silent wrong answers. |
| `PERCENTILE`, not `PERCENTILE.INC` | The legacy name evaluates in both. |
| `MEDIAN` over a helper column, **never** `MEDIAN(IF(...))` | Array formulas need a flag openpyxl does not write. Hence the hidden `Calc` sheet. |
| Arial throughout; formulas never Python-computed constants | Skill requirement, and the sheet must recalculate when the pasted data changes — which is the entire point. |

## A.3 · Sheets

Nine, in this order. `Calc` is hidden.

**1 · `Start Here`** — gridlines off, columns B=30 C=96. Label/value rows covering: where the data comes from (report, portal, navigation, role, period, the Choose-columns step, and the warning that the ellipsis Export on each *chart* is the wrong one); how to use the workbook in five steps, pasting at `A1` including headers; the two modes; the three rules the workbook enforces (n<5 suppression, zero-guarding, correlational-only); and a legend — yellow fill = cells you edit, blue text = typed value, capacity 1,000 rows and how to extend.

**2 · `Paste Export`** — row 1 is the eighteen exact Microsoft header strings, white bold on `003057`, frozen. Rows 2–4 are three example rows in blue-on-yellow showing realistic shapes — one heavy, one middling, one drifting — with a note that they are examples only, and a cell comment on `A1` stating that column order does not matter.

```
User name · Display name · Prompts submitted (any app) · Copilot Chat (work) prompts submitted ·
Copilot Chat (web) prompts submitted · Active Days · Last activity date (UTC) ·
Last activity date of Teams Copilot (UTC) · … Word … Excel … PowerPoint … Outlook … OneNote … Loop … ·
Last activity date of Copilot Chat (work) (UTC) · … (web) (UTC) ·
Last activity date of Microsoft 365 App (UTC) · Last activity date of Microsoft Edge (UTC)
```

**3 · `Setup`** — inputs in yellow: customer name, report period in days (default 90), refresh date, mode override. Detected: `=COUNTA('Paste Export'!A2:A1001)`; auto mode `=IF(rows>=60,"LARGE","SMALL")`; mode in use `=IF(override="",auto,UPPER(override))`. A column-detection block, one row per field, each `=IFERROR(MATCH($E{row},'Paste Export'!$A$1:$BZ$1,0),0)` with a `FOUND`/`NOT FOUND` status — five core fields plus the eight per-application last-activity columns. A red roll-up warning naming the likeliest cause: *"check you exported the user table with all columns switched on, and that this is a v2 report. Version 1 has no prompt or active-day columns at all."*

```
Frequency line  =IF(mode="SMALL", 9,   MEDIAN(INDEX('Paste Export'!$A$2:$BZ$1001,0,activedays_col)))
Depth line      =IF(mode="SMALL", ROUND(15*(period_days/7),0),
                                  MEDIAN(INDEX('Paste Export'!$A$2:$BZ$1001,0,prompts_col)))
```

`INDEX(range, 0, n)` returning a whole column is what avoids a circular reference back through `Analysis`. Deriving the SMALL depth line from the period input makes it self-documenting: 90 days → 195 prompts → 15 per week. Finish with two disclosure counters the presenter is told to say out loud: never-active users, and users excluded from the chart for having zero prompts.

**4 · `Analysis`** — rows 2–1001, every cell guarded `=IF($A{r}>Setup!rows,"",…)` so trailing rows stay blank rather than showing zeros.

| Col | Header | Formula shape |
|---|---|---|
| A | # | `=ROW()-1` |
| B | User | `INDEX(paste, $A{r}, Setup!user_col)` |
| C | Active days | `N(INDEX(…))` |
| D | Prompts | `N(INDEX(…))` |
| E | Web prompts | `N(INDEX(…))` |
| F | Prompts / active day | `=IFERROR($D{r}/$C{r},0)` |
| G | Web share of prompts | `=IFERROR($E{r}/$D{r},"")`, format `0.0%` |
| H | Surfaces touched | sum of eight `(--(INDEX(paste,$A{r},Setup!surf_col_n)<>""))` terms |
| I | Band | nested `IF` on the two thresholds |
| J | Drifting split | `=IF($I{r}="Drifting",IF($H{r}>=3,"tried and stopped","never started"),"")` |
| K | Plot depth | `=MAX($D{r},1)` — a log axis cannot render zero |
| L | Never active | `=IF(AND($C{r}=0,$D{r}=0),1,0)` |

Band mapping, stated so it cannot be got backwards: high frequency + high depth = **Embedded** · high frequency + low depth = **Loyal but shallow** · low frequency + high depth = **Project-driven** · low + low = **Drifting**.

**5 · `Calc` (hidden)** — twelve helper columns, three metrics × four bands, each `=IF(Analysis!$I{r}="","",IF(Analysis!$I{r}="{band}",Analysis!${col}{r},""))`. `MEDIAN` ignores the blanks.

**6 · `Segments`** — the deliverable. A subtitle concatenating customer, user count, period, refresh date and mode, and a standing red line: *"Relationships shown are correlational. This measures where the tool has not been made useful yet — not effort, contribution or value."* Four band rows × Users · % of users · % of all prompts · Median prompts · Median active days · Median prompts/active day · Median surfaces · What it means. **Every derived cell wraps in** `=IF($C{r}<5,"n<5 not reported", …)`; only the raw count escapes it. Then three blocks: the finding (share-of-people vs share-of-prompts, degrading gracefully when Embedded is under five); licence exposure as four never-merged numbers with the reconcile-against-assigned-licences warning; and the realistic ceiling (median, 75th, 95th percentile of prompts per active day) with a note that fires under 60 users telling the reader to quote the median and maximum only.

**7 · `Chart`** — `ScatterChart`, x = `Analysis!C`, y = `Analysis!K`, `y_axis.scaling.logBase = 10`, circle markers size 4, no connecting line. Above it a red formula line reading **"SMALL MODE — do not use this chart. Read the ranked list on Analysis instead."** when mode is SMALL, and a caption stating the excluded zero-prompt count, refresh date, period, and that relationships are correlational.

**8 · `Book Ranking`** — one row per Copilot customer, columns matching §5.2 of the page: Customer · Licensed users · Never active · Never active % · Drifting % · Embedded % · Embedded with no agent use · Web-only users · Months to renewal · Next play · Owner · Date agreed. Row 5 links live to this workbook's own result in green; rows 6+ are yellow input.

**9 · `Reference`** — the five reports with portal, navigation and periods; the concealment setting and its path; the Graph call with the `version='v2'` warning; the ten traps in one line each; source URLs. The offline twin of the page's Sections 8, 9 and 13.

## A.4 · Verification for Part A

1. `python scripts/recalc.py copilot-adoption-audit-workbook.xlsx 120` → `status: success`, `total_errors: 0`.
2. Reload `data_only=True` and check the three shipped example rows band as `Embedded`, `Loyal but shallow`, `Drifting` / `tried and stopped` at 90-day SMALL thresholds. **Check two or three formulas by hand before building the grid** — a green recalc proves formulas evaluate, not that ranges are right.
3. Delete the example rows: every `Analysis` row blanks, `Segments` shows zeros not `#DIV/0!`.
4. Paste 200 synthetic rows: mode flips to LARGE, thresholds become medians.
5. Force a band to four members: every derived cell in that row reads `n<5 not reported`.
6. `Calc` is hidden; no sheet holds a hardcoded result where a formula belongs.

---
---

# PART B · Name the report, in place, every time

## AB-00 · The report-card component

Append the block below inside the existing `<style>`. Colours are all `DESIGN.md` §1/§4; every size is on the §2.2 scale.

```html before:AB-00
.figure figcaption strong { color: var(--navy); }
```

```html after:AB-00
.figure figcaption strong { color: var(--navy); }

/* ═══ REPORT CARD — where a report lives, at the point it is named ═══ */
.reportcard { border: 1px solid var(--border); border-left: 3px solid var(--teal); border-radius: 0 var(--radius) var(--radius) 0; background: #fff; box-shadow: var(--shadow-sm); margin: 18px 0; overflow: hidden; }
.rc-h { display: flex; align-items: baseline; gap: 10px; padding: 11px 18px; background: var(--muted); border-bottom: 1px solid var(--border); }
.rc-h .rc-tag { font-size: .58rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--teal); flex: 0 0 auto; }
.rc-h h4 { margin: 0; font-size: .95rem; color: var(--navy); font-weight: 700; }
.rc-rows { margin: 0; padding: 6px 18px 14px; }
.rc-rows > div { display: grid; grid-template-columns: 122px 1fr; gap: 12px; padding: 7px 0; border-bottom: 1px dashed var(--border); }
.rc-rows > div:last-child { border-bottom: none; }
.rc-rows dt { font-size: .58rem; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: #9ca3af; padding-top: 2px; }
.rc-rows dd { margin: 0; font-size: .87rem; line-height: 1.6; color: #374151; }
.rc-rows dd strong { color: var(--navy); }
.rc-warn { background: var(--warn); border-top: 1px solid #f5ddb0; padding: 10px 18px; font-size: .82rem; color: #5a3a18; }
.rc-warn strong { color: #92400e; }
@media (max-width: 700px) { .rc-rows > div { grid-template-columns: 1fr; gap: 2px; } }
```

## AB-01 · Section 3.2 — say where the 90-day window comes from

```html before:AB-01
<p>Pull a <strong>90-day</strong> window &mdash; roughly thirteen weeks,
```

```html after:AB-01
<div class="reportcard">
  <div class="rc-h"><span class="rc-tag">Report</span><h4>Microsoft Copilot usage report &mdash; user-level table</h4></div>
  <dl class="rc-rows">
    <div><dt>Portal</dt><dd>Microsoft&nbsp;365 admin center &mdash; <code>admin.microsoft.com</code></dd></div>
    <div><dt>Navigation</dt><dd><strong>Reports</strong> &rsaquo; <strong>Usage</strong> &rsaquo; <strong>Microsoft Copilot</strong> &rsaquo; <strong>Copilot</strong> &rsaquo; the <strong>Usage</strong> tab</dd></div>
    <div><dt>Period</dt><dd>Take <strong>90 days</strong> for this method &mdash; it lines up with the twelve-week frame Microsoft&rsquo;s own user categories use. The filter also offers 7, 28 and 180.</dd></div>
    <div><dt>Role</dt><dd><strong>Reports Reader</strong> is sufficient. Not Global Administrator.</dd></div>
    <div><dt>What you take</dt><dd>The <strong>Export</strong> on the user-level table. The two columns this section needs are <strong>Active Days</strong> and <strong>Prompts submitted (any app)</strong>.</dd></div>
  </dl>
</div>

<p>Pull a <strong>90-day</strong> window &mdash; roughly thirteen weeks,
```

## AB-02 · Section 4 — the Copilot Dashboard is a different surface

```html before:AB-02
<p>The Copilot Dashboard in Viva Insights is available to any customer
```

```html after:AB-02
<div class="reportcard">
  <div class="rc-h"><span class="rc-tag">Report</span><h4>Microsoft Copilot Dashboard &mdash; Viva Insights</h4></div>
  <dl class="rc-rows">
    <div><dt>Portal</dt><dd>Microsoft Viva Insights. The quickest route in is the <strong>Recommendations</strong> card inside the Copilot usage report, which links straight to it.</dd></div>
    <div><dt>Entitlement</dt><dd>Available with <strong>one or more</strong> Copilot licences. No paid Viva Insights licence and no Copilot licence is required to view it.</dd></div>
    <div><dt>Data lag</dt><dd>Processing starts once at least one Copilot licence is assigned, and takes <strong>up to seven days</strong>.</dd></div>
    <div><dt>What you take</dt><dd>Nothing, for this method. Read it to know what your customer has already been shown.</dd></div>
  </dl>
  <div class="rc-warn"><strong>This is not the report this method uses.</strong> It is the one your customer may already have been shown &mdash; and the reason this section exists is that most of it is switched off below fifty Copilot licences.</div>
</div>

<p>The Copilot Dashboard in Viva Insights is available to any customer
```

## AB-03 · Section 5.1 — the book motion needs the path, not a cross-reference

```html before:AB-03
Then it is the same four clicks per tenant described in Section&nbsp;8, and a CSV.</p>
```

```html after:AB-03
Then, signed in against each customer tenant in turn, it is the same four clicks every time &mdash; <strong>Reports</strong> &rsaquo; <strong>Usage</strong> &rsaquo; <strong>Microsoft Copilot</strong> &rsaquo; <strong>Copilot</strong>, set the period, and <strong>Export</strong> the user-level table. Section&nbsp;8 has the column detail and the traps; you should not have to page back to it once you have done this twice.</p>
```

## AB-04 · Section 8.2 — the canonical card

This wording is the master copy. Part A's `Start Here` sheet and AB-01 must not drift from it.

```html before:AB-04
<div class="clickpath"><span>Microsoft 365 admin center</span>
```

```html after:AB-04
<div class="reportcard">
  <div class="rc-h"><span class="rc-tag">Report</span><h4>Microsoft Copilot usage report &mdash; the user-level table</h4></div>
  <dl class="rc-rows">
    <div><dt>Portal</dt><dd>Microsoft&nbsp;365 admin center &mdash; <code>admin.microsoft.com</code></dd></div>
    <div><dt>Navigation</dt><dd><strong>Reports</strong> &rsaquo; <strong>Usage</strong> &rsaquo; <strong>Microsoft Copilot</strong> &rsaquo; <strong>Copilot</strong> &rsaquo; the <strong>Usage</strong> tab. If <strong>Reports</strong> is not in the navigation menu, choose <strong>Show all</strong> first.</dd></div>
    <div><dt>Period</dt><dd><strong>7 · 28 · 90 · 180 days.</strong> Take 180 for a full read, or 90 if you are working at small-tenant thresholds. Do not use 7 or 28 &mdash; they show you noise and call it a trend.</dd></div>
    <div><dt>Role</dt><dd><strong>Reports Reader</strong>, or any of: Usage Summary Reports Reader, AI Administrator, Exchange / SharePoint / Teams / Teams Communications Administrator, User Experience Success Manager, Global Administrator.</dd></div>
    <div><dt>Before exporting</dt><dd>Scroll to the user-level table and choose <strong>Choose columns</strong>, then switch on everything. The default column set is not enough.</dd></div>
    <div><dt>What you take</dt><dd>The <strong>Export</strong> button on the user-level table. One CSV, one row per licensed user.</dd></div>
  </dl>
  <div class="rc-warn"><strong>The wrong Export.</strong> The ellipsis menu on each individual chart also offers an Export. That gives you the chart&rsquo;s aggregate, not the user detail, and it is the mistake almost everyone makes the first time. You want the Export on the table.</div>
</div>

<div class="clickpath"><span>Microsoft 365 admin center</span>
```

## AB-05 · Section 9, trap 04 — name the agents report properly

The card must sit **after** the trap's existing paragraphs, inside the `<li>`, or the counter styling breaks.

```html before:AB-05
explicitly, every time.</p>
```

```html after:AB-05
explicitly, every time.</p>
    <div class="reportcard">
      <div class="rc-h"><span class="rc-tag">Report</span><h4>Microsoft Copilot agents usage report</h4></div>
      <dl class="rc-rows">
        <div><dt>Portal</dt><dd>Microsoft&nbsp;365 admin center &mdash; <code>admin.microsoft.com</code></dd></div>
        <div><dt>Navigation</dt><dd><strong>Reports</strong> &rsaquo; <strong>Usage</strong> &rsaquo; <strong>Microsoft Copilot</strong> &rsaquo; <strong>Agents</strong></dd></div>
        <div><dt>Period</dt><dd><strong>7 or 30 days only.</strong> Not 90, not 180. Microsoft has said longer windows are coming.</dd></div>
        <div><dt>Role</dt><dd>Same roles as the usage report. Names are concealed here too.</dd></div>
        <div><dt>What you take</dt><dd>Three tables: <strong>user details</strong>, <strong>agent details</strong>, and a <strong>user-and-agent pair</strong> view. The pair view is what tells you whether your champions have ever been given an agent.</dd></div>
      </dl>
      <div class="rc-warn"><strong>Check which report you are looking at.</strong> The superseded version counted only agents your organisation built. The current one also counts agents built by Microsoft and by third parties, and breaks usage down by creator type &mdash; so the same tenant will look dramatically more agentic under the new report for reasons that have nothing to do with adoption.</div>
    </div>
```

## AB-06 · Section 10 — lead with the workbook, not with column letters

**Depends on Part A being merged.** Do not apply before the workbook exists.

```html before:AB-06
<p>No BI tool, no Power&nbsp;BI licence, no data engineer. Excel, the CSV you just exported, and about ten minutes. The formulas below assume your export is open with headers in row&nbsp;1 and data starting in row&nbsp;2. <strong>Column letters vary depending on which columns you switched on</strong>, so the first job is to find yours and substitute them &mdash; every formula here is written with the letters spelled out in a legend so the substitution is mechanical.</p>
```

```html after:AB-06
<p>No BI tool, no Power&nbsp;BI licence, no data engineer. <strong><a href="copilot-adoption-audit-workbook.xlsx">Download the workbook</a></strong>, paste your export into the first tab, and read the answer off the third. It detects its own columns by header text &mdash; so it does not matter which columns the admin switched on or what order they came out in &mdash; picks large-tenant or small-tenant thresholds from the row count, applies the five-person suppression rule for you, and draws the chart.</p>

<p>The rest of this section is what the workbook is doing, written out. Read it if you would rather build your own, if you need to explain a number to a customer&rsquo;s admin, or if you simply do not want to trust a spreadsheet you did not write. The formulas assume your export is open with headers in row&nbsp;1 and data starting in row&nbsp;2, and are written with column letters spelled out in a legend so substitution is mechanical.</p>
```

## AB-07 · Section 10 — the template now ships

```html before:AB-07
<div class="callout-title">Do this once as a template, not once per customer</div>
```

```html after:AB-07
<div class="callout-title">The template ships &mdash; build it once only if you want your own</div>
```

---
---

# PART C · Show the reports

## C.1 · Licensing — read before downloading

Microsoft permits screenshots of commercially released products in documentation and on websites. The conditions that bind this spec:

- **Do not crop.** *"Do not use portions of screenshots"* is explicit. Resize only.
- **Do not alter.** No annotations, arrows or highlight boxes drawn on the image. Put the pointing in the caption.
- **No beta or preview products.** This is why **agents usage report screenshots are excluded** — that report is labelled Preview. AB-05 documents it in text only.
- **Credit required**, verbatim: **"Used with permission from Microsoft."**

## C.2 · The files

Download **with the `?view=o365-worldwide` query** — without it some return HTML, not PNG. Base: `https://learn.microsoft.com/en-us/microsoft-365/media/`. Save to `assets/copilot-adoption-audit/`.

| Local name | Source file | Bytes | Placement |
|---|---|---:|---|
| `usage-dashboard.png` | `activity-usage-analytics3.png` | 144,258 | §8.2 — the Usage dashboard you land on |
| `copilot-usage-summary.png` | `copilot-usage-hero.png` | 106,972 | §8.2 — the Copilot usage page and its period filter |
| `chart-export-wrong.png` | `copilot-usage-prompts-submitted-summary.png` | 30,484 | §8.2 — the chart whose Export is the **wrong** one |
| `user-detail-table.png` | `copilot-usage-last-activity.png` | 54,839 | §8.3 — **the table you export**; the most useful image on the page |
| `choose-columns.png` | `copilot-usage-chat-columns.png` | 58,454 | §8.3 — the Choose columns panel |
| `concealed-user-list.png` | `2ed99bce-4978-4ee3-9ea2-4a8db26eef02.png` | 77,506 | §8.5 — what concealment looks like |

All six verified `200 image/png` on 2026-08-27. Re-verify before download; Microsoft rotates media filenames.

## AC-01 · Image styling

The file has no `img` rule at all.

```html before:AC-01
.figure svg { display: block; width: 100%; height: auto; }
```

```html after:AC-01
.figure svg { display: block; width: 100%; height: auto; }
.figure img { display: block; width: 100%; height: auto; border: 1px solid var(--border); border-radius: var(--radius); }
.figure .credit { display: block; margin-top: 6px; font-size: .72rem; color: #9ca3af; }
```

## AC-02 · Section 8.2 — the two screens you land on

```html before:AC-02
<span>Usage tab</span></div>
```

```html after:AC-02
<span>Usage tab</span></div>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/usage-dashboard.png" alt="The Usage dashboard in the Microsoft 365 admin center, showing at-a-glance activity cards for each service" loading="lazy" />
  <figcaption><strong>Reports &rsaquo; Usage.</strong> This is the page the navigation lands you on. Microsoft Copilot is one card among many here &mdash; it is not the default view, which is part of why the report goes unopened.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/copilot-usage-summary.png" alt="The Microsoft Copilot usage report summary, showing enabled users, active users, active user rate, total prompts submitted and the timeframe filter" loading="lazy" />
  <figcaption><strong>The Copilot usage report, Usage tab.</strong> The timeframe filter sits at the top &mdash; that is where you set 180 days, or 90. Everything visible here is the summary layer; the data this method runs on is in the user-level table further down the page.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>
```

## AC-03 · Section 8.2 — the Export that is not the one you want

```html before:AC-03
It is the table export you want.</p>
```

```html after:AC-03
It is the table export you want.</p>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/chart-export-wrong.png" alt="A summary chart in the Microsoft Copilot usage report showing total prompts submitted over the selected period" loading="lazy" />
  <figcaption><strong>This is the export you do not want.</strong> Every chart on the page carries its own ellipsis menu with an Export on it, and it gives you the chart&rsquo;s aggregate &mdash; a handful of totals. There is no per-user row in it, so none of this method works from it.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>
```

## AC-04 · Section 8.3 — the table you actually export

```html before:AC-04
<h3>8.3 &nbsp;The columns you are exporting</h3>
```

```html after:AC-04
<h3>8.3 &nbsp;The columns you are exporting</h3>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/user-detail-table.png" alt="The Microsoft Copilot usage report user-level table, one row per licensed user, with last activity date and per-application activity columns" loading="lazy" />
  <figcaption><strong>This is the table you export.</strong> One row per licensed user. The two columns the whole method runs on &mdash; <strong>Active Days</strong> and <strong>Prompts submitted (any app)</strong> &mdash; live here, not in the charts above it. Note that the identifiers are concealed by default, and that this costs you nothing: every figure in this document is distributional.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/choose-columns.png" alt="The Choose columns panel for the Microsoft Copilot usage report, listing the selectable per-user metric and per-application last activity columns" loading="lazy" />
  <figcaption><strong>Choose columns &mdash; switch on everything.</strong> The default selection does not include the full set of per-application last-activity columns, and those are what the surfaces-touched count in Reversal&nbsp;1 is built from. This panel is the step most people skip.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>
```

## AC-05 · Section 8.5 — what concealment looks like

```html before:AC-05
<h3>8.5 &nbsp;About the anonymization &mdash; do not turn it off reflexively</h3>
```

```html after:AC-05
<h3>8.5 &nbsp;About the anonymization &mdash; do not turn it off reflexively</h3>

<figure class="figure">
  <img src="assets/copilot-adoption-audit/concealed-user-list.png" alt="A Microsoft 365 usage report user list with concealed identifiers, showing hashed values in place of user names" loading="lazy" />
  <figcaption><strong>This is the default, and you should leave it alone.</strong> Concealed identifiers look like this. Every segment size, every band and every chart in this method works exactly as well against them &mdash; which is why the ask in Section&nbsp;6 is almost never &ldquo;turn concealment off&rdquo;.
  <span class="credit">Used with permission from Microsoft.</span></figcaption>
</figure>
```

## AC-06 · Section 8 lede — say whose screenshots these are

```html before:AC-06
Four clicks, one CSV.</p>
```

```html after:AC-06
Four clicks, one CSV. The screens below are Microsoft&rsquo;s own, reproduced unaltered so you can recognise them before you are sitting in front of a customer&rsquo;s tenant.</p>
```

---

## Deferred — flagged, not changed

| Item | Why it is not in this spec |
|---|---|
| **`assets/azure-billing/*.png` carry no Microsoft attribution** | Pre-existing across ~10 images in `azure-billing-setup.html`. The same policy applies to them and the credit line is missing. **This is a real compliance gap and it is your call** — two lines per image, but not this spec's file. |
| Agents usage report screenshots | The report is labelled Preview; Microsoft's permission excludes products not commercially released. Text only, via AB-05. |
| Viva Insights Copilot Dashboard screenshots | Different Learn media path, not verified here. AB-02 covers the dashboard in text. |
| A browser tool that parses a customer's export | The `.xlsx` is the deliverable. An in-page parser is a separate build with its own privacy review — see §6 of the page. |
| Localising the click path | Menu labels differ in non-English tenants. The report card names the report, so a reader can find it regardless. |

---

## Verification

```bash
python tools/speccheck.py specs/copilot-adoption-audit-buildout.spec.md copilot-adoption-audit.html
python tools/speccheck.py specs/copilot-adoption-audit-buildout.spec.md copilot-adoption-audit.html --applied
```

```bash
# structure — every section id has a TOC entry and vice versa
python -c "import io,re;s=io.open('copilot-adoption-audit.html',encoding='utf-8').read();ids=re.findall(r'id=\"(section-\d+|toc)\"',s);hs=sorted(set(re.findall(r'href=\"#([^\"]+)\"',s)));print('missing:',[h for h in hs if h not in ids])"
```

```bash
# design lint — nothing outside DESIGN.md 1/2/4 or already in the file
grep -ohE '#[0-9a-fA-F]{3,6}|font-size:[ ]*[0-9.]+(rem|px|em)|border-radius:[ ]*[0-9]+px' copilot-adoption-audit.html | sort -u
```

```bash
# frozen prices — must return nothing
git diff -- copilot-adoption-audit.html | grep -E '^\+.*\$[0-9]'
```

```bash
# six images, six credits
ls assets/copilot-adoption-audit/ | wc -l
grep -c 'Used with permission from Microsoft.' copilot-adoption-audit.html
```

```bash
# fact anchors unchanged from baseline: 220 OK / 34 MOVED / 20 MISSING-FILE / 10 OK-NOVALUE
python tools/check-facts.py
```

**Render check.** Every screenshot loads and none scrolls horizontally; every report card renders its label column; the workbook link downloads; all fourteen prompt copy-buttons still fire (`document.querySelectorAll('.copybtn').length === 14`).

**The reader test, and it is the one that matters.** Open the page at Section 3.2 having read nothing before it. Without scrolling anywhere else you must be able to say **which report, which portal, which menu path, which period, and which role**. If you cannot, Part B has failed regardless of what the greps say.
