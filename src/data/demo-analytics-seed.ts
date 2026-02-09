// ============================================================
// Demo Analytics Seed Data
// Populates the analytics pipeline with realistic data
// Project: "proj-union-square" (Blackstone @ Union Square)
// ============================================================

import { db } from "@/lib/db";
import type {
  ProductivityEntry,
  ProductivityBaseline,
  ProductivityAnalytics,
  NoticeLogEntry,
  DelayEvent,
  CrewComposition,
} from "@/lib/types";

// Helper: Get ISO date string for N days ago
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// Helper: Get current timestamp
function now(): string {
  return new Date().toISOString();
}

// ============================================================
// SECTION 1: SEED PRODUCTIVITY ENTRIES (50 entries)
// Tells a story across 30 days with realistic daily quantities
// ============================================================

function generateProductivityEntries(): ProductivityEntry[] {
  const entries: ProductivityEntry[] = [];
  let entryIndex = 1;
  const now_str = now();

  // Concrete Forming: Days 1-20 strong (index ~1.1), then dips (0.78) due to weather
  // Cost Code: cc-foundation-form (CY, 2.5 hrs/unit budget)
  const concreteFormingDays = [
    { day: 29, qty: 22, crew: 5 },  // Day 1 (strong start)
    { day: 28, qty: 24, crew: 5 },
    { day: 27, qty: 20, crew: 4 },
    { day: 26, qty: 25, crew: 5 },
    { day: 25, qty: 18, crew: 4 },
    { day: 24, qty: 23, crew: 5 },  // Day 6
    { day: 23, qty: 21, crew: 5 },
    { day: 22, qty: 26, crew: 5 },
    { day: 21, qty: 19, crew: 4 },
    { day: 20, qty: 24, crew: 5 },
    { day: 19, qty: 22, crew: 5 },  // Day 11
    { day: 18, qty: 25, crew: 5 },  // Weather impact starts here
    { day: 17, qty: 15, crew: 4 },  // Reduced
    { day: 16, qty: 12, crew: 3 },  // Weather day
    { day: 15, qty: 16, crew: 4 },  // Recovery
    { day: 14, qty: 14, crew: 4 },
  ];

  for (const { day, qty, crew } of concreteFormingDays) {
    const crewComp: CrewComposition = {
      journeymen: Math.ceil(crew * 0.5),
      apprentices: Math.ceil(crew * 0.25),
      foremen: 1,
    };
    const laborHours = crew * 8;
    const budgetedHoursPerUnit = 2.5;
    const unitRate = qty / laborHours;
    const productivityIndex = unitRate / (1 / budgetedHoursPerUnit); // budget is 2.5 hrs/CY = 0.4 CY/hr

    entries.push({
      id: `pe-concrete-form-d${31 - day}`,
      projectId: "proj-union-square",
      dailyLogId: `log-seed-${String(31 - day).padStart(2, "0")}`,
      date: daysAgo(day),
      costCodeId: "cc-foundation-form",
      csiDivision: "03 - Concrete",
      activity: "Foundation Forming",
      taktZone: ["L1-A", "L2-A", "L3-A"][entryIndex % 3],
      quantityInstalled: qty,
      unitOfMeasure: "CY",
      crewSize: crew,
      crewComposition: crewComp,
      laborHoursExpended: laborHours,
      overtimeHoursIncluded: false,
      reworkIncluded: false,
      computedUnitRate: unitRate,
      computedProductivityIndex: productivityIndex,
      computedLaborCostPerUnit: (laborHours * 65) / qty,
      createdAt: now_str,
      updatedAt: now_str,
    });
    entryIndex++;
  }

  // Steel Erection: Consistently good (0.95-1.05 index)
  // Cost Code: cc-steel-erect (TON, 45 hrs/unit budget)
  const steelErectionDays = [
    { day: 29, qty: 3.2, crew: 7 },
    { day: 28, qty: 2.9, crew: 6 },
    { day: 27, qty: 3.1, crew: 7 },
    { day: 26, qty: 3.0, crew: 7 },
    { day: 25, qty: 2.8, crew: 6 },
    { day: 24, qty: 3.2, crew: 7 },
    { day: 23, qty: 3.1, crew: 7 },
    { day: 22, qty: 3.0, crew: 7 },
    { day: 21, qty: 2.9, crew: 6 },
    { day: 20, qty: 3.2, crew: 7 },
  ];

  for (const { day, qty, crew } of steelErectionDays) {
    const crewComp: CrewComposition = {
      journeymen: Math.ceil(crew * 0.57),
      apprentices: Math.ceil(crew * 0.29),
      foremen: 1,
    };
    const laborHours = crew * 8;
    const budgetedHoursPerUnit = 45;
    const unitRate = laborHours / qty; // TON is measured in hours per ton
    const productivityIndex = budgetedHoursPerUnit / unitRate;

    entries.push({
      id: `pe-steel-erect-d${31 - day}`,
      projectId: "proj-union-square",
      dailyLogId: `log-seed-${String(31 - day).padStart(2, "0")}`,
      date: daysAgo(day),
      costCodeId: "cc-steel-erect",
      csiDivision: "05 - Metals",
      activity: "Structural Steel Erection",
      taktZone: ["L1-A", "L2-A", "L3-A"][entryIndex % 3],
      quantityInstalled: qty,
      unitOfMeasure: "TON",
      crewSize: crew,
      crewComposition: crewComp,
      laborHoursExpended: laborHours,
      overtimeHoursIncluded: false,
      reworkIncluded: false,
      computedUnitRate: unitRate,
      computedProductivityIndex: productivityIndex,
      computedLaborCostPerUnit: (laborHours * 65) / qty,
      createdAt: now_str,
      updatedAt: now_str,
    });
    entryIndex++;
  }

  // Drywall: Improving trend (starts 0.85, ends 1.10 — learning curve)
  // Cost Code: cc-drywall-hang (SF, 0.22 hrs/unit budget)
  const drywallDays = [
    { day: 25, qty: 850, crew: 5 },   // Day 1 (learning, slower)
    { day: 24, qty: 920, crew: 5 },
    { day: 23, qty: 1000, crew: 6 },  // Improving
    { day: 22, qty: 1050, crew: 6 },
    { day: 21, qty: 1100, crew: 6 },
    { day: 20, qty: 1150, crew: 6 },  // Day 6 (good pace)
    { day: 19, qty: 1180, crew: 6 },
    { day: 18, qty: 1200, crew: 6 },
    { day: 17, qty: 1220, crew: 6 },
    { day: 16, qty: 1250, crew: 6 },
  ];

  for (const { day, qty, crew } of drywallDays) {
    const crewComp: CrewComposition = {
      journeymen: Math.ceil(crew * 0.5),
      apprentices: Math.ceil(crew * 0.33),
      foremen: 1,
    };
    const laborHours = crew * 8;
    const budgetedHoursPerUnit = 0.22;
    const unitRate = qty / laborHours;
    const productivityIndex = unitRate / (1 / budgetedHoursPerUnit);

    entries.push({
      id: `pe-drywall-d${26 - day}`,
      projectId: "proj-union-square",
      dailyLogId: `log-seed-${String(31 - day).padStart(2, "0")}`,
      date: daysAgo(day),
      costCodeId: "cc-drywall-hang",
      csiDivision: "09 - Finishes",
      activity: "Drywall Hanging",
      taktZone: ["L1-A", "L2-A", "L3-A", "L4-A"][entryIndex % 4],
      quantityInstalled: qty,
      unitOfMeasure: "SF",
      crewSize: crew,
      crewComposition: crewComp,
      laborHoursExpended: laborHours,
      overtimeHoursIncluded: false,
      reworkIncluded: false,
      computedUnitRate: unitRate,
      computedProductivityIndex: productivityIndex,
      computedLaborCostPerUnit: (laborHours * 65) / qty,
      createdAt: now_str,
      updatedAt: now_str,
    });
    entryIndex++;
  }

  // Electrical Conduit: Declining trend (starts 1.0, drops to 0.75 — crew change)
  // Cost Code: cc-conduit-roughin (LF, 0.10 hrs/unit budget)
  const conduitDays = [
    { day: 20, qty: 1200, crew: 3 },  // Day 1 (strong)
    { day: 19, qty: 1150, crew: 3 },
    { day: 18, qty: 1100, crew: 3 },
    { day: 17, qty: 950, crew: 3 },   // Crew starts to decline
    { day: 16, qty: 900, crew: 3 },
    { day: 15, qty: 850, crew: 3 },   // New crew lower productivity
    { day: 14, qty: 820, crew: 3 },
    { day: 13, qty: 800, crew: 3 },
  ];

  for (const { day, qty, crew } of conduitDays) {
    const crewComp: CrewComposition = {
      journeymen: Math.ceil(crew * 0.67),
      apprentices: 0,
      foremen: 1,
    };
    const laborHours = crew * 8;
    const budgetedHoursPerUnit = 0.10;
    const unitRate = qty / laborHours;
    const productivityIndex = unitRate / (1 / budgetedHoursPerUnit);

    entries.push({
      id: `pe-conduit-d${21 - day}`,
      projectId: "proj-union-square",
      dailyLogId: `log-seed-${String(31 - day).padStart(2, "0")}`,
      date: daysAgo(day),
      costCodeId: "cc-conduit-roughin",
      csiDivision: "26 - Electrical",
      activity: "Conduit Rough-In",
      taktZone: ["L1-A", "L2-A", "L3-A", "L4-A"][entryIndex % 4],
      quantityInstalled: qty,
      unitOfMeasure: "LF",
      crewSize: crew,
      crewComposition: crewComp,
      laborHoursExpended: laborHours,
      overtimeHoursIncluded: false,
      reworkIncluded: false,
      computedUnitRate: unitRate,
      computedProductivityIndex: productivityIndex,
      computedLaborCostPerUnit: (laborHours * 65) / qty,
      createdAt: now_str,
      updatedAt: now_str,
    });
    entryIndex++;
  }

  return entries;
}

// ============================================================
// SECTION 2: SEED PRODUCTIVITY BASELINES (4 baselines)
// Established from early period entries (days 30-20)
// ============================================================

function generateProductivityBaselines(): ProductivityBaseline[] {
  const now_str = now();

  return [
    {
      id: "pb-concrete-form-early",
      projectId: "proj-union-square",
      costCodeId: "cc-foundation-form",
      baselinePeriodStart: daysAgo(30),
      baselinePeriodEnd: daysAgo(20),
      baselineUnitRate: 2.2,  // CY/hour (0.4545 hrs per CY)
      baselineCrewSize: 5,
      baselineCrewMix: {
        journeymen: 2,
        apprentices: 1,
        foremen: 1,
      },
      baselineConditions: "Early period, fair weather, crew ramping",
      sampleSize: 8,
      confidence: 0.78,
      source: "early_period",
      isActive: true,
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pb-steel-erect-early",
      projectId: "proj-union-square",
      costCodeId: "cc-steel-erect",
      baselinePeriodStart: daysAgo(29),
      baselinePeriodEnd: daysAgo(20),
      baselineUnitRate: 43.2,  // hours/ton
      baselineCrewSize: 7,
      baselineCrewMix: {
        journeymen: 4,
        apprentices: 2,
        foremen: 1,
      },
      baselineConditions: "Normal steel erection conditions",
      sampleSize: 10,
      confidence: 0.82,
      source: "early_period",
      isActive: true,
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pb-drywall-early",
      projectId: "proj-union-square",
      costCodeId: "cc-drywall-hang",
      baselinePeriodStart: daysAgo(25),
      baselinePeriodEnd: daysAgo(20),
      baselineUnitRate: 480,  // SF/hour
      baselineCrewSize: 5,
      baselineCrewMix: {
        journeymen: 3,
        apprentices: 1,
        foremen: 1,
      },
      baselineConditions: "Early drywall phase, crew learning",
      sampleSize: 5,
      confidence: 0.70,
      source: "early_period",
      isActive: true,
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pb-conduit-early",
      projectId: "proj-union-square",
      costCodeId: "cc-conduit-roughin",
      baselinePeriodStart: daysAgo(20),
      baselinePeriodEnd: daysAgo(15),
      baselineUnitRate: 150,  // LF/hour
      baselineCrewSize: 3,
      baselineCrewMix: {
        journeymen: 2,
        apprentices: 0,
        foremen: 1,
      },
      baselineConditions: "Original electrical crew, good baseline",
      sampleSize: 6,
      confidence: 0.80,
      source: "early_period",
      isActive: true,
      createdAt: now_str,
      updatedAt: now_str,
    },
  ];
}

// ============================================================
// SECTION 3: SEED PRODUCTIVITY ANALYTICS (4 analytics records)
// Project-to-date summaries with trend analysis
// ============================================================

function generateProductivityAnalytics(): ProductivityAnalytics[] {
  const now_str = now();

  return [
    {
      id: "pa-concrete-form-ptd",
      projectId: "proj-union-square",
      costCodeId: "cc-foundation-form",
      periodType: "project_to_date",
      periodStart: daysAgo(30),
      periodEnd: daysAgo(1),
      averageUnitRate: 1.92,  // CY/hour
      peakUnitRate: 2.4,
      lowUnitRate: 1.2,
      standardDeviation: 0.34,
      trendDirection: "declining",
      trendMagnitude: -0.18,  // -18% decline after weather
      totalQuantityInstalled: 328,
      totalLaborHours: 171,
      plannedVsActualVariance: -8.2,
      costVariance: 2100,
      scheduleVariance: 1.5,
      impactFactors: [
        {
          factor: "weather",
          magnitude: -0.22,
          description: "Rain and wind delays from day 18 onward",
        },
      ],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pa-steel-erect-ptd",
      projectId: "proj-union-square",
      costCodeId: "cc-steel-erect",
      periodType: "project_to_date",
      periodStart: daysAgo(29),
      periodEnd: daysAgo(1),
      averageUnitRate: 43.8,  // hours/ton
      peakUnitRate: 47.0,
      lowUnitRate: 41.0,
      standardDeviation: 2.1,
      trendDirection: "stable",
      trendMagnitude: 0.02,
      totalQuantityInstalled: 30.4,
      totalLaborHours: 1330,
      plannedVsActualVariance: 2.6,
      costVariance: -1800,
      scheduleVariance: -0.5,
      impactFactors: [],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pa-drywall-ptd",
      projectId: "proj-union-square",
      costCodeId: "cc-drywall-hang",
      periodType: "project_to_date",
      periodStart: daysAgo(25),
      periodEnd: daysAgo(1),
      averageUnitRate: 615,  // SF/hour
      peakUnitRate: 800,
      lowUnitRate: 425,
      standardDeviation: 125,
      trendDirection: "improving",
      trendMagnitude: 0.29,  // +29% improvement
      totalQuantityInstalled: 9970,
      totalLaborHours: 480,
      plannedVsActualVariance: 3.8,
      costVariance: -4200,
      scheduleVariance: -2.0,
      impactFactors: [
        {
          factor: "learning_curve",
          magnitude: 0.29,
          description: "Crew efficiency improving as crew gains experience",
        },
      ],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "pa-conduit-ptd",
      projectId: "proj-union-square",
      costCodeId: "cc-conduit-roughin",
      periodType: "project_to_date",
      periodStart: daysAgo(20),
      periodEnd: daysAgo(1),
      averageUnitRate: 118,  // LF/hour
      peakUnitRate: 150,
      lowUnitRate: 100,
      standardDeviation: 18,
      trendDirection: "declining",
      trendMagnitude: -0.25,  // -25% decline
      totalQuantityInstalled: 8470,
      totalLaborHours: 72,
      plannedVsActualVariance: -12.4,
      costVariance: 3850,
      scheduleVariance: 2.1,
      impactFactors: [
        {
          factor: "crew_change",
          magnitude: -0.25,
          description: "Original crew reassigned; new crew ramping up",
        },
      ],
      createdAt: now_str,
      updatedAt: now_str,
    },
  ];
}

// ============================================================
// SECTION 4: SEED NOTICE LOGS (5 notices)
// Contractual notices with response tracking
// ============================================================

function generateNoticeLogEntries(): NoticeLogEntry[] {
  const now_str = now();

  return [
    {
      id: "notice-seed-01",
      projectId: "proj-union-square",
      noticeType: "delay",
      sentTo: "Blackstone Investors, LLC",
      sentFrom: "Structural Concrete Inc.",
      dateSent: daysAgo(18),
      deliveryMethod: "certified_mail",
      contractClause: "AIA A201-2017 Section 8.3.1",
      responseRequired: true,
      responseDeadline: daysAgo(8),
      responseReceived: false,
      content:
        "Notice of delay caused by unexpected weather conditions (sustained rain and wind) on June 15-17, 2024. Concrete forming operations suspended for safety reasons. Request extension of schedule per Section 8.3.1.",
      relatedDelayEventIds: ["delay-seed-01"],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "notice-seed-02",
      projectId: "proj-union-square",
      noticeType: "backcharge",
      sentTo: "Concrete Finishers Local 300",
      sentFrom: "Project Management",
      dateSent: daysAgo(12),
      deliveryMethod: "email",
      contractClause: "Standard Subcontract Section 5.4",
      responseRequired: true,
      responseDeadline: daysAgo(2),
      responseReceived: true,
      responseDate: daysAgo(3),
      content:
        "Backcharge notice for rework of concrete finish on Level 2 due to cold joints and surface spalling. Cost estimate: $8,500. Per contract, subcontractor responsible for defective work.",
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "notice-seed-03",
      projectId: "proj-union-square",
      noticeType: "change_directive",
      sentTo: "All Trades",
      sentFrom: "Architect (DLR Architecture)",
      dateSent: daysAgo(14),
      deliveryMethod: "certified_mail",
      contractClause: "AIA A201-2017 Section 7.1",
      responseRequired: true,
      responseDeadline: daysAgo(4),
      responseReceived: true,
      responseDate: daysAgo(5),
      content:
        "Change Directive #CD-03: Owner has directed addition of fire-rated gypsum board to stairwell walls (Level 1-4). Scope: 2,400 SF additional drywall. Timeline: complete within existing schedule if possible.",
      relatedChangeIds: ["change-seed-01"],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "notice-seed-04",
      projectId: "proj-union-square",
      noticeType: "cure",
      sentTo: "Pinnacle Electrical Contractors",
      sentFrom: "Project Manager",
      dateSent: daysAgo(10),
      deliveryMethod: "certified_mail",
      contractClause: "Standard Subcontract Section 11.1",
      responseRequired: true,
      responseDeadline: daysAgo(3),
      responseReceived: false,
      content:
        "Cure Notice: Electrical crew has not maintained contract schedule. Current progress is 3 days behind plan. Conduit rough-in should be 60% complete; currently only 48%. Cure this deficiency within 3 days or face suspension of work and backcharge.",
      relatedDelayEventIds: ["delay-seed-03"],
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "notice-seed-05",
      projectId: "proj-union-square",
      noticeType: "constructive_acceleration",
      sentTo: "Blackstone Investors, LLC",
      sentFrom: "Structural Concrete Inc.",
      dateSent: daysAgo(9),
      deliveryMethod: "certified_mail",
      contractClause: "AIA A201-2017 Section 8.4.8",
      responseRequired: true,
      responseDeadline: daysAgo(0), // Deadline today
      responseReceived: false,
      content:
        "Claim for Constructive Acceleration: Weather delay (5 days) coupled with Owner Change Directive CD-03 (additional 2 days) requires acceleration of concrete operations. Contractor is adding night shift concrete pumping (additional $45,000 cost) to maintain project completion date. Claim includes labor acceleration premium per AIA A201.",
      relatedDelayEventIds: ["delay-seed-01", "delay-seed-02"],
      relatedChangeIds: ["change-seed-01"],
      createdAt: now_str,
      updatedAt: now_str,
    },
  ];
}

// ============================================================
// SECTION 5: SEED DELAY EVENTS (3 events)
// Detailed delay tracking with impact analysis
// ============================================================

function generateDelayEvents(): DelayEvent[] {
  const now_str = now();

  return [
    {
      id: "delay-seed-01",
      projectId: "proj-union-square",
      date: daysAgo(18),
      delayType: "excusable_noncompensable",
      causeCategory: "weather",
      description:
        "Sustained rain and wind on June 15-17, 2024. Site unsafe for concrete forming. Work suspended per OSHA requirements.",
      responsibleParty: "Force Majeure",
      calendarDaysImpacted: 5,
      workingDaysImpacted: 3,
      criticalPathImpacted: true,
      affectedActivities: ["cc-foundation-form", "cc-elev-slab-form", "cc-concrete-place"],
      affectedTaktZones: ["L1-A", "L2-A"],
      contractNoticeRequired: true,
      noticeSentDate: daysAgo(18),
      noticeDeadline: daysAgo(8),
      relatedChangeIds: [],
      cumulativeProjectDelay: 5,
      mitigationActions: [
        "Monitored weather continuously",
        "Prepared accelerated catch-up plan",
        "Pre-planned overtime shifts",
      ],
      costImpact: 0,
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "delay-seed-02",
      projectId: "proj-union-square",
      date: daysAgo(14),
      delayType: "excusable_compensable",
      causeCategory: "owner_change",
      description:
        "Change Directive CD-03 issued by Owner: Add 2,400 SF fire-rated drywall to stairwell walls. Extends drywall schedule; requires resequencing of electrical work.",
      responsibleParty: "Blackstone Investors, LLC (Owner)",
      calendarDaysImpacted: 8,
      workingDaysImpacted: 6,
      criticalPathImpacted: true,
      affectedActivities: ["cc-drywall-hang", "cc-conduit-roughin", "cc-wire-pull"],
      affectedTaktZones: ["L1-A", "L2-A", "L3-A", "L4-A"],
      contractNoticeRequired: true,
      noticeSentDate: daysAgo(14),
      noticeDeadline: daysAgo(4),
      relatedChangeIds: ["change-seed-01"],
      cumulativeProjectDelay: 8,
      mitigationActions: [
        "Expedited drywall crew (added 2 workers)",
        "Extended hours (2 hours daily OT)",
        "Coordinated with electrical to work concurrently",
      ],
      costImpact: 45000,
      createdAt: now_str,
      updatedAt: now_str,
    },
    {
      id: "delay-seed-03",
      projectId: "proj-union-square",
      date: daysAgo(10),
      delayType: "inexcusable",
      causeCategory: "sub_default",
      description:
        "Pinnacle Electrical Contractors crew productivity decline: Conduit rough-in falling 3 days behind schedule. Apparent crew change; new electricians slower than original team. Not weather-related.",
      responsibleParty: "Pinnacle Electrical Contractors",
      calendarDaysImpacted: 3,
      workingDaysImpacted: 3,
      criticalPathImpacted: false,
      affectedActivities: ["cc-conduit-roughin"],
      affectedTaktZones: ["L1-A", "L2-A", "L3-A"],
      contractNoticeRequired: true,
      noticeSentDate: daysAgo(10),
      noticeDeadline: daysAgo(3),
      relatedChangeIds: [],
      cumulativeProjectDelay: 3,
      mitigationActions: [
        "Issued cure notice to electrical sub",
        "Monitoring daily progress",
        "Prepared backcharge estimate",
      ],
      costImpact: 8500,
      createdAt: now_str,
      updatedAt: now_str,
    },
  ];
}

// ============================================================
// MAIN EXPORT: seedAnalyticsData
// Async function to populate database with all demo data
// ============================================================

export async function seedAnalyticsData(projectId: string): Promise<void> {
  // Safety check: only seed for demo project
  if (projectId !== "proj-union-square") {
    console.warn(`seedAnalyticsData: Project ID ${projectId} is not demo project`);
    return;
  }

  try {
    // Check if data already seeded
    const existingEntries = await db.productivityEntries
      .where("projectId")
      .equals(projectId)
      .count();

    if (existingEntries > 0) {
      console.log("Analytics data already seeded; skipping");
      return;
    }

    console.log("Seeding analytics data for demo project...");

    // Generate all datasets
    const productivityEntries = generateProductivityEntries();
    const productivityBaselines = generateProductivityBaselines();
    const productivityAnalytics = generateProductivityAnalytics();
    const noticeLogEntries = generateNoticeLogEntries();
    const delayEvents = generateDelayEvents();

    // Bulk insert into database
    await Promise.all([
      db.productivityEntries.bulkPut(productivityEntries),
      db.productivityBaselines.bulkPut(productivityBaselines),
      db.productivityAnalytics.bulkPut(productivityAnalytics),
      db.noticeLogs.bulkPut(noticeLogEntries),
      db.delayEvents.bulkPut(delayEvents),
    ]);

    console.log(
      `✓ Seeded ${productivityEntries.length} productivity entries`,
    );
    console.log(
      `✓ Seeded ${productivityBaselines.length} productivity baselines`,
    );
    console.log(
      `✓ Seeded ${productivityAnalytics.length} analytics records`,
    );
    console.log(`✓ Seeded ${noticeLogEntries.length} notice log entries`);
    console.log(`✓ Seeded ${delayEvents.length} delay events`);
    console.log("Analytics data seeding complete!");
  } catch (error) {
    console.error("Error seeding analytics data:", error);
    throw error;
  }
}
