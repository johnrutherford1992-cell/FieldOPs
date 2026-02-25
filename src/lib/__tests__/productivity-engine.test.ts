import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockDailyLog,
  createMockCostCode,
  createMockProductivityEntry,
  createMockWorkPerformed,
} from "./fixtures";

// ── Mock the database module ──
const mockFilter = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    costCodes: { filter: (...args: unknown[]) => ({ toArray: () => mockFilter("costCodes", ...args) }) },
    productivityEntries: {
      filter: (...args: unknown[]) => ({ toArray: () => mockFilter("productivityEntries", ...args) }),
      add: (...args: unknown[]) => mockAdd("productivityEntries", ...args),
    },
    productivityBaselines: {
      filter: (...args: unknown[]) => ({ toArray: () => mockFilter("productivityBaselines", ...args) }),
      add: (...args: unknown[]) => mockAdd("productivityBaselines", ...args),
      update: (...args: unknown[]) => mockUpdate("productivityBaselines", ...args),
    },
  },
  generateId: (prefix: string) => `${prefix}-test-id`,
}));

import {
  deriveProductivityEntries,
  establishBaseline,
} from "@/lib/productivity-engine";

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────
// TEST 1: Core metric calculations
// ────────────────────────────────────────────────────────
describe("deriveProductivityEntries", () => {
  it("calculates unit rate, productivity index, and labor cost correctly", async () => {
    const costCode = createMockCostCode({
      budgetedLaborHoursPerUnit: 0.5, // 0.5 hours per unit budgeted
    });

    // DB returns the matching cost code
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockFilter.mockImplementation((table: string, _filterFn: (item: unknown) => boolean) => {
      if (table === "costCodes") return [costCode];
      return [];
    });
    mockAdd.mockResolvedValue(undefined);

    const dailyLog = createMockDailyLog({
      workPerformed: [
        createMockWorkPerformed({
          quantity: 100,
          crewHoursWorked: 56,
          costCodeId: "cc-001",
        }),
      ],
    });

    const entries = await deriveProductivityEntries(dailyLog, "proj-001");

    expect(entries).toHaveLength(1);
    const entry = entries[0]!;

    // unitRate = quantity / laborHours = 100 / 56 ≈ 1.786
    expect(entry.computedUnitRate).toBeCloseTo(100 / 56, 4);

    // productivityIndex = budgetedHrsPerUnit / actualHrsPerUnit
    // actualHrsPerUnit = 56 / 100 = 0.56
    // productivityIndex = 0.5 / 0.56 ≈ 0.893
    expect(entry.computedProductivityIndex).toBeCloseTo(0.5 / (56 / 100), 4);

    // laborCostPerUnit = (hours × $65) / quantity = (56 × 65) / 100 = $36.40
    expect(entry.computedLaborCostPerUnit).toBeCloseTo((56 * 65) / 100, 2);
  });

  // ────────────────────────────────────────────────────────
  // TEST 2: Skips invalid entries
  // ────────────────────────────────────────────────────────
  it("skips entries with zero quantity or zero hours", async () => {
    mockFilter.mockResolvedValue([]);
    mockAdd.mockResolvedValue(undefined);

    const dailyLog = createMockDailyLog({
      workPerformed: [
        createMockWorkPerformed({ quantity: 0, crewHoursWorked: 56 }),
        createMockWorkPerformed({ quantity: 100, crewHoursWorked: 0 }),
        createMockWorkPerformed({ quantity: undefined as unknown as number, crewHoursWorked: 56 }),
      ],
    });

    const entries = await deriveProductivityEntries(dailyLog, "proj-001");

    expect(entries).toHaveLength(0);
    expect(mockAdd).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
// TEST 3: Baseline minimum data points
// ────────────────────────────────────────────────────────
describe("establishBaseline", () => {
  it("returns null with fewer than 5 data points", async () => {
    // Return only 3 entries (below MINIMUM_BASELINE_DATA_POINTS = 5)
    mockFilter.mockImplementation((table: string) => {
      if (table === "productivityEntries") {
        return [
          createMockProductivityEntry({ id: "pe-1", computedUnitRate: 1.8 }),
          createMockProductivityEntry({ id: "pe-2", computedUnitRate: 1.9 }),
          createMockProductivityEntry({ id: "pe-3", computedUnitRate: 1.7 }),
        ];
      }
      return [];
    });

    const result = await establishBaseline("proj-001", "cc-001", "2025-06-01", "2025-06-30");

    expect(result).toBeNull();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────
  // TEST 4: Confidence scoring tiers
  // ────────────────────────────────────────────────────────
  it.each([
    { count: 5, expectedConfidence: 0.6 },
    { count: 12, expectedConfidence: 0.75 },
    { count: 17, expectedConfidence: 0.85 },
    { count: 25, expectedConfidence: 0.95 },
  ])(
    "assigns confidence $expectedConfidence for $count data points",
    async ({ count, expectedConfidence }) => {
      const entries = Array.from({ length: count }, (_, i) =>
        createMockProductivityEntry({
          id: `pe-${i}`,
          computedUnitRate: 1.8 + Math.random() * 0.2,
          crewSize: 7,
          crewComposition: { journeymen: 4, apprentices: 2, foremen: 1 },
        })
      );

      mockFilter.mockImplementation((table: string) => {
        if (table === "productivityEntries") return entries;
        if (table === "productivityBaselines") return []; // no existing baseline
        return [];
      });
      mockAdd.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue(undefined);

      const result = await establishBaseline("proj-001", "cc-001", "2025-06-01", "2025-06-30");

      expect(result).not.toBeNull();
      expect(result!.confidence).toBe(expectedConfidence);
      expect(result!.sampleSize).toBe(count);
      expect(result!.isActive).toBe(true);
      expect(result!.source).toBe("early_period");
    }
  );
});
