"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, MoreVertical } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { db, generateId, getCostCodesForProject } from "@/lib/db";
import { CSI_DIVISIONS } from "@/data/csi-divisions";
import type { CostCode } from "@/lib/types";

interface CostCodesTabProps {
  projectId: string;
}

export default function CostCodesTab({ projectId }: CostCodesTabProps) {
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadCostCodes = useCallback(async (): Promise<void> => {
    try {
      const codes = await getCostCodesForProject(projectId);
      setCostCodes(codes);
    } catch (error) {
      console.error("Failed to load cost codes:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load cost codes on mount
  useEffect(() => {
    loadCostCodes();
  }, [loadCostCodes]);

  // Group cost codes by CSI division
  const codesByDivision = useMemo(() => {
    const grouped: Record<string, CostCode[]> = {};
    costCodes.forEach((code) => {
      if (!grouped[code.csiDivision]) {
        grouped[code.csiDivision] = [];
      }
      grouped[code.csiDivision].push(code);
    });
    return grouped;
  }, [costCodes]);

  // Get unique divisions in the cost codes
  const divisionsInUse = useMemo(() => {
    return Object.keys(codesByDivision).length;
  }, [codesByDivision]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-warm-gray">Loading cost codes...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-32">
      {/* Summary */}
      <div className="text-center">
        <p className="text-field-base font-semibold text-onyx">
          {costCodes.length} cost codes across {divisionsInUse} CSI divisions
        </p>
      </div>

      {/* Cost Codes by Division */}
      {costCodes.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
          <p className="text-field-sm text-warm-gray text-center">
            No cost codes added yet. Create your first cost code to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(codesByDivision)
            .sort(([divA], [divB]) => divA.localeCompare(divB))
            .map(([division, codes]) => (
              <div key={division}>
                {/* Division Header */}
                <h3 className="text-lg font-semibold text-onyx mb-3 px-1">
                  {division}
                </h3>

                {/* Cost Code Cards */}
                <div className="space-y-3">
                  {codes.map((code) => (
                    <CostCodeCard
                      key={code.id}
                      code={code}
                      onDelete={async () => {
                        await deleteCostCode(code.id);
                      }}
                      onToggleActive={async () => {
                        await toggleCostCodeActive(code.id, !code.isActive);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Cost Code Button (Floating) */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 left-4 right-4 bg-onyx text-white rounded-xl py-4 font-semibold text-center shadow-lg z-40"
      >
        <Plus size={20} className="inline mr-2" />
        Add Cost Code
      </button>

      {/* Add Cost Code Modal */}
      {showAddForm && (
        <AddCostCodeModal
          projectId={projectId}
          onClose={() => setShowAddForm(false)}
          onAdd={async (newCode) => {
            setCostCodes([...costCodes, newCode]);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );

  async function deleteCostCode(id: string): Promise<void> {
    if (confirm("Are you sure you want to delete this cost code?")) {
      try {
        await db.costCodes.delete(id);
        setCostCodes(costCodes.filter((cc) => cc.id !== id));
      } catch (error) {
        console.error("Failed to delete cost code:", error);
      }
    }
  }

  async function toggleCostCodeActive(id: string, isActive: boolean): Promise<void> {
    try {
      await db.costCodes.update(id, { isActive });
      setCostCodes(
        costCodes.map((cc) => (cc.id === id ? { ...cc, isActive } : cc))
      );
    } catch (error) {
      console.error("Failed to update cost code:", error);
    }
  }
}

// ============================================================
// Cost Code Card Component
// ============================================================

interface CostCodeCardProps {
  code: CostCode;
  onDelete: () => void;
  onToggleActive: () => void;
}

function CostCodeCard({ code, onDelete, onToggleActive }: CostCodeCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totalBudgetedValue = code.budgetedQuantity * code.budgetedUnitPrice;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card p-4 relative">
      {/* Header with Code and Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="text-field-base font-semibold text-onyx">{code.code}</p>
          <p className="text-field-sm text-warm-gray mt-1">{code.activity}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge
            label={code.isActive ? "Active" : "Inactive"}
            color={code.isActive ? "green" : "gray"}
          />
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={16} className="text-warm-gray" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 w-40">
                <button
                  onClick={() => {
                    onToggleActive();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-field-sm text-onyx hover:bg-gray-50 first:rounded-t-lg"
                >
                  {code.isActive ? "Mark Inactive" : "Mark Active"}
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-field-sm text-accent-red hover:bg-gray-50 last:rounded-b-lg"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-field-sm text-warm-gray mb-4">{code.description}</p>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        {/* Unit of Measure */}
        <DetailItem label="Unit" value={code.unitOfMeasure} />

        {/* Budgeted Quantity */}
        <DetailItem
          label="Budgeted Qty"
          value={code.budgetedQuantity.toLocaleString()}
        />

        {/* Unit Price */}
        <DetailItem label="Unit Price" value={formatCurrency(code.budgetedUnitPrice)} />

        {/* Total Budgeted Value */}
        <DetailItem
          label="Total Value"
          value={formatCurrency(totalBudgetedValue)}
        />

        {/* Labor Hours Per Unit */}
        <DetailItem
          label="Labor Hrs/Unit"
          value={code.budgetedLaborHoursPerUnit.toFixed(2)}
        />

        {/* Budgeted Crew Size */}
        <DetailItem label="Crew Size" value={code.budgetedCrewSize.toString()} />
      </div>

      {/* Crew Mix */}
      <div className="mt-4 p-3 bg-alabaster rounded-lg">
        <p className="text-field-xs text-warm-gray font-semibold mb-2">
          Budgeted Crew Mix
        </p>
        <div className="flex gap-4">
          <CrewMixItem
            label="Journeymen"
            count={code.budgetedCrewMix.journeymen}
          />
          <CrewMixItem
            label="Apprentices"
            count={code.budgetedCrewMix.apprentices}
          />
          <CrewMixItem label="Foremen" count={code.budgetedCrewMix.foremen} />
        </div>
      </div>

      {/* Notes */}
      {code.notes && (
        <p className="text-field-xs text-warm-gray mt-4 italic">&ldquo;{code.notes}&rdquo;</p>
      )}
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <p className="text-field-xs text-warm-gray">{label}</p>
      <p className="text-field-base font-semibold text-onyx mt-1">{value}</p>
    </div>
  );
}

interface CrewMixItemProps {
  label: string;
  count: number;
}

function CrewMixItem({ label, count }: CrewMixItemProps) {
  return (
    <div className="flex-1">
      <p className="text-field-xs text-warm-gray">{label}</p>
      <p className="text-field-base font-semibold text-onyx">{count}</p>
    </div>
  );
}

// ============================================================
// Add Cost Code Modal
// ============================================================

interface AddCostCodeModalProps {
  projectId: string;
  onClose: () => void;
  onAdd: (code: CostCode) => void;
}

function AddCostCodeModal({
  projectId,
  onClose,
  onAdd,
}: AddCostCodeModalProps) {
  const [formData, setFormData] = useState<Partial<CostCode>>({
    csiDivision: "",
    code: "",
    activity: "",
    description: "",
    unitOfMeasure: "SF",
    budgetedQuantity: 0,
    budgetedUnitPrice: 0,
    budgetedLaborHoursPerUnit: 0,
    budgetedCrewSize: 1,
    budgetedCrewMix: {
      journeymen: 0,
      apprentices: 0,
      foremen: 0,
    },
    notes: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (
    field: string,
    value: string | number | boolean
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCrewMixChange = (
    role: "journeymen" | "apprentices" | "foremen",
    value: number
  ): void => {
    setFormData((prev) => ({
      ...prev,
      budgetedCrewMix: {
        ...prev.budgetedCrewMix!,
        [role]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.csiDivision || !formData.code || !formData.activity) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const newCode: CostCode = {
        id: generateId("cc"),
        projectId,
        code: formData.code,
        csiDivision: formData.csiDivision,
        activity: formData.activity,
        description: formData.description || "",
        unitOfMeasure: formData.unitOfMeasure || "SF",
        budgetedQuantity: formData.budgetedQuantity || 0,
        budgetedUnitPrice: formData.budgetedUnitPrice || 0,
        budgetedLaborHoursPerUnit: formData.budgetedLaborHoursPerUnit || 0,
        budgetedCrewSize: formData.budgetedCrewSize || 1,
        budgetedCrewMix: formData.budgetedCrewMix || {
          journeymen: 0,
          apprentices: 0,
          foremen: 0,
        },
        notes: formData.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.costCodes.add(newCode);
      onAdd(newCode);
    } catch (error) {
      console.error("Failed to add cost code:", error);
      alert("Failed to add cost code");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-onyx">Add Cost Code</h2>
          <button
            onClick={onClose}
            className="text-warm-gray hover:text-onyx text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* CSI Division */}
          <FormGroup label="CSI Division *" required>
            <select
              value={formData.csiDivision || ""}
              onChange={(e) => handleChange("csiDivision", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            >
              <option value="">Select a division</option>
              {CSI_DIVISIONS.map((div) => (
                <option key={div.code} value={div.code}>
                  {div.code} - {div.name}
                </option>
              ))}
            </select>
          </FormGroup>

          {/* Cost Code */}
          <FormGroup label="Cost Code *" required>
            <input
              type="text"
              placeholder="e.g., 03-3100-F"
              value={formData.code || ""}
              onChange={(e) => handleChange("code", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Activity */}
          <FormGroup label="Activity *" required>
            <input
              type="text"
              placeholder="e.g., Concrete Forming"
              value={formData.activity || ""}
              onChange={(e) => handleChange("activity", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Description */}
          <FormGroup label="Description">
            <input
              type="text"
              placeholder="Detailed description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Unit of Measure */}
          <FormGroup label="Unit of Measure">
            <select
              value={formData.unitOfMeasure || "SF"}
              onChange={(e) => handleChange("unitOfMeasure", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            >
              <option value="SF">Square Feet (SF)</option>
              <option value="LF">Linear Feet (LF)</option>
              <option value="CY">Cubic Yards (CY)</option>
              <option value="EA">Each (EA)</option>
              <option value="TON">Ton (TON)</option>
              <option value="LS">Lump Sum (LS)</option>
            </select>
          </FormGroup>

          {/* Budgeted Quantity */}
          <FormGroup label="Budgeted Quantity">
            <input
              type="number"
              placeholder="0"
              value={formData.budgetedQuantity || ""}
              onChange={(e) =>
                handleChange("budgetedQuantity", parseFloat(e.target.value) || 0)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Budgeted Unit Price */}
          <FormGroup label="Budgeted Unit Price ($)">
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.budgetedUnitPrice || ""}
              onChange={(e) =>
                handleChange("budgetedUnitPrice", parseFloat(e.target.value) || 0)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Budgeted Labor Hours Per Unit */}
          <FormGroup label="Budgeted Labor Hours Per Unit">
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.budgetedLaborHoursPerUnit || ""}
              onChange={(e) =>
                handleChange(
                  "budgetedLaborHoursPerUnit",
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Budgeted Crew Size */}
          <FormGroup label="Budgeted Crew Size">
            <input
              type="number"
              placeholder="1"
              min="1"
              value={formData.budgetedCrewSize || ""}
              onChange={(e) =>
                handleChange("budgetedCrewSize", parseInt(e.target.value) || 1)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
            />
          </FormGroup>

          {/* Crew Mix Section */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-field-base font-semibold text-onyx mb-4">
              Budgeted Crew Mix
            </h3>

            <div className="space-y-4">
              {/* Journeymen */}
              <FormGroup label="Journeymen">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.budgetedCrewMix?.journeymen || ""}
                  onChange={(e) =>
                    handleCrewMixChange("journeymen", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
                />
              </FormGroup>

              {/* Apprentices */}
              <FormGroup label="Apprentices">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.budgetedCrewMix?.apprentices || ""}
                  onChange={(e) =>
                    handleCrewMixChange("apprentices", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
                />
              </FormGroup>

              {/* Foremen */}
              <FormGroup label="Foremen">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.budgetedCrewMix?.foremen || ""}
                  onChange={(e) =>
                    handleCrewMixChange("foremen", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx"
                />
              </FormGroup>
            </div>
          </div>

          {/* Notes */}
          <FormGroup label="Notes">
            <textarea
              placeholder="Optional notes..."
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-field-base focus:outline-none focus:ring-2 focus:ring-onyx resize-none"
            />
          </FormGroup>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-onyx rounded-xl font-semibold text-field-base hover:bg-alabaster transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-onyx text-white rounded-xl font-semibold text-field-base hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Cost Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormGroupProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormGroup({ label, required, children }: FormGroupProps) {
  return (
    <div>
      <label className="text-field-sm font-semibold text-onyx block mb-2">
        {label}
        {required && <span className="text-accent-red"> *</span>}
      </label>
      {children}
    </div>
  );
}
