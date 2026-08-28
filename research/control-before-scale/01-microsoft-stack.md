# The Microsoft Stack for AI Governance Readiness

**Research dossier — 28 August 2026**
Scope: the Microsoft technical stack and assessment mechanics a partner needs to take an SMB customer (25–300 seats) from "shadow AI is everywhere" to "Copilot can be safely switched on."

## How to read the source tags

| Tag | Meaning |
|---|---|
| `[MS-DOC]` | learn.microsoft.com or a Microsoft service description. Page date given. |
| `[MS-BLOG]` | microsoft.com blog, techcommunity, adoption.microsoft.com, Microsoft GitHub org. |
| `[MVP/COMMUNITY]` | third-party. Treat as a lead, not a fact. |
| `[UNVERIFIED]` | could not confirm from a primary source. Flagged explicitly. |

Every Learn page below carries two dates: `ms.date` (the authored/reviewed date) and `updated_at` (last build). I quote `ms.date` unless noted, because it is the date Microsoft claims the content was reviewed.

**Standing caveat on this dossier:** several products in this space renamed or re-packaged between mid-2025 and mid-2026. Where the docs themselves are stale (and some are — see §3), I say so rather than smoothing it over.

---

## 1. Microsoft Purview in 2026

### 1.1 The single most important structural change: DSPM split into "classic" and "current"

Partner guidance written before roughly Q2 2026 refers to "DSPM for AI" as a single solution. That is now wrong. As of 2026 there are **three** Purview posture solutions in the portal navigation:

| Solution name in portal | Status | Doc |
|---|---|---|
| **DSPM** | Current. Covers both traditional apps and AI apps/agents. Adds "data security objectives", AI observability, asset explorer, third-party SaaS/IaaS coverage (GCP, Snowflake, Databricks) and partner integrations (Varonis, Cyera, BigID, OneTrust). | [data-security-posture-management-learn-about](https://learn.microsoft.com/en-us/purview/data-security-posture-management-learn-about) — ms.date 2026-05-01 `[MS-DOC]` |
| **DSPM for AI (classic)** | Superseded. "These improvements won't be added to this classic version." | [dspm-for-ai](https://learn.microsoft.com/en-us/purview/dspm-for-ai) — ms.date 2025-12-15 `[MS-DOC]` |
| **Data Security Posture Management (classic)** | Superseded. | linked from the same page `[MS-DOC]` |

Microsoft publishes a task-mapping article for people who learned the old UI: `learn.microsoft.com/en-us/purview/dspm-task-mapping` `[MS-DOC]`.

**Exact path (current):** Microsoft Purview portal (`https://purview.microsoft.com`) → **Solutions** → **DSPM**.
**Exact path (classic):** Purview portal → **Solutions** → **DSPM for AI (classic)**.
Both paths are stated verbatim in the respective Learn articles `[MS-DOC]`.

Key pages inside current DSPM `[MS-DOC, 2026-05-01]`:
- **Posture** — dashboard, key metrics, 30-day trend, Security Copilot prompts.
- **Objectives** — e.g. *Prevent data exposure in Microsoft 365 Copilot and Microsoft Copilot interactions*, *Prevent oversharing of sensitive data*, *Prevent exfiltration to risky locations*, *Discover sensitive data in your organization*. Each objective bundles the relevant Purview solutions plus one-click policies.
- **AI observability** — inventory of AI apps and agents with 30-day activity, including agents from Microsoft Agent 365.
- **Asset explorer**, **Reports**, **Setup tasks**.
- **Discover → Apps and agents** (top 20 most recently used agents; excludes Agent 365 agents — use AI observability instead).
- **Discover → Activity explorer** (has an **AI activities** tab).
- **Discover → Data risk assessments**.
- **Tasks and actions → Remediation actions**.

### 1.2 What DSPM for AI actually reports

From the classic article, which remains the most detailed description of the mechanics `[MS-DOC, 2025-12-15]`:

- **Reports** grouped as **Copilot experiences and agents** / **Enterprise AI apps** / **Other AI apps**.
- **Activity explorer** events: `AI interaction` (with prompt/response text if you hold the right role), `AI website visit`, `DLP rule match`, `Sensitive info types`. A **Web queries** filter surfaces which interactions hit web grounding.
- **Data risk assessments**. A **default assessment runs weekly, automatically, with no activation needed, over the top 100 SharePoint sites by usage**. First run has a 4-day delay before results appear. Custom assessments take ≥48 hours and results are static — you must re-run to see change. Results expire after 30 days.
- Limits for Microsoft 365 assessments: **max 200,000 items per location**; file counts unreliable above 100,000 per location; **OneDrive not supported for item-level scanning**; **max 10 SharePoint sites for item-level scanning**.
- Item-level scanning and remediation (Resolve / Apply sensitivity label / Notify owner / Remove sharing link) requires a **registered Entra app** with `Application.Read.All`, `Directory.Read.All`, `Files.ReadWrite.All`, `SensitivityLabels.Read.All`, `Sites.ReadWrite.All`, `User.Read.All` and admin consent `[MS-DOC, dspm-for-ai-considerations, ms.date 2026-05-01]`.

**The weekly free default assessment over the top 100 sites is the single highest-leverage free artefact in an SMB engagement.** It requires no add-on beyond the Purview entitlement and no Entra app registration.

### 1.3 DSPM for AI prerequisites — where SMB engagements actually stall

From `dspm-for-ai-considerations` `[MS-DOC, ms.date 2026-05-01]`:

| To see… | You need |
|---|---|
| Copilot & agent interactions | Purview auditing on (default for new tenants); users licensed for M365 Copilot |
| Copilot in Fabric / Security Copilot prompts | Purview data governance **enterprise** version + a collection policy |
| Third-party AI sites (ChatGPT, Gemini, etc.) — sensitive data visibility | **Devices onboarded to Microsoft Purview** (shared onboarding with Defender for Endpoint) |
| Discovery of *visits* to third-party AI sites | **Microsoft Purview browser extension** deployed to Windows users; also required for Endpoint DLP on Chrome |
| AI app monitoring/DLP in Edge | An **Edge configuration policy** to activate Purview integration in Edge |
| Non-Copilot AI apps generally | **Pay-as-you-go billing enabled** for the tenant |
| Entra-registered AI apps | Integration via the **Microsoft Purview SDK** |

Two practical consequences for a 25–300 seat customer:
1. Shadow-AI visibility is **endpoint-dependent, not network-dependent**. Device onboarding + browser extension is the path. That is achievable in an SMB; a next-gen firewall log feed is not required (see §4).
2. **Pay-as-you-go billing must be enabled** before third-party AI app auditing produces anything. This is a commercial conversation, not just a toggle, and it is easy to miss.

### 1.4 One-click / default policies created by DSPM for AI

Reproduced from `dspm-for-ai-considerations` `[MS-DOC, 2026-05-01]`. These carry the literal `DSPM for AI -` name prefix (older tenants may still show `Microsoft AI Hub -`, a residue of the preview name).

**Discovery policies**
- DLP: `DSPM for AI: Detect sensitive info added to AI sites` — Edge, Chrome, Firefox; audit mode; all users.
- IRM: `DSPM for AI - Detect when users visit AI sites`
- IRM: `DSPM for AI - Detect risky AI usage`
- Communication Compliance: `DSPM for AI - Unethical behavior in AI apps`
- Collection: `DSPM for AI - Capture interactions for Copilot experiences` (Fabric, Security Copilot)
- Collection: `DSPM for AI - Detect sensitive info shared with AI via network` — **requires a SASE/SSE integration to be added manually**; useless without one
- Collection: `DSPM for AI - Capture interactions for enterprise AI apps`
- Collection: `DSPM for AI - Detect sensitive info shared in AI prompts in Edge` — audit only, no content capture

**Protection policies**
- DLP: `DSPM for AI - Block sensitive info from AI sites` (Adaptive Protection, block-with-override, test mode)
- DLP: `DSPM for AI - Block elevated risk users from submitting prompts to AI apps in Microsoft Edge`
- DLP: `DSPM for AI - Block sensitive info from AI apps in Edge`
- DLP: `DSPM for AI - Protect sensitive data from Copilot processing`
- Information Protection: default sensitivity labels + policies

Note that several of these **turn on Adaptive Protection automatically** if it isn't already on, using default risk levels for all users and groups `[MS-DOC]`. Tell the customer before you click.

### 1.5 DLP for Microsoft 365 Copilot — the location, and the licensing trap

Doc: [dlp-microsoft365-copilot-location-learn-about](https://learn.microsoft.com/en-us/purview/dlp-microsoft365-copilot-location-learn-about) `[MS-DOC, ms.date 2026-06-10]`.

**Four capabilities**, with supported condition→action pairs:

| Condition | Action | Effect |
|---|---|---|
| Content contains → **Sensitivity labels** | Prevent Copilot from processing content | Item excluded from grounding/summary. **Still appears in citations.** |
| Content contains → **Sensitive information types** | Prevent Copilot… → **Processing prompts** | Copilot refuses to answer the prompt. Preview, rolling out. |
| Content contains → **Sensitive information types** | Prevent Copilot… → **Performing Web Searches** | Blocks external web grounding for that prompt only |
| **Email is received from → External users** | Prevent Copilot from processing content | Excludes external email from grounding — an anti-prompt-injection control. **Preview.** Metadata only; body not inspected |

**Exact configuration path:** Purview portal → **Data Loss Prevention** → **Policies** → **+ Create policy** → **Custom** → **Custom policy** → Locations page → set **Microsoft 365 Copilot and Copilot Chat** to on `[MS-DOC]`.

Constraints worth quoting to a customer:
- The location is **only available in the Custom template**, and selecting it **disables all other locations** in that policy.
- You **cannot** combine `sensitive info types` and `sensitivity labels` conditions in the same *rule* (separate rules in the same policy is fine).
- **Admin units are not supported** for this location.
- Policy changes take **up to four hours** to reach the Copilot experience.
- **DLP cannot scan files uploaded directly into a prompt** — only the typed prompt text.
- In Word/Excel/PowerPoint the policy is **evaluated at file open**; a label applied mid-session takes effect next open.
- Email coverage: **emails sent on or after 1 January 2025 only**. Calendar invites unsupported.

**Roles that can create/edit this policy** `[MS-DOC]`: Microsoft Entra AI Admin; Purview Data Security AI Admin (role) or Purview Data Security AI Admins (role group); Purview Compliance Administrator; Purview Compliance Data Administrator; Purview Information Protection / Information Protection Admin; Purview Security Administrator; Entra Global Admin. Note the AI Admin roles **cannot read prompts and responses**.

**The licensing trap.** The Purview service description `[MS-DOC, ms.date 2026-08-03]` splits this location in two:

| Feature | BB/BS/**Business Premium** | M365 E3/A3/A1/G3/F3/F1 | O365 E3/E1/A3/A1/G3/G1/F3 | M365 E5/A5, **Purview Suite**, M365 E5 IP&G | O365 E5/A5 |
|---|---|---|---|---|---|
| DLP to **restrict Copilot from processing files and emails** | No | No | No | **Yes** | **Yes** |
| DLP to **safeguard prompts** | Yes* | Yes* | Yes* | Yes* | Yes* |

\* "Purview DLP for prompts is available to all users of Microsoft Copilot and Copilot Chat."

**This is the claim most likely to be wrong in existing partner decks.** The famous "exclude labelled content from Copilot" control is an **E5 / Purview Suite** feature. Business Premium and E3 customers get only the *prompt-side* controls. Selling "we'll label your sensitive data and Copilot will skip it" to a Business Premium customer without the Purview add-on is a mis-sale.

The Copilot Control System doc says the same thing in different words: DLP for Copilot is listed under **"optimized" (A5/E5/G5)**, not "foundational" (A3/E3/G3) `[MS-DOC, copilot-control-system/security-governance, ms.date 2026-02-25]`.

### 1.6 Sensitivity labels and auto-labelling

- Copilot honours label encryption via the **EXTRACT usage right** (plus VIEW). Without EXTRACT, Copilot won't return the content `[MS-DOC, ai-microsoft-purview, ms.date 2026-05-27]`.
- **Enable sensitivity labels for Office files in SharePoint and OneDrive** is a prerequisite; without it, "the encrypted files that Copilot and agents can access are limited to data in use from Office apps on Windows" `[MS-DOC]`.
- S/MIME-protected email is never returned by Copilot; password-protected documents can't be accessed unless already open.
- Customer Key / BYOK-encrypted items **are** returned by Copilot.

Licensing, from the Purview service description `[MS-DOC, 2026-08-03]`:

| Capability | Licence |
|---|---|
| **Manual** sensitivity labelling | M365 E5/A5/G5/E3/A3/G3/F1/F3/**Business Premium**, OneDrive P2, EMS E3/E5, O365 E5/A5/E3/A3, AIP P1/P2 |
| **Client and service-side automatic** labelling | M365 E5/A5/G5, Purview Suite, M365 E5 IP&G, O365 E5/A5/G5 |
| Client-side auto-labelling only | EMS E5/A5/G5 |
| Label inheritance input→output for M365 | Any of the manual-labelling SKUs **+ Microsoft 365 Copilot** |

So: **manual labels are in Business Premium; auto-labelling is not.** For an SMB without E5/Purview Suite, your labelling story is manual + default labels + label policies, and your remediation lever is SharePoint-side (RCD, RAC, permissions) rather than Purview-side.

### 1.7 Insider Risk Management, Communication Compliance, Audit, eDiscovery, DLM

| Solution | AI relevance | Licence (per service description, ms.date 2026-08-03) `[MS-DOC]` |
|---|---|---|
| **Insider Risk Management** | `Risky AI usage` policy template — detects prompt injection attempts and access to protected material. Feeds Adaptive Protection and Defender XDR. | M365 E5/A5/G5, Purview Suite (+ variants), M365 E5/A5/F5/G5 Insider Risk Management. **Not in Business Premium base, not in E3.** |
| **Communication Compliance** | Evaluates Copilot prompts/responses for conduct/regulatory violations; pseudonymised by default. | M365 E5 + Copilot; Purview Suite + Copilot; M365 E5/A5/G5; O365 E5/A5/G5. **Optimized (E5) tier.** |
| **Audit** | Copilot/AI interaction logs are **Audit (Standard)** — no extra config needed if auditing is on. | Audit Standard is broadly available. See §1.8. |
| **eDiscovery** | Prompts/responses live in the user's mailbox. Query builder: **Add condition → Type → Contains any of → Edit → *Copilot activity*** | eDiscovery for Copilot content is listed as **foundational (A3/E3/G3)** in the Copilot Control System doc `[MS-DOC]` |
| **Data Lifecycle Management / retention** | Retention policies for Copilot interactions. Older "Teams chats and Copilot interactions" policies must be **split** into separate Microsoft Copilot Experiences policies to appear on the DSPM Policies page. | Retention for Copilot interactions: **M365 E3/E5 + Copilot**, or E3 + Purview Suite + Copilot, or E3 + E5 IP&G + Copilot |
| **Compliance Manager** | AI regulatory templates / assessments | Available to Office 365 and Microsoft 365 licences **including Business Premium**; premium templates vary by agreement |

### 1.8 Audit — what a partner can actually show a customer

Doc: [audit-copilot](https://learn.microsoft.com/en-us/purview/audit-copilot) `[MS-DOC, ms.date 2026-08-26 — the freshest page in this dossier]`.

- Copilot/Cowork/AI interactions are logged **as part of Audit (Standard)**. No extra configuration.
- **But**: audit logs for *non-Microsoft* AI applications are **pay-as-you-go billed**, retained 180 days, logged under `AIAppInteraction` / workload `AIApp`, and some `ConnectedAiAppInteraction` scenarios. "Your enterprise subscription doesn't include audit logs for this type of user interaction."
- Path: **Purview portal → Audit**. Filter on **Activities – operation names**. To find a specific `AppIdentity`, export first and filter offline (the portal can't filter on it).
- Fields that matter for a governance narrative: `AccessedResources` (with `SensitivityLabelId` and `XPIADetected` — a cross-prompt-injection-attack flag), `AISystemPlugin.Id = BingWebSearch` (proves web grounding was used), `AgentId`/`AgentName`/`AgentVersion`, `ModelTransparencyDetails` (model provider/name, e.g. `ModelProvider: Anthropic, ModelName: claude-sonnet-4-6`), `DLPEvaluationDeferred` bitmask (1=prompt, 2=response, 4=grounding, 8=web grounding).
- `RecordType` distinguishes `CopilotInteraction` (Microsoft-built), `ConnectedAIAppInteraction` (registered in your tenant), `AIAppInteraction` (third-party, not deployed by you).

Retention: Audit Premium extends retention and adds "advanced analysis for Copilot audit records"; a footnote confirms Business Premium add-ons "require a Microsoft 365 Business Premium base licence and are capped at 300 seats total" `[MS-DOC]`.

### 1.9 Purview Data Map / Unified Catalog

Relevant only at the margin for this workload. The one hard dependency found: **Copilot in Fabric and Security Copilot monitoring requires the *enterprise* version of Microsoft Purview data governance** (to support the required APIs) `[MS-DOC, dspm-for-ai-considerations]`. For a 25–300 seat M365 customer with no Fabric estate, Data Map / Unified Catalog is out of scope. I found **no** evidence that Unified Catalog is required for Copilot readiness in a pure M365 tenant `[MS-DOC — absence of evidence, stated as such]`.

### 1.10 The Business Premium Purview add-on (the SMB-critical SKU)

The Purview service description now names two SMB SKUs `[MS-DOC, ms.date 2026-08-03]`:
- **Microsoft Purview Suite for Business Premium**
- **Microsoft Defender + Purview Suite for Business Premium**

Footnote 3: *"Add-ons require a Microsoft 365 Business Premium base license and are capped at 300 seats total."* `[MS-DOC]`

This SKU is the single most important commercial fact for a 25–300 seat practice — the seat cap maps almost exactly to the target market. Announcement blog: [Introducing new security and compliance add-ons for Microsoft 365 Business Premium](https://techcommunity.microsoft.com/blog/microsoft-security-blog/introducing-new-security-and-compliance-add-ons-for-microsoft-365-business-premi/4449297) `[MS-BLOG]` — **I could not retrieve the body of this page; the fetch returned title only.** Third-party sources put the Purview Suite for Business Premium at ~US$10/user/month or $120/user/year and say DSPM for AI is included `[MVP/COMMUNITY — oryon.net, 365cloudstore, collabsummit.eu]`. **Treat the price as `[UNVERIFIED]`; confirm in Partner Center price list before quoting.**

Note also **Microsoft 365 E5 Security as an add-on to Business Premium**, which is where Defender for Cloud Apps comes from for an SMB `[MS-BLOG, techcommunity 4388436 — title and search summary only, body not fetched]`.

---

## 2. Oversharing controls: SharePoint Advanced Management

### 2.1 The entitlement change partners keep getting wrong

Doc: [sharepoint-advanced-management-prerequisites](https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-prerequisites) `[MS-DOC, ms.date 2026-06-30]`.

You get SAM capabilities **when any one** of these is true:
1. **At least one user in the organization is assigned a Microsoft Copilot licence.** The user does not need to be a SharePoint admin.
2. Subscription includes SharePoint K/P1/P2 **and** you buy the **SharePoint Advanced Management Plan 1** add-on (a.k.a. "SAM standalone").
3. The org has **Microsoft 365 E7 (The Frontier Suite)** = E5 + Copilot + Entra Suite + Agent 365.

**Base subscription required:** Office 365 E3/E5/A5, or Microsoft 365 E1/E3/E5/A5, or M365 GCC/GCC-H/DoD.

Two things follow that contradict common partner belief:
- **One Copilot licence unlocks the SAM Copilot-support feature set for the whole tenant.** You do not buy SAM per user for these features.
- **Business Premium is not listed as a supported base subscription for SAM.** The prerequisites page enumerates O365 E3/E5/A5 and M365 E1/E3/E5/A5 only. `[MS-DOC]` I could not find a page that explicitly confirms or denies SAM for a Business Premium + Copilot tenant — **`[UNVERIFIED]`, and it matters enormously for the SMB market. Test in a tenant before promising RCD to a Business Premium customer.**

### 2.2 What's included with a Copilot licence vs what needs SAM Plan 1

From [sharepoint-advanced-management-features-copilot-license](https://learn.microsoft.com/en-us/sharepoint/sharepoint-advanced-management-features-copilot-license) `[MS-DOC, ms.date 2026-06-30]` — all rows are Yes across WW/GCC/GCC-H/DoD:

**Sprawl control:** Site ownership policy (simulation + active), Inactive SharePoint sites policy (simulation + active), Site attestation policy (simulation + active).
**Oversharing control:** Content management assessment; Block download policy; Enterprise app insights; SharePoint agent insights ("Get AI insights" button on reports); Conditional Access policies via authentication contexts; **Restricted Access Control (RAC)**; **Restricted Content Discovery (RCD)**; Sharing links report; Sensitivity labels for files report *(requires E5 or G5)*; **EEEU insights**; permission state reports for sites/OneDrive/files; **Site access review for all reports**.
**Content lifecycle:** Catalog management; Change history; Recent admin actions.
**Also:** Compare SharePoint site policies.

**Requires SAM Plan 1 add-on (NOT in the Copilot licence):** [Restricted site creation by apps](https://learn.microsoft.com/en-us/sharepoint/restricted-site-creation-by-apps) `[MS-DOC]`.
Advanced tenant renaming: not available in GCC/GCC-H/DoD; in commercial tenants with >10,000 sites it requires SAM `[MS-DOC]`.

**RBAC roles** `[MS-DOC]`:
- **SharePoint Administrator** — full SPO control.
- **SharePoint Advanced Management Administrator** — SharePoint Admin **plus** viewing metadata (names, paths, URLs) across SharePoint content, removing permissions at scale, and managing SAM features. This is the role to use for a remediation engagement.
PowerShell: always download the latest **SharePoint Online Management Shell** before running SAM cmdlets; remove older versions.

### 2.3 Restricted Content Discovery (RCD)

Doc: [restricted-content-discovery](https://learn.microsoft.com/en-us/sharepoint/restricted-content-discovery) `[MS-DOC, ms.date 2026-07-27]`.

What it does: limits discovery of a site's content — **including recently interacted files** — in org-wide search and Copilot responses, and **removes AI entry points from the site UI**: no Copilot button, no AI actions menu (including agent creation), no "Create pages with AI". A **Restricted** tag shows on the site.

What it does *not* do: change permissions; remove content from the search index; affect site-scoped search, Microsoft 365 Feed, Recommendations, eDiscovery, or auto-labelling.

**Paths:**
- SharePoint admin center → **Sites → Active sites** → select site → **Settings** tab → turn on **Restrict content from Microsoft Copilot** → Save.
- PowerShell: `Set-SPOSite -Identity <url> -RestrictContentOrgWideSearch $true` (`$false` to remove).
- Check status: `Get-SPOSite -Identity <url> | Select RestrictContentOrgWideSearch`
- Tenant report: `Start-SPORestrictedContentDiscoverabilityReport`, then `Get-SPORestrictedContentDiscoverabilityReport`, then `-Action Download -ReportId <GUID>`.
- **New in 2026 — delegation to site admins:** `Set-SPOTenant -DelegateRestrictedContentDiscoverabilityManagement $true`. Off by default. When on, site admins can toggle RCD for their own sites and **must supply a justification**, which is audited. `[MS-DOC]`

**Propagation latency is the operational gotcha:** *"For sites with more than 500,000 items, an update to Restricted Content Discovery could take more than a week to fully process and reflect in search and Copilot experiences."* `[MS-DOC]` Plan RCD as a pre-pilot step, not a same-day fix.

Microsoft's own framing: *"Restricted Content Discovery is designed as a temporary governance control that gives organizations time to review and right-size access while continuing their Copilot deployment."* And: *"Use Restricted Content Discovery selectively. Excessive use can reduce the amount of content available…"* `[MS-DOC]`

**Eligibility:** licensed for Copilot **and** SAM available. Audit events exist for enable/disable/justification via Purview audit log activities.

### 2.4 Restricted SharePoint Search (RSS) — now retiring

Doc: [restricted-sharepoint-search](https://learn.microsoft.com/en-us/sharepoint/restricted-sharepoint-search) `[MS-DOC, ms.date 2026-07-06]`.

> **Important: Restricted SharePoint Search is retiring. Starting July 31, 2026, new enablement is blocked.** Use Restricted Content Discovery instead. `[MS-DOC]`

**This single line invalidates a large amount of 2024–2025 partner guidance.** RSS was the standard "put the brakes on before Copilot" move. As of 28 August 2026 you cannot turn it on in a tenant that doesn't already have it.

For customers who already run it, the reasons to get off it (all `[MS-DOC]`):
- Hard limit of **100 sites** on the allow list (hub sites count as one; associated sites don't count against the limit but are covered).
- It degrades **all** enterprise search, not just Copilot, and for **all** users including non-Copilot users.
- It is **not a security boundary** and changes no permissions.
- It leaks: recently accessed sites, sites shared via Teams or Outlook, and up to the **last 2,000 entities** from frequently visited sites / directly shared files / viewed-edited-created files still surface regardless of the allow list.
- Enabled via PowerShell only; takes effect within an hour.
- Any product with Enterprise Search that can return SharePoint content is affected (Exchange, To Do, Planner, Loop…).

Microsoft's recommended sequence: use RSS temporarily → use SAM to find and fix oversharing → use Purview for labels/DLP/audit → **disable RSS** → tell agent owners and IT that responses will change.

### 2.5 Data Access Governance reports and site access reviews

Doc: [data-access-governance-reports](https://learn.microsoft.com/en-us/sharepoint/data-access-governance-reports) `[MS-DOC, ms.date 2026-07-09]`.

**Path:** SharePoint admin center → **Reports** → **Data access governance**.

| Type | Reports |
|---|---|
| **Snapshot** | Site permissions across your organization (recommended starting point); Site permissions for users; Sites and files shared via special SharePoint groups (EEEU/Everyone — item-level, scriptable cleanup); Sensitivity labels for files |
| **Activity (last 28 days)** | Sharing links; Shared with 'Everyone except external users' |

Cadence Microsoft recommends: snapshot **quarterly**, activity **monthly** `[MS-DOC]`.

**The E5-without-SAM footnote is important:** *"IT administrators with Microsoft 365 E5 licensing can access Data access governance reporting, but can't view or use the other SharePoint Advanced Management features. The reports don't provide snapshot reports or remedial actions. Activity reports are available but can return only up to 10,000 sites."* `[MS-DOC]` So E5 alone gets you activity reports with no remediation; the Copilot licence is what unlocks snapshots and actions.

**Without SAM you must first enable data collection** for activity reports: data stored 28 days, reports appear 24 hours after enabling, only forward-looking, and collection **pauses after 3 months** with no reports generated `[MS-DOC]`.

**Known blocker:** reports may fail if the tenant is set to non-pseudonymised report data. Fix: **Microsoft 365 admin center → Settings → Org settings → Reports** → clear **Display concealed user, group, and site names in all reports** (Global Administrator only) `[MS-DOC]`. Note this is the *inverse* of the usual advice — you must leave names concealed.

**Site access reviews** — [site-access-review](https://learn.microsoft.com/en-us/sharepoint/site-access-review) `[MS-DOC, ms.date 2026-07-09]`:
- Path: SharePoint admin center → **Reports → Data access governance** → **View reports** → select sites → **Initiate site access review** → **Customize and preview email** → **Send**.
- **Up to 100 sites at a time from the web UI**; more via PowerShell.
- **Cap of 1,000 site access reviews per calendar month** from the Site permissions across your organization report.
- Supported for: sharing link reports, EEEU reports, oversharing baseline (permissions) report. **SharePoint sites only — no OneDrive.**
- Tracking: **My review requests** tab on the DAG landing page.
- Site owners reach their queue via the review email, or **site home → gear icon → Site settings → Site reviews**.
- The review email is customisable (from address, title, message, comments, link) — worth doing, because unmodified it looks like phishing.
- Permission counts in the report are **not deduplicated** (a user with direct + group + link access is counted three times). Do not quote these numbers as "number of people with access."

### 2.6 Other SAM levers worth knowing

- **Restricted Access Control (RAC)** — restrict a site (or OneDrive) to members of a security group. Unlike RCD this *does* change effective access. Microsoft positions RAC as the "secure by default at provisioning" control for business-critical sites `[MS-DOC, configure-secure-governed-data-foundation…, ms.date 2026-04-17]`.
- **Content management assessment** — the SAM hub for oversharing assessment; identifies oversized audiences, EEEU usage, broken inheritance, inappropriate sharing, inactive/ownerless sites `[MS-DOC]`.
- **SharePoint Admin Agent** (`/sharepoint/content-governance-agent`) — referenced as a tool for identifying sites needing review `[MS-DOC, restricted-content-discovery]`. Not investigated in depth here.
- **Inactive site policy**, **site ownership policy**, **site attestation policy** — all in simulation and active modes, all covered by the Copilot licence.
- **Microsoft 365 Archive** — Microsoft explicitly recommends it to "store inactive but high-value content at a lower cost **while preventing Copilot from processing or reasoning over it**" `[MS-DOC]`. This is an underused Copilot-scoping control.

---

## 3. Microsoft Entra

### 3.1 Conditional Access patterns for Copilot and third-party AI

The canonical article is [Secure Generative AI with Microsoft Entra](https://learn.microsoft.com/en-us/entra/architecture/secure-generative-ai). **Its `ms.date` is 2025-06-20 and it still describes "Microsoft Purview AI Hub" as "currently in preview" — a name Microsoft retired.** `[MS-DOC, stale]` Use it for the patterns, not for product state.

Patterns it recommends `[MS-DOC]`:
- **Phishing-resistant MFA via authentication strength** for access to gen-AI apps.
- **Insider risk condition** in Conditional Access — block gen-AI app access for users at elevated insider risk, driven by Purview Adaptive Protection. Template: `policy-risk-based-insider-block`.
- **Device compliance condition** — require a compliant Intune-managed device for gen-AI apps.
- **Conditional Access gap analyzer workbook** to find sign-ins/apps not covered.
- At minimum, one policy that **targets all resources**.
- Phishing-resistant MFA on 14 named privileged roles (Global Admin, Application Admin, Authentication Admin, Billing Admin, Cloud Application Admin, Conditional Access Admin, Exchange Admin, Helpdesk Admin, Password Admin, Privileged Authentication Admin, Privileged Role Admin, Security Admin, SharePoint Admin, User Admin).

**The structural limit a partner must state plainly:** Conditional Access can only govern an AI app if the app authenticates through Entra ID. Community and Microsoft Q&A sources note that a user who goes to `chatgpt.com` and picks "Continue with Google" bypasses Conditional Access entirely `[MVP/COMMUNITY — learn.microsoft.com/answers thread]`. For personal-account shadow AI, the enforcement point must be the **endpoint** (Purview Endpoint/Browser DLP + Defender for Endpoint app blocking) or the **network** (Entra Internet Access / a SWG), not Conditional Access.

### 3.2 App governance, consent policies, access reviews, PIM, ID Governance

- **User consent settings and the admin consent workflow** are the front door for third-party AI apps requesting Graph permissions. Configure at Entra admin center → Identity → Enterprise applications → Consent and permissions. Custom **app consent policies** (`permissionGrantPolicies`) let you define which permissions users may consent to `[MS-DOC — configure-user-consent, manage-app-consent-policies, admin-consent-workflow-overview; individual page dates not captured, 2025–2026 range]`.
- **App governance** (Defender for Cloud Apps add-on) — used in the Microsoft-documented flow for blocking unsanctioned AI apps (§4).
- **Access reviews**, **Entitlement Management**, **Lifecycle Workflows**, **PIM** — all standard ID Governance; the PIM **discovery and insights** page surfaces standing Global Admin assignments and privileged service principals `[MS-DOC]`.
- Purview DSPM's **Fabric** oversharing view offers "run an access review in Microsoft Entra" as a remediation `[MS-DOC]`.

For a 25–300 seat customer: Entitlement Management, Lifecycle Workflows and PIM require **Entra ID Governance / Entra ID P2**, which is generally an add-on above Business Premium (which includes Entra ID P1). Access reviews require P2. Scope accordingly.

### 3.3 Agent identity — Entra Agent ID and Microsoft Agent 365

This is the newest and most volatile area, and it is where 2025 guidance is most obviously obsolete.

**Microsoft Entra Agent ID — GENERALLY AVAILABLE.**
[whats-new-agent-id](https://learn.microsoft.com/en-us/entra/agent-id/whats-new-agent-id) `[MS-DOC, ms.date 2026-05-01]`: *"Microsoft Entra Agent ID is now generally available."*

GA scope includes: key concepts; owners/sponsors/managers; design patterns; best practices; agent identity deletion (soft-delete + cascade cleanup); Auth SDK sidecar pattern; token validation in downstream APIs; non-Microsoft agent integration (AWS Bedrock, n8n, GCP); migration guides from custom app registrations and from Copilot Studio agents.
**Still in preview within Agent ID:** the wizard to *create* agent identity blueprints and agent identities in the Entra admin center (`create-blueprint`, `create-delete-agent-identities` are marked **Preview**) `[MS-DOC]`.

Governance (Entra ID Governance extensions) `[MS-DOC]`: access packages for agent identities (OBO and autonomous); sponsor lifecycle workflows; two new lifecycle workflow templates to reassign sponsorship and prevent orphaned agents; end-user "manage your agent identities".

Conditional Access for agents `[MS-DOC]`: dedicated templates — **block access for high-risk agent identities**, **autonomous agent access policy**, **on-behalf-of agent access policy**.

**Important consolidation:** *"agent registry experiences are converging under Microsoft Agent 365… This change gives customers one place to discover and manage all agents, while Microsoft Entra continues to provide the identity foundation through Agent ID."* `[MS-DOC, agent-registry-convergence]`

**Microsoft Agent 365 — GENERALLY AVAILABLE 1 May 2026.**
[Microsoft Security Blog, 1 May 2026](https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/) `[MS-BLOG]`. Control plane to observe, govern and secure agents. **$15/user/month standalone, or included in Microsoft 365 E7.** GA capabilities: discovery of local and cloud-hosted agents (including shadow agents), monitoring across Windows devices/cloud/SaaS, Intune policy-based controls for unmanaged agents, Entra network controls to inspect agent traffic, audit-ready evidence. Defender adds context mapping and runtime blocking; the blog notes context mapping / policy controls / runtime blocking arrived via Intune and Defender **public preview in June 2026** `[MVP/COMMUNITY corroboration; the June-2026 preview detail is from the search summary, not a fetched primary page — treat as `[UNVERIFIED]`]`.

**The Purview service description adds a licensing line partners will trip over:** *"Microsoft Purview security and compliance capabilities for agents on Microsoft Foundry and Entra-connected AI apps will be supported by Microsoft 365 E7 and Agent365 SKUs."* `[MS-DOC, ms.date 2026-08-03]` — i.e. Purview governance of non-Copilot agentic workloads is gated behind E7/Agent 365, which is out of reach for most SMBs.

**Microsoft 365 E7 "The Frontier Suite"** = M365 E5 + Microsoft Copilot + Microsoft Entra Suite + Microsoft Agent 365. Confirmed as a composition by Microsoft Learn `[MS-DOC, sharepoint-advanced-management-prerequisites, 2026-06-30]`. GA 1 May 2026 at $99/user/month `[MVP/COMMUNITY — multiple licensing blogs; price `[UNVERIFIED]` against a Microsoft source]`.

### 3.4 Shadow AI discovery in Global Secure Access

Doc: [concept-shadow-ai-discovery](https://learn.microsoft.com/en-us/entra/global-secure-access/concept-shadow-ai-discovery) `[MS-DOC, ms.date 2026-06-04]`.

Network-based discovery of gen-AI apps, **SaaS MCP servers**, and AI Model Provider frameworks (DeepSeek, Anthropic Claude API). Matches discovered apps against the **Defender for Cloud Apps cloud app catalog** for categorisation and risk scores.

**Path:** Entra admin center → **Global Secure Access → Applications → Insights and Analytics** → use the **Generative AI apps and tools** filter/toggle.
**Role:** **Global Secure Access Log Reader** `[MS-DOC]`.

Complementary feature: **Generative AI Insights** uses TLS inspection and DPI to log **actual prompt content and MCP operations** `[MS-DOC]`.

**Licensing** `[MS-DOC, overview-what-is-global-secure-access, ms.date 2026-04-15]`: Shadow AI discovery is in the **Internet Access** column — i.e. it requires **Microsoft Entra Internet Access** (included in **Entra Suite**, or standalone), **on top of** Entra ID P1/P2. It is *not* available on the free "Microsoft traffic" profile that P1/P2 gives you. Same for TLS inspection, web category filtering, FQDN filtering, threat intelligence, prompt injection protection, and network DLP. Remote network (branch) connectivity requires **≥50 combined P1 + Internet Access licences**. Network controls for agents require an **Agent 365** licence.

**SMB read:** GSA-based shadow-AI discovery is an Entra Suite purchase. For most 25–300 seat customers it is not the first move; Purview endpoint discovery is cheaper.

---

## 4. Microsoft Defender for Cloud Apps

### 4.1 The gen-AI catalog and sanctioning flow

Doc: [manage-generative-ai-apps](https://learn.microsoft.com/en-us/microsoft-365/copilot/manage-generative-ai-apps) `[MS-DOC, ms.date 2026-04-08]`.

**Find AI apps:** Microsoft Defender portal (`https://security.microsoft.com`) → **Cloud apps → Cloud app catalog** → **Category** filter → **Generative AI**. Review risk scores.
**Monitor policy:** create a custom policy, **No template**, severity level 2, condition `Category equals Generative AI`, **Apply to: All continuous reports**.
**Block an app:** **Cloud apps → Cloud discovery → Discovered apps** tab → Category = Generative AI → select app → **… → Unsanctioned**. *"When an app is marked as unsanctioned, it's automatically blocked across devices that are onboarded to Defender for Endpoint."* You can warn-and-educate instead of blocking `[MS-DOC]`.
Then **Cloud apps → App governance → Policies** → custom policy with `Category equals Generative AI` AND `Tag equals Unsanctioned`.

Catalog scale: the base catalog is **31,000–34,000 cloud apps** scored on **90+ risk factors** `[MS-DOC, set-up-cloud-discovery / editions-cloud-app-security-o365]`. Microsoft states it "added more than a thousand generative AI-related apps" to the catalog `[MS-DOC, security-for-ai/discover, ms.date 2025-04-01]`.

Also relevant: DSPM for AI's "Other AI apps" category is defined as *apps detected through browser activity and categorized as "Generative AI" in the Defender for Cloud Apps catalog* `[MS-DOC, ai-microsoft-purview]` — so the MDA catalog is the shared taxonomy across Purview, Defender and GSA.

### 4.2 How discovery data actually gets in — and the SMB problem

Doc: [set-up-cloud-discovery](https://learn.microsoft.com/en-us/defender-cloud-apps/set-up-cloud-discovery) `[MS-DOC — **ms.date 2023-12-20**, one of the stalest pages in this dossier]`.

| Method | What it is | SMB viability |
|---|---|---|
| **Snapshot reports** | Manual one-off upload of firewall/proxy logs | Fine for a point-in-time assessment if a log export exists |
| **Defender for Endpoint integration** | Native; extends discovery beyond the corporate network; enables machine-based investigation | **The realistic SMB answer.** No firewall dependency |
| **Log collector** | Docker appliance receiving Syslog/FTP from your appliance | Needs a device to host it and a firewall that can ship logs |
| **SWG integrations** | Zscaler, iboss, Corrata, Menlo Security | Rare below 300 seats |
| **Cloud discovery API** | Automated log upload + block-script generation | Partner-automation option |

Supported firewalls/proxies include Fortinet FortiGate, SonicWall, Sophos SG/XG/Cyberoam, WatchGuard, Cisco Meraki, Palo Alto, Check Point, Squid, Barracuda and ~30 others `[MS-DOC]`. Note the **data-attribute matrix matters**: e.g. Fortinet FortiGate provides no Target App URL; Check Point provides neither URL nor username; Cisco Meraki provides no username. A discovery report built on a Meraki or Check Point feed **cannot attribute AI usage to users**.

Discovery data is analysed and refreshed **four times a day** `[MS-DOC]`.

**Practical note for SMBs with no next-gen firewall log source:** skip log upload entirely. Use **Defender for Endpoint integration** for MDA discovery, and/or **Purview device onboarding + browser extension** for the Purview-side view (§1.3). Both are endpoint-based and follow the user off-network. This is also what Microsoft's own Zero-Trust security-for-AI guidance assumes: *"If you followed the guidance in Prepare for AI security, you enrolled devices into management with Microsoft Intune, then onboarded these devices into Defender for Endpoint. Device onboarding is shared across Microsoft 365 (including Microsoft Purview) and Microsoft Defender for Endpoint."* `[MS-DOC, security-for-ai/discover]`

### 4.3 Conditional Access App Control (session policies)

Session policies can monitor or block uploads/downloads with content inspection. Documented limits `[MS-DOC, session-policy-aad / caac-known-issues — page dates not captured]`: content inspection only runs on files **<30 MB and <1M characters**; session policies apply to files up to **50 MB**, above which tenant settings decide regardless of policy.

**The gating constraint:** CAAC requires the app to authenticate via Entra ID. It is therefore effective for sanctioned, federated enterprise AI apps (ChatGPT Enterprise SSO, Claude Enterprise SSO) and ineffective against personal-account consumer AI. `[MVP/COMMUNITY + MS-DOC known-issues]`

### 4.4 Licensing — the hard SMB blocker

**Defender for Cloud Apps is not in Microsoft 365 Business Premium and not in Microsoft 365 E3.** It is in M365 E5, M365 E5 Security, EMS E5, M365 F5, or standalone `[MVP/COMMUNITY + Microsoft licensing pages via search; the Defender service description is the authority and I did not fetch it — treat the exact SKU list as `[UNVERIFIED]`, but the Business-Premium/E3 exclusion is consistently stated]`.

For Business Premium customers, the route in is the **Microsoft 365 E5 Security add-on for Business Premium**, which bundles Entra ID P2, Defender for Identity, Defender for Endpoint P2, Defender for Office 365 P2 and **Defender for Cloud Apps** `[MS-BLOG, techcommunity 4388436 — search summary, body not fetched]`.

Note also **Office 365 Cloud App Security**, the subset that ships with some Office SKUs: it discovers only **750+ apps with functionality similar to Office 365**, supports **manual log upload only**, has **no access to the full cloud app catalog**, no app governance, no log anonymisation, and CAAC only for Office 365 apps `[MS-DOC, editions-cloud-app-security-o365, ms.date 2024-11-18]`. **A partner who says "we'll do shadow-AI discovery in Defender" to an Office-365-CAS-only customer is promising something that product cannot do.**

---

## 5. Microsoft-native readiness assessments and reports

### 5.1 Microsoft Copilot Readiness report (M365 admin center)

Doc: [microsoft-365-copilot-readiness](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-365-copilot-readiness) `[MS-DOC, ms.date 2026-04-03]`.

**Exact path:** Microsoft 365 admin center → **Reports** (Show all if hidden) → **Usage** → under **Reports** select **Microsoft Copilot** → **Copilot** → **Readiness** tab (Usage tab alongside).

- Data window: **past 28 days**. Report available within **72 hours**; up to **72 hours latency** thereafter.
- Export: CSV of all users with engagement on Teams meetings, Teams chat, Outlook email, Office docs in the past 30 days.
- Columns: Has Copilot licence; Uses eligible update channel; Uses Teams Meetings / Teams chat / Outlook Email / Office docs; **Suggested candidate for Copilot**.
- **Suggested candidate** = weekly-recomputed **top 25% of non-licensed users** by app-usage intensity over the prior 28 days. **Only available to customers who purchase Copilot licences.** No stack ranking within the 25%. Microsoft states explicitly: *"This data isn't intended to be used to evaluate employee performance."*
- **Privacy default:** usernames, display names, groups and sites are **concealed by default** in usage reports. Un-concealing is a Global Admin action — and remember from §2.5 that un-concealing **breaks SharePoint DAG reports**. Choose one.
- Roles: see "Before you begin" in the [usage reports overview](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/activity-reports) — the readiness article does not restate them `[MS-DOC — role list not captured here]`.

**What this report is not:** it is a *licence-targeting* report (who has the right channel, who uses the right apps). It contains **nothing about data governance readiness**. Partners who present it as "Copilot readiness" are conflating deployment eligibility with safety.

### 5.2 Microsoft Copilot Dashboard (Viva Insights) — and the 50-licence cliff

Doc: [copilot-dashboard](https://learn.microsoft.com/en-us/viva/insights/org-team-insights/copilot-dashboard) `[MS-DOC, ms.date 2026-08-26]`.

- **No paid Viva Insights licence and no Copilot licence is required to view the dashboard.** Available to any M365/O365 business or enterprise customer with an active Exchange Online account.
- Data processing starts once you assign **≥1 Copilot licence** or **≥50 Viva Insights licences**. Processing takes **up to 7 days**.
- Data window: **previous 28 days**, with **up to a six-day delay**.
- Access: the **Viva Insights web app**. Global Administrators also have access; a Global Admin can revoke or org-wide disable.

**The SMB-decisive table** `[MS-DOC]`:

| Copilot licences assigned | What you get |
|---|---|
| **1–49** | Readiness page; Adoption & Impact with tenant-level and group-level metrics and HR filters; Copilot and Copilot Chat insights. **No** agent insights/Agent Dashboard, **no** benchmarks, **no** intelligent summaries, **no** survey sentiment, **no** week/month trendlines, **no** manager group view or delegation, **no** "All" licence-type view |
| **50 or more** | All features |
| **≥50 Viva Insights licences** (any Copilot count) | All features |

**A 25–49 seat Copilot pilot gets a materially reduced dashboard.** Benchmarks and trendlines — the two things an SMB leadership team most wants — are behind the 50-licence line. Say so in the proposal.

Other thresholds: satisfaction rate only renders with **≥30 feedback responses from ≥5 unique users** in the rolling 28 days; group metrics are suppressed below the tenant's **minimum group size** (example given: 10).

Microsoft's own comparison of the two reports: admin center uses rolling 7/30/90/180-day windows and appears within 72 hours; the Dashboard is fixed at 28 days with up to six days' delay — *"differences in each report's prerequisites and time periods might cause data discrepancies"* `[MS-DOC]`.

### 5.3 AI adoption category in Adoption Score

Doc: [ai-adoption-score](https://learn.microsoft.com/en-us/microsoft-365/admin/adoption/ai-adoption-score) `[MS-DOC, ms.date 2026-05-20]`.

**Path:** M365 admin center → **Reports → Adoption Score** → **AI adoption score** → **View details**.
Score = per-user (active days in last 28 ÷ 12) × 100, averaged across licensed users; 100 = every licensed user active ~3 days/week. Counts Outlook, Teams, Copilot Chat, Word, PowerPoint, Excel, OneNote, Loop, including agent use.
Trends: RL28 plus 30/90/180-day.
**If the org enables ≥1 Copilot user, AI adoption is added to the total Adoption Score and the denominator rises by 100** — so enabling Copilot mechanically *lowers* a customer's headline Adoption Score at first. Be ready for that conversation.
Organizational messages require the **Organizational message writer** role. Sentiment survey upload is **Global Administrator only**.

### 5.4 Microsoft Security Dashboard for AI

Doc: [security-dashboard-for-ai](https://learn.microsoft.com/en-us/security/security-for-ai/security-dashboard-for-ai) `[MS-DOC, ms.date 2026-04-28, update-cycle 90 days]`.

**URL: `https://ai.security.microsoft.com`** — a distinct portal, not a blade inside Defender or Purview.

Aggregates Entra + Defender + Purview into: **Overview** (AI risk scorecard + assignable recommendations), **AI inventory** (AI agents from Agent 365; AI models, MCP servers and other AI apps from Defender), **AI risk** (identity/access, data security, cloud security, misconfigurations & attack paths, agents with sensitive interactions). Security Copilot prompts optional.

**Minimum role: Security Reader** — *"the minimum Microsoft Entra role required to view all Security Dashboard for AI data and assign security recommendations."* Explicitly recommended for CISOs. Other roles (AI Administrator, Compliance Administrator, Security Administrator, Global Reader, Agent ID Administrator, Agent Registry Administrator) get partial views; the article carries four permission matrices.

Recommendations can be **assigned to a user or group with a due date and a Teams or email notification**, or **skipped**. This is the closest thing Microsoft ships to a partner-deliverable AI governance workplan inside the product.

**Coverage caveat, straight from the doc:** *"Assets that aren't registered in Microsoft Agent 365 or aren't visible to Microsoft Defender don't appear in the inventory."* For an SMB without Agent 365 and without Defender for Cloud Apps, the AI inventory will be largely empty.

GA/preview status: the Learn page states no preview banner as of ms.date 2026-04-28. A techcommunity post titled "Security Dashboard for AI - Now Generally Available" exists at `techcommunity.microsoft.com/blog/microsoft-security-blog/security-dashboard-for-ai---now-generally-available/4494637` `[MS-BLOG]` — **body not retrievable; GA date `[UNVERIFIED]`.** A third-party source dates public preview to 13 February 2026 `[MVP/COMMUNITY — admindroid]`. Licensing: no additional licence claimed `[MVP/COMMUNITY]`, **`[UNVERIFIED]` against Microsoft**.

### 5.5 "Microsoft Secure Score for AI"

**I found no product called "Microsoft Secure Score for AI."** What exists:
- **Microsoft Secure Score** (Defender portal) — general, not AI-specific.
- **Cloud Secure Score** in Defender for Cloud (`/azure/defender-for-cloud/secure-score-security-controls`).
- The **AI risk scorecard** on the Security Dashboard for AI Overview tab (§5.4).
State this as a gap rather than inventing a product. `[MS-DOC — absence of evidence]`

### 5.6 Purview posture reports

The service description names **Microsoft Purview Posture Reports**: rolling 30-day window; Information Protection reports (label distribution/adoption, auto-labelling coverage, label activity) and DLP reports (most-triggered rules, highest-volume policies, top violators). **Paths:** Purview portal → **Information Protection → Reports**, **Data Loss Prevention → Reports**, or **DSPM → Reports** `[MS-DOC, ms.date 2026-08-03]`.

### 5.7 DSPM for AI permissions — who can see what

Doc: [ai-microsoft-purview-permissions](https://learn.microsoft.com/en-us/purview/ai-microsoft-purview-permissions) `[MS-DOC, ms.date 2026-04-01 — classic version]`.

Full view/create/edit: **Entra Compliance Administrator**, **Entra Global Administrator**, **Purview Compliance Administrator** role group.
View-only: **Purview Security Reader** role group, **Purview Data Security AI Viewer** role, **Entra AI Administrator** role, **Purview Data Security AI Content Viewer** (AI interactions only).

**The critical row:** *"View the prompts and responses within AI Interaction events from activity explorer"* is **✕ for all three admin roles**. It requires **Content Explorer Content Viewer** or **Microsoft Purview Data Security AI Content Viewer**. Likewise, seeing a user's **risk level** in activity explorer requires an **Insider Risk Management Analyst or Investigator** role. Plan the RBAC before the workshop, or the demo will show empty prompt columns.
Also: **Complete "Activate Audit"** requires Exchange role groups (Compliance Management / Records Management / Organization Management), not a Purview role.
**Administrative units:** restricted admins **cannot** create the one-click policies; you must be an unrestricted admin.

---

## 6. Microsoft's own published methodology

### 6.1 The deployment blueprint: Remediate → Guardrails → Regulations

Microsoft's current, named methodology for this workload is **not** "Discover → Protect → Govern." That phrasing belongs to the *security-for-AI* article series. The Copilot-specific blueprint has **three pillars**:

**[Secure & Governed Data Foundation for Microsoft Copilot — Foundational Deployment Guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance)** `[MS-DOC, ms.date 2026-05-06]`
1. **Remediate oversharing**
2. **Set up guardrails**
3. **Meet regulations**

Downloads: PDF `https://aka.ms/Copilot/SecureGovernBlueprintPDF`, PowerPoint `https://aka.ms/Copilot/SecureGovernBlueprintPPT` `[MS-DOC]`. The page also points at the **Microsoft Zero Trust Assessment** (`https://microsoft.github.io/zerotrustassessment/guide`).

The detailed walkthrough is **[Configure a secure and governed foundation for Microsoft Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot)** `[MS-DOC, ms.date 2026-04-17]`. Condensed:

**Step 1 — Remediate oversharing**
- Identify: DSPM data risk assessments + **SAM Content Management Assessment**.
- Interim protection: **RCD** to exclude sites from Copilot discovery; **DLP for Copilot** to exclude labelled content from grounding. Validate via Purview audit that Copilot no longer surfaces the content.
- Fix: site sensitivity labels; remove anonymous/excessive access; rescope sharing links; **SAM site access reviews** delegated to owners; fix broken inheritance; assign owners via site ownership policy.
- **Then remove the interim protections.** Microsoft is explicit that RCD and the DLP exclusion are scaffolding, not the finished building.

**Step 2 — Set up guardrails**
- Secure defaults: **RAC by default at provisioning** for business-critical sites; disable/restrict company-wide sharing groups and Anyone links at tenant level; require site sensitivity labels at provisioning.
- Guardrails: auto-label + default labels; DLP for Copilot on labels; DLP for Copilot on prompt SITs (optionally allow Work IQ grounding but block web grounding); IRM policies + Adaptive Protection.
- Continuous: DSPM Activity Explorer; recurring data risk assessments; IRM and DLP alert review.

**Step 3 — Meet regulations**
- Compliance Manager AI assessments and improvement actions.
- Decide audit log retention; decide Copilot interaction retention/deletion; eDiscovery for Copilot content.
- Data hygiene: SAM inactive site policies; **Microsoft 365 Archive** to shelve inactive content *and keep Copilot out of it*; retention/deletion for files; retention labels + Archive to exclude files from Copilot while preserving them.

Stated licensing for this article: **M365 E3 or E5 (or O365 E3/E5)** + **Microsoft Copilot** + **SAM (included with Copilot)**. The article covers "Purview foundational capabilities included in Microsoft 365 E3" and "mentions optimized features included in Microsoft 365 E5" `[MS-DOC]`. **Business Premium is not named.**

Note the vocabulary shift: this April-2026 article says Copilot "uses **Work IQ** to enhance responses" — new terminology since mid-2025.

### 6.2 The security-for-AI series (Prepare → Discover → Protect → Govern)

`learn.microsoft.com/en-us/security/security-for-ai/` — [prepare](https://learn.microsoft.com/en-us/security/security-for-ai/prepare), [discover](https://learn.microsoft.com/en-us/security/security-for-ai/discover), [protect](https://learn.microsoft.com/en-us/security/security-for-ai/protect), [govern](https://learn.microsoft.com/en-us/security/security-for-ai/govern) `[MS-DOC]`. **The Discover article's ms.date is 2025-04-01 and it still labels Entra Agent ID as "(Preview)" — stale as of Aug 2026** (see §3.3). Its four-step structure is still useful:
1. Entra Agent ID — visibility into agents from Copilot Studio and Foundry. Path: Entra admin center → **Enterprise applications** → Application type filter → **Agent ID**.
2. Purview DSPM for AI.
3. Defender for Cloud Apps — discover/sanction/block SaaS AI apps.
4. Defender for Cloud CSPM — custom Azure AI workloads (AI BOM, attack path analysis, cloud security explorer queries).

### 6.3 The Purview deployment model: "Prevent data leak to shadow AI"

`learn.microsoft.com/en-us/purview/deploymentmodels/depmod-data-leak-shadow-ai-intro` and steps 1–4 `[MS-DOC, step1 ms.date 2026-03-31]`. **This is the cleanest four-step narrative for an SMB engagement:**
1. **Discover AI apps** — MDA cloud app catalog filter → Generative AI; review risk scores; sanction/unsanction. Plus Purview: IRM policy to detect AI site visits, **Browser Data Security** for sensitive info in Edge prompts, **Endpoint DLP** for paste/upload to AI sites.
2. **Block access to unsanctioned AI apps.**
3. **Block sensitive data going to sanctioned AI apps.**
4. **Govern data sent to AI apps.**

Other named Purview deployment models `[MS-DOC]`: **Secure by default** (`depmod-securebydefault-intro`), and a **DSPM blueprint PDF** at `https://aka.ms/DSPMBlueprintPDF`.

### 6.4 Copilot Control System

`learn.microsoft.com/en-us/microsoft-365/copilot/copilot-control-system/` `[MS-DOC, security-governance ms.date 2026-02-25]`. Three pillars: **Security and governance**, **Management controls**, **Measurement and reporting**. Its **foundational vs optimized** split is the cleanest licensing summary Microsoft publishes:

| | Foundational (A3/E3/G3) | Optimized (A5/E5/G5) |
|---|---|---|
| **Data security** | DAG reports + site access reviews; RCD/RAC; site sensitivity labels; site lifecycle mgmt; DLM; DLP notifications; label-based encryption; **manual** label prompts; DSPM for AI *reports* | DSPM for AI **custom data risk assessments** and policy suggestions; **auto**-labelling; IRM (alerts, sequence detection, Adaptive Protection) |
| **AI security** | Built-in Copilot protections (prompt injection blocking, harmful content blocking, protected material detection); eDiscovery to read prompts/responses; label inheritance to Copilot outputs | **DLP for Copilot** (block processing of labelled files); IRM alerts on risky AI use; Adaptive Protection blocking; Activity Explorer prompt/response/web-query view |
| **Compliance & privacy** | Purview Audit for Copilot; DLM retention for Copilot interactions and Teams recordings/transcripts; eDiscovery holds and search | Communication Compliance; Compliance Manager |

**Path for tenant agent settings:** M365 admin center → **Copilot** → **Settings** (the Copilot Control System), covering agent access, agent sharing, agent publishing `[MS-DOC, copilot-control-system/management-controls]`.

### 6.5 Setup guides, adoption material and the Copilot Success Kit

- **Microsoft Copilot setup guide:** M365 admin center → **Setup** → **Featured collections → Advanced deployment guides & assistance** → **Set up Microsoft Copilot** `[MS-DOC, microsoft-365-copilot-setup / search summary]`.
- **Copilot Success Kit:** `https://adoption.microsoft.com/en-us/copilot/success-kit/` `[MS-BLOG]`. The Adoption Score doc references **"Success Kit (v2.0)"** `[MS-DOC, ai-adoption-score, 2026-05-20]`.
- **Copilot Success Kit for Small and Medium Business:** `https://adoption.microsoft.com/en-us/copilot/smb/success-kit/` `[MS-BLOG]`. Contents (fetched 28 Aug 2026): Implementation Guide; Quick Start Guide for users; **IT Controls Guide**; Checklist for success; Onboarding email templates; **Data readiness blueprint**; "Get started with agents" guide. No version numbers or dates published on the page.
- **Copilot Chat Success Kit:** `https://adoption.microsoft.com/en-us/copilot-chat/success-kit/` `[MS-BLOG]`.
- **Essential guide to Microsoft 365 Copilot adoption** and adoption planning checklist: `https://adoption.microsoft.com/en-us/copilot/essential-guide/` `[MS-BLOG]`.

### 6.6 Microsoft Learn assessments partners can deliver

Two are directly relevant `[MS-DOC — learn.microsoft.com/assessments]`:

| Assessment | URL | Notes |
|---|---|---|
| **Data Security for Copilot for Microsoft 365** | `learn.microsoft.com/en-us/assessments/dde5dcfc-77d3-4f71-aa3f-cc98fa893e99/` | Explicitly **for partners**. Multiple choice/response. Stated duration **5 hours**. Produces personalised curated guidance. Live as of Aug 2026 |
| **AI Readiness Assessment** | `learn.microsoft.com/en-us/assessments/94f1c697-9ba7-4d47-ad83-7c6bd94b1505/` | Found in search; **not fetched** — contents `[UNVERIFIED]` |

### 6.7 Automated Readiness Assessment (ARA) — the partner tool most worth knowing

**Microsoft-published open-source tool:** `https://github.com/microsoft/m365-copilot-automated-readiness-assessment` — *"Data-driven M365 Copilot and Agent 365 deployment readiness assessment — Graph API analysis of tenant, Entra ID, Defender XDR, Purview DLP, Power Platform, Copilot Studio, A365 Agents."* `[MS-BLOG — Microsoft GitHub org]`

Announcement: [Accelerating Microsoft 365 Copilot Adoption with Automated Readiness Assessment](https://techcommunity.microsoft.com/blog/microsoft365copilotblog/accelerating-microsoft-365-copilot-adoption-with-automated-readiness-assessment/4488879) `[MS-BLOG]` — **body not retrievable via fetch; a syndication mirror dates it 27 January 2026 `[MVP/COMMUNITY — azurefeeds.com]`.**

Claimed characteristics `[MVP/COMMUNITY + search summary of the MS blog — treat as `[UNVERIFIED]` pending a read of the repo README]`: runs in minutes; 200+ feature evaluations; modular recommendation engine tailored to the tenant's licences; uses existing M365 admin permissions, no third-party agents, no data export; open source, no licence fee.

**This is the closest thing to a free, Microsoft-authored, partner-deliverable readiness assessment engine that covers governance rather than just licence eligibility.** Read the README and `SECURITY.md` before running it in a customer tenant; verify the Graph scopes it requests.

---

## 7. What changed in 2025 → Aug 2026 that makes older partner guidance wrong

| # | Change | Date / evidence | Why old guidance breaks |
|---|---|---|---|
| 1 | **Restricted SharePoint Search is retiring; new enablement blocked** | **31 July 2026** `[MS-DOC, restricted-sharepoint-search, ms.date 2026-07-06]` | The standard "pump the brakes" step in 2024–25 playbooks is no longer available. Substitute **RCD** |
| 2 | **DSPM for AI became "classic"; a new unified DSPM replaced it** | `[MS-DOC, ms.date 2026-05-01]` | Every screenshot and click path in older decks points at the classic solution. Menu labels, page names and the objectives model all changed |
| 3 | **"Purview AI Hub" name retired** → DSPM for AI → DSPM. Legacy policies keep the `Microsoft AI Hub -` prefix | `[MS-DOC, dspm-for-ai-considerations]` | Searching a tenant for "AI Hub" finds nothing |
| 4 | **SAM entitlement moved: one Microsoft Copilot licence in the tenant unlocks the SAM Copilot feature set** | `[MS-DOC, ms.date 2026-06-30]` | Guidance that says "buy SAM per user for RCD/DAG/site access reviews" is now wrong for Copilot customers. Only *restricted site creation by apps* still needs SAM Plan 1 |
| 5 | **Microsoft Entra Agent ID reached GA** | `[MS-DOC, ms.date 2026-05-01]` | The security-for-AI Discover article (2025-04-01) still says "(Preview)". Anything citing it is stale |
| 6 | **Microsoft Agent 365 GA at $15/user/mo** | **1 May 2026** `[MS-BLOG]` | A whole new governance layer and SKU that didn't exist in 2025 playbooks; agent registry is converging into it from Entra |
| 7 | **Microsoft 365 E7 "Frontier Suite"** (E5 + Copilot + Entra Suite + Agent 365) | GA 1 May 2026, $99/user/mo `[MS-DOC composition; price `[UNVERIFIED]`]` | New top-of-stack SKU changes upsell ladders |
| 8 | **Purview governance for Foundry/Entra-connected agents gated to E7 and Agent 365 SKUs** | `[MS-DOC, service description ms.date 2026-08-03]` | "Purview covers all your AI" is no longer true |
| 9 | **Business Premium security/compliance add-ons: Purview Suite for Business Premium; Defender + Purview Suite for Business Premium — capped at 300 seats** | `[MS-DOC, service description ms.date 2026-08-03]` | This is *new* SMB capability. Guidance saying "SMBs can't get DSPM without E5" needs updating |
| 10 | **New DLP-for-Copilot controls**: block SITs in **prompts** (preview), block SITs from **web search**, block **external email** from grounding (preview) | `[MS-DOC, ms.date 2026-06-10]` | 2024–25 material described only the sensitivity-label exclusion |
| 11 | **RCD delegation to site admins with mandatory justification** | `Set-SPOTenant -DelegateRestrictedContentDiscoverabilityManagement` `[MS-DOC, ms.date 2026-07-27]` | New operating model — site owners, not just SharePoint admins |
| 12 | **Security Dashboard for AI at `ai.security.microsoft.com`** | Learn page ms.date 2026-04-28; GA blog exists `[MS-BLOG]` | A new cross-product portal that did not exist in 2025 |
| 13 | **Shadow AI discovery in Global Secure Access**, plus Generative AI Insights (TLS/DPI prompt logging) | `[MS-DOC, ms.date 2026-06-04]` | New discovery surface — but requires Entra Internet Access, not just P1/P2 |
| 14 | **Copilot Control System** formalised in the M365 admin center with the foundational/optimized split | `[MS-DOC, ms.date 2026-02-25]` | Gives partners Microsoft's own E3-vs-E5 boundary in writing |
| 15 | **Audit for non-Microsoft AI apps moved to pay-as-you-go billing**, 180-day retention | `[MS-DOC, ms.date 2026-08-26]` | "Auditing is included" is now only true for Microsoft AI apps |
| 16 | **Copilot Dashboard opened to tenants with ≥1 Copilot licence** (previously higher thresholds), but the full feature set still needs 50 | `[MS-DOC, ms.date 2026-08-26]` | Both the good news and the cliff are new |
| 17 | **AI adoption category added to Adoption Score**, increasing the total-score denominator by 100 for Copilot-enabled tenants | `[MS-DOC, ms.date 2026-05-20]` | Customers will see their score drop |
| 18 | **"Work IQ"** appears as the grounding-layer name in Copilot docs | `[MS-DOC, ms.date 2026-04-17]` | Terminology drift |
| 19 | **`XPIADetected` (cross-prompt-injection-attack) flag and `ModelTransparencyDetails` in Copilot audit records**; multi-model Copilot (OpenAI / Anthropic model names in audit) | `[MS-DOC, ms.date 2026-08-26]` | New forensic evidence available; also implies Copilot is now multi-model |

---

## 8. SMB deliverability: what is realistically shippable at 25–300 seats

| Capability | Business Premium (base) | BP + Purview Suite add-on | M365 E3 + Copilot | M365 E5 + Copilot |
|---|---|---|---|---|
| Purview Audit for Copilot | Yes (Audit Standard) | Yes | Yes | Yes (+ Premium retention) |
| Copilot Readiness report / Adoption Score | Yes | Yes | Yes | Yes |
| Copilot Dashboard (full features) | Only at ≥50 Copilot licences | ″ | ″ | ″ |
| Manual sensitivity labels | Yes | Yes | Yes | Yes |
| **Auto-labelling** | No | Likely yes (Purview Suite) | No | Yes |
| **DLP: exclude labelled content from Copilot** | **No** | Likely yes (Purview Suite listed) | **No** | **Yes** |
| DLP: prompt-side controls | Yes | Yes | Yes | Yes |
| DSPM / DSPM for AI | No | Yes `[MVP/COMMUNITY — Learn service description has no DSPM section]` | No | Yes |
| Insider Risk Management | No | Yes | No | Yes |
| Communication Compliance | No | Yes | No | Yes |
| eDiscovery for Copilot content | Limited | Yes | Yes (foundational) | Yes |
| Retention for Copilot interactions | Not listed | Via Purview Suite + Copilot | Yes (E3 + Copilot) | Yes |
| SAM (RCD, DAG, site access reviews) | **Unconfirmed — BP not listed as a supported base** | Same question | Yes (with ≥1 Copilot licence) | Yes |
| Defender for Cloud Apps discovery | No | No (needs E5 Security add-on) | No | Yes |
| GSA Shadow AI discovery | No | No | No (needs Entra Internet Access) | No (needs Entra Internet Access) |
| Agent 365 governance | No | No | No | No (separate SKU / E7) |

**Realistic SMB delivery order:**
1. Turn on Purview Audit; confirm it's on. Free everywhere.
2. Run the **M365 admin center Copilot Readiness report** — licence targeting only, 15 minutes.
3. Run **SharePoint DAG snapshot + activity reports** and the **SAM Content Management Assessment** — needs ≥1 Copilot licence (and, unresolved, a supported base SKU).
4. Delegate **site access reviews** to site owners with a customised email. This is the highest-value, lowest-cost oversharing remediation in the whole stack.
5. Apply **RCD** to the worst sites as scaffolding — expecting up to a week of propagation on large sites.
6. Onboard devices to Defender for Endpoint / Purview and deploy the **Purview browser extension** for endpoint-based shadow-AI discovery. Do **not** promise firewall-log-based discovery.
7. Only then discuss the **Purview Suite for Business Premium** add-on (or E5) if the customer needs auto-labelling, DSPM, IRM, or DLP-for-Copilot label exclusion.
8. Run **ARA** from the Microsoft GitHub repo for a data-driven gap report — after reading its README and verifying the Graph scopes.

---

## 9. Open questions I could not resolve

1. **Does SharePoint Advanced Management work on a Microsoft 365 Business Premium base subscription with a Copilot licence?** The prerequisites page lists only O365 E3/E5/A5 and M365 E1/E3/E5/A5 as supported bases. This is the single most consequential unknown for a 25–300 seat practice — RCD, DAG snapshots and site access reviews all hang off it. **Must be tested in a live BP tenant.**
2. **Exact price and contents of the Purview Suite for Business Premium and Defender + Purview Suite for Business Premium add-ons.** Learn confirms they exist and are 300-seat capped; the techcommunity announcement body was unretrievable. Third-party pricing (~$10/user/mo) is unverified.
3. **Whether DSPM (current) and DSPM for AI are actually included in the Purview Suite for Business Premium.** The Purview service description has **no DSPM section at all** — it covers Audit, Collection Policies, Comms Compliance, Compliance Manager, Customer Key/Lockbox, Data Connectors, DLM, all the DLP variants, eDiscovery, agentic workloads, Information Barriers, Information Protection, IRM, and Posture Reports, but not DSPM. A Microsoft Q&A thread ("DSPM for AI with Business Premium Add-On") exists but I did not read it.
4. **GA date and licence requirements for the Security Dashboard for AI.** Learn page shows no preview banner; the "Now Generally Available" blog body was unretrievable.
5. **Defender for Cloud Apps licence matrix** — I did not fetch the Microsoft Defender service description. The Business Premium / E3 exclusion is consistently reported but not confirmed from that primary source.
6. **The Agent 365 June-2026 Intune/Defender preview capabilities** — from a search summary only.
7. **Whether Purview's third-party AI site monitoring still requires the browser extension on Windows only**, and what the current supported-browser matrix is. The extension requirement is stated for Windows + Chrome; macOS/Firefox coverage unverified.
8. **The exact admin role list required to view M365 admin center usage reports** — the readiness article defers to the usage reports overview, which I did not fetch.
9. **Contents and target audience of the Microsoft Learn "AI Readiness Assessment"** (`94f1c697-…`) — found but not fetched.
10. **Whether the Purview Data Map / Unified Catalog has any required role in Copilot readiness for a pure M365 tenant.** I found only the Fabric/Security-Copilot enterprise-data-governance dependency. Absence of evidence, not evidence of absence.
11. **Microsoft's current position on `set-up-cloud-discovery`** — that page's ms.date is 2023-12-20. Whether the supported-appliance list and the four-times-daily refresh cadence still hold in 2026 is unconfirmed.
12. **Whether the "Discover → Protect → Govern" phrasing is still Microsoft's live framing** or has been superseded by "Remediate → Guardrails → Regulations" for Copilot specifically. Both article sets are live; the security-for-AI set is visibly stale (2025-04-01).
