(function () {
  async function render() {
    const mount = document.querySelector("[data-compare]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const benchmark = await window.FrontierUI.loadJson("../data/benchmarks.json");
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const rows = [
      { label: "Your estimate", score: summary.pcs.total },
      { label: "SMB peer average", score: benchmark.peerAverage },
      ...benchmark.cohorts.map((cohort) => ({ label: cohort.label, score: cohort.score }))
    ];

    document.querySelector("[data-compare-stage]").textContent = summary.stageDefinition.name;
    document.querySelector("[data-compare-delta]").textContent = `${summary.pcs.total - benchmark.peerAverage >= 0 ? "+" : ""}${summary.pcs.total - benchmark.peerAverage} vs. SMB peer average`;
    mount.innerHTML = rows.map((row, index) => `
      <div class="compare-row">
        <div class="bar-label">${row.label}</div>
        <div class="bar-track">
          <span class="bar-fill" style="--w:${Math.min(100, row.score)}%; ${index === 0 ? "background:linear-gradient(90deg,var(--amber),var(--teal));" : ""}"></span>
        </div>
        <div class="bar-value">${row.score}</div>
      </div>
    `).join("");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
