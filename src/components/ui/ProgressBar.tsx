"use client";

import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  labels?: string[];
}

export default function ProgressBar({
  current,
  total,
  labels,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const currentLabel = labels && labels[current] ? labels[current] : null;

  return (
    <div className="w-full">
      {/* Label row */}
      {currentLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-field-sm font-body text-onyx">
            {currentLabel}
          </span>
          <span className="text-field-sm font-body font-semibold text-onyx">
            {percentage}%
          </span>
        </div>
      )}

      {/* Progress bar track */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="h-full bg-onyx rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="mt-2 text-xs text-warm-gray font-body">
        {current + 1} of {total}
      </div>
    </div>
  );
}
