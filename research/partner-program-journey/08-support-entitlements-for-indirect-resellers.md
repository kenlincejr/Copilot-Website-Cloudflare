# Support Entitlements for CSP Indirect Resellers: Three Systems, Not One

**Research dossier — 08 · Partner Program Journey (Zero to Frontier)**
Compiled 28 August 2026. Fiscal context: Microsoft FY27 began 1 July 2026.

Tag legend: `[MS-OFFICIAL]` with URL + doc date · `[CHANNEL-PRESS]` · `[COMMUNITY]` · `[UNVERIFIED]`.

---

## 0. The core finding

Partner confusion resolves once you separate **three legally and technically distinct systems that Microsoft's own documentation routinely conflates**:

| | System | Whose entitlement | Keyed by | Covers |
|---|---|---|---|---|
| **A** | **MAICPP benefit incidents** (Partner Cloud Support 50 / Partner On-premises 20) | The **partner's own** | Access ID + Contract ID, held in the **MAICPP tenant** | The partner's own tenant/products, plus Dynamics/Power Platform. **Structurally unusable for M365 and for customer Azure.** |
| **B** | **CSP program support entitlement** | The **customer's** | GDAP relationship + Entra role, exercised from the **CSP tenant** | Customer tenant break/fix. This is what a partner actually consumes when filing on a customer's behalf. |
| **C** | **CSP contractual support obligation** | Neither — a duty, not an entitlement | The MPA | Reseller owes customer; distributor owes reseller; Microsoft owes distributor/direct-bill. |

**The MAICPP incidents do not let an indirect reseller bypass the distributor for customer break/fix.** They were never a customer-facing escalation path. Where an indirect reseller *can* reach Microsoft directly for a customer issue (M365, Dynamics), it does so through **system B — the customer's entitlement via GDAP — consuming zero MAICPP incidents.**

---

## 1. What the MAICPP support incidents actually are

Primary source [MS-OFFICIAL]: [Partner Technical Support for Cloud or On-Premises Products](https://learn.microsoft.com/en-us/partner-center/benefits/mpn-benefits-technical-support) — ms.date 2025-07-24, **updated 2026-08-20**. (Note: `/benefits/manage-technical-support` and `/support/report-problems-with-microsoft-products` both 404 — pages moved.)

### 1.1 Quantities

[MS-OFFICIAL, [benefits-at-a-glance](https://learn.microsoft.com/en-us/partner-center/benefits/benefits-at-a-glance), ms.date 2026-03-16, aligned to the Benefits Guide of 18 Feb 2026]:

| Benefit | Solutions Partner designation | Success Expanded | Success Core | Launch |
|---|---|---|---|---|
| Partner Cloud Support incidents | **50** | 5 | 2 | — |
| On-premises support incidents | **20** | — | — | — |
| TPD advisory hours | **50** | 10 | 5 | — |
| TPD technical sales prep | **Unlimited** | Unlimited | Deducts advisory hours | — |

"The only Microsoft AI Cloud Partner Program offer that includes on-premises support is the SPD offer." Offers stack — a partner may hold SPD *and* Core *and* Expanded, but "can't buy multiple instances of the same offer."

### 1.2 Naming drift (three names, one benefit)

- "Partner Cloud Support (**previously known as Signature Cloud Support**)"
- "Partner On-premises Support, **formerly Microsoft Product Support**"
- [benefits-at-a-glance] still calls it "Microsoft Product Support (on-premises) incidents"; [escalating-to-microsoft] still says "Product Support Incidents."

Three Microsoft pages, three names. No page dates the rename. [UNVERIFIED]

### 1.3 Activation and redemption

- **Role to activate:** "Your Partner Center account must have the Microsoft AI Cloud Partner Program **Partner admin or Global admin** role." A dimmed Activate button is always this.
- **Path:** Partner Center → Benefits → Technical support & consultation → select Benefit Name → Activate → Access ID and Contract ID appear in 1–2 minutes.
- **Who can then use it:** "After activation, **any user** in the Microsoft AI Cloud Partner Program tenant can view the shared access ID and contract ID… If a user lacks access to the partner tenant, you can distribute these IDs through email." Any Entra work account **or Microsoft account** works for on-premises support.
- **Linking:** once per user account per year per offer. Linking in one portal (e.g. Dynamics) carries to Azure and others.
- **Redemption portals:** Azure portal (Help + Support → Support Plans → Link support benefits); Power Platform admin center; Dynamics F&O (Manage support plans → Add contract); on-premises via **engagecenter.microsoft.com** → Add/Purchase Plan → Add Contract ID → "Partner On-premises support 20."

### 1.4 Expiry

The Benefits pane "displays the number of remaining incidents and the **activate-by date (end date)**." Per [MS-OFFICIAL, [Benefits FAQ](https://learn.microsoft.com/en-us/partner-center/benefits/benefits-faq-new), ms.date 2026-02-13, updated 2026-06-22]: benefits "remain available for redemption for **13 months from the Membership start date**," and "**Support and advisory benefits — 12 months from benefits unlocked date.**" So: unlock within 13 months of membership start, then consume within 12 months of unlocking.

### 1.5 Scope — the crux

[MS-OFFICIAL], verbatim, **Azure** section:

> "For Azure, the current experience is different for CSP and non-CSP partners (**including Indirect Resellers**):
> - The CSP experience is for **Direct-Bill and Indirect Providers only. They own the technical support relationship with the customer.**
> - **Indirect Resellers make contact via their Indirect Provider to create a support request for a customer.**
> - Non-CSP partners can use Partner Cloud Support for **their own Azure tenant**."

[MS-OFFICIAL], verbatim, **Microsoft 365** section:

> "The Microsoft 365 admin centre doesn't allow support plans to be linked using access ID and contract ID. Therefore, **you can't use the Partner Cloud Support benefit to create support requests**."

And in the FAQ: "If a support portal doesn't accept an access ID and contract ID, **the partner benefit can't be used**."

**Net effect for an indirect reseller holding a designation:** the 50 Partner Cloud Support incidents are consumable only against **Dynamics 365 / Power Platform** and against **the partner's own Azure tenant**. They are mechanically impossible to spend on Microsoft 365 (any tenant, including their own) and administratively barred from a customer's Azure subscription.

The mirror-image rule [MS-OFFICIAL, [report-problems-on-behalf-of-a-customer](https://learn.microsoft.com/en-us/partner-center/customers/report-problems-on-behalf-of-a-customer), ms.date 2025-03-18, updated 2025-12-03]:

> "**Your CSP program support entitlement doesn't provide support for your own partner subscription.** Because of this limitation, you need to provide your valid support plan entitlement when you create a service request that concerns your own partner subscription. Examples include **Microsoft AI Cloud Partner Program contract ID**, Premier, or an Azure support plan."

That is the cleanest official statement of the A/B split.

### 1.6 What deducts an incident

- "Creating a technical support request… **decreases your incident count**. If the request is closed as a **duplicate or a bug, the request is refunded**. Partner Cloud Support requests for **billing, quota, or subscription are deducted on creation and might be refunded on closure**."
- "**Requests handled by the Partner Center frontline team don't consume incidents from any support plans**" — free and unlimited.

### 1.7 The tenant-isolation gotcha

[MS-OFFICIAL, [enroll-as-indirect-reseller](https://learn.microsoft.com/en-us/partner-center/enroll/enroll-as-indirect-reseller), ms.date 2026-05-20]: Microsoft **recommends** "applying tenant isolation and setting up your CSP enrollment in a **separate tenant** from your MAICPP tenant."

If followed, the Access ID/Contract ID lives in the MAICPP tenant while GDAP and customer work live in the CSP tenant — two sign-ins for two support systems. TPD fails outright from a CSP-only account with "**You aren't authorized for this action. You must have a program-associated account.**" Microsoft partly anticipates this ("distribute these IDs through email") but never flags the operational friction. [COMMUNITY/inference]

---

## 2. The CSP support obligation chain

### 2.1 Reseller → customer (mandatory)

[MS-OFFICIAL, [customer-support](https://learn.microsoft.com/en-us/partner-center/customers/customer-support), ms.date 2025-01-23, updated 2026-02-18]:

> "**CSP customers can't create support requests themselves. They must contact you for support.** When customers contact you for support, you're required to: Receive incoming support requests… Diagnose issues to the best of your ability… Resolve issues within scope of the baseline support boundaries."
> "Direct bill partners own the customer relationship from end-to-end. **Indirect resellers should work with their indirect providers to support customers.**"

The reseller may resell, outsource, or build the support structure, and "can charge for all or part of the support." Support contact email and phone are collected **at enrollment** — "the ability to support customers directly is a key requirement to be a CSP indirect reseller."

Customers are actively routed back: "the customer experience in both Microsoft 365 & Azure portals **redirects the customer to contact their Partner of record**."

### 2.2 Distributor → reseller: capability language, no SLA

- "Being an indirect provider means you have the **infrastructure and capabilities to support indirect resellers at scale**."
- Distributors "enable Indirect Resellers to: Sell Microsoft cloud offers; Provision subscriptions; **Support customers operationally**."
- "They **can** provide you with customer support… **Different Distributors offer various support and services. Evaluate the Distributors in your area.**"

**Microsoft publishes no minimum SLA, coverage hours, or escalation deliverable that a distributor owes its resellers.** Distributor eligibility requirements sit behind `aka.ms/CSPDistributorEligibilityRequirements` (not retrievable). This is a genuine structural gap — see §5.

One concrete mechanic [MS-OFFICIAL, [indirect-provider-tasks-in-partner-center](https://learn.microsoft.com/en-us/partner-center/customers/indirect-provider-tasks-in-partner-center), updated 2026-05-29]: the distributor can "**Designate the reseller as the support contact for specific subscriptions**" and "**Delegate support for a subscription**."

### 2.3 Support plans: required for direct bill, not for indirect resellers

Direct bill [MS-OFFICIAL, [direct-bill-eligibility-requirements](https://learn.microsoft.com/en-us/partner-center/enroll/direct-bill-eligibility-requirements), ms.date 2026-08-26]: "active Microsoft support plan (**ASfP or PSfP**) at the Partner Global Account level," maintained annually — "Active **PSfP, ASfP, or UfP (when broadly available)**."

Indirect reseller [MS-OFFICIAL, [indirect-reseller-eligibility-requirements](https://learn.microsoft.com/en-us/partner-center/enroll/indirect-reseller-eligibility-requirements), updated 2026-06-25]: active MAICPP + PLA; ≥$1,000 TTM CSP revenue; MFA + security contact; signed MPA. **No support plan requirement and no support-capability assessment.**

### 2.4 May an indirect reseller file customer service requests directly?

**Yes for M365/Dynamics; no for Azure** — but Microsoft states this inconsistently across four pages:

| Source | What it says | Scope |
|---|---|---|
| [gdap-least-privileged-roles-by-task](https://learn.microsoft.com/en-us/partner-center/customers/gdap-least-privileged-roles-by-task) (ms.date 2024-11-25) | "**Indirect resellers can't create support requests for Azure. Instead, they must work with their indirect providers.**" | Azure blocked |
| [report-problems-on-behalf-of-a-customer](https://learn.microsoft.com/en-us/partner-center/customers/report-problems-on-behalf-of-a-customer) | Opens "you as an **CSP Direct or Indirect Provider** can file"; boxed Important restricts only Azure: "**Indirect resellers and/or Advisors can't open support requests in the Azure portal on customer's behalf, even if they have a support contract.**" | **Self-contradictory** |
| [support-resource-options](https://learn.microsoft.com/en-us/partner-center/support/support-resource-options) (ms.date 2026-02-18, newest) | "**Appropriate roles: All partners enrolled in the CSP program.**… Note that **only Indirect Providers and Direct Bill partners can open support requests in the Azure portal** on customer's behalf." | Clearest |
| gdap-least-privileged-roles-by-task, reseller section | Tier-1 technician table lists "**Service support administrator — Submit support requests on behalf of the customer**" for indirect resellers | Confirms resellers do file |

**Operative reading: Azure = provider only; everything else = any CSP partner with GDAP.** Expect to have to argue this with front-line support.

### 2.5 Where the reseller is unambiguously barred (commercial)

[MS-OFFICIAL, [support-resource-options](https://learn.microsoft.com/en-us/partner-center/support/support-resource-options)], verbatim:

> "**Appropriate roles**: Partners enrolled as Direct bill or Indirect Provider in Partner Center ONLY. **Partners enrolled as Indirect Reseller should contact their Indirect Provider for all scenarios listed in the following table.**"

That header governs two tables: **(a)** CSP pricing, invoices, credit requests, reconciliation files, PEC, CSP payments, credit memos, Azure charges; **(b)** Azure quota increases, reservation exchanges/refunds, subscription channel transfers, cancellations, Azure pricing, license-based purchase/provisioning/pricing, promotions, customer transfers, **qualified offers (EDU/Gov/Nonprofit)**, third-party marketplace provisioning.

Also distributor-routed: Indirect Reseller payments / POR association, product key fulfilment, MAK activation-limit increases.

Direct-to-Microsoft exceptions: software activation errors (VL activation centers), Windows Home→Pro Education upgrade keys, Dynamics Dual Use Rights keys — "Microsoft can provide support to Indirect Resellers only for specific scenarios."

---

## 3. GDAP: the actual path for customer issues

> "**Service requests on behalf of customers should be filed through Partner Center to ensure access to technical support entitlement for CSP.**"
> "Users with the *Admin agent role* and the appropriate GDAP role (such as **Service support administrator**) can select **Administer** under **CSP** → **Service Requests** → **New request**."
> "This will redirect you to the appropriate product portal **in the context of your partner account for the customer tenant**."

Two credential layers simultaneously: a Partner Center role on the CSP tenant (**Admin agent**) and a GDAP-delegated Entra role on the *customer's* tenant.

**Context matters:** "When you sign into Microsoft Azure or Microsoft 365 admin center portals directly, you're viewing those experiences in **your own context, not a customer's context**. For that reason, the only time you should sign-in… directly is when you're creating a service request for **your own** subscriptions."

### Required GDAP roles by workload

| Workload | Least-privileged requirement |
|---|---|
| **Microsoft 365** | GDAP role with `Microsoft.office365.supportTickets/allEntities/allTasks` — e.g. **Service support administrator** |
| **Dynamics 365 / Power Platform** | Same |
| **Azure subscription** | Reseller relationship + GDAP Entra role **and** Azure RBAC with `Microsoft.Support/supportTickets/write` (Support request contributor). *Indirect resellers barred regardless.* |
| **Microsoft Entra ID** | GDAP Entra role + Azure RBAC Support request contributor; or with customer Entra P1/P2, a role with `microsoft.azure.supportTickets/allEntities/allTasks` |

Service support administrator is rated **Simple** complexity — appropriate for a tier-1 helpdesk group. Microsoft's own tier-1 MSP technician bundle for indirect resellers pairs it with Security reader, Intune admin, SharePoint admin, Teams comms support specialist, Help Desk admin, Authentication admin, Exchange admin, License admin, User admin, Groups admin, Directory reader, Message center reader, Printer admin, Guest inviter.

**On the form:** "Be sure to enter **your** contact information… **not your customer's**." Review later at M365 admin center → See all support tickets, or Azure portal → Manage support requests.

**Mixed estates:** "Customer with both CSP and Direct **TRIAL** subscriptions only have the option to contact their CSP partner… Customers with both CSP and Direct **PAID** subscriptions have the option to open a service request with Microsoft **or** contact their Partners."

**Tenant lockout exception:** if the partner has no GDAP access, "advise **your customer** to get in touch with support **directly** by calling the numbers listed under 'business users'." The one documented case where the "customers can't create support requests" rule inverts.

---

## 4. TPD advisory hours

Primary source [MS-OFFICIAL]: [technical-benefits](https://learn.microsoft.com/en-us/partner-center/benefits/technical-benefits) — ms.date 2024-10-02, updated 2026-02-25.

**Eligibility:** "Only partners with Solutions Partner designation, Partner Success Core Benefits, or Partner Success Expanded Benefits are eligible… **TPD services aren't provided to customers or partners or resellers who don't have the mentioned designations. It includes scenarios in which they might be on the same call as an eligible partner.**"

**Nothing in TPD documentation excludes indirect resellers.** Eligibility keys purely to the MAICPP offer held, not CSP authorization type. **TPD is the one designation benefit an indirect reseller can use at full stated value.**

**Explicitly NOT covered**, verbatim across delivery scenarios: training delivery; long-term consulting (>25 hours per engagement); building complete architecture; code reviews/troubleshooting/performance tuning; application development beyond light PoCs; hands-on support in a production environment; integration of non-Microsoft solutions; sales pipeline planning; complete demo environments; **end-customer discussions**; licensing pricing and price lists; RFP response; license terms; and decisively — "**Break-fix support and troubleshooting, hotfixes, on-site services, direct-to-customer support, or hands-on support in a production environment.**"

**What it does cover that is genuinely useful to an indirect MSP:**

- "Help plan **Cloud Service Provider (CSP) enrollment**, including technical architecture and requirements."
- "Help make efficient use of **Partner Center workspaces, including customer and order management in the CSP program**."
- "Help in **Pricing and Billing workspaces in Partner Center that are specific to the CSP program**."
- "Improve the **security posture of the partner organization** and support CSP customers… by using **security best practices**."
- "Help develop application and automation by using the **Partner Center SDK and API**."
- Architecture design and reviews, best practices and patterns, implementation guidance, industry adaptation, Marketplace listing, co-sell submission.

Corroborated from an unexpected place [MS-OFFICIAL, direct-bill-eligibility-requirements, ms.date 2026-08-26]: "the **Technical Presales and Deployment (TPD)** team can help by: Advising on the most appropriate **CSP model and partner tenant architecture**; Answering authorization requirement questions and risk scenarios; Guiding the design of secure customer tenancies."

**In-scope products:** Microsoft 365 (all platforms — Teams, Exchange Online, SharePoint Online, OneDrive, Project Online, Endpoint Management, **Entra, Purview**, Windows 11 Pro/Enterprise); Business Applications (D365 online, Power Platform, Sales Copilot); Azure (all IaaS/PaaS/data/AI/dev, Azure Stack); Windows Server & SQL Server within Mainstream support. Out of scope: exclusively on-premises Exchange/SharePoint, on-prem Dynamics/GP/SL/AX/NAV, hardware devices (HoloLens, Xbox).

**How to request:** Partner Center → Benefits → **Technical pre-sales & deployment** → Partner Advisory Hours → Activate Benefits tab → case title, description, product search → submit. Direct link `partner.microsoft.com/dashboard/v2/benefits/technicalpresales`.

- **Auto-activated, no admin gate:** "Your TPD benefits **automatically activate** and are available to **all users**… **Sign in with any Partner Center user account**." (The page header contradicts this by naming MAICPP Admin; the body is almost certainly correct.)
- **Turnaround:** "A Partner Technical Consultant should reach out to you **within two business days**."
- Include full international dial code; state time zone; "**select the relevant country/region and language because it determines where your request routes**."
- **CSP-only accounts fail** with "You aren't authorized for this action. You must have a program-associated account."
- If you hold ASfP/PSfP, cloud consultations route via your Partner Success Account Manager instead.

**Distributor involvement in TPD: none.** No Microsoft page routes TPD through the indirect provider.

---

## 5. Paid support plans — and why they don't help you

| Plan | Scope |
|---|---|
| **Premier Support for Partners (PSfP)** | Fee-based, all products |
| **Advanced Support for Partners (ASfP)** | Fee-based, cloud products only |
| Partner Cloud Support | MAICPP benefit, cloud only |
| Partner On-premises Support | MAICPP benefit, recent on-prem only |

**ASfP** [CHANNEL-PRESS, ASfP Fact Sheet PDF]: Sev 1 response 1 hour, Sev 2 4 hours, Sev 3 8 hours, Sev 4 24 hours; covers Azure, M365, D365, Power Platform; Services Account Managers and Partner Technical Consultants; "ability to open and manage incidents on behalf of customers." Pricing ~**$1,250/month** PAYG or from **~$16,500/year** — third-party sources only, `partner.microsoft.com/support/*` 403s to bots. [UNVERIFIED]

### Unified for Partners (UfP) — not for indirect resellers

[MS-OFFICIAL, [Partner Center April 2026 announcements](https://learn.microsoft.com/en-us/partner-center/announcements/2026-april), dated 2026-04-03]:

- **Impacted audience, verbatim: "CSP distributors and direct bill partners."** Indirect resellers are not the audience.
- "UfP is being introduced through a deliberate phased approach, beginning with **pilots**… followed by gradual expansion in **H1 of fiscal year 2027** ahead of planned **general availability in H2 of FY 2027**."
- "The **Support Services designation** is your starting point… Attain the designation to… unlock **performance-based discounts of up to 40% on UfP**."
- [MS-OFFICIAL, mpn-benefits-technical-support]: "UfP modernizes partner support with **revenue based pricing aligned to Cloud Solution Provider (CSP) cloud business.**"
- [CHANNEL-PRESS]: UfP replaces ASfP and PSfP; unlimited 24×7 reactive support for CSP workloads; partner-led frontline with Microsoft as backstop; **ASfP retirement targeted January 2027**, PSfP to follow. Not confirmed on Learn.

### Should an indirect reseller buy one? No.

No Microsoft document requires it, and every requirement naming these plans is scoped to direct bill or distributor. **The decisive commercial fact** [MS-OFFICIAL], verbatim:

> "**Indirect resellers and/or Advisors can't open support requests in the Azure portal on customer's behalf, even if they have a support contract.**"

The bar is on **authorization type, not entitlement**. An indirect reseller who buys ASfP still cannot open a customer Azure case. **Buying a paid partner support plan does not unlock the customer-Azure path.**

A reseller planning to *become* direct bill has reason to engage early, but note the sequencing rule: "You can begin discussions to purchase a support plan **after** you successfully complete and pass the capabilities assessment… **Don't sign or activate the support plan until your CSP credit approval is complete.**"

### The Support Services designation — a distributor diligence question

[CHANNEL-PRESS, Alif Consulting / CloudCockpit / Sherweb, reporting Ignite Nov 2025]: eligibility is **CSP Direct Bill partners and CSP Distributors** holding a Solutions Partner designation and an active support contract. **Indirect resellers are explicitly not eligible.** Self-nomination in Partner Center from ~2026-03-31. Capability pass valid 2 years, CSAT pass 1 year. Reported attainment mid-2026: roughly 35 partners worldwide.

**Correct use for an indirect reseller: ask your distributor whether they hold it.** From FY27 it gates the distributor's own elevated support access and UfP discounting — which determines the quality of the escalation path you inherit.

---

## 6. The decision tree

*MAICPP benefit* = partner's own 50/20 incidents · *Customer CSP entitlement* = the customer's, via GDAP from Partner Center · *Free* = nothing consumed · *Distributor* = commercial agreement.

| Problem | Where an indirect reseller goes | Entitlement | Role / key |
|---|---|---|---|
| **Own tenant — Azure** | Azure portal, own context → Link support benefits → Create support request | **MAICPP Cloud Support** (1 of 50) | Partner/Global admin to activate; Access ID + Contract ID |
| **Own tenant — Microsoft 365** | M365 admin center, own context. **Benefit cannot attach** | Own M365 subscription support | Own tenant admin |
| **Own tenant — Dynamics / Power Platform** | Power Platform admin center or LCS → add contract | **MAICPP Cloud Support** (1 of 50) | Access ID + Contract ID |
| **Own on-premises** (N or N-1, Mainstream) | engagecenter.microsoft.com → Add Contract ID → "Partner On-premises support 20" | **MAICPP On-prem** (1 of 20) | Access ID + Contract ID; Entra or MSA |
| **Customer — M365, EMS, Intune, Teams, Exchange** | **Partner Center → CSP → Administer → Service Requests → New request** | **Customer's CSP entitlement.** Zero MAICPP | Admin agent + GDAP **Service support administrator** |
| **Customer — Dynamics / Power Platform** | Same Partner Center path | Customer's CSP entitlement | Admin agent + GDAP Service support admin |
| **Customer — Azure** | **The distributor.** Barred even with a paid support contract | Distributor's | Distributor's Admin agent + GDAP + RBAC |
| **Presales architecture / licensing Q&A / demo guidance** | Partner Center → Technical pre-sales & deployment | **TPD presales — unlimited** at SPD | Any Partner Center user in the MAICPP tenant |
| **Deployment help / architecture review / security posture / SDK** | Same → **Partner Advisory Hours** | **TPD hours** (of 50) | Any Partner Center user in MAICPP tenant |
| **Partner Center itself — GDAP stuck, expiry, notifications** | Partner Center Help + support → Contact Support | **Free, unlimited** | Partner Center user |
| **GDAP not working in a workload portal** | Open from the affected workload portal, not Partner Center | Depends on context | Per workload |
| **CSP billing, invoices, pricing, recon, PEC, credits, payments** | **The distributor** | Distributor's | — |
| **Provisioning, promotions, customer transfers, qualified offers (EDU/Gov/NFP), 3P marketplace** | **The distributor** | Distributor's | — |
| **License assignment failing / count mismatch** | Microsoft 365 administration support, directly | Customer's M365 support | GDAP License administrator |
| **Azure quota, reservation exchange, channel transfer** | **The distributor** | Distributor's | — |
| **Product keys / MAK activation limits** | **Distributor** for fulfilment; direct to Microsoft only for VL activation errors, Win Home→Pro Edu keys, Dynamics Dual Use Rights | Varies | — |
| **Incentives payments, payout/tax profiles** | Partner Center support; **POR association → distributor** | Free frontline | Incentives Admin / User |
| **Security vulnerability in a Microsoft product** | msrc.microsoft.com/report (Coordinated Vulnerability Disclosure) | Free, never an incident | Anyone |
| **Active security incident in a customer tenant** | File as customer break/fix at high severity; escalate in parallel via distributor | Customer's CSP entitlement | Admin agent + GDAP Service support admin + Security reader | 
| **Customer locked out (MFA / lost admin)** | With GDAP: self-remediate per Preventing Tenant Lockouts. **Without GDAP: the customer phones Microsoft directly** | None | GDAP Authentication / Privileged Authentication admin |
| **Marketplace (third-party ISV) product** | **The ISV.** "Microsoft doesn't provide product support for Microsoft Marketplace products" | None | — |

**Note:** Microsoft publishes **no partner-specific security-incident-response escalation path for CSP** beyond MSRC vulnerability reporting. [UNVERIFIED — appears not to exist]

### The one-line rule

> **If the problem is in a customer's tenant, you go through GDAP (M365/Dynamics) or your distributor (Azure, billing, provisioning) — and your 50 incidents are untouched. If the problem is in your own tenant, or in Dynamics/Power Platform, that's what the 50 incidents are for. If the question starts with "how should we…" rather than "why is this broken," that's TPD — 50 hours plus unlimited presales.**

---

## 7. Documentation defects (findings in their own right)

1. **Whether indirect resellers may file customer service requests at all** — four pages, three different scopes. See §2.4.
2. **Benefit naming drift** — three names live simultaneously across pages updated in 2025 and 2026.
3. **TPD role gate** — header says "MAICPP Admin"; body says all users, any account. Body is almost certainly correct.
4. **Technical support page role gate** — header names Admin agent (a CSP tenant role); body requires MAICPP Partner admin or Global admin (a MAICPP tenant role). Different tenants.
5. **The M365 exclusion is never stated as a design decision** — framed as a portal limitation. The consequence, that the single largest workload an SMB MSP sells sits entirely outside the 50-incident benefit, is never surfaced in benefits marketing.
6. **The 50 incidents are marketed identically to all partners.** benefits-at-a-glance lists "Partner cloud support incidents: 50" with no CSP-authorization caveat; the caveat is three clicks deep. **This is a documentation defect, not partner misunderstanding.**
7. **No published distributor→reseller support SLA floor.** Microsoft obliges the reseller to support the customer and obliges direct-bill partners to buy a plan, but leaves the reseller's own escalation path entirely to private contract — while routing that reseller's billing, provisioning and customer-Azure escalations exclusively through that unregulated channel.

---

## 8. Could not verify

| Item | Why |
|---|---|
| **UfP Support Services Description** — response times, scope, eligibility by CSP type, whether indirect resellers can ever buy it | Landing page serves only document links; terms inside PDFs |
| **UfP pricing / revenue-based model** | `aka.ms/UfP_datasheet` requires sign-in |
| **ASfP and PSfP current list pricing** | partner.microsoft.com 403s; only third-party figures (~$1,250/mo, ~$16,500/yr) |
| **ASfP/PSfP retirement dates** (reported Jan 2027) | Trade press only |
| **Support Services designation formal criteria** | Behind partner-facing Solutions Partner page tab |
| **CSP Distributor Eligibility Requirements**, incl. any support obligation to resellers | `aka.ms/CSPDistributorEligibilityRequirements` not retrievable |
| **MPA / CSP Program Guide verbatim support clauses** | Sign-in required; only the Learn paraphrase is public |
| **Date "Signature Cloud Support" became "Partner Cloud Support"** | No Microsoft page dates it |
| **Distributor-specific SLAs / white-label helpdesk terms** (TD SYNNEX, Pax8, Ingram, Crayon) | Private commercial agreements |
| **Partner-specific security-incident escalation path for CSP** | Appears not to exist as published guidance |
