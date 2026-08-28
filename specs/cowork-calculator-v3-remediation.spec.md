# specs/cowork-calculator-v3-remediation.spec.md — Pressure-test remediation, plus five product calls

**Status:** Build spec. Authored 2026-08-28, same day as the pressure test it answers.
**Target file:** [`cowork-calculator.html`](../cowork-calculator.html) — edit in place, single self-contained file.
**Source of findings:** [`research/cowork-calculator-pressure-test-findings-2026-08-28.md`](../research/cowork-calculator-pressure-test-findings-2026-08-28.md) — finding numbers (#1–#35) below refer to that document. Six-agent adversarial run; every finding cited here was reproduced under node or verified live in the page, not reasoned about.
**Depends on:** [`specs/cowork-calculator-v2-time-and-value.spec.md`](./cowork-calculator-v2-time-and-value.spec.md) (still the authority on F1 and F6 mechanics — this spec schedules them, v2 defines them), [`specs/cowork-calculator.spec.md`](./cowork-calculator.spec.md), [`DESIGN.md`](../DESIGN.md).
**Supersedes:** nothing. v2's F2 (break-even), F3 (controls block), F4 (shadow AI) and F6.2 (capture sheet) remain open v2 backlog — this spec neither builds nor cancels them.

---

## 0. Ground rules

Everything in v2 §0 still governs: provenance or silence; withhold rather than guess; never put words in the customer's mouth; `compute()` pure and total; the customer print is a different document; no benefit claims ever.

Additions for this pass:

- **0.1 — The anchor stays.** Stock defaults produce **755,000 credits / $7,550/month**. R3 fixes the false "even split" label by changing the *label*, not the seats (see R3c) — the anchor does not move. `tools/test-cowork-motion.js` must pass unchanged after every slice.
- **0.2 — One slice, one commit, verified before the next.** Same discipline as v2 §7. Each slice ends with the node checks for its invariants passing.
- **0.3 — Totality now includes the loaders.** The pressure test proved a pure `compute()` fed by an unvalidated loader still bricks the page (#3) and still prints `$∞` (#4). "Total" is a property of the whole pipeline: file → normalize → state → compute → render.
- **0.4 — Audience is a first-class property.** Every rendered string now has an audience: customer-safe or partner-internal. Anything without an explicit decision defaults to partner-internal (hidden from the customer surfaces). #1 happened because warnings had no audience.

---

## 1. Fix slices

### R1 — Engine totality and loader hardening
*Fixes #3, #4, #12, #13, #14, #19, plus minors #27–#29 where touched. All engine-block plus the two file loaders.*

1. **SKU map prototype hole (#3).** Build `SKU_BY_ID` on `Object.create(null)` (or guard every lookup with `Object.prototype.hasOwnProperty.call`). Inventory lines with unknown `skuId` are dropped with a new warning naming the id — never priced off `Object.prototype`.
2. **Crash-proof the pipeline (#3).** The session loader must *test-compute the candidate state before assigning it*: `compute()` is pure, so run it in a try/catch on the parsed object; only on success does `state` change. `refresh()` additionally gets a try/catch that renders a plain error strip instead of dying — belt and braces, not either/or.
3. **Magnitude caps (#4).** Add `CONST.MAX = { employees: 1e6, seats: 1e6, tasksPerMonth: 1e4, tierCredits: 1e7 }` and clamp at every numeric sanitizer (UI handlers and `hydrate()` both). `1e308` in any field must land on the cap, not overflow to `$∞`. Keep the existing lower bounds.
4. **Rate-card validation (#4, #12).** `effortStep` clamps to the slider's own `[1, 3]`. `creditSellUsd`/`creditUsd` must be finite and `> 0` (reject negatives with the existing alert pattern). `capacityPacksCccu` clamps `≥ 0` (#13). Hold every rate-card branch to the standard the `channel` branch already meets (2994–97).
5. **Deep-normalize on load (#19).** Expose the engine's repair step as `E.normalize(loaded)` (deep copy + per-branch defaults, the same repairs `hydrate()` does internally) and assign *its result* to `state` — no more shallow `Object.assign` dropping sibling keys, no more screen/engine disagreement. Retired effort levels (`xhigh`/`max`) must reach `compute()` so V-19 actually fires; the loader stops pre-rewriting them.
6. **P3 manual discount (#13).** UI clamps to the input's own `max` (30). Above the top published anchor (20%), a new warning: manual discount exceeds Microsoft's published ceiling — confirm with your distributor before quoting. Follow the V-02 announce-the-clamp pattern.
7. **Reseller margin honesty (#12).** (a) Warn whenever `meterMarginAnnual < 0` on the provider-rate branch — the V-21 inversion warning exists only on the PEC branch today, and the reseller path is the one where under-retail buying is routine. (b) `providerCreditUsd === 0` is *unanswered*, not a zero cost basis: require `> 0`, else withhold (`null`), matching the file's own posture.
8. **300-seat cap by SKU, not by line (#14).** Sum seats per `skuId` before the cap check; two 200-seat lines of a capped SKU must fire V-05.
9. **Small correctness (from minors).** PEC `status:'yes'` with missing/garbage pct: withhold (treat the rate as unanswered) instead of silently assuming the 15% maximum. Add `indirectProvider` to `MOTION_ORDER` so a provider stops misfiling as direct-bill. `EFFORT_LABELS` gets an unknown-level fallback.

**Invariants (R1):** all eight prototype keys as `skuId` compute clean with the unknown-SKU warning; `1e308` in seats/tiers/effortStep/rate fields yields finite, non-negative output everywhere; a hostile session file can never leave `state` poisoned (post-load `compute()` never throws); negative provider margin always warns; `providerCreditUsd: 0` withholds; double-line cap bypass fires V-05; `{"effort":{"level":"max"}}` loaded → V-19 present.

### R2 — Calibration integrity (v2 F6.1, in full)
*Fixes #2. v2 §6.1 is the authority; this schedules it.*

`CONST.TIER_DEFAULT = { light:125, medium:500, heavy:1200 }`, referenced from `defaults()` and `calReset`. `calApply` sets `calibrated = true` only when at least one tier differs from the constant; otherwise it refuses with the specced sentence ("nothing here has changed from the modelled defaults, so there is nothing to calibrate yet"). The engine does not trust the flag: `calibrated === true` (strict boolean) *and* tiers differ, else treated as uncalibrated with a warning naming the disagreement. And per finding #2's C3: genuine calibration **swaps** the F10 assumption note ("tier weights are this partner's measured /cost samples, not Microsoft's model") — it never deletes the disclosure.

**Invariants (R2):** v2 §6.4 items 1–3, plus: `{"calibrated":true}` session → uncalibrated + warning; `{"calibrated":"no"}` → uncalibrated (strict boolean); band and F10/F11/B1/B2 provenance flip if and only if calibration is genuine.

### R3 — Provenance honesty
*Fixes #9, #10, #11, and the computed-literal half of #24.*

a. **The 2.6× stops laundering (#9).** In benchmark-activation mode, F6's provenance is `editorial` (via `weakest()` — which finally gets called), and a `T()` note pushes an assumption naming the source: the 2.6× ratio is TD SYNNEX editorial, not Microsoft data. `provPill('editorial')` on the ratio whybox header and a `srcline` on step 3's benchmark chip group.
b. **`weakest()` goes live (#9).** Derived trace rows compute their tag from their inputs instead of hardcoding. Minimum scope: F6/R1/R2 and the calibration-affected rows; do not rewrite every row in this pass.
c. **The "even split" lie (#10).** `defaults()` ships `personaPreset: ''` so no chip claims a shape it didn't produce — seats stay 26/13/6/7 and **the 755,000 anchor does not move**. Any copy that calls the default an even split is corrected.
d. **Partner edits stop wearing Microsoft's name (#11).** A `personaTasksTouched` flag set on any task-cell edit: downgrades the persona task rows to `partner`, swaps the three attribution strings (assumption note, step-4 static copy, step-4 srcline) to say the counts are the partner's edits, and pushes an assumption naming the edit. Clicking a preset chip restores Microsoft's task counts *and* says so — predictable state, no silent survival of edits under a restored attribution.
e. **Computed literals (#24).** `(c.perActiveMs / 18)` and `(/ 30)` read `SKU_BY_ID['cop_biz'].usd` / `SKU_BY_ID['cop_ent'].usd`. The E5 srcline says "implied by E7 a-la-carte arithmetic," matching its `ms-modeled` tag, until the fact pass verifies $60 (#35).

**Invariants (R3):** anchor unchanged; benchmark mode → F6 `editorial` + an assumptions entry containing "TD SYNNEX"; edited task cell → `partner` provenance and no rendered string attributing the counts to Microsoft; preset click restores `PERSONA_DEFAULTS` counts.

### R4 — Licensing correctness
*Fixes #8 (both halves).*

a. **Base qualification.** `basesOwned` counts only owned seats whose SKU is a *valid base for the add-on being priced* (`BASE_FOR` families: `cop_biz` ← SMB bases, `cop_ent` ← enterprise bases). A 250-seat E3 estate must resolve to the enterprise add-on path, never `cop_biz`.
b. **Headcount reconciliation.** `addOn:true` Copilot SKUs stack on a base seat and are excluded from the employees-vs-seats check, exactly as 1285 already excludes non-Copilot add-ons. 250×E3 + 120×`cop_ent` at 250 employees fires nothing.

**Invariants (R4):** the two repro cases from finding #8 produce (a) an enterprise-add-on winner and (b) no V-01; SMB shapes are unchanged (regression: stock defaults' licensing output identical).

### R5 — F1, the adoption ramp
*Fixes #5. v2 §1 is the authority — implement §1.2 (state), §1.3 (engine contract), §1.4 (licenses do not ramp), §1.5 (a–f: the "certainty" line dies, `cardNumber` year-one, `p3Exposure`/risk block including the inline `×12` at 3256, step-6 controls with `patchBill()`, `ECHO.step6`, assumptions entry) and §1.6 (all nine invariants) in full.*

One deviation note is pre-authorized: the 12-cell seat strip may be a plain inline strip rather than a sparkline — visual form is the build's call, the numbers are not.

**Invariants (R5):** v2 §1.6, items 1–9, in the test file. Plus: the string "with certainty" no longer occurs in the file.

### R6 — Print and audience integrity, and the customer-view toggle
*Fixes #1, #7, #15, #16, #21 (conservatively), #25, #26. Builds idea 5.*

a. **The flags leak (#1).** `#cardFlags` (and the govLead block if it renders outside it) joins the `print-customer` strip list. That is the safe default: every warning today is partner coaching. If a future warning is genuinely customer-safe it opts in explicitly — audience is first-class (§0.4), and the partition can be revisited then.
b. **Basis-aware disclaimer (#7).** The print disclaimer is rendered, not static: sell mode → "figures are priced at your partner's rates; Microsoft list prices where noted." List mode keeps today's sentence.
c. **Whybox split (#21) — conservative.** Default stays: `.whybox` hidden on customer surfaces. Introduce `.whybox.cust-ok` as an explicit opt-in, and apply it in this pass to at most two blocks *after a string audit of their full rendered content*: the licensing "Why this one" block (with any margin/partner sentence moved into a `.partner-only` span first) and the scenarios cost-controls list. The ratio whybox stays internal — whether to voice the benchmark is the partner's call, not the print's.
d. **Promo cliff on the cells (#15).** When any priced inventory line's `promoEnds` falls inside the ×12/×36 window, `numAnnual`/`numThree` carry a one-line, customer-visible caveat naming the date. The assumptions entry stays; it is no longer the only place the truth lives.
e. **NCE term line (#16).** One customer-visible sentence on the licensing card: these are annual-term subscriptions; cancellation is limited to the first days of term and seats cannot be reduced mid-term; link to the setup guide. Verify the current cancellation window against Partner Center at build time — do not hardcode "7 days" without checking.
f. **MACC line (#26).** v2 §5.6 verbatim: at `copilotLicensed ≥ 300`, one line + link. Below, absent.
g. **Contrast and wizard semantics (#25).** `#b6bcc5` and `#9ca3af` text tiers darken to ≥ 4.5:1 on white (pick within the existing gray ramp); `aria-current="step"` on the active stepper button; `fieldset`/`legend` (or `role="group"` + label) on the yes/no/unsure toggle rows.
h. **Customer-view toggle (idea 5 — build).** A `body.customer-view` class that applies, on screen, exactly the `print-customer` strip set — same selectors, duplicated outside `@media print` (structure the CSS so both share one selector list; a maintenance fork here recreates #1). A visible state pill while active ("Customer view — partner detail hidden") and an obvious exit; the state is never persisted. This is the pre-emptive fix for the projected-screen accident the print fix alone cannot cover.

**Invariants (R6):** the stylesheet's customer-print and customer-view rule sets are provably identical (test asserts the shared selector list); no `$` figure sourced from PEC, margin, cost basis, or sell-vs-list delta renders under either; sell-mode print never contains the phrase "Microsoft list prices" unqualified; promo caveat present exactly when a promo line is in the projection window.

### R7 — Conversation-engine truthfulness
*Fixes #6, #17, #18, #20, and the two copy items from #23.*

a. **Governance honesty (#6).** The talk-track clause branches: `governanceAsked` true → today's sentence; false → "…closes the gaps we have not yet confirmed are closed." Only the five governance toggles set `governanceAsked`; the two prerequisite questions (Azure/CSP, usage billing) never do. `govNo` counts only explicit `'no'`; `unsure` gets its own copy branch, consistent with the engine's three-way `why()`.
b. **The displacement question (#17).** `competingAi` becomes a real toggle on step 7 ("Are they already paying for Claude, ChatGPT or another AI tool?"), wiring the existing `competing-ai` rule and talk-track line. No new engine logic — the dead code goes live.
c. **Motion-aware gate copy (#18).** `prereq-no`/`prereq-unsure` and the talk-track Azure line get `notCsp` variants (the customer's own Azure plan/MCA is the prerequisite, not "our CSP channel"). The "does this tenant have an Azure plan under our CSP relationship" line leaves the talk track — it becomes a partner-only pre-call note; a customer cannot answer it. The closing "let's name what we're selling" line moves from `talkBody` to `#cardNext` — it is addressed to the partner.
d. **Ratio-block sanity (#20).** The implied-activation sentence is suppressed above 100%. When V-10 fires, the "benchmark isn't wrong and neither are you" reassurance is replaced by input-check framing — two blocks on one screen must not point opposite ways. V-10's heavy-task figure counts only personas with seats.
e. **The value wobble (#23).** Both "where the real value is concentrating" sites reword to consumption framing ("the group whose usage is driving the number"). A one-line regulated-vertical talk-track sentence renders when the vertical is regulated, regardless of headcount — the 50-seat rung floor stays but stops being a silence.

**Invariants (R7):** governance-unasked session → no "told us" phrasing anywhere in the talk track; tapping the Azure toggle alone leaves `governanceAsked === false`; `notCsp` walkthrough contains no "our CSP" phrasing; no rendered string contains an activation percentage above 100%; grep for "real value" returns nothing.

### R8 — Two new features that pass the worth-it test
*Builds ideas 2 and 4. Requires R5 (the export must carry the year-one figure, not the over-commit).*

a. **Distributor handoff export (idea 2).** A copy button on the billing card producing a plain-text quote request: account label, date, CSP motion (so it addresses the provider when the partner is a reseller), **year-one CCCU** with the steady-state figure as reference, PayGo annual fallback, the ±band, and the one-sentence instrument reality (non-cancellable, auto-renews — sized to year one, re-size at renewal). Follows the `btnCopyTalk` pattern. The export inherits the page's honesty; it must never strip the band or the finality note.
b. **Benchmark flywheel (idea 4).** In the ratio whybox (internal view only): a "contribute your anonymized ratio" `mailto:` link prefilled with computed ratio (2 dp), seat bucket (<25 / 25–100 / 100–300 / 300+), vertical, and activation mode. **No account name, no dollar figures.** A `mailto:` is user-initiated — the page still transmits nothing, and the privacy footer stays true; say so next to the link. Contributions are self-selected and unverified: they can move the 2.6× from "editorial, sample unknown" toward "partner-sourced, n = X" in `FACTS.md`, never to `ms-verified`. Register the collection address and methodology note in `FACTS.md` at build time.

**Invariants (R8):** the exported text contains `cccuYear1`, the band, and the finality sentence; the mailto body contains no account name and no `$` figure; neither feature renders in customer view or customer print.

### R9 — Diff mode: the file-based re-forecast compare
*Builds idea 1, in the storage-honest design (§2). Requires R1 — the compare path rides the hardened loader pipeline. Ships in this pass by Ken's call, 2026-08-28.*

The monthly-retainer loop (v1 spec §2) currently opens with "re-run monthly" and gives the tool no memory. The compare gives it memory without breaking the tool's no-storage promise: the memory is the session file the partner already downloads.

a. **Export gains a timestamp.** The session export handler (UI layer, not `compute()` — purity holds) stamps `savedAt` (ISO date) and keeps `__type` discipline. Old files without `savedAt` stay loadable and render as "an earlier session," never a NaN date.
b. **Compare loader.** A "Compare with a previous session" control on the results screen loads a prior session `.json` into a separate `compareState` — validated by exactly the R1 pipeline (`E.normalize` + test-compute in try/catch; on failure, the existing alert pattern and no change). **Compare never mutates `state`** — it is display-only, cleared by a visible control, never persisted.
c. **The delta card.** `#cardDelta`, customer-visible, rendered only while a compare is loaded: prior / current / Δ (absolute and %) for the customer-safe figures only — monthly credits, meter, license line, all-in, active users, activation, computed ratio — plus a short "what changed in the inputs" list (seats, tiers, effort, activation mode). **No partner economics ever appears in the delta**, whatever the two sessions contain; margins and PEC deltas are not computed at all in this pass. A provenance line names the compared file's `savedAt` and carries the band of both runs — a delta between two ±30% models is itself modeled, and the card says so.
d. **The retainer hook.** One partner-only line under the card ties it to the ladder: this monthly delta review is rung 3's deliverable. (Copy, not logic — the `nextStep()` engine is untouched in this pass.)

**Invariants (R9):** loading a compare file leaves `state` deep-equal to before; a hostile compare file (prototype keys, `1e308`, garbage types) can neither crash nor poison either state; the delta card's rendered text contains no PEC/margin/cost-basis figure for any pair of sessions; missing `savedAt` renders without `NaN`/`Invalid Date`; clearing the compare removes the card entirely; customer print and customer view both show the delta card (it is the re-forecast leave-behind) with the same customer-safe content.

---

## 2. The five product ideas — investigation and verdicts

| Idea | Verdict | Why |
|---|---|---|
| Customer-is-watching toggle | **Build now** (R6h) | Cheapest insurance in the whole list, and it shares its implementation with the #1 leak fix — the audience partition has to be built anyway. The projected screen is the one surface the print fix can't reach. |
| Distributor handoff export | **Build now** (R8a) | ~Ten-minute build once R5 exists, removes the last manual step before a PO. The dependency is real: shipped *before* the ramp, it would export the 13–26% over-commit with the tool's name on it. |
| Benchmark flywheel | **Build now, small** (R8b) | The 2.6× is the site's most-quoted, weakest-sourced number and the pressure test showed it laundering upward (#9). A mailto costs half an hour, violates nothing in the privacy stance, and is the only item on this list a competitor cannot copy — the data accrues to whoever asks first. Honesty requirement: contributed ratios are biased (self-selected, unverified) and the FACTS.md entry must say so; the payoff is "editorial, n=40" beating "editorial, n unknown," not a Microsoft-grade fact. |
| Diff mode / re-forecast | **Build in this pass (R9), redesigned** — file-based, not stored. *(Verdict upgraded from "build next" on Ken's call, 2026-08-28.)* | The value case is right: the delta view *is* the retainer-rung deliverable, and the tool currently opens the monthly loop and gives it no memory. But the premise "store the prior run per account nickname" collides with a load-bearing shipped decision: the tool's trust copy says, five times, that nothing is stored — not even browser storage — and the pressure test's gut-check found that stance is part of why a burned partner would trust it. Two honest designs: **(a) file-based compare** — "load last month's session file alongside this one," render changed inputs → changed outputs with provenance intact; no stance change, works with the artifact partners already download, ~1 day. **(b) opt-in per-account localStorage** with the trust copy rewritten. (a) first; (b) is a product-stance decision for Ken, not a build chat. Sequencing: after R1 (the loader it leans on is currently the most dangerous code in the file — #3, #19). |
| Portfolio roll-up for MSPs | **Defer — separate asset** | v2 §9 already ruled it out of this file ("different tool"), and the premise ("over existing localStorage sessions") describes storage that doesn't exist. The real shape: a standalone page reusing the same self-extracting engine over a multi-select of session files — total meter exposure, ratio outliers, missing cost owners. Genuinely differentiating for the MSP audience and ~2–3 days as its own flat file (`cowork-portfolio.html`), pointless as a bolt-on step 8. Needs its own spec; it also gets dramatically better if diff mode (a) lands first, since the same session files feed both. |

---

## 3. Explicitly deferred (with reasons)

- **Preset re-weighting (#22).** The trades/retail/clinic weight arguments are persuasive but they change numbers partners quote — editorial content changes need Ken's sign-off, not a remediation pass. The *mechanical* halves (frontline-preset headcount reconciliation warning, preset → `org.vertical` linkage) can ride along with a future preset pass. The wrong retail rationale *sentence* may be fixed in R3 if trivial, since it misstates the tool's own data.
- **v2 F2 (break-even), F3 (controls), F4 (shadow AI), F6.2 (capture sheet).** Unchanged backlog; v2 remains their spec. The capture sheet rises in priority once R2 lands — the guard makes "go measure" the only path to ±15%, and the sheet is how they measure.
- **MSP self-tenant mode, low-ratio rule (#23 remainder).** Real, small, not defect-class; next conversation-engine pass.
- **Fact re-verification (#30/#35).** E5 $60, the PoR "cancel and re-buy" phrasing, the NCE window — a fact pass against Partner Center, per `FACTS.md` discipline, before the next price-dated release.

---

## 4. Verification

New self-extracting suite `tools/test-cowork-v3.js`, same pattern as [`tools/test-cowork-motion.js`](../tools/test-cowork-motion.js) (reads the engine out of the page; nothing to keep in sync), covering every invariant block above (R1–R8). CSS-level assertions (print strip lists, customer-view parity) run as regex checks against the raw HTML in the same file. `tools/test-cowork-motion.js` must pass unchanged.

Then the browser pass: hostile session/rate-card loads through the real UI, all three print modes, customer view toggled while sell-mode partner data is on screen, and a full-page `innerText` sweep for `NaN`, `undefined`, `Infinity`, `$∞`, "with certainty", and "real value".

## 5. Definition of done

- All R-slice invariants (R1–R9) green in `tools/test-cowork-v3.js`; motion suite green unchanged; anchor at 755,000 / $7,550.
- A hostile file cannot crash, brick, or poison the page; no non-finite or negative dollar renders anywhere.
- `measured` unreachable without a real tier edit, by any path.
- Customer print **and** customer view: zero partner economics, zero internal coaching, honest pricing-basis line.
- The P3 recommendation, risk block, ECHO and the new export all agree on the year-one figure; "with certainty" is gone from the file.
- The talk track contains nothing the customer didn't say, no benefit claim, and nothing addressed to the partner.
- One commit per slice, each naming its findings.
