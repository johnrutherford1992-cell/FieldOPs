import type {
  DailyLog,
  CostCode,
  ProductivityEntry,
  Project,
  ManpowerEntry,
  WorkPerformedEntry,
} from "@/lib/types";

export function createMockManpowerEntry(
  overrides: Partial<ManpowerEntry> = {}
): ManpowerEntry {
  return {
    subId: "sub-001",
    trade: "Concrete",
    journeymanCount: 4,
    apprenticeCount: 2,
    foremanCount: 1,
    hoursWorked: 8,
    overtimeHours: 0,
    ...overrides,
  };
}

export function createMockWorkPerformed(
  overrides: Partial<WorkPerformedEntry> = {}
): WorkPerformedEntry {
  return {
    csiDivision: "03",
    activity: "Concrete Forming",
    taktZone: "L1-A",
    status: "in_progress",
    quantity: 100,
    unitOfMeasure: "SF",
    crewSize: 7,
    crewHoursWorked: 56,
    percentComplete: 25,
    costCodeId: "cc-001",
    ...overrides,
  };
}

export function createMockDailyLog(
  overrides: Partial<DailyLog> = {}
): DailyLog {
  return {
    id: "log-001",
    projectId: "proj-001",
    date: "2025-06-15",
    superintendentId: "user-001",
    weather: {
      conditions: "Clear",
      temperature: 75,
      impact: "full_day" as const,
    },
    manpower: [createMockManpowerEntry()],
    equipment: [],
    workPerformed: [createMockWorkPerformed()],
    inspections: [],
    changes: [],
    conflicts: [],
    photos: [],
    notes: "",
    tomorrowPlan: [],
    createdAt: "2025-06-15T06:00:00.000Z",
    updatedAt: "2025-06-15T18:00:00.000Z",
    ...overrides,
  };
}

export function createMockCostCode(
  overrides: Partial<CostCode> = {}
): CostCode {
  return {
    id: "cc-001",
    projectId: "proj-001",
    code: "03-3100-F",
    csiDivision: "03",
    activity: "Concrete Forming",
    description: "Concrete forming for walls and columns",
    unitOfMeasure: "SF",
    budgetedQuantity: 5000,
    budgetedUnitPrice: 12.5,
    budgetedLaborHoursPerUnit: 0.5,
    budgetedCrewSize: 7,
    budgetedCrewMix: { journeymen: 4, apprentices: 2, foremen: 1 },
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMockProductivityEntry(
  overrides: Partial<ProductivityEntry> = {}
): ProductivityEntry {
  return {
    id: "pe-001",
    projectId: "proj-001",
    dailyLogId: "log-001",
    date: "2025-06-15",
    costCodeId: "cc-001",
    csiDivision: "03",
    activity: "Concrete Forming",
    taktZone: "L1-A",
    quantityInstalled: 100,
    unitOfMeasure: "SF",
    crewSize: 7,
    crewComposition: { journeymen: 4, apprentices: 2, foremen: 1 },
    laborHoursExpended: 56,
    overtimeHoursIncluded: false,
    reworkIncluded: false,
    computedUnitRate: 100 / 56, // ~1.786
    computedProductivityIndex: 0.5 / (56 / 100), // 0.5/0.56 = ~0.893
    computedLaborCostPerUnit: (56 * 65) / 100, // $36.40
    createdAt: "2025-06-15T18:00:00.000Z",
    updatedAt: "2025-06-15T18:00:00.000Z",
    ...overrides,
  };
}

export function createMockProject(
  overrides: Partial<Project> = {}
): Project {
  return {
    id: "proj-001",
    name: "Blackstone Mixed-Use Tower",
    address: "123 Main Street",
    client: "Blackstone Development LLC",
    contractValue: 15000000,
    startDate: "2025-01-15",
    endDate: "2026-06-30",
    projectType: "Mixed-Use Commercial",
    taktZones: [],
    subcontractors: [],
    teamMembers: [],
    equipmentLibrary: [],
    contracts: { subAgreements: [] },
    emergencyContacts: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-15T00:00:00.000Z",
    ...overrides,
  };
}
