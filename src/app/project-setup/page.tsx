"use client";

import { useState, useMemo } from "react";
import {
  Upload,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Grid3x3,
  FileText,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import CostCodesTab from "@/components/project-setup/CostCodesTab";
import { useAppStore } from "@/lib/store";
import type { Project, TaktZone, Subcontractor, EquipmentItem } from "@/lib/types";

export default function ProjectSetupPage() {
  const { activeProject } = useAppStore();
  const [activeTab, setActiveTab] = useState<
    "details" | "zones" | "subs" | "equipment" | "contracts" | "costcodes"
  >("details");

  if (!activeProject) {
    return (
      <AppShell>
        <Header title="Project Setup" backHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-warm-gray">No project loaded</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        title="Project Setup"
        subtitle={activeProject.name}
        backHref="/"
      />

      {/* Tab Navigation */}
      <div className="sticky top-[56px] z-30 bg-white border-b border-gray-100 px-4 pt-3 pb-0 overflow-x-auto">
        <div className="flex gap-2 min-w-min pb-3">
          <TabButton
            label="Details"
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          />
          <TabButton
            label="Takt Zones"
            active={activeTab === "zones"}
            onClick={() => setActiveTab("zones")}
          />
          <TabButton
            label="Subcontractors"
            active={activeTab === "subs"}
            onClick={() => setActiveTab("subs")}
          />
          <TabButton
            label="Equipment"
            active={activeTab === "equipment"}
            onClick={() => setActiveTab("equipment")}
          />
          <TabButton
            label="Contracts"
            active={activeTab === "contracts"}
            onClick={() => setActiveTab("contracts")}
          />
          <TabButton
            label="Cost Codes"
            active={activeTab === "costcodes"}
            onClick={() => setActiveTab("costcodes")}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-24">
        {activeTab === "details" && (
          <TabProjectDetails project={activeProject} />
        )}
        {activeTab === "zones" && (
          <TabTaktZones project={activeProject} />
        )}
        {activeTab === "subs" && (
          <TabSubcontractors project={activeProject} />
        )}
        {activeTab === "equipment" && (
          <TabEquipment project={activeProject} />
        )}
        {activeTab === "contracts" && (
          <TabContracts project={activeProject} />
        )}
        {activeTab === "costcodes" && activeProject && (
          <CostCodesTab projectId={activeProject.id} />
        )}
      </div>
    </AppShell>
  );
}

// ============================================================
// Tab Button Component
// ============================================================

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-2.5 rounded-full font-body font-semibold
        text-field-base transition-colors
        ${
          active
            ? "bg-onyx text-white"
            : "bg-alabaster text-onyx hover:bg-gray-200"
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================================
// TAB 1: Project Details
// ============================================================

interface TabProjectDetailsProps {
  project: Project;
}

function TabProjectDetails({ project }: TabProjectDetailsProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-card p-6 space-y-6">
        {/* Project Name */}
        <DetailRow
          label="Project Name"
          value={project.name}
          icon={<Building2 size={20} className="text-onyx" />}
        />

        {/* Address */}
        <DetailRow
          label="Address"
          value={project.address}
          icon={<MapPin size={20} className="text-onyx" />}
        />

        {/* Client */}
        <DetailRow
          label="Client"
          value={project.client}
          icon={<Briefcase size={20} className="text-onyx" />}
        />

        {/* Contract Value */}
        <DetailRow
          label="Contract Value"
          value={formatCurrency(project.contractValue)}
          icon={<DollarSign size={20} className="text-accent-green" />}
        />

        {/* Project Type */}
        <DetailRow
          label="Project Type"
          value={project.projectType}
          icon={<Grid3x3 size={20} className="text-onyx" />}
        />

        {/* Start Date */}
        <DetailRow
          label="Start Date"
          value={formatDate(project.startDate)}
          icon={<Calendar size={20} className="text-onyx" />}
        />

        {/* End Date */}
        <DetailRow
          label="Completion Date"
          value={formatDate(project.endDate)}
          icon={<Calendar size={20} className="text-onyx" />}
        />
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function DetailRow({ label, value, icon }: DetailRowProps) {
  return (
    <div className="flex items-start gap-4">
      {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-field-sm text-warm-gray font-body">{label}</p>
        <p className="text-lg font-semibold text-onyx mt-1">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: Takt Zones
// ============================================================

interface TabTaktZonesProps {
  project: Project;
}

function TabTaktZones({ project }: TabTaktZonesProps) {
  const zonesByFloor = useMemo(() => {
    const grouped: Record<string, TaktZone[]> = {};
    project.taktZones.forEach((zone) => {
      if (!grouped[zone.floor]) {
        grouped[zone.floor] = [];
      }
      grouped[zone.floor].push(zone);
    });
    return grouped;
  }, [project.taktZones]);

  const floorCount = Object.keys(zonesByFloor).length;
  const zoneCount = project.taktZones.length;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Summary */}
      <div className="text-center">
        <p className="text-field-base font-semibold text-onyx">
          {zoneCount} zones across {floorCount} floors
        </p>
      </div>

      {/* Floors and Zones */}
      <div className="space-y-6">
        {Object.entries(zonesByFloor).map(([floor, zones]) => (
          <div key={floor}>
            {/* Floor Header */}
            <h3 className="text-lg font-semibold text-onyx mb-3 px-1">
              {floor}
            </h3>

            {/* Zone Grid */}
            <div className="grid grid-cols-2 gap-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-white border border-gray-100 rounded-xl shadow-card p-4"
                >
                  <p className="text-field-base font-semibold text-onyx">
                    {zone.zoneCode}
                  </p>
                  <p className="text-field-sm text-warm-gray mt-1">
                    {zone.zoneName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: Subcontractors
// ============================================================

interface TabSubcontractorsProps {
  project: Project;
}

function TabSubcontractors({ project }: TabSubcontractorsProps) {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Summary */}
      <div className="text-center">
        <p className="text-field-base font-semibold text-onyx">
          {project.subcontractors.length} subcontractors
        </p>
      </div>

      {/* Subcontractor Cards */}
      <div className="space-y-4">
        {project.subcontractors.map((sub) => (
          <SubcontractorCard key={sub.id} sub={sub} />
        ))}
      </div>
    </div>
  );
}

interface SubcontractorCardProps {
  sub: Subcontractor;
}

function SubcontractorCard({ sub }: SubcontractorCardProps) {
  const getStatusColor = (
    status: "awarded" | "in_negotiation" | "tbd"
  ): "green" | "amber" | "gray" => {
    switch (status) {
      case "awarded":
        return "green";
      case "in_negotiation":
        return "amber";
      case "tbd":
        return "gray";
    }
  };

  const getStatusLabel = (status: "awarded" | "in_negotiation" | "tbd") => {
    switch (status) {
      case "awarded":
        return "Awarded";
      case "in_negotiation":
        return "In Negotiation";
      case "tbd":
        return "TBD";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4">
      {/* Header with Company and Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-onyx flex-1">{sub.company}</h3>
        <StatusBadge
          label={getStatusLabel(sub.contractStatus)}
          color={getStatusColor(sub.contractStatus)}
        />
      </div>

      {/* Trade and CSI */}
      <p className="text-field-sm text-warm-gray mb-1">{sub.trade}</p>
      <p className="text-field-xs text-gray-500 mb-4">
        CSI {sub.csiDivisions.join(", ")}
      </p>

      {/* Primary Contact */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <p className="text-field-sm font-semibold text-onyx">
          {sub.primaryContact.name}
        </p>
        <div className="flex items-center gap-2 text-field-xs text-warm-gray">
          <Phone size={14} />
          <a
            href={`tel:${sub.primaryContact.phone}`}
            className="hover:underline"
          >
            {sub.primaryContact.phone}
          </a>
        </div>
        <div className="flex items-center gap-2 text-field-xs text-warm-gray">
          <Mail size={14} />
          <a
            href={`mailto:${sub.primaryContact.email}`}
            className="hover:underline"
          >
            {sub.primaryContact.email}
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 4: Equipment
// ============================================================

interface TabEquipmentProps {
  project: Project;
}

function TabEquipment({ project }: TabEquipmentProps) {
  const equipmentByCategory = useMemo(() => {
    const grouped: Record<string, EquipmentItem[]> = {
      heavy: [],
      light: [],
      vehicle: [],
    };
    project.equipmentLibrary.forEach((item) => {
      grouped[item.category].push(item);
    });
    return grouped;
  }, [project.equipmentLibrary]);

  const categoryLabels: Record<string, string> = {
    heavy: "Heavy Equipment",
    light: "Light Equipment",
    vehicle: "Vehicles",
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Equipment by Category */}
      {(["heavy", "light", "vehicle"] as const).map((category) => {
        const items = equipmentByCategory[category];
        if (items.length === 0) return null;

        return (
          <div key={category}>
            {/* Category Header */}
            <h3 className="text-lg font-semibold text-onyx mb-3">
              {categoryLabels[category]} ({items.length})
            </h3>

            {/* Equipment Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <EquipmentItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EquipmentItemCardProps {
  item: EquipmentItem;
}

function EquipmentItemCard({ item }: EquipmentItemCardProps) {
  const formatRate = (rate?: number, period?: string) => {
    if (!rate || !period) return null;
    const periodLabel =
      period === "daily"
        ? "/day"
        : period === "weekly"
          ? "/week"
          : period === "monthly"
            ? "/month"
            : "";
    return `$${rate.toLocaleString()}${periodLabel}`;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-field-base font-semibold text-onyx">{item.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge
            label={item.ownership === "owned" ? "Owned" : "Rented"}
            color={item.ownership === "owned" ? "green" : "amber"}
          />
          {item.ownership === "rented" && item.rentalRate && (
            <p className="text-field-xs text-warm-gray">
              {formatRate(item.rentalRate, item.ratePeriod)}
            </p>
          )}
        </div>
      </div>
      {item.ownership === "rented" && item.vendor && (
        <p className="text-field-xs text-gray-500 text-right flex-shrink-0">
          {item.vendor}
        </p>
      )}
    </div>
  );
}

// ============================================================
// TAB 5: Contracts
// ============================================================

interface TabContractsProps {
  project: Project;
}

function TabContracts({ project }: TabContractsProps) {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Owner Contract */}
      <div>
        <h3 className="text-lg font-semibold text-onyx mb-3">Owner Contract</h3>
        {project.contracts.ownerContract ? (
          <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4 flex items-center gap-3">
            <FileText size={24} className="text-onyx flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-field-base font-semibold text-onyx truncate">
                {project.contracts.ownerContract.fileName}
              </p>
              <p className="text-field-xs text-warm-gray mt-1">
                Uploaded{" "}
                {new Date(
                  project.contracts.ownerContract.uploadedAt
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ) : (
          <ContractPlaceholder />
        )}
      </div>

      {/* Standard Subcontract */}
      <div>
        <h3 className="text-lg font-semibold text-onyx mb-3">
          Standard Subcontract
        </h3>
        {project.contracts.standardSubcontract ? (
          <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4 flex items-center gap-3">
            <FileText size={24} className="text-onyx flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-field-base font-semibold text-onyx truncate">
                {project.contracts.standardSubcontract.fileName}
              </p>
              <p className="text-field-xs text-warm-gray mt-1">
                Uploaded{" "}
                {new Date(
                  project.contracts.standardSubcontract.uploadedAt
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ) : (
          <ContractPlaceholder />
        )}
      </div>

      {/* Individual Sub Agreements */}
      <div>
        <h3 className="text-lg font-semibold text-onyx mb-3">
          Individual Sub Agreements
        </h3>
        {project.contracts.subAgreements.length > 0 ? (
          <div className="space-y-2">
            {project.contracts.subAgreements.map((agreement) => (
              <div
                key={agreement.subId}
                className="bg-white border border-gray-100 rounded-xl shadow-card p-4 flex items-center gap-3"
              >
                <FileText size={24} className="text-onyx flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-field-base font-semibold text-onyx truncate">
                    {agreement.contract.fileName}
                  </p>
                  <p className="text-field-xs text-warm-gray mt-1">
                    Uploaded{" "}
                    {new Date(agreement.contract.uploadedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-field-sm text-warm-gray text-center py-4">
            No individual agreements uploaded yet
          </p>
        )}
      </div>
    </div>
  );
}

function ContractPlaceholder() {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
      <Upload size={32} className="text-warm-gray" />
      <p className="text-field-sm text-warm-gray text-center">
        Upload PDF or Word
      </p>
    </div>
  );
}
