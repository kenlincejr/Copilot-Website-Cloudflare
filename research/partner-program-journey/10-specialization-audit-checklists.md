# Inside the Specialization Audits: The Copilot and Data Security Checklists

**Research dossier — 10 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026.

**Primary sources, both retrieved 2026-08-28 and both publicly downloadable** (they 302-redirect to a signed CDN URL; `assetsprod.microsoft.com` is *not* gated):

- "Microsoft 365 Copilot Specialization — Program guide, audit checklist, V1.0 active Jul 09 – Dec 31, 2026", 17pp — `assetsprod.microsoft.com/en-us/copilot-specialization-audit-checklist.pdf`
- "Microsoft Data Security Specialization Audit Requirements — Audit Checklist, V1.0 active Jul 31 – Dec 31, 2026", 33pp — `assetsprod.microsoft.com/en-us/data-security-specialization-audit-checklist.pdf`

All four Security checklists resolve at the same pattern: `data-security-…`, `cloud-security-…`, `threat-protection-…`, and **`iam-specialization-audit-checklist.pdf`** (the long `identity-and-access-management-…` name 404s).

Also note: **`partner.microsoft.com` returns 403 to automated fetchers but 200 to plain curl**, so the live specialization requirement pages are readable after all.

---

## 1. Headline parameters — Microsoft 365 Copilot audit

[MS-OFFICIAL, verbatim from the checklist]

> "To earn the specialization, partners must pass a paid, third-party capabilities audit conducted by **Information Security Systems International (ISSI)**. The audit assesses a partner's ability to deliver Microsoft 365 Copilot solutions through review of live delivery practices, documentation, and subject matter expertise."

| Parameter | Value |
|---|---|
| Auditor | **ISSI** (Information Security Systems International) |
| Duration | **4 hours** |
| Method | **Live evidence review**, remote, on the partner's own conferencing platform |
| Price | **~$2,700 USD**, Gap Review Meeting included |
| Audit validity | **2 years from Pass result** |
| **Specialization badge term** | **ONE year** — "the partner will be awarded the Microsoft 365 Copilot specialization for one (1) year" |
| Structure | **6 capabilities · 15 controls · binary pass/fail per control** |
| Pass condition | "the partner must complete **all** audit checklist items" |
| Checklist refresh | **Twice yearly, July and January** |
| Scope | "Microsoft 365 Copilot, Copilot Chat, Copilot Studio, and agents" |

**Two mechanics people get wrong:**

1. > "Partners are audited against the checklist active on their **remote audit date**, not their application date."
   A July/January refresh can move the goalposts between application and audit.
2. **The badge lasts one year; the audit result lasts two.** Qualification requirements revalidate annually; the audit revalidates every other year. Badge use is also restricted to the PGA and PLA IDs that passed — "Subsidiary or affiliated organizations with separate Partner Center accounts may not advertise the status."

---

## 2. The six capability areas and fifteen controls

### Area 1 — AI Advisory Services

> "Reviews the partner's capability to guide customers through AI strategy, identify and transform business processes, quantify ROI, and deliver commercially packaged advisory services centered on Microsoft 365 Copilot."

- **1.1 AI Advisory Methodology** — a documented, repeatable methodology with defined phases, discovery/readiness approach, use-case prioritisation, and standard customer-facing deliverables. Explicit exclusion: **"(a general AI overview deck is not sufficient)"**. Plus 2 customer-facing deliverables from **2 unique customers, last 12 months**.
- **1.2 Agentic Business Process Transformation** — current-state workflow maps, future-state showing Copilot/agent integration points, capability-to-activity mapping, and "at least one measurable expected or observed operational outcome supported by agent activation or deployment evidence." **2 unique customers.**
- **1.3 Business Value and ROI Measurement** — ROI methodology with "defined value categories, baseline assumptions, calculation logic, and validation steps"; a completed customer business case with **named input data sources**; and "evidence of customer review or sign-off on quantified value outputs." **1 customer.**
- **1.4 Commercial AI Advisory Offer** — a packaged offer with scope, deliverables, engagement model and pricing. The teeth: **"The offer must be identifiable as a standalone advisory service. Embedding advisory services solely within a broader implementation or managed services engagement does not satisfy this control."**

### Area 2 — Deployment, Security, and Governance

- **2.1 Deployment Assessment and Readiness** — must evaluate technical prerequisites and licensing, whether "the customer's content and knowledge estate [is] structured to support effective Copilot grounding," and **"permission sprawl, data classification posture, and oversharing risk."** **2 unique customers.**
- **2.2 Security Controls and Compliance** — five distinct artifacts, each applied in a customer deployment: access control configuration; data protection controls (DLP, Defender for Cloud Apps, Purview information protection); a compliance framework such as Zero Trust; responsible AI controls; and **"a Microsoft 365 Copilot incident response playbook covering detection, escalation, and remediation steps."** **2 unique customers.**
- **2.3 Agent Governance Framework** — the hardest control in the document. Requires documented operational governance for agents **in customer production environments**: lifecycle covering "approval, deployment, version control, scheduled reviews, drift detection, rollback strategies, and decommissioning"; **"operational monitoring evidence from production runtime"**; governance roles and human-agent oversight structures; periodic review activity; and **"evidence showing how agent usage cost and performance are tracked and managed."** **2 unique customers.**

### Area 3 — Adoption and Change Management

- **3.1 ACM Methodology and Delivery Practice** — methodology "aligned to a named framework (e.g., Prosci/ADKAR, Kotter, or proprietary frameworks if fully documented)", applied evidence, and the staffing test: **"evidence of dedicated or formally assigned change management resources on customer projects (e.g. staffing plans, role descriptions, or project team structures)."** **2 unique customers.**
- **3.2 Adoption Measurement and Reinforcement** — a framework defining metrics, frequency, thresholds that trigger action, and owners. Telemetry from "Copilot Dashboard exports, Viva Insights reports, tenant usage reports" across **at least 2 measurement cycles**. Plus a closed-loop record: a metric, the threshold met, the reinforcement action taken, and **the subsequent re-measurement**. **2 unique customers.**

### Area 4 — Agentic Solution Delivery

- **4.1 Team Capability and Microsoft Alignment** — "Partner must have a **dedicated team** activating and building agentic solutions." Evidence: **"Team org chart or resource model identifying staff dedicated to agent activation, adoption and development, including names, roles, and certifications held."** This control puts your org chart in front of the auditor.
- **4.2 Agent Activation, Deployment, Governance & Security** — **"production-grade engineering practices for agent development including source control, automated testing, or documented deployment process for agent releases"**, plus architecture documentation from at least two agent deployments. Qualifying scenarios are broad: activating first-party M365 Copilot agents, activating end users on Agent Builder with published agents, or deployed custom agents on M365 / Copilot Studio / Foundry.
- **4.3 Commercial Agent Offering** — packaged offering (CoE, factory models, governance, AgentOps or managed services) with pricing; evidence it is **currently in market**; and **at least one customer engagement record where the offering was sold — "signed SOW, executed engagement letter, or invoice" — within 12 months.**

### Area 5 — Internal Deployment & Adoption

> "Verifies that the partner has internally deployed and actively adopted Microsoft 365 Copilot… Practice and presales teams must have Copilot access and are actively using it."

**5.1 Seat Coverage & Active Use**, tiered by partner headcount:

| Partner size | Minimum M365 Copilot seats | MAU requirement |
|---|---|---|
| 1,000+ employees | 300 | 60% of paid active seats |
| 300–999 employees | 50 | 60% |
| **Under 300 employees** | **20 seats covering practice and presales teams** | **60%** |

Evidence: admin-centre licence report, usage report showing MAU **for the last three months**, and proof licences sit with practice and presales staff. Explicit disqualifier: **"Concentration solely in non-customer-facing roles does not satisfy this control."**

> ⚠ **There is no carve-out below 20 seats.** A partner with fewer than 20 employees appears unable to satisfy this control as written. This is arguably the single hardest blocker in the document for a small MSP, and it is not addressed anywhere in the checklist. [UNVERIFIED — raise with a PDM.]

### Area 6 — Partner Sales & Technical Training

- **6.1 Sales Readiness** — **5 learners** completing *Building a Business Case with Microsoft Business Case Builder Tool* (`aka.ms/PartnerSkillingBCB`).
- **6.2 Technical Readiness** — **5 learners** completing *Building Frontier Firm Productivity with Work IQ, Copilot, & Agents* (`aka.ms/FrontierCopilot`).
- Evidence: completion screenshot per learner from Skilling Hub or Microsoft Learn transcript, dated within 12 months, for the current active version.

> **These two are invisible in the published prerequisites.** partner.microsoft.com notes only "Additional Sales Ready and Project Ready trainings/assessments are required and will be verified through the audit." Ten more training completions across five people, discovered at audit time, is a classic failure mode.

---

## 3. How customer evidence actually works

**10 of the 15 controls require named customer evidence**, almost all specifying **2 unique customers within the trailing 12 months**. There is no reference-call step — the auditor does not phone your customers. Instead they interrogate your artifacts, live.

[MS-OFFICIAL, verbatim]

> "Prepare live demos. **PowerPoints and excerpts are accepted for overviews but are not sufficient alone. Source documents and live system access are required.**"
> "Expect probing questions. Auditors verify that processes are mature, repeatable, and effective — not just documented. They ask **how documents were created, where they are stored, and what source materials were used.**"

Also: "Confirm live access to all systems, files, and tools you plan to present" and "Match SMEs to sections." Microsoft staff including your PDM **may help you prepare but may not attend the audit.**

**The distinct-customer math [INFERENCE].** The Copilot checklist does not state a global minimum customer count, and unlike the Data Security checklist it does **not** explicitly permit reuse across controls. But controls 1.2, 2.3, 4.2 and 4.3 demand *agent* work specifically — agentic process transformation, production agent governance with runtime monitoring, source-controlled agent releases, and a sold agent SOW — while 1.1, 2.1, 2.2, 3.1 and 3.2 demand advisory, security and adoption depth. Realistically you need **two customers where you have done both the Copilot rollout and production agent work**, which is a far narrower set than two Copilot customers.

**The published failure modes** — the most useful paragraph in either document [MS-OFFICIAL, Data Security checklist, verbatim]:

> "Common gaps include: **screenshots with no narrative, showing enablement but not enforcement (policies created but not assigned), no proof of operational cadence (no tuning/remediation history), unclear customer scope, and evidence that is too generic (templates not tied to an actual environment).**"

And the definition of "outcome evidence": "proof the control **improved security posture** (not just that it was enabled). Provide before/after metrics, trends, or incident outcomes."

---

## 4. Module A — answered

**Module A is "Security Foundation": a solution-area-level foundation module tracked once per solution area, not per specialization.** [MS-OFFICIAL, Partner Center announcements, 2026-08-13]

> "In September 2026, partners can view their Security or Azure **Module A** status in Partner Center. For specializations that require a Module A component, Partner Center displays their **most recent Module A date for that solution area** and when it will be required to take again."

Pricing confirms the reuse model [MS-OFFICIAL, identical in all four Security checklists]:

> "Module B Audit: **$2,700 USD** · Module A + B Audits: **$4,000 USD** · A Gap Review Meeting is included with every module audit. Pricing shown is as of July 31, 2026."
> "The duration of an audit is **four (4) hours for Module B** workloads and **eight (8) hours for Module A+B** audits combined."

**Practical read [INFERENCE, well-supported]:** your first Security specialization costs **$4,000 / 8 hours**. Each subsequent one while Module A remains valid costs **$2,700 / 4 hours**. The Copilot audit has **no module structure at all** — it is standalone, and there is no indication a Security Module A could ever apply to it.

Module A's eight requirements (Data Security wording): A1.1 Security Program Strategy · A1.2 Operating Model & Governance · A1.3 Data Security Foundation & Access Governance · A2.1 Solution Architecture and Security Design · A2.2 Security Platform Implementation Baseline · A3.1 Repeatable Deployment · A3.2 Security Operations · A3.3 Outcomes and Continuous Improvement. Structurally identical across the Security specializations but **textually tailored**, not byte-identical (measured similarity 0.58–0.69 between checklists).

---

## 5. Data Security — the performance number, finally

[MS-OFFICIAL, partner.microsoft.com/en-us/partnership/specialization/data-security, retrieved via curl 2026-08-28]

- **Designation:** active Solutions Partner for **Security**
- **Performance:** **"a minimum of 2,500 Monthly Active Usage (MAU) growth of Microsoft Purview Information Protection in a trailing 12-month period (based on CPOR data)."**
- **Skilling:** 6+ individuals with SC-401 **AND** 4+ with one of three Purview applied skills. Crucially: **"You can have the same or different individuals completing the above requirements."**
- **Audit:** third-party remote audit

This closes the open item in dossier 09 §8. It also confirms Data Security is the harder badge: **2,500 Purview IP MAU** versus **1,000 Copilot MAU**, and six certified people versus five.

Module B covers four use cases: **B1 Secure Data Storage/Encryption**, **B2 Data Classification & Labeling**, **B3 DLP & Detection** (two controls), **B4 Secrets, Key Management & Rotation**.

**Scope mismatch worth flagging [INFERENCE]:** B1 and B4 are substantially **Azure** controls — Key Vault, Managed HSM, SQL TDE, Always Encrypted, managed identities. A pure M365 SMB practice will have its weakest evidence there, not in the Purview areas. The checklist allows "equivalent encryption and key management controls for non-Azure workloads (where applicable)", but B4.1 names Key Vault directly.

**Two concessions worth knowing:** B3.2 accepts **tabletop exercise records** in place of real incidents ("at least two investigated and remediated data leakage incidents **or tabletop exercise records**"), and **customer reuse across controls is explicitly allowed** — "unless a requirement states otherwise, the same customer may be used across multiple controls/sections", provided each requirement has distinct artifacts.

**Maturity levels are informational.** Stated three times: "Maturity levels do not impact on the audit Pass/No Pass outcome."

**Agentic data security is watched but not scored** — auditors "may note evidence of" Purview labelling applied to agent-accessible data, DLP monitoring agent-driven data movement, and least-privilege for non-human identities. Recorded as a non-identifying observation; participation optional. This is the on-ramp to the **Agentic Security specialization, "currently in design"** for FY27.

**Redaction is mandatory:** "The Partner must not submit personal data or customer-identifiable information as part of audit evidence." Sanitised or controlled environments are acceptable; you are "not expected to share production environments, proprietary detection logic, or customer-identifiable data."

---

## 6. The process, with its clocks

Same flow in both documents:

1. Review and prepare; collect evidence; identify SMEs.
2. **Meet all prerequisites first.** Warning repeated in both: "Do not begin unless you are ready — consider readiness, employee availability, and scheduling."
3. Microsoft validates eligibility and passes your details to the audit provider.
4. Partner Center enables the **Schedule audit** button. Until then your status reads *Not started*.
5. **The auditor contacts you within 2 business days** to confirm scheduling.
6. **Audit conducted within 30 calendar days** of scheduling.
7. **Gap Report within 5 business days** if there are open items; **you acknowledge within 2 business days**; **Gap Review Meeting within 15 calendar days, max 1 hour.**
8. **Final Report to Microsoft within 7 business days**; Microsoft notifies you within 2 and updates status.

> ⚠ **A hard trap:** "If the Partner does not schedule and hold the Gap Review Meeting **within fifteen (15) calendar days, the audit will be recorded as a No Pass**."

**Realistic clock [INFERENCE]:** ~2–3 weeks from scheduling to result if you pass clean; ~5–6 weeks if a Gap Review is needed. Preparation time sits entirely on top and is the dominant cost.

**The Gap Review is mandatory, not optional:** "This is a required part of the audit process, not an optional extension."

**Failure, withdrawal, retry:**

- **You get a result even if you walk away:** "Partners receive a Pass or No Pass result upon completion of the audit process, **including if they withdraw**."
- On No Pass, status shows *Audit Failed*, then "resets within one week to *Not Enrolled*." Retry **after 7 days**; "There is **no mandatory waiting period** before reapplying."
- From late August 2026 you can **withdraw in Partner Center**, status becomes *Audit Withdrawn*, and you can reapply "with no cooldown period."
- **A retry is presumably a second full fee** [INFERENCE — not stated, but fees are per audit module paid directly to ISSI and reapplication restarts the application].

**Transition relief:** Security partners were given a **six-month extension to their anniversary date**. **No equivalent grace was announced for the Copilot specialization** — its checklist went active 2026-07-09 with no stated relief. [UNVERIFIED for existing holders.]

---

## 7. The conflict of interest, named

Both checklists disclose that **the audit provider also sells audit-preparation services**, and that your PDM may attend those but not the audit:

> "The PDM may attend optional consulting engagements that the third-party audit provider offers, but the PDM and other Microsoft FTEs may not attend the audit."

ISSI markets "Audit Readiness Preparation" including "an audit rehearsal in which the ISSI consultant acts as an auditor" [VENDOR, issi-inc.com]. Worth stating plainly to partners: **the body that grades you also sells the rehearsal.**

Other firms positioning in this gap [VENDOR]: **The Partner Masters** (named audit-prep service covering Azure, all four Security specs, and M365 Copilot; the only outlet publishing analytical commentary on the FY27 shift), **AI Cloud Partners** ("PIE" / ISSI Evidence Manager, from $299/month), and **Tech Plus Talent** (a marketplace consulting listing).

---

## 8. The market signal: silence

A dedicated trade-press and community sweep found **essentially nothing**. Zero CRN / Channel Futures / ChannelE2E / MicroScope / RCP articles on the FY27 audit shift. Both Microsoft announcement blogs have **zero comments**. LinkedIn commentary is neutral-to-positive with no dissent.

**Exactly one substantive community thread exists** — r/msp, "Microsoft Specialization Audit", ~July 2025, 1 upvote / 5 comments. Its content is nonetheless the best practitioner advice available:

> "It took a lot of work to get the docs together and the biggest take away from the auditor: **take the auditor to the docs, don't bring the docs to the auditor.** We spent days on the PowerPoint deck that walked through each audit point and he didn't want to see it." — a partner who passed the Analytics audit first time, no gap report.

> "**Unfortunately, consulting in the wild doesn't structure deliverables in the same manner.**"

> "would you suggest any **Audit Assistance companies** who will support in understanding the spec, getting documents together" — unanswered.

**No pass or failure rate has ever been published by anyone** — not Microsoft, not ISSI, not the prep vendors. Every failure claim in circulation is a vendor's qualitative assertion.

Note the contrast: r/msp *does* actively complain about Microsoft partner economics — designation scores, incentives, the $4,875 fee — but **not about audits**. The demand signal for audit help exists only in one unanswered forum request, the five firms that have built commercial offers around it, and Microsoft's own six-month extension, which is implicit acknowledgement that partners need runway.

---

## 9. Could not verify

1. **Whether the Copilot 5 + 5 skilling requirement permits the same individuals to satisfy both groups.** The Data Security page states the allowance explicitly; **the Copilot page does not.** If they must be ten distinct people, that is a different business. **Confirm with a PDM or distributor before buying vouchers.**
2. **How control 5.1's 20-seat internal minimum applies to partners with fewer than 20 employees.** No carve-out exists in the text.
3. **Whether a No Pass retry incurs a second full audit fee.**
4. **Whether the Copilot audit permits customer reuse across controls** (Data Security grants it explicitly; Copilot is silent).
5. **Whether any transition grace applies to existing Copilot specialization holders.**
6. **ISSI's audit-readiness pricing**, the identity of individual auditors, and whether any firm other than ISSI is approved.
7. **Whether Threat Protection's Module A genuinely omits requirement A1.2** or whether that is a PDF extraction artifact.

**Local artifacts retained:** the four Security checklist PDFs are in the session scratchpad; the Copilot checklist PDF is in the tool-results directory. `pypdf` extracts all of them cleanly.
