// ============================================================
// FIELDOPS — TypeScript Type Definitions
// All data models for the Blackstone Field Intelligence App
// Phase 6: Structured Data Architecture — Legal, Productivity,
//          Preconstruction Feedback Loop
// ============================================================

// ---- User & Roles ----

export type UserRole = "superintendent" | "foreman" | "pm" | "safety_officer";

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
}

// ---- Project Setup ----

export interface TaktZone {
  id: string;
  floor: string;      // e.g., "Level 1 (Retail)"
  zoneName: string;    // e.g., "North Storefront"
  zoneCode: string;    // e.g., "L1-A"
}

export interface SubcontractorContact {
  name: string;
  phone: string;
  email: string;
}

export interface Subcontractor {
  id: string;
  company: string;
  trade: string;
  csiDivisions: string[];  // e.g., ["03", "31"]
  primaryContact: SubcontractorContact;
  secondaryContact?: SubcontractorContact;
  contractStatus: "awarded" | "in_negotiation" | "tbd";
}

export type EquipmentCategory = "heavy" | "light" | "vehicle";
export type OwnershipType = "owned" | "rented";

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  ownership: OwnershipType;
  vendor?: string;
  rentalRate?: number;
  ratePeriod?: "daily" | "weekly" | "monthly";
}

export interface ContractUpload {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx";
  uploadedAt: string;  // ISO date
  parsedText?: string; // Extracted text for AI reference
}

export interface ProjectContracts {
  ownerContract?: ContractUpload;
  standardSubcontract?: ContractUpload;
  subAgreements: { subId: string; contract: ContractUpload }[];
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  client: string;
  contractValue?: number;
  startDate: string;
  endDate: string;
  projectType: string;
  taktZones: TaktZone[];
  subcontractors: Subcontractor[];
  teamMembers: TeamMember[];
  equipmentLibrary: EquipmentItem[];
  contracts: ProjectContracts;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;

  // ── Phase 6: Analytics & Contract Extensions ──
  budgetedLaborCost?: number;
  budgetedMaterialCost?: number;
  budgetedEquipmentCost?: number;
  originalContractDuration?: number;     // calendar days
  originalCompletionDate?: string;       // ISO date
  currentCompletionDate?: string;        // rolling projection
  approvedChangeOrderDays?: number;
  weatherDaysUsed?: number;
  weatherDaysAllowed?: number;
  liquidatedDamagesPerDay?: number;
}

// ---- CSI Divisions ----

export interface CSIActivity {
  id: string;
  name: string;         // e.g., "Forming"
  tasks: string[];      // e.g., ["Wall Form Setup", "Column Forms", ...]
}

export interface CSIDivision {
  code: string;         // e.g., "03"
  name: string;         // e.g., "Concrete"
  icon: string;         // Lucide icon name
  activities: CSIActivity[];
}

// ---- JHA Module ----

export type JHAStatus = "draft" | "active" | "signed";

export interface SelectedTask {
  csiDivision: string;
  activity: string;
  task: string;
  taktZone?: string;
}

export interface Signature {
  name: string;
  role: string;
  timestamp: string;
  signatureData: string;  // base64 canvas data
}

export interface WeatherConditions {
  conditions: string;     // "Clear" | "Cloudy" | "Rain" | etc.
  temperature: number;
  temperatureUnit: "F" | "C";
  notes?: string;
}

export interface DailyJHA {
  id: string;
  projectId: string;
  date: string;
  createdBy: string;
  weather: WeatherConditions;
  selectedTasks: SelectedTask[];
  equipmentInUse: { equipmentId: string; notes?: string }[];
  generatedJHA?: string;       // AI output (HTML)
  generatedToolboxTalk?: string; // AI output (HTML)
  signatures: Signature[];
  status: JHAStatus;
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════
// DAILY LOG MODULE — Enhanced with Structured Data Layer
// ════════════════════════════════════════════════════════════

export type WeatherImpact = "full_day" | "partial_delay" | "weather_day";
export type WorkStatus = "in_progress" | "completed" | "starting_next_week";
export type InspectionType =
  | "building_inspector"
  | "fire_marshal"
  | "owner"
  | "architect"
  | "engineer"
  | "osha"
  | "other";
export type InspectionResult = "pass" | "fail" | "partial" | "informational";
export type ChangeInitiator = "owner" | "architect" | "engineer" | "field_condition";
export type ChangeImpact = "cost" | "schedule" | "both";
export type ChangeType = "directed" | "constructive" | "cardinal";
export type ConflictCategory =
  | "property_damage"
  | "sub_conflict"
  | "owner_issue"
  | "inspector_issue"
  | "safety_incident"
  | "schedule_conflict";
export type ConflictSeverity = "low" | "medium" | "high" | "critical";
export type ConflictResolution = "open" | "escalated" | "resolved" | "litigated";
export type PhotoCategory = "progress" | "safety" | "quality" | "issue" | "damage";
export type RFIStatus = "open" | "answered" | "overdue";
export type SubmittalStatus =
  | "pending"
  | "approved"
  | "approved_as_noted"
  | "revise_resubmit"
  | "rejected";

// ── Phase 6: Delay & Safety Types ──
export type DelayType =
  | "excusable_compensable"
  | "excusable_noncompensable"
  | "inexcusable"
  | "concurrent";
export type DelayCause =
  | "weather"
  | "owner_change"
  | "design_error"
  | "differing_conditions"
  | "sub_default"
  | "force_majeure"
  | "access_denied";
export type SafetyIncidentType =
  | "near_miss"
  | "first_aid"
  | "recordable"
  | "lost_time"
  | "fatality";
export type NoticeType =
  | "delay"
  | "claim"
  | "backcharge"
  | "cure"
  | "change_directive"
  | "termination_warning"
  | "constructive_acceleration";
export type DeliveryMethod = "email" | "certified_mail" | "hand_delivered";

// ── Enhanced Weather (Legal-grade meteorological data) ──

export interface DailyLogWeather {
  conditions: string;
  temperature: number;
  impact: WeatherImpact;
  hoursLost?: number;
  affectedTrades?: string[];
  notes?: string;
  // Phase 6: Legal precision fields
  humidity?: number;               // 0-100%, ASTM C143/C192 compliance
  windSpeed?: number;              // mph, crane operation limits
  windDirection?: string;          // N/NE/E/SE/S/SW/W/NW
  precipitationType?: string;      // rain/sleet/snow/hail
  precipitationAmount?: number;    // inches
  groundConditions?: string;       // dry/damp/wet/saturated/frozen/standing_water
  visibility?: number;             // miles
}

// ── Enhanced Manpower (Measured mile hours tracking) ──

export interface ManpowerEntry {
  subId: string;
  trade: string;
  journeymanCount: number;
  apprenticeCount: number;
  foremanCount: number;
  // Phase 6: Hours for measured mile analysis
  hoursWorked?: number;           // total daily hours (default 8)
  overtimeHours?: number;         // OT hours — substantiates acceleration damages
  startTime?: string;             // ISO time, crew mobilization
  endTime?: string;               // ISO time, demobilization
}

export interface EquipmentEntry {
  equipmentId: string;
  name: string;
  category: EquipmentCategory;
  ownership: OwnershipType;
  vendor?: string;
  hoursUsed?: number;
  rentalRate?: number;
}

// ── Enhanced Work Performed (Core of measured mile) ──

export interface WorkPerformedEntry {
  csiDivision: string;
  activity: string;
  taktZone?: string;
  status: WorkStatus;
  notes?: string;
  // Phase 6: Quantity & productivity fields
  quantity?: number;              // units installed (120 CY, 1500 LF, etc.)
  unitOfMeasure?: string;         // CY/SF/LF/EA/TON/LS
  plannedQuantity?: number;       // budgeted quantity for variance analysis
  crewSize?: number;              // workers on this activity
  crewHoursWorked?: number;       // total person-hours expended
  percentComplete?: number;       // 0-100, aids WIP quantification
  costCodeId?: string;            // link to CostCode for analytics pipeline
}

export interface RFIEntry {
  rfiNumber: string;
  subject: string;
  responsibleParty: string;
  dateSubmitted: string;
  daysOpen: number;
  status: RFIStatus;
  fieldImpact: boolean;
  notes?: string;
}

export interface SubmittalEntry {
  submittalNumber: string;
  description: string;
  specSection: string;
  status: SubmittalStatus;
  scheduleImpact: boolean;
  notes?: string;
}

export interface InspectionEntry {
  type: InspectionType;
  inspectorName: string;
  company: string;
  timeIn: string;
  timeOut: string;
  result: InspectionResult;
  notes?: string;
  followUpItems?: string;
}

// ── Enhanced Change Entry (Cost/schedule quantification + contract linkage) ──

export interface ChangeEntry {
  initiatedBy: ChangeInitiator;
  description: string;
  affectedDivisions: string[];
  impact: ChangeImpact;
  photos?: string[];
  // Phase 6: Legal dispute fields
  changeType?: ChangeType;            // directed/constructive/cardinal
  estimatedCostImpact?: number;       // $ consequence
  estimatedScheduleImpact?: number;   // days of delay
  contractClause?: string;            // e.g., "AIA A201 Section 7.2"
  noticeDate?: string;                // ISO date, when change communicated
  responseDeadline?: string;          // ISO date
  directedBy?: string;                // name/title of person giving direction
  relatedWorkPerformedIds?: string[];  // links to affected work entries
}

// ── Enhanced Conflict Entry (Quantified impacts + witnesses) ──

export interface ConflictEntry {
  category: ConflictCategory;
  severity: ConflictSeverity;
  description: string;
  partiesInvolved: string[];
  photos?: string[];
  followUpRequired: boolean;
  followUpDescription?: string;
  // Phase 6: Legal evidence fields
  timeOfOccurrence?: string;          // ISO timestamp
  estimatedCostImpact?: number;       // $ consequence
  estimatedScheduleDaysImpact?: number;
  resolutionStatus?: ConflictResolution;
  resolutionDate?: string;
  witnessNames?: string[];
  rootCause?: string;
  contractReference?: string;
  relatedConflictIds?: string[];
}

// ── Enhanced Photo Entry (GPS + weather at capture) ──

export interface PhotoEntry {
  id: string;
  file: string;          // base64 or blob URL
  csiDivision?: string;
  taktZone?: string;
  category: PhotoCategory;
  caption?: string;
  timestamp: string;
  // Phase 6: Geolocation + authentication
  gpsLatitude?: number;
  gpsLongitude?: number;
  weatherAtCapture?: {
    temperature?: number;
    humidity?: number;
    conditions?: string;
  };
  witnessPresent?: boolean;
}

// ════════════════════════════════════════════════════════════
// NEW ENTITIES — Phase 6: Delay Events, Safety, Notices
// ════════════════════════════════════════════════════════════

// ── Delay Event ──
// First-class delay tracking per AACE standards

export interface DelayEvent {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  delayType: DelayType;
  causeCategory: DelayCause;
  description: string;
  responsibleParty?: string;
  calendarDaysImpacted?: number;
  workingDaysImpacted?: number;
  criticalPathImpacted?: boolean;
  affectedActivities?: string[];      // CSI codes
  affectedTaktZones?: string[];
  contractNoticeRequired?: boolean;
  noticeSentDate?: string;
  noticeDeadline?: string;
  relatedChangeIds?: string[];
  relatedConflictIds?: string[];
  cumulativeProjectDelay?: number;
  mitigationActions?: string[];
  costImpact?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Safety Incident ──
// OSHA-specific incident tracking with reporting obligations

export interface SafetyIncident {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  time?: string;
  incidentType: SafetyIncidentType;
  description: string;
  location?: {
    taktZone?: string;
    specific?: string;              // "North wall, Level 3, near Column A"
  };
  injuredPersonName?: string;
  injuredPersonEmployer?: string;
  injuredPersonTrade?: string;
  witnessNames?: string[];
  immediateActions?: string[];
  rootCause?: string;
  correctiveActions?: string[];
  oshaReportable?: boolean;
  oshaFormCompleted?: boolean;
  daysAwayFromWork?: number;
  restrictedDutyDays?: number;
  photos?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Notice Log ──
// Formal contractual notice tracking

export interface NoticeLogEntry {
  id: string;
  projectId: string;
  noticeType: NoticeType;
  sentTo: string;
  sentFrom: string;
  dateSent: string;
  deliveryMethod: DeliveryMethod;
  contractClause?: string;
  responseRequired?: boolean;
  responseDeadline?: string;
  responseReceived?: boolean;
  responseDate?: string;
  relatedDailyLogIds?: string[];
  relatedDelayEventIds?: string[];
  relatedChangeIds?: string[];
  content?: string;                   // full text of the notice
  attachmentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════
// PRODUCTIVITY & ANALYTICS — Circular Feedback Pipeline
// ════════════════════════════════════════════════════════════

// ── Crew Composition (reusable) ──

export interface CrewComposition {
  journeymen: number;
  apprentices: number;
  foremen: number;
}

// ── Cost Code — Bridge between field & estimating ──

export interface CostCode {
  id: string;
  projectId: string;
  code: string;                       // e.g., "03-3100-F"
  csiDivision: string;
  activity: string;
  description: string;
  unitOfMeasure: string;              // SF/LF/CY/EA/TON/LS
  budgetedQuantity: number;
  budgetedUnitPrice: number;
  budgetedLaborHoursPerUnit: number;
  budgetedCrewSize: number;
  budgetedCrewMix: CrewComposition;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Productivity Entry — Daily measured mile record ──

export interface ProductivityEntry {
  id: string;
  projectId: string;
  dailyLogId: string;
  date: string;
  costCodeId: string;
  csiDivision: string;
  activity: string;
  taktZone?: string;
  quantityInstalled: number;
  unitOfMeasure: string;
  crewSize: number;
  crewComposition: CrewComposition;
  laborHoursExpended: number;
  equipmentHoursExpended?: number;
  overtimeHoursIncluded: boolean;
  reworkIncluded: boolean;
  reworkHours?: number;
  notes?: string;
  // Cached computed fields
  computedUnitRate?: number;          // quantity / laborHours
  computedProductivityIndex?: number; // actual / budgeted rate
  computedLaborCostPerUnit?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Productivity Baseline — Unimpacted reference ──

export interface ProductivityBaseline {
  id: string;
  projectId: string;
  costCodeId: string;
  baselinePeriodStart: string;
  baselinePeriodEnd: string;
  baselineUnitRate: number;           // units per man-hour
  baselineCrewSize: number;
  baselineCrewMix: CrewComposition;
  baselineConditions?: string;
  sampleSize: number;                 // days
  confidence?: number;                // 0-1 statistical confidence
  source: "bid_estimate" | "early_period" | "industry_standard";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Productivity Analytics — Precomputed dashboard data ──

export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "project_to_date";
export type TrendDirection = "improving" | "declining" | "stable";
export type ImpactFactor =
  | "weather"
  | "acceleration"
  | "change_order"
  | "learning_curve"
  | "overtime_fatigue"
  | "crew_change"
  | "material_delay"
  | "other";

export interface ProductivityAnalytics {
  id: string;
  projectId: string;
  costCodeId: string;
  periodType: AnalyticsPeriod;
  periodStart: string;
  periodEnd: string;
  averageUnitRate: number;
  peakUnitRate: number;
  lowUnitRate: number;
  standardDeviation: number;
  trendDirection: TrendDirection;
  trendMagnitude: number;
  totalQuantityInstalled: number;
  totalLaborHours: number;
  totalEquipmentHours?: number;
  plannedVsActualVariance: number;    // percentage
  costVariance: number;               // dollars
  scheduleVariance: number;           // days
  impactFactors: {
    factor: ImpactFactor;
    magnitude: number;                // e.g., -0.15 = 15% reduction
    description: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ── Unit Price Library — Company-wide evolving price book ──

export interface UnitPriceLibrary {
  id: string;
  organizationId: string;
  csiDivision: string;
  activity: string;
  description: string;
  unitOfMeasure: string;
  currentUnitPrice: number;
  laborComponent: number;
  materialComponent: number;
  equipmentComponent: number;
  lastUpdatedFromProject?: string;
  lastUpdatedDate: string;
  historicalRates: {
    projectId: string;
    projectName: string;
    date: string;
    unitRate: number;
    conditions?: string;
    adjustmentFactors?: Record<string, number>;
  }[];
  seasonalAdjustments?: {
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    factor: number;
  }[];
  regionAdjustment?: Record<string, number>;
  complexityTiers?: {
    tier: "standard" | "complex" | "premium";
    factor: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ── Bid Feedback Report — Circular analytics deliverable ──

export interface BidFeedbackReport {
  id: string;
  projectId: string;
  generatedDate: string;
  costCodesAnalyzed: number;
  keyFindings: {
    costCodeId: string;
    costCodeDescription?: string;
    bidRate: number;
    actualRate: number;
    variance: number;                 // percentage
    recommendation: string;
  }[];
  adjustmentRecommendations: {
    csiDivision: string;
    activity: string;
    currentBidRate: number;
    recommendedRate: number;
    confidence: number;               // 0-1
    basis: string;
  }[];
  conditionNotes: string;
  lessonsLearned: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Schedule Baseline — Planned vs actual ──

export interface ScheduleBaseline {
  id: string;
  projectId: string;
  baselineDate: string;
  activities: {
    costCodeId: string;
    csiDivision: string;
    activity: string;
    taktZone: string;
    plannedStartDate: string;
    plannedEndDate: string;
    plannedDuration: number;
    actualStartDate?: string;
    actualEndDate?: string;
    actualDuration?: number;
    varianceDays?: number;
    onCriticalPath: boolean;
  }[];
  milestones: {
    name: string;
    plannedDate: string;
    actualDate?: string;
    varianceDays?: number;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════
// ENHANCED DAILY LOG — Integrates all new data
// ════════════════════════════════════════════════════════════

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  superintendentId: string;
  weather: DailyLogWeather;
  manpower: ManpowerEntry[];
  equipment: EquipmentEntry[];
  workPerformed: WorkPerformedEntry[];
  rfis: RFIEntry[];
  submittals: SubmittalEntry[];
  inspections: InspectionEntry[];
  changes: ChangeEntry[];
  conflicts: ConflictEntry[];
  photos: PhotoEntry[];
  notes: string;
  tomorrowPlan: string[];
  createdAt: string;
  updatedAt: string;
  // Phase 6: New embedded collections
  delayEvents?: DelayEvent[];
  safetyIncidents?: SafetyIncident[];
}

// ── Reports ──

export type ReportFormat = "client" | "design_team" | "subcontractor" | "internal";

export interface WeeklyReport {
  id: string;
  projectId: string;
  weekStart: string;
  weekEnd: string;
  formatType: ReportFormat;
  dailyLogIds: string[];
  generatedReport?: string;  // AI output (HTML)
  distribution: { recipient: string; sentDate?: string }[];
  createdAt: string;
}

// ── Change Orders ──

export type ChangeOrderStatus = "identified" | "drafted" | "sent" | "approved";

export interface ChangeOrder {
  id: string;
  projectId: string;
  dailyLogRef: string;
  description: string;
  affectedSubs: {
    subId: string;
    quoteRequested: boolean;
    quoteReceived: boolean;
    amount?: number;
  }[];
  generatedDraft?: string;  // AI output (HTML)
  status: ChangeOrderStatus;
  createdAt: string;
}

// ── Legal Correspondence ──

export type LegalLetterType =
  | "back_charge"
  | "delay_notice"
  | "cure_notice"
  | "change_directive"
  | "rfi_followup"
  | "general";

export type LegalLetterStatus = "draft" | "reviewed" | "sent";

export interface LegalCorrespondence {
  id: string;
  projectId: string;
  type: LegalLetterType;
  triggeredBy: {
    dailyLogId: string;
    entryRef: string;
  };
  recipient: string;  // sub_id or external party name
  contractReferences: {
    clauseNumber: string;
    quotedText: string;
  }[];
  generatedLetter?: string;  // AI output (HTML)
  attachments: string[];
  status: LegalLetterStatus;
  createdAt: string;
}

// ════════════════════════════════════════════════════════════
// TIME TRACKING MODULE — Phase 7: Field Time + ADP Integration
// ════════════════════════════════════════════════════════════

export type TimeEntryMethod = "manual" | "clock_in_out" | "bulk_import";
export type TimeEntryApprovalStatus = "pending" | "approved" | "rejected" | "exported";

export interface TimeEntry {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  workerId: string;              // TeamMember id or subcontractor worker id
  workerName: string;
  trade: string;
  csiDivision?: string;
  costCodeId?: string;
  taktZone?: string;
  entryMethod: TimeEntryMethod;
  clockIn?: string;              // ISO timestamp
  clockOut?: string;             // ISO timestamp
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  breakMinutes: number;
  totalHours: number;            // computed: regular + OT + DT
  payRate?: number;              // $/hr for cost tracking
  overtimeRate?: number;
  notes?: string;
  // Geofencing
  gpsClockIn?: { lat: number; lng: number };
  gpsClockOut?: { lat: number; lng: number };
  withinGeofence?: boolean;
  // Approval workflow
  approvalStatus: TimeEntryApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  // ADP Export tracking
  adpExported?: boolean;
  adpExportedAt?: string;
  adpBatchId?: string;
  adpPayrollCode?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface TimePolicy {
  id: string;
  projectId: string;
  regularHoursPerDay: number;     // typically 8
  overtimeThresholdDaily: number;  // hours before OT kicks in
  overtimeThresholdWeekly: number; // 40 typically
  doubleTimeThreshold?: number;    // hours before DT (e.g., 12)
  breakDurationMinutes: number;    // default lunch break
  roundingIncrement: number;       // 15 = round to nearest 15 min
  geofenceRadiusMeters: number;    // e.g., 100m
  geofenceLatitude?: number;       // project site center
  geofenceLongitude?: number;
  requirePhotoClockIn?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ADPSyncConfig {
  id: string;
  projectId: string;
  companyCode: string;           // ADP company code
  payGroupCode: string;          // ADP pay group
  earningsCode: string;          // regular time earnings code
  overtimeEarningsCode: string;  // OT earnings code
  doubleTimeEarningsCode?: string;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "partial" | "failed";
  lastSyncRecordCount?: number;
  syncErrorLog?: string;
  // OAuth managed server-side
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSummary {
  date: string;
  totalWorkers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  totalHours: number;
  pendingApproval: number;
  approved: number;
  exported: number;
}

// ════════════════════════════════════════════════════════════
// RESOURCE SCHEDULING MODULE — Phase 8: Cross-App Integration
// with Kinetic Craft via REST + Webhooks
// ════════════════════════════════════════════════════════════

export type ResourceRequestStatus =
  | "draft"
  | "submitted"
  | "acknowledged"
  | "allocated"
  | "partially_allocated"
  | "denied"
  | "completed"
  | "cancelled";
export type ResourcePriority = "low" | "medium" | "high" | "critical";
export type ResourceType = "labor" | "equipment" | "material";
export type ScheduleEntryStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type ConflictType = "double_booking" | "capacity" | "skill_mismatch" | "timing" | "equipment_unavailable";
export type ConflictSeverity_R = "warning" | "error" | "critical";

export interface ResourceRequest {
  id: string;
  projectId: string;
  requestType: ResourceType;
  trade?: string;
  csiDivision?: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;           // "workers", "units", "ea"
  priority: ResourcePriority;
  neededByDate: string;            // ISO date
  neededUntilDate?: string;        // ISO date — for duration-based requests
  taktZone?: string;
  costCodeId?: string;
  specialRequirements?: string;    // certifications, skills, etc.
  requestedBy: string;             // TeamMember name
  status: ResourceRequestStatus;
  // Kinetic Craft sync
  kineticRequestId?: string;       // ID in Kinetic Craft system
  kineticSyncedAt?: string;
  kineticResponse?: string;        // allocation details from Kinetic
  // Workflow
  approvedBy?: string;
  approvedAt?: string;
  denialReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  projectId: string;
  resourceRequestId?: string;      // linked request
  resourceType: ResourceType;
  resourceName: string;            // "Concrete Crew Alpha" or equipment name
  trade?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  taktZone?: string;
  costCodeId?: string;
  status: ScheduleEntryStatus;
  assignedFrom?: string;           // "kinetic_craft" | "manual"
  kineticAllocationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceConflict {
  id: string;
  projectId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity_R;
  description: string;
  affectedResourceIds: string[];   // ScheduleEntry IDs
  affectedDates: string[];
  suggestedResolution?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Kinetic Craft API Contract ──

export interface KineticResourceAPIRequest {
  fieldOpsProjectId: string;
  fieldOpsRequestId: string;
  resourceType: ResourceType;
  trade?: string;
  quantity: number;
  neededByDate: string;
  neededUntilDate?: string;
  priority: ResourcePriority;
  specialRequirements?: string;
  siteAddress: string;
  projectName: string;
}

export interface KineticResourceAPIResponse {
  kineticRequestId: string;
  status: "received" | "processing" | "allocated" | "denied";
  allocations?: {
    resourceName: string;
    quantity: number;
    availableDate: string;
    confirmationId: string;
  }[];
  denialReason?: string;
  estimatedResponseTime?: string;
}

export interface KineticWebhookPayload {
  event: "allocation.created" | "allocation.updated" | "allocation.cancelled" | "conflict.detected";
  timestamp: string;
  fieldOpsRequestId: string;
  kineticRequestId: string;
  data: Record<string, unknown>;
  signature: string;              // HMAC-SHA256
}

// ════════════════════════════════════════════════════════════
// MATERIAL TRACKING MODULE — Phase 9: Delivery, Inventory, AI
// ════════════════════════════════════════════════════════════

export type DeliveryStatus = "scheduled" | "in_transit" | "delivered" | "partial" | "rejected" | "returned";
export type MaterialCategory = "concrete" | "steel" | "lumber" | "masonry" | "electrical" | "plumbing" | "hvac" | "finishes" | "other";
export type ConsumptionFlag = "normal" | "high" | "low" | "anomaly";

export interface MaterialDelivery {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  supplier: string;
  poNumber?: string;
  csiDivision?: string;
  category: MaterialCategory;
  items: MaterialDeliveryItem[];
  deliveryTicketNumber?: string;
  driver?: string;
  receivedBy: string;
  status: DeliveryStatus;
  taktZone?: string;
  photos?: string[];
  notes?: string;
  // Quality checks
  conditionOnArrival?: "good" | "damaged" | "partial_damage";
  temperatureCompliant?: boolean;   // for concrete, coatings
  certificationProvided?: boolean;  // mill certs, test reports
  // AI fields
  aiVarianceFlag?: boolean;
  aiVarianceDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDeliveryItem {
  materialName: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;           // CY, TON, LF, EA, BDL, etc.
  costCodeId?: string;
  unitCost?: number;
  totalCost?: number;
  acceptedQuantity?: number;       // may differ from delivered
  rejectedQuantity?: number;
  rejectionReason?: string;
}

export interface MaterialInventory {
  id: string;
  projectId: string;
  materialName: string;
  category: MaterialCategory;
  csiDivision?: string;
  costCodeId?: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  quantityReserved: number;        // allocated but not consumed
  quantityAvailable: number;       // onHand - reserved
  reorderPoint?: number;           // trigger for AI alert
  reorderQuantity?: number;
  leadTimeDays?: number;
  storageLocation?: string;        // takt zone or staging area
  lastReceivedDate?: string;
  lastConsumedDate?: string;
  averageDailyConsumption?: number; // computed
  daysOfSupplyRemaining?: number;   // computed
  createdAt: string;
  updatedAt: string;
}

export interface MaterialConsumption {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  materialInventoryId: string;
  materialName: string;
  quantityConsumed: number;
  unitOfMeasure: string;
  costCodeId?: string;
  taktZone?: string;
  installedBy?: string;            // sub or crew
  wasteQuantity?: number;
  wasteReason?: string;
  consumptionFlag: ConsumptionFlag;
  flagDescription?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════
// QUALITY MANAGEMENT MODULE — Phase 10: Checklists & Inspections
// ════════════════════════════════════════════════════════════

export type ChecklistCategory = "quality" | "safety" | "compliance" | "closeout" | "pre_task";
export type ItemResponseType = "pass_fail" | "yes_no" | "numeric" | "text" | "photo_required" | "rating";
export type DeficiencySeverity = "minor" | "major" | "critical" | "life_safety";
export type DeficiencyStatus = "open" | "in_progress" | "corrected" | "verified" | "closed" | "escalated";

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: ChecklistCategory;
  csiDivision?: string;
  trade?: string;
  description: string;
  version: number;
  isPreloaded: boolean;            // shipped with app vs. user-created
  isActive: boolean;
  sections: ChecklistSection[];
  specReferences?: string[];       // e.g., ["Section 03 30 00", "ASTM C143"]
  estimatedDuration?: number;      // minutes
  requiredCertifications?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  sortOrder: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  question: string;
  responseType: ItemResponseType;
  isRequired: boolean;
  acceptanceCriteria?: string;     // e.g., "Compaction >= 95% Proctor"
  numericRange?: { min: number; max: number; unit: string };
  ratingScale?: { min: number; max: number; labels?: string[] };
  helpText?: string;
  photoRequired?: boolean;
  branchLogic?: {
    triggerValue: string;
    action: "show_items" | "flag_deficiency" | "require_photo";
    targetItemIds?: string[];
  };
}

export interface CompletedChecklist {
  id: string;
  projectId: string;
  templateId: string;
  templateName: string;
  dailyLogId?: string;
  date: string;
  inspectorName: string;
  inspectorRole: string;
  taktZone?: string;
  costCodeId?: string;
  responses: ChecklistResponse[];
  overallScore?: number;           // 0-100 compliance score
  passRate?: number;               // % of items passed
  status: "in_progress" | "completed" | "requires_followup";
  startedAt: string;
  completedAt?: string;
  signatureData?: string;          // base64 canvas
  photos?: string[];
  notes?: string;
  deficiencyIds?: string[];        // linked deficiencies
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistResponse {
  itemId: string;
  question: string;
  responseType: ItemResponseType;
  value: string | number | boolean;
  passed?: boolean;
  photo?: string;
  notes?: string;
  flagged?: boolean;
  deficiencyCreated?: boolean;
}

export interface Deficiency {
  id: string;
  projectId: string;
  checklistId?: string;
  dailyLogId?: string;
  date: string;
  severity: DeficiencySeverity;
  status: DeficiencyStatus;
  description: string;
  csiDivision?: string;
  taktZone?: string;
  location?: string;
  responsibleParty?: string;       // sub ID or company name
  specReference?: string;
  photos?: string[];
  correctionDeadline?: string;
  correctedDate?: string;
  correctedBy?: string;
  correctionDescription?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  costImpact?: number;
  scheduleImpact?: number;         // days
  // Legal linkage
  relatedNoticeIds?: string[];
  relatedDelayEventIds?: string[];
  contractClause?: string;
  aiSuggestedAction?: string;
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════
// DAILY LOG SCREEN STEPS — Updated with new screens
// ════════════════════════════════════════════════════════════

export const DAILY_LOG_SCREENS = [
  { id: "weather", label: "Weather", icon: "Cloud" },
  { id: "manpower", label: "Manpower", icon: "Users" },
  { id: "time", label: "Time Tracking", icon: "Timer" },
  { id: "equipment", label: "Equipment", icon: "Truck" },
  { id: "work", label: "Work Performed", icon: "Hammer" },
  { id: "rfis", label: "RFIs & Submittals", icon: "FileText" },
  { id: "inspections", label: "Inspections", icon: "ClipboardCheck" },
  { id: "changes", label: "Changes", icon: "AlertTriangle" },
  { id: "conflicts", label: "Conflicts", icon: "ShieldAlert" },
  { id: "delays", label: "Delays", icon: "Clock" },
  { id: "safety", label: "Safety", icon: "HeartPulse" },
  { id: "materials", label: "Materials", icon: "Package" },
  { id: "quality", label: "Quality", icon: "ClipboardCheck" },
  { id: "photos", label: "Photos", icon: "Camera" },
  { id: "notes", label: "Notes & Tomorrow", icon: "Pencil" },
] as const;

export type DailyLogScreenId = (typeof DAILY_LOG_SCREENS)[number]["id"];
