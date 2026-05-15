(function () {
  const STORAGE_KEY = "frontierNavigatorAssessment";
  const ROADMAP_KEY = "frontierNavigatorRoadmap";

  const stageDefinitions = [
    {
      id: 0,
      name: "Registered",
      shortName: "Registered",
      cost: "$0-$475/yr",
      unlocks: "Partner Center access, basic benefits, early enablement",
      requirement: "Join MAICPP and establish Partner Center basics"
    },
    {
      id: 1,
      name: "Partner Launch",
      shortName: "Launch",
      cost: "$350/yr",
      unlocks: "Launch benefits, Azure credits, product access",
      requirement: "Purchase Partner Launch Benefits or comparable starter package"
    },
    {
      id: 2,
      name: "Solutions Partner",
      shortName: "Designation",
      cost: "$4,875/yr",
      unlocks: "Logo usage, co-sell access, advanced incentives",
      requirement: "Earn 70+ PCS points in one solution area"
    },
    {
      id: 3,
      name: "Second Designation",
      shortName: "Dual Path",
      cost: "+$4,875/yr",
      unlocks: "Broader go-to-market and Copilot specialization eligibility",
      requirement: "Earn 70+ PCS points in a second solution area"
    },
    {
      id: 4,
      name: "Copilot Specialization",
      shortName: "Specialized",
      cost: "No direct fee",
      unlocks: "Marketplace differentiation and customer proof leverage",
      requirement: "Solutions Partner status plus deployment proof and attestations"
    },
    {
      id: 5,
      name: "Frontier Partner",
      shortName: "Frontier",
      cost: "Elite path",
      unlocks: "Maximum co-sell priority, field co-marketing, elite status",
      requirement: "Multiple designations, specializations, and advanced AI readiness"
    }
  ];

  function numberValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function calculatePCS(inputs) {
    const answers = inputs || {};
    const netAdds = numberValue(answers.newCustomers12Mo);
    const intermediateCerts = numberValue(answers.intermediateCerts);
    const advancedCerts = numberValue(answers.advancedCerts);
    const deployments = Array.isArray(answers.deploymentsChecked) ? answers.deploymentsChecked : [];

    let performance = 0;
    if (netAdds >= 10) performance = 30;
    else if (netAdds >= 7) performance = 25;
    else if (netAdds >= 5) performance = 20;
    else if (netAdds >= 3) performance = 15;
    else if (netAdds >= 1) performance = 10;

    const skilling = Math.min(30, intermediateCerts * 5 + advancedCerts * 10);

    let usageGrowth = 0;
    if (answers.acrGrowthPercent === "50%+") usageGrowth = 25;
    else if (answers.acrGrowthPercent === "25-50%") usageGrowth = 20;
    else if (answers.acrGrowthPercent === "10-25%") usageGrowth = 15;
    else if (answers.acrGrowthPercent === "1-10%") usageGrowth = 10;

    let deploymentPoints = 0;
    if (deployments.length >= 5) deploymentPoints = 15;
    else if (deployments.length >= 3) deploymentPoints = 12;
    else if (deployments.length >= 2) deploymentPoints = 8;
    else if (deployments.length >= 1) deploymentPoints = 5;

    const total = performance + skilling + usageGrowth + deploymentPoints;

    return {
      total,
      breakdown: {
        performance,
        skilling,
        usageGrowth,
        deployments: deploymentPoints
      },
      max: {
        performance: 30,
        skilling: 30,
        usageGrowth: 25,
        deployments: 15
      }
    };
  }

  function determineStage(inputs, score) {
    const answers = inputs || {};
    const designation = answers.designation || "none";
    const deployments = Array.isArray(answers.deploymentsChecked) ? answers.deploymentsChecked : [];
    const cases = answers.caseStudies || "none";
    const hasProof = cases === "two_three" || cases === "four_plus";
    const hasCopilot = deployments.includes("copilot_m365");

    if (answers.currentTier === "frontier") return 5;
    if (designation === "multiple" && hasProof && hasCopilot && score >= 80) return 4;
    if (designation === "multiple") return 3;
    if (designation !== "none" || answers.currentTier === "solutions_partner") return 2;
    if (answers.currentTier === "partner_launch") return 1;
    if (score >= 70) return 2;
    if (score >= 40) return 1;
    return 0;
  }

  function nextStageFor(stage) {
    return stageDefinitions[Math.min(stage + 1, stageDefinitions.length - 1)];
  }

  function priorityFromScore(score) {
    if (score >= 60 && score < 70) return { label: "High", tone: "success", detail: "Close to designation. BDM should prioritize a funded certification or deployment-proof push." };
    if (score >= 40) return { label: "Medium", tone: "warning", detail: "Good foundation. Best next step is a structured enablement session and score-building sprint." };
    return { label: "Foundational", tone: "danger", detail: "Needs self-service readiness, Partner Center basics, and first customer/deployment motions." };
  }

  function formatFocus(focus) {
    const map = {
      modern_work: "Modern Work",
      security: "Security",
      azure: "Azure",
      business_apps: "Business Applications",
      not_sure: "Not sure"
    };
    return map[focus] || "Modern Work";
  }

  function recommendedCertification(focus) {
    if (focus === "security") return "SC-200 or AZ-500";
    if (focus === "azure") return "AZ-305";
    return "MS-700";
  }

  function buildGapAnalysis(inputs, pcs) {
    const answers = inputs || {};
    const gaps = [];
    const actions = [];
    const scoreGap = Math.max(0, 70 - pcs.total);
    const advancedCerts = numberValue(answers.advancedCerts);
    const netAdds = numberValue(answers.newCustomers12Mo);
    const deployments = Array.isArray(answers.deploymentsChecked) ? answers.deploymentsChecked : [];
    const focus = answers.primaryFocus || "modern_work";

    if (scoreGap > 0) {
      gaps.push(`You need ${scoreGap} more estimated PCS points to reach the 70-point Solutions Partner threshold.`);
    } else {
      gaps.push("You are estimated at or above the 70-point threshold. Validate the official score in Partner Center before applying.");
    }

    if (pcs.breakdown.skilling < 30) {
      const needed = Math.ceil((30 - pcs.breakdown.skilling) / 10);
      gaps.push(`Skilling is not maxed. ${needed} additional advanced certification${needed === 1 ? "" : "s"} could close much of the gap.`);
      actions.push(`Certify ${needed} more team member${needed === 1 ? "" : "s"} in ${recommendedCertification(focus)}.`);
    }

    if (netAdds < 5) {
      const neededAdds = Math.max(1, 5 - netAdds);
      gaps.push(`Performance needs more qualifying SMB customer adds. Target ${neededAdds} additional customer${neededAdds === 1 ? "" : "s"} with at least $500/month Azure spend.`);
      actions.push(`Add ${neededAdds} qualifying Azure customer${neededAdds === 1 ? "" : "s"} and confirm PAL association.`);
    }

    if (deployments.length < 3) {
      const neededDeployments = 3 - deployments.length;
      gaps.push(`Deployment proof is light. Document ${neededDeployments} more qualifying deployment${neededDeployments === 1 ? "" : "s"} in Partner Center.`);
      actions.push(`Package ${neededDeployments} Copilot, Defender, Intune, AVD, or Azure Migrate deployment${neededDeployments === 1 ? "" : "s"} with customer evidence.`);
    }

    if (answers.mciEnrolled !== "yes") {
      gaps.push("MCI enrollment is not confirmed, which can delay incentive realization after designation.");
      actions.push("Confirm Microsoft Commerce Incentives enrollment before applying for designation benefits.");
    }

    if (advancedCerts === 0 && actions.length < 3) {
      actions.push(`Start with one advanced role-based certification in ${recommendedCertification(focus)}.`);
    }

    while (actions.length < 3) {
      if (actions.length === 0) actions.push("Validate the official PCS dashboard and reconcile any Partner Center association issues.");
      else if (actions.length === 1) actions.push("Create one customer proof packet for a recent deployment and attach outcome metrics.");
      else actions.push("Schedule a TD SYNNEX readiness review to confirm the best designation path.");
    }

    return {
      gaps,
      actions: actions.slice(0, 3),
      pointsTo70: scoreGap
    };
  }

  function buildRoadmap(inputs, pcs) {
    const answers = inputs || {};
    const focus = answers.primaryFocus || "modern_work";
    const cert = recommendedCertification(focus);
    const gap = buildGapAnalysis(answers, pcs);
    const scoreGap = gap.pointsTo70;

    return [
      {
        window: "Days 1-30",
        title: "Foundation",
        outcome: scoreGap > 0 ? "Create a clean path to the next 10-20 PCS points." : "Validate eligibility and prepare proof for the next milestone.",
        actions: [
          `Confirm Partner Center association across every active customer subscription.`,
          `Assign one certification owner and schedule ${cert} study and exam dates.`,
          "Inventory all deployments from the last 12 months and flag missing customer proof."
        ]
      },
      {
        window: "Days 31-60",
        title: "Growth",
        outcome: "Move from assessment insight to measurable PCS movement.",
        actions: [
          "Close or expand at least two qualifying Azure customer opportunities.",
          `Complete one advanced certification tied to ${formatFocus(focus)}.`,
          "Package one deployment as a reusable customer proof packet with outcome metrics."
        ]
      },
      {
        window: "Days 61-90",
        title: "Acceleration",
        outcome: pcs.total >= 60 ? "Prepare for designation application or specialization readiness review." : "Create a second-quarter sprint to reach designation range.",
        actions: [
          "Re-check the official Partner Capability Score dashboard and reconcile discrepancies.",
          "Confirm MCI enrollment, benefits activation, and co-sell readiness.",
          "Meet with TD SYNNEX to select the next designation, specialization, or Frontier-track motion."
        ]
      }
    ];
  }

  function loadAssessment() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveAssessment(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
  }

  function getAssessmentSummary() {
    const assessment = loadAssessment();
    const pcs = calculatePCS(assessment);
    const stage = determineStage(assessment, pcs.total);
    const gap = buildGapAnalysis(assessment, pcs);
    const roadmap = buildRoadmap(assessment, pcs);
    return {
      assessment,
      pcs,
      stage,
      stageDefinition: stageDefinitions[stage],
      nextStage: nextStageFor(stage),
      gap,
      roadmap,
      priority: priorityFromScore(pcs.total),
      focusLabel: formatFocus(assessment.primaryFocus || "modern_work")
    };
  }

  window.FrontierNavigator = {
    STORAGE_KEY,
    ROADMAP_KEY,
    stageDefinitions,
    calculatePCS,
    determineStage,
    nextStageFor,
    priorityFromScore,
    formatFocus,
    recommendedCertification,
    buildGapAnalysis,
    buildRoadmap,
    loadAssessment,
    saveAssessment,
    getAssessmentSummary
  };
})();
