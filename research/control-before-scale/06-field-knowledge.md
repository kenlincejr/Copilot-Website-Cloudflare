# Tribal Knowledge: What the Field Actually Learned

**Research dossier — 28 August 2026**
Scope: the governance-before-Copilot journey as practised on real SMB tenants (25–300 seats). Failure modes, objections, sequencing arguments, and the people worth following.

## How to read the source tags

| Tag | Meaning |
|---|---|
| `[MS-OFFICIAL]` | learn.microsoft.com, adoption.microsoft.com, microsoft.com/insidetrack, WorkLab. Page date given. |
| `[MVP/EXPERT]` | named MVP, architect or analyst writing under their own name. |
| `[PRACTITIONER-FORUM]` | vendor/MSP practitioner content, LinkedIn posts, podcasts, conference material. Directional, not audited. |
| `[PRESS/RESEARCH]` | trade press or analyst research. |
| `[UNVERIFIED]` | could not reach a primary source. Flagged explicitly, do not repeat as fact. |

**Standing caveats on this dossier.**

1. **The web-search budget for this session ran out partway through.** Sections 1–7 are built on fetched primary pages. **Section 8 (regulated verticals) is thin and largely unverified** — I could not run the searches needed to confirm bar-association opinions, HIPAA BAA scope, CMMC assessor guidance or FERPA positions. Treat §8 as a research gap with a to-do list, not as findings.
2. **Reddit is not fetchable** by this toolchain (r/msp, r/Office365, r/sysadmin all blocked at the crawler). Every claim below that a "practitioner forum says X" is sourced from a *reachable* practitioner venue — LinkedIn, vendor blogs, podcasts, conference sites — not from Reddit. Where I say something is a "widely-repeated field observation," that means I found it independently in three or more places by different authors, not that I counted forum posts.
3. **A large fraction of the "Copilot statistics" content on the open web in 2026 is SEO filler** that cites other SEO filler. I have excluded numbers I could not trace to a named analyst house, a named survey, or a Microsoft page. Several eye-catching figures that circulate in partner decks are listed in §9 as *unverified and probably not safe to quote*.

---

## 1. The oversharing problem: what it actually looks like

### 1.1 The one fact everyone converged on

The single most-repeated sentence in this entire body of literature, in a dozen phrasings by a dozen authors, is that **Copilot does not create the exposure, it reveals it**.

- Nikki Chapple, dual Microsoft MVP (M365 + Security), Principal Cloud Architect at CloudWay: "Copilot doesn't create a data problem. It exposes one." — *Container Sensitivity Labels: The Purview "Hack" That Fixes Copilot Oversharing Fast*, 16 May 2026, https://nikkichapple.com/m365-copilot-oversharing-container-labels/ `[MVP/EXPERT]`
- Amy Babinchak, 22-time Microsoft MVP and an SMB-practice owner: the situation "isn't a bug; it's a data management failure and we are all guilty of it." — *Copilot Didn't Overshare Your Data. Your Permissions Did*, Petri, 7 July 2026 (updated 27 Aug 2026), https://petri.com/copilot-didnt-overshare-your-data-your-permissions-did/ `[MVP/EXPERT]`
- Tracy van der Schyff, MVP: "Copilot isn't the risk, the oversharing is." — *Oversharing in the Age of Copilot*, 8 Jan 2026, https://tracyvanderschyff.com/2026/01/08/oversharing-in-the-age-of-copilot-your-datas-worst-enemy/ `[MVP/EXPERT]`
- Robert Crane (CIAOPS, MVP, Australian SMB/MSP specialist): "Copilot is not creating that problem. It is simply making it harder to ignore." — *Data Governance Is the Real Copilot Readiness Test*, 27 Aug 2026, https://blog.ciaops.com/2026/08/27/data-governance-is-the-real-copilot-readiness-test/ `[MVP/EXPERT]`
- Microsoft's own Learn documentation makes the same point structurally: "All Microsoft 365 Copilot prompts run in the security context of the user who initiates the prompt." — https://learn.microsoft.com/en-us/purview/dlp-microsoft365-copilot-location-learn-about (ms.date 10 June 2026) `[MS-OFFICIAL]`

**Field lesson:** this is a *convergent* observation, not one person's story. It is safe to build a practice narrative on it. But see §4.10 — partners routinely draw the *wrong* conclusion from it.

### 1.2 The framing that lands best with a non-technical owner

Andrew McAllister (CoreView) calls it **"the end of security by obscurity"** — the point being that the permission sprawl was always there, but nobody could exploit it because nobody had a search box that returned synthesised answers across every library in the tenant. *Best Practice for a Microsoft Copilot Readiness Assessment*, 26 Aug 2026, https://www.coreview.com/blog/best-practice-for-a-microsoft-copilot-readiness-assessment `[PRACTITIONER-FORUM]`

Tracy van der Schyff's version is the historically-literate one and is very effective with anyone who has been on M365 for a decade: this is Delve all over again. Delve caused exactly this panic in 2015 — surfacing documents users technically had rights to but nobody expected to see — and the remedy then was the same as now (fix permissions, not the feature). `[MVP/EXPERT]`

### 1.3 The four patterns, and what turns up

Every serious write-up lands on effectively the same shortlist of causes:

1. **"Everyone except external users" (EEEU)** applied to sites that were never meant to be tenant-wide.
2. **Broken permission inheritance** at library and folder level.
3. **"Anyone" / organisation-wide sharing links**, frequently long-expired in intent but not in configuration.
4. **Legacy "All Staff" security groups** and permissions retained through role changes and leavers.

Microsoft's own remediation guidance names the same set: the SAM Content Management Assessment is described as identifying "sites with oversized audiences, EEEU usage, broken inheritance, inappropriate sharing, and those that are inactive or ownerless." — https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot (ms.date 17 April 2026) `[MS-OFFICIAL]`

### 1.4 What actually got surfaced — the documented incidents

The canonical published account is **Business Insider, November 2024**, reporting that customers deploying Copilot discovered employees could read executives' inboxes and sensitive HR documents; the report includes a Microsoft employee's line that once an ordinary employee starts Copilot, "they can see everything." Microsoft's position in that story was that lax customer data-governance models were the cause, not Copilot. Some companies delayed deployment as a result. Mirror/summary: https://yro.slashdot.org/story/24/11/21/2315249/microsoft-copilot-customers-discover-it-can-let-them-read-hr-documents-ceo-emails `[PRESS/RESEARCH]`

This is *the* story partners cite. It is worth knowing that it is a single journalistic account with anonymous sourcing that has since been repeated thousands of times, sometimes with the anonymity stripped off and the anecdote hardened into "Microsoft admitted." **Cite it as reported, not as established.**

Beyond that, the honest position is: **published, named, verifiable "Copilot caused an HR incident at named company X" case studies essentially do not exist.** Nobody publishes them. What circulates instead is (a) the Business Insider story, (b) vendor scenario-writing dressed as case studies, and (c) partner anecdote. I searched specifically for named incidents and found only the first two. Partners should be candid about this in the room rather than implying a body of case law that isn't there — the honest line is "these don't get published, and that's exactly why you should assume it's happening."

### 1.5 Numbers on prevalence — use with care

| Claim | Source | Verdict |
|---|---|---|
| 16% of business-critical data in the average M365 tenant is overshared | Concentric AI 2025 Data Risk Report, cited by Amy Babinchak on Petri (7 Jul 2026) | Traceable to a named vendor research report via an MVP. The Concentric landing page 404'd on fetch. Cite as "Concentric AI's 2025 research, as cited by Babinchak." `[PRESS/RESEARCH]` |
| Microsoft's DSPM default risk assessment runs weekly over "the top 100 SharePoint sites based on usage" | https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing (ms.date 1 May 2026) | Verified `[MS-OFFICIAL]` |
| "150–300 overshared sites per tenant," "80% of tenants audited had material exposure," "40–60% of sites have an oversharing pattern" | EPC Group marketing page | **Do not use.** Self-published vendor claim, no methodology, no sample definition. `[UNVERIFIED]` |

### 1.6 How partners actually find it — and the mechanics that bite

The current Microsoft-native discovery path is: **Purview DSPM data risk assessments** + **SharePoint Advanced Management (SAM) Content Management Assessment** + the **Data Access Governance (DAG) reports** (EEEU insights, sharing links, permission state, sensitivity label coverage). All confirmed on Learn.

Three mechanics that trip up first-time engagements, all from the primary docs:

- **DSPM item-level scanning is capped at 10 SharePoint sites** at a time, OneDrive is not supported for item-level scanning at all, and there's a 200,000-item-per-location ceiling with accuracy warnings above 100,000. The *default* assessment also has a **4-day delay before first results appear**, and a custom assessment's results don't refresh — you must run a new one. https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing `[MS-OFFICIAL]`
- **Restricted Content Discovery (RCD) requires a reindex.** Tony Redmond: "SharePoint sets a site-level property that causes index updates for every file in the site." Microsoft warns that sites over 500,000 items "could take more than a week to fully process." — https://office365itpros.com/2025/04/02/restricted-content-discovery-works/, 2 April 2025 `[MVP/EXPERT]` For a 60-seat firm this is minutes; for a 250-seat firm with a decade of scanned PDFs it is not.
- **DLP for Copilot has holes that matter.** Microsoft states plainly that DLP "can't scan the contents of files that you upload directly into prompts," and that content excluded from a response summary "could be available in the citations of the response." Policy changes take up to four hours to take effect. https://learn.microsoft.com/en-us/purview/dlp-microsoft365-copilot-location-learn-about `[MS-OFFICIAL]`

**Field lesson:** the tooling produces a finding list fast and a *fixed tenant* slowly. Sell the two separately.

---

## 2. Documented failure modes

### 2.1 The pilot that never scales

The most-cited hard number in the whole space comes from Gartner's 2025 Microsoft 365 and Copilot survey (n=187 IT and CSS leaders): of organisations that had *finished* a Copilot pilot, only **5%** said they were moving to a larger deployment in 2025. A related widely-circulated pairing — **60% started a Copilot project, 6% moved past pilot** — is attributed to Gartner via Computerworld, June 2024, and is quoted by both CoreView and QueryNow.

- CoreView, 26 Aug 2026: quotes "60% of IT leaders started a Copilot project and only 6% moved past the pilot." https://www.coreview.com/blog/best-practice-for-a-microsoft-copilot-readiness-assessment `[PRACTITIONER-FORUM]`
- QueryNow, *Past the Stall*, 11 June 2026, attributes to Gartner/Computerworld June 2024: 60% started pilots; 6% to large-scale deployment; **72% of IT leaders said employees struggle to integrate Copilot into daily routines**; **40% reported rollout delays of three months or more due to data oversharing**. https://www.querynow.com/resources/whitepapers/past-the-stall-m365-copilot-rollouts `[PRACTITIONER-FORUM]`
- Gartner's own document listings confirm the survey exists: *Key Insights From the 2025 Microsoft 365 and Copilot Survey* (https://www.gartner.com/en/documents/6548002) and *The Top 10 "Gotchas" of Copilot for Microsoft 365* (https://www.gartner.com/en/documents/5339563) `[PRESS/RESEARCH]`

**Caution for the guide:** the 5% and the 6% are from different surveys a year apart and are frequently conflated. If you use one, say which. The Gartner reports themselves are paywalled; every partner deck quoting them is quoting a secondary source.

CoreView additionally claims its own research found **67% of organisations have cancelled or delayed rollouts**. Vendor-owned, methodology not published. `[PRACTITIONER-FORUM]`

### 2.2 The month-three collapse

This is the field observation with the best MVP corroboration, and it is *not* primarily a governance failure — it's an enablement failure.

Tony Redmond, writing a script to find underused Copilot licences: "enthusiasm remains high for the initial period but can tail off after a few weeks if people don't discover a sweet spot." He scores accounts across seven Copilot-enabled apps over a 90-day window and treats a score above 30 as underused, against a **$360/user/year** cost. — *Practical Graph: Finding and Removing Underused Microsoft 365 Copilot Licenses*, Practical365, 29 Jan 2025, https://practical365.com/microsoft-365-copilot-licensing/ `[MVP/EXPERT]`

Robert Crane names the pattern precisely — **the quiet failure**: "turning on a licence is the easy part," but "access does not change behaviour." There is no dramatic failure event, just "mounting costs alongside persistent manual workarounds." His remedy list is role-specific scenarios, internal champions, follow-up sessions, clear boundaries, and regular usage reviews — "deliberate rhythm rather than one-time rollout." He also observes that visible manager usage moves adoption more than launch emails: "People copy what leaders value." — https://blog.ciaops.com/2026/08/28/the-real-copilot-risk-is-not-the-technology/, 28 Aug 2026 `[MVP/EXPERT]`

Crane's companion post is the SMB economics: for an SMB, Copilot licensing "competes directly with other expenses," so adoption has to be justified on measured business outcomes rather than demonstrated functionality. — *Cost And ROI Are Still The Biggest AI Blocker*, 25 Aug 2026 `[MVP/EXPERT]`

**Field lesson:** the governance motion and the adoption motion fail independently. A partner who fixes permissions and walks away still loses the customer at month three, because the seats go quiet and the invoice doesn't.

### 2.3 Unused seats

Numbers here are poor quality. Figures circulating in 2026 include "64% of licences idle," "only 20–30% of purchased seats used weekly," and "IDC 2026: 49% of organisations had at least 10% of Copilot seats unused." **None of these traced to a reachable primary source in this research.** They appear on SEO/SaaS-management vendor blogs citing each other. `[UNVERIFIED]` — flagged in §9.

What *is* defensible: Redmond's method (score by inactivity across the Copilot-enabled apps over 90 days) and his practical caution — check context before reclaiming, because "a user might not have been able to use Microsoft 365 Copilot because they were ill or on an extended vacation," and tell people before you take the licence away.

### 2.4 "We turned it on for everyone on day one"

I could not find a *named* published post-mortem of a day-one-for-everyone rollout. What exists is the aggregate signal: the Business Insider account of delayed deployments (§1.4), the Gartner 40%-delayed-by-oversharing figure, and Microsoft's own decision to publish a blueprint whose **Step 1 is "Remediate oversharing"** with an explicit "apply interim Copilot protections" stage. Microsoft does not write a three-pillar remediation blueprint for a problem nobody had.

### 2.5 The readiness assessment that is really a lead magnet

The sharpest critique of partner practice I found is from Chris Wetzel on LinkedIn (~April 2026): "A readiness assessment completed in a week is not a readiness assessment. It's a lead generation tool with a deliverable attached." His argument: the typical MSP offer is 20–40 hours over one week covering licence audit, tenant health and a high-level SharePoint review, while the actual remediation for a mid-size org is **200–400 hours**, and the ongoing governance layer that stops the problem recurring is outside every contract's scope. He names the specific omissions: permission inheritance across 200+ sites, expired sharing links with no controls, "Teams memberships from 3 years ago that nobody revoked." https://www.linkedin.com/posts/chris-wetzel_the-copilot-readiness-assessment-your-msp-activity-7453068859261177858-YFs3 `[PRACTITIONER-FORUM]`

This is one person's post, not a survey — but it is the most useful single piece of self-criticism in the field, and it maps directly onto the MRR argument the practice guide needs to make. **The assessment is not the product. The recurring remediation-and-drift-control is the product.**

---

## 3. Sequencing lessons

### 3.1 Microsoft's own published order

The Learn blueprint (*Configure a secure and governed foundation for Microsoft Copilot*, ms.date 17 April 2026; overview page ms.date 6 May 2026) is now unambiguous, and it settles the "label everything vs restrict search first" debate in favour of **restrict first**:

**Step 1 — Remediate oversharing**
1. *Identify*: Purview DSPM data risk assessments + SAM Content Management Assessment.
2. *Apply interim Copilot protections*: enable **RCD** to exclude sensitive sites from Copilot discovery; configure **DLP for Copilot** to exclude sensitive content from grounding. Validate via Purview auditing.
3. *Fix access and permissions*: site sensitivity labels, remove anonymous/excessive access, rescope links, SAM site access reviews delegated to site owners, fix broken inheritance, assign owners.
4. **"Remove interim Copilot protections once access and permissions are remediated."**

**Step 2 — Set up guardrails**: secure defaults at provisioning (RAC by default for business-critical sites; disable/restrict company-wide sharing groups and Anyone links at tenant level; require site sensitivity labels at provisioning), then auto-labelling, DLP-for-Copilot policies, Insider Risk Management with Adaptive Protection, then continuous validation via DSPM Activity Explorer and risk assessments.

**Step 3 — Meet regulations**: Compliance Manager gap assessment, audit-log and Copilot-interaction retention decisions, eDiscovery over Copilot data, then data hygiene (SAM inactive-site policies, M365 Archive, retention/deletion to improve answer quality).

Sources: https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance and https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot (both authored by denisebmsft). Blueprint PDF/PPT at https://aka.ms/Copilot/SecureGovernBlueprintPDF and https://aka.ms/Copilot/SecureGovernBlueprintPPT `[MS-OFFICIAL]`

**This is the single most important sequencing artefact in the dossier.** The interim-protections-then-remove pattern gives a partner a defensible way to say yes to "can we just turn it on" without saying yes to exposure. It is also the strongest available answer to a customer who does not want a six-month project.

### 3.2 Microsoft's internal deployment — what Microsoft IT actually did

*How we're tackling Microsoft 365 Copilot governance internally at Microsoft*, Microsoft Digital / Inside Track, **7 May 2026**, https://www.microsoft.com/insidetrack/blog/how-were-tackling-microsoft-365-copilot-governance-internally-at-microsoft/ `[MS-OFFICIAL]`

Eight chapters, in order: enable self-service workspace creation with accountability → establish **container labels** (four tiers: Public, General, Confidential, Highly Confidential) → **derive file labels from containers** → train employees → "trust but verify" with Purview DLP automation → lifecycle management with **six-month attestation** → enable company-shareable links (to reduce oversharing while keeping collaboration working) → extract inventory via Microsoft Graph Data Connect to detect oversharing.

Two details a partner should carry into every room:

- **Microsoft caps its own labelling taxonomy at 5×5** (five labels, five sublabels). If the world's largest M365 tenant runs four container tiers, a 60-seat firm does not need eleven labels.
- Microsoft's stated stance is that **thoughtful defaults do the work** — the blog credits automated DLP with catching roughly 99% of governance needs through smart defaults. Quoted principle from Brian Fielder, VP Microsoft Digital, on data integrity determining the integrity of the AI transformation.

### 3.3 Container labels before file labels — the strongest expert position

Nikki Chapple's argument is the clearest statement of the "where partners over-engineer" problem. Her order:

1. Define risk-based collaboration scenarios.
2. Create container label policies for Teams/Groups/SharePoint.
3. Apply labels at workspace creation, going forward.
4. Bulk-apply to existing workspaces (she publishes PowerShell for this).
5. *Then* item-level labels for content protection.

Her framing: "The workspace becomes the security boundary." Oversharing "begins at workspace creation through overly permissive defaults," so a file-level taxonomy applied to open workspaces protects nothing. — https://nikkichapple.com/m365-copilot-oversharing-container-labels/ (16 May 2026), with companion how-tos at /configure-container-sensitivity-labels-microsoft-365/ (15 May 2026), /how-do-i-add-sensitivity-labels-to-your-existing-groups-teams-and-sites/ and /microsoft-purview-dlp-copilot-genai-setup-guide/ (both 16 May 2026). `[MVP/EXPERT]`

Note that this matches Microsoft's *internal* order exactly (containers first, file labels derived from containers) but is slightly ahead of the *published* blueprint, which puts site sensitivity labels inside the remediation step and auto-labelling in guardrails.

### 3.4 The menu of restriction options and their trade-offs

Maarten Eekels' comprehensive guide (30 Dec 2024, updated 5 June 2025, https://www.eekels.net/microsoft-365-copilot-and-the-content-discoverability-challenge/) lays out seven controls in increasing intrusiveness — user reporting mechanism → search exclusion for whole sites/libraries → **RCD** → **Restricted SharePoint Search** (curated allow-list, capped at 100 sites) → site access restriction policies → DAG reports plus owner-led access reviews → sensitivity labels. His trade-off note is the useful bit: hard search exclusion is strong but breaks search and dependent web parts; RCD is the "slightly less intrusive" middle; Restricted SharePoint Search is a "rigorous" *interim* measure while you audit permissions. He also documents odd behaviour where "prevent connected experiences" label settings produced incomplete Copilot responses while the documents still appeared in results. `[MVP/EXPERT]`

**Field lesson on Restricted SharePoint Search specifically:** the 100-site allow-list makes it viable for a 60-seat firm and unviable for a 250-seat firm with 400 sites. Partners should size this before promising it.

### 3.5 A pragmatic SMB order (synthesis)

Where the reachable sources agree, in this order:

1. **Discover before you promise anything.** DSPM default assessment + SAM Content Management Assessment + DAG EEEU/sharing-links/permission-state reports. Budget four days for the first DSPM results.
2. **Tenant-level defaults, immediately.** Kill Anyone links, restrict company-wide sharing, set default link type. Cheap, fast, reduces new inflow. Van der Schyff's list; Microsoft's guardrails step.
3. **Interim containment on the worst sites.** RCD (and/or Restricted SharePoint Search if the site count fits) on HR, finance, legal, M&A, board. Babinchak's step 1 is literally "restrict Copilot from known sensitive areas."
4. **Container labels with a tiny taxonomy** — three or four tiers, applied at provisioning and bulk-applied to existing workspaces.
5. **Owner-led access reviews** on the flagged sites — delegated via SAM site access review, not done by the MSP by hand. This is the step partners most often try to absorb themselves and shouldn't.
6. **Ownership and lifecycle**: site ownership policy, inactive-site policy, attestation. All included with a Copilot licence (§4.2).
7. *Then* Copilot enablement for a named cohort with role-specific scenarios.
8. *Then* file-level auto-labelling, DLP-for-Copilot refinement, IRM, retention. **This is the deferrable tier.**

### 3.6 Where partners over-engineer, and where they under-do it

**Over-engineered** (widely observed): a full sensitivity-label taxonomy with sublabels and encryption before day one; a records-retention schedule as a Copilot prerequisite; boiling the ocean on information architecture. Microsoft's own 5×5 cap and four-tier container model are the counter-evidence.

**Under-done** (widely observed): tenant-level sharing defaults; site ownership (ownerless sites are in every finding list and nobody wants to own them); *removing* the interim protections after remediation — Microsoft explicitly instructs this and it is the step most likely to be forgotten, leaving a customer paying for Copilot that can't see half their content and concluding Copilot is useless; and continuous drift control, which is the entire MRR argument.

Billy Peralta's checklist (14 April 2026, https://www.billyperalta.com/blog/sharepoint-copilot-readiness-checklist/) puts permissions and oversharing first — "the most important first step" — before use cases or demos, then content cleanup, information architecture, ownership, then business-critical sites. His line: if the environment is messy, "Copilot will not magically fix it." `[MVP/EXPERT]`

---

## 4. The objections, and the answers that work

### 4.1 "We're too small for this"

**Answer.** Size doesn't change the mechanics; it changes the blast radius in the other direction. A 60-person firm has *one* payroll spreadsheet and *everyone knows whose it is*. The counter-move that works is to stop arguing about size and run the discovery — the DSPM default assessment covers the top 100 sites by usage, which for a sub-300-seat tenant is usually the whole tenant. Show them their own EEEU report.

### 4.2 "We already have security — we bought Business Premium"

**Answer, and this is a genuinely important 2026 correction.** Two things changed that most partner scripts haven't caught up with:

- **SharePoint Advanced Management is included with a Microsoft Copilot licence.** If the org assigns *at least one* Copilot licence, SharePoint admins get the SAM feature set — including EEEU insights, permission state reports, sharing links report, site access review, RCD, Restricted Access Control, block download, content management assessment, site ownership/inactive-site/attestation policies, catalog management and change history. The only named exclusion is *restricted site creation by apps*, which still needs the SAM Plan 1 add-on; the *Sensitivity labels for files* DAG report still requires E5/G5. — https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license (ms.date 30 June 2026) `[MS-OFFICIAL]`

So the honest answer is: Business Premium gives you identity, device and threat controls; it does not give you *data access governance*. But you don't need E5 to get the governance tooling — one Copilot licence unlocks SAM tenant-wide. **Flagged as outdated belief:** Billy Peralta's otherwise-good April 2026 checklist positions SAM as "optional for smaller organizations… larger enterprises benefit more." That was fair when SAM was a paid add-on. It is no longer the right advice for anyone buying Copilot. Partner scripts still saying "SAM is an E5/add-on thing" should be corrected.

### 4.3 "This is just you selling us more licences"

**Answer.** Invert it. The most credible move available in 2026 is to show that the governance tooling is *already paid for* the moment they buy one Copilot seat (§4.2), and that your first deliverable is a finding list from tools they already own. Then price the remediation and the ongoing drift control — which is labour, not licence. Chris Wetzel's critique (§2.5) is the reason this objection exists at all: partners earned it by selling week-long assessments as products.

### 4.4 "Our staff already use ChatGPT and it's fine"

**Answer.** This is the objection with the best Microsoft-published ammunition. Work Trend Index 2024 (8 May 2024, https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part `[MS-OFFICIAL]`): three-quarters of knowledge workers use generative AI; **78% bring their own AI tools to work**; **52% are reluctant to admit using AI for important tasks**; **60% of leaders worry their organisation lacks a plan**; only 39% of AI users have had any company training.

The reframe that lands: "It's not fine, it's invisible. Your people are already doing the thing you're worried about, on tools you can't audit, and half of them won't tell you. Copilot is the version of this you can see." Purview DSPM's Activity Explorer has an AI activities tab that records when a user browsed to a generative-AI site and whether prompts/responses contained sensitive information — that report *is* the demo. https://learn.microsoft.com/en-us/purview/data-security-posture-management-learn-about (ms.date 1 May 2026) `[MS-OFFICIAL]`

### 4.5 "Can't we just turn Copilot on and see?"

**Answer.** Yes — with interim protections, which is exactly what Microsoft tells you to do. Quote the blueprint: identify the high-risk sites, apply RCD and DLP-for-Copilot as *temporary* controls, enable for a cohort, then remediate and remove the temporary controls. This converts an argument into a plan and takes days, not months. It also removes the partner's worst look — the one where governance is a gate the customer has to pay to pass.

### 4.6 "Our data isn't sensitive"

**Answer.** Don't argue. Run the assessment and let the DSPM output name the sensitive information types it found. Every SMB has payroll, employment contracts, disciplinary notes, bank details, a shareholders' agreement and at least one folder from a deal that didn't happen. The move is to ask the owner a single discovery question (§5.2) rather than to assert.

### 4.7 "We don't have time for a six-month project"

**Answer.** Agree with them. Split it: containment in week one (tenant sharing defaults + RCD on the worst sites), findings in week two, remediation as a scoped, owner-led programme over a quarter, drift control as a monthly service. The QueryNow whitepaper's structure is the same shape — two-to-three sprints per workflow cluster, cohort-scoped rather than tenant-wide, with adoption gates between. `[PRACTITIONER-FORUM]`

### 4.8 "The last MSP said we were fine"

**Answer.** They probably were fine *for the threat model that existed*. Nothing about the permissions was dangerous while there was no tool that could traverse them at speed. This is the "end of security by obscurity" line — it lets the incumbent off the hook, which is what makes it usable in the room without turning the conversation into a fight the customer doesn't want.

### 4.9 "Why pay monthly for governance when it's a one-time cleanup?"

**Answer.** Because permissions are not a state, they're a flow. Microsoft's own internal answer is **six-month container re-attestation** plus continuous DSPM validation — for a company with the world's best-instrumented tenant. CoreView's framing: governance is "an ongoing discipline" rather than a one-time audit, addressing organisational drift. Chris Wetzel's framing: the governance layer that prevents recurrence "remains outside any contract scope" — which is precisely the gap the MRR fills. And the mechanical argument: every new Team, every new project site, every new starter and leaver re-creates the condition you just paid to fix.

### 4.10 "Microsoft says Copilot respects existing permissions, so we're covered"

**This is the most valuable objection to be able to answer, and it is the one where a widely-repeated partner belief is dangerously incomplete.**

The statement is true and is not a defence. Microsoft's wording — every prompt runs in the security context of the initiating user — is a statement about *access control*, not about *exposure*. It guarantees Copilot won't show a user anything they couldn't already reach; it guarantees nothing about whether what they can reach is what you intended. The whole industry's convergent finding (§1.1) is a restatement of exactly this gap.

Three supporting mechanics to have ready:
- Permission-respecting does not mean discovery-limited: **RCD exists** precisely because "the user technically has access" was not a satisfactory answer. It "does not change the site's permissions" — it changes discoverability. https://learn.microsoft.com/en-us/sharepoint/restricted-content-discovery `[MS-OFFICIAL]`
- Even with DLP for Copilot excluding an item from a summary, "the item could be available in the citations of the response."
- DLP cannot inspect files a user uploads directly into a prompt.

**Second, related, commonly-wrong belief to flag:** that RCD or Restricted SharePoint Search is a *security* control. It is not. RCD does not remove content from the index and does not stop eDiscovery, auto-labelling, or direct access to the file by URL. Redmond's post documents Microsoft's own documentation contradicting itself on whether RCD affects enterprise search, which is a fair indicator of how well-understood this is. Partners who sell RCD as "we've locked HR down" have mis-sold it.

---

## 5. The conversation itself

### 5.1 How to open it without sounding like a fear pitch

The consistent advice across the SMB-facing sources is: **open on the AI conversation the customer is already having, and let governance be the thing that unblocks it.**

Robert Crane's positioning is the sharpest: for MSPs, treat governance consulting as "prerequisite advisory work, not a barrier to sales," and use Copilot readiness as the *trigger* for an information-governance conversation the customer would never have bought on its own. He also names the emotional problem with the whole motion — "nobody celebrates prevention" — which is exactly why the pitch cannot be prevention-shaped. `[MVP/EXPERT]`

His companion insight for the adoption half: **"Copilot Needs a Job Before It Needs a Licence"** (26 Aug 2026) — users need "draft weekly customer follow-ups," not a feature tour. `[MVP/EXPERT]`

Tracy van der Schyff's technique is disarmament through history — she opens by being *amused* rather than alarmed, and drops the Delve comparison. For a nervous owner, "we've seen this exact movie before and here's how it ended" is far more effective than a breach statistic.

### 5.2 Discovery questions that work

Assembled from the reachable sources (Inforcer's five foundational questions, 30 April 2025, https://www.inforcer.com/insights/how-to-assess-copilot-readiness `[PRACTITIONER-FORUM]`; Crane; Peralta; CoreView) and reframed for a non-technical decision-maker:

- "If I gave every employee a search box that could read everything they're technically allowed to read and write you a summary — what's the first document you'd worry about?" *(This is the one that lands. It is not a security question; it's a naming question, and the owner always has an answer.)*
- "Who owns the HR folder? Not who uses it — who *owns* it?"
- "When someone leaves, who removes their access, and how do you know it happened?"
- "How many people in this business could open the payroll file today if they went looking?"
- "Which of your staff are already using ChatGPT, and would they tell you?"
- "If a client's lawyer asked what your AI tool did with their file, who answers?"

### 5.3 The demo that changes the conversation

Three candidates, in ascending order of effect:

1. **The EEEU / sharing-links report** from SAM DAG, shown as a raw list of their own site names. Concrete, unarguable, no product pitch attached.
2. **The DSPM Activity Explorer AI-activities view** — showing that staff are already pasting into public generative-AI sites. This is the shadow-AI moment. It converts an abstract worry into a named behaviour in their own building.
3. **A live prompt in a pilot tenant**, asked in the room by the *owner*, not the partner — something like "summarise our compensation approach." Note the ethical and practical guardrail: do this in a controlled cohort with interim protections already in place, and never surface a real employee's data to an audience. Several practitioners describe this as the moment the conversation turns; none of them publish it as a script, for obvious reasons. `[PRACTITIONER-FORUM]` / partly `[UNVERIFIED]`

### 5.4 Who must be in the room

Convergent, though rarely stated as a list in one place:

- **The owner or MD** — because this is a risk-appetite decision and a spending decision, not an IT decision.
- **The operations lead** — because they own the site structure and will be asked to nominate site owners.
- **HR** — because HR's content is the first thing that surfaces and HR carries the employment-law consequence. Also because HR usually owns the acceptable-use policy that has to be updated.
- **Whoever holds legal** — in an SMB this is usually outside counsel, which means an email, not a chair. Get their position on client-confidentiality and on retention of Copilot interactions *before* enablement, because Purview lets you decide retention of Copilot interactions and eDiscovery over them, and that decision is very hard to make retroactively. https://learn.microsoft.com/en-us/purview/retention-policies-copilot `[MS-OFFICIAL]`
- **A named champion per function** — Crane's point; adoption is a behavioural programme.

### 5.5 Avoiding the fear-based pitch

Three practical rules the sources support:

- **Lead with the customer's own data, not with statistics.** Every borrowed number is arguable; their EEEU list is not.
- **Give them a fast yes.** The interim-protections path (§4.5) means you never have to be the person who says "not yet."
- **Name what you are not selling.** Say out loud that the assessment is not the product and that a week-long assessment doesn't fix anything — Wetzel's critique is public, and pre-empting it buys more credibility than it costs.

---

## 6. What Microsoft itself has published as lessons

| Artefact | What it is | Date | URL |
|---|---|---|---|
| **Secure & Governed Data Foundation blueprint** | Three pillars: remediate oversharing / set up guardrails / meet regulations. PDF + PPT. The single most useful partner-facing artefact. | ms.date 6 May 2026 | https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance · https://aka.ms/Copilot/SecureGovernBlueprintPDF |
| **Configure a secure and governed foundation** | The step-by-step version of the above, with the interim-protections pattern. | ms.date 17 Apr 2026 | https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot |
| **Inside Track: Microsoft's own Copilot governance** | Microsoft Digital's eight-chapter internal deployment. Container labels, 5×5 taxonomy cap, six-month attestation, Graph Data Connect inventory. | 7 May 2026 | https://www.microsoft.com/insidetrack/blog/how-were-tackling-microsoft-365-copilot-governance-internally-at-microsoft/ |
| **Copilot Success Kit** | Adoption planning checklist, Scenario Library, Viva enablement, business-leader engagement guide, technical readiness, UX strategy, stakeholder worksheet, licence allocation guide. Technical Readiness Guide, Implementation Summary for Leaders and User Enablement Guide all refreshed **23 Feb 2026**. | ongoing | https://adoption.microsoft.com/en-us/copilot/success-kit/ |
| **Copilot Success Kit for SMB** | The SMB cut: Implementation Guide, Quick Start for Users, **IT Controls Guide**, Checklist for Success, onboarding email templates, **Data Readiness Blueprint**, Agent Getting Started Guide. Explicitly phase-based. | ongoing | https://adoption.microsoft.com/en-us/copilot/smb/success-kit/ |
| **Scenario Library** | Role- and function-specific scenarios (incl. HR). The antidote to feature-tour demos. | ongoing | https://adoption.microsoft.com/en-us/scenario-library/ |
| **Work Trend Index 2024** | 78% BYOAI, 52% won't admit AI use, 60% of leaders lack a plan. Still the best shadow-AI ammunition. | 8 May 2024 | https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part |
| **Work Trend Index 2025 — "The Year the Frontier Firm Is Born"** | Annual report. | 23 Apr 2025 | https://www.microsoft.com/en-us/worklab/work-trend-index |
| **Work Trend Index 2026 — "Agents, Human Agency, and the Opportunity for Every Organization"** | Current annual report. I could not fetch the detail pages before the search budget ran out; **headline statistics unverified**. | 5 May 2026 | https://www.microsoft.com/en-us/worklab/work-trend-index |
| **DSPM data risk assessments** | The oversharing discovery engine and its limits. | ms.date 1 May 2026 | https://learn.microsoft.com/en-us/purview/data-security-posture-management-oversharing |
| **SAM features in Copilot licences** | The entitlement table that kills the "you need E5" objection. | ms.date 30 June 2026 | https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license |
| **Microsoft Zero Trust Assessment** | Referenced from the blueprint as related guidance. | — | https://microsoft.github.io/zerotrustassessment/guide |

Microsoft Tech Community carries two further oversharing posts (*Mitigate Oversharing to Govern Microsoft 365 Copilot and Agents*, /4448744; *From Oversharing to Optimization*, /4357963; *Microsoft deployment blueprint – Address oversharing concerns*, /4434598). **These pages render client-side and could not be fetched** — the titles and URLs are confirmed from search indexes, the contents are not. `[UNVERIFIED contents]`

**The lesson Microsoft has clearly internalised:** its own published order is *contain first, remediate second, label comprehensively third*. Its own internal deployment is *containers before files, tiny taxonomy, defaults over policing, attestation forever*. Both cut against the way most partners scope this work.

---

## 7. Community centres of gravity

**People to follow, with what they're actually good for:**

| Person | Role | Best for | Where |
|---|---|---|---|
| **Nikki Chapple** | Dual MVP (M365 + Security), Principal Cloud Architect, CloudWay | Container labels, Purview DLP for Copilot and third-party GenAI, the data readiness checklist. The most rigorous sequencing writer in the space. | https://nikkichapple.com · RunAs Radio #1013 (rec. 7 Nov 2025, aired 3 Dec 2025) https://runasradio.com/Shows/Show/1013 · speaks at ECS/ESPC, https://sessionize.com/nikkichapple/ |
| **Joanne C Klein** | MVP, Purview specialist | Retention vs sensitivity labels, retention schedules for AI-readiness, the Copilot blueprint from a records angle. *A Contrast and Comparison of Retention and Sensitivity Labels* (30 Jul 2026) is the one to send a confused customer. | https://joannecklein.com |
| **Tony Redmond** | MVP, Office 365 for IT Pros | The sceptical technical read: RCD mechanics, underused-licence hunting, agent sprawl. Writes the post that says the feature doesn't do what the marketing says. | https://practical365.com · https://office365itpros.com |
| **Amy Babinchak** | 22-time MVP, SMB practice owner | The SMB/MSP voice on Petri. Practical remediation order, EchoLeak/CVE-2025-32711 context. | https://petri.com |
| **Robert Crane (CIAOPS)** | MVP, Australian SMB/MSP | The best day-to-day SMB-MSP writing on Copilot readiness *and* adoption economics. Near-daily posts, plus monthly M365 webinars with slides on GitHub. | https://blog.ciaops.com · https://directorcia.gumroad.com (Copilot Readiness Assessment, MSP AI Playbooks, M365 CSP IT Pro material) |
| **Tracy van der Schyff** | MVP | Change-management and human framing; the Delve parallel. | https://tracyvanderschyff.com |
| **Maarten Eekels** | MVP/architect | The definitive menu of Copilot discoverability controls and their trade-offs. | https://www.eekels.net |
| **Billy Peralta** | Practitioner/architect | SharePoint-side readiness checklists and SAM review guidance. Useful, but check the SAM licensing claim (§4.2). | https://www.billyperalta.com |
| **Sara Fennah** | MVP, adoption/change | Adoption and change-management side of Copilot; regular ECS/ESPC speaker. **Not verified in this pass** — I could not fetch her current site before the search budget ran out. `[UNVERIFIED]` |
| **Chris Wetzel** | Practitioner | The self-critique of MSP readiness assessments. One post, high value. | LinkedIn (URL in §2.5) |
| **Lewis Baybutt** | Practical365 author | Agent inventory and Copilot Studio governance — the next problem after this one. | https://practical365.com |

**Venues:**

- **Practical365** (articles + podcast) and **Office 365 for IT Pros** — the technical centre of gravity for M365 governance.
- **Petri** — where the SMB/MSP-flavoured analysis lands.
- **Microsoft Tech Community**, Microsoft 365 Copilot blog and the SharePoint blog — first publication for feature and blueprint news. Also the Message Center archive at https://mc.merill.net (Merill Fernando) for tracking changes like MC1259825 (site-admin control for RCD).
- **ESPC / European Collaboration Summit** — ESPC26 at RAI Amsterdam, **30 Nov – 3 Dec 2026**; ~1,800 attendees, 100+ speakers, explicit tracks on "Microsoft 365 governance in an AI and Agent world," data hygiene and records management for AI, and Copilot adoption. https://espc.tech/conference/espc/ This is the single best place to meet the people in the table above in one week.
- **RunAs Radio** — the readiness-checklist episode (#1013) is a good thing to send a customer's IT lead.
- **r/msp, r/Office365, r/sysadmin, MSPGeek** — named in the brief and genuinely where MSPs argue this out, but **not reachable by this toolchain**. Flagged as an unclosed research gap; a human should read them directly.

---

## 8. Regulated verticals in SMB — RESEARCH GAP

**This section is incomplete.** The web-search budget was exhausted before this thread could be run, and a subagent dispatched to cover it returned nothing for the same reason. What follows is what I could verify from Learn pages already fetched, plus an explicit to-do list. **Do not build slides from this section as it stands.**

**Verified:**

- **Government clouds.** Microsoft Copilot is available in **GCC, GCC High and DoD** as an add-on to M365 G3/G5/F1, Office 365 G1/G3/G5/F3, and the Exchange/SharePoint/OneDrive/Project/Visio plans. — https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-licensing (ms.date 19 May 2026) `[MS-OFFICIAL]`
- **SAM in government clouds.** The full SAM-with-Copilot feature table (EEEU insights, RCD, RAC, permission state reports, site access review, block download, etc.) is marked **Yes for WW, GCC, GCC-H and DoD**. Two exceptions: *Sensitivity labels for files* report requires E5/G5, and *advanced tenant renaming* is unavailable in GCC/GCC-H/DoD. — https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license (ms.date 30 June 2026) `[MS-OFFICIAL]`
- **Education.** An academic Copilot offering exists for faculty, staff and students aged 13+, on M365 A1/A3/A5 and Office 365 A1/A3/A5, purchased through EES or a CSP. Same source. `[MS-OFFICIAL]`
- **Legal-hold / discovery mechanics that matter to every regulated vertical.** Purview supports retention policies for Copilot interactions (https://learn.microsoft.com/en-us/purview/retention-policies-copilot) and eDiscovery search over Copilot data (https://learn.microsoft.com/en-us/purview/edisc-search-copilot-data). The blueprint's Step 3 explicitly instructs deciding audit-log retention and Copilot-interaction retention "based on legal risk or regulatory requirements." `[MS-OFFICIAL]`
- **Mailbox scope limitation with vertical consequences.** Copilot supports only primary mailboxes on Exchange Online — **not archive mailboxes, not group mailboxes, not shared or delegate mailboxes**. https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements (ms.date 26 Aug 2026) `[MS-OFFICIAL]` This matters enormously for small law firms and medical practices, which run on shared mailboxes (info@, referrals@, billing@). A partner who promises "Copilot will summarise your intake inbox" to a 12-partner law firm is promising something that does not work.

**Reasoned, not verified — flag every one of these before use `[UNVERIFIED]`:**

- Law firms: client-confidentiality duties and the "did you disclose AI use to the client" question; whether any bar association has issued a Copilot-specific opinion. Also matter-level information barriers — an ethical-wall problem that maps onto Restricted Access Control, but I have not confirmed anyone doing it that way in practice.
- Medical practices: whether Copilot is in scope of Microsoft's HIPAA BAA, and what that covers.
- Financial advisors: SEC/FINRA books-and-records treatment of Copilot prompts and responses as business communications — this is the retention-policy decision above, but with a regulator attached.
- Defence suppliers: CMMC Level 2 assessment treatment of Copilot; whether GCC High is required rather than commercial for CUI; how RCD/RAC map to CUI enclave patterns.
- Schools: FERPA and student-data handling; whether the A-SKU academic offering carries different grounding restrictions.

**Where the premium and the urgency plausibly are** (partner-strategy reasoning, not sourced): the verticals where *the confidentiality obligation is contractual or statutory rather than reputational* — law, defence, health — because there the governance work stops being discretionary spend and becomes a condition of doing business. Crane's post makes the observation from the other side: "Legal and accounting firms fear client confidentiality breaches," and that fear is the blocker to the licence sale. Fix the blocker, sell the licences. `[MVP/EXPERT]` for the observation, mine for the conclusion.

---

## 9. Claims circulating in partner decks that I could NOT verify

Flagging these explicitly because they are the ones most likely to be repeated into the guide.

| Claim | Where it circulates | Status |
|---|---|---|
| "64% of Copilot licences go unused" / "only 20–30% of seats used weekly" / "IDC: 49% of orgs have ≥10% seats unused" | SaaS-management vendor blogs, 2026 | `[UNVERIFIED]` — no traceable primary source found. Do not quote. |
| "83% of IT leaders cite lack of Copilot analytics as the top barrier" (attributed to TechRepublic 2026) | Licence-optimisation vendors | `[UNVERIFIED]` |
| "Forrester 2026: monthly licence audits cut SaaS overprovisioning 22%" | Same | `[UNVERIFIED]` |
| "EPC Group: 700+ tenant reviews, 150–300 overshared sites each, 80% with material exposure" | EPC Group marketing | `[UNVERIFIED]` — self-published, no methodology |
| "Orgs deploying Copilot in HR without a governance framework have 2–3x more privacy incidents" | Consultancy content marketing | `[UNVERIFIED]` — almost certainly invented |
| "80% of AI proofs-of-concept never scale" | Everywhere | `[UNVERIFIED]` — untraceable folk statistic |
| Work Trend Index 2026 headline figures | Partner decks | Report confirmed to exist (5 May 2026); **specific numbers not verified in this pass** |
| Gartner 5% vs 6% | Both in wide circulation | Two different surveys, a year apart, both paywalled, both reached only via secondary sources. Attribute precisely or not at all. |

---

## 10. The five things a partner should take from this

1. **Contain, then remediate, then label — and remember to un-contain.** Microsoft's own blueprint says apply RCD and DLP-for-Copilot as *interim* protections, fix the permissions, then remove the interim protections. Most partners do the first two and forget the third, which leaves the customer paying for a Copilot that can't see their own content.
2. **The governance tooling is already paid for.** One Copilot licence unlocks SharePoint Advanced Management tenant-wide, in commercial and government clouds. The "you need E5" objection — and the partner script that concedes it — is out of date.
3. **Keep the taxonomy tiny and put it on containers.** Microsoft caps its own labels at 5×5 and runs four container tiers. A 60-seat firm needs three or four, applied at workspace creation, and file-level auto-labelling can wait.
4. **The pilot dies at month three for adoption reasons, not governance reasons.** Redmond's tail-off, Crane's "quiet failure." Governance gets Copilot switched on; role-specific scenarios, champions and visible leadership use are what keep it on. Sell both or lose the account.
5. **"Copilot respects existing permissions" is true and is not a defence.** It is a statement about access control, not about exposure. Being able to say why, in one sentence, in front of an owner, is the single highest-leverage piece of knowledge in this dossier.
