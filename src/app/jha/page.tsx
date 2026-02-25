"use client";

import { useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import TaskSelector from "@/components/jha/TaskSelector";
import WeatherCrewInput from "@/components/jha/WeatherCrewInput";
import EquipmentSelector from "@/components/jha/EquipmentSelector";
import JHADisplay from "@/components/jha/JHADisplay";
import ToolboxTalkDisplay from "@/components/jha/ToolboxTalkDisplay";
import SignaturePad from "@/components/jha/SignaturePad";
import { useAppStore } from "@/lib/store";
import { db, generateId } from "@/lib/db";
import {
  generateMockJHA,
  generateMockToolboxTalk,
} from "@/lib/jha-prompts";
import type { SelectedTask, Signature } from "@/lib/types";
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

// JHA flow steps
const JHA_STEPS = [
  { id: "tasks", label: "Select Tasks" },
  { id: "weather", label: "Weather & Crew" },
  { id: "equipment", label: "Equipment" },
  { id: "generate", label: "Generate JHA" },
  { id: "review", label: "Review & Sign" },
] as const;

type JHAStep = (typeof JHA_STEPS)[number]["id"];

export default function JHAPage() {
  const { activeProject, currentDate, claudeApiKey } = useAppStore();

  // Flow state
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<JHAStep>("tasks");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Form data
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [weather, setWeather] = useState<{
    conditions: string;
    temperature: number;
    temperatureUnit: "F" | "C";
  }>({
    conditions: "Clear",
    temperature: 72,
    temperatureUnit: "F",
  });
  const [crewSize, setCrewSize] = useState(8);
  const [siteNotes, setSiteNotes] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    []
  );

  // Generated output
  const [generatedJHA, setGeneratedJHA] = useState("");
  const [generatedToolbox, setGeneratedToolbox] = useState("");
  const [signatures, setSignatures] = useState<Signature[]>([]);

  // Navigation helpers
  const stepIndex = JHA_STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case "tasks":
        return selectedTasks.length > 0;
      case "weather":
        return crewSize > 0;
      case "equipment":
        return true; // Equipment selection is optional
      case "generate":
        return generatedJHA.length > 0;
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedTasks, crewSize, generatedJHA]);

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < JHA_STEPS.length) {
      setCurrentStep(JHA_STEPS[nextIndex].id);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(JHA_STEPS[stepIndex - 1].id);
    }
  };

  // Generate JHA using Claude API or mock
  const handleGenerate = async () => {
    if (!activeProject) return;

    setIsGenerating(true);

    const selectedEquipment = activeProject.equipmentLibrary.filter((eq) =>
      selectedEquipmentIds.includes(eq.id)
    );

    if (claudeApiKey) {
      // Real Claude API call
      try {
        const response = await fetch("/api/jha/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: claudeApiKey,
            projectName: activeProject.name,
            date: currentDate,
            tasks: selectedTasks,
            weather,
            equipment: selectedEquipment,
            crewSize,
            siteNotes,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setGeneratedJHA(data.jha);
          setGeneratedToolbox(data.toolboxTalk);
        } else {
          // Fallback to mock on API error
          generateMockOutput();
        }
      } catch {
        generateMockOutput();
      }
    } else {
      // No API key — use mock
      generateMockOutput();
    }

    setIsGenerating(false);
    goNext(); // Move to review step
  };

  const generateMockOutput = () => {
    if (!activeProject) return;
    const jha = generateMockJHA(
      activeProject.name,
      currentDate,
      selectedTasks,
      { ...weather, notes: siteNotes },
      crewSize
    );
    const toolbox = generateMockToolboxTalk(selectedTasks, {
      ...weather,
      notes: siteNotes,
    });
    setGeneratedJHA(jha);
    setGeneratedToolbox(toolbox);
  };

  // Save completed JHA
  const handleSave = async () => {
    if (!activeProject) return;

    const jhaRecord = {
      id: generateId("jha"),
      projectId: activeProject.id,
      date: currentDate,
      createdBy: "tm-super", // TODO: Current user
      weather: { ...weather, notes: siteNotes },
      selectedTasks,
      equipmentInUse: selectedEquipmentIds.map((id) => ({ equipmentId: id })),
      generatedJHA,
      generatedToolboxTalk: generatedToolbox,
      signatures,
      status: signatures.length > 0 ? ("signed" as const) : ("active" as const),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.dailyJHAs.put(jhaRecord);
    setIsComplete(true);
  };

  // Add signature
  const handleAddSignature = (sig: Signature) => {
    setSignatures((prev) => [...prev, sig]);
  };

  // ---- Not yet creating: show landing ----
  if (!isCreating) {
    return (
      <AppShell>
        <div className="screen">
          <Header
            title="Morning JHA"
            subtitle="Job Hazard Analysis"
            backHref="/"
          />

          <div className="px-5 pt-6">
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary"
            >
              <ShieldCheck className="w-5 h-5" />
              Start Today&apos;s JHA
            </button>
          </div>

          <div className="mt-8">
            <EmptyState
              icon={<ShieldCheck size={48} />}
              title="No JHA Created Today"
              description="Select today's tasks to generate a tailored Job Hazard Analysis and Toolbox Talk."
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // ---- Completion screen ----
  if (isComplete) {
    return (
      <AppShell>
        <div className="screen">
          <Header title="JHA Complete" backHref="/" />

          <div className="flex flex-col items-center justify-center px-5 pt-16">
            <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent-green" />
            </div>
            <h2 className="font-heading text-2xl font-medium text-center mb-2">
              JHA Saved
            </h2>
            <p className="text-warm-gray text-center text-base mb-8">
              {selectedTasks.length} tasks analyzed
              {signatures.length > 0 &&
                ` · ${signatures.length} signature${signatures.length > 1 ? "s" : ""} collected`}
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsComplete(false);
                  setCurrentStep("tasks");
                  setSelectedTasks([]);
                  setGeneratedJHA("");
                  setGeneratedToolbox("");
                  setSignatures([]);
                }}
                className="btn-secondary"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ---- Active JHA creation flow ----
  return (
    <AppShell>
      <div className="screen">
        {/* Header with progress */}
        <div className="screen-header">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={stepIndex === 0 ? () => setIsCreating(false) : goBack}
              className="flex items-center gap-1 text-warm-gray text-sm active:text-onyx transition-colors"
            >
              {stepIndex === 0 ? (
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
            <h1 className="font-heading text-base font-medium">
              {JHA_STEPS[stepIndex].label}
            </h1>
            <span className="text-warm-gray text-sm">
              {stepIndex + 1}/{JHA_STEPS.length}
            </span>
          </div>
          <ProgressBar
            current={stepIndex}
            total={JHA_STEPS.length}
            labels={JHA_STEPS.map((s) => s.label)}
          />
        </div>

        {/* Step content */}
        <div className="px-5 pt-4 pb-32 animate-fade-in">
          {/* Step 1: Select Tasks */}
          {currentStep === "tasks" && activeProject && (
            <TaskSelector
              taktZones={activeProject.taktZones}
              selectedTasks={selectedTasks}
              onTasksChange={setSelectedTasks}
            />
          )}

          {/* Step 2: Weather & Crew */}
          {currentStep === "weather" && (
            <WeatherCrewInput
              weather={weather}
              crewSize={crewSize}
              siteNotes={siteNotes}
              onWeatherChange={setWeather}
              onCrewSizeChange={setCrewSize}
              onSiteNotesChange={setSiteNotes}
            />
          )}

          {/* Step 3: Equipment */}
          {currentStep === "equipment" && activeProject && (
            <EquipmentSelector
              availableEquipment={activeProject.equipmentLibrary}
              selectedIds={selectedEquipmentIds}
              onSelectionChange={setSelectedEquipmentIds}
            />
          )}

          {/* Step 4: Generate */}
          {currentStep === "generate" && (
            <div className="flex flex-col items-center pt-8">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-onyx animate-spin" />
                  <h2 className="font-heading text-xl font-medium">
                    Generating JHA...
                  </h2>
                  <p className="text-warm-gray text-center text-base">
                    Analyzing {selectedTasks.length} tasks against OSHA
                    standards and creating your Toolbox Talk.
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-onyx mx-auto mb-4" />
                    <h2 className="font-heading text-xl font-medium mb-2">
                      Ready to Generate
                    </h2>
                    <p className="text-warm-gray text-base">
                      {selectedTasks.length} task
                      {selectedTasks.length > 1 ? "s" : ""} selected ·{" "}
                      {crewSize} workers · {weather.conditions},{" "}
                      {weather.temperature}°{weather.temperatureUnit}
                    </p>
                  </div>

                  {/* Task summary */}
                  <div className="bg-glass rounded-xl p-4 space-y-2">
                    {selectedTasks.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-6 h-6 bg-accent-violet text-white rounded flex items-center justify-center text-xs flex-shrink-0">
                          {t.csiDivision}
                        </span>
                        <span className="flex-1 truncate">
                          {t.task}
                        </span>
                        <span className="text-warm-gray text-xs truncate max-w-[80px]">
                          {t.taktZone}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="btn-primary"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Generate JHA & Toolbox Talk
                  </button>

                  {!claudeApiKey && (
                    <p className="text-center text-warm-gray text-sm">
                      No API key configured — using demonstration output.
                      <br />
                      Add your key in Settings for AI-powered analysis.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Sign */}
          {currentStep === "review" && activeProject && (
            <div className="space-y-6">
              {/* Tab toggle: JHA / Toolbox Talk */}
              <ReviewTabs
                projectName={activeProject.name}
                date={currentDate}
                jhaContent={generatedJHA}
                toolboxContent={generatedToolbox}
              />

              {/* Signatures */}
              <SignaturePad
                signatures={signatures}
                onAddSignature={handleAddSignature}
              />
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        {currentStep !== "generate" && (
          <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-glass border-t border-gray-100 px-5 py-3 safe-bottom">
            {currentStep === "review" ? (
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                <CheckCircle2 className="w-5 h-5" />
                Save JHA
                {signatures.length > 0 &&
                  ` (${signatures.length} signature${signatures.length > 1 ? "s" : ""})`}
              </button>
            ) : (
              <button
                onClick={
                  currentStep === "equipment" ? () => setCurrentStep("generate") : goNext
                }
                disabled={!canProceed()}
                className="btn-primary"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ---- Review Tabs sub-component ----

function ReviewTabs({
  projectName,
  date,
  jhaContent,
  toolboxContent,
}: {
  projectName: string;
  date: string;
  jhaContent: string;
  toolboxContent: string;
}) {
  const [activeTab, setActiveTab] = useState<"jha" | "toolbox">("jha");

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("jha")}
          className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
            activeTab === "jha"
              ? "bg-accent-violet text-white"
              : "bg-glass text-onyx"
          }`}
        >
          JHA Document
        </button>
        <button
          onClick={() => setActiveTab("toolbox")}
          className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
            activeTab === "toolbox"
              ? "bg-accent-violet text-white"
              : "bg-glass text-onyx"
          }`}
        >
          Toolbox Talk
        </button>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "jha" ? (
          <JHADisplay
            projectName={projectName}
            date={date}
            htmlContent={jhaContent}
          />
        ) : (
          <ToolboxTalkDisplay
            projectName={projectName}
            date={date}
            htmlContent={toolboxContent}
          />
        )}
      </div>
    </div>
  );
}
