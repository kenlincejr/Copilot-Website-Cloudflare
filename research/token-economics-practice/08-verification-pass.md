# Verification pass on the agent, GitHub and pricing claims

**Gathered:** 2026-10-12. **Status:** research-agent verification memo. Corrects memos 05, 06b and 07 where noted.

| # | Claim | Result | Figure or quote | Source | Date |
|---|---|---|---|---|---|
| 1 | Intercom Fin price | VERIFIED | "$0.99 per outcome"; 50 outcomes a month minimum | fin.ai/pricing | read 2026-10-12 |
| 2 | Zendesk automated resolutions | VERIFIED | $1.50 committed, $2.00 pay-as-you-go; included allowance per agent by plan | zendesk.com/pricing | read 2026-10-12 |
| 3 | Salesforce Agentforce | VERIFIED | $2 per conversation; $500 per 100,000 Flex Credits; a standard action is 20 credits, about $0.10; $125 a user add-on | salesforce.com/agentforce/pricing | read 2026-10-12 |
| 4 | GitHub Copilot seat prices | VERIFIED | "$19 USD per granted seat per month" Business; "$39" Enterprise | docs.github.com, plans for GitHub Copilot | read 2026-10-12 |
| 5 | Promo allotment and step-down | SECONDARY | 3,000 / 7,000 from June 1 to Sept 1, 2026, then 1,900 / 3,900. Standard figures VERIFIED on docs; the changelog post was not reached | docs.github.com plus secondary | — |
| 6 | GitHub billed through CSP | **CORRECTED** | "The CSP-sold Azure Plan offer (MS-AZR-0017G) is unsupported for GitHub's Azure billing connection." Azure billing works for direct subscriptions only | docs.github.com, connecting an Azure subscription | read 2026-10-12 |
| 7 | Gartner over 40% canceled by end of 2027 | VERIFIED (title) | Costs, unclear value, inadequate risk controls | gartner.com newsroom | **2025-06-25** |
| 8 | MSP AI adoption figures | **CORRECTED** | 91% offer or use AI: MSP 501, Channel Futures, Sept 23, 2026. 48% top need and 13% meaningful revenue: Kaseya 2026 State of the MSP. Two sources, not one | businesswire via morningstar.com; kaseya.com press release | 2026 |
| 9 | IDC 40% of SMBs without full-time IT | VERIFIED | "40% of the nearly 3,000 SMBs IDC surveyed do not have a single full-time IT employee" | idc.com blog | 2026-06-30 |
| 10 | Per-agent credit limit with hard stop | VERIFIED | Set limit, notification threshold; "Hard stop: The agent is automatically turned off once it hits the defined limit" | learn.microsoft.com, manage-copilot-studio-copilot-credits-capacity | 2026-10-02 |
| 11 | Govern credit consumption guidance | VERIFIED | Allocate a defined amount, turn off tenant draw; "doesn't provide a tenant-wide default agent limit" | learn.microsoft.com, guidance/govern-credit-consumption | 2026-10-06 |

## What changes because of this
- **GitHub is a customer-billed meter for most CSP partners.** The customer pays GitHub directly, by card or invoice, or through a direct Azure subscription. The partner does not carry the GitHub bill. The partner's GitHub offer is governance and advice, not billing, and there is no pass-through line to collect.
- **A hard stop turns the agent off.** That protects the bill and breaks the service. A customer-facing agent needs a threshold alert well before the stop, and a named person who decides whether to raise the limit.
- **Cite the MSP figures as two surveys.**
