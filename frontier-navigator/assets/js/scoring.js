/* Frontier Navigator scoring engine, model v2.
   Grounded in research/partner-program-journey/13-frontier-navigator-fact-audit.md
   (Microsoft Learn pages fetched 2026-10-12). Every point value below traces to
   that file's section 2.2; every stage cost and requirement to its section 3.
   SMB track only. For Modern Work and Security, Microsoft also scores an
   Enterprise track and counts whichever solution-area total is higher.
   Runs in the browser and in a bare Node vm (tools/test-frontier-navigator.js). */
(function (root) {
  const STORAGE_KEY = "frontierNavigatorAssessment";
  const ROADMAP_KEY = "frontierNavigatorRoadmap";
  const SCHEMA = 2;
  const MODEL_DATE = "October 12, 2026";
  const THRESHOLD = 70;
  const DESIGNATION_FEE = "$4,875/yr";

  const stageDefinitions = [
    {
      id: 0,
      name: "MAICPP Member",
      shortName: "Member",
      cost: "$0",
      unlocks: "Partner Center, PartnerID, training, and the option to buy a benefits package or enroll as a CSP indirect reseller",
      requirement: "Enroll at partner.microsoft.com and pass verification (typically 3-5 business days)"
    },
    {
      id: 1,
      name: "Benefits Package",
      shortName: "Package",
      cost: "$350 Launch / $925 Core / $4,125 Expanded per year",
      unlocks: "Internal-use licenses and Azure credits; Expanded adds 10 Microsoft 365 Copilot seats",
      requirement: "Optional. Buy in Partner Center; not required for a designation"
    },
    {
      id: 2,
      name: "Solutions Partner",
      shortName: "Designation",
      cost: "$4,875/yr, covers every designation you qualify for",
      unlocks: "Designation badge, 50 cloud support incidents, 50 advisory hours, product benefits, specialization eligibility",
      requirement: "70+ of 100 points in one solution area with every metric above zero, then purchase"
    },
    {
      id: 3,
      name: "Microsoft 365 Copilot Specialization",
      shortName: "Copilot",
      cost: "No program fee; third-party audit about $2,700",
      unlocks: "Specialization badge and incremental benefits",
      requirement: "Modern Work, Business Applications, or Security designation; 1,000 Copilot MAU growth and 5 customers at 5+ MAU; 5 SC-401 and 5 AB-620 or AB-100 holders; audit"
    },
    {
      id: 4,
      name: "Frontier Prerequisites",
      shortName: "Prereqs",
      cost: "No program fee; one audit per specialization",
      unlocks: "Eligibility to apply for the Frontier Partner specialization",
      requirement: "Data Security and Identity and Access Management, plus AI Apps or AI Platform on Azure, alongside Copilot"
    },
    {
      id: 5,
      name: "Frontier Partner Specialization",
      shortName: "Frontier",
      cost: "No program fee; third-party audit about $4,000",
      unlocks: "Frontier specialization badge, Frontier-aligned co-sell, Agent pre-purchase credits, Microsoft 365 E7 licensing, Concierge support",
      requirement: "All four prerequisite specializations; 5 Frontier Transformation Engineer Titan badges; 3 DP-600 holders; audit"
    }
  ];

  const DESIGNATIONS = {
    modern_work: "Modern Work",
    security: "Security",
    data_ai: "Data & AI (Azure)",
    digital_app: "Digital & App Innovation (Azure)",
    infrastructure: "Infrastructure (Azure)",
    business_apps: "Business Applications"
  };

  const COPILOT_ELIGIBLE = ["modern_work", "business_apps", "security"];

  function n(value) {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    const s = String(value ?? "").trim();
    return /^\d+$/.test(s) ? Number(s) : 0;
  }

  function cap(points, max) {
    return Math.min(max, Math.max(0, points));
  }

  // Each metric: id, category, label, max, points(a), and the lever the
  // what-if simulator moves (key, unit, perUnit, unitsForMax). A gate entry
  // means the metric scores nothing beyond its gate until the gate is met.
  const AREAS = {
    modern_work: {
      label: "Modern Work",
      cert: { intermediate: "MS-700, MD-102, or SC-300", advanced: "MS-102 (retires November 30, 2026; points count through November 30, 2027)" },
      netAddRule: "customer tenants with 11 to 300 paid licenses on an eligible Microsoft 365 workload",
      metrics: [
        { id: "netAdds", category: "Performance", label: "Net customer adds", max: 20, key: "mw_netAdds", unit: "customer", perUnit: 2, unitsForMax: 10,
          points: (a) => cap(2 * n(a.mw_netAdds), 20) },
        { id: "intermediate", category: "Skilling", label: "Intermediate certifications", max: 10, key: "mw_intPeople", unit: "certified person", perUnit: 5, unitsForMax: 2,
          points: (a) => cap(5 * n(a.mw_intPeople), 10) },
        { id: "advanced", category: "Skilling", label: "Advanced certifications", max: 15, key: "mw_advPeople", unit: "certified person", perUnit: 15, unitsForMax: 1,
          points: (a) => cap(15 * n(a.mw_advPeople), 15) },
        { id: "usage", category: "Customer success", label: "Usage growth (MAU)", max: 30, key: "mw_mauGrowth", unit: "active user",
          perUnit: (a) => (a.mw_association === "cpor" ? 30 / 500 : 30 / 2000), unitsForMax: (a) => (a.mw_association === "cpor" ? 500 : 2000),
          points: (a) => cap(n(a.mw_mauGrowth) * (a.mw_association === "cpor" ? 30 / 500 : 30 / 2000), 30) },
        { id: "deployments", category: "Customer success", label: "Deployments (40% active)", max: 25, key: "mw_deployments", unit: "deployment",
          perUnit: (a) => (a.mw_association === "cpor" ? 5 : 2.5), unitsForMax: (a) => (a.mw_association === "cpor" ? 5 : 10),
          points: (a) => cap(n(a.mw_deployments) * (a.mw_association === "cpor" ? 5 : 2.5), 25) }
      ]
    },
    security: {
      label: "Security",
      cert: { intermediate: "SC-500 and SC-200 first (gates), then SC-401, SC-300, or SC-100", advanced: "", step3: "SC-401, SC-300, or SC-100" },
      netAddRule: "customers with 5 to 300 paid licenses on a security workload, or $600+ security Azure spend over 12 months",
      metrics: [
        { id: "netAdds", category: "Performance", label: "Net customer adds", max: 20, key: "sec_netAdds", unit: "customer", perUnit: 4, unitsForMax: 5,
          points: (a) => cap(4 * n(a.sec_netAdds), 20) },
        { id: "skilling", category: "Skilling", label: "Skilling (gated steps)", max: 40, key: "sec_step3", unit: "Step 3 certified person", perUnit: 8, unitsForMax: 4,
          gatePoints: 8, gateKeys: ["sec_sc500", "sec_sc200"], gate: (a) => n(a.sec_sc500) >= 1 && n(a.sec_sc200) >= 1,
          gateText: (a) => missingGates([[n(a.sec_sc500), "one SC-500 holder"], [n(a.sec_sc200), "one SC-200 holder"]]),
          points: (a) => {
            const step1 = n(a.sec_sc500) >= 1 ? 4 : 0;
            const step2 = n(a.sec_sc200) >= 1 ? 4 : 0;
            const step3 = step1 && step2 ? 8 * Math.min(4, n(a.sec_step3)) : 0;
            return cap(step1 + step2 + step3, 40);
          } },
        { id: "usage", category: "Customer success", label: "Usage growth (protected users)", max: 20, key: "sec_userGrowth", unit: "protected user", perUnit: 1 / 50, unitsForMax: 1000,
          points: (a) => cap(n(a.sec_userGrowth) / 50, 20) },
        { id: "deployments", category: "Customer success", label: "Deployments (15% active)", max: 20, key: "sec_deployments", unit: "deployment", perUnit: 20 / 6, unitsForMax: 6,
          points: (a) => cap(n(a.sec_deployments) * (20 / 6), 20) }
      ]
    },
    data_ai: {
      label: "Data & AI (Azure)",
      cert: { intermediate: "AZ-104 and AZ-305 first (gates), then DP-600, DP-700, or another Data & AI associate certification", advanced: "", step3: "DP-600, DP-700, or another Data & AI associate certification" },
      netAddRule: "customers with $500+ Azure consumed revenue in at least one of the last two months",
      metrics: [
        { id: "netAdds", category: "Performance", label: "Net customer adds", max: 30, key: "dai_netAdds", unit: "customer", perUnit: 10, unitsForMax: 3,
          points: (a) => cap(10 * n(a.dai_netAdds), 30) },
        { id: "skilling", category: "Skilling", label: "Skilling (gated steps)", max: 40, key: "dai_people", unit: "Data & AI certified person", perUnit: 4, unitsForMax: 8,
          gatePoints: 8, gateKeys: ["dai_az104", "dai_az305"], gate: (a) => n(a.dai_az104) >= 1 && n(a.dai_az305) >= 1,
          gateText: (a) => missingGates([[n(a.dai_az104), "one AZ-104 holder"], [n(a.dai_az305), "one AZ-305 holder"]]),
          points: (a) => {
            const g1 = n(a.dai_az104) >= 1 ? 4 : 0;
            const g2 = n(a.dai_az305) >= 1 ? 4 : 0;
            return cap(g1 + g2 + (g1 && g2 ? 4 * Math.min(8, n(a.dai_people)) : 0), 40);
          } },
        { id: "usage", category: "Customer success", label: "Usage growth (ACR %)", max: 20, key: "dai_acrGrowth", unit: "percentage point", perUnit: 1, unitsForMax: 20,
          points: (a) => cap(n(a.dai_acrGrowth), 20) },
        { id: "deployments", category: "Customer success", label: "Deployments (Azure services)", max: 10, key: "dai_services", unit: "Azure service", perUnit: 2, unitsForMax: 5,
          points: (a) => cap(2 * n(a.dai_services), 10) }
      ]
    },
    digital_app: azureTwoTier("dapp", "Digital & App Innovation (Azure)",
      "GitHub Copilot, Power Platform Developer, or Azure AI Cloud Developer", "Azure DevOps Engineer Expert, Power Platform Solution Architect Expert, or a GitHub advanced certification"),
    infrastructure: azureTwoTier("infra", "Infrastructure (Azure)",
      "Azure Network Engineer or Windows Server Hybrid Administrator", "Azure Virtual Desktop Specialty or Azure for SAP Workloads Specialty"),
    business_apps: {
      label: "Business Applications",
      cert: { intermediate: "Power Platform Developer, Intelligent Applications Builder, or another Dynamics 365 / Power Platform associate", advanced: "AB-100 (Agentic AI Business Solutions Architect), which also counts toward the Copilot specialization" },
      netAddRule: "workloads per customer tenant with $250+ revenue in a month",
      metrics: [
        { id: "netAdds", category: "Performance", label: "Net customer adds (workloads)", max: 15, key: "ba_netAdds", unit: "workload", perUnit: 3, unitsForMax: 5,
          points: (a) => cap(3 * n(a.ba_netAdds), 15) },
        { id: "intermediate", category: "Skilling", label: "Intermediate certifications", max: 20, key: "ba_intPeople", unit: "certified person", perUnit: 4, unitsForMax: 5,
          points: (a) => cap(4 * n(a.ba_intPeople), 20) },
        { id: "advanced", category: "Skilling", label: "Advanced certifications", max: 15, key: "ba_advPeople", unit: "certified person", perUnit: 7.5, unitsForMax: 2,
          points: (a) => cap(7.5 * n(a.ba_advPeople), 15) },
        { id: "usage", category: "Customer success", label: "Usage growth (MCV %)", max: 30, key: "ba_mcvGrowth", unit: "percentage point", perUnit: 1, unitsForMax: 30,
          points: (a) => cap(n(a.ba_mcvGrowth), 30) },
        { id: "deployments", category: "Customer success", label: "Deployments (5,000+ MCV)", max: 20, key: "ba_deployments", unit: "workload deployment", perUnit: 4, unitsForMax: 5,
          points: (a) => cap(4 * n(a.ba_deployments), 20) }
      ]
    }
  };

  function azureTwoTier(p, label, intCerts, advCerts) {
    return {
      label,
      cert: { intermediate: `AZ-104 first (gate), then ${intCerts}`, advanced: `AZ-305 first (gate), then ${advCerts}`, intermediateStep: intCerts, advancedStep: advCerts },
      netAddRule: "customers with $500+ Azure consumed revenue in at least one of the last two months",
      metrics: [
        { id: "netAdds", category: "Performance", label: "Net customer adds", max: 30, key: `${p}_netAdds`, unit: "customer", perUnit: 10, unitsForMax: 3,
          points: (a) => cap(10 * n(a[`${p}_netAdds`]), 30) },
        { id: "intermediate", category: "Skilling", label: "Intermediate certifications", max: 20, key: `${p}_intPeople`, unit: "certified person", perUnit: 4, unitsForMax: 4,
          gatePoints: 4, gateKeys: [`${p}_az104`], gate: (a) => n(a[`${p}_az104`]) >= 1, gateText: "at least one AZ-104 holder",
          points: (a) => (n(a[`${p}_az104`]) >= 1 ? cap(4 + 4 * Math.min(4, n(a[`${p}_intPeople`])), 20) : 0) },
        { id: "advanced", category: "Skilling", label: "Advanced certifications", max: 20, key: `${p}_advPeople`, unit: "certified person", perUnit: 4, unitsForMax: 4,
          gatePoints: 4, gateKeys: [`${p}_az305`], gate: (a) => n(a[`${p}_az305`]) >= 1, gateText: "at least one AZ-305 holder",
          points: (a) => (n(a[`${p}_az305`]) >= 1 ? cap(4 + 4 * Math.min(4, n(a[`${p}_advPeople`])), 20) : 0) },
        { id: "usage", category: "Customer success", label: "Usage growth (ACR %)", max: 20, key: `${p}_acrGrowth`, unit: "percentage point", perUnit: 1, unitsForMax: 20,
          points: (a) => cap(n(a[`${p}_acrGrowth`]), 20) },
        { id: "deployments", category: "Customer success", label: "Deployments (Azure services)", max: 10, key: `${p}_services`, unit: "Azure service", perUnit: 2, unitsForMax: 5,
          points: (a) => cap(2 * n(a[`${p}_services`]), 10) }
      ]
    };
  }

  function missingGates(list) {
    const missing = list.filter(([have]) => have < 1).map(([, label]) => label);
    return missing.length ? `at least ${missing.join(" and ")}` : "";
  }

  function resolve(v, a) {
    return typeof v === "function" ? v(a) : v;
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function areaFor(answers) {
    const a = answers || {};
    return AREAS[a.targetArea] ? a.targetArea : "modern_work";
  }

  function calculatePCS(inputs) {
    const a = inputs || {};
    const areaId = areaFor(a);
    const area = AREAS[areaId];
    const metrics = area.metrics.map((m) => {
      const points = m.points(a);
      const perUnit = resolve(m.perUnit, a);
      const unitsForMax = resolve(m.unitsForMax, a);
      const gateMet = m.gate ? m.gate(a) : true;
      return {
        id: m.id,
        category: m.category,
        label: m.label,
        key: m.key,
        unit: m.unit,
        max: m.max,
        points,
        display: round1(points),
        input: n(a[m.key]),
        perUnit,
        unitsForMax,
        gateMet,
        gateText: resolve(m.gateText, a) || "",
        gateKeys: m.gateKeys || [],
        zero: points <= 0
      };
    });
    const exact = metrics.reduce((sum, m) => sum + m.points, 0);
    const allNonZero = metrics.every((m) => !m.zero);
    // Floor the headline so a 69.9 is never shown as 70 while unqualified.
    const total = Math.floor(exact + 1e-9);
    return {
      area: areaId,
      areaLabel: area.label,
      total,
      exact,
      metrics,
      allNonZero,
      qualified: exact + 1e-9 >= THRESHOLD && allNonZero,
      pointsTo70: Math.max(0, Math.ceil(THRESHOLD - exact - 1e-9)),
      breakdown: Object.fromEntries(metrics.map((m) => [m.id, m.display])),
      max: Object.fromEntries(metrics.map((m) => [m.id, m.max]))
    };
  }

  function held(a, key) {
    return Array.isArray(a[key]) ? a[key] : [];
  }

  function determineStage(inputs) {
    const a = inputs || {};
    const specs = held(a, "specializationsHeld");
    if (a.programStatus === "designated") {
      if (specs.includes("frontier")) return 5;
      const prereqs = specs.includes("copilot") && specs.includes("data_security") && specs.includes("iam") &&
        (specs.includes("ai_apps") || specs.includes("ai_platform"));
      if (prereqs) return 4;
      if (specs.includes("copilot")) return 3;
      return 2;
    }
    if (a.programStatus === "package") return 1;
    return 0;
  }

  // The next milestone a partner works toward. The benefits package is
  // optional, so it is never recommended as the next step.
  function nextStageFor(stage) {
    if (stage <= 1) return stageDefinitions[2];
    return stageDefinitions[Math.min(stage + 1, 5)];
  }

  function copilotReadiness(inputs) {
    const a = inputs || {};
    const designations = held(a, "designationsHeld");
    const hasEligible = designations.some((d) => COPILOT_ELIGIBLE.includes(d));
    const checks = [
      { label: "Modern Work, Business Applications, or Security designation", have: hasEligible ? 1 : 0, need: 1, met: hasEligible, kind: "flag" },
      { label: "Microsoft 365 Copilot MAU growth (trailing 12 months)", have: n(a.cop_mauGrowth), need: 1000, met: n(a.cop_mauGrowth) >= 1000 },
      { label: "Net customers with 5+ Copilot MAU each", have: n(a.cop_customers), need: 5, met: n(a.cop_customers) >= 5 },
      { label: "People holding SC-401", have: n(a.cop_sc401), need: 5, met: n(a.cop_sc401) >= 5 },
      { label: "People holding AB-620 or AB-100", have: n(a.cop_agentCerts), need: 5, met: n(a.cop_agentCerts) >= 5 }
    ];
    const asked = ["cop_mauGrowth", "cop_customers", "cop_sc401", "cop_agentCerts"].some((k) => k in a);
    const metCount = checks.filter((c) => c.met).length;
    return { held: held(a, "specializationsHeld").includes("copilot"), asked, checks, metCount, ready: metCount === checks.length };
  }

  function frontierReadiness(inputs) {
    const a = inputs || {};
    const specs = held(a, "specializationsHeld");
    const checks = [
      { label: "Microsoft 365 Copilot specialization", met: specs.includes("copilot"), kind: "flag" },
      { label: "Data Security specialization", met: specs.includes("data_security"), kind: "flag" },
      { label: "Identity and Access Management specialization", met: specs.includes("iam"), kind: "flag" },
      { label: "AI Apps or AI Platform on Microsoft Azure specialization", met: specs.includes("ai_apps") || specs.includes("ai_platform"), kind: "flag" },
      { label: "Employees with the Frontier Transformation Engineer Titan badge", have: n(a.fr_titan), need: 5, met: n(a.fr_titan) >= 5 },
      { label: "Employees holding DP-600 (Fabric Analytics Engineer)", have: n(a.fr_dp600), need: 3, met: n(a.fr_dp600) >= 3 }
    ];
    const metCount = checks.filter((c) => c.met).length;
    return { held: specs.includes("frontier"), asked: "fr_titan" in a || "fr_dp600" in a, checks, metCount, ready: metCount === checks.length };
  }

  function holdsTarget(a) {
    return a.programStatus === "designated" && held(a, "designationsHeld").includes(areaFor(a));
  }

  function priorityFromSummary(a, pcs, stage) {
    const goal = a.goal12Mo;
    if (stage < 2) {
      if (pcs.qualified) return { label: "High", tone: "success", detail: "Qualified on the estimate. The next step is purchasing the designation, so a BDM conversation now converts directly." };
      if (pcs.exact >= THRESHOLD) return { label: "High", tone: "success", detail: "Over 70 points, but a metric sits at zero. Fixing one metric is the whole gap." };
      if (pcs.exact >= 55) return { label: "High", tone: "success", detail: "Within reach of designation. A focused certification or customer push should close it this quarter." };
      if (pcs.exact >= 35) return { label: "Medium", tone: "warning", detail: "Solid base. A structured enablement session and a score-building sprint are the right next steps." };
      return { label: "Foundational", tone: "danger", detail: "Early in the journey. Start with self-service readiness, first certifications, and customer associations." };
    }
    if (stage >= 5) return { label: "Strategic", tone: "success", detail: "Frontier Partner. Focus on renewals, co-sell, and keeping the prerequisite specializations active." };
    const cop = copilotReadiness(a);
    if (stage === 2 && cop.asked && cop.ready) return { label: "High", tone: "success", detail: "Meets the Copilot specialization thresholds on paper. Book the third-party audit." };
    if (goal === "frontier_spec" || goal === "copilot_spec" || stage >= 3) return { label: "High", tone: "success", detail: "Designated and pursuing a specialization. High-value expansion conversation for the BDM." };
    return { label: "Medium", tone: "warning", detail: "Designated. The next lift is a specialization; the Copilot path is the most common for this audience." };
  }

  function fmt(x) {
    return Number.isInteger(x) ? String(x) : String(round1(x));
  }

  function unitLabel(unit, count) {
    if (count === 1) return unit;
    if (/person$/.test(unit)) return unit.replace(/person$/, "people");
    return `${unit}s`;
  }

  function plural(count, word) {
    return `${count} ${word}${count === 1 ? "" : word.endsWith("s") ? "es" : "s"}`;
  }

  // Ranks the levers that close the most points per unit of effort.
  function levers(inputs) {
    const a = inputs || {};
    const pcs = calculatePCS(a);
    return pcs.metrics.map((m) => {
      const unitsToMax = Math.max(0, Math.ceil(m.unitsForMax - m.input - 1e-9));
      return {
        id: m.id,
        key: m.key,
        label: m.label,
        unit: m.unit,
        current: m.input,
        unitsToMax,
        sliderMax: Math.max(m.input + unitsToMax, m.input),
        perUnit: m.perUnit,
        headroom: round1(m.max - m.points),
        gateMet: m.gateMet,
        gateText: m.gateText,
        gateKeys: m.gateKeys
      };
    });
  }

  function buildGapAnalysis(inputs, pcsIn) {
    const a = inputs || {};
    const pcs = pcsIn || calculatePCS(a);
    const area = AREAS[pcs.area];
    const stage = determineStage(a);
    const gaps = [];
    const actions = [];
    const holds = holdsTarget(a);

    if (a.programStatus === "not_enrolled") {
      gaps.push("You are not enrolled in the Microsoft AI Cloud Partner Program yet. Enrollment is free and comes before everything else here.");
      actions.push("Enroll in the Microsoft AI Cloud Partner Program at partner.microsoft.com (free; verification takes 3-5 business days).");
    }

    const zeros = pcs.metrics.filter((m) => m.zero);
    zeros.forEach((m) => {
      if (!m.gateMet) {
        gaps.push(`${m.label} is at zero because it needs ${m.gateText} first. Microsoft requires at least one point in every metric, whatever the total.`);
        actions.push(`Certify ${m.gateText.replace(/^at least /, "")} to open ${shortLabel(m)} for ${area.label}.`);
      } else {
        gaps.push(`${m.label} is at zero. Microsoft requires at least one point in every metric, so this blocks the designation whatever the total.`);
        actions.push(`Get ${shortLabel(m)} off zero: one ${m.unit} is worth ${fmt(m.perUnit)} points.`);
      }
    });

    if (pcs.qualified) {
      if (holds) {
        gaps.push(`You hold ${area.label} and the estimate clears 70 with every metric above zero, so renewal looks safe. Confirm it in Partner Center.`);
      } else if (a.programStatus === "designated") {
        gaps.push(`The estimate qualifies you for ${area.label}. Because you already pay the designation fee, this designation is added at no extra cost.`);
        actions.push(`Confirm ${area.label} shows as qualified in Partner Center; it is added under the fee you already pay.`);
      } else {
        gaps.push(`The estimate qualifies you for ${area.label}. Qualified is not enrolled: the designation is a ${DESIGNATION_FEE} purchase that covers every designation you qualify for.`);
        actions.push(`Validate the score in Partner Center, then purchase the Solutions Partner designation (${DESIGNATION_FEE}).`);
      }
    } else if (pcs.pointsTo70 > 0) {
      gaps.push(`You need about ${pcs.pointsTo70} more point${pcs.pointsTo70 === 1 ? "" : "s"} to reach 70 in ${area.label}.`);
    }

    // A gate can hold a metric down without zeroing it (Security: SC-200 alone
    // is worth 4, but Step 3 people score nothing until SC-500 is in place too).
    pcs.metrics.filter((m) => !m.zero && !m.gateMet).forEach((m) => {
      gaps.push(`${m.label} is capped at ${fmt(m.points)} of ${m.max}: certified people beyond the gate score nothing until you have ${m.gateText}.`);
      actions.push(`Certify ${m.gateText.replace(/^at least /, "")} to unlock the rest of ${shortLabel(m)}.`);
    });

    // Fastest levers: the most points per unit, among metrics with headroom.
    const open = levers(a).filter((l) => l.headroom > 0 && l.gateMet && !zeros.some((z) => z.id === l.id))
      .sort((x, y) => y.perUnit - x.perUnit);
    open.slice(0, 2).forEach((l) => {
      const units = Math.min(l.unitsToMax, Math.max(1, Math.ceil(Math.min(l.headroom, pcs.pointsTo70 || l.headroom) / l.perUnit - 1e-9)));
      gaps.push(`${l.label}: ${units} more ${unitLabel(l.unit, units)} would add about ${fmt(Math.min(l.headroom, units * l.perUnit))} points (${fmt(l.headroom)} still open).`);
      if (!pcs.qualified) actions.push(leverAction(pcs.area, l, units));
    });

    if (stage >= 2 && stage < 3 && (a.goal12Mo === "copilot_spec" || a.goal12Mo === "frontier_spec")) {
      const cop = copilotReadiness(a);
      cop.checks.filter((c) => !c.met).forEach((c) => {
        gaps.push(c.kind === "flag" ? `Copilot specialization: needs a ${c.label}.` : `Copilot specialization: ${c.label.toLowerCase()} is ${c.have.toLocaleString()} of ${c.need.toLocaleString()}.`);
      });
      if (cop.ready) actions.push("Book the Microsoft 365 Copilot specialization audit (about $2,700, roughly four hours).");
      else actions.push("Close the Copilot specialization gaps above, then book the third-party audit.");
    }

    if (stage >= 5) {
      actions.unshift("Keep the four prerequisite specializations active: Frontier Partner depends on every one of them.");
    }

    if ((a.goal12Mo === "frontier_spec" || stage === 4) && stage < 5) {
      const fr = frontierReadiness(a);
      const missing = fr.checks.filter((c) => !c.met);
      if (!missing.length) {
        gaps.push("Every Frontier Partner requirement in this assessment is met. The last step is the third-party audit.");
        actions.unshift("Book the Frontier Partner specialization audit (about $4,000, roughly eight hours) and finish it within 30 days of applying.");
      }
      if (missing.length) {
        gaps.push(`Frontier Partner specialization: ${missing.length} of ${fr.checks.length} requirements still open (${missing.map((c) => c.label.replace(/ specialization$/, "")).join("; ")}).`);
        actions.push("Map an owner to each open Frontier requirement; the audit (about $4,000) is booked only after every other prerequisite is met.");
      }
    }

    while (actions.length < 3) {
      if (!actions.some((x) => /Partner Center/.test(x))) actions.push("Reconcile the official score in Partner Center (Membership > Solutions Partner) against this estimate.");
      else if (!actions.some((x) => /TD SYNNEX/.test(x))) actions.push("Book a TD SYNNEX MAICPP Clinic to pressure-test the plan and pick the next milestone.");
      else actions.push("Re-run this assessment in 30 days to measure movement.");
    }

    return { gaps, actions: dedupe(actions).slice(0, 3), pointsTo70: pcs.pointsTo70 };
  }

  function shortLabel(m) {
    return m.label.replace(/ \(.*\)$/, "").toLowerCase();
  }

  function dedupe(list) {
    return list.filter((x, i) => list.indexOf(x) === i);
  }

  function leverAction(areaId, l, units) {
    const area = AREAS[areaId];
    if (l.id === "netAdds") return `Add ${units} net new ${units === 1 ? "customer" : "customers"} meeting the rule: ${area.netAddRule}.`;
    if (l.id === "intermediate") return `Certify ${plural(units, "more person")} in ${(l.gateMet && area.cert.intermediateStep) || area.cert.intermediate}.`.replace("more persons", "more people");
    if (l.id === "advanced") return `Certify ${plural(units, "more person")} in ${(l.gateMet && area.cert.advancedStep) || area.cert.advanced}.`.replace("more persons", "more people");
    if (l.id === "skilling") return `Certify ${plural(units, "more person")} in ${area.cert.step3}.`.replace("more persons", "more people");
    if (l.id === "usage") return usageAction(areaId);
    return deploymentAction(areaId);
  }

  function usageAction(areaId) {
    if (areaId === "modern_work") return "Run adoption sprints on existing SMB tenants to grow monthly active users; growth only counts from the date you are associated.";
    if (areaId === "security") return "Grow protected users across Defender, Entra, Intune, and Purview workloads you are associated with.";
    if (areaId === "business_apps") return "Grow monthly consumption value across Dynamics 365 and Power Platform customers year over year.";
    return "Grow qualifying Azure consumed revenue year over year; 20% growth earns the full 20 points.";
  }

  function deploymentAction(areaId) {
    if (areaId === "modern_work") return "Claim CPOR on deployments you influenced and drive tenants above 40% of paid licenses active.";
    if (areaId === "security") return "Drive security tenants above 15% of paid licenses active, or $750+ security Azure spend.";
    if (areaId === "business_apps") return "Bring more customer workloads above 5,000 monthly consumption value.";
    return "Land more distinct Azure services (virtual machines do not count) with spend in the last 12 months.";
  }

  function associationAction(areaId) {
    if (areaId === "modern_work") return "Confirm every SMB customer is associated through CSP or a CPOR claim; unassociated tenants score nothing.";
    if (areaId === "security") return "Confirm CSP or CPOR association on Microsoft 365 security tenants and PAL on Azure security subscriptions.";
    if (areaId === "business_apps") return "Confirm CPOR, CSP, or DPOR association on every Dynamics 365 and Power Platform customer.";
    return "Confirm Partner Admin Link (PAL) or CSP association on every Azure subscription you manage.";
  }

  function buildRoadmap(inputs, pcsIn) {
    const a = inputs || {};
    const pcs = pcsIn || calculatePCS(a);
    const area = AREAS[pcs.area];
    const stage = determineStage(a);
    const goal = a.goal12Mo;
    const zero = pcs.metrics.find((m) => m.zero);

    const first = [
      a.programStatus === "not_enrolled" ? "Enroll in the Microsoft AI Cloud Partner Program (free) and complete verification." : associationAction(pcs.area),
      zero ? `Get ${shortLabel(zero)} off zero first: it blocks the designation at any total.` : `Assign a certification owner and book exam dates for ${area.cert.intermediate}.`,
      "Pull the official score from Partner Center (Membership > Solutions Partner) and note the gap to this estimate."
    ];

    const second = [
      `Add net new customers that meet the rule: ${area.netAddRule}.`,
      usageAction(pcs.area),
      deploymentAction(pcs.area)
    ];

    let third;
    if (stage >= 5) {
      third = ["Keep all four prerequisite specializations active through their renewals.", "Use Frontier-aligned co-sell and the Agent pre-purchase credits on a lighthouse customer.", "Review the plan with your TD SYNNEX BDM each quarter."];
    } else if (stage >= 2 && (goal === "frontier_spec" || stage >= 3)) {
      third = [
        "Sequence the open Frontier prerequisites: Copilot, Data Security, Identity and Access Management, and AI Apps or AI Platform on Azure.",
        "Start five people on the Frontier Transformation Engineer Titan badge and three on DP-600.",
        "Book specialization audits only once each one's thresholds are met in Partner Center."
      ];
    } else if (stage >= 2) {
      third = [
        "Track Copilot MAU growth toward 1,000 and five customers at 5+ MAU each.",
        "Certify five people in SC-401 and five in AB-620 or AB-100.",
        "Book the Copilot specialization audit (about $2,700) once the thresholds show in Partner Center."
      ];
    } else {
      third = [
        pcs.qualified ? `Purchase the Solutions Partner designation (${DESIGNATION_FEE}); it covers every designation you qualify for.` : `Re-score against the 70-point bar and every-metric-above-zero rule; target qualification next quarter.`,
        area.cert.advanced ? `Complete one advanced certification: ${area.cert.advanced}.` : `Complete the next certification step: ${area.cert.intermediate}.`,
        "Meet your TD SYNNEX BDM, or book a MAICPP Clinic, to pick the next designation or specialization."
      ];
    }

    return [
      { window: "Days 1-30", title: "Foundation", outcome: zero ? "Clear the zero-point metric and lock in associations." : "Lock in associations and the certification calendar.", actions: first },
      { window: "Days 31-60", title: "Growth", outcome: `Move the ${area.label} customer metrics that count.`, actions: second },
      { window: "Days 61-90", title: "Acceleration", outcome: stage >= 2 ? "Convert the designation into a specialization." : pcs.qualified ? "Turn qualification into an active designation." : "Close the gap to 70 with every metric above zero.", actions: third }
    ];
  }

  function formatFocus(focus) {
    return (AREAS[focus] && AREAS[focus].label) || "Modern Work";
  }

  function summarize(inputs) {
    const assessment = inputs || {};
    const pcs = calculatePCS(assessment);
    const stage = determineStage(assessment);
    return {
      assessment,
      pcs,
      stage,
      stageDefinition: stageDefinitions[stage],
      nextStage: nextStageFor(stage),
      enrolled: assessment.programStatus !== "not_enrolled",
      holdsTarget: holdsTarget(assessment),
      gap: buildGapAnalysis(assessment, pcs),
      roadmap: buildRoadmap(assessment, pcs),
      priority: priorityFromSummary(assessment, pcs, stage),
      copilot: copilotReadiness(assessment),
      frontier: frontierReadiness(assessment),
      levers: levers(assessment),
      focusLabel: pcs.areaLabel,
      modelDate: MODEL_DATE
    };
  }

  function storage() {
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function loadAssessment() {
    try {
      const s = storage();
      const data = s ? JSON.parse(s.getItem(STORAGE_KEY)) : null;
      if (!data || typeof data !== "object" || data._v !== SCHEMA) return {};
      const copy = Object.assign({}, data);
      delete copy._v;
      return copy;
    } catch (error) {
      return {};
    }
  }

  // True when a saved answer set predates the v2 model and was ignored.
  function hasLegacyAssessment() {
    try {
      const s = storage();
      const data = s ? JSON.parse(s.getItem(STORAGE_KEY)) : null;
      return !!(data && typeof data === "object" && data._v !== SCHEMA && Object.keys(data).length);
    } catch (error) {
      return false;
    }
  }

  function saveAssessment(data) {
    try {
      const s = storage();
      if (s) s.setItem(STORAGE_KEY, JSON.stringify(Object.assign({}, data || {}, { _v: SCHEMA })));
    } catch (error) {
      /* storage blocked: answers last for this visit only */
    }
  }

  function clearAssessment() {
    try {
      const s = storage();
      if (s) { s.removeItem(STORAGE_KEY); s.removeItem(ROADMAP_KEY); }
    } catch (error) {
      /* nothing to clear */
    }
  }

  function isComplete(answers) {
    const a = answers || {};
    return !!(a.programStatus && a.targetArea);
  }

  // showIf: asked only when every listed answer matches one of its values.
  // hideIf: skipped when any listed answer matches. A checkbox answer matches
  // when it contains any of the listed values.
  function matches(have, want) {
    const list = Array.isArray(want) ? want : [want];
    if (Array.isArray(have)) return have.some((v) => list.includes(v));
    return list.includes(have);
  }

  function isVisible(question, answers) {
    const a = answers || {};
    if (question.showIf && !Object.keys(question.showIf).every((key) => matches(a[key], question.showIf[key]))) return false;
    if (question.hideIf && Object.keys(question.hideIf).some((key) => matches(a[key], question.hideIf[key]))) return false;
    return true;
  }

  // Drops answers to questions an upstream change has hidden, repeating until
  // stable so a stale branch can never feed the score.
  function pruneAnswers(questions, answers) {
    const out = Object.assign({}, answers || {});
    let changed = true;
    while (changed) {
      changed = false;
      questions.forEach((q) => {
        if (q.id in out && !isVisible(q, out)) { delete out[q.id]; changed = true; }
      });
    }
    return out;
  }

  function getAssessmentSummary() {
    return summarize(loadAssessment());
  }

  root.FrontierNavigator = {
    STORAGE_KEY,
    ROADMAP_KEY,
    SCHEMA,
    MODEL_DATE,
    THRESHOLD,
    stageDefinitions,
    DESIGNATIONS,
    AREAS,
    calculatePCS,
    determineStage,
    nextStageFor,
    copilotReadiness,
    frontierReadiness,
    levers,
    formatFocus,
    buildGapAnalysis,
    buildRoadmap,
    summarize,
    loadAssessment,
    hasLegacyAssessment,
    saveAssessment,
    clearAssessment,
    isComplete,
    isVisible,
    unitLabel,
    pruneAnswers,
    getAssessmentSummary
  };
})(typeof window !== "undefined" ? window : globalThis);
