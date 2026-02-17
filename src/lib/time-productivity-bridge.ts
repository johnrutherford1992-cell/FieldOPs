import { db, generateId } from "./db";
import type { TimeEntry, ProductivityEntry, CostCode, CrewComposition } from "./types";

// ============================================================
// Time → Productivity Bridge
// Derives productivity entries from approved time entries,
// linking the time tracking module into the existing
// measured-mile productivity analytics pipeline.
// ============================================================

/**
 * Groups time entries by cost code and date, then creates or updates
 * productivity entries that feed the analytics engine.
 *
 * Call this after time entries are approved to keep productivity
 * dashboards current.
 */
export async function deriveProductivityFromTimeEntries(
  projectId: string,
  date: string
): Promise<void> {
  // Get all approved time entries for this date
  const timeEntries = await db.timeEntries
    .where({ projectId, date })
    .filter((e) => e.approvalStatus === "approved" || e.approvalStatus === "exported")
    .toArray();

  if (timeEntries.length === 0) return;

  // Group by cost code
  const byCostCode: Record<string, TimeEntry[]> = {};
  for (const entry of timeEntries) {
    if (!entry.costCodeId) continue;
    if (!byCostCode[entry.costCodeId]) byCostCode[entry.costCodeId] = [];
    byCostCode[entry.costCodeId].push(entry);
  }

  // For each cost code group, create/update a productivity entry
  for (const [costCodeId, entries] of Object.entries(byCostCode)) {
    const costCode = await db.costCodes.get(costCodeId);
    if (!costCode) continue;

    const totalLaborHours = entries.reduce((s, e) => s + e.totalHours, 0);
    const crewSize = entries.length;
    const overtimeHours = entries.reduce((s, e) => s + e.overtimeHours, 0);

    // Check if there's an existing productivity entry for this cost code + date
    const existing = await db.productivityEntries
      .where({ projectId })
      .filter(
        (pe) => pe.date === date && pe.costCodeId === costCodeId
      )
      .first();

    // Estimate crew composition from worker trades
    const crewComp: CrewComposition = {
      journeymen: entries.filter((e) => e.workerName.includes("Journeyman")).length || Math.floor(crewSize * 0.7),
      apprentices: entries.filter((e) => e.workerName.includes("Apprentice")).length || Math.floor(crewSize * 0.2),
      foremen: entries.filter((e) => e.workerName.includes("Foreman")).length || Math.max(1, Math.floor(crewSize * 0.1)),
    };

    // Compute unit rate if budgeted data is available
    const computedUnitRate = costCode.budgetedLaborHoursPerUnit > 0
      ? 1 / costCode.budgetedLaborHoursPerUnit
      : undefined;

    const productivityEntry: ProductivityEntry = {
      id: existing?.id || generateId("prod"),
      projectId,
      dailyLogId: entries[0].dailyLogId || "",
      date,
      costCodeId,
      csiDivision: costCode.csiDivision,
      activity: costCode.activity,
      taktZone: entries[0].taktZone || "",
      quantityInstalled: 0, // Updated separately from work performed screen
      unitOfMeasure: costCode.unitOfMeasure,
      crewSize,
      crewComposition: crewComp,
      laborHoursExpended: totalLaborHours,
      overtimeHoursIncluded: overtimeHours > 0,
      reworkIncluded: false,
      computedUnitRate,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.productivityEntries.put(productivityEntry);
  }
}

/**
 * Compute weekly time summary for a project — useful for
 * the ADP export review screen and payroll reconciliation.
 */
export async function computeWeeklyTimeSummary(
  projectId: string,
  weekStartDate: string,
  weekEndDate: string
): Promise<{
  byWorker: Record<
    string,
    {
      workerName: string;
      trade: string;
      regularHours: number;
      overtimeHours: number;
      doubleTimeHours: number;
      totalHours: number;
      entries: number;
      allApproved: boolean;
      allExported: boolean;
    }
  >;
  totals: {
    workers: number;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    totalHours: number;
    pendingApproval: number;
    readyForExport: number;
    exported: number;
  };
}> {
  const entries = await db.timeEntries
    .where("projectId")
    .equals(projectId)
    .filter((e) => e.date >= weekStartDate && e.date <= weekEndDate)
    .toArray();

  const byWorker: Record<string, {
    workerName: string;
    trade: string;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    totalHours: number;
    entries: number;
    allApproved: boolean;
    allExported: boolean;
  }> = {};

  for (const entry of entries) {
    if (!byWorker[entry.workerId]) {
      byWorker[entry.workerId] = {
        workerName: entry.workerName,
        trade: entry.trade,
        regularHours: 0,
        overtimeHours: 0,
        doubleTimeHours: 0,
        totalHours: 0,
        entries: 0,
        allApproved: true,
        allExported: true,
      };
    }
    const w = byWorker[entry.workerId];
    w.regularHours += entry.regularHours;
    w.overtimeHours += entry.overtimeHours;
    w.doubleTimeHours += entry.doubleTimeHours;
    w.totalHours += entry.totalHours;
    w.entries += 1;
    if (entry.approvalStatus !== "approved" && entry.approvalStatus !== "exported") {
      w.allApproved = false;
    }
    if (!entry.adpExported) {
      w.allExported = false;
    }
  }

  const workerValues = Object.values(byWorker);

  return {
    byWorker,
    totals: {
      workers: workerValues.length,
      regularHours: workerValues.reduce((s, w) => s + w.regularHours, 0),
      overtimeHours: workerValues.reduce((s, w) => s + w.overtimeHours, 0),
      doubleTimeHours: workerValues.reduce((s, w) => s + w.doubleTimeHours, 0),
      totalHours: workerValues.reduce((s, w) => s + w.totalHours, 0),
      pendingApproval: entries.filter((e) => e.approvalStatus === "pending").length,
      readyForExport: entries.filter(
        (e) => e.approvalStatus === "approved" && !e.adpExported
      ).length,
      exported: entries.filter((e) => e.adpExported).length,
    },
  };
}
