"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto scrollbar-hide px-4 py-2">
      <div className="flex items-center gap-0 whitespace-nowrap min-w-min">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Item */}
              <button
                onClick={item.onClick}
                disabled={isLast && !item.onClick}
                className={`text-sm transition-colors px-1 ${
                  isLast
                    ? "font-semibold text-black cursor-default"
                    : "font-medium text-warm-gray hover:text-onyx active:scale-95 cursor-pointer"
                }`}
              >
                {item.label}
              </button>

              {/* Separator (not on last item) */}
              {!isLast && (
                <ChevronRight
                  size={16}
                  className="text-warm-gray flex-shrink-0 mx-1"
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
