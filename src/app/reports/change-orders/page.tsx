"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import { useAppStore } from "@/lib/store";
import { db, generateId } from "@/lib/db";
import { generateMockChangeOrder } from "@/lib/report-prompts";
import type { ChangeEntry, ChangeOrder, DailyLog, Project, Subcontractor } from "@/lib/types";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Printer,
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Clock,
  Plus,
} from "lucide-react";

interface IdentifiedChange {
  logId: string;
  logDate: string;
  change: ChangeEntry;
  changeIndex: number;
  existingCO?: ChangeOrder;
}

export default function ChangeOrdersPage() {
  const { activeProject } = useAppStore();
  const [identifiedChanges, setIdentifiedChanges] = useState<IdentifiedChange[]>([]);
  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const [draftHTML, setDraftHTML] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const claudeApiKey = useAppStore((state) => state.claudeApiKey);

  // Load changes from daily logs on mount
  useEffect(() => {
    async function loadChanges() {
      if (!activeProject) return;

      // Get all daily logs with changes
      const allLogs = await db.dailyLogs
        .where("projectId")
        .equals(activeProject.id)
        .toArray();
      const logsWithChanges = allLogs.filter((l: DailyLog) => l.changes.length > 0);

      // Get existing change orders
      const existingCOs = await db.changeOrders
        .where("projectId")
        .equals(activeProject.id)
        .toArray();

      // Build identified changes array
      const changes: IdentifiedChange[] = [];
      for (const log of logsWithChanges) {
        for (let i = 0; i < log.changes.length; i++) {
          const change = log.changes[i];
          // Find CO that references this log and change index
          const matchingCO = existingCOs.find(
            (co: ChangeOrder) =>
              co.dailyLogRef === log.id &&
              co.description === change.description
          );

          changes.push({
            logId: log.id,
            logDate: log.date,
            change,
            changeIndex: i,
            existingCO: matchingCO,
          });
        }
      }

      setIdentifiedChanges(changes);
      setInitialized(true);
    }

    loadChanges();
  }, [activeProject]);

  const getAffectedSubcontractors = (
    change: ChangeEntry,
    project: Project
  ): Subcontractor[] => {
    return project.subcontractors.filter((sub) =>
      sub.csiDivisions.some((div) => change.affectedDivisions.includes(div))
    );
  };

  const handleDraftCO = async (change: IdentifiedChange) => {
    if (!activeProject) return;

    setIsLoading(true);
    try {
      const affectedSubs = getAffectedSubcontractors(change.change, activeProject);
      const affectedSubNames = affectedSubs.map((s) => s.company);

      let generatedDraft: string;

      // Always attempt the API — server may have a company-wide key configured
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-order",
          apiKey: claudeApiKey || undefined,
          project: activeProject,
          changeEntry: change.change,
          dailyLogDate: change.logDate,
          affectedSubNames,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        generatedDraft = data.html || data;
      } else {
        // Fall back to mock if API fails (no key configured anywhere)
        generatedDraft = generateMockChangeOrder(
          activeProject,
          change.change,
          change.logDate,
          affectedSubNames
        );
      }

      // Save to database
      const newCO: ChangeOrder = {
        id: generateId("co"),
        projectId: activeProject.id,
        dailyLogRef: change.logId,
        description: change.change.description,
        affectedSubs: affectedSubs.map((sub) => ({
          subId: sub.id,
          quoteRequested: false,
          quoteReceived: false,
        })),
        generatedDraft,
        status: "drafted",
        createdAt: new Date().toISOString(),
      };

      await db.changeOrders.put(newCO);

      // Update identified changes
      const updated = identifiedChanges.map((ic) =>
        ic.logId === change.logId && ic.changeIndex === change.changeIndex
          ? { ...ic, existingCO: newCO }
          : ic
      );
      setIdentifiedChanges(updated);

      // Show draft
      setDraftHTML(generatedDraft);
      setSelectedChangeIndex(
        identifiedChanges.indexOf(change)
      );
    } catch (error) {
      console.error("Error generating change order:", error);
      alert("Failed to generate change order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(draftHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!activeProject || !initialized) {
    return (
      <AppShell>
        <div className="screen">
          <Header title="Change Orders" backHref="/reports" />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-onyx" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Show draft view
  if (draftHTML && selectedChangeIndex !== null) {
    return (
      <AppShell>
        <div className="screen">
          <Header title="Change Order Draft" backHref="/reports/change-orders" />

          <div className="overflow-auto flex-1 bg-obsidian">
            <div className="max-w-3xl mx-auto p-5 bg-glass rounded-lg m-5 shadow-sm">
              <div
                dangerouslySetInnerHTML={{ __html: draftHTML }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-0 bg-glass border-t border-gray-100 p-4 flex gap-3 safe-area-inset-bottom">
            <button
              onClick={() => {
                setDraftHTML("");
                setSelectedChangeIndex(null);
              }}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-lg border border-accent-violet text-accent-violet font-semibold text-field-base transition-colors active:scale-95 hover:bg-glass-light"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to List
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 h-14 flex items-center justify-center gap-2 rounded-lg bg-accent-violet text-white font-semibold text-field-base transition-colors active:scale-95 hover:bg-accent-violet/80"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show list view
  if (identifiedChanges.length === 0) {
    return (
      <AppShell>
        <div className="screen">
          <Header title="Change Orders" backHref="/reports" />
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12" />}
            title="No Changes Found"
            description="No changes or directives have been recorded in your daily logs yet."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="screen flex flex-col">
        <Header title="Change Orders" backHref="/reports" />

        <div className="flex-1 overflow-auto px-4 py-6">
          <div className="space-y-3">
            {identifiedChanges.map((ic, idx) => (
              <ChangeItemCard
                key={`${ic.logId}-${ic.changeIndex}`}
                change={ic}
                onDraft={() => handleDraftCO(ic)}
                onView={() => {
                  setDraftHTML(ic.existingCO?.generatedDraft || "");
                  setSelectedChangeIndex(idx);
                }}
                isLoading={isLoading}
              />
            ))}
          </div>

          <div className="h-8" />
        </div>
      </div>
    </AppShell>
  );
}

interface ChangeItemCardProps {
  change: IdentifiedChange;
  onDraft: () => void;
  onView: () => void;
  isLoading: boolean;
}

function ChangeItemCard({
  change,
  onDraft,
  onView,
  isLoading,
}: ChangeItemCardProps) {
  const { activeProject } = useAppStore();

  if (!activeProject) return null;

  const affectedSubs = activeProject.subcontractors.filter((sub) =>
    sub.csiDivisions.some((div) =>
      change.change.affectedDivisions.includes(div)
    )
  );

  const statusLabel = change.existingCO
    ? change.existingCO.status.charAt(0).toUpperCase() +
      change.existingCO.status.slice(1)
    : "New";

  const impactColor =
    change.change.impact === "cost"
      ? "bg-amber-100 text-amber-900"
      : change.change.impact === "schedule"
        ? "bg-blue-100 text-blue-900"
        : "bg-red-100 text-red-900";

  const initiatorLabel =
    change.change.initiatedBy.charAt(0).toUpperCase() +
    change.change.initiatedBy.slice(1).replace("_", " ");

  return (
    <div className="border border-gray-100 rounded-lg bg-glass p-4">
      {/* Header row with date and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-warm-gray font-medium uppercase tracking-wide">
            {change.logDate}
          </p>
          <p className="text-field-base font-semibold text-onyx mt-1 pr-3">
            {change.change.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
              statusLabel === "New"
                ? "bg-accent-violet/15 text-accent-violet"
                : "bg-accent-green/15 text-accent-green"
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Initiator badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.1] text-onyx">
          {initiatorLabel}
        </span>

        {/* Impact badge */}
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${impactColor}`}>
          {change.change.impact === "both" ? (
            <>
              <DollarSign className="w-3 h-3" />
              <Clock className="w-3 h-3" />
              Both
            </>
          ) : change.change.impact === "cost" ? (
            <>
              <DollarSign className="w-3 h-3" />
              Cost
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              Schedule
            </>
          )}
        </span>
      </div>

      {/* Affected divisions */}
      <div className="mb-3">
        <p className="text-xs text-warm-gray font-medium uppercase tracking-wide mb-1">
          CSI Divisions
        </p>
        <p className="text-sm text-onyx">
          {change.change.affectedDivisions.join(", ")}
        </p>
      </div>

      {/* Affected subcontractors */}
      {affectedSubs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-warm-gray font-medium uppercase tracking-wide mb-1">
            Affected Subcontractors
          </p>
          <p className="text-sm text-onyx">
            {affectedSubs.map((s) => s.company).join(", ")}
          </p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={change.existingCO ? onView : onDraft}
        disabled={isLoading}
        className="w-full h-14 flex items-center justify-center gap-2 rounded-lg bg-accent-violet text-white font-semibold text-field-base transition-colors active:scale-95 hover:bg-accent-violet/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : change.existingCO ? (
          <>
            <FileText className="w-5 h-5" />
            View Draft
            <ChevronRight className="w-4 h-4 ml-auto" />
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Draft CO
            <ChevronRight className="w-4 h-4 ml-auto" />
          </>
        )}
      </button>
    </div>
  );
}
