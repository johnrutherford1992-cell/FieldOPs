"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  X,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react";
import type {
  RFIEntry,
  RFIStatus,
  SubmittalEntry,
  SubmittalStatus,
} from "@/lib/types";

interface RFISubmittalScreenProps {
  rfis: RFIEntry[];
  submittals: SubmittalEntry[];
  onRFIsChange: (rfis: RFIEntry[]) => void;
  onSubmittalsChange: (submittals: SubmittalEntry[]) => void;
}

type TabType = "rfis" | "submittals";

interface RFIFormData {
  rfiNumber: string;
  subject: string;
  responsibleParty: string;
  dateSubmitted: string;
  status: RFIStatus;
  fieldImpact: boolean;
  notes: string;
}

interface SubmittalFormData {
  submittalNumber: string;
  description: string;
  specSection: string;
  status: SubmittalStatus;
  scheduleImpact: boolean;
  notes: string;
}

const RFI_STATUS_COLORS: Record<RFIStatus, string> = {
  open: "bg-amber-100 text-amber-700",
  answered: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

const RFI_STATUS_LABELS: Record<RFIStatus, string> = {
  open: "Open",
  answered: "Answered",
  overdue: "Overdue",
};

const SUBMITTAL_STATUS_COLORS: Record<SubmittalStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-700",
  approved_as_noted: "bg-amber-100 text-amber-700",
  revise_resubmit: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
};

const SUBMITTAL_STATUS_LABELS: Record<SubmittalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  approved_as_noted: "Approved as Noted",
  revise_resubmit: "Revise & Resubmit",
  rejected: "Rejected",
};

function RFISubmittalScreen({
  rfis,
  submittals,
  onRFIsChange,
  onSubmittalsChange,
}: RFISubmittalScreenProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>("rfis");
  const [showRFIForm, setShowRFIForm] = useState(false);
  const [showSubmittalForm, setShowSubmittalForm] = useState(false);

  const [rfiFormData, setRFIFormData] = useState<RFIFormData>({
    rfiNumber: "",
    subject: "",
    responsibleParty: "",
    dateSubmitted: new Date().toISOString().split("T")[0],
    status: "open",
    fieldImpact: false,
    notes: "",
  });

  const [submittalFormData, setSubmittalFormData] = useState<SubmittalFormData>({
    submittalNumber: "",
    description: "",
    specSection: "",
    status: "pending",
    scheduleImpact: false,
    notes: "",
  });

  // RFI summary stats
  const rfiStats = useMemo(() => {
    const open = rfis.filter((r) => r.status === "open").length;
    const overdue = rfis.filter((r) => r.status === "overdue").length;
    return { open, overdue };
  }, [rfis]);

  // Submittal summary stats
  const submittalStats = useMemo(() => {
    const pending = submittals.filter((s) => s.status === "pending").length;
    const needsAction = submittals.filter(
      (s) =>
        s.status === "revise_resubmit" ||
        s.status === "rejected"
    ).length;
    return { pending, needsAction };
  }, [submittals]);

  // RFI handlers
  const handleAddRFI = (): void => {
    if (!rfiFormData.rfiNumber.trim() || !rfiFormData.subject.trim()) {
      return;
    }

    const newRFI: RFIEntry = {
      rfiNumber: rfiFormData.rfiNumber,
      subject: rfiFormData.subject,
      responsibleParty: rfiFormData.responsibleParty,
      dateSubmitted: rfiFormData.dateSubmitted,
      daysOpen: 0,
      status: rfiFormData.status,
      fieldImpact: rfiFormData.fieldImpact,
      notes: rfiFormData.notes || undefined,
    };

    onRFIsChange([...rfis, newRFI]);
    setRFIFormData({
      rfiNumber: "",
      subject: "",
      responsibleParty: "",
      dateSubmitted: new Date().toISOString().split("T")[0],
      status: "open",
      fieldImpact: false,
      notes: "",
    });
    setShowRFIForm(false);
  };

  const handleRemoveRFI = (rfiNumber: string): void => {
    onRFIsChange(rfis.filter((r) => r.rfiNumber !== rfiNumber));
  };

  // Submittal handlers
  const handleAddSubmittal = (): void => {
    if (
      !submittalFormData.submittalNumber.trim() ||
      !submittalFormData.description.trim()
    ) {
      return;
    }

    const newSubmittal: SubmittalEntry = {
      submittalNumber: submittalFormData.submittalNumber,
      description: submittalFormData.description,
      specSection: submittalFormData.specSection,
      status: submittalFormData.status,
      scheduleImpact: submittalFormData.scheduleImpact,
      notes: submittalFormData.notes || undefined,
    };

    onSubmittalsChange([...submittals, newSubmittal]);
    setSubmittalFormData({
      submittalNumber: "",
      description: "",
      specSection: "",
      status: "pending",
      scheduleImpact: false,
      notes: "",
    });
    setShowSubmittalForm(false);
  };

  const handleRemoveSubmittal = (submittalNumber: string): void => {
    onSubmittalsChange(
      submittals.filter((s) => s.submittalNumber !== submittalNumber)
    );
  };

  // RFI status pill button
  const RFIStatusPill = ({
    status,
    isSelected,
  }: {
    status: RFIStatus;
    isSelected: boolean;
  }): React.ReactElement => (
    <button
      onClick={() =>
        setRFIFormData({ ...rfiFormData, status: status })
      }
      className={`px-4 py-2 rounded-full text-field-sm font-medium transition-all ${
        isSelected
          ? `${RFI_STATUS_COLORS[status]} ring-2 ring-onyx`
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {RFI_STATUS_LABELS[status]}
    </button>
  );

  // Submittal status pill button
  const SubmittalStatusPill = ({
    status,
    isSelected,
  }: {
    status: SubmittalStatus;
    isSelected: boolean;
  }): React.ReactElement => (
    <button
      onClick={() =>
        setSubmittalFormData({ ...submittalFormData, status: status })
      }
      className={`px-4 py-2 rounded-full text-field-sm font-medium transition-all ${
        isSelected
          ? `${SUBMITTAL_STATUS_COLORS[status]} ring-2 ring-onyx`
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {SUBMITTAL_STATUS_LABELS[status]}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-alabaster">
      {/* Tab navigation */}
      <div className="sticky top-0 bg-glass border-b border-white/[0.06] px-4 py-3 z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("rfis")}
            className={`px-6 py-3 rounded-full text-field-base font-semibold transition-all min-h-[56px] flex items-center ${
              activeTab === "rfis"
                ? "bg-accent-violet text-white"
                : "bg-glass text-onyx hover:bg-glass-light"
            }`}
          >
            RFIs
          </button>
          <button
            onClick={() => setActiveTab("submittals")}
            className={`px-6 py-3 rounded-full text-field-base font-semibold transition-all min-h-[56px] flex items-center ${
              activeTab === "submittals"
                ? "bg-accent-violet text-white"
                : "bg-glass text-onyx hover:bg-glass-light"
            }`}
          >
            Submittals
          </button>
        </div>
      </div>

      {/* RFI Tab Content */}
      {activeTab === "rfis" && (
        <div className="flex flex-col h-full">
          {/* Summary */}
          {rfis.length > 0 && (
            <div className="bg-glass px-4 py-3 border-b border-white/[0.06]">
              <div className="text-field-sm font-medium text-onyx">
                {rfiStats.open} open · {rfiStats.overdue} overdue
              </div>
            </div>
          )}

          {/* Add RFI button */}
          <div className="px-4 py-4">
            <button
              onClick={() => setShowRFIForm(true)}
              className="w-full min-h-[56px] bg-accent-violet text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold text-field-base hover:bg-accent-violet/80 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add RFI
            </button>
          </div>

          {/* RFI List */}
          <div className="flex-1 overflow-y-auto">
            {rfis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <div className="text-onyx opacity-40 mb-4">
                  <FileText className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-onyx font-medium mb-2">No RFIs Yet</p>
                <p className="text-warm-gray text-field-sm">
                  Add your first RFI to get started
                </p>
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-3">
                {rfis.map((rfi) => (
                  <div
                    key={rfi.rfiNumber}
                    className="bg-glass rounded-xl p-4 border border-white/[0.06]"
                  >
                    {/* Header with badge and remove button */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-accent-violet text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-field-sm">
                          {rfi.rfiNumber.slice(-2)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-onyx text-field-base">
                            {rfi.subject}
                          </h3>
                          <p className="text-warm-gray text-field-sm mt-1">
                            {rfi.responsibleParty}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveRFI(rfi.rfiNumber)}
                        className="text-warm-gray hover:text-onyx transition-colors"
                        aria-label="Remove RFI"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Status and days open */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-field-sm font-medium ${
                          RFI_STATUS_COLORS[rfi.status]
                        }`}
                      >
                        {RFI_STATUS_LABELS[rfi.status]}
                      </span>
                      <span className="flex items-center gap-1 text-warm-gray text-field-sm">
                        <Clock className="w-4 h-4" />
                        {rfi.daysOpen} day{rfi.daysOpen !== 1 ? "s" : ""} open
                      </span>
                      {rfi.fieldImpact && (
                        <span className="flex items-center gap-1 text-red-600 text-field-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          Field Impact
                        </span>
                      )}
                    </div>

                    {/* Notes if present */}
                    {rfi.notes && (
                      <p className="text-field-sm text-onyx bg-glass rounded-lg p-2 border border-white/[0.06]">
                        {rfi.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submittal Tab Content */}
      {activeTab === "submittals" && (
        <div className="flex flex-col h-full">
          {/* Summary */}
          {submittals.length > 0 && (
            <div className="bg-glass px-4 py-3 border-b border-white/[0.06]">
              <div className="text-field-sm font-medium text-onyx">
                {submittalStats.pending} pending · {submittalStats.needsAction}{" "}
                needs action
              </div>
            </div>
          )}

          {/* Add Submittal button */}
          <div className="px-4 py-4">
            <button
              onClick={() => setShowSubmittalForm(true)}
              className="w-full min-h-[56px] bg-accent-violet text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold text-field-base hover:bg-accent-violet/80 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Submittal
            </button>
          </div>

          {/* Submittal List */}
          <div className="flex-1 overflow-y-auto">
            {submittals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <div className="text-onyx opacity-40 mb-4">
                  <FileText className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-onyx font-medium mb-2">No Submittals Yet</p>
                <p className="text-warm-gray text-field-sm">
                  Add your first submittal to get started
                </p>
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-3">
                {submittals.map((submittal) => (
                  <div
                    key={submittal.submittalNumber}
                    className="bg-glass rounded-xl p-4 border border-white/[0.06]"
                  >
                    {/* Header with badge and remove button */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-accent-violet text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-field-sm">
                          {submittal.submittalNumber.slice(-2)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-onyx text-field-base">
                            {submittal.description}
                          </h3>
                          <p className="text-warm-gray text-field-sm mt-1">
                            Section {submittal.specSection}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveSubmittal(submittal.submittalNumber)
                        }
                        className="text-warm-gray hover:text-onyx transition-colors"
                        aria-label="Remove Submittal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Status and schedule impact */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-field-sm font-medium ${
                          SUBMITTAL_STATUS_COLORS[submittal.status]
                        }`}
                      >
                        {SUBMITTAL_STATUS_LABELS[submittal.status]}
                      </span>
                      {submittal.scheduleImpact && (
                        <span className="flex items-center gap-1 text-red-600 text-field-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          Schedule Impact
                        </span>
                      )}
                    </div>

                    {/* Notes if present */}
                    {submittal.notes && (
                      <p className="text-field-sm text-onyx bg-glass rounded-lg p-2 border border-white/[0.06]">
                        {submittal.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RFI Modal Form */}
      {showRFIForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50">
          <div className="w-full bg-alabaster rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-field-2xl font-bold text-onyx">Add RFI</h2>
              <button
                onClick={() => setShowRFIForm(false)}
                className="text-warm-gray hover:text-onyx transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* RFI Number */}
              <div>
                <label
                  htmlFor="rfi-number"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  RFI Number
                </label>
                <input
                  id="rfi-number"
                  type="text"
                  value={rfiFormData.rfiNumber}
                  onChange={(e) =>
                    setRFIFormData({
                      ...rfiFormData,
                      rfiNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., RFI-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="rfi-subject"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Subject
                </label>
                <input
                  id="rfi-subject"
                  type="text"
                  value={rfiFormData.subject}
                  onChange={(e) =>
                    setRFIFormData({ ...rfiFormData, subject: e.target.value })
                  }
                  placeholder="RFI subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Responsible Party */}
              <div>
                <label
                  htmlFor="rfi-party"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Responsible Party
                </label>
                <input
                  id="rfi-party"
                  type="text"
                  value={rfiFormData.responsibleParty}
                  onChange={(e) =>
                    setRFIFormData({
                      ...rfiFormData,
                      responsibleParty: e.target.value,
                    })
                  }
                  placeholder="Name or company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Date Submitted */}
              <div>
                <label
                  htmlFor="rfi-date"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Date Submitted
                </label>
                <input
                  id="rfi-date"
                  type="date"
                  value={rfiFormData.dateSubmitted}
                  onChange={(e) =>
                    setRFIFormData({
                      ...rfiFormData,
                      dateSubmitted: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-field-sm font-semibold text-onyx mb-3">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  <RFIStatusPill
                    status="open"
                    isSelected={rfiFormData.status === "open"}
                  />
                  <RFIStatusPill
                    status="answered"
                    isSelected={rfiFormData.status === "answered"}
                  />
                  <RFIStatusPill
                    status="overdue"
                    isSelected={rfiFormData.status === "overdue"}
                  />
                </div>
              </div>

              {/* Field Impact Toggle */}
              <div>
                <label className="block text-field-sm font-semibold text-onyx mb-3">
                  Field Impact
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setRFIFormData({ ...rfiFormData, fieldImpact: true })
                    }
                    className={`flex-1 py-3 rounded-xl text-field-base font-semibold min-h-[56px] transition-all ${
                      rfiFormData.fieldImpact
                        ? "bg-red-100 text-red-700 ring-2 ring-onyx"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      setRFIFormData({ ...rfiFormData, fieldImpact: false })
                    }
                    className={`flex-1 py-3 rounded-xl text-field-base font-semibold min-h-[56px] transition-all ${
                      !rfiFormData.fieldImpact
                        ? "bg-green-100 text-green-700 ring-2 ring-onyx"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="rfi-notes"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="rfi-notes"
                  value={rfiFormData.notes}
                  onChange={(e) =>
                    setRFIFormData({ ...rfiFormData, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRFIForm(false)}
                className="flex-1 min-h-[56px] px-4 py-3 border border-gray-300 rounded-xl text-field-base font-semibold text-onyx hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRFI}
                className="flex-1 min-h-[56px] px-4 py-3 bg-onyx rounded-xl text-field-base font-semibold text-white hover:bg-opacity-90 transition-colors"
              >
                Add RFI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submittal Modal Form */}
      {showSubmittalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50">
          <div className="w-full bg-alabaster rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-field-2xl font-bold text-onyx">
                Add Submittal
              </h2>
              <button
                onClick={() => setShowSubmittalForm(false)}
                className="text-warm-gray hover:text-onyx transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Submittal Number */}
              <div>
                <label
                  htmlFor="submittal-number"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Submittal Number
                </label>
                <input
                  id="submittal-number"
                  type="text"
                  value={submittalFormData.submittalNumber}
                  onChange={(e) =>
                    setSubmittalFormData({
                      ...submittalFormData,
                      submittalNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., SUB-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="submittal-description"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Description
                </label>
                <input
                  id="submittal-description"
                  type="text"
                  value={submittalFormData.description}
                  onChange={(e) =>
                    setSubmittalFormData({
                      ...submittalFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Submittal description"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Spec Section */}
              <div>
                <label
                  htmlFor="submittal-section"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Spec Section
                </label>
                <input
                  id="submittal-section"
                  type="text"
                  value={submittalFormData.specSection}
                  onChange={(e) =>
                    setSubmittalFormData({
                      ...submittalFormData,
                      specSection: e.target.value,
                    })
                  }
                  placeholder="e.g., 03.30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-field-sm font-semibold text-onyx mb-3">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  <SubmittalStatusPill
                    status="pending"
                    isSelected={submittalFormData.status === "pending"}
                  />
                  <SubmittalStatusPill
                    status="approved"
                    isSelected={submittalFormData.status === "approved"}
                  />
                  <SubmittalStatusPill
                    status="approved_as_noted"
                    isSelected={
                      submittalFormData.status === "approved_as_noted"
                    }
                  />
                  <SubmittalStatusPill
                    status="revise_resubmit"
                    isSelected={submittalFormData.status === "revise_resubmit"}
                  />
                  <SubmittalStatusPill
                    status="rejected"
                    isSelected={submittalFormData.status === "rejected"}
                  />
                </div>
              </div>

              {/* Schedule Impact Toggle */}
              <div>
                <label className="block text-field-sm font-semibold text-onyx mb-3">
                  Schedule Impact
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSubmittalFormData({
                        ...submittalFormData,
                        scheduleImpact: true,
                      })
                    }
                    className={`flex-1 py-3 rounded-xl text-field-base font-semibold min-h-[56px] transition-all ${
                      submittalFormData.scheduleImpact
                        ? "bg-red-100 text-red-700 ring-2 ring-onyx"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      setSubmittalFormData({
                        ...submittalFormData,
                        scheduleImpact: false,
                      })
                    }
                    className={`flex-1 py-3 rounded-xl text-field-base font-semibold min-h-[56px] transition-all ${
                      !submittalFormData.scheduleImpact
                        ? "bg-green-100 text-green-700 ring-2 ring-onyx"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="submittal-notes"
                  className="block text-field-sm font-semibold text-onyx mb-2"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="submittal-notes"
                  value={submittalFormData.notes}
                  onChange={(e) =>
                    setSubmittalFormData({
                      ...submittalFormData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-field-base focus:outline-none focus:ring-2 focus:ring-onyx min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmittalForm(false)}
                className="flex-1 min-h-[56px] px-4 py-3 border border-gray-300 rounded-xl text-field-base font-semibold text-onyx hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmittal}
                className="flex-1 min-h-[56px] px-4 py-3 bg-onyx rounded-xl text-field-base font-semibold text-white hover:bg-opacity-90 transition-colors"
              >
                Add Submittal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom note */}
      <div className="bg-glass border-t border-white/[0.06] px-4 py-4 text-center text-field-sm text-warm-gray">
        Procore integration coming soon — entries are manual for now
      </div>
    </div>
  );
}

export default RFISubmittalScreen;
