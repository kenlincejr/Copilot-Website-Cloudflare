# 11 · Who delivers this, and what it actually takes to stand up Purview

**Compiled 2026-08-28.** Read alongside [`01-microsoft-stack.md`](01-microsoft-stack.md) and
[`04-partner-program.md`](04-partner-program.md); this dossier does not restate either.

Tags: `[MS-DOC]` · `[MS-CRED]` · `[MVP/PRACTITIONER]` · `[JOB-MARKET]` · `[VENDOR]` · `[UNVERIFIED]`

**Standing caution: rate data in the MSP channel is bad data.** Almost every "rate card" on the
open web is a lead-generation asset. Each is labeled with what it actually is.

---

# TOPIC A — Who delivers this work

## A1. Five roles, and how few people they collapse into

In an enterprise SI these are five people. In a 25–300 seat partner they are **one and a half**.
Naming them separately still matters — it tells the partner which *hats* they are failing to wear.

**1. Modern Work / M365 architect.** Owns the tenant. Does the pre-work nobody bills for:
enabling sensitivity labels for SharePoint and OneDrive, turning on auditing, cleaning up
sharing links, resolving licensing. A *generalist* role, and that is the trap — the M365
consultant thinks Purview is another admin center.

**2. Purview / information protection specialist.** Microsoft's own SC-401 audience profile is
the cleanest published description of this role:

> "As an Information Security Administrator, you plan and implement information security of
> sensitive data by using Microsoft Purview and related services... and protecting data used by
> AI services... You work with other roles that are responsible for governance, data, and
> security to evaluate and develop policies..."
> `[MS-CRED]` https://learn.microsoft.com/en-us/credentials/certifications/information-security-administrator/ · Last Updated 2026-07-28

**Note the second half. Microsoft's own description of this role is half technical, half
stakeholder facilitation.** That is the part partners skip.

**3. Security consultant / SecOps analyst.** Owns Defender XDR, Defender for Cloud Apps,
incident response, and the shadow AI discovery half. Distinct from #2 because the skill is
*detection and response*, not *classification and policy*. **SC-200's 2026 refresh added "AI
agents and Copilots" to the familiarity list** — Microsoft has folded AI into the SOC profile.

**4. vCISO / governance advisor.** Owns the *conversation*, not the console. Runs the
classification workshop, chairs risk decisions, signs the attestation letter, holds the
quarterly review that becomes the MRR. No Microsoft certification maps cleanly; SC-100 is
closest.

**5. Adoption / change manager.** Owns end-user comms, labeling training, the help page behind
the "Learn More" link, and the false-positive feedback loop. Microsoft's secure-by-default
deployment model devotes a whole section to "Train users on managing exceptions."
**Program note: the Adoption and Change Management specialization is gone.** The work did not
go away; the badge did.

### How the roles map onto the engagement

| Phase | Primary | Secondary |
|---|---|---|
| Discovery / shadow AI scan | Security consultant | M365 architect |
| Licensing and tenant prerequisites | M365 architect | — |
| Classification workshop | **vCISO / governance advisor** | Purview specialist (in the room, taking notes) |
| Label taxonomy build + publish | Purview specialist | — |
| Auto-labeling simulation + tuning | Purview specialist | M365 architect |
| DLP authoring, audit-mode, tuning | Purview specialist | Security consultant |
| User comms + training | Adoption manager | vCISO |
| Ongoing governance review (the MRR) | vCISO | Purview specialist |

**The single most common partner failure is putting the M365 architect in the chair meant for
the vCISO** — running the classification workshop as a config session. It is not a config
session.

---

## A2. Certifications — status verified August 2026

| Credential | Status | Covers | Source |
|---|---|---|---|
| **SC-400** Information Protection and Compliance Administrator | **RETIRED 2025-05-30.** Certification *and* renewal assessment retired; page is `hidden: true`, `noindex`. | superseded | `[MS-CRED]` |
| **SC-401 Information Security Administrator Associate** | **LIVE.** Replacement for SC-400. Skills refreshed **2026-07-28**. | 3 domains at 30–35% each: implement information protection · implement DLP and retention · manage risks, alerts and activities. **Includes an explicit "Protect data used by AI services" objective covering DSPM for AI prerequisites, roles, policies and monitoring.** 100 min, 700 to pass. | `[MS-CRED]` |
| **SC-200** Security Operations Analyst | **LIVE.** Renewal 12 months. | Security ops environment · incident response · threat hunting. KQL required. **AI agents/Copilots added to familiarity list.** | `[MS-CRED]` |
| **SC-300** Identity and Access Administrator | **LIVE.** Updated 2026-04-27. | Identities · authentication and access · workload identities · identity governance | `[MS-CRED]` |
| **SC-100** Cybersecurity Architect Expert | **LIVE**, no retirement date. Updated 2026-07-28. | Includes GRC design. Expert-level; a prior associate cert strongly encouraged. | `[MS-CRED]` |
| **MS-102** Microsoft 365 Administrator | **RETIRING 2026-11-30.** | Tenant 10–15% · Entra 25–30% · Defender XDR 35–40% · **Purview compliance 15–20%** | `[MS-CRED]` |
| **Applied Skills APL-5003** — Implement information protection and DLP by using Microsoft Purview | **LIVE.** Lab assessment. **72-hour cooldown between lab launches.** | Four hands-on tasks: custom SIT · create and publish a sensitivity label · auto-labeling policy · DLP policy | `[MS-CRED]` |
| **APL-4002** Prepare security and compliance to support M365 Copilot | **RETIRED** per the July 2026 specialization change | — | dossier 04 |

### Three corrections partners keep getting wrong

1. **"Get your team SC-400" is dead advice.** Retired 30 May 2025. The replacement is SC-401.
2. **MS-102 is a wasting asset** — retires 30 Nov 2026, and was already removed from the Copilot
   specialization requirements in July 2026.
3. **SC-401 is the single most on-target credential for this motion, and it is new.** A partner
   with nobody holding SC-401 has nobody credentialed for the work they are selling.

**Exam cost: `[UNVERIFIED]`.** Microsoft publishes no price to unauthenticated fetches — only
*"Price based on the country or region in which the exam is proctored."* Third-party prep sites
state US$165 for SC-401/SC-300, consistent with the long-standing associate price. **Treat as
directional; confirm at booking.** Microsoft also runs an Exam Replay offer.

**Study time: `[UNVERIFIED]` — Microsoft publishes no estimate and I will not invent one.**
What is documented and usable: every exam is 100 minutes at 700 to pass; **renewal is annual,
free, and by online assessment on Microsoft Learn, not a re-sit** — so the ongoing cost of a
certified bench is time once a year at zero exam fee; and a failed Applied Skills lab costs
three days, not three months. **State study time as a range the partner sets, or omit it.**

---

## A3. Team shape — can one person do it?

**One person can *configure* it. One person cannot *deliver* it.** The evidence is structural.

**From Microsoft's permission model.** Two documented traps that cost a day each:
- *"Viewing file contents in the source view requires the Data Classification Content Viewer
  role... **Global admins don't have this role by default**."*
- *"Turning a policy from Ready to turn on to On requires Compliance Administrator or Compliance
  Data Administrator."* Without one, **Turn on policy is greyed out even after a successful
  simulation.**
`[MS-DOC]` apply-sensitivity-label-automatically · ms.date 2026-08-10

**From Microsoft's deployment guidance.** *"A successful strategy to deploy sensitivity labels
for an organization is to create a working virtual team that identifies and manages the business
and technical requirements, proof of concept testing, internal checkpoints and approvals, and
final deployment."* `[MS-DOC]` get-started-with-sensitivity-labels · ms.date 2026-04-16.
Microsoft never describes this as a solo admin task.

**From practitioners.** Scopable (2026-07-04) is blunt about the MSP failure mode: labels look
like a small setup task, "but that is how MSPs end up with a labeled mess." Its six phases
require "coordination with business owners across HR, finance, legal, and operations."
`[MVP/PRACTITIONER]` https://scopable.io/blog/purview-sensitivity-labels-msp-clients

### The minimum viable team

| Configuration | Works? |
|---|---|
| 1 generalist M365 admin | **No.** Will build a taxonomy nobody agreed to, publish it, and discover in week 6 that Finance cannot email the auditor. |
| 1 senior who genuinely does both | **Yes at 25–75 seats, with a hard ceiling.** Rare people. Do not scale past ~2 concurrent engagements. |
| **1 senior + 1 technician** | **Yes. This is the answer.** |
| + fractional adoption/comms | The only shape that survives a mandatory-labeling rollout. The comms person can be borrowed. |

### The senior/junior split — decisions vs execution

| Senior owns | Junior owns |
|---|---|
| The classification workshop and everything decided in it | Building labels once the taxonomy is signed off |
| **The encryption decision** on every label | Publishing label policies, setting scope |
| **Label order and priority** | Running the auto-labeling simulation, exporting results |
| The decision to enable co-authoring | Triaging simulation false positives |
| DLP policy intent statements and the leakage-tolerance conversation | Authoring DLP rules to a written intent statement |
| Moving DLP from audit → policy tips → enforce | Monitoring DLP reports, collating false positives |
| The customer report and the attestation wording | Screenshots, evidence capture, tenant config export |

**The rule: the junior may touch anything reversible; the senior signs anything that changes
what a file *is*.** Encryption, mandatory labeling and the co-authoring metadata switch are all
in the second category.

---

## A4. Loaded cost and billing rates

The weakest evidence area in this dossier. Everything below is tagged for what it actually is.

| Figure | What it actually is | Source |
|---|---|---|
| Compliance & Risk Analyst **$95–$145/hr**; Cybersecurity Engineer **$130–$195/hr**; SOC Analyst T3 **$150–$215/hr**; Cloud Architect **$175–$260/hr** | **Staffing bill rates** — what an MSP pays an agency for a contractor. **Not** a services rate. Full table gated. | `[JOB-MARKET]` CRB Workforce 2026 MSP Rate Card |
| Big Four **$400–$650/hr blended**; GSIs **$300–$500**; **freelance/regional $125–$250/hr** | Consultancy's own benchmark, 2026-07-07. **Explicitly excludes** a security/compliance/Purview line. | `[JOB-MARKET]` EPC Group |
| M365 Consultant US avg **$103,425/yr ≈ $49.72/hr**; 75th pct $130,000 | **Salary**, not bill rate. March 2026. | `[JOB-MARKET]` ZipRecruiter |
| MSP Consultant US avg **$97,865/yr**; 75th pct $137,011 | Salary. | `[JOB-MARKET]` Glassdoor |

### How to read this

1. **The channel band is roughly $150–$275/hr for senior SMB security-and-compliance services,
   and it cannot be proven.** What *can* be shown: it sits above the freelance band ($125–$250)
   and below the GSI band ($300–$500), and a cybersecurity engineer costs $130–$195/hr just to
   *rent* — which sets a hard floor, because you cannot bill less than you buy. **Present as a
   bounded inference from two published anchors, not a rate card.**
2. **The loaded-cost math is more defensible than the rate math.** A senior at the 75th
   percentile ($130k) is ~$65/hr base; at a 1.3–1.4× burden that is ~$85–$91/hr fully loaded;
   at 65% utilization the recoverable cost is **~$130–$140/hr**. **A partner billing under about
   $150/hr for senior Purview work is not making money on it.** Show the working.
3. **Do not quote a day rate.** No source publishes an SMB-channel day rate for this work.

### The one hard published services price

`[VENDOR]` **a competing distributor funds a Purview deployment valued at US$3,000**, for partners transacting a
minimum of **15 seats** of Purview Suite for Business Premium, Defender + Purview Suite for
Business Premium, or Purview Suite for E3. Scope: reviewing data lifecycle management, creating
sensitivity labeling policies, classifying baseline data, and deploying DLP policies aligned to
Microsoft best practices. [competitor source withheld] (July 2026)

**This is the most useful single price point in the dossier, for an uncomfortable reason: a
distributor has publicly priced a baseline Purview stand-up at $3,000.** If the partner's quote
is $30,000, they need a story about the other $27,000 — the workshop, the tuning, the exception
handling, the retainer, i.e. everything a competing distributor is *not* doing. It also flags the commoditization
risk to the config work.

Same page: **50% off one-year term on Purview Suite for Business Premium, first-time purchase
only, expiring 2026-12-31.** Cross-check against dossier 02.

---

## A5. The skills gap, and what can be subcontracted

`[MVP/PRACTITIONER]` The best single inventory is Devendra Singh, "Common Microsoft Purview
Deployment Mistakes," 2026-06-05, https://ngcloudsecurity.com/common-microsoft-purview-deployment-mistakes-and-how-to-avoid-them/
— 13 named mistakes. The ones that map onto SMB partner behavior:

| # | Mistake | Why it hits partners |
|---|---|---|
| 1 | **Treating Purview as purely technical.** IT configures in isolation; taxonomies use jargon rather than business risk. | The M365-architect-in-the-vCISO-chair failure, named. |
| 2 | **Skipping data discovery.** Policy before knowing where sensitive data lives. | Partners jump to labels because labels are the visible deliverable. |
| 3 | **Over-engineering labels.** 15+ labels, nested sublabels, legalistic naming. Users then "apply defaults indiscriminately, or choose lowest-restriction options to avoid workflow disruption." | Contradicts Microsoft's own 5×5 guidance. |
| 5 | **Never graduating from audit mode.** "A permanent diagnostic state masquerading as compliance." | The customer is unprotected while believing otherwise. |
| 7 | **Rolling out Copilot before fixing oversharing.** Makes "years of access problems exploitable in seconds through conversational queries." | The thesis of the session. |
| 8 | **Treating Purview as one-time configuration.** | Kills the MRR before it starts. |
| 12 | **Inaccurate testing** — synthetic data only; mistaking audit mode for testing. | Produces the false-positive flood in week one. |

Singh's closing line is the one to steal: *"Microsoft Purview deployment success is a governance
problem, not a technical one. The technology is ready. The governance structure is not."*

`[MVP/PRACTITIONER]` Scopable adds the failure partners are least prepared for: **nobody owns
exceptions.** "When a client asks for external sharing, a vendor cannot open an encrypted file,
or a legacy workflow breaks, the MSP has no decision path." Also: labels become "a false signal"
in environments with poor access controls — labeling a tenant whose permissions have not been
cleaned produces confident-looking nonsense.

`[MVP/PRACTITIONER]` Gravity Union (2025-12-10) names the encryption trap: *"Encrypting all
content under a broad label (e.g. Confidential) by default can break workflows"* — and the
legacy-content trap, where blanket auto-labeling causes over-classification.
https://www.gravityunion.com/blog/purview-sensitivity-labels-rollout-tips

### What can be subcontracted

| Route | What they do | Reality check |
|---|---|---|
| **a competing distributor professional services** | Baseline Purview deployment: DLM review, labeling policies, baseline classification, DLP to Microsoft best practice. Funded, valued $3,000, min 15 seats. | **Config layer only.** Does not run the classification workshop, does not own exceptions, does not carry the retainer. |
| **TD SYNNEX** | Achieved Microsoft's **Frontier Distributor** designation, 2026. | Designation confirmed; **the Purview services catalog and pricing is `[UNVERIFIED]`.** Ask your rep. |
| **AvePoint** | Six-phase lifecycle: readiness → risk remediation → data foundation → secure deployment → adoption → continuous governance. Explicit division: **Elements delivers the multitenant operational layer; the MSP delivers advisory, relationship, delivery and outcomes.** "MSPs create value through advisory questions, not licensing transactions." | **Neither AvePoint MSP article contains any pricing, margin, effort or staffing figure.** Do not quote AvePoint economics; there are none published. |
| **FastTrack** | See dossier 04 — 150-seat floor. | That gap *is* this market. |

**The rule: you can outsource the *build* and the *tooling*. You cannot outsource the *taxonomy
decision*, the *exception path*, or the *quarterly review* — and those three carry the margin
and the recurring revenue.** A partner who subcontracts everything has bought a $3,000
deployment and sold a $3,000 deployment.

---

# TOPIC B — Standing up Purview from zero

Partners quote this in days and deliver it in months. Every number below has a Microsoft URL.

## B1. Phase 0 — prerequisites nobody bills for

| Step | Detail | Timing |
|---|---|---|
| **Confirm licensing** | **Client-side *and* service-side auto-labeling require M365 E5 / E5 Compliance / E5 IP&G / AIP P2.** Microsoft states the symptom: *"You have E3 or Business Premium. Auto-labeling of files and emails isn't included at this SKU."* | — |
| **Confirm regional availability** | *"Auto-labeling isn't currently available in all regions because of a backend Azure dependency. If your tenant can't support this functionality, the Auto-labeling page isn't visible."* | — |
| **Assign roles** | Labels need Information Protection Admins. Simulation review needs **Data Classification Content Viewer** — *"Global admins don't have this role by default."* Turning a policy on needs Compliance Administrator or Compliance Data Administrator. | — |
| **Turn on auditing** | Required for simulation and DSPM for AI. Default-on but verify. | — |
| **Enable sensitivity labels for Office files in SharePoint and OneDrive** (`Set-SPOTenant -EnableAIPIntegration $true`) | **The single most important prerequisite.** Until enabled, SharePoint/OneDrive *"can't process encrypted files, which means that coauthoring, eDiscovery, data loss prevention, search, and other collaborative features won't work for these files."* | **"About 15 minutes for the change to take effect."** |
| **Enable PDF support** | Optional. **Warning:** *"Enabling PDF support can increase the number of files that get automatically labeled by existing auto-labeling policies, which support a maximum of 100,000 files a day."* | — |
| **Decide on co-authoring** | A one-way door in the portal — see B5. | **"Wait 24 hours for this setting to replicate."** |

**The retroactivity trap, stated by Microsoft:** *"SharePoint and OneDrive don't support
sensitivity labels if you applied the labels before enabling these services for sensitivity
labels. The labels aren't recognized and if the labels applied encryption, the contents aren't
processed. For the labels and encryption to be supported... download these files and then upload
them to their original location."*

**Order matters. Enable the tenant setting before anyone labels anything.**
`[MS-DOC]` sensitivity-labels-sharepoint-onedrive-files · ms.date 2026-08-07

## B2. Phase 1 — taxonomy and labels

- **Aim for one label policy.** *"Aim to have as few label policies as possible—it's not uncommon
  to have just one label policy for the organization."*
- **Publish to groups, not users.** Mail-enabled security groups, distribution groups, M365
  groups including dynamic membership.
- **Parent labels are being replaced by label groups.** Tenants created on/after **2025-10-01**
  are on the modern label scheme. Label groups carry only name, display name, color, priority
  and description; you cannot publish a label group itself, only labels inside it.
- **Default labels are free scaffolding.** Microsoft auto-creates a default set for new eligible
  customers: Personal · Public · General (\Anyone, \All Employees) · Confidential (\Anyone, \All
  Employees, \Trusted People) · Highly Confidential (\All Employees, \Specific People).
  **A partner who has never done this should start from this list, not a blank page.**

`[MS-DOC]` create-sensitivity-labels · ms.date 2026-05-26; default-sensitivity-labels-policies · ms.date 2026-05-01

## B3. Phase 2 — auto-labeling, and the two kinds

| | **Client-side** | **Service-side** (auto-labeling *policy*) |
|---|---|---|
| Where it runs | In the Office app | In the service |
| App version dependency | **Yes** | No |
| Restrict by location | No | Yes |
| Recommend-a-label | **Yes** | **No** |
| Simulation mode | **No** | **Yes** |
| PDF support | No | Yes |
| Images / OCR | No | Yes |
| Nested AND/OR/NOT, exceptions | No | Yes |
| Label incoming email | No | Yes |
| Replace lower-priority manual label | No | Yes |
| Remove existing label in SPO/OneDrive | No | Yes |

`[MS-DOC]` apply-sensitivity-label-automatically · ms.date 2026-08-10

Two misreads: **service-side Exchange auto-labeling covers mail in transit, not at rest** —
*"For Exchange, it doesn't include emails at rest (mailboxes)."* And service-side **does not
support "recommend"** — *"run the policy in simulation before you turn it on."*

**Simulation is mandatory:** *"You can't automatically label documents and emails, or remove
labels, until your policy has run at least one simulation."*

## B4. Phase 3 — SITs and classifiers

- **Custom SIT regex** must use one primary capturing group, must **not** use `^`/`$` anchors,
  and multiple top-level capturing groups separated by `|` are **blocked during validation**.
- **The recrawl trap:** *"To identify your new custom sensitive information type in existing
  content, the content must be recrawled."* A new SIT does **not** retroactively light up the
  estate.
- **Microsoft Support will not help you write regex.** *"Microsoft Customer Service & Support
  can't assist with creating custom classifications or regular expression patterns."* Price that
  risk in.
- **Trainable classifiers:** custom classifiers are **English only**; *"Retraining published
  custom classifiers isn't supported"* — to improve one you delete it and start over;
  *"Classifiers only work with items that aren't encrypted"*; allow **at least an hour** for a
  seed-data site to be indexed.
- **Not usable everywhere:** *"Automatic labeling isn't supported for Office for the web when the
  conditions include trainable classifiers."*

**For 25–300 seats, custom SITs and custom trainable classifiers are almost always out of
scope.** Built-in SITs and pre-trained classifiers cover the realistic cases; custom work is a
separate, priced, opt-in workstream.

`[MS-DOC]` sit-create-a-custom-sensitive-information-type · ms.date 2026-06-22;
trainable-classifiers-learn-about · ms.date 2026-06-01

## B5. Phase 4 — DLP, audit-first

Microsoft's documented three-stage rollout:

1. **"Run the policy in simulation mode, without Policy Tips"** — assess impact; *"DLP policies
   won't impact the productivity of people working in your organization"*; test your own
   review-and-remediation workflow.
2. **"Run the policy in simulation mode with notifications and Policy Tips"** — begin teaching
   users; link to an organization policy page; *"ask users to report false positives."* Move here
   *"once you have confidence that the results of applying the policies match what the
   stakeholders had in mind."*
3. **"Start full policy enforcement"** — and keep monitoring.

`[MS-DOC]` dlp-overview-plan-for-dlp · ms.date 2026-06-26

**Microsoft publishes no duration for any of the three stages.** What it gives you is the exit
criterion for stage 2, which is a judgment call, not a clock — and that is the honest thing to
tell a customer.

Also from the planning doc: Microsoft's own split of motivation is *"85% regulatory and
compliance protection, and 15% intellectual property protection"*; the **"tolerance for
leakage"** conversation with a worked example of zero-leakage demands colliding with a real
audit process; and **Fabrikam**, Microsoft's own 18-person startup persona with a prescribed
approach (default Teams DLP policy, restricted-by-default SharePoint, block external sharing,
deploy to Windows devices, block non-OneDrive cloud storage). **That is the closest thing
Microsoft publishes to SMB DLP guidance and it belongs in the guide.**

Rule mechanics: boolean AND/OR/NOT with nested groups; *"All existing Exceptions are replaced
with a NOT condition in a nested group inside of the Conditions"*; and a real gotcha — *"When an
action in Office desktop client apps matches a policy that uses complex conditions, the user will
only see policy tips for rules that use the Content contains sensitive information condition."*
`[MS-DOC]` dlp-policy-design · ms.date 2025-04-08

## B6. Phase 5 — Copilot-specific settings

Microsoft's own sequence `[MS-DOC]` ai-m365-copilot · ms.date 2026-05-01:

1. Confirm auditing (DSPM for AI → Overview → All AI apps → Get Started → *Activate Microsoft
   Purview Audit*).
2. Switch from **All AI apps** to **Microsoft 365 Copilot**; work the three sections — assess and
   prevent oversharing · secure your data in Copilot · discover Copilot activity. **"Wait at
   least a day for data to display."**
3. One-click policies: protect your data with sensitivity labels · detect risky interactions in
   AI apps · detect unethical behavior in AI · **protect items with sensitivity labels from
   Copilot and agent processing**.
4. **"Wait at least a day"**, then read Reports → *Copilot experiences & agents*.
5. Optional: retention label with *"Apply label to cloud attachments and links shared in
   Exchange, Teams, Viva Engage, and Copilot"*; eDiscovery search using *ItemClass* =
   `IPM.SkypeTeams.Message.Copilot.*`.

Two Copilot behaviors that make labeling load-bearing:
- **EXTRACT usage right.** Copilot returns labeled-and-encrypted data only if the user has VIEW
  **and** EXTRACT.
- **Label inheritance.** Copilot in Word/PowerPoint/Outlook inherits the source file's label; with
  multiple sources **the highest-priority label wins**. Copilot Chat displays the highest-priority
  label from the data used.

**This is why label order is not cosmetic** — Copilot's user-facing behavior is driven by your
priority list. Get the order wrong and Copilot tells users the wrong thing about the sensitivity
of their own data.

---

## B7. Effort — the documented clocks

### The waiting periods

| Wait | Documented figure |
|---|---|
| Label and label policy changes to propagate | **"Allow 24 hours."** Group-membership-dependent configurations **"might take 24–48 hours."** |
| Editing an already-published label | **"Allow up to 24 hours."** |
| New default labels visible in Office apps | Four hours; one hour for Word/Excel/PowerPoint on the web; **"up to 24 hours to replicate to all apps and services."** |
| **Microsoft's own safe-publish pattern** | *"Publish new labels to just a few test users first, wait for at least one hour... **Wait at least a day** before you make the label available to more users."* |
| Auto-labeling simulation runtime | **"Can take 12 hours to complete."** |
| New auto-labeling policy locked after creation | **"Policy management is greyed out for roughly 24 hours."** |
| Auto-turn-on if untouched | **7 days** of no edits (25 days initial for customers new since 2022-06-23) |
| Default SharePoint/OneDrive auto-labeling policy | **"waits 25 days before it automatically starts simulation."** |
| Labeling progress reporting refresh | **"Every 48 hours."** |
| Newly added policy location before first crawl | **"Plan for at least 24 hours before you troubleshoot missing labels."** |
| Reindexing after bulk label change (100+ sites) | **"Can take up to several days."** |
| Group membership propagation into policy scope | Minutes to hours for mail-enabled groups; **up to several hours for Entra dynamic groups**. No error surfaced meanwhile. |
| `EnableAIPIntegration` tenant setting | **"About 15 minutes."** |
| Co-authoring tenant setting replication | **"Wait 24 hours."** |
| Container label deletion (SharePoint sites) | **48–72 hours.** Until complete, *"users might not be able to open the content that was previously protected."* |
| Seed-data site indexing before a trainable classifier | **"At least an hour."** |
| DSPM for AI reports | **"Wait at least a day for data to display."** (stated twice) |

### The hard limits

| Limit | Figure |
|---|---|
| Auto-labeled files per tenant **per day** | **100,000** |
| Auto-labeling policies per tenant | **100** |
| Explicit locations per policy in the portal | **100** (>100 sites needs PowerShell + SharePoint adaptive scopes) |
| Files matched in simulation | **4,000,000** — exceed it and *"you can't turn on the policy"* |
| Simulation display / export | 100 items per site displayed; **50,000-record CSV export ceiling** |
| Review pages data window | **Last 30 days** |
| Sensitivity labels per tenant | 1,000+ supported, but **max 500** if the label applies encryption specifying users and permissions |
| Encrypted Office file size in SharePoint | **>12 MB** copied/moved to a different site → SharePoint can no longer process it |
| Content marking strings | Watermarks 255 chars; headers/footers 1,024 — **except Excel, 255 total including invisible formatting codes** |

### Where the time actually goes

Add only the *unavoidable* documented waits for a minimal, clean, single-tenant stand-up with one
auto-labeling policy and one DLP policy:

- Enable SPO/OneDrive labels: 15 min, same-day
- Create + publish labels: **24h**
- Microsoft's safe-publish pattern (pilot → 1h check → **wait at least a day** → widen): **+24h**
- Create auto-labeling policy: **~24h greyed out**
- Run simulation: **up to 12h**
- Review, refine, **rerun**: **+12h** minimum, realistically two or three cycles
- Co-authoring setting if enabled: **24h**
- DSPM for AI reports: **+24h** before there is anything to show
- DLP audit-mode then policy-tip stage: **no documented duration — the variable**

**Floor: roughly 6–10 elapsed working days of pure waiting**, before a single hour of consulting,
workshop, tuning or user comms. **Any project plan that does not contain those waits as explicit
calendar items is wrong on day one.**

`[MVP/PRACTITIONER]` Gravity Union's published phasing is the only practitioner timeline with a
URL and a date: Phase 0 planning/design → **Phase 1 defaults and pilot, months 1–3** → **Phase 2
auto-labeling, months 4–6** → **Phase 3 scaled automation and governance, months 7+**. That is an
enterprise cadence and should be compressed for 25–300 seats — but the shape does not change,
only the duration.

---

## B8. The classification conversation

### How many labels?

The most quotable line in the entire Purview documentation set:

> **"Real-world deployments show that effectiveness is noticeably reduced when users have more
> than five main labels or more than five sublabels per main label. You might also find that some
> applications can't display all your labels when too many are published to the same user."**
> `[MS-DOC]` sensitivity-labels · ms.date 2026-04-15

Restated as a rule in Microsoft's deployment blueprint: **"Keep the list of labels to 5x5
whenever possible."** `[MS-DOC]` depmod-secure-by-default-step1 · ms.date 2026-03-31

Practitioners go tighter for SMB. Scopable: **3–4 labels with clear behavioral differences.**
Gravity Union: **4–5** — "Start simple (e.g. Public, General, Confidential, Restricted)."

**Guide position: at 25–300 seats, four top-level labels, and sublabels only under Confidential.
Anything more is the partner performing thoroughness at the customer's expense.**

### Microsoft's naming guidance

- *"Use common names or terms that make sense to your users."*
- *"Always test and tailor your sensitivity label names and tooltips with the people who need to
  apply them."*
- **"Avoid mixing terms such as Confidential, Restricted, or Internal together — users can find
  it challenging to understand the different meanings of these terms."**
- Tooltips: give specific examples, but *"don't make the tooltip so long that users won't read
  it."*

### The workshop

**Who is in the room.** Microsoft's DLP stakeholder list: regulatory and compliance officers ·
chief risk officer · legal officers · security and compliance officers · business owners for the
data items · business users · IT. **At SMB scale that collapses to: the owner/MD, whoever owns
finance, whoever owns HR, and the person who actually knows where the files are. Four people,
ninety minutes.**

**What they must produce** — stakeholders, not IT:
- the regulations, laws and industry standards the organization is subject to
- the categories of sensitive items to be protected
- the business processes they are used in
- the risky behavior that should be limited
- **the priority order** — which data gets protected first
- **the DLP match review and remediation process** — who handles an alert

**The killer question**, named by Microsoft: **"What is your organization's tolerance for
leakage?"** — with a worked example of a legal team demanding zero leakage while internal
auditors must legitimately share card numbers with external auditors, resolved by an explicit,
business-signed acceptable level.

**The output artifact — Microsoft's policy intent statement.** *"You should be able to summarize,
in a single statement, the business intent for every policy you have."* Their example:

> *"We're a U.S. based organization, and we need to detect Office documents that contain
> sensitive health care information covered by HIPAA that are stored in OneDrive/SharePoint and
> to protect against that information being shared in Teams chat and channel messages and
> restrict everyone from sharing them with unauthorized third parties."*

Each clause maps to a config decision: what to monitor · policy scoping · where to monitor ·
conditions · actions. **This is the deliverable of the workshop — a page of intent statements the
customer signs, from which the junior builds.** It is also the artifact that makes the engagement
defensible when someone later asks why a policy exists.

### What goes wrong

**Skipped:** taxonomy built on technical jargon; no owner for exceptions; labels become "a false
signal" over uncleaned permissions; policies nobody can explain six months later.

**Over-engineered:** 15+ labels with nested sublabels; users "ignore them, apply defaults
indiscriminately, or choose lowest-restriction options to avoid workflow disruption." Microsoft's
own warning reinforces it: *"without user training, these settings can result in inaccurate
labeling. In addition, unless you also set a corresponding default label, mandatory labeling can
frustrate your users with the frequent prompts."*

---

## B9. The traps — mostly irreversible, ordered by cost

### 1. Encryption decisions lock content
- **Deleting an encrypting label archives its protection template.** *"Because of this archived
  protection template, you can't create a new label with the same name."*
- **Deleted labels display as GUIDs** in content and activity explorer.
- Deleting a label applied to a SharePoint/OneDrive document strips label and encryption on
  download — but the same document stored *outside* SharePoint stays encrypted. **Two different
  outcomes for the same action.**
- **Never make an encrypting label the default for documents** — *"It's usually not a good idea"*
  because of external sharing.
- Microsoft's own blueprint hedges: it recommends `Confidential\All Employees` as the document
  default but adds **"(note: encryption of labels can be implemented later)"** and provides a
  dedicated **`\Internal exception`** sublabel *"for situations where encryption is impacting
  daily operations."*

**Ship the label without encryption first; add encryption as a second, separately-communicated
change.**

### 2. Co-authoring is a one-way door in the portal
- *"After you enable co-authoring... **you can't disable this setting in the Microsoft Purview
  portal**. This action is supported only by using PowerShell."*
- It **changes where labeling metadata lives**. *"Don't enable this setting if you use any apps,
  services, scripts, or tools that read or write labeling metadata to the old location."*
- Turning it off again: *"this labeling information for unencrypted Word, Excel, and PowerPoint
  files **will be lost**."*
- Documented breakage: labeled documents appearing unlabeled; out-of-date labels; co-authoring
  failing in unsupported clients; **Exchange mail flow rules keyed on labels-as-custom-properties
  failing to encrypt, or incorrectly encrypting.**
- **Co-authoring and AutoSave are not supported at all** when a label sets *"User access to
  content expires"* to anything other than Never, or uses Double Key Encryption.

**The trap most likely to burn a partner who "just turned everything on."** It requires an
app-and-tooling inventory *before* the switch, and SMB tenants are exactly where undocumented
scripts and third-party add-ins live.
`[MS-DOC]` sensitivity-labels-coauthoring · ms.date 2026-01-14

### 3. Label order and priority is semantically load-bearing
- Most restrictive at the **bottom**. Order determines what counts as "downgrading."
- **Sublabels share the priority of their parent** — the justification setting does not apply
  between sublabels of the same parent.
- **Auto-labeling conflict resolution uses order**: *"the last sensitive label is selected."*
- **Copilot uses order**: Copilot Chat and label inheritance both surface the highest-priority
  label.
- **Label policy priority is separate and inverted in feel**: *"the label policy with lowest
  priority is shown at the top of the list with the lowest order number."*

Microsoft flags the specific collision: *"assuming General is lower priority than Confidential\All
employees, and if your Office client defaults to Confidential\All employees, a SharePoint default
library label set to General doesn't apply."*

### 4. Container labels vs file labels are different objects
- The **Groups & sites** scope *"lets you protect content... by labeling those containers **but
  doesn't label the items in them**."*
- **Meetings scope requires both Files & other data assets and Emails to be selected.**
- Container label deletion takes **48–72 hours**, during which users may be unable to open
  previously protected content.
- **Do not make a parent label the default or auto-applied** — *"the parent label can't be
  applied."*

### 5. Simulation is not a silent dry run
- **"Simulation still generates activity alerts."** *"To avoid mass alert email while validating a
  policy, temporarily scope or disable the alert policy for the simulation window."* **Do this
  before your first simulation, not after.**
- **Simulation shows the result of a single policy.** Conflicts between multiple policies only
  resolve when all run — so the simulation can be honestly wrong.
- **Exchange simulation is not reproducible** — it evaluates mail sent and received *during* the
  run.
- **Simulation matches more than activation acts on.** *"On activation, the service only
  re-evaluates files whose state has recently changed."* Forcing a full pass requires on-demand
  classification.
- A duplicated policy silently lands in simulation regardless of the source policy's state.

### 6. DLP false-positive floods
Microsoft's mitigations are structural: the three-stage rollout, *"ask users to report false
positives"* at the policy-tip stage, and the leakage-tolerance conversation up front.
Practitioner failure modes: **unnecessarily complex DLP** ("dozens of nested rules... that become
unmaintainable"); **inaccurate testing**; **never graduating from audit mode**; **single-engine
DLP** (Exchange only, leaving Teams, SharePoint, endpoint and Copilot unprotected).

**The trust point to make loudly: a false-positive flood does not just annoy users, it retires
the control.** Users route around policy tips, and the partner's next three recommendations are
pre-discredited.

### 7. Mandatory labeling side effects
Requires a label before users can save files, send email/invites, or create groups/sites.
Justification prompts fire **once per app session** in Office apps but **per file** with the
Purview Information Protection client — a materially different experience depending on tooling.

### 8. Documented breakage worth a checklist line
Encrypted files containing **Power Query data, custom add-in data, custom XML parts,
bibliographies, or a Document ID** cannot be processed by SharePoint/OneDrive ·
**password-protected documents** can't be read or labeled · **HYOK and Double Key Encryption**
files never get co-authoring, eDiscovery, DLP or search · encrypted docs in Office for the web
cannot be printed, downloaded or exported · **labeled MP4s with encryption cannot be
downloaded**; unencrypted labeled MP4s download but **lose the label** · **labels configured for
other languages aren't supported** in SPO/OneDrive · **Sensitivity column lag** — *"can take a
while to display the label name. Factor in this delay if you use scripts or automation"* · a file
labeled while **checked out** shows nothing until check-in · **OneDrive sync save failures** when
an admin changes an already-applied label's settings.
`[MS-DOC]` sensitivity-labels-sharepoint-onedrive-files · ms.date 2026-08-07

---

## What could not be verified

1. **Exam prices.** Microsoft publishes none to anonymous fetches. $165 is third-party only.
2. **Study time for any certification.** No Microsoft figure exists; no defensible practitioner
   figure with a methodology.
3. **SMB-channel services rates for Purview work specifically.** No published rate card isolates
   it. The $150–$275/hr band is a bounded inference and must be presented as such.
4. **Duration of each DLP rollout stage.** Microsoft prescribes the stages, gives no elapsed time.
5. **TD SYNNEX Purview services catalog and pricing.**
6. **AvePoint partner economics.** Both AvePoint MSP articles contain zero pricing, margin, effort
   or staffing figures. Any number attributed to AvePoint would be invented.
7. **The June 2026 Microsoft Credentials Roundup** would not render its body to fetch. The MS-102
   retirement date is confirmed from the exam page directly, so nothing here depends on it.
8. **SC-500.** Referenced in dossier 04 as a PCS skilling exam; not verified in this pass. **Do
   not carry it forward as a recommendation until someone checks the credentials catalog.**
