"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { getProductivitySummary } from "@/lib/productivity-engine";
import type {
  ProductivitySummary,
  CostCodeSummary,
} from "@/lib/productivity-engine";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface FilterTab {
  id: "all" | "at-risk" | "on-track" | "ahead";
  label: string;
}

interface ProductivityState {
  summary: ProductivitySummary | null;
  loading: boolean;
  error: string | null;
  activeFilter: "all" | "at-risk" | "on-track" | "ahead";
}

export default function ProductivityPage() {
  const { activeProject } = useAppStore();
  const [state, setState] = useState<ProductivityState>({
    summary: null,
    loading: true,
    error: null,
    activeFilter: "all",
  });

  const filterTabs: FilterTab[] = [
    { id: "all", label: "All" },
    { id: "at-risk", label: "At Risk" },
    { id: "on-track", label: "On Track" },
    { id: "ahead", label: "Ahead" },
  ];

  // Load productivity data
  useEffect(() => {
    if (!activeProject) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "No project selected",
      }));
      return;
    }

    const loadData = async () => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const summary = await getProductivitySummary(activeProject.id);
        setState((prev) => ({
          ...prev,
          summary,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load productivity data";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    loadData();
  }, [activeProject]);

  // Get productivity index color
  const getProductivityIndexColor = (
    index: number | null
  ): {
    bg: string;
    text: string;
    badge: string;
  } => {
    if (index === null) {
      return { bg: "bg-gray-50", text: "text-warm-gray", badge: "text-warm-gray" };
    }
    if (index >= 1.05) {
      return {
        bg: "bg-green-50",
        text: "text-accent-green",
        badge: "bg-green-100 text-accent-green",
      };
    }
    if (index >= 0.95) {
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700",
      };
    }
    if (index >= 0.85) {
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700",
      };
    }
    return {
      bg: "bg-red-50",
      text: "text-accent-red",
      badge: "bg-red-100 text-accent-red",
    };
  };

  // Get trend icon
  const getTrendIcon = (
    direction: "improving" | "declining" | "stable"
  ): JSX.Element => {
    switch (direction) {
      case "improving":
        return <TrendingUp size={16} className="text-accent-green" />;
      case "declining":
        return <TrendingDown size={16} className="text-accent-red" />;
      case "stable":
        return <Minus size={16} className="text-warm-gray" />;
    }
  };

  // Get progress bar fill color
  const getProgressFillColor = (index: number | null): string => {
    if (index === null) return "bg-gray-200";
    if (index >= 1.05) return "bg-accent-green";
    if (index < 0.85) return "bg-accent-red";
    return "bg-onyx";
  };

  // Filter cost codes based on active filter
  const getFilteredCostCodes = (): CostCodeSummary[] => {
    if (!state.summary) return [];

    switch (state.activeFilter) {
      case "at-risk":
        return state.summary.costCodeSummaries.filter((s) => s.isAtRisk);
      case "on-track":
        return state.summary.costCodeSummaries.filter(
          (s) => !s.isAtRisk && s.productivityIndex !== null && s.productivityIndex < 1.05
        );
      case "ahead":
        return state.summary.costCodeSummaries.filter(
          (s) => s.productivityIndex !== null && s.productivityIndex >= 1.05
        );
      case "all":
      default:
        return state.summary.costCodeSummaries;
    }
  };

  // Format number with thousand separator
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format decimal to 2 places
  const formatDecimal = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ====================================================================
  // RENDER: Loading State
  // ====================================================================
  if (state.loading) {
    return (
      <AppShell>
        <Header title="Productivity Dashboard" />
        <div className="pb-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
              <p className="text-field-sm text-warm-gray">
                Loading productivity metrics...
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ====================================================================
  // RENDER: No Project State
  // ====================================================================
  if (!activeProject) {
    return (
      <AppShell>
        <Header title="Productivity Dashboard" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <BarChart3 size={40} className="text-warm-gray opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">
              No Project Selected
            </p>
            <p className="text-field-sm text-warm-gray text-center">
              Please select a project from the home screen to view productivity metrics.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ====================================================================
  // RENDER: Error State
  // ====================================================================
  if (state.error && !state.summary) {
    return (
      <AppShell>
        <Header title="Productivity Dashboard" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertTriangle size={40} className="text-accent-red opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">
              Error Loading Metrics
            </p>
            <p className="text-field-sm text-warm-gray text-center">
              {state.error}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ====================================================================
  // RENDER: Empty State (No Productivity Data)
  // ====================================================================
  if (
    !state.summary ||
    state.summary.costCodeSummaries.length === 0
  ) {
    return (
      <AppShell>
        <Header title="Productivity Dashboard" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <BarChart3 size={40} className="text-warm-gray opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">
              No productivity data yet
            </p>
            <p className="text-field-sm text-warm-gray text-center max-w-xs">
              Log daily work with quantities and crew hours to see productivity trends
              here.
            </p>
            <Link
              href="/daily-log"
              className="mt-4 px-6 py-3 bg-onyx text-white rounded-button font-semibold text-field-sm hover:bg-slate transition-colors active:scale-95"
            >
              Go to Daily Log
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const filteredCodes = getFilteredCostCodes();

  return (
    <AppShell>
      <Header title="Productivity Dashboard" />

      <div className="pb-20 px-4 pt-4 space-y-6">
        {/* ════════════════════════════════════════════════════════════ */}
        {/* 1. OVERVIEW CARDS (Horizontal Scroll) */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {/* Overall Productivity Index */}
          <div className="flex-shrink-0 w-[calc(50%-8px)] snap-center">
            <div className="bg-onyx text-white rounded-xl p-4 h-full flex flex-col justify-between">
              <p className="text-field-sm opacity-90">Productivity Index</p>
              <div>
                <p
                  className={`text-field-3xl font-semibold leading-none mb-1 ${
                    state.summary.overallProductivityIndex === null
                      ? "text-warm-gray"
                      : state.summary.overallProductivityIndex >= 1.0
                        ? "text-green-300"
                        : state.summary.overallProductivityIndex >= 0.85
                          ? "text-amber-300"
                          : "text-red-300"
                  }`}
                >
                  {state.summary.overallProductivityIndex === null
                    ? "—"
                    : formatDecimal(state.summary.overallProductivityIndex)}
                </p>
                <p className="text-field-xs opacity-75">
                  {state.summary.overallProductivityIndex === null
                    ? "No baseline"
                    : state.summary.overallProductivityIndex >= 1.0
                      ? "Ahead of budget"
                      : "vs. baseline"}
                </p>
              </div>
            </div>
          </div>

          {/* At Risk Activities */}
          <div className="flex-shrink-0 w-[calc(50%-8px)] snap-center">
            <div className="bg-onyx text-white rounded-xl p-4 h-full flex flex-col justify-between">
              <p className="text-field-sm opacity-90">Activities At Risk</p>
              <div>
                <p
                  className={`text-field-3xl font-semibold leading-none mb-1 ${
                    state.summary.atRiskCount > 0 ? "text-red-300" : "text-green-300"
                  }`}
                >
                  {state.summary.atRiskCount}
                </p>
                <p className="text-field-xs opacity-75">
                  of {state.summary.totalCostCodes} codes
                </p>
              </div>
            </div>
          </div>

          {/* Cost Codes Tracked */}
          <div className="flex-shrink-0 w-[calc(50%-8px)] snap-center">
            <div className="bg-onyx text-white rounded-xl p-4 h-full flex flex-col justify-between">
              <p className="text-field-sm opacity-90">Cost Codes Tracked</p>
              <div>
                <p className="text-field-3xl font-semibold leading-none mb-1">
                  {state.summary.totalCostCodes}
                </p>
                <p className="text-field-xs opacity-75">
                  {state.summary.costCodeSummaries.length > 0 ? "with data" : "total"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 2. AT-RISK ACTIVITIES SECTION (Only if any at risk) */}
        {/* ════════════════════════════════════════════════════════════ */}
        {state.summary.atRiskCount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle size={18} className="text-accent-red flex-shrink-0" />
              <h2 className="text-field-lg font-semibold text-onyx">
                Activities Falling Behind
              </h2>
            </div>

            {state.summary.costCodeSummaries
              .filter((s) => s.isAtRisk)
              .map((summary) => {
                const colors = getProductivityIndexColor(summary.productivityIndex);
                return (
                  <div
                    key={summary.costCode.id}
                    className={`border-l-4 border-accent-red bg-white rounded-xl p-4 shadow-card`}
                  >
                    {/* Header: Cost Code & Activity Name */}
                    <div className="mb-3">
                      <p className="text-field-sm font-semibold text-onyx">
                        {summary.costCode.code}
                      </p>
                      <p className="text-field-xs text-warm-gray">
                        {summary.costCode.activity}
                      </p>
                    </div>

                    {/* Productivity Index - Large Red Text */}
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className={`text-field-2xl font-bold ${colors.text}`}>
                        {summary.productivityIndex === null
                          ? "—"
                          : formatDecimal(summary.productivityIndex)}
                      </p>
                    </div>

                    {/* Days Behind Badge & Current vs Baseline */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="inline-block px-2 py-1 bg-red-100 rounded-button">
                          <p className="text-field-xs font-semibold text-accent-red">
                            {Math.round(summary.daysBehind)} days behind
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-field-xs text-onyx font-semibold">
                          {formatDecimal(summary.currentUnitRate)}
                        </p>
                        <p className="text-field-xs text-warm-gray">
                          {summary.costCode.unitOfMeasure}/man-hr
                        </p>
                        {summary.baselineUnitRate && (
                          <p className="text-field-xs text-warm-gray mt-0.5">
                            vs {formatDecimal(summary.baselineUnitRate)} baseline
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-field-xs text-warm-gray">Progress</p>
                        <p className="text-field-xs font-semibold text-onyx">
                          {Math.round(summary.percentComplete)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent-red rounded-full h-2 transition-all"
                          style={{ width: `${summary.percentComplete}%` }}
                        />
                      </div>
                      <p className="text-field-xs text-warm-gray">
                        {formatNumber(Math.round(summary.totalQuantityInstalled))} of{" "}
                        {formatNumber(summary.costCode.budgetedQuantity)}{" "}
                        {summary.costCode.unitOfMeasure}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 3. ALL ACTIVITIES SECTION with Filter Tabs */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <h2 className="text-field-lg font-semibold text-onyx">All Activities</h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setState((prev) => ({ ...prev, activeFilter: tab.id }))
                }
                className={`flex-shrink-0 px-4 py-2 rounded-button text-field-sm font-semibold transition-all snap-center ${
                  state.activeFilter === tab.id
                    ? "bg-onyx text-white"
                    : "bg-gray-100 text-onyx hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cost Code Cards */}
          {filteredCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-field-sm text-warm-gray">
                No activities match this filter
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCodes.map((summary) => {
                const colors = getProductivityIndexColor(
                  summary.productivityIndex
                );

                return (
                  <div
                    key={summary.costCode.id}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-card"
                  >
                    {/* Header: Cost Code & Activity */}
                    <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-field-sm font-bold text-onyx truncate">
                          {summary.costCode.code}
                        </p>
                        <p className="text-field-xs text-warm-gray truncate">
                          {summary.costCode.activity}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2 flex items-center gap-1">
                        {getTrendIcon(summary.trendDirection)}
                      </div>
                    </div>

                    {/* Productivity Index Badge & Trend */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`inline-block px-3 py-1.5 rounded-button ${colors.badge}`}
                      >
                        <p className="text-field-sm font-bold">
                          {summary.productivityIndex === null
                            ? "No baseline"
                            : formatDecimal(summary.productivityIndex)}
                        </p>
                      </div>
                      <p className="text-field-xs text-warm-gray">
                        {summary.trendDirection === "improving"
                          ? "Improving"
                          : summary.trendDirection === "declining"
                            ? "Declining"
                            : "Stable"}
                      </p>
                    </div>

                    {/* Unit Rate Details */}
                    <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-baseline justify-between">
                        <p className="text-field-xs text-warm-gray">Current Rate</p>
                        <p className="text-field-sm font-semibold text-onyx">
                          {formatDecimal(summary.currentUnitRate)}
                        </p>
                      </div>
                      <p className="text-field-xs text-warm-gray text-right">
                        {summary.costCode.unitOfMeasure}/man-hr
                      </p>
                      {summary.baselineUnitRate ? (
                        <p className="text-field-xs text-warm-gray text-right">
                          vs {formatDecimal(summary.baselineUnitRate)} baseline
                        </p>
                      ) : (
                        <p className="text-field-xs text-warm-gray text-right italic">
                          No baseline
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-field-xs text-warm-gray">Progress</p>
                        <p className="text-field-xs font-semibold text-onyx">
                          {Math.round(summary.percentComplete)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getProgressFillColor(
                            summary.productivityIndex
                          )} rounded-full h-2 transition-all`}
                          style={{ width: `${summary.percentComplete}%` }}
                        />
                      </div>
                      <p className="text-field-xs text-warm-gray">
                        {formatNumber(Math.round(summary.totalQuantityInstalled))} of{" "}
                        {formatNumber(summary.costCode.budgetedQuantity)}{" "}
                        {summary.costCode.unitOfMeasure}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last Updated Timestamp */}
        <div className="text-center pt-4 pb-4">
          <p className="text-field-xs text-warm-gray">
            Last updated{" "}
            {new Date(state.summary.lastUpdated).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
