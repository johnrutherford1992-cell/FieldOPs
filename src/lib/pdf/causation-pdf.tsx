// ============================================================
// Causation Chain PDF — @react-pdf/renderer document
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { LetterheadDocument, docStyles } from './letterhead';
import { BRAND, FONT_SIZES, formatDateShort } from './pdf-styles';
import type { DelayEvent, Project } from '@/lib/types';

const s = StyleSheet.create({
  eventCard: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: BRAND.borderGray,
    borderRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.borderGray,
  },
  eventTitle: {
    fontSize: FONT_SIZES.heading,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.onyx,
    maxWidth: '70%',
  },
  eventDate: {
    fontSize: FONT_SIZES.small,
    color: BRAND.warmGray,
  },
  typeBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: BRAND.lightGray,
    color: BRAND.slate,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailItem: {
    width: '48%',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 7,
    color: BRAND.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONT_SIZES.body,
    color: BRAND.onyx,
  },
  criticalPath: {
    color: BRAND.accentRed,
    fontFamily: 'Helvetica-Bold',
  },
  mitigationList: {
    marginTop: 4,
  },
  mitigationItem: {
    fontSize: FONT_SIZES.small,
    color: BRAND.slate,
    paddingLeft: 8,
    marginBottom: 2,
  },
  noticeBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  noticeSent: {
    backgroundColor: '#dcfce7',
    color: BRAND.accentGreen,
  },
  noticeNeeded: {
    backgroundColor: '#fef2f2',
    color: BRAND.accentRed,
  },
});

interface CausationDocumentProps {
  delayEvents: DelayEvent[];
  project: Project;
}

export function CausationDocument({
  delayEvents,
  project,
}: CausationDocumentProps) {
  const now = new Date();

  // Summary statistics
  const totalCostImpact = delayEvents.reduce(
    (sum, d) => sum + (d.costImpact || 0),
    0
  );
  const totalDays = delayEvents.reduce(
    (sum, d) => sum + (d.calendarDaysImpacted || 0),
    0
  );
  const criticalPathCount = delayEvents.filter(
    (d) => d.criticalPathImpacted
  ).length;
  const noticesSent = delayEvents.filter((d) => d.noticeSentDate).length;

  return (
    <LetterheadDocument
      projectName={project.name}
      projectAddress={project.address}
      documentTitle="Causation Analysis"
      documentDate={`Generated ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
    >
      {/* Summary */}
      <View style={docStyles.summaryCard}>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{delayEvents.length}</Text>
          <Text style={docStyles.summaryLabel}>Events</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{totalDays}</Text>
          <Text style={docStyles.summaryLabel}>Days Impact</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>
            ${totalCostImpact.toLocaleString()}
          </Text>
          <Text style={docStyles.summaryLabel}>Cost Impact</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{criticalPathCount}</Text>
          <Text style={docStyles.summaryLabel}>Critical Path</Text>
        </View>
      </View>

      {/* Event Cards */}
      {delayEvents.map((event, i) => (
        <View key={i} style={s.eventCard} wrap={false}>
          <View style={s.eventHeader}>
            <Text style={s.eventTitle}>{event.description}</Text>
            <Text style={s.eventDate}>
              {formatDateShort(event.date)}
            </Text>
          </View>

          <View style={s.detailGrid}>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>Type</Text>
              <Text style={s.detailValue}>
                {event.delayType.replace(/_/g, ' ')}
              </Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>Cause</Text>
              <Text style={s.detailValue}>
                {event.causeCategory.replace(/_/g, ' ')}
              </Text>
            </View>
            {event.responsibleParty && (
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Responsible Party</Text>
                <Text style={s.detailValue}>{event.responsibleParty}</Text>
              </View>
            )}
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>Calendar Days</Text>
              <Text style={s.detailValue}>
                {event.calendarDaysImpacted ?? '—'}
              </Text>
            </View>
            {event.workingDaysImpacted != null && (
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Working Days</Text>
                <Text style={s.detailValue}>{event.workingDaysImpacted}</Text>
              </View>
            )}
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>Critical Path</Text>
              <Text
                style={[
                  s.detailValue,
                  event.criticalPathImpacted ? s.criticalPath : {},
                ]}
              >
                {event.criticalPathImpacted ? 'YES' : 'No'}
              </Text>
            </View>
            {event.costImpact != null && (
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Cost Impact</Text>
                <Text style={s.detailValue}>
                  ${event.costImpact.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>Notice</Text>
              {event.noticeSentDate ? (
                <Text style={[s.noticeBadge, s.noticeSent]}>
                  Sent {formatDateShort(event.noticeSentDate)}
                </Text>
              ) : event.contractNoticeRequired ? (
                <Text style={[s.noticeBadge, s.noticeNeeded]}>
                  REQUIRED — Not Sent
                </Text>
              ) : (
                <Text style={s.detailValue}>N/A</Text>
              )}
            </View>
          </View>

          {/* Affected Activities */}
          {event.affectedActivities && event.affectedActivities.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={s.detailLabel}>Affected Activities</Text>
              <Text style={s.detailValue}>
                {event.affectedActivities.join(', ')}
              </Text>
            </View>
          )}

          {/* Mitigation */}
          {event.mitigationActions && event.mitigationActions.length > 0 && (
            <View style={s.mitigationList}>
              <Text style={s.detailLabel}>Mitigation Actions</Text>
              {event.mitigationActions.map((action, j) => (
                <Text key={j} style={s.mitigationItem}>
                  {'\u2022'} {action}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Notice Summary */}
      <Text style={docStyles.sectionTitle}>Notice Status Summary</Text>
      <View style={docStyles.keyValueRow}>
        <Text style={docStyles.keyLabel}>Notices Sent</Text>
        <Text style={docStyles.keyValue}>
          {noticesSent} of {delayEvents.filter((d) => d.contractNoticeRequired).length} required
        </Text>
      </View>
      {delayEvents
        .filter((d) => d.contractNoticeRequired && !d.noticeSentDate)
        .map((d, i) => (
          <View key={i} style={docStyles.keyValueRow}>
            <Text style={[docStyles.keyLabel, { color: BRAND.accentRed }]}>
              MISSING NOTICE
            </Text>
            <Text style={docStyles.keyValue}>
              {d.description} — Deadline: {d.noticeDeadline ? formatDateShort(d.noticeDeadline) : 'N/A'}
            </Text>
          </View>
        ))}
    </LetterheadDocument>
  );
}
