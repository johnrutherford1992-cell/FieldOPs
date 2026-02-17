"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ClipboardCheck,
  Plus,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Camera,
  Shield,
  Star,
} from "lucide-react";
import { generateId } from "@/lib/db";
import type {
  CompletedChecklist,
  ChecklistResponse,
  Deficiency,
  DeficiencySeverity,
  DeficiencyStatus,
  ChecklistTemplate,
  TaktZone,
} from "@/lib/types";

interface QualityScreenProps {
  checklists: CompletedChecklist[];
  onChecklistsChange: (checklists: CompletedChecklist[]) => void;
  deficiencies: Deficiency[];
  onDeficienciesChange: (deficiencies: Deficiency[]) => void;
  templates: ChecklistTemplate[];
  taktZones: TaktZone[];
  projectId: string;
  date: string;
}

const SEVERITY_COLORS: Record<DeficiencySeverity, string> = {
  minor: "bg-accent-amber/10 text-accent-amber",
  major: "bg-accent-red/10 text-accent-red",
  critical: "bg-accent-red text-white",
  life_safety: "bg-accent-red text-white",
};

export default function QualityScreen({
  checklists,
  onChecklistsChange,
  deficiencies,
  onDeficienciesChange,
  templates,
  taktZones,
  projectId,
  date,
}: QualityScreenProps) {
  const [activeTab, setActiveTab] = useState<"inspections" | "deficiencies">("inspections");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDeficiencyForm, setShowDeficiencyForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Deficiency form state
  const [defDesc, setDefDesc] = useState("");
  const [defSeverity, setDefSeverity] = useState<DeficiencySeverity>("minor");
  const [defZone, setDefZone] = useState("");
  const [defParty, setDefParty] = useState("");

  // Summary
  const summary = useMemo(() => ({
    inspections: checklists.length,
    completed: checklists.filter((c) => c.status === "completed").length,
    avgScore: checklists.length > 0
      ? Math.round(checklists.reduce((s, c) => s + (c.overallScore || 0), 0) / checklists.length)
      : 0,
    openDeficiencies: deficiencies.filter((d) => d.status === "open" || d.status === "in_progress").length,
  }), [checklists, deficiencies]);

  // Start a checklist from template
  const handleStartChecklist = useCallback((template: ChecklistTemplate) => {
    const responses: ChecklistResponse[] = [];
    template.sections.forEach((section) => {
      section.items.forEach((item) => {
        responses.push({
          itemId: item.id,
          question: item.question,
          responseType: item.responseType,
          value: item.responseType === "pass_fail" ? "pass" : item.responseType === "yes_no" ? true : "",
          passed: true,
        });
      });
    });

    const checklist: CompletedChecklist = {
      id: generateId("qc"),
      projectId,
      templateId: template.id,
      templateName: template.name,
      date,
      inspectorName: "Superintendent",
      inspectorRole: "superintendent",
      responses,
      overallScore: 100,
      passRate: 100,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onChecklistsChange([...checklists, checklist]);
    setShowTemplateSelector(false);
    setExpandedId(checklist.id);
  }, [checklists, onChecklistsChange, projectId, date]);

  // Update a checklist response
  const updateResponse = useCallback((checklistId: string, itemId: string, value: string | number | boolean, passed: boolean) => {
    onChecklistsChange(
      checklists.map((cl) => {
        if (cl.id !== checklistId) return cl;
        const responses = cl.responses.map((r) =>
          r.itemId === itemId ? { ...r, value, passed } : r
        );
        const passedCount = responses.filter((r) => r.passed).length;
        const passRate = Math.round((passedCount / responses.length) * 100);
        return {
          ...cl,
          responses,
          passRate,
          overallScore: passRate,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [checklists, onChecklistsChange]);

  // Complete a checklist
  const completeChecklist = useCallback((id: string) => {
    onChecklistsChange(
      checklists.map((cl) =>
        cl.id === id
          ? { ...cl, status: "completed" as const, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : cl
      )
    );
  }, [checklists, onChecklistsChange]);

  // Add deficiency
  const handleAddDeficiency = useCallback(() => {
    if (!defDesc) return;
    const deficiency: Deficiency = {
      id: generateId("def"),
      projectId,
      date,
      severity: defSeverity,
      status: "open",
      description: defDesc,
      taktZone: defZone || undefined,
      responsibleParty: defParty || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onDeficienciesChange([...deficiencies, deficiency]);
    setShowDeficiencyForm(false);
    setDefDesc("");
    setDefSeverity("minor");
    setDefZone("");
    setDefParty("");
  }, [defDesc, defSeverity, defZone, defParty, deficiencies, onDeficienciesChange, projectId, date]);

  // Remove deficiency
  const removeDeficiency = useCallback((id: string) => {
    onDeficienciesChange(deficiencies.filter((d) => d.id !== id));
  }, [deficiencies, onDeficienciesChange]);

  return (
    <div className="flex flex-col h-full bg-alabaster">
      {/* Summary Bar */}
      <div className="bg-gradient-violet text-white px-4 py-4 rounded-card shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-alabaster" />
            <div>
              <p className="text-field-sm text-alabaster/80 font-body">Quality Score</p>
              <p className="text-field-3xl font-heading font-semibold">
                {summary.avgScore > 0 ? `${summary.avgScore}%` : "—"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-field-sm text-alabaster/80">
              {summary.inspections} inspections
            </p>
            {summary.openDeficiencies > 0 && (
              <p className="text-field-xs text-accent-amber">
                {summary.openDeficiencies} open deficiencies
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        <button
          onClick={() => setActiveTab("inspections")}
          className={`flex-1 py-2 rounded-button text-field-sm font-semibold transition-all ${
            activeTab === "inspections" ? "bg-accent-violet text-white" : "bg-glass text-warm-gray"
          }`}
        >
          Inspections ({checklists.length})
        </button>
        <button
          onClick={() => setActiveTab("deficiencies")}
          className={`flex-1 py-2 rounded-button text-field-sm font-semibold transition-all ${
            activeTab === "deficiencies" ? "bg-accent-violet text-white" : "bg-glass text-warm-gray"
          }`}
        >
          Deficiencies ({deficiencies.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20">
        {activeTab === "inspections" && (
          <>
            {checklists.map((cl) => {
              const isExpanded = expandedId === cl.id;
              return (
                <div key={cl.id} className="bg-glass rounded-xl shadow-glass-card border border-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : cl.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
                  >
                    <ClipboardCheck size={20} className={cl.status === "completed" ? "text-accent-teal" : "text-accent-amber"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-field-base font-heading font-semibold text-onyx truncate">{cl.templateName}</p>
                      <p className="text-field-xs text-warm-gray">{cl.responses.length} items · {cl.status}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-field-lg font-heading font-semibold ${
                        (cl.overallScore || 0) >= 90 ? "text-accent-teal" : (cl.overallScore || 0) >= 70 ? "text-accent-amber" : "text-accent-red"
                      }`}>
                        {cl.overallScore || 0}%
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-2 animate-fade-in">
                      {cl.responses.map((resp) => (
                        <div key={resp.itemId} className="flex items-center gap-3 bg-glass-medium rounded-button px-3 py-2">
                          <button
                            onClick={() => updateResponse(cl.id, resp.itemId, resp.passed ? "fail" : "pass", !resp.passed)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              resp.passed ? "bg-accent-teal text-white" : "bg-accent-red/15 text-accent-red"
                            }`}
                          >
                            {resp.passed ? <Check size={14} /> : <X size={14} />}
                          </button>
                          <span className="text-field-sm text-onyx flex-1">{resp.question}</span>
                        </div>
                      ))}

                      {cl.status !== "completed" && (
                        <button
                          onClick={() => completeChecklist(cl.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-teal text-white font-semibold text-field-sm transition-all active:scale-[0.98]"
                        >
                          <Check size={16} /> Complete Inspection
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {checklists.length === 0 && !showTemplateSelector && (
              <div className="text-center py-12">
                <ClipboardCheck size={40} className="text-warm-gray mx-auto mb-3" />
                <p className="text-field-base text-onyx font-semibold">No Inspections</p>
                <p className="text-field-sm text-warm-gray mt-1">Start a quality checklist from templates</p>
              </div>
            )}

            {/* Template Selector */}
            {showTemplateSelector && (
              <div className="bg-glass rounded-card p-4 border border-accent-violet/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-field-base font-heading font-semibold text-onyx">Select Template</h3>
                  <button onClick={() => setShowTemplateSelector(false)} className="text-warm-gray"><X size={20} /></button>
                </div>
                {templates.length === 0 ? (
                  <p className="text-field-sm text-warm-gray py-4 text-center">
                    No templates loaded. Templates will be available after Phase 4 setup.
                  </p>
                ) : (
                  templates.filter((t) => t.isActive).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleStartChecklist(t)}
                      className="w-full text-left px-4 py-3 rounded-card bg-glass hover:bg-glass-light active:bg-glass-medium transition-all border border-white/[0.06]"
                    >
                      <p className="text-field-base font-semibold text-onyx">{t.name}</p>
                      <p className="text-field-xs text-warm-gray">
                        {t.category} · {t.sections.reduce((s, sec) => s + sec.items.length, 0)} items
                        {t.estimatedDuration && ` · ~${t.estimatedDuration}min`}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "deficiencies" && (
          <>
            {deficiencies.map((def) => (
              <div key={def.id} className="bg-glass rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className={def.severity === "minor" ? "text-accent-amber" : "text-accent-red"} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-field-xs px-2 py-0.5 rounded font-semibold ${SEVERITY_COLORS[def.severity]}`}>
                        {def.severity}
                      </span>
                      <span className="text-field-xs text-warm-gray">{def.status}</span>
                    </div>
                    <p className="text-field-sm text-onyx">{def.description}</p>
                    {def.responsibleParty && <p className="text-field-xs text-warm-gray mt-1">Responsible: {def.responsibleParty}</p>}
                    {def.taktZone && <p className="text-field-xs text-warm-gray">Zone: {def.taktZone}</p>}
                  </div>
                  <button onClick={() => removeDeficiency(def.id)} className="text-warm-gray flex-shrink-0"><X size={16} /></button>
                </div>
              </div>
            ))}

            {deficiencies.length === 0 && !showDeficiencyForm && (
              <div className="text-center py-12">
                <Check size={40} className="text-accent-teal mx-auto mb-3" />
                <p className="text-field-base text-onyx font-semibold">No Deficiencies</p>
                <p className="text-field-sm text-warm-gray mt-1">Log issues found during inspections</p>
              </div>
            )}

            {/* Add Deficiency Form */}
            {showDeficiencyForm && (
              <div className="bg-glass rounded-card p-4 border border-accent-red/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-field-base font-heading font-semibold text-onyx">Log Deficiency</h3>
                  <button onClick={() => setShowDeficiencyForm(false)} className="text-warm-gray"><X size={20} /></button>
                </div>

                <textarea value={defDesc} onChange={(e) => setDefDesc(e.target.value)}
                  placeholder="Describe the deficiency..." rows={3}
                  className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx placeholder-warm-gray resize-none" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-field-xs text-warm-gray mb-1">Severity</label>
                    <select value={defSeverity} onChange={(e) => setDefSeverity(e.target.value as DeficiencySeverity)}
                      className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx">
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                      <option value="life_safety">Life Safety</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-field-xs text-warm-gray mb-1">Zone</label>
                    <select value={defZone} onChange={(e) => setDefZone(e.target.value)}
                      className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx">
                      <option value="">No zone</option>
                      {taktZones.map((tz) => <option key={tz.id} value={tz.zoneCode}>{tz.zoneCode}</option>)}
                    </select>
                  </div>
                </div>

                <input type="text" value={defParty} onChange={(e) => setDefParty(e.target.value)}
                  placeholder="Responsible party" className="w-full px-3 py-2 rounded-button border border-white/[0.06] text-field-sm bg-glass text-onyx placeholder-warm-gray" />

                <button onClick={handleAddDeficiency} disabled={!defDesc}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button bg-accent-red text-white font-semibold text-field-sm transition-all active:scale-[0.98] disabled:opacity-50">
                  <AlertTriangle size={16} /> Log Deficiency
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Action */}
      <div className="px-4 py-4 border-t border-white/[0.06] bg-alabaster">
        {activeTab === "inspections" ? (
          <button onClick={() => setShowTemplateSelector(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-button bg-accent-violet text-white text-field-base font-semibold font-body transition-all active:scale-[0.98]">
            <ClipboardCheck size={24} /> <span>Start Inspection</span>
          </button>
        ) : (
          <button onClick={() => setShowDeficiencyForm(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-button bg-accent-red text-white text-field-base font-semibold font-body transition-all active:scale-[0.98]">
            <AlertTriangle size={24} /> <span>Log Deficiency</span>
          </button>
        )}
      </div>
    </div>
  );
}
