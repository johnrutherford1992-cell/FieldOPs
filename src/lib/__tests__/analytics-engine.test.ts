import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCostCode, createMockProductivityEntry } from "./fixtures";
import type { CostCode, ProductivityEntry } from "@/lib/types";

// ── Mock the database module ──
const mockFilter = vi.fn();
const mockAdd = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    costCodes: {
      filter: (...args: unknown[]) => ({ toArray: () => mockFilter("costCodes", ...args) }),
    },
    productivityEntries: {
      filter: (...args: unknown[]) => ({ toArray: () => mockFilter("productivityEntries", ...args) }),
    },
    bidFeedbackReports: {
      add: (...args: unknown[]) => mockAdd("bidFeedbackReports", ...args),
    },
  },
  generateId: (prefix: string) => `${prefix}-test-id`,
}));

import { generateBidFeedbackReport } from "@/lib/analytics-engine";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateBidFeedbackReport", () => {
  // Helper to set up one cost code with entries that produce a specific variance
  function setupMockData(bidRate: number, actualLaborCostPerUnit: number) {
    // To get the desired actual rate:
    // actualRate = totalLaborCost / totalQuantity
    // totalLaborCost = laborHours * $65
    // So laborHours = (actualRate * quantity) / 65
    const quantity = 100;
    const laborHours = (actualLaborCostPerUnit * quantity) / 65;

    const costCode = createMockCostCode({
      budgetedUnitPrice: bidRate,
    });

    const entry = createMockProductivityEntry({
      quantityInstalled: quantity,
      laborHoursExpended: laborHours,
    });

    mockFilter.mockImplementation((table: string) => {
      if (table === "costCodes") return [costCode];
      if (table === "productivityEntries") return [entry];
      return [];
    });
    mockAdd.mockResolvedValue(undefined);

    return { costCode, entry };
  }

  // ────────────────────────────────────────────────────────
  // TEST 5: Variance thresholds produce correct recommendations
  // ────────────────────────────────────────────────────────
  it.each([
    { bidRate: 10, actualRate: 12, label: "CRITICAL", desc: ">15% overrun" },
    { bidRate: 10, actualRate: 11, label: "CAUTION", desc: "5-15% overrun" },
    { bidRate: 10, actualRate: 10.3, label: "ON TARGET", desc: "within ±5%" },
    { bidRate: 10, actualRate: 9, label: "OPPORTUNITY", desc: ">5% under bid" },
  ])(
    'produces "$label" recommendation for $desc (bid=$bidRate, actual=$actualRate)',
    async ({ bidRate, actualRate, label }) => {
      setupMockData(bidRate, actualRate);

      const report = await generateBidFeedbackReport("proj-001", "Test Project");

      expect(report.keyFindings).toHaveLength(1);
      const finding = report.keyFindings[0]!;
      expect(finding.recommendation).toContain(label);
    }
  );

  // ────────────────────────────────────────────────────────
  // TEST 6: Adjustment recommendation uses 70/30 blend
  // ────────────────────────────────────────────────────────
  it("generates adjustment recommendation with 70% actual + 30% bid blend when |variance| > 5%", async () => {
    const bidRate = 10;
    const actualRate = 15; // 50% variance → triggers adjustment

    setupMockData(bidRate, actualRate);

    const report = await generateBidFeedbackReport("proj-001", "Test Project");

    expect(report.adjustmentRecommendations).toHaveLength(1);
    const rec = report.adjustmentRecommendations[0]!;

    // recommendedRate = actualRate * 0.7 + bidRate * 0.3
    const expectedRate = actualRate * 0.7 + bidRate * 0.3;
    expect(rec.recommendedRate).toBeCloseTo(expectedRate, 2);
    expect(rec.currentBidRate).toBe(bidRate);
    expect(rec.confidence).toBeLessThanOrEqual(1);
  });
});
