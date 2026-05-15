# Frontier Navigator

A static, local-first web application for helping SMB-focused Microsoft partners assess their MAICPP readiness, estimate Partner Capability Score, identify gaps, build a 90-day roadmap, compare to planning benchmarks, and export a TD SYNNEX-ready scorecard.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/frontier-navigator/`.

## Structure

- `index.html` - landing page
- `pages/assessment.html` - 15-question assessment wizard
- `pages/results.html` - PCS estimate, stage map, and gap analysis
- `pages/roadmap.html` - generated 30/60/90-day action plan
- `pages/compare.html` - static SMB benchmark comparison
- `pages/resources.html` - matched TD SYNNEX and Microsoft resources
- `pages/export.html` - PDF, text, JSON, and BDM email outputs
- `assets/js/scoring.js` - PCS calculation and recommendation engine
- `data/questions.json` - assessment configuration

## Notes

The PCS model is intentionally directional. Microsoft Partner Center remains the official source of record for eligibility, score, and program status.
