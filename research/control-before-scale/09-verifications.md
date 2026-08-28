# 09 · Verifications and cross-dossier conflicts

**Checked 2026-08-28 by the lead chat, not by a research agent.** This file exists because
dossiers 01 and 02 reached different confidence levels on the same facts. Anything resolved
here supersedes the dossiers.

---

## V-01 · Purview Suite for Business Premium — RESOLVED at primary source

**Conflict:** Dossier 01 marked the ~$10/user/mo price and the suite's contents as
*unverified* (the announcement blog body would not render). Dossier 02 reported
$10 / $15 combined as *confirmed*. Both flagged "is DSPM for AI actually in it?" as the
highest-value open question in the whole research set.

**Resolution.** Microsoft's own product page —
[microsoft.com/en-us/security/small-medium-business/microsoft-purview-suite-business-premium](https://www.microsoft.com/en-us/security/small-medium-business/microsoft-purview-suite-business-premium),
fetched 2026-08-28 — states verbatim:

| Fact | Microsoft's words | Status |
|---|---|---|
| Price | "$10.00 user/month, paid yearly" | **CONFIRMED [MS-OFFICIAL]** |
| Seat cap | "Maximum of 300 seats" | **CONFIRMED [MS-OFFICIAL]** |
| Base requirement | "Requires a Microsoft 365 Business Premium subscription" | **CONFIRMED [MS-OFFICIAL]** |
| Promotion | "Get 50% off … when you purchase Microsoft 365 Copilot", available "between December 1, 2025 and December 31, 2026" | **CONFIRMED [MS-OFFICIAL]** |

Capabilities Microsoft names on that page: automated data classification, labeling and
protection; sensitive data discovery and data mapping; DLP across apps, devices and cloud
services; automated retention, deletion and records management; insider risk analytics with
adaptive protection; advanced eDiscovery with legal hold; enhanced audit logging with
extended retention; **"policy-based controls for AI experiences and Copilot interactions"**;
communication compliance; Compliance Manager. Plus Message Encryption, Customer Lockbox,
Customer Key, Information Barriers and Privileged Access Management.

**Three things this settles for the guide:**

1. **The $37 stack is real and quotable.** Business Premium + Defender Suite + Purview Suite
   at $22 + $15 combined. Against E5, that is the central licensing argument of the session,
   and it now rests on a Microsoft page rather than on reseller blogs.
2. **DLP for Copilot resolves in Business Premium's favour *via the add-on*.** Dossier 01's
   sharpest finding — that "restrict Copilot from processing files and emails" is **No** for
   both Business Premium and E3 — stands for the *base* SKU. Microsoft's own add-on page
   lists "policy-based controls for AI experiences and Copilot interactions" as included.
   **The mis-sale dossier 01 warns about is selling label-based Copilot exclusion on bare
   Business Premium.** With the Purview Suite attached it is in scope. The guide must state
   the distinction in exactly those terms.
3. **Microsoft is directly funding control-before-scale, and it expires.** 50% off Purview
   Suite when bought with Copilot, through **31 December 2026**. This is the commercial spine
   of the session and it has a deadline that lands four months after the workshop.

### Still open after this check

⚠️ **Microsoft's page does not use the term "DSPM for AI."** CIAOPS
([blog.ciaops.com, 2025-10-08](https://blog.ciaops.com/2025/10/08/microsoft-defender-and-purview-suites-for-m365-business-premium-detailed-breakdown/))
lists DSPM for AI as included; Microsoft's phrasing is "policy-based controls for AI
experiences and Copilot interactions," which is not obviously the same product surface.
Dossier 01 separately found the Purview service description has **no DSPM section at all**,
and that DSPM for AI is now "(classic)" with a new unified DSPM replacing it.

**Do not state on the page that DSPM for AI is included in the Purview Suite for Business
Premium.** Either test it in a live tenant or write it as "Microsoft describes this as
policy-based controls for AI experiences; confirm the specific DSPM surface in the tenant
before scoping." This is the single most likely place for the guide to ship a wrong claim.

### Defender Suite contents — corroborated, not primary-confirmed

CIAOPS lists Entra ID P2, Defender for Endpoint P2, Defender for Office 365 P2, Defender for
Identity, and **Defender for Cloud Apps**. `[COMMUNITY/MVP]` — consistent with dossier 02 but
not read off a Microsoft page. **This matters more than it looks:** dossier 01 established
that Defender for Cloud Apps is absent from Business Premium and E3, and that Office 365
Cloud App Security cannot do gen-AI shadow discovery. If the Defender Suite really does carry
full MDCA, then $15/user/month is the price of shadow AI discovery for an SMB — which is the
answer to the tooling question the whole session turns on. **Verify before it goes in the
guide.**

---

## V-02 · Restricted SharePoint Search — the site carries stale guidance

Dossier 01: new enablement **blocked since 31 July 2026**; Microsoft directs to Restricted
Content Discovery instead
([learn.microsoft.com/sharepoint/restricted-sharepoint-search](https://learn.microsoft.com/en-us/sharepoint/restricted-sharepoint-search), ms.date 2026-07-06).

Site sweep found two hits, both in [`CopilotIB.html`](../../CopilotIB.html) (lines 886, 895–896):

> …tenants most likely to have it enabled are exactly the ones where an agent project is most
> likely to be proposed.

The *check-before-you-build* advice remains correct for tenants where RSS is already on. The
framing — that organisations turn it on because they are worried about oversharing — is now
wrong as forward-looking advice, because they can no longer turn it on.

**Not fixed here.** `DESIGN.md` §8.9 is one file per execution chat, and `CopilotIB.html` is
outside this build's target. **Logged as a fact-delta needing its own small spec.**

Also relevant: any partner playbook whose first move is "enable Restricted SharePoint Search
while we review permissions" is unexecutable as of last month. The new session should say so
explicitly — it is the kind of correction partners will not have picked up.

---

## V-03 · The four-step model may be stale — affects `shadowai.html`

[`shadowai.html`](../../shadowai.html) §3 is built on **Discover → Block → Protect → Govern**
and describes it as "a formal deployment model in Microsoft Purview." Dossier 01 reports
Microsoft's live Copilot methodology is now **Remediate → Guardrails → Regulations**, and
that the Discover article in the older series is stale — still marking Entra Agent ID
"Preview" when it reached GA on 2026-05-01.

**Consequence for this build.** The new session sits directly downstream of `shadowai.html`
§3. If it anchors to the four-step model it inherits the staleness; if it anchors to the new
one it contradicts the sibling page. **This is a decision the spec must force**, not one an
execution chat should improvise. Recommended: the new session leads with the current
Microsoft framing and carries one explicit reconciliation note linking back to
`shadowai.html` §3 — and `shadowai.html` gets its own small fact-delta spec.

---

## V-04 · Cross-dossier conflicts still unresolved

| # | Conflict | Dossier A | Dossier B | Action |
|---|---|---|---|---|
| 1 | E5 list price | 02: $57→**$60** at 1 Jul 2026 | CIAOPS blog (Oct 2025): "~$57" | 02 is newer and specific. Use $60, cite the July 2026 change. |
| 2 | SAM on a Business Premium base | 01: supported base list names O365/M365 E-SKUs, **BP not listed** — flagged as the biggest unresolved risk | 01 also: **one** Copilot licence anywhere unlocks the SAM Copilot feature set | **Unresolved. Test in a tenant.** RCD/DAG/site access reviews on BP is a promise the guide must not make until proven. |
| 3 | Whether the $12 E5 Security add-on and the $10 Defender Suite for BP are the same product | 02 flagged, unresolved | — | Low impact. Note as unverified. |
| 4 | Defender for Cloud Apps standalone price | 02: sources disagree, $3.50 vs $5 | — | **Do not quote.** |

---

## V-05 · Method note

Every currency figure that reaches the page needs this treatment: a primary-source URL, a
fetch date, and an explicit provenance tag. Dossier 03's own finding is the reason — it
caught two "independent" sources (Nuronus and ScalePad's ControlMap) publishing *identical*
figures, meaning they are one source wearing two hats. The same failure mode is live in the
licensing material, where reseller blogs recycle each other's numbers.

**Rule for the build:** a figure corroborated only by resellers is a *community-reported
range*, never a *list price*, no matter how many blogs repeat it.

---

## V-06 · SAM does not run on Business Premium — CONFIRMED, and it breaks the standard playbook

**This is the most consequential finding in the research set.** Dossiers 01 and 05 both
flagged it as their biggest unresolved risk. It is now resolved, against the customer.

**Source.** [learn.microsoft.com/sharepoint/sharepoint-advanced-management-prerequisites](https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-prerequisites)
— `ms.date 2026-06-30`, page updated `2026-08-18`. Fetched 2026-08-28. Verbatim:

> **Microsoft 365 base subscription**
> Your organization must have one of the following base licenses:
> - Office 365 E3, E5, or A5
> - Microsoft 365 E1, E3, E5, or A5
> - Microsoft 365 GCC, GCC-High, or DoD

**Microsoft 365 Business Premium is not on that list.** Neither is Business Standard.

The Copilot-unlock condition is **additional to**, not a substitute for, the base
requirement. The page structures it as two separate gates — a base subscription, *and then*
one of: at least one assigned Microsoft Copilot licence, or SharePoint K/P1/P2 plus the SAM
Plan 1 add-on, or Microsoft 365 E7. Only *restricted site creation by apps* is called out as
still needing SAM Plan 1 on top.

### What this destroys

The standard SMB Copilot-readiness playbook — the one most of the channel is running — is:
*buy one Copilot seat, unlock SAM, run the DAG reports, find the oversharing, remediate it,
then roll Copilot out properly.* **For a Business Premium tenant that sequence does not
execute at all.** Everything in the oversharing toolkit sits behind that base-SKU gate:

- Data Access Governance reports — permission state, site permissions per user, sensitivity
  label snapshot, sharing links activity, **Everyone Except External Users insights**
- Restricted Content Discovery
- Restricted Access Control
- Site access reviews, site ownership policies, site attestations
- Agent access insights, app insights, content management assessment

That is the entire mechanical answer to gap **G2**, and the typical SMB cannot reach it.

### Why this matters more than the price

The `$37 vs $60` licensing argument (V-01) is about *Purview* — labels, DLP, insider risk,
Copilot interaction controls. It is real and it is sellable. **But it does not buy the
oversharing tooling**, and oversharing is the gate. A partner who sells Business Premium +
Purview Suite believing it covers Copilot readiness has covered the data-protection half and
none of the permissions half.

### The workaround, and its open question

The base requirement is written organisation-wide — *"Your organization must have one of the
following base licenses"* — not per-user. That phrasing suggests a mixed tenant carrying a
small number of Microsoft 365 E3 seats may satisfy it, which would make "buy three E3 seats"
a far cheaper path than stepping the whole company up.

⚠️ **Untested. Do not put this in the guide as advice until it is verified in a live
tenant.** It is the highest-value tenant test in the build, and it is exactly the kind of
thing the Customer Zero motion exists to answer — run it on your own tenant first.

### What the guide must therefore do

1. **State the gate plainly**, with the verbatim base-SKU list and the Learn URL. Partners
   are getting this wrong right now.
2. **Split the readiness story in two** — data protection (reachable on Business Premium +
   Purview Suite) and permissions/oversharing (not reachable without an E-SKU base). The
   bridge diagram in gap G1 has to show this seam, because it is where real engagements
   break.
3. **Make the sub-100-seat oversharing answer explicit** given SAM is off the table: native
   SharePoint admin reports, the SharePoint Online PowerShell module, the free tooling from
   dossier 05 (ScubaGear, Maester, Monkey365, Microsoft365DSC), or a third-party platform —
   and note dossier 05's finding that most commercial options carry 100–500 user minimums
   that price out a 78-seat customer.
4. **Re-check Harbor & Vane's design.** The sample company is deliberately on mixed Business
   Standard and Business Premium. That now means it hits this wall — which makes it a better
   teaching asset, not a worse one. The licensing conversation stops being an upsell slide
   and becomes a genuine architectural fork.

### Related, still unverified

Dossier 01 reported that **one** Copilot licence anywhere unlocks the full SAM Copilot
feature set. That is confirmed by this page *conditional on the base SKU*. Dossier 02's
finding that **Restricted Content Discovery requires an assigned Copilot licence in the
tenant** — so oversharing cannot be pre-remediated with RCD before the customer buys Copilot
— is consistent with this page and stands.

---

## V-07 · Dossier 06 contradicts V-06 — V-06 stands

Dossier 06's field lesson #2 reads: *"SharePoint Advanced Management is included with a
Copilot licence — one assigned seat unlocks EEEU insights, permission-state reports, RCD,
RAC, site access reviews… The 'you need E5' objection is dead."*

**That is half the page.** Both V-06 and dossier 06 are reading the same Learn article
(`sharepoint-advanced-management-prerequisites`, ms.date 2026-06-30). The article has **two
gates, in sequence**:

1. `## Microsoft 365 base subscription` — *"Your organization must have one of the following
   base licenses"* → Office 365 E3/E5/A5, Microsoft 365 E1/E3/E5/A5, GCC/GCC-High/DoD.
2. `## Microsoft Copilot or the SharePoint Advanced Management Plan 1 add-on` — one assigned
   Copilot licence, **or** SharePoint K/P1/P2 + SAM Plan 1, **or** Microsoft 365 E7.

Dossier 06 read gate 2 and treated it as the whole requirement. Gate 1 is not optional, and
**Business Premium does not satisfy it.**

**Both statements are true of different customers.** For an E3 or E5 tenant, dossier 06 is
right and the finding is genuinely useful — one Copilot seat unlocks the full oversharing
toolkit and nobody needs to buy E5. For a Business Premium tenant, which is most of the SMB
market this session addresses, it is unreachable at any Copilot seat count.

**Ruling: V-06 governs. The guide states both halves explicitly.** The corrected claim is:

> One assigned Copilot licence unlocks the full SAM oversharing toolkit — **on an E-SKU
> base.** Business Premium and Business Standard do not meet SAM's base-subscription
> requirement, so the standard "buy one Copilot seat and run the DAG reports" sequence does
> not execute in most SMB tenants.

This conflict is itself worth putting in the guide. Dossier 06's own finding was that partner
scripts have not caught up with the SAM entitlement change — and the correction it offers
overshoots in the other direction. A partner reading either version alone mis-scopes the
engagement. **This is the clearest available evidence that the seam in gap G1 is real and
that the channel is currently getting it wrong in both directions.**

---

## V-08 · Research coverage gaps — carry these into the spec

Two limits were hit and both must be disclosed in the finished guide rather than papered over.

| Gap | Detail | Consequence |
|---|---|---|
| **Reddit is unfetchable** | r/msp and r/Office365 hard-block the toolchain. Dossiers 03 and 06 both hit this. Dossier 03 cited **zero** community figures rather than invent them. | The MRR chapter rests on surveys and vendor list prices, not practitioner invoices. Either a human reads those threads or the guide says so. |
| **Dossier 06 §8 — regulated verticals** | WebSearch budget exhausted after 12 searches; only GCC/GCC-H/DoD and education licensing plus the shared-mailbox limitation verified. Bar opinions, HIPAA BAA scope, CMMC and FERPA unverified in that dossier. | Dossier 07 covers much of this ground independently (ABA Formal Opinion 512, CMMC Phase 1, FTC Safeguards, Illinois HB 3773). **Cross-check 06 §8 against 07 before writing; prefer 07.** |

Dossier 06 also flags a §9 table of **eight widely-quoted statistics it could not verify and
recommends not repeating.** That table is a build input, not a footnote — check every stat
proposed for the page against it.

---

## V-09 · Additions from dossiers 10-12 (2026-08-28)

| # | Correction | Consequence |
|---|---|---|
| 1 | **SC-400 retired 2025-05-30** — certification and renewal assessment. **SC-401** replaces it, skills refreshed 2026-07-28, with an explicit "Protect data used by AI services" objective. | "Get your team SC-400" is dead advice and is still being given. |
| 2 | **MS-102 retires 2026-11-30.** | Do not start a junior on it now. Already removed from the Copilot specialization in July 2026. |
| 3 | **There is no AvePoint product called "MaestroBridge."** The name was invented in my own research prompt. **Maestro** is the classification engine inside **Opus**. | Never let it reach the page. |
| 4 | **AvePoint Policies requires M365 E5** for content sensitivity label enforcement, site sensitivity label enforcement and content creation/upload restriction; **Entra ID P1/P2** for inactive guest detection. | AvePoint inherits Microsoft E5 label wall; it does not remove it. Business Premium includes Entra P1, so the guest rule works. |
| 5 | **AvePoint Insights has no documented E-SKU dependency.** | The genuine answer to V-06 for a Business Premium tenant. Verify fidelity in-tenant (TT-4). |
| 6 | **Auto-labeling requires E5 / E5 Compliance / AIP P2.** Microsoft states the symptom for "E3 or Business Premium" explicitly. | Whether the Purview Suite add-on lifts this is **TT-2** and is unresolved. |
| 7 | **a competing distributor funds a $3,000 Purview deployment** at a 15-seat minimum; **50% off Purview Suite for Business Premium**, first-time purchase, expires 2026-12-31. | A distributor has publicly priced the config layer at $3,000. Any larger quote needs a story about the difference. |
| 8 | **CW1226324** — Copilot Chat summarized Drafts and Sent Items despite configured labels and DLP. 2026-01-21, ~4 weeks, NHS affected. | The only incident where the governance work was done correctly and the control plane still failed. |
