"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import ExportActionBar from "@/components/ui/ExportActionBar";
import WeatherScreen from "@/components/daily-log/WeatherScreen";
import ManpowerScreen from "@/components/daily-log/ManpowerScreen";
import EquipmentScreen from "@/components/daily-log/EquipmentScreen";
import WorkPerformedScreen from "@/components/daily-log/WorkPerformedScreen";
import RFISubmittalScreen from "@/components/daily-log/RFISubmittalScreen";
import InspectionsScreen from "@/components/daily-log/InspectionsScreen";
import ChangesScreen from "@/components/daily-log/ChangesScreen";
import ConflictsScreen from "@/components/daily-log/ConflictsScreen";
import DelayEventsScreen from "@/components/daily-log/DelayEventsScreen";
import SafetyIncidentsScreen from "@/components/daily-log/SafetyIncidentsScreen";
import PhotosScreen from "@/components/daily-log/PhotosScreen";
import NotesScreen from "@/components/daily-log/NotesScreen";
import TimeTrackingScreen from "@/components/daily-log/TimeTrackingScreen";
import MaterialsScreen from "@/components/daily-log/MaterialsScreen";
import QualityScreen from "@/components/daily-log/QualityScreen";
import { useAppStore } from "@/lib/store";
import { db, generateId, getCostCodesForProject, getDailyLogForDate } from "@/lib/db";
import { deriveProductivityEntries } from "@/lib/productivity-engine";
import { recomputeAnalytics } from "@/lib/analytics-engine";
import { CSI_DIVISIONS } from "@/data/csi-divisions";
import { DAILY_LOG_SCREENS } from "@/lib/types";
import type {
  DailyLog,
  DailyLogWeather,
  ManpowerEntry,
  EquipmentEntry,
  WorkPerformedEntry,
  RFIEntry,
  SubmittalEntry,
  InspectionEntry,
  ChangeEntry,
  ConflictEntry,
  DelayEvent,
  SafetyIncident,
  PhotoEntry,
  TimeEntry,
  CostCode,
  MaterialDelivery,
  CompletedChecklist,
  Deficiency,
  ChecklistTemplate,
  DailyLogScreenId,
} from "@/lib/types";
import {
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Cloud,
  Users,
  Truck,
  Hammer,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Timer,
  HeartPulse,
  Package,
  Camera,
  Pencil,
  Calendar,
  Edit3,
} from "lucide-react";

// Map screen IDs to their icons
const SCREEN_ICONS: Record<DailyLogScreenId, React.ReactNode> = {
  weather: <Cloud size={18} />,
  manpower: <Users size={18} />,
  time: <Timer size={18} />,
  equipment: <Truck size={18} />,
  work: <Hammer size={18} />,
  rfis: <FileText size={18} />,
  inspections: <ClipboardCheck size={18} />,
  changes: <AlertTriangle size={18} />,
  conflicts: <ShieldAlert size={18} />,
  delays: <Clock size={18} />,
  safety: <HeartPulse size={18} />,
  materials: <Package size={18} />,
  quality: <ClipboardCheck size={18} />,
  photos: <Camera size={18} />,
  notes: <Pencil size={18} />,
};

// Short labels for tab strip (to fit more on screen)
const SCREEN_SHORT_LABELS: Record<DailyLogScreenId, string> = {
  weather: "Weather",
  manpower: "Crew",
  time: "Time",
  equipment: "Equip",
  work: "Work",
  rfis: "RFIs",
  inspections: "Inspect",
  changes: "Changes",
  conflicts: "Conflicts",
  delays: "Delays",
  safety: "Safety",
  materials: "Materials",
  quality: "Quality",
  photos: "Photos",
  notes: "Notes",
};

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function DailyLogPage() {
  const { activeProject, currentDate, setCurrentDate } = useAppStore();

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [existingLog, setExistingLog] = useState<DailyLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLInputElement>(null);
  const today = getTodayISO();
  const isToday = selectedDate === today;

  // Flow state
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // editing an existing log
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<DailyLogScreenId>("weather");

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Tab strip ref for auto-scrolling
  const tabStripRef = useRef<HTMLDivElement>(null);

  // ---- All screen data states ----
  const [weather, setWeather] = useState<DailyLogWeather>({
    conditions: "Clear",
    temperature: 72,
    impact: "full_day",
  });
  const [manpower, setManpower] = useState<ManpowerEntry[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [equipment, setEquipment] = useState<EquipmentEntry[]>([]);
  const [workPerformed, setWorkPerformed] = useState<WorkPerformedEntry[]>([]);
  const [rfis, setRFIs] = useState<RFIEntry[]>([]);
  const [submittals, setSubmittals] = useState<SubmittalEntry[]>([]);
  const [inspections, setInspections] = useState<InspectionEntry[]>([]);
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [delayEvents, setDelayEvents] = useState<DelayEvent[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [materialDeliveries, setMaterialDeliveries] = useState<MaterialDelivery[]>([]);
  const [completedChecklists, setCompletedChecklists] = useState<CompletedChecklist[]>([]);
  const [qualityDeficiencies, setQualityDeficiencies] = useState<Deficiency[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>([]);

  // ---- Load existing log when date changes ----
  useEffect(() => {
    if (!activeProject) return;
    setIsLoadingLog(true);
    getDailyLogForDate(activeProject.id, selectedDate)
      .then((log) => {
        setExistingLog(log || null);
      })
      .catch(() => setExistingLog(null))
      .finally(() => setIsLoadingLog(false));
  }, [activeProject, selectedDate]);

  // ---- Load cost codes for time tracking ----
  useEffect(() => {
    if (activeProject) {
      getCostCodesForProject(activeProject.id).then(setCostCodes);
    }
  }, [activeProject]);

  // ---- Load checklist templates for quality screen ----
  useEffect(() => {
    if (activeProject) {
      db.checklistTemplates
        .where("projectId")
        .equals(activeProject.id)
        .toArray()
        .then(setChecklistTemplates)
        .catch((err: unknown) => console.error("Failed to load checklist templates:", err));
    }
  }, [activeProject]);

  // ---- Scroll progress tracking ----
  useEffect(() => {
    if (!isCreating && !isEditing) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCreating, isEditing]);

  // ---- Auto-scroll tab strip to active tab ----
  useEffect(() => {
    if (!tabStripRef.current) return;
    const activeTab = tabStripRef.current.querySelector("[data-active=\"true\"]");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentScreen]);

  // ---- Navigation helpers ----
  const screenIndex = DAILY_LOG_SCREENS.findIndex((s) => s.id === currentScreen);

  const goNext = useCallback(() => {
    const nextIndex = screenIndex + 1;
    if (nextIndex < DAILY_LOG_SCREENS.length) {
      setCurrentScreen(DAILY_LOG_SCREENS[nextIndex].id);
      window.scrollTo({ top: 0 });
    }
  }, [screenIndex]);

  const goBack = useCallback(() => {
    if (screenIndex > 0) {
      setCurrentScreen(DAILY_LOG_SCREENS[screenIndex - 1].id);
      window.scrollTo({ top: 0 });
    }
  }, [screenIndex]);

  const isLastScreen = screenIndex === DAILY_LOG_SCREENS.length - 1;

  const handleScreenJump = (index: number) => {
    if (index >= 0 && index < DAILY_LOG_SCREENS.length) {
      setCurrentScreen(DAILY_LOG_SCREENS[index].id);
      window.scrollTo({ top: 0 });
    }
  };

  // ---- Date navigation ----
  const handleDateChange = (newDate: string) => {
    if (newDate > today) return; // Can't navigate to future
    setSelectedDate(newDate);
    setCurrentDate(newDate);
    // Reset flow state when changing dates
    setIsCreating(false);
    setIsEditing(false);
    setIsComplete(false);
    setCurrentScreen("weather");
  };

  const goToPreviousDay = () => handleDateChange(shiftDate(selectedDate, -1));
  const goToNextDay = () => {
    const next = shiftDate(selectedDate, 1);
    if (next <= today) handleDateChange(next);
  };

  // ---- Populate form from existing log ----
  const populateFromLog = useCallback((log: DailyLog) => {
    setWeather(log.weather);
    setManpower(log.manpower || []);
    setEquipment(log.equipment || []);
    setWorkPerformed(log.workPerformed || []);
    setRFIs(log.rfis || []);
    setSubmittals(log.submittals || []);
    setInspections(log.inspections || []);
    setChanges(log.changes || []);
    setConflicts(log.conflicts || []);
    setDelayEvents(log.delayEvents || []);
    setSafetyIncidents(log.safetyIncidents || []);
    setPhotos(log.photos || []);
    setNotes(log.notes || "");
    setTomorrowPlan(log.tomorrowPlan || []);
  }, []);

  const handleEditExisting = () => {
    if (!existingLog) return;
    populateFromLog(existingLog);
    setIsEditing(true);
    setIsCreating(true);
  };

  // ---- Data summary for each screen (badge counts) ----
  const getScreenBadge = useCallback(
    (screenId: DailyLogScreenId): string | undefined => {
      switch (screenId) {
        case "weather":
          return weather.conditions !== "Clear" || weather.impact !== "full_day"
            ? "!"
            : undefined;
        case "manpower": {
          const total = manpower.reduce(
            (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
            0
          );
          return total > 0 ? `${total}` : undefined;
        }
        case "time": {
          const totalTimeHrs = timeEntries.reduce((s, e) => s + e.totalHours, 0);
          return timeEntries.length > 0 ? `${totalTimeHrs.toFixed(0)}h` : undefined;
        }
        case "equipment":
          return equipment.length > 0 ? `${equipment.length}` : undefined;
        case "work":
          return workPerformed.length > 0 ? `${workPerformed.length}` : undefined;
        case "rfis":
          return rfis.length + submittals.length > 0
            ? `${rfis.length + submittals.length}`
            : undefined;
        case "inspections":
          return inspections.length > 0 ? `${inspections.length}` : undefined;
        case "changes":
          return changes.length > 0 ? `${changes.length}` : undefined;
        case "conflicts":
          return conflicts.length > 0 ? `${conflicts.length}` : undefined;
        case "delays":
          return delayEvents.length > 0 ? `${delayEvents.length}` : undefined;
        case "safety":
          return safetyIncidents.length > 0 ? `${safetyIncidents.length}` : undefined;
        case "materials":
          return materialDeliveries.length > 0 ? `${materialDeliveries.length}` : undefined;
        case "quality": {
          const total = completedChecklists.length + qualityDeficiencies.length;
          return total > 0 ? `${total}` : undefined;
        }
        case "photos":
          return photos.length > 0 ? `${photos.length}` : undefined;
        case "notes":
          return notes.length > 0 || tomorrowPlan.length > 0 ? "✓" : undefined;
        default:
          return undefined;
      }
    },
    [weather, manpower, timeEntries, equipment, workPerformed, rfis, submittals, inspections, changes, conflicts, delayEvents, safetyIncidents, materialDeliveries, completedChecklists, qualityDeficiencies, photos, notes, tomorrowPlan]
  );

  // ---- Get summary for read-only view of an existing log ----
  const getLogSummary = (log: DailyLog) => {
    const totalWorkers = (log.manpower || []).reduce(
      (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
      0
    );
    const sections: { label: string; value: string; icon: React.ReactNode }[] = [];

    sections.push({
      label: "Weather",
      value: `${log.weather.conditions}, ${log.weather.temperature}°F`,
      icon: <Cloud size={16} className="text-warm-gray" />,
    });

    if (totalWorkers > 0) {
      sections.push({
        label: "Manpower",
        value: `${totalWorkers} workers`,
        icon: <Users size={16} className="text-warm-gray" />,
      });
    }
    if ((log.equipment || []).length > 0) {
      sections.push({
        label: "Equipment",
        value: `${log.equipment.length} pieces`,
        icon: <Truck size={16} className="text-warm-gray" />,
      });
    }
    if ((log.workPerformed || []).length > 0) {
      sections.push({
        label: "Work Performed",
        value: `${log.workPerformed.length} items`,
        icon: <Hammer size={16} className="text-warm-gray" />,
      });
    }
    if ((log.rfis || []).length + (log.submittals || []).length > 0) {
      sections.push({
        label: "RFIs / Submittals",
        value: `${log.rfis.length} / ${log.submittals.length}`,
        icon: <FileText size={16} className="text-warm-gray" />,
      });
    }
    if ((log.inspections || []).length > 0) {
      sections.push({
        label: "Inspections",
        value: `${log.inspections.length}`,
        icon: <ClipboardCheck size={16} className="text-warm-gray" />,
      });
    }
    if ((log.changes || []).length > 0) {
      sections.push({
        label: "Changes",
        value: `${log.changes.length}`,
        icon: <AlertTriangle size={16} className="text-warm-gray" />,
      });
    }
    if ((log.conflicts || []).length > 0) {
      sections.push({
        label: "Conflicts",
        value: `${log.conflicts.length}`,
        icon: <ShieldAlert size={16} className="text-warm-gray" />,
      });
    }
    if ((log.delayEvents || []).length > 0) {
      sections.push({
        label: "Delays",
        value: `${log.delayEvents!.length}`,
        icon: <Clock size={16} className="text-warm-gray" />,
      });
    }
    if ((log.safetyIncidents || []).length > 0) {
      sections.push({
        label: "Safety",
        value: `${log.safetyIncidents!.length}`,
        icon: <HeartPulse size={16} className="text-warm-gray" />,
      });
    }
    if ((log.photos || []).length > 0) {
      sections.push({
        label: "Photos",
        value: `${log.photos.length}`,
        icon: <Camera size={16} className="text-warm-gray" />,
      });
    }
    if (log.notes) {
      sections.push({
        label: "Notes",
        value: log.notes.length > 50 ? log.notes.slice(0, 50) + "..." : log.notes,
        icon: <Pencil size={16} className="text-warm-gray" />,
      });
    }

    return sections;
  };

  // ---- Save daily log ----
  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);

    try {
      const dailyLog = {
        id: isEditing && existingLog ? existingLog.id : generateId("log"),
        projectId: activeProject.id,
        date: selectedDate,
        superintendentId: "tm-super",
        weather,
        manpower,
        equipment,
        workPerformed,
        rfis,
        submittals,
        inspections,
        changes,
        conflicts,
        photos,
        notes,
        tomorrowPlan,
        delayEvents: delayEvents.length > 0 ? delayEvents : undefined,
        safetyIncidents: safetyIncidents.length > 0 ? safetyIncidents : undefined,
        createdAt: isEditing && existingLog ? existingLog.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.dailyLogs.put(dailyLog);

      if (timeEntries.length > 0) {
        const linkedTimeEntries = timeEntries.map((te) => ({
          ...te,
          dailyLogId: dailyLog.id,
        }));
        await db.timeEntries.bulkPut(linkedTimeEntries);
      }

      if (materialDeliveries.length > 0) {
        const linkedDeliveries = materialDeliveries.map((d) => ({
          ...d,
          dailyLogId: dailyLog.id,
        }));
        await db.materialDeliveries.bulkPut(linkedDeliveries);
      }

      if (completedChecklists.length > 0) {
        const linkedChecklists = completedChecklists.map((c) => ({
          ...c,
          dailyLogId: dailyLog.id,
        }));
        await db.completedChecklists.bulkPut(linkedChecklists);
      }
      if (qualityDeficiencies.length > 0) {
        await db.deficiencies.bulkPut(qualityDeficiencies);
      }

      try {
        await deriveProductivityEntries(dailyLog, activeProject.id);
        await recomputeAnalytics(activeProject.id);
      } catch (productivityErr) {
        console.error("Failed to derive productivity entries:", productivityErr);
      }

      setIsComplete(true);
    } catch (err) {
      console.error("Failed to save daily log:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Reset all state ----
  const handleReset = () => {
    setIsCreating(false);
    setIsEditing(false);
    setIsComplete(false);
    setCurrentScreen("weather");
    setWeather({ conditions: "Clear", temperature: 72, impact: "full_day" });
    setManpower([]);
    setTimeEntries([]);
    setEquipment([]);
    setWorkPerformed([]);
    setRFIs([]);
    setSubmittals([]);
    setInspections([]);
    setChanges([]);
    setConflicts([]);
    setDelayEvents([]);
    setSafetyIncidents([]);
    setMaterialDeliveries([]);
    setCompletedChecklists([]);
    setQualityDeficiencies([]);
    setPhotos([]);
    setNotes("");
    setTomorrowPlan([]);
    // Reload existing log for current date
    if (activeProject) {
      getDailyLogForDate(activeProject.id, selectedDate)
        .then((log) => setExistingLog(log || null))
        .catch(() => setExistingLog(null));
    }
  };

  // ============================================================
  // RENDER: Date navigation bar (shared between landing states)
  // ============================================================
  const DateNavBar = () => (
    <div className="flex items-center justify-center gap-3 py-3 px-5">
      <button
        onClick={goToPreviousDay}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 active:bg-gray-100 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} className="text-onyx" />
      </button>

      <button
        onClick={() => {
          setShowCalendar(true);
          setTimeout(() => calendarRef.current?.showPicker?.(), 50);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 active:bg-gray-100 transition-colors min-w-[160px] justify-center"
      >
        <Calendar size={16} className="text-warm-gray" />
        <span className="font-heading font-medium text-base">
          {formatDateDisplay(selectedDate)}
        </span>
        {isToday && (
          <span className="text-xs bg-accent-green/10 text-accent-green px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
      </button>

      <input
        ref={calendarRef}
        type="date"
        value={selectedDate}
        max={today}
        onChange={(e) => {
          if (e.target.value) handleDateChange(e.target.value);
          setShowCalendar(false);
        }}
        onBlur={() => setShowCalendar(false)}
        className={`absolute opacity-0 pointer-events-none w-0 h-0 ${showCalendar ? "" : "hidden"}`}
        tabIndex={-1}
      />

      <button
        onClick={goToNextDay}
        disabled={selectedDate >= today}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-30 disabled:active:bg-gray-50"
        aria-label="Next day"
      >
        <ChevronRight size={20} className="text-onyx" />
      </button>
    </div>
  );

  // ============================================================
  // RENDER: Landing state (no log started)
  // ============================================================
  if (!isCreating) {
    return (
      <AppShell>
        <div className="screen">
          <Header
            title="Daily Log"
            subtitle="Superintendent Diary"
            backHref="/"
          />

          {/* Date navigation */}
          <DateNavBar />

          {isLoadingLog ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-warm-gray" />
            </div>
          ) : existingLog ? (
            /* ---- Read-only view of existing log ---- */
            <div className="px-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-accent-green" />
                <span className="font-heading font-medium text-base">
                  Log Recorded
                </span>
                <span className="text-warm-gray text-sm ml-auto">
                  {new Date(existingLog.updatedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Summary cards */}
              <div className="space-y-2 mb-6">
                {getLogSummary(existingLog).map((section) => (
                  <div
                    key={section.label}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg"
                  >
                    {section.icon}
                    <span className="text-sm font-medium text-slate flex-1">
                      {section.label}
                    </span>
                    <span className="text-sm text-warm-gray">
                      {section.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Edit button */}
              <button
                onClick={handleEditExisting}
                className="btn-secondary"
              >
                <Edit3 className="w-5 h-5" />
                Edit This Log
              </button>

              {/* Export & Email */}
              {activeProject && (
                <ExportActionBar
                  onExportPdf={async () => {
                    if (!existingLog || !activeProject) return;
                    const { exportPdf } = await import("@/lib/pdf/generate-pdf");
                    await exportPdf("daily-log", {
                      log: existingLog,
                      project: activeProject,
                    }, `daily-log-${existingLog.date}.pdf`);
                  }}
                  onEmailSelf={() => {
                    if (!existingLog || !activeProject) return;
                    import("@/lib/email/mailto").then(({ openMailto, getDailyLogEmailContent }) => {
                      const { subject, body } = getDailyLogEmailContent(activeProject, existingLog);
                      openMailto({ subject, body });
                    });
                  }}
                />
              )}
            </div>
          ) : (
            /* ---- No log for this date ---- */
            <>
              <div className="px-5 pt-2">
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setIsEditing(false);
                  }}
                  className="btn-primary"
                >
                  <ClipboardList className="w-5 h-5" />
                  {isToday ? "Start Today's Log" : `Start Log for ${formatDateDisplay(selectedDate)}`}
                </button>
              </div>

              {/* Quick screen jump grid */}
              <div className="px-5 pt-6">
                <p className="text-warm-gray text-sm mb-3">or jump to a section:</p>
                <div className="grid grid-cols-2 gap-2">
                  {DAILY_LOG_SCREENS.map((screen) => (
                    <button
                      key={screen.id}
                      onClick={() => {
                        setIsCreating(true);
                        setIsEditing(false);
                        setCurrentScreen(screen.id);
                      }}
                      className="flex items-center gap-2 px-4 py-3 bg-glass rounded-lg text-left text-sm font-medium text-onyx active:scale-[0.98] transition-transform"
                    >
                      {SCREEN_ICONS[screen.id]}
                      {screen.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <EmptyState
                  icon={<ClipboardList size={48} />}
                  title={isToday ? "No Log for Today" : `No Log for ${formatDateDisplay(selectedDate)}`}
                  description="Record weather, manpower, equipment, work performed, and more."
                />
              </div>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // ============================================================
  // RENDER: Completion state
  // ============================================================
  if (isComplete) {
    const totalWorkers = manpower.reduce(
      (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
      0
    );

    return (
      <AppShell>
        <div className="screen">
          <Header title="Log Complete" backHref="/" />

          <div className="flex flex-col items-center justify-center px-5 pt-16">
            <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent-green" />
            </div>
            <h2 className="font-heading text-2xl font-medium text-center mb-2">
              Daily Log {isEditing ? "Updated" : "Saved"}
            </h2>
            <p className="text-warm-gray text-center text-base mb-6">
              {formatDateDisplay(selectedDate)}
            </p>

            {/* Summary stats */}
            <div className="w-full bg-glass rounded-xl p-4 space-y-2 mb-8">
              {totalWorkers > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Workers on site</span>
                  <span className="font-medium">{totalWorkers}</span>
                </div>
              )}
              {timeEntries.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Time tracked</span>
                  <span className="font-medium">
                    {timeEntries.reduce((s, e) => s + e.totalHours, 0).toFixed(1)} hrs ({timeEntries.length} workers)
                  </span>
                </div>
              )}
              {equipment.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Equipment used</span>
                  <span className="font-medium">{equipment.length}</span>
                </div>
              )}
              {workPerformed.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Work items</span>
                  <span className="font-medium">{workPerformed.length}</span>
                </div>
              )}
              {rfis.length + submittals.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">RFIs / Submittals</span>
                  <span className="font-medium">
                    {rfis.length} / {submittals.length}
                  </span>
                </div>
              )}
              {photos.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Photos</span>
                  <span className="font-medium">{photos.length}</span>
                </div>
              )}
              {conflicts.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Issues reported</span>
                  <span className="font-medium text-accent-red">{conflicts.length}</span>
                </div>
              )}
              {delayEvents.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Delay events</span>
                  <span className="font-medium text-amber-600">{delayEvents.length}</span>
                </div>
              )}
              {safetyIncidents.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Safety incidents</span>
                  <span className="font-medium text-accent-red">{safetyIncidents.length}</span>
                </div>
              )}
              {materialDeliveries.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Material deliveries</span>
                  <span className="font-medium">{materialDeliveries.length}</span>
                </div>
              )}
              {completedChecklists.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Quality inspections</span>
                  <span className="font-medium">{completedChecklists.length}</span>
                </div>
              )}
              {qualityDeficiencies.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Deficiencies logged</span>
                  <span className="font-medium text-accent-red">{qualityDeficiencies.length}</span>
                </div>
              )}
            </div>

            {/* Export & Email */}
            {activeProject && (
              <div className="w-full">
                <ExportActionBar
                  onExportPdf={async () => {
                    if (!activeProject) return;
                    const { exportPdf } = await import("@/lib/pdf/generate-pdf");
                    const log = {
                      id: "", projectId: activeProject.id, date: selectedDate,
                      superintendentId: "", weather, manpower, equipment,
                      workPerformed, rfis, submittals, inspections, changes,
                      conflicts, photos, notes, tomorrowPlan,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      delayEvents, safetyIncidents,
                    };
                    await exportPdf("daily-log", { log, project: activeProject }, `daily-log-${selectedDate}.pdf`);
                  }}
                  onEmailSelf={() => {
                    if (!activeProject) return;
                    import("@/lib/email/mailto").then(({ openMailto, getDailyLogEmailContent }) => {
                      const log = {
                        id: "", projectId: activeProject.id, date: selectedDate,
                        superintendentId: "", weather, manpower, equipment,
                        workPerformed, rfis, submittals, inspections, changes,
                        conflicts, photos, notes, tomorrowPlan,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        delayEvents, safetyIncidents,
                      };
                      const { subject, body } = getDailyLogEmailContent(activeProject, log);
                      openMailto({ subject, body });
                    });
                  }}
                />
              </div>
            )}

            <div className="w-full space-y-3 mt-4">
              <button onClick={handleReset} className="btn-secondary">
                Back to Daily Log
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ============================================================
  // RENDER: Active log entry flow
  // ============================================================
  return (
    <AppShell>
      <div className="screen">
        {/* Fixed header with progress */}
        <div className="screen-header-fixed">
          {/* Scroll progress bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100">
            <div
              className="h-full bg-accent-green transition-all duration-150 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          {/* Top row: back, date, counter */}
          <div className="flex items-center justify-between mb-2 pt-1">
            <button
              onClick={screenIndex === 0 ? () => { setIsCreating(false); setIsEditing(false); } : goBack}
              className="flex items-center gap-1 text-warm-gray text-sm active:text-onyx transition-colors"
            >
              {screenIndex === 0 ? (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </>
              )}
            </button>
            <span className="font-heading text-xs text-warm-gray">
              {formatDateDisplay(selectedDate)}
              {isEditing && " (editing)"}
            </span>
            <span className="text-warm-gray text-sm">
              {screenIndex + 1}/{DAILY_LOG_SCREENS.length}
            </span>
          </div>

          {/* Tab strip — horizontally scrollable with icons + labels */}
          <div
            ref={tabStripRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1"
          >
            {DAILY_LOG_SCREENS.map((screen, i) => {
              const isActive = i === screenIndex;
              const badge = getScreenBadge(screen.id);
              const hasData = i < screenIndex && !!badge;

              return (
                <button
                  key={screen.id}
                  data-active={isActive}
                  onClick={() => handleScreenJump(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? "bg-onyx text-white"
                      : hasData
                      ? "bg-accent-green/10 text-accent-green"
                      : "bg-gray-100 text-warm-gray"
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
                    {SCREEN_ICONS[screen.id]}
                  </span>
                  {SCREEN_SHORT_LABELS[screen.id]}
                  {badge && !isActive && (
                    <span className="ml-0.5 text-[10px] opacity-75">({badge})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div style={{ height: "110px" }} />

        {/* Screen content */}
        <div className="px-5 pt-4 pb-32 animate-fade-in">
          {currentScreen === "weather" && activeProject && (
            <WeatherScreen
              weather={weather}
              onWeatherChange={setWeather}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {currentScreen === "manpower" && activeProject && (
            <ManpowerScreen
              entries={manpower}
              onEntriesChange={setManpower}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {currentScreen === "time" && activeProject && (
            <TimeTrackingScreen
              entries={timeEntries}
              onEntriesChange={setTimeEntries}
              manpower={manpower}
              subcontractors={activeProject.subcontractors}
              costCodes={costCodes}
              projectId={activeProject.id}
              date={selectedDate}
            />
          )}

          {currentScreen === "equipment" && activeProject && (
            <EquipmentScreen
              entries={equipment}
              onEntriesChange={setEquipment}
              availableEquipment={activeProject.equipmentLibrary}
            />
          )}

          {currentScreen === "work" && activeProject && (
            <WorkPerformedScreen
              entries={workPerformed}
              onEntriesChange={setWorkPerformed}
            />
          )}

          {currentScreen === "rfis" && (
            <RFISubmittalScreen
              rfis={rfis}
              submittals={submittals}
              onRFIsChange={setRFIs}
              onSubmittalsChange={setSubmittals}
            />
          )}

          {currentScreen === "inspections" && (
            <InspectionsScreen
              entries={inspections}
              onEntriesChange={setInspections}
            />
          )}

          {currentScreen === "changes" && (
            <ChangesScreen
              entries={changes}
              onEntriesChange={setChanges}
              csiDivisions={CSI_DIVISIONS.map((d) => ({
                code: d.code,
                name: d.name,
              }))}
            />
          )}

          {currentScreen === "conflicts" && activeProject && (
            <ConflictsScreen
              entries={conflicts}
              onEntriesChange={setConflicts}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {currentScreen === "delays" && activeProject && (
            <DelayEventsScreen
              entries={delayEvents}
              onEntriesChange={setDelayEvents}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {currentScreen === "safety" && activeProject && (
            <SafetyIncidentsScreen
              entries={safetyIncidents}
              onEntriesChange={setSafetyIncidents}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {currentScreen === "materials" && activeProject && (
            <MaterialsScreen
              deliveries={materialDeliveries}
              onDeliveriesChange={setMaterialDeliveries}
              projectId={activeProject.id}
              date={selectedDate}
            />
          )}

          {currentScreen === "quality" && activeProject && (
            <QualityScreen
              checklists={completedChecklists}
              onChecklistsChange={setCompletedChecklists}
              deficiencies={qualityDeficiencies}
              onDeficienciesChange={setQualityDeficiencies}
              templates={checklistTemplates}
              projectId={activeProject.id}
              date={selectedDate}
            />
          )}

          {currentScreen === "photos" && activeProject && (
            <PhotosScreen
              photos={photos}
              onPhotosChange={setPhotos}
            />
          )}

          {currentScreen === "notes" && (
            <NotesScreen
              notes={notes}
              tomorrowPlan={tomorrowPlan}
              onNotesChange={setNotes}
              onTomorrowPlanChange={setTomorrowPlan}
            />
          )}
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-glass border-t border-gray-100 px-5 py-3 safe-bottom">
          {isLastScreen ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {isEditing ? "Update Daily Log" : "Save Daily Log"}
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={goNext}
                className="flex-1 py-3 rounded-button text-warm-gray font-medium text-base bg-glass active:scale-[0.98] transition-transform"
              >
                Skip
              </button>
              <button
                onClick={goNext}
                className="flex-[2] btn-primary"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
