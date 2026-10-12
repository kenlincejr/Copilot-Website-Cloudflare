# GitHub Copilot billing for organizations, as of October 2026

**Gathered:** 2026-10-12. **Status:** research-agent memo, verification pass. Feeds the multi-meter partner conversation in [`07-agents-and-github-partner-conversation.md`](./07-agents-and-github-partner-conversation.md). VERIFIED means a docs.github.com or github.blog page was read. SECONDARY means press or community.

## Facts

| Claim | Finding | Status | Source |
|---|---|---|---|
| Billing unit | Since **June 1, 2026**, GitHub bills Copilot usage in **GitHub AI Credits**, priced by model and tokens. Premium requests are legacy, kept only for some Pro/Pro+ annual plans. | VERIFIED | github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/ |
| Included credits | **1,900** per Copilot Business license and **3,900** per Copilot Enterprise license, per month. A June to August 2026 promotional allotment was higher and stepped down on Sept 1, 2026. | VERIFIED (current); promo figures SECONDARY | docs.github.com/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises |
| Price of a credit | **$0.01** | VERIFIED | same |
| Pooling | Included credits pool at the organization or enterprise level. Per-user and cost-center budgets can sit inside the pool. | VERIFIED | same |
| Overage default | "Additional usage is enabled by default for organizations and enterprises." No default dollar budget. Blocking overage means turning off the "AI credits paid usage" policy. | VERIFIED | same |
| Cap behavior | "There is no automatic fallback to lower-cost models when a budget is exhausted." Usage stops until the next cycle or a budget increase. | VERIFIED | same |
| Seat prices | Business **$19** a user a month. Enterprise **$39**. | VERIFIED (memo 08) | docs.github.com/en/billing/concepts/product-billing/github-copilot |

## What consumes credits
- Chat on premium models. Base code completions stay unlimited on paid plans.
- Copilot coding agent sessions.
- Copilot code review, which since June 1, 2026 also consumes GitHub Actions minutes.
- Spark, extensions and Spaces.
- Large-context and reasoning models carry multipliers.
- Copilot CLI and SDK are credit-metered; session limits shipped 2026-07-01.

## Controls
- User-level budgets, as a universal default or per-user override (GA June 2026).
- Cost-center per-user budgets (GA 2026-06-30).
- Enterprise spending limits on total overage.
- Alerts at 75, 90 and 100% of budget.
- The "AI credits paid usage" policy, off to hard-stop overage.
- In-product budget-increase requests from users (GA 2026-09-16).
- Users see their own consumption (2026-07-20).

## Channel
- GitHub Enterprise and Copilot can be billed as Azure metered services through EA, MCA or CSP. CSP partners can create the GitHub enterprise account and both parties see costs in Azure Cost Analysis. SECONDARY.
- **Corrected 2026-10-12 (memo 08):** GitHub's Azure billing connection does not support the CSP Azure plan (MS-AZR-0017G). For most CSP partners, the customer pays GitHub directly and the partner does not carry the bill.

## Two meters, not one
The **GitHub Copilot harness inside Copilot Studio** bills **Microsoft Copilot Credits** from the first build action (see the rate-card memo, manage-usage-github-copilot-harness, 2026-08-28). **GitHub Copilot** for developers bills **GitHub AI Credits**. Same penny, different meter, different admin screen, different invoice.

## Partner services found
- A GitHub partner consultancy publishes a bookable "Copilot Usage and Readiness Review" tied to usage-based billing. No public price. SECONDARY.

## Gaps
1. Get a 2026 primary page restating the $39 Enterprise price.
2. Confirm the promotional step-down from a github.blog post before quoting before-and-after numbers.
3. CSP partner-of-record billing for GitHub metered usage.
4. A GitHub services-partner program page.
