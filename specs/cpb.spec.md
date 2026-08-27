# specs/cpb.spec.md

**Target file:** `cpb.html` (9,077 lines, 1.36 MB)
**Branch:** `refresh/cpb`
**Authored:** 2026-08-26, Phase 4
**Depends on:** [`DESIGN.md`](../DESIGN.md), [`RESEARCH-DELTA.md`](../RESEARCH-DELTA.md), [`data/facts.json`](../data/facts.json)

**Decisions this spec implements** (yours, 2026-08-26):
- Opening reframed to *93% still untouched* — structure kept, argument inverted
- `~6.6%` against `~450M+`, with the 464M trade estimate footnoted
- `160%` counter-headline replaced by the **sevenfold 50k+ seat customer growth**
- Your service prices frozen; **Microsoft list prices in scope**; derived scenario arithmetic **flagged, not recomputed**

---

## Execution prompt

> You are applying `specs/cpb.spec.md` to `cpb.html` and **nothing else**.
> - Touch exactly one file. If a change seems to require editing a second file, **stop and report** — do not edit it.
> - For each change: locate the `BEFORE` string, confirm it matches **exactly once**, replace with `AFTER` verbatim. Do not improve, reword, reformat, or restyle anything.
> - If a `BEFORE` string does not match, or matches more than once: **skip that change and report it.** Do not improvise an anchor.
> - Do not introduce any color, font, size, radius, or shadow not in `DESIGN.md`.
> - **Never touch line 1913** (the 546,847-character base64 blob).
> - Commit per change or per small group, message = change ID + one line.
> - Finish by reporting: changes applied, changes skipped and why, and the actual diff stat.

---

## Summary

| | |
|---|---:|
| Changes | **19** (C-09 withdrawn; C-16..C-20 added post-execution) |
| LOW risk (value swap in existing markup) | 6 |
| MED risk (prose rewrite in existing block) | 7 |
| HIGH risk | 1 (C-08) |
| **Diff budget** | **+15 / −23 lines** |

C-08 removes 8 lines net (the third funnel stage and its arrow). Every other change is an in-place replacement.

If insertions exceed 18 or deletions exceed 26, **stop** — something was rewritten that this spec did not authorise.

**Read carefully:** C-08 (HIGH — the only markup change in the spec). Everything else can be approved in a block.

---

# Section A — The Opening Provocation

All of §A lives in one contiguous region, `cpb.html:1500–1640`. Component shells are `DESIGN.md` C11 (dark hero panel), C7 (arithmetic chip), C8 (dark source line), C6 (three-across grid). **No shell markup changes.** Every change below is content inside an existing shell.

---

### C-01 · Invert the headline
**Type:** text-rewrite · **Fact IDs:** `F-005`, `F-060` · **Risk:** MED
**Rationale:** The premise "3% adoption" no longer describes the market. The gap does.
**Design:** No new markup. Text swap inside the existing `1.85rem` provocation headline. Style attributes byte-identical.

```html before:C-01
<p style="margin:0 0 18px;font-size:1.85rem;font-weight:700;color:#fff;line-height:1.3;letter-spacing:-.02em;">3% Copilot adoption.</p>
```
```html after:C-01
<p style="margin:0 0 18px;font-size:1.85rem;font-weight:700;color:#fff;line-height:1.3;letter-spacing:-.02em;">93% of Microsoft 365 seats still have no Copilot.</p>
```

---

### C-02 · Update the numerator
**Type:** value-swap · **Fact IDs:** `F-060` · **Risk:** LOW

```html before:C-02
        <span style="font-size:1.05rem;font-weight:700;color:#fff;letter-spacing:-.01em;">15M</span>
        <span style="font-size:.72rem;color:rgba(255,255,255,.55);">paid Copilot seats</span>
```
```html after:C-02
        <span style="font-size:1.05rem;font-weight:700;color:#fff;letter-spacing:-.01em;">30M+</span>
        <span style="font-size:.72rem;color:rgba(255,255,255,.55);">paid Copilot seats</span>
```

---

### C-03 · Update the result
**Type:** value-swap · **Fact IDs:** `F-005` · **Risk:** LOW
**Note:** The denominator span (`~450M`) is deliberately **unchanged** — see C-04.

```html before:C-03
        <span style="font-size:1.05rem;font-weight:700;color:#a8ecf5;letter-spacing:-.01em;">3.3%</span>
```
```html after:C-03
        <span style="font-size:1.05rem;font-weight:700;color:#a8ecf5;letter-spacing:-.01em;">~6.6%</span>
```

---

### C-04 · Rewrite the source line
**Type:** text-rewrite · **Fact IDs:** `F-005`, `F-006`, `F-021`, `F-033`, `F-034`, `F-052` · **Risk:** MED
**Rationale:** Six facts move at once. The old line claims Microsoft disclosed *both* numerator and denominator in one quarter — no longer true. The `160%` counter-headline was never restated at Q4 and is replaced by the sevenfold enterprise-concentration stat, which is Microsoft-stated and supports the reframed argument.
**Design:** `DESIGN.md` C8 (dark source line). Outer `<p>` attributes and every inner `<span>` signature preserved byte-for-byte. Only prose changes.

```html before:C-04
      <span style="color:rgba(255,255,255,.7);font-weight:600;">Source:</span> Microsoft FY26 Q2 earnings disclosure (Jan 28, 2026) for both numerator and denominator. The 3.3% calculation is independent analyst arithmetic &mdash; <span style="color:rgba(255,255,255,.7);">SAMexpert (Feb 5, 2026)</span>, replicated by <span style="color:rgba(255,255,255,.7);">Stackmatix (Apr 2026)</span> and <span style="color:rgba(255,255,255,.7);">Tony Redmond&rsquo;s Office 365 IT Pros</span>. Microsoft itself has not framed adoption this way; they reported <span style="color:rgba(255,255,255,.7);">+160% YoY paid-seat growth</span>. Same data, different headline &mdash; and the headline is what your customer is reading.
```
```html after:C-04
      <span style="color:rgba(255,255,255,.7);font-weight:600;">Source:</span> Numerator from Microsoft&rsquo;s <span style="color:rgba(255,255,255,.7);">FY26 Q4 earnings disclosure (Jul 29, 2026)</span> &mdash; &ldquo;over 30 million paid seats.&rdquo; Denominator is Microsoft&rsquo;s last stated commercial figure, <span style="color:rgba(255,255,255,.7);">450M+ (Jan 28, 2026)</span>; it has not been restated since, and trade estimates put the current base nearer <span style="color:rgba(255,255,255,.7);">464M</span>, which would read 6.5%. The ratio is analyst arithmetic, not a Microsoft metric. Microsoft&rsquo;s own framing is the opposite of a stall: net seat adds <span style="color:rgba(255,255,255,.7);">more than doubled quarter-over-quarter</span>, and customers buying <span style="color:rgba(255,255,255,.7);">50,000+ seats grew more than sevenfold year-over-year</span>. The seats are moving. The question is whose.
```

---

### C-05 · Rewrite the pivot paragraph
**Type:** text-rewrite · **Fact IDs:** `F-005` · **Risk:** MED
**Rationale:** The old paragraph asks whether the number is *real*. That was the right question at 3.3% and falling behind; at 6.6% and doubling it is the wrong one. The doors below still work — this paragraph is what sets them up.
**Design:** `1.25rem` lede. All style attributes preserved, including the `#a8ecf5` emphasis span.

```html before:C-05
    <p style="margin:0 0 32px;font-size:1.25rem;font-weight:400;color:rgba(255,255,255,.82);line-height:1.5;letter-spacing:-.005em;">So the question on this slide isn&rsquo;t whether the number is real. It is. The question is what it <em>means</em>. Is it because Copilot isn&rsquo;t worth it? Because customers can&rsquo;t find a dollar a day of value in it? <span style="color:#a8ecf5;font-weight:600;">Or are we selling it wrong?</span></p>
```
```html after:C-05
    <p style="margin:0 0 32px;font-size:1.25rem;font-weight:400;color:rgba(255,255,255,.82);line-height:1.5;letter-spacing:-.005em;">Penetration doubled in two quarters. So this isn&rsquo;t a market that won&rsquo;t buy &mdash; it&rsquo;s a market buying fast, in large enterprises, through somebody else. Is that because Copilot isn&rsquo;t worth it in the mid-market? Because SMB customers can&rsquo;t find a dollar a day of value in it? <span style="color:#a8ecf5;font-weight:600;">Or because nobody is running the rollout for them?</span></p>
```

---

### C-06 · Correct the SMB SKU reference in Door 2
**Type:** text-rewrite · **Fact IDs:** `F-003` · **Risk:** MED
**Rationale:** As of 2026-07-01, `$21` is no longer the M365 Copilot Business list price — it is the promotional rate for the *Business Basic + Copilot Business* bundle and it expires 2026-12-31. The standalone Copilot Business promo rate is `$18`. The break-even claim gets *stronger* at $18, not weaker.
**Design:** Content only inside the existing Door 2 body div. `#a8ecf5` emphasis preserved.

```html before:C-06
        <div style="font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.55;">At the new $21 SMB SKU, the break-even is <strong style="color:#a8ecf5;">nine minutes a week</strong>. Not nine minutes a day. Nine. Per. Week. If a knowledge worker can&rsquo;t find that, the price isn&rsquo;t the obstacle.</div>
```
```html after:C-06
        <div style="font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.55;">At the $18 promotional rate on Copilot Business standalone, the break-even is <strong style="color:#a8ecf5;">under eight minutes a week</strong>. Not eight minutes a day. Eight. Per. Week. If a knowledge worker can&rsquo;t find that, the price isn&rsquo;t the obstacle.</div>
```

---

### C-07 · Update the 100-seat walkthrough intro
**Type:** value-swap · **Fact IDs:** `F-060`, `F-006` · **Risk:** LOW

```html before:C-07
      <div style="font-size:.78rem;color:rgba(255,255,255,.6);margin-bottom:16px;line-height:1.5;">Take the 15M / ~450M ratio from above and walk it through what actually happens to a hundred random Microsoft 365 commercial seats.</div>
```
```html after:C-07
      <div style="font-size:.78rem;color:rgba(255,255,255,.6);margin-bottom:16px;line-height:1.5;">Take the 30M / ~450M ratio from above and walk it through what actually happens to a hundred random Microsoft 365 commercial seats.</div>
```

---

### C-08 · Rebuild the funnel as two stages — **HIGH, revised**
**Type:** block-remove + value-swap · **Fact IDs:** `F-005` · **Risk:** HIGH
**Decision:** *You chose option B, 2026-08-26.* **C-09 is withdrawn** and folded into this change. The change ID is retired rather than renumbered so that review comments referencing C-09 still resolve.

**Why the third stage goes.** It read `0.17` of 100 seats "reach power-user productivity." Against the old `3.3`, that implies a power-user rate of `0.17 ÷ 3.3 = 5.15%` of Copilot licensees. **That 5.15% is sourced nowhere in the document and is not in `facts.json`** — it is an assumption. Carrying it forward would have meant either doubling an unsourced number or leaving a stale one between two fresh ones. Both are worse than removing it.

The funnel becomes `100 → 6.6`. It loses the collapse, but the collapse was the part resting on nothing.

**Design:** Grid template changes `1fr auto 1fr auto 1fr` → `1fr auto 1fr`, which is a **genuine markup change** and the reason this is HIGH. Justification: the grid must lose two columns or the two remaining stages will not centre. No new token, color, size, or shadow is introduced — the removed block's `#fbbf24` disappears with it. Indentation of every surviving line is preserved exactly.

```html before:C-08
      <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:14px;align-items:center;">

        <div style="text-align:center;">
          <div style="font-size:2.2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">100</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.4;">Microsoft 365<br>seats (sample)</div>
        </div>

        <div style="font-size:1.4rem;color:rgba(255,255,255,.3);font-weight:300;">&rarr;</div>

        <div style="text-align:center;">
          <div style="font-size:2.2rem;font-weight:700;color:#a8ecf5;line-height:1;letter-spacing:-.03em;">3.3</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.4;">carry a paid<br>Copilot license</div>
        </div>

        <div style="font-size:1.4rem;color:rgba(255,255,255,.3);font-weight:300;">&rarr;</div>

        <div style="text-align:center;">
          <div style="font-size:2.2rem;font-weight:700;color:#fbbf24;line-height:1;letter-spacing:-.03em;">0.17</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.4;">reach power-user<br>productivity</div>
        </div>

      </div>
```
```html after:C-08
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;">

        <div style="text-align:center;">
          <div style="font-size:2.2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">100</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.4;">Microsoft 365<br>seats (sample)</div>
        </div>

        <div style="font-size:1.4rem;color:rgba(255,255,255,.3);font-weight:300;">&rarr;</div>

        <div style="text-align:center;">
          <div style="font-size:2.2rem;font-weight:700;color:#a8ecf5;line-height:1;letter-spacing:-.03em;">6.6</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:6px;line-height:1.4;">carry a paid<br>Copilot license</div>
        </div>

      </div>
```

---

### C-09 · *(withdrawn)*

Folded into C-08 by your option-B decision. **Do not apply. Do not renumber.**

---

### C-10 · Funnel caption — follows C-08
**Type:** text-rewrite · **Fact IDs:** `F-005` · **Risk:** MED
**Rationale:** `about three` → `about seven` is forced by C-08. The `one in six hundred` clause described the stage C-08 removes, so it goes with it. The replacement closing clause carries the reframed argument — where those seats actually went — using the Microsoft-stated sevenfold figure agreed for C-04.
**Design:** Text only inside the existing italic `.86rem` caption. Downgraded from HIGH to MED now that it no longer inherits an unsourced derivation.

```html before:C-10
        Out of any 100 Microsoft 365 commercial seats, about three carry a paid Copilot license &mdash; and barely one in six hundred ever reaches the power-user productivity Microsoft puts on stage at Build.
```
```html after:C-10
        Out of any 100 Microsoft 365 commercial seats, about seven now carry a paid Copilot license &mdash; twice as many as two quarters ago, and overwhelmingly concentrated in the enterprises buying fifty thousand at a time.
```

---

### C-11 · Acquisition market share
**Type:** value-swap · **Fact IDs:** `F-142`, `F-005` · **Risk:** LOW
**Rationale:** `100 − 6.6 = 93.4`. This split is the numeric spine of the reframed opening and lands exactly on the C-01 headline.

```html before:C-11
          <div style="font-size:2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">96.7%</div>
```
```html after:C-11
          <div style="font-size:2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">93.4%</div>
```

---

### C-12 · Rescue market share
**Type:** value-swap · **Fact IDs:** `F-005` · **Risk:** LOW
**Note:** The `Rescue` market **doubled**. The reframed argument makes this the better half of the pitch, not the worse one — twice as many customers have already written a cheque and are at renewal risk.

```html before:C-12
          <div style="font-size:2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">3.3%</div>
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#fbbf24;">Rescue</div>
```
```html after:C-12
          <div style="font-size:2rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-.03em;">6.6%</div>
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#fbbf24;">Rescue</div>
```

---

# Section B — Licensing corrections

---

### C-13 · Correct the M365 Copilot Business SKU line
**Type:** text-rewrite · **Fact IDs:** `F-003` · **Risk:** MED
**Rationale:** Effective 2026-07-01 the SMB lineup changed shape. `$21` is now a promo bundle rate expiring 2026-12-31, not a list price. Two new GA SKUs exist (Business Standard with Copilot `$23.50`, Business Premium with Copilot `$32`) that the document does not mention at all.
**Design:** Content only, inside the existing red-ground comparison row. Grid, background, and `<strong>` signatures preserved byte-for-byte.
**Note:** This row sits in a three-row comparison (Copilot Chat / Copilot Business / M365 Copilot). The `$30` M365 Copilot row below is **verified correct** and is not touched.

```html before:C-13
<strong style="color:#dc2626;white-space:nowrap;">M365 Copilot Business</strong><span>$21/user/mo, SMB-capped at 300 seats, full feature parity with enterprise SKU, promo pricing via M365 Business bundle</span>
```
```html after:C-13
<strong style="color:#dc2626;white-space:nowrap;">M365 Copilot Business</strong><span>$18/user/mo standalone on promo through Dec 31, 2026; 300-seat SMB cap, full feature parity with the enterprise SKU. Since Jul 1, 2026 it also ships bundled &mdash; Business Standard with Copilot at $23.50 and Business Premium with Copilot at $32, both GA and both 300-seat capped</span>
```

---

### C-14 · Agent 365 — remove "forthcoming", add the prerequisite
**Type:** text-rewrite · **Fact IDs:** `F-009`, `F-020` · **Risk:** MED
**Rationale:** Two defects. (1) "forthcoming" describes a product that has been GA since 2026-05-01. (2) Effective 2026-06-01, new Agent 365 purchases require M365 E5/A5/Business Premium, or Defender Suite + Purview Suite. For an SMB audience this changes the deal size and the qualification conversation — it is the difference between a $15 add-on and a $15 add-on with Business Premium underneath it.
**Design:** Content only inside the existing `.82rem` paragraph. The `<strong>` date span is preserved.
**Not touched:** the following paragraph's `$10/user/mo in Tier 3` — that is your service pricing, frozen under `DESIGN.md` prohibition 10.

```html before:C-14
<p style="margin:0 0 8px;font-size:.82rem;line-height:1.6;color:#374151;">Microsoft's forthcoming centralized agent management plane &mdash; GA <strong>May 1, 2026</strong> at a $15/user/mo list price. Agent 365 gives IT and the partner a single console to inventory every agent in the tenant, monitor health and usage, enforce governance policies, and audit activity. It's the governance layer that becomes essential once a customer is running enough agents that manual oversight breaks down.</p>
```
```html after:C-14
<p style="margin:0 0 8px;font-size:.82rem;line-height:1.6;color:#374151;">Microsoft's centralized agent management plane &mdash; GA since <strong>May 1, 2026</strong> at a $15/user/mo list price. Agent 365 gives IT and the partner a single console to inventory every agent in the tenant, monitor health and usage, enforce governance policies, and audit activity. It's the governance layer that becomes essential once a customer is running enough agents that manual oversight breaks down. Qualify early: since June 1, 2026 new Agent 365 purchases require M365 E5, A5, or Business Premium &mdash; or the Defender and Purview suites &mdash; underneath them. Microsoft 365 E7 engagements are unaffected, because E7 already bundles E5, Agent 365, M365 Copilot, and the Entra Suite.</p>
```

---

# Section C — Claim scoping

---

### C-15 · Scope the agent-adoption stat to its source population
**Type:** text-rewrite · **Fact IDs:** `F-139` · **Risk:** MED
**Rationale:** **This corrects an error in my own first Phase 3 read.** I initially flagged this stat as unsourced; it is not — *Inforcer MSP AI Report, 2026* sits directly beneath it in the markup, and its sibling stat (`96%` of MSPs) shares that citation.

The figure is probably right for its own population. The defect is the **wording**: *"of businesses using AI are using agents"* generalises an MSP-panel finding to all businesses. Broad-market 2026 data is far higher — 23% actively scaling agentic AI in at least one function, plus 39% experimenting; PwC puts adoption at 79%. As written, a reader who knows the market will treat the whole stat block as unreliable.

The fix is to scope the sentence, not delete the stat. The citation line below it is **not** touched.

```html before:C-15
        <div style="font-size:.78rem;color:#374151;margin-top:2px;">of businesses using AI are using agents — the Copilot Studio opportunity is even earlier-stage than the license conversation</div>
```
```html after:C-15
        <div style="font-size:.78rem;color:#374151;margin-top:2px;">of MSP-served SMBs using AI have moved to agents — broader-market adoption runs far higher, so in your base the Copilot Studio opportunity is genuinely earlier-stage than the license conversation</div>
```

---

# Section D — found by `check-facts --cascade` after execution

**These five were missed by the spec as approved.** They were caught on the integration branch by `tools/check-facts.py --cascade`, which reported `F-021` and `F-020` as *half-applied* — updated in some files but still literally present in others. That is precisely the failure the tool exists to catch, and it caught it **before merge**.

**Why the Phase 2 sweep missed the biggest one (C-16).** The sweep only registered a numeric hit if a hard external-source signal appeared within ±160 characters of it. In the three-stat tension panel, `3.3%` and its `Microsoft FY26 Q2 Earnings` attribution are separated by four `<div>` elements carrying long inline `style=` attributes. Those attributes are blanked to whitespace by the sweep, but the whitespace still counts toward the window, so the signal fell outside it. `F-021` caught the label; nothing caught the figure beside it.

**Recorded as a limitation of the ledger, not a one-off.** Any future sweep of this file should widen the window, or collapse blanked runs before measuring distance.

---

### C-16 · Second statement of the penetration figure (tension panel)
**Type:** value-swap · **Fact IDs:** `F-005` — **occurrence not in the ledger** · **Risk:** LOW
**Rationale:** An independent restatement of `3.3%` at `3.2rem`, roughly 1,000 lines below the Opening Provocation. Left alone, `cpb.html` would state both `~6.6%` and `3.3%` as the current figure.
**Design:** `#f87171` is on the allow-list (`DESIGN.md` §4.1). No attribute changes.

```html before:C-16
    <div style="font-size:3.2rem;font-weight:700;color:#f87171;line-height:1;letter-spacing:-.04em;margin-bottom:8px;">3.3%</div>
    <div style="font-size:.88rem;font-weight:600;color:#fff;margin-bottom:4px;">Paid Copilot conversion</div>
    <div style="font-size:.76rem;color:rgba(255,255,255,.5);line-height:1.45;">of 450M commercial M365 seats globally</div>
    <div style="margin-top:14px;font-size:.68rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;">Microsoft FY26 Q2 Earnings</div>
```
```html after:C-16
    <div style="font-size:3.2rem;font-weight:700;color:#f87171;line-height:1;letter-spacing:-.04em;margin-bottom:8px;">6.6%</div>
    <div style="font-size:.88rem;font-weight:600;color:#fff;margin-bottom:4px;">Paid Copilot conversion</div>
    <div style="font-size:.76rem;color:rgba(255,255,255,.5);line-height:1.45;">of 450M commercial M365 seats globally</div>
    <div style="margin-top:14px;font-size:.68rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;">Microsoft FY26 Q4 Earnings</div>
```

---

### C-17 · Agent 365 written in the future tense
**Type:** text-rewrite · **Fact IDs:** `F-009`, `F-020` · **Risk:** MED
**Rationale:** *"goes GA on May 1, 2026"* and *"In its Frontier preview"* both describe a product that has been GA for nearly four months. **The spec's out-of-scope table was wrong about this line.** It dismissed the three remaining `$15` references on the grounds that the price was confirmed unchanged. The price is unchanged; the *tense* is not, and C-14 only fixed the definition site.

```html before:C-17
  <p>Agent 365 — Microsoft's centralized AI agent control plane — is available at <strong>$15/user/month</strong> and goes GA on May 1, 2026. In its Frontier preview, early adoption data showed rapid agent proliferation across enterprise tenants &mdash; underscoring the governance challenge your customers will face.
```
```html after:C-17
  <p>Agent 365 — Microsoft's centralized AI agent control plane — has been GA since <strong>May 1, 2026</strong> at <strong>$15/user/month</strong>, and since June 1, 2026 new purchases require M365 E5, A5, or Business Premium underneath them. Early adoption data showed rapid agent proliferation across enterprise tenants &mdash; underscoring the governance challenge your customers will face.
```

---

### C-18 · E7 priced "TBD" in the SKU table
**Type:** value-swap · **Fact IDs:** `F-049`, `F-007` · **Risk:** LOW
**Rationale:** E7 is GA and priced at `$99/user/mo` — verified, and stated correctly elsewhere in this same file. `TBD` is now simply wrong.

```html before:C-18
  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-weight:700;">TBD (GA May 1, 2026)</td>
```
```html after:C-18
  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-weight:700;">$99/user/mo (GA May 1, 2026)</td>
```

---

### C-19 · E7 priced "TBD" in the SKU ladder
**Type:** value-swap · **Fact IDs:** `F-049`, `F-007` · **Risk:** LOW
**Design:** `DESIGN.md` C13 — `.sku-price` content only.

```html before:C-19
        <div class="sku-price">TBD — GA May 1, 2026</div>
```
```html after:C-19
        <div class="sku-price">$99/user/mo — GA May 1, 2026</div>
```

---

### C-20 · Stale arithmetic in an HTML comment
**Type:** value-swap · **Fact IDs:** `F-005`, `F-060` · **Risk:** LOW
**Rationale:** Invisible to readers, but it is the maintainer's note explaining the block directly beneath it, and it now describes arithmetic the block no longer performs. The Phase 2 sweep blanks comments by design, so this was never registered.

```html before:C-20
    <!-- Where the number comes from: 15M / 450M = 3.3% -->
```
```html after:C-20
    <!-- Where the number comes from: 30M / 450M = ~6.6% -->
```

---

## Out of scope — flagged, not changed

Recorded here so a later reader knows these were seen and deliberately left alone.

| Location | Item | Why untouched |
|---|---|---|
| `cpb.html:8050`, `:8054` | `50 users × $21/user/month × 12 = $12,600/year` (`F-042`) | Derived scenario arithmetic resting on a Microsoft price. `DESIGN.md` prohibition 10: **flag, do not recompute.** Changing the total would cascade into `$106,470` (`F-041`), the `$32K/$12.6K` ratios (`F-043`, `F-091`), and your frozen service pricing. **Needs a separate decision.** |
| `cpb.html:6133`, `:6245`, `:8019`, `:8068` | Four further `$21` occurrences (`F-003`) | Same reason. All sit inside scenario arithmetic rather than SKU description. C-13 fixes the one place the SKU is *defined*. |
| `cpb.html:4997` | `$10/user/mo in Tier 3` | Your service pricing. Frozen. |
| `cpb.html:6097`, `:6894`, `:8008` | Three further Agent 365 `$15` references | Price is confirmed unchanged; only the *prerequisite* is new, and C-14 adds it at the point of definition. |
| Throughout | Forrester / IDC benchmark set (`F-001` `$8.45`, `F-015` `$95.60`, `F-024` `$45.30`, `F-027` `353%`, `F-078` `$10.93`) | **Unverified** — confirming study editions needs Forrester/IDC access. See `RESEARCH-DELTA.md` §8. No change until verified. |
| `cpb.html:1913` | base64 blob | Prohibited. |

---

## Verification

After execution, on branch `refresh/cpb`:

```bash
git diff --stat main -- cpb.html
```

Expect `1 file changed, ~16 insertions(+), ~16 deletions(-)`. C-14 and C-13 lengthen their lines; no net line-count change is expected from any change in this spec, because every one is an in-place replacement.

```bash
git diff main -- cpb.html | grep -c '^[+-]' 
```

Should be ≤ 34 (16 pairs plus the diff header lines). Anything higher means unauthorised edits.

```bash
grep -c 'base64' cpb.html
```

Must return `1`, and `git diff main -- cpb.html | grep -c base64` must return `0`.
