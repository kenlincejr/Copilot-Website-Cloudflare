"""tools/sweep-search-meta.py

One-time sweep for specs/site-search-v2.spec.md Phase A step 2: add the
page_type and priority meta tags AI Search uses for filter chips and boosting.
Each tag goes right after the page's og:description tag, copying that line's
indentation and self-closing style. Idempotent: pages that already carry both
tags are skipped. The mapping is spec section 3.2 (decision D10); the gate
(tools/site-gate.js, section M) checks it stays in force.

    python tools/sweep-search-meta.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGE_META = {
    "cpb.html": ("playbook", 3),
    "cpb-build-belief.html": ("playbook", 3),
    "cpb-model-the-practice.html": ("playbook", 3),
    "cpb-run-the-engagement.html": ("playbook", 3),
    "cpb-earn-the-badge.html": ("playbook", 3),
    "copilot-token-economics.html": ("playbook", 3),
    "copilot-readiness-engagement.html": ("engagement", 3),
    "copilot-readiness-governance.html": ("engagement", 3),
    "copilot-studio-agent-engagement.html": ("engagement", 3),
    "copilot-adoption-audit.html": ("engagement", 3),
    "shadowai.html": ("engagement", 3),
    "agent-never-done.html": ("engagement", 3),
    "cpbops.html": ("engagement", 3),
    "copilot-credit-planner.html": ("tool", 2),
    "cowork-calculator.html": ("tool", 2),
    "azure-billing-setup.html": ("tool", 2),
    "customer-zero-starter-kit/index.html": ("customer-zero", 2),
    "customer-zero-starter-kit/become-customer-zero.html": ("customer-zero", 2),
    "customer-zero-starter-kit/build-sellable-services.html": ("customer-zero", 2),
    "frontier.html": ("program", 2),
    "copilot-specialization.html": ("program", 2),
    "cowork.html": ("playbook", 2),
    "CopilotApp.html": ("playbook", 2),
    "CopilotIB.html": ("playbook", 2),
    "coworksession40.html": ("playbook", 2),
    "frontier-navigator/index.html": ("tool", 2),
    "coworkdemo.html": ("tool", 1),
    "frontier-navigator/pages/assessment.html": ("tool", 1),
    "frontier-navigator/pages/roadmap.html": ("tool", 1),
    "frontier-navigator/pages/resources.html": ("tool", 1),
    "frontier-navigator/pages/compare.html": ("tool", 1),
    "frontier-navigator/pages/export.html": ("tool", 1),
    "frontier-navigator/pages/results.html": ("tool", 1),
    "index.html": ("tool", 1),
}

OG_DESC = re.compile(r'^([ \t]*)<meta property="og:description"[^>]*?(\s*/?)>[ \t]*(?=\r?$)', re.M)


def main():
    changed, skipped, errors = [], [], []
    for rel, (ptype, prio) in PAGE_META.items():
        p = ROOT / rel
        raw = p.read_bytes()
        text = raw.decode("utf-8")
        nl = "\r\n" if "\r\n" in text else "\n"
        if 'name="page_type"' in text and 'name="priority"' in text:
            skipped.append(rel)
            continue
        m = list(OG_DESC.finditer(text))
        if len(m) != 1:
            errors.append(f"{rel}: expected one og:description line, found {len(m)}")
            continue
        indent, close = m[0].group(1), m[0].group(2)
        close = close if close.strip() else ""
        tail = " />" if close.strip() == "/" else ">"
        add = (f'{nl}{indent}<meta name="page_type" content="{ptype}"{tail}'
               f'{nl}{indent}<meta name="priority" content="{prio}"{tail}')
        end = m[0].end()
        text = text[:end] + add + text[end:]
        p.write_bytes(text.encode("utf-8"))
        changed.append(rel)
    print(f"changed {len(changed)}, skipped {len(skipped)}, errors {len(errors)}")
    for e in errors:
        print("  ERROR", e)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
