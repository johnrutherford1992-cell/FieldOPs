// ============================================================
// Daily Log PDF — @react-pdf/renderer document
// ============================================================

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LetterheadDocument, docStyles } from './letterhead';
import { BRAND, FONT_SIZES, formatDate, formatDateShort } from './pdf-styles';
import type { DailyLog, Project } from '@/lib/types';

const s = StyleSheet.create({
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  weatherItem: {
    width: '30%',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  photoContainer: {
    width: '30%',
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    borderRadius: 2,
  },
  photoCaption: {
    fontSize: 7,
    color: BRAND.warmGray,
    marginTop: 2,
  },
  notesText: {
    fontSize: FONT_SIZES.body,
    lineHeight: 1.5,
    color: BRAND.onyx,
    marginBottom: 4,
  },
  tomorrowItem: {
    fontSize: FONT_SIZES.body,
    color: BRAND.onyx,
    marginBottom: 2,
    paddingLeft: 8,
  },
});

interface DailyLogDocumentProps {
  log: DailyLog;
  project: Project;
}

export function DailyLogDocument({ log, project }: DailyLogDocumentProps) {
  const totalWorkers = log.manpower.reduce(
    (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
    0
  );

  return (
    <LetterheadDocument
      projectName={project.name}
      projectAddress={project.address}
      documentTitle="Daily Log"
      documentDate={formatDate(log.date)}
    >
      {/* Summary */}
      <View style={docStyles.summaryCard}>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{totalWorkers}</Text>
          <Text style={docStyles.summaryLabel}>Workers</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{log.equipment.length}</Text>
          <Text style={docStyles.summaryLabel}>Equipment</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{log.workPerformed.length}</Text>
          <Text style={docStyles.summaryLabel}>Activities</Text>
        </View>
        <View style={docStyles.summaryItem}>
          <Text style={docStyles.summaryValue}>{log.changes.length}</Text>
          <Text style={docStyles.summaryLabel}>Changes</Text>
        </View>
      </View>

      {/* Weather */}
      <Text style={docStyles.sectionTitle}>Weather</Text>
      <View style={s.weatherGrid}>
        <View style={s.weatherItem}>
          <Text style={docStyles.keyLabel}>Conditions</Text>
          <Text style={docStyles.keyValue}>{log.weather.conditions}</Text>
        </View>
        <View style={s.weatherItem}>
          <Text style={docStyles.keyLabel}>Temperature</Text>
          <Text style={docStyles.keyValue}>{log.weather.temperature}°F</Text>
        </View>
        <View style={s.weatherItem}>
          <Text style={docStyles.keyLabel}>Impact</Text>
          <Text style={docStyles.keyValue}>
            {log.weather.impact.replace(/_/g, ' ')}
          </Text>
        </View>
        {log.weather.humidity != null && (
          <View style={s.weatherItem}>
            <Text style={docStyles.keyLabel}>Humidity</Text>
            <Text style={docStyles.keyValue}>{log.weather.humidity}%</Text>
          </View>
        )}
        {log.weather.windSpeed != null && (
          <View style={s.weatherItem}>
            <Text style={docStyles.keyLabel}>Wind</Text>
            <Text style={docStyles.keyValue}>
              {log.weather.windSpeed} mph {log.weather.windDirection || ''}
            </Text>
          </View>
        )}
        {log.weather.groundConditions && (
          <View style={s.weatherItem}>
            <Text style={docStyles.keyLabel}>Ground</Text>
            <Text style={docStyles.keyValue}>{log.weather.groundConditions}</Text>
          </View>
        )}
      </View>

      {/* Manpower */}
      {log.manpower.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Manpower</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '30%' }]}>Trade</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>JM</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>APP</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>FM</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Total</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '13%' }]}>Hours</Text>
            </View>
            {log.manpower.map((m, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '30%' }]}>{m.trade}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{m.journeymanCount}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{m.apprenticeCount}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{m.foremanCount}</Text>
                <Text style={[docStyles.tableCell, { width: '12%' }]}>
                  {m.journeymanCount + m.apprenticeCount + m.foremanCount}
                </Text>
                <Text style={[docStyles.tableCell, { width: '13%' }]}>
                  {m.hoursWorked ?? 8}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Equipment */}
      {log.equipment.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Equipment</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '35%' }]}>Name</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Category</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Ownership</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '25%' }]}>Hours</Text>
            </View>
            {log.equipment.map((e, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '35%' }]}>{e.name}</Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>{e.category}</Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>{e.ownership}</Text>
                <Text style={[docStyles.tableCell, { width: '25%' }]}>
                  {e.hoursUsed ?? '—'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Work Performed */}
      {log.workPerformed.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Work Performed</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>CSI</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '25%' }]}>Activity</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Zone</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Status</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '10%' }]}>Qty</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '8%' }]}>Unit</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Notes</Text>
            </View>
            {log.workPerformed.map((w, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '10%' }]}>{w.csiDivision}</Text>
                <Text style={[docStyles.tableCell, { width: '25%' }]}>{w.activity}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{w.taktZone || '—'}</Text>
                <Text style={[docStyles.tableCell, { width: '12%' }]}>
                  {w.status.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '10%' }]}>
                  {w.quantity ?? '—'}
                </Text>
                <Text style={[docStyles.tableCell, { width: '8%' }]}>
                  {w.unitOfMeasure || '—'}
                </Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>{w.notes || ''}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* RFIs */}
      {log.rfis.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>RFIs</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Number</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '35%' }]}>Subject</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Responsible</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Days Open</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Status</Text>
            </View>
            {log.rfis.map((r, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{r.rfiNumber}</Text>
                <Text style={[docStyles.tableCell, { width: '35%' }]}>{r.subject}</Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>{r.responsibleParty}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{r.daysOpen}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{r.status}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Submittals */}
      {log.submittals.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Submittals</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Number</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '35%' }]}>Description</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Spec</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Status</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Impact</Text>
            </View>
            {log.submittals.map((sub, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{sub.submittalNumber}</Text>
                <Text style={[docStyles.tableCell, { width: '35%' }]}>{sub.description}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{sub.specSection}</Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>
                  {sub.status.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {sub.scheduleImpact ? 'Yes' : 'No'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Inspections */}
      {log.inspections.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Inspections</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Type</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Inspector</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Company</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Result</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>In</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Out</Text>
            </View>
            {log.inspections.map((insp, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>
                  {insp.type.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>{insp.inspectorName}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{insp.company}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{insp.result}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{insp.timeIn}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>{insp.timeOut}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Changes */}
      {log.changes.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Changes</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Initiator</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '35%' }]}>Description</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Type</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Cost $</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Schedule</Text>
            </View>
            {log.changes.map((c, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {c.initiatedBy.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '35%' }]}>{c.description}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {c.changeType || c.impact}
                </Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {c.estimatedCostImpact != null
                    ? `$${c.estimatedCostImpact.toLocaleString()}`
                    : '—'}
                </Text>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>
                  {c.estimatedScheduleImpact != null
                    ? `${c.estimatedScheduleImpact} days`
                    : '—'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Conflicts */}
      {log.conflicts.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Conflicts</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Category</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '12%' }]}>Severity</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '38%' }]}>Description</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '30%' }]}>Parties</Text>
            </View>
            {log.conflicts.map((c, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>
                  {c.category.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '12%' }]}>{c.severity}</Text>
                <Text style={[docStyles.tableCell, { width: '38%' }]}>{c.description}</Text>
                <Text style={[docStyles.tableCell, { width: '30%' }]}>
                  {c.partiesInvolved.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Delay Events */}
      {log.delayEvents && log.delayEvents.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Delay Events</Text>
          <View style={docStyles.table}>
            <View style={docStyles.tableHeaderRow}>
              <Text style={[docStyles.tableHeaderCell, { width: '20%' }]}>Type</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Cause</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '35%' }]}>Description</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Days</Text>
              <Text style={[docStyles.tableHeaderCell, { width: '15%' }]}>Cost</Text>
            </View>
            {log.delayEvents.map((d, i) => (
              <View key={i} style={docStyles.tableRow}>
                <Text style={[docStyles.tableCell, { width: '20%' }]}>
                  {d.delayType.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {d.causeCategory.replace(/_/g, ' ')}
                </Text>
                <Text style={[docStyles.tableCell, { width: '35%' }]}>{d.description}</Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {d.calendarDaysImpacted ?? '—'}
                </Text>
                <Text style={[docStyles.tableCell, { width: '15%' }]}>
                  {d.costImpact != null ? `$${d.costImpact.toLocaleString()}` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Safety Incidents */}
      {log.safetyIncidents && log.safetyIncidents.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Safety Incidents</Text>
          {log.safetyIncidents.map((si, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <View style={docStyles.keyValueRow}>
                <Text style={docStyles.keyLabel}>Type</Text>
                <Text style={docStyles.keyValue}>
                  {si.incidentType.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={docStyles.keyValueRow}>
                <Text style={docStyles.keyLabel}>Description</Text>
                <Text style={docStyles.keyValue}>{si.description}</Text>
              </View>
              {si.injuredPersonName && (
                <View style={docStyles.keyValueRow}>
                  <Text style={docStyles.keyLabel}>Injured Person</Text>
                  <Text style={docStyles.keyValue}>{si.injuredPersonName}</Text>
                </View>
              )}
              {si.immediateActions && si.immediateActions.length > 0 && (
                <View style={docStyles.keyValueRow}>
                  <Text style={docStyles.keyLabel}>Immediate Actions</Text>
                  <Text style={docStyles.keyValue}>
                    {si.immediateActions.join('; ')}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* Photos */}
      {log.photos.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>
            Photos ({log.photos.length})
          </Text>
          <View style={s.photoGrid}>
            {log.photos.map((photo, i) => (
              <View key={i} style={s.photoContainer}>
                {photo.file && photo.file.startsWith('data:') && (
                  /* eslint-disable-next-line jsx-a11y/alt-text */
                  <Image src={photo.file} style={s.photoImage} />
                )}
                <Text style={s.photoCaption}>
                  {photo.caption || `${photo.category} — ${formatDateShort(photo.timestamp.split('T')[0])}`}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Notes */}
      {log.notes && (
        <>
          <Text style={docStyles.sectionTitle}>Notes</Text>
          <Text style={s.notesText}>{log.notes}</Text>
        </>
      )}

      {/* Tomorrow Plan */}
      {log.tomorrowPlan.length > 0 && (
        <>
          <Text style={docStyles.sectionTitle}>Tomorrow&apos;s Plan</Text>
          {log.tomorrowPlan.map((item, i) => (
            <Text key={i} style={s.tomorrowItem}>
              {'\u2022'} {item}
            </Text>
          ))}
        </>
      )}
    </LetterheadDocument>
  );
}
