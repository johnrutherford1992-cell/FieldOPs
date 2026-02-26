// ============================================================
// Claude AI System Prompts for Weekly Reports, Change Orders,
// Legal Correspondence & Utilization Reports
// ============================================================

import type {
  DailyLog,
  Project,
  ReportFormat,
  ChangeEntry,
  LegalLetterType,
} from "./types";

// ---- Helper: Summarize daily log data for prompt context ----

function summarizeDailyLogs(logs: DailyLog[], project: Project): string {
  if (logs.length === 0) return "No daily logs recorded for this period.";

  const lines: string[] = [];

  for (const log of logs) {
    lines.push(`\n--- ${log.date} ---`);

    // Weather
    lines.push(
      `Weather: ${log.weather.conditions}, ${log.weather.temperature}°F, Impact: ${log.weather.impact}${
        log.weather.hoursLost ? ` (${log.weather.hoursLost}h lost)` : ""
      }`
    );
    if (log.weather.humidity || log.weather.windSpeed || log.weather.windDirection || log.weather.groundConditions) {
      lines.push(
        `  Humidity: ${log.weather.humidity || 'N/A'}%${log.weather.humidity ? '' : ''}, Wind: ${log.weather.windSpeed || 'N/A'} mph ${log.weather.windDirection || ''}, Ground: ${log.weather.groundConditions || 'N/A'}`
      );
    }

    // Manpower
    const totalWorkers = log.manpower.reduce(
      (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
      0
    );
    if (totalWorkers > 0) {
      lines.push(`Manpower: ${totalWorkers} total workers`);
      for (const m of log.manpower) {
        const sub = project.subcontractors.find((s) => s.id === m.subId);
        let manpowerLine = `  - ${sub?.company || m.trade}: ${m.foremanCount}F / ${m.journeymanCount}J / ${m.apprenticeCount}A`;
        if (m.hoursWorked) {
          manpowerLine += ` (${m.hoursWorked}h${m.overtimeHours ? ` + ${m.overtimeHours}h OT` : ''})`;
        }
        lines.push(manpowerLine);
      }
    }

    // Equipment
    if (log.equipment.length > 0) {
      lines.push(`Equipment: ${log.equipment.length} pieces`);
      for (const e of log.equipment) {
        lines.push(
          `  - ${e.name} (${e.category}, ${e.ownership})${e.hoursUsed ? ` ${e.hoursUsed}h` : ""}`
        );
      }
    }

    // Work Performed
    if (log.workPerformed.length > 0) {
      lines.push(`Work Performed:`);
      for (const w of log.workPerformed) {
        let workLine = `  - CSI ${w.csiDivision}: ${w.activity} at ${w.taktZone} [${w.status}]`;
        if (w.quantity) {
          workLine += ` | ${w.quantity} ${w.unitOfMeasure || 'units'}`;
        }
        if (w.crewSize || w.crewHoursWorked || w.percentComplete) {
          workLine += ` | Crew: ${w.crewSize || 'N/A'}, Hours: ${w.crewHoursWorked || 'N/A'}`;
          if (w.percentComplete !== undefined) {
            workLine += `, ${w.percentComplete}% complete`;
          }
        }
        if (w.notes) {
          workLine += ` — ${w.notes}`;
        }
        lines.push(workLine);
      }
    }

    // Inspections
    if (log.inspections.length > 0) {
      lines.push(`Inspections:`);
      for (const i of log.inspections) {
        lines.push(
          `  - ${i.inspectorName} (${i.type}): ${i.result}${
            i.followUpItems ? ` — Follow-up: ${i.followUpItems}` : ""
          }`
        );
      }
    }

    // Changes
    if (log.changes.length > 0) {
      lines.push(`Changes & Directives:`);
      for (const c of log.changes) {
        let changeLine = `  - Initiated by ${c.initiatedBy}: ${c.description} [Impact: ${c.impact}]`;
        if (c.changeType || c.estimatedCostImpact !== undefined || c.estimatedScheduleImpact !== undefined || c.contractClause) {
          changeLine += ` [${c.changeType || 'TBD'}] Cost: $${c.estimatedCostImpact ? c.estimatedCostImpact.toLocaleString() : 'TBD'}, Schedule: ${c.estimatedScheduleImpact || 0} days, Clause: ${c.contractClause || 'N/A'}`;
        }
        lines.push(changeLine);
      }
    }

    // Conflicts
    if (log.conflicts.length > 0) {
      lines.push(`Conflicts & Issues:`);
      for (const c of log.conflicts) {
        let conflictLine = `  - [${c.severity.toUpperCase()}] ${c.category}: ${c.description}`;
        if (c.estimatedCostImpact !== undefined || c.resolutionStatus) {
          conflictLine += ` | Cost Impact: $${c.estimatedCostImpact ? c.estimatedCostImpact.toLocaleString() : '0'}, Status: ${c.resolutionStatus || 'open'}`;
        }
        lines.push(conflictLine);
      }
    }

    // Delay Events
    if (log.delayEvents && log.delayEvents.length > 0) {
      lines.push(`Delay Events:`);
      for (const d of log.delayEvents) {
        lines.push(
          `  - [${d.delayType.toUpperCase()}] ${d.description} — ${d.calendarDaysImpacted || 0} calendar days, ${d.workingDaysImpacted || 0} working days, Responsible: ${d.responsibleParty}`
        );
        if (d.costImpact) {
          lines.push(`    Cost Impact: $${d.costImpact.toLocaleString()}`);
        }
        if (d.criticalPathImpacted) {
          lines.push(`    ⚠ CRITICAL PATH IMPACTED`);
        }
      }
    }

    // Safety Incidents
    if (log.safetyIncidents && log.safetyIncidents.length > 0) {
      lines.push(`Safety Incidents:`);
      for (const s of log.safetyIncidents) {
        lines.push(
          `  - [${s.incidentType.toUpperCase()}] ${s.description} — ${s.injuredPersonName || 'No injury'}`
        );
        if (s.oshaReportable) {
          lines.push(`    ⚠ OSHA REPORTABLE`);
        }
        if (s.correctiveActions) {
          lines.push(`    Corrective: ${s.correctiveActions}`);
        }
      }
    }

    // Notes
    if (log.notes) {
      lines.push(`Notes: ${log.notes}`);
    }
    if (log.tomorrowPlan.length > 0) {
      lines.push(`Tomorrow: ${log.tomorrowPlan.join("; ")}`);
    }
  }

  return lines.join("\n");
}

// ============================================================
// WEEKLY REPORT PROMPTS
// ============================================================

const FORMAT_INSTRUCTIONS: Record<ReportFormat, string> = {
  client: `You are writing a PROFESSIONAL CLIENT/OWNER WEEKLY REPORT for a commercial construction project.
Audience: Property owner, client representatives, and investors.
Tone: Professional, confident, and transparent. Focus on progress milestones and schedule adherence.
Emphasize:
- Overall project progress percentage and schedule status
- Key milestones achieved this week
- Look-ahead items for next 2 weeks
- Any items requiring owner decisions or approvals
- Cost-relevant items (change orders, potential impacts)
- Productivity summary: overall index and any activities significantly ahead or behind
- Professional-quality language suitable for executive review
Do NOT include internal risk details or sub-specific labor issues.`,

  design_team: `You are writing a DESIGN TEAM WEEKLY REPORT for a commercial construction project.
Audience: Architect, structural engineer, MEP engineers, and design consultants.
Tone: Technical and detail-oriented. Focus on design coordination issues.
Emphasize:
- Field conditions that differ from drawings
- Coordination issues between trades
- Inspection results and code compliance items
- Any design clarifications needed
Include specific CSI division references and technical details.`,

  subcontractor: `You are writing a SUBCONTRACTOR COORDINATION REPORT for a commercial construction project.
Audience: All subcontractors and their project managers.
Tone: Direct and actionable. Focus on coordination and scheduling.
Emphasize:
- Work completed by each trade this week
- Upcoming schedule and sequencing for next 2 weeks
- Takt zone status and handoffs between trades
- Manpower expectations and requirements
- Equipment scheduling and access coordination
- Safety reminders and any incidents/near-misses
- Crew productivity rates by trade where available
- Upcoming quantity targets based on current production rates
Keep it practical and focused on what subs need to know.`,

  internal: `You are writing an INTERNAL/RISK MANAGEMENT REPORT for a commercial construction project.
Audience: Company leadership, project management team, and risk officers.
Tone: Candid and analytical. This is an internal document — be direct about risks.
Emphasize:
- Schedule risks and critical path impacts
- Cost exposure (changes, potential back-charges, claims)
- Conflict and dispute tracking with severity assessments
- Safety incidents and near-misses with root cause
- Subcontractor performance issues
- Weather impacts and recovery plans
- Legal correspondence sent or pending
- Manpower trends and productivity concerns
- Equipment utilization and cost analysis
- Productivity metrics: current unit rates vs baseline for each active cost code
- At-risk activities with declining productivity trends
- Cost variances: actual cost per unit vs budgeted, total $ impact
- Delay event summary: types, responsible parties, calendar/working days impacted
- Safety incident summary: types, OSHA reportable status
Be honest about problems. This report drives executive decisions.`,
};

export function buildWeeklyReportPrompt(
  project: Project,
  logs: DailyLog[],
  formatType: ReportFormat,
  weekStart: string,
  weekEnd: string
): string {
  const summary = summarizeDailyLogs(logs, project);

  return `${FORMAT_INSTRUCTIONS[formatType]}

PROJECT: ${project.name}
CLIENT: ${project.client}
CONTRACT VALUE: $${(project.contractValue || 0).toLocaleString()}
REPORT PERIOD: ${weekStart} to ${weekEnd}

DAILY LOG DATA FOR THIS WEEK:
${summary}

Generate a comprehensive weekly report in HTML format.
Use professional formatting with:
- Report header with project name, report period, and report type
- Executive summary (2-3 sentences)
- Sections with clear headers
- Tables where appropriate (manpower, schedule items)
- Action items with owners and due dates
- Professional language suitable for the target audience

Output ONLY the HTML content (no markdown, no code fences). Use clean semantic HTML with inline styles for professional formatting.`;
}

// ============================================================
// CHANGE ORDER PROMPTS
// ============================================================

export function buildChangeOrderPrompt(
  project: Project,
  changeEntry: ChangeEntry,
  dailyLogDate: string,
  affectedSubNames: string[]
): string {
  return `You are a construction project manager drafting a CHANGE ORDER for a commercial construction project.

PROJECT: ${project.name}
CLIENT: ${project.client}
DATE IDENTIFIED: ${dailyLogDate}

CHANGE DESCRIPTION:
${changeEntry.description}

INITIATED BY: ${changeEntry.initiatedBy}
IMPACT: ${changeEntry.impact}
AFFECTED CSI DIVISIONS: ${changeEntry.affectedDivisions.join(", ")}
AFFECTED SUBCONTRACTORS: ${affectedSubNames.join(", ")}

Generate a professional Change Order draft in HTML format that includes:
1. Change Order header with project info and sequential CO number
2. Description of the change and reason
3. Affected scope of work with CSI division references
4. List of affected subcontractors with quote request notes
5. Cost impact section (TBD — pending sub quotes)
6. Schedule impact assessment
7. Required approvals section
8. Signature lines for: GC Project Manager, Owner Representative

Output ONLY the HTML content. Use professional formatting with inline styles. Include a "DRAFT" watermark indication.`;
}

// ============================================================
// LEGAL CORRESPONDENCE PROMPTS
// ============================================================

const LEGAL_LETTER_INSTRUCTIONS: Record<LegalLetterType, string> = {
  back_charge: `Draft a BACK-CHARGE NOTICE to a subcontractor.
This letter formally notifies the subcontractor that work has been performed by others to correct deficiencies in their scope, and the cost will be deducted from their contract.
Include: specific deficiency description, date identified, corrective work performed, cost breakdown, contract clause references, right to respond/dispute.`,

  delay_notice: `Draft a NOTICE OF DELAY to the appropriate party.
This letter formally documents a delay event and its impact on the project schedule.
Include: description of delay, date delay began, estimated duration, impact on critical path, affected trades, mitigation measures taken, request for time extension if applicable, contract clause references.`,

  cure_notice: `Draft a NOTICE TO CURE (CURE NOTICE) to a subcontractor.
This is a formal warning that the subcontractor is in breach of their contract and must remedy the situation within a specified period.
Include: specific breach description, contract provisions violated, required corrective actions, cure period (typically 5-10 business days), consequences of failure to cure (including potential termination), contract clause references.`,

  change_directive: `Draft a CONSTRUCTION CHANGE DIRECTIVE (CCD) to a subcontractor.
This directive requires the subcontractor to proceed with changed work before a formal change order is executed.
Include: description of changed work, reason for change, directive to proceed, cost tracking requirements, time impact assessment, contract clause authorizing CCDs.`,

  general: `Draft a GENERAL CORRESPONDENCE letter for the construction project.
This is a formal letter to document a project matter.
Include: clear subject line, factual description of the matter, relevant dates and references, any required actions, and appropriate formal closing.`,
};

export function buildLegalLetterPrompt(
  project: Project,
  letterType: LegalLetterType,
  recipientName: string,
  recipientCompany: string,
  description: string,
  contractReferences: { clauseNumber: string; quotedText: string }[],
  relatedDailyLogDate?: string
): string {
  const refText =
    contractReferences.length > 0
      ? contractReferences
          .map((r) => `  - Clause ${r.clauseNumber}: "${r.quotedText}"`)
          .join("\n")
      : "  No specific contract references provided — use standard AIA/ConsensusDocs language.";

  return `${LEGAL_LETTER_INSTRUCTIONS[letterType]}

PROJECT: ${project.name}
PROJECT ADDRESS: ${project.address}
GC: Blackstone Construction
FROM: John Rutherford, President — Blackstone Construction
TO: ${recipientName}, ${recipientCompany}
${relatedDailyLogDate ? `RELATED DAILY LOG: ${relatedDailyLogDate}` : ""}

MATTER DESCRIPTION:
${description}

CONTRACT REFERENCES:
${refText}

Generate a formal business letter in HTML format.
Requirements:
- Blackstone Construction letterhead (company name, address)
- Date and reference/tracking number
- Formal salutation and closing
- Clear, professional legal language
- Specific contract clause citations where applicable
- "Sent via Email and Certified Mail" notation
- Signature block for John Rutherford, President
- CC line for project file

Output ONLY the HTML content. Use professional formatting with inline styles. This is a legal document — be precise and formal.`;
}

// ============================================================
// PRODUCTIVITY CONTEXT
// ============================================================

/**
 * Summarize productivity and analytics context for AI-powered reports
 * Provides unit rates, baseline comparisons, and cost variances
 */
export async function summarizeProductivityContext(projectId: string): Promise<string> {
  // Import dynamically to avoid circular deps
  const { getProductivitySummary } = await import("@/lib/productivity-engine");

  try {
    const summary = await getProductivitySummary(projectId);

    if (summary.costCodeSummaries.length === 0) {
      return "No productivity data available yet.";
    }

    const lines: string[] = [];
    lines.push("=== PRODUCTIVITY CONTEXT ===");
    lines.push(
      `Overall Productivity Index: ${summary.overallProductivityIndex?.toFixed(2) ?? "N/A"}`
    );
    lines.push(`Cost Codes Tracked: ${summary.totalCostCodes}`);
    lines.push(`Activities At Risk: ${summary.atRiskCount}`);
    lines.push("");

    // At-risk activities (most important for reports)
    const atRisk = summary.costCodeSummaries.filter((s) => s.isAtRisk);
    if (atRisk.length > 0) {
      lines.push("AT-RISK ACTIVITIES (productivity index below 0.85):");
      for (const s of atRisk) {
        lines.push(
          `  - ${s.costCode.code} ${s.costCode.description}: Index ${s.productivityIndex?.toFixed(
            2
          )}, Current Rate: ${s.currentUnitRate.toFixed(2)} ${
            s.costCode.unitOfMeasure
          }/hr vs Baseline: ${s.baselineUnitRate?.toFixed(2) ?? "N/A"}, ${s.daysBehind.toFixed(
            0
          )} days behind`
        );
      }
      lines.push("");
    }

    // Top performers
    const ahead = summary.costCodeSummaries.filter(
      (s) => s.productivityIndex !== null && s.productivityIndex >= 1.05
    );
    if (ahead.length > 0) {
      lines.push("AHEAD OF SCHEDULE:");
      for (const s of ahead) {
        lines.push(
          `  - ${s.costCode.code} ${s.costCode.description}: Index ${s.productivityIndex?.toFixed(
            2
          )}, ${s.percentComplete.toFixed(0)}% complete`
        );
      }
      lines.push("");
    }

    // All activities summary
    lines.push("ALL ACTIVITIES:");
    for (const s of summary.costCodeSummaries) {
      const trend =
        s.trendDirection === "improving"
          ? "↑"
          : s.trendDirection === "declining"
            ? "↓"
            : "→";
      lines.push(
        `  ${s.costCode.code}: ${s.currentUnitRate.toFixed(2)} ${
          s.costCode.unitOfMeasure
        }/hr ${trend} | ${s.totalQuantityInstalled.toLocaleString()} of ${s.costCode.budgetedQuantity.toLocaleString()} ${
          s.costCode.unitOfMeasure
        } (${s.percentComplete.toFixed(0)}%)`
      );
    }

    return lines.join("\n");
  } catch {
    return "Productivity data could not be loaded.";
  }
}

// ============================================================
// MOCK GENERATORS (for demo mode without API key)
// ============================================================

export function generateMockWeeklyReport(
  project: Project,
  formatType: ReportFormat,
  weekStart: string,
  weekEnd: string,
  logs: DailyLog[]
): string {
  const totalWorkers = logs.reduce(
    (sum, log) =>
      sum +
      log.manpower.reduce(
        (s, m) => s + m.journeymanCount + m.apprenticeCount + m.foremanCount,
        0
      ),
    0
  );
  const avgWorkers = logs.length > 0 ? Math.round(totalWorkers / logs.length) : 0;
  const totalWorkItems = logs.reduce((s, l) => s + l.workPerformed.length, 0);
  const totalConflicts = logs.reduce((s, l) => s + l.conflicts.length, 0);
  const totalChanges = logs.reduce((s, l) => s + l.changes.length, 0);
  const weatherDays = logs.filter((l) => l.weather.impact === "weather_day").length;

  const formatLabels: Record<ReportFormat, string> = {
    client: "Client / Owner Report",
    design_team: "Design Team Report",
    subcontractor: "Subcontractor Coordination Report",
    internal: "Internal / Risk Report",
  };

  let sections = "";

  if (formatType === "client") {
    sections = `
      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Executive Summary</h2>
      <p>Construction activities progressed on schedule during the reporting period. Average daily manpower of ${avgWorkers} workers across ${logs.reduce((s, l) => s + l.manpower.length, 0)} active trades. ${totalWorkItems} work activities were documented with ${weatherDays} weather day${weatherDays !== 1 ? "s" : ""} recorded.</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Progress Summary</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead><tr style="background:#000;color:#fff;">
          <th style="padding:8px;text-align:left;">Metric</th>
          <th style="padding:8px;text-align:right;">This Week</th>
        </tr></thead>
        <tbody>
          <tr style="background:#f2f0e6;"><td style="padding:8px;">Average Daily Manpower</td><td style="padding:8px;text-align:right;">${avgWorkers}</td></tr>
          <tr><td style="padding:8px;">Work Activities Logged</td><td style="padding:8px;text-align:right;">${totalWorkItems}</td></tr>
          <tr style="background:#f2f0e6;"><td style="padding:8px;">Weather Days</td><td style="padding:8px;text-align:right;">${weatherDays}</td></tr>
        </tbody>
      </table>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Items Requiring Owner Attention</h2>
      <ul style="margin:8px 0;padding-left:20px;">
        ${totalChanges > 0 ? `<li>${totalChanges} change directive${totalChanges !== 1 ? "s" : ""} identified — pending cost impact assessment</li>` : "<li>No pending items at this time</li>"}
      </ul>`;
  } else if (formatType === "design_team") {
    sections = `
      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Field Conditions & Coordination</h2>
      <p>${totalWorkItems} work activities logged across multiple CSI divisions. ${totalConflicts > 0 ? `${totalConflicts} field coordination issue${totalConflicts !== 1 ? "s" : ""} documented — see details below.` : "No significant coordination issues this period."}</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Inspection Summary</h2>
      <p>${logs.reduce((s, l) => s + l.inspections.length, 0)} inspection${logs.reduce((s, l) => s + l.inspections.length, 0) !== 1 ? "s" : ""} conducted during the reporting period.</p>`;
  } else if (formatType === "subcontractor") {
    sections = `
      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Manpower Summary</h2>
      <p>Average daily workforce: ${avgWorkers} workers across the project. All subcontractors are expected to maintain staffing levels as required by the project schedule.</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Schedule & Coordination</h2>
      <p>${totalWorkItems} work activities documented this week. All trades should coordinate takt zone handoffs with the superintendent.</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Safety Reminders</h2>
      <ul style="margin:8px 0;padding-left:20px;">
        <li>All workers must attend daily JHA review before starting work</li>
        <li>PPE requirements are strictly enforced — hard hats, safety glasses, high-vis at all times</li>
        <li>Housekeeping: maintain clean work areas in all takt zones</li>
        ${totalConflicts > 0 ? `<li style="color:#dc2626;font-weight:600;">${totalConflicts} issue${totalConflicts !== 1 ? "s" : ""} reported this week — review with your crews</li>` : ""}
      </ul>`;
  } else {
    // internal
    sections = `
      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Risk Assessment</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead><tr style="background:#000;color:#fff;">
          <th style="padding:8px;text-align:left;">Category</th>
          <th style="padding:8px;text-align:center;">Count</th>
          <th style="padding:8px;text-align:left;">Status</th>
        </tr></thead>
        <tbody>
          <tr style="background:#f2f0e6;"><td style="padding:8px;">Conflicts / Issues</td><td style="padding:8px;text-align:center;">${totalConflicts}</td><td style="padding:8px;">${totalConflicts > 0 ? "⚠ Requires attention" : "✓ Clear"}</td></tr>
          <tr><td style="padding:8px;">Changes / Directives</td><td style="padding:8px;text-align:center;">${totalChanges}</td><td style="padding:8px;">${totalChanges > 0 ? "⚠ Cost exposure" : "✓ None"}</td></tr>
          <tr style="background:#f2f0e6;"><td style="padding:8px;">Weather Days</td><td style="padding:8px;text-align:center;">${weatherDays}</td><td style="padding:8px;">${weatherDays > 0 ? "⚠ Schedule impact" : "✓ No impact"}</td></tr>
        </tbody>
      </table>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Manpower & Productivity</h2>
      <p>Average daily workforce: ${avgWorkers}. ${logs.length} log${logs.length !== 1 ? "s" : ""} submitted this period.</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Action Items</h2>
      <ul style="margin:8px 0;padding-left:20px;">
        ${totalConflicts > 0 ? `<li><strong>PRIORITY:</strong> Resolve ${totalConflicts} outstanding conflict${totalConflicts !== 1 ? "s" : ""}</li>` : ""}
        ${totalChanges > 0 ? `<li>Process ${totalChanges} change directive${totalChanges !== 1 ? "s" : ""} — obtain sub quotes</li>` : ""}
        <li>Continue daily log compliance</li>
      </ul>`;
  }

  return `<div style="font-family:'Avenir Next',Avenir,Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;">
    <div style="background:#000;color:#fff;padding:20px 24px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:20px;font-weight:600;">BLACKSTONE CONSTRUCTION</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.8;">${formatLabels[formatType]}</p>
    </div>

    <div style="padding:0 24px;">
      <table style="width:100%;margin-bottom:20px;font-size:14px;">
        <tr><td style="color:#666;width:120px;">Project:</td><td style="font-weight:600;">${project.name}</td></tr>
        <tr><td style="color:#666;">Client:</td><td>${project.client}</td></tr>
        <tr><td style="color:#666;">Report Period:</td><td>${weekStart} — ${weekEnd}</td></tr>
        <tr><td style="color:#666;">Prepared By:</td><td>FieldOps AI (Demonstration)</td></tr>
      </table>

      ${sections}

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">
        <p>This report was generated by FieldOps AI based on daily log entries. For questions, contact the project superintendent.</p>
      </div>
    </div>
  </div>`;
}

export function generateMockChangeOrder(
  project: Project,
  change: ChangeEntry,
  dailyLogDate: string,
  affectedSubNames: string[]
): string {
  return `<div style="font-family:'Avenir Next',Avenir,Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;">
    <div style="background:#000;color:#fff;padding:20px 24px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="margin:0;font-size:20px;font-weight:600;">BLACKSTONE CONSTRUCTION</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:0.8;">Change Order — DRAFT</p>
        </div>
        <div style="background:#dc2626;color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:700;">DRAFT</div>
      </div>
    </div>

    <div style="padding:0 24px;">
      <table style="width:100%;margin-bottom:20px;font-size:14px;">
        <tr><td style="color:#666;width:140px;">Project:</td><td style="font-weight:600;">${project.name}</td></tr>
        <tr><td style="color:#666;">CO Number:</td><td style="font-weight:600;">CO-001 (Draft)</td></tr>
        <tr><td style="color:#666;">Date Identified:</td><td>${dailyLogDate}</td></tr>
        <tr><td style="color:#666;">Initiated By:</td><td>${change.initiatedBy.charAt(0).toUpperCase() + change.initiatedBy.slice(1).replace("_", " ")}</td></tr>
        <tr><td style="color:#666;">Impact:</td><td style="font-weight:600;color:${change.impact === "both" ? "#dc2626" : "#d97706"};">${change.impact.toUpperCase()}</td></tr>
      </table>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Description of Change</h2>
      <p>${change.description}</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Affected Scope</h2>
      <p>CSI Divisions: ${change.affectedDivisions.join(", ")}</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Affected Subcontractors</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead><tr style="background:#000;color:#fff;">
          <th style="padding:8px;text-align:left;">Subcontractor</th>
          <th style="padding:8px;text-align:center;">Quote Requested</th>
          <th style="padding:8px;text-align:right;">Amount</th>
        </tr></thead>
        <tbody>
          ${affectedSubNames.map((name, i) => `<tr style="${i % 2 === 0 ? "background:#f2f0e6;" : ""}"><td style="padding:8px;">${name}</td><td style="padding:8px;text-align:center;">Pending</td><td style="padding:8px;text-align:right;">TBD</td></tr>`).join("")}
        </tbody>
      </table>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Cost Impact</h2>
      <p style="color:#666;font-style:italic;">Pending subcontractor quotes. Cost impact to be determined.</p>

      <h2 style="color:#000;border-bottom:2px solid #000;padding-bottom:4px;">Schedule Impact</h2>
      <p style="color:#666;font-style:italic;">${change.impact === "schedule" || change.impact === "both" ? "Schedule impact anticipated — detailed analysis pending." : "No schedule impact anticipated at this time."}</p>

      <div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;">
        <div>
          <div style="border-top:1px solid #000;padding-top:8px;">
            <p style="margin:0;font-size:14px;font-weight:600;">GC Project Manager</p>
            <p style="margin:0;font-size:12px;color:#666;">Date: ___________</p>
          </div>
        </div>
        <div>
          <div style="border-top:1px solid #000;padding-top:8px;">
            <p style="margin:0;font-size:14px;font-weight:600;">Owner Representative</p>
            <p style="margin:0;font-size:12px;color:#666;">Date: ___________</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function generateMockLegalLetter(
  project: Project,
  letterType: LegalLetterType,
  recipientName: string,
  recipientCompany: string,
  description: string,
  contractRefs: { clauseNumber: string; quotedText: string }[]
): string {
  const letterTypeLabels: Record<LegalLetterType, string> = {
    back_charge: "Notice of Back-Charge",
    delay_notice: "Notice of Delay",
    cure_notice: "Notice to Cure",
    change_directive: "Construction Change Directive",
    general: "General Correspondence",
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const refNumber = `BC-${project.name.replace(/\s+/g, "").substring(0, 6).toUpperCase()}-${Date.now().toString(36).substring(0, 4).toUpperCase()}`;

  return `<div style="font-family:'Avenir Next',Avenir,Helvetica,Arial,sans-serif;max-width:800px;margin:0 auto;">
    <div style="border-bottom:3px solid #000;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">BLACKSTONE CONSTRUCTION</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">General Contractor &amp; Construction Manager</p>
    </div>

    <div style="font-size:14px;line-height:1.6;">
      <p>${today}</p>
      <p style="color:#666;font-size:12px;">Ref: ${refNumber}</p>
      <p style="font-style:italic;font-size:12px;color:#666;">Sent via Email and Certified Mail</p>

      <p style="margin-top:16px;">
        ${recipientName}<br/>
        ${recipientCompany}<br/>
      </p>

      <p><strong>Re: ${letterTypeLabels[letterType]} — ${project.name}</strong></p>

      <p>Dear ${recipientName},</p>

      <p>This letter serves as formal notice regarding the following matter on the above-referenced project located at ${project.address}:</p>

      <div style="background:#f2f0e6;padding:16px;border-left:4px solid #000;margin:16px 0;">
        <p style="margin:0;">${description}</p>
      </div>

      ${contractRefs.length > 0 ? `
      <p><strong>Contract References:</strong></p>
      <ul style="margin:8px 0;padding-left:20px;">
        ${contractRefs.map((r) => `<li>Section ${r.clauseNumber}: <em>"${r.quotedText}"</em></li>`).join("")}
      </ul>` : ""}

      <p>Blackstone Construction reserves all rights and remedies available under the contract and applicable law. Please respond to this notice within five (5) business days of receipt.</p>

      <p>Please direct all correspondence regarding this matter to the undersigned.</p>

      <p style="margin-top:32px;">
        Respectfully,<br/><br/><br/>
        <strong>John Rutherford</strong><br/>
        President<br/>
        Blackstone Construction<br/>
        john@blackstone.build
      </p>

      <p style="margin-top:24px;font-size:12px;color:#666;">
        cc: Project File<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;${project.name} — Daily Log Records
      </p>
    </div>
  </div>`;
}
