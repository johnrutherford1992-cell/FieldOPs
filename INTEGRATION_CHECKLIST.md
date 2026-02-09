# FieldOps Legal Dispute Protection Layer — Integration Checklist

## Quick Reference for Integrating Legal Models

Use this checklist to systematically integrate the legal dispute protection layer into your FieldOps application.

---

## Phase 1: Type System Integration (Day 1)

### 1.1 Copy New Type File
```bash
# File already created at:
/sessions/sleepy-elegant-shannon/fieldops/src/lib/types-legal-enhanced.ts
# Contains: 10 interfaces + 11,000+ lines of legal documentation
```

### 1.2 Update `/src/lib/types.ts`
Add exports from the new legal types file:
```typescript
// At the end of types.ts, add:

export type {
  EnhancedDailyLogWeather,
  EnhancedManpowerEntry,
  EnhancedWorkPerformedEntry,
  EnhancedChangeEntry,
  EnhancedConflictEntry,
  EnhancedPhotoEntry,
  DelayEvent,
  NoticeLog,
  SafetyIncident,
  DailyLogTimestamp,
  EnhancedDailyLog,
} from "./types-legal-enhanced";
```

### 1.3 Verify TypeScript Compilation
```bash
npm run type-check
# Should pass without errors
```

---

## Phase 2: Database Schema Integration (Day 1-2)

### 2.1 Copy New Database File
```bash
# File already created at:
/sessions/sleepy-elegant-shannon/fieldops/src/lib/db-legal-enhanced.ts
# Contains: Dexie v2 schema + 20 litigation queries
```

### 2.2 Update `/src/lib/db.ts` to Dexie v2
Replace the current `db.ts` version method with:

```typescript
import Dexie, { type Table } from "dexie";
import type {
  Project,
  DailyJHA,
  DailyLog,
  WeeklyReport,
  ChangeOrder,
  LegalCorrespondence,
  DelayEvent,
  NoticeLog,
  SafetyIncident,
} from "./types";

class FieldOpsDB extends Dexie {
  projects!: Table<Project, string>;
  dailyJHAs!: Table<DailyJHA, string>;
  dailyLogs!: Table<DailyLog, string>;
  weeklyReports!: Table<WeeklyReport, string>;
  changeOrders!: Table<ChangeOrder, string>;
  legalCorrespondence!: Table<LegalCorrespondence, string>;

  // NEW: Legal dispute protection tables
  delayEvents!: Table<DelayEvent, string>;
  noticeLogs!: Table<NoticeLog, string>;
  safetyIncidents!: Table<SafetyIncident, string>;

  constructor() {
    super("FieldOpsDB");

    // VERSION 1 (existing): Keep for backward compatibility
    this.version(1).stores({
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",
    });

    // VERSION 2 (NEW): Add legal dispute protection
    this.version(2).stores({
      // Existing tables (same as v1, for compatibility)
      projects: "id, name, client, updatedAt",
      dailyJHAs: "id, projectId, date, status, createdAt",
      dailyLogs: "id, projectId, date, superintendentId, createdAt",
      weeklyReports: "id, projectId, weekStart, formatType, createdAt",
      changeOrders: "id, projectId, status, createdAt",
      legalCorrespondence: "id, projectId, type, status, createdAt",

      // NEW: Legal dispute protection tables
      delayEvents:
        "id, projectId, date, delayType, causeCategory, criticalPathImpacted, createdAt",
      noticeLogs:
        "id, projectId, noticeType, dateSent, responseDeadline, resolutionStatus, createdAt",
      safetyIncidents:
        "id, projectId, date, incidentType, oshaReportable, createdAt",
    });
  }
}

export const db = new FieldOpsDB();
```

### 2.3 Add Helper Queries to `/src/lib/db.ts`

Add all functions from `db-legal-enhanced.ts`:

```typescript
// ---- DELAY EVENT QUERIES ----

export async function getDelayEventsForProject(
  projectId: string
): Promise<DelayEvent[]> {
  return db.delayEvents.where("projectId").equals(projectId).toArray();
}

export async function getExcusableCompensableDelays(
  projectId: string
): Promise<DelayEvent[]> {
  return db.delayEvents
    .where({ projectId, delayType: "excusable_compensable" })
    .toArray();
}

export async function getInexcusableDelays(
  projectId: string
): Promise<DelayEvent[]> {
  return db.delayEvents
    .where({ projectId, delayType: "inexcusable" })
    .toArray();
}

export async function getCriticalPathDelays(
  projectId: string
): Promise<DelayEvent[]> {
  return db.delayEvents
    .where({ projectId, criticalPathImpacted: true })
    .toArray();
}

export async function getTotalCriticalPathDelayDays(
  projectId: string
): Promise<number> {
  const delays = await getCriticalPathDelays(projectId);
  return delays.reduce((sum, d) => sum + (d.workingDaysImpacted || 0), 0);
}

// ---- NOTICE LOG QUERIES ----

export async function getNoticeLogsForProject(
  projectId: string
): Promise<NoticeLog[]> {
  return db.noticeLogs.where("projectId").equals(projectId).toArray();
}

export async function getUnresponseNotices(
  projectId: string
): Promise<NoticeLog[]> {
  return db.noticeLogs
    .where({ projectId, responseRequired: true, responseReceived: false })
    .toArray();
}

// ---- SAFETY INCIDENT QUERIES ----

export async function getSafetyIncidentsForProject(
  projectId: string
): Promise<SafetyIncident[]> {
  return db.safetyIncidents.where("projectId").equals(projectId).toArray();
}

export async function getOSHAReportableIncidents(
  projectId: string
): Promise<SafetyIncident[]> {
  return db.safetyIncidents
    .where({ projectId, oshaReportable: true })
    .toArray();
}
```

### 2.4 Test Database Migration
```typescript
// In a test file or console:
import { db } from "@/lib/db";

// This should run without errors (Dexie auto-migrates)
const projects = await db.projects.toArray();
console.log("Database migration successful");
```

---

## Phase 3: Daily Log Form Integration (Day 2-5)

### 3.1 Update Weather Form Fields
In your weather form component, add:

```typescript
const weatherFields = [
  { label: "Conditions", field: "conditions", type: "text" },
  { label: "Temperature (°F)", field: "temperature", type: "number" },

  // NEW: Enhanced legal fields
  { label: "Humidity (%)", field: "humidity", type: "number", min: 0, max: 100 },
  { label: "Wind Speed (mph)", field: "windSpeed", type: "number" },
  { label: "Wind Direction (N/S/E/W/etc)", field: "windDirection", type: "text" },
  { label: "Precipitation Type", field: "precipitationType", type: "select",
    options: ["rain", "sleet", "snow", "hail", "none"] },
  { label: "Precipitation Amount (inches)", field: "precipitationAmount", type: "number" },
  { label: "Ground Conditions", field: "groundConditions", type: "text",
    placeholder: "dry, muddy, frozen, saturated, etc" },
  { label: "Visibility (miles)", field: "visibility", type: "number" },

  // Existing fields
  { label: "Impact", field: "impact", type: "select",
    options: ["full_day", "partial_delay", "weather_day"] },
  { label: "Hours Lost", field: "hoursLost", type: "number" },
];
```

### 3.2 Update Manpower Form Fields
In your manpower form component, add:

```typescript
const manpowerFields = [
  { label: "Subcontractor ID", field: "subId", type: "text" },
  { label: "Trade", field: "trade", type: "text" },
  { label: "Journeymen", field: "journeymanCount", type: "number" },
  { label: "Apprentices", field: "apprenticeCount", type: "number" },
  { label: "Foremen", field: "foremanCount", type: "number" },

  // NEW: Enhanced legal fields
  { label: "Hours Worked", field: "hoursWorked", type: "number", min: 0, max: 24 },
  { label: "Overtime Hours", field: "overtimeHours", type: "number", min: 0 },
  { label: "Start Time", field: "startTime", type: "time" },
  { label: "End Time", field: "endTime", type: "time" },
];
```

### 3.3 Update Work Performed Form Fields
In your work performed form component, add:

```typescript
const workPerformedFields = [
  { label: "CSI Division", field: "csiDivision", type: "text" },
  { label: "Activity", field: "activity", type: "text" },
  { label: "Takt Zone", field: "taktZone", type: "text" },
  { label: "Status", field: "status", type: "select",
    options: ["in_progress", "completed", "starting_next_week"] },

  // NEW: Enhanced legal fields (CRITICAL for measured mile)
  { label: "Quantity", field: "quantity", type: "number", required: true },
  { label: "Unit of Measure", field: "unitOfMeasure", type: "select",
    options: ["cy", "lf", "sf", "ea", "tons", "hours", "days"], required: true },
  { label: "Planned Quantity", field: "plannedQuantity", type: "number" },
  { label: "Crew Size", field: "crewSize", type: "number" },
  { label: "Crew Hours Worked", field: "crewHoursWorked", type: "number",
    help: "Total person-hours (e.g., 6 workers × 8 hours = 48)" },
  { label: "% Complete", field: "percentComplete", type: "number", min: 0, max: 100 },
  { label: "Actual Duration (days)", field: "actualDuration", type: "number" },
];
```

### 3.4 Update Change Entry Form Fields
In your change form component, add:

```typescript
const changeFields = [
  { label: "Initiated By", field: "initiatedBy", type: "select",
    options: ["owner", "architect", "engineer", "field_condition"] },
  { label: "Description", field: "description", type: "textarea" },
  { label: "Affected Divisions", field: "affectedDivisions", type: "tags" },
  { label: "Impact", field: "impact", type: "select",
    options: ["cost", "schedule", "both"] },

  // NEW: Enhanced legal fields
  { label: "Change Type", field: "changeType", type: "select",
    options: ["directed", "constructive", "cardinal"],
    help: "directed=owner explicit order, constructive=implied by owner action, cardinal=major change" },
  { label: "Estimated Cost Impact ($)", field: "estimatedCostImpact", type: "number" },
  { label: "Estimated Schedule Impact (days)", field: "estimatedScheduleImpact", type: "number" },
  { label: "Contract Clause", field: "contractClause", type: "text",
    placeholder: "e.g., AIA A101 Article 7" },
  { label: "Notice Date", field: "noticeDate", type: "date" },
  { label: "Response Deadline", field: "responseDeadline", type: "date" },
  { label: "Response Received", field: "responseReceived", type: "checkbox" },
  { label: "Directed By (Name/Title)", field: "directedBy", type: "text" },
];
```

### 3.5 Update Conflict Entry Form Fields
In your conflict form component, add:

```typescript
const conflictFields = [
  { label: "Category", field: "category", type: "select",
    options: ["property_damage", "sub_conflict", "owner_issue", "inspector_issue",
              "safety_incident", "schedule_conflict"] },
  { label: "Severity", field: "severity", type: "select",
    options: ["low", "medium", "high", "critical"] },
  { label: "Description", field: "description", type: "textarea" },
  { label: "Parties Involved", field: "partiesInvolved", type: "tags" },

  // NEW: Enhanced legal fields
  { label: "Time of Occurrence", field: "timeOfOccurrence", type: "datetime-local" },
  { label: "Estimated Cost Impact ($)", field: "estimatedCostImpact", type: "number" },
  { label: "Estimated Schedule Impact (days)", field: "estimatedScheduleDaysImpact", type: "number" },
  { label: "Resolution Status", field: "resolutionStatus", type: "select",
    options: ["open", "escalated", "resolved", "litigated"] },
  { label: "Resolution Date", field: "resolutionDate", type: "date" },
  { label: "Witness Names", field: "witnessNames", type: "tags",
    help: "Name, role, and company if possible (e.g., 'John Smith, Concrete Foreman, ABC Sub')" },
  { label: "Root Cause", field: "rootCause", type: "textarea" },
  { label: "Contract Reference", field: "contractReference", type: "text" },
];
```

### 3.6 Update Photo Form Fields
In your photo capture component, add:

```typescript
const photoFields = [
  { label: "CSI Division", field: "csiDivision", type: "text" },
  { label: "Takt Zone", field: "taktZone", type: "text" },
  { label: "Category", field: "category", type: "select",
    options: ["progress", "safety", "quality", "issue", "damage"] },
  { label: "Caption", field: "caption", type: "textarea" },

  // NEW: Enhanced legal fields
  { label: "GPS Latitude", field: "gpsLatitude", type: "number", step: 0.0001,
    help: "Auto-populated from device GPS if available" },
  { label: "GPS Longitude", field: "gpsLongitude", type: "number", step: 0.0001,
    help: "Auto-populated from device GPS if available" },
  { label: "Weather at Capture", field: "weatherAtCapture", type: "object",
    subfields: [
      { label: "Temperature", field: "temperature", type: "number" },
      { label: "Humidity", field: "humidity", type: "number" },
      { label: "Conditions", field: "conditions", type: "text" }
    ]
  },
  { label: "Witness Present", field: "witnessPresent", type: "checkbox" },
  { label: "Is This a Progress Photo?", field: "isProgressPhoto", type: "checkbox",
    help: "Check if routine progress; uncheck if documenting issue/defect" },
];
```

---

## Phase 4: New Screens for Delay/Notice/Safety (Day 5-7)

### 4.1 Create Delay Event Screen

```typescript
// src/app/daily-log/delay-event/page.tsx

import { DelayEvent } from "@/lib/types";

export default function DelayEventForm() {
  const handleSubmit = (formData: DelayEvent) => {
    // Save to db.delayEvents
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Delay Event Report</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Delay Type</label>
          <select name="delayType" required className="w-full border rounded px-3 py-2">
            <option value="excusable_compensable">Excusable Compensable (Owner caused)</option>
            <option value="excusable_noncompensable">Excusable Non-Compensable (Act of God)</option>
            <option value="inexcusable">Inexcusable (Contractor caused)</option>
            <option value="concurrent">Concurrent (Both parties caused)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cause Category</label>
          <select name="causeCategory" required className="w-full border rounded px-3 py-2">
            <option value="weather">Weather</option>
            <option value="owner_change">Owner Change</option>
            <option value="design_error">Design Error</option>
            <option value="differing_conditions">Differing Conditions</option>
            <option value="sub_default">Sub Default</option>
            <option value="force_majeure">Force Majeure</option>
            <option value="access_denied">Access Denied</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea name="description" required className="w-full border rounded px-3 py-2 h-24" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Working Days Impacted</label>
          <input type="number" name="workingDaysImpacted" required className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center">
          <input type="checkbox" name="criticalPathImpacted" id="critical" />
          <label htmlFor="critical" className="ml-2 text-sm">Critical Path Impacted (delays project completion)</label>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Save Delay Event
        </button>
      </form>
    </div>
  );
}
```

### 4.2 Create Notice Log Screen

```typescript
// src/app/daily-log/notice-log/page.tsx

import { NoticeLog } from "@/lib/types";

export default function NoticeLogForm() {
  const handleSubmit = (formData: NoticeLog) => {
    // Save to db.noticeLogs
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Formal Notice Log</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Notice Type</label>
          <select name="noticeType" required className="w-full border rounded px-3 py-2">
            <option value="delay">Delay Notice</option>
            <option value="claim">Claim Notice</option>
            <option value="backcharge">Back-charge Notice</option>
            <option value="cure">Cure Notice</option>
            <option value="change_directive">Change Directive</option>
            <option value="termination_warning">Termination Warning</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sent To</label>
          <input type="text" name="sentTo" required className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date Sent</label>
          <input type="date" name="dateSent" required className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Delivery Method</label>
          <select name="deliveryMethod" className="w-full border rounded px-3 py-2">
            <option value="email">Email</option>
            <option value="certified_mail">Certified Mail</option>
            <option value="hand_delivered">Hand Delivered</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Response Deadline</label>
          <input type="date" name="responseDeadline" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notice Content</label>
          <textarea name="content" className="w-full border rounded px-3 py-2 h-32" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Save Notice
        </button>
      </form>
    </div>
  );
}
```

### 4.3 Create Safety Incident Screen

```typescript
// src/app/daily-log/safety-incident/page.tsx

import { SafetyIncident } from "@/lib/types";

export default function SafetyIncidentForm() {
  const handleSubmit = (formData: SafetyIncident) => {
    // Save to db.safetyIncidents
    // Set oshaFormCompleted = true after filing Form 301
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Safety Incident Report</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Incident Type</label>
          <select name="incidentType" required className="w-full border rounded px-3 py-2">
            <option value="near_miss">Near Miss</option>
            <option value="first_aid">First Aid</option>
            <option value="recordable">Recordable (OSHA 24-hour reporting)</option>
            <option value="lost_time">Lost Time (worker absent)</option>
            <option value="fatality">Fatality</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Incident</label>
          <input type="date" name="date" required className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea name="description" required className="w-full border rounded px-3 py-2 h-24" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Injured Person Name</label>
          <input type="text" name="injuredPersonName" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Injured Person Employer</label>
          <input type="text" name="injuredPersonEmployer" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Root Cause</label>
          <textarea name="rootCause" className="w-full border rounded px-3 py-2 h-20" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Corrective Actions</label>
          <textarea name="correctiveActions" className="w-full border rounded px-3 py-2 h-20"
            placeholder="List actions taken to prevent recurrence" />
        </div>

        <div className="flex items-center">
          <input type="checkbox" name="oshaReportable" id="osha" />
          <label htmlFor="osha" className="ml-2 text-sm">This is an OSHA-Reportable Incident</label>
        </div>

        <div className="flex items-center">
          <input type="checkbox" name="oshaFormCompleted" id="form301" />
          <label htmlFor="form301" className="ml-2 text-sm">OSHA Form 301 Completed & Filed</label>
        </div>

        <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
          Save Safety Incident
        </button>
      </form>
    </div>
  );
}
```

---

## Phase 5: API Endpoints (Day 5-7)

### 5.1 Create Litigation API Route

```typescript
// src/app/api/litigation/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getDelayEventsForProject,
  getExcusableCompensableDelays,
  getInexcusableDelays,
  getCriticalPathDelays,
  getUnresponseNotices,
  getOSHAReportableIncidents,
  getProjectLitigationSummary,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const queryType = searchParams.get("type");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );
  }

  try {
    switch (queryType) {
      case "delays":
        return NextResponse.json(await getDelayEventsForProject(projectId));

      case "excusable-compensable":
        return NextResponse.json(await getExcusableCompensableDelays(projectId));

      case "inexcusable":
        return NextResponse.json(await getInexcusableDelays(projectId));

      case "critical-path":
        return NextResponse.json(await getCriticalPathDelays(projectId));

      case "notices-unresponse":
        return NextResponse.json(await getUnresponseNotices(projectId));

      case "osha-incidents":
        return NextResponse.json(await getOSHAReportableIncidents(projectId));

      case "summary":
        return NextResponse.json(await getProjectLitigationSummary(projectId));

      default:
        return NextResponse.json(
          { error: "Invalid query type" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
```

### 5.2 Usage in React Components

```typescript
// Example: Fetch litigation summary in a component

import { useEffect, useState } from "react";
import { useProjectContext } from "@/context/ProjectContext";

export function LitigationSummaryCard() {
  const { projectId } = useProjectContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetch(
        `/api/litigation?projectId=${projectId}&type=summary`
      );
      const data = await response.json();
      setSummary(data);
      setLoading(false);
    };
    fetchSummary();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="border rounded p-6">
      <h2 className="text-xl font-bold mb-4">Litigation Summary</h2>
      <ul className="space-y-2">
        <li>Total Delays: {summary.totalDelays}</li>
        <li>Excusable Compensable: {summary.excusableCompensableDelays}</li>
        <li>Inexcusable: {summary.inexcusableDelays}</li>
        <li>Critical Path Days: {summary.criticalPathDelayDays}</li>
        <li>OSHA Incidents: {summary.oshaReportableIncidents}</li>
        <li>Evidence Quality: {summary.logsWithGoodTimestamps} same-day logs</li>
      </ul>
    </div>
  );
}
```

---

## Phase 6: Litigation Dashboard (Day 7-10)

### 6.1 Create Litigation Reports Page

```typescript
// src/app/reports/legal/page.tsx

import { useProjectContext } from "@/context/ProjectContext";
import LitigationSummaryCard from "@/components/litigation/summary-card";
import DelayTimelineChart from "@/components/litigation/delay-timeline";
import NoticeComplianceTable from "@/components/litigation/notice-compliance";
import SafetyIncidentList from "@/components/litigation/safety-incidents";
import EvidenceQualityAssessment from "@/components/litigation/evidence-quality";

export default function LegalReportsPage() {
  const { projectId } = useProjectContext();

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">Litigation & Legal Analysis</h1>

      <LitigationSummaryCard projectId={projectId} />

      <DelayTimelineChart projectId={projectId} />

      <NoticeComplianceTable projectId={projectId} />

      <SafetyIncidentList projectId={projectId} />

      <EvidenceQualityAssessment projectId={projectId} />

      <div className="border rounded p-6 bg-blue-50">
        <h2 className="text-xl font-bold mb-4">Exportable Reports</h2>
        <ul className="space-y-2">
          <li><button className="text-blue-600 underline">Download Delay Timeline PDF</button></li>
          <li><button className="text-blue-600 underline">Download Measured Mile Analysis Excel</button></li>
          <li><button className="text-blue-600 underline">Download Notice Compliance Report PDF</button></li>
          <li><button className="text-blue-600 underline">Download OSHA Incident Summary PDF</button></li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Phase 7: Testing (Day 10-11)

### 7.1 Test Database Migration

```typescript
// src/lib/db.test.ts

import { db, getDelayEventsForProject, getCriticalPathDelays } from "@/lib/db";

describe("Legal Dispute Protection Database", () => {
  const testProjectId = "test-project-001";

  test("Can create and retrieve delay events", async () => {
    const delayEvent = {
      id: "delay-test-001",
      projectId: testProjectId,
      date: "2024-03-01",
      delayType: "excusable_compensable" as const,
      causeCategory: "owner_change" as const,
      description: "Owner change test",
      calendarDaysImpacted: 5,
      workingDaysImpacted: 3,
      criticalPathImpacted: true,
    };

    await db.delayEvents.add(delayEvent);
    const retrieved = await db.delayEvents.get("delay-test-001");
    expect(retrieved).toEqual(delayEvent);
  });

  test("Can query critical path delays", async () => {
    const delays = await getCriticalPathDelays(testProjectId);
    expect(delays.every(d => d.criticalPathImpacted === true)).toBe(true);
  });
});
```

### 7.2 Test Form Data Entry

```typescript
// Test that new fields are captured in daily logs
// Verify timestamps are server-generated, not client-generated
// Verify edit history tracks all changes
```

---

## Phase 8: Training & Documentation (Day 10+)

### 8.1 Field Team Training Materials

Create a one-page instruction sheet:

```markdown
# Daily Log Entry for Litigation Preparedness

## Critical Fields for Attorneys (Complete Every Day)

### Weather
- [ ] Humidity (%)
- [ ] Wind Speed (mph)
- [ ] Precipitation Amount (inches)
- [ ] Ground Conditions

### Work Performed
- [ ] Quantity (in correct units)
- [ ] Unit of Measure (cy, lf, sf, etc.)
- [ ] Crew Hours Worked (total person-hours)
- [ ] Crew Size

### Changes
- [ ] Change Type (directed/constructive/cardinal)
- [ ] Estimated Cost Impact ($)
- [ ] Estimated Schedule Impact (days)
- [ ] Notice Date

### Conflicts
- [ ] Estimated Cost Impact ($)
- [ ] Witness Names (full name + company)
- [ ] Root Cause
- [ ] Time of Occurrence

### Photos
- [ ] GPS Coordinates (auto-populated from phone)
- [ ] Witness Present (checkbox)
- [ ] Weather at Capture
```

### 8.2 Attorney Consultation Checklist

Before litigation, consult with attorney on:

```
[ ] Your jurisdiction's definition of "excusable" vs "inexcusable" delay
[ ] Whether Eichleay formula is accepted in your jurisdiction
[ ] Whether measured mile analysis is accepted in your jurisdiction
[ ] Your standard contract language (notice deadlines, change definitions)
[ ] Cardinal change threshold for your typical projects
[ ] Document retention policy for your jurisdiction (4-10 year range)
[ ] Whether daily logs have been accepted as evidence in prior disputes
```

---

## Integration Timeline Summary

| Phase | Duration | Key Tasks |
|-------|----------|-----------|
| 1: Type System | Day 1 | Copy files, update exports, type check |
| 2: Database | Day 1-2 | Dexie v2 migration, add queries |
| 3: Forms | Day 2-5 | Add fields to daily log screens |
| 4: New Screens | Day 5-7 | Delay, Notice, Safety forms |
| 5: API | Day 5-7 | Litigation query endpoints |
| 6: Dashboard | Day 7-10 | Reports and visualizations |
| 7: Testing | Day 10-11 | Database, form, query tests |
| 8: Training | Day 10+ | Field team, attorney consultation |

**Total: ~2-3 weeks for full integration and deployment**

---

## Verification Checklist

After integration, verify:

- [ ] TypeScript compiles without errors
- [ ] Dexie database migrates to v2 successfully
- [ ] New tables (delayEvents, noticeLogs, safetyIncidents) accessible
- [ ] All helper queries work (tested in console)
- [ ] Daily log forms accept new fields
- [ ] Delay/Notice/Safety screens functional
- [ ] API endpoints return correct data
- [ ] Litigation dashboard loads without errors
- [ ] Field team can complete daily logs in < 10 minutes
- [ ] Attorney confirms data model aligns with legal strategy

---

## Support Files

For complete details, see:
- `/LEGAL_DISPUTE_PROTECTION_GUIDE.md` — 400+ line integration guide
- `/LEGAL_MODELS_QUICK_REFERENCE.md` — 600+ line examples and use cases
- `/IMPLEMENTATION_SUMMARY.md` — Overview and success metrics
- `/src/lib/types-legal-enhanced.ts` — Complete interface definitions
- `/src/lib/db-legal-enhanced.ts` — Database schema and queries
