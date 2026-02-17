"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface BigButtonProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: "green" | "amber" | "red" | "gray";
  chevron?: boolean;
  variant?: "light" | "dark";
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

const getBadgeStyles = (color: string): string => {
  switch (color) {
    case "green":
      return "bg-accent-green text-white";
    case "amber":
      return "bg-accent-amber text-onyx";
    case "red":
      return "bg-accent-red text-white";
    case "gray":
    default:
      return "bg-glass-medium text-warm-gray";
  }
};

export default function BigButton({
  label,
  sublabel,
  icon,
  badge,
  badgeColor = "gray",
  chevron = true,
  variant = "light",
  onClick,
  selected = false,
  disabled = false,
}: BigButtonProps) {
  const isLight = variant === "light";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full min-h-[72px] rounded-card transition-all duration-200
        flex items-center gap-4 px-4 py-3
        ${isLight ? "bg-glass border border-white/[0.06]" : "bg-gradient-to-br from-accent-violet to-purple-700 text-white"}
        ${!disabled && !selected ? (isLight ? "hover:border-white/[0.12] hover:shadow-glass-glow" : "hover:bg-accent-violet/80") : ""}
        ${selected ? (isLight ? "border-accent-violet bg-glass-medium" : "bg-accent-violet/80") : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
        font-body
      `}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 text-left min-w-0">
        <div className="font-heading font-semibold text-field-base leading-tight">
          {label}
        </div>
        {sublabel && (
          <div
            className={`text-field-sm mt-1 leading-tight ${
              isLight ? "text-warm-gray" : "text-white/70"
            }`}
          >
            {sublabel}
          </div>
        )}
      </div>

      {/* Badge */}
      {badge && (
        <div
          className={`
            flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold
            ${getBadgeStyles(badgeColor)}
          `}
        >
          {badge}
        </div>
      )}

      {/* Chevron */}
      {chevron && (
        <div className="flex-shrink-0 flex items-center justify-center">
          <ChevronRight
            size={20}
            className={isLight ? "text-warm-gray" : "text-warm-gray"}
          />
        </div>
      )}
    </button>
  );
}
