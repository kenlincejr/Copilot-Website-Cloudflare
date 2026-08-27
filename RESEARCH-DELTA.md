# RESEARCH-DELTA.md — Phase 3 output

**Researched 2026-08-26.** No file in the web root was opened for writing.
Verified values are written into [`data/facts.json`](data/facts.json) as `new_value` / `source_url` / `as_of` / `status`. The original `value` field is left untouched — it records what the site still says.

**This is your gate.** Section 1 is a narrative decision only you can make. Sections 2–6 are corrections that follow from it.

---

## 1. THE NARRATIVE CALL — the Opening Provocation has inverted

### What changed

Microsoft reported FY26 Q4 on **29 July 2026**. From the Microsoft newsroom, verbatim: *"Microsoft 365 Copilot reached over 30 million paid seats."* Nadella on the call: *"We now have over 30 million paid Microsoft 365 Copilot seats."*

| | Q2 FY26 (Jan 28) | Q3 FY26 (Apr 29) | **Q4 FY26 (Jul 29)** |
|---|---|---|---|
| Paid Copilot seats | 15M | 20M+ | **30M+** |
| Penetration | 3.3% | ~4.4% | **6.5% – 6.7%** |
| Where the site says it | `cpb.html`, `ledger.html` | `customer-zero-starter-kit/index.html` | *nowhere* |

**Your ~6.6% is right.** It sits exactly between the two defensible denominators.

### The denominator needs care

This is the part I'd push back on if you asked me to just swap the number in.

Microsoft has **not restated the commercial seat count since "over 450 million" at FY26 Q2 (28 Jan 2026)**. The ~464M figure circulating for Q4 is Office 365 IT Pros applying a ~3% quarterly increase to that number. It is a trade estimate, not a disclosure.

- `30M ÷ 450M` = **6.7%** — Microsoft-stated denominator, but seven months stale, so it *overstates* penetration
- `30M ÷ 464M` = **6.5%** — more accurate, but the denominator is an analyst estimate

The current block's entire credibility rests on the line *"Microsoft FY26 Q2 earnings disclosure for both numerator and denominator."* You cannot keep that sentence and use 464M.

**My recommendation:** present it as **~6.6%** against **~450M+**, with the source line rewritten to say the numerator is Microsoft-disclosed (Q4, 29 Jul 2026) and the denominator is Microsoft's last stated figure (Q2, 28 Jan 2026), noting that trade estimates put the current base nearer 464M, which would yield 6.5%. That is honest about both halves, keeps the arithmetic chip's structure identical, and the ~6.6% headline survives either way.

### Why this is a narrative problem, not a value swap

The Opening Provocation opens with **"3% Copilot adoption."** as a standalone headline, then argues: *the number is real, the question is what it means — is Copilot not worth it, or are we selling it wrong?* Three doors: two closed, one open.

At 6.6% that argument weakens, and at the *trajectory* it partly collapses:

- Penetration **doubled in two quarters**. That is not a story about a market that won't buy.
- Microsoft's Q4 framing is the opposite of a stall: net seat adds **more than doubled quarter-over-quarter**; customers buying **50,000+ seats grew more than sevenfold year-over-year**; enterprises deploying to a majority of their workforce grew **~75% quarter-over-quarter**. Nadella: *"What used to be months is days from when a license is bought."*
- **The `160% YoY` counter-headline (F-052) is gone.** Microsoft did not restate a YoY seat-growth percentage at Q4. The paragraph's rhetorical pivot — *"Same data, different headline"* — has no headline to pivot to unless you substitute one of the framings above.

There is still a real provocation here, but it is a *different* one. Roughly: **93% of the M365 commercial base still has no Copilot — and the seats that are moving are moving into large enterprises, seven times faster than a year ago. The SMB base is where the gap is, and it is not closing on its own.** That reframes from "nobody is buying" to "everybody is buying, and none of them are your customers yet" — which is a sharper sell for an SMB-partner audience, and it does not require you to argue against Microsoft's own momentum.

### What you need to decide

1. **Does the Three Doors opening stay, invert, or get rewritten?** This is not something a spec should decide.
2. **Which denominator framing** (my recommendation above, or 6.5% / 464M with an analyst attribution).
3. **What replaces the `160%` counter-headline** — the sevenfold enterprise stat, the doubled net adds, or nothing.

Until 1–3 are answered I will not write `specs/cpb.spec.md`, because roughly a third of its changes depend on the answers.

### Anchors bound to this decision — 13 across 3 files

| Fact | Site says | Verified | Files |
|---|---|---|---|
| F-060 | `15M` | **30M+** | cpb |
| F-005 | `3.3%` | **~6.6%** | cpb, ledger |
| F-006 | `450M` | ~450M stated / ~464M est. | cpb, ledger, starter-kit |
| F-021 | `FY26 Q2` | **FY26 Q4** | cpb, ledger |
| F-034 | `Jan 28, 2026` | **Jul 29, 2026** | cpb, ledger |
| F-033 | `Feb 5, 2026` (SAMexpert) | recheck — tied to 3.3% | cpb, ledger |
| F-052 | `160%` YoY | **no Q4 restatement** | cpb, ledger |
| F-018 | `20M` | **30M+** | starter-kit |
| F-016 | `4.4%` | **~6.6%** | starter-kit |
| F-022 | `FY26 Q3` | **FY26 Q4** | starter-kit |
| F-031 | `Apr 29 2026` | **Jul 29 2026** | starter-kit |

Plus `cpb.html`'s *"Apply the math to a sample of 100 seats … take the 15M / ~450M ratio from above"* walkthrough, which is arithmetically bound to whatever you choose.

---

## 2. SMB pricing — the playbook's core motion is priced wrong

**Effective 1 July 2026** (Microsoft Partner Center announcements, July 2026), the SMB Copilot lineup changed shape entirely:

| Offer | Price | Status |
|---|---|---|
| M365 **Business Standard with Copilot** | **$23.50**/user/mo | GA, 300-license max, annual |
| M365 **Business Premium with Copilot** | **$32**/user/mo | GA, 300-license max, annual |
| M365 **Copilot Business** standalone | **$18**/user/mo | after 15% promo, extended to **31 Dec 2026** |
| M365 **Business Basic + Copilot Business** | **$21**/user/mo | after 25% promo, **Jul 2026 – 31 Dec 2026** |

The site (F-003) says: *"M365 Copilot Business $21/user/mo, SMB-capped at 300 seats, full feature parity with enterprise SKU, promo pricing via M365 Business bundle."*

That is **no longer a list price**. $21 is now specifically the promotional price of the *Business Basic + Copilot Business* bundle, and it expires 31 December 2026. The standalone Copilot Business promo price is **$18**.

**This cascades into your scenario arithmetic.** `50 users × $21/user/month × 12 = $12,600/year` (F-042) still computes, but it now describes a promo bundle with an expiry date rather than a durable SKU. Downstream: F-041 (`$106,470` IDC theoretical max), F-043 (`$12.6K` ratio denominators), F-091 (`$32K`).

**Prices are frozen per your Phase 2 decision, so I did not touch any of this.** But note the distinction: your *service* prices are frozen; these are *Microsoft's* license prices, and they are registered facts. Flagging so you can rule explicitly — I read the freeze as covering your price sheet, not Microsoft's list prices, but the scenario arithmetic sits on the boundary.

### Also new, and genuinely useful to you

**"Copilot in 30"** — a CSP partner-led trial: a 25-user, 30-day M365 Copilot Business trial for organisations under 300 employees, **available in CSP from 1 August 2026**. Microsoft's framing is "a structured way to drive engagement, generate pipeline, and support customers moving from evaluation to deployment."

This is net-new content, and it lands almost exactly on top of the playbook's *"Give Us an Hour. Build a Practice. Own the Account."* section. It is the strongest single addition the research turned up. **Recommend a block insert; needs your call on placement.**

---

## 3. Agent 365 — price holds, prerequisite is new and material

`cpb.html` (F-009) says Agent 365 is *"GA May 1, 2026 at a $15/user/mo list price"* and describes the console. Price and date **confirmed**. But:

> Effective **1 June 2026**, new Agent 365 purchases require one of: Microsoft 365 **E5/A5/Business Premium**; or Microsoft Defender Suite **and** Microsoft Purview Suite (incl. Edu and FLW variants). Customers without them may not have access to certain Agent 365 capabilities.

The site states no prerequisite. For an SMB-focused playbook this is the difference between "a $15 add-on" and "a $15 add-on that requires Business Premium underneath it" — which changes the deal size and the qualification conversation. **Recommend a block insert, not a value swap.**

Microsoft 365 **E7 engagements are unaffected**, because E7 already bundles E5 + Agent 365 + M365 Copilot + Entra Suite.

---

## 4. Microsoft 365 E7 — the site is right, and one framing is wrong

| Claim | Verdict |
|---|---|
| F-049 `$99`/user/mo | **CONFIRMED** |
| F-007 / F-020 GA `May 1, 2026` | **CONFIRMED** — via EA, EAS, MCA-E, and CSP |
| F-090 M365 Copilot `$30`/user/mo | **CONFIRMED** |

Bundle economics check out: E5 ($60) + Copilot ($30) + Entra Suite ($12) + Agent 365 ($15) = $117 à la carte against $99 for E7, ≈ $18/user/mo saved.

**One correction.** `cowork.html` describes E7 as *"Frontier preview today; GA May 1, 2026."* It has been GA since 1 May 2026 — nearly four months. The parenthetical needs to go.

**FY27 E7 promotions now exist** and the site mentions none: 10% off 1-yr (10–9,999 seats), 15% off 1-yr (100+), 15% off 3-yr (300+), all live May 2026 – **31 Dec 2026**.

---

## 5. cowork.html — the most stale page on the site

Confirmed as predicted in `FACTS.md` §9. Its byline reads `Last updated: April 22, 2026`; its framing is Frontier-preview throughout. Since then:

| Date | What happened |
|---|---|
| **16 Jun 2026** | **Copilot Cowork reached general availability** and moved to **usage-based billing**. Tenants with a user active in the Frontier program between 30 Mar and 16 Jun 2026 had a billing grace period to 1 Jul 2026. |
| Jun–Jul 2026 | GA worldwide: multi-model support, new plugins, updated skill management and navigation, **Microsoft Purview integration**, branded templates, image creation |
| Jun 2026 | **Anthropic Claude Fable 5 (preview)** available as an opt-in, admin-controlled model in Cowork (Frontier) |
| Jul 2026 | Claude added as an option in **Copilot Chat** for active subscribers; Tasks tab; auto-install of the M365 Copilot app resumes on eligible commercial Windows devices |
| Aug 2026 | Cost Management updates in the M365 admin center — Copilot Credits visibility, overage handling, policy enforcement |

**The billing model is entirely absent from the site.** Cowork now bills in **Copilot Credits at $0.01 each**, with a typical task running **$0.70 – $15**. Admin controls include spending limits, usage alerts, user-level controls, reporting, and prepaid plans.

For a playbook whose whole thesis is managed services and cost governance, consumption billing on Cowork is not a footnote — it is a service line. `cowork.html` also still names **Opus 4.7** as the model (F-019, Apr 16 2026); Fable 5 is now the preview model in Frontier.

**Recommend `cowork.html` gets the first spec after the penetration cluster**, and that its "What changed in the last 90 days" section be rewritten rather than patched — the 90 days it describes ended four months ago.

---

## 6. FY27 partner program — `frontier.html` needs real work

Effective 1 July 2026:

- **Designation badges consolidated from six to three** — AI Business Solutions, Cloud & AI Platforms, Security. **Qualification requirements are unchanged**; the six solution paths remain the basis for scoring and specializations. This is a presentation change, and the site should not describe it as more than that.
- **Microsoft Copilot specialization → renamed "Microsoft 365 Copilot specialization"**, with substantive changes:
  - Performance now measures **paid M365 Copilot monthly active usage (MAU) only**
  - **MS-102 removed**; **APL-4002** and **APL-7008 retired**
  - New requirements: **AB-100** (Agentic AI Business Solutions Architect), **AB-620** (AI Agent Builder Associate)
  - **Customer references replaced by a third-party capabilities audit**, valid two years
- **SMB track eligibility expanded** — the Azure consumed revenue threshold is removed for the three solution paths feeding Cloud & AI Platforms. Partners with ≥80% of customers in SMC-C/SMB now qualify for the SMB track. *Directly relevant to the playbook's audience.*
- **CSP growth margins launch 1 October 2026** — more margin for new-to-offer, seat expansion, and adoption across select AI workloads. Sandbox available now.
- **Frontier Accelerate for Marketplace**, September 2026 — unifies ISV Success, Marketplace Rewards, Azure IP co-sell, certified software designations.
- Benefits renewal moves to an **AD-30 window**; specialization benefits expire with their parent designation.
- Copilot Studio designation pathway: **2 new customer deployments, minimum $10,000 TTM each**.

`frontier.html`'s FY25/FY26 program content (F-014 `$4,875` designation cost, F-092 `$350` Partner Launch Benefits, F-045 `$18,750` MCI on $500K CSP revenue, F-047/F-048/F-095 Azure credit tiers) was **not** individually re-verified against FY27 — the July announcements do not restate those figures, and confirming each needs Partner Center access I don't have. **Flagged, not cleared.** Treat every FY25/FY26-dated program figure in `frontier.html` as unverified until someone checks it in Partner Center.

---

## 7. Unsourced claims — verdicts

`FACTS.md` §8 flagged three stat-block figures with no attribution. Results:

| Fact | Claim | Verdict |
|---|---|---|
| **F-139** | *"Only 9% of businesses using AI are using agents"* | **SUPERSEDED — remove or replace.** 2026 data: 23% actively scaling agentic AI in at least one function, +39% experimenting (62% at least experimenting); PwC puts adoption at 79%. The 9% figure reads as 2024/2025 vintage and understates the market by roughly an order of magnitude. The argument it supports — *"the Copilot Studio opportunity is even earlier"* — does not survive it. |
| **F-130** | *"51% increase in Azure revenue for designation earners"* | **UNVERIFIABLE.** No public Microsoft source found. |
| **F-141** | *"96% year-over-year growth … partners with Azure certifications"* | **UNVERIFIABLE.** No public Microsoft source found. |

F-130 and F-141 sit adjacent in the same stat block. Either you have an internal Microsoft partner deck they came from — in which case they need that attribution visible — or they should be softened to qualitative language. As bare percentages with no source, in a document that elsewhere shows its arithmetic, they are the weakest markup on the site.

---

## 8. What Phase 3 did not clear

Being explicit about the edges of this sweep:

- **`frontier.html` FY25/FY26 program dollar figures** — flagged, not verified (§6).
- **Forrester / IDC benchmark set** — F-001 `$8.45`, F-015 `$95.60`, F-024 `$45.30`, F-027 `353%` ROI, F-064 `$19.7M` NPV, F-078 `$10.93`. These cite study editions (Forrester TEI FY2025, IDC #US52483124, a July 2023 predecessor). Confirming whether newer editions exist needs access to the Forrester/IDC properties themselves. **Unverified.**
- **The remaining 16 unsourced claims** from `FACTS.md` §8 beyond the three in §7.
- **The TD SYNNEX 2.6× Cowork multiplier** — still not present anywhere on the site. If it goes in, it is net-new content, and open question #6 (public vs. internal) applies before it is written, not after.
- **F-038** (`95%` of legacy competency partners without a Solutions Partner designation, TD SYNNEX internal, FY25) — internal data, not externally checkable, and now two fiscal years old. Given §6's expanded SMB eligibility, this number has probably moved. Worth an internal refresh.

---

## Sources

- [Microsoft — Cloud and AI strength fuels fourth quarter results (29 Jul 2026)](https://news.microsoft.com/source/2026/07/29/microsoft-cloud-and-ai-strength-fuels-fourth-quarter-results-4/)
- [Microsoft Investor Relations — FY26 Q4 press release & webcast](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast)
- [Microsoft Learn — Partner Center announcements, July 2026](https://learn.microsoft.com/en-us/partner-center/announcements/2026-july)
- [Office 365 IT Pros — FY26 Q4 Microsoft results (30 Jul 2026)](https://office365itpros.com/2026/07/30/fy26-q4-microsoft-results/)
- [Office 365 IT Pros — Microsoft FY26 Q2 results: 450 million Microsoft 365 seats](https://office365itpros.com/2026/01/30/microsoft-fy26-q2-results/)
- [UC Today — Microsoft 365 Copilot passes 30 million paid seats](https://www.uctoday.com/unified-communications/microsoft-365-copilot-passes-30-million-paid-seats-as-cloud-and-ai-growth-power-record-quarter/)
- [Digital Applied — Microsoft FY26 Q4: Copilot momentum and capex optics](https://www.digitalapplied.com/blog/microsoft-fy26-q4-earnings-copilot-arr)
- [Microsoft Community Hub — What's new in Microsoft 365 Copilot, July 2026](https://techcommunity.microsoft.com/blog/microsoft365copilotblog/what%E2%80%99s-new-in-microsoft-365-copilot--july-2026/4538332)
- [Microsoft Community Hub — MCAPS Start for Partners: FY27 benefits updates](https://techcommunity.microsoft.com/blog/partnernews/partner-blog--mcaps-start-for-partners-turn-fy27-benefits-updates-into-customer-/4544439)
- [Neowin — Copilot Cowork now generally available with usage-based billing](https://www.neowin.net/news/microsofts-copilot-cowork-now-generally-available-with-usage-based-billing/)
- [Quisitive — Copilot Cowork pricing 2026: how usage-based billing works](https://quisitive.com/copilot-cowork-pricing-2026-how-usage-based-billing-works/)
- [SAMexpert — Microsoft 365 E7: $99 bundle breakdown](https://samexpert.com/microsoft-365-e7-licensing-guide/)
- [A Guide to Cloud & AI — What's new in Microsoft 365 Copilot, August 2026](https://www.aguidetocloud.com/blog/microsoft-365-copilot-august-2026-updates/)
- [Prefactor — AI agent adoption statistics (2026)](https://prefactor.tech/learn/ai-agent-adoption-statistics)
