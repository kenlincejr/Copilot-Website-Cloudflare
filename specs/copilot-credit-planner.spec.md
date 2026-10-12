# specs/copilot-credit-planner.spec.md: Build spec for the Copilot Credit Planner (Cowork + Copilot Studio)

**Status:** Approved 2026-10-11. This is the build contract for Release 1.

**Target:**
- [`copilot-credit-planner.html`](../copilot-credit-planner.html): new; the hub.
- Two additive hooks in [`cowork-calculator.html`](../cowork-calculator.html): embed mode and the result emitter.
- [`tools/test-credit-planner.js`](../tools/test-credit-planner.js): new.

**Depends on:**
- `fix/cowork-track-a`: P3 nine tiers, packs at $0.008, V-31, and facts F-155 to F-184. Hub work happens on `feature/credit-planner`, rebased onto it.
- [`DESIGN.md`](../DESIGN.md): visual system, prohibitions §8, the four §8b rules, and the §9 lint.
- [`FACTS.md`](../FACTS.md) and [`data/facts.json`](../data/facts.json): fact governance.
- [`specs/cowork-calculator.spec.md`](./cowork-calculator.spec.md): the authority on tone and the conversation-engine pattern.

**Research:**
- [`research/copilot-studio-smb-partner-2026-10-11.md`](../research/copilot-studio-smb-partner-2026-10-11.md): SMB nuances and the nine-tool teardown.
- [`research/cowork-calculator-studio-autopilot-2026-10-11.md`](../research/cowork-calculator-studio-autopilot-2026-10-11.md): rate card, P3 tiers and Microsoft worked examples.

**Supersedes nothing.** This spec is additive. The Cowork calculator keeps working standalone exactly as today.

This is a product spec and a build contract in one. Section numbers in *§S1–§S7* refer to the Studio tab sections below. Every rate carries a fact ID. Every Microsoft number links to a dated source. A Likely or unverified item is labeled as one, never smoothed into a fact.

---

## 1. Pitch

Partners who serve SMB customers size Cowork and Copilot Studio agents in the same meeting, and Microsoft bills both from one tenant pool of Copilot Credits. Every calculator on the market prices one or the other, and none of the nine we tested prices the customer's Copilot Business seats, the 300-seat cap, the default environment or the partner's margin. Microsoft's own Studio estimator also under-states a standard helpdesk by half.

**The Copilot Credit Planner is one page with three tabs:**
- the existing Cowork calculator, embedded unchanged;
- a Copilot Studio agents tab that gets the zero-rating rule exactly right;
- a Combined plan that sizes one purchase across both, simulates where the money runs out, and writes the governance settings.

**Around the numbers it gives the partner:**
- the next best action;
- a talk track;
- objection cards filled with the scenario's own figures;
- a customer report with the partner's name on it.

Like the Cowork page, its job is to hand the partner the next five minutes of the meeting, not just a number.

---

## 2. Who uses it, and when

| User | Moment | What they need |
|---|---|---|
| **SMB CSP partner** (seller, practice lead or vCIO) | A partner workshop, or a joint customer meeting with the customer in the room | Archetype cards that load in one click; numbers that hold up against Microsoft's examples; a customer view that is safe to project; an answer to "what do we buy?" |
| **SMB CSP partner**, before the call | Pre-call prep | The partner-only layer: margin, services, next best action, objections |
| **The customer** | Reading the leave-behind after the meeting | One printed page: per-tool numbers, how to buy in plain words, guardrails, what their licenses already cover, dated sources, and who prepared it |

**Fast path:** pick archetypes, read the Combined tab, print. **Every input has a disclosed default.** The fast path never blocks on a field the partner doesn't have in the room.

---

## 3. Ground rules

These are binding on every planner commit. They restate the plan and the house rules.

### 3.1 Branches and gates

- Hub work goes on `feature/credit-planner`, rebased onto `fix/cowork-track-a`. **Nothing reaches `main` until build step 10.**
- **Gates for the Cowork page:**
  - `node tools/test-cowork-v3.js` and `node tools/test-cowork-motion.js` stay green on every commit.
  - The golden snapshot does not move.
  - Hooks sit outside every `uiSource` lift span. The `emitEmbed(r)` call goes inside `refresh()`'s `try`.
- **Gates for planner commits:**
  - `node tools/test-credit-planner.js` exits 0, and both Cowork suites stay green.
  - `python tools/check-facts.py` shows no new MOVED or AMBIGUOUS entries for the facts each commit touches.

### 3.2 Provenance or silence

Every number carries a tag. The engine's internal tags map to the pills shown on the page:

| Engine tag | Pill |
|---|---|
| `ms-verified` | Microsoft |
| `ms-modeled` | Modeled |
| `editorial` | Estimate |
| `partner` | You said |
| `measured` | Measured |
| `ms-inferred` | **Likely** chip |

A derived figure takes its **weakest** input's tag. No editorial number is ever shown as Microsoft's.

### 3.3 Withhold rather than guess

- Margin is `null` until every cost it depends on is known. The page shows what it still needs, as the draft's `asks` list does.
- A Likely rule is applied, but it is chipped "Billed (Likely)".

### 3.4 The engine is pure

`PlannerEngine` must:
- have no DOM, no I/O, no `Date`, no `Math.random`;
- deep-copy its input, never mutate it, never throw;
- always return a trace.

The UI passes "today" in as a month string.

### 3.5 No storage, no analytics, no network

- No `localStorage`, `sessionStorage`, IndexedDB, cookies, `fetch` or XHR, and no beacon wired to field values.
- The only cross-document channels are a **same-tab `postMessage`** from the embedded Cowork page and **same-origin DOM access** to it.
- Both are disclosed in the footer.
- State survives only through session files the partner downloads.

### 3.6 House rules

- **US English** throughout: license, optimize, analyze, modeled, labeled, behavior.
- **No rival distributor is named** in any page, export or comment.
- **Customer Zero data** appears as shapes and percentages only.
- **Every currency value has a fact ID** (DESIGN §8.10). The Playbook's service prices are registered as `type: "our-price"` facts before the page places them.
- **Run the DESIGN §8b and §9 lint greps** on every touched file.
- **Patch scripts** are written with the Write tool, because shell heredocs mangle backslashes.
- **`data/facts.json`** gets surgical inserts only.

---

## 4. Architecture

### 4.1 Files

| File | Role |
|---|---|
| `copilot-credit-planner.html` (new) | The hub. Contains: <ul><li>the C14 masthead with `RATECARD_VERSION` and a "re-check after Ignite (Nov 17–20)" stamp;</li><li>a tab strip below `.masthead`;</li><li>three panels;</li><li>`footer.pagefoot`;</li><li>exactly two inline scripts: `<script id="planner-engine">` (pure, sets `root.PlannerEngine`) and `<script id="planner-ui">`.</li></ul> |
| `cowork-calculator.html` | Two additive hooks (§4.3). Standalone behavior unchanged. |
| `tools/test-credit-planner.js` (new) | Self-extracting engine suite, sections A–H, plus hub integration checks (§12). |
| `specs/copilot-credit-planner.spec.md` | This file. |
| `research/copilot-studio-smb-partner-2026-10-11.md` | Research record. Its rival-distributor citations are already stripped. |

### 4.2 Hub tabs

| # | Tab | Panel content |
|---|---|---|
| 1 | **Cowork** | The embedded Cowork calculator (§4.3) |
| 2 | **Copilot Studio agents** | §S1–§S7 |
| 3 | **Combined plan and report** | §6 |

**Tab mechanics:**
- Tabs show and hide panels. Nothing navigates, so all state lives in one tab's memory.
- Keys `1`–`3` switch tabs, and `C` or `Esc` toggle customer view. All of these are ignored while focus is in an `input`, `select` or `textarea`, or when a modifier key is held.
- The tab strip is a `role="tablist"` with `aria-selected`, and arrow-key movement within it.

**Amendment, 2026-10-11 (UX polish): Start view and plan types.**
- A fourth tab, **Start** (key `0`), comes first and is what the page opens on. It explains the planner in one paragraph and three steps, and offers three plan types as a pinned grid of three cards, each with who it is for, the time it takes, what to bring and what the partner walks out with.
- The choice is `state.meta.mode`: `cowork`, `agents` or `full` (default `full`; normalized; saved in sessions; a session without it loads as `full`).
  - `cowork` shows Start and Cowork. The report is the Cowork page's own print, and the Print menu says so.
  - `agents` shows Start, Copilot Studio agents and the Combined tab renamed **Plan & report**. The engine keeps Cowork out of every total whatever the include switch says, and the switch is hidden. The customer report is titled "Copilot Studio agent plan" and carries no Cowork rows.
  - `full` shows every tab, as before.
- "Change plan type" in the toolbar returns to Start. Switching never deletes anything. Start is partner-only and never prints.

### 4.3 The Cowork embed

**The iframe:**
- `<iframe id="coworkFrame" src="cowork-calculator.html?embed=1" title="Cowork calculator">`, same origin, with no `sandbox` attribute.
- **Auto-height:** a `ResizeObserver` on `coworkFrame.contentDocument.body` sets the iframe height to its `scrollHeight`. There is no inner scrollbar.
- **Step changes:** a `MutationObserver` on the Cowork page's `.screen.on` scrolls the hub so the iframe top sits under the tab strip.
- **If same-origin access fails** (for example, opened from `file://` in a browser that blocks it), the tab still works as a plain iframe. The hub shows one line: "Customer view and auto-height need the page served over http(s)."

**Hook 1, embed mode** (one test-locked commit on the Cowork page):
- `EMBEDDED` is true only when **both** `window.parent !== window` and `location.search` matches `embed=1`. Then `body.embedded` is added.
- CSS hides `.mh-bar`, `.masthead`, `footer.pagefoot` and `#custViewPill` under `body.embedded`, and adjusts body padding.
- A stray `?embed=1` on a standalone tab changes nothing.

**Hook 2, result emitter:**
- `emitEmbed(r)` is defined after `renderCapNote` and called inside `refresh()`'s `try`, after `flash(r)`.
- It returns at once unless `EMBEDDED`.
- It calls `window.parent.postMessage(payload, location.origin)`, inside its own `try`. The calculator never fails on the hub's account.

### 4.4 The `cowork-lane` payload (version 1)

This is the exact key set. Tests assert it is exact, and that none of the partner keys appear.

| Key | Type | Meaning |
|---|---|---|
| `__type` | `'cowork-lane'` | Discriminator |
| `version` | `1` | Schema version |
| `screen` | string | Current Cowork screen id. Results is `'results'`. |
| `accountName` | string | As typed on the Cowork page |
| `monthlyCredits` | number | Steady-state monthly Cowork credits |
| `band` | number | ± share: 0.30 modeled, 0.15 calibrated |
| `calibrated` | boolean | Calibrated from `/cost` samples |
| `annualCredits` | number | Steady state × 12 |
| `year1Credits` | number | Ramp-aware year one |
| `rampSeats` | number[12] | Active seats by month |
| `rampCredits` | number[12] | `rampSeats[m] × monthlyCredits / basisSeats` |
| `basisSeats` | number | Seats behind `monthlyCredits` |
| `copilotLicensed` | number | Copilot-licensed seats |
| `licenses` | object | Seats by Cowork SKU id. Plain object, own keys only. |
| `cspMotion` | string | `direct`, `indirectReseller`, `notCsp` or `unsure` |
| `sellMode` | boolean | Cowork page is pricing at the partner's sell prices |
| `creditUsd` | number | Customer price per credit used by the Cowork page |

**Never in the payload:** margin, PEC, provider rate, cost basis, or any partner service price.

**Hub receive rules:**
- Accept only when `event.origin === location.origin`, `event.source === coworkFrame.contentWindow`, `__type === 'cowork-lane'` and `version === 1`.
- Coerce every field through the engine's coercers. The payload is data.
- Keep only the last payload, in memory.

**SKU mapping into the Studio tab's account context** (§S1):

| Cowork SKU id | Studio seat group | Implied tenant base |
|---|---|---|
| `cop_biz` | Copilot Business | (from the base SKU line) |
| `bbasic_cop` | Copilot Business | Basic |
| `bstd_cop` | Copilot Business | Standard |
| `bprem_cop` | Copilot Business | Premium |
| `cop_ent` | Enterprise | (from the base SKU line) |
| `e7` | E7 | E5/E7 |
| `bbasic` / `bstd` / `bprem` / `e3` / `e5` | — | Basic / Standard / Premium / E3 / E5/E7 |

Unknown keys are ignored. The **highest** base present wins.

### 4.5 Customer view: the hub owns it

- **One toggle and one pill, on the hub.** `C` or `Esc` applies `customer-view` to the hub `body` *and* to `coworkFrame.contentDocument.body`, using the class the Cowork page already uses.
- The Cowork page's own pill is hidden in embed mode.
- **Partner-only content** is marked `.partner-only` in the hub:
  - §S6 partner economics;
  - §S7 conversation layer;
  - the optimizer's provider-cost columns;
  - specialization;
  - incentives.
- The engine's `customerView(result)` whitelist (§10) is what the customer report renders from. CSS hiding is the second line of defense, not the first.

### 4.6 Print

| Print | Built by | Mechanism |
|---|---|---|
| **Combined customer report** | Hub | `body.print-customer`. Renders only from `customerView()`. Cowork figures come from the last `cowork-lane` payload. |
| **Combined partner working copy** | Hub | `body.print-internal`. Everything. |
| **Governance settings sheet** | Hub | `body.print-governance`. Customer-safe. |
| **Cowork-only, customer or internal** | Cowork page | `coworkFrame.contentWindow.print()`, using the Cowork page's own print classes, toggled through same-origin access |

Every print carries `RATECARD_VERSION`, the print date (supplied by the UI) and the provenance legend.

### 4.7 Sessions

**The hub session file** is a download made with a Blob and an `<a download>` link. Nothing is stored in the browser.

```
{ "__type": "credit-planner-session", "schemaVersion": 1, "rateCardVersion": "2026-10-11",
  "savedAt": "<ISO from the UI>", "studio": {...}, "combined": {...}, "partner": {...},
  "coworkSession": { "payload": <last cowork-lane payload or null>,
                     "note": "Cowork inputs live in the Cowork tab's own session file." } }
```

- **On load:**
  - `parseSession` validates and normalizes the file.
  - If it carries a `coworkSession.payload`, that payload stands in for the Cowork lane until the iframe emits a fresh one.
  - The hub offers: "Reload the Cowork session file into the Cowork tab", which clicks the iframe's existing Load control through same-origin access.
- **Partner card file:**
  - Type `credit-planner-partner-card`.
  - Holds motion, provider rates, PEC, sell prices and the services table, so a partner reuses their pricing across customers without storage.
- **Compare:**
  - Load a second session file read-only.
  - Show the two side by side: per-agent credits, pool, best option and adjacent costs.
- **Rate-card freeze:**
  - A file saved under an older `rateCardVersion` loads.
  - The page shows "Priced on rate card {old}; now {new}", with a per-row diff of any changed rate.

### 4.8 Footer disclosure (exact copy, editable for tone)

> This page runs entirely in your browser. It stores nothing, sends nothing and loads no analytics. The Cowork tab is the Cowork calculator running inside this page; the two talk only through a same-tab browser message and same-origin page access, and only the customer-safe Cowork figures listed in the spec pass between them. Save your work with Download session.

---

## 5. Copilot Studio tab: product spec (Release 1)

### §S1. Account context

| Field | Key | Type | Default | Limits | Rule or source |
|---|---|---|---|---|---|
| Account name | `meta.accountName` | text | Cowork payload `accountName`, else empty | 80 characters | Session only, never in a URL |
| Prepared by (partner name) | `meta.preparedBy` | text | empty | 80 characters | Customer report "Prepared by" |
| Plan start month | `horizon.startMonth` | `YYYY-MM` | the month after "today" (supplied by the UI) | 2026-01 to 2030-12 | 12-month horizon |
| Total users | `tenant.totalUsers` | integer | Cowork `basisSeats`, else 0 | 0–1,000,000 | Over 300 shows the SMB-SKU cap note |
| Copilot Business seats | `tenant.seats.business` | integer | sum of Copilot Business SKUs from the payload, else 0 | 0–1,000,000; warns above 300 | F-147 (300 cap) |
| Copilot Business price basis | `tenant.businessBilling` | enum `promo`, `annual`, `monthly` | `promo` while the start month ≤ 2026-12, else `annual` | — | $18 promo (F-147, ends 2026-12-31); $21 annual (F-176); $25.20 monthly (F-176) |
| Microsoft 365 Copilot (enterprise) seats | `tenant.seats.enterprise` | integer | from payload `cop_ent`, else 0 | 0–1,000,000 | $30 (F-090) |
| E7 seats | `tenant.seats.e7` | integer | from payload `e7`, else 0 | 0–1,000,000 | $99 (F-049) |
| Tenant base | `tenant.base` | enum `basic`, `standard`, `premium`, `e3`, `e5e7`, `unsure` | inferred from the payload (§4.4), else `unsure` | — | Drives Agent 365 eligibility (F-009) and the Dataverse baseline |
| Defender Suite + Purview Suite owned | `tenant.suites` | `yes`, `no`, `unsure` | `unsure` | — | Alternative Agent 365 prerequisite (F-009 notes) |
| Business Central in use | `tenant.bc` | `yes`, `no`, `unsure` | `unsure` | — | Shows BC archetypes first when `yes` |
| Country | `tenant.country` | ISO-3166 alpha-2 | `US` | the country list | December 1 exclusions: AU BE BR FR DE IN IT KR NL PL ES (F-156) |
| New CSP Copilot Business purchase on or after December 1, 2026 | `tenant.cspNewBusiness` | `yes`, `no`, `unsure` | `unsure` | — | F-156, F-157 |
| Billing path in place today | `tenant.billingPath` | enum `none`, `packs`, `payg`, `p3`, `unsure` | `unsure` | — | Drives NBA-01 |
| Working days per month | `tenant.workingDays` | integer | 22 | 1–31 | Microsoft estimator default (F-159) |
| Per-user monthly credit cap | `tenant.perUserCap` | integer or `null` | `null`. Treated as 4,000 when the December 1 default applies. | 0–1,000,000,000 | F-157 |

**Derived ribbon** (customer-safe):
- licensed users;
- unlicensed users;
- whether the December 1 default applies to this account (yes, no or excluded);
- Agent 365 eligibility (eligible, needs Business Premium, or unsure).

### §S2. Agent portfolio (cards)

#### Add from archetypes

Every archetype is a card preset. The button **"Reproduce Microsoft's example"** loads the exact Microsoft inputs and shows the expected result beside the computed one.

| Archetype key | Label | Preset inputs | Expected | Fact or source |
|---|---|---|---|---|
| `smbWebFaq` | Website FAQ / lead capture (**Scenario A**) | external · website · auth none · standard · conversational · 1,500 conversations a month · 30 days · 5 turns · 100% generative · 0% graph · no greeting · 0 actions | 15,000 a month | F-162 |
| `smbHelpdesk` | HR/IT helpdesk (**Scenario B**) | internal · Teams · Microsoft auth · standard · conversational · users = total users (60); licensed = min(Copilot seats, users) (20); unlicensed = the rest (40) · per user 4 conversations a month · 5 turns · 100% generative · 100% graph | 9,600 billed; 4,800 zero-rated | F-162, F-164 |
| `smbInvoice` | Invoice intake (**Scenario C**) | autonomous · maker licensed · 400 runs a month · 6 actions · AI tools premium × 1 per response (1,500 tokens shown) · trigger-as-action off · prompt-as-action off | 16,000 a month | F-163, F-166, F-182 |
| `bcSalesOrder` | BC Sales Order Agent | BC · default environment · 100 emails a month · 1 availability check · 1 quote/order write · reply yes · 50% attachments with sales data · 0% other attachments | 1,650 a month | F-185 |
| `bcPayables` | BC Payables Agent | BC · default environment · 100 invoices a month · 3 lines · 0 emails without a valid PDF | 6,500 a month | F-186 |
| `bcExpense` | BC Expense Agent (preview) | BC · default environment · 50 receipts a month | 2,500 a month | F-187 |
| `msSupport` | Customer support bot (Microsoft) | external · website · 900 a day · 30 days · 4 classic + 2 generative | 7,200 a day | F-161, F-162 |
| `msSales` | Sales research (Microsoft) | internal · Teams · 50 licensed, 100 unlicensed · 1 a day per user · 4 generative + 4 grounded | 4,800 a day | F-184 |
| `msOrder` | Order processing (Microsoft) | autonomous · 4 actions | 20 a run | F-163 |
| `msExpense` | Expense receipt (Microsoft blueprint) | autonomous · blueprint | 15 a run | F-184 |
| `msApproval` | Approval routing (Microsoft blueprint) | autonomous · blueprint | 12 a run | F-184 |
| `msTimesheet` | Timesheet assistant (Microsoft blueprint) | autonomous · blueprint | 77 a run | F-184 |
| `blank` | Blank | template defaults | — | — |

**One-click scenario presets** (they replace the portfolio and keep `meta` and `partner`):

| Preset | Content | Expected |
|---|---|---|
| **SMB portfolio** | A + B + C on a 60-user account with 20 Copilot Business seats | 40,600 a month |
| **A only / B only / C only** | One scenario each | — |
| **Back office** | `msOrder` + `msExpense` + `msApproval` + `msTimesheet` | — |

#### Per-card inputs

| Group | Field | Key | Type | Default | Limits |
|---|---|---|---|---|---|
| Identity | Name | `name` | text | "Agent N" | 80 characters |
| | Paused | `paused` | boolean | false | Excluded from all totals |
| | Archetype | `archetype` | enum (above) | `''` | Quantities from an archetype are tagged Estimate until edited |
| Harness | Harness | `harness` | enum `standard`, `chat` (Copilot Chat / Agent Builder), `github`, `bc` | `standard` | `chat` is internal only and Microsoft channels only |
| | Kind | `kind` | enum `conversational`, `autonomous` | `conversational` | `bc` is always autonomous |
| Audience | Audience | `audience` | enum `internal`, `copilotChat` (unlicensed Copilot Chat users on tenant data), `external` | `internal` | — |
| | Licensed users (headcount) | `users.licensed` | integer | 0 | 0–1,000,000. Subtracted once. |
| | Unlicensed users (headcount) | `users.unlicensed` | integer | 0 | 0–1,000,000 |
| | Maker holds a Copilot license (autonomous only) | `makerLicensed` | boolean | true | Billed either way (Z-AUTO); recorded for the chip text |
| | Runs as | `identity` | enum `user`, `maker` | `user` | `maker` means billed (Z-ID) |
| Channel | Channel | `channel` | enum `teams` (Teams / Microsoft 365 Copilot), `sharepoint`, `website`, `social` (WhatsApp / SMS / Facebook), `customApp` (Direct Line), `voice` | `teams` | — |
| Authentication | Authentication | `auth` | enum `none`, `microsoft`, `manual` | `microsoft` | `teams` and `sharepoint` force `microsoft`; `none` only on `website`, `social`, `customApp` and `voice` |
| Volume | Traffic mode | `traffic.mode` | enum `total`, `perUser` | `total` | `perUser` multiplies by the headcounts |
| | Count | `traffic.count` | number, 2 dp | 0 | 0–1,000,000 |
| | Per | `traffic.per` | enum `day`, `month` | `month` | — |
| | Days active a month | `daysActive` | integer | 22 conversational internal; 30 autonomous, external and BC | 1–31 |
| | Go-live month | `startMonth` | integer | 0 | 0–11 |
| | Follows the adoption ramp | `ramped` | boolean | true internal; false autonomous and BC | — |
| Conversation shape | Turns per conversation | `shape.turns` | number | 5 | 0–100 |
| | Generative share | `shape.generativePct` | percent | 100 | 0–100; the remainder is classic, never dropped |
| | Tenant-graph grounded share of generative answers | `shape.graphPct` | percent | 0 | 0–100 |
| | Agent sends a greeting | `shape.greeting` | boolean | false | 1 classic per conversation (F-161) |
| Actions | Actions per conversation or run | `bundle.actions` | number | 0 | 0–10,000 |
| | Count the trigger as an action | `toggles.triggerAsAction` | boolean | false | Chipped **Likely**; adds 1 action a run |
| | Count each prompt call as an action | `toggles.promptAsAction` | boolean | false | Adds 1 action per AI-tools response |
| | Agent-flow actions per run | `bundle.flowActions` | number | 0 | 13 per 100 (F-165) |
| | Flow trigger | `flowTrigger` | enum `agent` ("When an agent calls the flow"), `other` | `agent` | `other` is always billed (Z-FLOW) |
| AI tools | Tier | `ai.tier` | enum `none`, `basic`, `standard`, `premium` | `none` | 0.1 / 1.5 / 10 (F-166) |
| | Responses per run | `ai.responses` | number | 0 | 0–10,000 |
| | Pricing basis | `ai.basis` | enum `perResponse`, `per1K` | `perResponse` | — |
| | Tokens per response (shown always) | `ai.tokens` | integer | 1,000 | 0–1,000,000. `per1K` bills `ceil(tokens / 1000)` started units per response. |
| Reasoning | Reasoning model | `reasoning.on` | boolean | false | Bills **on top of** the feature rate |
| | Tokens per run | `reasoning.tokens` | integer | 2,000 (shown) | `ceil(tokens / 1000) × 10` (F-167) |
| Content | Pages processed per run | `bundle.contentPages` | number | 0 | 8 a page (F-168) |
| Voice | Minutes per conversation, by tier | `bundle.voiceClassic`, `voiceGen`, `voicePremium` | number | 0 | 10 / 35 / 75 a minute (F-169) |
| Computer use | Steps per run | `bundle.cuaSteps` | number | 0 | 5 standard / 15 premium (F-170); never zero-rated |
| | Model | `cua.model` | enum `standard`, `premium` | `standard` | — |
| | Windows 365 for Agents hours a month | `cua.w365Hours` | number | 0 | $0.40 an hour (F-171); adjacent line |
| | Always-on Cloud PCs | `cua.w365AlwaysOn` | integer | 0 | $5 per PC a month (F-171); adjacent line |
| GitHub harness | Users × tasks per user per day | `github.users`, `github.perUserPerDay` | numbers | 0 | Light/medium/heavy bands (F-172); split 40/40/20 |
| | Observed heavy-task credits | `github.heavyObserved` | number or `null` | `null` | Without it, heavy is a **minimum** |
| | Build sessions a month × months before go-live | `github.buildSessions`, `github.buildMonths` | numbers | 0 | 1–20 / 21–60 / 61+ (F-173) |
| BC Sales Order | Emails a month; availability checks per email; quote/order writes per email; reply; attachment shares | `bc.so.*` | numbers / boolean / percents | 100; 1; 1; yes; 50% sales data, 0% other | Per email: `2 + 5×checks + 5×writes + 2×reply + 5×salesAttach% + 2×otherAttach%` |
| BC Payables | Invoices a month; lines per invoice; emails without a valid PDF | `bc.pay.*` | numbers | 100; 3; 0 | `50 + 5×lines` per invoice. PDF-less emails are free. **Limits:** 100 emails a day, 500 invoices a day, PDFs of 10 pages or fewer and 5 MB or less. Volume above `500 × daysActive` is refused with a warning. |
| BC Expense | Receipts a month | `bc.exp.receipts` | number | 50 | 50 a receipt; chip "Preview" |
| Environment | Environment | `env` | enum `default`, `production`, `sandbox`, or a custom name | `production`; `default` for BC | 40 characters |
| | Per-agent monthly cap | `perAgentCap` | integer or `null` | `null` | Feeds the governance sheet and NBA-04 |
| Data | Transcript retention, days | `data.retentionDays` | integer | 30 | 0–365; 0 means transcripts off (with a warning that enhanced reporting breaks) |
| | KB per session | `data.kbPerSession` | number | 50, tagged **Estimate** (planner placeholder; Microsoft publishes none) | 0–10,000 |
| | Knowledge files, MB | `data.knowledgeMb` | number | 0 | 0–256,000 (512 MB a file, 500 files) |
| | Search index, GB | `data.indexGb` | number or `null` | `null` ("measure after first upload") | 0–1,000 |

**Card actions:** duplicate, rename, pause, delete. **Limit:** 50 cards.

#### How a card becomes credits

**Per conversation:**
- `generative = turns × generativePct`
- `classic = turns × (1 − generativePct) + greeting`
- `grounded = generative × graphPct`
- Then add actions, flows, AI tools, reasoning, content, voice and computer use as entered.

**Per autonomous run:** the same, with no greeting. Add the trigger and prompt-as-action toggles.

**Precision:**
- Counts may be fractional to 2 dp.
- Credits use the draft's integer-safe `bundleCredits`: rates are stored as `[credits, per]`, never as floats.
- **Band:** `lo` = point; `hi` = point × 1.20, the top of Microsoft's 10–20% buffer (F-179); `mid` = their average. Disclosed.

#### Billing rules: the audience matrix

`zeroRating(card, segment, lineKind, origin)` returns `{billed, code, likely, why}`. **The first match wins:**

| Order | Code | Condition | Result | Chip |
|---|---|---|---|---|
| 1 | `Z-GH` | GitHub Copilot harness | Billed | Billed |
| 2 | `Z-CUA` | Computer-use line | Billed | Billed |
| 3 | `Z-BC` | Business Central agent | Billed per operation | Billed |
| 4 | `Z-VOICE` | Voice or telephony line, or `channel = voice` | Billed | Billed |
| 5 | `Z-AUTO` | Autonomous run (F-182) | Billed | **Billed (Likely)** |
| 6 | `Z-AB` | `harness = chat`, generative answer **without** tenant grounding | Zero-rated for any internal user | Zero-rated |
| 7 | `Z-EXT` | `audience = external` | Billed | Billed |
| 8 | `Z-CHAN` | Channel not in {`teams`, `sharepoint`} | Billed | Billed |
| 9 | `Z-AUTH` | `auth` ≠ `microsoft` | Billed | Billed |
| 10 | `Z-ID` | `identity = maker` | Billed | Billed |
| 11 | `Z-CHAT` | `audience = copilotChat` (unlicensed, tenant-grounded). Off by default in the tenant; needs a pack or PAYG. | Billed | Billed |
| 12 | `Z-UNLIC` | Unlicensed internal segment. Includes Teams guests, which is an inference. | Billed | Billed |
| 13 | `Z-FLOW` | Flow line with `flowTrigger = other` | Billed | Billed |
| 14 | `Z-LIC` | Otherwise: licensed + Microsoft identity + Microsoft channel + standard/chat harness | Zero-rated, fair use applies | Zero-rated |

**Validation:**
- Invalid combinations are coerced, and the card shows the reason. For example: "Teams requires Microsoft sign-in, so authentication was set to Microsoft."
- **An internal agent with `auth = none`** is priced as external, and warned.

**Card footer:** "**{N} credits a month your Copilot licenses already cover.**" N is the sum of the Z-LIC and Z-AB lines. The footer is shown even when N is 0, with the reason code that prevented zero-rating.

#### Precision rules from the teardown (binding)

1. **Licensed users are a headcount**, subtracted exactly once. They are never a percentage, and there is no second "negated" pass. This is Microsoft's estimator bug; see objection O-2.
2. **Autonomous is a real kind:** runs a month × (actions, prompts, flows, pages, computer-use steps). It has two explicit toggles, both off by default, and the trigger toggle is labeled Likely.
3. **Prompt and reasoning pricing** toggles between per response and per 1K tokens. Started 1K units round **up**, and the token defaults are always visible.
4. **No coarse sliders.** Every count is an exact number field.
5. **"Buy" routes to the partner or provider quote** (the Combined tab's quote text), never to Microsoft's direct signup.
6. **No shareable URLs carry state.** Session files replace them, and the page says so in one line beside Download session.

### §S3. Build and environments

**Environment plan** (customer-safe). This is the recommended layout, from the research §2.

| Environment | Role | Allocation default | Tenant draw | Notes |
|---|---|---|---|---|
| Default | Personal productivity | 0 | on (Microsoft default) | Business Central agents draw here unless relinked. This fires NBA-07. |
| Production | Published agents | the sum of its agents' `hi` band | **off** | A per-agent cap on every agent |
| Sandbox | Builds and tests | the GitHub build `hi` + 10%, else 5,000 (planner placeholder, Estimate) | **off** | — |

The partner can rename environments, add up to 20, mark one PAYG-linked (exempt from enforcement), and edit allocations.

**Build burn:**
- **GitHub harness:** `buildSessions × bands` (F-173) in the `buildMonths` before go-live, never ramped. If the heavy share is above 0, it is a minimum. Developer and trial environments have been billed since 2026-09-01 (research §2).
- **Standard harness test chat:** free. One line says so, so nobody pads the SOW for it.

**Warnings:**

| ID | Condition | Copy |
|---|---|---|
| W-ME | Managed Environments on (`env.managed = true`) in an environment with seeded (non-premium) users | "Once Managed Environments is on, everyone active in that environment needs a premium license. Enforcement starts February 2027." (F-198) |
| W-FLOW | A card flagged `convertedFromCloudFlow` | "Converting a cloud flow to an agent flow is one-way." |
| W-DV1 | The environment plan would leave less than 1 GB of free tenant database capacity | "The customer cannot create a production or sandbox environment with less than 1 GB free." |

### §S4. Adjacent costs (non-credit; never in the pool)

| Line | Formula | Rates and facts | Shown when |
|---|---|---|---|
| **Dataverse baseline** | 3 GB database / 3 GB file / 1 GB log; **15 / 20 / 2 GB** once a pack or PAYG is configured. One-time; does not grow with packs. | F-189, F-190 | Always |
| Transcript growth (database) | `Σ cards: sessionsPerMonth × (retentionDays / 30) × kbPerSession`, in GB (1 GB = 1,000,000 KB), steady state | `kbPerSession` is an Estimate | Retention > 0 |
| Knowledge files (file) + index (database) | `knowledgeMb / 1,000` GB to file; `indexGb` to database | — | Any files |
| Overage | `max(0, use − entitlement)` per type, priced at the partner's choice: annual add-on (database $40, file $2, log $10 a GB a month) or PAYG (database $48, file $2.40, log $12) | F-191, F-192 | Use > entitlement in any month |
| **Windows 365 for Agents** | `hours × $0.40 + alwaysOn × $5` | F-171 (the $5–$10 range and the regional ceiling in the notes) | Computer-use steps > 0 |
| **Agent 365** | `$15 × agent owners and sponsors` (an input: `adjacent.agent365Owners`, default = the number of active cards, capped at total users) | F-009. **Blocked** with "needs Business Premium (or E5/E7, or Defender + Purview Suites)" unless `tenant.base ∈ {premium, e5e7}` or `tenant.suites = yes` | Partner turns it on, or NBA-12 applies it |
| **BYOM / Foundry pass-through** | Editable dollars a month | `partner` tag; no fact (customer's own Azure) | Value > 0 |
| **Power Automate Premium** | Flag only, with no price | — | Any card with `flowTrigger = other` and premium connectors, or a Managed Environment with seeded users |

### §S5. Results (customer-safe unless noted)

1. **Monthly credit band** per agent and in total: lo, mid and hi, with the provenance pill.
2. **Zero-rated credits:** "What your Copilot licenses already cover."
3. **Dollars at the customer rate:**
   - Credits at $0.01 (F-149), or the partner's sell price when the hub is in sell mode.
   - Sell mode defaults on if the Cowork payload has `sellMode = true`, and uses its `creditUsd`.
   - Packs at $200 (F-013), or the sell price.
4. **Adjacent costs**, in their own box, never summed into credit dollars.
5. **License-vs-meter crossover:**
   - **Break-evens:** 3,000 credits ($30, F-090); 2,100 ($21, F-176); 1,800 ($18 promo, F-147); 2,520 ($25.20 monthly, F-176).
   - **Per eligible card** (standard harness, internal, conversational, unlicensed users > 0): credits a user would stop costing if licensed, against the break-even for the SKU they would get.
   - That SKU is Copilot Business when the 300-seat cap has room (promo while live), else Enterprise.
   - **Verdict:** "License these {N} users instead: it saves {$}/month and they get Copilot", or "Metering is cheaper. Justify seats by Copilot and Cowork value, not by this agent."
   - Scenario B gives 240 credits a user against 1,800, so metering wins.
6. **Value** (optional; off in the customer print until switched on; labeled "Microsoft's formula, your inputs"):
   - **Agent Assisted Hours:**
     - Conversational: `(knowledge references + Σ sessions without references × weight) × 6 min`. The weight is 1 for resolved sessions and 0.7 for escalated or abandoned ones.
     - Autonomous: `actions × 2.8 min` (F-193).
   - **Agent Assisted Value:** hours × $72 (F-154), editable.
   - **Deflection:** resolved sessions × the editable cost per human contact. It defaults to empty, with a hint: "Microsoft's 2024 guidance: $5–$10 per human contact" (unregistered: a dated hint, not a figure, dated and labeled stale).
   - **Note, always shown:** "Microsoft's own report needs 50+ Copilot licenses and 4 weeks of data (F-194), so most SMB tenants rely on this calculation."

### §S6. Partner economics (partner-only)

| Block | Rule |
|---|---|
| **Motion** | The same four states as the Cowork page: `direct`, `indirectReseller`, `notCsp`, `unsure`. Defaults from the payload's `cspMotion`. |
| **Meter cost** | `indirectReseller`: the provider's per-credit rate (input; `null` until set). `direct`: list × (1 − PEC%), where PEC is editable, **default 0**, labeled "unverified for this meter". `notCsp`: none. |
| **Packs** | Margin shows "ask your provider" until a provider pack price is entered. The CSP price point is never defaulted. |
| **P3** | `indirectReseller`: the provider's percent off list (input). `direct`: list. PEC does not apply. |
| **License uplift and margin** | On the seats in scope: current seats plus any the crossover recommends. Sell price minus cost price per SKU. `null` until every cost is set. |
| **Services** | The table below. Every currency value is an `our-price` fact. Saved in the partner card file. |
| **Incentives** | Verified only. See below. |
| **Specialization progress** | Agentic Business Solutions Pathway Two (F-178). Cumulative modeled Copilot Studio consumption dollars over the horizon, against $10,000 TTM per deployment: "This deployment would count toward Pathway Two in {month}", or "{$} short of the $10,000 bar". Also states: two deployments needed; CPOR, CSP T1 or CSP T2. Links to [copilot-specialization.html#s4](../copilot-specialization.html#s4). |

**Services, prefilled from the Playbook and editable.** The prefill is the low end of the range, and the range is shown beside the field.

| Service | Unit | Prefill | Range | Fact | Playbook source |
|---|---|---|---|---|---|
| Assessment (Shadow AI / discovery) | one-time | $1,500 | $1,500–$7,500 | F-204 | the Cowork simulator's ladder rung (`RUNG_FIXED` in `cowork-calculator.html`) |
| Agent build | per agent, one-time | $3,500 | $3,500–$8,000 | F-010 / F-004 | `cpb.html` Stage 2 |
| Environment and governance setup | one-time | **empty**: "enter your price" | — | none until Ken sets one (open register OR-09) | No Playbook figure exists |
| Governance base (run) | per user a month | $12 | $12 (Tier 2) – $15 (Tier 3) | F-201 | `cpb-model-the-practice.html` |
| AgentCare managed service | per agent a month | $350 | $350 (Tier 2) – $400 (Tier 3) | F-199, F-200 | `cpb-model-the-practice.html`, `cpb-field-guide.html` |
| Credit management (FinOps, "Credit Wrap") | % of pooled consumption billed through you | 30% | 25–35% | F-202 | `cpb-model-the-practice.html` |
| Agent 365 governance | per owner a month | $15 pass-through + your fee (empty) | — | F-009 | `cpb-model-the-practice.html` |

Each service row has a `costMonthly` (delivery cost). Margin on services is `null` until it is set.

**Incentives (verified only):**
- **Copilot in 30:** a 25-user, 30-day Copilot Business trial for customers under 300 employees, through CSP, from 2026-08-01 (F-195). Shown when total users < 300 and Copilot seats = 0.
- **Growth margin:** live 2026-10-01 for Copilot, E5, E7, the Defender and Purview Suites and W365 Enterprise. **Copilot Studio is not covered.** The block says so plainly.
- **FY27 Copilot Agents Voucher:** **excludes CSP customers** (F-197). Shown only to rule it out for a CSP deal.
- **Cowork activation incentive:** exists; terms gated. No figure.

### §S7. Conversation layer (partner-only)

#### Next-best-action rules

`nextBestAction(result)` returns `{ primary, all }`:
- `primary` is the **first match** in this order;
- `all` is every match, in order, and feeds the talk track.

Each rule renders:
- an eyebrow;
- the rule name;
- **why**, using the scenario's numbers;
- **opener** (what to say);
- **then** (the next step);
- **Apply**, when a fix exists (`applyFix` patch paths);
- a link to the matching site-guide section (DESIGN §8b.2, `a.docref`).

| ID | Name | Condition, in plain terms | Opener | Then | Apply fix | Link |
|---|---|---|---|---|---|---|
| NBA-01 | No billing path | Billed credits > 0, and the billing path is `none` or `unsure` (no pack, no PAYG link, no Azure subscription) | "Before we talk about how much, we need a way for Microsoft to bill it. Today nothing is set up, so the first agent call that isn't covered by a license will simply fail." | Set up the billing path first: one pack, or an Azure subscription linked through a Power Platform billing policy. | Set `combined.plan` to the optimizer's best option, and `tenant.billingPath` to its family | [azure-billing-setup.html#section-4](../azure-billing-setup.html#section-4) |
| NBA-02 | Say it plainly: every public conversation is billed | Any active card with `audience = external`, or `auth = none` | "Every conversation on your website is billed. There's no license that covers a visitor. That's {credits} credits, about {$} a month, at the volumes you gave me." | Agree the monthly volume ceiling, and put a per-agent cap on it. | Set `perAgentCap` to the card's `hi` | [agent-never-done.html#section-8](../agent-never-done.html#section-8) |
| NBA-03 | Pool starvation | A Cowork lane is present, and Power Platform environment allocations > purchased capacity − the Cowork `mid` in any month (F-183) | "Your agents and Cowork share one pot of credits. As configured, the agent environments reserve so much that Cowork runs dry by day {d}." | Allocate agents only what they need, and turn tenant draw off. | Set each environment's allocation to its agents' `hi` sum; tenant draw off | [copilot-studio-agent-engagement.html#section-9](../copilot-studio-agent-engagement.html#section-9) |
| NBA-04 | The 125% kill switch, with no per-agent caps | Prepaid capacity > 0, and any active card with `perAgentCap = null` (F-175) | "If usage runs past 125% of what you've bought, Microsoft switches custom agents off. Your users find out when the agent stops answering." | Set a per-agent cap and an 80% alert on day one. Treat the cutoff as an SLA event in the managed service. | Set every `perAgentCap` to the card's `hi` | [agent-never-done.html#section-8](../agent-never-done.html#section-8) |
| NBA-05 | December 1 cap | The December 1 default applies (Copilot Business seats > 0, `cspNewBusiness = yes`, country not excluded, the horizon reaches 2026-12), and a modeled Cowork user exceeds 4,000 credits a month (F-157) | "New Copilot Business licenses bought through CSP from December 1 come with a 4,000-credit monthly limit per user. At the usage we've modeled, your heavier users hit it around day {d}." | Decide the per-user limit now, and write it into the governance sheet. | Set `tenant.perUserCap` to the modeled per-user `hi`, rounded up to 500 | [coworksession40.html#section-6](../coworksession40.html#section-6) |
| NBA-06 | License instead | Any crossover verdict is `license` | "For these {N} people, a Copilot Business seat costs less than metering them through the agent, and they get Copilot as well." | Quote {N} seats on the Copilot Business SKU, and re-run the agent with them licensed. | Move N from `users.unlicensed` to `users.licensed`; add N to `tenant.seats.business` | [agent-never-done.html#section-3](../agent-never-done.html#section-3) |
| NBA-07 | Business Central agents on the default environment | Any active `bc` card with `env = default` | "The Business Central agents will draw from your default environment, which everyone shares, unless we relink them." | Link the BC environment to the production environment and cap each BC agent. | Set `env = production` and `perAgentCap = hi` | [copilot-studio-agent-engagement.html#section-9](../copilot-studio-agent-engagement.html#section-9) |
| NBA-08 | Dataverse overage ahead | Projected database or file use exceeds entitlement in any month of the horizon (F-189 to F-192) | "Transcripts and knowledge files will outgrow your included Dataverse storage in month {m}. That's a separate charge from credits." | Set retention to what you'll actually review, and price the add-on if you still need it. | Set `data.retentionDays = 30` on cards above 30 | [agent-never-done.html#section-7](../agent-never-done.html#section-7) |
| NBA-09 | GitHub harness build burn | Any GitHub card, or any `buildSessions > 0` (F-173) | "On this kind of agent, building and testing consumes credits from day one, before anything is published." | Put a build budget line in the SOW, and run the build in the sandbox with a fixed allocation. | Add a "Build budget" service row priced at the build `hi` × $0.01 | [agent-never-done.html#section-5](../agent-never-done.html#section-5) |
| NBA-10 | Reasoning bills twice | Any active card with `reasoning.on` (F-167) | "The reasoning model is billed on top of the step that uses it. On this agent it adds {credits} a month." | Check whether the job needs reasoning, or a standard model will do. | None (informational); show the delta with reasoning off | [copilot-studio-agent-engagement.html#section-6](../copilot-studio-agent-engagement.html#section-6) |
| NBA-11 | Measure 90 days, then commit | The best option includes P3, or more than 1 pack, and no quantity is `measured` | "These volumes are our best estimate, not your history. Let's start with the smallest commitment and buy more once we've seen 90 days of real usage." | Start on 1 pack + PAYG overflow. Re-run with actuals at day 90. | Set `purchase.appetite = conservative`; set the plan to "1 pack + PAYG" | [agent-never-done.html#section-9](../agent-never-done.html#section-9) |
| NBA-12 | Agent 365 | 3 or more active cards, and Agent 365 eligible (§S4) | "With {n} agents in production, you'll want one place to see who owns each one and what it can reach. That's Agent 365, at $15 per owner." | Add Agent 365 for the agent owners and sponsors only. | Turn on the Agent 365 adjacent line with `owners = n` | [agent-never-done.html#section-11](../agent-never-done.html#section-11) |
| NBA-13 | Specialization | Modeled Copilot Studio consumption reaches $10,000 TTM within the horizon (F-178). Partner-facing; never shown to the customer. | (to the partner) "This deployment clears the $10,000 TTM bar in {month}. It counts as one of the two Pathway Two deployments." | Record the deployment against the specialization. Check that the association type is CPOR, CSP T1 or CSP T2. | None | [copilot-specialization.html#s4](../copilot-specialization.html#s4) |
| NBA-14 | Default: estimate → cap → monitor → true-up | Nothing above matched | "Here's the estimate. Next we set the caps, then we watch the real numbers monthly and true up." | Book the 30-day check-in, and set the 50/80/100% alerts. | None | [copilot-studio-agent-engagement.html#section-8](../copilot-studio-agent-engagement.html#section-8) |

#### Talk track

- **One customer-addressed line per finding**, from `all`, plus the headline lines below.
- Each line has a **Copy** button. Copy uses the Clipboard API, with a select-text fallback.
- **Voice:** second person, plain words, numbers from the scenario.

**Headline lines:**

| Line | Template |
|---|---|
| T-POOL | "All in, you're looking at {lo}–{hi} credits a month, about {$lo}–{$hi}, across Cowork and {n} agents." |
| T-ZERO | "{z} credits a month are already covered by the Copilot licenses you own. That's {pct}% of the agent traffic." |
| T-BUY | "The cheapest way to buy it is {plan}: {$}/month, against {$payg} if you paid as you go." |
| T-GUARD | "We'll set a cap on each agent and alerts at 50, 80 and 100%, so nothing switches off by surprise." |
| T-ADJ | "Separately from credits, budget {$} a month for {lines}." |
| T-SEAT | Either the NBA-06 opener, or "Metering is cheaper than a seat for these users, so we'd justify seats by what Copilot and Cowork do for them." |

#### Objection cards

There are nine cards. Placeholders fill from the result. A card whose numbers are absent shows the generic line, and is marked "no figures in this scenario".

| ID | Objection | Draft answer |
|---|---|---|
| O-1 | "Why is the meter more than a seat?" | "It is only for the people who use the agent a lot. A seat at {sku price} pays for itself above {breakEven} credits a month. Your unlicensed users average {perUser}. {verdict}. For everyone below that line, the meter is the cheaper way in." |
| O-2 | "Microsoft's estimator says less." | "It can, for two reasons. First, it prices greetings and flows differently from the rate card. Here's the line-by-line with sources. Second, on internal agents it subtracts licensed users twice. For a helpdesk like yours, Microsoft's tool shows 4,800 credits where the published rate card gives 9,600, because it removes the licensed users and then removes them again. Our numbers reproduce every Microsoft worked example exactly." Itemized lines: greetings at traffic, flows at traffic, with F-161 and F-165 links. |
| O-3 | "Isn't it free with our licenses?" | "Partly. A licensed person, signed in with their own account, in Teams, SharePoint or Copilot Chat, costs nothing to run, and that's {z} credits a month here. Website visitors, unlicensed staff, scheduled or automatic runs, and anything that drives a computer are billed. That's {b} credits." |
| O-4 | "The 25-credit myth." | "You may have read that an agent action costs 25 credits. Microsoft's published rate is 5 (F-163). The 25 is an old figure that still circulates. Every number here is the current rate card, dated {RATECARD_VERSION}." |
| O-5 | "What if we run out?" | "Flows stop at 100% of what you've bought, and custom agents switch off at 125% (F-175). That's why we cap each agent, alert at 80%, and keep a pay-as-you-go overflow, so the agent keeps answering and the bill stays visible." |
| O-6 | "Why not pre-buy for 20%?" | "The 20% discount is the top tier, at 300 million credits (F-155). At your volume the best pre-purchase tier saves {p3pct}%, and only if you use all of it in the year. Packs expire monthly with no rollover. So: {plan} now, and revisit at day 90 with real usage." |
| O-7 | "Why do we need Dataverse or Agent 365?" | "Dataverse is where the agent keeps its conversations and files. You get {entitlement} included, and at your settings you'll use {use} by month {m}. Agent 365 is optional. It becomes worth it around three agents, and it needs Business Premium, which you {have/don't have}." |
| O-8 | "You're marking up credits." | "The credits are priced at Microsoft's list rate on this page, {$}/credit. What we charge for is the work around them: setting the caps, watching the meter monthly, and truing up. That's the credit management line, shown separately so you can see it." (Partner-only note: the Playbook's Credit Wrap is about 30% on pooled consumption. Show it as a service, never hide it inside the credit price.) |
| O-9 | "Why do we pay while we're still building?" | "On the GitHub Copilot harness, Microsoft bills building and testing as well as running: {buildLo}–{buildHi} credits before go-live here. It's in the SOW as its own line, it runs in a sandbox with a fixed allocation, and it stops when the build does. Standard agents don't bill for test chat." |

#### Upsell ladder

| Rung | Service | Price shown (from §S6) | Recommended when |
|---|---|---|---|
| 1 | Assessment | $3,500–$5,000 | No agents published yet, or tenant base `unsure` |
| 2 | First agent build | $3,500–$8,000 per agent | One or more cards with `startMonth > 0`, or no production environment |
| 3 | Environment and governance setup | your price | NBA-01, NBA-03, NBA-04 or NBA-07 fired |
| 4 | AgentCare managed service | $350–$400 per agent a month | 1+ active agents in production |
| 5 | Credit management (FinOps) | 25–35% of pooled consumption | PAYG overflow > 0, or 2+ purchase families in the plan |
| 6 | Agent 365 governance | $15 per owner + your fee | NBA-12 fired |

**Highlighting:** the highest-numbered rung whose condition holds is highlighted as recommended, and lower rungs that hold are ticked. Rung 1 is highlighted when nothing else holds.

---

## 6. Combined plan tab (§8)

### 6.1 Pool

**Monthly lo/mid/hi over the 12-month horizon** for each lane:
- **Cowork:** `coworkFromPayload` (§10), from the tab, "with its band".
- **Studio standard/chat:** card bands × ramp from the go-live month.
- **GitHub:** run plus build.
- **Business Central.**

**When the Cowork lane is included:**
- once the Cowork tab has reached `screen === 'results'`; or
- when the partner turns on "Include Cowork".

It is shown as "from the Cowork tab", with its band. The hub does not model Cowork a second time. The Cowork tab's reconciliation box already discloses how it differs from Microsoft's estimator.

**Scenario disclosure:** "Low, mid and high move together across every lane." This overstates the spread; we accept that, and say so.

### 6.2 Purchase optimizer

| Item | Rule |
|---|---|
| Families | PAYG; packs, flat or step-up by month; the nine P3 tiers (F-155), with several plans held at once chipped **Likely**; mixes |
| Billing order | Packs → P3 → PAYG (F-181). No pack rollover. P3 is a 12-month pool. |
| Commit appetite | `conservative` (default): stranded commitment ≤ 5% of the mid scenario. `balanced`: ≤ 15%. `aggressive`: no cap. |
| Objective | Expected cost over lo/mid/hi, weighted 25/50/25, inside the appetite cap |
| Outputs | Top 3 options. For each: annual dollars; effective $/credit; waste (unused pack credits, and stranded P3); the P3 exhaustion month; regret (the extra cost if the lo or hi scenario happens). Plus a plain verdict, e.g. "One pack baseline + PAYG overflow", "PAYG below 20,000 a month" or "Rounding to whole packs costs {$}". |
| Agent P3 | Disclosed in a note only (F-177). Never chosen. |
| Current holdings | Optional packs, plus P3 counts by tier. Shown as an option row "what you hold". |

### 6.3 Enforcement simulation

- **Power Platform:**
  - Allocations come out of prepaid capacity first.
  - Flows block at 100%, and custom agents are disabled at 125% (F-175).
  - PAYG-linked environments are exempt.
- **Microsoft 365:** credits available = purchased − Power Platform pre-allocations (F-183). This is what starves Cowork.
- **Per-user caps,** including the December 1 default of 4,000 (F-157).
- **Output:** a day-of-month timeline for the peak month. It shows, per environment and for Cowork, the day flows stop, the day agents switch off and the day users hit their cap. It is a step chart, in the style of cps-budget-guide.
- **"Show Microsoft's example":** loads 25,000 prepaid, 10,000 to environment A, and 500 to PAYG environment D. The result is a tenant remainder of 14,500 and a cutoff at **18,125**.

### 6.4 Governance settings sheet

The sheet is customer-safe. It has its own print mode, plus **Copy settings**, which copies plain text. Each row gives the setting, its value from the plan, and the click path.

| Setting | Value source | Click path |
|---|---|---|
| Tenant / group / user spending limits | Pool `hi` and per-user `hi` | Microsoft 365 admin center → Billing → Cost management → Spending policies |
| Per-agent monthly limits | Each card's `perAgentCap`, else `hi` | Power Platform admin center → Licensing → Copilot Studio → Manage agents |
| Environment allocations and tenant draw | §S3 plan | Power Platform admin center → Licensing → Copilot Studio → Environments; Environment groups → Rules → "Cost controls – Draw from tenant credit pool" |
| Alerts at 50 / 80 / 100% | Fixed | Spending policy threshold emails; per-agent notification threshold; Azure budget, which alerts only |
| "Auto-apply new services" decision | Recommend **off** until each new service is reviewed | Within each spending policy |
| Transcript retention | Card values | Copilot Studio admin → transcript controls |
| Agent identities | Note only: they are created automatically | Entra admin center → Agent ID |

---

## 7. Outputs (§9)

| Output | Contents | Audience | Built from |
|---|---|---|---|
| **Combined customer report** | One page: <ul><li>per-tool numbers (Cowork, agents, total) with bands;</li><li>how to buy, in plain words;</li><li>guardrails;</li><li>the license-instead callout;</li><li>the zero-rated statement;</li><li>adjacent costs;</li><li>the provenance legend;</li><li>dated sources;</li><li>"Prepared by {meta.preparedBy}".</li></ul> Value only if switched on. | Customer | `customerView()` |
| **Partner working copy** | Everything, including §S6–§S7 | Partner | full result |
| **Governance sheet print** | Settings, click paths, values | Customer-safe | `customerView().governance` |
| **Quote / handoff text** | <ul><li>Year-one need by month;</li><li>the plan mix as "Order as:" lines (packs × months, P3 tier × count, PAYG estimate);</li><li>environment allocations;</li><li>finality: P3 is a one-year, non-cancelable commitment that auto-renews by default (F-160), and packs are billed annually with no rollover (F-013).</li></ul> **No margin.** | Provider | `quoteText()` |
| **Session save / load / compare** | §4.7 | Partner | `serializeSession` / `parseSession` |
| **CSV cost trace** | Consumption rows only. Columns: `id, lane, agent, label, quantity, quantityExpression, rate, rateUnit, credits, treatment (Billed / Zero-rated / Billed (Likely)), reasonCode, scenario, factId, sourceUrl, sourceDate, rateProvenance, quantityProvenance` | Customer-safe | `csvTrace()` |

---

## 8. Provenance and copy (§10)

- **Pills:** Microsoft, Modeled, Estimate, You said, Measured, plus the **Likely** chip. A legend appears on the page and on every print.
- **Every Microsoft number links to its source**, with the date, through the engine's `SRC` table. A link is `target="_blank" rel="noopener"`.
- **`RATECARD_VERSION`** (`2026-10-11`) appears in the masthead and on every export.
- **The stamp:** "Rates checked 2026-10-11. Re-check after Ignite (Nov 17–20)."
- **Copy rules:**
  - US English.
  - No rival distributor names.
  - "Copilot Credits", not "messages".
  - "Agent action is 5", never 25.
  - Partner-facing text says "your provider", never a distributor's name.
  - Every reference to another playbook page is a live `a.docref` link (DESIGN §8b.2).
  - No `max-width` on prose (§8b.1).
  - No 4- or 5-card auto-fit grids (§8b.3).
  - `td.n` holds numbers only (§8b.4).
- **Product name:** the Credits Guide records the August 2026 rename of Microsoft 365 Copilot to Microsoft Copilot. SKU names follow the price list at ship, and product-name prose follows the site-wide rename decision (OR-14).

---

## 9. Rate card and fact register

### 9.1 Rates the engine uses (registered)

| Engine key | Value | Fact | Source (date) |
|---|---|---|---|
| `payg` | $0.01 per credit | F-149 | UBB overview (2026-08-21) |
| `pack` | $200 / 25,000 credits a month, annual, no rollover | F-013 | Copilot Studio Licensing Guide (Oct 2026) |
| `cccu` | 1 CCCU = $1 = 100 credits | F-160 | copilot-credit-p3 (2026-07-17) |
| `p3Tiers` | 9 tiers, 5–20%; Tier 1 $2,850; Tier 2 $14,100; Tier 3 $27,900 … | F-155 | copilot-credit-p3 (2026-10-08) |
| `agentP3Tiers` | 20K / 100K / 500K ACU at 5 / 10 / 15% | F-177 | agent-pre-purchase (2026-09-29) |
| `billingOrder` | packs → P3 → PAYG | F-181 | UBB setup (2026-10-01) |
| `m365Share` | purchased − PPAC pre-allocated | F-183 | UBB setup (2026-10-01) |
| `classic` / `generative` / `action` / `grounding` | 1 / 2 / 5 / 10 | F-161 / F-162 / F-163 / F-164 | requirements-messages-management (2026-08-03) |
| `flow` | 13 per 100 | F-165 | as above |
| `aiBasic` / `aiStandard` / `aiPremium` | 0.1 / 1.5 / 10 per response or per 1K tokens | F-166 | as above |
| `reasoning` | +10 per 1K tokens | F-167 | as above |
| `content` | 8 a page | F-168 | as above |
| `voice*` | 10 / 35 / 75 a minute | F-169 | as above |
| `cua*` | 5 / 15 a step | F-170 | computer-use (2026-07-03) |
| `w365Hour` / `w365AlwaysOn` | $0.40 an hour / $5 per PC a month | F-171 | W365 for Agents pricing (2026-05-01) |
| `ghRun` / `ghSplit` | 100–300 / 300–500 / 500+; 40/40/20 | F-172 | billing-credit-overview (2026-09-10) |
| `ghBuild` | 1–20 / 21–60 / 61+ per session | F-173 | Credits Guide (Oct 2026) |
| `enforceFlows` / `enforceAgents` | 100% / 125% | F-175 | requirements-messages-management (2026-08-03) |
| `capDate` / `capExcluded` / `capDefault` | 2026-12-01; 11 countries; 4,000 | F-156 / F-157 | Partner Center Oct 2026 (2026-10-08) |
| `seatEnt` | $30 | F-090 | Microsoft 365 Copilot enterprise (2026-05-01) |
| `seatE7` | $99 | F-049 | Partner Center |
| `seatBiz` / `seatBizMonthly` | $21 / $25.20 | F-176 | Copilot Business page (2026-10-11) |
| `seatBizPromo` / `bizSeatCap` | $18 until 2026-12-31 / 300 | F-147 | Partner Center Jul 2026 |
| `agent365` | $15 per user a month; Business Premium prerequisite | F-009 | Partner Center Jul 2026 |
| `buffer` | 10–20% | F-179 | agent-usage-estimator (2026-08-03) |
| `specialization` | $10,000 TTM per deployment | F-178 | Partner Center Aug 2026 (2026-08-25) |
| `autonomousBilled` | billed (**Likely**) | F-182 | requirements-messages-management (2026-09-09) |
| `blueprints` | 15 / 12 / 77 / 48 | F-184 | agent-usage-estimator (2026-08-03) |
| `aavRate` | $72 an hour | F-154 | agent-business-value (2026-06-04) |

### 9.2 New facts registered for the planner (F-185 to F-204)

Registered in `data/facts.json` by the engine commit; sources, dates and notes live in each record.

| ID | Value | Type | Label |
|---|---|---|---|
| F-185 | 2 / 2 / 5 / 5 / 5 / 5 / 2 | microsoft-reported | Business Central Sales Order Agent Copilot Credit rates (analyze email / attachment without sales data / attachment with sales data / availability check / quote / order / reply email) |
| F-186 | 50 per invoice + 5 per line | microsoft-reported | Business Central Payables Agent Copilot Credit rates (per invoice, per invoice line) |
| F-187 | 50 | microsoft-reported | Business Central Expense Agent (preview) Copilot Credits per uploaded receipt |
| F-188 | default environment | microsoft-reported | Business Central agents draw Copilot Credit capacity from the default Power Platform environment unless the Business Central environment is linked to another one |
| F-189 | 3 GB / 3 GB / 1 GB | microsoft-reported | Dataverse capacity included with the default environment (database / file / log) |
| F-190 | 15 GB / 20 GB / 2 GB | microsoft-reported | Dataverse for Copilot Studio default tenant capacity (database / file / log) |
| F-191 | $40 / $2 / $10 | microsoft-reported | Dataverse capacity add-ons per GB per month, billed annually (database / file / log) |
| F-192 | $48 / $2.40 / $12 | microsoft-reported | Dataverse pay-as-you-go meters per GB per month (database / file / log) |
| F-193 | 6 min / 2.8 min | microsoft-reported | Agent Assisted Hours time-savings multipliers (per knowledge reference or resolved session / generic action) |
| F-194 | 50 | microsoft-reported | Copilot Studio agents report eligibility: minimum Copilot licenses in the tenant |
| F-195 | 25 users / 30 days | microsoft-reported | Copilot in 30: CSP partner-led Microsoft 365 Copilot Business trial |
| F-196 | Copilot, E5, E7, Defender Suite, Purview Suite, Windows 365 Enterprise | microsoft-reported | CSP growth margin eligible workloads (live 2026-10-01); Copilot Studio is not listed |
| F-197 | CSP customers ineligible | microsoft-reported | FY27 Copilot Agents Voucher Program excludes CSP customers |
| F-198 | February 2027 | microsoft-reported | Managed Environments licensing enforcement: users without a qualifying license blocked from opening apps |
| F-199 | $350 | our-price | AgentCare managed service price per agent per month (Tier 2), Copilot Playbook price sheet |
| F-200 | $400 | our-price | AgentCare managed service price per agent per month (Tier 3), Copilot Playbook price sheet |
| F-201 | $12 | our-price | Per-user governance base retainer per user per month (Tier 2; $10-$15 range), Copilot Playbook price sheet |
| F-202 | 30% | our-price | Credit Wrap markup on pooled consumption, Copilot Playbook price sheet |
| F-203 | $10 | our-price | Agent 365 governance overlay attached price per user per month (Tier 3 default), Copilot Playbook price sheet |
| F-204 | $1,500-$7,500 | our-price | Shadow AI Assessment one-time price range, Copilot Playbook (Cowork simulator ladder rung 1) |

Rules the engine applies that are not separate facts (cited by source in the engine `SRC` table): only Microsoft channels can be zero-rated (publication-fundamentals-publish-channels, 2026-09-16); Agent Builder generative answers without tenant grounding are free (billing-licensing, 2026-08-03; labeled Likely in the engine); transcript retention defaults to 30 days (admin-transcript-controls, 2026-08-27); unlicensed Copilot Chat users on tenant-grounded agents are metered (m365-agents-admin-guide, 2026-04-07). The deflection hint ($5-$10 per human contact, 2024) is shown as a dated hint, never as a figure in a total. Windows 365 for Agents uses F-171.

**Occurrences** are registered by the commit that first places each number (FACTS.md §13 convention).

---

## 10. Engine API contract

> **Status of the engine.** The engine is being implemented in parallel from the paused draft (scratchpad `engine.js`: a pure IIFE `PlannerEngine` of about 1,900 lines, with all plan anchors hand-verified). This section fixes **behavior**, not code. Names match the draft where it already exists.

**Constants:** `VERSION`, `SCHEMA_VERSION` (1), `RATECARD_VERSION` (`'2026-10-11'`), `SESSION_TYPE`, `CARD_TYPE`, `HORIZON` (12), `SRC`, `RC` (frozen rows `{v, unit, fact, prov, src, label}`), `RANK`, `PROV_LABEL`, `ZERO_CODES`, `MOTIONS`, `APPETITE`, `MAX`, `AGENT_PRESETS`, `SCENARIO_PRESETS`.

### State

| Function | Behavior |
|---|---|
| `defaults()` | A fresh state with every key present |
| `normalize(input)` | Rebuilds from `defaults()` through typed coercers. Own keys only; `__proto__`, `constructor` and `prototype` are rejected. Every number is finite and inside `MAX`. Enums are coerced, and invalid channel/auth combinations are fixed with a warning. Never throws. |
| `agentTemplate()` | A blank card |
| `newAgent`, `duplicateAgent`, `renameAgent`, `pauseAgent`, `deleteAgent` | Pure card operations. IDs stay unique; the 50-card limit holds. |
| `applyAgentPreset(state, id, key)` | Loads an archetype into a card, keeping its id |
| `applyScenarioPreset(state, key)` | SMB portfolio, A, B, C, back office. Keeps `meta` and `partner`. |
| `patch(state, path, value)` | Pure path setter used by Apply fixes. Rejects bad keys and unknown paths. |
| `applyFix(state, fix)` | — |
| `defaultsDelta(state)` | How many inputs still sit at their defaults |

### Lanes

| Function | Behavior |
|---|---|
| `coworkFromPayload(payload, horizon)` | Validates a `cowork-lane` v1 object. Returns monthly `{lo, mid, hi}`: `rampCredits[m] × (1 − band)`, `× 1` and `× (1 + band)`. Also returns `included` (whether `screen === 'results'`), `band` and `calibrated`. Invalid input gives an empty lane with a warning. **This replaces the draft's native Cowork lane, which is removed.** |
| `bundleCredits(items)` | Integer-safe sum of `count × rate`, with rates as `[credits, per]` |
| `conversationBundle(card)` / `autonomousBundle(card)` | Feature items per conversation or run, from the shape fields and toggles. Started 1K-token units round up. |
| `zeroRating(card, segment, lineKind, origin)` | The §S2 matrix. Returns `{billed, code, likely, why}`. |
| `audienceMatrix()` | The full cross-product of harness × kind × audience × channel × auth × identity × segment × line kind, with the code each cell resolves to. Used by test section H, and as a reference table on the partner view. |
| `studioAgent(card, state)` | Per-segment itemized trace lines; billed and zero-rated; band; flags; Windows 365 dollars |
| `githubAgent(card, state)` | Task bands at the split; heavy is a minimum unless observed; the build burn sits before go-live |
| `bcAgent(card, state)` | Sales Order, Payables and Expense formulas; operating-limit warnings; always `Z-BC` |
| `dataverse(state, agents)` | Baseline (3/3/1 or 15/20/2); transcript growth; files and index; the month entitlement is exceeded; overage dollars (annual add-on or PAYG). Non-credit. |
| `adjacentCosts(state, agents)` | Windows 365, Agent 365 (with eligibility), BYOM, the Power Automate flag. Non-credit. |
| `valueModel(state, agents)` | AAH and AAV (6 min, 2.8 min, 0.7, $72), deflection, the eligibility note |

### Combined

| Function | Behavior |
|---|---|
| `pool(state, coworkLane)` | Monthly lo/mid/hi per lane, and in total |
| `p3Plan(units)`, `p3Cover(units)`, `p3UnitsFor(credits)` | Cheapest exact and cheapest covering P3 combinations (DP over the nine tiers) |
| `optimize(demand, opts)` | §6.2. Returns `{best, top[3], families, payg, current, blocked, overbuy, savingsVsPayg}`. |
| `tenantEnforcement(prepaid, environments)` | Remainder, flows cutoff and agents cutoff, per environment; PAYG environments exempt |
| `enforcementTimeline(state, pool, plan)` | Day-of-month events for the peak month, including Cowork starvation and per-user caps |
| `governance(state, ...)` | Governance-sheet rows, with values and click paths |
| `crossover(state, agents)` | Break-evens; per-card verdict, SKU and saving; the 300-seat room |
| `specialization(pool)` | Cumulative Studio dollars against $10,000; the month reached |

### Partner and conversation

| Function | Behavior |
|---|---|
| `services(state)` | Normalized service rows with Playbook prefills |
| `partnerEconomics(state, plan)` | Revenue, cost and margin by motion; `null`s plus an `asks` list |
| `nextBestAction(result)` | `{primary, all}` from §S7 |
| `talk(result)` / `objections(result)` | Pure text builders. Numbers in, strings out. No HTML. |
| `ladder(result)` | Rungs, with the recommended rung |

### Outputs

| Function | Behavior |
|---|---|
| `compute(state, coworkPayload)` | The one entry point. Returns the full result with `trace`, `warnings` and `asks`. Never throws. |
| `customerView(result)` | **Whitelist** copy: lanes, bands, zero-rated, customer-rate dollars, adjacent costs, crossover callout, value (only if on), how to buy (plan labels and dollars at the customer rate), governance, provenance, sources, `preparedBy`. Contains none of: `margin`, `marginPct`, `cost`, `provider*`, `pecPct`, `costMonthly`, `motion`, `asks`, `nba`, `talk`, `objections`, `ladder`, `specialization`, `incentives`. |
| `quoteText(result)` | §7 quote text. No margin. |
| `csvTrace(result)` | §7 CSV, with RFC 4180 quoting. Formula-leading cells are prefixed with `'`. |
| `serializeSession`, `parseSession` | §4.7. Parse caps the file at 5 MB, validates the type and version, and normalizes. |
| `serializePartnerCard`, `parsePartnerCard` | — |
| `fmtInt`, `fmtUsd`, `fmtPct` | Formatters |

**Release 1 exclusions:**
- The draft's `workiqLane` and `autopilotPanel` stay out of `compute()` output and out of the pool. They may remain as dormant functions for Release 2.
- Test C asserts that they never move a total.

---

## 11. Regression anchors

Every anchor is an exact-equality assertion in section A unless marked ≈.

| # | Anchor | Inputs | Expected |
|---|---|---|---|
| A1 | Microsoft support bot | `[(4×1)+(2×2)] × 900` | **7,200** credits a day |
| A2 | Microsoft sales research | `[(4×2)+(4×10)] × 100` unlicensed; 50 licensed zero-rated | **4,800** |
| A3 | Order processing | 4 actions × 5 | **20** a run |
| A4 | Tenant-graph grounded answer | 2 + 10 | **12** |
| A5 | Blueprints | expense / approval / timesheet | **15 / 12 / 77** |
| A6 | Enforcement | 25,000 prepaid; 10,000 to A; 500 to PAYG D | remainder 14,500; cutoff **18,125** |
| A7 | Computer use | 4 steps | **20** standard / **60** premium |
| A8 | P3 Tier 2 | 1.5M credits | **$14,100** (vs $15,000 PAYG) |
| A9 | Flat 755,000 a month for 12 months | optimizer families | packs **$72,600** (30 packs + 5,000 PAYG a month); P3 mix **$84,300** (3 × Tier 3 + 600 CCCU PAYG); PAYG **$90,600** |
| A10 | GitHub harness | 10 people × 2 a day × 22 days = 440 at 40/40/20 | minimum **114,400** |
| A11 | December 1 default | 100 users × 4,000 | **400,000** a month |
| A12 | Break-evens | $30 / $21 / $18 / $25.20 | **3,000 / 2,100 / 1,800 / 2,520** |
| A13 | BC Sales Order | `[2+5+5+2+(5×0.5)] × 100` | **1,650** a month |
| A14 | BC Payables | `(50 + 5×3) × 100` | **6,500** a month |
| A15 | BC Expense | 50 × 50 receipts | **2,500** a month |
| A16 | Scenario A | 1,500 × 5 × 2 | **15,000** ($150) |
| A16a | A, 20% classic | 1,500 × 5 × (0.8×2 + 0.2×1) | **13,500** |
| A16b | A, 20% log a lead (1 action) | 300 × 5 | **+1,500** |
| A17 | Scenario B, billed | 40 × 4 × 5 × 12 | **9,600** ($96) |
| A17a | B, zero-rated | 20 × 4 × 5 × 12 | **4,800** |
| A17b | B on a non-Microsoft channel | 60 × 4 × 5 × 12 | **14,400** |
| A17c | B, per unlicensed user | 4 × 5 × 12 | **240** credits ($2.40); verdict `meter` against 1,800 |
| A18 | Scenario C | 400 × (6×5 + 1×10) | **16,000** ($160) |
| A18a | C, trigger as action | 400 × 45 | **18,000** |
| A18b | C, prompt as action | 400 × 45 | **18,000** |
| A18c | C, premium per 1K at 1,500 tokens | 400 × (30 + 2×10) | **20,000** |
| A18d | C + 1 content page per run | + 400 × 8 | **+3,200** |
| A19 | SMB portfolio | A + B + C | **40,600** a month; 487,200 a year |
| A20 | Best buy, conservative | — | **1 pack + 15,600 PAYG = $356 a month, $4,272 a year** |
| A20a | Alternatives | — | 2 packs $4,800 (9,400 unused a month); PAYG $4,872; P3 Tier 1 + 187,200 PAYG $4,722 |
| A21 | Pack break-even | $200 ÷ $0.01 | a pack pays off above **20,000** credits of monthly overflow |
| A22 | Dataverse transcript growth | 10,000 sessions a month × 50 KB × 30-day retention | **0.5 GB**; at 90 days, **1.5 GB** |
| A23 | Value | 1,000 sessions, 20% escalated, no references: (800 + 200×0.7) × 6 min = 94 h; plus 400 runs × 6 actions × 2.8 min = 112 h | **206 h**; × $72 = **$14,832** |
| A24 | Microsoft estimator objection | O-2 text for scenario B | contains "4,800" and "9,600" |
| A25 | Cowork payload lane | `rampCredits` all 755,000, band 0.30 | monthly lo **528,500** / mid **755,000** / hi **981,500** |

**Teardown note**, recorded in the suite header:
- Only FastTrack v2, ogradyliam5 and the Copilot Ramp Playbook matched A, B and C.
- Microsoft's Studio estimator under-states B by 50%, through the licensed-user double subtraction in `multi-agent-calculations.js`.
- Its premium-prompt modifier under-states C.

---

## 12. Tests: `tools/test-credit-planner.js`

The suite is self-extracting. It pulls `<script id="planner-engine">` out of the hub, as the Cowork suites do (line-ending agnostic), and runs it in Node with no DOM.

| Section | Covers |
|---|---|
| **A. Anchors** | Every row of §11, exact |
| **B. Totality and hostile input** | `compute()` over every path generated from `defaults()`, with each scalar set to `-1`, `0`, `1e308`, `NaN`, `'abc'`, `null`, `[]`, `{}` and `'__proto__'`. Hostile session files: oversize, wrong `__type`, future `schemaVersion`, prototype keys, 10,000 agents, deep nesting. A seeded fuzz with a fixed-seed PRNG in the test, not the engine. **Performance:** `compute()` on 50 cards under 50 ms median. Every output number is finite, and nothing throws. |
| **C. Invariants** | <ul><li>The best option is ≤ PAYG.</li><li>Moving a user from unlicensed to licensed never raises billed credits.</li><li>Partner inputs (motion, provider rates, PEC, services) never move the pool, the optimizer's choice or `customerView()`.</li><li>Paused cards contribute 0.</li><li>Billed + zero-rated = gross, per card.</li><li>Autopilot, Work IQ and what-if never enter totals.</li><li>Adjacent costs never enter the pool.</li><li>lo ≤ mid ≤ hi everywhere.</li></ul> |
| **D. Optimizer oracle** | Brute force over packs 0–N by month, P3 counts per tier, and PAYG on small demands. The oracle's minimum equals `optimize().best` within $0.01, for every appetite. |
| **E. Leak** | `JSON.stringify(customerView(r))` contains none of the partner keys in §10 and no partner dollar figure (margin, provider cost, service price). The rendered customer report HTML, built from a fixture via the UI's pure render functions, contains none of them either. |
| **F. Isolation** | <ul><li>The hub source has no `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `fetch(`, `XMLHttpRequest` or `sendBeacon`.</li><li>The engine source has no `Date` and no `Math.random`.</li><li>There are exactly two inline scripts, plus one iframe pointing at `cowork-calculator.html?embed=1`.</li><li>`postMessage` targetOrigin is `location.origin`.</li><li>`git diff` of `cowork-calculator.html` across planner commits touches only the hooks commit.</li></ul> |
| **G. Facts cross-check** | Every `RC` row's `fact` exists in `data/facts.json`. Each fact's value string matches the row's value, or a notes entry. Every currency literal in the hub HTML maps to a fact ID. |
| **H. Agent cards and the audience matrix** | Card operations: unique ids, the 50-card limit, preset round-trip. `audienceMatrix()` over the full cross-product: Z-LIC appears only in licensed × Microsoft identity × `teams`/`sharepoint` × standard/chat × non-autonomous × non-CUA/voice cells. Z-AB appears only in chat-harness ungrounded generative lines. Every other cell is billed. The Likely chip appears only on Z-AUTO. |

**Hub integration** (browser-driven on the preview server `site` at port 8800; results recorded in the commit message):
- The embed loads.
- The payload arrives after Cowork reaches results.
- Customer view toggles both documents.
- The combined customer print contains the Cowork figures.
- The Cowork-only print fires in the iframe.
- A session round-trips.
- Mobile width works with no horizontal scroll.
- No console errors.

**Additions to the Cowork v3 suite** (hooks commit):
- The emitter's key set equals §4.4 exactly, with no partner keys.
- There is no emit when the page is not framed.
- `body.embedded` applies only with both the query parameter and a frame.
- Strip sets and customer-ok counts are unchanged.
- The golden snapshot is unchanged.

---

## 13. Build order

Each step is one or more commits, and every commit is green.

| Step | Work |
|---|---|
| 1 | This spec and the research record |
| 2 | Rebase `feature/credit-planner` onto `fix/cowork-track-a`. Bring in the draft engine. Hub shell: masthead, tabs, footer, Cowork iframe. Suite skeleton: B, F, G. |
| 3 | Cowork embed hooks commit, with the v3 tests. Hub auto-height, scroll and shared customer view. |
| 4 | Engine Studio core: `bundleCredits`, the zero-rating matrix, `studioAgent`/`githubAgent`/`bcAgent`, archetypes, `adjacentCosts`, `dataverse`. Anchors A1–A18, A22. |
| 5 | Studio tab UI: account context, agent cards, environments, results, crossover, value |
| 6 | Combined tab: pool, optimizer, enforcement, governance sheet. Oracle tests (D); anchors A9, A19–A21, A25. |
| 7 | Partner economics, services prefills, partner card file, conversation engine, talk track, objections, ladder |
| 8 | Customer view, all prints, quote export, session save/load/compare, CSV. Leak tests (E). |
| 9 | Facts registration (§9.2) and occurrences; lint greps; `check-facts`; browser verification at 1280×720 and on mobile; workshop dry run of the three SMB scenarios |
| 10 | **Final ship:** merge `fix/cowork-track-a` and `feature/credit-planner` into `main`, then push. <ul><li>`index.html`: rename the card to cover both tools (for example "Copilot Credit Planner: Cowork & Copilot Studio"), point the CTA at the hub, and keep the standalone Cowork link. Date stamp = the ship date.</li><li>`cowork-calculator.html`: "Last updated" = the ship date, plus one srcline in `#cardBilling` pointing to the hub's Combined tab. No strip-set change.</li><li>Content fixes: the `sitemap.xml` entry; soften "build burn not published" in `copilot-studio-agent-engagement.html` and `agent-never-done.html` (F-173 is now published) and caveat their "licensed → no charge" columns (F-182); "message packs" becomes "capacity packs" in `azure-billing-setup.html`; `coworksession40.html` stops citing the retired estimator as current.</li></ul> |

**Release 2** (after the workshops):
- Autopilot readiness lane;
- Work IQ lane;
- the admin-center actuals import, mapping the research §8.2 columns by meaning;
- a post-Ignite rate check.

---

## 14. Non-goals (Release 1)

- **No shareable state URLs.** Session files replace them; this is deliberate, and stated on the page.
- **No browser storage** of any kind, no analytics and no network calls.
- **No Autopilot lane, no Work IQ lane, no actuals import.** All three are Release 2.
- **No second Cowork model in the hub.** Cowork numbers come only from the embedded calculator's payload.
- **No Agent P3 recommendation**; it is disclosed only.
- **No partner service price presented as a Microsoft figure**, and no CSP price point defaulted.
- **No LLM call.** The conversation layer is a deterministic rules table.
- **No edits to the Cowork calculator's logic.** Two additive hooks only.
- **No Dynamics 365 Sales or Customer Service agent pricing.** Those rates sit in the D365 Licensing Guide; noted for Release 2.

---

## 15. Open register (Likely and unverified items)

| ID | Item | Status | How the page treats it | Check |
|---|---|---|---|---|
| OR-01 | Autonomous trigger runs under a licensed maker are billed | **Likely** (F-182) | Billed, chip "Billed (Likely)" | Microsoft confirmation in one sentence |
| OR-02 | Several P3 plans held at once, each at its own discount | **Likely** (F-155 notes) | Allowed in mixes, chipped Likely | Azure portal purchase test |
| OR-03 | Trigger counted as an action (C = 18,000 vs 16,000) | Microsoft's order example implies not | Toggle, default off, Likely | Rate card wording |
| OR-04 | Teams guests and unlicensed internal users are billed | Inference | Z-UNLIC | Learn statement |
| OR-05 | CSP pack price points $210 / $240 | **UNVERIFIED**, distributor-sourced | Never defaulted; provider input only | CSP price list |
| OR-06 | PEC on the Copilot Credit PAYG meter | **UNVERIFIED** | Default 0, editable, labeled | Partner Center PEC eligibility list |
| OR-07 | MCI rates for Copilot Studio | **UNVERIFIED** | Not shown | Partner incentives guide |
| OR-08 | Agent 365 "user" scope (owner/sponsor vs everyone who interacts) | Likely owner/sponsor (licensing FAQ 122) | Input = owners and sponsors; note shown | CSP price list or a written Microsoft answer |
| OR-09 | Environment and governance setup price | No Playbook figure | Field ships empty | Ken sets an `our-price` fact |
| OR-10 | Transcript KB per session | Microsoft publishes none | 50 KB, Estimate | Measure on one tenant, record as Measured |
| OR-11 | Search index size relative to knowledge files | Unpublished | `null` until entered | Measure after first upload |
| OR-12 | Numeric fair-use limit on zero-rated traffic | Unquantified by Microsoft | Named in the copy; no number | — |
| OR-13 | Agent P3 eligibility for SMB CSP tenants | Unconfirmed | Disclosed only | Azure portal |
| OR-14 | Product rename (Microsoft 365 Copilot → Microsoft Copilot) on the page | Site-wide decision pending | SKU names per the price list | Separate sweep commit |
| OR-15 | Ignite 2026 billing changes | Unknown until November 17–20 | Stamp on the page | Review by 2026-11-24 |
| OR-16 | Dynamics 365 1,000 credits per Premium user a month | **UNVERIFIED** | Not used | D365 Licensing Guide |
| OR-17 | Whether the PAYG meter runs on a CSP Azure plan before December 1 for existing tenants | Partly answered: from December 1, new CSP Copilot Business licenses include Azure setup | NBA-01 copy says "Azure subscription linked through a billing policy" | Partner Center |

---

## 16. Definition of done

- **Anchors:** every §11 anchor passes exactly in `tools/test-credit-planner.js`. Sections A–H are green, and both Cowork suites are green with the golden snapshot unchanged.
- **Teardown scenarios:** A, B and C each load in one click and reproduce 15,000 / 9,600 / 16,000. The SMB portfolio preset gives 40,600 and a best buy of $4,272 a year.
- **Cowork tab:** behaves exactly as standalone. The payload reaches the Combined tab once Cowork reaches results.
- **Customer view:** one toggle hides partner content in both documents. The customer report and CSV pass the leak tests.
- **Facts:** every currency value on the page has a fact ID, every Microsoft number links to a dated source, and the §9.2 facts are registered with occurrences. `check-facts` shows no new MOVED or AMBIGUOUS entries.
- **Lint:** DESIGN §9 and §8b greps report zero findings for the hub. The US-English and rival-distributor greps report zero hits across the hub, this spec and the research record.
- **Browser:** verified at 1280×720 and at mobile width, with no console errors and no horizontal scroll. The three hub prints and the Cowork-only print are checked. A session round-trips. Screenshots are taken.
- **Workshop dry run:** a partner who has never opened the page can, from a cold start, run the three SMB scenarios in under five minutes, produce the combined customer report, and read a next-best action, its opener and two objection cards aloud.
- **Ship:** step 10 is complete. Both branches are merged and pushed, the home-page card is renamed and dated, and the live page loads after the GitHub Pages cache window (about 10 minutes).
