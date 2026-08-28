# 12 · Incidents, evidence, and the tiered offer ladder

**Compiled 2026-08-28.** Companion to [`03-mrr-and-pricing.md`](03-mrr-and-pricing.md) and
[`06-field-knowledge.md`](06-field-knowledge.md). Does not repeat the F12 $5,000/50-user anchor,
the Cloudiway/ConsultKit bands, the Gartner 5%/6% pilot statistics, or the Concentric 16% figure
except where new primary detail was found.

Tags: `[INCIDENT-REPORTED]` · `[VENDOR-RESEARCH]` · `[SURVEY]` · `[PARTNER-PUBLISHED]` ·
`[MARKETPLACE]` · `[PRACTITIONER]` · `[UNVERIFIED]`

---

# PART ONE — Where this went wrong, concretely

## 1. The headline finding

**There is now a real, citable incident corpus — but almost none of it is "Company X's employee
found the salary file."** It divides into three kinds, and only the second and third are strong:

1. **Named-company oversharing incidents** — still essentially absent from the public record.
   **This remains the single biggest evidential gap in the practice narrative.**
2. **Product-level failures where a vendor shipped a bug that broke the permission or label
   boundary** — now well documented, dated, several with Microsoft incident IDs. **The strongest
   new material here.**
3. **Security-research exploit chains** — EchoLeak, CoSnitch, ShadowLeak, AgentFlayer, Wayback
   Copilot. All disclosed responsibly, patched, **no confirmed in-the-wild exploitation.** Strong
   for a technical audience, weak with a 60-seat owner, easy to over-claim.

**Consequence for the guide:** you can now argue partly from incident where before you could only
argue from mechanism. But the incidents you can cite are *product-boundary failures and
researcher exploits*, not customer oversharing scandals. **Say that plainly.** A partner who
implies there is a body of published customer horror stories will be caught out by any prospect
who searches for ten minutes.

---

## 2. Documented incidents — the strong tier

### 2.1 The best single incident: CW1226324, the sensitivity-label bypass

The most useful item in the dossier, because it is dated, has a Microsoft incident ID, has a
named affected organization with its own ticket number, and **it is a case where the customer had
done the governance work correctly and it still failed.**

| Fact | Detail |
|---|---|
| Microsoft tracking ID | **CW1226324** |
| First reported by customers | **2026-01-21** |
| Fix rollout began | **Early February 2026**; remediation still incomplete mid-February |
| Duration of exposure | Approximately **four weeks** |
| What happened | Microsoft 365 Copilot Chat's "work tab" returned summaries derived from messages in users' **Drafts and Sent Items**, even where those messages carried confidentiality sensitivity labels and DLP policies specifically intended to exclude them from Copilot processing |
| Data categories | Legal memos, business agreements, government correspondence, protected health information |
| Named affected org | **UK National Health Service**, tracked internally as **INC46740412**. NHS stated **patient information was not exposed** |
| Microsoft's position | That users only accessed information they were already authorized to see |
| Affected tenant count | **Not disclosed** |

Sources: TechRepublic, https://www.techrepublic.com/article/news-microsoft-copilot-bug-confidential-emails/
`[INCIDENT-REPORTED]`; corroborating discussion at windowsforum.com `[PRACTITIONER]`

**Why this is the strongest item.** Microsoft's response — *users only accessed information they
were already authorized to see* — is **the same argument the partner hears from a skeptical
prospect.** Here it is Microsoft making that argument about an incident where labels and DLP
policies were deliberately configured and were bypassed anyway. The lesson is not "Microsoft is
unsafe." It is: **the control plane is new, it changes monthly, and neither Microsoft nor the
customer had independent visibility into whether it was working.** That is an argument for a
monitored, recurring governance service rather than a one-time project.

**Handling note.** Use it precisely. It is a *label/DLP-scope* failure, not a *permissions*
failure. Do not let it compress into "Copilot leaked NHS patient data" — the NHS explicitly said
it did not.

### 2.2 Wayback Copilot — 20,580 repositories, 16,290 organizations

| Fact | Detail |
|---|---|
| Discovered by | Lasso Security |
| Disclosed to Microsoft | **November 2024** |
| Microsoft policy change | **January 2025**; Bing cached-link feature removed, `cc.bingj.com` disabled within ~2 weeks |
| Public reporting | **2025-02-26/27** (TechCrunch, Slashdot) |
| Repositories exposed | **20,580** |
| Organizations affected | **16,290** — including Microsoft, Google, Intel, Huawei, PayPal, IBM, Tencent |
| Also exposed | **100+** internal packages vulnerable to dependency confusion; **300+** private credentials for GitHub, OpenAI, Google Cloud |
| Mechanism | Repos briefly public then made private were retained in Bing's cache; Copilot served that "zombie data" after lockdown |

`[VENDOR-RESEARCH]` lasso.security; independently reported by `[INCIDENT-REPORTED]` TechCrunch.

**Relevance caveat.** This is a *public-web-cache* problem, not a tenant-permissions problem, and
it concerns GitHub Copilot / Bing rather than M365 Copilot over SharePoint. **Do not present it
as evidence of tenant oversharing.** Its value is the principle SMB owners grasp instantly:
**once an AI index has seen something, revoking access to the original does not revoke it from
the index.** That principle *does* transfer — it is why Restricted Content Discovery requires a
full reindex.

### 2.3 Slack AI — private-channel exfiltration via indirect prompt injection

The clearest cross-platform proof that "the AI only shows you what you can already see" is
incomplete.

| Fact | Detail |
|---|---|
| Researcher | PromptArmor |
| Published | **2024-08-20** |
| Mechanism | A malicious instruction posted in a **public** channel is ingested into Slack AI's RAG index; when a victim later queries Slack AI, the retrieved instruction executes and renders a markdown link carrying the victim's **private-channel** data in the query string |
| Data demonstrated | An API key the victim had stored in a private channel |
| Slack's initial position | Public-channel messages being searchable workspace-wide is intended behavior |
| Outcome | Salesforce/Slack patched. Catalogued as MITRE ATLAS **AML.CS0035** |

**Why a Slack incident belongs in a Microsoft guide.** The mechanism is generic, it makes the
point without the prospect feeling attacked about their Microsoft investment, and it demonstrates
a boundary pure permission-hygiene does not close — **the attacker never needed access to the
private channel.**

### 2.4 EchoLeak (CVE-2025-32711) — zero-click exfiltration from M365 Copilot

Discovered by Aim Security, disclosed **June 2025**, **CVSS 9.3**. A single crafted email
containing a hidden prompt (HTML comment / white-on-white text) causes Copilot to retrieve
internal content and exfiltrate it. **No user interaction required.** Reachable scope: anything
in the user's Copilot scope — chat logs, OneDrive, SharePoint, Teams. Microsoft fixed server-side;
**no exploitation in the wild confirmed.**

**Caution.** Sources disagree on the patch date. **Do not state one** — cite the CVE, the
disclosure month, and "fixed server-side, no in-the-wild exploitation confirmed."

### 2.5 CoSnitch (CVE-2026-24301)

| Fact | Detail |
|---|---|
| Discovered by | Varonis Threat Labs |
| Disclosed | **December 2025** · Patched **2026-08-18** — an eight-month window |
| Product | **Copilot Personal** (consumer Copilot with connected apps), **not** M365 Copilot |
| Composition | Memory poisoning + automatic prompt execution via a crafted URL + exfiltration — **one click, zero anomalous signals** |
| Discovery method | "Meta-hacking" — researchers repeatedly asked Copilot why an action was blocked until it described the bypass |
| In the wild | No evidence |

**The SMB-relevant angle is the product boundary, not the exploit.** In a 25–300 seat business,
staff signed into personal Copilot with connected apps is exactly the shadow-AI pattern the
governance offer is supposed to detect.

### 2.6 ShadowLeak and AgentFlayer — the ChatGPT connector equivalents

- **AgentFlayer** — Zenity Labs, ~Black Hat 2025. Zero-click exfiltration from **ChatGPT
  Connectors** reaching Google Drive, SharePoint and others.
- **ShadowLeak** — Radware, **September 2025**. The first **service-side** zero-click prompt
  injection against ChatGPT's Deep Research agent: the entire chain executes inside OpenAI's
  cloud, so it leaves **no artifact on the victim endpoint or network.** Reported at 100% success
  in testing; extensible to Box, Dropbox, GitHub, Google Drive, HubSpot, Outlook, Notion,
  SharePoint.

**Why the service-side point matters commercially.** An MSP selling EDR and network monitoring
**cannot see this class of event at all.** That is a concrete, non-fearmongering reason the
existing security stack does not cover AI risk — and therefore why a separate governance line
item is defensible rather than a shakedown.

### 2.7 Adjacent, one line each

- **Meta / Instagram "High Touch Support" (May 2026)** — an AI-assisted account-recovery tool sent
  password-reset links to email addresses not associated with the accounts; discovered
  2026-05-31; class action under investigation. `[INCIDENT-REPORTED]` A *consequences* example,
  not a Copilot example.
- **Knostic's synthetic-environment finding** — in a constructed environment, a copilot asked for
  an employee's personal details searched the HR folder, failed to find them, and **fabricated**
  them, then shared them. `[VENDOR-RESEARCH]` **A laboratory result in an artificial tenant.**
  Interesting because it is a failure mode permission-fixing does not address at all, but it is
  not an incident.

---

## 3. Prevalence research

**Every source in this section sells something.** Present them as a convergent range, not facts,
and always name the vendor.

| Finding | Figure | Methodology | Source |
|---|---|---|---|
| Orgs with sensitive data easily surfaceable by AI | **99%** | ~1,000 environments; **~10bn files** across M365, AWS, Box, Salesforce | Varonis *2025 State of Data Security*, 2025-06-20 |
| Orgs with unverified apps incl. shadow AI | **98%** | same | same |
| Orgs with cloud data exposed to **anonymous** users | **66%** | same | same |
| Orgs with stale-but-enabled **ghost users** | **88%** | same | same |
| **Orgs that had labeled files at all** | **1 in 10** | same | same |
| Orgs without enforced MFA across SaaS/multi-cloud | **1 in 7** | same | same |
| Orgs with sensitive files exposed to all employees via Copilot | **90%**, averaging **~25,000 folders** | Varonis | same report coverage |
| Healthcare orgs with sensitive data exposed to AI | **90%** | Varonis healthcare cut | varonis.com |
| Business-critical data in an overshared posture | **16%** | Semantic DSPM telemetry; 2026 iteration cites **550M+ records** | Concentric AI |
| At-risk files per organization | **802,000** avg; **402 per employee** (up from 251, +60% YoY) | **500+ TB** unstructured data — **this figure originates in the 2022 report** | Concentric |
| Split of overshared files | **83%** internal / **17%** external | Concentric | same |
| Business-critical docs shared outside the C-suite | **90%** | Concentric | same |
| Google Drive files containing sensitive data | **40.2%** | **~6.5M files** scanned | Metomic, Black Hat Europe Dec 2023 |
| Drive files shared externally | **34.2%** | same | same |
| Drive files publicly accessible by link | **0.5%** (>350,000 files) | same | same |
| Sensitive content accessible to unauthorized users | **30–40%** | Methodology not stated | SkyTerra, 2026-02-10 `[PARTNER-PUBLISHED]` |
| Overshared SharePoint sites per **enterprise** tenant | **150–300** | No published methodology | EPC Group `[UNVERIFIED]` — **do not use** |

### How to use this honestly

**The strongest single citation is Varonis's "1 in 10 companies had labeled files."** Specific,
checkable, unglamorous, and the one a prospect will recognize as true about themselves. **The 99%
figure is worse rhetoric precisely because it is too high to be believed.**

**The 802,000 figure has a dating problem** — it circulates as current but traces to Concentric's
**2022** report. **Date it 2022 or drop it.** This is exactly the number that gets a partner
embarrassed in a room.

**Metomic's 40% is Google, 2023, pre-dates the current AI wave.** Use only for the generalization
argument, never as a Microsoft statistic.

**There is still no independent, non-vendor, tenant-level survey of oversharing prevalence in the
25–300 seat segment.** Every number is from a company selling remediation, and samples skew
enterprise. If the guide needs an SMB-specific prevalence number, **it does not exist** and
should be replaced by the partner's own anonymized engagement data — which is a good reason for a
partner to start recording it.

### ROT and stale data — a genuine gap

**No credible, methodologically-stated figure exists for the SMB segment.** What exists: Varonis's
88% ghost-users (an *identity* metric, not a content metric); Microsoft's SAM Content Management
Assessment surfacing "inactive or ownerless" sites without publishing prevalence; and Scopable
scoping a governance review to "10 to 25 high-risk **or inactive** sites," implying inactive sites
are a meaningful minority rather than a majority.

**Recommendation: argue ROT from mechanism and from the customer's own DAG report, not from a
statistic. There isn't one worth quoting.**

---

## 4. Deployments that failed, stalled, or were rolled back

### 4.1 New detail on the delay statistic

Dossier 06 recorded Gartner's "40% delayed by three months or more due to oversharing" via
QueryNow. This pass surfaced a **different stated sample size** for the same finding — **n=132 IT
leaders** — paired with a second figure: **64% said information governance and security risks
required significant time and resources during deployment.**

**Both n=132 and n=187 are now circulating for Gartner Copilot surveys, alongside 5% and 6%
pilot-progression figures from different years. This is a four-way attribution mess.**
Recommended handling: cite **one** figure, name the secondary source you actually read, and state
the sample size only if you read it in the primary. The safest usable form is the *pairing* — a
substantial minority delayed rollout over data governance, and roughly two-thirds found
governance work materially resource-consuming — without leaning on the decimal.

### 4.2 Still no named rollback

I searched specifically for a named organization that bought Copilot licenses and switched them
off for governance reasons. **None found.** The literature is uniformly aggregate or anonymized.

**This is a finding, not a failure of searching.** Companies do not publish "we bought AI and
turned it off." The honest line: *these don't get published, and that's exactly why you should
assume it's happening.*

### 4.3 Adoption-failure numbers are better evidenced than governance-failure numbers

| Claim | Figure | Source |
|---|---|---|
| Adoption without structured change management | **20–30%** plateau within first quarter | SkyTerra, 2026-02-10 `[PARTNER-PUBLISHED]` |
| Adoption with structured change management | **80%+** | SkyTerra |
| **Licensing inefficiencies discovered during assessment** | **10–30%** | SkyTerra |
| Annual license cost per user used as the ROI denominator | **$360/user/year** | SkyTerra; matches Tony Redmond in dossier 06 |
| Adoption without/with change mgmt | **30–40%** vs **70–80%** | Circulating, methodology unpublished `[UNVERIFIED]` |

SkyTerra's 20–30% and the unverified 30–40% are two different numbers for the same claim from two
vendors with the same commercial interest. **Neither is a survey.** Use the *direction* —
unmanaged rollouts plateau in the low tens of percent — and attribute it to partner observation.

**The 10–30% licensing inefficiency figure is commercially the most interesting item in that
table:** it means the assessment is partly self-funding against the license bill, which is the
single most effective way to disarm the "you're just selling us more stuff" objection.

---

## 5. Regulatory, legal, and insurance consequences

### 5.1 The honest summary

**There is no enforcement action, anywhere, that I could find, against a company for a Copilot or
internal-AI-assistant oversharing incident.** Not a GDPR fine, not an FTC action, not an ICO
reprimand. **The guide must not imply one exists.**

| Item | Detail |
|---|---|
| EU AI Act enforcement provisions | Apply from **2026-08-02**; penalties up to **€35M or 7% of global turnover** |
| EDPB first coordinated AI enforcement wave | **Q3 2025**, 14 DPAs, **€92M** total `[UNVERIFIED]` — aggregator; confirm before quoting |
| Cumulative GDPR fines | **€7.1B** since May 2018; **€1.2B** in 2025 alone `[VENDOR-RESEARCH]` |
| Garante v. Luka (Replika) | **€5M** — an AI *vendor*, not an AI *user* |
| **Garante v. Piaggio** | **€460,000** over handling of two former employees' company email |
| AI's role in breaches | AI played a role in **1 in 4** breaches, Mar 2025–Feb 2026, up **56%** YoY — IBM via secondary; **verify against IBM's own report before use** |

**The Piaggio fine is quietly the most useful of these for an SMB audience.** €460,000 for
mishandling two ex-employees' mailboxes is a proportionate, comprehensible number about exactly
the kind of stale-access problem a readiness assessment finds. **It is not an AI case, and you
should say so** — but it establishes that a regulator will fine over leaver-access hygiene, which
is the mechanism, not the tool.

### 5.2 Cyber insurance — genuinely new and underused

**The strongest commercial lever in Part One, and not in the earlier dossiers.**

| Fact | Detail |
|---|---|
| ISO generative-AI exclusion endorsements | **CG 40 47**, **CG 40 48**, **CG 35 08** introduced **2026-01-01** for commercial general liability; carriers began attaching them at renewal |
| CG 40 47 01 26 scope | Excludes bodily injury, property damage, and personal & advertising injury *"arising out of, or attributable to, generative artificial intelligence"* |
| Prior state | Until 2026, most organizations were covered for AI losses **"by silence rather than by grant"** |
| Cyber policies | Remain, for now, the most stable source of AI coverage — but carriers are adding **AI sublimits**, reported around **one-tenth of policy limit** at some carriers |
| Affirmative AI coverage | Some carriers writing it deliberately and **pricing it against documented governance** |

Sources: policyholderpulse.com (2026-04-13), fenwick.com, claimsjournal.com (2026-07-20),
shumaker.com. `[INCIDENT-REPORTED]` as market/regulatory fact.

**I did not find a single published, adjudicated cyber-insurance claim denial attributable to AI
use.** The category is too new. Say so.

**But the argument does not require one.** It is: *your GL policy probably acquired a
generative-AI exclusion at your last renewal without you noticing, your cyber policy may now carry
an AI sublimit, and at least some carriers are pricing affirmative AI coverage against documented
governance.* That converts the governance engagement from a cost into an insurance-underwriting
artifact — the same move that made written incident-response plans and MFA attestations sellable.
For a 25–300 seat business with a broker relationship, this is more motivating than any breach
statistic, **and the customer can verify it in ten minutes by reading their own renewal
endorsements.**

**Guide action:** add *"pull your last GL and cyber renewal endorsements"* to the discovery
question list.

---

## 6. The counter-evidence — being fair

Overstating risk is the failure mode of security marketing. This material cuts the other way and
it is substantial.

### 6.1 Most deployments proceed without a publicized incident

The absence of named customer incidents cuts **both** ways. If Copilot were routinely producing
HR-data scandals across tens of thousands of tenants, some would have surfaced through
breach-notification obligations, employment tribunals or trade press. **They have not.** The
honest reading:

- Realized harm to date is dominated by **vendor-side product bugs** (CW1226324) and
  **researcher-disclosed exploits patched before exploitation** — every one of which reported no
  in-the-wild exploitation.
- The dominant *observed* customer-side outcome is **friction and delay, not breach.** The
  Gartner-derived numbers measure *rollout delays*, not *incidents*.

### 6.2 Adoption is broad and growing

| Claim | Figure | Tag |
|---|---|---|
| Copilot adoption among M365 enterprise customers | **41%** by Q1 2026 | `[UNVERIFIED]` secondary |
| Fortune 500 using M365 Copilot | **~70%** | `[UNVERIFIED]` |
| Enterprises reporting Copilot deployment | **79%**, half past pilot into full rollout | Morgan Stanley / RSM via secondary `[SURVEY]` |
| Active agents in the M365 ecosystem | **15x** YoY growth | Microsoft *2026 Work Trend Index* `[VENDOR-RESEARCH]` |

Note the **direct tension** between "79% deployed, half past pilot" and Gartner's "6% moved past
pilot." These cannot both describe the same population. **A partner who quotes the Gartner 6%
while a prospect has read the 79% loses credibility.** Safe framing: pilot-to-scale conversion is
contested and survey-dependent; what is not contested is that governance work is a common cause
of delay.

### 6.3 The best counter-evidence: successful deployers did the work first

**Forrester's Total Economic Impact of Microsoft 365 Copilot** (commissioned by Microsoft, March
2025) — 16 decision-makers across 12 organizations plus a survey of **367** respondents.
Composite: 25,000 employees, $6.25B revenue, phased to 40% of workforce by year three. Headline
**116% three-year ROI**, **$19.7M NPV**, sub-11-month payback, security and compliance benefits at
**$14.8M** three-year risk-adjusted present value.

**The number that matters: 70% of surveyed organizations ran data security projects ahead of
deployment.**

`[VENDOR-RESEARCH]` Microsoft-commissioned; the composite is enterprise-scale and **the ROI
figures should not be used with an SMB.**

**This is the single most useful sentence in the counter-evidence section and it should be the
guide's primary argument.** It reframes the pitch away from fear: *the reference deployments that
produced the ROI Microsoft advertises are overwhelmingly ones that did security work first.* You
are not selling protection from a disaster that may not happen. **You are selling the precondition
that the successful deployments had and the stalled ones did not.** That argument survives a
skeptical audience; "you'll leak your salary file" does not.

### 6.4 The one large-sample AI incident survey — and why it does not apply

**Kiteworks 2026 AI Data Governance and Security Survey**, n=**459**: 80% experienced at least one
security or AI-related incident in 12 months; 78% AI-related specifically; of AI-agent incidents,
61% involved sensitive data exposure; 63% experienced a compliance outcome; **65% discovered
employees using unapproved AI tools with sensitive organizational data.**

**The disqualifying caveat: 92% of the sample is organizations with 1,000+ employees.** Using it
to characterize a 60-seat firm is exactly the misleading move to avoid. **If used at all, use only
the 65% shadow-AI figure and state the sample composition in the same sentence.**

---

# PART TWO — Tiered assessment and remediation in the SMB channel

## 7. The tiering pattern

### 7.1 The canonical five-stage ladder

Three independent SMB-channel sources describe the **same** ladder in the same order.

| Stage | AvePoint (2026-07-07) | Cloudiway MSP AI Readiness | inforcer |
|---|---|---|---|
| 1 | Readiness assessment | AI Readiness Audit | Initial assessment |
| 2 | Risk remediation | Risk remediation | Remediation services ("high-margin consultancy") |
| 3 | Data foundation | *(folded into 2)* | *(folded into 2)* |
| 4 | Secure Copilot deployment | Copilot deployment — licenses + change management | *(implicit)* |
| 5 | Adoption, then **continuous governance** | Managed services — ongoing monitoring & governance | Ongoing managed AI services |

All three are **tool vendors selling to MSPs**, which is why they agree — they are describing the
offer their platform enables. That is a real limitation. But the convergence is useful: an MSP
building this ladder is building the offer the channel's tooling is designed to support.

### 7.2 The free-scan tier is now structurally real

- **a distributor-packaged readiness capability.** inforcer's Copilot readiness capability is coming to the **a competing distributor
  Marketplace** (announced ~2026-06-09), reaching a competing distributor's stated **40,000+ MSP** community with
  one-click procurement and consolidated billing. Pricing described as **per-tenant, per-month
  with volume discounts**. **Amount not disclosed.** `[MARKETPLACE]`
- **TD SYNNEX × AvePoint Copilot Readiness Assessment.** Distributor-packaged, partner-deliverable:
  full scan of Teams, SharePoint, OneDrive, Exchange and Groups; risk assessment on data leaks,
  external sharing and governance gaps; a Copilot Readiness Report with prioritized **remediation
  roadmap**; and a business review session with a TD SYNNEX specialist. **Stated turnaround:
  within five weeks.** Price not published; commercial model described as co-investment, funded or
  partially funded depending on partner status and Partner Development Plan. `[MARKETPLACE]`

**Commercial consequence.** The free/cheap scan tier is being commoditized *by the distributors*
and possibly subsidized by Microsoft partner funding. A partner planning to charge for the scan
itself is competing against a funded distributor offer. **The scan is not defensible as a revenue
line. The judgment, the roadmap and the remediation are.**

### 7.3 The four-tier shape the evidence supports

| Tier | What it is | Price | Duration |
|---|---|---|---|
| **0. Scan** | Automated tenant scan, findings list, no judgment | **$0** — distributor/tool-funded, or a 1-hour free consult | **90 min** platform-time (Cloudiway); **60 min** review (inforcer); marketplace free tier **1 hour** |
| **1. Light assessment** | Scorecard, 3–5 interviews, debrief, prioritized findings | **$1,500–$3,000** (ConsultKit "Discovery") | **1–2 weeks** |
| **2. Full assessment** | Oversharing report, costed remediation plan, pilot design, policy, roadmap | **$3,000–$15,000**; **$5,000 at 50 seats = $100/seat** (F12) | 1–2 weeks (OxygenIT); 2 weeks (most marketplace); 2–4 (Insight); **4–6** (SkyTerra's "proper" one); **5 weeks** (TD SYNNEX/AvePoint) |
| **3. Remediation project** | Actually fix it | **$15,000–$40,000** (Cloudiway) — see §9, probably too high for 25–300 seats | **30 calendar days / 4 working weeks**, **40–60 IT-hours** at 50 seats |
| **4. Ongoing governance** | Monitoring, drift control, periodic review, attestation | See §10 — **thinnest evidence in the dossier** | Monthly/quarterly |

---

## 8. Duration — the hard numbers

### 8.1 The best duration source in the SMB channel

**Fusion Computing (Canadian SMB MSP), 2026** —
https://fusioncomputing.ca/microsoft-365-copilot-oversharing-canadian-smb/ `[PARTNER-PUBLISHED]`

The most valuable Topic B source found, because it publishes an hour-level phase plan against a
**stated seat count**, which almost nobody does.

| Week | Phase | Work | **IT hours** |
|---|---|---|---|
| 1 | Inventory | DAG reports, overshared-site export, anonymous-link reports | **8–12** |
| 2 | Classify + Triage | Apply sensitivity labels; sort into four buckets, critical → low | **12–16** |
| 3 | Remediate | Break inheritance, replace group-shares, expire links, implement policies | **16–24** |
| 4 | Lock + Pilot | Enable tenant-wide policies, apply Restricted Content Discovery, pilot with 5 users | **4–8** |
| — | **Total** | — | **40–60 IT-hours over 30 calendar days** |

**Assumption: a 50-user tenant.** Supporting field data from the same source: a **65-user Toronto
firm's Phase 1 took 9 IT-hours**; a **Hamilton engagement where a single "Everyone except external
users" misconfiguration accounted for roughly 80% of high-priority remediation**; and "most
50-user Canadian tenants finish all five phases inside four working weeks."

**Why this matters enormously.** It is the first credible bottom-up effort estimate for the SMB
segment, and it directly contradicts the enterprise numbers the channel repeats. Chris Wetzel's
widely-shared critique says real remediation is **200–400 hours**; EPC Group puts permissions
remediation at **$50,000–$400,000** over **60–180 days**. Those are mid-market and enterprise
numbers. **At 50 seats the work is 40–60 hours, not 200–400. A partner who scopes an SMB
engagement from enterprise literature will price themselves out of every deal they quote.**

**Reconciling the two:** Wetzel's figure is explicitly framed around "permission inheritance
across 200+ sites." A 50-seat firm does not have 200+ sites. **The correct scaling variable is
site and library count, not seat count** — but seat count is the only thing the buyer knows at
quoting time. **The practical rule: quote from a site inventory, not from a headcount, and make
the free scan produce the site count that determines the price.** That is a clean commercial
reason for the scan tier to exist.

### 8.2 The competing duration claims

| Claim | Duration | Source |
|---|---|---|
| Full readiness assessment done properly | **4–6 weeks**, requires data governance, security architecture, change management, financial analysis and M365 administration | SkyTerra, 2026-02-10 `[PARTNER-PUBLISHED]` |
| Readiness assessment deliverable | **35 hours** | a framework listing `[MARKETPLACE]` |
| Typical MSP readiness offer (criticized) | **20–40 hours over one week** | Chris Wetzel `[PRACTITIONER]` |
| SMB readiness assessment, fixed price | **1–2 weeks**, businesses with **18–110 staff** | OxygenIT (NZ) `[PARTNER-PUBLISHED]` |
| Distributor assessment | **5 weeks** | TD SYNNEX / AvePoint `[MARKETPLACE]` |
| Platform-automated scan | **90 minutes** vs "8 days manual" | Cloudiway `[VENDOR-RESEARCH]` unaudited |
| Partner review of automated report | **60 minutes**, from "a day of collation" | inforcer partner quote |

**The synthesis a partner can defend:** discovery is now genuinely minutes-to-hours because the
tooling does it; the *assessment* is 1–2 weeks elapsed and roughly 20–40 consultant hours; the
*remediation* is a further 4 weeks elapsed and 40–60 hours at 50 seats, **scaling with site count
not headcount.** The 4–6 week and 5-week figures describe assessments that include change
management and financial analysis — the assessment plus the first slice of adoption work.

### 8.3 A pragmatic SMB scoping table — **synthesis, not sourced**

| Seats | Sites (typical) | Assessment hours | Remediation hours | Elapsed |
|---|---|---|---|---|
| 25–50 | 10–30 | 15–25 | 30–50 | 3–4 weeks total |
| 50–100 | 25–60 | 20–35 | 40–70 | 4–6 weeks total |
| 100–300 | 60–150 | 30–50 | 80–160 | 6–10 weeks total |

**Extrapolated from Fusion Computing's 50-seat figures and the Scopable 10–25 site review
boundary. Not published by anyone. Present with that caveat attached, or not at all.**

---

## 9. Remediation pricing — the biggest gap, partially closed

| Figure | Scope | Source |
|---|---|---|
| **$15,000–$40,000** | "Risk remediation — fix permissions & governance" | Cloudiway `[VENDOR-RESEARCH]` |
| **$50K–$100K+ total per client** across audit ($5K–$15K or free) → remediation ($15K–$40K) → deployment → managed services | Four-stage revenue model | Cloudiway |
| **$3,000–$8,000 per pass** | Annual cleanup and content lifecycle — site decommissioning, permissions audits, storage optimization | `[UNVERIFIED]` — could not pin to a named MSP's rate card |
| **$50,000–$400,000**, **60–180 days** | Permissions remediation before Copilot rollout | EPC Group — **mid-market/enterprise, out of scope** |
| **$75,000–$500,000** | Copilot readiness standalone | EPC Group — **out of scope** |
| **$150–$250/hour** | MSP project/professional services rate | Growth Generators 2026 |

### 9.1 The most defensible SMB remediation price is a **derived** one

Nobody publishes an SMB remediation rate card. But you can build one from two independently
sourced facts:

- **40–60 IT-hours** for a 50-seat tenant (Fusion Computing, published, hour-level)
- **$150–$250/hour** MSP project rate (Growth Generators)

→ **$6,000–$15,000** for a 50-seat remediation project, with a sensible fixed-fee landing zone
around **$8,000–$12,000**, or roughly **$160–$240 per seat**, against the **$100/seat** assessment
anchor.

**This is the most useful number this dossier produces, and it is a derivation, not a citation.
Label it as such.** It sits *below* Cloudiway's $15K–$40K band, consistent with Cloudiway
targeting MSPs serving larger clients.

**Ratio check.** Assessment ≈ $100/seat; remediation ≈ $160–$240/seat — a ratio of roughly
**1.6–2.4×**, versus Cloudiway's implied **2.7–3×**. Same family. **A partner planning
"remediation is roughly 2× the assessment" is on defensible ground.**

### 9.2 Pricing models observed

- **Fixed fee, scoped after a free scan** — the dominant pattern. Scopable's articulation is
  clearest: a **fixed-scope review package covering 10 to 25 high-risk or inactive sites**, with
  the **review phase billed separately from the remediation phase**, and client decisions
  documented before any cleanup begins. *"A governance review package does not need to be
  complicated. It needs a clear boundary."* https://scopable.io/blog/microsoft-purview-governance-reviews-msp, 2026-06-18
- **Per-site** — implied by the 10–25 site boundary but **no published per-site rate exists.**
  $300–$600 per remediated site falls out of the hour math, **but that is arithmetic, not a rate
  card.**
- **Blocks of hours** — searched for specifically; **no published SMB examples found.**
- **Credit-the-assessment-against-remediation** — still the single best packaging device.

### 9.3 Stated plainly

**No SMB-focused MSP publishes a remediation rate card for Copilot oversharing.** What is
published is either a wide vendor band, an enterprise band, or "fixed price engagement" with no
number. **The derivation in §9.1 is the best available substitute and the guide should present it
as a construction with its inputs visible.**

---

## 10. The ongoing service — thinnest evidence, and that is the finding

**I could not find a single SMB partner publishing a price for an AI-governance-specific managed
service.** This is a hard negative and it belongs in the guide.

| Item | Figure |
|---|---|
| a competing distributor/inforcer Copilot readiness | **Per-tenant, per-month**, volume discounts — **amount not disclosed** |
| **Syskit Point** (governance tooling COGS) | **$12 / $24 / $36 per user per year**; **100-user minimum billing** even for a 60-user tenant; **annual terms only** |
| ShareGate Protect | Single per-user price, no minimums; **partner pricing exists but is not published** |
| SAM standalone | **US$3 per user per month** — note that one Copilot license unlocks SAM tenant-wide on an eligible base, so this is often unnecessary |
| General MSP tiers into which governance is folded | Bronze **$80–$120**, Silver **$140–$200**, Gold **$220–$350** per user/month |
| MSP average | **$125–$200** per user/month |

### 10.1 The COGS insight

**Syskit's 100-user billing minimum is the single most practical number in this section.** A
60-seat customer costs the same to tool as a 100-seat customer. On the $36/user/year plan that is
**$3,600/year = $300/month of COGS floor** for one small tenant. Three consequences:

1. Per-tenant tooling economics **punish very small customers** unless the MSP has a multi-tenant
   license.
2. The recurring offer needs a **floor price, not a pure per-user price** — "$X/user/month,
   minimum $Y/month," the exact structure Syskit itself uses.
3. Strong argument for **channel-priced, per-tenant-per-month** tools over per-user enterprise
   governance platforms, for this segment specifically.

### 10.2 What the ongoing service should contain (sourced, though unpriced)

Consistent across sources: continuous data-governance monitoring; ongoing security review via
Purview; **configuration drift** detection (inforcer's explicit framing — "stop Microsoft 365
drift"); quarterly governance reviews; policy enforcement at scale; adoption metrics and
user-sentiment surveys; license optimization; new use-case development; a Copilot help desk.
OxygenIT additionally grounds its ongoing service in **ISO 42001** with risk registers, use-case
ownership and incident protocols.

One staffing benchmark: budget **0.5 FTE** for ongoing Copilot governance at organizations with
**1,000+ Copilot users** `[UNVERIFIED]`. Scaled naively that is ~0.03 FTE at 60 seats — about
**5 hours a month**, which at $150–$250/hour is **$750–$1,250/month**. That lands inside Cynomi's
**$1,000–$1,500/month** vCISO core-advisory band. **Two very different derivations converging on
~$1,000/month is the closest thing to a triangulated recurring price in the whole corpus. Both
inputs are weak; the convergence is worth noting and not worth leaning on.**

### 10.3 The honest statement for the guide

> *"No SMB-focused partner publishes a price for ongoing AI governance as a distinct managed
> service. The recurring layer is currently either (a) absorbed into an existing managed-services
> tier, (b) sold as vCISO/compliance-as-a-service at $1,000–$1,500/month, or (c) not sold at all.
> A partner productizing this is not undercutting a market — there isn't one yet."*

**That is a strategic finding, not just a research gap.** The recurring governance offer is a
differentiator rather than a commodity, and **the partner sets the reference price rather than
matching one.**

---

## 11. What comes next — the follow-on services

### 11.1 Adoption and change management

| Item | Figure |
|---|---|
| Change management as share of total Copilot budget | **10–15%** |
| **Per-user initial rollout budget** | **$50–$100 per user** |
| External training partner cost | **$5,000–$15,000** for a **500-person** rollout |
| Enterprise ACM packages | $80K–$1.2M+ — **OUT OF SCOPE, enterprise SI pricing** |

**The usable SMB number is $50–$100 per user**, which at 60 seats is **$3,000–$6,000** — a
comparable size to the assessment and a natural second project. The $5,000–$15,000 for 500 people
is $10–$30/head, a *volume* rate; at 60 seats the per-head figure will be at or above the top of
the $50–$100 band because fixed content-development cost does not shrink.

**Handle adoption as a separate risk.** Governance and adoption fail independently — fixing
permissions and walking away still loses the customer at month three.

### 11.2 Agent development

| Tier | Price | Segment |
|---|---|---|
| **Basic integration** | **$5,000–$20,000** — prebuilt connectors, API-key auth, read-only data | **SMB-viable** |
| Standard integration | $20,000–$80,000 | Enterprise |
| Advanced integration | $80,000–$250,000+ | Enterprise |
| Agent design (fixed fee) | $30,000–$80,000, 4–10 weeks | Enterprise |
| Code-first build (T&M) | $120,000–$400,000, 12–26 weeks | Enterprise |

**Only the $5,000–$20,000 basic-integration tier belongs in an SMB guide.** Two transferable
pieces of craft: *"Every dollar spent on proper scoping saves $5–$10 in development"*; and
integrations frequently account for **80% of project cost** — so price agent **design** as fixed
fee and **integration** as tiered or T&M.

**Runtime cost the partner must quote, not absorb:** Copilot Studio at **$200/month for 25,000
credits**, or pay-as-you-go at **$0.01/credit**. Consumption: classic answer 1 credit, generative
answer 2, agent action 5, **Graph grounding 10**, advanced reasoning 100 per 10 responses.
Buffers: **10–20%** standard, **30%** for chained agent calls. **Graph grounding at 10 credits per
interaction is the line item that surprises people** — it is the one that touches tenant content,
so a Copilot-adjacent SMB agent will hit it constantly.

### 11.3 Compliance certification support

Already in dossier 03: ISO 42001 gap analysis **$5,000–$15,000**, full SMB implementation
**$15,000–$50,000**; compliance gap assessment **$3,000–$7,500**; policy/documentation development
**$2,000–$5,000** per framework; pre-audit prep **$5,000–$10,000** per cycle.

**New supporting evidence:** OxygenIT explicitly grounds its ongoing Copilot governance in **ISO
42001**, with risk registers, use-case ownership and incident protocols. **A real SMB MSP using an
AI-management-system standard as the frame for a recurring service** — the exact pattern dossier
03 identified as the strongest recurring-revenue mechanic. Combined with EU AI Act enforcement
from 2026-08-02 and insurance underwriting against governance, the compliance follow-on now has
**three independent external forcing functions rather than one.**

### 11.4 Data lifecycle and records

Weakest evidence of the five. Only figure with a shape: **$3,000–$8,000 per pass** for annual
cleanup, unattributable to a named rate card. **The stronger commercial argument is storage cost,
not compliance** — reframing a lifecycle project as cost-avoidance rather than risk-avoidance,
which is materially easier to sell to a 60-seat owner. **Flag as an opportunity, not an evidenced
practice.**

---

## 12. The fifteen things this dossier adds

1. **CW1226324** is the best incident available: dated, ID'd, NHS-confirmed, four weeks, and it
   defeated correctly-configured labels and DLP.
2. **Still no named-company Copilot oversharing case study exists.** State it.
3. **Wayback Copilot** teaches the reindex/zombie-data principle — provided you do not
   misrepresent it as a SharePoint permissions issue.
4. **Slack AI (MITRE ATLAS AML.CS0035)** proves permission hygiene alone does not close the
   exfiltration boundary.
5. **EchoLeak, CoSnitch, ShadowLeak, AgentFlayer** — cite for mechanism, never for harm.
6. **Varonis "1 in 10 companies had labeled files"** is the most persuasive prevalence number
   because it is modest and recognizable.
7. **Concentric's 802,000 traces to 2022.** Date it or drop it.
8. **No enforcement action anywhere for AI oversharing.** The **Piaggio €460,000** leaver-mailbox
   fine is the right-sized analogue for the mechanism.
9. **The insurance argument is new, strong, and customer-verifiable:** ISO exclusions
   **CG 40 47 / 40 48 / 35 08** effective **2026-01-01**; cyber AI sublimits; affirmative coverage
   priced against documented governance. No adjudicated denials yet.
10. **Forrester TEI: 70% of surveyed organizations ran data security projects before deployment.**
    The guide's best argument, and a positive one.
11. **Kiteworks n=459 is 92% enterprise.** Use only the 65% shadow-AI figure, with the caveat.
12. **Fusion Computing's 40–60 IT-hours over 30 days at 50 seats** is the best SMB effort
    benchmark published anywhere, and it demolishes the 200–400-hour framing for this segment.
13. **Derived SMB remediation price: $6,000–$15,000 at 50 seats** ($160–$240/seat), roughly **2×
    the assessment.** A construction, not a citation.
14. **Scope from site count, not seat count.** That is what the free scan is *for*.
15. **Nobody in the SMB channel publishes a price for ongoing AI governance.** Two weak
    derivations converge near **$1,000/month**. Watch the **Syskit 100-user billing minimum** —
    per-tenant tooling economics require a **floor price**, not a pure per-user rate.

---

## 13. Research gaps that remain open

| Gap | Suggested next move |
|---|---|
| No named customer oversharing incident | Argue from CW1226324 + mechanism; be candid |
| No SMB-specific prevalence data (25–300 seats) | Partner records its own anonymized engagement stats |
| No published SMB remediation rate card | Use the hours × rate derivation, show the working |
| No published ongoing AI-governance monthly price | Treat as differentiator; set the reference price |
| No ROT/stale-data prevalence statistic | Argue from the customer's own DAG report |
| No adjudicated AI-related insurance claim denial | Monitor; the exclusions are only 8 months old |
| Microsoft Marketplace listings return HTTP 403 to automated fetch | Verify by hand in a browser before publishing any marketplace figure |
| Gartner sample sizes (n=132 vs n=187) and 5% vs 6% | Cite one, name the secondary source, or omit |
