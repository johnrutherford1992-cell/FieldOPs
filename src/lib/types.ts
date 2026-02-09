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
  taktZone: string;
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
  taktZone: string;
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
  taktZone: string;
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
// DAILY LOG SCREEN STEPS — Updated with new screens
// ════════════════════════════════════════════════════════════

export const DAILY_LOG_SCREENS = [
  { id: "weather", label: "Weather", icon: "Cloud" },
  { id: "manpower", label: "Manpower", icon: "Users" },
  { id: "equipment", label: "Equipment", icon: "Truck" },
  { id: "work", label: "Work Performed", icon: "Hammer" },
  { id: "rfis", label: "RFIs & Submittals", icon: "FileText" },
  { id: "inspections", label: "Inspections", icon: "ClipboardCheck" },
  { id: "changes", label: "Changes", icon: "AlertTriangle" },
  { id: "conflicts", label: "Conflicts", icon: "ShieldAlert" },
  { id: "delays", label: "Delays", icon: "Clock" },
  { id: "safety", label: "Safety", icon: "HeartPulse" },
  { id: "photos", label: "Photos", icon: "Camera" },
  { id: "notes", label: "Notes & Tomorrow", icon: "Pencil" },
] as const;

export type DailyLogScreenId = (typeof DAILY_LOG_SCREENS)[number]["id"];
