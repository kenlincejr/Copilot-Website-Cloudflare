(function () {
  const esc = (v) => window.FrontierUI.escapeHtml(v);

  function qualifyPill(pcs) {
    if (pcs.qualified) return { text: "Qualifies on this estimate", tone: "success" };
    if (pcs.exact >= window.FrontierNavigator.THRESHOLD) return { text: "70+ but a metric is at zero", tone: "danger" };
    return { text: `${pcs.pointsTo70} points to 70`, tone: "warning" };
  }

  function ringColor(pcs) {
    if (pcs.qualified) return "var(--teal)";
    if (pcs.metrics.some((m) => m.zero)) return "var(--red)";
    return "var(--amber)";
  }

  function renderWhatIf(summary) {
    const F = window.FrontierNavigator;
    const mount = document.querySelector("[data-levers]");
    if (!mount) return;
    const base = summary.assessment;
    const levers = summary.levers;
    const extra = {};
    const gates = {};

    mount.innerHTML = levers.map((l) => {
      const span = Math.max(1, l.unitsToMax);
      return `
        <div class="lever">
          <label for="lever-${l.id}">${esc(l.label)}</label>
          <input type="range" id="lever-${l.id}" min="0" max="${span}" step="1" value="0" data-lever="${l.id}" ${l.unitsToMax === 0 ? "disabled" : ""}
            aria-valuetext="0 more">
          <output data-lever-out="${l.id}">${l.unitsToMax === 0 ? "max" : "+0"}</output>
          ${l.gateMet ? "" : `<label class="gate-toggle"><input type="checkbox" data-gate="${l.id}"> Add ${esc(l.gateText.replace(/^at least /, ""))} (unlocks this metric)</label>`}
        </div>
      `;
    }).join("");

    function update() {
      const projected = Object.assign({}, base);
      levers.forEach((l) => {
        projected[l.key] = String(l.current + (extra[l.id] || 0));
        if (gates[l.id]) l.gateKeys.forEach((k) => { if (!(Number(projected[k]) >= 1)) projected[k] = "1"; });
      });
      const pcs = F.calculatePCS(projected);
      const delta = pcs.total - summary.pcs.total;
      document.querySelector("[data-whatif-score]").textContent = pcs.total;
      document.querySelector("[data-whatif-delta]").textContent = delta > 0 ? `+${delta} points` : "";
      const blocked = pcs.metrics.filter((m) => m.zero);
      document.querySelector("[data-whatif-note]").textContent = pcs.qualified
        ? "That plan qualifies."
        : blocked.length
          ? `Still blocked: ${blocked.map((m) => m.label.toLowerCase()).join(", ")} at zero.`
          : `${pcs.pointsTo70} points short of 70.`;
    }

    mount.querySelectorAll("[data-lever]").forEach((input) => {
      input.addEventListener("input", () => {
        extra[input.dataset.lever] = Number(input.value);
        const out = mount.querySelector(`[data-lever-out="${input.dataset.lever}"]`);
        out.textContent = `+${input.value}`;
        input.setAttribute("aria-valuetext", `${input.value} more`);
        update();
      });
    });
    mount.querySelectorAll("[data-gate]").forEach((box) => {
      box.addEventListener("change", () => {
        gates[box.dataset.gate] = box.checked;
        update();
      });
    });
    document.querySelector("[data-whatif-reset]").addEventListener("click", () => {
      mount.querySelectorAll("[data-gate]").forEach((box) => { box.checked = false; gates[box.dataset.gate] = false; });
      mount.querySelectorAll("[data-lever]").forEach((input) => {
        input.value = "0";
        extra[input.dataset.lever] = 0;
        const out = mount.querySelector(`[data-lever-out="${input.dataset.lever}"]`);
        if (!input.disabled) out.textContent = "+0";
      });
      update();
    });
    update();
  }

  function render() {
    const root = document.querySelector("[data-results-root]");
    if (!root || !window.FrontierUI.requireAssessment()) return;

    const summary = window.FrontierNavigator.getAssessmentSummary();
    const pcs = summary.pcs;
    window.FrontierUI.renderStageMap(document.querySelector("[data-stage-map]"), summary.stage);
    window.FrontierUI.renderBars(document.querySelector("[data-score-bars]"), pcs);

    const ring = document.querySelector("[data-score-ring]");
    ring.style.setProperty("--ring-color", ringColor(pcs));
    ring.style.setProperty("--score", pcs.total);
    window.FrontierUI.countUp(document.querySelector("[data-score-number]"), pcs.total);
    document.querySelector("[data-score-caption]").textContent = `${pcs.areaLabel} points`;

    document.querySelector("[data-stage-name]").textContent = summary.enrolled
      ? summary.stageDefinition.name
      : "Not enrolled yet";
    document.querySelector("[data-next-stage]").textContent = summary.stage >= 5
      ? "Keep Frontier Partner active"
      : summary.enrolled ? summary.nextStage.name : "Enroll in the program (free)";

    const q = qualifyPill(pcs);
    const qEl = document.querySelector("[data-qualify]");
    qEl.textContent = q.text;
    qEl.className = `status-pill ${q.tone}`;
    const pEl = document.querySelector("[data-priority]");
    pEl.textContent = `${summary.priority.label} priority`;
    pEl.className = `status-pill ${summary.priority.tone}`;
    document.querySelector("[data-priority-detail]").textContent = summary.priority.detail;

    document.querySelector("[data-gaps]").innerHTML = summary.gap.gaps.map((gap) => `<li>${esc(gap)}</li>`).join("");
    document.querySelector("[data-actions]").innerHTML = summary.gap.actions.map((action) => `<li>${esc(action)}</li>`).join("");
    document.querySelector("[data-model-date]").textContent = summary.modelDate;

    const goal = summary.assessment.goal12Mo;
    const showCopilot = summary.stage < 3 && (goal === "copilot_spec" || goal === "frontier_spec");
    const showFrontier = summary.stage < 5 && goal === "frontier_spec";
    if (showCopilot || showFrontier) {
      document.querySelector("[data-readiness]").hidden = false;
      if (showCopilot) {
        document.querySelector("[data-copilot-panel]").hidden = false;
        window.FrontierUI.renderChecklist(document.querySelector("[data-copilot-checks]"), summary.copilot);
      }
      if (showFrontier) {
        document.querySelector("[data-frontier-panel]").hidden = false;
        window.FrontierUI.renderChecklist(document.querySelector("[data-frontier-checks]"), summary.frontier);
      }
      if (showCopilot !== showFrontier) document.querySelector("[data-readiness]").classList.remove("two");
    }

    renderWhatIf(summary);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
