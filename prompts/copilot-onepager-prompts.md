# The two one-pagers — the prompt pack

**How a partner recreates the tenant X-ray and the seven-reversals brief against their own customer's data — in a partner-facing version and a customer-facing version.**

Companion to `prompts/copilot-adoption-prompt-library.md`, which this pack depends on and does not repeat. That library's **P01–P03** produce the numbers; **P22** audits them; **P23** attacks them. This pack replaces its **P05** and **P06** with a hardened four-prompt set. Source of record for Group E of Section 10 of `copilot-adoption-audit.html`.

**Segment name mapping.** The library computes segments as `DRIFTING · PROJECT-DRIVEN · LOYAL BUT SHALLOW · EMBEDDED`. The published one-pagers name the same four groups `Drifting · Bursty · Habitual but shallow · Champions`. They are the same quadrants in the same positions. Everything below uses the published names; if you ran the library prompts first, say so once and let the model carry the alias.

---

## Part 0 · What you are actually asking a model to do, and why the obvious route fails

Both artefacts look like graphic design. They are not. They are **a table of numbers with a layout wrapped around it**, and the two halves need two different capabilities:

| Stage | What it needs | What happens if you skip it |
| --- | --- | --- |
| **1 · Compute** | A tool that reads the CSV row by row and shows its arithmetic | The model estimates from a sample of rows and the medians come out wrong by tens of percent |
| **2 · Render** | A tool that emits code and returns it to you | You get a description of a chart instead of a chart |

**Do not use an image generator for either of these.** Copilot's image generation — Designer, "create an image of…", anything DALL·E-shaped — will produce something that reads as an infographic from six feet away and contains invented numbers, unreadable axis labels, and dots placed for composition rather than for data. It cannot read your CSV. This is the single most common way this goes wrong, and the output is unusable in front of a customer because every figure on it is fiction.

**The artefact is HTML. The image is a screenshot of it.** Every prompt below emits one self-contained HTML file that you open in a browser and either screenshot or print to PDF. That is how both originals were made, and it is what survives an admin in the room, because every number traces back to a row in the export.

### Which tool, in order of preference

| Rank | Tool | Stage 1 · compute | Stage 2 · render | Use it when |
| --- | --- | --- | --- | --- |
| **1** | **Analyst agent** — Microsoft 365 Copilot › Copilot Chat › **Agents** › **Analyst** | Yes. It writes and runs Python over the attached file and will show you the code | Partly. It returns the HTML as text in the chat and you save it yourself | **The default for partners.** It runs inside the customer's tenant, so the file never leaves their boundary, and it shows its working — which is what makes the numbers defensible |
| **2** | A model that returns files, with the CSV attached — Claude, or Cowork | Yes | Yes. Hands you the `.html` file directly | You have written permission to take the file out of the tenant, or you are running it on your own tenant first |
| **2=** | **Copilot Chat with the model switched** — Think Deeper, or a Claude model where your tenant has them enabled | Weakly — pair it with rank 1 for the numbers | Yes, as a code block you save yourself | **This is how the two graphics on the audit page were built.** The default fast model writes noticeably worse HTML; switching the model is the single highest-leverage change to output quality on the render stage |
| **3** | **Copilot in Excel**, on the customer's open export | Yes, in cells — the most defensible form there is, because the customer can re-run it | No | The numbers need to live in cells the customer owns. Pair it with rank 1 or 2 for the artefact |
| **4** | **Copilot Chat in work mode**, file attached, no agent | Weakly. It reasons over the file rather than computing across it | Partly | Last resort. Verify every median by hand before anyone sees it |
| — | **Copilot Studio · Designer · image generation** | No | No | Never, for this |

> **Cowork.** If you are running this in Cowork you can do both stages in one session: attach the export, run the compute prompt, then the build prompt, and take the file it hands back. Keep the two-stage split anyway — a model asked to compute and design in one turn does neither carefully.

> **Which Copilot licence.** The Analyst agent needs a Microsoft 365 Copilot licence, and it consumes agent capacity. Check both before you promise a customer a live session; "we'll do it on the call" is a bad place to discover the agent is not switched on. Confirm the current entitlement and capacity model in your own tenant before quoting it to anyone — Microsoft moves this.

### Put your own name on it

Every prompt here uses `<CUSTOMER_NAME>` as a placeholder and never a real company. Replace it with the customer the analysis is about. The hex values in D01 and D03 are **a starting palette, not a requirement** — swap in your own brand colours and put your own logo and footer on the page. Keep the colour *roles* stable (one dark for structure, one accent, one muted grey for the absence band, one warm for the alert segment) and the chart stays readable whatever palette you use. The page a customer sees should look like it came from you.

### The rule that keeps this defensible

**Compute first, in a separate turn, and make the model print the numbers before it draws anything.** The failure you are guarding against is not a model that says "I don't know". It is a model that quietly fills a gap with something plausible, on a page you then put on a screen in front of a customer's IT director.

---

## Part 1 · The compute pass

Run **P01, P02 and P03** from the main library first, and **P22** after them. Then run this. It freezes the audited numbers into the one object the build prompts consume, so the build prompts contain no arithmetic at all — which is what lets the partner page and the customer page be provably the same analysis in two framings.

### D00 — Freeze the numbers

*Analyst agent, or whichever tool ran P01–P03. One turn.*

```
Do not design anything yet. Produce one JSON object called FINDINGS and nothing else,
using only values you have already computed from the attached file. This object is the
only source of numbers for the page I am about to ask you to build.

{
  "customer_name":        "<the name I gave you>",
  "source_report":        "Microsoft 365 admin center Copilot usage report, user detail export",
  "refresh_date":         "<report refresh date from the file>",
  "window_days":          <report period length from the file>,
  "licensed_users":       <in-scope row count, excluding header and excluding blank-metric rows>,
  "total_prompts":        <sum of total prompts across in-scope rows>,
  "threshold_frequency":  <the active-days line agreed in P02>,
  "threshold_depth":      <the prompts line agreed in P02>,
  "threshold_basis":      "<Option A, B or C, and one clause saying why>",
  "zero_prompt_users":    <count of in-scope users with zero prompts - these plot at 1 on a log axis>,
  "segments": [
    { "key":"A", "name":"Drifting",
      "users":<n>, "share_users":<pct>, "share_activity":<pct>,
      "median_prompts":<n>, "median_active_days":<n>, "median_prompts_per_active_day":<n>,
      "median_surfaces":<n>, "suppressed":<true if users < 5 else false> },
    { "key":"B", "name":"Bursty",               ... same fields ... },
    { "key":"C", "name":"Habitual but shallow", ... same fields ... },
    { "key":"D", "name":"Champions",            ... same fields ... }
  ],
  "reversals": [
    { "id":1, "held":<true|false>,
      "assumption":"<the belief, one sentence, stated fairly>",
      "evidence":"<what this tenant showed, with the specific figures>",
      "figures":[<every number quoted in evidence, as raw values>],
      "windows":["<the window of each report the figures came from>"] }
    ... one entry per reversal tested, whether or not it held ...
  ],
  "not_computed": [ "<name every field above you could not fill from the file>" ]
}

RULES
 - Every number must be computed from the attached file. If you cannot compute one, put
   null in the field and name it in not_computed. Do not estimate, and do not carry a
   number over from any other organisation or from your training data.
 - share_users and share_activity must each sum to 100 across the four segments. If they
   do not, find the missing rows rather than rounding it away.
 - For any segment with fewer than five users, set suppressed to true and set every field
   except users to null. Small groups are identifiable even when names are hashed.
 - Set held to false for any reversal that did not hold here. Do not soften a failed test
   into a qualified one. A false is a useful answer and I want to see it.
 - Output the JSON only. No commentary before or after it.
```

**Good output** — a JSON block with `not_computed` either empty or honestly populated, and at least one reversal marked `"held": false`.
**How it fails** — every reversal true and `not_computed` empty on the first attempt. That is a model completing a template. Ask which figures it computed versus inferred, and re-run.

---

## Part 2 · Artefact 1 — the tenant X-ray

### D01 — Tenant X-ray, **PARTNER** version

*Audience: your own account team. Never leaves your side of the table.*

```
Using only the FINDINGS object you just produced, generate ONE self-contained HTML file -
all CSS inline, no external requests, no CDN links, no web fonts - rendering as a single
landscape page 1600px wide or more, suitable for screenshotting or printing. Return the
complete file. If you cannot return a file, return the entire HTML in one code block.

AUDIENCE AND TONE
Partner-facing. The reader is a solution provider deciding what to sell into this account.
It is commercial: it names the motion, the audience and the deliverable for each group. It
is never shown to the customer.

LAYOUT
 - Top left: a small teal eyebrow, uppercase, wide letter-spacing:
   "<CUSTOMER_NAME> - THE TENANT X-RAY".
 - Two-line headline, heavy sans, tight leading, line one navy, line two teal:
     "Two columns you already have."
     "Four conversations you don't."
 - Top right: two large figures - licensed_users and window_days - each with a small grey
   caption beneath: "licensed users plotted" and "day report period".
 - A standfirst under the headline, 60 words maximum: every Copilot usage export contains
   the same two numbers, how OFTEN someone shows up and how DEEP they go; plot them
   against each other and an install base sorts itself into four groups, each a different
   problem, a different offer and a different invoice. Close with one sentence naming the
   customer and stating that every dot is one real licensed user.

 - Main body, two columns, left about 55%, right about 45%.

   LEFT - a bordered white panel containing the scatter plot as INLINE SVG:
     - Panel title "<CUSTOMER_NAME> - every licensed user, frequency against depth", with
       source and refresh date in small grey type right-aligned on the same line.
     - One dot per user, radius about 2px, opacity about 0.55 so density reads.
     - X axis linear, 0 to window_days, titled
       "ACTIVE DAYS OUT OF <window_days> -> FREQUENCY".
     - Y axis logarithmic base 10, floored at 1, titled "PROMPTS SUBMITTED -> DEPTH".
       Users with zero prompts plot at 1.
     - A dashed vertical line at threshold_frequency and a dashed horizontal line at
       threshold_depth, each labelled in small type WITH ITS VALUE AND ITS MEANING - for
       example "60 days - every third working day", "375 prompts - power-user line". An
       unlabelled threshold line is the most common defect in this chart.
     - Tint each quadrant faintly in its segment colour; colour each dot by its segment.
     - Inside each quadrant, in its own corner: the letter, the segment name in small
       caps, and beneath it "<users> users - <share_users>%".

   RIGHT - a small uppercase label "WHAT EACH QUADRANT BUYS", then four cards, A to D,
   each with a 4px left border in its segment colour:
     - A lettered square badge, the segment name in bold, and at the right the
       share_activity figure large and coloured with "of all activity" beneath in small
       grey type.
     - Two sentences of profile built ONLY from that segment's medians, figures in bold.
     - A divider, then a line labelled "THE PLAY" in the segment colour: the commercial
       intervention - the motion, who it is sold to, and what the deliverable is. Be
       specific and be commercial. This line is the whole reason the page exists.

 - Footer in small type, full width, above a 4px multi-colour gradient rule:
   "How to read it" - what each axis is, what each line means, that the depth axis is
   logarithmic, and that every point is one licensed user from the named export at its
   refresh date. Then in bold "Relationships shown are correlational." Then "How to use
   it" - run the same two columns on any customer tenant, plot it, and the four
   conversations name themselves.

COLOURS - THESE ARE A STARTING PALETTE, NOT A REQUIREMENT
  Replace all of them with my own brand colours if I have given you any, and put my
  logo and footer on the page rather than anyone else's. Keep the ROLES the same: one
  dark colour for headline and structure, one accent, one muted grey for the absence
  band, one warm colour for the alert segment.
  navy #003057 · teal #005F6B · teal light #007B8A · amber #D97706 · grey #9CA3AF
  ice #E4F0F3 · page #F7F8FA · rule #DDE1E7
  Segment colours, used identically in the dots, the quadrant tints, the quadrant labels
  and the card borders:
    A Drifting             #9CA3AF   (grey on purpose - it is the absence band, and a loud
                                      colour on 40% of the points makes the chart unreadable)
    B Bursty               #4DA8B8
    C Habitual but shallow #D97706
    D Champions            #005F6B

CONSTRAINTS - these override the design
 - Every number on the page comes from FINDINGS. Invent nothing. Round nothing to a
   tidier figure than it is. Add no benchmark and no industry comparison.
 - No currency figures anywhere on the page.
 - Any segment with suppressed true shows its user count and the words "n < 5, not
   reported" in place of every other figure, on both the quadrant label and the card.
 - Any null field renders as a visible "NOT COMPUTED" placeholder in amber. Do not fill
   the gap and do not silently drop the element.
 - No individual is identifiable anywhere on the page: no names, no principal names, no
   dot annotated with a person.
```

**Good output** — a page you could put on a screen without editing it, every figure reconcilable against FINDINGS, and four THE PLAY lines that each name a motion rather than a sentiment.
**How it fails** — unlabelled threshold lines; a linear y axis, which collapses the whole population into a stripe along the bottom; or points stacked at x = 1, 2, 3, which means it plotted row index instead of active days.

### D02 — Tenant X-ray, **CUSTOMER** version

*Audience: the customer's own IT and change leadership. This is the one you leave behind.*

```
Now produce a SECOND version of that page, from the same FINDINGS object and with the same
chart, retuned for a different audience. Return it as a separate complete self-contained
HTML file. Change only what is listed below - keep the layout, the colours, the chart
construction, the axes and the footer mechanics identical.

AUDIENCE AND TONE
This version is shown TO THE CUSTOMER, by their own leadership as much as by us. It
describes what is happening in their organisation and what their people do next. It sells
nothing. It never characterises their staff as a failure, and it never implies that any
individual is being watched.

CHANGES

1. Eyebrow: "<CUSTOMER_NAME> - HOW COPILOT IS ACTUALLY BEING USED".

2. Headline, navy then teal:
     "Two numbers you already have."
     "Four groups they describe."

3. Rewrite the standfirst in the customer's frame: this is your own usage export, no new
   tooling and no monitoring was introduced to produce it, and it sorts your licensed
   users into four groups that each need something different from you. Add one sentence
   stating that the analysis is distributional and that no individual is named or assessed
   anywhere in it.

4. Rename the segments to describe the SITUATION, never the person. Use exactly:
     A  "Tried it, hasn't stuck"      (was Drifting)
     B  "Uses it in bursts"           (was Bursty)
     C  "One habit, one use case"     (was Habitual but shallow)
     D  "Fully embedded"              (was Champions)
   Keep the letters, the colours and the quadrant positions unchanged, so that this page
   and the partner version are visibly the same analysis.

5. The right-hand label becomes "WHAT EACH GROUP NEEDS FROM YOU", and each card's action
   line is labelled "WHAT HELPS" rather than "THE PLAY". Rewrite each action as something
   the CUSTOMER's own team does: who owns it internally, what changes for those users, and
   what they would expect to see move. Remove every reference to an engagement, a workshop
   that is sold, a retainer, a statement of work, a proposal, a licence decision, or
   anything with a price attached.

6. Replace the "How to use it" footer sentence with "How this was produced": the report
   name, the window, the refresh date, and the fact that it uses two columns of an export
   the customer already owns.

7. Add one line, in bold, immediately above the footer rule:
   "This is a measure of a tool's fit with the work, not a measure of the people using it.
   No individual is identified in this analysis and it is not suitable for performance
   management."
   That line is not optional, must not be softened, and must not be moved into small type.

Every CONSTRAINT from the previous prompt still applies, unchanged.
```

**Good output** — two pages a customer could see side by side and recognise as the same chart, where only the framing moved.
**How it fails** — an offer that survived the rewrite. Search the customer version for *workshop*, *engagement*, *retainer*, *SOW*, *licence* and *we recommend*. Any hit means the model retitled the partner page instead of rewriting it.

---

## Part 3 · Artefact 2 — the reversals brief

Run after the library's Group C, so the reversals in FINDINGS have actually been tested, and after P22, so the figures on them have been audited.

### D03 — Reversals brief, **PARTNER** version

```
Using only the FINDINGS object, and only the reversals entries where held is true,
generate ONE self-contained HTML file - inline CSS, no external requests, no web fonts -
rendering as a single landscape page 1600px wide or more. Return the complete file, or the
entire HTML in one code block if you cannot return a file.

AUDIENCE
Partner-facing. The reader sells into this account and is deciding what to propose.

STRUCTURE
 - Teal eyebrow: "<CUSTOMER_NAME> - WHAT THE DATA CONTRADICTED".
 - Two-line headline, line one navy, line two amber. Substitute the REAL count of
   reversals that held - if five held, the headline says five, not seven:
     "<N> things the channel believes."
     "<N> the data doesn't."
 - Top right, under a small grey uppercase label "MEASURED, NOT MODELLED": three
   right-aligned figures with small captions - licensed_users "licensed users",
   window_days "day report period", total_prompts "prompts analysed".
 - A grid of numbered cards, four across, one per reversal that held. Each card is white
   with a hairline border, a coloured number badge, a bold title of at most eight words,
   then exactly four parts under these exact small-caps headings:
     THE ASSUMPTION             the belief, italic, one sentence, stated fairly enough
                                that someone who holds it would recognise it
     WHAT OUR TENANT SHOWED     the numbers, every figure in bold, taken verbatim from the
                                evidence and figures fields
     WHY THAT CHANGES THINGS    the mechanism, two or three sentences, on a tinted band
     DO THIS WITH THE CUSTOMER  the action - the motion, the audience and the deliverable,
                                with the commercial noun in colour
 - The final grid cell is a dark navy-to-teal panel titled "THE THROUGH-LINE": a two-line
   thesis in large type, then a numbered four-step method the reader could run tomorrow,
   each step opening with a bold imperative verb.
 - At the bottom of that panel, in amber, one line beginning "One guardrail." naming the
   single thing most likely to be got wrong.
 - Footer, full width: every data source used, EACH WITH ITS OWN WINDOW LENGTH STATED
   SEPARATELY, the refresh dates, any cohort sizes, and in bold "All relationships shown
   are correlational, not causal."

RULES THAT OVERRIDE THE DESIGN
 - One card per reversal that HELD. If four held, produce four cards and change the
   headline to four. Do not manufacture a reversal to fill the grid. Do not restate a
   failed test as a qualified one.
 - Where two figures come from reports with different windows, name both windows on the
   card itself. Never place them in one sentence as though they were comparable.
 - No currency. No time-saved claim. No business-outcome claim. No causal verb: write "is
   associated with", never "drives", "causes" or "leads to".
 - Apply n < 5 suppression. Any null renders as a visible NOT COMPUTED placeholder.
 - Every bold figure must appear in the figures array of its reversal entry. I will check
   them one by one.

COLOURS - THESE ARE A STARTING PALETTE, NOT A REQUIREMENT
  Replace all of them with my own brand colours if I have given you any, and put my
  logo and footer on the page rather than anyone else's. Keep the ROLES the same: one
  dark colour for headline and structure, one accent, one muted grey for the absence
  band, one warm colour for the alert segment.
  navy #003057 · teal #005F6B · amber #D97706 · grey #9CA3AF · page #F7F8FA
  Give each card a different accent from that palette, cycling in order.
```

**Good output** — as many cards as tests that held, and every card ending in an action with an audience attached.
**How it fails** — seven cards when four tests passed. Ask it to name the file evidence for each card, and delete the ones it cannot produce.

### D04 — Reversals brief, **CUSTOMER** version

```
Produce a SECOND version of that page for the customer's own leadership. Separate complete
self-contained HTML file. Keep the grid, the colours, the four-part card structure and the
footer mechanics. Change the following.

AUDIENCE AND TONE
Shown to the customer. The subject is no longer what the channel believes - it is what this
organisation assumed about its own rollout. Nothing here is sold, and nothing here
characterises staff.

CHANGES

1. Eyebrow: "<CUSTOMER_NAME> - WHAT WE EXPECTED, AND WHAT THE DATA SHOWS".

2. Headline, navy then amber:
     "<N> things we assumed."
     "<N> the data corrects."

3. Card headings become:
     WHAT WE ASSUMED      the belief, italic, one sentence - unchanged in substance
     WHAT THE DATA SHOWS  the same figures, unchanged. Do not re-round them
     WHY IT MATTERS       the mechanism, in the customer's own operational terms
     WHAT WE DO NEXT      an action the customer's team owns, with an internal owner role
                          named and the observable change stated. Never an engagement, a
                          purchase, a licence decision or a price

4. Rewrite every finding so that no group of employees is described as a failure. The
   subject of each sentence is the tool, the rollout, the task fit or the data estate -
   never the user's effort or ability. "The tool has not yet found a fit with this role's
   weekly work" is right. "These users did not engage" is wrong.

5. Retitle the dark panel "WHAT THIS MEANS FOR THE NEXT SIX MONTHS", carrying the same
   two-line thesis rewritten in the first person plural, and a numbered four-step plan with
   an internal owner role against each step.

6. In the guardrail position, in amber:
   "This analysis is distributional. It names no individual, it is not derived from message
   content, and it is not suitable for performance management."

7. The footer gains one sentence naming the report and the window, and stating that no data
   left the tenant - IF that is true of how you ran it. If it is not true, omit the
   sentence rather than writing something inaccurate.

All RULES THAT OVERRIDE THE DESIGN from the previous prompt still apply, unchanged.
```

**Good output** — the same figures, the same number of cards, and not one sentence whose subject is an employee.
**How it fails** — a "WHAT WE DO NEXT" line that is a purchase. That is the partner version leaking through the rewrite.

---

## Part 4 · Turning the HTML into an image

The artefact is a file; the image is a capture of it. Both routes take under a minute.

| Route | Steps | Best for |
| --- | --- | --- |
| **Print to PDF** | Open the `.html` in Edge or Chrome › **Ctrl+P** › Destination **Save as PDF** › Layout **Landscape** › Margins **None** › **Background graphics ON** › Save | Decks, email, anything printed. Background graphics off is why the quadrant tints and the dark panel come out white — check it every time |
| **Full-page screenshot** | Edge: **Ctrl+Shift+S**, or right-click › **Screenshot** › **Capture full page**. Chrome: **F12** › **Ctrl+Shift+P** › type `screenshot` › **Capture full size screenshot** | A PNG for Teams, a QBR slide, or a page like this one |

Two things to fix before you capture, both of which go wrong perhaps one time in three:

- **Widen the window first.** These pages are designed at 1600px and up. Capture at laptop width and the columns stack and the chart squashes. Zoom to 80% or 67% before capturing if you need to.
- **Read the four corners.** Every failure of these prompts shows up at an edge: an unlabelled threshold line, a `NOT COMPUTED` you meant to fill, a quadrant label sitting on top of the dot cloud, a footer that lost its window statement.

### If your tool returns text rather than files

Copilot Chat and the Analyst agent will give you the HTML in the chat. Add this to the end of whichever build prompt you are running:

```
Return the complete HTML in a single code block, with no commentary before or after it and
no explanation of what you have built. I am copying it directly into a file, so anything
outside the code block will break it.
```

Then: copy the block › Notepad › **Save as** › set **Save as type** to **All Files** › filename `tenant-xray.html` › **Encoding: UTF-8** › Save › double-click it. If it opens as text rather than rendering, the extension is still `.txt`. That is the only thing that ever goes wrong here.

---

## Part 5 · The running order

1. **P01** — identify the report and audit the file. Always first.
2. **P02** — derive this tenant's own thresholds. Option C under about sixty rows.
3. **P03** — build and size the four segments.
4. **Group C** — test the reversals. Only if you want artefact 2. Expect some to fail; that is the point.
5. **P22** — the verification pass, before any number is spoken aloud.
6. **D00** — freeze the audited numbers into FINDINGS.
7. **D01**, then **D02** — the X-ray, partner then customer.
8. **D03**, then **D04** — the reversals brief, partner then customer, if Group C ran.
9. **P23** — devil's advocate, before the meeting rather than after it.

**Produce the partner version first, every time.** It is the one that tells you whether the analysis actually holds, because it is the one that has to name a commercial action against every group. If you cannot write the THE PLAY line for a segment, you do not yet understand that segment — and the customer version would have hidden that from you behind softer language.

---

## Part 6 · The optional Cowork join

If the customer also runs Cowork, its usage report is a separate export with its own window, and it adds the one dimension the Copilot export cannot show: **whether the work is being delegated or still being typed.** Library P17 profiles the file on its own; this joins it to the segments.

| Column | What it measures |
| --- | --- |
| `Total tasks` | All Cowork tasks in the window |
| `Scheduled tasks` | Tasks running on a schedule — work set up once and then left alone |
| `User-initiated tasks` | Tasks started by hand |
| `Active days` | Days with any Cowork task |
| `Last activity date` | Most recent task |

> **This file is not anonymised.** Its `User ID` column contains email addresses, not concealment hashes. Check that before you attach it to anything, and strip the column if the join can be made another way.

### D05 — The delegation split

```
I am attaching a second file: a Cowork usage report, user detail export. It covers a
DIFFERENT window from the Copilot usage report, and its user-level detail only goes back to
1 April 2026. State both windows in every answer where figures from the two files appear
near each other, and never combine them into one sentence as though they were comparable.

Note in your first line that this file's user identifier is an email address rather than a
concealment hash, so it is not anonymised the way the Copilot export is.

Join the two files on the user identifier and report:

1. How many users appear in both files, in the Copilot file only, and in the Cowork file
   only.
2. For each of the four segments in FINDINGS: the share of that segment present in the
   Cowork file at all, and the median total tasks among those who are.
3. The scheduled share - scheduled tasks divided by total tasks - as a distribution across
   all Cowork users with at least 5 total tasks. Median and quartiles. Suppress any group
   under five users.
4. The count of users with zero scheduled tasks whose user-initiated tasks are above the
   median: people doing the work by hand every time, who have never once set it to run
   itself.
5. Whether being present in the Cowork file is associated with higher Copilot depth. State
   it as an association, never as a cause, and name the confound in the same breath.

Then give me one sentence naming what item 4 is worth as a conversation, and one sentence
naming the strongest reason item 5 might be selection rather than effect.

If the join key does not match between the files, stop and tell me which columns you tried
and what the values looked like. Do not fuzzy-match on display names.
```

Add the result to either page as a fifth card, on its own, carrying both window lengths. Do not fold it into the four segments — the windows do not match, and someone in the room will know it.
