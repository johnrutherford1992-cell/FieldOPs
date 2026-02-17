"use client";

import React from "react";

interface ActionConfig {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: ActionConfig;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="mb-4 flex items-center justify-center text-warm-gray">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-field-lg font-heading font-semibold text-onyx mb-2 text-center">
        {title}
      </h2>

      {/* Description */}
      <p className="text-field-sm text-warm-gray font-body text-center max-w-sm mb-6">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`
            px-6 py-3 rounded-button bg-accent-violet text-white text-field-base font-semibold
            font-body transition-all duration-200 active:scale-[0.98]
            hover:bg-accent-violet/80 cursor-pointer
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
