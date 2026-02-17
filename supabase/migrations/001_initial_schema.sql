-- ============================================================
-- FieldOps — Initial PostgreSQL Schema (Supabase)
-- Migrated from Dexie.js IndexedDB
-- 27 tables covering: Projects, JHA, Daily Logs, Time Tracking,
-- Productivity, Legal, Resources, Materials, Quality
-- ============================================================

-- ============================================================
-- DROP EXISTING TABLES (clean slate)
-- Order matters: drop child tables before parent tables
-- ============================================================
DROP TABLE IF EXISTS deficiencies CASCADE;
DROP TABLE IF EXISTS completed_checklists CASCADE;
DROP TABLE IF EXISTS checklist_templates CASCADE;
DROP TABLE IF EXISTS material_consumption CASCADE;
DROP TABLE IF EXISTS material_inventory CASCADE;
DROP TABLE IF EXISTS material_deliveries CASCADE;
DROP TABLE IF EXISTS resource_conflicts CASCADE;
DROP TABLE IF EXISTS schedule_entries CASCADE;
DROP TABLE IF EXISTS resource_requests CASCADE;
DROP TABLE IF EXISTS adp_sync_configs CASCADE;
DROP TABLE IF EXISTS time_policies CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS schedule_baselines CASCADE;
DROP TABLE IF EXISTS bid_feedback_reports CASCADE;
DROP TABLE IF EXISTS unit_price_library CASCADE;
DROP TABLE IF EXISTS productivity_analytics CASCADE;
DROP TABLE IF EXISTS productivity_baselines CASCADE;
DROP TABLE IF EXISTS productivity_entries CASCADE;
DROP TABLE IF EXISTS cost_codes CASCADE;
DROP TABLE IF EXISTS notice_logs CASCADE;
DROP TABLE IF EXISTS safety_incidents CASCADE;
DROP TABLE IF EXISTS delay_events CASCADE;
DROP TABLE IF EXISTS legal_correspondence CASCADE;
DROP TABLE IF EXISTS change_orders CASCADE;
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS daily_jhas CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Also drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  client TEXT,
  contract_value NUMERIC(15,2),
  start_date TEXT,
  end_date TEXT,
  project_type TEXT,
  takt_zones JSONB DEFAULT '[]',
  subcontractors JSONB DEFAULT '[]',
  team_members JSONB DEFAULT '[]',
  equipment_library JSONB DEFAULT '[]',
  contracts JSONB DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]',
  budgeted_labor_cost NUMERIC(15,2),
  budgeted_material_cost NUMERIC(15,2),
  budgeted_equipment_cost NUMERIC(15,2),
  original_contract_duration INTEGER,
  original_completion_date TEXT,
  current_completion_date TEXT,
  approved_change_order_days INTEGER,
  weather_days_used INTEGER,
  weather_days_allowed INTEGER,
  liquidated_damages_per_day NUMERIC(15,2),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_client ON projects(client);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

-- ============================================================
-- DAILY JHA (Job Hazard Analysis)
-- ============================================================

CREATE TABLE daily_jhas (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_by TEXT,
  weather JSONB,
  selected_tasks JSONB DEFAULT '[]',
  equipment_in_use JSONB DEFAULT '[]',
  generated_jha TEXT,
  generated_toolbox_talk TEXT,
  signatures JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_daily_jhas_project_date ON daily_jhas(project_id, date);
CREATE INDEX idx_daily_jhas_status ON daily_jhas(project_id, status);

-- ============================================================
-- DAILY LOGS
-- ============================================================

CREATE TABLE daily_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  superintendent_id TEXT,
  weather JSONB,
  manpower JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  work_performed JSONB DEFAULT '[]',
  rfis JSONB DEFAULT '[]',
  submittals JSONB DEFAULT '[]',
  inspections JSONB DEFAULT '[]',
  changes JSONB DEFAULT '[]',
  conflicts JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  tomorrow_plan JSONB DEFAULT '[]',
  delay_events JSONB,
  safety_incidents JSONB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_daily_logs_project_date ON daily_logs(project_id, date);
CREATE INDEX idx_daily_logs_superintendent ON daily_logs(project_id, superintendent_id);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================

CREATE TABLE weekly_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  week_end TEXT,
  format_type TEXT,
  daily_log_ids JSONB DEFAULT '[]',
  generated_report TEXT,
  distribution JSONB DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_weekly_reports_project_week ON weekly_reports(project_id, week_start);
CREATE INDEX idx_weekly_reports_format ON weekly_reports(project_id, format_type);

-- ============================================================
-- CHANGE ORDERS
-- ============================================================

CREATE TABLE change_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_ref TEXT,
  description TEXT,
  affected_subs JSONB DEFAULT '[]',
  generated_draft TEXT,
  status TEXT DEFAULT 'identified',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_change_orders_project_status ON change_orders(project_id, status);

-- ============================================================
-- LEGAL CORRESPONDENCE
-- ============================================================

CREATE TABLE legal_correspondence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT,
  triggered_by JSONB,
  recipient TEXT,
  contract_references JSONB DEFAULT '[]',
  generated_letter TEXT,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_legal_correspondence_project_type ON legal_correspondence(project_id, type);
CREATE INDEX idx_legal_correspondence_status ON legal_correspondence(project_id, status);

-- ============================================================
-- DELAY EVENTS (Phase 6)
-- ============================================================

CREATE TABLE delay_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT,
  delay_type TEXT,
  cause_category TEXT,
  description TEXT,
  responsible_party TEXT,
  calendar_days_impacted INTEGER,
  working_days_impacted INTEGER,
  critical_path_impacted BOOLEAN DEFAULT FALSE,
  affected_activities JSONB DEFAULT '[]',
  affected_takt_zones JSONB DEFAULT '[]',
  contract_notice_required BOOLEAN,
  notice_sent_date TEXT,
  notice_deadline TEXT,
  related_change_ids JSONB DEFAULT '[]',
  related_conflict_ids JSONB DEFAULT '[]',
  cumulative_project_delay INTEGER,
  mitigation_actions JSONB DEFAULT '[]',
  cost_impact NUMERIC(15,2),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_delay_events_project_date ON delay_events(project_id, date);
CREATE INDEX idx_delay_events_type ON delay_events(project_id, delay_type);
CREATE INDEX idx_delay_events_critical ON delay_events(project_id, critical_path_impacted);

-- ============================================================
-- SAFETY INCIDENTS (Phase 6)
-- ============================================================

CREATE TABLE safety_incidents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT,
  time TEXT,
  incident_type TEXT,
  description TEXT,
  location JSONB,
  injured_person_name TEXT,
  injured_person_employer TEXT,
  injured_person_trade TEXT,
  witness_names JSONB DEFAULT '[]',
  immediate_actions JSONB DEFAULT '[]',
  root_cause TEXT,
  corrective_actions JSONB DEFAULT '[]',
  osha_reportable BOOLEAN DEFAULT FALSE,
  osha_form_completed BOOLEAN DEFAULT FALSE,
  days_away_from_work INTEGER,
  restricted_duty_days INTEGER,
  photos JSONB DEFAULT '[]',
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TEXT,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_safety_incidents_project_date ON safety_incidents(project_id, date);
CREATE INDEX idx_safety_incidents_type ON safety_incidents(project_id, incident_type);
CREATE INDEX idx_safety_incidents_osha ON safety_incidents(project_id, osha_reportable);

-- ============================================================
-- NOTICE LOGS (Phase 6)
-- ============================================================

CREATE TABLE notice_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notice_type TEXT,
  sent_to TEXT,
  sent_from TEXT,
  date_sent TEXT,
  delivery_method TEXT,
  contract_clause TEXT,
  response_required BOOLEAN,
  response_deadline TEXT,
  response_received BOOLEAN DEFAULT FALSE,
  response_date TEXT,
  related_daily_log_ids JSONB DEFAULT '[]',
  related_delay_event_ids JSONB DEFAULT '[]',
  related_change_ids JSONB DEFAULT '[]',
  content TEXT,
  attachment_ids JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_notice_logs_project_type ON notice_logs(project_id, notice_type);
CREATE INDEX idx_notice_logs_date_sent ON notice_logs(project_id, date_sent);
CREATE INDEX idx_notice_logs_response_deadline ON notice_logs(project_id, response_deadline);

-- ============================================================
-- COST CODES (Productivity)
-- ============================================================

CREATE TABLE cost_codes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  csi_division TEXT,
  activity TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT,
  budgeted_quantity NUMERIC(15,4),
  budgeted_unit_price NUMERIC(15,4),
  budgeted_labor_hours_per_unit NUMERIC(10,4),
  budgeted_crew_size INTEGER,
  budgeted_crew_mix JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, code)
);

CREATE INDEX idx_cost_codes_project ON cost_codes(project_id);
CREATE INDEX idx_cost_codes_division ON cost_codes(project_id, csi_division);
CREATE INDEX idx_cost_codes_activity ON cost_codes(project_id, activity);

-- ============================================================
-- PRODUCTIVITY ENTRIES
-- ============================================================

CREATE TABLE productivity_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT NOT NULL,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  csi_division TEXT,
  activity TEXT,
  takt_zone TEXT,
  quantity_installed NUMERIC(15,4),
  unit_of_measure TEXT,
  crew_size INTEGER,
  crew_composition JSONB,
  labor_hours_expended NUMERIC(10,2),
  equipment_hours_expended NUMERIC(10,2),
  overtime_hours_included BOOLEAN DEFAULT FALSE,
  rework_included BOOLEAN DEFAULT FALSE,
  rework_hours NUMERIC(10,2),
  notes TEXT,
  computed_unit_rate NUMERIC(10,4),
  computed_productivity_index NUMERIC(5,2),
  computed_labor_cost_per_unit NUMERIC(10,4),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_productivity_entries_project_date ON productivity_entries(project_id, date);
CREATE INDEX idx_productivity_entries_project_costcode ON productivity_entries(project_id, cost_code_id);
CREATE INDEX idx_productivity_entries_project_costcode_date ON productivity_entries(project_id, cost_code_id, date);

-- ============================================================
-- PRODUCTIVITY BASELINES
-- ============================================================

CREATE TABLE productivity_baselines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id) ON DELETE CASCADE,
  baseline_period_start TEXT,
  baseline_period_end TEXT,
  baseline_unit_rate NUMERIC(10,4) NOT NULL,
  baseline_crew_size INTEGER,
  baseline_crew_mix JSONB,
  baseline_conditions TEXT,
  sample_size INTEGER,
  confidence NUMERIC(3,2),
  source TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_productivity_baselines_project_costcode ON productivity_baselines(project_id, cost_code_id);
CREATE INDEX idx_productivity_baselines_active ON productivity_baselines(project_id, cost_code_id, is_active);

-- ============================================================
-- PRODUCTIVITY ANALYTICS
-- ============================================================

CREATE TABLE productivity_analytics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id) ON DELETE CASCADE,
  period_type TEXT,
  period_start TEXT,
  period_end TEXT,
  average_unit_rate NUMERIC(10,4),
  peak_unit_rate NUMERIC(10,4),
  low_unit_rate NUMERIC(10,4),
  standard_deviation NUMERIC(10,4),
  trend_direction TEXT,
  trend_magnitude NUMERIC(5,2),
  total_quantity_installed NUMERIC(15,4),
  total_labor_hours NUMERIC(10,2),
  total_equipment_hours NUMERIC(10,2),
  planned_vs_actual_variance NUMERIC(10,2),
  cost_variance NUMERIC(15,2),
  schedule_variance NUMERIC(10,2),
  impact_factors JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_productivity_analytics_project_costcode_period ON productivity_analytics(project_id, cost_code_id, period_type);

-- ============================================================
-- UNIT PRICE LIBRARY
-- ============================================================

CREATE TABLE unit_price_library (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  csi_division TEXT,
  activity TEXT,
  description TEXT,
  unit_of_measure TEXT,
  current_unit_price NUMERIC(10,4),
  labor_component NUMERIC(10,4),
  material_component NUMERIC(10,4),
  equipment_component NUMERIC(10,4),
  last_updated_from_project TEXT,
  last_updated_date TEXT,
  historical_rates JSONB DEFAULT '[]',
  seasonal_adjustments JSONB,
  region_adjustment JSONB,
  complexity_tiers JSONB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_unit_price_library_org_division ON unit_price_library(organization_id, csi_division);
CREATE INDEX idx_unit_price_library_activity ON unit_price_library(organization_id, csi_division, activity);

-- ============================================================
-- BID FEEDBACK REPORTS
-- ============================================================

CREATE TABLE bid_feedback_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generated_date TEXT,
  cost_codes_analyzed INTEGER,
  key_findings JSONB DEFAULT '[]',
  adjustment_recommendations JSONB DEFAULT '[]',
  condition_notes TEXT,
  lessons_learned JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_bid_feedback_reports_project ON bid_feedback_reports(project_id);

-- ============================================================
-- SCHEDULE BASELINES
-- ============================================================

CREATE TABLE schedule_baselines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  baseline_date TEXT,
  activities JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_schedule_baselines_project ON schedule_baselines(project_id);
CREATE INDEX idx_schedule_baselines_active ON schedule_baselines(project_id, is_active);

-- ============================================================
-- TIME ENTRIES (Phase 7)
-- ============================================================

CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  worker_name TEXT,
  trade TEXT,
  csi_division TEXT,
  cost_code_id TEXT,
  takt_zone TEXT,
  entry_method TEXT DEFAULT 'manual',
  clock_in TEXT,
  clock_out TEXT,
  regular_hours NUMERIC(5,2) DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  double_time_hours NUMERIC(5,2) DEFAULT 0,
  break_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(5,2) DEFAULT 0,
  pay_rate NUMERIC(10,2),
  overtime_rate NUMERIC(10,2),
  notes TEXT,
  gps_clock_in JSONB,
  gps_clock_out JSONB,
  within_geofence BOOLEAN,
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  adp_exported BOOLEAN DEFAULT FALSE,
  adp_exported_at TEXT,
  adp_batch_id TEXT,
  adp_payroll_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, date);
CREATE INDEX idx_time_entries_project_worker_date ON time_entries(project_id, worker_id, date);
CREATE INDEX idx_time_entries_approval ON time_entries(project_id, approval_status);
CREATE INDEX idx_time_entries_adp ON time_entries(adp_exported);

-- ============================================================
-- TIME POLICIES (Phase 7)
-- ============================================================

CREATE TABLE time_policies (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  regular_hours_per_day NUMERIC(5,2) DEFAULT 8,
  overtime_threshold_daily NUMERIC(5,2) DEFAULT 8,
  overtime_threshold_weekly NUMERIC(5,2) DEFAULT 40,
  double_time_threshold NUMERIC(5,2),
  break_duration_minutes INTEGER DEFAULT 30,
  rounding_increment INTEGER DEFAULT 15,
  geofence_radius_meters INTEGER DEFAULT 100,
  geofence_latitude NUMERIC(10,7),
  geofence_longitude NUMERIC(10,7),
  require_photo_clock_in BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_time_policies_project ON time_policies(project_id);
CREATE INDEX idx_time_policies_active ON time_policies(project_id, is_active);

-- ============================================================
-- ADP SYNC CONFIGS (Phase 7)
-- ============================================================

CREATE TABLE adp_sync_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_code TEXT,
  pay_group_code TEXT,
  earnings_code TEXT,
  overtime_earnings_code TEXT,
  double_time_earnings_code TEXT,
  last_sync_at TEXT,
  last_sync_status TEXT,
  last_sync_record_count INTEGER,
  sync_error_log TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_adp_sync_configs_project ON adp_sync_configs(project_id);
CREATE INDEX idx_adp_sync_configs_active ON adp_sync_configs(project_id, is_active);

-- ============================================================
-- RESOURCE REQUESTS (Phase 8)
-- ============================================================

CREATE TABLE resource_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  request_type TEXT,
  trade TEXT,
  csi_division TEXT,
  description TEXT,
  quantity INTEGER,
  unit_of_measure TEXT,
  priority TEXT DEFAULT 'medium',
  needed_by_date TEXT NOT NULL,
  needed_until_date TEXT,
  takt_zone TEXT,
  cost_code_id TEXT,
  special_requirements TEXT,
  requested_by TEXT,
  status TEXT DEFAULT 'draft',
  kinetic_request_id TEXT,
  kinetic_synced_at TEXT,
  kinetic_response TEXT,
  approved_by TEXT,
  approved_at TEXT,
  denial_reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_resource_requests_project_status ON resource_requests(project_id, status);
CREATE INDEX idx_resource_requests_priority ON resource_requests(project_id, priority);
CREATE INDEX idx_resource_requests_needed_by ON resource_requests(needed_by_date);

-- ============================================================
-- SCHEDULE ENTRIES (Phase 8)
-- ============================================================

CREATE TABLE schedule_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  resource_request_id TEXT,
  resource_type TEXT,
  resource_name TEXT,
  trade TEXT,
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  takt_zone TEXT,
  cost_code_id TEXT,
  status TEXT DEFAULT 'scheduled',
  assigned_from TEXT,
  kinetic_allocation_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_schedule_entries_project_date ON schedule_entries(project_id, date);
CREATE INDEX idx_schedule_entries_status ON schedule_entries(project_id, status);

-- ============================================================
-- RESOURCE CONFLICTS (Phase 8)
-- ============================================================

CREATE TABLE resource_conflicts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conflict_type TEXT,
  severity TEXT,
  description TEXT,
  affected_resource_ids JSONB DEFAULT '[]',
  affected_dates JSONB DEFAULT '[]',
  suggested_resolution TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TEXT,
  resolved_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_resource_conflicts_project ON resource_conflicts(project_id);
CREATE INDEX idx_resource_conflicts_resolved ON resource_conflicts(project_id, resolved);
CREATE INDEX idx_resource_conflicts_severity ON resource_conflicts(project_id, severity);

-- ============================================================
-- MATERIAL DELIVERIES (Phase 9)
-- ============================================================

CREATE TABLE material_deliveries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT,
  supplier TEXT,
  po_number TEXT,
  csi_division TEXT,
  category TEXT,
  items JSONB DEFAULT '[]',
  delivery_ticket_number TEXT,
  driver TEXT,
  received_by TEXT,
  status TEXT DEFAULT 'delivered',
  takt_zone TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  condition_on_arrival TEXT,
  temperature_compliant BOOLEAN,
  certification_provided BOOLEAN,
  ai_variance_flag BOOLEAN DEFAULT FALSE,
  ai_variance_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_material_deliveries_project_date ON material_deliveries(project_id, date);
CREATE INDEX idx_material_deliveries_supplier ON material_deliveries(project_id, supplier);
CREATE INDEX idx_material_deliveries_category ON material_deliveries(project_id, category);

-- ============================================================
-- MATERIAL INVENTORY (Phase 9)
-- ============================================================

CREATE TABLE material_inventory (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  category TEXT,
  csi_division TEXT,
  cost_code_id TEXT,
  unit_of_measure TEXT,
  quantity_on_hand NUMERIC(15,4) DEFAULT 0,
  quantity_reserved NUMERIC(15,4) DEFAULT 0,
  quantity_available NUMERIC(15,4) DEFAULT 0,
  reorder_point NUMERIC(15,4),
  reorder_quantity NUMERIC(15,4),
  lead_time_days INTEGER,
  storage_location TEXT,
  last_received_date TEXT,
  last_consumed_date TEXT,
  average_daily_consumption NUMERIC(10,4),
  days_of_supply_remaining NUMERIC(10,2),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_material_inventory_project ON material_inventory(project_id);
CREATE INDEX idx_material_inventory_category ON material_inventory(project_id, category);

-- ============================================================
-- MATERIAL CONSUMPTION (Phase 9)
-- ============================================================

CREATE TABLE material_consumption (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  daily_log_id TEXT,
  date TEXT,
  material_inventory_id TEXT REFERENCES material_inventory(id) ON DELETE SET NULL,
  material_name TEXT,
  quantity_consumed NUMERIC(15,4),
  unit_of_measure TEXT,
  cost_code_id TEXT,
  takt_zone TEXT,
  installed_by TEXT,
  waste_quantity NUMERIC(15,4),
  waste_reason TEXT,
  consumption_flag TEXT DEFAULT 'normal',
  flag_description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_material_consumption_project_date ON material_consumption(project_id, date);
CREATE INDEX idx_material_consumption_inventory ON material_consumption(material_inventory_id);

-- ============================================================
-- CHECKLIST TEMPLATES (Phase 10)
-- ============================================================

CREATE TABLE checklist_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  csi_division TEXT,
  trade TEXT,
  description TEXT,
  version INTEGER DEFAULT 1,
  is_preloaded BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sections JSONB DEFAULT '[]',
  spec_references JSONB DEFAULT '[]',
  estimated_duration INTEGER,
  required_certifications JSONB DEFAULT '[]',
  created_by TEXT,
  project_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_checklist_templates_category ON checklist_templates(category);
CREATE INDEX idx_checklist_templates_csi ON checklist_templates(csi_division);
CREATE INDEX idx_checklist_templates_active ON checklist_templates(is_active);
CREATE INDEX idx_checklist_templates_project ON checklist_templates(project_id);

-- ============================================================
-- COMPLETED CHECKLISTS (Phase 10)
-- ============================================================

CREATE TABLE completed_checklists (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES checklist_templates(id) ON DELETE SET NULL,
  template_name TEXT,
  daily_log_id TEXT,
  date TEXT,
  inspector_name TEXT,
  inspector_role TEXT,
  takt_zone TEXT,
  cost_code_id TEXT,
  responses JSONB DEFAULT '[]',
  overall_score NUMERIC(5,2),
  pass_rate NUMERIC(5,2),
  status TEXT DEFAULT 'in_progress',
  started_at TEXT,
  completed_at TEXT,
  signature_data TEXT,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  deficiency_ids JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_completed_checklists_project_date ON completed_checklists(project_id, date);
CREATE INDEX idx_completed_checklists_template ON completed_checklists(project_id, template_id);
CREATE INDEX idx_completed_checklists_status ON completed_checklists(project_id, status);

-- ============================================================
-- DEFICIENCIES (Phase 10)
-- ============================================================

CREATE TABLE deficiencies (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_id TEXT REFERENCES completed_checklists(id) ON DELETE SET NULL,
  daily_log_id TEXT,
  date TEXT,
  severity TEXT,
  status TEXT DEFAULT 'open',
  description TEXT,
  csi_division TEXT,
  takt_zone TEXT,
  location TEXT,
  responsible_party TEXT,
  spec_reference TEXT,
  photos JSONB DEFAULT '[]',
  correction_deadline TEXT,
  corrected_date TEXT,
  corrected_by TEXT,
  correction_description TEXT,
  verified_date TEXT,
  verified_by TEXT,
  cost_impact NUMERIC(15,2),
  schedule_impact INTEGER,
  related_notice_ids JSONB DEFAULT '[]',
  related_delay_event_ids JSONB DEFAULT '[]',
  contract_clause TEXT,
  ai_suggested_action TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_deficiencies_project_status ON deficiencies(project_id, status);
CREATE INDEX idx_deficiencies_severity ON deficiencies(project_id, severity);
CREATE INDEX idx_deficiencies_checklist ON deficiencies(checklist_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION (optional auto-update)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW()::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'projects', 'daily_jhas', 'daily_logs', 'delay_events',
      'safety_incidents', 'notice_logs', 'cost_codes',
      'productivity_entries', 'productivity_baselines', 'productivity_analytics',
      'unit_price_library', 'bid_feedback_reports', 'schedule_baselines',
      'time_entries', 'time_policies', 'adp_sync_configs',
      'resource_requests', 'schedule_entries', 'resource_conflicts',
      'material_deliveries', 'material_inventory', 'material_consumption',
      'checklist_templates', 'completed_checklists', 'deficiencies'
    ])
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', tbl);
  END LOOP;
END;
$$;
