(function () {
  function render() {
    const root = document.querySelector("[data-results-root]");
    if (!root || !window.FrontierUI.requireAssessment()) return;

    const summary = window.FrontierNavigator.getAssessmentSummary();
    window.FrontierUI.renderStageMap(document.querySelector("[data-stage-map]"), summary.stage);
    window.FrontierUI.renderBars(document.querySelector("[data-score-bars]"), summary.pcs);

    document.querySelector("[data-score-ring]").style.setProperty("--score", summary.pcs.total);
    document.querySelector("[data-score-number]").textContent = summary.pcs.total;
    document.querySelector("[data-stage-name]").textContent = summary.stageDefinition.name;
    document.querySelector("[data-next-stage]").textContent = summary.stage >= 5 ? "Frontier maintenance" : summary.nextStage.name;
    document.querySelector("[data-priority]").textContent = `${summary.priority.label} priority`;
    document.querySelector("[data-priority]").className = `status-pill ${summary.priority.tone}`;
    document.querySelector("[data-priority-detail]").textContent = summary.priority.detail;
    document.querySelector("[data-confidence]").textContent = `${Math.min(100, Math.round((summary.pcs.total / 70) * 100))}% of the way to the 70-point threshold`;

    document.querySelector("[data-gaps]").innerHTML = summary.gap.gaps.map((gap) => `<li>${gap}</li>`).join("");
    document.querySelector("[data-actions]").innerHTML = summary.gap.actions.map((action) => `<li>${action}</li>`).join("");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
