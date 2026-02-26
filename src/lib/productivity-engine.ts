import { db, generateId } from "@/lib/db";
import {
  CrewComposition,
  ProductivityEntry,
  ProductivityBaseline,
  ProductivityAnalytics,
  CostCode,
  DailyLog,
  ManpowerEntry,
  AnalyticsPeriod,
  TrendDirection,
} from "@/lib/types";

// Constants
const DEFAULT_LABOR_RATE_PER_HOUR = 65;
const MINIMUM_BASELINE_DATA_POINTS = 5;

/**
 * Cost code summary for project-level productivity overview
 */
export interface CostCodeSummary {
  costCode: CostCode;
  currentUnitRate: number;
  baselineUnitRate: number | null;
  productivityIndex: number | null;
  trendDirection: TrendDirection;
  totalQuantityInstalled: number;
  percentComplete: number;
  isAtRisk: boolean;
  daysBehind: number;
}

/**
 * Project-level productivity summary
 */
export interface ProductivitySummary {
  projectId: string;
  costCodeSummaries: CostCodeSummary[];
  overallProductivityIndex: number | null;
  atRiskCount: number;
  totalCostCodes: number;
  lastUpdated: string;
}

/**
 * Derives productivity entries from a daily log's work performed data
 * Creates ProductivityEntry records for each work item with quantity and labor hours
 * @param dailyLog The daily log containing work performed entries
 * @param projectId The project ID
 * @returns Array of created ProductivityEntry records
 */
export async function deriveProductivityEntries(
  dailyLog: DailyLog,
  projectId: string
): Promise<ProductivityEntry[]> {
  const createdEntries: ProductivityEntry[] = [];

  if (!dailyLog.workPerformed || dailyLog.workPerformed.length === 0) {
    return createdEntries;
  }

  for (const workItem of dailyLog.workPerformed) {
    // Only process items with valid quantity and labor hours
    if (
      !workItem.quantity ||
      workItem.quantity <= 0 ||
      !workItem.crewHoursWorked ||
      workItem.crewHoursWorked <= 0
    ) {
      continue;
    }

    // Look up cost code by costCodeId or by matching csiDivision + activity
    let costCode: CostCode | null = null;

    if (workItem.costCodeId) {
      const codes = await db.costCodes.filter(
        (cc: CostCode) => cc.id === workItem.costCodeId && cc.projectId === projectId
      ).toArray();
      if (codes.length > 0) {
        costCode = codes[0];
      }
    }

    if (!costCode) {
      const codes = await db.costCodes.filter(
        (cc: CostCode) =>
          cc.projectId === projectId &&
          cc.csiDivision === workItem.csiDivision &&
          cc.activity === workItem.activity
      ).toArray();
      if (codes.length > 0) {
        costCode = codes[0];
      }
    }

    // Build crew composition from manpower entries
    const crewComposition = buildCrewComposition(dailyLog);

    // Calculate metrics
    const quantityInstalled = workItem.quantity;
    const laborHoursExpended = workItem.crewHoursWorked;
    const computedUnitRate = quantityInstalled / laborHoursExpended;

    // Calculate productivity index against budget
    let computedProductivityIndex: number | undefined;
    if (costCode && costCode.budgetedLaborHoursPerUnit > 0) {
      // ProductivityIndex = budgetedHrsPerUnit / actualHrsPerUnit
      const actualHoursPerUnit = laborHoursExpended / quantityInstalled;
      computedProductivityIndex = costCode.budgetedLaborHoursPerUnit / actualHoursPerUnit;
    }

    // Calculate labor cost per unit
    const computedLaborCostPerUnit =
      (laborHoursExpended * DEFAULT_LABOR_RATE_PER_HOUR) / quantityInstalled;

    // Determine if rework is included (check notes for rework mentions)
    const reworkIncluded =
      !!(workItem.notes && workItem.notes.toLowerCase().includes("rework"));

    const productivityEntry: ProductivityEntry = {
      id: generateId("pe"),
      projectId,
      dailyLogId: dailyLog.id,
      date: dailyLog.date,
      costCodeId: costCode?.id || workItem.costCodeId || "",
      csiDivision: workItem.csiDivision,
      activity: workItem.activity,
      taktZone: workItem.taktZone || "",
      quantityInstalled,
      unitOfMeasure: workItem.unitOfMeasure || costCode?.unitOfMeasure || "unit",
      crewSize: crewComposition.journeymen + crewComposition.apprentices + crewComposition.foremen,
      crewComposition,
      laborHoursExpended,
      equipmentHoursExpended: undefined,
      overtimeHoursIncluded: dailyLog.manpower?.some(
        (m: ManpowerEntry) => m.overtimeHours && m.overtimeHours > 0
      ) || false,
      reworkIncluded,
      notes: workItem.notes,
      computedUnitRate,
      computedProductivityIndex,
      computedLaborCostPerUnit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    await db.productivityEntries.add(productivityEntry);
    createdEntries.push(productivityEntry);
  }

  return createdEntries;
}

/**
 * Establishes a productivity baseline from a stable period
 * Requires minimum 5 data points for reliability
 * @param projectId The project ID
 * @param costCodeId The cost code ID
 * @param startDate Start of baseline period (ISO string)
 * @param endDate End of baseline period (ISO string)
 * @returns ProductivityBaseline or null if insufficient data
 */
export async function establishBaseline(
  projectId: string,
  costCodeId: string,
  startDate: string,
  endDate: string
): Promise<ProductivityBaseline | null> {
  // Get all productivity entries in the date range
  const entries = await db.productivityEntries.filter(
    (pe: ProductivityEntry) =>
      pe.projectId === projectId &&
      pe.costCodeId === costCodeId &&
      pe.date >= startDate &&
      pe.date <= endDate
  ).toArray();

  // Check minimum sample size
  if (entries.length < MINIMUM_BASELINE_DATA_POINTS) {
    return null;
  }

  // Calculate baseline metrics
  const unitRates = entries.map((e: ProductivityEntry) => e.computedUnitRate ?? 0);
  const baselineUnitRate =
    unitRates.reduce((sum: number, rate: number) => sum + rate, 0) / unitRates.length;

  const crewSizes = entries.map((e: ProductivityEntry) => e.crewSize);
  const baselineCrewSize = crewSizes.reduce((sum: number, size: number) => sum + size, 0) / crewSizes.length;

  // Calculate average crew composition
  const totalJourneymen = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.crewComposition.journeymen, 0);
  const totalApprentices = entries.reduce(
    (sum: number, e: ProductivityEntry) => sum + e.crewComposition.apprentices,
    0
  );
  const totalForemen = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.crewComposition.foremen, 0);
  const entryCount = entries.length;

  const baselineCrewMix: CrewComposition = {
    journeymen: Math.round(totalJourneymen / entryCount),
    apprentices: Math.round(totalApprentices / entryCount),
    foremen: Math.round(totalForemen / entryCount),
  };

  // Calculate confidence based on sample size
  let confidence = 0.6;
  if (entryCount >= 20) {
    confidence = 0.95;
  } else if (entryCount >= 15) {
    confidence = 0.85;
  } else if (entryCount >= 10) {
    confidence = 0.75;
  }

  // Deactivate existing active baseline for this cost code
  const existingBaselines = await db.productivityBaselines.filter(
    (pb: ProductivityBaseline) =>
      pb.projectId === projectId && pb.costCodeId === costCodeId && pb.isActive
  ).toArray();

  for (const baseline of existingBaselines) {
    baseline.isActive = false;
    await db.productivityBaselines.update(baseline.id, { isActive: false });
  }

  // Create new baseline
  const newBaseline: ProductivityBaseline = {
    id: generateId("pb"),
    projectId,
    costCodeId,
    baselinePeriodStart: startDate,
    baselinePeriodEnd: endDate,
    baselineUnitRate,
    baselineCrewSize,
    baselineCrewMix,
    baselineConditions: undefined,
    sampleSize: entryCount,
    confidence,
    source: "early_period",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to database
  await db.productivityBaselines.add(newBaseline);
  return newBaseline;
}

/**
 * Computes productivity analytics for a cost code
 * Analyzes trends, variance, and impact factors
 * @param projectId The project ID
 * @param costCodeId The cost code ID
 * @param periodType Type of analysis period
 * @returns ProductivityAnalytics or null if insufficient data
 */
export async function computeAnalytics(
  projectId: string,
  costCodeId: string,
  periodType: AnalyticsPeriod
): Promise<ProductivityAnalytics | null> {
  // Get all productivity entries for this cost code
  const allEntries = await db.productivityEntries.filter(
    (pe: ProductivityEntry) => pe.projectId === projectId && pe.costCodeId === costCodeId
  ).toArray();

  if (allEntries.length === 0) {
    return null;
  }

  // Filter entries based on period type
  let entries = allEntries;
  let periodStart = allEntries[0].date;
  let periodEnd = allEntries[allEntries.length - 1].date;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (periodType === "daily") {
    entries = allEntries.filter((e: ProductivityEntry) => e.date === todayStr);
    periodStart = todayStr;
    periodEnd = todayStr;
  } else if (periodType === "weekly") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    entries = allEntries.filter((e: ProductivityEntry) => e.date >= weekAgoStr);
    periodStart = weekAgoStr;
    periodEnd = todayStr;
  } else if (periodType === "monthly") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split("T")[0];
    entries = allEntries.filter((e: ProductivityEntry) => e.date >= monthAgoStr);
    periodStart = monthAgoStr;
    periodEnd = todayStr;
  }

  if (entries.length === 0) {
    return null;
  }

  // Get cost code for budget comparison
  // Note: baseline comparison available via getActiveBaseline() for future enhancement

  const costCodes = await db.costCodes.filter(
    (cc: CostCode) => cc.id === costCodeId && cc.projectId === projectId
  ).toArray();
  const costCode = costCodes.length > 0 ? costCodes[0] : null;

  // Calculate unit rate statistics
  const unitRates = entries.map((e: ProductivityEntry) => e.computedUnitRate ?? 0);
  const averageUnitRate = unitRates.reduce((sum: number, rate: number) => sum + rate, 0) / unitRates.length;
  const peakUnitRate = Math.max(...unitRates);
  const lowUnitRate = Math.min(...unitRates);
  const variance =
    unitRates.reduce((sum: number, rate: number) => sum + Math.pow(rate - averageUnitRate, 2), 0) /
    unitRates.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate trend direction and magnitude
  let trendDirection: TrendDirection = "stable";
  let trendMagnitude = 0;

  if (entries.length >= 10) {
    const firstFive = unitRates.slice(0, 5);
    const lastFive = unitRates.slice(-5);
    const firstFiveAvg = firstFive.reduce((sum: number, rate: number) => sum + rate, 0) / firstFive.length;
    const lastFiveAvg = lastFive.reduce((sum: number, rate: number) => sum + rate, 0) / lastFive.length;

    const percentChange = (lastFiveAvg - firstFiveAvg) / firstFiveAvg;
    trendMagnitude = Math.abs(percentChange);

    if (percentChange > 0.05) {
      trendDirection = "improving";
    } else if (percentChange < -0.05) {
      trendDirection = "declining";
    } else {
      trendDirection = "stable";
    }
  }

  // Calculate quantities and hours
  const totalQuantityInstalled = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.quantityInstalled, 0);
  const totalLaborHours = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.laborHoursExpended, 0);
  const totalEquipmentHours = entries.reduce((sum: number, e: ProductivityEntry) => sum + (e.equipmentHoursExpended || 0), 0) || undefined;

  // Calculate variances
  let plannedVsActualVariance = 0;
  let costVariance = 0;
  let scheduleVariance = 0;

  if (costCode) {
    // Planned vs actual variance: (actual rate - budgeted rate) / budgeted rate
    const budgetedUnitRate = 1 / costCode.budgetedLaborHoursPerUnit;
    plannedVsActualVariance = ((averageUnitRate - budgetedUnitRate) / budgetedUnitRate) * 100;

    // Cost variance: (actual cost per unit - budgeted unit price) * total quantity
    const actualCostPerUnit = (totalLaborHours * DEFAULT_LABOR_RATE_PER_HOUR) / totalQuantityInstalled;
    costVariance = (actualCostPerUnit - costCode.budgetedUnitPrice) * totalQuantityInstalled;

    // Schedule variance: estimated days behind/ahead
    const remainingQuantity = Math.max(0, costCode.budgetedQuantity - totalQuantityInstalled);
    const daysElapsed = entries.length;
    const plannedRatePerDay = costCode.budgetedQuantity / 30; // Estimate from budget
    const actualRatePerDay = totalQuantityInstalled / daysElapsed;
    const estimatedDaysRemaining = remainingQuantity / Math.max(actualRatePerDay, 0.001);
    const plannedDaysRemaining = remainingQuantity / Math.max(plannedRatePerDay, 0.001);
    scheduleVariance = estimatedDaysRemaining - plannedDaysRemaining;
  }

  // Create analytics record
  const analytics: ProductivityAnalytics = {
    id: generateId("pa"),
    projectId,
    costCodeId,
    periodType,
    periodStart,
    periodEnd,
    averageUnitRate,
    peakUnitRate,
    lowUnitRate,
    standardDeviation,
    trendDirection,
    trendMagnitude,
    totalQuantityInstalled,
    totalLaborHours,
    totalEquipmentHours,
    plannedVsActualVariance,
    costVariance,
    scheduleVariance,
    impactFactors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to database
  await db.productivityAnalytics.add(analytics);
  return analytics;
}

/**
 * Generates a comprehensive productivity summary for a project
 * Aggregates metrics across all cost codes
 * @param projectId The project ID
 * @returns ProductivitySummary with all cost code summaries
 */
export async function getProductivitySummary(projectId: string): Promise<ProductivitySummary> {
  // Get all active cost codes for the project
  const costCodes = await db.costCodes.filter(
    (cc: CostCode) => cc.projectId === projectId && cc.isActive
  ).toArray();

  const costCodeSummaries: CostCodeSummary[] = [];
  const productivityIndices: number[] = [];

  for (const costCode of costCodes) {
    // Get latest productivity entries for this cost code
    const entries = await db.productivityEntries.filter(
      (pe: ProductivityEntry) => pe.projectId === projectId && pe.costCodeId === costCode.id
    ).toArray();

    if (entries.length === 0) {
      continue;
    }

    // Get active baseline
    const baselines = await db.productivityBaselines.filter(
      (pb: ProductivityBaseline) =>
        pb.projectId === projectId && pb.costCodeId === costCode.id && pb.isActive
    ).toArray();
    const baseline = baselines.length > 0 ? baselines[0] : null;

    // Get latest analytics for trend
    const allAnalytics = await db.productivityAnalytics.filter(
      (pa: ProductivityAnalytics) => pa.projectId === projectId && pa.costCodeId === costCode.id
    ).toArray();
    const latestAnalytics = allAnalytics.length > 0 ? allAnalytics[allAnalytics.length - 1] : null;

    // Calculate current metrics
    const totalQuantity = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.quantityInstalled, 0);
    const totalLaborHours = entries.reduce((sum: number, e: ProductivityEntry) => sum + e.laborHoursExpended, 0);
    const currentUnitRate = totalQuantity / totalLaborHours;

    // Get trend direction
    const trendDirection: TrendDirection = latestAnalytics?.trendDirection || "stable";

    // Calculate productivity index
    let productivityIndex: number | null = null;
    if (baseline) {
      productivityIndex = currentUnitRate / baseline.baselineUnitRate;
    }

    // Calculate percent complete
    const percentComplete = Math.min(100, (totalQuantity / costCode.budgetedQuantity) * 100);

    // Determine if at risk (productivity index < 0.85)
    const isAtRisk = productivityIndex !== null && productivityIndex < 0.85;

    // Calculate days behind
    let daysBehind = 0;
    if (costCode.budgetedQuantity > totalQuantity) {
      const remaining = costCode.budgetedQuantity - totalQuantity;
      const budgetedDaysPerUnit = 30 / (costCode.budgetedQuantity / 30);
      const actualDaysPerUnit = entries.length > 0 ? entries.length / (totalQuantity || 1) : budgetedDaysPerUnit;
      daysBehind = (remaining * actualDaysPerUnit) / 24 - (remaining / (costCode.budgetedQuantity / 30));
    }

    const summary: CostCodeSummary = {
      costCode,
      currentUnitRate,
      baselineUnitRate: baseline?.baselineUnitRate || null,
      productivityIndex,
      trendDirection,
      totalQuantityInstalled: totalQuantity,
      percentComplete,
      isAtRisk,
      daysBehind: Math.max(0, daysBehind),
    };

    costCodeSummaries.push(summary);

    if (productivityIndex !== null) {
      productivityIndices.push(productivityIndex);
    }
  }

  // Calculate overall metrics
  let overallProductivityIndex: number | null = null;
  if (productivityIndices.length > 0) {
    overallProductivityIndex =
      productivityIndices.reduce((sum: number, idx: number) => sum + idx, 0) / productivityIndices.length;
  }

  const atRiskCount = costCodeSummaries.filter((s: CostCodeSummary) => s.isAtRisk).length;

  return {
    projectId,
    costCodeSummaries,
    overallProductivityIndex,
    atRiskCount,
    totalCostCodes: costCodes.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Helper function to build crew composition from daily log manpower entries
 * Aggregates all manpower entries into a single composition
 * @param dailyLog The daily log with manpower entries
 * @returns CrewComposition object
 */
function buildCrewComposition(dailyLog: DailyLog): CrewComposition {
  if (!dailyLog.manpower || dailyLog.manpower.length === 0) {
    return {
      journeymen: 0,
      apprentices: 0,
      foremen: 0,
    };
  }

  let totalJourneymen = 0;
  let totalApprentices = 0;
  let totalForemen = 0;

  for (const entry of dailyLog.manpower) {
    totalJourneymen += entry.journeymanCount || 0;
    totalApprentices += entry.apprenticeCount || 0;
    totalForemen += entry.foremanCount || 0;
  }

  return {
    journeymen: totalJourneymen,
    apprentices: totalApprentices,
    foremen: totalForemen,
  };
}
