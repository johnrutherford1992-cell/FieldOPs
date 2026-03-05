// ============================================================
// Notice Log PDF — @react-pdf/renderer document
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { LetterheadDocument, docStyles } from './letterhead';
import { BRAND, formatDateShort } from './pdf-styles';
import type { NoticeLogEntry, Project } from '@/lib/types';

const s = StyleSheet.create({
  overdueText: {
    color: BRAND.accentRed,
    fontFamily: 'Helvetica-Bold',
  },
  pendingText: {
    color: BRAND.accentAmber,
  },
  receivedText: {
    color: BRAND.accentGreen,
  },
  typeLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

interface NoticeLogDocumentProps {
  notices: NoticeLogEntry[];
  project: Project;
}

export function NoticeLogDocument({ notices, project }: NoticeLogDocumentProps) {
  const now = new Date();
  const pending = notices.filter(
    (n) => n.responseRequired && !n.responseReceived
  ).length;
  const overdue = notices.filter((n) => {
    if (!n.responseRequired || n.responseReceived || !n.responseDeadline)
      return false;
    return new Date(n.responseDeadline) < now;
  }).length;

  return (
    <LetterheadDocument
      projectName={project.name}
      projectAddress={project.address}
      documentTitle="Notice Log"
      documentDate={`Generated ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
    >
      {/* Summary */}
      <View style={docStyles.summaryCard}>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{notices.length}</Text>
          <Text style={docStyles.summaryLabel}>Total</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{pending}</Text>
          <Text style={docStyles.summaryLabel}>Pending</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={[docStyles.summaryValue, overdue > 0 ? s.overdueText : {}]}>
            {overdue}
          </Text>
          <Text style={docStyles.summaryLabel}>Overdue</Text>
        </View>
      </View>

      {/* Table */}
      <View style={docStyles.table}>
        <View style={docStyles.tableHeaderRow}>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Date</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Type</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>To</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>From</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '11%' }]}>Method</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '14%' }]}>Clause</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '18%' }]}>Response</Text>
        </View>
        {notices.map((n, i) => {
          const isOverdue =
            n.responseRequired &&
            !n.responseReceived &&
            n.responseDeadline &&
            new Date(n.responseDeadline) < now;

          return (
            <View key={i} style={docStyles.tableRow}>
              <Text style={[docStyles.tableCell, { width: '12%' }]}>
                {formatDateShort(n.dateSent)}
              </Text>
              <Text style={[docStyles.tableCell, s.typeLabel, { width: '15%' }]}>
                {n.noticeType.replace(/_/g, ' ')}
              </Text>
              <Text style={[docStyles.tableCell, { width: '15%' }]}>{n.sentTo}</Text>
              <Text style={[docStyles.tableCell, { width: '15%' }]}>{n.sentFrom}</Text>
              <Text style={[docStyles.tableCell, { width: '11%' }]}>
                {n.deliveryMethod.replace(/_/g, ' ')}
              </Text>
              <Text style={[docStyles.tableCell, { width: '14%' }]}>
                {n.contractClause || '—'}
              </Text>
              <Text
                style={[
                  docStyles.tableCell,
                  { width: '18%' },
                  n.responseReceived
                    ? s.receivedText
                    : isOverdue
                      ? s.overdueText
                      : n.responseRequired
                        ? s.pendingText
                        : {},
                ]}
              >
                {n.responseReceived
                  ? `Received ${n.responseDate ? formatDateShort(n.responseDate) : ''}`
                  : isOverdue
                    ? `OVERDUE (${formatDateShort(n.responseDeadline!)})`
                    : n.responseRequired
                      ? `Due ${n.responseDeadline ? formatDateShort(n.responseDeadline) : 'TBD'}`
                      : 'N/A'}
              </Text>
            </View>
          );
        })}
      </View>
    </LetterheadDocument>
  );
}
