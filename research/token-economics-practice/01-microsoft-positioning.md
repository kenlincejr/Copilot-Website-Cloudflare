# What Microsoft says publicly about Copilot consumption economics and the partner role

**Gathered:** 2026-10-11. **Status:** research record, no page changed.
**Part of:** [`research/token-economics-practice/`](./00-synthesis-and-talk-track.md). Sources are tagged VERIFIED (a primary Microsoft page read directly) or SECONDARY (press, analyst or channel source). Every quote is under 15 words. No distributor other than TD SYNNEX is named.

---

## (A) Headline verdict

**Microsoft supports the thesis in substance but has not endorsed it by name.** It has not said in its own words that partners should build a consumption-governance managed service. What it has done:

- **Products.** It has built the governance tooling.
- **Defaults.** It has set billing defaults in CSP that force a consumption conversation into every Copilot Business sale.
- **Partner guidance.** It names "FinOps for AI" and "manage and optimize AI at scale" as partner opportunities.
- **Pay.** It has started paying partners for consumption outcomes, namely Cowork activation and paid-usage growth.

The CFO's line on the July 2026 earnings call is the strongest executive support available. Amy Hood said customers need "observability of token spend and the manageability of token spend."

Three caveats keep this from being a clean endorsement:

1. **The money still pays on seats.** FY27 growth margin rewards license workloads (Copilot, E5, E7). No public document gives partner margin on Copilot Credits.
2. **No partner view of cost.** Cost Management is a tool inside each customer's tenant. No documented multi-tenant cost dashboard for partners was found, although multi-tenant *agent* management exists in preview.
3. **The partner framing is about growth.** Microsoft's partner language is "accelerating consumption growth" and "natural path to expanded consumption," not cost containment.

So the playbook should present governance as what makes growth sustainable. Microsoft does not present it as a brake on spend.

---

## (B) Quotes and sources

### Executives and earnings

| Speaker / source | Quote | URL, date | Status |
|---|---|---|---|
| Amy Hood, CFO, FY26 Q4 call | "evolving our business model beyond per-seat to per-seat-plus-consumption" | microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4 (July 29, 2026) | VERIFIED |
| Amy Hood, same call | "observability of token spend and the manageability of token spend" | same | VERIFIED |
| Satya Nadella, same call | "added usage-based billing to Cowork, with thousands of customers already paying" | same | VERIFIED |
| Satya Nadella, same call | "we introduced Autopilots, autonomous, long-running agents with full enterprise compliance" | same | VERIFIED |
| Amy Hood, same call | "usage based credit consumption in the category up 4X quarter over quarter" (customer-service agents) | same | VERIFIED |
| Satya Nadella, same call (Q&A) | "it's seat plus usage" | fool.com transcript (Aug 7, 2026) | SECONDARY |
| Satya Nadella, Davos | "tokens per dollar per watt" as an economic metric | Davos coverage, e.g. illai.substack.com (Jan 20, 2026) | SECONDARY |
| Judson Althoff, CEO Commercial | "1.3B agents in circulation by 2028" | blogs.microsoft.com/blog/2026/03/09/introducing-the-first-frontier-suite-built-on-intelligence-trust/ (Mar 9, 2026) | VERIFIED (the figure looks like a third-party forecast he cites) |
| Nicole Dezen, Chief Partner Officer | "standardize advancing Copilot and agents from conversation to consumption" | blogs.microsoft.com/blog/2026/04/21/accelerating-frontier-transformation-with-microsoft-partners/ (Apr 21, 2026) | VERIFIED |
| Nicole Dezen, same post | "60% of CSP partner revenue is now tied to value-added services" | same | VERIFIED |
| Jared Spataro, CMO AI at Work | "full control to choose models and match cost to value" | blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/ (Sept 25, 2026) | VERIFIED |

The Dezen sentence about conversation to consumption is the closest any executive comes to the playbook thesis. It is aimed at CSP partners and puts consumption, not seats, as the end state.

### Partner Center announcements (all VERIFIED)

**Sept 25, 2026, "Introducing the new Copilot"** (learn.microsoft.com/en-us/partner-center/announcements/2026-september):
- The partner opportunity is to "manage and optimize AI at scale."
- "FinOps for AI introduces new ways to govern costs."
- Partners can turn this into "expanded services, differentiated software, increased consumption, and deeper customer relationships."
- This is the most direct Microsoft statement linking partners, FinOps and services.

**Sept 10, 2026, Copilot Cowork CSP Activation Incentive** (same page):
- It recognizes partners "helping customers realize value from AI and accelerating consumption growth."

**Sept 2, 2026, new CSP "flex spend plan" sandbox offer** (same page):
- "Microsoft is continuing to evolve its business toward consumption-based offers."

**Oct 1, 2026, UBB on by default for Copilot Business** (learn.microsoft.com/en-us/partner-center/announcements/2026-october):
- "Early usage can create a natural path to expanded consumption."
- Partners are told to "help your customers understand their usage-based billing options."

**Aug 10, 2026, multi-tenant agent management through GDAP, public preview** (learn.microsoft.com/en-us/partner-center/announcements/2026-august):
- It "supports consistent governance across customer environments."

**May 29, 2026, "Agents move into action"** (learn.microsoft.com/en-us/partner-center/announcements/2026-may):
- "Partners who move first will define the market."

### Partner blog for the new Copilot (Sept 2026)

- **URL:** partner.microsoft.com/en-US/blog/article/ai-at-work-marketing-moment-sept-2026
- **Access:** The page returned 403 to automated fetches and was not read.
- **What press attributes to it:** Channel Insider (Sept 29, 2026) quotes it as listing opportunities across "AI advisory, security and governance, agent development, FinOps… and managed services." That is SECONDARY.
- **Attribution warning:** The phrase "durable advisory and managed-services opportunity," which circulates online, is the reporter's wording, not Microsoft's. Do not attribute it to Microsoft.

### Product documentation (VERIFIED)

**Copilot Credits Guide, October 2026** (aka.ms/CopilotCredits/LicensingGuide, which resolves to cdn-dynmedia-1.microsoft.com/.../Copilot-Credits-Guide.pdf):
- Credits "serve as the common currency in this usage-based model."
- It says the Microsoft 365 admin center "provides the FinOps controls."
- In CSP, "partners manage provisioning, billing, and provide direct support."

**Setup page, ms.date 2026-10-01** (learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-copilot-credits-setup):
- Admins should set per-user limits to "prevent runaway spending of Copilot Credits by one individual user."

**Message Center MC1479276, Sept 25, 2026** (via mc.merill.net):
- New dashboards "connect credit consumption with outcomes." This is SECONDARY: a mirror of the Microsoft notice.

---

## (C) Partner program and incentive mechanics

**The CSP default (VERIFIED, Oct 1, 2026 announcement):**
- **Start date:** From December 1, 2026, usage-based billing (UBB) is on by default for new Microsoft 365 Copilot Business purchases in CSP, standalone and bundled. The date was moved from November 2.
- **Billing method:** Pay-as-you-go is the default.
- **Default cap:** 4,000 Copilot Credits per user per month, which admins can adjust. Microsoft's example: 100 users can consume up to 400,000 credits a month.
- **Markets left out at launch:** Australia, Belgium, Brazil, France, Germany, India, Italy, Korea, the Netherlands, Poland and Spain.
- **Sandbox:** Opens November 2.
- **Partner resources:** A UBB-for-SMB partner deck and FAQ (aka.ms/UBBforSMB/FAQ). The FAQ sits behind partner sign-in and was not read.

**How the money flows (VERIFIED):**
- The CSP guidance page (learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-copilot-credits-csp-partner-macc, Oct 1, 2026) tells partners to make sure an Azure subscription is "linked to your partner billing account."
- They then configure "user access controls… spending limits, and alerts" in the Microsoft 365 admin center.
- Inference: consumption lands on the partner's Azure plan invoice. The partner therefore carries the collection risk on every credit the customer burns, which is a strong commercial reason to govern it.

**The arithmetic (calculated from VERIFIED inputs):**
- Pay-as-you-go is $0.01 per credit (Credits Guide, Oct 2026), so the default cap is up to $40 per user per month.
- That is more than twice the $18 promotional Copilot Business seat price (July 1, 2026 announcement: 1–300 licenses).
- This is the clearest single reason the token conversation has to be part of every SMB Copilot sale.

**Pre-purchase plan tiers (VERIFIED, Credits Guide):**
- The pre-purchase plan (P3) is a one-year, pay-upfront pool.
- Nine tiers run from 300,000 credits (5% discount) to 300,000,000 credits (20% discount). Unused credits expire.
- Credits draw down in this order: prepaid capacity packs, then P3, then pay-as-you-go (setup page).
- Both pay-as-you-go and P3 decrement a customer's Azure consumption commitment (MACC).

**Incentives:**

| Mechanism | What it pays on | Source | Status |
|---|---|---|---|
| CSP growth margin (live Oct 1, 2026) | New-to-offer, seat expansion and adoption on Copilot, E5, E7, Defender Suite, Purview Suite, W365 Enterprise; validated per tenant before quoting | Partner Center July 2 and Oct 1, 2026 announcements | VERIFIED |
| Copilot and E5/E7 CSP promotions | Ended Sept 30, 2026 with the move to growth margin | Sept 23, 2026 announcement | VERIFIED |
| Copilot Cowork CSP Activation Incentive (from Sept 1, 2026) | One-time payout for activating and sustaining Cowork use. Reported as $50 per incremental Cowork monthly active user, capped at $12,500 per tenant; gates of 50+ MAU and $2,500+ monthly Cowork consumption, held through month three | Announcement VERIFIED (Sept 10); dollar mechanics from Channel Insider and other channel coverage. The Microsoft deck needs partner sign-in | Mechanics SECONDARY |
| FY27 retirement of the Modern Work run-rate rebate | Shift away from flat run-rate volume | [distributor source] and other channel sources | SECONDARY |
| Partner margin on Copilot Credits or UBB | Not found | — | GAP |

**Designations and specializations (all VERIFIED):**
- **Microsoft 365 Copilot specialization (July 9, 2026).** Performance is now paid monthly-active-usage *growth*, so it counts usage rather than seats sold. Customer references are replaced by a third-party audit. It adds the Agentic AI Business Solutions Architect (AB-100) and AI Agent Builder Associate (AB-620) certifications.
- **Agentic Business Solutions specialization (merged July 31, 2026).** One pathway is two Copilot Studio deployments at $10,000 or more each, trailing twelve months.
- **Frontier Partner specialization (live Sept 30, 2026).** It validates partners who can "design, build, deploy, govern, and secure AI agents." Benefits include Agent P3 credits.
- **Business Applications designation (May 6, 2026).** Copilot Studio now counts toward performance.
- **SMB track for the Azure solution paths (July 31, 2026).** The Azure consumed revenue threshold is removed for partners with 80% or more SMB customers.
- **Partner insights tool, ASPX (Sept 8, 2026).** It now surfaces "users reaching free usage limits" and Cowork usage signals. This is effectively Microsoft giving partners consumption telemetry for selling.

---

## (D) Vocabulary and SMB specifics

**Microsoft's own words, September–October 2026:**
- **"Copilot Credits"** is the billing unit ("common currency") everywhere: Credits Guide, Learn docs, Partner Center.
- **"Usage-based billing (UBB)"** is the commercial model. **"User subscription license (USL)"** is its counterpart for "everyday AI." This split comes from Spataro's Sept 25 blog and MC1479276.
- **"Seat plus usage" / "per-seat-plus-consumption"** is the investor language.
- **"FinOps for AI"** is now a Microsoft product term. Spataro calls it a discipline for managing AI spend, and Cost Management sits under Copilot > Cost management in the Microsoft 365 admin center.
- **"Tokens"** appears in investor talk ("token spend," "token capital," "tokens per dollar per watt") and in technical passages. The Credits Guide says Work IQ cuts "tokens needed for context retrieval" by up to 80%.
- **"Tokens" is not the billing unit.** Microsoft does not publish a token-to-credit conversion. Treat any "1 credit = N tokens" claim as unsupported. (An automated summary of the Guide invented one; the actual PDF has none.)
- **Cost drivers.** The Guide names four cost buckets for Cowork: models, runtime, context and tools.
- **Words not in use.** "Compute units" does not appear in current Microsoft Copilot material.

**The rename (VERIFIED):**
- The Copilot Credits Guide change log records "Microsoft 365 Copilot rebranded as Microsoft Copilot," dated August 2026.
- The Aug 14, 2026 Partner Center notice covers the app taking a "simplified Microsoft Copilot name." The web address moves to copilot.cloud.microsoft from August 18, with broad desktop rollout from mid-September.
- **The naming is inconsistent.** Partner Center still writes "Microsoft 365 Copilot Business" in the Oct 1 UBB notice, and the specialization was renamed *to* "Microsoft 365 Copilot specialization" in July. The playbook should note that both names are live.

**What the new commercial model covers (VERIFIED, Spataro, Sept 25):**
- Cowork, Code, Autopilot and frontier models run on UBB.
- Autopilot is "expanding to private preview at the end of the month."
- Services on the Cost Management dashboard: Cowork, advanced work in SharePoint/OneDrive, Work IQ API, Copilot Managed Runtime and Teams Phone Agent (Learn overview, Sept 30, 2026).
- Copilot Studio agents join in October 2026 (MC1479276).

**SMB specifics (VERIFIED):**
- **Seat cap.** Copilot Business and the new Business Standard/Premium with Copilot SKUs ($23.50 and $32) cap at 300 licenses (July 1, 2026 announcement).
- **Investor view of SMB.** Hood said SMB seat adds carry lower revenue per user, and that seat growth was "primarily in our small and medium business and frontline worker offerings" (FY26 Q4).
- **Dezen on SMB.** Copilot Business gives "SMBs a practical path to adopt AI more broadly" (Apr 21).
- **Discoverability.** UBB features are visible to all users by default (MC1479276), and spending policies auto-apply to new services by default (Learn overview). Both are governance decisions an SMB will not know to make unless a partner raises them.

**Control surface a partner would manage (VERIFIED, Learn setup and overview pages):**
- **Limits and alerts:** tenant and per-user limits, and alert emails at a credit or percentage threshold that repeat daily until reset.
- **Requests and models:** credit-request routing, and model profiles (Cowork only, minimum two models).
- **Reporting:** views by policy, user, group, agent, service and funding source.
- **Roles:** Global Administrator or Billing Administrator create policies. AI Administrator and License Administrator edit them. AI Reader and Global Reader get read-only dashboards.

---

## (E) Gaps: where Microsoft is silent or nothing was found

1. **No explicit "build a managed service" instruction.** Microsoft names FinOps for AI and managed services as partner *opportunities*. No program, offer template, Marketplace category or designation for "managed Copilot," "Copilot as a service" or AI cost governance was found.
2. **No partner-side cost view.** None of the four Learn UBB pages mention GDAP, partner admins or a multi-tenant cost dashboard. The Partner Center customer list and the partner insights tool do not show Copilot Credit burn per customer, as far as could be found. Multi-tenant management covers agents only, and is in preview.
3. **No published margin on credits.** Growth margin is license-based, and nothing public states partner margin on Copilot Credit consumption billed through the partner's Azure plan.
4. **No token-to-credit conversion.** Microsoft deliberately abstracts it; per-task consumption "varies."
5. **The FinOps Foundation link is unclear.** Microsoft's own posts say it sits on the FinOps Foundation governing board and works on FOCUS, its cost-data specification (SECONDARY; the Microsoft Tech Community pages would not render). The Foundation's "FinOps for AI Overview" page, updated Feb 17, 2026, did not list Microsoft among named contributors in this read. Moderate confidence; re-check by hand.
6. **Executives not found on this topic:** Rodney Clark, Charles Lamanna. No Ignite 2025 partner statement on credits was found; the partner blog returned 403.
7. **No "every company will have agents" quote.** Not found verbatim from Nadella. The nearest is Althoff's 1.3 billion agents forecast.
8. **FY27 Q1 earnings are not out yet.** The call is expected in late October 2026 and should be checked for Copilot Credit revenue disclosure.
9. **GitHub Copilot premium requests** came up only as a passing Hood remark, and only in a secondary transcript summary. There is no partner guidance tying them to CSP.
10. **Gated documents not read:** the CSP Partner Copilot FAQ, the UBB Default-On FAQ and the Cowork incentive deck all need partner sign-in, and the partner.microsoft.com blog returned 403. Whoever holds a partner login should read them, especially for partner visibility and margin, because the answers to gaps 2 and 3 may sit there.

**Bottom line for the playbook:** Microsoft has built the meter, made it the default for SMB, priced the default cap above the seat price, and routes the bill through the partner. It names FinOps for AI as a partner opportunity and pays for activated consumption. What it has not done is tell partners, in so many words, to sell governance as a managed service, or give them a multi-tenant cost view to deliver one. That missing piece is the space the playbook can fill, while staying accurate about what Microsoft has and has not said.
