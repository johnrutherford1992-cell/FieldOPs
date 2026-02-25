"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db, generateId } from "@/lib/db";
import type {
  ResourceRequest,
  ResourcePriority,
  ResourceType,
  ResourceRequestStatus,
  ScheduleEntry,
  ResourceConflict,
} from "@/lib/types";
import {
  Package,
  Plus,
  X,
  Send,
  Users,
  Truck,
  Box,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
  Link2,
} from "lucide-react";

type TabView = "requests" | "schedule" | "conflicts";

const PRIORITY_COLORS: Record<ResourcePriority, string> = {
  low: "text-warm-gray bg-glass-medium",
  medium: "text-accent-amber bg-accent-amber/10",
  high: "text-accent-red bg-accent-red/10",
  critical: "text-white bg-accent-red",
};

const STATUS_COLORS: Record<ResourceRequestStatus, string> = {
  draft: "text-warm-gray",
  submitted: "text-accent-amber",
  acknowledged: "text-accent-violet",
  allocated: "text-accent-teal",
  partially_allocated: "text-accent-amber",
  denied: "text-accent-red",
  completed: "text-accent-teal",
  cancelled: "text-warm-gray",
};

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  labor: <Users size={18} />,
  equipment: <Truck size={18} />,
  material: <Box size={18} />,
};

export default function ResourcesPage() {
  const { activeProject, currentDate } = useAppStore();
  const [tab, setTab] = useState<TabView>("requests");
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New request form state
  const [newType, setNewType] = useState<ResourceType>("labor");
  const [newTrade, setNewTrade] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPriority, setNewPriority] = useState<ResourcePriority>("medium");
  const [newNeededBy, setNewNeededBy] = useState(currentDate);

  // Load data
  const loadData = useCallback(async () => {
    if (!activeProject) return;
    const [reqs, sched, conf] = await Promise.all([
      db.resourceRequests.where("projectId").equals(activeProject.id).reverse().sortBy("createdAt"),
      db.scheduleEntries.where({ projectId: activeProject.id, date: currentDate }).toArray(),
      db.resourceConflicts.where("projectId").equals(activeProject.id).filter((c: ResourceConflict) => !c.resolved).toArray(),
    ]);
    setRequests(reqs);
    setSchedule(sched);
    setConflicts(conf);
  }, [activeProject, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit new request
  const handleSubmitRequest = useCallback(async () => {
    if (!activeProject || !newDesc) return;

    const request: ResourceRequest = {
      id: generateId("rreq"),
      projectId: activeProject.id,
      requestType: newType,
      trade: newTrade || undefined,
      description: newDesc,
      quantity: newQty,
      unitOfMeasure: newType === "labor" ? "workers" : "units",
      priority: newPriority,
      neededByDate: newNeededBy,
      requestedBy: "Superintendent",
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.resourceRequests.put(request);

    // Sync to Kinetic Craft
    setIsSyncing(true);
    try {
      const resp = await fetch("/api/kinetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          fieldOpsProjectId: activeProject.id,
          fieldOpsRequestId: request.id,
          resourceType: newType,
          trade: newTrade,
          quantity: newQty,
          neededByDate: newNeededBy,
          priority: newPriority,
          siteAddress: activeProject.address,
          projectName: activeProject.name,
        }),
      });
      const result = await resp.json();
      if (result.kineticRequestId) {
        await db.resourceRequests.update(request.id, {
          kineticRequestId: result.kineticRequestId,
          kineticSyncedAt: new Date().toISOString(),
          status: "submitted",
        });
      }
    } catch (err) {
      console.error("Kinetic sync failed:", err);
    }
    setIsSyncing(false);

    // Reset form
    setShowNewForm(false);
    setNewDesc("");
    setNewTrade("");
    setNewQty(1);
    loadData();
  }, [activeProject, newType, newTrade, newDesc, newQty, newPriority, newNeededBy, loadData]);

  const openRequests = requests.filter((r) => !["completed", "cancelled", "denied"].includes(r.status));

  return (
    <AppShell>
      <div className="screen">
        <Header title="Resources" subtitle="Request & Schedule" backHref="/" />

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 pb-2">
          {(["requests", "schedule", "conflicts"] as TabView[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-button text-field-sm font-semibold transition-all ${
                tab === t ? "bg-accent-violet text-white shadow-violet-glow" : "bg-glass text-warm-gray"
              }`}
            >
              {t === "requests" && `Requests${openRequests.length > 0 ? ` (${openRequests.length})` : ""}`}
              {t === "schedule" && "Schedule"}
              {t === "conflicts" && `Conflicts${conflicts.length > 0 ? ` (${conflicts.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="px-5 pt-4 pb-32 space-y-4">
          {/* ── Requests Tab ── */}
          {tab === "requests" && (
            <>
              {/* Kinetic Craft Status */}
              <div className="bg-glass rounded-card p-3 border border-gray-100 flex items-center gap-2">
                <Link2 size={16} className="text-accent-violet" />
                <span className="text-field-xs text-warm-gray">
                  Kinetic Craft — requests sync automatically
                </span>
              </div>

              {/* New Request Button or Form */}
              {!showNewForm ? (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-card bg-accent-violet text-white font-semibold text-field-base transition-all active:scale-[0.98]"
                >
                  <Plus size={20} />
                  New Resource Request
                </button>
              ) : (
                <div className="bg-glass rounded-card p-4 border border-accent-violet/30 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-field-base font-heading font-semibold text-onyx">New Request</h3>
                    <button onClick={() => setShowNewForm(false)} className="text-warm-gray">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Type selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {(["labor", "equipment", "material"] as ResourceType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-button text-field-sm font-semibold transition-all ${
                          newType === t ? "bg-accent-violet text-white" : "bg-glass-medium text-warm-gray"
                        }`}
                      >
                        {TYPE_ICONS[t]}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Trade */}
                  {newType === "labor" && (
                    <select
                      value={newTrade}
                      onChange={(e) => setNewTrade(e.target.value)}
                      className="w-full px-3 py-3 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx"
                    >
                      <option value="">Select trade...</option>
                      {activeProject?.subcontractors.map((sub) => (
                        <option key={sub.id} value={sub.trade}>{sub.trade} — {sub.company}</option>
                      ))}
                    </select>
                  )}

                  {/* Description */}
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description (e.g., '4 ironworkers for steel erection')"
                    className="w-full px-3 py-3 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx placeholder-warm-gray"
                  />

                  {/* Quantity + Priority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-field-xs text-warm-gray mb-1">Quantity</label>
                      <input
                        type="number"
                        value={newQty}
                        onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-button border border-gray-100 text-field-base text-center font-semibold bg-glass text-onyx"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-field-xs text-warm-gray mb-1">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as ResourcePriority)}
                        className="w-full px-3 py-2 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Needed by */}
                  <div>
                    <label className="block text-field-xs text-warm-gray mb-1">Needed By</label>
                    <input
                      type="date"
                      value={newNeededBy}
                      onChange={(e) => setNewNeededBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmitRequest}
                    disabled={!newDesc || isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-button bg-accent-violet text-white font-semibold text-field-base transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <><Loader2 size={18} className="animate-spin" /> Syncing...</>
                    ) : (
                      <><Send size={18} /> Submit Request</>
                    )}
                  </button>
                </div>
              )}

              {/* Request List */}
              {requests.map((req) => (
                <div key={req.id} className="bg-glass rounded-xl shadow-glass-card border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex-shrink-0">{TYPE_ICONS[req.requestType]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-field-base font-heading font-semibold text-onyx truncate">{req.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-field-xs font-semibold ${STATUS_COLORS[req.status]}`}>
                          {req.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span className={`text-field-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLORS[req.priority]}`}>
                          {req.priority}
                        </span>
                        {req.kineticRequestId && (
                          <span className="text-field-xs text-accent-violet bg-accent-violet/10 px-1.5 py-0.5 rounded">KC</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-field-sm text-onyx font-semibold">{req.quantity} {req.unitOfMeasure}</p>
                      <p className="text-field-xs text-warm-gray">by {req.neededByDate}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedId === req.id ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
                    </div>
                  </button>

                  {expandedId === req.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2 animate-fade-in">
                      {req.trade && <p className="text-field-xs text-warm-gray">Trade: {req.trade}</p>}
                      {req.kineticResponse && <p className="text-field-xs text-accent-teal">Kinetic: {req.kineticResponse}</p>}
                      {req.notes && <p className="text-field-xs text-warm-gray italic">{req.notes}</p>}
                      <p className="text-field-xs text-warm-gray">Created: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}

              {requests.length === 0 && (
                <div className="text-center py-12">
                  <Package size={40} className="text-warm-gray mx-auto mb-3" />
                  <p className="text-field-base text-onyx font-semibold">No Requests Yet</p>
                  <p className="text-field-sm text-warm-gray mt-1">Create a resource request to get started</p>
                </div>
              )}
            </>
          )}

          {/* ── Schedule Tab ── */}
          {tab === "schedule" && (
            <>
              <div className="bg-glass rounded-card p-3 border border-gray-100 flex items-center gap-2">
                <Calendar size={16} className="text-accent-violet" />
                <span className="text-field-sm text-onyx font-semibold">{currentDate}</span>
                <span className="text-field-xs text-warm-gray ml-auto">{schedule.length} scheduled</span>
              </div>

              {schedule.map((entry) => (
                <div key={entry.id} className="bg-glass rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    {TYPE_ICONS[entry.resourceType]}
                    <div className="flex-1">
                      <p className="text-field-base font-semibold text-onyx">{entry.resourceName}</p>
                      <p className="text-field-xs text-warm-gray">
                        {entry.startTime && `${entry.startTime} — ${entry.endTime || "TBD"}`}
                        {entry.taktZone && ` · Zone ${entry.taktZone}`}
                      </p>
                    </div>
                    <span className={`text-field-xs px-2 py-1 rounded font-semibold ${
                      entry.status === "confirmed" ? "bg-accent-teal/10 text-accent-teal" : "bg-glass-medium text-warm-gray"
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}

              {schedule.length === 0 && (
                <div className="text-center py-12">
                  <Calendar size={40} className="text-warm-gray mx-auto mb-3" />
                  <p className="text-field-base text-onyx font-semibold">No Schedule for Today</p>
                  <p className="text-field-sm text-warm-gray mt-1">Allocations from Kinetic Craft will appear here</p>
                </div>
              )}
            </>
          )}

          {/* ── Conflicts Tab ── */}
          {tab === "conflicts" && (
            <>
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="bg-glass rounded-xl p-4 border border-accent-red/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-accent-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-field-base font-semibold text-onyx">{conflict.description}</p>
                      <p className="text-field-xs text-warm-gray mt-1">
                        {conflict.conflictType.replace("_", " ")} · {conflict.severity}
                      </p>
                      {conflict.suggestedResolution && (
                        <p className="text-field-xs text-accent-teal mt-2">
                          Suggestion: {conflict.suggestedResolution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {conflicts.length === 0 && (
                <div className="text-center py-12">
                  <Check size={40} className="text-accent-teal mx-auto mb-3" />
                  <p className="text-field-base text-onyx font-semibold">No Conflicts</p>
                  <p className="text-field-sm text-warm-gray mt-1">All resource allocations are clear</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
