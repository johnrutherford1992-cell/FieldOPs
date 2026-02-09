"use client";

import { useState, useCallback, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import { useAppStore } from "@/lib/store";
import { db, generateId, getNoticeLogsForProject } from "@/lib/db";
import type { NoticeLogEntry, NoticeType, DeliveryMethod } from "@/lib/types";
import {
  FileText,
  Plus,
  Send,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from "lucide-react";

type FilterType = NoticeType | "All" | "Response Due";

interface CreateNoticeForm {
  noticeType: NoticeType;
  sentTo: string;
  sentFrom: string;
  dateSent: string;
  deliveryMethod: DeliveryMethod;
  contractClause: string;
  responseRequired: boolean;
  responseDeadline: string;
  content: string;
}

const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  delay: "Delay",
  claim: "Claim",
  backcharge: "Backcharge",
  cure: "Cure",
  change_directive: "Change Directive",
  termination_warning: "Termination",
  constructive_acceleration: "Acceleration",
};

const NOTICE_TYPE_COLORS: Record<
  NoticeType,
  { bg: string; text: string; border: string }
> = {
  delay: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  claim: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  backcharge: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  cure: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
  change_directive: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  termination_warning: {
    bg: "bg-red-100",
    text: "text-red-900",
    border: "border-red-300",
  },
  constructive_acceleration: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
};

const DELIVERY_METHOD_ICONS: Record<DeliveryMethod, React.ReactNode> = {
  email: <Send size={16} />,
  certified_mail: <Mail size={16} />,
  hand_delivered: <Clock size={16} />,
};

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  email: "Email",
  certified_mail: "Certified Mail",
  hand_delivered: "Hand Delivered",
};

export default function NoticeLogPage() {
  const { activeProject } = useAppStore();

  // State
  const [notices, setNotices] = useState<NoticeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateNoticeForm>({
    noticeType: "delay",
    sentTo: "",
    sentFrom: activeProject?.teamMembers?.[0]?.name || "",
    dateSent: new Date().toISOString().split("T")[0],
    deliveryMethod: "email",
    contractClause: "",
    responseRequired: false,
    responseDeadline: "",
    content: "",
  });

  // Load notices on mount
  useEffect(() => {
    const loadNotices = async () => {
      if (!activeProject) return;
      setIsLoading(true);
      try {
        const data = await getNoticeLogsForProject(activeProject.id);
        setNotices(data.sort((a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime()));
      } catch (err) {
        console.error("Failed to load notices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, [activeProject]);

  // Update sentFrom when project changes
  useEffect(() => {
    const firstName = activeProject?.teamMembers?.[0]?.name;
    if (firstName) {
      setForm((prev) => ({
        ...prev,
        sentFrom: firstName,
      }));
    }
  }, [activeProject]);

  // Filter notices
  const filteredNotices = useCallback(() => {
    if (activeFilter === "All") {
      return notices;
    }

    if (activeFilter === "Response Due") {
      return notices.filter(
        (n) =>
          n.responseRequired &&
          !n.responseReceived &&
          n.responseDeadline &&
          new Date(n.responseDeadline) < new Date()
      );
    }

    return notices.filter((n) => n.noticeType === activeFilter);
  }, [notices, activeFilter]);

  const filteredList = filteredNotices();

  // Calculate stats
  const overdue = notices.filter(
    (n) =>
      n.responseRequired &&
      !n.responseReceived &&
      n.responseDeadline &&
      new Date(n.responseDeadline) < new Date()
  );

  const pendingResponse = notices.filter(
    (n) => n.responseRequired && !n.responseReceived
  );

  // Handle save
  const handleSave = async () => {
    if (!activeProject) return;

    if (!form.sentTo || !form.sentFrom || !form.dateSent) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const newNotice: NoticeLogEntry = {
        id: generateId("notice"),
        projectId: activeProject.id,
        noticeType: form.noticeType,
        sentTo: form.sentTo,
        sentFrom: form.sentFrom,
        dateSent: form.dateSent,
        deliveryMethod: form.deliveryMethod,
        contractClause: form.contractClause || undefined,
        responseRequired: form.responseRequired,
        responseDeadline: form.responseRequired ? form.responseDeadline : undefined,
        content: form.content || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.noticeLogs.put(newNotice);

      // Reset form and reload
      setForm({
        noticeType: "delay",
        sentTo: "",
        sentFrom: activeProject.teamMembers?.[0]?.name || "",
        dateSent: new Date().toISOString().split("T")[0],
        deliveryMethod: "email",
        contractClause: "",
        responseRequired: false,
        responseDeadline: "",
        content: "",
      });

      setShowCreateModal(false);

      // Reload notices
      const updated = await getNoticeLogsForProject(activeProject.id);
      setNotices(
        updated.sort((a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime())
      );
    } catch (err) {
      console.error("Failed to save notice:", err);
      alert("Failed to save notice");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate days remaining
  const daysRemaining = (deadline: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const isOverdue = (deadline: string): boolean => {
    return daysRemaining(deadline) < 0;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="screen">
          <Header
            title="Notice Log"
            subtitle={activeProject?.name || ""}
            backHref="/"
          />
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="animate-spin text-warm-gray" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="screen">
        {/* Header */}
        <Header
          title="Notice Log"
          subtitle={activeProject?.name || ""}
          backHref="/"
        />

        <div className="px-5 pt-6">
          {/* Overdue Alert */}
          {overdue.length > 0 && (
            <button
              onClick={() => setActiveFilter("Response Due")}
              className="w-full mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-left hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 text-sm">
                    {overdue.length} notice{overdue.length !== 1 ? "s" : ""} have
                    overdue responses
                  </p>
                  <p className="text-red-700 text-xs mt-0.5">Tap to view</p>
                </div>
              </div>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 mb-4">
            {["All", "Delay", "Claim", "Backcharge", "Cure", "Change Directive", "Termination", "Acceleration"].map((filter) => {
              const filterKey: FilterType = filter as FilterType;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filterKey)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors active:scale-[0.98] ${
                    activeFilter === filterKey
                      ? "bg-onyx text-white"
                      : "bg-alabaster text-onyx"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
            <button
              onClick={() => setActiveFilter("Response Due")}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors active:scale-[0.98] flex items-center gap-2 ${
                activeFilter === "Response Due"
                  ? "bg-onyx text-white"
                  : "bg-alabaster text-onyx"
              }`}
            >
              <Clock size={16} />
              Response Due
            </button>
          </div>

          {/* Summary Bar */}
          <div className="mb-4 text-xs text-warm-gray font-medium">
            {notices.length} total · {pendingResponse.length} pending response ·{" "}
            {overdue.length} overdue
          </div>
        </div>

        {/* Notice List */}
        <div className="px-5 pb-32">
          {filteredList.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<FileText size={48} />}
                title="No notices logged"
                description="Track contractual notices, delay claims, and formal correspondence here."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((notice) => {
                const isExpanded = expandedNoticeId === notice.id;
                const isOverdueResponse =
                  notice.responseRequired &&
                  !notice.responseReceived &&
                  notice.responseDeadline &&
                  isOverdue(notice.responseDeadline);

                const relatedCount =
                  (notice.relatedDailyLogIds?.length || 0) +
                  (notice.relatedDelayEventIds?.length || 0) +
                  (notice.relatedChangeIds?.length || 0);

                const colors = NOTICE_TYPE_COLORS[notice.noticeType];

                return (
                  <button
                    key={notice.id}
                    onClick={() =>
                      setExpandedNoticeId(isExpanded ? null : notice.id)
                    }
                    className="w-full text-left bg-white border border-gray-100 rounded-xl shadow-card hover:shadow-card-hover transition-all active:scale-[0.98]"
                  >
                    <div className="p-4">
                      {/* Row 1: Type badge + Date + Delivery */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className={`${colors.bg} ${colors.text} border ${colors.border} rounded-full px-3 py-1 text-xs font-semibold`}>
                          {NOTICE_TYPE_LABELS[notice.noticeType]}
                        </div>
                        <div className="flex items-center gap-2">
                          {DELIVERY_METHOD_ICONS[notice.deliveryMethod]}
                          <span className="text-xs text-warm-gray">
                            {DELIVERY_METHOD_LABELS[notice.deliveryMethod]}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Date sent */}
                      <p className="text-xs text-warm-gray mb-2">
                        {formatDate(notice.dateSent)}
                      </p>

                      {/* Row 3: Sent To / From */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-onyx">
                          To:{" "}
                          <span className="font-normal text-warm-gray">
                            {notice.sentTo}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-onyx">
                          From:{" "}
                          <span className="font-normal text-warm-gray">
                            {notice.sentFrom}
                          </span>
                        </p>
                      </div>

                      {/* Contract Clause */}
                      {notice.contractClause && (
                        <p className="text-xs text-warm-gray mb-3">
                          Clause: <span className="font-medium text-onyx">{notice.contractClause}</span>
                        </p>
                      )}

                      {/* Response Status */}
                      <div className="mb-3">
                        {notice.responseRequired ? (
                          notice.responseReceived ? (
                            <div className="flex items-center gap-2 text-xs font-medium text-accent-green">
                              <CheckCircle size={16} />
                              Response Received · {formatDate(notice.responseDate!)}
                            </div>
                          ) : (
                            <div
                              className={`flex items-center gap-2 text-xs font-medium ${
                                isOverdueResponse
                                  ? "text-accent-red"
                                  : "text-amber-700"
                              }`}
                            >
                              <AlertTriangle size={16} />
                              RESPONSE DUE · {formatDate(notice.responseDeadline!)} ·{" "}
                              {isOverdueResponse
                                ? "OVERDUE"
                                : `${daysRemaining(notice.responseDeadline!)} days`}
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-medium text-warm-gray">
                            <Clock size={16} />
                            No Response Required
                          </div>
                        )}
                      </div>

                      {/* Related Items Count */}
                      {relatedCount > 0 && (
                        <p className="text-xs text-warm-gray mb-3">
                          Links:{" "}
                          {(notice.relatedDailyLogIds?.length || 0) > 0 &&
                            `${notice.relatedDailyLogIds!.length} log${
                              (notice.relatedDailyLogIds?.length || 0) !== 1
                                ? "s"
                                : ""
                            }`}
                          {(notice.relatedDailyLogIds?.length || 0) > 0 &&
                            (notice.relatedDelayEventIds?.length || 0) > 0 &&
                            ", "}
                          {(notice.relatedDelayEventIds?.length || 0) > 0 &&
                            `${notice.relatedDelayEventIds!.length} delay${
                              (notice.relatedDelayEventIds?.length || 0) !== 1
                                ? "s"
                                : ""
                            }`}
                          {((notice.relatedDailyLogIds?.length || 0) > 0 ||
                            (notice.relatedDelayEventIds?.length || 0) > 0) &&
                            (notice.relatedChangeIds?.length || 0) > 0 &&
                            ", "}
                          {(notice.relatedChangeIds?.length || 0) > 0 &&
                            `${notice.relatedChangeIds!.length} change${
                              (notice.relatedChangeIds?.length || 0) !== 1
                                ? "s"
                                : ""
                            }`}
                        </p>
                      )}

                      {/* Expand/Collapse indicator */}
                      <div className="flex justify-end pt-2">
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-warm-gray" />
                        ) : (
                          <ChevronDown size={18} className="text-warm-gray" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        {notice.content && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-warm-gray mb-2 uppercase">
                              Content
                            </p>
                            <p className="text-sm text-onyx whitespace-pre-wrap break-words">
                              {notice.content}
                            </p>
                          </div>
                        )}

                        {/* Related IDs */}
                        {(notice.relatedDailyLogIds?.length || 0) > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-warm-gray mb-1 uppercase">
                              Related Daily Logs
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {notice.relatedDailyLogIds!.map((id) => (
                                <span
                                  key={id}
                                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(notice.relatedDelayEventIds?.length || 0) > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-warm-gray mb-1 uppercase">
                              Related Delay Events
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {notice.relatedDelayEventIds!.map((id) => (
                                <span
                                  key={id}
                                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(notice.relatedChangeIds?.length || 0) > 0 && (
                          <div>
                            <p className="text-xs font-medium text-warm-gray mb-1 uppercase">
                              Related Changes
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {notice.relatedChangeIds!.map((id) => (
                                <span
                                  key={id}
                                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(notice.attachmentIds?.length || 0) > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-warm-gray">
                              {notice.attachmentIds!.length} attachment
                              {(notice.attachmentIds?.length || 0) !== 1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-medium">New Notice</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Notice Type */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Notice Type *
                  </label>
                  <select
                    value={form.noticeType}
                    onChange={(e) =>
                      setForm({ ...form, noticeType: e.target.value as NoticeType })
                    }
                    className="field-select"
                  >
                    {Object.entries(NOTICE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sent To */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Sent To *
                  </label>
                  <input
                    type="text"
                    value={form.sentTo}
                    onChange={(e) =>
                      setForm({ ...form, sentTo: e.target.value })
                    }
                    placeholder="e.g., Subcontractor Name"
                    className="field-input"
                  />
                </div>

                {/* Sent From */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Sent From *
                  </label>
                  <input
                    type="text"
                    value={form.sentFrom}
                    onChange={(e) =>
                      setForm({ ...form, sentFrom: e.target.value })
                    }
                    className="field-input"
                  />
                </div>

                {/* Date Sent */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Date Sent *
                  </label>
                  <input
                    type="date"
                    value={form.dateSent}
                    onChange={(e) =>
                      setForm({ ...form, dateSent: e.target.value })
                    }
                    className="field-input"
                  />
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Delivery Method
                  </label>
                  <select
                    value={form.deliveryMethod}
                    onChange={(e) =>
                      setForm({ ...form, deliveryMethod: e.target.value as DeliveryMethod })
                    }
                    className="field-select"
                  >
                    <option value="email">Email</option>
                    <option value="certified_mail">Certified Mail</option>
                    <option value="hand_delivered">Hand Delivered</option>
                  </select>
                </div>

                {/* Contract Clause */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Contract Clause (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.contractClause}
                    onChange={(e) =>
                      setForm({ ...form, contractClause: e.target.value })
                    }
                    placeholder="e.g., AIA A401 7.2"
                    className="field-input"
                  />
                </div>

                {/* Response Required */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.responseRequired}
                      onChange={(e) =>
                        setForm({ ...form, responseRequired: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-200"
                    />
                    <span className="text-sm font-medium text-onyx">
                      Response Required
                    </span>
                  </label>
                </div>

                {/* Response Deadline */}
                {form.responseRequired && (
                  <div>
                    <label className="block text-sm font-medium text-onyx mb-2">
                      Response Deadline
                    </label>
                    <input
                      type="date"
                      value={form.responseDeadline}
                      onChange={(e) =>
                        setForm({ ...form, responseDeadline: e.target.value })
                      }
                      className="field-input"
                    />
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-onyx mb-2">
                    Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder="Notice text, claims, directives..."
                    rows={4}
                    className="field-input"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-button bg-alabaster text-onyx font-medium active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 btn-primary"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Save Notice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB (Floating Action Button) */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-onyx text-white rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>
    </AppShell>
  );
}
