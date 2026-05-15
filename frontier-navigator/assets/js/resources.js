(function () {
  function card(resource) {
    return `
      <article class="resource-card">
        <div>
          <div class="resource-meta">
            <span class="tag">${resource.type}</span>
          </div>
          <h3 style="margin-top:10px;">${resource.title}</h3>
          <p>${resource.description}</p>
        </div>
        <a class="button ghost" href="${resource.url}" target="_blank" rel="noreferrer">Open resource</a>
      </article>
    `;
  }

  async function render() {
    const mount = document.querySelector("[data-resources]");
    if (!mount) return;
    const resources = await window.FrontierUI.loadJson("../data/resources.json");
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const focus = summary.assessment.primaryFocus || "not_sure";
    const stage = String(summary.stage || 0);
    const matched = resources.filter((resource) => {
      return resource.stage.includes(stage) && (resource.focus.includes(focus) || resource.focus.includes("not_sure"));
    });
    const all = matched.length ? matched : resources;

    document.querySelector("[data-resource-context]").textContent = window.FrontierUI.hasAssessment()
      ? `Showing resources matched to ${summary.stageDefinition.name} and ${summary.focusLabel}.`
      : "Showing general readiness resources. Complete the assessment for a tailored list.";

    mount.innerHTML = all.map(card).join("");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
