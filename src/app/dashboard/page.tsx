"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import { EXECUTIVE_ROLES } from "@/lib/types";
import type { Project, DailyLog, DelayEvent, SafetyIncident, ConflictEntry } from "@/lib/types";
import {
  Shield,
  AlertTriangle,
  HeartPulse,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Types ──

interface ProjectSnapshot {
  project: Project;
  logs: DailyLog[];
  delays: DelayEvent[];
  safetyIncidents: SafetyIncident[];
  conflicts: ConflictEntry[];
  totalWorkers: number;
  workItems: number;
}

interface RiskItem {
  id: string;
  projectName: string;
  projectId: string;
  title: string;
  severity: "high" | "medium" | "low";
  date: string;
  type: "delay" | "safety" | "conflict";
}

// ── Helpers ──

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Component ──

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useAppStore();

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  // Calendar state
  const [today] = useState(() => new Date());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Auth check
  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (!EXECUTIVE_ROLES.includes(currentUser.role)) {
      router.replace("/");
    }
  }, [currentUser, router]);

  // Load all project data
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const projects = await db.projects.toArray();
      setAllProjects(projects);

      const snaps: ProjectSnapshot[] = [];

      for (const project of projects) {
        const logs = await db.dailyLogs
          .where("projectId")
          .equals(project.id)
          .toArray();

        const delays = await db.delayEvents
          .where("projectId")
          .equals(project.id)
          .toArray();

        const safetyIncidents = await db.safetyIncidents
          .where("projectId")
          .equals(project.id)
          .toArray();

        // Aggregate conflicts from logs
        const conflicts: ConflictEntry[] = [];
        let totalWorkers = 0;
        let workItems = 0;

        for (const log of logs) {
          conflicts.push(...log.conflicts);
          workItems += log.workPerformed.length;
          for (const m of log.manpower) {
            totalWorkers += m.journeymanCount + m.apprenticeCount + m.foremanCount;
          }
        }

        snaps.push({
          project,
          logs,
          delays,
          safetyIncidents,
          conflicts,
          totalWorkers,
          workItems,
        });
      }

      setSnapshots(snaps);
      setLoading(false);
    }

    loadAll();
  }, []);

  // ── Derived data ──

  const filteredSnapshots = useMemo(
    () =>
      filterProjectId
        ? snapshots.filter((s) => s.project.id === filterProjectId)
        : snapshots,
    [snapshots, filterProjectId]
  );

  // Portfolio summary
  const portfolioStats = useMemo(() => {
    let totalWorkers = 0;
    let totalWorkItems = 0;
    let totalDelays = 0;
    let totalSafetyIncidents = 0;
    let totalConflicts = 0;
    let totalLogs = 0;

    for (const snap of filteredSnapshots) {
      totalWorkers += snap.totalWorkers;
      totalWorkItems += snap.workItems;
      totalDelays += snap.delays.length;
      totalSafetyIncidents += snap.safetyIncidents.length;
      totalConflicts += snap.conflicts.length;
      totalLogs += snap.logs.length;
    }

    return {
      projectCount: filteredSnapshots.length,
      totalWorkers,
      totalWorkItems,
      totalDelays,
      totalSafetyIncidents,
      totalConflicts,
      totalLogs,
    };
  }, [filteredSnapshots]);

  // Risk items
  const riskItems = useMemo(() => {
    const items: RiskItem[] = [];

    for (const snap of filteredSnapshots) {
      for (const delay of snap.delays) {
        items.push({
          id: delay.id,
          projectName: snap.project.name,
          projectId: snap.project.id,
          title: delay.description,
          severity: delay.criticalPathImpacted ? "high" : "medium",
          date: delay.date,
          type: "delay",
        });
      }

      for (const incident of snap.safetyIncidents) {
        items.push({
          id: incident.id,
          projectName: snap.project.name,
          projectId: snap.project.id,
          title: incident.description,
          severity: incident.oshaReportable ? "high" : "medium",
          date: incident.date,
          type: "safety",
        });
      }

      for (const conflict of snap.conflicts) {
        items.push({
          id: `conflict-${conflict.description?.slice(0, 20)}`,
          projectName: snap.project.name,
          projectId: snap.project.id,
          title: conflict.description || "Conflict reported",
          severity:
            conflict.severity === "critical" || conflict.severity === "high"
              ? "high"
              : conflict.severity === "medium"
              ? "medium"
              : "low",
          date: conflict.timeOfOccurrence?.split("T")[0] || "",
          type: "conflict",
        });
      }
    }

    // Sort by severity then date
    const severityOrder = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return items;
  }, [filteredSnapshots]);

  // Completion log data
  const completionData = useMemo(() => {
    const logsByDate = new Map<string, { hasLog: boolean; hasDraft: boolean; projectId: string }>();

    for (const snap of filteredSnapshots) {
      for (const log of snap.logs) {
        logsByDate.set(`${snap.project.id}:${log.date}`, {
          hasLog: true,
          hasDraft: false,
          projectId: snap.project.id,
        });
      }
    }

    return logsByDate;
  }, [filteredSnapshots]);

  // Calendar days
  const calDays = useMemo(() => getMonthDays(calYear, calMonth), [calYear, calMonth]);
  const firstDayOfWeek = calDays[0]?.getDay() ?? 0;

  const getDateStatus = useCallback(
    (dateKey: string): "complete" | "missing" | "future" | "weekend" => {
      const d = new Date(dateKey + "T12:00:00");
      const day = d.getDay();
      if (day === 0 || day === 6) return "weekend";
      if (d > today) return "future";

      // Check if any project has a log for this date
      for (const snap of filteredSnapshots) {
        if (completionData.has(`${snap.project.id}:${dateKey}`)) {
          return "complete";
        }
      }
      return "missing";
    },
    [filteredSnapshots, completionData, today]
  );

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const severityColor = (s: "high" | "medium" | "low") => {
    switch (s) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (!currentUser || !EXECUTIVE_ROLES.includes(currentUser.role)) {
    return null;
  }

  if (loading) {
    return (
      <AppShell>
        <Header title="Executive Dashboard" backHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Group risk items by type for sections
  const delayRisks = riskItems.filter((r) => r.type === "delay");
  const safetyRisks = riskItems.filter((r) => r.type === "safety");
  const conflictRisks = riskItems.filter((r) => r.type === "conflict");

  return (
    <AppShell>
      <Header
        title="Executive Dashboard"
        subtitle={filterProjectId ? allProjects.find((p) => p.id === filterProjectId)?.name : "All Projects"}
        backHref="/"
      />

      <div className="pb-24 px-4 pt-4 space-y-6">
        {/* ── Project Filter ── */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-warm-gray flex-shrink-0" />
          <select
            value={filterProjectId ?? ""}
            onChange={(e) => setFilterProjectId(e.target.value || null)}
            className="flex-1 px-3 py-2 bg-alabaster border border-gray-200 rounded-lg text-field-sm font-semibold text-onyx focus:outline-none focus:ring-2 focus:ring-onyx"
          >
            <option value="">All Projects ({allProjects.length})</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Portfolio Summary Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Projects"
            value={portfolioStats.projectCount}
            icon={<Building2 size={18} />}
            color="bg-onyx text-white"
          />
          <SummaryCard
            label="Total Workforce"
            value={portfolioStats.totalWorkers}
            icon={<Users size={18} />}
            color="bg-blue-600 text-white"
          />
          <SummaryCard
            label="Daily Logs"
            value={portfolioStats.totalLogs}
            icon={<FileText size={18} />}
            color="bg-accent-green text-white"
          />
          <SummaryCard
            label="Work Items"
            value={portfolioStats.totalWorkItems}
            icon={<TrendingUp size={18} />}
            color="bg-purple-600 text-white"
          />
        </div>

        {/* ── Risk Overview Cards ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-xl p-3 text-center ${portfolioStats.totalDelays > 0 ? "bg-red-50 border border-red-200" : "bg-alabaster border border-gray-100"}`}>
            <Clock size={20} className={`mx-auto mb-1 ${portfolioStats.totalDelays > 0 ? "text-red-600" : "text-warm-gray"}`} />
            <p className={`text-xl font-bold ${portfolioStats.totalDelays > 0 ? "text-red-700" : "text-onyx"}`}>
              {portfolioStats.totalDelays}
            </p>
            <p className="text-xs text-warm-gray">Delays</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${portfolioStats.totalSafetyIncidents > 0 ? "bg-red-50 border border-red-200" : "bg-alabaster border border-gray-100"}`}>
            <HeartPulse size={20} className={`mx-auto mb-1 ${portfolioStats.totalSafetyIncidents > 0 ? "text-red-600" : "text-warm-gray"}`} />
            <p className={`text-xl font-bold ${portfolioStats.totalSafetyIncidents > 0 ? "text-red-700" : "text-onyx"}`}>
              {portfolioStats.totalSafetyIncidents}
            </p>
            <p className="text-xs text-warm-gray">Safety</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${portfolioStats.totalConflicts > 0 ? "bg-amber-50 border border-amber-200" : "bg-alabaster border border-gray-100"}`}>
            <AlertTriangle size={20} className={`mx-auto mb-1 ${portfolioStats.totalConflicts > 0 ? "text-amber-600" : "text-warm-gray"}`} />
            <p className={`text-xl font-bold ${portfolioStats.totalConflicts > 0 ? "text-amber-700" : "text-onyx"}`}>
              {portfolioStats.totalConflicts}
            </p>
            <p className="text-xs text-warm-gray">Conflicts</p>
          </div>
        </div>

        {/* ── Risk Management (Drillable) ── */}
        <div className="space-y-3">
          <h2 className="text-field-lg font-semibold text-onyx px-1">
            Risk Management
          </h2>

          {riskItems.length === 0 ? (
            <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-6 text-center">
              <Shield size={32} className="text-accent-green mx-auto mb-2" />
              <p className="font-semibold text-onyx">All Clear</p>
              <p className="text-field-sm text-warm-gray mt-1">
                No active risk items across {filteredSnapshots.length} project{filteredSnapshots.length !== 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <>
              {/* Delays */}
              {delayRisks.length > 0 && (
                <RiskSection
                  title="Active Delays"
                  icon={<Clock size={18} className="text-red-600" />}
                  count={delayRisks.length}
                  items={delayRisks}
                  expandedId={expandedRisk}
                  onToggle={setExpandedRisk}
                  severityColor={severityColor}
                />
              )}

              {/* Safety */}
              {safetyRisks.length > 0 && (
                <RiskSection
                  title="Safety Incidents"
                  icon={<HeartPulse size={18} className="text-red-600" />}
                  count={safetyRisks.length}
                  items={safetyRisks}
                  expandedId={expandedRisk}
                  onToggle={setExpandedRisk}
                  severityColor={severityColor}
                />
              )}

              {/* Conflicts */}
              {conflictRisks.length > 0 && (
                <RiskSection
                  title="Unresolved Conflicts"
                  icon={<AlertTriangle size={18} className="text-amber-600" />}
                  count={conflictRisks.length}
                  items={conflictRisks}
                  expandedId={expandedRisk}
                  onToggle={setExpandedRisk}
                  severityColor={severityColor}
                />
              )}
            </>
          )}
        </div>

        {/* ── Completion Log ── */}
        <div className="space-y-3">
          <h2 className="text-field-lg font-semibold text-onyx px-1">
            Completion Log
          </h2>

          <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={18} className="text-onyx" />
              </button>
              <h3 className="font-heading font-semibold text-field-base text-onyx">
                {new Date(calYear, calMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={18} className="text-onyx" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-field-xs font-semibold text-warm-gray py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {calDays.map((day) => {
                const key = formatDateKey(day);
                const status = getDateStatus(key);

                let bgClass = "bg-gray-50";
                let textClass = "text-gray-400";

                if (status === "complete") {
                  bgClass = "bg-accent-green/20";
                  textClass = "text-accent-green font-bold";
                } else if (status === "missing") {
                  bgClass = "bg-red-50";
                  textClass = "text-red-400";
                } else if (status === "weekend") {
                  bgClass = "bg-gray-50";
                  textClass = "text-gray-300";
                } else if (status === "future") {
                  bgClass = "bg-white";
                  textClass = "text-gray-300";
                }

                // Highlight today
                const isToday = key === formatDateKey(today);

                return (
                  <div
                    key={key}
                    className={`aspect-square rounded-lg flex items-center justify-center text-field-xs ${bgClass} ${textClass} ${
                      isToday ? "ring-2 ring-onyx" : ""
                    }`}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-field-xs text-warm-gray">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-green/30" />
                Logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100" />
                Missing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100" />
                Weekend
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Summary Card ──

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">{icon}</div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

// ── Risk Section (expandable) ──

function RiskSection({
  title,
  icon,
  count,
  items,
  expandedId,
  onToggle,
  severityColor,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  items: RiskItem[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  severityColor: (s: "high" | "medium" | "low") => string;
}) {
  const sectionId = `section-${title}`;
  const isExpanded = expandedId === sectionId;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card overflow-hidden">
      <button
        onClick={() => onToggle(isExpanded ? null : sectionId)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-heading font-semibold text-field-base text-onyx">
            {title}
          </span>
          <span className="bg-onyx text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-warm-gray" />
        ) : (
          <ChevronDown size={18} className="text-warm-gray" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-start gap-3">
              <span
                className={`flex-shrink-0 mt-0.5 px-2 py-0.5 text-xs font-bold rounded border ${severityColor(
                  item.severity
                )}`}
              >
                {item.severity.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-field-sm text-onyx font-medium truncate">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-field-xs text-warm-gray">
                    {item.projectName}
                  </span>
                  {item.date && (
                    <span className="text-field-xs text-gray-400">
                      {new Date(item.date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
