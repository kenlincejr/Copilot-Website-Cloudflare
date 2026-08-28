# 08 · Session design — the room

**Draft, 2026-08-28.** Design work, not research. Independent of dossiers 01–07, which
supply the content this structure carries. Written to close gap **G10**.

---

## 1. The problem the room has to solve

The session's premise is that partners lose this conversation by leading with the plumbing.
A session that *teaches* the plumbing in the same order partners already fail with it will
reproduce the failure in the room. Partners will leave with a control checklist and no
change in how they open a meeting.

So the room has to invert the order the material is usually taught in:

| Usual order (fails) | Room order |
|---|---|
| 1. Here are the controls | 1. Here is a customer, and here is what they already believe |
| 2. Here is the journey the customer must go on | 2. Here is what breaks when you lead with controls |
| 3. Here is the assessment that finds the gaps | 3. Here is the sequence that survives contact |
| 4. Here is how you might charge for it | 4. Here is the recurring business underneath it |
| | 5. *Then* here are the controls, as reference |

The controls do not disappear. They move to the back, where a reference section belongs, and
the room spends its time on the two things partners cannot get from documentation: **the
sequence** and **the economics**.

---

## 2. Run of show

Assumes a **90-minute** slot. Variants for 60 and 120 at §6.

| # | Minutes | Segment | Mode | What partners leave the segment with |
|---|---:|---|---|---|
| 0 | 0–5 | **The cold open** — the deal that died | Facilitator | The failure named, in their own words, before any content |
| 1 | 5–15 | **Meet Harbor & Vane** | Facilitator + handout | A 78-seat customer they recognise from their own book |
| 2 | 15–30 | **Exercise A — Where do you start?** | Table, 8 min + 7 report | Their own instinct surfaced and challenged by the room |
| 3 | 30–45 | **The bridge** — finding → control → order | Facilitator, the spine | The one diagram the session exists to deliver |
| 4 | 45–55 | **The licensing decision** | Facilitator + decision table | An answer to "can they even buy it?" |
| 5 | 55–70 | **Exercise B — Price the engagement** | Table, 9 min + 6 report | A number they wrote down and defended out loud |
| 6 | 70–80 | **The MRR underneath** | Facilitator | The practice model, not the project |
| 7 | 80–88 | **Objections, live** | Facilitator vs. room | The three that actually kill deals, answered |
| 8 | 88–90 | **The 30-day close** | Facilitator | One committed action with a date |

### Design notes per segment

**0 · The cold open.** Do not open with statistics — `shadowai.html` already owns the
statistics and the room has seen them. Open by asking for a show of hands: *who has had a
Copilot conversation stall on "we need to sort our data out first"?* Then: *whose customer
said that, and whose said it for them?* The second question is the session. Partners
routinely raise the governance objection themselves, then treat it as the customer's.

**1 · Meet Harbor & Vane.** The company profile is a one-page handout, distributed face
down and turned over on cue. It must fit on one side. The room needs the facts, not the
findings — findings arrive in segment 3, after the room has committed to an approach.

**2 · Exercise A.** Tables get the profile and one question: *what is the first thing you
sell them, and what does it cost?* Eight minutes. Capture answers on a flip or in chat
verbatim before commenting. The predictable spread — some sell an assessment, some sell
Copilot seats, some sell a security project, some say "I'd fix the SharePoint first" — is
the teaching material. **Do not correct any answer.** Segment 3 does that structurally.

**3 · The bridge.** The spine of the session and the single artefact partners will
photograph. A finding-to-control map: each shadow-AI or posture finding on the left, the
Microsoft control that answers it in the middle, and its position in the sequence on the
right — with the gates marked. Gates are the point: the two or three things that must be
true before Copilot is enabled, distinguished from the much longer list of things that can
follow enablement. Partners over-scope because nobody has ever told them what is
*optional*.

**4 · The licensing decision.** Delivered as a decision table, not a feature matrix. The
question in the room is never "what does E5 include" — it is "this customer is on Business
Premium and Business Standard, what can I actually sell and deliver on Monday." Dossier 02
supplies the entitlements; the room gets the three or four decisions those entitlements
force.

**5 · Exercise B.** The highest-value nine minutes in the session and the one most likely
to be cut for time. **Do not cut it.** Tables price the Harbor & Vane engagement: the
assessment fee, the remediation, and the monthly governance figure. Each table reports one
number for each and one sentence of justification. The spread across the room is always
wide, and the wide spread is the lesson: partners are guessing, and the person who guesses
low sets the market for everyone. Facilitator then shows the researched ranges from dossier
03 and, critically, the delivery-cost side — the hours from dossier 07 — so the room can see
which of their own numbers were unprofitable.

**6 · The MRR underneath.** Reframe from project to practice. The material a CXO needs:
what recurs and why the customer keeps paying after the cleanup is done, what the gross
margin looks like once delivery is repeatable, and what the attach rate has to be across a
book of customers for the practice to carry a dedicated person. Link out to
[`frontier.html`](../../frontier.html) for the program ladder rather than re-deriving it.

**7 · Objections, live.** Facilitator plays the Harbor & Vane owner and takes fire from the
room, or the reverse. Three objections only, chosen for being the ones that actually end
deals — the incumbent-trust objection ("our last MSP reviewed us, we're fine"), the
recurring-fee objection ("why do I pay monthly for a one-time cleanup"), and the
permissions-myth objection ("Microsoft says Copilot respects existing permissions, so we're
covered"). The eight softer ones in [`shadowai.html`](../../shadowai.html) §11 are the
leave-behind, not the room.

**8 · The 30-day close.** One action, written on the handout, with a date: run the
assessment on your own tenant. This is the Customer Zero thesis and the session must land on
it rather than on a control list. Ties to
[`customer-zero-starter-kit/`](../../customer-zero-starter-kit/).

---

## 3. Where a vendor fits — AvePoint and others in the room

AvePoint is expected at these events. A vendor in the room is an asset if the session
places them and a liability if it does not.

**The rule: the vendor answers a question the session has already made the room ask.**

The natural placement is inside segment 3, at the oversharing gate — the moment the room
has just accepted that permission sprawl is the blocker and immediately asks *how do I
actually find and fix this across 78 seats without three weeks of PowerShell?* That question
is real, the native tooling answer is genuinely partial at this seat count, and a vendor
demo lands as relief rather than as a sales interruption.

Constraints to set with any vendor before the event:

1. **Six minutes, inside segment 3, on the stated question.** Not a corporate overview.
2. **Multi-tenant and price-per-seat disclosed in the room.** The sub-100-seat economics are
   the room's actual objection; a vendor who will not address them should not present.
3. **The session names the free and native path first.** Credibility with a partner audience
   depends on the guide being honest that scripts and native reports work at one customer,
   and that platforms earn their place at ten. Dossier 05 supplies that line.
4. **No exclusivity in the written guide.** The page carries a comparison table; the room
   carries whoever showed up.

---

## 4. Materials

| Artefact | Format | Used |
|---|---|---|
| Harbor & Vane profile | One-page handout, printed both events and PDF | Segment 1 |
| The bridge diagram | Slide + full-size in the guide | Segment 3 |
| Licensing decision table | Slide + guide | Segment 4 |
| Pricing worksheet | Half-page, table exercise | Segment 5 |
| The 30-day card | Business-card or half-page, taken away | Segment 8 |
| **The guide** | The web page — the bible | After the room |

The five room artefacts are all extracts from the guide. Nothing is authored twice. This is
the answer to the one-artefact-or-two question: **one guide, and a facilitation section
inside it** that specifies the run of show and marks which figures are the room's extracts.
`coworksession40.html` is the precedent for the run-of-show markup and its `id="stop-N"`
anchor convention should be reused so the facilitator can link directly to a segment.

---

## 5. What the facilitator must be able to do

A session on a technical journey fails when the facilitator cannot answer the third
follow-up question. The guide needs a short, honest floor — this is gap **G7** in
[`00-brief-and-gap-analysis.md`](00-brief-and-gap-analysis.md) — covering:

- What the facilitator must have personally done (run the assessment on their own tenant is
  the non-negotiable; everything else is preparation)
- The five questions the room always asks that are not in the deck
- What to say when the honest answer is "that depends on their licensing" — with the
  decision table as the recovery
- When to hand to the vendor and when not to

---

## 6. Variants

| Slot | Cut | Keep |
|---|---|---|
| **60 min** | Exercise A shortened to a 3-minute poll; objections cut to one; MRR compressed | The bridge and Exercise B survive intact. If Exercise B does not fit, the session is a webinar and should be billed as one. |
| **120 min** | — | Add a live walkthrough of the actual portal paths from dossier 01, and a second objection round with roles reversed. |
| **Async / self-serve** | The whole room | The guide, with the exercises rewritten as self-assessment prompts |

---

## 7. Open questions for Ken

1. **Slot length and audience size** — table exercises need tables. A theatre-style room of
   200 changes segments 2 and 5 into polls, which is a materially weaker session.
2. **Is the pricing exercise safe to run with competitors in the room?** Partners
   discussing prices with each other in a facilitated setting is common at channel events
   and is also the kind of thing legal counsel has views about. Worth a check. The exercise
   can be run against *delivery cost and margin* rather than *price* if that is cleaner.
3. **Does AvePoint get the segment-3 slot, or is the vendor slot rotated per event?**
4. Whether the run-of-show lives in the public guide or in a separate facilitator page —
   recommended public, since partners running their own customer sessions is the point.
