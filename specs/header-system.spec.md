# header-system.spec.md — C14 page masthead, site-wide

**Authored 2026-08-27.** Decision: **Concept B shell + Concept D behaviour.** A dark
full-bleed masthead, with its navigation row pinned to the top of the viewport on scroll.

Reference implementation already applied and verified in the browser:
**`coworksession40.html`**. Copy from it; do not re-derive.

---

## 1. Why

Measured across 13 pages before this change:

| Problem | Count |
|---|---|
| Pages with any link back to the hub | **1 of 13** |
| Pages whose title is a styled `<div>`, not an `<h1>` | **6** |
| Distinct header treatments in use | **6** |

A partner who opens a shared link to `coworksession40.html` currently has no way to
discover the rest of the site. That is the defect this spec closes.

---

## 2. Scope

**In scope — 12 files.** Each gets the C14 masthead:

`index.html`, `cpb.html`, `cpbops.html`, `frontier.html`, `cowork.html`,
`coworksession40.html` *(done)*, `cowork-calculator.html`, `coworkdemo.html`,
`CopilotApp.html`, `CopilotIB.html`, `azure-billing-setup.html`, `shadowai.html`

**Deleted — 2 files.** `landing.html` and `ledger.html`, per owner instruction
2026-08-27. Verified first: no HTML page links to either, and neither appears in
`sitemap.xml`. This supersedes `DESIGN.md` §6 and §7 item 5.

**Untouched.** `cpbbackup.html` (stale fork, `DESIGN.md` §7 item 3),
`customer-zero-starter-kit/*`, `frontier-navigator/*` (separate systems, §0),
`_stage1.html`, `_unused.html` (scratch).

---

## 3. The component

### 3.1 Structure

`.mh-bar` **must be a direct child of `<body>`**, immediately followed by `.masthead`.
Nesting the bar inside a wrapper breaks `position:sticky` — it would unstick the moment
that wrapper scrolled out of view. This was verified, not assumed.

```html
<div class="mh-bar">
  <div class="mh-bar-in">
    <a class="mh-home" href="index.html">
      <svg width="23" height="23" viewBox="0 0 178 178" aria-hidden="true"><path class="ring" d="…"/></svg>
      <span class="lbl">Copilot Playbook</span>
    </a>
    <div class="mh-crumb"><a href="PARENT.html">Parent</a><span class="sep">/</span><span class="cur">This Page</span></div>
    <div class="mh-date">Updated Month D, YYYY</div>
  </div>
</div>
<div class="masthead">
  <div class="masthead-inner">
    <div class="mh-eyebrow"><div class="bar"></div><div class="lbl">Doc Type &middot; Family</div></div>
    <h1>Page Title</h1>
    <p class="sub">One or two sentences. Never given a max-width — DESIGN.md §8b.1.</p>
    <p class="mh-meta">Audience or attribution line. Optional.</p>
  </div>
</div>
```

The `d=` attribute is the TD SYNNEX circular mark, copied **verbatim** from
`coworksession40.html`. 1,208 characters, inlined — no image request, no base64 blob.
It is the home affordance, so it lives inside the `<a>`.

### 3.2 CSS

Copy the whole `/* ═══ C14 · PAGE MASTHEAD ═══ */` block from `coworksession40.html`,
appended just before `</style>`. **Two declarations are per-file** and must be
recomputed — everything else is byte-identical across all 12 files.

```
.mh-bar   { margin: -{BODY-PAD-TOP} -{BODY-PAD-X} 0; }
.masthead { margin: 0 -{BODY-PAD-X} 24px; }
.mh-bar-in, .masthead-inner { padding-left: {BODY-PAD-X}; padding-right: {BODY-PAD-X}; }
```

These negative margins bleed the header to the edges of the body's content column.
**They must match that file's `body` padding exactly.** A margin larger than the
padding produces a horizontal scrollbar — the one failure mode of this approach.

Because several files change `body` padding inside a media query, the block's
`@media (max-width:720px)` section must be re-pointed at **that file's** narrow-width
body padding. If a file has several breakpoints that change padding, match the
smallest horizontal value so the margin never exceeds the padding.

Measured values:

| File | `body` padding | `.mh-bar` margin | `.masthead` margin |
|---|---|---|---|
| `index.html` | `16px 22px 48px` | `-16px -22px 0` | `0 -22px 24px` |
| `cpb.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `cpbops.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `frontier.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `cowork.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `coworksession40.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `coworkdemo.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `CopilotApp.html` | `32px 28px 64px` | `-32px -28px 0` | `0 -28px 24px` |
| `CopilotIB.html` | `32px 28px 64px` | `-32px -28px 0` | `0 -28px 24px` |
| `azure-billing-setup.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `shadowai.html` | `32px 28px` | `-32px -28px 0` | `0 -28px 24px` |
| `cowork-calculator.html` | `0 0 80px` | `0` | `0 0 24px` |

### 3.3 Anchor offset

The block includes `[id] { scroll-margin-top: 58px; }`. Without it every
back-to-TOC link lands 46px under the pinned bar. Do not omit it.

---

## 4. Palette and type — no new values

Every value is already in `DESIGN.md` §1, §2.2 or §4. Nothing here needs sign-off.

| Value | Source |
|---|---|
| `#003057` / `var(--navy)` | §1.1 |
| `#005F6B` / `var(--teal)` | §1.1 |
| `#001f3d` | §3 C11, existing hero gradient |
| `#a8ecf5` | §4, on-dark highlight |
| `#6b7280` | §4, tertiary text (print override only) |
| `1.85rem`, `1.5rem`, `.95rem`, `.74rem`, `.68rem`, `.65rem` | §2.2 |
| `border-radius: 20px` | existing `.mh-badge`, `cowork-calculator.html` |

`var(--navy,#003057)` and `var(--teal,#005F6B)` carry fallbacks because
`index.html` renames some shared tokens (§1.3) — the fallback makes the block
portable without a rename pass.

**Prohibited here as everywhere:** no `max-width` on `.sub` or `.mh-meta`
(§8b.1). The standfirst ends where its container ends.

---

## 5. Print

The block ships a `@media print` override that hides the sticky bar, flattens the
gradient to white and restores navy-on-white type. These documents are leave-behinds;
a full-bleed dark gradient across the top of every printed page is unacceptable.
Do not drop this override.

---

## 6. Per-file content

Breadcrumbs root at `index.html` — the sitemap puts `/` at priority 1.0.

| File | Crumb | Eyebrow | H1 |
|---|---|---|---|
| `index.html` | *(omit `.mh-crumb`; home links nowhere)* | Partner Resource Hub | keep existing `<h1>` text |
| `cpb.html` | `The Frontier Partner Playbook` | Practitioner Guide · Playbook | The Frontier Partner Playbook |
| `frontier.html` | `The Path to Frontier Partner` | Program Guide · Frontier | The Path to Frontier Partner |
| `cpbops.html` | `Engagement Ops Guide` | Field Manual · Operations | CPB Engagement Ops Guide |
| `cowork.html` | `Cowork` / `Power User Guide` | Field Manual · Cowork | The Copilot Cowork Power User Guide |
| `coworksession40.html` | `Cowork` / `The 40-Minute Cowork Session` | Partner Field Guide · Cowork | The 40-Minute Cowork Session |
| `cowork-calculator.html` | keep its existing 3-level crumb | keep its existing eyebrow | keep existing |
| `coworkdemo.html` | `Cowork` / `Chief of Staff Brief` | One Prompt Setup · Cowork | Chief of Staff Brief |
| `CopilotApp.html` | `Microsoft Copilot Field Guide` | Field Guide · Microsoft Copilot | Microsoft Copilot Field Guide |
| `CopilotIB.html` | `Agent Knowledge Reference` | Technical Reference · Agent Builder | Copilot Agent Knowledge Reference |
| `azure-billing-setup.html` | `Azure Billing Setup` | Field Guide · CSP Billing | Azure Billing Setup for CSP Partners |
| `shadowai.html` | `Shadow AI Assessment` | Assessment Guide · Governance | The Shadow AI Assessment Guide |

**Preserve every existing date.** Where a file already carries a `Last updated`
value, move that exact date into `.mh-date` as `Updated Month D, YYYY`. Do not
invent a date for a file that has none — omit `.mh-date` instead.

---

## 7. Two structural fixes carried by this spec

1. **Six `<div>` titles become real `<h1>` elements** — `frontier.html`,
   `cowork.html`, `cpbops.html`, `coworksession40.html`, `azure-billing-setup.html`,
   `shadowai.html`. They currently have no top-level heading at all.
2. **`cpb.html` gives up `theheader.png`.** The primary asset's front door becomes
   live text. Owner-approved 2026-08-27. `theheader.png` is then referenced by
   nothing; leave the file on disk, deleting it is a separate decision.

**`cpb.html` also carries prohibition 4:** line 1913 is a single 546,847-character
base64 blob. Do not read it, split it, or let any tool rewrite it. Edit only the
top of the file.

---

## 8. Verification

```bash
# every page reaches home exactly once
grep -c 'class="mh-home"' *.html

# no page still uses the old centered title-stack
grep -l 'text-align:center;padding:36px 0 28px' *.html

# real h1 everywhere
grep -c '<h1' *.html

# no new colours introduced
grep -ohE '#[0-9a-fA-F]{3,6}' <file> | sort -u
```

Then load each file and confirm: the bar pins on scroll, a TOC link lands below
the bar rather than under it, and print preview shows white behind the title.
