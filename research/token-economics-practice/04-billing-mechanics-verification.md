# How Copilot Credit billing and payment work for indirect CSP resellers

**Gathered:** 2026-10-11. **Status:** verification memo, feeds section 9 of [`copilot-token-economics.html`](../../copilot-token-economics.html). Research-agent memo, kept close to verbatim; first person is the agent's.
**Part of:** [`research/token-economics-practice/`](./00-synthesis-and-talk-track.md). Tags: VERIFIED means the Microsoft primary page was read directly. SECONDARY means press or community. Paraphrases should be checked against the cited page before any wording is published as a quote. No distributor other than TD SYNNEX is named.

**Why this memo exists.** Ken's notes for the "how the money flows" section cited three non-Microsoft sources (a channel article, a forum post, and the playbook's own earlier text) for the automatic Azure subscription, partner liability and partner-level budgets. Each claim was checked against Microsoft's own pages before the section was written.

---

## 1. Auto-provisioned Azure subscription

- **What Microsoft says (VERIFIED):** The Partner Center announcement (dated Oct 1, 2026; page updated Oct 8) says new Copilot Business licenses "include the Azure subscription setup needed for usage-based billing."
  - Confirms the Dec 1, 2026 start (moved from Nov 2); the 4,000 credits per user per month default, admin-adjustable; new purchases only, including bundles.
  - The impacted audience explicitly includes distributors and indirect resellers.
  - Not available at launch in 11 markets: AU, BE, BR, FR, DE, IN, IT, KR, NL, PL, ES.
  - Source: https://learn.microsoft.com/en-us/partner-center/announcements/2026-october
- **Admin center behavior (VERIFIED, ms.date 2026-10-01):** If the admin cannot access any Azure subscription, the system creates one automatically, using the billing account linked in the Microsoft 365 admin center. Admins can instead pick an existing subscription or create a new one. A default billing method is preconfigured and can be changed at any time.
  - Source: https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-copilot-credits-setup
- **CSP-specific steps (VERIFIED, ms.date 2026-10-01):** Step 1, make sure an Azure subscription exists and is linked to the partner billing account (associate the customer's existing one, or create one in the Azure portal or Partner Center). Step 2, connect it in the Microsoft 365 admin center. Detailed CSP instructions are deferred to a gated Partner FAQ.
  - Source: https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-copilot-credits-csp-partner-macc
- **Who owns the subscription (VERIFIED, ms.date 2025-09-29):** CSP Azure plan subscriptions sit in the customer tenant under the partner's billing account. When the direct partner or indirect provider creates one, that partner becomes the default owner through AOBO and grants the indirect reseller access. For an indirect reseller, the distributor's billing account carries the subscription; the reseller has delegated access.
  - Source: https://learn.microsoft.com/en-us/partner-center/customers/azure-plan-manage
- **Exact channel sentence: NOT FOUND.** "Provisioned automatically … unless an existing subscription is linked" appears in press only (SECONDARY, e.g. epcgroup.net blog on the October 2026 default).
- **Opt-out or pre-link: NOT FOUND publicly.** Probably in the gated UBB Default-On FAQ (aka.ms/UBBforSMB/FAQ) and the CSP Partner Copilot FAQ.

**Verdict: PARTLY VERIFIED.** Automatic Azure setup for new CSP Copilot Business licenses is confirmed and indirect resellers are in scope. The exact channel wording, a partner opt-out and pre-linking before purchase were not found publicly.

---

## 2. Partner liability

- **Who carries the bill (VERIFIED, ms.date 2025-06-18):** Direct-bill partners and distributors are financially responsible for customers' fraudulent purchases and for customer nonpayment. Signing the Microsoft Partner Agreement binds partners to these policies.
  - Source: https://learn.microsoft.com/en-us/partner-center/security/nonpayment-fraud-misuse
- **Azure consumption specifically (VERIFIED):** The fraud-alerts page tells CSP partners "you're responsible for your customers' Azure consumption." Applies to Direct Bill and Indirect Providers.
  - Source: https://learn.microsoft.com/en-us/partner-center/security/azure-fraud-notification
- **Who Microsoft invoices (VERIFIED, ms.date 2025-03-05):** Only direct-bill partners (tier 1) and indirect providers (tier 2), payment due in 60 days.
  - Source: https://learn.microsoft.com/en-us/partner-center/billing/billing-basics
- **Where the reseller sits (VERIFIED):** Indirect resellers have no direct billing relationship with Microsoft. The chain runs Microsoft → indirect provider → indirect reseller → customer.
  - Source: https://learn.microsoft.com/en-us/partner-center/enroll/csp-supported-partner-relationships
- **Copilot Credits land on the Azure bill (VERIFIED, ms.date 2026-09-25):** Pay-as-you-go bills to the linked Azure subscription. Cowork, Copilot Studio and Work IQ usage all appear under one "Microsoft Copilot Studio" service.
  - Source: https://learn.microsoft.com/en-us/microsoft-365/copilot/usage-based-billing-compare-dashboard-views
- **Forum phrase:** "Transacting partner is responsible for all charges" appears only in press and forums (SECONDARY). Not on a Microsoft page.
- **The reseller-to-distributor step:** Microsoft does not document what the reseller owes the distributor. That is set by the distributor's reseller terms.

**Verdict: PARTLY VERIFIED.** Microsoft holds the distributor liable and invoices the distributor. The reseller's exposure comes through its contract with the distributor, which Microsoft does not publish.

---

## 3. Partner-level Azure budgets and suspension

- **Budgets in Partner Center (VERIFIED, ms.date 2025-02-27):** Under Billing › Azure spending (NCE), the Admin agent role sets a budget per customer (not per subscription). Email alerts every seven days once usage reaches 80 to 100% of the budget; none above 100%. The budget does not stop usage. Not available in sandbox accounts.
  - Source: https://learn.microsoft.com/en-us/partner-center/billing/set-an-azure-spending-budget-for-your-customers
- **Finer-grained budgets (VERIFIED, ms.date 2026-01-08):** Azure Cost Management in the partner tenant supports budgets by customer, subscription, meter or ResellerMPNID. Only Admin agent and billing admin users at direct partners and indirect providers can use it. Resellers see retail-rate costs in the customer tenant only, with RBAC access and the provider's cost-visibility policy turned on.
  - Source: https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/get-started-partners
- **Stopping usage (VERIFIED):** An Azure plan can be suspended only once it has no active subscriptions or reservations, and cannot be cancelled. Partners with global admin and admin agent roles can cancel Azure subscriptions (documented for compromise cases); customers can reactivate while the plan is active.
  - Source: https://learn.microsoft.com/en-us/partner-center/customers/azure-plan-manage
- **Indirect resellers:** The Partner Center budget tool sits in the Billing workspace of the billed partner (the distributor). No Microsoft page says indirect resellers can set budgets themselves.
- **The control a reseller can use directly:** spending limits and alerts in the customer's Microsoft 365 admin center.

**Verdict: PARTLY VERIFIED.** Per-customer budgets and alert emails are confirmed, and so is subscription cancellation. Budgets do not block spend, suspension is not a spend control, and the tools are documented for distributors and direct partners, not indirect resellers.

---

## 4. Billing timing

- **Pay-as-you-go (VERIFIED):** Azure plan usage is billed monthly for the calendar month. The invoice is ready by the eighth of the following month (not the first business day), payment due in 60 days. The Credits meter is billed in arrears at the end of the billing month (Copilot Credits Guide, October 2026; the Learn comparison page agrees).
  - Sources: https://learn.microsoft.com/en-us/partner-center/billing/azure-plan-billing (ms.date 2025-03-03); billing-basics; https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/ai/Copilot-Credits-Guide.pdf
- **Capacity packs (VERIFIED):** $200 per pack per month for 25,000 credits, footnoted "billed annually". Unused credits do not roll over. No October 2026 edition of the Copilot Studio Licensing Guide was found; the April 2026 edition and the pricing page carry the figure.
  - Sources: Copilot Studio Licensing Guide, April 2026; https://www.microsoft.com/en-us/copilot/pricing/copilot-studio
- **Pre-purchase plan (P3), conflict between Microsoft sources:** The October 2026 Credits Guide calls P3 a one-year pay-upfront plan with 5% to 20% tiers. The Learn page (ms.date 2026-09-25) says P3 can be paid up front or monthly. P3 is final: no cancellations or exchanges. In CSP it is bought through the Azure reservations flow.
  - Source: https://learn.microsoft.com/en-us/azure/cost-management-billing/reservations/copilot-credit-p3
- **CSP license billing frequency:** NCE license billing can be monthly or annual in general. No CSP-specific statement of the billing frequency for the capacity pack SKU was found.

**Verdict: PARTLY VERIFIED.** Monthly-in-arrears billing is confirmed; the invoice date is the eighth, not the first business day. Pack pricing is confirmed. P3 payment timing conflicts between sources, and pack billing frequency in CSP is unconfirmed.

---

## 5. Channel margin on credits

- **PEC eligibility (VERIFIED, ms.date 2025-11-03):** Partner Earned Credit applies to all Azure plan pay-as-you-go offers except reservations, savings plans, third-party items, Marketplace items and Spot VMs. Copilot Credits are not mentioned.
  - Source: https://learn.microsoft.com/en-us/partner-center/billing/partner-earned-credit-faq
- **PEC and indirect resellers (VERIFIED):** PEC goes to the "billing partner"; the provider must grant RBAC to the reseller.
  - Sources: https://learn.microsoft.com/en-us/partner-center/billing/partner-earned-credit and the FAQ above
- **Base pricing:** Azure plan pricing is uniform at published prices. Microsoft publishes no standard CSP discount on Azure plan meters.
- **Growth margin (VERIFIED):** Live since Oct 1, 2026, license workloads only. Copilot Credits are not listed. For distributors and direct-bill partners.
- **Cowork activation incentive (VERIFIED):** Launched Sept 1, 2026 for indirect resellers and direct-bill partners; rewards Cowork adoption and usage. Payout terms are in the gated incentives guide (aka.ms/coworkactivationbonus).
- **Inference:** Read literally, the PEC exclusion list does not exclude the Copilot Studio meter, but no Microsoft page confirms PEC applies to it. P3 appears in Azure as a reservation benefit, so reservation exclusions likely apply.

**Verdict: NOT FOUND.** Microsoft publishes no margin, PEC confirmation or standard discount for Copilot Credit meters. The only related reward is the Cowork activation incentive, whose terms are gated.

---

**Gaps to close:** the unsettled claims all depend on two gated partner PDFs: the UBB Default-On FAQ and the CSP Partner Copilot FAQ. Someone signed in to the partner portal needs to read them.
