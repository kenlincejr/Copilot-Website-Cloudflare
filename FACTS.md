# FACTS.md — perishable claim inventory

**Status:** Phase 2 output. Read-only sweep, completed 2026-08-26.
**Machine-readable companion:** [`data/facts.json`](data/facts.json)

**Nothing in this file has been verified.** Phase 2 registers *what the site claims and where*. Phase 3 establishes *whether it is still true*.

---

## 1. What the sweep did

Every HTML file in scope was read with `<script>`, `<style>`, inline `style="…"` attributes, and HTML comments blanked out (length-preserving, so byte offsets still map to the original). Six patterns were extracted from what remained — percentages, multipliers, currency, seat/user counts, dates, fiscal periods — and kept only when the surrounding 320 characters of prose contained a hard external-source signal (Microsoft, Forrester, IDC, an analyst name, "penetration", "install base", "Solutions Partner", "Work Trend Index", and so on).

That filter is what turns 1,860 raw numeric hits into 142 registered claims. The 1,700 discarded hits are overwhelmingly internal scenario arithmetic and CSS-adjacent values that carry no external dependency.

### Result

| | |
|---|---:|
| Distinct facts | **142** |
| Occurrences across the site | **271** |
| Facts appearing in more than one file | **25** |
| Occurrences with a verified-unique anchor string | **271 / 271 (100%)** |
| Occurrences on the `cpb.html` base64 line | **0** |

Every occurrence carries an `anchor` — a verbatim substring lifted from the raw file and widened symmetrically (24 characters at a time, up to 400) until it matched exactly once. **No fact in this ledger has an ambiguous anchor.** Phase 4 spec authors can lift `anchor` directly into a `BEFORE` block and it will match once by construction.

Line numbers are recorded but are advisory only. Anchors are authoritative — they survive edits, line numbers do not.

---

## 2. The finding that matters most

**The site currently states two different Copilot penetration figures, sourced from two different Microsoft quarters, and neither knows about the other.**

| Where | Claim | Basis | Source cited |
|---|---|---|---|
| `cpb.html` (Opening Provocation), `ledger.html` | **3.3%** — 15M paid seats ÷ ~450M M365 commercial seats | Microsoft **FY26 Q2** | Earnings disclosure Jan 28 2026; arithmetic attributed to SAMexpert (Feb 5 2026), replicated by Stackmatix (Apr 2026) and Tony Redmond |
| `customer-zero-starter-kit/index.html` | **~4.4%** — 20M+ paid seats ÷ 450M+ | Microsoft **FY26 Q3** | Earnings call Apr 29 2026 |

`cpb.html` also runs a downstream walkthrough — *"Apply the math to a sample of 100 seats … take the 15M / ~450M ratio from above"* (F-060) — which is arithmetically bound to 3.3% and will produce a wrong narrative the moment the numerator changes.

Three consequences:

1. **The starter kit is already one quarter ahead of the primary asset.** The refresh is not introducing a new number into a consistent site; it is reconciling a site that is already inconsistent.
2. **Your ~6.6% hypothesis would be the third distinct figure.** If it is real it implies roughly 30M paid seats against the same ~450M denominator — a doubling since Q3. Open question #1 is now the single highest-value unknown in the project, exactly as v2 predicted. **It needs a source before Phase 3 starts.**
3. **The 160% YoY paid-seat growth figure (F-052) is the counter-headline and it lives in the same paragraph as 3.3%.** Any change to the penetration number must be checked against it — they are two framings of one dataset, and updating one without the other produces a paragraph that argues with itself.

The denominator is also stale-shaped: **~450M M365 commercial seats (F-006) appears in three files and is not attributed to a specific quarter in any of them.** It is treated as a constant. It is not one.

---

## 3. Where the claims live

| File | Occurrences | Notes |
|---|---:|---|
| `cpb.html` | 145 | The primary cascade surface, as expected |
| `frontier.html` | 31 | Concentrated in program economics and designation benefits |
| `customer-zero-starter-kit/index.html` | 28 | **Not in the v2 plan's target list.** Carries the FY26 Q3 figures. |
| `cowork.html` | 22 | Mostly dated announcements — the fastest-decaying set |
| `ledger.html` | 19 | Mirrors `cpb.html`'s headline arithmetic |
| `cpbops.html` | 16 | |
| `customer-zero-starter-kit/become-customer-zero.html` | 9 | **Also not in the plan's target list.** |
| `index.html` | 1 | A `Last updated` stamp |

**Scope correction:** the plan named `cpb.html`, `frontier.html`, `cowork.html`, `ledger.html`, `cpbops.html`, `coworkdemo.html`, and `customer-zero-starter-kit/index.html` as cascade surfaces. The sweep confirms all but `coworkdemo.html` (which carries no externally-sourced claims at all) and adds `customer-zero-starter-kit/become-customer-zero.html`. `CopilotApp.html`, `CopilotIB.html`, and `landing.html` are clean — no externally-sourced perishable claims. They need no spec.

`cpbbackup.html` was deliberately excluded from the ledger. It is a stale fork (see `DESIGN.md` §7) and registering its claims would imply an intent to maintain it.

---

## 4. Cascade set — the 25 facts that appear in more than one file

These are where a single-file edit silently leaves the site inconsistent. Any Phase 4 spec touching one of these must be cross-referenced against every file listed.

| ID | Value | Type | Files |
|---|---|---|---|
| F-001 | `$8.45` | analyst | cpb, frontier, ledger |
| F-002 | `FY26` | microsoft-reported | cpb, cpbops |
| F-004 | `$8,000` | analyst | cpb, cpbops |
| **F-005** | **`3.3%`** | analyst | **cpb, ledger** |
| **F-006** | **`450M`** | derived | **cpb, ledger, starter-kit/index** |
| F-008 | `$1` | analyst | cpb, frontier |
| F-009 | `$15` | analyst | cpb, starter-kit/become-customer-zero |
| F-010 | `$3,500` | our-price | cpb, cpbops |
| F-011 | `30%` | derived | cpb, cpbops |
| F-017 | `71%` | microsoft-reported | cpb, frontier |
| F-020 | `May 1, 2026` | microsoft-reported | cowork, cpb |
| **F-021** | **`FY26 Q2`** | analyst | **cpb, ledger** |
| F-025 | `20%` | microsoft-reported | cpb, starter-kit/index |
| F-027 | `353%` | analyst | cpb, starter-kit/index |
| F-028 | `40%` | analyst | cpb, starter-kit ×2 |
| F-029 | `60%` | microsoft-reported | cpb, cpbops |
| **F-033** | **`Feb 5, 2026`** | analyst | **cpb, ledger** |
| **F-034** | **`Jan 28, 2026`** | analyst | **cpb, ledger** |
| F-036 | `March 9, 2026` | microsoft-reported | cowork, cpb |
| F-039 | `$1,750` | microsoft-reported | cpb, ledger |
| F-040 | `$10,000` | microsoft-reported | cpb, ledger |
| **F-052** | **`160%`** | analyst | **cpb, ledger** |
| F-055 | `37%` | microsoft-reported | cpb, frontier |
| F-058 | `82%` | microsoft-reported | cpb, starter-kit/become-customer-zero |
| F-059 | `95%` | microsoft-reported | cpb, frontier |

**Bolded rows are the penetration cluster.** They move together or not at all: F-005 (3.3%), F-006 (450M), F-021 (FY26 Q2), F-033/F-034 (the source dates), F-052 (160% YoY), plus F-060 (15M, `cpb.html` only) and F-016/F-018/F-022/F-031 (the starter kit's 4.4% / 20M / FY26 Q3 / Apr 29 2026 set). Thirteen anchors across three files, one narrative.

---

## 5. Claim types

| Type | Count | What Phase 3 owes it |
|---|---:|---|
| `analyst` | 64 | A live URL and an `as_of` date. Forrester TEI and IDC figures dominate; several cite study editions (FY2025, July 2023) that may have been superseded. |
| `microsoft-reported` | 44 | Confirmation against the current Microsoft source. Program benefits (Azure credits, designation costs) change at fiscal-year boundaries — **FY27 program mechanics land while this refresh is in flight.** |
| `derived` | 16 | Recomputation, not lookup. These break automatically when their inputs move. |
| `third-party` | 6 | Anthropic / Stanford / press. Fastest-decaying category. |
| `unclassified` | 10 | Listed in §7 — needs a human read. |
| `our-price` | 1 | See §6 — the classifier under-counts this badly, on purpose. |
| `td-synnex-internal` | 1 | F-038 (95% of legacy competency partners, FY25). See §8. |

---

## 6. A deliberate gap: your price sheet is not in this ledger

The sweep found **555 currency hits carrying pricing language** across the site. Almost none are registered as facts, because they failed the external-source filter — correctly. They are your prices, not the world's.

Open question #8 asks whether `$350`/`$400` per agent, `$15`/`$25`/`$55` per user, `$3,500`, and `$8,000` are in scope or frozen. The ledger cannot answer that, and I did not want to bury a pricing decision inside a fact-checking artifact. **If you say prices are in scope, that is its own inventory and its own spec** — roughly 200 anchors, mechanically similar to this one, and a day of work. If prices are frozen, add a Phase 5 prohibition: *no execution chat may alter a currency value that is not registered in `facts.json`.*

Two currency facts did land in the ledger because Microsoft-sourced context surrounded them — F-010 (`$3,500`) and F-004 (`$8,000`), the Stage 2 agent build fee. They are typed `our-price` / `analyst` and should be reclassified once you answer #8.

---

## 7. Ten claims needing a human read before Phase 3

The classifier could not type these from context alone:

| ID | Value | The problem |
|---|---|---|
| F-050 | `13%` | "up 13% YoY" — modifies the $95.60 Forrester figure. Same study or a different edition? |
| F-053 | `19%` | SMB baseline growth from a "predecessor study" (July 2023). Is the predecessor still the right citation? |
| F-054 | `35%` | "25–35% markup" on CSP compute. Is this a benchmark or your recommendation? Reads as the latter. |
| F-078 | `$10.93` | Software-development-partner multiplier. Cited nowhere near a source. |
| F-089 | `$3,000` | "$1,500–$3,000 Enablement Workshops" — price or benchmark? |
| F-113 | `100%` | "separates a 100% adoption rate from a 30% one" — rhetorical, not measured. Candidate for softening. |
| F-118 | `16%` | Enterprise growth comparator to F-053. Same question. |
| F-130 | `51%` | "Increase in Azure revenue for designation earners" — no source in context. |
| F-139 | `9%` | "Only 9% of businesses using AI are using agents" — no source in context. |
| F-141 | `96%` | "Year-over-year growth tracked by partners with Azure certifications" — no source in context. |

---

## 8. Nineteen claims with no source in their immediate context

These are the candidates for Phase 3's *soften or remove* treatment. A claim without a nearby citation is not necessarily wrong — but in a document whose whole argument is "here is the arithmetic and here is where it comes from," an unsourced number is a liability.

`F-047` `$5,000` · `F-048` `$9,000` · `F-053` `19%` · `F-054` `35%` · `F-061` `25K` · `F-072` `$0.55` · `F-076` `$1.10` · `F-089` `$3,000` · `F-090` `$30` · `F-098` `$44,000` · `F-104` `$57` · `F-107` `$66` · `F-113` `100%` · `F-118` `16%` · `F-120` `26%` · `F-130` `51%` · `F-139` `9%` · `F-141` `96%` · `F-142` `96.7%`

Several are benign — `$30/user/mo` for M365 Copilot (F-090) and the `$66 / $57` E5 comparison (F-104, F-107) are Microsoft list prices that any reader can verify. But **F-130 (51%), F-139 (9%), F-141 (96%)** are presented as hard stats in stat-block markup with no attribution anywhere near them. Those three are the sharpest edge in the document.

`F-038` is the one **TD SYNNEX-internal** figure the sweep caught — *"95% of legacy Microsoft competency partners had NOT yet achieved a Solutions Partner designation as of FY25,"* attributed to *TD SYNNEX Internal MAICPP Program Data*. It is already labelled as internal in the markup. Open question #6 asks about public-vs-internal treatment of TD SYNNEX figures; note that the sweep did **not** find the 2.6× Cowork multiplier anywhere in the current site — if that figure is going in during this refresh, it is net-new content, not an update.

---

## 9. Fastest-decaying content

`cowork.html` carries 22 claims of which **13 are dated announcements** between Sep 2025 and Apr 2026 (F-007, F-019, F-032, F-036, F-037, F-062, F-063, F-067, F-069, F-070 and others). It has a section literally titled *"What changed in the last 90 days"* — and its own byline reads `Last updated: April 22, 2026`, now four months stale.

`cowork.html` should be the first spec written after the penetration cluster. A page that advertises its own recency and is four months old is worse than a page with no date.

---

## 10. Record shape

```json
{
  "id": "F-005",
  "kind": "percent",
  "value": "3.3%",
  "label": "",
  "type": "analyst",
  "source_url": "",
  "as_of": "",
  "verified": false,
  "notes": "",
  "occurrences": [
    {
      "file": "cpb.html",
      "line": 1531,
      "anchor_unique": true,
      "anchor": "<verbatim substring, unique in file by construction>",
      "context": "<prose, tags stripped, ~320 chars>"
    }
  ]
}
```

`label`, `source_url`, `as_of`, `verified`, and `notes` are Phase 3's to fill. `id`, `kind`, `value`, and `occurrences` are Phase 2's and should not be rewritten — later phases append.

---

## 11. Reproducing this sweep

The generator is not committed to the repo (it is scaffolding, not a deliverable). It is a single Python file that:

1. reads each in-scope HTML file,
2. blanks `<script>`, `<style>`, `style="…"`, and `<!-- -->` with equal-length whitespace,
3. matches six numeric patterns,
4. keeps a hit only if a hard external-source signal appears within ±160 characters,
5. skips any hit on a line longer than 4,000 characters (this is what guarantees `cpb.html:1913` is never touched),
6. widens a raw-file substring around each hit until `raw.count(anchor) == 1`,
7. groups by `(kind, value)` and emits `data/facts.json`.

Phase 6's `check-facts` script is step 6 run in reverse: for every occurrence, assert the anchor still appears exactly once in the live file and still contains the registered value. That check is what catches a missed occurrence in the cascade set.

---

## 12. The 2.6× Cowork multiplier — collection and methodology

*Added 2026-08-28 alongside the benchmark flywheel (v3 remediation spec §R8b, idea 4). Flywheel removed 2026-08-30 — the `mailto:` link pointed at the site owner's personal Gmail rather than any real intake channel, so it was collecting nothing and only prompted a partner to email the author directly. This section now records methodology only.*

The **2.6× Cowork-to-license ratio** quoted throughout `cowork-calculator.html` is **TD SYNNEX editorial observation across partner accounts, sample size unknown**. It is not a Microsoft-published figure and the calculator now says so on every surface that quotes it (`provPill('editorial')` on the ratio whybox and the step-3 chip group, plus an assumptions entry naming TD SYNNEX). §2's sweep note is correct that the figure was net-new content at the time of the refresh; this section is its ledger entry.

**No collection channel.** The calculator no longer offers a way to contribute a ratio; the whybox states the benchmark's methodology and limits without soliciting submissions.

**Methodology caveat, binding on any future re-statement of this figure.** If a real collection channel is ever built, contributed ratios would be **self-selected and unverified**. Nobody would audit the inputs behind a submitted number, and the partners who bother to send one are not a random sample of partners. Accumulated contributions could move the provenance from *"editorial, sample unknown"* to *"partner-sourced, n = X"* — a real improvement, and the honest ceiling. They could **never** reach `ms-verified`, or any `ms-` prefixed tag: no volume of partner submissions makes a figure a Microsoft one. Any restatement of the multiplier must carry the n and the self-selection caveat together; an n without the caveat overstates the evidence more than the bare editorial tag did.
