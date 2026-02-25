"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  SafetyIncident,
  SafetyIncidentType,
  TaktZone,
  Subcontractor,
} from "@/lib/types";

interface SafetyIncidentsScreenProps {
  entries: SafetyIncident[];
  onEntriesChange: (entries: SafetyIncident[]) => void;
  taktZones: TaktZone[];
  subcontractors: Subcontractor[];
}

// Incident type configuration with colors
const INCIDENT_TYPES: Record<
  SafetyIncidentType,
  { label: string; color: string; bgColor: string }
> = {
  near_miss: { label: "Near Miss", color: "text-accent-violet", bgColor: "bg-accent-violet/15" },
  first_aid: { label: "First Aid", color: "text-accent-amber", bgColor: "bg-accent-amber/15" },
  recordable: { label: "Recordable", color: "text-accent-amber", bgColor: "bg-accent-amber/15" },
  lost_time: { label: "Lost Time", color: "text-accent-red", bgColor: "bg-accent-red/15" },
  fatality: { label: "Fatality", color: "text-accent-red font-bold", bgColor: "bg-accent-red/20" },
};

function generateUniqueId(): string {
  return `safety-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

export default function SafetyIncidentsScreen({
  entries,
  onEntriesChange,
  taktZones,
  subcontractors,
}: SafetyIncidentsScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SafetyIncident>>({
    incidentType: "near_miss",
    witnessNames: [],
    immediateActions: [],
    correctiveActions: [],
    oshaReportable: false,
    followUpRequired: false,
  });
  const [newWitness, setNewWitness] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newCorrectiveAction, setNewCorrectiveAction] = useState("");

  const handleAddIncident = () => {
    if (!formData.description?.trim()) {
      alert("Description is required");
      return;
    }

    const newIncident: SafetyIncident = {
      id: generateUniqueId(),
      projectId: "", // Will be set by parent
      date: new Date().toISOString().split("T")[0],
      time: formData.time || "",
      incidentType: formData.incidentType || "near_miss",
      description: formData.description,
      location: {
        taktZone: formData.location?.taktZone,
        specific: formData.location?.specific,
      },
      injuredPersonName: formData.injuredPersonName,
      injuredPersonEmployer: formData.injuredPersonEmployer,
      injuredPersonTrade: formData.injuredPersonTrade,
      witnessNames: formData.witnessNames || [],
      immediateActions: formData.immediateActions || [],
      rootCause: formData.rootCause,
      correctiveActions: formData.correctiveActions || [],
      oshaReportable: formData.oshaReportable || false,
      daysAwayFromWork: formData.daysAwayFromWork,
      restrictedDutyDays: formData.restrictedDutyDays,
      followUpRequired: formData.followUpRequired || false,
      followUpDate: formData.followUpDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onEntriesChange([...entries, newIncident]);
    resetForm();
    setShowModal(false);
  };

  const handleDeleteIncident = (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
  };

  const handleAddWitness = () => {
    if (newWitness.trim()) {
      setFormData({
        ...formData,
        witnessNames: [...(formData.witnessNames || []), newWitness],
      });
      setNewWitness("");
    }
  };

  const handleRemoveWitness = (index: number) => {
    setFormData({
      ...formData,
      witnessNames: (formData.witnessNames || []).filter((_, i) => i !== index),
    });
  };

  const handleAddAction = () => {
    if (newAction.trim()) {
      setFormData({
        ...formData,
        immediateActions: [...(formData.immediateActions || []), newAction],
      });
      setNewAction("");
    }
  };

  const handleRemoveAction = (index: number) => {
    setFormData({
      ...formData,
      immediateActions: (formData.immediateActions || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleAddCorrectiveAction = () => {
    if (newCorrectiveAction.trim()) {
      setFormData({
        ...formData,
        correctiveActions: [
          ...(formData.correctiveActions || []),
          newCorrectiveAction,
        ],
      });
      setNewCorrectiveAction("");
    }
  };

  const handleRemoveCorrectiveAction = (index: number) => {
    setFormData({
      ...formData,
      correctiveActions: (formData.correctiveActions || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  const resetForm = () => {
    setFormData({
      incidentType: "near_miss",
      witnessNames: [],
      immediateActions: [],
      correctiveActions: [],
      oshaReportable: false,
      followUpRequired: false,
    });
    setNewWitness("");
    setNewAction("");
    setNewCorrectiveAction("");
  };

  const toggleExpanded = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const getIncidentTypeConfig = (type: SafetyIncidentType) => {
    return INCIDENT_TYPES[type];
  };

  // Empty state
  if (entries.length === 0 && !showModal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <HeartPulse className="w-12 h-12 text-warm-gray mb-4" />
        <p className="text-warm-gray text-center mb-6">
          No safety incidents today. Tap + to report an incident.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent-violet text-white px-4 py-2 rounded-lg hover:bg-accent-violet/90 transition"
        >
          <Plus className="w-5 h-5" />
          Report Incident
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header with button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-onyx">Safety Incidents</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent-violet text-white px-3 py-2 rounded-lg hover:bg-accent-violet/90 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Report
        </button>
      </div>

      {/* Incident Cards */}
      <div className="space-y-3">
        {entries.map((incident) => {
          const typeConfig = getIncidentTypeConfig(incident.incidentType);
          const isExpanded = expandedCardId === incident.id;
          const isOshaReportable = incident.oshaReportable;

          return (
            <div
              key={incident.id}
              className={`rounded-lg p-4 transition ${
                isOshaReportable
                  ? "bg-accent-red/10 border-2 border-accent-red"
                  : "bg-glass border border-gray-200"
              }`}
            >
              {/* OSHA Banner */}
              {isOshaReportable && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-accent-red/15 rounded border border-accent-red/30">
                  <AlertCircle className="w-4 h-4 text-accent-red" />
                  <span className="text-sm font-semibold text-accent-red">
                    OSHA REPORTABLE
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold ${typeConfig.bgColor} ${typeConfig.color}`}
                    >
                      {typeConfig.label}
                    </span>
                    <span className="text-sm text-warm-gray">
                      {incident.time || "—"}
                    </span>
                  </div>
                  <p className="font-semibold text-onyx">
                    {incident.injuredPersonName || "No injured person reported"}
                  </p>
                  <p className="text-sm text-slate mt-1 line-clamp-2">
                    {incident.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded(incident.id)}
                  className="ml-2 p-1 hover:bg-glass-light rounded transition"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-onyx" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-onyx" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {incident.location && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Location
                      </p>
                      <p className="text-sm text-onyx">
                        {incident.location.taktZone || "—"}
                        {incident.location.specific && ` / ${incident.location.specific}`}
                      </p>
                    </div>
                  )}

                  {incident.injuredPersonEmployer && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Employer
                      </p>
                      <p className="text-sm text-onyx">
                        {incident.injuredPersonEmployer}
                      </p>
                    </div>
                  )}

                  {incident.injuredPersonTrade && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Trade
                      </p>
                      <p className="text-sm text-onyx">
                        {incident.injuredPersonTrade}
                      </p>
                    </div>
                  )}

                  {incident.witnessNames && incident.witnessNames.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Witnesses
                      </p>
                      <ul className="text-sm text-onyx list-disc list-inside">
                        {incident.witnessNames.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {incident.immediateActions &&
                    incident.immediateActions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-warm-gray uppercase">
                          Immediate Actions
                        </p>
                        <ul className="text-sm text-onyx list-disc list-inside">
                          {incident.immediateActions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {incident.rootCause && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Root Cause
                      </p>
                      <p className="text-sm text-onyx">{incident.rootCause}</p>
                    </div>
                  )}

                  {incident.correctiveActions &&
                    incident.correctiveActions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-warm-gray uppercase">
                          Corrective Actions
                        </p>
                        <ul className="text-sm text-onyx list-disc list-inside">
                          {incident.correctiveActions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {(incident.daysAwayFromWork || incident.restrictedDutyDays) && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Time Impact
                      </p>
                      <p className="text-sm text-onyx">
                        {incident.daysAwayFromWork && `Days Away: ${incident.daysAwayFromWork}`}
                        {incident.daysAwayFromWork &&
                          incident.restrictedDutyDays &&
                          " | "}
                        {incident.restrictedDutyDays &&
                          `Restricted Duty: ${incident.restrictedDutyDays}`}
                      </p>
                    </div>
                  )}

                  {incident.followUpRequired && (
                    <div>
                      <p className="text-xs font-semibold text-warm-gray uppercase">
                        Follow-up
                      </p>
                      <p className="text-sm text-onyx">
                        {incident.followUpDate
                          ? `Scheduled for ${incident.followUpDate}`
                          : "Follow-up required"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delete Button */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => handleDeleteIncident(incident.id)}
                  className="p-2 text-accent-red hover:bg-accent-red/10 rounded transition"
                  title="Delete incident"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-obsidian border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-onyx">
                Report Safety Incident
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-warm-gray hover:text-onyx text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Incident Type */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Incident Type
                </label>
                <select
                  value={formData.incidentType || "near_miss"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      incidentType: e.target.value as SafetyIncidentType,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Time of Incident
                </label>
                <input
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Description (Required) */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed description of the incident"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black h-24 resize-none"
                />
              </div>

              {/* Location Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-black">Location</h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Takt Zone
                  </label>
                  <select
                    value={formData.location?.taktZone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          taktZone: e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select zone...</option>
                    {taktZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zoneName} ({z.zoneCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Specific Location
                  </label>
                  <input
                    type="text"
                    value={formData.location?.specific || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          specific: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., North wall, Level 3, near Column A"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Injured Person Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-black">
                  Injured Person Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.injuredPersonName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        injuredPersonName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Employer
                  </label>
                  <select
                    value={formData.injuredPersonEmployer || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        injuredPersonEmployer: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select employer...</option>
                    <option value="Blackstone">Blackstone (Own Forces)</option>
                    {subcontractors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Trade
                  </label>
                  <input
                    type="text"
                    value={formData.injuredPersonTrade || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        injuredPersonTrade: e.target.value,
                      })
                    }
                    placeholder="e.g., Carpenter, Electrician"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Witnesses */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Witness Names
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newWitness}
                    onChange={(e) => setNewWitness(e.target.value)}
                    placeholder="Add witness name"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddWitness();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddWitness}
                    className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.witnessNames && formData.witnessNames.length > 0 && (
                  <div className="space-y-1">
                    {formData.witnessNames.map((w, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded text-sm text-black"
                      >
                        <span>{w}</span>
                        <button
                          onClick={() => handleRemoveWitness(i)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Immediate Actions */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Immediate Actions Taken
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="Add action"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddAction();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddAction}
                    className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.immediateActions && formData.immediateActions.length > 0 && (
                  <div className="space-y-1">
                    {formData.immediateActions.map((a, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded text-sm text-black"
                      >
                        <span>{a}</span>
                        <button
                          onClick={() => handleRemoveAction(i)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Root Cause */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Root Cause Analysis
                </label>
                <textarea
                  value={formData.rootCause || ""}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  placeholder="Identify underlying factors and causes"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black h-20 resize-none"
                />
              </div>

              {/* Corrective Actions */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Corrective Actions
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCorrectiveAction}
                    onChange={(e) => setNewCorrectiveAction(e.target.value)}
                    placeholder="Add corrective action"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddCorrectiveAction();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCorrectiveAction}
                    className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300 transition text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.correctiveActions && formData.correctiveActions.length > 0 && (
                  <div className="space-y-1">
                    {formData.correctiveActions.map((a, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded text-sm text-black"
                      >
                        <span>{a}</span>
                        <button
                          onClick={() => handleRemoveCorrectiveAction(i)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OSHA Reportable Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oshaReportable || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oshaReportable: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                  />
                  <span className="text-sm font-semibold text-black">
                    OSHA Reportable
                  </span>
                </label>
                {formData.oshaReportable && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded">
                    <p className="text-xs text-red-700 font-semibold">
                      ⚠ OSHA requires reporting within 24 hours for recordable injuries
                    </p>
                  </div>
                )}
              </div>

              {/* Days Away / Restricted Duty (show for Lost Time/Fatality) */}
              {(formData.incidentType === "lost_time" ||
                formData.incidentType === "fatality") && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Days Away From Work
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.daysAwayFromWork || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daysAwayFromWork: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              )}

              {/* Restricted Duty Days */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Restricted Duty Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.restrictedDutyDays || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      restrictedDutyDays: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Follow-up Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        followUpRequired: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                  />
                  <span className="text-sm font-semibold text-black">
                    Follow-up Required
                  </span>
                </label>
              </div>

              {/* Follow-up Date (show if followUp required) */}
              {formData.followUpRequired && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIncident}
                  className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
                >
                  Save Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
