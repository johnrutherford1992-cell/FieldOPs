// ============================================================
// ANALYTICS ENGINE — Phase 3 Analytics & Feedback Service
// Handles auto-triggered recomputation, bid feedback reports,
// and unit price library management
// ============================================================

import { db, generateId } from "@/lib/db";
import {
  ProductivityEntry,
  ProductivityAnalytics,
  CostCode,
  BidFeedbackReport,
  UnitPriceLibrary,
  TrendDirection,
  AnalyticsPeriod,
  ImpactFactor,
} from "@/lib/types";

// ────────────────────────────────────────────────────────
// CONSTANT: Labor rate assumption for cost calculations
// ────────────────────────────────────────────────────────

const STANDARD_LABOR_RATE_PER_HOUR = 65;

// ────────────────────────────────────────────────────────
// 1. RECOMPUTE ANALYTICS
// ────────────────────────────────────────────────────────

/**
 * Recompute project_to_date analytics for all active cost codes in a project.
 * Deletes existing project_to_date records and creates new ones from scratch.
 */
export async function recomputeAnalytics(
  projectId: string
): Promise<ProductivityAnalytics[]> {
  // Fetch all active cost codes for this project
  const costCodes = await db.costCodes
    .filter((cc: CostCode) => cc.projectId === projectId && cc.isActive)
    .toArray();

  const newAnalytics: ProductivityAnalytics[] = [];

  for (const costCode of costCodes) {
    // Fetch all productivity entries for this cost code
    const entries = await db.productivityEntries
      .filter(
        (pe: ProductivityEntry) =>
          pe.projectId === projectId && pe.costCodeId === costCode.id
      )
      .toArray();

    // Skip if fewer than 3 entries
    if (entries.length < 3) {
      continue;
    }

    // Sort entries by date
    entries.sort(
      (a: ProductivityEntry, b: ProductivityEntry) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate averageUnitRate, peakUnitRate, lowUnitRate
    const unitRates = entries
      .map((e: ProductivityEntry) => e.computedUnitRate ?? 0)
      .filter((rate: number) => rate > 0);

    const averageUnitRate =
      unitRates.length > 0
        ? unitRates.reduce((sum: number, rate: number) => sum + rate, 0) /
          unitRates.length
        : 0;

    const peakUnitRate = Math.max(...unitRates, 0);
    const lowUnitRate = Math.min(...unitRates, Infinity);

    // Calculate standardDeviation
    const variance =
      unitRates.length > 1
        ? unitRates.reduce(
            (sum: number, rate: number) =>
              sum + Math.pow(rate - averageUnitRate, 2),
            0
          ) / unitRates.length
        : 0;
    const standardDeviation = Math.sqrt(variance);

    // Trend: compare first 1/3 vs last 1/3 (within 5% threshold)
    const thresholdLength = Math.ceil(entries.length / 3);
    const firstThirdEntries = entries.slice(0, thresholdLength);
    const lastThirdEntries = entries.slice(-thresholdLength);

    const firstThirdAvg =
      firstThirdEntries.reduce(
        (sum: number, e: ProductivityEntry) =>
          sum + (e.computedUnitRate ?? 0),
        0
      ) / firstThirdEntries.length;

    const lastThirdAvg =
      lastThirdEntries.reduce(
        (sum: number, e: ProductivityEntry) =>
          sum + (e.computedUnitRate ?? 0),
        0
      ) / lastThirdEntries.length;

    const percentChange = ((lastThirdAvg - firstThirdAvg) / firstThirdAvg) * 100;

    let trendDirection: TrendDirection;
    if (percentChange > 5) {
      trendDirection = "improving";
    } else if (percentChange < -5) {
      trendDirection = "declining";
    } else {
      trendDirection = "stable";
    }

    const trendMagnitude = Math.abs(percentChange);

    // Sum up totals
    const totalQuantityInstalled = entries.reduce(
      (sum: number, e: ProductivityEntry) => sum + e.quantityInstalled,
      0
    );

    const totalLaborHours = entries.reduce(
      (sum: number, e: ProductivityEntry) => sum + e.laborHoursExpended,
      0
    );

    const totalEquipmentHours = entries.reduce(
      (sum: number, e: ProductivityEntry) =>
        sum + (e.equipmentHoursExpended ?? 0),
      0
    );

    // Variance calculations against cost code budget
    const budgetedQuantity = costCode.budgetedQuantity;
    const budgetedUnitPrice = costCode.budgetedUnitPrice;

    // Planned vs actual variance
    const plannedVsActualVariance =
      budgetedQuantity > 0
        ? ((totalQuantityInstalled - budgetedQuantity) / budgetedQuantity) * 100
        : 0;

    // Cost variance: budget vs actual spending
    const budgetedTotalCost = budgetedQuantity * budgetedUnitPrice;
    const actualTotalCost =
      totalQuantityInstalled * averageUnitRate * STANDARD_LABOR_RATE_PER_HOUR;
    const costVariance = budgetedTotalCost - actualTotalCost;

    // Schedule variance: assume simple linear correlation
    const scheduleVariance = 0;

    // Period dates
    const periodStart = entries[0]!.date;
    const periodEnd = entries[entries.length - 1]!.date;

    // Impact factors (simplified)
    const impactFactors: { factor: ImpactFactor; magnitude: number; description: string }[] = [];

    // Create analytics record
    const analyticsRecord: ProductivityAnalytics = {
      id: generateId("pa"),
      projectId,
      costCodeId: costCode.id,
      periodType: "project_to_date" as AnalyticsPeriod,
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
      impactFactors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newAnalytics.push(analyticsRecord);
  }

  // Delete existing project_to_date analytics for this project
  const existingAnalytics = await db.productivityAnalytics
    .filter(
      (pa: ProductivityAnalytics) =>
        pa.projectId === projectId && pa.periodType === "project_to_date"
    )
    .toArray();

  for (const existing of existingAnalytics) {
    await db.productivityAnalytics.delete(existing.id);
  }

  // Insert new analytics records
  await db.productivityAnalytics.bulkAdd(newAnalytics);

  return newAnalytics;
}

// ────────────────────────────────────────────────────────
// 2. GENERATE BID FEEDBACK REPORT
// ────────────────────────────────────────────────────────

/**
 * Generate a bid feedback report comparing actual field performance
 * to original bid estimates.
 */
export async function generateBidFeedbackReport(
  projectId: string,
  projectName: string
): Promise<BidFeedbackReport> {
  // Fetch all active cost codes with productivity data
  const costCodes = await db.costCodes
    .filter((cc: CostCode) => cc.projectId === projectId && cc.isActive)
    .toArray();

  const keyFindings: BidFeedbackReport["keyFindings"] = [];
  const adjustmentRecommendations: BidFeedbackReport["adjustmentRecommendations"] = [];

  for (const costCode of costCodes) {
    // Fetch productivity entries for this cost code
    const entries = await db.productivityEntries
      .filter(
        (pe: ProductivityEntry) =>
          pe.projectId === projectId && pe.costCodeId === costCode.id
      )
      .toArray();

    if (entries.length === 0) {
      continue;
    }

    // Calculate actual rate
    const totalQuantity = entries.reduce(
      (sum: number, e: ProductivityEntry) => sum + e.quantityInstalled,
      0
    );

    const totalLaborCost = entries.reduce(
      (sum: number, e: ProductivityEntry) =>
        sum + e.laborHoursExpended * STANDARD_LABOR_RATE_PER_HOUR,
      0
    );

    const actualRate =
      totalQuantity > 0 ? totalLaborCost / totalQuantity : 0;

    // Bid rate
    const bidRate = costCode.budgetedUnitPrice;

    // Variance percentage
    const variance = bidRate > 0 ? ((actualRate - bidRate) / bidRate) * 100 : 0;

    // Generate recommendation
    let recommendation: string;
    if (variance > 15) {
      const overage = ((actualRate - bidRate) / bidRate * 100).toFixed(1);
      recommendation = `CRITICAL: Actual costs exceeded bid by ${overage}%. Review crew productivity, material waste, and consider adjusting bid rate to $${actualRate.toFixed(2)} for future projects.`;
    } else if (variance >= 5 && variance <= 15) {
      const overage = variance.toFixed(1);
      recommendation = `CAUTION: Slight cost overrun of ${overage}%. Monitor crew efficiency and consider minor bid adjustment.`;
    } else if (variance >= -5 && variance < 5) {
      recommendation = `ON TARGET: Actual costs within 5% of bid. Current rate is well-calibrated.`;
    } else {
      const savings = (Math.abs(variance)).toFixed(1);
      recommendation = `OPPORTUNITY: Actual costs ${savings}% below bid. Current bid may be overly conservative. Consider tightening to $${actualRate.toFixed(2)} to improve competitiveness.`;
    }

    // Add to key findings
    keyFindings.push({
      costCodeId: costCode.id,
      costCodeDescription: costCode.description,
      bidRate,
      actualRate,
      variance,
      recommendation,
    });

    // If variance > 5%, add to adjustment recommendations
    if (Math.abs(variance) > 5) {
      const recommendedRate = actualRate * 0.7 + bidRate * 0.3;
      adjustmentRecommendations.push({
        csiDivision: costCode.csiDivision,
        activity: costCode.activity,
        currentBidRate: bidRate,
        recommendedRate,
        confidence: Math.min(entries.length / 10, 1),
        basis: `Based on ${entries.length} field entries with actual rate of $${actualRate.toFixed(2)}`,
      });
    }
  }

  // Condition notes
  const conditionNotes = `Bid feedback report for ${projectName} generated on ${new Date().toLocaleDateString()}. Analysis covers ${keyFindings.length} cost codes with measured field data.`;

  // Lessons learned (3-5 insights)
  const lessonsLearned: string[] = [];

  // Insight 1: Overall performance
  const avgVariance =
    keyFindings.length > 0
      ? keyFindings.reduce((sum, kf) => sum + kf.variance, 0) /
        keyFindings.length
      : 0;
  if (avgVariance > 10) {
    lessonsLearned.push(
      "Overall crew productivity was below bid estimates. Consider increasing labor contingency in future similar projects."
    );
  } else if (avgVariance < -10) {
    lessonsLearned.push(
      "Team exceeded productivity expectations. Investigate which practices drove outperformance for replication."
    );
  } else {
    lessonsLearned.push(
      "Labor productivity aligned well with bid estimates. Maintain current crew composition and methods."
    );
  }

  // Insight 2: Cost code variance distribution
  const highVarianceCodes = keyFindings.filter(
    (kf) => Math.abs(kf.variance) > 15
  );
  if (highVarianceCodes.length > 0) {
    lessonsLearned.push(
      `${highVarianceCodes.length} cost codes showed significant variance. Prioritize root cause analysis for these activities.`
    );
  }

  // Insight 3: Adjustment recommendations
  if (adjustmentRecommendations.length > 0) {
    lessonsLearned.push(
      `Generated ${adjustmentRecommendations.length} bid rate adjustments based on actual field performance for improved future competitiveness.`
    );
  }

  // Insight 4: Sample size
  if (keyFindings.length < 5) {
    lessonsLearned.push(
      "Limited cost code sample. Gather more field data for higher confidence adjustments."
    );
  } else {
    lessonsLearned.push(
      `Analyzed ${keyFindings.length} cost codes providing robust basis for adjustments and lessons.`
    );
  }

  // Create report
  const report: BidFeedbackReport = {
    id: generateId("bfr"),
    projectId,
    generatedDate: new Date().toISOString(),
    costCodesAnalyzed: keyFindings.length,
    keyFindings,
    adjustmentRecommendations,
    conditionNotes,
    lessonsLearned: lessonsLearned.slice(0, 5),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to database
  await db.bidFeedbackReports.add(report);

  return report;
}

// ────────────────────────────────────────────────────────
// 3. UPDATE UNIT PRICE LIBRARY
// ────────────────────────────────────────────────────────

/**
 * Update the company-wide unit price library from project productivity data.
 * Creates new entries or updates existing ones with historical rates.
 */
export async function updateUnitPriceLibrary(
  projectId: string,
  projectName: string
): Promise<UnitPriceLibrary[]> {
  const updatedEntries: UnitPriceLibrary[] = [];

  // Fetch all active cost codes with productivity data
  const costCodes = await db.costCodes
    .filter((cc: CostCode) => cc.projectId === projectId && cc.isActive)
    .toArray();

  for (const costCode of costCodes) {
    // Fetch productivity entries for this cost code
    const entries = await db.productivityEntries
      .filter(
        (pe: ProductivityEntry) =>
          pe.projectId === projectId && pe.costCodeId === costCode.id
      )
      .toArray();

    if (entries.length === 0) {
      continue;
    }

    // Calculate actual unit cost (labor-based)
    const totalQuantity = entries.reduce(
      (sum: number, e: ProductivityEntry) => sum + e.quantityInstalled,
      0
    );

    const totalLaborCost = entries.reduce(
      (sum: number, e: ProductivityEntry) =>
        sum + e.laborHoursExpended * STANDARD_LABOR_RATE_PER_HOUR,
      0
    );

    const actualUnitRate =
      totalQuantity > 0 ? totalLaborCost / totalQuantity : 0;

    // Check if UnitPriceLibrary entry already exists
    const existingEntry = await db.unitPriceLibrary
      .filter(
        (upl: UnitPriceLibrary) =>
          upl.organizationId === "blackstone-construction" &&
          upl.csiDivision === costCode.csiDivision &&
          upl.activity === costCode.activity
      )
      .toArray();

    const now = new Date().toISOString();
    const historicalRateEntry = {
      projectId,
      projectName,
      date: now,
      unitRate: actualUnitRate,
      conditions: costCode.notes,
      adjustmentFactors: {},
    };

    if (existingEntry.length > 0) {
      // Update existing entry
      const current = existingEntry[0]!;

      // Add new historical rate
      const updatedHistoricalRates = [
        ...current.historicalRates,
        historicalRateEntry,
      ];

      // Recalculate currentUnitPrice as weighted average (recent projects weighted more)
      const weights = updatedHistoricalRates.map(
        (_: { unitRate: number }, idx: number) =>
          idx + 1
      );
      const totalWeight = weights.reduce((sum: number, w: number) => sum + w, 0);
      const weightedPrice = updatedHistoricalRates.reduce(
        (sum: number, rate: { unitRate: number }, idx: number) =>
          sum + rate.unitRate * weights[idx]!,
        0
      ) / totalWeight;

      const updated: UnitPriceLibrary = {
        ...current,
        currentUnitPrice: weightedPrice,
        lastUpdatedFromProject: projectId,
        lastUpdatedDate: now,
        historicalRates: updatedHistoricalRates,
        updatedAt: now,
      };

      await db.unitPriceLibrary.put(updated);
      updatedEntries.push(updated);
    } else {
      // Create new entry
      const newEntry: UnitPriceLibrary = {
        id: generateId("upl"),
        organizationId: "blackstone-construction",
        csiDivision: costCode.csiDivision,
        activity: costCode.activity,
        description: costCode.description,
        unitOfMeasure: costCode.unitOfMeasure,
        currentUnitPrice: actualUnitRate,
        laborComponent: actualUnitRate * 0.65,
        materialComponent: actualUnitRate * 0.25,
        equipmentComponent: actualUnitRate * 0.1,
        lastUpdatedFromProject: projectId,
        lastUpdatedDate: now,
        historicalRates: [historicalRateEntry],
        seasonalAdjustments: [
          { quarter: "Q1", factor: 1.05 },
          { quarter: "Q2", factor: 1.0 },
          { quarter: "Q3", factor: 1.0 },
          { quarter: "Q4", factor: 1.1 },
        ],
        complexityTiers: [
          { tier: "standard", factor: 1.0 },
          { tier: "complex", factor: 1.15 },
          { tier: "premium", factor: 1.3 },
        ],
        createdAt: now,
        updatedAt: now,
      };

      await db.unitPriceLibrary.add(newEntry);
      updatedEntries.push(newEntry);
    }
  }

  return updatedEntries;
}

// ────────────────────────────────────────────────────────
// 4. GET UNIT PRICE BOOK
// ────────────────────────────────────────────────────────

/**
 * Retrieve the full unit price library, optionally filtered by organization.
 */
export async function getUnitPriceBook(
  organizationId?: string
): Promise<UnitPriceLibrary[]> {
  if (organizationId) {
    return await db.unitPriceLibrary
      .filter((upl: UnitPriceLibrary) => upl.organizationId === organizationId)
      .toArray();
  }

  return await db.unitPriceLibrary.toArray();
}

// ────────────────────────────────────────────────────────
// 5. GET BID FEEDBACK REPORTS
// ────────────────────────────────────────────────────────

/**
 * Retrieve all bid feedback reports for a project, sorted by date descending.
 */
export async function getBidFeedbackReports(
  projectId: string
): Promise<BidFeedbackReport[]> {
  const reports = await db.bidFeedbackReports
    .filter((bfr: BidFeedbackReport) => bfr.projectId === projectId)
    .toArray();

  // Sort by date descending
  return reports.sort(
    (a: BidFeedbackReport, b: BidFeedbackReport) =>
      new Date(b.generatedDate).getTime() -
      new Date(a.generatedDate).getTime()
  );
}
