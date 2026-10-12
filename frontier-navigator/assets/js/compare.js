(function () {
  function render() {
    const mount = document.querySelector("[data-compare]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const F = window.FrontierNavigator;
    const esc = window.FrontierUI.escapeHtml;
    const summary = F.getAssessmentSummary();
    const pcs = summary.pcs;

    document.querySelector("[data-compare-area]").textContent = pcs.areaLabel;
    document.querySelector("[data-compare-stage]").textContent = summary.enrolled ? summary.stageDefinition.name : "Not enrolled yet";

    const zeros = pcs.metrics.filter((m) => m.zero).length;
    const maxed = pcs.metrics.filter((m) => m.points >= m.max).length;
    document.querySelector("[data-compare-strip]").innerHTML = `
      <div class="metric-card"><span class="metric-value">${pcs.total}</span><span class="metric-label">your estimated points</span></div>
      <div class="metric-card accent"><span class="metric-value">${F.THRESHOLD}</span><span class="metric-label">Microsoft's qualifying bar</span></div>
      <div class="metric-card"><span class="metric-value">${zeros}</span><span class="metric-label">${zeros === 1 ? "metric" : "metrics"} at zero (must be 0)</span></div>
      <div class="metric-card"><span class="metric-value">${maxed} of ${pcs.metrics.length}</span><span class="metric-label">metrics at their maximum</span></div>
    `;

    mount.innerHTML = pcs.metrics.map((m) => `
      <div class="bench-row${m.zero ? " is-zero" : ""}">
        <div class="bar-label">${esc(m.label)}<span class="bar-cat">${esc(m.category)}</span></div>
        <div>
          <div class="bar-track" role="img" aria-label="${esc(m.label)}: ${m.display} of ${m.max} points">
            <span class="bar-fill" style="--w:${Math.round((m.points / m.max) * 100)}%"></span>
          </div>
          <div class="bench-units">${m.input.toLocaleString()} ${esc(F.unitLabel(m.unit, m.input))} entered; ${Number(m.unitsForMax).toLocaleString()} earns the full ${m.max}${m.gateMet ? "" : `. Needs ${esc(m.gateText)} first`}</div>
        </div>
        <div class="bar-value">${m.display}/${m.max}</div>
      </div>
    `).join("") + `
      <div class="bench-row">
        <div class="bar-label">Total<span class="bar-cat">Qualifying bar is ${F.THRESHOLD}</span></div>
        <div class="bar-track" role="img" aria-label="Total: ${pcs.total} of 100, bar at ${F.THRESHOLD}">
          <span class="bar-fill" style="--w:${Math.min(100, pcs.total)}%; background:linear-gradient(90deg,var(--amber),var(--teal));"></span>
          <i class="bench-need" style="left:${F.THRESHOLD}%"></i>
        </div>
        <div class="bar-value">${pcs.total}/100</div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", render);
})();
