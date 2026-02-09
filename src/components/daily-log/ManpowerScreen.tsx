"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Minus,
  X,
  UserPlus,
  HardHat,
} from "lucide-react";
import type { ManpowerEntry, Subcontractor } from "@/lib/types";

interface ManpowerScreenProps {
  entries: ManpowerEntry[];
  onEntriesChange: (entries: ManpowerEntry[]) => void;
  subcontractors: Subcontractor[];
}

export default function ManpowerScreen({
  entries,
  onEntriesChange,
  subcontractors,
}: ManpowerScreenProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate total headcount
  const totalHeadcount = entries.reduce(
    (sum, entry) =>
      sum + entry.journeymanCount + entry.apprenticeCount + entry.foremanCount,
    0
  );

  // Handle adding a new trade entry
  const handleAddTrade = (subcontractor: Subcontractor) => {
    const newEntry: ManpowerEntry = {
      subId: subcontractor.id,
      trade: subcontractor.trade,
      journeymanCount: 0,
      apprenticeCount: 0,
      foremanCount: 0,
    };
    onEntriesChange([...entries, newEntry]);
    setShowAddModal(false);
  };

  // Handle removing a trade entry
  const handleRemoveEntry = (index: number) => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  // Handle incrementing a count
  const handleIncrement = (
    index: number,
    field: "journeymanCount" | "apprenticeCount" | "foremanCount"
  ) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      [field]: updated[index][field] + 1,
    };
    onEntriesChange(updated);
  };

  // Handle decrementing a count
  const handleDecrement = (
    index: number,
    field: "journeymanCount" | "apprenticeCount" | "foremanCount"
  ) => {
    const updated = [...entries];
    if (updated[index][field] > 0) {
      updated[index] = {
        ...updated[index],
        [field]: updated[index][field] - 1,
      };
      onEntriesChange(updated);
    }
  };

  // Get subcontractor company name from entries
  const getSubcontractorName = (subId: string): string => {
    const sub = subcontractors.find((s) => s.id === subId);
    return sub?.company || "Unknown";
  };

  // Get list of subs already added to avoid duplicates (optional filtering)
  const addedSubIds = entries.map((e) => e.subId);
  const availableSubcontractors = subcontractors.filter(
    (sub) => !addedSubIds.includes(sub.id)
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Total Headcount Summary Bar */}
      <div className="bg-onyx text-white px-4 py-4 rounded-card shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-alabaster" />
            <div>
              <p className="text-field-sm text-alabaster font-body">
                Total Workers On Site
              </p>
              <p className="text-field-3xl font-heading font-semibold text-white">
                {totalHeadcount}
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
              <HardHat size={40} className="text-warm-gray" />
            </div>
            <h3 className="text-field-lg font-heading font-semibold text-onyx mb-2 text-center">
              No Trades Added
            </h3>
            <p className="text-field-sm text-warm-gray font-body text-center max-w-xs">
              Tap &apos;Add Trade&apos; to record who&apos;s on site today
            </p>
          </div>
        ) : (
          // Trade Entries
          entries.map((entry, index) => (
            <div
              key={`${entry.subId}-${index}`}
              className="bg-alabaster rounded-xl p-5 shadow-card"
            >
              {/* Card Header with Company and Trade */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1">
                  <h3 className="text-field-base font-heading font-semibold text-onyx">
                    {getSubcontractorName(entry.subId)}
                  </h3>
                  <p className="text-field-sm text-warm-gray font-body mt-1">
                    {entry.trade}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveEntry(index)}
                  className="
                    flex items-center justify-center w-10 h-10 rounded-button
                    bg-white text-onyx hover:bg-gray-100 active:scale-[0.95]
                    transition-all ml-3 flex-shrink-0
                  "
                  aria-label="Remove trade entry"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Stepper Controls */}
              <div className="space-y-4">
                {/* Journeyman */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Journeyman
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(index, "journeymanCount")}
                      disabled={entry.journeymanCount === 0}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-gray-200 text-onyx font-semibold text-field-lg
                        hover:bg-gray-300 active:scale-[0.95] transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                      aria-label="Decrease journeyman count"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="text-field-xl font-semibold text-onyx min-w-14 text-center">
                      {entry.journeymanCount}
                    </div>
                    <button
                      onClick={() => handleIncrement(index, "journeymanCount")}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-onyx text-white font-semibold text-field-lg
                        hover:bg-slate active:scale-[0.95] transition-all
                      "
                      aria-label="Increase journeyman count"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Apprentice */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Apprentice
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(index, "apprenticeCount")}
                      disabled={entry.apprenticeCount === 0}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-gray-200 text-onyx font-semibold text-field-lg
                        hover:bg-gray-300 active:scale-[0.95] transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                      aria-label="Decrease apprentice count"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="text-field-xl font-semibold text-onyx min-w-14 text-center">
                      {entry.apprenticeCount}
                    </div>
                    <button
                      onClick={() => handleIncrement(index, "apprenticeCount")}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-onyx text-white font-semibold text-field-lg
                        hover:bg-slate active:scale-[0.95] transition-all
                      "
                      aria-label="Increase apprentice count"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Foreman */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Foreman
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(index, "foremanCount")}
                      disabled={entry.foremanCount === 0}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-gray-200 text-onyx font-semibold text-field-lg
                        hover:bg-gray-300 active:scale-[0.95] transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                      aria-label="Decrease foreman count"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="text-field-xl font-semibold text-onyx min-w-14 text-center">
                      {entry.foremanCount}
                    </div>
                    <button
                      onClick={() => handleIncrement(index, "foremanCount")}
                      className="
                        flex items-center justify-center w-14 h-14 rounded-button
                        bg-onyx text-white font-semibold text-field-lg
                        hover:bg-slate active:scale-[0.95] transition-all
                      "
                      aria-label="Increase foreman count"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Hours Worked */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    value={entry.hoursWorked ?? 8}
                    onChange={(e) => {
                      const updated = [...entries];
                      updated[index] = {
                        ...updated[index],
                        hoursWorked: parseFloat(e.target.value) || 0,
                      };
                      onEntriesChange(updated);
                    }}
                    className="w-20 px-2 py-2 rounded-button border border-gray-200 text-field-base text-center font-semibold"
                    min="0"
                    step="0.5"
                  />
                </div>

                {/* Overtime Hours */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    value={entry.overtimeHours ?? 0}
                    onChange={(e) => {
                      const updated = [...entries];
                      updated[index] = {
                        ...updated[index],
                        overtimeHours: parseFloat(e.target.value) || 0,
                      };
                      onEntriesChange(updated);
                    }}
                    className="w-20 px-2 py-2 rounded-button border border-gray-200 text-field-base text-center font-semibold"
                    min="0"
                    step="0.5"
                  />
                </div>

                {/* Start Time */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={entry.startTime ?? ""}
                    onChange={(e) => {
                      const updated = [...entries];
                      updated[index] = {
                        ...updated[index],
                        startTime: e.target.value || undefined,
                      };
                      onEntriesChange(updated);
                    }}
                    className="w-28 px-2 py-2 rounded-button border border-gray-200 text-field-base text-center font-semibold"
                  />
                </div>

                {/* End Time */}
                <div className="flex items-center justify-between">
                  <label className="text-field-sm font-body text-onyx font-semibold">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={entry.endTime ?? ""}
                    onChange={(e) => {
                      const updated = [...entries];
                      updated[index] = {
                        ...updated[index],
                        endTime: e.target.value || undefined,
                      };
                      onEntriesChange(updated);
                    }}
                    className="w-28 px-2 py-2 rounded-button border border-gray-200 text-field-base text-center font-semibold"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Trade Button */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => setShowAddModal(true)}
          className="
            w-full flex items-center justify-center gap-2 px-6 py-4
            rounded-button bg-onyx text-white text-field-base font-semibold
            font-body transition-all active:scale-[0.98] hover:bg-slate
          "
        >
          <UserPlus size={24} />
          <span>Add Trade</span>
        </button>
      </div>

      {/* Add Trade Modal/Dropdown */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end">
          <div
            className="w-full bg-white rounded-t-2xl shadow-lg max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-field-lg font-heading font-semibold text-onyx">
                Select a Trade
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="
                  flex items-center justify-center w-10 h-10 rounded-button
                  bg-alabaster text-onyx hover:bg-gray-200 active:scale-[0.95]
                  transition-all
                "
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-4 space-y-2">
              {availableSubcontractors.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-field-base text-warm-gray font-body">
                    All trades have been added
                  </p>
                </div>
              ) : (
                availableSubcontractors.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleAddTrade(sub)}
                    className="
                      w-full text-left px-4 py-4 rounded-card
                      bg-alabaster hover:bg-gray-200 active:bg-gray-300
                      transition-all active:scale-[0.98]
                      border border-gray-200
                    "
                  >
                    <h3 className="text-field-base font-heading font-semibold text-onyx mb-1">
                      {sub.company}
                    </h3>
                    <p className="text-field-sm text-warm-gray font-body">
                      {sub.trade}
                    </p>
                    {sub.contractStatus !== "awarded" && (
                      <p className="text-field-sm text-accent-amber font-semibold mt-2">
                        Status: {sub.contractStatus.replace("_", " ")}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer with Close Button */}
            <div className="sticky bottom-0 px-4 py-4 bg-white border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="
                  w-full px-6 py-4 rounded-button bg-gray-200 text-onyx
                  text-field-base font-semibold font-body transition-all
                  active:scale-[0.98] hover:bg-gray-300
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
