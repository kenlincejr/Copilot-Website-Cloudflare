(function () {
  const esc = (v) => window.FrontierUI.escapeHtml(v);

  function card(resource) {
    const internal = /^https:\/\/copilotplaybook\.com\//.test(resource.url);
    return `
      <article class="resource-card">
        <div>
          <div class="resource-meta">
            <span class="tag">${esc(resource.type)}</span>
          </div>
          <h3 style="margin-top:10px;">${esc(resource.title)}</h3>
          <p>${esc(resource.description)}</p>
        </div>
        <a class="button ghost" href="${esc(resource.url)}"${internal ? "" : ' target="_blank" rel="noopener"'}>Open resource</a>
      </article>
    `;
  }

  async function render() {
    const mount = document.querySelector("[data-resources]");
    if (!mount) return;
    const resources = await window.FrontierUI.loadJson("../data/resources.json");
    const tailored = window.FrontierUI.hasAssessment();
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const focus = summary.pcs.area;
    const stage = String(summary.stage);
    const matched = tailored
      ? resources.filter((r) => r.stage.includes(stage) && r.focus.includes(focus))
      : resources;
    const list = matched.length ? matched : resources;

    document.querySelector("[data-resource-context]").textContent = tailored
      ? `Showing ${list.length} resources matched to ${summary.enrolled ? summary.stageDefinition.name : "partners not yet enrolled"} and ${summary.focusLabel}.`
      : "Showing every resource. Complete the assessment for a list matched to your stage and solution area.";

    mount.innerHTML = list.map(card).join("");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
