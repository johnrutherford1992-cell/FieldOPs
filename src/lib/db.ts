import { getSupabase, rowsToCamel, recordToSnake, recordsToSnake, toCamelCase } from "./supabase";
import type {
  Project,
  DailyJHA,
  DailyLog,
  WeeklyReport,
  ChangeOrder,
  LegalCorrespondence,
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
  TimeEntry,
  TimePolicy,
  ADPSyncConfig,
  ResourceRequest,
  ScheduleEntry,
  ResourceConflict,
  MaterialDelivery,
  MaterialInventory,
  MaterialConsumption,
  ChecklistTemplate,
  CompletedChecklist,
  Deficiency,
} from "./types";

// ============================================================
// FieldOps Database — Supabase PostgreSQL Backend
// Preserves the same exported API surface as the Dexie version
// ============================================================

// ---- Table name mapping: JS camelCase → Postgres snake_case ----
const TABLE_MAP: Record<string, string> = {
  projects: "projects",
  dailyJHAs: "daily_jhas",
  dailyLogs: "daily_logs",
  weeklyReports: "weekly_reports",
  changeOrders: "change_orders",
  legalCorrespondence: "legal_correspondence",
  delayEvents: "delay_events",
  safetyIncidents: "safety_incidents",
  noticeLogs: "notice_logs",
  costCodes: "cost_codes",
  productivityEntries: "productivity_entries",
  productivityBaselines: "productivity_baselines",
  productivityAnalytics: "productivity_analytics",
  unitPriceLibrary: "unit_price_library",
  bidFeedbackReports: "bid_feedback_reports",
  scheduleBaselines: "schedule_baselines",
  timeEntries: "time_entries",
  timePolicies: "time_policies",
  adpSyncConfigs: "adp_sync_configs",
  resourceRequests: "resource_requests",
  scheduleEntries: "schedule_entries",
  resourceConflicts: "resource_conflicts",
  materialDeliveries: "material_deliveries",
  materialInventory: "material_inventory",
  materialConsumption: "material_consumption",
  checklistTemplates: "checklist_templates",
  completedChecklists: "completed_checklists",
  deficiencies: "deficiencies",
};

// ---- Generic table proxy for db.tableName.method() pattern ----

function createTableProxy<T>(tableName: string) {
  const pgTable = TABLE_MAP[tableName] || tableName;

  return {
    /** Fetch all records from table */
    async toArray(): Promise<T[]> {
      const { data, error } = await getSupabase().from(pgTable).select("*");
      if (error) { console.error(`toArray(${pgTable}):`, error); return []; }
      return rowsToCamel<T>(data || []);
    },

    /** Upsert a single record */
    async put(record: T): Promise<void> {
      const snake = recordToSnake(record as Record<string, unknown>);
      const { error } = await getSupabase().from(pgTable).upsert([snake]);
      if (error) console.error(`put(${pgTable}):`, error);
    },

    /** Insert a single record (fails on conflict) */
    async add(record: T): Promise<void> {
      const snake = recordToSnake(record as Record<string, unknown>);
      const { error } = await getSupabase().from(pgTable).insert([snake]);
      if (error) console.error(`add(${pgTable}):`, error);
    },

    /** Upsert multiple records */
    async bulkPut(records: T[]): Promise<void> {
      if (records.length === 0) return;
      const snakeRecords = recordsToSnake(records as Record<string, unknown>[]);
      const { error } = await getSupabase().from(pgTable).upsert(snakeRecords);
      if (error) console.error(`bulkPut(${pgTable}):`, error);
    },

    /** Insert multiple records */
    async bulkAdd(records: T[]): Promise<void> {
      if (records.length === 0) return;
      const snakeRecords = recordsToSnake(records as Record<string, unknown>[]);
      const { error } = await getSupabase().from(pgTable).insert(snakeRecords);
      if (error) console.error(`bulkAdd(${pgTable}):`, error);
    },

    /** Get a single record by primary key */
    async get(id: string): Promise<T | undefined> {
      const { data, error } = await getSupabase().from(pgTable).select("*").eq("id", id).maybeSingle();
      if (error) { console.error(`get(${pgTable}):`, error); return undefined; }
      return data ? (toCamelCase(data as Record<string, unknown>) as T) : undefined;
    },

    /** Update specific fields on a record by id */
    async update(id: string, changes: Partial<T>): Promise<void> {
      const snake = recordToSnake(changes as Record<string, unknown>);
      const { error } = await getSupabase().from(pgTable).update(snake).eq("id", id);
      if (error) console.error(`update(${pgTable}):`, error);
    },

    /** Delete a record by id */
    async delete(id: string): Promise<void> {
      const { error } = await getSupabase().from(pgTable).delete().eq("id", id);
      if (error) console.error(`delete(${pgTable}):`, error);
    },

    /** Count records, optionally filtered */
    async count(filters?: Record<string, unknown>): Promise<number> {
      let query = getSupabase().from(pgTable).select("*", { count: "exact", head: true });
      if (filters) {
        for (const [key, val] of Object.entries(filters)) {
          const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          query = query.eq(snakeKey, val);
        }
      }
      const { count, error } = await query;
      if (error) { console.error(`count(${pgTable}):`, error); return 0; }
      return count || 0;
    },

    /** Select with filters — returns { data, error } for chaining */
    select(columns = "*") {
      return getSupabase().from(pgTable).select(columns);
    },

    /** Query builder: where(column).equals(value).toArray() */
    where(filterOrColumn: string | Record<string, unknown>) {
      if (typeof filterOrColumn === "string") {
        // Single column filter: db.table.where("projectId").equals(value)
        const snakeCol = filterOrColumn.replace(/([A-Z])/g, "_$1").toLowerCase();
        return {
          equals(value: unknown) {
            return {
              async toArray(): Promise<T[]> {
                const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value);
                if (error) { console.error(`where.eq(${pgTable}):`, error); return []; }
                return rowsToCamel<T>(data || []);
              },
              async first(): Promise<T | undefined> {
                const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value).limit(1).maybeSingle();
                if (error) { console.error(`where.first(${pgTable}):`, error); return undefined; }
                return data ? (toCamelCase(data as Record<string, unknown>) as T) : undefined;
              },
              async count(): Promise<number> {
                const { count, error } = await getSupabase().from(pgTable).select("*", { count: "exact", head: true }).eq(snakeCol, value);
                if (error) { console.error(`where.count(${pgTable}):`, error); return 0; }
                return count || 0;
              },
              filter(fn: (item: T) => boolean) {
                return {
                  async toArray(): Promise<T[]> {
                    const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value);
                    if (error) { console.error(`where.filter(${pgTable}):`, error); return []; }
                    const camelData = rowsToCamel<T>(data || []);
                    return camelData.filter(fn);
                  },
                  async first(): Promise<T | undefined> {
                    const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value);
                    if (error) { console.error(`where.filter.first(${pgTable}):`, error); return undefined; }
                    const camelData = rowsToCamel<T>(data || []);
                    return camelData.filter(fn)[0];
                  },
                  reverse() {
                    return {
                      async sortBy(field: string): Promise<T[]> {
                        const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value);
                        if (error) return [];
                        const camelData = rowsToCamel<T>(data || []).filter(fn);
                        camelData.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
                          if (a[field] < b[field]) return 1;
                          if (a[field] > b[field]) return -1;
                          return 0;
                        });
                        return camelData;
                      }
                    };
                  },
                  async delete(): Promise<void> {
                    // Get IDs to delete via client-side filter
                    const { data } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value);
                    const camelData = rowsToCamel<T>(data || []);
                    const toDelete = camelData.filter(fn);
                    for (const item of toDelete) {
                      await getSupabase().from(pgTable).delete().eq("id", (item as Record<string, unknown>).id);
                    }
                  },
                };
              },
              reverse() {
                return {
                  async sortBy(field: string): Promise<T[]> {
                    const snakeField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
                    const { data, error } = await getSupabase().from(pgTable).select("*").eq(snakeCol, value).order(snakeField, { ascending: false });
                    if (error) { console.error(`reverse.sortBy(${pgTable}):`, error); return []; }
                    return rowsToCamel<T>(data || []);
                  },
                };
              },
              async delete(): Promise<void> {
                const { error } = await getSupabase().from(pgTable).delete().eq(snakeCol, value);
                if (error) console.error(`where.delete(${pgTable}):`, error);
              },
            };
          },
        };
      } else {
        // Multi-column filter: db.table.where({ projectId, date })
        let query = getSupabase().from(pgTable).select("*");
        for (const [key, val] of Object.entries(filterOrColumn)) {
          const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          query = query.eq(snakeKey, val);
        }
        return {
          async toArray(): Promise<T[]> {
            const { data, error } = await query;
            if (error) { console.error(`where.multi(${pgTable}):`, error); return []; }
            return rowsToCamel<T>(data || []);
          },
          async first(): Promise<T | undefined> {
            const { data, error } = await query.limit(1).maybeSingle();
            if (error) { console.error(`where.multi.first(${pgTable}):`, error); return undefined; }
            return data ? (toCamelCase(data as Record<string, unknown>) as T) : undefined;
          },
          filter(fn: (item: T) => boolean) {
            return {
              async toArray(): Promise<T[]> {
                const { data, error } = await query;
                if (error) return [];
                return rowsToCamel<T>(data || []).filter(fn);
              },
              async first(): Promise<T | undefined> {
                const { data, error } = await query;
                if (error) return undefined;
                return rowsToCamel<T>(data || []).filter(fn)[0];
              },
            };
          },
        };
      }
    },

    /** Order by a column and get last (max) record */
    orderBy(column: string) {
      const snakeCol = column.replace(/([A-Z])/g, "_$1").toLowerCase();
      return {
        async last(): Promise<T | undefined> {
          const { data, error } = await getSupabase().from(pgTable).select("*").order(snakeCol, { ascending: false }).limit(1).maybeSingle();
          if (error) { console.error(`orderBy.last(${pgTable}):`, error); return undefined; }
          return data ? (toCamelCase(data as Record<string, unknown>) as T) : undefined;
        },
      };
    },

    /** Client-side filter on all records */
    filter(fn: (item: T) => boolean) {
      return {
        async toArray(): Promise<T[]> {
          const { data, error } = await getSupabase().from(pgTable).select("*");
          if (error) return [];
          return rowsToCamel<T>(data || []).filter(fn);
        },
      };
    },

    /** Transaction placeholder — executes operations sequentially */
    async transaction(mode: string, tables: string[], fn: () => Promise<void>): Promise<void> {
      // Supabase JS client doesn't support PG transactions directly.
      // Execute sequentially with best-effort error handling.
      await fn();
    },
  };
}

// ============================================================
// EXPORTED DATABASE OBJECT
// Mimics Dexie's db.tableName pattern
// ============================================================

export const db = {
  projects: createTableProxy<Project>("projects"),
  dailyJHAs: createTableProxy<DailyJHA>("dailyJHAs"),
  dailyLogs: createTableProxy<DailyLog>("dailyLogs"),
  weeklyReports: createTableProxy<WeeklyReport>("weeklyReports"),
  changeOrders: createTableProxy<ChangeOrder>("changeOrders"),
  legalCorrespondence: createTableProxy<LegalCorrespondence>("legalCorrespondence"),
  delayEvents: createTableProxy<DelayEvent>("delayEvents"),
  safetyIncidents: createTableProxy<SafetyIncident>("safetyIncidents"),
  noticeLogs: createTableProxy<NoticeLogEntry>("noticeLogs"),
  costCodes: createTableProxy<CostCode>("costCodes"),
  productivityEntries: createTableProxy<ProductivityEntry>("productivityEntries"),
  productivityBaselines: createTableProxy<ProductivityBaseline>("productivityBaselines"),
  productivityAnalytics: createTableProxy<ProductivityAnalytics>("productivityAnalytics"),
  unitPriceLibrary: createTableProxy<UnitPriceLibrary>("unitPriceLibrary"),
  bidFeedbackReports: createTableProxy<BidFeedbackReport>("bidFeedbackReports"),
  scheduleBaselines: createTableProxy<ScheduleBaseline>("scheduleBaselines"),
  timeEntries: createTableProxy<TimeEntry>("timeEntries"),
  timePolicies: createTableProxy<TimePolicy>("timePolicies"),
  adpSyncConfigs: createTableProxy<ADPSyncConfig>("adpSyncConfigs"),
  resourceRequests: createTableProxy<ResourceRequest>("resourceRequests"),
  scheduleEntries: createTableProxy<ScheduleEntry>("scheduleEntries"),
  resourceConflicts: createTableProxy<ResourceConflict>("resourceConflicts"),
  materialDeliveries: createTableProxy<MaterialDelivery>("materialDeliveries"),
  materialInventory: createTableProxy<MaterialInventory>("materialInventory"),
  materialConsumption: createTableProxy<MaterialConsumption>("materialConsumption"),
  checklistTemplates: createTableProxy<ChecklistTemplate>("checklistTemplates"),
  completedChecklists: createTableProxy<CompletedChecklist>("completedChecklists"),
  deficiencies: createTableProxy<Deficiency>("deficiencies"),
};

// ============================================================
// ID GENERATION (unchanged from Dexie version)
// ============================================================

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================
// HELPER FUNCTIONS (same signatures, Supabase-backed)
// ============================================================

export async function getActiveProject(): Promise<Project | undefined> {
  return db.projects.orderBy("updatedAt").last();
}

export async function getDailyLogsForWeek(
  projectId: string,
  weekStart: string,
  weekEnd: string
): Promise<DailyLog[]> {
  const { data, error } = await getSupabase()
    .from("daily_logs")
    .select("*")
    .eq("project_id", projectId)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  if (error) { console.error("getDailyLogsForWeek:", error); return []; }
  return rowsToCamel<DailyLog>(data || []);
}

export async function getJHAForDate(
  projectId: string,
  date: string
): Promise<DailyJHA | undefined> {
  return db.dailyJHAs.where({ projectId, date }).first();
}

export async function getDailyLogForDate(
  projectId: string,
  date: string
): Promise<DailyLog | undefined> {
  return db.dailyLogs.where({ projectId, date }).first();
}

export async function getDelayEventsForProject(
  projectId: string,
  startDate?: string,
  endDate?: string
): Promise<DelayEvent[]> {
  let query = getSupabase()
    .from("delay_events")
    .select("*")
    .eq("project_id", projectId);

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  if (error) { console.error("getDelayEventsForProject:", error); return []; }
  return rowsToCamel<DelayEvent>(data || []);
}

export async function getSafetyIncidentsForProject(
  projectId: string
): Promise<SafetyIncident[]> {
  return db.safetyIncidents.where("projectId").equals(projectId).toArray();
}

export async function getNoticeLogsForProject(
  projectId: string
): Promise<NoticeLogEntry[]> {
  return db.noticeLogs.where("projectId").equals(projectId).toArray();
}

export async function getCostCodesForProject(
  projectId: string
): Promise<CostCode[]> {
  return db.costCodes.where("projectId").equals(projectId).toArray();
}

export async function getProductivityEntries(
  projectId: string,
  costCodeId?: string,
  startDate?: string,
  endDate?: string
): Promise<ProductivityEntry[]> {
  let query = getSupabase()
    .from("productivity_entries")
    .select("*")
    .eq("project_id", projectId);

  if (costCodeId) query = query.eq("cost_code_id", costCodeId);
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  if (error) { console.error("getProductivityEntries:", error); return []; }
  return rowsToCamel<ProductivityEntry>(data || []);
}

export async function getActiveBaseline(
  projectId: string,
  costCodeId: string
): Promise<ProductivityBaseline | undefined> {
  const { data, error } = await getSupabase()
    .from("productivity_baselines")
    .select("*")
    .eq("project_id", projectId)
    .eq("cost_code_id", costCodeId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getActiveBaseline:", error); return undefined; }
  return data ? (toCamelCase(data as Record<string, unknown>) as ProductivityBaseline) : undefined;
}

// ── Phase 7: Time Tracking helpers ──

export async function getTimeEntriesForDate(
  projectId: string,
  date: string
): Promise<TimeEntry[]> {
  return db.timeEntries.where({ projectId, date }).toArray();
}

export async function getTimeEntriesForRange(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<TimeEntry[]> {
  const { data, error } = await getSupabase()
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) { console.error("getTimeEntriesForRange:", error); return []; }
  return rowsToCamel<TimeEntry>(data || []);
}

export async function getPendingTimeEntries(
  projectId: string
): Promise<TimeEntry[]> {
  return db.timeEntries.where({ projectId, approvalStatus: "pending" }).toArray();
}

export async function getApprovedUnexportedEntries(
  projectId: string
): Promise<TimeEntry[]> {
  const { data, error } = await getSupabase()
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .eq("approval_status", "approved")
    .eq("adp_exported", false);
  if (error) { console.error("getApprovedUnexportedEntries:", error); return []; }
  return rowsToCamel<TimeEntry>(data || []);
}

export async function getActiveTimePolicy(
  projectId: string
): Promise<TimePolicy | undefined> {
  const { data, error } = await getSupabase()
    .from("time_policies")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getActiveTimePolicy:", error); return undefined; }
  return data ? (toCamelCase(data as Record<string, unknown>) as TimePolicy) : undefined;
}

export async function getActiveADPConfig(
  projectId: string
): Promise<ADPSyncConfig | undefined> {
  const { data, error } = await getSupabase()
    .from("adp_sync_configs")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getActiveADPConfig:", error); return undefined; }
  return data ? (toCamelCase(data as Record<string, unknown>) as ADPSyncConfig) : undefined;
}

export async function computeTimeSummary(
  projectId: string,
  date: string
): Promise<{
  totalWorkers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  totalHours: number;
  pendingApproval: number;
  approved: number;
  exported: number;
}> {
  const entries = await getTimeEntriesForDate(projectId, date);
  return {
    totalWorkers: entries.length,
    totalRegularHours: entries.reduce((s, e) => s + e.regularHours, 0),
    totalOvertimeHours: entries.reduce((s, e) => s + e.overtimeHours, 0),
    totalDoubleTimeHours: entries.reduce((s, e) => s + e.doubleTimeHours, 0),
    totalHours: entries.reduce((s, e) => s + e.totalHours, 0),
    pendingApproval: entries.filter((e) => e.approvalStatus === "pending").length,
    approved: entries.filter((e) => e.approvalStatus === "approved").length,
    exported: entries.filter((e) => e.adpExported).length,
  };
}

export async function getLatestAnalytics(
  projectId: string,
  costCodeId: string,
  periodType: string
): Promise<ProductivityAnalytics | undefined> {
  const { data, error } = await getSupabase()
    .from("productivity_analytics")
    .select("*")
    .eq("project_id", projectId)
    .eq("cost_code_id", costCodeId)
    .eq("period_type", periodType)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error("getLatestAnalytics:", error); return undefined; }
  return data ? (toCamelCase(data as Record<string, unknown>) as ProductivityAnalytics) : undefined;
}
