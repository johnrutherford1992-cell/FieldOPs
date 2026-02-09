# FieldOps Legal Models — Quick Reference & Examples

## Enhanced Models Summary

### 1. EnhancedDailyLogWeather

**Why It Matters for Litigation:**
Weather delays are frequently disputed. Attorneys need precise meteorological data to argue either "excusable delay" or "contractor should have known better."

```typescript
const weatherLog: EnhancedDailyLogWeather = {
  conditions: "Heavy rain with high winds",
  temperature: 38,          // Freezing risk for concrete
  humidity: 92,             // Too high for concrete testing (ASTM: <85%)
  windSpeed: 35,            // Exceeds crane safety limit (30-40 mph)
  windDirection: "NE",
  precipitationType: "sleet",
  precipitationAmount: 1.5, // Inches; measurable evidence
  groundConditions: "muddy and saturated",
  visibility: 0.25,         // Quarter-mile; crane ops halted
  impact: "full_day",
  hoursLost: 8,
  affectedTrades: ["03 - Concrete", "05 - Metals"],
  notes: "Pour delayed; crane operator refused to operate in 35 mph wind per OSHA. " +
         "Concrete testing failed due to humidity exceeding ASTM C192 limits."
};

// LITIGATION USE:
// Contractor: "Weather was abnormal. Humidity 92% vs. ASTM limit 85%."
//             "Wind 35 mph exceeded crane safety limits. Delay was excusable."
// Owner: "Weather was normal for February in this region. Check NOAA data."
```

---

### 2. EnhancedManpowerEntry

**Why It Matters for Litigation:**
Measured mile analysis compares productivity rates. Courts calculate: (Units ÷ Crew Hours) = Productivity Rate. Without detailed crew hours, measured mile fails.

```typescript
// BASELINE PERIOD (Normal Conditions, Jan 5-15)
const baselineManpower: EnhancedManpowerEntry = {
  subId: "sub-concrete-001",
  trade: "Concrete Finishing",
  journeymanCount: 4,
  apprenticeCount: 2,
  foremanCount: 1,
  hoursWorked: 8,           // 8-hour day
  overtimeHours: 0,         // No overtime needed
  startTime: "2024-01-05T07:00:00Z",
  endTime: "2024-01-05T15:30:00Z",
  crewComposition: {
    journeymanWages: 65,    // $65/hour burden rate
    apprenticeWages: 35,    // $35/hour burden rate
  }
};

// IMPEDED PERIOD (After Change, March 1-15)
const impairedManpower: EnhancedManpowerEntry = {
  subId: "sub-concrete-001",
  trade: "Concrete Finishing",
  journeymanCount: 4,
  apprenticeCount: 2,
  foremanCount: 1,
  hoursWorked: 8,           // Still 8-hour day, but less productive
  overtimeHours: 3,         // Additional 3 hours OT to meet schedule
  startTime: "2024-03-01T07:00:00Z",
  endTime: "2024-03-01T18:30:00Z", // 3 extra hours
  crewComposition: {
    journeymanWages: 65 * 1.5, // OT rate
    apprenticeWages: 35 * 1.5,
  }
};

// MEASURED MILE CALCULATION:
// Baseline crew: 4 journeymen + 2 apprentices = 6 workers × 8 hours = 48 person-hours
// Impaired crew: 6 workers × 11 hours (8+3 OT) = 66 person-hours
// If both days produce same quantity (say 480 SF of finish):
//   Baseline productivity: 480 SF ÷ 48 person-hours = 10 SF/person-hour
//   Impaired productivity: 480 SF ÷ 66 person-hours = 7.3 SF/person-hour
//   Loss: (10 - 7.3) × 480 × $65 = $10,621 loss due to inefficiency + OT premium

// LITIGATION USE:
// Contractor: "Change forced us to work inefficiently. Same work took 37% more hours."
//             "OT premium cost ($1,800) plus productivity loss ($10,621) = $12,421 damage."
```

---

### 3. EnhancedWorkPerformedEntry

**Why It Matters for Litigation:**
CORE of measured mile analysis. Without quantity, crew hours, and duration, no measured mile is possible.

```typescript
// BASELINE PERIOD: Concrete Placing (Normal Conditions)
const baselineWork: EnhancedWorkPerformedEntry = {
  csiDivision: "03",        // Concrete
  activity: "Concrete Placing",
  taktZone: "L1-A",         // Level 1, Zone A
  status: "completed",
  quantity: 120,            // Cubic yards placed
  unitOfMeasure: "cy",      // Cubic yards
  plannedQuantity: 120,     // Matched schedule
  crewSize: 6,              // 4 journeyman + 2 apprentice
  crewHoursWorked: 48,      // 6 workers × 8 hours
  percentComplete: 100,
  actualDuration: 1,        // 1 day
  notes: "Normal placement. Weather clear, temp 72°F. No impediments."
};
// PRODUCTIVITY: 120 CY ÷ 48 person-hours = 2.5 CY per person-hour (BASELINE)

// IMPEDED PERIOD: Same activity, after change (After Change Order)
const impairedWork: EnhancedWorkPerformedEntry = {
  csiDivision: "03",
  activity: "Concrete Placing",
  taktZone: "L1-A",         // Same location
  status: "completed",
  quantity: 120,            // Same quantity, but took longer
  unitOfMeasure: "cy",
  plannedQuantity: 120,
  crewSize: 6,              // Same crew size
  crewHoursWorked: 72,      // But needed 72 hours (9 days) due to:
  percentComplete: 100,
  actualDuration: 9,        // 9 days (not 4 days normally)
  notes: "Change order #5 rerouted utilities. Had to work around 3 utility trucks " +
         "at site. Concrete pump access blocked twice. Waiting time: 6 hours."
};
// PRODUCTIVITY: 120 CY ÷ 72 person-hours = 1.67 CY per person-hour (IMPAIRED)

// MEASURED MILE DAMAGES:
const productivity_loss = (2.5 - 1.67) * 120 * 65; // $6,468
// (2.5 - 1.67 CY/hr) × 120 CY × $65/hr = $6,468 productivity loss
// PLUS: (9 days - 4 days) × (6 workers × 8 hours × $65) = $15,600 extended labor
// TOTAL CHANGE-RELATED COST: ~$22,068

// LITIGATION USE:
// Contractor: "Utility conflict (documented in Change #5) directly caused 5-day delay."
//             "Measured mile shows 0.83 CY/hour productivity drop."
//             "Extended labor: $15,600 + inefficiency: $6,468 = $22,068 claim."
```

---

### 4. EnhancedChangeEntry

**Why It Matters for Litigation:**
Attorneys must show: (1) change was directed, (2) caused delay/cost, (3) proper notice, (4) cumulative impact. Chain of changes proves pattern.

```typescript
const changeOrder: EnhancedChangeEntry = {
  id: "change-001",
  initiatedBy: "owner",     // Owner directed it
  changeType: "directed",   // Explicit written order (excusable compensable)
  description: "Relocate electrical panel from east wall to north wall per " +
               "revised MEP coordination plan. Requires concrete core drilling, " +
               "conduit rerouting, and utility coordination.",
  affectedDivisions: ["03", "26", "27"], // Concrete, Electrical, Communications
  estimatedCostImpact: 24500,
  estimatedScheduleImpact: 8, // 8 working days
  contractClause: "AIA A101 Article 7 (Changes in the Work)",
  noticeDate: "2024-02-15",
  responseDeadline: "2024-02-25",
  responseReceived: false,   // Owner never responded!
  directedBy: "Owner Project Manager - Sarah Chen",
  photos: ["photo-id-001", "photo-id-002"],
  cumulativeImpact: {
    totalScheduleDaysImpacted: 22, // Change #1 (8) + #2 (6) + #3 (8)
    totalCostImpact: 67500,        // All three changes combined
    isCardinalChange: false,       // Not yet cardinal (< 30% contract value)
  },
  relatedWorkPerformedIds: ["work-003", "work-004", "work-007"]
};

// LITIGATION USE (CONTRACTOR):
// Delay Notice: "Per AIA A101, we provide notice that Change Order #1 " +
//               "(electrical relocation, Feb 15) caused 8-day schedule impact " +
//               "and $24,500 cost. We did not receive owner response by Feb 25 deadline. " +
//               "We will proceed at your direction and risk."
//
// If owner doesn't respond and contractor forced to proceed:
// "This constitutes CONSTRUCTIVE CHANGE. We were given no option but to proceed. " +
// "All time and cost delays are compensable."
//
// If multiple changes occur:
// "Cumulative changes: 22 days delay + $67,500 cost. Approaching cardinal threshold."

// LITIGATION USE (OWNER DEFENSE):
// "We issued formal Change Order #1 with clear scope and timeline. " +
// "We did respond with verbal direction (Jan 18, documented in daily log). " +
// "Contractor failed to provide competitive quote or pushback on scope. " +
// "Contractor's delay claims lack merit; contractor chose to use inefficient methods."
```

---

### 5. EnhancedConflictEntry

**Why It Matters for Litigation:**
Disputes foreshadow litigation. Pattern of conflicts = pattern evidence. Contemporaneous documentation of conflicts is critical.

```typescript
const conflictEntry: EnhancedConflictEntry = {
  id: "conflict-001",
  category: "owner_issue",
  severity: "high",
  description: "GC superintendent prevented concrete pour from proceeding. " +
               "Concrete truck on-site at 7:00 AM. GC refused to clear site access " +
               "for pump truck until 11:00 AM, citing 'safety concern' (undefined). " +
               "4-hour delay caused concrete to be cold-worked at lower temp (58°F). " +
               "Per ASTM C192, testing required 5 additional days.",
  partiesInvolved: ["General Contractor - James Wilson"],
  timeOfOccurrence: "2024-03-08T07:00:00Z",
  estimatedCostImpact: 3200,  // Concrete delay cost + retesting
  estimatedScheduleDaysImpact: 5,
  resolutionStatus: "escalated", // Not resolved; became formal claim
  resolutionDate: undefined,
  witnessNames: [
    "John Smith (Concrete Sub Foreman)",
    "Mike Johnson (Concrete Truck Driver)",
    "Sarah Lee (Structural Engineer - on-site)"
  ],
  rootCause: "GC failure to pre-plan access route for pump truck despite " +
             "notice given 2 days prior per daily log entry.",
  contractReference: "GC responsible for site coordination per Section 1.6 " +
                    "and Article 3.18 (Contractor Responsibilities)",
  relatedConflictIds: ["conflict-005", "conflict-009"], // Pattern of access issues
  photos: ["photo-conflict-001", "photo-concrete-002", "photo-pump-truck-001"]
};

// LITIGATION USE (CONTRACTOR):
// Claim: "Third access delay (conflicts #1, #5, #9) caused systematic disruption. " +
//        "Root cause: GC failed to plan site coordination. " +
//        "Cost: Concrete delays + retesting = $3,200. " +
//        "Three witnesses documented the delay. " +
//        "Photos show pump truck unable to access (3/8/24). " +
//        "Pattern evidence (three conflicts same cause) shows systemic GC failure."

// LITIGATION USE (OWNER/GC DEFENSE):
// Defense: "Safety was paramount. Pump truck posed risk to workers (specify hazard). " +
//          "Delay was de minimis (4 hours ≠ critical path). " +
//          "Concrete testing was not critical (other sequences possible). " +
//          "Contractor was not prejudiced; schedule float absorbed delay."
```

---

### 6. EnhancedPhotoEntry

**Why It Matters for Litigation:**
Photos are critical evidence. GPS coordinates, witness presence, and capture conditions authenticate photos and prevent disputes over location.

```typescript
const photoEntry: EnhancedPhotoEntry = {
  id: "photo-001",
  file: "base64-encoded-image-data-here...",
  csiDivision: "03",        // Concrete work
  taktZone: "L1-A",
  category: "issue",        // Issue/defect photo (not progress)
  caption: "Concrete surface with honey-comb voids approximately 2-3 inches deep. " +
           "NE corner of slab. Void density approximately 8-10 voids per SF. " +
           "Photo taken during morning inspection before any rework attempted.",
  timestamp: "2024-03-12T08:15:00Z", // Same-day documentation ✓ High reliability
  gpsLatitude: 40.7128,     // Precise location (prevents "which building?" disputes)
  gpsLongitude: -74.0060,
  weatherAtCapture: {
    temperature: 52,
    humidity: 78,
    conditions: "Overcast"
  },
  witnessPresent: true,     // Photo taken with witness present
  isProgressPhoto: false    // This is a defect photo (not routine progress)
};

// LITIGATION USE (QUALITY CLAIM):
// "Photo evidence of concrete defect with GPS coordinates proves location in L1-A. " +
// "Honey-comb voids indicate either inadequate vibration, poor mix design, or " +
// "both. Temperature (52°F) and humidity (78%) were within acceptable range per " +
// "ASTM. Photo taken same day with witness present (John Smith). " +
// "Defect was observable immediately; contractor's repair claim is justified."

// AUTHENTICATION FOR COURT:
// GPS coordinates: Proves photo was taken at building/zone claimed
// Timestamp: Same day (not fabricated 3 weeks later)
// Witness: John Smith (concrete foreman) can testify he was present
// Weather: Not abnormal (temperature/humidity within spec)
// Result: Court accepts photo as authentic evidence of defect

// vs. WEAK PHOTO (NO AUTHENTICATION):
// "Photo-weak-001.jpg" (no timestamp, no GPS, no witness, no weather)
// Defense: "This could be from any building, any date. No way to verify authenticity."
// Court likely excludes weak photo due to lack of foundation.
```

---

### 7. DelayEvent (NEW First-Class Entity)

**Why It Matters for Litigation:**
Comprehensive delay tracking. Courts need: type of delay (excusable compensable vs. inexcusable), causation chain, critical path impact, notice compliance.

```typescript
const delayEvent: DelayEvent = {
  id: "delay-001",
  projectId: "proj-major-retail",
  dailyLogId: "log-2024-03-01",
  date: "2024-03-01",
  delayType: "excusable_compensable", // Owner caused = contractor gets paid
  causeCategory: "owner_change",       // Owner directed change
  description: "Electrical panel relocation (Change Order #1) required utility " +
               "coordination and concrete core drilling. Utilities arrived 3 days " +
               "late (March 4 vs. March 1), impacting critical path activity " +
               "'Install electrical panel' (CSI 26).",
  responsibleParty: "Owner",
  calendarDaysImpacted: 6,   // March 1-6
  workingDaysImpacted: 5,    // Excludes weekend
  criticalPathImpacted: true, // Delayed 'Install Panel' which delays MEP closeout
  affectedActivities: ["26", "27"], // Electrical, Communications
  affectedTaktZones: ["L1-A", "L1-B"],
  contractNoticeRequired: true,
  noticeSentDate: "2024-03-02",    // Notice sent same day
  noticeDeadline: "2024-03-05",    // AIA requires response in 3-5 days
  relatedChangeIds: ["change-001"],
  relatedConflictIds: ["conflict-002"],
  cumulativeProjectDelay: 12,  // 5 days from this + 7 days from prior delays
  mitigationActions: [
    "Expedited concrete core drilling (cost: $1,200)",
    "Rearranged MEP schedule to place non-dependent work first"
  ],
  costImpact: 28700 // Direct costs + Eichleay overhead
};

// LITIGATION USE:
// Contractor Damages Claim:
// "Delay Event #1: Excusable compensable (owner-caused) utility delay. " +
// "5 working days on critical path (Install Electrical Panel). " +
// "Critical path affected → extended project completion by 5 days. " +
// "Direct cost: $18,500 (extended labor, expedited drilling). " +
// "Home office overhead (Eichleay): $10,200 (5 days × daily overhead). " +
// "TOTAL DELAY CLAIM: $28,700. " +
// "We sent notice within 24 hours (proven by dateSent). " +
// "We mitigated by expediting ($1,200) and rescheduling work."

// Owner Defense:
// "Delay was only 5 days. Schedule float was 8 days. " +
// "No critical path delay. Contractor received time extension per change order. " +
// "Eichleay claim requires proof of unrecovered costs; contractor had concurrent " +
// "schedule float. No delay damages owed."
```

---

### 8. NoticeLog (NEW First-Class Entity)

**Why It Matters for Litigation:**
Formal notices create procedural rights. Failure to notice often bars damages claims. Notice logs prove: sent, when, method, response status.

```typescript
const noticeLog: NoticeLog = {
  id: "notice-delay-001",
  projectId: "proj-major-retail",
  noticeType: "delay",
  sentTo: "Owner Project Manager - Sarah Chen (sarah.chen@ownerco.com)",
  sentFrom: "Project Superintendent - John Smith",
  dateSent: "2024-03-02",
  deliveryMethod: "email", // Certified mail would be stronger
  contractClause: "AIA A101 § 7.2.2 (Changes in the Work notice requirement)",
  responseRequired: true,
  responseDeadline: "2024-03-09",    // 7 days per AIA A101
  responseReceived: false,            // Owner never responded!
  responseDate: undefined,
  relatedDailyLogIds: ["log-2024-03-01", "log-2024-03-02", "log-2024-03-04"],
  relatedDelayEventIds: ["delay-001"],
  relatedChangeIds: ["change-001"],
  content: "NOTICE OF DELAY: Change Order #1 (Electrical Panel Relocation) " +
           "issued February 15, 2024. Utility coordination required. " +
           "Utilities not available until March 4 (3-day delay vs. March 1 plan). " +
           "Critical path activity 'Install Electrical Panel' (CSI 26) " +
           "delayed from March 2-6. Per AIA A101 § 7.2.2, we provide notice " +
           "of delay and request authorization/schedule adjustment. " +
           "Response required by March 9, 2024.",
  attachmentIds: ["daily-log-001", "change-order-001", "utility-letter-001"]
};

// LITIGATION USE:
// Contractor Notice Defense:
// "We provided timely notice per AIA A101 § 7.2.2 on March 2 (same day delay " +
// "recognized). Notice identified cause (utilities late), impact (critical path), " +
// "and scope (CSI 26). Owner response deadline: March 9. Owner never responded. " +
// "Non-response constitutes approval of delay notice. We proceeded without " +
// "authorization → CONSTRUCTIVE CHANGE. All delay costs are compensable."

// Owner Non-Response Defense (if Owner claims non-notice):
// "We DO have notice (dated March 2, email to Sarah Chen). Owner email " +
// "confirmed delivery (March 2, 10:45 AM). Sarah Chen acknowledged receipt " +
// "(verbal conversation March 3). Owner chose not to respond. Non-response " +
// "does NOT excuse owner from delay cost. Contractor properly noticed."

// Owner Response Too Late (if Owner responds March 15):
// "Owner's response dated March 15 is 6 days late (deadline March 9). " +
// "Contractor had proceeded without response. Late response cannot undo delay. " +
// "Contractor mitigated costs. All delay damages are due."
```

---

### 9. SafetyIncident (NEW First-Class Entity)

**Why It Matters for Litigation:**
OSHA reporting is regulatory requirement. Unreported incidents = penalties + evidence of poor safety culture. Weather-related incidents prove adverse conditions.

```typescript
const safetyIncident: SafetyIncident = {
  id: "safety-001",
  projectId: "proj-major-retail",
  dailyLogId: "log-2024-03-08",
  date: "2024-03-08",
  time: "2024-03-08T14:30:00Z",
  incidentType: "recordable",         // OSHA reportable
  description: "Worker fell from 8-foot scaffold due to missing toe board. " +
               "Worker (Carlos Rodriguez, subcontractor) fell onto padded mat, " +
               "sustaining bruise to left shoulder and upper arm. First aid provided. " +
               "Incident reported to OSHA same day. Root cause: defective scaffold " +
               "(toe board not installed per plans).",
  location: {
    taktZone: "L2-B",
    specific: "Exterior formwork area, NE corner of building, 8-foot height"
  },
  injuredPersonName: "Carlos Rodriguez",
  injuredPersonEmployer: "Concrete Subcontractor Inc.",
  injuredPersonTrade: "Concrete Laborer",
  witnessNames: [
    "Miguel Santos (CSI 03 Foreman)",
    "Safety Officer - Mike Johnson"
  ],
  immediateActions: [
    "First aid applied immediately (ice, pain relief)",
    "Worker transported to occupational health clinic for evaluation",
    "OSHA 301 form filed same day",
    "Unsafe scaffold sequestered; investigated by safety officer"
  ],
  rootCause: "Scaffold installation did not include toe board per plan. " +
             "Inspection by safety failed to identify defect before worker use.",
  correctiveActions: [
    "All scaffolds re-inspected for compliance (completed March 9)",
    "Scaffolding subcontractor (Scaffold Co.) re-trained on plans",
    "Daily scaffold walkthrough instituted (ongoing)"
  ],
  oshaReportable: true,
  oshaFormCompleted: true,
  daysAwayFromWork: 0,        // Worker returned next day
  restrictedDutyDays: 3,      // Light duty for 3 days
  photos: ["safety-photo-001", "safety-photo-002"],
  followUpRequired: true,
  followUpDate: "2024-03-15",
  followUpCompleted: true
};

// LITIGATION USE:
// CONTRACTOR (CLAIM):
// "Safety incident demonstrates contractor's commitment to reporting and " +
// "corrective action. Incident was promptly reported (same day OSHA form). " +
// "Root cause (scaffolding defect) was promptly corrected. Safety culture is strong."

// OWNER (DEFENSE):
// "Contractor's own incident reveals safety deficiency. Scaffold was not " +
// "constructed per plans (contractor responsibility). Worker injury resulted. " +
// "Contractor had multiple opportunities to catch defect (inspection, walk-through). " +
// "Safety culture was inadequate. Contractor's claims should be offset by " +
// "contractor's own negligence."

// REGULATOR (OSHA):
// OSHA Form 301 filed timely → Compliance ✓
// Root cause identified → Corrective action taken → Escalation prevented
// Contractor's prompt reporting + follow-up = positive safety culture
```

---

### 10. DailyLogTimestamp (NEW)

**Why It Matters for Litigation:**
Contemporaneous documentation is highest-quality evidence. Courts scrutinize when entries were created. Same-day entries are far more credible than post-hoc entries.

```typescript
// STRONG EVIDENCE (SAME-DAY CREATION):
const goodTimestamps: DailyLogTimestamp = {
  createdAt: "2024-03-08T16:30:00Z",  // Created at 4:30 PM (same day work occurred)
  updatedAt: undefined,                // No updates; original entry stands
  supersededAt: undefined,             // Not replaced
  editHistory: []                      // No edits needed
};

// LITIGATION: "This daily log was created same day (4:30 PM). " +
//             "Superintendent documented events while they were fresh. " +
//             "No edits. Courts give this HIGHEST weight as reliable evidence."

// WEAK EVIDENCE (POST-HOC CREATION):
const weakTimestamps: DailyLogTimestamp = {
  createdAt: "2024-03-22T08:00:00Z",  // Created March 22
  // Log was for March 8 — 14 days LATE!
  // This raises questions: "Why wait 14 days to document?"
  // "Did events occur differently than what's written?"
  // "Was this created after the dispute arose?"
  updatedAt: "2024-03-25T10:15:00Z",  // Updated again 3 days later
  supersededAt: undefined,
  editHistory: [
    {
      timestamp: "2024-03-22T08:00:00Z",
      editedBy: "John Smith",
      previousValue: "Concrete was placed",
      newValue: "Concrete was placed; 120 CY, no issues noted",
      reason: "Added quantity details per request"
    },
    {
      timestamp: "2024-03-25T10:15:00Z",
      editedBy: "John Smith",
      previousValue: "Concrete was placed; 120 CY, no issues noted",
      newValue: "Concrete was placed; 120 CY. Later found honey-comb voids " +
                "approx. 2-3 inches deep (documented by photo-001).",
      reason: "Adding defect information discovered after 3-day cure period"
    }
  ]
};

// LITIGATION: Weak Evidence
// Owner: "Why was this created 14 days late? Suggests post-hoc bias. " +
//        "Two edits within 3 days? Looks like revising history. " +
//        "First edit adds details; second edit adds 'defects discovered.' " +
//        "Contractor is inventing defects to support rework claim."
//
// Contractor Defense: "Initial log created March 22 per normal review cycle. " +
//        "March 22 edit added quantities (factual correction). " +
//        "March 25 edit documented defects that became visible after cure. " +
//        "Honey-comb voids don't appear on day-of-pour; they appear after " +
//        "forms removed (day 3-5). Photo-001 corroborates observation. " +
//        "Not post-hoc bias; accurate defect documentation."

// BEST PRACTICE:
// - Create daily logs SAME DAY (or next morning)
// - Minimal edits (corrections only, same day)
// - Clear edit reason (e.g., "Corrected quantity per QA log")
// - Never major edits weeks later (suggests post-hoc bias)
```

---

## Database Indexes Needed

### delayEvents Table
```
Index: id (primary)
Index: projectId (for project-level queries)
Index: date (timeline analysis)
Index: delayType (filter by excusable/inexcusable)
Index: causeCategory (group by cause)
Index: criticalPathImpacted (critical path vs. off-path)
Index: createdAt (chronological order)
```

### noticeLogs Table
```
Index: id (primary)
Index: projectId (for project-level queries)
Index: noticeType (separate notice types)
Index: dateSent (timeline of notices)
Index: responseDeadline (deadline tracking)
Index: resolutionStatus (open vs. resolved)
Index: createdAt (chronological order)
```

### safetyIncidents Table
```
Index: id (primary)
Index: projectId (for project-level queries)
Index: date (timeline analysis)
Index: incidentType (filter OSHA-reportable)
Index: oshaReportable (regulatory compliance)
Index: createdAt (chronological order)
```

### enhancedDailyLogs Table
```
Index: id (primary)
Index: projectId (for project-level queries)
Index: date (daily log lookup by date)
Index: superintendentId (who created log)
Index: timestamps.createdAt (LITIGATION QUALITY — when was log created?)
Index: createdAt (insertion order)
```

---

## Litigation Workflow Examples

### Scenario 1: Delay Claim (Contractor vs. Owner)

**Day 1: Delay Occurs**
```
Daily log documents: weather, manpower, changes, work performed
DelayEvent created: mark as "excusable_compensable" + "owner_change"
NoticeLog created: formal delay notice sent to owner
```

**Week 2: Develop Claim**
```
Query: getExcusableCompensableDelays() → list all owner-caused delays
Query: getCriticalPathDelays() → confirm critical path impact
Measured Mile Analysis:
  - Compare work_performed (baseline) vs. (impaired)
  - (Baseline Rate - Impaired Rate) × Impeded Qty × Labor Rate = Damages
Eichleay Overhead:
  - (Home Office Overhead ÷ Total Days) × Extended Days = Unabsorbed Overhead
```

**Month 2: Prepare Claim**
```
Generate Report:
  - Delay timeline (all excusable compensable delays)
  - Causation chain (change → delay → cost)
  - Exhibits: daily logs (same-day created), photos (with GPS), notices sent
  - Damages: Direct costs + Measured Mile + Eichleay overhead
File Claim: Submit to owner or start arbitration
```

### Scenario 2: Safety Incident (Contractor's Good Faith Defense)

**Day 1: Incident Occurs**
```
SafetyIncident created: mark as "recordable" (OSHA-reportable)
Fill out: injuredParty, witnesses, rootCause, correctiveActions
OSHA Form 301 filed: same day or next business day
```

**Week 1: Demonstrate Commitment**
```
Query: getSafetyIncidentsForProject() → show all incidents properly reported
Query: getUncompletedFollowUps() → show all follow-ups completed
Evidence:
  - Prompt reporting (OSHA form filed timely)
  - Root cause investigation (documented in safetyIncident.rootCause)
  - Corrective actions (detailed steps taken)
  - No pattern of unreported incidents
```

**Litigation:**
```
Contractor to Owner: "Our safety record is strong. We report incidents promptly, " +
                     "investigate thoroughly, and implement corrective actions. " +
                     "This incident was isolated, not symptomatic of poor safety culture."
Owner to Contractor: "Your incident was caused by contractor failure (scaffold " +
                     "not per plans). Contractor's safety culture was inadequate. " +
                     "Incident supports contractor was negligent."
```

---

## Key Metrics for Litigation Readiness

Use `getProjectLitigationSummary()` to assess litigation risk:

```typescript
const litigationAssessment = await getProjectLitigationSummary(projectId);

// Strong Claim Indicators (Contractor):
if (litigationAssessment.excusableCompensableDelays > 0 &&
    litigationAssessment.criticalPathDelayDays > 5 &&
    litigationAssessment.logsWithGoodTimestamps > 0.8 * totalLogs) {
  console.log("Strong contractor delay claim potential");
}

// Strong Defense Indicators (Owner):
if (litigationAssessment.inexcusableDelays > litigationAssessment.excusableCompensableDelays &&
    litigationAssessment.oshaReportableIncidents > 2) {
  console.log("Strong owner defense against contractor delays");
}

// Evidence Quality (Both Sides):
if (litigationAssessment.logsWithGoodTimestamps / totalLogs > 0.9) {
  console.log("HIGH QUALITY EVIDENCE: Logs created same day");
} else {
  console.log("LOW QUALITY EVIDENCE: Many logs created late (post-hoc bias risk)");
}

// Regulatory Compliance (Both Sides):
if (litigationAssessment.oshaReportableIncidents === 0) {
  console.log("No OSHA incidents = good safety record");
} else {
  console.log(`${litigationAssessment.oshaReportableIncidents} OSHA incidents ` +
              `(verify all were reported timely)`);
}
```

---

## Red Flags for Attorneys

- **Late Daily Log Creation**: Logs created 3+ weeks after date = post-hoc bias risk
- **No GPS on Photos**: Photos without GPS coordinates = location disputes
- **Missing Witness Names**: Conflicts/incidents without witnesses = reduced credibility
- **Unresponded Notices**: Owner never responded to delay notice = constructive change argument
- **Unresolved Safety Incidents**: Safety incident created, but no OSHA report = regulatory violation
- **No Edit History**: Edits made without recording changes = authenticity questions
- **Concurrent Delays**: Both parties causing delays simultaneously = complex damages analysis

---

## Document Retention Policy

For litigation readiness, retain:

- **Daily logs**: 7 years post-project (statute of limitations varies; 4-10 years depending on jurisdiction)
- **Photos**: 7 years (with GPS, timestamps)
- **Notices**: 7 years (prove procedural compliance)
- **Safety incidents**: 7 years (OSHA records requirement)
- **Delay events**: 7 years
- **Edit history**: 7 years (proves log authenticity)
- **Change orders**: 10 years (longer statute for contract disputes)
- **Contracts**: Permanently (reference for disputes)

---

## Contact Construction Attorney Before Implementation

Before deploying legal dispute protection layer, consult with construction attorney who knows:

1. **Your Jurisdiction's Rules**
   - What constitutes "excusable" vs "inexcusable" delay (varies by state)
   - Statute of limitations for contract disputes
   - Whether Eichleay formula is accepted in your jurisdiction

2. **Your Standard Contract Language**
   - What is your "cardinal change" threshold?
   - How many days to respond to notices?
   - How are "weather days" defined?

3. **Your Owners' & Subs' Practices**
   - Do owners typically sign "Change Order Agreements" or work on letters?
   - Are delay notices typically by email or certified mail?
   - Are daily logs typically accepted in dispute resolution?

This model is GENERIC; your specific jurisdiction + contracts may differ.
