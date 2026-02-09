"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import { generateMockWeeklyReport } from "@/lib/report-prompts";
import type { DailyLog, ReportFormat } from "@/lib/types";
import {
  FileBarChart,
  Loader2,
  Printer,
  Download,
  RefreshCw,
} from "lucide-react";

export default function ReportPage() {
  const params = useParams();
  const { activeProject, claudeApiKey } = useAppStore();

  // Parse the format slug from URL
  const formatSlug = Array.isArray(params.format)
    ? params.format[0]
    : (params.format as string);

  // Map URL slugs to ReportFormat types
  const formatMap: Record<string, ReportFormat> = {
    client: "client",
    "design-team": "design_team",
    subcontractor: "subcontractor",
    "internal-risk": "internal",
  };

  const formatType: ReportFormat | undefined = formatMap[formatSlug];

  // Report type labels
  const formatLabels: Record<ReportFormat, string> = {
    client: "Client / Owner Report",
    design_team: "Design Team Report",
    subcontractor: "Subcontractor Report",
    internal: "Internal / Risk Report",
  };

  const formatDescriptions: Record<ReportFormat, string> = {
    client:
      "Professional progress summary for property owners and investors. Includes milestones, schedule status, and items requiring approval.",
    design_team:
      "Technical report for architects, engineers, and consultants. Focuses on RFIs, submittals, and design coordination.",
    subcontractor:
      "Coordination report for all subcontractors. Covers completed work, scheduling, and safety reminders.",
    internal:
      "Candid risk management report for company leadership. Details schedule risks, cost exposure, and conflicts.",
  };

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [reportHtml, setReportHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Calculate week start (Monday) and week end (Friday)
  function getWeekDates(currentDate: Date): {
    weekStart: string;
    weekEnd: string;
  } {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4); // Monday + 4 days = Friday

    const weekStart = monday.toISOString().split("T")[0];
    const weekEnd = friday.toISOString().split("T")[0];

    return { weekStart, weekEnd };
  }

  // Load daily logs on mount
  useEffect(() => {
    async function loadLogs() {
      if (!activeProject) return;

      const now = new Date();
      const { weekStart, weekEnd } = getWeekDates(now);

      const fetchedLogs = await db.dailyLogs
        .where("projectId")
        .equals(activeProject.id)
        .filter((log) => log.date >= weekStart && log.date <= weekEnd)
        .toArray();

      setLogs(fetchedLogs);
      setInitialized(true);
    }

    loadLogs();
  }, [activeProject]);

  // Handle generate report
  async function handleGenerateReport() {
    if (!activeProject || !formatType) return;

    setIsLoading(true);

    try {
      const now = new Date();
      const { weekStart, weekEnd } = getWeekDates(now);

      if (claudeApiKey) {
        // Call API with Claude API key
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "weekly-report",
            apiKey: claudeApiKey,
            project: activeProject,
            logs,
            formatType,
            weekStart,
            weekEnd,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setReportHtml(data.html);
        } else {
          // Fall back to mock if API fails
          const mockHtml = generateMockWeeklyReport(
            activeProject,
            formatType,
            weekStart,
            weekEnd,
            logs
          );
          setReportHtml(mockHtml);
        }
      } else {
        // Generate mock report
        const mockHtml = generateMockWeeklyReport(
          activeProject,
          formatType,
          weekStart,
          weekEnd,
          logs
        );
        setReportHtml(mockHtml);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle print
  function handlePrint() {
    window.print();
  }

  // Handle export PDF
  async function handleExportPDF() {
    if (!reportHtml) return;

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export-pdf",
          html: reportHtml,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${formatSlug}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  }

  // Loading state
  if (!initialized) {
    return (
      <AppShell>
        <Header title="Loading..." backHref="/reports" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-onyx animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Invalid format
  if (!formatType) {
    return (
      <AppShell>
        <Header title="Invalid Report" backHref="/reports" />
        <div className="screen px-5 pt-6">
          <p className="text-warm-gray">The requested report format is not available.</p>
        </div>
      </AppShell>
    );
  }

  // Report generation landing
  if (!reportHtml) {
    return (
      <AppShell>
        <Header title={formatLabels[formatType]} backHref="/reports" />
        <div className="screen px-5 pt-6 pb-8">
          {/* Report Info Card */}
          <div className="bg-alabaster rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex gap-3 mb-4">
              <FileBarChart className="w-6 h-6 text-onyx flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-heading font-semibold text-field-base text-onyx mb-2">
                  {formatLabels[formatType]}
                </h2>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {formatDescriptions[formatType]}
                </p>
              </div>
            </div>
          </div>

          {/* Logs Summary */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-sm text-warm-gray mb-2">Daily logs available for this week:</p>
            <p className="text-2xl font-semibold text-onyx">{logs.length}</p>
            <p className="text-xs text-warm-gray mt-1">
              {logs.length === 0
                ? "No logs recorded yet. Add daily logs to generate a report."
                : `${logs.length} log${logs.length !== 1 ? "s" : ""} will be included in your report.`}
            </p>
          </div>

          {/* API Key Note */}
          {!claudeApiKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-warm-gray">
                <strong>Demo Mode:</strong> No Claude API key configured. Reports will be
                generated using mock data. Add your API key in Settings for AI-generated reports.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            style={{
              minHeight: "56px",
            }}
            className="w-full bg-onyx text-white font-semibold rounded-lg px-5 py-3 flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileBarChart className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </AppShell>
    );
  }

  // Report display
  return (
    <AppShell>
      <Header title={formatLabels[formatType]} backHref="/reports" />
      <div className="screen px-5 pt-6 pb-8">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleExportPDF}
            style={{
              minHeight: "56px",
            }}
            className="flex-1 bg-alabaster text-onyx border border-gray-300 font-semibold rounded-lg px-3 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-transform"
            title="Export as PDF"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              minHeight: "56px",
            }}
            className="flex-1 bg-alabaster text-onyx border border-gray-300 font-semibold rounded-lg px-3 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-transform"
            title="Print report"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => setReportHtml("")}
            style={{
              minHeight: "56px",
            }}
            className="flex-1 bg-alabaster text-onyx border border-gray-300 font-semibold rounded-lg px-3 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-transform"
            title="Generate new report"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Report Container */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div
            className="p-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </div>
      </div>
    </AppShell>
  );
}
