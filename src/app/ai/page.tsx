"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import {
  exportToExcel,
  exportToWord,
  exportToPowerPoint,
  exportToPDF,
  parseReportResponse,
} from "@/lib/export-utils";
import type { DailyLog } from "@/lib/types";
import {
  Sparkles,
  Send,
  FileSpreadsheet,
  FileText,
  Presentation,
  Download,
  Loader2,
  MessageSquare,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  Users,
  Clock,
  ShieldAlert,
  Truck,
  Hammer,
  Mail,
  User,
  ChevronDown,
} from "lucide-react";

type AITab = "insights" | "reports";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CannedReport {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: ("excel" | "pdf" | "word" | "powerpoint")[];
  defaultFormat: "excel" | "pdf" | "word" | "powerpoint";
}

const CANNED_REPORTS: CannedReport[] = [
  {
    id: "weekly-superintendent",
    title: "Weekly Superintendent Report",
    description: "Manpower, work completed, delays & issues this week",
    icon: <BarChart3 size={20} />,
    formats: ["excel", "pdf"],
    defaultFormat: "excel",
  },
  {
    id: "manpower-summary",
    title: "Manpower Summary",
    description: "Workforce breakdown by trade, hours, and headcount",
    icon: <Users size={20} />,
    formats: ["excel", "pdf"],
    defaultFormat: "excel",
  },
  {
    id: "safety-report",
    title: "Safety Incident Report",
    description: "Safety incidents, near-misses, and corrective actions",
    icon: <ShieldAlert size={20} />,
    formats: ["word", "pdf"],
    defaultFormat: "word",
  },
  {
    id: "delay-analysis",
    title: "Delay Impact Analysis",
    description: "Schedule impacts, responsible parties, and recovery plans",
    icon: <Clock size={20} />,
    formats: ["powerpoint", "pdf"],
    defaultFormat: "powerpoint",
  },
  {
    id: "change-order-summary",
    title: "Change Order Summary",
    description: "All changes, cost impacts, and approval status",
    icon: <AlertTriangle size={20} />,
    formats: ["word", "pdf"],
    defaultFormat: "word",
  },
  {
    id: "equipment-utilization",
    title: "Equipment Utilization",
    description: "Equipment usage rates, rental costs, and availability",
    icon: <Truck size={20} />,
    formats: ["excel", "pdf"],
    defaultFormat: "excel",
  },
  {
    id: "work-progress",
    title: "Work Progress Report",
    description: "Activities by zone, completion status, and upcoming work",
    icon: <Hammer size={20} />,
    formats: ["powerpoint", "pdf"],
    defaultFormat: "powerpoint",
  },
  {
    id: "monthly-progress",
    title: "Monthly Progress Report",
    description: "Comprehensive monthly overview for stakeholders",
    icon: <Presentation size={20} />,
    formats: ["powerpoint", "pdf"],
    defaultFormat: "powerpoint",
  },
];

const SUGGESTED_QUESTIONS = [
  "How many workers were on site this week?",
  "What are the top safety concerns?",
  "Summarize delays impacting the schedule",
  "Which subcontractors had the most hours?",
  "What work was completed in the last 7 days?",
  "Are there any open RFIs or submittals?",
];

type DeliveryMode = "self" | "others" | null;

interface Recipient {
  name: string;
  email: string;
  role: string;
}

export default function AIPage() {
  const router = useRouter();
  const { activeProject, currentUser, claudeApiKey } = useAppStore();
  const [activeTab, setActiveTab] = useState<AITab>("insights");

  // Insights state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reports state
  const [selectedReport, setSelectedReport] = useState<CannedReport | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "pdf" | "word" | "powerpoint">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [customReportDesc, setCustomReportDesc] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Delivery state
  const [, setDeliveryMode] = useState<DeliveryMode>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Redirect if not logged in or no project
  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (!activeProject) {
      router.replace("/select-project");
    }
  }, [currentUser, activeProject, router]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Gather project data for context ----
  const gatherProjectData = useCallback(async (): Promise<string> => {
    if (!activeProject) return "No project selected.";

    const logs = await db.dailyLogs
      .where("projectId")
      .equals(activeProject.id)
      .reverse()
      .limit(14)
      .toArray();

    const changeOrders = await db.changeOrders
      .where("projectId")
      .equals(activeProject.id)
      .toArray();

    const safetyIncidents = logs.flatMap((l) => l.safetyIncidents ?? []);
    const delayEvents = logs.flatMap((l) => l.delayEvents ?? []);

    const summary = {
      project: {
        name: activeProject.name,
        address: activeProject.address,
        client: activeProject.client,
        contractValue: activeProject.contractValue,
        startDate: activeProject.startDate,
        endDate: activeProject.endDate,
        subcontractors: activeProject.subcontractors.map((s) => ({
          company: s.company,
          trade: s.trade,
        })),
        taktZones: activeProject.taktZones.length,
        teamMembers: activeProject.teamMembers.map((t) => ({
          name: t.name,
          role: t.role,
        })),
      },
      recentDailyLogs: logs.map((log: DailyLog) => ({
        date: log.date,
        weather: log.weather,
        manpower: log.manpower.map((m) => ({
          subId: m.subId,
          journeymen: m.journeymanCount,
          apprentices: m.apprenticeCount,
          foremen: m.foremanCount,
          hoursWorked: m.hoursWorked,
        })),
        equipmentCount: log.equipment.length,
        workPerformed: log.workPerformed.map((w) => ({
          division: w.csiDivision,
          activity: w.activity,
          zone: w.taktZone,
          status: w.status,
        })),
        rfiCount: log.rfis.length,
        submittalCount: log.submittals.length,
        inspections: log.inspections.map((i) => ({
          inspector: i.inspectorName,
          result: i.result,
        })),
        changes: log.changes.map((c) => ({
          description: c.description,
          initiatedBy: c.initiatedBy,
          estimatedCostImpact: c.estimatedCostImpact,
        })),
        conflicts: log.conflicts.map((c) => ({
          category: c.category,
          severity: c.severity,
          resolutionStatus: c.resolutionStatus,
        })),
        delayEvents: (log.delayEvents ?? []).map((d) => ({
          type: d.delayType,
          description: d.description,
          calendarDaysImpacted: d.calendarDaysImpacted,
        })),
        safetyIncidents: (log.safetyIncidents ?? []).map((s) => ({
          type: s.incidentType,
          description: s.description,
          oshaReportable: s.oshaReportable,
        })),
        notes: log.notes,
      })),
      changeOrders: changeOrders.map((co) => ({
        status: co.status,
        description: co.description,
      })),
      totalSafetyIncidents: safetyIncidents.length,
      totalDelayEvents: delayEvents.length,
    };

    return JSON.stringify(summary, null, 2);
  }, [activeProject]);

  // ---- Get project participants for "Send to Others" ----
  const getRecipients = useCallback((): Recipient[] => {
    if (!activeProject) return [];
    const recipients: Recipient[] = [];

    // Team members
    for (const tm of activeProject.teamMembers) {
      if (tm.email) {
        recipients.push({ name: tm.name, email: tm.email, role: tm.role });
      }
    }

    // Subcontractor contacts
    for (const sub of activeProject.subcontractors) {
      if (sub.primaryContact?.email) {
        recipients.push({
          name: sub.primaryContact.name || sub.company,
          email: sub.primaryContact.email,
          role: `${sub.trade} (${sub.company})`,
        });
      }
    }

    return recipients;
  }, [activeProject]);

  // ---- Ask Insight Question ----
  const handleAskQuestion = async (question?: string) => {
    const q = question || inputValue.trim();
    if (!q || !claudeApiKey) return;

    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setIsThinking(true);

    try {
      const projectData = await gatherProjectData();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "insight",
          apiKey: claudeApiKey,
          question: q,
          projectData,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // ---- Generate Report ----
  const handleGenerateReport = async () => {
    if (!claudeApiKey) return;
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const projectData = await gatherProjectData();
      const reportType = showCustom ? "custom" : selectedReport?.id || "custom";
      const reportTitle = showCustom
        ? "Custom Report"
        : selectedReport?.title || "Custom Report";
      const customInstructions = showCustom ? customReportDesc : undefined;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-report",
          apiKey: claudeApiKey,
          reportType,
          reportTitle,
          projectData,
          format: selectedFormat,
          customInstructions,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGeneratedContent(data.report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      setGeneratedContent(`Error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- Export/Download Report ----
  const handleExport = async () => {
    if (!generatedContent) return;

    const parsed = parseReportResponse(generatedContent);
    const filename = `${selectedReport?.title || "Custom Report"} - ${activeProject?.name || "Report"}`;

    try {
      if (selectedFormat === "excel" && parsed.format === "EXCEL_JSON") {
        const jsonContent = parsed.content;
        // Find the JSON object in the content
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          await exportToExcel(data, filename);
        }
      } else if (selectedFormat === "powerpoint" && parsed.format === "SLIDES_JSON") {
        const jsonMatch = parsed.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          await exportToPowerPoint(data, filename);
        }
      } else if (selectedFormat === "word") {
        exportToWord(parsed.content, filename);
      } else {
        // PDF or fallback
        exportToPDF(parsed.content, filename);
      }
    } catch (err) {
      console.error("Export failed:", err);
      // Fallback to PDF print
      exportToPDF(parsed.content, filename);
    }
  };

  // ---- Send handlers ----
  const handleSendToSelf = () => {
    setDeliveryMode("self");
    handleExport();
  };

  const handleSendToOthers = () => {
    setDeliveryMode("others");
    setShowRecipientDropdown(true);
  };

  const handleDeliverToRecipients = () => {
    // Download the file — email integration would go here
    handleExport();
    setShowRecipientDropdown(false);
    setDeliveryMode(null);
  };

  const toggleRecipient = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  if (!currentUser || !activeProject) return null;

  const recipients = getRecipients();

  const FORMAT_ICONS: Record<string, React.ReactNode> = {
    excel: <FileSpreadsheet size={16} />,
    pdf: <FileText size={16} />,
    word: <FileText size={16} />,
    powerpoint: <Presentation size={16} />,
  };

  const FORMAT_LABELS: Record<string, string> = {
    excel: "Excel",
    pdf: "PDF",
    word: "Word",
    powerpoint: "PowerPoint",
  };

  return (
    <AppShell>
      <div className="screen">
        <Header title="AI Assistant" subtitle="Insights & Reports" backHref="/" />

        {/* API Key Warning */}
        {!claudeApiKey && (
          <div className="mx-5 mt-4 px-4 py-3 bg-accent-amber/10 border border-accent-amber/30 rounded-xl">
            <p className="text-sm font-medium text-amber-800">
              API key required. Go to{" "}
              <button
                onClick={() => router.push("/settings")}
                className="underline font-bold"
              >
                Settings
              </button>{" "}
              to add your Claude API key.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-5 pt-4">
          <div className="flex bg-alabaster rounded-xl p-1">
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "insights"
                  ? "bg-white text-onyx shadow-sm"
                  : "text-warm-gray"
              }`}
            >
              <MessageSquare size={16} />
              Insights
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "reports"
                  ? "bg-white text-onyx shadow-sm"
                  : "text-warm-gray"
              }`}
            >
              <FileSpreadsheet size={16} />
              Reports
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* INSIGHTS TAB */}
        {/* ============================================ */}
        {activeTab === "insights" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center pt-8">
                  <div className="w-16 h-16 bg-alabaster rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={28} className="text-warm-gray" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-onyx mb-1">
                    Ask about your project
                  </h3>
                  <p className="text-sm text-warm-gray mb-6">
                    Get instant insights from your daily logs, safety data, and more
                  </p>

                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleAskQuestion(q)}
                        disabled={!claudeApiKey || isThinking}
                        className="w-full text-left px-4 py-3 bg-alabaster rounded-xl text-sm text-onyx hover:bg-gray-200 transition-colors disabled:opacity-40 active:scale-[0.98]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-onyx text-white rounded-br-md"
                        : "bg-alabaster text-onyx rounded-bl-md"
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-alabaster rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-warm-gray">
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing project data...
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-5 pb-5 pt-2 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  placeholder="Ask about your project..."
                  disabled={!claudeApiKey || isThinking}
                  className="flex-1 px-4 py-3 bg-alabaster rounded-xl text-sm text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-onyx disabled:opacity-40"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  disabled={!claudeApiKey || isThinking || !inputValue.trim()}
                  className="flex-shrink-0 w-11 h-11 bg-onyx rounded-xl flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* REPORTS TAB */}
        {/* ============================================ */}
        {activeTab === "reports" && !selectedReport && !showCustom && (
          <div className="px-5 pt-4 pb-32 space-y-3">
            <p className="text-sm text-warm-gray mb-2">
              Select a report to generate from your project data
            </p>

            {CANNED_REPORTS.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  setSelectedFormat(report.defaultFormat);
                  setGeneratedContent(null);
                  setDeliveryMode(null);
                }}
                className="w-full flex items-center gap-4 px-4 py-4 bg-alabaster rounded-xl text-left hover:bg-gray-200 transition-colors active:scale-[0.98]"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-onyx rounded-lg flex items-center justify-center text-white">
                  {report.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-onyx">
                    {report.title}
                  </p>
                  <p className="text-xs text-warm-gray mt-0.5">
                    {report.description}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {report.formats.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-warm-gray"
                      >
                        {FORMAT_ICONS[f]}
                        {FORMAT_LABELS[f]}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={18} className="text-warm-gray flex-shrink-0" />
              </button>
            ))}

            {/* Custom Report */}
            <button
              onClick={() => {
                setShowCustom(true);
                setSelectedFormat("pdf");
                setGeneratedContent(null);
                setDeliveryMode(null);
              }}
              className="w-full flex items-center gap-4 px-4 py-4 bg-onyx rounded-xl text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-white">
                  Custom Report
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  Describe what you need and AI will generate it
                </p>
              </div>
              <ChevronRight size={18} className="text-white/40 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* REPORT DETAIL / GENERATION VIEW */}
        {/* ============================================ */}
        {activeTab === "reports" && (selectedReport || showCustom) && (
          <div className="px-5 pt-4 pb-32">
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedReport(null);
                setShowCustom(false);
                setGeneratedContent(null);
                setDeliveryMode(null);
                setSelectedRecipients([]);
              }}
              className="flex items-center gap-1 text-warm-gray text-sm mb-4 active:text-onyx transition-colors"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back to Reports
            </button>

            {/* Report Title */}
            <h2 className="font-heading text-xl font-semibold text-onyx mb-1">
              {showCustom ? "Custom Report" : selectedReport?.title}
            </h2>
            <p className="text-sm text-warm-gray mb-5">
              {showCustom
                ? "Describe the report you need"
                : selectedReport?.description}
            </p>

            {/* Custom report description */}
            {showCustom && (
              <textarea
                value={customReportDesc}
                onChange={(e) => setCustomReportDesc(e.target.value)}
                placeholder="Describe the report you want generated... e.g., 'Create a summary of all delays in the last month grouped by responsible party with cost estimates'"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-onyx mb-4 min-h-[100px] resize-none"
              />
            )}

            {/* Format Selection */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-onyx mb-2 uppercase tracking-wide">
                Export Format
              </label>
              <div className="flex gap-2">
                {(showCustom
                  ? (["excel", "pdf", "word", "powerpoint"] as const)
                  : selectedReport?.formats || []
                ).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormat(f)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedFormat === f
                        ? "bg-onyx text-white"
                        : "bg-alabaster text-onyx hover:bg-gray-200"
                    }`}
                  >
                    {FORMAT_ICONS[f]}
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            {!generatedContent && (
              <button
                onClick={handleGenerateReport}
                disabled={
                  !claudeApiKey ||
                  isGenerating ||
                  (showCustom && !customReportDesc.trim())
                }
                className="w-full py-3.5 bg-onyx text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Report
                  </>
                )}
              </button>
            )}

            {/* Generated Content Preview */}
            {generatedContent && !generatedContent.startsWith("Error") && (
              <div className="mt-5">
                <div className="bg-alabaster rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-accent-green" />
                    <span className="text-sm font-semibold text-onyx">
                      Report Generated
                    </span>
                  </div>
                  <p className="text-xs text-warm-gray">
                    Your {showCustom ? "custom" : selectedReport?.title} report is
                    ready. Choose how to deliver it below.
                  </p>
                </div>

                {/* Delivery Options */}
                <div className="space-y-3">
                  {/* Send to Myself */}
                  <button
                    onClick={handleSendToSelf}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-onyx text-white rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">Send to Myself</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        Download as {FORMAT_LABELS[selectedFormat]}
                      </p>
                    </div>
                    <Download size={18} className="text-white/60" />
                  </button>

                  {/* Send to Others */}
                  <button
                    onClick={handleSendToOthers}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-alabaster rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-onyx rounded-lg flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm text-onyx">
                        Send to Others
                      </p>
                      <p className="text-xs text-warm-gray mt-0.5">
                        Select project participants
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-warm-gray transition-transform ${
                        showRecipientDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Recipient Dropdown */}
                  {showRecipientDropdown && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {recipients.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-warm-gray">
                          No contacts found. Add team members in Project Setup.
                        </p>
                      ) : (
                        <>
                          <div className="max-h-[250px] overflow-y-auto">
                            {recipients.map((r) => (
                              <button
                                key={r.email}
                                onClick={() => toggleRecipient(r.email)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${
                                  selectedRecipients.includes(r.email)
                                    ? "bg-accent-green/5"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    selectedRecipients.includes(r.email)
                                      ? "bg-onyx border-onyx"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedRecipients.includes(r.email) && (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                    >
                                      <path
                                        d="M2 6L5 9L10 3"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-onyx truncate">
                                    {r.name}
                                  </p>
                                  <p className="text-xs text-warm-gray truncate">
                                    {r.role} &middot; {r.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="px-4 py-3 bg-alabaster border-t border-gray-100">
                            <button
                              onClick={handleDeliverToRecipients}
                              disabled={selectedRecipients.length === 0}
                              className="w-full py-2.5 bg-onyx text-white rounded-lg font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
                            >
                              Send to {selectedRecipients.length} recipient
                              {selectedRecipients.length !== 1 ? "s" : ""}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Regenerate */}
                  <button
                    onClick={() => {
                      setGeneratedContent(null);
                      setDeliveryMode(null);
                      setSelectedRecipients([]);
                      setShowRecipientDropdown(false);
                    }}
                    className="w-full py-2.5 text-warm-gray text-sm font-medium hover:text-onyx transition-colors"
                  >
                    Regenerate Report
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {generatedContent?.startsWith("Error") && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{generatedContent}</p>
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="mt-2 text-sm font-medium text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
