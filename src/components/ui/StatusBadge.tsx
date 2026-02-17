"use client";

import React from "react";

interface StatusBadgeProps {
  label: string;
  color: "green" | "amber" | "red" | "gray";
}

const getStatusStyles = (color: string): string => {
  switch (color) {
    case "green":
      return "bg-accent-green text-white";
    case "amber":
      return "bg-accent-amber text-obsidian-deep";
    case "red":
      return "bg-accent-red text-white";
    case "gray":
    default:
      return "bg-glass-medium text-warm-gray";
  }
};

export default function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-block px-3 py-1 rounded-full text-xs font-semibold font-body
        ${getStatusStyles(color)}
      `}
    >
      {label}
    </span>
  );
}
