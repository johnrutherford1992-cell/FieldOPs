"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { getProductivitySummary } from "@/lib/productivity-engine";
import { recomputeAnalytics } from "@/lib/analytics-engine";
import { db } from "@/lib/db";
import type { ProductivitySummary } from "@/lib/productivity-engine";
import type { ProductivityAnalytics } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  DollarSign,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsState {
  summary: ProductivitySummary | null;
  analytics: Map<string, ProductivityAnalytics[]>;
  loading: boolean;
  error: string | null;
  expandedCostCodes: Set<string>;
  isRefreshing: boolean;
}

interface VarianceItem {
  costCodeId: string;
  code: string;
  description: string;
  variancePercent: number;
  varianceDollars: number;
  isFavorable: boolean;
}

export default function AnalyticsPage(): JSX.Element {
  const { activeProject } = useAppStore();
  const [state, setState] = useState<AnalyticsState>({
    summary: null,
    analytics: new Map(),
    loading: true,
    error: null,
    expandedCostCodes: new Set(),
    isRefreshing: false,
  });

  // Load analytics data on mount
  useEffect(() => {
    if (!activeProject) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "No project selected",
      }));
      return;
    }

    const loadData = async (): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Load productivity summary
        const summary = await getProductivitySummary(activeProject.id);

        // Load analytics records for each cost code with data
        const analyticsMap = new Map<string, ProductivityAnalytics[]>();
        const allAnalytics = await db.productivityAnalytics
          .filter((a) => a.projectId === activeProject.id)
          .toArray();

        for (const analytic of allAnalytics) {
          if (!analyticsMap.has(analytic.costCodeId)) {
            analyticsMap.set(analytic.costCodeId, []);
          }
          const existing = analyticsMap.get(analytic.costCodeId);
          if (existing) {
            existing.push(analytic);
          }
        }

        // Sort each cost code's analytics by date descending
        for (const key of Array.from(analyticsMap.keys())) {
          const analytics = analyticsMap.get(key);
          if (analytics) {
            analytics.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
          }
        }

        setState((prev) => ({
          ...prev,
          summary,
          analytics: analyticsMap,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load analytics data";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    loadData();
  }, [activeProject]);

  // Handle refresh analytics
  const handleRefreshAnalytics = async (): Promise<void> => {
    if (!activeProject || state.isRefreshing) return;

    try {
      setState((prev) => ({ ...prev, isRefreshing: true }));

      // Recompute analytics from daily log data
      await recomputeAnalytics(activeProject.id);

      // Reload all data
      const summary = await getProductivitySummary(activeProject.id);

      const analyticsMap = new Map<string, ProductivityAnalytics[]>();
      const allAnalytics = await db.productivityAnalytics
        .filter((a) => a.projectId === activeProject.id)
        .toArray();

      for (const analytic of allAnalytics) {
        if (!analyticsMap.has(analytic.costCodeId)) {
          analyticsMap.set(analytic.costCodeId, []);
        }
        const existing = analyticsMap.get(analytic.costCodeId);
        if (existing) {
          existing.push(analytic);
        }
      }

      for (const key of Array.from(analyticsMap.keys())) {
        const analytics = analyticsMap.get(key);
        if (analytics) {
          analytics.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
        }
      }

      setState((prev) => ({
        ...prev,
        summary,
        analytics: analyticsMap,
        isRefreshing: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh analytics";
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: errorMessage,
      }));
    }
  };

  // Toggle cost code expansion
  const toggleExpanded = (costCodeId: string): void => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedCostCodes);
      if (newExpanded.has(costCodeId)) {
        newExpanded.delete(costCodeId);
      } else {
        newExpanded.add(costCodeId);
      }
      return { ...prev, expandedCostCodes: newExpanded };
    });
  };

  // Calculate project health score
  const calculateHealthScore = (): { score: number; grade: string; color: string } => {
    if (!state.summary || state.summary.totalCostCodes === 0) {
      return { score: 0, grade: "—", color: "text-warm-gray" };
    }

    let score = 100;

    // Deduct points for at-risk activities
    score -= Math.min(state.summary.atRiskCount * 5, 20);

    // Adjust based on overall productivity index
    if (state.summary.overallProductivityIndex !== null) {
      const deviation = Math.abs(state.summary.overallProductivityIndex - 1.0);
      score -= Math.min(deviation * 30, 20);
    }

    score = Math.max(0, Math.min(100, score));

    let grade: string;
    let color: string;

    if (score >= 90) {
      grade = "A+";
      color = "text-green-600";
    } else if (score >= 80) {
      grade = "A";
      color = "text-green-600";
    } else if (score >= 75) {
      grade = "B+";
      color = "text-amber-600";
    } else if (score >= 70) {
      grade = "B";
      color = "text-amber-600";
    } else if (score >= 60) {
      grade = "C";
      color = "text-red-600";
    } else {
      grade = "D";
      color = "text-red-600";
    }

    return { score: Math.round(score), grade, color };
  };

  // Calculate total cost and schedule variance
  const calculateVariances = (): { costVariance: number; scheduleVariance: number } => {
    if (!state.summary || state.summary.costCodeSummaries.length === 0) {
      return { costVariance: 0, scheduleVariance: 0 };
    }

    let totalCostVariance = 0;
    let totalScheduleVariance = 0;

    const analyticsArray = Array.from(state.analytics.values()).flat();

    for (const analytic of analyticsArray) {
      if (analytic.periodType === "project_to_date") {
        totalCostVariance += analytic.costVariance;
        totalScheduleVariance += analytic.scheduleVariance;
      }
    }

    return { costVariance: totalCostVariance, scheduleVariance: totalScheduleVariance };
  };

  // Calculate overall productivity index
  const getOverallProductivityIndex = (): number => {
    return state.summary?.overallProductivityIndex ?? 1.0;
  };

  // Get top variances
  const getTopVariances = (): VarianceItem[] => {
    if (!state.summary || state.summary.costCodeSummaries.length === 0) {
      return [];
    }

    const variances: VarianceItem[] = [];
    const analyticsArray = Array.from(state.analytics.values()).flat();

    for (const summary of state.summary.costCodeSummaries) {
      const costCodeAnalytics = analyticsArray.filter(
        (a) => a.costCodeId === summary.costCode.id && a.periodType === "project_to_date"
      );

      if (costCodeAnalytics.length > 0) {
        const latest = costCodeAnalytics[0];
        variances.push({
          costCodeId: summary.costCode.id,
          code: summary.costCode.code,
          description: summary.costCode.description,
          variancePercent: latest.plannedVsActualVariance,
          varianceDollars: latest.costVariance,
          isFavorable: latest.costVariance > 0,
        });
      }
    }

    // Sort by absolute variance and return top 5
    return variances
      .sort((a, b) => Math.abs(b.varianceDollars) - Math.abs(a.varianceDollars))
      .slice(0, 5);
  };

  // Create mini sparkline data from 5 recent data points
  const getSparklineData = (costCodeId: string): number[] => {
    const costCodeAnalytics = state.analytics.get(costCodeId) || [];

    if (costCodeAnalytics.length === 0) {
      return [];
    }

    // Get up to 5 most recent analytics
    const recent = costCodeAnalytics.slice(0, 5).reverse();
    return recent.map((a) => a.averageUnitRate);
  };

  // Render sparkline bars
  const renderSparkline = (values: number[]): JSX.Element => {
    if (values.length === 0) {
      return <span className="text-field-xs text-warm-gray">No data</span>;
    }

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    return (
      <div className="flex items-end gap-0.5 h-6">
        {values.map((value, idx) => {
          const height = ((value - minValue) / range) * 100;
          return (
            <div
              key={idx}
              className="flex-1 bg-onyx rounded-sm opacity-60 hover:opacity-100 transition-opacity"
              style={{ height: `${Math.max(height, 15)}%` }}
              title={value.toFixed(2)}
            />
          );
        })}
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format decimal to 2 places
  const formatDecimal = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format percentage
  const formatPercent = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading State
  // ════════════════════════════════════════════════════════════════════════════════════
  if (state.loading) {
    return (
      <AppShell>
        <Header title="Analytics" subtitle={activeProject?.name} backHref="/" />
        <div className="pb-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
              <p className="text-field-sm text-warm-gray">Loading analytics...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: No Project State
  // ════════════════════════════════════════════════════════════════════════════════════
  if (!activeProject) {
    return (
      <AppShell>
        <Header title="Analytics" backHref="/" />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertTriangle size={40} className="text-warm-gray opacity-50" />
            <p className="text-field-base font-semibold text-onyx text-center">No Project Selected</p>
            <p className="text-field-sm text-warm-gray text-center">Please select a project from the home screen to view analytics.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════════
  // RENDER: Empty State (No Analytics Computed)
  // ════════════════════════════════════════════════════════════════════════════════════
  if (!state.summary || state.summary.costCodeSummaries.length === 0) {
    return (
      <AppShell>
        <Header
          title="Analytics"
          subtitle={activeProject.name}
          backHref="/"
          rightAction={
            <button
              onClick={handleRefreshAnalytics}
              disabled={state.isRefreshing}
              className="flex items-center justify-center w-10 h-10 text-onyx hover:bg-glass-light rounded-lg transition-colors active:scale-95 disabled:opacity-50"
              aria-label="Refresh analytics"
              title="Refresh analytics"
            >
              <RefreshCw size={20} className={state.isRefreshing ? "animate-spin" : ""} />
            </button>
          }
        />
        <div className="pb-20 px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <RefreshCw size={40} className="text-warm-gray opacity-50" />
            <div className="text-center">
              <p className="text-field-base font-semibold text-onyx mb-2">No analytics computed yet</p>
              <p className="text-field-sm text-warm-gray max-w-xs mb-4">Tap Refresh to compute analytics from your daily log data.</p>
            </div>
            <button
              onClick={handleRefreshAnalytics}
              disabled={state.isRefreshing}
              className="px-6 py-3 bg-accent-violet text-white rounded-button font-semibold text-field-sm hover:bg-glass-heavy transition-colors active:scale-95 disabled:opacity-50"
            >
              {state.isRefreshing ? "Computing..." : "Compute Analytics"}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const health = calculateHealthScore();
  const { costVariance, scheduleVariance } = calculateVariances();
  const productivityIndex = getOverallProductivityIndex();
  const topVariances = getTopVariances();

  return (
    <AppShell>
      <Header
        title="Analytics"
        subtitle={activeProject.name}
        backHref="/"
        rightAction={
          <button
            onClick={handleRefreshAnalytics}
            disabled={state.isRefreshing}
            className="flex items-center justify-center w-10 h-10 text-onyx hover:bg-gray-50 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
            aria-label="Refresh analytics"
            title="Refresh analytics"
          >
            <RefreshCw size={20} className={state.isRefreshing ? "animate-spin" : ""} />
          </button>
        }
      />

      <div className="pb-20 px-4 pt-4 space-y-6">
        {/* ════════════════════════════════════════════════════════════ */}
        {/* 1. PROJECT HEALTH SCORE */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="bg-glass border border-gray-100 rounded-xl p-6 shadow-glass-card">
          <div className="flex items-center gap-4">
            {/* Circular Score */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                  health.score >= 90
                    ? "border-accent-green bg-accent-green/10"
                    : health.score >= 75
                      ? "border-accent-amber bg-accent-amber/10"
                      : "border-accent-red bg-accent-red/10"
                }`}
              >
                <div className="text-center">
                  <div className={`text-field-2xl font-bold ${health.color}`}>{health.grade}</div>
                  <div className="text-field-xs text-onyx">{health.score}</div>
                </div>
              </div>
            </div>

            {/* Status Text */}
            <div className="flex-1 min-w-0">
              <p className="text-field-sm font-semibold text-onyx mb-1">Project Health</p>
              <p className="text-field-xs text-warm-gray">
                {state.summary.atRiskCount} of {state.summary.totalCostCodes} activities trending behind schedule
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 2. VARIANCE SUMMARY CARDS */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          {/* Cost Variance */}
          <div
            className={`bg-glass border border-gray-100 rounded-xl p-4 shadow-glass-card flex items-start justify-between ${
              costVariance > 0 ? "bg-accent-green/10 border-accent-green/30" : "bg-accent-red/10 border-accent-red/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <DollarSign size={20} className={costVariance > 0 ? "text-accent-green" : "text-accent-red"} />
              <div>
                <p className="text-field-xs text-warm-gray">Cost Variance</p>
                <p className={`text-field-lg font-bold ${costVariance > 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {formatCurrency(Math.abs(costVariance))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-field-sm font-semibold ${costVariance > 0 ? "text-accent-green" : "text-accent-red"}`}>
                {costVariance > 0 ? "+" : ""}{formatPercent(Math.abs(costVariance) / 100000 * 100)}%
              </p>
              <p className="text-field-xs text-warm-gray">{costVariance > 0 ? "Under" : "Over"} Budget</p>
            </div>
          </div>

          {/* Schedule Variance */}
          <div
            className={`bg-glass border border-gray-100 rounded-xl p-4 shadow-glass-card flex items-start justify-between ${
              scheduleVariance < 0 ? "bg-accent-green/10 border-accent-green/30" : "bg-accent-red/10 border-accent-red/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <Clock size={20} className={scheduleVariance < 0 ? "text-accent-green" : "text-accent-red"} />
              <div>
                <p className="text-field-xs text-warm-gray">Schedule Variance</p>
                <p className={`text-field-lg font-bold ${scheduleVariance < 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {Math.abs(Math.round(scheduleVariance))} days
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-field-sm font-semibold ${scheduleVariance < 0 ? "text-accent-green" : "text-accent-red"}`}>
                {scheduleVariance < 0 ? "Ahead" : "Behind"}
              </p>
              <p className="text-field-xs text-warm-gray">vs. Plan</p>
            </div>
          </div>

          {/* Productivity Index */}
          <div
            className={`bg-glass border border-gray-100 rounded-xl p-4 shadow-glass-card flex items-start justify-between ${
              productivityIndex >= 1.0 ? "bg-accent-green/10 border-accent-green/30" : "bg-accent-amber/10 border-accent-amber/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <Target size={20} className={productivityIndex >= 1.0 ? "text-accent-green" : "text-accent-amber"} />
              <div>
                <p className="text-field-xs text-warm-gray">Productivity Index</p>
                <p className={`text-field-lg font-bold ${productivityIndex >= 1.0 ? "text-accent-green" : "text-accent-amber"}`}>
                  {formatDecimal(productivityIndex)}x
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-field-sm font-semibold ${productivityIndex >= 1.0 ? "text-accent-green" : "text-accent-amber"}`}>
                {productivityIndex >= 1.0 ? "Above" : "Below"}
              </p>
              <p className="text-field-xs text-warm-gray">Baseline</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 3. ACTIVITY TREND LIST */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <h2 className="text-field-lg font-semibold text-onyx px-1">Activity Trends</h2>

          {state.summary.costCodeSummaries.map((summary) => {
            const isExpanded = state.expandedCostCodes.has(summary.costCode.id);
            const sparklineData = getSparklineData(summary.costCode.id);
            const costCodeAnalytics = state.analytics.get(summary.costCode.id) || [];
            const latestAnalytics = costCodeAnalytics.length > 0 ? costCodeAnalytics[0] : null;

            const variancePercent = latestAnalytics ? latestAnalytics.plannedVsActualVariance : 0;
            const varianceColor = variancePercent > 0 ? "text-red-600" : "text-green-600";

            return (
              <div key={summary.costCode.id} className="bg-glass border border-gray-100 rounded-xl shadow-glass-card overflow-hidden">
                {/* Header - Always Visible */}
                <button
                  onClick={() => toggleExpanded(summary.costCode.id)}
                  className="w-full p-4 flex items-start justify-between hover:bg-glass-light transition-colors"
                >
                  <div className="flex-1 min-w-0 text-left">
                    {/* Cost Code & CSI Division */}
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-field-sm font-bold text-onyx">{summary.costCode.code}</p>
                      <span className="text-field-xs bg-accent-violet text-white px-1.5 py-0.5 rounded">
                        {summary.costCode.csiDivision}
                      </span>
                    </div>

                    {/* Activity Name */}
                    <p className="text-field-xs text-warm-gray mb-3 truncate">{summary.costCode.activity}</p>

                    {/* Sparkline */}
                    {sparklineData.length > 0 && <div className="mb-3">{renderSparkline(sparklineData)}</div>}
                  </div>

                  {/* Right Column: Variance & Trend */}
                  <div className="flex-shrink-0 ml-3 flex flex-col items-end gap-2">
                    {/* Variance */}
                    <div className={`text-field-sm font-semibold ${varianceColor}`}>
                      {variancePercent > 0 ? "+" : ""}{formatPercent(variancePercent)}%
                    </div>

                    {/* Trend Indicator */}
                    <div className="flex items-center">
                      {summary.trendDirection === "improving" && (
                        <TrendingUp size={16} className="text-green-600" />
                      )}
                      {summary.trendDirection === "declining" && (
                        <TrendingDown size={16} className="text-red-600" />
                      )}
                      {summary.trendDirection === "stable" && <Minus size={16} className="text-warm-gray" />}
                    </div>

                    {/* Expand Chevron */}
                    <div className="mt-1">
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-onyx" />
                      ) : (
                        <ChevronDown size={18} className="text-onyx" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-glass-light">
                    {latestAnalytics ? (
                      <>
                        {/* Unit Rate Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-field-xs text-warm-gray mb-1">Peak Rate</p>
                            <p className="text-field-sm font-semibold text-onyx">
                              {formatDecimal(latestAnalytics.peakUnitRate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-field-xs text-warm-gray mb-1">Avg Rate</p>
                            <p className="text-field-sm font-semibold text-onyx">
                              {formatDecimal(latestAnalytics.averageUnitRate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-field-xs text-warm-gray mb-1">Low Rate</p>
                            <p className="text-field-sm font-semibold text-onyx">
                              {formatDecimal(latestAnalytics.lowUnitRate)}
                            </p>
                          </div>
                        </div>

                        {/* Standard Deviation */}
                        <div className="bg-glass rounded-lg p-3 border border-gray-100">
                          <p className="text-field-xs text-warm-gray mb-1">Standard Deviation</p>
                          <p className="text-field-base font-semibold text-onyx">
                            {formatDecimal(latestAnalytics.standardDeviation)}
                          </p>
                        </div>

                        {/* Quantity Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-field-xs text-warm-gray">Quantity Installed</p>
                            <p className="text-field-xs font-semibold text-onyx">
                              {Math.round(summary.percentComplete)}%
                            </p>
                          </div>
                          <div className="w-full bg-glass-medium rounded-full h-2 mb-1">
                            <div
                              className="bg-accent-violet rounded-full h-2 transition-all"
                              style={{ width: `${summary.percentComplete}%` }}
                            />
                          </div>
                          <p className="text-field-xs text-warm-gray">
                            {Math.round(summary.totalQuantityInstalled)} of {summary.costCode.budgetedQuantity}{" "}
                            {summary.costCode.unitOfMeasure}
                          </p>
                        </div>

                        {/* Labor Hours */}
                        <div className="bg-glass rounded-lg p-3 border border-gray-100">
                          <p className="text-field-xs text-warm-gray mb-1">Total Labor Hours</p>
                          <p className="text-field-base font-semibold text-onyx">
                            {Math.round(latestAnalytics.totalLaborHours)} hrs
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-field-xs text-warm-gray text-center py-4">No detailed analytics available</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 4. TOP VARIANCES SECTION */}
        {/* ════════════════════════════════════════════════════════════ */}
        {topVariances.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-field-lg font-semibold text-onyx px-1">Top Variances</h2>

            {topVariances.map((variance, idx) => (
              <div key={variance.costCodeId} className="bg-glass border border-gray-100 rounded-xl p-4 shadow-glass-card">
                {/* Rank & Code */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-violet text-white text-field-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-field-sm font-semibold text-onyx">{variance.code}</p>
                    </div>
                    <p className="text-field-xs text-warm-gray mt-1">{variance.description}</p>
                  </div>
                </div>

                {/* Variance Details */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-field-base font-bold ${variance.isFavorable ? "text-green-600" : "text-red-600"}`}>
                      {variance.isFavorable ? "+" : ""}{formatPercent(variance.variancePercent)}%
                    </p>
                    <p className="text-field-xs text-warm-gray">{formatCurrency(Math.abs(variance.varianceDollars))}</p>
                  </div>

                  {/* Mini Color Bar */}
                  <div className="flex-shrink-0 w-1 h-12 rounded-full ml-3" style={{ backgroundColor: variance.isFavorable ? "#14b8a6" : "#ec4899" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Updated */}
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
