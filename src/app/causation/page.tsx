"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { db } from "@/lib/db";
import type {
  DelayEvent,
  NoticeLogEntry,
  DailyLog,
  ProductivityEntry,
  ProductivityBaseline,
  ChangeEntry,
  ConflictEntry,
} from "@/lib/types";
import {
  Link as LinkIcon,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════════

type FilterType = "all" | "with_notices" | "missing_notices";

interface ChainStep {
  step: number;
  title: string;
  completed: boolean;
  icon: JSX.Element;
  content: JSX.Element;
}

interface CausationChain {
  id: string;
  triggerId: string;
  type: "delay_event" | "change_order" | "conflict";
  triggerEvent: DelayEvent | ChangeEntry | ConflictEntry;
  notices: NoticeLogEntry[];
  relatedLogs: DailyLog[];
  productivityImpact: {
    baseline: ProductivityBaseline | null;
    beforeRate: number | null;
    afterRate: number | null;
    productivityLoss: number | null;
  } | null;
  estimatedCostImpact: number;
  completenessScore: number; // 1-5
}

interface PageState {
  chains: CausationChain[];
  loading: boolean;
  error: string | null;
  filter: FilterType;
  expandedChains: Set<string>;
}

// ════════════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════

export default function CausationPage(): JSX.Element {
  const { activeProject } = useAppStore();
  const [state, setState] = useState<PageState>({
    chains: [],
    loading: true,
    error: null,
    filter: "all",
    expandedChains: new Set(),
  });

  // Load causation chains on mount
  useEffect(() => {
    if (!activeProject) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "No project selected",
      }));
      return;
    }

    const loadChains = async (): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Load all delay events
        const delayEvents = await db.delayEvents
          .where("projectId")
          .equals(activeProject.id)
          .toArray();

        // Load all daily logs (for changes and conflicts)
        const dailyLogs = await db.dailyLogs
          .where("projectId")
          .equals(activeProject.id)
          .toArray();

        // Load all notices
        const noticesAll = await db.noticeLogs
          .where("projectId")
          .equals(activeProject.id)
          .toArray();

        // Load productivity entries and baselines
        const productivityEntries = await db.productivityEntries
          .where("projectId")
          .equals(activeProject.id)
          .toArray();

        const productivityBaselines = await db.productivityBaselines
          .where("projectId")
          .equals(activeProject.id)
          .toArray();

        // Build chains for delay events
        const chainPromises: Promise<CausationChain>[] = [];

        // Process delay events
        for (const delayEvent of delayEvents) {
          chainPromises.push(
            buildDelayEventChain(
              delayEvent,
              noticesAll,
              dailyLogs,
              productivityEntries,
              productivityBaselines
            )
          );
        }

        // Process changes with cost/schedule impact (from daily logs)
        for (const log of dailyLogs) {
          for (const change of log.changes) {
            if (
              (change.estimatedCostImpact && change.estimatedCostImpact > 0) ||
              (change.estimatedScheduleImpact && change.estimatedScheduleImpact > 0)
            ) {
              chainPromises.push(
                buildChangeChain(
                  change,
                  log.id,
                  noticesAll,
                  dailyLogs,
                  productivityEntries,
                  productivityBaselines
                )
              );
            }
          }
        }

        // Process conflicts with cost/schedule impact
        for (const log of dailyLogs) {
          for (const conflict of log.conflicts) {
            if (
              (conflict.estimatedCostImpact && conflict.estimatedCostImpact > 0) ||
              (conflict.estimatedScheduleDaysImpact && conflict.estimatedScheduleDaysImpact > 0)
            ) {
              chainPromises.push(
                buildConflictChain(
                  conflict,
                  log.id,
                  noticesAll,
                  dailyLogs,
                  productivityEntries,
                  productivityBaselines
                )
              );
            }
          }
        }

        const chains = await Promise.all(chainPromises);

        // Sort by completeness (highest first) then by date
        chains.sort((a, b) => {
          if (b.completenessScore !== a.completenessScore) {
            return b.completenessScore - a.completenessScore;
          }
          const dateA = "date" in a.triggerEvent ? a.triggerEvent.date : "";
          const dateB = "date" in b.triggerEvent ? b.triggerEvent.date : "";
          return dateB.localeCompare(dateA);
        });

        setState((prev) => ({
          ...prev,
          chains,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load causation chains";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    loadChains();
  }, [activeProject]);

  // Filter chains
  const filteredChains = state.chains.filter((chain) => {
    if (state.filter === "with_notices") {
      return chain.notices.length > 0;
    }
    if (state.filter === "missing_notices") {
      return chain.notices.length === 0;
    }
    return true;
  });

  // Calculate summary statistics
  const stats = {
    totalChains: state.chains.length,
    avgCompleteness: state.chains.length > 0
      ? (state.chains.reduce((sum, c) => sum + c.completenessScore, 0) / state.chains.length).toFixed(1)
      : 0,
    documentationGaps: state.chains.filter((c) => c.notices.length === 0 || !c.productivityImpact).length,
  };

  // Toggle chain expansion
  const toggleExpanded = (chainId: string): void => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedChains);
      if (newExpanded.has(chainId)) {
        newExpanded.delete(chainId);
      } else {
        newExpanded.add(chainId);
      }
      return { ...prev, expandedChains: newExpanded };
    });
  };

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ════════════════════════════════════════════════════════════════════════════════════

  if (state.loading) {
    return (
      <AppShell>
        <Header title="Causation Chains" subtitle={activeProject?.name} backHref="/" />
        <div className="pb-20 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
            <p className="text-field-sm text-warm-gray">Loading causation chains...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: No Project
  // ════════════════════════════════════════════════════════════════════════════════════

  if (!activeProject) {
    return (
      <AppShell>
        <Header title="Causation Chains" backHref="/" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertTriangle size={40} className="text-warm-gray opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">No Project Selected</p>
            <p className="text-field-sm text-warm-gray text-center">
              Please select a project from the home screen to view causation chains.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: Empty State
  // ════════════════════════════════════════════════════════════════════════════════════

  if (state.chains.length === 0) {
    return (
      <AppShell>
        <Header title="Causation Chains" subtitle={activeProject.name} backHref="/" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <LinkIcon size={40} className="text-warm-gray opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">No causation chains found</p>
            <p className="text-field-sm text-warm-gray text-center max-w-xs">
              Log delay events, changes, and notices to build legal causation chains.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: Main Page
  // ════════════════════════════════════════════════════════════════════════════════════

  return (
    <AppShell>
      <Header title="Causation Chains" subtitle={activeProject.name} backHref="/" />

      <div className="pb-20 px-4 pt-4 space-y-6">
        {/* ════════════════════════════════════════════════════════════ */}
        {/* 1. SUMMARY STATISTICS */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Chains Found */}
            <div className="bg-glass border border-white/[0.06] rounded-xl p-4 shadow-glass-card">
              <p className="text-field-xs text-warm-gray mb-2">Chains Found</p>
              <p className="text-field-2xl font-bold text-onyx">{stats.totalChains}</p>
              <p className="text-field-xs text-warm-gray mt-1">
                {filteredChains.length} shown
              </p>
            </div>

            {/* Average Completeness */}
            <div className="bg-glass border border-white/[0.06] rounded-xl p-4 shadow-glass-card">
              <p className="text-field-xs text-warm-gray mb-2">Avg Completeness</p>
              <p className="text-field-2xl font-bold text-onyx">{stats.avgCompleteness}/5</p>
              <p className="text-field-xs text-warm-gray mt-1">steps documented</p>
            </div>

            {/* Documentation Gaps */}
            <div className="bg-glass border border-white/[0.06] rounded-xl p-4 shadow-glass-card">
              <p className="text-field-xs text-warm-gray mb-2">Gaps</p>
              <p className="text-field-2xl font-bold text-accent-red">{stats.documentationGaps}</p>
              <p className="text-field-xs text-warm-gray mt-1">missing data</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 2. FILTER BUTTONS */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex gap-2">
          <button
            onClick={() => setState((prev) => ({ ...prev, filter: "all" }))}
            className={`px-4 py-2 rounded-lg text-field-xs font-semibold transition-colors ${
              state.filter === "all"
                ? "bg-accent-violet text-white"
                : "bg-glass border border-white/[0.06] text-onyx hover:bg-glass-light"
            }`}
          >
            All Chains
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, filter: "with_notices" }))}
            className={`px-4 py-2 rounded-lg text-field-xs font-semibold transition-colors ${
              state.filter === "with_notices"
                ? "bg-accent-green text-white"
                : "bg-glass border border-white/[0.06] text-onyx hover:bg-glass-light"
            }`}
          >
            With Notices
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, filter: "missing_notices" }))}
            className={`px-4 py-2 rounded-lg text-field-xs font-semibold transition-colors ${
              state.filter === "missing_notices"
                ? "bg-accent-red text-white"
                : "bg-glass border border-white/[0.06] text-onyx hover:bg-glass-light"
            }`}
          >
            Missing Notices
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 3. CAUSATION CHAIN CARDS */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {filteredChains.map((chain) => {
            const isExpanded = state.expandedChains.has(chain.id);
            const typeLabel = chain.type === "delay_event" ? "DELAY EVENT" :
                             chain.type === "change_order" ? "CHANGE ORDER" : "CONFLICT";
            const typeBgColor =
              chain.type === "delay_event"
                ? "bg-amber-100 text-amber-700"
                : chain.type === "change_order"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700";

            const completenessRingColor =
              chain.completenessScore >= 4
                ? "ring-green-400"
                : chain.completenessScore >= 2
                  ? "ring-amber-400"
                  : "ring-red-400";

            return (
              <div
                key={chain.id}
                className="bg-glass border border-white/[0.06] rounded-xl shadow-glass-card overflow-hidden"
              >
                {/* Header / Trigger Event */}
                <button
                  onClick={() => toggleExpanded(chain.id)}
                  className="w-full p-5 flex items-start gap-4 hover:bg-glass-light transition-colors text-left"
                >
                  {/* Completeness Ring */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ring-4 ${completenessRingColor} flex items-center justify-center bg-glass`}>
                    <div className="text-field-sm font-bold text-onyx">{chain.completenessScore}</div>
                  </div>

                  {/* Trigger Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-field-xs font-bold px-2.5 py-0.5 rounded-full ${typeBgColor}`}>
                        {typeLabel}
                      </span>
                      <p className="text-field-xs text-warm-gray">
                        {formatDate("date" in chain.triggerEvent ? chain.triggerEvent.date : "")}
                      </p>
                    </div>

                    <p className="text-field-sm font-semibold text-onyx mb-1">
                      {chain.triggerEvent.description}
                    </p>

                    <div className="flex items-center gap-4 text-field-xs text-warm-gray">
                      {chain.type === "delay_event" && (
                        <>
                          <span>
                            {(chain.triggerEvent as DelayEvent).calendarDaysImpacted || 0} calendar days
                          </span>
                          {(chain.triggerEvent as DelayEvent).responsibleParty && (
                            <span>
                              Responsible: {(chain.triggerEvent as DelayEvent).responsibleParty}
                            </span>
                          )}
                        </>
                      )}
                      {chain.type === "change_order" && (
                        <>
                          {chain.estimatedCostImpact > 0 && (
                            <span>${formatCurrency(chain.estimatedCostImpact)}</span>
                          )}
                          {(chain.triggerEvent as ChangeEntry).estimatedScheduleImpact && (
                            <span>
                              {(chain.triggerEvent as ChangeEntry).estimatedScheduleImpact} days
                            </span>
                          )}
                        </>
                      )}
                      {chain.type === "conflict" && (
                        <>
                          <span>Severity: {(chain.triggerEvent as ConflictEntry).severity}</span>
                          {chain.estimatedCostImpact > 0 && (
                            <span>${formatCurrency(chain.estimatedCostImpact)}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-onyx" />
                    ) : (
                      <ChevronDown size={20} className="text-onyx" />
                    )}
                  </div>
                </button>

                {/* Expanded Chain Timeline */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-5 space-y-6 bg-glass-light">
                    <ChainTimeline chain={chain} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// CHAIN TIMELINE COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════

function ChainTimeline({ chain }: { chain: CausationChain }): JSX.Element {
  const steps: ChainStep[] = [];
  const trigger = chain.triggerEvent;
  const triggerDate = "date" in trigger ? trigger.date : "";

  // Step 1: Trigger Event
  const triggerTypeLabel = chain.type === "delay_event" ? "DELAY EVENT" :
                           chain.type === "change_order" ? "CHANGE ORDER" : "CONFLICT";
  const triggerTypeBg = chain.type === "delay_event" ? "bg-accent-amber/10" :
                        chain.type === "change_order" ? "bg-accent-violet/10" : "bg-accent-red/10";

  steps.push({
    step: 1,
    title: "Trigger Event",
    completed: true,
    icon: <Clock className="w-4 h-4" />,
    content: (
      <div className={`${triggerTypeBg} rounded-lg p-4 border border-white/[0.06]`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-field-xs font-bold px-2 py-1 rounded ${triggerTypeBg}`}>
            {triggerTypeLabel}
          </span>
        </div>
        <p className="text-field-sm font-semibold text-onyx mb-2">{trigger.description}</p>

        {chain.type === "delay_event" && (
          <div className="space-y-1 text-field-xs text-onyx">
            <p>Date: {formatDate(triggerDate)}</p>
            {(trigger as DelayEvent).calendarDaysImpacted && (
              <p>Calendar Days: {(trigger as DelayEvent).calendarDaysImpacted}</p>
            )}
            {(trigger as DelayEvent).workingDaysImpacted && (
              <p>Working Days: {(trigger as DelayEvent).workingDaysImpacted}</p>
            )}
            {(trigger as DelayEvent).responsibleParty && (
              <p>Responsible: {(trigger as DelayEvent).responsibleParty}</p>
            )}
            {(trigger as DelayEvent).causeCategory && (
              <p>Cause: {(trigger as DelayEvent).causeCategory}</p>
            )}
          </div>
        )}

        {chain.type === "change_order" && (
          <div className="space-y-1 text-field-xs text-onyx">
            <p>Initiated by: {(trigger as ChangeEntry).initiatedBy}</p>
            {(trigger as ChangeEntry).estimatedCostImpact && (
              <p>Cost Impact: ${formatCurrency((trigger as ChangeEntry).estimatedCostImpact || 0)}</p>
            )}
            {(trigger as ChangeEntry).estimatedScheduleImpact && (
              <p>Schedule Impact: {(trigger as ChangeEntry).estimatedScheduleImpact} days</p>
            )}
            {(trigger as ChangeEntry).changeType && (
              <p>Type: {(trigger as ChangeEntry).changeType}</p>
            )}
          </div>
        )}

        {chain.type === "conflict" && (
          <div className="space-y-1 text-field-xs text-onyx">
            <p>Category: {(trigger as ConflictEntry).category}</p>
            <p>Severity: {(trigger as ConflictEntry).severity}</p>
            {(trigger as ConflictEntry).partiesInvolved && (
              <p>Parties: {(trigger as ConflictEntry).partiesInvolved.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    ),
  });

  // Step 2: Documentation
  steps.push({
    step: 2,
    title: "Documentation",
    completed: chain.relatedLogs.length > 0,
    icon: <FileText className="w-4 h-4" />,
    content: (
      <div
        className={`rounded-lg p-4 border ${
          chain.relatedLogs.length > 0
            ? "bg-accent-green/10 border-white/[0.06]"
            : "bg-accent-red/10 border-white/[0.06]"
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          {chain.relatedLogs.length > 0 ? (
            <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-field-sm font-semibold text-onyx">
              {chain.relatedLogs.length} daily log{chain.relatedLogs.length !== 1 ? "s" : ""} reference this event
            </p>
            {chain.relatedLogs.length > 0 && (
              <p className="text-field-xs text-warm-gray mt-1">
                Dates: {chain.relatedLogs.map((l) => formatDate(l.date)).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>
    ),
  });

  // Step 3: Notice(s)
  const hasNotices = chain.notices.length > 0;
  steps.push({
    step: 3,
    title: "Notice Sent",
    completed: hasNotices,
    icon: <Shield className="w-4 h-4" />,
    content: (
      <div
        className={`rounded-lg p-4 border ${
          hasNotices
            ? "bg-accent-green/10 border-white/[0.06]"
            : "bg-accent-red/10 border-white/[0.06]"
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          {hasNotices ? (
            <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {hasNotices ? (
              <div className="space-y-2">
                {chain.notices.map((notice, idx) => (
                  <div key={idx} className="text-field-xs">
                    <p className="font-semibold text-onyx">
                      {notice.noticeType.toUpperCase()} • {formatDate(notice.dateSent)}
                    </p>
                    <p className="text-warm-gray">
                      Via {notice.deliveryMethod.replace(/_/g, " ")} to {notice.sentTo}
                    </p>
                    {notice.responseRequired && (
                      <p className={notice.responseReceived ? "text-accent-green" : "text-accent-amber"}>
                        Response {notice.responseReceived ? "received" : "pending"}
                        {notice.responseDeadline && ` (due ${formatDate(notice.responseDeadline)})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-field-sm font-semibold text-accent-red">NO NOTICE SENT</p>
            )}
          </div>
        </div>
      </div>
    ),
  });

  // Step 4: Productivity Impact
  const hasProductivityData = !!(chain.productivityImpact && chain.productivityImpact.baseline);
  steps.push({
    step: 4,
    title: "Productivity Impact",
    completed: hasProductivityData,
    icon: <TrendingDown className="w-4 h-4" />,
    content: (
      <div
        className={`rounded-lg p-4 border ${
          hasProductivityData
            ? "bg-accent-green/10 border-white/[0.06]"
            : "bg-glass-light border-white/[0.06]"
        }`}
      >
        {hasProductivityData ? (
          <div className="space-y-2">
            {chain.productivityImpact?.beforeRate && (
              <div className="flex items-center justify-between text-field-xs">
                <span className="text-warm-gray">Baseline rate:</span>
                <span className="font-semibold text-onyx">
                  {chain.productivityImpact.beforeRate.toFixed(2)} units/hr
                </span>
              </div>
            )}
            {chain.productivityImpact?.afterRate && (
              <div className="flex items-center justify-between text-field-xs">
                <span className="text-warm-gray">Impacted rate:</span>
                <span className="font-semibold text-onyx">
                  {chain.productivityImpact.afterRate.toFixed(2)} units/hr
                </span>
              </div>
            )}
            {chain.productivityImpact?.productivityLoss && (
              <div className="flex items-center justify-between text-field-xs pt-1 border-t border-white/[0.06]">
                <span className="text-warm-gray">Lost productivity:</span>
                <span className="font-bold text-accent-red">
                  {chain.productivityImpact.productivityLoss.toFixed(1)}% decline
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-white/[0.4] flex-shrink-0 mt-0.5" />
            <p className="text-field-sm text-warm-gray">No measured productivity data available</p>
          </div>
        )}
      </div>
    ),
  });

  // Step 5: Calculated Damages
  steps.push({
    step: 5,
    title: "Damages Calculation",
    completed: chain.estimatedCostImpact > 0,
    icon: <DollarSign className="w-4 h-4" />,
    content: (
      <div
        className={`rounded-lg p-4 border ${
          chain.estimatedCostImpact > 0
            ? "bg-accent-amber/10 border-white/[0.06]"
            : "bg-glass-light border-white/[0.06]"
        }`}
      >
        <div className="space-y-2">
          <div className="text-field-xs text-warm-gray">
            <p>Cost Impact:</p>
          </div>
          <p className="text-field-2xl font-bold text-onyx">
            ${formatCurrency(chain.estimatedCostImpact)}
          </p>
          {chain.type === "delay_event" && (
            <div className="text-field-xs text-warm-gray pt-2 border-t border-white/[0.06]">
              <p>
                Schedule impact: {(chain.triggerEvent as DelayEvent).calendarDaysImpacted || 0} calendar days
              </p>
            </div>
          )}
        </div>
      </div>
    ),
  });

  // Render timeline
  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline connector */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/[0.2]" />

        {/* Steps */}
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-16">
            {/* Step dot */}
            <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-glass border-2 border-white/[0.2]" />

            {/* Step content */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 flex items-center justify-center text-warm-gray">
                  {step.icon}
                </div>
                <h4 className="text-field-sm font-semibold text-onyx">
                  Step {step.step}: {step.title}
                </h4>
              </div>
              <div className="ml-0.5">{step.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Completeness Indicator */}
      <div className="bg-glass border border-white/[0.06] rounded-lg p-3 mt-4">
        <p className="text-field-xs text-warm-gray mb-2">Chain Strength: {chain.completenessScore}/5</p>
        <div className="w-full bg-white/[0.1] rounded-full h-2">
          <div
            className={`rounded-full h-2 transition-all ${
              chain.completenessScore >= 4
                ? "bg-accent-green"
                : chain.completenessScore >= 2
                  ? "bg-accent-amber"
                  : "bg-accent-red"
            }`}
            style={{ width: `${(chain.completenessScore / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════════

async function buildDelayEventChain(
  delayEvent: DelayEvent,
  notices: NoticeLogEntry[],
  dailyLogs: DailyLog[],
  productivityEntries: ProductivityEntry[],
  productivityBaselines: ProductivityBaseline[]
): Promise<CausationChain> {
  // Find related notices
  const relatedNotices = notices.filter(
    (n) =>
      n.relatedDelayEventIds?.includes(delayEvent.id) ||
      (n.dateSent === delayEvent.noticeSentDate)
  );

  // Find related daily logs
  const relatedLogs = dailyLogs.filter(
    (log) =>
      (log.delayEvents && log.delayEvents.some((de) => de.id === delayEvent.id))
  );

  // Calculate productivity impact if dates exist
  let productivityImpact = null;
  if (delayEvent.date) {
    const baseline = productivityBaselines.length > 0 ? productivityBaselines[0] : null;
    productivityImpact = await calculateProductivityImpact(
      delayEvent.date,
      productivityEntries,
      baseline
    );
  }

  // Calculate completeness score
  let completenessScore = 1; // Always have the trigger
  if (relatedLogs.length > 0) completenessScore += 1;
  if (relatedNotices.length > 0) completenessScore += 1;
  if (productivityImpact?.baseline) completenessScore += 1;
  if (delayEvent.costImpact && delayEvent.costImpact > 0) completenessScore += 1;

  return {
    id: `chain-${delayEvent.id}`,
    triggerId: delayEvent.id,
    type: "delay_event",
    triggerEvent: delayEvent,
    notices: relatedNotices,
    relatedLogs,
    productivityImpact,
    estimatedCostImpact: delayEvent.costImpact || 0,
    completenessScore: Math.min(completenessScore, 5),
  };
}

async function buildChangeChain(
  change: ChangeEntry,
  logId: string,
  notices: NoticeLogEntry[],
  dailyLogs: DailyLog[],
  productivityEntries: ProductivityEntry[],
  productivityBaselines: ProductivityBaseline[]
): Promise<CausationChain> {
  // Find related notices
  const relatedNotices = notices.filter(
    (n) =>
      n.relatedChangeIds?.includes(logId) ||
      (change.noticeDate && n.dateSent === change.noticeDate)
  );

  // Find related daily logs
  const relatedLogs = dailyLogs.filter(
    (log) => log.changes.some((c) => c.description === change.description && c.initiatedBy === change.initiatedBy)
  );

  // Estimate productivity impact
  let productivityImpact = null;
  const relatedLog = relatedLogs[0];
  if (relatedLog) {
    const baseline = productivityBaselines.length > 0 ? productivityBaselines[0] : null;
    productivityImpact = await calculateProductivityImpact(
      relatedLog.date,
      productivityEntries,
      baseline
    );
  }

  // Calculate completeness score
  let completenessScore = 1;
  if (relatedLogs.length > 0) completenessScore += 1;
  if (relatedNotices.length > 0) completenessScore += 1;
  if (productivityImpact?.baseline) completenessScore += 1;
  if (change.estimatedCostImpact && change.estimatedCostImpact > 0) completenessScore += 1;

  return {
    id: `chain-change-${logId}`,
    triggerId: logId,
    type: "change_order",
    triggerEvent: change,
    notices: relatedNotices,
    relatedLogs,
    productivityImpact,
    estimatedCostImpact: change.estimatedCostImpact || 0,
    completenessScore: Math.min(completenessScore, 5),
  };
}

async function buildConflictChain(
  conflict: ConflictEntry,
  logId: string,
  notices: NoticeLogEntry[],
  dailyLogs: DailyLog[],
  productivityEntries: ProductivityEntry[],
  productivityBaselines: ProductivityBaseline[]
): Promise<CausationChain> {
  // Find related notices
  const relatedNotices = notices.filter(
    (n) => n.relatedDailyLogIds?.includes(logId)
  );

  // Find related daily logs
  const relatedLogs = dailyLogs.filter(
    (log) => log.conflicts.some((c) => c.description === conflict.description)
  );

  // Estimate productivity impact
  let productivityImpact = null;
  const relatedLog = relatedLogs[0];
  if (relatedLog) {
    const baseline = productivityBaselines.length > 0 ? productivityBaselines[0] : null;
    productivityImpact = await calculateProductivityImpact(
      relatedLog.date,
      productivityEntries,
      baseline
    );
  }

  // Calculate completeness score
  let completenessScore = 1;
  if (relatedLogs.length > 0) completenessScore += 1;
  if (relatedNotices.length > 0) completenessScore += 1;
  if (productivityImpact?.baseline) completenessScore += 1;
  if (conflict.estimatedCostImpact && conflict.estimatedCostImpact > 0) completenessScore += 1;

  return {
    id: `chain-conflict-${logId}`,
    triggerId: logId,
    type: "conflict",
    triggerEvent: conflict,
    notices: relatedNotices,
    relatedLogs,
    productivityImpact,
    estimatedCostImpact: conflict.estimatedCostImpact || 0,
    completenessScore: Math.min(completenessScore, 5),
  };
}

async function calculateProductivityImpact(
  eventDate: string,
  productivityEntries: ProductivityEntry[],
  baseline: ProductivityBaseline | null
): Promise<{
  baseline: ProductivityBaseline | null;
  beforeRate: number | null;
  afterRate: number | null;
  productivityLoss: number | null;
} | null> {
  if (!baseline || productivityEntries.length === 0) {
    return null;
  }

  // Get entries before and after event
  const eventTime = new Date(eventDate).getTime();
  const beforeEntries = productivityEntries.filter(
    (e) => new Date(e.date).getTime() < eventTime
  );
  const afterEntries = productivityEntries.filter(
    (e) => new Date(e.date).getTime() >= eventTime
  );

  if (beforeEntries.length === 0 || afterEntries.length === 0) {
    return null;
  }

  const beforeRate =
    beforeEntries.reduce((sum, e) => sum + (e.computedUnitRate || 0), 0) /
    beforeEntries.length;
  const afterRate =
    afterEntries.reduce((sum, e) => sum + (e.computedUnitRate || 0), 0) /
    afterEntries.length;

  const productivityLoss = ((beforeRate - afterRate) / beforeRate) * 100;

  return {
    baseline,
    beforeRate,
    afterRate,
    productivityLoss: Math.max(0, productivityLoss),
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
