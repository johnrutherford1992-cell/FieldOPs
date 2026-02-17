"use client"

import { useState } from "react"
import { Plus, X, Lightbulb } from "lucide-react"

interface NotesScreenProps {
  notes: string
  tomorrowPlan: string[]
  onNotesChange: (notes: string) => void
  onTomorrowPlanChange: (plan: string[]) => void
}

const QUICK_ADD_SUGGESTIONS = [
  "Concrete Pour",
  "Steel Erection",
  "MEP Rough-in",
  "Inspections",
  "Safety Meeting",
  "Material Delivery"
]

export default function NotesScreen({
  notes,
  tomorrowPlan,
  onNotesChange,
  onTomorrowPlanChange
}: NotesScreenProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState(false)

  const handleAddPlanItem = (text?: string) => {
    const newItem = text || ""
    onTomorrowPlanChange([...tomorrowPlan, newItem])
  }

  const handleRemovePlanItem = (index: number) => {
    onTomorrowPlanChange(tomorrowPlan.filter((_, i) => i !== index))
  }

  const handleUpdatePlanItem = (index: number, text: string) => {
    const updated = [...tomorrowPlan]
    updated[index] = text
    onTomorrowPlanChange(updated)
  }

  const handleAddSuggestion = (suggestion: string) => {
    handleAddPlanItem(suggestion)
    setExpandedSuggestions(false)
  }

  return (
    <div className="min-h-screen bg-alabaster">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-glass border-b border-white/[0.08] px-6 py-4">
        <h1 className="text-2xl font-bold text-onyx">Daily Log</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8 pb-20">
        {/* Section 1: General Notes */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-onyx" />
            <h2 className="text-xl font-bold text-onyx">General Notes</h2>
          </div>

          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="General observations, coordination issues, key decisions made today..."
              className="w-full min-h-[200px] p-4 bg-glass border border-white/[0.10] rounded-xl text-onyx text-lg font-normal placeholder-warm-gray focus:outline-none focus:ring-2 focus:ring-accent-violet resize-none"
              aria-label="Daily notes"
            />

            <div className="flex justify-end">
              <span className="text-sm text-warm-gray font-medium">
                {notes.length} characters
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Tomorrow's Plan */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-onyx">Tomorrow&apos;s Plan</h2>
          </div>

          {/* Quick-Add Suggestions */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSuggestions(!expandedSuggestions)}
              className="w-full h-14 flex items-center justify-center gap-2 bg-glass border-2 border-accent-violet rounded-xl text-onyx font-bold text-lg hover:bg-glass-light active:bg-glass-medium transition-colors"
              aria-label="Add item"
            >
              <Plus className="w-6 h-6" />
              Add Item
            </button>

            {expandedSuggestions && (
              <div className="bg-glass rounded-xl p-4 border border-white/[0.08] space-y-3">
                <p className="text-sm text-warm-gray font-medium">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ADD_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddSuggestion(suggestion)}
                      className="px-4 py-2 bg-accent-violet text-alabaster rounded-lg text-sm font-semibold hover:bg-accent-violet/90 active:bg-accent-violet/80 transition-opacity"
                      aria-label={`Add ${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Plan Items List */}
          {tomorrowPlan.length > 0 ? (
            <div className="space-y-3">
              {tomorrowPlan.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-glass rounded-xl p-4 min-h-14 border border-white/[0.08]"
                >
                  <span className="text-lg font-bold text-onyx min-w-6">
                    {index + 1}.
                  </span>

                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdatePlanItem(index, e.target.value)}
                    placeholder="Task description..."
                    className="flex-1 bg-transparent text-onyx text-lg font-normal placeholder-warm-gray focus:outline-none"
                    aria-label={`Tomorrow plan item ${index + 1}`}
                  />

                  <button
                    onClick={() => handleRemovePlanItem(index)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent-red/10 active:bg-accent-red/20 transition-colors flex-shrink-0"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <X className="w-6 h-6 text-accent-red" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-glass rounded-xl p-8 text-center border border-white/[0.08]">
              <p className="text-warm-gray font-medium text-lg">
                What&apos;s the plan for tomorrow?
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
