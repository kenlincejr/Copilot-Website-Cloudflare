(function () {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setActiveNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const target = href.split("/").pop();
      if (target === current || (current === "" && target === "index.html")) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function renderStageMap(container, activeStage) {
    if (!container || !window.FrontierNavigator) return;
    const active = Number(activeStage) || 0;
    container.innerHTML = window.FrontierNavigator.stageDefinitions.map((stage) => {
      const state = stage.id === active ? " active" : stage.id < active ? " done" : "";
      return `
      <article class="stage-node${state}">
        <span class="stage-id">${stage.id === 5 ? "F" : stage.id}</span>${stage.id === active ? '<span class="stage-here">You are here</span>' : ""}
        <div class="stage-name">${escapeHtml(stage.name)}</div>
        <div class="stage-meta">${escapeHtml(stage.requirement)}</div>
        <div class="stage-cost">${escapeHtml(stage.cost)}</div>
      </article>
    `;
    }).join("");
  }

  function renderMiniContinuum(container, activeStage) {
    if (!container || !window.FrontierNavigator) return;
    const active = Number(activeStage);
    const hasStage = Number.isFinite(active) && active >= 0;
    container.innerHTML = `
      <p class="continuum-title">Partner program ladder</p>
      <div class="continuum-line">
        ${window.FrontierNavigator.stageDefinitions.map((stage) => `
          <div class="mini-stage${hasStage && stage.id === active ? " highlight" : ""}">
            <strong>Stage ${stage.id}</strong>
            <span>${escapeHtml(stage.shortName)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Metric bars grouped the way Microsoft groups them: Performance, Skilling,
  // Customer success. A metric at zero is flagged, because it blocks the
  // designation whatever the total.
  function renderBars(container, pcs) {
    if (!container || !pcs) return;
    container.innerHTML = pcs.metrics.map((m) => `
      <div class="bar-row${m.zero ? " is-zero" : ""}">
        <div class="bar-label">${escapeHtml(m.label)}<span class="bar-cat">${escapeHtml(m.category)}</span></div>
        <div class="bar-track" role="img" aria-label="${escapeHtml(m.label)}: ${m.display} of ${m.max} points">
          <span class="bar-fill" style="--w:${Math.round((m.points / m.max) * 100)}%"></span>
        </div>
        <div class="bar-value">${m.display}/${m.max}${m.zero ? '<span class="zero-flag">at zero</span>' : ""}</div>
      </div>
    `).join("");
  }

  function renderChecklist(container, readiness) {
    if (!container || !readiness) return;
    container.innerHTML = readiness.checks.map((c) => `
      <li class="${c.met ? "met" : "open"}">
        <span class="check-mark" aria-hidden="true">${c.met ? "&#10003;" : ""}</span>
        <span>${escapeHtml(c.label)}${c.kind === "flag" ? "" : ` <strong>${Number(c.have).toLocaleString()} of ${Number(c.need).toLocaleString()}</strong>`}</span>
        <span class="sr-only">${c.met ? "met" : "not yet met"}</span>
      </li>
    `).join("");
  }

  function hasAssessment() {
    if (!window.FrontierNavigator) return false;
    return window.FrontierNavigator.isComplete(window.FrontierNavigator.loadAssessment());
  }

  function requireAssessment() {
    if (hasAssessment()) return true;
    const mount = document.querySelector("[data-require-assessment]");
    const legacy = window.FrontierNavigator && window.FrontierNavigator.hasLegacyAssessment();
    if (mount) {
      mount.innerHTML = `
        <div class="empty-state">
          <h2>${legacy ? "The Navigator has been updated" : "Start with the assessment"}</h2>
          <p class="lede">${legacy
            ? `The scoring model now follows Microsoft's published rules for each solution area (checked ${escapeHtml(window.FrontierNavigator.MODEL_DATE)}). Answers saved under the old model cannot be scored on the new one, so please retake the assessment. It takes about five minutes.`
            : "The Navigator needs your partner profile before it can estimate your score, gaps, roadmap, or export."}</p>
          <div class="action-row" style="justify-content:center; margin-top:16px;">
            <a class="button primary" href="assessment.html">${legacy ? "Retake the assessment" : "Start assessment"}</a>
          </div>
        </div>
      `;
    }
    return false;
  }

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function buildNav(prefix) {
    const p = prefix || "";
    return `
      <header class="topbar">
        <nav class="nav" aria-label="Primary">
          <a class="brand" href="${p}index.html">
            <span class="brand-mark">FN</span>
            <span>Frontier Navigator</span>
          </a>
          <div class="nav-links">
            <a data-nav href="${p}index.html">Home</a>
            <a data-nav href="${p}pages/assessment.html">Assessment</a>
            <a data-nav href="${p}pages/results.html">Results</a>
            <a data-nav href="${p}pages/roadmap.html">Roadmap</a>
            <a data-nav href="${p}pages/compare.html">Benchmark</a>
            <a data-nav href="${p}pages/resources.html">Resources</a>
            <a data-nav href="${p}pages/export.html">Export</a>
          </div>
        </nav>
      </header>
    `;
  }

  function buildFooter() {
    const date = window.FrontierNavigator ? window.FrontierNavigator.MODEL_DATE : "";
    return `
      <footer class="footer">
        <div class="footer-inner">
          <span>TD SYNNEX Microsoft Cloud Enablement &middot; <a href="https://copilotplaybook.com/">Copilot Playbook</a></span>
          <span>Scoring rules checked against Microsoft Learn on ${escapeHtml(date)}. Estimates are directional; Partner Center is the official source of record.</span>
        </div>
      </footer>
    `;
  }

  // Counts a number up from zero; instant when the user prefers reduced motion.
  function countUp(el, to, ms) {
    if (!el) return;
    const target = Number(to) || 0;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) { el.textContent = String(target); return; }
    const start = performance.now();
    const dur = ms || 900;
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-nav-shell]").forEach((node) => {
      node.innerHTML = buildNav(node.dataset.navShell || "");
    });
    document.querySelectorAll("[data-footer-shell]").forEach((node) => {
      node.innerHTML = buildFooter();
    });
    setActiveNav();
  });

  window.FrontierUI = {
    escapeHtml,
    renderStageMap,
    renderMiniContinuum,
    renderBars,
    renderChecklist,
    hasAssessment,
    requireAssessment,
    loadJson,
    download,
    countUp
  };
})();
