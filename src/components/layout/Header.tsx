"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  showLogo = false,
  backHref,
  rightAction,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-obsidian/90 backdrop-blur-md border-b border-white/[0.06]"
      style={{ height: "56px" }}
    >
      <div className="h-full flex items-center justify-between px-4 gap-3">
        {/* Left: Back arrow or empty space */}
        <div className="flex-shrink-0 w-10">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center w-10 h-10 text-onyx hover:bg-glass-light rounded-lg transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </Link>
          )}
        </div>

        {/* Center: Logo or Title + Subtitle */}
        <div className="flex-1 min-w-0 text-center">
          {showLogo ? (
            <div className="flex items-center justify-center h-[56px]">
              <Image
                src="/logos/blackstone-black.png"
                alt="Blackstone Construction"
                height={40}
                width={140}
                priority
                className="object-contain max-w-[140px]"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          ) : (
            <div>
              {title && (
                <div className="font-heading font-semibold text-field-base text-onyx truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="font-body text-xs text-warm-gray truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Action button or empty space */}
        <div className="flex-shrink-0 w-10 flex items-center justify-center">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
