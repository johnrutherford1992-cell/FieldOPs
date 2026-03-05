// ============================================================
// Analytics PDF — @react-pdf/renderer document
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { LetterheadDocument, docStyles } from './letterhead';
import { BRAND, FONT_SIZES } from './pdf-styles';
import type { ProductivityAnalytics, Project } from '@/lib/types';

const s = StyleSheet.create({
  metricCard: {
    width: '48%',
    backgroundColor: BRAND.lightGray,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: FONT_SIZES.small,
    color: BRAND.warmGray,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.onyx,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendUp: { color: BRAND.accentGreen },
  trendDown: { color: BRAND.accentRed },
  trendStable: { color: BRAND.warmGray },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.borderGray,
  },
  impactFactor: {
    fontSize: FONT_SIZES.body,
    color: BRAND.onyx,
    width: '50%',
  },
  impactMagnitude: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Helvetica-Bold',
    width: '25%',
    textAlign: 'right',
  },
  impactDesc: {
    fontSize: FONT_SIZES.small,
    color: BRAND.warmGray,
    width: '25%',
    textAlign: 'right',
  },
});

interface AnalyticsDocumentProps {
  analytics: ProductivityAnalytics[];
  project: Project;
}

export function AnalyticsDocument({
  analytics,
  project,
}: AnalyticsDocumentProps) {
  const now = new Date();

  // Aggregate metrics
  const totalQuantity = analytics.reduce(
    (sum, a) => sum + a.totalQuantityInstalled,
    0
  );
  const totalHours = analytics.reduce(
    (sum, a) => sum + a.totalLaborHours,
    0
  );
  const avgVariance =
    analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.plannedVsActualVariance, 0) /
        analytics.length
      : 0;
  const totalCostVariance = analytics.reduce(
    (sum, a) => sum + a.costVariance,
    0
  );

  // Collect all impact factors
  const allImpacts = analytics.flatMap((a) => a.impactFactors);
  const impactSummary = new Map<string, { total: number; count: number }>();
  for (const impact of allImpacts) {
    const existing = impactSummary.get(impact.factor);
    if (existing) {
      existing.total += impact.magnitude;
      existing.count += 1;
    } else {
      impactSummary.set(impact.factor, { total: impact.magnitude, count: 1 });
    }
  }

  return (
    <LetterheadDocument
      projectName={project.name}
      projectAddress={project.address}
      documentTitle="Productivity Analytics Summary"
      documentDate={`Generated ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
    >
      {/* Overview Metrics */}
      <View style={s.metricRow}>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Total Quantity Installed</Text>
          <Text style={s.metricValue}>{totalQuantity.toLocaleString()}</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Total Labor Hours</Text>
          <Text style={s.metricValue}>{totalHours.toLocaleString()}</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Avg Planned vs Actual</Text>
          <Text
            style={[
              s.metricValue,
              avgVariance >= 0 ? s.trendUp : s.trendDown,
            ]}
          >
            {avgVariance >= 0 ? '+' : ''}
            {avgVariance.toFixed(1)}%
          </Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Total Cost Variance</Text>
          <Text
            style={[
              s.metricValue,
              totalCostVariance >= 0 ? s.trendUp : s.trendDown,
            ]}
          >
            ${Math.abs(totalCostVariance).toLocaleString()}
            {totalCostVariance >= 0 ? ' under' : ' over'}
          </Text>
        </View>
      </View>

      {/* Activity Detail Table */}
      <Text style={docStyles.sectionTitle}>Activity Detail</Text>
      <View style={docStyles.table}>
        <View style={docStyles.tableHeaderRow}>
          <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>CSI</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Period</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Avg Rate</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Peak</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Low</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Variance</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>Trend</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>Qty</Text>
          <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>Hours</Text>
        </View>
        {analytics.map((a, i) => (
          <View key={i} style={docStyles.tableRow}>
            <Text style={[docStyles.tableCell, { width: '10%' }]}>
              {a.costCodeId.substring(0, 8)}
            </Text>
            <Text style={[docStyles.tableCell, { width: '12%' }]}>
              {a.periodType.replace(/_/g, ' ')}
            </Text>
            <Text style={[docStyles.tableCell, { width: '12%' }]}>
              {a.averageUnitRate.toFixed(2)}
            </Text>
            <Text style={[docStyles.tableCell, { width: '12%' }]}>
              {a.peakUnitRate.toFixed(2)}
            </Text>
            <Text style={[docStyles.tableCell, { width: '12%' }]}>
              {a.lowUnitRate.toFixed(2)}
            </Text>
            <Text
              style={[
                docStyles.tableCell,
                { width: '12%' },
                a.plannedVsActualVariance >= 0 ? s.trendUp : s.trendDown,
              ]}
            >
              {a.plannedVsActualVariance >= 0 ? '+' : ''}
              {a.plannedVsActualVariance.toFixed(1)}%
            </Text>
            <Text
              style={[
                docStyles.tableCell,
                { width: '10%' },
                a.trendDirection === 'improving'
                  ? s.trendUp
                  : a.trendDirection === 'declining'
                    ? s.trendDown
                    : s.trendStable,
              ]}
            >
              {a.trendDirection === 'improving'
                ? '\u2191'
                : a.trendDirection === 'declining'
                  ? '\u2193'
                  : '\u2192'}
            </Text>
            <Text style={[docStyles.tableCell, { width: '10%' }]}>
              {a.totalQuantityInstalled.toLocaleString()}
            </Text>
            <Text style={[docStyles.tableCell, { width: '10%' }]}>
              {a.totalLaborHours.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Impact Factors */}
      {impactSummary.size > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Impact Factors</Text>
          {Array.from(impactSummary.entries()).map(([factor, data], i) => (
            <View key={i} style={s.impactRow}>
              <Text style={s.impactFactor}>
                {factor.replace(/_/g, ' ')}
              </Text>
              <Text
                style={[
                  s.impactMagnitude,
                  data.total / data.count >= 0 ? s.trendUp : s.trendDown,
                ]}
              >
                {((data.total / data.count) * 100).toFixed(1)}%
              </Text>
              <Text style={s.impactDesc}>
                {data.count} occurrence{data.count !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </>
      )}
    </LetterheadDocument>
  );
}
