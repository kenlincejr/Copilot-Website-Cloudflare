# Frontier Navigator — the legitimacy and freshness pressure test

You are the lead QA engineer for the Frontier Navigator (`frontier-navigator/`) and, in the
same seat, a Microsoft partner-program specialist who has walked SMB partners from free
enrollment to a designation, the Microsoft 365 Copilot specialization, and Frontier Partner.
Your job is one question, asked of every number, rule, and sentence the tool shows:

> **Is this still true today, per Microsoft's own published pages, and does every answer a
> partner gives actually reach the score, the stage, the plan, and the export?**

A claim with no Microsoft source is not "probably fine". A question whose answer never moves
the score is not "wired in". Say so, per claim and per input, with the evidence.

Work as an engineer. Run things. Reproduce before you report. Fix what is small and clearly
wrong; write up what is large or a judgment call as a proposed diff. Report outcomes
faithfully: a failing test is reported with its output, a fact you could not verify is
reported as unverified, and "unchanged since the last audit" is a valid finding.

**Do not finish until both suites report 0 failures** and every fact in workstream A is
either confirmed against a live Microsoft page or corrected in the engine with a test.

---

## 0. How to run this review

**Model routing.** Run on Claude Opus at high effort. Hand mechanical sweeps (fetching each
Microsoft page, checking every resource URL's HTTP status, grepping copy) to Sonnet
subagents with the exact URL list and the exact table shape you want back. Do not let a
subagent decide a fact is "close enough"; verdicts are yours.

**Ground truth, in priority order.**
1. Live Microsoft Learn and Partner Center pages (list in §A). Record each page's
   `updated_at` from its metadata.
2. `research/partner-program-journey/13-frontier-navigator-fact-audit.md`, the last full
   audit (2026-10-12). Every point value in the engine traces to its §2.2; every ladder
   cost and requirement to its §3.
3. The site's own `copilot-specialization.html`. The Navigator must never contradict it.
   (`frontier.html` was found stale in eight places on 2026-10-12; do not treat it as truth.)

**Site rules that apply here.** US English only. Never name a competing distributor.
Every number shown needs a published source, so no invented peer averages or "typical
partner" figures. Customer data appears as shapes, not numbers.

**Where you write.** Findings go to
`research/partner-program-journey/14-frontier-navigator-qa-<YYYY-MM-DD>.md`. Fact changes
go into the engine, the questions, and the audit file in the same change, with a test. Bump
`MODEL_DATE` in `frontier-navigator/assets/js/scoring.js` only after workstream A is complete.

**The suites. Run both first and confirm you are green before touching anything:**

```powershell
node tools/test-frontier-navigator.js
python tools/e2e-frontier-navigator.py --shots
```

The first is the engine suite. It loads `scoring.js` in a bare vm and covers facts, an
independent oracle, fuzzing, wiring, personas and copy rules (about 45,000 checks). The second
plays every persona in `tools/fixtures/frontier-navigator-personas.json` through the real
wizard in Chromium and checks every page. Screenshots land in
`tools/traces/frontier-navigator/`, which is git-ignored.

---

## A. Facts: is every claim still true?

Fetch each page and compare it, line by line, with what the engine and copy say. For each
claim, record: the tool's claim (file:line) · the live text · verdict (CONFIRMED /
CHANGED / RETIRED / UNVERIFIABLE) · source URL and `updated_at`.

| # | Claim in the tool | Where | Verify against |
|---|---|---|---|
| A1 | 70 of 100 to qualify, every metric above zero, met on any one day in the window | `THRESHOLD`, `calculatePCS` | learn.microsoft.com/en-us/partner-center/membership/partner-capability-score |
| A2 | Modern Work SMB: 2/customer to 20; 5/person to 10; 15/person to 15; MAU growth 30 at 2,000 CSP / 500 CPOR; deployments 25 at 10 CSP / 5 CPOR (40% active) | `AREAS.modern_work` | …/solutions-partner-modern-work |
| A3 | Security SMB: 4/customer to 20; skilling gates SC-500 (4) + SC-200 (4), then 8/person to 40; protected users 1 per 50 to 20; deployments 20 at 6 (15% active) | `AREAS.security` | …/solutions-partner-security |
| A4 | Azure (all three) SMB: 10/customer to 30 at $500 ACR in one of the last two months; ACR growth 1/% to 20; services 2 each to 10; Data & AI skilling gates AZ-104 + AZ-305 then 4/person to 40; DAI and Infra 20/20 with AZ-104 and AZ-305 gates | `AREAS.data_ai`, `azureTwoTier` | …/solutions-partner-azure |
| A5 | Business Applications SMB: 3/workload to 15 ($250/month); 4/person to 20; 7.5/person to 15; MCV growth 1/% to 30; deployments 4 each to 20 (5,000 MCV) | `AREAS.business_apps` | …/solutions-partner-business |
| A6 | Enrollment $0; Launch $350, Core $925, Expanded $4,125; designation $4,875/yr covering every designation | `stageDefinitions` | partner-launch-benefits, partner-success-core-benefits, partner-success-expanded-benefits, mpn-pay-fee-silver-gold-competency, solutions-partner-faq |
| A7 | Copilot specialization: any one of Modern Work, Business Applications, Security; 1,000 Copilot MAU growth AND 5 customers at 5+ MAU; 5 SC-401 + 5 AB-620/AB-100; audit about $2,700 | `copilotReadiness`, stage 3 | …/specializations-apply (Microsoft 365 Copilot section); audit checklist PDF |
| A8 | Frontier Partner specialization (live 2026-09-30): Copilot + Data Security + IAM, plus AI Apps or AI Platform; 5 Titan badges; 3 DP-600; audit about $4,000; legacy badge retires end of June 2027 | `frontierReadiness`, stage 5, landing banner | …/specializations-apply (Frontier Partner section); …/announcements |
| A9 | Certification status: MS-102 retires 2026-11-30 (counts to 2027-11-30); AZ-500 retired 2026-08-31; MS-700 intermediate; SC-500 is the Security step 1 gate | questions.json help text, `cert` strings, resources.json | learn.microsoft.com/en-us/credentials/certifications/… |
| A10 | Every URL in `data/resources.json` resolves to the page its description promises (watch for soft 404s that return 200) | resources.json | fetch each one |

**Dated facts to watch.** After **November 30, 2026**, MS-102 can no longer be taken.
Rewrite the Modern Work advanced-cert advice from "sit it before it retires" to whatever
Microsoft lists as its successor. If none is listed, say so plainly. After **June 30,
2027**, drop the legacy Frontier badge from the landing banner. Check the Frontier audit
checklist version, because V1.0 is active only through 2026-12-31.

When a fact has changed:
1. Fix the engine or the copy.
2. Update the test that pins it. Section A of the engine suite holds the maxes, and section B
   holds the oracle, written independently from the audit table rather than copied from the
   engine.
3. Add or adjust a persona that would have caught the change.
4. Update the audit file with the new source and date.

---

## B. Wiring: does every answer reach the outcome?

For each question in `data/questions.json`, prove the answer changes something a partner
sees. Fill in this table per input:

| input | visible when | moves the score? | moves the stage? | appears in gaps/actions? | appears in roadmap? | appears in export? |

The suite already checks the following; extend it rather than re-deriving:
- **Score inputs:** every metric input is asked when its area is chosen, and one more unit raises the score.
- **No leaks:** no other area's questions appear for a chosen area.
- **Pruning:** changing an upstream answer cascades and drops stale answers.
- **Copilot holders:** they are never asked the Copilot readiness questions.

Look for these specific failure shapes:
- **Displayed but inert:** a question that appears in a summary but never moves a number.
- **Gate blind spots:** a gated metric where the partner moves a lever and nothing happens with no explanation. This was found and fixed once already, with the gate toggles in what-if.
- **Contradictions:** two screens saying different things from the same answers, for example the stage map versus "You are here", or the qualify pill versus the priority detail.

---

## C. Partners: walk it as they would

Play each persona through the real wizard: `python tools/e2e-frontier-navigator.py`. Then
read each persona's results, roadmap and export as that partner would, and grade each one:

- **Right:** is the stage correct? Is the next milestone the real next step? (A benefits package is never "next"; it is optional.)
- **Specific:** does each action name the actual certification, customer rule, or audit, rather than "improve skilling"?
- **Honest:** does a partner over 70 with a metric at zero get told plainly that zero blocks them? Is a qualified non-designated partner told that qualified is not enrolled, and that a purchase is due?
- **Cheapest path:** do the top actions spend effort where one unit buys the most points?

Personas that must exist, as a minimum (16 today, P01–P16):
- Not enrolled.
- One point short.
- Over 70 with a zero metric.
- Qualified but not designated.
- Each of the six solution areas.
- A gate missing.
- Adding a second designation.
- Copilot-ready.
- An ineligible designation chasing Copilot.
- On the way to Frontier.
- All Frontier prerequisites met.
- A current Frontier Partner.
- All zeros.
- Association type unknown.

Add a persona for every bug you find, with the expectation that would have caught it.

---

## D. Experience: does it hold up in front of a partner?

- **Phone width (375px):** no horizontal scroll on any page, and the question shows before the sidebar.
- **Keyboard:** digits pick options, Enter advances, and focus is visible.
- **Motion:** with `prefers-reduced-motion`, the count-up and slide animations are off.
- **Screen readers:** radio groups expose `aria-checked`, score bars have labels, and the live estimate is `aria-live`.
- **Storage:** answers from the old model (no `_v: 2`) show the retake notice, not a bogus score. Blocked storage never throws.
- **Print:** the scorecard prints on one page without the navigation or buttons.
- **Homepage:** `index.html` "Navigate The Program" shows the Frontier Navigator card as step one of the three-card path, and the link resolves.

---

## E. Report

Write the findings file with:
1. **Verdict:** safe to put in front of partners, yes or no, and why.
2. **Fact table:** every A-row with its verdict and source.
3. **Wiring table:** one row per input.
4. **Persona grades.**
5. **Fixes applied, each with the test that pins it.**
6. **Proposed changes not applied.**
7. **Final suite output, pasted verbatim:**

```
frontier-navigator: N passed, 0 failed
frontier-navigator e2e: N passed, 0 failed (N personas)
```

Severity:
- **Critical:** a partner would be told a wrong Microsoft rule, price or requirement, or would be steered to the wrong next step.
- **High:** a wired input that does not move the outcome, or two screens that disagree.
- **Medium:** a missing disclosure, or a stale date.
- **Low:** copy and polish.
