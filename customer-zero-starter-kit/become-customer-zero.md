# Become Customer Zero First. Then Sell The Motion.

*Sourced as of June 2026. Microsoft tooling, asset names, and license boundaries move - re-verify before each engagement.*

## Problem Statement

You read the playbook. Now the executive question is: **what do we do Monday morning?** The answer is not "buy licenses and hope." The answer is to become Customer Zero: run the governance, readiness, training, and management motion on your own tenant first, then use the proof to guide your customers.

> "Data oversharing is the single largest data security risk that organizations face when deploying Microsoft 365 Copilot."  
> Zero Trust Workshop AI_047

Microsoft 365 Copilot does not break your permission model; it exposes it. Overshared SharePoint sites, anonymous links, stale guests, unlabeled sensitive files, risky OAuth grants, and unmanaged AI use become business risks once users can ask better questions of the data they already have access to.

## Executive Principles

- **Go first:** your own tenant is the lab, proof point, and first case study.
- **Assign one AI owner:** the person already fielding AI questions should own intake, decisions, evidence, and productization handoff.
- **Pick doers, not titles:** fastest ROI usually comes from people buried in meetings, email, documents, spreadsheets, and customer follow-up.
- **Govern before scale:** assess, restrict, remediate, simulate labels, train, then expand.

## Role Model

| Role | Customer Zero responsibility | Decision rights | What they capture |
|---|---|---|---|
| **AI Owner / Practice Lead** | Owns the internal AI program, evidence library, intake, champion rhythm, and productization handoff. | Approves pilots, escalates risk, decides what becomes repeatable. | Program decisions, use cases, blockers, champion wins. |
| **Executive Sponsor** | Funds the motion, removes blockers, protects training time, and uses proof with customers. | Budget, staffing, risk appetite, commercial packaging. | Executive narrative and investment decisions. |
| **Delivery Consultant / AI Specialist** | Runs assessment, remediation, label simulation, training, and runbook capture. | Technical recommendations and sequencing. | Time-on-task, exact steps, gotchas, before/after deltas. |
| **Tenant / M365 Admin** | Executes privileged changes across Entra ID, SharePoint, Purview, Defender, licensing, and admin settings. | Privileged access, change windows, rollback. | Change log and admin steps to automate. |
| **Security / Compliance Owner** | Approves acceptable use, labels, DLP, shadow-AI decisions, and enforcement timing. | Risk acceptance, sanction/block decisions, exceptions. | Decision logs, AUP rationale, compliance overlays. |
| **Helpdesk / AI Support** | Turns recurring questions into an AI support runbook. | Ticket routing, escalation, support scripts. | FAQ, ticket patterns, training gaps. |
| **Champions / Doers** | Prove ROI through real workflows. | Workflow feedback and practical adoption truth. | Before/after examples, saved time, prompt examples. |

## Fastest-ROI Doers

The main playbook is direct on this point: a common failure mode is giving early licenses to leaders or IT-only pilots instead of the people whose daily work maps directly to Copilot's strengths. Before broad license assignment, run a 30-minute Champion Identification conversation with the business owner or an engaged department head and pick 5-10 Day 1 champions.

The first Customer Zero cohort should include executive sponsorship, success ownership, champions, and early adopters, but the proof comes from the doers: people creating content, analyzing data, managing communications, running meetings, and serving customers.

| Champion profile | First workflow to prove | Evidence to capture |
|---|---|---|
| Account Manager / Outside Sales Rep | Teams transcript to follow-up email and action list. | Follow-up time saved, email quality, proposal draft cycle time. |
| Project Manager / Operations Lead | Recorded standup to meeting summary, assigned actions, and draft status email. | Meeting-prep delta, action-item quality, recurring-meeting pattern. |
| Office Manager / Executive Assistant | Messy brain dump to polished email or agenda. | Reusable prompts, communication examples, adoption objections. |
| HR Manager / People Operations Lead | Job description from a short brief, then onboarding checklist. | Drafting time, review notes, sensitivity concerns. |
| Finance Manager / Controller / Bookkeeper | Anonymized spreadsheet to trends, outliers, and formulas. | Analysis time saved, formula learning, control questions. |
| Marketing Coordinator / Content Owner | Product description to social copy, customer email, and sales-deck slide. | Editing-time delta, brand-review notes, content reuse examples. |
| Meeting-heavy Middle Manager | Missed meeting to decisions, owned actions, and follow-up. | Meeting-load baseline, recap time saved, action completion. |

## 30/60/90 Roadmap

| Timing | Work |
|---|---|
| **Before Day 1** | Assign AI owner, executive sponsor, admin owner, security owner, helpdesk owner, and champions. Create evidence library and capture templates. |
| **Days 1-30** | Run readiness and exposure assessment, capture before-state, identify red zones, create the first scenario deck, and launch champion enablement. |
| **Days 31-60** | Restrict worst sites, remediate oversharing, run label simulation, discover shadow AI, draft AUP, and hold the 30-day usage check-in. |
| **Days 61-90** | Enforce tuned labels, deliver training, run one management cadence, govern first internal agents, and prepare the 60-day ROI conversation. |
| **After 90** | Move to monthly governance, executive reporting, continuous improvement, and service packaging. |

Full Microsoft Copilot Dashboard Business Impact analysis requires at least 65 Copilot users and 65 non-Copilot users. If your firm is smaller, use role-based before/after examples, time-on-task, qualitative feedback, and executive review instead of pretending you have statistically meaningful dashboard depth.

## Assessment Tools

Always start native; layer only when you hit the native ceiling. Purview DSPM for AI now supports native bulk remediation at scale (Azure Feeds, Apr 8 2026), so third-party tools earn their place only when sprawl exceeds the native ceiling, or when the motion requires multi-tenant MSP operation, white-label reporting, multi-AI governance, or deep runtime monitoring.

**Partner-asset caveat:** Re-verify all partner-asset links before any customer proposal: `aka.ms/SOW-Generator`, `aka.ms/MIP-Labeling-Assistant`, `aka.ms/MIP-Industry-OnePagers`, `aka.ms/Deploy-Scripts`, `aka.ms/Github-CopilotCli-Guide`, and the SMB Information Protection asset pack are partner-login-gated and temporary. The Customer Zero sequencing, capture discipline, maturity gate, and GTM ladder are practitioner-consensus synthesis distilled for this motion, not Microsoft doctrine.

### Microsoft-Native Baseline

| Native tool | What it answers | License / boundary | Use it for |
|---|---|---|---|
| **Copilot Readiness report** | Eligibility and base app use. | Admin Center; data can take about 72 hours to populate. | Eligibility and adoption baseline. |
| **Purview DSPM for AI** | Oversharing, unlabeled content, prompt/data exposure. | Richest depth assumes E5 / E5 Compliance. | Exposure baseline and data-risk story. |
| **SharePoint Advanced Management** | Data Access Governance, Restricted Content Discovery, Restricted Access Control. | Included with Microsoft 365 Copilot license in the source guidance. | Worst-site restriction and oversharing triage. |
| **Defender for Cloud Apps** | Cloud Discovery, GenAI category filter, risk scoring. | Full depth generally requires E5 / E5 Compliance; blocking requires Defender for Endpoint onboarding. | Shadow AI inventory and sanction/block decisions. |
| **Secure Score** | Identity and configuration posture. | Included. | Executive baseline and before/after posture tracking. |

### Partner Tool Comparison

Scores are a 1-5 partner-usefulness read for this Customer Zero motion, not an independent benchmark. Where pricing is not publicly stated by the vendor, do not estimate it in a proposal. Native Purview DSPM for AI closes much of the bulk-remediation gap; use third-party tooling only when the delivery model exceeds the native ceiling.

| Tool | Primary job | Explicit Copilot readiness? | Remediation fit | Target size | MSP fit | Public pricing | Overall |
|---|---|---|---|---|---|---|---|
| **Syskit Point** | SharePoint/Teams governance + readiness | Yes - Copilot Readiness Dashboard | 5 | SMB-to-mid | 4 | Not publicly stated (quote) | **4.3** |
| **AvePoint** | Governance + automated remediation + lifecycle | Yes - Copilot Readiness and Sustainable Adoption | 5 | Mid-to-enterprise + MSP | 5 | Not publicly stated (quote) | **4.4** |
| **Cloudiway AI Readiness** | White-label MSP assessment | Yes - AI Readiness / Copilot readiness | 3 | SMB via MSP | 5 | MSP charges client ~$5K-$15K/audit; platform subscription not public | **3.8** |
| **Rencore Governance** | M365 + multi-AI governance | Yes - M365 Copilot Governance | 4 | SMB-to-enterprise + MSP | 4 | Public: ~$0.55-$1.10 / user / month | **4.1** |
| **ShareGate Protect** | Migration heritage + governance/security | Yes - Copilot readiness in Protect | 4 | SMB-to-mid | 3 | Migrate tiers public; Protect "Contact Us" | **3.9** |
| **Varonis** | Data security posture + runtime monitoring | Yes - Varonis for M365 Copilot | 5 | Enterprise / regulated | 3 | Not publicly stated (quote) | **4.3** |
| **LayerX** | Browser / AI-runtime security | Yes - AI/browser data-leak protection | 2 | Enterprise | 3 | Not publicly stated (quote) | **3.4** |
| **UnifyCloud CloudAtlas AI** | Agentic AI build + AI governance | Indirect - AI Guardian shadow-AI/data-leak prevention | 2 | SMB-to-enterprise via partner | 4 | Not publicly stated (Azure Marketplace) | **3.6** |

## Phase Guide

Use this as the operating map: the phase tells the team what decision they are driving, the tools tell them where to work, and the capture column tells leadership what must come back as evidence.

| Phase | Primary tools / accelerants | What they are used for | Evidence leadership expects |
|---|---|---|---|
| **Assessment** | Copilot Readiness report; Purview DSPM for AI; SAM Data Access Governance; Defender for Cloud Apps; Secure Score. | Baseline exposure, eligibility, identity posture, and shadow-AI signal. | Exposure heat map, license boundary, scan limitations, before-state screenshots. |
| **Foundation** | Entra ID; Conditional Access; PIM; SAM Restricted Access Control; Purview; PowerShell Deployment Script. | Harden identity, restrict worst sites, remediate oversharing, land policy floor. | Remediation runbook, `-WhatIf` output, before/after delta, time-on-task. |
| **Pilot / adoption** | Microsoft Scenario Library; Copilot Dashboard / Viva Insights; role-specific prompt guides; Business Case Builder / Value Envisioning where appropriate. | Pick doers, map scenarios, run adoption check-ins, prepare ROI conversation. | Champion roster, prompt guides, workflow proof, adoption blockers. |
| **Shadow AI** | Defender for Cloud Apps Cloud Discovery; GenAI category filter; app risk scoring; Defender for Endpoint if blocking is required. | Discover, sanction/block, protect, govern, and redirect AI demand. | Ranked GenAI app inventory, decision log, AUP starter, redirect comms. |
| **Information protection** | Purview labels; auto-labeling simulation; Guided Labeling Assistant; Industry One-Pagers; SMB Secure by Default label model; MIP SOW Generator. | Design labels, simulate before enforce, train users, package label work. | Taxonomy, simulation log, training deck, user questions, SOW inputs. |
| **Management / agent readiness** | Purview/SAM trend reports; Defender review; Secure Score trend; Copilot Dashboard; helpdesk/SOC patterns; Agent Registry / Agent 365 as maturity requires. | Operate recurring governance, report drift, route support, govern agent requests. | Management cadence, SLA, trend report, agent intake, recurring-service scope. |

### Phase 0: Assess Before You Touch Anything

Microsoft Data Security Index (Jan 2026) reports that "40% of enterprise data-security incidents are linked to AI systems, up from 27% the prior year." Use that as the why-now opener for assessment, not as a substitute for your own tenant evidence. This is Microsoft-commissioned survey data, not an independent study.

- [ ] Run native readiness, Purview DSPM for AI, SAM Data Access Governance, Defender for Cloud Apps Cloud Discovery, and Secure Score.
- [ ] Document tenant size, license mix, E3/Business Premium vs E5 depth boundary, and scan limitations.
- [ ] Capture screenshots and exports before remediation.
- [ ] Create a one-page risk heat map for leadership.

Done when a dated before-state exists for overshared sites, EEEU-configured sites, anonymous links, stale guests, unlabeled sensitive data, Secure Score, label coverage, and GenAI app inventory.

Tools in this phase: Copilot Readiness report; Purview DSPM for AI; SharePoint Advanced Management Data Access Governance; Defender for Cloud Apps Cloud Discovery; Secure Score. Use a third-party assessment tool only if native reporting cannot support the delivery motion you need.

People: Lead is your AI owner with your tenant/M365 admin. Accountable is your executive sponsor or partner principal. Consulted are your security/compliance owner and delivery consultant. Informed are helpdesk and champion leads.

Process: inventory first, interpret second, act later. The point is to establish the before-state and decide where risk is concentrated before changing permissions or labels.

Quotable: "Data oversharing is the single largest data security risk that organizations face when deploying Microsoft 365 Copilot" (Zero Trust Workshop AI_047).

Ready for next phase: move forward only when the team can name the first sites/users/apps to contain and has preserved the evidence needed to prove the before/after delta.

Capture: exposure heat map, tool-selection memo, scan time-on-task, screenshots, and first list of "fix before scale" items.

### Phase 1: Secure The Foundation In The Right Order

Enforced order: **restrict -> remediate -> label**.

- [ ] Harden identity: MFA, Conditional Access, PIM for privileged roles, and risky OAuth grant review.
- [ ] Use SAM Restricted Access Control on the worst sites first.
- [ ] Disable Everyone Except External Users tenant-wide with `Set-SPOTenant -ShowEveryoneExceptExternalUsersClaim $false` so new broad grants do not keep appearing while cleanup is underway.
- [ ] Remediate existing EEEU grants, broad grants, anonymous links, stale guests, and sensitive libraries.
- [ ] Treat broken inheritance as its own workstream; site owners must decide which unique permissions are legitimate before cleanup is finalized.
- [ ] Only then prepare the label and DLP layer.

PowerShell Deployment Script (`aka.ms/Deploy-Scripts`; public repo GitHub - amirjafarian/SMBBestPracticeTool, `Deploy-PurviewBestPractice.ps1`, MIT, idempotent, `-WhatIf`) *(launched May 18 2026; reviewed with TD SYNNEX May 29 2026; aka.ms link partner-login-gated and temporary)*.

Tools in this phase: Entra ID; Conditional Access; PIM; SharePoint Advanced Management Restricted Access Control; Purview; PowerShell Deployment Script. Run `-WhatIf` before landing the Purview policy floor.

People: Lead is your tenant/M365 admin with your security/compliance owner. Accountable is your AI owner. Consulted are your delivery consultant and affected site owners. Informed are helpdesk and champion leads.

Process: restrict the worst exposure first, prevent new broad grants, remediate the permission model, then prepare labels and DLP. Do not use labels as a substitute for access cleanup. Broken inheritance is not a button-click cleanup; it is often a business-owner decision about whether an exception is valid.

Done when the worst exposure is contained, tenant-level EEEU prevention is in place, structural remediation is underway, broken-inheritance decisions have owners, before/after delta is visible, and temporary restrictions have a planned exit. Restricted is not remediated.

Ready for next phase: move forward when the pilot group can use Copilot without the team knowingly exposing the worst overshared locations or privileged-risk gaps identified in assessment.

Capture: restriction decisions, permission fixes, exception list, `-WhatIf` output, before/after screenshots, elapsed remediation time, and helpdesk issues created by the changes.

### Phase 2: Pilot With Champions And Scenarios

- [ ] Create a scenario deck with 2-3 role-specific use cases from Microsoft Scenario Library and your own champion workflows.
- [ ] Build role-specific prompt guides.
- [ ] Run kickoff, 30-day usage check-in, and 60-day ROI conversation.
- [ ] Log blockers by type: tool, training, data access, policy, confidence, or workflow fit.

Tools in this phase: Microsoft Scenario Library; Copilot Dashboard / Viva Insights; role-specific prompt guides; Copilot Business Case Builder and Value Envisioning Tool from the Modern Work partner portal where appropriate.

People: Lead is your AI owner with champion leads. Accountable is your executive sponsor or practice leader. Consulted are your delivery consultant, helpdesk, and department managers. Informed are your tenant/M365 admin and security/compliance owner.

Process: start with doers most likely to show visible ROI: account managers, project/operations leads, office managers/EAs, HR, finance, marketing, and meeting-heavy managers. Avoid IT-only and leader-only pilots.

Done when every champion has at least one real workflow, one prompt pattern, one before/after example, and one support path. Adoption is a formal deliverable, not an afterthought.

Ready for next phase: move forward when champions are producing real usage questions and the team can distinguish training issues from data-access, policy, or tool-fit issues.

Capture: champion roster, scenario deck, prompt guides, training questions, workflow before/after examples, and ROI conversation notes.

### Phase 3: Discover, Govern, And Redirect Shadow AI

Enforced order: **discover -> block / sanction -> protect -> govern**.

- [ ] Use Defender for Cloud Apps Cloud Discovery and filter Category > Generative AI.
- [ ] Triage per app using SOC 2, ISO 27001, encryption at rest, audit trail, and admin control.
- [ ] Start high-demand consumer AI tools in Monitored/Warn where appropriate, then move to Unsanctioned/Block after 30 days if the risk remains.
- [ ] Pair every block with a sanctioned Copilot path.
- [ ] Customize the Edge block/warn message so it tells users where approved AI work should happen and who to contact for exceptions.
- [ ] Turn decisions into an AI acceptable use policy and support runbook.

LayerX measured that "77% of users paste data into GenAI tools, and 82% of this activity comes from unmanaged accounts." Microsoft 2024 Work Trend Index reports that 78% of AI users bring their own AI to work, rising to 80% at small and medium companies. Vendor-telemetry stats are real but self-selected; treat direction and magnitude as solid, not survey-representative.

Tools in this phase: Defender for Cloud Apps Cloud Discovery; Generative AI category filter; app risk scoring; Defender for Endpoint where blocking is required; Purview DSPM for AI for complementary visibility across Microsoft 365 Copilot and non-Microsoft GenAI prompt/data activity; AI acceptable use policy and redirect communications.

People: Lead is your security/compliance owner with your AI owner. Accountable is your executive sponsor. Consulted are tenant/M365 admin, helpdesk, and delivery consultant. Informed are champions and department managers affected by sanction/block decisions.

Process: discover first, then decide which tools are sanctioned, monitored/warned, blocked, or redirected. Every block needs a sanctioned path and a support message so users are redirected instead of forced back into unmanaged workarounds. The custom block message is not just a control; it is the training moment.

Done when you have a ranked GenAI inventory, sanction/monitor/block decisions, customized redirect messaging, an AI acceptable use policy starter, and a support path for users asking why a tool is blocked or where approved AI work should happen.

Ready for next phase: move forward when the team can explain what AI tools are allowed, what is blocked, what data can be used, and where users should go for approved workflows.

Capture: ranked app list, sanction/block decision log, AI acceptable use policy, redirect comms, and helpdesk scripts.

### Phase 4: Information Protection, Labels, And Training

Enforced order: **design -> simulate -> tune -> enforce -> train**.

- [ ] Start from a lean taxonomy: Public, General, Confidential, Highly Confidential.
- [ ] Use the SMB "Secure by Default" 8-label model where sublabels are needed.
- [ ] Deploy container labels alongside file labels so Teams, groups, and sites can inherit the right protection model.
- [ ] Set a default sensitivity label for new content from Day 1.
- [ ] Run auto-labeling in simulation mode for at least two weeks; tune thresholds and instance counts before enforcement.
- [ ] Test email label behavior so users understand how Copilot respects labeled or encrypted messages.
- [ ] Train users on what each label means, when to use it, Copilot behavior, and what to do when unsure.

Guided Labeling Assistant (`aka.ms/MIP-Labeling-Assistant`) and 5 Industry One-Pagers (`aka.ms/MIP-Industry-OnePagers`). The SMB asset pack launched May 18 2026 and was reviewed with TD SYNNEX May 29 2026; links are partner-login-gated and temporary, verify before a customer proposal.

Use the SMB asset pack as Enable -> Position -> Decide -> Sell -> Deploy. Use GitHub Copilot CLI Quick Guide (`aka.ms/Github-CopilotCli-Guide`), Industry One-Pagers (`aka.ms/MIP-Industry-OnePagers`), Guided Labeling Assistant (`aka.ms/MIP-Labeling-Assistant`), MIP SOW Generator (`aka.ms/SOW-Generator`), and PowerShell Deployment Script (`aka.ms/Deploy-Scripts`). The SMB asset pack launched May 18 2026 and was reviewed with TD SYNNEX May 29 2026; all aka.ms links are partner-login-gated and temporary, verify before a customer proposal.

Copilot respects usage rights; it needs EXTRACT + VIEW rights to use labeled/encrypted content, and output inherits the highest-priority sensitivity label. DKE content is invisible to Copilot.

Tools in this phase: Purview sensitivity labels; container labels; default sensitivity label settings; auto-labeling simulation; email label policy testing; Guided Labeling Assistant; 5 Industry One-Pagers; SMB Secure by Default 8-label model; MIP SOW Generator when packaging the customer offer.

People: Lead is your security/compliance owner with your AI owner. Accountable is your executive sponsor. Consulted are tenant/M365 admin, delivery consultant, department managers, and champions. Informed are helpdesk and all trained users.

Process: design the taxonomy, deploy the container-label and default-label plan, simulate auto-labeling for at least two weeks, tune thresholds, then enforce. Training follows label design so users understand what labels mean, when to use them, and how Copilot behaves with labeled or encrypted content.

Done when the label model is approved, container labels are deployed where needed, a default label is set for new content, auto-labeling has been simulated for at least two weeks and tuned, email label behavior has been tested, pilot users have been trained, and helpdesk has a simple answer path for label confusion, access issues, and Copilot behavior questions.

Ready for next phase: move forward when labels are no longer just a configuration. They must be a trained business behavior with an owner, examples, and a support path.

Capture: taxonomy rationale, container-label decisions, default-label decision, simulation results, threshold changes, email-label testing notes, training deck, user questions, label examples, and customer-safe explanation of Copilot label behavior.

### Phases 5-6: Expand, Manage, And Prepare To Teach Customers

- [ ] Run one full management cadence: exposure review, label review, shadow-AI review, access review, executive report.
- [ ] Define SOC and helpdesk handoff for AI questions, incidents, exceptions, and governance requests.
- [ ] Add quarterly label refresh and retraining to the management cadence so training does not become a one-time event.
- [ ] Package internal artifacts into clean templates.
- [ ] Use at least one anonymized internal proof asset in a real customer conversation and capture what resonated.
- [ ] Move to `build-sellable-services.html` and map each captured artifact to an offer.

Tools in this phase: Purview and SAM trend reports; Defender for Cloud Apps review; Secure Score trend; Copilot Dashboard / Viva Insights; helpdesk/SOC ticket patterns; Agent Registry or Agent 365 when agent governance maturity requires it.

People: Lead is your AI owner. Accountable is your partner principal or executive sponsor. Consulted are security/compliance owner, tenant/M365 admin, helpdesk, SOC owner, delivery consultant, and practice lead. Informed are champions and customer-facing sales/service leaders.

Process: move from project to operating cadence: review exposure, labels, shadow AI, adoption, support tickets, agent requests, and executive reporting on a recurring rhythm. The monthly executive report should be leadable in 30 seconds: one visible delta metric, one risk trend, and one recommended action. This is where the internal motion becomes the managed-service pattern.

Done when you can show the before-state, explain the order of operations, prove the after-state, train a user cohort, operate a recurring cadence, refresh labels/training quarterly, use anonymized proof in a customer conversation, and describe which work becomes fixed-fee vs recurring.

Ready for services: move to the sellable-services guide when you have completed at least one full governance cadence and can show customer-safe proof for assessment, remediation, shadow AI, labels/training, adoption, and management.

Capture: trend report, SLA, recurring tasks, quarterly retraining plan, packaging notes, delivery-readiness gaps, customer-conversation notes, and anonymized proof.

## Training And Enablement

The playbook frames adoption as a formal deliverable: a 30-60-90 day adoption plan with kickoff session, role-specific prompt guides, a 30-day usage check-in, and a 60-day ROI conversation. Training is how you turn secure deployment into changed behavior. Keep label training intentionally simple: why this exists, the four-tier label model, Copilot-specific label behavior, examples, and what to do when unsure.

Build:

- Champion kickoff: prove useful workflows and surface support needs early.
- Role-specific prompt guides.
- Label training with one-line "when to use it" guidance.
- Quarterly refresh for label examples, Copilot behavior guidance, and shadow-AI redirects.
- AI support runbook.

## Agent Creation And Management

The main playbook pushes partners to use Copilot internally and build a small number of real internal agents, such as ticket summarization, proposal drafting, or QBR prep. This guide adds the governance companion: make sure agents inherit identity, permission, lifecycle, monitoring, and evidence discipline.

Agent 365 is real, GA May 1 2026, and solves governance/control-plane problems. It is usually not the near-term priority for most SMBs. It is not included in E3/E5; current packaging cited here is standalone $15/user/month or bundled in E7, with a free Agent Registry for any Microsoft Cloud subscriber. Re-verify pricing and packaging before proposal.

This guide does not rename the governance motion as AgentOps. The playbook covers the broader adoption and agent operating model; this Customer Zero guide covers the governance readiness companion.

## Definition Of Done

- [ ] Your AI owner is formally assigned with decision rights, budget path, and evidence-library ownership.
- [ ] 5-10 Day 1 champions have real workflows, role-specific prompt guides, and captured before/after examples.
- [ ] Assessment baseline and after-state evidence exist for exposure, identity posture, labels, and shadow AI.
- [ ] Oversharing was addressed in the right order: restrict before remediate before label.
- [ ] Tenant-level EEEU prevention is in place, and broken-inheritance exceptions have named business owners.
- [ ] Container labels, default labels, and email label behavior have been addressed alongside file labels.
- [ ] Auto-labeling was simulated for at least two weeks and tuned before enforcement, and users were trained on when to use labels.
- [ ] Shadow AI decisions are documented, with sanctioned paths and customized redirect messaging.
- [ ] At least one full management cadence has run and been reported to leadership.
- [ ] Internal agent requests have a governance intake, access review, and monitoring path.
- [ ] Time-on-task, before/after deltas, decision logs, and anonymized proof are ready for service packaging.
- [ ] At least one anonymized internal proof asset has been used in a live customer conversation.

*Sourced as of June 2026.*
