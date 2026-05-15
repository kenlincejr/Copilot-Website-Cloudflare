(function () {
  function partnerName() {
    const input = document.querySelector("[data-partner-name]");
    return input && input.value.trim() ? input.value.trim() : "Partner";
  }

  function bdmName() {
    const input = document.querySelector("[data-bdm-name]");
    return input && input.value.trim() ? input.value.trim() : "BDM";
  }

  function buildPlainReport() {
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const lines = [
      `${partnerName()} - Frontier Navigator Assessment`,
      `Assessment Date: ${new Date().toLocaleDateString()}`,
      "",
      `Current Stage: ${summary.stageDefinition.name}`,
      `Estimated PCS: ${summary.pcs.total}/100`,
      `Primary Focus: ${summary.focusLabel}`,
      `Next Milestone: ${summary.stage >= 5 ? "Maintain Frontier readiness" : summary.nextStage.name}`,
      `BDM Priority: ${summary.priority.label}`,
      "",
      "PCS Breakdown:",
      `- Performance: ${summary.pcs.breakdown.performance}/30`,
      `- Skilling: ${summary.pcs.breakdown.skilling}/30`,
      `- Usage Growth: ${summary.pcs.breakdown.usageGrowth}/25`,
      `- Deployments: ${summary.pcs.breakdown.deployments}/15`,
      "",
      "Top Gaps:",
      ...summary.gap.gaps.map((item) => `- ${item}`),
      "",
      "Recommended Next Actions:",
      ...summary.gap.actions.map((item, index) => `${index + 1}. ${item}`),
      "",
      "90-Day Roadmap:",
      ...summary.roadmap.flatMap((block) => [
        `${block.window}: ${block.title}`,
        ...block.actions.map((item) => `- ${item}`)
      ]),
      "",
      "Note: PCS estimates are directional. Partner Center remains the official source of record."
    ];
    return lines.join("\n");
  }

  function renderPreview() {
    const mount = document.querySelector("[data-export-preview]");
    if (!mount || !window.FrontierUI.requireAssessment()) return;
    const summary = window.FrontierNavigator.getAssessmentSummary();
    window.FrontierUI.renderBars(document.querySelector("[data-export-bars]"), summary.pcs);
    document.querySelector("[data-export-score]").textContent = summary.pcs.total;
    document.querySelector("[data-export-stage]").textContent = summary.stageDefinition.name;
    document.querySelector("[data-export-priority]").textContent = summary.priority.label;
    document.querySelector("[data-export-actions]").innerHTML = summary.gap.actions.map((item) => `<li>${item}</li>`).join("");
  }

  function downloadPdf() {
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const name = partnerName();
    const docLib = window.jspdf && window.jspdf.jsPDF;
    if (!docLib) {
      window.print();
      return;
    }

    const doc = new docLib({ unit: "pt", format: "letter" });
    const margin = 48;
    let y = 54;
    doc.setFillColor(0, 48, 87);
    doc.rect(0, 0, 612, 92, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Frontier Navigator Scorecard", margin, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${name} | ${new Date().toLocaleDateString()}`, margin, 62);

    y = 128;
    doc.setTextColor(0, 48, 87);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(`${summary.pcs.total}/100`, margin, y);
    doc.setFontSize(12);
    doc.text(`Current Stage: ${summary.stageDefinition.name}`, margin + 130, y - 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 92, 108);
    doc.text(`Next Milestone: ${summary.stage >= 5 ? "Maintain Frontier readiness" : summary.nextStage.name}`, margin + 130, y + 12);
    doc.text(`BDM Priority: ${summary.priority.label}`, margin + 130, y + 32);

    y += 76;
    doc.setTextColor(0, 48, 87);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PCS Breakdown", margin, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 35, 48);
    [
      `Performance: ${summary.pcs.breakdown.performance}/30`,
      `Skilling: ${summary.pcs.breakdown.skilling}/30`,
      `Usage Growth: ${summary.pcs.breakdown.usageGrowth}/25`,
      `Deployments: ${summary.pcs.breakdown.deployments}/15`
    ].forEach((line) => {
      doc.text(line, margin, y);
      y += 18;
    });

    y += 14;
    doc.setTextColor(0, 48, 87);
    doc.setFont("helvetica", "bold");
    doc.text("Top Actions", margin, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 35, 48);
    summary.gap.actions.forEach((action, index) => {
      const wrapped = doc.splitTextToSize(`${index + 1}. ${action}`, 500);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 15 + 6;
    });

    y += 10;
    doc.setTextColor(0, 48, 87);
    doc.setFont("helvetica", "bold");
    doc.text("90-Day Roadmap", margin, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 35, 48);
    summary.roadmap.forEach((block) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${block.window}: ${block.title}`, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      block.actions.forEach((action) => {
        const wrapped = doc.splitTextToSize(`- ${action}`, 500);
        doc.text(wrapped, margin + 12, y);
        y += wrapped.length * 14 + 4;
      });
      y += 4;
    });

    doc.setFontSize(8);
    doc.setTextColor(95, 107, 122);
    doc.text("Directional estimate only. Partner Center remains the official source of record.", margin, 760);
    doc.save(`${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-frontier-scorecard.pdf`);
  }

  function emailBdm() {
    const summary = window.FrontierNavigator.getAssessmentSummary();
    const subject = `${partnerName()} - Frontier Navigator Assessment Results`;
    const body = [
      `Hi ${bdmName()},`,
      "",
      `${partnerName()} completed the TD SYNNEX Frontier Navigator assessment.`,
      "",
      "Quick Summary:",
      `- Current Stage: ${summary.stageDefinition.name}`,
      `- Estimated PCS: ${summary.pcs.total} points`,
      `- Primary Focus: ${summary.focusLabel}`,
      `- Engagement Priority: ${summary.priority.label}`,
      "",
      "Recommended Next Action:",
      summary.gap.actions[0],
      "",
      "Full report can be downloaded from the Frontier Navigator export page.",
      "",
      "Thanks,"
    ].join("\n");
    location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function init() {
    if (!document.querySelector("[data-export-preview]")) return;
    renderPreview();
    document.querySelector("[data-download-pdf]").addEventListener("click", downloadPdf);
    document.querySelector("[data-email-bdm]").addEventListener("click", emailBdm);
    document.querySelector("[data-download-json]").addEventListener("click", () => {
      window.FrontierUI.download("frontier-navigator-assessment.json", JSON.stringify(window.FrontierNavigator.loadAssessment(), null, 2));
    });
    document.querySelector("[data-download-text]").addEventListener("click", () => {
      window.FrontierUI.download("frontier-navigator-report.txt", buildPlainReport(), "text/plain");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
