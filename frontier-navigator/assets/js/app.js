(function () {
  function setActiveNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const target = href.split("/").pop();
      if (target === current || (current === "" && target === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  function renderStageMap(container, activeStage) {
    if (!container || !window.FrontierNavigator) return;
    const active = Number(activeStage) || 0;
    container.innerHTML = window.FrontierNavigator.stageDefinitions.map((stage) => `
      <article class="stage-node${stage.id === active ? " active" : ""}">
        <span class="stage-id">${stage.id === 5 ? "F" : stage.id}</span>
        <div class="stage-name">${stage.name}</div>
        <div class="stage-meta">${stage.requirement}</div>
      </article>
    `).join("");
  }

  function renderMiniContinuum(container, activeStage) {
    if (!container || !window.FrontierNavigator) return;
    const active = Number(activeStage) || 0;
    container.innerHTML = `
      <p class="continuum-title">MAICPP continuum</p>
      <div class="continuum-line">
        ${window.FrontierNavigator.stageDefinitions.map((stage) => `
          <div class="mini-stage${stage.id === active ? " highlight" : ""}">
            <strong>${stage.id === 5 ? "F" : `Stage ${stage.id}`}</strong>
            <span>${stage.shortName}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderBars(container, pcs) {
    if (!container || !pcs) return;
    const rows = [
      ["Performance", pcs.breakdown.performance, pcs.max.performance],
      ["Skilling", pcs.breakdown.skilling, pcs.max.skilling],
      ["Usage Growth", pcs.breakdown.usageGrowth, pcs.max.usageGrowth],
      ["Deployments", pcs.breakdown.deployments, pcs.max.deployments]
    ];

    container.innerHTML = rows.map(([label, value, max]) => `
      <div class="bar-row">
        <div class="bar-label">${label}</div>
        <div class="bar-track" aria-label="${label}: ${value} of ${max}">
          <span class="bar-fill" style="--w:${Math.round((value / max) * 100)}%"></span>
        </div>
        <div class="bar-value">${value}/${max}</div>
      </div>
    `).join("");
  }

  function hasAssessment() {
    const assessment = window.FrontierNavigator ? window.FrontierNavigator.loadAssessment() : {};
    return Object.keys(assessment).length > 0;
  }

  function requireAssessment() {
    if (hasAssessment()) return true;
    const mount = document.querySelector("[data-require-assessment]");
    if (mount) {
      mount.innerHTML = `
        <div class="empty-state">
          <h2>Start with the assessment</h2>
          <p class="lede">The Navigator needs your partner profile before it can calculate PCS, gaps, roadmap, or export artifacts.</p>
          <div class="action-row" style="justify-content:center; margin-top:16px;">
            <a class="button primary" href="assessment.html">Start assessment</a>
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
            <a data-nav href="${p}pages/compare.html">Compare</a>
            <a data-nav href="${p}pages/resources.html">Resources</a>
            <a data-nav href="${p}pages/export.html">Export</a>
          </div>
        </nav>
      </header>
    `;
  }

  function buildFooter() {
    return `
      <footer class="footer">
        <div class="footer-inner">
          <span>TD SYNNEX Microsoft Cloud Enablement</span>
          <span>Directional PCS estimates only. Partner Center remains the official source of record.</span>
        </div>
      </footer>
    `;
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
    renderStageMap,
    renderMiniContinuum,
    renderBars,
    hasAssessment,
    requireAssessment,
    loadJson,
    download
  };
})();
