# The Copilot adoption prompt library

**Six data sources a partner can pull without a BI tool, and twenty-three prompts that turn them into the findings, the chart and the one-pager.**

Draft 1 — for testing against real tenant data before it goes on the page. Source of record for a future rewrite of Section 10 of `copilot-adoption-audit.html`. Note: P04 (build the chart in a workbook) is retired — the workbook and its DIY formulas were removed from the site on 27 August 2026.

---

## How to use this

**Part 1** tells you *where the data comes from* — six reports, the exact click path to each, the roles required, the windows available, and the columns you actually get. Verify against a live tenant before quoting any of it to a customer; Microsoft moves the furniture.

**Part 2** is the prompt library. Every prompt is written to be pasted verbatim. Each states what to compute, what format to answer in, and what to do when it cannot answer. The third instruction is the one that matters and the one everybody leaves out.

**Part 3** is the running order, and it matters more than any individual prompt.

### Before you paste a customer's file into anything

**Get written permission, and pick the tool deliberately.** The best option by a wide margin is to run these *inside the customer's own tenant* — Copilot in Excel on the open workbook, or Copilot Chat in work mode with the file attached — so the data never leaves their boundary and the exercise sits under their existing agreement. Failing that, use a business-tier AI account with data-training disabled, never a consumer one.

**The export is anonymised by default.** Unless someone has turned concealment off, every identity column contains a 32-character hash rather than a name. Every finding in this library is distributional and works perfectly against hashes. If you did de-anonymise for a role join, strip the name and principal-name columns before the file goes anywhere.

**Never ask a model to reshape the file.** Do not paste a CSV in as text and ask for it to be reformatted, transposed or cleaned. The numbers become unverifiable, you get a different answer on the second run, and none of it survives an admin in the room. Attach the file. If the model cannot read the file, that is a tooling problem, not a prompting problem.

### Which tool runs which prompt

Not every prompt runs everywhere, and pretending otherwise wastes an afternoon.

| Prompt type | Runs well in | Notes |
| --- | --- | --- |
| Analysis over one attached CSV — P01–P03, P07–P17, P19–P23 | Copilot Chat in work mode with the file attached; Copilot in Excel on the open workbook | Copilot in Excel is strongest for anything that has to be reproduced in cells |
| Build a chart in the workbook — P04 | Copilot in Excel only | It edits the workbook; a chat model can only describe the chart |
| Produce a rendered one-page visual — P05, P06 | A model that writes and returns code | These emit a self-contained HTML file you open in a browser. A chat model that cannot return a file will give you the copy but not the artefact |
| Multi-file joins — P10, P11, P14, P15, P16 | Anything that accepts two or more attachments | State the window of each file every time |

---

# Part 1 · The six data sources

## 1.1 Microsoft Copilot usage report — the spine

Everything in this library is built on this one. One row per person who held a Copilot licence at any point in the window.

| | |
| --- | --- |
| **Portal** | Microsoft 365 admin center — `admin.microsoft.com` |
| **Path** | **Reports** › **Usage** › **Microsoft Copilot** › **Copilot** › the **Usage** tab. If Reports is not in the navigation, choose **Show all** first |
| **Windows** | 7 · 28 · 90 · 180 days. Take 180. Note 28, not 30 — Microsoft changed this |
| **Role** | **Reports Reader** is the right ask. Also sufficient: Usage Summary Reports Reader, AI Administrator, Exchange / SharePoint / Teams / Teams Communications Administrator, User Experience Success Manager, Global Administrator. **Global Admin is not required** — say so early, because "we'd need to give you global admin" is the single most common reason this conversation dies |
| **Before exporting** | Scroll to the user-level table, choose **Choose columns**, switch on **everything**. The default set is not enough — the per-application last-activity columns are off by default, and they are what the surfaces-touched measure is built from |
| **Export** | The **Export** button *on the user-level table*. One CSV |
| **Screenshots we hold** | `assets/copilot-adoption-audit/usage-dashboard.png`, `copilot-usage-summary.png`, `user-detail-table.png`, `choose-columns.png`, `concealed-user-list.png` |

> **The wrong Export.** The ellipsis menu on each individual chart also offers an Export. That gives you the chart's aggregate — a handful of totals, no per-user row — and it is the mistake almost everyone makes the first time. Screenshot: `assets/copilot-adoption-audit/chart-export-wrong.png`

**Columns you get, and what they are for**

| Column | What it measures | Why you care |
| --- | --- | --- |
| `Prompts submitted (any app)` | Total prompts across all in-scope host apps in the window | **Your depth axis** |
| `Active Days` | Days the user submitted prompts to Copilot Chat in the window | **Your frequency axis** |
| `Copilot Chat (work) prompts submitted` | Grounded, work-mode chat | Half the grounding ratio |
| `Copilot Chat (web) prompts submitted` | Ungrounded web chat | The other half. The *ratio* is the finding, never either number alone |
| `Last activity date (UTC)` | Most recent message to Copilot Chat in any host app — **fixed regardless of window** | Separates "never started" from "stopped in month two". Two different conversations |
| `Last activity date of Teams / Word / Excel / PowerPoint / Outlook / OneNote / Loop Copilot (UTC)` | Per-application last touch, each independent of the window | Count the non-blank ones per user and you have **surfaces touched**. This is the column set nobody uses |
| `Last activity date of Copilot Chat (work) / (web) / Microsoft 365 App / Microsoft Edge (UTC)` | Last touch per chat entry point | Finds the web-only population even when prompt counts are small |
| `Last activity date of any agent (UTC)` | Last agent touch | A crude agent flag without needing the agents report |
| `User name` · `Display name` | Principal name and full name — **concealed by default** | You do not need these to build anything here |

> **Header names are not stable.** Microsoft does not publish the CSV header row for this report, and at least five header families are in circulation — the admin-centre Copilot report, the admin-centre Copilot **Chat** report, Graph `/beta/reports`, Graph `/copilot` v1, Graph `/copilot` v2. Every prompt below makes the model *map* columns by meaning and report what it mapped, never match one exact string.

## 1.2 Microsoft Copilot **Chat** usage report — the unlicensed population

Sits directly beside the report above in the same navigation, which is why it gets pulled by mistake. It is also a genuinely useful source in its own right, for one reason:

> **It covers only users who do *not* have a Microsoft Copilot licence.** That makes it the in-tenant view of free-to-paid whitespace — people already using Copilot Chat, on their own, with nobody paying for them.

| | |
| --- | --- |
| **Path** | **Reports** › **Usage** › **Microsoft Copilot** › **Copilot Chat** |
| **Windows** | 7 · 28 · 90 · 180 days |
| **Export** | **Export** on the user table → CSV |
| **Columns** | `Username`, `Display name`, `Prompts submitted`, `Active days`, `Last activity date (UTC)`, then last-activity per entry point: `Teams`, `Outlook`, `m365.cloud.microsoft/chat`, `Microsoft Copilot (app)`, `Edge`, `Word`, `Excel`, `PowerPoint`, `OneNote` |
| **Availability** | Typically within 48 hours of the end of a day, UTC |

**How to tell the two apart in five seconds.** The Chat report has **no `Prompts submitted (any app)` column and no work/web prompt split**, and its last-activity columns are named for chat entry points rather than for Loop and the Microsoft 365 app. If a file looks thin and has no work/web split, you were handed the Chat report. Neither axis of the main method exists in it.

## 1.3 Microsoft Copilot **Readiness** — who should get the licence next

Same report page as the usage report, the *other* tab. Almost nobody opens it.

| | |
| --- | --- |
| **Path** | **Reports** › **Usage** › **Microsoft Copilot** › **Copilot** › the **Readiness** tab |
| **Window** | Past 28 days. Available within 72 hours, up to 72 hours latency |
| **Export** | **Export** → CSV. Covers all users with any engagement on Teams meetings, Teams chat, Outlook email or Office docs in the past 30 days |
| **Columns** | `User name`, `Has Copilot license been assigned`, `Uses eligible update channel`, `Uses Teams Meetings`, `Uses Teams chat`, `Uses Outlook Email`, `Uses Office docs`, `Suggested candidate for Copilot` |

`Suggested candidate for Copilot` flags the **top 25% of non-licensed users** by app-usage intensity, re-evaluated weekly, with no ranking inside that 25%. It is only available to customers who have purchased Copilot licences. Microsoft states plainly that it is not intended for evaluating employee performance — quote that line before anyone in the room gets ideas.

This is the report that turns a licence *reclamation* conversation into a *reassignment* conversation, which is a far easier one to have.

## 1.4 Microsoft Copilot **Agents** usage report (preview)

| | |
| --- | --- |
| **Path** | **Reports** › **Usage** › **Microsoft Copilot** › **Agents** |
| **Windows** | **7 or 30 days only.** Not 28, not 90, not 180. Microsoft has said longer windows are coming; today they are not there |
| **Latency** | Usage visible within about an hour |
| **Three tables** | User details · Agent details · Users-and-agent details |
| **User details** | `Username`, `Display name`, `Number of agents used`, `Agent responses received`, `Last activity date (UTC)` |
| **Agent details** | `Agent ID`, `Agent name`, `Creator type`, `Active users (licensed)`, `Active users (unlicensed)`, `Responses sent to users`, `Last activity date (UTC)` |
| **User + agent** | `Agent ID`, `Agent name`, `Creator type`, `Username`, `Responses sent to users`, `Last activity date (UTC)` |
| **Creator type values** | `Your Users` (agent builder, personal or link-shared) · `Your org` (Agents Toolkit / Copilot Studio, admin-approved) · `Microsoft` · `Third-party` · `Any` |

**Three traps, all of which a customer's admin will catch if you do not catch them first:**

1. **The window mismatch is unavoidable.** You are comparing a 7- or 30-day agent figure with a 90- or 180-day usage figure. State both windows every single time the two numbers appear near each other. There is no version of this where you can quietly not mention it.
2. **SharePoint agents used in Teams are excluded** from the metrics entirely.
3. **Cowork usage is excluded** — it has its own report, below.

The report also counts **unlicensed** agent users. A large unlicensed agent population is a licensing conversation, not an adoption one.

## 1.5 Cowork usage report

New surface, separate report, separate navigation — and it is not under Reports.

| | |
| --- | --- |
| **Path** | Microsoft 365 admin center → left navigation **Copilot** → **Cowork** → **Overview** or **Usage** |
| **Window** | Date-range selector on the Usage tab, default 28 days. User-level detail goes back to **1 April 2026** |
| **Export** | **Export** above the usage details → CSV, all users in the table |
| **Columns** | `User ID` (the user's **email address**), `Display name`, `Total tasks`, `Scheduled tasks`, `User-initiated tasks`, `Active days`, `Last activity date` |
| **Headline metrics** | Active Cowork users · Total Cowork tasks · Average tasks per active user · **Retained Cowork users** (active in the previous 7-day period *and* the most recent 7-day period) |

Two things make this worth a prompt of its own. First, the **scheduled-versus-user-initiated split** is the only place in the entire reporting surface where you can see automation running without a human present — a falling user-initiated count against a rising scheduled count is maturation, not decline. Second, **`User ID` is an email address**, so this file is *not* concealed the way the others are. Check that before you attach it to anything.

Cowork also runs on consumptive billing with a grace period, and the Overview tab shows a countdown. A customer inside a grace period is a time-boxed commercial conversation, and it is worth knowing that before the meeting.

## 1.6 Microsoft Graph — if you would rather script it

```
GET https://graph.microsoft.com/v1.0/copilot/reports/
    getMicrosoft365CopilotUsageUserDetail(period='D180', version='v2')
```

Permission: `Reports.Read.All`, delegated or application. The response is a CSV stream.

> **The version trap.** Version 1 — the default if you omit the parameter — does **not** contain prompt counts or active days. It returns refresh date, principal name, display name and per-app last-activity dates, and nothing else. Both axes of this entire method are missing. You must pass `version='v2'`. Period values differ by version too: v1 accepts `D7 D30 D90 D180 ALL`; v2 accepts `D7 D28 D90 D180 ALL`.

## 1.7 Partner Center — which customers to run this on

Everything above is one tenant at a time. This is the layer above it: **which of your customers is worth the afternoon.**

| | |
| --- | --- |
| **Where** | AI Business Solutions & Security Insights (ASPX) — `aka.ms/ASPX`, or Partner Center → **Insights** workspace → **Growth Opportunities** → **Copilot Opportunities** tab |
| **Roles** | Report viewer, or Executive report viewer |
| **Who appears** | Tenants associated to you by **CPOR** claim or **CSP** association (tier 1 or tier 2, monthly or annual). **EA/LSP association shows you the renewal date and nothing else** — Microsoft does not have customer consent to share the rest |
| **Coverage threshold** | Enterprise customers with **more than 150 Microsoft 365 licences**, or SME&C with **more than 25**. Below those lines the customer does not appear at all, whatever their Copilot seat count |
| **Export** | Table view; use the **Change Column** icon to show or download hidden columns |
| **Playbook** | `aka.ms/ASPXPlaybook` · deck at `aka.ms/ASPXAIBS` |

**The columns worth building a call list from**

| Column | Why |
| --- | --- |
| `Copilot Eligible M365 Seats` · `Copilot Seats Whitespace` | Opportunity size, before anyone opens a tenant |
| `Copilot PAU` · `Copilot MAU (Licensed)` · `Copilot Utilization` | Paid seats, active seats, and the ratio. Utilisation is MAU/PAU capped at 100% |
| `Adoption Status` | Microsoft's own ML verdict: `Healthy`, `Failure to Start` (never broke 10% MAU/PAU), `Failure to Adopt`, `Failure to Adopt but Last Month Gain`, `Healthy but Last Month Drop`, `Healthy but Negative Slope`, `Big Gain & Big Drop`, `Starting`. **`Failure to Start` and `Failure to Adopt` are your audit list** |
| `Free Copilot MAU (Unlicensed)` · `Free to Paid Whitespace` | Unlicensed people already using it. Whitespace = unlicensed MAU / (unlicensed MAU + PAU) |
| `Users Experiencing Usage Limits` · `Cumulative License Request` | Demand signals a customer cannot argue with — their own people asking for licences |
| `All Agents MAU`, and the flyout breakdown: `Agents in Copilot Chat`, `Connectors`, `Plugins (Actions)`, `Custom Engine`, licensed and unlicensed each | Agent intensity without opening the tenant |
| `Admin Settings Recommendations` | Frontier enablement, Web Search, blocked 1P agents, channel readiness, app status in Integrated Apps — each flagged healthy or not. **Configuration gaps that look like adoption failure** |
| `EA Renewal` · `Largest Seat CSP Renewal` · `Earliest CSP Renewal` | The clock |
| `Copilot Opportunity` — `Acquire` / `Monetize` / `Grow` / `Other` — plus `Opportunity Reasoning` | Microsoft's recommended motion and its stated reason |
| `Data Security Maturity` · `E7 Opportunity` | The adjacent, usually larger, security engagement |
| Per-app MAU (hidden columns): `Copilot in Teams / Outlook / Word / Excel / PowerPoint / OneNote / Viva Engage MAU` | Surface concentration at book level |

**The honest limitation.** Everything in Partner Center is tenant-level MAU/PAU. There is no per-user row, so no distribution, no quadrants, no medians. It tells you *which door to knock on*. The tenant export tells you *what to say when it opens*. Use both, and never mix their numbers in one sentence — MAU is a rolling 28-day telemetry measure, `Active Days` is a count of days inside a window you chose, and they are not the same thing.

> **Screenshots still to capture.** We hold admin-centre screenshots in `assets/copilot-adoption-audit/`. We do not yet have Agents, Cowork, Readiness or ASPX. Microsoft's own are on the Learn pages listed in Part 4 and are reproducible with permission, as the existing set already is.

---

# Part 2 · The prompts

## Group A · Prepare the file

### P01 — Identify the report and audit the file

*Run this first, always. It catches the wrong report, the wrong version, the wrong window and the licence-removed rows before any of them contaminate a number you say out loud.*

```
You are a data analyst. Attached is a CSV exported from a Microsoft 365 admin center
Copilot report. Do not analyse behaviour yet.

STEP 1 - IDENTIFY THE REPORT. Microsoft does not publish stable CSV header rows for
these reports, so do not match exact strings. Decide which of these you have been
given, from the shape of the columns:

  A. Microsoft Copilot usage report (v2)  - has a total prompt count column, an active
     days column, AND a work-versus-web chat prompt split.
  B. Microsoft Copilot usage report (v1 or beta Graph) - has per-application
     last-activity dates but NO prompt count and NO active days.
  C. Microsoft Copilot CHAT usage report - has a prompt count and active days, but no
     work/web split, and its last-activity columns are named for chat entry points.
     This report covers UNLICENSED users only.
  D. Copilot agents usage report - has agent counts or agent names and responses.
  E. Copilot readiness export - Yes/No columns about licence assignment and app usage.
  F. Cowork usage report - has task counts and a scheduled/user-initiated split.
  G. Something else.

State which one it is and the evidence that decided it. If it is B, stop and tell me
this export cannot be used for quadrant analysis because both axes are absent, and that
I need to re-pull with version='v2'.

STEP 2 - MAP THE COLUMNS. Produce a table with one row per concept below, showing the
actual column header you matched it to and the first non-blank value in that column:
  user identifier / total prompts / active days / work-mode chat prompts /
  web chat prompts / overall last activity date / each per-application last activity
  date / any agent last activity date
Write "not present" where there is no match. Do not guess at a column whose meaning you
cannot establish - say so instead.

STEP 3 - AUDIT. Report:
  a. Row count excluding the header.
  b. For every numeric column: count of blanks, count of zeros, minimum, median,
     maximum.
  c. Count of rows where the metric cells are BLANK, not zero. These are people who
     were never in scope, and they must be excluded from every denominator. State the
     count and confirm you are excluding them.
  d. Count of rows where the metric cells are ZERO. These are licensed people who did
     nothing. Keep them in.
  e. Any row that looks like an artefact: a blank last-activity date with a non-zero
     prompt count, or vice versa.
  f. The report refresh date and period length if either is present in the file.

Present all of this as plain tables. Do not infer, estimate or fill in anything absent
from the file. Where a value cannot be computed, write "not available" rather than
guessing.
```

**Good output** — a report identification with evidence, a mapping table you can eyeball in ten seconds, and an explicit blank-versus-zero split.
**How it fails** — if it starts describing adoption in this answer, it has ignored the instruction and you should distrust the rest of the session. Start again.

### P02 — Derive this tenant's own thresholds

*Stops the model — and you — importing a threshold from a deck. The output of this prompt is the only pair of numbers the rest of the analysis may use.*

```
Using only this file, propose the two threshold values that split this population into
four usage quadrants. Report the row count first.

OPTION A - Distributional. The median of active days, and the median of total prompts.
Report both values.

OPTION B - Operational. A frequency threshold corresponding to being active roughly
every third working day across this window, and a depth threshold separating sustained
use from exploration. Give one sentence of reasoning per number, and state clearly that
these are judgements rather than statistics.

OPTION C - Fixed, for small tenants. Do not compute these; use them as given and say so:
  frequency line = active days >= 9 over a 90-day window
  depth line     = total prompts >= 195 over a 90-day window
These approximate Microsoft's published Copilot user categories - 15 or more Copilot
actions per week, active in at least 9 of the past 12 weeks. Note in your answer that a
prompt is not identical to a Copilot action, so this undercounts.

For each option, show how many users fall in each of the four quadrants:
  high frequency + high depth, high frequency + low depth,
  low frequency + high depth,  low frequency + low depth.

If the file has fewer than about 60 rows in scope, recommend OPTION C and say plainly
that a median-based threshold is unstable at this sample size.

Then say which option gives the more defensible segmentation for THIS tenant and why.

Do not use thresholds from any other organisation or from your training data. If I later
supply a number myself, say so explicitly in your answer so it is on the record.

One thing you must state, because everybody gets it backwards: if both lines are medians,
then roughly half the population sits above each line by construction. A quadrant landing
near 40-50 percent is arithmetic, not a finding. Say this in your answer.
```

**Good output** — two concrete number pairs, four non-empty groups under each, a recommendation with a reason, and the median-arithmetic caveat stated.
**How it fails** — suspiciously round numbers under Option A or B. If it derives exactly 60 days or exactly 375 prompts, it has borrowed them; ask where from.

### P03 — Build and size the four segments

*The core table. The demand for share-of-activity alongside share-of-population is the entire argument.*

```
Using the thresholds you derived above - state which pair you are using at the top of
your answer - assign every in-scope row to exactly one of four segments:

  A DRIFTING          low frequency, low depth
  B PROJECT-DRIVEN    low frequency, high depth
  C LOYAL BUT SHALLOW high frequency, low depth
  D EMBEDDED          high frequency, high depth

One table, one row per segment:
 - user count
 - share of all users, as a percentage
 - share of all prompts submitted, as a percentage
 - median prompts per user
 - median active days per user
 - median prompts per active day
 - median distinct Copilot surfaces ever touched, counted from the non-blank
   per-application last-activity columns
 - median share of chat prompts that were web rather than work

Then split DRIFTING into two sub-groups and size both:
 - tried and stopped: 3 or more surfaces touched
 - never started:     fewer than 3 surfaces touched
These have opposite remedies and must never be merged.

Rules, applied without being asked:
 - Show every segment even if it is zero, and say so explicitly rather than omitting it.
 - SUPPRESSION: for any segment with fewer than 5 users, report the count only. No
   percentages, no medians, no comparisons. Write "n<5 not reported" in those cells.
 - Both percentage columns must sum to 100. If they do not, say so and find the
   missing rows rather than rounding it away.

Finally, in no more than four sentences, state the single most commercially significant
fact in the table. Do not describe all four segments. Pick the one that matters and say
why.
```

**Good output** — percentages summing to 100 in both share columns, the drifting split sized, and a "most significant fact" that is almost always the population-versus-activity gap.
**How it fails** — shares that do not sum to 100, or a missing empty segment. Both mean rows were silently dropped; run P22. On a small tenant, any percentage attached to a segment under five people means the suppression rule was ignored.

---

## Group B · The two artefacts

These are the prompts that produce something you can hand over, rather than something you have to retype into a deck.

### P04 — Build the quadrant chart in the workbook

*Copilot in Excel only. Run it with the export open as a worksheet.*

```
You are working in the open workbook, which contains a Microsoft 365 Copilot usage
report export with headers in row 1.

Build a frequency-against-depth scatter chart on a new sheet named "Chart", following
these instructions exactly.

HELPER COLUMNS, on a new sheet named "Calc", one row per user:
 1. active days  (x)
 2. total prompts
 3. plot depth = MAX(total prompts, 1). A logarithmic axis cannot render zero. Count
    how many users had zero prompts and put that count in a cell labelled
    "excluded from plot - plotted at 1".
 4. segment label, from the two thresholds already agreed
 5. four pairs of x/y columns, one pair per segment, each containing the user's values
    where the user is in that segment and =NA() where they are not.

The NA() matters: a scatter series whose x range contains text or an empty string is
silently demoted by Excel, which discards the x values and plots each point against its
row index. The chart still renders and it is wrong. Gap the series with NA().

THE CHART, on sheet "Chart":
 - XY scatter, markers only, no connecting lines.
 - Four series, one per segment, in this exact order and colour:
     Embedded          #005F6B
     Loyal but shallow #4DA8B8
     Project-driven    #D97706
     Drifting          #9CA3AF   (grey on purpose - it is the absence band, and a loud
                                  colour on 40% of the points makes the chart unreadable)
 - Two further series drawn as dashed grey lines: a vertical line at the frequency
   threshold and a horizontal line at the depth threshold, each built from a two-point
   x/y pair.
 - Y axis: logarithmic, base 10, minimum 1, titled "Prompts submitted (log scale)".
 - X axis: linear, minimum 0, titled "Active days in the period (chat frequency)".
 - Legend at the bottom. Name the two line series for what they mean, including their
   values - for example "Frequency line - 38 active days (median)" - not just "Series 5".
 - Add a text box in each of the four corners of the plot area naming that quadrant and
   giving its user count, its share of users and its SHARE OF ALL PROMPTS.
 - Below the chart, add a caption stating: the number of zero-prompt users plotted at 1,
   the customer name, the window length, the report refresh date, and the sentence
   "Relationships shown are correlational."

Do not resize the chart so that it covers cells containing text. Check the chart's width
against the columns it sits over.

When you are finished, tell me which cells hold the two thresholds, so that I can change
them and watch the whole population re-sort.
```

**Good output** — a chart where the four bands are visually distinct, the two lines are labelled with their values, and each corner carries a count. Change a threshold cell and everything moves.
**How it fails** — points stacked in a vertical line at x = 1, 2, 3… That is the text-in-x-range demotion. Re-run and insist on `NA()` gapping.

### P05 — The tenant X-ray as a one-page visual

*Needs a model that can return code. This is the prompt that reproduces the "Two columns you already have. Four conversations you don't." one-pager.*

```
Using the segmentation you produced, generate a single self-contained HTML file - all
CSS inline, no external requests, no CDN links, no web fonts - that renders as one
landscape page suitable for printing or screenshotting. Return it as a file I can
download and open.

LAYOUT
 - Top left: a small eyebrow line reading "CUSTOMER ZERO - THE TENANT X-RAY", replacing
   Customer Zero with the customer name I gave you.
 - A two-line headline in a heavy serif or heavy sans, first line dark navy, second line
   teal:  "Two columns you already have."  /  "Four conversations you don't."
 - Top right: two large stat figures - the licensed user count plotted, and the window
   length in days - each with a small caption beneath.
 - A short standfirst paragraph, no more than 60 words, explaining that every Copilot
   usage export contains the same two numbers, how often someone shows up and how deep
   they go, and that plotting them against each other sorts an install base into four
   groups, each a different problem, a different offer and a different invoice.
 - Main body, two columns:
     LEFT (about 55% width): the scatter plot, drawn as inline SVG. One dot per user.
       Logarithmic y axis floored at 1. Four colours by segment. Dashed threshold lines,
       each annotated with its value and its meaning. Quadrant background tints. Each
       quadrant labelled A/B/C/D with its name, user count and percentage placed inside
       the plot.
     RIGHT: a stack of four cards, one per segment, lettered to match. Each card carries
       the segment name, its SHARE OF ALL ACTIVITY as a large right-aligned figure, two
       sentences of profile built only from the medians you computed, and a line labelled
       "THE PLAY" giving the intervention.
 - Footer in small type: how to read it (what each axis is, what each line means, that
   the depth axis is logarithmic), the data source, the refresh date, the window length,
   the sentence "Relationships shown are correlational", and how to reuse it - run the
   same two columns on any customer tenant.

COLOURS
  navy #003057 · teal #005F6B · teal light #007B8A · amber #D97706 · grey #9CA3AF
  ice #E4F0F3 · page #F7F8FA · rule #DDE1E7
  Segment colours must match the scatter, the quadrant labels and the cards.

CONSTRAINTS
 - Every number on the page must come from the file. Do not invent a figure, do not
   round a percentage to something tidier than it is, and do not add a benchmark.
 - No currency anywhere.
 - Apply the n<5 suppression rule: a segment under five people gets its count and
   nothing else.
 - If a number you need was not computed earlier, leave a visible placeholder reading
   NOT COMPUTED rather than filling the gap.
```

**Good output** — a page you could put on a screen in a customer meeting without editing it. Every figure traceable to P03.
**How it fails** — invented benchmark figures, or a tidy percentage that does not match the table. Diff every number against P03's output before you show anyone.

### P06 — The seven reversals as a one-page brief

*Run after Group C. This is the "Seven things the channel believes. Seven the data doesn't." one-pager.*

```
You have now tested a set of hypotheses against this tenant. Generate a single
self-contained HTML file - inline CSS, no external requests - that renders as one
landscape page presenting them as a partner-facing brief. Return it as a downloadable
file.

STRUCTURE
 - Eyebrow: "CUSTOMER ZERO - WHAT OUR OWN DATA CONTRADICTED", customer name substituted.
 - Two-line headline, navy then amber: "Seven things the channel believes." /
   "Seven the data doesn't."
 - Top right, under a small label reading "MEASURED, NOT MODELLED": the licensed user
   count, the report period in days, and the total prompts analysed.
 - A grid of numbered cards, one per finding that SURVIVED testing. Each card has
   exactly four parts, in this order and under these headings:
     THE ASSUMPTION           - the belief, in italic, one sentence, stated fairly
     WHAT OUR TENANT SHOWED   - the numbers, with the specific figures in bold
     WHY THAT CHANGES THINGS  - the mechanism, two or three sentences
     DO THIS WITH THE CUSTOMER- the action, naming the specific motion, the audience and
                                the deliverable
 - A final dark panel titled "THE THROUGH-LINE" carrying a one-line thesis and a
   numbered four-step method the reader could run tomorrow.
 - A single guardrail line at the bottom of that panel naming the one thing most likely
   to be got wrong.
 - Footer: every data source used, each with its own window length stated separately,
   the refresh dates, and the sentence "All relationships shown are correlational, not
   causal."

RULES THAT OVERRIDE THE DESIGN
 - Only include a card for a finding you actually tested and that actually held in this
   tenant. If only four held, produce four cards and change the headline to match. Do
   not manufacture a reversal to fill the grid, and do not soften a failed test into a
   qualified one.
 - Where two numbers come from reports with different windows, say both windows on the
   card. Never put them in one sentence as though they were comparable.
 - No currency. No claims about time saved, business outcome, or causation.
 - Apply n<5 suppression.
 - Under each card's numbers, the figures must be reproducible from the file. I will
   check.
```

**Good output** — as many cards as findings that held, no more. Every card ends in an action with an audience attached.
**How it fails** — seven cards when only four tests passed. That is the model filling a template. Ask it which cards it could not evidence and delete them.

---

## Group C · Test the reversals against this tenant

Each of these is a hypothesis test with a stated failure condition. A "no" is a perfectly good answer and the prompts are written to make one easy to give.

### P07 — Exposure or relevance?

```
Test one hypothesis against this file and tell me whether it holds here.

HYPOTHESIS: the low-usage population is not short of exposure to Copilot. They have
already tried it across several applications and stopped, which would make their low
usage a relevance problem rather than a training problem.

To test it:
1. Take the DRIFTING segment only.
2. For each user count the distinct non-blank per-application last-activity columns.
   Call this "surfaces touched".
3. Report the median, quartiles and full distribution of surfaces touched for this
   segment.
4. Compare against the same measure for EMBEDDED.
5. Report what share of DRIFTING has touched three or more surfaces, and what share has
   touched exactly zero.

Then state plainly: does the hypothesis hold in this tenant, partially hold, or fail?
Give the numbers that drive the verdict.

If a meaningful share of the drifting group has touched zero surfaces, the hypothesis
FAILS for them - they are an activation problem, not a relevance problem. Size that
sub-group separately and say so.
```

### P08 — The loyal, stuck users

```
Identify the users who are frequently active but shallow: active on more days than the
tenant median, while running a below-median number of prompts per active day.

Report:
1. How many, and what share of the in-scope population.
2. Their median prompts per active day, against the tenant median and against every
   other segment. State explicitly whether this is the LOWEST rate of any segment.
3. Their median active days against the tenant median.
4. Their grounding mix: median share of chat prompts in web versus work mode.
5. Their median surfaces touched.
6. Their median days since last activity, computed against the report refresh date.

Then answer in plain language: are these people behaving like users who do not trust the
tool, or like users who trust it completely and know exactly one thing to do with it?
Give the evidence, then name the strongest counter-reading of the same numbers.
```

**How it fails** — a confident narrative with no counter-reading. The counter-reading is not optional; it is how you avoid selling into a misread.

### P09 — Did the training cohort actually pull ahead?

*Needs a list of who attended. Ask the customer for attendee email addresses, or, if the export is concealed, ask them to add a Yes/No "attended" column on their side before handing you the file.*

```
Attached are two things: the Copilot usage report export, and a list identifying which
users attended a named training or enablement event.

First, state how many of the attendee list you were able to match into the usage export,
how many you could not, and what you did with the unmatched. If the identity column is
concealed and the attendee list is not, say so and stop - the join cannot be made and I
need the customer to add an attendance flag to the export on their side.

For the matched population, compare the ATTENDED cohort against the NOT-ATTENDED cohort
on every one of these, reporting both figures side by side:
 - median prompts, median active days, median prompts per active day
 - median surfaces touched
 - share never active
 - share in each of the four segments
 - share with any agent activity, if an agent column is present

Then answer two questions separately, and do not merge them:
1. On the HABIT measures - frequency, breadth, persistence - which cohort is ahead, and
   by how much?
2. On the specific measure I name here - agent adoption - which cohort is ahead?

If the trained cohort leads on habit but trails on the newer capability, say so plainly
and state the implication: value from training lands later and elsewhere, in people who
were never in the room.

Confounds you must name before giving any verdict: attendees were probably volunteers or
selected, so they were likely more engaged before the event; the event date sits inside
or outside the window; and cohort sizes may differ enough to make medians unstable. If
either cohort is under five people, report counts only.
```

**Good output** — two separate verdicts, habit and capability, with the self-selection confound named before either.
**How it fails** — a single "training worked / didn't work" answer. That question is not answerable from this data and the prompt is built to stop it being given.

### P10 — Which part of the distribution actually moved?

*Needs two exports of the same tenant from different dates.*

```
Attached are two exports of the same tenant's Copilot usage report, taken at different
dates. State both refresh dates and both window lengths at the top of your answer.

Match users across both files on the identity column. Report how many matched, how many
appear only in the earlier file, and how many only in the later one - and say what each
of those two groups probably represents.

For the matched population only:
1. Split users into quartiles by their usage in the EARLIER file.
2. For each quartile, report the change between the two files in: median prompts, median
   active days, median prompts per active day, median surfaces touched, and the share of
   that quartile that would now cross the power-user threshold.
3. Say which quartile moved most, in both absolute and relative terms, and which moved
   least.

Then answer directly: is the movement in this tenant concentrated at the top, in the
middle, or at the bottom of the starting distribution?

Do not describe this as growth or decline overall. The whole point is where the movement
sat. If the middle moved most, say so and state the implication - that the people worth
scoping around are neither the champions nor the laggards.

If quartiles are smaller than five users, report counts only.
```

### P11 — The falling-prompt test

```
Using the same two matched exports - state both dates and windows again.

1. Report the change in median prompts per user, and in median active days.
2. Report the change in median prompts per active day.
3. Report the change in median surfaces touched.
4. Split the matched population by whether prompt count rose or fell, and for each group
   report what happened to active days and to surfaces touched over the same period.

The question I am actually asking: is there a group whose prompt volume FELL while their
frequency and breadth HELD OR ROSE?

If there is, size it and describe it - that group is maturing rather than declining, and
any success metric built on prompt growth will misclassify them as a failure.

If there is no such group, say so plainly. Do not manufacture the finding because I have
clearly signalled that I want it.
```

**How it fails** — the model finding the pattern because you asked for it. The last line exists to make that harder; verify with P22.

### P12 — The grounding split

```
Using the work-mode and web-mode chat prompt columns, analyse where this population
actually works.

1. Median web share of total chat prompts across all active users.
2. Full distribution: what share of users are work-only, web-only, and genuinely mixed.
   Define web-only as a web share above 90 percent and state the threshold you used.
3. For each of those three groups: median total prompts, median active days, median
   prompts per active day, median surfaces touched.
4. Which of the three is strongest on those measures?
5. Size the web-only group as a count and a percentage.

Then interpret under this framing, and tell me whether the framing fits: heavy work-mode
use indicates internal content is findable; heavy web-only use indicates people are going
outside because the answer is not findable inside - a search and permissions problem
rather than a policy problem.

Name at least two alternative explanations for a high web-only share that have nothing to
do with the data estate. For example role type, or simply never having been shown work
mode.
```

**How it fails** — jumping straight to "you have a shadow AI problem". That may be true; this data cannot establish it alone.

### P13 — The realistic ceiling

```
I need a defensible adoption target for this tenant, derived from its own data rather
than from a benchmark.

1. Restricting to users with AT LEAST ONE active day - state that restriction, and state
   how many users it excludes and why including them would drag every percentile toward
   zero - report the distribution of prompts per active day: 25th percentile, median,
   75th, 90th, 95th, maximum.
2. Report what share of all in-scope users ever exceed 10 prompts per active day, and
   what share exceed 20.
3. State where a target of 20 prompts per user per day would sit as a percentile of this
   tenant's currently engaged population.

Then propose three targets for the next two quarters, each expressed as a MOVEMENT in
this tenant's own distribution rather than as an absolute number - for example "raise
median prompts per active day from X to Y", or "increase the share of users above the
frequency threshold from X percent to Y percent".

For each target state what would have to be true for it to be achievable, and state the
risk that it measures effort rather than outcome.
```

**Good output** — three movement-based targets, and a percentile position for whatever round number the customer is attached to. That percentile is the slide that ends the argument.
**How it fails** — absolute targets. Re-run and insist on movements in their own distribution.

---

## Group D · The other four reports

### P14 — The agent gap: access, not authorship

```
Attached: the Copilot usage report user-detail export, and the Copilot agents usage
report user-detail export.

Before analysing, state at the top of your answer:
 - the window length of each file, and that they differ. The agents report supports only
   7 or 30 days; the usage report is 7, 28, 90 or 180.
 - that SharePoint agents used in Teams are excluded from the agents report entirely,
   and Cowork usage is excluded too, so agent activity here is an undercount.

Then, matching users across the two files where the identity columns allow:
1. What share of the EMBEDDED segment has any agent activity at all?
2. What share of the whole in-scope population?
3. Among users with agent activity, the median number of distinct agents used and the
   median agent responses received.
4. Break agent usage down by creator type - Your Users, Your org, Microsoft,
   Third-party - and report how many distinct agents exist in each.
5. From the agent details table if you have it: how many agents have exactly one active
   user? Those are personal builds, not organisational capability.
6. Report the count of UNLICENSED users with agent activity, and say what that implies.

Then answer one question directly: is the constraint in this tenant that there are no
agents to use, or that the people most capable of using them have not been given access
to the ones that already exist?

Do not compare the two files' percentages as if they covered the same period. State the
window mismatch every single time you put two numbers side by side.
```

### P15 — The unlicensed population already using it

```
Attached: the Microsoft Copilot CHAT usage report export. This report covers ONLY users
who do not hold a Microsoft Copilot licence. Confirm that in your first line, because
everything below depends on it.

If I have also attached the licensed usage report, state the window of each file
separately and do not blend them.

Report:
1. How many unlicensed users submitted at least one prompt in the window, and their
   total prompt volume.
2. Their distribution of prompts and active days: median, 75th, 90th, maximum.
3. How many of them would clear the frequency and depth thresholds derived for the
   LICENSED population, if those thresholds were applied to them. State clearly that
   this is a comparison across two different products with different capabilities, and
   is indicative only.
4. Which entry points they use, from the per-entry-point last-activity columns - Teams,
   Outlook, the Copilot app, Edge, m365.cloud.microsoft/chat, Word, Excel, PowerPoint,
   OneNote. Rank them.
5. How many are active on Edge or the Copilot app but nowhere else. Those people are
   working outside the Microsoft 365 apps entirely.

Then state, in three sentences: what this population is evidence of, and what it is not
evidence of. Be explicit that unlicensed chat usage is a demand signal, not a
demonstration that these specific people would convert.
```

### P16 — Who the reclaimed licences should go to

```
Attached: the Copilot readiness export, and if available the Copilot usage report export.

Note first that the readiness data covers a 28-day window and reflects Microsoft 365 app
engagement over the past 30 days, while the usage export covers whatever window I chose.
State both.

From the readiness file:
1. Count users with a Copilot licence assigned, and users without.
2. Among unlicensed users, count those flagged "Suggested candidate for Copilot".
   Explain that this flag is the top 25 percent of unlicensed users by Microsoft 365 app
   usage intensity, re-evaluated weekly, unranked within that group.
3. Count users NOT on an eligible update channel. These people cannot get the full
   experience regardless of licensing, and it is a configuration fix rather than an
   adoption one.
4. Cross-tabulate: of the users who ARE licensed, how many are not on an eligible update
   channel, and how many show no Teams, Outlook or Office document activity at all?

If the usage export is also attached, join on the identity column where possible and
report: how many licensed users who are in the never-active or drifting groups are also
flagged as low app engagement in the readiness data. Those are licences that were
probably assigned to the wrong people, not licences that failed.

Then produce a reassignment recommendation as counts only. Do not name individuals.
State explicitly that Microsoft says the suggested-candidate flag is not intended for
evaluating employee performance, and that any list must be confirmed against current
licence assignment before anyone acts on it.
```

### P17 — Cowork: automation running without a human

```
Attached: the Cowork usage report export. Note two things in your first two lines: this
file's User ID column contains EMAIL ADDRESSES, not concealment hashes, so it is not
anonymised the way the other reports are; and user-level Cowork detail only goes back to
1 April 2026, so the window is bounded by that date whatever range I selected.

Report:
1. Active Cowork users, total tasks, and average tasks per active user.
2. The split of total tasks into user-initiated and scheduled, as counts and as a
   percentage.
3. Per user: the distribution of total tasks, of active days, and of tasks per active
   day - median, 75th, 90th, maximum.
4. How many users have scheduled tasks but few or no user-initiated tasks. These people
   have set something running and stepped away from it.
5. How many users ran exactly one task and never returned.
6. Days since last activity, distributed.

Then answer this: is Cowork usage in this tenant concentrated in a handful of people, or
spread? Give the share of all tasks accounted for by the top 10 percent of users.

Finally, state plainly what a rising scheduled-task share against a flat or falling
user-initiated share would mean, and whether that pattern is present here. Do not claim
it is present if it is not - a single window cannot show a trend, and if I have given you
only one export, say that this needs a second pull to establish.
```

---

## Group E · Book level

### P18 — Triage the book from Partner Center

```
Attached is an export from Partner Center, AI Business Solutions & Security Insights,
Copilot Opportunities tab. One row per associated customer tenant.

Before analysing, state these limits in your own words at the top:
 - Every measure here is TENANT-LEVEL. MAU is a rolling 28-day telemetry measure. It is
   not the same thing as the Active Days column in a tenant usage export and the two
   must never appear in one sentence as if comparable.
 - Only tenants associated by CPOR claim or CSP association appear. EA-only associations
   show a renewal date and nothing else.
 - Coverage thresholds: enterprise customers above 150 Microsoft 365 licences, SME&C
   above 25. Smaller customers are absent from this file entirely, not at zero.

Then build me a prioritised call list. Rank customers by a combination of:
 - Adoption Status of "Failure to Start" or "Failure to Adopt" - these are the audit
   candidates
 - Copilot Utilization (MAU/PAU) - low utilisation against a real paid seat count
 - Copilot PAU - size, so a low percentage means something
 - Months until EA Renewal or the earliest CSP renewal - urgency
 - Free to Paid Whitespace and Cumulative License Request - demand the customer's own
   people have already expressed
 - Any Admin Settings Recommendation flagged unhealthy - because a configuration gap
   looks exactly like an adoption failure and is far cheaper to fix

Output one table, one row per customer, showing each of those inputs, a rank, and a
single recommended first move drawn only from these four:
  run the usage audit  /  fix the admin configuration first  /  free-to-paid conversion
  /  agent access and discoverability

For each of the top ten, add one sentence saying what you would expect the tenant-level
usage export to show if your read is right - a prediction I can check in an afternoon.

Do not produce revenue estimates. Do not use list prices. If a customer has an unhealthy
admin setting flagged, say which one, because "your users cannot see the app" is not an
adoption problem and selling enablement into it would be a mistake.
```

**Good output** — a ranked list where the top entries have a checkable prediction attached.
**How it fails** — ranking purely on seat count. Size is not urgency; utilisation against a renewal date is.

---

## Group F · Turn it into money and motion

### P19 — Idle licence exposure, in units

```
Quantify unrealised licence exposure in this tenant. Report in UNITS, not currency,
unless I give you a per-user rate. If I have not given you one: do not estimate it, do
not use a public list price, do not guess.

1. Users with zero prompts and zero active days across the whole window. Count and share.
2. Users whose last activity date is more than 90 days before the report refresh date.
   Count and share.
3. DRIFTING users who have touched three or more surfaces - tried it and stopped,
   recoverable.
4. DRIFTING users who have touched zero surfaces - never started, possibly a licensing
   error.

Present these as four separate numbers. DO NOT MERGE THEM and do not produce a total.
They overlap, and a single "wasted licence" number on a slide is indefensible.

For each of the four, state the correct action in one sentence: reclaim, reassign,
re-engage with a role-based use case, or investigate as a data artefact.

State explicitly that any reclamation candidate must be confirmed against CURRENT licence
assignment under Billing > Licenses first, because this export includes everyone who held
a licence at any point in the window, not everyone who holds one now.
```

**How it fails** — any dollar figure you did not supply. That number is invented; delete it.

### P20 — The measurement section of the statement of work

```
Draft the measurement section of a statement of work for an adoption engagement with this
customer, using only measures producible from the reports we have actually pulled.

Requirements:
 - Every criterion expressed as a movement in THIS tenant's baseline, with the current
   baseline value stated inline.
 - At least one criterion that would still show success if total prompt volume FELL.
   Explain in one sentence why it is there. This is deliberate and must survive review.
 - The measurement window, the report refresh cadence, and a named data source for every
   criterion. Where two criteria come from reports with different windows, state both.
 - An explicit exclusions clause listing what this data cannot evidence: business
   outcome, time saved, quality of output, and causation.
 - A re-baselining trigger: what change in licensing, headcount, product capability or
   report definition would invalidate the baseline and require a reset.

Write it as contract prose, not slide bullets. No pricing, no effort estimates, no
commercial terms of any kind.
```

### P21 — The four engagement briefs

```
Using the segment sizes and profiles produced earlier, write four short engagement briefs
- one per segment - for the partner account team.

Each brief contains this and nothing else:
 - Segment name, size as a count and a percentage, and share of total activity.
 - One sentence on what is actually true about these people, written for a human rather
   than a dashboard.
 - The single most likely reason they are in this segment, and one alternative reason
   that would change the approach.
 - The specific intervention: what session, how long, with whom, and what the participant
   physically does during it.
 - The observable signal that would show it worked, in this tenant's own measures.
 - One thing that would be a mistake to do with this segment, and why.

Constraints: no pricing. No claims about business outcome or time saved. Do not recommend
building a custom agent for any segment unless the agent data shows existing agents are
already widely used and insufficient - if it does not show that, say so and recommend
access and discoverability instead.

Under 150 words per brief.
```

**How it fails** — four briefs that all recommend training. That means the segmentation was not carried through; feed it P03's table again.

---

## Group G · Guard against the model

### P22 — The verification pass

*Run this before any number leaves your laptop. It is the most important prompt here and the one nobody runs.*

```
Stop analysing. I am going to put these numbers in front of a customer, so audit them now.

For every figure you have stated in this conversation, produce one row containing:
 - the figure
 - the exact calculation that produced it, written so I can reproduce it in Excel
 - the number of rows that went into it
 - the number of rows excluded, and why
 - which file it came from, and that file's window length
 - whether it came from the file, from arithmetic on the file, or from your own general
   knowledge

Then, separately and explicitly, list:
 - every figure you cannot tie to a specific calculation on a specific file
 - every place you filled a gap with an assumption, and what the assumption was
 - every place you rounded, and by how much
 - every comparison you made between two different time windows, and whether you flagged
   it at the time
 - every segment under five users for which you nonetheless reported a percentage or a
   median

Do not restate your conclusions. Do not defend them. If a number cannot be traced, write
"cannot be traced" and leave it. I would rather delete five findings than present one I
cannot source.
```

**Good output** — a traceability table plus a short list of untraceable figures. There is almost always at least one. Delete it.
**How it fails** — "all figures are derived from the attached file". That is not an audit. Ask again, one figure at a time.

### P23 — Devil's advocate

```
Take the position of a sceptical analyst inside the customer's organisation who thinks
this whole exercise is over-reading a usage log.

For each main finding:
1. State the strongest alternative explanation that involves no adoption problem at all -
   role mix, licence assignment timing, seasonality, a product change during the window,
   a reporting definition rather than a behaviour, or the fact that the window and the
   report definitions were chosen by us.
2. State what additional data would distinguish your explanation from theirs, and whether
   that data is obtainable.
3. Rate the finding: robust, plausible, or fragile.

Then list every finding you would drop entirely before presenting to a sceptical audience,
and why.

Finally: name the one confound that applies to this whole analysis regardless of which
finding we are discussing, and write the single sentence I should say out loud in the
meeting to acknowledge it before anyone else raises it.
```

**How it fails** — rating everything robust. That is flattery, not analysis. Tell it to try harder and name a fragile one.

---

# Part 3 · The running order

The order matters more than the prompts do.

| Stage | Prompts | Why here |
| --- | --- | --- |
| **Before the tenant** | P18 | Partner Center decides which customer is worth the afternoon |
| **Always first** | P01, P02 | Identify the report, then put the thresholds on the record as the tenant's own |
| **The core** | P03 | Everything downstream refers back to this table |
| **The artefacts** | P04, P05 | Build them early — they surface errors in P03 that a table hides |
| **The tests** | P07, P08, P12, P13 from one export; P09 with an attendee list; P10, P11 with two exports | Run only the ones you have the data for. A test you cannot run is not a finding you can soften |
| **The other reports** | P14, P15, P16, P17 | Each adds a source, and each adds a window mismatch to declare |
| **Before any number is spoken** | **P22** | Non-negotiable |
| **The brief** | P06 | Only cards for findings that survived P22 |
| **Commercial** | P19, P20, P21 | After the numbers are audited, never before |
| **Before the meeting** | **P23** | Not after it |

The two guard prompts are the ones people skip, and they decide whether this exercise makes you look rigorous or makes you look like someone who pasted a spreadsheet into a chatbot.

---

# Part 4 · Sources

- [Microsoft Copilot usage report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-365-copilot-usage) — the spine, and the column definitions
- [Microsoft Copilot Chat usage report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-copilot-usage) — unlicensed users only; the report that gets pulled by mistake
- [Microsoft Copilot Readiness report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-365-copilot-readiness) — eligibility, update channel, suggested candidates
- [Microsoft Copilot Agents usage report (preview)](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/microsoft-365-copilot-agents-new) — 7/30-day windows, creator types, the SharePoint-in-Teams exclusion
- [Cowork usage report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/cowork-usage-report) — tasks, scheduled versus user-initiated, retention
- [Graph: getMicrosoft365CopilotUsageUserDetail](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/admin-settings/reports/copilotreportroot-getmicrosoft365copilotusageuserdetail) — and the v1/v2 trap
- [Copilot growth opportunities data in AI Business Solutions & Security Insights](https://learn.microsoft.com/en-us/partner-center/insights/growth-opportunities-data/copilot) — the Partner Center data dictionary
- [Show user, group, or site details in usage reports](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/activity-reports) — the concealment setting and the roles required to view any of this
