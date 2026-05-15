(function () {
  function checkedState(key) {
    try {
      return JSON.parse(localStorage.getItem(window.FrontierNavigator.ROADMAP_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveChecked(state) {
    localStorage.setItem(window.FrontierNavigator.ROADMAP_KEY, JSON.stringify(state));
  }

  function render() {
    const mount = document.querySelector("[data-roadmap]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const saved = checkedState();

    document.querySelector("[data-roadmap-score]").textContent = summary.pcs.total;
    document.querySelector("[data-roadmap-stage]").textContent = summary.stageDefinition.name;
    document.querySelector("[data-roadmap-focus]").textContent = summary.focusLabel;

    mount.innerHTML = summary.roadmap.map((block, blockIndex) => `
      <article class="timeline-item">
        <div class="timeline-window">${block.window}</div>
        <div class="panel">
          <h3>${block.title}</h3>
          <p>${block.outcome}</p>
          <ul class="checklist">
            ${block.actions.map((action, actionIndex) => {
              const id = `r-${blockIndex}-${actionIndex}`;
              return `
                <li>
                  <label>
                    <input type="checkbox" data-roadmap-check="${id}" ${saved[id] ? "checked" : ""}>
                    <span>${action}</span>
                  </label>
                </li>
              `;
            }).join("")}
          </ul>
        </div>
      </article>
    `).join("");

    document.querySelectorAll("[data-roadmap-check]").forEach((input) => {
      input.addEventListener("change", () => {
        const latest = checkedState();
        latest[input.dataset.roadmapCheck] = input.checked;
        saveChecked(latest);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
