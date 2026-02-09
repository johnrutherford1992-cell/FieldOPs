import Dexie, { type Table } from "dexie";
import type {
  Project,
  DailyJHA,
  DailyLog,
  WeeklyReport,
  ChangeOrder,
  LegalCorrespondence,
  // Phase 6: New entities
  DelayEvent,
  SafetyIncident,
  NoticeLogEntry,
  CostCode,
  ProductivityEntry,
  ProductivityBaseline,
  ProductivityAnalytics,
  UnitPriceLibrary,
  BidFeedbackReport,
  ScheduleBaseline,
  AppUser,
} from "./types";

// ============================================================
// FieldOps IndexedDB Database (via Dexie.js)
// Version 2: Structured Data Architecture
// ============================================================

// Draft shape stored in dailyLogDrafts table
export interface DailyLogDraft {
  id: string; // "{projectId}:{date}"
  projectId: string;
  date: string;
  currentScreen: string;
  weather: DailyLog["weather"];
  manpower: DailyLog["manpower"];
  equipment: DailyLog["equipment"];
  workPerformed: DailyLog["workPerformed"];
  rfis: DailyLog["rfis"];
  submittals: DailyLog["submittals"];
  inspections: DailyLog["inspections"];
  changes: DailyLog["changes"];
  conflicts: DailyLog["conflicts"];
  delayEvents?: DailyLog["delayEvents"];
  safetyIncidents?: DailyLog["safetyIncidents"];
  photos: DailyLog["photos"];
  notes: string;
  tomorrowPlan: string[];
  savedAt: string; // ISO timestamp
}

class FieldOpsDB extends Dexie {
  // ── Original tables ──
  projects!: Table<Project, string>;
  dailyJHAs!: Table<DailyJHA, string>;
  dailyLogs!: Table<DailyLog, string>;
  weeklyReports!: Table<WeeklyReport, string>;
  changeOrders!: Table<ChangeOrder, string>;
  legalCorrespondence!: Table<LegalCorrespondence, string>;

  // ── Phase 6: New tables ──
  delayEvents!: Table<DelayEvent, string>;
  safetyIncidents!: Table<SafetyIncident, string>;
  noticeLogs!: Table<NoticeLogEntry, string>;
  costCodes!: Table<CostCode, string>;
  productivityEntries!: Table<ProductivityEntry, string>;
  productivityBaselines!: Table<ProductivityBaseline, string>;
  productivityAnalytics!: Table<ProductivityAnalytics, string>;
  unitPriceLibrary!: Table<UnitPriceLibrary, string>;
  bidFeedbackReports!: Table<BidFeedbackReport, string>;
  scheduleBaselines!: Table<ScheduleBaseline, string>;

  // ── Autosave drafts ──
  dailyLogDrafts!: Table<DailyLogDraft, string>;

  // ── Auth ──
  users!: Table<AppUser, string>;

  constructor() {
    super("FieldOpsDB");

    // Version 1: Original schema
    this.version(1).stores({
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",
    });

    // Version 2: Structured Data Architecture
    this.version(2).stores({
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",
      delayEvents: "id, projectId, date, delayType, criticalPathImpacted, createdAt",
      safetyIncidents: "id, projectId, date, incidentType, oshaReportable, createdAt",
      noticeLogs: "id, projectId, noticeType, dateSent, responseDeadline, createdAt",
      costCodes: "id, projectId, code, csiDivision, activity, [projectId+code]",
      productivityEntries: "id, projectId, date, costCodeId, activity, taktZone, [projectId+costCodeId+date]",
      productivityBaselines: "id, projectId, costCodeId, source, isActive, [projectId+costCodeId]",
      productivityAnalytics: "id, projectId, costCodeId, periodType, periodStart, [projectId+costCodeId+periodType]",
      unitPriceLibrary: "id, organizationId, csiDivision, activity, [organizationId+csiDivision]",
      bidFeedbackReports: "id, projectId, generatedDate",
      scheduleBaselines: "id, projectId, baselineDate, isActive",
    });

    // Version 3: Autosave drafts
    this.version(3).stores({
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",
      delayEvents: "id, projectId, date, delayType, criticalPathImpacted, createdAt",
      safetyIncidents: "id, projectId, date, incidentType, oshaReportable, createdAt",
      noticeLogs: "id, projectId, noticeType, dateSent, responseDeadline, createdAt",
      costCodes: "id, projectId, code, csiDivision, activity, [projectId+code]",
      productivityEntries: "id, projectId, date, costCodeId, activity, taktZone, [projectId+costCodeId+date]",
      productivityBaselines: "id, projectId, costCodeId, source, isActive, [projectId+costCodeId]",
      productivityAnalytics: "id, projectId, costCodeId, periodType, periodStart, [projectId+costCodeId+periodType]",
      unitPriceLibrary: "id, organizationId, csiDivision, activity, [organizationId+csiDivision]",
      bidFeedbackReports: "id, projectId, generatedDate",
      scheduleBaselines: "id, projectId, baselineDate, isActive",
      dailyLogDrafts: "id, projectId, date, savedAt",
    });

    // Version 4: Users & auth
    this.version(4).stores({
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",
      delayEvents: "id, projectId, date, delayType, criticalPathImpacted, createdAt",
      safetyIncidents: "id, projectId, date, incidentType, oshaReportable, createdAt",
      noticeLogs: "id, projectId, noticeType, dateSent, responseDeadline, createdAt",
      costCodes: "id, projectId, code, csiDivision, activity, [projectId+code]",
      productivityEntries: "id, projectId, date, costCodeId, activity, taktZone, [projectId+costCodeId+date]",
      productivityBaselines: "id, projectId, costCodeId, source, isActive, [projectId+costCodeId]",
      productivityAnalytics: "id, projectId, costCodeId, periodType, periodStart, [projectId+costCodeId+periodType]",
      unitPriceLibrary: "id, organizationId, csiDivision, activity, [organizationId+csiDivision]",
      bidFeedbackReports: "id, projectId, generatedDate",
      scheduleBaselines: "id, projectId, baselineDate, isActive",
      dailyLogDrafts: "id, projectId, date, savedAt",
      users: "id, email, role, isActive",
    });
  }
}

export const db = new FieldOpsDB();

// ---- Helper functions ----

// Generate a unique ID
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// Get the active project (for prototype: first/only project)
export async function getActiveProject(): Promise<Project | undefined> {
  return db.projects.orderBy("updatedAt").last();
}

// Get daily logs for a date range (for weekly reports)
export async function getDailyLogsForWeek(
  projectId: string,
  weekStart: string,
  weekEnd: string
): Promise<DailyLog[]> {
  return db.dailyLogs
    .where("projectId")
    .equals(projectId)
    .filter((log) => log.date >= weekStart && log.date <= weekEnd)
    .toArray();
}

// Get JHA for a specific date
export async function getJHAForDate(
  projectId: string,
  date: string
): Promise<DailyJHA | undefined> {
  return db.dailyJHAs
    .where({ projectId, date })
    .first();
}

// Get daily log for a specific date
export async function getDailyLogForDate(
  projectId: string,
  date: string
): Promise<DailyLog | undefined> {
  return db.dailyLogs
    .where({ projectId, date })
    .first();
}

// ── Phase 6: New helper functions ──

// Get delay events for a project date range
export async function getDelayEventsForProject(
  projectId: string,
  startDate?: string,
  endDate?: string
): Promise<DelayEvent[]> {
  const query = db.delayEvents
    .where("projectId")
    .equals(projectId);

  if (startDate && endDate) {
    return query.filter((e) => e.date >= startDate && e.date <= endDate).toArray();
  }
  return query.toArray();
}

// Get safety incidents for a project
export async function getSafetyIncidentsForProject(
  projectId: string
): Promise<SafetyIncident[]> {
  return db.safetyIncidents
    .where("projectId")
    .equals(projectId)
    .toArray();
}

// Get notice logs for a project
export async function getNoticeLogsForProject(
  projectId: string
): Promise<NoticeLogEntry[]> {
  return db.noticeLogs
    .where("projectId")
    .equals(projectId)
    .toArray();
}

// Get cost codes for a project
export async function getCostCodesForProject(
  projectId: string
): Promise<CostCode[]> {
  return db.costCodes
    .where("projectId")
    .equals(projectId)
    .toArray();
}

// Get productivity entries for a cost code within a date range
export async function getProductivityEntries(
  projectId: string,
  costCodeId?: string,
  startDate?: string,
  endDate?: string
): Promise<ProductivityEntry[]> {
  const collection = db.productivityEntries
    .where("projectId")
    .equals(projectId);

  return collection
    .filter((e) => {
      if (costCodeId && e.costCodeId !== costCodeId) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    })
    .toArray();
}

// Get active baseline for a cost code
export async function getActiveBaseline(
  projectId: string,
  costCodeId: string
): Promise<ProductivityBaseline | undefined> {
  return db.productivityBaselines
    .where({ projectId, costCodeId })
    .filter((b) => b.isActive)
    .first();
}

// Get latest analytics for a cost code
export async function getLatestAnalytics(
  projectId: string,
  costCodeId: string,
  periodType: string
): Promise<ProductivityAnalytics | undefined> {
  return db.productivityAnalytics
    .where({ projectId, costCodeId })
    .filter((a) => a.periodType === periodType)
    .reverse()
    .sortBy("periodEnd")
    .then((results) => results[0]);
}

// ── Autosave draft helpers ──

export function getDraftId(projectId: string, date: string): string {
  return `${projectId}:${date}`;
}

export async function saveDraft(draft: DailyLogDraft): Promise<void> {
  await db.dailyLogDrafts.put(draft);
}

export async function loadDraft(
  projectId: string,
  date: string
): Promise<DailyLogDraft | undefined> {
  return db.dailyLogDrafts.get(getDraftId(projectId, date));
}

export async function deleteDraft(
  projectId: string,
  date: string
): Promise<void> {
  await db.dailyLogDrafts.delete(getDraftId(projectId, date));
}

// ── Auth helpers ──

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "fieldops-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getAllUsers(): Promise<AppUser[]> {
  return db.users.filter((u) => u.isActive).toArray();
}

export async function getUserById(id: string): Promise<AppUser | undefined> {
  return db.users.get(id);
}

export async function createUser(user: AppUser): Promise<void> {
  await db.users.put(user);
}

export async function updateUser(
  id: string,
  updates: Partial<AppUser>
): Promise<void> {
  await db.users.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function verifyPin(
  userId: string,
  pin: string
): Promise<boolean> {
  const user = await db.users.get(userId);
  if (!user || !user.pinHash) return false;
  const hash = await hashPin(pin);
  return hash === user.pinHash;
}

export async function setUserPin(
  userId: string,
  pin: string
): Promise<void> {
  const hash = await hashPin(pin);
  await db.users.update(userId, {
    pinHash: hash,
    pinSet: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function getProjectsForUser(
  userId: string
): Promise<Project[]> {
  const user = await db.users.get(userId);
  if (!user) return [];
  if (user.assignedProjectIds.length === 0) {
    // If no specific assignments, return all projects (admin/president)
    return db.projects.toArray();
  }
  return db.projects.filter((p) => user.assignedProjectIds.includes(p.id)).toArray();
}

export async function seedDefaultUsers(projectId: string): Promise<void> {
  const existingUsers = await db.users.count();
  if (existingUsers > 0) return;

  const now = new Date().toISOString();
  const defaultUsers: AppUser[] = [
    {
      id: "user-john",
      name: "John Rutherford",
      email: "john@blackstone.build",
      phone: "205-994-8999",
      role: "president",
      pinSet: false,
      assignedProjectIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-mark",
      name: "Mark Sullivan",
      email: "mark@blackstone.build",
      phone: "205-555-0201",
      role: "superintendent",
      pinSet: false,
      assignedProjectIds: [projectId],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-jake",
      name: "Jake Mitchell",
      email: "jake@blackstone.build",
      phone: "205-555-0202",
      role: "foreman",
      pinSet: false,
      assignedProjectIds: [projectId],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-rachel",
      name: "Rachel Kim",
      email: "rachel@blackstone.build",
      phone: "205-555-0203",
      role: "safety_officer",
      pinSet: false,
      assignedProjectIds: [projectId],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.users.bulkPut(defaultUsers);
}
