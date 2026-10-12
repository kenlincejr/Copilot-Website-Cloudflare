# Frontier Navigator

A static, local-first web application that helps SMB-focused Microsoft partners place themselves on the partner program ladder, estimate their Partner Capability Score on Microsoft's published per-designation rules, check Copilot and Frontier specialization readiness, build a 90-day roadmap, and export a TD SYNNEX-ready scorecard.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/frontier-navigator/`.

## Structure

- `index.html` - landing page
- `pages/assessment.html` - branching assessment wizard (questions adapt to the solution area)
- `pages/results.html` - PCS estimate, stage map, and gap analysis
- `pages/roadmap.html` - generated 30/60/90-day action plan
- `pages/compare.html` - your metrics against Microsoft's published maximums and the 70-point bar
- `pages/resources.html` - matched TD SYNNEX and Microsoft resources
- `pages/export.html` - PDF, text, JSON, and BDM email outputs
- `assets/js/scoring.js` - PCS calculation and recommendation engine
- `data/questions.json` - assessment configuration

## Facts and tests

Every point value and stage requirement traces to
`research/partner-program-journey/13-frontier-navigator-fact-audit.md`
(Microsoft Learn, checked 2026-10-12). `MODEL_DATE` in `scoring.js` records that date
and appears in the footer.

```powershell
node tools/test-frontier-navigator.js
```

The QA prompt that re-verifies the facts and walks the personas is
`tools/frontier-navigator-qa-prompt.md`. Re-run it whenever Microsoft updates a
designation page or a certification retires.

The model is directional. Microsoft Partner Center remains the official source of record for eligibility, score, and program status.
