"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  ChevronRight,
  Hammer,
  MapPin,
  Check,
} from "lucide-react";
import {
  WorkPerformedEntry,
  TaktZone,
  WorkStatus,
  CSIDivision,
  CSIActivity,
} from "@/lib/types";
import { CSI_DIVISIONS } from "@/data/csi-divisions";

interface WorkPerformedScreenProps {
  entries: WorkPerformedEntry[];
  onEntriesChange: (entries: WorkPerformedEntry[]) => void;
  taktZones: TaktZone[];
}

type ModalStep = "division" | "activity" | "zone" | "status" | "productivity" | "notes";

interface ModalState {
  isOpen: boolean;
  step: ModalStep;
  selectedDivision: CSIDivision | null;
  selectedActivity: CSIActivity | null;
  selectedZone: TaktZone | null;
  selectedStatus: WorkStatus | null;
  quantity?: number;
  unitOfMeasure?: string;
  crewSize?: number;
  crewHoursWorked?: number;
  percentComplete?: number;
  notes: string;
}

const statusConfig: Record<
  WorkStatus,
  { label: string; color: string; bgColor: string }
> = {
  in_progress: {
    label: "In Progress",
    color: "text-onyx",
    bgColor: "bg-accent-amber",
  },
  completed: {
    label: "Completed",
    color: "text-white",
    bgColor: "bg-accent-green",
  },
  starting_next_week: {
    label: "Starting Next Week",
    color: "text-white",
    bgColor: "bg-accent-violet",
  },
};

export default function WorkPerformedScreen({
  entries,
  onEntriesChange,
  taktZones,
}: WorkPerformedScreenProps) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    step: "division",
    selectedDivision: null,
    selectedActivity: null,
    selectedZone: null,
    selectedStatus: null,
    notes: "",
  });

  // Group takt zones by floor for display
  const zonesByFloor = taktZones.reduce(
    (acc, zone) => {
      if (!acc[zone.floor]) {
        acc[zone.floor] = [];
      }
      acc[zone.floor].push(zone);
      return acc;
    },
    {} as Record<string, TaktZone[]>
  );

  const openModal = () => {
    setModal({
      isOpen: true,
      step: "division",
      selectedDivision: null,
      selectedActivity: null,
      selectedZone: null,
      selectedStatus: null,
      quantity: undefined,
      unitOfMeasure: undefined,
      crewSize: undefined,
      crewHoursWorked: undefined,
      percentComplete: undefined,
      notes: "",
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      step: "division",
      selectedDivision: null,
      selectedActivity: null,
      selectedZone: null,
      selectedStatus: null,
      quantity: undefined,
      unitOfMeasure: undefined,
      crewSize: undefined,
      crewHoursWorked: undefined,
      percentComplete: undefined,
      notes: "",
    });
  };

  const handleDivisionSelect = (division: CSIDivision) => {
    setModal({
      ...modal,
      step: "activity",
      selectedDivision: division,
    });
  };

  const handleActivitySelect = (activity: CSIActivity) => {
    setModal({
      ...modal,
      step: "zone",
      selectedActivity: activity,
    });
  };

  const handleZoneSelect = (zone: TaktZone) => {
    setModal({
      ...modal,
      step: "status",
      selectedZone: zone,
    });
  };

  const handleStatusSelect = (status: WorkStatus) => {
    setModal({
      ...modal,
      step: "productivity",
      selectedStatus: status,
    });
  };

  const handleAddEntry = () => {
    if (
      !modal.selectedDivision ||
      !modal.selectedActivity ||
      !modal.selectedZone ||
      !modal.selectedStatus
    ) {
      return;
    }

    const newEntry: WorkPerformedEntry = {
      csiDivision: modal.selectedDivision.code,
      activity: modal.selectedActivity.name,
      taktZone: modal.selectedZone.zoneCode,
      status: modal.selectedStatus,
      ...(modal.notes && { notes: modal.notes }),
    };

    onEntriesChange([...entries, newEntry]);
    closeModal();
  };

  const handleRemoveEntry = (index: number) => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setModal({
      ...modal,
      notes: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white pb-safe-bottom">
      {/* Header with summary */}
      <div className="sticky top-0 z-10 bg-glass border-b border-white/[0.06] px-4 py-4 sm:px-6">
        <h2 className="font-heading font-semibold text-field-xl text-onyx mb-3">
          Work Performed
        </h2>
        <p className="text-field-sm text-warm-gray">
          {entries.length} work item{entries.length !== 1 ? "s" : ""} logged
        </p>
      </div>

      {/* Content area */}
      <div className="px-4 py-4 sm:px-6">
        {/* Add Work Item Button */}
        <button
          onClick={openModal}
          className="w-full min-h-touch-target rounded-card bg-accent-violet text-white transition-all duration-200 flex items-center justify-center gap-2 px-4 py-3 hover:bg-accent-violet/80 active:scale-[0.98] font-body font-semibold text-field-base mb-6"
        >
          <Plus size={20} />
          Add Work Item
        </button>

        {/* Work Items List */}
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="rounded-card bg-white border border-gray-100 px-4 py-8 text-center">
              <Hammer
                size={32}
                className="text-warm-gray mx-auto mb-2 opacity-50"
              />
              <p className="text-field-base text-warm-gray font-body">
                No work items logged yet
              </p>
              <p className="text-field-sm text-gray-400 font-body mt-1">
                Tap &quot;Add Work Item&quot; to start
              </p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={index}
                className="rounded-card bg-glass border border-white/[0.06] p-4 animate-fade-in"
              >
                {/* Header row: Division badge, Activity, Zone code */}
                <div className="flex items-start gap-3 mb-2">
                  {/* CSI Division Badge */}
                  <div className="flex-shrink-0 w-10 h-10 bg-accent-violet rounded flex items-center justify-center">
                    <span className="text-white font-heading font-semibold text-field-sm">
                      {entry.csiDivision}
                    </span>
                  </div>

                  {/* Activity and Zone info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-field-base text-onyx truncate">
                      {entry.activity}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-field-sm text-warm-gray">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{entry.taktZone}</span>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveEntry(index)}
                    className="flex-shrink-0 w-touch-min h-touch-min rounded-full flex items-center justify-center text-warm-gray hover:bg-alabaster transition-colors"
                    aria-label="Remove entry"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                      statusConfig[entry.status].bgColor
                    } ${statusConfig[entry.status].color}`}
                  >
                    {entry.status === "completed" && (
                      <Check size={14} className="flex-shrink-0" />
                    )}
                    <span className="text-field-sm font-semibold font-body">
                      {statusConfig[entry.status].label}
                    </span>
                  </div>
                </div>

                {/* Notes if present */}
                {entry.notes && (
                  <div className="bg-alabaster rounded px-3 py-2 mt-3">
                    <p className="text-field-sm text-onyx font-body break-words">
                      {entry.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-fade-in">
          {/* Modal Content */}
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Step 1: Select Division */}
            {modal.step === "division" && (
              <>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Select Division
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  Choose the CSI division for this work
                </p>
                <div className="space-y-2 mb-6">
                  {CSI_DIVISIONS.map((division) => (
                    <button
                      key={division.code}
                      onClick={() => handleDivisionSelect(division)}
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-card bg-glass hover:bg-glass-light transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-field-base text-onyx">
                          {division.code} &ndash; {division.name}
                        </p>
                      </div>
                      <ChevronRight
                        size={20}
                        className="flex-shrink-0 text-warm-gray"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 2: Select Activity */}
            {modal.step === "activity" && modal.selectedDivision && (
              <>
                <button
                  onClick={() => setModal({ ...modal, step: "division" })}
                  className="flex items-center gap-2 text-onyx font-body font-semibold text-field-sm mb-4 p-2 -mx-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  Back
                </button>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Select Activity
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  {modal.selectedDivision.code} &ndash; {modal.selectedDivision.name}
                </p>
                <div className="space-y-2 mb-6">
                  {modal.selectedDivision.activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleActivitySelect(activity)}
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-card bg-glass hover:bg-glass-light transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-field-base text-onyx">
                          {activity.name}
                        </p>
                        <p className="text-field-sm text-warm-gray mt-1">
                          {activity.tasks.length} task
                          {activity.tasks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={20}
                        className="flex-shrink-0 text-warm-gray"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 3: Select Takt Zone */}
            {modal.step === "zone" && modal.selectedActivity && (
              <>
                <button
                  onClick={() => setModal({ ...modal, step: "activity" })}
                  className="flex items-center gap-2 text-onyx font-body font-semibold text-field-sm mb-4 p-2 -mx-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  Back
                </button>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Select Takt Zone
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  Where is this work being performed?
                </p>
                <div className="space-y-4 mb-6">
                  {Object.entries(zonesByFloor).map(([floor, zones]) => (
                    <div key={floor}>
                      <h4 className="font-heading font-semibold text-field-sm text-onyx px-2 mb-2">
                        {floor}
                      </h4>
                      <div className="space-y-2">
                        {zones.map((zone) => (
                          <button
                            key={zone.id}
                            onClick={() => handleZoneSelect(zone)}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-card bg-alabaster hover:bg-gray-200 transition-colors text-left ml-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-heading font-semibold text-field-base text-onyx">
                                {zone.zoneName}
                              </p>
                              <p className="text-field-sm text-warm-gray mt-0.5">
                                {zone.zoneCode}
                              </p>
                            </div>
                            <ChevronRight
                              size={20}
                              className="flex-shrink-0 text-warm-gray"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 4: Select Status */}
            {modal.step === "status" && modal.selectedZone && (
              <>
                <button
                  onClick={() => setModal({ ...modal, step: "zone" })}
                  className="flex items-center gap-2 text-onyx font-body font-semibold text-field-sm mb-4 p-2 -mx-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  Back
                </button>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Work Status
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  How is this work progressing?
                </p>
                <div className="space-y-2 mb-6">
                  {(
                    Object.keys(statusConfig) as WorkStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={`w-full min-h-touch-target flex items-center justify-center gap-2 px-4 py-3 rounded-card transition-all duration-200 font-body font-semibold text-field-base ${
                        modal.selectedStatus === status
                          ? `${statusConfig[status].bgColor} ${statusConfig[status].color} ring-2 ring-offset-2 ring-accent-violet`
                          : `bg-glass text-onyx hover:bg-glass-light`
                      }`}
                    >
                      {status === "completed" && (
                        <Check size={18} className="flex-shrink-0" />
                      )}
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setModal({ ...modal, step: "productivity" })}
                  className="w-full min-h-touch-target rounded-card bg-accent-violet text-white transition-all duration-200 px-4 py-3 hover:bg-accent-violet/80 active:scale-[0.98] font-body font-semibold text-field-base mb-3"
                >
                  Continue
                </button>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 5: Productivity Tracking */}
            {modal.step === "productivity" && modal.selectedStatus && (
              <>
                <button
                  onClick={() => setModal({ ...modal, step: "status" })}
                  className="flex items-center gap-2 text-onyx font-body font-semibold text-field-sm mb-4 p-2 -mx-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  Back
                </button>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Productivity Tracking
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  Add productivity details (optional)
                </p>

                <div className="space-y-4 mb-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-field-sm font-semibold text-onyx mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={modal.quantity ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setModal({ ...modal, quantity: val });
                      }}
                      placeholder="Enter quantity"
                      className="w-full px-4 py-3 rounded-card border border-white/[0.10] font-body text-field-base text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div>
                    <label className="block text-field-sm font-semibold text-onyx mb-2">
                      Unit of Measure
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["SF", "LF", "CY", "EA", "TON", "LS"].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => {
                            setModal({
                              ...modal,
                              unitOfMeasure:
                                modal.unitOfMeasure === unit ? undefined : unit,
                            });
                          }}
                          className={`py-2 px-3 rounded-card text-field-sm font-medium transition-all ${
                            modal.unitOfMeasure === unit
                              ? "bg-accent-violet text-white"
                              : "bg-glass text-onyx hover:bg-glass-light"
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crew Size */}
                  <div>
                    <label className="block text-field-sm font-semibold text-onyx mb-2">
                      Crew Size
                    </label>
                    <input
                      type="number"
                      value={modal.crewSize ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                        setModal({ ...modal, crewSize: val });
                      }}
                      placeholder="Number of workers"
                      className="w-full px-4 py-3 rounded-card border border-white/[0.10] font-body text-field-base text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass"
                      min="0"
                    />
                  </div>

                  {/* Crew Hours Worked */}
                  <div>
                    <label className="block text-field-sm font-semibold text-onyx mb-2">
                      Crew Hours Worked
                    </label>
                    <input
                      type="number"
                      value={modal.crewHoursWorked ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setModal({ ...modal, crewHoursWorked: val });
                      }}
                      placeholder="Total crew hours"
                      className="w-full px-4 py-3 rounded-card border border-white/[0.10] font-body text-field-base text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  {/* Percent Complete */}
                  <div>
                    <label className="block text-field-sm font-semibold text-onyx mb-2">
                      Percent Complete (0-100)
                    </label>
                    <input
                      type="number"
                      value={modal.percentComplete ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                        setModal({ ...modal, percentComplete: Math.max(0, Math.min(100, val ?? 0)) });
                      }}
                      placeholder="0-100"
                      className="w-full px-4 py-3 rounded-card border border-white/[0.10] font-body text-field-base text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setModal({ ...modal, step: "notes" })}
                  className="w-full min-h-touch-target rounded-card bg-accent-violet text-white transition-all duration-200 px-4 py-3 hover:bg-accent-violet/80 active:scale-[0.98] font-body font-semibold text-field-base mb-3"
                >
                  Continue
                </button>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 6: Add Notes */}
            {modal.step === "notes" && modal.selectedStatus && (
              <>
                <button
                  onClick={() => setModal({ ...modal, step: "productivity" })}
                  className="flex items-center gap-2 text-onyx font-body font-semibold text-field-sm mb-4 p-2 -mx-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  Back
                </button>
                <h3 className="font-heading font-semibold text-field-xl text-onyx mb-1">
                  Additional Notes
                </h3>
                <p className="text-field-sm text-warm-gray mb-6 font-body">
                  Add any notes about this work item (optional)
                </p>

                {/* Notes summary */}
                <div className="bg-glass rounded-card p-4 mb-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-field-sm font-semibold text-onyx flex-shrink-0 w-16">
                      Division:
                    </span>
                    <span className="text-field-sm text-onyx font-body">
                      {modal.selectedDivision?.code} &ndash;{" "}
                      {modal.selectedDivision?.name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-field-sm font-semibold text-onyx flex-shrink-0 w-16">
                      Activity:
                    </span>
                    <span className="text-field-sm text-onyx font-body">
                      {modal.selectedActivity?.name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-field-sm font-semibold text-onyx flex-shrink-0 w-16">
                      Zone:
                    </span>
                    <span className="text-field-sm text-onyx font-body">
                      {modal.selectedZone?.zoneCode} &ndash;{" "}
                      {modal.selectedZone?.zoneName}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-field-sm font-semibold text-onyx flex-shrink-0 w-16">
                      Status:
                    </span>
                    <span
                      className={`text-field-sm font-semibold ${
                        statusConfig[modal.selectedStatus].color
                      }`}
                    >
                      {statusConfig[modal.selectedStatus].label}
                    </span>
                  </div>
                </div>

                {/* Notes textarea */}
                <textarea
                  value={modal.notes}
                  onChange={handleNotesChange}
                  placeholder="Enter any additional notes..."
                  className="w-full px-4 py-3 rounded-card border border-gray-200 font-body text-field-base text-onyx placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-onyx mb-6 min-h-[120px] resize-none"
                />

                {/* Add Button */}
                <button
                  onClick={handleAddEntry}
                  className="w-full min-h-touch-target rounded-card bg-accent-green text-white transition-all duration-200 px-4 py-3 hover:bg-accent-green/90 active:scale-[0.98] font-body font-semibold text-field-base mb-3 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Add Work Item
                </button>
                <button
                  onClick={closeModal}
                  className="w-full min-h-touch-target rounded-card bg-glass-medium text-onyx transition-all duration-200 px-4 py-3 hover:bg-glass-heavy active:scale-[0.98] font-body font-semibold text-field-base"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
