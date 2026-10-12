"""End-to-end walk of frontier-navigator/ as real partners.

Each persona in tools/fixtures/frontier-navigator-personas.json is played
through the actual wizard in Chromium: answer cards are clicked, steppers are
typed into, checkboxes ticked, Next pressed, exactly as a partner would. Then
every page is checked against the engine's own summary for the same answers.

    python tools/e2e-frontier-navigator.py            (from the repo root)
    python tools/e2e-frontier-navigator.py --shots    (also save screenshots)

Serves the repo on a free localhost port; needs Playwright with Chromium.
"""
import functools, http.server, json, pathlib, socketserver, sys, threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PERSONAS = json.loads((ROOT / "tools/fixtures/frontier-navigator-personas.json").read_text(encoding="utf-8"))
QUESTIONS = json.loads((ROOT / "frontier-navigator/data/questions.json").read_text(encoding="utf-8"))
SHOTS = "--shots" in sys.argv
SHOT_DIR = ROOT / "tools/traces/frontier-navigator"

passed = failed = 0


def check(cond, msg):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print("FAIL:", msg)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}/frontier-navigator/"


def answer_current(page, persona, errors):
    """Answer whichever question is on screen, the way a person would."""
    qid = page.locator(".question-inner").get_attribute("data-qid")
    q = next((q for q in QUESTIONS if q["id"] == qid), None)
    if q is None:
        check(False, f"{persona['id']}: unknown question on screen: {qid!r}")
        return None
    check(page.locator(".question-title").inner_text() == q["label"], f"{persona['id']}: {qid} shows its own label")
    want = persona["answers"].get(q["id"])
    if q["type"] == "select":
        if want is None:
            check(False, f"{persona['id']}: wizard asked {q['id']} but the persona has no answer (branching shows a question it should hide)")
            want = q["options"][0]["value"]
        page.locator(f'[data-option="{want}"]').click()
        page.wait_for_function("(id) => { const n = document.querySelector('.question-inner'); return !n || n.dataset.qid !== id || location.pathname.endsWith('results.html'); }", arg=qid, timeout=5000)
    elif q["type"] == "checkbox":
        for v in (want or []):
            page.locator(f'input[name="{q["id"]}"][value="{v}"]').check()
        page.locator("[data-next]").click()
    else:
        if want is None:
            check(False, f"{persona['id']}: wizard asked {q['id']} but the persona has no answer")
            want = "0"
        box = page.locator(f'#{q["id"]}')
        box.fill(str(want))
        box.press("Enter")
    page.wait_for_timeout(60)
    return q["id"]


def walk(page, base, persona, errors):
    page.goto(base + "pages/assessment.html")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector(".question-title")
    asked = []
    for _ in range(40):
        if "results.html" in page.url:
            break
        qid = answer_current(page, persona, errors)
        if qid is None:
            return asked
        asked.append(qid)
    check("results.html" in page.url, f"{persona['id']}: wizard reached the results page")
    return asked


def engine_summary(page):
    return page.evaluate("""() => {
        const s = window.FrontierNavigator.getAssessmentSummary();
        return { total: s.pcs.total, qualified: s.pcs.qualified, stage: s.stage, stageName: s.stageDefinition.name,
                 enrolled: s.enrolled, next: s.nextStage.name, priority: s.priority.label,
                 actions: s.gap.actions, gaps: s.gap.gaps, area: s.pcs.areaLabel,
                 copilotShown: s.stage < 3 && ['copilot_spec','frontier_spec'].includes(s.assessment.goal12Mo),
                 frontierShown: s.stage < 5 && s.assessment.goal12Mo === 'frontier_spec',
                 answers: s.assessment };
    }""")


def run_persona(browser, base, persona):
    pid = persona["id"]
    ctx = browser.new_context(viewport={"width": 1366, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("**/clarity.ms/**", lambda r: r.abort())
    page.route("**/assets/site-search.js*", lambda r: r.abort())

    asked = walk(page, base, persona, errors)
    expected_ids = [q["id"] for q in QUESTIONS if visible(q, persona["answers"])]
    check(asked == expected_ids, f"{pid}: asked exactly the visible questions in order\n  asked    {asked}\n  expected {expected_ids}")

    page.wait_for_selector("[data-score-number]")
    page.wait_for_timeout(1100)  # let the count-up finish
    s = engine_summary(page)
    e = persona["expect"]
    if "total" in e:
        check(s["total"] == e["total"], f"{pid}: engine total in browser {s['total']} == {e['total']}")
    check(page.inner_text("[data-score-number]") == str(s["total"]), f"{pid}: ring shows {s['total']}")
    shown_stage = page.inner_text("[data-stage-name]")
    check(shown_stage == (s["stageName"] if s["enrolled"] else "Not enrolled yet"), f"{pid}: stage shown {shown_stage!r}")
    check(page.inner_text("[data-priority]") == f"{s['priority']} priority", f"{pid}: priority pill")
    pill = page.inner_text("[data-qualify]")
    check(("Qualifies" in pill) == s["qualified"], f"{pid}: qualify pill {pill!r} agrees with engine")
    gaps = page.locator("[data-gaps] li").all_inner_texts()
    acts = page.locator("[data-actions] li").all_inner_texts()
    check(gaps == s["gaps"], f"{pid}: gaps rendered as computed")
    check(acts == s["actions"], f"{pid}: actions rendered as computed")
    bars = page.locator("[data-score-bars] .bar-row").count()
    check(bars in (4, 5), f"{pid}: {bars} metric bars")
    check(page.locator("[data-copilot-panel]").is_visible() == s["copilotShown"], f"{pid}: Copilot readiness panel visibility")
    check(page.locator("[data-frontier-panel]").is_visible() == s["frontierShown"], f"{pid}: Frontier readiness panel visibility")
    check(page.locator(".stage-node.active").count() == 1, f"{pid}: exactly one active stage node")

    # What-if: pushing every open lever to its max never lowers the score, and reset restores it.
    gate_boxes = page.locator("[data-gate]")
    for i in range(gate_boxes.count()):
        gate_boxes.nth(i).check()
    sliders = page.locator("[data-lever]:not([disabled])")
    for i in range(sliders.count()):
        el = sliders.nth(i)
        el.evaluate("(n) => { n.value = n.max; n.dispatchEvent(new Event('input')); }")
    projected = int(page.inner_text("[data-whatif-score]"))
    check(projected >= s["total"], f"{pid}: what-if at max ({projected}) >= current ({s['total']})")
    check(projected == 100, f"{pid}: every lever and gate at max projects 100 (got {projected})")
    page.click("[data-whatif-reset]")
    check(int(page.inner_text("[data-whatif-score]")) == s["total"], f"{pid}: what-if reset")
    check(all(not gate_boxes.nth(i).is_checked() for i in range(gate_boxes.count())), f"{pid}: reset clears gate toggles")
    if SHOTS:
        SHOT_DIR.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOT_DIR / f"{pid}-results.png"), full_page=True)

    # Roadmap: 9 items, ticking one persists across reload.
    page.goto(base + "pages/roadmap.html")
    page.wait_for_selector("[data-roadmap-check]")
    check(page.locator("[data-roadmap-check]").count() == 9, f"{pid}: roadmap has 9 items")
    page.locator("[data-roadmap-check]").first.check()
    page.reload()
    page.wait_for_selector("[data-roadmap-check]")
    check(page.locator("[data-roadmap-check]").first.is_checked(), f"{pid}: roadmap tick persists")
    check(page.inner_text("[data-roadmap-count]") == "1 of 9 done", f"{pid}: roadmap progress counter")

    # Benchmark: one row per metric plus the total; no peer averages.
    page.goto(base + "pages/compare.html")
    page.wait_for_selector(".bench-row")
    check(page.locator(".bench-row").count() == bars + 1, f"{pid}: benchmark rows")
    check("smb peer average" not in page.inner_text("main").lower() and "vs. smb" not in page.inner_text("main").lower(), f"{pid}: no invented peer average")

    # Resources: matched list is never empty and every link is https.
    page.goto(base + "pages/resources.html")
    page.wait_for_selector("[data-resources] .resource-card")
    hrefs = page.locator("[data-resources] a").evaluate_all("els => els.map(e => e.href)")
    check(len(hrefs) >= 2 and all(h.startswith("https://") for h in hrefs), f"{pid}: {len(hrefs)} https resources")

    # Export: preview filled; text report matches the engine and carries no stale claims.
    page.goto(base + "pages/export.html")
    page.wait_for_selector("[data-export-score]")
    check(page.inner_text("[data-export-score]") == str(s["total"]), f"{pid}: export score")
    report = page.evaluate("window.FrontierExport.buildPlainReport()")
    check(f"Estimated score: {s['total']}/100" in report, f"{pid}: text report score line")
    for stale in ("Action Pack", "Performance: ", "Second Designation", "undefined", "NaN"):
        check(stale not in report, f"{pid}: report free of {stale!r}")
    with page.expect_download() as dl:
        page.click("[data-download-text]")
    check(dl.value.suggested_filename.endswith("-frontier-navigator.txt"), f"{pid}: text download")

    # Blocked third-party requests (analytics, site search) log ERR_FAILED by design.
    real = [x for x in errors if "net::ERR_FAILED" not in x]
    check(not real, f"{pid}: no console errors {real[:3]}")
    ctx.close()


def visible(q, a):
    def matches(have, want):
        lst = want if isinstance(want, list) else [want]
        return any(v in lst for v in have) if isinstance(have, list) else have in lst
    if q.get("showIf") and not all(matches(a.get(k), v) for k, v in q["showIf"].items()):
        return False
    if q.get("hideIf") and any(matches(a.get(k), v) for k, v in q["hideIf"].items()):
        return False
    return True


def special_cases(browser, base):
    # Legacy answers from the old model trigger the retake notice, not a bogus score.
    ctx = browser.new_context()
    page = ctx.new_page()
    page.route("**/clarity.ms/**", lambda r: r.abort())
    page.route("**/assets/site-search.js*", lambda r: r.abort())
    page.goto(base + "pages/results.html")
    page.evaluate("localStorage.setItem('frontierNavigatorAssessment', JSON.stringify({currentTier:'action_pack', designation:'multiple', newCustomers12Mo:'4'}))")
    page.reload()
    check("has been updated" in page.inner_text("main"), "legacy answers show the retake notice")
    # Empty state on every gated page.
    page.evaluate("localStorage.clear()")
    for p in ("results", "roadmap", "compare", "export"):
        page.goto(base + f"pages/{p}.html")
        check("Start with the assessment" in page.inner_text("main"), f"empty state on {p}")
    # Validation: letters and over-max numbers are refused with a message.
    page.goto(base + "pages/assessment.html")
    page.locator('[data-option="member"]').click()
    page.wait_for_timeout(420)
    page.locator('[data-option="modern_work"]').click()
    page.wait_for_timeout(420)
    page.fill("#mw_netAdds", "abc")
    page.click("[data-next]")
    check("whole number" in page.inner_text("[data-form-error]"), "letters refused")
    page.fill("#mw_netAdds", "999999")
    page.click("[data-next]")
    check("most this question accepts" in page.inner_text("[data-form-error]"), "over-max refused")
    page.fill("#mw_netAdds", "")
    page.click("[data-next]")
    check("Enter a number" in page.inner_text("[data-form-error]"), "blank refused")
    page.click('[data-step="1"]')
    check(page.input_value("#mw_netAdds") == "1", "stepper increments")
    # Keyboard: digit keys pick an option.
    page.click("[data-prev]")
    page.keyboard.press("3")
    page.wait_for_timeout(420)
    check(page.evaluate("JSON.parse(localStorage.getItem('frontierNavigatorAssessment')).targetArea") == "data_ai", "keyboard 3 picks the third area")
    ctx.close()

    # Phone width: no horizontal scroll on any page, wizard usable.
    ctx = browser.new_context(viewport={"width": 375, "height": 800}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.route("**/clarity.ms/**", lambda r: r.abort())
    page.route("**/assets/site-search.js*", lambda r: r.abort())
    page.goto(base + "pages/assessment.html")
    page.evaluate("localStorage.setItem('frontierNavigatorAssessment', JSON.stringify(Object.assign({_v:2}, %s)))" % json.dumps(PERSONAS[11]["answers"]))
    for p in ("index.html", "pages/assessment.html", "pages/results.html", "pages/roadmap.html", "pages/compare.html", "pages/resources.html", "pages/export.html"):
        page.goto(base + p)
        page.wait_for_timeout(500)
        sw = page.evaluate("document.documentElement.scrollWidth")
        check(sw <= 375, f"phone: {p} has no horizontal scroll ({sw}px)")
        if SHOTS:
            page.screenshot(path=str(SHOT_DIR / f"phone-{p.replace('/', '-')}.png"), full_page=True)
    ctx.close()


def main():
    httpd, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for persona in PERSONAS:
            run_persona(browser, base, persona)
        special_cases(browser, base)
        browser.close()
    httpd.shutdown()
    print(f"\nfrontier-navigator e2e: {passed} passed, {failed} failed ({len(PERSONAS)} personas)")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
