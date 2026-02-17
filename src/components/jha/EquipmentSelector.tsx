"use client";

import React, { useMemo } from "react";
import { Check, Truck, Wrench, Car } from "lucide-react";
import { EquipmentItem } from "@/lib/types";

interface EquipmentSelectorProps {
  availableEquipment: EquipmentItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const CATEGORY_INFO = {
  heavy: {
    label: "Heavy Equipment",
    icon: Truck,
  },
  light: {
    label: "Light Equipment",
    icon: Wrench,
  },
  vehicle: {
    label: "Vehicles",
    icon: Car,
  },
};

export default function EquipmentSelector({
  availableEquipment,
  selectedIds,
  onSelectionChange,
}: EquipmentSelectorProps) {
  // Group equipment by category
  const groupedEquipment = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {
      heavy: [],
      light: [],
      vehicle: [],
    };

    availableEquipment.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });

    return groups;
  }, [availableEquipment]);

  const handleToggleEquipment = (equipmentId: string) => {
    if (selectedIds.includes(equipmentId)) {
      onSelectionChange(selectedIds.filter((id) => id !== equipmentId));
    } else {
      onSelectionChange([...selectedIds, equipmentId]);
    }
  };

  const isSelected = (equipmentId: string): boolean => {
    return selectedIds.includes(equipmentId);
  };

  const renderEquipmentItem = (item: EquipmentItem) => {
    const selected = isSelected(item.id);
    const isRented = item.ownership === "rented";

    return (
      <button
        key={item.id}
        onClick={() => handleToggleEquipment(item.id)}
        className={`
          w-full text-left p-4 rounded-card transition-all active:scale-[0.98]
          border-l-4 flex items-start justify-between
          ${
            selected
              ? "bg-accent-green/10 border-l-accent-green"
              : "bg-glass border-l-transparent border border-white/[0.06]"
          }
        `}
      >
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-field-base font-semibold text-onyx">
              {item.name}
            </h4>
            <span
              className={`
                px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0
                ${
                  isRented
                    ? "bg-accent-amber text-onyx"
                    : "bg-accent-green text-white"
                }
              `}
            >
              {isRented ? "Rented" : "Owned"}
            </span>
          </div>

          {isRented && item.vendor && (
            <div className="text-field-sm text-warm-gray">
              {item.vendor}
              {item.rentalRate && item.ratePeriod && (
                <span className="ml-2">
                  ${item.rentalRate}/{item.ratePeriod}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Checkmark */}
        {selected && (
          <div className="flex-shrink-0 ml-3 mt-1">
            <div className="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 pb-4">
      {Object.entries(CATEGORY_INFO).map(([category, { label, icon: IconComponent }]) => {
        const items = groupedEquipment[category as keyof typeof CATEGORY_INFO] || [];

        // Only render category if it has items
        if (items.length === 0) {
          return null;
        }

        return (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <IconComponent size={20} className="text-onyx" />
              <h3 className="text-field-lg font-semibold text-onyx">
                {label}
              </h3>
            </div>

            {/* Equipment Items */}
            <div className="space-y-2">
              {items.map((item) => renderEquipmentItem(item))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {availableEquipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-field-base text-warm-gray">
            No equipment available
          </p>
        </div>
      )}
    </div>
  );
}
