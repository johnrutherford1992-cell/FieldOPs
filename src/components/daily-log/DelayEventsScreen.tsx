'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { DelayEvent, DelayType, DelayCause, Subcontractor, TaktZone } from '@/lib/types';

interface DelayEventsScreenProps {
  entries: DelayEvent[];
  onEntriesChange: (entries: DelayEvent[]) => void;
  subcontractors: Subcontractor[];
  taktZones: TaktZone[];
}

interface FormData {
  delayType: DelayType;
  causeCategory: DelayCause;
  description: string;
  responsibleParty: string;
  calendarDaysImpacted: number;
  workingDaysImpacted: number;
  criticalPathImpacted: boolean;
  affectedTaktZones: string[];
  contractNoticeRequired: boolean;
  noticeSentDate: string;
  mitigationActions: string[];
  costImpact: number;
}

const DELAY_TYPE_OPTIONS: { value: DelayType; label: string }[] = [
  { value: 'excusable_compensable', label: 'Excusable Compensable (Owner Caused)' },
  { value: 'excusable_noncompensable', label: 'Excusable Non-Compensable (Act of God)' },
  { value: 'inexcusable', label: 'Inexcusable (Contractor Fault)' },
  { value: 'concurrent', label: 'Concurrent' },
];

const CAUSE_CATEGORY_OPTIONS: { value: DelayCause; label: string }[] = [
  { value: 'weather', label: 'Weather' },
  { value: 'owner_change', label: 'Owner Change' },
  { value: 'design_error', label: 'Design Error' },
  { value: 'differing_conditions', label: 'Differing Conditions' },
  { value: 'sub_default', label: 'Sub Default' },
  { value: 'force_majeure', label: 'Force Majeure' },
  { value: 'access_denied', label: 'Access Denied' },
];

const getDelayTypeBadgeColor = (delayType: DelayType): string => {
  switch (delayType) {
    case 'excusable_compensable':
      return 'bg-accent-amber/15 text-accent-amber';
    case 'excusable_noncompensable':
      return 'bg-accent-violet/15 text-accent-violet';
    case 'inexcusable':
      return 'bg-accent-red/15 text-accent-red';
    case 'concurrent':
      return 'bg-accent-violet/20 text-accent-violet';
    default:
      return 'bg-glass text-slate';
  }
};

const generateUniqueId = (): string => {
  return `delay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
};

const initialFormData: FormData = {
  delayType: 'excusable_compensable',
  causeCategory: 'weather',
  description: '',
  responsibleParty: '',
  calendarDaysImpacted: 1,
  workingDaysImpacted: 1,
  criticalPathImpacted: false,
  affectedTaktZones: [],
  contractNoticeRequired: false,
  noticeSentDate: '',
  mitigationActions: [],
  costImpact: 0,
};

export default function DelayEventsScreen({
  entries,
  onEntriesChange,
  subcontractors,
  taktZones,
}: DelayEventsScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mitigationInput, setMitigationInput] = useState('');

  const handleAddDelay = () => {
    const now = new Date().toISOString();
    const newEntry: DelayEvent = {
      id: generateUniqueId(),
      projectId: "",
      date: now.split("T")[0],
      delayType: formData.delayType,
      causeCategory: formData.causeCategory,
      description: formData.description,
      responsibleParty: formData.responsibleParty,
      calendarDaysImpacted: formData.calendarDaysImpacted,
      workingDaysImpacted: formData.workingDaysImpacted,
      criticalPathImpacted: formData.criticalPathImpacted,
      affectedTaktZones: formData.affectedTaktZones,
      contractNoticeRequired: formData.contractNoticeRequired,
      noticeSentDate: formData.noticeSentDate || undefined,
      mitigationActions: formData.mitigationActions,
      costImpact: formData.costImpact,
      createdAt: now,
      updatedAt: now,
    };

    onEntriesChange([...entries, newEntry]);
    setFormData(initialFormData);
    setMitigationInput('');
    setShowModal(false);
  };

  const handleDeleteEntry = (id: string) => {
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  };

  const handleAddMitigationAction = () => {
    if (mitigationInput.trim()) {
      setFormData({
        ...formData,
        mitigationActions: [...formData.mitigationActions, mitigationInput.trim()],
      });
      setMitigationInput('');
    }
  };

  const handleRemoveMitigationAction = (index: number) => {
    setFormData({
      ...formData,
      mitigationActions: formData.mitigationActions.filter((_, i) => i !== index),
    });
  };

  const handleTaktZoneToggle = (zoneId: string) => {
    setFormData({
      ...formData,
      affectedTaktZones: formData.affectedTaktZones.includes(zoneId)
        ? formData.affectedTaktZones.filter((id) => id !== zoneId)
        : [...formData.affectedTaktZones, zoneId],
    });
  };

  const isFormValid =
    formData.description.trim() &&
    formData.responsibleParty.trim() &&
    formData.calendarDaysImpacted > 0 &&
    formData.workingDaysImpacted > 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-onyx mb-2">Delay Events</h2>
        <p className="text-warm-gray">Document delay events that impacted the schedule</p>
      </div>

      {/* Empty State */}
      {entries.length === 0 && !showModal && (
        <div className="flex flex-col items-center justify-center py-12 bg-glass rounded-lg border border-white/[0.08]">
          <Clock className="w-12 h-12 text-warm-gray mb-4" />
          <p className="text-warm-gray text-center mb-6">
            No delay events logged today. Tap + to document a delay.
          </p>
        </div>
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="space-y-4 mb-6">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-glass rounded-lg border border-white/[0.08] overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                className="w-full px-4 py-4 flex items-start justify-between hover:bg-glass-light transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getDelayTypeBadgeColor(
                        entry.delayType
                      )}`}
                    >
                      {entry.delayType}
                    </span>
                    <span className="text-sm text-gray-600">{entry.causeCategory}</span>
                  </div>
                  <p className="text-onyx font-medium mb-2 line-clamp-2">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-warm-gray">
                    <span>Calendar: {entry.calendarDaysImpacted}d</span>
                    <span>Working: {entry.workingDaysImpacted}d</span>
                    {entry.costImpact != null && entry.costImpact > 0 && (
                      <span className="text-accent-amber font-medium">
                        ${entry.costImpact?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {expandedId === entry.id ? (
                    <ChevronUp className="w-5 h-5 text-warm-gray" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-gray" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === entry.id && (
                <div className="px-4 py-4 border-t border-white/[0.08] bg-glass-light space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-onyx mb-2">
                      Responsible Party
                    </h4>
                    <p className="text-slate">{entry.responsibleParty}</p>
                  </div>

                  {(entry.affectedTaktZones?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-onyx mb-2">
                        Affected Takt Zones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.affectedTaktZones?.map((zoneId) => {
                          const zone = taktZones.find((z) => z.id === zoneId);
                          return zone ? (
                            <span
                              key={zoneId}
                              className="px-2 py-1 bg-glass text-onyx rounded text-xs"
                            >
                              {zone.zoneName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {entry.criticalPathImpacted && (
                    <div className="px-3 py-2 bg-accent-red/10 border border-accent-red/30 rounded text-sm text-accent-red">
                      Critical Path Impacted
                    </div>
                  )}

                  {entry.contractNoticeRequired && (
                    <div>
                      <h4 className="text-sm font-semibold text-onyx mb-2">
                        Contract Notice
                      </h4>
                      <p className="text-slate">
                        Notice Sent: {entry.noticeSentDate || 'Pending'}
                      </p>
                    </div>
                  )}

                  {(entry.mitigationActions?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-onyx mb-2">
                        Mitigation Actions
                      </h4>
                      <ul className="space-y-1">
                        {entry.mitigationActions?.map((action, idx) => (
                          <li key={idx} className="text-slate text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(entry.costImpact ?? 0) > 0 && (
                    <div className="px-3 py-2 bg-accent-amber/10 border border-accent-amber/30 rounded">
                      <p className="text-sm text-accent-amber">
                        <span className="font-semibold">Cost Impact:</span> $
                        {entry.costImpact?.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="w-full mt-4 px-3 py-2 flex items-center justify-center gap-2 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 rounded font-medium text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Entry
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-3 flex items-center justify-center gap-2 bg-accent-violet text-white hover:bg-accent-violet/90 rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Delay
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full bg-obsidian rounded-t-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-4 py-4 border-b border-white/[0.08] bg-obsidian">
              <h3 className="text-xl font-bold text-onyx">Log Delay Event</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-glass-light rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-warm-gray" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Delay Type */}
              <div>
                <label className="block text-sm font-semibold text-onyx mb-2">
                  Delay Type *
                </label>
                <select
                  value={formData.delayType}
                  onChange={(e) =>
                    setFormData({ ...formData, delayType: e.target.value as DelayType })
                  }
                  className="w-full px-3 py-2 border border-white/[0.10] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass text-onyx"
                >
                  {DELAY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cause Category */}
              <div>
                <label className="block text-sm font-semibold text-onyx mb-2">
                  Cause Category *
                </label>
                <select
                  value={formData.causeCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, causeCategory: e.target.value as DelayCause })
                  }
                  className="w-full px-3 py-2 border border-white/[0.10] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass text-onyx"
                >
                  {CAUSE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-onyx mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the delay event in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-white/[0.10] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet resize-none bg-glass text-onyx"
                />
              </div>

              {/* Responsible Party */}
              <div>
                <label className="block text-sm font-semibold text-onyx mb-2">
                  Responsible Party *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.responsibleParty}
                    onChange={(e) =>
                      setFormData({ ...formData, responsibleParty: e.target.value })
                    }
                    placeholder="Enter name or select from list"
                    className="w-full px-3 py-2 border border-white/[0.10] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet bg-glass text-onyx"
                  />
                  {subcontractors.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, responsibleParty: e.target.value });
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-white/[0.10] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet text-warm-gray bg-glass"
                    >
                      <option value="">Or select subcontractor...</option>
                      {subcontractors.map((sub) => (
                        <option key={sub.id} value={sub.company}>
                          {sub.company}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Calendar Days Impacted */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Calendar Days Impacted *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.calendarDaysImpacted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calendarDaysImpacted: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Working Days Impacted */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Working Days Impacted *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.workingDaysImpacted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workingDaysImpacted: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Critical Path Impacted */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="critical-path"
                  checked={formData.criticalPathImpacted}
                  onChange={(e) =>
                    setFormData({ ...formData, criticalPathImpacted: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                />
                <label htmlFor="critical-path" className="text-sm font-medium text-black">
                  Critical Path Impacted
                </label>
              </div>

              {/* Affected Takt Zones */}
              {taktZones.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Affected Takt Zones
                  </label>
                  <div className="space-y-2">
                    {taktZones.map((zone) => (
                      <div key={zone.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`zone-${zone.id}`}
                          checked={formData.affectedTaktZones.includes(zone.id)}
                          onChange={() => handleTaktZoneToggle(zone.id)}
                          className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                        />
                        <label htmlFor={`zone-${zone.id}`} className="text-sm text-gray-700">
                          {zone.zoneName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract Notice Required */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="contract-notice"
                  checked={formData.contractNoticeRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, contractNoticeRequired: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                />
                <label htmlFor="contract-notice" className="text-sm font-medium text-black">
                  Contract Notice Required
                </label>
              </div>

              {/* Notice Sent Date */}
              {formData.contractNoticeRequired && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Notice Sent Date
                  </label>
                  <input
                    type="date"
                    value={formData.noticeSentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, noticeSentDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              {/* Mitigation Actions */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Mitigation Actions
                </label>
                <div className="space-y-2">
                  {formData.mitigationActions.length > 0 && (
                    <div className="space-y-2">
                      {formData.mitigationActions.map((action, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-gray-100 rounded">
                          <span className="text-sm text-gray-700">{action}</span>
                          <button
                            onClick={() => handleRemoveMitigationAction(idx)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mitigationInput}
                      onChange={(e) => setMitigationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddMitigationAction();
                        }
                      }}
                      placeholder="Add a mitigation action..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      onClick={handleAddMitigationAction}
                      className="px-4 py-2 bg-gray-200 text-black hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost Impact */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Cost Impact ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.costImpact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      costImpact: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-black hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDelay}
                  disabled={!isFormValid}
                  className="flex-1 px-4 py-3 bg-black text-white hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  Save Delay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
