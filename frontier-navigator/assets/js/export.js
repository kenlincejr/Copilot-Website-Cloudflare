(function () {
  function partnerName() {
    const input = document.querySelector("[data-partner-name]");
    return input && input.value.trim() ? input.value.trim() : "Partner";
  }

  function bdmName() {
    const input = document.querySelector("[data-bdm-name]");
    return input && input.value.trim() ? input.value.trim() : "";
  }

  function stageLine(summary) {
    return summary.enrolled ? summary.stageDefinition.name : "Not enrolled yet";
  }

  function nextLine(summary) {
    if (summary.stage >= 5) return "Keep Frontier Partner active";
    return summary.enrolled ? summary.nextStage.name : "Enroll in the program (free)";
  }

  function qualifyLine(pcs) {
    if (pcs.qualified) return "Qualifies on this estimate (70+ with every metric above zero)";
    const zeros = pcs.metrics.filter((m) => m.zero).map((m) => m.label);
    if (zeros.length) return `Not yet: ${zeros.join(", ")} at zero`;
    return `Not yet: ${pcs.pointsTo70} points to 70`;
  }

  function buildPlainReport() {
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const pcs = summary.pcs;
    const lines = [
      `${partnerName()} - Frontier Navigator Assessment`,
      `Assessment date: ${new Date().toLocaleDateString("en-US")}`,
      "",
      `Current stage: ${stageLine(summary)}`,
      `Scored solution area: ${pcs.areaLabel} (SMB track)`,
      `Estimated score: ${pcs.total}/100`,
      `Designation status: ${qualifyLine(pcs)}`,
      `Next milestone: ${nextLine(summary)}`,
      `BDM priority: ${summary.priority.label}`,
      "",
      "Score breakdown:",
      ...pcs.metrics.map((m) => `- ${m.label} (${m.category}): ${m.display}/${m.max}`),
      "",
      "What is blocking progress:",
      ...summary.gap.gaps.map((item) => `- ${item}`),
      "",
      "Recommended next actions:",
      ...summary.gap.actions.map((item, index) => `${index + 1}. ${item}`),
      "",
      "90-day roadmap:",
      ...summary.roadmap.flatMap((block) => [
        `${block.window}: ${block.title}`,
        ...block.actions.map((item) => `- ${item}`)
      ]),
      "",
      `Scoring rules checked against Microsoft Learn on ${summary.modelDate}. Estimates are directional; Partner Center is the official source of record.`
    ];
    return lines.join("\n");
  }

  function renderPreview() {
    const mount = document.querySelector("[data-export-preview]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const esc = window.FrontierUI.escapeHtml;
    window.FrontierUI.renderBars(document.querySelector("[data-export-bars]"), summary.pcs);
    document.querySelector("[data-export-score]").textContent = summary.pcs.total;
    document.querySelector("[data-export-area]").textContent = summary.pcs.areaLabel;
    document.querySelector("[data-export-stage]").textContent = stageLine(summary);
    document.querySelector("[data-export-qualify]").textContent = qualifyLine(summary.pcs);
    document.querySelector("[data-export-priority]").textContent = summary.priority.label;
    document.querySelector("[data-export-actions]").innerHTML = summary.gap.actions.map((item) => `<li>${esc(item)}</li>`).join("");
    const bdm = document.querySelector("[data-bdm-note]");
    if (bdm) {
      bdm.textContent = summary.assessment.hasBdm === "yes"
        ? "Send this to your TD SYNNEX BDM with the Email BDM button."
        : "No BDM on file: the email asks TD SYNNEX to route you to one.";
    }
  }

  function emailBdm() {
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const pcs = summary.pcs;
    const name = bdmName();
    const routed = summary.assessment.hasBdm !== "yes";
    const subject = `${partnerName()} - Frontier Navigator results${routed ? " (please route to a BDM)" : ""}`;
    const body = [
      name ? `Hi ${name},` : "Hello,",
      "",
      `${partnerName()} completed the TD SYNNEX Frontier Navigator assessment.${routed ? " We do not have a Business Development Manager assigned yet; please route this to the right person." : ""}`,
      "",
      "Quick summary:",
      `- Current stage: ${stageLine(summary)}`,
      `- ${pcs.areaLabel} score: ${pcs.total}/100 (${qualifyLine(pcs)})`,
      `- Next milestone: ${nextLine(summary)}`,
      `- Engagement priority: ${summary.priority.label}`,
      "",
      "Recommended next action:",
      summary.gap.actions[0],
      "",
      "The full report is available from the Frontier Navigator export page.",
      "",
      "Thanks,"
    ].join("\n");
    location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function slug(text) {
    return text.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "partner";
  }

  function init() {
    if (!document.querySelector("[data-export-preview]")) return;
    renderPreview();
    if (!window.FrontierUI.hasAssessment()) return;
    document.querySelector("[data-download-pdf]").addEventListener("click", () => window.print());
    document.querySelector("[data-email-bdm]").addEventListener("click", emailBdm);
    document.querySelector("[data-download-json]").addEventListener("click", () => {
      window.FrontierUI.download(`${slug(partnerName())}-frontier-navigator.json`, JSON.stringify(window.FrontierNavigator.loadAssessment(), null, 2));
    });
    document.querySelector("[data-download-text]").addEventListener("click", () => {
      window.FrontierUI.download(`${slug(partnerName())}-frontier-navigator.txt`, buildPlainReport(), "text/plain");
    });
  }

  window.FrontierExport = { buildPlainReport };
  document.addEventListener("DOMContentLoaded", init);
})();
