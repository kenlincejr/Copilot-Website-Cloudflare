# specs/copilot-token-economics.spec.md: Build spec for The Meter Conversation

**Status:** Approved by Ken 2026-10-11 ("this needs to become the latest asset on our playbook site"). Build contract for Release 1, due before the NYC workshop on 2026-10-14.

**Target:**
- [`copilot-token-economics.html`](../copilot-token-economics.html): new page.
- [`index.html`](../index.html): one new section with one card, placed directly after "Start Here" so it reads as the latest asset.
- [`sitemap.xml`](../sitemap.xml): one entry.
- [`data/facts.json`](../data/facts.json): facts F-205 onward, each with an occurrence anchor in the new page.

**Depends on:**
- [`research/token-economics-practice/`](../research/token-economics-practice/): the four memos (00 synthesis and talk track, 01 Microsoft, 02 who is monetizing, 03 analysts). Every claim on the page traces to one of them.
- [`DESIGN.md`](../DESIGN.md): tokens §1, type scale §2, catalog §3, off-palette §4, prohibitions §8, the four §8b rules, the §9 lint.
- The AgentOps model in [`cpb-model-the-practice.html`](../cpb-model-the-practice.html): Tier 1 to 3, the four pricing dials, Credit Wrap.

---

## 1. Pitch

The playbook's first question was "what do I do for the Copilot upcharge?" The three tiers answered it. From December 1, 2026 every Copilot Business license sold through CSP arrives with a consumption meter switched on, defaulting to a ceiling that is larger than the license, billed through the partner. This page gives a partner business owner the customer's new problem in plain words, the three sentences to say, the four-verb service to sell, the pricing of the new line, the talk track, the objections and the December 1 campaign.

## 2. Reader

An SMB-focused MSP owner or practice lead, buying through distribution, who has read Build Belief and Model the Practice and now needs to understand why consumption changes the business and how to monetize it. Secondary reader: the seller who takes the talk track into the room.

## 3. Page structure

Masthead (C14), "How to use this" callout, TOC, then:

1. The Answer, On One Page. Hero statement and three metric cards.
2. What Changed: Seats Plus Usage. Dark panel with the Microsoft quotes; 2026 timeline.
3. The Customer's New Problem. Chart A (license vs default ceiling at 50/100/300 seats, with table); bill-shock evidence (Chart D, with table); "what a credit buys" three price tags.
4. Nobody Has Packaged It Yet. The white space; why (API, defaults, no IT staff).
5. The Three Sentences. Three saidlines.
6. The Service in Four Verbs. SET, WATCH, TUNE, PROVE as phase cards with cadence and admin-center surface.
7. The Whiteboard. Chart B (old math, Copilot math, the new fourth line, governed vs default).
8. Pricing the Fourth Line. Where Credit Wrap sits today; the recommended structure table; worked 50-user example; Chart C (floor vs spread across a 50-customer book).
9. How the Money Flows Through Distribution (added 2026-10-11 at Ken's request). Two billing paths, partner liability, the revenue-line table, the six set-up steps, a worked 50-seat invoice, the one-slide version.
10. Governed Growth, Not Cost Cutting. Microsoft's incentives and the honest framing.
11. The Talk Track. Opening, the credit answer, the offer, the ask.
12. Objections. Table with sourced rebuttals.
13. The December 1 Campaign. Checklist and timeline.
14. Guardrails. Trap cards: what never to say.
15. Sources, Provenance and Related Guides.

## 4. Design decisions recorded for sign-off (DESIGN §8 prohibition 7)

- **Charts are inline SVG using house colors only** (`--teal`, `#004B87`, `#d97706`, `--ltblue`, greys). The dataviz validator flags the house palette's chroma and the `--ltblue` contrast; DESIGN §8.1 forbids new colors, so the mitigation is the validator's own prescribed relief: every mark is directly labeled and every chart is followed by its data table. No chart uses more than four series; adjacent pairs pass the CVD check.
- **No scripts, no libraries, no webfonts.** SVG `<title>` elements provide native hover tooltips.
- **Font sizes inside SVG are set in CSS classes using scale values from DESIGN §2.2** (`.72rem`, `.78rem`, `.82rem`, `1.05rem`).
- **New component classes** (`.chart`, `.chart-key`, `.verb`, `.pricetag`, `.sentence`) are defined in this page's own `<style>` block and nowhere else (§8.2). Their values are drawn from §1, §2 and §4 only.
- **Grids:** `.metrics` carries 3 children; `.recap-grid` carries 3; the verb set is 4 and uses a pinned `repeat(2, 1fr)` (§8b.3). No auto-fit grid holds 4 or 5 children.

## 5. Facts

| ID | Value | Where it appears | Type |
|---|---|---|---|
| F-149 | $0.01 per credit | §1, §3, §10 | microsoft-reported (existing) |
| F-157 | 4,000 credits default | §1, §3 | microsoft-reported (existing) |
| F-156 | 1 December 2026 | §1, §2, §12 | microsoft-reported (existing) |
| F-176 | $21 Copilot Business | §1, §3, §7 | microsoft-reported (existing) |
| F-147 | $18 promo | §3 | microsoft-reported (existing) |
| F-013 | $200 per 25,000-credit pack | §6, §8 | microsoft-reported (existing) |
| F-152 | 5%–20% P3 discount | §6 | microsoft-reported (existing) |
| F-150 | $82–228 Cowork per user | §3, §10 | microsoft-reported (existing) |
| F-162, F-163 | 2 credits per generative answer, 5 per action | §10 | microsoft-reported (existing) |
| F-201 | $12 Tier 1/2 per-user base | §7, §8 | our-price (existing) |
| F-202 | 30% Credit Wrap markup (the current page) | §8 | our-price (existing) |
| F-205 to F-225 | New: the Microsoft quotes, the analyst figures, the Business Premium price, the Credit Wrap floor prices, the FinOps thresholds, the Cowork incentive mechanics (SECONDARY, labeled) | see `data/facts.json` | as registered |

**Derived arithmetic, flagged per §8.10 and not registered:** 50 × $21 = $1,050; 100 × $21 = $2,100; 300 × $21 = $6,300; 50 × $40 = $2,000; 100 × $40 = $4,000; 300 × $40 = $12,000; the 50-user worked example ($200 floor, $750 credit ceiling at 1,500 credits, ~$90 pack spread, ~$290 per customer, ~$175,000 across 50 customers); the whiteboard per-user stacks.

## 6. Gates before merge

1. `python tools/check-facts.py` exits 0 for every new occurrence.
2. DESIGN §9 lint greps return only values in §1, §2, §4.
3. §8b greps: no `max-width` on prose; every named playbook document is a link; no 4- or 5-child auto-fit grid; no prose in a numeric cell.
4. US English grep clean; no distributor other than TD SYNNEX named; no Customer Zero data.
5. Rendered in the browser at desktop and phone width; charts legible; masthead pins on scroll.
