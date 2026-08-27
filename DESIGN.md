# DESIGN.md — copilotplaybook.com design system of record

**Status:** Phase 1 contract. Authored 2026-08-26 by reading the repo, not by reading any prior style guide (there wasn't one).

This file is the contract every later chat is held to. If a change spec or an execution chat wants to do something this file forbids, the answer is stop and ask — not improvise.

---

## 0. Scope, and a correction to the plan

The v2 plan listed six HTML targets. The repo actually contains **21 HTML files**. The ones that carry the shared design system and are in scope:

| File | Lines | Bytes | Role |
|---|---:|---:|---|
| `cpb.html` | 9,077 | 1.36 MB | The Frontier Partner Playbook, v9. Primary asset. |
| `frontier.html` | 1,773 | 121 KB | Frontier program economics |
| `cowork.html` | 1,811 | 116 KB | Cowork |
| `landing.html` | ~1,100 | 99 KB | Landing |
| `cpbops.html` | 916 | 96 KB | Ops companion |
| `index.html` | 1,059 | 95 KB | Site index / resource directory |
| `CopilotIB.html` | — | 68 KB | Install-base play |
| `ledger.html` | 905 | 52 KB | **Separate design language — see §6** |
| `coworkdemo.html` | — | 47 KB | Cowork demo script |
| `CopilotApp.html` | — | 47 KB | App play |
| `cpbbackup.html` | — | 250 KB | **Stale fork — see §7** |

Out of scope for the refresh, but documented so nobody "helpfully" edits them: `customer-zero-starter-kit/*` (3 pages + `kit.css`, its own system) and `frontier-navigator/*` (7 pages + 2 CSS files, its own system).

### Correction: cpb.html is a hybrid, not "inline-only"

The plan said cpb.html has "3,859 inline `style=` attributes and no classes." Half right. It has **3,859 inline styles AND 707 `class=` attributes**, backed by a **1,308-line class-based stylesheet** (`cpb.html:46–1354`, plus a second `<style>` at `1355–1425`). Both systems are live and intermixed.

**Implication for spec authors:** when adding markup to cpb.html, prefer the existing class (`.callout`, `.card`, `.metric`, `.sku-card`) over hand-rolled inline styles. Inline styles are legacy accretion, not the house style. Match whichever convention the *surrounding block* uses.

---

## 1. Token table

### 1.1 Canonical shared block

Defined identically inside the `<style>` element of `cpb.html`, `frontier.html`, `cowork.html`, `cpbops.html`, `CopilotApp.html`, and `CopilotIB.html`:

| Token | Value | Notes |
|---|---|---|
| `--teal` | `#005F6B` | Primary accent. Universal — every file agrees. |
| `--teal-light` | `#007B8A` | |
| `--navy` | `#003057` | Headings, table header text |
| `--text` | `#1a2330` | Body copy |
| `--muted` | `#f7f8fa` | Panel background (`--soft` in index.html) |
| `--muted-2` | `#eef1f4` | Table header background |
| `--accent` | `#e4f0f3` | Callout background |
| `--warn` | `#fff8ed` | Caution background |
| `--border` | `#dde1e7` | All rules and hairlines (`--line` in index.html) |
| `--shadow-sm` | `0 1px 4px rgba(0,0,0,.07)` | |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,.09)` | |
| `--radius` | `8px` | |
| `--radius-lg` | `10px` | `12px` in index.html and landing.html |

### 1.2 Per-file additions

| File | Adds | Verdict |
|---|---|---|
| `index.html` | `--ice #a8ecf5`, `--cyan #48cae4`, `--navy-deep #002142`, `--excel #107c41`, `--blue #1e40af`, `--purple #4c1d95`, `--amber #d97706`, `--orange #c2410c`, `--slate #334155` | **Intentional.** Category palette for the resource directory; each card gets an accent via `.accent-*` classes. |
| `landing.html` | the same category palette plus `--pdf #b3261e`, `--amber-dark #92400e`, `--shadow-lg 0 12px 32px rgba(0,0,0,.13)` | **Intentional.** Same directory idiom. |
| `CopilotApp.html`, `CopilotIB.html` | semantic triads `--green/-bg/-bd` (`#065f46`/`#f0fdf4`/`#bbf7d0`), `--orange/-bg/-bd` (`#92400e`/`#fff8ed`/`#f5ddb0`), `--red/-bg/-bd` (`#7f1d1d`/`#fef2f2`/`#fecaca`) | **Intentional.** Status coding. |
| `coworkdemo.html` | `--success #ecfdf5`, `--opt-bg #f5f3ff`, `--opt-border #7c3aed`, `--opt-light #ede9fe` | **Intentional.** Demo-script branch coloring. |

### 1.3 Known divergences — decide, do not silently fix

| Divergence | Detail | Recommendation |
|---|---|---|
| **`--ltblue`** | `#6EC1E4` at `cpb.html:53`; `#4daab8` in `frontier.html`, `cowork.html`, `CopilotApp.html`, `CopilotIB.html` | **Drift.** These are not the same hue family — `#6EC1E4` is a sky blue, `#4daab8` a desaturated teal. Recommend normalizing cpb.html to `#4daab8`. **Requires sign-off — it is a visible change.** Until signed off, leave alone. |
| **`--radius-lg`** | `10px` in the playbook family, `12px` in `index.html`/`landing.html` | **Intentional.** Directory pages use softer cards. Leave. |
| **`--soft` / `--line`** | `index.html` names `--muted` as `--soft` and `--border` as `--line`; values identical | **Drift, cosmetic only.** Not worth a rename pass. Leave — noted so nobody "fixes" it into a broken state. |
| **`#a8ecf5`** | Hard-coded 25× in `cpb.html` as the on-dark highlight; formalized as `--ice` in `index.html`/`landing.html` | Not a bug. cpb.html predates the token. Do **not** convert during the refresh — 25 substitutions for zero visual change is pure risk. |
| **`cpbbackup.html`** | Entirely different values: `--teal:#007C89`, `--text:#1f2933`, `--muted:#f4f6f8`, `--accent:#e6f3f5`, `--warn:#fff4e5`, `--border:#e5e7eb` | **Stale fork of an older system.** See §7. |

---

## 2. Type

### 2.1 Stacks

| Role | Stack | Where |
|---|---|---|
| Body / UI | `'Segoe UI', 'Inter', Georgia, sans-serif` | The house stack. All playbook-family files. |
| Body (index.html) | `'Segoe UI', 'Inter', Arial, sans-serif` | Minor divergence; leave |
| Pull-quote / serif | `Georgia, serif` | `cpb.html` only |
| Code (cpb / cowork) | `Consolas, Monaco, monospace` | |
| Code (CopilotApp / CopilotIB) | `'Cascadia Code', 'Courier New', monospace` | |
| Code (coworkdemo) | `'Courier New', monospace` | |

`ledger.html` uses a completely different set — see §6.

**Prohibition:** no webfont may be added to any playbook-family file. Only `ledger.html` loads external fonts, and that is a deliberate exception.

### 2.2 Scale

Every size below is in active use. Measured across the eight light-theme playbook files (counts = occurrences).

| Size | Count | Role |
|---|---:|---|
| `.55rem` – `.58rem` | 105 | **Eyebrow label.** Always paired with `font-weight:700; text-transform:uppercase; letter-spacing:.09em`. |
| `.6rem` – `.62rem` | 204 | Micro-label; TOC column head (`letter-spacing:.14em`) |
| `.65rem` | 83 | Section eyebrow (`letter-spacing:.1em`) |
| `.68rem` – `.7rem` | 192 | Citation line, SKU row label, TOC head |
| `.72rem` | 170 | **Caption / unit label.** The workhorse small size. |
| `.74rem` – `.8rem` | 480 | Dense body, table body, callout body |
| `.82rem` | 230 | **Most common body size.** Back-to-TOC links. |
| `.84rem` – `.86rem` | 233 | Table header (`.85rem`), callout title (`.85rem`) |
| `.88rem` | 210 | **Second-most-common body size.** Card label, table cell. |
| `.9rem` – `.95rem` | 280 | Table base, card heading, callout body |
| `1rem` – `1.15rem` | 195 | Sub-head. `1.05rem` (31×) is the **inline stat value** size and `h3`. |
| `1.25rem` – `1.5rem` | ~50 | `h2` = `1.5rem`. `1.25rem` = lede paragraph. |
| `1.6rem` – `1.85rem` | ~30 | `.metric .k` = `1.75rem`. Provocation headline = `1.85rem`. |
| `2.4rem` | 10 | `.hero h1` |

**Prohibition:** do not introduce a size that is not on this list.

---

## 3. Component snippet catalog

Verbatim, copy-paste-exact. Spec `block-insert` changes must cite one of these by name.

### C1 · Callout (teal)

`.callout` CSS at `cpb.html:315–341`. Three variants: base, `.subtle`, `.warn`.

```html
<div class="callout">
  <div class="callout-title">Title in sentence case</div>
  <div class="callout-body">Body copy. <strong>Bold for the load-bearing clause.</strong> One to four sentences.</div>
</div>
```

Variants: `class="callout subtle"` (lighter `#f3fbfc` ground — for asides that shouldn't compete), `class="callout warn"` (amber `--warn` ground, amber title `#92400e` — caution and risk only, never plain emphasis).

**Use when:** a paragraph needs lifting out of the flow. Not for stats.

### C2 · Teal-rule inline callout (lightweight)

The 19× inline signature. Use inside cards and table cells where `.callout` is too heavy.

```html
<div style="background:var(--muted);border-radius:4px;padding:6px 10px;font-size:.8rem;color:#374151;border-left:2px solid var(--teal);">Text.</div>
```

### C3 · Eyebrow label — teal

```html
<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--teal);border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:6px;">LABEL</div>
```

### C3b · Eyebrow label — grey (secondary)

```html
<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#9ca3af;border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:6px;">LABEL</div>
```

### C3c · Section eyebrow (no rule)

```html
<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--teal);margin-bottom:6px;">LABEL</div>
```

### C4 · Metric card / hero stat block

CSS at `cpb.html:344–377`.

```html
<div class="metrics">
  <div class="metric">
    <div class="k">15M</div>
    <div class="l">Paid Copilot seats</div>
    <div class="s">Microsoft FY26 Q2, Jan 28 2026</div>
  </div>
</div>
```

`.metrics` is `repeat(auto-fit, minmax(210px, 1fr))` — it self-wraps. Put 2–4 `.metric` children in it.

### C5 · Grid card

CSS at `cpb.html:379–400`.

```html
<div class="grid">
  <div class="card">
    <div class="card-h">Card heading</div>
    <p class="card-b">Card body, .9rem, #374151.</p>
  </div>
</div>
```

`.grid` is `repeat(auto-fit, minmax(220px, 1fr))`.

### C6 · Three-across comparison grid ("Three Doors")

The hairline-separated dark grid at `cpb.html:1543+`.

```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin-bottom:30px;">
  <div style="background:rgba(255,255,255,.04);padding:20px 22px;position:relative;">…</div>
  <div style="background:rgba(255,255,255,.04);padding:20px 22px;position:relative;">…</div>
  <div style="background:rgba(255,255,255,.04);padding:20px 22px;position:relative;">…</div>
</div>
```

**On-dark only.** The `gap:1px` + background trick produces the hairline; do not replace it with borders.

### C7 · Inline arithmetic chip (on dark)

The `15M ÷ 450M = 3.3%` block, `cpb.html:1519–1534`. The highlighted term uses `#a8ecf5`; the others `#fff`; unit labels `rgba(255,255,255,.55)` at `.72rem`.

```html
<div style="display:inline-flex;align-items:center;gap:14px;background:rgba(0,0,0,.20);border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:12px 18px;margin:0 0 22px;flex-wrap:wrap;">
  <div style="display:flex;align-items:baseline;gap:6px;">
    <span style="font-size:1.05rem;font-weight:700;color:#fff;letter-spacing:-.01em;">15M</span>
    <span style="font-size:.72rem;color:rgba(255,255,255,.55);">paid Copilot seats</span>
  </div>
  <span style="color:rgba(255,255,255,.3);font-weight:300;">&divide;</span>
  <!-- … repeat … -->
  <div style="display:flex;align-items:baseline;gap:6px;">
    <span style="font-size:1.05rem;font-weight:700;color:#a8ecf5;letter-spacing:-.01em;">3.3%</span>
    <span style="font-size:.72rem;color:rgba(255,255,255,.55);">paid penetration</span>
  </div>
</div>
```

### C8 · Source / citation line — dark variant

```html
<p style="margin:0 0 26px;font-size:.78rem;line-height:1.55;color:rgba(255,255,255,.55);">
  <span style="color:rgba(255,255,255,.7);font-weight:600;">Source:</span> Publisher (Mon DD, YYYY). Named sources go in <span style="color:rgba(255,255,255,.7);">brighter spans</span>.
</p>
```

### C8b · Source / citation line — light variant

```html
<div style="margin-top:8px;font-size:.68rem;color:#9ca3af;font-style:italic;">Source: Microsoft Customer Stories, customers.microsoft.com</div>
```

### C8c · Source line — bold-label light variant

```html
<strong style="color:#6b7280;">Source:</strong> Microsoft 365 admin portal &mdash; Copilot usage report.
```

### C9 · Data table

CSS at `cpb.html:535–559`. Plain semantic HTML — no classes needed.

```html
<table>
  <thead><tr><th>Column</th><th>Column</th></tr></thead>
  <tbody><tr><td>Cell</td><td>Cell</td></tr></tbody>
</table>
```

`th` gets a `--muted-2` ground, navy `.85rem` text, and a `3px solid var(--teal)` left border. Even rows `#fafbfc`, hover `#f4f9fb`. **Never restyle a table inline — the element selectors handle it.**

### C10 · Section header + back-to-TOC anchor

The standing pattern in `cpb.html`, `frontier.html`, `cowork.html`:

```html
<div class="back-to-toc"><a href="#toc">&#8593; Back to Table of Contents</a></div>

<h2 id="kebab-case-slug-of-the-heading">Heading Text in Title Case</h2>
```

Some sections put an `<hr />` between the two. Anchor ids are kebab-case, occasionally number-prefixed (`#4-the-market-reality-…`). **Match the local convention of the file — do not renumber.**

### C11 · Dark hero panel (the Opening Provocation shell)

```html
<div style="margin:0 0 28px;border-radius:var(--radius-lg);overflow:hidden;box-shadow:0 8px 32px rgba(0,48,87,.18);">
  <div style="height:4px;background:linear-gradient(to right,var(--teal),#2da8bc,#a8ecf5);"></div>
  <div style="background:linear-gradient(135deg,#001f3d 0%,#003057 45%,#005F6B 100%);padding:44px 52px 40px;">
    <!-- eyebrow, headline, C7 chip, C8 source, C6 three-across -->
  </div>
</div>
```

On-dark eyebrow rule used inside it:

```html
<div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;">
  <div style="width:24px;height:2px;background:var(--teal);border-radius:1px;"></div>
  <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.45);">The Opening Provocation</div>
  <div style="flex:1;height:1px;background:rgba(255,255,255,.08);"></div>
</div>
```

### C12 · Check / cross glyph

```html
<span class="check">&#10003;</span>   <!-- #0f766e, weight 700 -->
<span class="cross">&#10007;</span>   <!-- #b91c1c, weight 700 -->
```

### C13 · SKU ladder card

CSS at `cpb.html:585–615`; 9 instances. `.sku-card > .sku-bar + .sku-body`; the body contains `.sku-header` (`.sku-num` + `.sku-title` + `.sku-price`) then `.sku-rows` (3-column grid of `.sku-row` → `.sku-row-label` + `.sku-row-text`).

**Use when:** presenting a priced service tier. Do not invent a new card shape for pricing.

---

## 4. Off-palette colors in active use

These are hard-coded, frequent, and legitimate. They are **part of the system** even though they are not tokens. Do not "fix" them into tokens.

| Value | Count | Role |
|---|---:|---|
| `#374151` | ~200 | Secondary body text (grey-700). The most-used non-token color. |
| `#6b7280` | ~30 | Tertiary text |
| `#9ca3af` | ~30 | Quaternary / citation text |
| `#e5e7eb` | ~25 | Alternate hairline (in table-ish contexts) |
| `#a8ecf5` | 25 | On-dark highlight |
| `#5a3a18` | 25 | On-amber text |
| `#f8fafc`, `#fafbfc` | ~30 | Zebra / panel grounds |
| `#004B87` | — | `.metric .k` value color (note: **not** `--navy`) |
| `#00474f` | — | `.callout-title` color |
| `#c5dde3`, `#c8e6eb`, `#f3fbfc` | — | Callout borders / grounds |
| `#f5ddb0`, `#d97706`, `#92400e` | — | Warn callout border / rule / title |
| `#0f766e`, `#b91c1c` | — | check / cross |

### 4.1 Alert palette — *added 2026-08-26, missed in the first pass*

The original §4 catalogued the greys and the callout colors but **missed the red/amber alert palette entirely**, which is used ~60 times. Found when the Phase 5 design lint flagged `#fef2f2` on a `cpb.html` diff as a new color; it was pre-existing and in use 19 times. Any lint built on the incomplete list would have produced a false positive on every comparison row in the file.

| Value | Count | Role |
|---|---:|---|
| `#dc2626` | 31 | Alert red — `<strong>` label in the red comparison rows |
| `#fef2f2` | 19 | Alert red ground — comparison-row background |
| `#fca5a5` | 6 | On-dark alert red (Door 1 / Door 2 glyphs) |
| `#f87171` | 3 | On-dark alert red, border/fill variant |
| `#fbbf24` | 3 | Amber accent on dark |
| `#fee2e2` | 2 | Alert red, lighter ground |

**Also present** in `CopilotApp.html` / `CopilotIB.html` as the tokenised triads (`--red #7f1d1d`, `--red-bg #fef2f2`, `--red-bd #fecaca`) — see §1.2. `#fef2f2` is therefore *both* a token value there and a hard-coded value in `cpb.html`. Do not attempt to reconcile them; note it and move on.

**Prohibition:** no color outside §1 + §4 (including §4.1) may be introduced by an execution chat. If new content genuinely needs one, it stops and asks.

**Lint caveat.** The §9 lint is line-based, so it reports every color on a *changed line*, not only colors that are *new*. Before treating a hit as a finding, check it against `main`:

```bash
git show main:<file> | grep -c '<color>'
```

A non-zero count means the value was carried through an unchanged attribute on a changed line — not introduced.

---

## 5. Per-file profile

| File | Tokens | Styling mode | Inline / class | Anchors | TOC convention | `Last updated` |
|---|---|---|---|---|---|---|
| `cpb.html` | shared + `--ltblue #6EC1E4` | **Hybrid** — 1,308-line stylesheet + heavy inline | 3859 / 707 | 38 ids, kebab-case, some number-prefixed | `#toc` target; `.back-to-toc` before each `<h2>` | **none — needs one added** |
| `frontier.html` | shared + `--ltblue #4daab8` | Class-first, moderate inline | 227 / 407 | 13 ids, 11 `<h2 id>` | `.back-to-toc` + `<nav>` at :757 | **none** |
| `cowork.html` | shared + `--ltblue #4daab8` | **Class-first, clean** | 19 / 294 | 20 ids, 19 `<h2 id>` | `.back-to-toc` + `<nav>` at :405 | present — `Last updated: April 22, 2026` in the byline footer |
| `cpbops.html` | shared (single-line `:root`) | Class-first, moderate inline | 245 / 451 | 11 ids, 9 `<h2 id>` | `id="toc"` at :278 | **none** |
| `index.html` | shared + category palette; `--soft`/`--line` names | **Pure class, zero inline** | 0 / 220 | 5 ids | `<nav>` at :792, no TOC | per-card `<p class="resource-updated">Last updated Mon DD, YYYY` |
| `landing.html` | shared + category palette + `--shadow-lg` | **Pure class** | 1 / 140 | 0 | none | **none** |
| `CopilotApp.html` | shared + semantic triads | Class-first | 7 / 154 | 15 | — | **none** |
| `CopilotIB.html` | shared + semantic triads | Class-first | 34 / 335 | 9 | — | **none** |
| `coworkdemo.html` | reduced + demo palette | **Pure class** | 0 / 34 | 12 | — | **none** |
| `ledger.html` | own set (§6) | **Pure class** | 2 / 281 | 0 | none | **none** |
| `cpbbackup.html` | stale set | Hybrid | 508 / 692 | 21 | — | **none** |

**Stamp normalization is a Phase 6 task**, not a Phase 5 one. Only `cowork.html` and `index.html` currently carry dates, and they use two different formats (`Last updated: April 22, 2026` vs `Last updated May 17, 2026` — note the colon).

---

## 6. ledger.html — a deliberately separate design language

`ledger.html` is not a variant of the playbook system. It is a statement-of-account treatment: ruled line items, tabular figures, a perforated action stub at the foot of the page.

- **Fonts:** Fraunces (display serif), Public Sans (body), IBM Plex Mono (figures). Loaded from Google Fonts — the only external font load in the repo.
- **Tokens:** a paper/ink/rule vocabulary (`--paper`, `--card`, `--card-2`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--rule-2`) rather than navy/muted/border.
- **Full dual-theme:** a light `:root`, a `@media (prefers-color-scheme:dark)` override, an explicit dark-class override, **and** a print override at :445. Nothing else in the repo does this.
- **Accent:** gold `#9A6205` / `#E2AC42`, plus `--sky #2E8FB5`. It shares only `--teal #005F6B` and `--navy #003057` with the house palette.

**DECIDED 2026-08-26: it stays distinct.** It reads as a different artifact class — a field ledger, not a playbook chapter — and normalizing it would destroy the thing that makes it worth having.

Because it stays distinct, for spec purposes `ledger.html` has its **own** catalog and its own prohibitions: nothing in §3 applies to it, and no §1 token may leak into it.

---

## 7. Decisions this file surfaces but does not make

| # | Item | Finding | Recommendation |
|---|---|---|---|
| 1 | `lincezone.css` (17.7 KB) | **Orphaned.** Zero `<link>` references anywhere in the repo. A navy/gold theme that matches nothing currently shipped. | Delete in Phase 6. Any agent that discovers it and follows it will produce wrong output. |
| 2 | `index_html.css` (1.4 KB) | **Also orphaned** — not mentioned in the plan. `index.html` has zero stylesheet links; its styles live in an inline `<style>` block. | Delete in Phase 6 alongside `lincezone.css`. |
| 3 | `cpbbackup.html` (250 KB) | Live on the domain. Uses a **stale token set** (`--teal:#007C89`, not `#005F6B`) and a stale font stack (`Segoe UI, Roboto, Arial`). 17 stale stats per the plan. | Move out of the web root or delete. It is a fork, not a backup — reconciling it is not worth the cost. |
| 4 | `--ltblue` split | `#6EC1E4` (cpb) vs `#4daab8` (everywhere else) | Normalize cpb → `#4daab8`. **Needs your sign-off** — visible change. |
| 5 | `ledger.html` design | Separate language, see §6 | **DECIDED 2026-08-26: stays distinct.** Committed to `main` so Phase 5 branches have a baseline. §3 does not apply to it; it gets its own catalog. |

---

## 8. Prohibitions — binding on every execution chat

1. **Never introduce a color, font-family, font-size, radius, or shadow value that is not in §1, §2, or §4.** If content needs one, stop and ask.
2. **Never add a CSS class to a file that does not already define it.** Check the file's own `<style>` block first. `index.html`, `landing.html`, `coworkdemo.html`, and `ledger.html` are pure-class files — adding an inline `style=` attribute to any of them is a violation.
3. **Never reformat, re-indent, prettify, or normalize whitespace.** Diffs must be semantic. A whitespace-only hunk is a failed execution.
4. **Never touch `cpb.html:1913`** — one 546,847-character line containing the sole base64 image blob in the repo. Do not read it, split it, or let a tool rewrite it. Any diff that touches line 1913 is an automatic revert.
5. **Never touch `lincezone.css` or `index_html.css`** during Phases 1–5. They are orphaned; deleting them is a deliberate Phase 6 decision, not a cleanup.
6. **Never let §1–§4 leak into `ledger.html`, `customer-zero-starter-kit/*`, or `frontier-navigator/*`.** They are separate systems.
7. **New markup is assembled from §3 catalog snippets.** Anything not derivable from the catalog needs sign-off recorded in the spec.
8. **Match the local convention.** cpb.html is a hybrid; a change inside a class-based block uses classes, a change inside an inline-styled block uses inline styles. Do not convert one to the other.
9. **One file per execution chat.** If a change appears to require a second file, stop and report.
10. **Your service prices are frozen. Microsoft's list prices are not.** *(Decided 2026-08-26.)* No execution chat may alter a currency value that is not registered in `data/facts.json`. The service price sheet — `$350`/`$400` per agent, `$15`/`$25`/`$55` per user, `$3,500`, `$8,000`, and every scenario dollar line derived from them — is out of scope. Roughly 200 currency anchors across the site are deliberately unregistered for exactly this reason (see `FACTS.md` §6). A diff that changes a dollar figure with no fact ID behind it is a failed execution.

    **Microsoft-published prices are in scope** where they carry a fact ID: SKU list prices, promotional rates, licensing prerequisites, and program figures. Scenario arithmetic that *derives* from a Microsoft price (e.g. `50 users × $21/user/month × 12 = $12,600`) sits on the boundary — **flag it in the spec, do not recompute it.** Changing a derived total is a service-price change wearing a licensing costume.

---

## 8b. Two rules that keep getting broken

Both of these have been caught in review on more than one file. They are not
preferences; treat them as prohibitions with the same weight as the colour and
type rules above.

### 8b.1 Prose runs the full width of its container

**Prohibition:** do not put `max-width` on a paragraph, a callout body, a note,
a lede, a standfirst, or any other run of prose.

A capped measure is good typography in the abstract and wrong here, because
these pages put prose directly above and below full-width tables, card grids
and diagrams. A paragraph that stops 200-400px short of the elements bracketing
it does not read as a considered measure -- it reads as a bug, and it has been
reported as one every time it has shipped.

If a line genuinely feels too long, **narrow the container, not the sentence**,
so the text still ends where its container does. `.masthead-inner` was reduced
from `1680px` to `1320px` for exactly this reason rather than capping the
standfirst inside it.

Allowed uses of `max-width`: page and section shells (`.stage`, `.masthead-inner`,
`footer.pagefoot`), form controls and inputs, and text that is a **flex sibling**
of another element in the same row, where an uncapped run would crowd it out
(`.statbar .small` next to `.statbar .big`, or `.stepnav .sn-hint` next to the
Continue button). Nothing else. A paragraph that owns its own row is never capped.

```bash
# any hit inside a prose rule is a finding
grep -nE 'max-width:[^;}]*(ch|em)' <file>
grep -nE '\.(lede|sub|note|callout|hint|body|track)[^{]*\{[^}]*max-width' <file>
```

### 8b.2 A reference to another playbook document is a link

**Prohibition:** do not name another document, section or stop in prose without
linking to it.

If the text says "Stop 5 of the 40-Minute Cowork Session", "section 11", "the
Licensing Snapshot" or "the Azure Billing Setup guide", the reader must be able
to click it. Partners use these documents side by side in a live meeting; making
them hunt for a named section is a real cost.

- Section anchors: `coworksession40.html#section-11` -- every `<h2>` in that file
  carries `id="section-N"`.
- Stop anchors: `coworksession40.html#stop-5` -- every `.stop` carries `id="stop-N"`.
- Add the anchor to the target file if it does not exist yet, rather than
  linking to the top of the page and leaving the reader to scroll.
- Style with `a.docref`. External links get `target="_blank" rel="noopener"`;
  same-site links do not.

```bash
# candidate references that may not be linked
grep -noE '(Stop [0-9]|[Ss]ection [0-9]+|40-Minute Cowork Session|Licensing Snapshot)' <file>
```

---

## 9. Design lint (Phase 6)

Grep every touched file for values not on the allow-list:

```bash
grep -ohE '#[0-9a-fA-F]{3,6}' <file> | sort -u
```

```bash
grep -ohE 'font-size:[ ]*[0-9.]+(rem|px|em)' <file> | sort -u
```

```bash
grep -ohE 'font-family:[^;}]*' <file> | sort -u
```

```bash
grep -ohE 'border-radius:[ ]*[0-9]+px' <file> | sort -u
```

Any result not present in §1 / §2 / §4 is a finding.
