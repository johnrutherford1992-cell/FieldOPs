"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Plus,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import type {
  InspectionEntry,
  InspectionType,
  InspectionResult,
} from "@/lib/types";

interface InspectionsScreenProps {
  entries: InspectionEntry[];
  onEntriesChange: (entries: InspectionEntry[]) => void;
}

const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: "building_inspector", label: "Building Inspector" },
  { value: "fire_marshal", label: "Fire Marshal" },
  { value: "owner", label: "Owner" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "osha", label: "OSHA" },
  { value: "other", label: "Other" },
];

const RESULT_OPTIONS: {
  value: InspectionResult;
  label: string;
  color: string;
}[] = [
  { value: "pass", label: "Pass", color: "bg-green-100 text-green-700" },
  { value: "fail", label: "Fail", color: "bg-red-100 text-red-700" },
  { value: "partial", label: "Partial", color: "bg-amber-100 text-amber-700" },
  {
    value: "informational",
    label: "Informational",
    color: "bg-blue-100 text-blue-700",
  },
];

const getTypeColor = (type: InspectionType): string => {
  const colorMap: Record<InspectionType, string> = {
    building_inspector: "bg-slate-100 text-slate-700",
    fire_marshal: "bg-orange-100 text-orange-700",
    owner: "bg-purple-100 text-purple-700",
    architect: "bg-indigo-100 text-indigo-700",
    engineer: "bg-cyan-100 text-cyan-700",
    osha: "bg-red-100 text-red-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colorMap[type];
};

const getTypeLabel = (type: InspectionType): string => {
  const option = INSPECTION_TYPES.find((t) => t.value === type);
  return option?.label || type;
};

interface FormState {
  type: InspectionType | null;
  inspectorName: string;
  company: string;
  timeIn: string;
  timeOut: string;
  result: InspectionResult | null;
  notes: string;
  followUpItems: string;
}

const INITIAL_FORM_STATE: FormState = {
  type: null,
  inspectorName: "",
  company: "",
  timeIn: "",
  timeOut: "",
  result: null,
  notes: "",
  followUpItems: "",
};

export default function InspectionsScreen({
  entries,
  onEntriesChange,
}: InspectionsScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  const handleAddInspection = () => {
    if (
      !formState.type ||
      !formState.inspectorName.trim() ||
      !formState.company.trim() ||
      !formState.timeIn ||
      !formState.timeOut ||
      !formState.result
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const newEntry: InspectionEntry = {
      type: formState.type,
      inspectorName: formState.inspectorName.trim(),
      company: formState.company.trim(),
      timeIn: formState.timeIn,
      timeOut: formState.timeOut,
      result: formState.result,
      notes: formState.notes.trim() || undefined,
      followUpItems: formState.followUpItems.trim() || undefined,
    };

    onEntriesChange([...entries, newEntry]);
    setFormState(INITIAL_FORM_STATE);
    setShowModal(false);
  };

  const handleRemoveInspection = (index: number) => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  const handleFormChange = (field: keyof FormState, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatTimeRange = (timeIn: string, timeOut: string): string => {
    const formatTime = (time: string): string => {
      if (!time) return "";
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    return `${formatTime(timeIn)} – ${formatTime(timeOut)}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-alabaster min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-8 h-8 text-onyx" />
        <h1 className="text-3xl font-bold text-onyx">Inspections & Visitors</h1>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-14 bg-onyx text-alabaster rounded-xl font-semibold text-lg hover:bg-gray-900 transition-colors"
      >
        <Plus className="w-6 h-6" />
        Add Inspection / Visit
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-onyx">
                Add Inspection / Visit
              </h2>
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
              {/* Type Selection */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INSPECTION_TYPES.map((typeOption) => (
                    <button
                      key={typeOption.value}
                      onClick={() =>
                        handleFormChange("type", typeOption.value)
                      }
                      className={`px-4 py-3 rounded-full font-semibold text-base transition-colors border-2 ${
                        formState.type === typeOption.value
                          ? "bg-onyx text-alabaster border-onyx"
                          : "bg-alabaster text-onyx border-gray-300 hover:border-onyx"
                      }`}
                    >
                      {typeOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspector Name */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-2">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={formState.inspectorName}
                  onChange={(e) =>
                    handleFormChange("inspectorName", e.target.value)
                  }
                  placeholder="Enter name"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formState.company}
                  onChange={(e) => handleFormChange("company", e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                />
              </div>

              {/* Time In/Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-semibold text-onyx mb-2">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={formState.timeIn}
                    onChange={(e) => handleFormChange("timeIn", e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-onyx mb-2">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={formState.timeOut}
                    onChange={(e) =>
                      handleFormChange("timeOut", e.target.value)
                    }
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx"
                  />
                </div>
              </div>

              {/* Result Selection */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-3">
                  Result
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {RESULT_OPTIONS.map((resultOption) => (
                    <button
                      key={resultOption.value}
                      onClick={() =>
                        handleFormChange("result", resultOption.value)
                      }
                      className={`px-4 py-3 rounded-full font-semibold text-base transition-colors border-2 ${
                        formState.result === resultOption.value
                          ? `${resultOption.color} border-current`
                          : `bg-alabaster text-onyx border-gray-300 hover:border-onyx`
                      }`}
                    >
                      {resultOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-lg font-semibold text-onyx mb-2">
                  Notes
                </label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  placeholder="Enter any notes from the inspection..."
                  rows={4}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx resize-none"
                />
              </div>

              {/* Follow-Up Items - Only show if result is fail or partial */}
              {(formState.result === "fail" ||
                formState.result === "partial") && (
                <div>
                  <label className="block text-lg font-semibold text-onyx mb-2">
                    Follow-Up Items
                  </label>
                  <textarea
                    value={formState.followUpItems}
                    onChange={(e) =>
                      handleFormChange("followUpItems", e.target.value)
                    }
                    placeholder="Enter items that need follow-up..."
                    rows={4}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-onyx resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddInspection}
                  className="flex-1 px-6 py-4 min-h-14 bg-onyx text-alabaster rounded-xl font-semibold text-lg hover:bg-gray-900 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormState(INITIAL_FORM_STATE);
                  }}
                  className="flex-1 px-6 py-4 min-h-14 bg-gray-100 text-onyx rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Cards */}
      <div className="space-y-4">
        {entries.length > 0 && (
          <p className="text-lg font-semibold text-gray-700">
            {entries.length} inspection{entries.length !== 1 ? "s" : ""} today
          </p>
        )}

        {entries.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              No inspections recorded yet
            </p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const resultOption = RESULT_OPTIONS.find(
              (r) => r.value === entry.result
            );
            const showFollowUp =
              entry.followUpItems &&
              (entry.result === "fail" || entry.result === "partial");

            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border-l-4 border-onyx"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(
                          entry.type
                        )}`}
                      >
                        {getTypeLabel(entry.type)}
                      </span>
                      {resultOption && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${resultOption.color}`}
                        >
                          {resultOption.label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-onyx mb-1">
                      {entry.inspectorName}
                    </h3>
                    <p className="text-base text-gray-600">{entry.company}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveInspection(index)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
                  >
                    <X className="w-6 h-6 text-onyx" />
                  </button>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 mb-4 text-base text-gray-700">
                  <Clock className="w-5 h-5" />
                  {formatTimeRange(entry.timeIn, entry.timeOut)}
                </div>

                {/* Notes */}
                {entry.notes && (
                  <div className="mb-4 p-4 bg-alabaster rounded-lg">
                    <p className="text-sm font-semibold text-onyx mb-1">
                      Notes
                    </p>
                    <p className="text-base text-gray-700">{entry.notes}</p>
                  </div>
                )}

                {/* Follow-Up Items */}
                {showFollowUp && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Follow-Up Items
                        </p>
                        <p className="text-base text-amber-900">
                          {entry.followUpItems}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
