# specs/cowork-calculator.spec.md — Build spec: the Cowork Cost & Conversation Simulator

**Status:** Pre-build product spec. Authored 2026-08-27, for hand-off to a dedicated build chat.
**Target:** a new, net-new asset — no existing file is being edited by this spec.
**Depends on:** [`DESIGN.md`](../DESIGN.md) (visual system), [`FACTS.md`](../FACTS.md) + [`data/facts.json`](../data/facts.json) (fact governance), [`coworksession40.html`](../coworksession40.html) (the conversation this tool has to serve).

This is **not** a Phase-4-style diff spec — there is no `BEFORE`/`AFTER` because nothing exists yet. It is a product spec: what to build, why, what it computes, what it says, and what to check before it goes live. Treat it the way this repo treats everything else that touches a number or a claim: cite the source, register the fact, don't ship an unverified figure to a partner who's about to say it to a customer.

---

## 1. The one-line pitch, and why it's different from what exists

Microsoft already publishes a [Copilot Credit Estimator](https://microsoft.github.io/copilot-studio-estimator/). It is accurate and it is generic — you get a number and nothing else.

**This tool has to do three things the Microsoft estimator does not:**

1. **Take a real customer's shape as input** (seat counts by role, current licensing, governance posture, vertical) instead of abstract sliders.
2. **Return a governance and licensing recommendation alongside the cost** — not just "here's what it costs" but "here's what you own today, what you're missing, and what to buy."
3. **Generate the conversation, not just the number.** The output includes the talk track a partner should actually run with this specific customer — which objections to pre-empt, which SOW to lead with, which line from the 40-Minute Cowork Session script applies.

That third point is the whole differentiator. **A calculator that only computes a dollar figure is a commodity — Microsoft already ships that one for free. A calculator that hands a partner the next five minutes of the meeting is a moat.**

Working title: **the Cowork Cost & Conversation Simulator.** (Referenced elsewhere in this site's source material as the "Cowork Cost Simulator" — this spec keeps that name for continuity but the build should make the conversation-engine half equally prominent in the UI, not a bolt-on.)

---

## 2. Who uses it, and when

**Primary user:** an SMB-focused Microsoft partner seller, AI/practice lead, or vCIO — the same audience as every other asset on this site. Not a developer, not IT.

**The three moments it gets used**, all already described in `coworksession40.html`:

| Moment | What they need from it |
|---|---|
| **Stop 5 of the 40-Minute Cowork Session** ("The Customer Cost Story") | Live, in front of a room or a customer, in under 90 seconds — enter a rough headcount and role mix, get a number, print a leave-behind. |
| **Discovery / pre-call prep** (Section 9's "Simulate your own customer" drill) | Slower, more careful — model a specific named account before the call, decide which SOW to open with. |
| **Post-sale, ongoing** (Section 11's Managed AI Governance retainer) | Re-run monthly against real Cost Management numbers to check the estimate against reality and re-forecast. |

Design for all three speeds. The fast path (Stop 5) must not require filling in fields the partner doesn't have on hand mid-conversation — every non-essential input needs a sane, disclosed default.

---

## 3. What it computes — the calculation engine

### 3.1 Core formula (already partially validated on this site)

```
credits_per_user_per_month = (light_tasks × 125) + (medium_tasks × 500) + (heavy_tasks × 1,200)
monthly_cost_per_user       = credits_per_user_per_month × $0.01
monthly_cowork_bill         = Σ over all users (monthly_cost_per_user)
```

Default task-mix-per-persona table (already in use in `coworksession40.html`, sourced to "Microsoft's Frontier-observed defaults" in the site's own prior material — **status: needs a real citation, see §6**):

| Persona | Light/mo | Medium/mo | Heavy/mo |
|---|---:|---:|---:|
| Corporate Knowledge Worker | 22 | 11 | 5 |
| Customer-Facing | 17 | 13 | 5 |
| Technical | 12 | 9 | 14 |
| Manager / Senior Leader | 13 | 6 | 3 |

Every one of these six numbers (four rows × light/medium/heavy, collapsed) must be **editable by the partner in the UI** — they are defaults, not constants. A partner who's run this tool three times on real tenants will have better numbers than Microsoft's published defaults, and the tool should let them save their own.

### 3.2 Secondary calculations

- **License cost.** `seat_count × $30/user/mo` (M365 Copilot list price) as the baseline license line, shown next to the Cowork line, not merged into it — the whole point of the 2.6× narrative (§6) is that these are two separate, addable line items.
- **The ratio check.** `monthly_cowork_bill ÷ monthly_license_bill`, computed live from the partner's actual inputs — displayed as "your customer's ratio" next to the site's cited **2.6× average for an actively engaged user**, so the tool never just repeats a stat, it validates or contradicts it in real time. If the customer's computed ratio is wildly different from 2.6×, that's itself a talking point ("your account is unusually light/heavy on Cowork relative to typical tenants — here's what that usually means").
- **PayGo vs. pre-purchase (P3).** Model the discount rate for a P3 commitment against straight PayGo at $0.01/credit. (P3 discount % — **needs sourcing, see §6**.)
- **License uplift delta.** Three-column comparison — Business Premium alone / Business Premium + Defender Suite + Purview Suite / E5 — reusing the numbers already on this site: BP $22/user/mo, Suites add-on ~$15/user/mo, 50% promo with a Copilot purchase. Output: a per-capability grid (governance capability × ✓/partial/✗) plus a blended $/user/month figure for whichever path the partner's inputs point to.
- **Governance readiness score.** A simple weighted flag system (not a fake precision score) built from: Purview labels configured? (y/n/unknown) · DLP for AI configured? · Defender for Cloud Apps deployed? · Azure plan exists on the CSP channel? · Named cost owner exists? Each "no" or "unknown" maps to a specific talking point and a specific ladder rung (§4).

### 3.3 What this tool must NOT compute

Per `DESIGN.md` prohibition 10 and `FACTS.md` §6: **this tool must not silently assert a partner service price** (the Managed AI Governance retainer's $4–$8/seat/month, the $8K–$18K oversharing remediation fee, etc.). Those ranges exist on this site as *editorial estimates for partners to test against their own cost models* — not survey data. The calculator should:

- Show the published *range* as a default, clearly labeled as an editable starting point, not a quote.
- Let the partner overwrite it with their own number, and **remember it** (local storage) so every subsequent run uses the partner's real pricing, not the generic range.
- Never present a computed total that blends Microsoft's published prices with the partner's own service prices without a clear visual break between "what Microsoft charges" and "what you charge."

---

## 4. What it says — the conversation engine

This is the part that doesn't exist anywhere else and is the actual point of building this instead of pointing partners at Microsoft's estimator.

### 4.1 The mechanism: a rules table, not a chatbot

No LLM call, no external API — this needs to work **offline, in a browser, on stage, with no network dependency** (matching the existing "browser-based, offline, PDF-exportable" requirement already on record for this tool). The conversation engine is a deterministic **rules table**: `(condition) → (talking point + evidence + which ladder rung + which section of coworksession40.html to reference)`.

### 4.2 Example rule rows (illustrative — the real table is a build-phase deliverable, not this spec)

| Condition | Output |
|---|---|
| `data_security_maturity ∈ {Minimal, Limited-Unhealthy}` | Surface the Shadow AI wedge line verbatim from Stop 3 of the session guide. Recommend Rung 1 (Assessment) before anything else. |
| `has_azure_csp_subscription = false` | Surface the billing-wall warning (the CSP-managed tenant flag forces the Azure plan onto the partner channel). Block the "ready to sell Cowork today" badge until this is resolved — this is a hard gate, not a soft suggestion, matching Section 10's "do not sell Cowork before confirming a CSP-channel Azure subscription exists." |
| `computed_ratio > 3.5×` (well above the 2.6× benchmark) | Flag as a concentration risk — surface the "investigate before capping" guidance from the admin playbook (Section 11 of the session guide) rather than a straight cost objection response. |
| `owns_purview_suite = false AND seat_count ≥ 25` | Surface the licensing snapshot's "SMB-native path" card verbatim — BP + Copilot + Purview Suite, not an E5 upsell. |
| `vertical ∈ {healthcare, finance, legal, public-sector, EU}` | Surface the regulated-vertical premium framing and flag the vCISO retainer (Rung 5) as the likely eventual destination, not just Rung 3. |
| `customer_prefers_claude_or_chatgpt = true` | Surface the "same model, different governance" reframe (Stop 4) and offer to open the deep comparison table. |
| default / no flags raised | Surface the standard SOW menu (Rungs 1–2 mandatory) and the 30-day contract close. |

### 4.3 Output artifact

The generated output is not a chat transcript — it's a **structured leave-behind**, matching this site's existing document language (teal/navy palette, `DESIGN.md` component catalog):

1. **The number** — monthly Cowork bill, license bill, computed ratio, side by side.
2. **The licensing recommendation** — the uplift grid.
3. **The readiness flags** — a short list of ✓/⚠/✗ governance gates, each linked to the specific talking point.
4. **The talk track** — 3–5 sentences, assembled from the rules table, written in the same second-person, direct-address voice as `coworksession40.html` ("Say this:" not "The partner should say").
5. **The next step** — one named ladder rung (from Section 11 of the session guide) with its price range and its one-sentence opener.

This block should be:
- Rendered on-screen live, in the DESIGN.md-compliant visual system.
- **Printable / exportable to PDF** via the browser's native print (no server round-trip) — this is a hard requirement carried over from the existing tool description ("browser-based, offline, PDF-exportable").
- Copy-to-clipboard for the talk track specifically, so a partner can paste it into a CRM note or an email follow-up.

---

## 5. UX flow

Four steps, front-loaded so the fast path (Stop 5 of the session, ≤90 seconds) only requires Step 1 and a one-click "use defaults" on Step 2.

1. **Customer & account.** Name (free text, stored client-side only — see §7), seat count, current license (BP / BP+Suites / E5 / unsure), Azure/CSP subscription (yes/no/unsure), vertical (dropdown incl. "not regulated").
2. **Persona mix.** Four persona rows pre-filled with the default task-mix table (§3.1), each editable. A "quick mode" toggle collapses this to a single blended default if the partner doesn't know the breakdown.
3. **Governance readiness.** Five yes/no/unsure toggles (Purview labels, DLP, Defender for Cloud Apps, named cost owner, cyber insurance renewal within 12 months). This step can be skipped entirely for the 90-second fast path — skipping just means the readiness flags default to "unknown" and the conversation engine treats every "unknown" as a discovery-question prompt rather than a hard flag.
4. **Results.** The output artifact from §4.3, live-updating as any input above changes (no separate "calculate" button — this should feel instantaneous, consistent with the "ninety seconds" promise already made in the session guide).

Persist all inputs to `localStorage` keyed by a partner-entered account nickname, so a partner can reopen the tool later against the same account without re-entering everything (Section 11's monthly re-forecast use case).

---

## 6. Facts this tool depends on — verification status

Per this repo's own fact-governance discipline (`FACTS.md`), every number a partner might say out loud to a customer needs a source before it ships. This table is the pre-build punch list — **do not hardcode any of these into the calculator until each row is resolved.**

| Value | Currently used where | Status | What's needed |
|---|---|---|---|
| `$0.01` / Copilot Credit | `coworksession40.html`, `cowork.html` W-05 | **Verified** — Microsoft-published, cited in `cowork.spec.md` | None — safe to ship |
| `$0.70–$15` typical task cost | `cowork.html` (per `cowork.spec.md` W-05) | **Verified** — Microsoft-published | None — safe to ship |
| Persona task-mix defaults (125/500/1,200 credit weights; the four-persona table in §3.1) | `coworksession40.html` | **Unverified.** Attributed only to "Microsoft's Frontier-observed defaults" with no source URL or `as_of` date | Find the primary Microsoft source (likely the Cowork Partner Launch Kit or the Credit Estimator's own default table) and register as a new fact in `data/facts.json`, or mark clearly in-app as "TD SYNNEX-modeled, not Microsoft-published" if no primary source exists |
| **2.6× Cowork-to-license ratio** | `coworksession40.html` (Stop 5), attributed to "TD SYNNEX internal validation" | **Confirmed net-new** — `FACTS.md` §8 explicitly notes this figure does **not** appear anywhere in the current site's registered fact set | Register as `td-synnex-internal` in `data/facts.json` with a real `as_of` date and, ideally, the sample size / methodology behind it. This is the single most-quoted number in the whole session guide — it needs a citation before it's embedded in a tool partners will use with customers. |
| `$22` Business Premium /user/mo | `coworksession40.html` §6 | **Needs verification** — check against current Microsoft price list at build time (prices move) | Confirm current list price, register `as_of` date |
| `~$15` Defender+Purview Suite add-on | `coworksession40.html` §6 | **Needs verification**, same as above | Confirm current price, register |
| `50%` Purview Suite promo w/ Copilot purchase | `coworksession40.html` §6 | **Needs verification** — promotional pricing changes on short cycles per `FACTS.md` §5 | Confirm promo is still live at build/ship time; this is the single fastest-decaying fact in the whole spec |
| P3 pre-purchase discount rate | Referenced conceptually, no % ever stated on this site | **Not sourced anywhere yet** | Needs a real Microsoft source before the P3-vs-PayGo toggle (§3.2) can show a real discount number — until then, ship PayGo-only and label P3 as "contact your distributor for current pre-purchase rates" |
| Partner service price ranges (retainer $4–$8/seat/mo, assessment $1.5K–$7.5K, etc.) | Multiple | **Explicitly editorial, not facts** — `FACTS.md` §6 | Not a verification task — a product decision: ship as edit-on-first-use defaults, never as fixed output (§3.3) |

**Build-order implication:** Phase 1 of the actual build (§9) should be a short fact-verification pass against this table — resolving the 2.6× citation and the three "needs verification" Microsoft prices — before any UI work starts. Shipping a partner-facing tool with an unsourced headline number is a worse outcome than shipping a week later with one.

---

## 7. Technical approach

- **Static HTML/CSS/JS, no backend, no build step** — consistent with every other asset in this repo (`cpb.html`, `cowork.html`, etc. are all hand-authored static pages) and with this tool's own "browser-based, offline" requirement. Plain JS is sufficient; do not introduce a framework or bundler into a repo that has none.
- **Visual system: `DESIGN.md` compliance, full stop.** Reuse the token set (`--teal #005F6B`, `--navy #003057`, etc.), the font stack (Segoe UI/Inter), and the component catalog (§3 of `DESIGN.md` — callouts, metrics, tables, tier cards) rather than inventing a new visual language for the calculator. It should look like it belongs on this site, not like a third-party embed. `coworksession40.html` is the closest existing reference for the extended component set (tool cards, worked-example tables, rung components) this build will likely need to extend further.
- **No PII leaves the browser.** Customer names and account details are useful labels for the partner's own session, not data this tool should transmit anywhere. `localStorage` only — no analytics payload should ever include a customer name. (Cloudflare Web Analytics / the beacon script already on other pages is fine for page-level metrics; it must not be wired to form field values.)
- **Print/export via native browser print (`window.print()`) with a dedicated print stylesheet**, not a PDF-generation library — keeps the zero-dependency, zero-backend promise intact.
- **File location:** new file at repo root, e.g. `cowork-calculator.html`, matching the flat-file convention of `cowork.html`, `frontier.html`, etc. (not nested under a subdirectory — those are reserved for the two systems that deliberately stay separate per `DESIGN.md` §0 and §6).

---

## 8. Non-goals for v1

- **No live ASPX integration.** ASPX requires Partner Center authentication and is not something a static public page can call. v1 is manual-entry only; a partner who wants to seed inputs from ASPX copies the numbers in by hand (already the workflow described in `coworksession40.html` §2).
- **No live Cost Management API integration.** Same reasoning — this is a planning/conversation tool, not an admin-center replacement. The re-forecast use case (Section 11) is "open the tool again with updated numbers," not a live data feed.
- **No multi-tenant save/share/login.** `localStorage` only for v1. A shareable link or account system is a v2 conversation, not a blocker for shipping something partners can use tomorrow.
- **No LLM call.** The conversation engine is a deterministic rules table (§4), not a live model — this keeps it fast, offline-capable, and free of a whole category of accuracy/hallucination risk for a tool whose entire value proposition is precision.

---

## 9. Phased build plan

| Phase | Deliverable |
|---|---|
| **1 — Fact verification** | Resolve every row in §6's status table. Register new facts in `data/facts.json` (the 2.6× ratio and the persona task-mix table, at minimum). This phase produces citations, not code. |
| **2 — Calculation engine** | Build and unit-test the pure-JS calculation layer from §3 in isolation (no UI yet) — credits, license cost, ratio, uplift grid, readiness flags. Verifiable independent of design work. |
| **3 — Conversation rules table** | Author the full rules table from §4 (this spec's §4.2 is illustrative, not exhaustive) — cross-reference every rule against a specific line in `coworksession40.html` so the tool's language never drifts from the session guide's talk tracks. |
| **4 — UI build** | The four-step flow from §5, styled per `DESIGN.md` and the `coworksession40.html` component extensions. Mobile-responsive (partners will use this on a laptop in front of a customer, but should not be broken on a tablet). |
| **5 — Print/export** | Print stylesheet, copy-to-clipboard for the talk track, `localStorage` persistence keyed by account nickname. |
| **6 — Review & ship** | Design-lint pass per `DESIGN.md` §9 (no off-palette colors/sizes). Cross-link from `index.html` (new resource card) and from `coworksession40.html`'s tool card (§2), which currently carries a "not yet published" note for exactly this tool — that note gets replaced with a real link the moment this ships. |

---

## 10. Open questions for the build chat to resolve early

1. **Where does the persona task-mix default table actually come from?** If no primary Microsoft source exists, is it acceptable to ship it labeled as "TD SYNNEX-modeled," or does it need to be rebuilt from a different, citable source?
2. **Who owns the P3 pre-purchase discount rate?** Needed before the PayGo-vs-P3 toggle can ship with real numbers (§3.2, §6).
3. **Should the partner's own service pricing (retainer $/seat, assessment fee) be a one-time setup step** (set once, reused across every future session via `localStorage`) **or re-entered per session?** Recommendation: one-time setup with an "edit my pricing" link always visible — reduces friction on the 90-second fast path.
4. **Does this need a distinct URL/brand from `coworksession40.html`**, or should it be presented as embedded inside that page (e.g., an expandable section at Stop 5) rather than a standalone file? Recommendation in this spec: standalone file, linked from both `coworksession40.html` and `index.html`, because the re-forecast use case (Section 11, monthly) and the pre-call prep use case (Section 9) both happen outside the context of re-reading the whole session guide.
5. **What happens when the computed ratio is wildly off the 2.6× benchmark** — is that itself flagged as a possible input error (partner mis-entered a persona mix) or always treated as a real finding? Needs a sanity-bound (e.g., flag but don't hard-block if ratio > 6× or < 0.5×, since that's more likely a typo than a real tenant).

---

## 11. Definition of done

- Every number in §6 is either verified-and-cited or explicitly labeled in-app as an editable estimate, per this repo's own fact-governance standard — no unsourced hard number ships.
- The tool produces, from a cold start, a usable talk track in under two minutes for a partner who has never opened it before.
- The output artifact prints cleanly to PDF with no layout breakage, using only the browser's native print function.
- Design-lint (`DESIGN.md` §9) passes with zero findings against the new file.
- `coworksession40.html`'s tool card for the Cost Simulator is updated to link here instead of carrying the "not yet published" note.
- `index.html` carries a new resource card for this tool, dated the day it ships, in the "Use With Customers — Workshops And Demos" section alongside the session guide.
