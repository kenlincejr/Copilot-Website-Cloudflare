# The other Microsoft AI meters an SMB partner meets, October 2026

**Gathered:** 2026-10-12. **Status:** research-agent memo. VERIFIED = Microsoft primary page read. SECONDARY = third-party or not re-read on a primary page.

## Summary

| Meter | Unit and price | Included with an SMB license? | Default | Cap control | SMB relevance | Status |
|---|---|---|---|---|---|---|
| **Business Central agents** (Payables, Expense, Sales Order) | Copilot Credits. Expense agent 50 credits a receipt; Payables 50 plus 5 a line; Sales Order 2 to 5 a step | No. Base Copilot in BC is included; these agents bill Copilot Credits separately | Off until a billing model is configured; blocked when quota runs out | Power Platform admin center capacity allocation; Azure budgets for PAYG | **High** | VERIFIED, learn.microsoft.com BC tenant-admin-center-manage-consumption-billing (2026-07-08) |
| **AI Builder credits sunset** | Existing customers can buy or renew AI Builder add-ons only until **November 1, 2026**; new customers must buy Copilot Credits; new premium licenses stop seeding credits. Microsoft's page says both "Seeded credits will be removed on November 1, 2026" and "honored through the end of the contract term". In overage, flows draw Copilot Credits, then block | Legacy, ending | Unassigned credits usable tenant-wide by default | Power Platform admin center, capacity add-ons | **High**, dated and actionable | VERIFIED, learn.microsoft.com ai-builder/credit-management (2026-10-09) |
| **Power Automate pay-as-you-go** | $0.60 a premium flow run; $3.00 an unattended desktop run | No | Opt-in | Power Platform admin center | Medium | SECONDARY on prices |
| **Unlicensed staff on grounded agents** | Copilot Credits through a Studio pack or PAYG | Chat free; tenant-grounded agents for unlicensed users are not | Off until a Studio billing subscription is linked | Power Platform admin center | **High**, the common accidental start of agent spend | SECONDARY; consistent with the m365-agents-admin-guide in the Studio memo |
| **Work IQ API** | Copilot Credits | Same pool | Per usage-billing policy | Microsoft 365 admin center, Cost management | Medium, custom apps | VERIFIED, usage-based-billing-compare-dashboard-views (2026-09-25) |
| **Dynamics 365 Sales and Customer Service agents** | Copilot Credits; Sales Premium reportedly includes 1,000 credits a user a month, pooled | Partly | On within license | Power Platform admin center | Medium, D365 partners | SECONDARY |
| **Security Copilot** | $4 an SCU-hour provisioned; $6 overage | **No Business Premium inclusion.** E5 and E7 get 400 SCUs a month per 1,000 licenses | Auto-provisioned on E5 and E7 | SCU count | Low to medium | VERIFIED, security-copilot-inclusion (2026-06-19) |
| **Microsoft Agent 365** | $15 a user a month standalone; in E7 | Business Premium is a qualifying prerequisite | A seat, not a meter | — | Medium, a seat add-on | SECONDARY |
| **Azure AI Foundry and Agent Service** | Per-token model prices; agent compute and tools | No | Opt-in Azure resource | Azure budgets, alert only | Medium, custom builds only | VERIFIED on mechanics |
| **Fabric Copilot** | Draws Fabric capacity units | No | On where capacity exists | Fabric capacity admin | Low at 30 to 300 seats | SECONDARY |

## Cross-meter view
- **Copilot Credits are one currency** across Cowork, Copilot Studio, Power Platform workloads, Business Central agents and Work IQ. VERIFIED.
- **No single pane.** The Microsoft 365 admin center shows Cowork, Work IQ and Studio in credits. The Power Platform admin center manages Studio and Power Platform capacity. Azure Cost Management shows dollars. VERIFIED.
- **One invoice line.** Cowork, Copilot Studio and Work IQ all land under the Azure service "Microsoft Copilot Studio." Attribution needs separate subscriptions. VERIFIED.
- **Azure Cost Management does not show prepaid pack usage.** VERIFIED.
- A community "Consumption Central" template spans Cowork, Studio, GitHub and Foundry. Not an official Microsoft product. SECONDARY.

## For the page
- The credit meter is wider than Copilot. Business Central and Power Automate customers are on it whether or not they own a Copilot seat.
- November 1, 2026 is a second dated campaign: the last day to buy or renew AI Builder credits. Checked directly on the Microsoft page 2026-10-12; quote its contradiction, do not resolve it.
- Security Copilot, Fabric and Foundry go on a watch list, not the price sheet.

## Gaps
1. Teams Premium, Teams Phone agents and Azure Communication Services were not researched.
2. Verify the D365 Sales Premium included-credit figure and the Agent 365 price on Microsoft pages.
3. Verify the Power Automate PAYG run prices on a Microsoft page.
