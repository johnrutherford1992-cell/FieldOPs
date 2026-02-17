"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Timer,
  Plus,
  X,
  Play,
  Square,
  Check,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Clock,
  AlertCircle,
} from "lucide-react";
import { generateId } from "@/lib/db";
import type {
  TimeEntry,
  TimeEntryMethod,
  TimeEntryApprovalStatus,
  ManpowerEntry,
  Subcontractor,
  TaktZone,
  CostCode,
} from "@/lib/types";

interface TimeTrackingScreenProps {
  entries: TimeEntry[];
  onEntriesChange: (entries: TimeEntry[]) => void;
  manpower: ManpowerEntry[];
  subcontractors: Subcontractor[];
  taktZones: TaktZone[];
  costCodes: CostCode[];
  projectId: string;
  date: string;
}

export default function TimeTrackingScreen({
  entries,
  onEntriesChange,
  manpower,
  subcontractors,
  taktZones,
  costCodes,
  projectId,
  date,
}: TimeTrackingScreenProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // ── Computed summaries ──
  const summary = useMemo(() => {
    const totalRegular = entries.reduce((s, e) => s + e.regularHours, 0);
    const totalOT = entries.reduce((s, e) => s + e.overtimeHours, 0);
    const totalDT = entries.reduce((s, e) => s + e.doubleTimeHours, 0);
    const totalHours = entries.reduce((s, e) => s + e.totalHours, 0);
    const pending = entries.filter((e) => e.approvalStatus === "pending").length;
    const approved = entries.filter((e) => e.approvalStatus === "approved").length;
    return { totalRegular, totalOT, totalDT, totalHours, pending, approved, count: entries.length };
  }, [entries]);

  // ── Build worker list from manpower (already on site today) ──
  const availableWorkers = useMemo(() => {
    const workers: { id: string; name: string; trade: string; subId: string }[] = [];
    const existingWorkerIds = new Set(entries.map((e) => e.workerId));

    manpower.forEach((mp) => {
      const sub = subcontractors.find((s) => s.id === mp.subId);
      if (!sub) return;

      const totalWorkers = mp.journeymanCount + mp.apprenticeCount + mp.foremanCount;
      // Create placeholder workers based on headcount
      for (let i = 0; i < totalWorkers; i++) {
        const workerId = `${mp.subId}-w${i}`;
        if (!existingWorkerIds.has(workerId)) {
          const role = i < mp.foremanCount ? "Foreman" : i < mp.foremanCount + mp.journeymanCount ? "Journeyman" : "Apprentice";
          workers.push({
            id: workerId,
            name: `${sub.company} ${role} ${i + 1}`,
            trade: mp.trade,
            subId: mp.subId,
          });
        }
      }
    });

    return workers;
  }, [manpower, subcontractors, entries]);

  // ── Add a single time entry ──
  const handleAddEntry = useCallback(
    (worker: { id: string; name: string; trade: string }) => {
      const newEntry: TimeEntry = {
        id: generateId("time"),
        projectId,
        date,
        workerId: worker.id,
        workerName: worker.name,
        trade: worker.trade,
        entryMethod: "manual" as TimeEntryMethod,
        regularHours: 8,
        overtimeHours: 0,
        doubleTimeHours: 0,
        breakMinutes: 30,
        totalHours: 8,
        approvalStatus: "pending" as TimeEntryApprovalStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onEntriesChange([...entries, newEntry]);
      setShowAddModal(false);
    },
    [entries, onEntriesChange, projectId, date]
  );

  // ── Auto-populate from manpower (bulk add) ──
  const handleBulkFromManpower = useCallback(() => {
    const newEntries: TimeEntry[] = availableWorkers.map((worker) => ({
      id: generateId("time"),
      projectId,
      date,
      workerId: worker.id,
      workerName: worker.name,
      trade: worker.trade,
      entryMethod: "manual" as TimeEntryMethod,
      regularHours: 8,
      overtimeHours: 0,
      doubleTimeHours: 0,
      breakMinutes: 30,
      totalHours: 8,
      approvalStatus: "pending" as TimeEntryApprovalStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    onEntriesChange([...entries, ...newEntries]);
    setShowAddModal(false);
  }, [availableWorkers, entries, onEntriesChange, projectId, date]);

  // ── Remove entry ──
  const handleRemove = useCallback(
    (id: string) => {
      onEntriesChange(entries.filter((e) => e.id !== id));
    },
    [entries, onEntriesChange]
  );

  // ── Update a field on an entry ──
  const updateEntry = useCallback(
    (id: string, updates: Partial<TimeEntry>) => {
      onEntriesChange(
        entries.map((e) => {
          if (e.id !== id) return e;
          const updated = { ...e, ...updates, updatedAt: new Date().toISOString() };
          // Recompute total hours
          updated.totalHours = updated.regularHours + updated.overtimeHours + updated.doubleTimeHours;
          return updated;
        })
      );
    },
    [entries, onEntriesChange]
  );

  // ── Clock in/out toggle ──
  const handleClockToggle = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;

      if (!entry.clockIn) {
        // Clock in
        const now = new Date().toISOString();
        updateEntry(id, {
          clockIn: now,
          entryMethod: "clock_in_out",
        });
      } else if (!entry.clockOut) {
        // Clock out
        const now = new Date();
        const clockInTime = new Date(entry.clockIn);
        const diffHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        const breakHours = entry.breakMinutes / 60;
        const workedHours = Math.max(0, diffHours - breakHours);
        const regular = Math.min(workedHours, 8);
        const overtime = Math.min(Math.max(0, workedHours - 8), 4);
        const doubleTime = Math.max(0, workedHours - 12);

        updateEntry(id, {
          clockOut: now.toISOString(),
          regularHours: Math.round(regular * 4) / 4,
          overtimeHours: Math.round(overtime * 4) / 4,
          doubleTimeHours: Math.round(doubleTime * 4) / 4,
        });
      }
    },
    [entries, updateEntry]
  );

  // ── Approve entry ──
  const handleApprove = useCallback(
    (id: string) => {
      updateEntry(id, { approvalStatus: "approved", approvedAt: new Date().toISOString() });
    },
    [updateEntry]
  );

  // ── Approve all pending ──
  const handleApproveAll = useCallback(() => {
    const now = new Date().toISOString();
    onEntriesChange(
      entries.map((e) =>
        e.approvalStatus === "pending"
          ? { ...e, approvalStatus: "approved" as TimeEntryApprovalStatus, approvedAt: now, updatedAt: now }
          : e
      )
    );
  }, [entries, onEntriesChange]);

  // ── Group entries by trade ──
  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimeEntry[]> = {};
    entries.forEach((e) => {
      if (!groups[e.trade]) groups[e.trade] = [];
      groups[e.trade].push(e);
    });
    return groups;
  }, [entries]);

  return (
    <div className="flex flex-col h-full bg-alabaster">
      {/* Summary Bar */}
      <div className="bg-gradient-violet text-white px-4 py-4 rounded-card shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Timer size={28} className="text-alabaster" />
            <div>
              <p className="text-field-sm text-alabaster/80 font-body">
                Today&apos;s Time
              </p>
              <p className="text-field-3xl font-heading font-semibold text-white">
                {summary.totalHours.toFixed(1)} hrs
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-field-sm text-alabaster/80">{summary.count} workers</p>
          </div>
        </div>

        {/* Hours breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-button px-3 py-2 text-center">
            <p className="text-field-xs text-alabaster/70">Regular</p>
            <p className="text-field-base font-semibold">{summary.totalRegular.toFixed(1)}</p>
          </div>
          <div className="bg-white/10 rounded-button px-3 py-2 text-center">
            <p className="text-field-xs text-alabaster/70">OT</p>
            <p className="text-field-base font-semibold text-accent-amber">{summary.totalOT.toFixed(1)}</p>
          </div>
          <div className="bg-white/10 rounded-button px-3 py-2 text-center">
            <p className="text-field-xs text-alabaster/70">Pending</p>
            <p className="text-field-base font-semibold">{summary.pending}</p>
          </div>
        </div>
      </div>

      {/* Approve All Bar */}
      {summary.pending > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={handleApproveAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-teal/15 text-accent-teal text-field-sm font-semibold transition-all active:scale-[0.98]"
          >
            <Check size={18} />
            Approve All ({summary.pending} pending)
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
        {entries.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-4 p-4 bg-alabaster rounded-full">
              <Clock size={40} className="text-warm-gray" />
            </div>
            <h3 className="text-field-lg font-heading font-semibold text-onyx mb-2 text-center">
              No Time Entries
            </h3>
            <p className="text-field-sm text-warm-gray font-body text-center max-w-xs mb-4">
              Add workers from today&apos;s manpower log or manually add time entries.
            </p>
            {manpower.length > 0 && (
              <button
                onClick={handleBulkFromManpower}
                className="flex items-center gap-2 px-5 py-3 rounded-button bg-accent-violet/15 text-accent-violet text-field-sm font-semibold transition-all active:scale-[0.98]"
              >
                <UserPlus size={18} />
                Auto-populate from Manpower ({availableWorkers.length} workers)
              </button>
            )}
          </div>
        ) : (
          /* Grouped Time Entries */
          Object.entries(groupedEntries).map(([trade, tradeEntries]) => (
            <div key={trade} className="space-y-2">
              {/* Trade Header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-field-sm font-heading font-semibold text-onyx uppercase tracking-wide">
                  {trade}
                </h3>
                <span className="text-field-xs text-warm-gray">
                  {tradeEntries.reduce((s, e) => s + e.totalHours, 0).toFixed(1)} hrs
                </span>
              </div>

              {tradeEntries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;
                const isClockedIn = !!entry.clockIn && !entry.clockOut;
                const statusColor =
                  entry.approvalStatus === "approved"
                    ? "text-accent-teal"
                    : entry.approvalStatus === "rejected"
                    ? "text-accent-red"
                    : "text-accent-amber";

                return (
                  <div
                    key={entry.id}
                    className="bg-glass rounded-xl shadow-glass-card border border-white/[0.06] overflow-hidden"
                  >
                    {/* Entry Header Row */}
                    <button
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all active:scale-[0.99]"
                    >
                      {/* Clock In/Out indicator */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isClockedIn
                            ? "bg-accent-teal/15 animate-glow-pulse"
                            : entry.clockOut
                            ? "bg-accent-violet/15"
                            : "bg-glass-medium"
                        }`}
                      >
                        {isClockedIn ? (
                          <Play size={16} className="text-accent-teal" />
                        ) : (
                          <Clock size={16} className="text-warm-gray" />
                        )}
                      </div>

                      {/* Worker info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-field-base font-heading font-semibold text-onyx truncate">
                          {entry.workerName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
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

                      {/* Hours */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-field-lg font-heading font-semibold text-onyx">
                          {entry.totalHours.toFixed(1)}h
                        </p>
                        {entry.overtimeHours > 0 && (
                          <p className="text-field-xs text-accent-amber">
                            +{entry.overtimeHours.toFixed(1)} OT
                          </p>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <div className="flex-shrink-0 ml-1">
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-warm-gray" />
                        ) : (
                          <ChevronDown size={18} className="text-warm-gray" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06] pt-4 animate-fade-in">
                        {/* Clock In/Out Controls */}
                        <div className="flex gap-2">
                          {!entry.clockOut && (
                            <button
                              onClick={() => handleClockToggle(entry.id)}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-button font-semibold text-field-sm transition-all active:scale-[0.98] ${
                                isClockedIn
                                  ? "bg-accent-red/15 text-accent-red"
                                  : "bg-accent-teal/15 text-accent-teal"
                              }`}
                            >
                              {isClockedIn ? (
                                <>
                                  <Square size={16} />
                                  Clock Out
                                </>
                              ) : (
                                <>
                                  <Play size={16} />
                                  Clock In
                                </>
                              )}
                            </button>
                          )}
                          {entry.approvalStatus === "pending" && (
                            <button
                              onClick={() => handleApprove(entry.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-teal/15 text-accent-teal font-semibold text-field-sm transition-all active:scale-[0.98]"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                          )}
                        </div>

                        {/* Manual Hours Inputs */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Regular</label>
                            <input
                              type="number"
                              value={entry.regularHours}
                              onChange={(e) =>
                                updateEntry(entry.id, {
                                  regularHours: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-base text-center font-semibold bg-glass text-onyx"
                              min="0"
                              step="0.25"
                            />
                          </div>
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Overtime</label>
                            <input
                              type="number"
                              value={entry.overtimeHours}
                              onChange={(e) =>
                                updateEntry(entry.id, {
                                  overtimeHours: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-base text-center font-semibold bg-glass text-onyx"
                              min="0"
                              step="0.25"
                            />
                          </div>
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Double</label>
                            <input
                              type="number"
                              value={entry.doubleTimeHours}
                              onChange={(e) =>
                                updateEntry(entry.id, {
                                  doubleTimeHours: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-base text-center font-semibold bg-glass text-onyx"
                              min="0"
                              step="0.25"
                            />
                          </div>
                        </div>

                        {/* Break & Cost Code */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Break (min)</label>
                            <input
                              type="number"
                              value={entry.breakMinutes}
                              onChange={(e) =>
                                updateEntry(entry.id, {
                                  breakMinutes: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-base text-center font-semibold bg-glass text-onyx"
                              min="0"
                              step="15"
                            />
                          </div>
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Cost Code</label>
                            <select
                              value={entry.costCodeId || ""}
                              onChange={(e) =>
                                updateEntry(entry.id, {
                                  costCodeId: e.target.value || undefined,
                                  csiDivision: costCodes.find((c) => c.id === e.target.value)?.csiDivision,
                                })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx"
                            >
                              <option value="">None</option>
                              {costCodes.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                  {cc.code} — {cc.description}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Zone selection */}
                        {taktZones.length > 0 && (
                          <div>
                            <label className="block text-field-xs text-warm-gray mb-1">Zone</label>
                            <select
                              value={entry.taktZone || ""}
                              onChange={(e) =>
                                updateEntry(entry.id, { taktZone: e.target.value || undefined })
                              }
                              className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx"
                            >
                              <option value="">No zone</option>
                              {taktZones.map((tz) => (
                                <option key={tz.id} value={tz.zoneCode}>
                                  {tz.zoneCode} — {tz.zoneName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label className="block text-field-xs text-warm-gray mb-1">Notes</label>
                          <input
                            type="text"
                            value={entry.notes || ""}
                            onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                            placeholder="Optional notes..."
                            className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx placeholder-warm-gray"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-red/10 text-accent-red text-field-sm font-semibold transition-all active:scale-[0.98]"
                        >
                          <X size={16} />
                          Remove Entry
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom Add Button */}
      <div className="px-4 py-4 border-t border-white/[0.06] bg-alabaster">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-button bg-accent-violet text-white text-field-base font-semibold font-body transition-all active:scale-[0.98] hover:bg-accent-violet/80"
        >
          <Plus size={24} />
          <span>Add Time Entry</span>
        </button>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end">
          <div
            className="w-full bg-surface-primary rounded-t-2xl shadow-lg max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface-primary px-4 py-4 border-b border-white/[0.06] flex items-center justify-between rounded-t-2xl">
              <h2 className="text-field-lg font-heading font-semibold text-onyx">
                Add Time Entry
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex items-center justify-center w-10 h-10 rounded-button bg-glass text-onyx hover:bg-glass-light active:scale-[0.95] transition-all"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Bulk Add from Manpower */}
            {availableWorkers.length > 0 && (
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <button
                  onClick={handleBulkFromManpower}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-card bg-accent-violet/15 text-accent-violet font-semibold text-field-base transition-all active:scale-[0.98]"
                >
                  <UserPlus size={20} />
                  Add All from Manpower ({availableWorkers.length})
                </button>
                <p className="text-field-xs text-warm-gray text-center mt-2">
                  Defaults to 8 regular hours each — edit individually after
                </p>
              </div>
            )}

            {/* Individual Worker Selection */}
            <div className="px-4 py-4 space-y-2">
              {availableWorkers.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle size={24} className="text-warm-gray mx-auto mb-2" />
                  <p className="text-field-base text-warm-gray font-body">
                    All workers from manpower have been added
                  </p>
                  <p className="text-field-xs text-warm-gray mt-1">
                    Go back to Manpower to add more trades first
                  </p>
                </div>
              ) : (
                availableWorkers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => handleAddEntry(worker)}
                    className="w-full text-left px-4 py-4 rounded-card bg-glass hover:bg-glass-light active:bg-glass-medium transition-all active:scale-[0.98] border border-white/[0.06]"
                  >
                    <h3 className="text-field-base font-heading font-semibold text-onyx mb-1">
                      {worker.name}
                    </h3>
                    <p className="text-field-sm text-warm-gray font-body">
                      {worker.trade}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Close Button */}
            <div className="sticky bottom-0 px-4 py-4 bg-surface-primary border-t border-white/[0.06]">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-6 py-4 rounded-button bg-glass-medium text-onyx text-field-base font-semibold font-body transition-all active:scale-[0.98] hover:bg-glass-heavy"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
