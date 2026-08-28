# Real Delivery Capability: What It Takes Behind the Badge

**Research dossier — 12 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026. Audience: 5–50 person MSP delivering M365 Copilot and Purview data security.

Tags: `[MS-OFFICIAL]` · `[CHANNEL-PRESS]` · `[COMMUNITY]` · `[VENDOR]` · `[INFERENCE]`

---

## 0. The one-line finding

Microsoft publishes a **role catalogue**, a **maturity model**, and — since July 2026 — an **audit that tests for named, dedicated humans**. But **nobody, Microsoft or the channel press, has published headcount or FTE guidance.** The binding constraints on a small MSP are not certifications. They are **role separation the auditor can see**, **seniority** (the new cert stack is expert/pro-dev level), and **elapsed-time depth** on Purview remediation that does not compress.

---

## 1. Microsoft's published role guidance

### Seven agentic roles [MS-OFFICIAL]

From the [Agentic AI adoption maturity model](https://learn.microsoft.com/en-us/agents/adoption-maturity-model/maturity-model-readiness), ms.date 2026-03-31, updated 2026-05-20 — section "Roles and responsibilities in agentic adoption":

| Role | Microsoft's words |
|---|---|
| **Executive sponsor** | "Direction, legitimacy, and prioritization" |
| **Agent business owner** (per domain) | "Value, outcomes, and adoption" |
| **Agentic Center of Excellence** | "Enablement, standards, and scale" |
| **Platform and IT leads** | "Technical readiness and reliability" |
| **Security, risk, and compliance partners** | "Trust and guardrails" |
| **Operations and support lead** | "Run operations, improve reliability… Decides when to pause, roll back, enhance, or retire agents" |
| **Champions and community leads** | "Adoption, confidence, and peer learning" |

The CoE **"is small and cross-functional (business, IT, security, change)"** and **"owns how agents are adopted, not which agents are built."** No numbers given. The Operations/support lead is the only role explicitly owning rollback and retirement — exactly what audit control 2.3 tests.

**Named anti-pattern for small teams:** **"Champion dependency"** — "Relying too heavily on a few motivated individuals… Adoption stalls when champions leave or burn out." That is the small-MSP failure mode, named by Microsoft.

Governance anti-patterns from the same model: "No inventory and no ownership" · "Controls are 'guidance-only' instead of enforceable" · "Missing or ignored environment strategy" · "Treating all agents as the same (no tiered approach by risk and criticality)" · "Audit and monitoring are afterthoughts" · **"Cost and usage governance is unmanaged."** Level-specific: 100 "Shadow AI proliferation", 200 **"Governance theater"**, 300 "Operations silos".

### The four partner readiness roles [MS-OFFICIAL]

From the FY26 *AI Business Solutions / AI Workforce Partner Skilling Playbook* (24pp, publicly hosted on media.skilling-hub.com — **note pages are watermarked "Classified as Microsoft confidential" despite public hosting; handle accordingly**). This is the closest thing Microsoft publishes to a partner role model:

- **Credential Ready** — foundational solution-area knowledge for *all* partner roles, driving designations and specializations
- **Sales Ready** — sell and land Solution Play value
- **Tech Deal Ready** — tech sellers influencing scope, RFP and deal readiness
- **Project Ready** — "intermediate to advanced technical trainings to migrate, implement, and integrate"

Crossed with three practice maturity stages: **New to Practice (Build) → Improve Practice (Enhance) → Specialize (Innovate and Grow)**.

> [INFERENCE] The Credential/Sales/Tech-Deal/Project-Ready split is effectively Microsoft telling partners they need **four distinct people-shapes, not four certifications on one person.**

### Other official artifacts worth knowing

- **Copilot Success Kit** — ~12 role-based assets in 10 languages. **Contains no team-sizing or FTE guidance** (checked specifically).
- **Agent Readiness Framework** (45pp, adoption.microsoft.com) — five pillars; Pillar 4 "Organizational Readiness & Culture" scores **Change Management** as a capability. From the Microsoft Agent Readiness Survey, Sept 2025: only **18% average** strongly agree they have effective change management (Achievers 56%, Discoverers 4%); **17%** have a clear talent strategy.
- **"Data Security for Copilot for Microsoft 365" partner assessment — it exists and is live** [MS-OFFICIAL, learn.microsoft.com/en-us/assessments/dde5dcfc-77d3-4f71-aa3f-cc98fa893e99/]. A **5-hour** Microsoft Learn partner self-assessment producing a **scored, personalised recommendation set** across training resources, best practices, solution development guidance, and sales enablement. **A practice-development diagnostic, not a credential.** This closes an open item from dossier 10.
- **Power Platform "Define roles and responsibilities"** lists ~20 roles and gives the only sizing hint Microsoft publishes: *"Initially, one person might fulfill multiple roles, but as the organization grows… you find you need to refine and expand those roles."*

---

## 2. The seniority uplift — the largest hidden cost

[MS-OFFICIAL, Partner Center July 2026 announcements] The Copilot specialization **removed MS-102** and added **AB-100** and **AB-620**. Read as a capability change rather than a list change:

- **AB-100** is **Expert level with a prerequisite associate certification**. Job role: **Solution Architect**. Competencies include multi-agent orchestration, **A2A and MCP protocols**, ALM strategy for agentic solutions, securing model/data workflows, telemetry interpretation, and *"ability to conduct a return-on-investment (ROI) analysis of an AI-powered solution."*
- **AB-620** targets **"a professional developer or advanced builder"** and assumes **Power Fx, Dataverse, Foundry, adaptive cards, RAG, MCP, A2A, prompt engineering, REST APIs and integration patterns.**
- **SC-401** is Associate, Purview-centric, and assumes familiarity with **PowerShell, Entra, the Defender portal and Defender for Cloud Apps.**

> [INFERENCE] Replacing MS-102 (an M365 admin expert cert) with an architect expert cert plus a pro-dev cert is a **material seniority uplift**. A tier-2 M365 engineer who could pass MS-102 will not casually pass AB-620. **This is the single largest hidden cost in the 2026 requirements for a small MSP** — the skill least likely to already exist in-house and the hardest to hire.

Also decisive [MS-OFFICIAL, same announcements]: **"The Adoption and Change Management specialization is retired June 25, 2026… Rather than have a standalone specialization, adoption and change management capabilities are embedded within product-aligned specializations, ensuring change management is evaluated in the context of specific solutions."** That is *why* an ACM control now sits inside the Copilot audit. ACM is no longer something you badge — it is something you must evidence on customer projects.

---

## 3. Purview delivery depth — durations that don't compress

### The official work breakdown

[MS-OFFICIAL, [configure-secure-governed-data-foundation](https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot), ms.date 2026-04-17] — **three steps, ~30 discrete tasks, four admin portals** (M365 admin center, SharePoint admin center, Purview portal, Entra). Explicitly for "IT administrators and security administrators."

1. **Remediate oversharing** — DSPM data risk assessments → SAM Content Management Assessment → *interim* controls (Restricted Content Discovery, DLP for Copilot) → validate via Purview Audit → fix access (site sensitivity labels, remove EEEU/anonymous, site access reviews, repair broken inheritance, assign ownership) → **remove the interim controls**
2. **Set up guardrails** — Restricted Access Control by default, disable company-wide sharing/Anyone links, mandatory site labels at provisioning, auto-label + default labels, DLP for Copilot (content *and* prompts), IRM + Adaptive Protection
3. **Meet regulations** — Compliance Manager gap assessment, audit-log retention, Copilot interaction retention/deletion, eDiscovery for Copilot content

SAM's Content Management Assessment **reruns every 30 days**; the **EEEU report covers top 100 sites over a 28-day window**.

### RBAC is an underestimated cost

[MS-OFFICIAL, [ai-microsoft-purview-permissions](https://learn.microsoft.com/en-us/purview/ai-microsoft-purview-permissions)] Fully operating DSPM for AI needs combinations of Entra Compliance Administrator, Entra Global Administrator, Purview Compliance Administrator, Security Reader, Data Security AI Viewer, Entra **AI Administrator**, **Data Security AI Content Viewer**, **Content Explorer Content Viewer**, **Content Explorer List Viewer**, IRM Administrator/Analyst/Investigator, Communication Compliance Administrator, and five Exchange role groups just to activate Audit. **No admin role can view prompts/responses in Activity Explorer without Content Explorer Content Viewer + Data Security AI Content Viewer.**

> [INFERENCE] A real friction point in SMB engagements — the customer's single "IT guy" account will not have these. An MSP delivering this needs a documented role-assignment package per tenant.

### DSPM for AI — hard limits that shape scope [MS-OFFICIAL]

Default data risk assessment covers **top 100 SharePoint sites by usage**, weekly, with a **4-day delay** on first run; custom assessments take **≥48h** and **expire after 30 days**. **Item-level scanning: max 10 SharePoint sites, 200,000 items per location**, unreliable above 100,000; **OneDrive not supported**.

### Duration evidence

| Scope | Duration / cost | Source |
|---|---|---|
| Oversharing remediation, clean security-group model, intact ownership | **4–6 weeks** | [CHANNEL-PRESS] EPC Group, 2026-08-10 |
| Distributed permissions, missing groups, item-level EEEU sprawl | **3–6 months** | same |
| Regulatory constraints, guest accumulation, migrated legacy structures | **6+ months** | same |
| SMB labels + DLP + Copilot readiness runbook | **60 days** — Wk0 governance · Wk1–2 permissions · Wk2–3 labels · **Wk3–8 DLP audit mode** · Wk9+ staged enforcement | [COMMUNITY] CIAOPS (Robert Crane, MVP), 2026-05-18 |
| Mid-market label rollout to meaningful coverage | **one quarter** | [CHANNEL-PRESS] Surelogic, 2026-06-11 |
| DLP + IRM + Communication Compliance enterprise accelerator | **12–24 weeks, $200K–$700K fixed fee**; 30-day DLP audit mode; **30–60 day tuning cycle cutting false positives 60–80% before a policy is operational** | [CHANNEL-PRESS] EPC Group, 2026 |
| Copilot deployment end-to-end | **6–9 months**; Wk1–8 governance readiness, Wk9–10 licensing, Wk11–20 pilot (50–100 users, 60 days), Wk21+ rollout. *"Compressing this timeline consistently extends it through remediation cycles"* | [CHANNEL-PRESS] Exelegent, 2026-05-28 |
| Readiness assessment | **200–400 hours internal, $25K–$75K external**; 4–6 wks for 1,000–10,000 users; **8–12 wks remediation** if heavy technical debt | [CHANNEL-PRESS] Copilot Consulting, 2025-10-11 |

### Practitioner consensus on what works

- **3–4 labels, not more.** CIAOPS: *"Working SMB implementations commonly succeed with 3-4 labels, not large taxonomies."* Surelogic: *"More granularity feels rigorous and dies in practice — when staff face nine options, they choose none."*
- **Sequence is load-bearing.** CIAOPS: *"Clean access first, classify second, enforce third, accelerate last."* EPC: **contain → correct → constrain**.
- **Named failure modes:** label proliferation (8–40 labels); **permanent audit mode** (DLP never enforced, for months or years); Copilot enabled before permissions cleanup; taxonomy changes *after* encryption is live (files retain old RMS templates unless re-labelled); labels with no enforcement behind them.
- **The hardest single thing:** *"item-level EEEU sprawl — files shared organization-wide within private sites, invisible in standard reports and unsafe to delegate cleanup."* And: *"Human judgment, not automation, dominates the largest cost bucket — remediation itself."* [CHANNEL-PRESS, EPC Group]
- **It is a service, not a project.** [CHANNEL-PRESS] Amy Babinchak, Petri, 2026-07-07: *"Copilot readiness is not a one-time cleanup because sharing drift resumes the moment users create new teams, sites, folders, and links."* And on why nobody fixed it earlier: *"Nobody scheduled time to fix it before the rollout. Probably because it's an expensive fix."* Cites Concentric AI: **16% of business-critical data in the average M365 tenant is overshared.**

### Restricted SharePoint Search is a trap, not a control

[COMMUNITY] CIAOPS, 2026-05-31: **100-site allowed list**; *"It doesn't change a single permission on a single site… That's not a security boundary. That's a curtain."* Content still surfaces via recent access or Teams/Outlook delivery. Three failure modes when it lingers: org-wide search breaks, Copilot loses breadth, and **false confidence replaces actual security work**. Recommendation: **30 days maximum, then disable.** Tony Redmond concurs — *"a sticking plaster."* Microsoft's own newer guidance has moved to **Restricted Content Discovery** and **Restricted Access Control**.

### The SMB licensing cliff

**Adaptive Protection, auto-labeling, DLP for Copilot and IRM are all "Optimized" tier = A5/E5/G5** [MS-OFFICIAL, Copilot Control System]. E3 gets manual labeling only. IRM planning requires stakeholders across **IT, Compliance, Privacy, Security, HR and Legal** — six functions.

**The SMB unlock: Purview Suite for Business Premium at $10/user/month** (or $15 combined with Defender Suite), **300-seat cap** [CHANNEL-PRESS, CIAOPS]. Without it, most of the governance stack an SMB Copilot engagement needs is simply not licensed.

[COMMUNITY] The Purview Practitioner, verified 2026-07-30: *"Microsoft's own documentation disagrees with itself here"* on licensing; on DSPM entitlement, *"Microsoft does not publish it as an entitlement."* Advice: **"Confirm with your licensing desk, not the docs."**

---

## 4. Copilot Studio / agent delivery depth

### The official bar for production agents

[MS-OFFICIAL, [manage-checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/manage-checklist), ms.date 2026-01-16] — **31 checklist items** across four categories:

- **Security (5)** — least-privilege for makers/admins/service accounts; restrict create/edit/publish per environment; conditional access; **document who can approve ALM deployments**; encryption in transit and at rest
- **Governance (8)** — dev/test/prod separation; data policies; **approve which connectors, tools and MCP servers are allowed**; naming conventions; pre-production review; documented prompt/knowledge/instruction guardrails; sandbox rules; **"assign owners responsible for long-term maintenance"**
- **Monitoring (9)** — Application Insights telemetry; error/usage/latency dashboards; **transcript review for quality and safety**; alerts on integration failures; audit logs; hand-off review; **scheduled performance and capacity reviews**; retention/deletion validation
- **ALM (9)** — solution-aware structure; environment variables; **automated deployment pipelines**; documented release criteria; **versioning**; cross-environment compatibility; **"create a rollback plan for failed deployments"**; post-deployment testing; **"assign clear ALM roles for makers, reviewers, and approvers"**

**Eight test types required** [MS-OFFICIAL]: development-time unit, core scenario, knowledge, regression, **adversarial**, performance/load, **security & compliance** (RBAC, conditional access, sensitivity-label enforcement, no confidential leakage), and accessibility/UX.

### What actually goes wrong [COMMUNITY]

**Luise Freese (MVP)**, 2025-07-15: *"If that's your lifecycle, you haven't shipped an agent. You've just made a sandbox louder."* · **"if you're not using solutions, you're not doing lifecycle management; you're editing in production"** · *"Channels are UI. Environments are infrastructure."* Publish is a channel push, not a deployment pipeline — no test phase, no version control, no audit trail, no rollback. In the default environment every user is a maker.

**Microsoft Copilot Studio Customer Advisory Team**, updated 2026-08-02 — eight required practices: three-environment model with unidirectional flow; single solution per agent; **custom publisher with prefix created before authoring**; preferred-solution assignment; environment variables for all env-specific values; **Azure Key Vault for secrets**; block unmanaged customizations and strip maker/admin access from Test/Prod; **evaluations before export and after import**.

**The CoE Starter Kit is end-of-life** (~May 2026) — no longer actively maintained; Microsoft directs partners to native Power Platform admin center governance. Relevant if any existing agent-governance IP depends on it.

### Cost management is a distinct discipline

[CHANNEL-PRESS, CloudZero 2026-05-18] **$0.01/credit PAYG; $200/mo for 25,000 credits prepaid (~$0.008).** Per-action burn: scripted answer **1**, generative answer **2**, agent action **5**, **tenant graph grounding 10**, **premium/reasoning models 100 per 10 responses**. *"One credit buys a scripted FAQ answer, but a single reasoning-model response costs 100 credits."*

Five agents across departments ≈ **$3,000–$6,000/month in credits alone**, before Copilot licences, Azure compute and OpenAI tokens. **Agents disable at 125% capacity consumption** without PAYG overflow. Shared credit pools create cross-department blast radius. *"Each layer arrives on a different invoice, in a different format, under a different cost center."*

> [INFERENCE] The audit's agent **cost-tracking** requirement (control 2.3) is not satisfiable by a spreadsheet. It needs a per-customer credit allocation policy, budget/alert/hard-cap configuration, and monthly reconciliation across at least three billing surfaces. That is an **AgentOps managed-service function** — which is exactly what Microsoft's own MSP Playbook proposes monetising.

### The skills profile

Power Fx · Dataverse · Power Platform environments/solutions/pipelines · environment variables and connection references · Azure Key Vault · Application Insights · custom connectors and REST integration · **MCP servers** · **A2A protocol** · RAG · prompt engineering · adaptive cards · evaluation design · DLP/connector policy · Entra group-based access.

> [INFERENCE] **This is a Power Platform pro-developer, not an M365 administrator.**

---

## 5. Team composition — and the hole where the answer should be

### Microsoft now tests for named humans

From the audit checklist [MS-OFFICIAL, dossier 10]: **control 4.1** requires *"Team org chart or resource model identifying staff dedicated to agent activation, adoption and development, including names, roles, and certifications held."* **Control 3.1** requires *"evidence of dedicated or formally assigned change management resources on customer projects (e.g. staffing plans, role descriptions, or project team structures)."*

### Published role lists (no headcount anywhere)

- **Six roles for a Copilot readiness assessment** [CHANNEL-PRESS]: M365 Administrator, IAM Specialist, Security Engineer, Compliance Officer, Network Engineer, Business Analyst
- **Five domains MSPs must cover** [CHANNEL-PRESS, SkyTerra 2026-02-10]: *"data governance, security architecture, change management, financial analysis and Microsoft 365 administration"*
- **The clearest MSP-shape thesis** [COMMUNITY, Amy Babinchak, Third Tier, 2026-05-01] — today: *"Mostly Tier 1/2 handling reactive tickets… a few senior engineers/architects, minimal dedicated roles for security, data, or business consulting."* Needed: fewer Tier 1/2; more **security engineers/analysts**, **data & automation specialists (Power Platform, Copilot Studio, scripting)**, and **client-facing advisors who can speak business outcomes**. *"AI doesn't automatically reduce headcount; it changes what your people should be doing to be worth their seat cost."*
- **Security ≠ AI security** [CHANNEL-PRESS, CloudServus 2026-06-16]: *"a partner with strong Microsoft Defender and Sentinel experience may still lack the specific knowledge required to manage AI risk in a Copilot environment."* Also notes many partners are *"repackaging general Microsoft 365 consulting under an AI label."*

### Engagement economics

| Figure | Source |
|---|---|
| **200–400 h internal / $25K–$75K external** per readiness assessment | copilotconsulting.com |
| **$5,000 for 50 users** | F12.net |
| **4 weeks / $45K** Copilot Data & Security Readiness | Spyglass MTG |
| Assessment $5–15K → remediation $15–40K → **$50–100K+ lifetime per client** | Cloudiway [VENDOR — treat margin claims sceptically] |
| **30–40% of sensitive content accessible to the wrong users**; adoption **plateaus at 20–30% in Q1** without change management; **10–30% licensing inefficiency** | SkyTerra 2026-02-10 |

### What is NOT published — a genuine finding

- **No published partner capability model that scales team composition by headcount.** The "what can a 2- / 5- / 10-person team deliver" question is unanswered in the channel press as of Aug 2026.
- **No channel-press critique** that the Copilot specialization thresholds are unattainable for small MSPs. Nearest is The Partner Masters noting self-funded biennial audits are *"a significant operational and financial burden for small organizations."*
- **No Copilot/Purview-specific day-rate benchmark.**
- **Reddit unreachable** to this fetcher; no Reddit evidence in this dossier.

---

## 6. Synthesis — the capability actually required [INFERENCE]

Everything here is inference from the cited evidence, not a published model.

**Minimum distinct people-shapes: four.** Fewer than four and the audit's role separation cannot be evidenced.

1. **Purview / data-security engineer** — SC-401 level. Labels, DLP, DSPM, SAM, RBAC assignment, oversharing remediation. Comfortable across four admin portals and PowerShell. Carries the **longest-duration work** (4–6 weeks best case, 3–6 months typical).
2. **Agent developer** — AB-620 level, **pro-dev not admin**. Power Fx, Dataverse, solutions, pipelines, Key Vault, MCP/A2A, evaluations. **Hardest to hire; most likely gap in an existing MSP.**
3. **Advisory / business-value lead** — owns the standalone commercial advisory offer (control 1.4), the ROI methodology with customer sign-off (1.3), the Business Case Builder training (6.1), and the agentic architecture story (AB-100 sits naturally here). Senior, customer-facing.
4. **Adoption & change management lead** — named, role-described, appearing on customer project structures; owns telemetry across two measurement cycles (control 3.2) via Copilot Dashboard / Viva Insights.

Plus a fifth *function* that can be shared but not skipped: **AgentOps / operations owner** — the only role Microsoft says owns "pause, roll back, enhance, or retire", plus credit budgets, hard caps and monthly cost reconciliation.

**A critical structural point:** the ACM lead must be **distinct from the delivery engineer on the org chart**, or controls 3.1 and 4.1 collapse into the same body and the separation becomes unevidenceable. The audit's wording — "dedicated **or formally assigned**" — appears deliberately drafted to permit a **named, part-time-allocated person with a documented role description**, rather than requiring a full-time ACM hire.

**The three things a small MSP will underestimate, in order:**

1. **Seniority, not headcount.** AB-100 is Expert with a prerequisite; AB-620 assumes a professional developer. The 2026 stack is not reachable by upskilling tier-2 techs alone.
2. **Elapsed time on remediation.** 4–6 weeks at best, 3–6 months typically, human-judgment-dominated — and *recurring*, since drift resumes immediately. It must be sold as a managed service, not a project.
3. **Internal Copilot deployment.** 20 paid seats at 60% MAU concentrated in practice and presales is a real cash and behaviour-change cost for a 12–30 person firm, and it is the control most often discovered late.

**Where the leverage is:** tooling (Inforcer/Cloudiway-class multi-tenant assessment platforms) collapses assessment labour but **not remediation labour**; white-label subcontract (Pax8 MIS, TD SYNNEX ServiceSolv) closes capability but **not the org-chart evidence**; and the **AgentOps / managed-governance tier** is where Microsoft's own MSP Playbook says the margin lives.

---

## 6b. The ACM control, and why Prosci is probably the wrong buy

**Open item from §7 now closed.** Prosci's licensing terms were read directly in a browser (prosci.com 403s to fetchers) and they change the recommendation.

### What control 3.1 actually permits

Verbatim from the audit checklist [MS-OFFICIAL]:

> "Change management methodology documentation aligned to a named framework (e.g., Prosci/ADKAR, Kotter, **or proprietary frameworks if fully documented**). Documentation must define phases, roles, and standard activities."
> "Evidence of **dedicated or formally assigned** change management resources on customer projects (e.g. **staffing plans, role descriptions, or project team structures**)."
> "Evidence must come from a minimum of 2 unique customers from the last 12 months."

Three load-bearing details:

1. **Prosci is an example, not a requirement.** "Or proprietary frameworks if fully documented" is explicitly permitted. The bar is documented phases, roles and activities — not a vendor logo.
2. **"Dedicated *or formally assigned*"** is the escape hatch for a small shop. The permitted evidence types — staffing plans, role descriptions, project team structures — are **documents, not payroll records**. Nothing requires exclusivity or an FTE.
3. **Two customers in twelve months**, not a portfolio.

### The Prosci licensing trap

[VENDOR-OFFICIAL, Prosci Single-User License] verbatim:

> "This license is for a single person only and allows you, **as an individual, to apply this content to support change projects in your organization**."
> Prohibited: "Delivery of training workshops or any form of educational program, seminar or meeting using this Content for other employees or any third party" · "Reproduction and distribution of the Content to other employees or a third party."
> Compliance litmus test — you must answer no to: "**Are you creating derivative models or materials from any Prosci materials, tools or models?**"
> "**If this application is used by another company or entity external to your organization, that entity or company must have their own license.**"

Read against an MSP consulting model this is restrictive in exactly the way that matters. A certified employee **can** apply ADKAR thinking to client projects and run assessments where the MSP is the data recipient. The MSP **cannot** hand ADKAR templates to the customer, **cannot** run ADKAR workshops for customer staff, and **cannot** build a branded "our ACM framework" derived from Prosci models — which directly conflicts with the "proprietary framework, fully documented" route if you build it from Prosci parts.

**And a US MSP cannot become a Prosci partner.** [VENDOR-OFFICIAL, Global Affiliate inquiry]: "Prosci currently serves North America, South America, Europe, Australia/New Zealand and Singapore with our direct staff. **We are not currently planning on additional go-to-market partners in these markets.**"

### Cost comparison for satisfying control 3.1

| Route | Year-1 cash | Recurring | Branded client-facing collateral? |
|---|---|---|---|
| Documented proprietary framework (staff time only) | ~$0 | $0 | **Yes, unrestricted** |
| **CCMP** for one lead (non-member) + ACMP membership | **$795 + $199 ≈ $1,000** | $199/yr + 60 PDUs/3yr | **Yes** — ACMP licenses no IP into your deliverables |
| APMG Change Management Foundation + Practitioner | unpublished | 5-yr validity | Likely; terms unverified |
| **Prosci** cert ×1 + Essentials membership | **$4,500 + $499 ≈ $5,000** | $499–$999/yr | **No** — derivative works and third-party delivery prohibited |
| Prosci ×2 + Train-the-Trainer L1 | ~$13,500 | $998–$1,998/yr | Still needs an org licence (price unpublished) |

**CCMP detail** [VENDOR-OFFICIAL, ACMP]: application + exam including one attempt is **$595 member / $795 non-member**; retakes $300/$375; ACMP membership $199/yr. Eligibility is **4,200 hours (3 years) of CM experience** with a degree, or 7,000 hours without, plus 21 hours of aligned training. 150 multiple-choice questions; application review 2–3 weeks typically. ACMP is ANSI/ISO 17024-aligned and explicitly **"separates certification decisions from training"** — no vendor IP lock-in.

**The strongest value play [INFERENCE]:** one CCMP-credentialed lead (~$1,000) as the named-framework anchor, plus a fully documented in-house methodology, two named engagements with real plan/comms/staffing artifacts, and the **free Microsoft Service Adoption Specialist assessment** for two staff as supporting evidence. That satisfies control 3.1 on Microsoft's own terms at roughly 20% of the Prosci path's cost, with no restrictions on your deliverables.

Prosci earns its price only for the research library, the **AI Adoption Focus cohort** ($4,500, 3 days), and the sales halo — because Microsoft does name it: [MS-OFFICIAL, Dynamics 365 implementation guidance] *"**Microsoft uses the Prosci Change Management methodology and tools for its own and external projects**"* and *"Prosci, **Microsoft's preferred approach** and the leading change management certification organization in North America, is generally accepted as the go-to standard practice."* Useful in a sales conversation; not an audit requirement.

### Microsoft's own doctrine supports a blended role

[MS-OFFICIAL, learn.microsoft.com/dynamics365/guidance/implementation-guide/change-management]: *"we believe that change management should be applied **with a sense of proportionality to the risk and complexity**"* and *"we refer to **the person or people** who are responsible for change management as the *change manager*."* Deliberately singular-or-plural, with no headcount implied.

**What the historical bar was:** the retired ACM specialization required only *"at least two individuals who passed the Microsoft Services Adoption Specialist Partner University Assessment"* — a **free** Microsoft assessment. **Microsoft never required Prosci or any external ACM credential.**

### The market pattern for ACM staffing

[COMMUNITY, ZipRecruiter, retrieved 2026-08-28] Change Management Consultant national average **$139,632/yr** (IQR $109,000–$154,500); Organizational Change Management Consultant **$144,851** (IQR $130,000–$168,000). No aggregator publishes a discrete series for an M365-specific change manager — the role resolves to the generic OCM series.

Live postings show the pattern: where consultancies staff ACM they do it **contract, hourly, $55–$70/hr** — subcontracted, not FTE. **No posting from a small Microsoft MSP hiring a dedicated ACM lead was found.** A cheaper adjacent role is being hired — "Microsoft 365 Productivity Trainer" at $36–$46/hr — but that is training delivery, and Microsoft explicitly warns against passing training-and-comms off as change management (the *"We are already doing change management"* trap).

[INFERENCE] At a $139–145K midpoint plus load, a dedicated FTE change manager needs roughly **$180–200K of annual billable ACM revenue** to break even — 1–3 concurrent ACM-billing engagements sustained year-round for a 5–50 person MSP.

### What you can defensibly do [INFERENCE]

**One named person can cover multiple customer projects.** Nothing in control 3.1 requires exclusivity. The role can be **blended with delivery** provided the role description separates ACM duties from technical duties and the project team structure shows the assignment. **The weak point is not the person — it is the paper.** A blended person with a real change management plan, comms plan, staffing plan and role description on two named accounts passes; a dedicated FTE with only a PowerPoint fails.

**Subcontracting ACM is consistent with both the market pattern and the evidence list** — a subcontractor named in a staffing plan satisfies "formally assigned." No clause prohibiting subcontracted delivery personnel appears in the checklist, but the auditor requires "access to the appropriate personnel who can discuss and disclose evidence," so your subcontractor must be available for the four-hour audit. [INFERENCE from absence — confirm with ISSI at scheduling.]

**One caution:** do **not** attribute the term **"success owner"** to Microsoft. It is widespread in partner content but has no first-party Microsoft definition. Likewise, Microsoft publishes no first-party **Copilot Center of Excellence** role structure — CoE appears only as an *example artifact* in audit controls 3.2 and 4.3.

---

## 7. Confidence and caveats

- **Highest confidence** (primary text extracted directly): the Microsoft Learn role catalogue, maturity models, manage/testing checklists, July 2026 Partner Center announcements including the ACM retirement, certification skill profiles, the Purview RBAC matrix, DSPM limits, and the audit-checklist controls.
- **Medium confidence:** the FY26/FY27 Practice Development Guide pillars and the MSP Playbook phases — both blogs are JS-rendered and were read via indexed summaries and a third-party mirror. Verify in Partner Center before relying on them.
- **Vendor-marketing figures** (Cloudiway margins, Inforcer/Pax8 capacity multipliers) are directionally consistent across three independent vendors but are sales copy.
- **The partner skilling playbook PDF is watermarked "Classified as Microsoft confidential"** despite being on a public Microsoft-affiliated CDN.
- **Open item: Prosci/ADKAR commercial-use licensing and pricing** — prosci.com returns 403 to this fetcher. The audit names Prosci/ADKAR as an acceptable framework, so whether a small MSP may use ADKAR materials commercially with clients **materially affects whether it can be named in a packaged offer.** Verify with Prosci directly.
- **Disclosure:** research surfaced copilotplaybook.com (attributed to Ken Lince, TD SYNNEX) — this project's own artifact, excluded from all findings as non-independent.
