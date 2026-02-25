"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileBarChart,
  BookOpen,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import {
  generateBidFeedbackReport,
  updateUnitPriceLibrary,
  getUnitPriceBook,
  getBidFeedbackReports,
} from "@/lib/analytics-engine";
import type { BidFeedbackReport, UnitPriceLibrary } from "@/lib/types";

type TabId = "feedback" | "unitprices";

interface ExpandedState {
  [key: string]: boolean;
}

export default function BidFeedbackPage() {
  const { activeProject } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("feedback");
  const [reports, setReports] = useState<BidFeedbackReport[]>([]);
  const [unitPrices, setUnitPrices] = useState<UnitPriceLibrary[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedHistorical, setExpandedHistorical] = useState<ExpandedState>(
    {}
  );

  const loadData = useCallback(async () => {
    if (!activeProject) return;

    setLoading(true);
    try {
      if (activeTab === "feedback") {
        const reports = await getBidFeedbackReports(activeProject.id);
        setReports(reports);
      } else {
        const prices = await getUnitPriceBook("blackstone-construction");
        setUnitPrices(prices);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeProject, activeTab]);

  // Load data on mount and tab change
  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerateReport() {
    if (!activeProject) return;

    setLoading(true);
    try {
      await generateBidFeedbackReport(activeProject.id, activeProject.name);
      const reports = await getBidFeedbackReports(activeProject.id);
      setReports(reports);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUnitPrices() {
    if (!activeProject) return;

    setLoading(true);
    try {
      await updateUnitPriceLibrary(activeProject.id, activeProject.name);
      const prices = await getUnitPriceBook("blackstone-construction");
      setUnitPrices(prices);
    } catch (error) {
      console.error("Error updating unit prices:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!activeProject) {
    return (
      <AppShell>
        <Header title="Bid Feedback Dashboard" backHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-warm-gray">No project loaded</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        title="Bid Feedback Dashboard"
        subtitle={activeProject.name}
        backHref="/"
      />

      {/* Tab Navigation */}
      <div className="sticky top-[56px] z-30 bg-obsidian/90 border-b border-gray-100 px-4 pt-3 pb-0 overflow-x-auto">
        <div className="flex gap-2 min-w-min pb-3">
          <TabButton
            label="Bid Feedback"
            active={activeTab === "feedback"}
            onClick={() => setActiveTab("feedback")}
            icon={<FileBarChart size={18} />}
          />
          <TabButton
            label="Unit Price Book"
            active={activeTab === "unitprices"}
            onClick={() => setActiveTab("unitprices")}
            icon={<BookOpen size={18} />}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-24">
        {activeTab === "feedback" && (
          <TabBidFeedback
            reports={reports}
            loading={loading}
            onGenerateReport={handleGenerateReport}
          />
        )}
        {activeTab === "unitprices" && (
          <TabUnitPriceBook
            unitPrices={unitPrices}
            loading={loading}
            onUpdate={handleUpdateUnitPrices}
            expandedHistorical={expandedHistorical}
            setExpandedHistorical={setExpandedHistorical}
          />
        )}
      </div>
    </AppShell>
  );
}

// ============================================================
// Tab Button Component
// ============================================================

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

function TabButton({ label, active, onClick, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-2.5 rounded-full font-body font-semibold
        text-field-base transition-colors flex items-center gap-2
        ${
          active
            ? "bg-accent-violet text-white"
            : "bg-glass text-onyx hover:bg-glass-light"
        }
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </button>
  );
}

// ============================================================
// TAB 1: Bid Feedback
// ============================================================

interface TabBidFeedbackProps {
  reports: BidFeedbackReport[];
  loading: boolean;
  onGenerateReport: () => Promise<void>;
}

function TabBidFeedback({
  reports,
  loading,
  onGenerateReport,
}: TabBidFeedbackProps) {
  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-onyx">
            Bid vs. Actual Performance
          </h2>
          <p className="text-field-sm text-warm-gray mt-1">
            How actual field performance compares to your bids
          </p>
        </div>

        <button
          onClick={onGenerateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-violet text-white rounded-full font-body font-semibold transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* No Reports State */}
      {!latestReport ? (
        <EmptyState
          title="No bid feedback reports generated yet"
          description="Generate one from your daily log data."
          icon={<FileBarChart size={48} className="text-warm-gray" />}
        />
      ) : (
        <>
          {/* Report Summary Card */}
          <ReportSummaryCard report={latestReport} />

          {/* Key Findings */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-onyx px-1">
              Key Findings
            </h3>
            <div className="space-y-3">
              {latestReport.keyFindings.map((finding) => (
                <KeyFindingCard key={finding.costCodeId} finding={finding} />
              ))}
            </div>
          </div>

          {/* Adjustment Recommendations */}
          {latestReport.adjustmentRecommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-onyx px-1">
                Recommended Bid Adjustments
              </h3>
              <div className="space-y-3">
                {latestReport.adjustmentRecommendations.map((rec, idx) => (
                  <AdjustmentCard key={idx} recommendation={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Lessons Learned */}
          {latestReport.lessonsLearned.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-onyx px-1">
                Lessons Learned
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4">
                <ol className="space-y-3">
                  {latestReport.lessonsLearned.map((lesson, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-alabaster flex items-center justify-center text-field-xs font-semibold text-onyx">
                        {idx + 1}
                      </span>
                      <span className="text-field-sm text-onyx pt-0.5">
                        {lesson}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Report Summary Card Component
// ============================================================

interface ReportSummaryCardProps {
  report: BidFeedbackReport;
}

function ReportSummaryCard({ report }: ReportSummaryCardProps) {
  const generatedDate = new Date(report.generatedDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Calculate summary stats
  const overBudget = report.keyFindings.filter((f) => f.variance > 5).length;
  const onTarget = report.keyFindings.filter(
    (f) => f.variance >= -5 && f.variance <= 5
  ).length;
  const underBudget = report.keyFindings.filter((f) => f.variance < -5).length;

  return (
    <div className="bg-glass border border-gray-100 rounded-xl shadow-glass-card p-4">
      <div className="space-y-4">
        <div>
          <p className="text-field-xs text-warm-gray">Generated Date</p>
          <p className="text-field-base font-semibold text-onyx mt-1">
            {generatedDate}
          </p>
        </div>

        <div>
          <p className="text-field-xs text-warm-gray">Cost Codes Analyzed</p>
          <p className="text-field-base font-semibold text-onyx mt-1">
            {report.costCodesAnalyzed}
          </p>
        </div>

        <div>
          <p className="text-field-xs text-warm-gray mb-2">Performance Summary</p>
          <div className="flex gap-2">
            <SummaryBadge
              label={`${overBudget} Over`}
              color="red"
              icon={<TrendingUp size={14} />}
            />
            <SummaryBadge
              label={`${onTarget} On Target`}
              color="green"
              icon={<CheckCircle size={14} />}
            />
            <SummaryBadge
              label={`${underBudget} Under`}
              color="blue"
              icon={<TrendingDown size={14} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryBadgeProps {
  label: string;
  color: "red" | "green" | "blue";
  icon?: React.ReactNode;
}

function SummaryBadge({ label, color, icon }: SummaryBadgeProps) {
  const colorClasses: Record<string, string> = {
    red: "bg-accent-red/10 text-accent-red border-accent-red/30",
    green: "bg-accent-green/10 text-accent-green border-accent-green/30",
    blue: "bg-accent-violet/10 text-accent-violet border-accent-violet/30",
  };

  return (
    <div
      className={`flex-1 text-center py-2 px-3 rounded-lg border text-field-xs font-semibold flex items-center justify-center gap-1.5 ${colorClasses[color]}`}
    >
      {icon}
      {label}
    </div>
  );
}

// ============================================================
// Key Finding Card Component
// ============================================================

interface KeyFindingCardProps {
  finding: BidFeedbackReport["keyFindings"][number];
}

function KeyFindingCard({ finding }: KeyFindingCardProps) {
  const variance = finding.variance;
  let varianceColor: string;
  let varianceBg: string;
  let varianceLabel: string;

  if (variance > 15) {
    varianceColor = "text-red-700";
    varianceBg = "bg-red-50 border-red-200";
    varianceLabel = `OVER +${variance.toFixed(1)}%`;
  } else if (variance >= 5 && variance <= 15) {
    varianceColor = "text-amber-700";
    varianceBg = "bg-amber-50 border-amber-200";
    varianceLabel = `OVER +${variance.toFixed(1)}%`;
  } else if (variance >= -5 && variance < 5) {
    varianceColor = "text-green-700";
    varianceBg = "bg-green-50 border-green-200";
    varianceLabel = "ON TARGET";
  } else {
    varianceColor = "text-blue-700";
    varianceBg = "bg-blue-50 border-blue-200";
    varianceLabel = `UNDER ${Math.abs(variance).toFixed(1)}%`;
  }

  return (
    <div className="bg-glass border border-gray-100 rounded-xl shadow-glass-card p-4 space-y-3">
      {/* Header: Description and Badge */}
      <div className="flex items-start gap-3 justify-between">
        <div>
          <h4 className="text-field-base font-semibold text-onyx">
            {finding.costCodeDescription || finding.costCodeId}
          </h4>
        </div>
        <div
          className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-field-xs font-semibold whitespace-nowrap ${varianceBg} ${varianceColor}`}
        >
          {varianceLabel}
        </div>
      </div>

      {/* Bid vs Actual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-field-xs text-warm-gray">Bid</p>
          <p className="text-field-base font-semibold text-onyx mt-1">
            ${finding.bidRate.toFixed(2)}/unit
          </p>
        </div>
        <div className="text-center">
          <p className="text-field-xs text-warm-gray">Actual</p>
          <p className="text-field-base font-semibold text-onyx mt-1">
            ${finding.actualRate.toFixed(2)}/unit
          </p>
        </div>
      </div>

      {/* Recommendation Callout */}
      <div className="bg-glass-light border-l-4 border-accent-violet rounded p-3">
        <p className="text-field-xs text-onyx">{finding.recommendation}</p>
      </div>
    </div>
  );
}

// ============================================================
// Adjustment Card Component
// ============================================================

interface AdjustmentCardProps {
  recommendation: BidFeedbackReport["adjustmentRecommendations"][number];
}

function AdjustmentCard({ recommendation }: AdjustmentCardProps) {
  const confidenceFilled = Math.round(recommendation.confidence * 5);

  return (
    <div className="bg-glass border border-gray-100 rounded-xl shadow-glass-card p-4 space-y-3">
      {/* Header: CSI Division + Activity */}
      <div>
        <p className="text-field-xs font-semibold text-warm-gray uppercase">
          CSI {recommendation.csiDivision}
        </p>
        <h4 className="text-field-base font-semibold text-onyx mt-1">
          {recommendation.activity}
        </h4>
      </div>

      {/* Rate Change */}
      <div className="flex items-center gap-3 justify-between">
        <div>
          <p className="text-field-xs text-warm-gray">Current Bid Rate</p>
          <p className="text-field-base font-semibold text-onyx">
            ${recommendation.currentBidRate.toFixed(2)}
          </p>
        </div>

        <div className="flex-shrink-0 text-warm-gray">→</div>

        <div className="flex-1">
          <p className="text-field-xs text-warm-gray">Recommended Rate</p>
          <p className="text-field-base font-semibold text-accent-green">
            ${recommendation.recommendedRate.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div>
        <p className="text-field-xs text-warm-gray mb-2">Confidence</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-3 rounded-full ${
                idx < confidenceFilled ? "bg-onyx" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Basis Description */}
      <p className="text-field-xs text-onyx bg-alabaster rounded p-2">
        {recommendation.basis}
      </p>
    </div>
  );
}

// ============================================================
// TAB 2: Unit Price Book
// ============================================================

interface TabUnitPriceBookProps {
  unitPrices: UnitPriceLibrary[];
  loading: boolean;
  onUpdate: () => Promise<void>;
  expandedHistorical: ExpandedState;
  setExpandedHistorical: (state: ExpandedState) => void;
}

function TabUnitPriceBook({
  unitPrices,
  loading,
  onUpdate,
  expandedHistorical,
  setExpandedHistorical,
}: TabUnitPriceBookProps) {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-onyx">
            Company Unit Price Library
          </h2>
          <p className="text-field-sm text-warm-gray mt-1">
            Historical rates from all projects
          </p>
        </div>

        <button
          onClick={onUpdate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-violet text-white rounded-full font-body font-semibold transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          {loading ? "Updating..." : "Update from Project"}
        </button>
      </div>

      {/* No Unit Prices State */}
      {unitPrices.length === 0 ? (
        <EmptyState
          title="Unit price library is empty"
          description="Update it from your project's productivity data."
          icon={<BookOpen size={48} className="text-warm-gray" />}
        />
      ) : (
        <div className="space-y-3">
          {unitPrices.map((priceEntry) => (
            <UnitPriceCard
              key={priceEntry.id}
              priceEntry={priceEntry}
              expanded={expandedHistorical[priceEntry.id] || false}
              onToggleExpanded={(expanded) =>
                setExpandedHistorical({
                  ...expandedHistorical,
                  [priceEntry.id]: expanded,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Unit Price Card Component
// ============================================================

interface UnitPriceCardProps {
  priceEntry: UnitPriceLibrary;
  expanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

function UnitPriceCard({
  priceEntry,
  expanded,
  onToggleExpanded,
}: UnitPriceCardProps) {
  const laborPercent = (
    (priceEntry.laborComponent / priceEntry.currentUnitPrice) *
    100
  ).toFixed(0);
  const materialPercent = (
    (priceEntry.materialComponent / priceEntry.currentUnitPrice) *
    100
  ).toFixed(0);
  const equipmentPercent = (
    (priceEntry.equipmentComponent / priceEntry.currentUnitPrice) *
    100
  ).toFixed(0);

  const lastUpdated = new Date(priceEntry.lastUpdatedDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header: CSI + Activity + Description */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2 py-1 bg-alabaster rounded text-field-xs font-semibold text-onyx">
              CSI {priceEntry.csiDivision}
            </span>
            <h3 className="text-field-base font-semibold text-onyx">
              {priceEntry.activity}
            </h3>
          </div>
          <p className="text-field-xs text-warm-gray">{priceEntry.description}</p>
        </div>

        {/* Large Unit Price Display */}
        <div className="text-center py-2">
          <p className="text-field-xs text-warm-gray mb-1">Unit Price</p>
          <p className="text-3xl font-bold text-onyx">
            ${priceEntry.currentUnitPrice.toFixed(2)}
          </p>
          <p className="text-field-xs text-warm-gray mt-1">
            / {priceEntry.unitOfMeasure}
          </p>
        </div>

        {/* Breakdown Bar */}
        <div>
          <p className="text-field-xs text-warm-gray mb-2">Cost Breakdown</p>
          <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
            <div
              style={{ width: `${laborPercent}%` }}
              className="bg-onyx"
              title={`Labor: ${laborPercent}%`}
            />
            <div
              style={{ width: `${materialPercent}%` }}
              className="bg-blue-500"
              title={`Material: ${materialPercent}%`}
            />
            <div
              style={{ width: `${equipmentPercent}%` }}
              className="bg-amber-500"
              title={`Equipment: ${equipmentPercent}%`}
            />
          </div>
          <div className="flex gap-4 mt-2">
            <LegendItem
              color="bg-onyx"
              label="Labor"
              value={`$${priceEntry.laborComponent.toFixed(2)}`}
            />
            <LegendItem
              color="bg-blue-500"
              label="Material"
              value={`$${priceEntry.materialComponent.toFixed(2)}`}
            />
            <LegendItem
              color="bg-amber-500"
              label="Equipment"
              value={`$${priceEntry.equipmentComponent.toFixed(2)}`}
            />
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-field-xs text-warm-gray">
          Last updated: {lastUpdated}
        </p>

        {/* Historical Rates Section (Collapsible) */}
        {priceEntry.historicalRates.length > 0 && (
          <button
            onClick={() => onToggleExpanded(!expanded)}
            className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-alabaster transition-colors"
          >
            <span className="text-field-xs font-semibold text-onyx">
              Historical Rates ({priceEntry.historicalRates.length})
            </span>
            {expanded ? (
              <ChevronUp size={16} className="text-onyx flex-shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-onyx flex-shrink-0" />
            )}
          </button>
        )}

        {/* Historical Rates List (Expanded) */}
        {expanded && priceEntry.historicalRates.length > 0 && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {priceEntry.historicalRates.map((rate, idx) => (
              <div
                key={idx}
                className="bg-glass-light rounded p-2.5 text-field-xs space-y-1"
              >
                <div className="font-semibold text-onyx">{rate.projectName}</div>
                <div className="text-warm-gray">
                  {new Date(rate.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="font-semibold text-onyx">
                  ${rate.unitRate.toFixed(2)} / {priceEntry.unitOfMeasure}
                </div>
                {rate.conditions && (
                  <div className="text-warm-gray italic">{rate.conditions}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Seasonal Adjustments (if present) */}
        {priceEntry.seasonalAdjustments &&
          priceEntry.seasonalAdjustments.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-field-xs font-semibold text-onyx mb-2">
                Seasonal Adjustments
              </p>
              <div className="grid grid-cols-2 gap-2">
                {priceEntry.seasonalAdjustments.map((adj) => (
                  <div
                    key={adj.quarter}
                    className="bg-glass-light rounded p-2 text-center"
                  >
                    <p className="text-field-xs font-semibold text-onyx">
                      {adj.quarter}
                    </p>
                    <p className="text-field-xs text-warm-gray">
                      {(adj.factor * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Complexity Tiers (if present) */}
        {priceEntry.complexityTiers &&
          priceEntry.complexityTiers.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-field-xs font-semibold text-onyx mb-2">
                Complexity Tiers
              </p>
              <div className="space-y-1.5">
                {priceEntry.complexityTiers.map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between">
                    <span className="text-field-xs text-onyx capitalize">
                      {tier.tier}
                    </span>
                    <span className="text-field-xs font-semibold text-onyx">
                      {(tier.factor * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  value: string;
}

function LegendItem({ color, label, value }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-field-xs text-warm-gray">{label}</span>
      <span className="text-field-xs font-semibold text-onyx">{value}</span>
    </div>
  );
}

// ============================================================
// Empty State Component
// ============================================================

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="bg-glass border border-gray-100 rounded-xl shadow-glass-card p-8 flex flex-col items-center justify-center gap-4 text-center">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-field-base font-semibold text-onyx">{title}</h3>
        <p className="text-field-sm text-warm-gray mt-1">{description}</p>
      </div>
    </div>
  );
}
