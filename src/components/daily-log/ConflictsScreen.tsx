"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Plus,
  X,
  AlertTriangle,
  AlertOctagon,
  Users,
  Check,
} from "lucide-react";
import type {
  ConflictEntry,
  ConflictCategory,
  ConflictSeverity,
  Subcontractor,
} from "@/lib/types";

interface ConflictsScreenProps {
  entries: ConflictEntry[];
  onEntriesChange: (entries: ConflictEntry[]) => void;
  subcontractors: Subcontractor[];
}

interface FormState {
  category: ConflictCategory | null;
  severity: ConflictSeverity | null;
  description: string;
  partiesInvolved: string[];
  followUpRequired: boolean;
  followUpDescription: string;
  otherPartyInput: string;
  timeOfOccurrence?: string;
  estimatedCostImpact?: number;
  estimatedScheduleDaysImpact?: number;
  resolutionStatus?: string;
  witnessNames?: string;
  rootCause?: string;
  contractReference?: string;
}

const INITIAL_FORM_STATE: FormState = {
  category: null,
  severity: null,
  description: "",
  partiesInvolved: [],
  followUpRequired: false,
  followUpDescription: "",
  otherPartyInput: "",
  timeOfOccurrence: undefined,
  estimatedCostImpact: undefined,
  estimatedScheduleDaysImpact: undefined,
  resolutionStatus: undefined,
  witnessNames: undefined,
  rootCause: undefined,
  contractReference: undefined,
};

const CATEGORY_OPTIONS: { value: ConflictCategory; label: string }[] = [
  { value: "property_damage", label: "Property Damage" },
  { value: "sub_conflict", label: "Sub Conflict" },
  { value: "owner_issue", label: "Owner Issue" },
  { value: "inspector_issue", label: "Inspector Issue" },
  { value: "safety_incident", label: "Safety Incident" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
];

const SEVERITY_OPTIONS: {
  value: ConflictSeverity;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { value: "low", label: "Low", color: "text-green-600", bgColor: "bg-green-100 border-green-300" },
  { value: "medium", label: "Medium", color: "text-amber-600", bgColor: "bg-amber-100 border-amber-300" },
  { value: "high", label: "High", color: "text-orange-600", bgColor: "bg-orange-100 border-orange-300" },
  { value: "critical", label: "Critical", color: "text-red-600", bgColor: "bg-red-100 border-red-300" },
];

const getCategoryIcon = (category: ConflictCategory): React.ReactNode => {
  const iconMap: Record<ConflictCategory, React.ReactNode> = {
    property_damage: <AlertOctagon className="w-5 h-5" />,
    sub_conflict: <Users className="w-5 h-5" />,
    owner_issue: <AlertTriangle className="w-5 h-5" />,
    inspector_issue: <AlertTriangle className="w-5 h-5" />,
    safety_incident: <ShieldAlert className="w-5 h-5" />,
    schedule_conflict: <AlertTriangle className="w-5 h-5" />,
  };
  return iconMap[category];
};

const getSeverityColor = (
  severity: ConflictSeverity
): { text: string; bg: string } => {
  const colorMap: Record<ConflictSeverity, { text: string; bg: string }> = {
    low: { text: "text-green-700", bg: "bg-green-100" },
    medium: { text: "text-amber-700", bg: "bg-amber-100" },
    high: { text: "text-orange-700", bg: "bg-orange-100" },
    critical: { text: "text-red-700", bg: "bg-red-100" },
  };
  return colorMap[severity];
};

export default function ConflictsScreen({
  entries,
  onEntriesChange,
  subcontractors,
}: ConflictsScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  const handleAddConflict = (): void => {
    if (
      !formState.category ||
      !formState.severity ||
      !formState.description.trim() ||
      formState.partiesInvolved.length === 0
    ) {
      alert(
        "Please fill in all required fields: Category, Severity, Description, and at least one party involved"
      );
      return;
    }

    if (formState.followUpRequired && !formState.followUpDescription.trim()) {
      alert("Please enter a follow-up description");
      return;
    }

    const newEntry: ConflictEntry = {
      category: formState.category,
      severity: formState.severity,
      description: formState.description.trim(),
      partiesInvolved: formState.partiesInvolved,
      followUpRequired: formState.followUpRequired,
      followUpDescription: formState.followUpDescription.trim() || undefined,
    };

    onEntriesChange([...entries, newEntry]);
    setFormState(INITIAL_FORM_STATE);
    setShowModal(false);
  };

  const handleRemoveConflict = (index: number): void => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  const handleFormChange = (field: keyof FormState, value: unknown): void => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePartyToggle = (party: string): void => {
    setFormState((prev) => ({
      ...prev,
      partiesInvolved: prev.partiesInvolved.includes(party)
        ? prev.partiesInvolved.filter((p) => p !== party)
        : [...prev.partiesInvolved, party],
    }));
  };

  const handleAddOtherParty = (): void => {
    if (formState.otherPartyInput.trim()) {
      if (!formState.partiesInvolved.includes(formState.otherPartyInput)) {
        setFormState((prev) => ({
          ...prev,
          partiesInvolved: [...prev.partiesInvolved, prev.otherPartyInput.trim()],
          otherPartyInput: "",
        }));
      }
    }
  };

  const handleRemoveParty = (party: string): void => {
    setFormState((prev) => ({
      ...prev,
      partiesInvolved: prev.partiesInvolved.filter((p) => p !== party),
    }));
  };

  const criticalCount = entries.filter((e) => e.severity === "critical").length;
  const highCount = entries.filter((e) => e.severity === "high").length;

  const getCategoryLabel = (category: ConflictCategory): string => {
    const option = CATEGORY_OPTIONS.find((c) => c.value === category);
    return option?.label || category;
  };

  const getSeverityLabel = (severity: ConflictSeverity): string => {
    const option = SEVERITY_OPTIONS.find((s) => s.value === severity);
    return option?.label || severity;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header and Add Button */}
      <div className="sticky top-0 bg-alabaster border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-onyx" />
          <h1 className="text-3xl font-bold text-onyx">Conflicts & Issues</h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[56px] bg-onyx text-alabaster rounded-xl font-semibold text-lg hover:bg-gray-900 transition-colors border-2 border-amber-400"
        >
          <Plus className="w-6 h-6" />
          Report Issue
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-onyx">Report Issue</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormState(INITIAL_FORM_STATE);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-onyx" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Category <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_OPTIONS.map((categoryOption) => (
                    <button
                      key={categoryOption.value}
                      onClick={() =>
                        handleFormChange("category", categoryOption.value)
                      }
                      className={`px-4 py-3 rounded-xl font-semibold text-base transition-colors border-2 min-h-[56px] ${
                        formState.category === categoryOption.value
                          ? "bg-onyx text-alabaster border-onyx"
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      }`}
                    >
                      {categoryOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selection */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Severity <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SEVERITY_OPTIONS.map((severityOption) => (
                    <button
                      key={severityOption.value}
                      onClick={() =>
                        handleFormChange("severity", severityOption.value)
                      }
                      className={`px-4 py-3 rounded-full font-semibold text-base transition-colors border-2 min-h-[56px] ${
                        formState.severity === severityOption.value
                          ? `${severityOption.bgColor} border-current`
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      } ${
                        formState.severity === "critical" &&
                        severityOption.value === "critical"
                          ? "animate-pulse"
                          : ""
                      }`}
                    >
                      {severityOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  placeholder="Describe the conflict or issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx resize-none"
                />
              </div>

              {/* Parties Involved */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Parties Involved <span className="text-red-600">*</span>
                </label>

                {/* Subcontractor List */}
                <div className="mb-4 space-y-2">
                  {subcontractors.length > 0 && (
                    <p className="text-sm font-medium text-gray-700">
                      Subcontractors
                    </p>
                  )}
                  {subcontractors.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() =>
                        handlePartyToggle(`${sub.company} (${sub.trade})`)
                      }
                      className={`w-full px-4 py-3 text-left rounded-lg font-medium text-base transition-colors border-2 min-h-[56px] flex items-center gap-3 ${
                        formState.partiesInvolved.includes(
                          `${sub.company} (${sub.trade})`
                        )
                          ? "bg-onyx text-alabaster border-onyx"
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                          formState.partiesInvolved.includes(
                            `${sub.company} (${sub.trade})`
                          )
                            ? "bg-white border-white"
                            : "border-gray-300 bg-alabaster"
                        }`}
                      >
                        {formState.partiesInvolved.includes(
                          `${sub.company} (${sub.trade})`
                        ) && <Check className="w-4 h-4 text-onyx" />}
                      </div>
                      <span>{sub.company}</span>
                      <span className="text-sm opacity-75">({sub.trade})</span>
                    </button>
                  ))}
                </div>

                {/* Other Party Input */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Other</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formState.otherPartyInput}
                      onChange={(e) =>
                        handleFormChange("otherPartyInput", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddOtherParty();
                        }
                      }}
                      placeholder="Add other party name"
                      className="flex-1 px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                    />
                    <button
                      onClick={handleAddOtherParty}
                      className="px-6 py-3 min-h-[56px] bg-onyx text-alabaster rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Parties Display */}
                {formState.partiesInvolved.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formState.partiesInvolved.map((party) => (
                      <div
                        key={party}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-onyx text-alabaster rounded-full text-sm font-medium"
                      >
                        {party}
                        <button
                          onClick={() => handleRemoveParty(party)}
                          className="ml-1 hover:opacity-75 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-Up Required Toggle */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Follow-Up Required
                </label>
                <button
                  onClick={() =>
                    handleFormChange(
                      "followUpRequired",
                      !formState.followUpRequired
                    )
                  }
                  className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                    formState.followUpRequired
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                      formState.followUpRequired ? "translate-x-12" : "translate-x-1"
                    }`}
                  />
                  <span className="ml-2 text-sm font-medium">
                    {formState.followUpRequired ? "Yes" : "No"}
                  </span>
                </button>
              </div>

              {/* Follow-Up Description - Conditional */}
              {formState.followUpRequired && (
                <div>
                  <label className="block text-lg font-semibold text-onyx mb-2">
                    Follow-Up Description
                  </label>
                  <textarea
                    value={formState.followUpDescription}
                    onChange={(e) =>
                      handleFormChange("followUpDescription", e.target.value)
                    }
                    placeholder="Describe the required follow-up actions..."
                    rows={4}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx resize-none"
                  />
                </div>
              )}

              {/* Legal Details Section */}
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-lg font-semibold text-onyx mb-4">
                  Legal Details (Optional)
                </h3>

                {/* Time of Occurrence */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Time of Occurrence
                  </label>
                  <input
                    type="time"
                    value={formState.timeOfOccurrence ?? ""}
                    onChange={(e) =>
                      handleFormChange("timeOfOccurrence", e.target.value || undefined)
                    }
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>

                {/* Estimated Cost Impact */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
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
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Estimated Schedule Days Impact */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Estimated Schedule Impact (days)
                  </label>
                  <input
                    type="number"
                    value={formState.estimatedScheduleDaysImpact ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? undefined : parseFloat(e.target.value);
                      handleFormChange("estimatedScheduleDaysImpact", val);
                    }}
                    placeholder="0"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                    step="0.5"
                    min="0"
                  />
                </div>

                {/* Resolution Status */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Resolution Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Open", "Escalated", "Resolved", "Litigated"].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleFormChange(
                            "resolutionStatus",
                            formState.resolutionStatus === status ? undefined : status
                          );
                        }}
                        className={`py-2 px-3 rounded-lg font-medium text-base transition-all ${
                          formState.resolutionStatus === status
                            ? "bg-onyx text-alabaster"
                            : "bg-alabaster text-onyx border-2 border-gray-300 hover:border-onyx"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Witness Names */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Witness Names (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formState.witnessNames ?? ""}
                    onChange={(e) =>
                      handleFormChange("witnessNames", e.target.value || undefined)
                    }
                    placeholder="John Smith, Jane Doe"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>

                {/* Root Cause */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Root Cause
                  </label>
                  <input
                    type="text"
                    value={formState.rootCause ?? ""}
                    onChange={(e) =>
                      handleFormChange("rootCause", e.target.value || undefined)
                    }
                    placeholder="Describe root cause"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>

                {/* Contract Reference */}
                <div className="mb-4">
                  <label className="block text-base font-semibold text-onyx mb-2">
                    Contract Reference
                  </label>
                  <input
                    type="text"
                    value={formState.contractReference ?? ""}
                    onChange={(e) =>
                      handleFormChange("contractReference", e.target.value || undefined)
                    }
                    placeholder="e.g., Article 8.1"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddConflict}
                  className="flex-1 px-6 py-4 min-h-[56px] bg-onyx text-alabaster rounded-xl font-semibold text-lg hover:bg-gray-900 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormState(INITIAL_FORM_STATE);
                  }}
                  className="flex-1 px-6 py-4 min-h-[56px] bg-gray-100 text-onyx rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-onyx mb-2">
              No conflicts or issues to report
            </p>
            <p className="text-base text-gray-500">Keep it safe out there</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Summary Section */}
            {(criticalCount > 0 || highCount > 0) && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <p className="font-semibold text-onyx mb-2">
                  {entries.length} issue{entries.length !== 1 ? "s" : ""} reported
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {criticalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600" />
                      <span className="text-onyx">
                        {criticalCount} Critical
                      </span>
                    </div>
                  )}
                  {highCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-600" />
                      <span className="text-onyx">
                        {highCount} High
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conflict Cards */}
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const severityColor = getSeverityColor(entry.severity);
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border-l-4 border-onyx p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Category Badge */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-alabaster text-onyx rounded-full text-sm font-semibold">
                            {getCategoryIcon(entry.category)}
                            {getCategoryLabel(entry.category)}
                          </div>

                          {/* Severity Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${severityColor.bg} ${severityColor.text}`}
                          >
                            {getSeverityLabel(entry.severity)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveConflict(index)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
                      >
                        <X className="w-6 h-6 text-onyx" />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-base text-gray-700 mb-4">
                      {entry.description}
                    </p>

                    {/* Parties Involved */}
                    {entry.partiesInvolved.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-onyx" />
                          <p className="font-semibold text-onyx">
                            Parties Involved
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.partiesInvolved.map((party) => (
                            <span
                              key={party}
                              className="inline-block px-3 py-1.5 bg-onyx text-alabaster rounded-full text-sm font-medium"
                            >
                              {party}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-Up Indicator */}
                    {entry.followUpRequired && (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-amber-900 mb-1">
                              Follow-Up Required
                            </p>
                            {entry.followUpDescription && (
                              <p className="text-base text-amber-900">
                                {entry.followUpDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
