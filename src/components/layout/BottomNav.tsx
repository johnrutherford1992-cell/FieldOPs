"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Home,
  ShieldCheck,
  ClipboardList,
  FileBarChart,
  Settings,
} from "lucide-react";

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export default function BottomNav() {
  const pathname = usePathname();

  const tabs: NavTab[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home size={24} />,
      path: "/",
    },
    {
      id: "jha",
      label: "JHA",
      icon: <ShieldCheck size={24} />,
      path: "/jha",
    },
    {
      id: "daily-log",
      label: "Daily Log",
      icon: <ClipboardList size={24} />,
      path: "/daily-log",
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileBarChart size={24} />,
      path: "/reports",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={24} />,
      path: "/settings",
    },
  ];

  const isActive = (tabPath: string): boolean => {
    if (tabPath === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(tabPath);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian-deep/95 backdrop-blur-md border-t border-white/[0.06] shadow-nav safe-bottom"
      style={{
        height: "calc(72px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex h-[72px] items-center justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const textColor = active ? "text-accent-violet" : "text-warm-gray";

          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${textColor}`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
