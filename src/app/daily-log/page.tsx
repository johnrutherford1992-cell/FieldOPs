"use client";

import { useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
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
import { useAppStore } from "@/lib/store";
import { db, generateId } from "@/lib/db";
import { deriveProductivityEntries } from "@/lib/productivity-engine";
import { recomputeAnalytics } from "@/lib/analytics-engine";
import { CSI_DIVISIONS } from "@/data/csi-divisions";
import { DAILY_LOG_SCREENS } from "@/lib/types";
import type {
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
  HeartPulse,
  Camera,
  Pencil,
} from "lucide-react";

// Map screen IDs to their icons
const SCREEN_ICONS: Record<DailyLogScreenId, React.ReactNode> = {
  weather: <Cloud size={18} />,
  manpower: <Users size={18} />,
  equipment: <Truck size={18} />,
  work: <Hammer size={18} />,
  rfis: <FileText size={18} />,
  inspections: <ClipboardCheck size={18} />,
  changes: <AlertTriangle size={18} />,
  conflicts: <ShieldAlert size={18} />,
  delays: <Clock size={18} />,
  safety: <HeartPulse size={18} />,
  photos: <Camera size={18} />,
  notes: <Pencil size={18} />,
};

export default function DailyLogPage() {
  const { activeProject, currentDate } = useAppStore();

  // Flow state
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<DailyLogScreenId>("weather");

  // ---- All 10 screen data states ----
  // Screen 1: Weather
  const [weather, setWeather] = useState<DailyLogWeather>({
    conditions: "Clear",
    temperature: 72,
    impact: "full_day",
  });

  // Screen 2: Manpower
  const [manpower, setManpower] = useState<ManpowerEntry[]>([]);

  // Screen 3: Equipment
  const [equipment, setEquipment] = useState<EquipmentEntry[]>([]);

  // Screen 4: Work Performed
  const [workPerformed, setWorkPerformed] = useState<WorkPerformedEntry[]>([]);

  // Screen 5: RFIs & Submittals
  const [rfis, setRFIs] = useState<RFIEntry[]>([]);
  const [submittals, setSubmittals] = useState<SubmittalEntry[]>([]);

  // Screen 6: Inspections
  const [inspections, setInspections] = useState<InspectionEntry[]>([]);

  // Screen 7: Changes
  const [changes, setChanges] = useState<ChangeEntry[]>([]);

  // Screen 8: Conflicts
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);

  // Screen 9: Delay Events (Phase 6)
  const [delayEvents, setDelayEvents] = useState<DelayEvent[]>([]);

  // Screen 10: Safety Incidents (Phase 6)
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);

  // Screen 11: Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // Screen 10: Notes
  const [notes, setNotes] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>([]);

  // ---- Navigation helpers ----
  const screenIndex = DAILY_LOG_SCREENS.findIndex((s) => s.id === currentScreen);

  const goNext = useCallback(() => {
    const nextIndex = screenIndex + 1;
    if (nextIndex < DAILY_LOG_SCREENS.length) {
      setCurrentScreen(DAILY_LOG_SCREENS[nextIndex].id);
    }
  }, [screenIndex]);

  const goBack = useCallback(() => {
    if (screenIndex > 0) {
      setCurrentScreen(DAILY_LOG_SCREENS[screenIndex - 1].id);
    }
  }, [screenIndex]);

  const isLastScreen = screenIndex === DAILY_LOG_SCREENS.length - 1;

  // ---- Screen jump (from progress bar) ----
  const handleScreenJump = (index: number) => {
    if (index >= 0 && index < DAILY_LOG_SCREENS.length) {
      setCurrentScreen(DAILY_LOG_SCREENS[index].id);
    }
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
        case "photos":
          return photos.length > 0 ? `${photos.length}` : undefined;
        case "notes":
          return notes.length > 0 || tomorrowPlan.length > 0 ? "✓" : undefined;
        default:
          return undefined;
      }
    },
    [weather, manpower, equipment, workPerformed, rfis, submittals, inspections, changes, conflicts, delayEvents, safetyIncidents, photos, notes, tomorrowPlan]
  );

  // ---- Save daily log ----
  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);

    try {
      const dailyLog = {
        id: generateId("log"),
        projectId: activeProject.id,
        date: currentDate,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.dailyLogs.put(dailyLog);

      // Auto-derive productivity entries and recompute analytics
      try {
        await deriveProductivityEntries(dailyLog, activeProject.id);
        // Recompute project-to-date analytics after new entries
        await recomputeAnalytics(activeProject.id);
      } catch (productivityErr) {
        console.error("Failed to derive productivity entries:", productivityErr);
        // Non-blocking — daily log still saved successfully
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
    setIsComplete(false);
    setCurrentScreen("weather");
    setWeather({ conditions: "Clear", temperature: 72, impact: "full_day" });
    setManpower([]);
    setEquipment([]);
    setWorkPerformed([]);
    setRFIs([]);
    setSubmittals([]);
    setInspections([]);
    setChanges([]);
    setConflicts([]);
    setDelayEvents([]);
    setSafetyIncidents([]);
    setPhotos([]);
    setNotes("");
    setTomorrowPlan([]);
  };

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

          <div className="px-5 pt-6">
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary"
            >
              <ClipboardList className="w-5 h-5" />
              Start Today&apos;s Log
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
                    setCurrentScreen(screen.id);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-alabaster rounded-lg text-left text-sm font-medium text-onyx active:scale-[0.98] transition-transform"
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
              title="No Log for Today"
              description="Record weather, manpower, equipment, work performed, and more."
            />
          </div>
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
              Daily Log Saved
            </h2>
            <p className="text-warm-gray text-center text-base mb-6">
              {currentDate}
            </p>

            {/* Summary stats */}
            <div className="w-full bg-alabaster rounded-xl p-4 space-y-2 mb-8">
              {totalWorkers > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Workers on site</span>
                  <span className="font-medium">{totalWorkers}</span>
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
            </div>

            <div className="w-full space-y-3">
              <button onClick={handleReset} className="btn-secondary">
                Back to Home
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
        {/* Header with progress */}
        <div className="screen-header">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={screenIndex === 0 ? () => setIsCreating(false) : goBack}
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
            <h1 className="font-heading text-base font-medium flex items-center gap-2">
              {SCREEN_ICONS[currentScreen]}
              {DAILY_LOG_SCREENS[screenIndex].label}
            </h1>
            <span className="text-warm-gray text-sm">
              {screenIndex + 1}/{DAILY_LOG_SCREENS.length}
            </span>
          </div>

          {/* Tappable progress dots */}
          <div className="flex gap-1 mb-1">
            {DAILY_LOG_SCREENS.map((screen, i) => {
              const badge = getScreenBadge(screen.id);
              return (
                <button
                  key={screen.id}
                  onClick={() => handleScreenJump(i)}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    i === screenIndex
                      ? "bg-onyx"
                      : i < screenIndex
                      ? badge
                        ? "bg-accent-green"
                        : "bg-warm-gray/40"
                      : "bg-gray-200"
                  }`}
                  title={screen.label}
                />
              );
            })}
          </div>
        </div>

        {/* Screen content */}
        <div className="px-5 pt-4 pb-32 animate-fade-in">
          {/* Screen 1: Weather */}
          {currentScreen === "weather" && activeProject && (
            <WeatherScreen
              weather={weather}
              onWeatherChange={setWeather}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {/* Screen 2: Manpower */}
          {currentScreen === "manpower" && activeProject && (
            <ManpowerScreen
              entries={manpower}
              onEntriesChange={setManpower}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {/* Screen 3: Equipment */}
          {currentScreen === "equipment" && activeProject && (
            <EquipmentScreen
              entries={equipment}
              onEntriesChange={setEquipment}
              availableEquipment={activeProject.equipmentLibrary}
            />
          )}

          {/* Screen 4: Work Performed */}
          {currentScreen === "work" && activeProject && (
            <WorkPerformedScreen
              entries={workPerformed}
              onEntriesChange={setWorkPerformed}
              taktZones={activeProject.taktZones}
            />
          )}

          {/* Screen 5: RFIs & Submittals */}
          {currentScreen === "rfis" && (
            <RFISubmittalScreen
              rfis={rfis}
              submittals={submittals}
              onRFIsChange={setRFIs}
              onSubmittalsChange={setSubmittals}
            />
          )}

          {/* Screen 6: Inspections */}
          {currentScreen === "inspections" && (
            <InspectionsScreen
              entries={inspections}
              onEntriesChange={setInspections}
            />
          )}

          {/* Screen 7: Changes */}
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

          {/* Screen 8: Conflicts */}
          {currentScreen === "conflicts" && activeProject && (
            <ConflictsScreen
              entries={conflicts}
              onEntriesChange={setConflicts}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {/* Screen 9: Delay Events */}
          {currentScreen === "delays" && activeProject && (
            <DelayEventsScreen
              entries={delayEvents}
              onEntriesChange={setDelayEvents}
              subcontractors={activeProject.subcontractors}
              taktZones={activeProject.taktZones}
            />
          )}

          {/* Screen 10: Safety Incidents */}
          {currentScreen === "safety" && activeProject && (
            <SafetyIncidentsScreen
              entries={safetyIncidents}
              onEntriesChange={setSafetyIncidents}
              taktZones={activeProject.taktZones}
              subcontractors={activeProject.subcontractors}
            />
          )}

          {/* Screen 11: Photos */}
          {currentScreen === "photos" && activeProject && (
            <PhotosScreen
              photos={photos}
              onPhotosChange={setPhotos}
              taktZones={activeProject.taktZones}
            />
          )}

          {/* Screen 10: Notes */}
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
        <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white border-t border-gray-100 px-5 py-3 safe-bottom">
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
                  Save Daily Log
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              {/* Skip button for optional screens */}
              <button
                onClick={goNext}
                className="flex-1 py-3 rounded-button text-warm-gray font-medium text-base bg-alabaster active:scale-[0.98] transition-transform"
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
