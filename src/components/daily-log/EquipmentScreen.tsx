"use client";

import React, { useMemo } from "react";
import { Truck, Wrench, Car, Check } from "lucide-react";
import type {
  EquipmentCategory,
  EquipmentEntry,
  EquipmentItem,
} from "@/lib/types";

interface EquipmentScreenProps {
  entries: EquipmentEntry[];
  onEntriesChange: (entries: EquipmentEntry[]) => void;
  availableEquipment: EquipmentItem[];
}

interface GroupedEquipment {
  heavy: EquipmentItem[];
  light: EquipmentItem[];
  vehicle: EquipmentItem[];
}

const CATEGORY_DISPLAY_NAMES: Record<EquipmentCategory, string> = {
  heavy: "Heavy Equipment",
  light: "Light Equipment",
  vehicle: "Vehicles",
};

const CATEGORY_ICONS: Record<EquipmentCategory, React.ReactNode> = {
  heavy: <Truck className="w-5 h-5" />,
  light: <Wrench className="w-5 h-5" />,
  vehicle: <Car className="w-5 h-5" />,
};

function EquipmentScreen({
  entries,
  onEntriesChange,
  availableEquipment,
}: EquipmentScreenProps): React.ReactElement {
  const selectedIds = useMemo(() => new Set(entries.map((e) => e.equipmentId)), [
    entries,
  ]);

  const totalHours = useMemo(
    () =>
      entries.reduce((sum, entry) => sum + (entry.hoursUsed ?? 0), 0),
    [entries]
  );

  const groupedEquipment = useMemo<GroupedEquipment>(() => {
    const groups: GroupedEquipment = {
      heavy: [],
      light: [],
      vehicle: [],
    };

    availableEquipment.forEach((item) => {
      groups[item.category].push(item);
    });

    return groups;
  }, [availableEquipment]);

  const handleEquipmentToggle = (equipment: EquipmentItem): void => {
    if (selectedIds.has(equipment.id)) {
      onEntriesChange(entries.filter((e) => e.equipmentId !== equipment.id));
    } else {
      const newEntry: EquipmentEntry = {
        equipmentId: equipment.id,
        name: equipment.name,
        category: equipment.category,
        ownership: equipment.ownership,
        vendor: equipment.vendor,
        hoursUsed: 0,
        rentalRate: equipment.rentalRate,
      };
      onEntriesChange([...entries, newEntry]);
    }
  };

  const handleHoursChange = (equipmentId: string, hours: number): void => {
    onEntriesChange(
      entries.map((entry) =>
        entry.equipmentId === equipmentId
          ? { ...entry, hoursUsed: Math.max(0, hours) }
          : entry
      )
    );
  };

  const renderCategory = (category: EquipmentCategory): React.ReactElement | null => {
    const items = groupedEquipment[category];

    if (items.length === 0) {
      return null;
    }

    return (
      <div key={category} className="mb-6">
        <div className="flex items-center gap-2 mb-4 px-4">
          <span className="text-onyx">{CATEGORY_ICONS[category]}</span>
          <h2 className="text-lg font-semibold text-onyx">
            {CATEGORY_DISPLAY_NAMES[category]}
          </h2>
        </div>

        <div className="space-y-3 px-4">
          {items.map((equipment) => {
            const isSelected = selectedIds.has(equipment.id);
            const entry = entries.find((e) => e.equipmentId === equipment.id);

            return (
              <div key={equipment.id}>
                <button
                  onClick={() => handleEquipmentToggle(equipment)}
                  className={`w-full min-h-[56px] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                    isSelected
                      ? "bg-onyx text-white border-l-4 border-green-500"
                      : "bg-alabaster border-l-4 border-transparent text-onyx hover:bg-opacity-80"
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Selection indicator */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-green-500 border-green-600"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white font-bold" />
                    )}
                  </div>

                  {/* Equipment info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base">
                      {equipment.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          equipment.ownership === "owned"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {equipment.ownership === "owned"
                          ? "Owned"
                          : `Rented - ${equipment.vendor || "Unknown"}`}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Hours input when expanded */}
                {isSelected && entry && (
                  <div className="mt-2 px-4 pb-2">
                    <label
                      htmlFor={`hours-${equipment.id}`}
                      className="block text-sm font-medium text-onyx mb-2"
                    >
                      Hours Used
                    </label>
                    <input
                      id={`hours-${equipment.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={entry.hoursUsed ?? 0}
                      onChange={(e) =>
                        handleHoursChange(
                          equipment.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-onyx min-h-[56px] text-base"
                      placeholder="0.0"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasEquipment = availableEquipment.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Summary bar */}
      {hasEquipment && (
        <div className="sticky top-0 bg-alabaster px-4 py-3 border-b border-gray-200">
          <div className="text-sm font-medium text-onyx">
            {entries.length} item{entries.length !== 1 ? "s" : ""} selected ·{" "}
            {totalHours.toFixed(1)} hrs total
          </div>
        </div>
      )}

      {/* Equipment list or empty state */}
      <div className="flex-1 overflow-y-auto">
        {!hasEquipment ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="text-onyx opacity-40 mb-4">
              <Truck className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-onyx font-medium mb-2">No Equipment Available</p>
            <p className="text-gray-500 text-sm">
              Add equipment to get started
            </p>
          </div>
        ) : (
          <div className="pb-6 pt-4">
            {renderCategory("heavy")}
            {renderCategory("light")}
            {renderCategory("vehicle")}
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentScreen;
