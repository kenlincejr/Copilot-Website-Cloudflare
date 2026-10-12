(function () {
  // Checkmarks are keyed by the action text, not its position, so a plan that
  // changes after the assessment is edited never carries a tick onto a
  // different task.
  function keyFor(text) {
    let h = 0;
    for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
    return `a${(h >>> 0).toString(36)}`;
  }

  function checkedState() {
    try {
      return JSON.parse(localStorage.getItem(window.FrontierNavigator.ROADMAP_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveChecked(state) {
    try {
      localStorage.setItem(window.FrontierNavigator.ROADMAP_KEY, JSON.stringify(state));
    } catch (error) {
      /* storage blocked: ticks last for this visit only */
    }
  }

  function updateProgress() {
    const boxes = Array.from(document.querySelectorAll("[data-roadmap-check]"));
    const done = boxes.filter((b) => b.checked).length;
    const fill = document.querySelector("[data-roadmap-fill]");
    const count = document.querySelector("[data-roadmap-count]");
    if (fill) fill.style.setProperty("--w", `${boxes.length ? Math.round((done / boxes.length) * 100) : 0}%`);
    if (count) count.textContent = `${done} of ${boxes.length} done`;
  }

  function render() {
    const mount = document.querySelector("[data-roadmap]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const saved = checkedState();
    const esc = window.FrontierUI.escapeHtml;

    document.querySelector("[data-roadmap-score]").textContent = summary.pcs.total;
    document.querySelector("[data-roadmap-stage]").textContent = summary.stageDefinition.name;
    document.querySelector("[data-roadmap-focus]").textContent = summary.focusLabel;

    mount.innerHTML = summary.roadmap.map((block) => `
      <article class="timeline-item">
        <div class="timeline-window">${esc(block.window)}</div>
        <div class="panel">
          <h3>${esc(block.title)}</h3>
          <p>${esc(block.outcome)}</p>
          <ul class="checklist">
            ${block.actions.map((action) => {
              const id = keyFor(action);
              return `
                <li>
                  <label>
                    <input type="checkbox" data-roadmap-check="${id}" ${saved[id] ? "checked" : ""}>
                    <span>${esc(action)}</span>
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
        updateProgress();
      });
    });
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", render);
})();
