"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  X,
  Truck,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { generateId } from "@/lib/db";
import type {
  MaterialDelivery,
  MaterialDeliveryItem,
  MaterialCategory,
} from "@/lib/types";

interface MaterialsScreenProps {
  deliveries: MaterialDelivery[];
  onDeliveriesChange: (deliveries: MaterialDelivery[]) => void;
  projectId: string;
  date: string;
}

const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "concrete", label: "Concrete" },
  { value: "steel", label: "Steel" },
  { value: "lumber", label: "Lumber" },
  { value: "masonry", label: "Masonry" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "finishes", label: "Finishes" },
  { value: "other", label: "Other" },
];

export default function MaterialsScreen({
  deliveries,
  onDeliveriesChange,
  projectId,
  date,
}: MaterialsScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New delivery form state
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("concrete");
  const [poNumber, setPONumber] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  // Item being added
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("CY");
  const [pendingItems, setPendingItems] = useState<MaterialDeliveryItem[]>([]);

  // Summary
  const summary = useMemo(() => ({
    total: deliveries.length,
    items: deliveries.reduce((s, d) => s + d.items.length, 0),
    delivered: deliveries.filter((d) => d.status === "delivered").length,
    issues: deliveries.filter((d) => d.conditionOnArrival === "damaged" || d.conditionOnArrival === "partial_damage").length,
  }), [deliveries]);

  // Add item to pending list
  const handleAddItem = useCallback(() => {
    if (!itemName || !itemQty) return;
    setPendingItems([...pendingItems, {
      materialName: itemName,
      quantity: parseFloat(itemQty),
      unitOfMeasure: itemUnit,
      acceptedQuantity: parseFloat(itemQty),
    }]);
    setItemName("");
    setItemQty("");
  }, [itemName, itemQty, itemUnit, pendingItems]);

  // Submit delivery
  const handleSubmitDelivery = useCallback(() => {
    if (!supplier || pendingItems.length === 0) return;

    const delivery: MaterialDelivery = {
      id: generateId("matd"),
      projectId,
      date,
      supplier,
      poNumber: poNumber || undefined,
      category,
      items: pendingItems,
      deliveryTicketNumber: ticketNumber || undefined,
      receivedBy: "Superintendent",
      status: "delivered",
      conditionOnArrival: "good",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onDeliveriesChange([...deliveries, delivery]);
    setShowAddForm(false);
    setSupplier("");
    setPONumber("");
    setTicketNumber("");
    setPendingItems([]);
  }, [supplier, category, poNumber, ticketNumber, pendingItems, deliveries, onDeliveriesChange, projectId, date]);

  // Update delivery status
  const updateDelivery = useCallback(
    (id: string, updates: Partial<MaterialDelivery>) => {
      onDeliveriesChange(
        deliveries.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
      );
    },
    [deliveries, onDeliveriesChange]
  );

  // Remove delivery
  const handleRemove = useCallback(
    (id: string) => {
      onDeliveriesChange(deliveries.filter((d) => d.id !== id));
    },
    [deliveries, onDeliveriesChange]
  );

  return (
    <div className="flex flex-col h-full bg-alabaster">
      {/* Summary Bar */}
      <div className="bg-gradient-teal text-white px-4 py-4 rounded-card shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Truck size={28} className="text-alabaster" />
            <div>
              <p className="text-field-sm text-alabaster/80 font-body">Deliveries Today</p>
              <p className="text-field-3xl font-heading font-semibold">{summary.total}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-field-sm text-alabaster/80">{summary.items} items</p>
            {summary.issues > 0 && (
              <p className="text-field-xs text-accent-amber">{summary.issues} issues</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
        {deliveries.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-4 p-4 bg-alabaster rounded-full">
              <Package size={40} className="text-warm-gray" />
            </div>
            <h3 className="text-field-lg font-heading font-semibold text-onyx mb-2 text-center">
              No Deliveries Logged
            </h3>
            <p className="text-field-sm text-warm-gray font-body text-center max-w-xs">
              Log incoming material deliveries, track quantities, and flag condition issues.
            </p>
          </div>
        ) : (
          deliveries.map((delivery) => {
            const isExpanded = expandedId === delivery.id;
            return (
              <div key={delivery.id} className="bg-glass rounded-xl shadow-glass-card border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-field-base font-heading font-semibold text-onyx truncate">{delivery.supplier}</p>
                    <p className="text-field-xs text-warm-gray">
                      {delivery.category} · {delivery.items.length} items
                      {delivery.deliveryTicketNumber && ` · #${delivery.deliveryTicketNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {delivery.conditionOnArrival === "damaged" && (
                      <AlertTriangle size={16} className="text-accent-red" />
                    )}
                    <span className={`text-field-xs px-2 py-1 rounded font-semibold ${
                      delivery.status === "delivered" ? "bg-accent-teal/10 text-accent-teal" : "bg-glass-medium text-warm-gray"
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3 animate-fade-in">
                    {/* Items */}
                    {delivery.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-glass-medium rounded-button px-3 py-2">
                        <span className="text-field-sm text-onyx">{item.materialName}</span>
                        <span className="text-field-sm font-semibold text-onyx">
                          {item.quantity} {item.unitOfMeasure}
                        </span>
                      </div>
                    ))}

                    {/* Condition */}
                    <div>
                      <label className="block text-field-xs text-warm-gray mb-1">Condition on Arrival</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["good", "damaged", "partial_damage"] as const).map((c) => (
                          <button
                            key={c}
                            onClick={() => updateDelivery(delivery.id, { conditionOnArrival: c })}
                            className={`py-2 rounded-button text-field-xs font-semibold transition-all ${
                              delivery.conditionOnArrival === c
                                ? c === "good" ? "bg-accent-teal text-white" : "bg-accent-red text-white"
                                : "bg-glass-medium text-warm-gray"
                            }`}
                          >
                            {c === "good" ? "Good" : c === "damaged" ? "Damaged" : "Partial"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(delivery.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-button bg-accent-red/10 text-accent-red text-field-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* New Delivery Form */}
        {showAddForm && (
          <div className="bg-glass rounded-card p-4 border border-accent-teal/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-field-base font-heading font-semibold text-onyx">Log Delivery</h3>
              <button onClick={() => setShowAddForm(false)} className="text-warm-gray"><X size={20} /></button>
            </div>

            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name" className="w-full px-3 py-3 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx placeholder-warm-gray" />

            <div className="grid grid-cols-2 gap-3">
              <select value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="px-3 py-2 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx">
                {MATERIAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="text" value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="Ticket #" className="px-3 py-2 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx placeholder-warm-gray" />
            </div>

            {/* Add items */}
            <div className="space-y-2">
              <label className="text-field-xs text-warm-gray font-semibold">Items</label>
              {pendingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-glass-medium rounded-button px-3 py-2">
                  <span className="text-field-sm text-onyx">{item.materialName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-field-sm font-semibold text-onyx">{item.quantity} {item.unitOfMeasure}</span>
                    <button onClick={() => setPendingItems(pendingItems.filter((_, i) => i !== idx))} className="text-accent-red"><X size={14} /></button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
                  placeholder="Material" className="flex-1 px-2 py-2 rounded-button border border-gray-100 text-field-sm bg-glass text-onyx placeholder-warm-gray" />
                <input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Qty" className="w-20 px-2 py-2 rounded-button border border-gray-100 text-field-sm text-center bg-glass text-onyx" />
                <select value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}
                  className="w-20 px-1 py-2 rounded-button border border-gray-100 text-field-xs bg-glass text-onyx">
                  {["CY", "TON", "LF", "SF", "EA", "BDL", "GAL", "BAG"].map((u) => <option key={u}>{u}</option>)}
                </select>
                <button onClick={handleAddItem} disabled={!itemName || !itemQty}
                  className="px-3 py-2 rounded-button bg-accent-teal text-white disabled:opacity-50">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button onClick={handleSubmitDelivery} disabled={!supplier || pendingItems.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-button bg-accent-teal text-white font-semibold text-field-base transition-all active:scale-[0.98] disabled:opacity-50">
              <Check size={18} /> Log Delivery
            </button>
          </div>
        )}
      </div>

      {/* Bottom Add Button */}
      {!showAddForm && (
        <div className="px-4 py-4 border-t border-gray-100 bg-alabaster">
          <button onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-button bg-accent-teal text-white text-field-base font-semibold font-body transition-all active:scale-[0.98]">
            <Truck size={24} /> <span>Log Delivery</span>
          </button>
        </div>
      )}
    </div>
  );
}
