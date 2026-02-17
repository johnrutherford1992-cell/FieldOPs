"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db, getTimeEntriesForDate, getApprovedUnexportedEntries, getActiveADPConfig } from "@/lib/db";
import { deriveProductivityFromTimeEntries, computeWeeklyTimeSummary } from "@/lib/time-productivity-bridge";
import type { TimeEntry, ADPSyncConfig } from "@/lib/types";
import {
  Timer,
  Check,
  CheckCheck,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Send,
  Shield,
} from "lucide-react";

type ViewMode = "daily" | "approval" | "export";

export default function TimeTrackingPage() {
  const { activeProject, currentDate } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [exportableEntries, setExportableEntries] = useState<TimeEntry[]>([]);
  const [adpConfig, setAdpConfig] = useState<ADPSyncConfig | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    status: string;
    message?: string;
    recordCount?: number;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load entries for current view
  const loadEntries = useCallback(async () => {
    if (!activeProject) return;

    if (viewMode === "daily") {
      const dayEntries = await getTimeEntriesForDate(activeProject.id, currentDate);
      setEntries(dayEntries);
    } else if (viewMode === "approval") {
      const pendingEntries = await db.timeEntries
        .where({ projectId: activeProject.id, approvalStatus: "pending" })
        .toArray();
      setEntries(pendingEntries);
    } else if (viewMode === "export") {
      const ready = await getApprovedUnexportedEntries(activeProject.id);
      setExportableEntries(ready);
      const config = await getActiveADPConfig(activeProject.id);
      setAdpConfig(config || null);
    }
  }, [activeProject, currentDate, viewMode]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Approve a single entry
  const handleApprove = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      await db.timeEntries.update(id, {
        approvalStatus: "approved",
        approvedAt: now,
        updatedAt: now,
      });
      // Trigger productivity derivation
      const entry = await db.timeEntries.get(id);
      if (entry && activeProject) {
        await deriveProductivityFromTimeEntries(activeProject.id, entry.date);
      }
      loadEntries();
    },
    [activeProject, loadEntries]
  );

  // Approve all pending
  const handleApproveAll = useCallback(async () => {
    if (!activeProject) return;
    const now = new Date().toISOString();
    const pendingEntries = entries.filter((e) => e.approvalStatus === "pending");

    for (const entry of pendingEntries) {
      await db.timeEntries.update(entry.id, {
        approvalStatus: "approved",
        approvedAt: now,
        updatedAt: now,
      });
    }

    // Derive productivity for each unique date
    const dates = [...new Set(pendingEntries.map((e) => e.date))];
    for (const date of dates) {
      await deriveProductivityFromTimeEntries(activeProject.id, date);
    }

    loadEntries();
  }, [activeProject, entries, loadEntries]);

  // Export to ADP
  const handleExportToADP = useCallback(async () => {
    if (!activeProject || exportableEntries.length === 0) return;
    setIsExporting(true);
    setExportResult(null);

    try {
      const batchId = `fo-${Date.now().toString(36)}`;
      const dates = exportableEntries.map((e) => e.date).sort();

      const response = await fetch("/api/adp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: exportableEntries,
          config: adpConfig || {
            companyCode: "DEMO",
            payGroupCode: "FIELD",
            earningsCode: "REG",
            overtimeEarningsCode: "OT",
            doubleTimeEarningsCode: "DT",
          },
          batchId,
          payPeriodStart: dates[0],
          payPeriodEnd: dates[dates.length - 1],
        }),
      });

      const result = await response.json();
      setExportResult(result);

      if (result.status === "success" || result.status === "preview") {
        // Mark entries as exported
        const now = new Date().toISOString();
        for (const entryId of result.exportedEntryIds) {
          await db.timeEntries.update(entryId, {
            adpExported: true,
            adpExportedAt: now,
            adpBatchId: batchId,
            approvalStatus: "exported",
            updatedAt: now,
          });
        }
        loadEntries();
      }
    } catch (error) {
      setExportResult({
        status: "failed",
        message: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setIsExporting(false);
    }
  }, [activeProject, exportableEntries, adpConfig, loadEntries]);

  // Summary stats
  const totalHours = entries.reduce((s, e) => s + e.totalHours, 0);
  const pendingCount = entries.filter((e) => e.approvalStatus === "pending").length;

  return (
    <AppShell>
      <div className="screen">
        <Header
          title="Time Tracking"
          subtitle="Review & Export"
          backHref="/"
        />

        {/* View Mode Tabs */}
        <div className="flex gap-1 px-5 pt-4 pb-2">
          {(["daily", "approval", "export"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-3 rounded-button text-field-sm font-semibold transition-all ${
                viewMode === mode
                  ? "bg-accent-violet text-white shadow-violet-glow"
                  : "bg-glass text-warm-gray"
              }`}
            >
              {mode === "daily" && "Today"}
              {mode === "approval" && `Approve${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
              {mode === "export" && "ADP Export"}
            </button>
          ))}
        </div>

        <div className="px-5 pt-4 pb-32 space-y-4">
          {/* ── Daily View ── */}
          {viewMode === "daily" && (
            <>
              {/* Summary card */}
              <div className="bg-glass rounded-card p-4 shadow-glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer size={20} className="text-accent-violet" />
                    <span className="text-field-base font-heading font-semibold text-onyx">
                      {currentDate}
                    </span>
                  </div>
                  <span className="text-field-lg font-heading font-semibold text-onyx">
                    {totalHours.toFixed(1)} hrs
                  </span>
                </div>
                <p className="text-field-xs text-warm-gray">
                  {entries.length} workers tracked · {pendingCount} pending approval
                </p>
              </div>

              {/* Entry list */}
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={40} className="text-warm-gray mx-auto mb-3" />
                  <p className="text-field-base text-warm-gray">
                    No time entries for today
                  </p>
                  <p className="text-field-sm text-warm-gray mt-1">
                    Time entries are created from the Daily Log flow
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <TimeEntryCard
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    onApprove={() => handleApprove(entry.id)}
                  />
                ))
              )}
            </>
          )}

          {/* ── Approval View ── */}
          {viewMode === "approval" && (
            <>
              {entries.length > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-card bg-accent-teal/15 text-accent-teal font-semibold text-field-base transition-all active:scale-[0.98]"
                >
                  <CheckCheck size={20} />
                  Approve All ({entries.length} entries)
                </button>
              )}

              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <Check size={40} className="text-accent-teal mx-auto mb-3" />
                  <p className="text-field-base text-onyx font-semibold">All Caught Up</p>
                  <p className="text-field-sm text-warm-gray mt-1">
                    No time entries pending approval
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <TimeEntryCard
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    onApprove={() => handleApprove(entry.id)}
                    showApproveButton
                  />
                ))
              )}
            </>
          )}

          {/* ── ADP Export View ── */}
          {viewMode === "export" && (
            <>
              {/* ADP Connection Status */}
              <div className="bg-glass rounded-card p-4 shadow-glass-card border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Shield size={20} className={adpConfig ? "text-accent-teal" : "text-accent-amber"} />
                  <div>
                    <p className="text-field-base font-heading font-semibold text-onyx">
                      ADP Workforce Now
                    </p>
                    <p className="text-field-xs text-warm-gray">
                      {adpConfig
                        ? `Connected — Company: ${adpConfig.companyCode}`
                        : "Not configured — exports will generate preview payloads"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Summary */}
              <div className="bg-glass rounded-card p-4 shadow-glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-field-base font-semibold text-onyx">
                    Ready for Export
                  </span>
                  <span className="text-field-lg font-heading font-semibold text-accent-violet">
                    {exportableEntries.length}
                  </span>
                </div>
                <p className="text-field-xs text-warm-gray">
                  {exportableEntries.reduce((s, e) => s + e.totalHours, 0).toFixed(1)} total hours ·{" "}
                  {[...new Set(exportableEntries.map((e) => e.date))].length} days
                </p>
              </div>

              {/* Export Button */}
              {exportableEntries.length > 0 && (
                <button
                  onClick={handleExportToADP}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-card bg-accent-violet text-white font-semibold text-field-base transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Export to ADP
                    </>
                  )}
                </button>
              )}

              {/* Export Result */}
              {exportResult && (
                <div
                  className={`rounded-card p-4 border ${
                    exportResult.status === "success" || exportResult.status === "preview"
                      ? "bg-accent-teal/10 border-accent-teal/20"
                      : "bg-accent-red/10 border-accent-red/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {exportResult.status === "success" || exportResult.status === "preview" ? (
                      <Check size={18} className="text-accent-teal" />
                    ) : (
                      <AlertCircle size={18} className="text-accent-red" />
                    )}
                    <span className="text-field-base font-semibold text-onyx capitalize">
                      {exportResult.status}
                    </span>
                  </div>
                  {exportResult.message && (
                    <p className="text-field-xs text-warm-gray">{exportResult.message}</p>
                  )}
                  {exportResult.recordCount && (
                    <p className="text-field-xs text-warm-gray mt-1">
                      {exportResult.recordCount} ADP records generated
                    </p>
                  )}
                </div>
              )}

              {/* Exportable Entry List */}
              {exportableEntries.map((entry) => (
                <TimeEntryCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedId === entry.id}
                  onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  compact
                />
              ))}

              {exportableEntries.length === 0 && !exportResult && (
                <div className="text-center py-12">
                  <Upload size={40} className="text-warm-gray mx-auto mb-3" />
                  <p className="text-field-base text-onyx font-semibold">Nothing to Export</p>
                  <p className="text-field-sm text-warm-gray mt-1">
                    Approve time entries first, then export here
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ── Reusable TimeEntry Card Component ──

function TimeEntryCard({
  entry,
  expanded,
  onToggle,
  onApprove,
  showApproveButton,
  compact,
}: {
  entry: TimeEntry;
  expanded: boolean;
  onToggle: () => void;
  onApprove?: () => void;
  showApproveButton?: boolean;
  compact?: boolean;
}) {
  const statusColor =
    entry.approvalStatus === "approved" || entry.approvalStatus === "exported"
      ? "text-accent-teal"
      : entry.approvalStatus === "rejected"
      ? "text-accent-red"
      : "text-accent-amber";

  return (
    <div className="bg-glass rounded-xl shadow-glass-card border border-white/[0.06] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
      >
        <div className="flex-1 min-w-0">
          <p className="text-field-base font-heading font-semibold text-onyx truncate">
            {entry.workerName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-field-xs text-warm-gray">{entry.trade}</span>
            <span className="text-field-xs text-warm-gray">·</span>
            <span className={`text-field-xs font-semibold ${statusColor}`}>
              {entry.approvalStatus.toUpperCase()}
            </span>
            {entry.adpExported && (
              <span className="text-field-xs text-accent-teal bg-accent-teal/10 px-1.5 py-0.5 rounded">
                ADP
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-field-lg font-heading font-semibold text-onyx">
            {entry.totalHours.toFixed(1)}h
          </p>
        </div>

        {!compact && (
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp size={16} className="text-warm-gray" />
            ) : (
              <ChevronDown size={16} className="text-warm-gray" />
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-glass-medium rounded-button p-2">
              <p className="text-field-xs text-warm-gray">Regular</p>
              <p className="text-field-base font-semibold text-onyx">{entry.regularHours}h</p>
            </div>
            <div className="bg-glass-medium rounded-button p-2">
              <p className="text-field-xs text-warm-gray">OT</p>
              <p className="text-field-base font-semibold text-accent-amber">{entry.overtimeHours}h</p>
            </div>
            <div className="bg-glass-medium rounded-button p-2">
              <p className="text-field-xs text-warm-gray">Double</p>
              <p className="text-field-base font-semibold text-onyx">{entry.doubleTimeHours}h</p>
            </div>
          </div>

          {entry.clockIn && (
            <div className="text-field-xs text-warm-gray">
              Clock in: {new Date(entry.clockIn).toLocaleTimeString()}
              {entry.clockOut && ` → Out: ${new Date(entry.clockOut).toLocaleTimeString()}`}
            </div>
          )}

          {entry.notes && (
            <p className="text-field-xs text-warm-gray italic">{entry.notes}</p>
          )}

          {entry.withinGeofence === false && (
            <div className="flex items-center gap-1 text-field-xs text-accent-amber">
              <AlertCircle size={14} />
              Outside geofence at clock-in
            </div>
          )}

          {showApproveButton && entry.approvalStatus === "pending" && onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-teal/15 text-accent-teal font-semibold text-field-sm transition-all active:scale-[0.98]"
            >
              <Check size={16} />
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  );
}
