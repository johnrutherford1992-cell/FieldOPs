"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Plus,
  X,
  DollarSign,
  Calendar,
  Check,
} from "lucide-react";
import type { ChangeEntry, ChangeInitiator, ChangeImpact } from "@/lib/types";

interface ChangesScreenProps {
  entries: ChangeEntry[];
  onEntriesChange: (entries: ChangeEntry[]) => void;
  csiDivisions: { code: string; name: string }[];
}

interface FormState {
  initiatedBy: ChangeInitiator | null;
  description: string;
  affectedDivisions: string[];
  impact: ChangeImpact | null;
  changeType?: string;
  estimatedCostImpact?: number;
  estimatedScheduleImpact?: number;
  contractClause?: string;
  directedBy?: string;
}

const INITIAL_FORM_STATE: FormState = {
  initiatedBy: null,
  description: "",
  affectedDivisions: [],
  impact: null,
  changeType: undefined,
  estimatedCostImpact: undefined,
  estimatedScheduleImpact: undefined,
  contractClause: undefined,
  directedBy: undefined,
};

const INITIATOR_OPTIONS: { value: ChangeInitiator; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "field_condition", label: "Field Condition" },
];

const IMPACT_OPTIONS: {
  value: ChangeImpact;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "cost",
    label: "Cost",
    icon: <DollarSign size={20} />,
    color: "bg-amber-100 text-amber-700 border-amber-300",
  },
  {
    value: "schedule",
    label: "Schedule",
    icon: <Calendar size={20} />,
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  {
    value: "both",
    label: "Both",
    icon: (
      <div className="flex gap-1">
        <DollarSign size={16} />
        <Calendar size={16} />
      </div>
    ),
    color: "bg-red-100 text-red-700 border-red-300",
  },
];

const getInitiatorColor = (initiator: ChangeInitiator): string => {
  const colorMap: Record<ChangeInitiator, string> = {
    owner: "bg-purple-100 text-purple-700",
    architect: "bg-indigo-100 text-indigo-700",
    engineer: "bg-cyan-100 text-cyan-700",
    field_condition: "bg-orange-100 text-orange-700",
  };
  return colorMap[initiator];
};

const getInitiatorLabel = (initiator: ChangeInitiator): string => {
  const option = INITIATOR_OPTIONS.find((o) => o.value === initiator);
  return option?.label || initiator;
};

const getImpactLabel = (impact: ChangeImpact): string => {
  const option = IMPACT_OPTIONS.find((o) => o.value === impact);
  return option?.label || impact;
};

const getImpactColor = (impact: ChangeImpact): string => {
  const option = IMPACT_OPTIONS.find((o) => o.value === impact);
  return option?.color || "";
};

export default function ChangesScreen({
  entries,
  onEntriesChange,
  csiDivisions,
}: ChangesScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  const handleAddChange = () => {
    if (
      !formState.initiatedBy ||
      !formState.description.trim() ||
      formState.affectedDivisions.length === 0 ||
      !formState.impact
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const newEntry: ChangeEntry = {
      initiatedBy: formState.initiatedBy,
      description: formState.description.trim(),
      affectedDivisions: formState.affectedDivisions,
      impact: formState.impact,
    };

    onEntriesChange([...entries, newEntry]);
    setFormState(INITIAL_FORM_STATE);
    setShowModal(false);
  };

  const handleRemoveEntry = (index: number) => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  const handleFormChange = (field: keyof FormState, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDivision = (code: string) => {
    const updated = formState.affectedDivisions.includes(code)
      ? formState.affectedDivisions.filter((d) => d !== code)
      : [...formState.affectedDivisions, code];
    handleFormChange("affectedDivisions", updated);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Summary Bar */}
      <div className="bg-onyx text-white px-4 py-4 rounded-card shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-alabaster" />
            <div>
              <p className="text-field-sm text-alabaster font-body">
                Changes & Directives Logged
              </p>
              <p className="text-field-3xl font-heading font-semibold text-white">
                {entries.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {entries.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-4 p-4 bg-alabaster rounded-full">
              <AlertTriangle size={40} className="text-warm-gray" />
            </div>
            <h3 className="text-field-lg font-heading font-semibold text-onyx mb-2 text-center">
              No Changes Logged
            </h3>
            <p className="text-field-sm text-warm-gray font-body text-center max-w-xs">
              Tap &apos;Log Change / Directive&apos; to record any project changes
            </p>
          </div>
        ) : (
          // Change Entry Cards
          entries.map((entry, index) => (
            <div
              key={`change-${index}`}
              className="bg-alabaster rounded-xl p-5 shadow-card"
            >
              {/* Card Header with Initiator Badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`inline-block px-3 py-2 rounded-full text-field-sm font-semibold ${getInitiatorColor(entry.initiatedBy)}`}
                >
                  {getInitiatorLabel(entry.initiatedBy)}
                </div>
                <button
                  onClick={() => handleRemoveEntry(index)}
                  className="flex items-center justify-center w-10 h-10 rounded-button bg-white text-onyx hover:bg-gray-100 active:scale-[0.95] transition-all flex-shrink-0"
                  aria-label="Remove change entry"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Description */}
              <p className="text-field-base text-onyx font-body mb-4">
                {entry.description}
              </p>

              {/* Affected Divisions Chips */}
              {entry.affectedDivisions.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {entry.affectedDivisions.map((divCode) => {
                    const division = csiDivisions.find(
                      (d) => d.code === divCode
                    );
                    return (
                      <span
                        key={divCode}
                        className="inline-block px-3 py-2 bg-white text-onyx rounded-full text-field-sm font-medium border border-gray-200"
                      >
                        {divCode}
                        {division && ` - ${division.name}`}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Impact Badge */}
              <div
                className={`inline-block px-3 py-2 rounded-full text-field-sm font-semibold border-2 ${getImpactColor(entry.impact)}`}
              >
                {getImpactLabel(entry.impact)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Button - Bottom Fixed */}
      <div className="border-t border-gray-200 bg-white p-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[56px] bg-onyx text-alabaster rounded-xl font-semibold text-field-base hover:bg-gray-900 transition-colors"
        >
          <Plus size={24} />
          Log Change / Directive
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-field-lg font-heading font-bold text-onyx">
                Log Change / Directive
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormState(INITIAL_FORM_STATE);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-onyx" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Initiated By */}
              <div>
                <label className="block text-field-base font-heading font-semibold text-onyx mb-4">
                  Initiated By
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INITIATOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFormChange("initiatedBy", option.value)}
                      className={`px-4 py-4 min-h-[56px] rounded-xl font-body text-field-base font-semibold transition-all border-2 ${
                        formState.initiatedBy === option.value
                          ? "bg-onyx text-white border-onyx"
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-field-base font-heading font-semibold text-onyx mb-3">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Describe the change or directive..."
                  className="field-input w-full min-h-[120px] text-field-base rounded-card p-4 resize-none font-body"
                />
              </div>

              {/* Affected Divisions */}
              <div>
                <label className="block text-field-base font-heading font-semibold text-onyx mb-3">
                  Affected Divisions
                </label>
                <div
                  className="border border-gray-300 rounded-card max-h-[240px] overflow-y-auto bg-alabaster"
                >
                  <div className="space-y-2 p-3">
                    {csiDivisions.length === 0 ? (
                      <p className="text-field-sm text-warm-gray p-4 text-center">
                        No divisions available
                      </p>
                    ) : (
                      csiDivisions.map((division) => {
                        const isSelected = formState.affectedDivisions.includes(
                          division.code
                        );
                        return (
                          <button
                            key={division.code}
                            onClick={() => toggleDivision(division.code)}
                            className={`
                              w-full min-h-[48px] rounded-button px-4 py-3
                              transition-all duration-150 flex items-center gap-3
                              font-body text-field-sm
                              ${
                                isSelected
                                  ? "bg-onyx text-white"
                                  : "bg-white border border-gray-200 text-onyx hover:border-gray-300"
                              }
                            `}
                          >
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-onyx border-onyx"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                            <span className="text-left flex-1">
                              {division.code} - {division.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <p className="text-field-sm text-warm-gray mt-2">
                  {formState.affectedDivisions.length} division(s) selected
                </p>
              </div>

              {/* Impact */}
              <div>
                <label className="block text-field-base font-heading font-semibold text-onyx mb-4">
                  Impact
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {IMPACT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFormChange("impact", option.value)}
                      className={`px-4 py-4 min-h-[56px] rounded-xl font-body text-field-base font-semibold transition-all border-2 flex flex-col items-center gap-2 ${
                        formState.impact === option.value
                          ? "bg-onyx text-white border-onyx"
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      }`}
                    >
                      <div
                        className={
                          formState.impact === option.value
                            ? "text-white"
                            : "text-onyx"
                        }
                      >
                        {option.icon}
                      </div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legal Details Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-field-base font-heading font-semibold text-onyx mb-4">
                  Legal Details (Optional)
                </h3>

                {/* Change Type */}
                <div className="mb-4">
                  <label className="block text-field-sm font-semibold text-onyx mb-2">
                    Change Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Directed", "Constructive", "Cardinal"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          handleFormChange(
                            "changeType",
                            formState.changeType === type ? undefined : type
                          );
                        }}
                        className={`py-2 px-3 rounded-card text-field-sm font-medium transition-all ${
                          formState.changeType === type
                            ? "bg-onyx text-white"
                            : "bg-alabaster text-onyx hover:bg-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Cost Impact */}
                <div className="mb-4">
                  <label className="block text-field-sm font-semibold text-onyx mb-2">
                    Estimated Cost Impact ($)
                  </label>
                  <input
                    type="number"
                    value={formState.estimatedCostImpact ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? undefined : parseFloat(e.target.value);
                      handleFormChange("estimatedCostImpact", val);
                    }}
                    placeholder="0.00"
                    className="field-input w-full text-field-base min-h-[56px] rounded-card"
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Estimated Schedule Impact */}
                <div className="mb-4">
                  <label className="block text-field-sm font-semibold text-onyx mb-2">
                    Estimated Schedule Impact (days)
                  </label>
                  <input
                    type="number"
                    value={formState.estimatedScheduleImpact ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? undefined : parseFloat(e.target.value);
                      handleFormChange("estimatedScheduleImpact", val);
                    }}
                    placeholder="0"
                    className="field-input w-full text-field-base min-h-[56px] rounded-card"
                    step="0.5"
                    min="0"
                  />
                </div>

                {/* Contract Clause */}
                <div className="mb-4">
                  <label className="block text-field-sm font-semibold text-onyx mb-2">
                    Contract Clause
                  </label>
                  <input
                    type="text"
                    value={formState.contractClause ?? ""}
                    onChange={(e) => {
                      handleFormChange("contractClause", e.target.value || undefined);
                    }}
                    placeholder="e.g., Article 7.2"
                    className="field-input w-full text-field-base min-h-[56px] rounded-card"
                  />
                </div>

                {/* Directed By */}
                <div className="mb-4">
                  <label className="block text-field-sm font-semibold text-onyx mb-2">
                    Directed By
                  </label>
                  <input
                    type="text"
                    value={formState.directedBy ?? ""}
                    onChange={(e) => {
                      handleFormChange("directedBy", e.target.value || undefined);
                    }}
                    placeholder="Name or title"
                    className="field-input w-full text-field-base min-h-[56px] rounded-card"
                  />
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddChange}
                className="w-full min-h-[56px] bg-onyx text-alabaster rounded-xl font-semibold text-field-base hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
